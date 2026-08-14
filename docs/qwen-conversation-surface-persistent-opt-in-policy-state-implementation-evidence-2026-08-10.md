# Qwen Conversation Surface Persistent Opt-In Policy/State Implementation Evidence

Recorded: 2026-08-10

## Status

`CLOSED_PASSED_PERSISTENT_OPT_IN_POLICY_STATE_IMPLEMENTATION_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Related approval request:

```text
docs/qwen-conversation-surface-persistent-opt-in-policy-state-implementation-approval-request-2026-08-10.md
```

## Approval Capture

```text
Product approval: captured exact in-thread approval for source/code/test-only policy/state implementation
Security approval: captured exact in-thread approval for bounded fail-closed source/code/test-only implementation
Release approval: captured exact in-thread approval for developer-alpha evidence only
```

## Baseline Reviewed

```text
persistent opt-in readiness evidence reviewed: true
product-route acceptance / enablement evidence reviewed: true
implementation preparation evidence reviewed: true
policy refresh packet reviewed: true
product-readiness packet reviewed: true
UI/IPC runtime control path reviewed: true
activation status/gate plumbing reviewed: true
Core selection/fallback contracts reviewed: true
Command Router safety gates reviewed: true
```

## Implementation Result

Only default-off policy/state plumbing and sanitized read-only status projection
were implemented.

```text
implementation completed: true
persistent opt-in policy/state projection prepared: true
policy id: qwen-conversation-surface.persistent-opt-in.default-off.v1
explicit local developer opt-in required: true
explicit local developer opt-in enabled by default: false
Qwen route selectable by default: false
product route execution enabled by default: false
limited product-session only: true
route request limit projection: 3
retained session required: true
helper startup allowed by policy/state: false
generation-port invocation allowed by policy/state: false
default route source: intent-router.deterministic.fixture
fallback route source: intent-router.deterministic.fixture
rollback route source: intent-router.deterministic.fixture
direct action enabled by default: false
browser/URL opening enabled by default: false
VS Code blocked by default: true
allowlist targets unchanged: notepad, calculator
default behavior changed: false
release behavior changed: false
```

Code changes:

```text
contracts: conversationSurfaceProductRoute.persistentOptIn schema added
desktop: Command Router product-mode status projects persistentOptIn fail-closed state
UI: sanitized read-only metrics added for Persistent opt-in and Session scope
tests: contracts fixture/assertions and desktop/UI source assertions updated
```

## Verification

```text
npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts
result: PASS
test files: 3 passed
tests: 65 passed

npm.cmd run build:contracts
result: PASS

npm.cmd run build:desktop
result: PASS

npm.cmd run build:ui
result: PASS
note: existing Vite chunk-size warning only

helper cleanup check: NO_HELPER_PROCESS_OBSERVED
```

## Guardrail Results

```text
helper started: false
generation-port invoked: false
runtime route request sent: false
bounded usage rerun attempted: false
limited product-session execution attempted: false
product route enablement execution attempted: false
Qwen active product route execution attempted: false
route-count extension changed: false
Qwen route selectable by default: false
product route execution enabled by default: false
direct action enabled by default: false
browser/URL opening by product/runtime: false
VS Code launch by product/runtime: false
allowlist expansion: false
provider planner used: false
Memory write/vector retrieval used: false
credential access: false
raw evidence captured: false
telemetry changed: false
installer/update/packaging/release-channel changed: false
production-facing claim added: false
```

## Closeout

This source/code/test-only implementation window passed as developer-alpha
evidence only. The conversation-surface product-route projection now includes
default-off persistent opt-in policy/state plumbing while preserving
deterministic fixture default/fallback/rollback, disabled direct action,
Browser/URL blocking, VS Code blocking, Notepad/Calculator-only allowlist, and
no runtime authority by default.

It does not authorize helper startup, generation-port invocation, runtime route
requests, product-route execution, default-on routing, persistent product
routing outside bounded windows, route-count extension, allowlist expansion,
release exposure, or a production-facing Qwen routing claim.
