import { describe, expect, it } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CloudReasoningTransportResultSchema,
  type AdvancedBrainRequest,
  type CloudReasoningTransportRequest,
  type CloudReasoningTransportResult,
} from "@jarvis-k/contracts";
import {
  CloudReasoningRuntime,
  DEFAULT_CLOUD_REASONING_TIMEOUT_POLICY,
  type CloudReasoningTransportSendOptions,
} from "@jarvis-k/capabilities";
import {
  GLM_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
  GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
  GLM_ADVANCED_BRAIN_OPERATION,
  GLM_ADVANCED_BRAIN_PROVIDER_ID,
  GlmAdvancedReasoningProvider,
  createGlmAdvancedReasoningEndpointProfile,
  createGlmAdvancedReasoningRuntimeRequest,
  createGlmCloudReasoningModelCapabilityProfile,
  type GlmAdvancedReasoningCredentialProvider,
  type GlmAdvancedReasoningTransport,
} from "../src";

const NOW = "2026-08-26T00:00:00.000Z";

describe("GLM shared runtime offline conformance", () => {
  it("runs glm-5.2 non-stream no-thinking through CloudReasoningRuntime", async () => {
    const transport = new RecordingTransport(
      completionResponse({
        modelId: "glm-5.2",
        content: diagnosticAnswer("glm52 ok"),
      }),
    );
    const provider = providerFixture({ modelId: "glm-5.2", transport });

    const result = await provider.execute(
      await provider.prepare(requestFixture("glm52-non-stream")),
    );

    expect(result).toMatchObject({
      resultClass: "answer",
      answer: "glm52 ok",
      modelId: "glm-5.2",
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      networkRequestIssued: true,
    });
    expect(transport.calls).toHaveLength(1);
    expect(transport.calls[0]?.request.bodyJson).toMatchObject({
      model: "glm-5.2",
      stream: false,
      max_tokens: 256,
      thinking: { type: "disabled" },
      do_sample: false,
    });
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty(
      "response_format",
    );
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty("tools");
    expect(transport.realNetworkRequestSent).toBe(false);
  });

  it("runs glm-5.2 stream no-thinking and parses usage-only SSE chunks", async () => {
    const transport = new RecordingTransport(
      completionStreamResponse({
        modelId: "glm-5.2",
        chunks: [
          sseData({ choices: [] }),
          sseData({
            choices: [
              { delta: { content: diagnosticAnswer("glm52 stream") } },
            ],
          }),
          sseData({
            choices: [],
            usage: { prompt_tokens: 4, completion_tokens: 5, total_tokens: 9 },
          }),
          "data: [DONE]\n\n",
        ],
      }),
    );
    const provider = providerFixture({
      modelId: "glm-5.2",
      stream: true,
      transport,
    });

    const result = await provider.execute(
      await provider.prepare(requestFixture("glm52-stream")),
    );

    expect(result.resultClass).toBe("answer");
    expect(result.answer).toBe("glm52 stream");
    expect(transport.calls[0]?.request.bodyJson).toMatchObject({
      model: "glm-5.2",
      stream: true,
      max_tokens: 256,
      thinking: { type: "disabled" },
    });
    expect(transport.realNetworkRequestSent).toBe(false);
  });

  it("runs glm-5.3 non-stream mandatory-thinking through CloudReasoningRuntime", async () => {
    const transport = new RecordingTransport(
      completionResponse({
        modelId: "glm-5.3",
        content: fencedJson(diagnosticAnswer("glm53 ok")),
        reasoningContent: "private synthetic reasoning",
        usage: {
          prompt_tokens: 6,
          completion_tokens: 30,
          total_tokens: 36,
          completion_tokens_details: { reasoning_tokens: 18 },
        },
      }),
    );
    const provider = providerFixture({ modelId: "glm-5.3", transport });

    const result = await provider.execute(
      await provider.prepare(requestFixture("glm53-non-stream")),
    );

    expect(result.resultClass).toBe("answer");
    expect(result.answer).toBe("glm53 ok");
    expect(transport.calls[0]?.request.bodyJson).toMatchObject({
      model: "glm-5.3",
      stream: false,
      max_tokens: 1024,
      thinking: { type: "enabled" },
      do_sample: false,
    });
    expect(JSON.stringify(result)).not.toContain("private synthetic reasoning");
    expect(transport.realNetworkRequestSent).toBe(false);
  });

  it("runs glm-5.3 stream mandatory-thinking and keeps reasoning out of results", async () => {
    const transport = new RecordingTransport(
      completionStreamResponse({
        modelId: "glm-5.3",
        chunks: [
          sseData({
            choices: [{ delta: { reasoning_content: "synthetic chain" } }],
          }),
          sseData({
            choices: [
              { delta: { content: diagnosticAnswer("glm53 stream") } },
            ],
          }),
          "data: [DONE]\n\n",
        ],
      }),
    );
    const provider = providerFixture({
      modelId: "glm-5.3",
      stream: true,
      transport,
    });

    const result = await provider.execute(
      await provider.prepare(requestFixture("glm53-stream")),
    );

    expect(result.resultClass).toBe("answer");
    expect(result.answer).toBe("glm53 stream");
    expect(transport.calls[0]?.request.bodyJson).toMatchObject({
      model: "glm-5.3",
      stream: true,
      max_tokens: 1024,
      thinking: { type: "enabled" },
    });
    expect(JSON.stringify(result)).not.toContain("synthetic chain");
    expect(transport.realNetworkRequestSent).toBe(false);
  });

  it("fail-closes glm-5.3 when mandatory thinking is disabled before transport", async () => {
    const modelProfile = createGlmCloudReasoningModelCapabilityProfile({
      enabled: true,
      modelId: "glm-5.3",
    });
    const transport = new RecordingTransport(
      completionResponse({
        modelId: "glm-5.3",
        content: diagnosticAnswer("should not run"),
      }),
    );
    const provider = providerFixture({ modelId: "glm-5.3", transport });
    const prepared = await provider.prepare(requestFixture("glm53-disabled"));
    const runtime = new CloudReasoningRuntime({
      endpointProfiles: [createGlmAdvancedReasoningEndpointProfile()],
      modelProfiles: [modelProfile],
      timeoutPolicies: [DEFAULT_CLOUD_REASONING_TIMEOUT_POLICY],
      transport,
      now: () => new Date(NOW),
    });

    const result = await runtime.runOpenAiChatCompletions(
      createGlmAdvancedReasoningRuntimeRequest(prepared, {
        modelProfile,
        stream: false,
        thinkingType: "disabled",
      }),
      credentialOptions(),
    );

    expect(result.transport.requestSent).toBe(false);
    expect(result.transport.reasonCode).toBe("invalid_request");
    expect(transport.calls).toHaveLength(0);
    expect(transport.realNetworkRequestSent).toBe(false);
  });

  it("separates parser failure, provider errors, and tool proposals without retry or fallback", async () => {
    const cases = [
      {
        name: "budget exhaustion",
        response: completionResponse({
          modelId: "glm-5.2",
          content: "",
          reasoningContent: "hidden",
          finishReason: "length",
        }),
        expectedClass: "failed",
      },
      {
        name: "tool proposal",
        response: completionResponse({
          modelId: "glm-5.2",
          content: diagnosticAnswer("tool"),
          messageExtra: { tool_calls: [{ id: "call-1" }] },
        }),
        expectedClass: "failed",
      },
      {
        name: "http 401",
        response: transportFailure(401, "auth_failure", "authentication_transport_failure"),
        expectedClass: "unavailable",
      },
      {
        name: "http 429",
        response: transportFailure(429, "rate_limited", "rate_limited"),
        expectedClass: "unavailable",
      },
    ] as const;

    for (const item of cases) {
      const transport = new RecordingTransport(item.response);
      const provider = providerFixture({ modelId: "glm-5.2", transport });
      const result = await provider.execute(
        await provider.prepare(requestFixture(`case-${item.name.replace(/\s+/gu, "-")}`)),
      );

      expect(result.resultClass).toBe(item.expectedClass);
      expect(result.directActionAttempted).toBe(false);
      expect(result.rawProviderResponsePersisted).toBe(false);
      expect(transport.calls).toHaveLength(1);
      expect(item.response.automaticRetry).toBe(false);
      expect(item.response.automaticFallback).toBe(false);
      expect(transport.realNetworkRequestSent).toBe(false);
    }
  });

  it("does not route disabled GLM profiles into product runtime transport", async () => {
    const transport = new RecordingTransport(
      completionResponse({
        modelId: "glm-5.2",
        content: diagnosticAnswer("disabled"),
      }),
    );
    const provider = providerFixture({
      enabled: false,
      modelId: "glm-5.2",
      transport,
    });

    await expect(provider.prepare(requestFixture("disabled"))).rejects.toMatchObject({
      reasonCode: "provider_disabled",
    });
    expect(transport.calls).toHaveLength(0);
    expect(transport.realNetworkRequestSent).toBe(false);
  });
});

