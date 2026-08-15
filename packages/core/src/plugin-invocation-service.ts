import type {
  PluginRegistry,
  PluginRuntime,
} from "@jarvis-k/capabilities";
import type {
  PluginInvocationResult,
  PluginManifest,
} from "@jarvis-k/contracts";

export interface PluginInvocationLocalStateRepository {
  initialize(): Promise<void>;
  getState(pluginId: string): Promise<{ enabled: boolean } | undefined>;
}

export interface PluginInvocationServiceOptions {
  pluginRegistry?: PluginRegistry | undefined;
  pluginRuntime?: PluginRuntime | undefined;
  localPluginStateRepository?: PluginInvocationLocalStateRepository | undefined;
  ensureLocalPluginStateRepositoryInitialized: () => Promise<void>;
}

export type PluginInvocationGateResult =
  | {
      allowed: true;
      summary: string;
    }
  | {
      allowed: false;
      resultCode:
        | "PLUGIN_NOT_FOUND"
        | "PLUGIN_CAPABILITY_NOT_FOUND"
        | "PLUGIN_PERMISSION_DENIED"
        | "PLUGIN_RUNTIME_UNAVAILABLE";
      summary: string;
    };

export class PluginInvocationService {
  private readonly pluginRegistry: PluginRegistry | undefined;
  private readonly pluginRuntime: PluginRuntime | undefined;
  private readonly localPluginStateRepository:
    | PluginInvocationLocalStateRepository
    | undefined;
  private readonly ensureLocalPluginStateRepositoryInitialized: () => Promise<void>;

  public constructor(options: PluginInvocationServiceOptions) {
    this.pluginRegistry = options.pluginRegistry;
    this.pluginRuntime = options.pluginRuntime;
    this.localPluginStateRepository = options.localPluginStateRepository;
    this.ensureLocalPluginStateRepositoryInitialized =
      options.ensureLocalPluginStateRepositoryInitialized;
  }

  public async evaluateInvocationGate(input: {
    pluginId: string;
    capability: string;
  }): Promise<PluginInvocationGateResult> {
    if (!this.pluginRegistry || !this.pluginRuntime) {
      return {
        allowed: false,
        resultCode: "PLUGIN_RUNTIME_UNAVAILABLE",
        summary:
          "Plugin invocation blocked because the Plugin Registry or Runtime is unavailable.",
      };
    }

    const manifest = await this.pluginRegistry.getPlugin(input.pluginId);
    if (!manifest) {
      return {
        allowed: false,
        resultCode: "PLUGIN_NOT_FOUND",
        summary:
          "Plugin invocation blocked because the requested plugin is not registered.",
      };
    }

    if (
      !manifest.capabilities.some(
        (capability) => capability.name === input.capability,
      )
    ) {
      return {
        allowed: false,
        resultCode: "PLUGIN_CAPABILITY_NOT_FOUND",
        summary:
          "Plugin invocation blocked because the requested capability is not declared by the plugin manifest.",
      };
    }

    const executablePluginIds = new Set(
      this.pluginRuntime.listExecutablePluginIds
        ? await this.pluginRuntime.listExecutablePluginIds()
        : [],
    );
    if (!executablePluginIds.has(input.pluginId)) {
      return {
        allowed: false,
        resultCode: "PLUGIN_RUNTIME_UNAVAILABLE",
        summary:
          "Plugin invocation blocked because no controlled runtime is available for this plugin.",
      };
    }

    const localReadOnlyPluginIds = new Set(
      this.pluginRuntime.listLocalReadOnlyPluginIds
        ? await this.pluginRuntime.listLocalReadOnlyPluginIds()
        : [],
    );
    if (!localReadOnlyPluginIds.has(input.pluginId)) {
      return {
        allowed: true,
        summary: "Bundled read-only plugin runtime allowed.",
      };
    }

    if (!canEnableLocalPluginState(manifest)) {
      return {
        allowed: false,
        resultCode: "PLUGIN_PERMISSION_DENIED",
        summary:
          "Local read-only plugin invocation blocked because the manifest does not satisfy the no-permission read-only policy.",
      };
    }
    if (!this.localPluginStateRepository) {
      return {
        allowed: false,
        resultCode: "PLUGIN_PERMISSION_DENIED",
        summary:
          "Local read-only plugin invocation blocked because the local plugin state store is unavailable.",
      };
    }

    await this.ensureLocalPluginStateRepositoryInitialized();
    const state = await this.localPluginStateRepository.getState(
      input.pluginId,
    );
    if (state?.enabled !== true) {
      return {
        allowed: false,
        resultCode: "PLUGIN_PERMISSION_DENIED",
        summary:
          "Local read-only plugin invocation blocked because the plugin is not enabled in the local state store.",
      };
    }

    return {
      allowed: true,
      summary:
        "Local read-only plugin invocation allowed by manifest policy and persisted enabled state.",
    };
  }

  public summarizeInvocationResult(
    result: PluginInvocationResult,
    verified: boolean,
  ): string {
    if (!verified) {
      return `Plugin invocation was blocked or unverified: ${result.resultCode}.`;
    }
    const firstItem = result.output?.items[0];
    const firstField = firstItem?.fields[0];
    const fieldSummary =
      firstItem && firstField
        ? ` ${firstItem.title}: ${firstField.label} ${String(firstField.value)}.`
        : "";
    const summary = `Plugin Runtime invoked ${result.capability}; sanitized output verified. ${result.output?.summary ?? "No plugin output summary."}${fieldSummary}`;
    return summary.length <= 500 ? summary : `${summary.slice(0, 497)}...`;
  }
}

export function canEnableLocalPluginState(manifest: PluginManifest): boolean {
  return (
    manifest.permissions.length === 0 &&
    manifest.capabilities.every(
      (capability) =>
        capability.readOnly === true && capability.risk === "read_only",
    )
  );
}
