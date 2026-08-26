import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
  CloudProviderAcceptanceLedgerProjectionSchema,
  type CloudProviderAcceptanceLedgerProjection,
  type CloudProviderAcceptanceProfile,
} from "@jarvis-k/contracts";

interface StoredLedger {
  readonly schemaVersion: 1;
  readonly records: StoredLedgerRecord[];
}

interface StoredLedgerRecord {
  readonly schemaVersion: 1;
  readonly acceptanceId: typeof CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID;
  readonly acceptanceVersion: typeof CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION;
  readonly providerId: typeof CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID;
  readonly modelId: typeof CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID;
  readonly state: "consumed";
  readonly attemptedAt: string;
  readonly completedAt?: string;
  readonly sanitizedResultCategory?: string;
  readonly requestCount: 1;
  readonly consumed: true;
}

export class CloudProviderAcceptanceLedger {
  private lock: Promise<unknown> = Promise.resolve();

  public constructor(
    private readonly input: {
      readonly ledgerPath: string;
      readonly now?: () => Date;
    },
  ) {}

  public async projection(
    profile: CloudProviderAcceptanceProfile,
  ): Promise<CloudProviderAcceptanceLedgerProjection> {
    const ledger = await this.load();
    const record = ledger.records.find(
      (item) => item.acceptanceId === profile.acceptanceId,
    );
    return CloudProviderAcceptanceLedgerProjectionSchema.parse(
      record
        ? {
            acceptanceId: profile.acceptanceId,
            acceptanceVersion: profile.acceptanceVersion,
            providerId: profile.providerId,
            modelId: profile.modelId,
            state: "consumed",
            consumed: true,
            requestCount: 1,
            attemptedAt: record.attemptedAt,
            ...(record.completedAt ? { completedAt: record.completedAt } : {}),
            ...(record.sanitizedResultCategory
              ? { sanitizedResultCategory: record.sanitizedResultCategory }
              : {}),
          }
        : {
            acceptanceId: profile.acceptanceId,
            acceptanceVersion: profile.acceptanceVersion,
            providerId: profile.providerId,
            modelId: profile.modelId,
            state: "ready",
            consumed: false,
            requestCount: 0,
            sanitizedResultCategory: "not_run",
          },
    );
  }

  public consume(
    profile: CloudProviderAcceptanceProfile,
  ): Promise<CloudProviderAcceptanceLedgerProjection> {
    return this.serial(async () => {
      const ledger = await this.load();
      const existing = ledger.records.find(
        (item) => item.acceptanceId === profile.acceptanceId,
      );
      if (existing) {
        return this.projection(profile);
      }
      const now = (this.input.now?.() ?? new Date()).toISOString();
      const next: StoredLedger = {
        schemaVersion: 1,
        records: [
          ...ledger.records,
          {
            schemaVersion: 1,
            acceptanceId: profile.acceptanceId,
            acceptanceVersion: profile.acceptanceVersion,
            providerId: profile.providerId,
            modelId: profile.modelId,
            state: "consumed",
            attemptedAt: now,
            requestCount: 1,
            consumed: true,
          },
        ],
      };
      await this.persist(next);
      return this.projection(profile);
    });
  }

  public complete(
    profile: CloudProviderAcceptanceProfile,
    input: { readonly completedAt: string; readonly sanitizedResultCategory: string },
  ): Promise<void> {
    return this.serial(async () => {
      const ledger = await this.load();
      const records = ledger.records.map((record) =>
        record.acceptanceId === profile.acceptanceId
          ? {
              ...record,
              completedAt: input.completedAt,
              sanitizedResultCategory: input.sanitizedResultCategory,
            }
          : record,
      );
      await this.persist({ schemaVersion: 1, records });
    });
  }

  private async serial<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.lock.then(operation, operation);
    this.lock = next.catch(() => undefined);
    return next;
  }

  private async load(): Promise<StoredLedger> {
    let rawFile: string;
    try {
      rawFile = await readFile(this.input.ledgerPath, "utf8");
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return { schemaVersion: 1, records: [] };
      }
      return { schemaVersion: 1, records: [] };
    }
    try {
      return parseLedger(JSON.parse(rawFile));
    } catch {
      await this.isolateCorruptLedger();
      return { schemaVersion: 1, records: [] };
    }
  }

  private async persist(ledger: StoredLedger): Promise<void> {
    await mkdir(path.dirname(this.input.ledgerPath), { recursive: true });
    const temporary = `${this.input.ledgerPath}.tmp`;
    await writeFile(temporary, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
    await rename(temporary, this.input.ledgerPath);
  }

  private async isolateCorruptLedger(): Promise<void> {
    try {
      await rename(this.input.ledgerPath, `${this.input.ledgerPath}.corrupt`);
    } catch {
      // Fail closed to an empty in-memory projection if isolation fails.
    }
  }
}

function parseLedger(value: unknown): StoredLedger {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.records)) {
    throw new Error("CLOUD_PROVIDER_ACCEPTANCE_LEDGER_INVALID");
  }
  return {
    schemaVersion: 1,
    records: value.records.map(parseRecord),
  };
}

function parseRecord(value: unknown): StoredLedgerRecord {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.acceptanceId !== CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID ||
    value.acceptanceVersion !== CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION ||
    value.providerId !== CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID ||
    value.modelId !== CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID ||
    value.state !== "consumed" ||
    typeof value.attemptedAt !== "string" ||
    value.requestCount !== 1 ||
    value.consumed !== true
  ) {
    throw new Error("CLOUD_PROVIDER_ACCEPTANCE_LEDGER_RECORD_INVALID");
  }
  return {
    schemaVersion: 1,
    acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
    acceptanceVersion: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
    providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
    modelId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
    state: "consumed",
    attemptedAt: value.attemptedAt,
    ...(typeof value.completedAt === "string" ? { completedAt: value.completedAt } : {}),
    ...(typeof value.sanitizedResultCategory === "string"
      ? { sanitizedResultCategory: value.sanitizedResultCategory }
      : {}),
    requestCount: 1,
    consumed: true,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
