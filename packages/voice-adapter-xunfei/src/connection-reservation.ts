export interface XunfeiReservationScheduler {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface XunfeiConnectionReservationOptions<TConnection> {
  connect(): Promise<TConnection>;
  close(connection: TConnection): Promise<void>;
  scheduler: XunfeiReservationScheduler;
  idleReleaseMs?: number;
}

const DEFAULT_IDLE_RELEASE_MS = 30_000;

export class XunfeiConnectionReservation<TConnection> {
  private connection: TConnection | undefined;
  private connecting: Promise<TConnection> | undefined;
  private closing: Promise<void> | undefined;
  private releaseTimer: unknown;
  private disposed = false;

  public constructor(
    private readonly options: XunfeiConnectionReservationOptions<TConnection>
  ) {
    if ((options.idleReleaseMs ?? DEFAULT_IDLE_RELEASE_MS) <= 0) {
      throw new RangeError("Xunfei idle release delay must be positive.");
    }
  }

  public async acquire(): Promise<TConnection> {
    this.ensureActive();
    this.cancelScheduledRelease();
    if (this.closing) {
      await this.closing;
      this.ensureActive();
    }
    if (this.connection) {
      return this.connection;
    }
    if (this.connecting) {
      return this.connecting;
    }

    const connecting = this.options.connect();
    this.connecting = connecting;
    try {
      const connection = await connecting;
      if (this.disposed) {
        await this.options.close(connection);
        throw new Error("Xunfei connection reservation has been disposed.");
      }
      this.connection = connection;
      return connection;
    } finally {
      if (this.connecting === connecting) {
        this.connecting = undefined;
      }
    }
  }

  public releaseWhenIdle(): boolean {
    if (
      this.disposed ||
      this.releaseTimer !== undefined ||
      (!this.connection && !this.connecting)
    ) {
      return false;
    }

    this.releaseTimer = this.options.scheduler.setTimeout(() => {
      this.releaseTimer = undefined;
      void this.releaseNow();
    }, this.options.idleReleaseMs ?? DEFAULT_IDLE_RELEASE_MS);
    return true;
  }

  public async releaseNow(): Promise<boolean> {
    this.cancelScheduledRelease();
    if (this.closing) {
      await this.closing;
      return false;
    }
    if (this.connecting) {
      try {
        await this.connecting;
      } catch {
        return false;
      }
    }

    const connection = this.connection;
    this.connection = undefined;
    if (!connection) {
      return false;
    }

    const closing = this.options.close(connection);
    this.closing = closing;
    try {
      await closing;
    } finally {
      if (this.closing === closing) {
        this.closing = undefined;
      }
    }
    return true;
  }

  public async dispose(): Promise<boolean> {
    if (this.disposed) {
      return false;
    }
    this.disposed = true;
    this.cancelScheduledRelease();
    if (this.connecting) {
      try {
        await this.connecting;
      } catch {
        // A failed connection has no resource to release.
      }
    }
    await this.releaseNow();
    return true;
  }

  public getState(): {
    connected: boolean;
    connecting: boolean;
    releaseScheduled: boolean;
    disposed: boolean;
  } {
    return {
      connected: this.connection !== undefined,
      connecting: this.connecting !== undefined,
      releaseScheduled: this.releaseTimer !== undefined,
      disposed: this.disposed
    };
  }

  private cancelScheduledRelease(): void {
    if (this.releaseTimer === undefined) {
      return;
    }
    this.options.scheduler.clearTimeout(this.releaseTimer);
    this.releaseTimer = undefined;
  }

  private ensureActive(): void {
    if (this.disposed) {
      throw new Error("Xunfei connection reservation has been disposed.");
    }
  }
}
