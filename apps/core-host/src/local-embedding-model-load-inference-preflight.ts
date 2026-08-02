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

export type CoreHostLocalEmbeddingModelLoadInferencePreflightStatus =
  | "blocked"
  | "degraded"
  | "ready_for_model_load_inference_approval";

export interface CoreHostLocalEmbeddingModelLoadInferencePreflightInput {
  compositionRoot?: string;
  providerShellExplicitlyOptIn?: boolean;
  helperLifecycleImplemented?: boolean;
  runtimePythonEnvAlreadyApproved?: boolean;
  approvedManifestAvailable?: boolean;
  artifactPinApprovalReviewed?: boolean;
  artifactPathPolicyReviewed?: boolean;
  digestVerificationBeforeLoadReviewed?: boolean;
  helperLoadContractReviewed?: boolean;
  helperEmbedContractReviewed?: boolean;
  resourceLeaseBeforeLoadReviewed?: boolean;
  sanitizedErrorMappingReviewed?: boolean;
  fixtureFallbackPreserved?: boolean;
  startupRestartRollbackReviewed?: boolean;
  productApprovalRequired?: boolean;
  securityApprovalRequired?: boolean;
  verificationClean?: boolean;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  modelArtifactPathRead?: boolean;
  modelDirectoryPassedToHelper?: boolean;
  helperLoadCalled?: boolean;
  helperEmbedCalled?: boolean;
  modelArtifactAccessEnabled?: boolean;
  cacheWritesEnabled?: boolean;
  downloadEnabled?: boolean;
  modelLoadEnabled?: boolean;
  realInferenceEnabled?: boolean;
  rawEmbeddingVectorsExposed?: boolean;
  providerRegistrationChanged?: boolean;
  defaultOptInEnabled?: boolean;
  uiVisibilityChanged?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathExposureEnabled?: boolean;
  signedUrlOrCredentialPersistenceEnabled?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface CoreHostLocalEmbeddingModelLoadInferencePreflightChecks {
  compositionRootRestricted: boolean;
  providerShellExplicitlyOptIn: boolean;
  helperLifecycleImplemented: boolean;
  runtimePythonEnvAlreadyApproved: boolean;
  approvedManifestAvailable: boolean;
  artifactPinApprovalReviewed: boolean;
  artifactPathPolicyReviewed: boolean;
  digestVerificationBeforeLoadReviewed: boolean;
  helperLoadContractReviewed: boolean;
  helperEmbedContractReviewed: boolean;
  resourceLeaseBeforeLoadReviewed: boolean;
  sanitizedErrorMappingReviewed: boolean;
  fixtureFallbackPreserved: boolean;
  startupRestartRollbackReviewed: boolean;
  productApprovalRequired: boolean;
  securityApprovalRequired: boolean;
  productApprovalStillPending: boolean;
  securityApprovalStillPending: boolean;
  modelArtifactPathReadBlocked: boolean;
  modelDirectoryPassingBlocked: boolean;
  helperLoadCallBlocked: boolean;
  helperEmbedCallBlocked: boolean;
  modelArtifactAccessBlocked: boolean;
  cacheWritesBlocked: boolean;
  downloadsBlocked: boolean;
  modelLoadBlocked: boolean;
  realInferenceBlocked: boolean;
  rawEmbeddingVectorExposureBlocked: boolean;
  providerRegistrationUnchanged: boolean;
  defaultOptInDisabled: boolean;
  uiVisibilityUnchanged: boolean;
  rawDiagnosticsExposureBlocked: boolean;
  privatePathExposureBlocked: boolean;
  signedUrlAndCredentialPersistenceBlocked: boolean;
  modelOutputShellExecutionBlocked: boolean;
  verificationClean: boolean;
}

export interface CoreHostLocalEmbeddingModelLoadInferencePreflightResult {
  provider: string;
  modelId: string;
  runtime: typeof TRANSFORMERS_LOCAL_RUNTIME;
  runtimePackageName: string;
  compositionRoot: string;
  providerOptInEnvKey: string;
  runtimePythonEnvKey: string;
  status: CoreHostLocalEmbeddingModelLoadInferencePreflightStatus;
  accepted: boolean;
  readyForModelLoadInferenceApproval: boolean;
  preflightOnly: true;
  productApprovalRequired: true;
  securityApprovalRequired: true;
  productApprovalGranted: false;
  securityApprovalGranted: false;
  modelArtifactPathRead: false;
  modelDirectoryPassedToHelper: false;
  helperLoadCalled: false;
  helperEmbedCalled: false;
  modelArtifactAccessEnabled: false;
  cacheWritesEnabled: false;
  downloadEnabled: false;
  modelLoadEnabled: false;
  realInferenceEnabled: false;
  rawEmbeddingVectorsExposed: false;
  providerRegistrationChanged: false;
  defaultOptInEnabled: false;
  uiVisibilityChanged: false;
  rawDiagnosticsExposed: false;
  privatePathExposureEnabled: false;
  signedUrlOrCredentialPersistenceEnabled: false;
  modelOutputShellExecutionEnabled: false;
  reviewedAreas: string[];
  checks: CoreHostLocalEmbeddingModelLoadInferencePreflightChecks;
  reasons: string[];
}

export function evaluateCoreHostLocalEmbeddingModelLoadInferencePreflight(
  input: CoreHostLocalEmbeddingModelLoadInferencePreflightInput = {}
): CoreHostLocalEmbeddingModelLoadInferencePreflightResult {
  const checks: CoreHostLocalEmbeddingModelLoadInferencePreflightChecks = {
    compositionRootRestricted:
      input.compositionRoot === TRANSFORMERS_LOCAL_RUNTIME_COMPOSITION_ROOT,
    providerShellExplicitlyOptIn:
      input.providerShellExplicitlyOptIn === true,
    helperLifecycleImplemented:
      input.helperLifecycleImplemented === true,
    runtimePythonEnvAlreadyApproved:
      input.runtimePythonEnvAlreadyApproved === true,
    approvedManifestAvailable: input.approvedManifestAvailable === true,
    artifactPinApprovalReviewed:
      input.artifactPinApprovalReviewed === true,
    artifactPathPolicyReviewed:
      input.artifactPathPolicyReviewed === true,
    digestVerificationBeforeLoadReviewed:
      input.digestVerificationBeforeLoadReviewed === true,
    helperLoadContractReviewed:
      input.helperLoadContractReviewed === true,
    helperEmbedContractReviewed:
      input.helperEmbedContractReviewed === true,
    resourceLeaseBeforeLoadReviewed:
      input.resourceLeaseBeforeLoadReviewed === true,
    sanitizedErrorMappingReviewed:
      input.sanitizedErrorMappingReviewed === true,
    fixtureFallbackPreserved: input.fixtureFallbackPreserved === true,
    startupRestartRollbackReviewed:
      input.startupRestartRollbackReviewed === true,
    productApprovalRequired: input.productApprovalRequired === true,
    securityApprovalRequired: input.securityApprovalRequired === true,
    productApprovalStillPending: input.productApprovalGranted === false,
    securityApprovalStillPending: input.securityApprovalGranted === false,
    modelArtifactPathReadBlocked: input.modelArtifactPathRead === false,
    modelDirectoryPassingBlocked:
      input.modelDirectoryPassedToHelper === false,
    helperLoadCallBlocked: input.helperLoadCalled === false,
    helperEmbedCallBlocked: input.helperEmbedCalled === false,
    modelArtifactAccessBlocked:
      input.modelArtifactAccessEnabled === false,
    cacheWritesBlocked: input.cacheWritesEnabled === false,
    downloadsBlocked: input.downloadEnabled === false,
    modelLoadBlocked: input.modelLoadEnabled === false,
    realInferenceBlocked: input.realInferenceEnabled === false,
    rawEmbeddingVectorExposureBlocked:
      input.rawEmbeddingVectorsExposed === false,
    providerRegistrationUnchanged:
      input.providerRegistrationChanged === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false,
    uiVisibilityUnchanged: input.uiVisibilityChanged === false,
    rawDiagnosticsExposureBlocked: input.rawDiagnosticsExposed === false,
    privatePathExposureBlocked:
      input.privatePathExposureEnabled === false,
    signedUrlAndCredentialPersistenceBlocked:
      input.signedUrlOrCredentialPersistenceEnabled === false,
    modelOutputShellExecutionBlocked:
      input.modelOutputShellExecutionEnabled === false,
    verificationClean: input.verificationClean === true
  };
  const requiredEvidenceComplete =
    checks.compositionRootRestricted &&
    checks.providerShellExplicitlyOptIn &&
    checks.helperLifecycleImplemented &&
    checks.runtimePythonEnvAlreadyApproved &&
    checks.approvedManifestAvailable &&
    checks.artifactPinApprovalReviewed &&
    checks.artifactPathPolicyReviewed &&
    checks.digestVerificationBeforeLoadReviewed &&
    checks.helperLoadContractReviewed &&
    checks.helperEmbedContractReviewed &&
    checks.resourceLeaseBeforeLoadReviewed &&
    checks.sanitizedErrorMappingReviewed &&
    checks.fixtureFallbackPreserved &&
    checks.startupRestartRollbackReviewed &&
    checks.productApprovalRequired &&
    checks.securityApprovalRequired &&
    checks.productApprovalStillPending &&
    checks.securityApprovalStillPending &&
    checks.verificationClean;
  const sideEffectsBlocked =
    checks.modelArtifactPathReadBlocked &&
    checks.modelDirectoryPassingBlocked &&
    checks.helperLoadCallBlocked &&
    checks.helperEmbedCallBlocked &&
    checks.modelArtifactAccessBlocked &&
    checks.cacheWritesBlocked &&
    checks.downloadsBlocked &&
    checks.modelLoadBlocked &&
    checks.realInferenceBlocked &&
    checks.rawEmbeddingVectorExposureBlocked &&
    checks.providerRegistrationUnchanged &&
    checks.defaultOptInDisabled &&
    checks.uiVisibilityUnchanged &&
    checks.rawDiagnosticsExposureBlocked &&
    checks.privatePathExposureBlocked &&
    checks.signedUrlAndCredentialPersistenceBlocked &&
    checks.modelOutputShellExecutionBlocked;
  const accepted = requiredEvidenceComplete && sideEffectsBlocked;
  const status: CoreHostLocalEmbeddingModelLoadInferencePreflightStatus =
    accepted
      ? "ready_for_model_load_inference_approval"
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
    readyForModelLoadInferenceApproval: accepted,
    preflightOnly: true,
    productApprovalRequired: true,
    securityApprovalRequired: true,
    productApprovalGranted: false,
    securityApprovalGranted: false,
    modelArtifactPathRead: false,
    modelDirectoryPassedToHelper: false,
    helperLoadCalled: false,
    helperEmbedCalled: false,
    modelArtifactAccessEnabled: false,
    cacheWritesEnabled: false,
    downloadEnabled: false,
    modelLoadEnabled: false,
    realInferenceEnabled: false,
    rawEmbeddingVectorsExposed: false,
    providerRegistrationChanged: false,
    defaultOptInEnabled: false,
    uiVisibilityChanged: false,
    rawDiagnosticsExposed: false,
    privatePathExposureEnabled: false,
    signedUrlOrCredentialPersistenceEnabled: false,
    modelOutputShellExecutionEnabled: false,
    reviewedAreas: accepted
      ? [
          "artifact_path_policy",
          "digest_verification_before_load",
          "helper_load_contract",
          "helper_embed_contract",
          "resource_lease_before_load",
          "sanitized_error_mapping",
          "fixture_fallback",
          "startup_restart_rollback"
        ]
      : [],
    checks,
    reasons: createReasons(checks, accepted)
  };
}

