# Phase 6 Progress

## 2026-08-13

### Full Voice Closed Loop Initial Vertical Slice

- Status: L4 user-facing integration accepted by Windows voice UI manual
  verification.
- Added a desktop smoke for the first voice-command Task Runtime path:
  - script: `npm run smoke:desktop:voice-task-runtime-notepad`;
  - simulated final ASR handoff by sending a BrainCommand with `source:
    "voice"`;
  - routed `打开记事本。` through deterministic rules;
  - created a persisted Task Runtime task with `source: voice`;
  - launched real Notepad through Desktop Host;
  - verified the Notepad process/window result through the existing Windows
    executor verification path;
  - confirmed the task remained visible after app restart.
- Added Core regression coverage for voice-sourced Notepad launch:
  - `source: voice`;
  - `intent: localApp.open`;
  - `requiresApproval: false` for the low-risk known-app route;
  - `routeSource: intent-router.deterministic.rules`;
  - verified TaskStep result status.
- Added Core regression coverage for Chinese voice Notepad write commands:
  - `打开记事本，输入 Javascript。`;
  - `source: voice`;
  - `intent: notepad.write_text`;
  - speech punctuation is removed from the bounded write payload;
  - Task Runtime writes through the Notepad verifier before any product fixture
    fallback can run;
  - raw write text remains excluded from persisted task evidence.
- Updated the old Command Router product-mode fixture notice so the UI does
  not imply that low-risk known apps require UI plus native double
  confirmation.
- Safety boundaries preserved:
  - no wake word;
  - no continuous listening;
  - no new ASR provider behavior;
  - no Qwen routing;
  - no provider planner;
  - no shell, PowerShell, arbitrary executable path, arbitrary command-line
    argument, browser, filesystem, clipboard, credential, or plugin permission
    expansion.

#### Current Voice Gate

- Automated gate is implementation-level only and is passing:
  - final transcript dispatch remains covered in
    `apps/ui/test/use-jarvis-inference-source.test.ts`;
  - voice-source Task Runtime dispatch is covered in
    `packages/core/test/runtime.test.ts`;
  - desktop smoke covers `source: voice` to real Notepad launch and persisted
    Task Runtime timeline.
- Verification results:
  - `npx vitest run apps/ui/test/app-voice-ui-source.test.ts
    apps/ui/test/use-jarvis-inference-source.test.ts`: PASS, 2 files and 40
    tests;
  - `npx vitest run packages/core/test/runtime.test.ts`: PASS, 1 file and 96
    tests;
  - `npm run build:ui`: PASS, with the existing Vite chunk-size warning only;
  - `npm run typecheck`: PASS;
  - `npm run smoke:desktop:voice-task-runtime-notepad`: PASS.
- Desktop smoke evidence:
  - source: `voice`;
  - intent: `localApp.open`;
  - command text: `打开记事本。`;
  - real Notepad process observed: yes;
  - deterministic rules route used: yes;
  - fixture product path used: no;
  - task persisted after restart: yes;
  - Notepad result verification: passed;
  - artifacts:
    `artifacts/jarvis-k-voice-task-runtime-notepad-smoke.png` and
    `artifacts/jarvis-k-voice-task-runtime-notepad-smoke-metrics.json`.
- Windows voice UI manual acceptance: PASS.

#### Voice Chinese ASR Remediation

- Field issue observed in Windows UI:
  - final transcript `打开记事本。` was routed as `localApp.open` with target
    `记事本。`;
  - final transcript `打开记事本，输入 Javascript。` was routed as
    `localApp.open` with the whole clause as target;
  - both fell through to the old product-mode fixture block message instead of
    the formal Task Runtime path.
- Remediation:
  - local-app targets now strip common speech punctuation before allowlist
    matching;
  - open-target extraction now preserves known-app first clauses when an ASR
    command includes a trailing action clause;
  - Chinese Notepad write commands now route to `notepad.write_text`;
  - Chinese sentence punctuation is stripped from bounded write text before
    validation.
