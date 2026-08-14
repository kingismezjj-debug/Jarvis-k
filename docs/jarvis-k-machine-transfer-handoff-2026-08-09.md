# Jarvis-K Machine Transfer Handoff

Recorded: 2026-08-09

This file is the complete handoff for moving Jarvis-K to another Windows
machine. It reflects the current project state after the provider-backed Chat
Answer / DeepSeek runtime work, not the older Memory-only handoff.

## Most Important Transfer Warning

The current workspace is dirty and contains many important uncommitted and
untracked source files, tests, scripts, and docs.

Do not move to the new computer by cloning only `main` unless these changes are
committed and pushed first. A plain clone of the old remote branch will miss the
latest Chat Answer, DeepSeek, TTS, Qwen routing, and evidence work.

Use one of these transfer paths:

1. Preferred: create a new branch, commit the current work, push it, then clone
   that branch on the new computer.
2. Fast local transfer: copy the entire workspace folder
   `C:\Users\Administrator\Documents\Jarvis-k` to the new computer, including
   untracked files.

Do not copy provider credential files from `%APPDATA%\Electron`. Configure
credentials fresh on the new computer.

## Product Goal

Jarvis-K is intended to become a supervised Windows desktop intelligent agent:

```text
voice/text input
  -> ASR or text command
  -> local Qwen fast brain intent routing
  -> safe intent/result projection
  -> approved execution brain/tool/system connector
  -> UI result and optional TTS response
```

The original target remains intact:

- voice command input;
- local fast command recognition with Qwen;
- dispatch into specialized execution brains;
- open local software and eventually perform simple allowed operations;
- connect to stock analysis or quant systems through bounded connectors;
- search or retrieve information and show results in the Jarvis-K UI; and
- speak back results through TTS.

The project has not drifted away from that goal. The current stage is still the
safety and product-runtime foundation, with exactly one accepted developer-alpha
desktop side effect: Command Router may launch Notepad or Calculator only after
deterministic fixture routing, an explicit UI confirmation button, and the
native confirmation dialog.

## Current Practical Status

The most mature working product paths are:

```text
Settings Chat Answer toggle
  -> secure-store DeepSeek credential
  -> controlled one-shot provider-backed Chat Answer runtime
  -> bounded ChatAnswerResult
  -> visible UI result
  -> optional TTS after safe answered result

Settings Command Router toggle
  -> deterministic fixture router
  -> fixture dry-run result
  -> explicit confirmation for Notepad/Calculator only
  -> visible Windows app launch after native confirmation
  -> sanitized launch result
```

## Latest Quick Resume Delta

Append this to the Quick Resume prompt if continuing after the current
developer-alpha next-gate decision:

```text
Qwen conversation-surface developer-alpha next-gate decision / release-readiness review passed as docs-only evidence; see docs/qwen-conversation-surface-next-gate-decision-closeout-2026-08-10.md and docs/qwen-conversation-surface-next-gate-decision-packet-2026-08-10.md. It selected the recommended next gate as a fresh bounded Qwen conversation-surface extended bounded local usage confidence window with at most 10 sanitized main-conversation route requests, still developer-alpha local explicit opt-in only. This decision packet made no code changes, started no helper, invoked no generation-port, sent no route request, executed no product route, expanded no runtime route count, expanded no allowlist, enabled no default-on behavior, exposed no release channel, made no production-facing claim, and final NO_HELPER_PROCESS_OBSERVED. Open a fresh bounded Product/Security/Release approval before executing the extended bounded local usage confidence window or any UI/IPC hardening, internal developer-alpha release note, helper startup, generation-port invocation, runtime route request, product-route execution, route-count expansion, allowlist expansion, default-on behavior, persistent routing outside bounded windows, telemetry/release exposure, or production-facing Qwen routing claim.
The Qwen conversation-surface extended bounded local usage confidence window executed once and closed degraded; see docs/qwen-conversation-surface-extended-bounded-local-usage-confidence-closeout-2026-08-10.md and docs/qwen-conversation-surface-extended-bounded-local-usage-confidence-evidence-2026-08-10.md. It added a developer-alpha-only JARVIS_K_QWEN_CONVERSATION_SURFACE_EXTENDED_USAGE route-limit gate; default persistent opt-in policy route limit remains 3 and existing bounded usage remains 5. Focused tests/builds passed, pre-run helper cleanup was NO_HELPER_PROCESS_OBSERVED, then the runtime attempt used retained env/cache, verified seven artifacts digest-before-load, started one helper, performed one generation-port readiness probe, and degraded on a latest rendered intent/summary assertion timeout during the main-conversation route sequence. The smoke did not emit sanitized per-route progress, so exact completed route count is not inferred. No same-window rerun was attempted, final helper cleanup was NO_HELPER_PROCESS_OBSERVED, and no default-on, persistent routing outside the bounded window, allowlist expansion, telemetry/release exposure, or production-facing claim occurred. A draft diagnostic/remediation approval request is open at docs/qwen-conversation-surface-extended-bounded-local-usage-diagnostic-remediation-approval-request-2026-08-10.md. It does not approve helper startup, generation-port invocation, runtime route requests, extended bounded usage rerun, product-route execution, default-on behavior, allowlist expansion, telemetry/release exposure, or production-facing claims. Continue by capturing exact Product/Security/Release approval text before source/test diagnostics or narrowly scoped smoke-harness remediation.
```

Accepted provider-backed runtime:

- provider: `chat-answer.openai-compatible.deepseek`
- profile: `deepseek.v4-flash.compact_json_object_256`
- model: `deepseek-v4-flash`
- endpoint: `https://api.deepseek.com/chat/completions`
- timeout: `30000` ms
- max output tokens: `256`
- default behavior: still off
- direct action execution: still off

Accepted Command Router real local-app path:

- provider: `intent-router.deterministic.fixture`
- default behavior: still off
- allowed real targets: `notepad`, `calculator`, `calc`
- confirmation: explicit UI button plus native confirmation dialog
- accepted blocked target: `open vscode`
- browser/URL/shell/arbitrary executable behavior: still off

Latest accepted controlled real runtime result:

```text
Input: Answer in one short sentence: what is Jarvis-K?
Output: Jarvis-K is a supervised local assistant runtime for bounded, approval-gated desktop assistance.
```

## What Is Already Implemented

### Desktop Shell

- Electron desktop app.
- React UI.
- Context-isolated preload bridge.
- Core Host child process supervision.
- Typed contracts across process boundaries.
- Settings surface now includes a Chat Answer product-mode control.

Main surfaces:

- `apps/desktop/src/main.ts`
- `apps/desktop/src/preload.ts`
- `apps/desktop/src/supervisor.ts`
- `apps/ui/src/App.tsx`
- `apps/ui/src/hooks/use-jarvis.ts`
- `packages/contracts/src/protocol.ts`

### BrainCommand Spine

The text BrainCommand path exists and is the central supervised command spine.
Current intent/result classes include:

- `chat.answer`
- `browser.open`
- `localApp.open`
- `memory.search`
- `observability.status`
- `model.status`
- `clarify`
- `blocked`

Safety/result projection, retry affordances, rollback-view affordances, and TTS
hooks exist. Real direct action is enabled only for the accepted Command Router
Notepad/Calculator allowlist path after explicit confirmation; all other direct
action behavior remains disabled.

Main surfaces:

