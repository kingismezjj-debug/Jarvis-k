import { describe, expect, it } from "vitest";
import {
  recommendedModelCandidates,
  StaticModelCandidateRegistry,
  StaticModelRegistry
} from "../src";
import type { ModelManifest } from "@jarvis-k/contracts";

const manifests: ModelManifest[] = [
  {
    id: "vendor/local-stt-small",
    capability: "speech_to_text",
    source: "huggingface",
    revision: "commit-a",
    license: "MIT",
    runtime: "ctranslate2",
    quantization: "int8",
    sizeBytes: 512,
    licenseRisk: "green"
  },
  {
    id: "vendor/unsafe-tts",
    capability: "text_to_speech",
    source: "third_party",
    revision: "commit-b",
    license: "GPL-3.0",
    runtime: "transformers",
    sizeBytes: 256,
    licenseRisk: "red"
  }
];

describe("StaticModelRegistry", () => {
  it("filters red-risk manifests unless explicitly requested", async () => {
    const registry = new StaticModelRegistry(manifests);

    expect((await registry.listManifests()).map((item) => item.id)).toEqual([
      "vendor/local-stt-small"
    ]);
    expect(
      (await registry.listManifests({ includeRedRisk: true })).map(
        (item) => item.id
      )
    ).toEqual(["vendor/local-stt-small", "vendor/unsafe-tts"]);
  });

  it("lists manifests by capability", async () => {
    const registry = new StaticModelRegistry(manifests);

    expect(
      (
        await registry.listManifests({
          capability: "speech_to_text"
        })
      ).map((item) => item.id)
    ).toEqual(["vendor/local-stt-small"]);
  });

  it("returns defensive manifest copies", async () => {
    const registry = new StaticModelRegistry(manifests);

    const first = await registry.getManifest("vendor/local-stt-small");
    if (first) {
      first.licenseRisk = "red";
    }

    expect(
      (await registry.getManifest("vendor/local-stt-small"))?.licenseRisk
    ).toBe("green");
  });
});

describe("recommended model candidates", () => {
  it("keeps audited candidates disabled for download until pinned", async () => {
    const registry = new StaticModelCandidateRegistry(
      recommendedModelCandidates
    );
    const candidates = await registry.listCandidates();

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) => !candidate.downloadEnabled)).toBe(
      true
    );
    expect(
      candidates.every((candidate) => candidate.audit.pinStatus === "pending_pin")
    ).toBe(true);
  });

  it("filters candidates by capability", async () => {
    const registry = new StaticModelCandidateRegistry(
      recommendedModelCandidates
    );

    expect(
      (await registry.listCandidates({ capability: "speech_to_text" })).map(
        (candidate) => candidate.id
      )
    ).toContain("openai/whisper-large-v3-turbo");
  });
});