- Automated acceptance after remediation:
  - `npx vitest run packages/core/test/runtime.test.ts`: PASS, 1 file and 96
    tests;
  - `npm run smoke:desktop:voice-task-runtime-notepad`: PASS;
  - `npm run typecheck`: PASS after rerun;
  - first parallel typecheck attempt produced lifecycle failures without
    TypeScript diagnostics while the desktop smoke was also building; the
    standalone rerun passed.

#### Voice Manual Acceptance Steps

1. Open Jarvis-K.
2. Open the Voice view.
3. Use the existing PTT/microphone capture.
4. Say `打开记事本。`.
5. Confirm the final transcript appears in the UI.
6. Confirm Notepad opens without a low-risk double confirmation prompt.
7. Confirm the conversation shows a completed assistant result.
8. Open the Tasks view and confirm the Notepad task is completed and verified.
9. Confirm TTS reports or plays the result, or degrades to a visible UI status
   if the configured TTS service is unavailable.

#### Voice Manual Acceptance Result

- Windows voice UI manual acceptance: PASS.
- Accepted result:
  - the final voice transcript was visible in the official UI;
  - `打开记事本。` opened real Notepad through deterministic rules and Task
    Runtime;
  - the old product-mode fixture block path did not handle the accepted
    Notepad command;
  - the low-risk known-app path did not require double confirmation;
  - the visible UI result/timeline showed completed execution;
  - the Chinese ASR punctuation remediation was accepted in real manual use.

#### Completion Level

- Current level: L4.
- L4 basis: the user can invoke the Notepad Task Runtime path from the official
  voice UI, the route uses deterministic rules, the real Windows action is
  verified, and Windows manual acceptance passed.
- Not L5: wake word, VAD, interruption handling, broader voice commands,
  installer/update integration, and full release hardening remain future work.

#### Voice Notepad Write Manual Acceptance Result

- Windows voice UI manual acceptance: PASS.
- Accepted result:
  - `打开记事本。` opened real Notepad through deterministic rules and Task
    Runtime;
  - `打开记事本，输入 Jarvis-K voice smoke text。` routed as
    `notepad.write_text`;
  - Notepad write reused the existing Notepad window;
  - the requested text was visible in Notepad;
  - the UI task timeline showed completed / verified execution;
  - the product fixture path did not handle the accepted write command.

#### Voice Notepad Write Completion Level

- Current level: L4.
- L4 basis: the user can complete the voice-to-Notepad-write flow from the
  official UI with real Windows execution and manual verification.
- Not L5: broader voice command coverage, interruption handling, continuous
  listening, wake word, installer/update integration, and release hardening
  remain future work.

### Voice Input Normalizer / Fuzzy Command Hardening

- Status: L3 real implementation pending Windows voice UI manual acceptance.
- Added a voice-only routing text normalizer before deterministic rules:
  - raw voice transcript remains the user-visible and persisted command text;
  - normalized routing text is used only for route selection and bounded slots;
  - text commands are not changed by this normalizer.
- Added low-risk known-app ASR alias handling:
  - `notepad` aliases: `记事簿`, `记事板`, `记事门`, `记事薄`;
  - `calculator` aliases: `计算气`, `计算其`;
  - `vscode` aliases: `VS code`, `V S Code`, `visual studio`,
    `visual code`.
- Added bounded voice text cleanup for known Notepad write smoke terms:
  - `Jarvis K` becomes `Jarvis-K`;
  - `Java script` becomes `Javascript`.
- Added field-observed ASR drift remediation:
  - `Open VS. Code.` now normalizes to the existing `vscode` known-app target
    instead of falling through to `browser.open`;
  - in voice Notepad write commands only, `javac voice smoke test` normalizes
    to `Jarvis-K voice smoke text`.
- Safety boundaries preserved:
  - no new ASR provider behavior;
  - no Qwen routing;
  - no provider planner;
  - no new app allowlist targets;
  - no shell, PowerShell, arbitrary executable path, arbitrary command-line
    argument, filesystem, clipboard, credential, plugin permission, installer,
    packaging, telemetry, or release-channel change.

#### Voice Input Normalizer Gate

