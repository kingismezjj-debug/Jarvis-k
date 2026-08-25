import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..", "..", "..");
const transportSource = path.join(
  root,
  "packages",
  "capabilities",
  "src",
  "bounded-cloud-reasoning-transport.ts",
);

describe("Bounded cloud reasoning transport source boundaries", () => {
  it("does not import provider adapters, CoreRuntime, tasks, plugins, Electron, or Windows execution", () => {
    const source = fs.readFileSync(transportSource, "utf8");

    for (const forbidden of [
      "inference-adapter-openai",
      "inference-adapter-glm",
      "inference-adapter-qwen",
      "deepseek",
      "CoreRuntime",
      "TaskRepository",
      "PluginRuntime",
      "WindowsExecutor",
      "ActionExecutor",
      "electron",
      "node:",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it("keeps Renderer and Product default paths from directly importing the transport", () => {
    const uiSource = readTree(path.join(root, "apps", "ui", "src"));
    const coreSource = readTree(path.join(root, "packages", "core", "src"));
    const coreHostSource = readTree(path.join(root, "apps", "core-host", "src"));

    expect(uiSource).not.toContain("bounded-cloud-reasoning-transport");
    expect(uiSource).not.toContain("BoundedCloudReasoningTransport");
    expect(coreSource).not.toContain("bounded-cloud-reasoning-transport");
    expect(coreSource).not.toContain("BoundedCloudReasoningTransport");
    expect(coreHostSource).not.toContain("bounded-cloud-reasoning-transport");
    expect(coreHostSource).not.toContain("BoundedCloudReasoningTransport");
  });

  it("does not disable TLS, auto-follow redirects, or define proxy bypass behavior", () => {
    const source = fs.readFileSync(transportSource, "utf8");

    expect(source).not.toContain("NODE_TLS_REJECT_UNAUTHORIZED");
    expect(source).not.toContain("redirect: \"follow\"");
    expect(source).not.toContain("Proxy-Authorization");
    expect(source).not.toContain("proxy");
  });
});

function readTree(directory: string): string {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return readTree(entryPath);
      }
      return /\.(?:ts|tsx)$/u.test(entry.name)
        ? fs.readFileSync(entryPath, "utf8")
        : "";
    })
    .join("\n");
}
