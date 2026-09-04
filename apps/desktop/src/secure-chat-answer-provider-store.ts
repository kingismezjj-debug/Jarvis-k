import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SecureStringEncryption } from "./secure-voice-provider-store";

export const CHAT_ANSWER_DEEPSEEK_PROVIDER_ID =
  "chat-answer.openai-compatible.deepseek" as const;
export const CHAT_ANSWER_DEEPSEEK_ENDPOINT =
  "https://api.deepseek.com/chat/completions" as const;
export const CHAT_ANSWER_DEEPSEEK_MODEL_ID = "deepseek-v4-flash" as const;

export interface ChatAnswerProviderPublicConfiguration {
  readonly provider:
    | "chat-answer.openai-compatible.glm"
    | typeof CHAT_ANSWER_DEEPSEEK_PROVIDER_ID;
  readonly endpoint: string;
  readonly modelId: string;
}

export interface ChatAnswerProviderConfiguration {
  readonly provider:
    | "chat-answer.openai-compatible.glm"
    | typeof CHAT_ANSWER_DEEPSEEK_PROVIDER_ID;
  readonly endpoint?: string;
  readonly modelId?: string;
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

interface StoredPublicCredentialConfiguration {
  readonly version: 2;
  readonly provider: ChatAnswerProviderConfiguration["provider"];
  readonly endpoint: string;
  readonly modelId: string;
  readonly encryptedCredentials?: string;
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
    const stored = await this.loadStoredSafely();
    const publicConfiguration = stored
      ? parseStoredPublicConfiguration(stored, this.provider)
      : null;
    const credentialConfigured =
      stored !== null &&
      (stored.version === 1 ||
        (stored.version === 2 &&
          typeof stored.encryptedCredentials === "string" &&
          stored.encryptedCredentials.length > 0));
    return {
      providerId: this.provider,
      status: publicConfiguration ? "configured" : "unconfigured",
      credentialConfigured,
      credentialExposed: false,
      networkAccessApproved: false,
      reasons: credentialConfigured
        ? ["Credential is configured in secure storage."]
        : publicConfiguration
          ? ["Configuration is saved without a credential."]
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
      if (stored.version === 1) {
        const plaintext = this.encryption.decrypt(
          Buffer.from(stored.encrypted, "base64")
        );
        return parseConfiguration(JSON.parse(plaintext), this.provider);
      }
      if (!stored.encryptedCredentials) {
        return null;
      }
      const plaintext = this.encryption.decrypt(
        Buffer.from(stored.encryptedCredentials, "base64")
      );
      const credentials = parseCredentials(JSON.parse(plaintext));
      return {
        provider: stored.provider,
        endpoint: stored.endpoint,
        modelId: stored.modelId,
        credentials
      };
    } catch {
      throw new Error("Chat Answer configuration is invalid.");
    }
  }

  public async loadPublicConfiguration(): Promise<ChatAnswerProviderPublicConfiguration | null> {
    const stored = await this.loadStoredSafely();
    return stored ? parseStoredPublicConfiguration(stored, this.provider) : null;
  }

  public async savePublicConfiguration(
    configuration: ChatAnswerProviderPublicConfiguration
  ): Promise<void> {
    if (!this.encryption.isAvailable()) {
      throw new Error("Secure credential storage is unavailable.");
    }
    const validated = parsePublicConfiguration(configuration, this.provider);
    const stored = await this.loadStoredSafely();
    const encryptedCredentials =
      stored?.version === 2
        ? stored.encryptedCredentials
        : stored?.version === 1
          ? encryptCredentialsFromLegacy(stored, this.encryption, this.provider)
          : undefined;
    await this.writeStored({
      version: 2,
      provider: validated.provider,
      endpoint: validated.endpoint,
      modelId: validated.modelId,
      ...(encryptedCredentials ? { encryptedCredentials } : {})
    });
  }

