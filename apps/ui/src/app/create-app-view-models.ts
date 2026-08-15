import type {
  ChatAnswerProductModeStatus,
  CommandRouterProductModeStatus,
  CoreSnapshot,
  EventEnvelope,
  InferenceProviderDescriptor,
  MemoryAlphaRecallProbeResult,
  MemoryAlphaStatus,
  ModelCandidate,
  ModelInventoryItem,
  ModelManifest,
  ModelOperationSnapshot,
  QwenRuntimeControlStatus,
  ResourceSchedulerDiagnostics,
} from "@jarvis-k/contracts";

import type { uiCopy } from "./copy";
import { activeModelOperationPhases, formatGib } from "./formatters";
import type { RuntimeInspectorViewModel } from "../features/runtime-inspector/runtime-inspector-panel";
import type { ChatAnswerSettingsViewModel } from "../features/settings/chat-answer-settings-panel";
import type { CommandRouterSettingsViewModel } from "../features/settings/command-router-settings-panel";
import type { ModelGovernanceSettingsViewModel } from "../features/settings/model-governance-settings-panel";

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

export type CommandRouterSettingsViewModelInput = {
  productModeStatus: CommandRouterProductModeStatus | null | undefined;
  qwenRuntimeControlStatus: QwenRuntimeControlStatus | null | undefined;
};

