import type {
  AsrProviderCallbacks
} from "@jarvis-k/voice";
import { parseXunfeiResult } from "./parser";

export interface XunfeiSocketPort {
  send(data: string | Uint8Array): void;
  close(): void;
}

export interface XunfeiSocketHandlers {
  onMessage(data: unknown): void;
  onError(error: Error): void;
  onClose(info?: XunfeiSocketCloseInfo): void;
}

export interface XunfeiSocketFactory {
  create(url: string, handlers: XunfeiSocketHandlers): XunfeiSocketPort;
}

export interface XunfeiSocketCloseInfo {
  code?: number;
  reason?: string;
}

export interface XunfeiConnectionScheduler {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface XunfeiConnectionDiagnostic {
  code: "CONNECT_LIMIT_RETRY" | "SOCKET_RECOVERY";
  attempt: number;
  delayMs: number;
}

export interface XunfeiRtasrConnectionOptions {
  createSignedUrl(): string;
  socketFactory: XunfeiSocketFactory;
  scheduler: XunfeiConnectionScheduler;
  callbacks: AsrProviderCallbacks;
  onReady?(): void;
  onDiagnostic?(diagnostic: XunfeiConnectionDiagnostic): void;
  maxBufferedFrames?: number;
  connectLimitRetryMs?: number;
  maxConnectLimitRetries?: number;
  unexpectedCloseRetryMs?: number;
  maxUnexpectedCloseRetries?: number;
}

export type XunfeiConnectionState =
  | "idle"
  | "connecting"
  | "ready"
  | "retry-wait"
  | "closed";

const DEFAULT_MAX_BUFFERED_FRAMES = 32;
const DEFAULT_CONNECT_LIMIT_RETRY_MS = 4_500;
const DEFAULT_MAX_CONNECT_LIMIT_RETRIES = 4;
const DEFAULT_UNEXPECTED_CLOSE_RETRY_MS = 250;
const DEFAULT_MAX_UNEXPECTED_CLOSE_RETRIES = 4;

export class XunfeiRtasrConnection {
  private readonly pendingAudio: Uint8Array[] = [];
  private socket: XunfeiSocketPort | undefined;
  private retryTimer: unknown;
  private state: XunfeiConnectionState = "idle";
  private connectLimitRetries = 0;
  private unexpectedCloseRetries = 0;
  private lastUnexpectedSocketFailure:
    | {
        kind: "close" | "error";
        message: string;
        code?: number;
      }
    | undefined;
  private readonly readyWaiters: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];

  public constructor(
    private readonly options: XunfeiRtasrConnectionOptions
  ) {
    if ((options.maxBufferedFrames ?? DEFAULT_MAX_BUFFERED_FRAMES) <= 0) {
      throw new RangeError("Xunfei audio buffer limit must be positive.");
    }
  }

  public connect(): boolean {
    if (
      this.state === "closed" ||
      this.state === "connecting" ||
      this.state === "ready" ||
      this.state === "retry-wait"
    ) {
      return false;
    }

    this.openSocket();
    return true;
  }

  public sendAudio(pcm: Uint8Array): void {
    if (this.state === "closed") {
      return;
    }
    if (this.state === "ready" && this.socket) {
      this.socket.send(pcm);
      return;
    }

    const maxBufferedFrames =
      this.options.maxBufferedFrames ?? DEFAULT_MAX_BUFFERED_FRAMES;
    if (this.pendingAudio.length >= maxBufferedFrames) {
      this.pendingAudio.shift();
    }
    this.pendingAudio.push(pcm.slice());
  }

  public waitUntilReady(): Promise<void> {
    if (this.state === "ready") {
      return Promise.resolve();
    }
    if (this.state === "closed") {
      return Promise.reject(
        new Error("Xunfei RTASR connection is closed.")
      );
    }
    return new Promise((resolve, reject) => {
      this.readyWaiters.push({ resolve, reject });
    });
  }

