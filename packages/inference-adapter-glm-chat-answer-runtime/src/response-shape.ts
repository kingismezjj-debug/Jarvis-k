const MAX_CONTENT_CHARS = 4_000;
const SECRET_PATTERN =
  /(?:\bBearer\b|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret|sk-[A-Za-z0-9_-]{8,})/iu;

export type OpenAiCompatibleChatAnswerResponseShape =
  | "object"
  | "array"
  | "other";

export type OpenAiCompatibleChatAnswerChoicesShape =
  | "missing"
  | "array"
  | "other";

export type OpenAiCompatibleChatAnswerMessageShape =
  | "assistant_message"
  | "assistant_message_content_array"
  | "assistant_message_content_object"
  | "non_assistant_message"
  | "message_not_object"
  | "missing_message";

export type OpenAiCompatibleChatAnswerContentShape =
  | "missing"
  | "empty_string"
  | "plain_string"
  | "json_string"
  | "prefixed_json_string"
  | "array"
  | "object"
  | "secret_like"
  | "oversized"
  | "unsupported_array"
  | "other";

export type OpenAiCompatibleChatAnswerJsonExtractionShape =
  | "not_attempted"
  | "exact_json_object"
  | "prefixed_json_object"
  | "malformed_json"
  | "object_value"
  | "array_text_join"
  | "no_json_object";

export interface OpenAiCompatibleChatAnswerResponseShapeClassification {
  readonly topLevelShape: OpenAiCompatibleChatAnswerResponseShape;
  readonly choicesShape: OpenAiCompatibleChatAnswerChoicesShape;
  readonly choiceCountBucket: "zero" | "one" | "many" | "unknown";
  readonly messageShape: OpenAiCompatibleChatAnswerMessageShape;
  readonly finishReasonShape: "missing" | "stop" | "length" | "other";
  readonly contentShape: OpenAiCompatibleChatAnswerContentShape;
  readonly contentLengthBucket:
    | "none"
    | "zero"
    | "short"
    | "medium"
    | "long"
    | "oversized";
  readonly jsonExtractionShape: OpenAiCompatibleChatAnswerJsonExtractionShape;
  readonly normalizedContentKind:
    | "unavailable"
    | "string"
    | "object"
    | "array_text_join";
  readonly answerSignalShape:
    | "answered_status"
    | "clarify_status"
    | "blocked_status"
    | "blocked_signal"
    | "missing_signal"
    | "other_status";
  readonly extraFieldShapes: {
    readonly choiceReasoningContentShape:
      | "missing"
      | "string"
      | "array"
      | "object"
      | "other";
    readonly messageReasoningContentShape:
      | "missing"
      | "string"
      | "array"
      | "object"
      | "other";
    readonly choiceReasoningShape:
      | "missing"
      | "string"
      | "array"
      | "object"
      | "other";
    readonly messageReasoningShape:
      | "missing"
      | "string"
      | "array"
      | "object"
      | "other";
    readonly choiceReasoningLengthBucket: ContentLengthBucket;
    readonly messageReasoningLengthBucket: ContentLengthBucket;
  };
  readonly unsafeSignalCounts: {
    readonly toolCalls: number;
    readonly functionCalls: number;
    readonly secretLikeContent: number;
    readonly oversizedContent: number;
  };
  readonly reasonCodes: readonly string[];
}

type ContentLengthBucket =
  OpenAiCompatibleChatAnswerResponseShapeClassification["contentLengthBucket"];

const BLOCKED_SIGNAL_PATTERN =
  /(?:cannot\s+help|can't\s+help|cannot\s+comply|can't\s+comply|unsafe|harmful|policy|refus|den(?:y|ied)|blocked)/iu;

