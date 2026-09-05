# Jarvis-K Current Status

Updated: 2026-09-04

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
- Phase UI-2E-Fix2 Tools & Plugins final Product polish is complete: remaining Developer/Product copy leaks are removed, plugin search returns only relevant Product results, empty plugin state is read-only without a chevron, 390px shell/composer overlap and 200% Settings V2 overflow are covered by real capture assertions, and manual re-review is ready.
- Phase UI-2E-Fix3 Tools & Plugins visual evidence repair is complete: 200% capture now records BrowserWindow, viewport, zoom, visual viewport, media query, and screenshot dimensions from the same visible window, zoom screenshots show the compact selector instead of clipped wide layout, external tool connection copy is de-duplicated, and narrow composer placeholders are short and uncropped.
- Phase UI-2F Settings V2 Memory & Privacy slice is implemented behind the same development-only gate: it shows a conservative Product summary from trusted memory status, links to the existing Memory Center for saved information management, keeps storage/sync copy product-safe, and page load does not list/delete/recall/probe/import/export memory or start model, network, microphone, tool, plugin, MCP, browser, app, file-search, or executor actions.
- Phase UI-2G Settings V2 Notifications slice is implemented behind the same development-only gate: it provides a minimal read-only Product summary for safe viewing, limited current notification features, in-app status messages, one-time tray reminder behavior, and notification privacy without requesting Windows permission, sending notifications, playing sound, starting TTS, or adding new notification dispatch bindings.
- Phase UI-2G-Fix Notifications Product projection is repaired: safe viewing and notification privacy are now explanatory rows without pseudo status values, search omits current-value text for those rows, and legitimate limited/in-app/tray status values remain intact.
- Phase UI-3B Settings V2 development rollout is implemented: development builds mount Settings V2 by default, `JARVIS_K_ENABLE_SETTINGS_V2=0` remains a trusted Legacy rollback, packaged Alpha/Stable/Test keep Legacy by default, and Legacy is retained.
- Phase UI-3D-B-Fix Settings V2 rollback/fallback foundation is implemented: Desktop Main owns mount generation, accepts only current generation health events, pushes visible session-only Legacy fallback to Renderer, exposes a user-controlled "Use classic settings" session rollback, clears mount timers on dispose, and keeps packaged Alpha Legacy by release-channel gate.
- Phase UI-3F-3 Launch at Login consistency fix is implemented in code: Windows login item success is now based on Main-owned Electron `launchItems`/exact identity projection with bounded readback verification instead of a single `openAtLogin` readback.
- Phase UI-3F-4 Windows Alpha packaged metadata fix is implemented in config: executable resource editing is enabled while code signing remains disabled, so unsigned local Alpha builds advertise `Jarvis-K Alpha` product metadata instead of Electron runtime metadata.
- Phase UI-3F-7 installed login-item readback instrumentation is implemented behind the explicit `--jarvis-diagnose-login-item-readback` packaged Alpha flag: it performs three read-only Electron `getLoginItemSettings` reads, writes one sanitized diagnostic JSON file, and exits before CoreHost, Tray, Renderer, settings persistence, network, microphone, model, plugin, or executor startup.
- Phase UI-3F-9 Windows login-item identity fix is implemented in code: active writes use the AppUserModelId/default Electron identity with the new `jarvis-startup=login` token, legacy display-name login items are cleaned through Electron APIs during enable/disable, uninstall cleanup covers old and new Alpha identities, and diagnostics report sanitized identity classifications.
- Phase UI-3F-11 Launch at Login evidence closure is recorded for installed RC4: user-attested enable/reboot/disable/reboot behavior plus current machine-observed persisted OFF state and absent new/legacy Run entries are captured in `artifacts/ui-3f/launch-at-login/installed-acceptance.json`.
- Phase UI-3G-1 Packaged Alpha Settings V2 default-on rollout is implemented: development and packaged Alpha now mount Settings V2 by default, `JARVIS_K_ENABLE_SETTINGS_V2=0` remains the trusted Legacy rollback, invalid values fail closed to Legacy, and Stable/Test continue to mount Legacy.
- Phase UI-3G-2A installed Settings V2 acceptance evidence is recorded for RC5: user-observed packaged Alpha default V2 entry, eight-category navigation, session-only classic-settings rollback, V2/Legacy mutual exclusion, and restart retry are captured in `artifacts/ui-3g/installed-v2-acceptance/installed-v2-acceptance.json`; installed render-failure/timeout fault injection and upgrade/downgrade remain incomplete, and unsigned external distribution remains blocked.
- Phase UI-3G-2D installed fallback evidence is recorded for internal RC6: render-failure final Legacy fallback is user-attested PASS, recovery copy was not human-observed, installed real timeout fallback is user-attested PASS after approximately five seconds, and normal restart without the fault flag returned to Settings V2; upgrade/downgrade remains incomplete and RC6 remains an internal fault build only, not for external distribution.
- Phase UI-3K-2A Assistant Core Loop foundation is implemented: provider-neutral contracts now define bounded text input, turn/event IDs, stream deltas, tool proposals, policy decisions, approval correlation, execution requests, tool results, final answers, cancellation, failure, and append-only causality metadata; Core now exposes a pure event reducer and invariant tests without changing persistence, providers, tool execution, executor ownership, IPC, Renderer UI, Settings, Gate, installer, signing, or publishing behavior.
- Phase UI-3K-2B Single-Provider Streaming Assistant Loop is implemented for the existing DeepSeek/OpenAI-compatible Chat Answer runtime: text `chat.answer` turns can start a single streaming provider adapter, project transient batched deltas through Core snapshots, persist one final assistant message, support turn-scoped cancellation, reject concurrent turns, and keep fixture/non-stream Chat Answer behavior unchanged.
- Phase UI-3K-2B-E Chat Answer Provider Configuration Surface is implemented in Settings V2: development users can configure the DeepSeek OpenAI-compatible answer service for the current profile through a Main-owned secure-store flow, save/test/enable remain separate, Renderer never reads plaintext credentials, runtime arming happens without Electron restart after successful user-confirmed validation, and fake/local tests and capture keep `realNetworkRequestSent=false`.
- Phase UI-3K-2B-E-C Safe Connection Test Failure Classification UI Repair is implemented: Settings V2 now shows backend safe `connectionTestStatus` classifications as localized, actionable connection-test messages, correlates test attempts with a bounded attempt id to ignore stale results, keeps command transport failures separate from provider test failures, preserves success-only enablement, and remains fake/local with `realNetworkRequestSent=false`.
- Phase UI-3K-2B-E-F Official DeepSeek Connection-Test Compatibility Fix is implemented: the DeepSeek connection-test request now explicitly disables thinking, uses a bounded 128-token JSON validation budget, classifies official reasoning-only or length-truncated 2xx envelopes as safe `incomplete_response`, and keeps raw/reasoning/credential content out of UI and snapshots.
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
- Alpha `0.1.0-alpha.1` is superseded / not distributable. `0.1.0-alpha.2` fixed the packaged runtime dependency closure; `0.1.0-alpha.4` is the current installed Alpha under launch-at-login repair validation.
- UI-3F-2 found a launch-at-login consistency failure in installed `0.1.0-alpha.4`: Windows Run entry existed while persisted `launchAtLoginEnabled=false`; current real system residue is intentionally not modified until a repaired RC is built and a controlled cleanup/install flow is approved.
- No signing certificate, auto-update, portable build, or store publishing path is configured.
- Voice is usable only after explicit provider configuration.
- Strict Voice Pilot UX remains too costly for manual progress and is deferred.

