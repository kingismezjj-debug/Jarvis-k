import type { IntentRoutingProvider } from "@jarvis-k/capabilities";
import {
  createQwenFastRouterConfigurationReport,
  createQwenFastRouterDescriptor,
  QwenFastRouterProvider,
  QWEN_FAST_ROUTER_MODEL_ID,
  QWEN_FAST_ROUTER_PROVIDER_ID,
  type QwenFastRouterGenerationPort
} from "@jarvis-k/inference-adapter-qwen-router";
import type {
  InferenceProviderConfigurationReport,
  InferenceProviderDescriptor
} from "@jarvis-k/contracts";

export type CoreHostQwenFastRouterCompositionReasonCode =
  | "QWEN_COMPOSITION_AVAILABLE"
  | "QWEN_COMPOSITION_DISABLED"
  | "QWEN_ARTIFACT_DIGEST_APPROVAL_MISSING"
  | "QWEN_MODEL_LIFECYCLE_NOT_READY"
  | "QWEN_RUNTIME_GENERATION_PORT_MISSING"
  | "QWEN_SELECTION_POLICY_NOT_READY"
  | "QWEN_DEFAULT_OFF_NOT_PRESERVED"
  | "QWEN_FALLBACK_NOT_PRESERVED";

export interface CoreHostQwenFastRouterCompositionOptions {
  enabled: boolean;
  modelId?: string;
  artifactDigestApproved?: boolean;
  modelLifecycleReady?: boolean;
  runtimeGenerationPort?: QwenFastRouterGenerationPort;
  selectionPolicyReady?: boolean;
  defaultOffPreserved?: boolean;
  fallbackPreserved?: boolean;
}

export interface CoreHostQwenFastRouterCompositionReport {
  provider: typeof QWEN_FAST_ROUTER_PROVIDER_ID;
  modelId: string;
  status: "available" | "unconfigured" | "disabled";
  gates: {
    explicitEnablement: boolean;
    artifactDigestApproved: boolean;
    modelLifecycleReady: boolean;
    runtimeGenerationPortReady: boolean;
    selectionPolicyReady: boolean;
    defaultOffPreserved: boolean;
    fallbackPreserved: boolean;
  };
  reasonCodes: CoreHostQwenFastRouterCompositionReasonCode[];
  directActionAttempted: false;
  runtimeAccessed: false;
  artifactAccessed: false;
  persistentCacheChanged: false;
}

export interface CoreHostQwenFastRouterComposition {
  descriptor: InferenceProviderDescriptor;
  configurationReport: InferenceProviderConfigurationReport;
  compositionReport: CoreHostQwenFastRouterCompositionReport;
  provider?: IntentRoutingProvider;
}

export function createCoreHostQwenFastRouterComposition(
  options: CoreHostQwenFastRouterCompositionOptions
): CoreHostQwenFastRouterComposition {
  const modelId = options.modelId ?? QWEN_FAST_ROUTER_MODEL_ID;
  const gates = {
    explicitEnablement: options.enabled === true,
    artifactDigestApproved: options.artifactDigestApproved === true,
    modelLifecycleReady: options.modelLifecycleReady === true,
    runtimeGenerationPortReady: options.runtimeGenerationPort !== undefined,
    selectionPolicyReady: options.selectionPolicyReady === true,
    defaultOffPreserved: options.defaultOffPreserved !== false,
    fallbackPreserved: options.fallbackPreserved === true
  };
  const reasonCodes = qwenCompositionReasonCodes(gates);
  const available = reasonCodes.length === 0;
  const runtimeGenerationPort = options.runtimeGenerationPort;
  const provider = available && runtimeGenerationPort !== undefined
    ? new QwenFastRouterProvider({
        modelId,
        generator: runtimeGenerationPort
      })
    : undefined;

  return {
    descriptor: createQwenFastRouterDescriptor({
      enabled: options.enabled,
      modelId,
      runtimeReady: available
    }),
    configurationReport: createQwenFastRouterConfigurationReport({
      enabled: options.enabled,
      modelId,
      runtimeReady: gates.runtimeGenerationPortReady && available,
      artifactDigestApproved: gates.artifactDigestApproved,
      modelLifecycleReady: gates.modelLifecycleReady
    }),
    compositionReport: {
      provider: QWEN_FAST_ROUTER_PROVIDER_ID,
      modelId,
      status: available
        ? "available"
        : gates.explicitEnablement
          ? "unconfigured"
          : "disabled",
      gates,
      reasonCodes: available ? ["QWEN_COMPOSITION_AVAILABLE"] : reasonCodes,
      directActionAttempted: false,
      runtimeAccessed: false,
      artifactAccessed: false,
      persistentCacheChanged: false
    },
    ...(provider === undefined ? {} : { provider })
  };
}

function qwenCompositionReasonCodes(
  gates: CoreHostQwenFastRouterCompositionReport["gates"]
): CoreHostQwenFastRouterCompositionReasonCode[] {
  const reasonCodes: CoreHostQwenFastRouterCompositionReasonCode[] = [];
  if (!gates.explicitEnablement) {
    reasonCodes.push("QWEN_COMPOSITION_DISABLED");
  }
  if (!gates.artifactDigestApproved) {
    reasonCodes.push("QWEN_ARTIFACT_DIGEST_APPROVAL_MISSING");
  }
  if (!gates.modelLifecycleReady) {
    reasonCodes.push("QWEN_MODEL_LIFECYCLE_NOT_READY");
  }
  if (!gates.runtimeGenerationPortReady) {
    reasonCodes.push("QWEN_RUNTIME_GENERATION_PORT_MISSING");
  }
  if (!gates.selectionPolicyReady) {
    reasonCodes.push("QWEN_SELECTION_POLICY_NOT_READY");
  }
  if (!gates.defaultOffPreserved) {
    reasonCodes.push("QWEN_DEFAULT_OFF_NOT_PRESERVED");
  }
  if (!gates.fallbackPreserved) {
    reasonCodes.push("QWEN_FALLBACK_NOT_PRESERVED");
  }
  return reasonCodes;
}
