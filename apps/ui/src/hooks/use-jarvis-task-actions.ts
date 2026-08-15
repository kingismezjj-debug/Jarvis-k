import { useCallback } from "react";

interface UseJarvisTaskActionsOptions {
  setError(message: string | null): void;
  setSending(value: boolean): void;
  refreshSnapshot(): Promise<void>;
}

export function useJarvisTaskActions({
  setError,
  setSending,
  refreshSnapshot,
}: UseJarvisTaskActionsOptions) {
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
    [refreshSnapshot, setError, setSending],
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
    [refreshSnapshot, setError, setSending],
  );

  return {
    approveTask,
    cancelTask,
  };
}
