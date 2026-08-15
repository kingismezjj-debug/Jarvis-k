import { useCallback } from "react";
import {
  CoreSnapshotSchema,
  MemoryAlphaRecallProbeResultSchema,
  MemoryAlphaStatusSchema,
  MemorySnapshotSchema,
  UserControlledMemoryRecordSchema,
  UserRouteAliasRecordSchema,
  type AppCommand,
  type CoreSnapshot,
  type MemoryAlphaRecallProbeResult,
  type MemoryAlphaStatus,
  type UserControlledMemoryKind,
  type UserControlledMemoryRecord,
  type UserRouteAliasLearningProposal,
  type UserRouteAliasRecord,
} from "@jarvis-k/contracts";

interface UseJarvisMemoryActionsOptions {
  setError(message: string | null): void;
  setSending(value: boolean): void;
  sendCommand(command: AppCommand): Promise<boolean>;
  setSnapshot(snapshot: CoreSnapshot): void;
  setMemoryAlphaStatus(status: MemoryAlphaStatus | null): void;
  setMemoryAlphaProbeResult(
    status: MemoryAlphaStatus,
    probe: MemoryAlphaRecallProbeResult,
  ): void;
  setUserRouteAliases(aliases: UserRouteAliasRecord[]): void;
  setUserControlledMemories(memories: UserControlledMemoryRecord[]): void;
  refreshVoiceCommandAliases(): Promise<boolean>;
}

export function useJarvisMemoryActions({
  setError,
  setSending,
  sendCommand,
  setSnapshot,
  setMemoryAlphaStatus,
  setMemoryAlphaProbeResult,
  setUserRouteAliases,
  setUserControlledMemories,
  refreshVoiceCommandAliases,
}: UseJarvisMemoryActionsOptions) {
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
  }, [setError, setUserRouteAliases]);

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
    [refreshUserRouteAliases, setError, setSending],
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
    [refreshUserRouteAliases, setError, setSending],
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
  }, [setError, setUserControlledMemories]);

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
      setError,
      setSending,
    ],
  );

  const refreshMemoryHealth = useCallback(
    async () =>
      sendCommand({
        type: "agent.getMemoryHealth",
        payload: {},
      }),
    [sendCommand],
  );

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
  }, [setError, setSending]);

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
    [sendCommand, setError],
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
  }, [setError, setMemoryAlphaStatus, setSending]);

  const probeMemoryAlphaRecall = useCallback(
    async (text: string) => {
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
        setMemoryAlphaProbeResult(memoryAlpha.data, probe.data);
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [
      setError,
      setMemoryAlphaProbeResult,
      setMemoryAlphaStatus,
      setSending,
    ],
  );

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
  }, [setError, setMemoryAlphaStatus, setSending, setSnapshot]);

  return {
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
  };
}

function neverUserRouteAlias(): UserRouteAliasRecord {
  throw new Error("Unreachable invalid user route alias.");
}

function neverUserControlledMemory(): UserControlledMemoryRecord {
  throw new Error("Unreachable invalid user-controlled memory.");
}
