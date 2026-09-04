import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const evidencePath = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "artifacts",
  "ui-3i",
  "signed-alpha7-windows11-pristine-clean-install",
  "signed-alpha7-windows11-pristine-clean-install-acceptance.json",
);

const evidenceText = readFileSync(evidencePath, "utf8");
const evidence = JSON.parse(evidenceText);

describe("UI-3I-2C Windows 11 pristine signed clean-install evidence", () => {
  it("records an evidence-only closure on the approved baseline", () => {
    expect(evidence).toMatchObject({
      schemaVersion: 1,
      phase: "UI-3I-2C Windows 11 Pristine Signed Clean-Install Evidence Closure",
      evidenceOnly: true,
      productLogicChanged: false,
      signingConfigurationChanged: false,
      installerChanged: false,
      gateSettingsDowngradePolicyOrRuntimeChanged: false,
      buildExecutedByCodex: false,
      signingExecutedByCodex: false,
      installExecutedByCodex: false,
      uninstallExecutedByCodex: false,
      downgradeExecutedByCodex: false,
      vmRestoreOrControlExecutedByCodex: false,
      publishOrUploadExecutedByCodex: false,
      externalPublishingEntered: false,
    });
    expect(evidence.hostMachineObserved).toMatchObject({
      classification: "machineObserved",
      head: "4273de80d5a1221973341bc691c58b1bfaad7368",
      originMain: "4273de80d5a1221973341bc691c58b1bfaad7368",
      worktreeClean: true,
      jarvisMainOrCoreHostProcessCount: 0,
      hkcuJarvisRunIdentityCount: 0,
      hklmJarvisRunIdentityCount: 0,
      realAlphaProfileReadOrCopied: false,
      userOrMachineEnvironmentModified: false,
      registryModified: false,
    });
  });

  it("keeps VM evidence attributed to user observation or user-provided output", () => {
    expect(evidence.userObserved.classification).toBe("userObserved");
    expect(evidence.userProvidedMachineOutput.classification).toBe(
      "userProvidedMachineOutput",
    );
    expect(evidence.inferred.classification).toBe("inferred");
    expect(evidence.sensitiveDataPolicy.userProvidedVmOutputMarkedAsCodexMachineObserved).toBe(
      false,
    );
  });

  it("records the requested user-observed Windows 11 UI closure", () => {
    expect(evidence.userObserved).toMatchObject({
      windowsUpdate: "PASS",
      snapshotBeforeJarvisCreated: "W11-S1-Pristine-Before-Jarvis",
      pristineBaseline: "PASS",
      snapshotSignedInstallerStagedCreated:
        "W11-S2-Pristine-Signed-Installer-Staged",
      smartScreenDidNotAppear: true,
      uacElevationDidNotAppear: true,
      publisherDisplayedOrClassifiedAs: "Jiajian zou",
      finalMachineState: "PASS",
      snapshotSignedAlpha7CleanInstallPassCreated:
        "W11-S3-Signed-Alpha7-Clean-Install-PASS",
    });
    expect(Object.keys(evidence.userObserved.windows11UiChecks)).toHaveLength(13);
    expect(Object.values(evidence.userObserved.windows11UiChecks)).toEqual(
      Array.from({ length: 13 }, () => "PASS"),
    );
  });

  it("pins Windows 11 platform, isolation, pristine baseline, and installer verification output", () => {
    expect(evidence.userProvidedMachineOutput.windows).toMatchObject({
      WindowsProductName: "Microsoft Windows 11 Pro",
      Version: "10.0.26200",
      BuildNumber: "26200",
      OSArchitecture: "64-bit",
      tpm: {
        present: true,
        ready: true,
        enabled: true,
        activated: true,
      },
      secureBoot: true,
    });
    expect(evidence.userProvidedMachineOutput.installer).toMatchObject({
      sha256:
        "C62C957338974F74B1B3F22091E24438233047BEDD6B13EB5E9B998370290271",
      authenticode: "Valid",
      rfc3161TimestampPresent: true,
      signerCnAndOMatchJiajianZou: true,
    });
    expect(evidence.userProvidedMachineOutput.isolatedBeforeInstallation).toEqual({
      sharedFolderAccessible: false,
      internet443: false,
    });
    expect(evidence.userProvidedMachineOutput.pristineBeforeInstallation).toEqual({
      installDirectory: false,
      profile: false,
      installerMarker: false,
      shortcuts: false,
      jarvisProcessCount: 0,
      jarvisEnvironmentVariableCount: 0,
      hkcuHklmOldNewRunIdentities: 0,
    });
  });

  it("records clean install outputs, signed installed binaries, marker, and final state", () => {
    expect(evidence.userProvidedMachineOutput.installResult).toMatchObject({
      installerExitCode: 0,
      installedVersion: "0.1.0-alpha.7",
      installedMainExeSignature: "Valid",
      installedMainTimestamp: true,
      installedMainPublisherMatch: true,
      installedUninstallerSignature: "Valid",
      installedUninstallerTimestamp: true,
      installedUninstallerPublisherMatch: true,
      marker: {
        schemaVersion: 1,
        installedReleaseOrdinal: 7,
        installedVersion: "0.1.0-alpha.7",
        appId: "com.jarvis-k.desktop.alpha",
        channel: "alpha",
      },
    });
    expect(evidence.userProvidedMachineOutput.final).toEqual({
      processCount: 0,
      persistedLaunchAtLoginEnabled: false,
      hkcuHklmOldNewRunIdentities: 0,
      uninstallRegistrationCount: 1,
      desktopAndStartMenuShortcutsPresent: true,
    });
  });

  it("records only supported inferred conclusions and keeps external publishing closed", () => {
    expect(evidence.inferred).toMatchObject({
      windows11PristineSignedCleanInstall: "PASS",
      signedInstallerMainUninstallerLifecycleSignatureCoverage: "PASS",
      packagedAlphaDefaultOnSettingsV2OnWindows11: "PASS",
      launchAtLoginRemainedOff: "PASS",
      noPriorProfileWasReused: "PASS",
      noUnsignedFallbackWasAccepted: "PASS",
      windows11AcceptanceCompleted: true,
      pristineCleanInstallAcceptanceCompleted: true,
      externalDistributionReady: false,
      externalDistributionAllowed: false,
    });
    expect(evidence.limitations).toMatchObject({
      scope: "UI-3I-2C only",
      externalPublishingEntered: false,
      externalDistributionReadiness: "NO",
      externalDistributionAllowed: false,
    });
  });

  it("does not persist full paths, profile contents, registry dumps, credentials, or account identifiers", () => {
    expect(evidenceText).not.toMatch(/[A-Z]:\\Users\\/i);
    expect(evidenceText).not.toMatch(/AppData\\Roaming|AppData\\Local/i);
    expect(evidenceText).not.toMatch(/HKEY_|Registry::|HKCU\\|HKLM\\/i);
    expect(evidenceText).not.toMatch(/CommandLine|processCommandLine/iu);
    expect(evidenceText).not.toMatch(/Bearer\s+[A-Za-z0-9._~+/=-]{8,}/u);
    expect(evidenceText).not.toMatch(/api[_-]?key\s*[:=]/iu);
    expect(evidenceText).not.toMatch(/access[_-]?token\s*[:=]/iu);
    expect(evidenceText).not.toMatch(/subscription(Id)?\s*[:=]/iu);
    expect(evidenceText).not.toMatch(/tenant(Id)?\s*[:=]/iu);
    expect(evidenceText).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu);
    expect(evidenceText).not.toMatch(
      /credential(Value|Secret|Content)|memory_content|chat_transcript|providerUrl|modelCachePath/iu,
    );
    expect(evidence.sensitiveDataPolicy).toMatchObject({
      fullUserPathsRecorded: false,
      realProfileContentRecorded: false,
      credentialsTokensTenantSubscriptionOrEmailRecorded: false,
      registryDumpRecorded: false,
      environmentVariableValuesRecorded: false,
    });
  });
});
