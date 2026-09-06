import { DesktopActionRequestSchema, DesktopActionCancelSchema, LocalAppOpenArgumentsSchema,
  type CommandEnvelope, type Task, type AssistantTurnProjection } from "@jarvis-k/contracts";
import { launchBoundedNotepad, notepadResult, type NotepadLauncher } from "./bounded-notepad-action";

export class BoundedDesktopActionBroker {
  private tasks: Task[] = [];
  private assistantTask: { turnId: string; taskId: string } | undefined;
  private readonly grants = new Map<string, { taskId: string; expires: number }>();
  private readonly active = new Map<string, { taskId: string; controller: AbortController }>();
  private readonly seen = new Set<string>();
  public constructor(private readonly enabled: boolean, private readonly launch: NotepadLauncher = launchBoundedNotepad) {}
  public observeTasks(tasks: Task[], turn?: AssistantTurnProjection): void {
    this.tasks = tasks;
    const taskId = turn?.proposals.find(proposal => proposal.toolId === "localApp.open")?.taskId;
    this.assistantTask = turn && taskId ? { turnId: turn.turnId, taskId } : undefined;
  }
  public observeCommand(envelope: CommandEnvelope): void {
    for (const [id, grant] of this.grants) if (grant.expires < Date.now()) this.grants.delete(id);
    if (envelope.command.type === "agent.approveTask" && this.grants.size < 64) {
      const taskId = envelope.command.payload.taskId;
      const task = this.tasks.find(item => item.id === taskId);
      if (task?.state === "awaiting_confirmation" && task.steps.length === 1 &&
        task.steps[0]?.toolId === "localApp.open" && LocalAppOpenArgumentsSchema.safeParse(task.steps[0].toolInput).success) {
        this.grants.set(envelope.commandId, { taskId: task.id, expires: Date.now() + 5000 });
      }
    }
    if (envelope.command.type === "agent.cancelTask") {
      for (const [id, grant] of this.grants) if (grant.taskId === envelope.command.payload.taskId) this.grants.delete(id);
      for (const work of this.active.values()) if (work.taskId === envelope.command.payload.taskId) work.controller.abort();
    }
    if (envelope.command.type === "agent.cancelAssistantTurn" && this.assistantTask?.turnId === envelope.command.payload.turnId) {
      const taskId = this.assistantTask.taskId;
      for (const [id, grant] of this.grants) if (grant.taskId === taskId) this.grants.delete(id);
      for (const work of this.active.values()) if (work.taskId === taskId) work.controller.abort();
    }
  }
  public async handle(message: unknown, reply: (message: unknown) => void): Promise<boolean> {
    const cancel = DesktopActionCancelSchema.safeParse(message);
    if (cancel.success) { this.active.get(cancel.data.requestId)?.controller.abort(); return true; }
    const parsed = DesktopActionRequestSchema.safeParse(message);
    if (!parsed.success) return false;
    const request = parsed.data;
    const grant = this.grants.get(request.approvalCommandId);
    this.grants.delete(request.approvalCommandId);
    if (!this.enabled || this.seen.has(request.requestId) || this.seen.size >= 1024 ||
      !grant || grant.taskId !== request.taskId || grant.expires < Date.now() || this.active.size !== 0) {
      reply({ kind: "desktop-action.response", requestId: request.requestId, result: notepadResult("blocked") });
      return true;
    }
    this.seen.add(request.requestId);
    const controller = new AbortController();
    this.active.set(request.requestId, { taskId: request.taskId, controller });
    try {
      await new Promise<void>(resolve => setImmediate(resolve));
      const result = controller.signal.aborted ? notepadResult("cancelled") : await this.launch(controller.signal);
      reply({ kind: "desktop-action.response", requestId: request.requestId, result });
    } catch {
      reply({ kind: "desktop-action.response", requestId: request.requestId, result: notepadResult("launch_failed") });
    } finally { this.active.delete(request.requestId); }
    return true;
  }
  public reset(): void {
    this.grants.clear();
    this.tasks = [];
    this.assistantTask = undefined;
    for (const work of this.active.values()) work.controller.abort();
    this.active.clear();
    this.seen.clear();
  }
}
