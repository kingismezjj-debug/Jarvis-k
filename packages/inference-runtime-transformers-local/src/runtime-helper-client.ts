import type {
  EmbeddingGenerationResult
} from "@jarvis-k/contracts";
import {
  createRuntimeHelperEmbedRequest,
  createRuntimeHelperGenerateRequest,
  createRuntimeHelperHealthRequest,
  createRuntimeHelperLoadRequest,
  createRuntimeHelperSanitizedError,
  createRuntimeHelperShutdownRequest,
  createRuntimeHelperTimeoutPolicy,
  mapRuntimeHelperError,
  parseRuntimeHelperResponse,
  type RuntimeHelperEmbedRequestInput,
  type RuntimeHelperErrorCode,
  type RuntimeHelperGenerateRequestInput,
  type RuntimeHelperGenerateResponse,
  type RuntimeHelperHealth,
  type RuntimeHelperLoadRequestInput,
  type RuntimeHelperLoadResponse,
  type RuntimeHelperOperation,
  type RuntimeHelperRequest,
  type RuntimeHelperResponse,
  type RuntimeHelperSanitizedError,
  type RuntimeHelperShutdownRequestInput,
  type RuntimeHelperShutdownResponse,
  type RuntimeHelperTimeoutPolicy
} from "./runtime-helper-protocol";

export interface RuntimeHelperTransport {
  readonly connected: boolean;
  send(
    request: RuntimeHelperRequest,
    callback: (error: Error | null) => void
  ): void;
  onMessage(listener: (message: unknown) => void): () => void;
  onExit(listener: () => void): () => void;
  close(): void;
}

export interface RuntimeHelperClientOptions {
  transport: RuntimeHelperTransport;
  timeoutPolicy?: RuntimeHelperTimeoutPolicy;
}

export class RuntimeHelperClientError extends Error {
  public readonly code: RuntimeHelperErrorCode;
  public readonly retryable: boolean;

  public constructor(error: RuntimeHelperSanitizedError) {
    super(error.message);
    this.name = "RuntimeHelperClientError";
    this.code = error.code;
    this.retryable = error.retryable;
  }
}

