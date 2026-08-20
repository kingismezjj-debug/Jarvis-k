import { describe, expect, it } from "vitest";

import { readUiSource } from "./read-ui-source";

const appSource = readUiSource(["App.tsx"]);
const navigationSource = readUiSource(["app/app-navigation.tsx"]);
const voiceControlSource = readUiSource(["features/voice/voice-control-panel.tsx"]);
const useJarvisSource = readUiSource(["hooks/use-jarvis.ts"]);

describe("product/developer/evaluation UI boundaries", () => {
  it("keeps Developer navigation hidden until Developer Mode is enabled", () => {
    expect(appSource).toContain('item.id === "developer" && !developerModeEnabled');
    expect(navigationSource).toContain("showInspectorToggle");
    expect(navigationSource).toContain('data-testid="toggle-inspector"');
  });

  it("does not mount Runtime Inspector in the product surface", () => {
    expect(appSource).toContain("developerModeEnabled && inspectorOpen");
    expect(appSource).toContain("<RuntimeInspectorPanel");
    expect(appSource).toContain("setInspectorOpen(false)");
  });

  it("keeps Voice Regression behind the evaluation surface", () => {
    expect(voiceControlSource).toContain("viewModel.regressionVisible");
    expect(appSource).toContain("evaluationSurfaceEnabled ? (");
    expect(appSource).toContain("<VoiceRegressionPanel");
    expect(appSource).toContain("regressionVisible: false");
  });

  it("does not refresh evaluation records when the surface is hidden", () => {
    expect(useJarvisSource).toContain("evaluationSurfaceEnabled");
    expect(useJarvisSource).toContain("if (!evaluationSurfaceEnabled)");
    expect(useJarvisSource).toContain(
      "if (evaluationSurfaceEnabled) {\n        void refreshVoiceRegressionCollectionStatus();",
    );
  });

  it("keeps plugin developer projections out of the product plugin refresh", () => {
    expect(appSource).toContain("developerModeEnabled\n    ? localPluginManifestDeveloperStatus\n    : null");
    expect(appSource).toContain("if (!developerModeEnabled) {\n                          return pluginsOk;");
  });
});
