import { describe, expect, it } from "vitest";
import {
  AdvancedBrainProviderResultSchema,
  CloudReasoningTransportResultSchema,
  type AdvancedBrainRequest,
  type CloudReasoningTransportRequest,
  type CloudReasoningTransportResult,
} from "@jarvis-k/contracts";
import type { CloudReasoningTransportSendOptions } from "@jarvis-k/capabilities";
import {
  GLM_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
  GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
  GLM_ADVANCED_BRAIN_OPERATION,
  GLM_ADVANCED_BRAIN_OPERATION_PATH,
  GLM_ADVANCED_BRAIN_ORIGIN,
  GLM_ADVANCED_BRAIN_PROVIDER_ID,
  GlmAdvancedReasoningProvider,
  GlmAdvancedReasoningProviderError,
  createGlmAdvancedReasoningEndpointProfile,
  createGlmAdvancedReasoningProfile,
  createGlmAdvancedReasoningRequestBody,
  createGlmCloudReasoningModelCapabilityProfile,
  mapTransportFailure,
  type GlmAdvancedReasoningCredential,
  type GlmAdvancedReasoningCredentialProvider,
  type GlmAdvancedReasoningTransport,
} from "../src";

const NOW = "2026-08-25T00:00:00.000Z";

describe("GlmAdvancedReasoningProvider", () => {
  it("defines a default-off cloud provider profile with the fixed GLM endpoint", () => {
    const profile = createGlmAdvancedReasoningProfile({
      enabled: false,
      modelId: "glm-5.2",
    });
    const endpoint = createGlmAdvancedReasoningEndpointProfile();

    expect(profile).toMatchObject({
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
      modelId: "glm-5.2",
      deploymentClass: "cloud",
      executionSemantics: "real_provider",
      automaticRetry: false,
      automaticFallback: false,
      supportsFunctionCalling: false,
      enabled: false,
      privacyClass: "cloud",
      regionAvailability: ["mainland_china"],
    });
    expect(createGlmAdvancedReasoningProfile({ modelId: "glm-5.3" }).modelId).toBe(
      "glm-5.3",
    );
    expect(createGlmAdvancedReasoningProfile({ enabled: false }).modelId).toBe(
      "model_not_selected",
    );
    expect(endpoint).toMatchObject({
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
      deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
      allowedOrigins: [GLM_ADVANCED_BRAIN_ORIGIN],
      allowedOperationPaths: [
        {
          operation: GLM_ADVANCED_BRAIN_OPERATION,
          path: GLM_ADVANCED_BRAIN_OPERATION_PATH,
        },
      ],
      redirectPolicy: "none",
      credentialBindingId: GLM_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
    });
  });

  it("defines shared-runtime GLM model capability profiles without enabling product routing", () => {
    const glm52 = createGlmCloudReasoningModelCapabilityProfile({
      enabled: false,
      modelId: "glm-5.2",
    });
    const glm53 = createGlmCloudReasoningModelCapabilityProfile({
      enabled: false,
      modelId: "glm-5.3",
    });

    expect(glm52).toMatchObject({
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
      modelId: "glm-5.2",
      protocolFamily: "openai_chat_completions",
      deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
      thinkingPolicy: "optional",
      recommendedOutputTokens: 256,
      credentialBindingId: GLM_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
      endpointProfileId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
      enabled: false,
    });
    expect(glm53).toMatchObject({
      modelId: "glm-5.3",
      thinkingPolicy: "mandatory",
      recommendedOutputTokens: 1024,
      enabled: false,
    });
  });

  it("maps AdvancedBrainRequest into a minimized GLM chat completion body", async () => {
    const provider = enabledProvider();
    const prepared = await provider.prepare(cloudRequest());
    const body = createGlmAdvancedReasoningRequestBody(prepared);

    expect(body).toMatchObject({
      model: "glm-5.2",
      response_format: { type: "json_object" },
      stream: false,
      temperature: 0,
    });
    expect(JSON.stringify(body)).toContain("Explain Jarvis-K.");
    expect(JSON.stringify(body)).not.toContain("test-secret-key");
    expect(body).not.toHaveProperty("tools");
  });

  it("returns valid answers with real_provider semantics through fake transport", async () => {
    const transport = new FakeGlmTransport(glmResponse({ answer: "A bounded answer." }));
    const provider = enabledProvider({ transport });
    const result = await provider.execute(await provider.prepare(cloudRequest()));

    expect(result).toMatchObject({
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
      modelId: "glm-5.2",
      resultClass: "answer",
      reasonCode: "PROVIDER_ANSWER",
      answer: "A bounded answer.",
      executionSemantics: "real_provider",
      directActionAttempted: false,
      networkRequestIssued: true,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      localPathExposed: false,
    });
    expect(AdvancedBrainProviderResultSchema.parse(result)).toBeDefined();
    expect(transport.calls).toHaveLength(1);
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty("apiKey");
    expect(JSON.stringify(provider)).not.toContain("test-secret-key");
  });

  it("returns approval-bound structured plans without executing tools", async () => {
    const provider = enabledProvider({
      transport: new FakeGlmTransport(
        glmResponse({
          resultClass: "structured_plan",
          structuredPlan: {
            summary: "Draft a bounded plan.",
            risk: "low",
            requiresConfirmation: false,
            steps: [
              {
                id: "step-1",
                toolId: "chat.answer",
                title: "Draft",
                args: {},
                risk: "low",
                requiresConfirmation: false,
                directActionAttempted: false,
              },
            ],
            directActionAttempted: false,
          },
        }),
      ),
    });

    const result = await provider.execute(
      await provider.prepare(
        cloudRequest({
          category: "multi_step_plan",
          requestedOutput: "structured_plan",
          allowedCapabilities: ["text_reasoning", "structured_output"],
        }),
      ),
    );

    expect(result.resultClass).toBe("structured_plan");
    expect(result.reasonCode).toBe("PROVIDER_PLAN");
    expect(result.structuredPlan?.requiresConfirmation).toBe(true);
    expect(result.structuredPlan?.steps[0]?.requiresConfirmation).toBe(true);
    expect(result.directActionAttempted).toBe(false);
    expect(result.untrustedProposals).toEqual([]);
  });

  it("normalizes clarification, refusal, and blocked provider outputs", async () => {
    const cases = [
      {
        output: {
          resultClass: "clarification",
          clarifyQuestion: "Which safe output should I prepare?",
        },
        expected: "clarification",
        reasonCode: "CLARIFY_REQUIRED",
      },
      {
        output: {
          resultClass: "refusal",
          refusalSummary: "I cannot help with that request.",
        },
        expected: "refusal",
        reasonCode: "REFUSED",
      },
      {
        output: {
          resultClass: "blocked",
          refusalSummary: "The request is blocked by policy.",
        },
        expected: "blocked",
        reasonCode: "SAFETY_BLOCKED",
      },
    ] as const;

    for (const item of cases) {
      const provider = enabledProvider({
        transport: new FakeGlmTransport(glmResponse(item.output)),
      });
      const result = await provider.execute(await provider.prepare(cloudRequest()));

      expect(result.resultClass).toBe(item.expected);
      expect(result.reasonCode).toBe(item.reasonCode);
      expect(result.directActionAttempted).toBe(false);
    }
  });

  it("fails closed before transport for disabled, missing credential, and cloud policy gates", async () => {
    const gateCases = [
      {
        provider: enabledProvider({ enabled: false }),
        request: cloudRequest(),
        reasonCode: "provider_disabled",
      },
      {
        provider: enabledProvider({ credential: undefined }),
        request: cloudRequest(),
        reasonCode: "credential_missing",
      },
      {
        provider: missingModelProvider(),
        request: cloudRequest(),
        reasonCode: "model_not_selected",
      },
      {
        provider: enabledProvider(),
        request: cloudRequest({
          privacyRequirement: "local_only",
          cloudEgressPolicy: "local_only",
        }),
        reasonCode: "cloud_egress_blocked",
      },
      {
        provider: enabledProvider(),
        request: cloudRequest({
          privacyRequirement: "cloud_requires_confirmation",
          cloudEgressPolicy: "require_confirmation",
          userConsentEvidence: undefined,
        }),
        reasonCode: "confirmation_required",
      },
      {
        provider: enabledProvider(),
        request: cloudRequest({
          category: "visual_understanding",
          inputModalities: ["image"],
          allowedCapabilities: ["vision_understanding"],
        }),
        reasonCode: "model_unavailable",
      },
    ] as const;

    for (const item of gateCases) {
      await expect(item.provider.prepare(item.request)).rejects.toMatchObject({
        reasonCode: item.reasonCode,
      });
      expect(item.provider.transportCalls()).toBe(0);
    }
  });

  it("treats credential deletion before execute as unavailable without transport", async () => {
    const credentialProvider = new MutableCredentialProvider({
      apiKey: "test-secret-key",
    });
    const transport = new FakeGlmTransport(glmResponse({ answer: "ok" }));
    const provider = enabledProvider({ credentialProvider, transport });
    const prepared = await provider.prepare(cloudRequest());
    credentialProvider.credential = undefined;

    const result = await provider.execute(prepared);

    expect(result).toMatchObject({
      resultClass: "unavailable",
      reasonCode: "PROVIDER_UNAVAILABLE",
      executionSemantics: "not_executed",
      networkRequestIssued: false,
    });
    expect(transport.calls).toHaveLength(0);
  });

  it("fails closed on invalid JSON, invalid plan schema, model mismatch, and tool calls", async () => {
    const invalidJson = enabledProvider({
      transport: new FakeGlmTransport(rawGlmResponse("not json")),
    });
    const invalidPlan = enabledProvider({
      transport: new FakeGlmTransport(glmResponse({ resultClass: "structured_plan" })),
    });
    const mismatch = enabledProvider({
      transport: new FakeGlmTransport(glmResponse({ answer: "ok" }, "glm-4.7")),
    });
    const toolCalls = enabledProvider({
      transport: new FakeGlmTransport(
        rawGlmResponse(JSON.stringify({ resultClass: "answer", answer: "ok" }), {
          tool_calls: [{ id: "call-1" }],
        }),
      ),
    });

    expect(
      (await invalidJson.execute(await invalidJson.prepare(cloudRequest())))
        .resultClass,
    ).toBe("failed");
    expect(
      (await invalidPlan.execute(await invalidPlan.prepare(cloudRequest())))
        .resultClass,
    ).toBe("failed");
    expect(
      (await mismatch.execute(await mismatch.prepare(cloudRequest()))).resultClass,
    ).toBe("failed");
    const toolResult = await toolCalls.execute(await toolCalls.prepare(cloudRequest()));
    expect(toolResult.resultClass).toBe("failed");
    expect(toolResult.untrustedProposals[0]).toMatchObject({
      proposalType: "tool_call",
      requiresPlannerApproval: true,
      directActionAttempted: false,
    });
  });

  it("maps transport failures to fixed safe classifications without retry or fallback", async () => {
    const cases = [
      [transportFailure(401, "auth_failure", "authentication_transport_failure"), "authentication_failed"],
      [transportFailure(403, "auth_failure", "authentication_transport_failure"), "permission_denied"],
      [transportFailure(429, "rate_limited", "rate_limited"), "rate_limited"],
      [transportFailure(503, "server_error", "provider_server_error"), "provider_unavailable"],
      [transportFailure(undefined, "timeout", "timeout"), "timeout"],
      [transportFailure(undefined, "cancelled", "cancelled"), "cancelled"],
      [transportFailure(undefined, "failed", "response_too_large"), "response_too_large"],
      [transportFailure(undefined, "network_error", "network_unavailable"), "network_failed"],
    ] as const;

    for (const [transportResult, expected] of cases) {
      const transport = new FakeGlmTransport(transportResult);
      const provider = enabledProvider({ transport });
      const result = await provider.execute(await provider.prepare(cloudRequest()));

      expect(mapTransportFailure(transportResult)).toBe(expected);
      expect(result.directActionAttempted).toBe(false);
      expect(result.rawProviderResponsePersisted).toBe(false);
      expect(transport.calls).toHaveLength(1);
    }
  });

  it("keeps status and probe sanitized and explicit-trigger only", async () => {
    const transport = new FakeGlmTransport(glmResponse({ answer: "probe ok" }));
    const provider = enabledProvider({ transport });
    const initial = await provider.getStatus();

    expect(initial).toMatchObject({
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
      modelId: "glm-5.2",
      configured: true,
      enabled: true,
      cloudEgressRequired: true,
      status: "ready",
      credentialExposed: false,
    });
    expect(transport.calls).toHaveLength(0);

    const probe = await provider.probe({ requestId: "advanced-probe-1" });

    expect(probe.probed).toBe(true);
    expect(probe.requestSent).toBe(true);
    expect(JSON.stringify(probe)).not.toContain("test-secret-key");
    expect(JSON.stringify(probe)).not.toContain("Bearer");
    expect(transport.calls).toHaveLength(1);
  });
});

