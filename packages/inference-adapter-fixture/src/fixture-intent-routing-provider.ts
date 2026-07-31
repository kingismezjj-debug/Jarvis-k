import type { IntentRoutingProvider } from "@jarvis-k/capabilities";
import {
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  IntentRoutingRequestSchema,
  IntentRoutingResultSchema,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor,
  type IntentRoutingRequest,
  type IntentRoutingResult
} from "@jarvis-k/contracts";

export const FIXTURE_INTENT_ROUTER_PROVIDER_ID = "intent-router.fixture";
export const FIXTURE_INTENT_ROUTER_MODEL_ID =
  "jarvis-fixture/local-intent-router-smoke";

export interface FixtureIntentRoutingProviderOptions {
  modelId?: string;
  now?: () => Date;
}

export interface FixtureIntentRouterReportOptions {
  enabled: boolean;
  modelId?: string;
}

export class FixtureIntentRoutingProvider
  implements IntentRoutingProvider
{
  private readonly modelId: string;
  private readonly now: () => Date;

  public constructor(options: FixtureIntentRoutingProviderOptions = {}) {
    this.modelId =
      options.modelId ?? FIXTURE_INTENT_ROUTER_MODEL_ID;
    this.now = options.now ?? (() => new Date());
  }

  public async route(
    request: IntentRoutingRequest
  ): Promise<IntentRoutingResult> {
    const parsed = IntentRoutingRequestSchema.parse(request);
    if (parsed.modelId !== this.modelId) {
      throw new Error(
        "Fixture intent router is not bound to this model."
      );
    }

    const candidate = routeFixtureIntent(parsed);
    const allowedIntents = parsed.context?.allowedIntents;
    const candidates =
      allowedIntents === undefined || allowedIntents.includes(candidate.intent)
        ? [candidate]
        : [];

    return IntentRoutingResultSchema.parse({
      modelId: parsed.modelId,
      utterance: parsed.utterance,
      candidates,
      routedAt: this.now().toISOString()
    });
  }
}

export function createFixtureIntentRouterDescriptor(
  options: FixtureIntentRouterReportOptions
): InferenceProviderDescriptor {
  const modelId = options.modelId ?? FIXTURE_INTENT_ROUTER_MODEL_ID;
  return InferenceProviderDescriptorSchema.parse({
    capability: "intent_router",
    provider: FIXTURE_INTENT_ROUTER_PROVIDER_ID,
    status: options.enabled ? "available" : "unconfigured",
    execution: options.enabled ? "local" : "disabled",
    modelIds: options.enabled ? [modelId] : [],
    reasons: options.enabled
      ? []
      : ["Fixture inference is disabled by default."]
  });
}

export function createFixtureIntentRouterConfigurationReport(
  options: FixtureIntentRouterReportOptions
): InferenceProviderConfigurationReport {
  return InferenceProviderConfigurationReportSchema.parse({
    capability: "intent_router",
    provider: FIXTURE_INTENT_ROUTER_PROVIDER_ID,
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

function routeFixtureIntent(
  request: IntentRoutingRequest
): {
  intent: string;
  confidence: number;
  slots: Record<string, unknown>;
  reasons: string[];
} {
  const normalized = request.utterance.toLowerCase();
  if (normalized.includes("memory") || normalized.includes("\u8bb0\u5fc6")) {
    return {
      intent: "memory.search",
      confidence: 0.98,
      slots: {},
      reasons: ["Matched deterministic memory fixture keyword."]
    };
  }
  if (normalized.includes("voice") || normalized.includes("\u8bed\u97f3")) {
    return {
      intent: "voice.control",
      confidence: 0.96,
      slots: {},
      reasons: ["Matched deterministic voice fixture keyword."]
    };
  }
  return {
    intent: "agent.help",
    confidence: 0.8,
    slots: {},
    reasons: ["Used deterministic fixture fallback intent."]
  };
}
