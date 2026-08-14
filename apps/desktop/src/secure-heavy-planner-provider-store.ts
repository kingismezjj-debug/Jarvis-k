import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BrainPlannerProviderConfigurationReport } from "@jarvis-k/contracts";
import type { SecureStringEncryption } from "./secure-voice-provider-store";

export interface HeavyPlannerProviderConfiguration {
  provider: HeavyPlannerProviderName;
  credentials: {
    apiKey: string;
  };
}

export type HeavyPlannerProviderName = "openai" | "glm";

interface StoredHeavyPlannerProviderConfiguration {
  version: 1;
  encrypted: string;
}

export class SecureHeavyPlannerProviderStore {
  public constructor(
    private readonly filePath: string,
    private readonly encryption: SecureStringEncryption,
    private readonly provider: HeavyPlannerProviderName = "openai"
  ) {}

  public async status(): Promise<BrainPlannerProviderConfigurationReport> {
    const storeAvailable = this.encryption.isAvailable();
    if (!storeAvailable) {
      return {
        providerId: providerIdFor(this.provider),
        status: "unavailable",
        credentialConfigured: false,
        credentialExposed: false,
        networkAccessApproved: false,
        reasons: ["Secure credential storage is unavailable."]
      };
    }

    const configuration = await this.load();
    return {
      providerId: providerIdFor(this.provider),
      status: configuration ? "configured" : "unconfigured",
      credentialConfigured: configuration !== null,
      credentialExposed: false,
      networkAccessApproved: false,
      reasons: configuration
        ? ["Credential is configured in secure storage."]
        : ["Credential is not configured."]
    };
  }

  public async load(): Promise<HeavyPlannerProviderConfiguration | null> {
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
      throw new Error("Heavy Planner configuration could not be read.");
    }

    try {
      const stored = parseStoredConfiguration(JSON.parse(rawFile));
      const plaintext = this.encryption.decrypt(
        Buffer.from(stored.encrypted, "base64")
      );
      return parseHeavyPlannerProviderConfiguration(
        JSON.parse(plaintext),
        this.provider
      );
    } catch {
      throw new Error("Heavy Planner configuration is invalid.");
    }
  }

  public async save(
    configuration: HeavyPlannerProviderConfiguration
  ): Promise<void> {
    if (!this.encryption.isAvailable()) {
      throw new Error("Secure credential storage is unavailable.");
    }

    const validated = parseHeavyPlannerProviderConfiguration(
      configuration,
      this.provider
    );
    const encrypted = this.encryption
      .encrypt(JSON.stringify(validated))
      .toString("base64");
    const stored: StoredHeavyPlannerProviderConfiguration = {
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
): StoredHeavyPlannerProviderConfiguration {
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

function parseHeavyPlannerProviderConfiguration(
  value: unknown,
  expectedProvider: HeavyPlannerProviderName
): HeavyPlannerProviderConfiguration {
  if (
    !isRecord(value) ||
    value.provider !== expectedProvider ||
    !isRecord(value.credentials)
  ) {
    throw new Error("Invalid Heavy Planner configuration.");
  }

  return {
    provider: expectedProvider,
    credentials: {
      apiKey: requireSecret(value.credentials.apiKey)
    }
  };
}

function providerIdFor(provider: HeavyPlannerProviderName): string {
  return provider === "glm" ? "heavy-planner.glm" : "heavy-planner.openai";
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