interface PendingRequest<TPayload> {
  request: RuntimeHelperRequest;
  resolve: (payload: TPayload) => void;
  reject: (error: RuntimeHelperClientError) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class RuntimeHelperClient {
  private readonly pending = new Map<
    string,
    PendingRequest<unknown>
  >();
  private readonly timeoutPolicy: RuntimeHelperTimeoutPolicy;
  private readonly unsubscribeMessage: () => void;
  private readonly unsubscribeExit: () => void;
  private stopped = false;

  public constructor(
    private readonly options: RuntimeHelperClientOptions
  ) {
    this.timeoutPolicy =
      options.timeoutPolicy ?? createRuntimeHelperTimeoutPolicy();
    this.unsubscribeMessage = options.transport.onMessage((message) => {
      this.handleMessage(message);
    });
    this.unsubscribeExit = options.transport.onExit(() => {
      this.handleExit();
    });
  }

  public health(): Promise<RuntimeHelperHealth> {
    return this.send<RuntimeHelperHealth>(
      createRuntimeHelperHealthRequest(),
      this.timeoutPolicy.startupTimeoutMs
    );
  }

  public load(
    input: RuntimeHelperLoadRequestInput
  ): Promise<RuntimeHelperLoadResponse["payload"]> {
    return this.send<RuntimeHelperLoadResponse["payload"]>(
      createRuntimeHelperLoadRequest(input),
      this.timeoutPolicy.requestTimeoutMs
    );
  }

  public embed(
    input: RuntimeHelperEmbedRequestInput
  ): Promise<EmbeddingGenerationResult> {
    return this.send<EmbeddingGenerationResult>(
      createRuntimeHelperEmbedRequest(input),
      this.timeoutPolicy.requestTimeoutMs
    );
  }

  public generate(
    input: RuntimeHelperGenerateRequestInput
  ): Promise<RuntimeHelperGenerateResponse["payload"]> {
    return this.send<RuntimeHelperGenerateResponse["payload"]>(
      createRuntimeHelperGenerateRequest(input),
      this.timeoutPolicy.requestTimeoutMs
    );
  }

  public async shutdown(
    input: RuntimeHelperShutdownRequestInput
  ): Promise<RuntimeHelperShutdownResponse["payload"]> {
    const result = await this.send<RuntimeHelperShutdownResponse["payload"]>(
      createRuntimeHelperShutdownRequest(input),
      this.timeoutPolicy.shutdownTimeoutMs
    );
    this.dispose();
    return result;
  }

  public dispose(): void {
    if (this.stopped) {
      return;
    }
    this.stopped = true;
    this.unsubscribeMessage();
    this.unsubscribeExit();
    this.rejectAll(createRuntimeHelperSanitizedError("HELPER_UNAVAILABLE"));
    this.options.transport.close();
  }

  private send<TPayload>(
    request: RuntimeHelperRequest,
    timeoutMs: number
  ): Promise<TPayload> {
    if (this.stopped || !this.options.transport.connected) {
      return Promise.reject(
        new RuntimeHelperClientError(
          createRuntimeHelperSanitizedError("HELPER_UNAVAILABLE")
        )
      );
    }

    return new Promise<TPayload>((resolve, reject) => {
      const pending: PendingRequest<TPayload> = {
        request,
        resolve,
        reject,
        timer: setTimeout(() => {
          this.pending.delete(request.requestId);
          reject(
            new RuntimeHelperClientError(
              createRuntimeHelperSanitizedError(
                timeoutCodeForOperation(request.operation)
              )
            )
          );
        }, timeoutMs)
      };
      this.pending.set(
        request.requestId,
        pending as PendingRequest<unknown>
      );

      try {
        this.options.transport.send(request, (error) => {
          if (!error) {
            return;
          }
          this.rejectPending(
            request.requestId,
            mapRuntimeHelperError(error, request.operation)
          );
        });
      } catch (error) {
        this.rejectPending(
          request.requestId,
          mapRuntimeHelperError(error, request.operation)
        );
      }
    });
  }

  private handleMessage(message: unknown): void {
    let response: RuntimeHelperResponse;
    try {
      response = parseRuntimeHelperResponse(message);
    } catch {
      this.rejectAll(
        createRuntimeHelperSanitizedError("HELPER_PROTOCOL_INVALID")
      );
      return;
    }

    const pending = this.pending.get(response.requestId);
    if (!pending) {
      return;
    }

    if (
      pending.request.correlationId !== response.correlationId ||
      pending.request.operation !== response.operation
    ) {
      this.rejectPending(
        response.requestId,
        createRuntimeHelperSanitizedError("HELPER_PROTOCOL_INVALID")
      );
      return;
    }

    if (!response.ok) {
      this.rejectPending(response.requestId, response.error);
      return;
    }

    clearTimeout(pending.timer);
    this.pending.delete(response.requestId);
    pending.resolve(response.payload);
  }

  private handleExit(): void {
    if (this.stopped) {
      return;
    }
    this.stopped = true;
    this.unsubscribeMessage();
    this.unsubscribeExit();
    this.rejectAll(
      createRuntimeHelperSanitizedError("HELPER_PROCESS_EXITED")
    );
  }

  private rejectPending(
    requestId: string,
    error: RuntimeHelperSanitizedError
  ): void {
    const pending = this.pending.get(requestId);
    if (!pending) {
      return;
    }
    clearTimeout(pending.timer);
    this.pending.delete(requestId);
    pending.reject(new RuntimeHelperClientError(error));
  }

  private rejectAll(error: RuntimeHelperSanitizedError): void {
    for (const requestId of this.pending.keys()) {
      this.rejectPending(requestId, error);
    }
  }
}

function timeoutCodeForOperation(
  operation: RuntimeHelperOperation
): RuntimeHelperErrorCode {
  if (operation === "health") {
    return "HELPER_STARTUP_TIMEOUT";
  }
  if (operation === "shutdown") {
    return "HELPER_SHUTDOWN_TIMEOUT";
  }
  return "HELPER_REQUEST_TIMEOUT";
}
