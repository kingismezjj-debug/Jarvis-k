import {
  ChatAnswerRequestSchema,
  ChatAnswerResultSchema,
  type ChatAnswerRequest,
  type ChatAnswerResult
} from "@jarvis-k/contracts";
import type { ChatAnswerProvider } from "./ports";

export class FixtureChatAnswerProvider implements ChatAnswerProvider {
  public constructor(
    private readonly providerId = "chat-answer.fixture"
  ) {}

  public async answer(request: ChatAnswerRequest): Promise<ChatAnswerResult> {
    const parsed = ChatAnswerRequestSchema.parse(request);
    const answeredAt = new Date().toISOString();
    const text = parsed.utterance.trim();

    if (parsed.routerDecision.intent === "blocked") {
      return ChatAnswerResultSchema.parse({
        providerId: this.providerId,
        status: "blocked",
        reasonCode: "UNSAFE_OR_BLOCKED",
        failureClass: "UNSAFE_OR_BLOCKED",
        fallbackUsed: false,
        directActionAttempted: false,
        rawProviderResponsePersisted: false,
        credentialExposed: false,
        answeredAt
      });
    }

    if (
      parsed.routerDecision.intent === "clarify" ||
      text.length < 3 ||
      /^(what|why|how|什么|为什么|怎么)(?:\s+的?)?$/iu.test(text)
    ) {
      return ChatAnswerResultSchema.parse({
        providerId: this.providerId,
        status: "clarify",
        reasonCode: "CLARIFY_REQUIRED",
        failureClass: "CLARIFY_REQUIRED",
        clarifyQuestion:
          "请补充你希望了解的对象、目标或限制条件。",
        fallbackUsed: false,
        directActionAttempted: false,
        rawProviderResponsePersisted: false,
        credentialExposed: false,
        answeredAt
      });
    }

    return ChatAnswerResultSchema.parse({
      providerId: this.providerId,
      status: "answered",
      reasonCode: "FIXTURE_ANSWER",
      failureClass: "none",
      answer: createFixtureAnswer(text, parsed.preferenceProjection),
      fallbackUsed: false,
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      ...(parsed.preferenceProjection
        ? { preferenceProjection: parsed.preferenceProjection }
        : {}),
      answeredAt
    });
  }
}

function summarize(text: string): string {
  return text.replace(/\s+/gu, " ").slice(0, 180);
}

function createFixtureAnswer(
  text: string,
  preferenceProjection: ChatAnswerRequest["preferenceProjection"],
): string {
  const summary = summarize(text);
  const language = preferenceProjection?.preferredResponseLanguage;
  const length = preferenceProjection?.preferredResponseLength;
  const style = preferenceProjection?.preferredResponseStyle;
  if (language === "zh") {
    if (length === "short") {
      return `Fixture answer: \u5df2\u6309\u4e2d\u6587\u548c\u7b80\u77ed\u504f\u597d\u56de\u7b54\uff1a${summary}\u3002`;
    }
    const styleNote =
      style === "friendly"
        ? "\u8bed\u6c14\u53cb\u597d"
        : style === "technical"
          ? "\u6280\u672f\u98ce\u683c"
          : style === "concise"
            ? "\u7b80\u6d01\u98ce\u683c"
            : "\u4e2d\u6587\u56de\u7b54";
    const lengthNote =
      length === "detailed" ? "\uff0c\u5e76\u504f\u5411\u66f4\u8be6\u7ec6" : "";
    return `Fixture answer: \u6211\u6536\u5230\u4e86\u4f60\u5173\u4e8e "${summary}" \u7684\u95ee\u9898\uff1b\u5df2\u5e94\u7528${styleNote}${lengthNote}\u504f\u597d\u3002`;
  }
  if (length === "short") {
    return `Fixture answer: Short preference applied for "${summary}".`;
  }
  const styleNote =
    style === "friendly"
      ? " Friendly tone preference applied."
      : style === "technical"
        ? " Technical tone preference applied."
        : style === "concise"
          ? " Concise tone preference applied."
          : "";
  const lengthNote =
    length === "detailed" ? " Detailed answer preference applied." : "";
  return `Fixture answer: I received your question about "${summary}".${styleNote}${lengthNote} A real answer provider is not connected in this fixture-only scope.`;
}
