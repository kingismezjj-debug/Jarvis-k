# Qwen Artifact/Runtime Readiness Rerun With Temp Deps Approval Request

Recorded: 2026-08-10

## Status

`PRODUCT_SECURITY_RELEASE_APPROVED_PASSED_CLEANED`

This document records Product, Security, and Release approval for a fresh
bounded window to rerun Qwen3-0.6B artifact/runtime readiness after compatible
Python dependency feasibility was proven with a temporary venv and then cleaned
up.

The approved rerun passed and all temporary dependency/artifact/cache state was
cleaned up. Evidence:

```text
docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-evidence-2026-08-10.md
docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-closeout-2026-08-10.md
```

This request does not approve Qwen product routing, default behavior changes,
Desktop/UI/IPC controls, installer/update/packaging/release behavior,
arbitrary app control, provider planner behavior, Memory vector retrieval, or
direct execution authority.

No temporary dependency environment, artifact materialization, helper startup,
model load, generation-port invocation, routing probe, or product behavior has
been performed under this request.

## Baseline

Completed no-runtime product binding:

```text
docs/qwen-fast-router-product-binding-implementation-closeout-2026-08-09.md
```

Previous artifact/runtime readiness window blocked before artifact/runtime
actions:

```text
docs/qwen-artifact-runtime-readiness-closeout-2026-08-10.md
```

Compatible Python dependency feasibility was proven but not retained:

```text
docs/qwen-compatible-python-runtime-provisioning-closeout-2026-08-10.md
```

Important baseline facts:

```text
temporary dependency feasibility: passed
temporary dependency environment retained: false
Qwen artifact materialization in prior readiness window: not_run
Qwen helper startup in prior readiness window: not_run
Qwen generation-port probe in prior readiness window: not_run
Qwen product routing: false
realQwenRuntimeEnabled: false
```

## Purpose

Run one bounded developer-alpha Qwen artifact/runtime readiness rerun that
may recreate the temporary dependency environment inside the same approval
window before attempting artifact materialization and helper readiness.

The product route source remains unchanged:

```text
active product route source: intent-router.deterministic.fixture
Qwen product routing: unavailable
realQwenRuntimeEnabled: false
default behavior changed: false
direct execution authority: false
```

## Approved Dependency Setup Choice

This rerun approval may select exactly one dependency setup path:

### Path A: Recreate Temporary Dependency Environment

Allowed work:

- create one unique system-temporary root;
- create one Python virtual environment under that temporary root;
- install only pinned packages from
  `packages/inference-runtime-transformers-local/runtime/requirements.txt`;
- scope pip cache to the temporary root where supported;
- verify import-only readiness for `torch`, `transformers`, and
  `safetensors`;
- use that temporary Python only inside this readiness window;
- delete the temporary root before closeout.

### Path B: Use Explicit Prepared Python

Allowed work:

- use one explicitly provided prepared Python executable;
- verify import-only readiness for `torch`, `transformers`, and
  `safetensors`;
- use it only inside this readiness window;
- do not record the raw Python path in evidence.

If neither path is available, stop before artifact materialization.

## Fixed Artifact Set

Only the already pinned Qwen3-0.6B artifact set may be used:

| Artifact | SHA-256 |
| --- | --- |
| `config.json` | `660db3b73d788119c04535e48cf9be5f55bc3100841a718637ae695b442f27dd` |
| `generation_config.json` | `2325da0f15bb848e018c5ae071b7943332e9f871d6b60e2ed22ca97d4cb993d2` |
| `tokenizer_config.json` | `d5d09f07b48c3086c508b30d1c9114bd1189145b74e982a265350c923acd8101` |
| `tokenizer.json` | `aeb13307a71acd8fe81861d94ad54ab689df773318809eed3cbe794b4492dae4` |
| `merges.txt` | `8831e4f1a044471340f7c0a83d7bd71306a5b867e95fd870f74d0c5308a904d5` |
| `vocab.json` | `ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910` |
| `model.safetensors` | `f47f71177f32bcd101b7573ec9171e6a57f4f4d31148d38e382306f42996874b` |

Immutable revision:

```text
c1899de289a04d12100db370d81485cdf75e47ca
```

No other artifact, shard, adapter, LoRA, model variant, cache entry, installer
asset, or dependency may be introduced.

## Exact Scope To Approve

If Product, Security, and Release approvals are provided exactly for this
window, the approved work may include only:

- run focused source/build tests for Qwen adapter, runtime helper, Core, and
  Core Host readiness contracts;
- select exactly one dependency setup path above;
- verify dependency import readiness before artifact materialization;
- create one unique system-temporary root for this window;
- materialize only the fixed seven Qwen artifacts into the temporary root;
- verify SHA-256 for every artifact before helper load;
- redirect helper cache env vars inside the temporary root only;
- start at most one supervised local helper process;
- load Qwen3-0.6B from the verified temporary artifact directory with
  local-only runtime settings;
