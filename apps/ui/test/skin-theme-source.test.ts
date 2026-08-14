import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "App.tsx"),
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
    expect(appSource).toContain("readInitialSkinTheme");
  });

  it("projects the selected theme through static CSS variables", () => {
    expect(cssSource).toContain(':root[data-jarvis-theme="signal"]');
    expect(cssSource).toContain(':root[data-jarvis-theme="harbor"]');
    expect(cssSource).toContain(':root[data-jarvis-theme="ember"]');
    expect(cssSource).toContain("--background:");
    expect(cssSource).toContain("--primary:");
    expect(cssSource).toContain("--accent:");
  });

  it("does not expose executable skin package behavior", () => {
    expect(appSource).not.toContain(".jkskin");
    expect(appSource).not.toContain("importSkin");
    expect(appSource).not.toContain("installSkin");
    expect(appSource).not.toContain("eval(");
    expect(appSource).not.toContain("dangerouslySetInnerHTML");
    expect(cssSource).not.toContain("javascript:");
    expect(cssSource).not.toContain("iframe");
  });
});
