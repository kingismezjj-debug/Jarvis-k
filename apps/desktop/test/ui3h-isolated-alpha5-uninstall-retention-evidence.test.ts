import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const evidencePath = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "artifacts",
  "ui-3h",
  "isolated-alpha5-uninstall-retention",
  "isolated-alpha5-uninstall-retention.json",
);

const evidenceText = readFileSync(evidencePath, "utf8");
const evidence = JSON.parse(evidenceText);

describe("UI-3H-3A isolated alpha.5 uninstall retention evidence", () => {
  it("records an evidence-only uninstall retention phase", () => {
    expect(evidence.phase).toBe("UI-3H-3A Alpha.5 Uninstall Retention Evidence Closure");
    expect(evidence.evidenceOnly).toBe(true);
    expect(evidence.productLogicChanged).toBe(false);
    expect(evidence.buildExecuted).toBe(false);
    expect(evidence.installExecutedByCodex).toBe(false);
    expect(evidence.uninstallExecutedByCodex).toBe(false);
    expect(evidence.downgradeExecuted).toBe(false);
    expect(evidence.hostMachineObserved.head).toBe(
      "c92f2bb5ad108a24c0ebd93e09db6a5953572b42",
    );
    expect(evidence.hostMachineObserved.originMain).toBe(
      "c92f2bb5ad108a24c0ebd93e09db6a5953572b42",
    );
    expect(evidence.hostMachineObserved.worktreeClean).toBe(true);
  });

  it("keeps host RC7 and the real Alpha profile out of the evidence", () => {
    expect(evidence.hostMachineObserved.installedRc7Unchanged).toBe(true);
    expect(evidence.hostMachineObserved.installedRc7PackageVersion).toBe("0.1.0-alpha.4");
    expect(evidence.hostMachineObserved.jarvisMainOrCoreHostProcessCount).toBe(0);
    expect(evidence.hostMachineObserved.jarvisRunIdentityCount).toBe(0);
    expect(evidence.hostMachineObserved.realAlphaProfileReadOrCopied).toBe(false);
  });

  it("records VM evidence as user-observed or user-provided machine output", () => {
    expect(evidence.vmStart.classification).toBe("userObserved");
    expect(evidence.uninstallExecution.classification).toBe("userObserved");
    expect(evidence.afterUninstallMachineOutput.classification).toBe(
      "userProvidedMachineOutput",
    );
    expect(evidence.snapshot.classification).toBe("userObserved");
    expect(evidence.inferred.alpha5UninstallRetentionAcceptance).toBe("PASS");
  });

  it("requires a synthetic no-secret fixture marker", () => {
    expect(evidence.vmStart.profile).toBe("synthetic_only");
    expect(evidence.syntheticFixture.marker).toMatchObject({
      synthetic: true,
      noSecrets: true,
      containsCredential: false,
      containsMemoryBody: false,
      containsChatHistory: false,
      containsProviderConfiguration: false,
      containsModelCache: false,
    });
  });

  it("captures formal uninstall cleanup and profile retention", () => {
    expect(evidence.uninstallExecution).toMatchObject({
      formalPerUserUninstallerUsed: true,
      manualProgramDirectoryDeletion: false,
      manualRegistryEdit: false,
      manualProfileCleanup: false,
      otherVersionInstalled: false,
      downgradeExecuted: false,
    });
    expect(evidence.afterUninstallMachineOutput).toMatchObject({
      installDirectoryPresent: false,
      mainExecutablePresent: false,
      perUserUninstallRecordPresent: false,
      machineUninstallRecordPresent: false,
      wow6432NodeUninstallRecordPresent: false,
      desktopJarvisShortcutPresent: false,
      startMenuJarvisShortcutPresent: false,
      legacyRunIdentityPresent: false,
      activeRunIdentityPresent: false,
      startupFolderJarvisEntriesPresent: false,
      alphaAppDataProfileRetained: true,
      settingsFileRetained: true,
      upgradeFixtureFileRetained: true,
      settingsFileSha256BeforeAfterMatched: true,
      fixtureMarkerSha256BeforeAfterMatched: true,
    });
  });

  it("keeps remaining release gates explicit", () => {
    expect(evidence.inferred.alpha4ToAlpha5UpgradeAcceptance).toBe("PASS");
    expect(evidence.inferred.cleanAlpha5InstallAcceptanceCompleted).toBe(false);
    expect(evidence.inferred.downgradeObservationCompleted).toBe(false);
    expect(evidence.inferred.downgradeSupported).toBe(false);
    expect(evidence.inferred.downgradePreventionImplemented).toBe(false);
    expect(evidence.inferred.unsignedExternalDistributionAllowed).toBe(false);
  });

  it("does not persist full user paths, registry dumps, or secrets", () => {
    expect(evidenceText).not.toMatch(/[A-Z]:\\Users\\/i);
    expect(evidenceText).not.toMatch(/AppData\\Roaming|AppData\\Local/i);
    expect(evidenceText).not.toMatch(/HKEY_|HKCU\\|HKLM\\/i);
    expect(evidenceText).not.toMatch(/Bearer\s+[A-Za-z0-9._~+/=-]{8,}/u);
    expect(evidenceText).not.toMatch(/api[_-]?key\s*[:=]/iu);
    expect(evidenceText).not.toMatch(/access[_-]?token\s*[:=]/iu);
    expect(evidenceText).not.toMatch(/providerUrl|memory_content|chat_transcript/iu);
  });
});
