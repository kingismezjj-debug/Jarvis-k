import { describe, expect, it, vi } from "vitest";
import {
  IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
  IPC_UI_SURFACE_CAPABILITY_STATUS_CHANNEL,
} from "@jarvis-k/contracts";
import { registerSettingsIpc } from "../src/ipc/register-settings-ipc";
import { SettingsService } from "../src/settings/settings-service";
import type { ChatAnswerProviderConfiguration } from "../src/secure-chat-answer-provider-store";

function createSettingsService(input: {
  credentialConfigured?: boolean;
  secureStorageAvailable?: boolean;
  configuration?: ChatAnswerProviderConfiguration | null;
  evaluationCapabilityAvailable?: boolean;
} = {}) {
  const configureCommandRouterProductMode = vi.fn();
  const configureChatAnswerProductMode = vi.fn();
  const service = new SettingsService({
    loadChatAnswerProviderConfiguration: async () =>
      input.configuration === undefined ? null : input.configuration,
    getChatAnswerCredentialStatus: async () => ({
      secureStorageAvailable: input.secureStorageAvailable ?? true,
      credentialConfigured: input.credentialConfigured ?? false,
    }),
    configureCommandRouterProductMode,
    configureChatAnswerProductMode,
    evaluationCapabilityAvailable: input.evaluationCapabilityAvailable,
  });
  return {
    service,
    configureCommandRouterProductMode,
    configureChatAnswerProductMode,
  };
}

describe("SettingsService", () => {
  it("reads default disabled settings", async () => {
    const { service } = createSettingsService();
    expect(service.getCommandRouterProductModeStatus()).toMatchObject({
      enabled: false,
      status: "disabled",
      fixtureOnly: false,
    });
    await expect(service.getChatAnswerProductModeStatus()).resolves.toMatchObject({
      enabled: false,
      status: "credential_missing",
      credentialExposed: false,
    });
    expect(service.getUiSurfaceCapabilityStatus()).toEqual({
      evaluationCapabilityAvailable: false,
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    });
  });

  it("exposes evaluation capability as a read-only safe projection", () => {
    const { service } = createSettingsService({
      evaluationCapabilityAvailable: true,
    });
    expect(service.getUiSurfaceCapabilityStatus()).toEqual({
      evaluationCapabilityAvailable: true,
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    });
  });

  it("updates command router product mode without enabling fixture execution", () => {
    const { service, configureCommandRouterProductMode } = createSettingsService();
    const result = service.setCommandRouterProductModeEnabled({ enabled: true });
    expect(result.ok).toBe(true);
    expect(result.status.status).toBe("control_enabled_rules_only");
    expect(result.status.fixtureOnly).toBe(false);
    expect(configureCommandRouterProductMode).toHaveBeenCalledWith({
      enabled: true,
    });
  });

  it("updates chat answer product mode only when credentials are configured", async () => {
    const configuration: ChatAnswerProviderConfiguration = {
      provider: "chat-answer.openai-compatible.deepseek",
      credentials: { apiKey: "test-key" },
    };
    const { service, configureChatAnswerProductMode } = createSettingsService({
      credentialConfigured: true,
      configuration,
    });
    const result = await service.setChatAnswerProductModeEnabled({
      enabled: true,
    });
    expect(result.status.status).toBe("control_enabled_runtime_armed");
    expect(JSON.stringify(result)).not.toContain("test-key");
    expect(configureChatAnswerProductMode).toHaveBeenCalledWith({
      enabled: true,
      configuration,
    });
  });
});

describe("registerSettingsIpc", () => {
  it("registers and unregisters settings handlers", () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const ipcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      removeHandler: vi.fn((channel: string) => {
        handlers.delete(channel);
      }),
    };
    const { service } = createSettingsService();
    const unregister = registerSettingsIpc({
      ipcMain,
      getMainWindow: () => null,
      settingsService: service,
    });

    expect(ipcMain.handle).toHaveBeenCalledTimes(5);
    expect(handlers.has(IPC_UI_SURFACE_CAPABILITY_STATUS_CHANNEL)).toBe(true);
    unregister();
    expect(handlers.size).toBe(0);
  });

  it("re-registers without stacking handlers", () => {
    const ipcMain = {
      handle: vi.fn(),
      removeHandler: vi.fn(),
    };
    const { service } = createSettingsService();
    registerSettingsIpc({
      ipcMain,
      getMainWindow: () => null,
      settingsService: service,
    });
    registerSettingsIpc({
      ipcMain,
      getMainWindow: () => null,
      settingsService: service,
    });
    expect(ipcMain.handle).toHaveBeenCalledTimes(10);
    expect(ipcMain.removeHandler).toHaveBeenCalledTimes(10);
  });

  it("rejects settings updates from non-main-window senders", async () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const ipcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      removeHandler: vi.fn(),
    };
    const { service } = createSettingsService();
    registerSettingsIpc({
      ipcMain,
      getMainWindow: () => ({ webContents: { id: 7 } }) as never,
      settingsService: service,
    });

    const commandRouterHandler = handlers.get(
      IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
    );
    const chatAnswerHandler = handlers.get(
      IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
    );
    await expect(
      Promise.resolve(
        commandRouterHandler?.({ sender: { id: 8 } }, { enabled: true }),
      ),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      Promise.resolve(
        chatAnswerHandler?.({ sender: { id: 8 } }, { enabled: true }),
      ),
    ).resolves.toMatchObject({ ok: false });
  });
});