export function classifyOpenAiCompatibleChatAnswerResponseShape(
  body: unknown
): OpenAiCompatibleChatAnswerResponseShapeClassification {
  if (!isRecord(body)) {
    return createShape({
      topLevelShape: Array.isArray(body) ? "array" : "other",
      choicesShape: "missing",
      choiceCountBucket: "unknown",
      messageShape: "missing_message",
      finishReasonShape: "missing",
      contentShape: "missing",
      contentLengthBucket: "none",
      jsonExtractionShape: "not_attempted",
      normalizedContentKind: "unavailable",
      answerSignalShape: "missing_signal",
      extraFieldShapes: emptyExtraFieldShapes(),
      unsafeSignalCounts: emptyUnsafeSignals(),
      reasonCodes: ["CHAT_ANSWER_SHAPE_TOP_LEVEL_INVALID"]
    });
  }

  const choices = body.choices;
  if (!Array.isArray(choices)) {
    return createShape({
      topLevelShape: "object",
      choicesShape: choices === undefined ? "missing" : "other",
      choiceCountBucket: "unknown",
      messageShape: "missing_message",
      finishReasonShape: "missing",
      contentShape: "missing",
      contentLengthBucket: "none",
      jsonExtractionShape: "not_attempted",
      normalizedContentKind: "unavailable",
      answerSignalShape: "missing_signal",
      extraFieldShapes: emptyExtraFieldShapes(),
      unsafeSignalCounts: emptyUnsafeSignals(),
      reasonCodes: ["CHAT_ANSWER_SHAPE_CHOICES_INVALID"]
    });
  }

  const firstChoice = choices[0];
  if (!isRecord(firstChoice)) {
    return createShape({
      topLevelShape: "object",
      choicesShape: "array",
      choiceCountBucket: bucketChoiceCount(choices.length),
      messageShape: "missing_message",
      finishReasonShape: classifyFinishReason(undefined),
      contentShape: "missing",
      contentLengthBucket: "none",
      jsonExtractionShape: "not_attempted",
      normalizedContentKind: "unavailable",
      answerSignalShape: "missing_signal",
      extraFieldShapes: emptyExtraFieldShapes(),
      unsafeSignalCounts: emptyUnsafeSignals(),
      reasonCodes: ["CHAT_ANSWER_SHAPE_FIRST_CHOICE_INVALID"]
    });
  }

  const finishReasonShape = classifyFinishReason(firstChoice.finish_reason);
  const message = firstChoice.message;
  if (!isRecord(message)) {
    return createShape({
      topLevelShape: "object",
      choicesShape: "array",
      choiceCountBucket: bucketChoiceCount(choices.length),
      messageShape: "message_not_object",
      finishReasonShape,
      contentShape: "missing",
      contentLengthBucket: "none",
      jsonExtractionShape: "not_attempted",
      normalizedContentKind: "unavailable",
      answerSignalShape: "missing_signal",
      extraFieldShapes: classifyExtraFieldShapes(firstChoice, undefined),
      unsafeSignalCounts: countUnsafeSignals(firstChoice),
      reasonCodes: ["CHAT_ANSWER_SHAPE_MESSAGE_INVALID"]
    });
  }

  const messageShape = classifyMessageShape(message);
  const content = classifyContent(message.content);
  const parsedValue =
    content.normalizedContentKind === "string"
      ? parseStringContent(content.value)
      : content.normalizedContentKind === "object"
        ? { extraction: "object_value" as const, value: content.value }
        : undefined;
  const answerSignalShape = classifyAnswerSignal(
    parsedValue?.value,
    content.joinedText
  );
  const extraFieldShapes = classifyExtraFieldShapes(firstChoice, message);
  const unsafeSignalCounts = {
    ...countUnsafeSignals(message),
    secretLikeContent: content.contentShape === "secret_like" ? 1 : 0,
    oversizedContent: content.contentShape === "oversized" ? 1 : 0
  };

  return createShape({
    topLevelShape: "object",
    choicesShape: "array",
    choiceCountBucket: bucketChoiceCount(choices.length),
    messageShape,
    finishReasonShape,
    contentShape: content.contentShape,
    contentLengthBucket: content.contentLengthBucket,
    jsonExtractionShape:
      parsedValue?.extraction ?? content.jsonExtractionShape,
    normalizedContentKind: content.normalizedContentKind,
    answerSignalShape,
    extraFieldShapes,
    unsafeSignalCounts,
    reasonCodes: reasonCodesFor({
      messageShape,
      contentShape: content.contentShape,
      answerSignalShape,
      extraFieldShapes,
      finishReasonShape,
      normalizedContentKind: content.normalizedContentKind
    })
  });
}

function classifyMessageShape(
  message: Record<string, unknown>
): OpenAiCompatibleChatAnswerMessageShape {
  if (message.role !== "assistant") {
    return "non_assistant_message";
  }
  if (Array.isArray(message.content)) {
    return "assistant_message_content_array";
  }
  if (isRecord(message.content)) {
    return "assistant_message_content_object";
  }
  return "assistant_message";
}

