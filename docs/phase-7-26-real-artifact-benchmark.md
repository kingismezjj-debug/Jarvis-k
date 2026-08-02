# Phase 7.26 Real Artifact and Runtime Benchmark

Recorded on 2026-08-02 for the approved local embedding acceptance run.

## Scope

This wave used the approved immutable artifact plan in an explicit
acceptance-only runner. The runner:

- fetched the complete approved artifact set into a temporary directory;
- verified every file with the approved SHA-256 pin and a second read-back hash;
- matched the aggregate artifact size against the approved manifest;
- started the isolated Python Transformers child process;
- loaded the local model with network access and remote code disabled;
- captured cold load, first embedding, and warm embedding latency;
- checked vector dimensions, finite values, L2 normalization, and repeated
  output stability; and
- removed the temporary artifact directory in a `finally` path.

The runner does not register a provider, modify `apps/core-host`, change
default opt-in behavior, persist signed URLs or credentials, or retain model
files.

## Latest Runtime Result

The latest run completed with:

- artifact verification: `passed`;
- artifact count: `10`;
- total verified bytes: `1,207,470,234`;
- aggregate manifest size: matched;
- helper health: `ready`;
- model load: `583.29 ms`;
- first embedding batch: `485.22 ms`;
- warm embedding latency: p50 `459.15 ms`, p95 `466.43 ms`, 5 samples;
- embedding dimensions: `1024`;
- vector count: `5`;
- finite-value check: passed;
- L2 normalization check: passed;
- repeated-output stability: cosine `1`;
- cleanup: passed.

The latency values are machine-local acceptance observations, not product
SLOs.

## Deferred Resource Metric

Peak helper working-set capture remains `deferred`. The sanitized child-process
transport does not expose memory metrics, and the optional standard-library
probe could not obtain a sample in the current Python environment. No memory
value is claimed or persisted.

## Product Boundary

This acceptance runner is opt-in only. The fixture provider remains the
default regression path. Provider registration, execution enablement, UI or
Desktop visibility, model lifecycle integration, installer behavior, and
default opt-in remain unchanged.

## Verification

```powershell
npm.cmd run acceptance:runtime-transformers:approved-artifact
npm.cmd run smoke:runtime-transformers:fixture
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

The latest post-run verification passed with 93 test files and 464 tests.
