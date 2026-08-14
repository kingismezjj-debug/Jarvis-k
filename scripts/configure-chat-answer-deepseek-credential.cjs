const path = require("node:path");
const { spawn } = require("node:child_process");
const electronExecutable = require("electron");

const STORE_SCRIPT_PATH = path.join(
  __dirname,
  "configure-chat-answer-deepseek-credential-store.cjs"
);
const MAX_CREDENTIAL_LENGTH = 512;
const MAX_CHILD_OUTPUT_BYTES = 4096;

void configureCredential()
  .then((status) => {
    console.log(
      JSON.stringify({
        providerId: "chat-answer.openai-compatible.deepseek",
        status: status.status,
        credentialConfigured: status.credentialConfigured,
        credentialExposed: status.credentialExposed,
        networkAccessApproved: status.networkAccessApproved
      })
    );
  })
  .catch((error) => {
    console.error(sanitizeFailureCode(error));
    process.exitCode = 1;
  });

async function configureCredential() {
  requireInteractiveTerminal();
  const first = await readMaskedSecret("DeepSeek Chat Answer API key: ");
  const second = await readMaskedSecret(
    "Confirm DeepSeek Chat Answer API key: "
  );
  if (first.length === 0 || first !== second) {
    throw new Error("CREDENTIAL_CONFIRMATION_FAILED");
  }
  return writeCredentialThroughSecureStore(validateTerminalCredential(first));
}

function requireInteractiveTerminal() {
  if (
    !process.stdin.isTTY ||
    !process.stdout.isTTY ||
    typeof process.stdin.setRawMode !== "function"
  ) {
    throw new Error("INTERACTIVE_TERMINAL_REQUIRED");
  }
}

function readMaskedSecret(prompt) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    let value = "";
    let settled = false;
    const cleanup = () => {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
    };
    const finish = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const character of String(chunk)) {
        if (character === "\u0003") {
          finish(new Error("CREDENTIAL_CONFIGURATION_CANCELLED"));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\b" || character === "\u007f") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (character >= " " && character !== "\u007f") {
          if (value.length >= MAX_CREDENTIAL_LENGTH) {
            finish(new Error("CREDENTIAL_INPUT_INVALID"));
            return;
          }
          value += character;
          process.stdout.write("*");
        }
      }
    };
    process.stdout.write(prompt);
    input.setEncoding("utf8");
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

function writeCredentialThroughSecureStore(credential) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(electronExecutable, [STORE_SCRIPT_PATH], {
        stdio: ["ignore", "pipe", "pipe", "ipc"],
        windowsHide: true
      });
    } catch {
      reject(new Error("CREDENTIAL_STORAGE_BRIDGE_FAILED"));
      return;
    }
    let output = "";
    let errorOutput = "";
    let outputBytes = 0;
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve(result);
    };
    const trackOutput = (chunk) => {
      outputBytes += Buffer.byteLength(chunk);
      if (outputBytes > MAX_CHILD_OUTPUT_BYTES) {
        child.kill();
        finish(new Error("CREDENTIAL_STORAGE_BRIDGE_FAILED"));
        return false;
      }
      return true;
    };
    child.once("error", () => {
      finish(new Error("CREDENTIAL_STORAGE_BRIDGE_FAILED"));
    });
    child.stdout.on("data", (chunk) => {
      if (trackOutput(chunk)) output += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      if (trackOutput(chunk)) errorOutput += String(chunk);
    });
    child.once("spawn", () => {
      child.send(
        {
          type: "store-chat-answer-deepseek-credential",
          credential
        },
        (error) => {
          if (error) finish(new Error("CREDENTIAL_STORAGE_BRIDGE_FAILED"));
        }
      );
    });
    child.once("close", (code) => {
      if (settled) return;
      if (code !== 0) {
        finish(new Error(sanitizeStoreFailureCode(errorOutput)));
        return;
      }
      let status;
      try {
        status = JSON.parse(output);
      } catch {
        finish(new Error("CREDENTIAL_STORAGE_BRIDGE_FAILED"));
        return;
      }
      if (!isSanitizedConfiguredStatus(status)) {
        finish(new Error("CREDENTIAL_STORAGE_BRIDGE_FAILED"));
        return;
      }
      finish(undefined, status);
    });
  });
}

function isSanitizedConfiguredStatus(value) {
  return (
    isRecord(value) &&
    value.providerId === "chat-answer.openai-compatible.deepseek" &&
    value.status === "configured" &&
    value.credentialConfigured === true &&
    value.credentialExposed === false &&
    value.networkAccessApproved === false
  );
}

function sanitizeFailureCode(error) {
  const code = error instanceof Error ? error.message : "";
  return new Set([
    "INTERACTIVE_TERMINAL_REQUIRED",
    "CREDENTIAL_CONFIRMATION_FAILED",
    "CREDENTIAL_CONFIGURATION_CANCELLED",
    "CREDENTIAL_INPUT_INVALID",
    "CREDENTIAL_TERMINAL_INPUT_INVALID",
    "CREDENTIAL_PRIVATE_IPC_EMPTY",
    "CREDENTIAL_PRIVATE_IPC_INVALID",
    "CREDENTIAL_PRIVATE_IPC_TIMEOUT",
    "CREDENTIAL_STORAGE_BRIDGE_FAILED",
    "SECURE_STORAGE_UNAVAILABLE",
    "CREDENTIAL_CONFIGURATION_FAILED"
  ]).has(code)
    ? code
    : "CREDENTIAL_CONFIGURATION_FAILED";
}

function sanitizeStoreFailureCode(output) {
  const approvedCodes = new Set([
    "SECURE_STORAGE_UNAVAILABLE",
    "CREDENTIAL_INPUT_INVALID",
    "CREDENTIAL_PRIVATE_IPC_EMPTY",
    "CREDENTIAL_PRIVATE_IPC_INVALID",
    "CREDENTIAL_PRIVATE_IPC_TIMEOUT",
    "CREDENTIAL_CONFIGURATION_FAILED"
  ]);
  const code = output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => approvedCodes.has(line));
  return code ?? "CREDENTIAL_STORAGE_BRIDGE_FAILED";
}

function validateTerminalCredential(value) {
  if (
    value.length < 8 ||
    value.length > MAX_CREDENTIAL_LENGTH ||
    value.trim() !== value ||
    !/^[\x21-\x7e]+$/u.test(value)
  ) {
    throw new Error("CREDENTIAL_TERMINAL_INPUT_INVALID");
  }
  return value;
}

function isRecord(value) {
  return typeof value === "object" && value !== null;
}
