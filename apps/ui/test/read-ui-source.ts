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
    "features/diagnostics/system-status-panel.tsx",
    "features/memory/memory-boundary-panel.tsx",
    "features/memory/memory-boundary-view-model.ts",
    "features/memory/memory-center.tsx",
    "features/model-management/model-operation-list.tsx",
    "features/plugins/plugin-management-view.tsx",
    "features/plugins/plugin-projection-panel.tsx",
    "features/settings/chat-answer-settings-panel.tsx",
    "features/settings/command-router-settings-panel.tsx",
    "features/settings/model-governance-settings-panel.tsx",
    "features/settings/settings-general-panel.tsx",
    "features/settings/voice-settings-panel.tsx",
    "features/tasks/task-timeline.tsx",
  ]);
}
