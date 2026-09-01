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
  "isolated-alpha5-upgrade-acceptance",
  "isolated-alpha5-upgrade-acceptance.json",
);

const evidenceText = readFileSync(evidencePath, "utf8");
const evidence = JSON.parse(evidenceText);

describe("UI-3H-2A isolated alpha.5 upgrade evidence", () => {
  it("records the evidence-only phase without product logic claims", () => {
    expect(evidence.phase).toBe(
      "UI-3H-2A Isolated Alpha.4 to Alpha.5 Upgrade Evidence Closure",
    );
    expect(evidence.evidenceOnly).toBe(true);
    expect(evidence.productLogicChanged).toBe(false);
    expect(evidence.hostMachineObserved.head).toBe(
      "20e2458dbd94e49eb83f22137855cdf51b6ebb41",
    );
    expect(evidence.hostMachineObserved.originMain).toBe(
      "20e2458dbd94e49eb83f22137855cdf51b6ebb41",
    );
    expect(evidence.hostMachineObserved.worktreeClean).toBe(true);
  });

  it("keeps host RC7 and the real Alpha profile out of the isolated upgrade evidence", () => {
    expect(evidence.hostMachineObserved.installedRc7Unchanged).toBe(true);
    expect(evidence.hostMachineObserved.installedRc7PackageVersion).toBe("0.1.0-alpha.4");
    expect(evidence.hostMachineObserved.realAlphaProfileReadOrCopied).toBe(false);
    expect(evidence.vmIsolation.realAlphaProfileCopied).toBe(false);
    expect(evidence.vmIsolation.fixtureSource).toBe("UI-3H-1 synthetic-profile-fixture");
  });

  it("requires a synthetic no-secret fixture marker", () => {
    expect(evidence.syntheticFixture.classification).toBe("userProvidedMachineOutput");
    expect(evidence.syntheticFixture.marker).toMatchObject({
      schemaVersion: 1,
      synthetic: true,
      noSecrets: true,
      containsCredential: false,
      containsMemoryBody: false,
      containsChatHistory: false,
      containsProviderConfiguration: false,
      containsModelCache: false,
    });
  });

  it("records VM evidence as user observed or user provided instead of Codex machine-observed", () => {
    expect(evidence.vmIsolation.classification).toBe("userObserved");
    expect(evidence.installers.classification).toBe("userProvidedMachineOutput");
    expect(evidence.beforeUpgrade.classification).toBe("userProvidedMachineOutput");
    expect(evidence.alpha4ManualAcceptance.classification).toBe("userObserved");
    expect(evidence.afterUpgradeMachineOutput.classification).toBe("userProvidedMachineOutput");
    expect(evidence.manualAcceptance.classification).toBe("userObserved");
    expect(evidence.inferred.inPlaceUpgradeSucceeded).toBe(true);
  });

  it("pins the alpha.4 source and alpha.5 target hashes", () => {
    expect(evidence.installers.sourceAlpha4).toEqual({
      filename: "Jarvis-K-Alpha-0.1.0-alpha.4-Setup-RC4-Identity.exe",
      sha256: "CB1822F19F05A7C8B896CDADAF7681F0477142C045C8F866A2F97BAB957664FD",
    });
    expect(evidence.installers.targetAlpha5).toEqual({
      filename: "Jarvis-K-Alpha-0.1.0-alpha.5-Upgrade-Internal-Setup.exe",
      sha256: "C0436C6E795B61CB510BFE3810872F56B066600802A0E2BF1AB8E30801AB6C2C",
    });
  });

  it("captures the accepted upgrade outcomes without claiming downgrade or uninstall coverage", () => {
    expect(evidence.upgradeExecution).toMatchObject({
      sourceAlpha4UninstalledFirst: false,
      targetAlpha5InstallerPerformedInPlaceOverwrite: true,
      downgradeExecuted: false,
      uninstallExecuted: false,
    });
    expect(evidence.manualAcceptance.defaultSettingsV2).toBe("PASS");
    expect(evidence.manualAcceptance.allEightCategories).toBe("PASS");
    expect(evidence.manualAcceptance.useClassicSettingsSwitchedToLegacy).toBe("PASS");
    expect(evidence.inferred.alpha4ToAlpha5UpgradeAcceptance).toBe("PASS");
    expect(evidence.inferred.cleanInstallAcceptanceCompleted).toBe(false);
    expect(evidence.inferred.uninstallRetentionAcceptanceCompleted).toBe(false);
    expect(evidence.inferred.downgradeObservationCompleted).toBe(false);
    expect(evidence.inferred.downgradeSupported).toBe(false);
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
