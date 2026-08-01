import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import {
  LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME
} from "./local-embedding-runtime-strategy";

export type LocalEmbeddingRuntimeDependencySelectionStatus =
  | "pending"
  | "approved"
  | "rejected";

export type LocalEmbeddingRuntimeDependencyRoute =
  | "unselected"
  | "python_transformers_child_process"
  | "transformers_js_child_process"
  | "onnx_runtime_child_process";

export type LocalEmbeddingRuntimeDependencyRouteDecision =
  | "preferred"
  | "deferred"
  | "rejected";

export interface LocalEmbeddingRuntimeDependencyCandidate {
  route: Exclude<LocalEmbeddingRuntimeDependencyRoute, "unselected">;
  decision: LocalEmbeddingRuntimeDependencyRouteDecision;
  implementationScope: "dedicated_runtime_package_only";
  childProcessIsolationRequired: true;
  licenseReviewRequiredBeforeDependencyAddition: true;
  nativeDependencyReviewRequiredBeforeDependencyAddition: true;
  benchmarkRequiredBeforeExecution: true;
  runtimeDependenciesIntroduced: false;
  concretePackageVersionsSelected: false;
  reasons: string[];
}

export interface LocalEmbeddingRuntimeDependencySelectionDecision {
  selectedRoute: LocalEmbeddingRuntimeDependencyRoute;
  selectionReason: string;
  dependencyAdditionApproved: false;
  concretePackageVersionsSelected: false;
  runtimeDependencyPackageAllowlist: string[];
  futureDependencyReviewRequired: true;
  futureVersionPinningRequired: true;
  futureNoticeBundleUpdateRequired: true;
}

export interface LocalEmbeddingRuntimeDependencyGuardrails {
  dependenciesOnlyInDedicatedRuntimePackage: true;
  protectedPackagesRemainDependencyFree: true;
  coreHostCompositionOnly: true;
  childProcessIsolationRequired: true;
  resourceLeaseRequiredBeforeModelLoad: true;
  licenseReviewRequiredBeforeDependencyAddition: true;
  nativeDependencyReviewRequiredBeforeDependencyAddition: true;
  benchmarkRequiredBeforeExecution: true;
  fallbackProviderRequired: true;
}

export interface LocalEmbeddingRuntimeDependencySelectionApprovalRecord {
  provider: string;
  modelId: string;
  runtime: "transformers";
  dedicatedPackageName: string;
  packageLocation: string;
  compositionRoot: string;
  status: LocalEmbeddingRuntimeDependencySelectionStatus;
  decision: LocalEmbeddingRuntimeDependencySelectionDecision;
  candidates: LocalEmbeddingRuntimeDependencyCandidate[];
  guardrails: LocalEmbeddingRuntimeDependencyGuardrails;
  runtimeDependenciesIntroduced: false;
  downloadEnabled: false;
  executionEnabled: false;
  dependencyValuesExposed: false;
  reasons: string[];
}

const selectedRoute: LocalEmbeddingRuntimeDependencyRoute =
  "python_transformers_child_process";

const candidateRoutes: LocalEmbeddingRuntimeDependencyCandidate[] = [
  {
    route: "python_transformers_child_process",
    decision: "preferred",
    implementationScope: "dedicated_runtime_package_only",
    childProcessIsolationRequired: true,
    licenseReviewRequiredBeforeDependencyAddition: true,
    nativeDependencyReviewRequiredBeforeDependencyAddition: true,
    benchmarkRequiredBeforeExecution: true,
    runtimeDependenciesIntroduced: false,
    concretePackageVersionsSelected: false,
    reasons: [
      "Best future fidelity path for the selected Transformers embedding model.",
      "Must remain isolated behind the dedicated runtime package and child-process boundary."
    ]
  },
  {
    route: "transformers_js_child_process",
    decision: "deferred",
    implementationScope: "dedicated_runtime_package_only",
    childProcessIsolationRequired: true,
    licenseReviewRequiredBeforeDependencyAddition: true,
    nativeDependencyReviewRequiredBeforeDependencyAddition: true,
    benchmarkRequiredBeforeExecution: true,
    runtimeDependenciesIntroduced: false,
    concretePackageVersionsSelected: false,
    reasons: [
      "Deferred until tokenizer, pooling, and model compatibility are proven.",
      "Still requires separate dependency, packaging, and benchmark review before use."
    ]
  },
  {
    route: "onnx_runtime_child_process",
    decision: "deferred",
    implementationScope: "dedicated_runtime_package_only",
    childProcessIsolationRequired: true,
    licenseReviewRequiredBeforeDependencyAddition: true,
    nativeDependencyReviewRequiredBeforeDependencyAddition: true,
    benchmarkRequiredBeforeExecution: true,
    runtimeDependenciesIntroduced: false,
    concretePackageVersionsSelected: false,
    reasons: [
      "Deferred until an approved model conversion and tokenizer/pooling parity plan exists.",
      "Native runtime and redistribution review are required before use."
    ]
  }
];

