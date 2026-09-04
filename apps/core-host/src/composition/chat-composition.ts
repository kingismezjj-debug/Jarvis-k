import type { ChatAnswerProvider } from "@jarvis-k/capabilities";
import {
  AssistantModelAdapterEventSchema,
  ChatAnswerRequestSchema,
  ChatAnswerResultSchema,
} from "@jarvis-k/contracts";

export class ConfigurableChatAnswerProvider implements ChatAnswerProvider {
  private current: ChatAnswerProvider | undefined;

  public constructor(private readonly providerId: string) {}

  public configure(provider: ChatAnswerProvider | undefined): void {
    this.current = provider;
  }

  public toJSON(): {
    readonly providerId: string;
    readonly configured: boolean;
    readonly credentialExposed: false;
  } {
    return {
      providerId: this.providerId,
      configured: this.current !== undefined,
      credentialExposed: false,
    };
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

  public async *startTextTurn(
    request: Parameters<NonNullable<ChatAnswerProvider["startTextTurn"]>>[0],
    context: Parameters<NonNullable<ChatAnswerProvider["startTextTurn"]>>[1],
    signal: Parameters<NonNullable<ChatAnswerProvider["startTextTurn"]>>[2],
  ): ReturnType<NonNullable<ChatAnswerProvider["startTextTurn"]>> {
    if (!this.current?.startTextTurn) {
      yield AssistantModelAdapterEventSchema.parse({
        type: "failure",
        reason: "streaming_not_supported",
        safeMessage:
          "The configured answer provider does not support streaming.",
        retryable: true,
      });
      return;
    }
    yield* this.current.startTextTurn(request, context, signal);
  }
}

export class LocalSmokeChatAnswerProvider implements ChatAnswerProvider {
  private readonly providerId = "chat-answer.local-smoke";
  private readonly answerText =
    "Smoke Chat Answer: Jarvis-K routed this general question through the bounded chat answer provider path.";

  public async answer(
    request: Parameters<ChatAnswerProvider["answer"]>[0],
  ): ReturnType<ChatAnswerProvider["answer"]> {
    const parsed = ChatAnswerRequestSchema.parse(request);
    return ChatAnswerResultSchema.parse({
      providerId: this.providerId,
      status: "answered",
      reasonCode: "FIXTURE_ANSWER",
      failureClass: "none",
      answer: parsed.utterance.trim().length > 0 ? this.answerText : undefined,
      fallbackUsed: false,
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      answeredAt: new Date().toISOString(),
    });
  }

  public async *startTextTurn(
    request: Parameters<NonNullable<ChatAnswerProvider["startTextTurn"]>>[0],
  ): ReturnType<NonNullable<ChatAnswerProvider["startTextTurn"]>> {
    const parsed = ChatAnswerRequestSchema.parse(request);
    if (parsed.utterance.trim().length === 0) {
      yield AssistantModelAdapterEventSchema.parse({
        type: "failure",
        reason: "malformed_response",
        safeMessage: "The local smoke answer request was empty.",
        retryable: false,
      });
      return;
    }
    yield AssistantModelAdapterEventSchema.parse({
      type: "delta",
      delta: {
        kind: "text",
        text: this.answerText,
      },
    });
    yield AssistantModelAdapterEventSchema.parse({
      type: "final",
      text: this.answerText,
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

  public toJSON(): {
    readonly providerId: string;
    readonly used: boolean;
    readonly credentialExposed: false;
  } {
    return {
      providerId: this.providerId,
      used: this.used,
      credentialExposed: false,
    };
  }

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

  public async *startTextTurn(
    request: Parameters<NonNullable<ChatAnswerProvider["startTextTurn"]>>[0],
    context: Parameters<NonNullable<ChatAnswerProvider["startTextTurn"]>>[1],
    signal: Parameters<NonNullable<ChatAnswerProvider["startTextTurn"]>>[2],
  ): ReturnType<NonNullable<ChatAnswerProvider["startTextTurn"]>> {
    if (this.used || request.utterance.trim() !== this.allowedUtterance) {
      yield AssistantModelAdapterEventSchema.parse({
        type: "failure",
        reason: "provider_unavailable",
        safeMessage: "The configured answer provider is unavailable.",
        retryable: true,
      });
      return;
    }
    if (!this.inner.startTextTurn) {
      yield AssistantModelAdapterEventSchema.parse({
        type: "failure",
        reason: "streaming_not_supported",
        safeMessage:
          "The configured answer provider does not support streaming.",
        retryable: true,
      });
      return;
    }
    this.used = true;
    yield* this.inner.startTextTurn(request, context, signal);
  }
}
