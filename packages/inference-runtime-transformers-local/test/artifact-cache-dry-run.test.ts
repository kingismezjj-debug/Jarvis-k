import { describe, expect, it } from "vitest";
import {
  createTransformersLocalArtifactCacheDryRunPlan,
  previewTransformersLocalArtifactCacheTransition,
  TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME
} from "../src";

describe("Transformers local artifact cache dry-run manager", () => {
  it("defines cache and download policy without enabling side effects", () => {
    const plan = createTransformersLocalArtifactCacheDryRunPlan();
    const serialized = JSON.stringify(plan);

    expect(plan).toMatchObject({
      packageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
      dryRunOnly: true,
      currentState: "pending",
      cachePolicy: {
        cacheLocationPolicy: "user_cache_provider_namespace",
        cachePathCommitted: false,
        modelArtifactsCommitted: false,
        signedUrlsPersisted: false,
        credentialMaterialPersisted: false,
        digestVerificationRequired: true,
        partialDownloadCleanupRequired: true,
        rollbackRequired: true,
        uninstallDeletesModelsByDefault: false
      },
      verificationPolicy: {
        digestAlgorithm: "sha256",
        verifyBeforeReady: true,
        rejectUnverifiedArtifacts: true,
        activationRequiresAllArtifactsVerified: true,
        digestValuesExposed: false
      },
      networkAccessEnabled: false,
      fileSystemWritesEnabled: false,
      downloadEnabled: false,
      executionEnabled: false,
      modelArtifactsAccessed: false,
      cacheValuesExposed: false
    });
    expect(plan.states).toEqual([
      "pending",
      "downloading",
      "verifying",
      "ready",
      "corrupted",
      "cleanup_required",
      "rollback_ready"
    ]);
    expect(plan.transitions.every((item) => !item.sideEffectsEnabled)).toBe(
      true
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("C:\\");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });

  it("previews download, verification, cleanup, and rollback transitions without mutating cache", () => {
    expect(
      previewTransformersLocalArtifactCacheTransition({
        currentState: "pending",
        event: "start_download"
      })
    ).toMatchObject({
      to: "downloading",
      allowed: true,
      sideEffectsEnabled: false,
      networkAccessEnabled: false,
      fileSystemWritesEnabled: false,
      downloadEnabled: false
    });
    expect(
      previewTransformersLocalArtifactCacheTransition({
        currentState: "downloading",
        event: "mark_download_complete"
      })
    ).toMatchObject({
      to: "verifying",
      allowed: true,
      modelArtifactsAccessed: false
    });
    expect(
      previewTransformersLocalArtifactCacheTransition({
        currentState: "verifying",
        event: "mark_verification_passed"
      })
    ).toMatchObject({
      to: "ready",
      allowed: true,
      executionEnabled: false
    });
    expect(
      previewTransformersLocalArtifactCacheTransition({
        currentState: "verifying",
        event: "mark_verification_failed"
      })
    ).toMatchObject({
      to: "corrupted",
      allowed: true
    });
    expect(
      previewTransformersLocalArtifactCacheTransition({
        currentState: "corrupted",
        event: "request_cleanup"
      })
    ).toMatchObject({
      to: "cleanup_required",
      allowed: true
    });
    expect(
      previewTransformersLocalArtifactCacheTransition({
        currentState: "ready",
        event: "request_rollback"
      })
    ).toMatchObject({
      to: "rollback_ready",
      allowed: true
    });
  });

  it("fails closed on invalid transitions", () => {
    expect(
      previewTransformersLocalArtifactCacheTransition({
        currentState: "pending",
        event: "mark_verification_passed"
      })
    ).toEqual({
      from: "pending",
      event: "mark_verification_passed",
      to: "pending",
      allowed: false,
      dryRunOnly: true,
      sideEffectsEnabled: false,
      networkAccessEnabled: false,
      fileSystemWritesEnabled: false,
      downloadEnabled: false,
      executionEnabled: false,
      modelArtifactsAccessed: false,
      reasons: [
        "Transition is not allowed by the dry-run artifact cache state machine."
      ]
    });
  });
});
