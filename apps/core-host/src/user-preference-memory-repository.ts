import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  UserPreferenceMemoryRecord,
  UserPreferenceMemoryRecordSchema,
} from "@jarvis-k/contracts";
import type { UserPreferenceMemoryRepository } from "@jarvis-k/core";

interface UserPreferenceMemoryState {
  version: 1;
  preferences: UserPreferenceMemoryRecord[];
}

export class JsonUserPreferenceMemoryRepository
  implements UserPreferenceMemoryRepository
{
  private initialized = false;

  public constructor(private readonly filePath: string) {}

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const state = await this.readState();
    await this.writeState(state);
    this.initialized = true;
  }

  public async listPreferences(): Promise<UserPreferenceMemoryRecord[]> {
    const state = await this.readState();
    return state.preferences.map((preference) =>
      UserPreferenceMemoryRecordSchema.parse(preference),
    );
  }

  public async upsertPreference(
    input: UserPreferenceMemoryRecord,
  ): Promise<UserPreferenceMemoryRecord> {
    const preference = UserPreferenceMemoryRecordSchema.parse(input);
    const state = await this.readState();
    const nextPreferences = state.preferences.filter(
      (candidate) =>
        candidate.id !== preference.id && candidate.key !== preference.key,
    );
    nextPreferences.push(preference);
    await this.writeState({ version: 1, preferences: nextPreferences });
    return preference;
  }

  public async deletePreference(preferenceId: string): Promise<boolean> {
    const state = await this.readState();
    const nextPreferences = state.preferences.filter(
      (preference) => preference.id !== preferenceId,
    );
    const deleted = nextPreferences.length !== state.preferences.length;
    if (deleted) {
      await this.writeState({ ...state, preferences: nextPreferences });
    }
    return deleted;
  }

  private async readState(): Promise<UserPreferenceMemoryState> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<UserPreferenceMemoryState>;
      return {
        version: 1,
        preferences: Array.isArray(parsed.preferences)
          ? parsed.preferences.map((preference) =>
              UserPreferenceMemoryRecordSchema.parse(preference),
            )
          : [],
      };
    } catch {
      return { version: 1, preferences: [] };
    }
  }

  private async writeState(state: UserPreferenceMemoryState): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(
      this.filePath,
      `${JSON.stringify(
        {
          version: 1,
          preferences: state.preferences.map((preference) =>
            UserPreferenceMemoryRecordSchema.parse(preference),
          ),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  }
}
