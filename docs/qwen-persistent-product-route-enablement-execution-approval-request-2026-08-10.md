# Qwen Persistent Product Route Enablement Execution Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_EXECUTED_ROLLED_BACK_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

This document opened a separate persistent Qwen product-route enablement
execution approval window after the local developer-alpha Qwen usage rerun
passed and cleaned up.

Product, Security, and Release approval was provided exactly. The approved
window executed one developer-alpha explicit opt-in enablement sequence,
verified active and rollback status projection, ran three sanitized route
requests, verified Command Router safety fixtures, and cleaned up temporary
dependency/runtime state.

Code changes were limited to fail-closed rollback projection correctness for
the Qwen activation status helper. No default product route, UI/IPC runtime
control, installer, packaging, telemetry, release-channel behavior, or
production-facing behavior changed under this request.

## Baseline

Persistent enablement preparation passed and cleaned:

```text
docs/qwen-persistent-product-route-enablement-closeout-2026-08-10.md
```

Local developer-alpha Qwen usage rerun passed and cleaned:

```text
docs/qwen-local-developer-alpha-usage-rerun-closeout-2026-08-10.md
```

Command Router browser-block verification passed:

```text
docs/command-router-browser-block-remediation-verification-closeout-2026-08-10.md
```

Current product invariant:

```text
Qwen route enabled by default: false
persistent active product route source: intent-router.deterministic.fixture
Qwen runtime/helper/artifact/dependency env retained: false
Command Router allowlist: Notepad and Calculator only
browser/URL opening: blocked
VS Code target: blocked
release/production-facing exposure: false
```

## Exact Scope To Approve

If Product, Security, and Release approvals are provided exactly for this
window, the approved work may include only:

- execute one developer-alpha default-off explicit opt-in persistent route
  enablement sequence on this machine;
- select exactly one runtime path:
  - one explicit prepared Python executable provided by the user, or
  - one newly created bounded pinned dependency environment using only
    `packages/inference-runtime-transformers-local/runtime/requirements.txt`;
- materialize or reuse only the existing approved seven-file digest-pinned
  Qwen3-0.6B artifact set under one bounded developer-alpha local cache root;
- verify digest-before-load;
- start at most one supervised helper;
- allow Qwen to become the active product route source only after all
  runtime/artifact/helper/generation-port/fallback/safety gates pass and only
  through explicit local developer opt-in;
- preserve deterministic fixture as fallback and rollback route source;
- run at most three sanitized route requests through existing Core fallback and
  Command Router safety gates;
- verify browser/URL opening remains blocked;
- verify VS Code remains blocked;
- verify Notepad and Calculator remain the only local app launch targets after
  explicit UI plus native confirmation;
- record sanitized status/gate/rollback evidence only;
- record an explicit bounded retention or cleanup decision for the dependency
  environment, artifact cache, and helper lifecycle.

## Explicit Exclusions

This request does not authorize:

- default-on Qwen routing;
- production-facing Qwen routing claim;
- installer, packaging, update, release-channel, or telemetry behavior change;
- allowlist expansion beyond Notepad and Calculator;
- browser or URL opening;
- VS Code launch;
- arbitrary executable path or command-line arguments by product/runtime;
- shell, PowerShell, cmd, terminal, or script execution by product/runtime;
- provider planner;
- Memory write or Memory vector retrieval;
- credential access;
- arbitrary model/artifact materialization;
- raw prompt, model output, helper diagnostic, Python path, private path,
  package log, artifact source URL, signed URL, token, vector, stack trace,
  benchmark, raw process list, browser profile/history content, or model
  internals in evidence;
- release-channel exposure or production-facing claim that Qwen routing or
  arbitrary app control is supported.

## Required Gates

```text
persistent enablement preparation passed: true
local developer-alpha usage rerun passed: true
browser-block verification passed: true
explicit local developer opt-in required: true
approved artifact set only: true
digest-before-load required: true
helper supervision required: true
generation-port readiness required: true
Core fallback preserved: true
deterministic fixture rollback preserved: true
Command Router safety gates preserved: true
Notepad/Calculator allowlist unchanged: true
browser/URL opening blocked: required
VS Code blocked: required
sanitized evidence only: true
default-on behavior: false
release behavior changed: false
```

