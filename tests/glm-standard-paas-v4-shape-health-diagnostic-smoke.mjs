import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const runnerSource = await readFile(
  path.join(
    rootDirectory,
    "tests",
    "glm-standard-paas-v4-shape-health-diagnostic.cjs"
  ),
  "utf8"
);
const shapeSource = await readFile(
  path.join(
    rootDirectory,
    "packages",
    "inference-adapter-glm-runtime",
    "src",
    "health-response-shape-strategy.ts"
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
  "standard_paas_v4",
  "GLM_STANDARD_PAAS_V4_ENDPOINT",
  "JARVIS_K_ENABLE_HEAVY_PLANNER_GLM",
  "JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_SHAPE_HEALTH_ONE_WINDOW_APPROVED",
  "GLM_STANDARD_SHAPE_HEALTH_APPROVAL_GATE_MISSING",
  "GLM_STANDARD_SHAPE_HEALTH_SECURE_CREDENTIAL_MISSING",
  "GLM_STANDARD_SHAPE_HEALTH_ENDPOINT_MISMATCH",
  "GLM_STANDARD_SHAPE_HEALTH_MODEL_MISMATCH",
  "GLM_STANDARD_SHAPE_HEALTH_TIMEOUT_MISMATCH",
  "GLM_STANDARD_SHAPE_HEALTH_OUTPUT_BOUND_MISMATCH",
  "classifyGlmProviderHealthResponseShape(response.body)",
  "report.requestCount = 1",
  "await store.clear()",
  'status.status === "unconfigured"',
  "credentialCleared",
  "rawRequestPersisted: false",
  "rawResponsePersisted: false",
  "rawContentPersisted: false",
  "coreRuntimePlannerActivated: false",
  "defaultBehaviorChanged: false",
  "uiIpcBehaviorChanged: false",
  "telemetryChanged: false",
  "releaseBehaviorChanged: false",
  "app.exit(exitCodeFor(report.status))"
]) {
  if (!runnerSource.includes(fragment)) {
    throw new Error(`Missing GLM shape health runner guard: ${fragment}`);
  }
}

for (const fragment of [
  "networkAccessed: false",
  "credentialAccessed: false",
  "realApiCalled: false",
  "rawResponsePersisted: false",
  "rawContentPersisted: false",
  "topLevelShape",
  "choicesShape",
  "messageShape",
  "finishReasonShape",
  "contentShape",
  "contentLengthBucket",
  "jsonExtractionShape",
  "healthSignalShape",
  "unsafeSignalCounts",
  "eligible_for_shape_only_runtime_diagnostic_request"
]) {
  if (!shapeSource.includes(fragment)) {
    throw new Error(`Missing GLM shape classifier field: ${fragment}`);
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
  "max_tokens: GLM_PROVIDER_HEALTH_DIAGNOSTIC_MAX_OUTPUT_TOKENS"
]) {
  if (!healthSource.includes(fragment)) {
    throw new Error(`Missing GLM shape health fixed bound: ${fragment}`);
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
  if (runnerSource.includes(forbidden) || shapeSource.includes(forbidden)) {
    throw new Error(
      `GLM shape health diagnostic contains forbidden surface: ${forbidden}`
    );
  }
}

if (
  packageJson.scripts["diagnostic:heavy-planner:glm-standard-shape-health"] !==
  "npm run build:inference-adapter-glm-runtime && npm run build:desktop && electron tests/glm-standard-paas-v4-shape-health-diagnostic.cjs"
) {
  throw new Error("Missing fixed GLM shape health diagnostic npm script.");
}
if (
  packageJson.scripts[
    "smoke:diagnostic:heavy-planner:glm-standard-shape-health"
  ] !== "node tests/glm-standard-paas-v4-shape-health-diagnostic-smoke.mjs"
) {
  throw new Error("Missing GLM shape health diagnostic smoke npm script.");
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
    shapeOnly: true,
    acceptanceRunnerUsed: false,
    coreRuntimePlannerActivated: false,
    credentialExposed: false,
    networkAccessApproved: false
  })
);