- `packages/core/src/runtime.ts`
- `packages/capabilities/src/index.ts`
- `packages/capabilities/src/ports.ts`
- `apps/core-host/src/index.ts`

### Provider-Backed Chat Answer

This is the latest and most product-ready arc.

Completed:

- provider-neutral OpenAI-compatible Chat Answer fixture layer;
- Core Host provider selection and fallback composition;
- DeepSeek real runtime parser and shape normalization;
- `reasoning_content` safe fallback parsing;
- deterministic fixture fallback preservation;
- bounded `ChatAnswerResult` statuses:
  - `answered`
  - `clarify`
  - `blocked`
  - `unavailable`
- Settings-controlled runtime binding;
- one controlled real runtime activation through the desktop product path.

Important files:

- `packages/inference-adapter-openai-chat-answer/src/openai-compatible.ts`
- `packages/inference-adapter-glm-chat-answer-runtime/src/provider.ts`
- `apps/core-host/src/openai-compatible-chat-answer-composition.ts`
- `apps/core-host/src/openai-compatible-chat-answer-runtime-composition.ts`
- `apps/core-host/src/glm-chat-answer-runtime-composition.ts`
- `apps/desktop/src/secure-chat-answer-provider-store.ts`
- `tests/chat-answer-deepseek-one-window-api-acceptance.cjs`

### Qwen Fast Router

Qwen3-0.6B fast router alpha is implemented and frozen as developer-alpha
evidence.

Completed:

- pinned artifact plan for `Qwen/Qwen3-0.6B`;
- default-off `intent_router` adapter;
- compact JSON intent prompt/parser;
- thinking-block stripping and balanced JSON extraction;
- intent alias normalization;
- confidence calibration;
- local app vs browser disambiguation;
- Core Host generation-port adapter;
- runtime/cache acceptance evidence.

Not yet completed:

- not product default;
- not connected as the daily command router;
- not allowed to execute actions directly.

Key file:

- `docs/qwen3-0.6b-fast-router-alpha-closeout.md`

### Heavy Planner

Heavy Planner fixture/simulated fallback is implemented and frozen. It provides
bounded `BrainPlan` contracts and fallback hooks, but no real planner is
default-enabled.

Key file:

- `docs/stage-3-heavy-planner-fallback-closeout.md`

### Tool Execution

Tool Execution alpha is implemented as fixture-only contracts/governance and
diagnostic surface.

Completed:

- tool descriptors;
- bounded primitive invocation requests;
- allowlist and permission scope concepts;
- confirmation gates;
- sanitized audit/result envelopes;
- fixture-only Core Host adapter/session.

Not yet completed:

- no real Windows app execution;
- no shell/process/filesystem/network/browser tool execution;
- no model-driven tool invocation;
- no UI-exposed tool runner.

Key file:

- `docs/phase-14-5-tool-execution-alpha-closeout.md`

### Command Router Product Mode

Command Router product mode is now accepted for the text path and one narrow
real local-app allowlist.

Completed:

- default-off Command Router product mode in Settings;
- deterministic fixture router provider:
  `intent-router.deterministic.fixture`;
- Brain Dispatch safety projection for router provider, route status,
  confidence band, and direct action state;
- Tool Product Loop safety/result/lifecycle visibility;
- allowlisted local-app fixture dry-runs for `notepad`, `calculator`, and
  `calc`;
- explicit bottom confirmation prompt after allowlisted dry-runs;
- native confirmation dialog before real launch;
- visible Notepad and Calculator launches accepted in manual testing;
- `open vscode` routes as `localApp.open` but remains blocked with no launch;
- browser intent projection remains fixture-only and does not open browsers or
  URLs.

Important evidence:

- `docs/command-router-fixture-only-closeout-2026-08-09.md`
- `docs/command-router-real-local-app-allowlist-closeout-2026-08-09.md`
- `docs/command-router-real-local-app-allowlist-implementation-evidence-2026-08-09.md`
- `docs/command-router-real-local-app-allowlist-manual-acceptance-2026-08-09.md`

### Voice, ASR, and TTS

Voice wiring exists but is not yet the main accepted provider-backed Chat
Answer path.

Completed or partially completed:

- microphone capture state;
- ASR transcript event path;
- Xunfei/Volcengine-style voice adapter work;
- local browser `speechSynthesis` diagnostics;
- TTS playback debug;
- Doubao/Bailongma-style cloud TTS direction added;
- local TTS became audible during manual testing.

Known fragility:

- ASR provider configuration has failed before with
  `VOICE_PROVIDER_CONNECT_FAILED: ASR provider is not configured.`
- Adding TTS credentials should not automatically configure ASR. Treat ASR and
  TTS credentials as separate setup surfaces on the new machine.

Relevant files:

- `packages/voice/src/index.ts`
- `packages/voice/src/bailongma-style-asr-provider.ts`
- `packages/voice-adapter-xunfei/src/rtasr-connection.ts`
- `packages/voice-adapter-volcengine/`
- `apps/ui/src/voice/local-tts.ts`
- `apps/ui/src/hooks/use-ptt-capture.ts`
- `apps/ui/src/voice/ptt-capture-coordinator.ts`
- `apps/desktop/src/secure-voice-provider-store.ts`
- `apps/desktop/src/secure-tts-provider-store.ts`

### Memory

Memory Alpha exists with SQLite persistence, vector/retrieval planning, and
rollback-oriented evidence. It is not part of the latest controlled Chat Answer
runtime path and is not default-on.

Key file:

- `docs/phase-8-closeout-memory-alpha-product-decision.md`

## What Is Not Implemented Yet

Jarvis-K is not yet a full autonomous desktop agent.

Still missing or disabled:

- default voice-to-agent loop;
- Qwen router as the default live command router;
- real local app opening from normal user commands;
- real app UI automation;
- browser/search result UI with real retrieval;
- stock or quant connector;
- persistent production Memory retrieval in the main loop;
- real planner activation;
- real tool execution;
- installer/update/release packaging.

This is intentional. The project has been moving in controlled layers so that
each runtime or side-effect boundary is tested, bounded, and reversible.

## New Machine Setup

### 1. Install prerequisites

Install:

- Windows 10/11;
- Git;
- Node.js `>=22.12.0`;
- npm from the Node installation.

Optional for later local model work:

- Python runtime suitable for the Transformers helper;
- model artifacts and runtime caches only after a fresh exact-scope approval.

### 2. Transfer the workspace

Use either a committed branch or a full folder copy.

If using Git, commit and push before leaving the old machine:

```powershell
cd C:\Users\Administrator\Documents\Jarvis-k
git status --short
git switch -c codex/jarvis-k-transfer-2026-08-09
git add .
git commit -m "handoff: preserve Jarvis-K transfer state"
git push -u origin codex/jarvis-k-transfer-2026-08-09
```

If not committing, copy the full folder:

```text
C:\Users\Administrator\Documents\Jarvis-k
```

Do not rely on the old `handoff.md`; this file is the current machine-transfer
handoff.

### 3. Install dependencies

On the new machine:

```powershell
cd C:\Users\Administrator\Documents\Jarvis-k
npm.cmd install
```

### 4. Build

```powershell
npm.cmd run build
```

For a faster focused check of the latest Chat Answer work:

```powershell
npm.cmd run build:contracts
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
npx.cmd vitest run packages/contracts/test/protocol.test.ts packages/core/test/runtime.test.ts apps/desktop/test/supervisor.test.ts apps/desktop/test/chat-answer-product-mode-source.test.ts apps/core-host/test/provider-backed-chat-answer-manual-acceptance-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts
```

Latest known focused result before this handoff:

- `7` test files passed;
- `136` tests passed.

### 5. Configure DeepSeek Chat Answer credential

Credentials are machine-local and should be configured fresh. Do not copy the
credential file from the old machine.

Run:

```powershell
cd C:\Users\Administrator\Documents\Jarvis-k
npm.cmd run configure:chat-answer:deepseek-credential
```

The script exists in this current workspace. If you see:

```text
Missing script: configure:chat-answer:deepseek-credential
```

you are probably in the wrong folder or using an older copy of the repo.

Credential store path used by the current Electron app:

```text
%APPDATA%\Electron\jarvis-k-chat-answer-deepseek-provider.json
```

Do not print, paste, commit, or copy the credential contents.

### 6. Start Jarvis-K

```powershell
npm.cmd run start
```

If the app was not built yet:

```powershell
npm.cmd run dev
```

### 7. Verify the current product path

In Jarvis-K Settings:

1. enable the Chat Answer product-mode control;
2. use text input first, not voice;
3. test a benign input such as:

```text
Answer in one short sentence: what is Jarvis-K?
```

Expected category:

```text
bounded answered result from DeepSeek Chat Answer runtime
```

If the UI says:

```text
Chat answer generation is unavailable; deterministic fallback remains active.
```

check:

- you are running the latest transferred workspace;
- the build was rerun after transfer;
- the DeepSeek credential was configured on the new machine;
- the Settings Chat Answer control is enabled;
- the secure-store provider file exists under `%APPDATA%\Electron`;
- no old env gates are accidentally set from a previous session.

## Useful Commands

Build everything:

```powershell
npm.cmd run build
```

Run all verification:

```powershell
npm.cmd run verify
```

Start app after build:

```powershell
npm.cmd run start
```

Build and start:

```powershell
npm.cmd run dev
```

Configure DeepSeek Chat Answer credential:

```powershell
npm.cmd run configure:chat-answer:deepseek-credential
```

Run accepted DeepSeek Chat Answer API acceptance only after fresh approval:

```powershell
npm.cmd run acceptance:chat-answer:deepseek
```

Run DeepSeek health diagnostics only after fresh approval:

```powershell
npm.cmd run diagnostic:chat-answer:deepseek-health
npm.cmd run diagnostic:chat-answer:deepseek-shape
npm.cmd run diagnostic:chat-answer:deepseek-256-health
```

Check dependency boundaries:

```powershell
npm.cmd run check:boundaries
```

Check sensitive artifacts:

```powershell
npm.cmd run check:sensitive-artifacts
```

## Cleanup Commands Used Recently

These were used to clear old acceptance gates and temporary files. They are
safe references for manual cleanup, but do not run them blindly if you are in
the middle of a new acceptance window.

```powershell
Remove-Item Env:JARVIS_K_ENABLE_CHAT_ANSWER_DEEPSEEK -ErrorAction SilentlyContinue
Remove-Item Env:JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_PRODUCT_MANUAL_ACCEPTANCE -ErrorAction SilentlyContinue
Remove-Item Env:JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_EXPANDED_PRODUCT_LOOP -ErrorAction SilentlyContinue
Remove-Item Env:JARVIS_K_MEMORY_DB_PATH -ErrorAction SilentlyContinue
Remove-Item "$env:APPDATA\Electron\jarvis-k-chat-answer-deepseek-provider.json" -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\jarvis-k-deepseek-chat-answer-manual-acceptance-2026-08-09.sqlite" -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\jarvis-k-deepseek-chat-answer-expanded-product-loop-2026-08-09.sqlite" -ErrorAction SilentlyContinue
```

On the new machine, removing the DeepSeek provider file means you must run
`npm.cmd run configure:chat-answer:deepseek-credential` again.

## Do Not Do Without Fresh Approval

Do not do these under the old consumed windows:

- run real provider/API acceptance windows;
- enable DeepSeek Chat Answer as default behavior;
- enable GLM/OpenAI/Qwen provider expansion;
- activate Heavy Planner as a real planner;
- run or enable real tool execution;
- open local apps outside the accepted Command Router Notepad/Calculator
  explicit-confirmation allowlist;
- expand the local-app allowlist beyond Notepad and Calculator;
- execute shell, filesystem, browser, network, clipboard, screen, or process
  actions from Jarvis-K;
- run Qwen runtime/cache/materialization again;
- enable Memory vector retrieval in the product loop;
- run ASR/voice product acceptance;
- persist raw prompts, responses, reasoning, headers, transcripts, credentials,
  provider diagnostics, transport details, vectors, or Memory records as
  evidence;
- add telemetry, installer/update, packaging, or release-channel behavior.

## Evidence Index

Latest provider-backed Chat Answer:

- `docs/provider-backed-chat-answer-total-closeout.md`
- `docs/provider-backed-chat-answer-deepseek-runtime-closeout.md`
- `docs/provider-backed-chat-answer-core-host-selection-fallback-closeout.md`
- `docs/provider-backed-chat-answer-fixture-only-implementation-evidence.md`
- `docs/provider-backed-chat-answer-deepseek-product-manual-acceptance-evidence.md`
- `docs/provider-backed-chat-answer-deepseek-expanded-product-loop-final-replacement-accepted-evidence.md`
- `docs/provider-backed-chat-answer-settings-product-mode-fixture-only-implementation-evidence.md`
- `docs/provider-backed-chat-answer-controlled-runtime-binding-fixture-only-evidence.md`
- `docs/provider-backed-chat-answer-controlled-product-mode-ui-manual-acceptance-evidence.md`
- `docs/provider-backed-chat-answer-controlled-real-runtime-activation-evidence.md`

Chat Answer text-only fixture/manual acceptance:

- `docs/chat-answer-text-only-closeout.md`
- `docs/chat-answer-text-only-acceptance-mode-fixture-only-implementation-evidence.md`
- `docs/chat-answer-text-only-memory-disabled-startup-gate-implementation-evidence.md`
- `docs/chat-answer-text-only-deterministic-blocked-route-fixture-evidence.md`
- `docs/chat-answer-text-only-deterministic-blocked-manual-acceptance-evidence.md`

Qwen fast router:

- `docs/qwen3-0.6b-fast-router-alpha-closeout.md`
- `docs/qwen-fast-router-core-host-selection-fallback-closeout.md`
- `docs/qwen-lifecycle-backed-runtime-wiring-closeout.md`
- `docs/qwen-fast-router-product-binding-preparation-approval-request-2026-08-09.md`
- `docs/qwen-fast-router-product-binding-preparation-evidence-2026-08-09.md`
- `docs/qwen-fast-router-product-binding-preparation-closeout-2026-08-09.md`
- `docs/qwen-fast-router-product-binding-implementation-approval-request-2026-08-09.md`
- `docs/qwen-fast-router-product-binding-implementation-evidence-2026-08-09.md`

Heavy Planner:

- `docs/stage-3-heavy-planner-fallback-closeout.md`
- `docs/openai-compatible-heavy-planner-fixture-only-implementation.md`

Tool Execution:

- `docs/phase-14-5-tool-execution-alpha-closeout.md`

