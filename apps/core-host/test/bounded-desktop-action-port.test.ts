import { describe, expect, it, vi } from "vitest";
import { DesktopActionRequestSchema } from "@jarvis-k/contracts";
import { BoundedDesktopActionPort } from "../src/bounded-desktop-action-port";

describe("private CoreHost/Desktop action transport", () => {
  it("accepts only the matching response and ignores late or malformed replies", async () => {
    const messages: object[] = [];
    const port = new BoundedDesktopActionPort(message => messages.push(message));
    const pending = port.open({ taskId: "task-test", approvalCommandId: "command-test", signal: new AbortController().signal });
    const request = DesktopActionRequestSchema.parse(messages[0]);
    expect(port.receive({ kind: "desktop-action.response", requestId: request.requestId, result: { app: "calculator" } })).toBe(false);
    const response = { kind: "desktop-action.response", requestId: request.requestId,
      result: { app: "notepad", launched: true, verified: true, reason: "verified" } };
    expect(port.receive({ ...response, requestId: "other-request" })).toBe(true);
    port.receive(response);
    expect(await pending).toEqual(response.result);
    port.receive(response);
    expect(messages).toHaveLength(1);
  });
  it("sends cancellation and discards a late success", async () => {
    const messages: object[] = []; const controller = new AbortController();
    const port = new BoundedDesktopActionPort(message => messages.push(message));
    const pending = port.open({ taskId: "task-test", approvalCommandId: "command-test", signal: controller.signal });
    const request = DesktopActionRequestSchema.parse(messages[0]); controller.abort();
    expect(await pending).toMatchObject({ verified: false, reason: "cancelled" });
    expect(messages[1]).toEqual({ kind: "desktop-action.cancel", requestId: request.requestId });
    port.receive({ kind: "desktop-action.response", requestId: request.requestId,
      result: { app: "notepad", launched: true, verified: true, reason: "verified" } });
  });
  it("times out with a cancellation request", async () => {
    vi.useFakeTimers();
    try {
      const messages: object[] = []; const port = new BoundedDesktopActionPort(message => messages.push(message));
      const pending = port.open({ taskId: "task-test", approvalCommandId: "command-test", signal: new AbortController().signal });
      await vi.advanceTimersByTimeAsync(5000);
      expect(await pending).toMatchObject({ reason: "timeout", verified: false });
      expect(messages[1]).toMatchObject({ kind: "desktop-action.cancel" });
    } finally { vi.useRealTimers(); }
  });
});
