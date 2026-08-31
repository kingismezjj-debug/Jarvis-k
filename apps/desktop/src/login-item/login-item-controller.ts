import type { DesktopLaunchAtLoginStatus } from "@jarvis-k/contracts";
import type { ReleaseChannel } from "../storage/storage-profile";
import { LOGIN_STARTUP_ARGUMENT } from "../startup/startup-source";

export interface ElectronLoginItemSettings {
  readonly openAtLogin?: boolean;
  readonly openAsHidden?: boolean;
  readonly enabled?: boolean;
  readonly path?: string;
  readonly args?: string[];
  readonly name?: string;
}

export interface ElectronLoginItemLaunchItem {
  readonly name?: string;
  readonly path?: string;
  readonly args?: string[];
  readonly scope?: string;
  readonly enabled?: boolean;
}

export interface ElectronLoginItemStatus {
  readonly openAtLogin?: boolean;
  readonly openAsHidden?: boolean;
  readonly wasOpenedAtLogin?: boolean;
  readonly wasOpenedAsHidden?: boolean;
  readonly restoreState?: boolean;
  readonly executableWillLaunchAtLogin?: boolean;
  readonly launchItems?: ElectronLoginItemLaunchItem[];
}

export interface LoginItemElectronApp {
  readonly isPackaged: boolean;
  getPath(name: "exe"): string;
  getLoginItemSettings(settings?: ElectronLoginItemSettings): ElectronLoginItemStatus;
  setLoginItemSettings(settings: ElectronLoginItemSettings): void;
}

export interface LoginItemControllerOptions {
  readonly app: LoginItemElectronApp;
  readonly releaseChannel: ReleaseChannel;
  readonly appId: string;
  readonly productName: string;
  readonly verificationAttempts?: number;
  readonly verificationDelayMs?: number;
}

export interface SetLoginItemEnabledResult {
  readonly ok: boolean;
  readonly status: DesktopLaunchAtLoginStatus;
  readonly message?: string;
}

interface LoginItemProjection {
  readonly openAtLogin: boolean;
  readonly hasExactLaunchItem: boolean;
  readonly exactLaunchItemEnabled: boolean;
  readonly exactLaunchItemDisabled: boolean;
  readonly executableWillLaunchAtLogin: boolean;
  readonly sameExecutableDifferentArgs: boolean;
  readonly verificationState: DesktopLaunchAtLoginStatus["verificationState"];
}

interface LoginItemStatusSample {
  readonly query: "exact" | "executable";
  readonly status: ElectronLoginItemStatus;
}

const DEFAULT_VERIFICATION_ATTEMPTS = 5;
const DEFAULT_VERIFICATION_DELAY_MS = 100;

export class LoginItemController {
  public constructor(private readonly options: LoginItemControllerOptions) {}

  public getStatus(requested: boolean): DesktopLaunchAtLoginStatus {
    if (!this.isSupported()) {
      return this.createUnsupportedStatus(requested);
    }
    try {
      return this.createSupportedStatus(requested, this.readProjection(), 1);
    } catch (error) {
      return this.createApiErrorStatus(requested, "LOGIN_ITEM_STATUS_UNAVAILABLE", error);
    }
  }

  public async setEnabled(enabled: boolean): Promise<SetLoginItemEnabledResult> {
    if (!this.isSupported()) {
      const status = this.createUnsupportedStatus(false);
      return {
        ok: enabled === false,
        status,
        ...(enabled
          ? {
              message:
                "Launch at login is only available in packaged Alpha or Stable builds.",
            }
          : {}),
      };
    }
    try {
      this.options.app.setLoginItemSettings(
        this.loginItemWriteSettings(enabled),
      );
      const status = await this.confirmRequestedState(enabled);
      return {
        ok: status.openAtLogin === enabled,
        status,
        ...(status.openAtLogin === enabled
          ? {}
          : { message: "Windows did not apply the launch at login setting." }),
      };
    } catch (error) {
      return {
        ok: false,
        status: this.createApiErrorStatus(
          enabled,
          "LOGIN_ITEM_SET_FAILED",
          error,
        ),
        message: "Windows rejected the launch at login setting.",
      };
    }
  }

