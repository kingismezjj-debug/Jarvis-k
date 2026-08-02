# Phase 7.27 Peak Memory Sampling Diagnostic

Recorded on 2026-08-02 for the provider-local acceptance runner.

## Scope

This wave hardens the optional peak helper working-set probe used by the
approved Phase 7.26 acceptance runner. The probe remains outside product
composition and is allowed to report only a sanitized positive byte count to
the local benchmark process.

The probe now:

- requests the Windows process query and virtual-memory read rights required
  for the memory API;
- uses `PeakWorkingSetSize` instead of treating a current working-set sample
  as a process peak;
- loads the Windows libraries with last-error support for safer future
  diagnostics; and
- continues to suppress process identifiers, paths, raw diagnostics, model
  values, credentials, and URLs.

## Diagnostic Result

- A short-lived local non-model child process produced a positive peak
  working-set sample through the hardened API path.
- The approved Transformers environment was configured transiently with
  Python `3.14.4`, Transformers `5.14.1`, Torch `2.13.0+cpu`, and
  Safetensors `0.8.0`.
- The real artifact benchmark was rerun successfully. Artifact verification,
  model load, embedding quality, latency capture, and cleanup passed.
- The real model lifecycle still produced no valid memory sample, so no
  benchmark memory value is claimed.
- The temporary environment, caches, and artifact directory were removed after
  the rerun.

## Acceptance State

Peak helper memory remains `deferred` because the approved artifact benchmark
was rerun with the configured Transformers environment, but the sanitized
probe did not return a valid sample during the real helper lifecycle.

This wave does not register a provider, change execution or default opt-in,
modify `apps/core-host`, expose provider visibility, or add model lifecycle
behavior.

## Verification

- Acceptance runner syntax check: PASS.
- Hardened memory probe against a temporary non-model child: PASS.
- Real artifact-backed memory capture: DEFERRED; the configured environment
  rerun completed without a valid lifecycle sample.
