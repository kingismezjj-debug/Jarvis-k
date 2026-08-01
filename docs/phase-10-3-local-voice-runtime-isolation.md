# Phase 10.3 Local Voice Runtime Isolation Guard

Recorded on 2026-08-01.

## Scope

This wave adds a provider-local isolation guard for the future local voice
runtime adapter. It records a pending dedicated package boundary and checks
the intended supervised child-process, private IPC, resource lease, sanitized
failure, and fixture fallback requirements.

The descriptor uses `provider_local_pending`; it does not select a speech
runtime, install a dependency, create a package, access a model or voice
artifact, or execute audio.

## Approval Result

An accepted result means only
`ready_for_runtime_dependency_approval`. It does not approve runtime
dependencies, Python or native environments, model downloads, model loading,
audio execution, provider registration, or default opt-in.

The planned composition root remains `apps/core-host`, and the future runtime
package remains isolated from contracts, capabilities, Core, Desktop, and UI.
The fixture provider remains the required fallback while the local runtime is
unavailable.

## Fail-Closed Checks

The guard rejects:

- a malformed or policy-regressed adapter descriptor;
- missing package, helper protocol, resource lease, or sanitized-error review;
- missing fixture fallback;
- network or credential requirements;
- runtime dependency, model download, model loading, or audio execution flags;
- provider registration or default opt-in; and
- dirty verification.

Guard output contains only the fixed pending boundary, booleans, and sanitized
reason codes. It does not echo arbitrary descriptor fields or sensitive
values.

## Verification

Run:

```powershell
npm.cmd run build -w @jarvis-k/voice
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave changes no Core Host
composition, Desktop IPC, startup supervision, provider visibility, or UI
behavior.
