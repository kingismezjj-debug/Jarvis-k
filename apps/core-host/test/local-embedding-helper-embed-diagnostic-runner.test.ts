import { describe, expect, it } from "vitest";
import type {
  ResourceLease,
  ResourceRequest,
  ResourceScheduler
} from "@jarvis-k/capabilities";
import type {
  RuntimeHelperRequest,
  RuntimeHelperTransport
} from "@jarvis-k/inference-runtime-transformers-local";
import {
  LOCAL_EMBEDDING_HELPER_EMBED_DIAGNOSTIC_OPT_IN_ENV,
  runCoreHostLocalEmbeddingHelperEmbedDiagnostic
} from "../src/local-embedding-helper-embed-diagnostic-runner";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV
} from "../src/local-embedding-runtime-session-factory";

describe("Core Host local embedding helper embed diagnostic runner", () => {
  it("runs approved helper embed diagnostics and returns only sanitized counts", async () => {
    const scheduler = new RecordingResourceScheduler();
    const transport = new DiagnosticRuntimeTransport();

    const report = await runCoreHostLocalEmbeddingHelperEmbedDiagnostic({
      ...approvedInput(),
      resourceScheduler: scheduler,
      verifyModelArtifacts: async () => undefined,
      createTransport: () => transport
    });
    const serialized = JSON.stringify(report);

    expect(report).toMatchObject({
      phase: "7.40",
      mode: "helper_embed_diagnostic",
      provider: "embedding.local.qwen3",
      modelId: "Qwen/Qwen3-Embedding-0.6B",
      status: "passed",
      accepted: true,
      helperEmbedCalled: true,
      realEmbeddingVectorsReturned: false,
      vectorValuesExposed: false,
      rawInputsExposed: false,
      productInferenceEnabled: false,
      vectorsRoutedToMemory: false,
      vectorsPersisted: false,
      vectorsLoggedOrExposed: false,
      memorySchemaMigrationEnabled: false,
      providerRegistrationChanged: false,
      defaultOptInChanged: false,
      uiVisibilityChanged: false,
      downloadsEnabled: false,
      persistentCacheWritesEnabled: false,
      rawDiagnosticsExposed: false,
      privatePathExposureEnabled: false,
      signedUrlOrCredentialPersistenceEnabled: false,
      modelOutputShellExecutionEnabled: false,
      artifactDigestVerification: "passed",
      helperLoad: "passed",
      helperEmbed: "passed",
      cleanupStatus: "passed",
      caseCount: 2,
      passedCount: 2,
      degradedCount: 0,
      failedCount: 0,
      reasonCodes: []
    });
    expect(transport.operations).toEqual([
      "health",
      "load",
      "embed",
      "shutdown"
    ]);
    expect(scheduler.acquireCount).toBe(1);
    expect(scheduler.releaseCount).toBe(1);
    expect(scheduler.activeLeaseCount).toBe(0);
    expect(serialized).not.toContain("0.11");
    expect(serialized).not.toContain("0.22");
    expect(serialized).not.toContain("Jarvis-K local embedding diagnostic");
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades without calling helper embed when approvals or explicit diagnostic opt-in are missing", async () => {
    const transport = new DiagnosticRuntimeTransport();
    const missingApproval =
      await runCoreHostLocalEmbeddingHelperEmbedDiagnostic({
        ...approvedInput(),
        productApprovalGranted: false,
        resourceScheduler: new RecordingResourceScheduler(),
        verifyModelArtifacts: async () => undefined,
        createTransport: () => transport
      });
    const missingOptIn =
      await runCoreHostLocalEmbeddingHelperEmbedDiagnostic({
        ...approvedInput(),
        env: {
          [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python",
          [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
        },
        resourceScheduler: new RecordingResourceScheduler(),
        verifyModelArtifacts: async () => undefined,
        createTransport: () => transport
      });

    expect(missingApproval).toMatchObject({
      status: "degraded",
      helperEmbedCalled: false,
      artifactDigestVerification: "not_run",
      cleanupStatus: "not_started",
      reasonCodes: ["diagnostic_not_approved"]
    });
    expect(missingOptIn).toMatchObject({
      status: "degraded",
      helperEmbedCalled: false,
      artifactDigestVerification: "not_run",
      cleanupStatus: "not_started",
      reasonCodes: ["diagnostic_opt_in_missing"]
    });
    expect(transport.operations).toEqual([]);
  });

  it("degrades with fixed reason codes when runtime env, artifacts, or helper embed fail", async () => {
    const missingEnv =
      await runCoreHostLocalEmbeddingHelperEmbedDiagnostic({
        ...approvedInput(),
        env: {
          [LOCAL_EMBEDDING_HELPER_EMBED_DIAGNOSTIC_OPT_IN_ENV]: "1",
          [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
        },
        resourceScheduler: new RecordingResourceScheduler()
      });
    const artifactFailure =
      await runCoreHostLocalEmbeddingHelperEmbedDiagnostic({
        ...approvedInput(),
        resourceScheduler: new RecordingResourceScheduler(),
        verifyModelArtifacts: async () => {
          throw new Error("C:\\private\\model\\artifact.safetensors");
        }
      });
    const embedFailureTransport = new DiagnosticRuntimeTransport({
      failEmbed: true
    });
    const embedFailure =
      await runCoreHostLocalEmbeddingHelperEmbedDiagnostic({
        ...approvedInput(),
        resourceScheduler: new RecordingResourceScheduler(),
        verifyModelArtifacts: async () => undefined,
        createTransport: () => embedFailureTransport
      });

    expect(missingEnv).toMatchObject({
      status: "degraded",
      reasonCodes: ["runtime_python_missing"],
      helperEmbedCalled: false
    });
    expect(artifactFailure).toMatchObject({
      status: "degraded",
      artifactDigestVerification: "failed",
      reasonCodes: ["artifact_verification_failed"],
      helperEmbedCalled: false
    });
    expect(JSON.stringify(artifactFailure)).not.toMatch(/[A-Za-z]:\\/u);
    expect(embedFailure).toMatchObject({
      status: "degraded",
      artifactDigestVerification: "passed",
      helperLoad: "passed",
      helperEmbed: "failed",
      cleanupStatus: "passed",
      reasonCodes: ["helper_embed_failed"]
    });
  });

  it("blocks product, Memory, visibility, cache, diagnostics, and shell side effects", async () => {
    const report = await runCoreHostLocalEmbeddingHelperEmbedDiagnostic({
      ...approvedInput(),
      resourceScheduler: new RecordingResourceScheduler(),
      productInferenceEnabled: true,
      vectorsRoutedToMemory: true,
      vectorsPersisted: true,
      vectorsLoggedOrExposed: true,
      memorySchemaMigrationEnabled: true,
      providerRegistrationChanged: true,
      defaultOptInChanged: true,
      uiVisibilityChanged: true,
      downloadsEnabled: true,
      persistentCacheWritesEnabled: true,
      rawDiagnosticsExposed: true,
      privatePathExposureEnabled: true,
      signedUrlOrCredentialPersistenceEnabled: true,
      modelOutputShellExecutionEnabled: true
    });

    expect(report).toMatchObject({
      status: "blocked",
      accepted: false,
      helperEmbedCalled: false,
      productInferenceEnabled: false,
      vectorsRoutedToMemory: false,
      vectorsPersisted: false,
      vectorsLoggedOrExposed: false,
      memorySchemaMigrationEnabled: false,
      providerRegistrationChanged: false,
      defaultOptInChanged: false,
      uiVisibilityChanged: false,
      downloadsEnabled: false,
      persistentCacheWritesEnabled: false,
      rawDiagnosticsExposed: false,
      privatePathExposureEnabled: false,
      signedUrlOrCredentialPersistenceEnabled: false,
      modelOutputShellExecutionEnabled: false,
      failedCount: 2,
      reasonCodes: ["unsafe_side_effect_requested"]
    });
  });
});

class DiagnosticRuntimeTransport implements RuntimeHelperTransport {
  public connected = true;
  public readonly operations: string[] = [];
  private readonly messageListeners = new Set<
    (message: unknown) => void
  >();
  private readonly exitListeners = new Set<() => void>();

  public constructor(
    private readonly options: {
      failEmbed?: boolean;
    } = {}
  ) {}

  public send(
    request: RuntimeHelperRequest,
    callback: (error: Error | null) => void
  ): void {
    this.operations.push(request.operation);
    callback(null);
    queueMicrotask(() => {
      for (const listener of this.messageListeners) {
        listener(this.createResponse(request));
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
          modelArtifactsAccessed: false,
          reasons: ["diagnostic helper ready"]
        }
      };
    }
    if (request.operation === "load") {
      return {
        ...base,
        ok: true,
        payload: {
          sessionId: "diagnostic-session-1",
          modelId: request.payload.modelId,
          capability: request.payload.capability,
          loadedAt: "2026-08-02T00:00:01.000Z"
        }
      };
    }
    if (request.operation === "embed") {
      if (this.options.failEmbed === true) {
        return {
          ...base,
          ok: false,
          error: {
            code: "HELPER_INTERNAL",
            message: "Runtime helper failed with a sanitized error.",
            retryable: true
          }
        };
      }
      return {
        ...base,
        ok: true,
        payload: {
          modelId: request.payload.request.modelId,
          dimensions: 2,
          vectors: request.payload.request.inputs.map((input, index) => ({
            ...(input.id === undefined ? {} : { inputId: input.id }),
            values: index === 0 ? [0.11, 0.22] : [0.33, 0.44]
          })),
          generatedAt: "2026-08-02T00:00:01.000Z"
        }
      };
    }
    return {
      ...base,
      ok: true,
      payload: {
        status: "stopped"
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
    return {
      leaseId: `lease-${this.acquireCount}`,
      capability: input.capability,
      modelId: input.modelId,
      createdAt: "2026-08-02T00:00:00.000Z",
      release: async () => {
        this.releaseCount += 1;
        this.activeLeaseCount -= 1;
      }
    };
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

function approvedInput() {
  return {
    env: {
      [LOCAL_EMBEDDING_HELPER_EMBED_DIAGNOSTIC_OPT_IN_ENV]: "1",
      [LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV]: "fixture-python",
      [LOCAL_EMBEDDING_MODEL_DIR_ENV]: "approved-model-dir"
    },
    productApprovalGranted: true,
    securityApprovalGranted: true,
    phase738PreflightComplete: true,
    phase739PreflightComplete: true
  };
}
