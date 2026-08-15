import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  Bot,
  Check,
  CheckCircle2,
  CircleAlert,
  Database,
  Download,
  ExternalLink,
  ListTodo,
  MessageSquare,
  Mic2,
  MicOff,
  PanelLeft,
  Palette,
  Pencil,
  Plug,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Settings,
  Square,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type {
  EventEnvelope,
  TaskState,
  UserControlledMemoryKind,
  UserControlledMemoryRecord,
  UserRouteAliasLearningProposal,
  VoiceCommandCorrectionCandidate,
} from "@jarvis-k/contracts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useJarvis } from "@/hooks/use-jarvis";
import { usePttCapture } from "@/hooks/use-ptt-capture";
import { stage5Copy, uiCopy } from "@/app/copy";
import {
  activeModelOperationPhases,
  commandRouterAllowedRealLocalAppTarget,
  eventLabel,
  formatActionError,
  formatConfidence,
  formatEventTime,
  formatGib,
  formatPttCommandError,
  formatVoiceCorrectionSlots,
  isSecondaryVoiceStopError,
  isTaskApprovalEligible,
  isTaskCancellationEligible,
} from "@/app/formatters";
import { persistUiLanguage, readInitialLanguage } from "@/app/ui-language";
import { usePluginCenter } from "@/app/use-plugin-center";
import { useUserControlledMemoryView } from "@/app/use-user-controlled-memory-view";
import {
  buildSanitizedUserControlledMemorySnapshot,
  formatUserControlledMemoryKey,
  userControlledMemoryFilterOptions,
  userControlledMemoryRiskFilterOptions,
  userControlledMemorySortOptions,
  validateSanitizedUserControlledMemorySnapshot,
} from "@/app/memory-view";
import { primaryNavigation } from "@/app/navigation";
import {
  builtInSkinThemes,
  persistSkinTheme,
  readInitialSkinTheme,
  THEME_STORAGE_KEY,
} from "@/app/skin-themes";
import type {
  ActionStatus,
  ActiveView,
  LocalTtsStatus,
  SkinThemeId,
  UiLanguage,
  UserControlledMemoryFilter,
  UserControlledMemoryRiskFilter,
  UserControlledMemorySort,
} from "@/app/types";
import { NavigationButton } from "@/components/assistant-shell/NavigationButton";
import { Metric } from "@/components/shared/Metric";
import { SystemStatusPanel } from "@/features/diagnostics/system-status-panel";
import { cn } from "@/lib/utils";
import {
  selectLocalTtsLanguage,
  selectLocalTtsVoice,
  waitForLocalTtsVoices,
} from "@/voice/local-tts";

