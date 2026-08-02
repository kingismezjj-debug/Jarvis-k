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

export type CoreHostLocalEmbeddingHelperEmbedDiagnosticPreflightStatus =
  | "blocked"
  | "degraded"
  | "ready_for_diagnostic_harness_approval";

export interface CoreHostLocalEmbeddingHelperEmbedDiagnosticPreflightInput {
  compositionRoot?: string;
  providerShellExplicitlyOptIn?: boolean;
  phase738PreflightComplete?: boolean;
  diagnosticHarnessScopeReviewed?: boolean;
  fixtureTransportOnly?: boolean;
  sanitizedReportSchemaReviewed?: boolean;
  boundedCasePlanReviewed?: boolean;
  rawInputTextRedactionReviewed?: boolean;
  vectorValueRedactionReviewed?: boolean;
  failureReasonCodesReviewed?: boolean;
  cleanupAndReleaseReviewed?: boolean;
  productApprovalRequired?: boolean;
  securityApprovalRequired?: boolean;
  verificationClean?: boolean;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  helperEmbedCalled?: boolean;
  realEmbeddingVectorsReturned?: boolean;
  rawInputTextPersisted?: boolean;
  vectorValuesPersistedOrLogged?: boolean;
  modelArtifactAccessed?: boolean;
  downloadsEnabled?: boolean;
  persistentCacheWritesEnabled?: boolean;
  productInferenceEnabled?: boolean;
  vectorsRoutedToMemory?: boolean;
  memorySchemaMigrationEnabled?: boolean;
  providerRegistrationChanged?: boolean;
  defaultOptInEnabled?: boolean;
  uiVisibilityChanged?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathExposureEnabled?: boolean;
  signedUrlOrCredentialPersistenceEnabled?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
}

export interface CoreHostLocalEmbeddingHelperEmbedDiagnosticPreflightChecks {
  compositionRootRestricted: boolean;
  providerShellExplicitlyOptIn: boolean;
  phase738PreflightComplete: boolean;
  diagnosticHarnessScopeReviewed: boolean;
  fixtureTransportOnly: boolean;
  sanitizedReportSchemaReviewed: boolean;
  boundedCasePlanReviewed: boolean;
  rawInputTextRedactionReviewed: boolean;
  vectorValueRedactionReviewed: boolean;
  failureReasonCodesReviewed: boolean;
  cleanupAndReleaseReviewed: boolean;
  productApprovalRequired: boolean;
  securityApprovalRequired: boolean;
  productApprovalStillPending: boolean;
  securityApprovalStillPending: boolean;
  helperEmbedCallBlocked: boolean;
  realVectorReturnBlocked: boolean;
  rawInputTextPersistenceBlocked: boolean;
  vectorPersistenceOrLogBlocked: boolean;
  modelArtifactAccessBlocked: boolean;
  downloadsBlocked: boolean;
  persistentCacheWritesBlocked: boolean;
  productInferenceBlocked: boolean;
  memoryVectorRoutingBlocked: boolean;
  memorySchemaMigrationBlocked: boolean;
  providerRegistrationUnchanged: boolean;
  defaultOptInDisabled: boolean;
  uiVisibilityUnchanged: boolean;
  rawDiagnosticsExposureBlocked: boolean;
  privatePathExposureBlocked: boolean;
  signedUrlAndCredentialPersistenceBlocked: boolean;
  modelOutputShellExecutionBlocked: boolean;
  verificationClean: boolean;
}

export interface CoreHostLocalEmbeddingHelperEmbedDiagnosticPreflightResult {
  provider: string;
  modelId: string;
  runtime: typeof TRANSFORMERS_LOCAL_RUNTIME;
  runtimePackageName: string;
  compositionRoot: string;
  providerOptInEnvKey: string;
  runtimePythonEnvKey: string;
  modelDirectoryEnvKey: string;
  status: CoreHostLocalEmbeddingHelperEmbedDiagnosticPreflightStatus;
  accepted: boolean;
  readyForDiagnosticHarnessApproval: boolean;
  preflightOnly: true;
  productApprovalRequired: true;
  securityApprovalRequired: true;
  productApprovalGranted: false;
  securityApprovalGranted: false;
  helperEmbedCalled: false;
  realEmbeddingVectorsReturned: false;
  rawInputTextPersisted: false;
  vectorValuesPersistedOrLogged: false;
  modelArtifactAccessed: false;
  downloadsEnabled: false;
  persistentCacheWritesEnabled: false;
  productInferenceEnabled: false;
  vectorsRoutedToMemory: false;
  memorySchemaMigrationEnabled: false;
  providerRegistrationChanged: false;
  defaultOptInEnabled: false;
  uiVisibilityChanged: false;
  rawDiagnosticsExposed: false;
  privatePathExposureEnabled: false;
  signedUrlOrCredentialPersistenceEnabled: false;
  modelOutputShellExecutionEnabled: false;
  diagnosticReportShape: {
    mode: "preflight_only";
    sanitized: true;
    rawInputsExposed: false;
    vectorValuesExposed: false;
    privatePathsExposed: false;
    resultFields: readonly string[];
  };
  reviewedAreas: string[];
  checks: CoreHostLocalEmbeddingHelperEmbedDiagnosticPreflightChecks;
  reasons: string[];
}

