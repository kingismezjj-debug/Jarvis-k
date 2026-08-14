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
    await expect(glmStore.load()).rejects.toThrow(
      "Chat Answer configuration is invalid."
    );
  });
});
