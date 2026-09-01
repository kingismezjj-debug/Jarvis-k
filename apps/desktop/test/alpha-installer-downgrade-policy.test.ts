import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  ALPHA_APP_ID,
  ALPHA_CHANNEL,
  ALPHA_CURRENT_VERSION,
  ALPHA_DOWNGRADE_EXIT_CODE,
  ALPHA_INSTALLER_POLICY_SCHEMA_VERSION,
  ALPHA_INSTALLER_STATE_KEY,
  ALPHA_MARKER_FAILURE_EXIT_CODE,
  ALPHA_RELEASE_ORDINAL,
  ALPHA_SHORT_VERSION_WINDOWS,
  classifyAlphaInstallerPolicy,
  createAlphaInstallerPolicyPlan,
} from "../../../scripts/alpha-installer-downgrade-policy.mjs";

const rootDirectory = path.resolve(import.meta.dirname, "..", "..", "..");
const nsisPolicyPath = path.join(
  rootDirectory,
  "build",
  "nsis",
  "alpha-installer-policy.nsh",
);
const packageJson = JSON.parse(
  readFileSync(path.join(rootDirectory, "package.json"), "utf8"),
) as {
  version?: string;
  shortVersionWindows?: string;
  build?: { appId?: string; productName?: string; nsis?: { include?: string } };
};
const packageLock = JSON.parse(
  readFileSync(path.join(rootDirectory, "package-lock.json"), "utf8"),
) as { version?: string; packages?: Record<string, { version?: string }> };

function marker(overrides = {}) {
  return {
    schemaVersion: ALPHA_INSTALLER_POLICY_SCHEMA_VERSION,
    installedReleaseOrdinal: ALPHA_RELEASE_ORDINAL,
    installedVersion: ALPHA_CURRENT_VERSION,
    appId: ALPHA_APP_ID,
    channel: ALPHA_CHANNEL,
    ...overrides,
  };
}

