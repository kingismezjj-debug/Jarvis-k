import { describe, expect, it, vi } from "vitest";
import {
  LoginItemController,
  type ElectronLoginItemStatus,
  type ElectronLoginItemSettings,
} from "../src/login-item/login-item-controller";

function createFakeApp(input: {
  isPackaged: boolean;
  openAtLogin?: boolean;
  throwOnGet?: boolean;
  throwOnSet?: boolean;
  getStatus?: (
    settings: ElectronLoginItemSettings | undefined,
    callIndex: number,
  ) => ElectronLoginItemStatus;
} = {}) {
  let openAtLogin = input.openAtLogin === true;
  let getCallIndex = 0;
  const setLoginItemSettings = vi.fn((settings: ElectronLoginItemSettings) => {
    if (input.throwOnSet) {
      throw new Error("set rejected");
    }
    openAtLogin = settings.openAtLogin === true;
  });
  const getLoginItemSettings = vi.fn((settings?: ElectronLoginItemSettings) => {
    if (input.throwOnGet) {
      throw new Error("get rejected");
    }
    if (input.getStatus) {
      const status = input.getStatus(settings, getCallIndex);
      getCallIndex += 1;
      return status;
    }
    return { openAtLogin };
  });
  return {
    app: {
      isPackaged: input.isPackaged,
      getPath: vi.fn(() => "C:\\Users\\Test\\App.exe"),
      getLoginItemSettings,
      setLoginItemSettings,
    },
    getLoginItemSettings,
    setLoginItemSettings,
  };
}

function createController(input: {
  isPackaged: boolean;
  releaseChannel: "development" | "alpha" | "stable" | "test";
  openAtLogin?: boolean;
  throwOnGet?: boolean;
  throwOnSet?: boolean;
}) {
  const fake = createFakeApp(input);
  return {
    ...fake,
    controller: new LoginItemController({
      app: fake.app,
      releaseChannel: input.releaseChannel,
      appId: `com.jarvis-k.desktop.${input.releaseChannel}`,
      productName:
        input.releaseChannel === "alpha" ? "Jarvis-K Alpha" : "Jarvis-K",
      verificationDelayMs: 0,
    }),
  };
}

