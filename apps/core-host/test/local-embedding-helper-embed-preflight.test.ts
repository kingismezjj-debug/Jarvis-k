import { describe, expect, it } from "vitest";
import {
  evaluateCoreHostLocalEmbeddingHelperEmbedPreflight
} from "../src/local-embedding-helper-embed-preflight";

describe("Core Host local embedding helper embed preflight", () => {
  it("accepts complete review evidence without calling helper embed or returning vectors", () => {
    const result = evaluateCoreHostLocalEmbeddingHelperEmbedPreflight(
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
      status: "ready_for_helper_embed_approval",
      accepted: true,
      readyForHelperEmbedApproval: true,
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
      reviewedAreas: [
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
      ],
      reasons: [
        "Helper embed preflight is ready for separate product and security approval."
      ]
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades when review evidence is incomplete but embed side effects remain blocked", () => {
    const result = evaluateCoreHostLocalEmbeddingHelperEmbedPreflight({
      ...approvedPreflightInput(),
      vectorSanitizationReviewed: false,
      timeoutAndCancellationReviewed: false,
      verificationClean: false
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForHelperEmbedApproval: false,
      helperEmbedCalled: false,
      embeddingVectorsReturned: false,
      reviewedAreas: [],
      checks: {
        vectorSanitizationReviewed: false,
        timeoutAndCancellationReviewed: false,
        verificationClean: false,
        helperEmbedCallBlocked: true,
        embeddingVectorReturnBlocked: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Embedding vector sanitization review is required.",
        "Timeout and cancellation review is required.",
        "Clean local verification evidence is required."
      ])
    );
  });

  it("blocks helper embed, vector return, Memory routing, persistence, and product execution side effects", () => {
    const result = evaluateCoreHostLocalEmbeddingHelperEmbedPreflight({
      ...approvedPreflightInput(),
      helperEmbedCalled: true,
      embeddingVectorsReturned: true,
      vectorsRoutedToMemory: true,
      vectorsPersisted: true,
      vectorsLoggedOrExposed: true,
      productInferenceEnabled: true,
      memorySchemaMigrationEnabled: true
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForHelperEmbedApproval: false,
      helperEmbedCalled: false,
      embeddingVectorsReturned: false,
      vectorsRoutedToMemory: false,
      vectorsPersisted: false,
      vectorsLoggedOrExposed: false,
      productInferenceEnabled: false,
      memorySchemaMigrationEnabled: false,
      reviewedAreas: []
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Helper embed calls remain blocked in this preflight.",
        "Returning embedding vectors remains blocked in this preflight.",
        "Routing vectors to Memory remains blocked.",
        "Persisting vectors remains blocked.",
        "Logging or exposing vectors remains blocked.",
        "Product inference execution remains blocked.",
        "Memory schema migration remains blocked."
      ])
    );
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks approval, visibility, diagnostics, credentials, downloads, cache, and shell regressions", () => {
    const result = evaluateCoreHostLocalEmbeddingHelperEmbedPreflight({
      ...approvedPreflightInput(),
      productApprovalGranted: true,
      securityApprovalGranted: true,
      providerRegistrationChanged: true,
      defaultOptInEnabled: true,
      uiVisibilityChanged: true,
      rawDiagnosticsExposed: true,
      privatePathExposureEnabled: true,
      signedUrlOrCredentialPersistenceEnabled: true,
      modelOutputShellExecutionEnabled: true,
      downloadsEnabled: true,
      persistentCacheWritesEnabled: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      productApprovalGranted: false,
      securityApprovalGranted: false,
      providerRegistrationChanged: false,
      defaultOptInEnabled: false,
      uiVisibilityChanged: false,
      rawDiagnosticsExposed: false,
      privatePathExposureEnabled: false,
      signedUrlOrCredentialPersistenceEnabled: false,
      modelOutputShellExecutionEnabled: false,
      downloadsEnabled: false,
      persistentCacheWritesEnabled: false,
      checks: {
        productApprovalStillPending: false,
        securityApprovalStillPending: false,
        providerRegistrationUnchanged: false,
        defaultOptInDisabled: false,
        uiVisibilityUnchanged: false,
        rawDiagnosticsExposureBlocked: false,
        privatePathExposureBlocked: false,
        signedUrlAndCredentialPersistenceBlocked: false,
        modelOutputShellExecutionBlocked: false,
        downloadsBlocked: false,
        persistentCacheWritesBlocked: false
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Product approval must remain pending in this preflight.",
        "Security approval must remain pending in this preflight.",
        "Provider registration behavior must not change.",
        "Default local embedding opt-in must remain disabled.",
        "UI visibility must not change.",
        "Raw diagnostics exposure remains blocked.",
        "Private path exposure remains blocked.",
        "Signed URL and credential persistence remains blocked.",
        "Model output must not be converted into shell execution.",
        "Downloads remain blocked.",
        "Persistent cache writes remain blocked."
      ])
    );
  });
});

function approvedPreflightInput() {
  return {
    compositionRoot: "apps/core-host",
    providerShellExplicitlyOptIn: true,
    helperLifecycleImplemented: true,
    modelArtifactLoadImplemented: true,
    digestVerificationBeforeLoadImplemented: true,
    runtimePythonEnvApproved: true,
    modelDirectoryEnvApproved: true,
    approvedManifestAvailable: true,
    helperEmbedContractReviewed: true,
    sessionIdHandoffReviewed: true,
    resourceLeaseBeforeEmbedReviewed: true,
    inputBatchBoundsReviewed: true,
    inputTextBoundsReviewed: true,
    dimensionValidationReviewed: true,
    vectorSanitizationReviewed: true,
    timeoutAndCancellationReviewed: true,
    sanitizedErrorMappingReviewed: true,
    operationSupervisorBoundaryReviewed: true,
    fixtureFallbackPreserved: true,
    productApprovalRequired: true,
    securityApprovalRequired: true,
    verificationClean: true,
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
    memorySchemaMigrationEnabled: false
  };
}
