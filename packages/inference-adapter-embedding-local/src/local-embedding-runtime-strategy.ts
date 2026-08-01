import type { ModelRuntime } from "@jarvis-k/contracts";
import {
  createApprovedLocalEmbeddingTokenizerConfigIntegrationReview,
  createLocalEmbeddingTokenizerConfigIntegrationReview,
  isLocalEmbeddingTokenizerConfigIntegrationReviewApproved,
  type LocalEmbeddingTokenizerConfigIntegrationReview
} from "./local-embedding-tokenizer-config-integration-review";

export const LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME =
  "@jarvis-k/inference-runtime-transformers-local";
export const LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION =
  "packages/inference-runtime-transformers-local";
export const LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT = "apps/core-host";

export interface LocalEmbeddingRuntimeStrategy {
  runtime: ModelRuntime;
  status: "provisional" | "approved";
  dedicatedPackageName: string;
  dependencyScope:
    | "dedicated_runtime_package_only"
    | "not_allowed";
  packageBoundary?: LocalEmbeddingRuntimePackageBoundary;
  processIsolation?: LocalEmbeddingRuntimeProcessIsolationPlan;
  windowsPackaging?: LocalEmbeddingWindowsPackagingPlan;
  tokenizerConfigReview: LocalEmbeddingTokenizerConfigIntegrationReview;
  runtimeDependenciesIntroduced: false;
  executionEnabled: false;
  requiredGates: LocalEmbeddingRuntimeGate[];
  forbiddenDependencyLocations: string[];
  reasons: string[];
}

export interface LocalEmbeddingRuntimePackageBoundary {
  dedicatedPackageName: string;
  packageLocation: string;
  compositionRoot: string;
  runtimeDependenciesIntroduced: false;
  forbiddenDependencyLocations: string[];
}

export interface LocalEmbeddingRuntimeProcessIsolationPlan {
  mode: "supervised_child_process";
  supervisor: string;
  ipc: "private_child_process_ipc";
  resourceLeaseRequired: true;
  sanitizedFailureReporting: true;
  directShellExecutionAllowed: false;
  modelOutputActionPolicy: "validated_intent_only";
}

export interface LocalEmbeddingWindowsPackagingPlan {
  status: "planned";
  bundledModelArtifacts: false;
  cachePathCommitted: false;
  installerBundling: "deferred";
  updateRollbackPlanRequired: true;
  noticeBundleRequired: true;
}

export interface LocalEmbeddingRuntimeGate {
  key:
    | "runtime.dependency_license_review"
    | "runtime.windows_packaging_plan"
    | "runtime.process_isolation_plan"
    | "runtime.model_tokenizer_pin"
    | "runtime.benchmark_acceptance";
  satisfied: boolean;
  reason: string;
}

const requiredGates: LocalEmbeddingRuntimeGate[] = [
  {
    key: "runtime.dependency_license_review",
    satisfied: false,
    reason:
      "Review runtime, tokenizer, native library, and helper binary licenses."
  },
  {
    key: "runtime.windows_packaging_plan",
    satisfied: false,
    reason:
      "Document Windows packaging, install size, and update behavior."
  },
  {
    key: "runtime.process_isolation_plan",
    satisfied: false,
    reason:
      "Define whether runtime execution stays in Core Host or a supervised child process."
  },
  {
    key: "runtime.model_tokenizer_pin",
    satisfied: false,
    reason:
      "Pin tokenizer/config artifacts together with model artifact digests."
  },
  {
    key: "runtime.benchmark_acceptance",
    satisfied: false,
    reason:
      "Capture latency, memory, and quality acceptance data before enabling execution."
  }
];
const requiredGateKeys = requiredGates.map((gate) => gate.key);
const forbiddenDependencyLocations = [
  "packages/contracts",
  "packages/capabilities",
  "packages/core",
  "apps/desktop",
  "apps/ui"
];

export function createLocalEmbeddingRuntimeStrategy(): LocalEmbeddingRuntimeStrategy {
  return {
    runtime: "transformers",
    status: "provisional",
    dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
    dependencyScope: "dedicated_runtime_package_only",
    tokenizerConfigReview: createLocalEmbeddingTokenizerConfigIntegrationReview(),
    runtimeDependenciesIntroduced: false,
    executionEnabled: false,
    requiredGates: requiredGates.map((gate) => ({ ...gate })),
    forbiddenDependencyLocations: [...forbiddenDependencyLocations],
    reasons: requiredGates.map((gate) => gate.reason)
  };
}

