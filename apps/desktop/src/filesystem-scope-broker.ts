import { randomBytes, randomUUID } from "node:crypto";
import { FilesystemSearchArgumentsSchema, FilesystemScopeRequestSchema, FilesystemScopeCancelSchema,
  FilesystemScopeResponseSchema, filesystemScopeDisclosure,
  type FilesystemScopeRequest, type FilesystemScopeResponse, type CommandEnvelope, type Task } from "@jarvis-k/contracts";

type Picker = (query: string) => Promise<string | undefined>;
// Only Main owns this selection. It is NOT a canonical filesystem identity or an execution grant.
// UI-3M-2B must validate the selected object before adding an execution consumer.
async function chooseDirectory(query: string): Promise<string | undefined> {
  const { dialog, BrowserWindow } = await import("electron");
  const owner = BrowserWindow.getFocusedWindow();
  if (!owner || owner.isDestroyed()) return undefined;
  const result = await dialog.showOpenDialog(owner, {
    title: filesystemScopeDisclosure(query), buttonLabel: "允许本次搜索",
    properties: ["openDirectory", "dontAddToRecent"],
  });
  return !result.canceled && result.filePaths.length === 1 ? result.filePaths[0] : undefined;
}

export class FilesystemScopeBroker {
  private epoch = randomUUID();
  private pickerOpen = false;
  private tasks: Task[] = [];
  private readonly consumedCommands = new Set<string>();
  private gate: { commandId: string; taskId: string; expires: number } | undefined;
  private active: { request: FilesystemScopeRequest; epoch: string; invalid: boolean } | undefined;
  private grant: { scopeToken: string; selectedPath: string; binding: string; expires: number } | undefined;
  public constructor(private readonly picker: Picker = chooseDirectory, private readonly now = Date.now) {}
  public ownsTask(taskId: string): boolean {
    return this.tasks.some(task => task.id === taskId && task.steps.length === 1 && task.steps[0]?.toolId === "filesystem.search");
  }
  public observeTasks(tasks: Task[]): void {
    this.tasks = tasks;
    if (this.active) {
      const task = tasks.find(item => item.id === this.active?.request.context.taskId);
      const args = FilesystemSearchArgumentsSchema.safeParse(task?.steps[0]?.toolInput);
      if (task?.state !== "awaiting_confirmation" || task.steps.length !== 1 ||
        task.steps[0]?.toolId !== "filesystem.search" || !args.success ||
        JSON.stringify(args.data) !== JSON.stringify(this.active.request.arguments)) {
        this.active.invalid = true; this.grant = undefined;
      }
    }
  }
  public observeCommand(envelope: CommandEnvelope): void {
    const command = envelope.command;
    if (command.type === "agent.approveTask") {
      const task = this.tasks.find(item => item.id === command.payload.taskId);
      if (!this.active && !this.pickerOpen && !this.consumedCommands.has(envelope.commandId) && this.consumedCommands.size < 1024 && task?.state === "awaiting_confirmation" && task.steps.length === 1 &&
        task.steps[0]?.toolId === "filesystem.search" && FilesystemSearchArgumentsSchema.safeParse(task.steps[0].toolInput).success) {
        this.gate = { commandId: envelope.commandId, taskId: task.id, expires: this.now() + 5000 };
      }
    }
    if (command.type === "agent.cancelTask" && command.payload.taskId === this.active?.request.context.taskId ||
      command.type === "agent.cancelAssistantTurn" && command.payload.turnId === this.active?.request.context.turnId) {
      if (this.active) this.active.invalid = true;
      this.grant = undefined; this.gate = undefined;
    }
    if (command.type === "agent.cancelTask" && command.payload.taskId === this.gate?.taskId) this.gate = undefined;
  }
  public async handle(message: unknown, reply: (response: FilesystemScopeResponse) => void): Promise<boolean> {
    const cancel = FilesystemScopeCancelSchema.safeParse(message);
    if (cancel.success) {
      if (this.active && JSON.stringify(cancel.data.context) === JSON.stringify(this.active.request.context)) {
        this.active.invalid = true; this.grant = undefined;
      }
      return true;
    }
    const parsed = FilesystemScopeRequestSchema.safeParse(message);
    if (!parsed.success) return false;
    const request = parsed.data;
    const respond = (resolution: FilesystemScopeResponse["resolution"], reason: FilesystemScopeResponse["reason"]) =>
      reply(FilesystemScopeResponseSchema.parse({ kind: "filesystem-scope.response", context: request.context, resolution, reason }));
    const gate = this.gate; this.gate = undefined;
    const task = this.tasks.find(item => item.id === request.context.taskId);
    const args = FilesystemSearchArgumentsSchema.safeParse(task?.steps[0]?.toolInput);
    const identityMatches = request.context.turnId === `turn-${request.context.taskId}` &&
      request.context.proposalId === `tprop-${request.context.taskId}` &&
      request.context.executionId === `texec-${request.context.approvalCommandId}`;
    if (this.active || this.pickerOpen || !gate || gate.expires <= this.now() || gate.commandId !== request.context.approvalCommandId ||
      gate.taskId !== request.context.taskId || task?.state !== "awaiting_confirmation" || task.steps.length !== 1 ||
      task.steps[0]?.toolId !== "filesystem.search" || !args.success || JSON.stringify(args.data) !== JSON.stringify(request.arguments) ||
      !identityMatches) {
      respond("denied", "scope_mismatch"); return true;
    }
    this.consumedCommands.add(request.context.approvalCommandId);
    const active = { request, epoch: this.epoch, invalid: false };
    this.active = active;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      this.pickerOpen = true;
      const selection = this.picker(request.arguments.query).then(path => ({ path }))
        .finally(() => { this.pickerOpen = false; });
      const selected = await Promise.race([
        selection,
        new Promise<{ path?: string; expired: true }>(resolve => { timer = setTimeout(() => resolve({ expired: true }), 120000); }),
      ]);
      if (active.invalid || active.epoch !== this.epoch) { respond("denied", "cancelled"); return true; }
      if ("expired" in selected) { respond("timed_out", "scope_expired"); return true; }
      if (!selected.path) { respond("denied", "user_denied"); return true; }
      // No stat, realpath, readdir, native traversal or executor is reachable here.
      const binding = JSON.stringify({ epoch: this.epoch, ...request.context, arguments: request.arguments });
      this.grant = { scopeToken: randomBytes(32).toString("base64url"), selectedPath: selected.path,
        binding, expires: this.now() + 60000 };
      if (!this.consume(this.grant.scopeToken, binding)) { respond("denied", "scope_expired"); return true; }
      respond("approved", "filesystem_search_unavailable");
    } catch { this.pickerOpen = false; respond("denied", "internal_unavailable"); }
    finally { if (timer) clearTimeout(timer); if (this.active === active) this.active = undefined; this.grant = undefined; }
    return true;
  }
  // Main-private, one-shot selection receipt. No execution API is exported in 2A.
  private consume(scopeToken: string, binding: string): boolean {
    const grant = this.grant; this.grant = undefined;
    return !!grant && grant.scopeToken === scopeToken && grant.binding === binding && grant.expires > this.now();
  }
  public reset(): void {
    if (this.active) this.active.invalid = true;
    this.epoch = randomUUID(); this.consumedCommands.clear(); this.gate = undefined; this.grant = undefined; this.tasks = [];
    // Keep an outstanding native modal owned until it settles; late callbacks cannot authorize.
  }
}
