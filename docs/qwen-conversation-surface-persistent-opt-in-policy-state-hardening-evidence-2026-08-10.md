# Qwen Conversation Surface Persistent Opt-In Policy/State Source Audit / Hardening Evidence

Recorded: 2026-08-10

## Status

`CLOSED_PASSED_PERSISTENT_OPT_IN_POLICY_STATE_HARDENING_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Related approval request:

```text
docs/qwen-conversation-surface-persistent-opt-in-policy-state-hardening-approval-request-2026-08-10.md
```

## Approval Capture

```text
Product approval: captured exact in-thread approval for source/docs/test audit and hardening
Security approval: captured exact in-thread approval for bounded fail-closed source/docs/test hardening
Release approval: captured exact in-thread approval for developer-alpha evidence only
```

## Audit Result

```text
persistent opt-in policy/state implementation evidence reviewed: true
persistent opt-in readiness evidence reviewed: true
product-route acceptance / enablement evidence reviewed: true
source/docs/test audit completed: true
narrow hardening needed: true
narrow hardening completed: true
hardening type: negative schema tests for unsafe persistentOptIn variants
```

Reviewed invariants:

```text
persistentOptIn default-off schema invariants verified: true
desktop fail-closed status projection verified: true
UI read-only sanitized projection verified: true
deterministic fixture default/fallback/rollback preserved: true
direct action disabled by policy/state: true
browser/URL opening disabled by policy/state: true
VS Code blocked by policy/state: true
helper startup allowed by policy/state: false
generation-port invocation allowed by policy/state: false
product route execution enabled by policy/state: false
```

Hardening added:

```text
contracts negative test: localDeveloperOptInEnabled true is rejected
contracts negative test: helperStartupAllowedByPolicyState true is rejected
contracts negative test: routeRequestLimit wider than 3 is rejected
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

This source/docs/test audit and hardening window passed as developer-alpha
evidence only. The default-off persistent opt-in policy/state projection remains
fail-closed, with added negative schema tests preventing unsafe opt-in,
helper-start, or route-limit widening in the sanitized product-mode status
contract.

It does not authorize helper startup, generation-port invocation, runtime route
requests, product-route execution, default-on routing, persistent product
routing outside bounded windows, route-count extension, allowlist expansion,
release exposure, or a production-facing Qwen routing claim.