function providerFixture(input: {
  readonly enabled?: boolean;
  readonly modelId: "glm-5.2" | "glm-5.3";
  readonly stream?: boolean;
  readonly transport: RecordingTransport;
}): GlmAdvancedReasoningProvider {
  return new GlmAdvancedReasoningProvider({
    enabled: input.enabled ?? true,
    modelId: input.modelId,
    stream: input.stream === true,
    transport: input.transport,
    credentialProvider: credentialProviderFixture(),
    now: () => new Date(NOW),
  });
}

function requestFixture(requestId: string): AdvancedBrainRequest {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId,
    category: "advanced_chat",
    source: "test",
    userText: "fixed synthetic request",
    inputModalities: ["text"],
    requestedOutput: "answer",
    privacyRequirement: "cloud_requires_confirmation",
    cloudEgressPolicy: "allow_cloud",
    userConsentEvidence: {
      kind: "explicit_user_confirmation",
      confirmedAt: NOW,
      scope: "single_request",
    },
    timeoutMs: 30_000,
    tokenBudgetClass: "small",
    costBudgetClass: "medium",
    allowedCapabilities: ["text_reasoning"],
    safetyContext: {
      risk: "low",
      allowedToolIds: [],
      approvalRequired: false,
      directExecutionAllowed: false,
    },
  };
}

