import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import {
  FetchGlmRuntimeHeavyPlannerTransport,
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  GlmRuntimeHeavyPlannerProvider,
  type GlmRuntimeHeavyPlannerCredential,
  type GlmRuntimeHeavyPlannerTransport
} from "@jarvis-k/inference-adapter-glm-runtime";

export type CoreHostGlmRuntimeHeavyPlannerCompositionReasonCode =
  | "GLM_RUNTIME_HEAVY_PLANNER_AVAILABLE"
  | "GLM_RUNTIME_HEAVY_PLANNER_DISABLED"
  | "GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_NOT_APPROVED"
  | "GLM_RUNTIME_HEAVY_PLANNER_FIXED_PROFILE_NOT_APPROVED"
  | "GLM_RUNTIME_HEAVY_PLANNER_SECURE_STORE_UNAVAILABLE"
  | "GLM_RUNTIME_HEAVY_PLANNER_CREDENTIAL_MISSING"
  | "GLM_RUNTIME_HEAVY_PLANNER_CREDENTIAL_EXPOSED"
  | "GLM_RUNTIME_HEAVY_PLANNER_NETWORK_WINDOW_NOT_APPROVED"
  | "GLM_RUNTIME_HEAVY_PLANNER_CONTRACT_NOT_READY"
  | "GLM_RUNTIME_HEAVY_PLANNER_PARSER_NOT_READY"
  | "GLM_RUNTIME_HEAVY_PLANNER_BOUNDS_NOT_READY"
  | "GLM_RUNTIME_HEAVY_PLANNER_DEFAULT_OFF_NOT_PRESERVED"
  | "GLM_RUNTIME_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED"
  | "GLM_RUNTIME_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED";

export interface CoreHostGlmRuntimeHeavyPlannerCompositionOptions {
  enabled: boolean;
  providerId?: string;
  modelId?: string;
  fixedProfileApproved?: boolean;
  secureCredentialStoreAvailable?: boolean;
  credential?: GlmRuntimeHeavyPlannerCredential;
  credentialExposed?: boolean;
  networkWindowApproved?: boolean;
  contractReady?: boolean;
  parserReady?: boolean;
  timeoutAndOutputBoundsReady?: boolean;
  defaultOffPreserved?: boolean;
  qwenRulesFallbackPreserved?: boolean;
  executorOnlySideEffectsPreserved?: boolean;
  transport?: GlmRuntimeHeavyPlannerTransport;
}

export interface CoreHostGlmRuntimeHeavyPlannerCompositionReport {
  provider: typeof GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID;
  model: typeof GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID;
  status: "available" | "unconfigured" | "disabled";
  gates: {
    explicitEnablement: boolean;
    providerExactlyApproved: boolean;
    fixedProfileApproved: boolean;
    secureCredentialStoreAvailable: boolean;
    credentialConfigured: boolean;
    credentialNotExposed: boolean;
    networkOneWindowApproved: boolean;
    contractReady: boolean;
    parserReady: boolean;
    timeoutAndOutputBoundsReady: boolean;
    defaultOffPreserved: boolean;
    qwenRulesFallbackPreserved: boolean;
    executorOnlySideEffectsPreserved: boolean;
  };
  reasonCodes: CoreHostGlmRuntimeHeavyPlannerCompositionReasonCode[];
  directActionAttempted: false;
  credentialExposed: false;
  networkAccessed: false;
  realApiCalled: false;
  defaultBehaviorChanged: false;
  uiIpcBehaviorChanged: false;
  telemetryChanged: false;
  releaseBehaviorChanged: false;
}

export interface CoreHostGlmRuntimeHeavyPlannerComposition {
  compositionReport: CoreHostGlmRuntimeHeavyPlannerCompositionReport;
  provider?: HeavyPlannerProvider;
}

