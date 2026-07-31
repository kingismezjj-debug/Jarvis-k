import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "App.tsx"),
  "utf8"
);

describe("voice UI wiring", () => {
  it("keeps PTT enabled while voice commands are in flight", () => {
    expect(appSource).toContain(
      "const ptt = usePttCapture(sendCommand, coreOnline)"
    );
    expect(appSource).not.toContain("disabled={!coreOnline || sending}");
  });

  it("renders voice transcript text visibly", () => {
    expect(appSource).toContain('data-testid="voice-transcript"');
    expect(appSource).toContain("VOICE TRANSCRIPT");
  });

  it("renders microphone audio diagnostics visibly", () => {
    expect(appSource).toContain("VOICE FRAMES");
    expect(appSource).toContain("VOICE RMS");
    expect(appSource).toContain("VOICE PEAK");
  });
});
