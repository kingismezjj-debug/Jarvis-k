# Phase 7.21 Runtime Adapter Isolation Guard

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

This wave prepares the isolated runtime adapter boundary for the planned
Transformers embedding provider. It validates the provider-local descriptor,
dedicated package boundary, supervised helper protocol, resource lease
requirement, sanitized failure reporting, and fallback-provider requirement.

This is a readiness guard only. It does not add a real runtime adapter,
runtime dependency, Python environment, model loader, artifact reader,
provider registration, or concrete `apps/core-host` composition.

## Approval Meaning

An accepted result means only that the boundary is ready to enter a separate
runtime dependency approval stage. It does not mean:

- a model can be loaded;
- an embedding can be generated;
- a provider can be registered;
- a default opt-in is allowed; or
- the local embedding readiness gate may be marked complete.

The result always keeps composition and execution disabled.

## Guarded Requirements

- Descriptor must remain Transformers-only and embedding-only.
- Runtime package must remain
  `@jarvis-k/inference-runtime-transformers-local`.
- Concrete composition remains owned by `apps/core-host`.
- Runtime helper communication must stay on private supervised child-process
  IPC.
- Model loading must require a resource scheduler lease.
- Errors must be sanitized before crossing a process or DTO boundary.
- Fixture or another fallback provider must remain available.
- Runtime dependencies, downloads, provider registration, and default opt-in
  must remain disabled.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/inference-adapter-embedding-local
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, provider visibility, or startup
supervision.
