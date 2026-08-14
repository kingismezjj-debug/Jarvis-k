import { describe, expect, it, vi } from "vitest";
import { VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL } from "../src/voice-settings-ipc";

const electronMock = vi.hoisted(() => ({
  exposeInMainWorld: vi.fn(),
  invoke: vi.fn(),
  send: vi.fn()
}));

vi.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld: electronMock.exposeInMainWorld
  },
  ipcRenderer: {
    invoke: electronMock.invoke,
    send: electronMock.send
  }
}));

describe("settings preload", () => {
  it("forwards Volcengine provider settings through IPC", async () => {
    electronMock.invoke.mockResolvedValue({
      ok: true,
      status: {
        configured: true,
        secureStorageAvailable: true,
        provider: "volcengine",
        language: "zh",
        resourceId: "volc.bigasr.sauc.duration"
      }
    });

    await import("../src/settings-preload");

    const bridge = electronMock.exposeInMainWorld.mock.calls[0]?.[1] as {
      save(input: {
        provider: "volcengine";
        appId: string;
        apiKey: string;
        resourceId: string;
        language: "zh";
      }): Promise<unknown>;
    };

    await bridge.save({
      provider: "volcengine",
      appId: "",
      apiKey: "test-api-key",
      resourceId: "volc.bigasr.sauc.duration",
      language: "zh"
    });

    expect(electronMock.invoke).toHaveBeenCalledWith(
      VOICE_PROVIDER_SETTINGS_SAVE_CHANNEL,
      {
        provider: "volcengine",
        appId: "",
        apiKey: "test-api-key",
        resourceId: "volc.bigasr.sauc.duration",
        language: "zh"
      }
    );
  });
});
