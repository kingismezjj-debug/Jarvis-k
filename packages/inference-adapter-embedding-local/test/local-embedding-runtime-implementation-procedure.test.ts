import { describe, expect, it } from "vitest";
import {
  createApprovedLocalEmbeddingRuntimeImplementationApprovalRecord,
  createLocalEmbeddingRuntimeImplementationProcedure,
  isLocalEmbeddingRuntimeImplementationApprovalRecordApproved,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
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

  it("approves implementation constraints without adding runtime dependencies", () => {
    const record =
      createApprovedLocalEmbeddingRuntimeImplementationApprovalRecord();
    const serialized = JSON.stringify(record);

    expect(record).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
      status: "approved",
      packageManifest: {
        packageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
        packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
        privatePackageRequired: true,
        dependencyAllowlist: [],
        exportsRuntimeAdapterOnly: true
      },
      cacheLayout: {
        cachePathCommitted: false,
        modelArtifactsCommitted: false,
        signedUrlsPersisted: false,
        hashVerifiedBeforeUse: true,
        cleanupOnFailedVerification: true
      },
      helperLifecycle: {
        supervisor: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
        mode: "supervised_child_process",
        startupTimeoutDefined: true,
        shutdownTimeoutDefined: true,
        resourceLeaseRequired: true,
        sanitizedLogsRequired: true,
        directShellExecutionAllowed: false
      },
      failureModes: {
        startupFailure: "provider_unconfigured",
        loadFailure: "provider_unconfigured",
        verificationFailure: "artifact_unavailable",
        executionFailure: "sanitized_failure",
        fallbackProviderRequired: true
      },
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      implementationValuesExposed: false
    });
    expect(
      record.packageManifest.forbiddenRuntimeDependencies
    ).toEqual(
      expect.arrayContaining(["onnxruntime", "python-shell", "transformers"])
    );
    expect(
      isLocalEmbeddingRuntimeImplementationApprovalRecordApproved(record)
    ).toBe(true);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("C:\\");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });

  it("rejects implementation approval when runtime, cache, shell, or procedure gates regress", () => {
    const approved =
      createApprovedLocalEmbeddingRuntimeImplementationApprovalRecord();

    expect(
      isLocalEmbeddingRuntimeImplementationApprovalRecordApproved({
        ...approved,
        runtimeDependenciesIntroduced: true as false
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimeImplementationApprovalRecordApproved({
        ...approved,
        downloadEnabled: true as false
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimeImplementationApprovalRecordApproved({
        ...approved,
        cacheLayout: {
          ...approved.cacheLayout,
          modelArtifactsCommitted: true as false
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimeImplementationApprovalRecordApproved({
        ...approved,
        helperLifecycle: {
          ...approved.helperLifecycle,
          directShellExecutionAllowed: true as false
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimeImplementationApprovalRecordApproved(
        approved,
        createLocalEmbeddingRuntimeImplementationProcedure()
      )
    ).toBe(false);
  });
});
