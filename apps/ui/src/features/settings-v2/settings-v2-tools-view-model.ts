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
    hiddenDeveloperExampleCount: number;
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
      hiddenDeveloperExampleCount: 0,
      details: [tSettingsV2(locale, "settings.tools.plugins.refreshNeeded")],
    };
  }

  const productPlugins = status.plugins.filter(isProductVisiblePlugin);
  const hiddenDeveloperExampleCount =
    status.plugins.length - productPlugins.length;
  const installedCount = productPlugins.length;
  const enabledCount = productPlugins.filter(
    (plugin) => plugin.state === "enabled",
  ).length;
  const availableCount = productPlugins.filter(
    (plugin) => plugin.state === "enabled" && plugin.routeSelectable,
  ).length;
  const readOnlyCount = productPlugins.filter((plugin) =>
    plugin.riskAssessment.capabilityStatuses.every(
      (capability) => capability.readOnly,
    ),
  ).length;
  const value =
    installedCount === 0
      ? tSettingsV2(locale, "settings.tools.plugins.noProductPlugins")
      : formatCountPair({
          locale,
          firstLabel: tSettingsV2(
            locale,
            "settings.tools.plugins.productInstalled",
          ),
          firstValue: installedCount,
          secondLabel: tSettingsV2(
            locale,
            "settings.tools.plugins.productEnabled",
          ),
          secondValue: enabledCount,
        });

  const details = [
    `${tSettingsV2(locale, "settings.tools.plugins.productInstalled")}: ${installedCount}`,
    `${tSettingsV2(locale, "settings.tools.plugins.productEnabled")}: ${enabledCount}`,
    `${tSettingsV2(locale, "settings.tools.plugins.availableForUse")}: ${availableCount}`,
    `${tSettingsV2(locale, "settings.tools.plugins.readOnly")}: ${readOnlyCount}`,
  ];
  if (hiddenDeveloperExampleCount > 0) {
    details.push(
      tSettingsV2(locale, "settings.tools.plugins.developerExamplesHidden"),
    );
  }
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
    hiddenDeveloperExampleCount,
    details,
  };
}

export function isProductVisiblePlugin(
  plugin: PluginManagementStatusResult["plugins"][number],
): boolean {
  const manifest = plugin.manifest;
  const capabilityDescriptions = manifest.capabilities
    .map((capability) =>
      typeof capability === "string"
        ? capability
        : "description" in capability
          ? capability.description
          : "",
    )
    .filter((value): value is string => typeof value === "string");
  const safeMetadataText = [
    manifest.id,
    manifest.name,
    ...capabilityDescriptions,
  ]
    .join(" ")
    .toLocaleLowerCase();

  if (/\b(sample|example|demo|fixture)\b/u.test(safeMetadataText)) {
    return false;
  }
  if (manifest.id.startsWith("examples.") || manifest.id.startsWith("cn.example.")) {
    return false;
  }
  return true;
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
