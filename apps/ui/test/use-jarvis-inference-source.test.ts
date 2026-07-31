import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const hookSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "hooks", "use-jarvis.ts"),
  "utf8"
);

describe("useJarvis inference wiring", () => {
  it("runs fixture embeddings through the desktop bridge command contract", () => {
    expect(hookSource).toContain("runFixtureEmbeddingProbe");
    expect(hookSource).toContain('type: "agent.generateEmbeddings"');
    expect(hookSource).toContain("runFixtureIntentProbe");
    expect(hookSource).toContain('type: "agent.routeIntent"');
    expect(hookSource).toContain("runFixtureOcrProbe");
    expect(hookSource).toContain('type: "agent.recognizeOcr"');
    expect(hookSource).toContain("useState<FixtureOcrProbe | null>");
    expect(hookSource).toContain("EmbeddingGenerationResultSchema.safeParse");
    expect(hookSource).toContain("IntentRoutingResultSchema.safeParse");
    expect(hookSource).toContain("OcrRecognitionResultSchema.safeParse");
    expect(hookSource).toContain("new Uint8Array");
    expect(hookSource).toContain("ModelOperationSnapshotSchema.safeParse");
    expect(hookSource).not.toContain("@jarvis-k/inference-adapter-fixture");
  });

  it("tracks model operation events without importing provider policy", () => {
    expect(hookSource).toContain('envelope.event.type === "model.operation.updated"');
    expect(hookSource).toContain("setModelOperations");
    expect(hookSource).not.toContain("@jarvis-k/capabilities");
  });
});
