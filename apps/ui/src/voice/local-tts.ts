export type UiLanguagePreference = "en" | "zh";

export function selectLocalTtsLanguage(
  text: string,
  uiLanguage: UiLanguagePreference
): string {
  const hasCjkText = /[\u3400-\u9fff\uf900-\ufaff]/u.test(text);
  const hasLatinText = /[A-Za-z]/.test(text);

  if (hasLatinText && !hasCjkText) {
    return "en-US";
  }
  if (hasCjkText) {
    return "zh-CN";
  }
  return uiLanguage === "zh" ? "zh-CN" : "en-US";
}

export function selectLocalTtsVoice(
  voices: readonly SpeechSynthesisVoice[],
  language: string
): SpeechSynthesisVoice | undefined {
  const normalizedLanguage = language.toLowerCase();
  const languageRoot = normalizedLanguage.split("-")[0];
  return (
    voices.find((voice) => voice.lang.toLowerCase() === normalizedLanguage) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(languageRoot))
  );
}

export async function waitForLocalTtsVoices(
  speechSynthesis: SpeechSynthesis,
  timeoutMs = 250
): Promise<SpeechSynthesisVoice[]> {
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    return voices;
  }

  return await new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false;
    let handleVoicesChanged = () => {};
    const finish = (nextVoices: SpeechSynthesisVoice[]) => {
      if (settled) {
        return;
      }
      settled = true;
      globalThis.clearTimeout(timeoutId);
      speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(nextVoices);
    };

    handleVoicesChanged = () => {
      finish(speechSynthesis.getVoices());
    };

    const timeoutId = globalThis.setTimeout(() => {
      finish(speechSynthesis.getVoices());
    }, timeoutMs);

    speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
  });
}
