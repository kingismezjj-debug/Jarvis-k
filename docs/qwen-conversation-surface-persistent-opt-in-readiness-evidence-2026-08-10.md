# Qwen Conversation Surface Persistent Opt-In Readiness / Limited Product-Session Evidence

Recorded: 2026-08-10

## Status

`CLOSED_PASSED_PERSISTENT_OPT_IN_READINESS_LIMITED_PRODUCT_SESSION_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Related approval request:

```text
docs/qwen-conversation-surface-persistent-opt-in-readiness-approval-request-2026-08-10.md
```

## Approval Capture

```text
Product approval: captured exact in-thread approval for one-window persistent opt-in readiness / limited product-session
Security approval: captured exact in-thread approval for bounded fail-closed limited product-session
Release approval: captured exact in-thread approval for developer-alpha evidence only
```

## Baseline Reviewed

```text
product-route acceptance / enablement evidence reviewed: true
implementation preparation evidence reviewed: true
policy refresh packet reviewed: true
product-readiness packet reviewed: true
retained local product-session evidence reviewed: true
UI/IPC runtime control path reviewed: true
activation status/gate plumbing reviewed: true
Core selection/fallback contracts reviewed: true
Command Router safety gates reviewed: true
```

## Limited Product-Session Result

Exactly one bounded developer-alpha local explicit opt-in limited
product-session sequence was executed.

```text
limited product-session sequence count: 1
retained dependency environment used: true
retained approved artifact cache used: true
approved artifact count: 7
digest-before-load: passed
helper start count: 1
generation-port readiness probe count: 1
main-conversation route request count: 3
Qwen selected only inside bounded limited session: true
direct action disabled for every route: true
route count visible: true
deterministic fixture default/fallback/rollback preserved: true
browser/URL opening blocked: true
VS Code blocked: true
allowlist targets unchanged: notepad, calculator
helper shutdown verified: true
rollback/stop state verified: true
raw evidence captured: false
default behavior changed: false
persistent product routing outside limited session: false
release behavior changed: false
```

Sanitized route coverage:

```text
route count: 3
route source during bounded limited session: intent-router.qwen3-0.6b
fallback/rollback route source: intent-router.deterministic.fixture
route evidence type: sanitized intent/provider/direct-action/status only
raw prompt captured: false
raw model output captured: false
helper diagnostic captured: false
private path captured: false
token/vector/stack/benchmark captured: false
raw process/browser profile/history captured: false
```

## Verification

```text
pre-run helper check: NO_HELPER_PROCESS_OBSERVED

npm.cmd run build:contracts
result: PASS

npm.cmd run build:desktop
result: PASS

node tests/qwen-conversation-surface-local-opt-in-route-acceptance.mjs
result: PASS
sequence count: 1
helper start count: 1
generation-port readiness probe count: 1
main-conversation route request count: 3
Qwen selected for conversation routes: true
direct action disabled: true
deterministic fixture rollback: true
helper shutdown verified: true
browser/URL blocked: true
VS Code blocked: true

npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts
result: PASS
test files: 3 passed
tests: 65 passed

npm.cmd run build:ui
result: PASS
note: existing Vite chunk-size warning only

post-run helper check: NO_HELPER_PROCESS_OBSERVED
```

## Guardrail Results

```text
helper started by this window: true, exactly one supervised helper
generation-port invoked by this window: true, exactly one readiness probe
main-conversation runtime route requests executed: true, exactly three
second rerun attempted: false
route-count extension: false
Qwen active outside bounded limited session: false
product route enabled by default: false
persistent product route enabled outside limited session: false
direct action enabled: false
browser/URL opening by product/runtime: false
VS Code launch by product/runtime: false
allowlist expansion: false
provider planner used: false
Memory write/vector retrieval used: false
credential access: false
telemetry changed: false
installer/update/packaging/release-channel changed: false
production-facing claim added: false
```

## Closeout

This limited product-session readiness window passed as developer-alpha evidence
only. The run proves the conversation surface can re-enter a bounded local
explicit opt-in session using retained env/cache and select Qwen after
runtime/artifact/helper/generation-port/fallback/safety gates pass, while
preserving direct-action safety, Browser/URL blocking, VS Code blocking,
Notepad/Calculator-only allowlist, deterministic fixture fallback, and
rollback/stop state.

It does not authorize default-on routing, persistent product routing outside a
bounded limited session, route-count extension, allowlist expansion, release
exposure, or a production-facing Qwen routing claim.
