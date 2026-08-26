import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
  CloudProviderAcceptanceSaveCredentialRequestSchema,
  type CloudProviderCredentialBindingId,
  type CloudProviderCredentialStatus,
  CloudProviderCredentialStatusSchema,
} from "@jarvis-k/contracts";
import type { SecureStringEncryption } from "../secure-voice-provider-store";
import type { CloudProviderCredentialBindingRegistry } from "./credential-binding-registry";

interface StoredCloudProviderCredential {
  readonly schemaVersion: 1;
  readonly bindingId: CloudProviderCredentialBindingId;
  readonly credentialType: typeof CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE;
  readonly configured: true;
  readonly encrypted: string;
  readonly updatedAt?: string;
}

export class CloudProviderCredentialVault {
  public constructor(
    private readonly input: {
      readonly rootDirectory: string;
      readonly encryption: SecureStringEncryption;
      readonly bindingRegistry: CloudProviderCredentialBindingRegistry;
      readonly now?: () => Date;
    },
  ) {}

  public async listStatuses(): Promise<readonly CloudProviderCredentialStatus[]> {
    return Promise.all(
      this.input.bindingRegistry
        .list()
        .map((profile) => this.status(profile.credentialBindingId)),
    );
  }

  public async status(
    bindingId: CloudProviderCredentialBindingId,
  ): Promise<CloudProviderCredentialStatus> {
    const profile = this.input.bindingRegistry.get(bindingId);
    const providerId = profile?.providerId ?? "unknown";
    if (!this.input.encryption.isAvailable()) {
      return CloudProviderCredentialStatusSchema.parse({
        bindingId,
        providerId,
        credentialType: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
        configured: false,
        encrypted: false,
        secureStorageAvailable: false,
        status: "unavailable",
        credentialExposed: false,
      });
    }
    try {
      const stored = await this.loadStored(bindingId);
      return CloudProviderCredentialStatusSchema.parse({
        bindingId,
        providerId,
        credentialType: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
        configured: stored !== null,
        encrypted: stored !== null,
        secureStorageAvailable: true,
        status: stored ? "configured" : "unconfigured",
        credentialExposed: false,
      });
    } catch {
      await this.isolateCorruptFile(bindingId);
      return CloudProviderCredentialStatusSchema.parse({
        bindingId,
        providerId,
        credentialType: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
        configured: false,
        encrypted: false,
        secureStorageAvailable: true,
        status: "invalid",
        credentialExposed: false,
      });
    }
  }

  public async save(
    rawInput: unknown,
  ): Promise<{ readonly ok: true } | { readonly ok: false }> {
    const parsed =
      CloudProviderAcceptanceSaveCredentialRequestSchema.safeParse(rawInput);
    if (!parsed.success || !this.input.encryption.isAvailable()) {
      return { ok: false };
    }
    const request = parsed.data;
    const profile = this.input.bindingRegistry.get(request.bindingId);
    if (
      !profile ||
      profile.credentialType !== request.credentialTypeConfirmation
    ) {
      return { ok: false };
    }
    const secret = normalizeSecret(request.credential);
    if (!secret) {
      return { ok: false };
    }
    const encrypted = this.input.encryption
      .encrypt(JSON.stringify({ apiKey: secret }))
      .toString("base64");
    const stored: StoredCloudProviderCredential = {
      schemaVersion: 1,
      bindingId: request.bindingId,
      credentialType: request.credentialTypeConfirmation,
      configured: true,
      encrypted,
      updatedAt: (this.input.now?.() ?? new Date()).toISOString(),
    };
    await mkdir(this.input.rootDirectory, { recursive: true });
    const target = this.filePath(request.bindingId);
    const temporary = `${target}.tmp`;
    await writeFile(temporary, `${JSON.stringify(stored, null, 2)}\n`, "utf8");
    await rename(temporary, target);
    return { ok: true };
  }

  public async delete(bindingId: CloudProviderCredentialBindingId): Promise<void> {
    await rm(this.filePath(bindingId), { force: true });
  }

  public async decryptForUse(
    bindingId: CloudProviderCredentialBindingId,
  ): Promise<string | null> {
    if (!this.input.encryption.isAvailable()) {
      return null;
    }
    const stored = await this.loadStored(bindingId);
    if (!stored) {
      return null;
    }
    if (stored.bindingId !== bindingId) {
      throw new Error("CLOUD_PROVIDER_CREDENTIAL_BINDING_MISMATCH");
    }
    const decrypted = this.input.encryption.decrypt(
      Buffer.from(stored.encrypted, "base64"),
    );
    const value = JSON.parse(decrypted) as { apiKey?: unknown };
    return normalizeSecret(value.apiKey);
  }

  private async loadStored(
    bindingId: CloudProviderCredentialBindingId,
  ): Promise<StoredCloudProviderCredential | null> {
    let rawFile: string;
    try {
      rawFile = await readFile(this.filePath(bindingId), "utf8");
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return null;
      }
      throw new Error("CLOUD_PROVIDER_CREDENTIAL_READ_FAILED");
    }
    return parseStored(JSON.parse(rawFile), bindingId);
  }

  private async isolateCorruptFile(
    bindingId: CloudProviderCredentialBindingId,
  ): Promise<void> {
    const source = this.filePath(bindingId);
    const target = `${source}.corrupt`;
    try {
      await rename(source, target);
    } catch {
      // Best-effort isolation; status remains fail-closed.
    }
  }

  private filePath(bindingId: CloudProviderCredentialBindingId): string {
    return path.join(this.input.rootDirectory, `${safeBindingFile(bindingId)}.json`);
  }
}

function parseStored(
  value: unknown,
  expectedBindingId: CloudProviderCredentialBindingId,
): StoredCloudProviderCredential {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.bindingId !== expectedBindingId ||
    value.credentialType !== CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE ||
    value.configured !== true ||
    typeof value.encrypted !== "string" ||
    value.encrypted.length === 0
  ) {
    throw new Error("CLOUD_PROVIDER_CREDENTIAL_INVALID");
  }
  return {
    schemaVersion: 1,
    bindingId: expectedBindingId,
    credentialType: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
    configured: true,
    encrypted: value.encrypted,
    ...(typeof value.updatedAt === "string" ? { updatedAt: value.updatedAt } : {}),
  };
}

function normalizeSecret(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length < 8 || trimmed.length > 1024 || /^Bearer\s+/iu.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function safeBindingFile(bindingId: CloudProviderCredentialBindingId): string {
  return bindingId.replace(/[^a-z0-9._-]/giu, "_");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
