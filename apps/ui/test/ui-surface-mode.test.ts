import { describe, expect, it } from "vitest";

import {
  DEVELOPER_MODE_STORAGE_KEY,
  persistDeveloperMode,
  projectUiSurfaceMode,
  readStoredDeveloperMode,
} from "../src/app/ui-surface-mode";

describe("ui surface mode", () => {
  it("defaults to the product surface with evaluation unavailable", () => {
    expect(
      projectUiSurfaceMode({
        developerModeEnabled: false,
        capabilityStatus: null,
      }),
    ).toEqual({
      developerModeEnabled: false,
      effectiveSurface: "product",
      evaluationCapabilityAvailable: false,
      evaluationSurfaceEnabled: false,
    });
  });

  it("requires developer mode and desktop capability for evaluation", () => {
    const capabilityStatus = {
      evaluationCapabilityAvailable: true,
      source: "desktop-main" as const,
      sensitiveValuesExposed: false as const,
      rendererWritable: false as const,
    };
    expect(
      projectUiSurfaceMode({
        developerModeEnabled: false,
        capabilityStatus,
      }).effectiveSurface,
    ).toBe("product");
    expect(
      projectUiSurfaceMode({
        developerModeEnabled: true,
        capabilityStatus,
      }).effectiveSurface,
    ).toBe("evaluation");
  });

  it("rejects renderer-writable capability projections", () => {
    expect(
      projectUiSurfaceMode({
        developerModeEnabled: true,
        capabilityStatus: {
          evaluationCapabilityAvailable: true,
          source: "desktop-main",
          sensitiveValuesExposed: false,
          rendererWritable: true,
        },
      }).effectiveSurface,
    ).toBe("developer");
  });

  it("persists developer mode locally only", () => {
    const storage = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => {
        storage.delete(key);
      },
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    } as Storage;

    expect(readStoredDeveloperMode(localStorage)).toBe(false);
    persistDeveloperMode(localStorage, true);
    expect(storage.get(DEVELOPER_MODE_STORAGE_KEY)).toBe("true");
    expect(readStoredDeveloperMode(localStorage)).toBe(true);
    persistDeveloperMode(localStorage, false);
    expect(readStoredDeveloperMode(localStorage)).toBe(false);
  });
});
