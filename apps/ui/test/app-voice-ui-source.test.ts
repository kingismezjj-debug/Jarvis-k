import { describe, expect, it } from "vitest";

import { readAppCompositionSource } from "./read-ui-source";

const appSource = readAppCompositionSource();

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
    expect(appSource).toContain("onSelect={onSelectView}");
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
    expect(appSource).toContain('data-testid="user-controlled-memory-summary"');
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
    expect(appSource).toContain("buildSanitizedUserControlledMemorySnapshot");
    expect(appSource).toContain(
      "validateSanitizedUserControlledMemorySnapshot",
    );
    expect(appSource).toContain(
      "USER_CONTROLLED_MEMORY_SNAPSHOT_SCHEMA_VERSION",
    );
    expect(appSource).toContain('provenance: "USER_INITIATED_MEMORY_VIEW"');
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
    expect(appSource).toContain('data-testid="user-controlled-memory-search"');
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
      "data-testid={`user-controlled-memory-risk-filter-${option.id}`}",
    );
    expect(appSource).toContain('label: "All risk"');
    expect(appSource).toContain('label: "Low"');
    expect(appSource).toContain('label: "Medium"');
    expect(appSource).toContain('label: "High"');
    expect(appSource).toContain(
      "data-testid={`user-controlled-memory-sort-${option.id}`}",
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
    expect(appSource).toContain('data-testid="user-controlled-memory-disable"');
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
    expect(appSource).toContain(
      "userControlledMemorySnapshotRedactionBoundary",
    );
    expect(appSource).toContain(
      "userControlledMemoryRawSnapshotReviewBoundary",
    );
    expect(appSource).toContain(
      "userControlledMemorySnapshotSchemaValidationBoundary",
    );
    expect(appSource).toContain(
      "userControlledMemorySnapshotProvenanceBoundary",
    );
    expect(appSource).toContain(
      "userControlledMemoryRetentionControlsBoundary",
    );
    expect(appSource).toContain(
      "userControlledMemoryRetentionSessionControlMode",
    );
    expect(appSource).toContain(
      "userControlledMemoryRetentionMutationBoundary",
    );
    expect(appSource).toContain("userControlledMemorySessionOnlyWriteBoundary");
    expect(appSource).toContain("userControlledMemoryExpirationJobBoundary");
    expect(appSource).toContain('"STATUS_ONLY"');
    expect(appSource).toContain('"NO_RUNTIME_MUTATION"');
    expect(appSource).toContain("userControlledMemoryRecordingModeBoundary");
    expect(appSource).toContain("userControlledMemoryRecordingPauseBoundary");
    expect(appSource).toContain("userControlledMemoryViewPersistenceBoundary");
    expect(appSource).toContain(
      "userControlledMemorySearchPersistenceBoundary",
    );
    expect(appSource).toContain("userControlledMemorySavedViewPresetsBoundary");
    expect(appSource).toContain("userControlledMemoryDeletePendingState");
    expect(appSource).toContain("USER_CONTROLLED_MEMORY_VIEW_STORAGE_KEY");
    expect(appSource).toContain(
      "readInitialUserControlledMemoryViewPreferences",
    );
    expect(appSource).toContain("persistUserControlledMemoryViewPreferences");
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
    expect(appSource).toContain("MemoryBoundaryPanel");
    expect(appSource).toContain("buildMemoryBoundaryViewModel");

    const memoryBoundaryLabels = [
      "Memory count check",
      "View controls",
      "View persistence",
      "Search persistence",
      "Visible records",
      "Deletable records",
      "Locked records",
      "Raw exposed records",
      "Memory safety check",
      "Provider-neutral records",
      "Confirmed route sources",
      "Confirmed voice sources",
      "Confirmed preference sources",
      "Source boundary",
      "Write policy",
      "Delete boundary",
      "Disable controls",
      "Disable mutation",
      "Disabled records",
      "Snapshot policy",
      "Sanitized snapshot",
      "Retention scope",
      "Export boundary",
      "Import boundary",
      "Edit boundary",
      "Restore boundary",
      "Auto capture",
      "Background indexing",
      "Proactive scan",
      "Proactive suggestions",
      "Proactive notifications",
      "Context polling",
      "Auto execution",
      "Permission override",
      "Risk downgrade",
      "Confirmation bypass",
      "Allowlist mutation",
      "Workflow replay",
      "Background task creation",
      "Reminder scheduling",
      "Autonomous follow-up",
      "Outbound messaging",
      "External triggers",
      "Clipboard observation",
      "Keystroke observation",
      "Window observation",
      "Screen observation",
      "File observation",
      "Camera observation",
      "Microphone observation",
      "Browser history observation",
      "Location observation",
      "Contacts observation",
      "Calendar observation",
      "Email observation",
      "Messaging observation",
      "Credential observation",
      "Payment observation",
      "Health observation",
      "Biometric observation",
      "Government ID observation",
      "Financial account observation",
      "Legal document observation",
      "Repository observation",
      "Cloud storage observation",
      "Analytics profiling",
      "Vector index retention",
      "Plugin access",
      "Workflow access",
      "Teach Mode access",
      "Skin access",
      "Pet access",
      "Personality access",
      "Custom UI access",
      "Expiration control",
      "Session-only mode",
      "Provider audit",
      "Audit history",
      "External sharing",
      "Community sharing",
      "Cloud sync",
      "Cloud account",
      "Storage encryption",
      "Credential access",
      "Network access",
      "Model training",
      "Training export",
      "Provider personalization",
      "Prompt injection",
      "Raw audio retention",
      "Raw transcript retention",
      "Screen capture retention",
      "File content retention",
      "Clipboard retention",
      "Secret retention",
      "Payment data retention",
      "Location retention",
      "Biometric retention",
      "Contact retention",
      "Health retention",
      "Calendar retention",
      "Email retention",
      "Identity document retention",
      "Browser history retention",
      "Cookie retention",
      "Download history retention",
      "Autofill retention",
      "Credential retention",
      "Device identifier retention",
      "Network identifier retention",
      "Crash dump retention",
      "Error report retention",
      "Telemetry payload retention",
      "Model cache retention",
      "Prompt cache retention",
      "Task history retention",
      "Snapshot redaction",
      "Raw snapshot review",
      "Snapshot schema validation",
      "Snapshot provenance",
      "Retention controls",
      "Export/import",
      "Edit/restore",
      "Provider sync",
      "Recording mode",
      "Recording pause",
      "Saved view presets",
      "Delete pending",
      "Vector retrieval",
      "VIEW / DELETE ONLY",
    ];
    for (const label of memoryBoundaryLabels) {
      expect(appSource).toContain(label);
    }

    const memoryBoundaryInputs = [
      "userControlledMemoryCountCheck",
      "userControlledMemoryViewPersistenceBoundary",
      "userControlledMemorySearchPersistenceBoundary",
      "filteredUserControlledMemories.length",
      "userControlledMemories.length",
      "deletableMemoryCount",
      "lockedMemoryCount",
      "rawExposedMemoryCount",
      "userControlledMemorySafetyCheck",
      "providerNeutralMemoryCount",
      "userConfirmedRouteAliasSourceCount",
      "userConfirmedVoiceAliasSourceCount",
      "userConfirmedPreferenceSourceCount",
      "userControlledMemorySourceBoundaryCheck",
      "userControlledMemoryWritePolicy",
      "userControlledMemoryDeleteBoundary",
      "userControlledMemoryDisableControlBoundary",
      "userControlledMemoryDisableMutationBoundary",
      "disabledMemoryCount",
      "userControlledMemorySnapshotPolicy",
      "userControlledMemorySanitizedSnapshotBoundary",
      "userControlledMemoryRetentionScope",
      "userControlledMemoryExportBoundary",
      "userControlledMemoryImportBoundary",
      "userControlledMemoryEditBoundary",
      "userControlledMemoryRestoreBoundary",
      "userControlledMemoryAutoCaptureBoundary",
      "userControlledMemoryBackgroundIndexingBoundary",
      "userControlledMemoryVectorIndexRetentionBoundary",
      "userControlledMemoryPluginAccessBoundary",
      "userControlledMemoryExpirationBoundary",
      "userControlledMemorySessionOnlyBoundary",
      "userControlledMemoryProviderAuditBoundary",
      "userControlledMemoryAuditHistoryBoundary",
      "userControlledMemoryExternalSharingBoundary",
      "userControlledMemoryCloudSyncBoundary",
      "userControlledMemoryCloudAccountBoundary",
      "userControlledMemoryStorageEncryptionBoundary",
      "userControlledMemoryCredentialAccessBoundary",
      "userControlledMemoryNetworkAccessBoundary",
      "userControlledMemoryModelTrainingBoundary",
      "userControlledMemorySnapshotRedactionBoundary",
      "userControlledMemoryRawSnapshotReviewBoundary",
      "userControlledMemorySnapshotSchemaValidationBoundary",
      "userControlledMemorySnapshotProvenanceBoundary",
      "userControlledMemoryRetentionControlsBoundary",
      "userControlledMemoryRetentionSessionControlMode",
      "userControlledMemoryRetentionMutationBoundary",
      "userControlledMemorySessionOnlyWriteBoundary",
      "userControlledMemoryExpirationJobBoundary",
      "userControlledMemoryRecordingModeBoundary",
      "userControlledMemoryRecordingPauseBoundary",
      "userControlledMemorySavedViewPresetsBoundary",
      "userControlledMemoryDeletePendingState",
    ];
    for (const input of memoryBoundaryInputs) {
      expect(appSource).toContain(input);
    }

    expect(appSource).toContain('"LOCAL_FILTERS"');
    expect(appSource).toContain('"USER_CONFIRMED"');
    expect(appSource).toContain('"EXPLICIT_ONLY"');
    expect(appSource).toContain('"CORE_IPC_REPOSITORY"');
    expect(appSource).toContain('"USER_INITIATED"');
    expect(appSource).toContain('"USER_CONTROLLED_ONLY"');
    expect(appSource).toContain('"USER_INITIATED_ONLY"');
    expect(appSource).toContain(
      'const userControlledMemoryImportBoundary = "NOT_ENABLED"',
    );
    expect(appSource).toContain(
      'const userControlledMemoryExportImportBoundary = "EXPORT_ONLY"',
    );
    expect(appSource).toContain('"NOT_ENABLED"');
    expect(appSource).toContain('"DISABLED"');
    expect(appSource).toContain('"STATUS_ONLY"');
    expect(appSource).toContain('"NO_RUNTIME_MUTATION"');
    expect(appSource).toContain('"NOT_GRANTED"');
    expect(appSource).toContain('"NOT_CONFIGURED"');
    expect(appSource).toContain('"NO_ACCESS"');
    expect(appSource).toContain('"SANITIZED_ONLY"');
    expect(appSource).toContain('"REQUIRED"');
    expect(appSource).toContain('"USER_CONFIRMED_ONLY"');
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
    expect(appSource).toContain('onClick={() => onSelectView("settings")}');
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

  it("renders Command Router product mode controls as default-off deterministic-rules UI", () => {
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
    expect(appSource).toContain("deterministic rules");
    expect(appSource).toContain("existing safety gates");
    expect(appSource).not.toContain("deterministic fixture projection only");
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
    expect(appSource).toContain("safe rollback");
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
    expect(appSource).toContain(
      'type SkinThemeId = "signal" | "harbor" | "ember"',
    );
    expect(appSource).toContain('THEME_STORAGE_KEY = "jarvis-k-ui-theme"');
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
    expect(appSource).toContain("copy.metric.coreHealth");
    expect(appSource).toContain("copy.metric.runtimeMode");
    expect(appSource).toContain("copy.metric.voiceEngine");
    expect(appSource).toContain("copy.metric.alphaState");
    expect(appSource).toContain("copy.metric.providers");
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
    expect(appSource).toContain("viewModel.voiceAliases.map");
    expect(appSource).toContain("removeVoiceAlias: (aliasId)");
    expect(appSource).toContain("handleDeleteVoiceCommandAlias(aliasId)");
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

  it("renders blocked tool projections as not-run instead of verified execution", () => {
    expect(appSource).toContain(
      'data-testid="tool-loop-result"',
    );
    expect(appSource).toContain('toolProductLoop.execution?.resultCode ?? "not_run"');
    expect(appSource).not.toContain('?? "executed"');
    expect(appSource).not.toContain('?? "verified"');
    expect(appSource).not.toContain('?? "verification_failed"');
  });

  it("uses dual-layer voice regression feedback instead of a combined Accept flow", () => {
    expect(appSource).toContain("Is the voice transcript correct?");
    expect(appSource).toContain("Did Jarvis understand the command correctly?");
    expect(appSource).toContain("Save feedback");
    expect(appSource).toContain('kind: "dual_layer"');
    expect(appSource).toContain('status: "wrong_slots"');
    expect(appSource).toContain('status: "should_block"');
    expect(appSource).toContain('status: "should_not_route"');
    expect(appSource).toContain("isDraftComplete(draft)");
    expect(appSource).toContain("<textarea");
    expect(appSource).toContain(
      'aria-label="Corrected transcript"',
    );
    expect(appSource).toContain("onKeyDown={(event) => event.stopPropagation()}");
    expect(appSource).toContain(
      "onPointerDown={(event) => event.stopPropagation()}",
    );
    expect(appSource).not.toContain(
      'actions.saveRegressionPendingSample(sample.id, "accepted")',
    );
    expect(appSource).not.toContain(
      'actions.saveRegressionPendingSample(sample.id, "rejected")',
    );
  });

  it("projects blocked brain dispatches through status and summary without verified wording", () => {
    expect(appSource).toContain('data-testid="brain-dispatch-panel"');
    expect(appSource).toContain("{brainResult.dispatchStatus}");
    expect(appSource).toContain('data-testid="brain-summary"');
    expect(appSource).toContain("{brainResult.summary}");
    expect(appSource).not.toContain(
      'brainResult.dispatchStatus === "completed" ? "verified"',
    );
    expect(appSource).not.toContain(
      'brainResult.dispatchStatus === "blocked" ? "verification_failed"',
    );
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
