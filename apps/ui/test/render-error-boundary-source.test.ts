import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const mainSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "main.tsx"),
  "utf8",
);
const boundarySource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "ErrorBoundary.tsx"),
  "utf8",
);

describe("renderer error boundary", () => {
  it("wraps the app root with a visible recovery panel", () => {
    expect(mainSource).toContain("ErrorBoundary");
    expect(mainSource).toContain("<ErrorBoundary>");
    expect(boundarySource).toContain('data-testid="render-error-boundary"');
    expect(boundarySource).toContain('data-testid="render-error-message"');
    expect(boundarySource).toContain("Renderer recovered");
  });
});
