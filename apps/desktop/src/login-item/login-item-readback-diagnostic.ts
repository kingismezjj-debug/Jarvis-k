import { mkdir, open, rename, rm } from "node:fs/promises";
import path from "node:path";
import { LOGIN_STARTUP_ARGUMENT } from "../startup/startup-source";
import type {
  ElectronLoginItemLaunchItem,
  ElectronLoginItemSettings,
  ElectronLoginItemStatus,
} from "./login-item-controller";
import type { ReleaseChannel } from "../storage/storage-profile";

export const LOGIN_ITEM_READBACK_DIAGNOSTIC_FLAG =
  "--jarvis-diagnose-login-item-readback";
export const LOGIN_ITEM_READBACK_DIAGNOSTIC_SCHEMA_VERSION = 1;

export type LoginItemReadbackDiagnosticStatus =
  | "skipped"
  | "completed"
  | "unsupported_release_channel"
  | "electron_readback_failed"
  | "invalid_electron_result"
  | "write_failed";

export interface LoginItemReadbackDiagnosticApp {
  readonly isPackaged: boolean;
  getPath(name: "exe"): string;
  getVersion(): string;
  getLoginItemSettings(settings?: ElectronLoginItemSettings): unknown;
}

export interface LoginItemReadbackDiagnosticOptions {
  readonly argv: readonly string[];
  readonly app: LoginItemReadbackDiagnosticApp;
  readonly releaseChannel: ReleaseChannel;
  readonly appId: string;
  readonly productName: string;
  readonly outputPath: string;
  readonly electronVersion?: string;
  readonly now?: () => Date;
}

export interface LoginItemReadbackDiagnosticExecutionResult {
  readonly handled: boolean;
  readonly status: LoginItemReadbackDiagnosticStatus;
  readonly outputPath?: string;
  readonly report?: LoginItemReadbackDiagnosticReport;
}

export interface LoginItemReadbackDiagnosticReport {
  readonly schemaVersion: 1;
  readonly diagnostic: "login_item_readback";
  readonly timestamp: string;
  readonly status: Exclude<LoginItemReadbackDiagnosticStatus, "skipped">;
  readonly errorCode?: string;
  readonly electronVersion: string;
  readonly appVersion: string;
  readonly packaged: boolean;
  readonly releaseChannel: ReleaseChannel;
  readonly productName: string;
  readonly appId: string;
  readonly startupArgument: typeof LOGIN_STARTUP_ARGUMENT;
  readonly installedExecutable: {
    readonly basename: string;
    readonly pathMatchesExpected: true;
  };
  readonly readbacks: readonly LoginItemReadbackDiagnosticReadback[];
  readonly sideEffects: {
    readonly setLoginItemSettingsCalled: false;
    readonly settingsPersistenceTouched: false;
    readonly coreHostStarted: false;
    readonly trayStarted: false;
    readonly rendererStarted: false;
    readonly realNetworkRequestSent: false;
    readonly microphoneStarted: false;
    readonly modelStarted: false;
    readonly pluginStarted: false;
    readonly executorStarted: false;
  };
}

export interface LoginItemReadbackDiagnosticReadback {
  readonly query: "default" | "executable" | "exact";
  readonly requestedPath: "absent" | "installed_exe";
  readonly requestedArgs: "absent" | "login_startup";
  readonly status: "ok" | "error" | "invalid";
  readonly errorCode?: string;
  readonly openAtLogin?: boolean;
  readonly executableWillLaunchAtLogin?: boolean | "missing";
  readonly launchItemsTotalCount: number;
  readonly jarvisRelatedLaunchItemCount: number;
  readonly jarvisRelatedLaunchItems: readonly LoginItemReadbackDiagnosticLaunchItem[];
}

export interface LoginItemReadbackDiagnosticLaunchItem {
  readonly nameExactMatch: boolean;
  readonly pathExactMatch: boolean;
  readonly argsExactMatch: boolean;
  readonly scope: "user" | "machine" | "missing" | "unknown";
  readonly enabled: "true" | "false" | "missing";
}

export async function runLoginItemReadbackDiagnosticIfRequested(
  options: LoginItemReadbackDiagnosticOptions,
): Promise<LoginItemReadbackDiagnosticExecutionResult> {
  if (!isLoginItemReadbackDiagnosticRequested(options.argv)) {
    return { handled: false, status: "skipped" };
  }

  const report = await createLoginItemReadbackDiagnosticReport(options);
  try {
    await writeLoginItemReadbackDiagnostic(options.outputPath, report);
    return {
      handled: true,
      outputPath: options.outputPath,
      report,
      status: report.status,
    };
  } catch {
    return {
      handled: true,
      report: { ...report, status: "write_failed", errorCode: "write_failed" },
      status: "write_failed",
    };
  }
}

