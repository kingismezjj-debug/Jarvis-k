# Stage 5 Product Alpha Hardening Approval Request

Recorded: 2026-08-08

## Status

`APPROVED_IMPLEMENTED_VERIFIED_DEVELOPER_ALPHA`

Stage 5 turns the existing fixture/replay product spine into a more useful
developer-alpha manual-test experience. It must preserve the current
fail-closed action boundary: this is reliability and product-loop work, not a
new cloud provider, model runtime, or real tool-execution release.

The exact Product, Security, and Release approvals were recorded on
2026-08-08 before implementation.

## Exact Approval Text

```text
Product: APPROVE exactly this Stage 5 Product Alpha Hardening developer-alpha implementation scope with opt-in one-session structured history, bounded read-only Memory context, retry and rollback affordances that preserve existing safety gates, and opt-in local TTS playback only after an already-safe successful result; dangerous tools remain default-off and no new direct action behavior is introduced

Security: APPROVE exactly this bounded fail-closed Stage 5 developer-alpha scope with only sanitized structured session records, capped read-only existing Memory retrieval, explicit local-only TTS opt-in, no raw provider prompt/response persistence, no credential or secure-store access, no cloud/model runtime/network path, no Memory write/schema migration, and no browser/local-app/shell/filesystem side effect beyond scoped session-history storage

Release: APPROVE implementation, fixture/replay, and local developer-alpha manual-test evidence only; no new default behavior, real cloud provider or tool execution, persistent telemetry, installer/update, packaging, or release-channel changes
```

The three approvals above were recorded before implementation.

## Product Goal

One desktop session should make the assistant's result lifecycle inspectable
and recoverable:

```text
input
-> route and selected tool
-> safety decision
-> fixture/replay or existing safe result
-> session timeline
-> bounded Memory context
-> retry or rollback state
-> optional local result playback
```

The result must still degrade to deterministic rules and existing safe states
when any Memory, TTS, local router, or heavy planner capability is unavailable.

## Allowed Implementation Scope

- Add a bounded, opt-in session-history record schema containing only:
  - generated session entry id and timestamp;
  - input source, route intent, selected tool id, safety status;
  - confirmation requirement, lifecycle/result status, and fixed reason code;
  - retry/rollback availability and outcome classification;
  - bounded localized display labels.
- Retain those records only for the active desktop session by default. If a
  scoped local history file is used for crash recovery, it must contain the
  same sanitized fields only, be capped, live under the Jarvis-K session
  storage location, and be removed on explicit clear or normal session close.
- Use existing Memory retrieval only through its current gated, read-only
  contract. Cap context to existing sanitized recall data and a fixed small
  result count. Do not write Memory, migrate SQLite, materialize an embedding
  model, or enable provider vectors.
- Add retry and rollback controls only for existing replay-safe or already
  blocked/degraded result states. Retry must re-enter the existing
  `agent.runBrainCommand` and safety path; rollback is a visible lifecycle
  state or existing bounded compensating action, never a new direct tool
  execution path.
- Add an explicit local TTS playback preference and result event only after a
  result is already classified safe and successful. Playback must remain
  local-only, cancelable, default-off, bounded in text length, and must not
  send text to a cloud speech provider or persist speech content.
- Render the lifecycle, history, Memory-context availability, retry/rollback,
  and TTS state through existing validated UI/IPC patterns with complete
  Chinese and English labels.
- Add focused contracts, Core/Core Host, UI interaction, and desktop smoke
  tests, including unavailable, blocked, confirmation-required, replay-safe,
  degraded, clear-history, and TTS-disabled states.

## Fixed Boundaries

- Preserve deterministic rules fallback, Qwen default-off behavior, and
  Qwen/rules fallback when a heavy planner is unavailable.
- Preserve the Stage 4 registry descriptors and executor-only side-effect
  boundary.
- Use no new IPC command that bypasses validated message schemas.
- Keep session history and any optional crash-recovery record scoped to this
  desktop user and session. Do not add analytics, telemetry, synchronization,
  export, cloud backup, or cross-device behavior.
