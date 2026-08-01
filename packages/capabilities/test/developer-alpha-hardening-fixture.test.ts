import { describe, expect, it } from "vitest";
import {
  createDeveloperAlphaHardeningFixturePlan,
  evaluateDeveloperAlphaHardeningFixture
} from "../src";

describe("developer-alpha hardening fixture", () => {
  it("defines a bounded, fixture-only hardening plan", () => {
    const plan = createDeveloperAlphaHardeningFixturePlan();
    const serialized = JSON.stringify(plan);

    expect(plan).toMatchObject({
      benchmarkId: "developer-alpha.hardening.fixture",
      execution: "fixture_only",
      cases: [
        "startup_defaults",
        "fixture_fallback",
        "operation_recovery",
        "sanitized_diagnostics",
        "release_guard"
      ],
      observations: [
        "fail_closed_defaults",
        "fixture_fallback",
        "operation_recovery",
        "sanitized_diagnostics",
        "release_guard"
      ],
      operationStateSanitized: true,
      diagnosticsSanitized: true,
      fixtureFallbackRequired: true,
      restartSideEffectsAllowed: false,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      credentialsRequired: false,
      modelLoadingEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      rawDiagnosticsPersisted: false,
      privatePathsExposed: false,
      modelOutputCommandsEnabled: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("evaluates successful observations with only bounded counters", () => {
    const report = evaluateDeveloperAlphaHardeningFixture([
      observation("startup_defaults"),
      observation("fixture_fallback"),
      observation("operation_recovery"),
      observation("sanitized_diagnostics"),
      observation("release_guard")
    ]);

    expect(report).toMatchObject({
      outcome: "pass",
      reasonCode: "DEVELOPER_ALPHA_HARDENING_COMPLETE",
      caseCount: 5,
      passedCaseCount: 5,
      degradedCaseCount: 0,
      failedCaseCount: 0,
      operationStateSuccessCount: 5,
      defaultsDisabledCount: 5,
      fixtureFallbackSuccessCount: 5,
      sanitizedDiagnosticsSuccessCount: 5,
      restartRecoverySuccessCount: 5,
      safetyViolationDetected: false,
      operationStateSanitized: true,
      diagnosticsSanitized: true,
      fixtureFallbackRequired: true,
      restartSideEffectsAllowed: false,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      credentialsRequired: false,
      modelLoadingEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      rawDiagnosticsPersisted: false,
      privatePathsExposed: false,
      modelOutputCommandsEnabled: false
    });
    expect(report).not.toHaveProperty("privatePath");
    expect(report).not.toHaveProperty("credentialValue");
    expect(report).not.toHaveProperty("rawDiagnostics");
  });

  it("reports degraded fallback coverage without enabling side effects", () => {
    const report = evaluateDeveloperAlphaHardeningFixture([
      {
        ...observation("fixture_fallback"),
        outcome: "degraded",
        fixtureFallbackAvailable: false,
        restartRecovered: false
      }
    ]);

    expect(report).toMatchObject({
      outcome: "degraded",
      reasonCode: "DEVELOPER_ALPHA_HARDENING_DEGRADED",
      degradedCaseCount: 1,
      fixtureFallbackRequired: true,
      restartSideEffectsAllowed: false,
      filesystemWritesAllowed: false,
      providerRegistrationEnabled: false
    });
  });

  it("fails closed on empty or unsafe observations", () => {
    expect(evaluateDeveloperAlphaHardeningFixture([])).toMatchObject({
      outcome: "failed",
      reasonCode: "DEVELOPER_ALPHA_HARDENING_NO_CASES",
      caseCount: 0,
      safetyViolationDetected: false
    });

    const unsafeReport = evaluateDeveloperAlphaHardeningFixture([
      {
        ...observation("release_guard"),
        filesystemWriteAttempted: true,
        networkAccessAttempted: true,
        credentialExposed: true,
        privatePathExposed: true,
        rawDiagnosticsExposed: true,
        modelLoadingAttempted: true,
        providerRegistrationAttempted: true,
        executionEnabled: true,
        modelOutputCommandsEnabled: true
      }
    ]);
    const serialized = JSON.stringify(unsafeReport);

    expect(unsafeReport).toMatchObject({
      outcome: "failed",
      reasonCode: "DEVELOPER_ALPHA_HARDENING_UNSAFE_OBSERVATION",
      safetyViolationDetected: true,
      operationStateSanitized: true,
      diagnosticsSanitized: true,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      credentialsRequired: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      rawDiagnosticsPersisted: false,
      privatePathsExposed: false,
      modelOutputCommandsEnabled: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(
      /apiKey|credentialValue|privatePathValue|rawDiagnosticsValue|modelFileBytes/iu
    );
  });
});

function observation(
  caseId:
    | "startup_defaults"
    | "fixture_fallback"
    | "operation_recovery"
    | "sanitized_diagnostics"
    | "release_guard"
) {
  return {
    caseId,
    outcome: "pass" as const,
    operationStateObserved: true,
    defaultsDisabled: true,
    fixtureFallbackAvailable: true,
    diagnosticsSanitized: true,
    restartRecovered: true,
    filesystemWriteAttempted: false,
    networkAccessAttempted: false,
    credentialExposed: false,
    privatePathExposed: false,
    rawDiagnosticsExposed: false,
    modelLoadingAttempted: false,
    providerRegistrationAttempted: false,
    executionEnabled: false,
    modelOutputCommandsEnabled: false
  };
}