- Automated validation:
  - `npx vitest run packages/core/test/runtime.test.ts`: PASS, 1 file and 102
    tests;
  - `npm run typecheck`: PASS;
  - `npm run smoke:desktop:voice-task-runtime-notepad`: PASS.
- Desktop smoke evidence:
  - existing accepted voice Notepad route still opens real Notepad;
  - deterministic rules route used: yes;
  - fixture product path used: no;
  - Notepad result verification: passed.
- Windows voice UI manual acceptance is still required before this hardening
  slice can be marked L4.
- Windows voice UI manual acceptance status: DEGRADED PASS.
  - Basic voice command flow manually passed.
  - Field issue: `Open VS. Code.` was misrouted as `browser.open` and blocked
    by the browser allowlist.
  - Field issue: `Jarvis-K voice smoke text` was recognized as
    `javac voice smoke test`.
  - Both field issues are now covered by source remediation and Core runtime
    regression tests.
- Follow-up Windows UI observation:
  - `Open VS. Code.` now routes to the existing VS Code known-app Task Runtime
    path instead of `browser.open`;
  - one UI attempt still reported VS Code launch result verification failure;
  - a later UI attempt with the same visible phrase fell back to
    `browser.open` and was blocked by the URL allowlist.
  - after routing remediation, one voice UI attempt reached the command path
    but Desktop Supervisor returned `CORE_REQUEST_TIMEOUT` after the previous
    5000 ms Core request window.
  - after several restart attempts, the Task view showed recovered
    `interrupted` tasks whose active step still projected `running / pending`,
    making the old recovered task look like it was still executing.
  - a fresh VS Code route still became `interrupted` during startup recovery
    after roughly one health-check interval, indicating the supervisor health
    ping could restart Core while a real Brain/Task command was still in
    flight.
- Follow-up remediation:
  - Core deterministic known-app target normalization now collapses dotted
    `VS. Code` / `V.S. Code` spellings before browser route fallback can win;
  - Core Host local app aliases now include `vs code` for the existing VS Code
    allowlisted target;
  - the fixed VS Code candidate paths include the x86 Program Files install
    location;
  - VS Code verification now allows a bounded longer wait and a secondary
    Code process observation path while remaining scoped to the known
    allowlisted app.
  - Desktop Supervisor now keeps the normal short timeout for health/basic
    Core requests while giving `agent.runBrainCommand` a bounded longer request
    window for real Task Runtime / Provider / verification work.
  - SQLite Task Runtime startup recovery now also repairs active steps on
    recovered/interrupted tasks: non-terminal `pending` / `running` steps are
    projected as `cancelled` with `unverified` result verification and a
    sanitized startup-recovery failure reason. No side-effecting step is
    replayed.
  - Supervisor health monitoring now skips `agent.ping` while an
    `agent.runBrainCommand` request is in flight, preventing health-check
    restarts from interrupting bounded real Task Runtime work.
  - the VS Code desktop smoke harness now binds UI timeline checks to the
    target task card and uses Core snapshot state for completed/verified
    assertions, avoiding stale-card or CSS/text rendering sensitivity.
- Follow-up validation:
  - `npx vitest run apps/core-host/test/sqlite-task-repository.test.ts`: PASS,
    1 file and 1 test;
  - `npx vitest run apps/desktop/test/supervisor.test.ts`: PASS, 1 file and 7
    tests;
  - `npx vitest run packages/core/test/runtime.test.ts`: PASS, 1 file and 103
    tests;
  - `npx vitest run apps/core-host/test/brain-action-allowlist-adapter.test.ts`:
    PASS, 1 file and 18 tests;
  - `npm run typecheck`: PASS after single rerun; the earlier parallel
    typecheck/smoke run produced a workspace lifecycle exit without TypeScript
    diagnostics while concurrent build output was active;
  - `npm run smoke:desktop:task-runtime-vscode`: PASS, real UI path,
    deterministic rules, Task Runtime, Desktop Host, VS Code verification, UI
    timeline visibility, and task persistence after restart.
  - `npm run smoke:desktop:voice-task-runtime-notepad`: PASS, voice source,
    deterministic rules, Task Runtime, Desktop Host, real Notepad launch, and
    UI evidence artifact capture.
