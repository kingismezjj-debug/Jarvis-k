# Qwen Product Routing Activation Implementation Evidence

Recorded: 2026-08-10

## Status

`IMPLEMENTED_VERIFIED_NO_RUNTIME`

Approval request:

```text
docs/qwen-product-routing-activation-implementation-approval-request-2026-08-10.md
```

Code changes were limited to default-off status/gate/state/rollback plumbing and
sanitized UI/status projection. No runtime, artifact, helper, generation port,
dependency environment, product route behavior, installer, packaging, or release
channel behavior was changed.

## Approved Scope

Product, Security, and Release approval was provided exactly for this bounded
window.

Expected boundary:

```text
implementation kind: default-off status/gate/state/rollback plumbing only
Qwen product routing: false
realQwenRuntimeEnabled: false
dependency env retained: false
artifact cache retained: false
helper startup: false
generation port invoked: false
default behavior changed: false
UI/IPC runtime control shipped: false
release behavior changed: false
```

## Evidence

```text
files changed:
- packages/contracts/src/qwen-product-routing-activation.ts
- packages/contracts/src/protocol.ts
- packages/contracts/src/index.ts
- packages/contracts/test/protocol.test.ts
- apps/desktop/src/main.ts
- apps/desktop/test/command-router-product-mode-source.test.ts
- apps/ui/src/App.tsx
- apps/ui/test/app-voice-ui-source.test.ts
- docs/qwen-product-routing-activation-implementation-evidence-2026-08-10.md
- docs/qwen-product-routing-activation-implementation-closeout-2026-08-10.md
- docs/brain-runtime-spine-upgrade-plan.md
- docs/jarvis-k-machine-transfer-handoff-2026-08-09.md

status states:
- disabled
- ready
- armed
- active
- fallback
- degraded
- blocked

current projected state:
- product mode off: disabled
- product mode on: ready
- active route source: intent-router.deterministic.fixture

activation gates:
- preparedPolicyReviewed: true
- readinessEvidencePassed: true
- noRuntimeProductBindingPresent: true
- coreSelectionFallbackPreserved: true
- commandRouterSafetyGatesPreserved: true
- deterministicFixtureActive: true
- runtimeRetentionApproved: false
- manualAcceptanceApproved: false
- realQwenRuntimeEnabled: false
- productRoutingArmed: false
- helperStartupAllowed: false
- artifactMaterializationAllowed: false
- dependencyEnvironmentRetentionAllowed: false
- generationPortInvocationAllowed: false
- uiIpcRuntimeControlAllowed: false

fallback/rollback:
- fallbackRouteSource: intent-router.deterministic.fixture
- rollbackState: ready when activation is ready
- rollbackState: completed for fallback projection
- no direct rollback action added

focused tests:
- npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts apps/core-host/test/qwen-fast-router-generation-port.test.ts apps/core-host/test/qwen-fast-router-wiring.test.ts packages/core/test/runtime.test.ts packages/inference-adapter-qwen-router/test/provider.test.ts
- result: PASS, 8 files, 150 tests

builds:
- npm.cmd run build:contracts: PASS
- npm.cmd run build:inference-adapter-qwen-router: PASS
- npm.cmd run build:core: PASS
- npm.cmd run build:core-host: PASS
- npm.cmd run build:ui: PASS
- npm.cmd run build:desktop: PASS

fixture suite:
- first full run: local app allowlist PASS, calculator PASS, browser projection reported one new Firefox process and stopped
- immediate browser-only rerun: PASS, newBrowserProcessIds {}
- second full run: PASS, all four suite entries passed
- final accepted suite result: PASS

Qwen product routing: false
realQwenRuntimeEnabled: false
runtime/helper/artifact action: none
dependency environment retained: false
artifact cache retained: false
generation port invoked: false
default behavior changed: false
allowlist expanded: false
release behavior changed: false

reason codes:
- QWEN_PRODUCT_ROUTING_ACTIVATION_DISABLED
- QWEN_PRODUCT_ROUTING_ACTIVATION_READY
- QWEN_PRODUCT_ROUTING_ROLLBACK_TO_FIXTURE
- QWEN_PRODUCT_ROUTING_ACTIVATION_DEGRADED
- QWEN_PRODUCT_ROUTING_ACTIVATION_BLOCKED
- QWEN_PRODUCT_ROUTING_RUNTIME_DISABLED
- QWEN_PRODUCT_ROUTING_PRODUCT_ROUTE_DISABLED
```

## Result

Implementation complete inside the approved no-runtime window.

```text
decision: passed
reason: default-off Qwen activation plumbing is contract-visible and UI-visible, while product routing, runtime/helper/artifact/dependency access, generation port invocation, default behavior, allowlist, and release behavior remain unchanged.
follow-up: open a separate bounded runtime-retention/manual-acceptance approval before any Qwen product route can be armed or made active.
```
