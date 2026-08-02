import { describe, expect, it } from "vitest";
import {
  LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
  evaluateCoreHostLocalEmbeddingRuntimeSessionFactoryPreflight
} from "../src/local-embedding-runtime-session-factory-preflight";

describe("Core Host local embedding runtime session factory preflight", () => {
  it("accepts complete review evidence without granting runtime session factory implementation", () => {
    const result =
      evaluateCoreHostLocalEmbeddingRuntimeSessionFactoryPreflight(
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
      runtimePythonEnvKey: LOCAL_EMBEDDING_RUNTIME_PYTHON_ENV,
      status: "ready_for_runtime_session_factory_approval",
      accepted: true,
      readyForRuntimeSessionFactoryApproval: true,
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
      reviewedAreas: [
        "explicit_opt_in_composition",
        "runtime_python_env_handling",
        "resource_lease_enforcement",
        "sanitized_error_mapping",
        "startup_restart_rollback",
        "fixture_fallback"
      ],
      reasons: [
        "Core Host runtime session factory preflight is ready for separate product and security approval."
      ]
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades when review evidence is incomplete but all side effects remain blocked", () => {
    const result =
      evaluateCoreHostLocalEmbeddingRuntimeSessionFactoryPreflight({
        ...approvedPreflightInput(),
        fixtureFallbackPreserved: false,
        runtimePythonEnvHandlingReviewed: false,
        verificationClean: false
      });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForRuntimeSessionFactoryApproval: false,
      sessionFactoryImplementationAllowed: false,
      pythonHelperLaunchEnabled: false,
      realInferenceEnabled: false,
      reviewedAreas: [],
      checks: {
        fixtureFallbackPreserved: false,
        runtimePythonEnvHandlingReviewed: false,
        verificationClean: false,
        pythonHelperLaunchBlocked: true,
        realInferenceBlocked: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Fixture embedding fallback preservation review is required.",
        "Runtime Python environment handling must be reviewed without reading its value.",
        "Clean local verification evidence is required."
      ])
    );
  });

  it("blocks if Python environment, artifact path, helper launch, or model load side effects are requested", () => {
    const result =
      evaluateCoreHostLocalEmbeddingRuntimeSessionFactoryPreflight({
        ...approvedPreflightInput(),
        sessionFactoryImplementationAllowed: true,
        sessionFactoryImplemented: true,
        runtimePythonEnvRead: true,
        runtimePythonEnvValueExposed: true,
        modelArtifactPathRead: true,
        pythonHelperLaunchEnabled: true,
        modelArtifactAccessEnabled: true,
        cacheWritesEnabled: true,
        modelLoadEnabled: true,
        realInferenceEnabled: true
      });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForRuntimeSessionFactoryApproval: false,
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
      reviewedAreas: []
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Runtime session factory implementation remains blocked in this preflight.",
        "Runtime Python environment value must not be read in this preflight.",
        "Runtime Python environment value must not be exposed.",
        "Model artifact paths must not be read in this preflight.",
        "Python helper launch remains blocked in this preflight.",
        "Model artifact access remains blocked in this preflight.",
        "Cache writes remain blocked in this preflight.",
        "Model loading remains blocked in this preflight.",
        "Real local embedding inference remains blocked in this preflight."
      ])
    );
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks approval, registration, default opt-in, shell, dependency, or diagnostics regressions", () => {
    const result =
      evaluateCoreHostLocalEmbeddingRuntimeSessionFactoryPreflight({
        ...approvedPreflightInput(),
        productApprovalGranted: true,
        securityApprovalGranted: true,
        runtimeDependencyChangesIntroduced: true,
        providerRegistrationChanged: true,
        defaultOptInEnabled: true,
        modelOutputShellExecutionEnabled: true,
        privatePathExposureEnabled: true,
        rawDiagnosticsExposed: true
      });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      productApprovalGranted: false,
      securityApprovalGranted: false,
      runtimeDependencyChangesIntroduced: false,
      providerRegistrationChanged: false,
      defaultOptInEnabled: false,
      modelOutputShellExecutionEnabled: false,
      privatePathExposureEnabled: false,
      rawDiagnosticsExposed: false,
      checks: {
        productApprovalStillPending: false,
        securityApprovalStillPending: false,
        runtimeDependencyChangesAbsent: false,
        providerRegistrationUnchanged: false,
        defaultOptInDisabled: false,
        modelOutputShellExecutionBlocked: false,
        privatePathExposureBlocked: false,
        rawDiagnosticsExposureBlocked: false
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Product approval must be granted only in the separate session factory wave.",
        "Security approval must be granted only in the separate session factory wave.",
        "Runtime dependency changes require a separate approval.",
        "Provider registration behavior must not change in this preflight.",
        "Default local embedding opt-in must remain disabled.",
        "Model output must not be converted into shell execution.",
        "Private path exposure must remain blocked.",
        "Raw diagnostics exposure must remain blocked."
      ])
    );
  });
});

function approvedPreflightInput() {
  return {
    compositionRoot: "apps/core-host",
    providerShellComposedByExplicitOptIn: true,
    runtimeDescriptorComposedByExplicitOptIn: true,
    approvedManifestComposedByExplicitOptIn: true,
    fixtureFallbackPreserved: true,
    resourceLeaseEnforcementReviewed: true,
    sanitizedErrorMappingReviewed: true,
    startupRestartRollbackReviewed: true,
    runtimePythonEnvHandlingReviewed: true,
    productApprovalRequired: true,
    securityApprovalRequired: true,
    verificationClean: true,
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
    rawDiagnosticsExposed: false
  };
}
