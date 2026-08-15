export type MemoryBoundaryMetricTone = "success" | "warning" | "accent";

export type MemoryBoundaryMetric = {
  label: string;
  value: string;
  tone?: MemoryBoundaryMetricTone;
};

export type MemoryBoundaryViewModel = {
  badge: string;
  metrics: MemoryBoundaryMetric[];
  footer: string;
};

export type MemoryBoundaryInput = Record<
  string,
  boolean | number | string | null | undefined
>;

function asString(value: MemoryBoundaryInput[string], fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function bool(value: MemoryBoundaryInput[string]) {
  return value === true;
}

function num(value: MemoryBoundaryInput[string]) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function metric(
  input: MemoryBoundaryInput,
  label: string,
  key: string,
  tone?: MemoryBoundaryMetricTone,
): MemoryBoundaryMetric {
  return { label, value: asString(input[key]), tone };
}

export function buildMemoryBoundaryViewModel(
  input: MemoryBoundaryInput,
): MemoryBoundaryViewModel {
  const recordCount = num(input.recordCount);
  const visibleRecordCount = num(input.visibleRecordCount);
  const deletableRecordCount = num(input.deletableRecordCount);
  const lockedRecordCount = num(input.lockedRecordCount);
  const rawExposedRecordCount = num(input.rawExposedRecordCount);
  const providerNeutralRecordCount = num(input.providerNeutralRecordCount);
  const disabledRecordCount = num(input.disabledRecordCount);
  const mediumRiskMemoryCount = num(input.mediumRiskMemoryCount);
  const deletePending = bool(input.deletePending);
  const preferenceProjectionOn = bool(input.preferenceProjectionOn);

  return {
    badge: "USER CONTROLLED",
    footer:
      "This view lists only records that the user explicitly confirmed. Deletion flows through Core IPC and the existing repository boundary.",
    metrics: [
      {
        label: "Persistence",
        value: recordCount > 0 ? "ON" : "IDLE",
        tone: recordCount > 0 ? "success" : undefined,
      },
      { label: "View controls", value: "LOCAL ONLY", tone: "success" },
      metric(input, "View persistence", "viewPersistence", "success"),
      metric(input, "Search persistence", "searchPersistence", "success"),
      {
        label: "Visible records",
        value: `${visibleRecordCount}/${recordCount}`,
        tone: "accent",
      },
      {
        label: "Deletable records",
        value: String(deletableRecordCount),
        tone: deletableRecordCount > 0 ? "success" : undefined,
      },
      {
        label: "Locked records",
        value: String(lockedRecordCount),
        tone: lockedRecordCount > 0 ? "warning" : undefined,
      },
      {
        label: "Provider/raw private",
        value: rawExposedRecordCount > 0 ? "SHOWN" : "HIDDEN",
        tone: "success",
      },
      {
        label: "Raw exposed records",
        value: String(rawExposedRecordCount),
        tone: rawExposedRecordCount > 0 ? "warning" : "success",
      },
      {
        label: "Memory safety check",
        value: asString(input.safetyCheck),
        tone: input.safetyCheck === "OK" ? "success" : "warning",
      },
      {
        label: "Provider-neutral records",
        value: String(providerNeutralRecordCount),
        tone: providerNeutralRecordCount > 0 ? "success" : undefined,
      },
      metric(input, "Confirmed route sources", "confirmedRouteSourceCount"),
      metric(input, "Confirmed voice sources", "confirmedVoiceSourceCount"),
      metric(
        input,
        "Confirmed preference sources",
        "confirmedPreferenceSourceCount",
      ),
      {
        label: "Source boundary",
        value: asString(input.sourceBoundary),
        tone: input.sourceBoundary === "USER_CONFIRMED" ? "success" : "warning",
      },
      metric(input, "Write policy", "writePolicy", "success"),
      metric(input, "Delete boundary", "deleteBoundary", "success"),
      metric(input, "Disable controls", "disableControls", "warning"),
      metric(input, "Disable mutation", "disableMutation", "success"),
      {
        label: "Disabled records",
        value: String(disabledRecordCount),
        tone: "success",
      },
      metric(input, "Snapshot policy", "snapshotPolicy", "success"),
      {
        label: "Sanitized snapshot",
        value: asString(input.sanitizedSnapshot),
        tone: input.sanitizedSnapshot === "GENERATED" ? "success" : undefined,
      },
      metric(input, "Retention scope", "retentionScope", "success"),
      metric(input, "Export boundary", "exportBoundary", "success"),
      metric(input, "Import boundary", "importBoundary", "success"),
      metric(input, "Edit boundary", "editBoundary", "warning"),
      metric(input, "Restore boundary", "restoreBoundary", "warning"),
      metric(input, "Auto capture", "autoCapture", "success"),
      metric(input, "Background indexing", "backgroundIndexing", "success"),
      metric(input, "Proactive scan", "proactiveScan", "success"),
      metric(input, "Proactive suggestions", "proactiveSuggestions", "warning"),
      metric(
        input,
        "Proactive notifications",
        "proactiveNotifications",
        "success",
      ),
      metric(input, "Context polling", "contextPolling", "success"),
      metric(input, "Auto execution", "autoExecution", "success"),
      metric(input, "Permission override", "permissionOverride", "success"),
      metric(input, "Risk downgrade", "riskDowngrade", "success"),
      metric(input, "Confirmation bypass", "confirmationBypass", "success"),
      metric(input, "Allowlist mutation", "allowlistMutation", "success"),
      metric(input, "Workflow replay", "workflowReplay", "success"),
      metric(
        input,
        "Background task creation",
        "backgroundTaskCreation",
        "success",
      ),
      metric(input, "Reminder scheduling", "reminderScheduling", "success"),
      metric(input, "Autonomous follow-up", "autonomousFollowUp", "success"),
      metric(input, "Outbound messaging", "outboundMessaging", "success"),
      metric(input, "External triggers", "externalTriggers", "success"),
      metric(input, "Clipboard observation", "clipboardObservation", "success"),
      metric(input, "Keystroke observation", "keystrokeObservation", "success"),
      metric(input, "Window observation", "windowObservation", "success"),
      metric(input, "Screen observation", "screenObservation", "success"),
      metric(input, "File observation", "fileObservation", "success"),
      metric(input, "Camera observation", "cameraObservation", "success"),
      metric(
        input,
        "Microphone observation",
        "microphoneObservation",
        "success",
      ),
      metric(
        input,
        "Browser history observation",
        "browserHistoryObservation",
        "success",
      ),
      metric(input, "Location observation", "locationObservation", "success"),
      metric(input, "Contacts observation", "contactsObservation", "success"),
      metric(input, "Calendar observation", "calendarObservation", "success"),
      metric(input, "Email observation", "emailObservation", "success"),
      metric(input, "Messaging observation", "messagingObservation", "success"),
      metric(
        input,
        "Credential observation",
        "credentialObservation",
        "success",
      ),
      metric(input, "Payment observation", "paymentObservation", "success"),
      metric(input, "Health observation", "healthObservation", "success"),
      metric(input, "Biometric observation", "biometricObservation", "success"),
      metric(
        input,
        "Government ID observation",
        "governmentIdObservation",
        "success",
      ),
      metric(
        input,
        "Financial account observation",
        "financialAccountObservation",
        "success",
      ),
      metric(
        input,
        "Legal document observation",
        "legalDocumentObservation",
        "success",
      ),
      metric(
        input,
        "Repository observation",
        "repositoryObservation",
        "success",
      ),
      metric(
        input,
        "Cloud storage observation",
        "cloudStorageObservation",
        "success",
      ),
      metric(input, "Analytics profiling", "analyticsProfiling", "success"),
      metric(
        input,
        "Vector index retention",
        "vectorIndexRetention",
        "success",
      ),
      metric(input, "Plugin access", "pluginAccess", "success"),
      metric(input, "Workflow access", "workflowAccess", "success"),
      metric(input, "Teach Mode access", "teachModeAccess", "success"),
      metric(input, "Skin access", "skinAccess", "success"),
      metric(input, "Pet access", "petAccess", "success"),
      metric(input, "Personality access", "personalityAccess", "success"),
      metric(input, "Custom UI access", "customUiAccess", "success"),
      metric(input, "Expiration control", "expirationControl", "warning"),
      metric(input, "Session-only mode", "sessionOnlyMode", "warning"),
      metric(input, "Provider audit", "providerAudit", "warning"),
      metric(input, "Audit history", "auditHistory", "warning"),
      metric(input, "External sharing", "externalSharing", "success"),
      metric(input, "Community sharing", "communitySharing", "success"),
      metric(input, "Cloud sync", "cloudSync", "success"),
      metric(input, "Cloud account", "cloudAccount", "success"),
      metric(input, "Provider sync", "providerSync", "success"),
      metric(input, "Credential access", "credentialAccess", "success"),
      metric(input, "Network access", "networkAccess", "success"),
      metric(input, "Model training", "modelTraining", "success"),
      metric(input, "Training export", "trainingExport", "success"),
      metric(
        input,
        "Provider personalization",
        "providerPersonalization",
        "warning",
      ),
      metric(input, "Prompt injection", "promptInjection", "success"),
      metric(input, "Raw audio retention", "rawAudioRetention", "success"),
      metric(
        input,
        "Raw transcript retention",
        "rawTranscriptRetention",
        "success",
      ),
      metric(
        input,
        "Screen capture retention",
        "screenCaptureRetention",
        "success",
      ),
      metric(
        input,
        "File content retention",
        "fileContentRetention",
        "success",
      ),
      metric(input, "Clipboard retention", "clipboardRetention", "success"),
      metric(input, "Secret retention", "secretRetention", "success"),
      metric(
        input,
        "Payment data retention",
        "paymentDataRetention",
        "success",
      ),
      metric(input, "Location retention", "locationRetention", "success"),
      metric(input, "Biometric retention", "biometricRetention", "success"),
      metric(input, "Contact retention", "contactRetention", "success"),
      metric(input, "Health retention", "healthRetention", "success"),
      metric(input, "Calendar retention", "calendarRetention", "success"),
      metric(input, "Email retention", "emailRetention", "success"),
      metric(
        input,
        "Identity document retention",
        "identityDocumentRetention",
        "success",
      ),
      metric(
        input,
        "Browser history retention",
        "browserHistoryRetention",
        "success",
      ),
      metric(input, "Cookie retention", "cookieRetention", "success"),
      metric(
        input,
        "Download history retention",
        "downloadHistoryRetention",
        "success",
      ),
      metric(input, "Autofill retention", "autofillRetention", "success"),
      metric(input, "Credential retention", "credentialRetention", "success"),
      metric(
        input,
        "Device identifier retention",
        "deviceIdentifierRetention",
        "success",
      ),
      metric(
        input,
        "Network identifier retention",
        "networkIdentifierRetention",
        "success",
      ),
      metric(input, "Crash dump retention", "crashDumpRetention", "success"),
      metric(
        input,
        "Error report retention",
        "errorReportRetention",
        "success",
      ),
      metric(
        input,
        "Telemetry payload retention",
        "telemetryPayloadRetention",
        "success",
      ),
      metric(input, "Model cache retention", "modelCacheRetention", "success"),
      metric(
        input,
        "Prompt cache retention",
        "promptCacheRetention",
        "success",
      ),
      metric(
        input,
        "Task history retention",
        "taskHistoryRetention",
        "success",
      ),
      metric(input, "Snapshot redaction", "snapshotRedaction", "success"),
      metric(input, "Raw snapshot review", "rawSnapshotReview", "warning"),
      metric(
        input,
        "Snapshot schema validation",
        "snapshotSchemaValidation",
        "success",
      ),
      metric(input, "Snapshot provenance", "snapshotProvenance", "success"),
      metric(input, "Retention controls", "retentionControls", "warning"),
      metric(
        input,
        "Retention/session controls",
        "retentionSessionControls",
        "success",
      ),
      metric(input, "Retention mutation", "retentionMutation", "success"),
      metric(input, "Session writes", "sessionWrites", "success"),
      metric(input, "Expiration jobs", "expirationJobs", "success"),
      metric(input, "Export/import", "exportImport", "warning"),
      metric(input, "Edit/restore", "editRestore", "warning"),
      metric(input, "Storage encryption", "storageEncryption", "warning"),
      metric(input, "Recording mode", "recordingMode", "success"),
      metric(input, "Recording pause", "recordingPause", "warning"),
      metric(input, "Saved view presets", "savedViewPresets", "warning"),
      {
        label: "Delete pending",
        value: asString(input.deletePendingState),
        tone: deletePending ? "warning" : "success",
      },
      {
        label: "Preference projection",
        value: preferenceProjectionOn ? "ON" : "IDLE",
        tone: preferenceProjectionOn ? "success" : undefined,
      },
      {
        label: "Applies to",
        value: preferenceProjectionOn ? "Chat Answer" : "none",
        tone: preferenceProjectionOn ? "accent" : undefined,
      },
      metric(input, "Route aliases", "routeAliasMemoryCount"),
      metric(input, "Voice aliases", "voiceAliasMemoryCount"),
      metric(input, "Preferences", "preferenceMemoryCount"),
      {
        label: "Memory count check",
        value: asString(input.memoryCountCheck),
        tone: input.memoryCountCheck === "OK" ? "success" : "warning",
      },
      {
        label: "Medium risk",
        value: String(mediumRiskMemoryCount),
        tone: mediumRiskMemoryCount > 0 ? "warning" : undefined,
      },
      { label: "Vector retrieval", value: "DISABLED", tone: "warning" },
      { label: "Provider runtime", value: "NOT USED", tone: "success" },
      { label: "Execution", value: "VIEW / DELETE ONLY", tone: "success" },
    ],
  };
}
