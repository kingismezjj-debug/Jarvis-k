import { describe, expect, it } from "vitest";
import {
  evaluateCoreHostLocalEmbeddingHelperEmbedDiagnosticPreflight
} from "../src/local-embedding-helper-embed-diagnostic-preflight";

describe("Core Host local embedding helper embed diagnostic preflight", () => {
  it("accepts fixture-only diagnostic harness evidence without calling helper embed", () => {
    const result =
      evaluateCoreHostLocalEmbeddingHelperEmbedDiagnosticPreflight(
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
      runtimePythonEnvKey: "JARVIS_K_RUNTIME_PYTHON",
      modelDirectoryEnvKey: "JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR",
      status: "ready_for_diagnostic_harness_approval",
      accepted: true,
      readyForDiagnosticHarnessApproval: true,
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
      reviewedAreas: [
        "diagnostic_harness_scope",
        "fixture_transport_only",
        "sanitized_report_schema",
        "bounded_case_plan",
        "raw_input_redaction",
        "vector_value_redaction",
        "failure_reason_codes",
        "cleanup_and_release"
      ],
      reasons: [
        "Helper embed diagnostic harness preflight is ready for separate product and security approval."
      ]
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades when diagnostic harness evidence is incomplete while side effects remain blocked", () => {
    const result =
      evaluateCoreHostLocalEmbeddingHelperEmbedDiagnosticPreflight({
        ...approvedPreflightInput(),
        sanitizedReportSchemaReviewed: false,
        vectorValueRedactionReviewed: false,
        verificationClean: false
      });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForDiagnosticHarnessApproval: false,
      helperEmbedCalled: false,
      realEmbeddingVectorsReturned: false,
      reviewedAreas: [],
      checks: {
        sanitizedReportSchemaReviewed: false,
        vectorValueRedactionReviewed: false,
        verificationClean: false,
        helperEmbedCallBlocked: true,
        realVectorReturnBlocked: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Sanitized diagnostic report schema review is required.",
        "Vector value redaction review is required.",
        "Clean local verification evidence is required."
      ])
    );
  });

  it("blocks helper embed, real vectors, raw inputs, artifact access, Memory routing, and migration", () => {
    const result =
      evaluateCoreHostLocalEmbeddingHelperEmbedDiagnosticPreflight({
        ...approvedPreflightInput(),
        helperEmbedCalled: true,
        realEmbeddingVectorsReturned: true,
        rawInputTextPersisted: true,
        vectorValuesPersistedOrLogged: true,
        modelArtifactAccessed: true,
        productInferenceEnabled: true,
        vectorsRoutedToMemory: true,
        memorySchemaMigrationEnabled: true
      });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForDiagnosticHarnessApproval: false,
      helperEmbedCalled: false,
      realEmbeddingVectorsReturned: false,
      rawInputTextPersisted: false,
      vectorValuesPersistedOrLogged: false,
      modelArtifactAccessed: false,
      productInferenceEnabled: false,
      vectorsRoutedToMemory: false,
      memorySchemaMigrationEnabled: false,
      reviewedAreas: []
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Helper embed calls remain blocked in this diagnostic preflight.",
        "Returning real embedding vectors remains blocked.",
        "Persisting raw input text remains blocked.",
        "Persisting or logging vector values remains blocked.",
        "Model artifact access remains blocked in this preparation wave.",
        "Product inference remains blocked.",
        "Routing vectors to Memory remains blocked.",
        "Memory schema migration remains blocked."
      ])
    );
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks approval, visibility, diagnostics, credentials, cache, downloads, and shell regressions", () => {
    const result =
      evaluateCoreHostLocalEmbeddingHelperEmbedDiagnosticPreflight({
        ...approvedPreflightInput(),
        productApprovalGranted: true,
        securityApprovalGranted: true,
        downloadsEnabled: true,
        persistentCacheWritesEnabled: true,
        providerRegistrationChanged: true,
        defaultOptInEnabled: true,
        uiVisibilityChanged: true,
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
      downloadsEnabled: false,
      persistentCacheWritesEnabled: false,
      providerRegistrationChanged: false,
      defaultOptInEnabled: false,
      uiVisibilityChanged: false,
      rawDiagnosticsExposed: false,
      privatePathExposureEnabled: false,
      signedUrlOrCredentialPersistenceEnabled: false,
      modelOutputShellExecutionEnabled: false,
      checks: {
        productApprovalStillPending: false,
        securityApprovalStillPending: false,
        downloadsBlocked: false,
        persistentCacheWritesBlocked: false,
        providerRegistrationUnchanged: false,
        defaultOptInDisabled: false,
        uiVisibilityUnchanged: false,
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
        "Downloads remain blocked.",
        "Persistent cache writes remain blocked.",
        "Provider registration behavior must not change.",
        "Default local embedding opt-in must remain disabled.",
        "UI visibility must not change.",
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
    providerShellExplicitlyOptIn: true,
    phase738PreflightComplete: true,
    diagnosticHarnessScopeReviewed: true,
    fixtureTransportOnly: true,
    sanitizedReportSchemaReviewed: true,
    boundedCasePlanReviewed: true,
    rawInputTextRedactionReviewed: true,
    vectorValueRedactionReviewed: true,
    failureReasonCodesReviewed: true,
    cleanupAndReleaseReviewed: true,
    productApprovalRequired: true,
    securityApprovalRequired: true,
    verificationClean: true,
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
    modelOutputShellExecutionEnabled: false
  };
}
