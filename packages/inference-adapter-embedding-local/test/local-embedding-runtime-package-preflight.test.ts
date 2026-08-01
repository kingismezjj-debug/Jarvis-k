import { describe, expect, it } from "vitest";
import {
  createApprovedLocalEmbeddingRuntimePackagePreflightApprovalRecord,
  createLocalEmbeddingRuntimePackagePreflightApprovalRecord,
  isLocalEmbeddingRuntimePackagePreflightApprovalRecordApproved,
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID,
  LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME
} from "../src";

describe("local embedding runtime package preflight", () => {
  it("defaults to pending without scaffolding a package or enabling runtime behavior", () => {
    const record = createLocalEmbeddingRuntimePackagePreflightApprovalRecord();

    expect(record).toMatchObject({
      provider: LOCAL_EMBEDDING_PROVIDER_ID,
      modelId: LOCAL_EMBEDDING_MODEL_ID,
      runtime: "transformers",
      dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
      packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
      compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
      status: "pending",
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      preflightValuesExposed: false
    });
    expect(record.boundary).toMatchObject({
      packageScaffolded: false,
      workspaceRegistrationDeferred: true,
      runtimeBehaviorImplemented: false
    });
    expect(
      isLocalEmbeddingRuntimePackagePreflightApprovalRecordApproved(record)
    ).toBe(false);
  });

  it("approves an adapter-only dedicated runtime package boundary", () => {
    const record =
      createApprovedLocalEmbeddingRuntimePackagePreflightApprovalRecord();
    const serialized = JSON.stringify(record);

    expect(record).toMatchObject({
      status: "approved",
      boundary: {
        packageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
        packageLocation: LOCAL_EMBEDDING_RUNTIME_PACKAGE_LOCATION,
        compositionRoot: LOCAL_EMBEDDING_RUNTIME_COMPOSITION_ROOT,
        privatePackageRequired: true,
        packageScaffolded: false,
        workspaceRegistrationDeferred: true,
        runtimeBehaviorImplemented: false
      },
      publicSurface: {
        adapterOnlyExports: true,
        modelArtifactPathExportsAllowed: false,
        downloaderExportsAllowed: false,
        processLauncherExportsAllowed: false,
        providerPolicyExportsAllowed: false
      },
      importPolicy: {
        allowedWorkspaceImports: ["@jarvis-k/contracts"],
        concreteCompositionOnlyInCoreHost: true
      },
      safety: {
        childProcessRequiredForExecution: true,
        resourceLeaseRequiredBeforeLoad: true,
        directShellExecutionAllowed: false,
        modelOutputActionPolicy: "validated_intent_only",
        sanitizedErrorsRequired: true
      },
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      preflightValuesExposed: false
    });
    expect(record.publicSurface.allowedExportRoles).toEqual(
      expect.arrayContaining([
        "runtime_adapter_descriptor",
        "runtime_adapter_factory",
        "runtime_health_probe",
        "sanitized_error_mapping"
      ])
    );
    expect(record.importPolicy.forbiddenWorkspaceImports).toEqual(
      expect.arrayContaining([
        "@jarvis-k/core",
        "@jarvis-k/capabilities",
        "@jarvis-k/inference-adapter-embedding-local",
        "apps/desktop",
        "apps/ui"
      ])
    );
    expect(record.importPolicy.forbiddenRuntimeDependencyImports).toEqual(
      expect.arrayContaining(["onnxruntime", "python-shell", "transformers"])
    );
    expect(
      isLocalEmbeddingRuntimePackagePreflightApprovalRecordApproved(record)
    ).toBe(true);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toContain("model.safetensors");
    expect(serialized).not.toContain("C:\\");
    expect(serialized).not.toContain("downloadEnabled\":true");
    expect(serialized).not.toContain("executionEnabled\":true");
  });

  it("rejects preflight approval when package, import, surface, or safety constraints regress", () => {
    const approved =
      createApprovedLocalEmbeddingRuntimePackagePreflightApprovalRecord();

    expect(
      isLocalEmbeddingRuntimePackagePreflightApprovalRecordApproved({
        ...approved,
        boundary: {
          ...approved.boundary,
          packageScaffolded: true as false
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimePackagePreflightApprovalRecordApproved({
        ...approved,
        publicSurface: {
          ...approved.publicSurface,
          downloaderExportsAllowed: true as false
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimePackagePreflightApprovalRecordApproved({
        ...approved,
        importPolicy: {
          ...approved.importPolicy,
          allowedWorkspaceImports: [
            ...approved.importPolicy.allowedWorkspaceImports,
            "@jarvis-k/core"
          ]
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimePackagePreflightApprovalRecordApproved({
        ...approved,
        safety: {
          ...approved.safety,
          directShellExecutionAllowed: true as false
        }
      })
    ).toBe(false);
    expect(
      isLocalEmbeddingRuntimePackagePreflightApprovalRecordApproved({
        ...approved,
        runtimeDependenciesIntroduced: true as false
      })
    ).toBe(false);
  });
});