## Desktop Alpha Audit

Installation and release:

- Current state supports developer-run Electron plus unsigned Windows x64 Alpha packaging.
- Alpha package identity is separate from development and future Stable: product name `Jarvis-K Alpha`, appId/AppUserModelId `com.jarvis-k.desktop.alpha`, and version `0.1.0-alpha.4`.
- Manual launch-at-login acceptance status is not complete for `0.1.0-alpha.4`; a repaired package must be built and installed before continuing login/reboot acceptance.
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

Phase UI-3B status: Settings V2 is default-on only for development builds, with `JARVIS_K_ENABLE_SETTINGS_V2=0` as the explicit rollback path; packaged Alpha remains default-off and Legacy Settings remains available. UI-3B evidence captured the development default, explicit zero, explicit one, invalid flag, and packaged Alpha explicit-one rollback scenarios.

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

## UI-3G-2C Status

- Added packaged Alpha-only internal Settings V2 fault modes for installed fallback acceptance preparation.
- Fault modes are fixed Main-owned CLI enums only: `settings_v2_render_failure` and `settings_v2_mount_timeout`.
- Ordinary startup projects `settingsV2InternalFaultMode=none`; the modes are not persisted and are not renderer writable.
- Implementation evidence is stored under `artifacts/ui-3g/settings-v2-installed-fault-implementation/` and is not installed acceptance.
- Installed RC5 remains untouched; internal RC6 is for the next manual installed fault acceptance only.

