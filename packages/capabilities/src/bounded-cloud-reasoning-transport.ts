import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CloudProviderEndpointProfileSchema,
  CloudReasoningModelCapabilityProfileSchema,
  CloudReasoningProviderHealthProjectionSchema,
  CloudReasoningTimeoutPolicySchema,
  CloudReasoningTransportRequestSchema,
  CloudReasoningTransportResultSchema,
  type CloudProviderEndpointProfile,
  type CloudReasoningModelCapabilityProfile,
  type CloudReasoningProviderHealthProjection,
  type CloudReasoningTimeoutPolicy,
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
    readonly Accept: "application/json" | "text/event-stream";
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
  readonly timeoutPolicy?: CloudReasoningTimeoutPolicy;
}

export interface CloudReasoningRuntimeOptions {
  readonly endpointProfiles: readonly CloudProviderEndpointProfile[];
  readonly modelProfiles: readonly CloudReasoningModelCapabilityProfile[];
  readonly timeoutPolicies: readonly CloudReasoningTimeoutPolicy[];
  readonly fetch?: CloudReasoningFetch;
  readonly transport?: CloudReasoningRuntimeTransport;
  readonly now?: () => Date;
}

export interface CloudReasoningRuntimeTransport {
  send(
    request: CloudReasoningTransportRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult>;
  dispose?(): void;
}

export interface CloudReasoningRuntimeRequest {
  readonly transportRequest: CloudReasoningTransportRequest;
  readonly modelProfile: CloudReasoningModelCapabilityProfile;
  readonly timeoutPolicyId: string;
  readonly stream: boolean;
  readonly maxFinalContentChars: number;
  readonly retryPolicy?: CloudReasoningRetryPolicy;
  readonly toolsEnabled?: boolean;
}

export interface CloudReasoningRetryPolicy {
  readonly automaticRetry: boolean;
  readonly maxAttempts: 1;
}

export interface OpenAiChatCompletionsParseResult {
  readonly ok: boolean;
  readonly finalContent?: string;
  readonly finalContentBytes: number;
  readonly reasoningObserved: boolean;
  readonly finishReason?: string;
  readonly usage?: {
    readonly promptTokens?: number;
    readonly completionTokens?: number;
    readonly totalTokens?: number;
    readonly reasoningTokens?: number;
  };
  readonly toolProposalObserved: boolean;
  readonly category:
    | "completed"
    | "response_too_large"
    | "invalid_provider_output"
    | "no_final_answer"
    | "output_budget_exhausted_before_final"
    | "untrusted_tool_proposal_blocked"
    | "provider_content_filtered"
    | "provider_capacity_unavailable"
    | "malformed_stream"
    | "incomplete_stream";
}

export interface CloudReasoningRuntimeResult {
  readonly transport: CloudReasoningTransportResult;
  readonly output: OpenAiChatCompletionsParseResult;
  readonly health: CloudReasoningProviderHealthProjection;
  readonly diagnostics: {
    readonly schemaVersion: typeof ADVANCED_BRAIN_SCHEMA_VERSION;
    readonly providerId: string;
    readonly deploymentId: string;
    readonly modelId: string;
    readonly protocolFamily: "openai_chat_completions";
    readonly endpointProfileId: string;
    readonly requestTimeoutPolicyId: string;
    readonly statusClass: CloudReasoningTransportStatusClass;
    readonly reasonCode: CloudReasoningTransportReasonCode;
    readonly requestSent: boolean;
    readonly responseStarted: boolean;
    readonly responseCompleted: boolean;
    readonly retryCount: number;
    readonly fallbackCount: 0;
    readonly reasoningObserved: boolean;
    readonly finalContentPresent: boolean;
    readonly finalContentBytes: number;
    readonly finishReason?: string;
    readonly contentType: string | "not_available";
    readonly jsonDecoded: boolean | "not_available";
    readonly toolProposalObserved: boolean;
    readonly promptExposed: false;
    readonly credentialExposed: false;
    readonly responseBodyLogged: false;
    readonly directActionAttempted: false;
  };
}

const TEXT_ENCODER = new TextEncoder();
const JSON_CONTENT_TYPE = "application/json";
const SSE_CONTENT_TYPE = "text/event-stream";

export const DEFAULT_CLOUD_REASONING_TIMEOUT_POLICY =
  CloudReasoningTimeoutPolicySchema.parse({
    policyId: "reasoning-default-v1",
    connectOrHeadersTimeoutMs: 15_000,
    firstEventTimeoutMs: 60_000,
    streamIdleTimeoutMs: 30_000,
    overallTimeoutMs: 180_000,
  });

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
    const timeoutPolicy = effectiveTimeoutPolicy(options.timeoutPolicy, timeoutMs);
    const controller = new AbortController();
    this.activeControllers.add(controller);
    const cleanupExternalAbort = bindExternalAbort(options.signal, controller);
    let timeout = false;
    let timeoutReason: CloudReasoningTransportReasonCode = "timeout";
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const armTimeout = (
      reasonCode: CloudReasoningTransportReasonCode,
      durationMs: number,
    ): ReturnType<typeof setTimeout> => {
      const timer = setTimeout(() => {
        timeout = true;
        timeoutReason = reasonCode;
        controller.abort();
      }, durationMs);
      timers.add(timer);
      return timer;
    };
    const clearArmedTimeout = (timer: ReturnType<typeof setTimeout> | undefined) => {
      if (timer) {
        clearTimeout(timer);
        timers.delete(timer);
      }
    };
    const clearAllTimeouts = () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      timers.clear();
    };
    const overallTimer = armTimeout(
      timeoutPolicy.granular ? "overall_timeout" : "timeout",
      timeoutPolicy.policy.overallTimeoutMs,
    );
    const headersTimer = armTimeout(
      timeoutPolicy.granular ? "headers_timeout" : "timeout",
      timeoutPolicy.policy.connectOrHeadersTimeoutMs,
    );
    let firstEventTimer: ReturnType<typeof setTimeout> | undefined;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const markFirstEvent = () => {
      clearArmedTimeout(firstEventTimer);
      firstEventTimer = undefined;
    };
    const resetIdleTimer = () => {
      clearArmedTimeout(idleTimer);
      idleTimer = armTimeout(
        timeoutPolicy.granular ? "stream_idle_timeout" : "timeout",
        timeoutPolicy.policy.streamIdleTimeoutMs,
      );
    };
    const armFirstEventTimer = () => {
      firstEventTimer = armTimeout(
        timeoutPolicy.granular ? "first_event_timeout" : "timeout",
        timeoutPolicy.policy.firstEventTimeoutMs,
      );
    };
    const markChunk = () => {
      markFirstEvent();
      resetIdleTimer();
    };
    let requestSent = false;
    let responseStarted = false;
    try {
      requestSent = true;
      const response = await this.fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.credential.value}`,
          "Content-Type": "application/json",
          Accept: isStreamingRequest(request.data) ? SSE_CONTENT_TYPE : JSON_CONTENT_TYPE,
          "X-Jarvis-K-Request-Id": request.data.requestId,
        },
        body,
        signal: controller.signal,
        redirect: "manual",
      });
      clearArmedTimeout(headersTimer);
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
      if (!isJsonContentType(contentType) && !isEventStreamContentType(contentType)) {
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

      armFirstEventTimer();
      const read = await readBoundedResponseBody(
        response,
        maxResponseBytes,
        controller,
        {
          onChunk: markChunk,
          onComplete: () => {
            markFirstEvent();
            clearArmedTimeout(idleTimer);
          },
        },
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
        responseJson = isEventStreamContentType(contentType)
          ? { sseText: read.text }
          : read.text.length > 0 ? JSON.parse(read.text) : {};
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
          ? timeoutReason
          : externallyCancelled || this.disposed
            ? "cancelled"
            : responseStarted && isStreamingRequest(request.data)
              ? "incomplete_stream"
              : "network_unavailable",
        requestSent,
        responseStarted,
        cancelled: externallyCancelled || this.disposed,
        timeout,
      });
    } finally {
      clearAllTimeouts();
      clearArmedTimeout(overallTimer);
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

export class CloudReasoningRuntime {
  private readonly transport: CloudReasoningRuntimeTransport;
  private readonly endpointProfiles: readonly CloudProviderEndpointProfile[];
  private readonly modelProfiles: readonly CloudReasoningModelCapabilityProfile[];
  private readonly timeoutPolicies: readonly CloudReasoningTimeoutPolicy[];
  private readonly now: () => Date;
  private readonly failures = new Map<string, number>();
  private readonly successes = new Map<string, string>();
  private disposed = false;

  public constructor(options: CloudReasoningRuntimeOptions) {
    this.endpointProfiles = options.endpointProfiles.map((profile) =>
      CloudProviderEndpointProfileSchema.parse(profile),
    );
    this.modelProfiles = options.modelProfiles.map((profile) =>
      CloudReasoningModelCapabilityProfileSchema.parse(profile),
    );
    this.timeoutPolicies = options.timeoutPolicies.map((policy) =>
      CloudReasoningTimeoutPolicySchema.parse(policy),
    );
    this.now = options.now ?? (() => new Date());
    if (options.transport) {
      this.transport = options.transport;
    } else if (options.fetch) {
      this.transport = new BoundedCloudReasoningTransport({
        endpointProfiles: this.endpointProfiles,
        fetch: options.fetch,
        now: this.now,
      });
    } else {
      throw new Error("CLOUD_REASONING_RUNTIME_TRANSPORT_REQUIRED");
    }
  }

  public async runOpenAiChatCompletions(
    input: CloudReasoningRuntimeRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningRuntimeResult> {
    const runtimeInput = this.validateRuntimeInput(input);
    if (!runtimeInput.ok) {
      const transport = this.emptyTransportResult(
        input.transportRequest,
        runtimeInput.reasonCode,
        runtimeInput.statusClass,
      );
      return this.runtimeResult(input, transport, emptyParseResult(runtimeInput.reasonCode));
    }
    if (this.disposed) {
      const transport = this.emptyTransportResult(
        input.transportRequest,
        "cancelled",
        "cancelled",
      );
      return this.runtimeResult(input, transport, emptyParseResult("cancelled"));
    }

    const retryEnabled = input.retryPolicy?.automaticRetry === true;
    const first = await this.sendOnce(input, options);
    if (
      retryEnabled &&
      first.transport.requestSent &&
      !first.transport.responseStarted &&
      isRetryableBeforeResponse(first.transport.reasonCode)
    ) {
      const second = await this.sendOnce(input, options);
      return this.withRetryDiagnostics(second, 1);
    }
    return this.withRetryDiagnostics(first, 0);
  }

  public healthFor(
    profile: CloudReasoningModelCapabilityProfile,
  ): CloudReasoningProviderHealthProjection {
    const parsed = CloudReasoningModelCapabilityProfileSchema.parse(profile);
    const key = healthKey(parsed);
    const consecutiveFailureCount = this.failures.get(key) ?? 0;
    const lastSuccessAt = this.successes.get(key);
    return CloudReasoningProviderHealthProjectionSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      providerId: parsed.providerId,
      deploymentId: parsed.deploymentId,
      modelId: parsed.modelId,
      state: !parsed.enabled
        ? "disabled"
        : consecutiveFailureCount === 0
          ? lastSuccessAt
            ? "ready"
            : "unknown"
          : consecutiveFailureCount > 2
            ? "degraded"
            : "unavailable",
      ...(lastSuccessAt ? { lastSuccessAt } : {}),
      consecutiveFailureCount,
      source: "runtime_observation",
    });
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.transport.dispose?.();
  }

  private async sendOnce(
    input: CloudReasoningRuntimeRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningRuntimeResult> {
    const request = normalizeRuntimeTransportRequest(input);
    const transport = await this.transport.send(request, {
      ...options,
      timeoutPolicy: this.timeoutPolicyFor(input.timeoutPolicyId),
    });
    const parse =
      transport.statusClass === "success" &&
      input.modelProfile.protocolFamily === "openai_chat_completions"
        ? parseOpenAiChatCompletionsTransportResult({
            transport,
            maxFinalContentChars: input.maxFinalContentChars,
          })
        : emptyParseResult(transport.reasonCode);
    return this.runtimeResult(input, transport, parse);
  }

  private runtimeResult(
    input: CloudReasoningRuntimeRequest,
    transport: CloudReasoningTransportResult,
    output: OpenAiChatCompletionsParseResult,
  ): CloudReasoningRuntimeResult {
    const health = this.recordHealth(input.modelProfile, transport);
    return {
      transport,
      output,
      health,
      diagnostics: runtimeDiagnostics(input, transport, output, 0),
    };
  }

  private withRetryDiagnostics(
    result: CloudReasoningRuntimeResult,
    retryCount: number,
  ): CloudReasoningRuntimeResult {
    return {
      ...result,
      diagnostics: {
        ...result.diagnostics,
        retryCount,
      },
    };
  }

  private recordHealth(
    profile: CloudReasoningModelCapabilityProfile,
    transport: CloudReasoningTransportResult,
  ): CloudReasoningProviderHealthProjection {
    const key = healthKey(profile);
    const now = this.now().toISOString();
    if (transport.statusClass === "success") {
      this.failures.set(key, 0);
      this.successes.set(key, now);
      return CloudReasoningProviderHealthProjectionSchema.parse({
        schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
        providerId: profile.providerId,
        deploymentId: profile.deploymentId,
        modelId: profile.modelId,
        state: "ready",
        lastAttemptAt: now,
        lastSuccessAt: now,
        consecutiveFailureCount: 0,
        source: "runtime_observation",
      });
    }
    const count = (this.failures.get(key) ?? 0) + 1;
    this.failures.set(key, count);
    const state =
      transport.statusClass === "auth_failure"
        ? "credential_missing"
        : transport.statusClass === "rate_limited"
          ? "rate_limited"
          : count > 2
            ? "degraded"
            : "unavailable";
    return CloudReasoningProviderHealthProjectionSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      providerId: profile.providerId,
      deploymentId: profile.deploymentId,
      modelId: profile.modelId,
      state,
      lastAttemptAt: now,
      sanitizedFailureCategory: transport.reasonCode,
      consecutiveFailureCount: count,
      source: "runtime_observation",
    });
  }

  private validateRuntimeInput(
    input: CloudReasoningRuntimeRequest,
  ):
    | { readonly ok: true }
    | {
        readonly ok: false;
        readonly statusClass: CloudReasoningTransportStatusClass;
        readonly reasonCode: CloudReasoningTransportReasonCode;
      } {
    const request = CloudReasoningTransportRequestSchema.safeParse(
      input.transportRequest,
    );
    const model = CloudReasoningModelCapabilityProfileSchema.safeParse(
      input.modelProfile,
    );
    if (!request.success || !model.success) {
      return { ok: false, statusClass: "failed", reasonCode: "invalid_request" };
    }
    const registeredModel = this.modelProfiles.find(
      (candidate) =>
        candidate.providerId === model.data.providerId &&
        candidate.deploymentId === model.data.deploymentId &&
        candidate.modelId === model.data.modelId,
    );
    if (!registeredModel || !sameModelProfile(registeredModel, model.data)) {
      return {
        ok: false,
        statusClass: "blocked",
        reasonCode: "invalid_request",
      };
    }
    if (model.data.protocolFamily !== "openai_chat_completions") {
      return {
        ok: false,
        statusClass: "blocked",
        reasonCode: "invalid_request",
      };
    }
    if (!model.data.enabled) {
      return {
        ok: false,
        statusClass: "blocked",
        reasonCode: "model_not_available",
      };
    }
    if (
      model.data.providerId !== request.data.providerId ||
      model.data.deploymentId !== request.data.deploymentId ||
      model.data.credentialBindingId !== request.data.credentialBindingId
    ) {
      return {
        ok: false,
        statusClass: "blocked",
        reasonCode: "invalid_request",
      };
    }
    const policy = this.timeoutPolicies.find(
      (candidate) => candidate.policyId === input.timeoutPolicyId,
    );
    if (!policy || policy.policyId !== model.data.requestTimeoutPolicyId) {
      return {
        ok: false,
        statusClass: "blocked",
        reasonCode: "invalid_request",
      };
    }
    if (input.stream && !model.data.supportsStreaming) {
      return {
        ok: false,
        statusClass: "blocked",
        reasonCode: "invalid_request",
      };
    }
    if (!input.stream && !model.data.supportsNonStreaming) {
      return {
        ok: false,
        statusClass: "blocked",
        reasonCode: "invalid_request",
      };
    }
    if (
      !runtimeRequestBodyMatchesProfile(
        request.data.bodyJson,
        model.data,
        input.stream,
        input.toolsEnabled === true,
      )
    ) {
      return {
        ok: false,
        statusClass: "blocked",
        reasonCode: "invalid_request",
      };
    }
    return { ok: true };
  }

  private emptyTransportResult(
    requestInput: CloudReasoningTransportRequest,
    reasonCode: CloudReasoningTransportReasonCode,
    statusClass: CloudReasoningTransportStatusClass,
  ): CloudReasoningTransportResult {
    const request = fallbackRequest(requestInput);
    return CloudReasoningTransportResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      requestId: request.requestId,
      providerId: request.providerId,
      deploymentId: request.deploymentId,
      operation: request.operation,
      statusClass,
      reasonCode,
      safeHeaders: {},
      latencyMs: 0,
      requestSent: false,
      responseStarted: false,
      responseCompleted: false,
      cancelled: statusClass === "cancelled",
      timeout: statusClass === "timeout",
      automaticRetry: false,
      automaticFallback: false,
      credentialExposed: false,
      requestBodyExposed: false,
      responseBodyLogged: false,
    });
  }

  private timeoutPolicyFor(policyId: string): CloudReasoningTimeoutPolicy {
    const policy = this.timeoutPolicies.find(
      (candidate) => candidate.policyId === policyId,
    );
    return policy ?? DEFAULT_CLOUD_REASONING_TIMEOUT_POLICY;
  }
}

export function parseOpenAiChatCompletionsJson(input: {
  readonly body: unknown;
  readonly maxFinalContentChars: number;
}): OpenAiChatCompletionsParseResult {
  if (!isRecord(input.body) || !Array.isArray(input.body.choices)) {
    return invalidParse("invalid_provider_output");
  }
  const choice = input.body.choices[0];
  if (!isRecord(choice)) {
    return invalidParse("invalid_provider_output");
  }
  const message = choice.message;
  if (!isRecord(message)) {
    return invalidParse("invalid_provider_output");
  }
  if (
    Object.prototype.hasOwnProperty.call(message, "tool_calls") ||
    Object.prototype.hasOwnProperty.call(message, "function_call")
  ) {
    return invalidParse("untrusted_tool_proposal_blocked", {
      toolProposalObserved: true,
    });
  }
  const content = typeof message.content === "string" ? message.content : "";
  const reasoningObserved = typeof message.reasoning_content === "string";
  const finishReason =
    typeof choice.finish_reason === "string" ? choice.finish_reason : undefined;
  const usage = parseUsage(input.body.usage);
  const terminalFailure = finishReasonToFailureCategory(finishReason);
  if (terminalFailure) {
    return invalidParse(terminalFailure, {
      reasoningObserved,
      ...(finishReason ? { finishReason } : {}),
      ...(usage ? { usage } : {}),
      toolProposalObserved:
        terminalFailure === "untrusted_tool_proposal_blocked",
    });
  }
  if (content.length === 0) {
    const partial = {
      reasoningObserved,
      ...(finishReason ? { finishReason } : {}),
      ...(usage ? { usage } : {}),
    };
    return invalidParse(
      finishReason === "length"
        ? "output_budget_exhausted_before_final"
        : "no_final_answer",
      partial,
    );
  }
  const bounded = boundFinalContent(content, input.maxFinalContentChars);
  if (!bounded.ok) {
    return invalidParse("response_too_large", {
      reasoningObserved,
      ...(finishReason ? { finishReason } : {}),
      ...(usage ? { usage } : {}),
    });
  }
  return {
    ok: true,
    finalContent: content,
    finalContentBytes: TEXT_ENCODER.encode(content).byteLength,
    reasoningObserved,
    ...(finishReason ? { finishReason } : {}),
    ...(usage ? { usage } : {}),
    toolProposalObserved: false,
    category: "completed",
  };
}

export function parseOpenAiChatCompletionsSse(input: {
  readonly text: string;
  readonly maxFinalContentChars: number;
}): OpenAiChatCompletionsParseResult {
  let finalContent = "";
  let reasoningObserved = false;
  let finishReason: string | undefined;
  let usage: OpenAiChatCompletionsParseResult["usage"];
  for (const event of parseSseEvents(input.text)) {
    const payload = event.dataLines.join("\n").trim();
    if (payload === "[DONE]") {
      continue;
    }
    let json: unknown;
    try {
      json = JSON.parse(payload);
    } catch {
      return invalidParse("malformed_stream");
    }
    if (!isRecord(json) || !Array.isArray(json.choices)) {
      return invalidParse("malformed_stream");
    }
    usage = parseUsage(json.usage) ?? usage;
    if (json.choices.length === 0) {
      continue;
    }
    const choice = json.choices[0];
    if (!isRecord(choice)) {
      return invalidParse("malformed_stream");
    }
    finishReason =
      typeof choice.finish_reason === "string" ? choice.finish_reason : finishReason;
    const delta = isRecord(choice.delta) ? choice.delta : {};
    const terminalFailure = finishReasonToFailureCategory(finishReason);
    if (terminalFailure) {
      return invalidParse(terminalFailure, {
        reasoningObserved,
        ...(finishReason ? { finishReason } : {}),
        ...(usage ? { usage } : {}),
        toolProposalObserved:
          terminalFailure === "untrusted_tool_proposal_blocked",
      });
    }
    if (
      Object.prototype.hasOwnProperty.call(delta, "tool_calls") ||
      Object.prototype.hasOwnProperty.call(delta, "function_call")
    ) {
      return invalidParse("untrusted_tool_proposal_blocked", {
        reasoningObserved,
        toolProposalObserved: true,
      });
    }
    if (typeof delta.reasoning_content === "string") {
      reasoningObserved = true;
    }
    if (typeof delta.content === "string") {
      finalContent += delta.content;
      if (finalContent.length > input.maxFinalContentChars) {
        return invalidParse("response_too_large", {
          reasoningObserved,
          ...(finishReason ? { finishReason } : {}),
          ...(usage ? { usage } : {}),
        });
      }
    }
  }
  if (finalContent.length === 0) {
    const partial = {
      reasoningObserved,
      ...(finishReason ? { finishReason } : {}),
      ...(usage ? { usage } : {}),
    };
    return invalidParse(
      finishReason === "length"
        ? "output_budget_exhausted_before_final"
        : "no_final_answer",
      partial,
    );
  }
  return {
    ok: true,
    finalContent,
    finalContentBytes: TEXT_ENCODER.encode(finalContent).byteLength,
    reasoningObserved,
    ...(finishReason ? { finishReason } : {}),
    ...(usage ? { usage } : {}),
    toolProposalObserved: false,
    category: "completed",
  };
}

function parseOpenAiChatCompletionsTransportResult(input: {
  readonly transport: CloudReasoningTransportResult;
  readonly maxFinalContentChars: number;
}): OpenAiChatCompletionsParseResult {
  const sseText =
    isRecord(input.transport.responseJson) &&
    typeof input.transport.responseJson.sseText === "string"
      ? input.transport.responseJson.sseText
      : undefined;
  return sseText !== undefined
    ? parseOpenAiChatCompletionsSse({
        text: sseText,
        maxFinalContentChars: input.maxFinalContentChars,
      })
    : parseOpenAiChatCompletionsJson({
        body: input.transport.responseJson,
        maxFinalContentChars: input.maxFinalContentChars,
      });
}

function runtimeDiagnostics(
  input: CloudReasoningRuntimeRequest,
  transport: CloudReasoningTransportResult,
  output: OpenAiChatCompletionsParseResult,
  retryCount: number,
): CloudReasoningRuntimeResult["diagnostics"] {
  const contentType = transport.safeHeaders.contentType ?? "not_available";
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: input.modelProfile.providerId,
    deploymentId: input.modelProfile.deploymentId,
    modelId: input.modelProfile.modelId,
    protocolFamily: "openai_chat_completions",
    endpointProfileId: input.modelProfile.endpointProfileId,
    requestTimeoutPolicyId: input.timeoutPolicyId,
    statusClass: transport.statusClass,
    reasonCode:
      transport.statusClass === "success" && !output.ok
        ? parseCategoryToReason(output.category)
        : transport.reasonCode,
    requestSent: transport.requestSent,
    responseStarted: transport.responseStarted,
    responseCompleted: transport.responseCompleted,
    retryCount,
    fallbackCount: 0,
    reasoningObserved: output.reasoningObserved,
    finalContentPresent: typeof output.finalContent === "string" && output.finalContent.length > 0,
    finalContentBytes: output.finalContentBytes,
    ...(output.finishReason ? { finishReason: output.finishReason } : {}),
    contentType,
    jsonDecoded:
      transport.responseStarted && isJsonContentType(contentType)
        ? transport.responseCompleted
        : "not_available",
    toolProposalObserved: output.toolProposalObserved,
    promptExposed: false,
    credentialExposed: false,
    responseBodyLogged: false,
    directActionAttempted: false,
  };
}

function normalizeRuntimeTransportRequest(
  input: CloudReasoningRuntimeRequest,
): CloudReasoningTransportRequest {
  return CloudReasoningTransportRequestSchema.parse({
    ...input.transportRequest,
    timeoutMs: input.transportRequest.timeoutMs,
    bodyJson: {
      ...input.transportRequest.bodyJson,
      stream: input.stream,
    },
  });
}

function emptyParseResult(
  reasonCode: CloudReasoningTransportReasonCode,
): OpenAiChatCompletionsParseResult {
  return invalidParse(parseReasonToOutputCategory(reasonCode));
}

function invalidParse(
  category: OpenAiChatCompletionsParseResult["category"],
  partial: Partial<Omit<OpenAiChatCompletionsParseResult, "ok" | "category" | "finalContentBytes">> = {},
): OpenAiChatCompletionsParseResult {
  return {
    ok: false,
    finalContentBytes: 0,
    reasoningObserved: partial.reasoningObserved ?? false,
    ...(partial.finishReason ? { finishReason: partial.finishReason } : {}),
    ...(partial.usage ? { usage: partial.usage } : {}),
    toolProposalObserved: partial.toolProposalObserved ?? false,
    category,
  };
}

function parseUsage(
  usage: unknown,
): OpenAiChatCompletionsParseResult["usage"] | undefined {
  if (!isRecord(usage)) {
    return undefined;
  }
  const promptTokens = safeTokenCount(usage.prompt_tokens);
  const completionTokens = safeTokenCount(usage.completion_tokens);
  const totalTokens = safeTokenCount(usage.total_tokens);
  const completionDetails = isRecord(usage.completion_tokens_details)
    ? usage.completion_tokens_details
    : {};
  const reasoningTokens = safeTokenCount(completionDetails.reasoning_tokens);
  return {
    ...(promptTokens !== undefined ? { promptTokens } : {}),
    ...(completionTokens !== undefined ? { completionTokens } : {}),
    ...(totalTokens !== undefined ? { totalTokens } : {}),
    ...(reasoningTokens !== undefined ? { reasoningTokens } : {}),
  };
}

function safeTokenCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
}

function boundFinalContent(
  content: string,
  maxChars: number,
): { readonly ok: true } | { readonly ok: false } {
  return content.length <= maxChars &&
    TEXT_ENCODER.encode(content).byteLength <= maxChars * 4
    ? { ok: true }
    : { ok: false };
}

function parseSseEvents(text: string): Array<{ readonly dataLines: string[] }> {
  const events: Array<{ dataLines: string[] }> = [];
  let dataLines: string[] = [];
  for (const rawLine of text.replace(/\r\n/gu, "\n").split("\n")) {
    const line = rawLine.trimEnd();
    if (line.length === 0) {
      if (dataLines.length > 0) {
        events.push({ dataLines });
        dataLines = [];
      }
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length > 0) {
    events.push({ dataLines });
  }
  return events;
}

function sameModelProfile(
  left: CloudReasoningModelCapabilityProfile,
  right: CloudReasoningModelCapabilityProfile,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function runtimeRequestBodyMatchesProfile(
  body: Readonly<Record<string, unknown>>,
  profile: CloudReasoningModelCapabilityProfile,
  stream: boolean,
  toolsEnabled: boolean,
): boolean {
  if (body.model !== profile.modelId || body.stream !== stream) {
    return false;
  }
  if (
    (!profile.supportsTools || !toolsEnabled) &&
    (Object.prototype.hasOwnProperty.call(body, "tools") ||
      Object.prototype.hasOwnProperty.call(body, "tool_choice") ||
      Object.prototype.hasOwnProperty.call(body, "function_call"))
  ) {
    return false;
  }
  const maxTokens = body.max_tokens;
  if (
    typeof maxTokens !== "number" ||
    !Number.isInteger(maxTokens) ||
    maxTokens <= 0 ||
    maxTokens > profile.maxOutputTokens
  ) {
    return false;
  }
  const thinking = isRecord(body.thinking) ? body.thinking : undefined;
  const thinkingType =
    thinking && typeof thinking.type === "string" ? thinking.type : undefined;
  if (containsJsonObjectKey(body, "reasoning_content")) {
    return false;
  }
  const reasoningEffort = body.reasoning_effort;
  if (reasoningEffort !== undefined) {
    if (
      !profile.supportsReasoningEffort ||
      thinkingType !== "enabled" ||
      (reasoningEffort !== "low" &&
        reasoningEffort !== "high" &&
        reasoningEffort !== "max") ||
      (profile.allowedReasoningEffort !== undefined &&
        !profile.allowedReasoningEffort.includes(reasoningEffort))
    ) {
      return false;
    }
  }
  if (profile.thinkingPolicy === "mandatory") {
    return thinkingType === "enabled";
  }
  if (profile.thinkingPolicy === "optional") {
    return (
      thinkingType === undefined ||
      thinkingType === "enabled" ||
      thinkingType === "disabled"
    );
  }
  return thinkingType === undefined;
}

function containsJsonObjectKey(value: unknown, key: string): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => containsJsonObjectKey(item, key));
  }
  if (!isRecord(value)) {
    return false;
  }
  return (
    Object.prototype.hasOwnProperty.call(value, key) ||
    Object.values(value).some((item) => containsJsonObjectKey(item, key))
  );
}

function finishReasonToFailureCategory(
  finishReason: string | undefined,
): OpenAiChatCompletionsParseResult["category"] | undefined {
  switch (finishReason) {
    case "content_filter":
      return "provider_content_filtered";
    case "tool_calls":
      return "untrusted_tool_proposal_blocked";
    case "insufficient_system_resource":
      return "provider_capacity_unavailable";
    default:
      return undefined;
  }
}

function parseReasonToOutputCategory(
  reasonCode: CloudReasoningTransportReasonCode,
): OpenAiChatCompletionsParseResult["category"] {
  if (reasonCode === "incomplete_stream") {
    return "incomplete_stream";
  }
  if (reasonCode === "response_too_large") {
    return "response_too_large";
  }
  if (reasonCode === "malformed_stream") {
    return "malformed_stream";
  }
  if (reasonCode === "untrusted_tool_proposal_blocked") {
    return "untrusted_tool_proposal_blocked";
  }
  if (reasonCode === "provider_content_filtered") {
    return "provider_content_filtered";
  }
  if (reasonCode === "provider_capacity_unavailable") {
    return "provider_capacity_unavailable";
  }
  if (reasonCode === "output_budget_exhausted_before_final") {
    return "output_budget_exhausted_before_final";
  }
  if (reasonCode === "no_final_answer") {
    return "no_final_answer";
  }
  return "invalid_provider_output";
}

function parseCategoryToReason(
  category: OpenAiChatCompletionsParseResult["category"],
): CloudReasoningTransportReasonCode {
  return category === "completed" ? "completed" : category;
}

function isRetryableBeforeResponse(
  reasonCode: CloudReasoningTransportReasonCode,
): boolean {
  return (
    reasonCode === "dns_resolution_failed" ||
    reasonCode === "connection_reset" ||
    reasonCode === "network_unavailable" ||
    reasonCode === "network_failure_unclassified" ||
    reasonCode === "provider_server_error" ||
    reasonCode === "rate_limited"
  );
}

function healthKey(profile: CloudReasoningModelCapabilityProfile): string {
  return `${profile.providerId}:${profile.deploymentId}:${profile.modelId}`;
}

function isStreamingRequest(request: CloudReasoningTransportRequest): boolean {
  return (
    isRecord(request.bodyJson) &&
    (request.bodyJson as Record<string, unknown>).stream === true
  );
}

function isEventStreamContentType(value: string): boolean {
  return /^text\/event-stream(?:\s*;.*)?$/iu.test(value.trim());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function effectiveTimeoutPolicy(
  policy: CloudReasoningTimeoutPolicy | undefined,
  fallbackTimeoutMs: number,
): {
  readonly granular: boolean;
  readonly policy: CloudReasoningTimeoutPolicy;
} {
  if (policy) {
    return {
      granular: true,
      policy: CloudReasoningTimeoutPolicySchema.parse(policy),
    };
  }
  return {
    granular: false,
    policy: CloudReasoningTimeoutPolicySchema.parse({
      policyId: "legacy-single-timeout",
      connectOrHeadersTimeoutMs: fallbackTimeoutMs,
      firstEventTimeoutMs: fallbackTimeoutMs,
      streamIdleTimeoutMs: fallbackTimeoutMs,
      overallTimeoutMs: fallbackTimeoutMs,
    }),
  };
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
  events: {
    readonly onChunk?: () => void;
    readonly onComplete?: () => void;
  } = {},
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
    events.onChunk?.();
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
    events.onComplete?.();
    return { ok: true, text: decodeChunks(chunks, total) };
  }

  if (isAsyncIterable(response.body)) {
    for await (const chunk of response.body) {
      if (!append(chunk)) {
        await cancelResponseBody(response.body);
        return { ok: false };
      }
    }
    events.onComplete?.();
    return { ok: true, text: decodeChunks(chunks, total) };
  }

  if (response.text) {
    const text = await response.text();
    events.onChunk?.();
    if (TEXT_ENCODER.encode(text).byteLength > maxBytes) {
      controller.abort();
      return { ok: false };
    }
    events.onComplete?.();
    return { ok: true, text };
  }

  events.onComplete?.();
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
