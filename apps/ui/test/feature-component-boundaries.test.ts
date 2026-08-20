import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(import.meta.dirname, "../src");

function readSource(relativePath: string) {
  return readFileSync(path.join(sourceRoot, relativePath), "utf8");
}

const featureComponents = [
  "features/activity/activity-view.tsx",
  "features/appearance/appearance-settings-panel.tsx",
  "features/conversation/brain-dispatch-panel.tsx",
  "features/conversation/conversation-composer.tsx",
  "features/conversation/conversation-header.tsx",
  "features/conversation/conversation-message.tsx",
  "features/conversation/conversation-message-list.tsx",
  "features/conversation/conversation-panel.tsx",
  "features/conversation/conversation-status.tsx",
  "features/conversation/conversation-tabs.tsx",
  "features/diagnostics/system-status-panel.tsx",
  "features/model-management/model-operation-list.tsx",
  "features/plugins/plugin-management-view.tsx",
  "features/plugins/plugin-projection-panel.tsx",
  "features/runtime-inspector/runtime-inspector-panel.tsx",
  "features/settings/chat-answer-settings-panel.tsx",
  "features/settings/command-router-settings-panel.tsx",
  "features/settings/model-governance-settings-panel.tsx",
  "features/settings/settings-general-panel.tsx",
  "features/settings/voice-settings-panel.tsx",
  "features/memory/memory-boundary-panel.tsx",
  "features/memory/memory-center.tsx",
  "features/tasks/task-timeline.tsx",
  "features/voice/voice-alias-confirmation.tsx",
  "features/voice/voice-capture-controls.tsx",
  "features/voice/voice-control-panel.tsx",
  "features/voice/voice-status.tsx",
  "features/voice/voice-transcript-panel.tsx",
];

