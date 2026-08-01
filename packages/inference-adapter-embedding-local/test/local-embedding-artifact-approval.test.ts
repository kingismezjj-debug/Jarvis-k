import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingArtifactPinApprovalRecord,
  createLocalEmbeddingArtifactPlan,
  isLocalEmbeddingArtifactPinApprovalRecordApproved,
  LOCAL_EMBEDDING_MODEL_ID,
  type LocalEmbeddingArtifactPlan
} from "../src";

describe("local embedding artifact pin approval", () => {
  it("defaults every artifact approval to pending and download-disabled", () => {
    const record = createLocalEmbeddingArtifactPinApprovalRecord();

    expect(record).toMatchObject({
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      source: "huggingface",
      status: "pending",
      downloadEnabled: false
    });
    expect(record.artifacts.map((artifact) => artifact.status)).toEqual(
      createLocalEmbeddingArtifactPlan().artifacts.map(() => "pending")
    );
  });

  it("does not expose upstream URLs or placeholder digests by default", () => {
    const record = createLocalEmbeddingArtifactPinApprovalRecord();
    const serialized = JSON.stringify(record);

    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(
      record.artifacts.every(
        (artifact) =>
          artifact.revision === undefined && artifact.sha256 === undefined
      )
    ).toBe(true);
  });

  it("rejects pending approval even when a plan is structurally pinned", () => {
    expect(
      isLocalEmbeddingArtifactPinApprovalRecordApproved(
        createLocalEmbeddingArtifactPinApprovalRecord(),
        pinnedArtifactPlan()
      )
    ).toBe(false);
  });

  it("accepts only approved artifact pins that match the plan", () => {
    const plan = pinnedArtifactPlan();
    const approval = approvedArtifactPinApproval(plan);

    expect(
      isLocalEmbeddingArtifactPinApprovalRecordApproved(approval, plan)
    ).toBe(true);
    expect(
      isLocalEmbeddingArtifactPinApprovalRecordApproved(
        {
          ...approval,
          artifacts: [
            {
              ...approval.artifacts[0]!,
              sha256:
                "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
            },
            ...approval.artifacts.slice(1)
          ]
        },
        plan
      )
    ).toBe(false);
    expect(
      isLocalEmbeddingArtifactPinApprovalRecordApproved(
        {
          ...approval,
          artifacts: [
            {
              ...approval.artifacts[0]!,
              revision: "main"
            },
            ...approval.artifacts.slice(1)
          ]
        },
        {
          ...plan,
          artifacts: [
            {
              ...plan.artifacts[0]!,
              revision: "main"
            },
            ...plan.artifacts.slice(1)
          ]
        }
      )
    ).toBe(false);
  });
});

function pinnedArtifactPlan(): LocalEmbeddingArtifactPlan {
  return {
    ...createLocalEmbeddingArtifactPlan(),
    status: "pinned",
    artifacts: createLocalEmbeddingArtifactPlan().artifacts.map(
      (artifact) => ({
        ...artifact,
        pinned: true,
        revision: "immutable-artifact-revision",
        sha256:
          "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        reasons: []
      })
    ),
    reasons: []
  };
}

function approvedArtifactPinApproval(plan: LocalEmbeddingArtifactPlan) {
  return createLocalEmbeddingArtifactPinApprovalRecord({
    status: "approved",
    artifacts: plan.artifacts.map((artifact) => ({
      key: artifact.key,
      role: artifact.role,
      status: "approved",
      revision: artifact.revision,
      sha256: artifact.sha256,
      reasons: []
    })),
    reasons: []
  });
}
