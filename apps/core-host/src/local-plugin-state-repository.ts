import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  LocalPluginEnabledStateRecord,
  LocalPluginStateRepository,
} from "@jarvis-k/core";

const PLUGIN_ID_PATTERN = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*){2,}$/u;

interface LocalPluginStateFile {
  version: 1;
  plugins: Record<string, { enabled: boolean; updatedAt: string }>;
}

export class JsonLocalPluginStateRepository implements LocalPluginStateRepository {
  private initialized = false;
  private state: LocalPluginStateFile = {
    version: 1,
    plugins: {},
  };

  public constructor(private readonly filePath: string) {}

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.state = await this.readStateFile();
    this.initialized = true;
  }

  public async getState(
    pluginId: string,
  ): Promise<LocalPluginEnabledStateRecord | undefined> {
    await this.initialize();
    const record = this.state.plugins[pluginId];
    if (!record || !PLUGIN_ID_PATTERN.test(pluginId)) {
      return undefined;
    }
    return {
      pluginId,
      enabled: record.enabled,
      updatedAt: record.updatedAt,
    };
  }

  public async setState(
    input: LocalPluginEnabledStateRecord,
  ): Promise<LocalPluginEnabledStateRecord> {
    await this.initialize();
    if (!PLUGIN_ID_PATTERN.test(input.pluginId)) {
      throw new Error("LOCAL_PLUGIN_STATE_PLUGIN_ID_INVALID");
    }
    const record = {
      enabled: input.enabled,
      updatedAt: input.updatedAt,
    };
    this.state = {
      version: 1,
      plugins: {
        ...this.state.plugins,
        [input.pluginId]: record,
      },
    };
    await this.writeStateFile();
    return {
      pluginId: input.pluginId,
      ...record,
    };
  }

  private async readStateFile(): Promise<LocalPluginStateFile> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, "utf8"));
      if (
        !isRecord(parsed) ||
        parsed.version !== 1 ||
        !isRecord(parsed.plugins)
      ) {
        return { version: 1, plugins: {} };
      }
      const plugins: LocalPluginStateFile["plugins"] = {};
      for (const [pluginId, rawRecord] of Object.entries(parsed.plugins)) {
        if (
          PLUGIN_ID_PATTERN.test(pluginId) &&
          isRecord(rawRecord) &&
          typeof rawRecord.enabled === "boolean" &&
          typeof rawRecord.updatedAt === "string" &&
          !Number.isNaN(Date.parse(rawRecord.updatedAt))
        ) {
          plugins[pluginId] = {
            enabled: rawRecord.enabled,
            updatedAt: new Date(rawRecord.updatedAt).toISOString(),
          };
        }
      }
      return { version: 1, plugins };
    } catch {
      return { version: 1, plugins: {} };
    }
  }

  private async writeStateFile(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(
      this.filePath,
      `${JSON.stringify(this.state, null, 2)}\n`,
      "utf8",
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
