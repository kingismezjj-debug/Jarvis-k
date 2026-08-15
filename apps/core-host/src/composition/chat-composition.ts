import type { ChatAnswerProvider } from "@jarvis-k/capabilities";
import {
  ChatAnswerRequestSchema,
  ChatAnswerResultSchema,
} from "@jarvis-k/contracts";

export class ConfigurableChatAnswerProvider implements ChatAnswerProvider {
  private current: ChatAnswerProvider | undefined;

  public constructor(private readonly providerId: string) {}

  public configure(provider: ChatAnswerProvider | undefined): void {
    this.current = provider;
  }

  public async answer(
    request: Parameters<ChatAnswerProvider["answer"]>[0],
  ): ReturnType<ChatAnswerProvider["answer"]> {
    if (!this.current) {
      return ChatAnswerResultSchema.parse({
        providerId: this.providerId,
        status: "unavailable",
        reasonCode: "PROVIDER_UNAVAILABLE",
        failureClass: "PROVIDER_UNAVAILABLE",
        fallbackUsed: true,
        directActionAttempted: false,
        rawProviderResponsePersisted: false,
        credentialExposed: false,
        answeredAt: new Date().toISOString(),
      });
    }
    return this.current.answer(request);
  }
}

export class LocalSmokeChatAnswerProvider implements ChatAnswerProvider {
  private readonly providerId = "chat-answer.local-smoke";

  public async answer(
    request: Parameters<ChatAnswerProvider["answer"]>[0],
  ): ReturnType<ChatAnswerProvider["answer"]> {
    const parsed = ChatAnswerRequestSchema.parse(request);
    return ChatAnswerResultSchema.parse({
      providerId: this.providerId,
      status: "answered",
      reasonCode: "FIXTURE_ANSWER",
      failureClass: "none",
      answer:
        parsed.utterance.trim().length > 0
          ? "Smoke Chat Answer: Jarvis-K routed this general question through the bounded chat answer provider path."
          : undefined,
      fallbackUsed: false,
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      answeredAt: new Date().toISOString(),
    });
  }
}

export class OneShotFixedUtteranceChatAnswerProvider
  implements ChatAnswerProvider
{
  private used = false;

  public constructor(
    private readonly providerId: string,
    private readonly allowedUtterance: string,
    private readonly inner: ChatAnswerProvider,
  ) {}

  public async answer(
    request: Parameters<ChatAnswerProvider["answer"]>[0],
  ): ReturnType<ChatAnswerProvider["answer"]> {
    if (this.used || request.utterance.trim() !== this.allowedUtterance) {
      return ChatAnswerResultSchema.parse({
        providerId: this.providerId,
        status: "unavailable",
        reasonCode: "PROVIDER_UNAVAILABLE",
        failureClass: "PROVIDER_UNAVAILABLE",
        fallbackUsed: true,
        directActionAttempted: false,
        rawProviderResponsePersisted: false,
        credentialExposed: false,
        answeredAt: new Date().toISOString(),
      });
    }
    this.used = true;
    return this.inner.answer(request);
  }
}
