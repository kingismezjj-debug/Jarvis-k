import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "App.tsx"),
  "utf8",
);

describe("voice UI wiring", () => {
  it("keeps PTT enabled while voice commands are in flight", () => {
    expect(appSource).toContain("const ptt = usePttCapture(async (command) =>");
    expect(appSource).toContain("window.jarvis.sendCommand(command)");
    expect(appSource).not.toContain("disabled={!coreOnline || sending}");
  });

  it("renders voice transcript text visibly", () => {
    expect(appSource).toContain('data-testid="voice-transcript"');
    expect(appSource).toContain("VOICE TRANSCRIPT");
  });

  it("renders microphone audio diagnostics visibly", () => {
    expect(appSource).toContain("VOICE FRAMES");
    expect(appSource).toContain("VOICE RMS");
    expect(appSource).toContain("VOICE PEAK");
  });

  it("renders local memory conversation controls visibly", () => {
    expect(appSource).toContain('data-testid="conversation-tab"');
    expect(appSource).toContain("MEMORY");
    expect(appSource).toContain("createConversation");
    expect(appSource).toContain("renameConversation");
  });

  it("renders local memory maintenance controls visibly", () => {
    expect(appSource).toContain('data-testid="export-memory-snapshot"');
    expect(appSource).toContain('data-testid="import-memory-snapshot"');
    expect(appSource).toContain('data-testid="memory-snapshot-json"');
    expect(appSource).toContain("exportMemorySnapshot");
    expect(appSource).toContain("importMemorySnapshot");
  });

  it("renders bounded Memory alpha product spine controls visibly", () => {
    expect(appSource).toContain('data-testid="memory-alpha-spine"');
    expect(appSource).toContain('data-testid="refresh-memory-alpha"');
    expect(appSource).toContain('data-testid="disable-memory-alpha"');
    expect(appSource).toContain('data-testid="memory-alpha-probe-input"');
    expect(appSource).toContain('data-testid="run-memory-alpha-probe"');
    expect(appSource).toContain("Memory Alpha");
    expect(appSource).toContain("ALPHA STATE");
    expect(appSource).toContain("ROLLBACK");
    expect(appSource).toContain("PROBE DIMS");
    expect(appSource).toContain("refreshMemoryAlphaStatus");
    expect(appSource).toContain("disableMemoryAlpha");
    expect(appSource).toContain("probeMemoryAlphaRecall");
  });

  it("wires primary navigation to real product views", () => {
    expect(appSource).toContain("type ActiveView =");
    expect(appSource).toContain('| "plugins"');
    expect(appSource).toContain("const [activeView, setActiveView]");
    expect(appSource).toContain("handleSelectView");
    expect(appSource).toContain("onSelect={handleSelectView}");
    expect(appSource).toContain("data-testid={`nav-${item.id}`}");
    expect(appSource).toContain('data-testid="tasks-view"');
    expect(appSource).toContain('data-testid="plugins-view"');
    expect(appSource).toContain('data-testid="memory-view"');
    expect(appSource).toContain('data-testid="voice-view"');
    expect(appSource).toContain('data-testid="activity-view"');
    expect(appSource).toContain('data-testid="settings-view"');
    expect(appSource).toContain('data-testid="message-list"');
  });

  it("renders bounded Task Runtime cancellation controls for pending planner drafts", () => {
    expect(appSource).toContain("isTaskCancellationEligible");
    expect(appSource).toContain('state === "queued"');
    expect(appSource).toContain('state === "planning"');
    expect(appSource).toContain('state === "awaiting_confirmation"');
    expect(appSource).toContain("handleCancelTask");
    expect(appSource).toContain('data-testid="task-cancel"');
    expect(appSource).toContain("Cancel pending task");
    expect(appSource).toContain("Planned steps will not run.");
  });

  it("renders bounded Task Runtime approval controls for planner drafts", () => {
    expect(appSource).toContain("isTaskApprovalEligible");
    expect(appSource).toContain('state === "awaiting_confirmation"');
    expect(appSource).toContain("handleApproveTask");
    expect(appSource).toContain("approveTask(taskId)");
    expect(appSource).toContain('data-testid="task-approve"');
    expect(appSource).toContain("Approve and execute planner draft");
    expect(appSource).toContain("Only bounded L3 planner steps can run.");
  });

  it("renders a user-controlled memory center through Core IPC only", () => {
    expect(appSource).toContain('| "memory"');
    expect(appSource).toContain('{ id: "memory", icon: Database }');
    expect(appSource).toContain('data-testid="memory-view"');
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-summary"',
    );
    expect(appSource).toContain('data-testid="user-controlled-memory-list"');
    expect(appSource).toContain('data-testid="user-controlled-memory-record"');
    expect(appSource).toContain('data-testid="user-controlled-memory-delete"');
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-sanitized-snapshot"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-export-sanitized-snapshot"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-sanitized-snapshot-json"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-retention-session-controls"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-retention-session-status"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-retention-controls-disabled"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-session-only-toggle"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-expiration-control"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-retention-mutation-control"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-retention-policy-summary"',
    );
    expect(appSource).toContain("Retention / session controls");
    expect(appSource).toContain("Policy controls are visible for review");
    expect(appSource).toContain("Session-only memory disabled");
    expect(appSource).toContain("Expiration disabled");
    expect(appSource).toContain("Retention mutation disabled");
    expect(appSource).toContain("session-only writes");
    expect(appSource).toContain("expiration jobs remain disabled");
    expect(appSource).toContain(
      "buildSanitizedUserControlledMemorySnapshot",
    );
    expect(appSource).toContain(
      "validateSanitizedUserControlledMemorySnapshot",
    );
    expect(appSource).toContain(
      "USER_CONTROLLED_MEMORY_SNAPSHOT_SCHEMA_VERSION",
    );
    expect(appSource).toContain(
      'provenance: "USER_INITIATED_MEMORY_VIEW"',
    );
    expect(appSource).toContain(
      'redactionPolicy: "SANITIZED_VISIBLE_FIELDS_ONLY"',
    );
    expect(appSource).toContain('importPolicy: "NOT_ENABLED"');
    expect(appSource).toContain('restorePolicy: "NOT_ENABLED"');
    expect(appSource).toContain("rawContentExposed: false as const");
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-boundary"',
    );
    expect(appSource).toContain("filteredUserControlledMemories.map");
    expect(appSource).toContain("userControlledMemoryFilterOptions");
    expect(appSource).toContain("type UserControlledMemoryRiskFilter");
    expect(appSource).toContain("userControlledMemoryRiskFilterOptions");
    expect(appSource).toContain("setUserControlledMemoryRiskFilter");
    expect(appSource).toContain("userControlledMemorySortOptions");
    expect(appSource).toContain("setUserControlledMemorySort");
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-filter-bar"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-search"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-kind-filter"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-risk-filter"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-filter-summary"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-active-view-criteria"',
    );
    expect(appSource).toContain("userControlledMemoryActiveKindLabel");
    expect(appSource).toContain("userControlledMemoryActiveRiskLabel");
    expect(appSource).toContain("userControlledMemoryActiveSortLabel");
    expect(appSource).toContain("userControlledMemorySearchState");
    expect(appSource).toContain("Kind: {userControlledMemoryActiveKindLabel}");
    expect(appSource).toContain("Risk: {userControlledMemoryActiveRiskLabel}");
    expect(appSource).toContain("Sort: {userControlledMemoryActiveSortLabel}");
    expect(appSource).toContain("Search: {userControlledMemorySearchState}");
    expect(appSource).toContain('data-testid="user-controlled-memory-sort"');
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-reset-controls"',
    );
    expect(appSource).toContain('setUserControlledMemoryFilter("all")');
    expect(appSource).toContain('setUserControlledMemoryRiskFilter("all")');
    expect(appSource).toContain('setUserControlledMemorySort("updated_desc")');
    expect(appSource).toContain('setUserControlledMemoryQuery("")');
    expect(appSource).toContain(
      'data-testid={`user-controlled-memory-risk-filter-${option.id}`}',
    );
    expect(appSource).toContain('label: "All risk"');
    expect(appSource).toContain('label: "Low"');
    expect(appSource).toContain('label: "Medium"');
    expect(appSource).toContain('label: "High"');
    expect(appSource).toContain(
      'data-testid={`user-controlled-memory-sort-${option.id}`}',
    );
    expect(appSource).toContain('label: "Newest"');
    expect(appSource).toContain('label: "Oldest"');
    expect(appSource).toContain('label: "Kind"');
    expect(appSource).toContain(
      "No user-controlled memories match this filter.",
    );
    expect(appSource).toContain("handleRefreshUserControlledMemories");
    expect(appSource).toContain("handleDeleteUserControlledMemory");
    expect(appSource).toContain("UserControlledMemoryRecord");
    expect(appSource).toContain("formatUserControlledMemoryKey");
    expect(appSource).toContain("userControlledMemoryDeletePendingKey");
    expect(appSource).toContain("setUserControlledMemoryDeletePendingKey");
    expect(appSource).toContain("window.confirm");
    expect(appSource).toContain("Delete saved memory");
    expect(appSource).toContain("Delete user memory cancelled");
    expect(appSource).toContain("Deleting");
    expect(appSource).toContain("formatEventTime(memory.updatedAt)");
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-active-preference"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-raw-hidden"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-provider-neutral"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-delete-policy"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-disable-policy"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-disable"',
    );
    expect(appSource).toContain("RAW_HIDDEN");
    expect(appSource).toContain("PROVIDER_NEUTRAL");
    expect(appSource).toContain("VIEW_DELETE");
    expect(appSource).toContain("DISABLE_NOT_ENABLED");
    expect(appSource).toContain("Disable");
    expect(appSource).toContain("Active policy");
    expect(appSource).toContain("memory.preferenceKey");
    expect(appSource).toContain("memory.preferenceValue");
    expect(appSource).toContain("categorizedMemoryCount");
    expect(appSource).toContain("userControlledMemoryCountCheck");
    expect(appSource).toContain("preferenceMemoryCount");
    expect(appSource).toContain("deletableMemoryCount");
    expect(appSource).toContain("lockedMemoryCount");
    expect(appSource).toContain("disabledMemoryCount");
    expect(appSource).toContain("rawExposedMemoryCount");
    expect(appSource).toContain("userControlledMemorySafetyCheck");
    expect(appSource).toContain("providerNeutralMemoryCount");
    expect(appSource).toContain("userConfirmedRouteAliasSourceCount");
    expect(appSource).toContain("userConfirmedVoiceAliasSourceCount");
    expect(appSource).toContain("userConfirmedPreferenceSourceCount");
    expect(appSource).toContain("userControlledMemorySourceBoundaryCheck");
    expect(appSource).toContain("userControlledMemoryWritePolicy");
    expect(appSource).toContain("userControlledMemoryDeleteBoundary");
    expect(appSource).toContain("userControlledMemoryDisableControlBoundary");
    expect(appSource).toContain("userControlledMemoryDisableMutationBoundary");
    expect(appSource).toContain("userControlledMemorySnapshotPolicy");
    expect(appSource).toContain("userControlledMemoryRetentionScope");
    expect(appSource).toContain("userControlledMemoryExportBoundary");
    expect(appSource).toContain("userControlledMemoryImportBoundary");
    expect(appSource).toContain("userControlledMemoryEditBoundary");
    expect(appSource).toContain("userControlledMemoryRestoreBoundary");
    expect(appSource).toContain("userControlledMemoryAutoCaptureBoundary");
    expect(appSource).toContain(
      "userControlledMemoryBackgroundIndexingBoundary",
    );
    expect(appSource).toContain(
      "userControlledMemoryVectorIndexRetentionBoundary",
    );
    expect(appSource).toContain("userControlledMemoryPluginAccessBoundary");
    expect(appSource).toContain("userControlledMemoryExpirationBoundary");
    expect(appSource).toContain("userControlledMemorySessionOnlyBoundary");
    expect(appSource).toContain("userControlledMemoryProviderAuditBoundary");
    expect(appSource).toContain("userControlledMemoryAuditHistoryBoundary");
    expect(appSource).toContain("userControlledMemoryExternalSharingBoundary");
    expect(appSource).toContain("userControlledMemoryCloudSyncBoundary");
    expect(appSource).toContain("userControlledMemoryCloudAccountBoundary");
    expect(appSource).toContain(
      "userControlledMemoryStorageEncryptionBoundary",
    );
    expect(appSource).toContain("userControlledMemoryCredentialAccessBoundary");
    expect(appSource).toContain("userControlledMemoryNetworkAccessBoundary");
    expect(appSource).toContain("userControlledMemoryModelTrainingBoundary");
    expect(appSource).toContain("userControlledMemorySnapshotRedactionBoundary");
    expect(appSource).toContain("userControlledMemoryRawSnapshotReviewBoundary");
    expect(appSource).toContain(
      "userControlledMemorySnapshotSchemaValidationBoundary",
    );
    expect(appSource).toContain("userControlledMemorySnapshotProvenanceBoundary");
    expect(appSource).toContain("userControlledMemoryRetentionControlsBoundary");
    expect(appSource).toContain(
      "userControlledMemoryRetentionSessionControlMode",
    );
    expect(appSource).toContain(
      "userControlledMemoryRetentionMutationBoundary",
    );
    expect(appSource).toContain(
      "userControlledMemorySessionOnlyWriteBoundary",
    );
    expect(appSource).toContain("userControlledMemoryExpirationJobBoundary");
    expect(appSource).toContain('"STATUS_ONLY"');
    expect(appSource).toContain('"NO_RUNTIME_MUTATION"');
    expect(appSource).toContain("userControlledMemoryRecordingModeBoundary");
    expect(appSource).toContain("userControlledMemoryRecordingPauseBoundary");
    expect(appSource).toContain(
      "userControlledMemoryViewPersistenceBoundary",
    );
    expect(appSource).toContain(
      "userControlledMemorySearchPersistenceBoundary",
    );
    expect(appSource).toContain("userControlledMemorySavedViewPresetsBoundary");
    expect(appSource).toContain("userControlledMemoryDeletePendingState");
    expect(appSource).toContain(
      "USER_CONTROLLED_MEMORY_VIEW_STORAGE_KEY",
    );
    expect(appSource).toContain(
      "readInitialUserControlledMemoryViewPreferences",
    );
    expect(appSource).toContain(
      "persistUserControlledMemoryViewPreferences",
    );
    expect(appSource).toContain("lowRiskMemoryCount");
    expect(appSource).toContain("mediumRiskMemoryCount");
    expect(appSource).toContain("highRiskMemoryCount");
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-low-risk-count"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-medium-risk-count"',
    );
    expect(appSource).toContain(
      'data-testid="user-controlled-memory-high-risk-count"',
    );
    expect(appSource).toContain("Low risk");
    expect(appSource).toContain("Medium risk");
    expect(appSource).toContain("High risk");
    expect(appSource).toContain("chatAnswerPreferenceProjectionOn");
    expect(appSource).toContain("Preferences");
    expect(appSource).toContain("prefs");
    expect(appSource).toContain("Preference projection");
    expect(appSource).toContain("Applies to");
    expect(appSource).toContain("Chat Answer");
    expect(appSource).toContain('label="Memory count check"');
    expect(appSource).toContain("value={userControlledMemoryCountCheck}");
    expect(appSource).toContain('label="View controls"');
    expect(appSource).toContain('value="LOCAL ONLY"');
    expect(appSource).toContain('label="View persistence"');
    expect(appSource).toContain(
      "value={userControlledMemoryViewPersistenceBoundary}",
    );
    expect(appSource).toContain('"LOCAL_FILTERS"');
    expect(appSource).toContain('label="Search persistence"');
    expect(appSource).toContain(
      "value={userControlledMemorySearchPersistenceBoundary}",
    );
    expect(appSource).toContain('label="Visible records"');
    expect(appSource).toContain(
      "`${filteredUserControlledMemories.length}/${userControlledMemories.length}`",
    );
    expect(appSource).toContain('label="Deletable records"');
    expect(appSource).toContain("value={String(deletableMemoryCount)}");
    expect(appSource).toContain('label="Locked records"');
    expect(appSource).toContain("value={String(lockedMemoryCount)}");
    expect(appSource).toContain('label="Raw exposed records"');
    expect(appSource).toContain("value={String(rawExposedMemoryCount)}");
    expect(appSource).toContain(
      'rawExposedMemoryCount > 0 ? "SHOWN" : "HIDDEN"',
    );
    expect(appSource).toContain(
      'rawExposedMemoryCount === 0 ? "OK" : "REVIEW"',
    );
    expect(appSource).toContain('label="Memory safety check"');
    expect(appSource).toContain("value={userControlledMemorySafetyCheck}");
    expect(appSource).toContain('label="Provider-neutral records"');
    expect(appSource).toContain(
      "value={String(providerNeutralMemoryCount)}",
    );
    expect(appSource).toContain('label="Confirmed route sources"');
    expect(appSource).toContain(
      "value={String(userConfirmedRouteAliasSourceCount)}",
    );
    expect(appSource).toContain('label="Confirmed voice sources"');
    expect(appSource).toContain(
      "value={String(userConfirmedVoiceAliasSourceCount)}",
    );
    expect(appSource).toContain('label="Confirmed preference sources"');
    expect(appSource).toContain(
      "value={String(userConfirmedPreferenceSourceCount)}",
    );
    expect(appSource).toContain('label="Source boundary"');
    expect(appSource).toContain(
      "value={userControlledMemorySourceBoundaryCheck}",
    );
    expect(appSource).toContain('"USER_CONFIRMED"');
    expect(appSource).toContain('label="Write policy"');
    expect(appSource).toContain("value={userControlledMemoryWritePolicy}");
    expect(appSource).toContain('"EXPLICIT_ONLY"');
    expect(appSource).toContain('label="Delete boundary"');
    expect(appSource).toContain("value={userControlledMemoryDeleteBoundary}");
    expect(appSource).toContain('"CORE_IPC_REPOSITORY"');
    expect(appSource).toContain('label="Disable controls"');
    expect(appSource).toContain(
      "value={userControlledMemoryDisableControlBoundary}",
    );
    expect(appSource).toContain('label="Disable mutation"');
    expect(appSource).toContain(
      "value={userControlledMemoryDisableMutationBoundary}",
    );
    expect(appSource).toContain('label="Disabled records"');
    expect(appSource).toContain("value={String(disabledMemoryCount)}");
    expect(appSource).toContain('label="Snapshot policy"');
    expect(appSource).toContain("value={userControlledMemorySnapshotPolicy}");
    expect(appSource).toContain('"USER_INITIATED"');
    expect(appSource).toContain('label="Sanitized snapshot"');
    expect(appSource).toContain(
      "value={userControlledMemorySanitizedSnapshotBoundary}",
    );
    expect(appSource).toContain('label="Retention scope"');
    expect(appSource).toContain("value={userControlledMemoryRetentionScope}");
    expect(appSource).toContain('"USER_CONTROLLED_ONLY"');
    expect(appSource).toContain('label="Export boundary"');
    expect(appSource).toContain("value={userControlledMemoryExportBoundary}");
    expect(appSource).toContain('label="Import boundary"');
    expect(appSource).toContain("value={userControlledMemoryImportBoundary}");
    expect(appSource).toContain('"USER_INITIATED_ONLY"');
    expect(appSource).toContain(
      'const userControlledMemoryImportBoundary = "NOT_ENABLED"',
    );
    expect(appSource).toContain(
      'const userControlledMemoryExportImportBoundary = "EXPORT_ONLY"',
    );
    expect(appSource).toContain('label="Edit boundary"');
    expect(appSource).toContain("value={userControlledMemoryEditBoundary}");
    expect(appSource).toContain('label="Restore boundary"');
    expect(appSource).toContain("value={userControlledMemoryRestoreBoundary}");
    expect(appSource).toContain('"NOT_ENABLED"');
    expect(appSource).toContain('label="Auto capture"');
    expect(appSource).toContain(
      "value={userControlledMemoryAutoCaptureBoundary}",
    );
    expect(appSource).toContain('"DISABLED"');
    expect(appSource).toContain('label="Background indexing"');
    expect(appSource).toContain(
      "value={userControlledMemoryBackgroundIndexingBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryProactiveScanBoundary");
    expect(appSource).toContain('label="Proactive scan"');
    expect(appSource).toContain(
      "value={userControlledMemoryProactiveScanBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryProactiveSuggestionBoundary",
    );
    expect(appSource).toContain('label="Proactive suggestions"');
    expect(appSource).toContain(
      "value={userControlledMemoryProactiveSuggestionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryProactiveNotificationBoundary",
    );
    expect(appSource).toContain('label="Proactive notifications"');
    expect(appSource).toContain(
      "value={userControlledMemoryProactiveNotificationBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryContextPollingBoundary");
    expect(appSource).toContain('label="Context polling"');
    expect(appSource).toContain(
      "value={userControlledMemoryContextPollingBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryAutoExecutionBoundary");
    expect(appSource).toContain('label="Auto execution"');
    expect(appSource).toContain(
      "value={userControlledMemoryAutoExecutionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryPermissionOverrideBoundary",
    );
    expect(appSource).toContain('label="Permission override"');
    expect(appSource).toContain(
      "value={userControlledMemoryPermissionOverrideBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryRiskDowngradeBoundary");
    expect(appSource).toContain('label="Risk downgrade"');
    expect(appSource).toContain(
      "value={userControlledMemoryRiskDowngradeBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryConfirmationBypassBoundary",
    );
    expect(appSource).toContain('label="Confirmation bypass"');
    expect(appSource).toContain(
      "value={userControlledMemoryConfirmationBypassBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryAllowlistMutationBoundary",
    );
    expect(appSource).toContain('label="Allowlist mutation"');
    expect(appSource).toContain(
      "value={userControlledMemoryAllowlistMutationBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryWorkflowReplayBoundary");
    expect(appSource).toContain('label="Workflow replay"');
    expect(appSource).toContain(
      "value={userControlledMemoryWorkflowReplayBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryBackgroundTaskCreationBoundary",
    );
    expect(appSource).toContain('label="Background task creation"');
    expect(appSource).toContain(
      "value={userControlledMemoryBackgroundTaskCreationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryReminderSchedulingBoundary",
    );
    expect(appSource).toContain('label="Reminder scheduling"');
    expect(appSource).toContain(
      "value={userControlledMemoryReminderSchedulingBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryAutonomousFollowUpBoundary",
    );
    expect(appSource).toContain('label="Autonomous follow-up"');
    expect(appSource).toContain(
      "value={userControlledMemoryAutonomousFollowUpBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryOutboundMessagingBoundary",
    );
    expect(appSource).toContain('label="Outbound messaging"');
    expect(appSource).toContain(
      "value={userControlledMemoryOutboundMessagingBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryExternalTriggerBoundary",
    );
    expect(appSource).toContain('label="External triggers"');
    expect(appSource).toContain(
      "value={userControlledMemoryExternalTriggerBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryClipboardObservationBoundary",
    );
    expect(appSource).toContain('label="Clipboard observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryClipboardObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryKeystrokeObservationBoundary",
    );
    expect(appSource).toContain('label="Keystroke observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryKeystrokeObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryWindowObservationBoundary",
    );
    expect(appSource).toContain('label="Window observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryWindowObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryScreenObservationBoundary",
    );
    expect(appSource).toContain('label="Screen observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryScreenObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryFileObservationBoundary",
    );
    expect(appSource).toContain('label="File observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryFileObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryCameraObservationBoundary",
    );
    expect(appSource).toContain('label="Camera observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryCameraObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryMicrophoneObservationBoundary",
    );
    expect(appSource).toContain('label="Microphone observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryMicrophoneObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryBrowserHistoryObservationBoundary",
    );
    expect(appSource).toContain('label="Browser history observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryBrowserHistoryObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryLocationObservationBoundary",
    );
    expect(appSource).toContain('label="Location observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryLocationObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryContactsObservationBoundary",
    );
    expect(appSource).toContain('label="Contacts observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryContactsObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryCalendarObservationBoundary",
    );
    expect(appSource).toContain('label="Calendar observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryCalendarObservationBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryEmailObservationBoundary");
    expect(appSource).toContain('label="Email observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryEmailObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryMessagingObservationBoundary",
    );
    expect(appSource).toContain('label="Messaging observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryMessagingObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryCredentialObservationBoundary",
    );
    expect(appSource).toContain('label="Credential observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryCredentialObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryPaymentObservationBoundary",
    );
    expect(appSource).toContain('label="Payment observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryPaymentObservationBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryHealthObservationBoundary");
    expect(appSource).toContain('label="Health observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryHealthObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryBiometricObservationBoundary",
    );
    expect(appSource).toContain('label="Biometric observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryBiometricObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryGovernmentIdObservationBoundary",
    );
    expect(appSource).toContain('label="Government ID observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryGovernmentIdObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryFinancialAccountObservationBoundary",
    );
    expect(appSource).toContain('label="Financial account observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryFinancialAccountObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryLegalDocumentObservationBoundary",
    );
    expect(appSource).toContain('label="Legal document observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryLegalDocumentObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryRepositoryObservationBoundary",
    );
    expect(appSource).toContain('label="Repository observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryRepositoryObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryCloudStorageObservationBoundary",
    );
    expect(appSource).toContain('label="Cloud storage observation"');
    expect(appSource).toContain(
      "value={userControlledMemoryCloudStorageObservationBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryAnalyticsProfilingBoundary",
    );
    expect(appSource).toContain('label="Analytics profiling"');
    expect(appSource).toContain(
      "value={userControlledMemoryAnalyticsProfilingBoundary}",
    );
    expect(appSource).toContain('label="Vector index retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryVectorIndexRetentionBoundary}",
    );
    expect(appSource).toContain('label="Plugin access"');
    expect(appSource).toContain(
      "value={userControlledMemoryPluginAccessBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryWorkflowAccessBoundary",
    );
    expect(appSource).toContain('label="Workflow access"');
    expect(appSource).toContain(
      "value={userControlledMemoryWorkflowAccessBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryTeachModeAccessBoundary");
    expect(appSource).toContain('label="Teach Mode access"');
    expect(appSource).toContain(
      "value={userControlledMemoryTeachModeAccessBoundary}",
    );
    expect(appSource).toContain("userControlledMemorySkinAccessBoundary");
    expect(appSource).toContain('label="Skin access"');
    expect(appSource).toContain(
      "value={userControlledMemorySkinAccessBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryPetAccessBoundary");
    expect(appSource).toContain('label="Pet access"');
    expect(appSource).toContain(
      "value={userControlledMemoryPetAccessBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryPersonalityAccessBoundary",
    );
    expect(appSource).toContain('label="Personality access"');
    expect(appSource).toContain(
      "value={userControlledMemoryPersonalityAccessBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryCustomUiAccessBoundary");
    expect(appSource).toContain('label="Custom UI access"');
    expect(appSource).toContain(
      "value={userControlledMemoryCustomUiAccessBoundary}",
    );
    expect(appSource).toContain('"NOT_GRANTED"');
    expect(appSource).toContain('label="Expiration control"');
    expect(appSource).toContain(
      "value={userControlledMemoryExpirationBoundary}",
    );
    expect(appSource).toContain('label="Session-only mode"');
    expect(appSource).toContain(
      "value={userControlledMemorySessionOnlyBoundary}",
    );
    expect(appSource).toContain('label="Provider audit"');
    expect(appSource).toContain(
      "value={userControlledMemoryProviderAuditBoundary}",
    );
    expect(appSource).toContain('label="Audit history"');
    expect(appSource).toContain(
      "value={userControlledMemoryAuditHistoryBoundary}",
    );
    expect(appSource).toContain('label="External sharing"');
    expect(appSource).toContain(
      "value={userControlledMemoryExternalSharingBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryCommunitySharingBoundary",
    );
    expect(appSource).toContain('label="Community sharing"');
    expect(appSource).toContain(
      "value={userControlledMemoryCommunitySharingBoundary}",
    );
    expect(appSource).toContain('label="Cloud sync"');
    expect(appSource).toContain(
      "value={userControlledMemoryCloudSyncBoundary}",
    );
    expect(appSource).toContain('label="Cloud account"');
    expect(appSource).toContain(
      "value={userControlledMemoryCloudAccountBoundary}",
    );
    expect(appSource).toContain('"NOT_CONFIGURED"');
    expect(appSource).toContain('label="Storage encryption"');
    expect(appSource).toContain(
      "value={userControlledMemoryStorageEncryptionBoundary}",
    );
    expect(appSource).toContain('label="Credential access"');
    expect(appSource).toContain(
      "value={userControlledMemoryCredentialAccessBoundary}",
    );
    expect(appSource).toContain('"NO_ACCESS"');
    expect(appSource).toContain('label="Network access"');
    expect(appSource).toContain(
      "value={userControlledMemoryNetworkAccessBoundary}",
    );
    expect(appSource).toContain('label="Model training"');
    expect(appSource).toContain(
      "value={userControlledMemoryModelTrainingBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryTrainingExportBoundary");
    expect(appSource).toContain('label="Training export"');
    expect(appSource).toContain(
      "value={userControlledMemoryTrainingExportBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryProviderPersonalizationBoundary",
    );
    expect(appSource).toContain('label="Provider personalization"');
    expect(appSource).toContain(
      "value={userControlledMemoryProviderPersonalizationBoundary}",
    );
    expect(appSource).toContain("userControlledMemoryPromptInjectionBoundary");
    expect(appSource).toContain('label="Prompt injection"');
    expect(appSource).toContain(
      "value={userControlledMemoryPromptInjectionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryRawAudioRetentionBoundary",
    );
    expect(appSource).toContain('label="Raw audio retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryRawAudioRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryRawTranscriptRetentionBoundary",
    );
    expect(appSource).toContain('label="Raw transcript retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryRawTranscriptRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryScreenCaptureRetentionBoundary",
    );
    expect(appSource).toContain('label="Screen capture retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryScreenCaptureRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryFileContentRetentionBoundary",
    );
    expect(appSource).toContain('label="File content retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryFileContentRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryClipboardRetentionBoundary",
    );
    expect(appSource).toContain('label="Clipboard retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryClipboardRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemorySecretRetentionBoundary",
    );
    expect(appSource).toContain('label="Secret retention"');
    expect(appSource).toContain(
      "value={userControlledMemorySecretRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryPaymentDataRetentionBoundary",
    );
    expect(appSource).toContain('label="Payment data retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryPaymentDataRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryLocationRetentionBoundary",
    );
    expect(appSource).toContain('label="Location retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryLocationRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryBiometricRetentionBoundary",
    );
    expect(appSource).toContain('label="Biometric retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryBiometricRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryContactRetentionBoundary",
    );
    expect(appSource).toContain('label="Contact retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryContactRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryHealthRetentionBoundary",
    );
    expect(appSource).toContain('label="Health retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryHealthRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryCalendarRetentionBoundary",
    );
    expect(appSource).toContain('label="Calendar retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryCalendarRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryEmailRetentionBoundary",
    );
    expect(appSource).toContain('label="Email retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryEmailRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryIdentityDocumentRetentionBoundary",
    );
    expect(appSource).toContain('label="Identity document retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryIdentityDocumentRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryBrowserHistoryRetentionBoundary",
    );
    expect(appSource).toContain('label="Browser history retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryBrowserHistoryRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryCookieRetentionBoundary",
    );
    expect(appSource).toContain('label="Cookie retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryCookieRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryDownloadHistoryRetentionBoundary",
    );
    expect(appSource).toContain('label="Download history retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryDownloadHistoryRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryAutofillRetentionBoundary",
    );
    expect(appSource).toContain('label="Autofill retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryAutofillRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryCredentialRetentionBoundary",
    );
    expect(appSource).toContain('label="Credential retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryCredentialRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryDeviceIdentifierRetentionBoundary",
    );
    expect(appSource).toContain('label="Device identifier retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryDeviceIdentifierRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryNetworkIdentifierRetentionBoundary",
    );
    expect(appSource).toContain('label="Network identifier retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryNetworkIdentifierRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryCrashDumpRetentionBoundary",
    );
    expect(appSource).toContain('label="Crash dump retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryCrashDumpRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryErrorReportRetentionBoundary",
    );
    expect(appSource).toContain('label="Error report retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryErrorReportRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryTelemetryPayloadRetentionBoundary",
    );
    expect(appSource).toContain('label="Telemetry payload retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryTelemetryPayloadRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryModelCacheRetentionBoundary",
    );
    expect(appSource).toContain('label="Model cache retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryModelCacheRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryPromptCacheRetentionBoundary",
    );
    expect(appSource).toContain('label="Prompt cache retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryPromptCacheRetentionBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryTaskHistoryRetentionBoundary",
    );
    expect(appSource).toContain('label="Task history retention"');
    expect(appSource).toContain(
      "value={userControlledMemoryTaskHistoryRetentionBoundary}",
    );
    expect(appSource).toContain('label="Snapshot redaction"');
    expect(appSource).toContain(
      "value={userControlledMemorySnapshotRedactionBoundary}",
    );
    expect(appSource).toContain('"SANITIZED_ONLY"');
    expect(appSource).toContain('label="Raw snapshot review"');
    expect(appSource).toContain(
      "value={userControlledMemoryRawSnapshotReviewBoundary}",
    );
    expect(appSource).toContain('label="Snapshot schema validation"');
    expect(appSource).toContain(
      "value={userControlledMemorySnapshotSchemaValidationBoundary}",
    );
    expect(appSource).toContain('"REQUIRED"');
    expect(appSource).toContain('label="Snapshot provenance"');
    expect(appSource).toContain(
      "value={userControlledMemorySnapshotProvenanceBoundary}",
    );
    expect(appSource).toContain('"USER_CONFIRMED_ONLY"');
    expect(appSource).toContain('label="Retention controls"');
    expect(appSource).toContain(
      "value={userControlledMemoryRetentionControlsBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryExportImportBoundary",
    );
    expect(appSource).toContain('label="Export/import"');
    expect(appSource).toContain(
      "value={userControlledMemoryExportImportBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryEditRestoreBoundary",
    );
    expect(appSource).toContain('label="Edit/restore"');
    expect(appSource).toContain(
      "value={userControlledMemoryEditRestoreBoundary}",
    );
    expect(appSource).toContain(
      "userControlledMemoryProviderSyncBoundary",
    );
    expect(appSource).toContain('label="Provider sync"');
    expect(appSource).toContain(
      "value={userControlledMemoryProviderSyncBoundary}",
    );
    expect(appSource).toContain('label="Recording mode"');
    expect(appSource).toContain(
      "value={userControlledMemoryRecordingModeBoundary}",
    );
    expect(appSource).toContain('"MANUAL_ONLY"');
    expect(appSource).toContain('label="Recording pause"');
    expect(appSource).toContain(
      "value={userControlledMemoryRecordingPauseBoundary}",
    );
    expect(appSource).toContain('label="Saved view presets"');
    expect(appSource).toContain(
      "value={userControlledMemorySavedViewPresetsBoundary}",
    );
    expect(appSource).toContain('label="Delete pending"');
    expect(appSource).toContain(
      "value={userControlledMemoryDeletePendingState}",
    );
    expect(appSource).toContain("Vector retrieval");
    expect(appSource).toContain("VIEW / DELETE ONLY");
    expect(appSource).not.toContain("formatShortTime");
    expect(appSource).not.toContain("user-controlled-memories.json");
  });

  it("renders a read-only Plugin Management status projection", () => {
    expect(appSource).toContain('data-testid="plugin-management-panel"');
    expect(appSource).toContain('data-testid="plugin-card"');
    expect(appSource).toContain(
      'data-testid="plugin-management-state-summary"',
    );
    expect(appSource).toContain('data-testid="plugin-management-safety"');
    expect(appSource).toContain('data-testid="plugin-mcp-adapter-status"');
    expect(appSource).toContain('data-testid="plugin-mcp-adapter-reason"');
    expect(appSource).toContain(
      'data-testid="local-plugin-manifest-developer-status"',
    );
    expect(appSource).toContain(
      'data-testid="local-plugin-manifest-directory-status"',
    );
    expect(appSource).toContain('data-testid="local-plugin-manifest-issue"');
    expect(appSource).toContain("Plugin Management");
    expect(appSource).toContain("pluginManagementStatus");
    expect(appSource).toContain("localPluginManifestDeveloperStatus");
    expect(appSource).toContain("refreshPlugins");
    expect(appSource).toContain("refreshLocalPluginManifestDeveloperStatus");
    expect(appSource).toContain("plugin.reasonCodes");
    expect(appSource).toContain("plugin.riskAssessment.declaredRiskTier");
    expect(appSource).toContain("plugin.riskAssessment.effectiveRiskTier");
    expect(appSource).toContain("plugin.riskAssessment.confirmationPolicy");
    expect(appSource).toContain('data-testid="plugin-permission-status"');
    expect(appSource).toContain('data-testid="plugin-risk-reason"');
    expect(appSource).toContain("permission.permissionState");
    expect(appSource).toContain(
      "pluginManagementStatus?.thirdPartyCodeExecuted",
    );
    expect(appSource).toContain("pluginManagementStatus?.marketplaceAccessed");
    expect(appSource).toContain("pluginManagementStatus?.mcpAdapter.status");
    expect(appSource).toContain("externalServerStartupAllowed");
    expect(appSource).toContain("externalToolExecutionAllowed");
    expect(appSource).toContain("toolCallForwardingAllowed");
    expect(appSource).toContain("rawPathsExposed");
    expect(appSource).toContain("installOrEnableActionExposed");
    expect(appSource).toContain("stateToggleActionExposed");
    expect(appSource).toContain("setLocalPluginEnabledState");
    expect(appSource).toContain('data-testid="local-plugin-state-toggle"');
    expect(appSource).not.toContain("setPluginEnabled");
  });

  it("uses the lower-left gear as general settings", () => {
    expect(appSource).toContain("aria-label={copy.label.generalSettings}");
    expect(appSource).toContain('data-testid="general-settings"');
    expect(appSource).toContain('onClick={() => handleSelectView("settings")}');
    expect(appSource).toContain('data-testid="settings-open-voice-settings"');
    expect(appSource).toContain("Voice Settings");
    expect(appSource).toContain('data-testid="settings-toggle-inspector"');
    expect(appSource).toContain('data-testid="settings-refresh-memory-alpha"');
    expect(appSource).toContain(
      'data-testid="settings-refresh-model-governance"',
    );
  });

  it("renders provider-backed Chat Answer product mode controls as default-off fixture-only UI", () => {
    expect(appSource).toContain(
      'data-testid="settings-chat-answer-product-mode-toggle"',
    );
    expect(appSource).toContain(
      'data-testid="settings-refresh-chat-answer-product-mode"',
    );
    expect(appSource).toContain(
      'data-testid="settings-chat-answer-product-mode-notice"',
    );
    expect(appSource).toContain("Provider-backed answer control");
    expect(appSource).toContain("real runtime remains locked");
    expect(appSource).toContain(
      "real runtime armed for one approved fixed text call",
    );
    expect(appSource).toContain("one approved provider call");
    expect(appSource).toContain("credential readiness");
    expect(appSource).toContain("setChatAnswerProductModeEnabled");
  });

  it("renders Command Router product mode controls as default-off fixture-only UI", () => {
    expect(appSource).toContain(
      'data-testid="settings-command-router-product-mode-toggle"',
    );
    expect(appSource).toContain(
      'data-testid="settings-refresh-command-router-product-mode"',
    );
    expect(appSource).toContain(
      'data-testid="settings-command-router-product-mode-notice"',
    );
    expect(appSource).toContain("Deterministic router control");
    expect(appSource).toContain("deterministic fixture projection only");
    expect(appSource).toContain("Approved local app launches remain");
    expect(appSource).toContain("Qwen is status-only");
    expect(appSource).toContain(
      'data-testid="settings-command-router-qwen-binding"',
    );
    expect(appSource).toContain(
      'data-testid="settings-command-router-qwen-status"',
    );
    expect(appSource).toContain(
      'data-testid="settings-command-router-qwen-gates"',
    );
    expect(appSource).toContain(
      'data-testid="settings-command-router-qwen-activation"',
    );
    expect(appSource).toContain(
      'data-testid="settings-command-router-qwen-activation-gates"',
    );
    expect(appSource).toContain("conversationSurfaceProductRoute");
    expect(appSource).toContain("persistentOptIn");
    expect(appSource).toContain("Conversation route");
    expect(appSource).toContain("Route selectable");
    expect(appSource).toContain("Persistent opt-in");
    expect(appSource).toContain("Session scope");
    expect(appSource).toContain("Qwen Fast Router");
    expect(appSource).toContain("intent-router.qwen3-0.6b");
    expect(appSource).toContain("no runtime status only");
    expect(appSource).toContain("Product routing");
    expect(appSource).toContain("Runtime access");
    expect(appSource).toContain("Artifact access");
    expect(appSource).toContain("Cache change");
    expect(appSource).toContain("Activation policy");
    expect(appSource).toContain(
      "qwen-product-routing.activation.default-off.v1",
    );
    expect(appSource).toContain("product route off");
    expect(appSource).toContain("fixture rollback");
    expect(appSource).toContain("Approved local app launches remain");
    expect(appSource).toContain("setCommandRouterProductModeEnabled");
  });

  it("projects low-risk known app policy without implying double confirmation", () => {
    expect(appSource).toContain(
      "Low-risk known apps run through Task Runtime with visible",
    );
    expect(appSource).toContain(
      "status; unclear targets still require confirmation.",
    );
    expect(appSource).toContain(
      'data-testid="confirm-command-router-local-app-launch"',
    );
    expect(appSource).not.toContain(
      "Explicit approval only; Notepad and Calculator are the only",
    );
  });

  it("renders bounded Qwen UI/IPC runtime control surface", () => {
    expect(appSource).toContain(
      'data-testid="settings-command-router-qwen-runtime-control"',
    );
    expect(appSource).toContain(
      'data-testid="settings-command-router-qwen-runtime-control-status"',
    );
    expect(appSource).toContain(
      'data-testid="settings-refresh-qwen-runtime-control"',
    );
    expect(appSource).toContain(
      'data-testid="settings-command-router-qwen-runtime-control-start"',
    );
    expect(appSource).toContain(
      'data-testid="settings-command-router-qwen-runtime-control-stop"',
    );
    expect(appSource).toContain(
      'data-testid="settings-command-router-qwen-runtime-control-rollback"',
    );
    expect(appSource).toContain("Retained Qwen session control");
    expect(appSource).toContain("Route count");
    expect(appSource).toContain("Helper starts");
    expect(appSource).toContain("Gen probes");
    expect(appSource).toContain("Shutdown");
    expect(appSource).toContain("explicit opt-in");
    expect(appSource).toContain("Notepad/Calculator only");
    expect(appSource).toContain("qwenRuntimeControlStatus");
    expect(appSource).toContain("refreshQwenRuntimeControlStatus");
    expect(appSource).toContain("setQwenRuntimeControlAction");
    expect(appSource).toContain("handleQwenRuntimeControlAction");
  });

  it("renders Command Router safety projection for Brain results", () => {
    expect(appSource).toContain(
      'data-testid="command-router-safety-projection"',
    );
    expect(appSource).toContain(
      'data-testid="command-router-selected-provider"',
    );
    expect(appSource).toContain('data-testid="command-router-direct-action"');
    expect(appSource).toContain(
      "brainResult.routerSelection.selectedProviderId",
    );
    expect(appSource).toContain(
      "brainResult.routerSelection.directActionAttempted",
    );
  });

  it("offers a persisted English and Chinese UI language switch", () => {
    expect(appSource).toContain('type UiLanguage = "en" | "zh"');
    expect(appSource).toContain(
      'LANGUAGE_STORAGE_KEY = "jarvis-k-ui-language"',
    );
    expect(appSource).toContain("readInitialLanguage");
    expect(appSource).toContain("const [uiLanguage, setUiLanguage]");
    expect(appSource).toContain("handleSelectLanguage");
    expect(appSource).toContain("data-ui-language={uiLanguage}");
    expect(appSource).toContain('data-testid="language-settings"');
    expect(appSource).toContain('data-testid="language-zh"');
    expect(appSource).toContain('data-testid="language-en"');
    expect(appSource).toContain("语言");
    expect(appSource).toContain("Current UI language");
  });

  it("offers a persisted safe built-in skin theme switch", () => {
    expect(appSource).toContain('type SkinThemeId = "signal" | "harbor" | "ember"');
    expect(appSource).toContain(
      'THEME_STORAGE_KEY = "jarvis-k-ui-theme"',
    );
    expect(appSource).toContain("builtInSkinThemes");
    expect(appSource).toContain("readInitialSkinTheme");
    expect(appSource).toContain("isSkinThemeId");
    expect(appSource).toContain("const [skinTheme, setSkinTheme]");
    expect(appSource).toContain("handleSelectSkinTheme");
    expect(appSource).toContain("root.dataset.jarvisTheme = skinTheme");
    expect(appSource).toContain("data-skin-theme={skinTheme}");
    expect(appSource).toContain('data-testid="skin-theme-settings"');
    expect(appSource).toContain('data-testid="skin-theme-current"');
    expect(appSource).toContain("data-testid={`skin-theme-${theme.id}`}");
    expect(appSource).toContain('data-testid="skin-theme-safety"');
    expect(appSource).toContain("builtin_theme_schema_v1");
    expect(appSource).toContain("No executable skin code");
  });

  it("localizes visible runtime metric labels", () => {
    expect(appSource).toContain("metric: {");
    expect(appSource).toContain('coreHealth: "核心状态"');
    expect(appSource).toContain('runtimeMode: "运行模式"');
    expect(appSource).toContain('voiceEngine: "语音引擎"');
    expect(appSource).toContain('alphaState: "Alpha 状态"');
    expect(appSource).toContain('providers: "Provider"');
    expect(appSource).toContain("label={copy.metric.coreHealth}");
    expect(appSource).toContain("label={copy.metric.runtimeMode}");
    expect(appSource).toContain("label={copy.metric.voiceEngine}");
    expect(appSource).toContain("label={copy.metric.alphaState}");
    expect(appSource).toContain("label={copy.metric.providers}");
    expect(appSource).toContain("copy.value.shown");
    expect(appSource).toContain("copy.value.hidden");
  });

  it("shows command feedback for diagnostic actions", () => {
    expect(appSource).toContain("const [lastAction, setLastAction]");
    expect(appSource).toContain("trackAction(");
    expect(appSource).toContain("notifyAction(");
    expect(appSource).toContain('data-testid="last-action-status"');
    expect(appSource).toContain("running");
    expect(appSource).toContain("Memory alpha refreshed");
    expect(appSource).toContain("Model governance refreshed");
    expect(appSource).toContain("Fixture embedding completed");
  });

  it("renders voice command correction candidates and alias controls", () => {
    expect(appSource).toContain('data-testid="voice-correction-candidates"');
    expect(appSource).toContain(
      'data-testid="voice-correction-raw-transcript"',
    );
    expect(appSource).toContain('data-testid="voice-correction-candidate"');
    expect(appSource).toContain("brainResult?.voiceCorrection");
    expect(appSource).toContain("brainResult.correctionCandidates.map");
    expect(appSource).toContain("handleConfirmVoiceCommandCorrection");
    expect(appSource).toContain("confirmVoiceCommandCorrection(candidate)");
    expect(appSource).toContain("formatVoiceCorrectionSlots");
    expect(appSource).toContain("candidate.slots");
    expect(appSource).toContain('data-testid="voice-command-aliases"');
    expect(appSource).toContain('data-testid="voice-command-alias-refresh"');
    expect(appSource).toContain('data-testid="voice-command-alias"');
    expect(appSource).toContain('data-testid="voice-command-alias-delete"');
    expect(appSource).toContain("voiceCommandAliases.map");
    expect(appSource).toContain("handleDeleteVoiceCommandAlias(alias.id)");
    expect(appSource).toContain("refreshVoiceCommandAliases");
  });

  it("renders Brain Alpha dispatch results for typed commands", () => {
    expect(appSource).toContain("brainResult");
    expect(appSource).toContain("runBrainCommand");
    expect(appSource).toContain('data-testid="brain-dispatch-panel"');
    expect(appSource).toContain('data-testid="brain-source"');
    expect(appSource).toContain('data-testid="brain-intent"');
    expect(appSource).toContain("copy.label.brainDispatch");
    expect(appSource).toContain("copy.label.brainSource");
    expect(appSource).toContain("brainResult.source");
    expect(appSource).toContain("brainResult.decision.intent");
    expect(appSource).toContain("brainResult.dispatchStatus");
    expect(appSource).toContain("brainResult.plan.map");
  });

  it("renders the Stage 4 Tool Registry product loop projection", () => {
    expect(appSource).toContain("toolProductLoop");
    expect(appSource).toContain("selectedToolDescriptor");
    expect(appSource).toContain('data-testid="tool-product-loop-panel"');
    expect(appSource).toContain('data-testid="tool-loop-selected-tool"');
    expect(appSource).toContain('data-testid="tool-loop-safety"');
    expect(appSource).toContain('data-testid="tool-loop-result"');
    expect(appSource).toContain('data-testid="tool-loop-lifecycle"');
    expect(appSource).toContain("toolProductLoop.lifecycle.map");
    expect(appSource).toContain("toolProductLoop.rawDiagnosticsExposed");
  });

  it("renders Stage 5 Product Alpha history, safe retry, and local TTS controls", () => {
    expect(appSource).toContain("stage5Copy");
    expect(appSource).toContain("产品 Alpha");
    expect(appSource).toContain("alphaHardening");
    expect(appSource).toContain("sessionHistory");
    expect(appSource).toContain('data-testid="stage5-alpha-panel"');
    expect(appSource).toContain('data-testid="stage5-session-history"');
    expect(appSource).toContain('data-testid="stage5-retry"');
    expect(appSource).toContain('data-testid="stage5-rollback"');
    expect(appSource).toContain('data-testid="stage5-clear-history"');
    expect(appSource).toContain('data-testid="stage5-local-tts"');
    expect(appSource).toContain('data-testid="settings-local-tts-toggle"');
    expect(appSource).toContain("retryBrainCommand");
    expect(appSource).toContain("rollbackBrainResult");
    expect(appSource).toContain("clearSessionHistory");
    expect(appSource).toContain("speechSynthesis");
    expect(appSource).toContain("localTtsEnabled");
    expect(appSource).toContain("localTtsEligible");
  });

  it("shows voice service language diagnostics in the main UI", () => {
    expect(appSource).toContain("voiceServiceStatus");
    expect(appSource).toContain("voiceServiceLanguage");
    expect(appSource).toContain("voiceLanguageMismatch");
    expect(appSource).toContain('data-testid="voice-language-warning"');
    expect(appSource).toContain(
      'data-testid="settings-voice-language-warning"',
    );
    expect(appSource).toContain("copy.label.voiceRecognitionLanguage");
    expect(appSource).toContain("copy.label.voiceLanguageMismatch");
    expect(appSource).toContain("语音识别当前是 English");
  });

  it("shows microphone capture state and failure diagnostics", () => {
    expect(appSource).toContain("voiceCaptureNotice");
    expect(appSource).toContain("copy.voiceCaptureNotice");
    expect(appSource).toContain("copy.metric.micCapture");
    expect(appSource).toContain('data-testid="voice-capture-notice"');
    expect(appSource).toContain('data-testid="voice-capture-error-detail"');
    expect(appSource).toContain('data-testid="settings-voice-capture-notice"');
    expect(appSource).toContain(
      'data-testid="settings-voice-capture-error-detail"',
    );
    expect(appSource).toContain("ptt.state");
    expect(appSource).toContain("ptt.captureNotice");
    expect(appSource).toContain("ptt.commandError");
    expect(appSource).toContain("formatPttCommandError");
    expect(appSource).toContain("语音服务无法启动 PTT 会话");
    expect(appSource).toContain("voiceModeUnavailable");
  });

  it("prefers primary voice errors over secondary stop cleanup errors", () => {
    expect(appSource).toContain("latestVoiceError");
    expect(appSource).toContain("isSecondaryVoiceStopError");
    expect(appSource).toContain('envelope.event.type === "voice.error"');
  });

  it("explains blocked developer-alpha controls instead of leaving them inert", () => {
    expect(appSource).toContain("handleDisableMemoryAlpha");
    expect(appSource).toContain("Memory alpha is");
    expect(appSource).toContain("Fixture embedding provider unavailable");
    expect(appSource).toContain("Fixture intent router unavailable");
    expect(appSource).toContain("Fixture OCR provider unavailable");
    expect(appSource).toContain("Fixture reranker unavailable");
    expect(appSource).toContain("Paste memory snapshot JSON first");
    expect(appSource).toContain("Enter recall probe text first");
    expect(appSource).toContain("Type a command first");
  });

  it("makes the inspector toggle stateful instead of decorative", () => {
    expect(appSource).toContain("const [inspectorOpen, setInspectorOpen]");
    expect(appSource).toContain('data-testid="toggle-inspector"');
    expect(appSource).toContain("setInspectorOpen((open) => !open)");
  });

  it("renders local capability runtime indicators visibly", () => {
    expect(appSource).toContain("RUNTIME MODE");
    expect(appSource).toContain("GPU COUNT");
    expect(appSource).toContain("ACCELERATION");
    expect(appSource).toContain("refreshCapabilities");
  });

  it("renders model governance controls visibly", () => {
    expect(appSource).toContain('data-testid="model-governance"');
    expect(appSource).toContain('data-testid="refresh-model-governance"');
    expect(appSource).toContain('data-testid="run-fixture-embedding"');
    expect(appSource).toContain('data-testid="run-fixture-intent"');
    expect(appSource).toContain('data-testid="run-fixture-ocr"');
    expect(appSource).toContain('data-testid="run-fixture-reranker"');
    expect(appSource).toContain("Model Governance");
    expect(appSource).toContain("CANDIDATES");
    expect(appSource).toContain("DOWNLOADABLE");
    expect(appSource).toContain("PROVIDERS");
    expect(appSource).toContain("AVAILABLE");
    expect(appSource).toContain("INSTALLABLE");
    expect(appSource).toContain("BLOCKED");
    expect(appSource).toContain("OPERATIONS");
    expect(appSource).toContain("ACTIVE OPS");
    expect(appSource).toContain("RESOURCE MEM");
    expect(appSource).toContain("RESOURCE VRAM");
    expect(appSource).toContain("RESOURCE LEASES");
    expect(appSource).toContain("FIXTURE");
    expect(appSource).toContain("VECTOR DIMS");
    expect(appSource).toContain("INFERENCE");
    expect(appSource).toContain("INTENT ROUTER");
    expect(appSource).toContain("ROUTE");
    expect(appSource).toContain("OCR TEXT");
    expect(appSource).toContain("OCR BLOCKS");
    expect(appSource).toContain("OCR OPS");
    expect(appSource).toContain("RERANKER");
    expect(appSource).toContain("TOP DOC");
    expect(appSource).toContain("RERANKED");
    expect(appSource).toContain("RERANK OPS");
    expect(appSource).toContain("refreshModelGovernance");
    expect(appSource).toContain("runFixtureEmbeddingProbe");
    expect(appSource).toContain("runFixtureIntentProbe");
    expect(appSource).toContain("runFixtureOcrProbe");
    expect(appSource).toContain("runFixtureRerankProbe");
  });

  it("labels model operation events in the activity stream", () => {
    expect(appSource).toContain('case "model.operation.updated"');
    expect(appSource).toContain("event.payload.phase");
  });

  it("fails closed instead of leaving action status stuck when tracked actions reject", () => {
    expect(appSource).toContain("function formatActionError");
    expect(appSource).toContain("catch (caught)");
    expect(appSource).toContain("formatActionError(caught)");
    expect(appSource).toContain("copy.action.failed");
    expect(appSource).toContain('tone: "warning"');
  });
});
