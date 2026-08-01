import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import {
  LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME
} from "./local-embedding-runtime-strategy";

export type LocalEmbeddingRuntimePackagePreflightApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export type LocalEmbeddingRuntimePackageExportRole =
  | "runtime_adapter_descriptor"
  | "runtime_adapter_factory"
  | "runtime_health_probe"
  | "sanitized_error_mapping";

export interface LocalEmbeddingRuntimePackageBoundaryPreflight {
  packageName: string;
  packageLocation: string;
  compositionRoot: string;
  privatePackageRequired: true;
  packageScaffolded: false;
  workspaceRegistrationDeferred: true;
  runtimeBehaviorImplemented: false;
}

export interface LocalEmbeddingRuntimePackagePublicSurfacePreflight {
  adapterOnlyExports: true;
  allowedExportRoles: LocalEmbeddingRuntimePackageExportRole[];
  modelArtifactPathExportsAllowed: false;
  downloaderExportsAllowed: false;
  processLauncherExportsAllowed: false;
  providerPolicyExportsAllowed: false;
}

export interface LocalEmbeddingRuntimePackageImportPolicyPreflight {
  allowedWorkspaceImports: string[];
  forbiddenWorkspaceImports: string[];
  forbiddenRuntimeDependencyImports: string[];
  concreteCompositionOnlyInCoreHost: true;
}

export interface LocalEmbeddingRuntimePackageSafetyPreflight {
  childProcessRequiredForExecution: true;
  resourceLeaseRequiredBeforeLoad: true;
  directShellExecutionAllowed: false;
  modelOutputActionPolicy: "validated_intent_only";
  sanitizedErrorsRequired: true;
}

export interface LocalEmbeddingRuntimePackagePreflightApprovalRecord {
  provider: string;
  modelId: string;
  runtime: "transformers";
  dedicatedPackageName: string;
  packageLocation: string;
  compositionRoot: string;
  status: LocalEmbeddingRuntimePackagePreflightApprovalStatus;
  boundary: LocalEmbeddingRuntimePackageBoundaryPreflight;
  publicSurface: LocalEmbeddingRuntimePackagePublicSurfacePreflight;
  importPolicy: LocalEmbeddingRuntimePackageImportPolicyPreflight;
  safety: LocalEmbeddingRuntimePackageSafetyPreflight;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  executionEnabled: false;
  preflightValuesExposed: false;
  reasons: string[];
}

const allowedWorkspaceImports = ["@jarvis-k/contracts"];

const forbiddenWorkspaceImports = [
  "@jarvis-k/capabilities",
  "@jarvis-k/core",
  "@jarvis-k/desktop",
  "@jarvis-k/inference-adapter-embedding-local",
  "@jarvis-k/inference-adapter-fixture",
  "@jarvis-k/memory",
  "@jarvis-k/memory-sqlite",
  "@jarvis-k/ui",
  "@jarvis-k/voice",
  "@jarvis-k/voice-adapter-xunfei",
  "@jarvis-k/voice-capture-browser",
  "apps/core-host",
  "apps/desktop",
  "apps/ui"
];

const forbiddenRuntimeDependencyImports = [
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

const allowedExportRoles: LocalEmbeddingRuntimePackageExportRole[] = [
  "runtime_adapter_descriptor",
  "runtime_adapter_factory",
  "runtime_health_probe",
  "sanitized_error_mapping"
];

export function createLocalEmbeddingRuntimePackagePreflightApprovalRecord(
  overrides: Partial<LocalEmbeddingRuntimePackagePreflightApprovalRecord> = {}
): LocalEmbeddingRuntimePackagePreflightApprovalRecord {
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
    packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
    status: "pending",
    boundary: {
      packageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
      packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
      compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
      privatePackageRequired: true,
      packageScaffolded: false,
      workspaceRegistrationDeferred: true,
      runtimeBehaviorImplemented: false
    },
    publicSurface: {
      adapterOnlyExports: true,
      allowedExportRoles: [...allowedExportRoles],
      modelArtifactPathExportsAllowed: false,
      downloaderExportsAllowed: false,
      processLauncherExportsAllowed: false,
      providerPolicyExportsAllowed: false
    },
    importPolicy: {
      allowedWorkspaceImports: [...allowedWorkspaceImports],
      forbiddenWorkspaceImports: [...forbiddenWorkspaceImports],
      forbiddenRuntimeDependencyImports: [...forbiddenRuntimeDependencyImports],
      concreteCompositionOnlyInCoreHost: true
    },
    safety: {
      childProcessRequiredForExecution: true,
      resourceLeaseRequiredBeforeLoad: true,
      directShellExecutionAllowed: false,
      modelOutputActionPolicy: "validated_intent_only",
      sanitizedErrorsRequired: true
    },
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    executionEnabled: false,
    preflightValuesExposed: false,
    reasons: [
      "Runtime package preflight is pending.",
      "Package scaffolding, runtime dependencies, downloads, and execution remain disabled."
    ],
    ...overrides
  };
}

