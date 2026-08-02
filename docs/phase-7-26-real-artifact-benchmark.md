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

The latest rerun completed with:

- artifact verification: `passed`;
- artifact count: `10`;
- total verified bytes: `1,207,470,234`;
- aggregate manifest size: matched;
- helper health: `ready`;
- Python environment: Python `3.14.4`, Transformers `5.14.1`,
  Torch `2.13.0+cpu`, Safetensors `0.8.0`;
- model load: `475.90 ms`;
- first embedding batch: `482.38 ms`;
- warm embedding latency: p50 `438.82 ms`, p95 `441.24 ms`, 5 samples;
- embedding dimensions: `1024`;
- vector count: `5`;
- finite-value check: passed;
- L2 normalization check: passed;
- repeated-output stability: cosine `1`;
- cleanup: passed.

The latency values are machine-local acceptance observations, not product
SLOs.

## Deferred Resource Metric

Peak helper working-set capture remains `deferred`. The hardened Windows probe
captured a positive sample from a dependency-ready helper health process, but
did not obtain a valid sample during the real artifact model lifecycle. No
memory value is claimed or persisted.

The approved Python environment was created transiently under the system
temporary directory with pip and Hugging Face caches redirected there. The
environment, caches, and artifact directory were removed after the rerun.

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

The repository verification baseline remains 93 test files and 464 tests. The
acceptance rerun itself also rebuilt both provider-local packages and completed
with cleanup passed.
