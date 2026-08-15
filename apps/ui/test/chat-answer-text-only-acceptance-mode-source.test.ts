import { describe, expect, it } from "vitest";

import { readAppCompositionSource } from "./read-ui-source";

const appSource = readAppCompositionSource();

describe("Chat Answer text-only acceptance mode UI", () => {
  it("projects an explicit disabled voice state without changing normal navigation", () => {
    expect(appSource).toContain("textOnlyAcceptanceMode");
    expect(appSource).toContain("visiblePrimaryNavigation");
    expect(appSource).toContain('item.id !== "voice"');
    expect(appSource).toContain('data-testid="text-only-acceptance-status"');
    expect(appSource).toContain('"text-only-voice-disabled"');
    expect(appSource).toContain("MicOff");
    expect(appSource).toContain(
      "disabled={!coreOnline || textOnlyAcceptanceMode}",
    );
    expect(appSource).toContain("coreOnline && !textOnlyAcceptanceMode");
  });

  it("guards voice actions and secure voice settings while preserving local TTS", () => {
    expect(appSource).toContain("if (textOnlyAcceptanceMode) return");
    expect(appSource).toContain('data-testid="voice-view-settings"');
    expect(appSource).toContain('data-testid="settings-open-voice-settings"');
    expect(appSource).toContain('data-testid="settings-open-tts-settings"');
    expect(appSource).toContain('data-testid="settings-local-tts-toggle"');
    expect(appSource).toContain("localTtsEnabled");
  });

  it("keeps text command input available and suppresses voice transcript projection", () => {
    expect(appSource).toContain('data-testid="command-input"');
    expect(appSource).toContain('data-testid="send-command"');
    expect(appSource).toContain("hidden: textOnlyAcceptanceMode");
    expect(appSource).toContain("voiceProjection.hidden");
    expect(appSource).toContain('state: snapshot?.voice.state ?? "idle"');
    expect(appSource).toContain("transcript: voiceTranscript");
    expect(appSource).toContain("handleSelectView(view: ActiveView)");
  });
});
