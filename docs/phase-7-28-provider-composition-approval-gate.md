# Phase 7.28 Provider Composition Approval Gate

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave enters a separate provider-local approval gate for composition. The
gate consumes the existing runtime acceptance, adapter isolation, composition
preflight, and readiness evidence. It creates a sanitized review handoff only.

The gate does not modify `apps/core-host`, register a real provider, compose an
execution provider, enable execution, change default opt-in behavior, expose
provider visibility, access artifacts, write a cache, load a model, or create
an installer.

## Current Handoff

The review boundary is accepted for evaluation. After Phase 7.31, the handoff
can be classified as `ready_for_manual_composition_approval` when all existing
readiness evidence is supplied with the approved alternative resource evidence.

Phase 7.26 latency, quality, normalization, stability, temporary artifact
cleanup, and model-load evidence is complete. Phase 7.27 hardened the Windows
probe and verified it against a temporary non-model child, but the configured
real-model rerun still produced no valid lifecycle memory sample. Phase 7.30
formally dispositioned that sampling gap as a deferred local diagnostic
limitation. Phase 7.31 approves bounded sampling attempts, successful runtime
benchmark completion, cleanup, and the sanitized `memory_probe_failed` reason
code as alternative local resource evidence for composition review only. No
memory value is claimed or persisted.

## Gate Semantics

The provider-local gate reports:

- `reviewBoundaryAccepted: true` only when the composition preflight is
  accepted, verification is clean, the fallback provider is preserved, and
  no composition or execution mutation is present;
- `readyForManualCompositionApproval: false` while any readiness key remains
  pending;
- `compositionApprovalGranted: false` in every review-only result;
- `compositionAllowed: false`;
- `providerRegistrationEnabled: false`;
- `executionEnabled: false`; and
- `defaultOptInEnabled: false`.

Even after every readiness key is complete, the gate produces only
`ready_for_manual_composition_approval`. A separate product and security
approval is still required before an implementation wave may change
`apps/core-host`.

## Boundary Review

- The dedicated Transformers runtime package remains provider-local.
- `apps/core-host` remains the only concrete composition root.
- Core continues to consume injected provider ports.
- The fixture provider remains the regression fallback.
- Desktop, IPC, UI, contracts, and capabilities remain unchanged.
- No model output is converted into PowerShell or Windows operations.
- No credentials, signed URLs, private paths, model files, or model caches are
  included in the handoff.

## Required Approval Before Composition

Before a later composition implementation wave:

1. Confirm the accepted Phase 7.31 alternative resource evidence.
2. Reconfirm runtime acceptance, adapter isolation, packaging, license, and
   benchmark evidence.
3. Review the exact `apps/core-host` composition diff and explicit opt-in
   behavior.
4. Confirm fixture fallback, sanitized errors, resource lease enforcement, and
   startup/restart behavior.
5. Obtain separate product and security approval for provider registration and
   execution enablement.

Phase 7.32 records items 1-4 as implementation review materials and produces
only `ready_for_product_security_composition_approval`. Item 5 remains a
separate hard pause before any `apps/core-host` composition change, provider
registration, execution enablement, provider visibility change, or default
opt-in behavior change.

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
