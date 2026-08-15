import path from "node:path";
import type { BrowserWindow } from "electron";
import {
  type TtsServiceStatus,
  type TtsSynthesisResult,
  type VoiceAudioFrame,
  type VoiceServiceStatus,
} from "@jarvis-k/contracts";
import { isStage5LocalAcceptanceNoSecureStore } from "../desktop-runtime-policy";
import {
  SecureTtsProviderStore,
  type TtsProviderConfiguration,
} from "../secure-tts-provider-store";
import {
  SecureVoiceProviderStore,
  type VoiceProviderConfiguration,
} from "../secure-voice-provider-store";
import type { SecureStoreService } from "../secure-store/secure-store-service";
import type { VoiceAudioEnqueueResult } from "../audio-transport";
import {
  handleVoiceAudioIpc,
  type VoiceAudioIpcResult,
} from "../voice-audio-ipc";
import {
  type VoiceProviderSettingsInput,
  type VoiceProviderSettingsResult,
} from "../voice-settings-ipc";
import { createVoiceSettingsWindow } from "../voice-settings-window";

export interface VoiceControllerOptions {
  userDataPath: string;
  secureStoreService: SecureStoreService;
  getMainWindow: () => BrowserWindow | null;
  restartCore: (reason: string) => void;
  enqueueVoiceAudio: (frame: VoiceAudioFrame) => VoiceAudioEnqueueResult;
  writeError?: (message: string) => void;
}

export class VoiceController {
  private voiceSettingsWindow: BrowserWindow | null = null;
  private voiceProviderStore: SecureVoiceProviderStore | null = null;
  private ttsProviderStore: SecureTtsProviderStore | null = null;
  private disposed = false;

  public constructor(private readonly options: VoiceControllerOptions) {}

  public async loadVoiceProviderConfiguration(): Promise<VoiceProviderConfiguration | null> {
    if (isStage5LocalAcceptanceNoSecureStore()) {
      return null;
    }
    try {
      return await this.getVoiceProviderStore().load();
    } catch (error) {
      this.writeError(
        `[desktop] Voice provider configuration unavailable: ${
          error instanceof Error ? error.message : "unknown error"
        }\n`,
      );
      return null;
    }
  }

  public async getVoiceServiceStatus(): Promise<VoiceServiceStatus> {
    if (isStage5LocalAcceptanceNoSecureStore()) {
      return {
        configured: false,
        secureStorageAvailable: false,
      };
    }
    try {
      return await this.getVoiceProviderStore().status();
    } catch {
      return {
        configured: false,
        secureStorageAvailable: this.options.secureStoreService.status().available,
      };
    }
  }

  public openVoiceSettingsWindow(): void {
    if (this.disposed) {
      return;
    }
    if (this.voiceSettingsWindow && !this.voiceSettingsWindow.isDestroyed()) {
      this.voiceSettingsWindow.focus();
      return;
    }
    this.voiceSettingsWindow = createVoiceSettingsWindow(
      this.options.getMainWindow(),
    );
    this.voiceSettingsWindow.on("closed", () => {
      this.voiceSettingsWindow = null;
    });
  }

  public isVoiceSettingsSender(event: Electron.IpcMainInvokeEvent): boolean {
    return this.voiceSettingsWindow?.webContents.id === event.sender.id;
  }

  public async saveVoiceProviderSettings(
    event: Electron.IpcMainInvokeEvent,
    rawInput: unknown,
  ): Promise<VoiceProviderSettingsResult> {
    if (!this.isVoiceSettingsSender(event)) {
      return {
        ok: false,
        message: "Voice settings are unavailable.",
      };
    }
    try {
      const input = parseVoiceProviderSettingsInput(rawInput);
      await this.getVoiceProviderStore().save(
        input.provider === "volcengine"
          ? {
              provider: "volcengine",
              language: input.language,
              credentials: {
                apiKey: input.apiKey,
                resourceId: input.resourceId ?? "volc.seedasr.sauc.duration",
              },
            }
          : {
              provider: "xunfei",
              language: input.language,
              credentials: {
                appId: input.appId,
                apiKey: input.apiKey,
              },
            },
      );
      this.options.restartCore("voice-provider-configuration-changed");
      return {
        ok: true,
        status: await this.getVoiceServiceStatus(),
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Voice settings could not be saved.",
        status: await this.getVoiceServiceStatus(),
      };
    }
  }

