import { describe, expect, it } from "vitest";
import {
  createRuntimeHelperUnavailableHealth,
  RuntimeHelperClient,
  type RuntimeHelperRequest,
  type RuntimeHelperTransport
} from "../src";

class FixtureRuntimeHelperTransport implements RuntimeHelperTransport {
  public connected = true;
  public dropResponses = false;
  public malformedResponse = false;
  public wrongCorrelation = false;
  public sendFailure: Error | undefined;
  private readonly messageListeners = new Set<
    (message: unknown) => void
  >();
  private readonly exitListeners = new Set<() => void>();

  public send(
    request: RuntimeHelperRequest,
    callback: (error: Error | null) => void
  ): void {
    if (!this.connected) {
      callback(new Error("helper is disconnected"));
      return;
    }
    if (this.sendFailure) {
      callback(this.sendFailure);
      return;
    }

    callback(null);
    if (this.dropResponses) {
      return;
    }
    queueMicrotask(() => {
      if (!this.connected) {
        return;
      }
      this.respond(request);
    });
  }

  public onMessage(listener: (message: unknown) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public onExit(listener: () => void): () => void {
    this.exitListeners.add(listener);
    return () => this.exitListeners.delete(listener);
  }

  public close(): void {
    this.connected = false;
  }

  public emitExit(): void {
    this.connected = false;
    for (const listener of this.exitListeners) {
      listener();
    }
  }

  private respond(request: RuntimeHelperRequest): void {
    const correlationId = this.wrongCorrelation
      ? "runtime-correlation-wrong"
      : request.correlationId;

    if (this.malformedResponse) {
      this.emit({
        protocolVersion: 1,
        requestId: request.requestId,
        correlationId,
        operation: request.operation,
        completedAt: "2026-08-02T00:00:01.000Z",
        ok: false,
        error: {
          code: "HELPER_INTERNAL",
          message: "raw helper output",
          retryable: true
        }
      });
      return;
    }

    switch (request.operation) {
      case "health":
        this.emit({
          protocolVersion: 1,
          requestId: request.requestId,
          correlationId,
          operation: "health",
          completedAt: "2026-08-02T00:00:01.000Z",
          ok: true,
          payload: createRuntimeHelperUnavailableHealth()
        });
        return;
      case "load":
        this.emit({
          protocolVersion: 1,
          requestId: request.requestId,
          correlationId,
          operation: "load",
          completedAt: "2026-08-02T00:00:01.000Z",
          ok: true,
          payload: {
            sessionId: "fixture-session-1",
            modelId: request.payload.modelId,
            capability: request.payload.capability,
            loadedAt: "2026-08-02T00:00:01.000Z"
          }
        });
        return;
      case "embed":
        this.emit({
          protocolVersion: 1,
          requestId: request.requestId,
          correlationId,
          operation: "embed",
          completedAt: "2026-08-02T00:00:01.000Z",
          ok: true,
          payload: {
            modelId: request.payload.request.modelId,
            dimensions: 3,
            vectors: request.payload.request.inputs.map((input) => ({
              ...(input.id === undefined ? {} : { inputId: input.id }),
              values: [0.1, 0.2, 0.3]
            })),
            generatedAt: "2026-08-02T00:00:01.000Z"
          }
        });
        return;
      case "shutdown":
        this.emit({
          protocolVersion: 1,
          requestId: request.requestId,
          correlationId,
          operation: "shutdown",
          completedAt: "2026-08-02T00:00:01.000Z",
          ok: true,
          payload: {
            status: "stopped"
          }
        });
        return;
    }
  }

  private emit(message: unknown): void {
    for (const listener of this.messageListeners) {
      listener(message);
    }
  }
}

describe("runtime helper client", () => {
  it("completes the correlated health, load, embed, and shutdown lifecycle", async () => {
    const transport = new FixtureRuntimeHelperTransport();
    const client = new RuntimeHelperClient({ transport });

    await expect(client.health()).resolves.toMatchObject({
      status: "unavailable",
      executionEnabled: false
    });
    await expect(
      client.load({
        modelId: "jarvis-fixture/local-embedding-smoke",
        capability: "embedding",
        resourceLeaseId: "lease-fixture-1"
      })
    ).resolves.toMatchObject({
      sessionId: "fixture-session-1",
      modelId: "jarvis-fixture/local-embedding-smoke"
    });
    await expect(
      client.embed({
        sessionId: "fixture-session-1",
        resourceLeaseId: "lease-fixture-1",
        request: {
          modelId: "jarvis-fixture/local-embedding-smoke",
          inputs: [{ id: "input-1", text: "phase seven nineteen" }],
          dimensions: 3
        }
      })
    ).resolves.toMatchObject({
      dimensions: 3,
      vectors: [{ inputId: "input-1", values: [0.1, 0.2, 0.3] }]
    });
    await expect(
      client.shutdown({
        reason: "test"
      })
    ).resolves.toEqual({ status: "stopped" });
    expect(transport.connected).toBe(false);
  });

  it("fails closed on missing leases and correlation mismatch", async () => {
    const transport = new FixtureRuntimeHelperTransport();
    const client = new RuntimeHelperClient({ transport });

    expect(() =>
      client.load({
        modelId: "jarvis-fixture/local-embedding-smoke",
        capability: "embedding",
        resourceLeaseId: ""
      })
    ).toThrow("HELPER_PROTOCOL_INVALID");

    transport.wrongCorrelation = true;
    await expect(client.health()).rejects.toMatchObject({
      code: "HELPER_PROTOCOL_INVALID",
      message: "Runtime helper protocol message is invalid."
    });
    client.dispose();
  });

  it("maps startup timeout and send errors to canonical messages", async () => {
    const timeoutTransport = new FixtureRuntimeHelperTransport();
    timeoutTransport.dropResponses = true;
    const timeoutClient = new RuntimeHelperClient({
      transport: timeoutTransport,
      timeoutPolicy: {
        startupTimeoutMs: 100,
        requestTimeoutMs: 100,
        shutdownTimeoutMs: 100
      }
    });

    await expect(timeoutClient.health()).rejects.toMatchObject({
      code: "HELPER_STARTUP_TIMEOUT",
      message: "Runtime helper startup timed out."
    });
    timeoutClient.dispose();

    const sendErrorTransport = new FixtureRuntimeHelperTransport();
    sendErrorTransport.sendFailure = new Error("raw helper transport failure");
    const sendErrorClient = new RuntimeHelperClient({
      transport: sendErrorTransport
    });

    const error = await sendErrorClient.health().catch((value) => value);
    expect(error).toMatchObject({
      code: "HELPER_INTERNAL",
      message: "Runtime helper failed with a sanitized error."
    });
    expect(JSON.stringify(error)).not.toContain(
      "raw helper transport failure"
    );
    sendErrorClient.dispose();
  });

  it("rejects malformed helper output and process exits without leaking output", async () => {
    const malformedTransport = new FixtureRuntimeHelperTransport();
    malformedTransport.malformedResponse = true;
    const malformedClient = new RuntimeHelperClient({
      transport: malformedTransport
    });

    const malformedError = await malformedClient.health().catch(
      (value) => value
    );
    expect(malformedError).toMatchObject({
      code: "HELPER_PROTOCOL_INVALID",
      message: "Runtime helper protocol message is invalid."
    });
    expect(JSON.stringify(malformedError)).not.toContain("raw helper output");

    const exitTransport = new FixtureRuntimeHelperTransport();
    const exitClient = new RuntimeHelperClient({
      transport: exitTransport
    });
    const pending = exitClient.health();
    exitTransport.emitExit();
    await expect(pending).rejects.toMatchObject({
      code: "HELPER_PROCESS_EXITED",
      message: "Runtime helper process exited unexpectedly."
    });
  });
});
