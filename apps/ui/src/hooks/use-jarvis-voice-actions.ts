import { useCallback } from "react";
import {
  VoiceRegressionCollectionStatusSchema,
  VoiceRegressionExportSchema,
  VoiceRegressionSampleSchema,
  VoiceRegressionRecordSchema,
  VoiceCommandAliasRecordSchema,
  type BrainCommandResult,
  type TtsServiceStatus,
  type VoiceCommandAliasRecord,
  type VoiceCommandCorrectionCandidate,
  type VoiceRegressionCollectionStatus,
  type VoiceRegressionSample,
  type VoiceRegressionRecord,
  type VoiceServiceStatus,
} from "@jarvis-k/contracts";

interface UseJarvisVoiceActionsOptions {
  brainResult: BrainCommandResult | null;
  setError(message: string | null): void;
  setSending(value: boolean): void;
  setVoiceCommandAliases(aliases: VoiceCommandAliasRecord[]): void;
  setVoiceRegressionExportText(exportText: string | null): void;
  setVoiceRegressionPendingSamples(samples: VoiceRegressionSample[]): void;
  setVoiceRegressionRecords(records: VoiceRegressionRecord[]): void;
  setVoiceRegressionStatus(
    status: VoiceRegressionCollectionStatus | null,
  ): void;
  setVoiceServiceStatus(status: VoiceServiceStatus | null): void;
  setTtsServiceStatus(status: TtsServiceStatus | null): void;
  dispatchBrainCommand(text: string, source: "voice"): Promise<boolean>;
}

