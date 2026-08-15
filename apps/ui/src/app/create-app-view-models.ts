import type {
  CoreSnapshot,
  EventEnvelope,
  InferenceProviderDescriptor,
  MemoryAlphaRecallProbeResult,
  MemoryAlphaStatus,
  ModelCandidate,
  ModelInventoryItem,
  ModelManifest,
  ModelOperationSnapshot,
  ResourceSchedulerDiagnostics,
} from "@jarvis-k/contracts";

import type { uiCopy } from "./copy";
import { activeModelOperationPhases, formatGib } from "./formatters";
import type { RuntimeInspectorViewModel } from "../features/runtime-inspector/runtime-inspector-panel";

type Copy = (typeof uiCopy)["en"];
type FixtureEmbeddingProbe = {
  dimensions: number;
  operationPhase?: string;
  vectorCount: number;
} | null;
type FixtureIntentProbe = {
  intent: string;
  operationPhase?: string;
} | null;
type FixtureOcrProbe = {
  blockCount: number;
  operationPhase?: string;
  text: string;
} | null;
type FixtureRerankProbe = {
  operationPhase?: string;
  resultCount: number;
  topDocumentId: string;
} | null;

export type RuntimeInspectorViewModelInput = {
  accelerationBackends: string;
  availableInferenceProviderCount: number;
  blockedModelCount: number;
  connection: string;
  copy: Copy;
  coreInstanceId?: string | null;
  coreOnline: boolean;
  downloadableCandidateCount: number;
  fixtureEmbeddingAvailable: boolean;
  fixtureEmbeddingProbe: FixtureEmbeddingProbe;
  fixtureEmbeddingProvider?: InferenceProviderDescriptor;
  fixtureIntentProbe: FixtureIntentProbe;
  fixtureOcrProbe: FixtureOcrProbe;
  fixtureRerankProbe: FixtureRerankProbe;
  gpuCount: number;
  inferenceProviders: InferenceProviderDescriptor[];
  installableModelCount: number;
  intentRouterAvailable: boolean;
  intentRouterProvider?: InferenceProviderDescriptor;
  loadedModelCount: number;
  memoryAlpha?: MemoryAlphaStatus;
  memoryAlphaProbeDraft: string;
  memoryAlphaProbeSummary: string;
  memoryAlphaReason: string;
  memoryAlphaRecallProbe?: MemoryAlphaRecallProbeResult | null;
  memorySnapshotDraft: string;
  modelCandidates: ModelCandidate[];
  modelInventory: ModelInventoryItem[];
  modelManifests: ModelManifest[];
  modelOperations: ModelOperationSnapshot[];
  ocrProvider?: InferenceProviderDescriptor;
  ocrProviderAvailable: boolean;
  recentEvents: EventEnvelope[];
  rerankerProvider?: InferenceProviderDescriptor;
  rerankerProviderAvailable: boolean;
  requiredProviderConfigurationCount: number;
  resourceDiagnostics?: ResourceSchedulerDiagnostics;
  runtimeMode: string;
  snapshot: CoreSnapshot | null | undefined;
  voiceFramesSent: number;
  voicePeak: string;
  voiceRms: string;
};

