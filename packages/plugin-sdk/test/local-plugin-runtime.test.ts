import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PluginManifestSchema, type PluginManifest } from "@jarvis-k/contracts";
import {
  CompositePluginRegistry,
  DefaultDenyPluginPermissionBroker,
  InMemoryPluginRegistry,
  LocalReadOnlyPluginRuntime,
  ManifestDirectoryPluginRegistry,
  PRODUCT_COMPARE_CAPABILITY,
  PRODUCT_BARGAIN_ADVICE_CAPABILITY,
  STOCK_QUOTE_CAPABILITY,
  ECOMMERCE_COMPARISON_PLUGIN_ID,
  HELLO_LOOKUP_CAPABILITY,
  HELLO_READONLY_LOCAL_TEMPLATE_PLUGIN_ID,
  STOCK_ANALYSIS_PLUGIN_ID,
  localTemplatePluginDefinitions,
  samplePluginDefinitions,
} from "../src";

describe("Plugin SDK Alpha local runtime", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-plugin-sdk-"));
  });

  afterEach(async () => {
    await rm(directory, { force: true, recursive: true });
  });

  it("lists both required read-only sample plugins", async () => {
    const registry = new InMemoryPluginRegistry(
      samplePluginDefinitions.map((definition) => definition.manifest),
    );

    const plugins = await registry.listPlugins();

    expect(plugins.map((plugin) => plugin.id).sort()).toEqual([
      ECOMMERCE_COMPARISON_PLUGIN_ID,
      STOCK_ANALYSIS_PLUGIN_ID,
    ]);
    expect(
      plugins.every((plugin) =>
        plugin.capabilities.every((capability) => capability.readOnly),
      ),
    ).toBe(true);
    expect(
      plugins
        .find((plugin) => plugin.id === ECOMMERCE_COMPARISON_PLUGIN_ID)
        ?.capabilities.map((capability) => capability.name),
    ).toEqual([PRODUCT_COMPARE_CAPABILITY, PRODUCT_BARGAIN_ADVICE_CAPABILITY]);
  });

  it("invokes stock and e-commerce sample plugins with sanitized output", async () => {
    const runtime = new LocalReadOnlyPluginRuntime({
      definitions: samplePluginDefinitions,
      now: () => new Date("2026-08-11T00:00:00.000Z"),
    });

    await expect(runtime.listExecutablePluginIds()).resolves.toEqual([
      STOCK_ANALYSIS_PLUGIN_ID,
      ECOMMERCE_COMPARISON_PLUGIN_ID,
    ]);

    const stock = await runtime.invoke({
      requestId: "plugin-stock-1",
      pluginId: STOCK_ANALYSIS_PLUGIN_ID,
      capability: STOCK_QUOTE_CAPABILITY,
      input: {
        symbol: "msft",
      },
      dryRun: false,
    });
    const commerce = await runtime.invoke({
      requestId: "plugin-commerce-1",
      pluginId: ECOMMERCE_COMPARISON_PLUGIN_ID,
      capability: PRODUCT_COMPARE_CAPABILITY,
      input: {
        query: "keyboard",
      },
      dryRun: false,
    });
    const bargainAdvice = await runtime.invoke({
      requestId: "plugin-bargain-1",
      pluginId: ECOMMERCE_COMPARISON_PLUGIN_ID,
      capability: PRODUCT_BARGAIN_ADVICE_CAPABILITY,
      input: {
        query: "mechanical keyboard",
      },
      dryRun: false,
    });

    expect(stock).toMatchObject({
      status: "completed",
      resultCode: "PLUGIN_INVOKED",
      directActionAttempted: false,
      credentialExposed: false,
      rawPluginOutputPersisted: false,
    });
    expect(stock.output?.items[0]?.title).toBe("MSFT");
    expect(commerce.status).toBe("completed");
    expect(commerce.output?.items).toHaveLength(2);
    expect(bargainAdvice).toMatchObject({
      status: "completed",
      resultCode: "PLUGIN_INVOKED",
      directActionAttempted: false,
      credentialExposed: false,
      rawPluginOutputPersisted: false,
    });
    expect(bargainAdvice.output?.summary).toContain(
      "Read-only bargain advice returned for mechanical keyboard.",
    );
    expect(bargainAdvice.output?.items[0]?.fields).toEqual(
      expect.arrayContaining([{ label: "Action", value: "draft only" }]),
    );
  });

  it("invokes the controlled local template when explicitly included", async () => {
    const runtime = new LocalReadOnlyPluginRuntime({
      definitions: localTemplatePluginDefinitions,
      now: () => new Date("2026-08-11T00:00:00.000Z"),
    });

    await expect(runtime.listExecutablePluginIds()).resolves.toEqual([
      HELLO_READONLY_LOCAL_TEMPLATE_PLUGIN_ID,
    ]);

    const result = await runtime.invoke({
      requestId: "plugin-hello-1",
      pluginId: HELLO_READONLY_LOCAL_TEMPLATE_PLUGIN_ID,
      capability: HELLO_LOOKUP_CAPABILITY,
      input: {
        name: "Jarvis",
      },
      dryRun: false,
    });

    expect(result).toMatchObject({
      status: "completed",
      resultCode: "PLUGIN_INVOKED",
      directActionAttempted: false,
      credentialExposed: false,
      rawPluginOutputPersisted: false,
      output: {
        summary:
          "Hello Jarvis. This read-only local plugin template returned a sanitized result.",
      },
    });
    expect(result.output?.items[0]?.fields).toEqual(
      expect.arrayContaining([
        { label: "Mode", value: "read-only" },
        { label: "Source", value: "controlled local template" },
      ]),
    );
  });

  it("fails closed before handler execution when manifest input schema rejects the request", async () => {
    let handlerCalls = 0;
    const runtime = new LocalReadOnlyPluginRuntime({
      definitions: [
        {
          ...localTemplatePluginDefinitions[0],
          handlers: {
            [HELLO_LOOKUP_CAPABILITY]: () => {
              handlerCalls += 1;
              return {
                summary: "Should not run.",
                items: [],
              };
            },
          },
        },
      ],
      now: () => new Date("2026-08-11T00:00:00.000Z"),
    });

    const result = await runtime.invoke({
      requestId: "plugin-hello-invalid-input-1",
      pluginId: HELLO_READONLY_LOCAL_TEMPLATE_PLUGIN_ID,
      capability: HELLO_LOOKUP_CAPABILITY,
      input: {},
      dryRun: false,
    });

    expect(result).toMatchObject({
      status: "failed",
      resultCode: "PLUGIN_INPUT_INVALID",
      directActionAttempted: false,
      credentialExposed: false,
      rawPluginOutputPersisted: false,
    });
    expect(result.output).toBeUndefined();
    expect(handlerCalls).toBe(0);
  });

  it("fails closed after handler execution when manifest output schema rejects the result", async () => {
    const runtime = new LocalReadOnlyPluginRuntime({
      definitions: [
        {
          ...localTemplatePluginDefinitions[0],
          handlers: {
            [HELLO_LOOKUP_CAPABILITY]: () => ({
              summary: "Hello.",
              items: Array.from({ length: 13 }, (_value, index) => ({
                title: `Item ${index}`,
                fields: [{ label: "Status", value: "safe" }],
              })),
            }),
          },
        },
      ],
      now: () => new Date("2026-08-11T00:00:00.000Z"),
    });

    const result = await runtime.invoke({
      requestId: "plugin-hello-invalid-output-1",
      pluginId: HELLO_READONLY_LOCAL_TEMPLATE_PLUGIN_ID,
      capability: HELLO_LOOKUP_CAPABILITY,
      input: {
        name: "Jarvis",
      },
      dryRun: false,
    });

    expect(result).toMatchObject({
      status: "failed",
      resultCode: "PLUGIN_OUTPUT_INVALID",
      directActionAttempted: false,
      credentialExposed: false,
      rawPluginOutputPersisted: false,
    });
    expect(result.output).toBeUndefined();
  });

  it("fails closed when a runtime definition omits declared schema documents", async () => {
    const runtime = new LocalReadOnlyPluginRuntime({
      definitions: [
        {
          manifest: localTemplatePluginDefinitions[0].manifest,
          handlers: localTemplatePluginDefinitions[0].handlers,
        },
      ],
      now: () => new Date("2026-08-11T00:00:00.000Z"),
    });

    const result = await runtime.invoke({
      requestId: "plugin-hello-missing-schema-1",
      pluginId: HELLO_READONLY_LOCAL_TEMPLATE_PLUGIN_ID,
      capability: HELLO_LOOKUP_CAPABILITY,
      input: {
        name: "Jarvis",
      },
      dryRun: false,
    });

    expect(result.status).toBe("failed");
    expect(result.resultCode).toBe("PLUGIN_INPUT_INVALID");
  });

  it("fails closed when a plugin requests network permission by default", async () => {
    const networkPlugin: PluginManifest = PluginManifestSchema.parse({
      schemaVersion: 1,
      id: "cn.jarvis-k.network-sample",
      name: "Network Sample",
      version: "0.1.0",
      apiVersion: "1",
      entry: "dist/main.js",
      runtime: "node-worker",
      capabilities: [
        {
          name: "sample.lookup",
          description: "Read-only lookup sample.",
          inputSchema: "schemas/sample-input.json",
          outputSchema: "schemas/sample-output.json",
        },
      ],
      permissions: ["network:https:quotes.example.cn"],
    });
    const runtime = new LocalReadOnlyPluginRuntime({
      definitions: [
        {
          manifest: networkPlugin,
          handlers: {
            "sample.lookup": () => ({
              summary: "Should not run.",
              items: [],
            }),
          },
        },
      ],
      permissionBroker: new DefaultDenyPluginPermissionBroker(),
      now: () => new Date("2026-08-11T00:00:00.000Z"),
    });

    const result = await runtime.invoke({
      requestId: "plugin-network-1",
      pluginId: networkPlugin.id,
      capability: "sample.lookup",
      input: {},
      dryRun: false,
    });

    expect(result.status).toBe("denied");
    expect(result.resultCode).toBe("PLUGIN_PERMISSION_DENIED");
  });

  it("discovers explicit local plugin manifests without executing plugin code", async () => {
    await writeManifestPlugin({
      pluginId: "cn.example.readonly-local",
      capabilityName: "sample.lookup",
      inputSchema: "schemas/sample-input.json",
      outputSchema: "schemas/sample-output.json",
    });
    const registry = new ManifestDirectoryPluginRegistry({
      directories: [directory],
      rootDirectory: process.cwd(),
    });

    const plugins = await registry.listPlugins();

    expect(plugins).toHaveLength(1);
    expect(plugins[0]).toMatchObject({
      id: "cn.example.readonly-local",
      runtime: "node-worker",
    });
    expect(plugins[0]?.capabilities[0]).toMatchObject({
      name: "sample.lookup",
      readOnly: true,
      risk: "read_only",
    });
  });

  it("keeps bundled plugin manifests first when local manifests duplicate ids", async () => {
    await writeManifestPlugin({
      pluginId: STOCK_ANALYSIS_PLUGIN_ID,
      capabilityName: "sample.lookup",
      inputSchema: "schemas/sample-input.json",
      outputSchema: "schemas/sample-output.json",
    });
    const registry = new CompositePluginRegistry([
      new InMemoryPluginRegistry(
        samplePluginDefinitions.map((definition) => definition.manifest),
      ),
      new ManifestDirectoryPluginRegistry({
        directories: [directory],
        rootDirectory: process.cwd(),
      }),
    ]);

    const plugin = await registry.getPlugin(STOCK_ANALYSIS_PLUGIN_ID);

    expect(plugin?.capabilities[0]?.name).toBe(STOCK_QUOTE_CAPABILITY);
  });

  it("does not list invalid or escaping local plugin manifests", async () => {
    await writeManifestPlugin({
      pluginId: "cn.example.escaping-local",
      capabilityName: "sample.lookup",
      inputSchema: "../outside.json",
      outputSchema: "schemas/sample-output.json",
      parseManifest: false,
    });
    const registry = new ManifestDirectoryPluginRegistry({
      directories: [directory],
      rootDirectory: process.cwd(),
    });

    await expect(registry.listPlugins()).resolves.toEqual([]);
  });

  async function writeManifestPlugin(input: {
    pluginId: string;
    capabilityName: string;
    inputSchema: string;
    outputSchema: string;
    parseManifest?: boolean;
  }) {
    await mkdir(path.join(directory, "schemas"), { recursive: true });
    await writeFile(
      path.join(directory, "schemas", "sample-input.json"),
      `${JSON.stringify({ type: "object" }, null, 2)}\n`,
    );
    await writeFile(
      path.join(directory, "schemas", "sample-output.json"),
      `${JSON.stringify({ type: "object" }, null, 2)}\n`,
    );
    const manifest = {
      schemaVersion: 1,
      id: input.pluginId,
      name: "Read-only Local Plugin",
      version: "0.1.0",
      apiVersion: "1",
      entry: "dist/main.js",
      runtime: "node-worker",
      capabilities: [
        {
          name: input.capabilityName,
          description: "Read-only local lookup sample.",
          inputSchema: input.inputSchema,
          outputSchema: input.outputSchema,
          risk: "read_only",
          readOnly: true,
        },
      ],
      permissions: [],
    };
    await writeFile(
      path.join(directory, "manifest.json"),
      `${JSON.stringify(
        input.parseManifest === false
          ? manifest
          : PluginManifestSchema.parse(manifest),
        null,
        2,
      )}\n`,
    );
  }
});
