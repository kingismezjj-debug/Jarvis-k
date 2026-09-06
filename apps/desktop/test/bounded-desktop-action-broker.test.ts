import { describe, expect, it, vi } from "vitest";
import { createCommandEnvelope, TaskSchema, DesktopActionRequestSchema } from "@jarvis-k/contracts";
import { BoundedDesktopActionBroker } from "../src/bounded-desktop-action-broker";
import { notepadResult } from "../src/bounded-notepad-action";

const task = TaskSchema.parse({ id: "task-notepad", title: "打开记事本", state: "awaiting_confirmation",
  createdAt: "2026-09-06T00:00:00.000Z", updatedAt: "2026-09-06T00:00:00.000Z", steps: [{ id: "step-notepad",
    taskId: "task-notepad", title: "打开记事本", state: "pending", verificationStatus: "not_applicable",
    toolId: "localApp.open", toolInput: { app: "notepad" } }] });
function harness(enabled = true) {
  const launch = vi.fn(async (_signal: AbortSignal) => notepadResult("verified", true));
  const broker = new BoundedDesktopActionBroker(enabled, launch);
  broker.observeTasks([task]);
  const approval = createCommandEnvelope({ type: "agent.approveTask", payload: { taskId: task.id, confirmation: "explicit_ui_confirmation" } });
  const request = { kind: "desktop-action.request", requestId: "desktop-test", taskId: task.id,
    approvalCommandId: approval.commandId, arguments: { app: "notepad" } };
  const replies: unknown[] = [];
  return { broker, launch, approval, request, replies, send: () => broker.handle(request, reply => replies.push(reply)) };
}
describe("Desktop fixed Notepad authority boundary", () => {
  it("requires an observed pending task and matching explicit UI approval, consumed once", async () => {
    const h = harness(); await h.send(); expect(h.launch).not.toHaveBeenCalled();
    h.broker.observeCommand(h.approval); await h.send(); expect(h.launch).toHaveBeenCalledTimes(1);
    await h.send(); expect(h.launch).toHaveBeenCalledTimes(1);
  });
  it.each(["disabled", "wrong_task", "stale_approval", "wrong_step"])("rejects %s authority", async mode => {
    const h = harness(mode !== "disabled");
    if (mode === "wrong_step") h.broker.observeTasks([{ ...task, steps: [{ ...task.steps[0]!, toolInput: { app: "calculator" } }] }]);
    h.broker.observeCommand(h.approval);
    if (mode === "wrong_task") h.request.taskId = "task-other";
    if (mode === "stale_approval") h.broker.reset();
    await h.send(); expect(h.launch).not.toHaveBeenCalled();
  });
  it("cancels queued work before the spawn port and invalidates approval", async () => {
    const h = harness(); h.broker.observeCommand(h.approval); const pending = h.send();
    h.broker.observeCommand(createCommandEnvelope({ type: "agent.cancelTask", payload: { taskId: task.id } }));
    await pending; expect(h.launch).not.toHaveBeenCalled();
    expect(h.replies).toContainEqual(expect.objectContaining({ result: expect.objectContaining({ reason: "cancelled" }) }));
  });
  it("reset aborts active work without reusing a grant", async () => {
    const h = harness(); h.broker.observeCommand(h.approval); const pending = h.send(); h.broker.reset();
    await pending; await h.send(); expect(h.launch).not.toHaveBeenCalled();
  });
  it("does not cancel an unrelated task for a stale assistant turn", async () => {
    const h = harness(); h.broker.observeCommand(h.approval); const pending = h.send();
    h.broker.observeCommand(createCommandEnvelope({ type: "agent.cancelAssistantTurn", payload: { turnId: "turn-unrelated" } }));
    await pending; expect(h.launch).toHaveBeenCalledTimes(1);
  });
  it.each([{ app: "calculator" }, { app: "notepad", args: [] }, { app: "notepad", path: "fake" }, {}, []])(
    "strictly rejects expanded parameters %j", args => {
      const h = harness(); expect(DesktopActionRequestSchema.safeParse({ ...h.request, arguments: args }).success).toBe(false);
    });
});
