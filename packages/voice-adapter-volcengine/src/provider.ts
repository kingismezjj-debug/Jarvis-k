import crypto from "node:crypto";
import type {
  AsrProviderCallbacks,
  AsrProviderPort,
  AsrSessionPort
} from "@jarvis-k/voice";
import {
  VOLCENGINE_BIGMODEL_ASR_URL,
  VOLCENGINE_DEFAULT_RESOURCE_ID,
  VOLCENGINE_RESOURCE_FALLBACKS,
  createVolcengineAudioFrame,
  createVolcengineError,
  createVolcengineFullClientRequest,
  extractVolcengineTranscripts,
  parseVolcengineResponse
} from "./protocol";

export interface VolcengineAsrCredentials {
  apiKey: string;
  resourceId?: string;
}

export interface VolcengineAsrProviderOptions {
  credentials: VolcengineAsrCredentials;
  socketFactory: VolcengineSocketFactory;
  uid?: string;
  maxPendingFrames?: number;
}

export interface VolcengineSocketPort {
  send(data: Uint8Array): void;
  close(): void;
}

export interface VolcengineSocketHandlers {
  onOpen(): void;
  onMessage(data: unknown): void;
  onError(error: Error): void;
  onClose(info?: VolcengineSocketCloseInfo): void;
}

export interface VolcengineSocketCloseInfo {
  code?: number;
  reason?: string;
}

export interface VolcengineSocketFactory {
  create(
    url: string,
    headers: Record<string, string>,
    handlers: VolcengineSocketHandlers
  ): VolcengineSocketPort;
}

const DEFAULT_MAX_PENDING_FRAMES = 96;

export class VolcengineAsrProvider implements AsrProviderPort {
  public constructor(
    private readonly options: VolcengineAsrProviderOptions
  ) {}

  public async connect(
    callbacks: AsrProviderCallbacks
  ): Promise<AsrSessionPort> {
    const session = new VolcengineAsrSession({
      callbacks,
      credentials: this.options.credentials,
      maxPendingFrames:
        this.options.maxPendingFrames ?? DEFAULT_MAX_PENDING_FRAMES,
      socketFactory: this.options.socketFactory,
      uid: this.options.uid ?? "jarvis-k"
    });
    await session.connect();
    return session;
  }
}

interface VolcengineAsrSessionOptions {
  callbacks: AsrProviderCallbacks;
  credentials: VolcengineAsrCredentials;
  maxPendingFrames: number;
  socketFactory: VolcengineSocketFactory;
  uid: string;
}

type ReadyWaiter = {
  resolve(): void;
  reject(error: Error): void;
};

class VolcengineAsrSession implements AsrSessionPort {
  private readonly sessionId = crypto.randomUUID();
  private readonly pendingFrames: Uint8Array[] = [];
  private socket: VolcengineSocketPort | undefined;
  private resourceId: string;
  private ready = false;
  private closed = false;
  private readyWaiters: ReadyWaiter[] = [];

  public constructor(private readonly options: VolcengineAsrSessionOptions) {
    this.resourceId =
      options.credentials.resourceId?.trim() ||
      VOLCENGINE_DEFAULT_RESOURCE_ID;
  }

  public async connect(): Promise<void> {
    this.openSocket(this.resourceId);
    await this.waitUntilReady();
  }

  public async sendAudio(frame: { pcm: Uint8Array }): Promise<void> {
    if (this.closed) {
      return;
    }
    const payload = createVolcengineAudioFrame(frame.pcm);
    if (!this.ready || !this.socket) {
      this.enqueue(payload);
      return;
    }
    this.socket.send(payload);
  }

  public async finalizeSegment(): Promise<void> {
    if (this.closed) {
      return;
    }
    await this.waitUntilReady();
    this.socket?.send(createVolcengineAudioFrame(new Uint8Array(), true));
  }

  public async cancelSegment(): Promise<void> {
    this.pendingFrames.length = 0;
  }

