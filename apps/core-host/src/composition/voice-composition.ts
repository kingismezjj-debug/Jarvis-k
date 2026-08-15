import {
  type AsrProviderCallbacks,
  type AsrProviderPort,
  type AsrSessionPort,
  BailongmaStyleAsrProvider,
  VoiceEngine,
} from "@jarvis-k/voice";
import { XunfeiRtasrProvider } from "@jarvis-k/voice-adapter-xunfei";
import { VolcengineAsrProvider } from "@jarvis-k/voice-adapter-volcengine";
import { NodeWebSocketFactory } from "../node-websocket-factory";
import { VolcengineNodeWebSocketFactory } from "../volcengine-node-websocket-factory";

export type CoreHostVoiceProviderConfiguration =
  | {
      provider: "xunfei";
      language: "zh" | "en";
      credentials: {
        appId: string;
        apiKey: string;
      };
    }
  | {
      provider: "volcengine";
      language: "zh" | "en";
      credentials: {
        apiKey: string;
        resourceId: string;
      };
    };

export interface CoreHostVoiceCompositionInput {
  readonly smokeVoiceEnabled: boolean;
  readonly smokeProviderFaultEnabled: boolean;
  readonly scheduler: {
    setTimeout(callback: () => void, delayMs: number): unknown;
    clearTimeout(handle: unknown): void;
  };
  readonly eventSink: ConstructorParameters<typeof VoiceEngine>[0]["eventSink"];
  readonly now?: () => Date;
}

export interface CoreHostVoiceComposition {
  readonly voiceEngine: VoiceEngine;
  readonly configurableProvider: ConfigurableAsrProvider;
  configureProvider(
    configuration: CoreHostVoiceProviderConfiguration,
  ): Promise<void>;
}

export function createCoreHostVoiceComposition(
  input: CoreHostVoiceCompositionInput,
): CoreHostVoiceComposition {
  const now = input.now ?? (() => new Date());
  const configurableProvider = new ConfigurableAsrProvider(unavailableProvider);
  const voiceEngine = new VoiceEngine({
    provider: input.smokeVoiceEnabled
      ? createSmokeTestProvider({
          faultEnabled: input.smokeProviderFaultEnabled,
        })
      : configurableProvider,
    eventSink: input.eventSink,
    ttsPlayback: {
      interrupt: async () => undefined,
    },
    clock: {
      now,
    },
    scheduler: input.scheduler,
  });

  return {
    voiceEngine,
    configurableProvider,
    configureProvider: async (configuration) => {
      await voiceEngine.setMode("disabled");
      const upstream =
        configuration.provider === "volcengine"
          ? new VolcengineAsrProvider({
              credentials: configuration.credentials,
              socketFactory: new VolcengineNodeWebSocketFactory(),
            })
          : new XunfeiRtasrProvider({
              credentials: configuration.credentials,
              language: configuration.language,
              clock: {
                now,
              },
              scheduler: input.scheduler,
              socketFactory: new NodeWebSocketFactory(),
            });
      configurableProvider.configure(
        new BailongmaStyleAsrProvider({
          upstream,
        }),
      );
    },
  };
}

export function parseVoiceProviderConfigurationMessage(
  message: unknown,
): CoreHostVoiceProviderConfiguration | null {
  if (!isRecord(message) || message.kind !== "voice-provider.configure") {
    return null;
  }
  const configuration = message.configuration;
  if (!isRecord(configuration)) {
    return null;
  }
  const credentials = configuration.credentials;
  const language = configuration.language === "en" ? "en" : "zh";
  if (configuration.provider === "xunfei") {
    if (
      !isRecord(credentials) ||
      typeof credentials.appId !== "string" ||
      typeof credentials.apiKey !== "string"
    ) {
      return null;
    }
    const appId = credentials.appId.trim();
    const apiKey = credentials.apiKey.trim();
    if (appId.length === 0 || apiKey.length === 0) {
      return null;
    }
    return {
      provider: "xunfei",
      language,
      credentials: {
        appId,
        apiKey,
      },
    };
  }
  if (configuration.provider === "volcengine") {
    if (!isRecord(credentials) || typeof credentials.apiKey !== "string") {
      return null;
    }
    const apiKey = credentials.apiKey.trim();
    const resourceId =
      typeof credentials.resourceId === "string" &&
      credentials.resourceId.trim().length > 0
        ? credentials.resourceId.trim()
        : "volc.seedasr.sauc.duration";
    if (
      apiKey.length === 0 ||
      resourceId.length > 128 ||
      !/^volc\.[a-z0-9_.-]+$/i.test(resourceId)
    ) {
      return null;
    }
    return {
      provider: "volcengine",
      language,
      credentials: {
        apiKey,
        resourceId,
      },
    };
  }
  return null;
}

const unavailableProvider = {
  async connect(_callbacks: AsrProviderCallbacks): Promise<AsrSessionPort> {
    throw new Error("ASR provider is not configured.");
  },
};

export class ConfigurableAsrProvider implements AsrProviderPort {
  public constructor(private current: AsrProviderPort) {}

  public configure(provider: AsrProviderPort): void {
    this.current = provider;
  }

  public connect(callbacks: AsrProviderCallbacks): Promise<AsrSessionPort> {
    return this.current.connect(callbacks);
  }
}

function createSmokeTestProvider(input: {
  readonly faultEnabled: boolean;
}): AsrProviderPort {
  let smokeConnectionCount = 0;
  let smokeActiveSessionCount = 0;
  let smokeMaxActiveSessionCount = 0;

  return {
    async connect(callbacks: AsrProviderCallbacks): Promise<AsrSessionPort> {
      smokeConnectionCount += 1;
      smokeActiveSessionCount += 1;
      smokeMaxActiveSessionCount = Math.max(
        smokeMaxActiveSessionCount,
        smokeActiveSessionCount,
      );
      let frameCount = 0;
      let recoveryCount = 0;
      let recoveryDurationMs = 0;
      let soakCycle = 0;
      let closed = false;
      return {
        sendAudio: async (frame) => {
          frameCount += 1;
          if (frame.pcm[0] === 126) {
            soakCycle = frame.pcm[1] ?? 0;
          }
          if (
            input.faultEnabled &&
            recoveryCount === 0 &&
            frame.pcm[0] === 127
          ) {
            const recoveryStartedAt = performance.now();
            recoveryCount += 1;
            await new Promise((resolve) => setTimeout(resolve, 25));
            recoveryDurationMs = Math.round(
              performance.now() - recoveryStartedAt,
            );
          }
        },
        finalizeSegment: async () => {
          const text =
            recoveryCount > 0
              ? `deterministic fault frames=${frameCount} recoveries=${recoveryCount} recoveryMs=${recoveryDurationMs} connections=${smokeConnectionCount} maxActive=${smokeMaxActiveSessionCount}`
              : soakCycle > 0
                ? `deterministic soak cycle=${soakCycle} connections=${smokeConnectionCount} maxActive=${smokeMaxActiveSessionCount}`
                : `deterministic fixture frames=${frameCount}`;
          callbacks.onTranscript({
            text,
            isFinal: true,
            segmentId: "smoke-segment",
          });
          frameCount = 0;
          recoveryCount = 0;
          recoveryDurationMs = 0;
          soakCycle = 0;
        },
        cancelSegment: async () => {
          frameCount = 0;
          recoveryCount = 0;
          recoveryDurationMs = 0;
          soakCycle = 0;
        },
        close: async () => {
          if (!closed) {
            closed = true;
            smokeActiveSessionCount -= 1;
          }
        },
      };
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
