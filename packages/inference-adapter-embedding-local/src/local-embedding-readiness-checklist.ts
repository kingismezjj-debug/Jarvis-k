import type { ModelManifest } from "@jarvis-k/contracts";
import {
  createLocalEmbeddingArtifactPinApprovalRecord,
  isLocalEmbeddingArtifactPinApprovalRecordApproved,
  type LocalEmbeddingArtifactPinApprovalRecord
} from "./local-embedding-artifact-approval";
import {
  createLocalEmbeddingArtifactPlan,
  type LocalEmbeddingArtifactPlan
} from "./local-embedding-artifact-plan";
import {
  createLocalEmbeddingBenchmarkApprovalRecord,
  isLocalEmbeddingBenchmarkApprovalRecordApproved,
  type LocalEmbeddingBenchmarkApprovalRecord
} from "./local-embedding-benchmark-approval";
import {
  isLocalEmbeddingResourceProfileAlternativeEvidenceAccepted,
  type LocalEmbeddingResourceProfileAlternativeEvidenceResult
} from "./local-embedding-resource-profile-alternative-evidence";
import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import {
  createLocalEmbeddingLicenseApprovalRecord,
  isLocalEmbeddingLicenseApprovalRecordApproved,
  type LocalEmbeddingLicenseApprovalRecord
} from "./local-embedding-license-approval";
import {
  createLocalEmbeddingRevisionApprovalRecord,
  isLocalEmbeddingRevisionApproved,
  type LocalEmbeddingRevisionApprovalRecord
} from "./local-embedding-revision-approval";
import {
  createLocalEmbeddingRuntimeStrategy,
  isLocalEmbeddingRuntimeStrategyApproved,
  type LocalEmbeddingRuntimeStrategy
} from "./local-embedding-runtime-strategy";

export type LocalEmbeddingReadinessChecklistKey =
  | "model.revision"
  | "artifact.pins"
  | "runtime.strategy"
  | "license.redistribution_review"
  | "benchmarks.local_resource_profile";

export interface LocalEmbeddingReadinessChecklistInput {
  manifest?: ModelManifest;
  artifactPlan?: LocalEmbeddingArtifactPlan;
  revisionApproval?: LocalEmbeddingRevisionApprovalRecord;
  artifactPinApproval?: LocalEmbeddingArtifactPinApprovalRecord;
  runtimeStrategy?: LocalEmbeddingRuntimeStrategy;
  licenseApproval?: LocalEmbeddingLicenseApprovalRecord;
  benchmarkApproval?: LocalEmbeddingBenchmarkApprovalRecord;
  resourceProfileAlternativeEvidence?: LocalEmbeddingResourceProfileAlternativeEvidenceResult;
}

export interface LocalEmbeddingReadinessChecklistItem {
  key: LocalEmbeddingReadinessChecklistKey;
  status: "pending" | "approved" | "rejected" | "provisional";
  satisfied: boolean;
  reasons: string[];
}

export interface LocalEmbeddingReadinessChecklist {
  provider: string;
  modelId: string;
  downloadEnabled: false;
  executionEnabled: false;
  readyForCompositionReview: boolean;
  items: LocalEmbeddingReadinessChecklistItem[];
  reasons: string[];
}

export function createLocalEmbeddingReadinessChecklist(
  input: LocalEmbeddingReadinessChecklistInput = {}
): LocalEmbeddingReadinessChecklist {
  const artifactPlan =
    input.artifactPlan ?? createLocalEmbeddingArtifactPlan();
  const revisionApproval =
    input.revisionApproval ?? createLocalEmbeddingRevisionApprovalRecord();
  const artifactPinApproval =
    input.artifactPinApproval ??
    createLocalEmbeddingArtifactPinApprovalRecord();
  const runtimeStrategy =
    input.runtimeStrategy ?? createLocalEmbeddingRuntimeStrategy();
  const licenseApproval =
    input.licenseApproval ?? createLocalEmbeddingLicenseApprovalRecord();
  const benchmarkApproval =
    input.benchmarkApproval ?? createLocalEmbeddingBenchmarkApprovalRecord();

  const items: LocalEmbeddingReadinessChecklistItem[] = [
    {
      key: "model.revision",
      status: revisionApproval.status,
      satisfied: isLocalEmbeddingRevisionApproved(
        revisionApproval,
        input.manifest?.revision
      ),
      reasons: [...revisionApproval.reasons]
    },
    {
      key: "artifact.pins",
      status: artifactPinApproval.status,
      satisfied: isLocalEmbeddingArtifactPinApprovalRecordApproved(
        artifactPinApproval,
        artifactPlan
      ),
      reasons: [...artifactPinApproval.reasons]
    },
    {
      key: "runtime.strategy",
      status: runtimeStrategy.status,
      satisfied: isLocalEmbeddingRuntimeStrategyApproved(runtimeStrategy),
      reasons: [...runtimeStrategy.reasons]
    },
    {
      key: "license.redistribution_review",
      status: licenseApproval.status,
      satisfied:
        input.manifest !== undefined &&
        isLocalEmbeddingLicenseApprovalRecordApproved(
          licenseApproval,
          input.manifest
        ),
      reasons:
        input.manifest === undefined
          ? [
              ...licenseApproval.reasons,
              "Approved manifest is required before license review can be evaluated."
            ]
          : [...licenseApproval.reasons]
    },
    {
      key: "benchmarks.local_resource_profile",
      status: isLocalEmbeddingResourceProfileAlternativeEvidenceAccepted(
        input.resourceProfileAlternativeEvidence
      )
        ? "approved"
        : benchmarkApproval.status,
      satisfied: isResourceProfileChecklistSatisfied(
        benchmarkApproval,
        input.resourceProfileAlternativeEvidence
      ),
      reasons: isLocalEmbeddingResourceProfileAlternativeEvidenceAccepted(
        input.resourceProfileAlternativeEvidence
      )
        ? []
        : [...benchmarkApproval.reasons]
    }
  ];

  const reasons = items.flatMap((item) =>
    item.satisfied ? [] : item.reasons
  );
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    downloadEnabled: false,
    executionEnabled: false,
    readyForCompositionReview: reasons.length === 0,
    items,
    reasons
  };
}

function isResourceProfileChecklistSatisfied(
  benchmarkApproval: LocalEmbeddingBenchmarkApprovalRecord,
  alternativeEvidence:
    | LocalEmbeddingResourceProfileAlternativeEvidenceResult
    | undefined
): boolean {
  return (
    isLocalEmbeddingResourceProfileAlternativeEvidenceAccepted(
      alternativeEvidence
    ) ||
    isLocalEmbeddingBenchmarkApprovalRecordApproved(benchmarkApproval)
  );
}
