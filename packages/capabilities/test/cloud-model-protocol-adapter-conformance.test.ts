import { describe, expect, it } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  type CloudProviderEndpointProfile,
  type CloudReasoningModelCapabilityProfile,
  type CloudReasoningTimeoutPolicy,
  type CloudReasoningTransportRequest,
} from "@jarvis-k/contracts";
import {
  CloudReasoningRuntime,
  JarvisBoundedCloudModelProtocolAdapter,
  type CloudModelProtocolCredentialBroker,
  type CloudModelProtocolAdapterProtocolResult,
  type CloudReasoningFetch,
  type CloudReasoningFetchHeaders,
  type CloudReasoningFetchInit,
  type CloudReasoningFetchResponse,
  type CloudReasoningRuntimeRequest,
} from "../src";

const CREDENTIAL = "credential-placeholder-value";
const NOW = "2026-08-28T00:00:00.000Z";
const DEFAULT_POLICY = timeoutPolicy();

describe("CloudModelProtocolAdapter isolated shadow conformance", () => {
  const cases = [
    {
      name: "json success",
      stream: false,
      response: () => responseJson(chatJson({ content: "json ok" })),
      expected: {
        statusClass: "success",
        reasonCode: "completed",
        category: "completed",
      },
    },
    {
      name: "sse success",
      stream: true,
      response: () =>
        responseText(
          [sseData({ choices: [{ delta: { content: "sse ok" } }] }), "data: [DONE]\n\n"].join(""),
          200,
          { "content-type": "text/event-stream" },
        ),
      expected: {
        statusClass: "success",
        reasonCode: "completed",
        category: "completed",
      },
    },
    {
      name: "split json",
      stream: false,
      response: () =>
        responseBody(chunkedBody(['{"choices":[{"message":{"content":"split"}', ',"finish_reason":"stop"}]}'])),
      expected: {
        statusClass: "success",
        reasonCode: "completed",
        category: "completed",
      },
    },
    {
      name: "split utf8",
      stream: false,
      response: () => responseBody(splitUtf8Body(JSON.stringify(chatJson({ content: "你好" })))),
      expected: {
        statusClass: "success",
        reasonCode: "completed",
        category: "completed",
      },
    },
    {
      name: "usage final chunk",
      stream: true,
      response: () =>
        responseText(
          [
            sseData({ choices: [{ delta: { content: "usage" } }] }),
            sseData({ choices: [], usage: usageJson() }),
            "data: [DONE]\n\n",
          ].join(""),
          200,
          { "content-type": "text/event-stream" },
        ),
      expected: {
        statusClass: "success",
        reasonCode: "completed",
        category: "completed",
        totalTokens: 3,
      },
    },
    {
      name: "done only",
      stream: true,
      response: () =>
        responseText("data: [DONE]\n\n", 200, {
          "content-type": "text/event-stream",
        }),
      expected: {
        statusClass: "success",
        reasonCode: "no_final_answer",
        category: "no_final_answer",
      },
    },
    {
      name: "reasoning plus final",
      stream: false,
      response: () =>
        responseJson(
          chatJson({
            content: "final",
            reasoningContent: "private synthetic reasoning",
          }),
        ),
      expected: {
        statusClass: "success",
        reasonCode: "completed",
        category: "completed",
        reasoningObserved: true,
      },
    },
    {
      name: "tool calls",
      stream: false,
      response: () =>
        responseJson(
          chatJson({
            content: "tool",
            messageExtra: { tool_calls: [{ id: "call-1" }] },
          }),
        ),
      expected: {
        statusClass: "success",
        reasonCode: "untrusted_tool_proposal_blocked",
        category: "untrusted_tool_proposal_blocked",
        toolProposalObserved: true,
      },
    },
    {
      name: "function call",
      stream: false,
      response: () =>
        responseJson(
          chatJson({
            content: "function",
            messageExtra: { function_call: { name: "run" } },
          }),
        ),
      expected: {
        statusClass: "success",
        reasonCode: "untrusted_tool_proposal_blocked",
        category: "untrusted_tool_proposal_blocked",
        toolProposalObserved: true,
      },
    },
    {
      name: "malformed sse",
      stream: true,
      response: () => responseText("data: {bad-json\n\n", 200, { "content-type": "text/event-stream" }),
      expected: {
        statusClass: "success",
        reasonCode: "malformed_stream",
        category: "malformed_stream",
      },
    },
    {
      name: "invalid json",
      stream: false,
      response: () => responseText("{bad-json", 200, { "content-type": "application/json" }),
      expected: {
        statusClass: "invalid_response",
        reasonCode: "invalid_response",
        category: "invalid_provider_output",
      },
    },
    {
      name: "invalid content type",
      stream: false,
      response: () => responseText("<html></html>", 200, { "content-type": "text/html" }),
      expected: {
        statusClass: "failed",
        reasonCode: "unsupported_content_type",
        category: "invalid_provider_output",
      },
    },
    {
      name: "oversized response",
      stream: false,
      response: () =>
        responseJson(chatJson({ content: "large" }), 200, {
          "content-length": "200001",
        }),
      expected: {
        statusClass: "failed",
        reasonCode: "response_too_large",
        category: "response_too_large",
      },
    },
    {
      name: "close without done",
      stream: true,
      response: () =>
        responseText(sseData({ choices: [] }), 200, {
          "content-type": "text/event-stream",
        }),
      expected: {
        statusClass: "success",
        reasonCode: "no_final_answer",
        category: "no_final_answer",
      },
    },
    {
      name: "401",
      stream: false,
      response: () => responseJson({ error: "credential-placeholder-value" }, 401),
      expected: {
        statusClass: "auth_failure",
        reasonCode: "authentication_transport_failure",
        category: "invalid_provider_output",
      },
    },
    {
      name: "403",
      stream: false,
      response: () => responseJson({ error: "forbidden" }, 403),
      expected: {
        statusClass: "auth_failure",
        reasonCode: "authentication_transport_failure",
        category: "invalid_provider_output",
      },
    },
    {
      name: "429",
      stream: false,
      response: () => responseJson({ error: "rate" }, 429),
      expected: {
        statusClass: "rate_limited",
        reasonCode: "rate_limited",
        category: "invalid_provider_output",
      },
    },
    {
      name: "5xx",
      stream: false,
      response: () => responseJson({ error: "server" }, 503),
      expected: {
        statusClass: "server_error",
        reasonCode: "provider_server_error",
        category: "invalid_provider_output",
      },
    },
    {
      name: "redirect",
      stream: false,
      response: () => responseText("", 302, { location: "https://other.example" }),
      expected: {
        statusClass: "blocked",
        reasonCode: "redirect_blocked",
        category: "invalid_provider_output",
      },
    },
  ] as const;

  for (const item of cases) {
    it(`matches the current runtime for ${item.name}`, async () => {
      const current = await runCurrentRuntimeFixture(item);
      const spike = await runAdapterFixture(item);

      expect(spike.projection).toEqual(current.projection);
      expect(spike.invocationCount).toBe(1);
      expect(current.invocationCount).toBe(1);
      expect(spike.realNetworkRequestSent).toBe(false);
      expect(current.realNetworkRequestSent).toBe(false);
      expect(JSON.stringify(spike.result)).not.toContain(CREDENTIAL);
      expect(JSON.stringify(spike.result)).not.toContain("private synthetic reasoning");
      expect(spike.events).toHaveLength(1);
      expect(spike.events[0]).toMatchObject({
        credentialExposed: false,
        promptExposed: false,
        responseBodyLogged: false,
        directActionAttempted: false,
      });
    });
  }

  it("preserves the four-layer timeout and cancel semantics", async () => {
    const timeoutCases = [
      {
        name: "headers timeout",
        stream: false,
        response: (init: CloudReasoningFetchInit) => waitUntilAborted(init.signal),
        policy: timeoutPolicy({ connectOrHeadersTimeoutMs: 100, overallTimeoutMs: 150 }),
        expectedReason: "headers_timeout",
      },
      {
        name: "first event timeout",
        stream: false,
        response: (init: CloudReasoningFetchInit) => ({
          status: 200,
          headers: headers({ "content-type": "application/json" }),
          text: () => waitForAbort(init.signal),
        }),
        policy: timeoutPolicy({ firstEventTimeoutMs: 100, overallTimeoutMs: 150 }),
        expectedReason: "first_event_timeout",
      },
      {
        name: "idle timeout",
        stream: true,
        response: (init: CloudReasoningFetchInit) => ({
          status: 200,
          headers: headers({ "content-type": "text/event-stream" }),
          body: idleAfterFirstChunkBody(init.signal),
        }),
        policy: timeoutPolicy({ streamIdleTimeoutMs: 100, overallTimeoutMs: 180 }),
        expectedReason: "stream_idle_timeout",
      },
      {
        name: "overall timeout",
        stream: true,
        response: (init: CloudReasoningFetchInit) => ({
          status: 200,
          headers: headers({ "content-type": "text/event-stream" }),
          body: continuousBody(init.signal),
        }),
        policy: timeoutPolicy({ overallTimeoutMs: 120 }),
        expectedReason: "overall_timeout",
      },
    ] as const;

    for (const item of timeoutCases) {
      const current = await runCurrentRuntimeFixture(item);
      const spike = await runAdapterFixture(item);

      expect(spike.projection).toEqual(current.projection);
      expect(spike.projection.reasonCode).toBe(item.expectedReason);
      expect(spike.projection.statusClass).toBe("timeout");
      expect(spike.invocationCount).toBe(1);
      expect(spike.projection.retryCount).toBe(0);
      expect(spike.projection.fallbackCount).toBe(0);
    }

    const currentCancel = await runCurrentRuntimeFixture({
      name: "user cancel",
      stream: false,
      response: (init: CloudReasoningFetchInit) => waitUntilAborted(init.signal),
      cancelImmediately: true,
    });
    const spikeCancel = await runAdapterFixture({
      name: "user cancel",
      stream: false,
      response: (init: CloudReasoningFetchInit) => waitUntilAborted(init.signal),
      cancelImmediately: true,
    });

    expect(spikeCancel.projection).toEqual(currentCancel.projection);
    expect(spikeCancel.projection.reasonCode).toBe("cancelled");
  });

  it("handles dispose and concurrent call/cancel without retry, fallback, or real fetch", async () => {
    const currentDispose = await runCurrentRuntimeFixture({
      name: "dispose",
      stream: false,
      response: (init: CloudReasoningFetchInit) => waitUntilAborted(init.signal),
      disposeImmediately: true,
    });
    const spikeDispose = await runAdapterFixture({
      name: "dispose",
      stream: false,
      response: (init: CloudReasoningFetchInit) => waitUntilAborted(init.signal),
      disposeImmediately: true,
    });
    expect(spikeDispose.projection).toEqual(currentDispose.projection);
    expect(spikeDispose.projection.reasonCode).toBe("cancelled");

    const fetch = new RecordingFetch((init) =>
      init.headers["X-Jarvis-K-Request-Id"].endsWith("-a")
        ? waitUntilAborted(init.signal)
        : responseJson(chatJson({ content: "second" })),
    );
    const runtime = createRuntime(fetch.fn);
    const broker = brokerFixture();
    const adapter = new JarvisBoundedCloudModelProtocolAdapter(runtime, broker);
    const cancellation = new AbortController();
    const first = adapter.call({
      runtimeRequest: runtimeRequestFixture({
        requestId: "cloud-request-a",
        stream: false,
      }),
      signal: cancellation.signal,
    });
    const second = adapter.call({
      runtimeRequest: runtimeRequestFixture({
        requestId: "cloud-request-b",
        stream: false,
      }),
    });
    cancellation.abort();
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult.protocolResult.transport.reasonCode).toBe("cancelled");
    expect(secondResult.protocolResult.output.finalContent).toBe("second");
    expect(fetch.calls).toHaveLength(2);
    expect(broker.callCount).toBe(2);
    expect(firstResult.protocolResult.diagnostics.retryCount).toBe(0);
    expect(secondResult.protocolResult.diagnostics.retryCount).toBe(0);
    expect(firstResult.protocolResult.diagnostics.fallbackCount).toBe(0);
    expect(secondResult.protocolResult.diagnostics.fallbackCount).toBe(0);
    expect(fetch.realNetworkRequestSent).toBe(false);
  });

  it("does not request credentials after dispose", async () => {
    const fetch = new RecordingFetch(responseJson(chatJson({ content: "unused" })));
    const runtime = createRuntime(fetch.fn);
    const broker = brokerFixture();
    const adapter = new JarvisBoundedCloudModelProtocolAdapter(runtime, broker);

    adapter.dispose();
    const result = await adapter.call({
      runtimeRequest: runtimeRequestFixture({ stream: false }),
    });

    expect(fetch.calls).toHaveLength(0);
    expect(broker.callCount).toBe(0);
    expect(result.protocolResult.transport).toMatchObject({
      statusClass: "cancelled",
      reasonCode: "cancelled",
      requestSent: false,
      responseStarted: false,
      responseCompleted: false,
    });
  });
});

