import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
} from "@jarvis-k/contracts";
import type { SecureStringEncryption } from "../secure-voice-provider-store";

export interface GlmAdvancedBrainAcceptanceCredential {
  readonly apiKey: string;
}

export interface GlmAdvancedBrainAcceptanceCredentialStatus {
  readonly status: "configured" | "unconfigured" | "unavailable" | "invalid";
  readonly credentialConfigured: boolean;
  readonly secureStorageAvailable: boolean;
  readonly credentialStorageEncrypted: boolean;
  readonly credentialTypeConfirmed?:
    typeof GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE;
  readonly credentialExposed: false;
}

interface StoredCredential {
  readonly version: 1;
  readonly credentialBindingId:
    typeof GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID;
  readonly credentialType: typeof GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE;
  readonly configured: true;
  readonly encrypted: string;
}

export class SecureGlmAdvancedBrainAcceptanceCredentialStore {
  public constructor(
    private readonly filePath: string,
    private readonly encryption: SecureStringEncryption,
  ) {}

  public async status(): Promise<GlmAdvancedBrainAcceptanceCredentialStatus> {
    if (!this.encryption.isAvailable()) {
      return {
        status: "unavailable",
        credentialConfigured: false,
        secureStorageAvailable: false,
        credentialStorageEncrypted: false,
        credentialExposed: false,
      };
    }
    try {
      const credential = await this.load();
      return {
        status: credential ? "configured" : "unconfigured",
        credentialConfigured: credential !== null,
        secureStorageAvailable: true,
        credentialStorageEncrypted: credential !== null,
        ...(credential
          ? {
              credentialTypeConfirmed:
                GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
            }
          : {}),
        credentialExposed: false,
      };
    } catch {
      return {
        status: "invalid",
        credentialConfigured: false,
        secureStorageAvailable: true,
        credentialStorageEncrypted: false,
        credentialExposed: false,
      };
    }
  }

  public async load(): Promise<GlmAdvancedBrainAcceptanceCredential | null> {
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
      throw new Error("GLM Advanced Brain credential could not be read.");
    }
    try {
      const stored = parseStored(JSON.parse(rawFile));
      const plaintext = this.encryption.decrypt(
        Buffer.from(stored.encrypted, "base64"),
      );
      return parseCredential(JSON.parse(plaintext));
    } catch {
      throw new Error("GLM Advanced Brain credential is invalid.");
    }
  }

  public async save(
    credential: GlmAdvancedBrainAcceptanceCredential,
  ): Promise<void> {
    if (!this.encryption.isAvailable()) {
      throw new Error("Secure credential storage is unavailable.");
    }
    const validated = parseCredential(credential);
    const encrypted = this.encryption
      .encrypt(JSON.stringify(validated))
      .toString("base64");
    const stored: StoredCredential = {
      version: 1,
      credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
      credentialType: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
      configured: true,
      encrypted,
    };
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(
      `${this.filePath}.tmp`,
      `${JSON.stringify(stored, null, 2)}\n`,
      "utf8",
    );
    await rename(`${this.filePath}.tmp`, this.filePath);
  }

  public async clear(): Promise<void> {
    await rm(this.filePath, { force: true });
  }
}

function parseStored(value: unknown): StoredCredential {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    value.credentialBindingId !==
      GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID ||
    value.credentialType !== GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE ||
    value.configured !== true ||
    typeof value.encrypted !== "string" ||
    value.encrypted.length === 0
  ) {
    throw new Error("Invalid encrypted GLM Advanced Brain credential.");
  }
  return {
    version: 1,
    credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
    credentialType: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
    configured: true,
    encrypted: value.encrypted,
  };
}

function parseCredential(
  value: unknown,
): GlmAdvancedBrainAcceptanceCredential {
  if (!isRecord(value)) {
    throw new Error("Invalid GLM Advanced Brain credential.");
  }
  const apiKey = requireSecret(value.apiKey);
  return { apiKey };
}

function requireSecret(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length < 8 ||
    value.length > 1024
  ) {
    throw new Error("Invalid credential value.");
  }
  const trimmed = value.trim();
  if (/^Bearer\s+/iu.test(trimmed)) {
    throw new Error("Invalid credential value.");
  }
  return trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
