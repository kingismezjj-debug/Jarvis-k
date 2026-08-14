import { describe, expect, it } from "vitest";
import {
  RuntimeHelperClient,
  RuntimeHelperProcessTransport
} from "../src";

function createFixtureScript(): string {
  return [
    "let buffer = '';",
    "process.stdin.setEncoding('utf8');",
    "process.stdin.on('data', (chunk) => {",
    "  buffer += chunk;",
    "  let index = buffer.indexOf('\\n');",
    "  while (index >= 0) {",
    "    const line = buffer.slice(0, index).replace(/\\r$/u, '');",
    "    buffer = buffer.slice(index + 1);",
    "    if (line) {",
    "      const request = JSON.parse(line);",
    "      const base = {",
    "        protocolVersion: 1,",
    "        requestId: request.requestId,",
    "        correlationId: request.correlationId,",
    "        operation: request.operation,",
    "        completedAt: '2026-08-02T00:00:01.000Z'",
    "      };",
    "      let response;",
    "      if (request.operation === 'health') {",
    "        response = { ...base, ok: true, payload: {",
    "          runtime: 'transformers', status: 'ready', processState: 'ready',",
    "          transport: 'private-child-process-ipc', resourceLeaseRequired: true,",
    "          directShellExecutionAllowed: false, runtimeDependenciesIntroduced: true,",
    "          downloadEnabled: false, executionEnabled: true,",
    "          modelArtifactsAccessed: false, reasons: ['fixture helper ready']",
    "        }};",
    "      } else if (request.operation === 'load') {",
    "        response = { ...base, ok: true, payload: {",
    "          sessionId: 'fixture-session-1', modelId: request.payload.modelId,",
    "          capability: 'embedding', loadedAt: '2026-08-02T00:00:01.000Z'",
    "        }};",
    "      } else if (request.operation === 'embed') {",
    "        response = { ...base, ok: true, payload: {",
    "          modelId: request.payload.request.modelId, dimensions: 2,",
    "          vectors: request.payload.request.inputs.map((input) => ({",
    "            ...(input.id === undefined ? {} : { inputId: input.id }),",
    "            values: [0.6, 0.8]",
    "          })), generatedAt: '2026-08-02T00:00:01.000Z'",
    "        }};",
    "      } else if (request.operation === 'generate') {",
    "        response = { ...base, ok: false, error: {",
    "          code: 'GENERATION_EXECUTION_DISABLED',",
    "          message: 'Generation execution remains disabled by the runtime gate.',",
    "          retryable: false",
    "        }};",
    "      } else {",
    "        response = { ...base, ok: true, payload: { status: 'stopped' }};",
    "      }",
    "      process.stdout.write(JSON.stringify(response) + '\\n');",
    "      if (request.operation === 'shutdown') process.exit(0);",
    "    }",
    "    index = buffer.indexOf('\\n');",
    "  }",
    "});"
  ].join("\n");
}

describe("runtime helper process transport", () => {
  it("frames a supervised child process without shell execution", async () => {
    const transport = new RuntimeHelperProcessTransport({
      command: process.execPath,
      args: ["-e", createFixtureScript()]
    });
    expect(transport.pid).toBeGreaterThan(0);
    const client = new RuntimeHelperClient({ transport });

    await expect(client.health()).resolves.toMatchObject({
      status: "ready",
      runtimeDependenciesIntroduced: true,
      executionEnabled: true
    });
    await expect(
      client.load({
        modelId: "fixture/local-embedding",
        capability: "embedding",
        resourceLeaseId: "lease-fixture-1"
      })
    ).resolves.toMatchObject({
      sessionId: "fixture-session-1"
    });
    await expect(
      client.embed({
        sessionId: "fixture-session-1",
        resourceLeaseId: "lease-fixture-1",
        request: {
          modelId: "fixture/local-embedding",
          inputs: [{ id: "input-1", text: "child process" }],
          dimensions: 2
        }
      })
    ).resolves.toMatchObject({
      dimensions: 2,
      vectors: [{ inputId: "input-1", values: [0.6, 0.8] }]
    });
    await expect(
      client.generate({
        sessionId: "fixture-session-1",
        resourceLeaseId: "lease-fixture-1",
        modelId: "Qwen/Qwen3-0.6B",
        prompt: "Route command.",
        maxOutputChars: 512,
        temperature: 0
      })
    ).rejects.toMatchObject({
      code: "GENERATION_EXECUTION_DISABLED"
    });
    await expect(client.shutdown({ reason: "test" })).resolves.toEqual({
      status: "stopped"
    });
  });

  it("fails closed on malformed lines and unexpected process exit", async () => {
    const malformedTransport = new RuntimeHelperProcessTransport({
      command: process.execPath,
      args: ["-e", "process.stdout.write('not-json\\n')"]
    });
    const malformedClient = new RuntimeHelperClient({
      transport: malformedTransport,
      timeoutPolicy: {
        startupTimeoutMs: 1_000,
        requestTimeoutMs: 1_000,
        shutdownTimeoutMs: 1_000
      }
    });

    await expect(malformedClient.health()).rejects.toMatchObject({
      code: "HELPER_PROTOCOL_INVALID"
    });

    const exitTransport = new RuntimeHelperProcessTransport({
      command: process.execPath,
      args: ["-e", "process.exit(0)"]
    });
    const exitClient = new RuntimeHelperClient({
      transport: exitTransport,
      timeoutPolicy: {
        startupTimeoutMs: 1_000,
        requestTimeoutMs: 1_000,
        shutdownTimeoutMs: 1_000
      }
    });

    await expect(exitClient.health()).rejects.toMatchObject({
      code: "HELPER_PROCESS_EXITED"
    });
  });
});
