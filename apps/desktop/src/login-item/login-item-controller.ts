import type { DesktopLaunchAtLoginStatus } from "@jarvis-k/contracts";
import type { ReleaseChannel } from "../storage/storage-profile";
import { LOGIN_STARTUP_ARGUMENT } from "../startup/startup-source";

export interface ElectronLoginItemSettings {
  readonly openAtLogin?: boolean;
  readonly openAsHidden?: boolean;
  readonly path?: string;
  readonly args?: string[];
  readonly name?: string;
}

export interface ElectronLoginItemStatus {
  readonly openAtLogin?: boolean;
  readonly openAsHidden?: boolean;
  readonly wasOpenedAtLogin?: boolean;
  readonly wasOpenedAsHidden?: boolean;
  readonly restoreState?: boolean;
  readonly executableWillLaunchAtLogin?: boolean;
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
}

export interface SetLoginItemEnabledResult {
  readonly ok: boolean;
  readonly status: DesktopLaunchAtLoginStatus;
  readonly message?: string;
}

export class LoginItemController {
  public constructor(private readonly options: LoginItemControllerOptions) {}

  public getStatus(requested: boolean): DesktopLaunchAtLoginStatus {
    if (!this.isSupported()) {
      return this.createUnsupportedStatus(requested);
    }
    try {
      const openAtLogin = this.readOpenAtLogin();
      return {
        requested,
        openAtLogin,
        supported: true,
        canModify: true,
        mismatch: requested !== openAtLogin,
        releaseChannel: this.options.releaseChannel,
        startupArgument: LOGIN_STARTUP_ARGUMENT,
        source: "electron-login-item",
        appId: this.options.appId,
        productName: this.options.productName,
      };
    } catch (error) {
      return this.createApiErrorStatus(requested, "LOGIN_ITEM_STATUS_UNAVAILABLE", error);
    }
  }

  public setEnabled(enabled: boolean): SetLoginItemEnabledResult {
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
      const status = this.getStatus(enabled);
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

  private readOpenAtLogin(): boolean {
    const statuses = this.loginItemReadSettings().map((settings) =>
      this.options.app.getLoginItemSettings(settings),
    );
    return statuses.some(
      (status) =>
        status.openAtLogin === true ||
        status.executableWillLaunchAtLogin === true,
    );
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
      errorCode,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
