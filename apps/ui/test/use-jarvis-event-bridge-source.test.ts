import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const bridgeSource = readFileSync(
  path.resolve(
    import.meta.dirname,
    "..",
    "src",
    "hooks",
    "use-jarvis-event-bridge.ts",
  ),
  "utf8",
);
const hookSource = readFileSync(
  path.resolve(import.meta.dirname, "..", "src", "hooks", "use-jarvis.ts"),
  "utf8",
);

describe("useJarvis event bridge source", () => {
  it("owns the only global Jarvis event subscription boundary", () => {
    expect(bridgeSource.match(/window\.jarvis\?\.onEvent\(/g) ?? []).toHaveLength(1);
    expect(hookSource).toContain("useJarvisEventBridge");
    expect(hookSource).not.toContain("window.jarvis?.onEvent");
  });

  it("refreshes once on mount and unsubscribes on cleanup", () => {
    expect(bridgeSource).toContain("void refreshSnapshot()");
    expect(bridgeSource).toContain("unsubscribe?.()");
    expect(bridgeSource).not.toContain("setInterval");
    expect(bridgeSource).not.toContain("setTimeout");
  });

  it("refreshes voice regression pending samples after final voice dispatch", () => {
    expect(hookSource).toContain("refreshVoiceRegressionAfterFinalRef");
    expect(hookSource).toContain(
      'void dispatchBrainCommand(text, "voice",',
    );
    expect(hookSource).toContain("asrProviderId: transcript.providerId");
    expect(hookSource).toContain("void refreshVoiceRegressionCollectionStatus()");
    expect(hookSource).toContain("void refreshVoiceRegressionPendingSamples()");
    expect(hookSource).not.toContain("setInterval");
  });
});
