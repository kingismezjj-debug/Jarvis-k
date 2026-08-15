import { describe, expect, it } from "vitest";

import { uiCopy } from "../src/app/copy";
import {
  createChatAnswerSettingsViewModel,
  createCommandRouterSettingsViewModel,
  createModelGovernanceSettingsViewModel,
  createRuntimeInspectorViewModel,
} from "../src/app/create-app-view-models";

describe("app view model factories", () => {
  it("projects Command Router settings without enabling fixture routing", () => {
    const viewModel = createCommandRouterSettingsViewModel({
      productModeStatus: null,
      qwenRuntimeControlStatus: null,
    });

    expect(viewModel.productModeEnabled).toBe(false);
    expect(viewModel.headerBadge).toBe("default off");
    expect(viewModel.routeMetrics).toContainEqual(
      expect.objectContaining({
        label: "Provider",
        value: "intent-router.deterministic.rules",
      }),
    );
    expect(JSON.stringify(viewModel)).not.toContain(
      "intent-router.deterministic.fixture",
    );
    expect(JSON.stringify(viewModel)).not.toContain("credential");
    expect(JSON.stringify(viewModel)).not.toContain("secret");
  });

  it("projects Chat Answer settings without exposing credential material", () => {
    const viewModel = createChatAnswerSettingsViewModel({
      productModeStatus: null,
    });

    expect(viewModel.productModeEnabled).toBe(false);
    expect(viewModel.headerBadge).toBe("default off");
    expect(viewModel.metrics).toContainEqual(
      expect.objectContaining({ label: "Provider", value: "deepseek" }),
    );
    expect(JSON.stringify(viewModel)).not.toContain("apiKey");
    expect(JSON.stringify(viewModel)).not.toContain("secret");
  });

  it("projects model governance settings as counts only", () => {
    const viewModel = createModelGovernanceSettingsViewModel({
      availableInferenceProviderCount: 2,
      copy: uiCopy.en,
      inferenceProviderCount: 4,
      modelInventoryCount: 3,
      modelOperationCount: 1,
      requiredProviderConfigurationCount: 5,
    });

    expect(viewModel.metrics).toContainEqual(
      expect.objectContaining({ label: uiCopy.en.metric.providers, value: "4" }),
    );
    expect(viewModel.metrics).toContainEqual(
      expect.objectContaining({ label: uiCopy.en.metric.available, value: "2" }),
    );
    expect(viewModel.metrics).toContainEqual(
      expect.objectContaining({ label: uiCopy.en.metric.required, value: "5" }),
    );
  });

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
