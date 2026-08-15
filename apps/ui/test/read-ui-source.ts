import { readFileSync } from "node:fs";
import path from "node:path";

export function readUiSource(relativeFiles: string[]) {
  return relativeFiles
    .map((file) =>
      readFileSync(
        path.resolve(import.meta.dirname, "..", "src", ...file.split("/")),
        "utf8",
      ),
    )
    .join("\n");
}

export function readAppCompositionSource() {
  return readUiSource([
    "App.tsx",
    "app/copy.ts",
    "app/app-header.tsx",
    "app/app-navigation.tsx",
    "app/app-overlays.tsx",
    "app/app-shell.tsx",
    "app/create-app-view-models.ts",
    "app/formatters.ts",
    "app/memory-view.ts",
    "app/navigation.ts",
    "app/skin-themes.ts",
    "app/types.ts",
    "app/ui-language.ts",
    "app/use-plugin-center.ts",
    "app/use-user-controlled-memory-view.ts",
    "components/assistant-shell/NavigationButton.tsx",
    "components/shared/Metric.tsx",
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
    "features/conversation/types.ts",
    "features/diagnostics/system-status-panel.tsx",
    "features/memory/memory-boundary-panel.tsx",
    "features/memory/memory-boundary-view-model.ts",
    "features/memory/memory-center.tsx",
    "features/model-management/model-operation-list.tsx",
    "features/plugins/plugin-management-view.tsx",
    "features/plugins/plugin-projection-panel.tsx",
    "features/runtime-inspector/runtime-inspector-panel.tsx",
    "features/settings/chat-answer-settings-panel.tsx",
    "features/settings/command-router-settings-panel.tsx",
    "features/settings/model-governance-settings-panel.tsx",
    "features/settings/settings-general-panel.tsx",
    "features/settings/voice-settings-panel.tsx",
    "features/tasks/task-timeline.tsx",
    "features/voice/types.ts",
    "features/voice/voice-alias-confirmation.tsx",
    "features/voice/voice-capture-controls.tsx",
    "features/voice/voice-control-panel.tsx",
    "features/voice/voice-status.tsx",
    "features/voice/voice-transcript-panel.tsx",
    "features/voice/voice-view-model.ts",
  ]);
}
