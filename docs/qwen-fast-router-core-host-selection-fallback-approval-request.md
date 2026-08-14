# Qwen Fast Router Core Host Selection/Fallback Integration Approval Request

Recorded: 2026-08-07

## Status

`APPROVED_IMPLEMENTATION_PASSED`

This document requests a fresh exact-scope approval for the next Qwen Fast
Router product-spine step: Core Host selection/fallback integration. It
follows the frozen Qwen3-0.6B Fast Router alpha closeout and does not reuse
runtime/cache approval as product-routing permission.

## Context

Qwen Fast Router alpha now has developer-alpha evidence that:

- exact artifact digest pinning exists;
- the bounded generation helper can load and generate under one approved
  temporary runtime/cache window;
- the adapter can parse and sanitize router output;
- deterministic confidence calibration, local-app-vs-browser
  disambiguation, and blocked-action fail-closed post-processing are covered;
  and
- the third minimal runtime/cache rerun passed all fixed sanitized samples.

Core Host currently keeps Qwen diagnostic-only and unavailable from normal
startup. The next work should define how Core Host selects a router provider
and falls back safely, without running Qwen or changing product defaults.

## Exact Approval Requested

Approve exactly this Core Host selection/fallback integration scope:

- add a provider-neutral router selection policy inside Core Host or core
  runtime composition;
- preserve deterministic rule routing and fixture intent routing as the
  default/fallback path;
- allow Qwen only as an injected, already-constructed `IntentRoutingProvider`
  in tests or future separately approved runtime composition;
- add selection decisions for unavailable provider, low confidence, malformed
  output, model mismatch, unsafe/blocked action, timeout-like failure,
  allowlist mismatch, and successful accepted candidate;
- add sanitized selection/fallback reason codes and failure classes;
- add fixture-only tests proving fallback to deterministic rules when Qwen is
  unavailable, low-confidence, malformed, or unsafe;
- add tests proving accepted Qwen candidates still pass the existing
  BrainCommand schema, confidence gate, intent allowlist, and action
  allowlist before any dispatch result is produced;
- keep Qwen default-off and not instantiated by Core Host startup;
- update documentation with sanitized verification evidence.

## Implementation Bounds

This approval permits only implementation and fixture evidence. It may modify
Core Host/core composition code and tests needed to express selection/fallback
policy.

The implementation must keep:

- no Qwen artifact download, fetch, materialization, load, generation, helper
  startup, or runtime/cache execution;
- no persistent model cache, cache promotion, installer cache, update cache,
  or release artifact;
- no new environment variable that alone enables Qwen product routing;
- no Desktop IPC, preload, UI, settings, telemetry, packaging, installer,
  update, release-channel, or production-readiness behavior;
- no cloud planner fallback call;
- no Memory write or vector write;
- no direct browser, local app, shell, filesystem, network, OCR, voice, or
  tool execution from model/router output;
- no dynamic provider download or discovery;
- no tester expansion or real user task execution; and
- no raw prompt, raw model output, helper diagnostics, private paths, URLs,
  credentials, stack traces, model internals, logits, vectors, benchmarks, or
  user-private data in reports or docs.

## Selection/Fallback Contract

The selection policy should produce sanitized evidence equivalent to:

- selected provider id;
- fallback provider id, when used;
- decision status: `accepted`, `fallback`, `blocked`, or `unavailable`;
- reason code from a fixed allowlist;
- failure class from a fixed allowlist;
- confidence band, not raw confidence traces beyond bounded public schema
  values;
- whether rules/fixture fallback was used; and
- whether direct action execution was attempted, always `false` in this scope.

Expected fail-closed behavior:

- provider unavailable -> deterministic rules or fixture fallback;
- provider throws -> deterministic rules or fixture fallback with sanitized
  failure class;
- malformed candidate -> deterministic rules or fixture fallback;
- confidence below threshold -> deterministic rules or fixture fallback;
- unsupported intent -> deterministic rules or fixture fallback;
- unsafe/destructive command -> `blocked` or existing safety-gated result;
- accepted candidate -> still requires BrainCommand schema validation,
  confidence threshold, intent allowlist, and action allowlist.

## Required Tests

At minimum, this scope should add fixture-only regression coverage for:

- Qwen diagnostic/unconfigured startup remains non-instantiating;
- accepted Qwen browser/local-app/status/blocked candidates can be selected
  when an injected fixture provider returns valid candidates;
- low-confidence Qwen candidate falls back to deterministic rules;
- malformed/throwing Qwen provider falls back with sanitized failure class;
- unsupported intent is rejected before dispatch;
- unsafe or blocked action does not execute directly;
- rule/fixture fallback remains available when Qwen is absent; and
- sensitive values are not exposed in selection/fallback reports.

## Stop Conditions

Stop immediately and do not continue implementation if any of these occur:

- the implementation requires real Qwen artifact materialization, helper
  startup, generation, or cache access;
- Core Host startup would instantiate the real `QwenFastRouterProvider`;
- Qwen becomes default-on or selectable by a single environment flag;
- Desktop IPC, UI, telemetry, installer, update, release-channel, or
  production behavior changes are required;
- model/router output would execute actions directly;
- fallback to deterministic rules or fixture routing cannot be preserved;
- sanitized reports would expose raw model output, prompts, diagnostics,
  paths, URLs, credentials, stack traces, model internals, vectors, or
  user-private data; or
