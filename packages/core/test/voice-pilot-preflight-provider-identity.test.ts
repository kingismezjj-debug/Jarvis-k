import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const preflightScript = path.resolve(
  repoRoot,
  "tests",
  "voice-pilot-non-execution-preflight.mjs",
);

function runPreflight(env: Record<string, string | undefined>) {
  return spawnSync(process.execPath, [preflightScript], {
    cwd: repoRoot,
    env: {
      ...process.env,
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
      JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION: undefined,
      JARVIS_K_VOICE_PILOT_PROVIDER_IDENTITY: undefined,
      JARVIS_K_VOICE_PILOT_PROVIDER_STATUS: undefined,
      ...env,
    },
    encoding: "utf8",
  });
}

describe("voice pilot provider identity preflight", () => {
  it("fails closed when provider identity is unknown, unavailable, fixture, or smoke", () => {
    for (const providerId of [
      undefined,
      "unknown",
      "unavailable",
      "fixture-asr",
      "smoke-asr",
    ]) {
      const result = runPreflight({
        JARVIS_K_VOICE_PILOT_PROVIDER_IDENTITY: providerId,
        JARVIS_K_VOICE_PILOT_PROVIDER_STATUS: "ready",
      });
      const parsed = JSON.parse(result.stdout);

      expect(result.status).toBe(1);
      expect(parsed).toMatchObject({
        status: "FAIL",
        reason: "VOICE_PILOT_PROVIDER_IDENTITY_UNAVAILABLE",
        allowManualPilot: false,
      });
    }
  });

  it("allows manual pilot only for a real ready provider with non-execution proof", () => {
    const result = runPreflight({
      JARVIS_K_VOICE_PILOT_PROVIDER_IDENTITY: "xunfei",
      JARVIS_K_VOICE_PILOT_PROVIDER_STATUS: "ready",
    });
    const parsed = JSON.parse(result.stdout);

    expect(result.status).toBe(0);
    expect(parsed).toMatchObject({
      status: "PASS",
      currentVoiceProviderId: "xunfei",
      voiceProviderStatus: "ready",
      providerIdentitySupported: true,
      allowManualPilot: true,
      executorInvocationCounter: 0,
    });
    expect(parsed.effectfulAdaptersStatus).toEqual({
      browserOpen: 0,
      localAppOpen: 0,
      notepadAutomation: 0,
      windowAutomation: 0,
      filesystemSearch: 0,
    });
  });
});