async function runCurrentRuntimeFixture(fixture: RuntimeFixture) {
  const fetch = new RecordingFetch(fixture.response);
  const runtime = createRuntime(fetch.fn, fixture.policy);
  const cancellation = new AbortController();
  const pending = runtime.runOpenAiChatCompletions(
    runtimeRequestFixture({
      stream: fixture.stream,
      timeoutPolicy: fixture.policy,
    }),
    {
      credential: { scheme: "bearer", value: CREDENTIAL },
      signal: cancellation.signal,
    },
  );
  if (fixture.cancelImmediately) {
    cancellation.abort();
  }
  if (fixture.disposeImmediately) {
    runtime.dispose();
  }
  const result = await pending;
  return {
    result,
    projection: projection(result),
    invocationCount: fetch.calls.length,
    realNetworkRequestSent: fetch.realNetworkRequestSent,
  };
}

async function runAdapterFixture(fixture: RuntimeFixture) {
  const fetch = new RecordingFetch(fixture.response);
  const runtime = createRuntime(fetch.fn, fixture.policy);
  const broker = brokerFixture();
  const adapter = new JarvisBoundedCloudModelProtocolAdapter(runtime, broker);
  const cancellation = new AbortController();
  const pending = adapter.call({
    runtimeRequest: runtimeRequestFixture({
      stream: fixture.stream,
      timeoutPolicy: fixture.policy,
    }),
    signal: cancellation.signal,
  });
  if (fixture.cancelImmediately) {
    cancellation.abort();
  }
  if (fixture.disposeImmediately) {
    adapter.dispose();
  }
  const result = await pending;
  return {
    result,
    events: result.events,
    projection: projection(result.protocolResult),
    invocationCount: fetch.calls.length,
    realNetworkRequestSent: fetch.realNetworkRequestSent,
  };
}