  public async replaceCredential(apiKey: string): Promise<void> {
    if (!this.encryption.isAvailable()) {
      throw new Error("Secure credential storage is unavailable.");
    }
    const publicConfiguration =
      (await this.loadPublicConfiguration()) ?? defaultPublicConfiguration(this.provider);
    const encryptedCredentials = this.encryption
      .encrypt(JSON.stringify({ apiKey: requireSecret(apiKey) }))
      .toString("base64");
    await this.writeStored({
      version: 2,
      provider: publicConfiguration.provider,
      endpoint: publicConfiguration.endpoint,
      modelId: publicConfiguration.modelId,
      encryptedCredentials
    });
  }

  public async save(
    configuration: ChatAnswerProviderConfiguration
  ): Promise<void> {
    if (!this.encryption.isAvailable()) {
      throw new Error("Secure credential storage is unavailable.");
    }
    const validated = parseConfiguration(configuration, this.provider);
    const encryptedCredentials = this.encryption
      .encrypt(JSON.stringify(validated.credentials))
      .toString("base64");
    const stored: StoredPublicCredentialConfiguration = {
      version: 2,
      provider: validated.provider,
      endpoint: validated.endpoint ?? defaultPublicConfiguration(this.provider).endpoint,
      modelId: validated.modelId ?? defaultPublicConfiguration(this.provider).modelId,
      encryptedCredentials
    };
    await this.writeStored(stored);
  }

  private async writeStored(
    stored: StoredPublicCredentialConfiguration
  ): Promise<void> {
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

  private async loadStoredSafely(): Promise<
    StoredConfiguration | StoredPublicCredentialConfiguration | null
  > {
    if (!this.encryption.isAvailable()) {
      return null;
    }
    try {
      const rawFile = await readFile(this.filePath, "utf8");
      return parseStored(JSON.parse(rawFile));
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return null;
      }
      throw new Error("Chat Answer configuration could not be read.");
    }
  }
}

