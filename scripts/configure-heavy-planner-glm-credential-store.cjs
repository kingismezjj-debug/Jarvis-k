const path = require("node:path");
const { app, safeStorage } = require("electron");
const {
  SecureHeavyPlannerProviderStore
} = require("../apps/desktop/dist/secure-heavy-planner-provider-store.js");

const credentialFromPrivateIpc = readCredentialFromPrivateIpc();
void credentialFromPrivateIpc.catch(() => undefined);

void main();

async function main() {
  let exitCode = 0;
  try {
    await app.whenReady();
    const status = await storeCredential();
    await writeLine(
      process.stdout,
      JSON.stringify({
        providerId: "heavy-planner.glm",
        status: status.status,
        credentialConfigured: status.credentialConfigured,
        credentialExposed: status.credentialExposed,
        networkAccessApproved: status.networkAccessApproved
      })
    );
  } catch (error) {
    exitCode = 1;
    await writeLine(process.stderr, sanitizeFailureCode(error));
  } finally {
    app.exit(exitCode);
  }
}

async function storeCredential() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("SECURE_STORAGE_UNAVAILABLE");
  }

  const apiKey = await credentialFromPrivateIpc;
  const store = new SecureHeavyPlannerProviderStore(
    path.join(
      app.getPath("userData"),
      "jarvis-k-heavy-planner-glm-provider.json"
    ),
    {
      isAvailable: () => safeStorage.isEncryptionAvailable(),
      encrypt: (value) => safeStorage.encryptString(value),
      decrypt: (value) => safeStorage.decryptString(value)
    },
    "glm"
  );
  await store.save({
    provider: "glm",
    credentials: {
      apiKey
    }
  });

  const status = await store.status();
  if (
    status.status !== "configured" ||
    status.credentialConfigured !== true ||
    status.credentialExposed !== false ||
    status.networkAccessApproved !== false
  ) {
    throw new Error("CREDENTIAL_CONFIGURATION_FAILED");
  }
  return status;
}

function readCredentialFromPrivateIpc() {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      finish(new Error("CREDENTIAL_PRIVATE_IPC_TIMEOUT"));
    }, 10_000);
    const finish = (error, value) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      process.off("message", onMessage);
      process.off("disconnect", onDisconnect);
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    };

    const onMessage = (message) => {
      if (
        !isRecord(message) ||
        message.type !== "store-heavy-planner-glm-credential"
      ) {
        finish(new Error("CREDENTIAL_PRIVATE_IPC_INVALID"));
        return;
      }
      const credential = message.credential;
      if (
        typeof credential !== "string" ||
        credential.length < 8 ||
        credential.length > 512 ||
        credential.trim() !== credential ||
        !/^[\x21-\x7e]+$/u.test(credential)
      ) {
        finish(new Error("CREDENTIAL_PRIVATE_IPC_INVALID"));
        return;
      }
      finish(undefined, credential);
    };
    const onDisconnect = () => {
      finish(new Error("CREDENTIAL_PRIVATE_IPC_EMPTY"));
    };

    process.once("message", onMessage);
    process.once("disconnect", onDisconnect);
  });
}

function sanitizeFailureCode(error) {
  const code = error instanceof Error ? error.message : "";
  return new Set([
    "SECURE_STORAGE_UNAVAILABLE",
    "CREDENTIAL_PRIVATE_IPC_EMPTY",
    "CREDENTIAL_PRIVATE_IPC_INVALID",
    "CREDENTIAL_PRIVATE_IPC_TIMEOUT",
    "CREDENTIAL_CONFIGURATION_FAILED"
  ]).has(code)
    ? code
    : "CREDENTIAL_CONFIGURATION_FAILED";
}

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

function writeLine(stream, value) {
  return new Promise((resolve) => {
    stream.write(`${value}\n`, resolve);
  });
}
