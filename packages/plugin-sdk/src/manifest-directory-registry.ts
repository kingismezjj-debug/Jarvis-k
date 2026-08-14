import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  LocalPluginManifestDeveloperStatusResultSchema,
  PluginManifestSchema,
  type LocalPluginManifestDeveloperStatusResult,
  type LocalPluginManifestDirectoryStatus,
  type PluginManifest,
} from "@jarvis-k/contracts";
import type {
  LocalPluginManifestDeveloperDiagnostics,
  PluginRegistry,
} from "@jarvis-k/capabilities";

export interface ManifestDirectoryPluginRegistryOptions {
  directories: readonly string[];
  rootDirectory?: string;
  maxDirectories?: number;
}

export interface ManifestDirectoryDeveloperDiagnosticsOptions extends ManifestDirectoryPluginRegistryOptions {
  enabled?: boolean;
  now?: () => Date;
}

export class ManifestDirectoryPluginRegistry implements PluginRegistry {
  private readonly directories: string[];
  private readonly rootDirectory: string;

  public constructor(options: ManifestDirectoryPluginRegistryOptions) {
    this.rootDirectory = path.resolve(options.rootDirectory ?? process.cwd());
    const maxDirectories = Math.max(
      1,
      Math.min(options.maxDirectories ?? 16, 16),
    );
    this.directories = options.directories
      .map((directory) => path.resolve(this.rootDirectory, directory))
      .slice(0, maxDirectories);
  }

  public async listPlugins(): Promise<PluginManifest[]> {
    const plugins: PluginManifest[] = [];
    for (const directory of this.directories) {
      const manifest = await this.readPluginManifest(directory);
      if (manifest) {
        plugins.push(manifest);
      }
    }
    return plugins;
  }

  public async getPlugin(
    pluginId: string,
  ): Promise<PluginManifest | undefined> {
    const plugins = await this.listPlugins();
    return plugins.find((plugin) => plugin.id === pluginId);
  }

  private async readPluginManifest(
    directory: string,
  ): Promise<PluginManifest | undefined> {
    const manifestPath = path.join(directory, "manifest.json");
    try {
      const manifestStats = await stat(manifestPath);
      if (!manifestStats.isFile()) {
        return undefined;
      }
      const parsed = PluginManifestSchema.parse(
        JSON.parse(await readFile(manifestPath, "utf8")),
      );
      for (const capability of parsed.capabilities) {
        await this.assertSchemaReadable(directory, capability.inputSchema);
        await this.assertSchemaReadable(directory, capability.outputSchema);
      }
      return cloneManifest(parsed);
    } catch {
      return undefined;
    }
  }

  private async assertSchemaReadable(
    pluginRoot: string,
    schemaPath: string,
  ): Promise<void> {
    const resolved = path.resolve(pluginRoot, schemaPath);
    const relative = path.relative(pluginRoot, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("PLUGIN_SCHEMA_PATH_OUTSIDE_ROOT");
    }
    const schemaStats = await stat(resolved);
    if (!schemaStats.isFile()) {
      throw new Error("PLUGIN_SCHEMA_NOT_FILE");
    }
    JSON.parse(await readFile(resolved, "utf8"));
  }
}

export class CompositePluginRegistry implements PluginRegistry {
  public constructor(private readonly registries: readonly PluginRegistry[]) {}

  public async listPlugins(): Promise<PluginManifest[]> {
    const byId = new Map<string, PluginManifest>();
    for (const registry of this.registries) {
      for (const plugin of await registry.listPlugins()) {
        if (!byId.has(plugin.id)) {
          byId.set(plugin.id, cloneManifest(plugin));
        }
      }
    }
    return [...byId.values()];
  }

  public async getPlugin(
    pluginId: string,
  ): Promise<PluginManifest | undefined> {
    for (const registry of this.registries) {
      const plugin = await registry.getPlugin(pluginId);
      if (plugin) {
        return cloneManifest(plugin);
      }
    }
    return undefined;
  }
}

export class ManifestDirectoryDeveloperDiagnostics implements LocalPluginManifestDeveloperDiagnostics {
  private readonly directories: string[];
  private readonly enabled: boolean;
  private readonly now: () => Date;
  private readonly rootDirectory: string;

  public constructor(options: ManifestDirectoryDeveloperDiagnosticsOptions) {
    this.enabled = options.enabled ?? true;
    this.now = options.now ?? (() => new Date());
    this.rootDirectory = path.resolve(options.rootDirectory ?? process.cwd());
    const maxDirectories = Math.max(
      1,
      Math.min(options.maxDirectories ?? 16, 16),
    );
    this.directories = options.directories
      .map((directory) => path.resolve(this.rootDirectory, directory))
      .slice(0, maxDirectories);
  }

