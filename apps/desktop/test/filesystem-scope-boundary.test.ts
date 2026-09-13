import { describe, expect, it, vi } from "vitest";
import fsPromises from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createCommandEnvelope, filesystemScopeContext, TaskSchema } from "@jarvis-k/contracts";
import { FilesystemScopeBroker } from "../src/filesystem-scope-broker";
const native = vi.hoisted(() => ({ showOpenDialog: vi.fn(async () => ({ canceled: false, filePaths: ["Z:\\nonexistent-fixture"] })),
  owner: { isDestroyed: () => false } }));
vi.mock("electron", () => ({ dialog: { showOpenDialog: native.showOpenDialog }, BrowserWindow: { getFocusedWindow: () => native.owner } }));
describe("scope production boundary", () => {
  it("uses a native single-directory dialog with explicit scope/metadata disclosure", async () => {
    const task = TaskSchema.parse({ id: "task-native", title: "Scope", state: "awaiting_confirmation",
      createdAt: "2026-09-13T00:00:00.000Z", updatedAt: "2026-09-13T00:00:00.000Z",
      steps: [{ id: "step-native", taskId: "task-native", title: "Scope", state: "pending", verificationStatus: "not_applicable",
        toolId: "filesystem.search", toolInput: { query: "合同", maxResults: 20 } }] });
    const enumeration = vi.spyOn(fsPromises, "readdir");
    const directoryOpen = vi.spyOn(fsPromises, "opendir");
    const contentRead = vi.spyOn(fsPromises, "readFile");
    const httpRequest = vi.spyOn(http, "request");
    const httpsRequest = vi.spyOn(https, "request");
    const fetchRequest = vi.fn(() => { throw new Error("network forbidden"); });
    vi.stubGlobal("fetch", fetchRequest);
    const broker = new FilesystemScopeBroker(); broker.observeTasks([task]);
    const command = createCommandEnvelope({ type: "agent.approveTask", payload: { taskId: task.id, confirmation: "explicit_ui_confirmation" } });
    broker.observeCommand(command); const reply = vi.fn();
    await broker.handle({ kind: "filesystem-scope.request", context: filesystemScopeContext(task.id, command.commandId), arguments: { query: "合同", maxResults: 20 } }, reply);
    expect(native.showOpenDialog).toHaveBeenCalledWith(native.owner, expect.objectContaining({
      properties: ["openDirectory", "dontAddToRecent"], buttonLabel: "允许本次搜索",
      title: expect.stringContaining("文件名和相对位置会发送给当前模型"),
    }));
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({ resolution: "approved" }));
    expect(enumeration).not.toHaveBeenCalled(); expect(directoryOpen).not.toHaveBeenCalled();
    expect(contentRead).not.toHaveBeenCalled(); expect(httpRequest).not.toHaveBeenCalled();
    expect(httpsRequest).not.toHaveBeenCalled(); expect(fetchRequest).not.toHaveBeenCalled();
    vi.restoreAllMocks(); vi.unstubAllGlobals();
  });
  it("ships no test helper or traversal/provider dependency in the scope broker", () => {
    const root = path.resolve(import.meta.dirname, "../../..");
    const source = readFileSync(path.join(root, "apps/desktop/src/filesystem-scope-broker.ts"), "utf8");
    expect(source).not.toMatch(/from ["'](?:node:fs|.*(?:test|fixture|provider))/u);
    expect(source).not.toMatch(/(?:readdir|opendir|stat|realpath|fetch)\s*\(/u);
    const config = JSON.parse(readFileSync(path.join(root, "apps/desktop/tsconfig.build.json"), "utf8"));
    expect(config.include).not.toContain("test/**/*.ts");
    const packageConfig = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    expect(packageConfig.build.files).toContain("!**/test/**");
    expect(packageConfig.build.files).toContain("!**/tests/**");
    const adapter = readFileSync(path.join(root, "apps/core-host/src/brain-action-allowlist-adapter.ts"), "utf8");
    expect(adapter).not.toMatch(/defaultFilesystemSearchRoots|searchAllowedFilesystemRoots|readdir/);
  });
});
