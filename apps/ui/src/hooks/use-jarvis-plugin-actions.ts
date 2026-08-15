import { useCallback } from "react";
import {
  LocalPluginEnabledStateSetResultSchema,
  LocalPluginManifestDeveloperStatusResultSchema,
  PluginManagementStatusResultSchema,
  type LocalPluginEnabledStateSetResult,
  type LocalPluginManifestDeveloperStatusResult,
  type PluginManagementStatusResult,
} from "@jarvis-k/contracts";

interface UseJarvisPluginActionsOptions {
  setError(message: string | null): void;
  setPluginManagementStatus(status: PluginManagementStatusResult | null): void;
  setLocalPluginManifestDeveloperStatus(
    status: LocalPluginManifestDeveloperStatusResult | null,
  ): void;
}

export function useJarvisPluginActions({
  setError,
  setPluginManagementStatus,
  setLocalPluginManifestDeveloperStatus,
}: UseJarvisPluginActionsOptions) {
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
  }, [setError, setPluginManagementStatus]);

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
  }, [setError, setLocalPluginManifestDeveloperStatus]);

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
    [refreshLocalPluginManifestDeveloperStatus, refreshPlugins, setError],
  );

  return {
    refreshPlugins,
    refreshLocalPluginManifestDeveloperStatus,
    setLocalPluginEnabledState,
  };
}
