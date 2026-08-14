const MAX_SHAPE_CONTENT_CHARS = 2_000;
const SHAPE_SECRET_PATTERN =
  /(?:\bBearer\b|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret|sk-[A-Za-z0-9_-]{8,})/iu;

export type GlmProviderHealthResponseTopLevelShape =
  | "object"
  | "array"
  | "string"
  | "nullish"
  | "other";

export type GlmProviderHealthChoicesShape =
  | "chat_completion_choices"
  | "missing_choices"
  | "choices_not_array"
  | "empty_choices"
  | "first_choice_not_object";

export type GlmProviderHealthMessageShape =
  | "assistant_message"
  | "missing_role_message"
  | "non_assistant_message"
  | "missing_message"
  | "message_not_object"
  | "delta_only";

export type GlmProviderHealthFinishReasonShape =
  | "stop"
  | "length"
  | "tool_calls"
  | "missing"
  | "other";

export type GlmProviderHealthContentShape =
  | "object"
  | "json_string"
  | "prefixed_json_string"
  | "plain_string"
  | "empty_string"
  | "array"
  | "missing"
  | "oversized"
  | "secret_like"
  | "other";

export type GlmProviderHealthJsonExtractionShape =
  | "object_value"
  | "exact_json_object"
  | "prefixed_json_object"
  | "malformed_json"
  | "no_json_object"
  | "not_attempted";

export type GlmProviderHealthSignalShape =
  | "supported_status"
  | "supported_boolean"
  | "unsupported_status"
  | "missing_health_signal"
  | "unsafe_output"
  | "not_inspected";

export type GlmProviderHealthContentLengthBucket =
  | "none"
  | "zero"
  | "1_128"
  | "129_512"
  | "513_2000"
  | "over_2000";

export type GlmProviderHealthResponseShapeRecommendation =
  | "keep_fail_closed"
  | "fixture_add_missing_choices_case"
  | "fixture_add_delta_only_case"
  | "fixture_add_content_array_case"
  | "fixture_add_plain_string_case"
  | "fixture_add_malformed_json_case"
  | "fixture_add_unsupported_status_case"
  | "fixture_add_unsafe_output_case"
  | "consider_bounded_content_block_parser"
  | "consider_finish_reason_length_handling"
  | "eligible_for_shape_only_runtime_diagnostic_request";

export interface GlmProviderHealthResponseShapeClassification {
  readonly status: "fixture_only";
  readonly networkAccessed: false;
  readonly credentialAccessed: false;
  readonly realApiCalled: false;
  readonly rawResponsePersisted: false;
  readonly rawContentPersisted: false;
  readonly topLevelShape: GlmProviderHealthResponseTopLevelShape;
  readonly choicesShape: GlmProviderHealthChoicesShape;
  readonly choiceCountBucket: "none" | "one" | "many";
  readonly messageShape: GlmProviderHealthMessageShape;
  readonly finishReasonShape: GlmProviderHealthFinishReasonShape;
  readonly contentShape: GlmProviderHealthContentShape;
  readonly contentLengthBucket: GlmProviderHealthContentLengthBucket;
  readonly jsonExtractionShape: GlmProviderHealthJsonExtractionShape;
  readonly healthSignalShape: GlmProviderHealthSignalShape;
  readonly unsafeSignalCounts: {
    readonly toolCalls: number;
    readonly functionCalls: number;
    readonly directAction: number;
    readonly executionShapedOutput: number;
    readonly secretLikeContent: number;
    readonly oversizedContent: number;
  };
  readonly recommendations: readonly GlmProviderHealthResponseShapeRecommendation[];
  readonly reasonCodes: readonly string[];
}