function classifyContent(value: unknown): {
  readonly contentShape: OpenAiCompatibleChatAnswerContentShape;
  readonly contentLengthBucket: ContentLengthBucket;
  readonly jsonExtractionShape: OpenAiCompatibleChatAnswerJsonExtractionShape;
  readonly normalizedContentKind:
    | "unavailable"
    | "string"
    | "object"
    | "array_text_join";
  readonly value: unknown;
  readonly joinedText?: string;
} {
  if (value === undefined) {
    return {
      contentShape: "missing",
      contentLengthBucket: "none",
      jsonExtractionShape: "not_attempted",
      normalizedContentKind: "unavailable",
      value: undefined
    };
  }
  if (typeof value === "string") {
    return classifyStringContent(value);
  }
  if (isRecord(value)) {
    return {
      contentShape: "object",
      contentLengthBucket: "none",
      jsonExtractionShape: "object_value",
      normalizedContentKind: "object",
      value
    };
  }
  if (Array.isArray(value)) {
    const joinedText = value
      .map(extractTextPart)
      .filter((part): part is string => part !== undefined)
      .join("")
      .trim();
    if (joinedText.length === 0) {
      return {
        contentShape: "unsupported_array",
        contentLengthBucket: "none",
        jsonExtractionShape: "not_attempted",
        normalizedContentKind: "unavailable",
        value
      };
    }
    const classified = classifyStringContent(joinedText);
    return {
      ...classified,
      contentShape: "array",
      jsonExtractionShape:
        classified.jsonExtractionShape === "not_attempted"
          ? "array_text_join"
          : classified.jsonExtractionShape,
      normalizedContentKind: "string",
      joinedText
    };
  }
  return {
    contentShape: "other",
    contentLengthBucket: "none",
    jsonExtractionShape: "not_attempted",
    normalizedContentKind: "unavailable",
    value
  };
}

function classifyStringContent(value: string) {
  const contentLengthBucket = bucketContentLength(value.length);
  if (value.length === 0) {
    return {
      contentShape: "empty_string" as const,
      contentLengthBucket,
      jsonExtractionShape: "not_attempted" as const,
      normalizedContentKind: "string" as const,
      value
    };
  }
  if (value.length > MAX_CONTENT_CHARS) {
    return {
      contentShape: "oversized" as const,
      contentLengthBucket,
      jsonExtractionShape: "not_attempted" as const,
      normalizedContentKind: "unavailable" as const,
      value: undefined
    };
  }
  if (SECRET_PATTERN.test(value)) {
    return {
      contentShape: "secret_like" as const,
      contentLengthBucket,
      jsonExtractionShape: "not_attempted" as const,
      normalizedContentKind: "unavailable" as const,
      value: undefined
    };
  }
  const extracted = extractFirstJsonObject(value);
  if (!extracted) {
    return {
      contentShape: "plain_string" as const,
      contentLengthBucket,
      jsonExtractionShape: "no_json_object" as const,
      normalizedContentKind: "string" as const,
      value
    };
  }
  return {
    contentShape:
      extracted.kind === "exact_json_object"
        ? ("json_string" as const)
        : ("prefixed_json_string" as const),
    contentLengthBucket,
    jsonExtractionShape: extracted.kind,
    normalizedContentKind: "string" as const,
    value
  };
}

function parseStringContent(value: unknown):
  | { readonly extraction: OpenAiCompatibleChatAnswerJsonExtractionShape; readonly value: unknown }
  | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const extracted = extractFirstJsonObject(value);
  if (!extracted) {
    return undefined;
  }
  try {
    return {
      extraction: extracted.kind,
      value: JSON.parse(extracted.json)
    };
  } catch {
    return {
      extraction: "malformed_json",
      value: undefined
    };
  }
}

