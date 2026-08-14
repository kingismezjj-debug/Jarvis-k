import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import {
  OpenAiCompatibleFixtureHeavyPlannerProvider,
  getOpenAiCompatibleHeavyPlannerProfile,
  type OpenAiCompatibleHeavyPlannerFixtureTransport,
  type OpenAiCompatibleHeavyPlannerProfile,
  type OpenAiCompatibleHeavyPlannerProfileId,
  type OpenAiCompatibleHeavyPlannerProviderId
} from "@jarvis-k/inference-adapter-openai-planner";

export type CoreHostOpenAiCompatibleHeavyPlannerCompositionReasonCode =
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_FIXTURE_AVAILABLE"
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_FIXTURE_DISABLED"
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_PROFILE_NOT_APPROVED"
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_FIXTURE_TRANSPORT_MISSING"
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_NETWORK_ACCESS_NOT_DISABLED"
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_REAL_CREDENTIAL_ACCESS_NOT_DISABLED"
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_CONTRACT_NOT_READY"
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_PARSER_NOT_READY"
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_BOUNDS_NOT_READY"
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_DEFAULT_OFF_NOT_PRESERVED"
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED"
  | "OPENAI_COMPATIBLE_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED";

export interface CoreHostOpenAiCompatibleHeavyPlannerCompositionOptions {
  readonly enabled: boolean;
  readonly profileId?: OpenAiCompatibleHeavyPlannerProfileId;
  readonly fixtureTransport?: OpenAiCompatibleHeavyPlannerFixtureTransport;
  readonly networkAccessDisabled?: boolean;
  readonly realCredentialAccessDisabled?: boolean;
  readonly contractReady?: boolean;
  readonly parserReady?: boolean;
  readonly timeoutAndOutputBoundsReady?: boolean;
  readonly defaultOffPreserved?: boolean;
  readonly qwenRulesFallbackPreserved?: boolean;
  readonly executorOnlySideEffectsPreserved?: boolean;
}

export interface CoreHostOpenAiCompatibleHeavyPlannerCompositionReport {
  readonly provider: OpenAiCompatibleHeavyPlannerProviderId;
  readonly profileId: OpenAiCompatibleHeavyPlannerProfileId;
  readonly family: OpenAiCompatibleHeavyPlannerProfile["family"];
  readonly selectedModelId: string;
  readonly status: "available" | "unconfigured" | "disabled";
  readonly gates: {
    readonly explicitEnablement: boolean;
    readonly profileExactlyApproved: boolean;
    readonly profileDefaultOff: boolean;
    readonly exactRuntimeApprovalRequired: boolean;
    readonly fixtureTransportInjected: boolean;
    readonly networkAccessDisabled: boolean;
    readonly realCredentialAccessDisabled: boolean;
    readonly contractReady: boolean;
    readonly parserReady: boolean;
    readonly timeoutAndOutputBoundsReady: boolean;
    readonly defaultOffPreserved: boolean;
    readonly qwenRulesFallbackPreserved: boolean;
    readonly executorOnlySideEffectsPreserved: boolean;
  };
  readonly reasonCodes: CoreHostOpenAiCompatibleHeavyPlannerCompositionReasonCode[];
  readonly directActionAttempted: false;
  readonly credentialExposed: false;
  readonly networkAccessed: false;
  readonly realApiCalled: false;
  readonly modelRuntimeAccessed: false;
  readonly defaultBehaviorChanged: false;
  readonly uiIpcBehaviorChanged: false;
  readonly telemetryChanged: false;
  readonly releaseBehaviorChanged: false;
}

export interface CoreHostOpenAiCompatibleHeavyPlannerComposition {
  readonly compositionReport: CoreHostOpenAiCompatibleHeavyPlannerCompositionReport;
  readonly provider?: HeavyPlannerProvider;
}

