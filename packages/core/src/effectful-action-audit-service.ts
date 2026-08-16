export type EffectfulActionKind =
  | "localApp.open"
  | "browser.open"
  | "notepad.write_text"
  | "window.control"
  | "filesystem.search";

export interface EffectfulActionAuditConfig {
  realWindowsExecutionEnabled: boolean;
  brainOpenActionsDisabled: boolean;
}

export interface EffectfulActionAuditProjection {
  realWindowsExecutionEnabled: boolean;
  brainOpenActionsDisabled: boolean;
  windowsExecutorInvocationCount: number;
  effectfulActionBlockedBeforeExecutorCount: number;
  lastBlockedReason?: string | undefined;
  auditSessionStartedAt: string;
}

export class EffectfulActionAuditService {
  private readonly auditSessionStartedAt: string;
  private windowsExecutorInvocationCount = 0;
  private effectfulActionBlockedBeforeExecutorCount = 0;
  private lastBlockedReason: string | undefined;

  public constructor(
    private readonly config: EffectfulActionAuditConfig,
    now: () => Date,
  ) {
    this.auditSessionStartedAt = now().toISOString();
  }

  public shouldBlockBeforeWindowsExecutor(
    action: EffectfulActionKind,
  ): string | undefined {
    if (!this.config.brainOpenActionsDisabled) {
      return undefined;
    }
    return `BRAIN_OPEN_ACTIONS_DISABLED:${action}`;
  }

  public recordWindowsExecutorInvocation(): void {
    this.windowsExecutorInvocationCount += 1;
  }

  public recordBlockedBeforeExecutor(reason: string): void {
    this.effectfulActionBlockedBeforeExecutorCount += 1;
    this.lastBlockedReason = reason;
  }

  public getProjection(): EffectfulActionAuditProjection {
    return {
      realWindowsExecutionEnabled: this.config.realWindowsExecutionEnabled,
      brainOpenActionsDisabled: this.config.brainOpenActionsDisabled,
      windowsExecutorInvocationCount: this.windowsExecutorInvocationCount,
      effectfulActionBlockedBeforeExecutorCount:
        this.effectfulActionBlockedBeforeExecutorCount,
      ...(this.lastBlockedReason === undefined
        ? {}
        : { lastBlockedReason: this.lastBlockedReason }),
      auditSessionStartedAt: this.auditSessionStartedAt,
    };
  }
}
