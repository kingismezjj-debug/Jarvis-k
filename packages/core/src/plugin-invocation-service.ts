import type {
  PluginRegistry,
  PluginRuntime,
} from "@jarvis-k/capabilities";
import type {
  PluginInvocationRequest,
  PluginInvocationResult,
  PluginInvocationResultCode,
  PluginManifest,
} from "@jarvis-k/contracts";
import {
  PluginInvocationRequestSchema,
  PluginInvocationResultSchema,
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
      errorClass?: PluginInvocationErrorClass | undefined;
      summary: string;
    };

export type PluginInvocationErrorClass =
  | "not_found"
  | "capability_not_found"
  | "disabled"
  | "input_invalid"
  | "timeout"
  | "unavailable"
  | "permission_denied"
  | "execution_failed"
  | "output_invalid";

export type PluginInvocationOutcome =
  | {
      ok: true;
      verified: boolean;
      request: PluginInvocationRequest;
      result: PluginInvocationResult;
      summary: string;
      executionSemantics: "executed" | "simulated";
      errorClass?: undefined;
    }
  | {
      ok: false;
      verified: false;
      request?: PluginInvocationRequest | undefined;
      result?: PluginInvocationResult | undefined;
      summary: string;
      resultCode: PluginInvocationResultCode;
      errorClass: PluginInvocationErrorClass;
      executionSemantics: "not_executed" | "simulated" | "executed";
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
        errorClass: "disabled",
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

  public async invoke(input: {
    requestId: string;
    pluginId: string;
    capability: string;
    input: Record<string, unknown>;
    dryRun?: boolean | undefined;
    timeoutMs?: number | undefined;
  }): Promise<PluginInvocationOutcome> {
    const request = PluginInvocationRequestSchema.safeParse({
      requestId: input.requestId,
      pluginId: input.pluginId,
      capability: input.capability,
      input: input.input,
      dryRun: input.dryRun ?? false,
    });
    if (!request.success) {
      return {
        ok: false,
        verified: false,
        summary:
          "Plugin invocation blocked because the plugin request failed contract validation.",
        resultCode: "PLUGIN_INPUT_INVALID",
        errorClass: "input_invalid",
        executionSemantics: "not_executed",
      };
    }

    const gate = await this.evaluateInvocationGate({
      pluginId: request.data.pluginId,
      capability: request.data.capability,
    });
    if (!gate.allowed) {
      return {
        ok: false,
        verified: false,
        request: request.data,
        summary: gate.summary,
        resultCode: gate.resultCode,
        errorClass: gate.errorClass ?? this.errorClassForResultCode(gate.resultCode),
        executionSemantics: "not_executed",
      };
    }

    if (!this.pluginRuntime) {
      return {
        ok: false,
        verified: false,
        request: request.data,
        summary:
          "Plugin invocation blocked because the Plugin Runtime is unavailable.",
        resultCode: "PLUGIN_RUNTIME_UNAVAILABLE",
        errorClass: "unavailable",
        executionSemantics: "not_executed",
      };
    }

    let rawResult: unknown;
    try {
      rawResult =
        input.timeoutMs !== undefined
          ? await withTimeout(
              this.pluginRuntime.invoke(request.data),
              input.timeoutMs,
            )
          : await this.pluginRuntime.invoke(request.data);
    } catch (error) {
      const timedOut = error instanceof PluginInvocationTimeoutError;
      return {
        ok: false,
        verified: false,
        request: request.data,
        summary: timedOut
          ? "Plugin invocation timed out before sanitized output could be verified."
          : "Plugin invocation failed before sanitized output could be verified.",
        resultCode: "PLUGIN_EXECUTION_FAILED",
        errorClass: timedOut ? "timeout" : "execution_failed",
        executionSemantics: "executed",
      };
    }

    const result = PluginInvocationResultSchema.safeParse(rawResult);
    if (!result.success) {
      return {
        ok: false,
        verified: false,
        request: request.data,
        summary:
          "Plugin invocation failed output validation before sanitized UI projection.",
        resultCode: "PLUGIN_OUTPUT_INVALID",
        errorClass: "output_invalid",
        executionSemantics: "executed",
      };
    }

    const verified =
      result.data.status === "completed" &&
      result.data.directActionAttempted === false &&
      result.data.credentialExposed === false &&
      result.data.rawPluginOutputPersisted === false;
    const executionSemantics = request.data.dryRun ? "simulated" : "executed";
    const summary = this.summarizeInvocationResult(result.data, verified);
    if (!verified) {
      return {
        ok: false,
        verified: false,
        request: request.data,
        result: result.data,
        summary,
        resultCode: result.data.resultCode,
        errorClass: this.errorClassForResultCode(result.data.resultCode),
        executionSemantics,
      };
    }
    return {
      ok: true,
      verified: true,
      request: request.data,
      result: result.data,
      summary,
      executionSemantics,
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

  private errorClassForResultCode(
    resultCode: PluginInvocationResultCode,
  ): PluginInvocationErrorClass {
    switch (resultCode) {
      case "PLUGIN_NOT_FOUND":
        return "not_found";
      case "PLUGIN_CAPABILITY_NOT_FOUND":
        return "capability_not_found";
      case "PLUGIN_PERMISSION_DENIED":
        return "permission_denied";
      case "PLUGIN_RUNTIME_UNAVAILABLE":
        return "unavailable";
      case "PLUGIN_INPUT_INVALID":
        return "input_invalid";
      case "PLUGIN_OUTPUT_INVALID":
        return "output_invalid";
      case "PLUGIN_EXECUTION_FAILED":
        return "execution_failed";
      case "PLUGIN_DRY_RUN":
        return "disabled";
      case "PLUGIN_INVOKED":
        return "execution_failed";
    }
  }
}

class PluginInvocationTimeoutError extends Error {
  public constructor() {
    super("Plugin invocation timed out.");
    this.name = "PluginInvocationTimeoutError";
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new PluginInvocationTimeoutError()),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
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
