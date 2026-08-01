import type { TransformersLocalArtifactCacheState } from "./artifact-cache-dry-run";
import { TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME } from "./runtime-constants";

export type TransformersLocalControlledArtifactDownloadGuardOperation =
  | "prepare_download"
  | "verify_download";

export type TransformersLocalControlledArtifactDownloadSideEffectRequest =
  | "networkAccess"
  | "fileSystemWrite"
  | "download"
  | "execution"
  | "modelArtifactRead"
  | "persistSignedUrl"
  | "persistCredentialMaterial"
  | "exposeDigestValue"
  | "exposeSourceUrl";

export interface TransformersLocalControlledArtifactDownloadApprovals {
  artifactPinApproved: boolean;
  immutableRevisionApproved: boolean;
  licenseRedistributionApproved: boolean;
  downloadApproved: boolean;
  cacheWriteApproved: boolean;
  sha256VerificationApproved: boolean;
  partialCleanupApproved: boolean;
  rollbackApproved: boolean;
}

export interface TransformersLocalControlledArtifactDownloadGuardPolicy {
  packageName: string;
  dryRunOnly: true;
  digestAlgorithm: "sha256";
  expectedDigestRequired: true;
  observedDigestRequiredBeforeReady: true;
  immutableRevisionRequired: true;
  approvedArtifactPinRequired: true;
  unsignedHttpsSourceRequired: true;
  cacheStateGateRequired: true;
  partialDownloadCleanupRequired: true;
  rollbackRequired: true;
  signedUrlsPersisted: false;
  credentialMaterialPersisted: false;
  digestValuesExposed: false;
  sourceUrlsExposed: false;
  networkAccessEnabled: false;
  fileSystemWritesEnabled: false;
  downloadEnabled: false;
  executionEnabled: false;
  modelArtifactsAccessed: false;
}

export interface TransformersLocalControlledArtifactDownloadGuardInput {
  operation: TransformersLocalControlledArtifactDownloadGuardOperation;
  artifactKey: string;
  sourceUrl: string;
  expectedSha256: string;
  observedSha256?: string;
  currentState: TransformersLocalArtifactCacheState;
  approvals: TransformersLocalControlledArtifactDownloadApprovals;
  requestedOperations?: Partial<
    Record<TransformersLocalControlledArtifactDownloadSideEffectRequest, boolean>
  >;
}

export interface TransformersLocalControlledArtifactDownloadGuardChecks {
  operationStateAllowed: boolean;
  artifactKeySafe: boolean;
  sourceUrlHttps: boolean;
  sourceUrlUnsigned: boolean;
  expectedSha256Format: boolean;
  observedSha256PresenceValid: boolean;
  observedSha256Format: boolean;
  digestMatches: boolean;
  approvalsSatisfied: boolean;
  sideEffectsRequested: boolean;
  sideEffectsBlocked: true;
}

export interface TransformersLocalControlledArtifactDownloadGuardResult {
  packageName: string;
  operation: TransformersLocalControlledArtifactDownloadGuardOperation;
  accepted: boolean;
  readyForControlledDownload: boolean;
  sha256VerificationSatisfied: boolean;
  readyForCacheReadyState: boolean;
  dryRunOnly: true;
  checks: TransformersLocalControlledArtifactDownloadGuardChecks;
  signedUrlsPersisted: false;
  credentialMaterialPersisted: false;
  digestValuesExposed: false;
  sourceUrlsExposed: false;
  networkAccessEnabled: false;
  fileSystemWritesEnabled: false;
  downloadEnabled: false;
  executionEnabled: false;
  modelArtifactsAccessed: false;
  reasons: string[];
}

const sha256Pattern = /^[a-f0-9]{64}$/u;
const safeArtifactSegmentPattern = /^[A-Za-z0-9._-]+$/u;
const unsignedUrlBlockers = ["?", "#"];

export function createTransformersLocalControlledArtifactDownloadGuardPolicy(): TransformersLocalControlledArtifactDownloadGuardPolicy {
  return {
    packageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
    dryRunOnly: true,
    digestAlgorithm: "sha256",
    expectedDigestRequired: true,
    observedDigestRequiredBeforeReady: true,
    immutableRevisionRequired: true,
    approvedArtifactPinRequired: true,
    unsignedHttpsSourceRequired: true,
    cacheStateGateRequired: true,
    partialDownloadCleanupRequired: true,
    rollbackRequired: true,
    signedUrlsPersisted: false,
    credentialMaterialPersisted: false,
    digestValuesExposed: false,
    sourceUrlsExposed: false,
    networkAccessEnabled: false,
    fileSystemWritesEnabled: false,
    downloadEnabled: false,
    executionEnabled: false,
    modelArtifactsAccessed: false
  };
}

