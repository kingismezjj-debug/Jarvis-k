import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  classifyDeepSeekChatAnswerConnectionTestResponse,
  createDeepSeekChatAnswerConnectionTestRequestBody,
} = require("../apps/desktop/dist/chat-answer-connection-test.js");

const request = createDeepSeekChatAnswerConnectionTestRequestBody();
const validResponse = {
  id: "safe-fixture-id",
  object: "chat.completion",
  created: 1_789_000_000,
  model: "deepseek-v4-flash",
  system_fingerprint: "safe-fixture-fingerprint",
  choices: [
    {
      index: 0,
      finish_reason: "stop",
      message: {
        role: "assistant",
        content: '{"status":"answered","answer":"ok"}',
        reasoning_content: "hidden fixture reasoning",
      },
      logprobs: null,
    },
  ],
  usage: {
    prompt_tokens: 12,
    completion_tokens: 7,
    total_tokens: 19,
  },
};
const incompleteResponse = {
  choices: [
    {
      index: 0,
      finish_reason: "length",
      message: {
        role: "assistant",
        content: "",
        reasoning_content: "hidden fixture reasoning",
      },
    },
  ],
};

const result = {
  requestNoThinking: request.thinking?.type === "disabled",
  requestStreamFalse: request.stream === false,
  requestNoTools:
    !Object.prototype.hasOwnProperty.call(request, "tools") &&
    !Object.prototype.hasOwnProperty.call(request, "tool_choice"),
  requestTokenLimitBounded: request.max_tokens >= 128 && request.max_tokens <= 256,
  validResponse: classifyDeepSeekChatAnswerConnectionTestResponse(validResponse),
  incompleteResponse:
    classifyDeepSeekChatAnswerConnectionTestResponse(incompleteResponse),
  serializedDoesNotExposeReasoning: !JSON.stringify({
    validResponse: classifyDeepSeekChatAnswerConnectionTestResponse(validResponse),
    incompleteResponse:
      classifyDeepSeekChatAnswerConnectionTestResponse(incompleteResponse),
  }).includes("hidden fixture reasoning"),
  realNetworkRequestSent: false,
};

if (
  !result.requestNoThinking ||
  !result.requestStreamFalse ||
  !result.requestNoTools ||
  !result.requestTokenLimitBounded ||
  result.validResponse !== "success" ||
  result.incompleteResponse !== "incomplete_response" ||
  !result.serializedDoesNotExposeReasoning
) {
  throw new Error(
    `DeepSeek connection-test compatibility smoke failed: ${JSON.stringify(
      result,
    )}`,
  );
}

console.log(JSON.stringify({ status: "PASS", ...result }));
