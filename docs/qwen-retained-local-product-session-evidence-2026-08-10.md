# Qwen Retained Local Product Session Evidence

Recorded: 2026-08-10

## Status

`RETAINED_SESSION_VERIFIED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Approval request:

```text
docs/qwen-retained-local-product-session-approval-request-2026-08-10.md
```

The approved retained local product-session window completed. One bounded
dependency environment and one approved seven-file artifact cache were retained
for local developer-alpha use. The helper was started only for verification and
shut down after verification.

No code, default product route, product status, UI/IPC behavior, installer,
packaging, telemetry, release-channel behavior, or production-facing behavior
changed under this evidence.

## Approved Scope

Product, Security, and Release approval was provided exactly for this window.

Expected boundary:

```text
retained local product-session count: 1
Qwen route enabled by default: false
explicit local developer opt-in: true
active route source after gates: intent-router.qwen3-0.6b
fallback/rollback route source: intent-router.deterministic.fixture
dependency env retention decision: retained_bounded_session
artifact cache retention decision: retained_bounded_session
helper lifecycle decision: shutdown_after_verification
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
decision: retained_session_verified
```

## Evidence

```text
files changed:
- docs/qwen-retained-local-product-session-approval-request-2026-08-10.md
- docs/qwen-retained-local-product-session-evidence-2026-08-10.md
- docs/qwen-retained-local-product-session-closeout-2026-08-10.md
- docs/brain-runtime-spine-upgrade-plan.md
- docs/jarvis-k-machine-transfer-handoff-2026-08-09.md

retained session:
- session id: qwen-retained-product-session-2026-08-10
- dependency env: retained_bounded_session
- pip cache: scoped_to_bounded_session
- artifact cache: retained_bounded_session
- approved artifact count: 7
- digest-before-load: passed
- helper lifecycle: shutdown_after_verification
- sanitized session marker: written

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

Qwen retained-session route sequence:
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
- download enabled: false
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

The retained local product-session window passed and retained bounded session
materials.

```text
decision: retained_session_verified
reason: bounded dependency environment and approved artifact cache were retained; helper was shut down after verification; retained-session Qwen route acceptance and Command Router safety fixtures passed.
follow-up: open a separate bounded approval before UI/IPC runtime controls, broader local product sessions, helper persistence, release exposure, telemetry, installer/packaging, Memory vector retrieval, provider planner, or production-facing Qwen routing claims.
```
