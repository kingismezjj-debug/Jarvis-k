import type { RerankingProvider } from "@jarvis-k/capabilities";
import {
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  RerankRequestSchema,
  RerankResultSchema,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor,
  type RerankRequest,
  type RerankResult
} from "@jarvis-k/contracts";

export const FIXTURE_RERANKER_PROVIDER_ID = "reranker.fixture";
export const FIXTURE_RERANKER_MODEL_ID =
  "jarvis-fixture/local-reranker-smoke";

export interface FixtureRerankingProviderOptions {
  modelId?: string;
  now?: () => Date;
}

export interface FixtureRerankerReportOptions {
  enabled: boolean;
  modelId?: string;
}

export class FixtureRerankingProvider implements RerankingProvider {
  private readonly modelId: string;
  private readonly now: () => Date;

  public constructor(options: FixtureRerankingProviderOptions = {}) {
    this.modelId = options.modelId ?? FIXTURE_RERANKER_MODEL_ID;
    this.now = options.now ?? (() => new Date());
  }

  public async rerank(request: RerankRequest): Promise<RerankResult> {
    const parsed = RerankRequestSchema.parse(request);
    if (parsed.modelId !== this.modelId) {
      throw new Error("Fixture reranker is not bound to this model.");
    }

    const scored = parsed.documents
      .map((document, index) => ({
        documentId: document.id,
        score: fixtureScore(parsed.query, document.text, index)
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, parsed.topK ?? parsed.documents.length)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    return RerankResultSchema.parse({
      modelId: parsed.modelId,
      query: parsed.query,
      results: scored,
      rankedAt: this.now().toISOString()
    });
  }
}

export function createFixtureRerankerDescriptor(
  options: FixtureRerankerReportOptions
): InferenceProviderDescriptor {
  const modelId = options.modelId ?? FIXTURE_RERANKER_MODEL_ID;
  return InferenceProviderDescriptorSchema.parse({
    capability: "reranker",
    provider: FIXTURE_RERANKER_PROVIDER_ID,
    status: options.enabled ? "available" : "unconfigured",
    execution: options.enabled ? "local" : "disabled",
    modelIds: options.enabled ? [modelId] : [],
    reasons: options.enabled
      ? []
      : ["Fixture inference is disabled by default."]
  });
}

export function createFixtureRerankerConfigurationReport(
  options: FixtureRerankerReportOptions
): InferenceProviderConfigurationReport {
  return InferenceProviderConfigurationReportSchema.parse({
    capability: "reranker",
    provider: FIXTURE_RERANKER_PROVIDER_ID,
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

function fixtureScore(query: string, text: string, index: number): number {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-z0-9_\-]/g, ""))
    .filter(Boolean);
  const normalizedText = text.toLowerCase();
  const matches = terms.filter((term) => normalizedText.includes(term)).length;
  const coverage = terms.length === 0 ? 0 : matches / terms.length;
  return Number((coverage + 1 / (index + 10)).toFixed(6));
}