  public close(): boolean {
    if (this.state === "closed") {
      return false;
    }
    this.state = "closed";
    this.pendingAudio.length = 0;
    if (this.retryTimer !== undefined) {
      this.options.scheduler.clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    const socket = this.socket;
    this.socket = undefined;
    socket?.close();
    this.rejectReadyWaiters(
      new Error("Xunfei RTASR connection closed before readiness.")
    );
    return true;
  }

  public getState(): XunfeiConnectionState {
    return this.state;
  }

  public getBufferedFrameCount(): number {
    return this.pendingAudio.length;
  }

  private openSocket(): void {
    this.state = "connecting";
    const handlers: XunfeiSocketHandlers = {
      onMessage: (data) => this.handleMessage(socket, data),
      onError: (error) => this.handleSocketError(socket, error),
      onClose: (info) => this.handleSocketClose(socket, info)
    };
    const socket = this.options.socketFactory.create(
      this.options.createSignedUrl(),
      handlers
    );
    this.socket = socket;
  }

  private handleMessage(socket: XunfeiSocketPort, rawData: unknown): void {
    if (socket !== this.socket || this.state === "closed") {
      return;
    }
    const message = parseProviderMessage(rawData);
    if (!message) {
      return;
    }

    if (message.action === "started" && String(message.code) === "0") {
      this.state = "ready";
      this.connectLimitRetries = 0;
      this.unexpectedCloseRetries = 0;
      for (const frame of this.pendingAudio.splice(0)) {
        socket.send(frame);
      }
      this.resolveReadyWaiters();
      this.options.onReady?.();
      return;
    }

    if (message.action === "error") {
      if (String(message.code) === "10800") {
        this.scheduleConnectLimitRetry(socket);
        return;
      }
      this.options.callbacks.onError({
        code: "XUNFEI_PROVIDER_ERROR",
        message: createProviderErrorMessage(message),
        retryable: false,
        details: createProviderErrorDetails(message)
      });
      return;
    }

    if (message.action === "result") {
      const transcript = parseXunfeiResult(message.data);
      if (transcript) {
        this.options.callbacks.onTranscript(transcript);
      }
    }
  }

  private scheduleConnectLimitRetry(socket: XunfeiSocketPort): void {
    const maxRetries =
      this.options.maxConnectLimitRetries ??
      DEFAULT_MAX_CONNECT_LIMIT_RETRIES;
    if (this.connectLimitRetries >= maxRetries) {
      this.options.callbacks.onError(connectLimitError(false));
      this.rejectReadyWaiters(
        new Error("Xunfei RTASR connection limit retries were exhausted.")
      );
      return;
    }

    this.connectLimitRetries += 1;
    const delayMs =
      this.options.connectLimitRetryMs ??
      DEFAULT_CONNECT_LIMIT_RETRY_MS;
    this.socket = undefined;
    this.state = "retry-wait";
    socket.close();
    this.options.onDiagnostic?.({
      code: "CONNECT_LIMIT_RETRY",
      attempt: this.connectLimitRetries,
      delayMs
    });
    this.retryTimer = this.options.scheduler.setTimeout(() => {
      this.retryTimer = undefined;
      if (this.state !== "closed") {
        this.openSocket();
      }
    }, delayMs);
  }

  private handleSocketError(
    socket: XunfeiSocketPort,
    error: Error
  ): void {
    if (socket !== this.socket || this.state === "closed") {
      return;
    }
    this.scheduleUnexpectedCloseRecovery(socket, true, {
      kind: "error",
      message: sanitizeProviderText(error.message)
    });
  }

  private handleSocketClose(
    socket: XunfeiSocketPort,
    info?: XunfeiSocketCloseInfo
  ): void {
    if (socket !== this.socket || this.state === "closed") {
      return;
    }
    this.scheduleUnexpectedCloseRecovery(socket, false, {
      kind: "close",
      message: sanitizeProviderText(info?.reason || "socket closed"),
      ...(typeof info?.code === "number" ? { code: info.code } : {})
    });
  }

  private scheduleUnexpectedCloseRecovery(
    socket: XunfeiSocketPort,
    closeSocket: boolean,
    failure: {
      kind: "close" | "error";
      message: string;
      code?: number;
    }
  ): void {
    const maxRetries =
      this.options.maxUnexpectedCloseRetries ??
      DEFAULT_MAX_UNEXPECTED_CLOSE_RETRIES;
    this.lastUnexpectedSocketFailure = failure;
    this.socket = undefined;
    if (closeSocket) {
      socket.close();
    }

    if (this.unexpectedCloseRetries >= maxRetries) {
      const exhausted = socketRecoveryExhaustedError(
        this.lastUnexpectedSocketFailure
      );
      this.state = "idle";
      this.rejectReadyWaiters(
        new Error(exhausted.message)
      );
      this.options.callbacks.onError(exhausted);
      this.options.callbacks.onClose();
      return;
    }

    this.unexpectedCloseRetries += 1;
    const delayMs =
      this.options.unexpectedCloseRetryMs ??
      DEFAULT_UNEXPECTED_CLOSE_RETRY_MS;
    this.state = "retry-wait";
    this.options.onDiagnostic?.({
      code: "SOCKET_RECOVERY",
      attempt: this.unexpectedCloseRetries,
      delayMs
    });
    this.retryTimer = this.options.scheduler.setTimeout(() => {
      this.retryTimer = undefined;
      if (this.state !== "closed") {
        this.openSocket();
      }
    }, delayMs);
  }

  private resolveReadyWaiters(): void {
    for (const waiter of this.readyWaiters.splice(0)) {
      waiter.resolve();
    }
  }

  private rejectReadyWaiters(error: Error): void {
    for (const waiter of this.readyWaiters.splice(0)) {
      waiter.reject(error);
    }
  }
}

function parseProviderMessage(
  rawData: unknown
): Record<string, unknown> | null {
  if (typeof rawData === "string") {
    try {
      const parsed: unknown = JSON.parse(rawData);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isRecord(rawData) ? rawData : null;
}

function connectLimitError(retryable: boolean) {
  return {
    code: "XUNFEI_CONNECT_LIMIT",
    message: "Xunfei RTASR connection limit persisted after retries.",
    retryable
  };
}

function socketRecoveryExhaustedError(
  failure:
    | {
        kind: "close" | "error";
        message: string;
        code?: number;
      }
    | undefined
) {
  const suffix = failure
    ? ` Last socket ${failure.kind}${
        typeof failure.code === "number" ? ` ${failure.code}` : ""
      }: ${failure.message}.`
    : "";
  return {
    code: "XUNFEI_SOCKET_RECOVERY_EXHAUSTED",
    message: `Xunfei RTASR socket recovery retries were exhausted.${suffix}`,
    retryable: false,
    ...(failure
      ? {
          details: {
            socketFailureKind: failure.kind,
            socketFailureMessage: failure.message,
            ...(typeof failure.code === "number"
              ? { socketCloseCode: failure.code }
              : {})
          }
        }
      : {})
  };
}

function createProviderErrorMessage(
  message: Record<string, unknown>
): string {
  const providerCode = String(message.code ?? "unknown");
  const providerMessage =
    firstString(message.desc, message.message, message.error, message.data) ??
    "Xunfei RTASR returned a provider error.";
  return `Xunfei RTASR provider error ${providerCode}: ${sanitizeProviderText(
    providerMessage
  )}`;
}

function createProviderErrorDetails(
  message: Record<string, unknown>
): Record<string, unknown> {
  const details: Record<string, unknown> = {
    providerCode: String(message.code ?? "unknown")
  };
  const action = firstString(message.action);
  const desc = firstString(message.desc, message.message, message.error);
  if (action) {
    details.providerAction = sanitizeProviderText(action);
  }
  if (desc) {
    details.providerMessage = sanitizeProviderText(desc);
  }
  return details;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function sanitizeProviderText(value: string): string {
  return value
    .replace(/(api[_-]?key|app[_-]?id|secret|token|authorization)=\S+/gi, "$1=[redacted]")
    .replace(/\b(sk|ak|asr|api)[_-][A-Za-z0-9_-]{12,}\b/g, "[redacted]")
    .slice(0, 512);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
