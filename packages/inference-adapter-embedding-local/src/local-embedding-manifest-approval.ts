import {
  ModelManifestSchema,
  type ModelManifest
} from "@jarvis-k/contracts";
import {
  createApprovedLocalEmbeddingArtifactPinApprovalRecord,
  isLocalEmbeddingArtifactPinApprovalRecordApproved,
  type LocalEmbeddingArtifactPinApprovalRecord
} from "./local-embedding-artifact-approval";
import {
  createPinnedLocalEmbeddingArtifactPlan,
  type LocalEmbeddingArtifactPlan
} from "./local-embedding-artifact-plan";
import { LOCAL_EMBEDDING_MODEL_ID } from "./local-embedding-constants";
import {
  createApprovedLocalEmbeddingRevisionApprovalRecord,
  isLocalEmbeddingRevisionApproved,
  LOCAL_EMBEDDING_SELECTED_REVISION,
  type LocalEmbeddingRevisionApprovalRecord
} from "./local-embedding-revision-approval";

export const LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES = 1_207_470_234;
export const LOCAL_EMBEDDING_MANIFEST_ARTIFACT_SET_SHA256 =
  "093578fd106d15504eb05b94422105146d6428947ea32aa79e7c7a0627f54200";

export type LocalEmbeddingManifestApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface LocalEmbeddingManifestApprovalRecord {
  modelId: string;
  source: "huggingface";
  status: LocalEmbeddingManifestApprovalStatus;
  manifest?: ModelManifest;
  artifactSetSha256?: string;
  downloadEnabled: false;
  reasons: string[];
}

export interface LocalEmbeddingManifestApprovalEvidence {
  revisionApproval: LocalEmbeddingRevisionApprovalRecord;
  artifactPlan: LocalEmbeddingArtifactPlan;
  artifactPinApproval: LocalEmbeddingArtifactPinApprovalRecord;
}

export function createLocalEmbeddingManifestApprovalRecord(
  overrides: Partial<LocalEmbeddingManifestApprovalRecord> = {}
): LocalEmbeddingManifestApprovalRecord {
  return {
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    source: "huggingface",
    status: "pending",
    downloadEnabled: false,
    reasons: [
      "Approved manifest is pending revision review.",
      "Approved manifest is pending artifact digest review.",
      "Downloads remain disabled until later runtime and packaging gates are approved."
    ],
    ...overrides
  };
}

export function createApprovedLocalEmbeddingManifest(): ModelManifest {
  return ModelManifestSchema.parse({
    id: LOCAL_EMBEDDING_MODEL_ID,
    capability: "embedding",
    source: "huggingface",
    revision: LOCAL_EMBEDDING_SELECTED_REVISION,
    license: "Apache-2.0",
    runtime: "transformers",
    sizeBytes: LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES,
    sha256: LOCAL_EMBEDDING_MANIFEST_ARTIFACT_SET_SHA256,
    licenseRisk: "yellow"
  });
}

export function createApprovedLocalEmbeddingManifestApprovalRecord(): LocalEmbeddingManifestApprovalRecord {
  const manifest = createApprovedLocalEmbeddingManifest();
  const artifactSetSha256 = requiredManifestValue(
    manifest.sha256,
    "Approved local embedding manifest must include the artifact set digest."
  );

  return createLocalEmbeddingManifestApprovalRecord({
    status: "approved",
    manifest,
    artifactSetSha256,
    downloadEnabled: false,
    reasons: [
      "Manifest is approved for the selected immutable revision and artifact digest set.",
      "Downloads remain disabled until later runtime and packaging gates are approved."
    ]
  });
}

export function isLocalEmbeddingManifestApprovalRecordApproved(
  record: LocalEmbeddingManifestApprovalRecord,
  evidence: LocalEmbeddingManifestApprovalEvidence = {
    revisionApproval: createApprovedLocalEmbeddingRevisionApprovalRecord(),
    artifactPlan: createPinnedLocalEmbeddingArtifactPlan(),
    artifactPinApproval: createApprovedLocalEmbeddingArtifactPinApprovalRecord()
  }
): boolean {
  const parsedManifest = ModelManifestSchema.safeParse(record.manifest);
  const manifest = parsedManifest.success ? parsedManifest.data : undefined;

  return (
    record.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    record.source === "huggingface" &&
    record.status === "approved" &&
    record.downloadEnabled === false &&
    manifest !== undefined &&
    manifest.id === LOCAL_EMBEDDING_MODEL_ID &&
    manifest.capability === "embedding" &&
    manifest.source === "huggingface" &&
    manifest.revision === LOCAL_EMBEDDING_SELECTED_REVISION &&
    manifest.license === "Apache-2.0" &&
    manifest.runtime === "transformers" &&
    manifest.sizeBytes === LOCAL_EMBEDDING_MANIFEST_SIZE_BYTES &&
    manifest.sha256 === LOCAL_EMBEDDING_MANIFEST_ARTIFACT_SET_SHA256 &&
    manifest.licenseRisk === "yellow" &&
    record.artifactSetSha256 === manifest.sha256 &&
    isLocalEmbeddingRevisionApproved(
      evidence.revisionApproval,
      manifest.revision
    ) &&
    isLocalEmbeddingArtifactPinApprovalRecordApproved(
      evidence.artifactPinApproval,
      evidence.artifactPlan
    )
  );
}

function requiredManifestValue(
  value: string | undefined,
  message: string
): string {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}