export function createCoreHostGlmRuntimeHeavyPlannerComposition(
  options: CoreHostGlmRuntimeHeavyPlannerCompositionOptions
): CoreHostGlmRuntimeHeavyPlannerComposition {
  const gates = {
    explicitEnablement: options.enabled === true,
    providerExactlyApproved:
      (options.providerId ?? GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID) ===
      GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    fixedProfileApproved:
      options.fixedProfileApproved === true &&
      (options.modelId ?? GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID) ===
        GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    secureCredentialStoreAvailable:
      options.secureCredentialStoreAvailable === true,
    credentialConfigured: isCredentialConfigured(options.credential),
    credentialNotExposed: options.credentialExposed !== true,
    networkOneWindowApproved: options.networkWindowApproved === true,
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
  const credential = options.credential;
  const provider =
    available && credential
      ? new GlmRuntimeHeavyPlannerProvider({
          credential,
          transport:
            options.transport ?? new FetchGlmRuntimeHeavyPlannerTransport()
        })
      : undefined;

  return {
    compositionReport: {
      provider: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
      model: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
      status: available
        ? "available"
        : gates.explicitEnablement
          ? "unconfigured"
          : "disabled",
      gates,
      reasonCodes: available
        ? ["GLM_RUNTIME_HEAVY_PLANNER_AVAILABLE"]
        : reasonCodes,
      directActionAttempted: false,
      credentialExposed: false,
      networkAccessed: false,
      realApiCalled: false,
      defaultBehaviorChanged: false,
      uiIpcBehaviorChanged: false,
      telemetryChanged: false,
      releaseBehaviorChanged: false
    },
    ...(provider === undefined ? {} : { provider })
  };
}

function compositionReasonCodes(
  gates: CoreHostGlmRuntimeHeavyPlannerCompositionReport["gates"]
): CoreHostGlmRuntimeHeavyPlannerCompositionReasonCode[] {
  const reasonCodes: CoreHostGlmRuntimeHeavyPlannerCompositionReasonCode[] =
    [];
  if (!gates.explicitEnablement) {
    reasonCodes.push("GLM_RUNTIME_HEAVY_PLANNER_DISABLED");
  }
  if (!gates.providerExactlyApproved) {
    reasonCodes.push("GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_NOT_APPROVED");
  }
  if (!gates.fixedProfileApproved) {
    reasonCodes.push("GLM_RUNTIME_HEAVY_PLANNER_FIXED_PROFILE_NOT_APPROVED");
  }
  if (!gates.secureCredentialStoreAvailable) {
    reasonCodes.push("GLM_RUNTIME_HEAVY_PLANNER_SECURE_STORE_UNAVAILABLE");
  }
  if (!gates.credentialConfigured) {
    reasonCodes.push("GLM_RUNTIME_HEAVY_PLANNER_CREDENTIAL_MISSING");
  }
  if (!gates.credentialNotExposed) {
    reasonCodes.push("GLM_RUNTIME_HEAVY_PLANNER_CREDENTIAL_EXPOSED");
  }
  if (!gates.networkOneWindowApproved) {
    reasonCodes.push(
      "GLM_RUNTIME_HEAVY_PLANNER_NETWORK_WINDOW_NOT_APPROVED"
    );
  }
  if (!gates.contractReady) {
    reasonCodes.push("GLM_RUNTIME_HEAVY_PLANNER_CONTRACT_NOT_READY");
  }
  if (!gates.parserReady) {
    reasonCodes.push("GLM_RUNTIME_HEAVY_PLANNER_PARSER_NOT_READY");
  }
  if (!gates.timeoutAndOutputBoundsReady) {
    reasonCodes.push("GLM_RUNTIME_HEAVY_PLANNER_BOUNDS_NOT_READY");
  }
  if (!gates.defaultOffPreserved) {
    reasonCodes.push(
      "GLM_RUNTIME_HEAVY_PLANNER_DEFAULT_OFF_NOT_PRESERVED"
    );
  }
  if (!gates.qwenRulesFallbackPreserved) {
    reasonCodes.push("GLM_RUNTIME_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED");
  }
  if (!gates.executorOnlySideEffectsPreserved) {
    reasonCodes.push(
      "GLM_RUNTIME_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED"
    );
  }
  return reasonCodes;
}

function isCredentialConfigured(
  credential: GlmRuntimeHeavyPlannerCredential | undefined
): credential is GlmRuntimeHeavyPlannerCredential {
  return (
    typeof credential?.apiKey === "string" &&
    credential.apiKey.trim().length >= 8 &&
    credential.apiKey.length <= 1024
  );
}
