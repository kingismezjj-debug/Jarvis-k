import type {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CloudReasoningProviderHealthProjection,
  CloudReasoningTransportReasonCode,
  CloudReasoningTransportStatusClass,
} from "@jarvis-k/contracts";
import type {
  CloudReasoningRuntime,
  CloudReasoningRuntimeCredential,
  CloudReasoningRuntimeRequest,
  CloudReasoningRuntimeResult,
} from "./bounded-cloud-reasoning-transport";

export type CloudModelProtocolAdapterEventType =
  | "request_blocked"
  | "request_sent"
  | "response_started"
  | "response_completed"
  | "response_failed"
  | "adapter_disposed";

export interface CloudModelProtocolAdapterEvent {
  readonly type: CloudModelProtocolAdapterEventType;
  readonly providerId: string;
  readonly deploymentId: string;
  readonly modelId: string;
  readonly statusClass: CloudReasoningTransportStatusClass;
  readonly reasonCode: CloudReasoningTransportReasonCode;
  readonly requestSent: boolean;
  readonly responseStarted: boolean;
  readonly responseCompleted: boolean;
  readonly retryCount: number;
  readonly fallbackCount: 0;
  readonly toolProposalObserved: boolean;
  readonly reasoningObserved: boolean;
  readonly promptExposed: false;
  readonly credentialExposed: false;
  readonly responseBodyLogged: false;
  readonly directActionAttempted: false;
}

export interface CloudModelProtocolCredentialBroker {
  withCredential<T>(
    bindingId: string,
    useCredential: (credential: CloudReasoningRuntimeCredential) => Promise<T>,
  ): Promise<T>;
}

export interface CloudModelProtocolAdapterCallInput {
  readonly runtimeRequest: CloudReasoningRuntimeRequest;
  readonly signal?: AbortSignal;
}

export interface CloudModelProtocolAdapterCallResult {
  readonly protocolResult: CloudModelProtocolAdapterProtocolResult;
  readonly events: readonly CloudModelProtocolAdapterEvent[];
  readonly credentialExposed: false;
  readonly promptExposed: false;
  readonly responseBodyLogged: false;
  readonly directActionAttempted: false;
}

export interface CloudModelProtocolAdapter {
  call(
    input: CloudModelProtocolAdapterCallInput,
  ): Promise<CloudModelProtocolAdapterCallResult>;
  dispose(): void;
}

export interface CloudModelProtocolAdapterProtocolResult {
  readonly transport: {
    readonly requestId: string;
    readonly providerId: string;
    readonly deploymentId: string;
    readonly operation: string;
    readonly statusClass: CloudReasoningTransportStatusClass;
    readonly reasonCode: CloudReasoningTransportReasonCode;
    readonly httpStatus?: number;
    readonly latencyMs: number;
    readonly responseByteCount?: number;
    readonly requestSent: boolean;
    readonly responseStarted: boolean;
    readonly responseCompleted: boolean;
    readonly cancelled: boolean;
    readonly timeout: boolean;
    readonly automaticRetry: false;
    readonly automaticFallback: false;
    readonly credentialExposed: false;
    readonly requestBodyExposed: false;
    readonly responseBodyLogged: false;
  };
  readonly output: {
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
    readonly category: CloudReasoningRuntimeResult["output"]["category"];
  };
  readonly health: CloudReasoningProviderHealthProjection;
  readonly diagnostics: CloudReasoningRuntimeResult["diagnostics"];
}

export class JarvisBoundedCloudModelProtocolAdapter
  implements CloudModelProtocolAdapter
{
  private disposed = false;

  public constructor(
    private readonly runtime: CloudReasoningRuntime,
    private readonly credentialBroker: CloudModelProtocolCredentialBroker,
  ) {}

  public async call(
    input: CloudModelProtocolAdapterCallInput,
  ): Promise<CloudModelProtocolAdapterCallResult> {
    const request = input.runtimeRequest;
    if (this.disposed) {
      return this.result(cancelledAfterDispose(request));
    }

    const runtimeResult = await this.credentialBroker.withCredential(
      request.transportRequest.credentialBindingId,
      (credential) =>
        this.runtime.runOpenAiChatCompletions(request, {
          credential,
          ...(input.signal ? { signal: input.signal } : {}),
        }),
    );
    return this.result(runtimeResult);
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.runtime.dispose();
  }

  private result(
    runtimeResult: CloudReasoningRuntimeResult,
  ): CloudModelProtocolAdapterCallResult {
    return {
      protocolResult: sanitizeRuntimeResult(runtimeResult),
      events: [eventFromRuntime(runtimeResult)],
      credentialExposed: false,
      promptExposed: false,
      responseBodyLogged: false,
      directActionAttempted: false,
    };
  }
}

