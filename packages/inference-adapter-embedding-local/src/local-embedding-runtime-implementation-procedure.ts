import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import { LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME } from "./local-embedding-runtime-strategy";

export type LocalEmbeddingRuntimeImplementationStepKey =
  | "runtime.package_boundary_approved"
  | "runtime.helper_process_supervised"
  | "runtime.windows_packaging_documented"
  | "runtime.resource_scheduler_integrated"
  | "runtime.failure_degradation_defined"
  | "runtime.dependencies_deferred"
  | "execution.disabled"
  | "verification.clean";

export interface LocalEmbeddingRuntimeImplementationInput {
  packageBoundaryApproved?: boolean;
  helperProcessSupervised?: boolean;
  windowsPackagingDocumented?: boolean;
  resourceSchedulerIntegrated?: boolean;
  failureDegradationDefined?: boolean;
  runtimeDependenciesIntroduced?: boolean;
  executionEnabled?: boolean;
  verificationClean?: boolean;
}

export interface LocalEmbeddingRuntimeImplementationStep {
  key: LocalEmbeddingRuntimeImplementationStepKey;
  satisfied: boolean;
  reason: string;
}

export interface LocalEmbeddingRuntimeImplementationProcedure {
  provider: string;
  modelId: string;
  dedicatedPackageName: string;
  status: "pending" | "ready_for_approval";
  runtimeDependenciesIntroduced: false;
  executionEnabled: false;
  implementationValuesExposed: false;
  steps: LocalEmbeddingRuntimeImplementationStep[];
  reasons: string[];
}

export function createLocalEmbeddingRuntimeImplementationProcedure(
  input: LocalEmbeddingRuntimeImplementationInput = {}
): LocalEmbeddingRuntimeImplementationProcedure {
  const steps: LocalEmbeddingRuntimeImplementationStep[] = [
    step(
      "runtime.package_boundary_approved",
      input.packageBoundaryApproved === true,
      "Approve the dedicated runtime package boundary before implementation."
    ),
    step(
      "runtime.helper_process_supervised",
      input.helperProcessSupervised === true,
      "Define a supervised helper-process lifecycle outside Agent Core."
    ),
    step(
      "runtime.windows_packaging_documented",
      input.windowsPackagingDocumented === true,
      "Document Windows packaging, installation, update, and rollback behavior."
    ),
    step(
      "runtime.resource_scheduler_integrated",
      input.resourceSchedulerIntegrated === true,
      "Define resource scheduler leases and release behavior before model loading."
    ),
    step(
      "runtime.failure_degradation_defined",
      input.failureDegradationDefined === true,
      "Define sanitized startup, load, execution, and shutdown failure degradation."
    ),
    step(
      "runtime.dependencies_deferred",
      input.runtimeDependenciesIntroduced === false,
      "Keep runtime dependencies out until a separately approved implementation wave."
    ),
    step(
      "execution.disabled",
      input.executionEnabled === false,
      "Keep local embedding execution disabled during procedure approval."
    ),
    step(
      "verification.clean",
      input.verificationClean === true,
      "Pass boundary, sensitive-artifact, typecheck, and verify gates."
    )
  ];

  const reasons = steps.flatMap((item) =>
    item.satisfied ? [] : [item.reason]
  );

  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
    status: reasons.length === 0 ? "ready_for_approval" : "pending",
    runtimeDependenciesIntroduced: false,
    executionEnabled: false,
    implementationValuesExposed: false,
    steps,
    reasons
  };
}

function step(
  key: LocalEmbeddingRuntimeImplementationStepKey,
  satisfied: boolean,
  reason: string
): LocalEmbeddingRuntimeImplementationStep {
  return { key, satisfied, reason: satisfied ? "" : reason };
}
