import { describe, expect, it } from "vitest";

import { uiCopy } from "../src/app/copy";
import { createRuntimeInspectorViewModel } from "../src/app/create-app-view-models";

describe("app view model factories", () => {
  it("builds runtime inspector state as a pure projection", () => {
    const recentEvents = Object.freeze([]) as [];
    const snapshot = Object.freeze({
      health: "ready",
      sequenceId: 7,
    }) as never;

    const viewModel = createRuntimeInspectorViewModel({
      accelerationBackends: "CPU",
      availableInferenceProviderCount: 1,
      blockedModelCount: 0,
      connection: "online",
      copy: uiCopy.en,
      coreInstanceId: "core-123",
      coreOnline: true,
      downloadableCandidateCount: 0,
      fixtureEmbeddingAvailable: false,
      fixtureEmbeddingProbe: null,
      fixtureEmbeddingProvider: undefined,
      fixtureIntentProbe: null,
      fixtureOcrProbe: null,
      fixtureRerankProbe: null,
      gpuCount: 0,
      inferenceProviders: [],
      installableModelCount: 0,
      intentRouterAvailable: false,
      intentRouterProvider: undefined,
      loadedModelCount: 0,
      memoryAlpha: undefined,
      memoryAlphaProbeDraft: "query",
      memoryAlphaProbeSummary: "idle",
      memoryAlphaReason: "none",
      memoryAlphaRecallProbe: null,
      memorySnapshotDraft: "{}",
      modelCandidates: [],
      modelInventory: [],
      modelManifests: [],
      modelOperations: [],
      ocrProvider: undefined,
      ocrProviderAvailable: false,
      recentEvents,
      rerankerProvider: undefined,
      rerankerProviderAvailable: false,
      requiredProviderConfigurationCount: 0,
      resourceDiagnostics: undefined,
      runtimeMode: "standard",
      snapshot,
      voiceFramesSent: 0,
      voicePeak: "0%",
      voiceRms: "0%",
    });

    expect(viewModel.coreInstanceId).toBe("core-123");
    expect(viewModel.memoryAlphaProbeDraft).toBe("query");
    expect(viewModel.memorySnapshotDraft).toBe("{}");
    expect(viewModel.recentEvents).toBe(recentEvents);
    expect(viewModel.systemStatus.snapshot).toBe(snapshot);
    expect(JSON.stringify(viewModel)).not.toContain("credential");
    expect(JSON.stringify(viewModel)).not.toContain("secret");
  });
});
