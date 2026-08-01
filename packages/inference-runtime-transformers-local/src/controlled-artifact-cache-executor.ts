import type {
  TransformersLocalArtifactCacheState
} from "./artifact-cache-dry-run";
import type {
  TransformersLocalControlledArtifactDownloadApprovals,
  TransformersLocalControlledArtifactDownloadGuardResult,
  TransformersLocalControlledArtifactDownloadSideEffectRequest
} from "./controlled-artifact-download-guard";
import { TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME } from "./runtime-constants";

export type TransformersLocalControlledArtifactCacheExecutorOperation =
  | "prepare_download"
  | "verify_download"
  | "request_cleanup"
  | "request_rollback";

export interface TransformersLocalControlledArtifactCacheExecutorPolicy {
  packageName: string;
  planOnly: true;
  executionDeferred: true;
  stateMutationEnabled: false;
  networkAccessEnabled: false;
  fileSystemWritesEnabled: false;
  downloadEnabled: false;
  executionEnabled: false;
  modelArtifactsAccessed: false;
  signedUrlsPersisted: false;
  credentialMaterialPersisted: false;
  digestValuesExposed: false;
  sourceUrlsExposed: false;
}

export interface TransformersLocalControlledArtifactCacheExecutorInput {
  operation: TransformersLocalControlledArtifactCacheExecutorOperation;
  currentState: TransformersLocalArtifactCacheState;
  guardResult?: TransformersLocalControlledArtifactDownloadGuardResult;
  approvals?: Partial<
    Pick<
      TransformersLocalControlledArtifactDownloadApprovals,
      "partialCleanupApproved" | "rollbackApproved"
    >
  >;
  requestedOperations?: Partial<
    Record<
      TransformersLocalControlledArtifactDownloadSideEffectRequest,
      boolean
    >
  >;
}

export interface TransformersLocalControlledArtifactCacheExecutorResult {
  packageName: string;
  operation: TransformersLocalControlledArtifactCacheExecutorOperation;
  currentState: TransformersLocalArtifactCacheState;
  plannedState: TransformersLocalArtifactCacheState;
  accepted: boolean;
  planOnly: true;
  executionDeferred: true;
  stateMutationApplied: false;
  networkAccessEnabled: false;
  fileSystemWritesEnabled: false;
  downloadEnabled: false;
  executionEnabled: false;
  modelArtifactsAccessed: false;
  signedUrlsPersisted: false;
  credentialMaterialPersisted: false;
  digestValuesExposed: false;
  sourceUrlsExposed: false;
  reasons: string[];
}

export function createTransformersLocalControlledArtifactCacheExecutorPolicy(): TransformersLocalControlledArtifactCacheExecutorPolicy {
  return {
    packageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
    planOnly: true,
    executionDeferred: true,
    stateMutationEnabled: false,
    networkAccessEnabled: false,
    fileSystemWritesEnabled: false,
    downloadEnabled: false,
    executionEnabled: false,
    modelArtifactsAccessed: false,
    signedUrlsPersisted: false,
    credentialMaterialPersisted: false,
    digestValuesExposed: false,
    sourceUrlsExposed: false
  };
}

export function evaluateTransformersLocalControlledArtifactCacheExecutor(
  input: TransformersLocalControlledArtifactCacheExecutorInput
): TransformersLocalControlledArtifactCacheExecutorResult {
  const sideEffectsRequested = Object.values(
    input.requestedOperations ?? {}
  ).some((value) => value === true);
  const result = createResult(input, input.currentState, false, []);

  if (sideEffectsRequested) {
    result.reasons.push(
      "Requested network, filesystem, download, artifact, credential, URL, digest, or execution side effects are blocked."
    );
    return result;
  }

  switch (input.operation) {
    case "prepare_download":
      if (
        input.currentState === "pending" &&
        input.guardResult?.operation === "prepare_download" &&
        input.guardResult.accepted &&
        input.guardResult.readyForControlledDownload
      ) {
        return createResult(input, "downloading", true, [
          "Download preparation plan passed the existing controlled artifact guard.",
          "No network access, filesystem write, cache mutation, or model artifact access occurred.",
          "A future approved executor must perform the download in a separately approved wave."
        ]);
      }
      result.reasons.push(
        "Download preparation requires a matching accepted dry-run guard result from the pending state."
      );
      return result;
    case "verify_download":
      if (
        input.currentState === "verifying" &&
        input.guardResult?.operation === "verify_download" &&
        input.guardResult.accepted &&
        input.guardResult.readyForCacheReadyState
      ) {
        return createResult(input, "ready", true, [
          "Verification plan passed the existing SHA-256 guard.",
          "No artifact read, filesystem write, cache mutation, or model access occurred.",
          "Ready-state persistence remains deferred to a separately approved cache executor."
        ]);
      }
      result.reasons.push(
        "Verification requires a matching accepted dry-run guard result from the verifying state."
      );
      return result;
    case "request_cleanup":
      if (
        input.currentState === "corrupted" &&
        input.approvals?.partialCleanupApproved === true
      ) {
        return createResult(input, "cleanup_required", true, [
          "Cleanup request is staged for the corrupted cache state.",
          "No filesystem deletion, cache mutation, or artifact access occurred."
        ]);
      }
      result.reasons.push(
        "Cleanup requests require the corrupted state and explicit partial-cleanup approval."
      );
      return result;
    case "request_rollback":
      if (
        input.currentState === "ready" &&
        input.approvals?.rollbackApproved === true
      ) {
        return createResult(input, "rollback_ready", true, [
          "Rollback request is staged for the ready cache state.",
          "No filesystem deletion, cache mutation, or model artifact access occurred."
        ]);
      }
      result.reasons.push(
        "Rollback requests require the ready state and explicit rollback approval."
      );
      return result;
  }
}

function createResult(
  input: TransformersLocalControlledArtifactCacheExecutorInput,
  plannedState: TransformersLocalArtifactCacheState,
  accepted: boolean,
  reasons: string[]
): TransformersLocalControlledArtifactCacheExecutorResult {
  return {
    packageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
    operation: input.operation,
    currentState: input.currentState,
    plannedState,
    accepted,
    planOnly: true,
    executionDeferred: true,
    stateMutationApplied: false,
    networkAccessEnabled: false,
    fileSystemWritesEnabled: false,
    downloadEnabled: false,
    executionEnabled: false,
    modelArtifactsAccessed: false,
    signedUrlsPersisted: false,
    credentialMaterialPersisted: false,
    digestValuesExposed: false,
    sourceUrlsExposed: false,
    reasons
  };
}