  public async clearVoiceProviderSettings(
    event: Electron.IpcMainInvokeEvent,
  ): Promise<VoiceProviderSettingsResult> {
    if (!this.isVoiceSettingsSender(event)) {
      return {
        ok: false,
        message: "Voice settings are unavailable.",
      };
    }
    try {
      await this.getVoiceProviderStore().clear();
      this.options.restartCore("voice-provider-configuration-cleared");
      return {
        ok: true,
        status: await this.getVoiceServiceStatus(),
      };
    } catch {
      return {
        ok: false,
        message: "Voice settings could not be cleared.",
        status: await this.getVoiceServiceStatus(),
      };
    }
  }

  public closeVoiceSettingsWindow(event: Electron.IpcMainEvent): void {
    if (this.voiceSettingsWindow?.webContents.id === event.sender.id) {
      this.voiceSettingsWindow.close();
    }
  }

  public handleVoiceAudio(
    event: Electron.IpcMainEvent,
    rawFrame: unknown,
  ): VoiceAudioIpcResult {
    const currentWindow = this.options.getMainWindow();
    if (!currentWindow || currentWindow.isDestroyed()) {
      return { accepted: false, reason: "invalid-sender" };
    }
    return handleVoiceAudioIpc({
      senderId: event.sender.id,
      expectedSenderId: currentWindow.webContents.id,
      rawFrame,
      enqueue: this.options.enqueueVoiceAudio,
    });
  }

  public async loadTtsProviderConfiguration(): Promise<TtsProviderConfiguration | null> {
    try {
      return await this.getTtsProviderStore().load();
    } catch (error) {
      this.writeError(
        `[desktop] TTS provider configuration unavailable: ${
          error instanceof Error ? error.message : "unknown error"
        }\n`,
      );
      return null;
    }
  }

  public async getTtsServiceStatus(): Promise<TtsServiceStatus> {
    try {
      return await this.getTtsProviderStore().status();
    } catch {
      return {
        configured: false,
        secureStorageAvailable: this.options.secureStoreService.status().available,
      };
    }
  }

  public async saveTtsProviderSettings(
    event: Electron.IpcMainInvokeEvent,
    rawInput: unknown,
  ): Promise<{ ok: boolean; message?: string; status: TtsServiceStatus }> {
    if (!this.isVoiceSettingsSender(event)) {
      return {
        ok: false,
        message: "TTS settings are unavailable.",
        status: await this.getTtsServiceStatus(),
      };
    }
    try {
      const input = parseTtsProviderSettingsInput(rawInput);
      await this.getTtsProviderStore().save(input);
      return {
        ok: true,
        status: await this.getTtsServiceStatus(),
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "TTS settings could not be saved.",
        status: await this.getTtsServiceStatus(),
      };
    }
  }

  public async clearTtsProviderSettings(
    event: Electron.IpcMainInvokeEvent,
  ): Promise<{ ok: boolean; message?: string; status: TtsServiceStatus }> {
    if (!this.isVoiceSettingsSender(event)) {
      return {
        ok: false,
        message: "TTS settings are unavailable.",
        status: await this.getTtsServiceStatus(),
      };
    }
    try {
      await this.getTtsProviderStore().clear();
      return {
        ok: true,
        status: await this.getTtsServiceStatus(),
      };
    } catch {
      return {
        ok: false,
        message: "TTS settings could not be cleared.",
        status: await this.getTtsServiceStatus(),
      };
    }
  }

