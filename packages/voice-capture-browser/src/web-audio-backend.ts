import type {
  BrowserAudioSamples,
  BrowserCaptureBackendPort,
  BrowserCaptureSessionPort
} from "./capture";

export interface BrowserMediaStreamTrackPort {
  stop(): void;
}

export interface BrowserMediaStreamPort {
  getTracks(): BrowserMediaStreamTrackPort[];
}

export interface BrowserAudioNodePort {
  connect(destination: BrowserAudioNodePort): unknown;
  disconnect(): void;
}

export interface BrowserAudioWorkletPort {
  addModule(moduleUrl: string): Promise<void>;
}

export interface BrowserAudioWorkletMessagePort {
  onmessage: ((event: { data: unknown }) => void) | null;
}

export interface BrowserAudioWorkletNodePort extends BrowserAudioNodePort {
  port: BrowserAudioWorkletMessagePort;
}

export interface BrowserAudioBufferPort {
  getChannelData(channel: number): Float32Array;
}

export interface BrowserAudioProcessEvent {
  inputBuffer: BrowserAudioBufferPort;
}

export interface BrowserScriptProcessorNodePort extends BrowserAudioNodePort {
  onaudioprocess:
    | ((event: BrowserAudioProcessEvent) => void)
    | null;
}

export interface BrowserAudioContextPort {
  readonly sampleRate: number;
  readonly destination: BrowserAudioNodePort;
  readonly audioWorklet?: BrowserAudioWorkletPort;
  createMediaStreamSource(stream: BrowserMediaStreamPort): BrowserAudioNodePort;
  createScriptProcessor?(
    bufferSize: number,
    inputChannels: number,
    outputChannels: number
  ): BrowserScriptProcessorNodePort;
  suspend(): Promise<void>;
  resume(): Promise<void>;
  close(): Promise<void>;
}

export interface BrowserAudioEnvironment {
  getUserMedia(constraints: MediaStreamConstraints): Promise<BrowserMediaStreamPort>;
  createAudioContext(): BrowserAudioContextPort;
  createAudioWorkletNode(
    context: BrowserAudioContextPort,
    processorName: string
  ): BrowserAudioWorkletNodePort;
}

export interface WebAudioCaptureBackendOptions {
  environment?: BrowserAudioEnvironment;
  workletModuleUrl: string;
  workletProcessorName?: string;
  allowScriptProcessorFallback?: boolean;
  scriptProcessorBufferSize?: number;
}

interface StartedAudioGraph {
  context: BrowserAudioContextPort;
  stream: BrowserMediaStreamPort;
  source: BrowserAudioNodePort;
  processor: BrowserAudioNodePort;
  clearProcessorHandler: () => void;
}

const DEFAULT_WORKLET_PROCESSOR_NAME = "jarvis-k-voice-capture";
const DEFAULT_SCRIPT_PROCESSOR_BUFFER_SIZE = 4_096;

export class WebAudioCaptureBackend implements BrowserCaptureBackendPort {
  private readonly environment: BrowserAudioEnvironment;
  private readonly workletModuleUrl: string;
  private readonly workletProcessorName: string;
  private readonly allowScriptProcessorFallback: boolean;
  private readonly scriptProcessorBufferSize: number;

  public constructor(options: WebAudioCaptureBackendOptions) {
    this.environment = options.environment ?? createBrowserAudioEnvironment();
    this.workletModuleUrl = options.workletModuleUrl;
    this.workletProcessorName =
      options.workletProcessorName ?? DEFAULT_WORKLET_PROCESSOR_NAME;
    this.allowScriptProcessorFallback =
      options.allowScriptProcessorFallback ?? false;
    this.scriptProcessorBufferSize =
      options.scriptProcessorBufferSize ??
      DEFAULT_SCRIPT_PROCESSOR_BUFFER_SIZE;
  }