export default function App() {
  const {
    brainResult,
    chatAnswerProductModeStatus,
    commandRouterLocalAppLaunchResult,
    commandRouterProductModeStatus,
    qwenRuntimeControlStatus,
    approveTask,
    cancelTask,
    clearSessionHistory,
    confirmCommandRouterLocalAppLaunch,
    deleteUserControlledMemory = async () => false,
    confirmUserRouteAlias,
    confirmVoiceCommandCorrection,
    connection,
    createConversation,
    deleteUserRouteAlias,
    deleteVoiceCommandAlias,
    disableMemoryAlpha,
    error,
    events,
    exportMemorySnapshot,
    fixtureEmbeddingProbe,
    fixtureIntentProbe,
    fixtureOcrProbe,
    fixtureRerankProbe,
    importMemorySnapshot,
    inferenceProviderRequirements,
    inferenceProviders,
    modelCandidates,
    modelInstallabilityReports,
    modelInventory,
    modelManifests,
    modelOperations,
    memoryAlphaRecallProbe,
    memoryAlphaStatus,
    openTtsSettings,
    openVoiceSettings,
    localPluginManifestDeveloperStatus,
    pluginManagementStatus,
    probeMemoryAlphaRecall,
    probeCore,
    refreshCapabilities,
    refreshChatAnswerProductModeStatus,
    refreshCommandRouterProductModeStatus,
    refreshLocalPluginManifestDeveloperStatus,
    refreshQwenRuntimeControlStatus,
    refreshMemoryAlphaStatus,
    refreshMemoryHealth,
    refreshModelGovernance,
    refreshPlugins,
    refreshTtsServiceStatus,
    refreshUserControlledMemories = async () => false,
    refreshUserRouteAliases,
    refreshVoiceCommandAliases,
    renameConversation,
    resourceDiagnostics,
    retryBrainCommand,
    rollbackBrainResult,
    runFixtureEmbeddingProbe,
    runFixtureIntentProbe,
    runFixtureOcrProbe,
    runFixtureRerankProbe,
    runBrainCommand,
    sendCommand,
    selectConversation,
    setChatAnswerProductModeEnabled,
    setCommandRouterProductModeEnabled,
    setLocalPluginEnabledState,
    setQwenRuntimeControlAction,
    sending,
    snapshot,
    ttsServiceStatus,
    userControlledMemories = [],
    userRouteAliases,
    voiceCommandAliases,
    voiceServiceStatus,
  } = useJarvis();
  const [draft, setDraft] = useState("");
  const [memorySnapshotDraft, setMemorySnapshotDraft] = useState("");
  const [memoryAlphaProbeDraft, setMemoryAlphaProbeDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [conversationTitleDraft, setConversationTitleDraft] = useState("");
  const [activeView, setActiveView] = useState<ActiveView>("conversation");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [lastAction, setLastAction] = useState<ActionStatus | null>(null);
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>(readInitialLanguage);
  const [skinTheme, setSkinTheme] =
    useState<SkinThemeId>(readInitialSkinTheme);
  const [localTtsEnabled, setLocalTtsEnabled] = useState(false);
  const [localTtsStatus, setLocalTtsStatus] =
    useState<LocalTtsStatus>("disabled");
  const [ttsError, setTtsError] = useState<string | null>(null);
  const autoSpokenTtsKeyRef = useRef<string | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioUrlRef = useRef<string | null>(null);
  const copy = uiCopy[uiLanguage];
  const alphaCopy = stage5Copy[uiLanguage];
  const activeSkinTheme =
    builtInSkinThemes.find((theme) => theme.id === skinTheme) ??
    builtInSkinThemes[0];

  const {
    userControlledMemoryFilter,
    setUserControlledMemoryFilter,
    userControlledMemoryRiskFilter,
    setUserControlledMemoryRiskFilter,
    userControlledMemorySort,
    setUserControlledMemorySort,
    userControlledMemoryQuery,
    setUserControlledMemoryQuery,
    userControlledMemorySanitizedSnapshotPreview,
    setUserControlledMemorySanitizedSnapshotPreview,
    userControlledMemorySanitizedSnapshotGeneratedAt,
    setUserControlledMemorySanitizedSnapshotGeneratedAt,
    userControlledMemoryDeletePendingKey,
    setUserControlledMemoryDeletePendingKey,
    routeAliasMemoryCount,
    voiceAliasMemoryCount,
    preferenceMemoryCount,
    categorizedMemoryCount,
    userControlledMemoryCountCheck,
    deletableMemoryCount,
    lockedMemoryCount,
    disabledMemoryCount,
    rawExposedMemoryCount,
    userControlledMemorySafetyCheck,
    providerNeutralMemoryCount,
    userConfirmedRouteAliasSourceCount,
    userConfirmedVoiceAliasSourceCount,
    userConfirmedPreferenceSourceCount,
    userControlledMemorySourceBoundaryCheck,
    userControlledMemoryWritePolicy,
    userControlledMemoryDeleteBoundary,
    userControlledMemoryDisableControlBoundary,
    userControlledMemoryDisableMutationBoundary,
    userControlledMemorySnapshotPolicy,
    userControlledMemoryRetentionScope,
    userControlledMemoryExportBoundary,
    userControlledMemorySanitizedSnapshotBoundary,
    userControlledMemoryImportBoundary,
    userControlledMemoryEditBoundary,
    userControlledMemoryRestoreBoundary,
    userControlledMemoryAutoCaptureBoundary,
    userControlledMemoryBackgroundIndexingBoundary,
    userControlledMemoryProactiveScanBoundary,
    userControlledMemoryProactiveSuggestionBoundary,
    userControlledMemoryProactiveNotificationBoundary,
    userControlledMemoryContextPollingBoundary,
    userControlledMemoryAutoExecutionBoundary,
    userControlledMemoryPermissionOverrideBoundary,
    userControlledMemoryRiskDowngradeBoundary,
    userControlledMemoryConfirmationBypassBoundary,
    userControlledMemoryAllowlistMutationBoundary,
    userControlledMemoryWorkflowReplayBoundary,
    userControlledMemoryBackgroundTaskCreationBoundary,
    userControlledMemoryReminderSchedulingBoundary,
    userControlledMemoryAutonomousFollowUpBoundary,
    userControlledMemoryOutboundMessagingBoundary,
    userControlledMemoryExternalTriggerBoundary,
    userControlledMemoryClipboardObservationBoundary,
    userControlledMemoryKeystrokeObservationBoundary,
    userControlledMemoryWindowObservationBoundary,
    userControlledMemoryScreenObservationBoundary,
    userControlledMemoryFileObservationBoundary,
    userControlledMemoryCameraObservationBoundary,
    userControlledMemoryMicrophoneObservationBoundary,
    userControlledMemoryBrowserHistoryObservationBoundary,
    userControlledMemoryLocationObservationBoundary,
    userControlledMemoryContactsObservationBoundary,
    userControlledMemoryCalendarObservationBoundary,
    userControlledMemoryEmailObservationBoundary,
    userControlledMemoryMessagingObservationBoundary,
    userControlledMemoryCredentialObservationBoundary,
    userControlledMemoryPaymentObservationBoundary,
    userControlledMemoryHealthObservationBoundary,
    userControlledMemoryBiometricObservationBoundary,
    userControlledMemoryGovernmentIdObservationBoundary,
    userControlledMemoryFinancialAccountObservationBoundary,
    userControlledMemoryLegalDocumentObservationBoundary,
    userControlledMemoryRepositoryObservationBoundary,
    userControlledMemoryCloudStorageObservationBoundary,
    userControlledMemoryAnalyticsProfilingBoundary,
    userControlledMemoryVectorIndexRetentionBoundary,
    userControlledMemoryPluginAccessBoundary,
    userControlledMemoryWorkflowAccessBoundary,
    userControlledMemoryTeachModeAccessBoundary,
    userControlledMemorySkinAccessBoundary,
    userControlledMemoryPetAccessBoundary,
    userControlledMemoryPersonalityAccessBoundary,
    userControlledMemoryCustomUiAccessBoundary,
    userControlledMemoryExpirationBoundary,
    userControlledMemorySessionOnlyBoundary,
    userControlledMemoryProviderAuditBoundary,
    userControlledMemoryAuditHistoryBoundary,
    userControlledMemoryExternalSharingBoundary,
    userControlledMemoryCommunitySharingBoundary,
    userControlledMemoryCloudSyncBoundary,
    userControlledMemoryCloudAccountBoundary,
    userControlledMemoryStorageEncryptionBoundary,
    userControlledMemoryCredentialAccessBoundary,
    userControlledMemoryNetworkAccessBoundary,
    userControlledMemoryModelTrainingBoundary,
    userControlledMemoryTrainingExportBoundary,
    userControlledMemoryProviderPersonalizationBoundary,
    userControlledMemoryPromptInjectionBoundary,
    userControlledMemoryRawAudioRetentionBoundary,
    userControlledMemoryRawTranscriptRetentionBoundary,
    userControlledMemoryScreenCaptureRetentionBoundary,
    userControlledMemoryFileContentRetentionBoundary,
    userControlledMemoryClipboardRetentionBoundary,
    userControlledMemorySecretRetentionBoundary,
    userControlledMemoryPaymentDataRetentionBoundary,
    userControlledMemoryLocationRetentionBoundary,
    userControlledMemoryBiometricRetentionBoundary,
    userControlledMemoryContactRetentionBoundary,
    userControlledMemoryHealthRetentionBoundary,
    userControlledMemoryCalendarRetentionBoundary,
    userControlledMemoryEmailRetentionBoundary,
    userControlledMemoryIdentityDocumentRetentionBoundary,
    userControlledMemoryBrowserHistoryRetentionBoundary,
    userControlledMemoryCookieRetentionBoundary,
    userControlledMemoryDownloadHistoryRetentionBoundary,
    userControlledMemoryAutofillRetentionBoundary,
    userControlledMemoryCredentialRetentionBoundary,
    userControlledMemoryDeviceIdentifierRetentionBoundary,
    userControlledMemoryNetworkIdentifierRetentionBoundary,
    userControlledMemoryCrashDumpRetentionBoundary,
    userControlledMemoryErrorReportRetentionBoundary,
    userControlledMemoryTelemetryPayloadRetentionBoundary,
    userControlledMemoryModelCacheRetentionBoundary,
    userControlledMemoryPromptCacheRetentionBoundary,
    userControlledMemoryTaskHistoryRetentionBoundary,
    userControlledMemorySnapshotRedactionBoundary,
    userControlledMemoryRawSnapshotReviewBoundary,
    userControlledMemorySnapshotSchemaValidationBoundary,
    userControlledMemorySnapshotProvenanceBoundary,
    userControlledMemoryRetentionControlsBoundary,
    userControlledMemoryRetentionSessionControlMode,
    userControlledMemoryRetentionMutationBoundary,
    userControlledMemorySessionOnlyWriteBoundary,
    userControlledMemoryExpirationJobBoundary,
    userControlledMemoryExportImportBoundary,
    userControlledMemoryEditRestoreBoundary,
    userControlledMemoryProviderSyncBoundary,
    userControlledMemoryRecordingModeBoundary,
    userControlledMemoryRecordingPauseBoundary,
    userControlledMemoryViewPersistenceBoundary,
    userControlledMemorySearchPersistenceBoundary,
    userControlledMemorySavedViewPresetsBoundary,
    userControlledMemoryDeletePendingState,
    filteredUserControlledMemories,
    userControlledMemoryActiveKindLabel,
    userControlledMemoryActiveRiskLabel,
    userControlledMemoryActiveSortLabel,
    userControlledMemorySearchState,
    chatAnswerPreferenceProjectionOn,
    lowRiskMemoryCount,
    mediumRiskMemoryCount,
    highRiskMemoryCount,
  } = useUserControlledMemoryView(userControlledMemories);
  const {
    blockedPolicyPluginCount,
    bundledPluginCount,
    disabledPluginCount,
    enabledPluginCount,
    localManifestPluginCount,
    localPluginStateUpdatingId,
    lowRiskPluginCount,
    mediumRiskPluginCount,
    plugins,
    toggleLocalPluginState,
  } = usePluginCenter({
    pluginManagementStatus,
    setLastAction,
    setLocalPluginEnabledState,
  });

  const coreOnline = connection === "online";
  const textOnlyAcceptanceMode = snapshot?.textOnlyAcceptance?.enabled === true;
  const ptt = usePttCapture(async (command) => {
    if (!window.jarvis) {
      return {
        ok: false,
        error: {
          code: "DESKTOP_BRIDGE_UNAVAILABLE",
          message: "Desktop bridge unavailable.",
          retryable: true,
        },
      };
    }
    const result = await window.jarvis.sendCommand(command);
    if (result.ok) return { ok: true };
    return { ok: false, error: result.error };
  }, coreOnline && !textOnlyAcceptanceMode);
  const visiblePrimaryNavigation = textOnlyAcceptanceMode
    ? primaryNavigation.filter((item) => item.id !== "voice")
    : primaryNavigation;
  const recentEvents = useMemo(() => events.slice(0, 12), [events]);
  const localManifestDiscovery = localPluginManifestDeveloperStatus;
  const latestVoiceError = useMemo(
    () =>
      recentEvents.find((envelope) => envelope.event.type === "voice.error")
        ?.event.payload.error ?? null,
    [recentEvents],
  );
  const voiceCaptureNotice =
    ptt.captureNotice === "capture-unavailable"
      ? copy.voiceCaptureNotice.captureUnavailable
      : ptt.captureNotice === "core-offline"
        ? copy.voiceCaptureNotice.coreOffline
        : ptt.captureNotice === "interrupted"
          ? copy.voiceCaptureNotice.interrupted
          : ptt.captureNotice === "microphone-unavailable"
            ? copy.voiceCaptureNotice.microphoneUnavailable
            : ptt.captureNotice === "permission-denied"
              ? copy.voiceCaptureNotice.permissionDenied
              : ptt.captureNotice === "voice-mode-unavailable"
                ? copy.voiceCaptureNotice.voiceModeUnavailable
                : ptt.captureNotice === "voice-session-unavailable"
                  ? copy.voiceCaptureNotice.voiceSessionUnavailable
                  : null;
  const visiblePttCommandError = isSecondaryVoiceStopError(ptt.commandError)
    ? null
    : ptt.commandError;
  const voiceCaptureErrorDetail = visiblePttCommandError
    ? formatPttCommandError(visiblePttCommandError)
    : latestVoiceError
      ? formatPttCommandError(latestVoiceError)
      : null;
  const conversations = snapshot?.conversations ?? [];
  const activeConversation =
    conversations.find((item) => item.id === snapshot?.activeConversationId) ??
    conversations[0];
  const visibleMessages =
    activeConversation && snapshot?.messages
      ? snapshot.messages.filter(
          (message) => message.conversationId === activeConversation.id,
        )
      : (snapshot?.messages ?? []);
  const voiceTranscript = snapshot?.voice.transcript?.text ?? "";
  const voiceServiceLanguage =
    voiceServiceStatus?.language === "en"
      ? copy.settings.english
      : copy.settings.chinese;
  const voiceLanguageMismatch =
    uiLanguage === "zh" && voiceServiceStatus?.language === "en";
  const voiceRms = `${Math.round(ptt.audioDiagnostics.rms * 100)}%`;
  const voicePeak = `${Math.round(ptt.audioDiagnostics.peak * 100)}%`;
  const runtimeMode =
    snapshot?.capabilities?.runtimeMode.replace("_", " ") ?? "unknown";
  const gpuCount = snapshot?.capabilities?.device.gpus.length ?? 0;
  const accelerationBackends =
    snapshot?.capabilities?.device.accelerationBackends.join(", ") ?? "cpu";
  const loadedModelCount = modelInventory.filter(
    (item) => item.status === "loaded",
  ).length;
  const downloadableCandidateCount = modelCandidates.filter(
    (item) => item.downloadEnabled,
  ).length;
  const availableInferenceProviderCount = inferenceProviders.filter(
    (item) => item.status === "available",
  ).length;
  const fixtureEmbeddingProvider = inferenceProviders.find(
    (item) => item.provider === "embedding.fixture",
  );
  const fixtureEmbeddingAvailable =
    fixtureEmbeddingProvider?.status === "available";
  const intentRouterProvider = inferenceProviders.find(
    (item) => item.provider === "intent-router.fixture",
  );
  const intentRouterAvailable = intentRouterProvider?.status === "available";
  const ocrProvider = inferenceProviders.find(
    (item) => item.provider === "ocr.fixture",
  );
  const ocrProviderAvailable = ocrProvider?.status === "available";
  const rerankerProvider = inferenceProviders.find(
    (item) => item.provider === "reranker.fixture",
  );
  const rerankerProviderAvailable = rerankerProvider?.status === "available";
  const commandRouterProductModeEnabled =
    commandRouterProductModeStatus?.enabled === true;
  const commandRouterProductModeSummary =
    commandRouterProductModeStatus?.status.replaceAll("_", " ") ?? "unknown";
  const commandRouterDirectActionStatus =
    commandRouterProductModeStatus?.directActionEnabled === true
      ? "enabled"
      : "disabled";
  const commandRouterQwenBinding =
    commandRouterProductModeStatus?.qwenFastRouterBinding;
  const commandRouterQwenActivation = commandRouterQwenBinding?.activation;
  const commandRouterQwenGateLabels = commandRouterQwenBinding
    ? [
        commandRouterQwenBinding.gates.explicitEnablementRequired
          ? "explicit enablement"
          : null,
        commandRouterQwenBinding.gates.artifactDigestApprovalRequired
          ? "artifact digest"
          : null,
        commandRouterQwenBinding.gates.modelLifecycleReadinessRequired
          ? "lifecycle readiness"
          : null,
        commandRouterQwenBinding.gates.runtimeGenerationPortReadinessRequired
          ? "generation port"
          : null,
        commandRouterQwenBinding.gates.selectionPolicyReadinessRequired
          ? "selection policy"
          : null,
        commandRouterQwenBinding.gates.deterministicFallbackPreserved
          ? "fallback preserved"
          : null,
      ].filter((label): label is string => Boolean(label))
    : ["explicit enablement", "artifact digest", "lifecycle readiness"];
  const commandRouterQwenActivationGateLabels = commandRouterQwenActivation
    ? [
        commandRouterQwenActivation.gates.preparedPolicyReviewed
          ? "policy reviewed"
          : null,
        commandRouterQwenActivation.gates.readinessEvidencePassed
          ? "readiness passed"
          : null,
        commandRouterQwenActivation.gates.noRuntimeProductBindingPresent
          ? "no-runtime binding"
          : null,
        commandRouterQwenActivation.gates.coreSelectionFallbackPreserved
          ? "core fallback"
          : null,
        commandRouterQwenActivation.gates.commandRouterSafetyGatesPreserved
          ? "safety gates"
          : null,
        commandRouterQwenActivation.gates.deterministicRulesActive
          ? "rules active"
          : null,
      ].filter((label): label is string => Boolean(label))
    : ["policy reviewed", "readiness passed", "no-runtime binding"];
  const qwenRuntimeControlSummary =
    qwenRuntimeControlStatus?.status.replaceAll("_", " ") ?? "disabled";
  const qwenRuntimeControlHelper =
    qwenRuntimeControlStatus?.helperLifecycle.replaceAll("_", " ") ?? "stopped";
  const qwenRuntimeControlRoute =
    qwenRuntimeControlStatus?.activeRouteSource ??
    "intent-router.deterministic.rules";
  const qwenRuntimeControlSession =
    qwenRuntimeControlStatus?.retainedSessionAvailable === true
      ? "retained"
      : "unavailable";
  const chatAnswerProductModeEnabled =
    chatAnswerProductModeStatus?.enabled === true;
  const chatAnswerRealRuntimeArmed =
    chatAnswerProductModeStatus?.realProviderRuntimeEnabled === true;
  const chatAnswerCredentialConfigured =
    chatAnswerProductModeStatus?.credentialConfigured === true;
  const chatAnswerSecureStoreAvailable =
    chatAnswerProductModeStatus?.secureStorageAvailable !== false;
  const chatAnswerProductModeSummary =
    chatAnswerProductModeStatus?.status.replaceAll("_", " ") ?? "unknown";
  const requiredProviderConfigurationCount = inferenceProviderRequirements
    .flatMap((report) => report.requirements)
    .filter(
      (requirement) => requirement.required && !requirement.configured,
    ).length;
  const installableModelCount = modelInstallabilityReports.filter(
    (item) => item.allowed,
  ).length;
  const blockedModelCount = modelInstallabilityReports.filter(
    (item) => !item.allowed,
  ).length;
  const activeModelOperationCount = modelOperations.filter((item) =>
    activeModelOperationPhases.has(item.phase),
  ).length;
  const resourceMemoryGiB = formatGib(
    resourceDiagnostics?.availableMemoryBytes,
  );
  const resourceVramGiB = formatGib(resourceDiagnostics?.availableVramBytes);
  const memoryAlpha = memoryAlphaStatus ?? snapshot?.memoryAlpha;
  const memoryAlphaReason =
    memoryAlpha?.reasonCodes[0]?.replaceAll("_", " ") ?? "none";
  const memoryAlphaProbeSummary = memoryAlphaRecallProbe
    ? `${memoryAlphaRecallProbe.status} / ${memoryAlphaRecallProbe.matchCount}`
    : "idle";
  const toolProductLoop = brainResult?.toolProductLoop;
  const alphaHardening = brainResult?.alphaHardening;
  const sessionHistory = snapshot?.sessionHistory ?? [];
  const cloudTtsAvailable = ttsServiceStatus?.configured === true;
  const ttsSafetyEligible =
    brainResult?.dispatchStatus === "completed" &&
    alphaHardening?.tts.status === "eligible";
  const localTtsEligible =
    (cloudTtsAvailable || localTtsEnabled) && ttsSafetyEligible;
  const displayedLocalTtsStatus =
    localTtsStatus === "disabled" && localTtsEligible
      ? "eligible"
      : localTtsStatus;
  const selectedToolDescriptor = toolProductLoop?.descriptors.find(
    (item) => item.id === toolProductLoop.selectedToolId,
  );
  const commandRouterRealLaunchTarget = commandRouterAllowedRealLocalAppTarget(
    typeof brainResult?.decision.slots.target === "string"
      ? brainResult.decision.slots.target
      : "",
  );
  const commandRouterRealLaunchEligible =
    commandRouterProductModeEnabled &&
    brainResult?.decision.intent === "localApp.open" &&
    brainResult.dispatchStatus === "completed" &&
    toolProductLoop?.selectedToolId === "localApp.open" &&
    (toolProductLoop.safety?.reasonCode === "ALLOWED" ||
      toolProductLoop.execution?.resultCode === "FIXTURE_DRY_RUN") &&
    commandRouterRealLaunchTarget !== null;
  const viewTitle =
    activeView === "conversation"
      ? (activeConversation?.title ?? copy.view.primarySession)
      : activeView === "tasks"
        ? copy.view.tasks
        : activeView === "plugins"
          ? copy.view.plugins
          : activeView === "memory"
            ? copy.view.memoryCenter
            : activeView === "voice"
              ? copy.view.voiceConsole
              : activeView === "settings"
                ? copy.view.settings
                : copy.view.activity;
  const viewSubtitle =
    activeView === "conversation"
      ? `sequence ${snapshot?.sequenceId ?? 0}${
          snapshot?.activeConversationId
            ? ` / active ${snapshot.activeConversationId.slice(-8)}`
            : ""
        }`
      : activeView === "tasks"
        ? `${snapshot?.tasks.length ?? 0} tasks / ${modelOperations.length} model operations`
        : activeView === "plugins"
          ? `${plugins.length} plugins / ${enabledPluginCount} enabled / ${disabledPluginCount} disabled`
          : activeView === "memory"
            ? `${userControlledMemories.length} memories / ${routeAliasMemoryCount} routes / ${voiceAliasMemoryCount} voice / ${preferenceMemoryCount} prefs`
            : activeView === "voice"
              ? `${snapshot?.voice.mode ?? "manual"} / ${snapshot?.voice.state ?? "idle"}`
              : activeView === "settings"
                ? `runtime ${runtimeMode} / Memory alpha ${memoryAlpha?.state ?? "unknown"}`
                : `${recentEvents.length} recent events / Memory alpha ${memoryAlpha?.state ?? "unknown"}`;

  useEffect(() => {
    if (textOnlyAcceptanceMode && activeView === "voice") {
      setActiveView("conversation");
    }
  }, [activeView, textOnlyAcceptanceMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.jarvisTheme = skinTheme;
    root.style.colorScheme = activeSkinTheme.colorScheme;
  }, [activeSkinTheme.colorScheme, skinTheme]);

  useEffect(() => {
    if (activeView === "plugins" && coreOnline) {
      void refreshPlugins();
      void refreshLocalPluginManifestDeveloperStatus();
    }
  }, [
    activeView,
    coreOnline,
    refreshLocalPluginManifestDeveloperStatus,
    refreshPlugins,
  ]);

  useEffect(() => {
    if (activeView === "memory" && coreOnline) {
      void refreshUserControlledMemories();
    }
  }, [activeView, coreOnline, refreshUserControlledMemories]);

  useEffect(() => {
    if (!ttsSafetyEligible) {
      return;
    }
    void refreshTtsServiceStatus();
  }, [refreshTtsServiceStatus, ttsSafetyEligible]);

  async function trackAction(
    label: string,
    action: () => Promise<boolean | string | null | void>,
    successLabel = `${label} ${copy.action.complete}`,
  ) {
    setLastAction({ label: `${label} ${copy.action.running}`, tone: "accent" });
    try {
      const result = await action();
      const ok =
        typeof result === "boolean"
          ? result
          : typeof result === "string"
            ? result.length > 0
            : result !== null;
      setLastAction({
        label: ok ? successLabel : `${label} ${copy.action.failed}`,
        tone: ok ? "success" : "warning",
      });
      return result;
    } catch (caught) {
      const detail = formatActionError(caught);
      setLastAction({
        label: `${label} ${copy.action.failed}${detail ? `: ${detail}` : ""}`,
        tone: "warning",
      });
      return false;
    }
  }

  function notifyAction(label: string, tone: ActionStatus["tone"] = "accent") {
    setLastAction({ label, tone });
  }

  async function handleConfirmVoiceCommandCorrection(
    candidate: VoiceCommandCorrectionCandidate,
  ) {
    await trackAction(
      `Voice correction ${candidate.label}`,
      () => confirmVoiceCommandCorrection(candidate),
      "Voice correction confirmed",
    );
  }

  async function handleConfirmUserRouteAlias(
    proposal: UserRouteAliasLearningProposal,
  ) {
    await trackAction(
      `Save route alias ${proposal.label}`,
      () => confirmUserRouteAlias(proposal),
      "Route alias saved",
    );
  }

  async function handleDeleteVoiceCommandAlias(aliasId: string) {
    await trackAction(
      "Delete voice alias",
      () => deleteVoiceCommandAlias(aliasId),
      "Voice alias deleted",
    );
  }

  async function handleDeleteUserRouteAlias(aliasId: string) {
    await trackAction(
      "Delete route alias",
      () => deleteUserRouteAlias(aliasId),
      "Route alias deleted",
    );
  }

  async function handleDeleteUserControlledMemory(
    memory: UserControlledMemoryRecord,
  ) {
    const confirmed = window.confirm(
      `Delete saved memory "${memory.label}" from Jarvis-K?`,
    );
    if (!confirmed) {
      notifyAction("Delete user memory cancelled", "warning");
      return;
    }

    const memoryKey = formatUserControlledMemoryKey(memory);
    setUserControlledMemoryDeletePendingKey(memoryKey);
    try {
      await trackAction(
        "Delete user memory",
        () => deleteUserControlledMemory(memory.kind, memory.sourceId),
        copy.action.userMemoryDeleted,
      );
    } finally {
      setUserControlledMemoryDeletePendingKey(null);
    }
  }

  function handleExportUserControlledMemorySanitizedSnapshot() {
    const sanitizedSnapshot = buildSanitizedUserControlledMemorySnapshot(
      userControlledMemories,
    );
    if (!validateSanitizedUserControlledMemorySnapshot(sanitizedSnapshot)) {
      notifyAction("Sanitized memory snapshot validation failed", "warning");
      return;
    }
    setUserControlledMemorySanitizedSnapshotPreview(
      JSON.stringify(sanitizedSnapshot, null, 2),
    );
    setUserControlledMemorySanitizedSnapshotGeneratedAt(
      sanitizedSnapshot.generatedAt,
    );
    notifyAction("Sanitized memory snapshot generated", "success");
  }

  function handleClearUserControlledMemorySanitizedSnapshot() {
    setUserControlledMemorySanitizedSnapshotPreview("");
    setUserControlledMemorySanitizedSnapshotGeneratedAt(null);
    notifyAction("Sanitized memory snapshot cleared", "success");
  }

  async function handleRefreshVoiceCommandAliases() {
    await trackAction(
      "Refresh voice aliases",
      refreshVoiceCommandAliases,
      "Voice aliases refreshed",
    );
  }

  async function handleRefreshUserRouteAliases() {
    await trackAction(
      "Refresh route aliases",
      refreshUserRouteAliases,
      "Route aliases refreshed",
    );
  }

  async function handleRefreshUserControlledMemories() {
    await trackAction(
      "Refresh user memories",
      refreshUserControlledMemories,
      copy.action.userMemoryRefreshed,
    );
  }

  function handleSelectView(view: ActiveView) {
    if (textOnlyAcceptanceMode && view === "voice") {
      notifyAction(copy.label.textOnlyAcceptance, "warning");
      return;
    }
    setActiveView(view);
    notifyAction(
      view === "settings"
        ? copy.action.settingsViewActive
        : `${copy.nav[view]} ${copy.action.viewActive}`,
    );
  }

  function handleSelectLanguage(language: UiLanguage) {
    setUiLanguage(language);
    persistUiLanguage(language);
    const nextCopy = uiCopy[language];
    setLastAction({
      label: `${nextCopy.settings.languageChanged}: ${nextCopy.settings.languageCurrent} ${language === "zh" ? nextCopy.settings.chinese : nextCopy.settings.english}`,
      tone: "success",
    });
  }

  function handleSelectSkinTheme(themeId: SkinThemeId) {
    setSkinTheme(themeId);
    persistSkinTheme(themeId);
    const nextTheme =
      builtInSkinThemes.find((theme) => theme.id === themeId) ??
      builtInSkinThemes[0];
    setLastAction({
      label: `${copy.settings.themeChanged}: ${nextTheme.label}`,
      tone: "success",
    });
  }

  function cleanupCloudTtsAudio() {
    const audio = ttsAudioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
      ttsAudioRef.current = null;
    }
    const url = ttsAudioUrlRef.current;
    if (url) {
      URL.revokeObjectURL(url);
      ttsAudioUrlRef.current = null;
    }
  }

  function stopLocalTts() {
    let stopped = false;
    if (ttsAudioRef.current || ttsAudioUrlRef.current) {
      cleanupCloudTtsAudio();
      stopped = true;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      stopped = true;
    }
    if (!stopped) {
      setLocalTtsStatus("unavailable");
      return false;
    }
    setLocalTtsStatus("cancelled");
    return true;
  }

  async function playLocalFallbackTts(text: string) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      setLocalTtsStatus("unavailable");
      return false;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const language = selectLocalTtsLanguage(text, uiLanguage);
    utterance.lang = language;
    try {
      const voices = await waitForLocalTtsVoices(window.speechSynthesis);
      const voice = selectLocalTtsVoice(voices, language);
      if (voice) {
        utterance.voice = voice;
      }
    } catch {
      // Voice enumeration is best-effort; fallback to the browser default voice.
    }
    const startTimeout = globalThis.setTimeout(() => {
      if (!window.speechSynthesis.speaking) {
        setLocalTtsStatus("unavailable");
      }
    }, 1500);
    utterance.onstart = () => {
      globalThis.clearTimeout(startTimeout);
      setLocalTtsStatus("playing");
    };
    utterance.onend = () => {
      globalThis.clearTimeout(startTimeout);
      setLocalTtsStatus("played");
    };
    utterance.onerror = (event) => {
      globalThis.clearTimeout(startTimeout);
      const errorEvent = event as SpeechSynthesisErrorEvent;
      console.warn("[Local TTS] speech synthesis error", errorEvent.error);
      setLocalTtsStatus("unavailable");
    };
    setLocalTtsStatus("playing");
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (error) {
      globalThis.clearTimeout(startTimeout);
      console.warn("[Local TTS] speech synthesis failed", error);
      setLocalTtsStatus("unavailable");
      return false;
    }
  }

  async function playLocalTts() {
    const text = brainResult?.summary.trim().slice(0, 800);
    if (!localTtsEligible || !text) {
      setTtsError(
        !text
          ? uiLanguage === "zh"
            ? "当前结果没有可播报摘要。"
            : "The current result has no speakable summary."
          : uiLanguage === "zh"
            ? "当前结果未通过安全播报条件。"
            : "The current result is not eligible for playback.",
      );
      setLocalTtsStatus("disabled");
      return false;
    }

    setTtsError(null);
    stopLocalTts();

    if (localTtsEnabled) {
      return playLocalFallbackTts(text.slice(0, 480));
    }

    if (cloudTtsAvailable && window.jarvis) {
      try {
        const result = await window.jarvis.synthesizeTts(
          text,
          ttsServiceStatus?.voiceId,
        );
        if (result.ok && result.audio.byteLength > 0) {
          const url = URL.createObjectURL(
            new Blob([result.audio], { type: result.contentType }),
          );
          const audio = new Audio(url);
          audio.preload = "auto";
          audio.autoplay = false;
          audio.volume = 1;
          ttsAudioRef.current = audio;
          ttsAudioUrlRef.current = url;
          audio.onended = () => {
            cleanupCloudTtsAudio();
            setLocalTtsStatus("played");
          };
          audio.onerror = () => {
            cleanupCloudTtsAudio();
            setTtsError(
              uiLanguage === "zh"
                ? "云端音频已返回，但前端无法解码或输出。"
                : "Cloud audio returned, but the renderer could not decode or output it.",
            );
            setLocalTtsStatus("unavailable");
          };
          const sinkCapable = audio as HTMLAudioElement & {
            setSinkId?: (sinkId: string) => Promise<void>;
          };
          if (typeof sinkCapable.setSinkId === "function") {
            await sinkCapable.setSinkId("default").catch(() => undefined);
          }
          setLocalTtsStatus("playing");
          try {
            await audio.play();
            return true;
          } catch (error) {
            cleanupCloudTtsAudio();
            setTtsError(
              uiLanguage === "zh"
                ? "音频播放被系统拦截，请确认 Windows 输出设备和音量。"
                : "Audio playback was blocked. Check the Windows output device and volume.",
            );
            setLocalTtsStatus("unavailable");
          }
        } else if (!result.ok) {
          setTtsError(result.message);
        }
      } catch (error) {
        console.warn("[Cloud TTS] synthesis failed", error);
        setTtsError(
          uiLanguage === "zh"
            ? "云端 TTS 请求失败，已停止播放。"
            : "The cloud TTS request failed, so playback stopped.",
        );
      }
    }

    if (!ttsError) {
      setTtsError(
        uiLanguage === "zh"
          ? "TTS 没有返回可播放音频。"
          : "TTS did not return playable audio.",
      );
    }
    setLocalTtsStatus("unavailable");
    return false;
  }

  useEffect(() => {
    if (
      !brainResult ||
      brainResult.source !== "voice" ||
      brainResult.dispatchStatus !== "completed" ||
      !cloudTtsAvailable
    ) {
      return;
    }

    const key =
      brainResult.assistantMessageId ??
      `${brainResult.routedAt}:${brainResult.text}`;
    if (autoSpokenTtsKeyRef.current === key) {
      return;
    }
    autoSpokenTtsKeyRef.current = key;
    void playLocalTts();
  }, [brainResult, cloudTtsAvailable]);

  async function handleRetryBrainCommand() {
    await trackAction(alphaCopy.retry, retryBrainCommand);
  }

  function handleRollbackBrainResult() {
    stopLocalTts();
    const rolledBack = rollbackBrainResult();
    notifyAction(
      rolledBack
        ? `${alphaCopy.rollback} ${copy.action.complete}`
        : `${alphaCopy.rollback} ${copy.action.failed}`,
      rolledBack ? "success" : "warning",
    );
  }

  async function handleClearSessionHistory() {
    await trackAction(alphaCopy.clearHistory, clearSessionHistory);
  }

  async function handleSelectConversation(
    conversationId: string,
    active: boolean,
  ) {
    if (active) {
      notifyAction(copy.action.conversationAlreadyActive, "accent");
      return;
    }
    await trackAction(
      "Select conversation",
      () => selectConversation(conversationId),
      copy.action.conversationSelected,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (sending) return;
    if (!text) {
      notifyAction(copy.action.typeCommandFirst, "warning");
      return;
    }
    const accepted = await trackAction(
      "Send command",
      () => runBrainCommand(text),
      copy.action.commandSent,
    );
    if (accepted) setDraft("");
  }

  async function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    if (!activeConversation) {
      notifyAction(copy.action.noConversationSelected, "warning");
      return;
    }
    const title = conversationTitleDraft.trim();
    if (!title) {
      notifyAction(copy.action.enterConversationTitle, "warning");
      return;
    }
    const renamed = await trackAction(
      "Rename conversation",
      () => renameConversation(activeConversation.id, title),
      copy.action.conversationRenamed,
    );
    if (renamed) {
      setRenaming(false);
      setConversationTitleDraft("");
    }
  }

  async function handleExportMemorySnapshot() {
    const snapshotJson = await trackAction(
      "Export memory snapshot",
      exportMemorySnapshot,
      copy.action.memorySnapshotExported,
    );
    if (snapshotJson) {
      setMemorySnapshotDraft(snapshotJson);
    }
  }

  async function handleImportMemorySnapshot() {
    if (!memorySnapshotDraft.trim()) {
      notifyAction(copy.action.pasteMemorySnapshotFirst, "warning");
      return;
    }
    const imported = await trackAction(
      "Import memory snapshot",
      () => importMemorySnapshot(memorySnapshotDraft),
      copy.action.memorySnapshotImported,
    );
    if (imported) {
      void refreshMemoryHealth();
    }
  }

  async function handleMemoryAlphaProbe() {
    const text = memoryAlphaProbeDraft.trim();
    if (sending) return;
    if (!text) {
      notifyAction(copy.action.enterRecallProbeFirst, "warning");
      return;
    }
    const probed = await trackAction(
      "Memory alpha recall probe",
      () => probeMemoryAlphaRecall(text),
      copy.action.memoryAlphaRecallProbeComplete,
    );
    if (probed) setMemoryAlphaProbeDraft("");
  }

  async function handleConfirmCommandRouterLocalAppLaunch() {
    if (!commandRouterRealLaunchTarget) {
      notifyAction("Local app launch is not allowlisted", "warning");
      return;
    }
    const confirmed = window.confirm(
      `Launch ${commandRouterRealLaunchTarget} now? This approval only allows Notepad or Calculator.`,
    );
    if (!confirmed) {
      notifyAction("Local app launch cancelled", "warning");
      return;
    }
    const result = await confirmCommandRouterLocalAppLaunch(
      commandRouterRealLaunchTarget,
    );
    if (!result) {
      notifyAction("Local app launch failed", "warning");
      return;
    }
    notifyAction(
      result.status === "completed"
        ? `Local app launch completed: ${result.label}`
        : `Local app launch blocked: ${result.reasonCode}`,
      result.status === "completed" ? "success" : "warning",
    );
  }

  async function handleCancelTask(taskId: string, title: string) {
    const confirmed = window.confirm(
      `Cancel pending task "${title}"? Planned steps will not run.`,
    );
    if (!confirmed) {
      notifyAction("Task cancellation cancelled", "warning");
      return;
    }
    const cancelled = await trackAction(
      "Cancel pending task",
      () => cancelTask(taskId),
      "Task cancelled",
    );
    if (!cancelled) {
      notifyAction("Task cancellation failed", "warning");
    }
  }

  async function handleApproveTask(taskId: string, title: string) {
    const confirmed = window.confirm(
      `Approve and execute planner draft "${title}"? Only bounded L3 planner steps can run.`,
    );
    if (!confirmed) {
      notifyAction("Planner approval cancelled", "warning");
      return;
    }
    const approved = await trackAction(
      "Approve planner draft",
      () => approveTask(taskId),
      "Planner draft approved",
    );
    if (!approved) {
      notifyAction("Planner draft approval failed", "warning");
    }
  }

  async function handleQwenRuntimeControlAction(
    action: "start" | "stop" | "rollback",
  ) {
    const label = `Qwen runtime control ${action}`;
    await trackAction(
      label,
      () => setQwenRuntimeControlAction(action),
      `${label} ${copy.action.complete}`,
    );
    void refreshQwenRuntimeControlStatus();
  }

  async function handleDisableMemoryAlpha() {
    if (memoryAlpha?.state !== "active") {
      notifyAction(
        `${copy.action.memoryAlphaIs} ${memoryAlpha?.state ?? "not available"}`,
        "warning",
      );
      return;
    }
    await trackAction(
      "Disable Memory alpha",
      disableMemoryAlpha,
      copy.action.memoryAlphaDisabled,
    );
  }

  async function handleRunFixtureEmbeddingProbe() {
    if (!fixtureEmbeddingAvailable) {
      notifyAction(copy.action.fixtureEmbeddingUnavailable, "warning");
      return;
    }
    await trackAction(
      "Run fixture embedding",
      runFixtureEmbeddingProbe,
      copy.action.fixtureEmbeddingCompleted,
    );
  }

  async function handleRunFixtureIntentProbe() {
    if (!intentRouterAvailable) {
      notifyAction(copy.action.fixtureIntentUnavailable, "warning");
      return;
    }
    await trackAction(
      "Run fixture intent routing",
      runFixtureIntentProbe,
      copy.action.fixtureIntentCompleted,
    );
  }

  async function handleRunFixtureOcrProbe() {
    if (!ocrProviderAvailable) {
      notifyAction(copy.action.fixtureOcrUnavailable, "warning");
      return;
    }
    await trackAction(
      "Run fixture OCR",
      runFixtureOcrProbe,
      copy.action.fixtureOcrCompleted,
    );
  }

  async function handleRunFixtureRerankProbe() {
    if (!rerankerProviderAvailable) {
      notifyAction(copy.action.fixtureRerankerUnavailable, "warning");
      return;
    }
    await trackAction(
      "Run fixture reranker",
      runFixtureRerankProbe,
      copy.action.fixtureRerankerCompleted,
    );
  }

  return (
    <div
      className="flex h-screen min-h-[620px] min-w-[920px] flex-col overflow-hidden bg-background text-foreground"
      data-testid="jarvis-app"
      data-skin-theme={skinTheme}
      data-ui-language={uiLanguage}
      data-voice-permission={snapshot?.voice.permission ?? "unknown"}
      data-voice-state={snapshot?.voice.state ?? "idle"}
      data-voice-transcript={snapshot?.voice.transcript?.text ?? ""}
      data-voice-transcript-final={
        snapshot?.voice.transcript?.isFinal ? "true" : "false"
      }
    >
      <header className="flex h-[68px] shrink-0 items-center justify-between border-b bg-card px-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            JK
          </div>
          <div className="min-w-0">
            <h1 className="text-[21px] font-bold leading-6">JARVIS-K</h1>
            <p className="text-[11px] leading-4 text-muted-foreground">
              {copy.appSubtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className="h-7 rounded-md px-2.5 text-[11px]"
            variant="secondary"
          >
            {copy.label.protocol}
          </Badge>
          <Badge
            className="h-7 rounded-md border-border px-2.5 text-[11px]"
            data-testid="core-status"
            variant="outline"
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                coreOnline ? "bg-success" : "bg-warning",
              )}
            />
            {connection.toUpperCase()}
          </Badge>
        </div>
      </header>

      {textOnlyAcceptanceMode && (
        <div
          className="flex h-9 shrink-0 items-center gap-2 border-b bg-muted px-5 text-xs text-muted-foreground"
          data-testid="text-only-acceptance-status"
          role="status"
        >
          <MicOff className="size-3.5" />
          {copy.label.textOnlyAcceptance}
        </div>
      )}

      <div
        className={cn(
          "grid min-h-0 flex-1",
          inspectorOpen
            ? "grid-cols-[76px_minmax(0,1fr)_320px] max-[1080px]:grid-cols-[68px_minmax(0,1fr)]"
            : "grid-cols-[76px_minmax(0,1fr)] max-[1080px]:grid-cols-[68px_minmax(0,1fr)]",
        )}
      >
        <aside className="flex min-h-0 flex-col items-center justify-between border-r bg-card py-[18px]">
          <nav className="flex flex-col gap-2" aria-label="Primary navigation">
            {visiblePrimaryNavigation.map((item) => (
              <NavigationButton
                active={activeView === item.id}
                item={item}
                key={item.id}
                label={copy.nav[item.id]}
                onSelect={handleSelectView}
              />
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={
                    textOnlyAcceptanceMode
                      ? copy.label.textOnlyAcceptance
                      : copy.label.pushToTalk
                  }
                  aria-pressed={ptt.active}
                  className={cn(
                    "size-10 rounded-md",
                    ptt.active && "bg-destructive text-destructive-foreground",
                  )}
                  data-capture-state={ptt.state}
                  data-testid={
                    textOnlyAcceptanceMode
                      ? "text-only-voice-disabled"
                      : "push-to-talk"
                  }
                  disabled={!coreOnline || textOnlyAcceptanceMode}
                  onContextMenu={(event) => event.preventDefault()}
                  onPointerCancel={() => {
                    if (textOnlyAcceptanceMode) return;
                    void ptt.stop("user-cancel");
                  }}
                  onPointerDown={(event) => {
                    if (textOnlyAcceptanceMode) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    void ptt.start();
                  }}
                  onPointerUp={(event) => {
                    if (textOnlyAcceptanceMode) return;
                    if (
                      event.currentTarget.hasPointerCapture(event.pointerId)
                    ) {
                      event.currentTarget.releasePointerCapture(
                        event.pointerId,
                      );
                    }
                    void ptt.stop("release");
                  }}
                  size="icon-lg"
                  type="button"
                  variant={ptt.active ? "default" : "outline"}
                >
                  {textOnlyAcceptanceMode ? (
                    <MicOff className="size-4" />
                  ) : (
                    <Mic2 className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {textOnlyAcceptanceMode
                  ? copy.label.textOnlyAcceptance
                  : copy.label.pushToTalk}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={copy.label.toggleInspector}
                  aria-pressed={inspectorOpen}
                  data-testid="toggle-inspector"
                  onClick={() => setInspectorOpen((open) => !open)}
                  size="icon-lg"
                  type="button"
                  variant="ghost"
                >
                  <PanelLeft className="size-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {inspectorOpen
                  ? copy.label.hideInspector
                  : copy.label.showInspector}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={copy.label.generalSettings}
                  aria-pressed={activeView === "settings"}
                  className={cn(
                    "size-10 rounded-md text-muted-foreground",
                    activeView === "settings" &&
                      "bg-secondary text-primary hover:bg-secondary",
                  )}
                  data-testid="general-settings"
                  onClick={() => handleSelectView("settings")}
                  size="icon-lg"
                  type="button"
                  variant="ghost"
                >
                  <Settings className="size-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {copy.label.generalSettings}
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col bg-background">
          <div className="flex h-[70px] shrink-0 items-center justify-between border-b px-7">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">{viewTitle}</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {viewSubtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastAction && (
                <Badge
                  className={cn(
                    "max-w-[260px] truncate rounded-md text-[10px]",
                    lastAction.tone === "success" && "text-success",
                    lastAction.tone === "warning" && "text-warning",
                    lastAction.tone === "accent" && "text-accent",
                  )}
                  data-testid="last-action-status"
                  variant="outline"
                >
                  {lastAction.label}
                </Badge>
              )}
              {renaming && activeConversation ? (
                <form
                  className="flex items-center gap-1.5"
                  onSubmit={handleRenameSubmit}
                >
                  <Input
                    aria-label="Conversation title"
                    className="h-8 w-[180px] rounded-md text-xs"
                    data-testid="conversation-title-input"
                    onChange={(event) =>
                      setConversationTitleDraft(event.target.value)
                    }
                    value={conversationTitleDraft}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="Save conversation title"
                        className="size-8 rounded-md"
                        data-testid="save-conversation-title"
                        disabled={sending}
                        size="icon-sm"
                        type="submit"
                      >
                        <Check className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save conversation title</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="Cancel conversation rename"
                        className="size-8 rounded-md"
                        data-testid="cancel-conversation-rename"
                        onClick={() => {
                          setRenaming(false);
                          setConversationTitleDraft("");
                          notifyAction(
                            copy.action.conversationRenameCancelled,
                            "accent",
                          );
                        }}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Cancel conversation rename</TooltipContent>
                  </Tooltip>
                </form>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="Rename conversation"
                        className="size-8 rounded-md"
                        data-testid="rename-conversation"
                        disabled={sending}
                        onClick={() => {
                          if (!activeConversation) {
                            notifyAction("No conversation selected", "warning");
                            return;
                          }
                          setConversationTitleDraft(
                            activeConversation?.title ?? "",
                          );
                          setRenaming(true);
                          notifyAction(copy.action.renameModeActive, "accent");
                        }}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rename conversation</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="New conversation"
                        className="size-8 rounded-md"
                        data-testid="new-conversation"
                        disabled={sending}
                        onClick={() =>
                          void trackAction(
                            "Create conversation",
                            createConversation,
                            copy.action.conversationCreated,
                          )
                        }
                        size="icon-sm"
                        variant="outline"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>New conversation</TooltipContent>
                  </Tooltip>
                </>
              )}
              <Badge
                className="rounded-md text-[10px] text-accent"
                variant="secondary"
              >
                {copy.label.localContract}
              </Badge>
            </div>
          </div>

          <div className="flex h-[48px] shrink-0 items-center gap-2 overflow-x-auto border-b px-6">
            {activeView === "conversation" ? (
              conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {copy.label.noLocalConversations}
                </p>
              ) : (
                conversations.map((conversation) => {
                  const active =
                    conversation.id === snapshot?.activeConversationId;
                  return (
                    <Button
                      className={cn(
                        "h-8 max-w-[220px] shrink-0 rounded-md px-2.5 text-xs",
                        active && "border-primary text-primary",
                      )}
                      data-testid="conversation-tab"
                      disabled={sending}
                      key={conversation.id}
                      onClick={() =>
                        void handleSelectConversation(conversation.id, active)
                      }
                      type="button"
                      variant={active ? "outline" : "ghost"}
                    >
                      <span className="truncate">{conversation.title}</span>
                    </Button>
                  );
                })
              )
            ) : (
              <>
                <Badge className="rounded-md text-[10px]" variant="secondary">
                  {activeView.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {lastAction?.label ?? copy.label.readyDiagnostics}
                </span>
              </>
            )}
          </div>

          {activeView === "conversation" ? (
            <ScrollArea className="min-h-0 flex-1">
              <div
                className="flex min-h-full flex-col gap-6 px-8 py-7"
                data-testid="message-list"
              >
                <div className="flex gap-3.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Bot className="size-4" />
                  </div>
                  <div className="max-w-[760px] space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {copy.label.agentCore}
                    </p>
                    <p className="text-sm leading-6">
                      {copy.label.runtimeReady}
                    </p>
                  </div>
                </div>

                {brainResult && (
                  <div
                    className="max-w-[760px] rounded-md border bg-card px-4 py-3"
                    data-testid="brain-dispatch-panel"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">
                        {copy.label.brainDispatch}
                      </h3>
                      <Badge
                        className="rounded-md text-[10px]"
                        variant="outline"
                      >
                        {brainResult.dispatchStatus}
                      </Badge>
                    </div>
                    <dl className="grid gap-2 text-[11px] sm:grid-cols-4">
                      <div>
                        <dt className="text-muted-foreground">
                          {copy.label.brainSource}
                        </dt>
                        <dd
                          className="mt-0.5 truncate font-medium"
                          data-testid="brain-source"
                        >
                          {brainResult.source}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          {copy.label.brainIntent}
                        </dt>
                        <dd
                          className="mt-0.5 truncate font-medium"
                          data-testid="brain-intent"
                        >
                          {brainResult.decision.intent}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          {copy.label.brainConfidence}
                        </dt>
                        <dd className="mt-0.5 font-medium">
                          {Math.round(brainResult.decision.confidence * 100)}%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          {copy.label.brainStatus}
                        </dt>
                        <dd className="mt-0.5 truncate font-medium">
                          {brainResult.decision.requiresApproval
                            ? "approval"
                            : "ready"}
                        </dd>
                      </div>
                    </dl>
                    {brainResult.routerSelection && (
                      <div
                        className="mt-3 grid gap-2 border-y py-2 text-[11px] sm:grid-cols-4"
                        data-testid="command-router-safety-projection"
                      >
                        <div className="min-w-0">
                          <p className="text-muted-foreground">Router</p>
                          <p
                            className="mt-1 truncate font-medium"
                            data-testid="command-router-selected-provider"
                          >
                            {brainResult.routerSelection.selectedProviderId}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground">Route status</p>
                          <p className="mt-1 truncate font-medium">
                            {brainResult.routerSelection.status}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground">
                            Confidence band
                          </p>
                          <p className="mt-1 truncate font-medium">
                            {brainResult.routerSelection.confidenceBand}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground">Direct action</p>
                          <p
                            className="mt-1 truncate font-medium"
                            data-testid="command-router-direct-action"
                          >
                            {brainResult.routerSelection.directActionAttempted
                              ? "attempted"
                              : "disabled"}
                          </p>
                        </div>
                      </div>
                    )}
                    <p
                      className="mt-3 text-xs leading-5 text-muted-foreground"
                      data-testid="brain-summary"
                    >
                      {brainResult.summary}
                    </p>
                    {brainResult.pluginResult && (
                      <div
                        className="mt-3 rounded-md border bg-background px-3 py-2"
                        data-testid="plugin-result-panel"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-xs font-semibold">
                            {brainResult.pluginResult.capability}
                          </p>
                          <Badge
                            className="rounded-md text-[10px]"
                            variant="outline"
                          >
                            {brainResult.pluginResult.status}
                          </Badge>
                        </div>
                        {brainResult.pluginResult.output && (
                          <p
                            className="mt-1.5 text-xs leading-5 text-muted-foreground"
                            data-testid="plugin-result-summary"
                          >
                            {brainResult.pluginResult.output.summary}
                          </p>
                        )}
                        {brainResult.pluginResult.output?.items[0] && (
                          <div
                            className="mt-2 grid gap-1.5 text-[11px] sm:grid-cols-3"
                            data-testid="plugin-result-fields"
                          >
                            {brainResult.pluginResult.output.items[0].fields
                              .slice(0, 3)
                              .map((field) => (
                                <div className="min-w-0" key={field.label}>
                                  <p className="truncate text-muted-foreground">
                                    {field.label}
                                  </p>
                                  <p className="truncate font-medium">
                                    {String(field.value)}
                                  </p>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                    {toolProductLoop && (
                      <div
                        className="mt-3 border-t pt-3"
                        data-testid="tool-product-loop-panel"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[11px] font-medium text-muted-foreground">
                            Tool Product Loop
                          </p>
                          <Badge
                            className="rounded-md text-[10px]"
                            variant="secondary"
                          >
                            {toolProductLoop.mode.replace("_", " ")}
                          </Badge>
                        </div>
                        <dl className="grid gap-2 text-[11px] sm:grid-cols-4">
                          <div>
                            <dt className="text-muted-foreground">Registry</dt>
                            <dd className="mt-0.5 truncate font-medium">
                              {toolProductLoop.descriptors.length} fixture tools
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">
                              Selected Tool
                            </dt>
                            <dd
                              className="mt-0.5 truncate font-medium"
                              data-testid="tool-loop-selected-tool"
                            >
                              {toolProductLoop.selectedToolId ?? "none"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Safety</dt>
                            <dd
                              className="mt-0.5 truncate font-medium"
                              data-testid="tool-loop-safety"
                            >
                              {toolProductLoop.safety?.reasonCode ?? "blocked"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Result</dt>
                            <dd
                              className="mt-0.5 truncate font-medium"
                              data-testid="tool-loop-result"
                            >
                              {toolProductLoop.execution?.resultCode ??
                                "not_run"}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-3 grid gap-2 border-y py-2 text-[11px] sm:grid-cols-3">
                          <div className="min-w-0">
                            <p className="text-muted-foreground">Descriptor</p>
                            <p className="mt-1 truncate font-medium">
                              {selectedToolDescriptor
                                ? `${selectedToolDescriptor.label} / ${selectedToolDescriptor.risk}`
                                : "No descriptor selected"}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground">
                              Confirmation
                            </p>
                            <p className="mt-1 truncate font-medium">
                              {toolProductLoop.safety?.confirmationRequired
                                ? toolProductLoop.safety.audit
                                    .confirmationGranted
                                  ? "granted"
                                  : "required"
                                : "not required"}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground">Rollback</p>
                            <p className="mt-1 truncate font-medium">
                              {toolProductLoop.rollbackState}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                          {toolProductLoop.summary}
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                          Evidence: persisted{" "}
                          {String(toolProductLoop.persisted)} / raw diagnostics{" "}
                          {String(toolProductLoop.rawDiagnosticsExposed)}
                        </p>
                        <div
                          className="mt-3 space-y-1.5"
                          data-testid="tool-loop-lifecycle"
                        >
                          {toolProductLoop.lifecycle.map((step) => (
                            <div
                              className="flex items-center justify-between gap-3 text-[11px]"
                              key={`${step.stage}-${step.label}`}
                            >
                              <span className="min-w-0 truncate">
                                {step.stage.replaceAll("_", " ")}
                              </span>
                              <span className="shrink-0 text-muted-foreground">
                                {step.status}
                                {step.reasonCode ? ` / ${step.reasonCode}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {alphaHardening && (
                      <div
                        className="mt-3 border-t pt-3"
                        data-testid="stage5-alpha-panel"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[11px] font-medium text-muted-foreground">
                            {alphaCopy.title}
                          </p>
                          <Badge
                            className="rounded-md text-[10px]"
                            variant="outline"
                          >
                            {alphaHardening.schemaVersion}
                          </Badge>
                        </div>
                        <dl className="grid gap-2 text-[11px] sm:grid-cols-4">
                          <div>
                            <dt className="text-muted-foreground">
                              {alphaCopy.memoryContext}
                            </dt>
                            <dd
                              className="mt-0.5 truncate font-medium"
                              data-testid="stage5-memory-context"
                            >
                              {alphaHardening.memoryContext.status} /{" "}
                              {alphaHardening.memoryContext.matchCount}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">
                              {alphaCopy.safety}
                            </dt>
                            <dd className="mt-0.5 truncate font-medium">
                              {alphaHardening.retry.safetyPathReentered
                                ? alphaCopy.preserved
                                : alphaCopy.blocked}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">
                              {alphaCopy.retry}
                            </dt>
                            <dd className="mt-0.5 truncate font-medium">
                              {alphaHardening.retry.status}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">
                              {alphaCopy.tts}
                            </dt>
                            <dd
                              className="mt-0.5 truncate font-medium"
                              data-testid="stage5-tts-status"
                            >
                              {displayedLocalTtsStatus}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            aria-label={alphaCopy.retry}
                            className="h-7 rounded-md px-2 text-xs"
                            data-testid="stage5-retry"
                            disabled={
                              sending ||
                              alphaHardening.retry.status !== "available"
                            }
                            onClick={() => void handleRetryBrainCommand()}
                            type="button"
                            variant="outline"
                          >
                            <RefreshCw className="size-3.5" />
                            {alphaCopy.retry}
                          </Button>
                          <Button
                            aria-label={alphaCopy.rollback}
                            className="h-7 rounded-md px-2 text-xs"
                            data-testid="stage5-rollback"
                            disabled={
                              alphaHardening.rollback.status !== "available"
                            }
                            onClick={handleRollbackBrainResult}
                            type="button"
                            variant="ghost"
                          >
                            <RotateCcw className="size-3.5" />
                            {alphaCopy.rollback}
                          </Button>
                          <Button
                            aria-label={
                              localTtsStatus === "playing"
                                ? alphaCopy.stop
                                : alphaCopy.play
                            }
                            className="h-7 rounded-md px-2 text-xs"
                            data-testid="stage5-local-tts"
                            disabled={
                              localTtsStatus !== "playing" && !localTtsEligible
                            }
                            onClick={() => {
                              if (localTtsStatus === "playing") {
                                stopLocalTts();
                                return;
                              }
                              void playLocalTts();
                            }}
                            type="button"
                            variant="ghost"
                          >
                            {localTtsStatus === "playing" ? (
                              <VolumeX className="size-3.5" />
                            ) : (
                              <Volume2 className="size-3.5" />
                            )}
                            {localTtsStatus === "playing"
                              ? alphaCopy.stop
                              : alphaCopy.play}
                          </Button>
                        </div>
                        {ttsError && (
                          <p
                            className="mt-2 text-[10px] leading-4 text-warning"
                            data-testid="stage5-tts-error"
                          >
                            {ttsError}
                          </p>
                        )}
                        <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                          {alphaHardening.memoryContext.readOnly
                            ? `${alphaCopy.memoryContext}: ${alphaCopy.readOnly}`
                            : `${alphaCopy.memoryContext}: ${alphaCopy.blocked}`}
                          {" / "}
                          {localTtsEnabled
                            ? alphaCopy.ttsEnabled
                            : alphaCopy.ttsDisabled}
                        </p>
                      </div>
                    )}
                    <div className="mt-3 border-t pt-3">
                      <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                        {copy.label.brainPlan}
                      </p>
                      <div className="space-y-1.5">
                        {brainResult.plan.map((step) => (
                          <div
                            className="flex items-center justify-between gap-3 text-[11px]"
                            key={step.id}
                          >
                            <span className="truncate">{step.title}</span>
                            <span className="shrink-0 text-muted-foreground">
                              {step.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <section
                  className="max-w-[760px] border-y py-3"
                  data-testid="stage5-session-history"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {alphaCopy.history}
                    </p>
                    <Button
                      aria-label={alphaCopy.clearHistory}
                      className="size-7 rounded-md"
                      data-testid="stage5-clear-history"
                      disabled={sending || sessionHistory.length === 0}
                      onClick={() => void handleClearSessionHistory()}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  {sessionHistory.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      {alphaCopy.historyEmpty}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {sessionHistory.slice(0, 6).map((entry) => (
                        <div
                          className="grid gap-1 text-[11px] sm:grid-cols-[minmax(0,1fr)_auto]"
                          key={entry.id}
                        >
                          <span className="min-w-0 truncate">
                            {entry.source} / {entry.intent} /{" "}
                            {entry.selectedToolId ?? alphaCopy.noTool}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {entry.dispatchStatus} / {entry.memoryContextStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {visibleMessages.map((message) => (
                  <div
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                    key={message.id}
                  >
                    <div
                      className={cn(
                        "max-w-[72%] rounded-md px-3.5 py-2.5 text-sm leading-5",
                        message.role === "user"
                          ? "bg-secondary"
                          : "border bg-card",
                      )}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}

                {brainResult?.voiceCorrection?.requiresUserSelection &&
                  brainResult.correctionCandidates.length > 0 && (
                    <div
                      className="max-w-[760px] rounded-md border bg-card px-4 py-3"
                      data-testid="voice-correction-candidates"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase text-muted-foreground">
                            Voice correction
                          </p>
                          <p
                            className="mt-1 truncate text-xs"
                            data-testid="voice-correction-raw-transcript"
                          >
                            {brainResult.rawTranscript ?? brainResult.text}
                          </p>
                        </div>
                        <Badge
                          className="rounded-md text-[10px]"
                          variant="outline"
                        >
                          choose one
                        </Badge>
                      </div>
                      <div className="grid gap-2">
                        {brainResult.correctionCandidates.map(
                          (candidate, index) => (
                            <Button
                              className="h-auto justify-between gap-3 rounded-md px-3 py-2 text-left"
                              data-testid="voice-correction-candidate"
                              disabled={sending}
                              key={`${candidate.intent}-${index}`}
                              onClick={() =>
                                void handleConfirmVoiceCommandCorrection(
                                  candidate,
                                )
                              }
                              type="button"
                              variant="outline"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold">
                                  {candidate.label}
                                </span>
                                <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                                  {candidate.intent} /{" "}
                                  {formatVoiceCorrectionSlots(candidate.slots)}
                                </span>
                              </span>
                              <span className="shrink-0 text-[11px] font-medium text-accent">
                                {formatConfidence(candidate.confidence)}
                              </span>
                            </Button>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {brainResult?.userRouteAliasProposal && (
                  <div
                    className="max-w-[760px] rounded-md border bg-card px-4 py-3"
                    data-testid="user-route-alias-proposal"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase text-muted-foreground">
                          Route alias memory
                        </p>
                        <p
                          className="mt-1 truncate text-xs font-semibold"
                          data-testid="user-route-alias-proposal-label"
                        >
                          {brainResult.userRouteAliasProposal.label}
                        </p>
                      </div>
                      <Badge className="rounded-md text-[10px]" variant="outline">
                        confirm save
                      </Badge>
                    </div>
                    <div className="grid gap-1.5 text-[11px] text-muted-foreground">
                      <p className="truncate">
                        browser.open /{" "}
                        {brainResult.userRouteAliasProposal.targetHostname}
                      </p>
                      <p className="truncate">
                        {brainResult.userRouteAliasProposal.targetUrl}
                      </p>
                      <p className="uppercase">
                        {brainResult.userRouteAliasProposal.urlPolicy}
                      </p>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        className="h-8 rounded-md px-3 text-[11px]"
                        data-testid="user-route-alias-save"
                        disabled={sending}
                        onClick={() =>
                          void handleConfirmUserRouteAlias(
                            brainResult.userRouteAliasProposal!,
                          )
                        }
                        type="button"
                        variant="outline"
                      >
                        <Check className="mr-1.5 size-3" />
                        Save alias
                      </Button>
                    </div>
                  </div>
                )}

                {events.some(
                  (item) => item.event.type === "agent.message.accepted",
                ) && (
                  <div className="flex w-fit items-center gap-2 rounded-md border bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-accent" />
                    agent.message.accepted / correlated command
                  </div>
                )}

                {!textOnlyAcceptanceMode &&
                  (voiceTranscript || snapshot?.voice.state !== "idle") && (
                    <div
                      className="max-w-[760px] rounded-md border bg-card px-4 py-3"
                      data-testid="voice-transcript-panel"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          {copy.label.voiceTranscript}
                        </p>
                        <Badge
                          className="rounded-md text-[10px]"
                          variant="outline"
                        >
                          {snapshot?.voice.transcript?.isFinal
                            ? "FINAL"
                            : snapshot?.voice.state.toUpperCase()}
                        </Badge>
                      </div>
                      <p
                        className="mt-2 min-h-5 text-sm leading-6"
                        data-testid="voice-transcript"
                      >
                        {voiceTranscript || "Listening..."}
                      </p>
                    </div>
                  )}

                {error && (
                  <div className="flex w-fit items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <CircleAlert className="size-3.5" />
                    {error}
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : activeView === "tasks" ? (
            <ScrollArea className="min-h-0 flex-1">
              <div
                className="grid gap-5 px-8 py-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
                data-testid="tasks-view"
              >
                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{copy.view.tasks}</h3>
                    <Badge className="rounded-md text-[10px]" variant="outline">
                      {snapshot?.tasks.length ?? 0} TRACKED
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    {(snapshot?.tasks.length ?? 0) === 0 ? (
                      <div className="border-y py-5 text-xs text-muted-foreground">
                        {copy.label.noCoreTasks}
                      </div>
                    ) : (
                      snapshot?.tasks.map((task) => (
                        <article
                          className="rounded-md border bg-card/40 p-3 text-xs"
                          key={task.id}
                          data-testid="task-card"
                        >
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {task.title}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                                <span>{task.routeSource}</span>
                                {task.intent ? (
                                  <span>{task.intent}</span>
                                ) : null}
                                {task.verificationSummary ? (
                                  <span>{task.verificationSummary}</span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="text-right">
                                <Badge
                                  className="rounded-md text-[10px]"
                                  variant="outline"
                                >
                                  {task.state}
                                </Badge>
                                <time className="mt-1 block text-[10px] text-muted-foreground">
                                  {formatEventTime(task.updatedAt)}
                                </time>
                              </div>
                              {isTaskApprovalEligible(task.state) ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      aria-label={`Approve ${task.title}`}
                                      className="size-7 rounded-md"
                                      data-testid="task-approve"
                                      disabled={sending}
                                      onClick={() =>
                                        void handleApproveTask(
                                          task.id,
                                          task.title,
                                        )
                                      }
                                      size="icon-sm"
                                      type="button"
                                      variant="ghost"
                                    >
                                      <Play className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Approve and execute planner draft
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                              {isTaskCancellationEligible(task.state) ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      aria-label={`Cancel ${task.title}`}
                                      className="size-7 rounded-md"
                                      data-testid="task-cancel"
                                      disabled={sending}
                                      onClick={() =>
                                        void handleCancelTask(
                                          task.id,
                                          task.title,
                                        )
                                      }
                                      size="icon-sm"
                                      type="button"
                                      variant="ghost"
                                    >
                                      <X className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Cancel pending task
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                            </div>
                          </div>

                          {task.steps.length > 0 ? (
                            <div className="mt-3 grid gap-2 border-t pt-3">
                              {task.steps.map((step) => (
                                <div
                                  className="grid grid-cols-[minmax(0,1fr)_110px_130px] items-center gap-2"
                                  key={step.id}
                                  data-testid="task-step"
                                >
                                  <span className="truncate">{step.title}</span>
                                  <span className="truncate text-muted-foreground">
                                    {step.state}
                                  </span>
                                  <span className="truncate text-right text-muted-foreground">
                                    {step.verificationStatus}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {task.events.length > 0 ? (
                            <div className="mt-3 grid gap-1 border-t pt-3">
                              {task.events.slice(-5).map((event) => (
                                <div
                                  className="grid grid-cols-[76px_minmax(0,1fr)] gap-2 text-[10px] text-muted-foreground"
                                  key={event.id}
                                  data-testid="task-event"
                                >
                                  <time>
                                    {formatEventTime(event.createdAt)}
                                  </time>
                                  <span className="truncate">
                                    {event.type}: {event.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </article>
                      ))
                    )}
                  </div>
                </section>

                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Model Operations</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Refresh model governance from tasks"
                          className="size-8 rounded-md"
                          data-testid="tasks-refresh-model-governance"
                          disabled={sending}
                          onClick={() =>
                            void trackAction(
                              "Refresh model governance",
                              refreshModelGovernance,
                              copy.action.modelGovernanceRefreshed,
                            )
                          }
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <RefreshCw
                            className={cn(
                              "size-3.5",
                              sending && "animate-spin",
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Refresh model governance</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="divide-y divide-border border-y">
                    {modelOperations.length === 0 ? (
                      <div className="py-5 text-xs text-muted-foreground">
                        {copy.label.noModelOperations}
                      </div>
                    ) : (
                      modelOperations.slice(0, 8).map((operation) => (
                        <div
                          className="py-3 text-xs"
                          key={operation.operationId}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate font-medium">
                              {operation.modelId}
                            </span>
                            <Badge
                              className="rounded-md text-[10px]"
                              variant="outline"
                            >
                              {operation.phase}
                            </Badge>
                          </div>
                          <p className="mt-1 truncate text-[10px] text-muted-foreground">
                            {operation.capability} /{" "}
                            {operation.reasons[0] ?? "no reason"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </ScrollArea>
          ) : activeView === "plugins" ? (
            <ScrollArea className="min-h-0 flex-1">
              <div
                className="grid gap-5 px-8 py-7 lg:grid-cols-[minmax(0,1fr)_320px]"
                data-testid="plugins-view"
              >
                <section
                  className="min-w-0"
                  data-testid="plugin-management-panel"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">
                      {copy.view.plugins}
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Refresh plugins"
                          className="size-8 rounded-md"
                          data-testid="refresh-plugins"
                          disabled={sending}
                          onClick={() =>
                            void trackAction(
                              "Refresh plugins",
                              async () => {
                                const pluginsOk = await refreshPlugins();
                                const manifestsOk =
                                  await refreshLocalPluginManifestDeveloperStatus();
                                return pluginsOk && manifestsOk;
                              },
                              copy.action.pluginManagementRefreshed,
                            )
                          }
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <RefreshCw
                            className={cn(
                              "size-3.5",
                              sending && "animate-spin",
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Refresh plugins</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="grid gap-3">
                    {plugins.length === 0 ? (
                      <div className="border-y py-5 text-xs text-muted-foreground">
                        {copy.label.noPlugins}
                      </div>
                    ) : (
                      plugins.map((plugin) => (
                        <article
                          className="rounded-md border bg-card/40 p-3 text-xs"
                          data-testid="plugin-card"
                          key={plugin.manifest.id}
                        >
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {plugin.manifest.name}
                              </div>
                              <div className="mt-1 truncate text-[10px] text-muted-foreground">
                                {plugin.manifest.id}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                className={cn(
                                  "rounded-md text-[10px]",
                                  plugin.state === "enabled" && "text-success",
                                  plugin.state === "disabled" && "text-warning",
                                )}
                                variant="outline"
                              >
                                {plugin.state}
                              </Badge>
                              <Badge
                                className="rounded-md text-[10px]"
                                variant="outline"
                              >
                                {plugin.source}
                              </Badge>
                            </div>
                          </div>

                          <dl className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2">
                            <Metric
                              label={copy.label.pluginCapabilities}
                              value={String(
                                plugin.manifest.capabilities.length,
                              )}
                            />
                            <Metric
                              label={copy.label.pluginPermissions}
                              value={String(
                                plugin.manifest.permissions?.length ?? 0,
                              )}
                            />
                            <Metric
                              label={copy.label.pluginDeclaredRisk}
                              tone={
                                plugin.riskAssessment.declaredRiskTier === "low"
                                  ? "success"
                                  : "warning"
                              }
                              value={plugin.riskAssessment.declaredRiskTier}
                            />
                            <Metric
                              label={copy.label.pluginEffectiveRisk}
                              tone={
                                plugin.riskAssessment.effectiveRiskTier ===
                                "low"
                                  ? "success"
                                  : "warning"
                              }
                              value={plugin.riskAssessment.effectiveRiskTier}
                            />
                            <Metric
                              label={copy.label.pluginConfirmationPolicy}
                              tone={
                                plugin.riskAssessment.confirmationPolicy ===
                                "none"
                                  ? "success"
                                  : "warning"
                              }
                              value={plugin.riskAssessment.confirmationPolicy}
                            />
                            <Metric
                              label={copy.label.pluginExecutionMode}
                              value={plugin.executionMode}
                            />
                            <Metric
                              label={copy.label.pluginRouteSelectable}
                              tone={
                                plugin.routeSelectable ? "success" : "warning"
                              }
                              value={plugin.routeSelectable ? "YES" : "NO"}
                            />
                            <Metric
                              label={copy.label.pluginRuntime}
                              value={plugin.manifest.runtime}
                            />
                            <Metric
                              label={copy.label.pluginVersion}
                              value={plugin.manifest.version}
                            />
                            <Metric
                              label={copy.label.pluginStatePersistence}
                              tone={
                                plugin.statePersisted ? "success" : undefined
                              }
                              value={
                                plugin.statePersisted
                                  ? plugin.stateSource
                                  : "not_persisted"
                              }
                            />
                          </dl>

                          {plugin.source === "local_manifest" ? (
                            <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 text-[10px]">
                              <span className="min-w-0 truncate text-muted-foreground">
                                {copy.label.pluginStateToggle}:{" "}
                                {plugin.stateToggleAvailable
                                  ? "state_only"
                                  : "unavailable"}
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    data-testid="local-plugin-state-toggle"
                                    disabled={
                                      !plugin.stateToggleAvailable ||
                                      localPluginStateUpdatingId ===
                                        plugin.manifest.id
                                    }
                                    onClick={() => {
                                      void toggleLocalPluginState(plugin);
                                    }}
                                    size="xs"
                                    type="button"
                                    variant="outline"
                                  >
                                    {plugin.state === "enabled" ? (
                                      <X data-icon="inline-start" />
                                    ) : (
                                      <Check data-icon="inline-start" />
                                    )}
                                    {plugin.state === "enabled"
                                      ? "Disable state"
                                      : "Enable state"}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Persist local manifest state only
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : null}

                          <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                            {plugin.riskAssessment.capabilityStatuses.map(
                              (capability) => (
                                <Badge
                                  className="rounded-md text-[10px]"
                                  data-testid="plugin-capability"
                                  key={capability.capability}
                                  variant="outline"
                                >
                                  {capability.capability} /{" "}
                                  {capability.riskTier}
                                </Badge>
                              ),
                            )}
                          </div>

                          {plugin.riskAssessment.permissionStatuses.length >
                          0 ? (
                            <div className="mt-3 grid gap-2 border-t pt-3">
                              {plugin.riskAssessment.permissionStatuses.map(
                                (permission, index) => (
                                  <div
                                    className="grid grid-cols-[minmax(0,1fr)_110px_140px] items-center gap-2 text-[10px]"
                                    data-testid="plugin-permission-status"
                                    key={`${permission.category}-${index}`}
                                  >
                                    <span className="truncate font-medium">
                                      {permission.category}
                                    </span>
                                    <span
                                      className={cn(
                                        "truncate",
                                        permission.riskTier === "low"
                                          ? "text-success"
                                          : "text-warning",
                                      )}
                                    >
                                      {permission.riskTier}
                                    </span>
                                    <span className="truncate text-right text-muted-foreground">
                                      {permission.permissionState}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          ) : (
                            <div
                              className="mt-3 border-t pt-3 text-[10px] text-muted-foreground"
                              data-testid="plugin-permission-status"
                            >
                              {copy.label.pluginPermissionGate}:{" "}
                              NO_DECLARED_PERMISSIONS
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                            {plugin.riskAssessment.reasonCodes.map((reason) => (
                              <Badge
                                className="rounded-md text-[10px]"
                                data-testid="plugin-risk-reason"
                                key={reason}
                                variant="outline"
                              >
                                {reason}
                              </Badge>
                            ))}
                          </div>

                          {plugin.reasonCodes.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                              {plugin.reasonCodes.map((reason) => (
                                <Badge
                                  className="rounded-md text-[10px] text-muted-foreground"
                                  key={reason}
                                  variant="outline"
                                >
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </article>
                      ))
                    )}
                  </div>
                </section>

                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Projection</h3>
                    <Badge className="rounded-md text-[10px]" variant="outline">
                      READ ONLY
                    </Badge>
                  </div>
                  <dl
                    className="divide-y divide-border border-y text-xs"
                    data-testid="plugin-management-state-summary"
                  >
                    <Metric
                      label="BUNDLED"
                      tone="success"
                      value={String(bundledPluginCount)}
                    />
                    <Metric
                      label="LOCAL"
                      tone={
                        localManifestPluginCount > 0 ? "warning" : undefined
                      }
                      value={String(localManifestPluginCount)}
                    />
                    <Metric
                      label="ENABLED"
                      tone="success"
                      value={String(enabledPluginCount)}
                    />
                    <Metric
                      label="DISABLED"
                      tone={disabledPluginCount > 0 ? "warning" : undefined}
                      value={String(disabledPluginCount)}
                    />
                    <Metric
                      label="LOW RISK"
                      tone="success"
                      value={String(lowRiskPluginCount)}
                    />
                    <Metric
                      label="MEDIUM RISK"
                      tone={mediumRiskPluginCount > 0 ? "warning" : undefined}
                      value={String(mediumRiskPluginCount)}
                    />
                    <Metric
                      label="BLOCKED POLICY"
                      tone={
                        blockedPolicyPluginCount > 0 ? "warning" : undefined
                      }
                      value={String(blockedPolicyPluginCount)}
                    />
                  </dl>

                  <div
                    className="mt-5 border-y py-3 text-xs"
                    data-testid="plugin-management-safety"
                  >
                    <p className="text-muted-foreground">
                      {copy.label.pluginSafetySummary}
                    </p>
                    <dl className="mt-3 divide-y divide-border">
                      <Metric
                        label={copy.label.pluginThirdPartyDefault}
                        tone="warning"
                        value={
                          pluginManagementStatus?.defaultThirdPartyExecutionState ??
                          "disabled"
                        }
                      />
                      <Metric
                        label={copy.label.pluginCodeExecution}
                        tone={
                          pluginManagementStatus?.thirdPartyCodeExecuted
                            ? "warning"
                            : "success"
                        }
                        value={
                          pluginManagementStatus?.thirdPartyCodeExecuted
                            ? "YES"
                            : "NO"
                        }
                      />
                      <Metric
                        label={copy.label.pluginMarketplace}
                        tone={
                          pluginManagementStatus?.marketplaceAccessed
                            ? "warning"
                            : "success"
                        }
                        value={
                          pluginManagementStatus?.marketplaceAccessed
                            ? "YES"
                            : "NO"
                        }
                      />
                    </dl>
                  </div>

                  <div
                    className="mt-5 border-y py-3 text-xs"
                    data-testid="plugin-mcp-adapter-status"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h4 className="text-xs font-semibold">
                        MCP Adapter Alpha
                      </h4>
                      <Badge
                        className="rounded-md text-[10px]"
                        variant="outline"
                      >
                        STATUS ONLY
                      </Badge>
                    </div>
                    <dl className="divide-y divide-border">
                      <Metric
                        label="STATUS"
                        tone={
                          pluginManagementStatus?.mcpAdapter.status ===
                          "disabled"
                            ? "warning"
                            : undefined
                        }
                        value={
                          pluginManagementStatus?.mcpAdapter.status ?? "unknown"
                        }
                      />
                      <Metric
                        label="MODE"
                        value={
                          pluginManagementStatus?.mcpAdapter.mode ?? "unknown"
                        }
                      />
                      <Metric
                        label="DEFAULT EXECUTION"
                        tone="warning"
                        value={
                          pluginManagementStatus?.mcpAdapter
                            .defaultExecutionState ?? "disabled"
                        }
                      />
                      <Metric
                        label="SERVER STARTUP"
                        tone={
                          pluginManagementStatus?.mcpAdapter
                            .externalServerStartupAllowed
                            ? "warning"
                            : "success"
                        }
                        value={
                          pluginManagementStatus?.mcpAdapter
                            .externalServerStartupAllowed
                            ? "YES"
                            : "NO"
                        }
                      />
                      <Metric
                        label="TOOL EXECUTION"
                        tone={
                          pluginManagementStatus?.mcpAdapter
                            .externalToolExecutionAllowed
                            ? "warning"
                            : "success"
                        }
                        value={
                          pluginManagementStatus?.mcpAdapter
                            .externalToolExecutionAllowed
                            ? "YES"
                            : "NO"
                        }
                      />
                      <Metric
                        label="TOOL FORWARDING"
                        tone={
                          pluginManagementStatus?.mcpAdapter
                            .toolCallForwardingAllowed
                            ? "warning"
                            : "success"
                        }
                        value={
                          pluginManagementStatus?.mcpAdapter
                            .toolCallForwardingAllowed
                            ? "YES"
                            : "NO"
                        }
                      />
                      <Metric
                        label="PERMISSION LAYER"
                        tone={
                          pluginManagementStatus?.mcpAdapter
                            .permissionLayerRequired
                            ? "success"
                            : "warning"
                        }
                        value={
                          pluginManagementStatus?.mcpAdapter
                            .permissionLayerRequired
                            ? "REQUIRED"
                            : "MISSING"
                        }
                      />
                      <Metric
                        label="CREDENTIALS"
                        tone={
                          pluginManagementStatus?.mcpAdapter.credentialExposed
                            ? "warning"
                            : "success"
                        }
                        value={
                          pluginManagementStatus?.mcpAdapter.credentialExposed
                            ? "EXPOSED"
                            : "HIDDEN"
                        }
                      />
                      <Metric
                        label="RAW OUTPUT"
                        tone={
                          pluginManagementStatus?.mcpAdapter
                            .rawToolOutputPersisted
                            ? "warning"
                            : "success"
                        }
                        value={
                          pluginManagementStatus?.mcpAdapter
                            .rawToolOutputPersisted
                            ? "PERSISTED"
                            : "NO"
                        }
                      />
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                      {(
                        pluginManagementStatus?.mcpAdapter.reasonCodes ?? [
                          "MCP_ADAPTER_STATUS_PENDING",
                        ]
                      ).map((reason) => (
                        <Badge
                          className="rounded-md text-[10px] text-muted-foreground"
                          data-testid="plugin-mcp-adapter-reason"
                          key={reason}
                          variant="outline"
                        >
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div
                    className="mt-5 border-y py-3 text-xs"
                    data-testid="local-plugin-manifest-developer-status"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h4 className="text-xs font-semibold">
                        Local Manifest DX
                      </h4>
                      <Badge
                        className="rounded-md text-[10px]"
                        variant="outline"
                      >
                        LIST ONLY
                      </Badge>
                    </div>
                    <dl className="divide-y divide-border">
                      <Metric
                        label="DISCOVERY"
                        tone={
                          localManifestDiscovery?.discoveryStatus ===
                          "configured"
                            ? "success"
                            : localManifestDiscovery?.discoveryStatus ===
                                "degraded"
                              ? "warning"
                              : undefined
                        }
                        value={
                          localManifestDiscovery?.discoveryStatus ?? "unknown"
                        }
                      />
                      <Metric
                        label="ENABLED"
                        tone={
                          localManifestDiscovery?.enabled
                            ? "success"
                            : "warning"
                        }
                        value={localManifestDiscovery?.enabled ? "YES" : "NO"}
                      />
                      <Metric
                        label="CONFIGURED DIRS"
                        value={String(
                          localManifestDiscovery?.configuredDirectoryCount ?? 0,
                        )}
                      />
                      <Metric
                        label="SCANNED DIRS"
                        value={String(
                          localManifestDiscovery?.scannedDirectoryCount ?? 0,
                        )}
                      />
                      <Metric
                        label="VALID MANIFESTS"
                        tone={
                          (localManifestDiscovery?.validManifestCount ?? 0) > 0
                            ? "success"
                            : undefined
                        }
                        value={String(
                          localManifestDiscovery?.validManifestCount ?? 0,
                        )}
                      />
                      <Metric
                        label="INVALID MANIFESTS"
                        tone={
                          (localManifestDiscovery?.invalidManifestCount ?? 0) >
                          0
                            ? "warning"
                            : "success"
                        }
                        value={String(
                          localManifestDiscovery?.invalidManifestCount ?? 0,
                        )}
                      />
                      <Metric
                        label="RAW PATHS"
                        tone={
                          localManifestDiscovery?.rawPathsExposed
                            ? "warning"
                            : "success"
                        }
                        value={
                          localManifestDiscovery?.rawPathsExposed
                            ? "EXPOSED"
                            : "HIDDEN"
                        }
                      />
                      <Metric
                        label="UNKNOWN CODE"
                        tone={
                          localManifestDiscovery?.thirdPartyCodeExecuted
                            ? "warning"
                            : "success"
                        }
                        value={
                          localManifestDiscovery?.thirdPartyCodeExecuted
                            ? "EXECUTED"
                            : "NO"
                        }
                      />
                      <Metric
                        label="INSTALL/ENABLE"
                        tone={
                          localManifestDiscovery?.installOrEnableActionExposed
                            ? "warning"
                            : "success"
                        }
                        value={
                          localManifestDiscovery?.installOrEnableActionExposed
                            ? "EXPOSED"
                            : "NO"
                        }
                      />
                      <Metric
                        label="STATE TOGGLE"
                        tone={
                          localManifestDiscovery?.stateToggleActionExposed
                            ? "success"
                            : undefined
                        }
                        value={
                          localManifestDiscovery?.stateToggleActionExposed
                            ? "STATE_ONLY"
                            : "NO"
                        }
                      />
                    </dl>

                    <div className="mt-3 grid gap-2">
                      {localManifestDiscovery?.directories.length ? (
                        localManifestDiscovery.directories.map((directory) => (
                          <div
                            className="border-t pt-2"
                            data-testid="local-plugin-manifest-directory-status"
                            key={directory.directoryRef}
                          >
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                              <div className="min-w-0">
                                <div className="truncate font-medium">
                                  {directory.pluginName ??
                                    directory.directoryRef}
                                </div>
                                <div className="mt-1 truncate text-[10px] text-muted-foreground">
                                  {directory.pluginId ?? directory.directoryRef}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  className="rounded-md text-[10px]"
                                  variant="outline"
                                >
                                  {directory.directoryRef}
                                </Badge>
                                <Badge
                                  className={cn(
                                    "rounded-md text-[10px]",
                                    directory.state === "discovered"
                                      ? "text-success"
                                      : "text-warning",
                                  )}
                                  variant="outline"
                                >
                                  {directory.state}
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {directory.issueCodes.length > 0 ? (
                                directory.issueCodes.map((issue) => (
                                  <Badge
                                    className="rounded-md text-[10px] text-warning"
                                    data-testid="local-plugin-manifest-issue"
                                    key={`${directory.directoryRef}-${issue}`}
                                    variant="outline"
                                  >
                                    {issue}
                                  </Badge>
                                ))
                              ) : (
                                <Badge
                                  className="rounded-md text-[10px] text-success"
                                  data-testid="local-plugin-manifest-issue"
                                  variant="outline"
                                >
                                  MANIFEST_VALID
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="border-t pt-2 text-[10px] text-muted-foreground">
                          Local manifest directories are not visible.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
          ) : activeView === "memory" ? (
            <ScrollArea className="min-h-0 flex-1">
              <div
                className="grid gap-5 px-8 py-7 lg:grid-cols-[minmax(0,1fr)_320px]"
                data-testid="memory-view"
              >
                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">
                        User-controlled memory
                      </h3>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Route aliases and voice correction aliases are visible
                        here.
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Refresh user-controlled memories"
                          className="size-8 rounded-md"
                          data-testid="user-controlled-memory-refresh"
                          onClick={() =>
                            void handleRefreshUserControlledMemories()
                          }
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <RefreshCw className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Refresh user memory</TooltipContent>
                    </Tooltip>
                  </div>

                  <div
                    className="grid gap-3 sm:grid-cols-4 xl:grid-cols-7"
                    data-testid="user-controlled-memory-summary"
                  >
                    <div className="rounded-md border bg-card px-3 py-3">
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Total
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {userControlledMemories.length}
                      </p>
                    </div>
                    <div className="rounded-md border bg-card px-3 py-3">
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Route aliases
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {routeAliasMemoryCount}
                      </p>
                    </div>
                    <div className="rounded-md border bg-card px-3 py-3">
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Voice aliases
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {voiceAliasMemoryCount}
                      </p>
                    </div>
                    <div className="rounded-md border bg-card px-3 py-3">
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Preferences
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {preferenceMemoryCount}
                      </p>
                    </div>
                    <div
                      className="rounded-md border bg-card px-3 py-3"
                      data-testid="user-controlled-memory-low-risk-count"
                    >
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Low risk
                      </p>
                      <p className="mt-1 text-lg font-semibold text-success">
                        {lowRiskMemoryCount}
                      </p>
                    </div>
                    <div
                      className="rounded-md border bg-card px-3 py-3"
                      data-testid="user-controlled-memory-medium-risk-count"
                    >
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Medium risk
                      </p>
                      <p className="mt-1 text-lg font-semibold text-warning">
                        {mediumRiskMemoryCount}
                      </p>
                    </div>
                    <div
                      className="rounded-md border bg-card px-3 py-3"
                      data-testid="user-controlled-memory-high-risk-count"
                    >
                      <p className="text-[10px] uppercase text-muted-foreground">
                        High risk
                      </p>
                      <p className="mt-1 text-lg font-semibold text-destructive">
                        {highRiskMemoryCount}
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
                    data-testid="user-controlled-memory-filter-bar"
                  >
                    <Input
                      data-testid="user-controlled-memory-search"
                      onChange={(event) =>
                        setUserControlledMemoryQuery(event.target.value)
                      }
                      placeholder="Filter user memory"
                      value={userControlledMemoryQuery}
                    />
                    <div
                      className="flex flex-wrap gap-2"
                      data-testid="user-controlled-memory-kind-filter"
                    >
                      {userControlledMemoryFilterOptions.map((option) => (
                        <Button
                          className="h-9 rounded-md px-3 text-[11px]"
                          data-testid={`user-controlled-memory-kind-filter-${option.id}`}
                          key={option.id}
                          onClick={() =>
                            setUserControlledMemoryFilter(option.id)
                          }
                          type="button"
                          variant={
                            userControlledMemoryFilter === option.id
                              ? "default"
                              : "outline"
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    <div
                      className="flex flex-wrap gap-2 md:col-span-2"
                      data-testid="user-controlled-memory-risk-filter"
                    >
                      {userControlledMemoryRiskFilterOptions.map((option) => (
                        <Button
                          className="h-8 rounded-md px-2 text-[11px]"
                          data-testid={`user-controlled-memory-risk-filter-${option.id}`}
                          key={option.id}
                          onClick={() =>
                            setUserControlledMemoryRiskFilter(option.id)
                          }
                          type="button"
                          variant={
                            userControlledMemoryRiskFilter === option.id
                              ? "default"
                              : "outline"
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    <div
                      className="flex flex-wrap gap-2 md:col-span-2"
                      data-testid="user-controlled-memory-sort"
                    >
                      {userControlledMemorySortOptions.map((option) => (
                        <Button
                          className="h-8 rounded-md px-2 text-[11px]"
                          data-testid={`user-controlled-memory-sort-${option.id}`}
                          key={option.id}
                          onClick={() => setUserControlledMemorySort(option.id)}
                          type="button"
                          variant={
                            userControlledMemorySort === option.id
                              ? "default"
                              : "outline"
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                      <Button
                        className="h-8 rounded-md px-2 text-[11px]"
                        data-testid="user-controlled-memory-reset-controls"
                        disabled={
                          userControlledMemoryFilter === "all" &&
                          userControlledMemoryRiskFilter === "all" &&
                          userControlledMemorySort === "updated_desc" &&
                          userControlledMemoryQuery.trim().length === 0
                        }
                        onClick={() => {
                          setUserControlledMemoryFilter("all");
                          setUserControlledMemoryRiskFilter("all");
                          setUserControlledMemorySort("updated_desc");
                          setUserControlledMemoryQuery("");
                        }}
                        type="button"
                        variant="outline"
                      >
                        Reset
                      </Button>
                    </div>
                    <p
                      className="text-[11px] text-muted-foreground md:col-span-2"
                      data-testid="user-controlled-memory-filter-summary"
                    >
                      Showing {filteredUserControlledMemories.length} of{" "}
                      {userControlledMemories.length} user-controlled memories.
                    </p>
                    <div
                      className="flex flex-wrap gap-2 md:col-span-2"
                      data-testid="user-controlled-memory-active-view-criteria"
                    >
                      <Badge
                        className="rounded-md text-[10px]"
                        variant="outline"
                      >
                        Kind: {userControlledMemoryActiveKindLabel}
                      </Badge>
                      <Badge
                        className="rounded-md text-[10px]"
                        variant="outline"
                      >
                        Risk: {userControlledMemoryActiveRiskLabel}
                      </Badge>
                      <Badge
                        className="rounded-md text-[10px]"
                        variant="outline"
                      >
                        Sort: {userControlledMemoryActiveSortLabel}
                      </Badge>
                      <Badge
                        className="rounded-md text-[10px]"
                        variant="outline"
                      >
                        Search: {userControlledMemorySearchState}
                      </Badge>
                    </div>
                  </div>

                  <div
                    className="mt-5 rounded-md border bg-card p-3"
                    data-testid="user-controlled-memory-retention-session-controls"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold">
                          Retention / session controls
                        </h4>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Policy controls are visible for review; runtime
                          mutation is disabled in this L3 slice.
                        </p>
                      </div>
                      <Badge className="rounded-md text-[10px]" variant="outline">
                        {userControlledMemoryRetentionSessionControlMode}
                      </Badge>
                    </div>
                    <div
                      className="mt-3 grid gap-2 sm:grid-cols-2"
                      data-testid="user-controlled-memory-retention-session-status"
                    >
                      <Metric
                        label="Retention controls"
                        value={userControlledMemoryRetentionControlsBoundary}
                        tone="warning"
                      />
                      <Metric
                        label="Retention scope"
                        value={userControlledMemoryRetentionScope}
                        tone="success"
                      />
                      <Metric
                        label="Session-only mode"
                        value={userControlledMemorySessionOnlyBoundary}
                        tone="warning"
                      />
                      <Metric
                        label="Expiration control"
                        value={userControlledMemoryExpirationBoundary}
                        tone="warning"
                      />
                      <Metric
                        label="Recording mode"
                        value={userControlledMemoryRecordingModeBoundary}
                        tone="success"
                      />
                      <Metric
                        label="Runtime mutation"
                        value={userControlledMemoryRetentionMutationBoundary}
                        tone="success"
                      />
                    </div>
                    <div
                      className="mt-3 flex flex-wrap gap-2 border-t pt-3"
                      data-testid="user-controlled-memory-retention-controls-disabled"
                    >
                      <Button
                        className="h-8 rounded-md px-2 text-[11px]"
                        data-testid="user-controlled-memory-session-only-toggle"
                        disabled
                        type="button"
                        variant="outline"
                      >
                        Session-only memory disabled
                      </Button>
                      <Button
                        className="h-8 rounded-md px-2 text-[11px]"
                        data-testid="user-controlled-memory-expiration-control"
                        disabled
                        type="button"
                        variant="outline"
                      >
                        Expiration disabled
                      </Button>
                      <Button
                        className="h-8 rounded-md px-2 text-[11px]"
                        data-testid="user-controlled-memory-retention-mutation-control"
                        disabled
                        type="button"
                        variant="outline"
                      >
                        Retention mutation disabled
                      </Button>
                    </div>
                    <p
                      className="mt-3 text-[10px] text-muted-foreground"
                      data-testid="user-controlled-memory-retention-policy-summary"
                    >
                      Auto capture, import, restore, vector retrieval,
                      session-only writes, and expiration jobs remain disabled.
                    </p>
                  </div>

                  <div
                    className="mt-5 rounded-md border bg-card p-3"
                    data-testid="user-controlled-memory-sanitized-snapshot"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold">
                          Sanitized snapshot
                        </h4>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Exports visible user-controlled memory metadata only.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          className="h-8 rounded-md px-2 text-[11px]"
                          data-testid="user-controlled-memory-export-sanitized-snapshot"
                          onClick={handleExportUserControlledMemorySanitizedSnapshot}
                          type="button"
                          variant="outline"
                        >
                          <Download className="mr-1.5 size-3" />
                          Export snapshot
                        </Button>
                        <Button
                          className="h-8 rounded-md px-2 text-[11px]"
                          data-testid="user-controlled-memory-clear-sanitized-snapshot"
                          disabled={
                            userControlledMemorySanitizedSnapshotPreview.trim()
                              .length === 0
                          }
                          onClick={handleClearUserControlledMemorySanitizedSnapshot}
                          type="button"
                          variant="outline"
                        >
                          <X className="mr-1.5 size-3" />
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div
                      className="mt-3 flex flex-wrap gap-2"
                      data-testid="user-controlled-memory-sanitized-snapshot-policy"
                    >
                      <Badge className="rounded-md text-[10px]" variant="outline">
                        SCHEMA_V1
                      </Badge>
                      <Badge className="rounded-md text-[10px]" variant="outline">
                        SANITIZED_VISIBLE_FIELDS_ONLY
                      </Badge>
                      <Badge className="rounded-md text-[10px]" variant="outline">
                        USER_INITIATED
                      </Badge>
                      <Badge className="rounded-md text-[10px]" variant="outline">
                        IMPORT_DISABLED
                      </Badge>
                      <Badge className="rounded-md text-[10px]" variant="outline">
                        RESTORE_DISABLED
                      </Badge>
                    </div>
                    {userControlledMemorySanitizedSnapshotPreview.trim()
                      .length > 0 ? (
                      <Textarea
                        className="mt-3 min-h-40 resize-y rounded-md font-mono text-[11px]"
                        data-testid="user-controlled-memory-sanitized-snapshot-json"
                        readOnly
                        value={userControlledMemorySanitizedSnapshotPreview}
                      />
                    ) : (
                      <p
                        className="mt-3 border-t pt-3 text-[11px] text-muted-foreground"
                        data-testid="user-controlled-memory-sanitized-snapshot-empty"
                      >
                        No sanitized snapshot generated.
                      </p>
                    )}
                    <p
                      className="mt-2 text-[10px] text-muted-foreground"
                      data-testid="user-controlled-memory-sanitized-snapshot-status"
                    >
                      {userControlledMemorySanitizedSnapshotGeneratedAt
                        ? `Generated ${formatEventTime(
                            userControlledMemorySanitizedSnapshotGeneratedAt,
                          )} / ${userControlledMemories.length} records / raw hidden`
                        : "Idle / raw hidden / no import or restore action"}
                    </p>
                  </div>

                  <div
                    className="mt-5 divide-y divide-border border-y"
                    data-testid="user-controlled-memory-list"
                  >
                    {filteredUserControlledMemories.length > 0 ? (
                      filteredUserControlledMemories.map((memory) => {
                        const deletePending =
                          userControlledMemoryDeletePendingKey ===
                          formatUserControlledMemoryKey(memory);
                        return (
                        <div
                          className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                          data-testid="user-controlled-memory-record"
                          key={memory.id}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className="rounded-md text-[10px]"
                                data-testid="user-controlled-memory-kind"
                                variant="secondary"
                              >
                                {memory.kind}
                              </Badge>
                              <Badge
                                className={cn(
                                  "rounded-md text-[10px]",
                                  memory.risk === "medium"
                                    ? "text-warning"
                                    : memory.risk === "high"
                                      ? "text-destructive"
                                      : "text-success",
                                )}
                                data-testid="user-controlled-memory-risk"
                                variant="outline"
                              >
                                {memory.risk}
                              </Badge>
                              <Badge
                                className="rounded-md text-[10px]"
                                data-testid="user-controlled-memory-raw-hidden"
                                variant="outline"
                              >
                                RAW_HIDDEN
                              </Badge>
                              {memory.kind === "preference" ? (
                                <Badge
                                  className="rounded-md text-[10px]"
                                  data-testid="user-controlled-memory-provider-neutral"
                                  variant="outline"
                                >
                                  PROVIDER_NEUTRAL
                                </Badge>
                              ) : null}
                              {memory.deletable ? (
                                <Badge
                                  className="rounded-md text-[10px]"
                                  data-testid="user-controlled-memory-delete-policy"
                                  variant="outline"
                                >
                                  VIEW_DELETE
                                </Badge>
                              ) : null}
                              <Badge
                                className="rounded-md text-[10px]"
                                data-testid="user-controlled-memory-disable-policy"
                                variant="outline"
                              >
                                DISABLE_NOT_ENABLED
                              </Badge>
                            </div>
                            <p
                              className="mt-2 truncate text-sm font-semibold"
                              data-testid="user-controlled-memory-label"
                            >
                              {memory.label}
                            </p>
                            <p
                              className="mt-1 truncate text-xs text-muted-foreground"
                              data-testid="user-controlled-memory-summary-text"
                            >
                              {memory.summary}
                            </p>
                            {memory.kind === "preference" &&
                            memory.preferenceKey &&
                            memory.preferenceValue ? (
                              <p
                                className="mt-1 truncate text-[10px] uppercase text-muted-foreground"
                                data-testid="user-controlled-memory-active-preference"
                              >
                                Active policy: {memory.preferenceKey} ={" "}
                                {memory.preferenceValue}
                              </p>
                            ) : null}
                            <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                              {memory.source} / {formatEventTime(memory.updatedAt)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              className="h-8 rounded-md px-2 text-[11px]"
                              data-testid="user-controlled-memory-disable"
                              disabled
                              type="button"
                              variant="outline"
                            >
                              Disable
                            </Button>
                            <Button
                              className="h-8 rounded-md px-2 text-[11px]"
                              data-testid="user-controlled-memory-delete"
                              disabled={
                                sending || !memory.deletable || deletePending
                              }
                              onClick={() =>
                                void handleDeleteUserControlledMemory(memory)
                              }
                              type="button"
                              variant="outline"
                            >
                              <Trash2 className="mr-1.5 size-3" />
                              {deletePending ? "Deleting" : "Delete"}
                            </Button>
                          </div>
                        </div>
                        );
                      })
                    ) : (
                      <p
                        className="py-5 text-xs text-muted-foreground"
                        data-testid="user-controlled-memory-empty"
                      >
                        {userControlledMemories.length > 0
                          ? "No user-controlled memories match this filter."
                          : "No user-controlled memories have been saved yet."}
                      </p>
                    )}
                  </div>
                </section>

                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Memory boundary
                    </h3>
                    <Badge className="rounded-md text-[10px]" variant="outline">
                      USER CONTROLLED
                    </Badge>
                  </div>
                  <dl
                    className="divide-y divide-border border-y text-[11px]"
                    data-testid="user-controlled-memory-boundary"
                  >
                    <Metric
                      label="Persistence"
                      value={userControlledMemories.length > 0 ? "ON" : "IDLE"}
                      tone={
                        userControlledMemories.length > 0
                          ? "success"
                          : undefined
                      }
                    />
                    <Metric
                      label="View controls"
                      value="LOCAL ONLY"
                      tone="success"
                    />
                    <Metric
                      label="View persistence"
                      value={userControlledMemoryViewPersistenceBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Search persistence"
                      value={userControlledMemorySearchPersistenceBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Visible records"
                      value={`${filteredUserControlledMemories.length}/${userControlledMemories.length}`}
                      tone="accent"
                    />
                    <Metric
                      label="Deletable records"
                      value={String(deletableMemoryCount)}
                      tone={deletableMemoryCount > 0 ? "success" : undefined}
                    />
                    <Metric
                      label="Locked records"
                      value={String(lockedMemoryCount)}
                      tone={lockedMemoryCount > 0 ? "warning" : undefined}
                    />
                    <Metric
                      label="Provider/raw private"
                      value={
                        rawExposedMemoryCount > 0 ? "SHOWN" : "HIDDEN"
                      }
                      tone="success"
                    />
                    <Metric
                      label="Raw exposed records"
                      value={String(rawExposedMemoryCount)}
                      tone={
                        rawExposedMemoryCount > 0 ? "warning" : "success"
                      }
                    />
                    <Metric
                      label="Memory safety check"
                      value={userControlledMemorySafetyCheck}
                      tone={
                        userControlledMemorySafetyCheck === "OK"
                          ? "success"
                          : "warning"
                      }
                    />
                    <Metric
                      label="Provider-neutral records"
                      value={String(providerNeutralMemoryCount)}
                      tone={
                        providerNeutralMemoryCount > 0 ? "success" : undefined
                      }
                    />
                    <Metric
                      label="Confirmed route sources"
                      value={String(userConfirmedRouteAliasSourceCount)}
                    />
                    <Metric
                      label="Confirmed voice sources"
                      value={String(userConfirmedVoiceAliasSourceCount)}
                    />
                    <Metric
                      label="Confirmed preference sources"
                      value={String(userConfirmedPreferenceSourceCount)}
                    />
                    <Metric
                      label="Source boundary"
                      value={userControlledMemorySourceBoundaryCheck}
                      tone={
                        userControlledMemorySourceBoundaryCheck ===
                        "USER_CONFIRMED"
                          ? "success"
                          : "warning"
                      }
                    />
                    <Metric
                      label="Write policy"
                      value={userControlledMemoryWritePolicy}
                      tone="success"
                    />
                    <Metric
                      label="Delete boundary"
                      value={userControlledMemoryDeleteBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Disable controls"
                      value={userControlledMemoryDisableControlBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Disable mutation"
                      value={userControlledMemoryDisableMutationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Disabled records"
                      value={String(disabledMemoryCount)}
                      tone="success"
                    />
                    <Metric
                      label="Snapshot policy"
                      value={userControlledMemorySnapshotPolicy}
                      tone="success"
                    />
                    <Metric
                      label="Sanitized snapshot"
                      value={userControlledMemorySanitizedSnapshotBoundary}
                      tone={
                        userControlledMemorySanitizedSnapshotBoundary ===
                        "GENERATED"
                          ? "success"
                          : undefined
                      }
                    />
                    <Metric
                      label="Retention scope"
                      value={userControlledMemoryRetentionScope}
                      tone="success"
                    />
                    <Metric
                      label="Export boundary"
                      value={userControlledMemoryExportBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Import boundary"
                      value={userControlledMemoryImportBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Edit boundary"
                      value={userControlledMemoryEditBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Restore boundary"
                      value={userControlledMemoryRestoreBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Auto capture"
                      value={userControlledMemoryAutoCaptureBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Background indexing"
                      value={userControlledMemoryBackgroundIndexingBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Proactive scan"
                      value={userControlledMemoryProactiveScanBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Proactive suggestions"
                      value={userControlledMemoryProactiveSuggestionBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Proactive notifications"
                      value={userControlledMemoryProactiveNotificationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Context polling"
                      value={userControlledMemoryContextPollingBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Auto execution"
                      value={userControlledMemoryAutoExecutionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Permission override"
                      value={userControlledMemoryPermissionOverrideBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Risk downgrade"
                      value={userControlledMemoryRiskDowngradeBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Confirmation bypass"
                      value={userControlledMemoryConfirmationBypassBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Allowlist mutation"
                      value={userControlledMemoryAllowlistMutationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Workflow replay"
                      value={userControlledMemoryWorkflowReplayBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Background task creation"
                      value={userControlledMemoryBackgroundTaskCreationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Reminder scheduling"
                      value={userControlledMemoryReminderSchedulingBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Autonomous follow-up"
                      value={userControlledMemoryAutonomousFollowUpBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Outbound messaging"
                      value={userControlledMemoryOutboundMessagingBoundary}
                      tone="success"
                    />
                    <Metric
                      label="External triggers"
                      value={userControlledMemoryExternalTriggerBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Clipboard observation"
                      value={userControlledMemoryClipboardObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Keystroke observation"
                      value={userControlledMemoryKeystrokeObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Window observation"
                      value={userControlledMemoryWindowObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Screen observation"
                      value={userControlledMemoryScreenObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="File observation"
                      value={userControlledMemoryFileObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Camera observation"
                      value={userControlledMemoryCameraObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Microphone observation"
                      value={userControlledMemoryMicrophoneObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Browser history observation"
                      value={userControlledMemoryBrowserHistoryObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Location observation"
                      value={userControlledMemoryLocationObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Contacts observation"
                      value={userControlledMemoryContactsObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Calendar observation"
                      value={userControlledMemoryCalendarObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Email observation"
                      value={userControlledMemoryEmailObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Messaging observation"
                      value={userControlledMemoryMessagingObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Credential observation"
                      value={userControlledMemoryCredentialObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Payment observation"
                      value={userControlledMemoryPaymentObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Health observation"
                      value={userControlledMemoryHealthObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Biometric observation"
                      value={userControlledMemoryBiometricObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Government ID observation"
                      value={userControlledMemoryGovernmentIdObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Financial account observation"
                      value={userControlledMemoryFinancialAccountObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Legal document observation"
                      value={userControlledMemoryLegalDocumentObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Repository observation"
                      value={userControlledMemoryRepositoryObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Cloud storage observation"
                      value={userControlledMemoryCloudStorageObservationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Analytics profiling"
                      value={userControlledMemoryAnalyticsProfilingBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Vector index retention"
                      value={userControlledMemoryVectorIndexRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Plugin access"
                      value={userControlledMemoryPluginAccessBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Workflow access"
                      value={userControlledMemoryWorkflowAccessBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Teach Mode access"
                      value={userControlledMemoryTeachModeAccessBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Skin access"
                      value={userControlledMemorySkinAccessBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Pet access"
                      value={userControlledMemoryPetAccessBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Personality access"
                      value={userControlledMemoryPersonalityAccessBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Custom UI access"
                      value={userControlledMemoryCustomUiAccessBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Expiration control"
                      value={userControlledMemoryExpirationBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Session-only mode"
                      value={userControlledMemorySessionOnlyBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Provider audit"
                      value={userControlledMemoryProviderAuditBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Audit history"
                      value={userControlledMemoryAuditHistoryBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="External sharing"
                      value={userControlledMemoryExternalSharingBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Community sharing"
                      value={userControlledMemoryCommunitySharingBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Cloud sync"
                      value={userControlledMemoryCloudSyncBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Cloud account"
                      value={userControlledMemoryCloudAccountBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Provider sync"
                      value={userControlledMemoryProviderSyncBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Credential access"
                      value={userControlledMemoryCredentialAccessBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Network access"
                      value={userControlledMemoryNetworkAccessBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Model training"
                      value={userControlledMemoryModelTrainingBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Training export"
                      value={userControlledMemoryTrainingExportBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Provider personalization"
                      value={userControlledMemoryProviderPersonalizationBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Prompt injection"
                      value={userControlledMemoryPromptInjectionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Raw audio retention"
                      value={userControlledMemoryRawAudioRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Raw transcript retention"
                      value={userControlledMemoryRawTranscriptRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Screen capture retention"
                      value={userControlledMemoryScreenCaptureRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="File content retention"
                      value={userControlledMemoryFileContentRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Clipboard retention"
                      value={userControlledMemoryClipboardRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Secret retention"
                      value={userControlledMemorySecretRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Payment data retention"
                      value={userControlledMemoryPaymentDataRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Location retention"
                      value={userControlledMemoryLocationRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Biometric retention"
                      value={userControlledMemoryBiometricRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Contact retention"
                      value={userControlledMemoryContactRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Health retention"
                      value={userControlledMemoryHealthRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Calendar retention"
                      value={userControlledMemoryCalendarRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Email retention"
                      value={userControlledMemoryEmailRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Identity document retention"
                      value={userControlledMemoryIdentityDocumentRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Browser history retention"
                      value={userControlledMemoryBrowserHistoryRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Cookie retention"
                      value={userControlledMemoryCookieRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Download history retention"
                      value={userControlledMemoryDownloadHistoryRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Autofill retention"
                      value={userControlledMemoryAutofillRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Credential retention"
                      value={userControlledMemoryCredentialRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Device identifier retention"
                      value={userControlledMemoryDeviceIdentifierRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Network identifier retention"
                      value={userControlledMemoryNetworkIdentifierRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Crash dump retention"
                      value={userControlledMemoryCrashDumpRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Error report retention"
                      value={userControlledMemoryErrorReportRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Telemetry payload retention"
                      value={userControlledMemoryTelemetryPayloadRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Model cache retention"
                      value={userControlledMemoryModelCacheRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Prompt cache retention"
                      value={userControlledMemoryPromptCacheRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Task history retention"
                      value={userControlledMemoryTaskHistoryRetentionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Snapshot redaction"
                      value={userControlledMemorySnapshotRedactionBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Raw snapshot review"
                      value={userControlledMemoryRawSnapshotReviewBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Snapshot schema validation"
                      value={userControlledMemorySnapshotSchemaValidationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Snapshot provenance"
                      value={userControlledMemorySnapshotProvenanceBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Retention controls"
                      value={userControlledMemoryRetentionControlsBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Retention/session controls"
                      value={userControlledMemoryRetentionSessionControlMode}
                      tone="success"
                    />
                    <Metric
                      label="Retention mutation"
                      value={userControlledMemoryRetentionMutationBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Session writes"
                      value={userControlledMemorySessionOnlyWriteBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Expiration jobs"
                      value={userControlledMemoryExpirationJobBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Export/import"
                      value={userControlledMemoryExportImportBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Edit/restore"
                      value={userControlledMemoryEditRestoreBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Storage encryption"
                      value={userControlledMemoryStorageEncryptionBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Recording mode"
                      value={userControlledMemoryRecordingModeBoundary}
                      tone="success"
                    />
                    <Metric
                      label="Recording pause"
                      value={userControlledMemoryRecordingPauseBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Saved view presets"
                      value={userControlledMemorySavedViewPresetsBoundary}
                      tone="warning"
                    />
                    <Metric
                      label="Delete pending"
                      value={userControlledMemoryDeletePendingState}
                      tone={
                        userControlledMemoryDeletePendingKey
                          ? "warning"
                          : "success"
                      }
                    />
                    <Metric
                      label="Preference projection"
                      value={chatAnswerPreferenceProjectionOn ? "ON" : "IDLE"}
                      tone={
                        chatAnswerPreferenceProjectionOn
                          ? "success"
                          : undefined
                      }
                    />
                    <Metric
                      label="Applies to"
                      value={
                        chatAnswerPreferenceProjectionOn
                          ? "Chat Answer"
                          : "none"
                      }
                      tone={
                        chatAnswerPreferenceProjectionOn ? "accent" : undefined
                      }
                    />
                    <Metric
                      label="Route aliases"
                      value={String(routeAliasMemoryCount)}
                    />
                    <Metric
                      label="Voice aliases"
                      value={String(voiceAliasMemoryCount)}
                    />
                    <Metric
                      label="Preferences"
                      value={String(preferenceMemoryCount)}
                    />
                    <Metric
                      label="Memory count check"
                      value={userControlledMemoryCountCheck}
                      tone={
                        userControlledMemoryCountCheck === "OK"
                          ? "success"
                          : "warning"
                      }
                    />
                    <Metric
                      label="Medium risk"
                      value={String(mediumRiskMemoryCount)}
                      tone={
                        mediumRiskMemoryCount > 0 ? "warning" : undefined
                      }
                    />
                    <Metric
                      label="Vector retrieval"
                      value="DISABLED"
                      tone="warning"
                    />
                    <Metric
                      label="Provider runtime"
                      value="NOT USED"
                      tone="success"
                    />
                    <Metric
                      label="Execution"
                      value="VIEW / DELETE ONLY"
                      tone="success"
                    />
                  </dl>
                  <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                    This view lists only records that the user explicitly
                    confirmed. Deletion flows through Core IPC and the existing
                    repository boundary.
                  </p>
                </section>
              </div>
            </ScrollArea>
          ) : activeView === "voice" ? (
            <ScrollArea className="min-h-0 flex-1">
              <div
                className="grid gap-5 px-8 py-7 lg:grid-cols-[minmax(0,1fr)_320px]"
                data-testid="voice-view"
              >
                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Voice</h3>
                    <Badge className="rounded-md text-[10px]" variant="outline">
                      {snapshot?.voice.permission ?? "unknown"}
                    </Badge>
                  </div>
                  <div className="rounded-md border bg-card px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Button
                        aria-label="Push to talk from voice view"
                        aria-pressed={ptt.active}
                        className={cn(
                          "size-11 rounded-md",
                          ptt.active &&
                            "bg-destructive text-destructive-foreground",
                        )}
                        data-testid="voice-view-push-to-talk"
                        disabled={!coreOnline || textOnlyAcceptanceMode}
                        onContextMenu={(event) => event.preventDefault()}
                        onPointerCancel={() => {
                          if (textOnlyAcceptanceMode) return;
                          void ptt.stop("user-cancel");
                        }}
                        onPointerDown={(event) => {
                          if (textOnlyAcceptanceMode) return;
                          event.currentTarget.setPointerCapture(
                            event.pointerId,
                          );
                          void ptt.start();
                        }}
                        onPointerUp={(event) => {
                          if (textOnlyAcceptanceMode) return;
                          if (
                            event.currentTarget.hasPointerCapture(
                              event.pointerId,
                            )
                          ) {
                            event.currentTarget.releasePointerCapture(
                              event.pointerId,
                            );
                          }
                          void ptt.stop("release");
                        }}
                        size="icon-lg"
                        type="button"
                        variant={ptt.active ? "default" : "outline"}
                      >
                        {textOnlyAcceptanceMode ? (
                          <MicOff className="size-4" />
                        ) : (
                          <Mic2 className="size-4" />
                        )}
                      </Button>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          {snapshot?.voice.mode ?? "manual"} /{" "}
                          {snapshot?.voice.state ?? "idle"}
                        </p>
                        <p className="mt-1 truncate text-sm">
                          {voiceTranscript || copy.label.noTranscript}
                        </p>
                        {voiceLanguageMismatch && (
                          <p
                            className="mt-1 text-[11px] leading-4 text-warning"
                            data-testid="voice-language-warning"
                          >
                            {copy.label.voiceLanguageMismatch}
                          </p>
                        )}
                        {voiceCaptureNotice && (
                          <p
                            className="mt-1 text-[11px] leading-4 text-warning"
                            data-testid="voice-capture-notice"
                          >
                            {voiceCaptureNotice}
                          </p>
                        )}
                        {voiceCaptureErrorDetail && (
                          <p
                            className="mt-1 text-[11px] leading-4 text-muted-foreground"
                            data-testid="voice-capture-error-detail"
                          >
                            {voiceCaptureErrorDetail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-5 rounded-md border bg-card px-4 py-4"
                    data-testid="voice-command-aliases"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">
                          Voice command aliases
                        </h3>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {voiceCommandAliases.length} saved
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label="Refresh voice command aliases"
                            className="size-8 rounded-md"
                            data-testid="voice-command-alias-refresh"
                            onClick={() =>
                              void handleRefreshVoiceCommandAliases()
                            }
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                          >
                            <RefreshCw className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Refresh aliases</TooltipContent>
                      </Tooltip>
                    </div>
                    {voiceCommandAliases.length > 0 ? (
                      <div className="divide-y divide-border border-y">
                        {voiceCommandAliases.map((alias) => (
                          <div
                            className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                            data-testid="voice-command-alias"
                            key={alias.id}
                          >
                            <div className="min-w-0">
                              <p
                                className="truncate text-xs font-semibold"
                                data-testid="voice-command-alias-raw"
                              >
                                {alias.rawAlias}
                              </p>
                              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                                {alias.intent} /{" "}
                                {formatVoiceCorrectionSlots(alias.slots)}
                              </p>
                              <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                                {alias.confirmedAt}
                              </p>
                            </div>
                            <Button
                              className="h-8 rounded-md px-2 text-[11px]"
                              data-testid="voice-command-alias-delete"
                              disabled={sending}
                              onClick={() =>
                                void handleDeleteVoiceCommandAlias(alias.id)
                              }
                              type="button"
                              variant="outline"
                            >
                              <Trash2 className="mr-1.5 size-3" />
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className="border-t pt-3 text-xs text-muted-foreground"
                        data-testid="voice-command-alias-empty"
                      >
                        No confirmed voice aliases yet.
                      </p>
                    )}
                  </div>
                  <div
                    className="mt-5 rounded-md border bg-card px-4 py-4"
                    data-testid="user-route-aliases"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">
                          User route aliases
                        </h3>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {userRouteAliases.length} saved
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label="Refresh user route aliases"
                            className="size-8 rounded-md"
                            data-testid="user-route-alias-refresh"
                            onClick={() => void handleRefreshUserRouteAliases()}
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                          >
                            <RefreshCw className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Refresh route aliases</TooltipContent>
                      </Tooltip>
                    </div>
                    {userRouteAliases.length > 0 ? (
                      <div className="divide-y divide-border border-y">
                        {userRouteAliases.map((alias) => (
                          <div
                            className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                            data-testid="user-route-alias"
                            key={alias.id}
                          >
                            <div className="min-w-0">
                              <p
                                className="truncate text-xs font-semibold"
                                data-testid="user-route-alias-label"
                              >
                                {alias.label}
                              </p>
                              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                                {alias.intent} / {alias.targetHostname}
                              </p>
                              <p
                                className="mt-1 truncate text-[11px] text-muted-foreground"
                                data-testid="user-route-alias-url"
                              >
                                {alias.targetUrl}
                              </p>
                            </div>
                            <Button
                              className="h-8 rounded-md px-2 text-[11px]"
                              data-testid="user-route-alias-delete"
                              disabled={sending}
                              onClick={() =>
                                void handleDeleteUserRouteAlias(alias.id)
                              }
                              type="button"
                              variant="outline"
                            >
                              <Trash2 className="mr-1.5 size-3" />
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className="border-t pt-3 text-xs text-muted-foreground"
                        data-testid="user-route-alias-empty"
                      >
                        No confirmed route aliases yet.
                      </p>
                    )}
                  </div>
                </section>

                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {copy.label.diagnostics}
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Open voice settings from voice view"
                          className="size-8 rounded-md"
                          data-testid="voice-view-settings"
                          disabled={textOnlyAcceptanceMode}
                          onClick={() =>
                            textOnlyAcceptanceMode
                              ? undefined
                              : void trackAction(
                                  "Open voice settings",
                                  openVoiceSettings,
                                  copy.action.voiceSettingsOpened,
                                )
                          }
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <Settings className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Voice service settings</TooltipContent>
                    </Tooltip>
                  </div>
                  <dl className="divide-y divide-border border-y text-[11px]">
                    <Metric
                      label={copy.label.voiceService}
                      value={
                        voiceServiceStatus?.configured
                          ? copy.label.voiceServiceConfigured
                          : copy.label.voiceServiceMissing
                      }
                      tone={
                        voiceServiceStatus?.configured ? "success" : "warning"
                      }
                    />
                    <Metric
                      label={copy.label.voiceRecognitionLanguage}
                      value={voiceServiceLanguage}
                      tone={voiceLanguageMismatch ? "warning" : undefined}
                    />
                    <Metric
                      label={copy.metric.micCapture}
                      value={ptt.state}
                      tone={
                        ptt.active
                          ? "success"
                          : ptt.captureNotice
                            ? "warning"
                            : undefined
                      }
                    />
                    <Metric
                      label={copy.metric.voiceEngine}
                      value={snapshot?.voice.state ?? "disabled"}
                      tone="warning"
                    />
                    <Metric
                      label={copy.metric.micPermission}
                      value={snapshot?.voice.permission ?? "unknown"}
                    />
                    <Metric
                      label={copy.metric.voiceFrames}
                      value={String(ptt.audioDiagnostics.framesSent)}
                    />
                    <Metric label={copy.metric.voiceRms} value={voiceRms} />
                    <Metric label={copy.metric.voicePeak} value={voicePeak} />
                    <Metric
                      label={copy.metric.session}
                      value={snapshot?.voice.sessionId?.slice(-12) ?? "idle"}
                    />
                  </dl>
                </section>
              </div>
            </ScrollArea>
          ) : activeView === "settings" ? (
            <ScrollArea className="min-h-0 flex-1">
              <div
                className="grid gap-5 px-8 py-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
                data-testid="settings-view"
              >
                <section
                  className="min-w-0 lg:col-span-2"
                  data-testid="language-settings"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {copy.settings.language}
                    </h3>
                    <Badge className="rounded-md text-[10px]" variant="outline">
                      {copy.settings.languageCurrent}
                    </Badge>
                  </div>
                  <div className="flex w-fit rounded-md border bg-card p-1">
                    <Button
                      aria-pressed={uiLanguage === "zh"}
                      className="h-8 rounded-md px-3 text-xs"
                      data-testid="language-zh"
                      onClick={() => handleSelectLanguage("zh")}
                      type="button"
                      variant={uiLanguage === "zh" ? "secondary" : "ghost"}
                    >
                      {copy.settings.chinese}
                    </Button>
                    <Button
                      aria-pressed={uiLanguage === "en"}
                      className="h-8 rounded-md px-3 text-xs"
                      data-testid="language-en"
                      onClick={() => handleSelectLanguage("en")}
                      type="button"
                      variant={uiLanguage === "en" ? "secondary" : "ghost"}
                    >
                      {copy.settings.english}
                    </Button>
                  </div>
                </section>

                <section
                  className="min-w-0 lg:col-span-2"
                  data-testid="skin-theme-settings"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Palette className="size-4 text-primary" />
                      {copy.settings.theme}
                    </h3>
                    <Badge
                      className="rounded-md text-[10px]"
                      data-testid="skin-theme-current"
                      variant="outline"
                    >
                      {copy.settings.themeCurrent}: {activeSkinTheme.label}
                    </Badge>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    {builtInSkinThemes.map((theme) => (
                      <Button
                        aria-pressed={skinTheme === theme.id}
                        className={cn(
                          "h-auto min-h-[76px] justify-start rounded-md px-3 py-2 text-left",
                          skinTheme === theme.id &&
                            "border-primary text-primary",
                        )}
                        data-testid={`skin-theme-${theme.id}`}
                        key={theme.id}
                        onClick={() => handleSelectSkinTheme(theme.id)}
                        type="button"
                        variant={skinTheme === theme.id ? "secondary" : "ghost"}
                      >
                        <span className="flex min-w-0 flex-col gap-2">
                          <span className="flex items-center gap-1.5">
                            {theme.swatches.map((color) => (
                              <span
                                aria-hidden="true"
                                className="size-3 rounded-sm border border-border"
                                key={color}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </span>
                          <span className="text-xs font-semibold">
                            {theme.id === "signal"
                              ? copy.settings.signalTheme
                              : theme.id === "harbor"
                                ? copy.settings.harborTheme
                                : copy.settings.emberTheme}
                          </span>
                          <span className="text-[10px] leading-4 text-muted-foreground">
                            {theme.description}
                          </span>
                        </span>
                      </Button>
                    ))}
                  </div>
                  <dl
                    className="mt-3 divide-y divide-border border-y text-[11px]"
                    data-testid="skin-theme-safety"
                  >
                    <Metric
                      label={copy.settings.themeSchema}
                      value="builtin_theme_schema_v1"
                      tone="accent"
                    />
                    <Metric
                      label={copy.settings.themeStorage}
                      value={THEME_STORAGE_KEY}
                      tone="success"
                    />
                    <Metric
                      label={copy.settings.themeRecovery}
                      value="signal"
                      tone="success"
                    />
                    <Metric
                      label={copy.settings.themeSafe}
                      value="yes"
                      tone="success"
                    />
                  </dl>
                </section>

                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {copy.settings.general}
                    </h3>
                    <Badge className="rounded-md text-[10px]" variant="outline">
                      {copy.label.local}
                    </Badge>
                  </div>
                  <dl className="divide-y divide-border border-y text-[11px]">
                    <Metric
                      label={copy.metric.coreHealth}
                      value={snapshot?.health ?? connection}
                      tone="success"
                    />
                    <Metric
                      label={copy.metric.runtimeMode}
                      value={runtimeMode}
                      tone="accent"
                    />
                    <Metric
                      label={copy.metric.transport}
                      value="IPC"
                      tone="accent"
                    />
                    <Metric
                      label={copy.metric.inspector}
                      value={
                        inspectorOpen ? copy.value.shown : copy.value.hidden
                      }
                    />
                    <Metric
                      label={copy.metric.sequence}
                      value={String(snapshot?.sequenceId ?? 0).padStart(4, "0")}
                    />
                    <Metric
                      label={copy.label.ttsService}
                      value={
                        ttsServiceStatus?.configured
                          ? copy.label.voiceServiceConfigured
                          : copy.label.voiceServiceMissing
                      }
                      tone={
                        ttsServiceStatus?.configured ? "success" : "warning"
                      }
                    />
                  </dl>
                  <label className="mt-3 flex items-center justify-between gap-3 border-y py-2 text-[11px]">
                    <span className="min-w-0">
                      <span className="block font-medium">{alphaCopy.tts}</span>
                      <span className="mt-0.5 block text-muted-foreground">
                        {localTtsEnabled
                          ? alphaCopy.ttsEnabled
                          : alphaCopy.ttsDisabled}
                      </span>
                    </span>
                    <input
                      aria-label={alphaCopy.tts}
                      checked={localTtsEnabled}
                      className="size-4 accent-primary"
                      data-testid="settings-local-tts-toggle"
                      onChange={(event) => {
                        setLocalTtsEnabled(event.target.checked);
                        if (!event.target.checked) stopLocalTts();
                        if (event.target.checked) {
                          setLocalTtsStatus(
                            brainResult?.dispatchStatus === "completed"
                              ? "eligible"
                              : "disabled",
                          );
                        }
                      }}
                      type="checkbox"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      className="h-8 rounded-md px-2.5 text-xs"
                      data-testid="settings-toggle-inspector"
                      onClick={() => {
                        setInspectorOpen((open) => !open);
                        notifyAction(
                          inspectorOpen
                            ? copy.action.inspectorHidden
                            : copy.action.inspectorShown,
                          "accent",
                        );
                      }}
                      type="button"
                      variant="outline"
                    >
                      <PanelLeft className="size-3.5" />
                      {copy.label.inspector}
                    </Button>
                    <Button
                      className="h-8 rounded-md px-2.5 text-xs"
                      data-testid="settings-probe-core"
                      disabled={sending}
                      onClick={() =>
                        void trackAction("Probe Core", async () => {
                          const probed = await probeCore();
                          const refreshedCapabilities =
                            await refreshCapabilities();
                          const refreshedMemory = await refreshMemoryHealth();
                          const refreshedModels =
                            await refreshModelGovernance();
                          return (
                            probed &&
                            refreshedCapabilities &&
                            refreshedMemory &&
                            refreshedModels
                          );
                        })
                      }
                      type="button"
                      variant="outline"
                    >
                      <RefreshCw
                        className={cn("size-3.5", sending && "animate-spin")}
                      />
                      {copy.label.probe}
                    </Button>
                  </div>
                </section>

                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {copy.settings.commandRouter}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        className="rounded-md text-[10px]"
                        variant={
                          commandRouterProductModeEnabled
                            ? "default"
                            : "outline"
                        }
                      >
                        {commandRouterProductModeEnabled
                          ? "control on"
                          : "default off"}
                      </Badge>
                      <Button
                        aria-label="Refresh Command Router product mode"
                        className="size-8 rounded-md"
                        data-testid="settings-refresh-command-router-product-mode"
                        disabled={sending}
                        onClick={() =>
                          void trackAction(
                            "Refresh Command Router mode",
                            refreshCommandRouterProductModeStatus,
                            copy.action.commandRouterProductModeRefreshed,
                          )
                        }
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <RefreshCw
                          className={cn("size-3.5", sending && "animate-spin")}
                        />
                      </Button>
                    </div>
                  </div>
                  <dl className="divide-y divide-border border-y text-[11px]">
                    <Metric
                      label="Provider"
                      value={
                        commandRouterProductModeStatus?.providerId ??
                        "intent-router.deterministic.rules"
                      }
                      tone="accent"
                    />
                    <Metric
                      label="Mode"
                      value={
                        commandRouterProductModeStatus?.mode.replaceAll(
                          "_",
                          " ",
                        ) ?? "fixture only"
                      }
                      tone="success"
                    />
                    <Metric
                      label="Runtime"
                      value={commandRouterProductModeSummary}
                      tone={
                        commandRouterProductModeEnabled ? "accent" : "warning"
                      }
                    />
                    <Metric
                      label="Direct action"
                      value={commandRouterDirectActionStatus}
                      tone="warning"
                    />
                    <Metric
                      label="Qwen runtime"
                      value={
                        commandRouterProductModeStatus?.realQwenRuntimeEnabled
                          ? "enabled"
                          : "disabled"
                      }
                      tone="warning"
                    />
                    <Metric
                      label="Chat fallback"
                      value={
                        commandRouterProductModeStatus?.chatAnswerFallbackPreserved ===
                        false
                          ? "not preserved"
                          : "preserved"
                      }
                      tone="success"
                    />
                  </dl>
                  <div
                    className="border-b py-3 text-[11px]"
                    data-testid="settings-command-router-qwen-binding"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">Qwen Fast Router</span>
                      <Badge
                        className="rounded-md text-[10px]"
                        data-testid="settings-command-router-qwen-status"
                        variant="outline"
                      >
                        {commandRouterQwenBinding?.status ?? "disabled"}
                      </Badge>
                    </div>
                    <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Metric
                        label="Provider"
                        value={
                          commandRouterQwenBinding?.providerId ??
                          "intent-router.qwen3-0.6b"
                        }
                        tone="accent"
                      />
                      <Metric
                        label="Binding"
                        value={
                          commandRouterQwenBinding?.mode.replaceAll("_", " ") ??
                          "no runtime status only"
                        }
                        tone="warning"
                      />
                      <Metric
                        label="Product routing"
                        value={
                          commandRouterQwenBinding?.productRoutingEnabled
                            ? "enabled"
                            : "off"
                        }
                        tone="warning"
                      />
                      <Metric
                        label="Conversation route"
                        value={
                          commandRouterQwenBinding
                            ?.conversationSurfaceProductRoute?.status ??
                          "disabled"
                        }
                        tone="warning"
                      />
                      <Metric
                        label="Route selectable"
                        value={
                          commandRouterQwenBinding
                            ?.conversationSurfaceProductRoute
                            ?.qwenRouteSelectable
                            ? "selectable"
                            : "fixture"
                        }
                        tone="success"
                      />
                      <Metric
                        label="Persistent opt-in"
                        value={
                          commandRouterQwenBinding
                            ?.conversationSurfaceProductRoute?.persistentOptIn
                            ?.status ?? "disabled"
                        }
                        tone="warning"
                      />
                      <Metric
                        label="Session scope"
                        value={
                          commandRouterQwenBinding
                            ?.conversationSurfaceProductRoute?.persistentOptIn
                            ?.limitedProductSessionOnly
                            ? "limited"
                            : "blocked"
                        }
                        tone="success"
                      />
                      <Metric
                        label="Runtime access"
                        value={
                          commandRouterQwenBinding?.runtimeAccessed
                            ? "accessed"
                            : "not accessed"
                        }
                        tone="success"
                      />
                      <Metric
                        label="Artifact access"
                        value={
                          commandRouterQwenBinding?.artifactAccessed
                            ? "accessed"
                            : "not accessed"
                        }
                        tone="success"
                      />
                      <Metric
                        label="Cache change"
                        value={
                          commandRouterQwenBinding?.persistentCacheChanged
                            ? "changed"
                            : "none"
                        }
                        tone="success"
                      />
                      <Metric
                        label="Activation"
                        value={
                          commandRouterQwenActivation?.status.replaceAll(
                            "_",
                            " ",
                          ) ?? "disabled"
                        }
                        tone={
                          commandRouterQwenActivation?.status === "ready"
                            ? "accent"
                            : "warning"
                        }
                      />
                      <Metric
                        label="Rollback"
                        value={
                          commandRouterQwenActivation?.rollbackState.replaceAll(
                            "_",
                            " ",
                          ) ?? "not needed"
                        }
                        tone="success"
                      />
                    </dl>
                    <div
                      className="mt-2 border-t pt-2"
                      data-testid="settings-command-router-qwen-activation"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>Activation policy</span>
                        <Badge
                          className="rounded-md text-[10px]"
                          variant="outline"
                        >
                          {commandRouterQwenActivation?.policyId ??
                            "qwen-product-routing.activation.default-off.v1"}
                        </Badge>
                        <Badge
                          className="rounded-md text-[10px]"
                          variant="outline"
                        >
                          product route off
                        </Badge>
                        <Badge
                          className="rounded-md text-[10px]"
                          variant="outline"
                        >
                          fixture rollback
                        </Badge>
                      </div>
                      <div
                        className="mt-2 flex flex-wrap gap-1.5"
                        data-testid="settings-command-router-qwen-activation-gates"
                      >
                        {commandRouterQwenActivationGateLabels.map((label) => (
                          <span
                            className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            key={label}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div
                      className="mt-2 flex flex-wrap gap-1.5"
                      data-testid="settings-command-router-qwen-gates"
                    >
                      {commandRouterQwenGateLabels.map((label) => (
                        <span
                          className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          key={label}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    <div
                      className="mt-3 border-t pt-3"
                      data-testid="settings-command-router-qwen-runtime-control"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium">
                            Retained Qwen session control
                          </div>
                          <div
                            className="mt-1 text-[10px] text-muted-foreground"
                            data-testid="settings-command-router-qwen-runtime-control-status"
                          >
                            {qwenRuntimeControlSummary} /{" "}
                            {qwenRuntimeControlSession} /{" "}
                            {qwenRuntimeControlHelper}
                          </div>
                        </div>
                        <Button
                          aria-label="Refresh Qwen runtime control"
                          className="size-8 rounded-md"
                          data-testid="settings-refresh-qwen-runtime-control"
                          disabled={sending}
                          onClick={() =>
                            void trackAction(
                              "Refresh Qwen runtime control",
                              refreshQwenRuntimeControlStatus,
                            )
                          }
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <RefreshCw
                            className={cn(
                              "size-3.5",
                              sending && "animate-spin",
                            )}
                          />
                        </Button>
                      </div>
                      <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Metric
                          label="Session"
                          value={
                            qwenRuntimeControlStatus?.retainedSessionId ??
                            "qwen-retained-product-session-2026-08-10"
                          }
                          tone={
                            qwenRuntimeControlStatus?.retainedSessionAvailable
                              ? "success"
                              : "warning"
                          }
                        />
                        <Metric
                          label="Route source"
                          value={qwenRuntimeControlRoute}
                          tone="accent"
                        />
                        <Metric
                          label="Fallback"
                          value={
                            qwenRuntimeControlStatus?.fallbackRouteSource ??
                            "intent-router.deterministic.rules"
                          }
                          tone="success"
                        />
                        <Metric
                          label="Route limit"
                          value={String(
                            qwenRuntimeControlStatus?.routeRequestLimit ?? 3,
                          )}
                          tone="warning"
                        />
                        <Metric
                          label="Route count"
                          value={String(
                            qwenRuntimeControlStatus?.routeRequestCount ?? 0,
                          )}
                          tone="warning"
                        />
                        <Metric
                          label="Helper starts"
                          value={String(
                            qwenRuntimeControlStatus?.helperStartCount ?? 0,
                          )}
                          tone="warning"
                        />
                        <Metric
                          label="Gen probes"
                          value={String(
                            qwenRuntimeControlStatus?.generationPortReadinessProbeCount ??
                              0,
                          )}
                          tone="warning"
                        />
                        <Metric
                          label="Shutdown"
                          value={
                            qwenRuntimeControlStatus?.helperShutdownVerified ===
                            false
                              ? "pending"
                              : "verified"
                          }
                          tone={
                            qwenRuntimeControlStatus?.helperShutdownVerified ===
                            false
                              ? "warning"
                              : "success"
                          }
                        />
                        <Metric
                          label="Browser/URL"
                          value={
                            qwenRuntimeControlStatus?.browserUrlOpeningEnabled
                              ? "enabled"
                              : "blocked"
                          }
                          tone="success"
                        />
                        <Metric
                          label="VS Code"
                          value={
                            qwenRuntimeControlStatus?.vsCodeBlocked
                              ? "blocked"
                              : "allowed"
                          }
                          tone="success"
                        />
                      </dl>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Button
                          aria-label="Start Qwen runtime control"
                          className="h-8 rounded-md px-2 text-[11px]"
                          data-testid="settings-command-router-qwen-runtime-control-start"
                          disabled={
                            sending ||
                            qwenRuntimeControlStatus?.controls.start !==
                              "available"
                          }
                          onClick={() =>
                            void handleQwenRuntimeControlAction("start")
                          }
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Play className="size-3.5" />
                          Start
                        </Button>
                        <Button
                          aria-label="Stop Qwen runtime control"
                          className="h-8 rounded-md px-2 text-[11px]"
                          data-testid="settings-command-router-qwen-runtime-control-stop"
                          disabled={
                            sending ||
                            qwenRuntimeControlStatus?.controls.stop !==
                              "available"
                          }
                          onClick={() =>
                            void handleQwenRuntimeControlAction("stop")
                          }
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Square className="size-3.5" />
                          Stop
                        </Button>
                        <Button
                          aria-label="Rollback Qwen runtime control"
                          className="h-8 rounded-md px-2 text-[11px]"
                          data-testid="settings-command-router-qwen-runtime-control-rollback"
                          disabled={
                            sending ||
                            qwenRuntimeControlStatus?.controls.rollback !==
                              "available"
                          }
                          onClick={() =>
                            void handleQwenRuntimeControlAction("rollback")
                          }
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <RotateCcw className="size-3.5" />
                          Rollback
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge
                          className="rounded-md text-[10px]"
                          variant="outline"
                        >
                          default off
                        </Badge>
                        <Badge
                          className="rounded-md text-[10px]"
                          variant="outline"
                        >
                          explicit opt-in
                        </Badge>
                        <Badge
                          className="rounded-md text-[10px]"
                          variant="outline"
                        >
                          fixture fallback
                        </Badge>
                        <Badge
                          className="rounded-md text-[10px]"
                          variant="outline"
                        >
                          Notepad/Calculator only
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <label className="mt-3 flex items-center justify-between gap-3 border-y py-2 text-[11px]">
                    <span className="min-w-0">
                      <span className="block font-medium">
                        Deterministic router control
                      </span>
                      <span className="mt-0.5 block text-muted-foreground">
                        {commandRouterProductModeEnabled
                          ? "Control enabled; text and voice commands are routed through deterministic fixture projection only."
                          : "Default off; existing Chat Answer and BrainCommand behavior is preserved."}
                      </span>
                    </span>
                    <input
                      aria-label="Command Router product mode control"
                      checked={commandRouterProductModeEnabled}
                      className="size-4 accent-primary"
                      data-testid="settings-command-router-product-mode-toggle"
                      onChange={(event) =>
                        void trackAction(
                          "Change Command Router mode",
                          async () =>
                            setCommandRouterProductModeEnabled(
                              event.target.checked,
                            ),
                          copy.action.commandRouterProductModeChanged,
                        )
                      }
                      type="checkbox"
                    />
                  </label>
                  <p
                    className="mt-2 text-[11px] leading-4 text-muted-foreground"
                    data-testid="settings-command-router-product-mode-notice"
                  >
                    Fixture-only surface: deterministic intent routing remains
                    active; Qwen is status-only with no runtime, helper,
                    artifact, cache, or provider call, and no browser execution.
                    Approved local app launches remain Notepad/Calculator only
                    after confirmation.
                  </p>
                </section>

                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {copy.settings.chatAnswer}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        className="rounded-md text-[10px]"
                        variant={
                          chatAnswerProductModeEnabled ? "default" : "outline"
                        }
                      >
                        {chatAnswerProductModeEnabled
                          ? "control on"
                          : "default off"}
                      </Badge>
                      <Button
                        aria-label="Refresh Chat Answer product mode"
                        className="size-8 rounded-md"
                        data-testid="settings-refresh-chat-answer-product-mode"
                        disabled={sending}
                        onClick={() =>
                          void trackAction(
                            "Refresh Chat Answer mode",
                            refreshChatAnswerProductModeStatus,
                            copy.action.chatAnswerProductModeRefreshed,
                          )
                        }
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <RefreshCw
                          className={cn("size-3.5", sending && "animate-spin")}
                        />
                      </Button>
                    </div>
                  </div>
                  <dl className="divide-y divide-border border-y text-[11px]">
                    <Metric
                      label="Provider"
                      value={
                        chatAnswerProductModeStatus?.providerId ?? "deepseek"
                      }
                      tone="accent"
                    />
                    <Metric
                      label="Profile"
                      value={
                        chatAnswerProductModeStatus?.profileId ??
                        "deepseek.v4-flash.compact_json_object_256"
                      }
                    />
                    <Metric
                      label="Credential"
                      value={
                        chatAnswerCredentialConfigured
                          ? "configured"
                          : "missing"
                      }
                      tone={
                        chatAnswerCredentialConfigured ? "success" : "warning"
                      }
                    />
                    <Metric
                      label="Runtime"
                      value={chatAnswerProductModeSummary}
                      tone={chatAnswerProductModeEnabled ? "accent" : "warning"}
                    />
                    <Metric
                      label="Secure store"
                      value={
                        chatAnswerSecureStoreAvailable
                          ? "available"
                          : "unavailable"
                      }
                      tone={
                        chatAnswerSecureStoreAvailable ? "success" : "warning"
                      }
                    />
                    <Metric
                      label="Fallback"
                      value={
                        chatAnswerProductModeStatus?.fallbackPreserved === false
                          ? "not preserved"
                          : "preserved"
                      }
                      tone="success"
                    />
                  </dl>
                  <label className="mt-3 flex items-center justify-between gap-3 border-y py-2 text-[11px]">
                    <span className="min-w-0">
                      <span className="block font-medium">
                        Provider-backed answer control
                      </span>
                      <span className="mt-0.5 block text-muted-foreground">
                        {chatAnswerProductModeEnabled
                          ? chatAnswerRealRuntimeArmed
                            ? "Control enabled; real runtime armed for one approved fixed text call."
                            : "Control enabled; real runtime remains locked until credential readiness is confirmed."
                          : "Default off; typed answers continue through the existing safe path."}
                      </span>
                    </span>
                    <input
                      aria-label="Provider-backed Chat Answer control"
                      checked={chatAnswerProductModeEnabled}
                      className="size-4 accent-primary"
                      data-testid="settings-chat-answer-product-mode-toggle"
                      onChange={(event) =>
                        void trackAction(
                          "Change Chat Answer mode",
                          async () =>
                            setChatAnswerProductModeEnabled(
                              event.target.checked,
                            ),
                          copy.action.chatAnswerProductModeChanged,
                        )
                      }
                      type="checkbox"
                    />
                  </label>
                  <p
                    className="mt-2 text-[11px] leading-4 text-muted-foreground"
                    data-testid="settings-chat-answer-product-mode-notice"
                  >
                    Controlled surface: default off; one approved provider call
                    only after explicit enablement and credential readiness; no
                    planner, no Memory vector retrieval, and no direct action
                    behavior.
                  </p>
                </section>

                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {copy.settings.voice}
                    </h3>
                    <Badge className="rounded-md text-[10px]" variant="outline">
                      {snapshot?.voice.permission ?? "unknown"}
                    </Badge>
                  </div>
                  <dl className="divide-y divide-border border-y text-[11px]">
                    <Metric
                      label={copy.label.voiceService}
                      value={
                        voiceServiceStatus?.configured
                          ? copy.label.voiceServiceConfigured
                          : copy.label.voiceServiceMissing
                      }
                      tone={
                        voiceServiceStatus?.configured ? "success" : "warning"
                      }
                    />
                    <Metric
                      label={copy.label.voiceRecognitionLanguage}
                      value={voiceServiceLanguage}
                      tone={voiceLanguageMismatch ? "warning" : undefined}
                    />
                    <Metric
                      label={copy.metric.micCapture}
                      value={ptt.state}
                      tone={
                        ptt.active
                          ? "success"
                          : ptt.captureNotice
                            ? "warning"
                            : undefined
                      }
                    />
                    <Metric
                      label={copy.metric.voiceEngine}
                      value={snapshot?.voice.state ?? "disabled"}
                      tone="warning"
                    />
                    <Metric
                      label={copy.metric.voiceMode}
                      value={snapshot?.voice.mode ?? "manual"}
                    />
                    <Metric
                      label={copy.metric.micPermission}
                      value={snapshot?.voice.permission ?? "unknown"}
                    />
                    <Metric
                      label={copy.metric.voiceFrames}
                      value={String(ptt.audioDiagnostics.framesSent)}
                    />
                  </dl>
                  {voiceLanguageMismatch && (
                    <p
                      className="mt-2 text-[11px] leading-4 text-warning"
                      data-testid="settings-voice-language-warning"
                    >
                      {copy.label.voiceLanguageMismatch}
                    </p>
                  )}
                  {voiceCaptureNotice && (
                    <p
                      className="mt-2 text-[11px] leading-4 text-warning"
                      data-testid="settings-voice-capture-notice"
                    >
                      {voiceCaptureNotice}
                    </p>
                  )}
                  {voiceCaptureErrorDetail && (
                    <p
                      className="mt-2 text-[11px] leading-4 text-muted-foreground"
                      data-testid="settings-voice-capture-error-detail"
                    >
                      {voiceCaptureErrorDetail}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      className="h-8 rounded-md px-2.5 text-xs"
                      data-testid="settings-open-voice-settings"
                      disabled={textOnlyAcceptanceMode}
                      onClick={() =>
                        textOnlyAcceptanceMode
                          ? undefined
                          : void trackAction(
                              "Open voice settings",
                              openVoiceSettings,
                              copy.action.voiceSettingsOpened,
                            )
                      }
                      type="button"
                      variant="secondary"
                    >
                      <Settings className="size-3.5" />
                      {copy.settings.voiceSettings}
                    </Button>
                    <Button
                      className="h-8 rounded-md px-2.5 text-xs"
                      data-testid="settings-open-tts-settings"
                      disabled={textOnlyAcceptanceMode}
                      onClick={() =>
                        textOnlyAcceptanceMode
                          ? undefined
                          : void trackAction(
                              "Open TTS settings",
                              openTtsSettings,
                              uiLanguage === "zh"
                                ? "TTS 设置已打开"
                                : "TTS settings opened",
                            )
                      }
                      type="button"
                      variant="secondary"
                    >
                      <Volume2 className="size-3.5" />
                      {uiLanguage === "zh" ? "TTS 设置" : "TTS Settings"}
                    </Button>
                  </div>
                </section>

                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {copy.settings.memoryAlpha}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <Button
                        aria-label="Disable Memory alpha from settings"
                        className="size-8 rounded-md"
                        data-testid="settings-disable-memory-alpha"
                        disabled={sending}
                        onClick={() => void handleDisableMemoryAlpha()}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <X className="size-3.5" />
                      </Button>
                      <Button
                        aria-label="Refresh Memory alpha from settings"
                        className="size-8 rounded-md"
                        data-testid="settings-refresh-memory-alpha"
                        disabled={sending}
                        onClick={() =>
                          void trackAction(
                            "Refresh Memory alpha",
                            refreshMemoryAlphaStatus,
                            copy.action.memoryAlphaRefreshed,
                          )
                        }
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <RefreshCw
                          className={cn("size-3.5", sending && "animate-spin")}
                        />
                      </Button>
                    </div>
                  </div>
                  <dl className="divide-y divide-border border-y text-[11px]">
                    <Metric
                      label={copy.metric.alphaState}
                      value={memoryAlpha?.state ?? "unknown"}
                    />
                    <Metric
                      label={copy.metric.tracked}
                      value={`${memoryAlpha?.trackedMessageCount ?? 0}/${memoryAlpha?.maxMessageCount ?? 5}`}
                    />
                    <Metric
                      label={copy.metric.rollback}
                      value={memoryAlpha?.rollbackStatus ?? "not_started"}
                    />
                    <Metric
                      label={copy.metric.reason}
                      value={memoryAlphaReason}
                    />
                  </dl>
                </section>

                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {copy.settings.modelGovernance}
                    </h3>
                    <Button
                      aria-label="Refresh model governance from settings"
                      className="size-8 rounded-md"
                      data-testid="settings-refresh-model-governance"
                      disabled={sending}
                      onClick={() =>
                        void trackAction(
                          "Refresh model governance",
                          refreshModelGovernance,
                          copy.action.modelGovernanceRefreshed,
                        )
                      }
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <RefreshCw
                        className={cn("size-3.5", sending && "animate-spin")}
                      />
                    </Button>
                  </div>
                  <dl className="divide-y divide-border border-y text-[11px]">
                    <Metric
                      label={copy.metric.providers}
                      value={String(inferenceProviders.length)}
                    />
                    <Metric
                      label={copy.metric.available}
                      value={String(availableInferenceProviderCount)}
                      tone="success"
                    />
                    <Metric
                      label={copy.metric.required}
                      value={String(requiredProviderConfigurationCount)}
                      tone="warning"
                    />
                    <Metric
                      label={copy.metric.localModels}
                      value={String(modelInventory.length)}
                    />
                    <Metric
                      label={copy.metric.operations}
                      value={String(modelOperations.length)}
                    />
                  </dl>
                </section>
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div
                className="grid gap-5 px-8 py-7 lg:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]"
                data-testid="activity-view"
              >
                <section
                  className="min-w-0"
                  data-testid="activity-memory-alpha-spine"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {copy.settings.memoryAlpha}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <Button
                        aria-label="Disable Memory alpha from activity"
                        className="size-8 rounded-md"
                        disabled={sending}
                        onClick={() => void handleDisableMemoryAlpha()}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <X className="size-3.5" />
                      </Button>
                      <Button
                        aria-label="Refresh Memory alpha from activity"
                        className="size-8 rounded-md"
                        disabled={sending}
                        onClick={() =>
                          void trackAction(
                            "Refresh Memory alpha",
                            refreshMemoryAlphaStatus,
                            copy.action.memoryAlphaRefreshed,
                          )
                        }
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <RefreshCw
                          className={cn("size-3.5", sending && "animate-spin")}
                        />
                      </Button>
                    </div>
                  </div>
                  <dl className="divide-y divide-border border-y text-[11px]">
                    <Metric
                      label={copy.metric.alphaState}
                      value={memoryAlpha?.state ?? "unknown"}
                    />
                    <Metric
                      label={copy.metric.tracked}
                      value={`${memoryAlpha?.trackedMessageCount ?? 0}/${memoryAlpha?.maxMessageCount ?? 5}`}
                    />
                    <Metric
                      label={copy.metric.rollback}
                      value={memoryAlpha?.rollbackStatus ?? "not_started"}
                    />
                    <Metric
                      label={copy.metric.reason}
                      value={memoryAlphaReason}
                    />
                    <Metric
                      label={copy.metric.probe}
                      value={memoryAlphaProbeSummary}
                    />
                    <Metric
                      label={copy.metric.failure}
                      value={memoryAlphaRecallProbe?.failureClass ?? "none"}
                    />
                  </dl>
                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      aria-label="Activity Memory alpha recall probe"
                      className="h-8 rounded-md bg-input/45 px-2.5 text-xs"
                      data-testid="activity-memory-alpha-probe-input"
                      onChange={(event) =>
                        setMemoryAlphaProbeDraft(event.target.value)
                      }
                      placeholder={copy.label.recallProbePlaceholder}
                      value={memoryAlphaProbeDraft}
                    />
                    <Button
                      aria-label="Run activity Memory alpha recall probe"
                      className="size-8 rounded-md"
                      disabled={sending}
                      onClick={() => void handleMemoryAlphaProbe()}
                      size="icon-sm"
                      type="button"
                      variant="secondary"
                    >
                      <Activity className="size-3.5" />
                    </Button>
                  </div>
                </section>

                <section className="min-w-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {copy.label.recentEvents}
                    </h3>
                    <Button
                      aria-label="Probe Core from activity"
                      className="size-8 rounded-md"
                      disabled={sending}
                      onClick={() =>
                        void trackAction("Probe Core", async () => {
                          const probed = await probeCore();
                          const refreshedCapabilities =
                            await refreshCapabilities();
                          const refreshedMemory = await refreshMemoryHealth();
                          const refreshedModels =
                            await refreshModelGovernance();
                          return (
                            probed &&
                            refreshedCapabilities &&
                            refreshedMemory &&
                            refreshedModels
                          );
                        })
                      }
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <RefreshCw
                        className={cn("size-3.5", sending && "animate-spin")}
                      />
                    </Button>
                  </div>
                  <div
                    className="space-y-4 border-y py-3"
                    data-testid="activity-event-list"
                  >
                    {recentEvents.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {copy.label.waitingForCoreEvents}
                      </p>
                    ) : (
                      recentEvents.map((envelope) => (
                        <div className="flex gap-2.5" key={envelope.eventId}>
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-[11px] font-medium">
                                {envelope.event.type}
                              </p>
                              <time className="shrink-0 text-[10px] text-muted-foreground">
                                {formatEventTime(envelope.createdAt)}
                              </time>
                            </div>
                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                              {eventLabel(envelope)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </ScrollArea>
          )}

          {activeView === "conversation" &&
            (commandRouterRealLaunchEligible ||
              commandRouterLocalAppLaunchResult) && (
              <div
                className="shrink-0 border-t bg-card px-6 py-3"
                data-testid="command-router-real-local-app-launch"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {commandRouterRealLaunchEligible && (
                    <Button
                      aria-label={`Confirm launch ${commandRouterRealLaunchTarget}`}
                      className="h-8 rounded-md px-2.5 text-xs"
                      data-testid="confirm-command-router-local-app-launch"
                      disabled={sending}
                      onClick={() =>
                        void handleConfirmCommandRouterLocalAppLaunch()
                      }
                      type="button"
                      variant="secondary"
                    >
                      <ExternalLink className="size-3.5" />
                      Confirm launch {commandRouterRealLaunchTarget}
                    </Button>
                  )}
                  <span className="text-[10px] leading-4 text-muted-foreground">
                    Low-risk known apps run through Task Runtime with visible
                    status; unclear targets still require confirmation.
                  </span>
                </div>
                {commandRouterLocalAppLaunchResult && (
                  <p
                    className="mt-2 text-[11px] leading-5 text-muted-foreground"
                    data-testid="command-router-local-app-launch-result"
                  >
                    Real launch: {commandRouterLocalAppLaunchResult.status} /{" "}
                    {commandRouterLocalAppLaunchResult.label} /{" "}
                    {commandRouterLocalAppLaunchResult.reasonCode}
                  </p>
                )}
              </div>
            )}

          <form
            className="flex h-[88px] shrink-0 items-center gap-2.5 border-t bg-card px-6"
            onSubmit={handleSubmit}
          >
            <Input
              aria-label="Command"
              className="h-10 rounded-md bg-input/45 px-3.5"
              data-testid="command-input"
              onChange={(event) => setDraft(event.target.value)}
              placeholder={copy.label.commandPlaceholder}
              value={draft}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={copy.label.sendCommand}
                  className="size-10 rounded-md"
                  data-testid="send-command"
                  disabled={sending}
                  size="icon-lg"
                  type="submit"
                >
                  <Send className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copy.label.sendCommand}</TooltipContent>
            </Tooltip>
          </form>
        </main>

        {inspectorOpen && (
          <aside
            className="min-h-0 border-l bg-card max-[1080px]:hidden"
            data-testid="runtime-inspector"
          >
            <div className="flex h-full min-h-0 flex-col px-[18px] py-5">
              <SystemStatusPanel
                actions={{
                  probeCore: () => {
                    void trackAction("Probe Core", async () => {
                      const probed = await probeCore();
                      const refreshedCapabilities = await refreshCapabilities();
                      const refreshedMemory = await refreshMemoryHealth();
                      const refreshedModels = await refreshModelGovernance();
                      return (
                        probed &&
                        refreshedCapabilities &&
                        refreshedMemory &&
                        refreshedModels
                      );
                    });
                  },
                }}
                copy={copy}
                sending={sending}
                viewModel={{
                  accelerationBackends,
                  connection,
                  gpuCount,
                  memoryAlphaState: memoryAlpha?.state,
                  runtimeMode,
                  snapshot,
                  voiceFramesSent: ptt.audioDiagnostics.framesSent,
                  voicePeak,
                  voiceRms,
                }}
              />

              <div className="mt-4 shrink-0" data-testid="model-governance">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {copy.settings.modelGovernance}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Run fixture reranker"
                          className="size-8 rounded-md"
                          data-testid="run-fixture-reranker"
                          disabled={sending}
                          onClick={() => void handleRunFixtureRerankProbe()}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <ListTodo className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Run fixture reranker</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Run fixture OCR"
                          className="size-8 rounded-md"
                          data-testid="run-fixture-ocr"
                          disabled={sending}
                          onClick={() => void handleRunFixtureOcrProbe()}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <Activity className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Run fixture OCR</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Run fixture intent routing"
                          className="size-8 rounded-md"
                          data-testid="run-fixture-intent"
                          disabled={sending}
                          onClick={() => void handleRunFixtureIntentProbe()}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <MessageSquare className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Run fixture intent routing
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Run fixture embedding"
                          className="size-8 rounded-md"
                          data-testid="run-fixture-embedding"
                          disabled={sending}
                          onClick={() => void handleRunFixtureEmbeddingProbe()}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <Bot className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Run fixture embedding</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Refresh model governance"
                          className="size-8 rounded-md"
                          data-testid="refresh-model-governance"
                          disabled={sending}
                          onClick={() =>
                            void trackAction(
                              "Refresh model governance",
                              refreshModelGovernance,
                              copy.action.modelGovernanceRefreshed,
                            )
                          }
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <RefreshCw
                            className={cn(
                              "size-3.5",
                              sending && "animate-spin",
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Refresh model governance</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <dl className="divide-y divide-border border-y text-[11px]">
                  <Metric
                    label={copy.metric.candidates}
                    value={String(modelCandidates.length)}
                  />
                  <Metric
                    label={copy.metric.manifests}
                    value={String(modelManifests.length)}
                  />
                  <Metric
                    label={copy.metric.providers}
                    value={String(inferenceProviders.length)}
                  />
                  <Metric
                    label={copy.metric.available}
                    value={String(availableInferenceProviderCount)}
                    tone="success"
                  />
                  <Metric
                    label={copy.metric.fixture}
                    value={fixtureEmbeddingProvider?.status ?? "unconfigured"}
                    tone={fixtureEmbeddingAvailable ? "success" : "warning"}
                  />
                  <Metric
                    label={copy.metric.intentRouter}
                    value={intentRouterProvider?.status ?? "unconfigured"}
                    tone={intentRouterAvailable ? "success" : "warning"}
                  />
                  <Metric
                    label={copy.metric.ocr}
                    value={ocrProvider?.status ?? "unconfigured"}
                    tone={ocrProviderAvailable ? "success" : "warning"}
                  />
                  <Metric
                    label={copy.metric.reranker}
                    value={rerankerProvider?.status ?? "unconfigured"}
                    tone={rerankerProviderAvailable ? "success" : "warning"}
                  />
                  <Metric
                    label={copy.metric.required}
                    value={String(requiredProviderConfigurationCount)}
                    tone="warning"
                  />
                  <Metric
                    label={copy.metric.installable}
                    value={String(installableModelCount)}
                    tone="success"
                  />
                  <Metric
                    label={copy.metric.blocked}
                    value={String(blockedModelCount)}
                    tone="warning"
                  />
                  <Metric
                    label={copy.metric.operations}
                    value={String(modelOperations.length)}
                  />
                  <Metric
                    label={copy.metric.activeOps}
                    value={String(activeModelOperationCount)}
                    tone="warning"
                  />
                  <Metric
                    label={copy.metric.resourceMem}
                    value={resourceMemoryGiB}
                  />
                  <Metric
                    label={copy.metric.resourceVram}
                    value={resourceVramGiB}
                  />
                  <Metric
                    label={copy.metric.resourceLeases}
                    value={String(resourceDiagnostics?.activeLeaseCount ?? 0)}
                  />
                  <Metric
                    label={copy.metric.localModels}
                    value={String(modelInventory.length)}
                  />
                  <Metric
                    label={copy.metric.downloadable}
                    value={String(downloadableCandidateCount)}
                  />
                  <Metric
                    label={copy.metric.loaded}
                    value={String(loadedModelCount)}
                    tone="accent"
                  />
                  <Metric
                    label={copy.metric.vectorDims}
                    value={
                      fixtureEmbeddingProbe
                        ? String(fixtureEmbeddingProbe.dimensions)
                        : "idle"
                    }
                  />
                  <Metric
                    label={copy.metric.vectors}
                    value={
                      fixtureEmbeddingProbe
                        ? String(fixtureEmbeddingProbe.vectorCount)
                        : "idle"
                    }
                  />
                  <Metric
                    label={copy.metric.inference}
                    value={fixtureEmbeddingProbe?.operationPhase ?? "idle"}
                    tone={
                      fixtureEmbeddingProbe?.operationPhase === "completed"
                        ? "success"
                        : undefined
                    }
                  />
                  <Metric
                    label={copy.metric.intent}
                    value={fixtureIntentProbe?.intent ?? "idle"}
                  />
                  <Metric
                    label={copy.metric.route}
                    value={fixtureIntentProbe?.operationPhase ?? "idle"}
                    tone={
                      fixtureIntentProbe?.operationPhase === "completed"
                        ? "success"
                        : undefined
                    }
                  />
                  <Metric
                    label={copy.metric.ocrText}
                    value={fixtureOcrProbe?.text ?? "idle"}
                  />
                  <Metric
                    label={copy.metric.ocrBlocks}
                    value={
                      fixtureOcrProbe
                        ? String(fixtureOcrProbe.blockCount)
                        : "idle"
                    }
                  />
                  <Metric
                    label={copy.metric.ocrOps}
                    value={fixtureOcrProbe?.operationPhase ?? "idle"}
                    tone={
                      fixtureOcrProbe?.operationPhase === "completed"
                        ? "success"
                        : undefined
                    }
                  />
                  <Metric
                    label={copy.metric.topDoc}
                    value={fixtureRerankProbe?.topDocumentId ?? "idle"}
                  />
                  <Metric
                    label={copy.metric.reranked}
                    value={
                      fixtureRerankProbe
                        ? String(fixtureRerankProbe.resultCount)
                        : "idle"
                    }
                  />
                  <Metric
                    label={copy.metric.rerankOps}
                    value={fixtureRerankProbe?.operationPhase ?? "idle"}
                    tone={
                      fixtureRerankProbe?.operationPhase === "completed"
                        ? "success"
                        : undefined
                    }
                  />
                </dl>
              </div>

              <div className="mt-4 shrink-0" data-testid="memory-alpha-spine">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {copy.settings.memoryAlpha}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Disable Memory alpha"
                          className="size-8 rounded-md"
                          data-testid="disable-memory-alpha"
                          disabled={sending}
                          onClick={() => void handleDisableMemoryAlpha()}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Disable Memory alpha</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Refresh Memory alpha"
                          className="size-8 rounded-md"
                          data-testid="refresh-memory-alpha"
                          disabled={sending}
                          onClick={() =>
                            void trackAction(
                              "Refresh Memory alpha",
                              refreshMemoryAlphaStatus,
                              copy.action.memoryAlphaRefreshed,
                            )
                          }
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <RefreshCw
                            className={cn(
                              "size-3.5",
                              sending && "animate-spin",
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Refresh Memory alpha</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <dl className="divide-y divide-border border-y text-[11px]">
                  <Metric
                    label={copy.metric.alphaState}
                    value={memoryAlpha?.state ?? "unknown"}
                    tone={
                      memoryAlpha?.state === "active"
                        ? "success"
                        : memoryAlpha?.state === "degraded"
                          ? "warning"
                          : undefined
                    }
                  />
                  <Metric
                    label={copy.metric.tracked}
                    value={`${memoryAlpha?.trackedMessageCount ?? 0}/${memoryAlpha?.maxMessageCount ?? 5}`}
                  />
                  <Metric
                    label={copy.metric.rollback}
                    value={memoryAlpha?.rollbackStatus ?? "not_started"}
                    tone={
                      memoryAlpha?.rollbackStatus === "degraded"
                        ? "warning"
                        : memoryAlpha?.rollbackStatus === "passed"
                          ? "success"
                          : undefined
                    }
                  />
                  <Metric
                    label={copy.metric.deleted}
                    value={String(memoryAlpha?.rollbackDeletedCount ?? 0)}
                  />
                  <Metric
                    label={copy.metric.reason}
                    value={memoryAlphaReason}
                  />
                  <Metric
                    label={copy.metric.probe}
                    value={memoryAlphaProbeSummary}
                  />
                  <Metric
                    label={copy.metric.probeDims}
                    value={String(memoryAlphaRecallProbe?.queryDimensions ?? 0)}
                  />
                  <Metric
                    label={copy.metric.failure}
                    value={memoryAlphaRecallProbe?.failureClass ?? "none"}
                    tone={
                      memoryAlphaRecallProbe?.failureClass
                        ? "warning"
                        : undefined
                    }
                  />
                </dl>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    aria-label="Memory alpha recall probe"
                    className="h-8 rounded-md bg-input/45 px-2.5 text-[11px]"
                    data-testid="memory-alpha-probe-input"
                    onChange={(event) =>
                      setMemoryAlphaProbeDraft(event.target.value)
                    }
                    placeholder={copy.label.recallProbePlaceholder}
                    value={memoryAlphaProbeDraft}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="Run Memory alpha recall probe"
                        className="size-8 rounded-md"
                        data-testid="run-memory-alpha-probe"
                        disabled={sending}
                        onClick={() => void handleMemoryAlphaProbe()}
                        size="icon-sm"
                        type="button"
                        variant="secondary"
                      >
                        <Activity className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Run Memory alpha recall probe
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="mt-4 shrink-0">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {copy.label.memorySnapshot}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Export memory snapshot"
                          className="size-8 rounded-md"
                          data-testid="export-memory-snapshot"
                          disabled={sending}
                          onClick={() => void handleExportMemorySnapshot()}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export memory snapshot</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Import memory snapshot"
                          className="size-8 rounded-md"
                          data-testid="import-memory-snapshot"
                          disabled={sending}
                          onClick={() => void handleImportMemorySnapshot()}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <Upload className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Import memory snapshot</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <Textarea
                  aria-label={copy.label.memorySnapshotPlaceholder}
                  className="h-[96px] resize-none rounded-md bg-input/45 font-mono text-[10px] leading-4"
                  data-testid="memory-snapshot-json"
                  onChange={(event) =>
                    setMemorySnapshotDraft(event.target.value)
                  }
                  placeholder={copy.label.memorySnapshotPlaceholder}
                  spellCheck={false}
                  value={memorySnapshotDraft}
                />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {copy.label.recentEvents}
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  {recentEvents.length} {copy.label.events}
                </span>
              </div>

              <ScrollArea className="mt-4 min-h-0 flex-1">
                <div className="space-y-4 pr-3" data-testid="event-list">
                  {recentEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {copy.label.waitingForCoreEvents}
                    </p>
                  ) : (
                    recentEvents.map((envelope) => (
                      <div className="flex gap-2.5" key={envelope.eventId}>
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[11px] font-medium">
                              {envelope.event.type}
                            </p>
                            <time className="shrink-0 text-[10px] text-muted-foreground">
                              {formatEventTime(envelope.createdAt)}
                            </time>
                          </div>
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {eventLabel(envelope)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <Separator className="my-4" />
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {coreOnline ? (
                  <CheckCircle2 className="size-3.5 text-success" />
                ) : (
                  <CircleAlert className="size-3.5 text-warning" />
                )}
                <span data-testid="core-instance">
                  {snapshot?.coreInstanceId
                    ? `instance ${snapshot.coreInstanceId.slice(-12)}`
                    : "awaiting core instance"}
                </span>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
