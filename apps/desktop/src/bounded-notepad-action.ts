import { spawn } from "node:child_process";
import path from "node:path";
import { LocalAppOpenResultSchema, type LocalAppOpenResult } from "@jarvis-k/contracts";

export type NotepadLauncher = (signal: AbortSignal) => Promise<LocalAppOpenResult>;
export function notepadResult(reason: LocalAppOpenResult["reason"], launched = false): LocalAppOpenResult {
  return LocalAppOpenResultSchema.parse({ app: "notepad", launched, verified: reason === "verified", reason });
}

// The caller supplies no executable, arguments, environment, or working directory.
export const launchBoundedNotepad: NotepadLauncher = async signal => {
  if (process.platform !== "win32" || signal.aborted) return notepadResult(signal.aborted ? "cancelled" : "blocked");
  const systemRoot = process.env.SystemRoot;
  if (!systemRoot || !/^[A-Za-z]:\\Windows$/i.test(systemRoot)) return notepadResult("blocked");
  const executable = path.join(systemRoot, "System32", "notepad.exe");
  const tasklist = path.join(systemRoot, "System32", "tasklist.exe");
  // No inherited provider or developer configuration reaches the external app.
  const env = { SystemRoot: systemRoot, WINDIR: systemRoot };
  if (signal.aborted) return notepadResult("cancelled");
  return new Promise(resolve => {
    let settled = false;
    let launched = false;
    const finish = (reason: LocalAppOpenResult["reason"]) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      resolve(notepadResult(reason, launched));
    };
    const abort = () => finish("cancelled");
    const timer = setTimeout(() => finish("timeout"), 4000);
    signal.addEventListener("abort", abort, { once: true });
    // Cancellation is checked synchronously at the final spawn boundary.
    if (signal.aborted) { finish("cancelled"); return; }
    const child = spawn(executable, [], { shell: false, detached: true, stdio: "ignore", windowsHide: false, env });
    launched = child.pid !== undefined;
    child.once("error", () => finish("launch_failed"));
    child.once("spawn", () => {
      launched = true;
      child.unref();
      const pid = child.pid;
      if (!pid || settled || signal.aborted) { finish("cancelled"); return; }
      const deadline = Date.now() + 2500;
      const verify = () => {
        if (settled || signal.aborted) { finish("cancelled"); return; }
        // Match the launched PID and image; a previously open window is insufficient.
        const probe = spawn(tasklist, ["/FI", `PID eq ${pid}`, "/FI", "IMAGENAME eq notepad.exe", "/FO", "CSV", "/NH"],
          { shell: false, windowsHide: true, stdio: ["ignore", "pipe", "ignore"], env });
        let output = "";
        let probeDone = false;
        const probeTimer = setTimeout(() => { probe.kill(); complete(false); }, 500);
        const complete = (ok: boolean) => {
          if (probeDone) return;
          probeDone = true;
          clearTimeout(probeTimer);
          if (settled) return;
          if (ok) finish("verified");
          else if (Date.now() >= deadline) finish("not_verified");
          else setTimeout(verify, 100);
        };
        probe.stdout?.on("data", (chunk: Buffer) => {
          output += chunk.toString("utf8");
          if (output.length > 8192) { probe.kill(); complete(false); }
        });
        probe.once("error", () => complete(false));
        probe.once("close", () => complete(new RegExp(`^"notepad\\.exe","${pid}"`, "im").test(output)));
      };
      verify();
    });
  });
};