  public async start(
    onSamples: (samples: BrowserAudioSamples) => void,
    options: { deviceId?: string }
  ): Promise<BrowserCaptureSessionPort> {
    const stream = await this.environment.getUserMedia({
      audio: options.deviceId
        ? {
            deviceId: { exact: options.deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          }
        : {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          },
      video: false
    });
    let context: BrowserAudioContextPort | undefined;
    let source: BrowserAudioNodePort | undefined;
    let graph: StartedAudioGraph | undefined;

    try {
      context = this.environment.createAudioContext();
      source = context.createMediaStreamSource(stream);
      graph = await this.startWorkletGraph(
        context,
        stream,
        source,
        onSamples
      );
    } catch (workletError) {
      if (!context || !source || !this.allowScriptProcessorFallback) {
        await releasePartialGraph({ context, stream, source });
        throw workletError;
      }

      try {
        graph = this.startScriptProcessorGraph(
          context,
          stream,
          source,
          onSamples
        );
      } catch (fallbackError) {
        await releasePartialGraph({ context, stream, source });
        throw fallbackError;
      }
    }

    return new WebAudioCaptureSession(graph);
  }

  private async startWorkletGraph(
    context: BrowserAudioContextPort,
    stream: BrowserMediaStreamPort,
    source: BrowserAudioNodePort,
    onSamples: (samples: BrowserAudioSamples) => void
  ): Promise<StartedAudioGraph> {
    if (!context.audioWorklet) {
      throw new Error("AudioWorklet is unavailable.");
    }

    await context.audioWorklet.addModule(this.workletModuleUrl);
    const processor = this.environment.createAudioWorkletNode(
      context,
      this.workletProcessorName
    );
    try {
      processor.port.onmessage = (event) => {
        const samples = toFloat32Samples(event.data);
        if (samples) {
          onSamples({ samples, sampleRate: context.sampleRate });
        }
      };
      source.connect(processor);
      processor.connect(context.destination);
    } catch (error) {
      processor.port.onmessage = null;
      disconnectQuietly(processor);
      throw error;
    }

    return {
      context,
      stream,
      source,
      processor,
      clearProcessorHandler: () => {
        processor.port.onmessage = null;
      }
    };
  }

  private startScriptProcessorGraph(
    context: BrowserAudioContextPort,
    stream: BrowserMediaStreamPort,
    source: BrowserAudioNodePort,
    onSamples: (samples: BrowserAudioSamples) => void
  ): StartedAudioGraph {
    if (!context.createScriptProcessor) {
      throw new Error("ScriptProcessor fallback is unavailable.");
    }

    const processor = context.createScriptProcessor(
      this.scriptProcessorBufferSize,
      1,
      1
    );
    processor.onaudioprocess = (event) => {
      onSamples({
        samples: new Float32Array(event.inputBuffer.getChannelData(0)),
        sampleRate: context.sampleRate
      });
    };
    source.connect(processor);
    processor.connect(context.destination);

    return {
      context,
      stream,
      source,
      processor,
      clearProcessorHandler: () => {
        processor.onaudioprocess = null;
      }
    };
  }
}

class WebAudioCaptureSession implements BrowserCaptureSessionPort {
  private stopPromise: Promise<void> | undefined;

  public constructor(private readonly graph: StartedAudioGraph) {}

  public async suspend(): Promise<void> {
    if (!this.stopPromise) {
      await this.graph.context.suspend();
    }
  }

  public async resume(): Promise<void> {
    if (!this.stopPromise) {
      await this.graph.context.resume();
    }
  }

  public stop(): Promise<void> {
    this.stopPromise ??= releaseGraph(this.graph);
    return this.stopPromise;
  }
}

function createBrowserAudioEnvironment(): BrowserAudioEnvironment {
  return {
    getUserMedia: (constraints) =>
      navigator.mediaDevices.getUserMedia(
        constraints
      ) as unknown as Promise<BrowserMediaStreamPort>,
    createAudioContext: () =>
      new AudioContext() as unknown as BrowserAudioContextPort,
    createAudioWorkletNode: (context, processorName) =>
      new AudioWorkletNode(
        context as unknown as BaseAudioContext,
        processorName
      ) as unknown as BrowserAudioWorkletNodePort
  };
}

function toFloat32Samples(data: unknown): Float32Array | undefined {
  if (data instanceof Float32Array) {
    return new Float32Array(data);
  }
  if (data instanceof ArrayBuffer) {
    return new Float32Array(data.slice(0));
  }
  return undefined;
}

async function releaseGraph(graph: StartedAudioGraph): Promise<void> {
  graph.clearProcessorHandler();
  disconnectQuietly(graph.processor);
  disconnectQuietly(graph.source);
  stopTracks(graph.stream);
  await graph.context.close();
}

async function releasePartialGraph(resources: {
  context: BrowserAudioContextPort | undefined;
  stream: BrowserMediaStreamPort;
  source: BrowserAudioNodePort | undefined;
}): Promise<void> {
  if (resources.source) {
    disconnectQuietly(resources.source);
  }
  stopTracks(resources.stream);
  if (resources.context) {
    await resources.context.close();
  }
}

function disconnectQuietly(node: BrowserAudioNodePort): void {
  try {
    node.disconnect();
  } catch {
    // A partially connected graph can report an invalid disconnect.
  }
}

function stopTracks(stream: BrowserMediaStreamPort): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