- Current follow-up level: L3 pending Windows voice UI manual re-acceptance for
  the VS Code route after the routing and verification remediation.

#### Voice Input Normalizer Manual Acceptance Steps

1. Open Jarvis-K.
2. Use the existing voice UI / PTT flow.
3. Say `打开记事簿。`.
4. Confirm real Notepad opens through Task Runtime and no fixture blocked
   message appears.
5. Say `打开计算气。`.
6. Confirm Calculator opens through Task Runtime and no fixture blocked message
   appears.
7. Say `open VS code.` or `open V S Code.`.
8. Confirm VS Code routes as the existing known-app target and follows the
   current Task Runtime / allowlist behavior.
9. Say `那个打开记事簿，输入 Jarvis K voice smoke text。`.
10. Confirm Notepad write routes as `notepad.write_text`, writes
    `Jarvis-K voice smoke text`, and the UI timeline shows completed /
    verified.

### Skin Phase 1 Theme Switcher Vertical Slice

- Status: L4 user-facing integration accepted by Windows UI manual
  verification.
- Added a default-off-free, built-in-only Theme Engine for the official React
  UI:
  - theme id type: `signal`, `harbor`, `ember`;
  - storage key: `jarvis-k-ui-theme`;
  - default recovery theme: `signal`;
  - selected theme projected on the app root as `data-skin-theme`;
  - selected theme projected on `document.documentElement.dataset.jarvisTheme`.
- Added three static built-in theme palettes through CSS variables:
  - `Signal`: existing dark control-room baseline;
  - `Harbor`: light operations workspace;
  - `Ember`: warm dark focus console.
- Added the official Settings view theme switcher:
  - visible swatches for each built-in theme;
  - selected theme status badge;
  - visible safety/status projection for Theme Schema, local persistence,
    default recovery, and no executable skin code.
- Added local persistence and recovery behavior:
  - valid selected theme persists through app restart;
  - invalid stored theme value is removed and falls back to `signal`.
- Added a desktop smoke:
  - `npm run smoke:desktop:skin-theme`;
  - opens official Settings UI;
  - switches from `signal` to `harbor`;
  - verifies localStorage persistence;
  - restarts Electron and verifies `harbor` remains selected;
  - injects an invalid stored value and verifies recovery to `signal`;
  - records screenshot and sanitized metrics.
- Safety boundaries preserved:
  - no `.jkskin` import/export;
  - no arbitrary CSS import;
  - no external URL;
  - no JavaScript, HTML, iframe, scriptable SVG, Electron IPC, filesystem,
    network, plugin permission, marketplace, install, update, or executable
    skin behavior.

#### Current Gate

- Source tests: PASS, 2 files and 31 tests:
  - `apps/ui/test/app-voice-ui-source.test.ts`;
  - `apps/ui/test/skin-theme-source.test.ts`.
- `npm run build:ui`: PASS.
  - Vite reported the existing large chunk-size warning only.
- `npm run build:desktop`: PASS.
- `npm run typecheck`: PASS.
- `npm run smoke:desktop:skin-theme`: PASS.
  - Default theme: `signal`.
  - Selected theme: `harbor`.
  - Persisted after restart: `harbor`.
  - Invalid stored value recovery: `signal`.
  - Invalid stored value removed: yes.
  - Executable skin code loaded: false.
  - External skin URL loaded: false.
  - Evidence artifacts:
    `artifacts/jarvis-k-skin-theme-smoke.png` and
    `artifacts/jarvis-k-skin-theme-smoke-metrics.json`.

#### Manual Acceptance

- Windows UI manual acceptance: PASS.
- Accepted result:
  - the official Settings UI exposes the Theme / skin theme section;
  - `Harbor`, `Ember`, and `Signal` switch the visible UI theme immediately;
  - `Harbor` persists after closing and reopening Jarvis-K;
  - no `.jkskin`, install, marketplace, external URL, permission, or executable
    skin control is visible.
