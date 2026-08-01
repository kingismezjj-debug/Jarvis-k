import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import {
  LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME
} from "./local-embedding-runtime-strategy";

export type LocalEmbeddingRuntimeImplementationStepKey =
  | "runtime.package_boundary_approved"
  | "runtime.helper_process_supervised"
  | "runtime.windows_packaging_documented"
  | "runtime.resource_scheduler_integrated"
  | "runtime.failure_degradation_defined"
  | "runtime.dependencies_deferred"
  | "execution.disabled"
  | "verification.clean";

export interface LocalEmbeddingRuntimeImplementationInput {
  packageBoundaryApproved?: boolean;
  helperProcessSupervised?: boolean;
  windowsPackagingDocumented?: boolean;
  resourceSchedulerIntegrated?: boolean;
  failureDegradationDefined?: boolean;
  runtimeDependenciesIntroduced?: boolean;
  executionEnabled?: boolean;
  verificationClean?: boolean;
}

export interface LocalEmbeddingRuntimeImplementationStep {
  key: LocalEmbeddingRuntimeImplementationStepKey;
  satisfied: boolean;
  reason: string;
}

export interface LocalEmbeddingRuntimeImplementationProcedure {
  provider: string;
  modelId: string;
  dedicatedPackageName: string;
  status: "pending" | "ready_for_approval";
  runtimeDependenciesIntroduced: false;
  executionEnabled: false;
  implementationValuesExposed: false;
  steps: LocalEmbeddingRuntimeImplementationStep[];
  reasons: string[];
}

export type LocalEmbeddingRuntimeImplementationApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface LocalEmbeddingRuntimePackageManifestConstraint {
  packageName: string;
  packageLocation: string;
  privatePackageRequired: true;
  dependencyAllowlist: string[];
  forbiddenRuntimeDependencies: string[];
  exportsRuntimeAdapterOnly: true;
}

export interface LocalEmbeddingRuntimeCacheLayoutConstraint {
  cachePathCommitted: false;
  modelArtifactsCommitted: false;
  signedUrlsPersisted: false;
  hashVerifiedBeforeUse: true;
  cleanupOnFailedVerification: true;
}

export interface LocalEmbeddingRuntimeHelperLifecycleConstraint {
  supervisor: string;
  mode: "supervised_child_process";
  startupTimeoutDefined: true;
  shutdownTimeoutDefined: true;
  resourceLeaseRequired: true;
  sanitizedLogsRequired: true;
  directShellExecutionAllowed: false;
}

export interface LocalEmbeddingRuntimeFailureModeConstraint {
  startupFailure: "provider_unconfigured";
  loadFailure: "provider_unconfigured";
  verificationFailure: "artifact_unavailable";
  executionFailure: "sanitized_failure";
  fallbackProviderRequired: true;
}

export interface LocalEmbeddingRuntimeImplementationApprovalRecord {
  provider: string;
  modelId: string;
  dedicatedPackageName: string;
  status: LocalEmbeddingRuntimeImplementationApprovalStatus;
  packageManifest: LocalEmbeddingRuntimePackageManifestConstraint;
  cacheLayout: LocalEmbeddingRuntimeCacheLayoutConstraint;
  helperLifecycle: LocalEmbeddingRuntimeHelperLifecycleConstraint;
  failureModes: LocalEmbeddingRuntimeFailureModeConstraint;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  executionEnabled: false;
  implementationValuesExposed: false;
  reasons: string[];
}

const forbiddenRuntimeDependencies = [
  "@huggingface/",
  "@tensorflow/",
  "@xenova/",
  "ctranslate2",
  "llama-cpp",
  "node-llama-cpp",
  "onnxruntime",
  "onnxruntime-node",
  "onnxruntime-web",
  "paddlejs",
  "python-shell",
  "transformers"
];

export function createLocalEmbeddingRuntimeImplementationProcedure(
  input: LocalEmbeddingRuntimeImplementationInput = {}
): LocalEmbeddingRuntimeImplementationProcedure {
  const steps: LocalEmbeddingRuntimeImplementationStep[] = [
    step(
      "runtime.package_boundary_approved",
      input.packageBoundaryApproved === true,
      "Approve the dedicated runtime package boundary before implementation."
    ),
    step(
      "runtime.helper_process_supervised",
      input.helperProcessSupervised === true,
      "Define a supervised helper-process lifecycle outside Agent Core."
    ),
    step(
      "runtime.windows_packaging_documented",
      input.windowsPackagingDocumented === true,
      "Document Windows packaging, installation, update, and rollback behavior."
    ),
    step(
      "runtime.resource_scheduler_integrated",
      input.resourceSchedulerIntegrated === true,
      "Define resource scheduler leases and release behavior before model loading."
    ),
    step(
      "runtime.failure_degradation_defined",
      input.failureDegradationDefined === true,
      "Define sanitized startup, load, execution, and shutdown failure degradation."
    ),
    step(
      "runtime.dependencies_deferred",
      input.runtimeDependenciesIntroduced === false,
      "Keep runtime dependencies out until a separately approved implementation wave."
    ),
    step(
      "execution.disabled",
      input.executionEnabled === false,
      "Keep local embedding execution disabled during procedure approval."
    ),
    step(
      "verification.clean",
      input.verificationClean === true,
      "Pass boundary, sensitive-artifact, typecheck, and verify gates."
    )
  ];

  const reasons = steps.flatMap((item) =>
    item.satisfied ? [] : [item.reason]
  );

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
    status: reasons.length === 0 ? "ready_for_approval" : "pending",
    runtimeDependenciesIntroduced: false,
    executionEnabled: false,
    implementationValuesExposed: false,
    steps,
    reasons
  };
}