export function classifyGlmProviderHealthResponseShape(
  body: unknown
): GlmProviderHealthResponseShapeClassification {
  const topLevelShape = classifyTopLevelShape(body);
  if (!isRecord(body)) {
    return shapeResult({
      topLevelShape,
      choicesShape: "missing_choices",
      reasonCodes: ["GLM_HEALTH_SHAPE_TOP_LEVEL_NOT_OBJECT"]
    });
  }

  const choices = body.choices;
  if (!Object.prototype.hasOwnProperty.call(body, "choices")) {
    return shapeResult({
      topLevelShape,
      choicesShape: "missing_choices",
      reasonCodes: ["GLM_HEALTH_SHAPE_CHOICES_MISSING"]
    });
  }
  if (!Array.isArray(choices)) {
    return shapeResult({
      topLevelShape,
      choicesShape: "choices_not_array",
      reasonCodes: ["GLM_HEALTH_SHAPE_CHOICES_NOT_ARRAY"]
    });
  }
  if (choices.length === 0) {
    return shapeResult({
      topLevelShape,
      choicesShape: "empty_choices",
      choiceCountBucket: "none",
      reasonCodes: ["GLM_HEALTH_SHAPE_CHOICES_EMPTY"]
    });
  }

  const firstChoice = choices[0];
  if (!isRecord(firstChoice)) {
    return shapeResult({
      topLevelShape,
      choicesShape: "first_choice_not_object",
      choiceCountBucket: choices.length === 1 ? "one" : "many",
      reasonCodes: ["GLM_HEALTH_SHAPE_FIRST_CHOICE_NOT_OBJECT"]
    });
  }

  const finishReasonShape = classifyFinishReasonShape(
    firstChoice.finish_reason
  );
  const message = firstChoice.message;
  if (!Object.prototype.hasOwnProperty.call(firstChoice, "message")) {
    return shapeResult({
      topLevelShape,
      choicesShape: "chat_completion_choices",
      choiceCountBucket: choices.length === 1 ? "one" : "many",
      messageShape: isRecord(firstChoice.delta)
        ? "delta_only"
        : "missing_message",
      finishReasonShape,
      reasonCodes: [
        isRecord(firstChoice.delta)
          ? "GLM_HEALTH_SHAPE_DELTA_ONLY"
          : "GLM_HEALTH_SHAPE_MESSAGE_MISSING"
      ]
    });
  }
  if (!isRecord(message)) {
    return shapeResult({
      topLevelShape,
      choicesShape: "chat_completion_choices",
      choiceCountBucket: choices.length === 1 ? "one" : "many",
      messageShape: "message_not_object",
      finishReasonShape,
      reasonCodes: ["GLM_HEALTH_SHAPE_MESSAGE_NOT_OBJECT"]
    });
  }

  const unsafeMessageCounts = countUnsafeSignals(message);
  const messageShape = classifyMessageShape(message);
  const content = message.content;
  const parsedContent = classifyContent(content);
  const unsafeContentCounts = countUnsafeSignals(parsedContent.value);
  const unsafeSignalCounts = addUnsafeSignalCounts(
    unsafeMessageCounts,
    addUnsafeSignalCounts(unsafeContentCounts, {
      ...emptyUnsafeSignalCounts(),
      secretLikeContent: parsedContent.contentShape === "secret_like" ? 1 : 0,
      oversizedContent: parsedContent.contentShape === "oversized" ? 1 : 0
    })
  );
  const healthSignalShape =
    hasAnyUnsafeSignal(unsafeSignalCounts) ||
    parsedContent.contentShape === "secret_like" ||
    parsedContent.contentShape === "oversized"
      ? "unsafe_output"
      : classifyHealthSignalShape(parsedContent.value);

  return shapeResult({
    topLevelShape,
    choicesShape: "chat_completion_choices",
    choiceCountBucket: choices.length === 1 ? "one" : "many",
    messageShape,
    finishReasonShape,
    contentShape: parsedContent.contentShape,
    contentLengthBucket: parsedContent.contentLengthBucket,
    jsonExtractionShape: parsedContent.jsonExtractionShape,
    healthSignalShape,
    unsafeSignalCounts,
    reasonCodes: reasonCodesFor({
      finishReasonShape,
      messageShape,
      parsedContent,
      healthSignalShape,
      unsafeSignalCounts
    })
  });
}

