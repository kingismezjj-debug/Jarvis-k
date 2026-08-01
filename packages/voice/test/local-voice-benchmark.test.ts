import { describe, expect, it } from "vitest";
import {
  createLocalVoiceFixtureBenchmarkPlan,
  evaluateLocalVoiceFixtureBenchmark,
  type LocalVoiceFixtureBenchmarkObservation
} from "../src";

const healthyObservations: LocalVoiceFixtureBenchmarkObservation[] = [
  {
    caseId: "ptt_finalization",
    outcome: "pass",
    finalTranscriptReceived: true,
    continuousRecoveryCompleted: false,
    ttsInterruptionHandled: false,
    resourceOverlapDetected: false
  },
  {
    caseId: "continuous_recovery",
    outcome: "pass",
    finalTranscriptReceived: true,
    continuousRecoveryCompleted: true,
    ttsInterruptionHandled: false,
    resourceOverlapDetected: false
  },
  {
    caseId: "tts_barge_in",
    outcome: "pass",
    finalTranscriptReceived: false,
    continuousRecoveryCompleted: true,
    ttsInterruptionHandled: true,
    resourceOverlapDetected: false
  }
];

describe("local voice fixture benchmark", () => {
  it("defines bounded fixture-only measurements", () => {
    const plan = createLocalVoiceFixtureBenchmarkPlan();

    expect(plan).toEqual({
      benchmarkId: "voice.fixture.contract",
      execution: "fixture_only",
      cases: [
        "ptt_finalization",
        "continuous_recovery",
        "tts_barge_in",
        "degraded_provider"
      ],
      measurements: [
        "final_transcript",
        "continuous_recovery",
        "tts_interruption",
        "degraded_case",
        "resource_overlap"
      ],
      rawAudioPersisted: false,
      rawTranscriptPersisted: false,
      metricValuesPersisted: false,
      realProviderExecutionEnabled: false,
      realAudioExecutionEnabled: false
    });
  });

  it("reports deterministic pass counts without raw voice payloads", () => {
    const report = evaluateLocalVoiceFixtureBenchmark(healthyObservations);

    expect(report).toMatchObject({
      benchmarkId: "voice.fixture.contract",
      execution: "fixture_only",
      outcome: "pass",
      reasonCode: "FIXTURE_BENCHMARK_COMPLETE",
      caseCount: 3,
      passedCaseCount: 3,
      degradedCaseCount: 0,
      failedCaseCount: 0,
      finalTranscriptSuccessCount: 2,
      continuousRecoverySuccessCount: 2,
      ttsInterruptionSuccessCount: 1,
      resourceOverlapDetected: false,
      rawAudioPersisted: false,
      rawTranscriptPersisted: false,
      metricValuesPersisted: false,
      realProviderExecutionEnabled: false,
      realAudioExecutionEnabled: false
    });
    expect(report).not.toHaveProperty("audio");
    expect(report).not.toHaveProperty("transcript");
  });

  it("reports partial fixture availability as degraded", () => {
    const report = evaluateLocalVoiceFixtureBenchmark([
      ...healthyObservations,
      {
        caseId: "degraded_provider",
        outcome: "degraded",
        finalTranscriptReceived: false,
        continuousRecoveryCompleted: false,
        ttsInterruptionHandled: false,
        resourceOverlapDetected: false
      }
    ]);

    expect(report).toMatchObject({
      outcome: "degraded",
      reasonCode: "FIXTURE_BENCHMARK_DEGRADED",
      caseCount: 4,
      passedCaseCount: 3,
      degradedCaseCount: 1,
      failedCaseCount: 0
    });
  });

  it("fails closed on empty or overlapping fixture observations", () => {
    const empty = evaluateLocalVoiceFixtureBenchmark([]);
    const overlap = evaluateLocalVoiceFixtureBenchmark([
      {
        ...healthyObservations[0]!,
        resourceOverlapDetected: true
      }
    ]);

    expect(empty).toMatchObject({
      outcome: "failed",
      reasonCode: "FIXTURE_BENCHMARK_NO_CASES",
      caseCount: 0,
      failedCaseCount: 0
    });
    expect(overlap).toMatchObject({
      outcome: "failed",
      reasonCode: "FIXTURE_BENCHMARK_FAILED",
      resourceOverlapDetected: true
    });
  });

  it("does not echo extra transcript, audio, or credential-like fields", () => {
    const observation = {
      ...healthyObservations[0]!,
      transcriptText: "fixture-only transcript",
      audioBytes: [1, 2, 3],
      credentialLikeValue: "redacted"
    } as LocalVoiceFixtureBenchmarkObservation;
    const report = evaluateLocalVoiceFixtureBenchmark([observation]);
    const serialized = JSON.stringify(report);

    expect(serialized).not.toMatch(/fixture-only transcript/u);
    expect(serialized).not.toMatch(/audioBytes/u);
    expect(serialized).not.toMatch(/credentialLikeValue/u);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });
});
