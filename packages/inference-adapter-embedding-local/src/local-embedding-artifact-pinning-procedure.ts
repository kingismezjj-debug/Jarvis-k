import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";

export type LocalEmbeddingArtifactPinningStepKey =
  | "revision.approved"
  | "required_artifacts.confirmed"
  | "digests.verified"
  | "signed_urls.absent"
  | "downloads.disabled"
  | "approval.record_local"
  | "verification.clean";

export interface LocalEmbeddingArtifactPinningInput {
  revisionApproved?: boolean;
  requiredArtifactsConfirmed?: boolean;
  digestsVerified?: boolean;
  signedUrlsAbsent?: boolean;
  downloadEnabled?: boolean;
  approvalRecordLocal?: boolean;
  verificationClean?: boolean;
}

export interface LocalEmbeddingArtifactPinningStep {
  key: LocalEmbeddingArtifactPinningStepKey;
  satisfied: boolean;
  reason: string;
}

export interface LocalEmbeddingArtifactPinningProcedure {
  provider: string;
  modelId: string;
  status: "pending" | "ready_for_approval";
  downloadEnabled: false;
  artifactValuesExposed: false;
  steps: LocalEmbeddingArtifactPinningStep[];
  reasons: string[];
}

export function createLocalEmbeddingArtifactPinningProcedure(
  input: LocalEmbeddingArtifactPinningInput = {}
): LocalEmbeddingArtifactPinningProcedure {
  const steps: LocalEmbeddingArtifactPinningStep[] = [
    step(
      "revision.approved",
      input.revisionApproved === true,
      "Approve an immutable upstream revision before artifact pinning."
    ),
    step(
      "required_artifacts.confirmed",
      input.requiredArtifactsConfirmed === true,
      "Confirm every required artifact role before recording pins."
    ),
    step(
      "digests.verified",
      input.digestsVerified === true,
      "Verify SHA-256 digests for every required artifact."
    ),
    step(
      "signed_urls.absent",
      input.signedUrlsAbsent === true,
      "Keep signed URLs, credentials, and secret-bearing URLs out of committed artifacts."
    ),
    step(
      "downloads.disabled",
      input.downloadEnabled === false,
      "Keep downloads disabled until all artifact pins are approved."
    ),
    step(
      "approval.record_local",
      input.approvalRecordLocal === true,
      "Keep artifact pin approval records provider-local."
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
    status: reasons.length === 0 ? "ready_for_approval" : "pending",
    downloadEnabled: false,
    artifactValuesExposed: false,
    steps,
    reasons
  };
}

function step(
  key: LocalEmbeddingArtifactPinningStepKey,
  satisfied: boolean,
  reason: string
): LocalEmbeddingArtifactPinningStep {
  return {
    key,
    satisfied,
    reason: satisfied ? "" : reason
  };
}
