import { describe, expect, it } from "vitest";
import type { PluginManagementStatusResult } from "@jarvis-k/contracts";

import { buildSettingsV2ToolsPluginsProductViewModel } from "../src/features/settings-v2/settings-v2-tools-view-model";

function pluginStatus({
  enabled = true,
  id = "com.jarvis-k.product.readonly",
  name = "Read-only Knowledge Lookup",
  routeSelectable = true,
  readOnly = true,
}: {
  enabled?: boolean;
  id?: string;
  name?: string;
  routeSelectable?: boolean;
  readOnly?: boolean;
} = {}): PluginManagementStatusResult {
  return {
    plugins: [
      {
        manifest: {
          id,
          name,
          version: "0.1.0",
          runtime: "node-worker",
          capabilities: ["knowledge.lookup"],
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
              capability: "knowledge.lookup",
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
    expect(viewModel.plugins.hiddenDeveloperExampleCount).toBe(0);
    expect(viewModel.plugins.value).toBe(
      "1 Installed plugins, 1 Enabled plugins",
    );
    expect(viewModel.plugins.details).toContain("Ready for safe use: 0");
  });

  it("hides bundled sample plugins from the ordinary Product projection", () => {
    const viewModel = buildSettingsV2ToolsPluginsProductViewModel({
      locale: "en",
      pluginManagementStatus: pluginStatus({
        id: "cn.jarvis-k.stock-analysis",
        name: "Stock Analysis Sample",
      }),
    });

    expect(viewModel.plugins.installedCount).toBe(0);
    expect(viewModel.plugins.enabledCount).toBe(0);
    expect(viewModel.plugins.availableCount).toBe(0);
    expect(viewModel.plugins.readOnlyCount).toBe(0);
    expect(viewModel.plugins.hiddenDeveloperExampleCount).toBe(1);
    expect(viewModel.plugins.value).toBe("No plugins are currently available.");
    expect(viewModel.plugins.details).not.toContain(
      "Developer example plugins are hidden from Product settings.",
    );
  });

  it("renders a true empty Product plugin state from an empty safe projection", () => {
    const emptyStatus = {
      ...pluginStatus(),
      plugins: [],
    } as PluginManagementStatusResult;
    const viewModel = buildSettingsV2ToolsPluginsProductViewModel({
      locale: "en",
      pluginManagementStatus: emptyStatus,
    });

    expect(viewModel.plugins.value).toBe("No plugins are currently available.");
    expect(viewModel.plugins.details).toContain("Installed plugins: 0");
    expect(viewModel.plugins.details).toContain("Enabled plugins: 0");
    expect(viewModel.plugins.details).not.toContain(
      "Developer example plugins are hidden from Product settings.",
    );
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
      "Opening or viewing this page does not connect to external tools.",
    ]);
  });

  it("keeps page-open side effects explicit and disabled", () => {
    const viewModel = buildSettingsV2ToolsPluginsProductViewModel({
      locale: "en",
      pluginManagementStatus: pluginStatus(),
    });

    expect(viewModel.safeNotice).toContain("does not run tools");
    expect(viewModel.safeNotice).toContain(
      "may use non-local connections only after separate setup",
    );
    expect(viewModel.approvedApps.details).toContain(
      "App launches still require a separate command and safety gate.",
    );
    expect(viewModel.safeWebsites.details).toContain(
      "Website openings still require a separate command.",
    );
    expect(viewModel.fileSearch.details).toContain(
      "Search starts only after a separate user request.",
    );
  });
});
