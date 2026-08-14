import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const runnerSource = await readFile(
  path.join(
    rootDirectory,
    "tests",
    "glm-provider-latency-health-diagnostic.cjs"
  ),
  "utf8"
);
const healthSource = await readFile(
  path.join(
    rootDirectory,
    "packages",
    "inference-adapter-glm-runtime",
    "src",
    "health-diagnostic.ts"
  ),
  "utf8"
);
const packageJson = JSON.parse(
  await readFile(path.join(rootDirectory, "package.json"), "utf8")
);

for (const fragment of [
  "JARVIS_K_ENABLE_HEAVY_PLANNER_GLM",
  "JARVIS_K_HEAVY_PLANNER_GLM_HEALTH_ONE_WINDOW_APPROVED",
  "GLM_PROVIDER_HEALTH_APPROVAL_GATE_MISSING",
  "GLM_PROVIDER_HEALTH_SECURE_CREDENTIAL_MISSING",
  "GLM_PROVIDER_HEALTH_REQUEST_LIMIT_EXCEEDED",
  "await store.clear()",
  'status.status === "unconfigured"',
  "credentialCleared",
  "rawRequestPersisted: false",
  "rawResponsePersisted: false",
  "coreRuntimePlannerActivated: false",
  "defaultBehaviorChanged: false",
  "uiIpcBehaviorChanged: false",
  "telemetryChanged: false",
  "releaseBehaviorChanged: false",
  "app.exit(exitCodeFor(report.status))"
]) {
  if (!runnerSource.includes(fragment)) {
    throw new Error(`Missing GLM health diagnostic runner guard: ${fragment}`);
  }
}

for (const fragment of [
  "GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS = 20_000",
  "GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS = 64",
  "Return exactly one tiny JSON object",
  "No planning, tools, actions",
  "response_format",
  "json_object",
  "stream: false",
  "temperature: 0",
  "max_tokens: GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS",
  "timeoutMs: GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS"
]) {
  if (!healthSource.includes(fragment)) {
    throw new Error(`Missing GLM health diagnostic fixed bound: ${fragment}`);
  }
}

for (const forbidden of [
  "createGlmHeavyPlannerAcceptanceRuntime",
  "acceptance:heavy-planner:glm",
  "CoreRuntime",
  "BrainPlan",
  "BrainPlannerResult",
  "agent.runBrainCommand",
  "tool_choice",
  "tools:",
  "BrowserWindow",
  "ipcMain",
  "ipcRenderer",
  "app.quit()",
  "console.log(configuration",
  "JSON.stringify(configuration",
  "console.log(error",
  "JSON.stringify(error"
]) {
  if (runnerSource.includes(forbidden) || healthSource.includes(forbidden)) {
    throw new Error(
      `GLM health diagnostic contains forbidden surface: ${forbidden}`
    );
  }
}

if (
  packageJson.scripts["diagnostic:heavy-planner:glm-health"] !==
  "npm run build:inference-adapter-glm-runtime && npm run build:desktop && electron tests/glm-provider-latency-health-diagnostic.cjs"
) {
  throw new Error("Missing fixed GLM health diagnostic npm script.");
}
if (
  packageJson.scripts["smoke:diagnostic:heavy-planner:glm-health"] !==
  "node tests/glm-provider-latency-health-diagnostic-smoke.mjs"
) {
  throw new Error("Missing GLM health diagnostic smoke npm script.");
}

console.log(
  JSON.stringify({
    status: "PASS",
    providerId: "heavy-planner.glm",
    modelId: "glm-4.7",
    timeoutMs: 20000,
    maxOutputTokens: 64,
    acceptanceRunnerUsed: false,
    coreRuntimePlannerActivated: false,
    credentialExposed: false,
    networkAccessApproved: false
  })
);