export function createCommandRouterSettingsViewModel({
  productModeStatus,
  qwenRuntimeControlStatus,
}: CommandRouterSettingsViewModelInput): CommandRouterSettingsViewModel {
  const productModeEnabled = productModeStatus?.enabled === true;
  const productModeSummary =
    productModeStatus?.status.replaceAll("_", " ") ?? "unknown";
  const directActionStatus =
    productModeStatus?.directActionEnabled === true ? "enabled" : "disabled";
  const qwenBinding = productModeStatus?.qwenFastRouterBinding;
  const qwenActivation = qwenBinding?.activation;
  const qwenRuntimeControlSummary =
    qwenRuntimeControlStatus?.status.replaceAll("_", " ") ?? "disabled";
  const qwenRuntimeControlHelper =
    qwenRuntimeControlStatus?.helperLifecycle.replaceAll("_", " ") ??
    "stopped";
  const qwenRuntimeControlRoute =
    qwenRuntimeControlStatus?.activeRouteSource ??
    "intent-router.deterministic.rules";
  const qwenRuntimeControlSession =
    qwenRuntimeControlStatus?.retainedSessionAvailable === true
      ? "retained"
      : "unavailable";

  return {
    activationGateLabels: qwenActivation
      ? [
          qwenActivation.gates.preparedPolicyReviewed
            ? "policy reviewed"
            : null,
          qwenActivation.gates.readinessEvidencePassed
            ? "readiness passed"
            : null,
          qwenActivation.gates.noRuntimeProductBindingPresent
            ? "no-runtime binding"
            : null,
          qwenActivation.gates.coreSelectionFallbackPreserved
            ? "core fallback"
            : null,
          qwenActivation.gates.commandRouterSafetyGatesPreserved
            ? "safety gates"
            : null,
          qwenActivation.gates.deterministicRulesActive
            ? "rules active"
            : null,
        ].filter((label): label is string => Boolean(label))
      : ["policy reviewed", "readiness passed", "no-runtime binding"],
    activationPolicyId:
      qwenActivation?.policyId ??
      "qwen-product-routing.activation.default-off.v1",
    gateLabels: qwenBinding
      ? [
          qwenBinding.gates.explicitEnablementRequired
            ? "explicit enablement"
            : null,
          qwenBinding.gates.artifactDigestApprovalRequired
            ? "artifact digest"
            : null,
          qwenBinding.gates.modelLifecycleReadinessRequired
            ? "lifecycle readiness"
            : null,
          qwenBinding.gates.runtimeGenerationPortReadinessRequired
            ? "generation port"
            : null,
          qwenBinding.gates.selectionPolicyReadinessRequired
            ? "selection policy"
            : null,
          qwenBinding.gates.deterministicFallbackPreserved
            ? "fallback preserved"
            : null,
        ].filter((label): label is string => Boolean(label))
      : ["explicit enablement", "artifact digest", "lifecycle readiness"],
    headerBadge: productModeEnabled ? "control on" : "default off",
    productModeEnabled,
    productModeNotice:
      "Fixture-only surface: deterministic intent routing remains active; Qwen is status-only with no runtime, helper, artifact, cache, or provider call, and no browser execution. Approved local app launches remain Notepad/Calculator only after confirmation.",
    productModeSummary: productModeEnabled
      ? "Control enabled; text and voice commands are routed through deterministic fixture projection only."
      : "Default off; existing Chat Answer and BrainCommand behavior is preserved.",
    qwenMetrics: [
      {
        label: "Provider",
        value: qwenBinding?.providerId ?? "intent-router.qwen3-0.6b",
        tone: "accent",
      },
      {
        label: "Binding",
        value:
          qwenBinding?.mode.replaceAll("_", " ") ??
          "no runtime status only",
        tone: "warning",
      },
      {
        label: "Product routing",
        value: qwenBinding?.productRoutingEnabled ? "enabled" : "off",
        tone: "warning",
      },
      {
        label: "Conversation route",
        value:
          qwenBinding?.conversationSurfaceProductRoute?.status ?? "disabled",
        tone: "warning",
      },
      {
        label: "Route selectable",
        value: qwenBinding?.conversationSurfaceProductRoute
          ?.qwenRouteSelectable
          ? "selectable"
          : "fixture",
        tone: "success",
      },
      {
        label: "Persistent opt-in",
        value:
          qwenBinding?.conversationSurfaceProductRoute?.persistentOptIn
            ?.status ?? "disabled",
        tone: "warning",
      },
      {
        label: "Session scope",
        value: qwenBinding?.conversationSurfaceProductRoute?.persistentOptIn
          ?.limitedProductSessionOnly
          ? "limited"
          : "blocked",
        tone: "success",
      },
      {
        label: "Runtime access",
        value: qwenBinding?.runtimeAccessed ? "accessed" : "not accessed",
        tone: "success",
      },
      {
        label: "Artifact access",
        value: qwenBinding?.artifactAccessed ? "accessed" : "not accessed",
        tone: "success",
      },
      {
        label: "Cache change",
        value: qwenBinding?.persistentCacheChanged ? "changed" : "none",
        tone: "success",
      },
      {
        label: "Activation",
        value: qwenActivation?.status.replaceAll("_", " ") ?? "disabled",
        tone: qwenActivation?.status === "ready" ? "accent" : "warning",
      },
      {
        label: "Rollback",
        value:
          qwenActivation?.rollbackState.replaceAll("_", " ") ?? "not needed",
        tone: "success",
      },
    ],
    qwenRuntimeControlHelper,
    qwenRuntimeControlMetrics: [
      {
        label: "Session",
        value:
          qwenRuntimeControlStatus?.retainedSessionId ??
          "qwen-retained-product-session-2026-08-10",
        tone: qwenRuntimeControlStatus?.retainedSessionAvailable
          ? "success"
          : "warning",
      },
      {
        label: "Route source",
        value: qwenRuntimeControlRoute,
        tone: "accent",
      },
      {
        label: "Fallback",
        value:
          qwenRuntimeControlStatus?.fallbackRouteSource ??
          "intent-router.deterministic.rules",
        tone: "success",
      },
      {
        label: "Route limit",
        value: String(qwenRuntimeControlStatus?.routeRequestLimit ?? 3),
        tone: "warning",
      },
      {
        label: "Route count",
        value: String(qwenRuntimeControlStatus?.routeRequestCount ?? 0),
        tone: "warning",
      },
      {
        label: "Helper starts",
        value: String(qwenRuntimeControlStatus?.helperStartCount ?? 0),
        tone: "warning",
      },
      {
        label: "Gen probes",
        value: String(
          qwenRuntimeControlStatus?.generationPortReadinessProbeCount ?? 0,
        ),
        tone: "warning",
      },
      {
        label: "Shutdown",
        value:
          qwenRuntimeControlStatus?.helperShutdownVerified === false
            ? "pending"
            : "verified",
        tone:
          qwenRuntimeControlStatus?.helperShutdownVerified === false
            ? "warning"
            : "success",
      },
      {
        label: "Browser/URL",
        value: qwenRuntimeControlStatus?.browserUrlOpeningEnabled
          ? "enabled"
          : "blocked",
        tone: "success",
      },
      {
        label: "VS Code",
        value: qwenRuntimeControlStatus?.vsCodeBlocked
          ? "blocked"
          : "allowed",
        tone: "success",
      },
    ],
    qwenRuntimeControlRollbackAvailable:
      qwenRuntimeControlStatus?.controls.rollback === "available",
    qwenRuntimeControlSession,
    qwenRuntimeControlStartAvailable:
      qwenRuntimeControlStatus?.controls.start === "available",
    qwenRuntimeControlStopAvailable:
      qwenRuntimeControlStatus?.controls.stop === "available",
    qwenRuntimeControlSummary,
    qwenStatus: qwenBinding?.status ?? "disabled",
    routeMetrics: [
      {
        label: "Provider",
        value:
          productModeStatus?.providerId ?? "intent-router.deterministic.rules",
        tone: "accent",
      },
      {
        label: "Mode",
        value: productModeStatus?.mode.replaceAll("_", " ") ?? "fixture only",
        tone: "success",
      },
      {
        label: "Runtime",
        value: productModeSummary,
        tone: productModeEnabled ? "accent" : "warning",
      },
      { label: "Direct action", value: directActionStatus, tone: "warning" },
      {
        label: "Qwen runtime",
        value: productModeStatus?.realQwenRuntimeEnabled
          ? "enabled"
          : "disabled",
        tone: "warning",
      },
      {
        label: "Chat fallback",
        value:
          productModeStatus?.chatAnswerFallbackPreserved === false
            ? "not preserved"
            : "preserved",
        tone: "success",
      },
    ],
  };
}

