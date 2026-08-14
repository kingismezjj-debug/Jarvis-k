import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "index.ts"),
  "utf8"
);

describe("Core Host Command Router product mode wiring", () => {
  it("accepts only the deterministic rules product mode configuration", () => {
    expect(source).toContain("parseCommandRouterProductModeConfigurationMessage");
    expect(source).toContain('kind !== "command-router-product-mode.configure"');
    expect(source).toContain('message.providerId !== "intent-router.deterministic.rules"');
    expect(source).toContain('message.mode !== "production_rules"');
    expect(source).toContain("message.directActionEnabled !== false");
    expect(source).toContain("message.realQwenRuntimeEnabled !== false");
    expect(source).toContain("message.networkAccessApproved !== false");
  });

  it("configures Core runtime without enabling Qwen or execution providers", () => {
    expect(source).toContain("runtime.configureCommandRouterProductMode");
    expect(source).toContain('providerId: "intent-router.deterministic.rules"');
    expect(source).not.toContain(
      'kind: "command-router-product-mode.configure", configuration'
    );
    expect(source).not.toContain('message.mode === "fixture_only"');
  });
});
