import { describe, expect, it } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  type CloudProviderEndpointProfile,
  type CloudReasoningModelCapabilityProfile,
  type CloudReasoningTimeoutPolicy,
  type CloudReasoningTransportRequest,
} from "@jarvis-k/contracts";
import {
  BoundedCloudReasoningTransport,
  CloudReasoningRuntime,
  DEFAULT_CLOUD_REASONING_TIMEOUT_POLICY,
  parseOpenAiChatCompletionsSse,
  type CloudReasoningFetch,
  type CloudReasoningFetchHeaders,
  type CloudReasoningFetchInit,
  type CloudReasoningFetchResponse,
} from "../src";

describe("BoundedCloudReasoningTransport", () => {
  it("sends a valid allowlisted HTTPS JSON request with fixed headers", async () => {
    const fetch = new FakeFetch(responseJson({ answer: "ok" }));
    const transport = createTransport(fetch.fn);

    const result = await transport.send(requestFixture(), credentialOptions());

    expect(result.statusClass).toBe("success");
    expect(result.reasonCode).toBe("completed");
    expect(result.responseJson).toEqual({ answer: "ok" });
    expect(fetch.calls).toHaveLength(1);
    expect(fetch.calls[0]?.url).toBe("https://reasoning.example/v1/reason");
    expect(Object.keys(fetch.calls[0]?.init.headers ?? {}).sort()).toEqual([
      "Accept",
      "Authorization",
      "Content-Type",
      "X-Jarvis-K-Request-Id",
    ]);
    expect(fetch.calls[0]?.init.redirect).toBe("manual");
    expect(fetch.calls[0]?.init.headers.Authorization).toBe(
      "Bearer credential-placeholder-value",
    );
    expect(JSON.stringify(result)).not.toContain("credential-placeholder-value");
    expect(JSON.stringify(result)).not.toContain("minimized-input");
  });

  it("blocks invalid endpoint profiles and non-allowlisted operations before fetch", async () => {
    expect(
      () =>
        new BoundedCloudReasoningTransport({
          fetch: new FakeFetch(responseJson({})).fn,
          endpointProfiles: [
            { ...profileFixture(), allowedOrigins: ["https://127.0.0.1"] },
          ],
        }),
    ).toThrow();

    const fetch = new FakeFetch(responseJson({})).fn;
    const transport = createTransport(fetch);
    const result = await transport.send(
      { ...requestFixture(), operation: "reason.delete" },
      credentialOptions(),
    );

    expect(result.reasonCode).toBe("endpoint_not_allowed");
    expect(result.requestSent).toBe(false);
  });

  it("does not accept renderer-style arbitrary URL, headers, or content type", async () => {
    const transport = createTransport(new FakeFetch(responseJson({})).fn);
    const result = await transport.send(
      {
        ...requestFixture(),
        contentType: "text/plain",
        url: "https://other.example",
        headers: { Cookie: "session=value" },
      } as unknown as CloudReasoningTransportRequest,
      credentialOptions(),
    );

    expect(result.reasonCode).toBe("invalid_endpoint_profile");
    expect(result.requestSent).toBe(false);
  });

  it("enforces request and declared response size limits", async () => {
    const requestTooLarge = await createTransport(
      new FakeFetch(responseJson({})).fn,
      { maxRequestBytes: 12 },
    ).send(requestFixture(), credentialOptions());

    expect(requestTooLarge.reasonCode).toBe("request_too_large");
    expect(requestTooLarge.requestSent).toBe(false);

    const fetch = new FakeFetch(
      responseJson({ answer: "large" }, 200, { "content-length": "2001" }),
    );
    const responseTooLarge = await createTransport(fetch.fn).send(
      requestFixture(),
      credentialOptions(),
    );

    expect(responseTooLarge.reasonCode).toBe("response_too_large");
    expect(responseTooLarge.requestSent).toBe(true);
    expect(responseTooLarge.responseStarted).toBe(true);
    expect(responseTooLarge.responseCompleted).toBe(false);
  });

  it("aborts chunked response reads once the actual body exceeds the limit", async () => {
    const body = chunkedBody(["{\"answer\":\"", "x".repeat(2100), "\"}"]);
    const result = await createTransport(
      new FakeFetch({
        status: 200,
        headers: headers({ "content-type": "application/json" }),
        body,
      }).fn,
    ).send(requestFixture(), credentialOptions());

    expect(result.reasonCode).toBe("response_too_large");
    expect(result.responseCompleted).toBe(false);
  });

  it("blocks redirects and unsupported content type without exposing locations", async () => {
    const redirect = await createTransport(
      new FakeFetch({
        status: 302,
        headers: headers({
          location: "https://other.example/next?credential=value",
          "content-type": "application/json",
        }),
        text: async () => "{}",
      }).fn,
    ).send(requestFixture(), credentialOptions());

    expect(redirect.reasonCode).toBe("redirect_blocked");
    expect(JSON.stringify(redirect)).not.toContain("other.example");

    const unsupported = await createTransport(
      new FakeFetch({
        status: 200,
        headers: headers({ "content-type": "text/html" }),
        text: async () => "<html></html>",
      }).fn,
    ).send(requestFixture(), credentialOptions());

    expect(unsupported.reasonCode).toBe("unsupported_content_type");
    expect(unsupported.responseCompleted).toBe(false);
  });

  it("maps status classes without parsing or leaking error bodies", async () => {
    const cases = [
      [401, "auth_failure", "authentication_transport_failure"],
      [403, "auth_failure", "authentication_transport_failure"],
      [429, "rate_limited", "rate_limited"],
      [404, "client_error", "provider_client_error"],
      [503, "server_error", "provider_server_error"],
    ] as const;

    for (const [status, statusClass, reasonCode] of cases) {
      const result = await createTransport(
        new FakeFetch(
          responseJson({ message: "credential-placeholder-value" }, status),
        ).fn,
      ).send(requestFixture({ requestId: `cloud-request-${status}` }), credentialOptions());

      expect(result.statusClass).toBe(statusClass);
      expect(result.reasonCode).toBe(reasonCode);
      expect(JSON.stringify(result)).not.toContain("credential-placeholder-value");
      expect(result.responseCompleted).toBe(false);
    }
  });

  it("handles malformed responses and network failures with safe request state", async () => {
    const malformed = await createTransport(
      new FakeFetch({
        status: 200,
        headers: headers({ "content-type": "application/json" }),
        text: async () => "{not-json",
      }).fn,
    ).send(requestFixture(), credentialOptions());

    expect(malformed.reasonCode).toBe("invalid_response");
    expect(malformed.responseCompleted).toBe(true);

    const network = await createTransport(async () => {
      throw new Error("connect failed credential-placeholder-value");
    }).send(requestFixture(), credentialOptions());

    expect(network.reasonCode).toBe("network_unavailable");
    expect(network.requestSent).toBe(true);
    expect(network.responseStarted).toBe(false);
    expect(JSON.stringify(network)).not.toContain("credential-placeholder-value");
  });

  it("enforces timeout, external cancellation, dispose cancellation, and no retry", async () => {
    const timeoutFetch = new FakeFetch((init) => waitUntilAborted(init.signal));
    const timedOut = await createTransport(timeoutFetch.fn, {
      timeoutBounds: { minTimeoutMs: 100, defaultTimeoutMs: 100, maxTimeoutMs: 100 },
    }).send(requestFixture({ timeoutMs: 100 }), credentialOptions());

    expect(timedOut.reasonCode).toBe("timeout");
    expect(timedOut.timeout).toBe(true);
    expect(timeoutFetch.calls).toHaveLength(1);
    expect(timedOut.automaticRetry).toBe(false);
    expect(timedOut.automaticFallback).toBe(false);

    const cancellation = new AbortController();
    const cancelledPromise = createTransport(
      new FakeFetch((init) => waitUntilAborted(init.signal)).fn,
    ).send(requestFixture(), {
      ...credentialOptions(),
      signal: cancellation.signal,
    });
    cancellation.abort();
    expect((await cancelledPromise).reasonCode).toBe("cancelled");

    const disposeFetch = new FakeFetch((init) => waitUntilAborted(init.signal));
    const transport = createTransport(disposeFetch.fn);
    const disposedPromise = transport.send(requestFixture(), credentialOptions());
    transport.dispose();
    expect((await disposedPromise).reasonCode).toBe("cancelled");
  });

  it("keeps concurrent requests isolated", async () => {
    const fetch = new FakeFetch((init) =>
      responseJson({
        requestId: init.headers["X-Jarvis-K-Request-Id"],
      }),
    );
    const transport = createTransport(fetch.fn);
    const [first, second] = await Promise.all([
      transport.send(
        requestFixture({ requestId: "cloud-request-a" }),
        credentialOptions(),
      ),
      transport.send(
        requestFixture({ requestId: "cloud-request-b" }),
        credentialOptions(),
      ),
    ]);

    expect(first.requestId).toBe("cloud-request-a");
    expect(second.requestId).toBe("cloud-request-b");
    expect(first.responseJson).toEqual({ requestId: "cloud-request-a" });
    expect(second.responseJson).toEqual({ requestId: "cloud-request-b" });
  });
});