export type ChatAnswerSettingsViewModelInput = {
  productModeStatus: ChatAnswerProductModeStatus | null | undefined;
};

export function createChatAnswerSettingsViewModel({
  productModeStatus,
}: ChatAnswerSettingsViewModelInput): ChatAnswerSettingsViewModel {
  const productModeEnabled = productModeStatus?.enabled === true;
  const realRuntimeArmed =
    productModeStatus?.realProviderRuntimeEnabled === true;
  const credentialConfigured =
    productModeStatus?.credentialConfigured === true;
  const secureStoreAvailable =
    productModeStatus?.secureStorageAvailable !== false;
  const productModeSummary =
    productModeStatus?.status.replaceAll("_", " ") ?? "unknown";

  return {
    controlSummary: productModeEnabled
      ? realRuntimeArmed
        ? "Control enabled; real runtime armed for one approved fixed text call."
        : "Control enabled; real runtime remains locked until credential readiness is confirmed."
      : "Default off; typed answers continue through the existing safe path.",
    headerBadge: productModeEnabled ? "control on" : "default off",
    metrics: [
      {
        label: "Provider",
        value: productModeStatus?.providerId ?? "deepseek",
        tone: "accent",
      },
      {
        label: "Profile",
        value:
          productModeStatus?.profileId ??
          "deepseek.v4-flash.compact_json_object_256",
      },
      {
        label: "Credential",
        value: credentialConfigured ? "configured" : "missing",
        tone: credentialConfigured ? "success" : "warning",
      },
      {
        label: "Runtime",
        value: productModeSummary,
        tone: productModeEnabled ? "accent" : "warning",
      },
      {
        label: "Secure store",
        value: secureStoreAvailable ? "available" : "unavailable",
        tone: secureStoreAvailable ? "success" : "warning",
      },
      {
        label: "Fallback",
        value:
          productModeStatus?.fallbackPreserved === false
            ? "not preserved"
            : "preserved",
        tone: "success",
      },
    ],
    notice:
      "Controlled surface: default off; one approved provider call only after explicit enablement and credential readiness; no planner, no Memory vector retrieval, and no direct action behavior.",
    productModeEnabled,
  };
}

export type ModelGovernanceSettingsViewModelInput = {
  availableInferenceProviderCount: number;
  copy: Copy;
  inferenceProviderCount: number;
  modelInventoryCount: number;
  modelOperationCount: number;
  requiredProviderConfigurationCount: number;
};

export function createModelGovernanceSettingsViewModel({
  availableInferenceProviderCount,
  copy,
  inferenceProviderCount,
  modelInventoryCount,
  modelOperationCount,
  requiredProviderConfigurationCount,
}: ModelGovernanceSettingsViewModelInput): ModelGovernanceSettingsViewModel {
  return {
    metrics: [
      { label: copy.metric.providers, value: String(inferenceProviderCount) },
      {
        label: copy.metric.available,
        value: String(availableInferenceProviderCount),
        tone: "success",
      },
      {
        label: copy.metric.required,
        value: String(requiredProviderConfigurationCount),
        tone: "warning",
      },
      { label: copy.metric.localModels, value: String(modelInventoryCount) },
      { label: copy.metric.operations, value: String(modelOperationCount) },
    ],
  };
}

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
  inferenceProviders = [],
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
  modelCandidates = [],
  modelInventory = [],
  modelManifests = [],
  modelOperations = [],
  ocrProvider,
  ocrProviderAvailable,
  recentEvents = [],
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
