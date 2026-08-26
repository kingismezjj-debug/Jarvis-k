import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
  CLOUD_PROVIDER_ACCEPTANCE_GLM_BINDING_ID,
  CloudProviderCredentialBindingProfileSchema,
  type CloudProviderCredentialBindingId,
  type CloudProviderCredentialBindingProfile,
} from "@jarvis-k/contracts";

export type CloudProviderAcceptanceReleaseChannel =
  | "development"
  | "alpha"
  | "stable"
  | "test";

export class CloudProviderCredentialBindingRegistry {
  private readonly profiles: readonly CloudProviderCredentialBindingProfile[];

  public constructor(input: {
    readonly releaseChannel: CloudProviderAcceptanceReleaseChannel;
  }) {
    this.profiles = [
      createBinding({
        bindingId: CLOUD_PROVIDER_ACCEPTANCE_GLM_BINDING_ID,
        providerId: "advanced-brain.glm",
        displayName: "GLM Advanced Brain API key",
        releaseChannel: input.releaseChannel,
      }),
      createBinding({
        bindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
        providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
        displayName: "DeepSeek Advanced Brain API key",
        releaseChannel: input.releaseChannel,
      }),
      createBinding({
        bindingId: "qwen.advanced-brain.api-key",
        providerId: "advanced-brain.qwen",
        displayName: "Qwen Advanced Brain API key",
        releaseChannel: input.releaseChannel,
      }),
      createBinding({
        bindingId: "openai.advanced-brain.api-key",
        providerId: "advanced-brain.openai",
        displayName: "OpenAI Advanced Brain API key",
        releaseChannel: input.releaseChannel,
      }),
    ];
  }

  public list(): readonly CloudProviderCredentialBindingProfile[] {
    return this.profiles;
  }

  public get(
    bindingId: CloudProviderCredentialBindingId,
  ): CloudProviderCredentialBindingProfile | undefined {
    return this.profiles.find(
      (profile) => profile.credentialBindingId === bindingId,
    );
  }
}

function createBinding(input: {
  readonly bindingId: CloudProviderCredentialBindingId;
  readonly providerId: string;
  readonly displayName: string;
  readonly releaseChannel: CloudProviderAcceptanceReleaseChannel;
}): CloudProviderCredentialBindingProfile {
  return CloudProviderCredentialBindingProfileSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    credentialBindingId: input.bindingId,
    providerId: input.providerId,
    credentialType: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
    displayName: input.displayName,
    storageScope: "desktop_main_user_data",
    releaseChannelScope: input.releaseChannel,
    allowedProtocolFamilies: ["openai_chat_completions"],
    cloudProvider: true,
    userConfirmationRequired: true,
    enabledForProduct: false,
  });
}
