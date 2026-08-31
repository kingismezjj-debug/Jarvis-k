import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  BrainActionAllowlistAdapter,
  createExternalGuiLaunchEnvironment
} from "../src/brain-action-allowlist-adapter";

describe("BrainActionAllowlistAdapter", () => {
  it("removes Electron node-mode environment before launching external GUI apps", () => {
    const launchEnv = createExternalGuiLaunchEnvironment({
      ELECTRON_RUN_AS_NODE: "1",
      LOCALAPPDATA: "C:\\Users\\Example\\AppData\\Local"
    });

    expect(launchEnv.ELECTRON_RUN_AS_NODE).toBeUndefined();
    expect(launchEnv.LOCALAPPDATA).toBe("C:\\Users\\Example\\AppData\\Local");
  });

  it("opens allowlisted browser aliases without shell execution", async () => {
    const launches: Array<{ command: string; args: readonly string[] }> = [];
    const adapter = new BrainActionAllowlistAdapter({
      env: {},
      launch: async (command, args) => {
        launches.push({ command, args });
      }
    });

    const result = await adapter.openBrowser({ target: "GitHub" });

    expect(result).toMatchObject({
      status: "completed",
      reasonCode: "ALLOWLISTED_TARGET_OPENED",
      label: "github.com"
    });
    expect(launches).toEqual([
      {
        command: "explorer.exe",
        args: ["https://github.com/"]
      }
    ]);
  });

  it("opens configured IZYtoken admin browser alias only through a fixed safe HTTPS URL", async () => {
    const launches: Array<{ command: string; args: readonly string[] }> = [];
    const adapter = new BrainActionAllowlistAdapter({
      env: {
        JARVIS_K_IZYTOKEN_ADMIN_URL: "https://admin.example.com/console"
      },
      launch: async (command, args) => {
        launches.push({ command, args });
      }
    });

    const result = await adapter.openBrowser({ target: "IZYtoken admin" });

    expect(result).toMatchObject({
      status: "completed",
      reasonCode: "ALLOWLISTED_TARGET_OPENED",
      label: "admin.example.com",
      verificationStatus: "verified"
    });
    expect(launches).toEqual([
      {
        command: "explorer.exe",
        args: ["https://admin.example.com/console"]
      }
    ]);
  });

  it("blocks IZYtoken admin browser alias when the fixed safe URL is not configured", async () => {
    const launches: Array<{ command: string; args: readonly string[] }> = [];
    const adapter = new BrainActionAllowlistAdapter({
      env: {},
      launch: async (command, args) => {
        launches.push({ command, args });
      }
    });

    await expect(
      adapter.openBrowser({ target: "IZYtoken admin" })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "TARGET_NOT_ALLOWLISTED"
    });
    expect(launches).toEqual([]);
  });

  it("opens safe https browser URLs without shell execution", async () => {
    const launches: Array<{ command: string; args: readonly string[] }> = [];
    const adapter = new BrainActionAllowlistAdapter({
      launch: async (command, args) => {
        launches.push({ command, args });
      }
    });

    const result = await adapter.openBrowser({
      target: "https://example.com/docs?section=intro"
    });

    expect(result).toMatchObject({
      status: "completed",
      reasonCode: "ALLOWLISTED_TARGET_OPENED",
      label: "example.com",
      verificationStatus: "verified"
    });
    expect(launches).toEqual([
      {
        command: "explorer.exe",
        args: ["https://example.com/docs?section=intro"]
      }
    ]);
  });

  it("opens localhost http URLs only when developer mode allows them", async () => {
    const launches: Array<{ command: string; args: readonly string[] }> = [];
    const adapter = new BrainActionAllowlistAdapter({
      env: {
        JARVIS_K_BROWSER_OPEN_ALLOW_LOCALHOST_HTTP: "1"
      },
      launch: async (command, args) => {
        launches.push({ command, args });
      }
    });

    const result = await adapter.openBrowser({
      target: "http://localhost:5173/status"
    });

    expect(result).toMatchObject({
      status: "completed",
      reasonCode: "ALLOWLISTED_TARGET_OPENED",
      label: "localhost",
      verificationStatus: "verified"
    });
    expect(launches).toEqual([
      {
        command: "explorer.exe",
        args: ["http://localhost:5173/status"]
      }
    ]);
  });

  it("blocks unsafe browser targets", async () => {
    const launches: Array<{ command: string; args: readonly string[] }> = [];
    const adapter = new BrainActionAllowlistAdapter({
      launch: async (command, args) => {
        launches.push({ command, args });
      }
    });

    await expect(
      adapter.openBrowser({ target: "file:///C:/Windows/System32/cmd.exe" })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "TARGET_NOT_ALLOWLISTED"
    });
    await expect(
      adapter.openBrowser({ target: "http://example.com" })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "TARGET_NOT_ALLOWLISTED"
    });
    await expect(
      adapter.openBrowser({ target: "https://user:pass@example.com" })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "TARGET_NOT_ALLOWLISTED"
    });
    await expect(
      adapter.openBrowser({ target: "http://localhost:5173/status" })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "TARGET_NOT_ALLOWLISTED"
    });
    expect(launches).toEqual([]);
  });

  it("opens allowlisted built-in local applications", async () => {
    const launches: Array<{
      command: string;
      args: readonly string[];
      windowsHide: boolean;
    }> = [];
    const adapter = new BrainActionAllowlistAdapter({
      launch: async (command, args, options) => {
        launches.push({ command, args, windowsHide: options.windowsHide });
      }
    });

    const result = await adapter.openLocalApp({ target: "记事本" });

    expect(result).toMatchObject({
      status: "completed",
      reasonCode: "ALLOWLISTED_TARGET_OPENED",
      label: "notepad"
    });
    expect(launches).toEqual([
      {
        command: "notepad.exe",
        args: [],
        windowsHide: false
      }
    ]);
  });

  it("opens allowlisted installed applications only when the candidate path exists", async () => {
    const launches: Array<{ command: string; args: readonly string[] }> = [];
    const adapter = new BrainActionAllowlistAdapter({
      env: {
        ProgramFiles: "C:\\Program Files"
      },
      exists: (filePath) =>
        filePath ===
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      launch: async (command, args) => {
        launches.push({ command, args });
      }
    });

    const result = await adapter.openLocalApp({ target: "Chrome" });

    expect(result).toMatchObject({
      status: "completed",
      reasonCode: "ALLOWLISTED_TARGET_OPENED",
      label: "chrome"
    });
    expect(launches).toEqual([
      {
        command: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        args: []
      }
    ]);
  });

  it("opens VS Code only through a known candidate path and verifies the known process", async () => {
    const launches: Array<{ command: string; args: readonly string[] }> = [];
    const verifyCalls: string[] = [];
    const adapter = new BrainActionAllowlistAdapter({
      env: {
        LOCALAPPDATA: "C:\\Users\\Example\\AppData\\Local"
      },
      exists: (filePath) =>
        filePath ===
        "C:\\Users\\Example\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
      verifyLocalApp: async (label) => {
        verifyCalls.push(label);
        return label === "vscode";
      },
      launch: async (command, args) => {
        launches.push({ command, args });
      }
    });

    const result = await adapter.openLocalApp({ target: "vscode" });

    expect(result).toMatchObject({
      status: "completed",
      reasonCode: "ALLOWLISTED_TARGET_OPENED",
      label: "vscode",
      verificationStatus: "verified"
    });
    expect(verifyCalls).toEqual(["vscode"]);
    expect(launches).toEqual([
      {
        command:
          "C:\\Users\\Example\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        args: []
      }
    ]);
  });

  it("opens VS Code through the fixed x86 candidate path when present", async () => {
    const launches: Array<{ command: string; args: readonly string[] }> = [];
    const adapter = new BrainActionAllowlistAdapter({
      env: {
        "ProgramFiles(x86)": "C:\\Program Files (x86)"
      },
      exists: (filePath) =>
        filePath === "C:\\Program Files (x86)\\Microsoft VS Code\\Code.exe",
      verifyLocalApp: async (label) => label === "vscode",
      launch: async (command, args) => {
        launches.push({ command, args });
      }
    });

    const result = await adapter.openLocalApp({ target: "VS. Code" });

    expect(result).toMatchObject({
      status: "completed",
      reasonCode: "ALLOWLISTED_TARGET_OPENED",
      label: "vscode",
      verificationStatus: "verified"
    });
    expect(launches).toEqual([
      {
        command: "C:\\Program Files (x86)\\Microsoft VS Code\\Code.exe",
        args: []
      }
    ]);
  });

  it("blocks local applications that are not allowlisted or unavailable", async () => {
    const adapter = new BrainActionAllowlistAdapter({
      env: {},
      exists: () => false,
      launch: async () => {
        throw new Error("launch should not be called");
      }
    });

    await expect(
      adapter.openLocalApp({ target: "PowerShell" })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "TARGET_NOT_ALLOWLISTED"
    });
    await expect(adapter.openLocalApp({ target: "Chrome" })).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "TARGET_UNAVAILABLE"
    });
  });

  it("writes only bounded text into Notepad and reports verification", async () => {
    const writes: string[] = [];
    const adapter = new BrainActionAllowlistAdapter({
      writeNotepadText: async (text) => {
        writes.push(text);
        return true;
      }
    });

    await expect(
      adapter.writeNotepadText({
        target: "notepad",
        text: "Jarvis-K smoke text"
      })
    ).resolves.toMatchObject({
      status: "completed",
      reasonCode: "NOTEPAD_TEXT_WRITTEN",
      label: "notepad",
      verificationStatus: "verified",
      verificationSummary:
        "Notepad text write verification passed for 19 character(s)."
    });
    expect(writes).toEqual(["Jarvis-K smoke text"]);
  });

  it("blocks Notepad text writes for non-Notepad targets and invalid text", async () => {
    let writes = 0;
    const adapter = new BrainActionAllowlistAdapter({
      writeNotepadText: async () => {
        writes += 1;
        return true;
      }
    });

    await expect(
      adapter.writeNotepadText({
        target: "vscode",
        text: "Jarvis-K smoke text"
      })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "TARGET_NOT_ALLOWLISTED"
    });
    await expect(
      adapter.writeNotepadText({
        target: "notepad",
        text: "bad\ntext"
      })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "TARGET_INVALID"
    });
    expect(writes).toBe(0);
  });

  it("does not treat Notepad write invocation as verified when verification fails", async () => {
    const adapter = new BrainActionAllowlistAdapter({
      writeNotepadText: async () => false
    });

    await expect(
      adapter.writeNotepadText({
        target: "notepad",
        text: "Jarvis-K smoke text"
      })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "WRITE_FAILED",
      label: "notepad",
      verificationStatus: "verification_failed"
    });
  });

  it("controls only fixed known-app windows and reports verification", async () => {
    const calls: string[] = [];
    const adapter = new BrainActionAllowlistAdapter({
      controlKnownAppWindow: async (label, action) => {
        calls.push(`${label}:${action}`);
        return true;
      }
    });

    await expect(
      adapter.controlKnownAppWindow({
        target: "notepad",
        action: "minimize"
      })
    ).resolves.toMatchObject({
      status: "completed",
      reasonCode: "WINDOW_CONTROL_COMPLETED",
      label: "notepad",
      verificationStatus: "verified",
      verificationSummary: "notepad window minimize verification passed."
    });
    expect(calls).toEqual(["notepad:minimize"]);
  });

  it("blocks unknown window targets and invalid window actions", async () => {
    let calls = 0;
    const adapter = new BrainActionAllowlistAdapter({
      controlKnownAppWindow: async () => {
        calls += 1;
        return true;
      }
    });

    await expect(
      adapter.controlKnownAppWindow({
        target: "powershell",
        action: "focus"
      })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "TARGET_NOT_ALLOWLISTED"
    });
    await expect(
      adapter.controlKnownAppWindow({
        target: "notepad",
        action: "drag" as never
      })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "TARGET_NOT_ALLOWLISTED"
    });
    expect(calls).toBe(0);
  });

  it("does not treat window control invocation as verified when verification fails", async () => {
    const adapter = new BrainActionAllowlistAdapter({
      controlKnownAppWindow: async () => false
    });

    await expect(
      adapter.controlKnownAppWindow({
        target: "notepad",
        action: "restore"
      })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "WINDOW_CONTROL_FAILED",
      label: "notepad",
      verificationStatus: "verification_failed"
    });
  });

  it("searches only allowed filesystem roots and returns sanitized candidate evidence", async () => {
    const userProfile = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-fs-test-"));
    const desktop = path.join(userProfile, "Desktop");
    const documents = path.join(userProfile, "Documents");
    const downloads = path.join(userProfile, "Downloads");
    try {
      await mkdir(desktop, { recursive: true });
      await mkdir(documents, { recursive: true });
      await mkdir(downloads, { recursive: true });
      await writeFile(path.join(documents, "contract-alpha.txt"), "fixture");
      await writeFile(path.join(downloads, "notes.txt"), "fixture");
      const adapter = new BrainActionAllowlistAdapter({
        env: { USERPROFILE: userProfile },
        filesystemSearchRoots: [desktop, documents, downloads],
        exists: (filePath) =>
          [desktop, documents, downloads].includes(path.resolve(filePath))
      });

      const result = await adapter.searchFilesystem({ target: "contract" });

      expect(result).toMatchObject({
        status: "completed",
        reasonCode: "FILESYSTEM_SEARCH_COMPLETED",
        label: "filesystem",
        verificationStatus: "verified",
        matchCount: 1
      });
      expect(result.verificationSummary).toContain("contract-alpha.txt");
      expect(result.verificationSummary).not.toContain(userProfile);
    } finally {
      await rm(userProfile, { force: true, recursive: true });
    }
  });

  it("blocks filesystem search queries that look like paths or traversal", async () => {
    const userProfile = await mkdtemp(path.join(os.tmpdir(), "jarvis-k-fs-test-"));
    const documents = path.join(userProfile, "Documents");
    try {
      await mkdir(documents, { recursive: true });
      const adapter = new BrainActionAllowlistAdapter({
        env: { USERPROFILE: userProfile },
        filesystemSearchRoots: [documents],
        exists: (filePath) => path.resolve(filePath) === documents
      });

      await expect(
        adapter.searchFilesystem({ target: "..\\secret" })
      ).resolves.toMatchObject({
        status: "blocked",
        reasonCode: "TARGET_INVALID"
      });
      await expect(
        adapter.searchFilesystem({ target: "C:\\Users\\Administrator" })
      ).resolves.toMatchObject({
        status: "blocked",
        reasonCode: "TARGET_INVALID"
      });
    } finally {
      await rm(userProfile, { force: true, recursive: true });
    }
  });

  it("fails closed when Brain open actions are disabled", async () => {
    const adapter = new BrainActionAllowlistAdapter({
      disabled: true,
      launch: async () => {
        throw new Error("launch should not be called");
      }
    });

    await expect(adapter.openBrowser({ target: "GitHub" })).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "BRAIN_ACTIONS_DISABLED"
    });
    await expect(adapter.openLocalApp({ target: "notepad" })).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "BRAIN_ACTIONS_DISABLED"
    });
    await expect(
      adapter.searchFilesystem({ target: "contract" })
    ).resolves.toMatchObject({
      status: "blocked",
      reasonCode: "BRAIN_ACTIONS_DISABLED"
    });
  });
});
