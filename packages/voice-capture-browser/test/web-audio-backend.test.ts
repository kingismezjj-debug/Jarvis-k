import { describe, expect, it } from "vitest";
import {
  WebAudioCaptureBackend,
  type BrowserAudioContextPort,
  type BrowserAudioEnvironment,
  type BrowserAudioNodePort,
  type BrowserAudioProcessEvent,
  type BrowserAudioWorkletNodePort,
  type BrowserMediaStreamPort,
  type BrowserScriptProcessorNodePort
} from "../src";

class FakeNode implements BrowserAudioNodePort {
  public connectCount = 0;
  public disconnectCount = 0;

  public connect(_destination: BrowserAudioNodePort): unknown {
    this.connectCount += 1;
    return undefined;
  }

  public disconnect(): void {
    this.disconnectCount += 1;
  }
}

class FakeWorkletNode extends FakeNode implements BrowserAudioWorkletNodePort {
  public readonly port = {
    onmessage: null as ((event: { data: unknown }) => void) | null
  };
}

class FakeScriptProcessorNode
  extends FakeNode
  implements BrowserScriptProcessorNodePort
{
  public onaudioprocess:
    | ((event: BrowserAudioProcessEvent) => void)
    | null = null;
}

function createHarness(options: {
  workletAvailable?: boolean;
  workletLoadError?: Error;
} = {}) {
  const source = new FakeNode();
  const destination = new FakeNode();
  const worklet = new FakeWorkletNode();
  const scriptProcessor = new FakeScriptProcessorNode();
  const track = { stopCount: 0, stop() { this.stopCount += 1; } };
  const stream: BrowserMediaStreamPort = {
    getTracks: () => [track]
  };
  const calls = {
    close: 0,
    createScriptProcessor: 0,
    getUserMedia: [] as MediaStreamConstraints[],
    loadModule: [] as string[],
    resume: 0,
    suspend: 0,
    workletNode: 0
  };
  const context: BrowserAudioContextPort = {
    sampleRate: 48_000,
    destination,
    ...(options.workletAvailable === false
      ? {}
      : {
          audioWorklet: {
            addModule: async (url: string) => {
              calls.loadModule.push(url);
              if (options.workletLoadError) {
                throw options.workletLoadError;
              }
            }
          }
        }),
    createMediaStreamSource: () => source,
    createScriptProcessor: () => {
      calls.createScriptProcessor += 1;
      return scriptProcessor;
    },
    suspend: async () => {
      calls.suspend += 1;
    },
    resume: async () => {
      calls.resume += 1;
    },
    close: async () => {
      calls.close += 1;
    }
  };
  const environment: BrowserAudioEnvironment = {
    getUserMedia: async (constraints) => {
      calls.getUserMedia.push(constraints);
      return stream;
    },
    createAudioContext: () => context,
    createAudioWorkletNode: () => {
      calls.workletNode += 1;
      return worklet;
    }
  };

  return {
    calls,
    context,
    environment,
    scriptProcessor,
    source,
    track,
    worklet
  };
}

describe("WebAudioCaptureBackend", () => {
  it("prefers AudioWorklet and forwards copied sample frames", async () => {
    const harness = createHarness();
    const frames: Float32Array[] = [];
    const backend = new WebAudioCaptureBackend({
      environment: harness.environment,
      workletModuleUrl: "/capture-worklet.js",
      allowScriptProcessorFallback: true
    });

    await backend.start(({ samples }) => frames.push(samples), {
      deviceId: "microphone-1"
    });
    const workletFrame = new Float32Array([0.25, -0.5]);
    harness.worklet.port.onmessage?.({ data: workletFrame });
    workletFrame[0] = 1;

    expect(harness.calls.loadModule).toEqual(["/capture-worklet.js"]);
    expect(harness.calls.workletNode).toBe(1);
    expect(harness.calls.createScriptProcessor).toBe(0);
    expect(harness.calls.getUserMedia).toEqual([
      {
        audio: {
          deviceId: { exact: "microphone-1" },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        },
        video: false
      }
    ]);
    expect(Array.from(frames[0] ?? [])).toEqual([0.25, -0.5]);
  });

  it("uses ScriptProcessor only when the compatibility fallback is enabled", async () => {
    const harness = createHarness({
      workletLoadError: new Error("worklet load failed")
    });
    const frames: Float32Array[] = [];
    const backend = new WebAudioCaptureBackend({
      environment: harness.environment,
      workletModuleUrl: "/capture-worklet.js",
      allowScriptProcessorFallback: true,
      scriptProcessorBufferSize: 2_048
    });

    await backend.start(({ samples }) => frames.push(samples), {});
    const sourceSamples = new Float32Array([0.1, 0.2]);
    harness.scriptProcessor.onaudioprocess?.({
      inputBuffer: {
        getChannelData: () => sourceSamples
      }
    });
    sourceSamples[0] = 1;

    expect(harness.calls.createScriptProcessor).toBe(1);
    expect(Array.from(frames[0] ?? [])).toEqual([
      expect.closeTo(0.1),
      expect.closeTo(0.2)
    ]);
  });

  it("rejects a failed worklet when fallback is disabled and releases resources", async () => {
    const harness = createHarness({
      workletLoadError: new Error("worklet load failed")
    });
    const backend = new WebAudioCaptureBackend({
      environment: harness.environment,
      workletModuleUrl: "/capture-worklet.js"
    });

    await expect(backend.start(() => undefined, {})).rejects.toThrow(
      "worklet load failed"
    );

    expect(harness.calls.createScriptProcessor).toBe(0);
    expect(harness.source.disconnectCount).toBe(1);
    expect(harness.track.stopCount).toBe(1);
    expect(harness.calls.close).toBe(1);
  });

  it("rejects an unavailable worklet without silently enabling fallback", async () => {
    const harness = createHarness({ workletAvailable: false });
    const backend = new WebAudioCaptureBackend({
      environment: harness.environment,
      workletModuleUrl: "/capture-worklet.js"
    });

    await expect(backend.start(() => undefined, {})).rejects.toThrow(
      "AudioWorklet is unavailable"
    );
    expect(harness.calls.createScriptProcessor).toBe(0);
    expect(harness.track.stopCount).toBe(1);
    expect(harness.calls.close).toBe(1);
  });

  it("stops tracks, disconnects nodes, and closes the context once", async () => {
    const harness = createHarness();
    const backend = new WebAudioCaptureBackend({
      environment: harness.environment,
      workletModuleUrl: "/capture-worklet.js"
    });
    const session = await backend.start(() => undefined, {});

    await session.suspend();
    await session.resume();
    await Promise.all([session.stop(), session.stop()]);

    expect(harness.calls.suspend).toBe(1);
    expect(harness.calls.resume).toBe(1);
    expect(harness.worklet.port.onmessage).toBeNull();
    expect(harness.worklet.disconnectCount).toBe(1);
    expect(harness.source.disconnectCount).toBe(1);
    expect(harness.track.stopCount).toBe(1);
    expect(harness.calls.close).toBe(1);
  });
});
