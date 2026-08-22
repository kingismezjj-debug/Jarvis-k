import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appearanceSource = readFileSync(
  path.resolve(
    import.meta.dirname,
    "..",
    "src",
    "features",
    "appearance",
    "appearance-settings-panel.tsx",
  ),
  "utf8",
);
const appSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "App.tsx"),
  "utf8",
);

describe("Pet skin preview UI boundary", () => {
  it("keeps preview UI developer-gated and free of install or activation controls", () => {
    expect(appSource).toContain("showPetSkinPreview={developerModeEnabled}");
    expect(appearanceSource).toContain("Local Pet Skin Preview");
    for (const forbidden of [
      "Install",
      "Activate",
      "Set as default",
      "Marketplace",
      "Community",
    ]) {
      expect(appearanceSource).not.toContain(forbidden);
    }
  });

  it("does not let the appearance renderer read files, archives, paths, Electron, or Node", () => {
    for (const forbidden of [
      "node:fs",
      "node:path",
      "electron",
      "yauzl",
      "yazl",
      ".zip",
      "file://",
      "readFile",
      "showOpenDialog",
      "window.jarvis.",
    ]) {
      expect(appearanceSource).not.toContain(forbidden);
    }
    expect(appearanceSource).toContain("resource.resourceUrl");
  });
});
