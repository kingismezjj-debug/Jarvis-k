import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { readAppCompositionSource } from "./read-ui-source";

const appSource = readAppCompositionSource();

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

const cssSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "index.css"),
  "utf8",
);

describe("skin theme source", () => {
  it("defines only the Phase 6 built-in themes", () => {
    expect(appSource).toContain('type SkinThemeId = "signal" | "harbor" | "ember"');
    expect(appSource).toContain('id: "signal"');
    expect(appSource).toContain('id: "harbor"');
    expect(appSource).toContain('id: "ember"');
    expect(appSource).toContain("builtInSkinThemeIds");
    expect(appSource).toContain("defaultSkinThemeId");
    expect(appSource).toContain("readLegacySkinThemePreference");
    expect(appSource).toContain("migrateLegacyDesktopUiTheme");
    expect(appSource).not.toContain("readInitialSkinTheme");
    expect(appSource).not.toContain("THEME_STORAGE_KEY");
    expect(appSource).not.toContain("localStorage.setItem(\"jarvis-k-ui-theme\"");
  });

  it("projects the selected theme through static CSS variables", () => {
    expect(cssSource).toContain(':root[data-jarvis-theme="signal"]');
    expect(cssSource).toContain(':root[data-jarvis-theme="harbor"]');
    expect(cssSource).toContain(':root[data-jarvis-theme="ember"]');
    expect(cssSource).toContain("--background:");
    expect(cssSource).toContain("--primary:");
    expect(cssSource).toContain("--accent:");
  });

  it("does not expose executable or remote skin package behavior", () => {
    expect(appSource).toContain("Local Pet Skin Preview");
    expect(appearanceSource).toContain("Pet Skin Studio");
    expect(appSource).not.toContain("importSkin");
    expect(appSource).not.toContain("Set as default");
    expect(appearanceSource).not.toContain("Marketplace");
    expect(appearanceSource).not.toContain("Community");
    expect(appearanceSource).not.toContain("Upload");
    expect(appSource).not.toContain("eval(");
    expect(appSource).not.toContain("dangerouslySetInnerHTML");
    expect(cssSource).not.toContain("javascript:");
    expect(cssSource).not.toContain("iframe");
  });
});
