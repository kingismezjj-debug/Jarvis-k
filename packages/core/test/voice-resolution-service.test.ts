import { describe, expect, it } from "vitest";
import type { UserRouteAliasRecord } from "@jarvis-k/contracts";
import { VoiceResolutionService } from "../src/voice-resolution-service";

class RouteAliasRepository {
  public initialized = false;

  public constructor(private readonly aliases: UserRouteAliasRecord[]) {}

  public async initialize(): Promise<void> {
    this.initialized = true;
  }

  public async listAliases(): Promise<UserRouteAliasRecord[]> {
    return this.aliases;
  }
}

describe("VoiceResolutionService production input parity", () => {
  it("passes user-confirmed route aliases into the resolver production path", async () => {
    const routeAliasRepository = new RouteAliasRepository([
      {
        id: "route_alias_unit",
        label: "\u5de5\u4f5c\u53f0",
        aliases: ["\u5de5\u4f5c\u53f0", "\u9879\u76ee\u540e\u53f0"],
        intent: "browser.open",
        targetUrl: "https://console.example.test",
        targetHostname: "console.example.test",
        source: "user_confirmed",
        risk: "medium",
        createdAt: "2026-08-15T00:00:00.000Z",
        updatedAt: "2026-08-15T00:00:00.000Z",
      },
    ]);
    const service = new VoiceResolutionService({ routeAliasRepository });

    const correction = await service.resolveCommandCorrection({
      rawTranscript: "\u8bf7\u6253\u5f00\u5de5\u4f5c\u53f0",
      requestedMode: "command",
    });

    expect(routeAliasRepository.initialized).toBe(true);
    expect(correction.requiresUserSelection).toBe(false);
    expect(correction.correctionCandidates[0]).toMatchObject({
      intent: "browser.open",
      slots: { target: "\u5de5\u4f5c\u53f0" },
    });
    expect(correction.directActionAttempted).toBe(false);
  });

  it("falls back to clarification when route aliases are unavailable", async () => {
    const service = new VoiceResolutionService();

    const correction = await service.resolveCommandCorrection({
      rawTranscript: "\u8bf7\u6253\u5f00\u5de5\u4f5c\u53f0",
      requestedMode: "command",
    });

    expect(correction.requiresUserSelection).toBe(true);
    expect(correction.directActionAttempted).toBe(false);
  });

  it("does not convert explicit non-command voice input through the notepad write shortcut", async () => {
    const service = new VoiceResolutionService();

    const correction = await service.resolveCommandCorrection({
      rawTranscript: "\u5728\u8bb0\u4e8b\u672c\u8f93\u5165 open VS Code",
      requestedMode: "conversation",
      requestedModeSource: "explicit_ui",
    });

    expect(correction).toMatchObject({
      inputMode: "conversation",
      inputModeSource: "explicit_ui",
      correctionCandidates: [],
      requiresUserSelection: false,
    });
  });
});
