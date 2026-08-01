import type { ModelRuntime } from "@jarvis-k/contracts";

export const LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME =
  "@jarvis-k/inference-runtime-transformers-local";

export interface LocalEmbeddingRuntimeStrategy {
  runtime: ModelRuntime;
  status: "provisional" | "approved";
  dedicatedPackageName: string;
  dependencyScope:
    | "dedicated_runtime_package_only"
    | "not_allowed";
  requiredGates: LocalEmbeddingRuntimeGate[];
  forbiddenDependencyLocations: string[];
  reasons: string[];
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

export function createLocalEmbeddingRuntimeStrategy(): LocalEmbeddingRuntimeStrategy {
  return {
    runtime: "transformers",
    status: "provisional",
    dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
    dependencyScope: "dedicated_runtime_package_only",
    requiredGates: requiredGates.map((gate) => ({ ...gate })),
    forbiddenDependencyLocations: [
      "packages/contracts",
      "packages/capabilities",
      "packages/core",
      "apps/desktop",
      "apps/ui"
    ],
    reasons: requiredGates.map((gate) => gate.reason)
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
    strategy.requiredGates.length > 0 &&
    strategy.requiredGates.every((gate) => gate.satisfied) &&
    strategy.forbiddenDependencyLocations.includes("packages/core") &&
    strategy.forbiddenDependencyLocations.includes("apps/ui")
  );
}
