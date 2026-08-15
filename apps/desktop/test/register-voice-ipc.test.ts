import { describe, expect, it, vi } from "vitest";
import {
  IPC_VOICE_AUDIO_CHANNEL,
  IPC_VOICE_SETTINGS_OPEN_CHANNEL,
  IPC_VOICE_SETTINGS_STATUS_CHANNEL,
} from "@jarvis-k/contracts";
import {
  registerVoiceIpc,
  unregisterVoiceIpc,
} from "../src/ipc/register-voice-ipc";
import {
  VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL,
  VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL,
  VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL,
  VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL,
} from "../src/voice-settings-ipc";
import type { VoiceController } from "../src/voice/voice-controller";

class FakeIpcMain {
  public readonly handlers = new Map<string, (...args: unknown[]) => unknown>();
  public readonly listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  public handle(channel: string, handler: (...args: unknown[]) => unknown): void {
    this.handlers.set(channel, handler);
  }

  public removeHandler(channel: string): void {
    this.handlers.delete(channel);
  }

  public on(channel: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.listeners.get(channel) ?? [];
    listeners.push(listener);
    this.listeners.set(channel, listeners);
  }

  public removeListener(
    channel: string,
    listener: (...args: unknown[]) => void,
  ): void {
    const listeners = this.listeners.get(channel) ?? [];
    this.listeners.set(
      channel,
      listeners.filter((candidate) => candidate !== listener),
    );
  }

  public async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler(...args);
  }

  public emit(channel: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(channel) ?? []) {
      listener(...args);
    }
  }
}

function createVoiceController(): VoiceController {
  return {
    getVoiceServiceStatus: vi.fn().mockResolvedValue({
      configured: true,
      secureStorageAvailable: true,
    }),
    openVoiceSettingsWindow: vi.fn(),
    isVoiceSettingsSender: vi.fn(() => true),
    saveVoiceProviderSettings: vi.fn().mockResolvedValue({ ok: true }),
    clearVoiceProviderSettings: vi.fn().mockResolvedValue({ ok: true }),
    closeVoiceSettingsWindow: vi.fn(),
    handleVoiceAudio: vi.fn(),
  } as unknown as VoiceController;
}

describe("registerVoiceIpc", () => {
  it("registers voice handlers and disposes them", async () => {
    const ipcMain = new FakeIpcMain();
    const voiceController = createVoiceController();

    const dispose = registerVoiceIpc({
      ipcMain,
      voiceController,
    });

    await expect(
      ipcMain.invoke(IPC_VOICE_SETTINGS_STATUS_CHANNEL),
    ).resolves.toEqual({
      configured: true,
      secureStorageAvailable: true,
    });
    await expect(ipcMain.invoke(IPC_VOICE_SETTINGS_OPEN_CHANNEL)).resolves.toEqual(
      {
        configured: true,
        secureStorageAvailable: true,
      },
    );
    expect(voiceController.openVoiceSettingsWindow).toHaveBeenCalledTimes(1);

    ipcMain.emit(VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL, { sender: { id: 7 } });
    ipcMain.emit(IPC_VOICE_AUDIO_CHANNEL, { sender: { id: 7 } }, { frame: true });
    expect(voiceController.closeVoiceSettingsWindow).toHaveBeenCalledTimes(1);
    expect(voiceController.handleVoiceAudio).toHaveBeenCalledTimes(1);

    dispose();

    expect(ipcMain.handlers.size).toBe(0);
    expect(ipcMain.listeners.get(VOICE_PROVIDER_SETTINGS_CLOSE_CHANNEL)).toEqual(
      [],
    );
    expect(ipcMain.listeners.get(IPC_VOICE_AUDIO_CHANNEL)).toEqual([]);
  });

  it("keeps provider settings status gated by the voice settings sender", async () => {
    const ipcMain = new FakeIpcMain();
    const voiceController = createVoiceController();
    vi.mocked(voiceController.isVoiceSettingsSender).mockReturnValue(false);

    registerVoiceIpc({
      ipcMain,
      voiceController,
    });

    await expect(
      ipcMain.invoke(VOICE_PROVIDER_SETTINGS_STATUS_CHANNEL, {
        sender: { id: 8 },
      }),
    ).resolves.toEqual({
      configured: false,
      secureStorageAvailable: false,
    });
    expect(voiceController.getVoiceServiceStatus).not.toHaveBeenCalled();
  });

  it("unregisters voice invoke handlers without touching unrelated listeners", () => {
    const ipcMain = new FakeIpcMain();
    const voiceController = createVoiceController();
    const unrelatedListener = vi.fn();

    registerVoiceIpc({
      ipcMain,
      voiceController,
    });
    ipcMain.on("unrelated", unrelatedListener);

    unregisterVoiceIpc(ipcMain);

    expect(ipcMain.handlers.has(IPC_VOICE_SETTINGS_STATUS_CHANNEL)).toBe(false);
    expect(ipcMain.handlers.has(VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL)).toBe(
      false,
    );
    expect(ipcMain.handlers.has(VOICE_PROVIDER_SETTINGS_CLEAR_CHANNEL)).toBe(
      false,
    );
    expect(ipcMain.listeners.get("unrelated")).toEqual([unrelatedListener]);
  });
});
