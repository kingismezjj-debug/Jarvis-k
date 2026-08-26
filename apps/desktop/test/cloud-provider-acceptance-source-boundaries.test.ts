import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("cloud provider acceptance source boundaries", () => {
  const serviceSource = readWorkspaceFile(
    "apps/desktop/src/cloud-provider-acceptance/cloud-provider-acceptance-service.ts",
  );
  const vaultSource = readWorkspaceFile(
    "apps/desktop/src/cloud-provider-acceptance/cloud-provider-credential-vault.ts",
  );
  const brokerSource = readWorkspaceFile(
    "apps/desktop/src/cloud-provider-acceptance/cloud-provider-credential-broker.ts",
  );
  const coreRuntimeSource = readWorkspaceFile("packages/core/src/runtime.ts");
  const preloadSource = readWorkspaceFile("apps/desktop/src/preload.ts");
  const mainSource = readWorkspaceFile("apps/desktop/src/main.ts");

  it("keeps acceptance out of product CoreRuntime routing", () => {
    expect(coreRuntimeSource).not.toContain("CloudProviderAcceptanceService");
    expect(coreRuntimeSource).not.toContain(
      "deepseek-v4-flash-advanced-brain-acceptance-v1",
    );
    expect(serviceSource).toContain("productRoutingEnabled: false");
    expect(serviceSource).toContain("executorReachable: false");
    expect(serviceSource).toContain("realNetworkRequestSent: false");
  });

  it("does not provide environment or CLI credential input paths", () => {
    expect(vaultSource).not.toContain("process.env");
    expect(vaultSource).not.toContain("argv");
    expect(serviceSource).not.toContain("process.env");
    expect(serviceSource).not.toContain("argv");
  });

  it("opens the real DeepSeek gate only from Desktop Main trusted development flags", () => {
    expect(mainSource).toContain("JARVIS_K_ENABLE_EVALUATION_UI");
    expect(mainSource).toContain(
      "JARVIS_K_ENABLE_CLOUD_PROVIDER_ACCEPTANCE_UI",
    );
    expect(mainSource).toContain("JARVIS_K_ENABLE_DEEPSEEK_REAL_ACCEPTANCE");
    expect(mainSource).toContain(
      'storageProfile.releaseChannel === "development"',
    );
    expect(mainSource).toContain(
      "realRunCapabilityEnabled: cloudProviderAcceptanceFlagEnabled",
    );
    expect(serviceSource).toContain("realAcceptanceCapabilityEnabled()");
    expect(serviceSource).toContain('this.options.releaseChannel === "development"');
    expect(serviceSource).not.toContain("JARVIS_K_ENABLE_DEEPSEEK_REAL_ACCEPTANCE");
  });

  it("keeps DeepSeek acceptance identity and profile fixed by trusted code", () => {
    expect(serviceSource).toContain("CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID");
    expect(serviceSource).toContain("CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID");
    expect(serviceSource).not.toContain("process.env.JARVIS_K_DEEPSEEK");
    expect(serviceSource).not.toContain("acceptanceVersion++");
    expect(serviceSource).not.toContain("rawInput.acceptanceId");
    expect(serviceSource).not.toContain("options.acceptanceId");
    expect(preloadSource).not.toContain("JARVIS_K_DEEPSEEK");
  });

  it("keeps plaintext credentials scoped to the broker closure", () => {
    expect(brokerSource).toContain("withCredential");
    expect(brokerSource).toContain('scheme: "bearer"');
    expect(brokerSource).not.toContain("console.");
    expect(serviceSource).not.toContain("console.");
  });

  it("keeps preload as a schema parsing bridge without filesystem or safeStorage", () => {
    expect(preloadSource).toContain("getCloudProviderAcceptanceStatus");
    expect(preloadSource).toContain("CloudProviderAcceptanceStatusSchema.parse");
    expect(preloadSource).not.toContain("safeStorage");
    expect(preloadSource).not.toContain("readFile");
    expect(preloadSource).not.toContain("writeFile");
  });
});
