import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  AdvancedBrainProviderCapabilityProfileSchema,
  AdvancedBrainSelectionResultSchema,
  type AdvancedBrainCapabilityRequirement,
  type AdvancedBrainCloudEgressPolicy,
  type AdvancedBrainModality,
  type AdvancedBrainProviderCapabilityProfile,
  type AdvancedBrainRegionAvailability,
  type AdvancedBrainRequestedOutput,
  type AdvancedBrainSelectionResult,
  type AdvancedBrainSelectionStrategy,
  type AdvancedBrainTaskCategory,
  type AdvancedBrainUserConsentEvidence,
  type CloudEgressDecision,
  type PrivacyRequirement,
} from "@jarvis-k/contracts";

export interface AdvancedBrainSelectionInput {
  category: AdvancedBrainTaskCategory;
  inputModalities: readonly AdvancedBrainModality[];
  requestedOutput: AdvancedBrainRequestedOutput;
  requiredCapabilities: readonly AdvancedBrainCapabilityRequirement[];
  privacyRequirement: PrivacyRequirement;
  cloudEgressPolicy: AdvancedBrainCloudEgressPolicy;
  userConsentEvidence?: AdvancedBrainUserConsentEvidence;
  strategy: AdvancedBrainSelectionStrategy;
  regionPreference?: AdvancedBrainRegionAvailability;
  providers: readonly AdvancedBrainProviderCapabilityProfile[];
  allowFixtureProviders?: boolean;
}

export class AdvancedBrainSelectionService {
  public select(input: AdvancedBrainSelectionInput): AdvancedBrainSelectionResult {
    const providers = input.providers.map((provider) =>
      AdvancedBrainProviderCapabilityProfileSchema.parse(provider),
    );
    const privacyGate = evaluatePrivacyGate(input);
    if (privacyGate.status !== "open") {
      return selection({
        status: privacyGate.status,
        reasonCode: privacyGate.reasonCode,
        cloudEgressDecision: privacyGate.cloudEgressDecision,
      });
    }

    const candidates = providers
      .filter((provider) => provider.enabled)
      .filter((provider) =>
        provider.healthStatus === "healthy" || provider.healthStatus === "degraded",
      )
      .filter((provider) =>
        input.allowFixtureProviders === true || provider.privacyClass !== "fixture",
      )
      .filter((provider) => provider.taskCategories.includes(input.category))
      .filter((provider) => supportsModalities(provider, input.inputModalities))
      .filter((provider) =>
        supportsRequestedOutput(provider, input.requestedOutput),
      )
      .filter((provider) =>
        input.requiredCapabilities.every((capability) =>
          supportsCapability(provider, capability),
        ),
      )
      .filter((provider) => providerPassesCloudPolicy(provider, input));

    if (candidates.length === 0) {
      return selection({
        status: "unavailable",
        reasonCode: providers.some(
          (provider) =>
            provider.enabled &&
            provider.healthStatus !== "healthy" &&
            provider.healthStatus !== "degraded",
        )
          ? "PROVIDER_UNHEALTHY"
          : "CAPABILITY_MISMATCH",
        cloudEgressDecision: cloudDecisionForNoSelection(input),
      });
    }

    const sorted = [...candidates].sort((a, b) =>
      compareProviders(a, b, input),
    );
    const selected = sorted[0];
    if (!selected) {
      return selection({
        status: "unavailable",
        reasonCode: "PROVIDER_UNAVAILABLE",
        cloudEgressDecision: "not_applicable",
      });
    }

    return selection({
      status: "selected",
      reasonCode: selectedReasonCode(input.strategy),
      selectedProviderId: selected.providerId,
      selectedModelId: selected.modelId,
      fallbackCandidates: sorted
        .slice(1, 9)
        .map((provider) => provider.providerId),
      cloudEgressDecision: cloudDecisionForSelected(selected, input),
    });
  }
}

type PrivacyGate =
  | {
      status: "open";
    }
  | {
      status: "confirmation_required" | "blocked";
      reasonCode: "CLOUD_CONFIRMATION_REQUIRED" | "PRIVACY_BLOCKED";
      cloudEgressDecision: CloudEgressDecision;
    };

