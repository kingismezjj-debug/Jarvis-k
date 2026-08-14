# Qwen Conversation Surface Bounded Local Usage Second Rerun Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_FOR_ONE_WINDOW_BOUNDED_LOCAL_USAGE_SECOND_RERUN`

## Baseline Evidence

Use only the completed developer-alpha evidence below as baseline:

```text
docs/qwen-conversation-surface-bounded-local-usage-rerun-closeout-2026-08-10.md
docs/qwen-conversation-surface-model-status-diagnostic-remediation-closeout-2026-08-10.md
docs/qwen-conversation-surface-bounded-local-usage-diagnostic-remediation-closeout-2026-08-10.md
docs/qwen-conversation-surface-clean-rerun-closeout-2026-08-10.md
docs/command-router-browser-block-remediation-verification-closeout-2026-08-10.md
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

Execute exactly one clean second rerun of the bounded developer-alpha local
usage session through the main conversation surface after the latest-result
smoke harness remediation and the `model.status` calibration remediation.

Allowed only inside this approval window:

```text
use exactly the retained bounded dependency environment
use exactly the retained approved seven-file digest-pinned Qwen3-0.6B artifact cache
verify digest-before-load
start at most one supervised local helper through the existing UI/IPC control path
perform at most one bounded deterministic generation-port readiness probe
send exactly five sanitized main-conversation route requests after all gates pass
verify Qwen selected only inside the bounded local usage second rerun session
verify direct action remains disabled for every Qwen route
verify the stabilized latest-result route assertions pass for all five routes
verify model.status-specific calibration is reflected by the fifth route
preserve deterministic fixture as default, fallback, and rollback route source
keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation
verify browser/URL opening remains blocked
verify VS Code remains blocked
stop helper and verify rollback/stop state at the end or on failure
record sanitized status/gate/session/route/rollback evidence only
```

Explicitly out of scope:

```text
second attempt after any route request is sent in this window
default-on Qwen routing
persistent Qwen product routing outside this one bounded rerun window
route request count above five
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
Product: APPROVE exactly this one-window Qwen conversation-surface bounded local usage second rerun scope using the degraded bounded local usage rerun closeout, passed model.status diagnostic/remediation closeout, passed prior latest-result diagnostic/remediation closeout, passed clean single-sequence conversation-surface rerun evidence, existing UI/IPC runtime control path, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to execute exactly one clean bounded developer-alpha local usage second rerun session through the main conversation surface; use exactly the retained bounded dependency environment and retained approved seven-file digest-pinned Qwen3-0.6B artifact cache, verify digest-before-load, start at most one supervised helper through the existing UI/IPC control path, perform at most one bounded deterministic generation-port readiness probe, send exactly five sanitized main-conversation route requests only after all gates pass, verify Qwen selected only inside the bounded local usage second rerun session, verify direct action remains disabled for every route, verify the stabilized latest-result route assertions pass for all five routes, verify model.status-specific calibration is reflected by the fifth route, preserve deterministic fixture as default/fallback/rollback route source, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify browser/URL opening remains blocked and VS Code remains blocked, stop helper and verify rollback/stop state, and make no second attempt after any route request is sent in this window, default-on behavior, persistent product route enablement outside this window, route-count extension, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen conversation-surface bounded local usage second rerun window with developer-alpha local UI/IPC control only, explicit local developer opt-in, retained bounded dependency environment only, retained approved artifact cache only, digest-before-load, at most one supervised local helper, at most one bounded deterministic generation-port readiness probe, exactly five sanitized main-conversation route requests through existing Core fallback and Command Router safety gates, no second attempt after any route request is sent in this window, sanitized session/status/gate/route/rollback evidence only, verified helper shutdown and rollback/stop state, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded retained-session containment, helper lifecycle verification, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen conversation-surface bounded local usage second rerun evidence only; no default-on behavior, no persistent Qwen product routing outside the one bounded local usage second rerun window, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Stop Conditions

Stop immediately and record failed/degraded evidence if any of the following is
observed:

```text
digest-before-load fails
more than one helper starts
more than one generation-port readiness probe is attempted
more than five main-conversation route requests are attempted
fewer than five route requests complete after the first request is sent
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
