import type { ChatAnswerProvider } from "@jarvis-k/capabilities";
import {
  FetchOpenAiCompatibleChatAnswerRuntimeTransport,
  OpenAiCompatibleChatAnswerRuntimeProvider,
  getOpenAiCompatibleChatAnswerRuntimeProfile,
  type OpenAiCompatibleChatAnswerRuntimeCredential,
  type OpenAiCompatibleChatAnswerRuntimeProfile,
  type OpenAiCompatibleChatAnswerRuntimeProfileId,
  type OpenAiCompatibleChatAnswerRuntimeTransport
} from "@jarvis-k/inference-adapter-glm-chat-answer-runtime";

export type CoreHostOpenAiCompatibleChatAnswerRuntimeReasonCode =
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_AVAILABLE"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_DISABLED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_PROVIDER_NOT_APPROVED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_FIXED_PROFILE_NOT_APPROVED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_SECURE_STORE_UNAVAILABLE"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_CREDENTIAL_MISSING"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_CREDENTIAL_EXPOSED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_NETWORK_WINDOW_NOT_APPROVED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_CONTRACT_NOT_READY"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_PARSER_NOT_READY"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_BOUNDS_NOT_READY"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_DEFAULT_OFF_NOT_PRESERVED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_FALLBACK_NOT_PRESERVED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_EXECUTOR_ONLY_NOT_PRESERVED";

export interface CoreHostOpenAiCompatibleChatAnswerRuntimeCompositionOptions {
  readonly enabled: boolean;
  readonly profileId: OpenAiCompatibleChatAnswerRuntimeProfileId;
  readonly providerId?: string;
  readonly modelId?: string;
  readonly endpoint?: string;
  readonly fixedProfileApproved?: boolean;
  readonly secureCredentialStoreAvailable?: boolean;
  readonly credential?: OpenAiCompatibleChatAnswerRuntimeCredential;
  readonly credentialExposed?: boolean;
  readonly networkWindowApproved?: boolean;
  readonly contractReady?: boolean;
  readonly parserReady?: boolean;
  readonly timeoutAndOutputBoundsReady?: boolean;
  readonly defaultOffPreserved?: boolean;
  readonly fixtureFallbackPreserved?: boolean;
  readonly executorOnlySideEffectsPreserved?: boolean;
  readonly transport?: OpenAiCompatibleChatAnswerRuntimeTransport;
}

export interface CoreHostOpenAiCompatibleChatAnswerRuntimeCompositionReport {
  readonly provider: OpenAiCompatibleChatAnswerRuntimeProfile["providerId"];
  readonly family: OpenAiCompatibleChatAnswerRuntimeProfile["family"];
  readonly profileId: OpenAiCompatibleChatAnswerRuntimeProfile["profileId"];
  readonly model: OpenAiCompatibleChatAnswerRuntimeProfile["modelId"];
  readonly endpoint: OpenAiCompatibleChatAnswerRuntimeProfile["endpoint"];
  readonly status: "available" | "unconfigured" | "disabled";
  readonly gates: {
    readonly explicitEnablement: boolean;
    readonly providerExactlyApproved: boolean;
    readonly fixedProfileApproved: boolean;
    readonly secureCredentialStoreAvailable: boolean;
    readonly credentialConfigured: boolean;
    readonly credentialNotExposed: boolean;
    readonly networkOneWindowApproved: boolean;
    readonly contractReady: boolean;
    readonly parserReady: boolean;
    readonly timeoutAndOutputBoundsReady: boolean;
    readonly defaultOffPreserved: boolean;
    readonly fixtureFallbackPreserved: boolean;
    readonly executorOnlySideEffectsPreserved: boolean;
  };
  readonly reasonCodes: CoreHostOpenAiCompatibleChatAnswerRuntimeReasonCode[];
  readonly directActionAttempted: false;
  readonly credentialExposed: false;
  readonly networkAccessed: false;
  readonly realApiCalled: false;
  readonly modelRuntimeAccessed: false;
  readonly memoryVectorAccessed: false;
  readonly defaultBehaviorChanged: false;
  readonly uiIpcBehaviorChanged: false;
  readonly telemetryChanged: false;
  readonly releaseBehaviorChanged: false;
}

export interface CoreHostOpenAiCompatibleChatAnswerRuntimeComposition {
  readonly compositionReport: CoreHostOpenAiCompatibleChatAnswerRuntimeCompositionReport;
  readonly provider?: ChatAnswerProvider;
}

