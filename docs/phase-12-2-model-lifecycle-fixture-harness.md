# Phase 12.2 Model Lifecycle Fixture Harness

## Status

Complete as a deterministic, in-memory, fixture-only model management
preparation wave.

## Scope

The harness covers:

- install preflight;
- artifact verification;
- upgrade planning; and
- rollback planning.

It evaluates only bounded case counts, operation-state observation counts,
manifest-pin and digest-verification counts, outcomes, and a safety-violation
flag. Model IDs, revisions, digests, private paths, signed URLs, model values,
and filesystem contents are not persisted or echoed.

## Safety Boundary

The harness is `fixture_only` and in-memory. It does not:

- write a model cache or any filesystem state;
- access the network;
- download, load, or execute a model;
- build or bundle an installer;
- update or uninstall software;
- execute a rollback;
- persist signed URLs or private paths;
- register providers;
- change Core Host, Desktop, IPC, or UI behavior; or
- make the final Windows release policy decision.

Empty observations, failed cases, and any attempted side effect fail closed.
Degraded fixture coverage reports `degraded` with all side-effect flags
disabled.

## Verification

Run:

```powershell
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Desktop smoke is not required because this wave changes no Core Host,
Desktop, IPC, provider visibility, or UI behavior.

## Next Hard Pause

Do not add filesystem lifecycle code, model artifact access, installer
creation, automatic updates, rollback execution, or final release policy
without explicit product, security, and release approval.
