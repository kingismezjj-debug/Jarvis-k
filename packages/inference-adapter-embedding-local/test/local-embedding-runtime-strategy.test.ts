import { describe, expect, it } from "vitest";
import {
  createApprovedLocalEmbeddingRuntimeStrategy,
  createLocalEmbeddingRuntimeAdapterDescriptor,
  createLocalEmbeddingRuntimeStrategy,
  createLocalEmbeddingTokenizerConfigIntegrationReview,
  isLocalEmbeddingRuntimeStrategyApproved,
  LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME
} from "../src";

describe("local embedding runtime strategy", () => {
  it("keeps runtime selection provisional and scoped to a dedicated package", () => {
    expect(createLocalEmbeddingRuntimeStrategy()).toMatchObject({
      runtime: "transformers",
      status: "provisional",
      dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
      dependencyScope: "dedicated_runtime_package_only",
      runtimeDependenciesIntroduced: false,
      executionEnabled: false
    });
  });

  it("documents every runtime gate as unsatisfied before dependencies are added", () => {
    const strategy = createLocalEmbeddingRuntimeStrategy();

    expect(strategy.requiredGates).toHaveLength(5);
    expect(strategy.requiredGates.every((gate) => !gate.satisfied)).toBe(true);
    expect(strategy.reasons).toEqual(
      strategy.requiredGates.map((gate) => gate.reason)
    );
  });

  it("keeps protected packages out of the runtime dependency scope", () => {
    expect(
      createLocalEmbeddingRuntimeStrategy().forbiddenDependencyLocations
    ).toEqual([
      "packages/contracts",
      "packages/capabilities",
      "packages/core",
      "apps/desktop",
      "apps/ui"
    ]);
  });

  it("surfaces the dedicated package scope in the planning descriptor", () => {
    expect(createLocalEmbeddingRuntimeAdapterDescriptor().notes).toContain(
      `Future runtime dependencies are scoped to ${LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME}.`
    );
  });

  it("approves only fully reviewed runtime strategies", () => {
    const approved = createApprovedLocalEmbeddingRuntimeStrategy();

    expect(isLocalEmbeddingRuntimeStrategyApproved(approved)).toBe(true);
    expect(
      isLocalEmbeddingRuntimeStrategyApproved({
        ...approved,
        status: "provisional"
      })
    ).toBe(false);
    const { packageBoundary: _packageBoundary, ...withoutPackageBoundary } =
      approved;
    expect(
      isLocalEmbeddingRuntimeStrategyApproved(withoutPackageBoundary)
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimeStrategyApproved({
        ...approved,
        processIsolation: {
          ...approved.processIsolation!,
          directShellExecutionAllowed: true as false
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimeStrategyApproved({
        ...approved,
        windowsPackaging: {
          ...approved.windowsPackaging!,
          bundledModelArtifacts: true as false
        }
      })
    ).toBe(false);
  });

  it("requires the tokenizer/config integration review for runtime approval", () => {
    const approved = createApprovedLocalEmbeddingRuntimeStrategy();

    expect(
      isLocalEmbeddingRuntimeStrategyApproved({
        ...approved,
        tokenizerConfigReview:
          createLocalEmbeddingTokenizerConfigIntegrationReview()
      })
    ).toBe(false);
  });

  it("records approved packaging and process isolation without runtime dependencies", () => {
    const strategy = createApprovedLocalEmbeddingRuntimeStrategy();
    const serialized = JSON.stringify(strategy);

    expect(strategy).toMatchObject({
      status: "approved",
      runtimeDependenciesIntroduced: false,
      executionEnabled: false,
      packageBoundary: {
        dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
        packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
        compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
        runtimeDependenciesIntroduced: false
      },
      processIsolation: {
        mode: "supervised_child_process",
        supervisor: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
        ipc: "private_child_process_ipc",
        resourceLeaseRequired: true,
        sanitizedFailureReporting: true,
        directShellExecutionAllowed: false,
        modelOutputActionPolicy: "validated_intent_only"
      },
      windowsPackaging: {
        status: "planned",
        bundledModelArtifacts: false,
        cachePathCommitted: false,
        installerBundling: "deferred",
        updateRollbackPlanRequired: true,
        noticeBundleRequired: true
      }
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("executionEnabled\":true");
  });
});
