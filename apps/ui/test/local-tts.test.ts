import { describe, expect, it, vi } from "vitest";

import {
  selectLocalTtsLanguage,
  selectLocalTtsVoice,
  waitForLocalTtsVoices
} from "../src/voice/local-tts";

describe("local TTS selection", () => {
  it("uses English speech for English Brain summaries even when UI is Chinese", () => {
    expect(
      selectLocalTtsLanguage(
        "Brain Alpha routed this as chat.answer.",
        "zh"
      )
    ).toBe("en-US");
  });

  it("uses Chinese speech for Chinese result text", () => {
    expect(selectLocalTtsLanguage("你好，Jarvis。", "en")).toBe("zh-CN");
  });

  it("falls back to the UI language when text has no language signal", () => {
    expect(selectLocalTtsLanguage("12345", "zh")).toBe("zh-CN");
    expect(selectLocalTtsLanguage("12345", "en")).toBe("en-US");
  });

  it("prefers an exact voice language and then a language-root match", () => {
    const voices = [
      { lang: "en-GB" },
      { lang: "zh-CN" }
    ] as SpeechSynthesisVoice[];

    expect(selectLocalTtsVoice(voices, "zh-CN")?.lang).toBe("zh-CN");
    expect(selectLocalTtsVoice(voices, "en-US")?.lang).toBe("en-GB");
  });

  it("waits for voiceschanged when the browser has not loaded voices yet", async () => {
    const listeners = new Map<string, EventListener>();
    let voices: SpeechSynthesisVoice[] = [];
    const speechSynthesis = {
      getVoices: () => voices,
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener);
      }),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        if (listeners.get(type) === listener) {
          listeners.delete(type);
        }
      })
    } as unknown as SpeechSynthesis;

    const pending = waitForLocalTtsVoices(speechSynthesis, 50);
    voices = [{ lang: "en-US" } as SpeechSynthesisVoice];
    listeners.get("voiceschanged")?.(new Event("voiceschanged"));

    await expect(pending).resolves.toEqual(voices);
  });
});
