import { describe, expect, it } from "vitest";
import {
  parseCoreHostMessage,
  parseCommandRouterProductModeConfigurationMessage,
  parseHeavyPlannerProviderConfigurationMessage,
  parseVoiceProviderConfigurationMessage,
} from "../src/host/host-message-schema";

describe("Core Host message schema", () => {
  it("fails closed for unknown and malformed messages", () => {
    expect(parseCoreHostMessage({ kind: "fixture.enable" })).toEqual({
      accepted: false,
      reasonCode: "UNKNOWN_OR_INVALID_MESSAGE",
    });
    expect(parseCoreHostMessage({ kind: "voice-provider.configure" })).toEqual({
      accepted: false,
      reasonCode: "UNKNOWN_OR_INVALID_MESSAGE",
    });
  });

  it("rejects illegal command-router product mode attempts", () => {
    expect(
      parseCommandRouterProductModeConfigurationMessage({
        kind: "command-router-product-mode.configure",
        providerId: "intent-router.deterministic.rules",
        mode: "production_rules",
        enabled: true,
        directActionEnabled: true,
        realQwenRuntimeEnabled: false,
        networkAccessApproved: false,
      }),
    ).toBeNull();
    expect(
      parseCommandRouterProductModeConfigurationMessage({
        kind: "command-router-product-mode.configure",
        providerId: "intent-router.deterministic.rules",
        mode: "production_rules",
        enabled: "true",
        directActionEnabled: false,
        realQwenRuntimeEnabled: false,
        networkAccessApproved: false,
      }),
    ).toBeNull();
  });

  it("accepts only the deterministic command-router production-rules shape", () => {
    expect(
      parseCoreHostMessage({
        kind: "command-router-product-mode.configure",
        providerId: "intent-router.deterministic.rules",
        mode: "production_rules",
        enabled: true,
        directActionEnabled: false,
        realQwenRuntimeEnabled: false,
        networkAccessApproved: false,
      }),
    ).toEqual({
      accepted: true,
      message: {
        kind: "command-router-product-mode.configure",
        configuration: {
          enabled: true,
        },
      },
    });
  });

  it("rejects illegal provider IDs and untrusted voice resource IDs", () => {
    expect(
      parseHeavyPlannerProviderConfigurationMessage({
        kind: "heavy-planner-provider.configure",
        configuration: {
          provider: "other",
          credentials: {
            apiKey: "not-a-real-key",
          },
        },
      }),
    ).toBeNull();
    expect(
      parseVoiceProviderConfigurationMessage({
        kind: "voice-provider.configure",
        configuration: {
          provider: "volcengine",
          credentials: {
            apiKey: "not-a-real-key",
            resourceId: "https://example.invalid/runtime",
          },
        },
      }),
    ).toBeNull();
  });

  it("does not expose credentials in invalid parse results", () => {
    const result = parseCoreHostMessage({
      kind: "heavy-planner-provider.configure",
      configuration: {
        provider: "other",
        credentials: {
          apiKey: "not-a-real-key",
        },
      },
    });

    expect(JSON.stringify(result)).not.toContain("not-a-real-key");
  });

  it("parses ordinary Core inbound messages without allowing fixture toggles", () => {
    const result = parseCoreHostMessage({
      kind: "command",
      envelope: {
        protocolVersion: 1,
        commandId: "command-1",
        correlationId: "correlation-1",
        createdAt: "2026-08-15T00:00:00.000Z",
        command: {
          type: "agent.runBrainCommand",
          payload: {
            source: "text",
            text: "hello",
          },
        },
      },
    });

    expect(result).toMatchObject({
      accepted: true,
      message: {
        kind: "core-inbound",
      },
    });
    expect(
      parseCoreHostMessage({
        kind: "command",
        envelope: {
          protocolVersion: 1,
          commandId: "command-2",
          correlationId: "correlation-2",
          createdAt: "2026-08-15T00:00:01.000Z",
          command: {
            type: "agent.runBrainCommand",
            payload: {
              source: "text",
              text: "fixture.enable",
            },
          },
        },
      }),
    ).toMatchObject({
      accepted: true,
      message: {
        kind: "core-inbound",
      },
    });
  });
});
