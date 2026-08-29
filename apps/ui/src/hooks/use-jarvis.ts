import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
  CoreSnapshotSchema,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
  type AppCommand,
  type BrainCommandResult,
  type ChatAnswerProductModeStatus,
  type CommandRouterLocalAppLaunchResult,
  type CommandRouterProductModeStatus,
  type CloudProviderAcceptanceCommandResult,
  type CloudProviderAcceptanceDiagnosticReport,
  type CloudProviderAcceptancePreflightResult,
  type CloudProviderAcceptanceStatus,
  type CoreSnapshot,
  type DesktopCloseButtonBehavior,
  type DesktopFirstRunOnboardingState,
  type DesktopLaunchAtLoginStatus,
  type DesktopPetReducedMotion,
  type DesktopSettings,
  type DesktopUiTheme,
  type EventEnvelope,
  type GlmAdvancedBrainAcceptanceCommandResult,
  type GlmAdvancedBrainAcceptanceDiagnosticReport,
  type GlmAdvancedBrainAcceptanceModelId,
  type GlmAdvancedBrainAcceptancePreflightResult,
  type GlmAdvancedBrainAcceptanceStatus,
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

export type UseJarvisOptions = {
  cloudProviderAcceptanceSurfaceEnabled?: boolean;
  evaluationSurfaceEnabled?: boolean;
};

const GLM_ADVANCED_BRAIN_ACCEPTANCE_CONSENT = {
  cloudEgressAllowed: true,
  acceptanceConsent: true,
} as const;

const CLOUD_PROVIDER_ACCEPTANCE_CONSENT = {
  acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
  cloudEgressAllowed: true,
  acceptanceConsent: true,
  providerKeyTypeConfirmed: true,
  apiBalanceConfirmedByUser: true,
} as const;