function enabledProvider(
  options: {
    readonly enabled?: boolean;
    readonly credential?: GlmAdvancedReasoningCredential;
    readonly credentialProvider?: GlmAdvancedReasoningCredentialProvider;
    readonly transport?: FakeGlmTransport;
    readonly modelId?: string;
  } = {},
): GlmAdvancedReasoningProvider & { transportCalls(): number } {
  const transport = options.transport ?? new FakeGlmTransport(glmResponse({ answer: "ok" }));
  const provider = new GlmAdvancedReasoningProvider({
    enabled: options.enabled ?? true,
    modelId: options.modelId ?? "glm-5.2",
    transport,
    credentialProvider:
      options.credentialProvider ??
      new MutableCredentialProvider(
        Object.prototype.hasOwnProperty.call(options, "credential")
          ? options.credential
          : { apiKey: "test-secret-key" },
      ),
    now: () => new Date(NOW),
  }) as GlmAdvancedReasoningProvider & { transportCalls(): number };
  provider.transportCalls = () => transport.calls.length;
  return provider;
}

function cloudRequest(
  overrides: Partial<AdvancedBrainRequest> = {},
): AdvancedBrainRequest {
  return {
    schemaVersion: 1,
    requestId: "advanced-request-1",
    category: "advanced_chat",
    source: "test",
    userText: "Explain Jarvis-K.",
    inputModalities: ["text"],
    requestedOutput: "answer",
    privacyRequirement: "cloud_requires_confirmation",
    cloudEgressPolicy: "allow_cloud",
    userConsentEvidence: {
      kind: "explicit_user_confirmation",
      confirmedAt: NOW,
      scope: "single_request",
    },
    timeoutMs: 1_000,
    tokenBudgetClass: "small",
    costBudgetClass: "medium",
    allowedCapabilities: ["text_reasoning"],
    safetyContext: {
      risk: "low",
      allowedToolIds: [],
      approvalRequired: false,
      directExecutionAllowed: false,
    },
    ...overrides,
  };
}

