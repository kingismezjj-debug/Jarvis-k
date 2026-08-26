import { describe, expect, it } from "vitest";
import {
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM52_MAX_TOKENS,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_V4_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_V1_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_V2_ID,
  GlmAdvancedBrainAcceptanceDiagnosticReportSchema,
  GlmAdvancedBrainAcceptancePreflightResultSchema,
  GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema,
  GlmAdvancedBrainAcceptanceStatusSchema,
} from "../src";

describe("GLM Advanced Brain acceptance protocol", () => {
  it("keeps status as a credential-safe projection", () => {
    const status = GlmAdvancedBrainAcceptanceStatusSchema.parse({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: "blocked",
      providerId: "advanced-brain.glm",
      providerEnabled: false,
      acceptanceFlagEnabled: false,
      modelExplicitlySelected: false,
      credentialConfigured: false,
      secureStorageAvailable: true,
      credentialStorageEncrypted: false,
      acceptanceConsumed: false,
      credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
      endpointProfileId: "standard_paas_v4",
      endpointOrigin: GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
      operationPath: GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
      fullEndpointMatch: true,
      officialEndpointProfile: true,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
      rendererWritableTrustedGates: false,
      reasonCodes: ["provider_disabled", "model_not_selected"],
    });

    expect(status).toMatchObject({
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });
    expect(() =>
      GlmAdvancedBrainAcceptanceStatusSchema.parse({
        ...status,
        apiKey: "not-a-credential",
      }),
    ).toThrow();
  });

  it("bounds preflight to fixed no-tool, no-user-content request metadata", () => {
    const preflight = GlmAdvancedBrainAcceptancePreflightResultSchema.parse({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: "ready",
      allowRealAcceptance: true,
      providerId: "advanced-brain.glm",
      modelId: "glm-5.2",
      endpointProfileId: "standard_paas_v4",
      endpointOrigin: GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
      operationPath: GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
      fullEndpointMatch: true,
      credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
      credentialConfigured: true,
      credentialStorageEncrypted: true,
      credentialTypeConfirmed: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
      selectedModelExplicit: true,
      checkedAt: "2026-08-25T00:00:00.000Z",
      reasonCodes: ["ready"],
      cloudRequestFixed: true,
      requestBodyFixed: true,
      userContentIncluded: false,
      fileIncluded: false,
      imageIncluded: false,
      requestContractId: "glm-5.2-fixed-diagnostic-no-thinking-v1",
      requestContractProfileId: "glm-5.2-fixed-diagnostic-no-thinking-v1",
      maximumOutputTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM52_MAX_TOKENS,
      maxTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM52_MAX_TOKENS,
      maxOutputTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM52_MAX_TOKENS,
      mandatoryThinking: false,
      thinkingSupported: true,
      thinkingType: "disabled",
      thinkingDisabled: true,
      doSample: false,
      temperaturePresent: false,
      topPPresent: false,
      responseFormatPresent: false,
      samplingMode: "deterministic",
      requestedTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      effectiveTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      timeoutBounded: true,
      boundedTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      streaming: false,
      toolsEnabled: false,
      retryEnabled: false,
      fallbackEnabled: false,
      executorReachable: false,
      allowSingleRealAcceptance: true,
      priorRealRequestCount: 0,
      automaticRetry: false,
      automaticFallback: false,
      toolCapabilityCount: 0,
      windowsExecutorAllowed: false,
      pluginRuntimeAllowed: false,
      directActionAttempted: false,
      realRequestAttempted: false,
      realNetworkRequestSent: false,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });

    expect(preflight.maximumOutputTokens).toBe(256);
    expect(preflight.maxTokens).toBe(256);
    expect(preflight.maxOutputTokens).toBe(256);
    expect(preflight.requestedTimeoutMs).toBe(30_000);
    expect(preflight.effectiveTimeoutMs).toBe(30_000);
    expect(preflight.timeoutBounded).toBe(true);
    expect(() =>
      GlmAdvancedBrainAcceptancePreflightResultSchema.parse({
        ...preflight,
        maxOutputTokens: 128,
      }),
    ).toThrow();
  });

  it("allows the GLM-5.3 mandatory-thinking diagnostic budget projection", () => {
    const preflight = GlmAdvancedBrainAcceptancePreflightResultSchema.parse({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: "ready",
      allowRealAcceptance: true,
      providerId: "advanced-brain.glm",
      modelId: "glm-5.3",
      endpointProfileId: "standard_paas_v4",
      endpointOrigin: GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
      operationPath: GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
      fullEndpointMatch: true,
      credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
      credentialConfigured: true,
      credentialStorageEncrypted: true,
      credentialTypeConfirmed: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
      selectedModelExplicit: true,
      checkedAt: "2026-08-25T00:00:00.000Z",
      reasonCodes: ["ready"],
      cloudRequestFixed: true,
      requestBodyFixed: true,
      userContentIncluded: false,
      fileIncluded: false,
      imageIncluded: false,
      requestContractId: "glm-5.3-fixed-diagnostic-mandatory-thinking-v2",
      requestContractProfileId:
        "glm-5.3-fixed-diagnostic-mandatory-thinking-v2",
      maximumOutputTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      maxTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      maxOutputTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      mandatoryThinking: true,
      thinkingSupported: true,
      thinkingType: "enabled",
      thinkingDisabled: false,
      doSample: false,
      temperaturePresent: false,
      topPPresent: false,
      responseFormatPresent: false,
      samplingMode: "deterministic",
      requestedTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      effectiveTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      timeoutBounded: true,
      boundedTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      streaming: false,
      toolsEnabled: false,
      retryEnabled: false,
      fallbackEnabled: false,
      executorReachable: false,
      allowSingleRealAcceptance: true,
      priorRealRequestCount: 0,
      automaticRetry: false,
      automaticFallback: false,
      toolCapabilityCount: 0,
      windowsExecutorAllowed: false,
      pluginRuntimeAllowed: false,
      directActionAttempted: false,
      realRequestAttempted: false,
      realNetworkRequestSent: false,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });

    expect(preflight.maxOutputTokens).toBe(1024);
    expect(preflight.mandatoryThinking).toBe(true);
    expect(preflight.thinkingType).toBe("enabled");
    expect(preflight.responseFormatPresent).toBe(false);
    expect(preflight.samplingMode).toBe("deterministic");
  });

  it("requires explicit platform API key confirmation", () => {
    expect(
      GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema.parse({
        apiKey: "test-secret-key",
        credentialTypeConfirmation:
          GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
      }),
    ).toMatchObject({
      credentialTypeConfirmation: "platform_api_key",
    });
    expect(() =>
      GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema.parse({
        apiKey: "test-secret-key",
        credentialTypeConfirmation: "coding_plan_key",
      }),
    ).toThrow();
  });

  it("pins the public GLM endpoint without query, fragment, or redirect", () => {
    const endpoint = new URL(GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT);

    expect(GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT).toBe(
      "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    );
    expect(endpoint.origin).toBe("https://open.bigmodel.cn");
    expect(endpoint.pathname).toBe("/api/paas/v4/chat/completions");
    expect(endpoint.search).toBe("");
    expect(endpoint.hash).toBe("");
  });

  it("reports diagnostics without prompt, response body, headers, or credential", () => {
    const report = GlmAdvancedBrainAcceptanceDiagnosticReportSchema.parse({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: "consumed",
      providerId: "advanced-brain.glm",
      modelId: "glm-5.3",
      endpointProfileId: "standard_paas_v4",
      startedAt: "2026-08-25T00:00:00.000Z",
      completedAt: "2026-08-25T00:00:00.100Z",
      latencyMs: 100,
      httpStatus: 200,
      httpStatusClass: "success",
      structuredResultValidation: "PASS",
      tokenUsage: {
        promptTokens: 6,
        completionTokens: 4,
        totalTokens: 10,
      },
      retryCount: 0,
      fallbackCount: 0,
      toolCallCount: 0,
      directActionAttempted: false,
      reasonCode: "ready",
      providerErrorCategory: "none",
      requestSent: true,
      responseStarted: true,
      responseCompleted: true,
      responseByteCount: 128,
      timeout: false,
      cancelled: false,
      toolsObserved: false,
      executorInvocationDelta: 0,
      contentTypeAllowed: true,
      jsonDecoded: true,
      choicesPresent: true,
      finalContentPresent: true,
      reasoningContentObserved: false,
      finishReason: "stop",
      usagePresent: true,
      outputValidationCategory: "fixed_diagnostic_ok",
      sanitizedResponseCategory: "fixed_diagnostic_ok",
      acceptanceConsumed: true,
      realNetworkRequestSent: false,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });

    expect(JSON.stringify(report)).not.toContain("glm_advanced_brain_acceptance");
    expect(JSON.stringify(report)).not.toContain("apiKey");
    expect(JSON.stringify(report)).not.toContain("reasoning_content");
    expect(JSON.stringify(report)).not.toContain("provider-request-id");
    expect(() =>
      GlmAdvancedBrainAcceptanceDiagnosticReportSchema.parse({
        ...report,
        rawHeaders: {},
      }),
    ).toThrow();
    expect(() =>
      GlmAdvancedBrainAcceptanceDiagnosticReportSchema.parse({
        ...report,
        acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_V1_ID,
      }),
    ).toThrow();
    expect(() =>
      GlmAdvancedBrainAcceptanceDiagnosticReportSchema.parse({
        ...report,
        acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_V2_ID,
      }),
    ).toThrow();
    expect(() =>
      GlmAdvancedBrainAcceptanceDiagnosticReportSchema.parse({
        ...report,
        acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_V4_ID,
      }),
    ).toThrow();
  });
});