describe("UI feature component boundaries", () => {
  it.each(featureComponents)(
    "%s stays presentation-only and does not acquire runtime ownership",
    (relativePath) => {
      const source = readSource(relativePath);

      expect(source).not.toContain("useJarvis");
      expect(source).not.toContain("window.jarvis");
      expect(source).not.toContain("electron");
      expect(source).not.toContain("ipcRenderer");
      expect(source).not.toContain("Repository");
      expect(source).not.toMatch(/new\s+\w*Provider/);
      expect(source).not.toContain("ProviderRegistry");
    },
  );

  it("keeps App as the only owner of useJarvis state", () => {
    const appSource = readSource("App.tsx");

    expect(appSource).toContain("const {");
    expect(appSource).toContain("} = useJarvis({");
    expect(appSource).toContain(
      "evaluationSurfaceEnabled: uiSurfaceMode.evaluationSurfaceEnabled",
    );
    for (const relativePath of featureComponents) {
      expect(readSource(relativePath)).not.toContain("useJarvis()");
    }
  });

  it("keeps conversation rendering behind extracted feature components", () => {
    const appSource = readSource("App.tsx");
    const panelSource = readSource("features/conversation/conversation-panel.tsx");
    const listSource = readSource(
      "features/conversation/conversation-message-list.tsx",
    );
    const composerSource = readSource(
      "features/conversation/conversation-composer.tsx",
    );
    const messageSource = readSource(
      "features/conversation/conversation-message.tsx",
    );

    expect(appSource).toContain("<ConversationPanel");
    expect(appSource).toContain("<ConversationComposer");
    expect(appSource).toContain("<ConversationTabs");
    expect(appSource).not.toContain('data-testid="brain-dispatch-panel"');
    expect(appSource).not.toContain('data-testid="message-list"');
    expect(appSource).not.toContain('data-testid="voice-transcript-panel"');
    expect(appSource).not.toContain('data-testid="command-input"');

    expect(panelSource).toContain("ConversationMessageList");
    expect(listSource).toContain('data-testid="message-list"');
    expect(composerSource).toContain('data-testid="command-input"');
    expect(composerSource).toContain('data-testid="send-command"');
    expect(messageSource).not.toContain("dangerouslySetInnerHTML");
  });

  it("keeps conversation feature passive and delegated to App actions", () => {
    const sources = [
      readSource("features/conversation/brain-dispatch-panel.tsx"),
      readSource("features/conversation/conversation-composer.tsx"),
      readSource("features/conversation/conversation-message-list.tsx"),
      readSource("features/conversation/conversation-status.tsx"),
      readSource("features/conversation/conversation-tabs.tsx"),
    ].join("\n");

    expect(sources).not.toContain("runBrainCommand");
    expect(sources).not.toContain("sendCommand(");
    expect(sources).not.toContain("setDraft");
    expect(sources).not.toContain("useState");
    expect(sources).not.toContain("useEffect");
    expect(sources).not.toContain("setTimeout");
    expect(sources).not.toContain("requestAnimationFrame");
    expect(sources).not.toContain("apiKey");
    expect(sources).not.toContain("secret");
    expect(sources).not.toContain("stack");
  });

  it("keeps critical task timeline status and action test ids", () => {
    const source = readSource("features/tasks/task-timeline.tsx");

    expect(source).toContain('data-testid="task-card"');
    expect(source).toContain('data-testid="task-step"');
    expect(source).toContain('data-testid="task-event"');
    expect(source).toContain('data-testid="task-approve"');
    expect(source).toContain('data-testid="task-cancel"');
    expect(source).toContain("verificationSummary");
    expect(source).toContain("verificationStatus");
  });

  it("keeps plugin safety, permission, and local manifest test ids", () => {
    const managementSource = readSource(
      "features/plugins/plugin-management-view.tsx",
    );
    const projectionSource = readSource(
      "features/plugins/plugin-projection-panel.tsx",
    );

    expect(managementSource).toContain('data-testid="plugin-card"');
    expect(managementSource).toContain('data-testid="plugin-capability"');
    expect(managementSource).toContain(
      'data-testid="plugin-permission-status"',
    );
    expect(projectionSource).toContain(
      'data-testid="plugin-management-state-summary"',
    );
    expect(projectionSource).toContain(
      'data-testid="plugin-management-safety"',
    );
    expect(projectionSource).toContain(
      'data-testid="plugin-mcp-adapter-status"',
    );
    expect(projectionSource).toContain(
      'data-testid="local-plugin-manifest-developer-status"',
    );
  });

  it("keeps user memory visibility, delete, and sanitized snapshot test ids", () => {
    const source = readSource("features/memory/memory-center.tsx");

    expect(source).toContain('data-testid="user-controlled-memory-list"');
    expect(source).toContain('data-testid="user-controlled-memory-record"');
    expect(source).toContain('data-testid="user-controlled-memory-delete"');
    expect(source).toContain(
      'data-testid="user-controlled-memory-sanitized-snapshot-json"',
    );
    expect(source).toContain("RAW_HIDDEN");
    expect(source).toContain("PROVIDER_NEUTRAL");
  });

  it("keeps memory boundary rendering passive", () => {
    const source = readSource("features/memory/memory-boundary-panel.tsx");
    const viewModelSource = readSource(
      "features/memory/memory-boundary-view-model.ts",
    );

    expect(source).toContain('data-testid="user-controlled-memory-boundary"');
    expect(source).not.toContain("onClick");
    expect(source).not.toContain("useEffect");
    expect(viewModelSource).toContain("buildMemoryBoundaryViewModel");
    expect(viewModelSource).not.toContain("window.jarvis");
    expect(viewModelSource).not.toContain("ipcRenderer");
  });

  it("keeps command router settings actions delegated to App", () => {
    const source = readSource(
      "features/settings/command-router-settings-panel.tsx",
    );

    expect(source).toContain(
      'data-testid="settings-command-router-product-mode-toggle"',
    );
    expect(source).toContain(
      'data-testid="settings-command-router-qwen-runtime-control"',
    );
    expect(source).not.toContain("setCommandRouterProductModeEnabled");
    expect(source).not.toContain("setQwenRuntimeControlAction");
  });

  it("keeps chat answer settings credential-safe and action-delegated", () => {
    const source = readSource(
      "features/settings/chat-answer-settings-panel.tsx",
    );

    expect(source).toContain(
      'data-testid="settings-chat-answer-product-mode-toggle"',
    );
    expect(source).toContain(
      'data-testid="settings-chat-answer-product-mode-notice"',
    );
    expect(source).not.toContain("setChatAnswerProductModeEnabled");
    expect(source).not.toContain("apiKey");
    expect(source).not.toContain("secret");
    expect(source).not.toContain("healthCheck");
  });

  it("keeps voice settings passive until user action", () => {
    const source = readSource("features/settings/voice-settings-panel.tsx");

    expect(source).toContain('data-testid="settings-open-voice-settings"');
    expect(source).toContain('data-testid="settings-open-tts-settings"');
    expect(source).not.toContain("usePttCapture");
    expect(source).not.toContain("getUserMedia");
    expect(source).not.toContain("startListening");
    expect(source).not.toContain("openVoiceSettings(");
    expect(source).not.toContain("openTtsSettings(");
  });

  it("keeps the voice control panel passive and delegated to App actions", () => {
    const appSource = readSource("App.tsx");
    const voiceControlSource = readSource("features/voice/voice-control-panel.tsx");
    const voiceSources = [
      readSource("features/voice/voice-alias-confirmation.tsx"),
      readSource("features/voice/voice-capture-controls.tsx"),
      voiceControlSource,
      readSource("features/voice/voice-status.tsx"),
      readSource("features/voice/voice-transcript-panel.tsx"),
      readSource("features/voice/voice-view-model.ts"),
    ].join("\n");

    expect(appSource).toContain("<VoiceControlPanel");
    expect(appSource).toContain("const ptt = usePttCapture");
    expect(appSource).toContain("startCapture: () =>");
    expect(appSource).toContain("stopCapture: (reason) =>");
    expect(appSource).toContain("removeVoiceAlias: (aliasId)");
    expect(appSource).toContain("removeRouteAlias: (aliasId)");
    expect(voiceControlSource).toContain("viewModel.regressionVisible");
    expect(voiceControlSource).toContain(
      "clearRegressionPendingSamples:\n                  actions.clearRegressionPendingSamples",
    );
    expect(voiceControlSource).toContain(
      "discardRegressionPendingSample:\n                  actions.discardRegressionPendingSample",
    );
    expect(voiceControlSource).toContain(
      "saveRegressionPendingSample: actions.saveRegressionPendingSample",
    );

    expect(voiceSources).not.toContain("usePttCapture");
    expect(voiceSources).not.toContain("window.jarvis");
    expect(voiceSources).not.toContain("navigator.mediaDevices");
    expect(voiceSources).not.toContain("getUserMedia");
    expect(voiceSources).not.toContain("speechSynthesis");
    expect(voiceSources).not.toContain("sendCommand(");
    expect(voiceSources).not.toContain("confirmVoiceCommandCorrection");
    expect(voiceSources).not.toContain("confirmUserRouteAlias");
    expect(voiceSources).not.toContain("useEffect");
  });

  it("keeps model governance settings display-only on mount", () => {
    const source = readSource(
      "features/settings/model-governance-settings-panel.tsx",
    );

    expect(source).toContain('data-testid="settings-refresh-model-governance"');
    expect(source).not.toContain("installModel");
    expect(source).not.toContain("loadModel");
    expect(source).not.toContain("acquireLease");
    expect(source).not.toContain("refreshModelGovernance");
  });

  it("keeps runtime inspector probe and refresh actions user-triggered", () => {
    const source = readSource(
      "features/runtime-inspector/runtime-inspector-panel.tsx",
    );

    expect(source).toContain('data-testid="runtime-inspector"');
    expect(source).toContain('data-testid="refresh-model-governance"');
    expect(source).toContain('data-testid="run-memory-alpha-probe"');
    expect(source).not.toContain("useEffect");
    expect(source).not.toContain("probeCore(");
    expect(source).not.toContain("refreshModelGovernance(");
    expect(source).not.toContain("handleRunFixture");
  });
});
