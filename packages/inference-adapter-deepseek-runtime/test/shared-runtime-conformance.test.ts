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
  DEEPSEEK_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
  DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
  DEEPSEEK_ADVANCED_BRAIN_OPERATION,
  DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
  DeepSeekAdvancedReasoningProvider,
  createDeepSeekAdvancedReasoningEndpointProfile,
  createDeepSeekAdvancedReasoningRuntimeRequest,
  createDeepSeekCloudReasoningModelCapabilityProfile,
  createDeepSeekOperationProfile,
  type DeepSeekAdvancedReasoningCredentialProvider,
  type DeepSeekAdvancedReasoningTransport,
  type DeepSeekOperationProfile,
} from "../src";

const NOW = "2026-08-26T00:00:00.000Z";

describe("DeepSeek shared runtime offline conformance", () => {
  it("runs flash non-stream no-thinking through CloudReasoningRuntime", async () => {
    const transport = new RecordingTransport(
      completionResponse({
        modelId: "deepseek-v4-flash",
        content: diagnosticAnswer("flash ok"),
      }),
    );
    const provider = providerFixture({
      modelId: "deepseek-v4-flash",
      transport,
    });

    const result = await provider.execute(
      await provider.prepare(requestFixture("deepseek-flash-non-stream")),
    );

    expect(result).toMatchObject({
      resultClass: "answer",
      answer: "flash ok",
      modelId: "deepseek-v4-flash",
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      networkRequestIssued: true,
    });
    expect(transport.calls).toHaveLength(1);
    expect(transport.calls[0]?.request.bodyJson).toMatchObject({
      model: "deepseek-v4-flash",
      stream: false,
      max_tokens: 512,
      thinking: { type: "disabled" },
    });
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty(
      "reasoning_effort",
    );
    expect(transport.realNetworkRequestSent).toBe(false);
  });

  it("runs flash stream no-thinking and parses usage carried by the last choice chunk", async () => {
    const operationProfile = {
      ...createDeepSeekOperationProfile("deepseek-v4-flash-no-thinking"),
      stream: true,
    };
    const transport = new RecordingTransport(
      completionStreamResponse({
        modelId: "deepseek-v4-flash",
        chunks: [
          sseData({ choices: [{ delta: { content: "{" } }] }),
          sseData({ choices: [{ delta: { content: "\"resultClass\":\"answer\"," } }] }),
          sseData({
            choices: [
              {
                delta: { content: "\"answer\":\"flash stream\"}" },
                finish_reason: "stop",
              },
            ],
            usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 },
          }),
          "data: [DONE]\n\n",
        ],
      }),
    );
    const provider = providerFixture({
      modelId: "deepseek-v4-flash",
      operationProfile,
      transport,
    });

    const result = await provider.execute(
      await provider.prepare(requestFixture("deepseek-flash-stream")),
    );

    expect(result.resultClass).toBe("answer");
    expect(result.answer).toBe("flash stream");
    expect(transport.calls[0]?.request.bodyJson).toMatchObject({
      model: "deepseek-v4-flash",
      stream: true,
      thinking: { type: "disabled" },
    });
    expect(transport.realNetworkRequestSent).toBe(false);
  });

  it("runs pro non-stream thinking with high reasoning_effort and no reasoning leakage", async () => {
    const transport = new RecordingTransport(
      completionResponse({
        modelId: "deepseek-v4-pro",
        content: fencedJson(diagnosticAnswer("pro ok")),
        reasoningContent: "private synthetic reasoning",
        usage: {
          prompt_tokens: 6,
          completion_tokens: 30,
          total_tokens: 36,
          completion_tokens_details: { reasoning_tokens: 18 },
        },
      }),
    );
    const provider = providerFixture({
      modelId: "deepseek-v4-pro",
      transport,
    });

    const result = await provider.execute(
      await provider.prepare(requestFixture("deepseek-pro-non-stream")),
    );

    expect(result.resultClass).toBe("answer");
    expect(result.answer).toBe("pro ok");
    expect(transport.calls[0]?.request.bodyJson).toMatchObject({
      model: "deepseek-v4-pro",
      stream: false,
      max_tokens: 1024,
      thinking: { type: "enabled" },
      reasoning_effort: "high",
    });
    expect(JSON.stringify(result)).not.toContain("private synthetic reasoning");
    expect(transport.realNetworkRequestSent).toBe(false);
  });

  it("runs pro stream thinking and keeps reasoning-only chunks out of result", async () => {
    const operationProfile = {
      ...createDeepSeekOperationProfile("deepseek-v4-pro-thinking"),
      stream: true,
    };
    const transport = new RecordingTransport(
      completionStreamResponse({
        modelId: "deepseek-v4-pro",
        chunks: [
          sseData({
            choices: [{ delta: { reasoning_content: "synthetic chain" } }],
          }),
          sseData({
            choices: [
              { delta: { content: diagnosticAnswer("pro stream") } },
            ],
          }),
          "data: [DONE]\n\n",
        ],
      }),
    );
    const provider = providerFixture({
      modelId: "deepseek-v4-pro",
      operationProfile,
      transport,
    });

    const result = await provider.execute(
      await provider.prepare(requestFixture("deepseek-pro-stream")),
    );

    expect(result.resultClass).toBe("answer");
    expect(result.answer).toBe("pro stream");
    expect(JSON.stringify(result)).not.toContain("synthetic chain");
    expect(transport.realNetworkRequestSent).toBe(false);
  });

  it("fail-closes invalid reasoning_effort, disabled effort, tool fields, and reasoning history before transport", async () => {
    const modelProfile = createDeepSeekCloudReasoningModelCapabilityProfile({
      enabled: true,
      modelId: "deepseek-v4-pro",
    });
    const transport = new RecordingTransport(
      completionResponse({
        modelId: "deepseek-v4-pro",
        content: diagnosticAnswer("should not run"),
      }),
    );
    const provider = providerFixture({ modelId: "deepseek-v4-pro", transport });
    const prepared = await provider.prepare(requestFixture("deepseek-invalid"));
    const runtime = new CloudReasoningRuntime({
      endpointProfiles: [createDeepSeekAdvancedReasoningEndpointProfile()],
      modelProfiles: [modelProfile],
      timeoutPolicies: [DEFAULT_CLOUD_REASONING_TIMEOUT_POLICY],
      transport,
      now: () => new Date(NOW),
    });
    const base = createDeepSeekAdvancedReasoningRuntimeRequest(prepared, {
      modelProfile,
      operationProfile: createDeepSeekOperationProfile(
        "deepseek-v4-pro-thinking",
      ),
    });

    for (const bodyJson of [
      { ...base.transportRequest.bodyJson, reasoning_effort: "medium" },
      {
        ...base.transportRequest.bodyJson,
        thinking: { type: "disabled" },
        reasoning_effort: "high",
      },
      { ...base.transportRequest.bodyJson, tools: [{ type: "function" }] },
      {
        ...base.transportRequest.bodyJson,
        messages: [{ role: "assistant", reasoning_content: "do not send" }],
      },
    ]) {
      const result = await runtime.runOpenAiChatCompletions(
        {
          ...base,
          transportRequest: {
            ...base.transportRequest,
            bodyJson,
          },
        },
        credentialOptions(),
      );

      expect(result.transport.requestSent).toBe(false);
      expect(result.transport.reasonCode).toBe("invalid_request");
    }
    expect(transport.calls).toHaveLength(0);
    expect(transport.realNetworkRequestSent).toBe(false);
  });

  it("classifies DeepSeek terminal finish reasons and malformed outputs without retry or fallback", async () => {
    const cases = [
      {
        name: "reasoning only",
        response: completionResponse({
          modelId: "deepseek-v4-pro",
          content: "",
          reasoningContent: "hidden",
        }),
        expectedClass: "failed",
      },
      {
        name: "length",
        response: completionResponse({
          modelId: "deepseek-v4-pro",
          content: "",
          reasoningContent: "hidden",
          finishReason: "length",
        }),
        expectedClass: "failed",
      },
      {
        name: "content filter",
        response: completionResponse({
          modelId: "deepseek-v4-pro",
          content: "",
          finishReason: "content_filter",
        }),
        expectedClass: "failed",
      },
      {
        name: "capacity",
        response: completionResponse({
          modelId: "deepseek-v4-pro",
          content: "",
          finishReason: "insufficient_system_resource",
        }),
        expectedClass: "unavailable",
      },
      {
        name: "tool calls",
        response: completionResponse({
          modelId: "deepseek-v4-pro",
          content: diagnosticAnswer("tool"),
          finishReason: "tool_calls",
        }),
        expectedClass: "failed",
      },
      {
        name: "malformed stream",
        response: completionStreamResponse({
          modelId: "deepseek-v4-pro",
          chunks: ["data: {bad-json\n\n"],
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
      const provider = providerFixture({
        modelId: "deepseek-v4-pro",
        transport,
      });
      const result = await provider.execute(
        await provider.prepare(
          requestFixture(`case-${item.name.replace(/\s+/gu, "-")}`),
        ),
      );

      expect(result.resultClass).toBe(item.expectedClass);
      expect(result.directActionAttempted).toBe(false);
      expect(result.rawProviderResponsePersisted).toBe(false);
      expect(item.response.automaticRetry).toBe(false);
      expect(item.response.automaticFallback).toBe(false);
      expect(transport.calls).toHaveLength(1);
      expect(transport.realNetworkRequestSent).toBe(false);
    }
  });
});

function providerFixture(input: {
  readonly enabled?: boolean;
  readonly modelId: "deepseek-v4-flash" | "deepseek-v4-pro";
  readonly operationProfile?: DeepSeekOperationProfile;
  readonly transport: RecordingTransport;
}): DeepSeekAdvancedReasoningProvider {
  return new DeepSeekAdvancedReasoningProvider({
    enabled: input.enabled ?? true,
    modelId: input.modelId,
    ...(input.operationProfile
      ? { operationProfile: input.operationProfile }
      : {}),
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

function credentialProviderFixture(): DeepSeekAdvancedReasoningCredentialProvider {
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

class RecordingTransport implements DeepSeekAdvancedReasoningTransport {
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
  readonly modelId: "deepseek-v4-flash" | "deepseek-v4-pro";
  readonly content: string;
  readonly reasoningContent?: string;
  readonly finishReason?: string;
  readonly usage?: Record<string, unknown>;
}): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: "placeholder-request",
    providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: DEEPSEEK_ADVANCED_BRAIN_OPERATION,
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
  readonly modelId: "deepseek-v4-flash" | "deepseek-v4-pro";
  readonly chunks: readonly string[];
}): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: "placeholder-request",
    providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: DEEPSEEK_ADVANCED_BRAIN_OPERATION,
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
    providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: DEEPSEEK_ADVANCED_BRAIN_OPERATION,
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
