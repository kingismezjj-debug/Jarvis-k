import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { TtsServiceStatus } from "@jarvis-k/contracts";
import type { SecureStringEncryption } from "./secure-voice-provider-store";

export interface TtsProviderConfiguration {
  provider: "doubao";
  voiceId: string;
  resourceId?: string;
  credentials: {
    apiKey: string;
  };
}

interface StoredTtsProviderConfiguration {
  version: 1;
  encrypted: string;
}

export class SecureTtsProviderStore {
  public constructor(
    private readonly filePath: string,
    private readonly encryption: SecureStringEncryption
  ) {}

  public async status(): Promise<TtsServiceStatus> {
    const secureStorageAvailable = this.encryption.isAvailable();
    if (!secureStorageAvailable) {
      return {
        configured: false,
        secureStorageAvailable
      };
    }

    const configuration = await this.load();
    return {
      configured: configuration !== null,
      secureStorageAvailable,
      ...(configuration
        ? {
            provider: configuration.provider,
            voiceId: configuration.voiceId,
            ...(configuration.resourceId
              ? { resourceId: configuration.resourceId }
              : {})
          }
        : {})
    };
  }

  public async load(): Promise<TtsProviderConfiguration | null> {
    if (!this.encryption.isAvailable()) {
      return null;
    }

    let rawFile: string;
    try {
      rawFile = await readFile(this.filePath, "utf8");
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return null;
      }
      throw new Error("TTS provider configuration could not be read.");
    }

    try {
      const stored = parseStoredConfiguration(JSON.parse(rawFile));
      const plaintext = this.encryption.decrypt(
        Buffer.from(stored.encrypted, "base64")
      );
      return parseTtsProviderConfiguration(JSON.parse(plaintext));
    } catch {
      throw new Error("TTS provider configuration is invalid.");
    }
  }

  public async save(configuration: TtsProviderConfiguration): Promise<void> {
    if (!this.encryption.isAvailable()) {
      throw new Error("Secure credential storage is unavailable.");
    }

    const validated = parseTtsProviderConfiguration(configuration);
    const encrypted = this.encryption
      .encrypt(JSON.stringify(validated))
      .toString("base64");
    const stored: StoredTtsProviderConfiguration = {
      version: 1,
      encrypted
    };
    const directory = path.dirname(this.filePath);
    const temporaryPath = `${this.filePath}.tmp`;

    await mkdir(directory, { recursive: true });
    await writeFile(
      temporaryPath,
      `${JSON.stringify(stored, null, 2)}\n`,
      "utf8"
    );
    await rename(temporaryPath, this.filePath);
  }

  public async clear(): Promise<void> {
    await rm(this.filePath, { force: true });
  }
}

function parseStoredConfiguration(
  value: unknown
): StoredTtsProviderConfiguration {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    typeof value.encrypted !== "string" ||
    value.encrypted.length === 0
  ) {
    throw new Error("Invalid encrypted configuration.");
  }
  return {
    version: 1,
    encrypted: value.encrypted
  };
}

function parseTtsProviderConfiguration(
  value: unknown
): TtsProviderConfiguration {
  if (!isRecord(value) || value.provider !== "doubao" || !isRecord(value.credentials)) {
    throw new Error("Invalid TTS provider configuration.");
  }

  return {
    provider: "doubao",
    voiceId: requireVoiceId(value.voiceId),
    ...(typeof value.resourceId === "string" && value.resourceId.trim().length > 0
      ? { resourceId: requireResourceId(value.resourceId) }
      : {}),
    credentials: {
      apiKey: requireSecret(value.credentials.apiKey)
    }
  };
}

function requireVoiceId(value: unknown): string {
  const voiceId =
    typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : "zh_female_xiaohe_uranus_bigtts";
  if (voiceId.length > 128) {
    throw new Error("Invalid voice ID.");
  }
  return voiceId;
}

function requireResourceId(value: unknown): string {
  const resourceId =
    typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : "seed-tts-2.0";
  if (resourceId.length > 128) {
    throw new Error("Invalid resource ID.");
  }
  return resourceId;
}

function requireSecret(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > 512
  ) {
    throw new Error("Invalid credential value.");
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
