import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  UserRouteAliasRecord,
  UserRouteAliasRecordSchema,
} from "@jarvis-k/contracts";
import type { UserRouteAliasRepository } from "@jarvis-k/core";

interface UserRouteAliasState {
  version: 1;
  aliases: UserRouteAliasRecord[];
}

export class JsonUserRouteAliasRepository
  implements UserRouteAliasRepository
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

  public async listAliases(): Promise<UserRouteAliasRecord[]> {
    const state = await this.readState();
    return state.aliases.map((alias) => UserRouteAliasRecordSchema.parse(alias));
  }

  public async upsertAlias(
    input: UserRouteAliasRecord,
  ): Promise<UserRouteAliasRecord> {
    const alias = UserRouteAliasRecordSchema.parse(input);
    const state = await this.readState();
    const nextAliases = state.aliases.filter(
      (candidate) =>
        candidate.id !== alias.id &&
        candidate.label.toLowerCase() !== alias.label.toLowerCase(),
    );
    nextAliases.push(alias);
    await this.writeState({ version: 1, aliases: nextAliases });
    return alias;
  }

  public async deleteAlias(aliasId: string): Promise<boolean> {
    const state = await this.readState();
    const nextAliases = state.aliases.filter((alias) => alias.id !== aliasId);
    const deleted = nextAliases.length !== state.aliases.length;
    if (deleted) {
      await this.writeState({ ...state, aliases: nextAliases });
    }
    return deleted;
  }

  private async readState(): Promise<UserRouteAliasState> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<UserRouteAliasState>;
      return {
        version: 1,
        aliases: Array.isArray(parsed.aliases)
          ? parsed.aliases.map((alias) =>
              UserRouteAliasRecordSchema.parse(alias),
            )
          : [],
      };
    } catch {
      return { version: 1, aliases: [] };
    }
  }

  private async writeState(state: UserRouteAliasState): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(
      this.filePath,
      `${JSON.stringify(
        {
          version: 1,
          aliases: state.aliases.map((alias) =>
            UserRouteAliasRecordSchema.parse(alias),
          ),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  }
}
