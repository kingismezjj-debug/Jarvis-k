import type { SkinThemeId } from "./types";

export const THEME_STORAGE_KEY = "jarvis-k-ui-theme";

export const builtInSkinThemes: Array<{
  id: SkinThemeId;
  label: string;
  description: string;
  colorScheme: "dark" | "light";
  swatches: [string, string, string];
}> = [
  {
    id: "signal",
    label: "Signal",
    description: "Dark control-room baseline",
    colorScheme: "dark",
    swatches: ["#0b0b0c", "#d8ff72", "#67e8f9"],
  },
  {
    id: "harbor",
    label: "Harbor",
    description: "Light operations workspace",
    colorScheme: "light",
    swatches: ["#f6f8fb", "#2563eb", "#0f9f8f"],
  },
  {
    id: "ember",
    label: "Ember",
    description: "Warm focus console",
    colorScheme: "dark",
    swatches: ["#120f12", "#ff8a5c", "#75e0b8"],
  },
];

export const builtInSkinThemeIds = new Set<SkinThemeId>(
  builtInSkinThemes.map((theme) => theme.id),
);

export function isSkinThemeId(value: string | null): value is SkinThemeId {
  return builtInSkinThemeIds.has(value as SkinThemeId);
}

export function readInitialSkinTheme(): SkinThemeId {
  if (typeof window === "undefined") return "signal";
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isSkinThemeId(storedTheme)) {
    return storedTheme;
  }
  if (storedTheme !== null) {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  }
  return "signal";
}