Command Router:

- `docs/command-router-fixture-only-closeout-2026-08-09.md`
- `docs/command-router-real-local-app-allowlist-closeout-2026-08-09.md`
- `docs/command-router-real-local-app-allowlist-approval-request-2026-08-09.md`
- `docs/command-router-real-local-app-allowlist-implementation-evidence-2026-08-09.md`
- `docs/command-router-real-local-app-allowlist-manual-acceptance-2026-08-09.md`

Observability and Memory:

- `docs/phase-13-6-observability-alpha-closeout.md`
- `docs/phase-8-closeout-memory-alpha-product-decision.md`

Voice and TTS:

- `docs/voice-mic-asr-local-tts-manual-acceptance-approval-request.md`
- `docs/command-router-voice-manual-acceptance-approval-request-2026-08-09.md`
- `docs/command-router-voice-manual-acceptance-evidence-2026-08-09.md`
- `docs/command-router-voice-manual-acceptance-closeout-2026-08-09.md`
- `docs/local-tts-speechsynthesis-diagnostic-approval-request.md`

Architecture:

- `docs/architecture.md`

## Current Roadmap

The next product route should return to the original Jarvis-K agent loop while
keeping the same controlled pattern that finally worked for Chat Answer.

### Step 1: Controlled Router Product Binding

Goal:

```text
text command
  -> Qwen fast-router fixture/default-off binding
  -> safe intent projection
  -> deterministic fallback
  -> no direct action
```

Purpose:

- make Jarvis-K classify user commands reliably;
- keep execution disabled;
- prove the UI can show routed intent and safety status.

Status:

- completed and accepted for deterministic fixture routing;
- see `docs/command-router-fixture-only-closeout-2026-08-09.md`.

### Step 2: Local App Open Fixture Loop

Goal:

```text
localApp.open intent
  -> allowlist check
  -> fixture-only execution result
  -> UI/TTS response
```

Purpose:

- prepare for opening software without touching real Windows processes yet.

Status:

- completed and accepted for Notepad/Calculator fixture dry-runs and VS Code
  blocked behavior.

### Step 3: One Real Local App Allowlist Window

Goal:

```text
fixed benign app request
  -> allowlist
  -> one approved local app open
  -> no arbitrary automation
```

Suggested first real capability:

- open Notepad or Calculator only;
- one fixed command;
- one process launch;
- immediate evidence and cleanup.

Status:

- completed and manually accepted for Notepad and Calculator;
- VS Code remained blocked;
- see `docs/command-router-real-local-app-allowlist-closeout-2026-08-09.md`.

### Step 4: Browser/Search Result Product Loop

Goal:

```text
search/browser intent
  -> provider or browser/search adapter
  -> sanitized result card in UI
  -> no arbitrary browsing action
```

This moves toward the "show me search results inside Jarvis-K" part of the
original vision.

### Step 5: Stock/Quant Connector Fixture

Goal:

```text
stock/quant command
  -> connector intent
  -> fixture connector result
  -> UI summary/TTS
```

No brokerage, trading, live account, or side-effect action should be connected
until the fixture connector is stable and separately approved.

### Step 6: Voice Command Router Acceptance

Goal:

```text
microphone
  -> ASR transcript
  -> existing BrainCommand / Command Router path
  -> safe product route
  -> explicit confirmation for Notepad/Calculator only
  -> result
  -> TTS
```

This should happen before any allowlist expansion or real Qwen product-router
work. Keep the router deterministic/fixture-only for this acceptance window and
verify that voice reaches the same safety gates as text.

Status:

- completed and accepted after retry;
- see `docs/command-router-voice-manual-acceptance-closeout-2026-08-09.md`.

## Suggested Next Exact Work Item

Recommended next work item:

```text
Qwen runtime dependency preparation/readiness approval window
```

Scope:

- Qwen fast router product binding implementation is complete as default-off
  no-runtime status/settings/gate projection;
- preserve `docs/qwen-fast-router-product-binding-implementation-closeout-2026-08-09.md`
  as the implementation baseline;
- the bounded artifact/runtime readiness approval/evidence window is closed as
  blocked during runtime dependency preflight:
  `docs/qwen-artifact-runtime-readiness-approval-request-2026-08-10.md`
  and `docs/qwen-artifact-runtime-readiness-evidence-2026-08-10.md`;
- preserve
  `docs/qwen-artifact-runtime-readiness-closeout-2026-08-10.md`;
- no artifact materialization, helper startup, generation-port invocation, or
  routing probe occurred;
- a separate bounded runtime dependency preparation/readiness window is closed
  as blocked:
  `docs/qwen-runtime-dependency-readiness-approval-request-2026-08-10.md`
  and `docs/qwen-runtime-dependency-readiness-evidence-2026-08-10.md`;
- preserve
  `docs/qwen-runtime-dependency-readiness-closeout-2026-08-10.md`;
- current Python is present but missing `torch`, `transformers`, and
  `safetensors`;
- temporary venv/pip preparation was blocked by the execution environment before
  setup;
- provide or approve a compatible Python runtime path, or run from an
  environment that permits temporary venv creation and pinned pip install,
  before another Qwen artifact/runtime readiness attempt;
- a compatible Python runtime provisioning/readiness approval window passed with
  a temporary venv, then cleanup removed the venv:
  `docs/qwen-compatible-python-runtime-provisioning-approval-request-2026-08-10.md`
  and
  `docs/qwen-compatible-python-runtime-provisioning-evidence-2026-08-10.md`;
- preserve
  `docs/qwen-compatible-python-runtime-provisioning-closeout-2026-08-10.md`;
- dependency feasibility is proven but no Python executable was retained for
  the next window;
- before another Qwen artifact/runtime readiness attempt, open a fresh bounded
  approval that recreates the temporary dependency setup, uses a provided
  prepared Python executable, or explicitly allows retaining a temporary venv;
- a fresh Qwen artifact/runtime readiness rerun passed as developer-alpha
  evidence only:
  `docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-approval-request-2026-08-10.md`
  and
  `docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-evidence-2026-08-10.md`;
- preserve
  `docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-closeout-2026-08-10.md`;
- the rerun used a temporary dependency setup, fixed seven-artifact digest
  verification, one helper, and one generation-port readiness probe;
- cleanup passed and no dependency env or artifact cache was retained;
- Qwen still is not approved as an active product route source;
- a Qwen product-routing activation policy window is complete as policy-only
  evidence:
  `docs/qwen-product-routing-activation-policy-approval-request-2026-08-10.md`
  and `docs/qwen-product-routing-activation-policy-evidence-2026-08-10.md`;
- preserve
  `docs/qwen-product-routing-activation-policy-packet-2026-08-10.md` and
  `docs/qwen-product-routing-activation-policy-closeout-2026-08-10.md`;
- Qwen product-routing activation implementation is complete as no-runtime
  status/gate/state/rollback plumbing only:
  `docs/qwen-product-routing-activation-implementation-approval-request-2026-08-10.md`
  and
  `docs/qwen-product-routing-activation-implementation-evidence-2026-08-10.md`;
- preserve
  `docs/qwen-product-routing-activation-implementation-closeout-2026-08-10.md`;
- this implementation remains no-runtime/no-routing by default and only prepares
  sanitized activation status/gate/rollback projection;