class MutableCredentialProvider implements GlmAdvancedReasoningCredentialProvider {
  public constructor(
    public credential: GlmAdvancedReasoningCredential | undefined,
  ) {}

  public async getCredential(): Promise<GlmAdvancedReasoningCredential | undefined> {
    return this.credential;
  }
}

class FakeGlmTransport implements GlmAdvancedReasoningTransport {
  public readonly calls: {
    readonly request: CloudReasoningTransportRequest;
    readonly options: CloudReasoningTransportSendOptions;
  }[] = [];

  public constructor(private readonly result: CloudReasoningTransportResult) {}

  public async send(
    request: CloudReasoningTransportRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult> {
    this.calls.push({ request, options });
    return this.result;
  }
}

function glmResponse(
  output: Record<string, unknown>,
  model = "glm-5.2",
): CloudReasoningTransportResult {
  return transportSuccess(rawGlmResponse(JSON.stringify(output), {}, model));
}

function rawGlmResponse(
  content: string,
  messageExtra: Record<string, unknown> = {},
  model = "glm-5.2",
): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: 1,
    requestId: "advanced-request-1",
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_OPERATION,
    statusClass: "success",
    reasonCode: "completed",
    httpStatus: 200,
    responseJson: {
      id: "glm-response-1",
      model,
      choices: [
        {
          message: {
            role: "assistant",
            content,
            ...messageExtra,
          },
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    },
    safeHeaders: { contentType: "application/json" },
    latencyMs: 10,
    requestSent: true,
    responseStarted: true,
    responseCompleted: true,
    cancelled: false,
    timeout: false,
    automaticRetry: false,
    automaticFallback: false,
    credentialExposed: false,
    requestBodyExposed: false,
    responseBodyLogged: false,
  });
}

