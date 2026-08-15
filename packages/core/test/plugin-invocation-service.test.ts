import { describe, expect, it } from "vitest";
import type {
  PluginRegistry,
  PluginRuntime,
} from "@jarvis-k/capabilities";
import type {
  PluginInvocationRequest,
  PluginInvocationResult,
  PluginManifest,
} from "@jarvis-k/contracts";
import {
  PluginInvocationService,
  type PluginInvocationLocalStateRepository,
} from "../src/plugin-invocation-service";

const pluginId = "cn.example.readonly";
const capability = "hello.lookup";

function manifest(
  overrides: Partial<PluginManifest> = {},
): PluginManifest {
  return {
    schemaVersion: 1,
    id: pluginId,
    name: "Read-only Plugin",
    version: "0.1.0",
    apiVersion: "1",
    entry: "dist/main.js",
    runtime: "node-worker",
    capabilities: [
      {
        name: capability,
        description: "Lookup a sanitized greeting.",
        inputSchema: "schemas/input.json",
        outputSchema: "schemas/output.json",
        risk: "read_only",
        readOnly: true,
      },
    ],
    permissions: [],
    ...overrides,
  };
}

function result(
  request: PluginInvocationRequest,
  overrides: Partial<PluginInvocationResult> = {},
): PluginInvocationResult {
  return {
    requestId: request.requestId,
    pluginId: request.pluginId,
    capability: request.capability,
    status: "completed",
    resultCode: "PLUGIN_INVOKED",
    output: {
      summary: "Hello Jarvis.",
      items: [{ title: "Greeting", fields: [{ label: "Name", value: "Jarvis" }] }],
    },
    invokedAt: "2026-08-14T00:00:00.000Z",
    completedAt: "2026-08-14T00:00:00.000Z",
    directActionAttempted: false,
    credentialExposed: false,
    rawPluginOutputPersisted: false,
    ...overrides,
  };
}

class Registry implements PluginRegistry {
  public constructor(private readonly current?: PluginManifest | undefined) {}
  public async listPlugins(): Promise<PluginManifest[]> {
    return this.current ? [this.current] : [];
  }
  public async getPlugin(id: string): Promise<PluginManifest | undefined> {
    return id === this.current?.id ? this.current : undefined;
  }
}

class Runtime implements PluginRuntime {
  public executableIds = [pluginId];
  public localIds: string[] = [];
  public handler: (request: PluginInvocationRequest) => Promise<unknown> =
    async (request) => result(request);

  public async listExecutablePluginIds(): Promise<string[]> {
    return this.executableIds;
  }
  public async listLocalReadOnlyPluginIds(): Promise<string[]> {
    return this.localIds;
  }
  public async invoke(request: PluginInvocationRequest): Promise<PluginInvocationResult> {
    return (await this.handler(request)) as PluginInvocationResult;
  }
}

class LocalState implements PluginInvocationLocalStateRepository {
  public enabled = true;
  public async initialize(): Promise<void> {}
  public async getState(): Promise<{ enabled: boolean }> {
    return { enabled: this.enabled };
  }
}

function service(input: {
  registry?: PluginRegistry | undefined;
  runtime?: Runtime | undefined;
  localState?: LocalState | undefined;
} = {}): PluginInvocationService {
  return new PluginInvocationService({
    pluginRegistry: input.registry ?? new Registry(manifest()),
    pluginRuntime: input.runtime ?? new Runtime(),
    localPluginStateRepository: input.localState,
    ensureLocalPluginStateRepositoryInitialized: async () => {},
  });
}

function invoke(svc: PluginInvocationService, input: Record<string, unknown> = {}) {
  return svc.invoke({
    requestId: "request-1",
    pluginId,
    capability,
    input,
  });
}

describe("PluginInvocationService", () => {
  it("classifies missing plugins", async () => {
    const outcome = await invoke(service({ registry: new Registry(undefined) }));
    expect(outcome.ok).toBe(false);
    expect(outcome.errorClass).toBe("not_found");
    expect(outcome.resultCode).toBe("PLUGIN_NOT_FOUND");
  });

  it("classifies missing capabilities", async () => {
    const outcome = await service().invoke({
      requestId: "request-1",
      pluginId,
      capability: "other.lookup",
      input: {},
    });
    expect(outcome.ok).toBe(false);
    expect(outcome.errorClass).toBe("capability_not_found");
  });

  it("classifies disabled local plugins", async () => {
    const runtime = new Runtime();
    runtime.localIds = [pluginId];
    const localState = new LocalState();
    localState.enabled = false;
    const outcome = await invoke(service({ runtime, localState }));
    expect(outcome.ok).toBe(false);
    expect(outcome.errorClass).toBe("disabled");
  });

  it("rejects invalid input before runtime invocation", async () => {
    const outcome = await invoke(service(), { "bad key": "value" });
    expect(outcome.ok).toBe(false);
    expect(outcome.errorClass).toBe("input_invalid");
    expect(outcome.executionSemantics).toBe("not_executed");
  });

  it("invokes read-only plugins with verified sanitized output", async () => {
    const outcome = await invoke(service(), { name: "Jarvis" });
    expect(outcome.ok).toBe(true);
    expect(outcome.verified).toBe(true);
    expect(outcome.executionSemantics).toBe("executed");
    expect(outcome.summary).toContain("sanitized output verified");
  });

  it("classifies plugin timeout", async () => {
    const runtime = new Runtime();
    runtime.handler = () => new Promise(() => {});
    const outcome = await service({ runtime }).invoke({
      requestId: "request-1",
      pluginId,
      capability,
      input: {},
      timeoutMs: 1,
    });
    expect(outcome.ok).toBe(false);
    expect(outcome.errorClass).toBe("timeout");
  });

  it("classifies plugin execution failures", async () => {
    const runtime = new Runtime();
    runtime.handler = async () => {
      throw new Error("boom");
    };
    const outcome = await invoke(service({ runtime }));
    expect(outcome.ok).toBe(false);
    expect(outcome.errorClass).toBe("execution_failed");
  });

  it("classifies permission denied", async () => {
    const runtime = new Runtime();
    runtime.localIds = [pluginId];
    const outcome = await invoke(
      service({
        registry: new Registry(manifest({ permissions: ["storage.plugin"] })),
        runtime,
        localState: new LocalState(),
      }),
    );
    expect(outcome.ok).toBe(false);
    expect(outcome.errorClass).toBe("permission_denied");
  });

  it("classifies invalid result format", async () => {
    const runtime = new Runtime();
    runtime.handler = async () => ({ nope: true });
    const outcome = await invoke(service({ runtime }));
    expect(outcome.ok).toBe(false);
    expect(outcome.errorClass).toBe("output_invalid");
  });

  it("keeps dry-run plugin invocation semantically simulated", async () => {
    const outcome = await service().invoke({
      requestId: "request-1",
      pluginId,
      capability,
      input: {},
      dryRun: true,
    });
    expect(outcome.ok).toBe(true);
    expect(outcome.executionSemantics).toBe("simulated");
  });
});
