import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const hookSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "hooks", "use-ptt-capture.ts"),
  "utf8"
);

describe("usePttCapture source wiring", () => {
  it("keeps the capture coordinator stable across renderer refreshes", () => {
    expect(hookSource).toContain("const sendCommandRef = useRef(sendCommand)");
    expect(hookSource).toContain("sendCommandRef.current = sendCommand");
    expect(hookSource).toContain(
      "sendCommand: (command) => sendCommandRef.current(command)"
    );
    expect(hookSource).toContain("}, [])");
    expect(hookSource).not.toContain("}, [sendCommand])");
  });

  it("surfaces browser capture startup errors for microphone diagnosis", () => {
    expect(hookSource).toContain("createCaptureCommandError(error)");
    expect(hookSource).toContain("BROWSER_CAPTURE_START_FAILED");
  });
});
