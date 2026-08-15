import { describe, expect, it, vi } from "vitest";
import {
  createCoreHostVoiceComposition,
  parseVoiceProviderConfigurationMessage,
} from "../src/composition/voice-composition";

const scheduler = {
  setTimeout: (callback: () => void, delayMs: number) =>
    setTimeout(callback, delayMs),
  clearTimeout: (handle: unknown) => clearTimeout(handle as NodeJS.Timeout),
};

describe("Core Host voice composition", () => {
  it("keeps ASR unavailable until an explicit provider configuration arrives", async () => {
    const composition = createCoreHostVoiceComposition({
      smokeVoiceEnabled: false,
      smokeProviderFaultEnabled: false,
      scheduler,
      eventSink: {
        publish: vi.fn(),
      },
    });

    await expect(
      composition.configurableProvider.connect({
        onTranscript: vi.fn(),
        onError: vi.fn(),
      }),
    ).rejects.toThrow("ASR provider is not configured");
  });

  it("parses bounded Xunfei configuration without exposing raw message fields", () => {
    expect(
      parseVoiceProviderConfigurationMessage({
        kind: "voice-provider.configure",
        configuration: {
          provider: "xunfei",
          language: "en",
          credentials: {
            appId: " app-1 ",
            apiKey: " key-1 ",
          },
        },
      }),
    ).toEqual({
      provider: "xunfei",
      language: "en",
      credentials: {
        appId: "app-1",
        apiKey: "key-1",
      },
    });
  });

  it("parses bounded Volcengine configuration with the safe default resource", () => {
    expect(
      parseVoiceProviderConfigurationMessage({
        kind: "voice-provider.configure",
        configuration: {
          provider: "volcengine",
          credentials: {
            apiKey: " key-1 ",
          },
        },
      }),
    ).toEqual({
      provider: "volcengine",
      language: "zh",
      credentials: {
        apiKey: "key-1",
        resourceId: "volc.seedasr.sauc.duration",
      },
    });
  });

  it("rejects unsupported providers and malformed resources", () => {
    expect(
      parseVoiceProviderConfigurationMessage({
        kind: "voice-provider.configure",
        configuration: {
          provider: "unknown",
          credentials: {
            apiKey: "key-1",
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
            apiKey: "key-1",
            resourceId: "../not-allowed",
          },
        },
      }),
    ).toBeNull();
  });

  it("configures providers without opening a network session", async () => {
    const composition = createCoreHostVoiceComposition({
      smokeVoiceEnabled: false,
      smokeProviderFaultEnabled: false,
      scheduler,
      eventSink: {
        publish: vi.fn(),
      },
    });

    await expect(
      composition.configureProvider({
        provider: "volcengine",
        language: "zh",
        credentials: {
          apiKey: "key-1",
          resourceId: "volc.seedasr.sauc.duration",
        },
      }),
    ).resolves.toBeUndefined();
  });
});