- Qwen runtime-retention/manual-acceptance passed and cleaned up:
  `docs/qwen-runtime-retention-manual-acceptance-approval-request-2026-08-10.md`
  `docs/qwen-runtime-retention-manual-acceptance-evidence-2026-08-10.md`, and
  `docs/qwen-runtime-retention-manual-acceptance-closeout-2026-08-10.md`;
- Qwen still is not persistent active product routing; no dependency env or
  artifact cache was retained;
- Qwen product-route arming passed and cleaned up as developer-alpha evidence:
  `docs/qwen-product-route-arming-approval-request-2026-08-10.md`
  `docs/qwen-product-route-arming-evidence-2026-08-10.md`, and
  `docs/qwen-product-route-arming-closeout-2026-08-10.md`;
- Qwen still is not persistent active product routing; no dependency env or
  artifact cache was retained;
- Persistent Qwen product-route enablement preparation passed and cleaned up as
  developer-alpha evidence:
  `docs/qwen-persistent-product-route-enablement-approval-request-2026-08-10.md`
  `docs/qwen-persistent-product-route-enablement-evidence-2026-08-10.md`, and
  `docs/qwen-persistent-product-route-enablement-closeout-2026-08-10.md`;
- Qwen is still not default-on and has no release/production-facing exposure;
- local developer-alpha Qwen usage was approved, executed, then stopped
  degraded with cleanup:
  `docs/qwen-local-developer-alpha-usage-approval-request-2026-08-10.md`
  `docs/qwen-local-developer-alpha-usage-evidence-2026-08-10.md`, and
  `docs/qwen-local-developer-alpha-usage-closeout-2026-08-10.md`;
- the bounded Qwen usage session passed with three sanitized route requests, but
  Command Router browser-block verification detected a browser process and
  triggered the stop condition;
- cleanup passed, and Qwen is still not default-on or persistent active product
  routing;
- a persistent Qwen product-route enablement execution window passed, rolled
  back, and cleaned up as developer-alpha evidence:
  `docs/qwen-persistent-product-route-enablement-execution-approval-request-2026-08-10.md`
  `docs/qwen-persistent-product-route-enablement-execution-evidence-2026-08-10.md`,
  and
  `docs/qwen-persistent-product-route-enablement-execution-closeout-2026-08-10.md`;
- the execution verified active route projection after explicit opt-in and all
  gates, then rollback to deterministic fixture; cleanup passed with no
  retained dependency env, artifact cache, or helper;
- a retained local Qwen product-session window passed as developer-alpha
  evidence:
  `docs/qwen-retained-local-product-session-approval-request-2026-08-10.md`
  `docs/qwen-retained-local-product-session-evidence-2026-08-10.md`, and
  `docs/qwen-retained-local-product-session-closeout-2026-08-10.md`;
- one bounded dependency environment and approved seven-file artifact cache were
  retained for local developer-alpha use; helper was shut down after
  verification;
- a Qwen UI/IPC runtime control window passed as prepared developer-alpha
  evidence only:
  `docs/qwen-ui-ipc-runtime-control-approval-request-2026-08-10.md`
  `docs/qwen-ui-ipc-runtime-control-evidence-2026-08-10.md`, and
  `docs/qwen-ui-ipc-runtime-control-closeout-2026-08-10.md`;
- the UI/IPC surface projects sanitized retained-session, helper lifecycle,
  route, start, stop, and rollback state only; start enters prepared state and
  does not start a helper or invoke generation;
- a Qwen UI/IPC retained-helper route acceptance window passed as
  developer-alpha evidence only:
  `docs/qwen-ui-ipc-retained-helper-route-acceptance-approval-request-2026-08-10.md`
  `docs/qwen-ui-ipc-retained-helper-route-acceptance-evidence-2026-08-10.md`,
  and
  `docs/qwen-ui-ipc-retained-helper-route-acceptance-closeout-2026-08-10.md`;
- the window used the retained dependency env and approved seven-file artifact
  cache, verified digest-before-load, started one supervised helper, performed
  one generation-port readiness probe, ran three sanitized route requests
  through Core fallback and Command Router safety gates, then verified stop and
  rollback state;
- the Qwen persistent local opt-in product route session window passed as
  developer-alpha evidence only:
  `docs/qwen-persistent-local-opt-in-product-route-session-approval-request-2026-08-10.md`
  `docs/qwen-persistent-local-opt-in-product-route-session-evidence-2026-08-10.md`,
  and
  `docs/qwen-persistent-local-opt-in-product-route-session-closeout-2026-08-10.md`;
- it used the retained dependency env and approved seven-file artifact cache,
  verified digest-before-load, started one supervised helper, performed one
  generation-port readiness probe, ran three sanitized route requests, then
  verified stop/rollback to deterministic fixture;
- browser/URL opening and VS Code remained blocked; Qwen is still not
  default-on, not persistent product routing outside the bounded session, and
  has no release/production-facing exposure;
- the Qwen conversation-surface local opt-in route acceptance implementation
  passed on rerun but closed degraded:
  `docs/qwen-conversation-surface-local-opt-in-route-acceptance-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-local-opt-in-route-acceptance-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-local-opt-in-route-acceptance-closeout-2026-08-10.md`;
- degradation: the first Electron attempt consumed three main-conversation Qwen
  routes before a strict-mode test assertion failed while reading the route
  count, so this is not clean single-sequence acceptance evidence;
- passing rerun verified Qwen selected for three main-conversation routes,
  direct action stayed disabled, browser/URL and VS Code remained blocked, and
  stop/rollback returned to deterministic fixture;
- open a fresh bounded clean-rerun approval before advancing conversation-
  surface Qwen routing;
- the Qwen conversation-surface clean rerun window passed:
  `docs/qwen-conversation-surface-clean-rerun-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-clean-rerun-evidence-2026-08-10.md`, and
  `docs/qwen-conversation-surface-clean-rerun-closeout-2026-08-10.md`;
- it executed one clean single sequence with one helper, one generation-port
  readiness probe, exactly three sanitized main-conversation Qwen routes,
  direct action disabled, browser/URL and VS Code blocked, verified
  stop/rollback, and no observed helper process after cleanup;
- Qwen is still not default-on, not persistent product routing outside bounded
  local sessions, and has no release/production-facing exposure;
- the Qwen conversation-surface bounded local usage window closed degraded:
  `docs/qwen-conversation-surface-bounded-local-usage-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-bounded-local-usage-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-bounded-local-usage-closeout-2026-08-10.md`;
- it started one helper and one readiness probe, then attempted four sanitized
  main-conversation routes before the fourth route timed out waiting for the
  expected `observability.status` intent; no fifth route or rerun was attempted;
- post-run cleanup observed no helper process; Qwen is still not default-on,
  not persistent product routing outside bounded local sessions, and has no
  release/production-facing exposure;
- the bounded diagnostic/remediation approval window passed as developer-alpha
  evidence only:
  `docs/qwen-conversation-surface-bounded-local-usage-diagnostic-remediation-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-bounded-local-usage-diagnostic-remediation-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-bounded-local-usage-diagnostic-remediation-closeout-2026-08-10.md`;
- the remediation classified the fourth-route timeout as a smoke-harness
  latest-result wait ambiguity, added a sanitized Brain summary selector, and
  anchored bounded usage route assertions to both expected intent and expected
  summary; no helper, generation-port, runtime route request, or bounded usage
  retry was executed in this window;