type RuntimeFixture = {
  readonly name: string;
  readonly stream: boolean;
  readonly response:
    | CloudReasoningFetchResponse
    | ((init: CloudReasoningFetchInit) => Promise<CloudReasoningFetchResponse> | CloudReasoningFetchResponse);
  readonly policy?: CloudReasoningTimeoutPolicy;
  readonly cancelImmediately?: boolean;
  readonly disposeImmediately?: boolean;
};

function projection(
  result:
    | Awaited<ReturnType<CloudReasoningRuntime["runOpenAiChatCompletions"]>>
    | CloudModelProtocolAdapterProtocolResult,
) {
  return {
    statusClass: result.transport.statusClass,
    reasonCode: result.diagnostics.reasonCode,
    outputCategory: result.output.category,
    requestSent: result.transport.requestSent,
    responseStarted: result.transport.responseStarted,
    responseCompleted: result.transport.responseCompleted,
    reasoningObserved: result.output.reasoningObserved,
    toolProposalObserved: result.output.toolProposalObserved,
    totalTokens: result.output.usage?.totalTokens ?? 0,
    retryCount: result.diagnostics.retryCount,
    fallbackCount: result.diagnostics.fallbackCount,
    directActionAttempted: result.diagnostics.directActionAttempted,
    credentialExposed: result.diagnostics.credentialExposed,
    promptExposed: result.diagnostics.promptExposed,
    responseBodyLogged: result.diagnostics.responseBodyLogged,
  };
}

