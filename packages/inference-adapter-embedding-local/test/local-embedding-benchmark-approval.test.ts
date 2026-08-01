import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingBenchmarkApprovalRecord,
  isLocalEmbeddingBenchmarkApprovalRecordApproved,
  LOCAL_EMBEDDING_MODEL_ID,
  type LocalEmbeddingBenchmarkApprovalRecord
} from "../src";

describe("local embedding benchmark approval", () => {
  it("defaults every profile to pending and keeps downloads and execution disabled", () => {
    const record = createLocalEmbeddingBenchmarkApprovalRecord();

    expect(record).toMatchObject({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      runtime: "transformers",
      status: "pending",
      downloadEnabled: false,
      executionEnabled: false
    });
    expect(record.profiles.map((profile) => profile.key)).toEqual([
      "lite",
      "standard",
      "local_enhanced"
    ]);
    expect(
      record.profiles.every(
        (profile) =>
          profile.status === "pending" &&
          !profile.latencyProfileCaptured &&
          !profile.memoryProfileCaptured &&
          !profile.qualityProfileCaptured
      )
    ).toBe(true);
  });

  it("does not expose URLs, digests, model files, or metric values", () => {
    const serialized = JSON.stringify(
      createLocalEmbeddingBenchmarkApprovalRecord()
    );

    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
    expect(serialized).not.toContain("latencyMs");
    expect(serialized).not.toContain("memoryBytes");
    expect(serialized).not.toContain("score");
  });

  it("rejects pending approval and incomplete profiles", () => {
    const approved = approvedBenchmarkApproval();

    expect(
      isLocalEmbeddingBenchmarkApprovalRecordApproved(
        createLocalEmbeddingBenchmarkApprovalRecord()
      )
    ).toBe(false);
    expect(
      isLocalEmbeddingBenchmarkApprovalRecordApproved({
        ...approved,
        profiles: [
          {
            ...approved.profiles[0]!,
            memoryProfileCaptured: false
          },
          ...approved.profiles.slice(1)
        ]
      })
    ).toBe(false);
  });

  it("accepts only an approved full profile set for the selected model", () => {
    const approved = approvedBenchmarkApproval();

    expect(
      isLocalEmbeddingBenchmarkApprovalRecordApproved(approved)
    ).toBe(true);
    expect(
      isLocalEmbeddingBenchmarkApprovalRecordApproved({
        ...approved,
        modelId: "another/model"
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingBenchmarkApprovalRecordApproved({
        ...approved,
        profiles: approved.profiles.slice(1)
      })
    ).toBe(false);
  });
});

function approvedBenchmarkApproval(): LocalEmbeddingBenchmarkApprovalRecord {
  return createLocalEmbeddingBenchmarkApprovalRecord({
    status: "approved",
    profiles: createLocalEmbeddingBenchmarkApprovalRecord().profiles.map(
      (profile) => ({
        ...profile,
        status: "approved",
        latencyProfileCaptured: true,
        memoryProfileCaptured: true,
        qualityProfileCaptured: true,
        reasons: []
      })
    ),
    reasons: []
  });
}
