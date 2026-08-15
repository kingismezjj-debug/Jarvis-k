import type { UiLanguage } from "./types";

export const LANGUAGE_STORAGE_KEY = "jarvis-k-ui-language";

export function readInitialLanguage(): UiLanguage {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "zh"
    ? "zh"
    : "en";
}

export function persistUiLanguage(language: UiLanguage) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}
