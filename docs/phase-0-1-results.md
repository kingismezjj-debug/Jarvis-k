# Phase 0 and Phase 1 Results

Completed on 2026-07-29. This document contains no provider credentials or
secret configuration values.

## Scope

The completed scope is limited to:

- phase 0: independent repository and migration baseline
- phase 1: contracts, workspace boundaries, supervised Core, desktop shell,
  and a minimal React HUD

Voice provider migration, model routing, SQLite persistence, capability
execution, and advanced Jarvis-ui features remain deferred. No phase 2 work was
started.

## Delivered

- npm workspaces for Contracts, Core, React UI, and Electron Desktop
- protocol version 1 with Zod validation
- typed commands, results, errors, events, snapshots, and correlation IDs
- context-isolated preload bridge and validated Electron IPC
- Core child process with health probes, request timeouts, bounded restart, and
  monotonic supervisor event sequence IDs
- in-memory Core snapshot with renderer reload recovery
- React, Tailwind CSS v4, shadcn/ui, Radix UI, and Lucide HUD
- dependency-boundary checker
- unit, integration, and Electron Playwright smoke tests

## Exit Conditions

| Condition | Result |
| --- | --- |
| Jarvis-K installs and builds independently | PASS |
| Source projects are not runtime dependencies | PASS |
| Baseline and migration manifest are recorded | PASS |
| UI sends typed commands and receives events | PASS |
| Renderer reload restores the Core snapshot | PASS |
| Core restart does not close the main window | PASS |
| Dependency rules are enforced | PASS |

## Verification

```text
npm run typecheck          PASS
npm test                   PASS: 3 files, 6 tests
npm run check:boundaries   PASS
npm run build              PASS
npm run smoke:desktop      PASS
```

The desktop smoke test verifies:

1. Electron launches and the Core reaches `ONLINE`.
2. A typed message command is accepted and appears in the snapshot.
3. Reloading the renderer restores the message from the running Core.
4. Terminating the Core child triggers a controlled restart.
5. The Electron main window remains alive and receives the new Core instance.

## Measurements

Recorded by `tests/desktop-smoke.mjs`:

- launch to interactive Core online: 738 ms
- Electron main process RSS: 146,628,608 bytes
- Core process working set: 95,563,776 bytes
- combined measured main and Core memory: 242,192,384 bytes

The measured launch time is below the 5 second target. The measured main and
Core processes are below the 350 MB memory target; renderer and GPU helper
processes are not included in this two-process figure.

## Design Evidence

- Figma file: `https://www.figma.com/design/SFLAtKe7XBLVcETMUkoIJU`
- Figma preview: `artifacts/figma-desktop-hud.png`
- tested Electron UI: `artifacts/jarvis-k-phase-1-desktop.png`
- machine-readable metrics: `artifacts/jarvis-k-phase-1-metrics.json`

The tested UI uses an operational three-column desktop layout with a neutral
graphite base, chartreuse primary actions, cyan transport accents, and explicit
success and warning states. The renderer has no direct Core, database, model,
provider, tool, or voice implementation dependency.

## Source Project Safety

- `E:\bailongma` was read and tested without replacing user changes.
- `C:\Users\Administrator\Jarvis-ui` was used only as a design reference.
- Neither source project is imported or required at runtime.
- No credentials were copied into Jarvis-K, tests, screenshots, or documents.

## Start Command

```powershell
npm install
npm run verify
npm run smoke:desktop
npm start
```

Phase 0 and phase 1 are complete. The next planned phase is phase 2, but it must
begin only after explicit approval.