- the fresh bounded local usage rerun closed degraded:
  `docs/qwen-conversation-surface-bounded-local-usage-rerun-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-bounded-local-usage-rerun-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-bounded-local-usage-rerun-closeout-2026-08-10.md`;
- it started one helper, performed one readiness probe, and sent exactly five
  sanitized main-conversation route requests; the first four latest-result
  assertions completed, but the fifth request expected `model.status` and timed
  out before that expected result was confirmed; no second rerun was attempted,
  and post-run cleanup observed no helper process;
- open a fresh bounded diagnostic/remediation approval before changing route
  calibration, route assertions, or rerunning bounded local usage again;
- the fifth-route `model.status` diagnostic/remediation window passed as
  developer-alpha evidence only:
  `docs/qwen-conversation-surface-model-status-diagnostic-remediation-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-model-status-diagnostic-remediation-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-model-status-diagnostic-remediation-closeout-2026-08-10.md`;
- the remediation classified the fifth-route timeout as a Qwen deterministic
  calibration specificity issue and added `model.status`-specific calibration
  before generic `observability.status`; no helper, generation-port, runtime
  route request, or bounded usage retry was executed in this window;
- open a fresh bounded local usage rerun approval before sending main
  conversation route requests again;
- the fresh bounded local usage second rerun passed as developer-alpha evidence
  only:
  `docs/qwen-conversation-surface-bounded-local-usage-second-rerun-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-bounded-local-usage-second-rerun-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-bounded-local-usage-second-rerun-closeout-2026-08-10.md`;
- it started one helper, performed one readiness probe, completed exactly five
  sanitized main-conversation route requests, confirmed the fifth-route
  `model.status` calibration, verified direct action disabled, verified
  Browser/URL and VS Code blocked, stopped/rolled back, and post-run cleanup
  observed no helper process; no second attempt was made;
- the Qwen conversation-surface product readiness consolidation window passed as
  developer-alpha evidence only:
  `docs/qwen-conversation-surface-product-readiness-consolidation-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-product-readiness-consolidation-evidence-2026-08-10.md`,
  `docs/qwen-conversation-surface-product-readiness-consolidation-packet-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-product-readiness-consolidation-closeout-2026-08-10.md`;
- it prepared a sanitized readiness packet and next-gate policy only; no helper,
  generation-port, runtime route request, bounded usage rerun, or product route
  enablement execution was performed; Qwen still is not default-on or persistent
  product routing and has no release/production-facing exposure;
- recommended next gate: open a fresh bounded approval for a default-off opt-in
  product-route enablement policy refresh, or choose an extended bounded local
  usage confidence window if more route-count evidence is needed;
- the Qwen conversation-surface product-route policy refresh passed as
  developer-alpha evidence only:
  `docs/qwen-conversation-surface-product-route-policy-refresh-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-product-route-policy-refresh-evidence-2026-08-10.md`,
  `docs/qwen-conversation-surface-product-route-policy-refresh-packet-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-product-route-policy-refresh-closeout-2026-08-10.md`;
- it refreshed default-off explicit opt-in policy gates, UI/IPC status
  projection states, acceptance criteria, rollback criteria, stop criteria, and
  future sanitized evidence requirements; no implementation change, helper,
  generation-port, runtime route request, bounded usage rerun, or product route
  enablement execution was performed;
- the Qwen conversation-surface product-route implementation preparation window
  passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-product-route-implementation-prep-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-product-route-implementation-prep-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-product-route-implementation-prep-closeout-2026-08-10.md`;
- it prepared default-off conversation-surface product-route status/gate/
  rollback plumbing and sanitized UI/status projection only; Qwen remains not
  route-selectable, product route execution remains disabled, deterministic
  fixture remains active/fallback/rollback, and Notepad/Calculator remain the
  only local-app allowlist targets;
- verification passed: focused source/unit tests, `build:contracts`,
  `build:desktop`, `build:ui`, and final helper cleanup check
  `NO_HELPER_PROCESS_OBSERVED`;
- the bounded Qwen conversation-surface product-route acceptance / enablement
  execution window passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-product-route-acceptance-enablement-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-product-route-acceptance-enablement-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-product-route-acceptance-enablement-closeout-2026-08-10.md`;
- it executed exactly one bounded developer-alpha local explicit opt-in
  acceptance / enablement sequence: retained dependency env/cache, 7 approved
  artifacts with digest-before-load, one supervised helper, one generation-port
  readiness probe, three sanitized main-conversation routes, Qwen selected only
  inside the bounded session, direct action disabled for every route,
  Browser/URL and VS Code blocked, stop/rollback verified, and final
  `NO_HELPER_PROCESS_OBSERVED`;
- next gate: open a fresh bounded approval before any default-on behavior,
  persistent product routing outside a bounded window, broader route count,
  allowlist expansion, telemetry/release exposure, or production-facing Qwen
  routing claim;
- the Qwen conversation-surface persistent opt-in readiness / limited
  product-session window passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-persistent-opt-in-readiness-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-persistent-opt-in-readiness-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-persistent-opt-in-readiness-closeout-2026-08-10.md`;
- it executed exactly one bounded developer-alpha local explicit opt-in limited
  product-session sequence: retained dependency env/cache, 7 approved artifacts
  with digest-before-load, one supervised helper, one generation-port readiness
  probe, three sanitized main-conversation routes, Qwen selected only inside the
  bounded limited session, direct action disabled for every route, Browser/URL
  and VS Code blocked, stop/rollback verified, and final
  `NO_HELPER_PROCESS_OBSERVED`;
- next gate: open a fresh bounded approval before any default-on behavior,
  persistent product routing outside a bounded limited session, broader route
  count, allowlist expansion, telemetry/release exposure, or production-facing
  Qwen routing claim;
- the Qwen conversation-surface persistent opt-in policy/state implementation
  window passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-implementation-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-implementation-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-implementation-closeout-2026-08-10.md`;
- it added default-off persistent opt-in policy/state projection under the
  conversation-surface product-route status, plus sanitized read-only UI status
  fields; Qwen route selectable remains false by default, product route
  execution remains disabled by default, helper startup and generation-port are
  not allowed by policy/state, deterministic fixture remains
  default/fallback/rollback, and final helper cleanup check was
  `NO_HELPER_PROCESS_OBSERVED`;
- next gate: open a fresh bounded approval before any helper startup,
  generation-port invocation, runtime route request, product-route execution,
  default-on behavior, persistent product routing outside bounded windows,
  broader route count, allowlist expansion, telemetry/release exposure, or
  production-facing Qwen routing claim;
