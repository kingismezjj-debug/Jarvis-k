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
      JARVIS_K_VOICE_PILOT_EXPECTED_PROVIDER_ID: undefined,
      JARVIS_K_VOICE_PILOT_PROVIDER_IDENTITY: undefined,
      JARVIS_K_VOICE_PILOT_PROVIDER_STATUS: undefined,
      JARVIS_K_VOICE_PILOT_INPUT_MODE: undefined,
      JARVIS_K_VOICE_PILOT_INPUT_MODE_SOURCE: undefined,
      JARVIS_K_VOICE_PILOT_ROUTE_ALIAS_READY: undefined,
      JARVIS_K_VOICE_PILOT_READONLY_PLUGIN_READY: undefined,
      JARVIS_K_VOICE_REGRESSION_REPOSITORY_EMPTY: undefined,
      ...env,
    },
    encoding: "utf8",
  });
}

function readyPilotContext() {
  return {
    JARVIS_K_VOICE_PILOT_ROUTE_ALIAS_READY: "1",
    JARVIS_K_VOICE_PILOT_READONLY_PLUGIN_READY: "1",
    JARVIS_K_VOICE_REGRESSION_REPOSITORY_EMPTY: "1",
  };
}

describe("voice pilot provider identity preflight", () => {
  it("fails closed without an active runtime session bridge", () => {
    const result = runPreflight({
      JARVIS_K_VOICE_PILOT_ALLOW_TEST_HARNESS: undefined,
      JARVIS_K_VOICE_PILOT_EXPECTED_PROVIDER_ID: "xunfei",
      JARVIS_K_VOICE_PILOT_PROVIDER_IDENTITY: "xunfei",
      JARVIS_K_VOICE_PILOT_PROVIDER_STATUS: "ready",
      JARVIS_K_VOICE_PILOT_INPUT_MODE: "command",
      JARVIS_K_VOICE_PILOT_INPUT_MODE_SOURCE: "explicit_ui",
    });
    const parsed = JSON.parse(result.stdout);

    expect(result.status).toBe(1);
    expect(parsed).toMatchObject({
      status: "FAIL",
      reason: "VOICE_PILOT_ACTIVE_SESSION_UNAVAILABLE",
      allowManualPilot: false,
    });
  });

  it("fails closed when provider identity is unknown, unavailable, fixture, or smoke", () => {
    for (const providerId of [
      undefined,
      "unknown",
      "unavailable",
      "fixture-asr",
      "smoke-asr",
    ]) {
      const result = runPreflight({
        ...readyPilotContext(),
        JARVIS_K_VOICE_PILOT_ALLOW_TEST_HARNESS: "1",
        JARVIS_K_VOICE_PILOT_EXPECTED_PROVIDER_ID: "xunfei",
        JARVIS_K_VOICE_PILOT_PROVIDER_IDENTITY: providerId,
        JARVIS_K_VOICE_PILOT_PROVIDER_STATUS: "ready",
        JARVIS_K_VOICE_PILOT_INPUT_MODE: "command",
        JARVIS_K_VOICE_PILOT_INPUT_MODE_SOURCE: "explicit_ui",
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

  it("fails closed when the expected provider is missing or mismatched", () => {
    for (const [expected, actual, reason] of [
      [undefined, "xunfei", "VOICE_PILOT_EXPECTED_PROVIDER_UNAVAILABLE"],
      ["xunfei", "volcengine", "VOICE_PILOT_PROVIDER_IDENTITY_UNAVAILABLE"],
      ["volcengine", "xunfei", "VOICE_PILOT_PROVIDER_IDENTITY_UNAVAILABLE"],
    ] as const) {
      const result = runPreflight({
        ...readyPilotContext(),
        JARVIS_K_VOICE_PILOT_ALLOW_TEST_HARNESS: "1",
        JARVIS_K_VOICE_PILOT_EXPECTED_PROVIDER_ID: expected,
        JARVIS_K_VOICE_PILOT_PROVIDER_IDENTITY: actual,
        JARVIS_K_VOICE_PILOT_PROVIDER_STATUS: "ready",
        JARVIS_K_VOICE_PILOT_INPUT_MODE: "command",
        JARVIS_K_VOICE_PILOT_INPUT_MODE_SOURCE: "explicit_ui",
      });
      const parsed = JSON.parse(result.stdout);

      expect(result.status).toBe(1);
      expect(parsed).toMatchObject({
        status: "FAIL",
        reason,
        allowManualPilot: false,
      });
    }
  });

  it("allows manual pilot only for a matching real ready provider with non-execution proof", () => {
    for (const providerId of ["xunfei", "volcengine"] as const) {
      const result = runPreflight({
        ...readyPilotContext(),
        JARVIS_K_VOICE_PILOT_ALLOW_TEST_HARNESS: "1",
        JARVIS_K_VOICE_PILOT_EXPECTED_PROVIDER_ID: providerId,
        JARVIS_K_VOICE_PILOT_PROVIDER_IDENTITY: providerId,
        JARVIS_K_VOICE_PILOT_PROVIDER_STATUS: "ready",
        JARVIS_K_VOICE_PILOT_INPUT_MODE: "command",
        JARVIS_K_VOICE_PILOT_INPUT_MODE_SOURCE: "explicit_ui",
      });
      const parsed = JSON.parse(result.stdout);

      expect(result.status).toBe(0);
      expect(parsed).toMatchObject({
        status: "PASS",
        expectedProviderId: providerId,
        currentVoiceProviderId: providerId,
        voiceProviderStatus: "ready",
        providerIdentitySupported: true,
        currentVoiceInputMode: "command",
        currentVoiceInputModeSource: "explicit_ui",
        explicitCommandModeSupported: true,
        pilotTranscriptModeCount: 20,
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
    }
  });

  it("fails closed when the Pilot mode is missing or legacy inferred", () => {
    for (const [mode, source] of [
      ["command", undefined],
      ["command", "legacy_inferred"],
      ["conversation", "explicit_ui"],
    ] as const) {
      const result = runPreflight({
        ...readyPilotContext(),
        JARVIS_K_VOICE_PILOT_ALLOW_TEST_HARNESS: "1",
        JARVIS_K_VOICE_PILOT_EXPECTED_PROVIDER_ID: "xunfei",
        JARVIS_K_VOICE_PILOT_PROVIDER_IDENTITY: "xunfei",
        JARVIS_K_VOICE_PILOT_PROVIDER_STATUS: "ready",
        JARVIS_K_VOICE_PILOT_INPUT_MODE: mode,
        JARVIS_K_VOICE_PILOT_INPUT_MODE_SOURCE: source,
      });
      const parsed = JSON.parse(result.stdout);

      expect(result.status).toBe(1);
      expect(parsed).toMatchObject({
        status: "FAIL",
        reason: "VOICE_PILOT_EXPLICIT_COMMAND_MODE_UNAVAILABLE",
        allowManualPilot: false,
      });
    }
  });
});
