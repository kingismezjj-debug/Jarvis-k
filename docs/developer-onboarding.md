# Developer Onboarding

[CURRENT_STATUS.md](../CURRENT_STATUS.md) is the only current product summary.
This page defines a short development baseline, not a completed daily-use trial.

## Install and verify

Use Windows and Node.js >=22.12.0 (Node 22 is the existing CI baseline), npm and Git.
Windows ARM is a development-validation environment, not a supported release claim.
From the repository root in PowerShell:

```powershell
npm.cmd ci
npm.cmd run verify
```

Use `npm.cmd` when PowerShell blocks `npm.ps1`; changing execution policy is not needed.
`verify` runs typecheck, tests, boundary/sensitive-file checks and the complete build.
`npm test` now builds Desktop after its existing dependency builds and before Vitest,
including `dist/secure-chat-answer-provider-store.js`. CI uses that same test entry.
No manual warm-up build is needed to make a clean checkout pass.

## Standard startup

```powershell
npm.cmd start
```

Equivalent development alias: `npm.cmd run dev`. The `prestart` lifecycle uses the
existing complete workspace `build`; `dev` delegates to `start`, so it builds once.
The existing `&&` chain stops at the first compiler/build error and npm does not
launch Electron when prestart fails. Read that failing workspace's error output.
Do not use `--ignore-scripts` for startup: it intentionally bypasses npm lifecycle hooks.

Root `main` is `apps/desktop/dist/main.js`; the Desktop package entry is `dist/main.js`.
Desktop Main also needs CoreHost, UI and bundled preloads. Direct `electron .` and
workspace-only builds are low-level operations, not complete clean startup commands.
No provider configuration or model download is required merely to build.

## Small baseline checklist

1. Record the full `git rev-parse HEAD`, branch, clean worktree, Node and OS architecture.
2. Install from the lockfile and run verify without inherited provider/acceptance flags.
3. When interactive use is authorized, start with the standard command; confirm the
   main window and existing settings work, then explicitly quit through the tray.
4. An unconfigured provider is a setup state, not an ARM compilation failure. Saving,
   connection testing and enabling a provider are separate user actions; connection
   testing and conversation can make real requests and are not part of offline checks.
5. Do not count historical x64 installer evidence or a passing fake test as a new
   ARM/x64 product acceptance. Record any new result against its exact revision.

UI-3L-0 performs offline baseline verification only. It does not start a five-day
trial, a real crash, a Windows tool action, voice/wake word, plugin/MCP work or a release.

## Optional existing workflows

Voice setup and provider acceptance remain separate opt-in workflows described by
the historical guides and existing UI; this baseline does not enable them. Existing
`smoke:desktop` uses fake media/providers, and `smoke:desktop:fixture-inference` uses
isolated fixture inference. Neither is proof of real provider or Windows acceptance.
No optional Desktop smoke is required to fix npm build ordering: the focused tests
use inert executable shims and cannot launch Electron or a Windows tool.

## Validation commands

```powershell
npm.cmd exec -- vitest run apps/desktop/test/development-baseline.test.ts
npm.cmd test
npm.cmd run audit:ui-strings
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run verify
```

For a clean-child verification, construct an allowlisted OS/Node/npm environment
without provider credentials, JARVIS flags, NODE_OPTIONS or inherited proxy/acceptance
configuration. Do not copy user profiles or reset existing recovery profiles.
Keep logs outside tracked source, and keep boundary/sensitive-artifact checks enabled.
