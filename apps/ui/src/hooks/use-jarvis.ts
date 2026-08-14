import { useCallback, useEffect, useRef, useState } from "react";
import {
  BrainCommandResultSchema,
  CommandRouterLocalAppLaunchResultSchema,
  CommandRouterProductModeStatusSchema,
  CoreSnapshotSchema,
  EmbeddingGenerationResultSchema,
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  IntentRoutingResultSchema,
  MemoryAlphaRecallProbeResultSchema,
  MemoryAlphaStatusSchema,
  OcrRecognitionResultSchema,
  LocalPluginManifestDeveloperStatusResultSchema,
  LocalPluginEnabledStateSetResultSchema,
  PluginManagementStatusResultSchema,
  RerankResultSchema,
  ModelInstallabilityReportSchema,
  ModelInventoryItemSchema,
  ModelCandidateSchema,
  ModelManifestSchema,
  ModelOperationSnapshotSchema,
  MemorySnapshotSchema,
  ResourceSchedulerDiagnosticsSchema,
  ChatAnswerProductModeStatusSchema,
  QwenRuntimeControlStatusSchema,
  UserControlledMemoryRecordSchema,
  UserRouteAliasRecordSchema,
  VoiceCommandAliasRecordSchema,
  type AppCommand,
  type BrainCommandResult,
  type BrainCommandSource,
  type ChatAnswerProductModeStatus,
  type CommandRouterLocalAppLaunchResult,
  type CommandRouterProductModeStatus,
  type CoreSnapshot,
  type EmbeddingGenerationResult,
  type EventEnvelope,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor,
  type IntentRoutingResult,
  type MemoryAlphaRecallProbeResult,
  type MemoryAlphaStatus,
  type OcrRecognitionResult,
  type LocalPluginManifestDeveloperStatusResult,
  type LocalPluginEnabledStateSetResult,
  type PluginManagementStatusResult,
  type RerankResult,
  type ModelInventoryItem,
  type ModelInstallabilityReport,
  type ModelCandidate,
  type ModelManifest,
  type ModelOperationSnapshot,
  type QwenRuntimeControlAction,
  type QwenRuntimeControlStatus,
  type ResourceSchedulerDiagnostics,
  type TtsServiceStatus,
  type UserControlledMemoryKind,
  type UserControlledMemoryRecord,
  type UserRouteAliasLearningProposal,
  type UserRouteAliasRecord,
  type VoiceCommandAliasRecord,
  type VoiceCommandCorrectionCandidate,
  type VoiceServiceStatus,
} from "@jarvis-k/contracts";

type CoreConnection = "connecting" | "online" | "restarting" | "offline";

const MAX_EVENTS = 40;
const FIXTURE_EMBEDDING_MODEL_ID = "jarvis-fixture/local-embedding-smoke";
const FIXTURE_INTENT_ROUTER_MODEL_ID =
  "jarvis-fixture/local-intent-router-smoke";
const FIXTURE_OCR_MODEL_ID = "jarvis-fixture/local-ocr-smoke";
const FIXTURE_RERANKER_MODEL_ID = "jarvis-fixture/local-reranker-smoke";

export type FixtureEmbeddingProbe = {
  dimensions: number;
  generatedAt: string;
  operationPhase?: ModelOperationSnapshot["phase"];
  vectorCount: number;
};

export type FixtureIntentProbe = {
  candidateCount: number;
  intent?: string;
  operationPhase?: ModelOperationSnapshot["phase"];
};

export type FixtureOcrProbe = {
  blockCount: number;
  operationPhase?: ModelOperationSnapshot["phase"];
  text: string;
};

export type FixtureRerankProbe = {
  operationPhase?: ModelOperationSnapshot["phase"];
  resultCount: number;
  topDocumentId?: string;
};

