import { describe, expect, it } from "vitest";
import {
  GlmAdvancedBrainAcceptanceDiagnosticReportSchema,
  GlmAdvancedBrainAcceptancePreflightResultSchema,
  GlmAdvancedBrainAcceptanceStatusSchema,
} from "../src";

describe("GLM Advanced Brain acceptance protocol", () => {
  it("keeps status as a credential-safe projection", () => {
    const status = GlmAdvancedBrainAcceptanceStatusSchema.parse({
      providerId: "advanced-brain.glm",
      providerEnabled: false,
      acceptanceFlagEnabled: false,
      modelExplicitlySelected: false,
      credentialConfigured: false,
      secureStorageAvailable: true,
      endpointProfileId: "standard_paas_v4",
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
        apiKey: "secret",
      }),
    ).toThrow();
  });

  it("bounds preflight to fixed no-tool, no-user-content request metadata", () => {
    const preflight = GlmAdvancedBrainAcceptancePreflightResultSchema.parse({
      allowRealAcceptance: true,
      providerId: "advanced-brain.glm",
      modelId: "glm-5.2",
      endpointProfileId: "standard_paas_v4",
      checkedAt: "2026-08-25T00:00:00.000Z",
      reasonCodes: ["ready"],
      cloudRequestFixed: true,
      userContentIncluded: false,
      fileIncluded: false,
      imageIncluded: false,
      maximumOutputTokens: 64,
      boundedTimeoutMs: 2000,
      automaticRetry: false,
      automaticFallback: false,
      toolCapabilityCount: 0,
      windowsExecutorAllowed: false,
      pluginRuntimeAllowed: false,
      directActionAttempted: false,
      realNetworkRequestSent: false,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });

    expect(preflight.maximumOutputTokens).toBe(64);
    expect(() =>
      GlmAdvancedBrainAcceptancePreflightResultSchema.parse({
        ...preflight,
        maximumOutputTokens: 128,
      }),
    ).toThrow();
  });

  it("reports diagnostics without prompt, response body, headers, or credential", () => {
    const report = GlmAdvancedBrainAcceptanceDiagnosticReportSchema.parse({
      providerId: "advanced-brain.glm",
      modelId: "glm-5.3",
      endpointProfileId: "standard_paas_v4",
      startedAt: "2026-08-25T00:00:00.000Z",
      completedAt: "2026-08-25T00:00:00.100Z",
      latencyMs: 100,
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
      realNetworkRequestSent: false,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });

    expect(JSON.stringify(report)).not.toContain("glm_advanced_brain_acceptance");
    expect(JSON.stringify(report)).not.toContain("apiKey");
    expect(() =>
      GlmAdvancedBrainAcceptanceDiagnosticReportSchema.parse({
        ...report,
        rawHeaders: {},
      }),
    ).toThrow();
  });
});
