# Qwen Conversation Surface Local Opt-In Route Acceptance Closeout

Recorded: 2026-08-10

## Status

`CLOSED_DEGRADED_WITH_PASSING_RERUN_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Related documents:

```text
docs/qwen-conversation-surface-local-opt-in-route-acceptance-approval-request-2026-08-10.md
docs/qwen-conversation-surface-local-opt-in-route-acceptance-evidence-2026-08-10.md
```

## What Closed

The conversation-surface local opt-in Qwen route path was implemented and passed
on rerun, but the window is closed as degraded rather than clean acceptance.

Closed result:

```text
implementation prepared: true
conversation-surface route selected Qwen after explicit opt-in: true
retained dependency env selected: true
retained approved artifact cache selected: true
artifact count: 7
digest-before-load: passed
helper start count on passing rerun: 1
generation-port readiness probes on passing rerun: 1
main-conversation route request count on passing rerun: 3
direct action attempted: false
fallback/rollback route source: intent-router.deterministic.fixture
helper shutdown verified on passing rerun: true
browser/URL opening blocked: true
VS Code blocked: true
Notepad/Calculator allowlist unchanged: true
default-on Qwen routing: false
persistent Qwen routing outside bounded session: false
release behavior changed: false
```

## Degradation

```text
initial attempt result: degraded
initial attempt route count before assertion failure: 3
initial failure class: test assertion strict-mode ambiguity while reading route count
stop/rollback reached in initial attempt: false
post-attempt helper cleanup check: no helper process observed
rerun performed after script correction: true
rerun result: PASS
```

## Verification

```text
build:contracts: PASS
build:core: PASS
build:desktop: PASS
build:ui: PASS, existing Vite chunk-size warning only
build:core-host: PASS
Core/desktop/contracts/UI focused tests: PASS, 5 files, 145 tests
Qwen/Core/runtime helper focused tests: PASS, 7 files, 34 tests
Qwen conversation-surface local opt-in route acceptance rerun: PASS
```

## Safety Closeout

```text
default behavior changed: false
default-on Qwen routing: false
persistent Qwen routing outside bounded local session: false
browser/URL opened by product/runtime: false
VS Code launch allowed: false
allowlist expansion: false
provider planner: false
Memory write/vector retrieval: false
credential exposure: false
telemetry expansion: false
installer/update/packaging/release-channel change: false
production-facing claim: false
```

## Next Required Approval

This window should not be used as clean acceptance evidence for broader or
persistent conversation-surface Qwen routing. A fresh bounded approval is
required for a clean single-sequence rerun, any longer session, any default or
persistent product routing, route counts above three, release exposure,
telemetry, planner use, Memory vector retrieval, or allowlist expansion.

```text
decision: closed degraded with passing rerun
reason: implementation passed on rerun, but the first attempt consumed the three-route budget before a test assertion failed.
follow-up: open a fresh clean-rerun approval window before advancing this path.
```
