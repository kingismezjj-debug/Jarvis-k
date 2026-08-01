import { describe, expect, it } from "vitest";
import {
  createModelLifecycleFixturePlan,
  evaluateModelLifecycleFixture
} from "../src";

describe("model lifecycle fixture harness", () => {
  it("defines a dry-run model management and rollback plan", () => {
    const plan = createModelLifecycleFixturePlan();
    const serialized = JSON.stringify(plan);

    expect(plan).toMatchObject({
      benchmarkId: "model.lifecycle.fixture",
      execution: "fixture_only",
      cases: [
        "install_preflight",
        "artifact_verification",
        "upgrade_plan",
        "rollback_plan"
      ],
      operations: [
        "prepare_install",
        "verify_manifest",
        "plan_upgrade",
        "plan_rollback"
      ],
      operationStateSanitized: true,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      modelLoadingEnabled: false,
      installerBundlingEnabled: false,
      autoUpdateEnabled: false,
      rollbackExecutionEnabled: false,
      rawModelValuesPersisted: false,
      privatePathsExposed: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("evaluates successful fixture lifecycle observations", () => {
    const report = evaluateModelLifecycleFixture([
      observation("install_preflight"),
      observation("artifact_verification"),
      observation("upgrade_plan"),
      observation("rollback_plan")
    ]);

    expect(report).toMatchObject({
      outcome: "pass",
      reasonCode: "MODEL_LIFECYCLE_FIXTURE_COMPLETE",
      caseCount: 4,
      passedCaseCount: 4,
      degradedCaseCount: 0,
      failedCaseCount: 0,
      operationStateSuccessCount: 4,
      manifestPinSuccessCount: 4,
      digestVerificationSuccessCount: 4,
      safetyViolationDetected: false,
      operationStateSanitized: true,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      modelLoadingEnabled: false,
      installerBundlingEnabled: false,
      autoUpdateEnabled: false,
      rollbackExecutionEnabled: false,
      rawModelValuesPersisted: false,
      privatePathsExposed: false
    });
    expect(report).not.toHaveProperty("modelId");
    expect(report).not.toHaveProperty("revision");
    expect(report).not.toHaveProperty("sha256");
  });

  it("reports degraded fixture coverage without enabling lifecycle side effects", () => {
    const report = evaluateModelLifecycleFixture([
      {
        ...observation("rollback_plan"),
        outcome: "degraded",
        digestVerified: false
      }
    ]);

    expect(report).toMatchObject({
      outcome: "degraded",
      reasonCode: "MODEL_LIFECYCLE_FIXTURE_DEGRADED",
      degradedCaseCount: 1,
      rollbackExecutionEnabled: false,
      filesystemWritesAllowed: false
    });
  });

  it("fails closed on empty or unsafe observations", () => {
    expect(evaluateModelLifecycleFixture([])).toMatchObject({
      outcome: "failed",
      reasonCode: "MODEL_LIFECYCLE_FIXTURE_NO_CASES",
      caseCount: 0,
      safetyViolationDetected: false
    });

    const unsafeReport = evaluateModelLifecycleFixture([
      {
        ...observation("upgrade_plan"),
        filesystemWriteAttempted: true,
        networkAccessAttempted: true,
        signedUrlPersisted: true,
        privatePathExposed: true,
        modelLoadingAttempted: true,
        installerBundlingAttempted: true,
        autoUpdateAttempted: true,
        rollbackExecuted: true
      }
    ]);
    const serialized = JSON.stringify(unsafeReport);

    expect(unsafeReport).toMatchObject({
      outcome: "failed",
      reasonCode: "MODEL_LIFECYCLE_FIXTURE_UNSAFE_OBSERVATION",
      safetyViolationDetected: true,
      filesystemWritesAllowed: false,
      networkAccessAllowed: false,
      modelLoadingEnabled: false,
      installerBundlingEnabled: false,
      autoUpdateEnabled: false,
      rollbackExecutionEnabled: false,
      rawModelValuesPersisted: false,
      privatePathsExposed: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(
      /apiKey|credentialValue|modelId|revision|sha256|cachePathValue/iu
    );
  });
});

function observation(
  caseId:
    | "install_preflight"
    | "artifact_verification"
    | "upgrade_plan"
    | "rollback_plan"
) {
  return {
    caseId,
    outcome: "pass" as const,
    operationStateObserved: true,
    manifestPinVerified: true,
    digestVerified: true,
    filesystemWriteAttempted: false,
    networkAccessAttempted: false,
    signedUrlPersisted: false,
    privatePathExposed: false,
    modelLoadingAttempted: false,
    installerBundlingAttempted: false,
    autoUpdateAttempted: false,
    rollbackExecuted: false
  };
}
