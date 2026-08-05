import { describe, expect, it } from "vitest";
import type {
  EmbeddingGenerationRequest,
  EmbeddingGenerationResult
} from "@jarvis-k/contracts";
import type {
  ResourceLease,
  ResourceRequest,
  ResourceScheduler
} from "@jarvis-k/capabilities";
import {
  CoreHostLocalEmbeddingProvider,
  LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV,
  LOCAL_EMBEDDING_SESSION_REUSE_OPT_IN_ENV,
  createCoreHostLocalEmbeddingComposition,
  isLocalEmbeddingSessionReuseOptInEnabled
} from "../src/local-embedding-composition";
import { LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV } from "../src/local-embedding-runtime-session-factory";

describe("Core Host local embedding composition", () => {
  it("keeps runtime-backed local embedding disabled by default", async () => {
    const scheduler = new RecordingResourceScheduler();
    const composition = createCoreHostLocalEmbeddingComposition({
      env: {},
      resourceScheduler: scheduler
    });

    expect(composition.enabled).toBe(false);
    expect(composition.embeddingProvider).toBeUndefined();
    expect(composition.manifests).toEqual([]);
    expect(await composition.modelRuntimeRegistry.listDescriptors()).toEqual([]);
    expect(composition.providerDescriptor).toMatchObject({
      provider: "embedding.local.qwen3",
      status: "unconfigured",
      execution: "disabled"
    });
    expect(JSON.stringify(composition)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(composition)).not.toMatch(/[A-Za-z]:\\/u);
    expect(JSON.stringify(composition)).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/i
    );
  });

  it("registers the runtime-backed provider only after explicit opt-in", async () => {
    const scheduler = new RecordingResourceScheduler();
    const composition = createCoreHostLocalEmbeddingComposition({
      env: {
        [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1"
      },
      resourceScheduler: scheduler
    });
    const descriptors = await composition.modelRuntimeRegistry.listDescriptors();

    expect(composition.enabled).toBe(true);
    expect(composition.embeddingProvider).toBeInstanceOf(
      CoreHostLocalEmbeddingProvider
    );
    expect(composition.manifests).toHaveLength(1);
    expect(composition.manifests[0]).toMatchObject({
      id: "Qwen/Qwen3-Embedding-0.6B",
      capability: "embedding",
      runtime: "transformers"
    });
    expect(descriptors).toEqual([
      expect.objectContaining({
        runtime: "transformers",
        capabilities: ["embedding"]
      })
    ]);
    expect(composition.providerDescriptor).toMatchObject({
      provider: "embedding.local.qwen3",
      status: "available",
      execution: "local",
      modelIds: ["Qwen/Qwen3-Embedding-0.6B"]
    });
    expect(composition.providerConfigurationReport.requirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV,
          configured: true
        }),
        expect.objectContaining({
          key: LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
          configured: false
        }),
        expect.objectContaining({
          key: "runtime.resource_lease",
          configured: true
        }),
        expect.objectContaining({
          key: "runtime.sanitized_errors",
          configured: true
        })
      ])
    );
  });

  it("marks provider execution configured only after the separate execution opt-in", () => {
    const composition = createCoreHostLocalEmbeddingComposition({
      env: {
        [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
        [LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV]: "1"
      },
      resourceScheduler: new RecordingResourceScheduler()
    });

    expect(composition.providerConfigurationReport.requirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
          configured: true
        })
      ])
    );
    expect(composition.providerDescriptor.reasons).toContain(
      "Local embedding provider execution is enabled by separate explicit Core Host opt-in."
    );
  });

  it("uses a resource lease around a successful injected runtime session", async () => {
    const scheduler = new RecordingResourceScheduler();
    let sessionReleased = false;
    const provider = new CoreHostLocalEmbeddingProvider({
      resourceScheduler: scheduler,
      sessionFactory: async ({ resourceLease }) => ({
        embed: async (request): Promise<EmbeddingGenerationResult> => ({
          modelId: request.modelId,
          dimensions: 2,
          vectors: request.inputs.map((input) => ({
            ...(input.id ? { inputId: input.id } : {}),
            values: [0.25, -0.25]
          })),
          generatedAt: "2026-08-02T00:00:00.000Z"
        }),
        release: async () => {
          sessionReleased = true;
          expect(resourceLease.leaseId).toBe("lease-1");
        }
      })
    });

    const result = await provider.embed(validRequest());

    expect(result).toMatchObject({
      modelId: "Qwen/Qwen3-Embedding-0.6B",
      dimensions: 2,
      vectors: [
        {
          inputId: "input-1",
          values: [0.25, -0.25]
        }
      ]
    });
    expect(scheduler.acquireCount).toBe(1);
    expect(scheduler.releaseCount).toBe(1);
    expect(sessionReleased).toBe(true);
    expect(scheduler.activeLeaseCount).toBe(0);
  });

  it("reuses one helper session and lease only when explicitly enabled", async () => {
    const scheduler = new RecordingResourceScheduler();
    let sessionCreateCount = 0;
    let sessionReleaseCount = 0;
    const provider = new CoreHostLocalEmbeddingProvider({
      resourceScheduler: scheduler,
      sessionReuseEnabled: true,
      sessionFactory: async ({ resourceLease }) => {
        sessionCreateCount += 1;
        return {
          embed: async (request): Promise<EmbeddingGenerationResult> => ({
            modelId: request.modelId,
            dimensions: 2,
            vectors: request.inputs.map((input) => ({
              ...(input.id ? { inputId: input.id } : {}),
              values: [0.5, -0.5]
            })),
            generatedAt: "2026-08-02T00:00:00.000Z"
          }),
          release: async () => {
            sessionReleaseCount += 1;
            expect(resourceLease.leaseId).toBe("lease-1");
          }
        };
      }
    });

    await provider.embed(validRequest());
    await provider.embed({
      ...validRequest(),
      inputs: [{ id: "input-2", text: "Second warm request" }]
    });

    expect(sessionCreateCount).toBe(1);
    expect(sessionReleaseCount).toBe(0);
    expect(scheduler.acquireCount).toBe(1);
    expect(scheduler.releaseCount).toBe(0);
    await provider.close();
    await provider.close();
    expect(sessionReleaseCount).toBe(1);
    expect(scheduler.releaseCount).toBe(1);
    expect(scheduler.activeLeaseCount).toBe(0);
  });

  it("keeps the per-request cold lifecycle as the default", async () => {
    const scheduler = new RecordingResourceScheduler();
    let sessionCreateCount = 0;
    let sessionReleaseCount = 0;
    const provider = new CoreHostLocalEmbeddingProvider({
      resourceScheduler: scheduler,
      sessionFactory: async () => {
        sessionCreateCount += 1;
        return {
          embed: async (request): Promise<EmbeddingGenerationResult> => ({
            modelId: request.modelId,
            dimensions: 2,
            vectors: request.inputs.map((input) => ({
              ...(input.id ? { inputId: input.id } : {}),
              values: [0.5, -0.5]
            })),
            generatedAt: "2026-08-02T00:00:00.000Z"
          }),
          release: async () => {
            sessionReleaseCount += 1;
          }
        };
      }
    });

    await provider.embed(validRequest());
    await provider.embed(validRequest());

    expect(sessionCreateCount).toBe(2);
    expect(sessionReleaseCount).toBe(2);
    expect(scheduler.acquireCount).toBe(2);
    expect(scheduler.releaseCount).toBe(2);
    expect(scheduler.activeLeaseCount).toBe(0);
  });

  it("invalidates and releases a warm session after a helper failure", async () => {
    const scheduler = new RecordingResourceScheduler();
    let sessionCreateCount = 0;
    let sessionReleaseCount = 0;
    const provider = new CoreHostLocalEmbeddingProvider({
      resourceScheduler: scheduler,
      sessionReuseEnabled: true,
      sessionFactory: async () => {
        sessionCreateCount += 1;
        const currentSession = sessionCreateCount;
        return {
          embed: async (request): Promise<EmbeddingGenerationResult> => {
            if (currentSession === 1) {
              throw new Error(
                "C:\\Users\\Administrator\\private-helper-diagnostic"
              );
            }
            return {
              modelId: request.modelId,
              dimensions: 2,
              vectors: request.inputs.map((input) => ({
                ...(input.id ? { inputId: input.id } : {}),
                values: [0.5, -0.5]
              })),
              generatedAt: "2026-08-02T00:00:00.000Z"
            };
          },
          release: async () => {
            sessionReleaseCount += 1;
          }
        };
      }
    });

    await expect(provider.embed(validRequest())).rejects.toThrow(
      "Transformers local runtime scaffold is not configured."
    );
    await expect(provider.embed(validRequest())).resolves.toMatchObject({
      dimensions: 2
    });
    expect(sessionCreateCount).toBe(2);
    expect(sessionReleaseCount).toBe(1);
    expect(scheduler.acquireCount).toBe(2);
    expect(scheduler.releaseCount).toBe(1);
    await provider.close();
    expect(sessionReleaseCount).toBe(2);
    expect(scheduler.releaseCount).toBe(2);
    expect(scheduler.activeLeaseCount).toBe(0);
  });

  it("reports warm reuse as an explicit optional configuration", () => {
    const composition = createCoreHostLocalEmbeddingComposition({
      env: {
        [LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV]: "1",
        [LOCAL_EMBEDDING_SESSION_REUSE_OPT_IN_ENV]: "1"
      },
      resourceScheduler: new RecordingResourceScheduler()
    });

    expect(
      isLocalEmbeddingSessionReuseOptInEnabled({
        [LOCAL_EMBEDDING_SESSION_REUSE_OPT_IN_ENV]: "1"
      })
    ).toBe(true);
    expect(JSON.stringify(composition)).not.toMatch(/[A-Za-z]:\\/u);
    expect(JSON.stringify(composition)).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/i
    );
  });

  it("sanitizes runtime failures and releases the resource lease", async () => {
    const scheduler = new RecordingResourceScheduler();
    const provider = new CoreHostLocalEmbeddingProvider({
      resourceScheduler: scheduler,
      sessionFactory: async () => {
        throw new Error("C:\\Users\\Administrator\\private-token-cache\\model");
      }
    });

    await expect(provider.embed(validRequest())).rejects.toThrow(
      "Transformers local runtime scaffold is not configured."
    );
    expect(scheduler.acquireCount).toBe(1);
    expect(scheduler.releaseCount).toBe(1);
    expect(scheduler.activeLeaseCount).toBe(0);
  });

  it("rejects mismatched models before acquiring a resource lease", async () => {
    const scheduler = new RecordingResourceScheduler();
    const provider = new CoreHostLocalEmbeddingProvider({
      resourceScheduler: scheduler,
      sessionFactory: async () => {
        throw new Error("should not load");
      }
    });

    await expect(
      provider.embed({
        ...validRequest(),
        modelId: "other/model"
      })
    ).rejects.toThrow("Local embedding provider is not bound to this model.");
    expect(scheduler.acquireCount).toBe(0);
  });
});

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

function validRequest(): EmbeddingGenerationRequest {
  return {
    modelId: "Qwen/Qwen3-Embedding-0.6B",
    inputs: [
      {
        id: "input-1",
        text: "Jarvis-K local embedding composition smoke"
      }
    ],
    dimensions: 2
  };
}
