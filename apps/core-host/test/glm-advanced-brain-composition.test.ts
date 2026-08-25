import { describe, expect, it } from "vitest";
import {
  CloudReasoningTransportResultSchema,
  type CloudReasoningTransportRequest,
  type CloudReasoningTransportResult,
} from "@jarvis-k/contracts";
import type { CloudReasoningTransportSendOptions } from "@jarvis-k/capabilities";
import {
  GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
  GLM_ADVANCED_BRAIN_OPERATION,
  GLM_ADVANCED_BRAIN_PROVIDER_ID,
  type GlmAdvancedReasoningTransport,
} from "@jarvis-k/inference-adapter-glm-runtime";
import { loadRuntimeConfig } from "../src/config/runtime-config";
import { createCoreHostGlmAdvancedBrainComposition } from "../src/composition/glm-advanced-brain-composition";

describe("Core Host GLM Advanced Brain composition", () => {
  it("is disabled by default and does not construct a provider", () => {
    const composition = createCoreHostGlmAdvancedBrainComposition({
      runtimeConfig: loadRuntimeConfig({}),
    });

    expect(composition.provider).toBeUndefined();
    expect(composition.compositionReport).toMatchObject({
      provider: GLM_ADVANCED_BRAIN_PROVIDER_ID,
      status: "disabled",
      reasonCodes: expect.arrayContaining(["GLM_ADVANCED_BRAIN_DISABLED"]),
      credentialExposed: false,
      networkAccessed: false,
      realApiCalled: false,
      automaticRetry: false,
      automaticFallback: false,
    });
  });

  it("fails closed when explicit enablement lacks transport or credential provider", () => {
    const composition = createCoreHostGlmAdvancedBrainComposition({
      runtimeConfig: loadRuntimeConfig({
        JARVIS_K_ENABLE_ADVANCED_BRAIN_GLM: "1",
        JARVIS_K_ADVANCED_BRAIN_GLM_MODEL_ID: "glm-5.2",
      }),
    });

    expect(composition.provider).toBeUndefined();
    expect(composition.compositionReport.status).toBe("unconfigured");
    expect(composition.compositionReport.reasonCodes).toEqual(
      expect.arrayContaining([
        "GLM_ADVANCED_BRAIN_CREDENTIAL_PROVIDER_MISSING",
        "GLM_ADVANCED_BRAIN_TRANSPORT_MISSING",
      ]),
    );
  });

  it("rejects unsupported configured models without fallback", () => {
    const composition = createCoreHostGlmAdvancedBrainComposition({
      runtimeConfig: loadRuntimeConfig({
        JARVIS_K_ENABLE_ADVANCED_BRAIN_GLM: "1",
        JARVIS_K_ADVANCED_BRAIN_GLM_MODEL_ID: "glm-user-supplied",
      }),
      credentialProvider: { getCredential: async () => ({ apiKey: "test-key" }) },
      transport: new FakeTransport(response({ answer: "ok" })),
    });

    expect(composition.provider).toBeUndefined();
    expect(composition.compositionReport.reasonCodes).toContain(
      "GLM_ADVANCED_BRAIN_MODEL_UNSUPPORTED",
    );
  });

  it("constructs a provider only with explicit enablement and injected fake transport", async () => {
    const transport = new FakeTransport(response({ answer: "ok" }));
    const composition = createCoreHostGlmAdvancedBrainComposition({
      runtimeConfig: loadRuntimeConfig({
        JARVIS_K_ENABLE_ADVANCED_BRAIN_GLM: "1",
        JARVIS_K_ADVANCED_BRAIN_GLM_MODEL_ID: "glm-5.3",
      }),
      credentialProvider: { getCredential: async () => ({ apiKey: "test-key" }) },
      transport,
      now: () => new Date("2026-08-25T00:00:00.000Z"),
    });

    expect(composition.provider).toBeDefined();
    expect(composition.compositionReport).toMatchObject({
      model: "glm-5.3",
      status: "available",
      reasonCodes: ["GLM_ADVANCED_BRAIN_AVAILABLE"],
      networkAccessed: false,
      realApiCalled: false,
    });

    const prepared = await composition.provider?.prepare({
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
        confirmedAt: "2026-08-25T00:00:00.000Z",
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
    });
    const result = await composition.provider?.execute(prepared!);

    expect(result).toMatchObject({
      resultClass: "answer",
      executionSemantics: "real_provider",
      directActionAttempted: false,
      networkRequestIssued: true,
    });
    expect(transport.calls).toHaveLength(1);
    expect(JSON.stringify(transport.calls[0]?.request.bodyJson)).not.toContain(
      "test-key",
    );
    expect(JSON.stringify(composition.compositionReport)).not.toContain("test-key");
  });

  it("keeps production default unreachable unless explicitly configured", () => {
    const defaultProduction = createCoreHostGlmAdvancedBrainComposition({
      runtimeConfig: loadRuntimeConfig({ JARVIS_K_RUNTIME_MODE: "production" }),
    });
    const explicitlyEnabledProduction = createCoreHostGlmAdvancedBrainComposition({
      runtimeConfig: loadRuntimeConfig({
        JARVIS_K_RUNTIME_MODE: "production",
        JARVIS_K_ENABLE_ADVANCED_BRAIN_GLM: "1",
      }),
      credentialProvider: { getCredential: async () => ({ apiKey: "test-key" }) },
      transport: new FakeTransport(response({ answer: "ok" })),
    });

    expect(defaultProduction.provider).toBeUndefined();
    expect(defaultProduction.compositionReport.reasonCodes).toContain(
      "GLM_ADVANCED_BRAIN_DISABLED",
    );
    expect(explicitlyEnabledProduction.provider).toBeUndefined();
    expect(explicitlyEnabledProduction.compositionReport.reasonCodes).toContain(
      "GLM_ADVANCED_BRAIN_DEFAULT_OFF_NOT_PRESERVED",
    );
  });
});

class FakeTransport implements GlmAdvancedReasoningTransport {
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

function response(output: Record<string, unknown>): CloudReasoningTransportResult {
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
      model: "glm-5.3",
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify(output),
          },
        },
      ],
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
