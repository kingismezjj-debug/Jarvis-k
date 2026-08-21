import type { DesktopPetPosition } from "@jarvis-k/contracts";

export const DESKTOP_PET_SIZE = {
  height: 112,
  width: 112,
} as const;

export interface PetDisplay {
  readonly id: number;
  readonly scaleFactor?: number;
  readonly workArea: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface PetScreen {
  getPrimaryDisplay(): PetDisplay;
  getAllDisplays(): PetDisplay[];
  getDisplayNearestPoint(point: { x: number; y: number }): PetDisplay;
}

export function defaultPetPosition(screen: PetScreen): DesktopPetPosition {
  return positionForDisplay(screen.getPrimaryDisplay());
}

export function clampPetPosition(
  screen: PetScreen,
  candidate?: DesktopPetPosition | null,
): DesktopPetPosition {
  if (!candidate) {
    return defaultPetPosition(screen);
  }

  const display =
    screen
      .getAllDisplays()
      .find((item) => String(item.id) === candidate.displayId) ??
    screen.getDisplayNearestPoint({ x: candidate.x, y: candidate.y }) ??
    screen.getPrimaryDisplay();
  const { workArea } = display;
  const minX = workArea.x;
  const minY = workArea.y;
  const maxX = workArea.x + workArea.width - DESKTOP_PET_SIZE.width;
  const maxY = workArea.y + workArea.height - DESKTOP_PET_SIZE.height;
  return {
    x: clamp(candidate.x, minX, Math.max(minX, maxX)),
    y: clamp(candidate.y, minY, Math.max(minY, maxY)),
    displayId: String(display.id),
  };
}

function positionForDisplay(display: PetDisplay): DesktopPetPosition {
  return {
    x: display.workArea.x + display.workArea.width - DESKTOP_PET_SIZE.width - 24,
    y:
      display.workArea.y +
      display.workArea.height -
      DESKTOP_PET_SIZE.height -
      24,
    displayId: String(display.id),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