function cancelledAfterDispose(
  request: CloudReasoningRuntimeRequest,
): CloudReasoningRuntimeResult {
  const now = new Date().toISOString();
  const transport = {
    schemaVersion: 1 as typeof ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: request.transportRequest.requestId,
    providerId: request.modelProfile.providerId,
    deploymentId: request.modelProfile.deploymentId,
    operation: request.transportRequest.operation,
    statusClass: "cancelled" as const,
    reasonCode: "cancelled" as const,
    safeHeaders: {},
    latencyMs: 0,
    requestSent: false,
    responseStarted: false,
    responseCompleted: false,
    cancelled: true,
    timeout: false,
    automaticRetry: false,
    automaticFallback: false,
    credentialExposed: false,
    requestBodyExposed: false,
    responseBodyLogged: false,
  } as const;
  const output = {
    ok: false,
    finalContentBytes: 0,
    reasoningObserved: false,
    toolProposalObserved: false,
    category: "invalid_provider_output" as const,
  };
  return {
    transport,
    output,
    health: {
      schemaVersion: 1 as typeof ADVANCED_BRAIN_SCHEMA_VERSION,
      providerId: request.modelProfile.providerId,
      deploymentId: request.modelProfile.deploymentId,
      modelId: request.modelProfile.modelId,
      state: "unavailable",
      lastAttemptAt: now,
      sanitizedFailureCategory: "cancelled",
      consecutiveFailureCount: 1,
      source: "runtime_observation",
    },
    diagnostics: {
      schemaVersion: 1 as typeof ADVANCED_BRAIN_SCHEMA_VERSION,
      providerId: request.modelProfile.providerId,
      deploymentId: request.modelProfile.deploymentId,
      modelId: request.modelProfile.modelId,
      protocolFamily: "openai_chat_completions",
      endpointProfileId: request.modelProfile.endpointProfileId,
      requestTimeoutPolicyId: request.timeoutPolicyId,
      statusClass: "cancelled",
      reasonCode: "cancelled",
      requestSent: false,
      responseStarted: false,
      responseCompleted: false,
      retryCount: 0,
      fallbackCount: 0,
      reasoningObserved: false,
      finalContentPresent: false,
      finalContentBytes: 0,
      contentType: "not_available",
      jsonDecoded: "not_available",
      toolProposalObserved: false,
      promptExposed: false,
      credentialExposed: false,
      responseBodyLogged: false,
      directActionAttempted: false,
    },
  };
}

function sanitizeRuntimeResult(
  runtimeResult: CloudReasoningRuntimeResult,
): CloudModelProtocolAdapterProtocolResult {
  const transport = runtimeResult.transport;
  const output = runtimeResult.output;
  return {
    transport: {
      requestId: transport.requestId,
      providerId: transport.providerId,
      deploymentId: transport.deploymentId,
      operation: transport.operation,
      statusClass: transport.statusClass,
      reasonCode: transport.reasonCode,
      ...(transport.httpStatus === undefined
        ? {}
        : { httpStatus: transport.httpStatus }),
      latencyMs: transport.latencyMs,
      ...(transport.responseByteCount === undefined
        ? {}
        : { responseByteCount: transport.responseByteCount }),
      requestSent: transport.requestSent,
      responseStarted: transport.responseStarted,
      responseCompleted: transport.responseCompleted,
      cancelled: transport.cancelled,
      timeout: transport.timeout,
      automaticRetry: false,
      automaticFallback: false,
      credentialExposed: false,
      requestBodyExposed: false,
      responseBodyLogged: false,
    },
    output: {
      ok: output.ok,
      ...(output.finalContent === undefined
        ? {}
        : { finalContent: output.finalContent }),
      finalContentBytes: output.finalContentBytes,
      reasoningObserved: output.reasoningObserved,
      ...(output.finishReason === undefined
        ? {}
        : { finishReason: output.finishReason }),
      ...(output.usage === undefined ? {} : { usage: output.usage }),
      toolProposalObserved: output.toolProposalObserved,
      category: output.category,
    },
    health: runtimeResult.health,
    diagnostics: runtimeResult.diagnostics,
  };
}

function eventFromRuntime(
  runtimeResult: CloudReasoningRuntimeResult,
): CloudModelProtocolAdapterEvent {
  const diagnostics = runtimeResult.diagnostics;
  return {
    type: eventTypeFor(runtimeResult),
    providerId: diagnostics.providerId,
    deploymentId: diagnostics.deploymentId,
    modelId: diagnostics.modelId,
    statusClass: diagnostics.statusClass,
    reasonCode: diagnostics.reasonCode,
    requestSent: diagnostics.requestSent,
    responseStarted: diagnostics.responseStarted,
    responseCompleted: diagnostics.responseCompleted,
    retryCount: diagnostics.retryCount,
    fallbackCount: 0,
    toolProposalObserved: diagnostics.toolProposalObserved,
    reasoningObserved: diagnostics.reasoningObserved,
    promptExposed: false,
    credentialExposed: false,
    responseBodyLogged: false,
    directActionAttempted: false,
  };
}

function eventTypeFor(
  runtimeResult: CloudReasoningRuntimeResult,
): CloudModelProtocolAdapterEventType {
  const transport = runtimeResult.transport;
  if (!transport.requestSent) {
    return "request_blocked";
  }
  if (transport.responseCompleted) {
    return transport.statusClass === "success"
      ? "response_completed"
      : "response_failed";
  }
  if (transport.responseStarted) {
    return "response_started";
  }
  return "request_sent";
}
