# Qwen UI/IPC Retained Helper Route Acceptance Evidence

Recorded: 2026-08-10

## Status

`PASSED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Approval request:

```text
docs/qwen-ui-ipc-retained-helper-route-acceptance-approval-request-2026-08-10.md
```

## Approved Scope

Exact Product, Security, and Release approval was provided for one bounded
developer-alpha UI/IPC retained-helper route acceptance window.

Executed boundary:

```text
UI/IPC runtime control surface: developer_alpha_local
explicit local developer opt-in: true
retained dependency env used: true
retained approved artifact cache used: true
artifact count: 7
digest-before-load: passed
helper start count: 1
helper shutdown verified: true
generation-port readiness probes: 1
route request count: 3
Qwen route source selected only inside window: true
fallback/rollback route source: intent-router.deterministic.fixture
browser/URL opening blocked: true
VS Code blocked: true
Notepad/Calculator allowlist unchanged: true
raw evidence captured: false
credential exposure: false
Memory write/vector retrieval: false
provider planner: false
default-on behavior: false
release behavior changed: false
decision: passed
```

## Source Changes

Sanitized UI/IPC acceptance plumbing was added:

```text
contracts: Qwen runtime control status exposes helper/probe/route/shutdown counts
desktop main: retained-session digest verification, supervised helper lifecycle, bounded generation-port readiness, and Core route acceptance behind UI/IPC start/stop/rollback
desktop package: adds explicit local runtime/Core/Qwen workspace dependencies required by the bounded UI/IPC control
UI: shows helper start count, generation probe count, route count, and shutdown verification
tests: source assertions and Electron UI/IPC retained-helper acceptance smoke
```

The implementation uses a fixed retained session, fixed retained dependency
environment, fixed retained approved artifact cache, fixed helper script, fixed
resource lease, and fixed route request limit. It does not accept arbitrary
paths, command-line arguments, browser/URL input, shell input, or expanded app
targets.

## Verification

Builds:

```text
npm.cmd run build:contracts: PASS
npm.cmd run build:core: PASS
npm.cmd run build:core-host: PASS
npm.cmd run build:inference-runtime-transformers-local: PASS
npm.cmd run build:inference-adapter-qwen-router: PASS
npm.cmd run build:desktop: PASS
npm.cmd run build:ui: PASS
```

Tests:

```text
protocol/desktop/UI/hook focused tests: PASS, 4 files, 74 tests
Qwen/Core/runtime helper focused tests: PASS, 8 files, 104 tests
Qwen UI/IPC retained-helper route acceptance: PASS
Command Router browser-only fixture: PASS, no new browser process IDs
Command Router full fixture suite: PASS, 4 smoke paths
```

Full fixture suite sanitized outcomes:

```text
Notepad allowlist fixture: PASS, no new Notepad process IDs
Calculator allowlist fixture: PASS, no new Calculator process IDs
Browser projection fixture: PASS, no new browser process IDs
VS Code blocked fixture: PASS, no new VS Code process IDs
```

UI/IPC acceptance sanitized outcomes:

```text
active state visible: true
stop state visible: true
rollback state visible: true
helper start count visible: true
generation probe count visible: true
route request count visible: true
shutdown verification visible: true
```

## Boundary Confirmation

```text
helper started outside UI/IPC acceptance window: false
helper retained running after stop/rollback: false
generation port invoked outside UI/IPC acceptance window: false
Qwen persistent product route enabled: false
deterministic fixture default preserved: true
deterministic fixture fallback preserved: true
deterministic fixture rollback preserved: true
allowlist expanded: false
browser/URL opened by product/runtime: false
VS Code launch allowed: false
shell/PowerShell/cmd/terminal/script execution by product/runtime: false
arbitrary executable path or command-line arguments by product/runtime: false
credential access: false
Memory write/vector retrieval: false
provider planner: false
telemetry changed: false
installer/packaging/release-channel changed: false
production-facing claim added: false
```

## Result

```text
decision: PASSED_DEVELOPER_ALPHA_EVIDENCE_ONLY
reason: one bounded UI/IPC retained-helper acceptance session completed with digest-before-load, one helper start, one generation-port readiness probe, three sanitized Core route requests, stop/rollback state, and helper shutdown verified.
follow-up: any persistent Qwen product routing, default-on behavior, broader route sessions, release exposure, telemetry, packaging, allowlist expansion, provider planner, or Memory vector retrieval requires a fresh bounded approval.
```
