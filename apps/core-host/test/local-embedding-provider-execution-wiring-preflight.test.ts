import { describe, expect, it } from "vitest";
import { evaluateCoreHostLocalEmbeddingProviderExecutionWiringPreflight } from "../src/local-embedding-provider-execution-wiring-preflight";
import { LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV } from "../src/local-embedding-runtime-session-factory";

describe("Core Host local embedding provider execution wiring preflight", () => {
  it("accepts complete review evidence without enabling provider execution", () => {
    const result =
      evaluateCoreHostLocalEmbeddingProviderExecutionWiringPreflight(
        approvedPreflightInput()
      );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      provider: "embedding.local.qwen3",
      modelId: "Qwen/Qwen3-Embedding-0.6B",
      runtime: "transformers",
      runtimePackageName: "@jarvis-k/inference-runtime-transformers-local",
      compositionRoot: "apps/core-host",
      providerOptInEnvKey: "JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER",
      providerExecutionOptInEnvKey:
        LOCAL_EMBEDDING_PROVIDER_EXECUTION_OPT_IN_ENV,
      diagnosticOptInEnvKey:
        "JARVIS_K_ENABLE_LOCAL_EMBEDDING_EMBED_DIAGNOSTIC",
      runtimePythonEnvKey: "JARVIS_K_RUNTIME_PYTHON",
      modelDirectoryEnvKey: "JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR",
      status: "ready_for_provider_execution_approval",
      accepted: true,
      readyForProviderExecutionApproval: true,
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
      reviewedAreas: [
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
      ],
      reasons: [
        "Provider execution wiring preflight is ready for separate product and security approval."
      ]
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades when provider execution wiring evidence is incomplete while side effects remain blocked", () => {
    const result =
      evaluateCoreHostLocalEmbeddingProviderExecutionWiringPreflight({
        ...approvedPreflightInput(),
        exactCoreHostDiffReviewed: false,
        sessionFactoryEmbedWiringReviewed: false,
        verificationClean: false
      });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForProviderExecutionApproval: false,
      providerExecutionEnabled: false,
      sessionFactoryEmbedEnabled: false,
      reviewedAreas: [],
      checks: {
        exactCoreHostDiffReviewed: false,
        sessionFactoryEmbedWiringReviewed: false,
        verificationClean: false,
        providerExecutionBlocked: true,
        sessionFactoryEmbedBlocked: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Exact Core Host provider execution diff review is required.",
        "Session factory embed wiring review is required.",
        "Clean local verification evidence is required."
      ])
    );
  });

  it("blocks provider execution, helper embed, vectors, Memory routing, persistence, and migration", () => {
    const result =
      evaluateCoreHostLocalEmbeddingProviderExecutionWiringPreflight({
        ...approvedPreflightInput(),
        providerExecutionEnabled: true,
        sessionFactoryEmbedEnabled: true,
        helperEmbedCalled: true,
        embeddingVectorsReturnedToProduct: true,
        vectorsRoutedToMemory: true,
        vectorsPersisted: true,
        vectorsLoggedOrExposed: true,
        memorySchemaMigrationEnabled: true
      });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForProviderExecutionApproval: false,
      providerExecutionEnabled: false,
      sessionFactoryEmbedEnabled: false,
      helperEmbedCalled: false,
      embeddingVectorsReturnedToProduct: false,
      vectorsRoutedToMemory: false,
      vectorsPersisted: false,
      vectorsLoggedOrExposed: false,
      memorySchemaMigrationEnabled: false,
      reviewedAreas: []
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Provider execution remains blocked in this preflight.",
        "Session factory embed remains blocked in this preflight.",
        "Helper embed calls remain blocked in this preflight.",
        "Returning embedding vectors to product flows remains blocked.",
        "Routing vectors to Memory remains blocked.",
        "Persisting vectors remains blocked.",
        "Logging or exposing vectors remains blocked.",
        "Memory schema migration remains blocked."
      ])
    );
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks approval, visibility, diagnostics, cache, artifact, product opt-in, and shell regressions", () => {
    const result =
      evaluateCoreHostLocalEmbeddingProviderExecutionWiringPreflight({
        ...approvedPreflightInput(),
        productApprovalGranted: true,
        securityApprovalGranted: true,
        providerRegistrationChanged: true,
        defaultOptInEnabled: true,
        uiVisibilityChanged: true,
        downloadsEnabled: true,
        persistentCacheWritesEnabled: true,
        diagnosticOptInReusedForProductExecution: true,
        modelArtifactAccessedDuringPreflight: true,
        rawDiagnosticsExposed: true,
        privatePathExposureEnabled: true,
        signedUrlOrCredentialPersistenceEnabled: true,
        modelOutputShellExecutionEnabled: true
      });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      productApprovalGranted: false,
      securityApprovalGranted: false,
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
      checks: {
        productApprovalStillPending: false,
        securityApprovalStillPending: false,
        providerRegistrationUnchanged: false,
        defaultOptInDisabled: false,
        uiVisibilityUnchanged: false,
        downloadsBlocked: false,
        persistentCacheWritesBlocked: false,
        diagnosticOptInNotReusedForProductExecution: false,
        modelArtifactAccessDuringPreflightBlocked: false,
        rawDiagnosticsExposureBlocked: false,
        privatePathExposureBlocked: false,
        signedUrlAndCredentialPersistenceBlocked: false,
        modelOutputShellExecutionBlocked: false
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Product approval must remain pending in this preflight.",
        "Security approval must remain pending in this preflight.",
        "Provider registration behavior must not change.",
        "Default local embedding opt-in must remain disabled.",
        "UI visibility must not change.",
        "Downloads remain blocked.",
        "Persistent cache writes remain blocked.",
        "Diagnostic opt-in must not be reused for product execution.",
        "Model artifact access remains blocked during this preflight.",
        "Raw diagnostics exposure remains blocked.",
        "Private path exposure remains blocked.",
        "Signed URL and credential persistence remains blocked.",
        "Model output must not be converted into shell execution."
      ])
    );
  });
});

function approvedPreflightInput() {
  return {
    compositionRoot: "apps/core-host",
    providerCompositionExplicitlyOptIn: true,
    futureExecutionExplicitOptInReviewed: true,
    phase738PreflightComplete: true,
    phase739PreflightComplete: true,
    phase740DiagnosticRunnerComplete: true,
    diagnosticRunnerSeparatedFromProductPath: true,
    exactCoreHostDiffReviewed: true,
    sessionFactoryEmbedWiringReviewed: true,
    digestVerificationBeforeEmbedReviewed: true,
    helperLoadBeforeEmbedReviewed: true,
    resourceLeaseLifecycleReviewed: true,
    requestValidationBoundaryReviewed: true,
    embeddingResultSchemaBoundaryReviewed: true,
    vectorShapeAndFiniteValueValidationReviewed: true,
    vectorRedactionFromLogsReviewed: true,
    timeoutCancellationAndReleaseReviewed: true,
    sanitizedErrorMappingReviewed: true,
    operationSupervisorBoundaryReviewed: true,
    fixtureFallbackPreserved: true,
    startupRestartRollbackSmokePlanned: true,
    productApprovalRequired: true,
    securityApprovalRequired: true,
    verificationClean: true,
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
    modelOutputShellExecutionEnabled: false
  };
}
