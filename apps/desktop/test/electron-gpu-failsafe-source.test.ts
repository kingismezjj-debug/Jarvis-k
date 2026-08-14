import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const mainSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "main.ts"),
  "utf8",
);

describe("Electron GPU fail-safe", () => {
  it("keeps hardware acceleration disabled unless explicitly opted in", () => {
    expect(mainSource).toContain("JARVIS_K_ENABLE_ELECTRON_GPU");
    expect(mainSource).toContain("app.disableHardwareAcceleration()");
    expect(mainSource).toContain('app.commandLine.appendSwitch("disable-gpu")');
    expect(mainSource).toContain(
      'app.commandLine.appendSwitch("disable-gpu-compositing")',
    );
  });
});
