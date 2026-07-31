import type { ModelManifest } from "@jarvis-k/contracts";

export const fixtureModelManifests: ModelManifest[] = [
  {
    id: "jarvis-fixture/local-stt-smoke",
    capability: "speech_to_text",
    source: "jarvis",
    revision: "fixture-2026-07-31-stt",
    license: "Jarvis-K Fixture",
    runtime: "system",
    quantization: "fixture",
    sizeBytes: 1024,
    sha256:
      "1111111111111111111111111111111111111111111111111111111111111111",
    minMemoryBytes: 512 * 1024 * 1024,
    licenseRisk: "green"
  },
  {
    id: "jarvis-fixture/local-embedding-smoke",
    capability: "embedding",
    source: "jarvis",
    revision: "fixture-2026-07-31-embedding",
    license: "Jarvis-K Fixture",
    runtime: "system",
    quantization: "fixture",
    sizeBytes: 2048,
    sha256:
      "2222222222222222222222222222222222222222222222222222222222222222",
    minMemoryBytes: 512 * 1024 * 1024,
    licenseRisk: "green"
  },
  {
    id: "jarvis-fixture/local-intent-router-smoke",
    capability: "intent_router",
    source: "jarvis",
    revision: "fixture-2026-07-31-intent-router",
    license: "Jarvis-K Fixture",
    runtime: "system",
    quantization: "fixture",
    sizeBytes: 1536,
    sha256:
      "3333333333333333333333333333333333333333333333333333333333333333",
    minMemoryBytes: 256 * 1024 * 1024,
    licenseRisk: "green"
  },
  {
    id: "jarvis-fixture/local-ocr-smoke",
    capability: "ocr",
    source: "jarvis",
    revision: "fixture-2026-07-31-ocr",
    license: "Jarvis-K Fixture",
    runtime: "system",
    quantization: "fixture",
    sizeBytes: 4096,
    sha256:
      "4444444444444444444444444444444444444444444444444444444444444444",
    minMemoryBytes: 256 * 1024 * 1024,
    licenseRisk: "green"
  }
];
