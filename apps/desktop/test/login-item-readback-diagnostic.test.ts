import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  LOGIN_ITEM_READBACK_DIAGNOSTIC_FLAG,
  createLoginItemReadbackDiagnosticReport,
  runLoginItemReadbackDiagnosticIfRequested,
  type LoginItemReadbackDiagnosticApp,
} from "../src/login-item/login-item-readback-diagnostic";
import type { ElectronLoginItemSettings } from "../src/login-item/login-item-controller";

function createApp(input: {
  readonly isPackaged?: boolean;
  readonly version?: string;
  readonly executablePath?: string;
  readonly getLoginItemSettings?: (
    settings: ElectronLoginItemSettings | undefined,
    callIndex: number,
  ) => unknown;
} = {}) {
  let callIndex = 0;
  const getLoginItemSettings = vi.fn(
    (settings?: ElectronLoginItemSettings) => {
      const result = input.getLoginItemSettings?.(settings, callIndex) ?? {
        openAtLogin: false,
        executableWillLaunchAtLogin: false,
        launchItems: [],
      };
      callIndex += 1;
      return result;
    },
  );
  const app: LoginItemReadbackDiagnosticApp = {
    isPackaged: input.isPackaged ?? true,
    getPath: vi.fn(
      () =>
        input.executablePath ??
        "C:\\Users\\Alice\\AppData\\Local\\Programs\\Jarvis-K Alpha\\Jarvis-K Alpha.exe",
    ),
    getVersion: vi.fn(() => input.version ?? "0.1.0-alpha.4"),
    getLoginItemSettings,
  };
  return { app, getLoginItemSettings };
}

