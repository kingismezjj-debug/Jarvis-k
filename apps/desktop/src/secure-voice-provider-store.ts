import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { VoiceServiceStatus } from "@jarvis-k/contracts";

export interface VoiceProviderConfiguration {
  provider: "xunfei";
  language: "zh" | "en";
  credentials: {
    appId: string;
    apiKey: string;
  };
}

export interface SecureStringEncryption {
  isAvailable(): boolean;
  encrypt(value: string): Buffer;
  decrypt(value: Buffer): string;
}

interface StoredVoiceProviderConfiguration {
  version: 1;
  encrypted: string;
}

export class SecureVoiceProviderStore {
  public constructor(
    private readonly filePath: string,
    private readonly encryption: SecureStringEncryption
  ) {}

  public async status(): Promise<VoiceServiceStatus> {
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
      ...(configuration ? { language: configuration.language } : {})
    };
  }

  public async load(): Promise<VoiceProviderConfiguration | null> {
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
      throw new Error("Voice provider configuration could not be read.");
    }

    try {
      const stored = parseStoredConfiguration(JSON.parse(rawFile));
      const plaintext = this.encryption.decrypt(
        Buffer.from(stored.encrypted, "base64")
      );
      return parseVoiceProviderConfiguration(JSON.parse(plaintext));
    } catch {
      throw new Error("Voice provider configuration is invalid.");
    }
  }

  public async save(
    configuration: VoiceProviderConfiguration
  ): Promise<void> {
    if (!this.encryption.isAvailable()) {
      throw new Error("Secure credential storage is unavailable.");
    }

    const validated = parseVoiceProviderConfiguration(configuration);
    const encrypted = this.encryption
      .encrypt(JSON.stringify(validated))
      .toString("base64");
    const stored: StoredVoiceProviderConfiguration = {
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
): StoredVoiceProviderConfiguration {
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

function parseVoiceProviderConfiguration(
  value: unknown
): VoiceProviderConfiguration {
  if (
    !isRecord(value) ||
    value.provider !== "xunfei" ||
    (value.language !== "zh" && value.language !== "en") ||
    !isRecord(value.credentials)
  ) {
    throw new Error("Invalid voice provider configuration.");
  }

  const appId = requireSecret(value.credentials.appId);
  const apiKey = requireSecret(value.credentials.apiKey);
  return {
    provider: "xunfei",
    language: value.language,
    credentials: {
      appId,
      apiKey
    }
  };
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
