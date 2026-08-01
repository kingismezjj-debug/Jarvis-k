import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import {
  LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME
} from "./local-embedding-runtime-strategy";

export type LocalEmbeddingWindowsPackagingApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface LocalEmbeddingInstallerPackagingPlan {
  installerCreated: false;
  installerBundling: "deferred";
  modelArtifactsBundled: false;
  runtimePackageBundled: false;
  noticeBundleRequired: true;
  licenseBundleRequired: true;
  installSizeBudgetReviewed: boolean;
  installedSizeBudgetReviewed: boolean;
}

export interface LocalEmbeddingModelCachePolicy {
  cacheLocationPolicy: "user_cache_provider_namespace";
  cachePathCommitted: false;
  modelArtifactsCommitted: false;
  signedUrlsPersisted: false;
  digestVerificationRequired: true;
  partialDownloadCleanupRequired: true;
  uninstallDeletesModelsByDefault: false;
}

export interface LocalEmbeddingWindowsUpdateRollbackPlan {
  updateMode: "atomic_versioned_runtime_and_manifest";
  rollbackRequired: true;
  previousVersionRetainedUntilHealthCheck: true;
  failedUpdateCleanupRequired: true;
  healthCheckRequiredBeforeActivation: true;
}

export interface LocalEmbeddingWindowsPackagingApprovalRecord {
  provider: string;
  modelId: string;
  runtime: "transformers";
  dedicatedPackageName: string;
  packageLocation: string;
  compositionRoot: string;
  status: LocalEmbeddingWindowsPackagingApprovalStatus;
  installer: LocalEmbeddingInstallerPackagingPlan;
  cache: LocalEmbeddingModelCachePolicy;
  updateRollback: LocalEmbeddingWindowsUpdateRollbackPlan;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  executionEnabled: false;
  packagingValuesExposed: false;
  reasons: string[];
}

export function createLocalEmbeddingWindowsPackagingApprovalRecord(
  overrides: Partial<LocalEmbeddingWindowsPackagingApprovalRecord> = {}
): LocalEmbeddingWindowsPackagingApprovalRecord {
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
    packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
    status: "pending",
    installer: {
      installerCreated: false,
      installerBundling: "deferred",
      modelArtifactsBundled: false,
      runtimePackageBundled: false,
      noticeBundleRequired: true,
      licenseBundleRequired: true,
      installSizeBudgetReviewed: false,
      installedSizeBudgetReviewed: false
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
    packagingValuesExposed: false,
    reasons: [
      "Windows packaging approval is pending.",
      "Installer creation, downloads, and execution remain disabled."
    ],
    ...overrides
  };
}

export function createApprovedLocalEmbeddingWindowsPackagingApprovalRecord(
  overrides: Partial<LocalEmbeddingWindowsPackagingApprovalRecord> = {}
): LocalEmbeddingWindowsPackagingApprovalRecord {
  return createLocalEmbeddingWindowsPackagingApprovalRecord({
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
    reasons: [
      "Windows packaging policy is approved without creating an installer.",
      "Model artifacts, runtime package bundling, downloads, and execution remain disabled."
    ],
    ...overrides
  });
}

export function isLocalEmbeddingWindowsPackagingApprovalRecordApproved(
  record: LocalEmbeddingWindowsPackagingApprovalRecord
): boolean {
  return (
    record.provider === LOCAL_EMBEDDING_PROVIDER_ID &&
    record.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    record.runtime === "transformers" &&
    record.dedicatedPackageName === LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME &&
    record.packageLocation === LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION &&
    record.compositionRoot === LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT &&
    record.status === "approved" &&
    record.runtimeDependenciesIntroduced === false &&
    record.downloadEnabled === false &&
    record.executionEnabled === false &&
    record.packagingValuesExposed === false &&
    isInstallerPackagingPlanApproved(record.installer) &&
    isModelCachePolicyApproved(record.cache) &&
    isUpdateRollbackPlanApproved(record.updateRollback)
  );
}

function isInstallerPackagingPlanApproved(
  plan: LocalEmbeddingInstallerPackagingPlan
): boolean {
  return (
    plan.installerCreated === false &&
    plan.installerBundling === "deferred" &&
    plan.modelArtifactsBundled === false &&
    plan.runtimePackageBundled === false &&
    plan.noticeBundleRequired === true &&
    plan.licenseBundleRequired === true &&
    plan.installSizeBudgetReviewed === true &&
    plan.installedSizeBudgetReviewed === true
  );
}

function isModelCachePolicyApproved(
  policy: LocalEmbeddingModelCachePolicy
): boolean {
  return (
    policy.cacheLocationPolicy === "user_cache_provider_namespace" &&
    policy.cachePathCommitted === false &&
    policy.modelArtifactsCommitted === false &&
    policy.signedUrlsPersisted === false &&
    policy.digestVerificationRequired === true &&
    policy.partialDownloadCleanupRequired === true &&
    policy.uninstallDeletesModelsByDefault === false
  );
}

function isUpdateRollbackPlanApproved(
  plan: LocalEmbeddingWindowsUpdateRollbackPlan
): boolean {
  return (
    plan.updateMode === "atomic_versioned_runtime_and_manifest" &&
    plan.rollbackRequired === true &&
    plan.previousVersionRetainedUntilHealthCheck === true &&
    plan.failedUpdateCleanupRequired === true &&
    plan.healthCheckRequiredBeforeActivation === true
  );
}