## UI-3G-2D Status

- Installed internal RC6 fallback acceptance is recorded in `artifacts/ui-3g/installed-fallback-acceptance/installed-fallback-acceptance.json`.
- Render-failure fixed CLI reached Legacy in the installed app; recovery copy was not human-observed and is only inferred from implementation evidence.
- Mount-timeout fixed CLI reached Legacy after an approximately five-second user-observed delay.
- Normal restart without a fault flag returned to Settings V2, confirming the fault mode did not persist.
- Upgrade/downgrade validation remains incomplete, and the unsigned internal fault build must not be externally distributed.

## UI-3G-3A Status

- UI-3G-2C/2D internal fault acceptance is complete and its historical evidence remains retained.
- The internal Settings V2 fault hook has been removed from the normal packaged Alpha runtime contract, Main wiring, Renderer surface, and package scripts.
- Normal Settings V2 Gate, health generation, timeout fallback, Error Boundary recovery, session rollback, and Launch at Login remain in scope for RC7 regression checks.
- Normal RC7 is awaiting installed acceptance after packaging.
- Upgrade/downgrade validation remains incomplete, and unsigned external distribution remains disallowed.

## UI-3G-3B Status

- Normal RC7 installed Settings V2 acceptance passed and is recorded in `artifacts/ui-3g/normal-rc7-installed-acceptance/normal-rc7-installed-acceptance.json`.
- The normal installed RC7 bundle has no internal Settings V2 fault hook strings in packaged runtime resources.
- Installed fallback acceptance remains PASS from UI-3G-2D, with historical evidence retained.
- Gate and Legacy remain available; session rollback remains session-only.
- Launch at Login remained OFF during the installed acceptance, and Jarvis Run identities were absent.
- Upgrade/downgrade validation remains incomplete, and unsigned external distribution remains disallowed.

## UI-3H-1 Status

- Alpha package metadata is being advanced to `0.1.0-alpha.5` with Windows short version `0.1.0.5` while keeping product name `Jarvis-K Alpha`, appId/AppUserModelId `com.jarvis-k.desktop.alpha`, and Alpha storage namespaces unchanged.
- A synthetic-only upgrade compatibility harness defines the future isolated acceptance plan, source package matrix, fixture marker, installer hash allowlist, process/login-entry preflight, and environment cleanup requirements without executing installers or touching the real Alpha profile.
- Downgrade remains unsupported: `env=0` Legacy rollback and the session-only "Use classic settings" action are the supported rollback paths, while future signed updater work must reject version rollback.
- Normal Alpha `.5` is intended to retain packaged Alpha Settings V2 default-on, production fallback, Launch at Login identity repair, legacy login-item cleanup, read-only login-item diagnostics, and absence of the removed internal fault hook.
- Installed RC7, real `%APPDATA%\Jarvis-K-Alpha`, user environment variables, login items, shortcuts, and registry state remain outside the harness and must not be modified by UI-3H-1 automation.

## UI-3H-2A Status

