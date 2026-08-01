import { describe, expect, it } from "vitest";
import {
  createTransformersLocalControlledArtifactDownloadGuardPolicy,
  evaluateTransformersLocalControlledArtifactDownloadGuard,
  TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
  type TransformersLocalControlledArtifactDownloadApprovals
} from "../src";

const approved: TransformersLocalControlledArtifactDownloadApprovals = {
  artifactPinApproved: true,
  immutableRevisionApproved: true,
  licenseRedistributionApproved: true,
  downloadApproved: true,
  cacheWriteApproved: true,
  sha256VerificationApproved: true,
  partialCleanupApproved: true,
  rollbackApproved: true
};

const expectedSha256 =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const sourceUrl =
  "https://example.invalid/revisions/immutable/config.json";

describe("Transformers local controlled artifact download guard", () => {
  it("defines a fail-closed policy without enabling downloads or exposing values", () => {
    const policy = createTransformersLocalControlledArtifactDownloadGuardPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toEqual({
      packageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
      dryRunOnly: true,
      digestAlgorithm: "sha256",
      expectedDigestRequired: true,
      observedDigestRequiredBeforeReady: true,
      immutableRevisionRequired: true,
      approvedArtifactPinRequired: true,
      unsignedHttpsSourceRequired: true,
      cacheStateGateRequired: true,
      partialDownloadCleanupRequired: true,
      rollbackRequired: true,
      signedUrlsPersisted: false,
      credentialMaterialPersisted: false,
      digestValuesExposed: false,
      sourceUrlsExposed: false,
      networkAccessEnabled: false,
      fileSystemWritesEnabled: false,
      downloadEnabled: false,
      executionEnabled: false,
      modelArtifactsAccessed: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });

  it("accepts only sanitized future download preparation without side effects", () => {
    const result = evaluateTransformersLocalControlledArtifactDownloadGuard({
      operation: "prepare_download",
      artifactKey: "config.json",
      sourceUrl,
      expectedSha256,
      currentState: "pending",
      approvals: approved,
      requestedOperations: {
        networkAccess: false,
        fileSystemWrite: false,
        download: false,
        execution: false,
        modelArtifactRead: false,
        persistSignedUrl: false,
        persistCredentialMaterial: false,
        exposeDigestValue: false,
        exposeSourceUrl: false
      }
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      accepted: true,
      readyForControlledDownload: true,
      sha256VerificationSatisfied: false,
      readyForCacheReadyState: false,
      dryRunOnly: true,
      checks: {
        operationStateAllowed: true,
        artifactKeySafe: true,
        sourceUrlHttps: true,
        sourceUrlUnsigned: true,
        expectedSha256Format: true,
        observedSha256PresenceValid: true,
        observedSha256Format: true,
        digestMatches: false,
        approvalsSatisfied: true,
        sideEffectsRequested: false,
        sideEffectsBlocked: true
      },
      signedUrlsPersisted: false,
      credentialMaterialPersisted: false,
      digestValuesExposed: false,
      sourceUrlsExposed: false,
      networkAccessEnabled: false,
      fileSystemWritesEnabled: false,
      downloadEnabled: false,
      executionEnabled: false,
      modelArtifactsAccessed: false
    });
    expect(serialized).not.toContain(sourceUrl);
    expect(serialized).not.toContain(expectedSha256);
  });

  it("accepts SHA-256 verification only when observed digest matches the pin", () => {
    const result = evaluateTransformersLocalControlledArtifactDownloadGuard({
      operation: "verify_download",
      artifactKey: "1_Pooling/config.json",
      sourceUrl,
      expectedSha256,
      observedSha256: expectedSha256,
      currentState: "verifying",
      approvals: approved
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      accepted: true,
      readyForControlledDownload: false,
      sha256VerificationSatisfied: true,
      readyForCacheReadyState: true,
      downloadEnabled: false,
      executionEnabled: false,
      modelArtifactsAccessed: false,
      checks: {
        digestMatches: true,
        observedSha256PresenceValid: true,
        observedSha256Format: true
      }
    });
    expect(serialized).not.toContain(sourceUrl);
    expect(serialized).not.toContain(expectedSha256);
  });

  it("fails closed for signed URLs, digest mismatch, unsafe keys, missing approvals, or side effects", () => {
    const result = evaluateTransformersLocalControlledArtifactDownloadGuard({
      operation: "verify_download",
      artifactKey: "../config.json",
      sourceUrl: `${sourceUrl}#fragment`,
      expectedSha256,
      observedSha256:
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      currentState: "pending",
      approvals: {
        ...approved,
        downloadApproved: false
      },
      requestedOperations: {
        download: true,
        exposeSourceUrl: true
      }
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      accepted: false,
      readyForControlledDownload: false,
      sha256VerificationSatisfied: false,
      readyForCacheReadyState: false,
      dryRunOnly: true,
      downloadEnabled: false,
      executionEnabled: false,
      checks: {
        operationStateAllowed: false,
        artifactKeySafe: false,
        sourceUrlHttps: true,
        sourceUrlUnsigned: false,
        expectedSha256Format: true,
        observedSha256PresenceValid: true,
        observedSha256Format: true,
        digestMatches: false,
        approvalsSatisfied: false,
        sideEffectsRequested: true,
        sideEffectsBlocked: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Operation is not allowed from the current cache state.",
        "Artifact key is not a safe relative artifact key.",
        "Signed, query, fragment, token, or credential-bearing URLs are rejected.",
        "Observed digest does not match the expected digest.",
        "All artifact, revision, license, download, cache, verification, cleanup, and rollback approvals are required.",
        "Requested side effects are blocked in this guard layer."
      ])
    );
    expect(serialized).not.toContain(sourceUrl);
    expect(serialized).not.toContain(expectedSha256);
  });
});
