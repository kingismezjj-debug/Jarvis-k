import { describe, expect, it } from "vitest";
import {
  createTransformersLocalArtifactAccessApprovalPolicy,
  evaluateTransformersLocalArtifactAccessApproval,
  TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME
} from "../src";

const completeEvidence = {
  runtimeHelperProtocolApproved: true,
  runtimeHelperImplementationVerified: true,
  syntheticFixtureSmokePassed: true,
  runtimePackageBuildPassed: true,
  boundaryChecksPassed: true,
  sensitiveArtifactChecksPassed: true,
  workspaceClean: true,
  artifactPlanApproved: true,
  licenseReviewApproved: true,
  benchmarkMethodApproved: true,
  cacheRollbackPolicyApproved: true,
  pythonEnvironmentApproved: true,
  fixtureFallbackAvailable: true,
  compositionRemainsOptIn: true
};

describe("Transformers local artifact access approval gate", () => {
  it("defines a review-only policy with every real side effect disabled", () => {
    const policy = createTransformersLocalArtifactAccessApprovalPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toEqual({
      packageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
      explicitApprovalRequired: true,
      pythonEnvironmentApprovalRequired: true,
      artifactAccessApprovalRequired: true,
      runtimeBackedBenchmarkApprovalRequired: true,
      providerRegistrationApprovalRequired: true,
      executionEnablementApprovalRequired: true,
      defaultOptInChangeApprovalRequired: true,
      compositionReviewSeparate: true,
      networkAccessEnabled: false,
      fileSystemWritesEnabled: false,
      modelLoadingEnabled: false,
      benchmarkCaptureEnabled: false,
      providerRegistrationEnabled: false,
      executionEnablementEnabled: false,
      defaultOptInChangeEnabled: false,
      signedUrlsPersisted: false,
      credentialMaterialPersisted: false,
      artifactValuesExposed: false,
      rawDiagnosticsExposed: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("networkAccessEnabled\":true");
    expect(serialized).not.toContain("modelLoadingEnabled\":true");
  });

  it("reaches the approval handoff without granting artifact access", () => {
    const result = evaluateTransformersLocalArtifactAccessApproval(
      completeEvidence
    );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "ready_for_explicit_artifact_access_approval",
      accepted: true,
      readyForExplicitArtifactAccessApproval: true,
      artifactAccessAllowed: false,
      runtimeBackedBenchmarkAllowed: false,
      providerRegistrationAllowed: false,
      executionEnablementAllowed: false,
      defaultOptInChangeAllowed: false,
      networkAccessEnabled: false,
      fileSystemWritesEnabled: false,
      modelLoadingEnabled: false,
      benchmarkCaptureEnabled: false,
      modelArtifactsAccessed: false,
      checks: {
        requiredEvidenceComplete: true,
        sideEffectsRequested: false,
        sideEffectsBlocked: true
      }
    });
    expect(serialized).not.toContain("https://");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("reports degraded readiness when review evidence is incomplete", () => {
    const result = evaluateTransformersLocalArtifactAccessApproval({
      ...completeEvidence,
      licenseReviewApproved: false,
      pythonEnvironmentApproved: false
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      readyForExplicitArtifactAccessApproval: false,
      artifactAccessAllowed: false,
      modelArtifactsAccessed: false,
      checks: {
        requiredEvidenceComplete: false,
        sideEffectsRequested: false,
        sideEffectsBlocked: true
      }
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Required license review approved evidence is missing.",
        "Required python environment approved evidence is missing.",
        "The runtime remains fail-closed and the fixture provider remains the fallback."
      ])
    );
  });

  it("blocks requested side effects even when all review evidence is present", () => {
    const result = evaluateTransformersLocalArtifactAccessApproval({
      ...completeEvidence,
      requestedOperations: {
        networkAccess: true,
        fileSystemCacheWrite: true,
        runtimeBackedBenchmark: true,
        providerRegistration: true,
        exposeRawDiagnostics: true
      }
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForExplicitArtifactAccessApproval: false,
      artifactAccessAllowed: false,
      runtimeBackedBenchmarkAllowed: false,
      providerRegistrationAllowed: false,
      executionEnablementAllowed: false,
      checks: {
        requiredEvidenceComplete: true,
        sideEffectsRequested: true,
        sideEffectsBlocked: true
      }
    });
    expect(result.reasons).toContain(
      "Artifact access, cache, benchmark, registration, and enablement side effects are blocked in this preparation gate."
    );
    expect(serialized).not.toContain("raw helper diagnostics");
    expect(serialized).not.toContain("https://");
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });
});
