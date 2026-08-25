import type { AdvancedReasoningProvider } from "@jarvis-k/capabilities";
import {
  GLM_ADVANCED_BRAIN_DEFAULT_MODEL_ID,
  GLM_ADVANCED_BRAIN_PROVIDER_ID,
  GlmAdvancedReasoningProvider,
  createGlmAdvancedReasoningEndpointProfile,
  isGlmProviderModelCandidateId,
  type GlmAdvancedReasoningCredentialProvider,
  type GlmAdvancedReasoningTransport,
} from "@jarvis-k/inference-adapter-glm-runtime";
import type { RuntimeConfig } from "../config/runtime-config";

export type CoreHostGlmAdvancedBrainCompositionReasonCode =
  | "GLM_ADVANCED_BRAIN_AVAILABLE"
  | "GLM_ADVANCED_BRAIN_DISABLED"
  | "GLM_ADVANCED_BRAIN_MODEL_UNCONFIGURED"
  | "GLM_ADVANCED_BRAIN_MODEL_UNSUPPORTED"
  | "GLM_ADVANCED_BRAIN_CREDENTIAL_PROVIDER_MISSING"
  | "GLM_ADVANCED_BRAIN_TRANSPORT_MISSING"
  | "GLM_ADVANCED_BRAIN_ENDPOINT_PROFILE_INVALID"
  | "GLM_ADVANCED_BRAIN_DEFAULT_OFF_NOT_PRESERVED"
  | "GLM_ADVANCED_BRAIN_PRODUCT_ROUTING_UNCHANGED";

export interface CoreHostGlmAdvancedBrainCompositionOptions {
  readonly runtimeConfig: RuntimeConfig;
  readonly credentialProvider?: GlmAdvancedReasoningCredentialProvider;
  readonly transport?: GlmAdvancedReasoningTransport;
  readonly productRoutingChanged?: boolean;
  readonly now?: () => Date;
}

export interface CoreHostGlmAdvancedBrainCompositionReport {
  readonly provider: typeof GLM_ADVANCED_BRAIN_PROVIDER_ID;
  readonly model: string;
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
  readonly reasonCodes: readonly CoreHostGlmAdvancedBrainCompositionReasonCode[];
  readonly directActionAttempted: false;
  readonly credentialExposed: false;
  readonly networkAccessed: false;
  readonly realApiCalled: false;
  readonly automaticRetry: false;
  readonly automaticFallback: false;
}

export interface CoreHostGlmAdvancedBrainComposition {
  readonly compositionReport: CoreHostGlmAdvancedBrainCompositionReport;
  readonly provider?: AdvancedReasoningProvider;
}

export function createCoreHostGlmAdvancedBrainComposition(
  options: CoreHostGlmAdvancedBrainCompositionOptions,
): CoreHostGlmAdvancedBrainComposition {
  const modelId =
    options.runtimeConfig.glmAdvancedBrainModelId ??
    GLM_ADVANCED_BRAIN_DEFAULT_MODEL_ID;
  const selectedModelId = isGlmProviderModelCandidateId(modelId)
    ? modelId
    : undefined;
  const endpointProfile = createGlmAdvancedReasoningEndpointProfile();
  const gates = {
    explicitEnablement: options.runtimeConfig.glmAdvancedBrainEnabled,
    modelConfigured: modelId.trim().length > 0,
    modelSupported: selectedModelId !== undefined,
    credentialProviderConfigured: options.credentialProvider !== undefined,
    transportConfigured: options.transport !== undefined,
    endpointProfileValid: endpointProfile.providerId === GLM_ADVANCED_BRAIN_PROVIDER_ID,
    defaultOffPreserved:
      options.runtimeConfig.env.JARVIS_K_ENABLE_ADVANCED_BRAIN_GLM ===
        undefined ||
      options.runtimeConfig.glmAdvancedBrainEnabled === false ||
      options.runtimeConfig.mode !== "production",
    productRoutingUnchanged: options.productRoutingChanged !== true,
  };
  const reasonCodes = compositionReasonCodes(gates);
  const available = reasonCodes.length === 0;
  const provider =
    available && options.credentialProvider && options.transport && selectedModelId
      ? new GlmAdvancedReasoningProvider({
          enabled: true,
          modelId: selectedModelId,
          credentialProvider: options.credentialProvider,
          transport: options.transport,
          ...(options.now ? { now: options.now } : {}),
        })
      : undefined;

  return {
    compositionReport: {
      provider: GLM_ADVANCED_BRAIN_PROVIDER_ID,
      model: modelId,
      status: available
        ? "available"
        : gates.explicitEnablement
          ? "unconfigured"
          : "disabled",
      gates,
      reasonCodes: available
        ? ["GLM_ADVANCED_BRAIN_AVAILABLE"]
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
  gates: CoreHostGlmAdvancedBrainCompositionReport["gates"],
): CoreHostGlmAdvancedBrainCompositionReasonCode[] {
  const reasonCodes: CoreHostGlmAdvancedBrainCompositionReasonCode[] = [];
  if (!gates.explicitEnablement) {
    reasonCodes.push("GLM_ADVANCED_BRAIN_DISABLED");
  }
  if (!gates.modelConfigured) {
    reasonCodes.push("GLM_ADVANCED_BRAIN_MODEL_UNCONFIGURED");
  }
  if (!gates.modelSupported) {
    reasonCodes.push("GLM_ADVANCED_BRAIN_MODEL_UNSUPPORTED");
  }
  if (!gates.credentialProviderConfigured) {
    reasonCodes.push("GLM_ADVANCED_BRAIN_CREDENTIAL_PROVIDER_MISSING");
  }
  if (!gates.transportConfigured) {
    reasonCodes.push("GLM_ADVANCED_BRAIN_TRANSPORT_MISSING");
  }
  if (!gates.endpointProfileValid) {
    reasonCodes.push("GLM_ADVANCED_BRAIN_ENDPOINT_PROFILE_INVALID");
  }
  if (!gates.defaultOffPreserved) {
    reasonCodes.push("GLM_ADVANCED_BRAIN_DEFAULT_OFF_NOT_PRESERVED");
  }
  if (!gates.productRoutingUnchanged) {
    reasonCodes.push("GLM_ADVANCED_BRAIN_PRODUCT_ROUTING_UNCHANGED");
  }
  return reasonCodes;
}
