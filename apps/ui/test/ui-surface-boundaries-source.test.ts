import { describe, expect, it } from "vitest";

import { readUiSource } from "./read-ui-source";

const appSource = readUiSource(["App.tsx"]);
const navigationSource = readUiSource(["app/app-navigation.tsx"]);
const voiceControlSource = readUiSource(["features/voice/voice-control-panel.tsx"]);
const useJarvisSource = readUiSource(["hooks/use-jarvis.ts"]);
const glmAcceptancePanelSource = readUiSource([
  "features/advanced-brain/glm-advanced-brain-acceptance-panel.tsx",
]);
const cloudAcceptancePanelSource = readUiSource([
  "features/advanced-brain/cloud-provider-acceptance-panel.tsx",
]);

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

  it("keeps GLM Advanced Brain acceptance behind Developer and Evaluation", () => {
    expect(appSource).toContain("<GlmAdvancedBrainAcceptancePanel");
    expect(appSource).toContain(
      'if (activeView === "developer" && evaluationSurfaceEnabled) {',
    );
    expect(useJarvisSource).not.toContain(
      "void refreshGlmAdvancedBrainAcceptanceStatus();",
    );
    expect(glmAcceptancePanelSource).toContain("acceptanceFlagEnabled");
    expect(glmAcceptancePanelSource).not.toContain("window.jarvis");
    expect(glmAcceptancePanelSource).not.toContain("ipcRenderer");
  });

  it("keeps Cloud Provider acceptance behind Developer, Evaluation, and Cloud gates", () => {
    expect(appSource).toContain("<CloudProviderAcceptancePanel");
    expect(appSource).toContain(
      "uiSurfaceMode.cloudProviderAcceptanceSurfaceEnabled ? (",
    );
    expect(useJarvisSource).toContain(
      "cloudProviderAcceptanceSurfaceEnabled",
    );
    expect(useJarvisSource).toContain(
      "window.jarvis.getCloudProviderAcceptanceStatus",
    );
    expect(cloudAcceptancePanelSource).toContain("DEEPSEEK");
    expect(cloudAcceptancePanelSource).toContain(
      "realNetworkRequestSent === false",
    );
    expect(cloudAcceptancePanelSource).toContain(
      "preflightResult.allowSingleRealAcceptance === true",
    );
    expect(cloudAcceptancePanelSource).toContain(
      'data-testid="cloud-provider-real-confirmation"',
    );
    expect(cloudAcceptancePanelSource).toContain(
      "Confirm and run one-time real diagnostic",
    );
    expect(cloudAcceptancePanelSource).not.toContain("window.jarvis");
    expect(cloudAcceptancePanelSource).not.toContain("ipcRenderer");
    expect(cloudAcceptancePanelSource).not.toContain("safeStorage");
    expect(cloudAcceptancePanelSource).not.toContain("readFile");
    expect(cloudAcceptancePanelSource).not.toContain("writeFile");
  });

  it("keeps Cloud Provider acceptance diagnostics free of prompts, keys, and raw response output", () => {
    expect(cloudAcceptancePanelSource).not.toContain("bodyJson");
    expect(cloudAcceptancePanelSource).not.toContain("responseJson");
    expect(cloudAcceptancePanelSource).not.toContain("credential.value");
    expect(cloudAcceptancePanelSource).not.toContain("raw response");
    expect(cloudAcceptancePanelSource).toContain("No real API request");
    expect(cloudAcceptancePanelSource).toContain("No user content");
  });

  it("keeps GLM acceptance diagnostics free of prompt, key, and raw body output", () => {
    expect(glmAcceptancePanelSource).not.toContain("response正文");
    expect(glmAcceptancePanelSource).not.toContain("raw HTTP");
    expect(glmAcceptancePanelSource).not.toContain("bodyJson");
    expect(glmAcceptancePanelSource).not.toContain("responseJson");
    expect(glmAcceptancePanelSource).not.toContain("credential.value");
  });

  it("does not let stale GLM acceptance preflight keep the run button enabled", () => {
    expect(glmAcceptancePanelSource).toContain(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID",
    );
    expect(glmAcceptancePanelSource).toContain(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION",
    );
    expect(glmAcceptancePanelSource).toContain(
      "preflightResult?.acceptanceId === GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID",
    );
    expect(glmAcceptancePanelSource).toContain(
      "status?.acceptanceId === GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID",
    );
    expect(glmAcceptancePanelSource).toContain(
      "preflightResult.allowSingleRealAcceptance === true",
    );
    expect(glmAcceptancePanelSource).toContain(
      "preflightResult.priorRealRequestCount === 0",
    );
    expect(glmAcceptancePanelSource).toContain(
      "preflightResult.realRequestAttempted === false",
    );
    expect(glmAcceptancePanelSource).toContain("status.acceptanceConsumed");
    expect(glmAcceptancePanelSource).toContain("Acceptance ID:");
    expect(glmAcceptancePanelSource).toContain("Acceptance version:");
    expect(glmAcceptancePanelSource).toContain("Requested timeout:");
    expect(glmAcceptancePanelSource).toContain("Effective timeout:");
    expect(glmAcceptancePanelSource).toContain("Timeout bounded:");
    expect(glmAcceptancePanelSource).not.toContain(
      "glm-advanced-brain-acceptance-fixed-request-v2",
    );
    expect(glmAcceptancePanelSource).not.toContain(
      "glm-advanced-brain-acceptance-fixed-request-v3",
    );
  });

  it("refreshes GLM acceptance status and preflight after diagnostic and credential changes", () => {
    expect(useJarvisSource).toContain(
      "refreshGlmAdvancedBrainAcceptancePreflightProjection",
    );
    expect(useJarvisSource).toContain(
      "window.jarvis.preflightGlmAdvancedBrainAcceptance(",
    );
    expect(useJarvisSource).toContain(
      "refreshGlmAdvancedBrainAcceptanceStatus(),",
    );
    expect(useJarvisSource).toContain(
      "refreshGlmAdvancedBrainAcceptancePreflightProjection(),",
    );
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
