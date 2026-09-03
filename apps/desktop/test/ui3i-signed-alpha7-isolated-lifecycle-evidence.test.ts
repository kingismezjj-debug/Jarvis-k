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
  "signed-alpha7-isolated-lifecycle",
  "signed-alpha7-isolated-lifecycle-acceptance.json",
);

const evidenceText = readFileSync(evidencePath, "utf8");
const evidence = JSON.parse(evidenceText);
const sourceSigningEvidencePath = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "artifacts",
  "ui-3i",
  "signed-alpha7-candidate",
  "signed-alpha7-build-verification.json",
);
const sourceSigningEvidence = JSON.parse(
  readFileSync(sourceSigningEvidencePath, "utf8"),
);

describe("UI-3I-2B signed alpha.7 isolated lifecycle evidence", () => {
  it("records an evidence-only phase on the approved baseline", () => {
    expect(evidence.schemaVersion).toBe(1);
    expect(evidence.phase).toBe(
      "UI-3I-2B Signed Alpha.7 Isolated Lifecycle Evidence Closure",
    );
    expect(evidence.evidenceOnly).toBe(true);
    expect(evidence.productLogicChanged).toBe(false);
    expect(evidence.signingConfigurationChanged).toBe(false);
    expect(evidence.installerChanged).toBe(false);
    expect(evidence.gateSettingsDowngradePolicyOrRuntimeChanged).toBe(false);
    expect(evidence.buildExecutedByCodex).toBe(false);
    expect(evidence.signingExecutedByCodex).toBe(false);
    expect(evidence.installExecutedByCodex).toBe(false);
    expect(evidence.uninstallExecutedByCodex).toBe(false);
    expect(evidence.downgradeExecutedByCodex).toBe(false);
    expect(evidence.publishOrUploadExecutedByCodex).toBe(false);
    expect(evidence.hostMachineObserved).toMatchObject({
      classification: "machineObserved",
      head: "b2554b3e01c78728ed15d1b5743c4c21672b94ac",
      originMain: "b2554b3e01c78728ed15d1b5743c4c21672b94ac",
      worktreeClean: true,
      jarvisMainOrCoreHostProcessCount: 0,
      hkcuJarvisRunIdentityCount: 0,
      hklmJarvisRunIdentityCount: 0,
      realAlphaProfileReadOrCopied: false,
    });
  });

  it("pins the signed alpha.7 candidate and source signing evidence", () => {
    expect(evidence.candidate).toMatchObject({
      classification: "userProvidedMachineOutput",
      version: "0.1.0-alpha.7",
      shortVersionWindows: "0.1.0.7",
      releaseOrdinal: 7,
      installerSha256:
        "C62C957338974F74B1B3F22091E24438233047BEDD6B13EB5E9B998370290271",
      installerSizeBytes: 95286912,
      publisherCn: "Jiajian zou",
      publisherO: "Jiajian zou",
      buildCommit: "b2554b3e01c78728ed15d1b5743c4c21672b94ac",
      sourceBuildEvidence:
        "artifacts/ui-3i/signed-alpha7-candidate/signed-alpha7-build-verification.json",
      sourceBuildRealSignedArtifactVerified: true,
      productName: "Jarvis-K Alpha",
      appId: "com.jarvis-k.desktop.alpha",
      channel: "alpha",
    });
    expect(sourceSigningEvidence.realSignedArtifactVerified).toBe(true);
    expect(sourceSigningEvidence.product.version).toBe(evidence.candidate.version);
    expect(sourceSigningEvidence.externalDistributionAllowed).toBe(false);
    expect(sourceSigningEvidence.keyArtifacts.installer.sha256).toBe(
      evidence.candidate.installerSha256,
    );
    expect(sourceSigningEvidence.keyArtifacts.installer.size).toBe(
      evidence.candidate.installerSizeBytes,
    );
    expect(sourceSigningEvidence.buildAttempt.phase).toBe("UI-3I-1H");
    expect(sourceSigningEvidence.buildAttempt.buildInvocationCount).toBe(1);
  });

  it("keeps VM evidence attributed to user observation or provided output", () => {
    expect(evidence.vmIsolation.classification).toBe("userObserved");
    expect(evidence.transferAndIndependentVerification.classification).toBe(
      "userProvidedMachineOutput",
    );
    expect(evidence.unsignedAlpha6ToSignedAlpha7Upgrade.classification).toBe(
      "userProvidedMachineOutput",
    );
    expect(evidence.upgradeUserObserved.classification).toBe("userObserved");
    expect(evidence.realDowngradePrevention.gui.classification).toBe(
      "userObserved",
    );
    expect(evidence.realDowngradePrevention.silent.classification).toBe(
      "userObserved",
    );
    expect(evidence.inferred.classification).toBe("inferred");
  });

  it("records installer, main, and uninstaller signature acceptance", () => {
    expect(evidence.transferAndIndependentVerification).toMatchObject({
      installerHashMatchesExpected: true,
      installerAuthenticode: "Valid",
      signerCertificatePresent: true,
      rfc3161TimestampCertificatePresent: true,
      signerCnMatch: true,
      signerOMatch: true,
    });
    expect(evidence.unsignedAlpha6ToSignedAlpha7Upgrade.postState).toMatchObject({
      installedMainAuthenticode: "Valid",
      installedMainTimestampPresent: true,
      installedMainCnMatch: true,
      installedMainOMatch: true,
      installedUninstallerExists: true,
      installedUninstallerAuthenticode: "Valid",
      installedUninstallerTimestampPresent: true,
      installedUninstallerCnMatch: true,
      installedUninstallerOMatch: true,
    });
  });

  it("captures upgrade UI and machine results", () => {
    expect(evidence.unsignedAlpha6ToSignedAlpha7Upgrade.preState).toMatchObject({
      installedVersion: "0.1.0-alpha.6",
      installerMarkerOrdinal: 6,
      profileSettingsPresent: true,
      launchAtLoginEnabled: false,
      jarvisMainOrCoreHostProcessCount: 0,
      oldNewRunIdentitiesCount: 0,
      snapshot: "S9-Before-Signed-Alpha7-Upgrade",
    });
    expect(evidence.unsignedAlpha6ToSignedAlpha7Upgrade.postState.marker).toEqual({
      schemaVersion: 1,
      installedReleaseOrdinal: 7,
      installedVersion: "0.1.0-alpha.7",
      appId: "com.jarvis-k.desktop.alpha",
      channel: "alpha",
    });
    expect(
      Object.values(
        evidence.unsignedAlpha6ToSignedAlpha7Upgrade.postState.settingsComparisons,
      ),
    ).toEqual([true, true, true, true, true, true]);
    expect(evidence.upgradeUserObserved).toMatchObject({
      defaultSettingsV2: "PASS",
      allEightCategories: "PASS",
      harborRetained: "PASS",
      petRetained: "PASS",
      onboardingDidNotReappear: "PASS",
      launchAtLoginOff: "PASS",
      noBlankScreenCrashOrRecoveryAnomaly: "PASS",
      useClassicSettingsSessionRollback: "PASS",
      v2LegacyMutualExclusion: "PASS",
      fullExitProcessZero: "PASS",
      normalRestartRestoresV2: "PASS",
      finalExitProcessZero: "PASS",
      snapshot: "S10-Signed-Alpha7-Upgrade-Passed",
    });
  });

  it("records repair, uninstall retention, and retained-profile reinstall", () => {
    expect(evidence.signedAlpha7SameVersionRepair).toMatchObject({
      versionRemainsAlpha7: true,
      mainExeHashUnchanged: true,
      uninstallerHashUnchanged: true,
      settingsEntireFileHashUnchanged: true,
      settingsComparisonsAllTrue: true,
      mainAuthenticodeTimestampPublisherPass: true,
      uninstallerAuthenticodeTimestampPublisherPass: true,
      markerRemainsOrdinal7: true,
      fixtureState: "not_proven_preexisting",
      fixtureStateUsedAsRepairInvariant: false,
      minimumUiCheck: "PASS",
      snapshot: "S11-Signed-Alpha7-Repair-Passed",
    });
    expect(evidence.signedAlpha7UninstallRetention.afterUninstall).toMatchObject({
      installDirectoryPresent: false,
      mainExePresent: false,
      uninstallerPresent: false,
      uninstallRegistrationCount: 0,
      profilePresent: true,
      settingsPresent: true,
      explicitSyntheticRetentionMarkerPresent: true,
      settingsHashUnchanged: true,
      retentionMarkerHashUnchanged: true,
      runIdentitiesCount: 0,
      jarvisMainOrCoreHostProcessCount: 0,
      snapshot: "S12-Signed-Alpha7-Uninstall-Retention-Passed",
    });
    expect(evidence.signedAlpha7RetainedProfileReinstall).toMatchObject({
      classificationLabel: "retained-profile reinstall",
      pristineCleanInstall: false,
      installerHashMatchesExpected: true,
      installedVersion: "0.1.0-alpha.7",
      mainSignatureTimestampPublisherPass: true,
      uninstallerSignatureTimestampPublisherPass: true,
      markerRemainsOrdinal7: true,
      uiCheck: "PASS",
      snapshot: "S13-Signed-Alpha7-Reinstall-Passed",
    });
  });

  it("records real GUI and silent downgrade blocking against real ordinal 7", () => {
    expect(evidence.realDowngradePrevention.input).toMatchObject({
      guardedUnsignedAlpha6InstallerSha256:
        "CC69BED2056356D98EEF23B01C88DEB41004B896614CC7E648D33F5B97302CEC",
      signedAlpha7GenuinelyInstalled: true,
      ordinal7GenuinelyWrittenByAlpha7Installer: true,
      simulatedFutureMarkerUsed: false,
    });
    expect(evidence.realDowngradePrevention.gui).toMatchObject({
      newerVersionDowngradeBlockCopyObserved: true,
      exitCode: 1638,
      versionRemainsAlpha7: true,
      markerRemainsOrdinal7: true,
      jarvisMainOrCoreHostProcessCount: 0,
      mainUninstallerSettingsRetentionMarkerHashesUnchanged: true,
    });
    expect(evidence.realDowngradePrevention.silent).toMatchObject({
      switch: "/S",
      uiObserved: false,
      exitCode: 1638,
      elapsedSeconds: 1.09,
      versionRemainsAlpha7: true,
      markerRemainsOrdinal7: true,
      uninstallRegistrationCount: 1,
      desktopShortcutPresent: true,
      startMenuShortcutPresent: true,
      profilePresent: true,
      runIdentitiesCount: 0,
      snapshot: "S14-Signed-Alpha7-Real-Downgrade-Block-Passed",
    });
  });

  it("keeps final distribution gates and unresolved acceptance explicit", () => {
    expect(evidence.inferred).toMatchObject({
      transferAndIndependentVerification: "PASS",
      unsignedAlpha6ToSignedAlpha7InPlaceUpgrade: "PASS",
      signedAlpha7SameVersionRepair: "PASS",
      signedAlpha7UninstallProfileRetention: "PASS",
      signedAlpha7RetainedProfileReinstall: "PASS",
      realGuiDowngradePrevention: "PASS",
      realSilentDowngradePrevention: "PASS",
      realOrdinal7DowngradeBlockClassification: "real_alpha7_marker_not_simulated",
      sourceSignedBuildVerified: true,
      pristineCleanInstallAcceptanceCompleted: false,
      windows11AcceptanceCompleted: false,
      externalDistributionReady: false,
      externalDistributionAllowed: false,
    });
    expect(evidence.limitations).toMatchObject({
      pristineCleanInstallStatus: "not_completed",
      windows11AcceptanceStatus: "not_completed",
      signedLifecycleVmAcceptance: "PASS",
      externalDistributionReadiness: "NO",
    });
  });

  it("does not persist full paths, raw registry dumps, credentials, or certificate identifiers", () => {
    expect(evidenceText).not.toMatch(/[A-Z]:\\Users\\/i);
    expect(evidenceText).not.toMatch(/AppData\\Roaming|AppData\\Local/i);
    expect(evidenceText).not.toMatch(/HKEY_|Registry::/i);
    expect(evidenceText).not.toMatch(/CommandLine|processCommandLine/iu);
    expect(evidenceText).not.toMatch(/Bearer\s+[A-Za-z0-9._~+/=-]{8,}/u);
    expect(evidenceText).not.toMatch(/api[_-]?key\s*[:=]/iu);
    expect(evidenceText).not.toMatch(/access[_-]?token\s*[:=]/iu);
    expect(evidenceText).not.toMatch(/subscription(Id)?\s*[:=]/iu);
    expect(evidenceText).not.toMatch(/tenant(Id)?\s*[:=]/iu);
    expect(evidenceText).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu);
    expect(evidenceText).not.toMatch(
      /thumbprint|serialNumber|credential(Value|Secret|Content)|credentialCache|memory_content|chat_transcript|providerUrl|modelCachePath/iu,
    );
    expect(evidence.sensitiveDataPolicy).toMatchObject({
      fullUserPathsRecorded: false,
      subscriptionOrTenantIdRecorded: false,
      accountAuthDataRecorded: false,
      certificateIdentifierRecorded: false,
      vmRealProfileContentCopied: false,
      registryDumpRecorded: false,
      environmentVariableValuesRecorded: false,
    });
  });
});
