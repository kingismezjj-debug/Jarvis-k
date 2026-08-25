import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  AdvancedBrainPreparedRequestSchema,
  AdvancedBrainProviderCapabilityProfileSchema,
  AdvancedBrainProviderResultSchema,
  AdvancedBrainRequestSchema,
  type AdvancedBrainPreparedRequest,
  type AdvancedBrainProviderCapabilityProfile,
  type AdvancedBrainProviderResult,
  type AdvancedBrainRequest,
  type BrainPlan,
} from "@jarvis-k/contracts";
import type { AdvancedReasoningProvider } from "./ports";

export type FixtureAdvancedReasoningBehavior =
  | "answer"
  | "plan"
  | "clarification"
  | "unavailable"
  | "timeout"
  | "invalid_schema"
  | "tool_attempt";

export interface FixtureAdvancedReasoningProviderOptions {
  providerId?: string;
  modelId?: string;
  behavior?: FixtureAdvancedReasoningBehavior;
  now?: () => Date;
}

export class FixtureAdvancedReasoningProvider
  implements AdvancedReasoningProvider
{
  public readonly profile: AdvancedBrainProviderCapabilityProfile;
  private readonly behavior: FixtureAdvancedReasoningBehavior;
  private readonly now: () => Date;

  public constructor(options: FixtureAdvancedReasoningProviderOptions = {}) {
    this.behavior = options.behavior ?? "answer";
    this.now = options.now ?? (() => new Date());
    this.profile = createFixtureAdvancedBrainProfile({
      ...(options.providerId ? { providerId: options.providerId } : {}),
      ...(options.modelId ? { modelId: options.modelId } : {}),
    });
  }

  public async prepare(
    request: AdvancedBrainRequest,
  ): Promise<AdvancedBrainPreparedRequest> {
    const parsed = AdvancedBrainRequestSchema.parse(request);
    return AdvancedBrainPreparedRequestSchema.parse({
      request: parsed,
      providerId: this.profile.providerId,
      modelId: this.profile.modelId,
      acceptedAt: this.now().toISOString(),
      credentialExposed: false,
    });
  }

  public async execute(
    preparedRequest: AdvancedBrainPreparedRequest,
    options?: { signal?: AbortSignal },
  ): Promise<AdvancedBrainProviderResult> {
    const prepared = AdvancedBrainPreparedRequestSchema.parse(preparedRequest);
    if (this.behavior === "timeout") {
      return new Promise((resolve) => {
        options?.signal?.addEventListener(
          "abort",
          () => {
            resolve(
              this.result(prepared, {
                resultClass: "failed",
                reasonCode: "PROVIDER_CANCELLED",
              }),
            );
          },
          { once: true },
        );
      });
    }
    if (this.behavior === "invalid_schema") {
      return {
        providerId: this.profile.providerId,
        privatePath: "C:\\redacted",
      } as unknown as AdvancedBrainProviderResult;
    }
    if (this.behavior === "unavailable") {
      return this.result(prepared, {
        resultClass: "unavailable",
        reasonCode: "PROVIDER_UNAVAILABLE",
      });
    }
    if (this.behavior === "clarification") {
      return this.result(prepared, {
        resultClass: "clarification",
        reasonCode: "CLARIFY_REQUIRED",
        clarifyQuestion: "Which bounded outcome should Jarvis-K prepare?",
      });
    }
    if (this.behavior === "plan" || this.behavior === "tool_attempt") {
      return this.result(prepared, {
        resultClass: "structured_plan",
        reasonCode: "FIXTURE_PLAN",
        structuredPlan: structuredPlan(prepared),
        untrustedProposals:
          this.behavior === "tool_attempt"
            ? [
                {
                  proposalType: "tool_call",
                  proposalId: "fixture-tool-proposal",
                  requiresPlannerApproval: true,
                  directActionAttempted: false,
                },
              ]
            : [],
      });
    }
    return this.result(prepared, {
      resultClass: "answer",
      reasonCode: "FIXTURE_ANSWER",
      answer:
        "Fixture advanced answer: provider-neutral reasoning boundary is connected without network access.",
    });
  }

  public async cancel(_requestId: string, _reason?: string): Promise<void> {}

  private result(
    prepared: AdvancedBrainPreparedRequest,
    overrides: Partial<AdvancedBrainProviderResult>,
  ): AdvancedBrainProviderResult {
    return AdvancedBrainProviderResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      providerId: this.profile.providerId,
      modelId: this.profile.modelId,
      requestId: prepared.request.requestId,
      resultClass: "answer",
      reasonCode: "FIXTURE_ANSWER",
      answer:
        "Fixture advanced answer: provider-neutral reasoning boundary is connected without network access.",
      executionSemantics: "fixture",
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      localPathExposed: false,
      networkRequestIssued: false,
      completedAt: this.now().toISOString(),
      ...overrides,
    });
  }
}

export function createFixtureAdvancedBrainProfile(
  input: {
    providerId?: string;
    modelId?: string;
  } = {},
): AdvancedBrainProviderCapabilityProfile {
  return AdvancedBrainProviderCapabilityProfileSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: input.providerId ?? "advanced-brain.fixture",
    modelId: input.modelId ?? "advanced-brain-fixture-v1",
    inputModalities: ["text", "structured_context"],
    outputModalities: ["text", "structured_context"],
    supportsStructuredOutput: true,
    supportsFunctionCalling: false,
    supportsReasoning: true,
    supportsStreaming: false,
    supportsCancellation: true,
    maxContextClass: "medium",
    latencyClass: "interactive",
    costClass: "free",
    regionAvailability: ["local"],
    privacyClass: "fixture",
    taskCategories: [
      "advanced_chat",
      "coding",
      "research",
      "long_document",
      "multi_step_plan",
      "plugin_orchestration",
      "creative_generation",
      "visual_understanding",
    ],
    enabled: true,
    healthStatus: "healthy",
  });
}

function structuredPlan(prepared: AdvancedBrainPreparedRequest): BrainPlan {
  return {
    summary: `Fixture-only proposal for ${prepared.request.category}.`,
    risk: "medium",
    requiresConfirmation: true,
    steps: [
      {
        id: "advanced-fixture-step-1",
        toolId: "chat.answer",
        title: "Prepare a bounded provider-neutral response",
        args: {},
        risk: "medium",
        requiresConfirmation: true,
        directActionAttempted: false,
      },
    ],
    directActionAttempted: false,
  };
}
