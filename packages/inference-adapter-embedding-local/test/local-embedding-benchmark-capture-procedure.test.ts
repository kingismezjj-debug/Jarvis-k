import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingBenchmarkCaptureProcedure,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "../src";

describe("local embedding benchmark capture procedure", () => {
  it("defaults to pending without enabling downloads, execution, or metrics", () => {
    const procedure = createLocalEmbeddingBenchmarkCaptureProcedure();

    expect(procedure).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      runtime: "transformers",
      status: "pending",
      downloadEnabled: false,
      executionEnabled: false,
      metricValuesExposed: false
    });
    expect(procedure.profiles).toEqual([
      {
        key: "lite",
        latencyProfileRequired: true,
        memoryProfileRequired: true,
        qualityProfileRequired: true
      },
      {
        key: "standard",
        latencyProfileRequired: true,
        memoryProfileRequired: true,
        qualityProfileRequired: true
      },
      {
        key: "local_enhanced",
        latencyProfileRequired: true,
        memoryProfileRequired: true,
        qualityProfileRequired: true
      }
    ]);
    expect(procedure.steps.map((step) => step.key)).toEqual([
      "benchmarks.profiles_confirmed",
      "benchmarks.dataset_defined",
      "benchmarks.latency_method_defined",
      "benchmarks.memory_method_defined",
      "benchmarks.quality_method_defined",
      "benchmarks.resource_isolation_defined",
      "benchmarks.failure_degradation_defined",
      "benchmarks.privacy_sanitized",
      "benchmarks.metric_values_deferred",
      "benchmarks.approval_record_local",
      "downloads.disabled",
      "execution.disabled",
      "verification.clean"
    ]);
  });

  it("rejects metric capture, downloads, or execution during procedure approval", () => {
    const procedure = createLocalEmbeddingBenchmarkCaptureProcedure({
      profilesConfirmed: true,
      datasetDefined: true,
      latencyMethodDefined: true,
      memoryMethodDefined: true,
      qualityMethodDefined: true,
      resourceIsolationDefined: true,
      failureDegradationDefined: true,
      privacySanitized: true,
      metricValuesCaptured: true,
      approvalRecordLocal: true,
      downloadEnabled: true,
      executionEnabled: true,
      verificationClean: true
    });

    expect(procedure.status).toBe("pending");
    expect(procedure.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "benchmarks.metric_values_deferred",
          satisfied: false
        }),
        expect.objectContaining({
          key: "downloads.disabled",
          satisfied: false
        }),
        expect.objectContaining({
          key: "execution.disabled",
          satisfied: false
        })
      ])
    );
  });

  it("can become ready for approval with sanitized procedure output", () => {
    const procedure = createLocalEmbeddingBenchmarkCaptureProcedure({
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
    });
    const serialized = JSON.stringify(procedure);

    expect(procedure.status).toBe("ready_for_approval");
    expect(procedure.reasons).toEqual([]);
    expect(procedure.steps.every((step) => step.satisfied)).toBe(true);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("latencyMs");
    expect(serialized).not.toContain("memoryBytes");
    expect(serialized).not.toContain("score");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });
});