function parseStored(
  value: unknown
): StoredConfiguration | StoredPublicCredentialConfiguration {
  if (isRecord(value) && value.version === 2) {
    return {
      version: 2,
      provider: parseProvider(value.provider),
      endpoint: requireSupportedEndpoint(value.endpoint),
      modelId: requireSupportedModelId(value.modelId),
      ...(typeof value.encryptedCredentials === "string" &&
      value.encryptedCredentials.length > 0
        ? { encryptedCredentials: value.encryptedCredentials }
        : {})
    };
  }
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

function parseStoredPublicConfiguration(
  stored: StoredConfiguration | StoredPublicCredentialConfiguration,
  expectedProvider: ChatAnswerProviderConfiguration["provider"]
): ChatAnswerProviderPublicConfiguration {
  if (stored.version === 1) {
    return defaultPublicConfiguration(expectedProvider);
  }
  return parsePublicConfiguration(stored, expectedProvider);
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
  const publicConfiguration =
    typeof value.endpoint === "string" || typeof value.modelId === "string"
      ? parsePublicConfiguration(value, expectedProvider)
      : defaultPublicConfiguration(expectedProvider);
  return {
    ...publicConfiguration,
    credentials: {
      apiKey: requireSecret(value.credentials.apiKey)
    }
  };
}

function parsePublicConfiguration(
  value: unknown,
  expectedProvider: ChatAnswerProviderConfiguration["provider"]
): ChatAnswerProviderPublicConfiguration {
  if (!isRecord(value) || value.provider !== expectedProvider) {
    throw new Error("Invalid Chat Answer configuration.");
  }
  return {
    provider: expectedProvider,
    endpoint: requireSupportedEndpointForProvider(value.endpoint, expectedProvider),
    modelId: requireSupportedModelIdForProvider(value.modelId, expectedProvider)
  };
}

function parseCredentials(value: unknown): ChatAnswerProviderConfiguration["credentials"] {
  if (!isRecord(value)) {
    throw new Error("Invalid credential value.");
  }
  return { apiKey: requireSecret(value.apiKey) };
}

function defaultPublicConfiguration(
  provider: ChatAnswerProviderConfiguration["provider"]
): ChatAnswerProviderPublicConfiguration {
  if (provider === CHAT_ANSWER_DEEPSEEK_PROVIDER_ID) {
    return {
      provider,
      endpoint: CHAT_ANSWER_DEEPSEEK_ENDPOINT,
      modelId: CHAT_ANSWER_DEEPSEEK_MODEL_ID
    };
  }
  return {
    provider,
    endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    modelId: "glm-4.7"
  };
}

function encryptCredentialsFromLegacy(
  stored: StoredConfiguration,
  encryption: SecureStringEncryption,
  expectedProvider: ChatAnswerProviderConfiguration["provider"]
): string {
  const plaintext = encryption.decrypt(Buffer.from(stored.encrypted, "base64"));
  const configuration = parseConfiguration(JSON.parse(plaintext), expectedProvider);
  return encryption
    .encrypt(JSON.stringify(configuration.credentials))
    .toString("base64");
}

function parseProvider(value: unknown): ChatAnswerProviderConfiguration["provider"] {
  if (
    value === "chat-answer.openai-compatible.deepseek" ||
    value === "chat-answer.openai-compatible.glm"
  ) {
    return value;
  }
  throw new Error("Invalid Chat Answer configuration.");
}

function requireSupportedEndpointForProvider(
  value: unknown,
  provider: ChatAnswerProviderConfiguration["provider"]
): string {
  const normalized = requireSupportedEndpoint(value);
  if (provider === CHAT_ANSWER_DEEPSEEK_PROVIDER_ID) {
    if (normalized !== CHAT_ANSWER_DEEPSEEK_ENDPOINT) {
      throw new Error("Invalid Chat Answer configuration.");
    }
    return normalized;
  }
  if (normalized !== "https://open.bigmodel.cn/api/paas/v4/chat/completions") {
    throw new Error("Invalid Chat Answer configuration.");
  }
  return normalized;
}

function requireSupportedEndpoint(value: unknown): string {
  if (typeof value !== "string" || value.trim().length > 512) {
    throw new Error("Invalid Chat Answer configuration.");
  }
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Invalid Chat Answer configuration.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Invalid Chat Answer configuration.");
  }
  const normalized = url.toString().replace(/\/$/u, "");
  if (
    normalized !== CHAT_ANSWER_DEEPSEEK_ENDPOINT &&
    normalized !== "https://open.bigmodel.cn/api/paas/v4/chat/completions"
  ) {
    throw new Error("Invalid Chat Answer configuration.");
  }
  return normalized;
}

function requireSupportedModelIdForProvider(
  value: unknown,
  provider: ChatAnswerProviderConfiguration["provider"]
): string {
  const normalized = requireSupportedModelId(value);
  if (provider === CHAT_ANSWER_DEEPSEEK_PROVIDER_ID) {
    if (normalized !== CHAT_ANSWER_DEEPSEEK_MODEL_ID) {
      throw new Error("Invalid Chat Answer configuration.");
    }
    return normalized;
  }
  if (normalized !== "glm-4.7") {
    throw new Error("Invalid Chat Answer configuration.");
  }
  return normalized;
}

function requireSupportedModelId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9._:-]{1,96}$/u.test(value.trim()) ||
    value.includes("..")
  ) {
    throw new Error("Invalid Chat Answer configuration.");
  }
  const normalized = value.trim();
  if (normalized !== CHAT_ANSWER_DEEPSEEK_MODEL_ID && normalized !== "glm-4.7") {
    throw new Error("Invalid Chat Answer configuration.");
  }
  return normalized;
}

function requireSecret(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length < 8 ||
    value.length > 512 ||
    /[\p{C}\r\n]/u.test(value)
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
