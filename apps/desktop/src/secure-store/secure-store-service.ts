import type { SecureStringEncryption } from "../secure-voice-provider-store";

export interface ElectronSafeStoragePort {
  isEncryptionAvailable(): boolean;
  encryptString(value: string): Buffer;
  decryptString(value: Buffer): string;
}

export interface SecureStoreStatus {
  available: boolean;
  credentialExposed: false;
}

export class SecureStoreService {
  public constructor(private readonly safeStorage: ElectronSafeStoragePort) {}

  public status(): SecureStoreStatus {
    return {
      available: this.safeStorage.isEncryptionAvailable(),
      credentialExposed: false,
    };
  }

  public encryption(): SecureStringEncryption {
    return {
      isAvailable: () => this.safeStorage.isEncryptionAvailable(),
      encrypt: (value) => this.safeStorage.encryptString(value),
      decrypt: (value) => this.safeStorage.decryptString(value),
    };
  }

  public unavailableStatus(): {
    configured: false;
    secureStorageAvailable: false;
  } {
    return {
      configured: false,
      secureStorageAvailable: false,
    };
  }

  public safeErrorMessage(fallback: string): string {
    return fallback;
  }
}
