import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import { LOCAL_EMBEDDING_SELECTED_REVISION } from "./local-embedding-revision-approval";

export type LocalEmbeddingArtifactDigestCaptureStepKey =
  | "revision.approved"
  | "required_set.confirmed"
  | "digest.method_defined"
  | "temporary_workspace_isolated"
  | "signed_urls.absent"
  | "credentials.absent"
  | "cache_paths.sanitized"
  | "network_source_read_only"
  | "double_verification_defined"
  | "digest_values_deferred"
  | "downloads.disabled"
  | "pinning.disabled"
  | "execution.disabled"
  | "verification.clean";

export interface LocalEmbeddingArtifactDigestCaptureInput {
  revisionApproved?: boolean;
  requiredSetConfirmed?: boolean;
  digestMethodDefined?: boolean;
  temporaryWorkspaceIsolated?: boolean;
  signedUrlsAbsent?: boolean;
  credentialsAbsent?: boolean;
  cachePathsSanitized?: boolean;
  networkSourceReadOnly?: boolean;
  doubleVerificationDefined?: boolean;
  digestValuesCaptured?: boolean;
  downloadEnabled?: boolean;
  pinningEnabled?: boolean;
  executionEnabled?: boolean;
  verificationClean?: boolean;
}

export interface LocalEmbeddingArtifactDigestCaptureStep {
  key: LocalEmbeddingArtifactDigestCaptureStepKey;
  satisfied: boolean;
  reason: string;
}

export interface LocalEmbeddingArtifactDigestCaptureProcedure {
  provider: string;
  modelId: string;
  source: "huggingface";
  revision: string;
  status: "pending" | "ready_for_approval";
  downloadEnabled: false;
  pinningEnabled: false;
  executionEnabled: false;
  digestValuesExposed: false;
  steps: LocalEmbeddingArtifactDigestCaptureStep[];
  reasons: string[];
}

export function createLocalEmbeddingArtifactDigestCaptureProcedure(
  input: LocalEmbeddingArtifactDigestCaptureInput = {}
): LocalEmbeddingArtifactDigestCaptureProcedure {
  const steps: LocalEmbeddingArtifactDigestCaptureStep[] = [
    step(
      "revision.approved",
      input.revisionApproved === true,
      "Approve the immutable upstream revision before digest capture."
    ),
    step(
      "required_set.confirmed",
      input.requiredSetConfirmed === true,
      "Confirm the required artifact set before digest capture."
    ),
    step(
      "digest.method_defined",
      input.digestMethodDefined === true,
      "Define SHA-256 capture tooling and command logging before approval."
    ),
    step(
      "temporary_workspace_isolated",
      input.temporaryWorkspaceIsolated === true,
      "Use an isolated temporary workspace for artifact inspection."
    ),
    step(
      "signed_urls.absent",
      input.signedUrlsAbsent === true,
      "Keep signed URLs and secret-bearing URLs out of committed records."
    ),
    step(
      "credentials.absent",
      input.credentialsAbsent === true,
      "Keep credentials, tokens, API keys, and auth headers out of committed records."
    ),
    step(
      "cache_paths.sanitized",
      input.cachePathsSanitized === true,
      "Sanitize local cache paths and private machine paths from summaries."
    ),
    step(
      "network_source_read_only",
      input.networkSourceReadOnly === true,
      "Use read-only upstream access without enabling application download paths."
    ),
    step(
      "double_verification_defined",
      input.doubleVerificationDefined === true,
      "Define a second verification pass before recording any digest value."
    ),
    step(
      "digest_values_deferred",
      input.digestValuesCaptured === false,
      "Keep real digest values out until a separately approved digest pinning wave."
    ),
    step(
      "downloads.disabled",
      input.downloadEnabled === false,
      "Keep application download paths disabled during digest capture approval."
    ),
    step(
      "pinning.disabled",
      input.pinningEnabled === false,
      "Keep artifact pin approval disabled until digest values are separately approved."
    ),
    step(
      "execution.disabled",
      input.executionEnabled === false,
      "Keep local embedding execution disabled during digest capture approval."
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
    source: "huggingface",
    revision: LOCAL_EMBEDDING_SELECTED_REVISION,
    status: reasons.length === 0 ? "ready_for_approval" : "pending",
    downloadEnabled: false,
    pinningEnabled: false,
    executionEnabled: false,
    digestValuesExposed: false,
    steps,
    reasons
  };
}

function step(
  key: LocalEmbeddingArtifactDigestCaptureStepKey,
  satisfied: boolean,
  reason: string
): LocalEmbeddingArtifactDigestCaptureStep {
  return { key, satisfied, reason: satisfied ? "" : reason };
}
