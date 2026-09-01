import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const ALPHA5_UPGRADE_HARNESS_SCHEMA_VERSION = 1;
export const ALPHA5_TARGET_VERSION = "0.1.0-alpha.5";
export const ALPHA5_TARGET_SHORT_VERSION_WINDOWS = "0.1.0.5";
export const ALPHA4_SOURCE_VERSION = "0.1.0-alpha.4";
export const ALPHA_PRODUCT_NAME = "Jarvis-K Alpha";
export const ALPHA_APP_ID = "com.jarvis-k.desktop.alpha";
export const SYNTHETIC_FIXTURE_MARKER = "jarvis-k-alpha-upgrade-fixture.json";
export const DESKTOP_SETTINGS_FILE = "jarvis-k-desktop-settings.json";

const DEFAULT_RC4_SHA256 =
  "CB1822F19F05A7C8B896CDADAF7681F0477142C045C8F866A2F97BAB957664FD";
const DEFAULT_RC7_SHA256 =
  "27B762859686245C13B6F81C781970F152E64FF82FF29B115471DB6CD0A21C05";

const FORBIDDEN_PROFILE_PATTERNS = [
  /credential/i,
  /provider/i,
  /memory\.sqlite$/i,
  /task-runtime\.sqlite$/i,
  /Local Storage/i,
  /Session Storage/i,
  /Network/i,
  /\.db$/i,
  /\.sqlite3?$/i,
  /chat/i,
  /conversation/i,
  /transcript/i,
  /token/i,
  /secret/i,
  /key/i,
];

export function createSyntheticUpgradeFixture(now = new Date()) {
  return {
    marker: {
      schemaVersion: ALPHA5_UPGRADE_HARNESS_SCHEMA_VERSION,
      synthetic: true,
      generatedAt: now.toISOString(),
      target: "jarvis-k-alpha-upgrade-compatibility",
      noSecrets: true,
      containsCredential: false,
      containsMemoryBody: false,
      containsChatHistory: false,
      containsProviderConfiguration: false,
      containsModelCache: false,
      source: "ui-3h-1-fixture-generator",
    },
    desktopSettings: {
      closeButtonBehavior: "minimize_to_tray",
      closeToTrayNoticeShown: true,
      launchAtLoginEnabled: false,
      uiTheme: "harbor",
      uiThemeExplicitlyConfigured: true,
      desktopPetEnabled: true,
      desktopPetAlwaysOnTop: true,
      desktopPetReducedMotion: "system",
      firstRunOnboardingVersion: 1,
      firstRunOnboardingState: "completed",
      firstRunOnboardingStateChangedAt: "2026-09-01T00:00:00.000Z",
      persistedLocally: true,
      syncedToCloud: false,
    },
  };
}

export function writeSyntheticUpgradeFixture(directory, now = new Date()) {
  const resolved = path.resolve(directory);
  mkdirSync(resolved, { recursive: true });
  const fixture = createSyntheticUpgradeFixture(now);
  writeJson(path.join(resolved, SYNTHETIC_FIXTURE_MARKER), fixture.marker);
  writeJson(path.join(resolved, DESKTOP_SETTINGS_FILE), fixture.desktopSettings);
  return {
    ok: true,
    directory: resolved,
    files: [SYNTHETIC_FIXTURE_MARKER, DESKTOP_SETTINGS_FILE],
    marker: fixture.marker,
  };
}

export function createAlpha5UpgradeAcceptancePlan() {
  return {
    schemaVersion: ALPHA5_UPGRADE_HARNESS_SCHEMA_VERSION,
    phase: "UI-3H-1 Alpha.5 Upgrade Compatibility Harness",
    targetVersion: ALPHA5_TARGET_VERSION,
    targetShortVersionWindows: ALPHA5_TARGET_SHORT_VERSION_WINDOWS,
    productName: ALPHA_PRODUCT_NAME,
    appId: ALPHA_APP_ID,
    downgradePolicy: {
      supported: false,
      reason:
        "Downgrade is not a supported rollback path; use env=0 or session classic-settings rollback.",
      futureSignedUpdaterMustRejectVersionRollback: true,
    },
    sourcePackages: [
      {
        id: "rc4-alpha4",
        version: ALPHA4_SOURCE_VERSION,
        role: "primary-upgrade-source",
        sha256: DEFAULT_RC4_SHA256,
        allowedAsUpgradeSource: true,
        allowedAsUpgradeTarget: false,
      },
      {
        id: "legacy-login-identity-fixture",
        version: ALPHA4_SOURCE_VERSION,
        role: "secondary-isolated-identity-scenario",
        legacyIdentity: "Jarvis-K Alpha",
        legacyStartupArgument: "--jarvis-startup=login",
        allowedAsUpgradeSource: true,
        productRecommendation: false,
      },
      {
        id: "rc7-alpha4",
        version: ALPHA4_SOURCE_VERSION,
        role: "current-same-version-baseline",
        sha256: DEFAULT_RC7_SHA256,
        sameVersionUpgradeEvidence: false,
      },
    ],
    acceptanceMatrix: [
      "clean-alpha5-install",
      "rc4-alpha4-to-alpha5-overwrite",
      "legacy-login-identity-to-alpha5",
      "alpha5-uninstall-retains-synthetic-data",
      "alpha5-to-alpha4-downgrade-observation-unsupported",
    ],
    execution: {
      installerExecutionImplemented: false,
      requiresHumanInstallApproval: true,
      requiresIsolatedWindowsProfileOrVm: true,
      realUserProfileAllowed: false,
      modifiesRegistry: false,
      modifiesGlobalEnvironment: false,
    },
  };
}

