# Qwen Persistent Product Route Enablement Execution Evidence

Recorded: 2026-08-10

## Status

`EXECUTED_ROLLED_BACK_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Approval request:

```text
docs/qwen-persistent-product-route-enablement-execution-approval-request-2026-08-10.md
```

The approved persistent enablement execution window completed, rolled back to
deterministic fixture, and cleaned up. Code changes were limited to fail-closed
rollback projection correctness for the Qwen activation status helper.

No default product route, UI/IPC runtime control, installer, packaging,
telemetry, release-channel behavior, or production-facing behavior changed under
this evidence.

## Approved Scope

Product, Security, and Release approval was provided exactly for this window.

Expected boundary:

```text
persistent enablement sequence count: 1
Qwen route enabled by default: false
explicit local developer opt-in: true
active route source after gates: intent-router.qwen3-0.6b
fallback/rollback route source: intent-router.deterministic.fixture
runtime path selected: temporary_venv
dependency env retention decision: cleanup_passed_no_retention
artifact cache retention decision: cleanup_passed_no_retention
helper lifecycle decision: shutdown_passed_no_retention
approved artifact count: 7
digest-before-load: passed
helper count: 1
route request count: 3
browser/URL opening blocked: true
VS Code blocked: true
Notepad/Calculator allowlist unchanged: true
raw evidence captured: false
credential exposure: false
Memory write/vector retrieval: false
provider planner: false
default-on behavior: false
release behavior changed: false
decision: executed_rolled_back_cleaned
```

## Evidence

```text
files changed:
- packages/contracts/src/qwen-product-routing-activation.ts
- packages/contracts/test/protocol.test.ts
- docs/qwen-persistent-product-route-enablement-execution-approval-request-2026-08-10.md
- docs/qwen-persistent-product-route-enablement-execution-evidence-2026-08-10.md
- docs/qwen-persistent-product-route-enablement-execution-closeout-2026-08-10.md
- docs/brain-runtime-spine-upgrade-plan.md
- docs/jarvis-k-machine-transfer-handoff-2026-08-09.md

activation projection:
- active status: active
- active route source: intent-router.qwen3-0.6b
- active product routing enabled: true
- active real runtime enabled: true
- fallback route source: intent-router.deterministic.fixture
- rollback status: fallback
- rollback active route source: intent-router.deterministic.fixture
- rollback product routing enabled: false
- rollback real runtime enabled: false
- rollback state: completed
- default behavior changed: false
- persistent cache changed: false
- uiIpcRuntimeControlAllowed: false

runtime path:
- one temporary pinned dependency environment was created for this window
- pinned requirements source:
  packages/inference-runtime-transformers-local/runtime/requirements.txt
- import-only readiness for torch, transformers, and safetensors: passed
- dependency root cleanup: passed

Qwen execution sequence:
- scope: qwen-lifecycle-backed-runtime-wiring-acceptance
- status: passed
- accepted: true
- revision: c1899de289a04d12100db370d81485cdf75e47ca
- artifact materialization: passed
- digest verification: passed
- artifact count: 7
- helper readiness: passed
- generation port: passed
- routing sample count: 3
- routing result: passed
- composition status: available
- direct action attempted: false
- persistent cache changed: false
- default behavior changed: false
- UI/IPC behavior changed: false
- release behavior changed: false
- runner cleanup: passed
```

## Verification

```text
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

browser-only fixture verification:
- node tests/desktop-command-router-browser-fixture-smoke.mjs
- PASS: newBrowserProcessIds {}

Command Router fixture suite:
- node tests/desktop-command-router-fixture-suite.mjs
- PASS: 4 smoke paths
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
raw process/browser profile/browser history evidence recorded: false
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

The persistent enablement execution window passed, rolled back, and cleaned up.

```text
decision: executed_rolled_back_cleaned
reason: active route projection reached Qwen after all approved gates, rollback projection returned to deterministic fixture, bounded route requests and Command Router safety fixtures passed, and temporary dependency/runtime state was cleaned up.
follow-up: open a separate bounded retention/product-session approval before keeping any dependency env, artifact cache, helper, UI/IPC runtime control, release exposure, or production-facing Qwen routing claim.
```
