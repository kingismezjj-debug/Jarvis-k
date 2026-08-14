import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
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
  it("uses the bounded long timeout for Brain commands that can run real tasks", async () => {
    vi.useFakeTimers();
    try {
      const supervisor = new CoreSupervisor({
        coreEntry,
        requestTimeoutMs: 10,
        brainCommandRequestTimeoutMs: 50,
        healthIntervalMs: 0
      });
      const fakeChild = {
        connected: true,
        send: (
          _message: unknown,
          _callback?: (error?: Error | null) => void
        ) => {
          // Keep the request pending until the supervisor's timeout resolves it.
        }
      };
      (
        supervisor as unknown as {
          child: typeof fakeChild;
        }
      ).child = fakeChild;

      const resultPromise = supervisor.request(
        createCommandEnvelope({
          type: "agent.runBrainCommand",
          payload: {
            source: "voice",
            text: "Open VS. Code."
          }
        })
      );

      await vi.advanceTimersByTimeAsync(50);
      const result = await resultPromise;

      expect(result).toMatchObject({
        ok: false,
        error: {
          code: "CORE_REQUEST_TIMEOUT",
          message: "Agent Core did not respond within 50 ms."
        }
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("skips health pings while a Brain command is in flight", async () => {
    vi.useFakeTimers();
    try {
      const supervisor = new CoreSupervisor({
        coreEntry,
        requestTimeoutMs: 10,
        brainCommandRequestTimeoutMs: 1_000,
        healthIntervalMs: 20
      });
      const sentCommandTypes: string[] = [];
      const fakeChild = {
        connected: true,
        stdout: { destroy: vi.fn() },
        stderr: { destroy: vi.fn() },
        once: vi.fn(),
        disconnect: vi.fn(),
        kill: vi.fn(),
        unref: vi.fn(),
        send: (
          message: unknown,
          _callback?: (error?: Error | null) => void
        ) => {
          const commandType =
            typeof message === "object" &&
            message !== null &&
            "kind" in message &&
            message.kind === "command" &&
            "envelope" in message &&
            typeof message.envelope === "object" &&
            message.envelope !== null &&
            "command" in message.envelope &&
            typeof message.envelope.command === "object" &&
            message.envelope.command !== null &&
            "type" in message.envelope.command
              ? String(message.envelope.command.type)
              : "unknown";
          sentCommandTypes.push(commandType);
        }
      };
      (
        supervisor as unknown as {
          child: typeof fakeChild;
          startHealthMonitor: () => void;
        }
      ).child = fakeChild;
      (
        supervisor as unknown as {
          startHealthMonitor: () => void;
        }
      ).startHealthMonitor();

      void supervisor.request(
        createCommandEnvelope({
          type: "agent.runBrainCommand",
          payload: {
            source: "voice",
            text: "Open VS. Code."
          }
        })
      );

      await vi.advanceTimersByTimeAsync(40);

      expect(sentCommandTypes).toEqual(["agent.runBrainCommand"]);
      supervisor.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it("sanitizes child-process send errors", async () => {
    const supervisor = new CoreSupervisor({
      coreEntry,
      requestTimeoutMs: 2_000,
      healthIntervalMs: 0
    });
    const fakeChild = {
      connected: true,
      send: (
        _message: unknown,
        callback: (error?: Error | null) => void
      ) => {
        callback(
          new Error(
            "EPIPE: C:\\Users\\Administrator\\private-token-cache\\request"
          )
        );
      }
    };
    (supervisor as unknown as { child: typeof fakeChild }).child = fakeChild;

    const result = await supervisor.request(
      createCommandEnvelope({
        type: "agent.ping",
        payload: {
          sentAt: "2026-08-02T00:00:00.000Z"
        }
      })
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "CORE_SEND_FAILED",
        message: "Core could not accept the request."
      }
    });
    expect(JSON.stringify(result)).not.toContain("private-token-cache");
  });

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

  it("sends provider-backed Chat Answer configuration through the supervisor channel", async () => {
    const supervisor = new CoreSupervisor({
      coreEntry,
      healthIntervalMs: 0,
      loadChatAnswerProviderConfiguration: async () => ({
        provider: "chat-answer.openai-compatible.deepseek",
        credentials: {
          apiKey: "test-deepseek-provider-key"
        }
      })
    });
    const sent: unknown[] = [];
    const fakeChild = {
      connected: true,
      send: (
        message: unknown,
        callback?: (error?: Error | null) => void
      ) => {
        sent.push(message);
        callback?.(null);
      }
    };

    (
      supervisor as unknown as {
        child: typeof fakeChild;
        configureChatAnswerProvider: (
          child: typeof fakeChild
        ) => Promise<void>;
      }
    ).child = fakeChild;

    await (
      supervisor as unknown as {
        configureChatAnswerProvider: (
          child: typeof fakeChild
        ) => Promise<void>;
      }
    ).configureChatAnswerProvider(fakeChild);

    expect(sent).toEqual([
      {
        kind: "chat-answer-provider.configure",
        configuration: {
          provider: "chat-answer.openai-compatible.deepseek",
          credentials: {
            apiKey: "test-deepseek-provider-key"
          }
        }
      }
    ]);
  });

  it("sends locked Chat Answer product mode without credentials or restart", () => {
    const supervisor = new CoreSupervisor({
      coreEntry,
      healthIntervalMs: 0
    });
    const sent: unknown[] = [];
    const fakeChild = {
      connected: true,
      send: (
        message: unknown,
        callback?: (error?: Error | null) => void
      ) => {
        sent.push(message);
        callback?.(null);
      }
    };
    (
      supervisor as unknown as {
        child: typeof fakeChild;
      }
    ).child = fakeChild;

    supervisor.configureChatAnswerProductMode({ enabled: true });

    expect(sent).toEqual([
      {
        kind: "chat-answer-product-mode.configure",
        enabled: true,
        providerId: "chat-answer.openai-compatible.deepseek",
        profileId: "deepseek.v4-flash.compact_json_object_256",
        runtimeLocked: true,
        credentialIncluded: false
      }
    ]);
    expect(JSON.stringify(sent)).not.toContain("apiKey");
  });

  it("sends armed Chat Answer product mode with an in-memory credential only after enablement", () => {
    const supervisor = new CoreSupervisor({
      coreEntry,
      healthIntervalMs: 0
    });
    const sent: unknown[] = [];
    const fakeChild = {
      connected: true,
      send: (
        message: unknown,
        callback?: (error?: Error | null) => void
      ) => {
        sent.push(message);
        callback?.(null);
      }
    };
    (
      supervisor as unknown as {
        child: typeof fakeChild;
      }
    ).child = fakeChild;

    supervisor.configureChatAnswerProductMode({
      enabled: true,
      configuration: {
        provider: "chat-answer.openai-compatible.deepseek",
        credentials: {
          apiKey: "test-deepseek-provider-key"
        }
      }
    });

    expect(sent).toEqual([
      {
        kind: "chat-answer-product-mode.configure",
        enabled: true,
        providerId: "chat-answer.openai-compatible.deepseek",
        profileId: "deepseek.v4-flash.compact_json_object_256",
        runtimeLocked: false,
        credentialIncluded: true,
        configuration: {
          provider: "chat-answer.openai-compatible.deepseek",
          credentials: {
            apiKey: "test-deepseek-provider-key"
          }
        }
      }
    ]);
  });
});
