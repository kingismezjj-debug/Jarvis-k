import { describe, expect, it, vi } from "vitest";
import {
  LoginItemController,
  type ElectronLoginItemSettings,
} from "../src/login-item/login-item-controller";

function createFakeApp(input: {
  isPackaged: boolean;
  openAtLogin?: boolean;
  throwOnGet?: boolean;
  throwOnSet?: boolean;
} = {}) {
  let openAtLogin = input.openAtLogin === true;
  const setLoginItemSettings = vi.fn((settings: ElectronLoginItemSettings) => {
    if (input.throwOnSet) {
      throw new Error("set rejected");
    }
    openAtLogin = settings.openAtLogin === true;
  });
  const getLoginItemSettings = vi.fn(() => {
    if (input.throwOnGet) {
      throw new Error("get rejected");
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
    }),
  };
}

describe("LoginItemController", () => {
  it("keeps development builds unsupported and does not touch Windows login items", () => {
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
    expect(controller.setEnabled(true)).toMatchObject({
      ok: false,
      status: { openAtLogin: false },
    });
    expect(getLoginItemSettings).not.toHaveBeenCalled();
    expect(setLoginItemSettings).not.toHaveBeenCalled();
  });

  it("keeps test builds unsupported and does not touch Windows login items", () => {
    const { controller, setLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "test",
    });

    expect(controller.setEnabled(true).ok).toBe(false);
    expect(setLoginItemSettings).not.toHaveBeenCalled();
  });

  it("enables packaged alpha with a hidden login startup argument", () => {
    const { controller, getLoginItemSettings, setLoginItemSettings } =
      createController({
        isPackaged: true,
        releaseChannel: "alpha",
      });

    expect(controller.setEnabled(true)).toMatchObject({
      ok: true,
      status: {
        requested: true,
        openAtLogin: true,
        supported: true,
        canModify: true,
        releaseChannel: "alpha",
        appId: "com.jarvis-k.desktop.alpha",
        productName: "Jarvis-K Alpha",
      },
    });
    expect(setLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: true,
      openAsHidden: true,
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

  it("removes the packaged alpha login item when disabled", () => {
    const { controller, setLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      openAtLogin: true,
    });

    expect(controller.setEnabled(false)).toMatchObject({
      ok: true,
      status: { requested: false, openAtLogin: false },
    });
    expect(setLoginItemSettings).toHaveBeenCalledWith(
      expect.objectContaining({ openAtLogin: false }),
    );
  });

  it("does not pretend success when the Electron API rejects the setting", () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      throwOnSet: true,
    });

    expect(controller.setEnabled(true)).toMatchObject({
      ok: false,
      status: {
        openAtLogin: false,
        canModify: false,
        errorCode: "LOGIN_ITEM_SET_FAILED",
      },
    });
  });

  it("does not report a false failure when Electron only projects the path-level login item", () => {
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

    expect(controller.setEnabled(true)).toMatchObject({
      ok: true,
      status: {
        requested: true,
        openAtLogin: true,
        mismatch: false,
      },
    });
    expect(getLoginItemSettings).toHaveBeenCalledTimes(2);
  });

  it("treats executableWillLaunchAtLogin as an enabled Windows login item", () => {
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
      openAtLogin: true,
      mismatch: false,
    });
  });

  it("does not pretend removal succeeded when a login item remains registered", () => {
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

    expect(controller.setEnabled(false)).toMatchObject({
      ok: false,
      status: {
        requested: false,
        openAtLogin: true,
        mismatch: true,
      },
      message: "Windows did not apply the launch at login setting.",
    });
  });
});
