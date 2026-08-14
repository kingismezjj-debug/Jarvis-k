# Qwen Persistent Product Route Enablement Evidence

Recorded: 2026-08-10

## Status

`PREPARED_VERIFIED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Approval request:

```text
docs/qwen-persistent-product-route-enablement-approval-request-2026-08-10.md
```

The approved preparation completed with cleanup. Code changes were limited to a
default-off explicit opt-in activation projection that can represent Qwen as the
active route source only when persistent enablement gates are supplied. Normal
desktop product status remains deterministic fixture by default.

## Approved Scope

Product, Security, and Release approval was provided exactly for this window.

Expected boundary:

```text
default route before enablement: intent-router.deterministic.fixture
active route after explicit enablement: intent-router.qwen3-0.6b in contract projection only
fallback/rollback route source: intent-router.deterministic.fixture
runtime path selected: temporary_venv
dependency env retained: false
artifact cache retained: false
approved artifact count: 7
digest-before-load: passed
helper count: 1
generation-port readiness: passed
Qwen route enabled by default: false
Qwen route enabled after explicit opt-in: true in contract projection only
Notepad/Calculator allowlist unchanged: true
VS Code blocked: true
browser/URL opening blocked: true
raw evidence captured: false
credential exposure: false
Memory write/vector retrieval: false
provider planner: false
default-on behavior: false
release behavior changed: false
retention/cleanup decision: cleanup_passed_no_retention
rollback decision: deterministic_fixture_preserved
```

## Evidence

```text
files changed:
- packages/contracts/src/qwen-product-routing-activation.ts
- packages/contracts/test/protocol.test.ts
- docs/qwen-persistent-product-route-enablement-approval-request-2026-08-10.md
- docs/qwen-persistent-product-route-enablement-evidence-2026-08-10.md
- docs/qwen-persistent-product-route-enablement-closeout-2026-08-10.md
- docs/brain-runtime-spine-upgrade-plan.md
- docs/jarvis-k-machine-transfer-handoff-2026-08-09.md

contract enablement projection:
- default desktop invocation: disabled or ready, route source fixture
- explicit persistent enablement invocation: active route source qwen3-0.6b
- fallback route source: intent-router.deterministic.fixture
- explicit opt-in required: true
- persistentEnablementApproved required: true
- runtime/artifact/helper/generation gates required: true
- uiIpcRuntimeControlAllowed: false
- default-on behavior: false
```

## Verification

```text
Qwen runtime acceptance:
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
- first full run: local-app allowlist fixture timed out waiting for control-on UI state
- immediate local-app allowlist rerun: PASS, newNotepadProcessIds []
- final full suite rerun: PASS, 4 smoke paths
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

Persistent route enablement preparation passed and closed with cleanup.

```text
decision: prepared_verified_cleaned
reason: default-off explicit opt-in persistent enablement projection was added and verified; bounded runtime acceptance passed; deterministic fixture fallback and Command Router safety gates remain preserved.
follow-up: Qwen is not default-on and no production/release exposure changed. Open a separate bounded approval before any user-facing release exposure or production-facing Qwen routing claim.
```
