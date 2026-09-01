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

  it("passes only safe Memory & Privacy projections into Settings V2", () => {
    const appSource = readUiSource("apps/ui/src/App.tsx");
    const settingsV2Start = appSource.indexOf("<SettingsV2GeneralView");
    const settingsV2End = appSource.indexOf("\n                />", settingsV2Start);
    expect(settingsV2Start).toBeGreaterThanOrEqual(0);
    expect(settingsV2End).toBeGreaterThan(settingsV2Start);
    const settingsV2Props = appSource.slice(settingsV2Start, settingsV2End);

    expect(settingsV2Props).toContain("memoryAlphaStatus={memoryAlphaStatus}");
    expect(settingsV2Props).toContain('setActiveView("memory")');
    for (const forbidden of [
      "refreshUserControlledMemories={",
      "deleteUserControlledMemory={",
      "probeMemoryAlphaRecall={",
      "exportMemorySnapshot={",
      "importMemorySnapshot={",
      "disableMemoryAlpha={",
    ]) {
      expect(settingsV2Props).not.toContain(forbidden);
    }
  });

  it("does not globally list saved memories before the Memory Center is opened", () => {
    const hookSource = readUiSource("apps/ui/src/hooks/use-jarvis.ts");
    const refreshEffectStart = hookSource.indexOf(
      "  const snapshotReady = snapshot !== null;",
    );
    const returnStart = hookSource.indexOf("  return {", refreshEffectStart);
    const refreshEffectSource = hookSource.slice(refreshEffectStart, returnStart);

    expect(refreshEffectSource).not.toContain("refreshUserControlledMemories();");
    expect(hookSource).toContain("refreshUserControlledMemories,");
    const appSource = readUiSource("apps/ui/src/App.tsx");
    expect(appSource).toContain('if (activeView === "memory" && coreOnline)');
    expect(appSource).toContain("void refreshUserControlledMemories();");
  });

  it("keeps the Settings V2 gate read-only in the Renderer hook", () => {
    const hookSource = readUiSource("apps/ui/src/hooks/use-ui-surface-mode.ts");
    expect(hookSource).toContain("getUiSurfaceCapabilityStatus");
    expect(hookSource).toContain("refreshUiSurfaceCapabilityStatus");
    expect(hookSource).toContain("onUiSurfaceCapabilityStatus");
    expect(hookSource).toContain("requestUiSurfaceSessionFallback");
    expect(hookSource).not.toContain("setItem(\"settingsV2");
    expect(hookSource).not.toContain("location.search");
    expect(hookSource).not.toContain("URLSearchParams");
  });

  it("keeps Settings V2 session rollback Main-owned and non-persistent", () => {
    const appSource = readUiSource("apps/ui/src/App.tsx");
    const viewSource = readUiSource(
      "apps/ui/src/features/settings-v2/settings-v2-general-view.tsx",
    );
    const hookSource = readUiSource("apps/ui/src/hooks/use-ui-surface-mode.ts");

    expect(viewSource).toContain("settings-v2-session-rollback");
    expect(viewSource).toContain("settings.shell.useClassic");
    expect(appSource).toContain("handleUseClassicSettings");
    expect(hookSource).toContain("use_classic_settings");
    expect(hookSource).not.toContain("localStorage.setItem");
    expect(hookSource).not.toContain("sessionStorage");
    expect(appSource).not.toContain("JARVIS_K_ENABLE_SETTINGS_V2");
  });

  it("does not expose internal Settings V2 fault controls in normal product source", () => {
    const appSource = readUiSource("apps/ui/src/App.tsx");
    const hookSource = readUiSource("apps/ui/src/hooks/use-ui-surface-mode.ts");
    const preloadSource = readUiSource("apps/desktop/src/preload.ts");
    const boundarySource = readUiSource(
      "apps/ui/src/features/settings-v2/settings-v2-surface-boundary.tsx",
    );
    const contractSource = readUiSource("packages/contracts/src/protocol.ts");

    expect(preloadSource).toContain("UiSurfaceCapabilityStatusSchema.parse");
    expect(preloadSource).toContain("UiSurfaceCapabilityStatusSchema.safeParse");
    expect(preloadSource).toContain("onUiSurfaceCapabilityStatus");
    for (const source of [appSource, hookSource, boundarySource, contractSource]) {
      expect(source).not.toContain("settingsV2InternalFaultMode");
      expect(source).not.toContain("settings_v2_render_failure");
      expect(source).not.toContain("settings_v2_mount_timeout");
      expect(source).not.toContain("--jarvis-internal-settings-v2-fault");
      expect(source).not.toContain("Controlled Settings V2 internal render failure");
      expect(source).not.toContain("SettingsV2InternalFaultTrigger");
    }
    expect(boundarySource).not.toContain("location.search");
    expect(boundarySource).not.toContain("localStorage");
    expect(boundarySource).not.toContain("sessionStorage");
    expect(hookSource).not.toContain("setSettingsV2InternalFaultMode");
  });

  it("keeps renderer failure recovery visible until Main pushes fallback", () => {
    const hookSource = readUiSource("apps/ui/src/hooks/use-ui-surface-mode.ts");
    expect(hookSource).toContain('if (report.state !== "failed")');
    expect(hookSource).toContain("setCapabilityStatus(status);");
    expect(hookSource).toContain("onUiSurfaceCapabilityStatus");
  });
});