function credentialProviderFixture(): GlmAdvancedReasoningCredentialProvider {
  return {
    async getCredential() {
      return { apiKey: "not-a-real-key" };
    },
  };
}

function credentialOptions() {
  return {
    credential: {
      scheme: "bearer" as const,
      value: "not-a-real-key",
    },
  };
}

class RecordingTransport implements GlmAdvancedReasoningTransport {
  public readonly calls: {
    readonly request: CloudReasoningTransportRequest;
    readonly options: CloudReasoningTransportSendOptions;
  }[] = [];
  public readonly realNetworkRequestSent = false;

  public constructor(private readonly result: CloudReasoningTransportResult) {}

  public async send(
    request: CloudReasoningTransportRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult> {
    this.calls.push({ request, options });
    return {
      ...this.result,
      requestId: request.requestId,
      providerId: request.providerId,
      deploymentId: request.deploymentId,
      operation: request.operation,
    };
  }
}

function diagnosticAnswer(answer: string): string {
  return JSON.stringify({
    resultClass: "answer",
    answer,
    directActionAttempted: false,
  });
}

function fencedJson(json: string): string {
  return `\`\`\`json\n${json}\n\`\`\``;
}

function completionResponse(input: {
  readonly modelId: "glm-5.2" | "glm-5.3";
  readonly content: string;
  readonly reasoningContent?: string;
  readonly finishReason?: string;
  readonly messageExtra?: Record<string, unknown>;
  readonly usage?: Record<string, unknown>;
}): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: "placeholder-request",
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_OPERATION,
    statusClass: "success",
    reasonCode: "completed",
    httpStatus: 200,
    responseJson: {
      model: input.modelId,
      choices: [
        {
          message: {
            role: "assistant",
            content: input.content,
            ...(input.reasoningContent
              ? { reasoning_content: input.reasoningContent }
              : {}),
            ...(input.messageExtra ?? {}),
          },
          finish_reason: input.finishReason ?? "stop",
        },
      ],
      usage: input.usage ?? {
        prompt_tokens: 10,
        completion_tokens: 4,
        total_tokens: 14,
      },
    },
    safeHeaders: { contentType: "application/json" },
    latencyMs: 12,
    requestSent: true,
    responseStarted: true,
    responseCompleted: true,
    cancelled: false,
    timeout: false,
    automaticRetry: false,
    automaticFallback: false,
    credentialExposed: false,
    requestBodyExposed: false,
    responseBodyLogged: false,
  });
}

function completionStreamResponse(input: {
  readonly modelId: "glm-5.2" | "glm-5.3";
  readonly chunks: readonly string[];
}): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: "placeholder-request",
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_OPERATION,
    statusClass: "success",
    reasonCode: "completed",
    httpStatus: 200,
    responseJson: {
      model: input.modelId,
      sseText: input.chunks.join(""),
    },
    safeHeaders: { contentType: "text/event-stream" },
    latencyMs: 18,
    requestSent: true,
    responseStarted: true,
    responseCompleted: true,
    cancelled: false,
    timeout: false,
    automaticRetry: false,
    automaticFallback: false,
    credentialExposed: false,
    requestBodyExposed: false,
    responseBodyLogged: false,
  });
}

function transportFailure(
  httpStatus: 401 | 429,
  statusClass: CloudReasoningTransportResult["statusClass"],
  reasonCode: CloudReasoningTransportResult["reasonCode"],
): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: "placeholder-request",
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_OPERATION,
    statusClass,
    reasonCode,
    httpStatus,
    safeHeaders: { contentType: "application/json" },
    latencyMs: 10,
    requestSent: true,
    responseStarted: true,
    responseCompleted: false,
    cancelled: false,
    timeout: false,
    automaticRetry: false,
    automaticFallback: false,
    credentialExposed: false,
    requestBodyExposed: false,
    responseBodyLogged: false,
  });
}

function sseData(value: unknown): string {
  return `data: ${JSON.stringify(value)}\n\n`;
}
