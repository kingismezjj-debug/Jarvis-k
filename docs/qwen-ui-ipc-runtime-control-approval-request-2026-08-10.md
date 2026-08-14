# Qwen UI/IPC Runtime Control Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_PREPARED_VERIFIED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

This document opens a separate UI/IPC runtime control approval window after the
retained local Qwen product-session window passed as developer-alpha evidence.

Exact Product, Security, and Release approval was provided for this one-window
developer-alpha UI/IPC runtime control scope.

Implemented outcome: prepared UI/IPC control surface only. The control surface
projects sanitized retained-session status, helper lifecycle status, active and
fallback route status, and bounded start/stop/rollback controls. The start
control enters a sanitized `start_prepared` state only; it does not start a
helper or invoke model/runtime/generation behavior in this window.

No helper startup, product-session active route, browser/URL opening,
Notepad/Calculator launch, installer/packaging behavior, telemetry expansion,
release-channel behavior, production-facing claim, or default-on Qwen routing
was performed under this request.

## Baseline

Retained local Qwen product session passed:

```text
docs/qwen-retained-local-product-session-closeout-2026-08-10.md
```

Persistent enablement execution passed, rolled back, and cleaned:

```text
docs/qwen-persistent-product-route-enablement-execution-closeout-2026-08-10.md
```

Current product invariant:

```text
Qwen route enabled by default: false
release/production-facing exposure: false
retained dependency env: bounded developer-alpha session
retained artifact cache: approved seven-file digest-pinned set
helper lifecycle: shutdown_after_verification
Command Router allowlist: Notepad and Calculator only
browser/URL opening: blocked
VS Code target: blocked
```

## Exact Scope To Approve

If Product, Security, and Release approvals are provided exactly for this
window, the approved work may include only:

- implement or prepare one developer-alpha local UI/IPC runtime control surface
  for the retained Qwen product session;
- keep Qwen runtime control default-off and require explicit local developer
  opt-in;
- expose sanitized status/gate/session state for the retained dependency env,
  approved artifact cache, helper lifecycle, active route projection, and
  rollback state;
- expose bounded start, stop, and rollback IPC/control paths only for the
  retained local product session;
- start at most one supervised helper only after explicit local developer
  opt-in and all retained-session gates pass;
- keep deterministic fixture as default, fallback, and rollback route source;
- allow Qwen to become active route source only inside the developer-alpha
  local control session after all runtime/artifact/helper/generation/fallback
  and Command Router safety gates pass;
- run at most three sanitized route requests for verification;
- verify browser/URL opening remains blocked;
- verify VS Code remains blocked;
- verify Notepad and Calculator remain the only local app launch targets after
  explicit UI plus native confirmation;
- record sanitized UI/IPC/status/gate/rollback evidence only.

## Explicit Exclusions

This request does not authorize:

- default-on Qwen routing;
- production-facing Qwen routing or arbitrary app-control claim;
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
- helper persistence beyond the bounded UI/IPC control session;
- arbitrary model/artifact materialization beyond the retained approved
  seven-file digest-pinned artifact cache;
- raw prompt, model output, helper diagnostic, Python path, private path,
  package log, artifact source URL, signed URL, token, vector, stack trace,
  benchmark, raw process list, browser profile/history content, or model
  internals in evidence.

## Required Gates

```text
retained local product session passed: true
persistent enablement execution passed: true
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
UI/IPC runtime control surface: developer_alpha_local
Qwen runtime control default-on: false
explicit local developer opt-in: true
retained session status projected: true
helper start control: bounded prepared state only
helper stop control: bounded state reset only
rollback control: bounded deterministic fixture fallback state only
active route source in prepared window: intent-router.deterministic.fixture
fallback/rollback route source: intent-router.deterministic.fixture
route request count: 0
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
- UI/IPC controls would expose release/production-facing runtime control;
- helper cannot be supervised or stopped;
- route request count would exceed three;
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
Product: APPROVE exactly this one-window Qwen UI/IPC runtime control scope using the passed retained local Qwen product-session evidence, passed persistent product-route enablement execution evidence, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to implement or prepare only a developer-alpha local default-off explicit-opt-in UI/IPC control surface for the retained Qwen product session; expose sanitized retained-session status, helper lifecycle status, active/fallback route status, start/stop/rollback controls, and at most three sanitized route requests; keep deterministic fixture as default fallback and rollback route source, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify browser/URL opening remains blocked and VS Code remains blocked, and make no default-on behavior, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen UI/IPC runtime control window with developer-alpha local UI/IPC control only, explicit local developer opt-in, retained approved artifact cache only, retained bounded dependency environment only, at most one supervised helper, bounded start/stop/rollback controls, at most three sanitized route requests through existing Core fallback and Command Router safety gates, sanitized status/gate/rollback/session evidence only, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded retained-session containment, helper lifecycle verification, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen UI/IPC runtime control evidence only; no default-on behavior, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Current Decision

```text
decision: approved and completed as prepared UI/IPC runtime control evidence only
reason: exact Product, Security, and Release approvals were provided; implementation stayed default-off, sanitized, fixture-fallback-only, and no-runtime.
follow-up: any real helper start, active Qwen route, route request usage, persistent runtime control session, or production/release exposure still requires a fresh bounded approval.
```
