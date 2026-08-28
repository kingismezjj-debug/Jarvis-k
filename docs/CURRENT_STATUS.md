# Jarvis-K Current Status

Updated: 2026-08-28

## Product Stage

Desktop Alpha stabilization and Windows packaging.

## Completed

- Backend and UI mainline stabilization passed.
- Voice evaluation tooling is frozen as exploratory; standard pilot is deferred.
- Unsigned Alpha storage isolation passed.
- `0.1.0-alpha.2` packaged runtime dependency closure passed and launched from an isolated package.
- `0.1.0-alpha.3` added user-controlled launch at login.
- Phase 4A-3 alpha.2 manual acceptance: **PASS WITH MINOR CAVEAT**.
- Phase 4A-4 implementation: **COMPLETE**.

## Current Status

- Phase 4A-4A manual launch-at-login acceptance: **DEFERRED**.
- Launch-at-login implementation status: implementation complete; manual login acceptance deferred to next release candidate.
- Installer validation cadence: moved to release-candidate validation instead of every ordinary feature slice.
- Phase UI-0 Settings IA/i18n audit and isolated prototype: **COMPLETE**.
- Phase UI-0R Jarvis Control Center prototype revision: **COMPLETE / REVIEWED**.
- Phase UI-1 Design Tokens and Foundation Components: **COMPLETE / FOUNDATION READY**.

## Verification Cadence

- Daily development validation: targeted tests, `npm test`, `npm run verify`, relevant ordinary smoke, and isolated unpacked packaged smoke only when Desktop packaged runtime is affected.
- Daily development does not default to generating a new Installer, installing, uninstalling, signing out of Windows, or modifying real startup items.
- Release-candidate validation covers installer hash/signature, in-place upgrade, clean install, first-run, tray/quit, login item, uninstall, orphan checks, and storage preservation.
- Manual Installer acceptance is reserved for packaging/runtime closure, storage profile, installer/uninstaller, login item, code signing/update, or external Alpha/Beta release candidate changes.

## Frozen

- Do not continue Voice Pilot, Qwen rerank, or 100-sample expansion until Desktop Alpha is stable.
- Do not run per-slice manual Installer install/uninstall unless the current slice is a release-candidate validation slice.

## Next Stage

- Await explicit approval before UI-2 Settings Registry and Internationalization Migration.
