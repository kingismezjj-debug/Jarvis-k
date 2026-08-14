import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const source = await readFile(
  path.join(
    rootDirectory,
    "tests",
    "heavy-planner-glm-one-window-api-acceptance.cjs"
  ),
  "utf8"
);
const runtimeFactorySource = await readFile(
  path.join(
    rootDirectory,
    "apps",
    "core-host",
    "src",
    "glm-heavy-planner-acceptance-runtime.ts"
  ),
  "utf8"
);

for (const fragment of [
  'JARVIS_K_ENABLE_HEAVY_PLANNER_GLM',
  'JARVIS_K_HEAVY_PLANNER_GLM_ONE_WINDOW_APPROVED',
  'JARVIS_K_HEAVY_PLANNER_GLM_ACCEPTANCE_APPROVED',
  "GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID",
  'modelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID',
  "await store.clear()",
  'status.status === "unconfigured"',
  "GLM_HEAVY_PLANNER_CLEANUP_VERIFICATION_FAILED",
  "credentialCleared",
  "app.exit(exitCodeFor(report.status))",
  "let explicitlyBlocked = false",
  "GLM_HEAVY_PLANNER_RUNTIME_CONSTRUCTION_FAILED",
  "GLM_HEAVY_PLANNER_RUNTIME_SAMPLE_FAILED",
  "createGlmHeavyPlannerAcceptanceRuntime(",
  "transportFailureCounts",
  "httpFailureCounts",
  "recordTransportFailure",
  "PLANNER_RESULT_MISSING",
  "PLANNER_RESULT_UNAVAILABLE_OTHER",
  "blocked_unsafe"
]) {
  if (!source.includes(fragment)) {
    throw new Error(`Missing GLM acceptance-window safety guard: ${fragment}`);
  }
}

for (const fragment of [
  "console.log(configuration",
  "JSON.stringify(configuration",
  "console.log(error",
  "JSON.stringify(error"
]) {
  if (source.includes(fragment)) {
    throw new Error(
      `GLM acceptance-window evidence exposes a forbidden value: ${fragment}`
    );
  }
}
if (source.includes("app.quit()")) {
  throw new Error(
    "GLM acceptance-window runner must preserve its sanitized nonzero exit status."
  );
}

const undefinedSlotCount = (
  runtimeFactorySource.match(/^\s*undefined(?:,|, \/\/)/gmu) ?? []
).length;
if (
  undefinedSlotCount !== 21 ||
  runtimeFactorySource.indexOf("heavyPlannerProvider,") <=
    runtimeFactorySource.indexOf("undefined, // brainRouter") ||
  !runtimeFactorySource.includes("enabled: true")
) {
  throw new Error(
    "GLM acceptance runtime must align the heavy planner and planner options after all 21 optional CoreRuntime slots."
  );
}

console.log(
  JSON.stringify({
    status: "PASS",
    providerId: "heavy-planner.glm",
    credentialExposed: false,
    networkAccessApproved: false,
    credentialCleanupVerified: true
  })
);
