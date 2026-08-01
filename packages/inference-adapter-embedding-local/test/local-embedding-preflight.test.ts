import {
  PolicyInferenceExecutionPlanner,
  StaticInferenceProviderRegistry
} from "@jarvis-k/capabilities";
import type { ModelManifest } from "@jarvis-k/contracts";
import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingProviderConfigurationReport,
  createLocalEmbeddingProviderDescriptor,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "../src";

describe("local embedding preflight", () => {
  it("blocks execution while the planned provider is unconfigured", async () => {
    const registry = new StaticInferenceProviderRegistry(
      [createLocalEmbeddingProviderDescriptor()],
      [createLocalEmbeddingProviderConfigurationReport()]
    );
    const planner = new PolicyInferenceExecutionPlanner({
      inferenceProviderRegistry: registry
    });

    await expect(
      planner.preview({
        capability: "embedding",
        manifest: localEmbeddingManifest()
      })
    ).resolves.toMatchObject({
      allowed: false,
      providers: [
        expect.objectContaining({
          provider: LOCAL_EMBEDDING_PROVIDER_ID,
          status: "unconfigured",
          execution: "disabled",
          modelIds: [LOCAL_EMBEDDING_MODEL_ID]
        })
      ],
      reasons: [
        "No available inference provider is configured for the requested capability."
      ]
    });
  });

  it("keeps every configuration requirement observable before execution", async () => {
    const registry = new StaticInferenceProviderRegistry(
      [createLocalEmbeddingProviderDescriptor()],
      [createLocalEmbeddingProviderConfigurationReport()]
    );

    await expect(
      registry.listConfigurationRequirements({ capability: "embedding" })
    ).resolves.toEqual([
      expect.objectContaining({
        provider: LOCAL_EMBEDDING_PROVIDER_ID,
        status: "unconfigured",
        requirements: expect.arrayContaining([
          expect.objectContaining({ key: "model.manifest" }),
          expect.objectContaining({ key: "artifact.pins" }),
          expect.objectContaining({ key: "runtime.strategy" }),
          expect.objectContaining({ key: "runtime.adapter" }),
          expect.objectContaining({
            key: "benchmarks.local_resource_profile"
          })
        ])
      })
    ]);
  });
});

function localEmbeddingManifest(): ModelManifest {
  return {
    id: LOCAL_EMBEDDING_MODEL_ID,
    capability: "embedding",
    source: "huggingface",
    revision: "immutable-embedding-revision",
    license: "Apache-2.0",
    runtime: "transformers",
    sizeBytes: 1024,
    sha256:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    licenseRisk: "yellow"
  };
}
