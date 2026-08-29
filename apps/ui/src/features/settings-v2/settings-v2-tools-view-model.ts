import type { PluginManagementStatusResult } from "@jarvis-k/contracts";

import {
  type SettingsV2Locale,
  tSettingsV2,
} from "./settings-v2-copy";

export type SettingsV2ToolsPluginsProductViewModel = {
  safeNotice: string;
  automation: {
    value: string;
    details: string[];
  };
  approvedApps: {
    value: string;
    details: string[];
  };
  safeWebsites: {
    value: string;
    details: string[];
  };
  fileSearch: {
    value: string;
    details: string[];
  };
  plugins: {
    value: string;
    installedCount: number;
    enabledCount: number;
    availableCount: number;
    readOnlyCount: number;
    details: string[];
  };
  mcpConnections: {
    value: string;
    details: string[];
  };
};

export function buildSettingsV2ToolsPluginsProductViewModel({
  locale,
  pluginManagementStatus,
}: {
  locale: SettingsV2Locale;
  pluginManagementStatus?: PluginManagementStatusResult | null;
}): SettingsV2ToolsPluginsProductViewModel {
  const plugins = formatPluginSummary(locale, pluginManagementStatus);
  return {
    safeNotice: tSettingsV2(locale, "settings.tools.status.noExecutionOnOpen"),
    automation: {
      value: tSettingsV2(locale, "settings.tools.automation.guarded"),
      details: [
        tSettingsV2(locale, "settings.tools.automation.confirmation"),
        tSettingsV2(locale, "settings.tools.automation.noRunOnOpen"),
      ],
    },
    approvedApps: {
      value: tSettingsV2(locale, "settings.tools.approvedApps.managed"),
      details: [
        tSettingsV2(locale, "settings.tools.approvedApps.confirmation"),
        tSettingsV2(locale, "settings.tools.approvedApps.noLaunchOnOpen"),
      ],
    },
    safeWebsites: {
      value: tSettingsV2(locale, "settings.tools.safeWebsites.confirmFirst"),
      details: [
        tSettingsV2(locale, "settings.tools.safeWebsites.noBrowserOnOpen"),
        tSettingsV2(locale, "settings.tools.safeWebsites.unknownAsk"),
      ],
    },
    fileSearch: {
      value: tSettingsV2(locale, "settings.tools.fileSearch.readOnly"),
      details: [
        tSettingsV2(locale, "settings.tools.fileSearch.filenameOnly"),
        tSettingsV2(locale, "settings.tools.fileSearch.noScanOnOpen"),
      ],
    },
    plugins,
    mcpConnections: formatMcpSummary(locale, pluginManagementStatus),
  };
}

function formatPluginSummary(
  locale: SettingsV2Locale,
  status: PluginManagementStatusResult | null | undefined,
): SettingsV2ToolsPluginsProductViewModel["plugins"] {
  if (!status) {
    return {
      value: tSettingsV2(locale, "settings.tools.plugins.statusUnknown"),
      installedCount: 0,
      enabledCount: 0,
      availableCount: 0,
      readOnlyCount: 0,
      details: [tSettingsV2(locale, "settings.tools.plugins.refreshNeeded")],
    };
  }

  const installedCount = status.plugins.length;
  const enabledCount = status.plugins.filter(
    (plugin) => plugin.state === "enabled",
  ).length;
  const availableCount = status.plugins.filter(
    (plugin) => plugin.state === "enabled" && plugin.routeSelectable,
  ).length;
  const readOnlyCount = status.plugins.filter((plugin) =>
    plugin.riskAssessment.capabilityStatuses.every(
      (capability) => capability.readOnly,
    ),
  ).length;
  const value =
    installedCount === 0
      ? tSettingsV2(locale, "settings.tools.plugins.noneInstalled")
      : formatCountPair({
          locale,
          firstLabel: tSettingsV2(locale, "settings.tools.plugins.installed"),
          firstValue: installedCount,
          secondLabel: tSettingsV2(locale, "settings.tools.plugins.enabled"),
          secondValue: enabledCount,
        });

  const details = [
    `${tSettingsV2(locale, "settings.tools.plugins.installed")}: ${installedCount}`,
    `${tSettingsV2(locale, "settings.tools.plugins.enabled")}: ${enabledCount}`,
    `${tSettingsV2(locale, "settings.tools.plugins.availableForUse")}: ${availableCount}`,
    `${tSettingsV2(locale, "settings.tools.plugins.readOnly")}: ${readOnlyCount}`,
  ];
  if (status.defaultThirdPartyExecutionState === "disabled") {
    details.push(
      tSettingsV2(locale, "settings.tools.plugins.thirdPartyDisabled"),
    );
  }
  if (status.marketplaceAccessed === false) {
    details.push(tSettingsV2(locale, "settings.tools.plugins.noMarketplace"));
  }
  return {
    value,
    installedCount,
    enabledCount,
    availableCount,
    readOnlyCount,
    details,
  };
}

function formatMcpSummary(
  locale: SettingsV2Locale,
  status: PluginManagementStatusResult | null | undefined,
): SettingsV2ToolsPluginsProductViewModel["mcpConnections"] {
  const adapter = status?.mcpAdapter;
  if (!adapter) {
    return {
      value: tSettingsV2(locale, "settings.tools.mcp.statusUnknown"),
      details: [tSettingsV2(locale, "settings.tools.mcp.notConnected")],
    };
  }
  if (
    adapter.status === "disabled" ||
    !adapter.externalServerStartupAllowed ||
    !adapter.externalToolExecutionAllowed ||
    !adapter.toolCallForwardingAllowed
  ) {
    return {
      value: tSettingsV2(locale, "settings.tools.mcp.unavailable"),
      details: [
        tSettingsV2(locale, "settings.tools.mcp.noAutoConnect"),
        tSettingsV2(locale, "settings.tools.mcp.noExternalRun"),
      ],
    };
  }
  return {
    value: tSettingsV2(locale, "settings.tools.mcp.available"),
    details: [tSettingsV2(locale, "settings.tools.mcp.userControlled")],
  };
}

function formatCountPair({
  firstLabel,
  firstValue,
  locale,
  secondLabel,
  secondValue,
}: {
  firstLabel: string;
  firstValue: number;
  locale: SettingsV2Locale;
  secondLabel: string;
  secondValue: number;
}): string {
  return locale === "zh"
    ? `${firstLabel} ${firstValue} 个，${secondLabel} ${secondValue} 个`
    : `${firstValue} ${firstLabel}, ${secondValue} ${secondLabel}`;
}
