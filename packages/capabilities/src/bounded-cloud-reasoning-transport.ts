import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CloudProviderEndpointProfileSchema,
  CloudReasoningTransportRequestSchema,
  CloudReasoningTransportResultSchema,
  type CloudProviderEndpointProfile,
  type CloudReasoningTransportReasonCode,
  type CloudReasoningTransportRequest,
  type CloudReasoningTransportResult,
  type CloudReasoningTransportStatusClass,
} from "@jarvis-k/contracts";

export interface CloudReasoningRuntimeCredential {
  readonly scheme: "bearer";
  readonly value: string;
}

export interface CloudReasoningFetchInit {
  readonly method: "POST";
  readonly headers: {
    readonly Authorization: string;
    readonly "Content-Type": "application/json";
    readonly Accept: "application/json";
    readonly "X-Jarvis-K-Request-Id": string;
  };
  readonly body: string;
  readonly signal: AbortSignal;
  readonly redirect: "manual";
}

export interface CloudReasoningFetchHeaders {
  get(name: string): string | null;
}

export interface CloudReasoningFetchResponse {
  readonly status: number;
  readonly headers: CloudReasoningFetchHeaders;
  readonly body?: unknown;
  text?(): Promise<string>;
}

export interface CloudReasoningFetch {
  (url: string, init: CloudReasoningFetchInit): Promise<CloudReasoningFetchResponse>;
}

export interface BoundedCloudReasoningTransportOptions {
  readonly endpointProfiles: readonly CloudProviderEndpointProfile[];
  readonly fetch: CloudReasoningFetch;
  readonly now?: () => Date;
}

export interface CloudReasoningTransportSendOptions {
  readonly credential: CloudReasoningRuntimeCredential;
  readonly signal?: AbortSignal;
}

const TEXT_ENCODER = new TextEncoder();

export class BoundedCloudReasoningTransport {
  private readonly profiles: readonly CloudProviderEndpointProfile[];
  private readonly fetch: CloudReasoningFetch;
  private readonly now: () => Date;
  private readonly activeControllers = new Set<AbortController>();
  private disposed = false;

  public constructor(options: BoundedCloudReasoningTransportOptions) {
    this.profiles = options.endpointProfiles.map((profile) =>
      CloudProviderEndpointProfileSchema.parse(profile),
    );
    this.fetch = options.fetch;
    this.now = options.now ?? (() => new Date());
  }