describe("LoginItemController", () => {
  it("keeps development builds unsupported and does not touch Windows login items", async () => {
    const { controller, getLoginItemSettings, setLoginItemSettings } =
      createController({
        isPackaged: false,
        releaseChannel: "development",
      });

    expect(controller.getStatus(false)).toMatchObject({
      requested: false,
      openAtLogin: false,
      supported: false,
      canModify: false,
      source: "unsupported-release-channel",
    });
    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: false,
      status: { openAtLogin: false },
    });
    expect(getLoginItemSettings).not.toHaveBeenCalled();
    expect(setLoginItemSettings).not.toHaveBeenCalled();
  });

  it("keeps test builds unsupported and does not touch Windows login items", async () => {
    const { controller, setLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "test",
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({ ok: false });
    expect(setLoginItemSettings).not.toHaveBeenCalled();
  });

  it("enables packaged alpha with a hidden login startup argument", async () => {
    const { controller, getLoginItemSettings, setLoginItemSettings } =
      createController({
        isPackaged: true,
        releaseChannel: "alpha",
      });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: true,
      status: {
        requested: true,
        openAtLogin: true,
        supported: true,
        canModify: true,
        releaseChannel: "alpha",
        appId: "com.jarvis-k.desktop.alpha",
        productName: "Jarvis-K Alpha",
        verificationState: "enabled",
      },
    });
    expect(setLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: true,
      openAsHidden: true,
      enabled: true,
      path: "C:\\Users\\Test\\App.exe",
      args: ["--jarvis-startup=login"],
      name: "Jarvis-K Alpha",
    });
    expect(getLoginItemSettings).toHaveBeenCalledWith({
      path: "C:\\Users\\Test\\App.exe",
      args: ["--jarvis-startup=login"],
    });
    for (const [settings] of getLoginItemSettings.mock.calls) {
      expect(settings).not.toHaveProperty("openAtLogin");
      expect(settings).not.toHaveProperty("openAsHidden");
      expect(settings).not.toHaveProperty("name");
    }
  });

  it("removes the packaged alpha login item when disabled", async () => {
    const { controller, setLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      openAtLogin: true,
    });

    await expect(controller.setEnabled(false)).resolves.toMatchObject({
      ok: true,
      status: { requested: false, openAtLogin: false },
    });
    expect(setLoginItemSettings).toHaveBeenCalledWith(
      expect.objectContaining({ openAtLogin: false, enabled: false }),
    );
  });

  it("does not pretend success when the Electron API rejects the setting", async () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      throwOnSet: true,
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: false,
      status: {
        openAtLogin: false,
        canModify: false,
        errorCode: "LOGIN_ITEM_SET_FAILED",
      },
    });
  });

  it("fails closed when Electron cannot confirm the login item status", async () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      throwOnGet: true,
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: false,
      status: {
        openAtLogin: false,
        canModify: false,
        errorCode: "LOGIN_ITEM_SET_FAILED",
        verificationState: "api_unavailable",
      },
    });
  });

  it("does not treat a path-level login item as the exact product login item", async () => {
    let openAtLogin = false;
    const getLoginItemSettings = vi.fn((settings?: ElectronLoginItemSettings) => {
      if (settings?.args?.includes("--jarvis-startup=login")) {
        return { openAtLogin: false };
      }
      return { openAtLogin };
    });
    const setLoginItemSettings = vi.fn((settings: ElectronLoginItemSettings) => {
      openAtLogin = settings.openAtLogin === true;
    });
    const controller = new LoginItemController({
      app: {
        isPackaged: true,
        getPath: vi.fn(() => "C:\\Users\\Test\\Jarvis-K Alpha.exe"),
        getLoginItemSettings,
        setLoginItemSettings,
      },
      releaseChannel: "alpha",
      appId: "com.jarvis-k.desktop.alpha",
      productName: "Jarvis-K Alpha",
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: false,
      status: {
        requested: true,
        openAtLogin: false,
        mismatch: true,
        sameExecutableDifferentArgs: true,
        verificationState: "same_executable_different_args",
      },
    });
    expect(getLoginItemSettings).toHaveBeenCalledTimes(10);
  });

  it("does not treat executableWillLaunchAtLogin alone as the exact product login item", () => {
    const getLoginItemSettings = vi.fn(() => ({
      openAtLogin: false,
      executableWillLaunchAtLogin: true,
    }));
    const controller = new LoginItemController({
      app: {
        isPackaged: true,
        getPath: vi.fn(() => "C:\\Users\\Test\\Jarvis-K Alpha.exe"),
        getLoginItemSettings,
        setLoginItemSettings: vi.fn(),
      },
      releaseChannel: "alpha",
      appId: "com.jarvis-k.desktop.alpha",
      productName: "Jarvis-K Alpha",
    });

    expect(controller.getStatus(true)).toMatchObject({
      requested: true,
      openAtLogin: false,
      mismatch: true,
      sameExecutableDifferentArgs: true,
      verificationState: "same_executable_different_args",
    });
  });

  it("does not pretend removal succeeded when a login item remains registered", async () => {
    const getLoginItemSettings = vi.fn(() => ({ openAtLogin: true }));
    const controller = new LoginItemController({
      app: {
        isPackaged: true,
        getPath: vi.fn(() => "C:\\Users\\Test\\Jarvis-K Alpha.exe"),
        getLoginItemSettings,
        setLoginItemSettings: vi.fn(),
      },
      releaseChannel: "alpha",
      appId: "com.jarvis-k.desktop.alpha",
      productName: "Jarvis-K Alpha",
    });

    await expect(controller.setEnabled(false)).resolves.toMatchObject({
      ok: false,
      status: {
        requested: false,
        openAtLogin: true,
        mismatch: true,
      },
      message: "Windows did not apply the launch at login setting.",
    });
  });

  it("accepts an exact enabled Windows launch item even when openAtLogin is false", async () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: () => ({
        openAtLogin: false,
        executableWillLaunchAtLogin: true,
        launchItems: [
          {
            name: "Jarvis-K Alpha",
            path: "C:\\Users\\Test\\App.exe",
            args: ["--jarvis-startup=login"],
            enabled: true,
            scope: "user",
          },
        ],
      }),
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: true,
      status: {
        openAtLogin: true,
        hasExactLaunchItem: true,
        exactLaunchItemEnabled: true,
        executableWillLaunchAtLogin: true,
        verificationState: "enabled",
      },
    });
  });

  it("waits for a transient readback mismatch to settle", async () => {
    const { controller, getLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: (_settings, callIndex) =>
        callIndex < 2
          ? { openAtLogin: false }
          : {
              openAtLogin: false,
              launchItems: [
                {
                  name: "Jarvis-K Alpha",
                  path: "C:\\Users\\Test\\App.exe",
                  args: ["--jarvis-startup=login"],
                  enabled: true,
                },
              ],
            },
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: true,
      status: {
        openAtLogin: true,
        verificationAttemptCount: 2,
      },
    });
    expect(getLoginItemSettings).toHaveBeenCalledTimes(4);
  });

  it("fails when the exact Windows launch item is disabled by StartupApproved", async () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: () => ({
        openAtLogin: false,
        executableWillLaunchAtLogin: false,
        launchItems: [
          {
            name: "Jarvis-K Alpha",
            path: "C:\\Users\\Test\\App.exe",
            args: ["--jarvis-startup=login"],
            enabled: false,
          },
        ],
      }),
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: false,
      status: {
        openAtLogin: false,
        hasExactLaunchItem: true,
        exactLaunchItemDisabled: true,
        verificationState: "disabled_by_system",
      },
    });
  });

  it("does not treat the same executable with different args as the product login item", async () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: () => ({
        openAtLogin: false,
        executableWillLaunchAtLogin: true,
        launchItems: [
          {
            name: "Jarvis-K Alpha",
            path: "C:\\Users\\Test\\App.exe",
            args: ["--other-startup"],
            enabled: true,
          },
        ],
      }),
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: false,
      status: {
        openAtLogin: false,
        hasExactLaunchItem: false,
        sameExecutableDifferentArgs: true,
        verificationState: "same_executable_different_args",
      },
    });
  });

  it("is idempotent when enabling an already enabled exact launch item", async () => {
    const { controller, setLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      openAtLogin: true,
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: true,
      status: { openAtLogin: true },
    });
    expect(setLoginItemSettings).toHaveBeenCalledTimes(1);
  });

  it("is idempotent when disabling an already removed exact launch item", async () => {
    const { controller, setLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      openAtLogin: false,
    });

    await expect(controller.setEnabled(false)).resolves.toMatchObject({
      ok: true,
      status: { openAtLogin: false },
    });
    expect(setLoginItemSettings).toHaveBeenCalledTimes(1);
  });

  it("treats an exact but disabled launch item as disabled after a disable request", async () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: () => ({
        openAtLogin: false,
        executableWillLaunchAtLogin: false,
        launchItems: [
          {
            name: "Jarvis-K Alpha",
            path: "C:\\Users\\Test\\App.exe",
            args: ["--jarvis-startup=login"],
            enabled: false,
          },
        ],
      }),
    });

    await expect(controller.setEnabled(false)).resolves.toMatchObject({
      ok: true,
      status: {
        openAtLogin: false,
        exactLaunchItemDisabled: true,
        verificationState: "disabled_by_system",
      },
    });
  });

  it("reports verification failure after bounded retries when Windows never projects the item", async () => {
    const { controller, getLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: () => ({ openAtLogin: false }),
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: false,
      status: {
        openAtLogin: false,
        verificationState: "not_registered",
        verificationAttemptCount: 5,
      },
      message: "Windows did not apply the launch at login setting.",
    });
    expect(getLoginItemSettings).toHaveBeenCalledTimes(10);
  });
});
