# Qwen Product Routing Activation Implementation Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_IMPLEMENTED_VERIFIED_NO_RUNTIME`

This document opened a separate Qwen product-routing activation implementation
approval window. Product, Security, and Release approval was provided exactly,
and the approved implementation is complete as default-off no-runtime
status/gate/state/rollback plumbing only.

No runtime startup, retained dependency environment, retained artifact/model
cache, helper startup, generation-port invocation, or active Qwen product
routing was approved or performed under this request.

## Baseline

Policy is prepared:

```text
docs/qwen-product-routing-activation-policy-closeout-2026-08-10.md
docs/qwen-product-routing-activation-policy-packet-2026-08-10.md
```

Readiness evidence passed:

```text
docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-closeout-2026-08-10.md
```

Current product invariant:

```text
active product route source: intent-router.deterministic.fixture
Qwen product routing: false
realQwenRuntimeEnabled: false
dependency env retained: false
artifact cache retained: false
helper startup in product: false
generation port invoked by product: false
```

## Exact Implementation Scope To Approve

Product, Security, and Release approvals were provided exactly for this window.
The approved implementation included only:

- add typed default-off Qwen product-routing activation policy/status contracts;
- add source-only gate evaluation for states:
  `disabled`, `ready`, `armed`, `active`, `fallback`, `degraded`, and
  `blocked`;
- preserve the existing deterministic fixture as the active product route
  source by default;
- keep `realQwenRuntimeEnabled: false`;
- keep Qwen product routing disabled unless a later runtime-retention and
  manual-acceptance window explicitly arms it;
- show sanitized status/gate projection in Settings if needed;
- add rollback/disable plumbing that returns status to deterministic fixture;
- add source-only tests and builds;
- update sanitized evidence docs.

This implementation may prepare the product surface for a later activation
window, but it may not retain a Python dependency environment or model cache,
start helper processes, load Qwen, invoke a generation port, or route product
traffic through Qwen.

## Explicit Exclusions

This request does not authorize:

- changing `realQwenRuntimeEnabled` to true;
- selecting Qwen as the active product route source;
- retained Python dependency environment;
- retained Qwen artifact/model/helper cache;
- materializing artifacts;
- starting helper processes;
- loading Qwen;
- invoking generation port;
- running Qwen for product traffic;
- browser, URL, shell, PowerShell, cmd, terminal, arbitrary process, arbitrary
  executable path, or command-line argument behavior;
- Desktop/UI/IPC controls that actually start runtime or route traffic;
- default behavior change;
- allowlist expansion;
- credentials, provider planner, Memory write, Memory vector retrieval,
  telemetry expansion, installer, packaging, update, release-channel behavior,
  or production-facing claims;
- raw prompt, generated text, helper diagnostic, Python path, private path,
  package log, artifact source URL, signed URL, token, vector, stack trace,
  benchmark, or model internals in evidence.

## Required Implementation Invariants

```text
default-off preserved: true
deterministic fixture active by default: true
Qwen direct action authority: false
Command Router safety gates preserved: true
Notepad/Calculator allowlist unchanged: true
browser/URL remains blocked unless separately approved: true
Memory vector retrieval unavailable: true
provider planner unavailable: true
Qwen readiness evidence does not equal product activation: true
```

## Required Verification After Approval

Candidate verification:

```powershell
npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts apps/core-host/test/qwen-fast-router-generation-port.test.ts apps/core-host/test/qwen-fast-router-wiring.test.ts packages/core/test/runtime.test.ts packages/inference-adapter-qwen-router/test/provider.test.ts
npm.cmd run build:contracts
npm.cmd run build:inference-adapter-qwen-router
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
node tests/desktop-command-router-fixture-suite.mjs
```

Expected:

```text
Qwen status/gates visible or contract-visible
Qwen product routing false
realQwenRuntimeEnabled false
deterministic fixture remains active product route source
no helper/artifact/runtime/generation action
Command Router safety suite remains green
```

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  the exact implementation scope;
- implementation requires runtime/helper/artifact/dependency creation;
- Qwen becomes active product route source;
- `realQwenRuntimeEnabled` becomes true;
- product defaults change;
- UI/IPC can start Qwen runtime or route traffic;
- allowlist expansion appears;
- direct action authority bypasses Command Router safety gates;
- raw prompt/model/helper/path/URL/token/vector/log/benchmark evidence would be
  recorded.

## Sanitized Evidence Contract

Evidence may contain only:

- files changed;
- gate/status state names;
- fixed reason codes;
- test/build status;
- product behavior booleans;
- fallback/rollback status;
- no-runtime/no-helper/no-artifact/no-generation flags.

Evidence must not contain raw prompts, generated text, helper diagnostics,
Python paths, private paths, package logs, artifact source URLs, signed URLs,
credentials, tokens, vectors, stack traces, benchmarks, or model internals.

## Approval Lines To Provide

```text
Product: APPROVE exactly this Qwen product-routing activation implementation preparation scope using the prepared activation policy, passed Qwen readiness evidence, existing no-runtime product binding, existing Core selection/fallback contracts, and existing Command Router safety gates to implement only default-off product status/gate/state/rollback plumbing and sanitized UI/status projection; keep deterministic fixture routing as the active product route source, keep Qwen unavailable for product routing, keep realQwenRuntimeEnabled false, and make no runtime/helper/artifact/dependency environment creation or retention, no generation-port invocation, no default behavior change, no allowlist expansion, no provider planner, no Memory vector retrieval, no installer, packaging, release-channel, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen product-routing activation implementation preparation window with source/code/test changes only, sanitized evidence only, no credential access, no raw prompt/model output/helper diagnostic/Python path/private path/package log/URL/token/vector/stack/benchmark evidence, no dependency environment creation, no artifact materialization, no helper startup, no model load, no generation-port invocation, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary process or command-line arguments by product/runtime, no Memory write/vector retrieval, no provider planner, no allowlist expansion, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen product-routing activation implementation preparation evidence only; no default behavior change, no Qwen product routing enablement, no persistent dependency environment or model cache, no telemetry expansion, no installer/update/packaging/release-channel changes, no production-facing claim that Qwen routing is supported, and no release-channel exposure
```

## Current Decision

```text
decision: implemented
reason: implementation completed within the approved no-runtime/no-routing boundary.
follow-up: any Qwen runtime retention, helper startup, generation-port invocation, or product-route arming still requires a separate bounded approval window.
```
