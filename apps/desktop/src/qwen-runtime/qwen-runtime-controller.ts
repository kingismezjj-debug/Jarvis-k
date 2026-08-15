import { existsSync, readFileSync } from "node:fs";
import {
  createCommandRouterQwenProductRoutingActivationStatus,
  QwenRuntimeControlActionSchema,
  type QwenRuntimeControlSetResult,
  type QwenRuntimeControlStatus,
} from "@jarvis-k/contracts";
import type { QwenRuntimeConfig } from "./qwen-runtime-config";

type QwenRuntimeControlState =
  | "disabled"
  | "prepared"
  | "active"
  | "fallback"
  | "blocked";

export interface QwenRuntimeControllerOptions {
  config: QwenRuntimeConfig;
  readText?: (filePath: string) => string;
  exists?: (filePath: string) => boolean;
  stopHelper?: () => Promise<boolean>;
}

export interface QwenRuntimeControlActionInput {
  senderId: number;
  expectedSenderId: number | null;
  rawInput: unknown;
}

export class QwenRuntimeController {
  private state: QwenRuntimeControlState = "disabled";
  private explicitOptIn = false;
  private helperStartCount = 0;
  private generationPortReadinessProbeCount = 0;
  private routeRequestCount = 0;
  private helperShutdownVerified = true;

  public constructor(private readonly options: QwenRuntimeControllerOptions) {}

  public getStatus(): QwenRuntimeControlStatus {
    const retainedSessionAvailable = this.retainedSessionAvailable();
    const prepared =
      retainedSessionAvailable &&
      this.explicitOptIn &&
      this.state === "prepared";
    const active =
      retainedSessionAvailable &&
      this.explicitOptIn &&
      this.state === "active";
    const fallback = this.state === "fallback";
    const blocked = !retainedSessionAvailable || this.state === "blocked";
    const activation = createCommandRouterQwenProductRoutingActivationStatus({
      commandRouterProductModeEnabled: true,
      preparedPolicyReviewed: true,
      readinessEvidencePassed: retainedSessionAvailable,
      noRuntimeProductBindingPresent: true,
      coreSelectionFallbackPreserved: true,
      commandRouterSafetyGatesPreserved: true,
      deterministicRulesActive: true,
      armingWindowApproved: active,
      runtimeRetentionApproved: active,
      manualAcceptanceApproved: active,
      helperStartupAllowed: active,
      artifactMaterializationAllowed: active,
      generationPortInvocationAllowed: active,
      productRoutingArmed: active,
      persistentEnablementApproved: true,
      explicitOptInEnabled: active,
      productRoutingEnabled: active,
      realQwenRuntimeEnabled: active,
      runtimeAccessed: active,
      artifactAccessed: active,
      helperStarted: active,
      generationPortInvoked: active,
      deterministicRulesRollbackReady: true,
      rollbackRequested: fallback,
      blocked,
    });
    const status = blocked
      ? "blocked"
      : fallback
        ? "fallback"
        : active
          ? "active"
          : prepared
            ? "prepared"
            : "disabled";
    const reasonCodes =
      status === "blocked"
        ? ["QWEN_RUNTIME_CONTROL_RETAINED_SESSION_MISSING"]
        : status === "fallback"
          ? ["QWEN_RUNTIME_CONTROL_ROLLBACK_READY"]
          : status === "active"
            ? ["QWEN_RUNTIME_CONTROL_ACCEPTANCE_ACTIVE"]
            : status === "prepared"
              ? ["QWEN_RUNTIME_CONTROL_START_PREPARED"]
              : ["QWEN_RUNTIME_CONTROL_DEFAULT_OFF"];
    const helperLifecycle = active
      ? "running"
      : this.helperShutdownVerified && this.helperStartCount === 1
        ? "shutdown_after_verification"
        : prepared
          ? "start_prepared"
          : "stopped";

    return {
      mode: "developer_alpha_local",
      status,
      retainedSessionId: this.options.config.retainedSessionId,
      retainedSessionAvailable,
      explicitOptInRequired: true,
      explicitOptInEnabled: prepared || active,
      activeRouteSource: active
        ? "intent-router.qwen3-0.6b"
        : "intent-router.deterministic.rules",
      fallbackRouteSource: "intent-router.deterministic.rules",
      helperLifecycle,
      helperStartCount: this.helperStartCount,
      generationPortReadinessProbeCount:
        this.generationPortReadinessProbeCount,
      routeRequestCount: this.routeRequestCount,
      helperShutdownVerified: this.helperShutdownVerified,
      routeRequestLimit: this.options.config.routeRequestLimit,
      controls: {
        start: "blocked",
        stop: prepared || active || fallback ? "available" : "blocked",
        rollback: retainedSessionAvailable ? "available" : "blocked",
      },
      directActionEnabled: false,
      browserUrlOpeningEnabled: false,
      vsCodeBlocked: true,
      allowlistTargets: ["notepad", "calculator"] as const,
      defaultBehaviorChanged: false,
      releaseBehaviorChanged: false,
      telemetryChanged: false,
      activation,
      reasonCodes,
    };
  }

