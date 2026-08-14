import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const userDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-heavy-planner-credential-smoke-")
);
const credentialPath = path.join(
  userDataDirectory,
  "jarvis-k-heavy-planner-provider.json"
);
let electronApp;

try {
  electronApp = await electron.launch({
    args: [
      `--user-data-dir=${userDataDirectory}`,
      "scripts/configure-heavy-planner-credential.cjs"
    ],
    cwd: rootDirectory
  });
  const window = await electronApp.firstWindow();
  await window.getByRole("heading", { name: "Heavy Planner Credential" }).waitFor();
  await window.getByLabel("OpenAI API key").fill("test-key");
  await window.getByLabel("Confirm API key").fill("test-key");
  const closed = window.waitForEvent("close", { timeout: 5_000 });
  await window.getByRole("button", { name: "Save" }).click();
  await window.getByText("Credential saved.").waitFor({ timeout: 5_000 });
  await closed;

  const stored = await readFile(credentialPath, "utf8");
  const parsed = JSON.parse(stored);
  if (
    parsed.version !== 1 ||
    typeof parsed.encrypted !== "string" ||
    parsed.encrypted.length === 0 ||
    stored.includes("test-key")
  ) {
    throw new Error("Credential configuration did not write encrypted storage.");
  }

  console.log(
    JSON.stringify({
      status: "PASS",
      credentialConfigured: true,
      credentialExposed: false,
      networkAccessApproved: false
    })
  );
} finally {
  if (electronApp) {
    await electronApp.close().catch(() => undefined);
  }
  await rm(userDataDirectory, { force: true, recursive: true });
}
