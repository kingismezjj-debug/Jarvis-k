# Qwen Product Routing Activation Policy Approval Request

Recorded: 2026-08-10

## Status

`PRODUCT_SECURITY_RELEASE_APPROVED_PREPARED`

This document records Product, Security, and Release approval for a separate
Qwen product-routing activation policy window. It is a policy/readiness
planning window only. It does not approve product routing implementation, Qwen
product runtime startup, retained dependency environment, retained model cache,
Desktop/UI/IPC controls, default behavior changes, or release-facing claims.

The policy packet is prepared. Evidence:

```text
docs/qwen-product-routing-activation-policy-evidence-2026-08-10.md
docs/qwen-product-routing-activation-policy-packet-2026-08-10.md
docs/qwen-product-routing-activation-policy-closeout-2026-08-10.md
```

No code, runtime, artifact, helper, generation port, product status, UI/IPC, or
product route behavior has been changed under this request.

## Baseline

No-runtime product binding implementation is complete:

```text
docs/qwen-fast-router-product-binding-implementation-closeout-2026-08-09.md
```

Artifact/runtime readiness rerun passed as developer-alpha evidence only:

```text
docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-closeout-2026-08-10.md
```

Accepted Command Router safety gates:

```text
docs/command-router-real-local-app-allowlist-closeout-2026-08-09.md
docs/command-router-voice-manual-acceptance-closeout-2026-08-09.md
```

Current invariant:

```text
active product route source: intent-router.deterministic.fixture
Qwen product routing: false
realQwenRuntimeEnabled: false
Qwen readiness: passed evidence only
Qwen dependency/artifact/cache retained: false
```

## Purpose

Prepare the policy packet required before any future Qwen product-routing
activation implementation. The output should answer:

- what gates must be true before Qwen can be a candidate product route source;
- how deterministic fixture fallback remains available;
- how low confidence, invalid output, timeout, helper failure, cleanup failure,
  or safety gate failure falls closed;
- how product status should distinguish readiness, armed runtime, and active
  product routing;
- how one-window manual acceptance should be scoped;
- what evidence may be recorded without exposing raw prompts, generated text,
  paths, helper diagnostics, tokens, vectors, or benchmark data.

## Exact Scope To Approve

If Product, Security, and Release approvals are provided exactly for this
policy window, the approved work may include only:

- inspect local source/docs/tests for Qwen readiness, Command Router safety,
  Core selection/fallback, and product status contracts;
- draft a default-off activation policy;
- define activation gates for dependency readiness, artifact digest readiness,
  lifecycle readiness, helper readiness, generation-port readiness, selection
  policy readiness, fallback preservation, safety-gate preservation, cleanup
  verification, and explicit product approval;
- define sanitized product status fields for `ready`, `armed`, `active`,
  `fallback`, `blocked`, and `degraded` states;
- define one-window implementation/acceptance criteria for a later approval;
- define rollback/disable criteria;
- define sanitized evidence requirements;
- run source-only/focused tests and builds that do not start Qwen, materialize
  artifacts, create dependency envs, call helper, or invoke generation port;
- write approval/evidence/closeout docs.

## Explicit Exclusions

This request does not authorize:

- changing `realQwenRuntimeEnabled` to true;
- selecting Qwen as an active product route source;
- creating or retaining Python dependency environments;
- materializing Qwen artifacts;
- starting helper processes;
- loading Qwen;
- invoking generation port;
- adding Desktop/UI/IPC controls;
- changing product defaults;
- allowlist expansion;
- browser, URL, local app, arbitrary process, shell, PowerShell, cmd, terminal,
  or script execution by product/runtime;
- credentials, provider planner, Memory write, Memory vector retrieval,
  telemetry expansion, installer, packaging, update, release-channel behavior,
  or production-facing claims;
- raw prompt, generated text, helper diagnostic, Python path, private path,
  package log, artifact source URL, signed URL, token, vector, stack trace,
  benchmark, or model internals in evidence.

## Policy Output Requirements

The policy packet must keep these requirements explicit:

```text
default-off preserved: true
deterministic fallback preserved: true
Qwen direct action authority: false
Command Router safety gates preserved: true
Qwen output can only propose sanitized intent candidates and bounded slots
local app allowlist remains exactly Notepad/Calculator
browser/URL remains blocked unless separately approved
Memory vector retrieval remains unavailable
provider planner remains unavailable
Qwen readiness evidence does not equal product activation
```

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  the exact policy scope;
- policy work requires implementation changes;
- Qwen would become active product route source;
- runtime/helper/artifact/dependency/generation work would be required;
- UI/IPC/default/release behavior would change;
- direct action authority, allowlist expansion, provider planner, Memory
  vector retrieval, browser/URL opening, shell, or arbitrary process behavior
  enters scope;
- raw prompt/model/helper/path/URL/token/vector/log/benchmark evidence would be
  recorded.

## Sanitized Evidence Contract

Evidence may contain only:

- policy status;
- reviewed baselines;
- activation gate names and boolean expected values;
- state-machine names and fixed reason codes;
- test/build status;
- product behavior booleans such as Qwen product routing, default change,
  UI/IPC change, retained dependency/cache, direct action authority, and release
  behavior.

Evidence must not contain raw prompts, generated text, helper diagnostics,
Python paths, private paths, package logs, artifact source URLs, signed URLs,
credentials, tokens, vectors, stack traces, benchmarks, or model internals.

## Approval Lines To Provide

```text
Product: APPROVE exactly this Qwen product-routing activation policy preparation scope using existing passed Qwen readiness evidence, existing no-runtime product binding, existing Core selection/fallback contracts, and existing Command Router safety gates to draft default-off activation policy, gates, status states, acceptance criteria, rollback criteria, and sanitized evidence requirements only; no Qwen product routing implementation, no realQwenRuntimeEnabled true, no runtime/helper/artifact/dependency environment creation or retention, no generation-port invocation, no UI/IPC control, no default behavior change, no allowlist expansion, no provider planner, no Memory vector retrieval, no installer, packaging, release-channel, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen product-routing activation policy preparation window with source/docs/test review only, sanitized evidence only, no credential access, no raw prompt/model output/helper diagnostic/Python path/private path/package log/URL/token/vector/stack/benchmark evidence, no dependency environment creation, no artifact materialization, no helper startup, no model load, no generation-port invocation, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary process or command-line arguments by product/runtime, no Memory write/vector retrieval, no provider planner, no allowlist expansion, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen product-routing activation policy evidence only; no default behavior change, no Qwen product routing enablement, no persistent dependency environment or model cache, no UI/IPC shipped control, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that Qwen routing is supported
```

## Current Decision

```text
decision: prepared
reason: exact Product, Security, and Release approval lines were provided on 2026-08-10.
follow-up: open a separate implementation approval before any product-routing activation code or runtime behavior.
```