function evaluatePrivacyGate(input: AdvancedBrainSelectionInput): PrivacyGate {
  if (
    input.privacyRequirement === "local_only" ||
    input.privacyRequirement === "cloud_prohibited" ||
    input.cloudEgressPolicy === "local_only" ||
    input.cloudEgressPolicy === "prohibit_cloud"
  ) {
    return { status: "open" };
  }
  if (
    input.privacyRequirement === "cloud_requires_confirmation" ||
    input.cloudEgressPolicy === "require_confirmation"
  ) {
    if (input.userConsentEvidence) {
      return { status: "open" };
    }
    return {
      status: "confirmation_required",
      reasonCode: "CLOUD_CONFIRMATION_REQUIRED",
      cloudEgressDecision: "confirmation_required",
    };
  }
  return { status: "open" };
}

function supportsModalities(
  provider: AdvancedBrainProviderCapabilityProfile,
  inputModalities: readonly AdvancedBrainModality[],
): boolean {
  return inputModalities.every((modality) =>
    provider.inputModalities.includes(modality),
  );
}

function supportsRequestedOutput(
  provider: AdvancedBrainProviderCapabilityProfile,
  requestedOutput: AdvancedBrainRequestedOutput,
): boolean {
  if (requestedOutput === "structured_plan") {
    return provider.supportsStructuredOutput;
  }
  return provider.outputModalities.includes("text");
}

function supportsCapability(
  provider: AdvancedBrainProviderCapabilityProfile,
  capability: AdvancedBrainCapabilityRequirement,
): boolean {
  switch (capability) {
    case "text_reasoning":
      return provider.inputModalities.includes("text");
    case "structured_output":
      return provider.supportsStructuredOutput;
    case "function_calling":
      return provider.supportsFunctionCalling;
    case "reasoning":
      return provider.supportsReasoning;
    case "streaming":
      return provider.supportsStreaming;
    case "cancellation":
      return provider.supportsCancellation;
    case "vision_understanding":
      return (
        provider.inputModalities.includes("image") &&
        provider.taskCategories.includes("visual_understanding")
      );
    case "file_reference_only":
      return provider.inputModalities.includes("file_reference");
    default:
      return false;
  }
}

function providerPassesCloudPolicy(
  provider: AdvancedBrainProviderCapabilityProfile,
  input: AdvancedBrainSelectionInput,
): boolean {
  if (provider.privacyClass !== "cloud") {
    return true;
  }
  if (
    input.privacyRequirement === "local_only" ||
    input.privacyRequirement === "cloud_prohibited" ||
    input.cloudEgressPolicy === "local_only" ||
    input.cloudEgressPolicy === "prohibit_cloud"
  ) {
    return false;
  }
  if (
    input.privacyRequirement === "cloud_requires_confirmation" ||
    input.cloudEgressPolicy === "require_confirmation"
  ) {
    return Boolean(input.userConsentEvidence);
  }
  return input.cloudEgressPolicy === "allow_cloud";
}

function compareProviders(
  a: AdvancedBrainProviderCapabilityProfile,
  b: AdvancedBrainProviderCapabilityProfile,
  input: AdvancedBrainSelectionInput,
): number {
  const strategyScore = scoreForStrategy(input.strategy, input.regionPreference);
  const scoreDiff = strategyScore(b) - strategyScore(a);
  if (scoreDiff !== 0) {
    return scoreDiff;
  }
  const providerDiff = a.providerId.localeCompare(b.providerId);
  if (providerDiff !== 0) {
    return providerDiff;
  }
  return a.modelId.localeCompare(b.modelId);
}

