# Phase 7.31 Alternative Resource Evidence

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave records the approved alternative resource evidence path for the
local embedding resource-profile requirement. It consumes the Phase 7.30
deferred memory sampling disposition and the explicit product and security
approvals for using bounded sampling attempts, successful runtime benchmark
completion, cleanup, and a sanitized failure reason code as local acceptance
diagnostic evidence.

This wave does not access model artifacts, write caches, load a model,
register a provider, compose an execution provider, enable execution, change
default opt-in behavior, expose resource values, modify `apps/core-host`, or
create a product SLO.

## Approval Record

Product approval allows the alternative evidence only as a local acceptance
diagnostic:

- bounded sampling attempts;
- successful runtime benchmark;
- cleanup completion; and
- sanitized failure reason code.

The evidence is not a product SLO and must not enter UI, Core, provider
visibility, or default behavior.

Security approval allows the Phase 7.30 disposition to satisfy the
resource-profile requirement only for entering provider composition review.
It does not authorize provider registration, execution enablement, model
artifact lifecycle integration, installer behavior, or default opt-in changes.

## Guard

Added a provider-local alternative evidence guard. It accepts only when:

- the Phase 7.30 disposition is accepted and deferred;
- the original resource profile remains incomplete;
- the original disposition still reports readiness unsatisfied;
- product and security approvals are explicitly present;
- bounded sampling attempts, successful runtime benchmark, cleanup, and
  sanitized failure reason evidence are accepted;
- no product SLO is created;
- UI/Core exposure is disabled; and
- provider registration, execution, and default opt-in remain disabled.

When accepted, the guard returns
`satisfiesResourceProfileRequirementForCompositionReview: true`, but still
returns:

- `compositionReviewOnly: true`;
- `productSloCreated: false`;
- `uiOrCoreExposureEnabled: false`;
- `compositionAllowed: false`;
- `providerRegistrationEnabled: false`;
- `executionEnabled: false`; and
- `defaultOptInEnabled: false`.

## Readiness Result

The local embedding readiness provider may now satisfy
`benchmarks.local_resource_profile` with accepted alternative evidence. With
the existing runtime acceptance, adapter isolation, composition preflight,
artifact, license, packaging, and manifest evidence, the provider-local
composition gate can report `ready_for_manual_composition_approval`.

That status is still review-only:

- `compositionApprovalGranted: false`;
- `compositionAllowed: false`;
- `providerRegistrationEnabled: false`;
- `executionEnabled: false`; and
- `defaultOptInEnabled: false`.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/inference-adapter-embedding-local
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke is not required for this wave because Core Host composition,
Desktop IPC, UI DTOs, provider visibility, and startup supervision do not
change.

## Next Hard Pause

Do not register the real provider or modify `apps/core-host` from this wave.
A separate composition implementation wave must review the exact Core Host
diff, explicit opt-in behavior, fixture fallback, sanitized errors, resource
lease enforcement, startup/restart behavior, and provider visibility before
any real provider is composed.
