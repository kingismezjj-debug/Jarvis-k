import { describe, expect, it } from "vitest";
import {
  CHAT_ANSWER_CONNECTION_TEST_MAX_TOKENS,
  classifyDeepSeekChatAnswerConnectionTestResponse,
  createDeepSeekChatAnswerConnectionTestRequestBody,
} from "../src/chat-answer-connection-test";

function officialResponse(input: {
  readonly content: unknown;
  readonly finishReason?: string | null;
  readonly reasoningContent?: unknown;
  readonly extraMessageFields?: Record<string, unknown>;
}) {
  return {
    id: "safe-fixture-id",
    object: "chat.completion",
    created: 1_789_000_000,
    model: "deepseek-v4-flash",
    system_fingerprint: "safe-fixture-fingerprint",
    choices: [
      {
        index: 0,
        finish_reason: input.finishReason ?? "stop",
        message: {
          role: "assistant",
          content: input.content,
          ...(input.reasoningContent !== undefined
            ? { reasoning_content: input.reasoningContent }
            : {}),
          ...(input.extraMessageFields ?? {}),
        },
        logprobs: null,
      },
    ],
    usage: {
      prompt_tokens: 12,
      completion_tokens: 7,
      total_tokens: 19,
      completion_tokens_details: {
        reasoning_tokens: input.reasoningContent === undefined ? 0 : 3,
      },
    },
  };
}

describe("DeepSeek Chat Answer connection test", () => {
  it("creates a fixed non-sensitive no-thinking JSON validation request", () => {
    const request = createDeepSeekChatAnswerConnectionTestRequestBody();

    expect(request).toMatchObject({
      model: "deepseek-v4-flash",
      response_format: { type: "json_object" },
      stream: false,
      temperature: 0,
      thinking: { type: "disabled" },
      max_tokens: CHAT_ANSWER_CONNECTION_TEST_MAX_TOKENS,
    });
    expect(request.max_tokens).toBeGreaterThanOrEqual(128);
    expect(request.max_tokens).toBeLessThanOrEqual(256);
    expect(request.messages).toHaveLength(2);
    expect(request.messages[0].content).toContain("Return JSON only");
    expect(request.messages[0].content).toContain("no Markdown code fence");
    expect(request.messages[0].content).toContain(
      '{"status":"answered","answer":"ok"}',
    );
    expect(request.messages[1].content).toContain(
      '{"status":"answered","answer":"ok"}',
    );
    expect(request).not.toHaveProperty("tools");
    expect(request).not.toHaveProperty("tool_choice");
    expect(request).not.toHaveProperty("max_completion_tokens");
    expect(JSON.stringify(request)).not.toMatch(
      /Bearer|Authorization|api[_-]?key|sk-/iu,
    );
  });

  it("accepts valid current DeepSeek envelopes and ignores official extra fields", () => {
    expect(
      classifyDeepSeekChatAnswerConnectionTestResponse(
        officialResponse({
          content: '{"status":"answered","answer":"ok"}',
        }),
      ),
    ).toBe("success");

    expect(
      classifyDeepSeekChatAnswerConnectionTestResponse(
        officialResponse({
          content: '{"status":"answered","answer":"ok"}',
          reasoningContent: "hidden fixture reasoning",
          extraMessageFields: { refusal: null },
        }),
      ),
    ).toBe("success");
  });

  it("classifies official truncated or reasoning-only 2xx responses as incomplete", () => {
    expect(
      classifyDeepSeekChatAnswerConnectionTestResponse(
        officialResponse({
          content: "",
          finishReason: "length",
          reasoningContent: "hidden fixture reasoning",
        }),
      ),
    ).toBe("incomplete_response");

    expect(
      classifyDeepSeekChatAnswerConnectionTestResponse(
        officialResponse({
          content: null,
          reasoningContent: "hidden fixture reasoning",
        }),
      ),
    ).toBe("incomplete_response");

    expect(
      classifyDeepSeekChatAnswerConnectionTestResponse(
        officialResponse({
          content: "",
          reasoningContent: [{ type: "text", text: "hidden fixture reasoning" }],
        }),
      ),
    ).toBe("incomplete_response");
  });

  it("keeps completed invalid JSON or wrong schemas malformed", () => {
    expect(
      classifyDeepSeekChatAnswerConnectionTestResponse(
        officialResponse({ content: "{not json}" }),
      ),
    ).toBe("malformed_response");
    expect(
      classifyDeepSeekChatAnswerConnectionTestResponse(
        officialResponse({
          content: '{"status":"answered","answer":"ok","extra":true}',
        }),
      ),
    ).toBe("malformed_response");
    expect(
      classifyDeepSeekChatAnswerConnectionTestResponse(
        officialResponse({ content: '{"status":"ok","answer":"ok"}' }),
      ),
    ).toBe("malformed_response");
    expect(
      classifyDeepSeekChatAnswerConnectionTestResponse({ choices: [] }),
    ).toBe("malformed_response");
    expect(
      classifyDeepSeekChatAnswerConnectionTestResponse(
        officialResponse({
          content: '{"status":"answered","answer":"ok"}',
          extraMessageFields: { tool_calls: [] },
        }),
      ),
    ).toBe("malformed_response");
  });
});
