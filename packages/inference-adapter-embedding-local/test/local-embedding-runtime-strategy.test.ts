import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingRuntimeAdapterDescriptor,
  createLocalEmbeddingRuntimeStrategy,
  LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME
} from "../src";

describe("local embedding runtime strategy", () => {
  it("keeps runtime selection provisional and scoped to a dedicated package", () => {
    expect(createLocalEmbeddingRuntimeStrategy()).toMatchObject({
      runtime: "transformers",
      status: "provisional",
      dedicatedPackageName: LOCAL_EMBEDDING_RUNTIME_PACKAGE_NAME,
      dependencyScope: "dedicated_runtime_package_only"
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
});