function createRuntime(
  fetch: CloudReasoningFetch,
  timeoutPolicyInput: CloudReasoningTimeoutPolicy = DEFAULT_POLICY,
) {
  const modelProfile = modelProfileFixture({
    requestTimeoutPolicyId: timeoutPolicyInput.policyId,
  });
  return new CloudReasoningRuntime({
    endpointProfiles: [endpointProfileFixture()],
    modelProfiles: [modelProfile],
    timeoutPolicies: [timeoutPolicyInput],
    fetch,
    now: () => new Date(NOW),
  });
}

function brokerFixture(): CloudModelProtocolCredentialBroker & { callCount: number } {
  return {
    callCount: 0,
    async withCredential(_bindingId, useCredential) {
      this.callCount += 1;
      return useCredential({ scheme: "bearer", value: CREDENTIAL });
    },
  };
}

function endpointProfileFixture(): CloudProviderEndpointProfile {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: "advanced-brain.fixture",
    deploymentId: "fixture-openai-compatible",
    trustClass: "jarvis_test",
    allowedOrigins: ["https://reasoning.example"],
    allowedOperationPaths: [
      { operation: "chat.completions", path: "/v1/chat/completions" },
    ],
    region: "unknown",
    requiresHttps: true,
    redirectPolicy: "none",
    maxRequestBytes: 64_000,
    maxResponseBytes: 128_000,
    timeoutBounds: {
      minTimeoutMs: 100,
      defaultTimeoutMs: 30_000,
      maxTimeoutMs: 180_000,
    },
    credentialBindingId: "fixture.credential",
  };
}

