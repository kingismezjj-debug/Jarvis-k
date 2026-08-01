import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";

export type LocalEmbeddingRevisionSelectionStepKey =
  | "scope.confirmed"
  | "source.verified"
  | "revision.immutable"
  | "download.disabled"
  | "artifact.pin_deferred"
  | "approval.record_local"
  | "verification.clean";

export interface LocalEmbeddingRevisionSelectionInput {
  modelId?: string;
  source?: "huggingface";
  candidateRevision?: string;
  downloadEnabled?: boolean;
  artifactPinningDeferred?: boolean;
  approvalRecordLocal?: boolean;
  verificationClean?: boolean;
}

export interface LocalEmbeddingRevisionSelectionStep {
  key: LocalEmbeddingRevisionSelectionStepKey;
  satisfied: boolean;
  reason: string;
}

export interface LocalEmbeddingRevisionSelectionProcedure {
  provider: string;
  modelId: string;
  status: "pending" | "ready_for_approval";
  downloadEnabled: false;
  artifactPinningEnabled: false;
  selectedRevisionExposed: false;
  steps: LocalEmbeddingRevisionSelectionStep[];
  reasons: string[];
}

const FLOATING_REVISIONS = new Set(["HEAD", "latest", "main", "master"]);

export function createLocalEmbeddingRevisionSelectionProcedure(
  input: LocalEmbeddingRevisionSelectionInput = {}
): LocalEmbeddingRevisionSelectionProcedure {
  const revision = input.candidateRevision?.trim();
  const steps: LocalEmbeddingRevisionSelectionStep[] = [
    step(
      "scope.confirmed",
      input.modelId === LOCAL_EMBEDDING_MODEL_ID,
      "Confirm the revision-selection wave is scoped to the planned embedding model."
    ),
    step(
      "source.verified",
      input.source === "huggingface",
      "Confirm the source is the planned Hugging Face model boundary."
    ),
    step(
      "revision.immutable",
      revision !== undefined &&
        revision.length > 0 &&
        !FLOATING_REVISIONS.has(revision),
      "Select an immutable upstream revision; floating branches are blocked."
    ),
    step(
      "download.disabled",
      input.downloadEnabled === false,
      "Keep downloads disabled during revision selection."
    ),
    step(
      "artifact.pin_deferred",
      input.artifactPinningDeferred === true,
      "Defer artifact pinning and SHA-256 digests to a later approved wave."
    ),
    step(
      "approval.record_local",
      input.approvalRecordLocal === true,
      "Keep the revision approval record provider-local."
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
    artifactPinningEnabled: false,
    selectedRevisionExposed: false,
    steps,
    reasons
  };
}

function step(
  key: LocalEmbeddingRevisionSelectionStepKey,
  satisfied: boolean,
  reason: string
): LocalEmbeddingRevisionSelectionStep {
  return {
    key,
    satisfied,
    reason: satisfied ? "" : reason
  };
}
