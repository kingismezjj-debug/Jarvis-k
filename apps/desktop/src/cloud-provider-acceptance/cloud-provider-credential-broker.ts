import type { CloudProviderCredentialBindingId } from "@jarvis-k/contracts";
import type { CloudProviderCredentialVault } from "./cloud-provider-credential-vault";

export interface CloudProviderBrokerCredential {
  readonly scheme: "bearer";
  readonly value: string;
}

export class CloudProviderCredentialBroker {
  public constructor(private readonly vault: CloudProviderCredentialVault) {}

  public async withCredential<T>(
    bindingId: CloudProviderCredentialBindingId,
    useCredential: (credential: CloudProviderBrokerCredential) => Promise<T>,
  ): Promise<T> {
    const secret = await this.vault.decryptForUse(bindingId);
    if (!secret) {
      throw new Error("CLOUD_PROVIDER_CREDENTIAL_UNAVAILABLE");
    }
    try {
      return await useCredential({ scheme: "bearer", value: secret });
    } finally {
      // Plaintext is intentionally scoped to the request closure only.
    }
  }
}
