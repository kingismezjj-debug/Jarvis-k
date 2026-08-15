import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "host", "host-message-schema.ts"),
  "utf8"
);
const controllerSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "index.ts"),
  "utf8"
);
const runtimeConfigurationControllerSource = readFileSync(
  path.resolve(
    import.meta.dirname,
    "..",
    "src",
    "host",
    "runtime-configuration-controller.ts"
  ),
  "utf8"
);

describe("Core Host Command Router product mode wiring", () => {
  it("accepts only the deterministic rules product mode configuration", () => {
    expect(schemaSource).toContain("parseCommandRouterProductModeConfigurationMessage");
    expect(schemaSource).toContain('kind !== "command-router-product-mode.configure"');
    expect(schemaSource).toContain('message.providerId !== "intent-router.deterministic.rules"');
    expect(schemaSource).toContain('message.mode !== "production_rules"');
    expect(schemaSource).toContain("message.directActionEnabled !== false");
    expect(schemaSource).toContain("message.realQwenRuntimeEnabled !== false");
    expect(schemaSource).toContain("message.networkAccessApproved !== false");
  });

  it("configures Core runtime without enabling Qwen or execution providers", () => {
    expect(controllerSource).toContain("RuntimeConfigurationController");
    expect(runtimeConfigurationControllerSource).toContain(
      "configureCommandRouterProductMode"
    );
    expect(runtimeConfigurationControllerSource).toContain(
      'providerId: "intent-router.deterministic.rules"'
    );
    expect(schemaSource).not.toContain(
      'kind: "command-router-product-mode.configure", configuration'
    );
    expect(schemaSource).not.toContain('message.mode === "fixture_only"');
  });
});
