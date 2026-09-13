import { FilesystemScopeRequestSchema, FilesystemScopeResponseSchema,
  type FilesystemScopeRequest, type FilesystemScopeResponse } from "@jarvis-k/contracts";
export class FilesystemScopePort {
  private pending: { request: FilesystemScopeRequest; finish: (response: FilesystemScopeResponse) => void } | undefined;
  public constructor(private readonly send: (message: object) => void) {}
  public receive(message: unknown): boolean {
    const parsed = FilesystemScopeResponseSchema.safeParse(message);
    if (!parsed.success) return false;
    if (this.pending && JSON.stringify(parsed.data.context) === JSON.stringify(this.pending.request.context)) this.pending.finish(parsed.data);
    return true;
  }
  public select(request: FilesystemScopeRequest): Promise<FilesystemScopeResponse> {
    request = FilesystemScopeRequestSchema.parse(request);
    const failure = (reason: "internal_unavailable" | "scope_expired"): FilesystemScopeResponse =>
      ({ kind: "filesystem-scope.response", context: request.context, resolution: reason === "scope_expired" ? "timed_out" : "denied", reason });
    if (this.pending) return Promise.resolve(failure("internal_unavailable"));
    return new Promise(resolve => {
      const finish = (response: FilesystemScopeResponse) => { clearTimeout(timer); this.pending = undefined; resolve(response); };
      const timer = setTimeout(() => {
        try { this.send({ kind: "filesystem-scope.cancel", context: request.context }); } catch { /* disconnected */ }
        finish(failure("scope_expired"));
      }, 121000);
      this.pending = { request, finish };
      try { this.send(request); } catch { finish(failure("internal_unavailable")); }
    });
  }
}