export function isLoginItemReadbackDiagnosticRequested(
  argv: readonly string[],
): boolean {
  return argv.includes(LOGIN_ITEM_READBACK_DIAGNOSTIC_FLAG);
}

export async function createLoginItemReadbackDiagnosticReport(
  options: Omit<LoginItemReadbackDiagnosticOptions, "argv" | "outputPath">,
): Promise<LoginItemReadbackDiagnosticReport> {
  const executablePath = options.app.getPath("exe");
  const baseReport = createBaseReport(options, executablePath);
  if (!options.app.isPackaged || options.releaseChannel !== "alpha") {
    return {
      ...baseReport,
      status: "unsupported_release_channel",
      errorCode: "unsupported_release_channel",
      readbacks: [],
    };
  }

  const readbacks = [
    readLoginItemSettings(options, executablePath, "default", undefined),
    readLoginItemSettings(options, executablePath, "executable", {
      path: executablePath,
    }),
    readLoginItemSettings(options, executablePath, "exact", {
      path: executablePath,
      args: [LOGIN_STARTUP_ARGUMENT],
    }),
  ];
  const hasInvalid = readbacks.some((readback) => readback.status === "invalid");
  const hasError = readbacks.some((readback) => readback.status === "error");
  return {
    ...baseReport,
    status: hasInvalid
      ? "invalid_electron_result"
      : hasError
        ? "electron_readback_failed"
        : "completed",
    ...(hasInvalid
      ? { errorCode: "invalid_electron_result" }
      : hasError
        ? { errorCode: "electron_readback_failed" }
        : {}),
    readbacks,
  };
}

