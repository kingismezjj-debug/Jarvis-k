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
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV
} from "./local-embedding-runtime-session-factory";

export type CoreHostLocalEmbeddingHelperEmbedPreflightStatus =
  | "blocked"
  | "degraded"
  | "ready_for_helper_embed_approval";

export interface CoreHostLocalEmbeddingHelperEmbedPreflightInput {
  compositionRoot?: string;
  providerShellExplicitlyOptIn?: boolean;
  helperLifecycleImplemented?: boolean;
  modelArtifactLoadImplemented?: boolean;
  digestVerificationBeforeLoadImplemented?: boolean;
  runtimePythonEnvApproved?: boolean;
  modelDirectoryEnvApproved?: boolean;
  approvedManifestAvailable?: boolean;
  helperEmbedContractReviewed?: boolean;
  sessionIdHandoffReviewed?: boolean;
  resourceLeaseBeforeEmbedReviewed?: boolean;
  inputBatchBoundsReviewed?: boolean;
  inputTextBoundsReviewed?: boolean;
  dimensionValidationReviewed?: boolean;
  vectorSanitizationReviewed?: boolean;
  timeoutAndCancellationReviewed?: boolean;
  sanitizedErrorMappingReviewed?: boolean;
  operationSupervisorBoundaryReviewed?: boolean;
  fixtureFallbackPreserved?: boolean;
  productApprovalRequired?: boolean;
  securityApprovalRequired?: boolean;
  verificationClean?: boolean;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  helperEmbedCalled?: boolean;
  embeddingVectorsReturned?: boolean;
  vectorsRoutedToMemory?: boolean;
  vectorsPersisted?: boolean;
  vectorsLoggedOrExposed?: boolean;
  productInferenceEnabled?: boolean;
  providerRegistrationChanged?: boolean;
  defaultOptInEnabled?: boolean;
  uiVisibilityChanged?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathExposureEnabled?: boolean;
  signedUrlOrCredentialPersistenceEnabled?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
  downloadsEnabled?: boolean;
  persistentCacheWritesEnabled?: boolean;
  memorySchemaMigrationEnabled?: boolean;
}

export interface CoreHostLocalEmbeddingHelperEmbedPreflightChecks {
  compositionRootRestricted: boolean;
  providerShellExplicitlyOptIn: boolean;
  helperLifecycleImplemented: boolean;
  modelArtifactLoadImplemented: boolean;
  digestVerificationBeforeLoadImplemented: boolean;
  runtimePythonEnvApproved: boolean;
  modelDirectoryEnvApproved: boolean;
  approvedManifestAvailable: boolean;
  helperEmbedContractReviewed: boolean;
  sessionIdHandoffReviewed: boolean;
  resourceLeaseBeforeEmbedReviewed: boolean;
  inputBatchBoundsReviewed: boolean;
  inputTextBoundsReviewed: boolean;
  dimensionValidationReviewed: boolean;
  vectorSanitizationReviewed: boolean;
  timeoutAndCancellationReviewed: boolean;
  sanitizedErrorMappingReviewed: boolean;
  operationSupervisorBoundaryReviewed: boolean;
  fixtureFallbackPreserved: boolean;
  productApprovalRequired: boolean;
  securityApprovalRequired: boolean;
  productApprovalStillPending: boolean;
  securityApprovalStillPending: boolean;
  helperEmbedCallBlocked: boolean;
  embeddingVectorReturnBlocked: boolean;
  memoryVectorRoutingBlocked: boolean;
  vectorPersistenceBlocked: boolean;
  vectorLogExposureBlocked: boolean;
  productInferenceBlocked: boolean;
  providerRegistrationUnchanged: boolean;
  defaultOptInDisabled: boolean;
  uiVisibilityUnchanged: boolean;
  rawDiagnosticsExposureBlocked: boolean;
  privatePathExposureBlocked: boolean;
  signedUrlAndCredentialPersistenceBlocked: boolean;
  modelOutputShellExecutionBlocked: boolean;
  downloadsBlocked: boolean;
  persistentCacheWritesBlocked: boolean;
  memorySchemaMigrationBlocked: boolean;
  verificationClean: boolean;
}