- tests require network, real artifact, real helper, cloud planner, or real
  user task execution.

## Explicitly Not Authorized

This approval does not authorize:

- another Qwen runtime/cache acceptance run;
- product default enablement of Qwen;
- persistent model cache promotion;
- Core Host real Qwen startup wiring;
- UI/IPC exposure or settings toggles;
- real browser/local-app/tool/shell/filesystem/network execution;
- cloud planner fallback;
- Memory writes;
- telemetry persistence or export;
- tester expansion;
- installer/update/package/release-channel changes; or
- production readiness.

## Role Requests

**Product.** Approve exactly this Qwen Fast Router Core Host
selection/fallback integration scope. It may add provider-neutral selection
policy, fixture-only evidence, accepted-candidate routing checks, and
fail-closed fallback behavior. It must keep deterministic rules/fixture
routing as default and must not run real user tasks, expand testers, enable
Qwen by default, or execute actions directly from model output.

**Security.** Approve exactly this bounded, fail-closed, fixture-only Core
Host router selection/fallback scope. It must not materialize artifacts, start
helpers, access runtime/cache, persist model state, expose raw prompts/model
output/diagnostics/paths/credentials, or allow direct action execution.
Unsafe, malformed, low-confidence, unavailable, or unsupported provider output
must fall back safely or block.

**Release.** Approve implementation and fixture evidence only. Exclude
runtime/cache runs, installer, update, package, default configuration, UI/IPC,
telemetry, release-channel, product availability, and production-readiness
changes.

## Approval Lines To Provide

```text
Product: APPROVE exactly this Qwen Fast Router Core Host selection/fallback integration scope with deterministic rules/fixture fallback preserved and no default/action-execution behavior
Security: APPROVE exactly this bounded fail-closed fixture-only Core Host router selection/fallback scope with no artifact/helper/runtime/cache access and sanitized evidence only
Release: APPROVE implementation and fixture evidence only; no runtime/cache/default/UI/IPC/telemetry/installer/update/release changes
```

## Next Step After Approval

After all three exact approval lines are received, implement the Core Host
selection/fallback policy and fixture-only tests. Do not run Qwen, materialize
artifacts, start helpers, enable product defaults, expose UI/IPC, or execute
actions from router output.

## Approval Record

The following explicit approvals were received on 2026-08-07 in the current
task:

| Role | Status | Approval evidence |
| --- | --- | --- |
| Product | APPROVED | Exactly this Qwen Fast Router Core Host selection/fallback integration scope with deterministic rules/fixture fallback preserved and no default/action-execution behavior |
| Security | APPROVED | Exactly this bounded fail-closed fixture-only Core Host router selection/fallback scope with no artifact/helper/runtime/cache access and sanitized evidence only |
| Release | APPROVED | Implementation and fixture evidence only; no runtime/cache/default/UI/IPC/telemetry/installer/update/release changes |

## Implementation Evidence

The approved fixture-only implementation completed without Qwen artifact,
helper, runtime/cache, UI/IPC, telemetry, default, installer, update, or
release behavior changes.

Implemented:

- optional `routerSelection` report on `BrainCommandResult`;
- fixed selection statuses: `accepted`, `fallback`, `blocked`, and
  `unavailable`;
- fixed sanitized reason codes and failure classes for provider accepted,
  unavailable, preflight blocked, provider failed, invalid result, missing
  candidate, unsupported intent, confidence low, allowlist mismatch, and
  unsafe/blocked;
- Core runtime selection reports with `directActionAttempted=false`;
- fallback to deterministic rules when provider output is unavailable,
  invalid, throwing, unsupported, allowlist-mismatched, or low-confidence;
- accepted provider candidates still pass BrainCommand schema validation,
  confidence threshold, intent allowlist, slot normalization, and existing
  dispatch safety gates; and
- fixture-only tests for accepted browser/local-app/status/blocked candidates,
  low confidence fallback, invalid result fallback, throwing provider
  fallback, unsupported intent fallback, allowlist mismatch fallback, no
  provider fallback, and blocked intent not dispatching browser/app actions.

Verification:

- `npm run build:contracts`: `passed`;
- `npm run build:core`: `passed`;
- `npm run build:core-host`: `passed`;
- `vitest packages/contracts/test/protocol.test.ts`: `28 passed`;
- `vitest packages/core/test/runtime.test.ts`: `51 passed`; and
- `vitest apps/core-host/test/qwen-fast-router-wiring.test.ts`: `1 passed`;
- `npm run check:boundaries`: `passed`; and
- `npm run check:sensitive-artifacts`: `passed`.

The same source and documentation changes were synced to `E:\Jarvis-K`, where
the same contracts/core/core-host builds, focused tests, boundary check, and
sensitive-artifact guard passed.

The Core Host startup guard still verifies that startup does not instantiate
`QwenFastRouterProvider`. No real Qwen model was run, no artifact was
materialized, no helper was started, and no runtime/cache acceptance command
was executed.

The sanitized evidence retained no raw prompts, raw model output, helper
diagnostics, private paths, URLs, credentials, stack traces, model internals,
logits, vectors, benchmarks, or user-private data.
