import { describe, expect, it } from "vitest";
import {
  EventEnvelope,
  createCommandEnvelope
} from "@jarvis-k/contracts";
import { CoreRuntime } from "../src/runtime";

describe("CoreRuntime", () => {
  it("accepts a typed message command and publishes a recoverable snapshot", () => {
    const events: EventEnvelope[] = [];
    const runtime = new CoreRuntime((event) => events.push(event));

    const result = runtime.handle(
      createCommandEnvelope({
        type: "agent.sendMessage",
        payload: {
          conversationId: "primary",
          text: "Run phase one"
        }
      })
    );

    expect(result.ok).toBe(true);
    expect(runtime.getSnapshot().messages).toHaveLength(1);
    expect(
      events.some((event) => event.event.type === "state.snapshot")
    ).toBe(true);
  });

  it("enforces voice state transitions", () => {
    const runtime = new CoreRuntime(() => undefined);

    const invalidStart = runtime.handle(
      createCommandEnvelope({
        type: "voice.startPtt",
        payload: {}
      })
    );
    expect(invalidStart.ok).toBe(false);

    runtime.handle(
      createCommandEnvelope({
        type: "voice.setMode",
        payload: { mode: "ptt" }
      })
    );
    const start = runtime.handle(
      createCommandEnvelope({
        type: "voice.startPtt",
        payload: {}
      })
    );
    expect(start.ok).toBe(true);
    expect(runtime.getSnapshot().voice.state).toBe("recording");
  });
});
