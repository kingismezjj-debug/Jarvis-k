import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  CoreSnapshotSchema,
  type AppCommand,
  type BrainCommandResult,
  type ChatAnswerProductModeStatus,
  type CommandRouterLocalAppLaunchResult,
  type CommandRouterProductModeStatus,
  type CoreSnapshot,
  type EventEnvelope,
  type MemoryAlphaRecallProbeResult,
  type MemoryAlphaStatus,
  type LocalPluginManifestDeveloperStatusResult,
  type PluginManagementStatusResult,
  type QwenRuntimeControlStatus,
  type TtsServiceStatus,
  type UserControlledMemoryRecord,
  type UserRouteAliasRecord,
  type VoiceCommandAliasRecord,
  type VoiceRegressionCollectionStatus,
  type VoiceRegressionSample,
  type VoiceRegressionRecord,
  type VoiceServiceStatus,
} from "@jarvis-k/contracts";
import {
  initialJarvisConversationState,
  jarvisConversationReducer,
} from "./jarvis-conversation-state";
import {
  initialJarvisDiagnosticsState,
  jarvisDiagnosticsReducer,
} from "./jarvis-diagnostics-state";
import {
  prependBoundedEvent,
  routeJarvisEvent,
} from "./jarvis-event-router";
import {
  initialJarvisMemoryState,
  jarvisMemoryReducer,
} from "./jarvis-memory-state";
import {
  initialJarvisPluginState,
  jarvisPluginReducer,
} from "./jarvis-plugin-state";
import {
  initialJarvisVoiceState,
  jarvisVoiceReducer,
} from "./jarvis-voice-state";
import { useJarvisConversationActions } from "./use-jarvis-conversation-actions";
import { useJarvisDiagnosticsActions } from "./use-jarvis-diagnostics-actions";
import { useJarvisEventBridge } from "./use-jarvis-event-bridge";
import { useJarvisMemoryActions } from "./use-jarvis-memory-actions";
import { useJarvisPluginActions } from "./use-jarvis-plugin-actions";
import { useJarvisTaskActions } from "./use-jarvis-task-actions";
import { useJarvisVoiceActions } from "./use-jarvis-voice-actions";
import { useModelGovernance } from "./use-model-governance";

type CoreConnection = "connecting" | "online" | "restarting" | "offline";

