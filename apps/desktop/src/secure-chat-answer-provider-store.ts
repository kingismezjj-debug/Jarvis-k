import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SecureStringEncryption } from "./secure-voice-provider-store";

export interface ChatAnswerProviderConfiguration {
  readonly provider:
    | "chat-answer.openai-compatible.glm"
    | "chat-answer.openai-compatible.deepseek";
  readonly credentials: {
    readonly apiKey: string;
  };
}

export interface ChatAnswerProviderConfigurationStatus {
  readonly providerId: ChatAnswerProviderConfiguration["provider"];
  readonly status: "configured" | "unconfigured" | "unavailable";
  readonly credentialConfigured: boolean;
  readonly credentialExposed: false;
  readonly networkAccessApproved: false;
  readonly reasons: readonly string[];
}

interface StoredConfiguration {
  readonly version: 1;
  readonly encrypted: string;
}

export class SecureChatAnswerProviderStore {
  public constructor(
    private readonly filePath: string,
    private readonly encryption: SecureStringEncryption,
    private readonly provider: ChatAnswerProviderConfiguration["provider"] =
      "chat-answer.openai-compatible.glm"
  ) {}

  public async status(): Promise<ChatAnswerProviderConfigurationStatus> {
    if (!this.encryption.isAvailable()) {
      return {
        providerId: this.provider,
        status: "unavailable",
        credentialConfigured: false,
        credentialExposed: false,
        networkAccessApproved: false,
        reasons: ["Secure credential storage is unavailable."]
      };
    }
    const configuration = await this.load();
    return {
      providerId: this.provider,
      status: configuration ? "configured" : "unconfigured",
      credentialConfigured: configuration !== null,
      credentialExposed: false,
      networkAccessApproved: false,
      reasons: configuration
        ? ["Credential is configured in secure storage."]
        : ["Credential is not configured."]
    };
  }

  public async load(): Promise<ChatAnswerProviderConfiguration | null> {
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
      throw new Error("Chat Answer configuration could not be read.");
    }
    try {
      const stored = parseStored(JSON.parse(rawFile));
      const plaintext = this.encryption.decrypt(
        Buffer.from(stored.encrypted, "base64")
      );
      return parseConfiguration(JSON.parse(plaintext), this.provider);
    } catch {
      throw new Error("Chat Answer configuration is invalid.");
    }
  }

  public async save(
    configuration: ChatAnswerProviderConfiguration
  ): Promise<void> {
    if (!this.encryption.isAvailable()) {
      throw new Error("Secure credential storage is unavailable.");
    }
    const validated = parseConfiguration(configuration, this.provider);
    const encrypted = this.encryption
      .encrypt(JSON.stringify(validated))
      .toString("base64");
    const stored: StoredConfiguration = {
      version: 1,
      encrypted
    };
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(
      `${this.filePath}.tmp`,
      `${JSON.stringify(stored, null, 2)}\n`,
      "utf8"
    );
    await rename(`${this.filePath}.tmp`, this.filePath);
  }

  public async clear(): Promise<void> {
    await rm(this.filePath, { force: true });
  }
}

function parseStored(value: unknown): StoredConfiguration {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    typeof value.encrypted !== "string" ||
    value.encrypted.length === 0
  ) {
    throw new Error("Invalid encrypted configuration.");
  }
  return { version: 1, encrypted: value.encrypted };
}

function parseConfiguration(
  value: unknown,
  expectedProvider: ChatAnswerProviderConfiguration["provider"]
): ChatAnswerProviderConfiguration {
  if (
    !isRecord(value) ||
    value.provider !== expectedProvider ||
    !isRecord(value.credentials)
  ) {
    throw new Error("Invalid Chat Answer configuration.");
  }
  return {
    provider: expectedProvider,
    credentials: {
      apiKey: requireSecret(value.credentials.apiKey)
    }
  };
}

function requireSecret(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length < 8 ||
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
