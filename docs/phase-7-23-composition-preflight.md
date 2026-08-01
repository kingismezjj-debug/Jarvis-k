# Phase 7.23 Composition Preflight

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

This wave adds a provider-local composition and enablement preflight for the
future Transformers embedding runtime. It checks that the runtime acceptance
review, adapter isolation review, fallback provider, verification gates, and
composition boundary remain consistent.

The preflight is review-only. It does not modify `apps/core-host`, register a
provider, expose provider visibility, enable execution, change default opt-in
behavior, add runtime dependencies, load a model, access artifacts, write a
cache, or create an installer.

## Approval Meaning

An accepted result means only
`ready_for_explicit_composition_review`. It does not mean that composition,
provider registration, model loading, inference execution, or default opt-in
is approved. The result always reports `compositionAllowed: false` and keeps
the fixture provider available as the regression fallback.

Concrete composition remains restricted to `apps/core-host`. Core, Desktop,
UI, contracts, and capabilities remain unchanged and provider-neutral.

## Fail-Closed Conditions

The preflight rejects:

- missing or regressed runtime acceptance and adapter isolation review;
- composition outside the approved host;
- Core Host composition or provider visibility changes;
- provider registration, execution, or default opt-in;
- runtime dependencies, downloads, model artifact access, or cache writes;
- installer creation, model bundling, runtime loading, or inference execution;
- missing fixture fallback; and
- dirty verification gates.

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