export function preflightUpgradeAcceptance(input) {
  const issues = [];
  const profile = inspectSyntheticProfile(input.profileDirectory);
  if (!profile.synthetic) issues.push("synthetic_profile_marker_missing");
  if (!profile.noSecrets) issues.push("synthetic_profile_no_secrets_failed");
  if (profile.forbiddenEntries.length > 0) issues.push("sensitive_profile_entries_present");

  const source = inspectInstaller(input.sourceInstallerPath);
  const target = inspectInstaller(input.targetInstallerPath);
  if (!source.exists) issues.push("source_installer_missing");
  if (!target.exists) issues.push("target_installer_missing");
  if (source.version !== ALPHA4_SOURCE_VERSION) issues.push("source_version_not_alpha4");
  if (target.version !== ALPHA5_TARGET_VERSION) issues.push("target_version_not_alpha5");
  if (!isVersionUpgrade(source.version, target.version)) {
    issues.push("target_not_higher_version");
  }
  const allowlist = new Set(input.installerSha256Allowlist ?? []);
  if (source.sha256 && !allowlist.has(source.sha256)) {
    issues.push("source_installer_hash_not_allowlisted");
  }
  if (target.sha256 && !allowlist.has(target.sha256)) {
    issues.push("target_installer_hash_not_allowlisted");
  }

  const observation = input.machineObservation ?? {};
  if (observation.jarvisProcessCount !== 0) issues.push("jarvis_processes_running");
  if (observation.launchAtLoginOff !== true) issues.push("launch_at_login_not_confirmed_off");
  if (observation.runIdentityCount !== 0) issues.push("jarvis_run_identities_present");
  if (observation.adminUrlRemovedFromChildEnvironment !== true) {
    issues.push("admin_url_not_removed_from_child_environment");
  }
  if (observation.gateEnvRemovedFromChildEnvironment !== true) {
    issues.push("gate_env_not_removed_from_child_environment");
  }

  return {
    schemaVersion: ALPHA5_UPGRADE_HARNESS_SCHEMA_VERSION,
    ok: issues.length === 0,
    phase: "UI-3H-1",
    source,
    target,
    profile,
    issues,
    executionBlocked: true,
    reason: issues.length === 0
      ? "preflight_only_harness_ready_for_human_approval"
      : "preflight_failed_closed",
  };
}

export function classifyUpgradePath(sourceVersion, targetVersion) {
  if (sourceVersion === targetVersion) {
    return "same_version_not_upgrade_evidence";
  }
  if (isVersionUpgrade(sourceVersion, targetVersion)) {
    return "upgrade_allowed_for_isolated_acceptance";
  }
  return "downgrade_unsupported";
}

function inspectSyntheticProfile(directory) {
  const resolved = path.resolve(directory);
  const markerPath = path.join(resolved, SYNTHETIC_FIXTURE_MARKER);
  const settingsPath = path.join(resolved, DESKTOP_SETTINGS_FILE);
  const marker = readJsonIfPresent(markerPath);
  const entries = existsSync(resolved) ? walk(resolved) : [];
  const forbiddenEntries = entries
    .map((entry) => path.relative(resolved, entry).split(path.sep).join("/"))
    .filter((relative) =>
      FORBIDDEN_PROFILE_PATTERNS.some((pattern) => pattern.test(relative)),
    );
  return {
    exists: existsSync(resolved),
    synthetic: marker?.synthetic === true,
    schemaVersion: marker?.schemaVersion ?? null,
    noSecrets:
      marker?.noSecrets === true &&
      marker?.containsCredential === false &&
      marker?.containsMemoryBody === false &&
      marker?.containsChatHistory === false &&
      marker?.containsProviderConfiguration === false,
    settingsFilePresent: existsSync(settingsPath),
    forbiddenEntries,
  };
}

function inspectInstaller(installerPath) {
  const resolved = path.resolve(installerPath);
  const exists = existsSync(resolved);
  const basename = path.basename(resolved);
  return {
    exists,
    basename,
    sha256: exists ? sha256File(resolved) : null,
    sizeBytes: exists ? statSync(resolved).size : null,
    version: parseVersionFromInstallerName(basename),
    pathStored: false,
  };
}

function parseVersionFromInstallerName(name) {
  const match = name.match(/(\d+\.\d+\.\d+-alpha\.\d+)/u);
  return match?.[1] ?? "unknown";
}

function isVersionUpgrade(sourceVersion, targetVersion) {
  const source = parseAlphaVersion(sourceVersion);
  const target = parseAlphaVersion(targetVersion);
  if (!source || !target) return false;
  if (target.major !== source.major || target.minor !== source.minor || target.patch !== source.patch) {
    return false;
  }
  return target.alpha > source.alpha;
}

function parseAlphaVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)-alpha\.(\d+)$/u);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    alpha: Number(match[4]),
  };
}

function readJsonIfPresent(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function walk(directory) {
  const entries = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    entries.push(fullPath);
    if (entry.isDirectory()) {
      entries.push(...walk(fullPath));
    }
  }
  return entries;
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
}

async function main(argv) {
  if (argv.includes("--plan")) {
    process.stdout.write(`${JSON.stringify(createAlpha5UpgradeAcceptancePlan(), null, 2)}\n`);
    return;
  }
  const fixtureIndex = argv.indexOf("--write-fixture");
  if (fixtureIndex >= 0) {
    const directory = argv[fixtureIndex + 1];
    if (!directory) throw new Error("--write-fixture requires a directory");
    process.stdout.write(`${JSON.stringify(writeSyntheticUpgradeFixture(directory), null, 2)}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(createAlpha5UpgradeAcceptancePlan(), null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : "unknown error"}\n`);
    process.exitCode = 1;
  });
}
