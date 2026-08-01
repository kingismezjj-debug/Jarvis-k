import type { ModelManifest } from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_MODEL_ID } from "./local-embedding-constants";
import { LOCAL_EMBEDDING_SELECTED_REVISION } from "./local-embedding-revision-approval";

export type LocalEmbeddingLicenseApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface LocalEmbeddingLicenseApprovalRecord {
  modelId: string;
  source: "huggingface";
  license: "Apache-2.0";
  status: LocalEmbeddingLicenseApprovalStatus;
  metadataLicense?: "apache-2.0";
  metadataRevision?: string;
  modelWeightsReviewed?: boolean;
  tokenizerComponentsReviewed?: boolean;
  runtimeDependencyScope?: "none_added" | "pending_review" | "reviewed";
  nativeDependencyScope?: "none_added" | "pending_review" | "reviewed";
  redistributionTermsReviewed?: boolean;
  noticeBundleDefined?: boolean;
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

export function createApprovedLocalEmbeddingLicenseApprovalRecord(
  overrides: Partial<LocalEmbeddingLicenseApprovalRecord> = {}
): LocalEmbeddingLicenseApprovalRecord {
  return createLocalEmbeddingLicenseApprovalRecord({
    status: "approved",
    metadataLicense: "apache-2.0",
    metadataRevision: LOCAL_EMBEDDING_SELECTED_REVISION,
    modelWeightsReviewed: true,
    tokenizerComponentsReviewed: true,
    runtimeDependencyScope: "none_added",
    nativeDependencyScope: "none_added",
    redistributionTermsReviewed: true,
    noticeBundleDefined: true,
    redistributionReviewed: true,
    downloadEnabled: false,
    reasons: [
      "Apache-2.0 metadata is confirmed for the selected immutable revision.",
      "Model artifact redistribution review is approved for the current pinned artifact set.",
      "No runtime or native dependency license is approved by this record because no runtime package is added in this wave.",
      "Downloads remain disabled until later runtime and packaging gates are approved."
    ],
    ...overrides
  });
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
    record.metadataLicense === "apache-2.0" &&
    record.metadataRevision === manifest.revision &&
    record.modelWeightsReviewed === true &&
    record.tokenizerComponentsReviewed === true &&
    record.runtimeDependencyScope === "none_added" &&
    record.nativeDependencyScope === "none_added" &&
    record.redistributionTermsReviewed === true &&
    record.noticeBundleDefined === true &&
    record.downloadEnabled === false &&
    (manifest.licenseRisk === "green" || manifest.licenseRisk === "yellow")
  );
}
