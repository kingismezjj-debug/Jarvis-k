import { describe, expect, it } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  type CloudProviderEndpointProfile,
  type CloudReasoningTransportRequest,
} from "@jarvis-k/contracts";
import {
  BoundedCloudReasoningTransport,
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
      maxTimeoutMs: 5_000,
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