- Isolated VMware Windows 10 alpha.4 to alpha.5 in-place upgrade acceptance is recorded as PASS in `artifacts/ui-3h/isolated-alpha5-upgrade-acceptance/isolated-alpha5-upgrade-acceptance.json`.
- The evidence uses only the UI-3H-1 synthetic profile fixture; it records VM observations as user-observed or user-provided machine output and does not claim Codex direct machine observation inside the VM.
- Accepted upgrade result: alpha.5 displayed Settings V2 by default, all eight categories opened, Harbor theme and Pet state were retained, onboarding did not reappear, session classic-settings rollback worked, V2/Legacy were not mounted together, and clean Tray exit returned Jarvis/CoreHost process count to zero.
- Clean alpha.5 install, alpha.5 uninstall retention, and downgrade observation remain incomplete; downgrade remains unsupported.
- Unsigned external distribution remains disallowed until the remaining isolated install/uninstall/upgrade-readiness gates are explicitly closed.

## UI-3H-3A Status

- Isolated VMware Windows 10 alpha.5 uninstall retention acceptance is recorded as PASS in `artifacts/ui-3h/isolated-alpha5-uninstall-retention/isolated-alpha5-uninstall-retention.json`.
- The alpha.5 formal per-user uninstaller removed the program files, uninstall records, shortcuts, startup folder entries, and old/new Run identities in the isolated VM evidence.
- The synthetic Alpha profile was retained after uninstall: settings, the upgrade fixture marker, Harbor theme, Pet state, onboarding synthetic fields, and `launchAtLoginEnabled=false` remained intact.
- Alpha.4 to alpha.5 isolated in-place upgrade remains PASS from UI-3H-2A.
- Clean alpha.5 install remains incomplete, downgrade remains unsupported, downgrade prevention is not yet implemented, and unsigned external distribution remains disallowed.

## UI-3H-3C Status

- Alpha package metadata has advanced to `0.1.0-alpha.6` with Windows short version `0.1.0.6`; product name `Jarvis-K Alpha`, appId/AppUserModelId `com.jarvis-k.desktop.alpha`, NSIS x64 per-user scope, no elevation, and unsigned/no-publish policy remain unchanged.
- A packaged Alpha NSIS downgrade guard is implemented in `build/nsis/alpha-installer-policy.nsh` using a strict HKCU Alpha installer-state marker with schema version `1`, release ordinal `6`, appId/channel validation, GUI and silent `/S` enforcement, and explicit downgrade exit code `1638`.
- Bootstrap installs over pre-marker alpha.4/alpha.5 are allowed by exact DisplayName/DisplayVersion checks; clean install and same-version repair are allowed; malformed, mismatched, unknown, or newer installed state fails closed.
- The uninstall hook preserves the Alpha installer-state marker and profile data while retaining precise cleanup of the old display-name and new AppUserModelId login identities; it does not use wildcard registry cleanup.
- A normal unsigned Alpha.6 internal downgrade-guard candidate was built under `artifacts/packaged/ui-3h-alpha6-downgrade-guard/` for isolated VM acceptance only; it has not been installed or executed on the host.
- Host installed RC7, login items, registry state, user environment variables, and real `%APPDATA%\Jarvis-K-Alpha` profile remain untouched.
- Downgrade prevention still requires isolated VM acceptance before any external Alpha distribution; unsigned external distribution remains disallowed.

## UI-3H-3D Status

- Guarded Alpha.6 isolated VMware Windows acceptance is recorded as PASS in `artifacts/ui-3h/isolated-alpha6-downgrade-guard-acceptance/isolated-alpha6-downgrade-guard-acceptance.json`.
- Recorded acceptance covers alpha.5 to alpha.6 in-place upgrade, clean alpha.6 install, same-version repair, alpha.6 uninstall marker retention, same-version reinstall with retained marker, and simulated future-marker GUI plus silent downgrade blocking.
- The simulated ordinal `7` marker is explicitly VM-only and is not recorded as a real alpha.7 installation; final VM state was restored to valid ordinal `6`.
- Historical unguarded alpha.4/alpha.5 installers cannot be retroactively blocked.
- Code signing and signed installer lifecycle acceptance remain pending; external distribution remains NO.

## UI-3I-1A Status