- Manual steps verified:
  1. Open Jarvis-K.
  2. Click the lower-left Settings gear.
  3. Confirm the `Theme` / `皮肤主题` section is visible.
  4. Select `Harbor`, then `Ember`, then `Signal`.
  5. Confirm colors switch immediately without opening any external window.
  6. Select `Harbor`, close Jarvis-K, reopen it, and confirm `Harbor` remains
     selected.
  7. Confirm no `.jkskin`, install, marketplace, external URL, permission, or
     executable skin control is visible.

#### Completion Level

- Current level: L4.
- L4 basis: the user can switch and persist built-in themes from the official
  Settings UI, and the behavior passed Windows manual acceptance.
- Not L5: Skin Package, Skin Studio, import/export, signing, packaging,
  installer/update integration, and community publishing are intentionally not
  implemented in this slice.

### Voice / VS Code Known-App Verification Hardening

- Status: L4 after Windows UI manual re-acceptance.
- Trigger: during manual voice testing, `Open VS. Code.` reached Task Runtime
  and Desktop Host but failed result verification with
  `vscode process verification did not observe a running process`.
- Root cause class: real Windows known-app execution could inherit Electron
  node-mode process environment from Jarvis/Core Host. VS Code is itself an
  Electron application, so inheriting `ELECTRON_RUN_AS_NODE` can make the fixed
  `Code.exe` launch fail to leave an observable GUI process.
- Remediation:
  - increased the Desktop Supervisor Brain command response window from 30s to
    60s for real task-running commands;
  - kept the normal request timeout at 5s for non-Brain commands;
  - kept health checks skipped while a Brain command is in flight;
  - extended VS Code verification to a bounded 45s `Code.exe` tasklist poll plus
    a short `Code` process fallback;
  - removed `ELECTRON_RUN_AS_NODE` from the environment used for external GUI
    application launches;
  - preserved the fixed known-app allowlist and no command-line arguments.
- Safety boundaries preserved:
  - no fixture route entered the product path;
  - no arbitrary executable path;
  - no shell, PowerShell, cmd, or terminal execution by product route;
  - no browser/URL opening;
  - no allowlist expansion beyond the existing known-app target;
  - result success still requires observing the known VS Code process.
- Verification:
  - `npx vitest run apps/desktop/test/supervisor.test.ts`: PASS, 7 tests.
  - `npx vitest run apps/core-host/test/brain-action-allowlist-adapter.test.ts`:
    PASS, 18 tests.
  - `npm run typecheck`: PASS.
  - `npm run build:desktop`: PASS.
  - `npm run smoke:desktop:task-runtime-vscode`: PASS after the environment
    hardening, real UI/Core/Desktop path with deterministic rules, Task
    Runtime, Desktop Host known-app launch, VS Code process verification, UI
    timeline visibility, task persistence, and observed new `Code` process
    instances.
  - External GUI launch environment probe: PASS, with
    `ELECTRON_RUN_AS_NODE=1` simulated in the parent process, the VS Code launch
    environment removed the Electron node-mode flag and Windows observed a
    `Code` process.
- Manual acceptance:
  - PASS, confirmed by user after restart and remediation.
  - `Open VS Code` can be called successfully.
  - Prior interrupted / timeout / unobserved-process failures were not observed
    in the accepted run.

#### Completion Level

- Current level: L4.
- L4 basis: real implementation, desktop smoke verification, and Windows UI
  manual acceptance passed.
- Not L5: installer/update, broader OS compatibility, and release-channel
  acceptance are intentionally outside this slice.

### Voice Command Correction Phase 1

- Status: L4 after Windows voice UI manual acceptance.
- Scope:
  - kept the existing Xunfei production ASR Provider unchanged;
  - added provider-neutral `VoiceCommandResolver`;
  - preserved `rawTranscript` and added `normalizedTranscript`,
    `correctionSource`, `correctionConfidence`, and `correctionCandidates`;
  - added `command`, `dictation`, and `conversation` voice input modes;
  - generated finite structured candidates from known apps, plugin
    capabilities, slot grammar, and user-confirmed aliases;
  - added personal alias persistence through a Core Host injected repository;
  - added list and delete commands for saved aliases;
  - kept execution behind existing Core routing, Task Runtime, permissions, and
    risk gates.