function classifyAnswerSignal(
  value: unknown,
  joinedText?: string
):
  | "answered_status"
  | "clarify_status"
  | "blocked_status"
  | "blocked_signal"
  | "missing_signal"
  | "other_status" {
  if (!isRecord(value)) {
    if (typeof joinedText === "string" && BLOCKED_SIGNAL_PATTERN.test(joinedText)) {
      return "blocked_signal";
    }
    return "missing_signal";
  }
  const status = normalizeToken(
    value.status ?? value.result ?? value.answerStatus ?? value.message
  );
  if (status === "answered" || status === "answer" || status === "ok") {
    return "answered_status";
  }
  if (
    status === "clarify" ||
    status === "clarification" ||
    status === "needs_clarification"
  ) {
    return "clarify_status";
  }
  if (status === "blocked" || status === "unsafe" || status === "denied") {
    return "blocked_status";
  }
  if (
    value.blocked === true ||
    value.refusal === true ||
    typeof value.refusalMessage === "string" ||
    typeof value.message === "string" &&
      BLOCKED_SIGNAL_PATTERN.test(value.message)
  ) {
    return "blocked_signal";
  }
  return status.length > 0 ? "other_status" : "missing_signal";
}

function extractTextPart(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (!isRecord(value)) {
    return undefined;
  }
  if (typeof value.text === "string") {
    return value.text;
  }
  if (isRecord(value.text) && typeof value.text.value === "string") {
    return value.text.value;
  }
  if (typeof value.content === "string") {
    return value.content;
  }
  return undefined;
}

function extractFirstJsonObject(
  value: string
):
  | { readonly kind: "exact_json_object" | "prefixed_json_object"; readonly json: string }
  | undefined {
  const trimmed = value.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return { kind: "exact_json_object", json: trimmed };
  }
  const start = trimmed.indexOf("{");
  if (start < 0) {
    return undefined;
  }
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < trimmed.length; index += 1) {
    const character = trimmed[index];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === "\\") {
        escaped = true;
        continue;
      }
      if (character === "\"") {
        inString = false;
      }
      continue;
    }
    if (character === "\"") {
      inString = true;
      continue;
    }
    if (character === "{") {
      depth += 1;
      continue;
    }
    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return {
          kind: start === 0 ? "exact_json_object" : "prefixed_json_object",
          json: trimmed.slice(start, index + 1)
        };
      }
    }
  }
  return undefined;
}

function reasonCodesFor(input: {
  readonly messageShape: OpenAiCompatibleChatAnswerMessageShape;
  readonly contentShape: OpenAiCompatibleChatAnswerContentShape;
  readonly answerSignalShape: OpenAiCompatibleChatAnswerResponseShapeClassification["answerSignalShape"];
  readonly extraFieldShapes: OpenAiCompatibleChatAnswerResponseShapeClassification["extraFieldShapes"];
  readonly finishReasonShape: OpenAiCompatibleChatAnswerResponseShapeClassification["finishReasonShape"];
  readonly normalizedContentKind: OpenAiCompatibleChatAnswerResponseShapeClassification["normalizedContentKind"];
}): string[] {
  const reasonCodes = ["CHAT_ANSWER_SHAPE_CAPTURED"];
  if (input.messageShape === "assistant_message_content_array") {
    reasonCodes.push("CHAT_ANSWER_SHAPE_CONTENT_ARRAY");
  }
  if (input.contentShape === "prefixed_json_string") {
    reasonCodes.push("CHAT_ANSWER_SHAPE_PREFIXED_JSON");
  }
  if (input.answerSignalShape === "blocked_signal") {
    reasonCodes.push("CHAT_ANSWER_SHAPE_BLOCKED_SIGNAL_ONLY");
  }
  if (input.answerSignalShape === "missing_signal") {
    reasonCodes.push("CHAT_ANSWER_SHAPE_MISSING_SIGNAL");
  }
  if (input.finishReasonShape === "length") {
    reasonCodes.push("CHAT_ANSWER_SHAPE_FINISH_REASON_LENGTH");
  }
  if (input.normalizedContentKind === "unavailable") {
    reasonCodes.push("CHAT_ANSWER_SHAPE_CONTENT_UNAVAILABLE");
  }
  if (
    input.extraFieldShapes.messageReasoningContentShape !== "missing" ||
    input.extraFieldShapes.choiceReasoningContentShape !== "missing"
  ) {
    reasonCodes.push("CHAT_ANSWER_SHAPE_REASONING_CONTENT_PRESENT");
  }
  if (
    input.extraFieldShapes.messageReasoningShape !== "missing" ||
    input.extraFieldShapes.choiceReasoningShape !== "missing"
  ) {
    reasonCodes.push("CHAT_ANSWER_SHAPE_REASONING_FIELD_PRESENT");
  }
  return reasonCodes;
}

