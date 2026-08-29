import { describe, expect, it } from "vitest";
import type { PluginManagementStatusResult } from "@jarvis-k/contracts";

import { buildSettingsV2ToolsPluginsProductViewModel } from "../src/features/settings-v2/settings-v2-tools-view-model";

function pluginStatus({
  enabled = true,
  routeSelectable = true,
  readOnly = true,
}: {
  enabled?: boolean;
  routeSelectable?: boolean;
  readOnly?: boolean;
} = {}): PluginManagementStatusResult {
  return {
    plugins: [
      {
        manifest: {
          id: "cn.jarvis-k.stock-analysis",
          name: "Stock Analysis Sample",
          version: "0.1.0",
          runtime: "node-worker",
          capabilities: ["stock.quote"],
          permissions: [],
        },
        source: "bundled",
        state: enabled ? "enabled" : "disabled",
        stateSource: "policy_default",
        statePersisted: false,
        stateToggleAvailable: false,
        executionMode: "bundled_read_only_runtime",
        executable: true,
        routeSelectable,
        riskAssessment: {
          declaredRiskTier: "low",
          effectiveRiskTier: "low",
          confirmationPolicy: "none",
          capabilityStatuses: [
            {
              capability: "stock.quote",
              manifestRisk: "low",
              riskTier: "low",
              readOnly,
              confirmationPolicy: "none",
            },
          ],
          permissionStatuses: [],
          reasonCodes: [],
        },
        reasonCodes: [],
      },
    ],
    listedAt: "2026-08-29T00:00:00.000Z",
    defaultThirdPartyExecutionState: "disabled",
    thirdPartyCodeExecuted: false,
    marketplaceAccessed: false,
    mcpAdapter: {
      status: "disabled",
      mode: "compatibility_status_only",
      defaultExecutionState: "disabled",
      externalServerStartupAllowed: false,
      externalToolExecutionAllowed: false,
      toolCallForwardingAllowed: false,
      permissionLayerRequired: true,
      credentialExposed: false,
      rawToolOutputPersisted: false,
      marketplaceAccessed: false,
      reasonCodes: ["MCP_ADAPTER_STATUS_ONLY"],
    },
  } as unknown as PluginManagementStatusResult;
}

describe("Settings V2 Tools & Plugins product view model", () => {
  it("keeps installed, enabled, available, and read-only plugin states separate", () => {
    const viewModel = buildSettingsV2ToolsPluginsProductViewModel({
      locale: "en",
      pluginManagementStatus: pluginStatus({
        enabled: true,
        routeSelectable: false,
        readOnly: true,
      }),
    });

    expect(viewModel.plugins.installedCount).toBe(1);
    expect(viewModel.plugins.enabledCount).toBe(1);
    expect(viewModel.plugins.availableCount).toBe(0);
    expect(viewModel.plugins.readOnlyCount).toBe(1);
    expect(viewModel.plugins.value).toBe("1 installed, 1 enabled");
    expect(viewModel.plugins.details).toContain("Ready for safe use: 0");
  });

  it("does not describe the status-only MCP adapter as connected", () => {
    const viewModel = buildSettingsV2ToolsPluginsProductViewModel({
      locale: "en",
      pluginManagementStatus: pluginStatus(),
    });

    expect(viewModel.mcpConnections.value).toBe(
      "Not available in this version",
    );
    expect(viewModel.mcpConnections.details).toEqual([
      "Opening this page does not connect to external tools.",
      "External tool startup and execution stay disabled.",
    ]);
  });

  it("keeps page-open side effects explicit and disabled", () => {
    const viewModel = buildSettingsV2ToolsPluginsProductViewModel({
      locale: "en",
      pluginManagementStatus: pluginStatus(),
    });

    expect(viewModel.safeNotice).toContain("does not run tools");
    expect(viewModel.approvedApps.details).toContain(
      "Opening this page does not launch apps.",
    );
    expect(viewModel.safeWebsites.details).toContain(
      "Opening this page does not open a browser.",
    );
    expect(viewModel.fileSearch.details).toContain(
      "Opening this page does not scan or index files.",
    );
  });
});
