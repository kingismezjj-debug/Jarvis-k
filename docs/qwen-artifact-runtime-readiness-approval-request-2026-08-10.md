# Qwen Artifact/Runtime Readiness Approval Request

Recorded: 2026-08-10

## Status

`PRODUCT_SECURITY_RELEASE_APPROVED_BLOCKED_PREFLIGHT`

This document records Product, Security, and Release approval for a separate
Qwen artifact/runtime readiness window. It does not approve product routing
through Qwen, product default changes, installer/update/packaging/release
behavior, arbitrary app control, or any direct execution authority.

The approved readiness run blocked during preflight before artifact
materialization, helper startup, or generation-port invocation. Evidence:

```text
docs/qwen-artifact-runtime-readiness-evidence-2026-08-10.md
docs/qwen-artifact-runtime-readiness-closeout-2026-08-10.md
```

No artifact materialization, helper startup, generation port invocation,
network/provider call, credential access, cache promotion, UI/IPC change, or
runtime action has been performed under this request.

## Baseline

Completed no-runtime product binding:

```text
docs/qwen-fast-router-product-binding-implementation-closeout-2026-08-09.md
```

Frozen prior Qwen alpha evidence:

```text
docs/qwen3-0.6b-exact-artifact-digest-pinning-approval-request.md
docs/qwen3-0.6b-temporary-materialization-generation-helper-runtime-approval-request.md
docs/qwen3-0.6b-fast-router-alpha-closeout.md
```

The prior runtime window is historical degraded evidence only. It is not reused
as permission for this new window.

## Purpose

Prepare a bounded developer-alpha readiness window that may validate whether
Qwen artifact/runtime prerequisites are ready for a later product-routing
decision while keeping Command Router product behavior unchanged:

```text
active Command Router route source: intent-router.deterministic.fixture
Qwen product routing: unavailable
realQwenRuntimeEnabled: false
default behavior changed: false
direct execution authority: false
```

## Exact Scope To Approve

If Product, Security, and Release approvals are provided exactly for this
window, the approved work may include only:

- verify the existing approved seven-file Qwen3-0.6B artifact pin set and
  immutable revision from local docs/source;
- inspect local source/tests for the existing runtime helper, generation port,
  provider adapter, lifecycle gates, and fallback contracts;
- optionally run source/build/unit tests that do not start Qwen, materialize
  artifacts, or call a generation port;
- optionally create one unique system-temporary root only for readiness probes
  explicitly approved below;
- optionally materialize only the approved seven Qwen3-0.6B artifacts into that
  temporary root after digest-before-load checks are in place;
- redirect child-process cache env vars inside that temporary root only if a
  helper readiness probe is explicitly approved;
- start at most one supervised local helper process only for bounded readiness
  probing after all artifact digests pass;
- perform at most one bounded deterministic generation-port readiness probe
  using the existing Qwen Fast Router prompt/output contract;
- stop the helper and verify temporary-root cleanup before the window closes;
- record sanitized developer-alpha evidence only.

This window may not make Qwen available for product routing. Any routing result
from a readiness probe is evidence only and cannot trigger user task execution,
tool execution, local app launch, browser opening, Memory retrieval, or UI
state changes beyond documentation.

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

## Explicit Exclusions

This request does not authorize:

- Qwen product routing activation;
- changing `realQwenRuntimeEnabled` to true in product status;
- Desktop/UI/IPC controls that enable Qwen;
- persistent model cache promotion;
- product download/install/update code paths;
- default behavior changes;
- allowlist expansion;
- browser, URL, shell, PowerShell, cmd, terminal, arbitrary process, arbitrary
  executable path, or command-line argument behavior;
- filesystem/clipboard/process enumeration beyond approved temporary-root and
  helper cleanup verification;
- credential access;
- cloud provider planner calls;
- Memory write or vector retrieval;
- raw prompt, raw model output, helper diagnostics, private path, URL, token,
  vector, stack trace, or benchmark evidence;
- telemetry expansion;
- installer, update, packaging, release-channel, or production-facing claims.

## Required Verification After Approval

The exact verification list should be finalized only after approval. The
default candidate list is:

```powershell
npx.cmd vitest run apps/core-host/test/qwen-fast-router-composition.test.ts apps/core-host/test/qwen-fast-router-generation-port.test.ts apps/core-host/test/qwen-fast-router-wiring.test.ts packages/core/test/runtime.test.ts packages/inference-adapter-qwen-router/test/*.test.ts
npm.cmd run build:contracts
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:desktop
```

If a helper readiness probe is approved, add only the existing bounded Qwen
acceptance runner for this window and record sanitized status labels.

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  the exact approved scope;
- artifact revision or digest set differs from the fixed set above;
- any write escapes the unique temporary root;
- persistent cache outside the temporary root is detected;
- helper startup/load/generation/shutdown/cleanup is uncertain or fails;
- a generation result fails JSON parsing, intent validation, slot
  sanitization, confidence gating, or fallback preservation;
- any generated output would trigger a user-visible action;
- Qwen becomes product route source;
- Command Router defaults change;
- raw prompt/model/helper/private/signed/credential evidence would be recorded;
- allowlist, browser/URL, shell, filesystem, clipboard, arbitrary process,
  planner, Memory vector, telemetry, installer, update, packaging, or release
  behavior changes.

## Sanitized Evidence Contract

Evidence may contain only:

- scope id and status;
- immutable revision and fixed artifact names/digests;
- artifact count, digest verification status, and cleanup status;
- helper phase labels such as `not_started`, `passed`, `blocked`, or
  `degraded`;
- routing probe count and per-probe sanitized pass/fail reason codes;
- booleans for default change, product routing, persistent cache detection,
  direct action, credential access, network/provider use, and release behavior;
- fixed reason codes.

Evidence must not contain raw prompts, generated text, helper stdout/stderr,
private paths, signed URLs, credentials, tokens, vectors, stack traces,
benchmarks, or model internals.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window Qwen3-0.6B artifact/runtime readiness scope using only the existing approved seven-file digest-pinned artifact set and immutable revision, existing Qwen adapter/helper/generation-port contracts, existing Core selection/fallback contracts, and existing Command Router safety gates; keep deterministic fixture routing as the active product route source, keep Qwen unavailable for product routing, keep realQwenRuntimeEnabled false, and make no default behavior, UI/IPC control, allowlist, browser/URL, shell, arbitrary process, provider planner, Memory vector retrieval, installer, packaging, release-channel, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen3-0.6B artifact/runtime readiness window with digest-before-load, unique temporary-root containment, no persistent cache promotion, at most one supervised local helper readiness probe, at most one bounded deterministic generation-port readiness probe, sanitized evidence only, verified helper shutdown and cleanup, no credential exposure, no raw prompt/model output/helper diagnostic/path/URL/token/vector/stack/benchmark evidence, no browser or URL opening, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments, no filesystem/clipboard/process enumeration beyond approved temporary-root/helper cleanup verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen3-0.6B artifact/runtime readiness evidence only; no default behavior change, no Qwen product routing enablement, no persistent model cache, no UI/IPC shipped control, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that Qwen routing is supported
```

## Current Decision

```text
decision: blocked preflight
reason: exact Product, Security, and Release approval lines were provided on 2026-08-10, but the runtime dependency preflight reported QWEN_RUNTIME_DEPENDENCY_UNAVAILABLE before artifact/runtime actions.
follow-up: open a separate runtime dependency preparation window before rerunning helper readiness.
```
