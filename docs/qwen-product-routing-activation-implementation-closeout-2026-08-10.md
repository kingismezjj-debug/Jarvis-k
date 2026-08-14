# Qwen Product Routing Activation Implementation Closeout

Recorded: 2026-08-10

## Status

`IMPLEMENTED_VERIFIED_NO_RUNTIME`

The approved implementation window is complete. It added default-off Qwen
product-routing activation status/gate/state/rollback plumbing and sanitized UI
projection only.

## What Changed

```text
contract:
- added qwen-product-routing.activation.default-off.v1 status schema
- added supported states: disabled, ready, armed, active, fallback, degraded, blocked
- added source-only activation evaluator
- embedded activation status under CommandRouter qwenFastRouterBinding

desktop:
- projects activation status through existing Command Router product-mode status
- keeps activeRouteSource intent-router.deterministic.fixture
- keeps productRoutingEnabled false
- keeps realQwenRuntimeEnabled false

ui:
- shows activation policy, activation state, rollback state, and sanitized gates
- adds no runtime start, helper start, route switch, IPC control, or product action

tests:
- covers activation schema/evaluator and UI/desktop source projection
```

## Verified Invariants

```text
Qwen product routing: false
realQwenRuntimeEnabled: false
runtimeAccessed: false
artifactAccessed: false
helperStarted: false
generationPortInvoked: false
persistentCacheChanged: false
defaultBehaviorChanged: false
allowlistExpanded: false
activeRouteSource: intent-router.deterministic.fixture
fallbackRouteSource: intent-router.deterministic.fixture
```

## Verification

```text
npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts apps/core-host/test/qwen-fast-router-generation-port.test.ts apps/core-host/test/qwen-fast-router-wiring.test.ts packages/core/test/runtime.test.ts packages/inference-adapter-qwen-router/test/provider.test.ts
PASS: 8 files, 150 tests

npm.cmd run build:contracts
PASS

npm.cmd run build:inference-adapter-qwen-router
PASS

npm.cmd run build:core
PASS

npm.cmd run build:core-host
PASS

npm.cmd run build:ui
PASS

npm.cmd run build:desktop
PASS

node tests/desktop-command-router-browser-fixture-smoke.mjs
PASS

node tests/desktop-command-router-fixture-suite.mjs
PASS
```

Note: the first full fixture-suite run reported a new Firefox process during the
browser projection entry. The browser-only rerun immediately passed with
`newBrowserProcessIds {}`, and the second full fixture-suite rerun passed all
four entries. Final accepted verification is the passing rerun.

## Decision

```text
decision: passed
reason: activation plumbing is visible and tested, but Qwen remains unavailable for product routing and deterministic fixture routing remains the active product route source.
follow-up: any runtime retention, helper startup, generation-port invocation, or Qwen product-route arming still requires a separate bounded approval window.
```
