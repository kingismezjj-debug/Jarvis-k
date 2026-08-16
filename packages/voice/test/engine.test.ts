import { describe, expect, it } from "vitest";
import type {
  StructuredError,
  VoiceAudioFrame,
  VoiceEvent
} from "@jarvis-k/contracts";
import {
  type AsrProviderCallbacks,
  type AsrSessionPort,
  type Scheduler,
  VoiceEngine
} from "../src";
import type { VoiceAsrProviderId } from "@jarvis-k/contracts";
import type {
  VoiceInputMode,
  VoiceInputModeSource
} from "@jarvis-k/contracts";

class FakeSession implements AsrSessionPort {
  public finalizeCount = 0;
  public cancelCount = 0;
  public closeCount = 0;
  public readonly audioFrames: VoiceAudioFrame[] = [];

  public async sendAudio(frame: VoiceAudioFrame): Promise<void> {
    this.audioFrames.push(frame);
  }

  public async finalizeSegment(): Promise<void> {
    this.finalizeCount += 1;
  }

  public async cancelSegment(): Promise<void> {
    this.cancelCount += 1;
  }

  public async close(): Promise<void> {
    this.closeCount += 1;
  }
}

class FakeProvider {
  public readonly session = new FakeSession();
  public callbacks: AsrProviderCallbacks | null = null;
  public connectCount = 0;

  public async connect(
    callbacks: AsrProviderCallbacks
  ): Promise<AsrSessionPort> {
    this.connectCount += 1;
    this.callbacks = callbacks;
    return this.session;
  }

  public transcript(
    text: string,
    isFinal: boolean,
    providerId?: VoiceAsrProviderId,
    inputMode?: VoiceInputMode,
    inputModeSource?: VoiceInputModeSource
  ): void {
    this.callbacks?.onTranscript({
      text,
      isFinal,
      ...(providerId ? { providerId } : {}),
      ...(inputMode ? { inputMode } : {}),
      ...(inputModeSource ? { inputModeSource } : {}),
      segmentId: "segment-1"
    });
  }

  public fail(error: StructuredError): void {
    this.callbacks?.onError(error);
  }
}

class DeferredProvider {
  public readonly session = new FakeSession();
  private resolveConnection:
    | ((session: AsrSessionPort) => void)
    | undefined;

  public connect(): Promise<AsrSessionPort> {
    return new Promise((resolve) => {
      this.resolveConnection = resolve;
    });
  }

  public resolve(): void {
    this.resolveConnection?.(this.session);
  }
}

class ManualScheduler implements Scheduler {
  private nextId = 1;
  private readonly timers = new Map<number, () => void>();

  public setTimeout(callback: () => void): unknown {
    const id = this.nextId++;
    this.timers.set(id, callback);
    return id;
  }

  public clearTimeout(handle: unknown): void {
    this.timers.delete(Number(handle));
  }

  public runAll(): void {
    for (const [id, callback] of [...this.timers]) {
      this.timers.delete(id);
      callback();
    }
  }
}

class RotatingProvider {
  public connectCount = 0;
  public activeSessionCount = 0;
  public maxActiveSessionCount = 0;
  public readonly sessions: FakeSession[] = [];

  public async connect(
    _callbacks: AsrProviderCallbacks
  ): Promise<AsrSessionPort> {
    this.connectCount += 1;
    this.activeSessionCount += 1;
    this.maxActiveSessionCount = Math.max(
      this.maxActiveSessionCount,
      this.activeSessionCount
    );
    const session = new FakeSession();
    const close = session.close.bind(session);
    session.close = async () => {
      if (session.closeCount === 0) {
        this.activeSessionCount -= 1;
      }
      await close();
    };
    this.sessions.push(session);
    return session;
  }
}

function createHarness() {
  const provider = new FakeProvider();
  const events: VoiceEvent[] = [];
  const interruptedPlaybackIds: string[] = [];
  const engine = new VoiceEngine({
    provider,
    eventSink: {
      publish: (event) => events.push(event)
    },
    ttsPlayback: {
      interrupt: async (playbackId) => {
        interruptedPlaybackIds.push(playbackId);
      }
    },
    clock: {
      now: () => new Date("2026-07-29T00:00:00.000Z")
    },
    scheduler: {
      setTimeout: () => 1,
      clearTimeout: () => undefined
    }
  });

  return {
    engine,
    events,
    interruptedPlaybackIds,
    provider
  };
}

