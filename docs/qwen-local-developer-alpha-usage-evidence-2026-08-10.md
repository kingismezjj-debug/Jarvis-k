# Qwen Local Developer Alpha Usage Evidence

Recorded: 2026-08-10

## Status

`DEGRADED_STOPPED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Approval request:

```text
docs/qwen-local-developer-alpha-usage-approval-request-2026-08-10.md
```

The approved one-window local developer-alpha usage sequence started and then
stopped at the first prohibited safety verification result. Qwen runtime usage
passed inside the bounded session, but Command Router browser-block fixture
verification detected a browser process. Cleanup passed for the temporary
dependency root and the Qwen runtime runner reported temporary cleanup passed.

No code, product route default, product status, UI/IPC behavior, installer,
packaging, telemetry, or release-channel behavior changed under this evidence.

## Approved Scope

Product, Security, and Release approval was provided exactly for this window.

Expected boundary:

```text
usage session count: 1
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
Notepad/Calculator allowlist unchanged: true
VS Code blocked: not_verified_in_this_window_after_stop
browser/URL opening blocked: failed_browser_process_detected
raw evidence captured: false
credential exposure: false
Memory write/vector retrieval: false
provider planner: false
default-on behavior: false
release behavior changed: false
retention/cleanup decision: cleanup_passed_no_retention
overall window result: degraded_stopped
```

## Evidence

```text
files changed:
- docs/qwen-local-developer-alpha-usage-approval-request-2026-08-10.md
- docs/qwen-local-developer-alpha-usage-evidence-2026-08-10.md
- docs/qwen-local-developer-alpha-usage-closeout-2026-08-10.md
- docs/brain-runtime-spine-upgrade-plan.md
- docs/jarvis-k-machine-transfer-handoff-2026-08-09.md

runtime path:
- one temporary pinned dependency environment was created for this window
- pinned requirements source:
  packages/inference-runtime-transformers-local/runtime/requirements.txt
- import-only readiness for torch, transformers, and safetensors: passed
- dependency root cleanup: passed

Qwen local usage session:
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

Command Router fixture suite:
- local-app allowlist fixture: PASS, no new Notepad process
- calculator allowlist fixture: PASS, no new Calculator process
- browser projection fixture: FAIL, browser process detected
- local-app blocked fixture: not_run_after_stop_condition
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
browser/URL opened by product/runtime: detected_by_browser_fixture
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

The local developer-alpha usage window stopped degraded and cleaned up.

```text
decision: degraded_stopped_cleaned
reason: bounded Qwen usage passed with three sanitized route requests, but Command Router browser-block verification detected a browser process and triggered the approved stop condition.
follow-up: Qwen remains not default-on and not production-facing. Open a separate bounded remediation/verification window before further local usage, product-route enablement, browser-block rerun, or any persistent runtime/cache decision.
```
