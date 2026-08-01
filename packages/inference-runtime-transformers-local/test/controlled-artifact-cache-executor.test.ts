import { describe, expect, it } from "vitest";
import {
  createTransformersLocalControlledArtifactCacheExecutorPolicy,
  evaluateTransformersLocalControlledArtifactCacheExecutor,
  evaluateTransformersLocalControlledArtifactDownloadGuard,
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

describe("Transformers local controlled artifact cache executor", () => {
  it("defines a plan-only executor with every side effect disabled", () => {
    const policy =
      createTransformersLocalControlledArtifactCacheExecutorPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toEqual({
      packageName: "@jarvis-k/inference-runtime-transformers-local",
      planOnly: true,
      executionDeferred: true,
      stateMutationEnabled: false,
      networkAccessEnabled: false,
      fileSystemWritesEnabled: false,
      downloadEnabled: false,
      executionEnabled: false,
      modelArtifactsAccessed: false,
      signedUrlsPersisted: false,
      credentialMaterialPersisted: false,
      digestValuesExposed: false,
      sourceUrlsExposed: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("plans download preparation without performing a download", () => {
    const guardResult = evaluateTransformersLocalControlledArtifactDownloadGuard(
      {
        operation: "prepare_download",
        artifactKey: "config.json",
        sourceUrl,
        expectedSha256,
        currentState: "pending",
        approvals: approved
      }
    );
    const result = evaluateTransformersLocalControlledArtifactCacheExecutor({
      operation: "prepare_download",
      currentState: "pending",
      guardResult
    });

    expect(result).toMatchObject({
      operation: "prepare_download",
      currentState: "pending",
      plannedState: "downloading",
      accepted: true,
      planOnly: true,
      executionDeferred: true,
      stateMutationApplied: false,
      networkAccessEnabled: false,
      fileSystemWritesEnabled: false,
      downloadEnabled: false,
      modelArtifactsAccessed: false
    });
  });

  it("plans verified readiness without reading or mutating an artifact", () => {
    const guardResult = evaluateTransformersLocalControlledArtifactDownloadGuard(
      {
        operation: "verify_download",
        artifactKey: "config.json",
        sourceUrl,
        expectedSha256,
        observedSha256: expectedSha256,
        currentState: "verifying",
        approvals: approved
      }
    );
    const result = evaluateTransformersLocalControlledArtifactCacheExecutor({
      operation: "verify_download",
      currentState: "verifying",
      guardResult
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      operation: "verify_download",
      currentState: "verifying",
      plannedState: "ready",
      accepted: true,
      executionDeferred: true,
      stateMutationApplied: false
    });
    expect(serialized).not.toContain(sourceUrl);
    expect(serialized).not.toContain(expectedSha256);
  });

  it("stages cleanup and rollback requests without completing either action", () => {
    const cleanup = evaluateTransformersLocalControlledArtifactCacheExecutor({
      operation: "request_cleanup",
      currentState: "corrupted",
      approvals: {
        partialCleanupApproved: true
      }
    });
    const rollback = evaluateTransformersLocalControlledArtifactCacheExecutor({
      operation: "request_rollback",
      currentState: "ready",
      approvals: {
        rollbackApproved: true
      }
    });

    expect(cleanup).toMatchObject({
      plannedState: "cleanup_required",
      accepted: true,
      fileSystemWritesEnabled: false,
      stateMutationApplied: false
    });
    expect(rollback).toMatchObject({
      plannedState: "rollback_ready",
      accepted: true,
      fileSystemWritesEnabled: false,
      stateMutationApplied: false
    });
  });

  it("fails closed for wrong states, missing approvals, rejected guards, or side effects", () => {
    const rejectedGuard = evaluateTransformersLocalControlledArtifactDownloadGuard(
      {
        operation: "prepare_download",
        artifactKey: "../config.json",
        sourceUrl: `${sourceUrl}#fragment`,
        expectedSha256,
        currentState: "pending",
        approvals: {
          ...approved,
          downloadApproved: false
        },
        requestedOperations: {
          download: true
        }
      }
    );
    const result = evaluateTransformersLocalControlledArtifactCacheExecutor({
      operation: "prepare_download",
      currentState: "pending",
      guardResult: rejectedGuard,
      requestedOperations: {
        download: true
      }
    });
    const cleanup = evaluateTransformersLocalControlledArtifactCacheExecutor({
      operation: "request_cleanup",
      currentState: "corrupted",
      approvals: {
        partialCleanupApproved: false
      }
    });

    expect(result).toMatchObject({
      plannedState: "pending",
      accepted: false,
      executionDeferred: true,
      stateMutationApplied: false
    });
    expect(result.reasons).toContain(
      "Requested network, filesystem, download, artifact, credential, URL, digest, or execution side effects are blocked."
    );
    expect(cleanup).toMatchObject({
      plannedState: "corrupted",
      accepted: false,
      fileSystemWritesEnabled: false
    });
  });
});
