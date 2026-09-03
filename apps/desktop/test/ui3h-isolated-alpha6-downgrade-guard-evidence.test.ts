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
  "isolated-alpha6-downgrade-guard-acceptance",
  "isolated-alpha6-downgrade-guard-acceptance.json",
);

const evidenceText = readFileSync(evidencePath, "utf8");
const evidence = JSON.parse(evidenceText);

describe("UI-3H-3D isolated alpha.6 downgrade guard evidence", () => {
  it("records an evidence-only phase on the approved baseline", () => {
    expect(evidence.phase).toBe(
      "UI-3H-3D Guarded Alpha.6 Isolated Windows Acceptance Evidence Closure",
    );
    expect(evidence.evidenceOnly).toBe(true);
    expect(evidence.productLogicChanged).toBe(false);
    expect(evidence.buildExecutedByCodex).toBe(false);
    expect(evidence.installExecutedByCodex).toBe(false);
    expect(evidence.uninstallExecutedByCodex).toBe(false);
    expect(evidence.downgradeExecutedByCodex).toBe(false);
    expect(evidence.vmRestoreExecutedByCodex).toBe(false);
    expect(evidence.hostMachineObserved.head).toBe(
      "d93a5dd5a45091acf9bef0825052a4b946d3db7b",
    );
    expect(evidence.hostMachineObserved.originMain).toBe(
      "d93a5dd5a45091acf9bef0825052a4b946d3db7b",
    );
    expect(evidence.hostMachineObserved.worktreeClean).toBe(true);
  });

  it("pins the alpha.6 candidate and host safety boundaries", () => {
    expect(evidence.internalAlpha6Installer).toMatchObject({
      classification: "userProvidedMachineOutput",
      filename: "Jarvis-K-Alpha-0.1.0-alpha.6-Downgrade-Guard-Internal-Setup.exe",
      sha256:
        "CC69BED2056356D98EEF23B01C88DEB41004B896614CC7E648D33F5B97302CEC",
      signed: false,
      distribution: "internal_only",
      productName: "Jarvis-K Alpha",
      fileVersion: "0.1.0-alpha.6",
      productVersion: "0.1.0.6",
      appId: "com.jarvis-k.desktop.alpha",
    });
    expect(evidence.hostMachineObserved).toMatchObject({
      sourceVersion: "0.1.0-alpha.6",
      shortVersionWindows: "0.1.0.6",
      releaseOrdinal: 6,
      installedRc7Unchanged: true,
      jarvisMainOrCoreHostProcessCount: 0,
      oldRunIdentityPresent: false,
      newRunIdentityPresent: false,
      realAlphaProfileReadOrCopied: false,
    });
  });

  it("records VM evidence as user-observed or user-provided machine output", () => {
    expect(evidence.vmIsolation.classification).toBe("userObserved");
    expect(evidence.syntheticProfileBoundary.classification).toBe(
      "userProvidedMachineOutput",
    );
    expect(evidence.alpha5ToAlpha6MachineOutput.classification).toBe(
      "userProvidedMachineOutput",
    );
    expect(evidence.downgradeGuardFixture.classification).toBe(
      "userProvidedMachineOutput",
    );
    expect(evidence.guiDowngradeBlock.classification).toBe("userObserved");
    expect(evidence.silentDowngradeBlock.classification).toBe("userObserved");
    expect(evidence.finalSnapshotState.classification).toBe("userObserved");
  });

  it("keeps the fixture synthetic and non-sensitive", () => {
    expect(evidence.vmIsolation).toMatchObject({
      networkDisconnected: true,
      vmwareSharedFoldersDisabledDuringAcceptance: true,
      jarvisProcessEnvironmentVariablesPresent: false,
      realAlphaProfileCopied: false,
      credentialMemoryChatProviderOrModelCacheCopied: false,
    });
    expect(evidence.syntheticProfileBoundary).toMatchObject({
      synthetic: true,
      noSecrets: true,
      containsCredential: false,
      containsMemoryBody: false,
      containsChatHistory: false,
      containsProviderConfiguration: false,
      containsModelCache: false,
    });
  });

  it("captures upgrade, repair, clean install, uninstall retention, and reinstall outcomes", () => {
    expect(evidence.alpha5ToAlpha6Upgrade).toMatchObject({
      preExistingInstallerStateMarker: false,
      alpha6AllowedPreMarkerAlpha5Bootstrap: true,
      alpha5UninstalledFirst: false,
      inPlaceUpgradeSucceeded: true,
      installedPackageBecameAlpha6: true,
      defaultSettingsV2: "PASS",
      allEightCategories: "PASS",
      launchAtLoginRemainedOff: true,
    });
    expect(evidence.alpha5ToAlpha6MachineOutput.installerStateMarker).toEqual({
      schemaVersion: 1,
      installedReleaseOrdinal: 6,
      installedVersion: "0.1.0-alpha.6",
      appId: "com.jarvis-k.desktop.alpha",
      channel: "alpha",
    });
    expect(evidence.sameVersionRepair.sameVersionRepairAllowed).toBe(true);
    expect(evidence.cleanAlpha6Install.cleanInstallSucceeded).toBe(true);
    expect(
      evidence.alpha6UninstallMarkerRetention.installerStateMarkerRemainedValidOrdinal6,
    ).toBe(true);
    expect(evidence.sameVersionReinstallAfterUninstall.sameVersionReinstallAllowed).toBe(
      true,
    );
  });

  it("labels the future marker as simulated and records GUI plus silent blocking", () => {
    expect(evidence.downgradeGuardFixture).toMatchObject({
      label: "vm-only simulated valid future marker",
      representsRealAlpha7Installation: false,
      fieldsChangedOnly: {
        installedReleaseOrdinal: 7,
        installedVersion: "0.1.0-alpha.7",
      },
      validFieldsRetained: {
        schemaVersion: 1,
        appId: "com.jarvis-k.desktop.alpha",
        channel: "alpha",
      },
    });
    expect(evidence.guiDowngradeBlock).toMatchObject({
      newerVersionBlockMessageShown: true,
      installerDidNotEnterInstallationFlow: true,
      exitCode: 1638,
      installedPackageRemainedAlpha6: true,
      runIdentitiesAbsent: true,
      jarvisProcessResidual: false,
    });
    expect(evidence.silentDowngradeBlock).toMatchObject({
      uiOrMessageBoxShown: false,
      exitCode: 1638,
      installedPackageRemainedAlpha6: true,
      jarvisProcessResidual: false,
    });
  });

  it("keeps final limitations and external distribution gates explicit", () => {
    expect(evidence.finalSnapshotState).toMatchObject({
      blockedSnapshotCreated: "S8-Alpha6-Downgrade-Guard-Blocked",
      vmRestoredToSnapshot: "S7-Alpha6-Reinstalled-With-Retained-Marker",
      finalMarkerOrdinal: 6,
      simulatedOrdinal7ActiveInFinalVmState: false,
    });
    expect(evidence.limitations).toMatchObject({
      simulatedOrdinal7IsNotARealAlpha7Install: true,
      historicalUnguardedAlpha4Alpha5InstallersCannotBeRetroactivelyBlocked: true,
      alpha6InstallerUnsigned: true,
      externalDistributionAllowed: false,
      codeSigningPending: true,
      signedInstallerLifecycleAcceptancePending: true,
    });
    expect(evidence.inferred).toMatchObject({
      alpha5ToAlpha6InPlaceUpgradeAcceptance: "PASS",
      cleanAlpha6InstallAcceptance: "PASS",
      sameVersionRepairAcceptance: "PASS",
      alpha6UninstallMarkerRetentionAcceptance: "PASS",
      sameVersionReinstallAcceptance: "PASS",
      simulatedFutureMarkerGuiBlockAcceptance: "PASS",
      simulatedFutureMarkerSilentBlockAcceptance: "PASS",
      unsignedExternalDistributionAllowed: false,
    });
  });

  it("does not persist full user paths, registry dumps, process command lines, or secrets", () => {
    expect(evidenceText).not.toMatch(/[A-Z]:\\Users\\/i);
    expect(evidenceText).not.toMatch(/AppData\\Roaming|AppData\\Local/i);
    expect(evidenceText).not.toMatch(/HKEY_|HKCU\\|HKLM\\/i);
    expect(evidenceText).not.toMatch(/CommandLine|processCommandLine/iu);
    expect(evidenceText).not.toMatch(/Bearer\s+[A-Za-z0-9._~+/=-]{8,}/u);
    expect(evidenceText).not.toMatch(/api[_-]?key\s*[:=]/iu);
    expect(evidenceText).not.toMatch(/access[_-]?token\s*[:=]/iu);
    expect(evidenceText).not.toMatch(
      /credential(Value|Secret|Content)|memory_content|chat_transcript|providerUrl|modelCachePath/iu,
    );
  });
});
