import type { CoreChatAnswerOptions, CoreRuntime } from "@jarvis-k/core";
import type { ChatAnswerProvider } from "@jarvis-k/capabilities";
import type { CoreHostVoiceComposition } from "../composition/voice-composition";
import type {
  CoreHostChatAnswerProductModeConfiguration,
  CoreHostChatAnswerProviderConfiguration,
  CoreHostCommandRouterProductModeConfiguration,
  CoreHostHeavyPlannerProviderConfiguration,
  CoreHostParsedMessage,
  CoreHostVoiceProviderConfiguration,
} from "./host-message-schema";

export interface RuntimeConfigurationTarget {
  configureCommandRouterProductMode(
    options: Parameters<CoreRuntime["configureCommandRouterProductMode"]>[0],
  ): void;
  configureChatAnswerProductMode(options: {
    readonly provider?: ChatAnswerProvider;
    readonly options?: CoreChatAnswerOptions;
  }): void;
}

export interface RuntimeConfigurationControllerInput {
  readonly runtime: RuntimeConfigurationTarget;
  readonly chatAnswerRuntimeBinding: ChatAnswerRuntimeBindingPort;
  readonly plannerRuntimeBinding: PlannerRuntimeBindingPort;
  readonly voiceComposition: Pick<CoreHostVoiceComposition, "configureProvider">;
}

export interface ChatAnswerRuntimeBindingPort {
  applyProductModeConfiguration(
    configuration: CoreHostChatAnswerProductModeConfiguration,
  ): {
    readonly provider?: ChatAnswerProvider;
    readonly options?: CoreChatAnswerOptions;
  };
  applyProviderConfiguration(
    configuration: CoreHostChatAnswerProviderConfiguration,
  ): void;
  dispose(): void;
}

export interface PlannerRuntimeBindingPort {
  applyProviderConfiguration(
    configuration: CoreHostHeavyPlannerProviderConfiguration,
  ): void;
  dispose(): void;
}

export class RuntimeConfigurationController {
  public constructor(
    private readonly input: RuntimeConfigurationControllerInput,
  ) {}

  public async applyMessage(message: CoreHostParsedMessage): Promise<boolean> {
    switch (message.kind) {
      case "command-router-product-mode.configure":
        this.applyCommandRouterProductMode(message.configuration);
        return true;
      case "chat-answer-product-mode.configure":
        this.applyChatAnswerProductMode(message.configuration);
        return true;
      case "chat-answer-provider.configure":
        this.applyChatAnswerProvider(message.configuration);
        return true;
      case "heavy-planner-provider.configure":
        this.applyHeavyPlannerProvider(message.configuration);
        return true;
      case "voice-provider.configure":
        await this.applyVoiceProvider(message.configuration);
        return true;
      case "core-inbound":
        return false;
    }
  }

  public dispose(): void {
    this.input.chatAnswerRuntimeBinding.dispose();
    this.input.plannerRuntimeBinding.dispose();
  }

  private applyCommandRouterProductMode(
    configuration: CoreHostCommandRouterProductModeConfiguration,
  ): void {
    this.input.runtime.configureCommandRouterProductMode({
      enabled: configuration.enabled,
      providerId: "intent-router.deterministic.rules",
    });
  }

  private applyChatAnswerProductMode(
    configuration: CoreHostChatAnswerProductModeConfiguration,
  ): void {
    this.input.runtime.configureChatAnswerProductMode(
      this.input.chatAnswerRuntimeBinding.applyProductModeConfiguration(
        configuration,
      ),
    );
  }

  private applyChatAnswerProvider(
    configuration: CoreHostChatAnswerProviderConfiguration,
  ): void {
    this.input.chatAnswerRuntimeBinding.applyProviderConfiguration(
      configuration,
    );
  }

  private applyHeavyPlannerProvider(
    configuration: CoreHostHeavyPlannerProviderConfiguration,
  ): void {
    this.input.plannerRuntimeBinding.applyProviderConfiguration(configuration);
  }

  private async applyVoiceProvider(
    configuration: CoreHostVoiceProviderConfiguration,
  ): Promise<void> {
    await this.input.voiceComposition.configureProvider(configuration);
  }
}
