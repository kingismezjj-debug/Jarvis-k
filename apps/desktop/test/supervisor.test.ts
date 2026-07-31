import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  EventEnvelope,
  createCommandEnvelope
} from "@jarvis-k/contracts";
import { CoreSupervisor } from "../src/supervisor";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const coreEntry = path.resolve(
  testDirectory,
  "..",
  "..",
  "core-host",
  "dist",
  "index.js"
);

function waitForEvent(
  supervisor: CoreSupervisor,
  predicate: (event: EventEnvelope) => boolean
): Promise<EventEnvelope> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error("Timed out waiting for supervisor event."));
    }, 5_000);
    const unsubscribe = supervisor.onEvent((event) => {
      if (!predicate(event)) {
        return;
      }
      clearTimeout(timer);
      unsubscribe();
      resolve(event);
    });
  });
}

describe("CoreSupervisor", () => {
  it("routes commands and restores service after a controlled restart", async () => {
    const supervisor = new CoreSupervisor({
      coreEntry,
      requestTimeoutMs: 2_000,
      healthIntervalMs: 0,
      restartBaseDelayMs: 25
    });

    const firstOnline = waitForEvent(
      supervisor,
      (event) =>
        event.event.type === "system.core.lifecycle" &&
        event.event.payload.status === "online"
    );
    supervisor.start();
    const firstOnlineEvent = await firstOnline;
    const firstPid =
      firstOnlineEvent.event.type === "system.core.lifecycle"
        ? firstOnlineEvent.event.payload.processId
        : undefined;

    const messageResult = await supervisor.request(
      createCommandEnvelope({
        type: "agent.sendMessage",
        payload: {
          conversationId: "primary",
          text: "Supervisor integration"
        }
      })
    );
    expect(messageResult.ok).toBe(true);

    const secondOnline = waitForEvent(
      supervisor,
      (event) =>
        event.event.type === "system.core.lifecycle" &&
        event.event.payload.status === "online" &&
        event.event.payload.processId !== firstPid
    );
    supervisor.restart("integration-test");
    const secondOnlineEvent = await secondOnline;
    expect(
      secondOnlineEvent.event.type === "system.core.lifecycle"
        ? secondOnlineEvent.event.payload.processId
        : undefined
    ).not.toBe(firstPid);

    const snapshotResult = await supervisor.request(
      createCommandEnvelope({
        type: "agent.getSnapshot",
        payload: {}
      })
    );
    expect(snapshotResult.ok).toBe(true);
    supervisor.stop();
  });
});