function modelProfileFixture(
  overrides: Partial<CloudReasoningModelCapabilityProfile> = {},
): CloudReasoningModelCapabilityProfile {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: "advanced-brain.fixture",
    modelId: "fixture-openai-compatible-model",
    protocolFamily: "openai_chat_completions",
    deploymentId: "fixture-openai-compatible",
    trustClass: "jarvis_test",
    region: "unknown",
    supportsStreaming: true,
    supportsNonStreaming: true,
    supportsThinking: true,
    thinkingPolicy: "optional",
    supportsReasoningEffort: false,
    supportsTools: false,
    supportsStructuredOutput: true,
    supportsVision: false,
    supportsImages: false,
    contextWindow: 8192,
    maxOutputTokens: 1024,
    recommendedOutputTokens: 256,
    requestTimeoutPolicyId: "oss-shadow-timeout",
    credentialBindingId: "fixture.credential",
    endpointProfileId: "fixture-openai-compatible",
    executionSemantics: "fixture",
    dataEgressClass: "none",
    pricingTier: "free",
    enabled: true,
    ...overrides,
  };
}

function runtimeRequestFixture(input: {
  readonly stream: boolean;
  readonly requestId?: string;
  readonly timeoutPolicy?: CloudReasoningTimeoutPolicy;
}): CloudReasoningRuntimeRequest {
  const modelProfile = modelProfileFixture({
    requestTimeoutPolicyId: input.timeoutPolicy?.policyId ?? DEFAULT_POLICY.policyId,
  });
  return {
    transportRequest: transportRequestFixture({
      stream: input.stream,
      requestId: input.requestId,
      timeoutMs: input.timeoutPolicy?.overallTimeoutMs ?? 30_000,
    }),
    modelProfile,
    timeoutPolicyId: modelProfile.requestTimeoutPolicyId,
    stream: input.stream,
    maxFinalContentChars: 20_000,
  };
}

