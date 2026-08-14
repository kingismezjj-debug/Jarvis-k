import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import {
  GLM_HEAVY_PLANNER_PROVIDER_ID,
  GlmHeavyPlannerProvider,
  isGlmHeavyPlannerFixtureCredential,
  type GlmHeavyPlannerFixtureCredential,
  type GlmHeavyPlannerFixtureTransport
} from "@jarvis-k/inference-adapter-glm-planner";

export type CoreHostGlmHeavyPlannerCompositionReasonCode =
  | "GLM_HEAVY_PLANNER_FIXTURE_AVAILABLE"
  | "GLM_HEAVY_PLANNER_FIXTURE_DISABLED"
  | "GLM_HEAVY_PLANNER_PROVIDER_NOT_APPROVED"
  | "GLM_HEAVY_PLANNER_FIXTURE_CREDENTIAL_MISSING"
  | "GLM_HEAVY_PLANNER_CREDENTIAL_EXPOSED"
  | "GLM_HEAVY_PLANNER_FIXTURE_TRANSPORT_MISSING"
  | "GLM_HEAVY_PLANNER_NETWORK_ACCESS_NOT_DISABLED"
  | "GLM_HEAVY_PLANNER_REAL_CREDENTIAL_ACCESS_NOT_DISABLED"
  | "GLM_HEAVY_PLANNER_CONTRACT_NOT_READY"
  | "GLM_HEAVY_PLANNER_PARSER_NOT_READY"
  | "GLM_HEAVY_PLANNER_BOUNDS_NOT_READY"
  | "GLM_HEAVY_PLANNER_DEFAULT_OFF_NOT_PRESERVED"
  | "GLM_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED"
  | "GLM_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED";

export interface CoreHostGlmHeavyPlannerCompositionOptions {
  enabled: boolean;
  providerId?: string;
  fixtureCredential?: GlmHeavyPlannerFixtureCredential;
  credentialExposed?: boolean;
  fixtureTransport?: GlmHeavyPlannerFixtureTransport;
  networkAccessDisabled?: boolean;
  realCredentialAccessDisabled?: boolean;
  contractReady?: boolean;
  parserReady?: boolean;
  timeoutAndOutputBoundsReady?: boolean;
  defaultOffPreserved?: boolean;
  qwenRulesFallbackPreserved?: boolean;
  executorOnlySideEffectsPreserved?: boolean;
}

export interface CoreHostGlmHeavyPlannerCompositionReport {
  provider: typeof GLM_HEAVY_PLANNER_PROVIDER_ID;
  status: "available" | "unconfigured" | "disabled";
  gates: {
    explicitEnablement: boolean;
    providerExactlyApproved: boolean;
    fixtureCredentialConfigured: boolean;
    credentialNotExposed: boolean;
    fixtureTransportInjected: boolean;
    networkAccessDisabled: boolean;
    realCredentialAccessDisabled: boolean;
    contractReady: boolean;
    parserReady: boolean;
    timeoutAndOutputBoundsReady: boolean;
    defaultOffPreserved: boolean;
    qwenRulesFallbackPreserved: boolean;
    executorOnlySideEffectsPreserved: boolean;
  };
  reasonCodes: CoreHostGlmHeavyPlannerCompositionReasonCode[];
  directActionAttempted: false;
  credentialExposed: false;
  networkAccessed: false;
  realApiCalled: false;
  modelRuntimeAccessed: false;
  defaultBehaviorChanged: false;
  uiIpcBehaviorChanged: false;
  telemetryChanged: false;
  releaseBehaviorChanged: false;
}

export interface CoreHostGlmHeavyPlannerComposition {
  compositionReport: CoreHostGlmHeavyPlannerCompositionReport;
  provider?: HeavyPlannerProvider;
}

export function createCoreHostGlmHeavyPlannerComposition(
  options: CoreHostGlmHeavyPlannerCompositionOptions
): CoreHostGlmHeavyPlannerComposition {
  const gates = {
    explicitEnablement: options.enabled === true,
    providerExactlyApproved:
      (options.providerId ?? GLM_HEAVY_PLANNER_PROVIDER_ID) ===
      GLM_HEAVY_PLANNER_PROVIDER_ID,
    fixtureCredentialConfigured: isGlmHeavyPlannerFixtureCredential(
      options.fixtureCredential
    ),
    credentialNotExposed: options.credentialExposed !== true,
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
    available &&
    options.fixtureCredential !== undefined &&
    options.fixtureTransport !== undefined
      ? new GlmHeavyPlannerProvider({
          credential: options.fixtureCredential,
          transport: options.fixtureTransport
        })
      : undefined;

  return {
    compositionReport: {
      provider: GLM_HEAVY_PLANNER_PROVIDER_ID,
      status: available
        ? "available"
        : gates.explicitEnablement
          ? "unconfigured"
          : "disabled",
      gates,
      reasonCodes: available
        ? ["GLM_HEAVY_PLANNER_FIXTURE_AVAILABLE"]
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
  gates: CoreHostGlmHeavyPlannerCompositionReport["gates"]
): CoreHostGlmHeavyPlannerCompositionReasonCode[] {
  const reasonCodes: CoreHostGlmHeavyPlannerCompositionReasonCode[] = [];
  if (!gates.explicitEnablement) {
    reasonCodes.push("GLM_HEAVY_PLANNER_FIXTURE_DISABLED");
  }
  if (!gates.providerExactlyApproved) {
    reasonCodes.push("GLM_HEAVY_PLANNER_PROVIDER_NOT_APPROVED");
  }
  if (!gates.fixtureCredentialConfigured) {
    reasonCodes.push("GLM_HEAVY_PLANNER_FIXTURE_CREDENTIAL_MISSING");
  }
  if (!gates.credentialNotExposed) {
    reasonCodes.push("GLM_HEAVY_PLANNER_CREDENTIAL_EXPOSED");
  }
  if (!gates.fixtureTransportInjected) {
    reasonCodes.push("GLM_HEAVY_PLANNER_FIXTURE_TRANSPORT_MISSING");
  }
  if (!gates.networkAccessDisabled) {
    reasonCodes.push("GLM_HEAVY_PLANNER_NETWORK_ACCESS_NOT_DISABLED");
  }
  if (!gates.realCredentialAccessDisabled) {
    reasonCodes.push(
      "GLM_HEAVY_PLANNER_REAL_CREDENTIAL_ACCESS_NOT_DISABLED"
    );
  }
  if (!gates.contractReady) {
    reasonCodes.push("GLM_HEAVY_PLANNER_CONTRACT_NOT_READY");
  }
  if (!gates.parserReady) {
    reasonCodes.push("GLM_HEAVY_PLANNER_PARSER_NOT_READY");
  }
  if (!gates.timeoutAndOutputBoundsReady) {
    reasonCodes.push("GLM_HEAVY_PLANNER_BOUNDS_NOT_READY");
  }
  if (!gates.defaultOffPreserved) {
    reasonCodes.push("GLM_HEAVY_PLANNER_DEFAULT_OFF_NOT_PRESERVED");
  }
  if (!gates.qwenRulesFallbackPreserved) {
    reasonCodes.push("GLM_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED");
  }
  if (!gates.executorOnlySideEffectsPreserved) {
    reasonCodes.push(
      "GLM_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED"
    );
  }
  return reasonCodes;
}
