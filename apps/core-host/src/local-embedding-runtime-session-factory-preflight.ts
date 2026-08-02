import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "@jarvis-k/inference-adapter-embedding-local";
import {
  TRANSFORMERS_LOCAL_RUNTIME,
  TRANSFORMERS_LOCAL_RUNTIME_COMPOSITION_ROOT,
  TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME
} from "@jarvis-k/inference-runtime-transformers-local";
import { LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV } from "./local-embedding-composition";
import { LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV } from "./local-embedding-runtime-session-factory";

export { LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV };

export type CoreHostLocalEmbeddingRuntimeSessionFactoryPreflightStatus =
  | "blocked"
  | "degraded"
  | "ready_for_runtime_session_factory_approval";

export interface CoreHostLocalEmbeddingRuntimeSessionFactoryPreflightInput {
  compositionRoot?: string;
  providerShellComposedByExplicitOptIn?: boolean;
  runtimeDescriptorComposedByExplicitOptIn?: boolean;
  approvedManifestComposedByExplicitOptIn?: boolean;
  fixtureFallbackPreserved?: boolean;
  resourceLeaseEnforcementReviewed?: boolean;
  sanitizedErrorMappingReviewed?: boolean;
  startupRestartRollbackReviewed?: boolean;
  runtimePythonEnvHandlingReviewed?: boolean;
  productApprovalRequired?: boolean;
  securityApprovalRequired?: boolean;
  verificationClean?: boolean;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  sessionFactoryImplementationAllowed?: boolean;
  sessionFactoryImplemented?: boolean;
  runtimePythonEnvRead?: boolean;
  runtimePythonEnvValueExposed?: boolean;
  modelArtifactPathRead?: boolean;
  pythonHelperLaunchEnabled?: boolean;
  modelArtifactAccessEnabled?: boolean;
  cacheWritesEnabled?: boolean;
  modelLoadEnabled?: boolean;
  realInferenceEnabled?: boolean;
  runtimeDependencyChangesIntroduced?: boolean;
  providerRegistrationChanged?: boolean;
  defaultOptInEnabled?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
  privatePathExposureEnabled?: boolean;
  rawDiagnosticsExposed?: boolean;
}

export interface CoreHostLocalEmbeddingRuntimeSessionFactoryPreflightChecks {
  compositionRootRestricted: boolean;
  providerShellExplicitlyOptIn: boolean;
  runtimeDescriptorExplicitlyOptIn: boolean;
  approvedManifestExplicitlyOptIn: boolean;
  fixtureFallbackPreserved: boolean;
  resourceLeaseEnforcementReviewed: boolean;
  sanitizedErrorMappingReviewed: boolean;
  startupRestartRollbackReviewed: boolean;
  runtimePythonEnvHandlingReviewed: boolean;
  productApprovalRequired: boolean;
  securityApprovalRequired: boolean;
  productApprovalStillPending: boolean;
  securityApprovalStillPending: boolean;
  sessionFactoryImplementationBlocked: boolean;
  runtimePythonEnvReadBlocked: boolean;
  runtimePythonEnvValueHidden: boolean;
  modelArtifactPathReadBlocked: boolean;
  pythonHelperLaunchBlocked: boolean;
  modelArtifactAccessBlocked: boolean;
  cacheWritesBlocked: boolean;
  modelLoadBlocked: boolean;
  realInferenceBlocked: boolean;
  runtimeDependencyChangesAbsent: boolean;
  providerRegistrationUnchanged: boolean;
  defaultOptInDisabled: boolean;
  modelOutputShellExecutionBlocked: boolean;
  privatePathExposureBlocked: boolean;
  rawDiagnosticsExposureBlocked: boolean;
  verificationClean: boolean;
}