  private isSupported(): boolean {
    return (
      this.options.app.isPackaged &&
      (this.options.releaseChannel === "alpha" ||
        this.options.releaseChannel === "stable")
    );
  }

  private loginItemWriteSettings(openAtLogin: boolean): ElectronLoginItemSettings {
    return {
      openAtLogin,
      openAsHidden: true,
      enabled: openAtLogin,
      path: this.options.app.getPath("exe"),
      args: [LOGIN_STARTUP_ARGUMENT],
      name: this.options.productName,
    };
  }

  private loginItemReadSettings(): ElectronLoginItemSettings[] {
    const executablePath = this.options.app.getPath("exe");
    return [
      {
        path: executablePath,
        args: [LOGIN_STARTUP_ARGUMENT],
      },
      {
        path: executablePath,
      },
    ];
  }

  private async confirmRequestedState(
    requested: boolean,
  ): Promise<DesktopLaunchAtLoginStatus> {
    const attempts = Math.max(
      1,
      Math.floor(
        this.options.verificationAttempts ?? DEFAULT_VERIFICATION_ATTEMPTS,
      ),
    );
    const delayMs = Math.max(
      0,
      Math.floor(
        this.options.verificationDelayMs ?? DEFAULT_VERIFICATION_DELAY_MS,
      ),
    );
    let lastStatus = this.createSupportedStatus(
      requested,
      this.readProjection(),
      1,
    );
    if (lastStatus.openAtLogin === requested) {
      return lastStatus;
    }
    for (let attempt = 2; attempt <= attempts; attempt += 1) {
      if (delayMs > 0) {
        await delay(delayMs);
      }
      lastStatus = this.createSupportedStatus(
        requested,
        this.readProjection(),
        attempt,
      );
      if (lastStatus.openAtLogin === requested) {
        return lastStatus;
      }
    }
    return lastStatus;
  }

  private readProjection(): LoginItemProjection {
    const samples = this.loginItemReadSettings().map((settings, index) => ({
      query: index === 0 ? "exact" as const : "executable" as const,
      status: this.options.app.getLoginItemSettings(settings),
    }));
    return projectLoginItemStatus({
      executablePath: this.options.app.getPath("exe"),
      productName: this.options.productName,
      samples,
    });
  }

  private createSupportedStatus(
    requested: boolean,
    projection: LoginItemProjection,
    verificationAttemptCount: number,
  ): DesktopLaunchAtLoginStatus {
    return {
      requested,
      openAtLogin: projection.openAtLogin,
      supported: true,
      canModify: true,
      mismatch: requested !== projection.openAtLogin,
      releaseChannel: this.options.releaseChannel,
      startupArgument: LOGIN_STARTUP_ARGUMENT,
      source: "electron-login-item",
      appId: this.options.appId,
      productName: this.options.productName,
      hasExactLaunchItem: projection.hasExactLaunchItem,
      exactLaunchItemEnabled: projection.exactLaunchItemEnabled,
      exactLaunchItemDisabled: projection.exactLaunchItemDisabled,
      executableWillLaunchAtLogin: projection.executableWillLaunchAtLogin,
      sameExecutableDifferentArgs: projection.sameExecutableDifferentArgs,
      verificationState: projection.verificationState,
      verificationAttemptCount,
    };
  }

  private createUnsupportedStatus(requested: boolean): DesktopLaunchAtLoginStatus {
    return {
      requested,
      openAtLogin: false,
      supported: false,
      canModify: false,
      mismatch: requested,
      releaseChannel: this.options.releaseChannel,
      startupArgument: LOGIN_STARTUP_ARGUMENT,
      source: "unsupported-release-channel",
      appId: this.options.appId,
      productName: this.options.productName,
      hasExactLaunchItem: false,
      exactLaunchItemEnabled: false,
      exactLaunchItemDisabled: false,
      executableWillLaunchAtLogin: false,
      sameExecutableDifferentArgs: false,
      verificationState: "unsupported",
      verificationAttemptCount: 0,
      errorCode: "LOGIN_ITEM_UNSUPPORTED_RELEASE_CHANNEL",
    };
  }

