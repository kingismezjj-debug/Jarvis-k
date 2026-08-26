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
  DEEPSEEK_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
  DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
  DEEPSEEK_ADVANCED_BRAIN_OPERATION,
  DEEPSEEK_ADVANCED_BRAIN_OPERATION_PATH,
  DEEPSEEK_ADVANCED_BRAIN_ORIGIN,
  DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
  DEEPSEEK_ADVANCED_BRAIN_SUPPORTED_MODEL_IDS,
  DeepSeekAdvancedReasoningProvider,
  createDeepSeekAdvancedReasoningEndpointProfile,
  createDeepSeekAdvancedReasoningProfile,
  createDeepSeekAdvancedReasoningRequestBody,
  createDeepSeekCloudReasoningModelCapabilityProfile,
  createDeepSeekOperationProfile,
  isDeepSeekAdvancedBrainModelId,
  isDeepSeekDeprecatedOrUntrustedModelId,
  mapDeepSeekTransportFailure,
  type DeepSeekAdvancedReasoningCredential,
  type DeepSeekAdvancedReasoningCredentialProvider,
  type DeepSeekAdvancedReasoningTransport,
  type DeepSeekOperationProfile,
} from "../src";

const NOW = "2026-08-26T00:00:00.000Z";

describe("DeepSeekAdvancedReasoningProvider", () => {
  it("defines fixed endpoint and default-off DeepSeek V4 profiles", () => {
    const endpoint = createDeepSeekAdvancedReasoningEndpointProfile();
    const flash = createDeepSeekAdvancedReasoningProfile({
      enabled: false,
      modelId: "deepseek-v4-flash",
    });
    const pro = createDeepSeekAdvancedReasoningProfile({
      enabled: false,
      modelId: "deepseek-v4-pro",
    });

    expect(endpoint).toMatchObject({
      providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
      deploymentId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
      allowedOrigins: [DEEPSEEK_ADVANCED_BRAIN_ORIGIN],
      allowedOperationPaths: [
        {
          operation: DEEPSEEK_ADVANCED_BRAIN_OPERATION,
          path: DEEPSEEK_ADVANCED_BRAIN_OPERATION_PATH,
        },
      ],
      redirectPolicy: "none",
      credentialBindingId: DEEPSEEK_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
    });
    expect(flash).toMatchObject({
      modelId: "deepseek-v4-flash",
      executionSemantics: "real_provider",
      supportsStreaming: true,
      supportsFunctionCalling: false,
      costClass: "low",
      enabled: false,
      privacyClass: "cloud",
    });
    expect(pro).toMatchObject({
      modelId: "deepseek-v4-pro",
      maxContextClass: "very_long",
      costClass: "medium",
      enabled: false,
    });
  });

  it("defines shared CloudReasoning model capabilities without enabling product routing", () => {
    for (const modelId of DEEPSEEK_ADVANCED_BRAIN_SUPPORTED_MODEL_IDS) {
      const profile = createDeepSeekCloudReasoningModelCapabilityProfile({
        enabled: false,
        modelId,
      });

      expect(profile).toMatchObject({
        providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
        modelId,
        protocolFamily: "openai_chat_completions",
        supportsThinking: true,
        thinkingPolicy: "optional",
        supportsReasoningEffort: true,
        allowedReasoningEffort: ["low", "high", "max"],
        supportsTools: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        supportsImages: false,
        credentialBindingId: DEEPSEEK_ADVANCED_BRAIN_CREDENTIAL_BINDING_ID,
        endpointProfileId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
        executionSemantics: "real_provider",
        enabled: false,
      });
    }
  });

  it("allowlists V4 text models and rejects deprecated, alias, vision, and untrusted IDs", () => {
    expect(isDeepSeekAdvancedBrainModelId("deepseek-v4-flash")).toBe(true);
    expect(isDeepSeekAdvancedBrainModelId("deepseek-v4-pro")).toBe(true);

    for (const modelId of [
      "deepseek-chat",
      "deepseek-reasoner",
      "DeepSeek V4 Pro",
      "deepseek-v4-flash-vision-exp",
      "deepseek-v4-user-supplied",
    ]) {
      expect(isDeepSeekAdvancedBrainModelId(modelId)).toBe(false);
    }
    expect(isDeepSeekDeprecatedOrUntrustedModelId("deepseek-chat")).toBe(true);
    expect(isDeepSeekDeprecatedOrUntrustedModelId("DeepSeek V4 Pro")).toBe(true);
  });

  it("maps flash no-thinking requests without reasoning_effort or tools", async () => {
    const provider = enabledProvider({ modelId: "deepseek-v4-flash" });
    const prepared = await provider.prepare(cloudRequest());
    const body = createDeepSeekAdvancedReasoningRequestBody(prepared, {
      operationProfile: createDeepSeekOperationProfile(
        "deepseek-v4-flash-no-thinking",
      ),
    });

    expect(body).toMatchObject({
      model: "deepseek-v4-flash",
      stream: false,
      max_tokens: 512,
      thinking: { type: "disabled" },
    });
    expect(body).not.toHaveProperty("reasoning_effort");
    expect(body).not.toHaveProperty("tools");
    expect(body).not.toHaveProperty("tool_choice");
    expect(body).not.toHaveProperty("function_call");
    expect(body).not.toHaveProperty("response_format");
    expect(body).not.toHaveProperty("stop");
    expect(JSON.stringify(body)).not.toContain("not-a-real-key");
  });

  it("maps pro thinking requests with trusted high reasoning_effort", async () => {
    const provider = enabledProvider({ modelId: "deepseek-v4-pro" });
    const prepared = await provider.prepare(cloudRequest());
    const body = createDeepSeekAdvancedReasoningRequestBody(prepared, {
      operationProfile: createDeepSeekOperationProfile(
        "deepseek-v4-pro-thinking",
      ),
    });

    expect(body).toMatchObject({
      model: "deepseek-v4-pro",
      stream: false,
      max_tokens: 1024,
      thinking: { type: "enabled" },
      reasoning_effort: "high",
    });
    expect(body).not.toHaveProperty("tools");
  });

  it("allows response_format only for fixed structured operation profiles", async () => {
    const provider = enabledProvider({ modelId: "deepseek-v4-flash" });
    const prepared = await provider.prepare(
      cloudRequest({
        requestedOutput: "structured_plan",
        allowedCapabilities: ["text_reasoning", "structured_output"],
      }),
    );
    const body = createDeepSeekAdvancedReasoningRequestBody(prepared, {
      operationProfile: {
        ...createDeepSeekOperationProfile("deepseek-v4-flash-no-thinking"),
        structuredOutput: true,
      },
    });

    expect(body).toHaveProperty("response_format", { type: "json_object" });
  });

  it("fails closed before transport for disabled, missing credential, privacy, and unknown model gates", async () => {
    const cases = [
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
        provider: enabledProvider({ modelId: "deepseek-chat" }),
        request: cloudRequest(),
        reasonCode: "model_not_selected",
      },
      {
        provider: enabledProvider(),
        request: cloudRequest({
          privacyRequirement: "cloud_prohibited",
          cloudEgressPolicy: "prohibit_cloud",
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

    for (const item of cases) {
      await expect(item.provider.prepare(item.request)).rejects.toMatchObject({
        reasonCode: item.reasonCode,
      });
      expect(item.provider.transportCalls()).toBe(0);
    }
  });

  it("returns valid answers with real_provider semantics through fake transport", async () => {
    const transport = new FakeDeepSeekTransport(
      deepSeekResponse({ answer: "A bounded answer." }),
    );
    const provider = enabledProvider({ transport });
    const result = await provider.execute(await provider.prepare(cloudRequest()));

    expect(result).toMatchObject({
      providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
      modelId: "deepseek-v4-flash",
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
    expect(transport.realNetworkRequestSent).toBe(false);
    expect(JSON.stringify(result)).not.toContain("synthetic reasoning");
  });

  it("maps provider and transport failures to fixed safe categories", async () => {
    const cases = [
      [transportFailure(401, "auth_failure", "authentication_transport_failure"), "authentication_failed"],
      [transportFailure(403, "auth_failure", "authentication_transport_failure"), "permission_denied"],
      [transportFailure(429, "rate_limited", "rate_limited"), "rate_limited"],
      [transportFailure(503, "server_error", "provider_server_error"), "provider_unavailable"],
      [transportFailure(undefined, "timeout", "overall_timeout"), "timeout"],
      [transportFailure(undefined, "cancelled", "cancelled"), "cancelled"],
      [transportFailure(undefined, "failed", "provider_content_filtered"), "provider_content_filtered"],
      [transportFailure(undefined, "failed", "provider_capacity_unavailable"), "provider_capacity_unavailable"],
      [transportFailure(undefined, "network_error", "network_unavailable"), "network_failed"],
    ] as const;

    for (const [transportResult, expected] of cases) {
      expect(mapDeepSeekTransportFailure(transportResult)).toBe(expected);
      const transport = new FakeDeepSeekTransport(transportResult);
      const provider = enabledProvider({ transport });
      const result = await provider.execute(await provider.prepare(cloudRequest()));

      expect(result.directActionAttempted).toBe(false);
      expect(result.rawProviderResponsePersisted).toBe(false);
      expect(transport.calls).toHaveLength(1);
      expect(transport.realNetworkRequestSent).toBe(false);
    }
  });

  it("keeps status and probe sanitized and explicit-trigger only", async () => {
    const transport = new FakeDeepSeekTransport(deepSeekResponse({ answer: "ok" }));
    const provider = enabledProvider({ transport });
    const status = await provider.getStatus();

    expect(status).toMatchObject({
      providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
      configured: true,
      enabled: true,
      status: "ready",
      credentialExposed: false,
    });
    expect(transport.calls).toHaveLength(0);

    const probe = await provider.probe({ requestId: "deepseek-probe-1" });

    expect(probe.probed).toBe(true);
    expect(probe.requestSent).toBe(true);
    expect(JSON.stringify(probe)).not.toContain("not-a-real-key");
    expect(JSON.stringify(probe)).not.toContain("Bearer");
  });
});

function enabledProvider(
  options: {
    readonly enabled?: boolean;
    readonly credential?: DeepSeekAdvancedReasoningCredential;
    readonly credentialProvider?: DeepSeekAdvancedReasoningCredentialProvider;
    readonly transport?: FakeDeepSeekTransport;
    readonly modelId?: string;
    readonly operationProfile?: DeepSeekOperationProfile;
  } = {},
): DeepSeekAdvancedReasoningProvider & { transportCalls(): number } {
  const transport =
    options.transport ?? new FakeDeepSeekTransport(deepSeekResponse({ answer: "ok" }));
  const provider = new DeepSeekAdvancedReasoningProvider({
    enabled: options.enabled ?? true,
    modelId: options.modelId ?? "deepseek-v4-flash",
    transport,
    credentialProvider:
      options.credentialProvider ??
      new MutableCredentialProvider(
        Object.prototype.hasOwnProperty.call(options, "credential")
          ? options.credential
          : { apiKey: "not-a-real-key" },
      ),
    ...(options.operationProfile
      ? { operationProfile: options.operationProfile }
      : {}),
    now: () => new Date(NOW),
  }) as DeepSeekAdvancedReasoningProvider & { transportCalls(): number };
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
    timeoutMs: 30_000,
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

class MutableCredentialProvider
  implements DeepSeekAdvancedReasoningCredentialProvider
{
  public constructor(
    public credential: DeepSeekAdvancedReasoningCredential | undefined,
  ) {}

  public async getCredential(): Promise<
    DeepSeekAdvancedReasoningCredential | undefined
  > {
    return this.credential;
  }
}

class FakeDeepSeekTransport implements DeepSeekAdvancedReasoningTransport {
  public readonly calls: {
    readonly request: CloudReasoningTransportRequest;
    readonly options: CloudReasoningTransportSendOptions;
  }[] = [];
  public readonly realNetworkRequestSent = false;

  public constructor(private readonly result: CloudReasoningTransportResult) {}

  public async send(
    request: CloudReasoningTransportRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult> {
    this.calls.push({ request, options });
    return {
      ...this.result,
      requestId: request.requestId,
      providerId: request.providerId,
      deploymentId: request.deploymentId,
      operation: request.operation,
    };
  }
}

function deepSeekResponse(output: Record<string, unknown>): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: 1,
    requestId: "advanced-request-1",
    providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: DEEPSEEK_ADVANCED_BRAIN_OPERATION,
    statusClass: "success",
    reasonCode: "completed",
    httpStatus: 200,
    responseJson: {
      model: "deepseek-v4-flash",
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify(output),
            reasoning_content: "synthetic reasoning",
          },
          finish_reason: "stop",
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
    providerId: DEEPSEEK_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: DEEPSEEK_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: DEEPSEEK_ADVANCED_BRAIN_OPERATION,
    statusClass,
    reasonCode,
    ...(httpStatus === undefined ? {} : { httpStatus }),
    safeHeaders: { contentType: "application/json" },
    latencyMs: 10,
    requestSent: true,
    responseStarted: httpStatus !== undefined,
    responseCompleted: false,
    cancelled: reasonCode === "cancelled",
    timeout: reasonCode === "overall_timeout" || reasonCode === "timeout",
    automaticRetry: false,
    automaticFallback: false,
    credentialExposed: false,
    requestBodyExposed: false,
    responseBodyLogged: false,
  });
}