export interface CoreHostLocalEmbeddingRuntimeSessionFactoryPreflightResult {
  provider: string;
  modelId: string;
  runtime: typeof TRANSFORMERS_LOCAL_RUNTIME;
  runtimePackageName: string;
  compositionRoot: string;
  providerOptInEnvKey: string;
  runtimePythonEnvKey: string;
  status: CoreHostLocalEmbeddingRuntimeSessionFactoryPreflightStatus;
  accepted: boolean;
  readyForRuntimeSessionFactoryApproval: boolean;
  preflightOnly: true;
  productApprovalRequired: true;
  securityApprovalRequired: true;
  productApprovalGranted: false;
  securityApprovalGranted: false;
  sessionFactoryImplementationAllowed: false;
  sessionFactoryImplemented: false;
  runtimePythonEnvRead: false;
  runtimePythonEnvValueExposed: false;
  modelArtifactPathRead: false;
  pythonHelperLaunchEnabled: false;
  modelArtifactAccessEnabled: false;
  cacheWritesEnabled: false;
  modelLoadEnabled: false;
  realInferenceEnabled: false;
  runtimeDependencyChangesIntroduced: false;
  providerRegistrationChanged: false;
  defaultOptInEnabled: false;
  modelOutputShellExecutionEnabled: false;
  privatePathExposureEnabled: false;
  rawDiagnosticsExposed: false;
  reviewedAreas: string[];
  checks: CoreHostLocalEmbeddingRuntimeSessionFactoryPreflightChecks;
  reasons: string[];
}