function shapeResult(input: {
  readonly topLevelShape: GlmProviderHealthResponseTopLevelShape;
  readonly choicesShape: GlmProviderHealthChoicesShape;
  readonly choiceCountBucket?: "none" | "one" | "many";
  readonly messageShape?: GlmProviderHealthMessageShape;
  readonly finishReasonShape?: GlmProviderHealthFinishReasonShape;
  readonly contentShape?: GlmProviderHealthContentShape;
  readonly contentLengthBucket?: GlmProviderHealthContentLengthBucket;
  readonly jsonExtractionShape?: GlmProviderHealthJsonExtractionShape;
  readonly healthSignalShape?: GlmProviderHealthSignalShape;
  readonly unsafeSignalCounts?: GlmProviderHealthResponseShapeClassification["unsafeSignalCounts"];
  readonly reasonCodes: readonly string[];
}): GlmProviderHealthResponseShapeClassification {
  const result = {
    status: "fixture_only" as const,
    networkAccessed: false as const,
    credentialAccessed: false as const,
    realApiCalled: false as const,
    rawResponsePersisted: false as const,
    rawContentPersisted: false as const,
    topLevelShape: input.topLevelShape,
    choicesShape: input.choicesShape,
    choiceCountBucket: input.choiceCountBucket ?? "none",
    messageShape: input.messageShape ?? "missing_message",
    finishReasonShape: input.finishReasonShape ?? "missing",
    contentShape: input.contentShape ?? "missing",
    contentLengthBucket: input.contentLengthBucket ?? "none",
    jsonExtractionShape: input.jsonExtractionShape ?? "not_attempted",
    healthSignalShape: input.healthSignalShape ?? "not_inspected",
    unsafeSignalCounts: input.unsafeSignalCounts ?? emptyUnsafeSignalCounts(),
    reasonCodes: [
      "GLM_HEALTH_RESPONSE_SHAPE_FIXTURE_ONLY",
      ...input.reasonCodes
    ]
  };
  return {
    ...result,
    recommendations: recommendationsFor(result)
  };
}

