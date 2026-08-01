export type LocalVoiceBenchmarkCaseId =
  | "ptt_finalization"
  | "continuous_recovery"
  | "tts_barge_in"
  | "degraded_provider";

export const LOCAL_VOICE_BENCHMARK_CASES: readonly LocalVoiceBenchmarkCaseId[] = [
  "ptt_finalization",
  "continuous_recovery",
  "tts_barge_in",
  "degraded_provider"
];

export type LocalVoiceFixtureBenchmarkOutcome =
  | "pass"
  | "degraded"
  | "failed";

export type LocalVoiceFixtureBenchmarkReasonCode =
  | "FIXTURE_BENCHMARK_COMPLETE"
  | "FIXTURE_BENCHMARK_DEGRADED"
  | "FIXTURE_BENCHMARK_FAILED"
  | "FIXTURE_BENCHMARK_NO_CASES";

export interface LocalVoiceFixtureBenchmarkPlan {
  benchmarkId: "voice.fixture.contract";
  execution: "fixture_only";
  cases: readonly LocalVoiceBenchmarkCaseId[];
  measurements: readonly [
    "final_transcript",
    "continuous_recovery",
    "tts_interruption",
    "degraded_case",
    "resource_overlap"
  ];
  rawAudioPersisted: false;
  rawTranscriptPersisted: false;
  metricValuesPersisted: false;
  realProviderExecutionEnabled: false;
  realAudioExecutionEnabled: false;
}

export interface LocalVoiceFixtureBenchmarkObservation {
  caseId: LocalVoiceBenchmarkCaseId;
  outcome: LocalVoiceFixtureBenchmarkOutcome;
  finalTranscriptReceived: boolean;
  continuousRecoveryCompleted: boolean;
  ttsInterruptionHandled: boolean;
  resourceOverlapDetected: boolean;
}

export interface LocalVoiceFixtureBenchmarkReport {
  benchmarkId: "voice.fixture.contract";
  execution: "fixture_only";
  outcome: LocalVoiceFixtureBenchmarkOutcome;
  reasonCode: LocalVoiceFixtureBenchmarkReasonCode;
  caseCount: number;
  passedCaseCount: number;
  degradedCaseCount: number;
  failedCaseCount: number;
  finalTranscriptSuccessCount: number;
  continuousRecoverySuccessCount: number;
  ttsInterruptionSuccessCount: number;
  resourceOverlapDetected: boolean;
  rawAudioPersisted: false;
  rawTranscriptPersisted: false;
  metricValuesPersisted: false;
  realProviderExecutionEnabled: false;
  realAudioExecutionEnabled: false;
}

export function createLocalVoiceFixtureBenchmarkPlan(): LocalVoiceFixtureBenchmarkPlan {
  return {
    benchmarkId: "voice.fixture.contract",
    execution: "fixture_only",
    cases: LOCAL_VOICE_BENCHMARK_CASES,
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
  };
}

export function evaluateLocalVoiceFixtureBenchmark(
  observations: readonly LocalVoiceFixtureBenchmarkObservation[]
): LocalVoiceFixtureBenchmarkReport {
  const boundedObservations = observations.slice(0, 32);
  const passedCaseCount = boundedObservations.filter(
    (observation) => observation.outcome === "pass"
  ).length;
  const degradedCaseCount = boundedObservations.filter(
    (observation) => observation.outcome === "degraded"
  ).length;
  const failedCaseCount = boundedObservations.filter(
    (observation) => observation.outcome === "failed"
  ).length;
  const resourceOverlapDetected = boundedObservations.some(
    (observation) => observation.resourceOverlapDetected
  );
  const outcome =
    boundedObservations.length === 0 ||
    failedCaseCount > 0 ||
    resourceOverlapDetected
      ? "failed"
      : degradedCaseCount > 0
        ? "degraded"
        : "pass";

  return {
    benchmarkId: "voice.fixture.contract",
    execution: "fixture_only",
    outcome,
    reasonCode:
      boundedObservations.length === 0
        ? "FIXTURE_BENCHMARK_NO_CASES"
        : outcome === "pass"
          ? "FIXTURE_BENCHMARK_COMPLETE"
          : outcome === "degraded"
            ? "FIXTURE_BENCHMARK_DEGRADED"
            : "FIXTURE_BENCHMARK_FAILED",
    caseCount: boundedObservations.length,
    passedCaseCount,
    degradedCaseCount,
    failedCaseCount,
    finalTranscriptSuccessCount: boundedObservations.filter(
      (observation) => observation.finalTranscriptReceived
    ).length,
    continuousRecoverySuccessCount: boundedObservations.filter(
      (observation) => observation.continuousRecoveryCompleted
    ).length,
    ttsInterruptionSuccessCount: boundedObservations.filter(
      (observation) => observation.ttsInterruptionHandled
    ).length,
    resourceOverlapDetected,
    rawAudioPersisted: false,
    rawTranscriptPersisted: false,
    metricValuesPersisted: false,
    realProviderExecutionEnabled: false,
    realAudioExecutionEnabled: false
  };
}