export function useJarvis() {
  const [snapshot, setSnapshot] = useState<CoreSnapshot | null>(null);
  const [events, setEvents] = useState<EventEnvelope[]>([]);
  const [connection, setConnection] = useState<CoreConnection>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [conversationState, dispatchConversationState] = useReducer(
    jarvisConversationReducer,
    initialJarvisConversationState,
  );
  const [memoryState, dispatchMemoryState] = useReducer(
    jarvisMemoryReducer,
    initialJarvisMemoryState,
  );
  const [voiceState, dispatchVoiceState] = useReducer(
    jarvisVoiceReducer,
    initialJarvisVoiceState,
  );
  const [diagnosticsState, dispatchDiagnosticsState] = useReducer(
    jarvisDiagnosticsReducer,
    initialJarvisDiagnosticsState,
  );
  const [pluginState, dispatchPluginState] = useReducer(
    jarvisPluginReducer,
    initialJarvisPluginState,
  );
  const { brainResult } = conversationState;
  const {
    memoryAlphaStatus,
    memoryAlphaRecallProbe,
    userRouteAliases,
    userControlledMemories,
  } = memoryState;
  const {
    voiceCommandAliases,
    voiceRegressionExportText,
    voiceRegressionPendingSamples,
    voiceRegressionRecords,
    voiceRegressionStatus,
    voiceServiceStatus,
    ttsServiceStatus,
  } = voiceState;
  const {
    chatAnswerProductModeStatus,
    commandRouterProductModeStatus,
    qwenRuntimeControlStatus,
    commandRouterLocalAppLaunchResult,
  } = diagnosticsState;
  const { pluginManagementStatus, localPluginManifestDeveloperStatus } =
    pluginState;
  const setBrainResult = useCallback((brainResult: BrainCommandResult | null) => {
    dispatchConversationState({ type: "brainResult.set", brainResult });
  }, []);
  const setMemoryAlphaStatus = useCallback(
    (status: MemoryAlphaStatus | null) => {
      dispatchMemoryState({ type: "memoryAlphaStatus.set", status });
    },
    [],
  );
  const setMemoryAlphaProbeResult = useCallback(
    (status: MemoryAlphaStatus, probe: MemoryAlphaRecallProbeResult) => {
      dispatchMemoryState({
        type: "memoryAlphaProbe.set",
        status,
        probe,
      });
    },
    [],
  );
  const setUserRouteAliases = useCallback((aliases: UserRouteAliasRecord[]) => {
    dispatchMemoryState({ type: "routeAliases.set", aliases });
  }, []);
  const setUserControlledMemories = useCallback(
    (memories: UserControlledMemoryRecord[]) => {
      dispatchMemoryState({ type: "controlledMemories.set", memories });
    },
    [],
  );
  const setVoiceCommandAliases = useCallback(
    (aliases: VoiceCommandAliasRecord[]) => {
      dispatchVoiceState({ type: "voiceAliases.set", aliases });
    },
    [],
  );
  const setVoiceRegressionExportText = useCallback(
    (exportText: string | null) => {
      dispatchVoiceState({ type: "voiceRegressionExport.set", exportText });
    },
    [],
  );
  const setVoiceRegressionRecords = useCallback(
    (records: VoiceRegressionRecord[]) => {
      dispatchVoiceState({ type: "voiceRegressionRecords.set", records });
    },
    [],
  );
  const setVoiceRegressionPendingSamples = useCallback(
    (samples: VoiceRegressionSample[]) => {
      dispatchVoiceState({
        type: "voiceRegressionPendingSamples.set",
        samples,
      });
    },
    [],
  );
  const setVoiceRegressionStatus = useCallback(
    (status: VoiceRegressionCollectionStatus | null) => {
      dispatchVoiceState({ type: "voiceRegressionStatus.set", status });
    },
    [],
  );
  const setVoiceServiceStatus = useCallback(
    (status: VoiceServiceStatus | null) => {
      dispatchVoiceState({ type: "voiceServiceStatus.set", status });
    },
    [],
  );
  const setTtsServiceStatus = useCallback((status: TtsServiceStatus | null) => {
    dispatchVoiceState({ type: "ttsServiceStatus.set", status });
  }, []);
  const setChatAnswerProductModeStatus = useCallback(
    (status: ChatAnswerProductModeStatus | null) => {
      dispatchDiagnosticsState({
        type: "chatAnswerProductModeStatus.set",
        status,
      });
    },
    [],
  );
  const setCommandRouterProductModeStatus = useCallback(
    (status: CommandRouterProductModeStatus | null) => {
      dispatchDiagnosticsState({
        type: "commandRouterProductModeStatus.set",
        status,
      });
    },
    [],
  );
  const setQwenRuntimeControlStatus = useCallback(
    (status: QwenRuntimeControlStatus | null) => {
      dispatchDiagnosticsState({ type: "qwenRuntimeControlStatus.set", status });
    },
    [],
  );
  const setCommandRouterLocalAppLaunchResult = useCallback(
    (result: CommandRouterLocalAppLaunchResult | null) => {
      dispatchDiagnosticsState({
        type: "commandRouterLocalAppLaunchResult.set",
        result,
      });
    },
    [],
  );
  const setPluginManagementStatus = useCallback(
    (status: PluginManagementStatusResult | null) => {
      dispatchPluginState({ type: "pluginManagementStatus.set", status });
    },
    [],
  );
  const setLocalPluginManifestDeveloperStatus = useCallback(
    (status: LocalPluginManifestDeveloperStatusResult | null) => {
      dispatchPluginState({
        type: "localPluginManifestDeveloperStatus.set",
        status,
      });
    },
    [],
  );
  const {
    refreshPlugins,
    refreshLocalPluginManifestDeveloperStatus,
    setLocalPluginEnabledState,
  } = useJarvisPluginActions({
    setError,
    setPluginManagementStatus,
    setLocalPluginManifestDeveloperStatus,
  });
  const [sending, setSending] = useState(false);
  const modelGovernance = useModelGovernance({ setError, setSending });
  const {
    applyModelOperation,
    fixtureEmbeddingProbe,
    fixtureIntentProbe,
    fixtureOcrProbe,
    fixtureRerankProbe,
    inferenceProviderRequirements,
    inferenceProviders,
    modelCandidates,
    modelInstallabilityReports,
    modelInventory,
    modelManifests,
    modelOperations,
    refreshModelGovernance,
    resourceDiagnostics,
    runFixtureEmbeddingProbe,
    runFixtureIntentProbe,
    runFixtureOcrProbe,
    runFixtureRerankProbe,
  } = modelGovernance;
  const dispatchedVoiceTranscriptKeys = useRef<Set<string>>(new Set());
  const textOnlyAcceptanceRef = useRef(false);
  const refreshVoiceRegressionAfterFinalRef = useRef<() => void>(() => {
    // Voice regression is local-only and optional; no-op until voice actions bind.
  });

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

  const {
    clearSessionHistory,
    createConversation,
    dispatchBrainCommand,
    renameConversation,
    retryBrainCommand,
    rollbackBrainResult,
    runBrainCommand,
    sendMessage,
    selectConversation,
  } = useJarvisConversationActions({
    brainResult,
    setBrainResult,
    setError,
    setSending,
    sendCommand,
  });

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
        void dispatchBrainCommand(text, "voice").then(() => {
          refreshVoiceRegressionAfterFinalRef.current();
        });
        return;
      }
    },
    [dispatchBrainCommand],
  );

  const applyEvent = useCallback(
    (envelope: EventEnvelope) => {
      routeJarvisEvent(envelope, {
        appendEvent: (event) =>
          setEvents((current) => prependBoundedEvent(current, event)),
        applySnapshot: (nextSnapshot) => {
          textOnlyAcceptanceRef.current =
            nextSnapshot.textOnlyAcceptance?.enabled === true;
          setSnapshot(nextSnapshot);
          setMemoryAlphaStatus(nextSnapshot.memoryAlpha ?? null);
          setConnection("online");
          setError(null);
        },
        applyModelOperation,
        applyFinalVoiceTranscript: dispatchFinalVoiceTranscript,
        applyLifecycleStatus: (status) => {
          if (status === "online") setConnection("online");
          if (status === "starting" || status === "restarting") {
            setConnection("restarting");
          }
          if (status === "stopped" || status === "failed") {
            setConnection("offline");
          }
        },
      });
    },
    [applyModelOperation, dispatchFinalVoiceTranscript],
  );

  const {
    confirmCommandRouterLocalAppLaunch,
    probeCore,
    refreshCapabilities,
    refreshChatAnswerProductModeStatus,
    refreshCommandRouterProductModeStatus,
    refreshQwenRuntimeControlStatus,
    setChatAnswerProductModeEnabled,
    setCommandRouterProductModeEnabled,
    setQwenRuntimeControlAction,
  } = useJarvisDiagnosticsActions({
    setError,
    setSending,
    sendCommand,
    setChatAnswerProductModeStatus,
    setCommandRouterProductModeStatus,
    setQwenRuntimeControlStatus,
    setCommandRouterLocalAppLaunchResult,
  });

  const {
    clearVoiceRegressionPendingSamples,
    clearVoiceRegressionRecords,
    confirmVoiceCommandCorrection,
    discardVoiceRegressionPendingSample,
    deleteVoiceRegressionRecord,
    deleteVoiceCommandAlias,
    exportVoiceRegressionRecords,
    openTtsSettings,
    openVoiceSettings,
    refreshTtsServiceStatus,
    refreshVoiceCommandAliases,
    refreshVoiceRegressionPendingSamples,
    refreshVoiceRegressionCollectionStatus,
    refreshVoiceRegressionRecords,
    refreshVoiceServiceStatus,
    saveVoiceRegressionPendingSample,
    setVoiceRegressionLocalTextCollection,
    submitVoiceRegressionFeedback,
  } = useJarvisVoiceActions({
    brainResult,
    setError,
    setSending,
    setVoiceCommandAliases,
    setVoiceRegressionExportText,
    setVoiceRegressionPendingSamples,
    setVoiceRegressionRecords,
    setVoiceRegressionStatus,
    setVoiceServiceStatus,
    setTtsServiceStatus,
    dispatchBrainCommand,
  });
  refreshVoiceRegressionAfterFinalRef.current = () => {
    void refreshVoiceRegressionCollectionStatus();
    void refreshVoiceRegressionPendingSamples();
  };

  const {
    confirmUserRouteAlias,
    deleteUserControlledMemory,
    deleteUserRouteAlias,
    disableMemoryAlpha,
    exportMemorySnapshot,
    importMemorySnapshot,
    probeMemoryAlphaRecall,
    refreshMemoryAlphaStatus,
    refreshMemoryHealth,
    refreshUserControlledMemories,
    refreshUserRouteAliases,
  } = useJarvisMemoryActions({
    setError,
    setSending,
    sendCommand,
    setSnapshot,
    setMemoryAlphaStatus,
    setMemoryAlphaProbeResult,
    setUserRouteAliases,
    setUserControlledMemories,
    refreshVoiceCommandAliases,
  });

  const { approveTask, cancelTask } = useJarvisTaskActions({
    setError,
    setSending,
    refreshSnapshot,
  });

  useJarvisEventBridge({
    onEvent: applyEvent,
    refreshSnapshot,
  });

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
      void refreshVoiceRegressionCollectionStatus();
      void refreshVoiceRegressionPendingSamples();
      void refreshVoiceRegressionRecords();
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
      void refreshVoiceRegressionCollectionStatus();
      void refreshVoiceRegressionPendingSamples();
      void refreshVoiceRegressionRecords();
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
    void refreshVoiceRegressionCollectionStatus();
    void refreshVoiceRegressionPendingSamples();
    void refreshVoiceRegressionRecords();
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
    refreshVoiceRegressionCollectionStatus,
    refreshVoiceRegressionPendingSamples,
    refreshVoiceRegressionRecords,
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
    clearVoiceRegressionPendingSamples,
    clearVoiceRegressionRecords,
    confirmVoiceCommandCorrection,
    confirmUserRouteAlias,
    deleteUserControlledMemory,
    discardVoiceRegressionPendingSample,
    deleteVoiceRegressionRecord,
    deleteVoiceCommandAlias,
    deleteUserRouteAlias,
    exportVoiceRegressionRecords,
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
    saveVoiceRegressionPendingSample,
    setVoiceRegressionLocalTextCollection,
    submitVoiceRegressionFeedback,
    sending,
    snapshot,
    ttsServiceStatus,
    userControlledMemories,
    userRouteAliases,
    voiceCommandAliases,
    voiceRegressionExportText,
    voiceRegressionPendingSamples,
    voiceRegressionRecords,
    voiceRegressionStatus,
    voiceServiceStatus,
  };
}
