import { describe, expect, it } from "vitest";
import {
  CommandEnvelopeSchema,
  LocalPluginManifestDeveloperStatusResultSchema,
  LocalPluginEnabledStateSetResultSchema,
  PluginInvocationResultSchema,
  PluginManagementStatusResultSchema,
  PluginManifestSchema,
  createCommandEnvelope,
} from "../src";

describe("plugin protocol contracts", () => {
  it("accepts a read-only Plugin SDK Alpha manifest", () => {
    const manifest = PluginManifestSchema.parse({
      schemaVersion: 1,
      id: "cn.jarvis-k.stock-analysis",
      name: "Stock Analysis Sample",
      version: "0.1.0",
      apiVersion: "1",
      entry: "dist/main.js",
      runtime: "node-worker",
      capabilities: [
        {
          name: "stock.quote",
          description: "Read-only stock quote sample.",
          inputSchema: "schemas/stock-quote-input.json",
          outputSchema: "schemas/stock-quote-output.json",
        },
      ],
      permissions: [],
    });

    expect(manifest.capabilities[0]?.readOnly).toBe(true);
    expect(manifest.capabilities[0]?.risk).toBe("read_only");
  });

  it("rejects Plugin SDK Alpha payment or order capabilities", () => {
    expect(() =>
      PluginManifestSchema.parse({
        schemaVersion: 1,
        id: "cn.jarvis-k.shop-helper",
        name: "Unsafe Shop Helper",
        version: "0.1.0",
        apiVersion: "1",
        entry: "dist/main.js",
        runtime: "node-worker",
        capabilities: [
          {
            name: "shop.checkout",
            description: "Create checkout action.",
            inputSchema: "schemas/shop-input.json",
            outputSchema: "schemas/shop-output.json",
          },
        ],
        permissions: [],
      }),
    ).toThrow();
  });

  it("rejects unsafe entry paths", () => {
    expect(() =>
      PluginManifestSchema.parse({
        schemaVersion: 1,
        id: "cn.jarvis-k.path-test",
        name: "Path Test",
        version: "0.1.0",
        apiVersion: "1",
        entry: "../main.js",
        runtime: "node-worker",
        capabilities: [
          {
            name: "sample.read",
            description: "Read-only sample.",
            inputSchema: "schemas/sample-input.json",
            outputSchema: "schemas/sample-output.json",
          },
        ],
        permissions: [],
      }),
    ).toThrow();
  });

  it("accepts plugin list and invocation commands", () => {
    const listCommand = createCommandEnvelope({
      type: "agent.listPlugins",
      payload: {},
    });
    const invokeCommand = createCommandEnvelope({
      type: "agent.invokePlugin",
      payload: {
        requestId: "plugin-request-1",
        pluginId: "cn.jarvis-k.stock-analysis",
        capability: "stock.quote",
        input: {
          symbol: "MSFT",
        },
      },
    });

    expect(CommandEnvelopeSchema.parse(listCommand).command.type).toBe(
      "agent.listPlugins",
    );
    expect(CommandEnvelopeSchema.parse(invokeCommand).command.type).toBe(
      "agent.invokePlugin",
    );
    const managementCommand = createCommandEnvelope({
      type: "agent.getPluginManagementStatus",
      payload: {},
    });
    expect(CommandEnvelopeSchema.parse(managementCommand).command.type).toBe(
      "agent.getPluginManagementStatus",
    );
    const localManifestDeveloperStatusCommand = createCommandEnvelope({
      type: "agent.getLocalPluginManifestDeveloperStatus",
      payload: {},
    });
    expect(
      CommandEnvelopeSchema.parse(localManifestDeveloperStatusCommand).command
        .type,
    ).toBe("agent.getLocalPluginManifestDeveloperStatus");
    const setLocalPluginStateCommand = createCommandEnvelope({
      type: "agent.setLocalPluginEnabledState",
      payload: {
        pluginId: "cn.example.local-readonly",
        enabled: true,
      },
    });
    expect(
      CommandEnvelopeSchema.parse(setLocalPluginStateCommand).command.type,
    ).toBe("agent.setLocalPluginEnabledState");
  });

  it("accepts sanitized plugin invocation results", () => {
    const result = PluginInvocationResultSchema.parse({
      requestId: "plugin-request-1",
      pluginId: "cn.jarvis-k.stock-analysis",
      capability: "stock.quote",
      status: "completed",
      resultCode: "PLUGIN_INVOKED",
      output: {
        summary: "Read-only sample quote returned.",
        items: [
          {
            title: "MSFT",
            fields: [
              {
                label: "Price",
                value: 128.42,
              },
            ],
          },
        ],
      },
      invokedAt: "2026-08-11T00:00:00.000Z",
      completedAt: "2026-08-11T00:00:00.000Z",
      directActionAttempted: false,
      credentialExposed: false,
      rawPluginOutputPersisted: false,
    });

    expect(result.directActionAttempted).toBe(false);
    expect(result.rawPluginOutputPersisted).toBe(false);
  });

  it("accepts sanitized plugin management status projection", () => {
    const status = PluginManagementStatusResultSchema.parse({
      listedAt: "2026-08-11T00:00:00.000Z",
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
        reasonCodes: [
          "MCP_ADAPTER_STATUS_ONLY",
          "MCP_EXTERNAL_EXECUTION_DISABLED",
          "JARVIS_PERMISSION_LAYER_REQUIRED",
        ],
      },
      plugins: [
        {
          manifest: {
            schemaVersion: 1,
            id: "cn.jarvis-k.stock-analysis",
            name: "Stock Analysis Sample",
            version: "0.1.0",
            apiVersion: "1",
            entry: "dist/main.js",
            runtime: "node-worker",
            capabilities: [
              {
                name: "stock.quote",
                description: "Read-only stock quote sample.",
                inputSchema: "schemas/stock-quote-input.json",
                outputSchema: "schemas/stock-quote-output.json",
              },
            ],
            permissions: [],
          },
          source: "bundled",
          state: "enabled",
          executionMode: "bundled_runtime",
          executable: true,
          routeSelectable: true,
          riskAssessment: {
            declaredRiskTier: "low",
            effectiveRiskTier: "low",
            confirmationPolicy: "none",
            capabilityStatuses: [
              {
                capability: "stock.quote",
                manifestRisk: "read_only",
                riskTier: "low",
                readOnly: true,
                confirmationPolicy: "none",
              },
            ],
            permissionStatuses: [],
            reasonCodes: ["READ_ONLY_LOW_RISK", "NO_DECLARED_PERMISSIONS"],
          },
          reasonCodes: ["BUNDLED_READ_ONLY_RUNTIME"],
        },
      ],
    });

    expect(status.thirdPartyCodeExecuted).toBe(false);
    expect(status.mcpAdapter.externalServerStartupAllowed).toBe(false);
    expect(status.mcpAdapter.externalToolExecutionAllowed).toBe(false);
    expect(status.mcpAdapter.toolCallForwardingAllowed).toBe(false);
    expect(status.plugins[0]?.state).toBe("enabled");
    expect(status.plugins[0]?.stateSource).toBe("policy_default");
    expect(status.plugins[0]?.statePersisted).toBe(false);
    expect(status.plugins[0]?.riskAssessment.confirmationPolicy).toBe("none");
  });

  it("accepts sanitized local plugin state set results", () => {
    const result = LocalPluginEnabledStateSetResultSchema.parse({
      pluginId: "cn.example.local-readonly",
      requestedState: "enabled",
      appliedState: "enabled",
      status: "updated",
      persisted: true,
      executionMode: "list_only",
      executable: false,
      routeSelectable: false,
      thirdPartyCodeExecuted: false,
      installOrEnableActionExposed: false,
      stateToggleActionExposed: true,
      reasonCodes: [
        "LOCAL_PLUGIN_STATE_PERSISTED",
        "LOCAL_PLUGIN_STATE_ENABLED_LIST_ONLY",
      ],
    });

    expect(result.persisted).toBe(true);
    expect(result.executable).toBe(false);
    expect(result.routeSelectable).toBe(false);
    expect(result.thirdPartyCodeExecuted).toBe(false);

    const executableLocalReadOnlyResult =
      LocalPluginEnabledStateSetResultSchema.parse({
        pluginId: "cn.example.hello-readonly",
        requestedState: "enabled",
        appliedState: "enabled",
        status: "updated",
        persisted: true,
        executionMode: "local_readonly_runtime",
        executable: true,
        routeSelectable: true,
        thirdPartyCodeExecuted: false,
        installOrEnableActionExposed: false,
        stateToggleActionExposed: true,
        reasonCodes: [
          "LOCAL_PLUGIN_STATE_PERSISTED",
          "LOCAL_READ_ONLY_RUNTIME",
          "LOCAL_PLUGIN_STATE_ENABLED_EXECUTABLE",
        ],
      });

    expect(executableLocalReadOnlyResult.executable).toBe(true);
    expect(executableLocalReadOnlyResult.routeSelectable).toBe(true);
    expect(executableLocalReadOnlyResult.thirdPartyCodeExecuted).toBe(false);
  });

  it("accepts sanitized local manifest developer status projection", () => {
    const status = LocalPluginManifestDeveloperStatusResultSchema.parse({
      discoveryStatus: "degraded",
      enabled: true,
      configuredDirectoryCount: 2,
      scannedDirectoryCount: 2,
      validManifestCount: 1,
      invalidManifestCount: 1,
      checkedAt: "2026-08-11T00:00:00.000Z",
      rawPathsExposed: false,
      thirdPartyCodeExecuted: false,
      marketplaceAccessed: false,
      installOrEnableActionExposed: false,
      reasonCodes: ["LOCAL_MANIFEST_DISCOVERY_DEGRADED"],
      directories: [
        {
          directoryRef: "local-plugin-dir-01",
          state: "discovered",
          manifestPresent: true,
          manifestValid: true,
          schemaValid: true,
          pluginId: "cn.example.local-readonly",
          pluginName: "Local Read-only Manifest",
          capabilityCount: 1,
          permissionCount: 0,
          issueCodes: [],
        },
        {
          directoryRef: "local-plugin-dir-02",
          state: "invalid",
          manifestPresent: true,
          manifestValid: false,
          schemaValid: false,
          capabilityCount: 0,
          permissionCount: 0,
          issueCodes: ["MANIFEST_JSON_INVALID"],
        },
      ],
    });

    expect(status.rawPathsExposed).toBe(false);
    expect(status.thirdPartyCodeExecuted).toBe(false);
    expect(status.stateToggleActionExposed).toBe(false);
    expect(status.directories[0]?.directoryRef).toBe("local-plugin-dir-01");
    expect(status.directories[1]?.issueCodes).toContain(
      "MANIFEST_JSON_INVALID",
    );
  });
});
