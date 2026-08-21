import { describe, expect, it } from "vitest";
import {
  DESKTOP_PET_SIZE,
  clampPetPosition,
  defaultPetPosition,
  type PetDisplay,
  type PetScreen,
} from "../src/pet/pet-position";

const primary: PetDisplay = {
  id: 1,
  workArea: { x: 0, y: 0, width: 1920, height: 1040 },
};
const secondary: PetDisplay = {
  id: 2,
  workArea: { x: 1920, y: 0, width: 1280, height: 900 },
};

function screen(): PetScreen {
  return {
    getPrimaryDisplay: () => primary,
    getAllDisplays: () => [primary, secondary],
    getDisplayNearestPoint: (point) => (point.x >= 1920 ? secondary : primary),
  };
}

describe("Pet position", () => {
  it("defaults to the primary work area lower-right corner", () => {
    expect(defaultPetPosition(screen())).toEqual({
      x: primary.workArea.width - DESKTOP_PET_SIZE.width - 24,
      y: primary.workArea.height - DESKTOP_PET_SIZE.height - 24,
      displayId: "1",
    });
  });

  it("clamps off-screen positions back into the visible work area", () => {
    expect(
      clampPetPosition(screen(), { x: -9999, y: 9999, displayId: "1" }),
    ).toEqual({
      x: 0,
      y: primary.workArea.height - DESKTOP_PET_SIZE.height,
      displayId: "1",
    });
  });

  it("uses nearest display when a saved display was removed", () => {
    expect(
      clampPetPosition(screen(), {
        x: 2500,
        y: 1200,
        displayId: "removed-display",
      }),
    ).toEqual({
      x: 2500,
      y: secondary.workArea.height - DESKTOP_PET_SIZE.height,
      displayId: "2",
    });
  });
});
