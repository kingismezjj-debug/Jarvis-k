# Phase 7.29 Resource Profile Product and Security Approval

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave prepares the independent product and security approval package for
the local embedding resource profile. It does not access a model artifact,
write a cache, load a model, register a provider, compose an execution
provider, enable execution, change default opt-in behavior, or modify
`apps/core-host`.

The provider-local resource gate requires a sanitized positive memory sample
from the real helper lifecycle before the resource profile can be considered
complete. The approved 2026-08-02 temporary benchmark rerun did not produce
one, so the current state remains `deferred_pending_sample`.

## Sampling Diagnostic

The acceptance runner now records only:

- bounded sampling-attempt count;
- bounded captured-sample count; and
- one fixed failure reason code when no sample is captured.

Allowed reason codes are:

- `memory_probe_failed`;
- `helper_pid_unavailable`; and
- `memory_sample_invalid`.

The runner does not print or persist process identifiers, paths, raw Windows
errors, credentials, signed URLs, model files, or cache locations. Temporary
artifacts, model directories, Python environments, and caches remain subject
to cleanup in the existing `finally` path.

## Current State

- Resource profile: `deferred_pending_sample`.
- Product approval: `approved`.
- Security approval: `approved`.
- Provider registration: disabled.
- Execution enablement: disabled.
- Default opt-in: disabled.
- Composition approval: not granted.

The new resource gate can report `ready_for_product_security_review` only after
the real-model sample is captured and cleanup/sanitization checks pass. Even
after both independent approvals are recorded, it reports only
`approved_for_composition_review`; it never grants provider composition.

## Product Approval Request

Approve only the following narrow product decision:

- the resource profile is an acceptance diagnostic, not a product SLO;
- the observed memory value may remain local and ephemeral;
- no memory value is shown in contracts, Core, Desktop, UI, provider
  visibility, or default opt-in behavior;
- the fixture provider remains the default regression path; and
- the resource profile must remain incomplete if no valid real-model sample is
  obtained.

Product approval does not authorize provider registration, execution
enablement, model lifecycle integration, installer work, or a default behavior
change.

## Security Approval Request

Approve only the following narrow security boundary:

- one explicitly approved temporary benchmark rerun;
- public pinned artifacts only, verified by SHA-256;
- temporary workspace and cache redirection only;
- no persisted credentials, signed URLs, private paths, model files, or cache;
- network and model access confined to the approved acceptance runner;
- sanitized fixed reason codes for sampling failure;
- failure cleanup on every exit path; and
- no provider registration, execution enablement, UI/Desktop exposure, or
  `apps/core-host` change.

Security approval does not authorize real product composition or any
user-facing model execution.

## Approval Record

Product approval was explicitly granted by the project owner on 2026-08-02:

- the resource profile is accepted only as a local acceptance diagnostic;
- it is not a product SLO; and
- it must not enter UI, Core, provider visibility, or default behavior.

Security approval was explicitly granted by the project owner on 2026-08-02
for exactly one temporary artifact benchmark resource-sampling run:

- public pinned artifacts only;
- SHA-256 verification required;
- temporary directory, environment, and cache only;
- failure cleanup required; and
- no provider registration, execution enablement, or default opt-in change.

The approved rerun completed the artifact and runtime benchmark successfully:

- artifact verification: passed;
- artifact count: 10;
- total verified bytes: 1,207,470,234;
- aggregate manifest size: matched;
- helper health: ready;
- model load: 479.24 ms;
- first embedding batch: 480.72 ms;
- warm embedding latency: p50 439.44 ms, p95 440.79 ms, 5 samples;
- embedding dimensions: 1024;
- vector count: 5;
- finite-value, L2 normalization, and repeated-output stability checks:
  passed;
- resource sampling attempts: 8;
- valid memory samples: 0;
- sanitized resource reason code: `memory_probe_failed`;
- artifact cleanup: passed; and
- temporary Python environment and cache cleanup: passed.

Because no valid real-model memory sample was captured, the resource profile
does not reach `approved_for_composition_review`. The approvals are recorded
as product and security decisions only; they do not grant composition.

## Verification

```powershell
node --check tests/runtime-helper-python-real-artifact-benchmark.mjs
npm.cmd run build -w @jarvis-k/inference-adapter-embedding-local
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke is not required for this preparation wave because Core Host
composition, Desktop IPC, UI DTOs, provider visibility, and startup
supervision do not change.
