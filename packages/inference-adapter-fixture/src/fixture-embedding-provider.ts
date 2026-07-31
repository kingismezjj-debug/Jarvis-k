import type { EmbeddingInferenceProvider } from "@jarvis-k/capabilities";
import {
  EmbeddingGenerationRequestSchema,
  EmbeddingGenerationResultSchema,
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  type EmbeddingGenerationRequest,
  type EmbeddingGenerationResult,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor
} from "@jarvis-k/contracts";

export const FIXTURE_EMBEDDING_PROVIDER_ID = "embedding.fixture";
export const FIXTURE_EMBEDDING_MODEL_ID =
  "jarvis-fixture/local-embedding-smoke";
const DEFAULT_DIMENSIONS = 8;

export interface FixtureEmbeddingProviderOptions {
  modelId?: string;
  dimensions?: number;
  now?: () => Date;
}

export interface FixtureProviderReportOptions {
  enabled: boolean;
  modelId?: string;
}

export class FixtureEmbeddingProvider implements EmbeddingInferenceProvider {
  private readonly modelId: string;
  private readonly dimensions: number;
  private readonly now: () => Date;

  public constructor(options: FixtureEmbeddingProviderOptions = {}) {
    this.modelId = options.modelId ?? FIXTURE_EMBEDDING_MODEL_ID;
    this.dimensions = options.dimensions ?? DEFAULT_DIMENSIONS;
    this.now = options.now ?? (() => new Date());
  }

  public async embed(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult> {
    const parsed = EmbeddingGenerationRequestSchema.parse(request);
    if (parsed.modelId !== this.modelId) {
      throw new Error("Fixture embedding provider is not bound to this model.");
    }
    const dimensions = parsed.dimensions ?? this.dimensions;
    return EmbeddingGenerationResultSchema.parse({
      modelId: parsed.modelId,
      dimensions,
      vectors: parsed.inputs.map((input) => ({
        ...(input.id ? { inputId: input.id } : {}),
        values: deterministicVector(input.text, dimensions)
      })),
      generatedAt: this.now().toISOString()
    });
  }
}

export function createFixtureEmbeddingProviderDescriptor(
  options: FixtureProviderReportOptions
): InferenceProviderDescriptor {
  const modelId = options.modelId ?? FIXTURE_EMBEDDING_MODEL_ID;
  return InferenceProviderDescriptorSchema.parse({
    capability: "embedding",
    provider: FIXTURE_EMBEDDING_PROVIDER_ID,
    status: options.enabled ? "available" : "unconfigured",
    execution: options.enabled ? "local" : "disabled",
    modelIds: options.enabled ? [modelId] : [],
    reasons: options.enabled
      ? []
      : ["Fixture inference is disabled by default."]
  });
}

export function createFixtureEmbeddingProviderConfigurationReport(
  options: FixtureProviderReportOptions
): InferenceProviderConfigurationReport {
  return InferenceProviderConfigurationReportSchema.parse({
    capability: "embedding",
    provider: FIXTURE_EMBEDDING_PROVIDER_ID,
    status: options.enabled ? "available" : "unconfigured",
    requirements: [
      {
        key: "JARVIS_K_ENABLE_FIXTURE_INFERENCE",
        source: "environment",
        required: true,
        configured: options.enabled,
        description: "Explicitly enables deterministic fixture inference.",
        reasons: options.enabled
          ? []
          : ["Set JARVIS_K_ENABLE_FIXTURE_INFERENCE=1 for tests only."]
      }
    ],
    reasons: options.enabled
      ? []
      : ["Fixture inference remains disabled until explicitly enabled."]
  });
}

function deterministicVector(text: string, dimensions: number): number[] {
  let state = 2166136261;
  for (const character of text) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619) >>> 0;
  }

  return Array.from({ length: dimensions }, (_, index) => {
    state ^= index + 1;
    state = Math.imul(state, 16777619) >>> 0;
    return Number((((state % 2001) - 1000) / 1000).toFixed(6));
  });
}
