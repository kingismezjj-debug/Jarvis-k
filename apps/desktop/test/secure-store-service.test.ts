import { describe, expect, it, vi } from "vitest";
import { IPC_TTS_SYNTHESIZE_CHANNEL } from "@jarvis-k/contracts";
import { registerSecureStoreIpc } from "../src/ipc/register-secure-store-ipc";
import { SecureStoreService } from "../src/secure-store/secure-store-service";

describe("SecureStoreService", () => {
  it("projects secure storage availability without exposing credentials", () => {
    const service = new SecureStoreService({
      isEncryptionAvailable: () => true,
      encryptString: (value) => Buffer.from(`protected:${value}`),
      decryptString: (value) => value.toString().replace(/^protected:/u, ""),
    });
    expect(service.status()).toEqual({
      available: true,
      credentialExposed: false,
    });
    expect(service.safeErrorMessage("save failed")).toBe("save failed");
    expect(service.safeErrorMessage("save failed")).not.toContain("secret");
  });

  it("reports unavailable secure storage", () => {
    const service = new SecureStoreService({
      isEncryptionAvailable: () => false,
      encryptString: (value) => Buffer.from(value),
      decryptString: (value) => value.toString(),
    });
    expect(service.status()).toEqual({
      available: false,
      credentialExposed: false,
    });
    expect(service.unavailableStatus()).toEqual({
      configured: false,
      secureStorageAvailable: false,
    });
  });

  it("provides encryption adapter without logging plaintext", () => {
    const service = new SecureStoreService({
      isEncryptionAvailable: () => true,
      encryptString: (value) => Buffer.from(`enc:${value}`),
      decryptString: (value) => value.toString().replace(/^enc:/u, ""),
    });
    const encryption = service.encryption();
    const encrypted = encryption.encrypt("test-secret");
    expect(encrypted.toString()).toBe("enc:test-secret");
    expect(encryption.decrypt(encrypted)).toBe("test-secret");
  });
});

describe("registerSecureStoreIpc", () => {
  it("registers and unregisters secure-store related handlers", () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const ipcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      removeHandler: vi.fn((channel: string) => {
        handlers.delete(channel);
      }),
    };
    const unregister = registerSecureStoreIpc({
      ipcMain,
      getMainWindow: () => null,
      openTtsSettingsWindow: vi.fn(),
      getTtsServiceStatus: async () => ({ configured: false }),
      saveTtsProviderSettings: vi.fn(),
      clearTtsProviderSettings: vi.fn(),
      synthesizeTts: vi.fn(),
    });
    expect(ipcMain.handle).toHaveBeenCalledTimes(5);
    unregister();
    expect(handlers.size).toBe(0);
  });

  it("re-registers without stacking handlers", () => {
    const ipcMain = {
      handle: vi.fn(),
      removeHandler: vi.fn(),
    };
    const options = {
      ipcMain,
      getMainWindow: () => null,
      openTtsSettingsWindow: vi.fn(),
      getTtsServiceStatus: async () => ({ configured: false }),
      saveTtsProviderSettings: vi.fn(),
      clearTtsProviderSettings: vi.fn(),
      synthesizeTts: vi.fn(),
    };
    registerSecureStoreIpc(options);
    registerSecureStoreIpc(options);
    expect(ipcMain.handle).toHaveBeenCalledTimes(10);
    expect(ipcMain.removeHandler).toHaveBeenCalledTimes(10);
  });

  it("rejects TTS synthesize requests from non-main-window senders", async () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const ipcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      removeHandler: vi.fn(),
    };
    const synthesizeTts = vi.fn();
    registerSecureStoreIpc({
      ipcMain,
      getMainWindow: () => ({ webContents: { id: 7 } }) as never,
      openTtsSettingsWindow: vi.fn(),
      getTtsServiceStatus: async () => ({ configured: false }),
      saveTtsProviderSettings: vi.fn(),
      clearTtsProviderSettings: vi.fn(),
      synthesizeTts,
    });

    await expect(
      Promise.resolve(
        handlers.get(IPC_TTS_SYNTHESIZE_CHANNEL)?.(
          { sender: { id: 8 } },
          { text: "hello" },
        ),
      ),
    ).resolves.toMatchObject({
      ok: false,
      code: "TTS_REQUEST_REJECTED",
    });
    expect(synthesizeTts).not.toHaveBeenCalled();
  });
});