export function createRuntimeInspectorViewModel({
  accelerationBackends,
  availableInferenceProviderCount,
  blockedModelCount,
  connection,
  copy,
  coreInstanceId,
  coreOnline,
  downloadableCandidateCount,
  fixtureEmbeddingAvailable,
  fixtureEmbeddingProbe,
  fixtureEmbeddingProvider,
  fixtureIntentProbe,
  fixtureOcrProbe,
  fixtureRerankProbe,
  gpuCount,
  inferenceProviders,
  installableModelCount,
  intentRouterAvailable,
  intentRouterProvider,
  loadedModelCount,
  memoryAlpha,
  memoryAlphaProbeDraft,
  memoryAlphaProbeSummary,
  memoryAlphaReason,
  memoryAlphaRecallProbe,
  memorySnapshotDraft,
  modelCandidates,
  modelInventory,
  modelManifests,
  modelOperations,
  ocrProvider,
  ocrProviderAvailable,
  recentEvents,
  rerankerProvider,
  rerankerProviderAvailable,
  requiredProviderConfigurationCount,
  resourceDiagnostics,
  runtimeMode,
  snapshot,
  voiceFramesSent,
  voicePeak,
  voiceRms,
}: RuntimeInspectorViewModelInput): RuntimeInspectorViewModel {
  const resourceMemoryGiB = formatGib(
    resourceDiagnostics?.availableMemoryBytes,
  );
  const resourceVramGiB = formatGib(resourceDiagnostics?.availableVramBytes);
  const activeModelOperationCount = modelOperations.filter((item) =>
    activeModelOperationPhases.has(item.phase),
  ).length;

  return {
    coreInstanceId,
    coreOnline,
    memoryAlphaMetrics: [
      {
        label: copy.metric.alphaState,
        value: memoryAlpha?.state ?? "unknown",
        tone:
          memoryAlpha?.state === "active"
            ? "success"
            : memoryAlpha?.state === "degraded"
              ? "warning"
              : undefined,
      },
      {
        label: copy.metric.tracked,
        value: `${memoryAlpha?.trackedMessageCount ?? 0}/${memoryAlpha?.maxMessageCount ?? 5}`,
      },
      {
        label: copy.metric.rollback,
        value: memoryAlpha?.rollbackStatus ?? "not_started",
        tone:
          memoryAlpha?.rollbackStatus === "degraded"
            ? "warning"
            : memoryAlpha?.rollbackStatus === "passed"
              ? "success"
              : undefined,
      },
      {
        label: copy.metric.deleted,
        value: String(memoryAlpha?.rollbackDeletedCount ?? 0),
      },
      {
        label: copy.metric.reason,
        value: memoryAlphaReason,
      },
      {
        label: copy.metric.probe,
        value: memoryAlphaProbeSummary,
      },
      {
        label: copy.metric.probeDims,
        value: String(memoryAlphaRecallProbe?.queryDimensions ?? 0),
      },
      {
        label: copy.metric.failure,
        value: memoryAlphaRecallProbe?.failureClass ?? "none",
        tone: memoryAlphaRecallProbe?.failureClass ? "warning" : undefined,
      },
    ],
    memoryAlphaProbeDraft,
    memorySnapshotDraft,
    modelGovernanceMetrics: [
      { label: copy.metric.candidates, value: String(modelCandidates.length) },
      { label: copy.metric.manifests, value: String(modelManifests.length) },
      { label: copy.metric.providers, value: String(inferenceProviders.length) },
      {
        label: copy.metric.available,
        value: String(availableInferenceProviderCount),
        tone: "success",
      },
      {
        label: copy.metric.fixture,
        value: fixtureEmbeddingProvider?.status ?? "unconfigured",
        tone: fixtureEmbeddingAvailable ? "success" : "warning",
      },
      {
        label: copy.metric.intentRouter,
        value: intentRouterProvider?.status ?? "unconfigured",
        tone: intentRouterAvailable ? "success" : "warning",
      },
      {
        label: copy.metric.ocr,
        value: ocrProvider?.status ?? "unconfigured",
        tone: ocrProviderAvailable ? "success" : "warning",
      },
      {
        label: copy.metric.reranker,
        value: rerankerProvider?.status ?? "unconfigured",
        tone: rerankerProviderAvailable ? "success" : "warning",
      },
      {
        label: copy.metric.required,
        value: String(requiredProviderConfigurationCount),
        tone: "warning",
      },
      {
        label: copy.metric.installable,
        value: String(installableModelCount),
        tone: "success",
      },
      {
        label: copy.metric.blocked,
        value: String(blockedModelCount),
        tone: "warning",
      },
      { label: copy.metric.operations, value: String(modelOperations.length) },
      {
        label: copy.metric.activeOps,
        value: String(activeModelOperationCount),
        tone: "warning",
      },
      { label: copy.metric.resourceMem, value: resourceMemoryGiB },
      { label: copy.metric.resourceVram, value: resourceVramGiB },
      {
        label: copy.metric.resourceLeases,
        value: String(resourceDiagnostics?.activeLeaseCount ?? 0),
      },
      { label: copy.metric.localModels, value: String(modelInventory.length) },
      {
        label: copy.metric.downloadable,
        value: String(downloadableCandidateCount),
      },
      {
        label: copy.metric.loaded,
        value: String(loadedModelCount),
        tone: "accent",
      },
      {
        label: copy.metric.vectorDims,
        value: fixtureEmbeddingProbe
          ? String(fixtureEmbeddingProbe.dimensions)
          : "idle",
      },
      {
        label: copy.metric.vectors,
        value: fixtureEmbeddingProbe
          ? String(fixtureEmbeddingProbe.vectorCount)
          : "idle",
      },
      {
        label: copy.metric.inference,
        value: fixtureEmbeddingProbe?.operationPhase ?? "idle",
        tone:
          fixtureEmbeddingProbe?.operationPhase === "completed"
            ? "success"
            : undefined,
      },
      { label: copy.metric.intent, value: fixtureIntentProbe?.intent ?? "idle" },
      {
        label: copy.metric.route,
        value: fixtureIntentProbe?.operationPhase ?? "idle",
        tone:
          fixtureIntentProbe?.operationPhase === "completed"
            ? "success"
            : undefined,
      },
      { label: copy.metric.ocrText, value: fixtureOcrProbe?.text ?? "idle" },
      {
        label: copy.metric.ocrBlocks,
        value: fixtureOcrProbe ? String(fixtureOcrProbe.blockCount) : "idle",
      },
      {
        label: copy.metric.ocrOps,
        value: fixtureOcrProbe?.operationPhase ?? "idle",
        tone:
          fixtureOcrProbe?.operationPhase === "completed"
            ? "success"
            : undefined,
      },
      {
        label: copy.metric.topDoc,
        value: fixtureRerankProbe?.topDocumentId ?? "idle",
      },
      {
        label: copy.metric.reranked,
        value: fixtureRerankProbe
          ? String(fixtureRerankProbe.resultCount)
          : "idle",
      },
      {
        label: copy.metric.rerankOps,
        value: fixtureRerankProbe?.operationPhase ?? "idle",
        tone:
          fixtureRerankProbe?.operationPhase === "completed"
            ? "success"
            : undefined,
      },
    ],
    recentEvents,
    systemStatus: {
      accelerationBackends,
      connection,
      gpuCount,
      memoryAlphaState: memoryAlpha?.state,
      runtimeMode,
      snapshot: snapshot ?? null,
      voiceFramesSent,
      voicePeak,
      voiceRms,
    },
  };
}
