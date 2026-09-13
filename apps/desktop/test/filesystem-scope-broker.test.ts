import { describe, expect, it, vi } from "vitest";
import { createCommandEnvelope, filesystemScopeContext, TaskSchema } from "@jarvis-k/contracts";
import { FilesystemScopeBroker } from "../src/filesystem-scope-broker";
const task = TaskSchema.parse({ id: "task-search", title: "范围授权", state: "awaiting_confirmation",
  createdAt: "2026-09-13T00:00:00.000Z", updatedAt: "2026-09-13T00:00:00.000Z", steps: [{ id: "step-search",
    taskId: "task-search", title: "范围授权", state: "pending", verificationStatus: "not_applicable",
    toolId: "filesystem.search", toolInput: { query: "合同", maxResults: 20 } }] });
function setup(picker = vi.fn(async () => "Z:\\nonexistent-fixture\\private")) {
  let clock = 1000;
  const broker = new FilesystemScopeBroker(picker, () => clock);
  broker.observeTasks([task]);
  const approval = createCommandEnvelope({ type: "agent.approveTask", payload: { taskId: task.id, confirmation: "explicit_ui_confirmation" } });
  const request = { kind: "filesystem-scope.request", context: filesystemScopeContext(task.id, approval.commandId), arguments: { query: "合同", maxResults: 20 } };
  const reply = vi.fn();
  return { broker, picker, approval, request, reply, advance: () => { clock += 60001; },
    send: () => broker.handle(request, reply) };
}
describe("Main-only scope authorization without traversal", () => {
  it("requires an observed approval, returns only safe resolution and consumes once", async () => {
    const h = setup(); await h.send(); expect(h.picker).not.toHaveBeenCalled();
    h.broker.observeCommand(h.approval); await h.send();
    expect(h.reply).toHaveBeenLastCalledWith(expect.objectContaining({ resolution: "approved", reason: "filesystem_search_unavailable" }));
    expect(JSON.stringify(h.reply.mock.calls)).not.toMatch(/scopeToken|private|Z:|selectedPath/);
    h.broker.observeCommand(h.approval); await h.send(); expect(h.picker).toHaveBeenCalledTimes(1);
  });
  it.each(["turnId", "proposalId", "executionId", "taskId", "approvalCommandId"] as const)("rejects crossed %s", async field => {
    const h = setup(); h.broker.observeCommand(h.approval); h.request.context[field] = "wrong";
    await h.send(); expect(h.picker).not.toHaveBeenCalled();
  });
  it("rejects forged credentials in transport and expired commands", async () => {
    const h = setup(); h.broker.observeCommand(h.approval);
    expect(await h.broker.handle({ ...h.request, scopeToken: "forged" }, h.reply)).toBe(false);
    h.advance(); await h.send(); expect(h.picker).not.toHaveBeenCalled();
  });
  it("rejects maximum-length forged context without throwing", async () => {
    const h = setup(); h.request.context.taskId = "a".repeat(128);
    await expect(h.send()).resolves.toBe(true); expect(h.picker).not.toHaveBeenCalled();
  });
  it("maps picker cancellation to denied", async () => {
    const h = setup(vi.fn(async () => undefined)); h.broker.observeCommand(h.approval); await h.send();
    expect(h.reply).toHaveBeenLastCalledWith(expect.objectContaining({ resolution: "denied", reason: "user_denied" }));
  });
  it.each(["cancel", "restart", "changed_task", "changed_query"])("rejects late picker callback after %s", async mode => {
    let settle!: (path: string) => void;
    const h = setup(vi.fn(() => new Promise<string>(resolve => { settle = resolve; })));
    h.broker.observeCommand(h.approval); const pending = h.send();
    if (mode === "cancel") h.broker.observeCommand(createCommandEnvelope({ type: "agent.cancelTask", payload: { taskId: task.id } }));
    if (mode === "restart") h.broker.reset();
    if (mode === "changed_task") h.broker.observeTasks([{ ...task, state: "cancelled" }]);
    if (mode === "changed_query") h.broker.observeTasks([{ ...task, steps: [{ ...task.steps[0]!, toolInput: { query: "other", maxResults: 20 } }] }]);
    settle("Z:\\nonexistent-fixture"); await pending;
    expect(h.reply).toHaveBeenLastCalledWith(expect.objectContaining({ resolution: "denied", reason: "cancelled" }));
  });
  it("expires the picker without approving a late selection", async () => {
    vi.useFakeTimers();
    try {
      let settle!: (path: string) => void;
      const h = setup(vi.fn(() => new Promise<string>(resolve => { settle = resolve; })));
      h.broker.observeCommand(h.approval); const pending = h.send();
      await vi.advanceTimersByTimeAsync(120001); await pending; settle("Z:\\nonexistent-fixture"); await Promise.resolve();
      expect(h.reply).toHaveBeenCalledTimes(1);
      expect(h.reply).toHaveBeenLastCalledWith(expect.objectContaining({ resolution: "timed_out" }));
    } finally { vi.useRealTimers(); }
  });
  it("keeps one-shot capability consumption private and fail closed", () => {
    const h = setup();
    // White-box test only: no exported helper or renderer/IPC credential API.
    const internal = h.broker as unknown as { grant: unknown; consume: (value: string, binding: string) => boolean };
    const grant = { scopeToken: "fixture", selectedPath: "nonexistent", binding: "bound", expires: 2000 };
    internal.grant = grant; expect(internal.consume("forged", "bound")).toBe(false);
    expect(internal.consume("fixture", "bound")).toBe(false);
    internal.grant = grant; expect(internal.consume("fixture", "cross-turn")).toBe(false);
    internal.grant = grant; expect(internal.consume("fixture", "bound")).toBe(true);
    expect(internal.consume("fixture", "bound")).toBe(false);
    internal.grant = grant; h.advance(); expect(internal.consume("fixture", "bound")).toBe(false);
  });
});
