import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const electronExecutable = require("electron");
const entrySource = await readFile(
  path.join(
    rootDirectory,
    "scripts",
    "configure-heavy-planner-glm-credential.cjs"
  ),
  "utf8"
);
const storeSource = await readFile(
  path.join(
    rootDirectory,
    "scripts",
    "configure-heavy-planner-glm-credential-store.cjs"
  ),
  "utf8"
);

const requiredEntryFragments = [
  "process.stdin.isTTY",
  "process.stdout.isTTY",
  "setRawMode(true)",
  "INTERACTIVE_TERMINAL_REQUIRED",
  'require("electron")',
  'stdio: ["ignore", "pipe", "pipe", "ipc"]',
  'type: "store-heavy-planner-glm-credential"',
  "child.send(",
  "CREDENTIAL_STORAGE_BRIDGE_FAILED",
  "sanitizeStoreFailureCode",
  ".split(/\\r?\\n/u)",
  "validateTerminalCredential",
  "CREDENTIAL_TERMINAL_INPUT_INVALID"
];
for (const fragment of requiredEntryFragments) {
  if (!entrySource.includes(fragment)) {
    throw new Error(`Missing GLM credential terminal guard: ${fragment}`);
  }
}

const requiredStoreFragments = [
  "safeStorage.isEncryptionAvailable()",
  "jarvis-k-heavy-planner-glm-provider.json",
  'provider: "glm"',
  "readCredentialFromPrivateIpc",
  'process.once("message", onMessage)',
  "app.exit(exitCode)",
  "CREDENTIAL_PRIVATE_IPC_EMPTY",
  "CREDENTIAL_PRIVATE_IPC_INVALID",
  "CREDENTIAL_PRIVATE_IPC_TIMEOUT"
];
for (const fragment of requiredStoreFragments) {
  if (!storeSource.includes(fragment)) {
    throw new Error(`Missing GLM credential store guard: ${fragment}`);
  }
}
if (storeSource.includes("process.stdin")) {
  throw new Error(
    "GLM credential store must not rely on Electron standard input."
  );
}
for (const forbiddenFragment of [
  "process.argv",
  "process.env",
  "BrowserWindow",
  "ipcMain",
  "ipcRenderer",
  "app.quit()"
]) {
  if (
    entrySource.includes(forbiddenFragment) ||
    storeSource.includes(forbiddenFragment)
  ) {
    throw new Error(
      `GLM credential configuration contains forbidden surface: ${forbiddenFragment}`
    );
  }
}

const nonInteractiveResult = await runNonInteractiveEntry();
if (
  nonInteractiveResult.code !== 1 ||
  nonInteractiveResult.stdout.length !== 0 ||
  nonInteractiveResult.stderr.trim() !== "INTERACTIVE_TERMINAL_REQUIRED"
) {
  throw new Error(
    "GLM credential configuration must reject a non-interactive terminal before launching Electron."
  );
}

const privateIpcProbe = await runPrivateIpcProbe();
if (
  privateIpcProbe.code !== 0 ||
  privateIpcProbe.sent !== true ||
  privateIpcProbe.status !== "passed"
) {
  throw new Error(
    "GLM credential configuration private message channel did not pass its fixture probe."
  );
}

console.log(
  JSON.stringify({
    status: "PASS",
    providerId: "heavy-planner.glm",
    credentialExposed: false,
    networkAccessApproved: false
  })
);

function runNonInteractiveEntry() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        path.join(
          rootDirectory,
          "scripts",
          "configure-heavy-planner-glm-credential.cjs"
        )
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true
      }
    );
    let stdout = "";
    let stderr = "";

    child.once("error", reject);
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.once("close", (code) => {
      resolve({
        code,
        stdout,
        stderr
      });
    });
  });
}

function runPrivateIpcProbe() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      electronExecutable,
      [path.join(rootDirectory, "tests", "electron-private-ipc-probe.cjs")],
      {
        stdio: ["ignore", "pipe", "pipe", "ipc"],
        windowsHide: true
      }
    );
    let stdout = "";
    let sent = false;

    child.once("error", reject);
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.once("spawn", () => {
      try {
        child.send(
          {
            kind: "fixture-private-ipc-probe",
            payload: "fixture-value"
          },
          (error) => {
            sent = error == null;
          }
        );
      } catch {
        sent = false;
      }
    });
    child.once("close", (code) => {
      let report;
      try {
        report = JSON.parse(stdout);
      } catch {
        report = undefined;
      }
      resolve({
        code,
        sent,
        status: report?.status
      });
    });
  });
}