export function useJarvis() {
  const [snapshot, setSnapshot] = useState<CoreSnapshot | null>(null);
  const [events, setEvents] = useState<EventEnvelope[]>([]);
  const [connection, setConnection] = useState<CoreConnection>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [modelInventory, setModelInventory] = useState<ModelInventoryItem[]>(
    [],
  );
  const [modelInstallabilityReports, setModelInstallabilityReports] = useState<
    ModelInstallabilityReport[]
  >([]);
  const [modelOperations, setModelOperations] = useState<
    ModelOperationSnapshot[]
  >([]);
  const [modelCandidates, setModelCandidates] = useState<ModelCandidate[]>([]);
  const [modelManifests, setModelManifests] = useState<ModelManifest[]>([]);
  const [inferenceProviders, setInferenceProviders] = useState<
    InferenceProviderDescriptor[]
  >([]);
  const [inferenceProviderRequirements, setInferenceProviderRequirements] =
    useState<InferenceProviderConfigurationReport[]>([]);
  const [fixtureEmbeddingProbe, setFixtureEmbeddingProbe] =
    useState<FixtureEmbeddingProbe | null>(null);
  const [fixtureIntentProbe, setFixtureIntentProbe] =
    useState<FixtureIntentProbe | null>(null);
  const [fixtureOcrProbe, setFixtureOcrProbe] =
    useState<FixtureOcrProbe | null>(null);
  const [fixtureRerankProbe, setFixtureRerankProbe] =
    useState<FixtureRerankProbe | null>(null);
  const [memoryAlphaStatus, setMemoryAlphaStatus] =
    useState<MemoryAlphaStatus | null>(null);
  const [memoryAlphaRecallProbe, setMemoryAlphaRecallProbe] =
    useState<MemoryAlphaRecallProbeResult | null>(null);
  const [resourceDiagnostics, setResourceDiagnostics] =
    useState<ResourceSchedulerDiagnostics | null>(null);
  const [brainResult, setBrainResult] = useState<BrainCommandResult | null>(
    null,
  );
  const [voiceCommandAliases, setVoiceCommandAliases] = useState<
    VoiceCommandAliasRecord[]
  >([]);
  const [userRouteAliases, setUserRouteAliases] = useState<
    UserRouteAliasRecord[]
  >([]);
  const [userControlledMemories, setUserControlledMemories] = useState<
    UserControlledMemoryRecord[]
  >([]);
  const [voiceServiceStatus, setVoiceServiceStatus] =
    useState<VoiceServiceStatus | null>(null);
  const [ttsServiceStatus, setTtsServiceStatus] =
    useState<TtsServiceStatus | null>(null);
  const [chatAnswerProductModeStatus, setChatAnswerProductModeStatus] =
    useState<ChatAnswerProductModeStatus | null>(null);
  const [commandRouterProductModeStatus, setCommandRouterProductModeStatus] =
    useState<CommandRouterProductModeStatus | null>(null);
  const [qwenRuntimeControlStatus, setQwenRuntimeControlStatus] =
    useState<QwenRuntimeControlStatus | null>(null);
  const [pluginManagementStatus, setPluginManagementStatus] =
    useState<PluginManagementStatusResult | null>(null);
  const [
    localPluginManifestDeveloperStatus,
    setLocalPluginManifestDeveloperStatus,
  ] = useState<LocalPluginManifestDeveloperStatusResult | null>(null);
  const [
    commandRouterLocalAppLaunchResult,
    setCommandRouterLocalAppLaunchResult,
  ] = useState<CommandRouterLocalAppLaunchResult | null>(null);
  const [sending, setSending] = useState(false);
  const dispatchedVoiceTranscriptKeys = useRef<Set<string>>(new Set());
  const textOnlyAcceptanceRef = useRef(false);

  const dispatchBrainCommand = useCallback(
    async (text: string, source: BrainCommandSource) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }

      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.runBrainCommand",
          payload: {
            source,
            text,
          },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        const brain = BrainCommandResultSchema.safeParse(
          (result.data as { brain?: unknown } | undefined)?.brain,
        );
        if (!brain.success) {
          setError("Core returned an invalid Brain result.");
          return false;
        }
        setBrainResult(brain.data);
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [],
  );

  const dispatchFinalVoiceTranscript = useCallback(
    (transcript: NonNullable<CoreSnapshot["voice"]["transcript"]>) => {
      if (textOnlyAcceptanceRef.current) {
        return;
      }
      const text = transcript.text.trim();
      if (transcript.isFinal && text) {
        const key = [
          transcript.sessionId,
          transcript.segmentId ?? "segmentless",
          text,
        ].join(":");
        if (dispatchedVoiceTranscriptKeys.current.has(key)) {
          return;
        }

        dispatchedVoiceTranscriptKeys.current.add(key);
        if (dispatchedVoiceTranscriptKeys.current.size > 64) {
          const firstKey = dispatchedVoiceTranscriptKeys.current
            .values()
            .next().value;
          if (firstKey) {
            dispatchedVoiceTranscriptKeys.current.delete(firstKey);
          }
        }
        void dispatchBrainCommand(text, "voice");
        return;
      }
    },
    [dispatchBrainCommand],
  );

  const applyEvent = useCallback(
    (envelope: EventEnvelope) => {
      setEvents((current) => [envelope, ...current].slice(0, MAX_EVENTS));

      if (envelope.event.type === "state.snapshot") {
        textOnlyAcceptanceRef.current =
          envelope.event.payload.textOnlyAcceptance?.enabled === true;
        setSnapshot(envelope.event.payload);
        setMemoryAlphaStatus(envelope.event.payload.memoryAlpha ?? null);
        setConnection("online");
        setError(null);
        if (envelope.event.payload.voice.transcript) {
          dispatchFinalVoiceTranscript(envelope.event.payload.voice.transcript);
        }
      }

      if (envelope.event.type === "model.operation.updated") {
        const operation = envelope.event.payload;
        setModelOperations((current) =>
          upsertModelOperation(current, operation),
        );
      }

      if (envelope.event.type === "voice.transcript.updated") {
        dispatchFinalVoiceTranscript(envelope.event.payload);
      }

      if (envelope.event.type === "system.core.lifecycle") {
        const status = envelope.event.payload.status;
        if (status === "online") setConnection("online");
        if (status === "starting" || status === "restarting") {
          setConnection("restarting");
        }
        if (status === "stopped" || status === "failed") {
          setConnection("offline");
        }
      }
    },
    [dispatchFinalVoiceTranscript],
  );

  const refreshSnapshot = useCallback(async () => {
    if (!window.jarvis) {
      setConnection("offline");
      setError("Desktop bridge unavailable.");
      return;
    }

    const result = await window.jarvis.getSnapshot();
    if (!result.ok) {
      setError(result.error.message);
      setConnection("offline");
      return;
    }

    const parsed = CoreSnapshotSchema.safeParse(result.data);
    if (!parsed.success) {
      setError("Core returned an invalid state snapshot.");
      return;
    }

    textOnlyAcceptanceRef.current =
      parsed.data.textOnlyAcceptance?.enabled === true;
    setSnapshot(parsed.data);
    setMemoryAlphaStatus(parsed.data.memoryAlpha ?? null);
    setConnection("online");
    setError(null);
  }, []);

  const sendCommand = useCallback(async (command: AppCommand) => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    setSending(true);
    try {
      const result = await window.jarvis.sendCommand(command);
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) =>
      sendCommand({
        type: "agent.sendMessage",
        payload: {
          text,
        },
      }),
    [sendCommand],
  );

  const runBrainCommand = useCallback(
    async (text: string) => dispatchBrainCommand(text, "text"),
    [dispatchBrainCommand],
  );

  const refreshVoiceCommandAliases = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.sendCommand({
      type: "agent.listVoiceCommandAliases",
      payload: {},
    });
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    const aliases = (result.data as { aliases?: unknown } | undefined)
      ?.aliases;
    if (!Array.isArray(aliases)) {
      setError("Core returned invalid voice alias data.");
      return false;
    }
    const parsed = aliases.map((alias) =>
      VoiceCommandAliasRecordSchema.safeParse(alias),
    );
    if (parsed.some((alias) => !alias.success)) {
      setError("Core returned invalid voice alias data.");
      return false;
    }
    setVoiceCommandAliases(
      parsed.map((alias) => (alias.success ? alias.data : neverAlias())),
    );
    setError(null);
    return true;
  }, []);

  const confirmVoiceCommandCorrection = useCallback(
    async (candidate: VoiceCommandCorrectionCandidate) => {
      const rawAlias = brainResult?.rawTranscript ?? brainResult?.text;
      if (!rawAlias) {
        setError("No voice correction is pending.");
        return false;
      }
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }

      setSending(true);
      try {
        const confirmation = await window.jarvis.sendCommand({
          type: "agent.confirmVoiceCommandCorrection",
          payload: {
            rawAlias,
            normalizedTranscript: candidate.normalizedTranscript,
            intent: candidate.intent,
            slots: candidate.slots,
          },
        });
        if (!confirmation.ok) {
          setError(confirmation.error.message);
          return false;
        }
      } finally {
        setSending(false);
      }

      await refreshVoiceCommandAliases();
      return dispatchBrainCommand(rawAlias, "voice");
    },
    [brainResult, dispatchBrainCommand, refreshVoiceCommandAliases],
  );

  const deleteVoiceCommandAlias = useCallback(
    async (aliasId: string) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.deleteVoiceCommandAlias",
          payload: { aliasId },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        await refreshVoiceCommandAliases();
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [refreshVoiceCommandAliases],
  );

  const refreshUserRouteAliases = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.sendCommand({
      type: "agent.listUserRouteAliases",
      payload: {},
    });
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    const aliases = (result.data as { aliases?: unknown } | undefined)
      ?.aliases;
    if (!Array.isArray(aliases)) {
      setError("Core returned invalid route alias data.");
      return false;
    }
    const parsed = aliases.map((alias) =>
      UserRouteAliasRecordSchema.safeParse(alias),
    );
    if (parsed.some((alias) => !alias.success)) {
      setError("Core returned invalid route alias data.");
      return false;
    }
    setUserRouteAliases(
      parsed.map((alias) =>
        alias.success ? alias.data : neverUserRouteAlias(),
      ),
    );
    setError(null);
    return true;
  }, []);

  const confirmUserRouteAlias = useCallback(
    async (proposal: UserRouteAliasLearningProposal) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.confirmUserRouteAlias",
          payload: {
            proposalId: proposal.id,
            confirmation: "explicit_ui_confirmation",
          },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        const alias = UserRouteAliasRecordSchema.safeParse(
          (result.data as { alias?: unknown } | undefined)?.alias,
        );
        if (!alias.success) {
          setError("Core returned invalid route alias confirmation data.");
          return false;
        }
        await refreshUserRouteAliases();
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [refreshUserRouteAliases],
  );

  const deleteUserRouteAlias = useCallback(
    async (aliasId: string) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.deleteUserRouteAlias",
          payload: { aliasId },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        await refreshUserRouteAliases();
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [refreshUserRouteAliases],
  );

  const refreshUserControlledMemories = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.sendCommand({
      type: "agent.listUserControlledMemories",
      payload: {},
    });
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    const memories = (result.data as { memories?: unknown } | undefined)
      ?.memories;
    if (!Array.isArray(memories)) {
      setError("Core returned invalid user memory data.");
      return false;
    }
    const parsed = memories.map((memory) =>
      UserControlledMemoryRecordSchema.safeParse(memory),
    );
    if (parsed.some((memory) => !memory.success)) {
      setError("Core returned invalid user memory data.");
      return false;
    }
    setUserControlledMemories(
      parsed.map((memory) =>
        memory.success ? memory.data : neverUserControlledMemory(),
      ),
    );
    setError(null);
    return true;
  }, []);

  const deleteUserControlledMemory = useCallback(
    async (kind: UserControlledMemoryKind, sourceId: string) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.deleteUserControlledMemory",
          payload: { kind, sourceId },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        await refreshUserControlledMemories();
        if (kind === "voice_command_alias") {
          await refreshVoiceCommandAliases();
        } else {
          await refreshUserRouteAliases();
        }
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [
      refreshUserControlledMemories,
      refreshUserRouteAliases,
      refreshVoiceCommandAliases,
    ],
  );

  const cancelTask = useCallback(
    async (taskId: string) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.cancelTask",
          payload: {
            taskId,
            reason: "User cancelled the pending task from the Tasks view.",
          },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        await refreshSnapshot();
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [refreshSnapshot],
  );

  const approveTask = useCallback(
    async (taskId: string) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.approveTask",
          payload: {
            taskId,
            confirmation: "explicit_ui_confirmation",
          },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        await refreshSnapshot();
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [refreshSnapshot],
  );

  const retryBrainCommand = useCallback(async () => {
    if (
      !brainResult ||
      (brainResult.dispatchStatus !== "blocked" &&
        brainResult.dispatchStatus !== "degraded")
    ) {
      return false;
    }
    return dispatchBrainCommand(brainResult.text, brainResult.source);
  }, [brainResult, dispatchBrainCommand]);

  const rollbackBrainResult = useCallback(() => {
    if (!brainResult) return false;
    setBrainResult(null);
    setError(null);
    return true;
  }, [brainResult]);

  const clearSessionHistory = useCallback(
    async () =>
      sendCommand({
        type: "agent.clearSessionHistory",
        payload: {},
      }),
    [sendCommand],
  );

  const createConversation = useCallback(
    async () =>
      sendCommand({
        type: "agent.createConversation",
        payload: {},
      }),
    [sendCommand],
  );

  const selectConversation = useCallback(
    async (conversationId: string) =>
      sendCommand({
        type: "agent.selectConversation",
        payload: { conversationId },
      }),
    [sendCommand],
  );

  const renameConversation = useCallback(
    async (conversationId: string, title: string) =>
      sendCommand({
        type: "agent.renameConversation",
        payload: { conversationId, title },
      }),
    [sendCommand],
  );

  const refreshMemoryHealth = useCallback(
    async () =>
      sendCommand({
        type: "agent.getMemoryHealth",
        payload: {},
      }),
    [sendCommand],
  );

  const refreshCapabilities = useCallback(
    async () =>
      sendCommand({
        type: "agent.getCapabilities",
        payload: {},
      }),
    [sendCommand],
  );

  const refreshModelGovernance = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    setSending(true);
    try {
      const manifestsResult = await window.jarvis.sendCommand({
        type: "agent.listModelManifests",
        payload: {},
      });
      if (!manifestsResult.ok) {
        setError(manifestsResult.error.message);
        return false;
      }
      const manifests = ModelManifestSchema.array().safeParse(
        (manifestsResult.data as { manifests?: unknown } | undefined)
          ?.manifests,
      );
      if (!manifests.success) {
        setError("Core returned invalid model manifests.");
        return false;
      }

      const installabilityReportResults = await Promise.all(
        manifests.data.map((manifest) =>
          window.jarvis.sendCommand({
            type: "agent.previewModelInstallability",
            payload: {
              modelId: manifest.id,
            },
          }),
        ),
      );
      const failedInstallabilityReport = installabilityReportResults.find(
        (result) => !result.ok,
      );
      if (failedInstallabilityReport && !failedInstallabilityReport.ok) {
        setError(failedInstallabilityReport.error.message);
        return false;
      }
      const installabilityReports =
        ModelInstallabilityReportSchema.array().safeParse(
          installabilityReportResults.map((result) =>
            result.ok
              ? (result.data as { report?: unknown } | undefined)?.report
              : undefined,
          ),
        );
      if (!installabilityReports.success) {
        setError("Core returned invalid model installability reports.");
        return false;
      }

      const inventoryResult = await window.jarvis.sendCommand({
        type: "agent.listModelInventory",
        payload: {},
      });
      if (!inventoryResult.ok) {
        setError(inventoryResult.error.message);
        return false;
      }
      const inventory = ModelInventoryItemSchema.array().safeParse(
        (inventoryResult.data as { inventory?: unknown } | undefined)
          ?.inventory,
      );
      if (!inventory.success) {
        setError("Core returned invalid model inventory.");
        return false;
      }

      const operationsResult = await window.jarvis.sendCommand({
        type: "agent.listModelOperations",
        payload: {},
      });
      if (!operationsResult.ok) {
        setError(operationsResult.error.message);
        return false;
      }
      const operations = ModelOperationSnapshotSchema.array().safeParse(
        (operationsResult.data as { operations?: unknown } | undefined)
          ?.operations,
      );
      if (!operations.success) {
        setError("Core returned invalid model operations.");
        return false;
      }

      const resourceResult = await window.jarvis.sendCommand({
        type: "agent.getResourceDiagnostics",
        payload: {},
      });
      if (!resourceResult.ok) {
        setError(resourceResult.error.message);
        return false;
      }
      const resourceDiagnostics = ResourceSchedulerDiagnosticsSchema.safeParse(
        (resourceResult.data as { resourceDiagnostics?: unknown } | undefined)
          ?.resourceDiagnostics,
      );
      if (!resourceDiagnostics.success) {
        setError("Core returned invalid resource diagnostics.");
        return false;
      }

      const candidatesResult = await window.jarvis.sendCommand({
        type: "agent.listModelCandidates",
        payload: {},
      });
      if (!candidatesResult.ok) {
        setError(candidatesResult.error.message);
        return false;
      }
      const candidates = ModelCandidateSchema.array().safeParse(
        (candidatesResult.data as { candidates?: unknown } | undefined)
          ?.candidates,
      );
      if (!candidates.success) {
        setError("Core returned invalid model candidates.");
        return false;
      }

      const providersResult = await window.jarvis.sendCommand({
        type: "agent.listInferenceProviders",
        payload: {},
      });
      if (!providersResult.ok) {
        setError(providersResult.error.message);
        return false;
      }
      const providers = InferenceProviderDescriptorSchema.array().safeParse(
        (providersResult.data as { providers?: unknown } | undefined)
          ?.providers,
      );
      if (!providers.success) {
        setError("Core returned invalid inference provider descriptors.");
        return false;
      }

      const providerRequirementsResult = await window.jarvis.sendCommand({
        type: "agent.listInferenceProviderRequirements",
        payload: {},
      });
      if (!providerRequirementsResult.ok) {
        setError(providerRequirementsResult.error.message);
        return false;
      }
      const providerRequirements =
        InferenceProviderConfigurationReportSchema.array().safeParse(
          (providerRequirementsResult.data as { reports?: unknown } | undefined)
            ?.reports,
        );
      if (!providerRequirements.success) {
        setError("Core returned invalid inference provider requirements.");
        return false;
      }

      setModelManifests(manifests.data);
      setModelInstallabilityReports(installabilityReports.data);
      setModelInventory(inventory.data);
      setModelOperations(operations.data);
      setResourceDiagnostics(resourceDiagnostics.data);
      setModelCandidates(candidates.data);
      setInferenceProviders(providers.data);
      setInferenceProviderRequirements(providerRequirements.data);
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, []);

  const runFixtureEmbeddingProbe = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    setSending(true);
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.generateEmbeddings",
        payload: {
          modelId: FIXTURE_EMBEDDING_MODEL_ID,
          inputs: [
            {
              id: "fixture-ui-probe",
              text: "Jarvis-K fixture embedding probe",
            },
          ],
          dimensions: 4,
        },
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const embeddingResult = EmbeddingGenerationResultSchema.safeParse(
        (result.data as { result?: unknown } | undefined)?.result,
      );
      if (!embeddingResult.success) {
        setError("Core returned an invalid embedding result.");
        return false;
      }
      const operation = ModelOperationSnapshotSchema.safeParse(
        (result.data as { operation?: unknown } | undefined)?.operation,
      );
      if (operation.success) {
        setModelOperations((current) =>
          upsertModelOperation(current, operation.data),
        );
      }
      setFixtureEmbeddingProbe(
        toFixtureEmbeddingProbe(
          embeddingResult.data,
          operation.success ? operation.data : undefined,
        ),
      );
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, []);

  const runFixtureIntentProbe = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    setSending(true);
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.routeIntent",
        payload: {
          modelId: FIXTURE_INTENT_ROUTER_MODEL_ID,
          utterance: "search memory",
          context: {
            locale: "en",
            allowedIntents: ["memory.search"],
          },
        },
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const intentResult = IntentRoutingResultSchema.safeParse(
        (result.data as { result?: unknown } | undefined)?.result,
      );
      if (!intentResult.success) {
        setError("Core returned an invalid intent routing result.");
        return false;
      }
      const operation = ModelOperationSnapshotSchema.safeParse(
        (result.data as { operation?: unknown } | undefined)?.operation,
      );
      if (operation.success) {
        setModelOperations((current) =>
          upsertModelOperation(current, operation.data),
        );
      }
      setFixtureIntentProbe(
        toFixtureIntentProbe(
          intentResult.data,
          operation.success ? operation.data : undefined,
        ),
      );
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, []);

  const runFixtureOcrProbe = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    setSending(true);
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.recognizeOcr",
        payload: {
          modelId: FIXTURE_OCR_MODEL_ID,
          image: {
            id: "fixture-ui-image",
            mimeType: "image/png",
            bytes: new Uint8Array([137, 80, 78, 71]),
            width: 1,
            height: 1,
          },
        },
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const ocrResult = OcrRecognitionResultSchema.safeParse(
        (result.data as { result?: unknown } | undefined)?.result,
      );
      if (!ocrResult.success) {
        setError("Core returned an invalid OCR result.");
        return false;
      }
      const operation = ModelOperationSnapshotSchema.safeParse(
        (result.data as { operation?: unknown } | undefined)?.operation,
      );
      if (operation.success) {
        setModelOperations((current) =>
          upsertModelOperation(current, operation.data),
        );
      }
      setFixtureOcrProbe(
        toFixtureOcrProbe(
          ocrResult.data,
          operation.success ? operation.data : undefined,
        ),
      );
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, []);

  const runFixtureRerankProbe = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    setSending(true);
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.rerank",
        payload: {
          modelId: FIXTURE_RERANKER_MODEL_ID,
          query: "model ports",
          documents: [
            {
              id: "doc-model-ports",
              text: "Core uses injected model ports for inference.",
            },
            {
              id: "doc-voice-settings",
              text: "Desktop owns safeStorage voice settings.",
            },
          ],
          topK: 1,
        },
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const rerankResult = RerankResultSchema.safeParse(
        (result.data as { result?: unknown } | undefined)?.result,
      );
      if (!rerankResult.success) {
        setError("Core returned an invalid rerank result.");
        return false;
      }
      const operation = ModelOperationSnapshotSchema.safeParse(
        (result.data as { operation?: unknown } | undefined)?.operation,
      );
      if (operation.success) {
        setModelOperations((current) =>
          upsertModelOperation(current, operation.data),
        );
      }
      setFixtureRerankProbe(
        toFixtureRerankProbe(
          rerankResult.data,
          operation.success ? operation.data : undefined,
        ),
      );
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, []);

  const exportMemorySnapshot = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return null;
    }

    setSending(true);
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.exportMemorySnapshot",
        payload: {},
      });
      if (!result.ok) {
        setError(result.error.message);
        return null;
      }
      const snapshot = MemorySnapshotSchema.safeParse(
        (result.data as { snapshot?: unknown } | undefined)?.snapshot,
      );
      if (!snapshot.success) {
        setError("Core returned an invalid memory snapshot.");
        return null;
      }
      setError(null);
      return JSON.stringify(snapshot.data, null, 2);
    } finally {
      setSending(false);
    }
  }, []);

  const importMemorySnapshot = useCallback(
    async (snapshotJson: string) => {
      let snapshot: ReturnType<typeof MemorySnapshotSchema.parse>;
      try {
        snapshot = MemorySnapshotSchema.parse(JSON.parse(snapshotJson));
      } catch {
        setError("Memory snapshot JSON is invalid.");
        return false;
      }
      return sendCommand({
        type: "agent.importMemorySnapshot",
        payload: { snapshot },
      });
    },
    [sendCommand],
  );

  const refreshMemoryAlphaStatus = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    setSending(true);
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.getMemoryAlphaStatus",
        payload: {},
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const memoryAlpha = MemoryAlphaStatusSchema.safeParse(
        (result.data as { memoryAlpha?: unknown } | undefined)?.memoryAlpha,
      );
      if (!memoryAlpha.success) {
        setError("Core returned invalid Memory alpha status.");
        return false;
      }
      setMemoryAlphaStatus(memoryAlpha.data);
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, []);

  const probeMemoryAlphaRecall = useCallback(async (text: string) => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    setSending(true);
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.probeMemoryAlphaRecall",
        payload: { text },
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const memoryAlpha = MemoryAlphaStatusSchema.safeParse(
        (result.data as { memoryAlpha?: unknown } | undefined)?.memoryAlpha,
      );
      const probe = MemoryAlphaRecallProbeResultSchema.safeParse(
        (result.data as { probe?: unknown } | undefined)?.probe,
      );
      if (!probe.success || !memoryAlpha.success) {
        setError("Core returned invalid Memory alpha probe metadata.");
        return false;
      }
      setMemoryAlphaStatus(memoryAlpha.data);
      setMemoryAlphaRecallProbe(probe.data);
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, []);

  const disableMemoryAlpha = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    setSending(true);
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.disableMemoryAlpha",
        payload: {},
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const memoryAlpha = MemoryAlphaStatusSchema.safeParse(
        (result.data as { memoryAlpha?: unknown } | undefined)?.memoryAlpha,
      );
      const snapshot = CoreSnapshotSchema.safeParse(
        (result.data as { snapshot?: unknown } | undefined)?.snapshot,
      );
      if (!memoryAlpha.success) {
        setError("Core returned invalid Memory alpha disable metadata.");
        return false;
      }
      setMemoryAlphaStatus(memoryAlpha.data);
      if (snapshot.success) {
        setSnapshot(snapshot.data);
      }
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, []);

  const probeCore = useCallback(
    async () =>
      sendCommand({
        type: "agent.ping",
        payload: { sentAt: new Date().toISOString() },
      }),
    [sendCommand],
  );

  const openVoiceSettings = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return;
    }
    try {
      const status = await window.jarvis.openVoiceSettings();
      setVoiceServiceStatus(status);
      setTtsServiceStatus(await window.jarvis.getTtsServiceStatus());
      setError(null);
    } catch {
      setError("Voice settings could not be opened.");
    }
  }, []);

  const openTtsSettings = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return;
    }
    try {
      const status = await window.jarvis.openTtsSettings();
      setTtsServiceStatus(status);
      setError(null);
    } catch {
      setError("TTS settings could not be opened.");
    }
  }, []);

  const refreshVoiceServiceStatus = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    try {
      const status = await window.jarvis.getVoiceServiceStatus();
      setVoiceServiceStatus(status);
      setError(null);
      return true;
    } catch {
      setError("Voice service status could not be read.");
      return false;
    }
  }, []);

  const refreshTtsServiceStatus = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    try {
      const status = await window.jarvis.getTtsServiceStatus();
      setTtsServiceStatus(status);
      setError(null);
      return true;
    } catch {
      setError("TTS service status could not be read.");
      return false;
    }
  }, []);

  const refreshChatAnswerProductModeStatus = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    try {
      const status = ChatAnswerProductModeStatusSchema.parse(
        await window.jarvis.getChatAnswerProductModeStatus(),
      );
      setChatAnswerProductModeStatus(status);
      setError(null);
      return true;
    } catch {
      setError("Chat Answer product mode status could not be read.");
      return false;
    }
  }, []);

  const refreshCommandRouterProductModeStatus = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    try {
      const status = CommandRouterProductModeStatusSchema.parse(
        await window.jarvis.getCommandRouterProductModeStatus(),
      );
      setCommandRouterProductModeStatus(status);
      setError(null);
      return true;
    } catch {
      setError("Command Router product mode status could not be read.");
      return false;
    }
  }, []);

  const refreshQwenRuntimeControlStatus = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    try {
      const status = QwenRuntimeControlStatusSchema.parse(
        await window.jarvis.getQwenRuntimeControlStatus(),
      );
      setQwenRuntimeControlStatus(status);
      setError(null);
      return true;
    } catch {
      setError("Qwen runtime control status could not be read.");
      return false;
    }
  }, []);

  const refreshPlugins = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.getPluginManagementStatus",
        payload: {},
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const status = PluginManagementStatusResultSchema.safeParse(
        (result.data as { plugins?: unknown } | undefined)?.plugins,
      );
      if (!status.success) {
        setError("Core returned an invalid plugin management status.");
        return false;
      }
      setPluginManagementStatus(status.data);
      setError(null);
      return true;
    } catch {
      setError("Plugin management status could not be read.");
      return false;
    }
  }, []);

  const refreshLocalPluginManifestDeveloperStatus = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.getLocalPluginManifestDeveloperStatus",
        payload: {},
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const status = LocalPluginManifestDeveloperStatusResultSchema.safeParse(
        (
          result.data as
            { localPluginManifestDeveloperStatus?: unknown } | undefined
        )?.localPluginManifestDeveloperStatus,
      );
      if (!status.success) {
        setError("Core returned an invalid local plugin manifest status.");
        return false;
      }
      setLocalPluginManifestDeveloperStatus(status.data);
      setError(null);
      return true;
    } catch {
      setError("Local plugin manifest status could not be read.");
      return false;
    }
  }, []);

  const setLocalPluginEnabledState = useCallback(
    async (
      pluginId: string,
      enabled: boolean,
    ): Promise<LocalPluginEnabledStateSetResult | null> => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return null;
      }
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.setLocalPluginEnabledState",
          payload: {
            pluginId,
            enabled,
          },
        });
        if (!result.ok) {
          setError(result.error.message);
          return null;
        }
        const parsed = LocalPluginEnabledStateSetResultSchema.safeParse(
          (result.data as { result?: unknown } | undefined)?.result,
        );
        if (!parsed.success) {
          setError("Core returned an invalid local plugin state result.");
          return null;
        }
        await refreshPlugins();
        await refreshLocalPluginManifestDeveloperStatus();
        setError(null);
        return parsed.data;
      } catch {
        setError("Local plugin state could not be updated.");
        return null;
      }
    },
    [refreshLocalPluginManifestDeveloperStatus, refreshPlugins],
  );

  const setQwenRuntimeControlAction = useCallback(
    async (action: QwenRuntimeControlAction) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      try {
        const result = await window.jarvis.setQwenRuntimeControlAction(action);
        setQwenRuntimeControlStatus(result.status);
        if (!result.ok) {
          setError(
            result.message ?? "Qwen runtime control could not be changed.",
          );
          return false;
        }
        setError(null);
        return true;
      } catch {
        setError("Qwen runtime control could not be changed.");
        return false;
      }
    },
    [],
  );

  const setCommandRouterProductModeEnabled = useCallback(
    async (enabled: boolean) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      try {
        const result =
          await window.jarvis.setCommandRouterProductModeEnabled(enabled);
        setCommandRouterProductModeStatus(result.status);
        if (!result.ok) {
          setError(
            result.message ??
              "Command Router product mode could not be changed.",
          );
          return false;
        }
        setError(null);
        return true;
      } catch {
        setError("Command Router product mode could not be changed.");
        return false;
      }
    },
    [],
  );

  const setChatAnswerProductModeEnabled = useCallback(
    async (enabled: boolean) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      try {
        const result =
          await window.jarvis.setChatAnswerProductModeEnabled(enabled);
        setChatAnswerProductModeStatus(result.status);
        if (!result.ok) {
          setError(
            result.message ?? "Chat Answer product mode could not be changed.",
          );
          return false;
        }
        setError(null);
        return true;
      } catch {
        setError("Chat Answer product mode could not be changed.");
        return false;
      }
    },
    [],
  );

  const confirmCommandRouterLocalAppLaunch = useCallback(
    async (target: string) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return null;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.confirmCommandRouterLocalAppLaunch",
          payload: {
            target,
            confirmation: "explicit_ui_confirmation",
          },
        });
        if (!result.ok) {
          setError(result.error.message);
          return null;
        }
        const launch = CommandRouterLocalAppLaunchResultSchema.safeParse(
          (result.data as { launch?: unknown } | undefined)?.launch,
        );
        if (!launch.success) {
          setError("Core returned an invalid local app launch result.");
          return null;
        }
        setCommandRouterLocalAppLaunchResult(launch.data);
        setError(null);
        return launch.data;
      } finally {
        setSending(false);
      }
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = window.jarvis?.onEvent(applyEvent);
    void refreshSnapshot();
    return () => {
      unsubscribe?.();
    };
  }, [applyEvent, refreshSnapshot]);

  const textOnlyAcceptanceEnabled =
    snapshot?.textOnlyAcceptance?.enabled === true;
  const snapshotReady = snapshot !== null;

  useEffect(() => {
    if (!snapshotReady) {
      return;
    }
    if (textOnlyAcceptanceEnabled) {
      setVoiceServiceStatus(null);
      setTtsServiceStatus(null);
      void refreshChatAnswerProductModeStatus();
      void refreshCommandRouterProductModeStatus();
      void refreshPlugins();
      void refreshQwenRuntimeControlStatus();
      void refreshUserControlledMemories();
      void refreshUserRouteAliases();
      return;
    }

    const handleWindowFocus = () => {
      void refreshVoiceServiceStatus();
      void refreshTtsServiceStatus();
      void refreshChatAnswerProductModeStatus();
      void refreshCommandRouterProductModeStatus();
      void refreshPlugins();
      void refreshQwenRuntimeControlStatus();
      void refreshUserControlledMemories();
      void refreshUserRouteAliases();
    };
    window.addEventListener("focus", handleWindowFocus);
    void refreshVoiceServiceStatus();
    void refreshTtsServiceStatus();
    void refreshChatAnswerProductModeStatus();
    void refreshCommandRouterProductModeStatus();
    void refreshPlugins();
    void refreshQwenRuntimeControlStatus();
    void refreshUserControlledMemories();
    void refreshUserRouteAliases();
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [
    refreshChatAnswerProductModeStatus,
    refreshCommandRouterProductModeStatus,
    refreshPlugins,
    refreshQwenRuntimeControlStatus,
    refreshTtsServiceStatus,
    refreshUserControlledMemories,
    refreshUserRouteAliases,
    refreshVoiceCommandAliases,
    refreshVoiceServiceStatus,
    snapshotReady,
    textOnlyAcceptanceEnabled,
  ]);

  return {
    connection,
    brainResult,
    chatAnswerProductModeStatus,
    commandRouterLocalAppLaunchResult,
    commandRouterProductModeStatus,
    qwenRuntimeControlStatus,
    approveTask,
    cancelTask,
    clearSessionHistory,
    error,
    createConversation,
    disableMemoryAlpha,
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
    modelInventory,
    localPluginManifestDeveloperStatus,
    modelInstallabilityReports,
    modelManifests,
    modelOperations,
    memoryAlphaRecallProbe,
    memoryAlphaStatus,
    openTtsSettings,
    openVoiceSettings,
    pluginManagementStatus,
    probeMemoryAlphaRecall,
    probeCore,
    refreshCapabilities,
    refreshChatAnswerProductModeStatus,
    refreshCommandRouterProductModeStatus,
    refreshLocalPluginManifestDeveloperStatus,
    refreshQwenRuntimeControlStatus,
    refreshUserControlledMemories,
    refreshVoiceCommandAliases,
    refreshMemoryAlphaStatus,
    refreshMemoryHealth,
    refreshModelGovernance,
    refreshPlugins,
    refreshSnapshot,
    renameConversation,
    resourceDiagnostics,
    setLocalPluginEnabledState,
    retryBrainCommand,
    rollbackBrainResult,
    confirmVoiceCommandCorrection,
    confirmUserRouteAlias,
    deleteUserControlledMemory,
    deleteVoiceCommandAlias,
    deleteUserRouteAlias,
    refreshTtsServiceStatus,
    refreshUserRouteAliases,
    confirmCommandRouterLocalAppLaunch,
    runFixtureEmbeddingProbe,
    runFixtureIntentProbe,
    runFixtureOcrProbe,
    runFixtureRerankProbe,
    runBrainCommand,
    sendCommand,
    sendMessage,
    selectConversation,
    setChatAnswerProductModeEnabled,
    setCommandRouterProductModeEnabled,
    setQwenRuntimeControlAction,
    sending,
    snapshot,
    ttsServiceStatus,
    userControlledMemories,
    userRouteAliases,
    voiceCommandAliases,
    voiceServiceStatus,
  };
}

