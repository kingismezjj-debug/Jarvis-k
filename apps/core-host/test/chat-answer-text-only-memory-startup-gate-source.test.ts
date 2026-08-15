import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const coreHostSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "index.ts"),
  "utf8"
);
const bootstrapSource = readFileSync(
  path.resolve(
    import.meta.dirname,
    "..",
    "src",
    "host",
    "core-host-bootstrap.ts"
  ),
  "utf8"
);

describe("Chat Answer text-only Memory startup gate", () => {
  it("does not construct or hydrate Memory when the text-only gate is active", () => {
    expect(coreHostSource).toContain("textOnlyAcceptanceMemoryDisabled");
    expect(coreHostSource).toContain(
      "sqliteMemoryRepository = textOnlyAcceptanceMemoryDisabled"
    );
    expect(coreHostSource).toContain("? undefined");
    expect(coreHostSource).toContain("memoryAlphaImplementation?.memoryRepository");
    expect(coreHostSource).toContain("memoryAlphaImplementation?.retrievalPort");
    expect(coreHostSource).toContain("memoryAlphaImplementation?.routingOptions");
    expect(coreHostSource).toContain("memoryAlphaImplementation?.session");
    expect(coreHostSource).toContain(
      "hydrateMemory: memoryAlphaImplementation !== undefined"
    );
    expect(bootstrapSource).toContain(
      "...(input.hydrateMemory ? [input.runtime.hydrateMemory()] : [])"
    );
  });
});
