import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SecureChatAnswerProviderStore, CHAT_ANSWER_DEEPSEEK_PROVIDER_ID as providerId } from "../src/secure-chat-answer-provider-store";
import { SettingsService } from "../src/settings/settings-service";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});
const enable = { providerId, enabled: true, requireRecentSuccessfulTest: true };
const testRequest = { providerId, userConfirmedNetworkRequest: true, connectionTestAttemptId: "chat_answer_connection_test_persistence_1" };

async function harness() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "jarvis-stream-persistence-"));
  directories.push(directory);
  const filePath = path.join(directory, "provider.json");
  const decrypt = vi.fn((value: Buffer) => value.toString("utf8"));
  const store = new SecureChatAnswerProviderStore(filePath, {
    isAvailable: () => true,
    encrypt: value => Buffer.from(value, "utf8"),
    decrypt,
  }, providerId);
  await store.save({ provider: providerId, credentials: { apiKey: "fixture-local-key" } });
  const testConnection = vi.fn(async () => "success" as const);
  const configure = vi.fn();
  const makeService = () => new SettingsService({
    loadChatAnswerProviderConfiguration: () => store.load(),
    loadChatAnswerProviderPublicConfiguration: () => store.loadPublicConfiguration(),
    loadChatAnswerProviderEnabled: () => store.loadEnabled(),
    saveChatAnswerProviderEnabled: enabled => store.setEnabled(enabled),
    saveChatAnswerProviderPublicConfiguration: config => store.savePublicConfiguration(config),
    replaceChatAnswerProviderCredential: value => store.replaceCredential(value),
    clearChatAnswerProviderConfiguration: () => store.clear(),
    testChatAnswerProviderConnection: testConnection,
    getChatAnswerCredentialStatus: async () => ({ secureStorageAvailable: true, credentialConfigured: (await store.status()).credentialConfigured }),
    configureCommandRouterProductMode: () => undefined,
    configureChatAnswerProductMode: configure,
  });
  return { store, filePath, decrypt, testConnection, configure, makeService };
}

describe("configured streaming provider persistence through SettingsService", () => {
  it("requires test plus explicit enable, restores the same record without test or writes, and persists disable", async () => {
    const h = await harness();
    const service = h.makeService();
    expect((await service.setChatAnswerProviderConfigurationEnabled(enable)).ok).toBe(false);
    expect(await h.store.loadEnabled()).toBe(false);
    expect((await service.testChatAnswerProviderConnection(testRequest)).ok).toBe(true);
    expect(await h.store.loadEnabled()).toBe(false);
    const before = JSON.parse(await readFile(h.filePath, "utf8")) as { encryptedCredentials: string };
    expect((await service.setChatAnswerProviderConfigurationEnabled(enable)).ok).toBe(true);
    const after = JSON.parse(await readFile(h.filePath, "utf8")) as { encryptedCredentials: string };
    expect(after.encryptedCredentials).toBe(before.encryptedCredentials);
    expect(h.testConnection).toHaveBeenCalledTimes(1);

    h.configure.mockClear();
    const restored = h.makeService();
    await restored.restoreChatAnswerProviderRuntime();
    expect(h.configure).toHaveBeenCalledTimes(1);
    expect(await restored.getChatAnswerProviderConfigurationStatus()).toMatchObject({ configured: true, enabled: true, runtimeArmed: true, connectionTestStatus: "success", credentialExposed: false });
    expect(h.testConnection).toHaveBeenCalledTimes(1);
    expect(await restored.setChatAnswerProductModeEnabled({ enabled: false })).toMatchObject({ ok: true });
    expect(await h.store.loadEnabled()).toBe(false);
    h.configure.mockClear();
    await h.makeService().restoreChatAnswerProviderRuntime();
    expect(h.configure).not.toHaveBeenCalled();
  });

  it("invalidates persisted enablement when public configuration or credential changes", async () => {
    const h = await harness();
    await h.store.setEnabled(true);
    const publicConfig = await h.store.loadPublicConfiguration();
    await h.store.savePublicConfiguration(publicConfig!);
    expect(await h.store.loadEnabled()).toBe(false);
    await h.store.setEnabled(true);
    await h.store.replaceCredential("fixture-replacement-key");
    expect(await h.store.loadEnabled()).toBe(false);
    h.decrypt.mockClear();
    await h.store.setEnabled(true);
    expect(await h.store.loadEnabled()).toBe(true);
    expect(h.decrypt).not.toHaveBeenCalled();
  });

  it("ignores a late success after configuration invalidation and rejects overlapping tests", async () => {
    const h = await harness();
    let finish: (value: "success") => void = () => undefined;
    h.testConnection.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const service = h.makeService();
    const pending = service.testChatAnswerProviderConnection(testRequest);
    await vi.waitFor(() => expect(h.testConnection).toHaveBeenCalledTimes(1));
    expect((await service.testChatAnswerProviderConnection(testRequest)).ok).toBe(false);
    await service.replaceChatAnswerProviderCredential({ providerId, apiKey: "fixture-updated-key" });
    finish("success");
    expect((await pending).ok).toBe(false);
    expect((await service.setChatAnswerProviderConfigurationEnabled(enable)).ok).toBe(false);
    expect(await h.store.loadEnabled()).toBe(false);
    expect(h.testConnection).toHaveBeenCalledTimes(1);
  });
});
