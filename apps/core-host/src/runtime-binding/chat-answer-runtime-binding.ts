import type { ChatAnswerProvider } from "@jarvis-k/capabilities";
import type { CoreChatAnswerOptions } from "@jarvis-k/core";
import {
  DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
} from "@jarvis-k/inference-adapter-glm-chat-answer-runtime";
import {
  ConfigurableChatAnswerProvider,
  OneShotFixedUtteranceChatAnswerProvider,
} from "../composition/chat-composition";
import { createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition } from "../openai-compatible-chat-answer-runtime-composition";
import type {
  CoreHostChatAnswerProductModeConfiguration,
  CoreHostChatAnswerProviderConfiguration,
} from "../host/host-message-schema";

export interface CoreHostActiveChatAnswerRuntime {
  readonly providerId: typeof DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID;
  readonly profileId: typeof DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID;
  readonly modelId: typeof DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID;
  readonly endpoint: typeof DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT;
  readonly networkWindowApproved: true;
}

export interface ChatAnswerRuntimeBindingInput {
  readonly activeChatAnswer: CoreHostActiveChatAnswerRuntime | undefined;
  readonly configurableChatAnswerProvider:
    | ConfigurableChatAnswerProvider
    | undefined;
  readonly initialChatAnswerProvider: ChatAnswerProvider | undefined;
  readonly initialChatAnswerOptions: CoreChatAnswerOptions | undefined;
  readonly controlledRuntimeUtterance: string;
}

export interface ChatAnswerProductModeRuntimeBinding {
  readonly provider?: ChatAnswerProvider;
  readonly options?: CoreChatAnswerOptions;
}

export class ChatAnswerRuntimeBinding {
  private readonly controlledRuntimeBindingChatAnswerProvider =
    new ConfigurableChatAnswerProvider(DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID);

  public constructor(private readonly input: ChatAnswerRuntimeBindingInput) {}

  public applyProductModeConfiguration(
    configuration: CoreHostChatAnswerProductModeConfiguration,
  ): ChatAnswerProductModeRuntimeBinding {
    if (!configuration.enabled) {
      this.controlledRuntimeBindingChatAnswerProvider.configure(undefined);
      return {
        ...(this.input.initialChatAnswerProvider
          ? { provider: this.input.initialChatAnswerProvider }
          : {}),
        ...(this.input.initialChatAnswerOptions
          ? { options: this.input.initialChatAnswerOptions }
          : {}),
      };
    }

    const compositionOptions = {
      enabled: true,
      profileId: DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID,
      providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
      modelId: DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
      endpoint: DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
      fixedProfileApproved: true,
      secureCredentialStoreAvailable: true,
      credentialExposed: false,
      networkWindowApproved: configuration.credential !== undefined,
      contractReady: true,
      parserReady: true,
      timeoutAndOutputBoundsReady: true,
      defaultOffPreserved: true,
      fixtureFallbackPreserved: true,
      executorOnlySideEffectsPreserved: true,
    } as const;
    const composition = createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition({
      ...compositionOptions,
      ...(configuration.credential
        ? { credential: configuration.credential }
        : {}),
    });
    this.controlledRuntimeBindingChatAnswerProvider.configure(
      composition.provider
        ? new OneShotFixedUtteranceChatAnswerProvider(
            DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
            this.input.controlledRuntimeUtterance,
            composition.provider,
          )
        : undefined,
    );
    return {
      provider: this.controlledRuntimeBindingChatAnswerProvider,
      options: {
        enabled: true,
        providerId: composition.compositionReport.provider,
        forcedChatAnswerUtterances: [this.input.controlledRuntimeUtterance],
      },
    };
  }

  public applyProviderConfiguration(
    configuration: CoreHostChatAnswerProviderConfiguration,
  ): void {
    if (
      !this.input.activeChatAnswer ||
      this.input.activeChatAnswer.providerId !== configuration.provider
    ) {
      this.input.configurableChatAnswerProvider?.configure(undefined);
      return;
    }
    const composition = createCoreHostOpenAiCompatibleChatAnswerRuntimeComposition({
      enabled: true,
      profileId: this.input.activeChatAnswer.profileId,
      providerId: this.input.activeChatAnswer.providerId,
      modelId: this.input.activeChatAnswer.modelId,
      endpoint: this.input.activeChatAnswer.endpoint,
      fixedProfileApproved: true,
      secureCredentialStoreAvailable: true,
      credential: configuration.credentials,
      credentialExposed: false,
      networkWindowApproved: this.input.activeChatAnswer.networkWindowApproved,
      contractReady: true,
      parserReady: true,
      timeoutAndOutputBoundsReady: true,
      defaultOffPreserved: true,
      fixtureFallbackPreserved: true,
      executorOnlySideEffectsPreserved: true,
    });
    this.input.configurableChatAnswerProvider?.configure(composition.provider);
  }

  public dispose(): void {
    this.controlledRuntimeBindingChatAnswerProvider.configure(undefined);
    this.input.configurableChatAnswerProvider?.configure(undefined);
  }
}