function transportSuccess(
  result: CloudReasoningTransportResult,
): CloudReasoningTransportResult {
  return result;
}

function transportFailure(
  httpStatus:
    | 401
    | 403
    | 429
    | 503
    | undefined,
  statusClass: CloudReasoningTransportResult["statusClass"],
  reasonCode: CloudReasoningTransportResult["reasonCode"],
): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: 1,
    requestId: "advanced-request-1",
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_OPERATION,
    statusClass,
    reasonCode,
    ...(httpStatus === undefined ? {} : { httpStatus }),
    safeHeaders: { contentType: "application/json" },
    latencyMs: 10,
    requestSent: true,
    responseStarted: true,
    responseCompleted: false,
    cancelled: reasonCode === "cancelled",
    timeout: reasonCode === "timeout",
    automaticRetry: false,
    automaticFallback: false,
    credentialExposed: false,
    requestBodyExposed: false,
    responseBodyLogged: false,
  });
}

void GlmAdvancedReasoningProviderError;

function missingModelProvider(): GlmAdvancedReasoningProvider & {
  transportCalls(): number;
} {
  const transport = new FakeGlmTransport(glmResponse({ answer: "ok" }));
  const provider = new GlmAdvancedReasoningProvider({
    enabled: true,
    transport,
    credentialProvider: new MutableCredentialProvider({
      apiKey: "test-secret-key",
    }),
    now: () => new Date(NOW),
  }) as GlmAdvancedReasoningProvider & { transportCalls(): number };
  provider.transportCalls = () => transport.calls.length;
  return provider;
}
