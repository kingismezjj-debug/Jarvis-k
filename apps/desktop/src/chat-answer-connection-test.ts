import type { ChatAnswerProviderConnectionTestStatus } from "@jarvis-k/contracts";
import {
  CHAT_ANSWER_DEEPSEEK_MODEL_ID,
  type ChatAnswerProviderConfiguration,
} from "./secure-chat-answer-provider-store";

export const CHAT_ANSWER_CONNECTION_TEST_MAX_TOKENS = 128;

export interface DeepSeekChatAnswerConnectionTestRequestBody {
  readonly model: typeof CHAT_ANSWER_DEEPSEEK_MODEL_ID;
  readonly messages: readonly [
    { readonly role: "system"; readonly content: string },
    { readonly role: "user"; readonly content: string },
  ];
  readonly response_format: { readonly type: "json_object" };
  readonly stream: false;
  readonly temperature: 0;
  readonly thinking: { readonly type: "disabled" };
  readonly max_tokens: typeof CHAT_ANSWER_CONNECTION_TEST_MAX_TOKENS;
}

export function createDeepSeekChatAnswerConnectionTestRequestBody(): DeepSeekChatAnswerConnectionTestRequestBody {
  return {
    model: CHAT_ANSWER_DEEPSEEK_MODEL_ID,
    messages: [
      {
        role: "system",
        content: [
          "You are validating an online answer connection.",
          "Return JSON only.",
          "Return no Markdown code fence.",
          "Return no explanation text.",
          'Return exactly {"status":"answered","answer":"ok"}.',
        ].join(" "),
      },
      {
        role: "user",
        content:
          'Return exactly this JSON object and nothing else: {"status":"answered","answer":"ok"}',
      },
    ],
    response_format: { type: "json_object" },
    stream: false,
    temperature: 0,
    thinking: { type: "disabled" },
    max_tokens: CHAT_ANSWER_CONNECTION_TEST_MAX_TOKENS,
  };
}

export function classifyDeepSeekChatAnswerConnectionTestResponse(
  body: unknown,
): ChatAnswerProviderConnectionTestStatus {
  if (!isRecord(body) || !Array.isArray(body.choices)) {
    return "malformed_response";
  }
  const choice = body.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) {
    return "malformed_response";
  }
  const message = choice.message;
  if (
    message.role !== "assistant" ||
    hasOwn(message, "tool_calls") ||
    hasOwn(message, "function_call")
  ) {
    return "malformed_response";
  }
  const reasoningPresent =
    hasNonEmptyOfficialText(message.reasoning_content) ||
    hasNonEmptyOfficialText(choice.reasoning_content);
  if (choice.finish_reason === "length") {
    return "incomplete_response";
  }
  const content = message.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    return reasoningPresent ? "incomplete_response" : "malformed_response";
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content.trim());
  } catch {
    return "malformed_response";
  }
  return isExactConnectionTestAnswer(parsed) ? "success" : "malformed_response";
}

export function createDeepSeekChatAnswerConnectionTestHeaders(
  configuration: ChatAnswerProviderConfiguration,
): Record<string, string> {
  return {
    Authorization: `Bearer ${configuration.credentials.apiKey}`,
    "Content-Type": "application/json",
  };
}

function isExactConnectionTestAnswer(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  const keys = Object.keys(value).sort();
  return (
    keys.length === 2 &&
    keys[0] === "answer" &&
    keys[1] === "status" &&
    value.status === "answered" &&
    typeof value.answer === "string" &&
    value.answer.trim().length > 0 &&
    value.answer.length <= 32
  );
}

function hasNonEmptyOfficialText(value: unknown): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.some(hasNonEmptyOfficialText);
  }
  if (isRecord(value)) {
    return (
      hasNonEmptyOfficialText(value.text) ||
      hasNonEmptyOfficialText(value.content)
    );
  }
  return false;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
