import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(import.meta.dirname, "../src");

function readSource(relativePath: string) {
  return readFileSync(path.join(sourceRoot, relativePath), "utf8");
}

const featureComponents = [
  "features/diagnostics/system-status-panel.tsx",
  "features/model-management/model-operation-list.tsx",
  "features/plugins/plugin-projection-panel.tsx",
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
      expect(source).not.toContain("Provider");
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
    const appSource = readSource("App.tsx");
    const projectionSource = readSource(
      "features/plugins/plugin-projection-panel.tsx",
    );

    expect(appSource).toContain('data-testid="plugin-card"');
    expect(appSource).toContain('data-testid="plugin-capability"');
    expect(appSource).toContain('data-testid="plugin-permission-status"');
    expect(projectionSource).toContain(
      'data-testid="plugin-management-state-summary"',
    );
    expect(projectionSource).toContain('data-testid="plugin-management-safety"');
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
});