async function writeLoginItemReadbackDiagnostic(
  outputPath: string,
  report: LoginItemReadbackDiagnosticReport,
): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp`;
  const file = await open(temporaryPath, "w");
  try {
    await file.writeFile(`${JSON.stringify(report, null, 2)}\n`, "utf8");
    await file.sync();
  } finally {
    await file.close();
  }
  try {
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

function createBaseReport(
  options: Omit<LoginItemReadbackDiagnosticOptions, "argv" | "outputPath">,
  executablePath: string,
): Omit<LoginItemReadbackDiagnosticReport, "readbacks" | "status" | "errorCode"> {
  return {
    schemaVersion: LOGIN_ITEM_READBACK_DIAGNOSTIC_SCHEMA_VERSION,
    diagnostic: "login_item_readback",
    timestamp: (options.now?.() ?? new Date()).toISOString(),
    electronVersion: options.electronVersion ?? process.versions.electron ?? "unknown",
    appVersion: safeTrim(options.app.getVersion()),
    packaged: options.app.isPackaged,
    releaseChannel: options.releaseChannel,
    productName: safeTrim(options.productName),
    appId: safeTrim(options.appId),
    startupArgument: LOGIN_STARTUP_ARGUMENT,
    installedExecutable: {
      basename: path.basename(executablePath),
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
  };
}

function readLoginItemSettings(
  options: Omit<LoginItemReadbackDiagnosticOptions, "argv" | "outputPath">,
  executablePath: string,
  query: LoginItemReadbackDiagnosticReadback["query"],
  settings: ElectronLoginItemSettings | undefined,
): LoginItemReadbackDiagnosticReadback {
  try {
    const raw = options.app.getLoginItemSettings(settings);
    const status = parseElectronLoginItemStatus(raw);
    return sanitizeLoginItemStatus({
      query,
      requestedPath: settings?.path ? "installed_exe" : "absent",
      requestedArgs: settings?.args?.includes(LOGIN_STARTUP_ARGUMENT)
        ? "login_startup"
        : "absent",
      status,
      executablePath,
      productName: options.productName,
    });
  } catch (error) {
    return {
      query,
      requestedPath: settings?.path ? "installed_exe" : "absent",
      requestedArgs: settings?.args?.includes(LOGIN_STARTUP_ARGUMENT)
        ? "login_startup"
        : "absent",
      status: error instanceof InvalidElectronLoginItemResultError
        ? "invalid"
        : "error",
      errorCode: error instanceof InvalidElectronLoginItemResultError
        ? "invalid_electron_result"
        : "electron_readback_failed",
      launchItemsTotalCount: 0,
      jarvisRelatedLaunchItemCount: 0,
      jarvisRelatedLaunchItems: [],
    };
  }
}

function parseElectronLoginItemStatus(raw: unknown): ElectronLoginItemStatus {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new InvalidElectronLoginItemResultError();
  }
  const record = raw as Record<string, unknown>;
  if (typeof record.openAtLogin !== "boolean") {
    throw new InvalidElectronLoginItemResultError();
  }
  if (
    "executableWillLaunchAtLogin" in record &&
    typeof record.executableWillLaunchAtLogin !== "boolean"
  ) {
    throw new InvalidElectronLoginItemResultError();
  }
  if ("launchItems" in record && !Array.isArray(record.launchItems)) {
    throw new InvalidElectronLoginItemResultError();
  }
  const launchItems = Array.isArray(record.launchItems)
    ? record.launchItems.map(parseLaunchItem)
    : undefined;
  return {
    openAtLogin: record.openAtLogin,
    ...(typeof record.executableWillLaunchAtLogin === "boolean"
      ? { executableWillLaunchAtLogin: record.executableWillLaunchAtLogin }
      : {}),
    ...(launchItems ? { launchItems } : {}),
  };
}

function parseLaunchItem(raw: unknown) {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new InvalidElectronLoginItemResultError();
  }
  const record = raw as Record<string, unknown>;
  for (const key of ["name", "path", "scope"] as const) {
    if (key in record && typeof record[key] !== "string") {
      throw new InvalidElectronLoginItemResultError();
    }
  }
  if (
    "args" in record &&
    (!Array.isArray(record.args) ||
      !record.args.every((argument) => typeof argument === "string"))
  ) {
    throw new InvalidElectronLoginItemResultError();
  }
  if ("enabled" in record && typeof record.enabled !== "boolean") {
    throw new InvalidElectronLoginItemResultError();
  }
  return {
    ...(typeof record.name === "string" ? { name: record.name } : {}),
    ...(typeof record.path === "string" ? { path: record.path } : {}),
    ...(Array.isArray(record.args) ? { args: record.args as string[] } : {}),
    ...(typeof record.scope === "string" ? { scope: record.scope } : {}),
    ...(typeof record.enabled === "boolean" ? { enabled: record.enabled } : {}),
  };
}

function sanitizeLoginItemStatus(input: {
  readonly query: LoginItemReadbackDiagnosticReadback["query"];
  readonly requestedPath: LoginItemReadbackDiagnosticReadback["requestedPath"];
  readonly requestedArgs: LoginItemReadbackDiagnosticReadback["requestedArgs"];
  readonly status: ElectronLoginItemStatus;
  readonly executablePath: string;
  readonly productName: string;
}): LoginItemReadbackDiagnosticReadback {
  const launchItems = input.status.launchItems ?? [];
  const jarvisRelatedLaunchItems = launchItems
    .filter((item) => isJarvisRelatedLaunchItem(item, input))
    .map((item) => ({
      nameExactMatch: item.name === input.productName,
      pathExactMatch: pathsEqual(item.path, input.executablePath),
      argsExactMatch: argsEqual(item.args ?? [], [LOGIN_STARTUP_ARGUMENT]),
      scope: classifyScope(item.scope),
      enabled:
        item.enabled === true
          ? "true" as const
          : item.enabled === false
            ? "false" as const
            : "missing" as const,
    }));
  return {
    query: input.query,
    requestedPath: input.requestedPath,
    requestedArgs: input.requestedArgs,
    status: "ok",
    openAtLogin: input.status.openAtLogin === true,
    executableWillLaunchAtLogin:
      typeof input.status.executableWillLaunchAtLogin === "boolean"
        ? input.status.executableWillLaunchAtLogin
        : "missing",
    launchItemsTotalCount: launchItems.length,
    jarvisRelatedLaunchItemCount: jarvisRelatedLaunchItems.length,
    jarvisRelatedLaunchItems,
  };
}

function isJarvisRelatedLaunchItem(
  item: ElectronLoginItemLaunchItem,
  input: { readonly executablePath: string; readonly productName: string },
): boolean {
  return (
    item.name?.toLowerCase().includes("jarvis") === true ||
    pathsEqual(item.path, input.executablePath) ||
    item.path?.toLowerCase().includes("jarvis") === true ||
    item.args?.includes(LOGIN_STARTUP_ARGUMENT) === true
  );
}

function classifyScope(
  scope: string | undefined,
): LoginItemReadbackDiagnosticLaunchItem["scope"] {
  if (scope === undefined) return "missing";
  if (scope === "user" || scope === "machine") return scope;
  return "unknown";
}

function safeTrim(value: string): string {
  return value.trim() || "unknown";
}

function pathsEqual(left: string | undefined, right: string): boolean {
  if (!left) return false;
  return left.replaceAll("/", "\\").toLowerCase() ===
    right.replaceAll("/", "\\").toLowerCase();
}

function argsEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

class InvalidElectronLoginItemResultError extends Error {
  public constructor() {
    super("invalid electron login item result");
  }
}
