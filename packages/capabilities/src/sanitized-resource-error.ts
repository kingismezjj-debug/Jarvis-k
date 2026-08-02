const KNOWN_RESOURCE_ERROR_CODES = new Set([
  "RESOURCE_DEVICE_UNAVAILABLE",
  "RESOURCE_MEMORY_UNAVAILABLE",
  "RESOURCE_VRAM_UNAVAILABLE",
  "RESOURCE_GPU_BUSY",
  "RESOURCE_GPU_EXCLUSIVE_LOCKED"
]);

export function sanitizeResourceSchedulerError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  return KNOWN_RESOURCE_ERROR_CODES.has(message)
    ? message
    : "RESOURCE_PRECHECK_FAILED";
}