  public async getStatus(): Promise<LocalPluginManifestDeveloperStatusResult> {
    if (!this.enabled) {
      return this.parseStatus({
        discoveryStatus: "disabled",
        enabled: false,
        configuredDirectoryCount: 0,
        scannedDirectoryCount: 0,
        validManifestCount: 0,
        invalidManifestCount: 0,
        directories: [],
        reasonCodes: ["LOCAL_MANIFEST_DISCOVERY_DISABLED"],
      });
    }

    if (this.directories.length === 0) {
      return this.parseStatus({
        discoveryStatus: "not_configured",
        enabled: true,
        configuredDirectoryCount: 0,
        scannedDirectoryCount: 0,
        validManifestCount: 0,
        invalidManifestCount: 0,
        directories: [],
        reasonCodes: ["LOCAL_MANIFEST_DIRECTORIES_NOT_CONFIGURED"],
      });
    }

    const directories: LocalPluginManifestDirectoryStatus[] = [];
    for (const [index, directory] of this.directories.entries()) {
      directories.push(await this.inspectDirectory(directory, index));
    }

    const validManifestCount = directories.filter(
      (directory) =>
        directory.state === "discovered" &&
        directory.manifestValid &&
        directory.schemaValid,
    ).length;
    const invalidManifestCount = directories.filter((directory) =>
      ["invalid", "unreadable"].includes(directory.state),
    ).length;

    return this.parseStatus({
      discoveryStatus:
        invalidManifestCount > 0 || validManifestCount < directories.length
          ? "degraded"
          : "configured",
      enabled: true,
      configuredDirectoryCount: this.directories.length,
      scannedDirectoryCount: directories.length,
      validManifestCount,
      invalidManifestCount,
      directories,
      reasonCodes:
        invalidManifestCount > 0
          ? ["LOCAL_MANIFEST_DISCOVERY_DEGRADED"]
          : ["LOCAL_MANIFEST_DISCOVERY_CONFIGURED"],
    });
  }

  private async inspectDirectory(
    directory: string,
    index: number,
  ): Promise<LocalPluginManifestDirectoryStatus> {
    const directoryRef = formatDirectoryRef(index);
    const manifestPath = path.join(directory, "manifest.json");
    try {
      const manifestStats = await stat(manifestPath);
      if (!manifestStats.isFile()) {
        return createDirectoryStatus(directoryRef, {
          state: "invalid",
          manifestPresent: true,
          issueCodes: ["MANIFEST_NOT_FILE"],
        });
      }
    } catch {
      return createDirectoryStatus(directoryRef, {
        state: "empty",
        issueCodes: ["MANIFEST_MISSING"],
      });
    }

    let manifestJson: unknown;
    try {
      manifestJson = JSON.parse(await readFile(manifestPath, "utf8"));
    } catch {
      return createDirectoryStatus(directoryRef, {
        state: "invalid",
        manifestPresent: true,
        issueCodes: ["MANIFEST_JSON_INVALID"],
      });
    }

    const manifest = PluginManifestSchema.safeParse(manifestJson);
    if (!manifest.success) {
      return createDirectoryStatus(directoryRef, {
        state: "invalid",
        manifestPresent: true,
        issueCodes: ["MANIFEST_SCHEMA_INVALID"],
      });
    }

    const issueCodes: string[] = [];
    for (const capability of manifest.data.capabilities) {
      issueCodes.push(
        ...(await this.inspectSchemaFile(
          directory,
          capability.inputSchema,
          "INPUT_SCHEMA",
        )),
      );
      issueCodes.push(
        ...(await this.inspectSchemaFile(
          directory,
          capability.outputSchema,
          "OUTPUT_SCHEMA",
        )),
      );
    }

    return createDirectoryStatus(directoryRef, {
      state: issueCodes.length > 0 ? "invalid" : "discovered",
      manifestPresent: true,
      manifestValid: true,
      schemaValid: issueCodes.length === 0,
      pluginId: manifest.data.id,
      pluginName: manifest.data.name,
      capabilityCount: manifest.data.capabilities.length,
      permissionCount: manifest.data.permissions.length,
      issueCodes,
    });
  }

  private async inspectSchemaFile(
    pluginRoot: string,
    schemaPath: string,
    issuePrefix: "INPUT_SCHEMA" | "OUTPUT_SCHEMA",
  ): Promise<string[]> {
    const resolved = path.resolve(pluginRoot, schemaPath);
    const relative = path.relative(pluginRoot, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return [`${issuePrefix}_PATH_OUTSIDE_ROOT`];
    }
    try {
      const schemaStats = await stat(resolved);
      if (!schemaStats.isFile()) {
        return [`${issuePrefix}_NOT_FILE`];
      }
    } catch {
      return [`${issuePrefix}_MISSING`];
    }
    try {
      JSON.parse(await readFile(resolved, "utf8"));
      return [];
    } catch {
      return [`${issuePrefix}_JSON_INVALID`];
    }
  }

  private parseStatus(
    input: Omit<
      LocalPluginManifestDeveloperStatusResult,
      | "checkedAt"
      | "rawPathsExposed"
      | "thirdPartyCodeExecuted"
      | "marketplaceAccessed"
      | "installOrEnableActionExposed"
      | "stateToggleActionExposed"
    >,
  ): LocalPluginManifestDeveloperStatusResult {
    return LocalPluginManifestDeveloperStatusResultSchema.parse({
      ...input,
      checkedAt: this.now().toISOString(),
      rawPathsExposed: false,
      thirdPartyCodeExecuted: false,
      marketplaceAccessed: false,
      installOrEnableActionExposed: false,
      stateToggleActionExposed:
        input.enabled && input.configuredDirectoryCount > 0,
    });
  }
}

function cloneManifest(manifest: PluginManifest): PluginManifest {
  return PluginManifestSchema.parse({
    ...manifest,
    capabilities: manifest.capabilities.map((capability) => ({
      ...capability,
    })),
    permissions: [...manifest.permissions],
  });
}

function formatDirectoryRef(index: number): string {
  return `local-plugin-dir-${String(index + 1).padStart(2, "0")}`;
}

function createDirectoryStatus(
  directoryRef: string,
  overrides: Partial<LocalPluginManifestDirectoryStatus>,
): LocalPluginManifestDirectoryStatus {
  return {
    directoryRef,
    state: "empty",
    manifestPresent: false,
    manifestValid: false,
    schemaValid: false,
    capabilityCount: 0,
    permissionCount: 0,
    ...overrides,
    issueCodes: [...new Set(overrides.issueCodes ?? [])].slice(0, 16),
  };
}
