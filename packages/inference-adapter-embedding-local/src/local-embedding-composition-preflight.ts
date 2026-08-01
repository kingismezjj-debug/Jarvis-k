import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import type { LocalEmbeddingRuntimeAcceptancePreflightResult } from "./local-embedding-runtime-acceptance-preflight";
import type { LocalEmbeddingRuntimeAdapterIsolationResult } from "./local-embedding-runtime-adapter-isolation";
import { LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT } from "./local-embedding-runtime-strategy";

export type LocalEmbeddingCompositionPreflightStatus =
  | "blocked"
  | "ready_for_explicit_composition_review";

export interface LocalEmbeddingCompositionPreflightPolicy {
  provider: string;
  modelId: string;
  runtime: "transformers";
  compositionRoot: string;
  explicitCompositionReviewRequired: true;
  providerRegistrationAllowed: false;
  executionEnablementAllowed: false;
  defaultOptInAllowed: false;
  coreHostCompositionChangeAllowed: false;
  providerVisibilityChangeAllowed: false;
  fallbackProviderRequired: true;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  modelArtifactAccessed: false;
  cacheWritesEnabled: false;
  installerCreated: false;
  modelArtifactsBundled: false;
  runtimeLoaded: false;
  inferenceExecuted: false;
}

export interface LocalEmbeddingCompositionPreflightInput {
  runtimeAcceptancePreflight?: LocalEmbeddingRuntimeAcceptancePreflightResult;
  runtimeAdapterIsolation?: LocalEmbeddingRuntimeAdapterIsolationResult;
  compositionRoot?: string;
  coreHostCompositionChanged?: boolean;
  providerVisibilityChanged?: boolean;
  providerRegistrationEnabled?: boolean;
  executionEnabled?: boolean;
  defaultOptInEnabled?: boolean;
  runtimeDependenciesIntroduced?: boolean;
  downloadEnabled?: boolean;
  modelArtifactAccessed?: boolean;
  cacheWritesEnabled?: boolean;
  installerCreated?: boolean;
  modelArtifactsBundled?: boolean;
  runtimeLoaded?: boolean;
  inferenceExecuted?: boolean;
  fixtureFallbackAvailable?: boolean;
  verificationClean?: boolean;
}

export interface LocalEmbeddingCompositionPreflightChecks {
  runtimeAcceptanceApproved: boolean;
  runtimeAdapterIsolationApproved: boolean;
  compositionRootRestricted: boolean;
  coreHostCompositionUnchanged: boolean;
  providerVisibilityUnchanged: boolean;
  providerRegistrationDisabled: boolean;
  executionDisabled: boolean;
  defaultOptInDisabled: boolean;
  runtimeDependenciesAbsent: boolean;
  downloadsDisabled: boolean;
  modelArtifactAccessDisabled: boolean;
  cacheWritesDisabled: boolean;
  installerCreationDisabled: boolean;
  modelBundlingDisabled: boolean;
  runtimeLoadingDisabled: boolean;
  inferenceExecutionDisabled: boolean;
  fallbackProviderAvailable: boolean;
  verificationClean: boolean;
}

export interface LocalEmbeddingCompositionPreflightResult {
  provider: string;
  modelId: string;
  runtime: "transformers";
  compositionRoot: string;
  status: LocalEmbeddingCompositionPreflightStatus;
  accepted: boolean;
  readyForExplicitCompositionReview: boolean;
  compositionAllowed: false;
  providerRegistrationEnabled: false;
  executionEnabled: false;
  defaultOptInEnabled: false;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  modelArtifactAccessed: false;
  cacheWritesEnabled: false;
  installerCreated: false;
  modelArtifactsBundled: false;
  runtimeLoaded: false;
  inferenceExecuted: false;
  checks: LocalEmbeddingCompositionPreflightChecks;
  reasons: string[];
}

export function createLocalEmbeddingCompositionPreflightPolicy(): LocalEmbeddingCompositionPreflightPolicy {
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
    explicitCompositionReviewRequired: true,
    providerRegistrationAllowed: false,
    executionEnablementAllowed: false,
    defaultOptInAllowed: false,
    coreHostCompositionChangeAllowed: false,
    providerVisibilityChangeAllowed: false,
    fallbackProviderRequired: true,
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    modelArtifactAccessed: false,
    cacheWritesEnabled: false,
    installerCreated: false,
    modelArtifactsBundled: false,
    runtimeLoaded: false,
    inferenceExecuted: false
  };
}

