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
- The approved Transformers environment was not configured in the current
  shell, so the real artifact benchmark was not rerun in this diagnostic wave.
- No real artifact was accessed, no model directory was created, and no
  benchmark memory value is claimed.

## Acceptance State

Peak helper memory remains `deferred` until the approved artifact benchmark is
rerun with the configured Transformers environment and the sanitized probe
returns at least one valid sample during the real helper lifecycle.

This wave does not register a provider, change execution or default opt-in,
modify `apps/core-host`, expose provider visibility, or add model lifecycle
behavior.

## Verification

- Acceptance runner syntax check: PASS.
- Hardened memory probe against a temporary non-model child: PASS.
- Real artifact-backed memory capture: DEFERRED pending the configured
  approved Python environment.
