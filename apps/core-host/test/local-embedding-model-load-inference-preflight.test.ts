import { describe, expect, it } from "vitest";
import {
  evaluateCoreHostLocalEmbeddingModelLoadInferencePreflight
} from "../src/local-embedding-model-load-inference-preflight";

describe("Core Host local embedding model load and inference preflight", () => {
  it("accepts complete review evidence without granting model load or inference", () => {
    const result =
      evaluateCoreHostLocalEmbeddingModelLoadInferencePreflight(
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
      status: "ready_for_model_load_inference_approval",
      accepted: true,
      readyForModelLoadInferenceApproval: true,
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
      reviewedAreas: [
        "artifact_path_policy",
        "digest_verification_before_load",
        "helper_load_contract",
        "helper_embed_contract",
        "resource_lease_before_load",
        "sanitized_error_mapping",
        "fixture_fallback",
        "startup_restart_rollback"
      ],
      reasons: [
        "Model load and inference preflight is ready for separate product and security approval."
      ]
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades when review evidence is incomplete but model side effects remain blocked", () => {
    const result =
      evaluateCoreHostLocalEmbeddingModelLoadInferencePreflight({
        ...approvedPreflightInput(),
        artifactPathPolicyReviewed: false,
        helperLoadContractReviewed: false,
        verificationClean: false
      });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForModelLoadInferenceApproval: false,
      modelLoadEnabled: false,
      realInferenceEnabled: false,
      reviewedAreas: [],
      checks: {
        artifactPathPolicyReviewed: false,
        helperLoadContractReviewed: false,
        verificationClean: false,
        modelArtifactPathReadBlocked: true,
        helperLoadCallBlocked: true,
        realInferenceBlocked: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Model artifact path policy review is required.",
        "Helper load contract review is required.",
        "Clean local verification evidence is required."
      ])
    );
  });

  it("blocks model path, helper load, helper embed, artifact, cache, and inference side effects", () => {
    const result =
      evaluateCoreHostLocalEmbeddingModelLoadInferencePreflight({
        ...approvedPreflightInput(),
        modelArtifactPathRead: true,
        modelDirectoryPassedToHelper: true,
        helperLoadCalled: true,
        helperEmbedCalled: true,
        modelArtifactAccessEnabled: true,
        cacheWritesEnabled: true,
        downloadEnabled: true,
        modelLoadEnabled: true,
        realInferenceEnabled: true,
        rawEmbeddingVectorsExposed: true
      });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForModelLoadInferenceApproval: false,
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
      reviewedAreas: []
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Model artifact path reads remain blocked in this preflight.",
        "Passing a model directory to the helper remains blocked.",
        "Helper load calls remain blocked in this preflight.",
        "Helper embed calls remain blocked in this preflight.",
        "Model artifact access remains blocked in this preflight.",
        "Cache writes remain blocked in this preflight.",
        "Downloads remain blocked in this preflight.",
        "Model loading remains blocked in this preflight.",
        "Real local embedding inference remains blocked in this preflight.",
        "Raw embedding vector exposure remains blocked."
      ])
    );
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks approval, visibility, diagnostics, credentials, and shell regressions", () => {
    const result =
      evaluateCoreHostLocalEmbeddingModelLoadInferencePreflight({
        ...approvedPreflightInput(),
        productApprovalGranted: true,
        securityApprovalGranted: true,
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
        "Product approval must be granted only in the separate model-load wave.",
        "Security approval must be granted only in the separate model-load wave.",
        "Provider registration behavior must not change in this preflight.",
        "Default local embedding opt-in must remain disabled.",
        "UI visibility must not change in this preflight.",
        "Raw diagnostics exposure must remain blocked.",
        "Private path exposure must remain blocked.",
        "Signed URL and credential persistence must remain blocked.",
        "Model output must not be converted into shell execution."
      ])
    );
  });
});

function approvedPreflightInput() {
  return {
    compositionRoot: "apps/core-host",
    providerShellExplicitlyOptIn: true,
    helperLifecycleImplemented: true,
    runtimePythonEnvAlreadyApproved: true,
    approvedManifestAvailable: true,
    artifactPinApprovalReviewed: true,
    artifactPathPolicyReviewed: true,
    digestVerificationBeforeLoadReviewed: true,
    helperLoadContractReviewed: true,
    helperEmbedContractReviewed: true,
    resourceLeaseBeforeLoadReviewed: true,
    sanitizedErrorMappingReviewed: true,
    fixtureFallbackPreserved: true,
    startupRestartRollbackReviewed: true,
    productApprovalRequired: true,
    securityApprovalRequired: true,
    verificationClean: true,
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
    modelOutputShellExecutionEnabled: false
  };
}