function scoreForStrategy(
  strategy: AdvancedBrainSelectionStrategy,
  regionPreference: AdvancedBrainRegionAvailability | undefined,
): (provider: AdvancedBrainProviderCapabilityProfile) => number {
  switch (strategy) {
    case "local_first":
      return (provider) => privacyScore(provider.privacyClass);
    case "mainland_first":
      return (provider) =>
        provider.regionAvailability.includes(regionPreference ?? "mainland_china")
          ? 100
          : 0;
    case "quality_first":
      return (provider) =>
        contextScore(provider.maxContextClass) +
        (provider.supportsReasoning ? 20 : 0) +
        (provider.supportsStructuredOutput ? 10 : 0);
    case "cost_first":
      return (provider) => costScore(provider.costClass);
    case "custom":
      return () => 0;
    default:
      return () => 0;
  }
}

function privacyScore(
  privacyClass: AdvancedBrainProviderCapabilityProfile["privacyClass"],
): number {
  switch (privacyClass) {
    case "local":
      return 100;
    case "fixture":
      return 80;
    case "unavailable":
      return 20;
    case "cloud":
      return 0;
    default:
      return 0;
  }
}

function contextScore(
  contextClass: AdvancedBrainProviderCapabilityProfile["maxContextClass"],
): number {
  switch (contextClass) {
    case "very_long":
      return 40;
    case "long":
      return 30;
    case "medium":
      return 20;
    case "short":
      return 10;
    default:
      return 0;
  }
}

function costScore(
  costClass: AdvancedBrainProviderCapabilityProfile["costClass"],
): number {
  switch (costClass) {
    case "free":
      return 40;
    case "low":
      return 30;
    case "medium":
      return 20;
    case "high":
      return 10;
    default:
      return 0;
  }
}

function selectedReasonCode(strategy: AdvancedBrainSelectionStrategy) {
  switch (strategy) {
    case "local_first":
      return "SELECTED_LOCAL_FIRST" as const;
    case "mainland_first":
      return "SELECTED_MAINLAND_FIRST" as const;
    case "quality_first":
      return "SELECTED_QUALITY_FIRST" as const;
    case "cost_first":
      return "SELECTED_COST_FIRST" as const;
    case "custom":
      return "SELECTED_CUSTOM" as const;
    default:
      return "SELECTED_CUSTOM" as const;
  }
}

function cloudDecisionForSelected(
  provider: AdvancedBrainProviderCapabilityProfile,
  input: AdvancedBrainSelectionInput,
): CloudEgressDecision {
  if (provider.privacyClass !== "cloud") {
    return "not_applicable";
  }
  if (
    input.privacyRequirement === "cloud_requires_confirmation" ||
    input.cloudEgressPolicy === "require_confirmation"
  ) {
    return input.userConsentEvidence ? "allowed" : "confirmation_required";
  }
  if (
    input.privacyRequirement === "local_only" ||
    input.privacyRequirement === "cloud_prohibited" ||
    input.cloudEgressPolicy === "local_only" ||
    input.cloudEgressPolicy === "prohibit_cloud"
  ) {
    return "blocked";
  }
  return "allowed";
}

function cloudDecisionForNoSelection(
  input: AdvancedBrainSelectionInput,
): CloudEgressDecision {
  if (
    input.privacyRequirement === "local_only" ||
    input.privacyRequirement === "cloud_prohibited" ||
    input.cloudEgressPolicy === "local_only" ||
    input.cloudEgressPolicy === "prohibit_cloud"
  ) {
    return "blocked";
  }
  if (
    input.privacyRequirement === "cloud_requires_confirmation" ||
    input.cloudEgressPolicy === "require_confirmation"
  ) {
    return input.userConsentEvidence ? "allowed" : "confirmation_required";
  }
  return "not_applicable";
}

type SelectionInput = Omit<
  AdvancedBrainSelectionResult,
  | "schemaVersion"
  | "automaticFallbackAllowed"
  | "directExecutionAllowed"
  | "fallbackCandidates"
> & {
  fallbackCandidates?: string[];
};

function selection(input: SelectionInput): AdvancedBrainSelectionResult {
  return AdvancedBrainSelectionResultSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    fallbackCandidates: [],
    ...input,
    automaticFallbackAllowed: false,
    directExecutionAllowed: false,
  });
}
