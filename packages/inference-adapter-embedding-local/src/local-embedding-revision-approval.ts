import { LOCAL_EMBEDDING_MODEL_ID } from "./local-embedding-constants";

export const LOCAL_EMBEDDING_SELECTED_REVISION =
  "97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3";

export type LocalEmbeddingRevisionApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface LocalEmbeddingRevisionApprovalRecord {
  modelId: string;
  source: "huggingface";
  status: LocalEmbeddingRevisionApprovalStatus;
  revision?: string;
  downloadEnabled: false;
  reasons: string[];
}

const FLOATING_REVISIONS = new Set(["HEAD", "latest", "main", "master"]);

export function createLocalEmbeddingRevisionApprovalRecord(
  overrides: Partial<LocalEmbeddingRevisionApprovalRecord> = {}
): LocalEmbeddingRevisionApprovalRecord {
  return {
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    source: "huggingface",
    status: "pending",
    downloadEnabled: false,
    reasons: [
      "Immutable upstream revision has not been selected.",
      "Revision approval is pending manual review."
    ],
    ...overrides
  };
}

export function createApprovedLocalEmbeddingRevisionApprovalRecord(): LocalEmbeddingRevisionApprovalRecord {
  return createLocalEmbeddingRevisionApprovalRecord({
    status: "approved",
    revision: LOCAL_EMBEDDING_SELECTED_REVISION,
    downloadEnabled: false,
    reasons: []
  });
}

export function isLocalEmbeddingRevisionApproved(
  record: LocalEmbeddingRevisionApprovalRecord,
  expectedRevision?: string
): boolean {
  const revision = record.revision?.trim();
  return (
    record.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    record.source === "huggingface" &&
    record.status === "approved" &&
    record.downloadEnabled === false &&
    revision !== undefined &&
    revision.length > 0 &&
    !FLOATING_REVISIONS.has(revision) &&
    (expectedRevision === undefined || revision === expectedRevision)
  );
}
