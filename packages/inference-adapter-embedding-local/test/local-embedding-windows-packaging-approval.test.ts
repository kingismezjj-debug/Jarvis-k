import { describe, expect, it } from "vitest";
import {
  createApprovedLocalEmbeddingWindowsPackagingApprovalRecord,
  createLocalEmbeddingWindowsPackagingApprovalRecord,
  isLocalEmbeddingWindowsPackagingApprovalRecordApproved,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME
} from "../src";

describe("local embedding Windows packaging approval", () => {
  it("defaults to pending without creating installers, downloads, or execution", () => {
    const record = createLocalEmbeddingWindowsPackagingApprovalRecord();

    expect(record).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      runtime: "transformers",
      dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
      packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
      compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
      status: "pending",
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      packagingValuesExposed: false
    });
    expect(record.installer.installerCreated).toBe(false);
    expect(record.installer.modelArtifactsBundled).toBe(false);
    expect(record.installer.runtimePackageBundled).toBe(false);
    expect(record.installer.installSizeBudgetReviewed).toBe(false);
    expect(
      isLocalEmbeddingWindowsPackagingApprovalRecordApproved(record)
    ).toBe(false);
  });

  it("approves only sanitized Windows packaging policy", () => {
    const record = createApprovedLocalEmbeddingWindowsPackagingApprovalRecord();
    const serialized = JSON.stringify(record);

    expect(record).toMatchObject({
      status: "approved",
      installer: {
        installerCreated: false,
        installerBundling: "deferred",
        modelArtifactsBundled: false,
        runtimePackageBundled: false,
        noticeBundleRequired: true,
        licenseBundleRequired: true,
        installSizeBudgetReviewed: true,
        installedSizeBudgetReviewed: true
      },
      cache: {
        cacheLocationPolicy: "user_cache_provider_namespace",
        cachePathCommitted: false,
        modelArtifactsCommitted: false,
        signedUrlsPersisted: false,
        digestVerificationRequired: true,
        partialDownloadCleanupRequired: true,
        uninstallDeletesModelsByDefault: false
      },
      updateRollback: {
        updateMode: "atomic_versioned_runtime_and_manifest",
        rollbackRequired: true,
        previousVersionRetainedUntilHealthCheck: true,
        failedUpdateCleanupRequired: true,
        healthCheckRequiredBeforeActivation: true
      },
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      packagingValuesExposed: false
    });
    expect(
      isLocalEmbeddingWindowsPackagingApprovalRecordApproved(record)
    ).toBe(true);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("C:\\");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });

  it("rejects packaging approval when installer, cache, update, or execution constraints regress", () => {
    const approved = createApprovedLocalEmbeddingWindowsPackagingApprovalRecord();

    expect(
      isLocalEmbeddingWindowsPackagingApprovalRecordApproved({
        ...approved,
        installer: {
          ...approved.installer,
          modelArtifactsBundled: true as false
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingWindowsPackagingApprovalRecordApproved({
        ...approved,
        cache: {
          ...approved.cache,
          cachePathCommitted: true as false
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingWindowsPackagingApprovalRecordApproved({
        ...approved,
        updateRollback: {
          ...approved.updateRollback,
          rollbackRequired: false as true
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingWindowsPackagingApprovalRecordApproved({
        ...approved,
        executionEnabled: true as false
      })
    ).toBe(false);
  });
});
