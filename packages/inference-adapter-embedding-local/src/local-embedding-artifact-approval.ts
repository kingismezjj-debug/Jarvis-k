import {
  createLocalEmbeddingArtifactPlan,
  createPinnedLocalEmbeddingArtifactPlan,
  type LocalEmbeddingArtifactPlan,
  type LocalEmbeddingArtifactRole
} from "./local-embedding-artifact-plan";
import { LOCAL_EMBEDDING_MODEL_ID } from "./local-embedding-constants";
import { LOCAL_EMBEDDING_SELECTED_REVISION } from "./local-embedding-revision-approval";

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
  digestCapturePrepared?: boolean;
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
      digestCapturePrepared: false,
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

export function createPreparedLocalEmbeddingArtifactDigestApprovalRecord(): LocalEmbeddingArtifactPinApprovalRecord {
  return createLocalEmbeddingArtifactPinApprovalRecord({
    status: "pending",
    downloadEnabled: false,
    artifacts: createLocalEmbeddingArtifactPlan().artifacts.map(
      (artifact) => ({
        key: artifact.key,
        role: artifact.role,
        status: "pending",
        revision: LOCAL_EMBEDDING_SELECTED_REVISION,
        digestCapturePrepared: true,
        reasons: [
          "Artifact digest slot is prepared for the approved revision.",
          "SHA-256 digest value is deferred to a later approval wave."
        ]
      })
    ),
    reasons: [
      "Artifact digest approval record is prepared but pending.",
      "SHA-256 digest values are deferred to a later approval wave.",
      "Downloads remain disabled until every artifact pin is approved."
    ]
  });
}

export function createApprovedLocalEmbeddingArtifactPinApprovalRecord(): LocalEmbeddingArtifactPinApprovalRecord {
  const pinnedPlan = createPinnedLocalEmbeddingArtifactPlan();
  return createLocalEmbeddingArtifactPinApprovalRecord({
    status: "approved",
    downloadEnabled: false,
    artifacts: pinnedPlan.artifacts.map((artifact) => {
      const revision = requiredPinValue(
        artifact.revision,
        `Missing approved artifact revision for ${artifact.key}.`
      );
      const sha256 = requiredPinValue(
        artifact.sha256,
        `Missing approved artifact digest for ${artifact.key}.`
      );

      return {
        key: artifact.key,
        role: artifact.role,
        status: "approved",
        revision,
        sha256,
        digestCapturePrepared: true,
        reasons: []
      };
    }),
    reasons: [
      "Every required artifact pin is approved for the selected immutable revision.",
      "Every required artifact SHA-256 digest is approved.",
      "Downloads remain disabled until later runtime and packaging gates are approved."
    ]
  });
}

export function isLocalEmbeddingArtifactDigestApprovalRecordPrepared(
  record: LocalEmbeddingArtifactPinApprovalRecord,
  plan: LocalEmbeddingArtifactPlan = createLocalEmbeddingArtifactPlan()
): boolean {
  return (
    record.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    record.modelId === plan.modelId &&
    record.source === "huggingface" &&
    record.status === "pending" &&
    record.downloadEnabled === false &&
    plan.downloadEnabled === false &&
    plan.artifacts.length > 0 &&
    plan.artifacts.every((artifact) => {
      const approval = record.artifacts.find(
        (candidate) =>
          candidate.key === artifact.key &&
          candidate.role === artifact.role
      );
      return (
        approval?.status === "pending" &&
        approval.revision === LOCAL_EMBEDDING_SELECTED_REVISION &&
        approval.sha256 === undefined &&
        approval.digestCapturePrepared === true
      );
    })
  );
}

function requiredPinValue(value: string | undefined, message: string): string {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
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
        approval.digestCapturePrepared === true &&
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
