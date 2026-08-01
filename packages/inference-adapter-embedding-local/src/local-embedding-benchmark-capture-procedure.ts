import type { LocalEmbeddingBenchmarkProfileKey } from "./local-embedding-benchmark-approval";
import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";

export type LocalEmbeddingBenchmarkCaptureStepKey =
  | "benchmarks.profiles_confirmed"
  | "benchmarks.dataset_defined"
  | "benchmarks.latency_method_defined"
  | "benchmarks.memory_method_defined"
  | "benchmarks.quality_method_defined"
  | "benchmarks.resource_isolation_defined"
  | "benchmarks.failure_degradation_defined"
  | "benchmarks.privacy_sanitized"
  | "benchmarks.metric_values_deferred"
  | "benchmarks.approval_record_local"
  | "downloads.disabled"
  | "execution.disabled"
  | "verification.clean";

export interface LocalEmbeddingBenchmarkCaptureInput {
  profilesConfirmed?: boolean;
  datasetDefined?: boolean;
  latencyMethodDefined?: boolean;
  memoryMethodDefined?: boolean;
  qualityMethodDefined?: boolean;
  resourceIsolationDefined?: boolean;
  failureDegradationDefined?: boolean;
  privacySanitized?: boolean;
  metricValuesCaptured?: boolean;
  approvalRecordLocal?: boolean;
  downloadEnabled?: boolean;
  executionEnabled?: boolean;
  verificationClean?: boolean;
}

export interface LocalEmbeddingBenchmarkCaptureProfile {
  key: LocalEmbeddingBenchmarkProfileKey;
  latencyProfileRequired: true;
  memoryProfileRequired: true;
  qualityProfileRequired: true;
}

export interface LocalEmbeddingBenchmarkCaptureStep {
  key: LocalEmbeddingBenchmarkCaptureStepKey;
  satisfied: boolean;
  reason: string;
}

export interface LocalEmbeddingBenchmarkCaptureProcedure {
  provider: string;
  modelId: string;
  runtime: "transformers";
  status: "pending" | "ready_for_approval";
  downloadEnabled: false;
  executionEnabled: false;
  metricValuesExposed: false;
  profiles: LocalEmbeddingBenchmarkCaptureProfile[];
  steps: LocalEmbeddingBenchmarkCaptureStep[];
  reasons: string[];
}

export type LocalEmbeddingBenchmarkCaptureApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export type LocalEmbeddingBenchmarkInputSetKey =
  | "sanitized_bilingual_smoke"
  | "retrieval_regression"
  | "resource_stress";

export interface LocalEmbeddingBenchmarkCaptureApprovalRecord {
  provider: string;
  modelId: string;
  runtime: "transformers";
  status: LocalEmbeddingBenchmarkCaptureApprovalStatus;
  inputSets: LocalEmbeddingBenchmarkInputSetKey[];
  latencyMethod: "cold_and_warm_runs";
  memoryMethod: "peak_process_memory";
  qualityMethod: "fixed_retrieval_expectations";
  resourceIsolation: "scheduler_lease_and_repeatable_host_state";
  failureDegradation: "sanitized_profile_failure";
  privacySanitized: true;
  approvalRecordLocal: true;
  downloadEnabled: false;
  executionEnabled: false;
  metricValuesCaptured: false;
  metricValuesExposed: false;
  profiles: LocalEmbeddingBenchmarkCaptureProfile[];
  reasons: string[];
}

const profileKeys: LocalEmbeddingBenchmarkProfileKey[] = [
  "lite",
  "standard",
  "local_enhanced"
];