  public async synthesizeTtsFromIpc(
    _event: unknown,
    rawInput: unknown,
  ): Promise<TtsSynthesisResult> {
    const raw =
      typeof rawInput === "object" && rawInput !== null
        ? (rawInput as Record<string, unknown>)
        : {};
    const text = typeof raw.text === "string" ? raw.text.trim() : "";
    const voiceId =
      typeof raw.voiceId === "string" ? raw.voiceId.trim() : undefined;
    if (!text) {
      return {
        ok: false,
        code: "TTS_REQUEST_REJECTED",
        message: "TTS text is required.",
      };
    }
    return this.synthesizeDoubaoTts(text, voiceId);
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    if (this.voiceSettingsWindow && !this.voiceSettingsWindow.isDestroyed()) {
      this.voiceSettingsWindow.close();
    }
    this.voiceSettingsWindow = null;
  }

  private getVoiceProviderStore(): SecureVoiceProviderStore {
    if (!this.voiceProviderStore) {
      this.voiceProviderStore = new SecureVoiceProviderStore(
        path.join(this.options.userDataPath, "jarvis-k-voice-provider.json"),
        this.options.secureStoreService.encryption(),
      );
    }
    return this.voiceProviderStore;
  }

  private getTtsProviderStore(): SecureTtsProviderStore {
    if (!this.ttsProviderStore) {
      this.ttsProviderStore = new SecureTtsProviderStore(
        path.join(this.options.userDataPath, "jarvis-k-tts-provider.json"),
        this.options.secureStoreService.encryption(),
      );
    }
    return this.ttsProviderStore;
  }

