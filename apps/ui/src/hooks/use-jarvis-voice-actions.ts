import { useCallback } from "react";
import {
  VoiceCommandAliasRecordSchema,
  type BrainCommandResult,
  type TtsServiceStatus,
  type VoiceCommandAliasRecord,
  type VoiceCommandCorrectionCandidate,
  type VoiceServiceStatus,
} from "@jarvis-k/contracts";

interface UseJarvisVoiceActionsOptions {
  brainResult: BrainCommandResult | null;
  setError(message: string | null): void;
  setSending(value: boolean): void;
  setVoiceCommandAliases(aliases: VoiceCommandAliasRecord[]): void;
  setVoiceServiceStatus(status: VoiceServiceStatus | null): void;
  setTtsServiceStatus(status: TtsServiceStatus | null): void;
  dispatchBrainCommand(text: string, source: "voice"): Promise<boolean>;
}

export function useJarvisVoiceActions({
  brainResult,
  setError,
  setSending,
  setVoiceCommandAliases,
  setVoiceServiceStatus,
  setTtsServiceStatus,
  dispatchBrainCommand,
}: UseJarvisVoiceActionsOptions) {
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
  }, [setError, setVoiceCommandAliases]);

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
    [
      brainResult,
      dispatchBrainCommand,
      refreshVoiceCommandAliases,
      setError,
      setSending,
    ],
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
    [refreshVoiceCommandAliases, setError, setSending],
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
  }, [setError, setTtsServiceStatus, setVoiceServiceStatus]);

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
  }, [setError, setTtsServiceStatus]);

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
  }, [setError, setVoiceServiceStatus]);

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
  }, [setError, setTtsServiceStatus]);

  return {
    confirmVoiceCommandCorrection,
    deleteVoiceCommandAlias,
    openTtsSettings,
    openVoiceSettings,
    refreshTtsServiceStatus,
    refreshVoiceCommandAliases,
    refreshVoiceServiceStatus,
  };
}

function neverAlias(): VoiceCommandAliasRecord {
  throw new Error("Unreachable invalid voice command alias.");
}
