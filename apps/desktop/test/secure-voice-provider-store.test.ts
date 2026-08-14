import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  SecureVoiceProviderStore,
  type SecureStringEncryption
} from "../src/secure-voice-provider-store";

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
    decrypt: (value) =>
      value.toString("utf8").replace(/^protected:/, "")
  };
}

async function createStore(encryption = fakeEncryption()) {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-voice-store-")
  );
  temporaryDirectories.push(directory);
  const filePath = path.join(directory, "voice-provider.json");
  return {
    filePath,
    store: new SecureVoiceProviderStore(filePath, encryption)
  };
}

describe("SecureVoiceProviderStore", () => {
  it("stores only encrypted configuration and restores it", async () => {
    const { filePath, store } = await createStore();
    await store.save({
      provider: "xunfei",
      language: "zh",
      credentials: {
        appId: "local-app-id",
        apiKey: "local-api-key"
      }
    });

    const onDisk = await readFile(filePath, "utf8");
    expect(onDisk).not.toContain("local-app-id");
    expect(onDisk).not.toContain("local-api-key");
    await expect(store.load()).resolves.toEqual({
      provider: "xunfei",
      language: "zh",
      credentials: {
        appId: "local-app-id",
        apiKey: "local-api-key"
      }
    });
    await expect(store.status()).resolves.toEqual({
      configured: true,
      secureStorageAvailable: true,
      provider: "xunfei",
      language: "zh"
    });
  });

  it("stores Volcengine ASR configuration without exposing API keys", async () => {
    const { filePath, store } = await createStore();
    await store.save({
      provider: "volcengine",
      language: "zh",
      credentials: {
        apiKey: "local-api-key",
        resourceId: "volc.seedasr.sauc.duration"
      }
    });

    const onDisk = await readFile(filePath, "utf8");
    expect(onDisk).not.toContain("local-api-key");
    await expect(store.load()).resolves.toEqual({
      provider: "volcengine",
      language: "zh",
      credentials: {
        apiKey: "local-api-key",
        resourceId: "volc.seedasr.sauc.duration"
      }
    });
    await expect(store.status()).resolves.toEqual({
      configured: true,
      secureStorageAvailable: true,
      provider: "volcengine",
      language: "zh",
      resourceId: "volc.seedasr.sauc.duration"
    });
  });

  it("reports unavailable secure storage without writing credentials", async () => {
    const { store } = await createStore(fakeEncryption(false));
    await expect(store.status()).resolves.toEqual({
      configured: false,
      secureStorageAvailable: false
    });
    await expect(
      store.save({
        provider: "volcengine",
        language: "en",
        credentials: {
          apiKey: "unused-key",
          resourceId: "volc.seedasr.sauc.duration"
        }
      })
    ).rejects.toThrow("Secure credential storage is unavailable.");
  });

  it("removes encrypted configuration without exposing its contents", async () => {
    const { store } = await createStore();
    await store.save({
      provider: "xunfei",
      language: "en",
      credentials: {
        appId: "remove-app",
        apiKey: "remove-key"
      }
    });
    await store.clear();
    await expect(store.load()).resolves.toBeNull();
  });
});
