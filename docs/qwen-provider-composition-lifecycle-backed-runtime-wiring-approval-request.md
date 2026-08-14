# Qwen Provider Composition and Lifecycle-Backed Runtime Wiring Approval Request

Recorded: 2026-08-07

## Status

`APPROVED_IMPLEMENTATION_PASSED`

This document requests a fresh exact-scope approval for the next Qwen Fast
Router product-spine step: provider composition and lifecycle-backed runtime
wiring. It follows the frozen Qwen Fast Router runtime/cache alpha and the
frozen Core Host selection/fallback integration.

This approval request is for implementation and fixture/simulated evidence
only. It does not authorize a real Qwen runtime/cache run. A separate
one-window runtime/cache approval is still required before any real helper
startup, model load, artifact materialization, generation call, warm reuse
acceptance, persistent cache promotion, or product routing with a real Qwen
provider.

## Context

Already completed:

- Qwen artifact digest pinning for `Qwen/Qwen3-0.6B` at
  `c1899de289a04d12100db370d81485cdf75e47ca`;
- one approved third minimal runtime/cache rerun passed with sanitized
  developer-alpha evidence;
- `QwenFastRouterProvider` exists as a runtime-neutral adapter with an
  injected bounded generation port;
- `CoreHostQwenFastRouterGenerationPort` exists but is not wired into startup;
- Core Host diagnostic registration keeps Qwen unavailable unless all future
  gates explicitly pass;
- Core runtime selection/fallback evidence exists and falls back safely to
  deterministic rules; and
- Core Host startup guard verifies that startup does not instantiate the real
  Qwen provider today.

The next implementation step should define the gated composition path without
actually running a real model.

## Exact Approval Requested

Approve exactly this implementation scope:

- add a Core Host Qwen provider composition module or factory that can compose
  `QwenFastRouterProvider` only when all explicit gates are satisfied;
- require explicit Qwen enablement, exact artifact digest approval,
  model lifecycle readiness, runtime generation-port readiness, and selection
  policy readiness before returning an available provider;
- keep the real provider unconstructed when any gate is missing;
- keep deterministic rules and fixture intent routing as fallback;
- wire only descriptor/configuration/report-shaped evidence into startup by
  default;
- add a simulated or fixture generation-port path for tests that proves
  lifecycle-backed composition can return an injected provider without real
  helper, artifact, cache, or model execution;
- add tests for every gate: disabled, missing artifact approval, missing
  lifecycle readiness, missing runtime port, model mismatch, low confidence,
  provider unavailable, provider accepted, and rollback/fallback preservation;
- preserve sanitized `routerSelection` evidence when an injected composed
  provider is accepted or falls back;
- preserve Core Host startup behavior that does not instantiate real Qwen
  unless explicitly constructed by the approved composition path;
- update docs with fixture-only verification evidence.

## Implementation Bounds

This approval permits only code and tests for bounded composition logic. It
may modify Core Host composition code, core runtime options, contracts only if
needed for sanitized report-shaped evidence, and fixture-only tests.

The implementation must keep:

- no real Qwen artifact download, fetch, materialization, load, generation, or
  helper startup;
- no runtime/cache acceptance command;
- no persistent model cache, cache promotion, installer cache, update cache,
  or release artifact;
- no automatic lifecycle install, activate, rollback, cleanup, or model
  download;
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

## Required Gates

The composition path must fail closed unless all required gates are true:

- `qwen.enablement.explicit`: Qwen composition explicitly enabled for the
  bounded path;
- `qwen.artifact_digest_approved`: exact pinned artifact digest set approved;
- `qwen.model_lifecycle_ready`: lifecycle has marked the exact model version
  ready;
- `qwen.runtime_generation_port_ready`: a bounded generation port is supplied;
- `qwen.selection_policy_ready`: Core runtime selection/fallback policy is
  available;
- `qwen.default_off_preserved`: default startup remains unchanged; and
- `qwen.fallback_preserved`: deterministic rules/fixture fallback remains
  available.

Any missing gate must return an unavailable/unconfigured report and must not
instantiate the real provider.

## Simulated Composition Evidence

The fixture-only tests may use:

- a fake lifecycle readiness report;
- a fake digest-approval boolean;
- a fake bounded generation port that returns fixed sanitized JSON;
- an injected `QwenFastRouterProvider` created only inside tests; and
- no real artifact, helper, model, cache, network, or runtime.

The simulated evidence may contain only:

- gate statuses;
- provider status: `available`, `unconfigured`, or `disabled`;
- fixed reason codes;
- selection/fallback report-shaped values;
- test counts and pass/fail status; and
- booleans confirming no default, UI/IPC, runtime/cache, action execution, or
  release behavior changed.

It must not contain raw prompts, raw generated text, helper stdout/stderr,
paths, URLs, credentials, stack traces, model internals, logits, vectors,
benchmarks, or user-private data.

## Stop Conditions

Stop immediately and do not continue implementation if any of these occur:

- implementation requires real artifact materialization, helper startup,
  generation, runtime/cache execution, lifecycle install, lifecycle activate,
  or network access;
- startup would instantiate `QwenFastRouterProvider` by default;
- one environment flag alone would enable real Qwen routing;
- deterministic rules or fixture fallback cannot be preserved;
- UI/IPC, Desktop preload, settings, telemetry, installer, update,
  release-channel, or production behavior is required;