export function evaluateCoreHostLocalEmbeddingHelperEmbedDiagnosticPreflight(
  input: CoreHostLocalEmbeddingHelperEmbedDiagnosticPreflightInput = {}
): CoreHostLocalEmbeddingHelperEmbedDiagnosticPreflightResult {
  const checks: CoreHostLocalEmbeddingHelperEmbedDiagnosticPreflightChecks = {
    compositionRootRestricted:
      input.compositionRoot === TRANSFORMERS_LOCAL_RUNTIME_COMPOSITION_ROOT,
    providerShellExplicitlyOptIn:
      input.providerShellExplicitlyOptIn === true,
    phase738PreflightComplete: input.phase738PreflightComplete === true,
    diagnosticHarnessScopeReviewed:
      input.diagnosticHarnessScopeReviewed === true,
    fixtureTransportOnly: input.fixtureTransportOnly === true,
    sanitizedReportSchemaReviewed:
      input.sanitizedReportSchemaReviewed === true,
    boundedCasePlanReviewed: input.boundedCasePlanReviewed === true,
    rawInputTextRedactionReviewed:
      input.rawInputTextRedactionReviewed === true,
    vectorValueRedactionReviewed:
      input.vectorValueRedactionReviewed === true,
    failureReasonCodesReviewed:
      input.failureReasonCodesReviewed === true,
    cleanupAndReleaseReviewed: input.cleanupAndReleaseReviewed === true,
    productApprovalRequired: input.productApprovalRequired === true,
    securityApprovalRequired: input.securityApprovalRequired === true,
    productApprovalStillPending: input.productApprovalGranted === false,
    securityApprovalStillPending: input.securityApprovalGranted === false,
    helperEmbedCallBlocked: input.helperEmbedCalled === false,
    realVectorReturnBlocked:
      input.realEmbeddingVectorsReturned === false,
    rawInputTextPersistenceBlocked:
      input.rawInputTextPersisted === false,
    vectorPersistenceOrLogBlocked:
      input.vectorValuesPersistedOrLogged === false,
    modelArtifactAccessBlocked: input.modelArtifactAccessed === false,
    downloadsBlocked: input.downloadsEnabled === false,
    persistentCacheWritesBlocked:
      input.persistentCacheWritesEnabled === false,
    productInferenceBlocked: input.productInferenceEnabled === false,
    memoryVectorRoutingBlocked: input.vectorsRoutedToMemory === false,
    memorySchemaMigrationBlocked:
      input.memorySchemaMigrationEnabled === false,
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
    checks.phase738PreflightComplete &&
    checks.diagnosticHarnessScopeReviewed &&
    checks.fixtureTransportOnly &&
    checks.sanitizedReportSchemaReviewed &&
    checks.boundedCasePlanReviewed &&
    checks.rawInputTextRedactionReviewed &&
    checks.vectorValueRedactionReviewed &&
    checks.failureReasonCodesReviewed &&
    checks.cleanupAndReleaseReviewed &&
    checks.productApprovalRequired &&
    checks.securityApprovalRequired &&
    checks.productApprovalStillPending &&
    checks.securityApprovalStillPending &&
    checks.verificationClean;
  const sideEffectsBlocked =
    checks.helperEmbedCallBlocked &&
    checks.realVectorReturnBlocked &&
    checks.rawInputTextPersistenceBlocked &&
    checks.vectorPersistenceOrLogBlocked &&
    checks.modelArtifactAccessBlocked &&
    checks.downloadsBlocked &&
    checks.persistentCacheWritesBlocked &&
    checks.productInferenceBlocked &&
    checks.memoryVectorRoutingBlocked &&
    checks.memorySchemaMigrationBlocked &&
    checks.providerRegistrationUnchanged &&
    checks.defaultOptInDisabled &&
    checks.uiVisibilityUnchanged &&
    checks.rawDiagnosticsExposureBlocked &&
    checks.privatePathExposureBlocked &&
    checks.signedUrlAndCredentialPersistenceBlocked &&
    checks.modelOutputShellExecutionBlocked;
  const accepted = requiredEvidenceComplete && sideEffectsBlocked;
  const status: CoreHostLocalEmbeddingHelperEmbedDiagnosticPreflightStatus =
    accepted
      ? "ready_for_diagnostic_harness_approval"
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
    readyForDiagnosticHarnessApproval: accepted,
    preflightOnly: true,
    productApprovalRequired: true,
    securityApprovalRequired: true,
    productApprovalGranted: false,
    securityApprovalGranted: false,
    helperEmbedCalled: false,
    realEmbeddingVectorsReturned: false,
    rawInputTextPersisted: false,
    vectorValuesPersistedOrLogged: false,
    modelArtifactAccessed: false,
    downloadsEnabled: false,
    persistentCacheWritesEnabled: false,
    productInferenceEnabled: false,
    vectorsRoutedToMemory: false,
    memorySchemaMigrationEnabled: false,
    providerRegistrationChanged: false,
    defaultOptInEnabled: false,
    uiVisibilityChanged: false,
    rawDiagnosticsExposed: false,
    privatePathExposureEnabled: false,
    signedUrlOrCredentialPersistenceEnabled: false,
    modelOutputShellExecutionEnabled: false,
    diagnosticReportShape: {
      mode: "preflight_only",
      sanitized: true,
      rawInputsExposed: false,
      vectorValuesExposed: false,
      privatePathsExposed: false,
      resultFields: [
        "caseCount",
        "passedCount",
        "degradedCount",
        "failedCount",
        "reasonCodes",
        "cleanupStatus"
      ]
    },
    reviewedAreas: accepted
      ? [
          "diagnostic_harness_scope",
          "fixture_transport_only",
          "sanitized_report_schema",
          "bounded_case_plan",
          "raw_input_redaction",
          "vector_value_redaction",
          "failure_reason_codes",
          "cleanup_and_release"
        ]
      : [],
    checks,
    reasons: createReasons(checks, accepted)
  };
}

