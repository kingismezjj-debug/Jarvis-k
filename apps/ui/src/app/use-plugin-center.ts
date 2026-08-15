import { useState, type Dispatch, type SetStateAction } from "react";
import type {
  LocalPluginEnabledStateSetResult,
  PluginManagementStatusResult,
} from "@jarvis-k/contracts";
import type { ActionStatus } from "./types";

type PluginRecord = PluginManagementStatusResult["plugins"][number];

export type UsePluginCenterOptions = {
  pluginManagementStatus: PluginManagementStatusResult | null;
  setLastAction: Dispatch<SetStateAction<ActionStatus | null>>;
  setLocalPluginEnabledState: (
    pluginId: string,
    enabled: boolean,
  ) => Promise<LocalPluginEnabledStateSetResult | null>;
};

export function usePluginCenter({
  pluginManagementStatus,
  setLastAction,
  setLocalPluginEnabledState,
}: UsePluginCenterOptions) {
  const [localPluginStateUpdatingId, setLocalPluginStateUpdatingId] = useState<
    string | null
  >(null);
  const plugins = pluginManagementStatus?.plugins ?? [];
  const enabledPluginCount = plugins.filter(
    (plugin) => plugin.state === "enabled",
  ).length;
  const disabledPluginCount = plugins.filter(
    (plugin) => plugin.state === "disabled",
  ).length;
  const bundledPluginCount = plugins.filter(
    (plugin) => plugin.source === "bundled",
  ).length;
  const localManifestPluginCount = plugins.filter(
    (plugin) => plugin.source === "local_manifest",
  ).length;
  const lowRiskPluginCount = plugins.filter(
    (plugin) => plugin.riskAssessment.effectiveRiskTier === "low",
  ).length;
  const mediumRiskPluginCount = plugins.filter(
    (plugin) => plugin.riskAssessment.effectiveRiskTier === "medium",
  ).length;
  const blockedPolicyPluginCount = plugins.filter(
    (plugin) => plugin.riskAssessment.confirmationPolicy === "blocked",
  ).length;

  async function toggleLocalPluginState(
    plugin: PluginRecord,
  ): Promise<void> {
    setLocalPluginStateUpdatingId(plugin.manifest.id);
    const result = await setLocalPluginEnabledState(
      plugin.manifest.id,
      plugin.state !== "enabled",
    );
    setLocalPluginStateUpdatingId(null);
    if (!result) {
      return;
    }
    setLastAction({
      label:
        result.status === "updated"
          ? `Local plugin state ${result.appliedState}`
          : "Local plugin state blocked",
      tone: result.status === "updated" ? "success" : "warning",
    });
  }

  return {
    blockedPolicyPluginCount,
    bundledPluginCount,
    disabledPluginCount,
    enabledPluginCount,
    localManifestPluginCount,
    localPluginStateUpdatingId,
    lowRiskPluginCount,
    mediumRiskPluginCount,
    plugins,
    toggleLocalPluginState,
  };
}
