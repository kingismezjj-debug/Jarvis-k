import { mkdir, readFile, writeFile } from "node:fs/promises";
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

  public constructor(private readonly filePath: string) {}

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await this.writeState(await this.readState());
    this.initialized = true;
  }

  public async getConsentLevel(): Promise<VoiceRegressionConsentLevel> {
    return (await this.readState()).consentLevel;
  }

  public async setConsentLevel(
    level: VoiceRegressionConsentLevel,
  ): Promise<void> {
    const state = await this.readState();
    await this.writeState({
      ...state,
      consentLevel: VoiceRegressionConsentLevelSchema.parse(level),
    });
  }

  public async countRecords(): Promise<number> {
    return (await this.readState()).records.length;
  }

  public async appendRecord(
    record: VoiceRegressionRecord,
  ): Promise<VoiceRegressionRecord> {
    const parsed = VoiceRegressionRecordSchema.parse(record);
    const state = await this.readState();
    await this.writeState({
      ...state,
      records: [...state.records, parsed].slice(-10_000),
    });
    return parsed;
  }

  public async listRecords(options?: {
    limit?: number | undefined;
  }): Promise<VoiceRegressionRecord[]> {
    const records = (await this.readState()).records;
    const limit = options?.limit ?? records.length;
    return records.slice(-limit).reverse();
  }

  public async updateFeedback(input: {
    recordId: string;
    feedback: VoiceRegressionRecord["feedback"];
  }): Promise<VoiceRegressionRecord | undefined> {
    const state = await this.readState();
    let updated: VoiceRegressionRecord | undefined;
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
      return undefined;
    }
    await this.writeState({ ...state, records });
    return updated;
  }

  public async deleteRecord(recordId: string): Promise<boolean> {
    const state = await this.readState();
    const records = state.records.filter((record) => record.id !== recordId);
    const deleted = records.length !== state.records.length;
    if (deleted) {
      await this.writeState({ ...state, records });
    }
    return deleted;
  }

  public async clearRecords(): Promise<number> {
    const state = await this.readState();
    const deletedCount = state.records.length;
    await this.writeState({ ...state, records: [] });
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
    } catch {
      return { version: 1, consentLevel: "off", records: [] };
    }
  }

  private async writeState(state: VoiceRegressionState): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(
      this.filePath,
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
  }
}
