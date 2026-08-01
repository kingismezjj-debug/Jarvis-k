import { TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME } from "./runtime-constants";

export type TransformersLocalArtifactCacheState =
  | "pending"
  | "downloading"
  | "verifying"
  | "ready"
  | "corrupted"
  | "cleanup_required"
  | "rollback_ready";

export type TransformersLocalArtifactCacheEvent =
  | "start_download"
  | "mark_download_complete"
  | "mark_verification_passed"
  | "mark_verification_failed"
  | "request_cleanup"
  | "complete_cleanup"
  | "request_rollback"
  | "complete_rollback";

export interface TransformersLocalArtifactCachePolicy {
  cacheLocationPolicy: "user_cache_provider_namespace";
  cachePathCommitted: false;
  modelArtifactsCommitted: false;
  signedUrlsPersisted: false;
  credentialMaterialPersisted: false;
  digestVerificationRequired: true;
  partialDownloadCleanupRequired: true;
  rollbackRequired: true;
  uninstallDeletesModelsByDefault: false;
}

export interface TransformersLocalArtifactCacheVerificationPolicy {
  digestAlgorithm: "sha256";
  verifyBeforeReady: true;
  rejectUnverifiedArtifacts: true;
  activationRequiresAllArtifactsVerified: true;
  digestValuesExposed: false;
}

export interface TransformersLocalArtifactCacheDryRunTransition {
  from: TransformersLocalArtifactCacheState;
  event: TransformersLocalArtifactCacheEvent;
  to: TransformersLocalArtifactCacheState;
  sideEffectsEnabled: false;
}

export interface TransformersLocalArtifactCacheDryRunPlan {
  packageName: string;
  dryRunOnly: true;
  currentState: TransformersLocalArtifactCacheState;
  states: TransformersLocalArtifactCacheState[];
  transitions: TransformersLocalArtifactCacheDryRunTransition[];
  cachePolicy: TransformersLocalArtifactCachePolicy;
  verificationPolicy: TransformersLocalArtifactCacheVerificationPolicy;
  networkAccessEnabled: false;
  fileSystemWritesEnabled: false;
  downloadEnabled: false;
  executionEnabled: false;
  modelArtifactsAccessed: false;
  cacheValuesExposed: false;
  reasons: string[];
}

export interface TransformersLocalArtifactCacheDryRunTransitionInput {
  currentState: TransformersLocalArtifactCacheState;
  event: TransformersLocalArtifactCacheEvent;
}

export interface TransformersLocalArtifactCacheDryRunTransitionResult {
  from: TransformersLocalArtifactCacheState;
  event: TransformersLocalArtifactCacheEvent;
  to: TransformersLocalArtifactCacheState;
  allowed: boolean;
  dryRunOnly: true;
  sideEffectsEnabled: false;
  networkAccessEnabled: false;
  fileSystemWritesEnabled: false;
  downloadEnabled: false;
  executionEnabled: false;
  modelArtifactsAccessed: false;
  reasons: string[];
}

const states: TransformersLocalArtifactCacheState[] = [
  "pending",
  "downloading",
  "verifying",
  "ready",
  "corrupted",
  "cleanup_required",
  "rollback_ready"
];

const transitions: TransformersLocalArtifactCacheDryRunTransition[] = [
  transition("pending", "start_download", "downloading"),
  transition("downloading", "mark_download_complete", "verifying"),
  transition("verifying", "mark_verification_passed", "ready"),
  transition("verifying", "mark_verification_failed", "corrupted"),
  transition("corrupted", "request_cleanup", "cleanup_required"),
  transition("cleanup_required", "complete_cleanup", "pending"),
  transition("ready", "request_rollback", "rollback_ready"),
  transition("rollback_ready", "complete_rollback", "ready")
];

export function createTransformersLocalArtifactCacheDryRunPlan(
  currentState: TransformersLocalArtifactCacheState = "pending"
): TransformersLocalArtifactCacheDryRunPlan {
  return {
    packageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
    dryRunOnly: true,
    currentState,
    states: [...states],
    transitions: transitions.map((item) => ({ ...item })),
    cachePolicy: {
      cacheLocationPolicy: "user_cache_provider_namespace",
      cachePathCommitted: false,
      modelArtifactsCommitted: false,
      signedUrlsPersisted: false,
      credentialMaterialPersisted: false,
      digestVerificationRequired: true,
      partialDownloadCleanupRequired: true,
      rollbackRequired: true,
      uninstallDeletesModelsByDefault: false
    },
    verificationPolicy: {
      digestAlgorithm: "sha256",
      verifyBeforeReady: true,
      rejectUnverifiedArtifacts: true,
      activationRequiresAllArtifactsVerified: true,
      digestValuesExposed: false
    },
    networkAccessEnabled: false,
    fileSystemWritesEnabled: false,
    downloadEnabled: false,
    executionEnabled: false,
    modelArtifactsAccessed: false,
    cacheValuesExposed: false,
    reasons: [
      "Artifact cache and download manager is dry-run only.",
      "No network access, filesystem writes, signed URL persistence, model artifact access, or execution is enabled."
    ]
  };
}

export function previewTransformersLocalArtifactCacheTransition(
  input: TransformersLocalArtifactCacheDryRunTransitionInput
): TransformersLocalArtifactCacheDryRunTransitionResult {
  const allowedTransition = transitions.find(
    (item) =>
      item.from === input.currentState && item.event === input.event
  );

  return {
    from: input.currentState,
    event: input.event,
    to: allowedTransition?.to ?? input.currentState,
    allowed: allowedTransition !== undefined,
    dryRunOnly: true,
    sideEffectsEnabled: false,
    networkAccessEnabled: false,
    fileSystemWritesEnabled: false,
    downloadEnabled: false,
    executionEnabled: false,
    modelArtifactsAccessed: false,
    reasons:
      allowedTransition === undefined
        ? ["Transition is not allowed by the dry-run artifact cache state machine."]
        : [
            "Transition is previewed only.",
            "No download, filesystem write, cache mutation, or model artifact access occurred."
          ]
  };
}

function transition(
  from: TransformersLocalArtifactCacheState,
  event: TransformersLocalArtifactCacheEvent,
  to: TransformersLocalArtifactCacheState
): TransformersLocalArtifactCacheDryRunTransition {
  return {
    from,
    event,
    to,
    sideEffectsEnabled: false
  };
}