export interface CoreHostLocalEmbeddingHelperEmbedPreflightResult {
  provider: string;
  modelId: string;
  runtime: typeof TRANSFORMERS_LOCAL_RUNTIME;
  runtimePackageName: string;
  compositionRoot: string;
  providerOptInEnvKey: string;
  runtimePythonEnvKey: string;
  modelDirectoryEnvKey: string;
  status: CoreHostLocalEmbeddingHelperEmbedPreflightStatus;
  accepted: boolean;
  readyForHelperEmbedApproval: boolean;
  preflightOnly: true;
  productApprovalRequired: true;
  securityApprovalRequired: true;
  productApprovalGranted: false;
  securityApprovalGranted: false;
  helperEmbedCalled: false;
  embeddingVectorsReturned: false;
  vectorsRoutedToMemory: false;
  vectorsPersisted: false;
  vectorsLoggedOrExposed: false;
  productInferenceEnabled: false;
  providerRegistrationChanged: false;
  defaultOptInEnabled: false;
  uiVisibilityChanged: false;
  rawDiagnosticsExposed: false;
  privatePathExposureEnabled: false;
  signedUrlOrCredentialPersistenceEnabled: false;
  modelOutputShellExecutionEnabled: false;
  downloadsEnabled: false;
  persistentCacheWritesEnabled: false;
  memorySchemaMigrationEnabled: false;
  reviewedAreas: string[];
  checks: CoreHostLocalEmbeddingHelperEmbedPreflightChecks;
  reasons: string[];
}