export function evaluateLocalEmbeddingCompositionPreflight(
  input: LocalEmbeddingCompositionPreflightInput = {}
): LocalEmbeddingCompositionPreflightResult {
  const checks: LocalEmbeddingCompositionPreflightChecks = {
    runtimeAcceptanceApproved: isRuntimeAcceptanceApproved(
      input.runtimeAcceptancePreflight
    ),
    runtimeAdapterIsolationApproved: isRuntimeAdapterIsolationApproved(
      input.runtimeAdapterIsolation
    ),
    compositionRootRestricted:
      input.compositionRoot === LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
    coreHostCompositionUnchanged: input.coreHostCompositionChanged === false,
    providerVisibilityUnchanged: input.providerVisibilityChanged === false,
    providerRegistrationDisabled:
      input.providerRegistrationEnabled === false,
    executionDisabled: input.executionEnabled === false,
    defaultOptInDisabled: input.defaultOptInEnabled === false,
    runtimeDependenciesAbsent: input.runtimeDependenciesIntroduced === false,
    downloadsDisabled: input.downloadEnabled === false,
    modelArtifactAccessDisabled: input.modelArtifactAccessed === false,
    cacheWritesDisabled: input.cacheWritesEnabled === false,
    installerCreationDisabled: input.installerCreated === false,
    modelBundlingDisabled: input.modelArtifactsBundled === false,
    runtimeLoadingDisabled: input.runtimeLoaded === false,
    inferenceExecutionDisabled: input.inferenceExecuted === false,
    fallbackProviderAvailable: input.fixtureFallbackAvailable === true,
    verificationClean: input.verificationClean === true
  };
  const accepted = Object.values(checks).every((value) => value === true);

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
    status: accepted ? "ready_for_explicit_composition_review" : "blocked",
    accepted,
    readyForExplicitCompositionReview: accepted,
    compositionAllowed: false,
    providerRegistrationEnabled: false,
    executionEnabled: false,
    defaultOptInEnabled: false,
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    modelArtifactAccessed: false,
    cacheWritesEnabled: false,
    installerCreated: false,
    modelArtifactsBundled: false,
    runtimeLoaded: false,
    inferenceExecuted: false,
    checks,
    reasons: createReasons(checks)
  };
}

function isRuntimeAcceptanceApproved(
  result: LocalEmbeddingRuntimeAcceptancePreflightResult | undefined
): boolean {
  return (
    result?.accepted === true &&
    result.readyForRuntimeBackedCapture === true &&
    result.metricValuesCaptured === false &&
    result.metricValuesExposed === false &&
    result.runtimeDependenciesIntroduced === false &&
    result.downloadEnabled === false &&
    result.executionEnabled === false &&
    result.providerRegistrationEnabled === false &&
    result.defaultOptInEnabled === false &&
    result.installerCreated === false &&
    result.modelArtifactsBundled === false &&
    result.cacheWritesEnabled === false
  );
}

function isRuntimeAdapterIsolationApproved(
  result: LocalEmbeddingRuntimeAdapterIsolationResult | undefined
): boolean {
  return (
    result?.accepted === true &&
    result.readyForDependencyApproval === true &&
    result.compositionAllowed === false &&
    result.executionEnabled === false &&
    result.providerRegistrationEnabled === false &&
    result.defaultOptInEnabled === false &&
    result.runtimeDependenciesIntroduced === false &&
    result.downloadEnabled === false &&
    result.implementationValuesExposed === false
  );
}

function createReasons(
  checks: LocalEmbeddingCompositionPreflightChecks
): string[] {
  const reasons: string[] = [];

  if (!checks.runtimeAcceptanceApproved) {
    reasons.push("Runtime acceptance preflight is missing or regressed.");
  }
  if (!checks.runtimeAdapterIsolationApproved) {
    reasons.push("Runtime adapter isolation approval is missing or regressed.");
  }
  if (!checks.compositionRootRestricted) {
    reasons.push("Concrete composition must remain rooted in the approved host.");
  }
  if (!checks.coreHostCompositionUnchanged) {
    reasons.push("Core Host composition changes are deferred until explicit approval.");
  }
  if (!checks.providerVisibilityUnchanged) {
    reasons.push("Provider visibility changes are deferred until explicit approval.");
  }
  if (!checks.providerRegistrationDisabled) {
    reasons.push("Provider registration remains disabled in this preflight.");
  }
  if (!checks.executionDisabled) {
    reasons.push("Execution enablement remains disabled in this preflight.");
  }
  if (!checks.defaultOptInDisabled) {
    reasons.push("Default opt-in remains disabled in this preflight.");
  }
  if (!checks.runtimeDependenciesAbsent) {
    reasons.push("Runtime dependencies must remain absent in this preflight.");
  }
  if (!checks.downloadsDisabled) {
    reasons.push("Artifact downloads must remain disabled in this preflight.");
  }
  if (!checks.modelArtifactAccessDisabled) {
    reasons.push("Model artifact access remains disabled in this preflight.");
  }
  if (!checks.cacheWritesDisabled) {
    reasons.push("Cache writes must remain disabled in this preflight.");
  }
  if (!checks.installerCreationDisabled) {
    reasons.push("Installer creation remains disabled in this preflight.");
  }
  if (!checks.modelBundlingDisabled) {
    reasons.push("Model bundling remains disabled in this preflight.");
  }
  if (!checks.runtimeLoadingDisabled) {
    reasons.push("Runtime loading remains disabled in this preflight.");
  }
  if (!checks.inferenceExecutionDisabled) {
    reasons.push("Inference execution remains disabled in this preflight.");
  }
  if (!checks.fallbackProviderAvailable) {
    reasons.push("Fixture or other fallback provider is required before review can pass.");
  }
  if (!checks.verificationClean) {
    reasons.push("Verification gates are not clean.");
  }

  return reasons;
}