function classifyTopLevelShape(
  value: unknown
): GlmProviderHealthResponseTopLevelShape {
  if (value === null || value === undefined) {
    return "nullish";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  if (isRecord(value)) {
    return "object";
  }
  if (typeof value === "string") {
    return "string";
  }
  return "other";
}

function classifyMessageShape(
  message: Record<string, unknown>
): GlmProviderHealthMessageShape {
  if (message.role === undefined) {
    return "missing_role_message";
  }
  return message.role === "assistant"
    ? "assistant_message"
    : "non_assistant_message";
}

function classifyFinishReasonShape(
  value: unknown
): GlmProviderHealthFinishReasonShape {
  if (value === undefined) {
    return "missing";
  }
  if (value === "stop" || value === "length" || value === "tool_calls") {
    return value;
  }
  return "other";
}

function classifyContent(value: unknown): {
  readonly contentShape: GlmProviderHealthContentShape;
  readonly contentLengthBucket: GlmProviderHealthContentLengthBucket;
  readonly jsonExtractionShape: GlmProviderHealthJsonExtractionShape;
  readonly value: unknown;
} {
  if (value === undefined) {
    return {
      contentShape: "missing",
      contentLengthBucket: "none",
      jsonExtractionShape: "not_attempted",
      value: undefined
    };
  }
  if (isRecord(value)) {
    return {
      contentShape: "object",
      contentLengthBucket: "none",
      jsonExtractionShape: "object_value",
      value
    };
  }
  if (Array.isArray(value)) {
    return {
      contentShape: "array",
      contentLengthBucket: "none",
      jsonExtractionShape: "not_attempted",
      value
    };
  }
  if (typeof value !== "string") {
    return {
      contentShape: "other",
      contentLengthBucket: "none",
      jsonExtractionShape: "not_attempted",
      value
    };
  }

  const contentLengthBucket = bucketContentLength(value.length);
  if (value.length === 0) {
    return {
      contentShape: "empty_string",
      contentLengthBucket,
      jsonExtractionShape: "not_attempted",
      value
    };
  }
  if (value.length > MAX_SHAPE_CONTENT_CHARS) {
    return {
      contentShape: "oversized",
      contentLengthBucket,
      jsonExtractionShape: "not_attempted",
      value: undefined
    };
  }
  if (SHAPE_SECRET_PATTERN.test(value)) {
    return {
      contentShape: "secret_like",
      contentLengthBucket,
      jsonExtractionShape: "not_attempted",
      value: undefined
    };
  }

  const extracted = extractFirstJsonObject(value);
  if (extracted === undefined) {
    return {
      contentShape: "plain_string",
      contentLengthBucket,
      jsonExtractionShape: "no_json_object",
      value
    };
  }
  try {
    const parsed = JSON.parse(extracted.json);
    return {
      contentShape:
        extracted.kind === "exact_json_object"
          ? "json_string"
          : "prefixed_json_string",
      contentLengthBucket,
      jsonExtractionShape: extracted.kind,
      value: parsed
    };
  } catch {
    return {
      contentShape:
        extracted.kind === "exact_json_object"
          ? "json_string"
          : "prefixed_json_string",
      contentLengthBucket,
      jsonExtractionShape: "malformed_json",
      value: undefined
    };
  }
}

function classifyHealthSignalShape(
  value: unknown
): GlmProviderHealthSignalShape {
  const unwrapped = unwrapHealthContent(value);
  if (!isRecord(unwrapped)) {
    return "missing_health_signal";
  }
  const status = normalizeHealthToken(
    unwrapped.status ??
      unwrapped.health ??
      unwrapped.state ??
      unwrapped.result ??
      unwrapped.message
  );
  if (
    status === "ok" ||
    status === "healthy" ||
    status === "ready" ||
    status === "success" ||
    status === "successful" ||
    status === "passed" ||
    status === "available"
  ) {
    return "supported_status";
  }
  if (status.length > 0) {
    return "unsupported_status";
  }
  if (
    unwrapped.ok === true ||
    unwrapped.healthy === true ||
    unwrapped.ready === true ||
    unwrapped.success === true ||
    unwrapped.available === true ||
    unwrapped.alive === true
  ) {
    return "supported_boolean";
  }
  return "missing_health_signal";
}

function countUnsafeSignals(
  value: unknown
): GlmProviderHealthResponseShapeClassification["unsafeSignalCounts"] {
  if (!isRecord(value)) {
    return emptyUnsafeSignalCounts();
  }
  return {
    toolCalls: Object.prototype.hasOwnProperty.call(value, "tool_calls")
      ? 1
      : 0,
    functionCalls: Object.prototype.hasOwnProperty.call(value, "function_call")
      ? 1
      : 0,
    directAction: value.directActionAttempted === true ? 1 : 0,
    executionShapedOutput:
      value.execute === true || value.action === "execute" ? 1 : 0,
    secretLikeContent: 0,
    oversizedContent: 0
  };
}

function addUnsafeSignalCounts(
  left: GlmProviderHealthResponseShapeClassification["unsafeSignalCounts"],
  right: GlmProviderHealthResponseShapeClassification["unsafeSignalCounts"]
): GlmProviderHealthResponseShapeClassification["unsafeSignalCounts"] {
  return {
    toolCalls: left.toolCalls + right.toolCalls,
    functionCalls: left.functionCalls + right.functionCalls,
    directAction: left.directAction + right.directAction,
    executionShapedOutput:
      left.executionShapedOutput + right.executionShapedOutput,
    secretLikeContent: left.secretLikeContent + right.secretLikeContent,
    oversizedContent: left.oversizedContent + right.oversizedContent
  };
}

function emptyUnsafeSignalCounts(): GlmProviderHealthResponseShapeClassification["unsafeSignalCounts"] {
  return {
    toolCalls: 0,
    functionCalls: 0,
    directAction: 0,
    executionShapedOutput: 0,
    secretLikeContent: 0,
    oversizedContent: 0
  };
}

function reasonCodesFor(input: {
  readonly finishReasonShape: GlmProviderHealthFinishReasonShape;
  readonly messageShape: GlmProviderHealthMessageShape;
  readonly parsedContent: ReturnType<typeof classifyContent>;
  readonly healthSignalShape: GlmProviderHealthSignalShape;
  readonly unsafeSignalCounts: GlmProviderHealthResponseShapeClassification["unsafeSignalCounts"];
}): string[] {
  const reasonCodes = ["GLM_HEALTH_SHAPE_CHAT_COMPLETION_ENVELOPE"];
  if (input.messageShape === "missing_role_message") {
    reasonCodes.push("GLM_HEALTH_SHAPE_MESSAGE_ROLE_MISSING");
  }
  if (input.messageShape === "non_assistant_message") {
    reasonCodes.push("GLM_HEALTH_SHAPE_MESSAGE_ROLE_UNSUPPORTED");
  }
  if (input.finishReasonShape === "length") {
    reasonCodes.push("GLM_HEALTH_SHAPE_FINISH_REASON_LENGTH");
  }
  if (input.finishReasonShape === "tool_calls") {
    reasonCodes.push("GLM_HEALTH_SHAPE_FINISH_REASON_TOOL_CALLS");
  }
  if (input.parsedContent.contentShape === "array") {
    reasonCodes.push("GLM_HEALTH_SHAPE_CONTENT_ARRAY");
  }
  if (input.parsedContent.contentShape === "plain_string") {
    reasonCodes.push("GLM_HEALTH_SHAPE_CONTENT_PLAIN_STRING");
  }
  if (input.parsedContent.jsonExtractionShape === "malformed_json") {
    reasonCodes.push("GLM_HEALTH_SHAPE_CONTENT_MALFORMED_JSON");
  }
  if (input.healthSignalShape === "supported_status") {
    reasonCodes.push("GLM_HEALTH_SHAPE_SUPPORTED_STATUS");
  }
  if (input.healthSignalShape === "supported_boolean") {
    reasonCodes.push("GLM_HEALTH_SHAPE_SUPPORTED_BOOLEAN");
  }
  if (input.healthSignalShape === "unsupported_status") {
    reasonCodes.push("GLM_HEALTH_SHAPE_UNSUPPORTED_STATUS");
  }
  if (input.healthSignalShape === "missing_health_signal") {
    reasonCodes.push("GLM_HEALTH_SHAPE_HEALTH_SIGNAL_MISSING");
  }
  if (input.healthSignalShape === "unsafe_output") {
    reasonCodes.push("GLM_HEALTH_SHAPE_UNSAFE_OUTPUT");
  }
  if (input.parsedContent.contentShape === "secret_like") {
    reasonCodes.push("GLM_HEALTH_SHAPE_SECRET_LIKE_CONTENT");
  }
  if (input.parsedContent.contentShape === "oversized") {
    reasonCodes.push("GLM_HEALTH_SHAPE_OVERSIZED_CONTENT");
  }
  return reasonCodes;
}

function recommendationsFor(
  result: Omit<
    GlmProviderHealthResponseShapeClassification,
    "recommendations"
  >
): GlmProviderHealthResponseShapeRecommendation[] {
  const recommendations: GlmProviderHealthResponseShapeRecommendation[] = [
    "keep_fail_closed",
    "eligible_for_shape_only_runtime_diagnostic_request"
  ];
  if (
    result.choicesShape === "missing_choices" ||
    result.choicesShape === "choices_not_array" ||
    result.choicesShape === "empty_choices"
  ) {
    recommendations.push("fixture_add_missing_choices_case");
  }
  if (result.messageShape === "delta_only") {
    recommendations.push("fixture_add_delta_only_case");
  }
  if (result.contentShape === "array") {
    recommendations.push(
      "fixture_add_content_array_case",
      "consider_bounded_content_block_parser"
    );
  }
  if (result.contentShape === "plain_string") {
    recommendations.push("fixture_add_plain_string_case");
  }
  if (result.jsonExtractionShape === "malformed_json") {
    recommendations.push("fixture_add_malformed_json_case");
  }
  if (result.healthSignalShape === "unsupported_status") {
    recommendations.push("fixture_add_unsupported_status_case");
  }
  if (result.healthSignalShape === "unsafe_output") {
    recommendations.push("fixture_add_unsafe_output_case");
  }
  if (result.finishReasonShape === "length") {
    recommendations.push("consider_finish_reason_length_handling");
  }
  return [...new Set(recommendations)];
}

function bucketContentLength(
  length: number
): GlmProviderHealthContentLengthBucket {
  if (length === 0) {
    return "zero";
  }
  if (length <= 128) {
    return "1_128";
  }
  if (length <= 512) {
    return "129_512";
  }
  if (length <= MAX_SHAPE_CONTENT_CHARS) {
    return "513_2000";
  }
  return "over_2000";
}

function extractFirstJsonObject(
  value: string
): { readonly kind: "exact_json_object" | "prefixed_json_object"; readonly json: string } | undefined {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return undefined;
  }
  return {
    kind:
      value.slice(0, start).trim().length === 0 &&
      value.slice(end + 1).trim().length === 0
        ? "exact_json_object"
        : "prefixed_json_object",
    json: value.slice(start, end + 1)
  };
}

function unwrapHealthContent(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  for (const key of ["result", "data", "output", "response", "health"]) {
    const nested = value[key];
    if (isRecord(nested)) {
      return nested;
    }
  }
  return value;
}

function normalizeHealthToken(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/[\s-]+/gu, "_").toLowerCase()
    : "";
}

function hasAnyUnsafeSignal(
  counts: GlmProviderHealthResponseShapeClassification["unsafeSignalCounts"]
): boolean {
  return (
    counts.toolCalls > 0 ||
    counts.functionCalls > 0 ||
    counts.directAction > 0 ||
    counts.executionShapedOutput > 0 ||
    counts.secretLikeContent > 0 ||
    counts.oversizedContent > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
