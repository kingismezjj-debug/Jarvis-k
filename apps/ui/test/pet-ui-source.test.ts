import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readPetSource(file: string) {
  return readFileSync(
    path.resolve(import.meta.dirname, "..", "src", "pet", file),
    "utf8",
  );
}

describe("Desktop Pet UI source", () => {
  it("keeps the Pet renderer isolated from the main app background styles", () => {
    const css = readPetSource("pet.css");

    expect(css).not.toContain('@import "../index.css"');
    expect(css).toContain("background: rgba(0, 0, 0, 0) !important");
    expect(css).toContain("cursor: grab");
    expect(css).not.toContain(".pet-hide");
    expect(css).not.toContain(".pet-drag-handle");
  });

  it("makes reduced motion visibly distinct without adding product commands", () => {
    const css = readPetSource("pet.css");
    const source = readPetSource("main.tsx");

    expect(source).toContain('data-motion={reducedMotion ? "reduced" : "normal"}');
    expect(source).toContain("onPointerMove=");
    expect(source).toContain("savePosition");
    expect(source).toContain("getPetSettings()");
    expect(css).toContain('.pet-shell[data-motion="reduced"]::after');
    expect(css).toContain("animation: none");
    expect(source).not.toContain("window.jarvis.");
  });

  it("defines local visual treatments for all formal Pet states", () => {
    const css = readPetSource("pet.css");
    const source = readPetSource("main.tsx");

    for (const layer of [
      "pet-robot",
      "pet-halo",
      "pet-ear",
      "pet-arm",
      "pet-antenna",
      "pet-face",
      "pet-eye",
      "pet-mouth",
      "pet-status-glyph",
    ]) {
      expect(source).toContain(layer);
      expect(css).toContain(`.${layer}`);
    }
    for (const state of [
      "idle",
      "listening",
      "thinking",
      "success",
      "error",
      "offline",
    ]) {
      expect(css).toContain(`data-state="${state}"`);
      expect(css).toContain(
        `.pet-shell[data-motion="reduced"][data-state="${state}"]`,
      );
    }
    expect(css).not.toContain("http://");
    expect(css).not.toContain("https://");
  });

  it("keeps the Pet bridge projection free of user-content fields", () => {
    const source = readPetSource("main.tsx");
    const css = readPetSource("pet.css");
    const combined = `${source}\n${css}`.toLowerCase();

    expect(source).toContain("window.jarvisPet");
    expect(source).not.toContain("window.jarvis.");
    expect(source).toContain("reportSkinRenderFailure");
    expect(source).toContain("activeSkinVisual");
    for (const forbiddenRuntime of [
      "node:fs",
      "node:path",
      "electron",
      "readFile",
      "writeFile",
      "showOpenDialog",
      "file://",
    ]) {
      expect(source).not.toContain(forbiddenRuntime);
    }
    for (const forbidden of [
      "transcript",
      "slots",
      "credential",
      "api key",
      "bearer",
      "password",
    ]) {
      expect(combined).not.toContain(forbidden);
    }
  });
});
