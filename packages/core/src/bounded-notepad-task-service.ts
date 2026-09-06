import { BrainPlannerResultSchema, LocalAppOpenArgumentsSchema, ToolDecisionSchema, ToolExecutionRequestSchema,
  ToolResultSchema, createId, type ToolDescriptor, type ToolPolicy, type ToolResult } from "@jarvis-k/contracts";
import { decideToolInvocation } from "@jarvis-k/capabilities";
import type { CoreBrainActionExecutorPort } from "./runtime";
import type { AssistantRuntimeOptions } from "./assistant-runtime";
import type { TaskRepository } from "./task-runtime";
import type { PlannerDraftService } from "./planner/planner-draft-service";
import type { PlannerApprovalService } from "./planner/planner-approval-service";

type ExecuteArguments = Parameters<NonNullable<AssistantRuntimeOptions["executeTool"]>>;
type Work = { controller: AbortController; timer: ReturnType<typeof setTimeout>;
  started: boolean; resolve: (verified: boolean) => void; done: Promise<boolean>;
  denied?: boolean; onStart?: () => void; };

// Coordination only: registry policy, persisted tasks, digest validation and approval
// remain owned by the existing services used by deterministic/planner commands.
export class BoundedNotepadTaskService {
  private creating = false;
  private readonly work = new Map<string, Work>();
  public constructor(private readonly options: {
    enabled: boolean; descriptor: ToolDescriptor; policy: ToolPolicy; repository?: TaskRepository;
    dispatch?: import("./task-dispatch-service").TaskDispatchService;
    drafts: PlannerDraftService; approvals: PlannerApprovalService;
    onExecute: () => void; executor?: CoreBrainActionExecutorPort; now: () => Date; progress: () => Promise<void>;
  }) {}
  public owns(taskId: string): boolean { return this.work.has(taskId); }
  private decide(requestId: string, confirmed: boolean) {
    return decideToolInvocation({ descriptor: this.options.descriptor, policy: this.options.policy,
      request: { requestId, toolId: "localApp.open", input: { app: "notepad" }, dryRun: false },
      confirmationGranted: confirmed, evaluatedAt: this.options.now().toISOString() });
  }
  public async create(source: "text" | "voice", signal?: AbortSignal): Promise<string> {
    if (this.creating) throw new Error("ACTION_ALREADY_PENDING");
    this.creating = true;
    try { return await this.createTask(source, signal); } finally { this.creating = false; }
  }
  private async createTask(source: "text" | "voice", signal?: AbortSignal): Promise<string> {
    if (!this.options.enabled || signal?.aborted || this.work.size > 0 || !this.options.repository || !this.options.executor) throw new Error("ACTION_UNAVAILABLE");
    const policy = this.decide(createId("tool-request"), false);
    if (policy.status !== "needs_confirmation") throw new Error("ACTION_POLICY_DENIED");
    const created = await this.options.drafts.createDraft({ source, intent: "localApp.open", deduplicate: false, title: "打开记事本",
      plannerResult: BrainPlannerResultSchema.parse({ providerId: "intent-router.deterministic.rules", status: "planned",
        reasonCode: "COMPLEX_REQUEST", failureClass: "none", directActionAttempted: false, plannedAt: this.options.now().toISOString(),
        plan: { summary: "请确认打开记事本。", risk: "medium", requiresConfirmation: true, directActionAttempted: false,
          steps: [{ id: "open-notepad", toolId: "localApp.open", title: "打开记事本", args: { app: "notepad" },
            risk: "medium", requiresConfirmation: true, directActionAttempted: false }] } }) });
    if (!created.ok) throw new Error("ACTION_TASK_UNAVAILABLE");
    const taskId = created.task.id;
    await this.options.repository.createEvent({ id: createId("task-event"), taskId, type: "state_changed",
      message: "Policy CONFIRMATION_REQUIRED; waiting for explicit task approval.", createdAt: this.options.now().toISOString() });
    let resolve: (verified: boolean) => void = () => undefined;
    const done = new Promise<boolean>(complete => { resolve = complete; });
    const controller = new AbortController();
    const timer = setTimeout(() => { void this.cancel(taskId); }, 120000);
    timer.unref();
    this.work.set(taskId, { controller, timer, started: false, resolve, done });
    const abort = () => { void this.cancel(taskId); };
    signal?.addEventListener("abort", abort, { once: true });
    void done.finally(() => signal?.removeEventListener("abort", abort));
    if (signal?.aborted) await this.cancel(taskId);
    if (!signal) await this.options.progress();
    return taskId;
  }
  public async cancel(taskId: string): Promise<void> {
    const work = this.work.get(taskId);
    if (!work || work.denied) return;
    work.controller.abort();
    clearTimeout(work.timer);
    if (!work.started) {
      await this.options.approvals.cancel({ taskId, reason: "Cancelled before the desktop action started." });
      this.work.delete(taskId);
      work.resolve(false);
      await this.options.progress();
    }
  }
  public async deny(taskId: string): Promise<boolean> {
    const work = this.work.get(taskId);
    if (work?.denied) return true;
    if (!work || work.started || work.denied || work.controller.signal.aborted) return false;
    // Consume before awaiting persistence, so an overlapping approval cannot launch.
    work.denied = true;
    clearTimeout(work.timer);
    try {
      const cancelled = await this.options.approvals.cancel({ taskId, reason: "User denied opening Notepad; no action was executed." });
      if (!cancelled.ok) throw new Error("ACTION_DENIAL_UNAVAILABLE");
    } catch (error) {
      work.controller.abort();
      throw error;
    } finally {
      this.work.delete(taskId);
      work.resolve(false);
    }
    await this.options.progress();
    return true;
  }
  public async approve(taskId: string, approvalCommandId: string) {
    const work = this.work.get(taskId);
    if (!work || work.started || work.denied || work.controller.signal.aborted) return { ok: false as const,
      code: "TASK_APPROVAL_NOT_ALLOWED", message: "This desktop action is no longer awaiting approval.", retryable: false };
    work.started = true;
    clearTimeout(work.timer);
    const result = await this.options.approvals.approve({ taskId, signal: work.controller.signal,
      onProgress: this.options.progress,
      executeStep: async (step, toolId) => {
        const allowed = toolId === "localApp.open" && LocalAppOpenArgumentsSchema.safeParse(step.toolInput).success &&
          this.decide(taskId, true).allowed && !work.controller.signal.aborted;
        if (!allowed || !this.options.executor) return { ok: false, verificationStatus: "verification_failed" as const,
          summary: "Desktop action was blocked before execution.", failureReason: "ACTION_BLOCKED" };
        await this.options.repository?.createEvent({ id: createId("task-event"), taskId, type: "state_changed",
          message: "Policy ALLOWED after explicit task approval.", createdAt: this.options.now().toISOString() });
        if (work.controller.signal.aborted) return { ok: false, verificationStatus: "verification_failed" as const,
          summary: "Desktop action was cancelled before execution.", failureReason: "CANCELLED" };
        work.onStart?.();
        this.options.onExecute();
        const execution = await this.options.executor.openLocalApp({ target: "notepad",
          desktopApproval: { taskId, approvalCommandId, signal: work.controller.signal } });
        const ok = execution.status === "completed" && execution.verificationStatus === "verified" && !work.controller.signal.aborted;
        return { ok, verificationStatus: ok ? "verified" as const : "verification_failed" as const,
          summary: ok ? "记事本启动已验证。" : "未能验证记事本启动。", ...(ok ? {} : { failureReason: "ACTION_NOT_VERIFIED" }) };
      } }).catch(async () => {
        const task = (await this.options.repository?.listTasks())?.find(item => item.id === taskId);
        if (task?.steps[0]) {
          try { await this.options.dispatch?.completeVerification({ taskId, stepId: task.steps[0].id,
            verificationStatus: "verification_failed", resultSummary: "Desktop action could not be verified.", failureReason: "ACTION_FAILURE" }); }
          catch { /* Persistence failure remains unverified; no success is reported. */ }
        }
        return { ok: false as const, code: "ACTION_FAILURE", message: "Desktop action could not be verified.", retryable: false };
      });
    this.work.delete(taskId);
    work.resolve(result.ok && result.failedStepCount === 0 && !work.controller.signal.aborted);
    return result;
  }
  public async execute(...[proposal, executionId, signal, publish]: ExecuteArguments): Promise<ToolResult> {
    LocalAppOpenArgumentsSchema.parse(proposal.arguments);
    const taskId = await this.create("text", signal);
    const work = this.work.get(taskId);
    if (!work || signal.aborted) throw new Error("CANCELLED");
    const approvalRequestId = createId("approval");
    const policy = this.decide(proposal.proposalId, false);
    publish({ type: "tool.decided", decision: ToolDecisionSchema.parse({ proposalId: proposal.proposalId, taskId,
      decision: "requires_approval", approvalRequestId, reasonCode: policy.reasonCode,
      policyVersion: policy.audit.policyVersion, decidedAt: this.options.now().toISOString() }) });
    work.onStart = () => {
      publish({ type: "approval.resolved", approval: { approvalRequestId, proposalId: proposal.proposalId,
        resolution: "approved", resolvedAt: this.options.now().toISOString(), reasonCode: "USER_APPROVED" } });
      publish({ type: "execution.started", request: ToolExecutionRequestSchema.parse({ taskId, executionId,
        proposalId: proposal.proposalId, turnId: proposal.turnId, toolId: "localApp.open", arguments: { app: "notepad" },
        owner: "desktop_host", timeoutMs: 5000, requestedAt: this.options.now().toISOString() }) });
    };
    await this.options.progress();
    const verified = await work.done;
    if (signal.aborted || work.controller.signal.aborted) throw new Error("CANCELLED");
    if (work.denied) {
      publish({ type: "approval.resolved", approval: { approvalRequestId, proposalId: proposal.proposalId,
        resolution: "denied", resolvedAt: this.options.now().toISOString(), reasonCode: "USER_DENIED" } });
      return ToolResultSchema.parse({ taskId, executionId, turnId: proposal.turnId, proposalId: proposal.proposalId,
        toolId: "localApp.open", resultedAt: this.options.now().toISOString(), status: "blocked", resultClass: "failure",
        failure: { reasonCode: "USER_DENIED", safeMessage: "The user declined. Notepad was not opened.", retryable: false } });
    }
    return ToolResultSchema.parse({ taskId, executionId, turnId: proposal.turnId, proposalId: proposal.proposalId,
      toolId: "localApp.open", resultedAt: this.options.now().toISOString(),
      ...(verified ? { status: "completed", resultClass: "structured", structuredResult: {
        app: "notepad", launched: true, verified: true, reason: "verified" } } : {
        status: "failed", resultClass: "failure", failure: { reasonCode: "ACTION_NOT_VERIFIED",
          safeMessage: "Notepad launch was not verified; do not claim it opened.", retryable: false } }) });
  }
}
