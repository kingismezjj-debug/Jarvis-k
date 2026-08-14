import {
  GLM_CHAT_ANSWER_RUNTIME_ENDPOINT,
  GLM_CHAT_ANSWER_RUNTIME_MODEL_ID,
  GLM_CHAT_ANSWER_RUNTIME_PROFILE_ID,
  GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
  type GlmChatAnswerRuntimeCredential,
  type GlmChatAnswerRuntimeTransport
} from "@jarvis-k/inference-adapter-glm-chat-answer-runtime";
import {
  createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition,
  type CoreHostOpenAiCompatibleChatAnswerRuntimeComposition,
  type CoreHostOpenAiCompatibleChatAnswerRuntimeCompositionReport,
  type CoreHostOpenAiCompatibleChatAnswerRuntimeReasonCode
} from "./openai-compatible-chat-answer-runtime-composition";

export type CoreHostGlmChatAnswerRuntimeReasonCode =
  | "GLM_CHAT_ANSWER_RUNTIME_AVAILABLE"
  | "GLM_CHAT_ANSWER_RUNTIME_DISABLED"
  | "GLM_CHAT_ANSWER_RUNTIME_PROVIDER_NOT_APPROVED"
  | "GLM_CHAT_ANSWER_RUNTIME_FIXED_PROFILE_NOT_APPROVED"
  | "GLM_CHAT_ANSWER_RUNTIME_SECURE_STORE_UNAVAILABLE"
  | "GLM_CHAT_ANSWER_RUNTIME_CREDENTIAL_MISSING"
  | "GLM_CHAT_ANSWER_RUNTIME_CREDENTIAL_EXPOSED"
  | "GLM_CHAT_ANSWER_RUNTIME_NETWORK_WINDOW_NOT_APPROVED"
  | "GLM_CHAT_ANSWER_RUNTIME_CONTRACT_NOT_READY"
  | "GLM_CHAT_ANSWER_RUNTIME_PARSER_NOT_READY"
  | "GLM_CHAT_ANSWER_RUNTIME_BOUNDS_NOT_READY"
  | "GLM_CHAT_ANSWER_RUNTIME_DEFAULT_OFF_NOT_PRESERVED"
  | "GLM_CHAT_ANSWER_RUNTIME_FALLBACK_NOT_PRESERVED"
  | "GLM_CHAT_ANSWER_RUNTIME_EXECUTOR_ONLY_NOT_PRESERVED";

export interface CoreHostGlmChatAnswerRuntimeCompositionOptions {
  readonly enabled: boolean;
  readonly providerId?: string;
  readonly modelId?: string;
  readonly endpoint?: string;
  readonly fixedProfileApproved?: boolean;
  readonly secureCredentialStoreAvailable?: boolean;
  readonly credential?: GlmChatAnswerRuntimeCredential;
  readonly credentialExposed?: boolean;
  readonly networkWindowApproved?: boolean;
  readonly contractReady?: boolean;
  readonly parserReady?: boolean;
  readonly timeoutAndOutputBoundsReady?: boolean;
  readonly defaultOffPreserved?: boolean;
  readonly fixtureFallbackPreserved?: boolean;
  readonly executorOnlySideEffectsPreserved?: boolean;
  readonly transport?: GlmChatAnswerRuntimeTransport;
}

export interface CoreHostGlmChatAnswerRuntimeCompositionReport
  extends Omit<
    CoreHostOpenAiCompatibleChatAnswerRuntimeCompositionReport,
    | "provider"
    | "family"
    | "profileId"
    | "model"
    | "endpoint"
    | "reasonCodes"
  > {
  readonly provider: typeof GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID;
  readonly model: typeof GLM_CHAT_ANSWER_RUNTIME_MODEL_ID;
  readonly endpoint: typeof GLM_CHAT_ANSWER_RUNTIME_ENDPOINT;
  readonly reasonCodes: CoreHostGlmChatAnswerRuntimeReasonCode[];
}

export interface CoreHostGlmChatAnswerRuntimeComposition
  extends Omit<
    CoreHostOpenAiCompatibleChatAnswerRuntimeComposition,
    "compositionReport"
  > {
  readonly compositionReport: CoreHostGlmChatAnswerRuntimeCompositionReport;
}

export function createCoreHostGlmChatAnswerRuntimeComposition(
  options: CoreHostGlmChatAnswerRuntimeCompositionOptions
): CoreHostGlmChatAnswerRuntimeComposition {
  const composition =
    createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition({
      ...options,
      profileId: GLM_CHAT_ANSWER_RUNTIME_PROFILE_ID
    });

  return {
    ...composition,
    compositionReport: {
      ...composition.compositionReport,
      provider: GLM_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
      model: GLM_CHAT_ANSWER_RUNTIME_MODEL_ID,
      endpoint: GLM_CHAT_ANSWER_RUNTIME_ENDPOINT,
      reasonCodes: composition.compositionReport.reasonCodes.map(
        mapGlmReasonCode
      )
    }
  };
}

function mapGlmReasonCode(
  value: CoreHostOpenAiCompatibleChatAnswerRuntimeReasonCode
): CoreHostGlmChatAnswerRuntimeReasonCode {
  const reasonCodeMap: Record<
    CoreHostOpenAiCompatibleChatAnswerRuntimeReasonCode,
    CoreHostGlmChatAnswerRuntimeReasonCode
  > = {
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_AVAILABLE:
      "GLM_CHAT_ANSWER_RUNTIME_AVAILABLE",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_DISABLED:
      "GLM_CHAT_ANSWER_RUNTIME_DISABLED",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_PROVIDER_NOT_APPROVED:
      "GLM_CHAT_ANSWER_RUNTIME_PROVIDER_NOT_APPROVED",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_FIXED_PROFILE_NOT_APPROVED:
      "GLM_CHAT_ANSWER_RUNTIME_FIXED_PROFILE_NOT_APPROVED",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_SECURE_STORE_UNAVAILABLE:
      "GLM_CHAT_ANSWER_RUNTIME_SECURE_STORE_UNAVAILABLE",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_CREDENTIAL_MISSING:
      "GLM_CHAT_ANSWER_RUNTIME_CREDENTIAL_MISSING",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_CREDENTIAL_EXPOSED:
      "GLM_CHAT_ANSWER_RUNTIME_CREDENTIAL_EXPOSED",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_NETWORK_WINDOW_NOT_APPROVED:
      "GLM_CHAT_ANSWER_RUNTIME_NETWORK_WINDOW_NOT_APPROVED",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_CONTRACT_NOT_READY:
      "GLM_CHAT_ANSWER_RUNTIME_CONTRACT_NOT_READY",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_PARSER_NOT_READY:
      "GLM_CHAT_ANSWER_RUNTIME_PARSER_NOT_READY",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_BOUNDS_NOT_READY:
      "GLM_CHAT_ANSWER_RUNTIME_BOUNDS_NOT_READY",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_DEFAULT_OFF_NOT_PRESERVED:
      "GLM_CHAT_ANSWER_RUNTIME_DEFAULT_OFF_NOT_PRESERVED",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_FALLBACK_NOT_PRESERVED:
      "GLM_CHAT_ANSWER_RUNTIME_FALLBACK_NOT_PRESERVED",
    OPENAI_COMPATIBLE_CHAT_ANSWER_RUNTIME_EXECUTOR_ONLY_NOT_PRESERVED:
      "GLM_CHAT_ANSWER_RUNTIME_EXECUTOR_ONLY_NOT_PRESERVED"
  };
  return reasonCodeMap[value];
}