  public async setAction(
    input: QwenRuntimeControlActionInput,
  ): Promise<QwenRuntimeControlSetResult> {
    const parsedAction = QwenRuntimeControlActionSchema.safeParse(
      typeof input.rawInput === "object" && input.rawInput !== null
        ? (input.rawInput as Record<string, unknown>).action
        : undefined,
    );
    if (
      input.expectedSenderId === null ||
      input.senderId !== input.expectedSenderId
    ) {
      return {
        ok: false,
        action: parsedAction.success ? parsedAction.data : "stop",
        status: this.getStatus(),
        message: "Qwen runtime control is unavailable.",
      };
    }
    if (!parsedAction.success) {
      return {
        ok: false,
        action: "stop",
        status: this.getStatus(),
        message: "Qwen runtime control action is invalid.",
      };
    }
    if (!this.retainedSessionAvailable()) {
      this.state = "disabled";
      this.explicitOptIn = false;
      this.resetCounters();
      return {
        ok: false,
        action: parsedAction.data,
        status: this.getStatus(),
        message: "Retained Qwen product session is unavailable.",
      };
    }
    if (parsedAction.data === "start") {
      this.state = "blocked";
      this.explicitOptIn = false;
      this.resetCounters();
      return {
        ok: false,
        action: parsedAction.data,
        status: this.getStatus(),
        message:
          "Qwen runtime control is disabled in the Desktop product boundary.",
      };
    }
    if (parsedAction.data === "stop") {
      const stopped = await this.stopHelper();
      this.state = "disabled";
      this.explicitOptIn = false;
      if (!stopped) {
        return {
          ok: false,
          action: parsedAction.data,
          status: this.getStatus(),
          message: "Qwen runtime control helper shutdown was not verified.",
        };
      }
    }
    if (parsedAction.data === "rollback") {
      const stopped = await this.stopHelper();
      this.state = "fallback";
      this.explicitOptIn = false;
      if (!stopped) {
        return {
          ok: false,
          action: parsedAction.data,
          status: this.getStatus(),
          message:
            "Qwen runtime control rollback shutdown was not verified.",
        };
      }
    }
    return {
      ok: true,
      action: parsedAction.data,
      status: this.getStatus(),
    };
  }

  private retainedSessionAvailable(): boolean {
    try {
      const raw = JSON.parse(
        this.readText(this.options.config.retainedSessionMarkerPath),
      ) as Record<string, unknown>;
      return (
        this.exists(this.options.config.retainedSessionMarkerPath) &&
        raw.sessionId === this.options.config.retainedSessionId &&
        raw.status === "retained_bounded_developer_alpha_session" &&
        raw.dependencyEnv === "retained" &&
        raw.artifactCache === "retained" &&
        raw.helperLifecycle === "shutdown_after_verification" &&
        raw.approvedArtifactCount === 7 &&
        raw.digestBeforeLoad === "passed" &&
        raw.defaultOn === false &&
        raw.releaseExposure === false
      );
    } catch {
      return false;
    }
  }

  private async stopHelper(): Promise<boolean> {
    const stopped = await (this.options.stopHelper?.() ?? Promise.resolve(true));
    this.helperShutdownVerified = stopped;
    return stopped;
  }

  private resetCounters(): void {
    this.helperStartCount = 0;
    this.generationPortReadinessProbeCount = 0;
    this.routeRequestCount = 0;
    this.helperShutdownVerified = true;
  }

  private readText(filePath: string): string {
    if (this.options.readText) {
      return this.options.readText(filePath);
    }
    return readFileSync(filePath, "utf8");
  }

  private exists(filePath: string): boolean {
    return (this.options.exists ?? existsSync)(filePath);
  }
}