- the Qwen conversation-surface product-route developer-alpha release-readiness
  packet window passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-product-route-developer-alpha-release-readiness-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-product-route-developer-alpha-release-readiness-evidence-2026-08-10.md`,
  `docs/qwen-conversation-surface-product-route-developer-alpha-release-readiness-packet-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-product-route-developer-alpha-release-readiness-closeout-2026-08-10.md`;
- it prepared a sanitized developer-alpha packet with readiness state,
  accepted/degraded/blocked evidence summary, default-off/persistent-opt-in gate
  summary, future acceptance criteria, rollback criteria, stop criteria, and
  required sanitized evidence fields; it made no code changes, started no
  helper, invoked no generation-port, sent no route request, and final helper
  cleanup check was `NO_HELPER_PROCESS_OBSERVED`;
- next gate: open a fresh bounded approval before any release-facing
  discussion, helper startup, generation-port invocation, runtime route request,
  product-route execution, route-count expansion, allowlist expansion,
  default-on behavior, persistent routing outside bounded windows,
  telemetry/release exposure, or production-facing Qwen routing claim;
- the Qwen conversation-surface developer-alpha next-gate decision /
  release-readiness review window passed as docs-only evidence:
  `docs/qwen-conversation-surface-next-gate-decision-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-next-gate-decision-evidence-2026-08-10.md`,
  `docs/qwen-conversation-surface-next-gate-decision-packet-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-next-gate-decision-closeout-2026-08-10.md`;
- it selected the recommended next gate as a fresh bounded "Qwen
  conversation-surface extended bounded local usage confidence window" with at
  most 10 sanitized main-conversation route requests, still developer-alpha
  local explicit opt-in only; it made no code changes, started no helper,
  invoked no generation-port, sent no route request, executed no product route,
  expanded no runtime route count, expanded no allowlist, enabled no default-on
  behavior, exposed no release channel, made no production-facing claim, and
  final helper cleanup check was `NO_HELPER_PROCESS_OBSERVED`;
- next gate: open a fresh bounded Product/Security/Release approval before the
  extended bounded local usage confidence window, any UI/IPC hardening, any
  internal developer-alpha release note, helper startup, generation-port
  invocation, runtime route request, product-route execution, route-count
  expansion, allowlist expansion, default-on behavior, persistent routing
  outside bounded windows, telemetry/release exposure, or production-facing Qwen
  routing claim;
- the Qwen conversation-surface extended bounded local usage confidence window
  closed degraded after one approved runtime attempt:
  `docs/qwen-conversation-surface-extended-bounded-local-usage-confidence-approval-request-2026-08-10.md`;
- use
  `docs/qwen-conversation-surface-extended-bounded-local-usage-confidence-evidence-2026-08-10.md`
  and
  `docs/qwen-conversation-surface-extended-bounded-local-usage-confidence-closeout-2026-08-10.md`;
- it added a developer-alpha-only extended route-limit gate
  `JARVIS_K_QWEN_CONVERSATION_SURFACE_EXTENDED_USAGE`; default persistent
  opt-in policy route limit remains 3 and existing bounded usage remains 5;
  focused tests and builds passed; pre-run helper cleanup was
  `NO_HELPER_PROCESS_OBSERVED`; the runtime attempt selected retained env/cache,
  verified seven artifacts digest-before-load, started one helper, performed one
  generation-port readiness probe, then degraded on a latest rendered
  intent/summary assertion timeout during the main-conversation route sequence;
  the smoke did not emit a sanitized per-route progress counter, so exact
  completed route count is not inferred; no same-window rerun was attempted, and
  post-run helper cleanup was `NO_HELPER_PROCESS_OBSERVED`;
- next gate: open a fresh bounded diagnostic/remediation approval before
  changing the extended smoke harness, adding sanitized per-route progress
  evidence, reviewing latest-result selectors/assertions, or rerunning extended
  bounded local usage;
- a draft diagnostic/remediation approval request is open:
  `docs/qwen-conversation-surface-extended-bounded-local-usage-diagnostic-remediation-approval-request-2026-08-10.md`;
- status is `DRAFT_PENDING_PRODUCT_SECURITY_RELEASE_APPROVAL`; it does not
  approve helper startup, generation-port invocation, runtime route requests,
  extended bounded usage rerun, product-route execution, default-on behavior,
  allowlist expansion, telemetry/release exposure, or production-facing claims;
  next gate is exact Product/Security/Release approval text before source/test
  diagnostics or narrowly scoped smoke-harness remediation;
- the Qwen conversation-surface persistent opt-in policy/state source audit /
  hardening window passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-hardening-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-hardening-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-hardening-closeout-2026-08-10.md`;
- it verified the default-off persistent opt-in policy/state projection and
  added negative schema tests rejecting unsafe `localDeveloperOptInEnabled`,
  `helperStartupAllowedByPolicyState`, and widened `routeRequestLimit` values;
  no helper, generation-port, runtime route request, product-route execution, or
  release behavior was introduced, and final helper cleanup check was
  `NO_HELPER_PROCESS_OBSERVED`;
- next gate: open a fresh bounded approval before any helper startup,
  generation-port invocation, runtime route request, product-route execution,
  default-on behavior, persistent product routing outside bounded windows,
  broader route count, allowlist expansion, telemetry/release exposure, or
  production-facing Qwen routing claim;
- a separate Command Router browser-block remediation verification window passed
  as verification-only evidence:
  `docs/command-router-browser-block-remediation-verification-approval-request-2026-08-10.md`
  `docs/command-router-browser-block-remediation-verification-evidence-2026-08-10.md`,
  and
  `docs/command-router-browser-block-remediation-verification-closeout-2026-08-10.md`;
- no code remediation was needed; browser-only rerun passed with no new browser
  process IDs, and the full Command Router fixture suite passed all four smoke
  paths;
- a local developer-alpha Qwen usage rerun passed and cleaned up:
  `docs/qwen-local-developer-alpha-usage-rerun-approval-request-2026-08-10.md`
  `docs/qwen-local-developer-alpha-usage-rerun-evidence-2026-08-10.md`, and
  `docs/qwen-local-developer-alpha-usage-rerun-closeout-2026-08-10.md`;
- the rerun used one temporary pinned dependency environment, the approved
  seven-artifact set, digest-before-load, one helper, one generation-port path,
  three sanitized route requests, browser-only verification, and the full
  Command Router fixture suite;
- cleanup passed, and Qwen is still not default-on or persistent active product
  routing;
- keep product routing activation separate from this readiness window;
- use `docs/qwen-fast-router-product-binding-implementation-approval-request-2026-08-09.md`
  and `docs/qwen-fast-router-product-binding-implementation-evidence-2026-08-09.md`
  only as completed evidence, not as runtime approval;
- use `docs/qwen-fast-router-product-binding-preparation-approval-request-2026-08-09.md`
  and `docs/qwen-fast-router-product-binding-preparation-evidence-2026-08-09.md`;
- preserve `docs/qwen-fast-router-product-binding-preparation-closeout-2026-08-09.md`
  as the no-runtime preparation baseline;
- require artifact digest approval, model lifecycle readiness, and a concrete
  generation port readiness check before any real Qwen route is used;
- keep deterministic fixture fallback for unavailable, invalid, or low
  confidence Qwen outputs;
- route only to sanitized intent candidates and bounded slots;
- continue sending every action through the accepted Command Router safety gates;
- no direct Qwen execution authority;
- no allowlist expansion;
- no browser/URL opening;
- no Memory vector retrieval;
- no shell/filesystem/clipboard/process enumeration beyond bounded launch
  verification;
- no provider planner.

Why this is the right next step:

- preparation and product binding implementation are complete and no-runtime
  gates are verified;
- real runtime/cache/helper/materialization must stay a separate later window;
- deterministic fallback must keep the current accepted product behavior stable.

## Quick Resume Prompt For The New Computer

Paste this into the next Codex/Jarvis-K coding session:

```text
We moved Jarvis-K to a new computer. Read docs/jarvis-k-machine-transfer-handoff-2026-08-09.md first. Continue from the accepted Command Router text and voice paths plus the real local-app allowlist closeout. The only accepted desktop side effect is Notepad/Calculator launch after deterministic fixture routing, explicit UI confirmation, and native confirmation. Qwen fast router product binding implementation is complete as default-off no-runtime status/settings/gate projection only; Qwen remains unavailable for product routing. The Qwen artifact/runtime readiness rerun passed as developer-alpha evidence only; see docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-closeout-2026-08-10.md. Qwen product-routing activation policy is prepared as documentation only; see docs/qwen-product-routing-activation-policy-closeout-2026-08-10.md. Qwen product-routing activation implementation is complete as no-runtime status/gate/state/rollback plumbing only; see docs/qwen-product-routing-activation-implementation-closeout-2026-08-10.md. Qwen runtime-retention/manual-acceptance passed and cleaned up; see docs/qwen-runtime-retention-manual-acceptance-closeout-2026-08-10.md. Qwen product-route arming passed and cleaned up; see docs/qwen-product-route-arming-closeout-2026-08-10.md. Persistent Qwen product-route enablement preparation passed and cleaned up; see docs/qwen-persistent-product-route-enablement-closeout-2026-08-10.md. Local developer-alpha Qwen usage was approved and the bounded Qwen usage session passed, but the window stopped degraded because Command Router browser-block verification detected a browser process; see docs/qwen-local-developer-alpha-usage-closeout-2026-08-10.md. A separate Command Router browser-block remediation verification window passed as verification-only evidence; see docs/command-router-browser-block-remediation-verification-closeout-2026-08-10.md. A local developer-alpha Qwen usage rerun passed and cleaned up; see docs/qwen-local-developer-alpha-usage-rerun-closeout-2026-08-10.md. A persistent Qwen product-route enablement execution window passed, rolled back, and cleaned up; see docs/qwen-persistent-product-route-enablement-execution-closeout-2026-08-10.md. A retained local Qwen product-session window passed as developer-alpha evidence; see docs/qwen-retained-local-product-session-closeout-2026-08-10.md. A Qwen UI/IPC runtime control window passed as prepared developer-alpha evidence only; see docs/qwen-ui-ipc-runtime-control-closeout-2026-08-10.md. A fresh Qwen conversation-surface clean rerun passed; see docs/qwen-conversation-surface-clean-rerun-closeout-2026-08-10.md. Qwen conversation-surface bounded local usage closed degraded; see docs/qwen-conversation-surface-bounded-local-usage-closeout-2026-08-10.md. It started one helper and one readiness probe, then attempted four sanitized main-conversation routes before the fourth route timed out waiting for expected observability.status; no fifth route or rerun was attempted, and no helper process was observed after cleanup. A bounded diagnostic/remediation window passed as developer-alpha evidence only; see docs/qwen-conversation-surface-bounded-local-usage-diagnostic-remediation-closeout-2026-08-10.md. It classified the fourth-route timeout as a smoke-harness latest-result wait ambiguity and anchored bounded usage route assertions to both expected intent and sanitized summary; no helper, generation-port, runtime route request, or bounded usage retry was executed. The fresh bounded local usage rerun closed degraded; see docs/qwen-conversation-surface-bounded-local-usage-rerun-closeout-2026-08-10.md. It sent exactly five sanitized main-conversation route requests, completed the first four latest-result assertions, then timed out on the fifth request expecting model.status; no second rerun was attempted and post-run cleanup observed no helper process. A fifth-route model.status diagnostic/remediation window passed as developer-alpha evidence only; see docs/qwen-conversation-surface-model-status-diagnostic-remediation-closeout-2026-08-10.md. It added model.status-specific Qwen deterministic calibration before generic observability.status; no helper, generation-port, runtime route request, or bounded usage retry was executed. The fresh bounded local usage second rerun passed as developer-alpha evidence only; see docs/qwen-conversation-surface-bounded-local-usage-second-rerun-closeout-2026-08-10.md. It completed exactly five sanitized main-conversation routes, confirmed fifth-route model.status, verified direct action disabled, Browser/URL blocked, VS Code blocked, stop/rollback, and post-run helper cleanup; no second attempt was made. Qwen conversation-surface product-route policy refresh and implementation preparation passed as developer-alpha evidence only; see docs/qwen-conversation-surface-product-route-policy-refresh-closeout-2026-08-10.md and docs/qwen-conversation-surface-product-route-implementation-prep-closeout-2026-08-10.md. Product-route implementation preparation added default-off status/gate/rollback projection and sanitized UI/status projection only. Qwen conversation-surface product-route acceptance / enablement passed as developer-alpha evidence only; see docs/qwen-conversation-surface-product-route-acceptance-enablement-closeout-2026-08-10.md. It ran exactly one bounded local explicit opt-in sequence with retained env/cache, seven approved artifacts, digest-before-load, one helper, one readiness probe, three sanitized main-conversation routes, Qwen selected only inside the bounded session, direct action disabled, Browser/URL and VS Code blocked, stop/rollback verified, and final NO_HELPER_PROCESS_OBSERVED. Qwen conversation-surface persistent opt-in readiness / limited product-session passed as developer-alpha evidence only; see docs/qwen-conversation-surface-persistent-opt-in-readiness-closeout-2026-08-10.md. It ran exactly one bounded local explicit opt-in limited product-session sequence with retained env/cache, seven approved artifacts, digest-before-load, one helper, one readiness probe, three sanitized main-conversation routes, Qwen selected only inside the bounded limited session, direct action disabled, Browser/URL and VS Code blocked, stop/rollback verified, and final NO_HELPER_PROCESS_OBSERVED. Qwen conversation-surface persistent opt-in policy/state implementation passed as developer-alpha evidence only; see docs/qwen-conversation-surface-persistent-opt-in-policy-state-implementation-closeout-2026-08-10.md. It added default-off persistent opt-in policy/state projection and sanitized UI status fields only; Qwen route selectable remains false by default, product route execution disabled by default, helper startup and generation-port not allowed by policy/state, deterministic fixture remains default/fallback/rollback, and final NO_HELPER_PROCESS_OBSERVED. Qwen conversation-surface persistent opt-in policy/state hardening passed as developer-alpha evidence only; see docs/qwen-conversation-surface-persistent-opt-in-policy-state-hardening-closeout-2026-08-10.md. It added negative schema tests rejecting unsafe persistentOptIn opt-in, helper-start, and route-limit widening variants; no helper, generation-port, runtime route request, product-route execution, or release behavior was introduced, and final NO_HELPER_PROCESS_OBSERVED. Qwen conversation-surface product-route developer-alpha release-readiness packet passed as evidence only; see docs/qwen-conversation-surface-product-route-developer-alpha-release-readiness-closeout-2026-08-10.md and docs/qwen-conversation-surface-product-route-developer-alpha-release-readiness-packet-2026-08-10.md. It consolidated readiness state, accepted/degraded/blocked evidence, default-off/persistent-opt-in gates, future acceptance/rollback/stop criteria, and sanitized evidence fields; no code changed, no helper started, no generation-port or route ran, and final NO_HELPER_PROCESS_OBSERVED. Qwen still is not default-on, not persistent product routing outside bounded local sessions, and has no release/production-facing exposure. Do not expand allowlists or run real provider/API/Qwen/tool windows without fresh bounded approval.
```
