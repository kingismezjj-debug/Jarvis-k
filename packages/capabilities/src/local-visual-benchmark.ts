export type LocalVisualBenchmarkCaseId =
  | "ocr_recognition"
  | "screen_capture"
  | "vision_analysis"
  | "degraded_visual";

export const LOCAL_VISUAL_BENCHMARK_CASES: readonly LocalVisualBenchmarkCaseId[] = [
  "ocr_recognition",
  "screen_capture",
  "vision_analysis",
  "degraded_visual"
];

export type LocalVisualFixtureBenchmarkOutcome =
  | "pass"
  | "degraded"
  | "failed";

export type LocalVisualFixtureBenchmarkReasonCode =
  | "VISUAL_BENCHMARK_COMPLETE"
  | "VISUAL_BENCHMARK_DEGRADED"
  | "VISUAL_BENCHMARK_FAILED"
  | "VISUAL_BENCHMARK_NO_CASES"
  | "VISUAL_BENCHMARK_UNSAFE_OBSERVATION";

export interface LocalVisualFixtureBenchmarkPlan {
  benchmarkId: "visual.fixture.contract";
  execution: "fixture_only";
  cases: readonly LocalVisualBenchmarkCaseId[];
  measurements: readonly [
    "ocr_result",
    "screen_capture_metadata",
    "vision_result",
    "degraded_case",
    "sanitized_output"
  ];
  rawPixelsPersisted: false;
  rawTextPersisted: false;
  metricValuesPersisted: false;
  realProviderExecutionEnabled: false;
  realScreenCaptureExecutionEnabled: false;
  modelOutputCommandsEnabled: false;
}

export interface LocalVisualFixtureBenchmarkObservation {
  caseId: LocalVisualBenchmarkCaseId;
  outcome: LocalVisualFixtureBenchmarkOutcome;
  ocrCompleted: boolean;
  screenCaptureCompleted: boolean;
  visionCompleted: boolean;
  rawPixelsPersisted: boolean;
  rawPixelsExposed: boolean;
  rawTextPersisted: boolean;
  modelOutputCommandsEnabled: boolean;
}

export interface LocalVisualFixtureBenchmarkReport {
  benchmarkId: "visual.fixture.contract";
  execution: "fixture_only";
  outcome: LocalVisualFixtureBenchmarkOutcome;
  reasonCode: LocalVisualFixtureBenchmarkReasonCode;
  caseCount: number;
  passedCaseCount: number;
  degradedCaseCount: number;
  failedCaseCount: number;
  ocrSuccessCount: number;
  screenCaptureSuccessCount: number;
  visionSuccessCount: number;
  safetyViolationDetected: boolean;
  rawPixelsPersisted: false;
  rawPixelsExposed: false;
  rawTextPersisted: false;
  metricValuesPersisted: false;
  realProviderExecutionEnabled: false;
  realScreenCaptureExecutionEnabled: false;
  modelOutputCommandsEnabled: false;
}

export function createLocalVisualFixtureBenchmarkPlan(): LocalVisualFixtureBenchmarkPlan {
  return {
    benchmarkId: "visual.fixture.contract",
    execution: "fixture_only",
    cases: LOCAL_VISUAL_BENCHMARK_CASES,
    measurements: [
      "ocr_result",
      "screen_capture_metadata",
      "vision_result",
      "degraded_case",
      "sanitized_output"
    ],
    rawPixelsPersisted: false,
    rawTextPersisted: false,
    metricValuesPersisted: false,
    realProviderExecutionEnabled: false,
    realScreenCaptureExecutionEnabled: false,
    modelOutputCommandsEnabled: false
  };
}

export function evaluateLocalVisualFixtureBenchmark(
  observations: readonly LocalVisualFixtureBenchmarkObservation[]
): LocalVisualFixtureBenchmarkReport {
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
  const safetyViolationDetected = boundedObservations.some(
    (observation) =>
      observation.rawPixelsPersisted ||
      observation.rawPixelsExposed ||
      observation.rawTextPersisted ||
      observation.modelOutputCommandsEnabled
  );
  const outcome =
    boundedObservations.length === 0 ||
    failedCaseCount > 0 ||
    safetyViolationDetected
      ? "failed"
      : degradedCaseCount > 0
        ? "degraded"
        : "pass";

  return {
    benchmarkId: "visual.fixture.contract",
    execution: "fixture_only",
    outcome,
    reasonCode:
      boundedObservations.length === 0
        ? "VISUAL_BENCHMARK_NO_CASES"
        : safetyViolationDetected
          ? "VISUAL_BENCHMARK_UNSAFE_OBSERVATION"
          : outcome === "pass"
            ? "VISUAL_BENCHMARK_COMPLETE"
            : outcome === "degraded"
              ? "VISUAL_BENCHMARK_DEGRADED"
              : "VISUAL_BENCHMARK_FAILED",
    caseCount: boundedObservations.length,
    passedCaseCount,
    degradedCaseCount,
    failedCaseCount,
    ocrSuccessCount: boundedObservations.filter(
      (observation) => observation.ocrCompleted
    ).length,
    screenCaptureSuccessCount: boundedObservations.filter(
      (observation) => observation.screenCaptureCompleted
    ).length,
    visionSuccessCount: boundedObservations.filter(
      (observation) => observation.visionCompleted
    ).length,
    safetyViolationDetected,
    rawPixelsPersisted: false,
    rawPixelsExposed: false,
    rawTextPersisted: false,
    metricValuesPersisted: false,
    realProviderExecutionEnabled: false,
    realScreenCaptureExecutionEnabled: false,
    modelOutputCommandsEnabled: false
  };
}
