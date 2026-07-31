import {
  CoreInboundMessageSchema,
  type CoreOutboundMessage
} from "@jarvis-k/contracts";
import { CoreRuntime } from "@jarvis-k/core";
import {
  type AsrProviderCallbacks,
  type AsrProviderPort,
  type AsrSessionPort,
  VoiceEngine
} from "@jarvis-k/voice";
import { XunfeiRtasrProvider } from "@jarvis-k/voice-adapter-xunfei";
import { NodeWebSocketFactory } from "./node-websocket-factory";

function send(message: CoreOutboundMessage): void {
  if (process.send) {
    process.send(message);
  }
}

const unavailableProvider = {
  async connect(
    _callbacks: AsrProviderCallbacks
  ): Promise<AsrSessionPort> {
    throw new Error("ASR provider is not configured.");
  }
};

class ConfigurableAsrProvider implements AsrProviderPort {
  public constructor(private current: AsrProviderPort) {}

  public configure(provider: AsrProviderPort): void {
    this.current = provider;
  }

  public connect(
    callbacks: AsrProviderCallbacks
  ): Promise<AsrSessionPort> {
    return this.current.connect(callbacks);
  }
}

let smokeConnectionCount = 0;
let smokeActiveSessionCount = 0;
let smokeMaxActiveSessionCount = 0;

const smokeTestProvider = {
  async connect(
    callbacks: AsrProviderCallbacks
  ): Promise<AsrSessionPort> {
    smokeConnectionCount += 1;
    smokeActiveSessionCount += 1;
    smokeMaxActiveSessionCount = Math.max(
      smokeMaxActiveSessionCount,
      smokeActiveSessionCount
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
          process.env.JARVIS_K_SMOKE_PROVIDER_FAULT === "1" &&
          recoveryCount === 0 &&
          frame.pcm[0] === 127
        ) {
          const recoveryStartedAt = performance.now();
          recoveryCount += 1;
          await new Promise((resolve) => setTimeout(resolve, 25));
          recoveryDurationMs = Math.round(
            performance.now() - recoveryStartedAt
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
          segmentId: "smoke-segment"
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
      }
    };
  }
};

let runtime: CoreRuntime;
const scheduler = {
  setTimeout: (callback: () => void, delayMs: number) =>
    setTimeout(callback, delayMs),
  clearTimeout: (handle: unknown) =>
    clearTimeout(handle as NodeJS.Timeout)
};
const configurableProvider = new ConfigurableAsrProvider(
  unavailableProvider
);
const voiceEngine = new VoiceEngine({
  provider:
    process.env.JARVIS_K_SMOKE_VOICE === "1"
      ? smokeTestProvider
      : configurableProvider,
  eventSink: {
    publish: (event) => runtime.handleVoiceEvent(event)
  },
  ttsPlayback: {
    interrupt: async () => undefined
  },
  clock: {
    now: () => new Date()
  },
  scheduler
});

runtime = new CoreRuntime(
  (event) => {
    send({
      kind: "event",
      envelope: event
    });
  },
  voiceEngine
);

let inboundQueue = Promise.resolve();

process.on("message", (rawMessage: unknown) => {
  const providerConfiguration =
    parseVoiceProviderConfigurationMessage(rawMessage);
  if (providerConfiguration) {
    inboundQueue = inboundQueue
      .then(async () => {
        await voiceEngine.setMode("disabled");
        configurableProvider.configure(
          new XunfeiRtasrProvider({
            credentials: providerConfiguration.credentials,
            language: providerConfiguration.language,
            clock: {
              now: () => new Date()
            },
            scheduler,
            socketFactory: new NodeWebSocketFactory()
          })
        );
      })
      .catch(() => {
        console.error(
          "[core-host] Voice provider configuration failed."
        );
      });
    return;
  }

  const parsed = CoreInboundMessageSchema.safeParse(rawMessage);
  if (!parsed.success) {
    console.error("[core-host] Rejected invalid supervisor message.");
    return;
  }

  inboundQueue = inboundQueue
    .then(async () => {
      if (parsed.data.kind === "voice-audio") {
        await voiceEngine.acceptAudioFrame(parsed.data.frame);
        return;
      }
      const result = await runtime.handle(parsed.data.envelope);
      send({
        kind: "result",
        envelope: result
      });
    })
    .catch((error: unknown) => {
      console.error(
        "[core-host] Inbound message handling failed:",
        error instanceof Error ? error.message : "unknown error"
      );
    });
});

process.on("uncaughtException", (error) => {
  console.error("[core-host] Uncaught exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(
    "[core-host] Unhandled rejection:",
    reason instanceof Error ? reason.message : "unknown reason"
  );
  process.exit(1);
});

runtime.announceReady();

interface CoreHostVoiceProviderConfiguration {
  language: "zh" | "en";
  credentials: {
    appId: string;
    apiKey: string;
  };
}

function parseVoiceProviderConfigurationMessage(
  message: unknown
): CoreHostVoiceProviderConfiguration | null {
  if (!isRecord(message) || message.kind !== "voice-provider.configure") {
    return null;
  }
  const configuration = message.configuration;
  if (!isRecord(configuration) || configuration.provider !== "xunfei") {
    return null;
  }
  const credentials = configuration.credentials;
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
    language: configuration.language === "en" ? "en" : "zh",
    credentials: {
      appId,
      apiKey
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
