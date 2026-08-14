import { describe, expect, it } from "vitest";
import {
  GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS,
  GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS,
  GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
  GLM_STANDARD_PAAS_V4_ENDPOINT,
  GlmRuntimeHeavyPlannerTransportFailure,
  classifyGlmProviderHealthHttpStatus,
  createGlmProviderHealthDiagnosticRequest,
  runGlmProviderHealthDiagnostic,
  type GlmProviderHealthDiagnosticTransport
} from "../src";

describe("GLM provider health diagnostic", () => {
  it("creates one minimal non-planning JSON health request", () => {
    const request = createGlmProviderHealthDiagnosticRequest({
      apiKey: "test-key"
    });

    expect(request).toMatchObject({
      url: GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
      timeoutMs: GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS,
      body: {
        model: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
        response_format: { type: "json_object" },
        stream: false,
        temperature: 0,
        max_tokens: GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS
      }
    });
    expect(request.body.max_tokens).toBe(64);
    expect(request.body.messages).toHaveLength(2);
    expect(request.body.messages[0].content).toContain("No planning");
    expect(request.body.messages[0].content).not.toContain("BrainPlan");
    expect(request.body.messages[0].content).not.toContain("tool selection");
    expect(request.body.messages[1].content).toContain(
      GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID
    );
    expect(request.body).not.toHaveProperty("tools");
    expect(request.body).not.toHaveProperty("tool_choice");
    expect(JSON.stringify(request.body)).not.toContain("test-key");
  });

  it("creates a standard_paas_v4 health request only from fixed profile metadata", () => {
    const request = createGlmProviderHealthDiagnosticRequest(
      {
        apiKey: "test-key"
      },
      {
        profileId: "standard_paas_v4"
      }
    );

    expect(request.url).toBe(GLM_STANDARD_PAAS_V4_ENDPOINT);
    expect(request.url).toBe(
      "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    );
    expect(request.body).toMatchObject({
      model: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
      response_format: { type: "json_object" },
      stream: false,
      temperature: 0,
      max_tokens: GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS
    });
    expect(JSON.stringify(request.body)).not.toContain("test-key");
  });

  it("runs the diagnostic with the requested fixed standard profile", async () => {
    let observedUrl = "";
    const transport: GlmProviderHealthDiagnosticTransport = {
      async send(request) {
        observedUrl = request.url;
        return {
          status: 200,
          body: chatResponse({ status: "ok" })
        };
      }
    };

    await expect(
      runGlmProviderHealthDiagnostic({
        credential: { apiKey: "test-key" },
        profileId: "standard_paas_v4",
        transport,
        now: tickingClock()
      })
    ).resolves.toMatchObject({
      diagnosticStatus: "healthy",
      requestCount: 1,
      networkAttempted: true
    });
    expect(observedUrl).toBe(GLM_STANDARD_PAAS_V4_ENDPOINT);
  });

  it("returns healthy from a minimal valid provider response without raw persistence", async () => {
    const transport = fixedTransport(chatResponse({ status: "ok" }));
    const result = await runGlmProviderHealthDiagnostic({
      credential: { apiKey: "test-key" },
      transport,
      now: tickingClock()
    });

    expect(result).toMatchObject({
      diagnosticStatus: "healthy",
      elapsedMs: 25,
      requestCount: 1,
      networkAttempted: true,
      rawRequestPersisted: false,
      rawResponsePersisted: false,
      credentialExposed: false,
      directActionAttempted: false,
      coreRuntimePlannerActivated: false
    });
    expect(JSON.stringify(result)).not.toContain("test-key");
    expect(JSON.stringify(result)).not.toContain("ok");
  });

  it.each([
    ["status success", chatResponse({ status: "success" })],
    ["status available", chatResponse({ status: "available" })],
    ["boolean ok", chatResponse({ ok: true })],
    ["boolean available", chatResponse({ available: true })],
    ["nested result status", chatResponse({ result: { status: "ok" } })],
    ["nested data ready", chatResponse({ data: { ready: true } })],
    [
      "object content",
      {
        choices: [
          {
            message: {
              role: "assistant",
              content: { status: "healthy" }
            }
          }
        ]
      }
    ],
    [
      "missing role",
      {
        choices: [
          {
            message: {
              content: JSON.stringify({ status: "ok" })
            }
          }
        ]
      }
    ],
    [
      "prefixed json content",
      {
        choices: [
          {
            message: {
              role: "assistant",
              content: `Result: ${JSON.stringify({ status: "ready" })}`
            }
          }
        ]
      }
    ]
  ])("normalizes bounded health response variant: %s", async (_name, body) => {
    const result = await runGlmProviderHealthDiagnostic({
      credential: { apiKey: "test-key" },
      transport: fixedTransport(body),
      now: tickingClock()
    });

    expect(result).toMatchObject({
      diagnosticStatus: "healthy",
      requestCount: 1,
      networkAttempted: true,
      rawRequestPersisted: false,
      rawResponsePersisted: false,
      directActionAttempted: false
    });
  });

  it.each([
    [401, "http_authentication_rejected"],
    [403, "http_authentication_rejected"],
    [429, "http_rate_limited"],
    [404, "http_model_unavailable"],
    [408, "http_provider_unavailable"],
    [503, "http_provider_unavailable"],
    [500, "unavailable"]
  ] as const)("maps HTTP %i to %s", async (status, expected) => {
    expect(classifyGlmProviderHealthHttpStatus(status)).toBe(expected);

    const result = await runGlmProviderHealthDiagnostic({
      credential: { apiKey: "test-key" },
      transport: fixedTransport({ error: { message: "private" } }, status),
      now: tickingClock()
    });

    expect(result.diagnosticStatus).toBe(expected);
    expect(JSON.stringify(result)).not.toContain("private");
  });

  it("classifies transport timeout and connection without error text", async () => {
    const timeout = await runGlmProviderHealthDiagnostic({
      credential: { apiKey: "test-key" },
      transport: throwingTransport(
        new GlmRuntimeHeavyPlannerTransportFailure("timeout")
      ),
      now: tickingClock()
    });
    const connection = await runGlmProviderHealthDiagnostic({
      credential: { apiKey: "test-key" },
      transport: throwingTransport(
        new GlmRuntimeHeavyPlannerTransportFailure("connection")
      ),
      now: tickingClock()
    });

    expect(timeout).toMatchObject({
      diagnosticStatus: "timeout",
      requestCount: 1,
      transportFailureCounts: {
        timeout: 1,
        connection: 0,
        unknown: 0
      }
    });
    expect(connection).toMatchObject({
      diagnosticStatus: "connection_failed",
      transportFailureCounts: {
        timeout: 0,
        connection: 1,
        unknown: 0
      }
    });
  });

  it("fails closed for invalid minimal responses", async () => {
    const result = await runGlmProviderHealthDiagnostic({
      credential: { apiKey: "test-key" },
      transport: fixedTransport(chatResponse({ status: "planned" })),
      now: tickingClock()
    });

    expect(result).toMatchObject({
      diagnosticStatus: "invalid_minimal_response",
      requestCount: 1,
      directActionAttempted: false
    });
  });

  it.each([
    ["planned status", chatResponse({ status: "planned" })],
    [
      "direct action",
      chatResponse({
        status: "ok",
        directActionAttempted: true
      })
    ],
    [
      "tool call",
      {
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({ status: "ok" }),
              tool_calls: []
            }
          }
        ]
      }
    ],
    [
      "secret-like content",
      {
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                status: "ok",
                note: "api_key should not appear"
              })
            }
          }
        ]
      }
    ]
  ])("keeps unsafe or unsupported health variant fail-closed: %s", async (_name, body) => {
    const result = await runGlmProviderHealthDiagnostic({
      credential: { apiKey: "test-key" },
      transport: fixedTransport(body),
      now: tickingClock()
    });

    expect(result).toMatchObject({
      diagnosticStatus: "invalid_minimal_response",
      requestCount: 1,
      directActionAttempted: false
    });
  });
});

function chatResponse(content: Record<string, unknown>) {
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: JSON.stringify(content)
        }
      }
    ]
  };
}

function fixedTransport(
  body: unknown,
  status = 200
): GlmProviderHealthDiagnosticTransport {
  return {
    async send() {
      return { status, body };
    }
  };
}

function throwingTransport(error: unknown): GlmProviderHealthDiagnosticTransport {
  return {
    async send() {
      throw error;
    }
  };
}

function tickingClock(): () => number {
  let value = 1_000;
  return () => {
    const current = value;
    value += 25;
    return current;
  };
}
