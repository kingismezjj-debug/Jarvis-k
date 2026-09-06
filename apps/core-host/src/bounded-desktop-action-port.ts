import { createId, DesktopActionRequestSchema, DesktopActionResponseSchema,
  type LocalAppOpenResult } from "@jarvis-k/contracts";

export class BoundedDesktopActionPort {
  private readonly pending = new Map<string, (result: LocalAppOpenResult) => void>();
  public constructor(private readonly send: (message: object) => void) {}
  public receive(message: unknown): boolean {
    const parsed = DesktopActionResponseSchema.safeParse(message);
    if (!parsed.success) return false;
    this.pending.get(parsed.data.requestId)?.(parsed.data.result);
    return true;
  }
  public async open(input: { taskId: string; approvalCommandId: string; signal: AbortSignal }): Promise<LocalAppOpenResult> {
    const requestId = createId("desktop-action");
    const result = (reason: "cancelled" | "timeout" | "blocked"): LocalAppOpenResult =>
      ({ app: "notepad", launched: false, verified: false, reason });
    if (input.signal.aborted || this.pending.size > 0) return result(input.signal.aborted ? "cancelled" : "blocked");
    return new Promise(resolve => {
      const finish = (value: LocalAppOpenResult) => {
        if (!this.pending.delete(requestId)) return;
        clearTimeout(timer);
        input.signal.removeEventListener("abort", abort);
        resolve(value);
      };
      const cancel = () => { try { this.send({ kind: "desktop-action.cancel", requestId }); } catch { /* disconnected */ } };
      const abort = () => { cancel(); finish(result("cancelled")); };
      const timer = setTimeout(() => { cancel(); finish(result("timeout")); }, 5000);
      this.pending.set(requestId, finish);
      input.signal.addEventListener("abort", abort, { once: true });
      if (input.signal.aborted) { abort(); return; }
      try { this.send(DesktopActionRequestSchema.parse({ kind: "desktop-action.request", requestId,
        taskId: input.taskId, approvalCommandId: input.approvalCommandId, arguments: { app: "notepad" } })); }
      catch { finish(result("blocked")); }
    });
  }
}