export function useJarvisVoiceActions({
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

  const refreshVoiceRegressionCollectionStatus = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.sendCommand({
      type: "agent.getVoiceRegressionCollectionStatus",
      payload: {},
    });
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    const parsed = VoiceRegressionCollectionStatusSchema.safeParse(
      (result.data as { status?: unknown } | undefined)?.status,
    );
    if (!parsed.success) {
      setError("Core returned invalid voice regression status.");
      return false;
    }
    setVoiceRegressionStatus(parsed.data);
    setError(null);
    return true;
  }, [setError, setVoiceRegressionStatus]);

  const refreshVoiceRegressionRecords = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.sendCommand({
      type: "agent.listVoiceRegressionRecords",
      payload: { limit: 50 },
    });
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    const records = (result.data as { records?: unknown } | undefined)?.records;
    if (!Array.isArray(records)) {
      setError("Core returned invalid voice regression records.");
      return false;
    }
    const parsed = records.map((record) =>
      VoiceRegressionRecordSchema.safeParse(record),
    );
    if (parsed.some((record) => !record.success)) {
      setError("Core returned invalid voice regression records.");
      return false;
    }
    setVoiceRegressionRecords(
      parsed.map((record) => (record.success ? record.data : neverRecord())),
    );
    setError(null);
    return true;
  }, [setError, setVoiceRegressionRecords]);

  const refreshVoiceRegressionPendingSamples = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.sendCommand({
      type: "agent.listVoiceRegressionPendingSamples",
      payload: { limit: 50 },
    });
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    const samples = (result.data as { samples?: unknown } | undefined)
      ?.samples;
    if (!Array.isArray(samples)) {
      setError("Core returned invalid pending voice regression samples.");
      return false;
    }
    const parsed = samples.map((sample) =>
      VoiceRegressionSampleSchema.safeParse(sample),
    );
    if (parsed.some((sample) => !sample.success)) {
      setError("Core returned invalid pending voice regression samples.");
      return false;
    }
    setVoiceRegressionPendingSamples(
      parsed.map((sample) => (sample.success ? sample.data : neverSample())),
    );
    setError(null);
    return true;
  }, [setError, setVoiceRegressionPendingSamples]);

  const setVoiceRegressionLocalTextCollection = useCallback(
    async (enabled: boolean) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.setVoiceRegressionCollectionConsent",
          payload: enabled
            ? {
                consentLevel: "local_text",
                confirmation: "explicit_ui_confirmation",
              }
            : { consentLevel: "off" },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        const parsed = VoiceRegressionCollectionStatusSchema.safeParse(
          (result.data as { status?: unknown } | undefined)?.status,
        );
        if (!parsed.success) {
          setError("Core returned invalid voice regression status.");
          return false;
        }
        setVoiceRegressionStatus(parsed.data);
        await refreshVoiceRegressionPendingSamples();
        await refreshVoiceRegressionRecords();
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [
      refreshVoiceRegressionRecords,
      refreshVoiceRegressionPendingSamples,
      setError,
      setSending,
      setVoiceRegressionStatus,
    ],
  );

  const deleteVoiceRegressionRecord = useCallback(
    async (recordId: string) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.deleteVoiceRegressionRecord",
          payload: { recordId },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        await refreshVoiceRegressionCollectionStatus();
        await refreshVoiceRegressionRecords();
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [
      refreshVoiceRegressionCollectionStatus,
      refreshVoiceRegressionRecords,
      setError,
      setSending,
    ],
  );

  const saveVoiceRegressionPendingSample = useCallback(
    async (
      sampleId: string,
      status: "accepted" | "corrected" | "rejected" | "abandoned",
      correctedText?: string,
    ) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.saveVoiceRegressionPendingSample",
          payload: {
            sampleId,
            status,
            ...(correctedText === undefined ? {} : { correctedText }),
          },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        await refreshVoiceRegressionCollectionStatus();
        await refreshVoiceRegressionPendingSamples();
        await refreshVoiceRegressionRecords();
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [
      refreshVoiceRegressionCollectionStatus,
      refreshVoiceRegressionPendingSamples,
      refreshVoiceRegressionRecords,
      setError,
      setSending,
    ],
  );

  const discardVoiceRegressionPendingSample = useCallback(
    async (sampleId: string) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.discardVoiceRegressionPendingSample",
          payload: { sampleId },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        await refreshVoiceRegressionCollectionStatus();
        await refreshVoiceRegressionPendingSamples();
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [
      refreshVoiceRegressionCollectionStatus,
      refreshVoiceRegressionPendingSamples,
      setError,
      setSending,
    ],
  );

  const clearVoiceRegressionPendingSamples = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    setSending(true);
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.clearVoiceRegressionPendingSamples",
        payload: {},
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      await refreshVoiceRegressionCollectionStatus();
      await refreshVoiceRegressionPendingSamples();
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, [
    refreshVoiceRegressionCollectionStatus,
    refreshVoiceRegressionPendingSamples,
    setError,
    setSending,
  ]);

  const clearVoiceRegressionRecords = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    setSending(true);
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.clearVoiceRegressionRecords",
        payload: { confirmation: "explicit_ui_confirmation" },
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      setVoiceRegressionExportText(null);
      await refreshVoiceRegressionCollectionStatus();
      await refreshVoiceRegressionPendingSamples();
      await refreshVoiceRegressionRecords();
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, [
    refreshVoiceRegressionCollectionStatus,
    refreshVoiceRegressionRecords,
    refreshVoiceRegressionPendingSamples,
    setError,
    setSending,
    setVoiceRegressionExportText,
  ]);

  const submitVoiceRegressionFeedback = useCallback(
    async (
      recordId: string,
      status: "accepted" | "rejected" | "abandoned",
    ) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.submitVoiceRegressionFeedback",
          payload: { recordId, status },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        await refreshVoiceRegressionRecords();
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [refreshVoiceRegressionRecords, setError, setSending],
  );

  const exportVoiceRegressionRecords = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    const result = await window.jarvis.sendCommand({
      type: "agent.exportVoiceRegressionRecords",
      payload: {},
    });
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    const parsed = VoiceRegressionExportSchema.safeParse(
      (result.data as { export?: unknown } | undefined)?.export,
    );
    if (!parsed.success) {
      setError("Core returned invalid voice regression export.");
      return false;
    }
    setVoiceRegressionExportText(JSON.stringify(parsed.data, null, 2));
    setError(null);
    return true;
  }, [setError, setVoiceRegressionExportText]);

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
    refreshVoiceRegressionCollectionStatus,
    refreshVoiceRegressionPendingSamples,
    refreshVoiceRegressionRecords,
    refreshVoiceServiceStatus,
    saveVoiceRegressionPendingSample,
    setVoiceRegressionLocalTextCollection,
    submitVoiceRegressionFeedback,
  };
}

function neverAlias(): VoiceCommandAliasRecord {
  throw new Error("Unreachable invalid voice command alias.");
}

function neverRecord(): VoiceRegressionRecord {
  throw new Error("Unreachable invalid voice regression record.");
}

function neverSample(): VoiceRegressionSample {
  throw new Error("Unreachable invalid voice regression sample.");
}
