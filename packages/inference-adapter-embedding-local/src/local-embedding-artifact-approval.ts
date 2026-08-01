import {
  createLocalEmbeddingArtifactPlan,
  type LocalEmbeddingArtifactPlan,
  type LocalEmbeddingArtifactRole
} from "./local-embedding-artifact-plan";
import { LOCAL_EMBEDDING_MODEL_ID } from "./local-embedding-constants";

export type LocalEmbeddingArtifactPinApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface LocalEmbeddingArtifactPinApproval {
  key: string;
  role: LocalEmbeddingArtifactRole;
  status: LocalEmbeddingArtifactPinApprovalStatus;
  revision?: string;
  sha256?: string;
  reasons: string[];
}

export interface LocalEmbeddingArtifactPinApprovalRecord {
  modelId: string;
  source: "huggingface";
  status: LocalEmbeddingArtifactPinApprovalStatus;
  downloadEnabled: false;
  artifacts: LocalEmbeddingArtifactPinApproval[];
  reasons: string[];
}

const FLOATING_REVISIONS = new Set(["HEAD", "latest", "main", "master"]);

export function createLocalEmbeddingArtifactPinApprovalRecord(
  overrides: Partial<LocalEmbeddingArtifactPinApprovalRecord> = {}
): LocalEmbeddingArtifactPinApprovalRecord {
  const artifactApprovals = createLocalEmbeddingArtifactPlan().artifacts.map(
    (artifact) => ({
      key: artifact.key,
      role: artifact.role,
      status: "pending" as const,
      reasons: [
        "Artifact revision pin is pending approval.",
        "Artifact SHA-256 digest is pending approval."
      ]
    })
  );

  return {
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    source: "huggingface",
    status: "pending",
    downloadEnabled: false,
    artifacts: artifactApprovals,
    reasons: [
      "Artifact pin approval is pending manual review.",
      "Downloads remain disabled until every artifact pin is approved."
    ],
    ...overrides
  };
}

export function isLocalEmbeddingArtifactPinApprovalRecordApproved(
  record: LocalEmbeddingArtifactPinApprovalRecord,
  plan: LocalEmbeddingArtifactPlan
): boolean {
  return (
    record.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    record.modelId === plan.modelId &&
    record.source === "huggingface" &&
    record.status === "approved" &&
    record.downloadEnabled === false &&
    plan.downloadEnabled === false &&
    plan.artifacts.length > 0 &&
    plan.artifacts.every((artifact) => {
      if (!artifact.required) {
        return true;
      }
      const approval = record.artifacts.find(
        (candidate) =>
          candidate.key === artifact.key &&
          candidate.role === artifact.role
      );
      const revision = approval?.revision?.trim();
      return (
        artifact.pinned &&
        approval?.status === "approved" &&
        revision !== undefined &&
        revision.length > 0 &&
        !FLOATING_REVISIONS.has(revision) &&
        revision === artifact.revision &&
        approval.sha256 === artifact.sha256 &&
        approval.sha256 !== undefined &&
        /^[a-f0-9]{64}$/.test(approval.sha256)
      );
    })
  );
}
