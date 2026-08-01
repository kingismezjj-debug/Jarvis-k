import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingRuntimeAdapterDescriptor,
  createLocalEmbeddingRuntimeAdapterIsolationPolicy,
  evaluateLocalEmbeddingRuntimeAdapterIsolation
} from "../src";

const approvedInput = {
  descriptor: createLocalEmbeddingRuntimeAdapterDescriptor(),
  packageBoundaryApproved: true,
  helperProtocolApproved: true,
  resourceLeaseRequired: true,
  sanitizedErrorsApproved: true,
  fallbackProviderAvailable: true,
  runtimeDependenciesIntroduced: false,
  downloadEnabled: false,
  executionEnabled: false,
  providerRegistrationEnabled: false,
  defaultOptInEnabled: false
};

describe("local embedding runtime adapter isolation guard", () => {
  it("defines an isolated, fail-closed adapter policy", () => {
    const policy = createLocalEmbeddingRuntimeAdapterIsolationPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      runtime: "transformers",
      dedicatedPackageName:
        "@jarvis-k/inference-runtime-transformers-local",
      packageLocation: "packages/inference-runtime-transformers-local",
      compositionRoot: "apps/core-host",
      adapterOnlySurfaceRequired: true,
      supervisedChildProcessRequired: true,
      privateChildProcessIpcRequired: true,
      resourceLeaseRequired: true,
      sanitizedErrorsRequired: true,
      fallbackProviderRequired: true,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      implementationValuesExposed: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("accepts only a validated isolated adapter plan for dependency approval", () => {
    const result =
      evaluateLocalEmbeddingRuntimeAdapterIsolation(approvedInput);

    expect(result).toMatchObject({
      status: "ready_for_dependency_approval",
      accepted: true,
      readyForDependencyApproval: true,
      compositionAllowed: false,
      executionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      checks: {
        descriptorValid: true,
        descriptorMatchesPlannedRuntime: true,
        packageBoundaryApproved: true,
        helperProtocolApproved: true,
        resourceLeaseRequired: true,
        sanitizedErrorsApproved: true,
        fallbackProviderAvailable: true,
        runtimeDependenciesAbsent: true,
        downloadsDisabled: true,
        executionDisabled: true,
        providerRegistrationDisabled: true,
        defaultOptInDisabled: true
      }
    });
    expect(result.reasons).toEqual([]);
  });

  it("blocks malformed descriptors and unsafe descriptor notes", () => {
    const malformed = evaluateLocalEmbeddingRuntimeAdapterIsolation({
      ...approvedInput,
      descriptor: {
        runtime: "onnxruntime",
        capabilities: ["embedding"],
        notes: ["https://private.example.invalid/runtime"]
      }
    });
    const unsafeNotes = evaluateLocalEmbeddingRuntimeAdapterIsolation({
      ...approvedInput,
      descriptor: {
        ...createLocalEmbeddingRuntimeAdapterDescriptor(),
        notes: ["runtime path C:\\private\\runtime"]
      }
    });

    expect(malformed).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForDependencyApproval: false,
      compositionAllowed: false
    });
    expect(malformed.reasons).toEqual(
      expect.arrayContaining([
        "Runtime adapter descriptor must remain Transformers-only for embedding."
      ])
    );
    expect(unsafeNotes).toMatchObject({
      status: "blocked",
      accepted: false
    });
    expect(unsafeNotes.reasons).toContain(
      "Runtime adapter descriptor must remain Transformers-only for embedding."
    );
  });

  it("blocks dependency, download, execution, registration, and fallback regressions", () => {
    const result = evaluateLocalEmbeddingRuntimeAdapterIsolation({
      ...approvedInput,
      fallbackProviderAvailable: false,
      runtimeDependenciesIntroduced: true,
      downloadEnabled: true,
      executionEnabled: true,
      providerRegistrationEnabled: true,
      defaultOptInEnabled: true,
      helperProtocolApproved: false
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      readyForDependencyApproval: false,
      compositionAllowed: false,
      executionEnabled: false,
      providerRegistrationEnabled: false,
      defaultOptInEnabled: false,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      implementationValuesExposed: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Supervised private child-process protocol is not approved.",
        "Fixture or other fallback provider is required before isolation review can pass.",
        "Runtime dependencies must remain absent in this preparation wave.",
        "Artifact downloads must remain disabled in this preparation wave.",
        "Runtime execution must remain disabled in this preparation wave.",
        "Provider registration is deferred until a later explicit opt-in wave.",
        "Default opt-in behavior is forbidden before runtime approval."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });
});