export function evaluateCoreHostLocalEmbeddingRuntimeSessionFactoryPreflight(
  input: CoreHostLocalEmbeddingRuntimeSessionFactoryPreflightInput = {}
): CoreHostLocalEmbeddingRuntimeSessionFactoryPreflightResult {
  const checks: CoreHostLocalEmbeddingRuntimeSessionFactoryPreflightChecks = {
    compositionRootRestricted:
      input.compositionRoot === TRANSFORMERS_LOCAL_RUNTIME_COMPOSITION_ROOT,
    providerShellExplicitlyOptIn:
      input.providerShellComposedByExplicitOptIn === true,
    runtimeDescriptorExplicitlyOptIn:
      input.runtimeDescriptorComposedByExplicitOptIn === true,
    approvedManifestExplicitlyOptIn:
      input.approvedManifestComposedByExplicitOptIn === true,
    fixtureFallbackPreserved: input.fixtureFallbackPreserved === true,
    resourceLeaseEnforcementReviewed:
      input.resourceLeaseEnforcementReviewed === true,
    sanitizedErrorMappingReviewed:
      input.sanitizedErrorMappingReviewed === true,
    startupRestartRollbackReviewed:
      input.startupRestartRollbackReviewed === true,
    runtimePythonEnvHandlingReviewed:
      input.runtimePythonEnvHandlingReviewed === true,
    productApprovalRequired: input.productApprovalRequired === true,
    securityApprovalRequired: input.securityApprovalRequired === true,
    productApprovalStillPending: input.productApprovalGranted === false,
    securityApprovalStillPending: input.securityApprovalGranted === false,
    sessionFactoryImplementationBlocked:
      input.sessionFactoryImplementationAllowed === false &&
      input.sessionFactoryImplemented === false,
    runtimePythonEnvReadBlocked: input.runtimePythonEnvRead === false,
    runtimePythonEnvValueHidden:
      input.runtimePythonEnvValueExposed === false,
    modelArtifactPathReadBlocked:
      input.modelArtifactPathRead === false,
    pythonHelperLaunchBlocked:
      input.pythonHelperLaunchEnabled === false,
    modelArtifactAccessBlocked:
      input.modelArtifactAccessEnabled === false,
    cacheWritesBlocked: input.cacheWritesEnabled === false,
    modelLoadBlocked: input.modelLoadEnabled === false,
    realInferenceBlocked: input.realInferenceEnabled === false,
    runtimeDependencyChangesAbsent:
      input.runtimeDependencyChangesIntroduced === false,
    providerRegistrationUnchanged:
      input.providerRegistrationChanged === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false,
    modelOutputShellExecutionBlocked:
      input.modelOutputShellExecutionEnabled === false,
    privatePathExposureBlocked:
      input.privatePathExposureEnabled === false,
    rawDiagnosticsExposureBlocked: input.rawDiagnosticsExposed === false,
    verificationClean: input.verificationClean === true
  };
  const requiredEvidenceComplete =
    checks.compositionRootRestricted &&
    checks.providerShellExplicitlyOptIn &&
    checks.runtimeDescriptorExplicitlyOptIn &&
    checks.approvedManifestExplicitlyOptIn &&
    checks.fixtureFallbackPreserved &&
    checks.resourceLeaseEnforcementReviewed &&
    checks.sanitizedErrorMappingReviewed &&
    checks.startupRestartRollbackReviewed &&
    checks.runtimePythonEnvHandlingReviewed &&
    checks.productApprovalRequired &&
    checks.securityApprovalRequired &&
    checks.productApprovalStillPending &&
    checks.securityApprovalStillPending &&
    checks.verificationClean;
  const sideEffectsBlocked =
    checks.sessionFactoryImplementationBlocked &&
    checks.runtimePythonEnvReadBlocked &&
    checks.runtimePythonEnvValueHidden &&
    checks.modelArtifactPathReadBlocked &&
    checks.pythonHelperLaunchBlocked &&
    checks.modelArtifactAccessBlocked &&
    checks.cacheWritesBlocked &&
    checks.modelLoadBlocked &&
    checks.realInferenceBlocked &&
    checks.runtimeDependencyChangesAbsent &&
    checks.providerRegistrationUnchanged &&
    checks.defaultOptInDisabled &&
    checks.modelOutputShellExecutionBlocked &&
    checks.privatePathExposureBlocked &&
    checks.rawDiagnosticsExposureBlocked;
  const accepted = requiredEvidenceComplete && sideEffectsBlocked;
  const status: CoreHostLocalEmbeddingRuntimeSessionFactoryPreflightStatus =
    accepted
      ? "ready_for_runtime_session_factory_approval"
      : sideEffectsBlocked
        ? "degraded"
        : "blocked";

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: TRANSFORMERS_LOCAL_RUNTIME,
    runtimePackageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
    compositionRoot: TRANSFORMERS_LOCAL_RUNTIME_COMPOSITION_ROOT,
    providerOptInEnvKey: LOCAL_EMBEDDING_PROVIDER_OPT_IN_ENV,
    runtimePythonEnvKey: LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
    status,
    accepted,
    readyForRuntimeSessionFactoryApproval: accepted,
    preflightOnly: true,
    productApprovalRequired: true,
    securityApprovalRequired: true,
    productApprovalGranted: false,
    securityApprovalGranted: false,
    sessionFactoryImplementationAllowed: false,
    sessionFactoryImplemented: false,
    runtimePythonEnvRead: false,
    runtimePythonEnvValueExposed: false,
    modelArtifactPathRead: false,
    pythonHelperLaunchEnabled: false,
    modelArtifactAccessEnabled: false,
    cacheWritesEnabled: false,
    modelLoadEnabled: false,
    realInferenceEnabled: false,
    runtimeDependencyChangesIntroduced: false,
    providerRegistrationChanged: false,
    defaultOptInEnabled: false,
    modelOutputShellExecutionEnabled: false,
    privatePathExposureEnabled: false,
    rawDiagnosticsExposed: false,
    reviewedAreas: accepted
      ? [
          "explicit_opt_in_composition",
          "runtime_python_env_handling",
          "resource_lease_enforcement",
          "sanitized_error_mapping",
          "startup_restart_rollback",
          "fixture_fallback"
        ]
      : [],
    checks,
    reasons: createReasons(checks, accepted)
  };
}

