import type { ChatAnswerProvider } from "@jarvis-k/capabilities";
import {
  OpenAiCompatibleFixtureChatAnswerProvider,
  getOpenAiCompatibleChatAnswerProfile,
  type OpenAiCompatibleChatAnswerFixtureTransport,
  type OpenAiCompatibleChatAnswerProfile,
  type OpenAiCompatibleChatAnswerProfileId,
  type OpenAiCompatibleChatAnswerProviderId
} from "@jarvis-k/inference-adapter-openai-chat-answer";

export type CoreHostOpenAiCompatibleChatAnswerCompositionReasonCode =
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_FIXTURE_AVAILABLE"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_FIXTURE_DISABLED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_PROFILE_NOT_APPROVED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_FIXTURE_TRANSPORT_MISSING"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_NETWORK_ACCESS_NOT_DISABLED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_REAL_CREDENTIAL_ACCESS_NOT_DISABLED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_CONTRACT_NOT_READY"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_PARSER_NOT_READY"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_BOUNDS_NOT_READY"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_DEFAULT_OFF_NOT_PRESERVED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_FALLBACK_NOT_PRESERVED"
  | "OPENAI_COMPATIBLE_CHAT_ANSWER_EXECUTOR_ONLY_NOT_PRESERVED";

export interface CoreHostOpenAiCompatibleChatAnswerCompositionOptions {
  readonly enabled: boolean;
  readonly profileId?: OpenAiCompatibleChatAnswerProfileId;
  readonly fixtureTransport?: OpenAiCompatibleChatAnswerFixtureTransport;
  readonly networkAccessDisabled?: boolean;
  readonly realCredentialAccessDisabled?: boolean;
  readonly contractReady?: boolean;
  readonly parserReady?: boolean;
  readonly timeoutAndOutputBoundsReady?: boolean;
  readonly defaultOffPreserved?: boolean;
  readonly fixtureFallbackPreserved?: boolean;
  readonly executorOnlySideEffectsPreserved?: boolean;
}

export interface CoreHostOpenAiCompatibleChatAnswerCompositionReport {
  readonly provider: OpenAiCompatibleChatAnswerProviderId;
  readonly profileId: OpenAiCompatibleChatAnswerProfileId;
  readonly family: OpenAiCompatibleChatAnswerProfile["family"];
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
    readonly fixtureFallbackPreserved: boolean;
    readonly executorOnlySideEffectsPreserved: boolean;
  };
  readonly reasonCodes: CoreHostOpenAiCompatibleChatAnswerCompositionReasonCode[];
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

export interface CoreHostOpenAiCompatibleChatAnswerComposition {
  readonly compositionReport: CoreHostOpenAiCompatibleChatAnswerCompositionReport;
  readonly provider?: ChatAnswerProvider;
}

export function createCoreHostOpenAiCompatibleChatAnswerComposition(
  options: CoreHostOpenAiCompatibleChatAnswerCompositionOptions
): CoreHostOpenAiCompatibleChatAnswerComposition {
  const profile = getOpenAiCompatibleChatAnswerProfile(
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
    fixtureFallbackPreserved: options.fixtureFallbackPreserved === true,
    executorOnlySideEffectsPreserved:
      options.executorOnlySideEffectsPreserved === true
  };
  const reasonCodes = compositionReasonCodes(gates);
  const available = reasonCodes.length === 0;
  const provider =
    available && options.fixtureTransport !== undefined
      ? new OpenAiCompatibleFixtureChatAnswerProvider({
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
        ? ["OPENAI_COMPATIBLE_CHAT_ANSWER_FIXTURE_AVAILABLE"]
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
  gates: CoreHostOpenAiCompatibleChatAnswerCompositionReport["gates"]
): CoreHostOpenAiCompatibleChatAnswerCompositionReasonCode[] {
  const reasonCodes: CoreHostOpenAiCompatibleChatAnswerCompositionReasonCode[] =
    [];
  if (!gates.explicitEnablement) {
    reasonCodes.push("OPENAI_COMPATIBLE_CHAT_ANSWER_FIXTURE_DISABLED");
  }
  if (!gates.profileExactlyApproved) {
    reasonCodes.push("OPENAI_COMPATIBLE_CHAT_ANSWER_PROFILE_NOT_APPROVED");
  }
  if (!gates.fixtureTransportInjected) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_FIXTURE_TRANSPORT_MISSING"
    );
  }
  if (!gates.networkAccessDisabled) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_NETWORK_ACCESS_NOT_DISABLED"
    );
  }
  if (!gates.realCredentialAccessDisabled) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_REAL_CREDENTIAL_ACCESS_NOT_DISABLED"
    );
  }
  if (!gates.contractReady) {
    reasonCodes.push("OPENAI_COMPATIBLE_CHAT_ANSWER_CONTRACT_NOT_READY");
  }
  if (!gates.parserReady) {
    reasonCodes.push("OPENAI_COMPATIBLE_CHAT_ANSWER_PARSER_NOT_READY");
  }
  if (!gates.timeoutAndOutputBoundsReady) {
    reasonCodes.push("OPENAI_COMPATIBLE_CHAT_ANSWER_BOUNDS_NOT_READY");
  }
  if (!gates.defaultOffPreserved || !gates.profileDefaultOff) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_DEFAULT_OFF_NOT_PRESERVED"
    );
  }
  if (!gates.fixtureFallbackPreserved) {
    reasonCodes.push("OPENAI_COMPATIBLE_CHAT_ANSWER_FALLBACK_NOT_PRESERVED");
  }
  if (!gates.executorOnlySideEffectsPreserved) {
    reasonCodes.push(
      "OPENAI_COMPATIBLE_CHAT_ANSWER_EXECUTOR_ONLY_NOT_PRESERVED"
    );
  }
  if (!gates.exactRuntimeApprovalRequired) {
    reasonCodes.push("OPENAI_COMPATIBLE_CHAT_ANSWER_PROFILE_NOT_APPROVED");
  }
  return [...new Set(reasonCodes)];
}
