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
  "features/diagnostics/system-status-panel.tsx",
  "features/model-management/model-operation-list.tsx",
  "features/plugins/plugin-management-view.tsx",
  "features/plugins/plugin-projection-panel.tsx",
  "features/settings/chat-answer-settings-panel.tsx",
  "features/settings/command-router-settings-panel.tsx",
  "features/settings/settings-general-panel.tsx",
  "features/settings/voice-settings-panel.tsx",
  "features/memory/memory-boundary-panel.tsx",
  "features/memory/memory-center.tsx",
  "features/tasks/task-timeline.tsx",
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
    expect(appSource).toContain("} = useJarvis();");
    for (const relativePath of featureComponents) {
      expect(readSource(relativePath)).not.toContain("useJarvis()");
    }
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
});