function transportRequestFixture(input: {
  readonly stream: boolean;
  readonly requestId?: string;
  readonly timeoutMs?: number;
}): CloudReasoningTransportRequest {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: input.requestId ?? "cloud-request-oss-shadow",
    providerId: "advanced-brain.fixture",
    deploymentId: "fixture-openai-compatible",
    operation: "chat.completions",
    method: "POST",
    contentType: "application/json",
    bodyJson: {
      model: "fixture-openai-compatible-model",
      messages: [{ role: "user", content: "fixed diagnostic" }],
      stream: input.stream,
      max_tokens: 256,
    },
    credentialBindingId: "fixture.credential",
    timeoutMs: input.timeoutMs ?? 30_000,
    maxResponseBytes: 128_000,
  };
}

function timeoutPolicy(
  overrides: Partial<Omit<CloudReasoningTimeoutPolicy, "policyId">> = {},
): CloudReasoningTimeoutPolicy {
  return {
    policyId: "oss-shadow-timeout",
    connectOrHeadersTimeoutMs: 100,
    firstEventTimeoutMs: 100,
    streamIdleTimeoutMs: 100,
    overallTimeoutMs: 150,
    ...overrides,
  };
}

class RecordingFetch {
  public readonly calls: Array<{ url: string; init: CloudReasoningFetchInit }> = [];
  public readonly realNetworkRequestSent = false;

  public constructor(
    private readonly response:
      | CloudReasoningFetchResponse
      | ((init: CloudReasoningFetchInit) => Promise<CloudReasoningFetchResponse> | CloudReasoningFetchResponse),
  ) {}

  public readonly fn: CloudReasoningFetch = async (url, init) => {
    this.calls.push({ url, init });
    return typeof this.response === "function"
      ? this.response(init)
      : this.response;
  };
}

function chatJson(input: {
  readonly content: string;
  readonly reasoningContent?: string;
  readonly messageExtra?: Record<string, unknown>;
}) {
  return {
    choices: [
      {
        message: {
          content: input.content,
          ...(input.reasoningContent
            ? { reasoning_content: input.reasoningContent }
            : {}),
          ...(input.messageExtra ?? {}),
        },
        finish_reason: "stop",
      },
    ],
    usage: usageJson(),
  };
}

function usageJson() {
  return { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 };
}

function responseJson(
  body: unknown,
  status = 200,
  headerValues: Record<string, string> = {},
): CloudReasoningFetchResponse {
  return responseText(JSON.stringify(body), status, {
    "content-type": "application/json",
    ...headerValues,
  });
}

function responseText(
  text: string,
  status = 200,
  headerValues: Record<string, string> = { "content-type": "application/json" },
): CloudReasoningFetchResponse {
  return {
    status,
    headers: headers(headerValues),
    text: async () => text,
  };
}

function responseBody(body: AsyncIterable<Uint8Array>): CloudReasoningFetchResponse {
  return {
    status: 200,
    headers: headers({ "content-type": "application/json" }),
    body,
  };
}

function headers(values: Record<string, string>): CloudReasoningFetchHeaders {
  const normalized = new Map(
    Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    get(name: string) {
      return normalized.get(name.toLowerCase()) ?? null;
    },
  };
}

function sseData(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

async function* chunkedBody(chunks: readonly string[]): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder();
  for (const chunk of chunks) {
    yield encoder.encode(chunk);
  }
}

async function* splitUtf8Body(value: string): AsyncIterable<Uint8Array> {
  const encoded = new TextEncoder().encode(value);
  yield encoded.slice(0, 17);
  yield encoded.slice(17);
}

function waitUntilAborted(signal: AbortSignal): Promise<CloudReasoningFetchResponse> {
  return new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")), {
      once: true,
    });
  });
}

function waitForAbort(signal: AbortSignal): Promise<string> {
  return new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")), {
      once: true,
    });
  });
}

async function* idleAfterFirstChunkBody(signal: AbortSignal): AsyncIterable<Uint8Array> {
  yield new TextEncoder().encode(sseData({ choices: [{ delta: { content: "partial" } }] }));
  await new Promise<void>((_, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")), {
      once: true,
    });
  });
}

async function* continuousBody(signal: AbortSignal): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder();
  while (!signal.aborted) {
    yield encoder.encode(
      sseData({ choices: [{ delta: { reasoning_content: "hidden" } }] }),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("aborted");
}
