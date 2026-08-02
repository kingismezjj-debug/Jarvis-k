import path from "node:path";
import process from "node:process";
import {
  RuntimeHelperClient,
  createTransformersLocalRuntimeProcessTransport
} from "../packages/inference-runtime-transformers-local/dist/index.js";

const pythonExecutable = process.env.JARVIS_K_RUNTIME_PYTHON;
if (!pythonExecutable) {
  console.error("JARVIS_K_RUNTIME_PYTHON is required for this smoke.");
  process.exit(2);
}

const helperScript = path.resolve(
  "packages/inference-runtime-transformers-local/runtime/transformers_helper.py"
);
const transport = createTransformersLocalRuntimeProcessTransport({
  pythonExecutable,
  helperScript,
  ...(process.env.JARVIS_K_TRANSFORMERS_MODEL_DIR === undefined
    ? {}
    : {
        modelDirectory: process.env.JARVIS_K_TRANSFORMERS_MODEL_DIR
      })
});
const client = new RuntimeHelperClient({ transport });

try {
  const health = await client.health();
  console.log(
    JSON.stringify({
      status: health.status,
      processState: health.processState,
      runtimeDependenciesIntroduced: health.runtimeDependenciesIntroduced,
      executionEnabled: health.executionEnabled,
      modelArtifactsAccessed: health.modelArtifactsAccessed
    })
  );

  if (process.env.JARVIS_K_RUNTIME_EXPECT_MODEL === "1") {
    const loaded = await client.load({
      modelId: "fixture/local-transformers-embedding",
      capability: "embedding",
      resourceLeaseId: "smoke-lease-1"
    });
    const embedded = await client.embed({
      sessionId: loaded.sessionId,
      resourceLeaseId: "smoke-lease-1",
      request: {
        modelId: "fixture/local-transformers-embedding",
        inputs: [
          {
            id: "input-1",
            text: "local transformers child process"
          }
        ]
      }
    });
    const firstVector = embedded.vectors[0]?.values ?? [];
    const norm = Math.sqrt(
      firstVector.reduce((sum, value) => sum + value * value, 0)
    );
    if (Math.abs(norm - 1) >= 0.001) {
      throw new Error("Fixture embedding normalization check failed.");
    }
    console.log(
      JSON.stringify({
        status: "embedded",
        dimensions: embedded.dimensions,
        vectorCount: embedded.vectors.length
      })
    );
  } else {
    const loadFailure = await client
      .load({
        modelId: "Qwen/Qwen3-Embedding-0.6B",
        capability: "embedding",
        resourceLeaseId: "smoke-lease-1"
      })
      .then(() => undefined)
      .catch((error) => ({
        code: error?.code,
        message: error?.message
      }));

    if (
      loadFailure !== undefined &&
      loadFailure.code !== "MODEL_ARTIFACT_UNAVAILABLE" &&
      loadFailure.code !== "RUNTIME_DEPENDENCY_UNAVAILABLE"
    ) {
      throw new Error("Unexpected sanitized runtime load result.");
    }
  }

  await client.shutdown({ reason: "test" });
} finally {
  client.dispose();
}
