import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDirectory = path.resolve(import.meta.dirname, "..", "..", "..");

function readUiSource(relativePath: string): string {
  return readFileSync(path.join(rootDirectory, relativePath), "utf8");
}

describe("Settings V2 real entry source boundaries", () => {
  it("refreshes Main-owned capability when the real Settings view is selected", () => {
    const appSource = readUiSource("apps/ui/src/App.tsx");
    expect(appSource).toContain('if (activeView === "settings")');
    expect(appSource).toContain("refreshUiSurfaceCapabilityStatus");
    expect(appSource).toContain("refreshModelGovernance");
    expect(appSource).toContain("refreshCommandRouterProductModeStatus");
    expect(appSource).toContain("refreshChatAnswerProductModeStatus");
    expect(appSource).not.toContain("JARVIS_K_ENABLE_SETTINGS_V2");
  });

  it("passes existing model projections into the real Settings V2 surface", () => {
    const appSource = readUiSource("apps/ui/src/App.tsx");
    expect(appSource).toContain("commandRouterProductModeStatus={commandRouterProductModeStatus}");
    expect(appSource).toContain("chatAnswerProductModeStatus={chatAnswerProductModeStatus}");
    expect(appSource).toContain("inferenceProviders={inferenceProviders}");
    expect(appSource).toContain("modelInventory={modelInventory}");
    expect(appSource).toContain("modelOperations={modelOperations}");
    expect(appSource).toContain("resourceDiagnostics={resourceDiagnostics}");
    expect(appSource).toContain('setActiveView("tasks")');
    expect(appSource).not.toContain("runFixtureEmbeddingProbe={");
    expect(appSource).not.toContain("runFixtureIntentProbe={");
  });

  it("keeps the Settings V2 gate read-only in the Renderer hook", () => {
    const hookSource = readUiSource("apps/ui/src/hooks/use-ui-surface-mode.ts");
    expect(hookSource).toContain("getUiSurfaceCapabilityStatus");
    expect(hookSource).toContain("refreshUiSurfaceCapabilityStatus");
    expect(hookSource).not.toContain("setItem(\"settingsV2");
    expect(hookSource).not.toContain("location.search");
    expect(hookSource).not.toContain("URLSearchParams");
  });
});