function createReasons(
  checks: CoreHostLocalEmbeddingRuntimeSessionFactoryPreflightChecks,
  accepted: boolean
): string[] {
  const reasons: string[] = [];

  if (!checks.compositionRootRestricted) {
    reasons.push("Runtime session factory work must remain rooted in apps/core-host.");
  }
  if (!checks.providerShellExplicitlyOptIn) {
    reasons.push("Provider shell composition must be reviewed as explicit opt-in only.");
  }
  if (!checks.runtimeDescriptorExplicitlyOptIn) {
    reasons.push("Runtime descriptor composition must be reviewed as explicit opt-in only.");
  }
  if (!checks.approvedManifestExplicitlyOptIn) {
    reasons.push("Approved manifest composition must be reviewed as explicit opt-in only.");
  }
  if (!checks.fixtureFallbackPreserved) {
    reasons.push("Fixture embedding fallback preservation review is required.");
  }
  if (!checks.resourceLeaseEnforcementReviewed) {
    reasons.push("Resource lease enforcement review is required before session factory approval.");
  }
  if (!checks.sanitizedErrorMappingReviewed) {
    reasons.push("Sanitized runtime error mapping review is required before session factory approval.");
  }
  if (!checks.startupRestartRollbackReviewed) {
    reasons.push("Startup, restart, and rollback behavior review is required.");
  }
  if (!checks.runtimePythonEnvHandlingReviewed) {
    reasons.push("Runtime Python environment handling must be reviewed without reading its value.");
  }
  if (!checks.productApprovalRequired) {
    reasons.push("Product approval must be required for the real session factory wave.");
  }
  if (!checks.securityApprovalRequired) {
    reasons.push("Security approval must be required for the real session factory wave.");
  }
  if (!checks.productApprovalStillPending) {
    reasons.push("Product approval must be granted only in the separate session factory wave.");
  }
  if (!checks.securityApprovalStillPending) {
    reasons.push("Security approval must be granted only in the separate session factory wave.");
  }
  if (!checks.sessionFactoryImplementationBlocked) {
    reasons.push("Runtime session factory implementation remains blocked in this preflight.");
  }
  if (!checks.runtimePythonEnvReadBlocked) {
    reasons.push("Runtime Python environment value must not be read in this preflight.");
  }
  if (!checks.runtimePythonEnvValueHidden) {
    reasons.push("Runtime Python environment value must not be exposed.");
  }
  if (!checks.modelArtifactPathReadBlocked) {
    reasons.push("Model artifact paths must not be read in this preflight.");
  }
  if (!checks.pythonHelperLaunchBlocked) {
    reasons.push("Python helper launch remains blocked in this preflight.");
  }
  if (!checks.modelArtifactAccessBlocked) {
    reasons.push("Model artifact access remains blocked in this preflight.");
  }
  if (!checks.cacheWritesBlocked) {
    reasons.push("Cache writes remain blocked in this preflight.");
  }
  if (!checks.modelLoadBlocked) {
    reasons.push("Model loading remains blocked in this preflight.");
  }
  if (!checks.realInferenceBlocked) {
    reasons.push("Real local embedding inference remains blocked in this preflight.");
  }
  if (!checks.runtimeDependencyChangesAbsent) {
    reasons.push("Runtime dependency changes require a separate approval.");
  }
  if (!checks.providerRegistrationUnchanged) {
    reasons.push("Provider registration behavior must not change in this preflight.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Default local embedding opt-in must remain disabled.");
  }
  if (!checks.modelOutputShellExecutionBlocked) {
    reasons.push("Model output must not be converted into shell execution.");
  }
  if (!checks.privatePathExposureBlocked) {
    reasons.push("Private path exposure must remain blocked.");
  }
  if (!checks.rawDiagnosticsExposureBlocked) {
    reasons.push("Raw diagnostics exposure must remain blocked.");
  }
  if (!checks.verificationClean) {
    reasons.push("Clean local verification evidence is required.");
  }
  if (accepted) {
    reasons.push(
      "Core Host runtime session factory preflight is ready for separate product and security approval."
    );
  }

  return reasons;
}
