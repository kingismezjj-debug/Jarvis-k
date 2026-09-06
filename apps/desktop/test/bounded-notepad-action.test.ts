import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));
import { launchBoundedNotepad } from "../src/bounded-notepad-action";

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); mocks.spawn.mockReset(); });
function setup(verified: boolean) {
  vi.stubEnv("SystemRoot", "C:\\Windows");
  mocks.spawn.mockImplementation((command: string) => {
    const child = Object.assign(new EventEmitter(), { pid: 321, unref: vi.fn(), kill: vi.fn(), stdout: new EventEmitter() });
    queueMicrotask(() => {
      if (command.endsWith("notepad.exe")) child.emit("spawn");
      else { child.stdout.emit("data", Buffer.from(`"notepad.exe","${verified ? 321 : 999}","Console"`)); child.emit("close"); }
    });
    return child;
  });
}
describe("fixed Notepad launcher with mocked OS process port", () => {
  it("uses fixed absolute executables, empty launch arguments and new-PID verification", async () => {
    setup(true);
    expect(await launchBoundedNotepad(new AbortController().signal)).toEqual({ app: "notepad", launched: true, verified: true, reason: "verified" });
    expect(mocks.spawn.mock.calls[0]).toEqual(["C:\\Windows\\System32\\notepad.exe", [], expect.objectContaining({ shell: false, env: { SystemRoot: "C:\\Windows", WINDIR: "C:\\Windows" } })]);
    expect(mocks.spawn.mock.calls[1]).toEqual(["C:\\Windows\\System32\\tasklist.exe", ["/FI", "PID eq 321", "/FI", "IMAGENAME eq notepad.exe", "/FO", "CSV", "/NH"], expect.objectContaining({ shell: false, windowsHide: true })]);
  });
  it("does not accept a previously running Notepad as verification of this launch", async () => {
    vi.useFakeTimers(); setup(false);
    const result = launchBoundedNotepad(new AbortController().signal);
    await vi.advanceTimersByTimeAsync(3000);
    expect(await result).toMatchObject({ launched: true, verified: false, reason: "not_verified" });
  });
  it("never spawns after pre-execution cancellation", async () => {
    setup(true); const controller = new AbortController(); controller.abort();
    expect(await launchBoundedNotepad(controller.signal)).toMatchObject({ launched: false, verified: false, reason: "cancelled" });
    expect(mocks.spawn).not.toHaveBeenCalled();
  });
});
