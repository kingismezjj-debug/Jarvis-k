import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import {
  ALPHA5_TARGET_SHORT_VERSION_WINDOWS,
  ALPHA5_TARGET_VERSION,
  ALPHA_APP_ID,
  ALPHA_PRODUCT_NAME,
  classifyUpgradePath,
  createAlpha5UpgradeAcceptancePlan,
  createSyntheticUpgradeFixture,
  preflightUpgradeAcceptance,
  writeSyntheticUpgradeFixture,
} from "../../../scripts/alpha5-upgrade-compatibility-harness.mjs";

const temporaryDirectories: string[] = [];

function makeTempDirectory() {
  const directory = mkdtempSync(path.join(tmpdir(), "jarvis-k-alpha5-upgrade-"));
  temporaryDirectories.push(directory);
  return directory;
}

function writeInstallerFixture(directory: string, basename: string, content: string) {
  const fullPath = path.join(directory, basename);
  writeFileSync(fullPath, content, "utf8");
  return {
    path: fullPath,
    sha256: createHash("sha256").update(content).digest("hex").toUpperCase(),
  };
}

function cleanMachineObservation(overrides = {}) {
  return {
    jarvisProcessCount: 0,
    launchAtLoginOff: true,
    runIdentityCount: 0,
    adminUrlRemovedFromChildEnvironment: true,
    gateEnvRemovedFromChildEnvironment: true,
    ...overrides,
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("alpha.5 upgrade compatibility harness", () => {
  it("pins the alpha.5 package identity and downgrade policy", () => {
    const plan = createAlpha5UpgradeAcceptancePlan();

    expect(ALPHA5_TARGET_VERSION).toBe("0.1.0-alpha.5");
    expect(ALPHA5_TARGET_SHORT_VERSION_WINDOWS).toBe("0.1.0.5");
    expect(ALPHA_PRODUCT_NAME).toBe("Jarvis-K Alpha");
    expect(ALPHA_APP_ID).toBe("com.jarvis-k.desktop.alpha");
    expect(plan.targetVersion).toBe("0.1.0-alpha.5");
    expect(plan.targetShortVersionWindows).toBe("0.1.0.5");
    expect(plan.downgradePolicy.supported).toBe(false);
    expect(plan.execution.installerExecutionImplemented).toBe(false);
    expect(plan.execution.realUserProfileAllowed).toBe(false);
    expect(plan.sourcePackages.find((source) => source.id === "rc7-alpha4")?.sameVersionUpgradeEvidence)
      .toBe(false);
  });

  it("creates a synthetic, no-secret fixture without touching the real profile", () => {
    const fixture = createSyntheticUpgradeFixture(new Date("2026-09-01T00:00:00.000Z"));

    expect(fixture.marker.synthetic).toBe(true);
    expect(fixture.marker.noSecrets).toBe(true);
    expect(fixture.marker.containsCredential).toBe(false);
    expect(fixture.marker.containsMemoryBody).toBe(false);
    expect(fixture.marker.containsChatHistory).toBe(false);
    expect(fixture.marker.containsProviderConfiguration).toBe(false);
    expect(fixture.desktopSettings.launchAtLoginEnabled).toBe(false);
    expect(fixture.desktopSettings.uiTheme).toBe("harbor");
    expect(JSON.stringify(fixture.desktopSettings)).not.toMatch(/credential|provider|token|secret|memory/i);
  });

  it("writes only the fixture marker and desktop settings file", () => {
    const directory = makeTempDirectory();
    const result = writeSyntheticUpgradeFixture(directory, new Date("2026-09-01T00:00:00.000Z"));

    expect(result.ok).toBe(true);
    expect(result.files).toEqual([
      "jarvis-k-alpha-upgrade-fixture.json",
      "jarvis-k-desktop-settings.json",
    ]);
  });

  it("fails closed when the synthetic profile marker is missing", () => {
    const directory = makeTempDirectory();
    const source = writeInstallerFixture(
      directory,
      "Jarvis-K-Alpha-0.1.0-alpha.4-Setup.exe",
      "alpha4",
    );
    const target = writeInstallerFixture(
      directory,
      "Jarvis-K-Alpha-0.1.0-alpha.5-Upgrade-Internal-Setup.exe",
      "alpha5",
    );

    const result = preflightUpgradeAcceptance({
      profileDirectory: directory,
      sourceInstallerPath: source.path,
      targetInstallerPath: target.path,
      installerSha256Allowlist: [source.sha256, target.sha256],
      machineObservation: cleanMachineObservation(),
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("preflight_failed_closed");
    expect(result.issues).toContain("synthetic_profile_marker_missing");
  });

  it("rejects unsafe profile contents instead of accepting a real user profile", () => {
    const directory = makeTempDirectory();
    writeSyntheticUpgradeFixture(directory);
    writeFileSync(path.join(directory, "memory.sqlite"), "not-real-user-data", "utf8");

    const result = preflightUpgradeAcceptance({
      profileDirectory: directory,
      sourceInstallerPath: path.join(directory, "Jarvis-K-Alpha-0.1.0-alpha.4-Setup.exe"),
      targetInstallerPath: path.join(directory, "Jarvis-K-Alpha-0.1.0-alpha.5-Upgrade-Internal-Setup.exe"),
      installerSha256Allowlist: [],
      machineObservation: cleanMachineObservation(),
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContain("sensitive_profile_entries_present");
  });

  it("requires allowlisted installer hashes and alpha.4 to alpha.5 ordering", () => {
    const directory = makeTempDirectory();
    const profile = path.join(directory, "profile");
    writeSyntheticUpgradeFixture(profile);
    const source = writeInstallerFixture(
      directory,
      "Jarvis-K-Alpha-0.1.0-alpha.4-Setup.exe",
      "alpha4",
    );
    const target = writeInstallerFixture(
      directory,
      "Jarvis-K-Alpha-0.1.0-alpha.5-Upgrade-Internal-Setup.exe",
      "alpha5",
    );

    const result = preflightUpgradeAcceptance({
      profileDirectory: profile,
      sourceInstallerPath: source.path,
      targetInstallerPath: target.path,
      installerSha256Allowlist: [source.sha256, target.sha256],
      machineObservation: cleanMachineObservation(),
    });

    expect(result.ok).toBe(true);
    expect(result.executionBlocked).toBe(true);
    expect(result.reason).toBe("preflight_only_harness_ready_for_human_approval");
    expect(result.source.version).toBe("0.1.0-alpha.4");
    expect(result.target.version).toBe("0.1.0-alpha.5");
    expect(result.source.pathStored).toBe(false);
    expect(result.target.pathStored).toBe(false);
  });

  it("fails closed when installer hashes are not allowlisted", () => {
    const directory = makeTempDirectory();
    const profile = path.join(directory, "profile");
    writeSyntheticUpgradeFixture(profile);
    const source = writeInstallerFixture(
      directory,
      "Jarvis-K-Alpha-0.1.0-alpha.4-Setup.exe",
      "alpha4",
    );
    const target = writeInstallerFixture(
      directory,
      "Jarvis-K-Alpha-0.1.0-alpha.5-Upgrade-Internal-Setup.exe",
      "alpha5",
    );

    const result = preflightUpgradeAcceptance({
      profileDirectory: profile,
      sourceInstallerPath: source.path,
      targetInstallerPath: target.path,
      installerSha256Allowlist: [source.sha256],
      machineObservation: cleanMachineObservation(),
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContain("target_installer_hash_not_allowlisted");
  });

  it("rejects running processes, login entries, and uncleared child environment", () => {
    const directory = makeTempDirectory();
    const profile = path.join(directory, "profile");
    writeSyntheticUpgradeFixture(profile);
    const source = writeInstallerFixture(
      directory,
      "Jarvis-K-Alpha-0.1.0-alpha.4-Setup.exe",
      "alpha4",
    );
    const target = writeInstallerFixture(
      directory,
      "Jarvis-K-Alpha-0.1.0-alpha.5-Upgrade-Internal-Setup.exe",
      "alpha5",
    );

    const result = preflightUpgradeAcceptance({
      profileDirectory: profile,
      sourceInstallerPath: source.path,
      targetInstallerPath: target.path,
      installerSha256Allowlist: [source.sha256, target.sha256],
      machineObservation: cleanMachineObservation({
        jarvisProcessCount: 1,
        launchAtLoginOff: false,
        runIdentityCount: 1,
        adminUrlRemovedFromChildEnvironment: false,
        gateEnvRemovedFromChildEnvironment: false,
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        "jarvis_processes_running",
        "launch_at_login_not_confirmed_off",
        "jarvis_run_identities_present",
        "admin_url_not_removed_from_child_environment",
        "gate_env_not_removed_from_child_environment",
      ]),
    );
  });

  it("classifies same-version and downgrade paths conservatively", () => {
    expect(classifyUpgradePath("0.1.0-alpha.4", "0.1.0-alpha.5")).toBe(
      "upgrade_allowed_for_isolated_acceptance",
    );
    expect(classifyUpgradePath("0.1.0-alpha.4", "0.1.0-alpha.4")).toBe(
      "same_version_not_upgrade_evidence",
    );
    expect(classifyUpgradePath("0.1.0-alpha.5", "0.1.0-alpha.4")).toBe(
      "downgrade_unsupported",
    );
  });
});
