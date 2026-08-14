# Qwen Runtime Retention Manual Acceptance Evidence

Recorded: 2026-08-10

## Status

`PASSED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Approval request:

```text
docs/qwen-runtime-retention-manual-acceptance-approval-request-2026-08-10.md
```

The approved one-window runtime-retention/manual-acceptance sequence passed and
was cleaned up. No code, product status, UI/IPC product control, installer,
packaging, telemetry, release-channel behavior, production-facing behavior, or
allowlist behavior changed.

## Approved Scope

Product, Security, and Release approval was provided exactly for this window.

Expected boundary:

```text
runtime path selected: temporary_venv
dependency env retained: false
artifact cache retained: false
approved artifact count: 7
digest-before-load: passed
helper count: 1
generation-port readiness probes: 1
manual route sequences: 1
Qwen product routing outside window: false
default product route source: intent-router.deterministic.fixture
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

## Verification

```text
dependency setup path kind: temporary_venv
dependency import readiness: PASS
python major/minor: 3.14
torch import: true
transformers import: true
safetensors import: true

Qwen lifecycle acceptance:
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

The one-window manual acceptance passed and closed with cleanup.

```text
decision: passed_cleaned
reason: bounded dependency setup, approved artifact materialization, digest-before-load, one helper, one generation-port probe, and one sanitized route sample passed; Command Router fixture suite confirmed Notepad/Calculator allowlist unchanged, browser blocked, and VS Code blocked.
follow-up: Qwen remains unavailable as a persistent product route source. Open a separate bounded approval before any retained cache, product route arming, default behavior, UI/IPC runtime control, or production-facing claim.
```