## Required Verification After Approval

Candidate verification:

```powershell
npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts apps/core-host/test/qwen-fast-router-generation-port.test.ts apps/core-host/test/qwen-fast-router-wiring.test.ts packages/core/test/runtime.test.ts packages/inference-adapter-qwen-router/test/provider.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-client.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-process-transport.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-protocol.test.ts
npm.cmd run build:contracts
npm.cmd run build:inference-runtime-transformers-local
npm.cmd run build:inference-adapter-qwen-router
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
node tests/desktop-command-router-browser-fixture-smoke.mjs
node tests/desktop-command-router-fixture-suite.mjs
```

Expected evidence:

```text
persistent enablement sequence count: 1
Qwen route enabled by default: false
explicit local developer opt-in: true
active route source after gates: intent-router.qwen3-0.6b
fallback/rollback route source: intent-router.deterministic.fixture
runtime path selected: one explicit prepared Python or one bounded env
dependency env retention decision: recorded
artifact cache retention decision: recorded
helper lifecycle decision: recorded
approved artifact count: 7
digest-before-load: passed
helper count: 1 or 0
route request count: 1 to 3
browser/URL opening blocked: true
VS Code blocked: true
Notepad/Calculator allowlist unchanged: true
raw evidence captured: false
default behavior changed: false
release behavior changed: false
```

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  this exact scope;
- Qwen would be enabled by default;
- route request count would exceed three;
- runtime setup requires unpinned dependencies, global Python mutation, private
  index credentials, or broad filesystem search;
- artifact digest verification fails;
- helper cannot be supervised or its lifecycle decision cannot be recorded;
- Qwen bypasses Core fallback or Command Router safety gates;
- browser/URL opening occurs;
- VS Code is not blocked;
- allowlist expands;
- raw prompt/model/helper/path/URL/token/vector/log/benchmark/browser/process
  evidence would be recorded;
- installer, packaging, telemetry, release channel, or production-facing
  behavior would change.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window persistent Qwen product-route enablement execution scope using the passed local developer-alpha Qwen usage rerun evidence, passed Command Router browser-block remediation verification evidence, passed persistent enablement preparation evidence, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to execute one developer-alpha default-off explicit opt-in persistent route enablement sequence; select exactly one prepared Python executable or create one bounded pinned dependency environment, materialize or reuse only the approved seven-file digest-pinned Qwen3-0.6B artifact set in one bounded developer-alpha local cache, verify digest-before-load, start at most one supervised helper, allow Qwen to become the active product route source only after runtime/artifact/helper/generation-port/fallback/safety gates pass and only by explicit local developer opt-in, preserve deterministic fixture as fallback and rollback route source, run at most three sanitized route requests, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify browser/URL opening remains blocked and VS Code remains blocked, record bounded retention or cleanup decisions, and make no default-on behavior, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed persistent Qwen product-route enablement execution window with one explicit prepared Python or one bounded pinned dependency environment, one bounded approved artifact cache only, digest-before-load, at most one supervised local helper, explicit local developer opt-in, at most three sanitized route requests through existing Core fallback and Command Router safety gates, sanitized status/gate/rollback evidence only, verified helper lifecycle decision and bounded cleanup or retention decision, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded runtime/cache containment, helper lifecycle verification, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha persistent Qwen product-route enablement execution evidence only; no default-on behavior, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Current Decision

```text
decision: executed_rolled_back_cleaned
reason: explicit opt-in activation projection reached active after runtime/artifact/helper/generation gates, rollback projection returned to deterministic fixture, three sanitized route requests passed, Command Router safety fixtures passed, and cleanup removed temporary dependency/runtime state.
follow-up: this is developer-alpha evidence only. Open a separate bounded retention/product-session approval before keeping any dependency env, artifact cache, helper, UI/IPC runtime control, release exposure, or production-facing Qwen routing claim.
```
