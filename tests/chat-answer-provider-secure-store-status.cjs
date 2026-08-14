const path = require("node:path");
const { app, safeStorage } = require("electron");
const {
  SecureChatAnswerProviderStore
} = require("../apps/desktop/dist/secure-chat-answer-provider-store.js");

void main();

async function main() {
  let status;
  try {
    await app.whenReady();
    const providers = [
      {
        providerId: "chat-answer.openai-compatible.deepseek",
        fileName: "jarvis-k-chat-answer-deepseek-provider.json"
      },
      {
        providerId: "chat-answer.openai-compatible.glm",
        fileName: "jarvis-k-chat-answer-glm-provider.json"
      }
    ];
    const results = [];
    for (const provider of providers) {
      const store = new SecureChatAnswerProviderStore(
        path.join(app.getPath("userData"), provider.fileName),
        {
          isAvailable: () => safeStorage.isEncryptionAvailable(),
          encrypt: (value) => safeStorage.encryptString(value),
          decrypt: (value) => safeStorage.decryptString(value)
        },
        provider.providerId
      );
      const providerStatus = await store.status();
      results.push({
        providerId: provider.providerId,
        status: providerStatus.status,
        credentialConfigured: providerStatus.credentialConfigured,
        credentialExposed: providerStatus.credentialExposed,
        networkAccessApproved: providerStatus.networkAccessApproved
      });
    }
    status = {
      status: "ok",
      secureStorageAvailable: safeStorage.isEncryptionAvailable(),
      providers: results
    };
  } catch {
    status = {
      status: "unavailable",
      secureStorageAvailable: false,
      providers: []
    };
    process.exitCode = 1;
  } finally {
    process.stdout.write(`${JSON.stringify(status)}\n`);
    app.exit(process.exitCode ?? 0);
  }
}
