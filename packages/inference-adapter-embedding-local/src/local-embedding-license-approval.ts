import type { ModelManifest } from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_MODEL_ID } from "./local-embedding-constants";

export type LocalEmbeddingLicenseApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface LocalEmbeddingLicenseApprovalRecord {
  modelId: string;
  source: "huggingface";
  license: "Apache-2.0";
  status: LocalEmbeddingLicenseApprovalStatus;
  redistributionReviewed: boolean;
  downloadEnabled: false;
  reasons: string[];
}

export function createLocalEmbeddingLicenseApprovalRecord(
  overrides: Partial<LocalEmbeddingLicenseApprovalRecord> = {}
): LocalEmbeddingLicenseApprovalRecord {
  return {
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    source: "huggingface",
    license: "Apache-2.0",
    status: "pending",
    redistributionReviewed: false,
    downloadEnabled: false,
    reasons: [
      "License review is pending manual approval.",
      "Redistribution review is pending manual approval.",
      "Downloads remain disabled until license and redistribution review pass."
    ],
    ...overrides
  };
}

export function isLocalEmbeddingLicenseApprovalRecordApproved(
  record: LocalEmbeddingLicenseApprovalRecord,
  manifest: ModelManifest
): boolean {
  return (
    record.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    record.modelId === manifest.id &&
    record.source === manifest.source &&
    record.license === "Apache-2.0" &&
    record.license === manifest.license &&
    record.status === "approved" &&
    record.redistributionReviewed &&
    record.downloadEnabled === false &&
    manifest.licenseRisk !== "red"
  );
}
