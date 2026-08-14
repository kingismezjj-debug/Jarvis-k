# Qwen Retained Local Product Session Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_RETAINED_SESSION_VERIFIED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

This document opened a separate retained local product-session approval window
after persistent Qwen product-route enablement execution passed, rolled back,
and cleaned up.

Product, Security, and Release approval was provided exactly. The approved
window created one retained bounded local product-session dependency
environment, retained the approved seven-file artifact cache, verified
digest-before-load, started one supervised helper for verification, shut the
helper down after verification, ran three sanitized route requests, and verified
Command Router safety fixtures.

No code, default product route, product status, UI/IPC behavior, installer,
packaging, telemetry, release-channel behavior, or production-facing behavior
changed under this request.

## Baseline

Persistent Qwen product-route enablement execution passed, rolled back, and
cleaned up:

```text
docs/qwen-persistent-product-route-enablement-execution-closeout-2026-08-10.md
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
retained dependency env: false
retained artifact cache: false
retained helper: false
Command Router allowlist: Notepad and Calculator only
browser/URL opening: blocked
VS Code target: blocked
release/production-facing exposure: false
```

## Exact Scope To Approve

If Product, Security, and Release approvals are provided exactly for this
window, the approved work may include only:

- create or select one bounded pinned dependency environment for this local
  developer-alpha product session;
- materialize or reuse only the approved seven-file digest-pinned Qwen3-0.6B
  artifact set under one bounded local product-session cache root;
- verify digest-before-load;
- start at most one supervised helper for this local product session;
- allow Qwen to be selected as active route source only after explicit local
  developer opt-in and all runtime/artifact/helper/generation/fallback/safety
  gates pass;
- keep deterministic fixture as fallback and rollback route source;
- run at most three sanitized route requests through existing Core fallback and
  Command Router safety gates;
- verify browser/URL opening remains blocked;
- verify VS Code remains blocked;
- verify Notepad and Calculator remain the only local app launch targets after
  explicit UI plus native confirmation;
- record sanitized status/gate/rollback/session evidence only;
- record bounded retention metadata without raw paths, credentials, URLs,
  tokens, model output, helper diagnostics, or process lists;
- record a cleanup command path and explicit stop/rollback decision for the
  retained session.

## Explicit Exclusions

This request does not authorize:

- default-on Qwen routing;
- production-facing Qwen routing claim;
- release-channel or installer/packaging exposure;
- telemetry expansion;
- allowlist expansion beyond Notepad and Calculator;
- browser or URL opening;
- VS Code launch;
- arbitrary executable path or command-line arguments by product/runtime;
- shell, PowerShell, cmd, terminal, or script execution by product/runtime;
- provider planner;
- Memory write or Memory vector retrieval;
- credential access;
- arbitrary model/artifact materialization beyond the approved seven-file
  digest-pinned artifact set;
- raw prompt, model output, helper diagnostic, Python path, private path,
  package log, artifact source URL, signed URL, token, vector, stack trace,
  benchmark, raw process list, browser profile/history content, or model
  internals in evidence.

## Required Gates

```text
persistent enablement execution passed: true
local usage rerun passed: true
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
retained local product-session count: 1
Qwen route enabled by default: false
explicit local developer opt-in: true
active route source after gates: intent-router.qwen3-0.6b
fallback/rollback route source: intent-router.deterministic.fixture
dependency env retention decision: retained_bounded_session or cleanup
artifact cache retention decision: retained_bounded_session or cleanup
helper lifecycle decision: running_supervised or shutdown
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
Product: APPROVE exactly this one-window retained local Qwen product-session scope using the passed persistent product-route enablement execution evidence, passed local developer-alpha Qwen usage rerun evidence, passed Command Router browser-block verification evidence, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to create or select one bounded pinned dependency environment, retain or materialize only the approved seven-file digest-pinned Qwen3-0.6B artifact set in one bounded local product-session cache, verify digest-before-load, start at most one supervised helper, allow Qwen to be selected as active route source only after explicit local developer opt-in and all runtime/artifact/helper/generation-port/fallback/safety gates pass, preserve deterministic fixture as fallback and rollback route source, run at most three sanitized route requests, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify browser/URL opening remains blocked and VS Code remains blocked, record bounded session retention and cleanup decisions, and make no default-on behavior, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed retained local Qwen product-session window with one explicit prepared Python or one bounded pinned dependency environment, one bounded approved artifact cache only, digest-before-load, at most one supervised local helper, explicit local developer opt-in, at most three sanitized route requests through existing Core fallback and Command Router safety gates, sanitized status/gate/rollback/session evidence only, verified helper lifecycle decision and bounded cleanup/retention decision, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded runtime/cache containment, helper lifecycle verification, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha retained local Qwen product-session evidence only; no default-on behavior, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Current Decision

```text
decision: retained_session_verified
reason: one bounded dependency environment and approved seven-file artifact cache were retained for local developer-alpha use; helper was started only for verification and shut down; three sanitized route requests and Command Router safety fixtures passed.
follow-up: Qwen remains not default-on and not production-facing. Open a separate bounded approval before UI/IPC runtime controls, broader sessions, release exposure, telemetry, installer/packaging, Memory vector retrieval, provider planner, or production-facing Qwen routing claims.
```