export function createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition(
  options: CoreHostOpenAiCompatibleChatAnswerRuntimeCompositionOptions
): CoreHostOpenAiCompatibleChatAnswerRuntimeComposition {
  const profile = getOpenAiCompatibleChatAnswerRuntimeProfile(
    options.profileId
  );
  const gates = {
    explicitEnablement: options.enabled === true,
    providerExactlyApproved:
      (options.providerId ?? profile.providerId) === profile.providerId,
    fixedProfileApproved:
      options.fixedProfileApproved === true &&
      (options.modelId ?? profile.modelId) === profile.modelId &&
      (options.endpoint ?? profile.endpoint) === profile.endpoint,
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
    fixtureFallbackPreserved:
      options.fixtureFallbackPreserved === true,
    executorOnlySideEffectsPreserved:
      options.executorOnlySideEffectsPreserved === true
  };
  const reasonCodes = compositionReasonCodes(gates);
  const available = reasonCodes.length === 0;
  const provider =
    available && options.credential
      ? new OpenAiCompatibleChatAnswerRuntimeProvider({
          profileId: profile.profileId,
          credential: options.credential,
          transport:
            options.transport ?? new FetchOpenAiCompatibleChatAnswerRuntimeTransport()
        })
      : undefined;

  return {
    compositionReport: {
      provider: profile.providerId,
      family: profile.family,
      profileId: profile.profileId,
      model: profile.modelId,
      endpoint: profile.endpoint,
      status: available
        ? "available"
        : gates.explicitEnablement
          ? "unconfigured"
          : "disabled",
      gates,
      reasonCodes: available
        ? ["OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_AVAILABLE"]
        : reasonCodes,
      directActionAttempted: false,
      credentialExposed: false,
      networkAccessed: false,
      realApiCalled: false,
      modelRuntimeAccessed: false,
      memoryVectorAccessed: false,
      defaultBehaviorChanged: false,
      uiIpcBehaviorChanged: false,
      telemetryChanged: false,
      releaseBehaviorChanged: false
    },
    ...(provider === undefined ? {} : { provider })
  };
}

function compositionReasonCodes(
  gates: CoreHostOpenAiCompatibleChatAnswerRuntimeCompositionReport["gates"]
): CoreHostOpenAiCompatibleChatAnswerRuntimeReasonCode[] {
  const reasonCodes: CoreHostOpenAiCompatibleChatAnswerRuntimeReasonCode[] = [];
  if (!gates.explicitEnablement) {
    reasonCodes.push("OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_DISABLED");
  }
  if (!gates.providerExactlyApproved) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_PROVIDER_NOT_APPROVED"
    );
  }
  if (!gates.fixedProfileApproved) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_FIXED_PROFILE_NOT_APPROVED"
    );
  }
  if (!gates.secureCredentialStoreAvailable) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_SECURE_STORE_UNAVAILABLE"
    );
  }
  if (!gates.credentialConfigured) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_CREDENTIAL_MISSING"
    );
  }
  if (!gates.credentialNotExposed) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_CREDENTIAL_EXPOSED"
    );
  }
  if (!gates.networkOneWindowApproved) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_NETWORK_WINDOW_NOT_APPROVED"
    );
  }
  if (!gates.contractReady) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_CONTRACT_NOT_READY"
    );
  }
  if (!gates.parserReady) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_PARSER_NOT_READY"
    );
  }
  if (!gates.timeoutAndOutputBoundsReady) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_BOUNDS_NOT_READY"
    );
  }
  if (!gates.defaultOffPreserved) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_DEFAULT_OFF_NOT_PRESERVED"
    );
  }
  if (!gates.fixtureFallbackPreserved) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_FALLBACK_NOT_PRESERVED"
    );
  }
  if (!gates.executorOnlySideEffectsPreserved) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_EXECUTOR_ONLY_NOT_PRESERVED"
    );
  }
  return reasonCodes;
}

function isCredentialConfigured(
  credential: OpenAiCompatibleChatAnswerRuntimeCredential | undefined
): credential is OpenAiCompatibleChatAnswerRuntimeCredential {
  return (
    typeof credential?.apiKey === "string" &&
    credential.apiKey.trim().length >= 8 &&
    credential.apiKey.length <= 512
  );
}
