import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const runnerSource = await readFile(
  path.join(
    rootDirectory,
    "tests",
    "glm-standard-paas-v4-compact-health-diagnostic.cjs"
  ),
  "utf8"
);
const promptStrategySource = await readFile(
  path.join(
    rootDirectory,
    "packages",
    "inference-adapter-glm-runtime",
    "src",
    "health-prompt-output-bound-strategy.ts"
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
const packageJson = JSON.parse(
  await readFile(path.join(rootDirectory, "package.json"), "utf8")
);

for (const fragment of [
  "standard_paas_v4",
  "compact_json_object_128",
  "COMPACT_MAX_OUTPUT_TOKENS = 128",
  "GLM_STANDARD_PAAS_V4_ENDPOINT",
  "JARVIS_K_ENABLE_HEAVY_PLANNER_GLM",
  "JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_COMPACT_HEALTH_ONE_WINDOW_APPROVED",
  "GLM_STANDARD_COMPACT_HEALTH_APPROVAL_GATE_MISSING",
  "GLM_STANDARD_COMPACT_HEALTH_SECURE_CREDENTIAL_MISSING",
  "GLM_STANDARD_COMPACT_HEALTH_ENDPOINT_MISMATCH",
  "GLM_STANDARD_COMPACT_HEALTH_MODEL_MISMATCH",
  "GLM_STANDARD_COMPACT_HEALTH_TIMEOUT_MISMATCH",
  "GLM_STANDARD_COMPACT_HEALTH_OUTPUT_BOUND_MISMATCH",
  "GLM_STANDARD_COMPACT_HEALTH_REQUEST_MODE_MISMATCH",
  "classifyGlmProviderHealthResponseShape(response.body)",
  "responseShape.healthSignalShape === \"supported_status\"",
  "responseShape.healthSignalShape === \"supported_boolean\"",
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
    throw new Error(`Missing GLM compact health runner guard: ${fragment}`);
  }
}

for (const fragment of [
  "compact_json_object_128",
  "createCompactHealthBody(128)",
  "Output only JSON",
  "max_tokens: maxOutputTokens",
  "increase_health_output_budget_before_next_window",
  "reduce_prompt_payload_before_next_window",
  "do_not_proceed_to_heavy_planner_acceptance"
]) {
  if (!promptStrategySource.includes(fragment)) {
    throw new Error(`Missing compact prompt strategy fragment: ${fragment}`);
  }
}

for (const fragment of [
  "rawResponsePersisted: false",
  "rawContentPersisted: false",
  "healthSignalShape",
  "unsafeSignalCounts",
  "GLM_HEALTH_SHAPE_FINISH_REASON_LENGTH"
]) {
  if (!shapeSource.includes(fragment)) {
    throw new Error(`Missing compact shape classifier fragment: ${fragment}`);
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
  if (
    runnerSource.includes(forbidden) ||
    promptStrategySource.includes(forbidden) ||
    shapeSource.includes(forbidden)
  ) {
    throw new Error(
      `GLM compact health diagnostic contains forbidden surface: ${forbidden}`
    );
  }
}

if (
  packageJson.scripts["diagnostic:heavy-planner:glm-standard-compact-health"] !==
  "npm run build:inference-adapter-glm-runtime && npm run build:desktop && electron tests/glm-standard-paas-v4-compact-health-diagnostic.cjs"
) {
  throw new Error("Missing fixed GLM compact health diagnostic npm script.");
}
if (
  packageJson.scripts[
    "smoke:diagnostic:heavy-planner:glm-standard-compact-health"
  ] !== "node tests/glm-standard-paas-v4-compact-health-diagnostic-smoke.mjs"
) {
  throw new Error("Missing GLM compact health diagnostic smoke npm script.");
}

console.log(
  JSON.stringify({
    status: "PASS",
    providerId: "heavy-planner.glm",
    profileId: "standard_paas_v4",
    strategyProfileId: "compact_json_object_128",
    modelId: "glm-4.7",
    endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    timeoutMs: 20000,
    maxOutputTokens: 128,
    compactHealthOnly: true,
    acceptanceRunnerUsed: false,
    coreRuntimePlannerActivated: false,
    credentialExposed: false,
    networkAccessApproved: false
  })
);