describe("login item readback diagnostic", () => {
  it("does not read or write when the diagnostic flag is absent", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-login-diag-"));
    try {
      const outputPath = path.join(directory, "login-item-readback.json");
      const { app, getLoginItemSettings } = createApp();

      await expect(
        runLoginItemReadbackDiagnosticIfRequested({
          argv: ["Jarvis-K Alpha.exe"],
          app,
          releaseChannel: "alpha",
          appId: "com.jarvis-k.desktop.alpha",
          productName: "Jarvis-K Alpha",
          outputPath,
        }),
      ).resolves.toEqual({ handled: false, status: "skipped" });
      expect(getLoginItemSettings).not.toHaveBeenCalled();
      await expect(readFile(outputPath, "utf8")).rejects.toThrow();
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it.each([
    { releaseChannel: "development" as const, isPackaged: false },
    { releaseChannel: "test" as const, isPackaged: true },
    { releaseChannel: "stable" as const, isPackaged: true },
  ])("fails closed for $releaseChannel", async ({ releaseChannel, isPackaged }) => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-login-diag-"));
    try {
      const outputPath = path.join(directory, "login-item-readback.json");
      const { app, getLoginItemSettings } = createApp({ isPackaged });

      const result = await runLoginItemReadbackDiagnosticIfRequested({
        argv: ["Jarvis-K Alpha.exe", LOGIN_ITEM_READBACK_DIAGNOSTIC_FLAG],
        app,
        releaseChannel,
        appId: `com.jarvis-k.desktop.${releaseChannel}`,
        productName: "Jarvis-K Alpha",
        outputPath,
      });

      expect(result).toMatchObject({
        handled: true,
        status: "unsupported_release_channel",
      });
      expect(getLoginItemSettings).not.toHaveBeenCalled();
      const stored = JSON.parse(await readFile(outputPath, "utf8"));
      expect(stored).toMatchObject({
        diagnostic: "login_item_readback",
        status: "unsupported_release_channel",
        readbacks: [],
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("records the three packaged alpha readbacks with sanitized launch item matches", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-login-diag-"));
    try {
      const outputPath = path.join(directory, "login-item-readback.json");
      const { app, getLoginItemSettings } = createApp({
        getLoginItemSettings: (settings) => ({
          openAtLogin: settings?.args?.includes("--jarvis-startup=login") === true,
          executableWillLaunchAtLogin: true,
          launchItems: [
            {
              name: "Jarvis-K Alpha",
              path: "C:/Users/Alice/AppData/Local/Programs/Jarvis-K Alpha/Jarvis-K Alpha.exe",
              args: ["--jarvis-startup=login"],
              scope: "user",
              enabled: true,
            },
            {
              name: "Unrelated",
              path: "C:\\Other\\App.exe",
              args: [],
              scope: "machine",
              enabled: false,
            },
          ],
        }),
      });

      const result = await runLoginItemReadbackDiagnosticIfRequested({
        argv: ["Jarvis-K Alpha.exe", LOGIN_ITEM_READBACK_DIAGNOSTIC_FLAG],
        app,
        releaseChannel: "alpha",
        appId: "com.jarvis-k.desktop.alpha",
        productName: "Jarvis-K Alpha",
        outputPath,
        electronVersion: "39.8.5",
        now: () => new Date("2026-08-31T08:00:00.000Z"),
      });

      expect(result.status).toBe("completed");
      expect(getLoginItemSettings).toHaveBeenNthCalledWith(1, undefined);
      expect(getLoginItemSettings).toHaveBeenNthCalledWith(2, {
        path: expect.stringContaining("Jarvis-K Alpha.exe"),
      });
      expect(getLoginItemSettings).toHaveBeenNthCalledWith(3, {
        path: expect.stringContaining("Jarvis-K Alpha.exe"),
        args: ["--jarvis-startup=login"],
      });
      const stored = JSON.parse(await readFile(outputPath, "utf8"));
      expect(stored).toMatchObject({
        schemaVersion: 1,
        diagnostic: "login_item_readback",
        timestamp: "2026-08-31T08:00:00.000Z",
        status: "completed",
        electronVersion: "39.8.5",
        appVersion: "0.1.0-alpha.4",
        packaged: true,
        releaseChannel: "alpha",
        productName: "Jarvis-K Alpha",
        appId: "com.jarvis-k.desktop.alpha",
        startupArgument: "--jarvis-startup=login",
        installedExecutable: {
          basename: "Jarvis-K Alpha.exe",
          pathMatchesExpected: true,
        },
        sideEffects: {
          setLoginItemSettingsCalled: false,
          settingsPersistenceTouched: false,
          coreHostStarted: false,
          trayStarted: false,
          rendererStarted: false,
          realNetworkRequestSent: false,
          microphoneStarted: false,
          modelStarted: false,
          pluginStarted: false,
          executorStarted: false,
        },
      });
      expect(stored.readbacks).toHaveLength(3);
      expect(stored.readbacks[2]).toMatchObject({
        query: "exact",
        requestedPath: "installed_exe",
        requestedArgs: "login_startup",
        openAtLogin: true,
        executableWillLaunchAtLogin: true,
        launchItemsTotalCount: 2,
        jarvisRelatedLaunchItemCount: 1,
        jarvisRelatedLaunchItems: [
          {
            nameExactMatch: true,
            pathExactMatch: true,
            argsExactMatch: true,
            scope: "user",
            enabled: "true",
          },
        ],
      });
      expect(JSON.stringify(stored)).not.toContain("C:\\Users\\Alice");
      expect(JSON.stringify(stored)).not.toContain("AppData/Local");
      expect(JSON.stringify(stored)).not.toContain("HKCU");
      expect(JSON.stringify(stored)).not.toContain("Authorization");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it.each([
    { enabled: true, expected: "true" },
    { enabled: false, expected: "false" },
    { enabled: undefined, expected: "missing" },
  ] as const)("classifies launch item enabled=$expected", async ({ enabled, expected }) => {
    const report = await createLoginItemReadbackDiagnosticReport({
      app: createApp({
        getLoginItemSettings: () => ({
          openAtLogin: false,
          executableWillLaunchAtLogin: true,
          launchItems: [
            {
              name: "Jarvis-K Alpha",
              path: "C:\\Users\\Alice\\AppData\\Local\\Programs\\Jarvis-K Alpha\\Jarvis-K Alpha.exe",
              args: ["--jarvis-startup=login"],
              scope: "user",
              ...(enabled === undefined ? {} : { enabled }),
            },
          ],
        }),
      }).app,
      releaseChannel: "alpha",
      appId: "com.jarvis-k.desktop.alpha",
      productName: "Jarvis-K Alpha",
    });

    expect(report.status).toBe("completed");
    expect(report.readbacks[0]?.jarvisRelatedLaunchItems[0]?.enabled).toBe(
      expected,
    );
  });

  it("records different args and different executable without exposing the raw paths", async () => {
    const report = await createLoginItemReadbackDiagnosticReport({
      app: createApp({
        getLoginItemSettings: () => ({
          openAtLogin: false,
          executableWillLaunchAtLogin: true,
          launchItems: [
            {
              name: "Jarvis-K Alpha",
              path: "C:\\Users\\Alice\\AppData\\Local\\Programs\\Jarvis-K Alpha\\Jarvis-K Alpha.exe",
              args: ["--other"],
              scope: "machine",
            },
            {
              name: "Jarvis-K Alpha",
              path: "D:\\Other\\Jarvis-K Alpha.exe",
              args: ["--jarvis-startup=login"],
              scope: "user",
            },
          ],
        }),
      }).app,
      releaseChannel: "alpha",
      appId: "com.jarvis-k.desktop.alpha",
      productName: "Jarvis-K Alpha",
    });

    expect(report.readbacks[0]?.jarvisRelatedLaunchItems).toEqual([
      {
        nameExactMatch: true,
        pathExactMatch: true,
        argsExactMatch: false,
        scope: "machine",
        enabled: "missing",
      },
      {
        nameExactMatch: true,
        pathExactMatch: false,
        argsExactMatch: true,
        scope: "user",
        enabled: "missing",
      },
    ]);
    expect(JSON.stringify(report)).not.toContain("D:\\Other");
    expect(JSON.stringify(report)).not.toContain("C:\\Users\\Alice");
  });

  it("sanitizes Electron API failures and still writes a bounded report", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-login-diag-"));
    try {
      const outputPath = path.join(directory, "login-item-readback.json");
      const { app } = createApp({
        getLoginItemSettings: () => {
          throw new Error("C:\\Users\\Alice\\secret path");
        },
      });

      const result = await runLoginItemReadbackDiagnosticIfRequested({
        argv: [LOGIN_ITEM_READBACK_DIAGNOSTIC_FLAG],
        app,
        releaseChannel: "alpha",
        appId: "com.jarvis-k.desktop.alpha",
        productName: "Jarvis-K Alpha",
        outputPath,
      });

      expect(result.status).toBe("electron_readback_failed");
      const storedText = await readFile(outputPath, "utf8");
      expect(storedText).toContain("electron_readback_failed");
      expect(storedText).not.toContain("secret path");
      expect(storedText).not.toContain("C:\\Users\\Alice");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("fails closed for malformed Electron readback results", async () => {
    const report = await createLoginItemReadbackDiagnosticReport({
      app: createApp({
        getLoginItemSettings: () => ({
          openAtLogin: "yes",
          launchItems: "not-an-array",
        }),
      }).app,
      releaseChannel: "alpha",
      appId: "com.jarvis-k.desktop.alpha",
      productName: "Jarvis-K Alpha",
    });

    expect(report.status).toBe("invalid_electron_result");
    expect(report.readbacks).toHaveLength(3);
    expect(report.readbacks.every((readback) => readback.status === "invalid"))
      .toBe(true);
  });

  it("overwrites the fixed diagnostic file instead of appending logs", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-login-diag-"));
    try {
      const outputPath = path.join(directory, "login-item-readback.json");
      await runLoginItemReadbackDiagnosticIfRequested({
        argv: [LOGIN_ITEM_READBACK_DIAGNOSTIC_FLAG],
        app: createApp({ version: "0.1.0-alpha.3" }).app,
        releaseChannel: "alpha",
        appId: "com.jarvis-k.desktop.alpha",
        productName: "Jarvis-K Alpha",
        outputPath,
      });
      await runLoginItemReadbackDiagnosticIfRequested({
        argv: [LOGIN_ITEM_READBACK_DIAGNOSTIC_FLAG],
        app: createApp({ version: "0.1.0-alpha.4" }).app,
        releaseChannel: "alpha",
        appId: "com.jarvis-k.desktop.alpha",
        productName: "Jarvis-K Alpha",
        outputPath,
      });

      const stored = await readFile(outputPath, "utf8");
      expect(stored).toContain("0.1.0-alpha.4");
      expect(stored).not.toContain("0.1.0-alpha.3");
      expect(stored.trim().split("\n").filter((line) => line.includes("schemaVersion")))
        .toHaveLength(1);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("keeps diagnostic startup before CoreHost, Tray, Renderer, and IPC registration", async () => {
    const mainSource = await readFile(
      path.join(process.cwd(), "apps", "desktop", "src", "main.ts"),
      "utf8",
    );
    const diagnosticIndex = mainSource.indexOf(
      "runLoginItemReadbackDiagnosticIfRequested",
      mainSource.indexOf("app.whenReady"),
    );

    expect(diagnosticIndex).toBeGreaterThan(-1);
    expect(diagnosticIndex).toBeLessThan(mainSource.indexOf("const coreEntry"));
    expect(diagnosticIndex).toBeLessThan(mainSource.indexOf("supervisorController.start"));
    expect(diagnosticIndex).toBeLessThan(mainSource.indexOf("trayController.create"));
    expect(diagnosticIndex).toBeLessThan(mainSource.indexOf("createTrackedMainWindow"));
  });

  it("does not add IPC or writable renderer payloads for the diagnostic", async () => {
    const source = await readFile(
      path.join(
        process.cwd(),
        "apps",
        "desktop",
        "src",
        "login-item",
        "login-item-readback-diagnostic.ts",
      ),
      "utf8",
    );

    expect(source).not.toContain("ipcMain");
    expect(source).not.toContain("ipcRenderer");
    expect(source).not.toContain(".setLoginItemSettings(");
    expect(source).not.toContain("process.env");
  });
});
