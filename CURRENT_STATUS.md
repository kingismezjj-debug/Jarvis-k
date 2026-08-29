# Jarvis-K Current Status

Updated: 2026-08-29

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
- Phase 4B-3A Desktop Pet Skin v1 contract is defined at the contracts layer: asset-only manifest schema, centralized resource policy, pure fail-closed validator, safe reason codes, trust-state boundaries, non-removable built-in fallback protection, Reduced Motion static-state requirement, and a concise threat model.
- Phase 4B-3B Desktop Pet Skin secure temporary preview is implemented up to `validated_preview_package`: `.jkskin` ZIP packages are read in Desktop Main, package digests are canonicalized without the manifest `packageDigest` field, resources are exposed only through a scoped preview protocol, Renderer receives safe metadata only, and previews are not installed or activated.
- Phase 4B-3C Desktop Pet Skin local install/activate/rollback is implemented up to `installed_local_skin` and `active_skin`: validated previews install into release-channel local data, the registry is atomically persisted and corruption-isolated, installed resources use a separate scoped protocol, activation preflights before persistence, renderer failures roll back to last-known-good or the built-in robot, and Appearance exposes Developer-gated local management.
- Phase 4B-3C-A Desktop Pet Skin manual acceptance fixture generator is available: `npm run fixture:pet-skin:manual` creates an ignored, formally validated `.jkskin` with six distinct states and Reduced Motion static variants under `artifacts/manual/pet-skins/`.
- Phase 4B-4A local Pet Skin Studio MVP is implemented in Developer Mode: users can enter safe metadata, map local PNG/WebP images to all six states, generate temporary previews, and export `.jkskin` packages that are reopened through the official reader before being offered for install through the existing secure import flow.
- Phase 4B-4B Pet Skin Studio Add Image source normalization is fixed: Studio source images use a separate source policy, common large PNGs are proportionally resized through Electron `nativeImage`, final assets still obey Pet Skin v1 limits, and fixed safe errors replace raw decode/write exceptions.
- Phase 5A Advanced Brain provider-neutral foundation is in place: request/result/profile contracts, privacy/cloud egress gates, deterministic selection policy, fixture-only provider semantics, and approval-bound structured plan output are defined without enabling any real provider or product default path.
- Phase 5B-0 Bounded Cloud Reasoning Transport foundation is in place: provider-neutral endpoint profiles, HTTPS/SSRF/redirect guards, runtime-only credential injection, bounded JSON request/response handling, timeout/cancel semantics, sanitized diagnostics, and offline fake-fetch tests are defined without enabling any real cloud provider or product default path.
- Phase 5B-1 GLM Advanced Brain adapter is implemented as a default-disabled, provider-neutral integration: canonical providerId `advanced-brain.glm`, model profile support for `glm-5.2` and `glm-5.3`, bounded cloud transport mapping, runtime-only credential binding, explicit cloud/privacy gates, structured plan proposal-only output, safe status/probe projection, and Core Host composition without Product routing.
- Phase 5B-1A-4A GLM-5.3 response protocol offline audit is complete: fixed diagnostic contracts now separate GLM-5.2 no-thinking and GLM-5.3 mandatory-thinking requests, classify budget-exhausted/no-final/tool-proposal/invalid-output responses with safe evidence only, and no v4 real request eligibility has been created.
- Phase 5B-1A-4B GLM-5.3 final diagnostic contract is prepared offline: v4 uses fixed `glm-5.3`, `max_tokens=1024`, `thinking.type=enabled`, no `response_format`, no tools, no retry/fallback, and fenced final JSON parsing without exposing `reasoning_content`.
- Phase 5B-1B-0 GLM-5.2 no-thinking independent acceptance is prepared offline: v1 uses fixed `glm-5.2`, `max_tokens=256`, `thinking.type=disabled`, `do_sample=false`, no tools, no retry/fallback, and per-acceptance consumed state isolated from GLM-5.3 history.
- Phase 5B-1C Provider-Neutral Cloud Brain Runtime Foundation is implemented offline: shared model capability profiles, protocol-family gates, four-layer timeout policy, OpenAI-compatible JSON/SSE parsing, bounded retry-before-response, safe provider health projection, and GLM shared-runtime profile mapping are covered by fake-transport tests without enabling Product cloud routing.
- Phase 5B-1D GLM shared-runtime offline conformance is complete: GLM-5.2 and GLM-5.3 both run through `CloudReasoningRuntime` with fake transport for non-stream/stream, thinking policies, four-layer timeout/cancel/retry/fallback, safe health diagnostics, credential lifecycle boundaries, and the old Desktop Main real acceptance path frozen with `realNetworkRequestSent=false`.
- Phase 5B-2A DeepSeek Advanced Brain adapter foundation is implemented offline: `advanced-brain.deepseek` exposes fixed DeepSeek V4 text profiles for `deepseek-v4-flash` and `deepseek-v4-pro`, maps through the shared `CloudReasoningRuntime`, preserves thinking/reasoning separation, keeps credentials at the transport boundary, remains Product-disabled by default, and is covered by fake conformance tests with `realNetworkRequestSent=false`.
- Phase 5B-2C Provider-Neutral Credential Vault and Cloud Acceptance Framework is implemented offline: cloud provider credential bindings are Main-owned and safeStorage-backed, DeepSeek fake acceptance uses a persistent one-time ledger and shared `CloudReasoningRuntime`, Developer/Evaluation UI is separately gated, Product routing remains disabled, and fake-transport tests prove `realNetworkRequestSent=false`.
- Phase 5B-2D-0 DeepSeek single real acceptance final gate is prepared offline: the real gate is development-only behind Developer/Evaluation/DeepSeek flags, uses the provider-neutral credential vault and one-time ledger, exposes a fixed DeepSeek V4 Flash no-thinking streaming contract with safe preflight/confirmation/report projection, and remains fake-transport verified with `realNetworkRequestSent=false`.
- Phase OSS-0 architecture reset is documented: complete capability decomposition, OSS reuse decisions, third-party trust boundaries, UI/Settings/i18n blueprint, and OSS/UI roadmap are defined with no production behavior change.
- Phase OSS-1 provider protocol adapter decision is complete: Jarvis keeps bounded transport, credential broker, four-layer timeout, sanitized projection, and acceptance semantics; an isolated fake-only `CloudModelProtocolAdapter` conformance spike compares the current runtime without adding third-party SDK dependencies or changing Product routing.
- Phase UI-2A Settings V2 foundation is implemented behind a trusted development-only gate: the real General slice now uses a typed registry, local `en`/`zh` copy parity, UI-1 foundation components, localized search, wide/narrow responsive layout, and read-only reset boundary while the ordinary product path still defaults to Legacy Settings.
- Phase UI-2A-Fix Settings V2 real development entry is repaired: Main-owned safe capability projection refreshes when the real Settings surface opens, `JARVIS_K_ENABLE_SETTINGS_V2=1` plus development mounts Jarvis Control Center V2, and gate OFF/non-development remains Legacy.
- Phase UI-2B Settings V2 Appearance & Pet slice is implemented behind the same development-only gate: interface theme now uses Desktop Settings as the source of truth, Desktop Pet visibility/topmost/motion/position controls read and update the existing Pet settings service, active skin status is exposed as a safe summary only, and Product defaults still mount Legacy Settings.
- Phase UI-2B-Fix Settings V2 theme unification is implemented: App Shell, Jarvis Control Center V2, dialogs/search/navigation, and UI-1 foundation components now inherit the same trusted Desktop Settings theme projection, with a one-time allowlisted Legacy theme migration bridge for existing `signal`/`harbor`/`ember` preferences.
- Phase UI-2C Settings V2 Voice & Audio slice is implemented behind the same development-only gate: it reads existing safe Voice/TTS status projections, exposes only trusted setup/navigation actions, keeps provider credentials behind Desktop secure storage, treats wake word as read-only unavailable, and preserves no-mic/no-network/no-executor page-load behavior.
- Phase UI-2C-Copy-Fix Voice & Audio Product copy is repaired: ordinary Chinese and English pages now use user-facing speech recognition/playback wording, avoid internal ASR/Provider/TTS/Jarvis Core terms, and show setup-dependent values instead of unknown language/default voice when services are unconfigured.
- Phase UI-2D Settings V2 Models & Intelligence slice is implemented behind the same development-only gate: it reads existing command-router, answer-provider, model inventory, provider, operation, and resource diagnostics projections; Product UI hides evaluation/fixture/raw route details; page load does not load, download, delete, or cloud-verify models.
- Phase UI-2D-Fix Models & Intelligence Product copy/status repair is complete: V2 now formats trusted model/provider projections into user-facing local model, online answer service, and current answer mode states without raw provider lists, fallback labels, lease wording, or repeated unconfigured arrays.
- Phase UI-2D-Fix2 Models & Intelligence answer-method consistency repair is complete: the current answer method now has one Product view-model source, default local command routing is shown as local rules, and online answer service status is object-labeled instead of contradicting the routing summary.
- Phase UI-2E Settings V2 Tools & Plugins slice is implemented behind the same development-only gate: it formats existing tool safeguards, approved-app/web/file-search summaries, plugin management status, and external tool connection readiness into Product language without running tools, launching apps or browsers, searching files, invoking plugins, connecting external tools, or exposing raw plugin/MCP internals.
- Phase UI-2E-Fix Tools & Plugins Product review repair is complete: migration status now derives from the Settings V2 registry, bundled read-only example plugins are hidden from Product projection, safe-viewing copy is precise, narrow/200% layout uses the compact selector, and refreshed screenshot evidence covers plugin and external-tool sections with zero side effects.
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

