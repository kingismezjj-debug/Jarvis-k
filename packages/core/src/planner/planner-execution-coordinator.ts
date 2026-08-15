import type { TaskStep, TaskStepVerificationStatus } from "@jarvis-k/contracts";
import type { PlannerStepExecutionResult } from "./planner-approval-service";

type KnownLocalAppLabel = "notepad" | "calculator" | "vscode";

export interface PlannerActionRequest {
  target: string;
  text?: string;
  action?: "focus" | "minimize" | "restore";
}

export interface PlannerActionResult {
  status: "completed" | "blocked";
  reasonCode:
    | "ALLOWLISTED_TARGET_OPENED"
    | "NOTEPAD_TEXT_WRITTEN"
    | "WINDOW_CONTROL_COMPLETED"
    | "FILESYSTEM_SEARCH_COMPLETED"
    | "BRAIN_ACTIONS_DISABLED"
    | "TARGET_INVALID"
    | "TARGET_NOT_ALLOWLISTED"
    | "TARGET_UNAVAILABLE"
    | "OPEN_FAILED"
    | "WRITE_FAILED"
    | "WINDOW_CONTROL_FAILED"
    | "SEARCH_FAILED";
  label: string;
  verificationStatus?: TaskStepVerificationStatus;
  verificationSummary?: string;
  matchCount?: number;
}

export interface PlannerActionExecutor {
  openBrowser(request: PlannerActionRequest): Promise<PlannerActionResult>;
  openLocalApp(request: PlannerActionRequest): Promise<PlannerActionResult>;
  searchFilesystem?(
    request: PlannerActionRequest,
  ): Promise<PlannerActionResult>;
}

export interface PlannerMemoryStatusRepository {
  initialize(): Promise<void>;
  listAliases?(): Promise<unknown[]>;
  listPreferences?(): Promise<unknown[]>;
}

export interface PlannerExecutionCoordinatorOptions {
  actionExecutor: PlannerActionExecutor | undefined;
  getRuntimeStatus: () => {
    health: string;
    sequenceId: number;
    voiceState: string;
    memoryHealthStatus: string;
  };
  voiceCommandAliasRepository: PlannerMemoryStatusRepository | undefined;
  userRouteAliasRepository: PlannerMemoryStatusRepository | undefined;
  userPreferenceMemoryRepository: PlannerMemoryStatusRepository | undefined;
  resolveKnownLocalApp: (target: string) => KnownLocalAppLabel | undefined;
  displayKnownLocalApp: (label: KnownLocalAppLabel) => string;
}

export class PlannerExecutionCoordinator {
  public constructor(
    private readonly options: PlannerExecutionCoordinatorOptions,
  ) {}

  public async executeStep(
    step: TaskStep,
    toolId: string | undefined,
  ): Promise<PlannerStepExecutionResult> {
    switch (toolId) {
      case "observability.status":
        return {
          ok: true,
          verificationStatus: "verified",
          summary: this.summarizeRuntimeStatus(),
        };

      case "memory.status":
        return {
          ok: true,
          verificationStatus: "verified",
          summary: await this.summarizeMemoryStatus(),
        };

      case "filesystem.search":
        return this.executeFilesystemSearch(step);

      case "browser.open":
        return this.executeBrowserOpen(step);

      case "localApp.open":
        return this.executeLocalAppOpen(step);

      case "plugin.invoke":
      case "chat.answer":
      case "notepad.writeText":
      case "window.focus":
      case "window.minimize":
      case "window.restore":
      case "memory.search":
      case "model.status":
      case "system.settings":
        return {
          ok: false,
          verificationStatus: "verification_failed",
          summary: `${toolId} is not executable in Planner Draft Approve/Execute L3; the step failed closed before any action.`,
          failureReason: "PLANNER_STEP_NOT_EXECUTABLE_IN_L3",
        };

      default:
        return {
          ok: false,
          verificationStatus: "verification_failed",
          summary:
            "Planner draft approval failed closed because the step tool is unknown.",
          failureReason: "PLANNER_STEP_TOOL_UNKNOWN",
        };
    }
  }

  private summarizeRuntimeStatus(): string {
    const status = this.options.getRuntimeStatus();
    return `Core status verified: ${status.health}; sequence ${status.sequenceId}; voice ${status.voiceState}; Memory ${status.memoryHealthStatus}.`;
  }

  private async executeFilesystemSearch(
    step: TaskStep,
  ): Promise<PlannerStepExecutionResult> {
    if (!this.options.actionExecutor?.searchFilesystem) {
      return {
        ok: false,
        verificationStatus: "verification_failed",
        summary:
          "Planner draft filesystem.search could not run because the observe-only executor is unavailable.",
        failureReason: "FILESYSTEM_SEARCH_EXECUTOR_UNAVAILABLE",
      };
    }
    const query =
      typeof step.toolInput?.query === "string" && step.toolInput.query.trim()
        ? step.toolInput.query.trim()
        : "project";
    const actionResult = await this.options.actionExecutor.searchFilesystem({
      target: query,
    });
    const verificationStatus =
      actionResult.status === "completed"
        ? (actionResult.verificationStatus ?? "verified")
        : "verification_failed";
    const ok = verificationStatus === "verified";
    return {
      ok,
      verificationStatus,
      summary:
        actionResult.verificationSummary ??
        (ok
          ? `Planner draft filesystem.search verified ${actionResult.matchCount ?? 0} sanitized candidate(s).`
          : `Planner draft filesystem.search failed verification: ${actionResult.reasonCode}.`),
      ...(ok ? {} : { failureReason: actionResult.reasonCode }),
    };
  }

