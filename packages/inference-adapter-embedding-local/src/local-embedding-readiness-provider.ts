import type { EmbeddingInferenceProvider } from "@jarvis-k/capabilities";
import {
  EmbeddingGenerationRequestSchema,
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  ModelManifestSchema,
  type EmbeddingGenerationRequest,
  type EmbeddingGenerationResult,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor
} from "@jarvis-k/contracts";
import {
  createLocalEmbeddingArtifactPlan,
  isLocalEmbeddingArtifactPlanPinned,
  type LocalEmbeddingArtifactPlan
} from "./local-embedding-artifact-plan";
import {
  createLocalEmbeddingRuntimeStrategy,
  isLocalEmbeddingRuntimeStrategyApproved,
  type LocalEmbeddingRuntimeStrategy
} from "./local-embedding-runtime-strategy";

export const LOCAL_EMBEDDING_PROVIDER_ID = "embedding.local.qwen3";
export const LOCAL_EMBEDDING_MODEL_ID = "Qwen/Qwen3-Embedding-0.6B";

const LOCAL_EMBEDDING_EXECUTION_DISABLED_REASON =
  "Local embedding execution remains disabled until a real runtime provider is composed.";
const FLOATING_REVISIONS = new Set(["HEAD", "latest", "main", "master"]);

type LocalEmbeddingReadinessKey =
  | "model.manifest"
  | "model.revision"
  | "model.artifact_sha256"
  | "artifact.pins"
  | "runtime.strategy"
  | "runtime.adapter"
  | "runtime.packaging"
  | "license.redistribution_review"
  | "benchmarks.local_resource_profile";

export interface LocalEmbeddingReadinessInput {
  manifest?: unknown;
  artifactPlan?: LocalEmbeddingArtifactPlan;
  runtimeStrategy?: LocalEmbeddingRuntimeStrategy;
  runtimeAdapterReady?: boolean;
  packagingReviewed?: boolean;
  redistributionReviewed?: boolean;
  benchmarkProfileReady?: boolean;
}

export interface LocalEmbeddingReadinessCheck {
  key: LocalEmbeddingReadinessKey;
  satisfied: boolean;
  reasons: string[];
}

export interface LocalEmbeddingReadinessReport {
  readyForComposition: boolean;
  checks: LocalEmbeddingReadinessCheck[];
  reasons: string[];
}

export interface LocalEmbeddingProviderReportOptions {
  readiness?: LocalEmbeddingReadinessInput;
}

