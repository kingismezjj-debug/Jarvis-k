# Qwen Product Route Arming Evidence

Recorded: 2026-08-10

## Status

`PASSED_ARMED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Approval request:

```text
docs/qwen-product-route-arming-approval-request-2026-08-10.md
```

The approved one-window arming sequence passed and cleaned up. Code changes were
limited to a fail-closed contract projection that can represent `armed` only
when explicit window arming gates are provided. No persistent product route,
default behavior, UI/IPC runtime control, installer, packaging, telemetry,
release-channel behavior, production-facing behavior, or allowlist behavior
changed.

## Approved Scope

Product, Security, and Release approval was provided exactly for this window.

Expected boundary:

```text
arming state transition: ready -> armed -> cleaned
runtime path selected: temporary_venv
dependency env retained: false
artifact cache retained: false
approved artifact count: 7
digest-before-load: passed
helper count: 1
generation-port readiness probes: 1
manual route acceptance sequences: 1
Qwen active outside window: false
default/fallback route source: intent-router.deterministic.fixture
Notepad/Calculator allowlist unchanged: true
VS Code blocked: true
browser/URL opening blocked: true
raw evidence captured: false
credential exposure: false
Memory write/vector retrieval: false
provider planner: false
default behavior changed: false
release behavior changed: false
cleanup/retention decision: cleanup_passed_no_retention
```

## Evidence

```text
files changed:
- packages/contracts/src/qwen-product-routing-activation.ts
- packages/contracts/test/protocol.test.ts
- docs/qwen-product-route-arming-approval-request-2026-08-10.md
- docs/qwen-product-route-arming-evidence-2026-08-10.md
- docs/qwen-product-route-arming-closeout-2026-08-10.md
- docs/brain-runtime-spine-upgrade-plan.md
- docs/jarvis-k-machine-transfer-handoff-2026-08-09.md

contract arming projection:
- default product status remains disabled or ready unless explicit arming-window gates are supplied
- armed status requires prepared policy, readiness evidence, no-runtime binding, Core fallback, Command Router safety, fixture fallback, runtime retention approval, manual acceptance approval, helper startup allowed, artifact materialization allowed, generation-port invocation allowed, and productRoutingArmed true
- productRoutingEnabled remains false
- activeRouteSource remains intent-router.deterministic.fixture
- uiIpcRuntimeControlAllowed remains false
- realQwenRuntimeEnabled remains false
```

## Verification

```text
Qwen arming acceptance:
- scope: qwen-lifecycle-backed-runtime-wiring-acceptance
- status: passed
- accepted: true
- revision: c1899de289a04d12100db370d81485cdf75e47ca
- artifact materialization: passed
- digest verification: passed
- artifact count: 7
- helper readiness: passed
- generation port: passed
- routing sample count: 1
- routing result: passed
- composition status: available
- direct action attempted: false
- persistent cache changed: false
- default behavior changed: false
- UI/IPC behavior changed: false
- release behavior changed: false
- runner cleanup: passed
- dependency root cleanup: passed

focused tests:
- npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts apps/core-host/test/qwen-fast-router-generation-port.test.ts apps/core-host/test/qwen-fast-router-wiring.test.ts packages/core/test/runtime.test.ts packages/inference-adapter-qwen-router/test/provider.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-client.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-process-transport.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-protocol.test.ts
- PASS: 11 files, 165 tests

builds:
- npm.cmd run build:contracts: PASS
- npm.cmd run build:inference-runtime-transformers-local: PASS
- npm.cmd run build:inference-adapter-qwen-router: PASS
- npm.cmd run build:core: PASS
- npm.cmd run build:core-host: PASS
- npm.cmd run build:ui: PASS
- npm.cmd run build:desktop: PASS

Command Router fixture suite:
- local-app allowlist fixture: PASS, newNotepadProcessIds []
- calculator allowlist fixture: PASS, newCalculatorProcessIds []
- browser projection fixture: PASS, newBrowserProcessIds {}
- local-app blocked fixture: PASS, newCodeProcessIds []
```

## Safety Flags

```text
raw prompt recorded: false
raw model output recorded: false
helper diagnostics recorded: false
raw Python path recorded: false
raw private path recorded: false
raw package log recorded: false
artifact source URL recorded: false
signed URL/token recorded: false
vector/stack/benchmark recorded: false
credential accessed: false
browser/URL opened by product/runtime: false
shell/PowerShell/cmd/terminal invoked by product/runtime: false
arbitrary process or command-line arguments by product/runtime: false
Memory write/vector retrieval: false
provider planner: false
allowlist expanded: false
installer/update/packaging/release changed: false
telemetry expanded: false
production-facing claim changed: false
```

## Result

The one-window arming sequence passed and closed with cleanup.

```text
decision: passed_armed_cleaned
reason: arming status reached armed only inside the approved window after fresh runtime/artifact/helper/generation-port gates passed; cleanup removed dependency/artifact/cache state; Command Router fixture suite confirmed Notepad/Calculator allowlist unchanged, browser blocked, and VS Code blocked.
follow-up: Qwen remains unavailable as a persistent product route source. Open a separate bounded approval before any persistent route-source change, retained cache, UI/IPC runtime control, default behavior change, or production-facing claim.
```
