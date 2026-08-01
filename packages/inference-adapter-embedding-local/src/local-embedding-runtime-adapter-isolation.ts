import {
  ModelRuntimeAdapterDescriptorSchema,
  type ModelRuntimeAdapterDescriptor
} from "@jarvis-k/contracts";
import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import {
  LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME
} from "./local-embedding-runtime-strategy";

export type LocalEmbeddingRuntimeAdapterIsolationStatus =
  | "blocked"
  | "ready_for_dependency_approval";

export interface LocalEmbeddingRuntimeAdapterIsolationPolicy {
  provider: string;
  modelId: string;
  runtime: "transformers";
  dedicatedPackageName: string;
  packageLocation: string;
  compositionRoot: string;
  adapterOnlySurfaceRequired: true;
  supervisedChildProcessRequired: true;
  privateChildProcessIpcRequired: true;
  resourceLeaseRequired: true;
  sanitizedErrorsRequired: true;
  fallbackProviderRequired: true;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  executionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  implementationValuesExposed: false;
}

export interface LocalEmbeddingRuntimeAdapterIsolationInput {
  descriptor: unknown;
  packageBoundaryApproved: boolean;
  helperProtocolApproved: boolean;
  resourceLeaseRequired: boolean;
  sanitizedErrorsApproved: boolean;
  fallbackProviderAvailable: boolean;
  runtimeDependenciesIntroduced: boolean;
  downloadEnabled: boolean;
  executionEnabled: boolean;
  providerRegistrationEnabled: boolean;
  defaultOptInEnabled: boolean;
}

export interface LocalEmbeddingRuntimeAdapterIsolationChecks {
  descriptorValid: boolean;
  descriptorMatchesPlannedRuntime: boolean;
  packageBoundaryApproved: boolean;
  helperProtocolApproved: boolean;
  resourceLeaseRequired: boolean;
  sanitizedErrorsApproved: boolean;
  fallbackProviderAvailable: boolean;
  runtimeDependenciesAbsent: boolean;
  downloadsDisabled: boolean;
  executionDisabled: boolean;
  providerRegistrationDisabled: boolean;
  defaultOptInDisabled: boolean;
}

export interface LocalEmbeddingRuntimeAdapterIsolationResult {
  provider: string;
  modelId: string;
  runtime: "transformers";
  dedicatedPackageName: string;
  packageLocation: string;
  compositionRoot: string;
  status: LocalEmbeddingRuntimeAdapterIsolationStatus;
  accepted: boolean;
  readyForDependencyApproval: boolean;
  compositionAllowed: false;
  executionEnabled: false;
  providerRegistrationEnabled: false;
  defaultOptInEnabled: false;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  implementationValuesExposed: false;
  checks: LocalEmbeddingRuntimeAdapterIsolationChecks;
  reasons: string[];
}

const unsafeDescriptorTextPattern =
  /(?:https?:\/\/|[A-Za-z]:\\|\\\\|\b[a-f0-9]{64}\b)/iu;

export function createLocalEmbeddingRuntimeAdapterIsolationPolicy(): LocalEmbeddingRuntimeAdapterIsolationPolicy {
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
    packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
    adapterOnlySurfaceRequired: true,
    supervisedChildProcessRequired: true,
    privateChildProcessIpcRequired: true,
    resourceLeaseRequired: true,
    sanitizedErrorsRequired: true,
    fallbackProviderRequired: true,
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    executionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    implementationValuesExposed: false
  };
}

export function evaluateLocalEmbeddingRuntimeAdapterIsolation(
  input: LocalEmbeddingRuntimeAdapterIsolationInput
): LocalEmbeddingRuntimeAdapterIsolationResult {
  const parsedDescriptor = ModelRuntimeAdapterDescriptorSchema.safeParse(
    input.descriptor
  );
  const descriptorValid = parsedDescriptor.success;
  const descriptorMatchesPlannedRuntime =
    descriptorValid &&
    parsedDescriptor.data.runtime === "transformers" &&
    parsedDescriptor.data.capabilities.length === 1 &&
    parsedDescriptor.data.capabilities[0] === "embedding" &&
    parsedDescriptor.data.accelerationBackends.length === 0 &&
    parsedDescriptor.data.notes.every(
      (note) =>
        note.length <= 500 && !unsafeDescriptorTextPattern.test(note)
    );
  const checks: LocalEmbeddingRuntimeAdapterIsolationChecks = {
    descriptorValid,
    descriptorMatchesPlannedRuntime,
    packageBoundaryApproved: input.packageBoundaryApproved,
    helperProtocolApproved: input.helperProtocolApproved,
    resourceLeaseRequired: input.resourceLeaseRequired,
    sanitizedErrorsApproved: input.sanitizedErrorsApproved,
    fallbackProviderAvailable: input.fallbackProviderAvailable,
    runtimeDependenciesAbsent: input.runtimeDependenciesIntroduced === false,
    downloadsDisabled: input.downloadEnabled === false,
    executionDisabled: input.executionEnabled === false,
    providerRegistrationDisabled:
      input.providerRegistrationEnabled === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
    packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
    status: accepted ? "ready_for_dependency_approval" : "blocked",
    accepted,
    readyForDependencyApproval: accepted,
    compositionAllowed: false,
    executionEnabled: false,
    providerRegistrationEnabled: false,
    defaultOptInEnabled: false,
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    implementationValuesExposed: false,
    checks,
    reasons: createReasons(checks)
  };
}

function createReasons(
  checks: LocalEmbeddingRuntimeAdapterIsolationChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.descriptorValid) {
    reasons.push("Runtime adapter descriptor is invalid.");
  }
  if (!checks.descriptorMatchesPlannedRuntime) {
    reasons.push(
      "Runtime adapter descriptor must remain Transformers-only for embedding."
    );
  }
  if (!checks.packageBoundaryApproved) {
    reasons.push("Dedicated runtime package boundary is not approved.");
  }
  if (!checks.helperProtocolApproved) {
    reasons.push("Supervised private child-process protocol is not approved.");
  }
  if (!checks.resourceLeaseRequired) {
    reasons.push("Resource lease requirement is missing.");
  }
  if (!checks.sanitizedErrorsApproved) {
    reasons.push("Sanitized runtime failure reporting is not approved.");
  }
  if (!checks.fallbackProviderAvailable) {
    reasons.push("Fixture or other fallback provider is required before isolation review can pass.");
  }
  if (!checks.runtimeDependenciesAbsent) {
    reasons.push("Runtime dependencies must remain absent in this preparation wave.");
  }
  if (!checks.downloadsDisabled) {
    reasons.push("Artifact downloads must remain disabled in this preparation wave.");
  }
  if (!checks.executionDisabled) {
    reasons.push("Runtime execution must remain disabled in this preparation wave.");
  }
  if (!checks.providerRegistrationDisabled) {
    reasons.push("Provider registration is deferred until a later explicit opt-in wave.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Default opt-in behavior is forbidden before runtime approval.");
  }

  return reasons;
}
