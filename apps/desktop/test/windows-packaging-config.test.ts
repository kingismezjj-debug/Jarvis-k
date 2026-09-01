import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDirectory = path.resolve(import.meta.dirname, "..", "..", "..");
const packageJson = JSON.parse(
  readFileSync(path.join(rootDirectory, "package.json"), "utf8"),
) as {
  version?: string;
  productName?: string;
  shortVersionWindows?: string;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  build?: {
    appId?: string;
    productName?: string;
    publish?: unknown;
    win?: {
      target?: Array<{ target?: string; arch?: string[] }>;
      forceCodeSigning?: boolean;
      signAndEditExecutable?: boolean;
      signExecutable?: boolean;
    };
    nsis?: {
      perMachine?: boolean;
      allowElevation?: boolean;
      runAfterFinish?: boolean;
      deleteAppDataOnUninstall?: boolean;
      include?: string;
    };
  };
};
const packageLock = JSON.parse(
  readFileSync(path.join(rootDirectory, "package-lock.json"), "utf8"),
) as { version?: string; packages?: Record<string, { version?: string }> };

describe("Windows Alpha packaging config", () => {
  it("keeps the Alpha product identity and installer scope fixed", () => {
    expect(packageJson.version).toBe("0.1.0-alpha.6");
    expect(packageLock.version).toBe("0.1.0-alpha.6");
    expect(packageLock.packages?.[""]?.version).toBe("0.1.0-alpha.6");
    expect(packageJson.productName).toBe("Jarvis-K Alpha");
    expect(packageJson.shortVersionWindows).toBe("0.1.0.6");
    expect(packageJson.build?.appId).toBe("com.jarvis-k.desktop.alpha");
    expect(packageJson.build?.productName).toBe("Jarvis-K Alpha");
    expect(packageJson.build?.win?.target).toEqual([
      { target: "nsis", arch: ["x64"] },
    ]);
    expect(packageJson.build?.nsis).toMatchObject({
      perMachine: false,
      allowElevation: false,
      runAfterFinish: false,
      deleteAppDataOnUninstall: false,
    });
  });

  it("edits Windows executable resources while remaining unsigned", () => {
    const electronRuntimeVersion = packageJson.devDependencies?.electron?.replace(
      /^[^\d]*/,
      "",
    );

    expect(electronRuntimeVersion).toBe("39.8.5");
    expect(packageJson.version).not.toBe(electronRuntimeVersion);
    expect(packageJson.build?.win?.forceCodeSigning).toBe(false);
    expect(packageJson.build?.win?.signExecutable).toBe(false);
    expect(packageJson.build?.win?.signAndEditExecutable).not.toBe(false);
  });

  it("does not publish or upload Alpha artifacts from local package scripts", () => {
    expect(packageJson.build?.publish).toBeUndefined();
    expect(packageJson.scripts?.["package:windows:alpha"]).toBe(
      "npm run build && electron-builder --win nsis --x64",
    );
    expect(packageJson.scripts?.["package:windows:alpha"]).not.toContain(
      "--publish",
    );
  });

  it("cleans only the Alpha login item identities on uninstall", () => {
    const installerPolicyScript = readFileSync(
      path.join(rootDirectory, "build", "nsis", "alpha-installer-policy.nsh"),
      "utf8",
    );

    expect(installerPolicyScript).toContain(
      'DeleteRegValue HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Run" "Jarvis-K Alpha"',
    );
    expect(installerPolicyScript).toContain(
      'DeleteRegValue HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Run" "com.jarvis-k.desktop.alpha"',
    );
    expect(installerPolicyScript).not.toMatch(/DeleteReg(Value|Key)\s+HKCU\s+".*Run"\s+"\*"/u);
    expect(installerPolicyScript).not.toContain('"com.jarvis-k.desktop"');
  });

  it("uses the Alpha installer policy include for downgrade prevention", () => {
    expect(packageJson.build?.nsis?.include).toBe(
      "build/nsis/alpha-installer-policy.nsh",
    );
    expect(
      existsSync(path.join(rootDirectory, "build", "nsis", "alpha-login-item-cleanup.nsh")),
    ).toBe(false);
    expect(
      existsSync(path.join(rootDirectory, "build", "nsis", "alpha-installer-policy.nsh")),
    ).toBe(true);
  });
});