function createShape(
  value: OpenAiCompatibleChatAnswerResponseShapeClassification
): OpenAiCompatibleChatAnswerResponseShapeClassification {
  return value;
}

function emptyUnsafeSignals() {
  return {
    toolCalls: 0,
    functionCalls: 0,
    secretLikeContent: 0,
    oversizedContent: 0
  };
}

function emptyExtraFieldShapes(): OpenAiCompatibleChatAnswerResponseShapeClassification["extraFieldShapes"] {
  return {
    choiceReasoningContentShape: "missing",
    messageReasoningContentShape: "missing",
    choiceReasoningShape: "missing",
    messageReasoningShape: "missing",
    choiceReasoningLengthBucket: "none",
    messageReasoningLengthBucket: "none"
  };
}

function classifyExtraFieldShapes(
  choice: Record<string, unknown> | undefined,
  message: Record<string, unknown> | undefined
): OpenAiCompatibleChatAnswerResponseShapeClassification["extraFieldShapes"] {
  const choiceReasoningContent = classifyExtraField(choice?.reasoning_content);
  const messageReasoningContent = classifyExtraField(
    message?.reasoning_content
  );
  const choiceReasoning = classifyExtraField(choice?.reasoning);
  const messageReasoning = classifyExtraField(message?.reasoning);
  return {
    choiceReasoningContentShape: choiceReasoningContent.shape,
    messageReasoningContentShape: messageReasoningContent.shape,
    choiceReasoningShape: choiceReasoning.shape,
    messageReasoningShape: messageReasoning.shape,
    choiceReasoningLengthBucket: maxLengthBucket(
      choiceReasoningContent.lengthBucket,
      choiceReasoning.lengthBucket
    ),
    messageReasoningLengthBucket: maxLengthBucket(
      messageReasoningContent.lengthBucket,
      messageReasoning.lengthBucket
    )
  };
}

function classifyExtraField(value: unknown): {
  readonly shape: "missing" | "string" | "array" | "object" | "other";
  readonly lengthBucket: ContentLengthBucket;
} {
  if (value === undefined) {
    return { shape: "missing", lengthBucket: "none" };
  }
  if (typeof value === "string") {
    return { shape: "string", lengthBucket: bucketContentLength(value.length) };
  }
  if (Array.isArray(value)) {
    const joinedText = value
      .map(extractTextPart)
      .filter((part): part is string => part !== undefined)
      .join("")
      .trim();
    return {
      shape: "array",
      lengthBucket:
        joinedText.length === 0 ? "none" : bucketContentLength(joinedText.length)
    };
  }
  if (isRecord(value)) {
    const directText =
      typeof value.text === "string"
        ? value.text
        : typeof value.content === "string"
          ? value.content
          : undefined;
    return {
      shape: "object",
      lengthBucket:
        directText === undefined ? "none" : bucketContentLength(directText.length)
    };
  }
  return { shape: "other", lengthBucket: "none" };
}

function maxLengthBucket(
  left: ContentLengthBucket,
  right: ContentLengthBucket
): ContentLengthBucket {
  const order: ContentLengthBucket[] = [
    "none",
    "zero",
    "short",
    "medium",
    "long",
    "oversized"
  ];
  return order[Math.max(order.indexOf(left), order.indexOf(right))] ?? "none";
}

function countUnsafeSignals(value: Record<string, unknown>) {
  return {
    toolCalls: Object.prototype.hasOwnProperty.call(value, "tool_calls") ? 1 : 0,
    functionCalls: Object.prototype.hasOwnProperty.call(value, "function_call")
      ? 1
      : 0,
    secretLikeContent: 0,
    oversizedContent: 0
  };
}

function classifyFinishReason(
  value: unknown
): OpenAiCompatibleChatAnswerResponseShapeClassification["finishReasonShape"] {
  if (value === "stop" || value === "length") {
    return value;
  }
  return value === undefined ? "missing" : "other";
}

function bucketChoiceCount(length: number) {
  if (length === 0) return "zero";
  if (length === 1) return "one";
  return "many";
}

function bucketContentLength(length: number): ContentLengthBucket {
  if (length === 0) return "zero";
  if (length <= 64) return "short";
  if (length <= 512) return "medium";
  if (length <= MAX_CONTENT_CHARS) return "long";
  return "oversized";
}

function normalizeToken(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/[\s-]+/gu, "_").toLowerCase()
    : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
