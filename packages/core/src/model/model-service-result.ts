import type { StructuredError } from "@jarvis-k/contracts";

export type ModelServiceResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: StructuredError;
    };

export function modelServiceSuccess<T>(value: T): ModelServiceResult<T> {
  return { ok: true, value };
}

export function modelServiceFailure(
  error: StructuredError,
): ModelServiceResult<never> {
  return { ok: false, error };
}
