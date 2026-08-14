# Qwen Conversation Surface Local Opt-In Route Acceptance Evidence

Recorded: 2026-08-10

## Status

`DEGRADED_WITH_PASSING_RERUN_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Related approval request:

```text
docs/qwen-conversation-surface-local-opt-in-route-acceptance-approval-request-2026-08-10.md
```

## Approval Capture

```text
Product approval: captured
Security approval: captured
Release approval: captured
```

## Approved Scope

Exact Product, Security, and Release approval was provided for one bounded
developer-alpha conversation-surface local opt-in route acceptance window.

Executed implementation boundary:

```text
default behavior changed: false
conversation-surface acceptance gated by dedicated local env flag: true
UI/IPC runtime control path used for explicit opt-in: true
retained dependency env selected: true
retained approved artifact cache selected: true
artifact count: 7
digest-before-load: passed
helper start count per run: 1
generation-port readiness probes per run: 1
main-conversation route request count per run: 3
Qwen selected for main-conversation routes: true
direct action attempted: false
deterministic fixture fallback/rollback verified on passing rerun: true
browser/URL remains blocked: true
VS Code remains blocked: true
Notepad/Calculator allowlist unchanged: true
persistent Qwen routing outside bounded window: false
release behavior changed: false
telemetry changed: false
```

## Evidence Fields

Only sanitized developer-alpha evidence may be recorded.

```text
retained dependency env selected: true
retained approved artifact cache selected: true
artifact count: 7
digest-before-load: passed
helper start count on passing rerun: 1
generation-port readiness probes on passing rerun: 1
main-conversation route request count on passing rerun: 3
Qwen active route source only inside bounded conversation run: true
deterministic fixture fallback/rollback on passing rerun: true
helper shutdown verified on passing rerun: true
rollback/stop state verified on passing rerun: true
browser/URL remains blocked: true
VS Code remains blocked: true
Notepad/Calculator allowlist unchanged: true
default-on Qwen routing: false
persistent Qwen routing outside bounded conversation window: false
release behavior changed: false
```

## Verification

Builds:

```text
build:contracts: PASS
build:core: PASS
build:desktop: PASS
build:ui: PASS, existing Vite chunk-size warning only
build:core-host: PASS
```

Focused tests:

```text
Core/desktop/contracts/UI focused tests: PASS, 5 files, 145 tests
Qwen/Core/runtime helper focused tests: PASS, 7 files, 34 tests
```

Conversation-surface acceptance:

```text
initial attempt result: degraded
initial attempt route count before script assertion failure: 3
initial attempt failure class: test assertion strict-mode ambiguity
initial attempt helper lifecycle: app closed and no helper process observed afterward
script correction: route-count assertion changed to parse sanitized panel text
passing rerun result: PASS
passing rerun helper start count: 1
passing rerun generation-port readiness probes: 1
passing rerun main-conversation route request count: 3
passing rerun Qwen selected for conversation routes: true
passing rerun direct action disabled: true
passing rerun route count visible: true
passing rerun deterministic fixture rollback: true
passing rerun helper shutdown verified: true
passing rerun browser/URL blocked: true
passing rerun VS Code blocked: true
```

## Source Changes

```text
Core Runtime: Command Router product mode still defaults to deterministic fixture; when providerId is explicitly Qwen, an injected provider may perform route selection and the result is wrapped in Command Router product-mode safety semantics.
Desktop main: a dedicated local acceptance env flag allows the UI/IPC Start path to reserve the three-route budget for main-conversation commands, then intercepts at most three active-session BrainCommand envelopes for Qwen route selection.
Tests: added Core product-mode/Qwen safety coverage, desktop source assertions, and an Electron conversation-surface acceptance smoke.
```

## Boundary Confirmation

```text
default-on Qwen routing: false
Qwen persistent product routing outside bounded window: false
direct action attempted by Qwen route: false
browser/URL opened by product/runtime: false
VS Code launch allowed: false
allowlist expansion: false
provider planner: false
Memory write/vector retrieval: false
credential exposure: false
raw prompt/model output/helper diagnostic/private path/token/URL/vector/stack/benchmark evidence recorded: false
telemetry expansion: false
installer/update/packaging/release-channel change: false
production-facing claim added: false
```

## Result

```text
decision: DEGRADED_WITH_PASSING_RERUN_DEVELOPER_ALPHA_EVIDENCE_ONLY
reason: the implemented conversation-surface route path passed on rerun, but the first acceptance script attempt had already consumed three main-conversation routes before a test assertion failed, so this was not a clean single-sequence window.
follow-up: require a fresh bounded approval before treating this as clean acceptance, extending session duration/counts, enabling persistent/default routing, release exposure, telemetry, planner, Memory vector retrieval, or allowlist expansion.
```