export function evaluateCoreHostLocalEmbeddingHelperEmbedPreflight(
  input: CoreHostLocalEmbeddingHelperEmbedPreflightInput = {}
): CoreHostLocalEmbeddingHelperEmbedPreflightResult {
  const checks: CoreHostLocalEmbeddingHelperEmbedPreflightChecks = {
    compositionRootRestricted:
      input.compositionRoot === TRANSFORMERS_LOCAL_RUNTIME_COMPOSITION_ROOT,
    providerShellExplicitlyOptIn:
      input.providerShellExplicitlyOptIn === true,
    helperLifecycleImplemented:
      input.helperLifecycleImplemented === true,
    modelArtifactLoadImplemented:
      input.modelArtifactLoadImplemented === true,
    digestVerificationBeforeLoadImplemented:
      input.digestVerificationBeforeLoadImplemented === true,
    runtimePythonEnvApproved: input.runtimePythonEnvApproved === true,
    modelDirectoryEnvApproved: input.modelDirectoryEnvApproved === true,
    approvedManifestAvailable: input.approvedManifestAvailable === true,
    helperEmbedContractReviewed:
      input.helperEmbedContractReviewed === true,
    sessionIdHandoffReviewed: input.sessionIdHandoffReviewed === true,
    resourceLeaseBeforeEmbedReviewed:
      input.resourceLeaseBeforeEmbedReviewed === true,
    inputBatchBoundsReviewed: input.inputBatchBoundsReviewed === true,
    inputTextBoundsReviewed: input.inputTextBoundsReviewed === true,
    dimensionValidationReviewed:
      input.dimensionValidationReviewed === true,
    vectorSanitizationReviewed:
      input.vectorSanitizationReviewed === true,
    timeoutAndCancellationReviewed:
      input.timeoutAndCancellationReviewed === true,
    sanitizedErrorMappingReviewed:
      input.sanitizedErrorMappingReviewed === true,
    operationSupervisorBoundaryReviewed:
      input.operationSupervisorBoundaryReviewed === true,
    fixtureFallbackPreserved: input.fixtureFallbackPreserved === true,
    productApprovalRequired: input.productApprovalRequired === true,
    securityApprovalRequired: input.securityApprovalRequired === true,
    productApprovalStillPending: input.productApprovalGranted === false,
    securityApprovalStillPending: input.securityApprovalGranted === false,
    helperEmbedCallBlocked: input.helperEmbedCalled === false,
    embeddingVectorReturnBlocked:
      input.embeddingVectorsReturned === false,
    memoryVectorRoutingBlocked: input.vectorsRoutedToMemory === false,
    vectorPersistenceBlocked: input.vectorsPersisted === false,
    vectorLogExposureBlocked: input.vectorsLoggedOrExposed === false,
    productInferenceBlocked: input.productInferenceEnabled === false,
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
    downloadsBlocked: input.downloadsEnabled === false,
    persistentCacheWritesBlocked:
      input.persistentCacheWritesEnabled === false,
    memorySchemaMigrationBlocked:
      input.memorySchemaMigrationEnabled === false,
    verificationClean: input.verificationClean === true
  };

  const requiredEvidenceComplete =
    checks.compositionRootRestricted &&
    checks.providerShellExplicitlyOptIn &&
    checks.helperLifecycleImplemented &&
    checks.modelArtifactLoadImplemented &&
    checks.digestVerificationBeforeLoadImplemented &&
    checks.runtimePythonEnvApproved &&
    checks.modelDirectoryEnvApproved &&
    checks.approvedManifestAvailable &&
    checks.helperEmbedContractReviewed &&
    checks.sessionIdHandoffReviewed &&
    checks.resourceLeaseBeforeEmbedReviewed &&
    checks.inputBatchBoundsReviewed &&
    checks.inputTextBoundsReviewed &&
    checks.dimensionValidationReviewed &&
    checks.vectorSanitizationReviewed &&
    checks.timeoutAndCancellationReviewed &&
    checks.sanitizedErrorMappingReviewed &&
    checks.operationSupervisorBoundaryReviewed &&
    checks.fixtureFallbackPreserved &&
    checks.productApprovalRequired &&
    checks.securityApprovalRequired &&
    checks.productApprovalStillPending &&
    checks.securityApprovalStillPending &&
    checks.verificationClean;
  const sideEffectsBlocked =
    checks.helperEmbedCallBlocked &&
    checks.embeddingVectorReturnBlocked &&
    checks.memoryVectorRoutingBlocked &&
    checks.vectorPersistenceBlocked &&
    checks.vectorLogExposureBlocked &&
    checks.productInferenceBlocked &&
    checks.providerRegistrationUnchanged &&
    checks.defaultOptInDisabled &&
    checks.uiVisibilityUnchanged &&
    checks.rawDiagnosticsExposureBlocked &&
    checks.privatePathExposureBlocked &&
    checks.signedUrlAndCredentialPersistenceBlocked &&
    checks.modelOutputShellExecutionBlocked &&
    checks.downloadsBlocked &&
    checks.persistentCacheWritesBlocked &&
    checks.memorySchemaMigrationBlocked;
  const accepted = requiredEvidenceComplete && sideEffectsBlocked;
  const status: CoreHostLocalEmbeddingHelperEmbedPreflightStatus =
    accepted
      ? "ready_for_helper_embed_approval"
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
    modelDirectoryEnvKey: LOCAL_EMBEDDING_MODEL_DIR_ENV,
    status,
    accepted,
    readyForHelperEmbedApproval: accepted,
    preflightOnly: true,
    productApprovalRequired: true,
    securityApprovalRequired: true,
    productApprovalGranted: false,
    securityApprovalGranted: false,
    helperEmbedCalled: false,
    embeddingVectorsReturned: false,
    vectorsRoutedToMemory: false,
    vectorsPersisted: false,
    vectorsLoggedOrExposed: false,
    productInferenceEnabled: false,
    providerRegistrationChanged: false,
    defaultOptInEnabled: false,
    uiVisibilityChanged: false,
    rawDiagnosticsExposed: false,
    privatePathExposureEnabled: false,
    signedUrlOrCredentialPersistenceEnabled: false,
    modelOutputShellExecutionEnabled: false,
    downloadsEnabled: false,
    persistentCacheWritesEnabled: false,
    memorySchemaMigrationEnabled: false,
    reviewedAreas: accepted
      ? [
          "helper_embed_contract",
          "session_id_handoff",
          "resource_lease_before_embed",
          "input_batch_bounds",
          "input_text_bounds",
          "dimension_validation",
          "vector_sanitization",
          "timeout_and_cancellation",
          "sanitized_error_mapping",
          "operation_supervisor_boundary",
          "fixture_fallback"
        ]
      : [],
    checks,
    reasons: createReasons(checks, accepted)
  };
}