export function createLocalEmbeddingBenchmarkCaptureProcedure(
  input: LocalEmbeddingBenchmarkCaptureInput = {}
): LocalEmbeddingBenchmarkCaptureProcedure {
  const steps: LocalEmbeddingBenchmarkCaptureStep[] = [
    step(
      "benchmarks.profiles_confirmed",
      input.profilesConfirmed === true,
      "Confirm Lite, Standard, and Local Enhanced benchmark profiles before capture."
    ),
    step(
      "benchmarks.dataset_defined",
      input.datasetDefined === true,
      "Define the benchmark corpus and query set before capture."
    ),
    step(
      "benchmarks.latency_method_defined",
      input.latencyMethodDefined === true,
      "Define latency capture methodology before approval."
    ),
    step(
      "benchmarks.memory_method_defined",
      input.memoryMethodDefined === true,
      "Define memory capture methodology before approval."
    ),
    step(
      "benchmarks.quality_method_defined",
      input.qualityMethodDefined === true,
      "Define quality capture methodology before approval."
    ),
    step(
      "benchmarks.resource_isolation_defined",
      input.resourceIsolationDefined === true,
      "Define resource isolation and repeatability controls before capture."
    ),
    step(
      "benchmarks.failure_degradation_defined",
      input.failureDegradationDefined === true,
      "Define sanitized benchmark failure and degradation reporting."
    ),
    step(
      "benchmarks.privacy_sanitized",
      input.privacySanitized === true,
      "Sanitize benchmark inputs, outputs, paths, and logs before approval."
    ),
    step(
      "benchmarks.metric_values_deferred",
      input.metricValuesCaptured === false,
      "Keep real benchmark metric values out until a separately approved capture wave."
    ),
    step(
      "benchmarks.approval_record_local",
      input.approvalRecordLocal === true,
      "Keep benchmark capture approval records provider-local."
    ),
    step(
      "downloads.disabled",
      input.downloadEnabled === false,
      "Keep downloads disabled during benchmark capture procedure approval."
    ),
    step(
      "execution.disabled",
      input.executionEnabled === false,
      "Keep local embedding execution disabled during benchmark capture approval."
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
    runtime: "transformers",
    status: reasons.length === 0 ? "ready_for_approval" : "pending",
    downloadEnabled: false,
    executionEnabled: false,
    metricValuesExposed: false,
    profiles: profileKeys.map((key) => ({
      key,
      latencyProfileRequired: true,
      memoryProfileRequired: true,
      qualityProfileRequired: true
    })),
    steps,
    reasons
  };
}

export function createApprovedLocalEmbeddingBenchmarkCaptureApprovalRecord(
  overrides: Partial<LocalEmbeddingBenchmarkCaptureApprovalRecord> = {}
): LocalEmbeddingBenchmarkCaptureApprovalRecord {
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    status: "approved",
    inputSets: [
      "sanitized_bilingual_smoke",
      "retrieval_regression",
      "resource_stress"
    ],
    latencyMethod: "cold_and_warm_runs",
    memoryMethod: "peak_process_memory",
    qualityMethod: "fixed_retrieval_expectations",
    resourceIsolation: "scheduler_lease_and_repeatable_host_state",
    failureDegradation: "sanitized_profile_failure",
    privacySanitized: true,
    approvalRecordLocal: true,
    downloadEnabled: false,
    executionEnabled: false,
    metricValuesCaptured: false,
    metricValuesExposed: false,
    profiles: profileKeys.map((key) => ({
      key,
      latencyProfileRequired: true,
      memoryProfileRequired: true,
      qualityProfileRequired: true
    })),
    reasons: [
      "Benchmark capture method is approved without recording metric values.",
      "Downloads and execution remain disabled until a later benchmark result capture wave."
    ],
    ...overrides
  };
}

export function isLocalEmbeddingBenchmarkCaptureApprovalRecordApproved(
  record: LocalEmbeddingBenchmarkCaptureApprovalRecord,
  procedure: LocalEmbeddingBenchmarkCaptureProcedure =
    createLocalEmbeddingBenchmarkCaptureProcedure({
      profilesConfirmed: true,
      datasetDefined: true,
      latencyMethodDefined: true,
      memoryMethodDefined: true,
      qualityMethodDefined: true,
      resourceIsolationDefined: true,
      failureDegradationDefined: true,
      privacySanitized: true,
      metricValuesCaptured: false,
      approvalRecordLocal: true,
      downloadEnabled: false,
      executionEnabled: false,
      verificationClean: true
    })
): boolean {
  return (
    procedure.status === "ready_for_approval" &&
    procedure.downloadEnabled === false &&
    procedure.executionEnabled === false &&
    procedure.metricValuesExposed === false &&
    record.provider === LOCAL_EMBEDDING_PROVIDER_ID &&
    record.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    record.runtime === "transformers" &&
    record.status === "approved" &&
    record.latencyMethod === "cold_and_warm_runs" &&
    record.memoryMethod === "peak_process_memory" &&
    record.qualityMethod === "fixed_retrieval_expectations" &&
    record.resourceIsolation === "scheduler_lease_and_repeatable_host_state" &&
    record.failureDegradation === "sanitized_profile_failure" &&
    record.privacySanitized === true &&
    record.approvalRecordLocal === true &&
    record.downloadEnabled === false &&
    record.executionEnabled === false &&
    record.metricValuesCaptured === false &&
    record.metricValuesExposed === false &&
    requiredInputSets.every((key) => record.inputSets.includes(key)) &&
    profileKeys.every((key) =>
      record.profiles.some(
        (profile) =>
          profile.key === key &&
          profile.latencyProfileRequired &&
          profile.memoryProfileRequired &&
          profile.qualityProfileRequired
      )
    )
  );
}

function step(
  key: LocalEmbeddingBenchmarkCaptureStepKey,
  satisfied: boolean,
  reason: string
): LocalEmbeddingBenchmarkCaptureStep {
  return { key, satisfied, reason: satisfied ? "" : reason };
}

const requiredInputSets: LocalEmbeddingBenchmarkInputSetKey[] = [
  "sanitized_bilingual_smoke",
  "retrieval_regression",
  "resource_stress"
];
