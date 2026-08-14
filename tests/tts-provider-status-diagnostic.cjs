const path = require("node:path");
const { app, safeStorage } = require("electron");
const {
  SecureTtsProviderStore
} = require("../apps/desktop/dist/secure-tts-provider-store.js");

void main();

async function main() {
  try {
    await app.whenReady();
    const store = new SecureTtsProviderStore(
      path.join(app.getPath("userData"), "jarvis-k-tts-provider.json"),
      {
        isAvailable: () => safeStorage.isEncryptionAvailable(),
        encrypt: (value) => safeStorage.encryptString(value),
        decrypt: (value) => safeStorage.decryptString(value)
      }
    );
    const status = await store.status();
    console.log(
      JSON.stringify({
        status: "PASS",
        userData: app.getPath("userData"),
        secureStorageAvailable: status.secureStorageAvailable,
        configured: status.configured,
        provider: status.provider ?? null,
        voiceId: status.voiceId ?? null,
        resourceId: status.resourceId ?? null,
        credentialExposed: false
      })
    );
    app.exit(0);
  } catch (error) {
    console.log(
      JSON.stringify({
        status: "FAILED",
        reason:
          error instanceof Error
            ? error.message
            : "TTS provider status diagnostic failed.",
        credentialExposed: false
      })
    );
    app.exit(1);
  }
}
