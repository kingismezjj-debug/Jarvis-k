import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingRuntimeImplementationProcedure,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME
} from "../src";

describe("local embedding runtime implementation procedure", () => {
  it("defaults to pending without introducing runtime or execution", () => {
    const procedure = createLocalEmbeddingRuntimeImplementationProcedure();

    expect(procedure).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
      status: "pending",
      runtimeDependenciesIntroduced: false,
      executionEnabled: false,
      implementationValuesExposed: false
    });
    expect(procedure.steps.map((step) => step.key)).toEqual([
      "runtime.package_boundary_approved",
      "runtime.helper_process_supervised",
      "runtime.windows_packaging_documented",
      "runtime.resource_scheduler_integrated",
      "runtime.failure_degradation_defined",
      "runtime.dependencies_deferred",
      "execution.disabled",
      "verification.clean"
    ]);
  });

  it("rejects runtime dependencies or enabled execution", () => {
    const procedure = createLocalEmbeddingRuntimeImplementationProcedure({
      packageBoundaryApproved: true,
      helperProcessSupervised: true,
      windowsPackagingDocumented: true,
      resourceSchedulerIntegrated: true,
      failureDegradationDefined: true,
      runtimeDependenciesIntroduced: true,
      executionEnabled: true,
      verificationClean: true
    });

    expect(procedure.status).toBe("pending");
    expect(procedure.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runtime.dependencies_deferred",
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
    const procedure = createLocalEmbeddingRuntimeImplementationProcedure({
      packageBoundaryApproved: true,
      helperProcessSupervised: true,
      windowsPackagingDocumented: true,
      resourceSchedulerIntegrated: true,
      failureDegradationDefined: true,
      runtimeDependenciesIntroduced: false,
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
    expect(serialized).not.toContain("executionEnabled\":true");
  });
});