describe("VoiceEngine", () => {
  it("delivers only matching audio while the PTT segment is recording", async () => {
    const { engine, provider } = createHarness();
    const frame: VoiceAudioFrame = {
      metadata: {
        captureId: "capture-1",
        sequenceId: 0,
        capturedAt: "2026-07-29T00:00:00.000Z",
        sampleRate: 16_000,
        channels: 1,
        encoding: "pcm_s16le",
        byteLength: 4
      },
      pcm: new Uint8Array(4)
    };

    await engine.setMode("ptt");
    engine.startPtt("capture-1");

    expect(await engine.acceptAudioFrame(frame)).toEqual({
      accepted: true
    });
    expect(
      await engine.acceptAudioFrame({
        ...frame,
        metadata: {
          ...frame.metadata,
          captureId: "capture-stale",
          sequenceId: 1
        }
      })
    ).toEqual({ accepted: false, reason: "capture-mismatch" });
    expect(provider.session.audioFrames).toEqual([frame]);

    await engine.stopPtt();
    expect(await engine.acceptAudioFrame(frame)).toEqual({
      accepted: false,
      reason: "not-recording"
    });
  });

  it("runs a PTT cycle and waits for a final transcript", async () => {
    const { engine, events, provider } = createHarness();

    expect((await engine.setMode("ptt")).ok).toBe(true);
    expect(provider.connectCount).toBe(1);
    expect(engine.startPtt().snapshot.state).toBe("recording");
    expect(engine.startPtt().ok).toBe(false);

    expect((await engine.stopPtt()).snapshot.state).toBe("finalizing");
    expect(provider.session.finalizeCount).toBe(1);

    provider.transcript("Jarvis ready", true);
    expect(engine.getSnapshot().state).toBe("ready");
    expect(engine.getSnapshot().transcript?.text).toBe("Jarvis ready");
    expect(engine.getSnapshot().transcript?.providerId).toBe("unknown");
    expect(
      events.some((event) => event.type === "voice.transcript.updated")
    ).toBe(true);
  });

  it("preserves the ASR provider identity on transcript events", async () => {
    const { engine, events, provider } = createHarness();

    await engine.setMode("ptt");
    engine.startPtt("capture-1");
    provider.transcript("打开记事本", true, "xunfei");

    expect(engine.getSnapshot().transcript).toMatchObject({
      text: "打开记事本",
      providerId: "xunfei"
    });
    expect(
      events.find((event) => event.type === "voice.transcript.updated")
    ).toMatchObject({
      payload: {
        providerId: "xunfei"
      }
    });
  });

  it("preserves explicit PTT input mode provenance on transcript events", async () => {
    const { engine, events, provider } = createHarness();

    await engine.setMode("ptt");
    engine.startPtt("capture-1", {
      inputMode: "conversation",
      inputModeSource: "explicit_ui"
    });
    provider.transcript("open VS Code", true, "volcengine");

    expect(engine.getSnapshot().transcript).toMatchObject({
      text: "open VS Code",
      providerId: "volcengine",
      inputMode: "conversation",
      inputModeSource: "explicit_ui"
    });
    expect(
      events.find((event) => event.type === "voice.transcript.updated")
    ).toMatchObject({
      payload: {
        inputMode: "conversation",
        inputModeSource: "explicit_ui"
      }
    });
  });

  it("cancels an active segment without closing the provider session", async () => {
    const { engine, provider } = createHarness();

    await engine.setMode("ptt");
    engine.startPtt();
    const result = await engine.cancel();

    expect(result.snapshot.state).toBe("ready");
    expect(provider.session.cancelCount).toBe(1);
    expect(provider.session.closeCount).toBe(0);
  });

  it("cancels a pending provider connection without reviving it", async () => {
    const provider = new DeferredProvider();
    const engine = new VoiceEngine({
      provider,
      eventSink: { publish: () => undefined },
      ttsPlayback: { interrupt: async () => undefined },
      clock: { now: () => new Date("2026-07-29T00:00:00.000Z") },
      scheduler: {
        setTimeout: () => 1,
        clearTimeout: () => undefined
      }
    });

    const connection = engine.setMode("ptt");
    expect(engine.getSnapshot().state).toBe("connecting");
    expect((await engine.cancel()).snapshot).toMatchObject({
      state: "idle",
      mode: "disabled"
    });

    provider.resolve();
    const connectionResult = await connection;
    expect(connectionResult.ok).toBe(false);
    expect(
      connectionResult.ok ? undefined : connectionResult.error.code
    ).toBe("VOICE_CONNECT_CANCELLED");
    expect(provider.session.closeCount).toBe(1);
    expect(engine.getSnapshot().state).toBe("idle");
  });

  it("cancels a segment while finalization is pending", async () => {
    const { engine, provider } = createHarness();

    await engine.setMode("ptt");
    engine.startPtt();
    await engine.stopPtt();
    const result = await engine.cancel();

    expect(result.snapshot.state).toBe("ready");
    expect(provider.session.cancelCount).toBe(1);
  });

  it("rejects commands that do not match the active state", async () => {
    const { engine } = createHarness();

    expect(engine.startPtt().ok).toBe(false);
    expect((await engine.stopPtt()).ok).toBe(false);
    await engine.setMode("ptt");
    engine.startPtt();
    expect((await engine.setMode("continuous")).ok).toBe(false);
    expect(engine.suspendForTts("playback-1").ok).toBe(false);
    await engine.cancel();
    expect(
      (await engine.resumeAfterTts("wrong-playback", false)).ok
    ).toBe(false);
  });

  it("publishes state and transcript events in transition order", async () => {
    const { engine, events, provider } = createHarness();

    await engine.setMode("ptt");
    engine.startPtt();
    await engine.stopPtt();
    provider.transcript("partial", false);
    provider.transcript("final", true);

    expect(
      events
        .filter((event) => event.type === "voice.state.changed")
        .map((event) =>
          event.type === "voice.state.changed"
            ? event.payload.state
            : undefined
        )
    ).toEqual([
      "connecting",
      "ready",
      "recording",
      "finalizing",
      "ready"
    ]);
    expect(engine.getSnapshot()).toMatchObject({
      state: "ready",
      mode: "ptt",
      transcript: {
        text: "final",
        isFinal: true
      }
    });
  });

  it("publishes permission changes without owning browser permission APIs", () => {
    const { engine, events } = createHarness();

    engine.reportPermission("granted");

    expect(engine.getSnapshot().permission).toBe("granted");
    expect(events.at(-1)).toEqual({
      type: "voice.permission.changed",
      payload: { permission: "granted" }
    });
  });

  it("coordinates an interrupted TTS playback", async () => {
    const { engine, events, interruptedPlaybackIds, provider } =
      createHarness();

    const connected = await engine.setMode("continuous");
    const captureId = connected.snapshot.sessionId;
    expect(engine.suspendForTts("playback-1").snapshot.state).toBe(
      "speaking"
    );
    const result = await engine.resumeAfterTts("playback-1", true);

    expect(result.snapshot.state).toBe("ready");
    expect(result.snapshot.sessionId).toBe(captureId);
    expect(interruptedPlaybackIds).toEqual(["playback-1"]);
    expect(provider.connectCount).toBe(1);
    expect(provider.session.closeCount).toBe(0);
    expect(
      events
        .filter(
          (event) =>
            event.type === "voice.state.changed" ||
            event.type === "voice.playback.interrupted"
        )
        .slice(-3)
    ).toEqual([
      {
        type: "voice.state.changed",
        payload: {
          state: "interrupted",
          mode: "continuous",
          sessionId: captureId
        }
      },
      {
        type: "voice.playback.interrupted",
        payload: {
          playbackId: "playback-1",
          reason: "barge-in"
        }
      },
      {
        type: "voice.state.changed",
        payload: {
          state: "ready",
          mode: "continuous",
          sessionId: captureId
        }
      }
    ]);
  });

  it("suspends continuous upload for TTS and resumes the same resources", async () => {
    const { engine, provider } = createHarness();

    const connected = await engine.setMode("continuous");
    const captureId = connected.snapshot.sessionId!;
    const frame: VoiceAudioFrame = {
      metadata: {
        captureId,
        sequenceId: 0,
        capturedAt: "2026-07-29T00:00:00.000Z",
        sampleRate: 16_000,
        channels: 1,
        encoding: "pcm_s16le",
        byteLength: 4
      },
      pcm: new Uint8Array(4)
    };

    expect(await engine.acceptAudioFrame(frame)).toEqual({
      accepted: true
    });
    expect(engine.suspendForTts("playback-1").snapshot.state).toBe(
      "speaking"
    );
    expect(await engine.acceptAudioFrame(frame)).toEqual({
      accepted: false,
      reason: "not-recording"
    });

    const resumed = await engine.resumeAfterTts("playback-1", false);
    expect(resumed.snapshot).toMatchObject({
      state: "ready",
      mode: "continuous",
      sessionId: captureId
    });
    expect(await engine.acceptAudioFrame(frame)).toEqual({
      accepted: true
    });
    expect(provider.connectCount).toBe(1);
    expect(provider.session.closeCount).toBe(0);
    expect(provider.session.audioFrames).toHaveLength(2);
  });

  it("switches idle modes without duplicating the provider or continuous capture", async () => {
    const { engine, provider } = createHarness();

    await engine.setMode("ptt");
    expect(provider.connectCount).toBe(1);

    const continuous = await engine.setMode("continuous");
    const continuousCaptureId = continuous.snapshot.sessionId;
    expect(continuousCaptureId).toBeTruthy();
    expect(provider.connectCount).toBe(1);

    const repeated = await engine.setMode("continuous");
    expect(repeated.snapshot.sessionId).toBe(continuousCaptureId);
    expect(provider.connectCount).toBe(1);

    const frame: VoiceAudioFrame = {
      metadata: {
        captureId: continuousCaptureId!,
        sequenceId: 0,
        capturedAt: "2026-07-29T00:00:00.000Z",
        sampleRate: 16_000,
        channels: 1,
        encoding: "pcm_s16le",
        byteLength: 4
      },
      pcm: new Uint8Array(4)
    };
    expect(await engine.acceptAudioFrame(frame)).toEqual({
      accepted: true
    });

    const ptt = await engine.setMode("ptt");
    expect(ptt.snapshot.sessionId).toBeUndefined();
    expect(provider.connectCount).toBe(1);
  });

  it("recovers continuous inactivity without overlapping session owners", async () => {
    const provider = new RotatingProvider();
    const scheduler = new ManualScheduler();
    const events: VoiceEvent[] = [];
    const engine = new VoiceEngine({
      provider,
      eventSink: {
        publish: (event) => events.push(event)
      },
      ttsPlayback: {
        interrupt: async () => undefined
      },
      clock: {
        now: () => new Date("2026-07-29T00:00:00.000Z")
      },
      scheduler,
      continuousInactivityMs: 1_000
    });

    const connected = await engine.setMode("continuous");
    const captureId = connected.snapshot.sessionId;
    scheduler.runAll();
    expect(engine.getSnapshot().state).toBe("recovering");

    for (let index = 0; index < 4; index += 1) {
      await Promise.resolve();
    }

    expect(engine.getSnapshot()).toMatchObject({
      state: "ready",
      mode: "continuous",
      sessionId: captureId
    });
    expect(provider.connectCount).toBe(2);
    expect(provider.sessions[0]!.closeCount).toBe(1);
    expect(provider.sessions[1]!.closeCount).toBe(0);
    expect(provider.activeSessionCount).toBe(1);
    expect(provider.maxActiveSessionCount).toBe(1);
    expect(
      events
        .filter((event) => event.type === "voice.state.changed")
        .slice(-2)
        .map((event) =>
          event.type === "voice.state.changed"
            ? event.payload.state
            : undefined
        )
    ).toEqual(["recovering", "ready"]);
  });

  it("overlays PTT on continuous listening without replacing resources", async () => {
    const { engine, provider } = createHarness();

    const connected = await engine.setMode("continuous");
    const captureId = connected.snapshot.sessionId!;
    expect(engine.startPtt("different-capture").ok).toBe(false);

    const started = engine.startPtt(captureId);
    expect(started.snapshot).toMatchObject({
      state: "recording",
      mode: "continuous",
      sessionId: captureId
    });

    const frame: VoiceAudioFrame = {
      metadata: {
        captureId,
        sequenceId: 0,
        capturedAt: "2026-07-29T00:00:00.000Z",
        sampleRate: 16_000,
        channels: 1,
        encoding: "pcm_s16le",
        byteLength: 4
      },
      pcm: new Uint8Array(4)
    };
    expect(await engine.acceptAudioFrame(frame)).toEqual({
      accepted: true
    });
    expect((await engine.stopPtt()).snapshot.state).toBe("finalizing");

    provider.transcript("overlay final", true);
    expect(engine.getSnapshot()).toMatchObject({
      state: "ready",
      mode: "continuous",
      sessionId: captureId,
      transcript: {
        text: "overlay final",
        isFinal: true
      }
    });
    expect(provider.connectCount).toBe(1);
    expect(provider.session.closeCount).toBe(0);
  });

  it("moves provider failures into a structured error state", async () => {
    const { engine, events, provider } = createHarness();

    await engine.setMode("ptt");
    provider.fail({
      code: "ASR_DISCONNECTED",
      message: "Provider disconnected.",
      retryable: true
    });

    expect(engine.getSnapshot().state).toBe("error");
    expect(events.at(-1)?.type).toBe("voice.error");
  });
});