function createReasons(
  checks: CoreHostLocalEmbeddingModelLoadInferencePreflightChecks,
  accepted: boolean
): string[] {
  const reasons: string[] = [];

  if (!checks.compositionRootRestricted) {
    reasons.push("Model load and inference work must remain rooted in apps/core-host.");
  }
  if (!checks.providerShellExplicitlyOptIn) {
    reasons.push("Provider shell must remain explicit opt-in only.");
  }
  if (!checks.helperLifecycleImplemented) {
    reasons.push("Approved helper lifecycle wiring must be in place first.");
  }
  if (!checks.runtimePythonEnvAlreadyApproved) {
    reasons.push("Runtime Python environment handling approval evidence is required.");
  }
  if (!checks.approvedManifestAvailable) {
    reasons.push("Approved local embedding manifest evidence is required.");
  }
  if (!checks.artifactPinApprovalReviewed) {
    reasons.push("Approved artifact pin evidence must be reviewed.");
  }
  if (!checks.artifactPathPolicyReviewed) {
    reasons.push("Model artifact path policy review is required.");
  }
  if (!checks.digestVerificationBeforeLoadReviewed) {
    reasons.push("Digest verification before model load review is required.");
  }
  if (!checks.helperLoadContractReviewed) {
    reasons.push("Helper load contract review is required.");
  }
  if (!checks.helperEmbedContractReviewed) {
    reasons.push("Helper embed contract review is required.");
  }
  if (!checks.resourceLeaseBeforeLoadReviewed) {
    reasons.push("Resource lease before helper load review is required.");
  }
  if (!checks.sanitizedErrorMappingReviewed) {
    reasons.push("Sanitized error mapping review is required.");
  }
  if (!checks.fixtureFallbackPreserved) {
    reasons.push("Fixture embedding fallback preservation review is required.");
  }
  if (!checks.startupRestartRollbackReviewed) {
    reasons.push("Startup, restart, and rollback review is required.");
  }
  if (!checks.productApprovalRequired) {
    reasons.push("Product approval must be required for model load and inference.");
  }
  if (!checks.securityApprovalRequired) {
    reasons.push("Security approval must be required for model load and inference.");
  }
  if (!checks.productApprovalStillPending) {
    reasons.push("Product approval must be granted only in the separate model-load wave.");
  }
  if (!checks.securityApprovalStillPending) {
    reasons.push("Security approval must be granted only in the separate model-load wave.");
  }
  if (!checks.modelArtifactPathReadBlocked) {
    reasons.push("Model artifact path reads remain blocked in this preflight.");
  }
  if (!checks.modelDirectoryPassingBlocked) {
    reasons.push("Passing a model directory to the helper remains blocked.");
  }
  if (!checks.helperLoadCallBlocked) {
    reasons.push("Helper load calls remain blocked in this preflight.");
  }
  if (!checks.helperEmbedCallBlocked) {
    reasons.push("Helper embed calls remain blocked in this preflight.");
  }
  if (!checks.modelArtifactAccessBlocked) {
    reasons.push("Model artifact access remains blocked in this preflight.");
  }
  if (!checks.cacheWritesBlocked) {
    reasons.push("Cache writes remain blocked in this preflight.");
  }
  if (!checks.downloadsBlocked) {
    reasons.push("Downloads remain blocked in this preflight.");
  }
  if (!checks.modelLoadBlocked) {
    reasons.push("Model loading remains blocked in this preflight.");
  }
  if (!checks.realInferenceBlocked) {
    reasons.push("Real local embedding inference remains blocked in this preflight.");
  }
  if (!checks.rawEmbeddingVectorExposureBlocked) {
    reasons.push("Raw embedding vector exposure remains blocked.");
  }
  if (!checks.providerRegistrationUnchanged) {
    reasons.push("Provider registration behavior must not change in this preflight.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Default local embedding opt-in must remain disabled.");
  }
  if (!checks.uiVisibilityUnchanged) {
    reasons.push("UI visibility must not change in this preflight.");
  }
  if (!checks.rawDiagnosticsExposureBlocked) {
    reasons.push("Raw diagnostics exposure must remain blocked.");
  }
  if (!checks.privatePathExposureBlocked) {
    reasons.push("Private path exposure must remain blocked.");
  }
  if (!checks.signedUrlAndCredentialPersistenceBlocked) {
    reasons.push("Signed URL and credential persistence must remain blocked.");
  }
  if (!checks.modelOutputShellExecutionBlocked) {
    reasons.push("Model output must not be converted into shell execution.");
  }
  if (!checks.verificationClean) {
    reasons.push("Clean local verification evidence is required.");
  }
  if (accepted) {
    reasons.push(
      "Model load and inference preflight is ready for separate product and security approval."
    );
  }

  return reasons;
}
