import { describe, expect, it } from "vitest";
import {
  createLocalVisualFixtureBenchmarkPlan,
  evaluateLocalVisualFixtureBenchmark
} from "../src";

describe("local visual fixture benchmark", () => {
  it("defines a fixture-only benchmark with bounded sanitized outputs", () => {
    const plan = createLocalVisualFixtureBenchmarkPlan();
    const serialized = JSON.stringify(plan);

    expect(plan).toMatchObject({
      benchmarkId: "visual.fixture.contract",
      execution: "fixture_only",
      cases: [
        "ocr_recognition",
        "screen_capture",
        "vision_analysis",
        "degraded_visual"
      ],
      rawPixelsPersisted: false,
      rawTextPersisted: false,
      metricValuesPersisted: false,
      realProviderExecutionEnabled: false,
      realScreenCaptureExecutionEnabled: false,
      modelOutputCommandsEnabled: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("evaluates successful fixture observations without persisting raw data", () => {
    const report = evaluateLocalVisualFixtureBenchmark([
      {
        caseId: "ocr_recognition",
        outcome: "pass",
        ocrCompleted: true,
        screenCaptureCompleted: false,
        visionCompleted: false,
        rawPixelsPersisted: false,
        rawPixelsExposed: false,
        rawTextPersisted: false,
        modelOutputCommandsEnabled: false
      },
      {
        caseId: "screen_capture",
        outcome: "pass",
        ocrCompleted: false,
        screenCaptureCompleted: true,
        visionCompleted: false,
        rawPixelsPersisted: false,
        rawPixelsExposed: false,
        rawTextPersisted: false,
        modelOutputCommandsEnabled: false
      },
      {
        caseId: "vision_analysis",
        outcome: "pass",
        ocrCompleted: false,
        screenCaptureCompleted: false,
        visionCompleted: true,
        rawPixelsPersisted: false,
        rawPixelsExposed: false,
        rawTextPersisted: false,
        modelOutputCommandsEnabled: false
      }
    ]);

    expect(report).toMatchObject({
      outcome: "pass",
      reasonCode: "VISUAL_BENCHMARK_COMPLETE",
      caseCount: 3,
      passedCaseCount: 3,
      degradedCaseCount: 0,
      failedCaseCount: 0,
      ocrSuccessCount: 1,
      screenCaptureSuccessCount: 1,
      visionSuccessCount: 1,
      safetyViolationDetected: false,
      rawPixelsPersisted: false,
      rawPixelsExposed: false,
      rawTextPersisted: false,
      metricValuesPersisted: false
    });
    expect(report).not.toHaveProperty("rawText");
    expect(report).not.toHaveProperty("imageBytes");
  });

  it("reports degraded fixture coverage without enabling real execution", () => {
    const report = evaluateLocalVisualFixtureBenchmark([
      {
        caseId: "degraded_visual",
        outcome: "degraded",
        ocrCompleted: false,
        screenCaptureCompleted: true,
        visionCompleted: false,
        rawPixelsPersisted: false,
        rawPixelsExposed: false,
        rawTextPersisted: false,
        modelOutputCommandsEnabled: false
      }
    ]);

    expect(report).toMatchObject({
      outcome: "degraded",
      reasonCode: "VISUAL_BENCHMARK_DEGRADED",
      degradedCaseCount: 1,
      realProviderExecutionEnabled: false,
      realScreenCaptureExecutionEnabled: false,
      modelOutputCommandsEnabled: false
    });
  });

  it("fails closed on empty or unsafe observations", () => {
    expect(
      evaluateLocalVisualFixtureBenchmark([])
    ).toMatchObject({
      outcome: "failed",
      reasonCode: "VISUAL_BENCHMARK_NO_CASES",
      caseCount: 0,
      safetyViolationDetected: false
    });

    const unsafeReport = evaluateLocalVisualFixtureBenchmark([
      {
        caseId: "vision_analysis",
        outcome: "pass",
        ocrCompleted: false,
        screenCaptureCompleted: false,
        visionCompleted: true,
        rawPixelsPersisted: true,
        rawPixelsExposed: false,
        rawTextPersisted: false,
        modelOutputCommandsEnabled: true
      }
    ]);
    const serialized = JSON.stringify(unsafeReport);

    expect(unsafeReport).toMatchObject({
      outcome: "failed",
      reasonCode: "VISUAL_BENCHMARK_UNSAFE_OBSERVATION",
      safetyViolationDetected: true,
      rawPixelsPersisted: false,
      rawPixelsExposed: false,
      rawTextPersisted: false,
      modelOutputCommandsEnabled: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(
      /apiKey|signedUrl|privatePath|imageBytes|rawContent/iu
    );
  });
});
