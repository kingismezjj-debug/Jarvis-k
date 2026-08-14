import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  SecureTtsProviderStore,
  type TtsProviderConfiguration
} from "../src/secure-tts-provider-store";
import type { SecureStringEncryption } from "../src/secure-voice-provider-store";

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
    path.join(os.tmpdir(), "jarvis-k-tts-store-")
  );
  temporaryDirectories.push(directory);
  const filePath = path.join(directory, "tts-provider.json");
  return {
    filePath,
    store: new SecureTtsProviderStore(filePath, encryption)
  };
}

const configuration: TtsProviderConfiguration = {
  provider: "doubao",
  voiceId: "zh_female_xiaohe_uranus_bigtts",
  resourceId: "seed-tts-2.0",
  credentials: {
    apiKey: "doubao-test-api-key"
  }
};

describe("SecureTtsProviderStore", () => {
  it("stores only encrypted TTS configuration and restores it", async () => {
    const { filePath, store } = await createStore();
    await store.save(configuration);

    const onDisk = await readFile(filePath, "utf8");
    expect(onDisk).not.toContain(configuration.credentials.apiKey);
    await expect(store.load()).resolves.toEqual(configuration);
    await expect(store.status()).resolves.toEqual({
      configured: true,
      secureStorageAvailable: true,
      provider: "doubao",
      voiceId: configuration.voiceId,
      resourceId: configuration.resourceId
    });
  });

  it("reports missing configuration without exposing credentials", async () => {
    const { store } = await createStore();
    await expect(store.status()).resolves.toEqual({
      configured: false,
      secureStorageAvailable: true
    });
  });

  it("rejects writes when secure storage is unavailable", async () => {
    const { store } = await createStore(fakeEncryption(false));
    await expect(store.save(configuration)).rejects.toThrow(
      "Secure credential storage is unavailable."
    );
  });

  it("clears the encrypted configuration", async () => {
    const { store } = await createStore();
    await store.save(configuration);
    await store.clear();
    await expect(store.load()).resolves.toBeNull();
  });
});
