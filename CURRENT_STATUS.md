# Jarvis-K Current Status

Updated: 2026-08-21

## Current Product Phase

Jarvis-K is in Desktop Alpha daily-use and release-readiness stabilization.

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
- Product UI is separated from Developer/Evaluation surfaces by default.
- Tray lifecycle is implemented: close-to-tray by default, restore from tray, explicit quit, and CoreHost cleanup.
- User-controlled Windows launch at login is implemented for packaged Alpha/Stable only; it is OFF by default, uses Electron login item APIs, and starts hidden to tray on login.
- Phase 4B-1 Desktop Pet safe floating-window MVP is implemented: default OFF, product-controlled local setting, separate minimal Pet renderer/preload, fixed safe context menu, read-only state projection, position persistence with screen clamping, tray show/hide, and destroy-on-hide/quit cleanup.
- Phase 4B-1B Desktop Pet manual-acceptance defects are fixed in development: Pet CSS is isolated for transparent-window rendering, drag position persistence is flushed on move/hide, and Reduced Motion changes refresh into the Pet renderer.
- Phase 4B-1C Desktop Pet final development acceptance is complete on HEAD `4802302`: transparent renderer, direct whole-pet dragging, drag position persistence, Reduced Motion projection, safe right-click menu, tray lifecycle, screen-boundary clamping, and quit cleanup passed automated development smoke/verify; physical multi-monitor unplug/reflow remains deferred.
- Phase 4B-2A Desktop Pet state and animation protocol is implemented: six safe projected states (`idle`, `listening`, `thinking`, `success`, `error`, `offline`), bounded success/error TTL, Reduced Motion static variants, no user-content projection, and Pet smoke/tray/UI smoke coverage.
- Phase 4B-2B Desktop Pet built-in default visual is implemented: the local CSS-only floating mini AI robot uses layered shell, face, halo, ears, arms, and status glyphs; all six formal states have distinct non-sensitive visual feedback and Reduced Motion keeps static state cues.
- Windows unsigned Alpha packaging is configured for x64 NSIS and isolated packaged runtime verification; `0.1.0-alpha.3` adds user-controlled launch at login on top of the `0.1.0-alpha.2` packaged runtime dependency closure fix.
- Packaged Alpha now uses an isolated release-channel identity and storage namespace: `Jarvis-K Alpha`, `com.jarvis-k.desktop.alpha`, `%APPDATA%\Jarvis-K-Alpha`, and `%LOCALAPPDATA%\Jarvis-K-Alpha`.
- First-run onboarding is implemented for ordinary product guidance without enabling microphone, upload, fixture, or real Windows execution.

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

- Windows Alpha package remains unsigned and requires manual install acceptance on Windows.
- Phase 4A-3C Alpha `0.1.0-alpha.1` manual installation acceptance is **FAILED / BLOCKED**: storage isolation acceptance `PASS`, installer install/uninstall mechanics `PARTIAL PASS`, packaged runtime startup `FAIL`, blocking reason `MODULE_NOT_FOUND @jarvis-k/contracts`; First-run, Tray, CoreHost, second-instance, and quit acceptance were not completed.
- Alpha `0.1.0-alpha.1` is superseded / not distributable. `0.1.0-alpha.2` fixed the packaged runtime dependency closure; `0.1.0-alpha.3` is the current Alpha candidate for launch-at-login validation.
- No signing certificate, auto-update, portable build, or store publishing path is configured.
- Voice is usable only after explicit provider configuration.
- Strict Voice Pilot UX remains too costly for manual progress and is deferred.

## Desktop Alpha Audit

Installation and release:

- Current state supports developer-run Electron plus unsigned Windows x64 Alpha packaging.
- Alpha package identity is separate from development and future Stable: product name `Jarvis-K Alpha`, appId/AppUserModelId `com.jarvis-k.desktop.alpha`, and version `0.1.0-alpha.3`.
- Manual launch-at-login acceptance status is not complete for `0.1.0-alpha.3`; do not treat earlier package acceptance as validating this new startup behavior.
- CI runs on `windows-latest` with `npm ci`, typecheck, tests, boundary checks, sensitive artifact guard, and build.
- Installer packaging uses Electron Builder NSIS, per-user install, no elevation, no auto-run after finish, and user data is retained on uninstall.
- Signing is explicitly not configured for Alpha; artifacts are named `unsigned-alpha`.
- Auto-update, portable package, and store publishing remain out of scope.
- Alpha user data and encrypted provider settings use `%APPDATA%\Jarvis-K-Alpha`; Alpha local repositories, models, logs, Voice Regression, plugin state, and Qwen markers use `%LOCALAPPDATA%\Jarvis-K-Alpha`.
- Development keeps `%APPDATA%\Jarvis-K` and `%LOCALAPPDATA%\Jarvis-K`; no automatic migration or credential copy is performed.
- Production runtime rejects fixture providers when runtime mode is production.

