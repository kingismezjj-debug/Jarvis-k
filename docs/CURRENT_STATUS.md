# Jarvis-K Current Status

Updated: 2026-08-20

## Product Stage

Desktop Alpha stabilization and Windows packaging.

## Completed

- Backend and UI mainline stabilization passed.
- Voice evaluation tooling is frozen as exploratory; standard pilot is deferred.
- Unsigned Alpha storage isolation passed.
- `0.1.0-alpha.2` packaged runtime dependency closure passed and launched from an isolated package.
- `0.1.0-alpha.3` added user-controlled launch at login.

## Current Status

- `0.1.0-alpha.3` launch-at-login manual acceptance: **FAILED / SUPERSEDED**.
- Root cause: Windows login item could be created, but the desktop status projection could read the registered item as disabled.
- `0.1.0-alpha.4` fixes Launch at Login status projection by separating Electron write settings from read-only login item probes.

## Frozen

- Do not continue Voice Pilot, Qwen rerank, or 100-sample expansion until Desktop Alpha is stable.
- Do not distribute superseded Alpha installers.

## Next Stage

- Rebuild and verify `0.1.0-alpha.4`.
- If packaged smoke passes, rerun Launch at Login manual acceptance with the alpha.4 installer.

