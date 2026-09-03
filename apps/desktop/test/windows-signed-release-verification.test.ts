import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  classifyPeArtifact,
  createExternalReleaseManifest,
  parseDigestAlgorithmFromSignToolOutput,
  parseSignedReleaseVerificationArgs,
  verifySignedReleaseArtifacts,
} from "../../../scripts/verify-windows-signed-release.mjs";

const expectedSubject = "CN=Contoso Code Signing Test";
const expectedThumbprint = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

function withArtifactDirectory(run: (directory: string) => void) {
  const directory = path.join(
    os.tmpdir(),
    `jarvis-signed-release-fixture-${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`,
  );
  mkdirSync(directory, { recursive: true });
  try {
    run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function writePe(directory: string, relativePath: string, bytes = "fixture") {
  const filePath = path.join(directory, ...relativePath.split("/"));
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, Buffer.concat([Buffer.from("MZ"), Buffer.from(bytes)]));
  return filePath;
}

function validSignature(overrides = {}) {
  return {
    status: "Valid",
    signerSubject: expectedSubject,
    certificateThumbprint: expectedThumbprint,
    timestampPresent: true,
    timestampValid: true,
    ...overrides,
  };
}

function runSyntheticVerification(
  directory: string,
  signatureByBasename: Record<string, ReturnType<typeof validSignature>>,
) {
  return verifySignedReleaseArtifacts({
    artifactDir: directory,
    expectedSignerSubject: expectedSubject,
    expectedSignerThumbprint: expectedThumbprint,
    allowSyntheticPlaceholder: true,
    productVersion: "0.1.0-alpha.7",
    downgradeMarkerOrdinal: 7,
    signToolProbe: {
      available: true,
      path: "not-recorded",
      sourceClassification: "test_fixture",
    },
    verifyAuthenticode: (absolutePath: string) =>
      signatureByBasename[path.basename(absolutePath)] ?? validSignature(),
    inspectDigest: () => ({ digestAlgorithm: "sha256", controlledError: null }),
  });
}

describe("Windows signed release verification harness", () => {
  it("requires an explicit artifact directory and parses only fixed options", () => {
    expect(() => verifySignedReleaseArtifacts()).toThrow(/explicit --artifact-dir/u);
    expect(() => parseSignedReleaseVerificationArgs(["--scan-system"])).toThrow(
      /Unknown argument/u,
    );
    expect(
      parseSignedReleaseVerificationArgs([
        "--artifact-dir=artifacts/packaged/example",
        "--expected-signer-subject=CN=Example",
        "--expected-signer-thumbprint=AA BB",
        "--product-version=0.1.0-alpha.7",
        "--app-id=com.jarvis-k.desktop.alpha",
        "--channel=alpha",
        "--downgrade-marker-ordinal=7",
        "--json",
      ]),
    ).toMatchObject({
      artifactDir: "artifacts/packaged/example",
      expectedSignerSubject: "CN=Example",
      expectedSignerThumbprint: "AA BB",
      productVersion: "0.1.0-alpha.7",
      appId: "com.jarvis-k.desktop.alpha",
      channel: "alpha",
      downgradeMarkerOrdinal: 7,
      json: true,
    });
  });

  it("passes a synthetic fully signed and timestamped release while keeping real execution blocked", () => {
    withArtifactDirectory((directory) => {
      writePe(directory, "Jarvis-K-Alpha-0.1.0-alpha.7-windows-x64-setup.exe");
      writePe(directory, "win-unpacked/Jarvis-K Alpha.exe");
      writePe(directory, "installed/Uninstall Jarvis-K Alpha.exe");

      const report = runSyntheticVerification(directory, {});

      expect(report.summary).toMatchObject({
        status: "PASS",
        totalPeArtifacts: 3,
        failed: 0,
        unresolved: 0,
      });
      expect(report.realSignedArtifactVerified).toBe(false);
      expect(report.executionBlocked).toBe(true);
      expect(report.azureIdentity).toBe("pending");
      expect(report.externalDistributionAllowed).toBe(false);
      expect(JSON.stringify(report)).not.toMatch(/[A-Z]:\\Users\\/i);
      expect(report.artifacts.every((artifact) => !path.isAbsolute(artifact.relativePath))).toBe(
        true,
      );
    });
  });

  it("fails closed for unsigned, invalid, wrong publisher, wrong thumbprint, and missing timestamp", () => {
    withArtifactDirectory((directory) => {
      writePe(directory, "Jarvis-K-Alpha-0.1.0-alpha.7-windows-x64-setup.exe");
      writePe(directory, "win-unpacked/Jarvis-K Alpha.exe");
      writePe(directory, "installed/Uninstall Jarvis-K Alpha.exe");

      const report = runSyntheticVerification(directory, {
        "Jarvis-K-Alpha-0.1.0-alpha.7-windows-x64-setup.exe": validSignature({
          status: "NotSigned",
        }),
        "Jarvis-K Alpha.exe": validSignature({
          signerSubject: "CN=Wrong Publisher",
        }),
        "Uninstall Jarvis-K Alpha.exe": validSignature({
          certificateThumbprint: "BADTHUMBPRINT",
          timestampPresent: false,
          timestampValid: false,
        }),
      });

      expect(report.summary.status).toBe("FAIL");
      expect(report.artifacts.find((artifact) => artifact.role === "final_nsis_installer")).toMatchObject({
        verdict: "FAIL",
        signatureStatus: "not_signed",
      });
      expect(report.artifacts.find((artifact) => artifact.role === "main_exe")).toMatchObject({
        verdict: "FAIL",
        signerSubjectClassification: "wrong_expected_publisher",
      });
      expect(report.artifacts.find((artifact) => artifact.role === "uninstaller")).toMatchObject({
        verdict: "FAIL",
        certificateThumbprintClassification: "wrong_thumbprint",
        timestampClassification: "absent",
      });
    });
  });

  it("fails closed when expected production signer is missing", () => {
    withArtifactDirectory((directory) => {
      writePe(directory, "Jarvis-K-Alpha-0.1.0-alpha.7-windows-x64-setup.exe");
      writePe(directory, "win-unpacked/Jarvis-K Alpha.exe");
      writePe(directory, "installed/Uninstall Jarvis-K Alpha.exe");

      const report = verifySignedReleaseArtifacts({
        artifactDir: directory,
        signToolProbe: {
          available: true,
          path: "not-recorded",
          sourceClassification: "test_fixture",
        },
        verifyAuthenticode: () => validSignature(),
        inspectDigest: () => ({ digestAlgorithm: "sha256", controlledError: null }),
      });

      expect(report.summary.status).toBe("FAIL");
      expect(report.expectedSigner.productionReady).toBe(false);
      expect(report.artifacts.every((artifact) => artifact.failureReasons.includes("expected_signer_missing"))).toBe(
        true,
      );
    });
  });

  it("classifies missing SignTool and malformed tool output without silently passing", () => {
    withArtifactDirectory((directory) => {
      writePe(directory, "Jarvis-K-Alpha-0.1.0-alpha.7-windows-x64-setup.exe");
      writePe(directory, "win-unpacked/Jarvis-K Alpha.exe");
      writePe(directory, "installed/Uninstall Jarvis-K Alpha.exe");

      const report = verifySignedReleaseArtifacts({
        artifactDir: directory,
        expectedSignerSubject: expectedSubject,
        expectedSignerThumbprint: expectedThumbprint,
        allowSyntheticPlaceholder: true,
        signToolProbe: {
          available: false,
          path: null,
          sourceClassification: "missing",
        },
        verifyAuthenticode: () => validSignature(),
        inspectDigest: () => ({
          digestAlgorithm: "unknown",
          controlledError: "signtool_missing",
        }),
      });

      expect(report.summary.status).toBe("FAIL");
      expect(report.toolchain.signTool).toMatchObject({
        requiredForProduction: true,
        available: false,
        sourceClassification: "missing",
      });
      expect(report.artifacts.every((artifact) => artifact.digestAlgorithm === "unknown")).toBe(
        true,
      );
      expect(parseDigestAlgorithmFromSignToolOutput("unexpected localized output")).toBe(
        "unknown",
      );
    });
  });

  it("lists nested third-party or native PE binaries as unresolved instead of Jarvis-signed PASS", () => {
    withArtifactDirectory((directory) => {
      writePe(directory, "Jarvis-K-Alpha-0.1.0-alpha.7-windows-x64-setup.exe");
      writePe(directory, "win-unpacked/Jarvis-K Alpha.exe");
      writePe(directory, "installed/Uninstall Jarvis-K Alpha.exe");
      writePe(directory, "win-unpacked/resources/app/node_modules/native/addon.node");
      writePe(directory, "win-unpacked/resources/app/node_modules/upstream/helper.dll");

      const report = runSyntheticVerification(directory, {
        "addon.node": validSignature({ status: "NotSigned" }),
        "helper.dll": validSignature({ timestampPresent: false, timestampValid: false }),
      });

      expect(report.summary.status).toBe("FAIL");
      expect(report.artifacts.find((artifact) => artifact.role === "native_node")).toMatchObject({
        verdict: "UNRESOLVED",
        unresolvedReasons: expect.arrayContaining([
          "non_jarvis_pe_requires_review",
          "native_binary_not_silently_accepted",
        ]),
      });
      expect(report.artifacts.find((artifact) => artifact.role === "dll")).toMatchObject({
        verdict: "UNRESOLVED",
      });
    });
  });

  it("detects missing required installer, main executable, or uninstaller roles", () => {
    withArtifactDirectory((directory) => {
      writePe(directory, "win-unpacked/Jarvis-K Alpha.exe");
      const report = runSyntheticVerification(directory, {});

      expect(report.summary.status).toBe("FAIL");
      expect(report.requiredRoles.missing).toEqual([
        "final_nsis_installer",
        "uninstaller",
      ]);
    });
  });

  it("rejects secret-like or absolute-user-path report output", () => {
    withArtifactDirectory((directory) => {
      writePe(directory, "Jarvis-K-Alpha-0.1.0-alpha.7-windows-x64-setup.exe");
      writePe(directory, "win-unpacked/Jarvis-K Alpha.exe");
      writePe(directory, "installed/Uninstall Jarvis-K Alpha.exe");

      expect(() =>
        verifySignedReleaseArtifacts({
          artifactDir: directory,
          expectedSignerSubject: expectedSubject,
          expectedSignerThumbprint: expectedThumbprint,
          allowSyntheticPlaceholder: true,
          signToolProbe: {
            available: true,
            path: "not-recorded",
            sourceClassification: "test_fixture",
          },
          verifyAuthenticode: () => ({
            ...validSignature(),
            controlledError: "api_key='not-redacted'",
          }),
          inspectDigest: () => ({ digestAlgorithm: "sha256", controlledError: null }),
        }),
      ).toThrow(/sanitization/u);
    });
  });

  it("keeps the external release manifest blocked until real signed artifacts exist", () => {
    const manifest = createExternalReleaseManifest({
      product: {
        name: "Jarvis-K Alpha",
        version: "0.1.0-alpha.6",
        appId: "com.jarvis-k.desktop.alpha",
        channel: "alpha",
      },
      downgradeMarkerOrdinal: 6,
      supportedUpgradeFloor: "0.1.0-alpha.6",
    });

    expect(manifest).toMatchObject({
      realSignedArtifactVerified: false,
      executionBlocked: true,
      azureIdentity: "pending",
      externalDistributionAllowed: false,
      unsignedHistoricalInstallerWarning: true,
      publishUploadState: "disabled",
    });
    expect(manifest.signer.subjectClassification).not.toContain("CN=");
  });

  it("does not record full paths in checked-in preparation artifacts", () => {
    const rootDirectory = path.resolve(import.meta.dirname, "..", "..", "..");
    const report = readFileSync(
      path.join(
        rootDirectory,
        "artifacts",
        "ui-3i",
        "signed-artifact-verification-preparation",
        "signed-artifact-verification-preparation.json",
      ),
      "utf8",
    );
    const manifest = readFileSync(
      path.join(
        rootDirectory,
        "artifacts",
        "ui-3i",
        "signed-artifact-verification-preparation",
        "external-release-manifest-preparation.json",
      ),
      "utf8",
    );

    expect(report).not.toMatch(/[A-Z]:\\Users\\/i);
    expect(manifest).not.toMatch(/[A-Z]:\\Users\\/i);
    expect(report).toContain('"realSignedArtifactVerified": false');
    expect(manifest).toContain('"externalDistributionAllowed": false');
  });
});