Desktop lifecycle:

- Single-instance lock and second-instance focus are implemented.
- Main window creation uses context isolation, sandbox, no Node integration, audio-only media permission, blocked navigation, and external URL handoff.
- GPU is disabled by default unless `JARVIS_K_ENABLE_ELECTRON_GPU=1`.
- `before-quit` stops voice, Qwen runtime IPC, and Core supervisor.
- Tray icon, close-to-tray, restore, and explicit quit are implemented.
- Auto-update and crash-recovery UX remain out of scope.

Voice daily use:

- PTT UI and audio IPC exist; microphone permission is restricted to audio.
- Provider settings are stored with `safeStorage`; Xunfei and Volcengine are supported.
- Level 0 Voice Regression is off by default; Level 1 is explicit local text only; Level 2 audio is unsupported; upload is off.
- Pilot and ASR Regression controls are hidden from ordinary Voice UI and only mount when Developer Mode plus Evaluation capability are enabled.
- First-run onboarding explains privacy defaults, provider setup, tray behavior, Developer Mode, and safe next steps.

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

- Unsigned installer requires manual Windows trust acceptance.
- No auto-update release path.
- First-run provider and microphone setup remains guidance-only, not a full wizard.

P2:

- Settings and diagnostics are still dense when Developer Mode is enabled.
- Error recovery and onboarding copy need consolidation.
- Runtime and provider terminology is too visible for ordinary use.

P3:

- Advanced Desktop Pet animation/skins, Skin Studio, plugin marketplace/community, and advanced appearance packaging remain out of scope.

## Next Stage

Recommended next implementation order:

Phase 4B-3 Skin Contract requirement:

- Every Pet skin must provide either explicit `stateGlyph` assets or static per-state variants for all six formal states, so Reduced Motion remains visually distinguishable without relying on continuous animation.

1. Manual unsigned installer acceptance.
   - User value: confirm the packaged Alpha installs and launches on a normal Windows desktop.
   - Scope: user-approved install, first-run onboarding review, tray restore/quit, uninstall behavior observation.
   - Safety: no real Windows task acceptance, no microphone, no credentials required.
   - Acceptance: installer launches, onboarding appears once, tray lifecycle works, uninstall behavior matches documentation.

2. First-run provider and microphone setup polish.
   - User value: reduce confusion before daily Voice use.
   - Scope: clearer provider status, permission copy, recovery path, and no-mic fallback.
   - Safety: no auto microphone start, no ASR network call without user action.
   - Acceptance: ordinary user can see what remains to configure and continue text-only use.

3. Crash recovery and diagnostic export.
   - User value: make Alpha failures debuggable without exposing private content.
   - Scope: safe process/runtime summary export and recovery guidance.
   - Safety: no credentials, transcripts, file contents, or raw plugin inputs in diagnostics.
   - Acceptance: user can export a redacted support bundle after a failure.

## Key Commits

- Current HEAD before Phase 4A-1: `041bb7a974305ad47a2e1105c7359b6ed8df0ac8`
- Recent prepare-session fix: `06b52a18158f8b1606657ba917bb9ee74f583167`
- Phase 4A-1 UI isolation: `3318bbfddcb87458b2a0a118756a4ca52a0da73d`
- Phase 4A-2 tray lifecycle: `0ee738353702eba7cd3541ae636dce9865b7cbdb`

## Prohibited Until Re-approved

- Voice Pilot reruns or 100-record expansion.
- Resolver, ASR, Qwen rerank, or Pilot Manifest changes.
- Real Windows acceptance without explicit user approval and safety variable.
- Skin Runtime, Skin Studio, Marketplace, or community upload work before explicit approval.
