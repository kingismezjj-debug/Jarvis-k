import { describe, expect, it, vi } from "vitest";
import {
  LoginItemController,
  type ElectronLoginItemSettings,
  type ElectronLoginItemStatus,
} from "../src/login-item/login-item-controller";

const APP_ID = "com.jarvis-k.desktop.alpha";
const PRODUCT_NAME = "Jarvis-K Alpha";
const EXE_PATH = "C:\\Users\\Test\\App.exe";
const NEW_STARTUP_ARG = "jarvis-startup=login";
const LEGACY_STARTUP_ARG = "--jarvis-startup=login";

function createFakeApp(input: {
  isPackaged: boolean;
  openAtLogin?: boolean;
  throwOnGet?: boolean;
  throwOnSet?: boolean | ((settings: ElectronLoginItemSettings, index: number) => boolean);
  getStatus?: (
    settings: ElectronLoginItemSettings | undefined,
    callIndex: number,
  ) => ElectronLoginItemStatus;
} = {}) {
  let openAtLogin = input.openAtLogin === true;
  let getCallIndex = 0;
  let setCallIndex = 0;
  const setLoginItemSettings = vi.fn((settings: ElectronLoginItemSettings) => {
    const shouldThrow =
      typeof input.throwOnSet === "function"
        ? input.throwOnSet(settings, setCallIndex)
        : input.throwOnSet === true;
    setCallIndex += 1;
    if (shouldThrow) {
      throw new Error("set rejected");
    }
    if (settings.name === undefined && settings.args?.[0] === NEW_STARTUP_ARG) {
      openAtLogin = settings.openAtLogin === true;
    }
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
      getPath: vi.fn(() => EXE_PATH),
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
  throwOnSet?: boolean | ((settings: ElectronLoginItemSettings, index: number) => boolean);
  getStatus?: (
    settings: ElectronLoginItemSettings | undefined,
    callIndex: number,
  ) => ElectronLoginItemStatus;
  verificationAttempts?: number;
}) {
  const fake = createFakeApp(input);
  return {
    ...fake,
    controller: new LoginItemController({
      app: fake.app,
      releaseChannel: input.releaseChannel,
      appId:
        input.releaseChannel === "stable"
          ? "com.jarvis-k.desktop"
          : `com.jarvis-k.desktop.${input.releaseChannel}`,
      productName: input.releaseChannel === "alpha" ? PRODUCT_NAME : "Jarvis-K",
      verificationAttempts: input.verificationAttempts,
      verificationDelayMs: 0,
    }),
  };
}

function activeWriteCalls(
  setLoginItemSettings: ReturnType<typeof vi.fn>,
): ElectronLoginItemSettings[] {
  return setLoginItemSettings.mock.calls
    .map(([settings]) => settings as ElectronLoginItemSettings)
    .filter((settings) => settings.args?.[0] === NEW_STARTUP_ARG);
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

  it("allows packaged Alpha and Stable while keeping their identities separate", async () => {
    const alpha = createController({ isPackaged: true, releaseChannel: "alpha" });
    const stable = createController({ isPackaged: true, releaseChannel: "stable" });

    await expect(alpha.controller.setEnabled(true)).resolves.toMatchObject({
      ok: true,
      status: { appId: "com.jarvis-k.desktop.alpha", releaseChannel: "alpha" },
    });
    await expect(stable.controller.setEnabled(true)).resolves.toMatchObject({
      ok: true,
      status: { appId: "com.jarvis-k.desktop", releaseChannel: "stable" },
    });
  });

  it("enables packaged alpha with the AppUserModelId default identity and new startup token", async () => {
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
        startupArgument: NEW_STARTUP_ARG,
        appId: APP_ID,
        productName: PRODUCT_NAME,
        verificationState: "enabled",
      },
    });

    const activeWrites = activeWriteCalls(setLoginItemSettings);
    expect(activeWrites.filter((settings) => settings.openAtLogin === true))
      .toEqual([
        {
          openAtLogin: true,
          enabled: true,
          path: EXE_PATH,
          args: [NEW_STARTUP_ARG],
        },
      ]);
    expect(activeWrites.at(-1)).not.toHaveProperty("name");
    expect(activeWrites.at(-1)).not.toHaveProperty("openAsHidden");
    expect(getLoginItemSettings).toHaveBeenCalledWith({
      path: EXE_PATH,
      args: [NEW_STARTUP_ARG],
    });
    for (const [settings] of getLoginItemSettings.mock.calls) {
      expect(settings).not.toHaveProperty("openAtLogin");
      expect(settings).not.toHaveProperty("name");
    }
  });

  it("cleans legacy product-name and AppUserModelId entries before creating the new default identity", async () => {
    const { controller, setLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({ ok: true });

    expect(setLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: false,
      enabled: false,
      path: EXE_PATH,
      args: [LEGACY_STARTUP_ARG],
      name: PRODUCT_NAME,
    });
    expect(setLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: false,
      enabled: false,
      path: EXE_PATH,
      args: [NEW_STARTUP_ARG],
      name: PRODUCT_NAME,
    });
    expect(setLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: false,
      enabled: false,
      path: EXE_PATH,
      args: [LEGACY_STARTUP_ARG],
      name: APP_ID,
    });
    expect(
      setLoginItemSettings.mock.calls.filter(
        ([settings]) => (settings as ElectronLoginItemSettings).openAtLogin === true,
      ),
    ).toHaveLength(1);
  });

  it("removes both new and legacy identities when disabled", async () => {
    const { controller, setLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      openAtLogin: true,
    });

    await expect(controller.setEnabled(false)).resolves.toMatchObject({
      ok: true,
      status: { requested: false, openAtLogin: false },
    });
    expect(setLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: false,
      enabled: false,
      path: EXE_PATH,
      args: [NEW_STARTUP_ARG],
    });
    expect(setLoginItemSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        openAtLogin: false,
        enabled: false,
        args: [LEGACY_STARTUP_ARG],
        name: PRODUCT_NAME,
      }),
    );
    expect(setLoginItemSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        openAtLogin: false,
        enabled: false,
        args: [NEW_STARTUP_ARG],
        name: APP_ID,
      }),
    );
  });

  it("fails closed on partial migration failure", async () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      throwOnSet: (_settings, index) => index === 1,
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: false,
      status: {
        requested: true,
        openAtLogin: false,
        canModify: false,
        errorCode: "LOGIN_ITEM_SET_FAILED",
      },
    });
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
    const { controller, getLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: (settings) =>
        settings?.args?.[0] === NEW_STARTUP_ARG
          ? { openAtLogin: false }
          : { openAtLogin: true },
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
    expect(getLoginItemSettings).toHaveBeenCalledTimes(15);
  });

  it("does not treat executableWillLaunchAtLogin alone as the exact product login item", () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: () => ({
        openAtLogin: false,
        executableWillLaunchAtLogin: true,
      }),
    });

    expect(controller.getStatus(true)).toMatchObject({
      requested: true,
      openAtLogin: false,
      mismatch: true,
      sameExecutableDifferentArgs: true,
      verificationState: "same_executable_different_args",
    });
  });

  it("accepts exact query openAtLogin when Electron returns no launchItems", async () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: (settings) => ({
        openAtLogin: settings?.args?.[0] === NEW_STARTUP_ARG,
        launchItems: [],
      }),
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: true,
      status: {
        openAtLogin: true,
        hasExactLaunchItem: true,
        exactLaunchItemEnabled: true,
        verificationState: "enabled",
      },
    });
  });

  it("accepts an exact enabled AppUserModelId launch item even when openAtLogin is false", async () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: () => ({
        openAtLogin: false,
        executableWillLaunchAtLogin: true,
        launchItems: [
          {
            name: APP_ID,
            path: EXE_PATH,
            args: [NEW_STARTUP_ARG],
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

  it("does not accept the legacy display-name identity as the active identity", async () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: () => ({
        openAtLogin: false,
        executableWillLaunchAtLogin: true,
        launchItems: [
          {
            name: PRODUCT_NAME,
            path: EXE_PATH,
            args: [LEGACY_STARTUP_ARG],
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

  it("waits for a transient readback mismatch to settle", async () => {
    const { controller, getLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: (_settings, callIndex) =>
        callIndex < 3
          ? { openAtLogin: false }
          : {
              openAtLogin: false,
              launchItems: [
                {
                  name: APP_ID,
                  path: EXE_PATH,
                  args: [NEW_STARTUP_ARG],
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
    expect(getLoginItemSettings).toHaveBeenCalledTimes(6);
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
            name: APP_ID,
            path: EXE_PATH,
            args: [NEW_STARTUP_ARG],
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

  it("does not treat missing enabled as active success", async () => {
    const { controller } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      getStatus: () => ({
        openAtLogin: false,
        launchItems: [
          {
            name: APP_ID,
            path: EXE_PATH,
            args: [NEW_STARTUP_ARG],
          },
        ],
      }),
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: false,
      status: {
        openAtLogin: false,
        hasExactLaunchItem: true,
        exactLaunchItemEnabled: false,
        verificationState: "registered_not_enabled",
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
            name: APP_ID,
            path: EXE_PATH,
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

  it("keeps duplicate enable bounded and idempotent", async () => {
    const { controller, setLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      openAtLogin: true,
    });

    await expect(controller.setEnabled(true)).resolves.toMatchObject({
      ok: true,
      status: { openAtLogin: true },
    });
    expect(setLoginItemSettings).toHaveBeenCalledTimes(6);
    expect(
      setLoginItemSettings.mock.calls.filter(
        ([settings]) => (settings as ElectronLoginItemSettings).openAtLogin === true,
      ),
    ).toHaveLength(1);
  });

  it("keeps duplicate disable bounded and idempotent", async () => {
    const { controller, setLoginItemSettings } = createController({
      isPackaged: true,
      releaseChannel: "alpha",
      openAtLogin: false,
    });

    await expect(controller.setEnabled(false)).resolves.toMatchObject({
      ok: true,
      status: { openAtLogin: false },
    });
    expect(setLoginItemSettings).toHaveBeenCalledTimes(6);
    expect(
      setLoginItemSettings.mock.calls.every(
        ([settings]) => (settings as ElectronLoginItemSettings).openAtLogin === false,
      ),
    ).toBe(true);
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
    expect(getLoginItemSettings).toHaveBeenCalledTimes(15);
  });
});
