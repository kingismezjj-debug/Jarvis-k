import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const candidateSdkImportPattern =
  /from\s+["'](?:ai|@ai-sdk\/[^"']+|openai|@anthropic-ai\/sdk|@google\/genai)["']|require\(["'](?:ai|@ai-sdk\/[^"']+|openai|@anthropic-ai\/sdk|@google\/genai)["']\)/u;

describe("cloud model protocol adapter source guards", () => {
  it("does not add candidate SDK runtime dependencies in package manifests", () => {
    const rootPackage = JSON.parse(readWorkspaceFile("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencies = {
      ...(rootPackage.dependencies ?? {}),
      ...(rootPackage.devDependencies ?? {}),
    };

    expect(dependencies).not.toHaveProperty("ai");
    expect(dependencies).not.toHaveProperty("@ai-sdk/openai-compatible");
    expect(dependencies).not.toHaveProperty("openai");
    expect(dependencies).not.toHaveProperty("@anthropic-ai/sdk");
    expect(dependencies).not.toHaveProperty("@google/genai");
  });

  it("keeps renderer and preload free of provider SDK imports", () => {
    for (const file of listSourceFiles(["apps/ui/src", "apps/desktop/src"])) {
      const source = readWorkspaceFile(file);
      if (file.endsWith("preload.ts") || file.startsWith("apps/ui/src/")) {
        expect(source).not.toMatch(candidateSdkImportPattern);
      }
    }
  });

  it("keeps product routing and core host from importing the isolated adapter spike", () => {
    for (const file of listSourceFiles(["packages/core/src", "apps/core-host/src"])) {
      expect(readWorkspaceFile(file)).not.toContain("cloud-model-protocol-adapter");
      expect(readWorkspaceFile(file)).not.toContain(
        "JarvisBoundedCloudModelProtocolAdapter",
      );
    }
  });

  it("keeps protocol adapters from depending on Planner, Plugin, Executor, fs, env, or telemetry", () => {
    const adapterSources = [
      "packages/capabilities/src/cloud-model-protocol-adapter.ts",
      "packages/inference-adapter-glm-runtime/src/advanced-brain-provider.ts",
      "packages/inference-adapter-deepseek-runtime/src/advanced-brain-provider.ts",
    ];
    for (const file of adapterSources) {
      const source = readWorkspaceFile(file);
      expect(source).not.toMatch(/from\s+["'][^"']*(planner|plugin|executor)[^"']*["']/iu);
      expect(source).not.toContain("process.env");
      expect(source).not.toMatch(/from\s+["']node:(fs|http|https)["']/u);
      expect(source).not.toMatch(/\btelemetry\b/iu);
      expect(source).not.toContain("ToolLoopAgent");
    }
  });

  it("forbids Vercel Gateway and real fetch in the isolated spike tests", () => {
    const spikeSources = [
      "packages/capabilities/src/cloud-model-protocol-adapter.ts",
      "packages/capabilities/test/cloud-model-protocol-adapter-conformance.test.ts",
    ];
    for (const file of spikeSources) {
      const source = readWorkspaceFile(file);
      expect(source).not.toMatch(/ai-gateway\.vercel|gateway\.ai\.vercel/iu);
      expect(source).not.toContain("globalThis.fetch");
      expect(source).not.toMatch(/\bfetch\(/u);
    }
  });
});

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function listSourceFiles(relativeRoots: readonly string[]): string[] {
  return relativeRoots.flatMap((relativeRoot) => {
    const absoluteRoot = path.join(root, relativeRoot);
    return walk(absoluteRoot).map((file) => path.relative(root, file).replace(/\\/gu, "/"));
  });
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolute = path.join(directory, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      return walk(absolute);
    }
    return absolute.endsWith(".ts") || absolute.endsWith(".tsx") ? [absolute] : [];
  });
}
