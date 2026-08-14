import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import {
  FetchOpenAiHeavyPlannerTransport,
  OPENAI_HEAVY_PLANNER_PROVIDER_ID,
  OpenAiHeavyPlannerProvider,
  type OpenAiHeavyPlannerCredential,
  type OpenAiHeavyPlannerTransport
} from "@jarvis-k/inference-adapter-openai-planner";

export type CoreHostOpenAiHeavyPlannerCompositionReasonCode =
  | "OPENAI_HEAVY_PLANNER_AVAILABLE"
  | "OPENAI_HEAVY_PLANNER_DISABLED"
  | "OPENAI_HEAVY_PLANNER_PROVIDER_NOT_APPROVED"
  | "OPENAI_HEAVY_PLANNER_SECURE_STORE_UNAVAILABLE"
  | "OPENAI_HEAVY_PLANNER_CREDENTIAL_MISSING"
  | "OPENAI_HEAVY_PLANNER_CREDENTIAL_EXPOSED"
  | "OPENAI_HEAVY_PLANNER_NETWORK_WINDOW_NOT_APPROVED"
  | "OPENAI_HEAVY_PLANNER_CONTRACT_NOT_READY"
  | "OPENAI_HEAVY_PLANNER_PARSER_NOT_READY"
  | "OPENAI_HEAVY_PLANNER_BOUNDS_NOT_READY"
  | "OPENAI_HEAVY_PLANNER_DEFAULT_OFF_NOT_PRESERVED"
  | "OPENAI_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED"
  | "OPENAI_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED";

export interface CoreHostOpenAiHeavyPlannerCompositionOptions {
  enabled: boolean;
  providerId?: string;
  secureCredentialStoreAvailable?: boolean;
  credential?: OpenAiHeavyPlannerCredential;
  credentialExposed?: boolean;
  networkWindowApproved?: boolean;
  contractReady?: boolean;
  parserReady?: boolean;
  timeoutAndOutputBoundsReady?: boolean;
  defaultOffPreserved?: boolean;
  qwenRulesFallbackPreserved?: boolean;
  executorOnlySideEffectsPreserved?: boolean;
  transport?: OpenAiHeavyPlannerTransport;
}

export interface CoreHostOpenAiHeavyPlannerCompositionReport {
  provider: typeof OPENAI_HEAVY_PLANNER_PROVIDER_ID;
  status: "available" | "unconfigured" | "disabled";
  gates: {
    explicitEnablement: boolean;
    providerExactlyApproved: boolean;
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
  reasonCodes: CoreHostOpenAiHeavyPlannerCompositionReasonCode[];
  directActionAttempted: false;
  credentialExposed: false;
  networkAccessed: false;
  defaultBehaviorChanged: false;
  uiIpcBehaviorChanged: false;
  telemetryChanged: false;
  releaseBehaviorChanged: false;
}

export interface CoreHostOpenAiHeavyPlannerComposition {
  compositionReport: CoreHostOpenAiHeavyPlannerCompositionReport;
  provider?: HeavyPlannerProvider;
}

export function createCoreHostOpenAiHeavyPlannerComposition(
  options: CoreHostOpenAiHeavyPlannerCompositionOptions
): CoreHostOpenAiHeavyPlannerComposition {
  const gates = {
    explicitEnablement: options.enabled === true,
    providerExactlyApproved:
      (options.providerId ?? OPENAI_HEAVY_PLANNER_PROVIDER_ID) ===
      OPENAI_HEAVY_PLANNER_PROVIDER_ID,
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
      ? new OpenAiHeavyPlannerProvider({
          credential,
          transport:
            options.transport ?? new FetchOpenAiHeavyPlannerTransport()
        })
      : undefined;

  return {
    compositionReport: {
      provider: OPENAI_HEAVY_PLANNER_PROVIDER_ID,
      status: available
        ? "available"
        : gates.explicitEnablement
          ? "unconfigured"
          : "disabled",
      gates,
      reasonCodes: available
        ? ["OPENAI_HEAVY_PLANNER_AVAILABLE"]
        : reasonCodes,
      directActionAttempted: false,
      credentialExposed: false,
      networkAccessed: false,
      defaultBehaviorChanged: false,
      uiIpcBehaviorChanged: false,
      telemetryChanged: false,
      releaseBehaviorChanged: false
    },
    ...(provider === undefined ? {} : { provider })
  };
}

function compositionReasonCodes(
  gates: CoreHostOpenAiHeavyPlannerCompositionReport["gates"]
): CoreHostOpenAiHeavyPlannerCompositionReasonCode[] {
  const reasonCodes: CoreHostOpenAiHeavyPlannerCompositionReasonCode[] = [];
  if (!gates.explicitEnablement) {
    reasonCodes.push("OPENAI_HEAVY_PLANNER_DISABLED");
  }
  if (!gates.providerExactlyApproved) {
    reasonCodes.push("OPENAI_HEAVY_PLANNER_PROVIDER_NOT_APPROVED");
  }
  if (!gates.secureCredentialStoreAvailable) {
    reasonCodes.push("OPENAI_HEAVY_PLANNER_SECURE_STORE_UNAVAILABLE");
  }
  if (!gates.credentialConfigured) {
    reasonCodes.push("OPENAI_HEAVY_PLANNER_CREDENTIAL_MISSING");
  }
  if (!gates.credentialNotExposed) {
    reasonCodes.push("OPENAI_HEAVY_PLANNER_CREDENTIAL_EXPOSED");
  }
  if (!gates.networkOneWindowApproved) {
    reasonCodes.push("OPENAI_HEAVY_PLANNER_NETWORK_WINDOW_NOT_APPROVED");
  }
  if (!gates.contractReady) {
    reasonCodes.push("OPENAI_HEAVY_PLANNER_CONTRACT_NOT_READY");
  }
  if (!gates.parserReady) {
    reasonCodes.push("OPENAI_HEAVY_PLANNER_PARSER_NOT_READY");
  }
  if (!gates.timeoutAndOutputBoundsReady) {
    reasonCodes.push("OPENAI_HEAVY_PLANNER_BOUNDS_NOT_READY");
  }
  if (!gates.defaultOffPreserved) {
    reasonCodes.push("OPENAI_HEAVY_PLANNER_DEFAULT_OFF_NOT_PRESERVED");
  }
  if (!gates.qwenRulesFallbackPreserved) {
    reasonCodes.push("OPENAI_HEAVY_PLANNER_FALLBACK_NOT_PRESERVED");
  }
  if (!gates.executorOnlySideEffectsPreserved) {
    reasonCodes.push(
      "OPENAI_HEAVY_PLANNER_EXECUTOR_ONLY_NOT_PRESERVED"
    );
  }
  return reasonCodes;
}

function isCredentialConfigured(
  credential: OpenAiHeavyPlannerCredential | undefined
): credential is OpenAiHeavyPlannerCredential {
  return (
    typeof credential?.apiKey === "string" &&
    credential.apiKey.trim().length >= 8 &&
    credential.apiKey.length <= 512
  );
}