export function createCoreHostOpenAiCompatibleHeavyPlannerComposition(
  options: CoreHostOpenAiCompatibleHeavyPlannerCompositionOptions
): CoreHostOpenAiCompatibleHeavyPlannerComposition {
  const profile = getOpenAiCompatibleHeavyPlannerProfile(
    options.profileId ?? "deepseek.v4-flash"
  );
  const gates = {
    explicitEnablement: options.enabled === true,
    profileExactlyApproved:
      options.profileId === undefined ||
      options.profileId === profile.profileId,
    profileDefaultOff: profile.runtimeDefaultEnabled === false,
    exactRuntimeApprovalRequired:
      profile.exactRuntimeApprovalRequired === true,
    fixtureTransportInjected: options.fixtureTransport !== undefined,
    networkAccessDisabled: options.networkAccessDisabled === true,
    realCredentialAccessDisabled:
      options.realCredentialAccessDisabled === true,
    contractReady: options.contractReady === true,
    parserReady: options.parserReady === true,
    timeoutAndOutputBoundsReady:
      options.timeoutAndOutputBoundsReady === true,
    defaultOffPreserved: options.defaultOffPreserved !== false,
    qwenRulesFallbackPreserved:
      options.qwenRulesFallbackPreserved === true,
    executorOnlySideEffectsPreserved:
      options.executorOnlySideEffectsPreserved === true
  };
  const reasonCodes = compositionReasonCodes(gates);
  const available = reasonCodes.length === 0;
  const provider =
    available && options.fixtureTransport !== undefined
      ? new OpenAiCompatibleFixtureHeavyPlannerProvider({
          profileId: profile.profileId,
          transport: options.fixtureTransport
        })
      : undefined;

  return {
    compositionReport: {
      provider: profile.providerId,
      profileId: profile.profileId,
      family: profile.family,
      selectedModelId: profile.defaultModelId,
      status: available
        ? "available"
        : gates.explicitEnablement
          ? "unconfigured"
          : "disabled",
      gates,
      reasonCodes: available
        ? ["OPENAI_COMPATIBLE_HEAVY_PLANNER_FIXTURE_AVAILABLE"]
        : reasonCodes,
      directActionAttempted: false,
      credentialExposed: false,
      networkAccessed: false,
      realApiCalled: false,
      modelRuntimeAccessed: false,
      defaultBehaviorChanged: false,
      uiIpcBehaviorChanged: false,
      telemetryChanged: false,
      releaseBehaviorChanged: false
    },
    ...(provider === undefined ? {} : { provider })
  };
}

function compositionReasonCodes(
  gates: CoreHostOpenAiCompatibleHeavyPlannerCompositionReport["gates"]
): CoreHostOpenAiCompatibleHeavyPlannerCompositionReasonCode[] {
  const reasonCodes: CoreHostOpenAiCompatibleHeavyPlannerCompositionReasonCode[] =
    [];
  if (!gates.explicitEnablement) {
    reasonCodes.push("OPENAI_COMPATIBLE_HEAVY_PLANNER_FIXTURE_DISABLED");
  }
  if (!gates.profileExactlyApproved) {
    reasonCodes.push("OPENAI_COMPATIBLE_HEAVY_PLANNER_PROFILE_NOT_APPROVED");
  }
  if (!gates.fixtureTransportInjected) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_HEAVY_PLANNER_FIXTURE_TRANSPORT_MISSING"
    );
  }
  if (!gates.networkAccessDisabled) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_HEAVY_PLANNER_NETWORK_ACCESS_NOT_DISABLED"
    );
  }
  if (!gates.realCredentialAccessDisabled) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_HEAVY_PLANNER_REAL_CREDENTIAL_ACCESS_NOT_DISABLED"
    );
  }
  if (!gates.contractReady) {
    reasonCodes.push("OPENAI_COMPATIBLE_HEAVY_PLANNER_CONTRACT_NOT_READY");
  }
  if (!gates.parserReady) {
    reasonCodes.push("OPENAI_COMPATIBLE_HEAVY_PLANNER_PARSER_NOT_READY");
  }
  if (!gates.timeoutAndOutputBoundsReady) {
    reasonCodes.push("OPENAI_COMPATIBLE_HEAVY_PLANNER_BOUNDS_NOT_READY");
  }
  if (!gates.defaultOffPreserved || !gates.profileDefaultOff) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_HEAVY_PLANNER_DEFAULT_OFF_NOT_PRESERVED"
    );
  }
  if (!gates.qwenRulesFallbackPreserved) {
    reasonCodes.push("OPENAI_COMPATIBLE_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED");
  }
  if (!gates.executorOnlySideEffectsPreserved) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED"
    );
  }
  if (!gates.exactRuntimeApprovalRequired) {
    reasonCodes.push("OPENAI_COMPATIBLE_HEAVY_PLANNER_PROFILE_NOT_APPROVED");
  }
  return [...new Set(reasonCodes)];
}