function createReasons(
  checks: CoreHostLocalEmbeddingHelperEmbedDiagnosticPreflightChecks,
  accepted: boolean
): string[] {
  const reasons: string[] = [];

  if (!checks.compositionRootRestricted) {
    reasons.push("Diagnostic harness preparation must remain rooted in apps/core-host.");
  }
  if (!checks.providerShellExplicitlyOptIn) {
    reasons.push("Runtime-backed local embedding must remain explicit opt-in.");
  }
  if (!checks.phase738PreflightComplete) {
    reasons.push("Phase 7.38 helper embed preflight must be complete first.");
  }
  if (!checks.diagnosticHarnessScopeReviewed) {
    reasons.push("Diagnostic harness scope review is required.");
  }
  if (!checks.fixtureTransportOnly) {
    reasons.push("This preparation wave may use fixture transport only.");
  }
  if (!checks.sanitizedReportSchemaReviewed) {
    reasons.push("Sanitized diagnostic report schema review is required.");
  }
  if (!checks.boundedCasePlanReviewed) {
    reasons.push("Bounded diagnostic case plan review is required.");
  }
  if (!checks.rawInputTextRedactionReviewed) {
    reasons.push("Raw input text redaction review is required.");
  }
  if (!checks.vectorValueRedactionReviewed) {
    reasons.push("Vector value redaction review is required.");
  }
  if (!checks.failureReasonCodesReviewed) {
    reasons.push("Failure reason code review is required.");
  }
  if (!checks.cleanupAndReleaseReviewed) {
    reasons.push("Cleanup and resource release review is required.");
  }
  if (!checks.productApprovalRequired) {
    reasons.push("Product approval must be required before real diagnostic embed execution.");
  }
  if (!checks.securityApprovalRequired) {
    reasons.push("Security approval must be required before real diagnostic embed execution.");
  }
  if (!checks.productApprovalStillPending) {
    reasons.push("Product approval must remain pending in this preflight.");
  }
  if (!checks.securityApprovalStillPending) {
    reasons.push("Security approval must remain pending in this preflight.");
  }
  if (!checks.helperEmbedCallBlocked) {
    reasons.push("Helper embed calls remain blocked in this diagnostic preflight.");
  }
  if (!checks.realVectorReturnBlocked) {
    reasons.push("Returning real embedding vectors remains blocked.");
  }
  if (!checks.rawInputTextPersistenceBlocked) {
    reasons.push("Persisting raw input text remains blocked.");
  }
  if (!checks.vectorPersistenceOrLogBlocked) {
    reasons.push("Persisting or logging vector values remains blocked.");
  }
  if (!checks.modelArtifactAccessBlocked) {
    reasons.push("Model artifact access remains blocked in this preparation wave.");
  }
  if (!checks.downloadsBlocked) {
    reasons.push("Downloads remain blocked.");
  }
  if (!checks.persistentCacheWritesBlocked) {
    reasons.push("Persistent cache writes remain blocked.");
  }
  if (!checks.productInferenceBlocked) {
    reasons.push("Product inference remains blocked.");
  }
  if (!checks.memoryVectorRoutingBlocked) {
    reasons.push("Routing vectors to Memory remains blocked.");
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
      "Helper embed diagnostic harness preflight is ready for separate product and security approval."
    );
  }

  return reasons;
}
