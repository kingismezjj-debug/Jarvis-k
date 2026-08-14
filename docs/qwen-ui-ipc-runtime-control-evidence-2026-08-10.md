# Qwen UI/IPC Runtime Control Evidence

Recorded: 2026-08-10

## Status

`PASSED_PREPARED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Approval request:

```text
docs/qwen-ui-ipc-runtime-control-approval-request-2026-08-10.md
```

## Approved Scope

Exact Product, Security, and Release approval was provided for one bounded
developer-alpha UI/IPC runtime control window.

Implemented scope:

```text
UI/IPC runtime control surface: prepared developer_alpha_local
Qwen runtime control default-on: false
explicit local developer opt-in: true
retained session status projected: true
helper lifecycle status projected: true
helper start control: bounded prepared state only
helper stop control: bounded state reset only
rollback control: bounded deterministic fixture fallback state only
active route source in this window: intent-router.deterministic.fixture
fallback/rollback route source: intent-router.deterministic.fixture
route request count in this window: 0
browser/URL opening blocked: verified
VS Code blocked: verified
Notepad/Calculator allowlist unchanged: true
raw evidence captured: false
credential exposure: false
Memory write/vector retrieval: false
provider planner: false
default-on behavior: false
release behavior changed: false
decision: passed as prepared UI/IPC runtime control evidence only
```

## Source Changes

Sanitized UI/IPC control plumbing was added:

```text
contracts: Qwen runtime control status/action/set-result schema and bridge methods
desktop main: retained-session status projection and bounded IPC handlers
desktop preload: schema-validated bridge methods
UI hook: status refresh and start/stop/rollback action dispatch
UI settings: retained Qwen session control panel with start/stop/rollback buttons
tests: protocol, desktop wiring, hook wiring, and UI source coverage
```

The implemented `start` action records explicit local opt-in and projects
`start_prepared`; it does not launch a helper, access artifacts, invoke a
generation port, or make Qwen the active route source in this window.

## Verification

Builds:

```text
npm.cmd run build:contracts: PASS
npm.cmd run build:desktop: PASS
npm.cmd run build:ui: PASS
npm.cmd run build:core-host: PASS
npm.cmd run build:core: PASS
npm.cmd run build -w @jarvis-k/inference-runtime-transformers-local: PASS
npm.cmd run build -w @jarvis-k/inference-adapter-qwen-router: PASS
```

Tests:

```text
protocol/desktop/UI/hook focused tests: PASS, 4 files, 74 tests
Qwen/Core/runtime helper focused tests: PASS, 8 files, 104 tests
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

## Boundary Confirmation

```text
helper started in this window: false
generation port invoked in this window: false
Qwen product route active in this window: false
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
decision: PASSED_PREPARED_DEVELOPER_ALPHA_EVIDENCE_ONLY
reason: UI/IPC runtime control was implemented as a default-off, explicit-opt-in, sanitized prepared control surface over the retained Qwen product session while preserving deterministic fixture as active/fallback/rollback source.
follow-up: any real helper start, active Qwen route, route request usage, persistent control session, or production/release exposure requires a fresh bounded approval.
```
