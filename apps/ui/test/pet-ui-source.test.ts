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
});
