import { describe, expect, it } from "vitest";
import type {
  ResourceLease,
  ResourceRequest,
  ResourceScheduler
} from "@jarvis-k/capabilities";
import {
  type RuntimeHelperRequest,
  type RuntimeHelperTransport
} from "@jarvis-k/inference-runtime-transformers-local";
import {
  LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV,
  createCoreHostLocalEmbeddingComposition
} from "../src/local-embedding-composition";
import {
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
  createCoreHostLocalEmbeddingRuntimeSessionFactory,
  readRuntimePythonExecutable
} from "../src/local-embedding-runtime-session-factory";

describe("Core Host local embedding runtime session factory", () => {
  it("fails closed without reading helper paths when the runtime Python env is missing", async () => {
    let transportCreated = false;
    const factory = createCoreHostLocalEmbeddingRuntimeSessionFactory({
      env: {},
      createTransport: () => {
        transportCreated = true;
        return new LifecycleOnlyRuntimeTransport();
      }
    });

    await expect(
      factory({
        request: validRequest(),
        resourceLease: createLease()
      })
    ).rejects.toThrow("HELPER_UNAVAILABLE");
    expect(transportCreated).toBe(false);
  });

  it("launches only the helper health lifecycle and shuts it down without load or inference", async () => {
    const transport = new LifecycleOnlyRuntimeTransport();
    const factory = createCoreHostLocalEmbeddingRuntimeSessionFactory({
      env: {
        [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python"
      },
      createTransport: (options) => {
        expect(options.pythonExecutable).toBe("fixture-python");
        expect(options.helperScript.length).toBeGreaterThan(0);
        expect(options.modelDirectory).toBeUndefined();
        return transport;
      }
    });

    const session = await factory({
      request: validRequest(),
      resourceLease: createLease()
    });
    await expect(session.embed(validRequest())).rejects.toThrow(
      "Embedding execution remains disabled by the runtime gate."
    );
    await session.release();

    expect(transport.operations).toEqual(["health", "shutdown"]);
    expect(transport.connected).toBe(false);
    expect(JSON.stringify(transport.responses)).not.toMatch(/[A-Za-z]:\\/u);
    expect(JSON.stringify(transport.responses)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(transport.responses)).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("closes the helper when lifecycle health is degraded or unsafe", async () => {
    const transport = new LifecycleOnlyRuntimeTransport({
      modelArtifactsAccessed: true
    });
    const factory = createCoreHostLocalEmbeddingRuntimeSessionFactory({
      env: {
        [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python"
      },
      createTransport: () => transport
    });

    const error = await factory({
      request: validRequest(),
      resourceLease: createLease()
    }).catch((value: unknown) => value);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("MODEL_ARTIFACT_UNAVAILABLE");
    expect(transport.operations).toEqual(["health"]);
    expect(transport.connected).toBe(false);
  });

  it("wires the lifecycle factory through explicit Core Host composition while preserving fixture fallback semantics", async () => {
    const scheduler = new RecordingResourceScheduler();
    const transport = new LifecycleOnlyRuntimeTransport();
    const composition = createCoreHostLocalEmbeddingComposition({
      env: {
        [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
        [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python"
      },
      resourceScheduler: scheduler,
      runtimeSessionFactoryOptions: {
        createTransport: () => transport
      }
    });

    await expect(
      composition.embeddingProvider?.embed(validRequest())
    ).rejects.toThrow("Transformers local runtime scaffold is not configured.");

    expect(transport.operations).toEqual(["health", "shutdown"]);
    expect(scheduler.acquireCount).toBe(1);
    expect(scheduler.releaseCount).toBe(1);
    expect(scheduler.activeLeaseCount).toBe(0);
  });

  it("trims the approved runtime Python env without exposing private values in reports", () => {
    expect(
      readRuntimePythonExecutable({
        [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "  fixture-python  "
      })
    ).toBe("fixture-python");
    expect(readRuntimePythonExecutable({})).toBeUndefined();
  });
});

class LifecycleOnlyRuntimeTransport implements RuntimeHelperTransport {
  public connected = true;
  public readonly operations: string[] = [];
  public readonly responses: unknown[] = [];
  private readonly messageListeners = new Set<
    (message: unknown) => void
  >();
  private readonly exitListeners = new Set<() => void>();

  public constructor(
    private readonly options: {
      modelArtifactsAccessed?: boolean;
    } = {}
  ) {}

  public send(
    request: RuntimeHelperRequest,
    callback: (error: Error | null) => void
  ): void {
    this.operations.push(request.operation);
    callback(null);
    queueMicrotask(() => {
      const response = this.createResponse(request);
      this.responses.push(response);
      for (const listener of this.messageListeners) {
        listener(response);
      }
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
    if (!this.connected) {
      return;
    }
    this.connected = false;
    for (const listener of this.exitListeners) {
      listener();
    }
  }

  private createResponse(request: RuntimeHelperRequest): unknown {
    const base = {
      protocolVersion: 1,
      requestId: request.requestId,
      correlationId: request.correlationId,
      operation: request.operation,
      completedAt: "2026-08-02T00:00:01.000Z"
    };
    if (request.operation === "health") {
      return {
        ...base,
        ok: true,
        payload: {
          runtime: "transformers",
          status: "ready",
          processState: "ready",
          transport: "private-child-process-ipc",
          resourceLeaseRequired: true,
          directShellExecutionAllowed: false,
          runtimeDependenciesIntroduced: true,
          downloadEnabled: false,
          executionEnabled: true,
          modelArtifactsAccessed:
            this.options.modelArtifactsAccessed === true,
          reasons: ["fixture helper lifecycle ready"]
        }
      };
    }
    if (request.operation === "shutdown") {
      return {
        ...base,
        ok: true,
        payload: {
          status: "stopped"
        }
      };
    }
    return {
      ...base,
      ok: false,
      error: {
        code: "EMBEDDING_EXECUTION_DISABLED",
        message: "Embedding execution remains disabled by the runtime gate.",
        retryable: false
      }
    };
  }
}

class RecordingResourceScheduler implements ResourceScheduler {
  public acquireCount = 0;
  public releaseCount = 0;
  public activeLeaseCount = 0;

  public async acquire(input: ResourceRequest): Promise<ResourceLease> {
    this.acquireCount += 1;
    this.activeLeaseCount += 1;
    expect(input).toMatchObject({
      capability: "embedding",
      modelId: "Qwen/Qwen3-Embedding-0.6B"
    });
    return createLease(`lease-${this.acquireCount}`, async () => {
      this.releaseCount += 1;
      this.activeLeaseCount -= 1;
    });
  }

  public async diagnostics() {
    return {
      checkedAt: "2026-08-02T00:00:00.000Z",
      totalMemoryBytes: 16,
      availableMemoryBytes: 8,
      leasedMemoryBytes: 0,
      totalVramBytes: 0,
      availableVramBytes: 0,
      leasedVramBytes: 0,
      activeLeaseCount: this.activeLeaseCount,
      exclusiveGpuLeaseActive: false
    };
  }
}

function createLease(
  leaseId = "lease-fixture-1",
  release: () => Promise<void> = async () => undefined
): ResourceLease {
  return {
    leaseId,
    capability: "embedding",
    modelId: "Qwen/Qwen3-Embedding-0.6B",
    createdAt: "2026-08-02T00:00:00.000Z",
    release
  };
}

function validRequest() {
  return {
    modelId: "Qwen/Qwen3-Embedding-0.6B",
    inputs: [
      {
        id: "input-1",
        text: "Jarvis-K local embedding lifecycle smoke"
      }
    ],
    dimensions: 2
  };
}
