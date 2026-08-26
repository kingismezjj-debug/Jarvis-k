import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
  CloudProviderAcceptanceProfileSchema,
  type CloudProviderAcceptanceId,
  type CloudProviderAcceptanceProfile,
} from "@jarvis-k/contracts";

export class CloudProviderAcceptanceProfileRegistry {
  private readonly profiles: readonly CloudProviderAcceptanceProfile[];

  public constructor(input: { readonly enabledByReleaseGate: boolean }) {
    this.profiles = [
      CloudProviderAcceptanceProfileSchema.parse({
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
        enabledByReleaseGate: input.enabledByReleaseGate,
        pricingTier: "low",
      }),
    ];
  }

  public list(): readonly CloudProviderAcceptanceProfile[] {
    return this.profiles;
  }

  public get(
    acceptanceId: CloudProviderAcceptanceId,
  ): CloudProviderAcceptanceProfile | undefined {
    return this.profiles.find((profile) => profile.acceptanceId === acceptanceId);
  }
}
