# Qwen Conversation Surface Clean Rerun Approval Request

Recorded: 2026-08-10

## Status

`DRAFT_PENDING_PRODUCT_SECURITY_RELEASE_APPROVAL`

## Baseline Evidence

Use only the completed evidence below as baseline:

```text
docs/qwen-conversation-surface-local-opt-in-route-acceptance-closeout-2026-08-10.md
docs/qwen-persistent-local-opt-in-product-route-session-closeout-2026-08-10.md
docs/qwen-ui-ipc-retained-helper-route-acceptance-closeout-2026-08-10.md
docs/command-router-browser-block-remediation-verification-closeout-2026-08-10.md
```

Reason for this window:

```text
previous conversation-surface implementation passed on rerun: true
previous closeout status: degraded with passing rerun
degradation reason: first Electron attempt consumed three main-conversation Qwen routes before a test assertion failure
purpose of this window: one clean single-sequence rerun only
```

Current invariants:

```text
Qwen default-on: false
Qwen active product routing outside bounded opt-in windows: false
release/production exposure: false
retained dependency environment: bounded developer-alpha local only
retained approved artifact cache: seven-file digest-pinned Qwen3-0.6B set only
helper running at window start: false
deterministic fixture route source: default/fallback/rollback
Notepad/Calculator allowlist: unchanged
browser/URL opening: blocked
VS Code: blocked
provider planner: false
Memory vector retrieval: false
telemetry expansion: false
```

## Requested One-Window Scope

Execute exactly one clean single-sequence developer-alpha rerun of the already
implemented conversation-surface local opt-in Qwen route acceptance path.

Allowed only inside this approval window:

```text
run exactly one Electron conversation-surface clean rerun sequence
use exactly the retained bounded dependency environment
use exactly the retained approved seven-file digest-pinned Qwen3-0.6B artifact cache
verify digest-before-load
start at most one supervised local helper through the existing UI/IPC control path
perform at most one bounded deterministic generation-port readiness probe
send exactly three sanitized main-conversation route requests after all gates pass
verify Qwen selected as route source for exactly those three requests
verify direct action remains disabled for all three requests
verify deterministic fixture remains default, fallback, and rollback route source
verify browser/URL opening remains blocked
verify VS Code remains blocked
verify Notepad/Calculator allowlist remains unchanged
stop helper and verify rollback/stop state in the same clean sequence
record sanitized status/gate/session/route/rollback evidence only
```

Explicitly out of scope:

```text
implementation changes unless required to repair a test harness-only issue before any route request is sent
default-on Qwen routing
persistent Qwen product routing outside this one clean rerun window
more than one clean rerun attempt after any route request is sent
more than three main-conversation route requests
allowlist expansion
browser or URL opening
shell, PowerShell, cmd, terminal, or script execution by product/runtime
arbitrary executable path or command-line arguments by product/runtime
provider planner
Memory write or vector retrieval
credential access or exposure
raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark evidence
raw process list/browser profile/browser history evidence
installer/update/packaging/release-channel changes
telemetry expansion
production-facing claim that Qwen routing or arbitrary app control is supported
```

## Required Approval Text

```text
Product: APPROVE exactly this one-window Qwen conversation-surface clean rerun scope using the degraded-with-passing-rerun conversation-surface closeout, passed persistent local opt-in product route session evidence, existing UI/IPC runtime control path, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to execute exactly one clean single-sequence developer-alpha rerun of the already implemented conversation-surface local opt-in Qwen route acceptance path; use exactly the retained bounded dependency environment and retained approved seven-file digest-pinned Qwen3-0.6B artifact cache, verify digest-before-load, start at most one supervised helper through the existing UI/IPC control path, perform at most one bounded deterministic generation-port readiness probe, send exactly three sanitized main-conversation route requests only after all gates pass, verify Qwen selected for exactly those three requests and direct action remains disabled, preserve deterministic fixture as default/fallback/rollback route source, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify browser/URL opening remains blocked and VS Code remains blocked, stop helper and verify rollback/stop state in the same clean sequence, and make no default-on behavior, persistent product route enablement outside this window, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen conversation-surface clean rerun window with developer-alpha local UI/IPC control only, explicit local developer opt-in, retained bounded dependency environment only, retained approved artifact cache only, digest-before-load, at most one supervised local helper, at most one bounded deterministic generation-port readiness probe, exactly three sanitized main-conversation route requests through existing Core fallback and Command Router safety gates, no second rerun after any route request is sent, sanitized session/status/gate/route/rollback evidence only, verified helper shutdown and rollback/stop state, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded retained-session containment, helper lifecycle verification, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen conversation-surface clean rerun evidence only; no default-on behavior, no persistent Qwen product routing outside the one clean rerun window, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Stop Conditions

Stop immediately and record failed/degraded evidence if any of the following is
observed:

```text
test harness fails after any route request is sent
digest-before-load fails
more than one helper starts
more than one generation-port readiness probe is attempted
main-conversation route request count is not exactly three
any second rerun would be needed after a route request is sent
Qwen route source is selected before all gates pass
Qwen remains selected after stop/rollback
direct action becomes enabled or attempted
browser/URL opening is allowed
VS Code is allowed
any local app target beyond Notepad/Calculator is allowed
raw prompt/model output/helper diagnostic/private path/token/URL/vector/stack/benchmark evidence would be recorded
provider planner or Memory vector retrieval is invoked
telemetry, installer, packaging, release-channel, or production-facing behavior changes
```