function createReasons(
  checks: CoreHostLocalEmbeddingHelperEmbedPreflightChecks,
  accepted: boolean
): string[] {
  const reasons: string[] = [];

  if (!checks.compositionRootRestricted) {
    reasons.push("Helper embed work must remain rooted in apps/core-host.");
  }
  if (!checks.providerShellExplicitlyOptIn) {
    reasons.push("Runtime-backed local embedding must remain explicit opt-in.");
  }
  if (!checks.helperLifecycleImplemented) {
    reasons.push("Approved helper lifecycle wiring is required first.");
  }
  if (!checks.modelArtifactLoadImplemented) {
    reasons.push("Approved artifact verification and helper load must be implemented first.");
  }
  if (!checks.digestVerificationBeforeLoadImplemented) {
    reasons.push("Digest verification before helper load must remain implemented.");
  }
  if (!checks.runtimePythonEnvApproved) {
    reasons.push("Runtime Python environment approval evidence is required.");
  }
  if (!checks.modelDirectoryEnvApproved) {
    reasons.push("Model directory handoff approval evidence is required.");
  }
  if (!checks.approvedManifestAvailable) {
    reasons.push("Approved local embedding manifest evidence is required.");
  }
  if (!checks.helperEmbedContractReviewed) {
    reasons.push("Helper embed request and response contract review is required.");
  }
  if (!checks.sessionIdHandoffReviewed) {
    reasons.push("Loaded session identifier handoff review is required.");
  }
  if (!checks.resourceLeaseBeforeEmbedReviewed) {
    reasons.push("Resource lease before helper embed review is required.");
  }
  if (!checks.inputBatchBoundsReviewed) {
    reasons.push("Input batch bounds review is required.");
  }
  if (!checks.inputTextBoundsReviewed) {
    reasons.push("Input text bounds review is required.");
  }
  if (!checks.dimensionValidationReviewed) {
    reasons.push("Embedding dimension validation review is required.");
  }
  if (!checks.vectorSanitizationReviewed) {
    reasons.push("Embedding vector sanitization review is required.");
  }
  if (!checks.timeoutAndCancellationReviewed) {
    reasons.push("Timeout and cancellation review is required.");
  }
  if (!checks.sanitizedErrorMappingReviewed) {
    reasons.push("Sanitized error mapping review is required.");
  }
  if (!checks.operationSupervisorBoundaryReviewed) {
    reasons.push("Operation supervisor boundary review is required.");
  }
  if (!checks.fixtureFallbackPreserved) {
    reasons.push("Fixture embedding fallback preservation review is required.");
  }
  if (!checks.productApprovalRequired) {
    reasons.push("Product approval must be required before helper embed implementation.");
  }
  if (!checks.securityApprovalRequired) {
    reasons.push("Security approval must be required before helper embed implementation.");
  }
  if (!checks.productApprovalStillPending) {
    reasons.push("Product approval must remain pending in this preflight.");
  }
  if (!checks.securityApprovalStillPending) {
    reasons.push("Security approval must remain pending in this preflight.");
  }
  if (!checks.helperEmbedCallBlocked) {
    reasons.push("Helper embed calls remain blocked in this preflight.");
  }
  if (!checks.embeddingVectorReturnBlocked) {
    reasons.push("Returning embedding vectors remains blocked in this preflight.");
  }
  if (!checks.memoryVectorRoutingBlocked) {
    reasons.push("Routing vectors to Memory remains blocked.");
  }
  if (!checks.vectorPersistenceBlocked) {
    reasons.push("Persisting vectors remains blocked.");
  }
  if (!checks.vectorLogExposureBlocked) {
    reasons.push("Logging or exposing vectors remains blocked.");
  }
  if (!checks.productInferenceBlocked) {
    reasons.push("Product inference execution remains blocked.");
  }
  if (!checks.providerRegistrationUnchanged) {
    reasons.push("Provider registration behavior must not change.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Default local embedding opt-in must remain disabled.");
  }
  if (!checks.uiVisibilityUnchanged) {
    reasons.push("UI visibility must not change.");
  }
  if (!checks.rawDiagnosticsExposureBlocked) {
    reasons.push("Raw diagnostics exposure remains blocked.");
  }
  if (!checks.privatePathExposureBlocked) {
    reasons.push("Private path exposure remains blocked.");
  }
  if (!checks.signedUrlAndCredentialPersistenceBlocked) {
    reasons.push("Signed URL and credential persistence remains blocked.");
  }
  if (!checks.modelOutputShellExecutionBlocked) {
    reasons.push("Model output must not be converted into shell execution.");
  }
  if (!checks.downloadsBlocked) {
    reasons.push("Downloads remain blocked.");
  }
  if (!checks.persistentCacheWritesBlocked) {
    reasons.push("Persistent cache writes remain blocked.");
  }
  if (!checks.memorySchemaMigrationBlocked) {
    reasons.push("Memory schema migration remains blocked.");
  }
  if (!checks.verificationClean) {
    reasons.push("Clean local verification evidence is required.");
  }
  if (accepted) {
    reasons.push(
      "Helper embed preflight is ready for separate product and security approval."
    );
  }

  return reasons;
}
