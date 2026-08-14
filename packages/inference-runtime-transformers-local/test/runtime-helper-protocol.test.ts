import { describe, expect, it } from "vitest";
import {
  createRuntimeHelperEmbedRequest,
  createRuntimeHelperErrorResponse,
  createRuntimeHelperGenerateRequest,
  createRuntimeHelperHealthRequest,
  createRuntimeHelperLoadRequest,
  createRuntimeHelperProtocolPolicy,
  createRuntimeHelperSanitizedError,
  createRuntimeHelperShutdownRequest,
  createRuntimeHelperTimeoutPolicy,
  createRuntimeHelperUnavailableHealth,
  isRuntimeHelperProtocolPolicyApproved,
  isRuntimeHelperRequest,
  isRuntimeHelperResponse,
  mapRuntimeHelperError,
  parseRuntimeHelperRequest,
  parseRuntimeHelperResponse
} from "../src";

describe("runtime helper protocol guard", () => {
  it("defines a private, fail-closed child-process policy", () => {
    const policy = createRuntimeHelperProtocolPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      transport: "private-child-process-ipc",
      supervisor: "apps/core-host",
      privateChildProcessOnly: true,
      requestCorrelationRequired: true,
      resourceLeaseRequiredBeforeLoad: true,
      resourceLeaseRequiredBeforeEmbed: true,
      resourceLeaseRequiredBeforeGenerate: true,
      directShellExecutionAllowed: false,
      runtimeDependenciesIntroduced: false,
      downloadEnabled: false,
      executionEnabled: false,
      modelArtifactsAccessed: false,
      timeoutPolicy: {
        startupTimeoutMs: 10_000,
        requestTimeoutMs: 30_000,
        shutdownTimeoutMs: 5_000
      }
    });
    expect(isRuntimeHelperProtocolPolicyApproved(policy)).toBe(true);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toContain("directShellExecutionAllowed\":true");
  });

  it("builds and validates health, load, embed, generate, and shutdown requests", () => {
    const identity = {
      requestId: "runtime-request-1",
      correlationId: "runtime-correlation-1",
      createdAt: "2026-08-01T12:00:00.000Z"
    };
    const health = createRuntimeHelperHealthRequest(identity);
    const load = createRuntimeHelperLoadRequest({
      ...identity,
      requestId: "runtime-request-2",
      modelId: "jarvis-fixture/local-embedding-smoke",
      capability: "embedding",
      resourceLeaseId: "lease-test-1",
      modelDirectory: "approved-model-dir"
    });
    const embed = createRuntimeHelperEmbedRequest({
      ...identity,
      requestId: "runtime-request-3",
      sessionId: "session-test-1",
      resourceLeaseId: "lease-test-1",
      request: {
        modelId: "jarvis-fixture/local-embedding-smoke",
        inputs: [{ id: "input-1", text: "protocol guard" }],
        dimensions: 3
      }
    });
    const generate = createRuntimeHelperGenerateRequest({
      ...identity,
      requestId: "runtime-request-4",
      sessionId: "session-test-1",
      resourceLeaseId: "lease-test-1",
      modelId: "Qwen/Qwen3-0.6B",
      prompt: "Return strict JSON.\nRoute chat.",
      maxOutputChars: 512,
      temperature: 0
    });
    const shutdown = createRuntimeHelperShutdownRequest({
      ...identity,
      requestId: "runtime-request-5",
      reason: "app_shutdown"
    });

    expect(health.operation).toBe("health");
    expect(load.payload.resourceLeaseId).toBe("lease-test-1");
    expect(load.payload.modelDirectory).toBe("approved-model-dir");
    expect(embed.payload.request.inputs[0]?.text).toBe("protocol guard");
    expect(generate.payload.maxOutputChars).toBe(512);
    expect(generate.payload.prompt).toContain("\n");
    expect(generate.payload.temperature).toBe(0);
    expect(shutdown.payload.reason).toBe("app_shutdown");
    expect(
      [health, load, embed, generate, shutdown].every((request) =>
        isRuntimeHelperRequest(request)
      )
    ).toBe(true);
  });

  it("requires a resource lease and rejects extra or path-like fields", () => {
    expect(() =>
      parseRuntimeHelperRequest({
        protocolVersion: 1,
        requestId: "runtime-request-1",
        correlationId: "runtime-correlation-1",
        createdAt: "2026-08-01T12:00:00.000Z",
        operation: "load",
        payload: {
          modelId: "jarvis-fixture/local-embedding-smoke",
          capability: "embedding"
        }
      })
    ).toThrow("HELPER_PROTOCOL_INVALID");

    expect(() =>
      parseRuntimeHelperRequest({
        protocolVersion: 1,
        requestId: "runtime-request-1",
        correlationId: "runtime-correlation-1",
        createdAt: "2026-08-01T12:00:00.000Z",
        operation: "load",
        payload: {
          modelId: "C:\\private\\model",
          capability: "embedding",
          resourceLeaseId: "lease-test-1"
        }
      })
    ).toThrow("HELPER_PROTOCOL_INVALID");

    expect(() =>
      parseRuntimeHelperRequest({
        protocolVersion: 1,
        requestId: "runtime-request-1",
        correlationId: "runtime-correlation-1",
        createdAt: "2026-08-01T12:00:00.000Z",
        operation: "load",
        payload: {
          modelId: "jarvis-fixture/local-embedding-smoke",
          capability: "embedding",
          resourceLeaseId: "lease-test-1",
          modelDirectory: "https://example.invalid/model"
        }
      })
    ).toThrow("HELPER_PROTOCOL_INVALID");

    expect(
      isRuntimeHelperRequest({
        protocolVersion: 1,
        requestId: "runtime-request-1",
        correlationId: "runtime-correlation-1",
        createdAt: "2026-08-01T12:00:00.000Z",
        operation: "health",
        payload: {},
        extra: "rejected"
      })
    ).toBe(false);

    expect(() =>
      parseRuntimeHelperRequest({
        protocolVersion: 1,
        requestId: "runtime-request-generate",
        correlationId: "runtime-correlation-generate",
        createdAt: "2026-08-01T12:00:00.000Z",
        operation: "generate",
        payload: {
          sessionId: "session-test-1",
          resourceLeaseId: "lease-test-1",
          modelId: "Qwen/Qwen3-0.6B",
          prompt: "api_key=secret",
          maxOutputChars: 512,
          temperature: 0
        }
      })
    ).toThrow("HELPER_PROTOCOL_INVALID");

    expect(() =>
      parseRuntimeHelperRequest({
        protocolVersion: 1,
        requestId: "runtime-request-generate",
        correlationId: "runtime-correlation-generate",
        createdAt: "2026-08-01T12:00:00.000Z",
        operation: "generate",
        payload: {
          sessionId: "session-test-1",
          resourceLeaseId: "lease-test-1",
          modelId: "Qwen/Qwen3-0.6B",
          prompt: "Return strict JSON.",
          maxOutputChars: 512,
          temperature: 0.2
        }
      })
    ).toThrow("HELPER_PROTOCOL_INVALID");
  });

  it("validates sanitized success responses and preserves correlation", () => {
    const healthRequest = createRuntimeHelperHealthRequest({
      requestId: "runtime-request-health",
      correlationId: "runtime-correlation-health",
      createdAt: "2026-08-01T12:00:00.000Z"
    });
    const healthResponse = parseRuntimeHelperResponse({
      protocolVersion: 1,
      requestId: healthRequest.requestId,
      correlationId: healthRequest.correlationId,
      operation: "health",
      completedAt: "2026-08-01T12:00:01.000Z",
      ok: true,
      payload: createRuntimeHelperUnavailableHealth()
    });

    const embedResponse = parseRuntimeHelperResponse({
      protocolVersion: 1,
      requestId: "runtime-request-embed",
      correlationId: "runtime-correlation-embed",
      operation: "embed",
      completedAt: "2026-08-01T12:00:02.000Z",
      ok: true,
      payload: {
        modelId: "jarvis-fixture/local-embedding-smoke",
        dimensions: 3,
        vectors: [{ inputId: "input-1", values: [0.1, 0.2, 0.3] }],
        generatedAt: "2026-08-01T12:00:02.000Z"
      }
    });
    const generateResponse = parseRuntimeHelperResponse({
      protocolVersion: 1,
      requestId: "runtime-request-generate",
      correlationId: "runtime-correlation-generate",
      operation: "generate",
      completedAt: "2026-08-01T12:00:02.000Z",
      ok: true,
      payload: {
        modelId: "Qwen/Qwen3-0.6B",
        text: "{\"intent\":\"chat\",\"confidence\":0.8,\"slots\":{}}",
        generatedAt: "2026-08-01T12:00:02.000Z"
      }
    });

    expect(healthResponse).toMatchObject({
      operation: "health",
      ok: true,
      requestId: "runtime-request-health",
      correlationId: "runtime-correlation-health",
      payload: {
        status: "unavailable",
        executionEnabled: false
      }
    });
    expect(embedResponse).toMatchObject({
      operation: "embed",
      ok: true,
      payload: {
        dimensions: 3
      }
    });
    expect(generateResponse).toMatchObject({
      operation: "generate",
      ok: true,
      payload: {
        modelId: "Qwen/Qwen3-0.6B",
        text: "{\"intent\":\"chat\",\"confidence\":0.8,\"slots\":{}}"
      }
    });
    expect(isRuntimeHelperResponse(embedResponse)).toBe(true);
    expect(isRuntimeHelperResponse(generateResponse)).toBe(true);
  });

  it("rejects invalid embedding/generation output and unsafe error payloads", () => {
    expect(() =>
      parseRuntimeHelperResponse({
        protocolVersion: 1,
        requestId: "runtime-request-embed",
        correlationId: "runtime-correlation-embed",
        operation: "embed",
        completedAt: "2026-08-01T12:00:02.000Z",
        ok: true,
        payload: {
          modelId: "jarvis-fixture/local-embedding-smoke",
          dimensions: 2,
          vectors: [{ values: [0.1, 0.2, 0.3] }],
          generatedAt: "2026-08-01T12:00:02.000Z"
        }
      })
    ).toThrow("HELPER_PROTOCOL_INVALID");

    expect(() =>
      parseRuntimeHelperResponse({
        protocolVersion: 1,
        requestId: "runtime-request-generate",
        correlationId: "runtime-correlation-generate",
        operation: "generate",
        completedAt: "2026-08-01T12:00:02.000Z",
        ok: true,
        payload: {
          modelId: "Qwen/Qwen3-0.6B",
          text: "token=leak",
          generatedAt: "2026-08-01T12:00:02.000Z"
        }
      })
    ).toThrow("HELPER_PROTOCOL_INVALID");

    expect(() =>
      parseRuntimeHelperResponse({
        protocolVersion: 1,
        requestId: "runtime-request-health",
        correlationId: "runtime-correlation-health",
        operation: "health",
        completedAt: "2026-08-01T12:00:01.000Z",
        ok: false,
        error: {
          code: "HELPER_INTERNAL",
          message: "raw helper failure at C:\\private\\path",
          retryable: true
        }
      })
    ).toThrow("HELPER_PROTOCOL_INVALID");
  });

  it("maps raw helper errors to canonical sanitized errors", () => {
    const mapped = mapRuntimeHelperError(
      new Error("raw helper failure with URL and private path"),
      "load"
    );
    const timeout = mapRuntimeHelperError(
      Object.assign(new Error("raw timeout"), { name: "TimeoutError" }),
      "shutdown"
    );
    const lease = mapRuntimeHelperError(
      new Error("RESOURCE_LEASE_REQUIRED"),
      "load"
    );
    const generationDisabled = mapRuntimeHelperError(
      new Error("GENERATION_EXECUTION_DISABLED"),
      "generate"
    );

    expect(mapped).toEqual(createRuntimeHelperSanitizedError("HELPER_INTERNAL"));
    expect(timeout).toEqual(
      createRuntimeHelperSanitizedError("HELPER_SHUTDOWN_TIMEOUT")
    );
    expect(lease).toEqual(
      createRuntimeHelperSanitizedError("RESOURCE_LEASE_REQUIRED")
    );
    expect(generationDisabled).toEqual(
      createRuntimeHelperSanitizedError("GENERATION_EXECUTION_DISABLED")
    );
    expect(JSON.stringify(mapped)).not.toMatch(/https?:\/\//u);
    expect(JSON.stringify(mapped)).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("creates correlated sanitized generation failure responses", () => {
    const request = createRuntimeHelperGenerateRequest({
      requestId: "runtime-request-generate",
      correlationId: "runtime-correlation-generate",
      createdAt: "2026-08-01T12:00:00.000Z",
      sessionId: "session-test-1",
      resourceLeaseId: "lease-test-1",
      modelId: "Qwen/Qwen3-0.6B",
      prompt: "Route this command.",
      maxOutputChars: 512,
      temperature: 0
    });
    const response = createRuntimeHelperErrorResponse(
      request,
      "GENERATION_EXECUTION_DISABLED",
      "2026-08-01T12:00:01.000Z"
    );

    expect(response).toMatchObject({
      requestId: request.requestId,
      correlationId: request.correlationId,
      operation: "generate",
      ok: false,
      error: {
        code: "GENERATION_EXECUTION_DISABLED",
        retryable: false
      }
    });
    expect(isRuntimeHelperResponse(response)).toBe(true);
  });

  it("creates correlated sanitized failure responses", () => {
    const request = createRuntimeHelperLoadRequest({
      requestId: "runtime-request-load",
      correlationId: "runtime-correlation-load",
      createdAt: "2026-08-01T12:00:00.000Z",
      modelId: "jarvis-fixture/local-embedding-smoke",
      capability: "embedding",
      resourceLeaseId: "lease-test-1"
    });
    const response = createRuntimeHelperErrorResponse(
      request,
      "MODEL_LOAD_UNAVAILABLE",
      "2026-08-01T12:00:01.000Z"
    );

    expect(response).toMatchObject({
      requestId: request.requestId,
      correlationId: request.correlationId,
      operation: "load",
      ok: false,
      error: {
        code: "MODEL_LOAD_UNAVAILABLE",
        retryable: false
      }
    });
    expect(isRuntimeHelperResponse(response)).toBe(true);
  });

  it("keeps timeout policy bounded", () => {
    expect(
      createRuntimeHelperTimeoutPolicy({
        startupTimeoutMs: 2_000,
        requestTimeoutMs: 20_000,
        shutdownTimeoutMs: 3_000
      })
    ).toEqual({
      startupTimeoutMs: 2_000,
      requestTimeoutMs: 20_000,
      shutdownTimeoutMs: 3_000
    });
    expect(() =>
      createRuntimeHelperTimeoutPolicy({ startupTimeoutMs: 99 })
    ).toThrow("HELPER_TIMEOUT_POLICY_INVALID");
    expect(() =>
      createRuntimeHelperTimeoutPolicy({ shutdownTimeoutMs: 120_001 })
    ).toThrow("HELPER_TIMEOUT_POLICY_INVALID");
  });
});
