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
import { LOCAL_EMBEDDING_HELPER_EMBED_DIAGNOSTIC_OPT_IN_ENV } from "./local-embedding-helper-embed-diagnostic-runner";
import {
  LOCAL_EMBEDDING_MODEL_DIR_ENV,
  LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV
} from "./local-embedding-runtime-session-factory";

export type CoreHostLocalEmbeddingProviderExecutionWiringPreflightStatus =
  | "blocked"
  | "degraded"
  | "ready_for_provider_execution_approval";

export interface CoreHostLocalEmbeddingProviderExecutionWiringPreflightInput {
  compositionRoot?: string;
  providerCompositionExplicitlyOptIn?: boolean;
  futureExecutionExplicitOptInReviewed?: boolean;
  phase738PreflightComplete?: boolean;
  phase739PreflightComplete?: boolean;
  phase740DiagnosticRunnerComplete?: boolean;
  diagnosticRunnerSeparatedFromProductPath?: boolean;
  exactCoreHostDiffReviewed?: boolean;
  sessionFactoryEmbedWiringReviewed?: boolean;
  digestVerificationBeforeEmbedReviewed?: boolean;
  helperLoadBeforeEmbedReviewed?: boolean;
  resourceLeaseLifecycleReviewed?: boolean;
  requestValidationBoundaryReviewed?: boolean;
  embeddingResultSchemaBoundaryReviewed?: boolean;
  vectorShapeAndFiniteValueValidationReviewed?: boolean;
  vectorRedactionFromLogsReviewed?: boolean;
  timeoutCancellationAndReleaseReviewed?: boolean;
  sanitizedErrorMappingReviewed?: boolean;
  operationSupervisorBoundaryReviewed?: boolean;
  fixtureFallbackPreserved?: boolean;
  startupRestartRollbackSmokePlanned?: boolean;
  productApprovalRequired?: boolean;
  securityApprovalRequired?: boolean;
  verificationClean?: boolean;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  providerExecutionEnabled?: boolean;
  sessionFactoryEmbedEnabled?: boolean;
  helperEmbedCalled?: boolean;
  embeddingVectorsReturnedToProduct?: boolean;
  vectorsRoutedToMemory?: boolean;
  vectorsPersisted?: boolean;
  vectorsLoggedOrExposed?: boolean;
  memorySchemaMigrationEnabled?: boolean;
  providerRegistrationChanged?: boolean;
  defaultOptInEnabled?: boolean;
  uiVisibilityChanged?: boolean;
  downloadsEnabled?: boolean;
  persistentCacheWritesEnabled?: boolean;
  diagnosticOptInReusedForProductExecution?: boolean;
  modelArtifactAccessedDuringPreflight?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathExposureEnabled?: boolean;
  signedUrlOrCredentialPersistenceEnabled?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface CoreHostLocalEmbeddingProviderExecutionWiringPreflightChecks {
  compositionRootRestricted: boolean;
  providerCompositionExplicitlyOptIn: boolean;
  futureExecutionExplicitOptInReviewed: boolean;
  phase738PreflightComplete: boolean;
  phase739PreflightComplete: boolean;
  phase740DiagnosticRunnerComplete: boolean;
  diagnosticRunnerSeparatedFromProductPath: boolean;
  exactCoreHostDiffReviewed: boolean;
  sessionFactoryEmbedWiringReviewed: boolean;
  digestVerificationBeforeEmbedReviewed: boolean;
  helperLoadBeforeEmbedReviewed: boolean;
  resourceLeaseLifecycleReviewed: boolean;
  requestValidationBoundaryReviewed: boolean;
  embeddingResultSchemaBoundaryReviewed: boolean;
  vectorShapeAndFiniteValueValidationReviewed: boolean;
  vectorRedactionFromLogsReviewed: boolean;
  timeoutCancellationAndReleaseReviewed: boolean;
  sanitizedErrorMappingReviewed: boolean;
  operationSupervisorBoundaryReviewed: boolean;
  fixtureFallbackPreserved: boolean;
  startupRestartRollbackSmokePlanned: boolean;
  productApprovalRequired: boolean;
  securityApprovalRequired: boolean;
  productApprovalStillPending: boolean;
  securityApprovalStillPending: boolean;
  providerExecutionBlocked: boolean;
  sessionFactoryEmbedBlocked: boolean;
  helperEmbedCallBlocked: boolean;
  productVectorReturnBlocked: boolean;
  memoryVectorRoutingBlocked: boolean;
  vectorPersistenceBlocked: boolean;
  vectorLogExposureBlocked: boolean;
  memorySchemaMigrationBlocked: boolean;
  providerRegistrationUnchanged: boolean;
  defaultOptInDisabled: boolean;
  uiVisibilityUnchanged: boolean;
  downloadsBlocked: boolean;
  persistentCacheWritesBlocked: boolean;
  diagnosticOptInNotReusedForProductExecution: boolean;
  modelArtifactAccessDuringPreflightBlocked: boolean;
  rawDiagnosticsExposureBlocked: boolean;
  privatePathExposureBlocked: boolean;
  signedUrlAndCredentialPersistenceBlocked: boolean;
  modelOutputShellExecutionBlocked: boolean;
  verificationClean: boolean;
}

export interface CoreHostLocalEmbeddingProviderExecutionWiringPreflightResult {
  provider: string;
  modelId: string;
  runtime: typeof TRANSFORMERS_LOCAL_RUNTIME;
  runtimePackageName: string;
  compositionRoot: string;
  providerOptInEnvKey: string;
  providerExecutionOptInEnvKey: string;
  diagnosticOptInEnvKey: string;
  runtimePythonEnvKey: string;
  modelDirectoryEnvKey: string;
  status: CoreHostLocalEmbeddingProviderExecutionWiringPreflightStatus;
  accepted: boolean;
  readyForProviderExecutionApproval: boolean;
  preflightOnly: true;
  productApprovalRequired: true;
  securityApprovalRequired: true;
  productApprovalGranted: false;
  securityApprovalGranted: false;
  providerExecutionEnabled: false;
  sessionFactoryEmbedEnabled: false;
  helperEmbedCalled: false;
  embeddingVectorsReturnedToProduct: false;
  vectorsRoutedToMemory: false;
  vectorsPersisted: false;
  vectorsLoggedOrExposed: false;
  memorySchemaMigrationEnabled: false;
  providerRegistrationChanged: false;
  defaultOptInEnabled: false;
  uiVisibilityChanged: false;
  downloadsEnabled: false;
  persistentCacheWritesEnabled: false;
  diagnosticOptInReusedForProductExecution: false;
  modelArtifactAccessedDuringPreflight: false;
  rawDiagnosticsExposed: false;
  privatePathExposureEnabled: false;
  signedUrlOrCredentialPersistenceEnabled: false;
  modelOutputShellExecutionEnabled: false;
  reviewedAreas: string[];
  checks: CoreHostLocalEmbeddingProviderExecutionWiringPreflightChecks;
  reasons: string[];
}

export function evaluateCoreHostLocalEmbeddingProviderExecutionWiringPreflight(
  input: CoreHostLocalEmbeddingProviderExecutionWiringPreflightInput = {}
): CoreHostLocalEmbeddingProviderExecutionWiringPreflightResult {
  const checks: CoreHostLocalEmbeddingProviderExecutionWiringPreflightChecks = {
    compositionRootRestricted:
      input.compositionRoot === TRANSFORMERS_LOCAL_RUNTIME_COMPOSITION_ROOT,
    providerCompositionExplicitlyOptIn:
      input.providerCompositionExplicitlyOptIn === true,
    futureExecutionExplicitOptInReviewed:
      input.futureExecutionExplicitOptInReviewed === true,
    phase738PreflightComplete: input.phase738PreflightComplete === true,
    phase739PreflightComplete: input.phase739PreflightComplete === true,
    phase740DiagnosticRunnerComplete:
      input.phase740DiagnosticRunnerComplete === true,
    diagnosticRunnerSeparatedFromProductPath:
      input.diagnosticRunnerSeparatedFromProductPath === true,
    exactCoreHostDiffReviewed: input.exactCoreHostDiffReviewed === true,
    sessionFactoryEmbedWiringReviewed:
      input.sessionFactoryEmbedWiringReviewed === true,
    digestVerificationBeforeEmbedReviewed:
      input.digestVerificationBeforeEmbedReviewed === true,
    helperLoadBeforeEmbedReviewed:
      input.helperLoadBeforeEmbedReviewed === true,
    resourceLeaseLifecycleReviewed:
      input.resourceLeaseLifecycleReviewed === true,
    requestValidationBoundaryReviewed:
      input.requestValidationBoundaryReviewed === true,
    embeddingResultSchemaBoundaryReviewed:
      input.embeddingResultSchemaBoundaryReviewed === true,
    vectorShapeAndFiniteValueValidationReviewed:
      input.vectorShapeAndFiniteValueValidationReviewed === true,
    vectorRedactionFromLogsReviewed:
      input.vectorRedactionFromLogsReviewed === true,
    timeoutCancellationAndReleaseReviewed:
      input.timeoutCancellationAndReleaseReviewed === true,
    sanitizedErrorMappingReviewed:
      input.sanitizedErrorMappingReviewed === true,
    operationSupervisorBoundaryReviewed:
      input.operationSupervisorBoundaryReviewed === true,
    fixtureFallbackPreserved: input.fixtureFallbackPreserved === true,
    startupRestartRollbackSmokePlanned:
      input.startupRestartRollbackSmokePlanned === true,
    productApprovalRequired: input.productApprovalRequired === true,
    securityApprovalRequired: input.securityApprovalRequired === true,
    productApprovalStillPending: input.productApprovalGranted === false,
    securityApprovalStillPending: input.securityApprovalGranted === false,
    providerExecutionBlocked: input.providerExecutionEnabled === false,
    sessionFactoryEmbedBlocked: input.sessionFactoryEmbedEnabled === false,
    helperEmbedCallBlocked: input.helperEmbedCalled === false,
    productVectorReturnBlocked:
      input.embeddingVectorsReturnedToProduct === false,
    memoryVectorRoutingBlocked: input.vectorsRoutedToMemory === false,
    vectorPersistenceBlocked: input.vectorsPersisted === false,
    vectorLogExposureBlocked: input.vectorsLoggedOrExposed === false,
    memorySchemaMigrationBlocked:
      input.memorySchemaMigrationEnabled === false,
    providerRegistrationUnchanged:
      input.providerRegistrationChanged === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false,
    uiVisibilityUnchanged: input.uiVisibilityChanged === false,
    downloadsBlocked: input.downloadsEnabled === false,
    persistentCacheWritesBlocked:
      input.persistentCacheWritesEnabled === false,
    diagnosticOptInNotReusedForProductExecution:
      input.diagnosticOptInReusedForProductExecution === false,
    modelArtifactAccessDuringPreflightBlocked:
      input.modelArtifactAccessedDuringPreflight === false,
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
    checks.providerCompositionExplicitlyOptIn &&
    checks.futureExecutionExplicitOptInReviewed &&
    checks.phase738PreflightComplete &&
    checks.phase739PreflightComplete &&
    checks.phase740DiagnosticRunnerComplete &&
    checks.diagnosticRunnerSeparatedFromProductPath &&
    checks.exactCoreHostDiffReviewed &&
    checks.sessionFactoryEmbedWiringReviewed &&
    checks.digestVerificationBeforeEmbedReviewed &&
    checks.helperLoadBeforeEmbedReviewed &&
    checks.resourceLeaseLifecycleReviewed &&
    checks.requestValidationBoundaryReviewed &&
    checks.embeddingResultSchemaBoundaryReviewed &&
    checks.vectorShapeAndFiniteValueValidationReviewed &&
    checks.vectorRedactionFromLogsReviewed &&
    checks.timeoutCancellationAndReleaseReviewed &&
    checks.sanitizedErrorMappingReviewed &&
    checks.operationSupervisorBoundaryReviewed &&
    checks.fixtureFallbackPreserved &&
    checks.startupRestartRollbackSmokePlanned &&
    checks.productApprovalRequired &&
    checks.securityApprovalRequired &&
    checks.productApprovalStillPending &&
    checks.securityApprovalStillPending &&
    checks.verificationClean;
  const sideEffectsBlocked =
    checks.providerExecutionBlocked &&
    checks.sessionFactoryEmbedBlocked &&
    checks.helperEmbedCallBlocked &&
    checks.productVectorReturnBlocked &&
    checks.memoryVectorRoutingBlocked &&
    checks.vectorPersistenceBlocked &&
    checks.vectorLogExposureBlocked &&
    checks.memorySchemaMigrationBlocked &&
    checks.providerRegistrationUnchanged &&
    checks.defaultOptInDisabled &&
    checks.uiVisibilityUnchanged &&
    checks.downloadsBlocked &&
    checks.persistentCacheWritesBlocked &&
    checks.diagnosticOptInNotReusedForProductExecution &&
    checks.modelArtifactAccessDuringPreflightBlocked &&
    checks.rawDiagnosticsExposureBlocked &&
    checks.privatePathExposureBlocked &&
    checks.signedUrlAndCredentialPersistenceBlocked &&
    checks.modelOutputShellExecutionBlocked;
  const accepted = requiredEvidenceComplete && sideEffectsBlocked;
  const status: CoreHostLocalEmbeddingProviderExecutionWiringPreflightStatus =
    accepted
      ? "ready_for_provider_execution_approval"
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
    providerExecutionOptInEnvKey:
      LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
    diagnosticOptInEnvKey:
      LOCAL_EMBEDDING_HELPER_EMBED_DIAGNOSTIC_OPT_IN_ENV,
    runtimePythonEnvKey: LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
    modelDirectoryEnvKey: LOCAL_EMBEDDING_MODEL_DIR_ENV,
    status,
    accepted,
    readyForProviderExecutionApproval: accepted,
    preflightOnly: true,
    productApprovalRequired: true,
    securityApprovalRequired: true,
    productApprovalGranted: false,
    securityApprovalGranted: false,
    providerExecutionEnabled: false,
    sessionFactoryEmbedEnabled: false,
    helperEmbedCalled: false,
    embeddingVectorsReturnedToProduct: false,
    vectorsRoutedToMemory: false,
    vectorsPersisted: false,
    vectorsLoggedOrExposed: false,
    memorySchemaMigrationEnabled: false,
    providerRegistrationChanged: false,
    defaultOptInEnabled: false,
    uiVisibilityChanged: false,
    downloadsEnabled: false,
    persistentCacheWritesEnabled: false,
    diagnosticOptInReusedForProductExecution: false,
    modelArtifactAccessedDuringPreflight: false,
    rawDiagnosticsExposed: false,
    privatePathExposureEnabled: false,
    signedUrlOrCredentialPersistenceEnabled: false,
    modelOutputShellExecutionEnabled: false,
    reviewedAreas: accepted
      ? [
          "future_execution_opt_in",
          "exact_core_host_diff",
          "session_factory_embed_wiring",
          "digest_verification_before_embed",
          "helper_load_before_embed",
          "resource_lease_lifecycle",
          "request_validation_boundary",
          "embedding_result_schema_boundary",
          "vector_shape_and_finite_value_validation",
          "vector_redaction_from_logs",
          "timeout_cancellation_and_release",
          "sanitized_error_mapping",
          "operation_supervisor_boundary",
          "fixture_fallback",
          "startup_restart_rollback_smoke"
        ]
      : [],
    checks,
    reasons: createReasons(checks, accepted)
  };
}

function createReasons(
  checks: CoreHostLocalEmbeddingProviderExecutionWiringPreflightChecks,
  accepted: boolean
): string[] {
  const reasons: string[] = [];

  if (!checks.compositionRootRestricted) {
    reasons.push("Provider execution wiring must remain rooted in apps/core-host.");
  }
  if (!checks.providerCompositionExplicitlyOptIn) {
    reasons.push("Runtime-backed local embedding composition must remain explicit opt-in.");
  }
  if (!checks.futureExecutionExplicitOptInReviewed) {
    reasons.push("Future provider execution must have a separate explicit opt-in review.");
  }
  if (!checks.phase738PreflightComplete) {
    reasons.push("Phase 7.38 helper embed preflight must be complete first.");
  }
  if (!checks.phase739PreflightComplete) {
    reasons.push("Phase 7.39 diagnostic harness preflight must be complete first.");
  }
  if (!checks.phase740DiagnosticRunnerComplete) {
    reasons.push("Phase 7.40 diagnostic runner must be complete first.");
  }
  if (!checks.diagnosticRunnerSeparatedFromProductPath) {
    reasons.push("Diagnostic runner must remain separated from product execution.");
  }
  if (!checks.exactCoreHostDiffReviewed) {
    reasons.push("Exact Core Host provider execution diff review is required.");
  }
  if (!checks.sessionFactoryEmbedWiringReviewed) {
    reasons.push("Session factory embed wiring review is required.");
  }
  if (!checks.digestVerificationBeforeEmbedReviewed) {
    reasons.push("Digest verification before provider embed review is required.");
  }
  if (!checks.helperLoadBeforeEmbedReviewed) {
    reasons.push("Helper load before provider embed review is required.");
  }
  if (!checks.resourceLeaseLifecycleReviewed) {
    reasons.push("Resource lease lifecycle review is required.");
  }
  if (!checks.requestValidationBoundaryReviewed) {
    reasons.push("Request validation boundary review is required.");
  }
  if (!checks.embeddingResultSchemaBoundaryReviewed) {
    reasons.push("Embedding result schema boundary review is required.");
  }
  if (!checks.vectorShapeAndFiniteValueValidationReviewed) {
    reasons.push("Vector shape and finite value validation review is required.");
  }
  if (!checks.vectorRedactionFromLogsReviewed) {
    reasons.push("Vector redaction from logs review is required.");
  }
  if (!checks.timeoutCancellationAndReleaseReviewed) {
    reasons.push("Timeout, cancellation, and release review is required.");
  }
  if (!checks.sanitizedErrorMappingReviewed) {
    reasons.push("Sanitized error mapping review is required.");
  }
  if (!checks.operationSupervisorBoundaryReviewed) {
    reasons.push("Operation supervisor boundary review is required.");
  }
  if (!checks.fixtureFallbackPreserved) {
    reasons.push("Fixture fallback preservation review is required.");
  }
  if (!checks.startupRestartRollbackSmokePlanned) {
    reasons.push("Startup, restart, rollback, and desktop smoke planning is required.");
  }
  if (!checks.productApprovalRequired) {
    reasons.push("Product approval must be required before provider execution wiring.");
  }
  if (!checks.securityApprovalRequired) {
    reasons.push("Security approval must be required before provider execution wiring.");
  }
  if (!checks.productApprovalStillPending) {
    reasons.push("Product approval must remain pending in this preflight.");
  }
  if (!checks.securityApprovalStillPending) {
    reasons.push("Security approval must remain pending in this preflight.");
  }
  if (!checks.providerExecutionBlocked) {
    reasons.push("Provider execution remains blocked in this preflight.");
  }
  if (!checks.sessionFactoryEmbedBlocked) {
    reasons.push("Session factory embed remains blocked in this preflight.");
  }
  if (!checks.helperEmbedCallBlocked) {
    reasons.push("Helper embed calls remain blocked in this preflight.");
  }
  if (!checks.productVectorReturnBlocked) {
    reasons.push("Returning embedding vectors to product flows remains blocked.");
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
  if (!checks.memorySchemaMigrationBlocked) {
    reasons.push("Memory schema migration remains blocked.");
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
  if (!checks.downloadsBlocked) {
    reasons.push("Downloads remain blocked.");
  }
  if (!checks.persistentCacheWritesBlocked) {
    reasons.push("Persistent cache writes remain blocked.");
  }
  if (!checks.diagnosticOptInNotReusedForProductExecution) {
    reasons.push("Diagnostic opt-in must not be reused for product execution.");
  }
  if (!checks.modelArtifactAccessDuringPreflightBlocked) {
    reasons.push("Model artifact access remains blocked during this preflight.");
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
  if (!checks.verificationClean) {
    reasons.push("Clean local verification evidence is required.");
  }
  if (accepted) {
    reasons.push(
      "Provider execution wiring preflight is ready for separate product and security approval."
    );
  }

  return reasons;
}