export function useJarvis(options: UseJarvisOptions = {}) {
  const cloudProviderAcceptanceSurfaceEnabled =
    options.cloudProviderAcceptanceSurfaceEnabled === true;
  const evaluationSurfaceEnabled = options.evaluationSurfaceEnabled === true;
  const [snapshot, setSnapshot] = useState<CoreSnapshot | null>(null);
  const [events, setEvents] = useState<EventEnvelope[]>([]);
  const [connection, setConnection] = useState<CoreConnection>("connecting");
  const [desktopSettings, setDesktopSettings] =
    useState<DesktopSettings | null>(null);
  const [desktopLaunchAtLoginStatus, setDesktopLaunchAtLoginStatus] =
    useState<DesktopLaunchAtLoginStatus | null>(null);
  const [
    glmAdvancedBrainAcceptanceStatus,
    setGlmAdvancedBrainAcceptanceStatus,
  ] = useState<GlmAdvancedBrainAcceptanceStatus | null>(null);
  const [
    glmAdvancedBrainAcceptancePreflight,
    setGlmAdvancedBrainAcceptancePreflight,
  ] = useState<GlmAdvancedBrainAcceptancePreflightResult | null>(null);
  const [
    glmAdvancedBrainAcceptanceReport,
    setGlmAdvancedBrainAcceptanceReport,
  ] = useState<GlmAdvancedBrainAcceptanceDiagnosticReport | null>(null);
  const [
    cloudProviderAcceptanceStatus,
    setCloudProviderAcceptanceStatus,
  ] = useState<CloudProviderAcceptanceStatus | null>(null);
  const [
    cloudProviderAcceptancePreflight,
    setCloudProviderAcceptancePreflight,
  ] = useState<CloudProviderAcceptancePreflightResult | null>(null);
  const [
    cloudProviderAcceptanceReport,
    setCloudProviderAcceptanceReport,
  ] = useState<CloudProviderAcceptanceDiagnosticReport | null>(null);
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

  const refreshDesktopSettings = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    try {
      const [settings, launchAtLoginStatus] = await Promise.all([
        window.jarvis.getDesktopSettings(),
        window.jarvis.getDesktopLaunchAtLoginStatus(),
      ]);
      setDesktopSettings(settings);
      setDesktopLaunchAtLoginStatus(launchAtLoginStatus);
      return true;
    } catch {
      setError("Desktop settings are unavailable.");
      return false;
    }
  }, []);

  const setDesktopCloseButtonBehavior = useCallback(
    async (behavior: DesktopCloseButtonBehavior) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      const result = await window.jarvis.setDesktopCloseButtonBehavior(
        behavior,
      );
      setDesktopSettings(result.settings);
      if (!result.ok) {
        setError(result.message ?? "Desktop settings were rejected.");
        return false;
      }
      setError(null);
      return true;
    },
    [],
  );

  const setDesktopFirstRunOnboardingState = useCallback(
    async (state: DesktopFirstRunOnboardingState) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      const result = await window.jarvis.setDesktopFirstRunOnboardingState(
        state,
      );
      setDesktopSettings(result.settings);
      if (!result.ok) {
        setError(result.message ?? "Desktop settings were rejected.");
        return false;
      }
      setError(null);
      return true;
    },
    [],
  );

  const setDesktopLaunchAtLoginEnabled = useCallback(async (enabled: boolean) => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.setDesktopLaunchAtLoginEnabled(enabled);
    setDesktopSettings(result.settings);
    try {
      setDesktopLaunchAtLoginStatus(
        await window.jarvis.getDesktopLaunchAtLoginStatus(),
      );
    } catch {
      setDesktopLaunchAtLoginStatus(null);
    }
    if (!result.ok) {
      setError(result.message ?? "Launch at login setting was rejected.");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const setDesktopUiTheme = useCallback(async (theme: DesktopUiTheme) => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.setDesktopUiTheme(theme);
    setDesktopSettings(result.settings);
    if (!result.ok) {
      setError(result.message ?? "Desktop theme setting was rejected.");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const migrateLegacyDesktopUiTheme = useCallback(
    async (theme: DesktopUiTheme) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      const result = await window.jarvis.migrateLegacyDesktopUiTheme(theme);
      setDesktopSettings(result.settings);
      if (!result.ok) {
        setError(result.message ?? "Legacy desktop theme migration was rejected.");
        return false;
      }
      setError(null);
      return true;
    },
    [],
  );

  const setDesktopPetEnabled = useCallback(async (enabled: boolean) => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.setDesktopPetEnabled(enabled);
    setDesktopSettings(result.settings);
    if (!result.ok) {
      setError(result.message ?? "Desktop Pet setting was rejected.");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const setDesktopPetAlwaysOnTop = useCallback(async (enabled: boolean) => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.setDesktopPetAlwaysOnTop(enabled);
    setDesktopSettings(result.settings);
    if (!result.ok) {
      setError(result.message ?? "Desktop Pet setting was rejected.");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const setDesktopPetReducedMotion = useCallback(
    async (reducedMotion: DesktopPetReducedMotion) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      const result =
        await window.jarvis.setDesktopPetReducedMotion(reducedMotion);
      setDesktopSettings(result.settings);
      if (!result.ok) {
        setError(result.message ?? "Desktop Pet setting was rejected.");
        return false;
      }
      setError(null);
      return true;
    },
    [],
  );

  const resetDesktopPetPosition = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.resetDesktopPetPosition();
    setDesktopSettings(result.settings);
    if (!result.ok) {
      setError(result.message ?? "Desktop Pet position reset was rejected.");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const refreshGlmAdvancedBrainAcceptanceStatus = useCallback(async () => {
    if (!window.jarvis?.getGlmAdvancedBrainAcceptanceStatus) {
      setGlmAdvancedBrainAcceptanceStatus(null);
      return false;
    }
    try {
      const status = await window.jarvis.getGlmAdvancedBrainAcceptanceStatus();
      setGlmAdvancedBrainAcceptanceStatus(status);
      return true;
    } catch {
      setGlmAdvancedBrainAcceptanceStatus(null);
      setError("GLM Advanced Brain acceptance status is unavailable.");
      return false;
    }
  }, []);

  const refreshGlmAdvancedBrainAcceptancePreflightProjection =
    useCallback(async () => {
      if (!window.jarvis?.preflightGlmAdvancedBrainAcceptance) {
        setGlmAdvancedBrainAcceptancePreflight(null);
        return false;
      }
      try {
        const result = await window.jarvis.preflightGlmAdvancedBrainAcceptance(
          GLM_ADVANCED_BRAIN_ACCEPTANCE_CONSENT,
        );
        setGlmAdvancedBrainAcceptancePreflight(result);
        return result.allowRealAcceptance;
      } catch {
        setGlmAdvancedBrainAcceptancePreflight(null);
        return false;
      }
    }, []);

  const setGlmAdvancedBrainAcceptanceModel = useCallback(
    async (modelId: GlmAdvancedBrainAcceptanceModelId | null) => {
      if (!window.jarvis?.setGlmAdvancedBrainAcceptanceModel) {
        setError("GLM Advanced Brain acceptance is unavailable.");
        return false;
      }
      try {
        const result: GlmAdvancedBrainAcceptanceCommandResult =
          await window.jarvis.setGlmAdvancedBrainAcceptanceModel({ modelId });
        setGlmAdvancedBrainAcceptanceStatus(result.status);
        void refreshGlmAdvancedBrainAcceptancePreflightProjection();
        if (!result.ok) {
          setError(result.safeMessage ?? "GLM model selection was rejected.");
          return false;
        }
        setError(null);
        return true;
      } catch {
        setError("GLM model selection was rejected.");
        return false;
      }
    },
    [refreshGlmAdvancedBrainAcceptancePreflightProjection],
  );

  const saveGlmAdvancedBrainAcceptanceCredential = useCallback(
    async (apiKey: string) => {
      if (!window.jarvis?.saveGlmAdvancedBrainAcceptanceCredential) {
        setError("GLM Advanced Brain acceptance is unavailable.");
        return false;
      }
      try {
        const result =
          await window.jarvis.saveGlmAdvancedBrainAcceptanceCredential({
            apiKey,
            credentialTypeConfirmation:
              GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
          });
        setGlmAdvancedBrainAcceptanceStatus(result.status);
        void refreshGlmAdvancedBrainAcceptancePreflightProjection();
        if (!result.ok) {
          setError(result.safeMessage ?? "GLM credential was rejected.");
          return false;
        }
        setError(null);
        return true;
      } catch {
        setError("GLM credential was rejected.");
        return false;
      }
    },
    [refreshGlmAdvancedBrainAcceptancePreflightProjection],
  );

  const deleteGlmAdvancedBrainAcceptanceCredential = useCallback(async () => {
    if (!window.jarvis?.deleteGlmAdvancedBrainAcceptanceCredential) {
      setError("GLM Advanced Brain acceptance is unavailable.");
      return false;
    }
    try {
      const result =
        await window.jarvis.deleteGlmAdvancedBrainAcceptanceCredential();
      setGlmAdvancedBrainAcceptanceStatus(result.status);
      void refreshGlmAdvancedBrainAcceptancePreflightProjection();
      if (!result.ok) {
        setError(result.safeMessage ?? "GLM credential could not be deleted.");
        return false;
      }
      setError(null);
      return true;
    } catch {
      setError("GLM credential could not be deleted.");
      return false;
    }
  }, [refreshGlmAdvancedBrainAcceptancePreflightProjection]);

  const preflightGlmAdvancedBrainAcceptance = useCallback(async () => {
    if (!window.jarvis?.preflightGlmAdvancedBrainAcceptance) {
      setError("GLM Advanced Brain acceptance preflight is unavailable.");
      return false;
    }
    try {
      const allowed =
        await refreshGlmAdvancedBrainAcceptancePreflightProjection();
      setError(null);
      return allowed;
    } catch {
      setError("GLM Advanced Brain acceptance preflight was rejected.");
      return false;
    }
  }, [refreshGlmAdvancedBrainAcceptancePreflightProjection]);

  const runGlmAdvancedBrainAcceptanceDiagnostic = useCallback(async () => {
    if (!window.jarvis?.runGlmAdvancedBrainAcceptanceDiagnostic) {
      setError("GLM Advanced Brain acceptance diagnostic is unavailable.");
      return false;
    }
    setSending(true);
    try {
      const result = await window.jarvis.runGlmAdvancedBrainAcceptanceDiagnostic({
        ...GLM_ADVANCED_BRAIN_ACCEPTANCE_CONSENT,
      });
      setGlmAdvancedBrainAcceptanceReport(result);
      await Promise.all([
        refreshGlmAdvancedBrainAcceptanceStatus(),
        refreshGlmAdvancedBrainAcceptancePreflightProjection(),
      ]);
      setError(null);
      return true;
    } catch {
      await Promise.all([
        refreshGlmAdvancedBrainAcceptanceStatus(),
        refreshGlmAdvancedBrainAcceptancePreflightProjection(),
      ]);
      setError("GLM Advanced Brain acceptance diagnostic was rejected.");
      return false;
    } finally {
      setSending(false);
    }
  }, [
    refreshGlmAdvancedBrainAcceptancePreflightProjection,
    refreshGlmAdvancedBrainAcceptanceStatus,
  ]);

  const refreshCloudProviderAcceptanceStatus = useCallback(async () => {
    if (!window.jarvis?.getCloudProviderAcceptanceStatus) {
      setCloudProviderAcceptanceStatus(null);
      return false;
    }
    try {
      const status = await window.jarvis.getCloudProviderAcceptanceStatus();
      setCloudProviderAcceptanceStatus(status);
      return true;
    } catch {
      setCloudProviderAcceptanceStatus(null);
      setError("Cloud provider acceptance status is unavailable.");
      return false;
    }
  }, []);

  const refreshCloudProviderAcceptancePreflightProjection =
    useCallback(async () => {
      if (!window.jarvis?.preflightCloudProviderAcceptance) {
        setCloudProviderAcceptancePreflight(null);
        return false;
      }
      try {
        const result = await window.jarvis.preflightCloudProviderAcceptance(
          CLOUD_PROVIDER_ACCEPTANCE_CONSENT,
        );
        setCloudProviderAcceptancePreflight(result);
        return result.allowFakeAcceptance;
      } catch {
        setCloudProviderAcceptancePreflight(null);
        return false;
      }
    }, []);

  const saveCloudProviderAcceptanceCredential = useCallback(
    async (credential: string) => {
      if (!window.jarvis?.saveCloudProviderAcceptanceCredential) {
        setError("Cloud provider acceptance is unavailable.");
        return false;
      }
      try {
        const result: CloudProviderAcceptanceCommandResult =
          await window.jarvis.saveCloudProviderAcceptanceCredential({
            bindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
            credentialTypeConfirmation: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
            credential,
          });
        setCloudProviderAcceptanceStatus(result.status);
        void refreshCloudProviderAcceptancePreflightProjection();
        if (!result.ok) {
          setError(result.safeMessage ?? "Cloud provider credential was rejected.");
          return false;
        }
        setError(null);
        return true;
      } catch {
        setError("Cloud provider credential was rejected.");
        return false;
      }
    },
    [refreshCloudProviderAcceptancePreflightProjection],
  );

  const deleteCloudProviderAcceptanceCredential = useCallback(async () => {
    if (!window.jarvis?.deleteCloudProviderAcceptanceCredential) {
      setError("Cloud provider acceptance is unavailable.");
      return false;
    }
    try {
      const result: CloudProviderAcceptanceCommandResult =
        await window.jarvis.deleteCloudProviderAcceptanceCredential({
          bindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
        });
      setCloudProviderAcceptanceStatus(result.status);
      void refreshCloudProviderAcceptancePreflightProjection();
      if (!result.ok) {
        setError(
          result.safeMessage ?? "Cloud provider credential could not be deleted.",
        );
        return false;
      }
      setError(null);
      return true;
    } catch {
      setError("Cloud provider credential could not be deleted.");
      return false;
    }
  }, [refreshCloudProviderAcceptancePreflightProjection]);

  const preflightCloudProviderAcceptance = useCallback(async () => {
    if (!window.jarvis?.preflightCloudProviderAcceptance) {
      setError("Cloud provider acceptance preflight is unavailable.");
      return false;
    }
    try {
      const allowed =
        await refreshCloudProviderAcceptancePreflightProjection();
      setError(null);
      return allowed;
    } catch {
      setError("Cloud provider acceptance preflight was rejected.");
      return false;
    }
  }, [refreshCloudProviderAcceptancePreflightProjection]);

  const runCloudProviderFakeAcceptance = useCallback(async () => {
    if (!window.jarvis?.runCloudProviderFakeAcceptance) {
      setError("Cloud provider fake acceptance is unavailable.");
      return false;
    }
    setSending(true);
    try {
      const result = await window.jarvis.runCloudProviderFakeAcceptance({
        ...CLOUD_PROVIDER_ACCEPTANCE_CONSENT,
      });
      setCloudProviderAcceptanceReport(result);
      await Promise.all([
        refreshCloudProviderAcceptanceStatus(),
        refreshCloudProviderAcceptancePreflightProjection(),
      ]);
      setError(null);
      return true;
    } catch {
      await Promise.all([
        refreshCloudProviderAcceptanceStatus(),
        refreshCloudProviderAcceptancePreflightProjection(),
      ]);
      setError("Cloud provider fake acceptance was rejected.");
      return false;
    } finally {
      setSending(false);
    }
  }, [
    refreshCloudProviderAcceptancePreflightProjection,
    refreshCloudProviderAcceptanceStatus,
  ]);

  const runCloudProviderRealAcceptance = useCallback(async () => {
    if (!window.jarvis?.runCloudProviderRealAcceptance) {
      setError("Cloud provider real acceptance is unavailable.");
      return false;
    }
    setSending(true);
    try {
      const result = await window.jarvis.runCloudProviderRealAcceptance({
        ...CLOUD_PROVIDER_ACCEPTANCE_CONSENT,
      });
      setCloudProviderAcceptanceReport(result);
      await Promise.all([
        refreshCloudProviderAcceptanceStatus(),
        refreshCloudProviderAcceptancePreflightProjection(),
      ]);
      setError(null);
      return true;
    } catch {
      await Promise.all([
        refreshCloudProviderAcceptanceStatus(),
        refreshCloudProviderAcceptancePreflightProjection(),
      ]);
      setError("Cloud provider real acceptance was rejected.");
      return false;
    } finally {
      setSending(false);
    }
  }, [
    refreshCloudProviderAcceptancePreflightProjection,
    refreshCloudProviderAcceptanceStatus,
  ]);

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
        void dispatchBrainCommand(text, "voice", {
          asrProviderId: transcript.providerId,
          voiceInputMode: transcript.inputMode,
          voiceInputModeSource: transcript.inputModeSource,
        }).then(() => {
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
    cancelPilotSession,
    discardVoiceRegressionPendingSample,
    markPilotNoFinalTranscript,
    markPilotOperatorDeviation,
    deleteVoiceRegressionRecord,
    deleteVoiceCommandAlias,
    exportVoiceRegressionRecords,
    openTtsSettings,
    openVoiceSettings,
    preparePilotSession,
    refreshTtsServiceStatus,
    refreshVoiceCommandAliases,
    refreshVoiceRegressionPendingSamples,
    refreshVoiceRegressionCollectionStatus,
    refreshVoiceRegressionRecords,
    refreshVoiceServiceStatus,
    saveVoiceRegressionPendingSample,
    startPilotPrompt,
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
    if (!evaluationSurfaceEnabled) {
      return;
    }
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
      void refreshDesktopSettings();
      void refreshChatAnswerProductModeStatus();
      void refreshCommandRouterProductModeStatus();
      void refreshPlugins();
      void refreshQwenRuntimeControlStatus();
      void refreshUserControlledMemories();
      void refreshUserRouteAliases();
      if (evaluationSurfaceEnabled) {
        void refreshVoiceRegressionCollectionStatus();
        void refreshVoiceRegressionPendingSamples();
        void refreshVoiceRegressionRecords();
      }
      if (cloudProviderAcceptanceSurfaceEnabled) {
        void refreshCloudProviderAcceptanceStatus();
        void refreshCloudProviderAcceptancePreflightProjection();
      } else {
        setCloudProviderAcceptanceStatus(null);
        setCloudProviderAcceptancePreflight(null);
      }
      return;
    }

    const handleWindowFocus = () => {
      void refreshVoiceServiceStatus();
      void refreshTtsServiceStatus();
      void refreshDesktopSettings();
      void refreshChatAnswerProductModeStatus();
      void refreshCommandRouterProductModeStatus();
      void refreshPlugins();
      void refreshQwenRuntimeControlStatus();
      void refreshUserControlledMemories();
      void refreshUserRouteAliases();
      if (evaluationSurfaceEnabled) {
        void refreshVoiceRegressionCollectionStatus();
        void refreshVoiceRegressionPendingSamples();
        void refreshVoiceRegressionRecords();
      }
      if (cloudProviderAcceptanceSurfaceEnabled) {
        void refreshCloudProviderAcceptanceStatus();
        void refreshCloudProviderAcceptancePreflightProjection();
      } else {
        setCloudProviderAcceptanceStatus(null);
        setCloudProviderAcceptancePreflight(null);
      }
    };
    window.addEventListener("focus", handleWindowFocus);
    void refreshVoiceServiceStatus();
    void refreshTtsServiceStatus();
    void refreshDesktopSettings();
    void refreshChatAnswerProductModeStatus();
    void refreshCommandRouterProductModeStatus();
    void refreshPlugins();
    void refreshQwenRuntimeControlStatus();
    void refreshUserControlledMemories();
    void refreshUserRouteAliases();
    if (evaluationSurfaceEnabled) {
      void refreshVoiceRegressionCollectionStatus();
      void refreshVoiceRegressionPendingSamples();
      void refreshVoiceRegressionRecords();
    }
    if (cloudProviderAcceptanceSurfaceEnabled) {
      void refreshCloudProviderAcceptanceStatus();
      void refreshCloudProviderAcceptancePreflightProjection();
    } else {
      setCloudProviderAcceptanceStatus(null);
      setCloudProviderAcceptancePreflight(null);
      setCloudProviderAcceptanceReport(null);
    }
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [
    cloudProviderAcceptanceSurfaceEnabled,
    refreshChatAnswerProductModeStatus,
    refreshCommandRouterProductModeStatus,
    refreshCloudProviderAcceptancePreflightProjection,
    refreshCloudProviderAcceptanceStatus,
    refreshDesktopSettings,
    evaluationSurfaceEnabled,
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
    cloudProviderAcceptancePreflight,
    cloudProviderAcceptanceReport,
    cloudProviderAcceptanceStatus,
    commandRouterLocalAppLaunchResult,
    commandRouterProductModeStatus,
    qwenRuntimeControlStatus,
    approveTask,
    cancelTask,
    clearSessionHistory,
    error,
    desktopSettings,
    desktopLaunchAtLoginStatus,
    createConversation,
    disableMemoryAlpha,
    events,
    exportMemorySnapshot,
    fixtureEmbeddingProbe,
    fixtureIntentProbe,
    fixtureOcrProbe,
    fixtureRerankProbe,
    glmAdvancedBrainAcceptancePreflight,
    glmAdvancedBrainAcceptanceReport,
    glmAdvancedBrainAcceptanceStatus,
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
    refreshCloudProviderAcceptanceStatus,
    refreshGlmAdvancedBrainAcceptanceStatus,
    refreshDesktopSettings,
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
    cancelPilotSession,
    deleteCloudProviderAcceptanceCredential,
    deleteUserControlledMemory,
    discardVoiceRegressionPendingSample,
    markPilotNoFinalTranscript,
    markPilotOperatorDeviation,
    deleteVoiceRegressionRecord,
    deleteVoiceCommandAlias,
    deleteUserRouteAlias,
    exportVoiceRegressionRecords,
    preparePilotSession,
    preflightCloudProviderAcceptance,
    refreshTtsServiceStatus,
    refreshUserRouteAliases,
    confirmCommandRouterLocalAppLaunch,
    runFixtureEmbeddingProbe,
    runFixtureIntentProbe,
    runFixtureOcrProbe,
    runFixtureRerankProbe,
    runBrainCommand,
    runCloudProviderFakeAcceptance,
    runCloudProviderRealAcceptance,
    sendCommand,
    sendMessage,
    selectConversation,
    setChatAnswerProductModeEnabled,
    setCommandRouterProductModeEnabled,
    setDesktopCloseButtonBehavior,
    setDesktopLaunchAtLoginEnabled,
    setDesktopUiTheme,
    migrateLegacyDesktopUiTheme,
    setDesktopPetAlwaysOnTop,
    setDesktopPetEnabled,
    setDesktopPetReducedMotion,
    setDesktopFirstRunOnboardingState,
    setGlmAdvancedBrainAcceptanceModel,
    saveCloudProviderAcceptanceCredential,
    saveGlmAdvancedBrainAcceptanceCredential,
    deleteGlmAdvancedBrainAcceptanceCredential,
    preflightGlmAdvancedBrainAcceptance,
    runGlmAdvancedBrainAcceptanceDiagnostic,
    resetDesktopPetPosition,
    setQwenRuntimeControlAction,
    saveVoiceRegressionPendingSample,
    startPilotPrompt,
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