export function createApprovedLocalEmbeddingRuntimeImplementationApprovalRecord(
  overrides: Partial<LocalEmbeddingRuntimeImplementationApprovalRecord> = {}
): LocalEmbeddingRuntimeImplementationApprovalRecord {
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
    status: "approved",
    packageManifest: {
      packageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
      packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
      privatePackageRequired: true,
      dependencyAllowlist: [],
      forbiddenRuntimeDependencies: [...forbiddenRuntimeDependencies],
      exportsRuntimeAdapterOnly: true
    },
    cacheLayout: {
      cachePathCommitted: false,
      modelArtifactsCommitted: false,
      signedUrlsPersisted: false,
      hashVerifiedBeforeUse: true,
      cleanupOnFailedVerification: true
    },
    helperLifecycle: {
      supervisor: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
      mode: "supervised_child_process",
      startupTimeoutDefined: true,
      shutdownTimeoutDefined: true,
      resourceLeaseRequired: true,
      sanitizedLogsRequired: true,
      directShellExecutionAllowed: false
    },
    failureModes: {
      startupFailure: "provider_unconfigured",
      loadFailure: "provider_unconfigured",
      verificationFailure: "artifact_unavailable",
      executionFailure: "sanitized_failure",
      fallbackProviderRequired: true
    },
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    executionEnabled: false,
    implementationValuesExposed: false,
    reasons: [
      "Runtime implementation constraints are approved without adding runtime dependencies.",
      "Downloads and execution remain disabled until a later implementation wave."
    ],
    ...overrides
  };
}

export function isLocalEmbeddingRuntimeImplementationApprovalRecordApproved(
  record: LocalEmbeddingRuntimeImplementationApprovalRecord,
  procedure: LocalEmbeddingRuntimeImplementationProcedure =
    createLocalEmbeddingRuntimeImplementationProcedure({
      packageBoundaryApproved: true,
      helperProcessSupervised: true,
      windowsPackagingDocumented: true,
      resourceSchedulerIntegrated: true,
      failureDegradationDefined: true,
      runtimeDependenciesIntroduced: false,
      executionEnabled: false,
      verificationClean: true
    })
): boolean {
  return (
    procedure.status === "ready_for_approval" &&
    procedure.runtimeDependenciesIntroduced === false &&
    procedure.executionEnabled === false &&
    procedure.implementationValuesExposed === false &&
    record.provider === LOCAL_EMBEDDING_PROVIDER_ID &&
    record.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    record.dedicatedPackageName === LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME &&
    record.status === "approved" &&
    record.runtimeDependenciesIntroduced === false &&
    record.downloadEnabled === false &&
    record.executionEnabled === false &&
    record.implementationValuesExposed === false &&
    isPackageManifestConstraintApproved(record.packageManifest) &&
    isCacheLayoutConstraintApproved(record.cacheLayout) &&
    isHelperLifecycleConstraintApproved(record.helperLifecycle) &&
    isFailureModeConstraintApproved(record.failureModes)
  );
}

function step(
  key: LocalEmbeddingRuntimeImplementationStepKey,
  satisfied: boolean,
  reason: string
): LocalEmbeddingRuntimeImplementationStep {
  return { key, satisfied, reason: satisfied ? "" : reason };
}

function isPackageManifestConstraintApproved(
  constraint: LocalEmbeddingRuntimePackageManifestConstraint
): boolean {
  return (
    constraint.packageName === LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME &&
    constraint.packageLocation === LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION &&
    constraint.privatePackageRequired === true &&
    constraint.dependencyAllowlist.length === 0 &&
    forbiddenRuntimeDependencies.every((dependency) =>
      constraint.forbiddenRuntimeDependencies.includes(dependency)
    ) &&
    constraint.exportsRuntimeAdapterOnly === true
  );
}

function isCacheLayoutConstraintApproved(
  constraint: LocalEmbeddingRuntimeCacheLayoutConstraint
): boolean {
  return (
    constraint.cachePathCommitted === false &&
    constraint.modelArtifactsCommitted === false &&
    constraint.signedUrlsPersisted === false &&
    constraint.hashVerifiedBeforeUse === true &&
    constraint.cleanupOnFailedVerification === true
  );
}

function isHelperLifecycleConstraintApproved(
  constraint: LocalEmbeddingRuntimeHelperLifecycleConstraint
): boolean {
  return (
    constraint.supervisor === LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT &&
    constraint.mode === "supervised_child_process" &&
    constraint.startupTimeoutDefined === true &&
    constraint.shutdownTimeoutDefined === true &&
    constraint.resourceLeaseRequired === true &&
    constraint.sanitizedLogsRequired === true &&
    constraint.directShellExecutionAllowed === false
  );
}

function isFailureModeConstraintApproved(
  constraint: LocalEmbeddingRuntimeFailureModeConstraint
): boolean {
  return (
    constraint.startupFailure === "provider_unconfigured" &&
    constraint.loadFailure === "provider_unconfigured" &&
    constraint.verificationFailure === "artifact_unavailable" &&
    constraint.executionFailure === "sanitized_failure" &&
    constraint.fallbackProviderRequired === true
  );
}
