import { LOCAL_EMBEDDING_MODEL_ID } from "./local-embedding-constants";

export type LocalEmbeddingBenchmarkApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export type LocalEmbeddingBenchmarkProfileKey =
  | "lite"
  | "standard"
  | "local_enhanced";

export interface LocalEmbeddingBenchmarkProfileApproval {
  key: LocalEmbeddingBenchmarkProfileKey;
  status: LocalEmbeddingBenchmarkApprovalStatus;
  latencyProfileCaptured: boolean;
  memoryProfileCaptured: boolean;
  qualityProfileCaptured: boolean;
  reasons: string[];
}

export interface LocalEmbeddingBenchmarkApprovalRecord {
  modelId: string;
  runtime: "transformers";
  status: LocalEmbeddingBenchmarkApprovalStatus;
  downloadEnabled: false;
  executionEnabled: false;
  profiles: LocalEmbeddingBenchmarkProfileApproval[];
  reasons: string[];
}

const profileKeys: LocalEmbeddingBenchmarkProfileKey[] = [
  "lite",
  "standard",
  "local_enhanced"
];

export function createLocalEmbeddingBenchmarkApprovalRecord(
  overrides: Partial<LocalEmbeddingBenchmarkApprovalRecord> = {}
): LocalEmbeddingBenchmarkApprovalRecord {
  return {
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    runtime: "transformers",
    status: "pending",
    downloadEnabled: false,
    executionEnabled: false,
    profiles: profileKeys.map((key) => ({
      key,
      status: "pending",
      latencyProfileCaptured: false,
      memoryProfileCaptured: false,
      qualityProfileCaptured: false,
      reasons: [
        "Latency profile is pending.",
        "Memory profile is pending.",
        "Quality profile is pending."
      ]
    })),
    reasons: [
      "Local benchmark profile is pending manual approval.",
      "Downloads and execution remain disabled until benchmarks pass."
    ],
    ...overrides
  };
}

export function isLocalEmbeddingBenchmarkApprovalRecordApproved(
  record: LocalEmbeddingBenchmarkApprovalRecord
): boolean {
  return (
    record.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    record.runtime === "transformers" &&
    record.status === "approved" &&
    record.downloadEnabled === false &&
    record.executionEnabled === false &&
    record.profiles.length === profileKeys.length &&
    profileKeys.every((key) =>
      record.profiles.some(
        (profile) =>
          profile.key === key &&
          profile.status === "approved" &&
          profile.latencyProfileCaptured &&
          profile.memoryProfileCaptured &&
          profile.qualityProfileCaptured
      )
    )
  );
}
