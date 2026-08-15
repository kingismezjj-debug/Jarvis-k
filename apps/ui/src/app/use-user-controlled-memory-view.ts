import { useEffect, useMemo, useState } from "react";
import type { UserControlledMemoryRecord } from "@jarvis-k/contracts";

import {
  persistUserControlledMemoryViewPreferences,
  readInitialUserControlledMemoryViewPreferences,
  userControlledMemoryFilterOptions,
  userControlledMemoryRiskFilterOptions,
  userControlledMemorySortOptions,
} from "./memory-view";
import type {
  UserControlledMemoryFilter,
  UserControlledMemoryRiskFilter,
  UserControlledMemorySort,
} from "./types";

export function useUserControlledMemoryView(
  userControlledMemories: UserControlledMemoryRecord[],
) {
const [userControlledMemoryFilter, setUserControlledMemoryFilter] =
    useState<UserControlledMemoryFilter>(
      () => readInitialUserControlledMemoryViewPreferences().filter,
    );
  const [userControlledMemoryRiskFilter, setUserControlledMemoryRiskFilter] =
    useState<UserControlledMemoryRiskFilter>(
      () => readInitialUserControlledMemoryViewPreferences().riskFilter,
    );
  const [userControlledMemorySort, setUserControlledMemorySort] =
    useState<UserControlledMemorySort>(
      () => readInitialUserControlledMemoryViewPreferences().sort,
    );
  const [userControlledMemoryQuery, setUserControlledMemoryQuery] =
    useState("");
  const [
    userControlledMemorySanitizedSnapshotPreview,
    setUserControlledMemorySanitizedSnapshotPreview,
  ] = useState("");
  const [
    userControlledMemorySanitizedSnapshotGeneratedAt,
    setUserControlledMemorySanitizedSnapshotGeneratedAt,
  ] = useState<string | null>(null);
  const [
    userControlledMemoryDeletePendingKey,
    setUserControlledMemoryDeletePendingKey,
  ] = useState<string | null>(null);

useEffect(() => {
    persistUserControlledMemoryViewPreferences({
      filter: userControlledMemoryFilter,
      riskFilter: userControlledMemoryRiskFilter,
      sort: userControlledMemorySort,
    });
  }, [
    userControlledMemoryFilter,
    userControlledMemoryRiskFilter,
    userControlledMemorySort,
  ]);
const routeAliasMemoryCount = userControlledMemories.filter(
    (memory) => memory.kind === "route_alias",
  ).length;
  const voiceAliasMemoryCount = userControlledMemories.filter(
    (memory) => memory.kind === "voice_command_alias",
  ).length;
  const preferenceMemoryCount = userControlledMemories.filter(
    (memory) => memory.kind === "preference",
  ).length;
  const categorizedMemoryCount =
    routeAliasMemoryCount + voiceAliasMemoryCount + preferenceMemoryCount;
  const userControlledMemoryCountCheck =
    categorizedMemoryCount === userControlledMemories.length ? "OK" : "MISMATCH";
  const deletableMemoryCount = userControlledMemories.filter(
    (memory) => memory.deletable,
  ).length;
  const lockedMemoryCount =
    userControlledMemories.length - deletableMemoryCount;
  const disabledMemoryCount = 0;
  const rawExposedMemoryCount = userControlledMemories.filter(
    (memory) => memory.rawContentExposed,
  ).length;
  const userControlledMemorySafetyCheck =
    rawExposedMemoryCount === 0 ? "OK" : "REVIEW";
  const providerNeutralMemoryCount = preferenceMemoryCount;
  const userConfirmedRouteAliasSourceCount = userControlledMemories.filter(
    (memory) => memory.source === "user_confirmed_route_alias",
  ).length;
  const userConfirmedVoiceAliasSourceCount = userControlledMemories.filter(
    (memory) => memory.source === "voice_correction_alias",
  ).length;
  const userConfirmedPreferenceSourceCount = userControlledMemories.filter(
    (memory) => memory.source === "user_confirmed_preference",
  ).length;
  const userControlledMemorySourceBoundaryCheck =
    userConfirmedRouteAliasSourceCount +
      userConfirmedVoiceAliasSourceCount +
      userConfirmedPreferenceSourceCount ===
    userControlledMemories.length
      ? "USER_CONFIRMED"
      : "REVIEW";
  const userControlledMemoryWritePolicy = "EXPLICIT_ONLY";
  const userControlledMemoryDeleteBoundary = "CORE_IPC_REPOSITORY";
  const userControlledMemoryDisableControlBoundary = "STATUS_ONLY";
  const userControlledMemoryDisableMutationBoundary = "NOT_ENABLED";
  const userControlledMemorySnapshotPolicy = "USER_INITIATED";
  const userControlledMemoryRetentionScope = "USER_CONTROLLED_ONLY";
  const userControlledMemoryExportBoundary = "USER_INITIATED_ONLY";
  const userControlledMemorySanitizedSnapshotBoundary =
    userControlledMemorySanitizedSnapshotPreview.trim().length > 0
      ? "GENERATED"
      : "IDLE";
  const userControlledMemoryImportBoundary = "NOT_ENABLED";
  const userControlledMemoryEditBoundary = "NOT_ENABLED";
  const userControlledMemoryRestoreBoundary = "NOT_ENABLED";
  const userControlledMemoryAutoCaptureBoundary = "DISABLED";
  const userControlledMemoryBackgroundIndexingBoundary = "DISABLED";
  const userControlledMemoryProactiveScanBoundary = "DISABLED";
  const userControlledMemoryProactiveSuggestionBoundary = "NOT_ENABLED";
  const userControlledMemoryProactiveNotificationBoundary = "DISABLED";
  const userControlledMemoryContextPollingBoundary = "DISABLED";
  const userControlledMemoryAutoExecutionBoundary = "DISABLED";
  const userControlledMemoryPermissionOverrideBoundary = "DISABLED";
  const userControlledMemoryRiskDowngradeBoundary = "DISABLED";
  const userControlledMemoryConfirmationBypassBoundary = "DISABLED";
  const userControlledMemoryAllowlistMutationBoundary = "DISABLED";
  const userControlledMemoryWorkflowReplayBoundary = "DISABLED";
  const userControlledMemoryBackgroundTaskCreationBoundary = "DISABLED";
  const userControlledMemoryReminderSchedulingBoundary = "DISABLED";
  const userControlledMemoryAutonomousFollowUpBoundary = "DISABLED";
  const userControlledMemoryOutboundMessagingBoundary = "DISABLED";
  const userControlledMemoryExternalTriggerBoundary = "DISABLED";
  const userControlledMemoryClipboardObservationBoundary = "DISABLED";
  const userControlledMemoryKeystrokeObservationBoundary = "DISABLED";
  const userControlledMemoryWindowObservationBoundary = "DISABLED";
  const userControlledMemoryScreenObservationBoundary = "DISABLED";
  const userControlledMemoryFileObservationBoundary = "DISABLED";
  const userControlledMemoryCameraObservationBoundary = "DISABLED";
  const userControlledMemoryMicrophoneObservationBoundary = "DISABLED";
  const userControlledMemoryBrowserHistoryObservationBoundary = "DISABLED";
  const userControlledMemoryLocationObservationBoundary = "DISABLED";
  const userControlledMemoryContactsObservationBoundary = "DISABLED";
  const userControlledMemoryCalendarObservationBoundary = "DISABLED";
  const userControlledMemoryEmailObservationBoundary = "DISABLED";
  const userControlledMemoryMessagingObservationBoundary = "DISABLED";
  const userControlledMemoryCredentialObservationBoundary = "DISABLED";
  const userControlledMemoryPaymentObservationBoundary = "DISABLED";
  const userControlledMemoryHealthObservationBoundary = "DISABLED";
  const userControlledMemoryBiometricObservationBoundary = "DISABLED";
  const userControlledMemoryGovernmentIdObservationBoundary = "DISABLED";
  const userControlledMemoryFinancialAccountObservationBoundary = "DISABLED";
  const userControlledMemoryLegalDocumentObservationBoundary = "DISABLED";
  const userControlledMemoryRepositoryObservationBoundary = "DISABLED";
  const userControlledMemoryCloudStorageObservationBoundary = "DISABLED";
  const userControlledMemoryAnalyticsProfilingBoundary = "DISABLED";
  const userControlledMemoryVectorIndexRetentionBoundary = "DISABLED";
  const userControlledMemoryPluginAccessBoundary = "NOT_GRANTED";
  const userControlledMemoryWorkflowAccessBoundary = "NOT_GRANTED";
  const userControlledMemoryTeachModeAccessBoundary = "NOT_GRANTED";
  const userControlledMemorySkinAccessBoundary = "NOT_GRANTED";
  const userControlledMemoryPetAccessBoundary = "NOT_GRANTED";
  const userControlledMemoryPersonalityAccessBoundary = "NOT_GRANTED";
  const userControlledMemoryCustomUiAccessBoundary = "NOT_GRANTED";
  const userControlledMemoryExpirationBoundary = "NOT_ENABLED";
  const userControlledMemorySessionOnlyBoundary = "NOT_ENABLED";
  const userControlledMemoryProviderAuditBoundary = "NOT_ENABLED";
  const userControlledMemoryAuditHistoryBoundary = "NOT_ENABLED";
  const userControlledMemoryExternalSharingBoundary = "DISABLED";
  const userControlledMemoryCommunitySharingBoundary = "DISABLED";
  const userControlledMemoryCloudSyncBoundary = "DISABLED";
  const userControlledMemoryCloudAccountBoundary = "NOT_CONFIGURED";
  const userControlledMemoryStorageEncryptionBoundary = "NOT_ENABLED";
  const userControlledMemoryCredentialAccessBoundary = "NO_ACCESS";
  const userControlledMemoryNetworkAccessBoundary = "DISABLED";
  const userControlledMemoryModelTrainingBoundary = "DISABLED";
  const userControlledMemoryTrainingExportBoundary = "DISABLED";
  const userControlledMemoryProviderPersonalizationBoundary = "NOT_ENABLED";
  const userControlledMemoryPromptInjectionBoundary = "DISABLED";
  const userControlledMemoryRawAudioRetentionBoundary = "DISABLED";
  const userControlledMemoryRawTranscriptRetentionBoundary = "DISABLED";
  const userControlledMemoryScreenCaptureRetentionBoundary = "DISABLED";
  const userControlledMemoryFileContentRetentionBoundary = "DISABLED";
  const userControlledMemoryClipboardRetentionBoundary = "DISABLED";
  const userControlledMemorySecretRetentionBoundary = "DISABLED";
  const userControlledMemoryPaymentDataRetentionBoundary = "DISABLED";
  const userControlledMemoryLocationRetentionBoundary = "DISABLED";
  const userControlledMemoryBiometricRetentionBoundary = "DISABLED";
  const userControlledMemoryContactRetentionBoundary = "DISABLED";
  const userControlledMemoryHealthRetentionBoundary = "DISABLED";
  const userControlledMemoryCalendarRetentionBoundary = "DISABLED";
  const userControlledMemoryEmailRetentionBoundary = "DISABLED";
  const userControlledMemoryIdentityDocumentRetentionBoundary = "DISABLED";
  const userControlledMemoryBrowserHistoryRetentionBoundary = "DISABLED";
  const userControlledMemoryCookieRetentionBoundary = "DISABLED";
  const userControlledMemoryDownloadHistoryRetentionBoundary = "DISABLED";
  const userControlledMemoryAutofillRetentionBoundary = "DISABLED";
  const userControlledMemoryCredentialRetentionBoundary = "DISABLED";
  const userControlledMemoryDeviceIdentifierRetentionBoundary = "DISABLED";
  const userControlledMemoryNetworkIdentifierRetentionBoundary = "DISABLED";
  const userControlledMemoryCrashDumpRetentionBoundary = "DISABLED";
  const userControlledMemoryErrorReportRetentionBoundary = "DISABLED";
  const userControlledMemoryTelemetryPayloadRetentionBoundary = "DISABLED";
  const userControlledMemoryModelCacheRetentionBoundary = "DISABLED";
  const userControlledMemoryPromptCacheRetentionBoundary = "DISABLED";
  const userControlledMemoryTaskHistoryRetentionBoundary = "DISABLED";
  const userControlledMemorySnapshotRedactionBoundary = "SANITIZED_ONLY";
  const userControlledMemoryRawSnapshotReviewBoundary = "NOT_ENABLED";
  const userControlledMemorySnapshotSchemaValidationBoundary = "REQUIRED";
  const userControlledMemorySnapshotProvenanceBoundary = "USER_CONFIRMED_ONLY";
  const userControlledMemoryRetentionControlsBoundary = "NOT_ENABLED";
  const userControlledMemoryRetentionSessionControlMode = "STATUS_ONLY";
  const userControlledMemoryRetentionMutationBoundary = "NO_RUNTIME_MUTATION";
  const userControlledMemorySessionOnlyWriteBoundary = "DISABLED";
  const userControlledMemoryExpirationJobBoundary = "DISABLED";
  const userControlledMemoryExportImportBoundary = "EXPORT_ONLY";
  const userControlledMemoryEditRestoreBoundary = "NOT_ENABLED";
  const userControlledMemoryProviderSyncBoundary = "DISABLED";
  const userControlledMemoryRecordingModeBoundary = "MANUAL_ONLY";
  const userControlledMemoryRecordingPauseBoundary = "NOT_ENABLED";
  const userControlledMemoryViewPersistenceBoundary = "LOCAL_FILTERS";
  const userControlledMemorySearchPersistenceBoundary = "DISABLED";
  const userControlledMemorySavedViewPresetsBoundary = "NOT_ENABLED";
  const userControlledMemoryDeletePendingState =
    userControlledMemoryDeletePendingKey ? "YES" : "NO";
  const filteredUserControlledMemories = useMemo(() => {
    const normalizedQuery = userControlledMemoryQuery.trim().toLowerCase();
    const visibleMemories = userControlledMemories.filter((memory) => {
      if (
        userControlledMemoryFilter !== "all" &&
        memory.kind !== userControlledMemoryFilter
      ) {
        return false;
      }
      if (
        userControlledMemoryRiskFilter !== "all" &&
        memory.risk !== userControlledMemoryRiskFilter
      ) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const searchable = [
        memory.kind,
        memory.label,
        memory.summary,
        memory.source,
        memory.risk,
        memory.preferenceKey ?? "",
        memory.preferenceValue ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
    return [...visibleMemories].sort((left, right) => {
      if (userControlledMemorySort === "updated_asc") {
        return left.updatedAt.localeCompare(right.updatedAt);
      }
      if (userControlledMemorySort === "kind") {
        return (
          left.kind.localeCompare(right.kind) ||
          right.updatedAt.localeCompare(left.updatedAt)
        );
      }
      return right.updatedAt.localeCompare(left.updatedAt);
    });
  }, [
    userControlledMemories,
    userControlledMemoryFilter,
    userControlledMemoryQuery,
    userControlledMemoryRiskFilter,
    userControlledMemorySort,
  ]);
  const userControlledMemoryActiveKindLabel =
    userControlledMemoryFilterOptions.find(
      (option) => option.id === userControlledMemoryFilter,
    )?.label ?? "All";
  const userControlledMemoryActiveRiskLabel =
    userControlledMemoryRiskFilterOptions.find(
      (option) => option.id === userControlledMemoryRiskFilter,
    )?.label ?? "All risk";
  const userControlledMemoryActiveSortLabel =
    userControlledMemorySortOptions.find(
      (option) => option.id === userControlledMemorySort,
    )?.label ?? "Newest";
  const userControlledMemorySearchState =
    userControlledMemoryQuery.trim().length > 0 ? "SET" : "CLEAR";
  const chatAnswerPreferenceProjectionOn = userControlledMemories.some(
    (memory) =>
      memory.kind === "preference" &&
      memory.risk === "low" &&
      memory.rawContentExposed === false,
  );
  const lowRiskMemoryCount = userControlledMemories.filter(
    (memory) => memory.risk === "low",
  ).length;
  const mediumRiskMemoryCount = userControlledMemories.filter(
    (memory) => memory.risk === "medium",
  ).length;
  const highRiskMemoryCount = userControlledMemories.filter(
    (memory) => memory.risk === "high",
  ).length;

  return {
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
  };
}
