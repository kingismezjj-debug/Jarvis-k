import type { AdvancedReasoningProvider } from "@jarvis-k/capabilities";
import {
  DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
  DeepSeekAdvancedReasoningProvider,
  createDeepSeekAdvancedReasoningEndpointProfile,
  isDeepSeekAdvancedBrainModelId,
  type DeepSeekAdvancedReasoningCredentialProvider,
  type DeepSeekAdvancedReasoningTransport,
} from "@jarvis-k/inference-adapter-deepseek-runtime";
import type { RuntimeConfig } from "../config/runtime-config";

export type CoreHostDeepSeekAdvancedBrainCompositionReasonCode =
  | "DEEPSEEK_ADVANCED_BRAIN_AVAILABLE"
  | "DEEPSEEK_ADVANCED_BRAIN_DISABLED"
  | "DEEPSEEK_ADVANCED_BRAIN_MODEL_UNCONFIGURED"
  | "DEEPSEEK_ADVANCED_BRAIN_MODEL_UNSUPPORTED"
  | "DEEPSEEK_ADVANCED_BRAIN_CREDENTIAL_PROVIDER_MISSING"
  | "DEEPSEEK_ADVANCED_BRAIN_TRANSPORT_MISSING"
  | "DEEPSEEK_ADVANCED_BRAIN_ENDPOINT_PROFILE_INVALID"
  | "DEEPSEEK_ADVANCED_BRAIN_DEFAULT_OFF_NOT_PRESERVED"
  | "DEEPSEEK_ADVANCED_BRAIN_PRODUCT_ROUTING_UNCHANGED";

export interface CoreHostDeepSeekAdvancedBrainCompositionOptions {
  readonly runtimeConfig: RuntimeConfig;
  readonly credentialProvider?: DeepSeekAdvancedReasoningCredentialProvider;
  readonly transport?: DeepSeekAdvancedReasoningTransport;
  readonly productRoutingChanged?: boolean;
  readonly now?: () => Date;
}

export interface CoreHostDeepSeekAdvancedBrainCompositionReport {
  readonly provider: typeof DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID;
  readonly model?: string;
  readonly status: "available" | "unconfigured" | "disabled";
  readonly gates: {
    readonly explicitEnablement: boolean;
    readonly modelConfigured: boolean;
    readonly modelSupported: boolean;
    readonly credentialProviderConfigured: boolean;
    readonly transportConfigured: boolean;
    readonly endpointProfileValid: boolean;
    readonly defaultOffPreserved: boolean;
    readonly productRoutingUnchanged: boolean;
  };
  readonly reasonCodes: readonly CoreHostDeepSeekAdvancedBrainCompositionReasonCode[];
  readonly directActionAttempted: false;
  readonly credentialExposed: false;
  readonly networkAccessed: false;
  readonly realApiCalled: false;
  readonly automaticRetry: false;
  readonly automaticFallback: false;
}

export interface CoreHostDeepSeekAdvancedBrainComposition {
  readonly compositionReport: CoreHostDeepSeekAdvancedBrainCompositionReport;
  readonly provider?: AdvancedReasoningProvider;
}

export function createCoreHostDeepSeekAdvancedBrainComposition(
  options: CoreHostDeepSeekAdvancedBrainCompositionOptions,
): CoreHostDeepSeekAdvancedBrainComposition {
  const modelId = options.runtimeConfig.deepSeekAdvancedBrainModelId?.trim();
  const selectedModelId =
    modelId !== undefined && isDeepSeekAdvancedBrainModelId(modelId)
      ? modelId
      : undefined;
  const endpointProfile = createDeepSeekAdvancedReasoningEndpointProfile();
  const gates = {
    explicitEnablement: options.runtimeConfig.deepSeekAdvancedBrainEnabled,
    modelConfigured: typeof modelId === "string" && modelId.length > 0,
    modelSupported: selectedModelId !== undefined,
    credentialProviderConfigured: options.credentialProvider !== undefined,
    transportConfigured: options.transport !== undefined,
    endpointProfileValid:
      endpointProfile.providerId === DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
    defaultOffPreserved:
      options.runtimeConfig.env.JARVIS_K_ENABLE_ADVANCED_BRAIN_DEEPSEEK ===
        undefined ||
      options.runtimeConfig.deepSeekAdvancedBrainEnabled === false ||
      options.runtimeConfig.mode !== "production",
    productRoutingUnchanged: options.productRoutingChanged !== true,
  };
  const reasonCodes = compositionReasonCodes(gates);
  const available = reasonCodes.length === 0;
  const provider =
    available && options.credentialProvider && options.transport && selectedModelId
      ? new DeepSeekAdvancedReasoningProvider({
          enabled: true,
          modelId: selectedModelId,
          credentialProvider: options.credentialProvider,
          transport: options.transport,
          ...(options.now ? { now: options.now } : {}),
        })
      : undefined;

  return {
    compositionReport: {
      provider: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
      ...(modelId ? { model: modelId } : {}),
      status: available
        ? "available"
        : gates.explicitEnablement
          ? "unconfigured"
          : "disabled",
      gates,
      reasonCodes: available
        ? ["DEEPSEEK_ADVANCED_BRAIN_AVAILABLE"]
        : reasonCodes,
      directActionAttempted: false,
      credentialExposed: false,
      networkAccessed: false,
      realApiCalled: false,
      automaticRetry: false,
      automaticFallback: false,
    },
    ...(provider === undefined ? {} : { provider }),
  };
}

function compositionReasonCodes(
  gates: CoreHostDeepSeekAdvancedBrainCompositionReport["gates"],
): CoreHostDeepSeekAdvancedBrainCompositionReasonCode[] {
  const reasonCodes: CoreHostDeepSeekAdvancedBrainCompositionReasonCode[] = [];
  if (!gates.explicitEnablement) {
    reasonCodes.push("DEEPSEEK_ADVANCED_BRAIN_DISABLED");
  }
  if (!gates.modelConfigured) {
    reasonCodes.push("DEEPSEEK_ADVANCED_BRAIN_MODEL_UNCONFIGURED");
  }
  if (!gates.modelSupported) {
    reasonCodes.push("DEEPSEEK_ADVANCED_BRAIN_MODEL_UNSUPPORTED");
  }
  if (!gates.credentialProviderConfigured) {
    reasonCodes.push("DEEPSEEK_ADVANCED_BRAIN_CREDENTIAL_PROVIDER_MISSING");
  }
  if (!gates.transportConfigured) {
    reasonCodes.push("DEEPSEEK_ADVANCED_BRAIN_TRANSPORT_MISSING");
  }
  if (!gates.endpointProfileValid) {
    reasonCodes.push("DEEPSEEK_ADVANCED_BRAIN_ENDPOINT_PROFILE_INVALID");
  }
  if (!gates.defaultOffPreserved) {
    reasonCodes.push("DEEPSEEK_ADVANCED_BRAIN_DEFAULT_OFF_NOT_PRESERVED");
  }
  if (!gates.productRoutingUnchanged) {
    reasonCodes.push("DEEPSEEK_ADVANCED_BRAIN_PRODUCT_ROUTING_UNCHANGED");
  }
  return reasonCodes;
}
