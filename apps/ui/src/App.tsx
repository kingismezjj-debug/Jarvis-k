import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Check,
  ExternalLink,
  Mic2,
  MicOff,
  PanelLeft,
  Pencil,
  Plug,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
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
  formatActionError,
  formatEventTime,
  formatGib,
  formatPttCommandError,
  isSecondaryVoiceStopError,
} from "@/app/formatters";
import { persistUiLanguage, readInitialLanguage } from "@/app/ui-language";
import { usePluginCenter } from "@/app/use-plugin-center";
import { useUserControlledMemoryView } from "@/app/use-user-controlled-memory-view";
import {
  buildSanitizedUserControlledMemorySnapshot,
  formatUserControlledMemoryKey,
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
import { ActivityView } from "@/features/activity/activity-view";
import { AppearanceSettingsPanel } from "@/features/appearance/appearance-settings-panel";
import { ConversationComposer } from "@/features/conversation/conversation-composer";
import { ConversationPanel } from "@/features/conversation/conversation-panel";
import { ConversationTabs } from "@/features/conversation/conversation-tabs";
import { MemoryBoundaryPanel } from "@/features/memory/memory-boundary-panel";
import { buildMemoryBoundaryViewModel } from "@/features/memory/memory-boundary-view-model";
import { MemoryCenter } from "@/features/memory/memory-center";
import { ModelOperationList } from "@/features/model-management/model-operation-list";
import { PluginManagementView } from "@/features/plugins/plugin-management-view";
import { RuntimeInspectorPanel } from "@/features/runtime-inspector/runtime-inspector-panel";
import { ChatAnswerSettingsPanel } from "@/features/settings/chat-answer-settings-panel";
import { CommandRouterSettingsPanel } from "@/features/settings/command-router-settings-panel";
import { ModelGovernanceSettingsPanel } from "@/features/settings/model-governance-settings-panel";
import { SettingsGeneralPanel } from "@/features/settings/settings-general-panel";
import { VoiceSettingsPanel } from "@/features/settings/voice-settings-panel";
import { TaskTimeline } from "@/features/tasks/task-timeline";
import { VoiceControlPanel } from "@/features/voice/voice-control-panel";
import {
  buildVoiceDiagnostics,
  formatVoiceAudioPercent,
  selectVoiceLanguageMismatch,
  selectVoiceServiceLanguage,
} from "@/features/voice/voice-view-model";
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
  const [skinTheme, setSkinTheme] = useState<SkinThemeId>(readInitialSkinTheme);
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
  const memoryBoundaryViewModel = buildMemoryBoundaryViewModel({
    allowlistMutation: userControlledMemoryAllowlistMutationBoundary,
    analyticsProfiling: userControlledMemoryAnalyticsProfilingBoundary,
    auditHistory: userControlledMemoryAuditHistoryBoundary,
    autoCapture: userControlledMemoryAutoCaptureBoundary,
    autoExecution: userControlledMemoryAutoExecutionBoundary,
    autofillRetention: userControlledMemoryAutofillRetentionBoundary,
    autonomousFollowUp: userControlledMemoryAutonomousFollowUpBoundary,
    backgroundIndexing: userControlledMemoryBackgroundIndexingBoundary,
    backgroundTaskCreation: userControlledMemoryBackgroundTaskCreationBoundary,
    biometricObservation: userControlledMemoryBiometricObservationBoundary,
    biometricRetention: userControlledMemoryBiometricRetentionBoundary,
    browserHistoryObservation:
      userControlledMemoryBrowserHistoryObservationBoundary,
    browserHistoryRetention:
      userControlledMemoryBrowserHistoryRetentionBoundary,
    calendarObservation: userControlledMemoryCalendarObservationBoundary,
    calendarRetention: userControlledMemoryCalendarRetentionBoundary,
    cameraObservation: userControlledMemoryCameraObservationBoundary,
    clipboardObservation: userControlledMemoryClipboardObservationBoundary,
    clipboardRetention: userControlledMemoryClipboardRetentionBoundary,
    cloudAccount: userControlledMemoryCloudAccountBoundary,
    cloudStorageObservation:
      userControlledMemoryCloudStorageObservationBoundary,
    cloudSync: userControlledMemoryCloudSyncBoundary,
    communitySharing: userControlledMemoryCommunitySharingBoundary,
    confirmationBypass: userControlledMemoryConfirmationBypassBoundary,
    confirmedPreferenceSourceCount: userConfirmedPreferenceSourceCount,
    confirmedRouteSourceCount: userConfirmedRouteAliasSourceCount,
    confirmedVoiceSourceCount: userConfirmedVoiceAliasSourceCount,
    contactRetention: userControlledMemoryContactRetentionBoundary,
    contactsObservation: userControlledMemoryContactsObservationBoundary,
    contextPolling: userControlledMemoryContextPollingBoundary,
    cookieRetention: userControlledMemoryCookieRetentionBoundary,
    crashDumpRetention: userControlledMemoryCrashDumpRetentionBoundary,
    credentialAccess: userControlledMemoryCredentialAccessBoundary,
    credentialObservation: userControlledMemoryCredentialObservationBoundary,
    credentialRetention: userControlledMemoryCredentialRetentionBoundary,
    customUiAccess: userControlledMemoryCustomUiAccessBoundary,
    deletableRecordCount: deletableMemoryCount,
    deleteBoundary: userControlledMemoryDeleteBoundary,
    deletePending: Boolean(userControlledMemoryDeletePendingKey),
    deletePendingState: userControlledMemoryDeletePendingState,
    deviceIdentifierRetention:
      userControlledMemoryDeviceIdentifierRetentionBoundary,
    disabledRecordCount: disabledMemoryCount,
    disableControls: userControlledMemoryDisableControlBoundary,
    disableMutation: userControlledMemoryDisableMutationBoundary,
    downloadHistoryRetention:
      userControlledMemoryDownloadHistoryRetentionBoundary,
    editBoundary: userControlledMemoryEditBoundary,
    editRestore: userControlledMemoryEditRestoreBoundary,
    emailObservation: userControlledMemoryEmailObservationBoundary,
    emailRetention: userControlledMemoryEmailRetentionBoundary,
    errorReportRetention: userControlledMemoryErrorReportRetentionBoundary,
    expirationControl: userControlledMemoryExpirationBoundary,
    expirationJobs: userControlledMemoryExpirationJobBoundary,
    exportBoundary: userControlledMemoryExportBoundary,
    exportImport: userControlledMemoryExportImportBoundary,
    externalSharing: userControlledMemoryExternalSharingBoundary,
    externalTriggers: userControlledMemoryExternalTriggerBoundary,
    fileContentRetention: userControlledMemoryFileContentRetentionBoundary,
    fileObservation: userControlledMemoryFileObservationBoundary,
    financialAccountObservation:
      userControlledMemoryFinancialAccountObservationBoundary,
    governmentIdObservation:
      userControlledMemoryGovernmentIdObservationBoundary,
    healthObservation: userControlledMemoryHealthObservationBoundary,
    healthRetention: userControlledMemoryHealthRetentionBoundary,
    identityDocumentRetention:
      userControlledMemoryIdentityDocumentRetentionBoundary,
    importBoundary: userControlledMemoryImportBoundary,
    keystrokeObservation: userControlledMemoryKeystrokeObservationBoundary,
    legalDocumentObservation:
      userControlledMemoryLegalDocumentObservationBoundary,
    locationObservation: userControlledMemoryLocationObservationBoundary,
    locationRetention: userControlledMemoryLocationRetentionBoundary,
    lockedRecordCount: lockedMemoryCount,
    mediumRiskMemoryCount,
    memoryCountCheck: userControlledMemoryCountCheck,
    messagingObservation: userControlledMemoryMessagingObservationBoundary,
    microphoneObservation: userControlledMemoryMicrophoneObservationBoundary,
    modelCacheRetention: userControlledMemoryModelCacheRetentionBoundary,
    modelTraining: userControlledMemoryModelTrainingBoundary,
    networkAccess: userControlledMemoryNetworkAccessBoundary,
    networkIdentifierRetention:
      userControlledMemoryNetworkIdentifierRetentionBoundary,
    outboundMessaging: userControlledMemoryOutboundMessagingBoundary,
    paymentDataRetention: userControlledMemoryPaymentDataRetentionBoundary,
    paymentObservation: userControlledMemoryPaymentObservationBoundary,
    permissionOverride: userControlledMemoryPermissionOverrideBoundary,
    personalityAccess: userControlledMemoryPersonalityAccessBoundary,
    petAccess: userControlledMemoryPetAccessBoundary,
    pluginAccess: userControlledMemoryPluginAccessBoundary,
    preferenceMemoryCount,
    preferenceProjectionOn: chatAnswerPreferenceProjectionOn,
    proactiveNotifications: userControlledMemoryProactiveNotificationBoundary,
    proactiveScan: userControlledMemoryProactiveScanBoundary,
    proactiveSuggestions: userControlledMemoryProactiveSuggestionBoundary,
    promptCacheRetention: userControlledMemoryPromptCacheRetentionBoundary,
    promptInjection: userControlledMemoryPromptInjectionBoundary,
    providerAudit: userControlledMemoryProviderAuditBoundary,
    providerNeutralRecordCount: providerNeutralMemoryCount,
    providerPersonalization:
      userControlledMemoryProviderPersonalizationBoundary,
    providerSync: userControlledMemoryProviderSyncBoundary,
    rawAudioRetention: userControlledMemoryRawAudioRetentionBoundary,
    rawExposedRecordCount: rawExposedMemoryCount,
    rawSnapshotReview: userControlledMemoryRawSnapshotReviewBoundary,
    rawTranscriptRetention: userControlledMemoryRawTranscriptRetentionBoundary,
    recordCount: userControlledMemories.length,
    recordingMode: userControlledMemoryRecordingModeBoundary,
    recordingPause: userControlledMemoryRecordingPauseBoundary,
    reminderScheduling: userControlledMemoryReminderSchedulingBoundary,
    repositoryObservation: userControlledMemoryRepositoryObservationBoundary,
    restoreBoundary: userControlledMemoryRestoreBoundary,
    retentionControls: userControlledMemoryRetentionControlsBoundary,
    retentionMutation: userControlledMemoryRetentionMutationBoundary,
    retentionScope: userControlledMemoryRetentionScope,
    retentionSessionControls: userControlledMemoryRetentionSessionControlMode,
    riskDowngrade: userControlledMemoryRiskDowngradeBoundary,
    routeAliasMemoryCount,
    safetyCheck: userControlledMemorySafetyCheck,
    sanitizedSnapshot: userControlledMemorySanitizedSnapshotBoundary,
    savedViewPresets: userControlledMemorySavedViewPresetsBoundary,
    screenCaptureRetention: userControlledMemoryScreenCaptureRetentionBoundary,
    screenObservation: userControlledMemoryScreenObservationBoundary,
    searchPersistence: userControlledMemorySearchPersistenceBoundary,
    secretRetention: userControlledMemorySecretRetentionBoundary,
    sessionOnlyMode: userControlledMemorySessionOnlyBoundary,
    sessionWrites: userControlledMemorySessionOnlyWriteBoundary,
    skinAccess: userControlledMemorySkinAccessBoundary,
    snapshotPolicy: userControlledMemorySnapshotPolicy,
    snapshotProvenance: userControlledMemorySnapshotProvenanceBoundary,
    snapshotRedaction: userControlledMemorySnapshotRedactionBoundary,
    snapshotSchemaValidation:
      userControlledMemorySnapshotSchemaValidationBoundary,
    sourceBoundary: userControlledMemorySourceBoundaryCheck,
    storageEncryption: userControlledMemoryStorageEncryptionBoundary,
    taskHistoryRetention: userControlledMemoryTaskHistoryRetentionBoundary,
    teachModeAccess: userControlledMemoryTeachModeAccessBoundary,
    telemetryPayloadRetention:
      userControlledMemoryTelemetryPayloadRetentionBoundary,
    trainingExport: userControlledMemoryTrainingExportBoundary,
    vectorIndexRetention: userControlledMemoryVectorIndexRetentionBoundary,
    viewPersistence: userControlledMemoryViewPersistenceBoundary,
    visibleRecordCount: filteredUserControlledMemories.length,
    voiceAliasMemoryCount,
    windowObservation: userControlledMemoryWindowObservationBoundary,
    workflowAccess: userControlledMemoryWorkflowAccessBoundary,
    workflowReplay: userControlledMemoryWorkflowReplayBoundary,
    writePolicy: userControlledMemoryWritePolicy,
  });
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
  const voiceServiceLanguage = selectVoiceServiceLanguage(
    voiceServiceStatus,
    copy,
  );
  const voiceLanguageMismatch = selectVoiceLanguageMismatch(
    uiLanguage,
    voiceServiceStatus,
  );
  const voiceRms = formatVoiceAudioPercent(ptt.audioDiagnostics.rms);
  const voicePeak = formatVoiceAudioPercent(ptt.audioDiagnostics.peak);
  const voiceDiagnosticsMetrics = buildVoiceDiagnostics({
    active: ptt.active,
    captureNotice: voiceCaptureNotice,
    captureState: ptt.state,
    copy,
    engineState: snapshot?.voice.state ?? "disabled",
    framesSent: ptt.audioDiagnostics.framesSent,
    languageMismatch: voiceLanguageMismatch,
    mode: snapshot?.voice.mode ?? "manual",
    peak: voicePeak,
    permission: snapshot?.voice.permission ?? "unknown",
    rms: voiceRms,
    serviceConfigured: voiceServiceStatus?.configured === true,
    serviceLanguage: voiceServiceLanguage,
    sessionId: snapshot?.voice.sessionId,
  });
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
              <ConversationTabs
                actions={{
                  selectConversation: (conversationId, active) => {
                    void handleSelectConversation(conversationId, active);
                  },
                }}
                viewModel={{
                  activeConversationId: snapshot?.activeConversationId,
                  conversations,
                  copy,
                  sending,
                }}
              />
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
            <ConversationPanel
              actions={{
                clearSessionHistory: () => {
                  void handleClearSessionHistory();
                },
                confirmUserRouteAlias: (proposal) => {
                  void handleConfirmUserRouteAlias(proposal);
                },
                confirmVoiceCommandCorrection: (candidate) => {
                  void handleConfirmVoiceCommandCorrection(candidate);
                },
                playLocalTts: () => {
                  void playLocalTts();
                },
                retryBrainCommand: () => {
                  void handleRetryBrainCommand();
                },
                rollbackBrainResult: handleRollbackBrainResult,
                selectConversation: (conversationId, active) => {
                  void handleSelectConversation(conversationId, active);
                },
                stopLocalTts,
              }}
              viewModel={{
                alphaCopy,
                brainResult,
                conversations,
                copy,
                error,
                events,
                messages: visibleMessages,
                sending,
                sessionHistory,
                tts: {
                  displayedStatus: displayedLocalTtsStatus,
                  enabled: localTtsEnabled,
                  eligible: localTtsEligible,
                  error: ttsError,
                  status: localTtsStatus,
                },
                voiceProjection: {
                  hidden: textOnlyAcceptanceMode,
                  isFinal: snapshot?.voice.transcript?.isFinal ?? false,
                  state: snapshot?.voice.state ?? "idle",
                  transcript: voiceTranscript,
                },
              }}
            />
          ) : activeView === "tasks" ? (
            <ScrollArea className="min-h-0 flex-1">
              <div
                className="grid gap-5 px-8 py-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
                data-testid="tasks-view"
              >
                <TaskTimeline
                  actions={{
                    approveTask: (taskId, title) => {
                      void handleApproveTask(taskId, title);
                    },
                    cancelTask: (taskId, title) => {
                      void handleCancelTask(taskId, title);
                    },
                  }}
                  copy={copy}
                  sending={sending}
                  viewModel={{ tasks: snapshot?.tasks ?? [] }}
                />

                <ModelOperationList
                  actions={{
                    refresh: () => {
                      void trackAction(
                        "Refresh model governance",
                        refreshModelGovernance,
                        copy.action.modelGovernanceRefreshed,
                      );
                    },
                  }}
                  copy={copy}
                  sending={sending}
                  viewModel={{ operations: modelOperations }}
                />
              </div>
            </ScrollArea>
          ) : activeView === "plugins" ? (
            <ScrollArea className="min-h-0 flex-1">
              <PluginManagementView
                actions={{
                  refresh: () => {
                    void trackAction(
                      "Refresh plugins",
                      async () => {
                        const pluginsOk = await refreshPlugins();
                        const manifestsOk =
                          await refreshLocalPluginManifestDeveloperStatus();
                        return pluginsOk && manifestsOk;
                      },
                      copy.action.pluginManagementRefreshed,
                    );
                  },
                  toggleLocalPluginState: (plugin) => {
                    void toggleLocalPluginState(plugin);
                  },
                }}
                copy={copy}
                sending={sending}
                viewModel={{
                  blockedPolicyPluginCount,
                  bundledPluginCount,
                  disabledPluginCount,
                  enabledPluginCount,
                  localManifestDiscovery,
                  localManifestPluginCount,
                  localPluginStateUpdatingId,
                  lowRiskPluginCount,
                  mediumRiskPluginCount,
                  pluginManagementStatus,
                  plugins,
                }}
              />
            </ScrollArea>
          ) : activeView === "memory" ? (
            <ScrollArea className="min-h-0 flex-1">
              <div
                className="grid gap-5 px-8 py-7 lg:grid-cols-[minmax(0,1fr)_320px]"
                data-testid="memory-view"
              >
                <MemoryCenter
                  actions={{
                    clearSanitizedSnapshot:
                      handleClearUserControlledMemorySanitizedSnapshot,
                    deleteMemory: (memory) => {
                      void handleDeleteUserControlledMemory(memory);
                    },
                    exportSanitizedSnapshot:
                      handleExportUserControlledMemorySanitizedSnapshot,
                    refresh: () => {
                      void handleRefreshUserControlledMemories();
                    },
                    resetControls: () => {
                      setUserControlledMemoryFilter("all");
                      setUserControlledMemoryRiskFilter("all");
                      setUserControlledMemorySort("updated_desc");
                      setUserControlledMemoryQuery("");
                    },
                    setKindFilter: setUserControlledMemoryFilter,
                    setMemoryQuery: setUserControlledMemoryQuery,
                    setRiskFilter: setUserControlledMemoryRiskFilter,
                    setSort: setUserControlledMemorySort,
                  }}
                  sending={sending}
                  viewModel={{
                    activeKindLabel: userControlledMemoryActiveKindLabel,
                    activeRiskLabel: userControlledMemoryActiveRiskLabel,
                    activeSortLabel: userControlledMemoryActiveSortLabel,
                    deletePendingKey: userControlledMemoryDeletePendingKey,
                    expirationBoundary: userControlledMemoryExpirationBoundary,
                    filteredMemories: filteredUserControlledMemories,
                    highRiskMemoryCount,
                    lowRiskMemoryCount,
                    mediumRiskMemoryCount,
                    memoryQuery: userControlledMemoryQuery,
                    preferenceMemoryCount,
                    records: userControlledMemories,
                    recordingModeBoundary:
                      userControlledMemoryRecordingModeBoundary,
                    retentionControlsBoundary:
                      userControlledMemoryRetentionControlsBoundary,
                    retentionMutationBoundary:
                      userControlledMemoryRetentionMutationBoundary,
                    retentionScope: userControlledMemoryRetentionScope,
                    retentionSessionControlMode:
                      userControlledMemoryRetentionSessionControlMode,
                    routeAliasMemoryCount,
                    sanitizedSnapshotGeneratedAt:
                      userControlledMemorySanitizedSnapshotGeneratedAt
                        ? formatEventTime(
                            userControlledMemorySanitizedSnapshotGeneratedAt,
                          )
                        : null,
                    sanitizedSnapshotPreview:
                      userControlledMemorySanitizedSnapshotPreview,
                    searchState: userControlledMemorySearchState,
                    selectedKind: userControlledMemoryFilter,
                    selectedRisk: userControlledMemoryRiskFilter,
                    selectedSort: userControlledMemorySort,
                    sessionOnlyBoundary:
                      userControlledMemorySessionOnlyBoundary,
                    voiceAliasMemoryCount,
                  }}
                />

                <MemoryBoundaryPanel viewModel={memoryBoundaryViewModel} />
              </div>
            </ScrollArea>
          ) : activeView === "voice" ? (
            <VoiceControlPanel
              actions={{
                openSettings: () => {
                  if (textOnlyAcceptanceMode) return;
                  void trackAction(
                    "Open voice settings",
                    openVoiceSettings,
                    copy.action.voiceSettingsOpened,
                  );
                },
                refreshRouteAliases: () => {
                  void handleRefreshUserRouteAliases();
                },
                refreshVoiceAliases: () => {
                  void handleRefreshVoiceCommandAliases();
                },
                removeRouteAlias: (aliasId) => {
                  void handleDeleteUserRouteAlias(aliasId);
                },
                removeVoiceAlias: (aliasId) => {
                  void handleDeleteVoiceCommandAlias(aliasId);
                },
                startCapture: () => {
                  void ptt.start();
                },
                stopCapture: (reason) => {
                  void ptt.stop(reason);
                },
              }}
              viewModel={{
                aliases: {
                  routeAliases: userRouteAliases,
                  voiceAliases: voiceCommandAliases,
                },
                capture: {
                  active: ptt.active,
                  captureErrorDetail: voiceCaptureErrorDetail,
                  captureNotice: voiceCaptureNotice,
                  coreOnline,
                  languageMismatch: voiceLanguageMismatch,
                  mode: snapshot?.voice.mode ?? "manual",
                  permission: snapshot?.voice.permission ?? "unknown",
                  state: snapshot?.voice.state ?? "idle",
                  textOnlyAcceptanceMode,
                  transcript: voiceTranscript,
                },
                copy,
                sending,
                status: {
                  metrics: voiceDiagnosticsMetrics,
                  settingsDisabled: textOnlyAcceptanceMode,
                },
              }}
            />
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

                <AppearanceSettingsPanel
                  activeTheme={activeSkinTheme}
                  copy={copy}
                  currentThemeId={skinTheme}
                  onSelectTheme={handleSelectSkinTheme}
                  storageKey={THEME_STORAGE_KEY}
                  themes={builtInSkinThemes}
                />

                <SettingsGeneralPanel
                  actions={{
                    probeCore: () => {
                      void trackAction("Probe Core", async () => {
                        const probed = await probeCore();
                        const refreshedCapabilities =
                          await refreshCapabilities();
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
                    setLocalTtsEnabled: (enabled) => {
                      setLocalTtsEnabled(enabled);
                      if (!enabled) stopLocalTts();
                      if (enabled) {
                        setLocalTtsStatus(
                          brainResult?.dispatchStatus === "completed"
                            ? "eligible"
                            : "disabled",
                        );
                      }
                    },
                    toggleInspector: () => {
                      setInspectorOpen((open) => !open);
                      notifyAction(
                        inspectorOpen
                          ? copy.action.inspectorHidden
                          : copy.action.inspectorShown,
                        "accent",
                      );
                    },
                  }}
                  alphaCopy={alphaCopy}
                  copy={copy}
                  viewModel={{
                    connection,
                    coreHealth: snapshot?.health ?? connection,
                    inspectorOpen,
                    localTtsEnabled,
                    runtimeMode,
                    sending,
                    sequenceId: snapshot?.sequenceId ?? 0,
                    ttsServiceConfigured: ttsServiceStatus?.configured === true,
                  }}
                />

                <CommandRouterSettingsPanel
                  actions={{
                    refreshProductMode: () => {
                      void trackAction(
                        "Refresh Command Router mode",
                        refreshCommandRouterProductModeStatus,
                        copy.action.commandRouterProductModeRefreshed,
                      );
                    },
                    refreshQwenRuntimeControl: () => {
                      void trackAction(
                        "Refresh Qwen runtime control",
                        refreshQwenRuntimeControlStatus,
                      );
                    },
                    rollbackQwenRuntimeControl: () => {
                      void handleQwenRuntimeControlAction("rollback");
                    },
                    setProductModeEnabled: (enabled) => {
                      void trackAction(
                        "Change Command Router mode",
                        async () => setCommandRouterProductModeEnabled(enabled),
                        copy.action.commandRouterProductModeChanged,
                      );
                    },
                    startQwenRuntimeControl: () => {
                      void handleQwenRuntimeControlAction("start");
                    },
                    stopQwenRuntimeControl: () => {
                      void handleQwenRuntimeControlAction("stop");
                    },
                  }}
                  copy={copy}
                  sending={sending}
                  viewModel={{
                    activationGateLabels: commandRouterQwenActivationGateLabels,
                    activationPolicyId:
                      commandRouterQwenActivation?.policyId ??
                      "qwen-product-routing.activation.default-off.v1",
                    gateLabels: commandRouterQwenGateLabels,
                    headerBadge: commandRouterProductModeEnabled
                      ? "control on"
                      : "default off",
                    productModeEnabled: commandRouterProductModeEnabled,
                    productModeNotice:
                      "Fixture-only surface: deterministic intent routing remains active; Qwen is status-only with no runtime, helper, artifact, cache, or provider call, and no browser execution. Approved local app launches remain Notepad/Calculator only after confirmation.",
                    productModeSummary: commandRouterProductModeEnabled
                      ? "Control enabled; text and voice commands are routed through deterministic fixture projection only."
                      : "Default off; existing Chat Answer and BrainCommand behavior is preserved.",
                    qwenMetrics: [
                      {
                        label: "Provider",
                        value:
                          commandRouterQwenBinding?.providerId ??
                          "intent-router.qwen3-0.6b",
                        tone: "accent",
                      },
                      {
                        label: "Binding",
                        value:
                          commandRouterQwenBinding?.mode.replaceAll("_", " ") ??
                          "no runtime status only",
                        tone: "warning",
                      },
                      {
                        label: "Product routing",
                        value: commandRouterQwenBinding?.productRoutingEnabled
                          ? "enabled"
                          : "off",
                        tone: "warning",
                      },
                      {
                        label: "Conversation route",
                        value:
                          commandRouterQwenBinding
                            ?.conversationSurfaceProductRoute?.status ??
                          "disabled",
                        tone: "warning",
                      },
                      {
                        label: "Route selectable",
                        value: commandRouterQwenBinding
                          ?.conversationSurfaceProductRoute?.qwenRouteSelectable
                          ? "selectable"
                          : "fixture",
                        tone: "success",
                      },
                      {
                        label: "Persistent opt-in",
                        value:
                          commandRouterQwenBinding
                            ?.conversationSurfaceProductRoute?.persistentOptIn
                            ?.status ?? "disabled",
                        tone: "warning",
                      },
                      {
                        label: "Session scope",
                        value: commandRouterQwenBinding
                          ?.conversationSurfaceProductRoute?.persistentOptIn
                          ?.limitedProductSessionOnly
                          ? "limited"
                          : "blocked",
                        tone: "success",
                      },
                      {
                        label: "Runtime access",
                        value: commandRouterQwenBinding?.runtimeAccessed
                          ? "accessed"
                          : "not accessed",
                        tone: "success",
                      },
                      {
                        label: "Artifact access",
                        value: commandRouterQwenBinding?.artifactAccessed
                          ? "accessed"
                          : "not accessed",
                        tone: "success",
                      },
                      {
                        label: "Cache change",
                        value: commandRouterQwenBinding?.persistentCacheChanged
                          ? "changed"
                          : "none",
                        tone: "success",
                      },
                      {
                        label: "Activation",
                        value:
                          commandRouterQwenActivation?.status.replaceAll(
                            "_",
                            " ",
                          ) ?? "disabled",
                        tone:
                          commandRouterQwenActivation?.status === "ready"
                            ? "accent"
                            : "warning",
                      },
                      {
                        label: "Rollback",
                        value:
                          commandRouterQwenActivation?.rollbackState.replaceAll(
                            "_",
                            " ",
                          ) ?? "not needed",
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
                        value: String(
                          qwenRuntimeControlStatus?.routeRequestLimit ?? 3,
                        ),
                        tone: "warning",
                      },
                      {
                        label: "Route count",
                        value: String(
                          qwenRuntimeControlStatus?.routeRequestCount ?? 0,
                        ),
                        tone: "warning",
                      },
                      {
                        label: "Helper starts",
                        value: String(
                          qwenRuntimeControlStatus?.helperStartCount ?? 0,
                        ),
                        tone: "warning",
                      },
                      {
                        label: "Gen probes",
                        value: String(
                          qwenRuntimeControlStatus?.generationPortReadinessProbeCount ??
                            0,
                        ),
                        tone: "warning",
                      },
                      {
                        label: "Shutdown",
                        value:
                          qwenRuntimeControlStatus?.helperShutdownVerified ===
                          false
                            ? "pending"
                            : "verified",
                        tone:
                          qwenRuntimeControlStatus?.helperShutdownVerified ===
                          false
                            ? "warning"
                            : "success",
                      },
                      {
                        label: "Browser/URL",
                        value:
                          qwenRuntimeControlStatus?.browserUrlOpeningEnabled
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
                      qwenRuntimeControlStatus?.controls.rollback ===
                      "available",
                    qwenRuntimeControlSession,
                    qwenRuntimeControlStartAvailable:
                      qwenRuntimeControlStatus?.controls.start === "available",
                    qwenRuntimeControlStopAvailable:
                      qwenRuntimeControlStatus?.controls.stop === "available",
                    qwenRuntimeControlSummary,
                    qwenStatus: commandRouterQwenBinding?.status ?? "disabled",
                    routeMetrics: [
                      {
                        label: "Provider",
                        value:
                          commandRouterProductModeStatus?.providerId ??
                          "intent-router.deterministic.rules",
                        tone: "accent",
                      },
                      {
                        label: "Mode",
                        value:
                          commandRouterProductModeStatus?.mode.replaceAll(
                            "_",
                            " ",
                          ) ?? "fixture only",
                        tone: "success",
                      },
                      {
                        label: "Runtime",
                        value: commandRouterProductModeSummary,
                        tone: commandRouterProductModeEnabled
                          ? "accent"
                          : "warning",
                      },
                      {
                        label: "Direct action",
                        value: commandRouterDirectActionStatus,
                        tone: "warning",
                      },
                      {
                        label: "Qwen runtime",
                        value:
                          commandRouterProductModeStatus?.realQwenRuntimeEnabled
                            ? "enabled"
                            : "disabled",
                        tone: "warning",
                      },
                      {
                        label: "Chat fallback",
                        value:
                          commandRouterProductModeStatus?.chatAnswerFallbackPreserved ===
                          false
                            ? "not preserved"
                            : "preserved",
                        tone: "success",
                      },
                    ],
                  }}
                />

                <ChatAnswerSettingsPanel
                  actions={{
                    refreshProductMode: () => {
                      void trackAction(
                        "Refresh Chat Answer mode",
                        refreshChatAnswerProductModeStatus,
                        copy.action.chatAnswerProductModeRefreshed,
                      );
                    },
                    setProductModeEnabled: (enabled) => {
                      void trackAction(
                        "Change Chat Answer mode",
                        async () => setChatAnswerProductModeEnabled(enabled),
                        copy.action.chatAnswerProductModeChanged,
                      );
                    },
                  }}
                  copy={copy}
                  sending={sending}
                  viewModel={{
                    controlSummary: chatAnswerProductModeEnabled
                      ? chatAnswerRealRuntimeArmed
                        ? "Control enabled; real runtime armed for one approved fixed text call."
                        : "Control enabled; real runtime remains locked until credential readiness is confirmed."
                      : "Default off; typed answers continue through the existing safe path.",
                    headerBadge: chatAnswerProductModeEnabled
                      ? "control on"
                      : "default off",
                    metrics: [
                      {
                        label: "Provider",
                        value:
                          chatAnswerProductModeStatus?.providerId ?? "deepseek",
                        tone: "accent",
                      },
                      {
                        label: "Profile",
                        value:
                          chatAnswerProductModeStatus?.profileId ??
                          "deepseek.v4-flash.compact_json_object_256",
                      },
                      {
                        label: "Credential",
                        value: chatAnswerCredentialConfigured
                          ? "configured"
                          : "missing",
                        tone: chatAnswerCredentialConfigured
                          ? "success"
                          : "warning",
                      },
                      {
                        label: "Runtime",
                        value: chatAnswerProductModeSummary,
                        tone: chatAnswerProductModeEnabled
                          ? "accent"
                          : "warning",
                      },
                      {
                        label: "Secure store",
                        value: chatAnswerSecureStoreAvailable
                          ? "available"
                          : "unavailable",
                        tone: chatAnswerSecureStoreAvailable
                          ? "success"
                          : "warning",
                      },
                      {
                        label: "Fallback",
                        value:
                          chatAnswerProductModeStatus?.fallbackPreserved ===
                          false
                            ? "not preserved"
                            : "preserved",
                        tone: "success",
                      },
                    ],
                    notice:
                      "Controlled surface: default off; one approved provider call only after explicit enablement and credential readiness; no planner, no Memory vector retrieval, and no direct action behavior.",
                    productModeEnabled: chatAnswerProductModeEnabled,
                  }}
                />
                <VoiceSettingsPanel
                  actions={{
                    openTtsSettings: () => {
                      if (textOnlyAcceptanceMode) {
                        return;
                      }
                      void trackAction(
                        "Open TTS settings",
                        openTtsSettings,
                        uiLanguage === "zh"
                          ? "TTS 设置已打开"
                          : "TTS settings opened",
                      );
                    },
                    openVoiceSettings: () => {
                      if (textOnlyAcceptanceMode) {
                        return;
                      }
                      void trackAction(
                        "Open voice settings",
                        openVoiceSettings,
                        copy.action.voiceSettingsOpened,
                      );
                    },
                  }}
                  copy={copy}
                  viewModel={{
                    captureErrorDetail: voiceCaptureErrorDetail,
                    captureNotice: voiceCaptureNotice,
                    languageMismatch: voiceLanguageMismatch,
                    metrics: [
                      {
                        label: copy.label.voiceService,
                        value: voiceServiceStatus?.configured
                          ? copy.label.voiceServiceConfigured
                          : copy.label.voiceServiceMissing,
                        tone: voiceServiceStatus?.configured
                          ? "success"
                          : "warning",
                      },
                      {
                        label: copy.label.voiceRecognitionLanguage,
                        value: voiceServiceLanguage,
                        tone: voiceLanguageMismatch ? "warning" : undefined,
                      },
                      {
                        label: copy.metric.micCapture,
                        value: ptt.state,
                        tone: ptt.active
                          ? "success"
                          : ptt.captureNotice
                            ? "warning"
                            : undefined,
                      },
                      {
                        label: copy.metric.voiceEngine,
                        value: snapshot?.voice.state ?? "disabled",
                        tone: "warning",
                      },
                      {
                        label: copy.metric.voiceMode,
                        value: snapshot?.voice.mode ?? "manual",
                      },
                      {
                        label: copy.metric.micPermission,
                        value: snapshot?.voice.permission ?? "unknown",
                      },
                      {
                        label: copy.metric.voiceFrames,
                        value: String(ptt.audioDiagnostics.framesSent),
                      },
                    ],
                    permission: snapshot?.voice.permission ?? "unknown",
                    ttsSettingsLabel:
                      uiLanguage === "zh" ? "TTS 设置" : "TTS Settings",
                    voiceSettingsDisabled: textOnlyAcceptanceMode,
                  }}
                />
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

                <ModelGovernanceSettingsPanel
                  actions={{
                    refresh: () => {
                      void trackAction(
                        "Refresh model governance",
                        refreshModelGovernance,
                        copy.action.modelGovernanceRefreshed,
                      );
                    },
                  }}
                  copy={copy}
                  sending={sending}
                  viewModel={{
                    metrics: [
                      {
                        label: copy.metric.providers,
                        value: String(inferenceProviders.length),
                      },
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
                      {
                        label: copy.metric.localModels,
                        value: String(modelInventory.length),
                      },
                      {
                        label: copy.metric.operations,
                        value: String(modelOperations.length),
                      },
                    ],
                  }}
                />
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <ActivityView
                actions={{
                  disableMemoryAlpha: () => {
                    void handleDisableMemoryAlpha();
                  },
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
                  refreshMemoryAlpha: () => {
                    void trackAction(
                      "Refresh Memory alpha",
                      refreshMemoryAlphaStatus,
                      copy.action.memoryAlphaRefreshed,
                    );
                  },
                  runMemoryAlphaProbe: () => {
                    void handleMemoryAlphaProbe();
                  },
                  setMemoryAlphaProbeDraft,
                }}
                copy={copy}
                sending={sending}
                viewModel={{
                  memoryAlpha: {
                    draft: memoryAlphaProbeDraft,
                    failureClass: memoryAlphaRecallProbe?.failureClass,
                    maxMessageCount: memoryAlpha?.maxMessageCount ?? 5,
                    probeSummary: memoryAlphaProbeSummary,
                    reason: memoryAlphaReason,
                    rollbackStatus:
                      memoryAlpha?.rollbackStatus ?? "not_started",
                    state: memoryAlpha?.state ?? "unknown",
                    trackedMessageCount: memoryAlpha?.trackedMessageCount ?? 0,
                  },
                  recentEvents,
                }}
              />
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

          <ConversationComposer
            copy={copy}
            onChange={setDraft}
            onSubmit={handleSubmit}
            sending={sending}
            value={draft}
          />
        </main>

        {inspectorOpen && (
          <RuntimeInspectorPanel
            actions={{
              disableMemoryAlpha: () => {
                void handleDisableMemoryAlpha();
              },
              exportMemorySnapshot: () => {
                void handleExportMemorySnapshot();
              },
              importMemorySnapshot: () => {
                void handleImportMemorySnapshot();
              },
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
              refreshMemoryAlpha: () => {
                void trackAction(
                  "Refresh Memory alpha",
                  refreshMemoryAlphaStatus,
                  copy.action.memoryAlphaRefreshed,
                );
              },
              refreshModelGovernance: () => {
                void trackAction(
                  "Refresh model governance",
                  refreshModelGovernance,
                  copy.action.modelGovernanceRefreshed,
                );
              },
              runFixtureEmbeddingProbe: () => {
                void handleRunFixtureEmbeddingProbe();
              },
              runFixtureIntentProbe: () => {
                void handleRunFixtureIntentProbe();
              },
              runFixtureOcrProbe: () => {
                void handleRunFixtureOcrProbe();
              },
              runFixtureRerankProbe: () => {
                void handleRunFixtureRerankProbe();
              },
              runMemoryAlphaProbe: () => {
                void handleMemoryAlphaProbe();
              },
              setMemoryAlphaProbeDraft,
              setMemorySnapshotDraft,
            }}
            copy={copy}
            sending={sending}
            viewModel={{
              coreInstanceId: snapshot?.coreInstanceId,
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
                  tone: memoryAlphaRecallProbe?.failureClass
                    ? "warning"
                    : undefined,
                },
              ],
              memoryAlphaProbeDraft,
              memorySnapshotDraft,
              modelGovernanceMetrics: [
                {
                  label: copy.metric.candidates,
                  value: String(modelCandidates.length),
                },
                {
                  label: copy.metric.manifests,
                  value: String(modelManifests.length),
                },
                {
                  label: copy.metric.providers,
                  value: String(inferenceProviders.length),
                },
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
                {
                  label: copy.metric.operations,
                  value: String(modelOperations.length),
                },
                {
                  label: copy.metric.activeOps,
                  value: String(activeModelOperationCount),
                  tone: "warning",
                },
                {
                  label: copy.metric.resourceMem,
                  value: resourceMemoryGiB,
                },
                {
                  label: copy.metric.resourceVram,
                  value: resourceVramGiB,
                },
                {
                  label: copy.metric.resourceLeases,
                  value: String(resourceDiagnostics?.activeLeaseCount ?? 0),
                },
                {
                  label: copy.metric.localModels,
                  value: String(modelInventory.length),
                },
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
                {
                  label: copy.metric.intent,
                  value: fixtureIntentProbe?.intent ?? "idle",
                },
                {
                  label: copy.metric.route,
                  value: fixtureIntentProbe?.operationPhase ?? "idle",
                  tone:
                    fixtureIntentProbe?.operationPhase === "completed"
                      ? "success"
                      : undefined,
                },
                {
                  label: copy.metric.ocrText,
                  value: fixtureOcrProbe?.text ?? "idle",
                },
                {
                  label: copy.metric.ocrBlocks,
                  value: fixtureOcrProbe
                    ? String(fixtureOcrProbe.blockCount)
                    : "idle",
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
                snapshot,
                voiceFramesSent: ptt.audioDiagnostics.framesSent,
                voicePeak,
                voiceRms,
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
