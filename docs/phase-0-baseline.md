# Phase 0 Migration Baseline

Recorded on 2026-07-28. No provider credentials or secret configuration values
are included in this document.

## Environment

- Operating system: Windows 10 Pro 10.0.19045, 64-bit
- Processor: Intel Core i7-13700KF, 16 cores, 24 logical processors
- Memory: 33,359,400 KB visible physical memory
- Node.js: 24.15.0
- npm: 11.12.1
- Git: 2.54.0.windows.1

## Bailongma

- Source path: `E:\bailongma`
- Git branch: `main`
- Upstream: `origin/main`
- Baseline commit: `34d939e chore: release 2.1.515`
- Working tree: modified; all user changes were preserved
- Tracked voice-fix diff: 6 files, 374 insertions, 57 deletions
- Preserved untracked files:
  - `diagnostic-voice.js`
  - `src/test-cloud-asr.js`
  - `src/test-voice-ptt.js`
  - `start-bailongma.ps1`
- Runtime check: `http://127.0.0.1:3721/` returned HTTP 200
- Observed Electron process working set: 495,120,384 bytes
- Repository footprint including installed dependencies: 14,407 files,
  1,147,496,740 bytes

### Voice test results

```text
npm run test:cloud-asr       PASS
npm run test:voice-ptt       PASS
npm run test:voice-continuous PASS
node src/test-voice-provider.js PASS
```

The source repository was not edited while collecting this baseline.

## Jarvis-ui

- Source path: `C:\Users\Administrator\Jarvis-ui`
- Git status: the directory is not a Git repository
- Repository footprint including installed dependencies: 4,922 files,
  231,352,169 bytes
- `src/App.jsx`: 377,447 bytes
- `src/App.css`: 227,576 bytes

Jarvis-ui remains a visual and interaction reference. Its large application and
stylesheet files are not copied into Jarvis-K.

## Migration manifest

Phase 1 creates only:

- typed commands, events, errors, and state snapshots
- Electron-to-Core request routing
- Core health checks and controlled restart behavior
- a minimal renderer that consumes snapshots and events

No voice provider, model provider, database, memory, tool runtime, or advanced
Jarvis-ui feature is migrated in this phase.
