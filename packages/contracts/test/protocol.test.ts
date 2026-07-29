import { describe, expect, it } from "vitest";
import {
  CommandEnvelopeSchema,
  CoreSnapshotSchema,
  PROTOCOL_VERSION,
  createCommandEnvelope
} from "../src";

describe("protocol contracts", () => {
  it("creates a valid command envelope", () => {
    const envelope = createCommandEnvelope({
      type: "agent.sendMessage",
      payload: {
        conversationId: "primary",
        text: "Status check"
      }
    });

    expect(CommandEnvelopeSchema.parse(envelope).protocolVersion).toBe(
      PROTOCOL_VERSION
    );
  });

  it("rejects an unsupported protocol version", () => {
    const envelope = createCommandEnvelope({
      type: "agent.getSnapshot",
      payload: {}
    });

    expect(() =>
      CommandEnvelopeSchema.parse({
        ...envelope,
        protocolVersion: 2
      })
    ).toThrow();
  });

  it("rejects invalid task states in snapshots", () => {
    expect(() =>
      CoreSnapshotSchema.parse({
        protocolVersion: PROTOCOL_VERSION,
        coreInstanceId: "core-test",
        sequenceId: 0,
        health: "ready",
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        voice: {
          state: "idle",
          mode: "disabled"
        },
        messages: [],
        tasks: [
          {
            id: "task-1",
            title: "Invalid task",
            state: "unknown",
            updatedAt: new Date().toISOString()
          }
        ]
      })
    ).toThrow();
  });
});