export class UnavailableLocalEmbeddingProvider
  implements EmbeddingInferenceProvider
{
  public async embed(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult> {
    EmbeddingGenerationRequestSchema.parse(request);
    throw new Error("Local embedding provider is not configured.");
  }
}

export function createLocalEmbeddingProviderDescriptor(): InferenceProviderDescriptor {
  const readiness = assessLocalEmbeddingReadiness();
  return InferenceProviderDescriptorSchema.parse({
    capability: "embedding",
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    status: "unconfigured",
    execution: "disabled",
    modelIds: [LOCAL_EMBEDDING_MODEL_ID],
    reasons: [
      ...readiness.reasons,
      LOCAL_EMBEDDING_EXECUTION_DISABLED_REASON
    ]
  });
}

export function createLocalEmbeddingProviderConfigurationReport(
  options: LocalEmbeddingProviderReportOptions = {}
): InferenceProviderConfigurationReport {
  const readiness = assessLocalEmbeddingReadiness(options.readiness);
  return InferenceProviderConfigurationReportSchema.parse({
    capability: "embedding",
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    status: "unconfigured",
    requirements: readiness.checks.map((check) => ({
      key: check.key,
      source: readinessRequirementSource(check.key),
      required: true,
      configured: check.satisfied,
      description: readinessRequirementDescription(check.key),
      reasons: check.reasons
    })),
    reasons: [
      ...readiness.reasons,
      LOCAL_EMBEDDING_EXECUTION_DISABLED_REASON
    ]
  });
}

export function assessLocalEmbeddingReadiness(
  input: LocalEmbeddingReadinessInput = {}
): LocalEmbeddingReadinessReport {
  const parsedManifest = ModelManifestSchema.safeParse(input.manifest);
  const manifest = parsedManifest.success ? parsedManifest.data : undefined;
  const checks: LocalEmbeddingReadinessCheck[] = [];

  addCheck(
    checks,
    "model.manifest",
    manifest !== undefined &&
      manifest.id === LOCAL_EMBEDDING_MODEL_ID &&
      manifest.capability === "embedding",
    "Provide an approved embedding manifest for the selected model."
  );
  addCheck(
    checks,
    "model.revision",
    manifest !== undefined &&
      !FLOATING_REVISIONS.has(manifest.revision) &&
      manifest.revision.trim().length > 0,
    "Pin an immutable upstream model revision; floating branches are blocked."
  );
  addCheck(
    checks,
    "model.artifact_sha256",
    manifest?.sha256 !== undefined,
    "Record SHA-256 digests for every model artifact before download."
  );
  const artifactPlan =
    input.artifactPlan ?? createLocalEmbeddingArtifactPlan();
  addCheck(
    checks,
    "artifact.pins",
    isLocalEmbeddingArtifactPlanPinned(artifactPlan),
    "Pin every required embedding artifact with an immutable revision and SHA-256 digest."
  );
  const runtimeStrategy =
    input.runtimeStrategy ?? createLocalEmbeddingRuntimeStrategy();
  addCheck(
    checks,
    "runtime.strategy",
    isLocalEmbeddingRuntimeStrategyApproved(runtimeStrategy),
    "Approve the runtime dependency, packaging, process isolation, tokenizer pin, and benchmark strategy."
  );
  addCheck(
    checks,
    "runtime.adapter",
    input.runtimeAdapterReady === true,
    "Select and validate a dedicated local embedding runtime adapter."
  );
  addCheck(
    checks,
    "runtime.packaging",
    input.packagingReviewed === true,
    "Complete Windows packaging and native/helper runtime review."
  );
  addCheck(
    checks,
    "license.redistribution_review",
    manifest !== undefined &&
      manifest.licenseRisk !== "red" &&
      input.redistributionReviewed === true,
    "Complete license and redistribution review before bundling artifacts."
  );
  addCheck(
    checks,
    "benchmarks.local_resource_profile",
    input.benchmarkProfileReady === true,
    "Capture local quality, latency, memory, and resource benchmarks."
  );

  const reasons = checks.flatMap((check) => check.reasons);
  return {
    readyForComposition: reasons.length === 0,
    checks,
    reasons
  };
}

function addCheck(
  checks: LocalEmbeddingReadinessCheck[],
  key: LocalEmbeddingReadinessKey,
  satisfied: boolean,
  reason: string
): void {
  checks.push({
    key,
    satisfied,
    reasons: satisfied ? [] : [reason]
  });
}

function readinessRequirementSource(
  key: LocalEmbeddingReadinessKey
): "manual" | "runtime" {
  return key === "runtime.adapter" ? "runtime" : "manual";
}

function readinessRequirementDescription(
  key: LocalEmbeddingReadinessKey
): string {
  switch (key) {
    case "model.manifest":
      return "Approve an immutable manifest for the selected embedding model.";
    case "model.revision":
      return "Pin an immutable upstream model revision.";
    case "model.artifact_sha256":
      return "Record SHA-256 digests for every artifact.";
    case "artifact.pins":
      return "Pin every required artifact with revision and SHA-256 metadata.";
    case "runtime.strategy":
      return "Approve runtime dependency scope, packaging, isolation, tokenizer, and benchmark gates.";
    case "runtime.adapter":
      return "Select a dedicated local embedding runtime adapter.";
    case "runtime.packaging":
      return "Document Windows packaging and resource requirements.";
    case "license.redistribution_review":
      return "Complete license and redistribution review.";
    case "benchmarks.local_resource_profile":
      return "Capture Lite, Standard, and Local Enhanced benchmarks.";
  }
}
