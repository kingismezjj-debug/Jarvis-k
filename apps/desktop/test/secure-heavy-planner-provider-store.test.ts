import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { SecureStringEncryption } from "../src/secure-voice-provider-store";
import { SecureHeavyPlannerProviderStore } from "../src/secure-heavy-planner-provider-store";

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
    path.join(os.tmpdir(), "jarvis-k-heavy-planner-store-")
  );
  temporaryDirectories.push(directory);
  const filePath = path.join(directory, "heavy-planner-provider.json");
  return {
    filePath,
    store: new SecureHeavyPlannerProviderStore(filePath, encryption)
  };
}

describe("SecureHeavyPlannerProviderStore", () => {
  it("stores only encrypted OpenAI planner credentials", async () => {
    const { filePath, store } = await createStore();
    await store.save({
      provider: "openai",
      credentials: {
        apiKey: "test-key"
      }
    });

    const onDisk = await readFile(filePath, "utf8");
    expect(onDisk).not.toContain("test-key");
    await expect(store.load()).resolves.toEqual({
      provider: "openai",
      credentials: {
        apiKey: "test-key"
      }
    });
    await expect(store.status()).resolves.toEqual({
      providerId: "heavy-planner.openai",
      status: "configured",
      credentialConfigured: true,
      credentialExposed: false,
      networkAccessApproved: false,
      reasons: ["Credential is configured in secure storage."]
    });
  });

  it("reports unavailable secure storage without writing credentials", async () => {
    const { store } = await createStore(fakeEncryption(false));
    await expect(store.status()).resolves.toMatchObject({
      providerId: "heavy-planner.openai",
      status: "unavailable",
      credentialConfigured: false,
      credentialExposed: false
    });
    await expect(
      store.save({
        provider: "openai",
        credentials: {
          apiKey: "unused-key"
        }
      })
    ).rejects.toThrow("Secure credential storage is unavailable.");
  });

  it("removes encrypted OpenAI planner credentials", async () => {
    const { store } = await createStore();
    await store.save({
      provider: "openai",
      credentials: {
        apiKey: "remove-key"
      }
    });
    await store.clear();
    await expect(store.load()).resolves.toBeNull();
  });

  it("uses a distinct GLM-scoped encrypted record and rejects it from the OpenAI scope", async () => {
    const { filePath } = await createStore();
    const glmStore = new SecureHeavyPlannerProviderStore(
      filePath,
      fakeEncryption(),
      "glm"
    );
    const openAiStore = new SecureHeavyPlannerProviderStore(
      filePath,
      fakeEncryption(),
      "openai"
    );

    await glmStore.save({
      provider: "glm",
      credentials: {
        apiKey: "test-key"
      }
    });

    await expect(glmStore.status()).resolves.toMatchObject({
      providerId: "heavy-planner.glm",
      status: "configured",
      credentialConfigured: true,
      credentialExposed: false
    });
    await expect(openAiStore.load()).rejects.toThrow(
      "Heavy Planner configuration is invalid."
    );
  });
});