  public async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.pendingFrames.length = 0;
    this.readyWaiters.splice(0).forEach((waiter) =>
      waiter.reject(new Error("Volcengine ASR session closed."))
    );
    this.socket?.close();
    this.socket = undefined;
    this.ready = false;
  }

  private openSocket(resourceId: string): void {
    const apiKey = this.options.credentials.apiKey.trim();
    if (!apiKey) {
      throw new Error("Volcengine ASR API key is required.");
    }
    this.resourceId = resourceId;
    this.ready = false;
    let socket: VolcengineSocketPort;
    socket = this.options.socketFactory.create(
      VOLCENGINE_BIGMODEL_ASR_URL,
      {
        "X-Api-Key": apiKey,
        "X-Api-Resource-Id": resourceId,
        "X-Api-Request-Id": this.sessionId,
        "X-Api-Connect-Id": this.sessionId,
        "X-Api-Sequence": "-1"
      },
      {
        onOpen: () => this.handleOpen(socket),
        onMessage: (data) => this.handleMessage(socket, data),
        onError: (error) => this.handleError(socket, error),
        onClose: (info) => this.handleClose(socket, info)
      }
    );
    this.socket = socket;
  }

  private handleOpen(socket: VolcengineSocketPort): void {
    if (this.closed || socket !== this.socket) {
      return;
    }
    socket.send(createVolcengineFullClientRequest(this.options.uid));
    this.ready = true;
    for (const frame of this.pendingFrames.splice(0)) {
      socket.send(frame);
    }
    this.resolveReadyWaiters();
  }

  private handleMessage(socket: VolcengineSocketPort, data: unknown): void {
    if (this.closed || socket !== this.socket) {
      return;
    }
    try {
      if (typeof data === "string") {
        this.fail(
          "VOLCENGINE_ASR_TEXT_MESSAGE",
          `Volcengine ASR returned unexpected text: ${data}`,
          false
        );
        return;
      }
      const parsed = parseVolcengineResponse(toBytes(data));
      if (!parsed) {
        return;
      }
      if (parsed.kind === "error") {
        this.options.callbacks.onError(
          createVolcengineError(
            "VOLCENGINE_ASR_PROVIDER_ERROR",
            `Volcengine ASR provider error ${parsed.providerCode}: ${parsed.message}`,
            false,
            {
              providerCode: parsed.providerCode,
              providerMessage: parsed.message,
              resourceId: this.resourceId
            }
          )
        );
        this.rejectReadyWaiters(new Error(parsed.message));
        return;
      }
      for (const transcript of extractVolcengineTranscripts(
        parsed.body,
        parsed.isLast,
        this.sessionId
      )) {
        this.options.callbacks.onTranscript(transcript);
      }
    } catch (error) {
      this.fail(
        "VOLCENGINE_ASR_PARSE_FAILED",
        error instanceof Error
          ? `Volcengine ASR response parse failed: ${error.message}`
          : "Volcengine ASR response parse failed.",
        true
      );
    }
  }

  private handleError(socket: VolcengineSocketPort, error: Error): void {
    if (this.closed || socket !== this.socket) {
      return;
    }
    const fallback = VOLCENGINE_RESOURCE_FALLBACKS.get(this.resourceId);
    if (fallback && /Unexpected server response:\s*403/i.test(error.message)) {
      socket.close();
      this.openSocket(fallback);
      return;
    }
    this.fail(
      "VOLCENGINE_ASR_SOCKET_ERROR",
      `Volcengine ASR socket error: ${error.message}`,
      true,
      {
        resourceId: this.resourceId
      }
    );
  }

  private handleClose(
    socket: VolcengineSocketPort,
    info?: VolcengineSocketCloseInfo
  ): void {
    if (this.closed || socket !== this.socket) {
      return;
    }
    this.ready = false;
    this.pendingFrames.length = 0;
    this.rejectReadyWaiters(
      new Error(
        `Volcengine ASR socket closed${
          typeof info?.code === "number" ? ` ${info.code}` : ""
        }: ${info?.reason || "no reason"}`
      )
    );
    this.options.callbacks.onClose();
  }

  private enqueue(frame: Uint8Array): void {
    if (this.pendingFrames.length >= this.options.maxPendingFrames) {
      this.pendingFrames.shift();
    }
    this.pendingFrames.push(frame.slice());
  }

  private waitUntilReady(): Promise<void> {
    if (this.ready) {
      return Promise.resolve();
    }
    if (this.closed) {
      return Promise.reject(new Error("Volcengine ASR session is closed."));
    }
    return new Promise((resolve, reject) => {
      this.readyWaiters.push({ resolve, reject });
    });
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

  private fail(
    code: string,
    message: string,
    retryable: boolean,
    details?: Record<string, unknown>
  ): void {
    this.options.callbacks.onError(
      createVolcengineError(code, message, retryable, details)
    );
    this.rejectReadyWaiters(new Error(message));
  }
}

function toBytes(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (Array.isArray(data)) {
    return new Uint8Array(Buffer.concat(data.map((item) => Buffer.from(item))));
  }
  throw new Error("Unsupported Volcengine ASR frame type.");
}