- Offline signed-artifact verification harness preparation is implemented in `scripts/verify-windows-signed-release.mjs`; it requires an explicit artifact/build directory, records only relative artifact paths, inventories PE binaries, and fails closed for unsigned, invalid, wrong-publisher, wrong-thumbprint, missing-timestamp, missing-SignTool, and missing-required-role states.
- Synthetic-only preparation evidence and an external release manifest draft are recorded under `artifacts/ui-3i/signed-artifact-verification-preparation/`; both explicitly keep `realSignedArtifactVerified=false`, `executionBlocked=true`, `azureIdentity=pending`, and `externalDistributionAllowed=false`.
- Real Azure signing backend configuration, alpha.7 version/ordinal uplift, signed candidate generation, signed lifecycle VM acceptance, and external distribution remain blocked pending completed Azure identity validation and a separately approved signing implementation.

## UI-3I-1H Status

- Signed Alpha.7 Azure Artifact Signing candidate build retry completed as PASS in `artifacts/packaged/ui-3i-signed-alpha7-candidate-attempt2/` with one full build invocation, no publish/upload, and no install/uninstall.
- Verification evidence is recorded in `artifacts/ui-3i/signed-alpha7-candidate/signed-alpha7-build-verification.json`; `realSignedArtifactVerified=true`, `executionBlocked=false`, and `externalDistributionAllowed=false`.
- The final NSIS installer, unpacked main EXE, and packaged elevate helper verify as Authenticode Valid with RFC 3161 timestamps, expected publisher CN/O `Jiajian zou`, and independent SignTool verification PASS.
- Native PE audit completed with `totalPeArtifacts=11`, `invalidSignatureCount=0`, and `unsignedUnexpectedCount=0`; unsigned Electron/Chromium runtime DLLs are documented as expected upstream runtime artifacts rather than Jarvis-owned signer failures.
- The standalone NSIS uninstaller is not retained in the packaged output after embedding, so uninstaller signature verification remains pending isolated signed lifecycle install acceptance.
- Signed lifecycle VM acceptance remains pending, and external Alpha distribution remains NO until the signed install/upgrade/repair/uninstall/downgrade-block matrix is completed and explicitly approved.

## UI-3I-2B Status

- Signed Alpha.7 isolated Windows 10 lifecycle acceptance is recorded as PASS in `artifacts/ui-3i/signed-alpha7-isolated-lifecycle/signed-alpha7-isolated-lifecycle-acceptance.json`.
- The evidence records user-provided VM machine output and user-observed UI results separately from host machine observations; Codex did not install, uninstall, sign, build, publish, upload, restore/control the VM, or read the host Alpha profile during this evidence closure.
- Accepted lifecycle coverage includes unsigned Alpha.6 to signed Alpha.7 in-place upgrade, signed same-version repair, signed Alpha.7 uninstall with retained profile and installer-state marker, retained-profile reinstall, and real guarded Alpha.6 GUI plus silent `/S` downgrade blocking against a genuine Alpha.7 ordinal marker.
- Installer, installed Main, and installed Uninstaller Authenticode, timestamp, and publisher checks are recorded as PASS in the isolated VM evidence; source build signing evidence remains PASS from UI-3I-1H.
- The reinstall path is explicitly classified as retained-profile reinstall, not pristine clean install. Pristine signed Alpha.7 clean install and Windows 11 signed lifecycle acceptance remain not completed.
- External distribution readiness remains NO until the remaining acceptance gaps and external release approval path are closed.

## UI-3I-2C Status

- Windows 11 pristine signed Alpha.7 clean-install acceptance is recorded as PASS in `artifacts/ui-3i/signed-alpha7-windows11-pristine-clean-install/signed-alpha7-windows11-pristine-clean-install-acceptance.json`.
- The evidence is strictly evidence-only and layered: Codex host baseline is recorded separately from user-observed Windows 11 UI results and user-provided VM machine output.
- Accepted clean-install coverage includes Windows Update PASS, pristine-before-Jarvis snapshot, isolated installer staging, no SmartScreen or UAC elevation observed, publisher classified as `Jiajian zou`, Windows 11 UI checks 1-13 PASS, final machine state PASS, and final pass snapshot creation.
- User-provided machine output records Windows 11 Pro `10.0.26200`, TPM and Secure Boot ready state, signed installer SHA-256 and Authenticode validity, pristine pre-install absence of install directory/profile/marker/shortcuts/processes/environment variables/Run identities, installer exit code `0`, installed Alpha.7 version, signed Main and Uninstaller validity, ordinal `7` marker, Launch at Login remaining OFF, one uninstall registration, and desktop/start-menu shortcuts present.
- Codex did not modify product logic, installer policy, signing configuration, Gate or runtime code; did not build, sign, install, uninstall, publish, upload, or enter external publishing.
- UI-3I-2C stops at evidence closure. External distribution readiness remains NO until a separate external release approval path is completed.

