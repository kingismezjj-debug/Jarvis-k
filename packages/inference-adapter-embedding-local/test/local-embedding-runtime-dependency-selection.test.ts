import { describe, expect, it } from "vitest";
import {
  createApprovedLocalEmbeddingRuntimeDependencySelectionApprovalRecord,
  createLocalEmbeddingRuntimeDependencySelectionApprovalRecord,
  isLocalEmbeddingRuntimeDependencySelectionApprovalRecordApproved,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME
} from "../src";

describe("local embedding runtime dependency selection", () => {
  it("defaults to pending without selecting or adding runtime dependencies", () => {
    const record =
      createLocalEmbeddingRuntimeDependencySelectionApprovalRecord();

    expect(record).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      runtime: "transformers",
      dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
      packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
      compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
      status: "pending",
      decision: {
        selectedRoute: "unselected",
        dependencyAdditionApproved: false,
        concretePackageVersionsSelected: false,
        runtimeDependencyPackageAllowlist: []
      },
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      dependencyValuesExposed: false
    });
    expect(
      isLocalEmbeddingRuntimeDependencySelectionApprovalRecordApproved(record)
    ).toBe(false);
  });

  it("approves a future Python Transformers child-process route without approving dependency addition", () => {
    const record =
      createApprovedLocalEmbeddingRuntimeDependencySelectionApprovalRecord();
    const serialized = JSON.stringify(record);

    expect(record).toMatchObject({
      status: "approved",
      decision: {
        selectedRoute: "python_transformers_child_process",
        dependencyAdditionApproved: false,
        concretePackageVersionsSelected: false,
        runtimeDependencyPackageAllowlist: [],
        futureDependencyReviewRequired: true,
        futureVersionPinningRequired: true,
        futureNoticeBundleUpdateRequired: true
      },
      guardrails: {
        dependenciesOnlyInDedicatedRuntimePackage: true,
        protectedPackagesRemainDependencyFree: true,
        coreHostCompositionOnly: true,
        childProcessIsolationRequired: true,
        resourceLeaseRequiredBeforeModelLoad: true,
        licenseReviewRequiredBeforeDependencyAddition: true,
        nativeDependencyReviewRequiredBeforeDependencyAddition: true,
        benchmarkRequiredBeforeExecution: true,
        fallbackProviderRequired: true
      },
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      dependencyValuesExposed: false
    });
    expect(record.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          route: "python_transformers_child_process",
          decision: "preferred",
          runtimeDependenciesIntroduced: false,
          concretePackageVersionsSelected: false
        }),
        expect.objectContaining({
          route: "transformers_js_child_process",
          decision: "deferred"
        }),
        expect.objectContaining({
          route: "onnx_runtime_child_process",
          decision: "deferred"
        })
      ])
    );
    expect(
      isLocalEmbeddingRuntimeDependencySelectionApprovalRecordApproved(record)
    ).toBe(true);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("C:\\");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });

  it("rejects approval when dependencies, versions, execution, or isolation constraints regress", () => {
    const approved =
      createApprovedLocalEmbeddingRuntimeDependencySelectionApprovalRecord();

    expect(
      isLocalEmbeddingRuntimeDependencySelectionApprovalRecordApproved({
        ...approved,
        decision: {
          ...approved.decision,
          dependencyAdditionApproved: true as false
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimeDependencySelectionApprovalRecordApproved({
        ...approved,
        decision: {
          ...approved.decision,
          runtimeDependencyPackageAllowlist: ["transformers"]
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimeDependencySelectionApprovalRecordApproved({
        ...approved,
        candidates: approved.candidates.map((candidate) =>
          candidate.route === "python_transformers_child_process"
            ? {
                ...candidate,
                concretePackageVersionsSelected: true as false
              }
            : candidate
        )
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimeDependencySelectionApprovalRecordApproved({
        ...approved,
        guardrails: {
          ...approved.guardrails,
          childProcessIsolationRequired: false as true
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimeDependencySelectionApprovalRecordApproved({
        ...approved,
        executionEnabled: true as false
      })
    ).toBe(false);
  });
});