- Covered first proprietary terms:
  - Jarvis-K;
  - IZYtoken;
  - Codex;
  - VS Code;
  - Qwen;
  - DeepSeek;
  - GitHub;
  - PowerShell;
  - Notepad;
  - Calculator.
- Slot grammar supported:
  - `open {app}` / `打开{应用}`;
  - `search {file}` / `搜索{文件}`;
  - `query {object}` / `查询{对象}`;
  - `use plugin {plugin} {action}` / `使用{插件}{动作}`.
- Safety boundaries preserved:
  - no replacement of Xunfei ASR;
  - no raw ASR overwrite;
  - no raw audio persistence;
  - no Qwen free rewrite or direct execution path;
  - no direct action attempted by the resolver;
  - high-risk targets still rely on existing risk and permission gates;
  - ambiguous or low-confidence corrections return at most two candidates;
  - existing Notepad dictation/write route remains intact.
- Acceptance examples covered in tests:
  - `打开微爱死扣的` resolves to `localApp.open` with target `vscode`;
  - `让扣的克斯检查项目` resolves to `coding.task` with target `codex`;
  - `打开一只token后台` resolves to `browser.open` with target
    `IZYtoken admin`;
  - close candidate ambiguity asks for user selection instead of executing.
- Offline evaluation:
  - 100 voice command records.
  - Metrics from `packages/core/test/voice-command-resolver.test.ts`:
    - CER: 0.000;
    - Intent Accuracy: 1.000;
    - Slot Accuracy: 1.000;
    - Task Success Rate: 1.000.
- Verification:
  - `npm run build:contracts`: PASS.
  - `npm run build:core`: PASS.
  - `npm run build:core-host`: PASS.
  - `npx vitest run packages/core/test/voice-command-resolver.test.ts`: PASS,
    5 tests.
  - `npx vitest run packages/core/test/runtime.test.ts -t voice`: PASS,
    11 tests.
  - `npm run build:ui`: PASS.
  - `npm run typecheck`: PASS.
  - `npx vitest run apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts`:
    PASS, 42 tests.
- UI implementation evidence:
  - main conversation surface renders low-confidence voice correction candidates
    next to the latest conversation results with the raw transcript preserved;
  - selecting a candidate confirms a personal alias, then resubmits the raw
    voice transcript through the existing Core resolver and Task Runtime path;
  - Voice view lists saved voice command aliases and supports deletion through
    provider-neutral Core commands;
  - UI does not execute a selected correction directly and does not write local
    alias storage directly.
- IZYtoken browser-open remediation:
  - Windows manual check found that `Open IZYtoken admin` produced a candidate
    but did not open because Core Host browser alias allowlist had no configured
    fixed URL for the proprietary target;
  - added a fail-closed configured browser alias gate:
    `JARVIS_K_IZYTOKEN_ADMIN_URL`;
  - the alias only opens a fixed configured HTTPS URL after the existing URL
    policy validation passes;
  - when the URL is not configured, `IZYtoken admin` remains blocked as
    `TARGET_NOT_ALLOWLISTED`;
  - no arbitrary URL opening, credentials, tokens, signed URLs, browser profile
    inspection, shell, PowerShell, or allowlist wildcard was added.
- Additional verification:
  - `npx vitest run apps/core-host/test/brain-action-allowlist-adapter.test.ts`:
    PASS, 21 tests.
  - `npx vitest run packages/core/test/runtime.test.ts -t "browser URL|voice command correction"`:
    PASS, 2 tests.
  - `npm run build:core-host`: PASS.
  - `npm run typecheck`: PASS.
- UI execution-state remediation:
  - Windows manual check found that selecting the `Open IZYtoken admin`
    correction candidate could leave the visible action state on `running` when
    the confirmation or redispatch path failed or timed out;
  - added a UI-side fail-closed action-state guard so tracked actions convert
    rejected promises into a sanitized warning result instead of leaving the
    header pill stuck on `running`;
  - the guard does not bypass Core, Task Runtime, URL policy, risk rules, or
    browser allowlist behavior;
  - the guard sanitizes the visible error detail to a short message and does
    not expose stack traces, private paths, raw provider diagnostics, tokens, or
    URLs beyond the already visible configured target label.