  public async send(
    input: CloudReasoningTransportRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult> {
    const startedAt = this.now().getTime();
    const request = CloudReasoningTransportRequestSchema.safeParse(input);
    if (!request.success) {
      return this.result({
        request: fallbackRequest(input),
        startedAt,
        statusClass: "failed",
        reasonCode: "invalid_endpoint_profile",
        requestSent: false,
      });
    }
    if (this.disposed) {
      return this.result({
        request: request.data,
        startedAt,
        statusClass: "cancelled",
        reasonCode: "cancelled",
        cancelled: true,
        requestSent: false,
      });
    }
    if (
      options.credential.scheme !== "bearer" ||
      !isRuntimeCredentialValue(options.credential.value)
    ) {
      return this.result({
        request: request.data,
        startedAt,
        statusClass: "auth_failure",
        reasonCode: "authentication_transport_failure",
        requestSent: false,
      });
    }

    const profile = this.findProfile(request.data);
    if (!profile) {
      return this.result({
        request: request.data,
        startedAt,
        statusClass: "blocked",
        reasonCode: "endpoint_not_allowed",
        requestSent: false,
      });
    }
    const operationPath = profile.allowedOperationPaths.find(
      (entry) => entry.operation === request.data.operation,
    );
    if (!operationPath) {
      return this.result({
        request: request.data,
        startedAt,
        statusClass: "blocked",
        reasonCode: "endpoint_not_allowed",
        requestSent: false,
      });
    }

    const endpoint = resolveEndpoint(profile, operationPath.path);
    if (!endpoint) {
      return this.result({
        request: request.data,
        startedAt,
        statusClass: "blocked",
        reasonCode: "insecure_transport",
        requestSent: false,
      });
    }

    let body: string;
    try {
      body = JSON.stringify(request.data.bodyJson);
    } catch {
      return this.result({
        request: request.data,
        startedAt,
        statusClass: "failed",
        reasonCode: "invalid_response",
        requestSent: false,
      });
    }
    if (TEXT_ENCODER.encode(body).byteLength > profile.maxRequestBytes) {
      return this.result({
        request: request.data,
        startedAt,
        statusClass: "blocked",
        reasonCode: "request_too_large",
        requestSent: false,
      });
    }

    const maxResponseBytes = Math.min(
      request.data.maxResponseBytes,
      profile.maxResponseBytes,
    );
    const timeoutMs = clampTimeout(
      request.data.timeoutMs,
      profile.timeoutBounds.minTimeoutMs,
      profile.timeoutBounds.maxTimeoutMs,
    );
    const controller = new AbortController();
    this.activeControllers.add(controller);
    const cleanupExternalAbort = bindExternalAbort(options.signal, controller);
    let timeout = false;
    const timer = setTimeout(() => {
      timeout = true;
      controller.abort();
    }, timeoutMs);

    let requestSent = false;
    let responseStarted = false;
    try {
      requestSent = true;
      const response = await this.fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.credential.value}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Jarvis-K-Request-Id": request.data.requestId,
        },
        body,
        signal: controller.signal,
        redirect: "manual",
      });
      responseStarted = true;
      const httpStatus = response.status;
      if (httpStatus >= 300 && httpStatus < 400) {
        await cancelResponseBody(response.body);
        return this.result({
          request: request.data,
          startedAt,
          statusClass: "blocked",
          reasonCode: "redirect_blocked",
          httpStatus,
          requestSent,
          responseStarted,
        });
      }
      const contentType = response.headers.get("content-type") ?? "";
      const safeHeaders = safeResponseHeaders(response.headers);
      if (!isJsonContentType(contentType)) {
        await cancelResponseBody(response.body);
        return this.result({
          request: request.data,
          startedAt,
          statusClass: "failed",
          reasonCode: "unsupported_content_type",
          httpStatus,
          safeHeaders,
          requestSent,
          responseStarted,
        });
      }
      const declaredLength = parseContentLength(response.headers.get("content-length"));
      if (declaredLength !== undefined && declaredLength > maxResponseBytes) {
        await cancelResponseBody(response.body);
        return this.result({
          request: request.data,
          startedAt,
          statusClass: "failed",
          reasonCode: "response_too_large",
          httpStatus,
          safeHeaders,
          requestSent,
          responseStarted,
        });
      }
      const httpFailure = httpStatusToFailure(httpStatus);
      if (httpFailure) {
        await cancelResponseBody(response.body);
        return this.result({
          request: request.data,
          startedAt,
          statusClass: httpFailure.statusClass,
          reasonCode: httpFailure.reasonCode,
          httpStatus,
          safeHeaders,
          requestSent,
          responseStarted,
        });
      }

      const read = await readBoundedResponseBody(
        response,
        maxResponseBytes,
        controller,
      );
      if (!read.ok) {
        return this.result({
          request: request.data,
          startedAt,
          statusClass: "failed",
          reasonCode: "response_too_large",
          httpStatus,
          safeHeaders,
          requestSent,
          responseStarted,
        });
      }
      let responseJson: unknown;
      try {
        responseJson = read.text.length > 0 ? JSON.parse(read.text) : {};
      } catch {
        return this.result({
          request: request.data,
          startedAt,
          statusClass: "invalid_response",
          reasonCode: "invalid_response",
          httpStatus,
          safeHeaders,
          requestSent,
          responseStarted,
          responseCompleted: true,
        });
      }
      const parsedResult = CloudReasoningTransportResultSchema.safeParse({
        schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
        requestId: request.data.requestId,
        providerId: request.data.providerId,
        deploymentId: request.data.deploymentId,
        operation: request.data.operation,
        statusClass: "success",
        reasonCode: "completed",
        httpStatus,
        responseJson,
        safeHeaders,
        latencyMs: Math.max(0, this.now().getTime() - startedAt),
        requestSent,
        responseStarted,
        responseCompleted: true,
        cancelled: false,
        timeout: false,
        automaticRetry: false,
        automaticFallback: false,
        credentialExposed: false,
        requestBodyExposed: false,
        responseBodyLogged: false,
      });
      if (!parsedResult.success) {
        return this.result({
          request: request.data,
          startedAt,
          statusClass: "invalid_response",
          reasonCode: "invalid_response",
          httpStatus,
          safeHeaders,
          requestSent,
          responseStarted,
          responseCompleted: true,
        });
      }
      return parsedResult.data;
    } catch {
      const externallyCancelled = options.signal?.aborted === true && !timeout;
      return this.result({
        request: request.data,
        startedAt,
        statusClass: timeout
          ? "timeout"
          : externallyCancelled || this.disposed
            ? "cancelled"
            : "network_error",
        reasonCode: timeout
          ? "timeout"
          : externallyCancelled || this.disposed
            ? "cancelled"
            : "network_unavailable",
        requestSent,
        responseStarted,
        cancelled: externallyCancelled || this.disposed,
        timeout,
      });
    } finally {
      clearTimeout(timer);
      cleanupExternalAbort();
      this.activeControllers.delete(controller);
    }
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const controller of this.activeControllers) {
      controller.abort();
    }
    this.activeControllers.clear();
  }

  private findProfile(
    request: CloudReasoningTransportRequest,
  ): CloudProviderEndpointProfile | undefined {
    return this.profiles.find(
      (profile) =>
        profile.providerId === request.providerId &&
        profile.deploymentId === request.deploymentId &&
        profile.credentialBindingId === request.credentialBindingId,
    );
  }

  private result(input: {
    readonly request: CloudReasoningTransportRequest;
    readonly startedAt: number;
    readonly statusClass: CloudReasoningTransportStatusClass;
    readonly reasonCode: CloudReasoningTransportReasonCode;
    readonly httpStatus?: number;
    readonly safeHeaders?: CloudReasoningTransportResult["safeHeaders"];
    readonly requestSent: boolean;
    readonly responseStarted?: boolean;
    readonly responseCompleted?: boolean;
    readonly cancelled?: boolean;
    readonly timeout?: boolean;
  }): CloudReasoningTransportResult {
    return CloudReasoningTransportResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      requestId: input.request.requestId,
      providerId: input.request.providerId,
      deploymentId: input.request.deploymentId,
      operation: input.request.operation,
      statusClass: input.statusClass,
      reasonCode: input.reasonCode,
      ...(input.httpStatus === undefined ? {} : { httpStatus: input.httpStatus }),
      safeHeaders: input.safeHeaders ?? {},
      latencyMs: Math.max(0, this.now().getTime() - input.startedAt),
      requestSent: input.requestSent,
      responseStarted: input.responseStarted === true,
      responseCompleted: input.responseCompleted === true,
      cancelled: input.cancelled === true,
      timeout: input.timeout === true,
      automaticRetry: false,
      automaticFallback: false,
      credentialExposed: false,
      requestBodyExposed: false,
      responseBodyLogged: false,
    });
  }
}