export function createApprovedLocalEmbeddingRuntimePackagePreflightApprovalRecord(
  overrides: Partial<LocalEmbeddingRuntimePackagePreflightApprovalRecord> = {}
): LocalEmbeddingRuntimePackagePreflightApprovalRecord {
  return createLocalEmbeddingRuntimePackagePreflightApprovalRecord({
    status: "approved",
    reasons: [
      "Dedicated runtime package boundary is approved before scaffolding.",
      "Adapter-only exports, import policy, and execution safety constraints are approved."
    ],
    ...overrides
  });
}

export function isLocalEmbeddingRuntimePackagePreflightApprovalRecordApproved(
  record: LocalEmbeddingRuntimePackagePreflightApprovalRecord
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
    record.preflightValuesExposed === false &&
    isBoundaryPreflightApproved(record.boundary) &&
    isPublicSurfacePreflightApproved(record.publicSurface) &&
    isImportPolicyPreflightApproved(record.importPolicy) &&
    isSafetyPreflightApproved(record.safety)
  );
}

function isBoundaryPreflightApproved(
  boundary: LocalEmbeddingRuntimePackageBoundaryPreflight
): boolean {
  return (
    boundary.packageName === LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME &&
    boundary.packageLocation === LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION &&
    boundary.compositionRoot === LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT &&
    boundary.privatePackageRequired === true &&
    boundary.packageScaffolded === false &&
    boundary.workspaceRegistrationDeferred === true &&
    boundary.runtimeBehaviorImplemented === false
  );
}

function isPublicSurfacePreflightApproved(
  surface: LocalEmbeddingRuntimePackagePublicSurfacePreflight
): boolean {
  return (
    surface.adapterOnlyExports === true &&
    surface.allowedExportRoles.length === allowedExportRoles.length &&
    allowedExportRoles.every((role) =>
      surface.allowedExportRoles.includes(role)
    ) &&
    surface.modelArtifactPathExportsAllowed === false &&
    surface.downloaderExportsAllowed === false &&
    surface.processLauncherExportsAllowed === false &&
    surface.providerPolicyExportsAllowed === false
  );
}

function isImportPolicyPreflightApproved(
  policy: LocalEmbeddingRuntimePackageImportPolicyPreflight
): boolean {
  return (
    policy.allowedWorkspaceImports.length === allowedWorkspaceImports.length &&
    allowedWorkspaceImports.every((name) =>
      policy.allowedWorkspaceImports.includes(name)
    ) &&
    forbiddenWorkspaceImports.every((name) =>
      policy.forbiddenWorkspaceImports.includes(name)
    ) &&
    forbiddenRuntimeDependencyImports.every((name) =>
      policy.forbiddenRuntimeDependencyImports.includes(name)
    ) &&
    policy.concreteCompositionOnlyInCoreHost === true
  );
}

function isSafetyPreflightApproved(
  safety: LocalEmbeddingRuntimePackageSafetyPreflight
): boolean {
  return (
    safety.childProcessRequiredForExecution === true &&
    safety.resourceLeaseRequiredBeforeLoad === true &&
    safety.directShellExecutionAllowed === false &&
    safety.modelOutputActionPolicy === "validated_intent_only" &&
    safety.sanitizedErrorsRequired === true
  );
}
