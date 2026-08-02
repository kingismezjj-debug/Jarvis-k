import { TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME } from "./runtime-constants";

export type TransformersLocalArtifactAccessApprovalStatus =
  | "blocked"
  | "degraded"
  | "ready_for_explicit_artifact_access_approval";

export type TransformersLocalArtifactAccessSideEffect =
  | "networkAccess"
  | "fileSystemCacheWrite"
  | "modelArtifactRead"
  | "modelLoad"
  | "runtimeBackedBenchmark"
  | "providerRegistration"
  | "executionEnablement"
  | "defaultOptInChange"
  | "persistSignedUrl"
  | "persistCredentialMaterial"
  | "exposeArtifactValues"
  | "exposeRawDiagnostics";

export interface TransformersLocalArtifactAccessApprovalPolicy {
  packageName: string;
  explicitApprovalRequired: true;
  pythonEnvironmentApprovalRequired: true;
  artifactAccessApprovalRequired: true;
  runtimeBackedBenchmarkApprovalRequired: true;
  providerRegistrationApprovalRequired: true;
  executionEnablementApprovalRequired: true;
  defaultOptInChangeApprovalRequired: true;
  compositionReviewSeparate: true;
  networkAccessEnabled: false;
  fileSystemWritesEnabled: false;
  modelLoadingEnabled: false;
  benchmarkCaptureEnabled: false;
  providerRegistrationEnabled: false;
  executionEnablementEnabled: false;
  defaultOptInChangeEnabled: false;
  signedUrlsPersisted: false;
  credentialMaterialPersisted: false;
  artifactValuesExposed: false;
  rawDiagnosticsExposed: false;
}

export interface TransformersLocalArtifactAccessApprovalInput {
  runtimeHelperProtocolApproved?: boolean;
  runtimeHelperImplementationVerified?: boolean;
  syntheticFixtureSmokePassed?: boolean;
  runtimePackageBuildPassed?: boolean;
  boundaryChecksPassed?: boolean;
  sensitiveArtifactChecksPassed?: boolean;
  workspaceClean?: boolean;
  artifactPlanApproved?: boolean;
  licenseReviewApproved?: boolean;
  benchmarkMethodApproved?: boolean;
  cacheRollbackPolicyApproved?: boolean;
  pythonEnvironmentApproved?: boolean;
  fixtureFallbackAvailable?: boolean;
  compositionRemainsOptIn?: boolean;
  requestedOperations?: Partial<
    Record<TransformersLocalArtifactAccessSideEffect, boolean>
  >;
}

export interface TransformersLocalArtifactAccessApprovalChecks {
  runtimeHelperProtocolApproved: boolean;
  runtimeHelperImplementationVerified: boolean;
  syntheticFixtureSmokePassed: boolean;
  runtimePackageBuildPassed: boolean;
  boundaryChecksPassed: boolean;
  sensitiveArtifactChecksPassed: boolean;
  workspaceClean: boolean;
  artifactPlanApproved: boolean;
  licenseReviewApproved: boolean;
  benchmarkMethodApproved: boolean;
  cacheRollbackPolicyApproved: boolean;
  pythonEnvironmentApproved: boolean;
  fixtureFallbackAvailable: boolean;
  compositionRemainsOptIn: boolean;
  requiredEvidenceComplete: boolean;
  sideEffectsRequested: boolean;
  sideEffectsBlocked: true;
}

export interface TransformersLocalArtifactAccessApprovalResult {
  packageName: string;
  status: TransformersLocalArtifactAccessApprovalStatus;
  accepted: boolean;
  readyForExplicitArtifactAccessApproval: boolean;
  artifactAccessAllowed: false;
  runtimeBackedBenchmarkAllowed: false;
  providerRegistrationAllowed: false;
  executionEnablementAllowed: false;
  defaultOptInChangeAllowed: false;
  networkAccessEnabled: false;
  fileSystemWritesEnabled: false;
  modelLoadingEnabled: false;
  benchmarkCaptureEnabled: false;
  modelArtifactsAccessed: false;
  signedUrlsPersisted: false;
  credentialMaterialPersisted: false;
  artifactValuesExposed: false;
  rawDiagnosticsExposed: false;
  checks: TransformersLocalArtifactAccessApprovalChecks;
  reasons: string[];
}

const EVIDENCE_KEYS: ReadonlyArray<
  keyof Omit<
    TransformersLocalArtifactAccessApprovalChecks,
    "requiredEvidenceComplete" | "sideEffectsRequested" | "sideEffectsBlocked"
  >
