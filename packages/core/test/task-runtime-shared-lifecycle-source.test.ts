import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const runtimeSource = readFileSync(
  path.join(process.cwd(), "packages", "core", "src", "runtime.ts"),
  "utf8",
);

const taskRuntimeDispatchers = [
  "dispatchTaskRuntimePluginInvoke",
  "dispatchTaskRuntimeFilesystemSearch",
  "dispatchTaskRuntimeNotepadWriteText",
  "dispatchTaskRuntimeWindowControl",
  "dispatchTaskRuntimeBrowserOpen",
  "dispatchTaskRuntimeKnownAppOpen",
] as const;

describe("Task Runtime shared lifecycle integration", () => {
  it("routes Task Runtime dispatchers through the shared lifecycle service facade", () => {
    for (const dispatcher of taskRuntimeDispatchers) {
      const body = functionBody(dispatcher);

      expect(body, dispatcher).toContain("taskDispatch.createQueuedTask");
      expect(body, dispatcher).toContain("taskDispatch.markRunning");
      expect(body, dispatcher).toContain("taskDispatch.completeVerification");
      expect(body, dispatcher).not.toContain("repository.createTask");
      expect(body, dispatcher).not.toContain("repository.createStep");
      expect(body, dispatcher).not.toContain("repository.createEvent");
      expect(body, dispatcher).not.toContain("repository.updateTask");
      expect(body, dispatcher).not.toContain("repository.updateStep");
    }
  });
});

function functionBody(name: string): string {
  const start = runtimeSource.indexOf(`private async ${name}`);
  expect(start, `${name} is present`).toBeGreaterThanOrEqual(0);
  const next = runtimeSource.indexOf("\n  private ", start + 1);
  expect(next, `${name} has a bounded body`).toBeGreaterThan(start);
  return runtimeSource.slice(start, next);
}
