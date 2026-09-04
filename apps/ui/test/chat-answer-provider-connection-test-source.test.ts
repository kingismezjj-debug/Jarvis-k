import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDirectory = path.resolve(import.meta.dirname, "../../..");

function readSource(relativePath: string): string {
  return readFileSync(path.join(rootDirectory, relativePath), "utf8");
}

function extractConnectionTestAction(source: string): string {
  const start = source.indexOf("const testChatAnswerProviderConnection = useCallback(");
  const end = source.indexOf("const setChatAnswerProviderConfigurationEnabled", start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("Chat Answer provider connection test UI source boundaries", () => {
  it("uses backend safe status as the product result instead of a generic action error", () => {
    const source = readSource(
      "apps/ui/src/hooks/use-jarvis-diagnostics-actions.ts",
    );
    const action = extractConnectionTestAction(source);

    expect(action).toContain("connectionTestAttemptId: attemptId");
    expect(action).toContain('connectionTestStatus: "testing"');
    expect(action).toContain(
      "parsedResult.status.connectionTestAttemptId !== attemptId",
    );
    expect(action).toContain("setChatAnswerProviderConfigurationStatus(parsedResult.status)");
    expect(action).toContain("setError(null)");
    expect(action).not.toContain("applyChatAnswerProviderConfigurationResult");
    expect(action).not.toContain("result.message ??");
  });

  it("keeps duplicate clicks and failed enablement gated by safe status", () => {
    const viewSource = readSource(
      "apps/ui/src/features/settings-v2/settings-v2-general-view.tsx",
    );

    expect(viewSource).toContain('answerConnectionTestStatus !== "testing"');
    expect(viewSource).toContain('answerConnectionTestStatus === "success"');
    expect(viewSource).toContain("disabled={!answerCanTest}");
    expect(viewSource).toContain("disabled={!answerCanToggle}");
  });
});
