import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  createJarvisTokenCssVariables,
  flatJarvisDesignTokens,
  jarvisDesignTokens,
  jarvisTokenCategories,
  tokenPathToCssVariable,
} from "../src/design-system/tokens";
import {
  getJarvisStatusLabel,
  jarvisStatusDictionary,
  type JarvisStatusKey,
} from "../src/design-system/status-copy";

const designSystemDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "src",
  "design-system",
);

const requiredTokenPaths = [
  "color.background.canvas",
  "color.background.surface",
  "color.background.elevated",
  "color.background.subtle",
  "color.text.primary",
  "color.text.secondary",
  "color.text.muted",
  "color.text.inverse",
  "color.border.default",
  "color.border.subtle",
  "color.border.strong",
  "color.accent.default",
  "color.accent.hover",
  "color.accent.pressed",
  "color.accent.subtle",
  "color.focus.ring",
  "color.status.success",
  "color.status.warning",
  "color.status.danger",
  "color.status.info",
  "color.overlay.scrim",
  "typography.font.family.ui",
  "typography.font.family.mono",
  "typography.font.size.xs",
  "typography.font.size.sm",
  "typography.font.size.md",
  "typography.font.size.lg",
  "typography.font.size.xl",
  "typography.font.size.2xl",
  "typography.font.weight.regular",
  "typography.font.weight.medium",
  "typography.font.weight.semibold",
  "typography.font.weight.bold",
  "typography.lineHeight.compact",
  "typography.lineHeight.normal",
  "typography.lineHeight.relaxed",
  "typography.letterSpacing",
  "spacing.0",
  "spacing.1",
  "spacing.2",
  "spacing.3",
  "spacing.4",
  "spacing.6",
  "spacing.8",
  "spacing.10",
  "spacing.12",
  "spacing.16",
  "radius.none",
  "radius.sm",
  "radius.md",
  "radius.lg",
  "radius.full",
  "shadow.none",
  "shadow.surface",
  "shadow.elevated",
  "shadow.dialog",
  "motion.duration.fast",
  "motion.duration.normal",
  "motion.duration.slow",
  "motion.easing.standard",
  "motion.easing.enter",
  "motion.easing.exit",
  "layout.contentMaxWidth",
  "layout.navigationWidth",
  "layout.settingRowMinHeight",
  "layout.narrowBreakpoint",
  "layout.headerHeight",
  "layout.touchTargetMin",
  "density.comfortable.rowPaddingBlock",
  "density.compact.rowPaddingBlock",
  "identity.hudAccent",
  "identity.listening",
  "identity.thinking",
  "identity.acting",
  "identity.success",
  "identity.petState.idle",
  "identity.petState.listening",
  "identity.petState.thinking",
  "identity.petState.success",
  "identity.petState.error",
  "identity.petState.offline",
];

describe("Jarvis UI design tokens", () => {
  it("defines the required token categories and paths", () => {
    expect(jarvisTokenCategories).toEqual([
      "color",
      "typography",
      "spacing",
      "radius",
      "shadow",
      "motion",
      "layout",
      "density",
      "identity",
    ]);
    expect(Object.keys(flatJarvisDesignTokens).length).toBeGreaterThanOrEqual(
      86,
    );

    for (const tokenPath of requiredTokenPaths) {
      expect(flatJarvisDesignTokens[tokenPath]).toBeDefined();
    }
  });

  it("uses the approved system UI font stacks", () => {
    const uiFont = jarvisDesignTokens.typography.font.family.ui;
    const monoFont = jarvisDesignTokens.typography.font.family.mono;

    expect(uiFont).toContain("Segoe UI Variable");
    expect(uiFont).toContain("Segoe UI");
    expect(uiFont).toContain("Microsoft YaHei UI");
    expect(uiFont).toContain("Microsoft YaHei");
    expect(uiFont).toContain("PingFang SC");
    expect(uiFont).toContain("Noto Sans CJK SC");
    expect(monoFont).toContain("Cascadia Mono");
  });

  it("can project every token to a stable CSS variable name", () => {
    const variables = createJarvisTokenCssVariables();
    expect(variables[tokenPathToCssVariable("color.accent.default")]).toBe(
      jarvisDesignTokens.color.accent.default,
    );
    expect(Object.keys(variables)).toHaveLength(
      Object.keys(flatJarvisDesignTokens).length,
    );
  });

  it("keeps status keys separated from Product copy", () => {
    const keys = Object.keys(jarvisStatusDictionary) as JarvisStatusKey[];
    expect(keys).toEqual([
      "ready",
      "configured",
      "not_configured",
      "unavailable",
      "requires_setup",
      "disabled",
      "local_only",
      "read_only",
      "update_available",
    ]);
    expect(getJarvisStatusLabel({ key: "ready", locale: "zh-CN" })).toBe(
      "可直接使用",
    );
    expect(
      getJarvisStatusLabel({
        key: "ready",
        locale: "en",
        surface: "developer",
      }),
    ).toBe("ready");
  });

  it("keeps component CSS on Jarvis token variables and accessibility media queries", () => {
    const css = readFileSync(
      path.join(designSystemDirectory, "foundation.css"),
      "utf8",
    );

    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media (forced-colors: active)");
    expect(css).toContain("--jk-color-background-canvas");
    expect(css).toContain("--jk-layout-narrow-breakpoint");
  });

  it("maps Settings V2 foundation tokens for each trusted product theme", () => {
    const css = readFileSync(
      path.join(designSystemDirectory, "foundation.css"),
      "utf8",
    );

    for (const theme of ["signal", "harbor", "ember"]) {
      expect(css).toContain(`:root[data-jarvis-theme="${theme}"] .jk-theme`);
      expect(css).toContain(`.jk-theme[data-jarvis-theme="${theme}"]`);
    }
    for (const token of [
      "--jk-color-background-canvas",
      "--jk-color-background-surface",
      "--jk-color-background-elevated",
      "--jk-color-text-primary",
      "--jk-color-text-secondary",
      "--jk-color-border-default",
      "--jk-color-accent-default",
      "--jk-color-focus-ring",
      "--jk-color-overlay-scrim",
      "--jk-color-input-background",
      "--jk-color-navigation-background",
      "--jk-color-danger-surface",
    ]) {
      expect(css).toContain(token);
    }
    expect(css).toContain("--jk-color-background-canvas: #f6f8fb");
    expect(css).toContain("--jk-color-input-background: #e7edf5");
  });
});
