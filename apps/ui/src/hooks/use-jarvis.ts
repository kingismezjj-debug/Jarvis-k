import { useCallback, useEffect, useRef, useState } from "react";
import {
  BrainCommandResultSchema,
  CommandRouterLocalAppLaunchResultSchema,
  CommandRouterProductModeStatusSchema,
  CoreSnapshotSchema,
  ChatAnswerProductModeStatusSchema,
  QwenRuntimeControlStatusSchema,
  type AppCommand,
  type BrainCommandResult,
  type BrainCommandSource,
  type ChatAnswerProductModeStatus,
  type CommandRouterLocalAppLaunchResult,
  type CommandRouterProductModeStatus,
  type CoreSnapshot,
  type EventEnvelope,
  type MemoryAlphaRecallProbeResult,
  type MemoryAlphaStatus,
  type LocalPluginManifestDeveloperStatusResult,
  type PluginManagementStatusResult,
  type QwenRuntimeControlAction,
  type QwenRuntimeControlStatus,
  type TtsServiceStatus,
  type UserControlledMemoryRecord,
  type UserRouteAliasRecord,
  type VoiceCommandAliasRecord,
  type VoiceServiceStatus,
} from "@jarvis-k/contracts";
import {
  prependBoundedEvent,
  routeJarvisEvent,
} from "./jarvis-event-router";
import { useJarvisEventBridge } from "./use-jarvis-event-bridge";
import { useJarvisMemoryActions } from "./use-jarvis-memory-actions";
import { useJarvisPluginActions } from "./use-jarvis-plugin-actions";
import { useJarvisVoiceActions } from "./use-jarvis-voice-actions";
import { useModelGovernance } from "./use-model-governance";

type CoreConnection = "connecting" | "online" | "restarting" | "offline";

export function useJarvis() {
  const [snapshot, setSnapshot] = useState<CoreSnapshot | null>(null);
  const [events, setEvents] = useState<EventEnvelope[]>([]);
  const [connection, setConnection] = useState<CoreConnection>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [memoryAlphaStatus, setMemoryAlphaStatus] =
    useState<MemoryAlphaStatus | null>(null);
  const [memoryAlphaRecallProbe, setMemoryAlphaRecallProbe] =
    useState<MemoryAlphaRecallProbeResult | null>(null);
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

  const {
    confirmVoiceCommandCorrection,
    deleteVoiceCommandAlias,
    openTtsSettings,
    openVoiceSettings,
    refreshTtsServiceStatus,
    refreshVoiceCommandAliases,
    refreshVoiceServiceStatus,
  } = useJarvisVoiceActions({
    brainResult,
    setError,
    setSending,
    setVoiceCommandAliases,
    setVoiceServiceStatus,
    setTtsServiceStatus,
    dispatchBrainCommand,
  });

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
    setMemoryAlphaRecallProbe,
    setUserRouteAliases,
    setUserControlledMemories,
    refreshVoiceCommandAliases,
  });

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

  const refreshCapabilities = useCallback(
    async () =>
      sendCommand({
        type: "agent.getCapabilities",
        payload: {},
      }),
    [sendCommand],
  );

  const probeCore = useCallback(
    async () =>
      sendCommand({
        type: "agent.ping",
        payload: { sentAt: new Date().toISOString() },
      }),
    [sendCommand],
  );

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
