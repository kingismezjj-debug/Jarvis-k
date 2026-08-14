# Qwen UI/IPC Retained Helper Route Acceptance Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_PASSED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

This document opens a separate bounded approval window after the Qwen UI/IPC
runtime control surface passed as prepared developer-alpha evidence only.

Exact Product, Security, and Release approval was provided for this one-window
developer-alpha UI/IPC retained-helper route acceptance scope.

Executed outcome: one explicit local developer opt-in UI/IPC acceptance session
started one supervised retained helper, verified digest-before-load, performed
one bounded generation-port readiness probe, ran three sanitized route requests
through Core fallback and Command Router safety gates, then stopped and rolled
back through UI/IPC control state.

No default-on behavior, persistent product route enablement outside this
window, browser/URL opening, VS Code launch, allowlist expansion,
installer/packaging behavior, telemetry expansion, release-channel behavior, or
production-facing claim was added.

## Baseline

Prepared UI/IPC runtime control passed:

```text
docs/qwen-ui-ipc-runtime-control-closeout-2026-08-10.md
```

Retained local Qwen product session passed:

```text
docs/qwen-retained-local-product-session-closeout-2026-08-10.md
```

Persistent enablement execution passed, rolled back, and cleaned:

```text
docs/qwen-persistent-product-route-enablement-execution-closeout-2026-08-10.md
```

Current invariant:

```text
Qwen default-on routing: false
release/production-facing exposure: false
UI/IPC runtime control: prepared developer-alpha only
retained dependency env: bounded developer-alpha session
retained artifact cache: approved seven-file digest-pinned set
helper lifecycle: shutdown_after_verification
active route source before this window: intent-router.deterministic.fixture
fallback/rollback route source: intent-router.deterministic.fixture
Command Router allowlist: Notepad and Calculator only
browser/URL opening: blocked
VS Code target: blocked
```

## Exact Scope To Approve

If Product, Security, and Release approvals are provided exactly for this
window, the approved work may include only:

- use the existing prepared developer-alpha UI/IPC runtime control surface;
- use exactly the retained bounded dependency environment and retained approved
  seven-file digest-pinned Qwen3-0.6B artifact cache;
- verify digest-before-load before any helper readiness or route request;
- start at most one supervised retained helper through the UI/IPC control path;
- perform at most one bounded deterministic generation-port readiness probe;
- run at most three sanitized Command Router route requests through existing
  Core fallback and Command Router safety gates;
- allow Qwen route source selection only inside this one manual acceptance
  window after all runtime/artifact/helper/generation-port/fallback/safety gates
  pass;
- preserve deterministic fixture as default, fallback, and rollback route
  source;
- stop the helper and verify stop/rollback state through the UI/IPC control
  path;
- verify browser/URL opening remains blocked;
- verify VS Code remains blocked;
- verify Notepad and Calculator remain the only local app launch targets after
  explicit UI plus native confirmation;
- record sanitized status/gate/session/route/rollback evidence only.

## Explicit Exclusions

This request does not authorize:

- default-on Qwen routing;
- persistent active Qwen product routing outside this one acceptance window;
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
- helper persistence after the bounded acceptance window;
- dependency environment or artifact cache expansion;
- raw prompt, model output, helper diagnostic, Python path, private path,
  package log, artifact source URL, signed URL, token, vector, stack trace,
  benchmark, raw process list, browser profile/history content, or model
  internals in evidence.

## Required Gates

```text
prepared UI/IPC runtime control passed: true
retained local product session passed: true
persistent enablement execution passed and rolled back: true
explicit local developer opt-in required: true
retained approved artifact set only: true
digest-before-load required: true
helper supervision required: true
generation-port readiness required: true
Core fallback preserved: true
deterministic fixture rollback preserved: true
Command Router safety gates preserved: true
route request count max: 3
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
npm.cmd run build:contracts
npm.cmd run build:desktop
npm.cmd run build:ui
npm.cmd run build:core-host
npm.cmd run build:core
npm.cmd run build -w @jarvis-k/inference-runtime-transformers-local
npm.cmd run build -w @jarvis-k/inference-adapter-qwen-router
npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts apps/core-host/test/qwen-fast-router-generation-port.test.ts apps/core-host/test/qwen-fast-router-wiring.test.ts packages/core/test/runtime.test.ts packages/inference-adapter-qwen-router/test/provider.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-client.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-process-transport.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-protocol.test.ts
node tests/desktop-command-router-browser-fixture-smoke.mjs
node tests/desktop-command-router-fixture-suite.mjs
```

Expected evidence:

```text
UI/IPC runtime control surface: developer_alpha_local
retained dependency env used: true
retained approved artifact cache used: true
artifact count: 7
digest-before-load: passed
helper start count: 0 or 1
helper shutdown verified: true
generation-port readiness probes: 0 or 1
route request count: 0 to 3
Qwen route source selected only inside window: true
fallback/rollback route source: intent-router.deterministic.fixture
browser/URL opening blocked: true
VS Code blocked: true
Notepad/Calculator allowlist unchanged: true
raw evidence captured: false
credential exposure: false
Memory write/vector retrieval: false
provider planner: false
default-on behavior: false
release behavior changed: false
```

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  this exact scope;
- Qwen would be enabled by default;
- Qwen would remain active outside this one manual acceptance window;
- route request count would exceed three;
- helper cannot be supervised, stopped, or rolled back;
- digest-before-load fails;
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
Product: APPROVE exactly this one-window Qwen UI/IPC retained-helper route acceptance scope using the passed prepared UI/IPC runtime control evidence, passed retained local Qwen product-session evidence, passed persistent product-route enablement execution evidence, existing Core selection/fallback contracts, and existing Command Router safety gates to run one explicit local developer opt-in UI/IPC acceptance session; use exactly the retained bounded dependency environment and retained approved seven-file digest-pinned Qwen3-0.6B artifact cache, verify digest-before-load, start at most one supervised retained helper through the UI/IPC control path, perform at most one bounded deterministic generation-port readiness probe, run at most three sanitized Command Router route requests, allow Qwen route source selection only inside this one acceptance window after all runtime/artifact/helper/generation-port/fallback/safety gates pass, preserve deterministic fixture as default fallback and rollback route source, stop helper and verify rollback/stop state, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify browser/URL opening remains blocked and VS Code remains blocked, and make no default-on behavior, persistent product route enablement outside this window, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen UI/IPC retained-helper route acceptance window with developer-alpha local UI/IPC control only, explicit local developer opt-in, retained bounded dependency environment only, retained approved artifact cache only, digest-before-load, at most one supervised local helper, at most one bounded deterministic generation-port readiness probe, at most three sanitized route requests through existing Core fallback and Command Router safety gates, sanitized status/gate/session/route/rollback evidence only, verified helper shutdown and rollback/stop state, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded retained-session containment, helper lifecycle verification, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen UI/IPC retained-helper route acceptance evidence only; no default-on behavior, no persistent Qwen product routing outside the one acceptance window, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Current Decision

```text
decision: approved and passed as developer-alpha evidence only
reason: exact Product, Security, and Release approvals were provided; one bounded UI/IPC retained-helper acceptance session completed with helper shutdown and rollback verified.
follow-up: any persistent Qwen routing, default-on behavior, broader route sessions, release exposure, telemetry, packaging, allowlist expansion, provider planner, or Memory vector retrieval still requires a fresh bounded approval.
```
