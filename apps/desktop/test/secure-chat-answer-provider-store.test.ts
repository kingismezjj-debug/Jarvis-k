import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { SecureStringEncryption } from "../src/secure-voice-provider-store";
import { SecureChatAnswerProviderStore } from "../src/secure-chat-answer-provider-store";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true })
    )
  );
});

function fakeEncryption(available = true): SecureStringEncryption {
  return {
    isAvailable: () => available,
    encrypt: (value) => Buffer.from(`protected:${value}`, "utf8"),
    decrypt: (value) => value.toString("utf8").replace(/^protected:/, "")
  };
}

async function createStore(encryption = fakeEncryption()) {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-chat-answer-store-")
  );
  temporaryDirectories.push(directory);
  const filePath = path.join(directory, "chat-answer-provider.json");
  return {
    filePath,
    store: new SecureChatAnswerProviderStore(filePath, encryption)
  };
}

describe("SecureChatAnswerProviderStore", () => {
  it("stores only an encrypted fixed GLM Chat Answer credential", async () => {
    const { filePath, store } = await createStore();
    await store.save({
      provider: "chat-answer.openai-compatible.glm",
      credentials: { apiKey: "test-glm-key" }
    });

    expect(await readFile(filePath, "utf8")).not.toContain("test-glm-key");
    await expect(store.load()).resolves.toEqual({
      provider: "chat-answer.openai-compatible.glm",
      endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      modelId: "glm-4.7",
      credentials: { apiKey: "test-glm-key" }
    });
    await expect(store.status()).resolves.toMatchObject({
      providerId: "chat-answer.openai-compatible.glm",
      status: "configured",
      credentialConfigured: true,
      credentialExposed: false,
      networkAccessApproved: false
    });
  });

  it("fails closed when secure storage is unavailable and clears the record", async () => {
    const { store } = await createStore(fakeEncryption(false));
    await expect(
      store.save({
        provider: "chat-answer.openai-compatible.glm",
        credentials: { apiKey: "test-glm-key" }
      })
    ).rejects.toThrow("Secure credential storage is unavailable.");
    await expect(store.clear()).resolves.toBeUndefined();
  });

  it("scopes DeepSeek credentials to a distinct encrypted record and rejects them from GLM scope", async () => {
    const { filePath } = await createStore();
    const deepseekStore = new SecureChatAnswerProviderStore(
      filePath,
      fakeEncryption(),
      "chat-answer.openai-compatible.deepseek"
    );
    const glmStore = new SecureChatAnswerProviderStore(
      filePath,
      fakeEncryption(),
      "chat-answer.openai-compatible.glm"
    );

    await deepseekStore.save({
      provider: "chat-answer.openai-compatible.deepseek",
      credentials: { apiKey: "test-deepseek-key" }
    });

    await expect(deepseekStore.status()).resolves.toMatchObject({
      providerId: "chat-answer.openai-compatible.deepseek",
      status: "configured",
      credentialConfigured: true
    });
    await expect(glmStore.load()).resolves.toMatchObject({
      provider: "chat-answer.openai-compatible.deepseek",
      endpoint: "https://api.deepseek.com/chat/completions",
      modelId: "deepseek-v4-flash"
    });
    await expect(glmStore.status()).rejects.toThrow(
      "Invalid Chat Answer configuration."
    );
  });

  it("keeps public DeepSeek configuration separate from the encrypted credential", async () => {
    const { filePath } = await createStore();
    const store = new SecureChatAnswerProviderStore(
      filePath,
      fakeEncryption(),
      "chat-answer.openai-compatible.deepseek"
    );

    await store.savePublicConfiguration({
      provider: "chat-answer.openai-compatible.deepseek",
      endpoint: "https://api.deepseek.com/chat/completions",
      modelId: "deepseek-v4-flash"
    });
    await store.replaceCredential("test-deepseek-key");

    const stored = await readFile(filePath, "utf8");
    expect(stored).toContain("https://api.deepseek.com/chat/completions");
    expect(stored).toContain("deepseek-v4-flash");
    expect(stored).not.toContain("test-deepseek-key");
    await expect(store.loadPublicConfiguration()).resolves.toEqual({
      provider: "chat-answer.openai-compatible.deepseek",
      endpoint: "https://api.deepseek.com/chat/completions",
      modelId: "deepseek-v4-flash"
    });
    await expect(store.load()).resolves.toMatchObject({
      provider: "chat-answer.openai-compatible.deepseek",
      endpoint: "https://api.deepseek.com/chat/completions",
      modelId: "deepseek-v4-flash",
      credentials: { apiKey: "test-deepseek-key" }
    });
  });

  it("does not overwrite an existing credential when only public fields are saved", async () => {
    const { filePath } = await createStore();
    const store = new SecureChatAnswerProviderStore(
      filePath,
      fakeEncryption(),
      "chat-answer.openai-compatible.deepseek"
    );

    await store.replaceCredential("test-deepseek-key");
    await store.savePublicConfiguration({
      provider: "chat-answer.openai-compatible.deepseek",
      endpoint: "https://api.deepseek.com/chat/completions",
      modelId: "deepseek-v4-flash"
    });

    await expect(store.load()).resolves.toMatchObject({
      credentials: { apiKey: "test-deepseek-key" }
    });
  });

  it("rejects unsafe URL, model, provider, and credential values", async () => {
    const { filePath } = await createStore(fakeEncryption());
    const deepseekStore = new SecureChatAnswerProviderStore(
      filePath,
      fakeEncryption(),
      "chat-answer.openai-compatible.deepseek"
    );

    await expect(
      deepseekStore.savePublicConfiguration({
        provider: "chat-answer.openai-compatible.deepseek",
        endpoint: "http://api.deepseek.com/chat/completions",
        modelId: "deepseek-v4-flash"
      })
    ).rejects.toThrow("Invalid Chat Answer configuration.");
    await expect(
      deepseekStore.savePublicConfiguration({
        provider: "chat-answer.openai-compatible.deepseek",
        endpoint:
          "https://api.deepseek.com/chat/completions?token=not-a-credential",
        modelId: "deepseek-v4-flash"
      })
    ).rejects.toThrow("Invalid Chat Answer configuration.");
    await expect(
      deepseekStore.savePublicConfiguration({
        provider: "chat-answer.openai-compatible.deepseek",
        endpoint: "https://api.deepseek.com/chat/completions",
        modelId: "../deepseek"
      })
    ).rejects.toThrow("Invalid Chat Answer configuration.");
    await expect(
      deepseekStore.replaceCredential("bad\nkey")
    ).rejects.toThrow("Invalid credential value.");
  });
});
