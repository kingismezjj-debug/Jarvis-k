import { describe, expect, it } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
  CloudProviderAcceptancePreflightResultSchema,
  CloudProviderAcceptanceProfileSchema,
  CloudProviderAcceptanceSaveCredentialRequestSchema,
} from "../src";

describe("cloud provider acceptance protocol", () => {
  it("defines the fixed DeepSeek Flash fake acceptance profile", () => {
    const profile = CloudProviderAcceptanceProfileSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
      acceptanceVersion: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
      providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
      modelId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
      endpointProfileId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
      endpointOrigin: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN,
      operationPath: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
      credentialBindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
      protocolFamily: "openai_chat_completions",
      requestContractId:
        CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
      fixedPromptId: "cloud-provider-acceptance-fixed-diagnostic-v1",
      stream: true,
      streamUsageIncluded: true,
      thinkingType: "disabled",
      reasoningEffortPresent: false,
      maxTokens: 512,
      responseFormatPresent: false,
      toolsEnabled: false,
      retryEnabled: false,
      fallbackEnabled: false,
      timeoutPolicy: {
        policyId: "deepseek-acceptance-stream-v1",
        headersMs: 15_000,
        firstEventMs: 60_000,
        idleMs: 30_000,
        overallMs: 180_000,
      },
      expectedOutputSchemaId: "fixed-cloud-diagnostic-v1",
      enabledByReleaseGate: false,
      pricingTier: "low",
    });

    expect(profile).toMatchObject({
      stream: true,
      streamUsageIncluded: true,
      maxTokens: 512,
      thinkingType: "disabled",
      reasoningEffortPresent: false,
      responseFormatPresent: false,
      toolsEnabled: false,
      retryEnabled: false,
      fallbackEnabled: false,
    });
  });

  it("rejects renderer supplied endpoint, model, or schema extras", () => {
    expect(() =>
      CloudProviderAcceptanceProfileSchema.parse({
        schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
        acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
        acceptanceVersion: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
        providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
        modelId: "deepseek-r1",
        endpointProfileId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
        endpointOrigin: "https://example.invalid",
        operationPath: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
        credentialBindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
        protocolFamily: "openai_chat_completions",
        requestContractId:
          CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
        fixedPromptId: "cloud-provider-acceptance-fixed-diagnostic-v1",
        stream: true,
        streamUsageIncluded: true,
        thinkingType: "disabled",
        reasoningEffortPresent: false,
        maxTokens: 512,
        responseFormatPresent: false,
        toolsEnabled: false,
        retryEnabled: false,
        fallbackEnabled: false,
        timeoutPolicy: {
          policyId: "deepseek-acceptance-stream-v1",
          headersMs: 15_000,
          firstEventMs: 60_000,
          idleMs: 30_000,
          overallMs: 180_000,
        },
        expectedOutputSchemaId: "fixed-cloud-diagnostic-v1",
        enabledByReleaseGate: false,
        pricingTier: "low",
        endpointOverride: "https://evil.invalid",
      }),
    ).toThrow();
  });

  it("projects the DeepSeek real acceptance gate without raw content", () => {
    const preflight = CloudProviderAcceptancePreflightResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
      acceptanceVersion: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
      acceptanceState: "ready",
      providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
      modelId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
      endpointProfileId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
      endpointOrigin: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN,
      operationPath: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
      httpMethod: "POST",
      redirectPolicy: "none",
      fullEndpointMatch: true,
      credentialBindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
      credentialConfigured: true,
      credentialStorageEncrypted: true,
      secureStorageAvailable: true,
      credentialTypeConfirmed: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
      providerKeyTypeConfirmed: true,
      apiBalanceConfirmedByUser: true,
      protocolFamily: "openai_chat_completions",
      requestContractId:
        CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
      fixedInput: true,
      userContentIncluded: false,
      stream: true,
      streamUsageIncluded: true,
      includeUsage: true,
      thinkingType: "disabled",
      reasoningEffortPresent: false,
      reasoningEffort: "absent",
      maxTokens: 512,
      timeoutHeadersMs: 15_000,
      timeoutFirstEventMs: 60_000,
      timeoutIdleMs: 30_000,
      timeoutOverallMs: 180_000,
      timeoutBounded: true,
      toolsEnabled: false,
      retryEnabled: false,
      fallbackEnabled: false,
      executorReachable: false,
      productRoutingEnabled: false,
      cloudEgressConfirmed: true,
      realAcceptanceCapability: true,
      pricingTier: "low",
      priorRequestCount: 0,
      consumed: false,
      allowSingleRealAcceptance: true,
      allowFakeAcceptance: false,
      realNetworkRequestSent: false,
      reasonCodes: ["ready"],
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });

    expect(preflight.allowSingleRealAcceptance).toBe(true);
    expect(preflight.allowFakeAcceptance).toBe(false);
    expect(preflight.realNetworkRequestSent).toBe(false);
  });

  it("does not allow credential save requests to carry endpoint overrides", () => {
    expect(() =>
      CloudProviderAcceptanceSaveCredentialRequestSchema.parse({
        bindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
        credentialTypeConfirmation: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
        credential: "placeholder-secret-value",
        endpoint: "https://api.deepseek.com/chat/completions",
      }),
    ).toThrow();
  });
});