function fallbackRequest(input: CloudReasoningTransportRequest): CloudReasoningTransportRequest {
  const fallback = {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId:
      typeof input.requestId === "string" && /^[A-Za-z0-9._:-]{8,128}$/u.test(input.requestId)
        ? input.requestId
        : "invalid-request",
    providerId:
      typeof input.providerId === "string" && /^[a-z0-9][a-z0-9._:-]{0,127}$/u.test(input.providerId)
        ? input.providerId
        : "unknown",
    deploymentId:
      typeof input.deploymentId === "string" && /^[a-z0-9][a-z0-9._:-]{0,127}$/u.test(input.deploymentId)
        ? input.deploymentId
        : "unknown",
    operation:
      typeof input.operation === "string" && /^[a-z][a-z0-9._:-]{0,127}$/u.test(input.operation)
        ? input.operation
        : "unknown",
    method: "POST",
    contentType: "application/json",
    bodyJson: {},
    credentialBindingId: "unknown",
    timeoutMs: 1_000,
    maxResponseBytes: 1_000,
  } satisfies CloudReasoningTransportRequest;
  return fallback;
}

function resolveEndpoint(
  profile: CloudProviderEndpointProfile,
  path: string,
): string | undefined {
  const origin = profile.allowedOrigins[0];
  if (!origin) {
    return undefined;
  }
  try {
    const base = new URL(origin);
    const url = new URL(path, `${base.origin}/`);
    if (url.protocol !== "https:" || url.origin !== base.origin) {
      return undefined;
    }
    if (url.username || url.password || url.search || url.hash) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

function clampTimeout(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function bindExternalAbort(
  signal: AbortSignal | undefined,
  controller: AbortController,
): () => void {
  if (!signal) {
    return () => undefined;
  }
  if (signal.aborted) {
    controller.abort();
    return () => undefined;
  }
  const listener = () => controller.abort();
  signal.addEventListener("abort", listener, { once: true });
  return () => signal.removeEventListener("abort", listener);
}

function isRuntimeCredentialValue(value: string): boolean {
  return value.trim().length > 0 && value.length <= 8_192;
}

function isJsonContentType(value: string): boolean {
  return /^application\/json(?:\s*;.*)?$/iu.test(value.trim());
}

function parseContentLength(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  if (!/^\d+$/u.test(value)) {
    return undefined;
  }
  return Number(value);
}

function safeResponseHeaders(
  headers: CloudReasoningFetchHeaders,
): CloudReasoningTransportResult["safeHeaders"] {
  const contentType = headers.get("content-type");
  return {
    ...(contentType ? { contentType: contentType.slice(0, 128) } : {}),
  };
}

function httpStatusToFailure(
  status: number,
): { statusClass: CloudReasoningTransportStatusClass; reasonCode: CloudReasoningTransportReasonCode } | undefined {
  if (status >= 200 && status < 300) {
    return undefined;
  }
  if (status === 401 || status === 403) {
    return {
      statusClass: "auth_failure",
      reasonCode: "authentication_transport_failure",
    };
  }
  if (status === 429) {
    return { statusClass: "rate_limited", reasonCode: "rate_limited" };
  }
  if (status >= 400 && status < 500) {
    return { statusClass: "client_error", reasonCode: "provider_client_error" };
  }
  if (status >= 500 && status < 600) {
    return { statusClass: "server_error", reasonCode: "provider_server_error" };
  }
  return { statusClass: "failed", reasonCode: "transport_failed" };
}

async function readBoundedResponseBody(
  response: CloudReasoningFetchResponse,
  maxBytes: number,
  controller: AbortController,
): Promise<{ ok: true; text: string } | { ok: false }> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  const append = (chunk: Uint8Array): boolean => {
    total += chunk.byteLength;
    if (total > maxBytes) {
      controller.abort();
      return false;
    }
    chunks.push(chunk);
    return true;
  };

  if (isReadableStreamLike(response.body)) {
    const reader = response.body.getReader();
    try {
      for (;;) {
        const next = await reader.read();
        if (next.done) {
          break;
        }
        if (next.value && !append(next.value)) {
          await reader.cancel?.();
          return { ok: false };
        }
      }
    } finally {
      reader.releaseLock?.();
    }
    return { ok: true, text: decodeChunks(chunks, total) };
  }

  if (isAsyncIterable(response.body)) {
    for await (const chunk of response.body) {
      if (!append(chunk)) {
        await cancelResponseBody(response.body);
        return { ok: false };
      }
    }
    return { ok: true, text: decodeChunks(chunks, total) };
  }

  if (response.text) {
    const text = await response.text();
    if (TEXT_ENCODER.encode(text).byteLength > maxBytes) {
      controller.abort();
      return { ok: false };
    }
    return { ok: true, text };
  }

  return { ok: true, text: "" };
}

function decodeChunks(chunks: readonly Uint8Array[], total: number): string {
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

function isReadableStreamLike(value: unknown): value is {
  getReader(): {
    read(): Promise<{ done: boolean; value?: Uint8Array }>;
    cancel?(): Promise<void>;
    releaseLock?(): void;
  };
} {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { getReader?: unknown }).getReader === "function"
  );
}

function isAsyncIterable(value: unknown): value is AsyncIterable<Uint8Array> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] ===
      "function"
  );
}

async function cancelResponseBody(body: unknown): Promise<void> {
  if (isReadableStreamLike(body)) {
    const reader = body.getReader();
    await reader.cancel?.();
    return;
  }
  if (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { cancel?: unknown }).cancel === "function"
  ) {
    await (body as { cancel(): Promise<void> }).cancel();
  }
}