- perform at most one bounded deterministic generation-port readiness probe
  using the existing Qwen Fast Router prompt/output contract;
- route only to sanitized intent candidates and bounded slots;
- stop or dispose the helper and remove the temporary root before closeout;
- record sanitized developer-alpha evidence only.

This window may not make Qwen available for product routing. Any readiness
routing result is evidence only and cannot trigger a user task, tool execution,
local app launch, browser opening, Memory retrieval, or UI state change.

## Explicit Exclusions

This request does not authorize:

- Qwen product routing activation;
- changing `realQwenRuntimeEnabled` to true;
- retaining a temporary venv or model artifact cache after closeout;
- persistent model cache promotion;
- Desktop/UI/IPC shipped controls;
- default behavior changes;
- allowlist expansion;
- browser, URL, local app, arbitrary process, shell, PowerShell, cmd, terminal,
  or script execution by product/runtime;
- credentials, private package indexes, provider planner, Memory write, Memory
  vector retrieval, telemetry expansion, installer, packaging, update, or
  release-channel changes;
- raw prompts, generated text, private paths, Python paths, pip logs, helper
  diagnostics, package URLs, signed URLs, credentials, tokens, vectors, stack
  traces, benchmarks, model internals, or artifact source URLs in evidence.

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  the exact approved scope;
- dependency setup cannot pass import-only readiness;
- dependency setup would require global/system/user-site Python mutation;
- dependency versions differ from pinned requirements;
- artifact revision or digest set differs from the fixed set above;
- any write escapes the unique temporary root;
- persistent cache outside the temporary root is detected;
- helper startup, model load, generation, shutdown, dispose, or cleanup is
  uncertain or fails;
- more than one generation-port readiness probe would be attempted;
- a generated output fails JSON parsing, intent validation, slot
  sanitization, confidence gating, or fallback preservation;
- any generated output would trigger a user-visible or product action;
- Qwen becomes product route source;
- Command Router defaults change;
- raw prompt/model/helper/private/path/signed/credential/log evidence would be
  recorded;
- allowlist, browser/URL, shell, filesystem, clipboard, arbitrary process,
  planner, Memory vector, telemetry, installer, update, packaging, or release
  behavior changes.

## Sanitized Evidence Contract

Evidence may contain only:

- scope id and status;
- dependency path kind and import booleans;
- Python major/minor version;
- immutable revision and fixed artifact names/digests;
- artifact count, digest verification status, and cleanup status;
- helper phase labels such as `not_started`, `passed`, `blocked`, or
  `degraded`;
- routing probe count and sanitized pass/fail reason codes;
- booleans for default change, product routing, persistent cache detection,
  direct action, credential access, network/provider use, dependency
  retention, and release behavior;
- fixed reason codes.

Evidence must not contain raw prompts, generated text, helper stdout/stderr,
private paths, Python paths, pip logs, package URLs, signed URLs, credentials,
tokens, vectors, stack traces, benchmarks, artifact source URLs, or model
internals.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window Qwen3-0.6B artifact/runtime readiness rerun scope that either recreates one temporary pinned Python dependency environment inside the window or uses one explicit prepared Python executable, then materializes only the existing approved seven-file digest-pinned Qwen artifact set in a unique temporary root, verifies digest-before-load, starts at most one supervised helper, performs at most one bounded deterministic generation-port readiness probe, records sanitized evidence only, keeps deterministic fixture routing as the active product route source, keeps Qwen unavailable for product routing, keeps realQwenRuntimeEnabled false, and makes no default behavior, UI/IPC control, allowlist, provider planner, Memory vector retrieval, installer, packaging, release-channel, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen3-0.6B artifact/runtime readiness rerun window with one temporary dependency environment or one explicit prepared Python, pinned dependency versions only, digest-before-load, unique temporary-root containment, no persistent cache promotion, at most one supervised local helper, at most one bounded deterministic generation-port readiness probe, sanitized evidence only, verified helper shutdown/dispose and cleanup, no retained venv or artifact cache unless separately approved, no credential/private-index/signed-URL retention, no raw Python path/pip log/prompt/model output/helper diagnostic/path/URL/token/vector/stack/benchmark evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary process or command-line arguments by product/runtime, no Memory write/vector retrieval, no provider planner, no allowlist expansion, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen3-0.6B artifact/runtime readiness rerun evidence only; no default behavior change, no Qwen product routing enablement, no persistent model cache, no UI/IPC shipped control, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that Qwen routing or runtime dependency support is shipped
```

## Current Decision

```text
decision: passed
reason: exact Product, Security, and Release approval lines were provided on 2026-08-10.
follow-up: bounded rerun passed with one temporary dependency setup, seven approved artifacts, one helper, one generation-port readiness probe, and cleanup.
```