  private async executeBrowserOpen(
    step: TaskStep,
  ): Promise<PlannerStepExecutionResult> {
    if (!this.options.actionExecutor) {
      return {
        ok: false,
        verificationStatus: "verification_failed",
        summary:
          "Planner draft browser.open could not run because the browser executor is unavailable.",
        failureReason: "BROWSER_OPEN_EXECUTOR_UNAVAILABLE",
      };
    }
    const target =
      typeof step.toolInput?.target === "string"
        ? step.toolInput.target.trim()
        : "";
    if (!target) {
      return {
        ok: false,
        verificationStatus: "verification_failed",
        summary:
          "Planner draft browser.open failed closed because no structured browser target was present.",
        failureReason: "BROWSER_OPEN_TARGET_MISSING",
      };
    }
    const actionResult = await this.options.actionExecutor.openBrowser({
      target,
    });
    const verificationStatus =
      actionResult.status === "completed"
        ? (actionResult.verificationStatus ?? "verified")
        : "verification_failed";
    const ok = verificationStatus === "verified";
    return {
      ok,
      verificationStatus,
      summary:
        actionResult.verificationSummary ??
        (ok
          ? `Planner draft browser.open verified URL policy for ${actionResult.label}.`
          : `Planner draft browser.open failed verification: ${actionResult.reasonCode}.`),
      ...(ok ? {} : { failureReason: actionResult.reasonCode }),
    };
  }

  private async executeLocalAppOpen(
    step: TaskStep,
  ): Promise<PlannerStepExecutionResult> {
    if (!this.options.actionExecutor) {
      return {
        ok: false,
        verificationStatus: "verification_failed",
        summary:
          "Planner draft localApp.open could not run because the known-app executor is unavailable.",
        failureReason: "LOCAL_APP_OPEN_EXECUTOR_UNAVAILABLE",
      };
    }
    const target =
      typeof step.toolInput?.target === "string"
        ? step.toolInput.target.trim()
        : "";
    if (!target) {
      return {
        ok: false,
        verificationStatus: "verification_failed",
        summary:
          "Planner draft localApp.open failed closed because no structured known-app target was present.",
        failureReason: "LOCAL_APP_TARGET_MISSING",
      };
    }
    const appLabel = this.options.resolveKnownLocalApp(target);
    if (!appLabel) {
      return {
        ok: false,
        verificationStatus: "verification_failed",
        summary:
          "Planner draft localApp.open failed closed because the target is not a known local app.",
        failureReason: "LOCAL_APP_TARGET_NOT_ALLOWLISTED",
      };
    }
    const appName = this.options.displayKnownLocalApp(appLabel);
    const actionResult = await this.options.actionExecutor.openLocalApp({
      target: appLabel,
    });
    const verificationStatus =
      actionResult.status === "completed"
        ? (actionResult.verificationStatus ?? "unverified")
        : "verification_failed";
    const ok = verificationStatus === "verified";
    return {
      ok,
      verificationStatus,
      summary:
        actionResult.verificationSummary ??
        (ok
          ? `Planner draft localApp.open verified ${appName} through existing known-app policy.`
          : `Planner draft localApp.open failed verification for ${appName}: ${actionResult.reasonCode}.`),
      ...(ok ? {} : { failureReason: actionResult.reasonCode }),
    };
  }

  private async summarizeMemoryStatus(): Promise<string> {
    const voiceAliases = await this.countRepositoryRecords(
      this.options.voiceCommandAliasRepository,
      "aliases",
    );
    const routeAliases = await this.countRepositoryRecords(
      this.options.userRouteAliasRepository,
      "aliases",
    );
    const preferences = await this.countRepositoryRecords(
      this.options.userPreferenceMemoryRepository,
      "preferences",
    );
    return `User-controlled memory status verified: ${voiceAliases + routeAliases + preferences} visible record(s); routes ${routeAliases}; voice aliases ${voiceAliases}; preferences ${preferences}; raw private content hidden.`;
  }

  private async countRepositoryRecords(
    repository: PlannerMemoryStatusRepository | undefined,
    kind: "aliases" | "preferences",
  ): Promise<number> {
    if (!repository) {
      return 0;
    }
    await repository.initialize();
    if (kind === "aliases") {
      return (await repository.listAliases?.())?.length ?? 0;
    }
    return (await repository.listPreferences?.())?.length ?? 0;
  }
}
