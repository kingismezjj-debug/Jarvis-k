import type { EmbeddingInferenceProvider } from "@jarvis-k/capabilities";
import {
  EmbeddingGenerationRequestSchema,
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  type EmbeddingGenerationRequest,
  type EmbeddingGenerationResult,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor
} from "@jarvis-k/contracts";

export const LOCAL_EMBEDDING_PROVIDER_ID = "embedding.local.qwen3";
export const LOCAL_EMBEDDING_MODEL_ID = "Qwen/Qwen3-Embedding-0.6B";

const BLOCKED_REASONS = [
  "Local embedding execution is disabled until Phase 6 runtime gates are complete.",
  "No model revision, artifact SHA-256, runtime adapter, packaging plan, or benchmark gate has been approved."
];

export class UnavailableLocalEmbeddingProvider
  implements EmbeddingInferenceProvider
{
  public async embed(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult> {
    EmbeddingGenerationRequestSchema.parse(request);
    throw new Error("Local embedding provider is not configured.");
  }
}

export function createLocalEmbeddingProviderDescriptor(): InferenceProviderDescriptor {
  return InferenceProviderDescriptorSchema.parse({
    capability: "embedding",
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    status: "unconfigured",
    execution: "disabled",
    modelIds: [LOCAL_EMBEDDING_MODEL_ID],
    reasons: BLOCKED_REASONS
  });
}

export function createLocalEmbeddingProviderConfigurationReport(): InferenceProviderConfigurationReport {
  return InferenceProviderConfigurationReportSchema.parse({
    capability: "embedding",
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    status: "unconfigured",
    requirements: [
      {
        key: "model.revision",
        source: "manual",
        required: true,
        configured: false,
        description: "Pin an immutable upstream model revision.",
        reasons: ["Do not use a floating Hugging Face branch."]
      },
      {
        key: "model.artifact_sha256",
        source: "manual",
        required: true,
        configured: false,
        description: "Record SHA-256 digests for every artifact.",
        reasons: ["Artifact integrity must be verified before download."]
      },
      {
        key: "runtime.adapter",
        source: "runtime",
        required: true,
        configured: false,
        description: "Select a dedicated local embedding runtime adapter.",
        reasons: ["No runtime dependency is allowed in this readiness slice."]
      },
      {
        key: "runtime.packaging",
        source: "manual",
        required: true,
        configured: false,
        description: "Document Windows packaging and resource requirements.",
        reasons: ["Native or helper runtimes need an explicit packaging plan."]
      },
      {
        key: "license.redistribution_review",
        source: "manual",
        required: true,
        configured: false,
        description: "Complete license and redistribution review.",
        reasons: ["Do not mirror or bundle artifacts before review."]
      },
      {
        key: "benchmarks.local_resource_profile",
        source: "manual",
        required: true,
        configured: false,
        description: "Capture Lite, Standard, and Local Enhanced benchmarks.",
        reasons: ["Provider enablement needs memory, latency, and quality data."]
      }
    ],
    reasons: BLOCKED_REASONS
  });
}
