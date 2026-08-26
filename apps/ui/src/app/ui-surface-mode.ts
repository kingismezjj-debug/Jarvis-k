export const DEVELOPER_MODE_STORAGE_KEY = "jarvis-k.developerModeEnabled";

export type EffectiveSurface = "product" | "developer" | "evaluation";

export type UiSurfaceMode = {
  developerModeEnabled: boolean;
  effectiveSurface: EffectiveSurface;
  cloudProviderAcceptanceCapabilityAvailable: boolean;
  cloudProviderAcceptanceSurfaceEnabled: boolean;
  evaluationCapabilityAvailable: boolean;
  evaluationSurfaceEnabled: boolean;
};

export function readStoredDeveloperMode(storage: Storage | undefined): boolean {
  if (!storage) return false;
  return storage.getItem(DEVELOPER_MODE_STORAGE_KEY) === "true";
}

export function persistDeveloperMode(
  storage: Storage | undefined,
  enabled: boolean,
): void {
  if (!storage) return;
  if (enabled) {
    storage.setItem(DEVELOPER_MODE_STORAGE_KEY, "true");
  } else {
    storage.removeItem(DEVELOPER_MODE_STORAGE_KEY);
  }
}

export function projectUiSurfaceMode(input: {
  developerModeEnabled: boolean;
  capabilityStatus: {
    cloudProviderAcceptanceCapabilityAvailable?: unknown;
    evaluationCapabilityAvailable?: unknown;
    source?: unknown;
    sensitiveValuesExposed?: unknown;
    rendererWritable?: unknown;
  } | null;
}): UiSurfaceMode {
  const evaluationCapabilityAvailable =
    input.capabilityStatus?.evaluationCapabilityAvailable === true &&
    input.capabilityStatus.source === "desktop-main" &&
    input.capabilityStatus.sensitiveValuesExposed === false &&
    input.capabilityStatus.rendererWritable === false;
  const evaluationSurfaceEnabled =
    input.developerModeEnabled && evaluationCapabilityAvailable;
  const cloudProviderAcceptanceCapabilityAvailable =
    evaluationCapabilityAvailable &&
    input.capabilityStatus?.cloudProviderAcceptanceCapabilityAvailable === true;
  const cloudProviderAcceptanceSurfaceEnabled =
    evaluationSurfaceEnabled && cloudProviderAcceptanceCapabilityAvailable;
  return {
    developerModeEnabled: input.developerModeEnabled,
    effectiveSurface: evaluationSurfaceEnabled
      ? "evaluation"
      : input.developerModeEnabled
        ? "developer"
        : "product",
    cloudProviderAcceptanceCapabilityAvailable,
    cloudProviderAcceptanceSurfaceEnabled,
    evaluationCapabilityAvailable,
    evaluationSurfaceEnabled,
  };
}
