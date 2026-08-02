# Phase 7.30 Memory Sampling Gap Disposition

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave formally dispositions the real helper lifecycle memory sampling gap
observed during the approved Phase 7.29 temporary artifact benchmark rerun.
It does not access model artifacts, write caches, load a model, register a
provider, compose an execution provider, enable execution, change default
opt-in behavior, expose resource values, or modify `apps/core-host`.

## Disposition

The approved benchmark completed artifact verification, runtime loading,
embedding quality checks, latency capture, and cleanup. The resource sampler
made bounded attempts but captured no valid memory sample and reported the
sanitized reason code `memory_probe_failed`.

The disposition is:

- the sampling gap is accepted as a known local diagnostic limitation;
- no memory metric value is claimed, persisted, exposed, or promoted to a
  product SLO;
- the resource profile remains incomplete;
- the `benchmarks.local_resource_profile` readiness gate remains unsatisfied;
- provider composition remains blocked; and
- the fixture provider remains the regression and fallback path.

## Guard

Added a provider-local disposition guard that accepts only the narrow deferred
case:

- approved temporary benchmark completed;
- artifact verification passed;
- runtime benchmark passed;
- temporary workspace and cache cleanup passed;
- no valid memory sample was captured;
- sample count remains zero;
- sanitized reason code is one of the approved fixed codes;
- product and security approvals are both recorded;
- resource metric values remain hidden and unpersisted; and
- Core Host composition, provider registration, execution, and default opt-in
  remain disabled.

Even when accepted, the guard returns:

- `resourceProfileComplete: false`;
- `readinessSatisfied: false`;
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

Do not enter provider composition from this disposition alone. A future wave
must either capture valid resource evidence with a separately approved method
or make a separate product, security, and release decision to replace the
resource-profile requirement before `apps/core-host` can register or enable
the real provider.