- Additional UI verification:
  - `npx vitest run apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts`:
    PASS, 43 tests.
  - `npm run build:ui`: PASS.
  - `npm run build:desktop`: PASS.
  - `npm run typecheck`: PASS.

#### Completion Level

- Current level: L4.
- L4 basis: provider-neutral resolver, Core routing integration, alias
  persistence commands, finite candidate safety behavior, offline evaluation,
  official UI candidate / alias projection, and Windows real voice UI manual
  acceptance have passed.
- Windows manual acceptance:
  - PASS, confirmed by user with `Voice Command Correction Phase 1
    人工验收通过`.
  - Accepted behavior includes raw transcript preservation, visible correction
    candidates, bounded candidate selection, saved alias visibility/deletion,
    deterministic-rule redispatch through existing Task Runtime paths, and no
    Qwen free rewrite or direct execution bypass.
- Not L5: wake word, VAD, interruption handling, larger real-world voice
  corpus expansion, installer/update integration, release hardening, and broad
  compatibility acceptance remain future work.

### Personal Route Alias Memory L4 Slice

- Status: L4.
- User-facing goal:
  - user can tell Jarvis-K a safe project URL, for example
    `记住 IZYtoken 后台地址是 https://example.com/admin`;
  - Jarvis-K returns a visible confirmation card instead of executing;
  - after explicit UI confirmation, Jarvis-K stores a user-confirmed route
    alias;
  - future `打开 IZYtoken 后台` routes through deterministic rules to
    `browser.open` with the saved HTTPS URL and then through the existing Task
    Runtime/browser policy path.
- Implementation:
  - added provider-neutral `UserRouteAliasRepository` in Core;
  - Core Host injects `JsonUserRouteAliasRepository` and persists to
    `user-route-aliases.json` under the existing Jarvis-K user-data location,
    with `JARVIS_K_USER_ROUTE_ALIAS_PATH` test/dev override;
  - added `UserRouteAliasRecord` and `UserRouteAliasLearningProposal` contract
    schemas;
  - added Core commands:
    - `agent.confirmUserRouteAlias`;
    - `agent.listUserRouteAliases`;
    - `agent.deleteUserRouteAlias`;
  - UI renders a route-alias confirmation card in the main conversation
    surface and lists/deletes saved route aliases in the Voice view.
- Safety:
  - raw user input is not overwritten;
  - learning a route alias never opens a browser or launches a process;
  - persistence requires explicit UI confirmation;
  - URL policy is HTTPS only, no embedded credentials, no hash, and no
    sensitive query keys such as token/password/key/auth/signature/code;
  - saved aliases still dispatch through deterministic rules, Task Runtime,
    browser policy, and result verification;
  - no Qwen/runtime/provider planner/vector retrieval path was added.
- Verification:
  - `npm run build:contracts`: PASS.
  - `npm run build:core`: PASS.
  - `npm run build:core-host`: PASS.
  - `npm run build:ui`: PASS.
  - `npm run build:desktop`: PASS.
  - `npm run typecheck`: PASS.
  - `npx vitest run packages/core/test/runtime.test.ts -t "route alias"`:
    PASS, 3 tests.
  - `npx vitest run apps/core-host/test/user-route-alias-repository.test.ts`:
    PASS, 1 test.
  - `npx vitest run apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts`:
    PASS, 43 tests.
- Windows manual acceptance:
  - PASS.
  - User confirmed the route alias learning flow passed manual testing.
  - The accepted L4 behavior is:
    - a safe IZYtoken URL learning command shows a visible confirmation card;
    - no browser action is attempted before saving;
    - clicking `Save alias` persists the route alias;
    - the saved alias can be used from the main UI route path;
    - execution remains behind deterministic rules, Task Runtime, browser URL
      policy, and existing result verification.
- Completion level:
  - L4 because the feature is now usable from the formal UI and passed Windows
    manual acceptance.
  - Not L5 because installer/update/release-channel hardening and broader
    compatibility acceptance are not part of this slice.
