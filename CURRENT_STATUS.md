# Jarvis-K Current Status

Updated: 2026-08-20

## Current Product Phase

Jarvis-K is switching from Voice evaluation work back to Desktop Alpha daily-use and release-readiness stabilization.

## Completed

- Mainline build/test baseline is green on the current branch.
- Production defaults keep deterministic rules available and fixture/runtime acceptance paths isolated.
- Core task runtime, memory, planner, plugin, model, desktop composition, and UI structure refactors have completed their stabilization passes.
- Voice command benchmark v1.1 and deterministic Voice Resolver baseline are established.
- Voice non-execution safety boundary is verified: Brain open actions can be disabled before Windows Executor invocation, with runtime audit delta evidence.
- Destructive filesystem voice commands are explicitly blocked.
- Voice ASR provider identity and `command/explicit_ui` input mode now flow into regression records.
- Dual-layer Voice Regression feedback is implemented.
- Local-only Voice Regression collection, redaction, retention, export, and export review are implemented.

## Frozen

Voice is frozen as:

**Phase 3F exploratory complete -- standard pilot deferred**

Frozen Voice evidence:

- First Pilot export SHA-256: `8cda0677e95ee775f9bc9b96d5d9d24d40ea212a76f3e12ccebaeb2c27250863`
- Volcengine exploratory export SHA-256: `4630b453ac31b96aa7ddb985d3ecdc4b34102b259756f655d0699047cbbc0545`
- Pilot manifest: `voice-pilot-zh-cn-standard-20`
- Pilot manifest digest: `4a3274f1f9de6d51e690e6c5bd12d35766f089205a8756de4d82d4c059a22d98`

Voice freeze rules:

- Do not delete Pilot code.
- Do not expand Pilot features.
- Do not rerun the strict 20-record Pilot.
- Do not expand to 100 records.
- Do not enable Qwen rerank.
- Re-evaluate Voice Pilot only after Desktop Alpha daily-use stability improves.

## Current Blockers

- No Windows installer, signing, update, uninstall, or portable build configuration is present.
- Phase 4A-1 now isolates Product UI from Developer/Evaluation surfaces by default; final smoke/verify remains the current gate.
- No tray/minimize-to-background lifecycle is implemented; closing the last window quits the app.
- Voice is usable only after explicit provider configuration, and first-run onboarding is not yet productized.
- Strict Voice Pilot UX remains too costly for manual progress and is deferred.

## Desktop Alpha Audit

Installation and release:

- Current state is developer-run Electron (`npm run build`, `npm start`).
- CI runs on `windows-latest` with `npm ci`, typecheck, tests, boundary checks, sensitive artifact guard, and build.
- No installer, signing, auto-update, uninstall cleanup, portable package, or release artifact script was found.
- User data and encrypted provider settings use Electron `app.getPath("userData")`; Voice Regression can be redirected with `JARVIS_K_VOICE_REGRESSION_PATH`.
- Production runtime rejects fixture providers when runtime mode is production.

Desktop lifecycle:

- Single-instance lock and second-instance focus are implemented.
- Main window creation uses context isolation, sandbox, no Node integration, audio-only media permission, blocked navigation, and external URL handoff.
- GPU is disabled by default unless `JARVIS_K_ENABLE_ELECTRON_GPU=1`.
- `before-quit` stops voice, Qwen runtime IPC, and Core supervisor.
- No tray icon, minimize-to-tray, start-on-login, background mode, or crash-recovery UX was found.

Voice daily use:

- PTT UI and audio IPC exist; microphone permission is restricted to audio.
- Provider settings are stored with `safeStorage`; Xunfei and Volcengine are supported.
- Level 0 Voice Regression is off by default; Level 1 is explicit local text only; Level 2 audio is unsupported; upload is off.
- Pilot and ASR Regression controls are hidden from ordinary Voice UI and only mount when Developer Mode plus Evaluation capability are enabled.

Core user loops evidence:

- Text question: smoke/unit.
- Voice command: unit/smoke, real microphone manually explored.
- Open allowlisted app: automated runtime tests; real acceptance isolated.
- Open safe URL: automated runtime tests; real acceptance isolated.
- Search local files: smoke/unit through observe-only path.
- Invoke read-only plugin: smoke/unit.
- View task result: UI/source tests and smoke.
- Confirm/cancel risky task: planner/task tests and UI source tests.
- Basic settings: unit/UI source tests.
- Fully quit app: lifecycle unit; no manual release QA yet.

## Risk Register

P0:

- No current P0 observed in audit; real Windows acceptance is isolated, privacy defaults are off, and production fixture providers fail closed.

P1:

- No installable/signed Desktop Alpha package.
- No tray/background lifecycle.
- Ordinary users are exposed to developer and evaluation tooling.
- First-run provider, microphone, safety, and recovery flow is not productized.

P2:

- Settings and diagnostics are dense and developer-oriented.
- Error recovery and onboarding copy need consolidation.
- Runtime and provider terminology is too visible for ordinary use.

P3:

- Desktop Pet, Skin Studio, plugin marketplace/community, and advanced appearance packaging remain out of scope.

## Next Stage

Recommended Phase 4A implementation order:

1. Production UI and Developer/Evaluation isolation.
   - User value: ordinary users see product workflows first.
   - Scope: hide Pilot, fixture probes, raw diagnostics, provider probes, runtime inspector, and advanced model controls behind a default-off Developer Mode.
   - Safety: do not delete tooling or change backend contracts.
   - Acceptance: default UI has no Pilot/fixture/evaluation controls; Developer Mode restores diagnostics, and Evaluation capability restores Pilot tools.
   - Status: implemented in Phase 4A-1 pending full `npm run verify`.
   - Blocks: first-run polish and release packaging.

2. Windows tray, minimize, background, and quit lifecycle.
   - User value: Jarvis behaves like a desktop assistant instead of a transient dev window.
   - Scope: tray icon, show/hide, close-to-tray policy, explicit quit, cleanup checks.
   - Safety: voice capture and runtime processes must stop on quit.
   - Acceptance: single-instance focus, tray restore, explicit quit, no orphan Core/Voice processes.

3. Installer and first-run readiness.
   - User value: installable Alpha with clear setup.
   - Scope: packaging config, user-data policy, credential setup entry, first-run provider/permission guidance.
   - Safety: no fixture production path; no credential exposure.
   - Acceptance: clean install, upgrade smoke, uninstall behavior documented, CI build unaffected.

## Key Commits

- Current HEAD before Phase 4A-1: `041bb7a974305ad47a2e1105c7359b6ed8df0ac8`
- Recent prepare-session fix: `06b52a18158f8b1606657ba917bb9ee74f583167`

## Prohibited Until Re-approved

- Voice Pilot reruns or 100-record expansion.
- Resolver, ASR, Qwen rerank, or Pilot Manifest changes.
- Real Windows acceptance without explicit user approval and safety variable.
- New Skin/Pet/Marketplace feature work before Desktop Alpha daily-use basics.