describe("Alpha installer downgrade prevention policy", () => {
  it("keeps package metadata, policy constants, and NSIS marker values synchronized", () => {
    const nsis = readFileSync(nsisPolicyPath, "utf8");

    expect(packageJson.version).toBe("0.1.0-alpha.6");
    expect(packageLock.version).toBe("0.1.0-alpha.6");
    expect(packageLock.packages?.[""]?.version).toBe("0.1.0-alpha.6");
    expect(packageJson.shortVersionWindows).toBe("0.1.0.6");
    expect(packageJson.build?.appId).toBe(ALPHA_APP_ID);
    expect(packageJson.build?.productName).toBe("Jarvis-K Alpha");
    expect(packageJson.build?.nsis?.include).toBe(
      "build/nsis/alpha-installer-policy.nsh",
    );
    expect(ALPHA_CURRENT_VERSION).toBe("0.1.0-alpha.6");
    expect(ALPHA_SHORT_VERSION_WINDOWS).toBe("0.1.0.6");
    expect(ALPHA_RELEASE_ORDINAL).toBe(6);
    expect(nsis).toContain("!define JARVIS_ALPHA_RELEASE_ORDINAL 6");
    expect(nsis).toContain(
      '!define JARVIS_ALPHA_INSTALLED_VERSION "0.1.0-alpha.6"',
    );
  });

  it("exposes an implementation plan without product-runtime control surfaces", () => {
    const plan = createAlphaInstallerPolicyPlan();

    expect(plan.marker).toEqual({
      key: ALPHA_INSTALLER_STATE_KEY,
      values: {
        schemaVersion: 1,
        installedReleaseOrdinal: 6,
        installedVersion: "0.1.0-alpha.6",
        appId: ALPHA_APP_ID,
        channel: "alpha",
      },
      retainedOnUninstall: true,
      containsUserData: false,
    });
    expect(plan.downgradePolicy).toMatchObject({
      comparison: "integer_release_ordinal",
      guiAndSilentCovered: true,
      silentFailureExitCode: ALPHA_DOWNGRADE_EXIT_CODE,
      rendererWritable: false,
      profileWritable: false,
      lexicographicSemverComparison: false,
      historicalUnsignedInstallersRetroactivelyControlled: false,
    });
  });

  it("classifies clean install, bootstrap upgrades, same-version repair, upgrades, and downgrades", () => {
    expect(classifyAlphaInstallerPolicy()).toMatchObject({
      ok: true,
      classification: "clean_install_allowed",
    });
    expect(
      classifyAlphaInstallerPolicy({
        uninstallRegistration: {
          present: true,
          displayName: "Jarvis-K Alpha 0.1.0-alpha.4",
          displayVersion: "0.1.0-alpha.4",
        },
      }),
    ).toMatchObject({
      ok: true,
      classification: "pre_marker_bootstrap_upgrade_allowed",
    });
    expect(
      classifyAlphaInstallerPolicy({
        marker: marker({ installedReleaseOrdinal: 5 }),
      }),
    ).toMatchObject({ ok: true, classification: "upgrade_allowed" });
    expect(classifyAlphaInstallerPolicy({ marker: marker() })).toMatchObject({
      ok: true,
      classification: "same_version_repair_allowed",
    });
    expect(
      classifyAlphaInstallerPolicy({
        marker: marker({
          installedReleaseOrdinal: 7,
          installedVersion: "0.1.0-alpha.7",
        }),
      }),
    ).toMatchObject({
      ok: false,
      classification: "downgrade_blocked",
      exitCode: ALPHA_DOWNGRADE_EXIT_CODE,
    });
  });

  it("fails closed for malformed marker and unknown pre-marker install state", () => {
    expect(
      classifyAlphaInstallerPolicy({
        marker: marker({ schemaVersion: 2 }),
      }),
    ).toMatchObject({
      ok: false,
      classification: "malformed_marker",
      reason: "schema_version_invalid",
    });
    expect(
      classifyAlphaInstallerPolicy({
        marker: marker({ appId: "com.jarvis-k.desktop.stable" }),
      }),
    ).toMatchObject({
      ok: false,
      classification: "malformed_marker",
      reason: "app_id_mismatch",
    });
    expect(
      classifyAlphaInstallerPolicy({
        installedPackagePresent: true,
        uninstallRegistration: { present: false },
      }),
    ).toMatchObject({
      ok: false,
      classification: "pre_marker_unknown_install_blocked",
      reason: "installed_package_without_registration",
    });
    expect(
      classifyAlphaInstallerPolicy({
        uninstallRegistration: {
          present: true,
          displayName: "Jarvis-K Alpha 0.1.0-alpha.unknown",
          displayVersion: "0.1.0-alpha.unknown",
        },
      }),
    ).toMatchObject({
      ok: false,
      classification: "pre_marker_unknown_install_blocked",
    });
  });

  it("pins real NSIS source to the tested policy and avoids wildcard cleanup", () => {
    const nsis = readFileSync(nsisPolicyPath, "utf8");

    expect(nsis).toContain("!macro customInit");
    expect(nsis).toContain("!macro customInstall");
    expect(nsis).toContain("!macro customUnInstall");
    expect(nsis.indexOf("!macro customInit")).toBeLessThan(
      nsis.indexOf("!macro customInstall"),
    );
    expect(nsis).toContain("EnumRegKey $R9 HKCU");
    expect(nsis).toContain("JARVIS_ALPHA_INSTALLER_STATE_PARENT_KEY");
    expect(nsis).toContain("JARVIS_ALPHA_INSTALLER_STATE_SUBKEY");
    expect(nsis).toContain(
      'IfFileExists "$INSTDIR\\resources\\app\\package.json"',
    );
    expect(nsis).toContain("ReadRegDWORD $R1 HKCU");
    expect(nsis).toContain("IntCmp $R1 ${JARVIS_ALPHA_RELEASE_ORDINAL}");
    expect(nsis).toContain("WriteRegDWORD HKCU");
    expect(nsis).toContain("ReadRegDWORD $R0 HKCU");
    expect(nsis).toContain("${Silent}");
    expect(nsis).toContain(
      `!define JARVIS_ALPHA_DOWNGRADE_EXIT_CODE ${ALPHA_DOWNGRADE_EXIT_CODE}`,
    );
    expect(nsis).toContain("SetErrorLevel ${JARVIS_ALPHA_DOWNGRADE_EXIT_CODE}");
    expect(nsis).toContain(
      `!define JARVIS_ALPHA_MARKER_FAILURE_EXIT_CODE ${ALPHA_MARKER_FAILURE_EXIT_CODE}`,
    );
    expect(nsis).toContain(
      "SetErrorLevel ${JARVIS_ALPHA_MARKER_FAILURE_EXIT_CODE}",
    );
    expect(nsis).not.toMatch(/DeleteReg(Value|Key)\s+HKCU\s+".*"\s+"\*"/u);
    expect(nsis).not.toContain('DeleteRegKey HKCU "Software\\Jarvis-K\\Alpha"');
    expect(nsis).not.toContain('DeleteRegKey HKCU "Software\\Jarvis-K"');
  });

  it("uses electron-builder hooks in the order required for pre-uninstall blocking", () => {
    const installerTemplate = readFileSync(
      path.join(
        rootDirectory,
        "node_modules",
        "app-builder-lib",
        "templates",
        "nsis",
        "installer.nsi",
      ),
      "utf8",
    );
    const installSectionTemplate = readFileSync(
      path.join(
        rootDirectory,
        "node_modules",
        "app-builder-lib",
        "templates",
        "nsis",
        "installSection.nsh",
      ),
      "utf8",
    );

    expect(installerTemplate.indexOf("!insertmacro customInit")).toBeGreaterThan(
      -1,
    );
    expect(installSectionTemplate.indexOf("!insertmacro uninstallOldVersion")).toBeLessThan(
      installSectionTemplate.indexOf("!insertmacro registryAddInstallInfo"),
    );
    expect(installSectionTemplate.indexOf("!insertmacro customInstall")).toBeGreaterThan(
      installSectionTemplate.indexOf("!insertmacro registryAddInstallInfo"),
    );
  });

  it("keeps Alpha and Stable installer namespaces isolated", () => {
    const nsis = readFileSync(nsisPolicyPath, "utf8");

    expect(nsis).toContain('!define JARVIS_ALPHA_CHANNEL "alpha"');
    expect(nsis).toContain(
      '!define JARVIS_ALPHA_APP_ID "com.jarvis-k.desktop.alpha"',
    );
    expect(nsis).not.toContain("com.jarvis-k.desktop.stable");
    expect(nsis).not.toContain("Software\\Jarvis-K\\Stable");
  });
});