describe("CloudReasoningRuntime provider-neutral conformance", () => {
  it("parses non-stream OpenAI-compatible final content without leaking reasoning", async () => {
    const fetch = new FakeFetch(
      responseJson({
        choices: [
          {
            message: {
              content: "{\"resultClass\":\"answer\",\"answer\":\"ok\"}",
              reasoning_content: "private reasoning",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 4,
          completion_tokens: 8,
          total_tokens: 12,
          completion_tokens_details: { reasoning_tokens: 3 },
        },
      }),
    );
    const runtime = createRuntime(fetch.fn);

    const result = await runtime.runOpenAiChatCompletions(
      runtimeRequestFixture({ stream: false }),
      credentialOptions(),
    );

    expect(result.transport.statusClass).toBe("success");
    expect(result.output.ok).toBe(true);
    expect(result.output.finalContent).toContain("\"answer\":\"ok\"");
    expect(result.output.reasoningObserved).toBe(true);
    expect(result.output.usage?.reasoningTokens).toBe(3);
    expect(result.health.state).toBe("ready");
    expect(result.diagnostics.reasoningObserved).toBe(true);
    expect(result.diagnostics.finalContentPresent).toBe(true);
    expect(JSON.stringify(result.diagnostics)).not.toContain("private reasoning");
    expect(JSON.stringify(result.diagnostics)).not.toContain("credential-placeholder-value");
  });

  it("parses streaming SSE across chunks, usage-only chunks, and DONE", async () => {
    const sse = [
      sseData({
        choices: [
          { delta: { reasoning_content: "hidden" }, finish_reason: null },
        ],
      }),
      sseData({
        choices: [{ delta: { content: "hel" }, finish_reason: null }],
      }),
      sseData({
        choices: [{ delta: { content: "lo" }, finish_reason: "stop" }],
      }),
      sseData({
        choices: [],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
      "data: [DONE]\n\n",
    ].join("");
    const fetch = new FakeFetch(
      responseText(sse, 200, { "content-type": "text/event-stream" }),
    );
    const runtime = createRuntime(fetch.fn);

    const result = await runtime.runOpenAiChatCompletions(
      runtimeRequestFixture({ stream: true }),
      credentialOptions(),
    );

    expect(fetch.calls[0]?.init.headers.Accept).toBe("text/event-stream");
    expect(result.output.finalContent).toBe("hello");
    expect(result.output.reasoningObserved).toBe(true);
    expect(result.output.usage?.totalTokens).toBe(3);
    expect(JSON.stringify(result.diagnostics)).not.toContain("hidden");
  });

  it("parses multi-line SSE data events as a single payload", () => {
    const parsed = parseOpenAiChatCompletionsSse({
      text: [
        "data: {",
        'data: "choices":[{"delta":{"content":"multi"},"finish_reason":"stop"}],',
        'data: "usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}',
        "data: }",
        "",
      ].join("\n"),
      maxFinalContentChars: 100,
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.finalContent).toBe("multi");
    expect(parsed.usage?.totalTokens).toBe(2);
  });

  it("blocks tool proposals, malformed streams, and missing final answers", () => {
    const tool = parseOpenAiChatCompletionsSse({
      text: sseData({
        choices: [{ delta: { tool_calls: [{ name: "x" }] } }],
      }),
      maxFinalContentChars: 100,
    });
    const malformed = parseOpenAiChatCompletionsSse({
      text: "data: {bad-json\n\n",
      maxFinalContentChars: 100,
    });
    const length = parseOpenAiChatCompletionsSse({
      text: sseData({
        choices: [
          {
            delta: { reasoning_content: "thinking only" },
            finish_reason: "length",
          },
        ],
      }),
      maxFinalContentChars: 100,
    });

    expect(tool.category).toBe("untrusted_tool_proposal_blocked");
    expect(malformed.category).toBe("malformed_stream");
    expect(length.category).toBe("output_budget_exhausted_before_final");
    expect(length.reasoningObserved).toBe(true);
    expect(JSON.stringify(length)).not.toContain("thinking only");
  });

  it("classifies trusted four-layer timeouts and keeps timer cleanup bounded", async () => {
    const fetch = new FakeFetch((init) => waitUntilAborted(init.signal));
    const modelProfile = modelProfileFixture({
      requestTimeoutPolicyId: "fast-timeout-v1",
    });
    const result = await createRuntime(fetch.fn, {
      modelProfile,
      timeoutPolicy: fastTimeoutPolicy(),
    }).runOpenAiChatCompletions(
      runtimeRequestFixture({
        modelProfile,
        timeoutPolicyId: "fast-timeout-v1",
      }),
      credentialOptions(),
    );

    expect(result.transport.statusClass).toBe("timeout");
    expect(result.transport.reasonCode).toBe("headers_timeout");
    expect(result.transport.timeout).toBe(true);
    expect(fetch.calls).toHaveLength(1);
    expect(result.diagnostics.retryCount).toBe(0);
    expect(result.diagnostics.fallbackCount).toBe(0);
  });

  it("supports external cancellation without retry or fallback", async () => {
    const cancellation = new AbortController();
    const runtime = createRuntime(
      new FakeFetch((init) => waitUntilAborted(init.signal)).fn,
    );
    const pending = runtime.runOpenAiChatCompletions(
      runtimeRequestFixture(),
      {
        ...credentialOptions(),
        signal: cancellation.signal,
      },
    );
    cancellation.abort();

    const result = await pending;

    expect(result.transport.reasonCode).toBe("cancelled");
    expect(result.diagnostics.retryCount).toBe(0);
    expect(result.diagnostics.fallbackCount).toBe(0);
  });

  it("allows only a single bounded retry before response starts", async () => {
    const fetch = new FakeFetchSequence([
      async () => {
        throw new Error("temporary reset");
      },
      responseJson({
        choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
      }),
    ]);
    const runtime = createRuntime(fetch.fn);

    const result = await runtime.runOpenAiChatCompletions(
      runtimeRequestFixture({
        retryPolicy: { automaticRetry: true, maxAttempts: 1 },
      }),
      credentialOptions(),
    );

    expect(fetch.calls).toHaveLength(2);
    expect(result.transport.statusClass).toBe("success");
    expect(result.diagnostics.retryCount).toBe(1);
    expect(result.diagnostics.fallbackCount).toBe(0);
  });

  it("fail-closes unimplemented protocol families and disabled models before fetch", async () => {
    const fetch = new FakeFetch(responseJson({})).fn;
    const disabledProfile = { ...modelProfileFixture(), enabled: false };
    const disabled = await createRuntime(fetch, {
      modelProfile: disabledProfile,
    }).runOpenAiChatCompletions(
      runtimeRequestFixture({
        modelProfile: disabledProfile,
      }),
      credentialOptions(),
    );
    const unimplementedProfile = {
      ...modelProfileFixture(),
      protocolFamily: "anthropic_messages" as const,
      enabled: false,
    };
    const unimplemented = await createRuntime(fetch, {
      modelProfile: unimplementedProfile,
    }).runOpenAiChatCompletions(
      runtimeRequestFixture({
        modelProfile: unimplementedProfile,
      }),
      credentialOptions(),
    );

    expect(disabled.transport.requestSent).toBe(false);
    expect(disabled.transport.reasonCode).toBe("model_not_available");
    expect(unimplemented.transport.requestSent).toBe(false);
    expect(unimplemented.transport.reasonCode).toBe("invalid_request");
  });

  it("rejects model profiles that were not registered by the trusted runtime", async () => {
    const registered = modelProfileFixture();
    const rendererSupplied = {
      ...registered,
      recommendedOutputTokens: 1024,
    };
    const fetch = new FakeFetch(
      responseJson({ choices: [{ message: { content: "unexpected" } }] }),
    );
    const runtime = createRuntime(fetch.fn, { modelProfile: registered });

    const result = await runtime.runOpenAiChatCompletions(
      runtimeRequestFixture({ modelProfile: rendererSupplied }),
      credentialOptions(),
    );

    expect(result.transport.requestSent).toBe(false);
    expect(result.transport.statusClass).toBe("blocked");
    expect(result.transport.reasonCode).toBe("invalid_request");
    expect(fetch.calls).toHaveLength(0);
  });
});

class FakeFetch {
  public readonly calls: { url: string; init: CloudReasoningFetchInit }[] = [];

  public constructor(
    private readonly responder:
      | CloudReasoningFetchResponse
      | ((init: CloudReasoningFetchInit) => Promise<CloudReasoningFetchResponse> | CloudReasoningFetchResponse),
  ) {}

  public readonly fn: CloudReasoningFetch = async (url, init) => {
    this.calls.push({ url, init });
    if (typeof this.responder === "function") {
      return this.responder(init);
    }
    return this.responder;
  };
}

class FakeFetchSequence {
  public readonly calls: { url: string; init: CloudReasoningFetchInit }[] = [];
  private index = 0;

  public constructor(
    private readonly responders: readonly (
      | CloudReasoningFetchResponse
      | ((init: CloudReasoningFetchInit) => Promise<CloudReasoningFetchResponse> | CloudReasoningFetchResponse)
    )[],
  ) {}

  public readonly fn: CloudReasoningFetch = async (url, init) => {
    this.calls.push({ url, init });
    const responder = this.responders[this.index++] ?? this.responders.at(-1);
    if (typeof responder === "function") {
      return responder(init);
    }
    if (!responder) {
      throw new Error("missing fake responder");
    }
    return responder;
  };
}

function createTransport(
  fetch: CloudReasoningFetch,
  overrides: Partial<CloudProviderEndpointProfile> = {},
): BoundedCloudReasoningTransport {
  return new BoundedCloudReasoningTransport({
    endpointProfiles: [{ ...profileFixture(), ...overrides }],
    fetch,
    now: () => new Date("2026-08-25T00:00:00.000Z"),
  });
}

function createRuntime(
  fetch: CloudReasoningFetch,
  overrides: {
    readonly modelProfile?: CloudReasoningModelCapabilityProfile;
    readonly timeoutPolicy?: CloudReasoningTimeoutPolicy;
  } = {},
): CloudReasoningRuntime {
  const modelProfile = overrides.modelProfile ?? modelProfileFixture();
  return new CloudReasoningRuntime({
    endpointProfiles: [profileFixture()],
    modelProfiles: [modelProfile],
    timeoutPolicies: [
      overrides.timeoutPolicy ?? DEFAULT_CLOUD_REASONING_TIMEOUT_POLICY,
    ],
    fetch,
    now: () => new Date("2026-08-25T00:00:00.000Z"),
  });
}

function profileFixture(): CloudProviderEndpointProfile {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: "advanced-brain.test",
    deploymentId: "test-deployment",
    trustClass: "jarvis_test",
    allowedOrigins: ["https://reasoning.example"],
    allowedOperationPaths: [{ operation: "reason.create", path: "/v1/reason" }],
    region: "global",
    requiresHttps: true,
    redirectPolicy: "none",
    maxRequestBytes: 2_000,
    maxResponseBytes: 2_000,
    timeoutBounds: {
      minTimeoutMs: 100,
      defaultTimeoutMs: 1_000,
      maxTimeoutMs: 200_000,
    },
    credentialBindingId: "credential-binding-test",
  };
}

function requestFixture(
  overrides: Partial<CloudReasoningTransportRequest> = {},
): CloudReasoningTransportRequest {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: "cloud-request-1",
    providerId: "advanced-brain.test",
    deploymentId: "test-deployment",
    operation: "reason.create",
    method: "POST",
    contentType: "application/json",
    bodyJson: { promptRef: "minimized-input" },
    credentialBindingId: "credential-binding-test",
    timeoutMs: 1_000,
    maxResponseBytes: 2_000,
    ...overrides,
  };
}

function runtimeRequestFixture(
  overrides: Partial<{
    readonly modelProfile: CloudReasoningModelCapabilityProfile;
    readonly timeoutPolicyId: string;
    readonly stream: boolean;
    readonly retryPolicy: { readonly automaticRetry: boolean; readonly maxAttempts: 1 };
  }> = {},
) {
  const modelProfile = overrides.modelProfile ?? modelProfileFixture();
  return {
    transportRequest: requestFixture({
      providerId: modelProfile.providerId,
      deploymentId: modelProfile.deploymentId,
      credentialBindingId: modelProfile.credentialBindingId,
      timeoutMs: 180_000,
      maxResponseBytes: 2_000,
      bodyJson: {
        model: modelProfile.modelId,
        messages: [{ role: "user", content: "fixed synthetic input" }],
        stream: overrides.stream ?? false,
        max_tokens: modelProfile.recommendedOutputTokens,
      },
    }),
    modelProfile,
    timeoutPolicyId:
      overrides.timeoutPolicyId ?? modelProfile.requestTimeoutPolicyId,
    stream: overrides.stream ?? false,
    maxFinalContentChars: 256,
    ...(overrides.retryPolicy ? { retryPolicy: overrides.retryPolicy } : {}),
  };
}

function modelProfileFixture(
  overrides: Partial<CloudReasoningModelCapabilityProfile> = {},
): CloudReasoningModelCapabilityProfile {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: "advanced-brain.test",
    modelId: "glm-5.2",
    protocolFamily: "openai_chat_completions",
    deploymentId: "test-deployment",
    trustClass: "jarvis_test",
    region: "global",
    supportsStreaming: true,
    supportsNonStreaming: true,
    supportsThinking: true,
    thinkingPolicy: "optional",
    supportsReasoningEffort: false,
    supportsTools: false,
    supportsStructuredOutput: true,
    supportsVision: false,
    supportsImages: false,
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    recommendedOutputTokens: 256,
    requestTimeoutPolicyId: "reasoning-default-v1",
    credentialBindingId: "credential-binding-test",
    endpointProfileId: "test-endpoint",
    executionSemantics: "real_provider",
    dataEgressClass: "cloud_fixed_diagnostic",
    pricingTier: "low",
    enabled: true,
    ...overrides,
  };
}

function fastTimeoutPolicy(): CloudReasoningTimeoutPolicy {
  return {
    policyId: "fast-timeout-v1",
    connectOrHeadersTimeoutMs: 100,
    firstEventTimeoutMs: 200,
    streamIdleTimeoutMs: 200,
    overallTimeoutMs: 500,
  };
}

function credentialOptions() {
  return {
    credential: {
      scheme: "bearer" as const,
      value: "credential-placeholder-value",
    },
  };
}

function responseJson(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): CloudReasoningFetchResponse {
  return {
    status,
    headers: headers({
      "content-type": "application/json",
      ...extraHeaders,
    }),
    text: async () => JSON.stringify(body),
  };
}

function responseText(
  text: string,
  status = 200,
  extraHeaders: Record<string, string> = {},
): CloudReasoningFetchResponse {
  return {
    status,
    headers: headers({
      "content-type": "application/json",
      ...extraHeaders,
    }),
    text: async () => text,
  };
}

function sseData(value: unknown): string {
  return `data: ${JSON.stringify(value)}\n\n`;
}

function headers(values: Record<string, string>): CloudReasoningFetchHeaders {
  const lowered = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    get(name: string) {
      return lowered[name.toLowerCase()] ?? null;
    },
  };
}

async function* chunkedBody(chunks: readonly string[]): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder();
  for (const chunk of chunks) {
    yield encoder.encode(chunk);
  }
}

function waitUntilAborted(signal: AbortSignal): Promise<CloudReasoningFetchResponse> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new Error("aborted"));
      return;
    }
    signal.addEventListener(
      "abort",
      () => reject(new Error("aborted")),
      { once: true },
    );
  });
}
