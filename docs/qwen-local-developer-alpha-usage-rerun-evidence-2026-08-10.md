# Qwen Local Developer Alpha Usage Rerun Evidence

Recorded: 2026-08-10

## Status

`PASSED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Approval request:

```text
docs/qwen-local-developer-alpha-usage-rerun-approval-request-2026-08-10.md
```

The approved one-window local developer-alpha Qwen usage rerun passed and
cleaned up. No product route default, product status, UI/IPC behavior,
installer, packaging, telemetry, or release-channel behavior changed under this
evidence.

## Approved Scope

Product, Security, and Release approval was provided exactly for this window.

Expected boundary:

```text
usage rerun session count: 1
route request count: 3
Qwen route enabled by default: false
explicit local developer opt-in: true
fallback/rollback route source: intent-router.deterministic.fixture
runtime path selected: temporary_venv
dependency env retained: false
artifact cache retained: false
approved artifact count: 7
digest-before-load: passed
helper count: 1
browser/URL opening blocked: true
VS Code blocked: true
Notepad/Calculator allowlist unchanged: true
raw evidence captured: false
credential exposure: false
Memory write/vector retrieval: false
provider planner: false
default-on behavior: false
release behavior changed: false
retention/cleanup decision: cleanup_passed_no_retention
```

## Evidence

```text
files changed:
- docs/qwen-local-developer-alpha-usage-rerun-approval-request-2026-08-10.md
- docs/qwen-local-developer-alpha-usage-rerun-evidence-2026-08-10.md
- docs/qwen-local-developer-alpha-usage-rerun-closeout-2026-08-10.md
- docs/brain-runtime-spine-upgrade-plan.md
- docs/jarvis-k-machine-transfer-handoff-2026-08-09.md

runtime path:
- one temporary pinned dependency environment was created for this window
- pinned requirements source:
  packages/inference-runtime-transformers-local/runtime/requirements.txt
- import-only readiness for torch, transformers, and safetensors: passed
- dependency root cleanup: passed

Qwen local usage rerun:
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

The local developer-alpha Qwen usage rerun passed and cleaned up.

```text
decision: passed_cleaned
reason: bounded Qwen usage rerun passed with three sanitized route requests; browser-only fixture and full Command Router fixture suite passed; temporary dependency/runtime/cache state was cleaned up.
follow-up: Qwen remains not default-on and not persistent active product routing. Open a separate bounded approval before persistent product-route enablement, retained runtime/cache decisions, UI/IPC runtime control, release exposure, or production-facing Qwen routing claims.
```