## UI-3K-2B Status

- Implementation binds only the existing `@jarvis-k/inference-adapter-glm-chat-answer-runtime` DeepSeek/OpenAI-compatible Chat Answer path. The production adapter symbol is `OpenAiCompatibleChatAnswerRuntimeProvider`; `DeepseekChatAnswerRuntimeProvider` remains a thin profile wrapper, while CoreHost product mode still composes the OpenAI-compatible provider with the DeepSeek Alpha.7 profile.
- The previous Chat Answer path remains JSON one-shot/non-stream. The new `startTextTurn(request, context, signal)` adapter method emits only normalized assistant delta/final/failure events and keeps raw provider chunks, credentials, headers, and endpoint details out of public projections.
- Core runtime now accepts a text `chat.answer` command, writes the user message once, starts the provider stream asynchronously, exposes `assistantTurn` as a transient snapshot projection, batches subsequent deltas, persists the final assistant answer once through the existing message store shape, and returns `dispatchStatus=running` without duplicating the final answer in `brainResult`.
- Cancellation is turn-scoped through `agent.cancelAssistantTurn`; stale or wrong turn IDs are rejected, terminal turns are no-op rejected, the active provider `AbortSignal` is aborted, and stale provider output after cancellation is ignored.
- Concurrency is intentionally conservative: one active assistant turn is allowed globally until the current turn completes, fails, or is cancelled.
- No tool calls, Windows actions, approval business logic, plugin/MCP runtime, voice/wake-word logic, persistence migration, Settings expansion, Gate rollback, installer, signing, packaging, publishing, upload, or real provider request was added to this phase.
- Focused fake/local validation added: assistant runtime streaming/cancellation/invariants, DeepSeek/OpenAI-compatible streaming adapter behavior, and UI transient projection/no-duplicate source invariant.
- External publishing remains out of scope; the next allowed step is a separate UI-3K-2C acceptance decision, not release distribution.

## UI-3K-2B-Fix Status

- Production streaming reachability is repaired without adding a new router, provider, dependency, Gate path, tool path, plugin/MCP path, voice path, Windows executor path, installer/signing change, publishing step, or real provider request.
- The root cause was in the CoreHost configured Chat Answer wrapper: `ConfigurableChatAnswerProvider` exposed only `answer()`, while the concrete DeepSeek/OpenAI-compatible provider already implemented `startTextTurn(request, context, signal)`, so CoreRuntime could not classify the configured provider as an AssistantRuntime streaming adapter.
- The Chat Answer provider port now exposes optional streaming capability, the configured wrapper forwards normalized `startTextTurn` and `AbortSignal` to the concrete provider, and providers without streaming support return typed `streaming_not_supported` instead of faking streaming from a completed one-shot answer.
- Ordinary conversational fallback remains the existing CoreRuntime rules path: supported deterministic commands/settings/diagnostics/internal routes keep their existing dispatch behavior; short invalid text clarifies; all other harmless conversational input defaults to `chat.answer` and can reach AssistantRuntime when a streaming-capable provider is configured.
- The acceptance-utterance route remains only as a test/manual-acceptance convenience for fixed high-confidence phrases and is not required for ordinary conversational production reachability.
- Focused fake/local validation now covers ordinary Chinese and English `agent.runBrainCommand` streaming through the formal CoreRuntime entry, multiple delta projection, one canonical final assistant message, turn-scoped cancellation and late-output ignore, post-cancel retry, deterministic Windows app-open separation, harmless ambiguous chat without Windows executor invocation, provider tool-call fail-closed behavior, provider missing/unavailable fallback, non-streaming provider one-shot fallback, configured wrapper streaming forwarding, and explicit unsupported-streaming classification.
- The local desktop chat-answer smoke now exercises the existing local smoke provider through Electron UI/preload/CoreHost/CoreRuntime with `realNetworkRequestSent=false`.