export function createApprovedLocalEmbeddingRuntimeStrategy(
  overrides: Partial<LocalEmbeddingRuntimeStrategy> = {}
): LocalEmbeddingRuntimeStrategy {
  return {
    ...createLocalEmbeddingRuntimeStrategy(),
    status: "approved",
    packageBoundary: {
      dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
      packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
      compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
      runtimeDependenciesIntroduced: false,
      forbiddenDependencyLocations: [...forbiddenDependencyLocations]
    },
    processIsolation: {
      mode: "supervised_child_process",
      supervisor: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
      ipc: "private_child_process_ipc",
      resourceLeaseRequired: true,
      sanitizedFailureReporting: true,
      directShellExecutionAllowed: false,
      modelOutputActionPolicy: "validated_intent_only"
    },
    windowsPackaging: {
      status: "planned",
      bundledModelArtifacts: false,
      cachePathCommitted: false,
      installerBundling: "deferred",
      updateRollbackPlanRequired: true,
      noticeBundleRequired: true
    },
    tokenizerConfigReview:
      createApprovedLocalEmbeddingTokenizerConfigIntegrationReview(),
    runtimeDependenciesIntroduced: false,
    executionEnabled: false,
    requiredGates: requiredGates.map((gate) => ({
      ...gate,
      satisfied: true,
      reason: ""
    })),
    reasons: [],
    ...overrides
  };
}

export function isLocalEmbeddingRuntimeStrategyApproved(
  strategy: LocalEmbeddingRuntimeStrategy
): boolean {
  return (
    strategy.runtime === "transformers" &&
    strategy.status === "approved" &&
    strategy.dedicatedPackageName === LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME &&
    strategy.dependencyScope === "dedicated_runtime_package_only" &&
    strategy.runtimeDependenciesIntroduced === false &&
    strategy.executionEnabled === false &&
    isLocalEmbeddingTokenizerConfigIntegrationReviewApproved(
      strategy.tokenizerConfigReview
    ) &&
    strategy.requiredGates.length === requiredGates.length &&
    requiredGateKeys.every((key) =>
      strategy.requiredGates.some(
        (gate) => gate.key === key && gate.satisfied && gate.reason === ""
      )
    ) &&
    forbiddenDependencyLocations.every((location) =>
      strategy.forbiddenDependencyLocations.includes(location)
    ) &&
    isPackageBoundaryApproved(strategy.packageBoundary) &&
    isProcessIsolationPlanApproved(strategy.processIsolation) &&
    isWindowsPackagingPlanApproved(strategy.windowsPackaging)
  );
}

function isPackageBoundaryApproved(
  boundary: LocalEmbeddingRuntimePackageBoundary | undefined
): boolean {
  return (
    boundary?.dedicatedPackageName === LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME &&
    boundary.packageLocation === LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION &&
    boundary.compositionRoot === LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT &&
    boundary.runtimeDependenciesIntroduced === false &&
    forbiddenDependencyLocations.every((location) =>
      boundary.forbiddenDependencyLocations.includes(location)
    )
  );
}

function isProcessIsolationPlanApproved(
  plan: LocalEmbeddingRuntimeProcessIsolationPlan | undefined
): boolean {
  return (
    plan?.mode === "supervised_child_process" &&
    plan.supervisor === LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT &&
    plan.ipc === "private_child_process_ipc" &&
    plan.resourceLeaseRequired === true &&
    plan.sanitizedFailureReporting === true &&
    plan.directShellExecutionAllowed === false &&
    plan.modelOutputActionPolicy === "validated_intent_only"
  );
}

function isWindowsPackagingPlanApproved(
  plan: LocalEmbeddingWindowsPackagingPlan | undefined
): boolean {
  return (
    plan?.status === "planned" &&
    plan.bundledModelArtifacts === false &&
    plan.cachePathCommitted === false &&
    plan.installerBundling === "deferred" &&
    plan.updateRollbackPlanRequired === true &&
    plan.noticeBundleRequired === true
  );
}