> = [
  "runtimeHelperProtocolApproved",
  "runtimeHelperImplementationVerified",
  "syntheticFixtureSmokePassed",
  "runtimePackageBuildPassed",
  "boundaryChecksPassed",
  "sensitiveArtifactChecksPassed",
  "workspaceClean",
  "artifactPlanApproved",
  "licenseReviewApproved",
  "benchmarkMethodApproved",
  "cacheRollbackPolicyApproved",
  "pythonEnvironmentApproved",
  "fixtureFallbackAvailable",
  "compositionRemainsOptIn"
];

export function createTransformersLocalArtifactAccessApprovalPolicy(): TransformersLocalArtifactAccessApprovalPolicy {
  return {
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
  };
}

export function evaluateTransformersLocalArtifactAccessApproval(
  input: TransformersLocalArtifactAccessApprovalInput = {}
): TransformersLocalArtifactAccessApprovalResult {
  const checks: TransformersLocalArtifactAccessApprovalChecks = {
    runtimeHelperProtocolApproved:
      input.runtimeHelperProtocolApproved === true,
    runtimeHelperImplementationVerified:
      input.runtimeHelperImplementationVerified === true,
    syntheticFixtureSmokePassed: input.syntheticFixtureSmokePassed === true,
    runtimePackageBuildPassed: input.runtimePackageBuildPassed === true,
    boundaryChecksPassed: input.boundaryChecksPassed === true,
    sensitiveArtifactChecksPassed:
      input.sensitiveArtifactChecksPassed === true,
    workspaceClean: input.workspaceClean === true,
    artifactPlanApproved: input.artifactPlanApproved === true,
    licenseReviewApproved: input.licenseReviewApproved === true,
    benchmarkMethodApproved: input.benchmarkMethodApproved === true,
    cacheRollbackPolicyApproved:
      input.cacheRollbackPolicyApproved === true,
    pythonEnvironmentApproved: input.pythonEnvironmentApproved === true,
    fixtureFallbackAvailable: input.fixtureFallbackAvailable === true,
    compositionRemainsOptIn: input.compositionRemainsOptIn === true,
    requiredEvidenceComplete: false,
    sideEffectsRequested: areSideEffectsRequested(input.requestedOperations),
    sideEffectsBlocked: true
  };

  checks.requiredEvidenceComplete = EVIDENCE_KEYS.every(
    (key) => checks[key] === true
  );

  const status: TransformersLocalArtifactAccessApprovalStatus =
    checks.sideEffectsRequested
      ? "blocked"
      : checks.requiredEvidenceComplete
        ? "ready_for_explicit_artifact_access_approval"
        : "degraded";
  const accepted =
    status === "ready_for_explicit_artifact_access_approval";

  return {
    packageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
    status,
    accepted,
    readyForExplicitArtifactAccessApproval: accepted,
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
    signedUrlsPersisted: false,
    credentialMaterialPersisted: false,
    artifactValuesExposed: false,
    rawDiagnosticsExposed: false,
    checks,
    reasons: createReasons(checks, accepted)
  };
}

function areSideEffectsRequested(
  requestedOperations:
    | Partial<
        Record<TransformersLocalArtifactAccessSideEffect, boolean>
      >
    | undefined
): boolean {
  if (requestedOperations === undefined) {
    return false;
  }

  return Object.values(requestedOperations).some((value) => value === true);
}

function createReasons(
  checks: TransformersLocalArtifactAccessApprovalChecks,
  accepted: boolean
): string[] {
  const reasons: string[] = [];

  if (checks.sideEffectsRequested) {
    reasons.push(
      "Artifact access, cache, benchmark, registration, and enablement side effects are blocked in this preparation gate."
    );
  }

  for (const key of EVIDENCE_KEYS) {
    if (!checks[key]) {
      reasons.push(`Required ${formatEvidenceKey(key)} evidence is missing.`);
    }
  }

  if (accepted) {
    return [
      "Runtime-backed artifact access preparation passed its review checks.",
      "Explicit artifact access approval is still required before any side effect.",
      "No network access, filesystem write, model load, benchmark capture, registration, or execution enablement occurred."
    ];
  }

  reasons.push(
    "The runtime remains fail-closed and the fixture provider remains the fallback."
  );
  return reasons;
}

function formatEvidenceKey(
  key: keyof Omit<
    TransformersLocalArtifactAccessApprovalChecks,
    "requiredEvidenceComplete" | "sideEffectsRequested" | "sideEffectsBlocked"
  >
): string {
  return key.replace(/([A-Z])/gu, " $1").toLowerCase().trim();
}