function neverAlias(): VoiceCommandAliasRecord {
  throw new Error("Unreachable invalid voice command alias.");
}

function neverUserRouteAlias(): UserRouteAliasRecord {
  throw new Error("Unreachable invalid user route alias.");
}

function neverUserControlledMemory(): UserControlledMemoryRecord {
  throw new Error("Unreachable invalid user-controlled memory.");
}

function toFixtureEmbeddingProbe(
  result: EmbeddingGenerationResult,
  operation: ModelOperationSnapshot | undefined,
): FixtureEmbeddingProbe {
  return {
    dimensions: result.dimensions,
    generatedAt: result.generatedAt,
    ...(operation ? { operationPhase: operation.phase } : {}),
    vectorCount: result.vectors.length,
  };
}

function toFixtureIntentProbe(
  result: IntentRoutingResult,
  operation: ModelOperationSnapshot | undefined,
): FixtureIntentProbe {
  const firstCandidate = result.candidates[0];
  return {
    candidateCount: result.candidates.length,
    ...(firstCandidate ? { intent: firstCandidate.intent } : {}),
    ...(operation ? { operationPhase: operation.phase } : {}),
  };
}

function toFixtureOcrProbe(
  result: OcrRecognitionResult,
  operation: ModelOperationSnapshot | undefined,
): FixtureOcrProbe {
  return {
    blockCount: result.blocks.length,
    ...(operation ? { operationPhase: operation.phase } : {}),
    text: result.text,
  };
}

function toFixtureRerankProbe(
  result: RerankResult,
  operation: ModelOperationSnapshot | undefined,
): FixtureRerankProbe {
  const top = result.results[0];
  return {
    ...(operation ? { operationPhase: operation.phase } : {}),
    resultCount: result.results.length,
    ...(top ? { topDocumentId: top.documentId } : {}),
  };
}

function upsertModelOperation(
  current: ModelOperationSnapshot[],
  operation: ModelOperationSnapshot,
): ModelOperationSnapshot[] {
  const existingIndex = current.findIndex(
    (item) => item.operationId === operation.operationId,
  );
  if (existingIndex < 0) return [operation, ...current];
  return current.map((item, index) =>
    index === existingIndex ? operation : item,
  );
}