  private async synthesizeDoubaoTts(
    text: string,
    voiceId?: string,
  ): Promise<TtsSynthesisResult> {
    const configuration = await this.loadTtsProviderConfiguration();
    if (!configuration) {
      return {
        ok: false,
        code: "TTS_NOT_CONFIGURED",
        message: "TTS provider is not configured.",
      };
    }

    const speaker = voiceId?.trim() || configuration.voiceId;
    const resourceId = resolveDoubaoResourceId(speaker, configuration.resourceId);
    const requestId = `jarvis_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}`;
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(
        "https://openspeech.bytedance.com/api/v3/tts/unidirectional",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": configuration.credentials.apiKey,
            "X-Api-Resource-Id": resourceId,
            "X-Api-Request-Id": requestId,
          },
          body: JSON.stringify({
            user: { uid: "jarvis-k" },
            req_params: {
              text: text.slice(0, 800),
              speaker,
              audio_params: {
                format: "mp3",
                sample_rate: 24_000,
              },
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        await response.text().catch(() => "");
        return {
          ok: false,
          code: "TTS_PROVIDER_REJECTED",
          message: `Doubao TTS provider rejected the request (HTTP ${response.status}).`,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("audio/")) {
        return {
          ok: true,
          audio: new Uint8Array(await response.arrayBuffer()),
          contentType: "audio/mpeg",
          provider: "doubao",
        };
      }

      const rawText = await response.text();
      try {
        const audio = decodeDoubaoTtsResponse(rawText);
        return {
          ok: true,
          audio: new Uint8Array(audio),
          contentType: "audio/mpeg",
          provider: "doubao",
        };
      } catch {
        return {
          ok: false,
          code: "TTS_RESPONSE_INVALID",
          message: "Doubao TTS returned no playable audio.",
        };
      }
    } catch (error) {
      return {
        ok: false,
        code: "TTS_NETWORK_FAILED",
        message:
          error instanceof Error && error.name === "AbortError"
            ? "Doubao TTS request timed out."
            : "Doubao TTS network request failed.",
      };
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  private writeError(message: string): void {
    (this.options.writeError ?? ((value) => process.stderr.write(value)))(
      message,
    );
  }
}

function parseVoiceProviderSettingsInput(
  value: unknown,
): VoiceProviderSettingsInput {
  const raw =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const provider = raw.provider === "volcengine" ? "volcengine" : "xunfei";
  const appId = typeof raw.appId === "string" ? raw.appId.trim() : "";
  const apiKey = typeof raw.apiKey === "string" ? raw.apiKey.trim() : "";
  const resourceId =
    typeof raw.resourceId === "string" && raw.resourceId.trim().length > 0
      ? raw.resourceId.trim()
      : "volc.seedasr.sauc.duration";
  const language = raw.language === "en" ? "en" : "zh";
  if (provider === "xunfei" && appId.length === 0) {
    throw new Error("AppID is required for Xunfei.");
  }
  if (apiKey.length === 0) {
    throw new Error("APIKey is required.");
  }
  if (appId.length > 512 || apiKey.length > 512) {
    throw new Error("Credential values are too long.");
  }
  if (
    provider === "volcengine" &&
    (resourceId.length > 128 || !/^volc\.[a-z0-9_.-]+$/i.test(resourceId))
  ) {
    throw new Error("Volcengine resource ID is invalid.");
  }
  return {
    provider,
    appId,
    apiKey,
    ...(provider === "volcengine" ? { resourceId } : {}),
    language,
  };
}

function parseTtsProviderSettingsInput(
  value: unknown,
): TtsProviderConfiguration {
  const raw =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const provider = raw.provider === "doubao" ? "doubao" : "doubao";
  const apiKey = typeof raw.apiKey === "string" ? raw.apiKey.trim() : "";
  const voiceId =
    typeof raw.voiceId === "string" && raw.voiceId.trim().length > 0
      ? raw.voiceId.trim()
      : "zh_female_xiaohe_uranus_bigtts";
  const resourceId =
    typeof raw.resourceId === "string" && raw.resourceId.trim().length > 0
      ? raw.resourceId.trim()
      : undefined;
  if (apiKey.length === 0) {
    throw new Error("API key is required.");
  }
  if (apiKey.length > 512 || voiceId.length > 128) {
    throw new Error("Credential values are too long.");
  }
  if (resourceId && resourceId.length > 128) {
    throw new Error("Resource ID is too long.");
  }
  return {
    provider,
    voiceId,
    ...(resourceId ? { resourceId } : {}),
    credentials: {
      apiKey,
    },
  };
}

function resolveDoubaoResourceId(voiceId: string, resourceId?: string): string {
  if (resourceId) {
    return resourceId;
  }
  if (
    /_moon_bigtts$/u.test(voiceId) ||
    /^BV\d+(_24k)?_streaming$/u.test(voiceId)
  ) {
    return "seed-tts-1.0";
  }
  return "seed-tts-2.0";
}

function decodeDoubaoTtsResponse(rawText: string): Buffer {
  const chunks: Buffer[] = [];
  let sawAudio = false;
  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^data:\s*/, "");
    if (!line || line === "[DONE]") {
      continue;
    }
    if (!line.startsWith("{")) {
      continue;
    }
    const data = JSON.parse(line) as {
      code?: unknown;
      status_code?: unknown;
      StatusCode?: unknown;
      message?: unknown;
      status_text?: unknown;
      data?: unknown;
    };
    const providerStatusCode = Number(
      data.code ?? data.status_code ?? data.StatusCode ?? 0,
    );
    if (providerStatusCode > 0 && providerStatusCode !== 20000000) {
      const message =
        typeof data.message === "string"
          ? data.message
          : typeof data.status_text === "string"
            ? data.status_text
            : "TTS provider rejected the request.";
      throw new Error(`Doubao TTS failed (${providerStatusCode}): ${message}`);
    }
    if (typeof data.data === "string" && data.data.length > 0) {
      chunks.push(Buffer.from(data.data, "base64"));
      sawAudio = true;
    }
  }
  if (!sawAudio) {
    throw new Error("Doubao TTS response did not contain audio.");
  }
  return Buffer.concat(chunks);
}