- model/router output would directly execute actions;
- reports would expose raw model output, prompts, diagnostics, paths, URLs,
  credentials, stack traces, model internals, vectors, benchmarks, or
  user-private data; or
- tests require a real Qwen model, artifact, helper, cloud planner, network,
  or real user task.

## Explicitly Not Authorized

This approval does not authorize:

- real Qwen runtime/cache acceptance;
- Qwen artifact download or materialization;
- helper startup, model load, generation, warm reuse, or session residency;
- lifecycle install, activation, rollback, cleanup, or persistent cache use;
- product default enablement of Qwen;
- UI/IPC exposure or settings toggles;
- real browser/local-app/tool/shell/filesystem/network execution;
- cloud planner fallback;
- Memory writes;
- telemetry persistence or export;
- tester expansion;
- installer/update/package/release-channel changes; or
- production readiness.

## Role Requests

**Product.** Approve exactly this Qwen provider composition and
lifecycle-backed runtime wiring implementation scope. It may add gated
composition logic, simulated lifecycle/digest/runtime-port checks,
fixture-only tests, and selection/fallback evidence. It must keep Qwen
default-off, preserve deterministic rules/fixture fallback, avoid real user
tasks, and avoid action execution from model output.

**Security.** Approve exactly this bounded, fail-closed, no-runtime Qwen
provider composition scope. It must not materialize artifacts, start helpers,
load models, call generation, access runtime/cache, persist model state,
expose raw prompts/model output/diagnostics/paths/credentials, or allow direct
action execution. Missing gates must return unavailable/unconfigured reports
without constructing the real provider.

**Release.** Approve implementation and fixture/simulated evidence only.
Exclude real runtime/cache runs, lifecycle install/activation, persistent
cache, installer, update, package, default configuration, UI/IPC, telemetry,
release-channel, product availability, and production-readiness changes.

## Approval Lines To Provide

```text
Product: APPROVE exactly this Qwen provider composition and lifecycle-backed runtime wiring implementation scope with Qwen default-off, deterministic rules/fixture fallback preserved, and no action-execution behavior
Security: APPROVE exactly this bounded fail-closed no-runtime Qwen provider composition scope with no artifact/helper/model/runtime/cache access and sanitized fixture evidence only
Release: APPROVE implementation and fixture/simulated evidence only; no runtime/cache/lifecycle-activation/default/UI/IPC/telemetry/installer/update/release changes
```

## Next Step After Approval

After all three exact approval lines are received, implement only the gated
composition/wiring path and fixture/simulated tests. Do not run Qwen,
materialize artifacts, start helpers, access runtime/cache, promote persistent
cache, enable product defaults, expose UI/IPC, or execute actions from router
output.

## Approval Record

The following explicit approvals were received on 2026-08-07 in the current
task:

| Role | Status | Approval evidence |
| --- | --- | --- |
| Product | APPROVED | Exactly this Qwen provider composition and lifecycle-backed runtime wiring implementation scope with Qwen default-off, deterministic rules/fixture fallback preserved, and no action-execution behavior |
| Security | APPROVED | Exactly this bounded fail-closed no-runtime Qwen provider composition scope with no artifact/helper/model/runtime/cache access and sanitized fixture evidence only |
| Release | APPROVED | Implementation and fixture/simulated evidence only; no runtime/cache/lifecycle-activation/default/UI/IPC/telemetry/installer/update/release changes |

## Implementation Evidence

The approved no-runtime implementation completed without Qwen artifact,
helper, model load, generation runtime/cache, lifecycle activation, UI/IPC,
telemetry, default, installer, update, or release behavior changes.

Implemented:

- `createCoreHostQwenFastRouterComposition`, a fail-closed Core Host
  composition factory for Qwen Fast Router;
- explicit gates for enablement, artifact digest approval, model lifecycle
  readiness, runtime generation-port readiness, selection policy readiness,
  default-off preservation, and fallback preservation;
- unavailable/unconfigured descriptor and configuration reports whenever any
  gate is missing;
- provider construction only when all gates pass and an injected bounded
  generation port is supplied;
- startup use of the composition factory for descriptor/report-shaped evidence
  only, with artifact/lifecycle/runtime gates still false and no provider
  passed to normal Core runtime;
- fixed composition reason codes and booleans confirming no runtime access,
  artifact access, persistent cache change, or direct action attempt;
- simulated tests proving all missing gates fail closed without provider
  construction;
- simulated tests proving all gates can construct an injected provider without
  accessing real artifact/helper/cache/model runtime;
- model mismatch fail-closed coverage; and
- Core selection/fallback preservation when a composed injected provider
  returns low confidence.

Verification:

- `npm run build:contracts`: `passed`;
- `npm run build:core`: `passed`;
- `npm run build:core-host`: `passed`;
- focused contracts/core/core-host tests: `87 passed`;
- `npm run check:boundaries`: `passed`; and
- `npm run check:sensitive-artifacts`: `passed`.

The same source and documentation changes were synced to `E:\Jarvis-K`, where
the same contracts/core/core-host builds, focused tests, boundary check, and
sensitive-artifact guard passed.

The Core Host startup guard still verifies that startup does not contain
`new QwenFastRouterProvider`. No real Qwen model was run, no artifact was
materialized, no helper was started, no lifecycle activation was performed,
and no runtime/cache acceptance command was executed.

The sanitized evidence retained no raw prompts, raw generated text, helper
stdout/stderr, private paths, URLs, credentials, stack traces, model internals,
logits, vectors, benchmarks, or user-private data.
