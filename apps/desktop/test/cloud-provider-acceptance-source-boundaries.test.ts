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
