import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  type VoiceRegressionConsentLevel,
  type VoiceRegressionRecord,
  VoiceRegressionConsentLevelSchema,
  VoiceRegressionRecordSchema,
} from "@jarvis-k/contracts";
import type { VoiceRegressionRepository } from "@jarvis-k/core";

interface VoiceRegressionState {
  version: 1;
  consentLevel: VoiceRegressionConsentLevel;
  records: VoiceRegressionRecord[];
}

export class JsonVoiceRegressionRepository
  implements VoiceRegressionRepository
{
  private initialized = false;
  private writeQueue: Promise<unknown> = Promise.resolve();

  public constructor(private readonly filePath: string) {}

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await this.withWriteLock(async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      await this.writeState(await this.readState());
    });
    this.initialized = true;
  }

  public async getConsentLevel(): Promise<VoiceRegressionConsentLevel> {
    await this.afterPendingWrites();
    return (await this.readState()).consentLevel;
  }

  public async setConsentLevel(
    level: VoiceRegressionConsentLevel,
  ): Promise<void> {
    await this.withWriteLock(async () => {
      const state = await this.readState();
      await this.writeState({
        ...state,
        consentLevel: VoiceRegressionConsentLevelSchema.parse(level),
      });
    });
  }

  public async countRecords(): Promise<number> {
    await this.afterPendingWrites();
    return (await this.readState()).records.length;
  }

  public async appendRecord(
    record: VoiceRegressionRecord,
  ): Promise<VoiceRegressionRecord> {
    const parsed = VoiceRegressionRecordSchema.parse(record);
    await this.withWriteLock(async () => {
      const state = await this.readState();
      await this.writeState({
        ...state,
        records: [...state.records, parsed].slice(-10_000),
      });
    });
    return parsed;
  }

  public async listRecords(options?: {
    limit?: number | undefined;
  }): Promise<VoiceRegressionRecord[]> {
    await this.afterPendingWrites();
    const records = (await this.readState()).records;
    const limit = options?.limit ?? records.length;
    return records.slice(-limit).reverse();
  }

  public async updateFeedback(input: {
    recordId: string;
    feedback: VoiceRegressionRecord["feedback"];
  }): Promise<VoiceRegressionRecord | undefined> {
    let updated: VoiceRegressionRecord | undefined;
    await this.withWriteLock(async () => {
      const state = await this.readState();
      const records = state.records.map((record) => {
        if (record.id !== input.recordId) {
          return record;
        }
        updated = VoiceRegressionRecordSchema.parse({
          ...record,
          feedback: input.feedback,
        });
        return updated;
      });
      if (!updated) {
        return;
      }
      await this.writeState({ ...state, records });
    });
    return updated;
  }

  public async deleteRecord(recordId: string): Promise<boolean> {
    let deleted = false;
    await this.withWriteLock(async () => {
      const state = await this.readState();
      const records = state.records.filter((record) => record.id !== recordId);
      deleted = records.length !== state.records.length;
      if (deleted) {
        await this.writeState({ ...state, records });
      }
    });
    return deleted;
  }

  public async clearRecords(): Promise<number> {
    let deletedCount = 0;
    await this.withWriteLock(async () => {
      const state = await this.readState();
      deletedCount = state.records.length;
      await this.writeState({ ...state, records: [] });
    });
    return deletedCount;
  }

  private async readState(): Promise<VoiceRegressionState> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<VoiceRegressionState>;
      return {
        version: 1,
        consentLevel: VoiceRegressionConsentLevelSchema.catch("off").parse(
          parsed.consentLevel,
        ),
        records: Array.isArray(parsed.records)
          ? parsed.records.map((record) =>
              VoiceRegressionRecordSchema.parse(record),
            )
          : [],
      };
    } catch (error) {
      if (isMissingFile(error)) {
        return { version: 1, consentLevel: "off", records: [] };
      }
      await this.quarantineCorruptState();
      return { version: 1, consentLevel: "off", records: [] };
    }
  }

  private async writeState(state: VoiceRegressionState): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(
      temporaryPath,
      `${JSON.stringify(
        {
          version: 1,
          consentLevel: VoiceRegressionConsentLevelSchema.parse(
            state.consentLevel,
          ),
          records: state.records.map((record) =>
            VoiceRegressionRecordSchema.parse(record),
          ),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    await rename(temporaryPath, this.filePath);
  }

  private async withWriteLock<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.writeQueue.catch(() => undefined);
    let release: (() => void) | undefined;
    this.writeQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release?.();
    }
  }

  private async afterPendingWrites(): Promise<void> {
    await this.writeQueue.catch(() => undefined);
  }

  private async quarantineCorruptState(): Promise<void> {
    const backupPath = `${this.filePath}.corrupt-${Date.now()}`;
    try {
      await rename(this.filePath, backupPath);
    } catch {
      // If quarantine cannot move the file, keep startup fail-closed to empty state.
    }
  }
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}
