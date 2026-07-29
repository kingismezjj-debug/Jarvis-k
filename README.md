# Jarvis-K

Jarvis-K is an independent Electron, React, and TypeScript desktop agent
workspace. The current implementation is intentionally limited to phase 0 and
phase 1:

- versioned runtime contracts with Zod validation
- an isolated Agent Core child process
- a supervised Electron host with health checks and controlled restarts
- a React renderer that restores a state snapshot after reload
- type checks, contract tests, integration tests, and dependency-boundary checks

The Bailongma and Jarvis-ui source projects are migration references only. They
are not runtime dependencies.

## Commands

```powershell
npm install
npm run verify
npm run smoke:desktop
npm start
```

## Workspace boundaries

- `packages/contracts` has no business-package dependency.
- `packages/core` depends only on `packages/contracts`.
- `apps/ui` depends only on `packages/contracts` among Jarvis-K packages.
- `apps/desktop` supervises Core and exposes a narrow preload bridge.

Voice providers, SQLite persistence, model routing, and capability execution are
deliberately deferred to later phases.