- Plugin marketplace/community, remote skin download/upload, and advanced appearance packaging remain out of scope.

## Next Stage

Recommended next implementation order:

Phase 4B-3 Skin Contract requirement:

- Every Pet skin must provide either explicit `stateGlyph` assets or static per-state variants for all six formal states, so Reduced Motion remains visually distinguishable without relying on continuous animation.

1. First-run provider and microphone setup polish.
   - User value: reduce confusion before daily Voice use.
   - Scope: clearer provider status, permission copy, recovery path, and no-mic fallback.
   - Safety: no auto microphone start, no ASR network call without user action.
   - Acceptance: ordinary user can see what remains to configure and continue text-only use.

2. Crash recovery and diagnostic export.
   - User value: make Alpha failures debuggable without exposing private content.
   - Scope: safe process/runtime summary export and recovery guidance.
   - Safety: no credentials, transcripts, file contents, or raw plugin inputs in diagnostics.
   - Acceptance: user can export a redacted support bundle after a failure.

3. Desktop Pet Skin Studio manual local acceptance.
   - User value: confirm that a non-developer can create, preview, export, import, install, activate, and roll back a local asset-only `.jkskin`.
   - Scope: local PNG/WebP only; no installer, no network, no AI provider, and no community upload.
   - Safety: exported packages still pass the official reader and built-in robot remains fallback.
   - Acceptance: exported package validates, import preview displays all six states, install does not auto-activate, activation survives restart, and damaged skin rolls back.

## Key Commits

- Current HEAD before Phase 4A-1: `041bb7a974305ad47a2e1105c7359b6ed8df0ac8`
- Recent prepare-session fix: `06b52a18158f8b1606657ba917bb9ee74f583167`
- Phase 4A-1 UI isolation: `3318bbfddcb87458b2a0a118756a4ca52a0da73d`
- Phase 4A-2 tray lifecycle: `0ee738353702eba7cd3541ae636dce9865b7cbdb`

## Prohibited Until Re-approved

- Voice Pilot reruns or 100-record expansion.
- Resolver, ASR, Qwen rerank, or Pilot Manifest changes.
- Real Windows acceptance without explicit user approval and safety variable.
- Marketplace, remote skin download, community upload, or AI skin generation before explicit approval.
