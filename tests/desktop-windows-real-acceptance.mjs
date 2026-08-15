import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { requireRealWindowsExecution } from "./helpers/windows-real-execution-guard.mjs";

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(import.meta.dirname, "..");
const nodeBin = process.execPath;
const acceptance = requireRealWindowsExecution({
  scriptName: "acceptance:windows:real",
  argv: process.argv.slice(2),
  plannedActions: [
    { id: "text_open_notepad", software: ["Notepad"] },
    { id: "voice_open_notepad", software: ["Notepad"] },
    { id: "voice_corrected_known_app", software: ["VS Code"] },
    { id: "write_notepad_text", software: ["Notepad"] },
    { id: "open_vscode", software: ["VS Code"] },
    { id: "open_allowlisted_browser_url", software: ["default browser"] },
    { id: "search_local_file", software: [] },
    { id: "invoke_readonly_plugin", software: [] },
  ],
});

if (acceptance.dryRun) {
  process.exit(0);
}
if (acceptance.iterations !== 1) {
  console.error("REAL_WINDOWS_SINGLE_ACCEPTANCE_ITERATIONS_MUST_BE_1");
  process.exit(1);
}

const loops = [
  ["tests/desktop-task-runtime-notepad-smoke.mjs", "notepad"],
  ["tests/desktop-voice-task-runtime-notepad-smoke.mjs"],
  ["tests/desktop-voice-task-runtime-known-app-correction-smoke.mjs"],
  ["tests/desktop-task-runtime-notepad-write-smoke.mjs"],
  ["tests/desktop-task-runtime-notepad-smoke.mjs", "vscode"],
  ["tests/desktop-task-runtime-browser-open-smoke.mjs", "allowed"],
  ["tests/desktop-task-runtime-filesystem-search-smoke.mjs"],
  ["tests/desktop-plugin-local-template-runtime-smoke.mjs"],
];

for (let iteration = 1; iteration <= acceptance.iterations; iteration += 1) {
  for (const args of loops) {
    process.stdout.write(
      `[acceptance:windows:real] iteration ${iteration}/${acceptance.iterations} ${args.join(" ")}\n`,
    );
    await execFileAsync(nodeBin, args, {
      cwd: rootDirectory,
      env: process.env,
      timeout: 180_000,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8,
    });
  }
}