  private createApiErrorStatus(
    requested: boolean,
    errorCode: "LOGIN_ITEM_STATUS_UNAVAILABLE" | "LOGIN_ITEM_SET_FAILED",
    error: unknown,
  ): DesktopLaunchAtLoginStatus {
    return {
      requested,
      openAtLogin: false,
      supported: true,
      canModify: false,
      mismatch: requested,
      releaseChannel: this.options.releaseChannel,
      startupArgument: LOGIN_STARTUP_ARGUMENT,
      source: "electron-api-error",
      appId: this.options.appId,
      productName: this.options.productName,
      hasExactLaunchItem: false,
      exactLaunchItemEnabled: false,
      exactLaunchItemDisabled: false,
      executableWillLaunchAtLogin: false,
      sameExecutableDifferentArgs: false,
      verificationState: "api_unavailable",
      verificationAttemptCount: 0,
      errorCode,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function projectLoginItemStatus(input: {
  readonly executablePath: string;
  readonly productName: string;
  readonly samples: readonly LoginItemStatusSample[];
}): LoginItemProjection {
  const exactSamples = input.samples.filter((sample) => sample.query === "exact");
  const exactQueryEnabled = exactSamples.some(
    (sample) => sample.status.openAtLogin === true,
  );
  const executableQueryEnabled = input.samples
    .filter((sample) => sample.query === "executable")
    .some((sample) => sample.status.openAtLogin === true);
  const executableWillLaunchAtLogin = input.samples.some(
    (sample) => sample.status.executableWillLaunchAtLogin === true,
  );
  const launchItems = input.samples.flatMap(
    (sample) => sample.status.launchItems ?? [],
  );
  const exactLaunchItems = launchItems.filter((item) =>
    isExactLaunchItem(item, input),
  );
  const hasExactLaunchItem = exactQueryEnabled || exactLaunchItems.length > 0;
  const exactLaunchItemEnabled =
    exactQueryEnabled || exactLaunchItems.some((item) => item.enabled === true);
  const exactLaunchItemDisabled =
    !exactLaunchItemEnabled && exactLaunchItems.some((item) => item.enabled === false);
  const sameExecutableDifferentArgs =
    !hasExactLaunchItem &&
    (launchItems.some(
      (item) =>
        pathsEqual(item.path, input.executablePath) &&
        !argsEqual(item.args ?? [], [LOGIN_STARTUP_ARGUMENT]),
    ) ||
      executableQueryEnabled);
  const openAtLogin = exactLaunchItemEnabled;

  return {
    openAtLogin,
    hasExactLaunchItem,
    exactLaunchItemEnabled,
    exactLaunchItemDisabled,
    executableWillLaunchAtLogin,
    sameExecutableDifferentArgs:
      sameExecutableDifferentArgs ||
      (!hasExactLaunchItem && executableWillLaunchAtLogin),
    verificationState: determineVerificationState({
      openAtLogin,
      hasExactLaunchItem,
      exactLaunchItemDisabled,
      executableWillLaunchAtLogin,
      sameExecutableDifferentArgs,
    }),
  };
}

function determineVerificationState(input: {
  readonly openAtLogin: boolean;
  readonly hasExactLaunchItem: boolean;
  readonly exactLaunchItemDisabled: boolean;
  readonly executableWillLaunchAtLogin: boolean;
  readonly sameExecutableDifferentArgs: boolean;
}): DesktopLaunchAtLoginStatus["verificationState"] {
  if (input.openAtLogin) {
    return "enabled";
  }
  if (input.exactLaunchItemDisabled) {
    return "disabled_by_system";
  }
  if (input.hasExactLaunchItem) {
    return "registered_not_enabled";
  }
  if (input.sameExecutableDifferentArgs || input.executableWillLaunchAtLogin) {
    return "same_executable_different_args";
  }
  return "not_registered";
}

function isExactLaunchItem(
  item: ElectronLoginItemLaunchItem,
  input: {
    readonly executablePath: string;
    readonly productName: string;
  },
): boolean {
  return (
    pathsEqual(item.path, input.executablePath) &&
    argsEqual(item.args ?? [], [LOGIN_STARTUP_ARGUMENT]) &&
    (item.name === undefined || item.name === input.productName)
  );
}

function pathsEqual(left: string | undefined, right: string): boolean {
  if (!left) {
    return false;
  }
  return left.replaceAll("/", "\\").toLowerCase() ===
    right.replaceAll("/", "\\").toLowerCase();
}

function argsEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