export function evaluateTransformersLocalControlledArtifactDownloadGuard(
  input: TransformersLocalControlledArtifactDownloadGuardInput
): TransformersLocalControlledArtifactDownloadGuardResult {
  const expectedSha256Format = sha256Pattern.test(input.expectedSha256);
  const observedSha256Provided = input.observedSha256 !== undefined;
  const observedSha256Format =
    input.observedSha256 !== undefined
      ? sha256Pattern.test(input.observedSha256)
      : input.operation === "prepare_download";
  const digestMatches =
    input.observedSha256 !== undefined &&
    expectedSha256Format &&
    observedSha256Format &&
    input.observedSha256 === input.expectedSha256;
  const operationStateAllowed =
    input.operation === "prepare_download"
      ? input.currentState === "pending"
      : input.currentState === "verifying";
  const observedSha256PresenceValid =
    input.operation === "verify_download"
      ? observedSha256Provided
      : !observedSha256Provided;
  const checks: TransformersLocalControlledArtifactDownloadGuardChecks = {
    operationStateAllowed,
    artifactKeySafe: isSafeArtifactKey(input.artifactKey),
    sourceUrlHttps: input.sourceUrl.startsWith("https://"),
    sourceUrlUnsigned: isUnsignedSourceUrl(input.sourceUrl),
    expectedSha256Format,
    observedSha256PresenceValid,
    observedSha256Format,
    digestMatches,
    approvalsSatisfied: areApprovalsSatisfied(input.approvals),
    sideEffectsRequested: areSideEffectsRequested(input.requestedOperations),
    sideEffectsBlocked: true
  };
  const baseAccepted =
    checks.operationStateAllowed &&
    checks.artifactKeySafe &&
    checks.sourceUrlHttps &&
    checks.sourceUrlUnsigned &&
    checks.expectedSha256Format &&
    checks.observedSha256PresenceValid &&
    checks.observedSha256Format &&
    checks.approvalsSatisfied &&
    !checks.sideEffectsRequested;
  const readyForControlledDownload =
    input.operation === "prepare_download" && baseAccepted;
  const sha256VerificationSatisfied =
    input.operation === "verify_download" && baseAccepted && checks.digestMatches;
  const accepted = readyForControlledDownload || sha256VerificationSatisfied;

  return {
    packageName: TRANSFORMERS_LOCAL_RUNTIME_PACKAGE_NAME,
    operation: input.operation,
    accepted,
    readyForControlledDownload,
    sha256VerificationSatisfied,
    readyForCacheReadyState: sha256VerificationSatisfied,
    dryRunOnly: true,
    checks,
    signedUrlsPersisted: false,
    credentialMaterialPersisted: false,
    digestValuesExposed: false,
    sourceUrlsExposed: false,
    networkAccessEnabled: false,
    fileSystemWritesEnabled: false,
    downloadEnabled: false,
    executionEnabled: false,
    modelArtifactsAccessed: false,
    reasons: accepted
      ? createAcceptedReasons(input.operation)
      : createBlockedReasons(checks, input.operation)
  };
}

function areApprovalsSatisfied(
  approvals: TransformersLocalControlledArtifactDownloadApprovals
): boolean {
  return (
    approvals.artifactPinApproved &&
    approvals.immutableRevisionApproved &&
    approvals.licenseRedistributionApproved &&
    approvals.downloadApproved &&
    approvals.cacheWriteApproved &&
    approvals.sha256VerificationApproved &&
    approvals.partialCleanupApproved &&
    approvals.rollbackApproved
  );
}

function areSideEffectsRequested(
  requestedOperations:
    | Partial<
        Record<
          TransformersLocalControlledArtifactDownloadSideEffectRequest,
          boolean
        >
      >
    | undefined
): boolean {
  if (requestedOperations === undefined) {
    return false;
  }

  return Object.values(requestedOperations).some((value) => value === true);
}

function isSafeArtifactKey(artifactKey: string): boolean {
  if (
    artifactKey.length === 0 ||
    artifactKey.length > 240 ||
    artifactKey.startsWith("/") ||
    artifactKey.startsWith("\\") ||
    artifactKey.includes("\\") ||
    artifactKey.includes(":") ||
    artifactKey.includes("://")
  ) {
    return false;
  }

  return artifactKey.split("/").every((segment) => {
    return (
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      safeArtifactSegmentPattern.test(segment)
    );
  });
}

function isUnsignedSourceUrl(sourceUrl: string): boolean {
  const lowerSourceUrl = sourceUrl.toLowerCase();
  return unsignedUrlBlockers.every(
    (marker) => !lowerSourceUrl.includes(marker)
  );
}

function createAcceptedReasons(
  operation: TransformersLocalControlledArtifactDownloadGuardOperation
): string[] {
  return operation === "prepare_download"
    ? [
        "Controlled download request passed guard checks.",
        "No network access, filesystem write, download, model artifact read, source URL exposure, digest exposure, or execution occurred."
      ]
    : [
        "SHA-256 verification result passed guard checks.",
        "Artifact can be marked ready by a future cache manager, but execution remains disabled."
      ];
}

function createBlockedReasons(
  checks: TransformersLocalControlledArtifactDownloadGuardChecks,
  operation: TransformersLocalControlledArtifactDownloadGuardOperation
): string[] {
  const reasons: string[] = [];

  if (!checks.operationStateAllowed) {
    reasons.push("Operation is not allowed from the current cache state.");
  }

  if (!checks.artifactKeySafe) {
    reasons.push("Artifact key is not a safe relative artifact key.");
  }

  if (!checks.sourceUrlHttps) {
    reasons.push("Source URL must use HTTPS.");
  }

  if (!checks.sourceUrlUnsigned) {
    reasons.push("Signed, query, fragment, token, or credential-bearing URLs are rejected.");
  }

  if (!checks.expectedSha256Format) {
    reasons.push("Expected digest must be a lowercase SHA-256 hex value.");
  }

  if (!checks.observedSha256PresenceValid) {
    reasons.push(
      operation === "verify_download"
        ? "Observed digest is required before ready state."
        : "Observed digest is not accepted during download preparation."
    );
  }

  if (!checks.observedSha256Format) {
    reasons.push("Observed digest must be a lowercase SHA-256 hex value.");
  }

  if (operation === "verify_download" && !checks.digestMatches) {
    reasons.push("Observed digest does not match the expected digest.");
  }

  if (!checks.approvalsSatisfied) {
    reasons.push("All artifact, revision, license, download, cache, verification, cleanup, and rollback approvals are required.");
  }

  if (checks.sideEffectsRequested) {
    reasons.push("Requested side effects are blocked in this guard layer.");
  }

  return reasons;
}
