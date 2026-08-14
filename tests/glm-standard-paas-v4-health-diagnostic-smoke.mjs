import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const runnerSource = await readFile(
  path.join(rootDirectory, "tests", "glm-standard-paas-v4-health-diagnostic.cjs"),
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
const strategySource = await readFile(
  path.join(
    rootDirectory,
    "packages",
    "inference-adapter-glm-runtime",
    "src",
    "model-origin-strategy.ts"
  ),
  "utf8"
);
const packageJson = JSON.parse(
  await readFile(path.join(rootDirectory, "package.json"), "utf8")
);

for (const fragment of [
  "standard_paas_v4",
  "GLM_STANDARD_PAAS_V4_ENDPOINT",
  "JARVIS_K_ENABLE_HEAVY_PLANNER_GLM",
  "JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_HEALTH_ONE_WINDOW_APPROVED",
  "GLM_STANDARD_HEALTH_APPROVAL_GATE_MISSING",
  "GLM_STANDARD_HEALTH_SECURE_CREDENTIAL_MISSING",
  "GLM_STANDARD_HEALTH_REQUEST_LIMIT_EXCEEDED",
  "GLM_STANDARD_HEALTH_ENDPOINT_MISMATCH",
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
    throw new Error(`Missing GLM standard health runner guard: ${fragment}`);
  }
}

if (
  !runnerSource.includes("GLM_STANDARD_PAAS_V4_ENDPOINT") ||
  !strategySource.includes("https://open.bigmodel.cn/api/paas/v4") ||
  !strategySource.includes("/chat/completions")
) {
  throw new Error("Missing fixed GLM standard PAAS v4 endpoint wiring.");
}

for (const fragment of [
  "GLM_PROVIDER_HEALTH_DIAGNOSTIC_TIMEOUT_MS = 20_000",
  "GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS = 64",
  "profileId?: GlmProviderOriginProfileId",
  "getGlmProviderModelOriginProfile",
  "GLM_STANDARD_PAAS_V4_ENDPOINT",
  "Return exactly one tiny JSON object",
  "No planning, tools, actions",
  "stream: false",
  "temperature: 0"
]) {
  if (!healthSource.includes(fragment)) {
    throw new Error(`Missing GLM standard health fixed bound: ${fragment}`);
  }
}

for (const fragment of [
  "profileId: \"standard_paas_v4\"",
  "status: \"candidate\"",
  "origin: GLM_STANDARD_PAAS_V4_ORIGIN",
  "endpoint: GLM_STANDARD_PAAS_V4_ENDPOINT",
  "defaultModelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID"
]) {
  if (!strategySource.includes(fragment)) {
    throw new Error(`Missing GLM standard profile metadata: ${fragment}`);
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
      `GLM standard health diagnostic contains forbidden surface: ${forbidden}`
    );
  }
}

if (
  packageJson.scripts["diagnostic:heavy-planner:glm-standard-health"] !==
  "npm run build:inference-adapter-glm-runtime && npm run build:desktop && electron tests/glm-standard-paas-v4-health-diagnostic.cjs"
) {
  throw new Error("Missing fixed GLM standard health diagnostic npm script.");
}
if (
  packageJson.scripts["smoke:diagnostic:heavy-planner:glm-standard-health"] !==
  "node tests/glm-standard-paas-v4-health-diagnostic-smoke.mjs"
) {
  throw new Error("Missing GLM standard health diagnostic smoke npm script.");
}

console.log(
  JSON.stringify({
    status: "PASS",
    providerId: "heavy-planner.glm",
    profileId: "standard_paas_v4",
    modelId: "glm-4.7",
    endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    timeoutMs: 20000,
    maxOutputTokens: 64,
    acceptanceRunnerUsed: false,
    coreRuntimePlannerActivated: false,
    credentialExposed: false,
    networkAccessApproved: false
  })
);