- Keep raw user text, raw voice transcripts, raw Memory content, raw planner
  prompts/responses, credentials, headers, endpoints, stack traces, vectors,
  and model internals out of session records, diagnostics, logs, and UI
  evidence.

## Explicit Exclusions

This scope must not:

- call or configure OpenAI, DeepSeek, Qwen/DashScope, GLM, or another cloud
  provider;
- access credentials, Electron `safeStorage`, an OS credential store, or
  provider environment variables;
- run a Qwen/local model artifact, materialize models, activate model
  lifecycle entries, or change model cache policy;
- execute browser, local-app, shell, filesystem, process, network, OCR, or
  real Memory-write tools;
- alter allowlists, confirmation policy, tool safety policy, or executor
  ownership;
- expose a release default, installer, updater, packaging, telemetry, or
  release-channel behavior.

## Stop Conditions

Stop and request a narrower approval if the work requires:

- retention of raw user input, transcript, Memory contents, or provider data;
- a persistent database/schema migration beyond scoped sanitized session
  history;
- cloud speech, cloud model, credentials, secure storage, or network access;
- real tool execution or a safety-policy bypass;
- default-on TTS, default-on history persistence, or a release-facing UI
  behavior;
- a new model/provider runtime or a runtime acceptance window.

## Expected Evidence

Final evidence must be sanitized and limited to:

- fixed scope id and implementation status;
- session-history schema/version and capped entry count;
- active-session/default-off persistence and TTS flags;
- Memory read-only/context-available classifications;
- retry/rollback and safety-preserved classifications;
- TTS eligibility, disabled, canceled, and unavailable classifications;
- UI interaction state coverage in Chinese and English;
- focused test counts and desktop smoke result;
- false flags for credential exposure, network access, provider/model runtime,
  direct action, Memory write, telemetry, and release/default changes.

## Verification Plan

At minimum:

```powershell
npm.cmd run build:contracts
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
npx.cmd vitest run <focused-stage-5-tests>
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
npm.cmd run smoke:desktop:ui-interaction
```

Any manual test must stay within developer-alpha fixture/replay and the
existing explicitly safe local paths. A later real-provider, real-tool, or
release acceptance window requires a separate exact-scope approval.

## Implementation Evidence

Implemented:

- bounded Stage 5 schemas in `packages/contracts/src/protocol.ts`;
- in-memory-only CoreRuntime session-history projection in
  `packages/core/src/runtime.ts`;
- validated `agent.clearSessionHistory` command;
- Brain Dispatch product-alpha state, clear-history, retry, and rollback-view
  controls in `apps/ui/src/App.tsx`;
- default-off local browser speech-synthesis result playback, available only
  after a completed safe result and only after the user explicitly enables it;
- focused contracts, CoreRuntime, and UI source interaction tests.

The structured history contains only entry id/time, source, route intent,
selected tool id, dispatch and confirmation status, fixed reason codes, and
Memory/retry/rollback/TTS classifications. It contains no command text,
transcript, Memory match content, raw provider output, credential, endpoint,
or diagnostics. It is capped at 12 entries and remains in Core process memory
only; the implemented clear command removes it without touching Memory.

The Stage 5 Memory projection is read-only and contains only availability,
mode, match count, and vector dimensions. It adds no Memory write, SQLite
schema migration, embedding artifact, provider-vector, cache, or network path.
Retry re-enters the existing `agent.runBrainCommand` path only for blocked or
degraded results. Rollback clears the current local result display only.

Focused verification passed on 2026-08-08:

```powershell
npm.cmd run build:contracts
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
npx.cmd vitest run packages/contracts/test/protocol.test.ts
npx.cmd vitest run packages/core/test/runtime.test.ts
npx.cmd vitest run apps/ui/test/app-voice-ui-source.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
npm.cmd run smoke:desktop:ui-interaction
```

Results: contracts, Core, Core Host, UI, and desktop builds passed; focused
tests passed with 30 contract tests, 58 CoreRuntime tests, and 22 UI tests;
dependency and sensitive-artifact guards passed; whitespace validation passed;
desktop smoke passed for English/Chinese settings, Brain routing, and the
existing safe fixture Tool Loop.