export function createLocalEmbeddingRuntimeDependencySelectionApprovalRecord(
  overrides: Partial<LocalEmbeddingRuntimeDependencySelectionApprovalRecord> = {}
): LocalEmbeddingRuntimeDependencySelectionApprovalRecord {
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
    packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
    compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
    status: "pending",
    decision: {
      selectedRoute: "unselected",
      selectionReason: "Runtime dependency route selection is pending.",
      dependencyAdditionApproved: false,
      concretePackageVersionsSelected: false,
      runtimeDependencyPackageAllowlist: [],
      futureDependencyReviewRequired: true,
      futureVersionPinningRequired: true,
      futureNoticeBundleUpdateRequired: true
    },
    candidates: candidateRoutes.map((candidate) => ({ ...candidate })),
    guardrails: {
      dependenciesOnlyInDedicatedRuntimePackage: true,
      protectedPackagesRemainDependencyFree: true,
      coreHostCompositionOnly: true,
      childProcessIsolationRequired: true,
      resourceLeaseRequiredBeforeModelLoad: true,
      licenseReviewRequiredBeforeDependencyAddition: true,
      nativeDependencyReviewRequiredBeforeDependencyAddition: true,
      benchmarkRequiredBeforeExecution: true,
      fallbackProviderRequired: true
    },
    runtimeDependenciesIntroduced: false,
    downloadEnabled: false,
    executionEnabled: false,
    dependencyValuesExposed: false,
    reasons: [
      "Runtime dependency selection is pending.",
      "Dependency addition, downloads, and execution remain disabled."
    ],
    ...overrides
  };
}

export function createApprovedLocalEmbeddingRuntimeDependencySelectionApprovalRecord(
  overrides: Partial<LocalEmbeddingRuntimeDependencySelectionApprovalRecord> = {}
): LocalEmbeddingRuntimeDependencySelectionApprovalRecord {
  return createLocalEmbeddingRuntimeDependencySelectionApprovalRecord({
    status: "approved",
    decision: {
      selectedRoute,
      selectionReason:
        "Prefer a supervised Python Transformers child-process route for future fidelity, while keeping dependency addition unapproved.",
      dependencyAdditionApproved: false,
      concretePackageVersionsSelected: false,
      runtimeDependencyPackageAllowlist: [],
      futureDependencyReviewRequired: true,
      futureVersionPinningRequired: true,
      futureNoticeBundleUpdateRequired: true
    },
    reasons: [
      "Runtime dependency route selection is approved without adding dependencies.",
      "Concrete package versions, dependency allowlists, downloads, and execution remain deferred."
    ],
    ...overrides
  });
}

export function isLocalEmbeddingRuntimeDependencySelectionApprovalRecordApproved(
  record: LocalEmbeddingRuntimeDependencySelectionApprovalRecord
): boolean {
  return (
    record.provider === LOCAL_EMBEDDING_PROVIDER_ID &&
    record.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    record.runtime === "transformers" &&
    record.dedicatedPackageName === LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME &&
    record.packageLocation === LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION &&
    record.compositionRoot === LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT &&
    record.status === "approved" &&
    record.runtimeDependenciesIntroduced === false &&
    record.downloadEnabled === false &&
    record.executionEnabled === false &&
    record.dependencyValuesExposed === false &&
    isSelectionDecisionApproved(record.decision) &&
    areDependencyCandidatesApproved(record.candidates) &&
    areDependencyGuardrailsApproved(record.guardrails)
  );
}

function isSelectionDecisionApproved(
  decision: LocalEmbeddingRuntimeDependencySelectionDecision
): boolean {
  return (
    decision.selectedRoute === selectedRoute &&
    decision.selectionReason.length > 0 &&
    decision.dependencyAdditionApproved === false &&
    decision.concretePackageVersionsSelected === false &&
    decision.runtimeDependencyPackageAllowlist.length === 0 &&
    decision.futureDependencyReviewRequired === true &&
    decision.futureVersionPinningRequired === true &&
    decision.futureNoticeBundleUpdateRequired === true
  );
}

function areDependencyCandidatesApproved(
  candidates: LocalEmbeddingRuntimeDependencyCandidate[]
): boolean {
  return (
    candidates.length === candidateRoutes.length &&
    candidateRoutes.every((expected) =>
      candidates.some(
        (candidate) =>
          candidate.route === expected.route &&
          candidate.decision === expected.decision &&
          candidate.implementationScope === "dedicated_runtime_package_only" &&
          candidate.childProcessIsolationRequired === true &&
          candidate.licenseReviewRequiredBeforeDependencyAddition === true &&
          candidate.nativeDependencyReviewRequiredBeforeDependencyAddition ===
            true &&
          candidate.benchmarkRequiredBeforeExecution === true &&
          candidate.runtimeDependenciesIntroduced === false &&
          candidate.concretePackageVersionsSelected === false
      )
    )
  );
}

function areDependencyGuardrailsApproved(
  guardrails: LocalEmbeddingRuntimeDependencyGuardrails
): boolean {
  return (
    guardrails.dependenciesOnlyInDedicatedRuntimePackage === true &&
    guardrails.protectedPackagesRemainDependencyFree === true &&
    guardrails.coreHostCompositionOnly === true &&
    guardrails.childProcessIsolationRequired === true &&
    guardrails.resourceLeaseRequiredBeforeModelLoad === true &&
    guardrails.licenseReviewRequiredBeforeDependencyAddition === true &&
    guardrails.nativeDependencyReviewRequiredBeforeDependencyAddition === true &&
    guardrails.benchmarkRequiredBeforeExecution === true &&
    guardrails.fallbackProviderRequired === true
  );
}
