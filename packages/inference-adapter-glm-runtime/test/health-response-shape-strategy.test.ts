import { describe, expect, it } from "vitest";
import {
  classifyGlmProviderHealthResponseShape,
  type GlmProviderHealthResponseShapeClassification
} from "../src";

describe("GLM health response-shape strategy", () => {
  it("classifies a standard healthy chat completion without raw content", () => {
    const result = classifyGlmProviderHealthResponseShape(
      chatResponse(JSON.stringify({ status: "ok" }), "stop")
    );

    expect(result).toMatchObject({
      status: "fixture_only",
      networkAccessed: false,
      credentialAccessed: false,
      realApiCalled: false,
      rawResponsePersisted: false,
      rawContentPersisted: false,
      topLevelShape: "object",
      choicesShape: "chat_completion_choices",
      choiceCountBucket: "one",
      messageShape: "assistant_message",
      finishReasonShape: "stop",
      contentShape: "json_string",
      jsonExtractionShape: "exact_json_object",
      healthSignalShape: "supported_status",
      unsafeSignalCounts: emptyUnsafeCounts()
    });
    expect(result.reasonCodes).toContain("GLM_HEALTH_SHAPE_SUPPORTED_STATUS");
    expectNoRawContent(result, ['{"status":"ok"}', "ok"]);
  });

  it("classifies object-valued nested boolean content", () => {
    const result = classifyGlmProviderHealthResponseShape(
      chatResponse({ output: { ready: true } })
    );

    expect(result).toMatchObject({
      contentShape: "object",
      jsonExtractionShape: "object_value",
      healthSignalShape: "supported_boolean"
    });
    expect(result.reasonCodes).toContain("GLM_HEALTH_SHAPE_SUPPORTED_BOOLEAN");
  });

  it("classifies prefixed JSON separately from plain strings", () => {
    const prefixed = classifyGlmProviderHealthResponseShape(
      chatResponse(`Result: ${JSON.stringify({ status: "available" })}`)
    );
    const plain = classifyGlmProviderHealthResponseShape(
      chatResponse("health check passed")
    );

    expect(prefixed).toMatchObject({
      contentShape: "prefixed_json_string",
      jsonExtractionShape: "prefixed_json_object",
      healthSignalShape: "supported_status"
    });
    expect(plain).toMatchObject({
      contentShape: "plain_string",
      jsonExtractionShape: "no_json_object",
      healthSignalShape: "missing_health_signal"
    });
    expect(plain.recommendations).toContain("fixture_add_plain_string_case");
  });

  it("classifies content arrays without parsing or persisting text blocks", () => {
    const result = classifyGlmProviderHealthResponseShape(
      chatResponse([
        {
          type: "text",
          text: JSON.stringify({ status: "ok" })
        }
      ])
    );

    expect(result).toMatchObject({
      contentShape: "array",
      jsonExtractionShape: "not_attempted",
      healthSignalShape: "missing_health_signal"
    });
    expect(result.reasonCodes).toContain("GLM_HEALTH_SHAPE_CONTENT_ARRAY");
    expect(result.recommendations).toContain(
      "consider_bounded_content_block_parser"
    );
    expectNoRawContent(result, ["text", "ok"]);
  });

  it("classifies delta-only provider shapes as fail-closed strategy input", () => {
    const result = classifyGlmProviderHealthResponseShape({
      choices: [
        {
          delta: {
            role: "assistant",
            content: JSON.stringify({ status: "ok" })
          },
          finish_reason: "stop"
        }
      ]
    });

    expect(result).toMatchObject({
      choicesShape: "chat_completion_choices",
      messageShape: "delta_only",
      contentShape: "missing",
      healthSignalShape: "not_inspected"
    });
    expect(result.reasonCodes).toContain("GLM_HEALTH_SHAPE_DELTA_ONLY");
    expect(result.recommendations).toContain("fixture_add_delta_only_case");
  });

  it("classifies unsupported planner-shaped status without accepting it", () => {
    const result = classifyGlmProviderHealthResponseShape(
      chatResponse(JSON.stringify({ status: "planned" }))
    );

    expect(result).toMatchObject({
      healthSignalShape: "unsupported_status"
    });
    expect(result.reasonCodes).toContain("GLM_HEALTH_SHAPE_UNSUPPORTED_STATUS");
    expect(result.recommendations).toContain(
      "fixture_add_unsupported_status_case"
    );
  });

  it("classifies malformed JSON and finish_reason length for payload strategy", () => {
    const result = classifyGlmProviderHealthResponseShape(
      chatResponse('{"status":"ok"', "length")
    );

    expect(result).toMatchObject({
      finishReasonShape: "length",
      contentShape: "plain_string",
      jsonExtractionShape: "no_json_object",
      healthSignalShape: "missing_health_signal"
    });
    expect(result.reasonCodes).toContain(
      "GLM_HEALTH_SHAPE_FINISH_REASON_LENGTH"
    );
    expect(result.recommendations).toContain(
      "consider_finish_reason_length_handling"
    );
  });

  it("keeps unsafe response shapes sanitized and fail-closed", () => {
    const result = classifyGlmProviderHealthResponseShape({
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify({
              status: "ok",
              action: "execute"
            }),
            tool_calls: []
          },
          finish_reason: "tool_calls"
        }
      ]
    });

    expect(result).toMatchObject({
      finishReasonShape: "tool_calls",
      healthSignalShape: "unsafe_output",
      unsafeSignalCounts: {
        toolCalls: 1,
        executionShapedOutput: 1
      }
    });
    expect(result.reasonCodes).toContain("GLM_HEALTH_SHAPE_UNSAFE_OUTPUT");
    expect(result.recommendations).toContain("fixture_add_unsafe_output_case");
  });

  it("counts secret-like and oversized content without retaining raw text", () => {
    const secretLike = classifyGlmProviderHealthResponseShape(
      chatResponse(JSON.stringify({ status: "ok", note: "api_key value" }))
    );
    const oversized = classifyGlmProviderHealthResponseShape(
      chatResponse("x".repeat(2_001))
    );

    expect(secretLike).toMatchObject({
      contentShape: "secret_like",
      healthSignalShape: "unsafe_output",
      unsafeSignalCounts: {
        secretLikeContent: 1
      }
    });
    expect(oversized).toMatchObject({
      contentShape: "oversized",
      contentLengthBucket: "over_2000",
      healthSignalShape: "unsafe_output",
      unsafeSignalCounts: {
        oversizedContent: 1
      }
    });
    expectNoRawContent(secretLike, ["api_key", "value"]);
  });
});

function chatResponse(
  content: unknown,
  finishReason: unknown = undefined
): Record<string, unknown> {
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content
        },
        finish_reason: finishReason
      }
    ]
  };
}

function emptyUnsafeCounts(): GlmProviderHealthResponseShapeClassification["unsafeSignalCounts"] {
  return {
    toolCalls: 0,
    functionCalls: 0,
    directAction: 0,
    executionShapedOutput: 0,
    secretLikeContent: 0,
    oversizedContent: 0
  };
}

function expectNoRawContent(
  result: GlmProviderHealthResponseShapeClassification,
  rawFragments: readonly string[]
): void {
  const serialized = JSON.stringify(result);
  for (const fragment of rawFragments) {
    expect(serialized).not.toContain(fragment);
  }
}
