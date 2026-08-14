# Phase 7 User-Controlled Memory Progress

## 2026-08-14: Phase 7 User-Controlled Memory Completion Summary

Status: L4 completion summary for the Phase 7 user-controlled Memory track.
This is not an L5 release-readiness claim.

Phase 7 accepted L4 slices:
- Memory main view visible/delete/filter/boundary overview.
- Memory safety boundary deep review.
- Preference memory projection into `chat.answer`.
- Route alias memory for user-confirmed browser URL aliases.
- Voice alias memory for confirmed voice correction aliases.
- Voice alias to route alias remediation for `IZYtoken admin`.
- Sanitized memory snapshot preview/export view.
- Retention / session-only Memory control status projection.
- User-controlled Memory disable control status projection.

Safety boundaries preserved:
- Memory records remain user-confirmed only.
- Raw provider content, raw transcripts, raw private paths, credentials,
  tokens, browser history, clipboard content, file content, and provider
  diagnostics remain hidden from the Memory view.
- Delete remains the only active Memory mutation and still flows through the
  Core IPC repository boundary.
- Vector retrieval, provider personalization, provider runtime memory use,
  cloud sync, training export, background indexing, auto capture, auto
  execution, plugin access, workflow access, import/restore/edit, retention
  jobs, expiration jobs, and real disable/enable mutations remain disabled or
  status-only.
- Deterministic rules, Task Runtime, URL policy, Command Router safety gates,
  risk confirmation rules, and fixture-test-only boundaries remain unchanged.

Verification consolidated:
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS
  (32 tests) during the latest Phase 7 UI projection verification.
- `npm run typecheck`: PASS.
- `npm run build:ui`: PASS. Vite reported the existing large chunk warning.
- Windows manual L4 acceptance was confirmed by the user for each listed
  Phase 7 slice, including route alias, voice alias, preference projection,
  memory snapshot, retention/session status, disable status, and deep safety
  boundary review.

Completion level:
- Phase 7 initial user-controlled Memory is accepted at L4.
- Not L5: real disable/enable persistence, retention mutation, session-only
  writes, expiration control, edit/restore/import, audit history, storage
  encryption, release hardening, and broader product rollout are not complete.

Next planned track:
- Phase 8 Minimal Planner L3: deterministic, provider-neutral bounded plan
  drafting through Task Runtime with no tool execution before confirmation.

## 2026-08-14: User-Controlled Memory Disable Control Projection L4 Manual Acceptance

Status: L4 after Windows UI manual acceptance.

Added a Memory-view-local disable control projection for user-controlled memory
records. This slice makes the future disable/enable boundary visible without
adding a repository mutation, IPC command, schema change, background job, or
provider behavior.

Scope completed:
- Added a disabled `Disable` control beside each visible user-controlled
  Memory record.
- Added a per-record `DISABLE_NOT_ENABLED` policy badge.
- Added Memory boundary metrics for:
  - `Disable controls`: `STATUS_ONLY`.
  - `Disable mutation`: `NOT_ENABLED`.
  - `Disabled records`: `0`.

Safety boundaries:
- No disable/enable repository method, IPC command, persistent disabled state,
  task replay, provider call, route rewrite, browser launch, desktop launch,
  filesystem search, plugin execution, vector retrieval, background indexing,
  telemetry, installer, release behavior, approval request, preflight, bounded
  window, or closeout document was added.
- Delete remains the only active Memory mutation path and still flows through
  the existing Core IPC repository boundary.
- Existing user-confirmed route aliases, voice aliases, preferences,
  sanitized snapshot export preview, retention/session status projection, Task
  Runtime, deterministic rules, URL policy, and permission gates remain
  unchanged.

Verification:
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS
  (32 tests).
- `npm run typecheck`: PASS.
- `npm run build:ui`: PASS. Vite reported the existing large chunk warning.

Windows manual L4 acceptance checklist:
- PASS, confirmed by the user in this thread after the
  User-Controlled Memory Disable Control Projection L3 checklist.
- The formal Memory view showed a disabled `Disable` control for visible
  Memory records.
- Each visible record showed `DISABLE_NOT_ENABLED`.
- The Memory boundary panel showed `Disable controls: STATUS_ONLY`,
  `Disable mutation: NOT_ENABLED`, and `Disabled records: 0`.
- Interacting with the disabled control did not change, hide, delete, enable,
  disable, route, launch, or persist any Memory record.
- Restart confirmed the same records remained visible and no disabled state was
  created.

Completion level:
- L4 user-facing disable control status projection accepted through the formal
  Windows UI.
- Not L5: real per-record disable/enable persistence, policy semantics,
  audit history, restore behavior, and release readiness are not complete.

## 2026-08-14: Retention / Session-only Memory Control L4 Manual Acceptance

Status: L4 after Windows UI manual acceptance.

Added a Memory-view-local Retention / Session-only control projection. This
slice makes retention policy status, session-only status, expiration status,
and runtime mutation boundaries visible in the formal Memory view without
enabling any new memory policy mutation behavior.

Scope completed:
- Added a `Retention / session controls` panel to the formal Memory view.
- Added visible status projection for retention controls, retention scope,
  session-only mode, expiration control, recording mode, and runtime mutation.
- Added disabled UI controls for session-only memory, expiration control, and
  retention mutation.
- Added Memory boundary metrics for:
  - `Retention/session controls`: `STATUS_ONLY`.
  - `Retention mutation`: `NO_RUNTIME_MUTATION`.
  - `Session writes`: `DISABLED`.
  - `Expiration jobs`: `DISABLED`.

Safety boundaries:
- No retention scheduler, expiration job, session-only write mode, memory
  storage mutation, import, restore, export-to-file, clipboard write, provider
  call, vector retrieval, vector indexing, Qwen runtime, planner behavior,
  plugin execution, browser launch, desktop launch, shell, filesystem search,
  telemetry, installer, release behavior, or approval/closeout document was
  added.
- Existing user-confirmed Memory records, deletion, route alias projection,
  voice alias projection, preference projection, Task Runtime, deterministic
  rules, URL policy, and permission gates remain unchanged.
- This is a status-only control readiness slice. Runtime memory retention
  policy changes still require a later explicit implementation and Windows UI
  acceptance.

Verification:
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS
  (32 tests).
- `npm run build:ui`: PASS. Vite reported the existing large chunk warning.
- `npm run typecheck`: PASS.
- Windows manual acceptance: PASS.

Windows manual acceptance:
- PASS, confirmed by the user in this thread after the Retention /
  Session-only Memory Control L3 checklist.
- The formal Memory view displayed the `Retention / session controls` panel.
- The panel showed:
  - `Retention controls`: `NOT_ENABLED`.
  - `Retention scope`: `USER_CONTROLLED_ONLY`.
  - `Session-only mode`: `NOT_ENABLED`.
  - `Expiration control`: `NOT_ENABLED`.
  - `Recording mode`: `MANUAL_ONLY`.
  - `Runtime mutation`: `NO_RUNTIME_MUTATION`.
- The session-only, expiration, and retention mutation controls were visible
  but disabled.
- The Memory boundary panel showed `Retention/session controls:
  STATUS_ONLY`, `Session writes: DISABLED`, and `Expiration jobs: DISABLED`.
- Disabled controls did not create, change, delete, import, restore, or export
  any Memory record.
- Restart confirmed existing user-controlled Memory records were unchanged and
  no session-only or expiration behavior ran automatically.

Completion level:
- L4 user-facing Retention / Session-only Memory Control status projection
  accepted through the formal Windows UI.
- Not L5: actual retention policy editing, session-only storage behavior,
  expiration scheduling, retention audit history, encryption, import/restore,
  and release readiness are not complete.

## 2026-08-14: User-Controlled Memory Sanitized Snapshot Export L4 Manual Acceptance

Status: L4 after Windows UI manual acceptance.

Added a Memory-view-local sanitized snapshot export preview for
user-controlled memories. This is an export-only safety slice: it lets the user
generate and inspect a JSON snapshot from already-visible sanitized Memory
records without enabling import, restore, file writing, clipboard writing, raw
provider access, vector retrieval, or automatic learning.

Scope completed:
- Added a `Sanitized snapshot` panel to the formal Memory view.
- Added an `Export snapshot` button that builds a JSON preview from
  `userControlledMemories`.
- Snapshot records include only sanitized visible metadata: id, kind, label,
  summary, preference key/value when already visible, source, risk, deletable
  status, `rawContentExposed: false`, and timestamps.
- Snapshot metadata includes `schemaVersion`, `generatedAt`, provenance,
  redaction policy, source boundary, import policy, restore policy, and record
  count.
- Added local validation before displaying the snapshot preview.
- Added a `Clear` button that removes only the renderer preview.
- Updated Memory boundary projection:
  - `Sanitized snapshot`: `IDLE` or `GENERATED`.
  - `Import boundary`: `NOT_ENABLED`.
  - `Export/import`: `EXPORT_ONLY`.

Safety boundaries:
- No backend persistence schema, Core repository change, provider call, Qwen
  runtime, vector retrieval, Planner behavior, plugin execution, browser launch,
  desktop launch, shell, filesystem search, clipboard write, file write,
  telemetry, installer, release behavior, import behavior, or restore behavior
  was added.
- Snapshot generation is user-initiated and renderer-local.
- Snapshot preview stores no raw transcripts, raw provider output, prompts,
  credentials, tokens, private paths, vectors, stack traces, browser history,
  screen data, file content, clipboard content, or hidden provider payloads.
- Existing user-controlled Memory deletion, Task Runtime, URL policy,
  permission layer, deterministic rules, and Command Router gates remain
  unchanged.

Verification:
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS
  (32 tests).
- `npm run build:ui`: PASS. Vite reported the existing large chunk warning.
- `npm run typecheck`: PASS.
- Windows manual acceptance: PASS.

Windows manual acceptance:
- The formal Memory view displayed the `Sanitized snapshot` panel.
- `Export snapshot` generated a JSON preview with `schemaVersion: 1`,
  `provenance: USER_INITIATED_MEMORY_VIEW`,
  `redactionPolicy: SANITIZED_VISIBLE_FIELDS_ONLY`,
  `sourceBoundary: USER_CONFIRMED_ONLY`, `importPolicy: NOT_ENABLED`, and
  `restorePolicy: NOT_ENABLED`.
- The preview contained 3 records and `recordCount: 3`.
- All records showed `rawContentExposed: false`.
- The preview contained only sanitized visible Memory metadata and did not
  expose raw prompt, raw transcript, provider output, credential, token,
  private path, vector, browser history, screen content, file content, or
  clipboard content.
- `Clear` removed only the renderer preview; Memory records remained
  unchanged.
- Restart confirmed that no import or restore action occurred.

Completion level:
- L4 user-facing Memory sanitized snapshot export preview accepted through the
  formal Windows UI.
- Not L5: import, restore, file export, encryption, retention controls, audit
  history, and release readiness are not complete.

## 2026-08-14: Route Alias Memory Browser Open URL Projection L4 Manual Acceptance

Status: L4 after Windows UI manual acceptance.

Consolidated the manual acceptance result for Route Alias Memory projection into
the `browser.open_url` path. This acceptance covers the user-confirmed
IZYtoken admin URL alias loop, Memory visibility, deletion, restart
persistence, route-alias dispatch, and safe fallback after deletion.

Windows manual acceptance:
- PASS, confirmed by the user in this thread after the Route Alias Memory L4
  checklist.
- The user saved an IZYtoken admin URL as a user-confirmed route alias from the
  formal conversation surface.
- The saved alias appeared in the Memory view as a route alias record.
- The route alias was visible with sanitized route target metadata and
  user-confirmed route alias source projection.
- The route alias remained deletable from the Memory UI.
- The alias could be used from the formal conversation surface to route
  `Open IZYtoken admin`-style intent through the existing browser open URL
  path.
- The routed URL remained the saved safe `https` URL and passed the existing
  URL policy.
- After deleting the alias through Memory and restarting Jarvis-K, the deleted
  alias remained absent.
- After deletion, the same natural-language request no longer silently opened
  the previous URL and instead degraded safely.

Accepted behavior:
- Users can teach a bounded URL route alias through explicit conversation.
- Users can inspect the saved route alias in Memory.
- Users can use the alias to open the saved URL through the existing
  deterministic route and `browser.open_url` path.
- Users can delete the alias from Memory, and deletion persists across restart.
- Deleted route aliases are not automatically regenerated and do not continue
  to route to the previous URL.
- The route alias path remains a deterministic rules / user-confirmed alias
  path, not a free-form model rewrite path.

Safety boundaries:
- No Qwen free rewrite, provider call, vector retrieval, Planner behavior,
  plugin execution, arbitrary URL launch, arbitrary executable launch, desktop
  launch, shell, filesystem search, telemetry, installer, packaging,
  release-channel, model training, training export, prompt injection, provider
  personalization, automatic observation, auto execution, permission override,
  risk downgrade, confirmation bypass, allowlist mutation, workflow replay,
  autonomous follow-up, outbound messaging, or external trigger behavior was
  added by this acceptance.
- The saved alias remains user-confirmed, visible, deletable, sanitized, and
  bounded to the existing URL policy.
- Raw provider output, raw prompts, raw transcripts, credentials, tokens,
  private paths, vectors, stack traces, signed URLs, and hidden provider
  payloads remain hidden.
- Existing deterministic rules, Task Runtime, permission layer, URL policy, and
  Command Router safety gates remain unchanged.

Verification:
- No code changes were made for this L4 evidence update.
- Latest relevant local verification remains:
  `npm run build:ui`: PASS with existing Vite chunk-size warning.
- Latest relevant source test remains:
  `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- Windows UI manual acceptance: PASS, confirmed by the user.

Completion level:
- Current level: L4.
- L4 basis: the user can create, inspect, use, delete, restart-verify, and
  safe-fallback-test a route alias through the formal Jarvis-K UI and existing
  browser open URL path.
- Not L5: route alias editing, restore, export/import, expiration controls,
  session-only aliases, broader URL policy management, audit history, encrypted
  storage, release hardening, installer/update behavior, and release readiness
  are not complete.

## 2026-08-14: Preference Memory Chat Answer Projection L4 Manual Acceptance

Status: L4 after Windows UI manual acceptance.

Consolidated the manual acceptance result for Preference Memory projection into
the `chat.answer` path. This acceptance covers the user-confirmed response
language preference loop, Memory visibility, deletion, restart persistence, and
bounded projection into chat answer behavior without enabling provider runtime
or bypassing safety gates.

Windows manual acceptance:
- PASS, confirmed by the user in this thread after the Preference Memory L4
  checklist.
- The user created a response-language preference through the formal
  conversation surface with a natural-language memory request.
- Jarvis-K saved the preference as a sanitized user-controlled Memory record.
- The Memory view showed the preference record with sanitized title/content
  similar to `Response language` and `Prefer Chinese replies`.
- The preference record was visible as a preference-type record with low risk,
  raw-hidden/provider-neutral/view-delete safety projection where applicable.
- The Memory header and boundary projection reflected at least one preference
  record.
- `Preference projection` was visible as enabled for the relevant chat-answer
  scope, and `Applies to` projected `CHAT ANSWER`.
- The user verified the `chat.answer` path after saving the preference.
- The user deleted the preference record through the formal Memory delete
  control.
- After restart, the deleted preference remained absent and was not
  automatically regenerated.

Accepted behavior:
- Users can create a simple response-language preference from the formal
  conversation surface.
- Users can inspect the saved preference from the Memory UI.
- Users can delete the saved preference from the Memory UI, and deletion
  persists across restart.
- Preference projection can inform the chat-answer path as a bounded,
  provider-neutral policy signal.
- Preference projection does not require Qwen stability and does not block
  normal deterministic rules or fallback behavior.
- If a real chat-answer provider is available, the preference can guide answer
  language; if provider generation is unavailable, fallback behavior remains
  visible and deterministic rules remain active.

Safety boundaries:
- No provider call, Qwen runtime, vector retrieval, Planner behavior, plugin
  execution, browser launch, URL opening, desktop launch, shell, filesystem
  search, telemetry, installer, packaging, release-channel, cloud sync,
  provider sync, model training, training export, prompt injection, provider
  personalization, automatic observation, auto execution, permission override,
  risk downgrade, confirmation bypass, allowlist mutation, workflow replay,
  autonomous follow-up, outbound messaging, or external trigger behavior was
  added by this acceptance.
- The preference record remains user-confirmed, visible, deletable, sanitized,
  and provider-neutral.
- Raw provider output, raw prompts, raw transcripts, credentials, tokens,
  private paths, vectors, stack traces, and hidden provider payloads remain
  hidden.
- Existing deterministic rules, Task Runtime, permission layer, and Command
  Router safety gates remain unchanged.

Verification:
- No code changes were made for this L4 evidence update.
- Latest relevant local verification remains:
  `npm run build:ui`: PASS with existing Vite chunk-size warning.
- Latest relevant source test remains:
  `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- Windows UI manual acceptance: PASS, confirmed by the user.

Completion level:
- Current level: L4.
- L4 basis: the user can create, inspect, project, delete, and restart-verify a
  response-language preference through the formal Jarvis-K UI.
- Not L5: preference editing, restore, export/import, session-only preference
  mode, retention controls, provider audit history, broader preference-type
  compatibility, encrypted storage, release hardening, installer/update
  behavior, and release readiness are not complete.

## 2026-08-14: User-Controlled Memory Safety Boundary Deep L4 Manual Acceptance

Status: L4 after Windows UI manual acceptance.

Consolidated the deep safety-boundary acceptance for the user-controlled Memory
surface. This acceptance covers the formal UI projection that Memory remains
user-controlled, sanitized, view/delete scoped, and disconnected from provider
runtime, vector retrieval, external sync, model training, prompt injection,
automatic observation, and autonomous execution paths.

Windows manual acceptance:
- PASS, confirmed by the user in this thread after the Memory deep safety
  boundary checklist.
- The Memory boundary panel was reviewed across the long boundary list in the
  formal Windows UI.
- Core boundary status was visible and safe:
  `Provider/raw private: HIDDEN`, `Raw exposed records: 0`,
  `Vector retrieval: DISABLED`, `Provider runtime: NOT USED`,
  `Source boundary: USER_CONFIRMED`, `Write policy: EXPLICIT_ONLY`, and
  `Delete boundary: CORE_IPC_REPOSITORY`.
- Snapshot, retention, and record-control boundaries were visible, including
  sanitized-only snapshot redaction, required snapshot schema validation,
  user-confirmed-only snapshot provenance, manual-only recording mode,
  disabled or not-enabled raw snapshot review, retention controls,
  export/import, edit/restore, storage encryption, recording pause, saved view
  presets, expiration control, session-only mode, provider audit, and audit
  history.
- Sharing and sync boundaries were visible and safe: external sharing,
  community sharing, cloud sync, provider sync, and network access remained
  disabled; cloud account remained not configured; credential access remained
  no access.
- Training and provider personalization boundaries were visible and safe:
  model training and training export remained disabled, provider
  personalization remained not enabled, and prompt injection remained disabled.
- Raw data retention boundaries were visible and disabled for audio,
  transcript, screen capture, file content, clipboard, secret, payment,
  location, biometric, contact, health, calendar, email, identity document,
  browser history, cookie, download history, autofill, credential, device
  identifier, network identifier, crash dump, error report, telemetry payload,
  model cache, prompt cache, task history, and vector index retention.
- Observation boundaries were visible and disabled for clipboard, keystroke,
  window, screen, file, camera, microphone, browser history, location,
  contacts, calendar, email, messaging, credential, payment, health,
  biometric, government ID, financial account, legal document, repository, and
  cloud storage observation.
- Access and extension boundaries were visible and safe: plugin, workflow,
  Teach Mode, skin, pet, personality, and custom UI access remained not
  granted.
- Autonomous behavior boundaries were visible and safe: auto capture,
  background indexing, proactive scan, proactive notifications, context
  polling, auto execution, permission override, risk downgrade, confirmation
  bypass, allowlist mutation, workflow replay, background task creation,
  reminder scheduling, autonomous follow-up, outbound messaging, and external
  triggers remained disabled; proactive suggestions remained not enabled.

Accepted behavior:
- The formal Memory UI makes the safety boundary explicit instead of hiding it
  behind documentation.
- Saved route aliases, voice aliases, and preferences remain visible and
  deletable by the user, but do not automatically become provider prompts,
  model-training records, vector-retrieval inputs, plugin inputs, workflow
  triggers, or autonomous execution instructions.
- Boundary state is status-only and does not expose raw prompts, raw
  transcripts, provider outputs, credentials, tokens, private paths, stack
  traces, vectors, browser profile data, browser history, file contents,
  screen captures, microphone frames, camera frames, or external account data.
- High-risk boundary capabilities are not silently enabled by Memory records,
  preference projection, route aliases, voice correction aliases, plugins,
  skins, pets, workflows, Teach Mode, or future community features.

Safety boundaries:
- No provider call, Qwen runtime, vector retrieval, Planner behavior, plugin
  execution, browser launch, URL opening, desktop launch, shell, filesystem
  search, telemetry, installer, packaging, release-channel, cloud sync,
  provider sync, credential access, network access, model training, training
  export, prompt injection, provider personalization, automatic observation,
  auto execution, permission override, risk downgrade, confirmation bypass,
  allowlist mutation, workflow replay, autonomous follow-up, outbound
  messaging, external trigger, import/export, edit/restore, storage encryption,
  retention-control, or access-grant behavior was added or executed by this
  acceptance.
- The Memory surface remains a user-controlled view/delete surface for the
  currently implemented records.
- Existing deterministic rules, Task Runtime, permission layer, and Command
  Router safety gates remain unchanged.

Verification:
- No code changes were made for this L4 evidence update.
- Latest relevant local verification remains:
  `npm run build:ui`: PASS with existing Vite chunk-size warning.
- Latest relevant source test remains:
  `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- Windows UI manual acceptance: PASS, confirmed by the user.

Completion level:
- Current level: L4.
- L4 basis: the user can inspect the deep Memory safety boundary from the
  formal Windows UI, and the boundary projection was manually accepted as
  safe, visible, and non-executing.
- Not L5: editable memory records, restore, export/import, retention controls,
  session-only mode, recording pause, provider audit history, storage
  encryption, access-control management, release hardening, compatibility
  acceptance, installer/update behavior, and release readiness are not
  complete.

## 2026-08-14: User-Controlled Memory Main View Visibility/Delete/Filter/Boundary Overview L4 Manual Acceptance

Status: L4 after Windows UI manual acceptance.

Consolidated the manual acceptance result for the user-controlled Memory main
view. This acceptance covers the formal Memory UI path for visible records,
delete controls, filter/search/sort/reset behavior, and the Memory boundary
overview projection.

Windows manual acceptance:
- PASS, confirmed by the user in this thread after the Memory L4 checklist.
- The Memory view opened from the formal Jarvis-K UI without renderer blank
  screen recovery.
- The main header projected the current sanitized counts:
  `3 memories / 1 routes / 1 voice / 1 prefs`.
- The user-confirmed route alias, voice command alias, and preference records
  were visible in the list.
- Per-record type, risk, source, raw-hidden, provider-neutral, and view/delete
  badges were visible where applicable.
- Filter/search/sort/reset behavior was manually accepted.
- Delete confirmation and restart persistence behavior were manually accepted.
- The Memory boundary panel was visible and projected user-controlled status,
  local-only view controls, non-persisted view state, visible/deletable/locked
  counts, hidden raw/private content, source boundaries, write/delete
  boundaries, retention boundaries, sharing/sync boundaries, training/export
  boundaries, observation boundaries, and execution-safety boundaries.

Accepted behavior:
- Users can inspect sanitized Memory records from the formal UI.
- Users can filter records by kind and risk, search records, change sort order,
  reset view criteria, and reconcile visible records with total counts.
- Users can delete explicitly confirmed records through the existing Core IPC
  and repository boundary, and deletion remains reflected after restart.
- `Provider/raw private` remains `HIDDEN`.
- `Raw exposed records` remains `0`.
- `Provider runtime` remains `NOT USED`.
- `Vector retrieval` remains disabled.
- Memory records remain user-confirmed only; raw provider output, raw
  transcript/private provider data, credentials, private paths, stack traces,
  tokens, vectors, and hidden prompt/provider payloads are not shown.
- Boundary rows for cloud sync, provider sync, credential access, network
  access, model training, training export, provider personalization, prompt
  injection, automatic observation, auto execution, risk downgrade,
  confirmation bypass, allowlist mutation, plugin/workflow/Teach Mode access,
  and external/community sharing remain disabled, not enabled, not granted, or
  not configured according to their current safe status.

Safety boundaries:
- No provider call, Qwen runtime, vector retrieval, Planner behavior, plugin
  execution, browser launch, desktop launch, shell, filesystem search,
  telemetry, installer, packaging, release-channel, cloud sync, provider sync,
  model training, training export, prompt injection, provider personalization,
  proactive scan, auto execution, permission override, risk downgrade,
  confirmation bypass, allowlist mutation, workflow replay, autonomous
  follow-up, outbound messaging, or external trigger behavior was added or
  executed by this acceptance.
- The formal Memory UI remains view/delete only for user-controlled records.
- Deletion continues to flow through Core IPC and the existing repository
  boundary.
- Existing deterministic rules and safety gates remain unchanged.

Verification:
- No code changes were made for this L4 evidence update.
- Latest relevant local verification remains:
  `npm run build:ui`: PASS with existing Vite chunk-size warning.
- Latest relevant source test remains:
  `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- Windows UI manual acceptance: PASS, confirmed by the user.

Completion level:
- Current level: L4.
- L4 basis: the user can inspect, filter, search, sort, reset, delete, and
  reconcile user-controlled Memory records from the formal UI, and the boundary
  overview was manually accepted on Windows.
- Not L5: edit/restore, export/import, saved view presets as production
  completion, audit history, storage encryption, retention controls,
  session-only mode, recording pause, provider audit, access controls,
  release hardening, installer/update behavior, compatibility acceptance, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Prompt Injection Boundary Source Audit L3 Slice

Status: L3 pending Windows manual acceptance.

Audited the existing renderer-local Memory boundary projection that explicitly
shows prompt injection as disabled. This keeps the Memory surface state clear
that saved aliases, preferences, future workflow records, skin, pet, or
personality records are not automatically inserted into provider prompts, hidden
system prompts, tool prompts, planner prompts, plugin prompts, Qwen routing
prompts, or prompt-template expansion paths from this UI path.

Scope completed:
- Confirmed the existing `Prompt injection` Memory boundary panel row remains
  projected with `DISABLED` status.
- Confirmed the source test already locks the `Prompt injection` row and
  `userControlledMemoryPromptInjectionBoundary` value projection.
- Reused the existing Memory boundary projection pattern and source assertion;
  no runtime behavior was changed.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, health observation status,
  biometric observation status, government ID observation status, financial
  account observation status, legal document observation status, repository
  observation status, cloud storage observation status, analytics profiling
  status, model training status, training export status, provider
  personalization status, access status projections, sharing status, provider
  sync status, snapshot controls, Task Runtime storage, provider/runtime
  projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, prompt assembly path, prompt-template expander,
  hidden system prompt injection, provider prompt injection, tool prompt
  injection, planner prompt injection, plugin prompt injection, Qwen routing
  prompt injection, provider profile store, provider personalization setting,
  hosted model memory, remote assistant profile, cross-provider personalization
  path, training export job, dataset export job, fine-tuning corpus writer,
  prompt/response corpus exporter, provider upload bundle, evaluator export,
  offline ML artifact writer, labeling queue, model training job, fine-tuning
  job, reinforcement learning job, personalization dataset, provider training
  upload, analytics profile store, behavior-profile builder, engagement-profile
  builder, advertising segment builder, churn-score builder, product analytics
  identity, cross-session profiler, telemetry expansion, event upload,
  analytics SDK, tracking pixel, remote analytics destination, cloud-drive
  reader, repository scanner, git-history reader, file content reader, contract
  reader, bank-account reader, identity-document reader, health-record reader,
  payment sender, payment reader, credential reader, SMS reader, chat app
  reader, mailbox reader, calendar event reader, contact list reader, browser
  profile reader, browser history reader, tab observer, cookie reader, session
  reader, browsing state ingestion path, browser extension, browser automation,
  browser launch, URL opening, continuous listener, microphone frame capture
  path, voice provider call, ASR provider call, TTS provider call, webcam access
  path, camera capture path, directory watcher, screenshot capture path, screen
  sampler, active-window watcher, window-title reader, keyboard hook, keylogger,
  clipboard watcher, webhook subscription, remote event listener, plugin event
  listener, external trigger registry, outbound message sender, chat sender,
  external notification sender, autonomous follow-up worker, reminder scheduler,
  background task scheduler, hidden task queue, workflow replay behavior,
  allowlist mutation behavior, permission policy mutation, risk downgrade
  behavior, confirmation bypass behavior, route auto-run, plugin invocation,
  desktop launch, shell, filesystem search, context polling worker, proactive
  assistant trigger, provider sync job, credential storage, network destination,
  import/export path, provider call, Qwen runtime, vector retrieval, Planner
  behavior, installer, release behavior, model training execution, dataset
  export, or prompt injection behavior was added.
- Prompt injection status is renderer-only and documents that Memory does not
  automatically enter prompt assembly, hidden system prompts, provider prompts,
  tool prompts, planner prompts, plugin prompts, or Qwen routing prompts in this
  UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32
  tests.
- No desktop automated smoke was run for this slice because the change is a
  source audit and progress-document update for an existing renderer-only status
  projection.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Prompt injection`.
- Confirm the `Prompt injection` value is `DISABLED`.
- Confirm `Provider personalization`, `Training export`, `Model training`,
  `Analytics profiling`, `Cloud storage observation`, `Repository observation`,
  `Legal document observation`, `Financial account observation`, `Government ID
  observation`, `Biometric observation`, `Health observation`, `Payment
  observation`, `Credential observation`, `Messaging observation`, `Email
  observation`, `Calendar observation`, `Contacts observation`, `Location
  observation`, `Browser history observation`, `Microphone observation`,
  `Camera observation`, `File observation`, `Screen observation`, `Window
  observation`, `Keystroke observation`, `Clipboard observation`, `External
  triggers`, `Outbound messaging`, `Autonomous follow-up`, `Reminder
  scheduling`, `Background task creation`, `Workflow replay`, `Allowlist
  mutation`, `Confirmation bypass`, `Risk downgrade`, `Permission override`,
  `Auto execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no prompt assembly, hidden system prompt injection, provider prompt
  injection, tool prompt injection, planner prompt injection, plugin prompt
  injection, Qwen routing prompt injection, provider personalization, provider
  sync, import/export, training export, dataset export, background execution,
  plugin invocation, desktop launch, shell execution, filesystem search, or
  external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 source audit with local build/test verification for an existing renderer
  projection.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization controls, prompt injection
  controls, retention controls, access controls, proactive scan controls,
  proactive suggestion controls, proactive notification controls, context
  polling controls, auto execution controls, permission override controls, risk
  downgrade controls, confirmation bypass controls, allowlist mutation controls,
  workflow replay controls, background task creation controls, reminder
  scheduling controls, autonomous follow-up controls, outbound messaging
  controls, external trigger controls, clipboard observation controls, keystroke
  observation controls, window observation controls, screen observation
  controls, file observation controls, camera observation controls, microphone
  observation controls, browser history observation controls, location
  observation controls, contacts observation controls, calendar observation
  controls, email observation controls, messaging observation controls,
  credential observation controls, payment observation controls, health
  observation controls, biometric observation controls, government ID
  observation controls, financial account observation controls, legal document
  observation controls, repository observation controls, cloud storage
  observation controls, analytics profiling controls, model training controls,
  training export controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Provider Personalization Boundary Source Audit L3 Slice

Status: L3 pending Windows manual acceptance.

Audited the existing renderer-local Memory boundary projection that explicitly
shows provider personalization as not enabled. This keeps the Memory surface
state clear that saved aliases, preferences, future workflow records, skin, pet,
or personality records are not automatically injected into provider prompts,
provider profile stores, provider personalization settings, hosted model memory,
remote assistant profiles, or cross-provider personalization paths.

Scope completed:
- Confirmed the existing `Provider personalization` Memory boundary panel row
  remains projected with `NOT_ENABLED` status.
- Confirmed the source test already locks the `Provider personalization` row and
  `userControlledMemoryProviderPersonalizationBoundary` value projection.
- Reused the existing Memory boundary projection pattern and source assertion;
  no runtime behavior was changed.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, health observation status,
  biometric observation status, government ID observation status, financial
  account observation status, legal document observation status, repository
  observation status, cloud storage observation status, analytics profiling
  status, model training status, training export status, access status
  projections, sharing status, provider sync status, snapshot controls, Task
  Runtime storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, provider prompt injection, provider profile
  store, provider personalization setting, hosted model memory, remote assistant
  profile, cross-provider personalization path, training export job, dataset
  export job, fine-tuning corpus writer, prompt/response corpus exporter,
  provider upload bundle, evaluator export, offline ML artifact writer,
  labeling queue, model training job, fine-tuning job, reinforcement learning
  job, personalization dataset, provider training upload, analytics profile
  store, behavior-profile builder, engagement-profile builder, advertising
  segment builder, churn-score builder, product analytics identity,
  cross-session profiler, telemetry expansion, event upload, analytics SDK,
  tracking pixel, remote analytics destination, cloud-drive reader, repository
  scanner, git-history reader, file content reader, contract reader,
  bank-account reader, identity-document reader, health-record reader, payment
  sender, payment reader, credential reader, SMS reader, chat app reader,
  mailbox reader, calendar event reader, contact list reader, browser profile
  reader, browser history reader, tab observer, cookie reader, session reader,
  browsing state ingestion path, browser extension, browser automation, browser
  launch, URL opening, continuous listener, microphone frame capture path, voice
  provider call, ASR provider call, TTS provider call, webcam access path,
  camera capture path, directory watcher, screenshot capture path, screen
  sampler, active-window watcher, window-title reader, keyboard hook, keylogger,
  clipboard watcher, webhook subscription, remote event listener, plugin event
  listener, external trigger registry, outbound message sender, chat sender,
  external notification sender, autonomous follow-up worker, reminder
  scheduler, background task scheduler, hidden task queue, workflow replay
  behavior, allowlist mutation behavior, permission policy mutation, risk
  downgrade behavior, confirmation bypass behavior, route auto-run, plugin
  invocation, desktop launch, shell, filesystem search, context polling worker,
  proactive assistant trigger, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, installer, release behavior, model
  training execution, dataset export, or prompt injection behavior was added.
- Provider personalization status is renderer-only and documents that Memory
  does not automatically personalize providers, hosted model profiles, prompt
  assembly, remote assistant profiles, or cross-provider settings in this UI
  path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  source audit and progress-document update for an existing renderer-only status
  projection.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Provider personalization`.
- Confirm the `Provider personalization` value is `NOT_ENABLED`.
- Confirm `Training export`, `Model training`, `Analytics profiling`, `Cloud
  storage observation`, `Repository observation`, `Legal document observation`,
  `Financial account observation`, `Government ID observation`, `Biometric
  observation`, `Health observation`, `Payment observation`, `Credential
  observation`, `Messaging observation`, `Email observation`, `Calendar
  observation`, `Contacts observation`, `Location observation`, `Browser history
  observation`, `Microphone observation`, `Camera observation`, `File
  observation`, `Screen observation`, `Window observation`, `Keystroke
  observation`, `Clipboard observation`, `External triggers`, `Outbound
  messaging`, `Autonomous follow-up`, `Reminder scheduling`, `Background task
  creation`, `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`,
  `Risk downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no provider prompt injection, provider profile store, hosted model
  memory, remote assistant profile, cross-provider personalization, provider
  upload, provider sync, import/export, training export, dataset export,
  background execution, plugin invocation, desktop launch, shell execution,
  filesystem search, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 source audit with local build/test verification for an existing renderer
  projection.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization controls, prompt injection,
  retention controls, access controls, proactive scan controls, proactive
  suggestion controls, proactive notification controls, context polling
  controls, auto execution controls, permission override controls, risk
  downgrade controls, confirmation bypass controls, allowlist mutation controls,
  workflow replay controls, background task creation controls, reminder
  scheduling controls, autonomous follow-up controls, outbound messaging
  controls, external trigger controls, clipboard observation controls, keystroke
  observation controls, window observation controls, screen observation
  controls, file observation controls, camera observation controls, microphone
  observation controls, browser history observation controls, location
  observation controls, contacts observation controls, calendar observation
  controls, email observation controls, messaging observation controls,
  credential observation controls, payment observation controls, health
  observation controls, biometric observation controls, government ID
  observation controls, financial account observation controls, legal document
  observation controls, repository observation controls, cloud storage
  observation controls, analytics profiling controls, model training controls,
  training export controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Training Export Boundary Source Audit L3 Slice

Status: L3 pending Windows manual acceptance.

Audited the existing renderer-local Memory boundary projection that explicitly
shows training export as disabled. This keeps the Memory surface state clear
that saved aliases, preferences, future workflow records, skin, pet, or
personality records do not leave the product as training datasets, fine-tuning
corpora, provider upload bundles, prompt/response corpora, evaluator exports, or
offline ML artifacts from this path.

Scope completed:
- Confirmed the existing `Training export` Memory boundary panel row remains
  projected with `DISABLED` status.
- Confirmed the source test already locks the `Training export` row and
  `userControlledMemoryTrainingExportBoundary` value projection.
- Reused the existing Memory boundary projection pattern and source assertion;
  no runtime behavior was changed.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, health observation status,
  biometric observation status, government ID observation status, financial
  account observation status, legal document observation status, repository
  observation status, cloud storage observation status, analytics profiling
  status, model training status, access status projections, sharing status,
  provider sync status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, training export job, dataset export job,
  fine-tuning corpus writer, prompt/response corpus exporter, provider upload
  bundle, evaluator export, offline ML artifact writer, labeling queue,
  model training job, fine-tuning job, reinforcement learning job,
  personalization dataset, provider training upload, analytics profile store,
  behavior-profile builder, engagement-profile builder, advertising segment
  builder, churn-score builder, product analytics identity, cross-session
  profiler, telemetry expansion, event upload, analytics SDK, tracking pixel,
  remote analytics destination, cloud-drive reader, repository scanner,
  git-history reader, file content reader, contract reader, bank-account reader,
  identity-document reader, health-record reader, payment sender, payment
  reader, credential reader, SMS reader, chat app reader, mailbox reader,
  calendar event reader, contact list reader, browser profile reader, browser
  history reader, tab observer, cookie reader, session reader, browsing state
  ingestion path, browser extension, browser automation, browser launch, URL
  opening, continuous listener, microphone frame capture path, voice provider
  call, ASR provider call, TTS provider call, webcam access path, camera capture
  path, directory watcher, screenshot capture path, screen sampler,
  active-window watcher, window-title reader, keyboard hook, keylogger,
  clipboard watcher, webhook subscription, remote event listener, plugin event
  listener, external trigger registry, outbound message sender, chat sender,
  external notification sender, autonomous follow-up worker, reminder
  scheduler, background task scheduler, hidden task queue, workflow replay
  behavior, allowlist mutation behavior, permission policy mutation, risk
  downgrade behavior, confirmation bypass behavior, route auto-run, plugin
  invocation, desktop launch, shell, filesystem search, context polling worker,
  proactive assistant trigger, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, installer, release behavior, model
  training execution, dataset export, or prompt injection behavior was added.
- Training export status is renderer-only and documents that Memory does not
  export saved user records into training datasets, fine-tuning corpora,
  provider upload bundles, prompt/response corpora, evaluator exports, or
  offline ML artifacts in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  source audit and progress-document update for an existing renderer-only status
  projection.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Training export`.
- Confirm the `Training export` value is `DISABLED`.
- Confirm `Model training`, `Provider personalization`, `Analytics profiling`,
  `Cloud storage observation`, `Repository observation`, `Legal document
  observation`, `Financial account observation`, `Government ID observation`,
  `Biometric observation`, `Health observation`, `Payment observation`,
  `Credential observation`, `Messaging observation`, `Email observation`,
  `Calendar observation`, `Contacts observation`, `Location observation`,
  `Browser history observation`, `Microphone observation`, `Camera observation`,
  `File observation`, `Screen observation`, `Window observation`, `Keystroke
  observation`, `Clipboard observation`, `External triggers`, `Outbound
  messaging`, `Autonomous follow-up`, `Reminder scheduling`, `Background task
  creation`, `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`,
  `Risk downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no training export job, dataset export job, fine-tuning corpus writer,
  prompt/response corpus exporter, provider upload bundle, evaluator export,
  offline ML artifact writer, labeling queue, model training job, provider
  training upload, telemetry expansion, provider sync, import/export,
  background execution, plugin invocation, desktop launch, shell execution,
  filesystem search, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 source audit with local build/test verification for an existing renderer
  projection.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  payment observation controls, health observation controls, biometric
  observation controls, government ID observation controls, financial account
  observation controls, legal document observation controls, repository
  observation controls, cloud storage observation controls, analytics profiling
  controls, model training controls, training export controls, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Model Training Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Audited the existing renderer-local Memory boundary projection that explicitly
shows model training as disabled. This keeps the Memory surface state clear that
saved aliases, preferences, future workflow records, skin, pet, or personality
records do not feed model training, fine-tuning, reinforcement learning,
personalization datasets, provider training jobs, or offline training exports
from this path.

Scope completed:
- Confirmed the existing `Model training` Memory boundary panel row remains
  projected with `DISABLED` status.
- Reused the existing Memory boundary projection pattern and source assertion;
  no runtime behavior was changed.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, health observation status,
  biometric observation status, government ID observation status, financial
  account observation status, legal document observation status, repository
  observation status, cloud storage observation status, analytics profiling
  status, access status projections, sharing status, provider sync status,
  export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, model training job, fine-tuning job,
  reinforcement learning job, personalization dataset, provider training
  upload, offline training export, dataset builder, labeling queue, evaluator
  export, prompt/response corpus export, analytics profile store,
  behavior-profile builder, engagement-profile builder, advertising segment
  builder, churn-score builder, product analytics identity, cross-session
  profiler, telemetry expansion, event upload, analytics SDK, tracking pixel,
  remote analytics destination, cloud-drive reader, repository scanner,
  git-history reader, file content reader, contract reader, bank-account reader,
  identity-document reader, health-record reader, payment sender, payment
  reader, credential reader, SMS reader, chat app reader, mailbox reader,
  calendar event reader, contact list reader, browser profile reader, browser
  history reader, tab observer, cookie reader, session reader, browsing state
  ingestion path, browser extension, browser automation, browser launch, URL
  opening, continuous listener, microphone frame capture path, voice provider
  call, ASR provider call, TTS provider call, webcam access path, camera capture
  path, directory watcher, screenshot capture path, screen sampler,
  active-window watcher, window-title reader, keyboard hook, keylogger,
  clipboard watcher, webhook subscription, remote event listener, plugin event
  listener, external trigger registry, outbound message sender, chat sender,
  external notification sender, autonomous follow-up worker, reminder
  scheduler, background task scheduler, hidden task queue, workflow replay
  behavior, allowlist mutation behavior, permission policy mutation, risk
  downgrade behavior, confirmation bypass behavior, route auto-run, plugin
  invocation, desktop launch, shell, filesystem search, context polling worker,
  proactive assistant trigger, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, installer, release behavior, model
  training execution, dataset export, or prompt injection behavior was added.
- Model training status is renderer-only and documents that Memory does not
  feed training, fine-tuning, reinforcement learning, provider training jobs, or
  offline training exports in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Model training`.
- Confirm the `Model training` value is `DISABLED`.
- Confirm `Analytics profiling`, `Cloud storage observation`, `Repository
  observation`, `Legal document observation`, `Financial account observation`,
  `Government ID observation`, `Biometric observation`, `Health observation`,
  `Payment observation`, `Credential observation`, `Messaging observation`,
  `Email observation`, `Calendar observation`, `Contacts observation`,
  `Location observation`, `Browser history observation`, `Microphone
  observation`, `Camera observation`, `File observation`, `Screen observation`,
  `Window observation`, `Keystroke observation`, `Clipboard observation`,
  `External triggers`, `Outbound messaging`, `Autonomous follow-up`, `Reminder
  scheduling`, `Background task creation`, `Workflow replay`, `Allowlist
  mutation`, `Confirmation bypass`, `Risk downgrade`, `Permission override`,
  `Auto execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no model training job, fine-tuning job, reinforcement learning job,
  personalization dataset, provider training upload, offline training export,
  dataset builder, labeling queue, evaluator export, prompt/response corpus
  export, analytics profile store, behavior-profile builder, engagement profile
  builder, advertising segment, churn score, analytics identity, cross-session
  profiler, telemetry expansion, event upload, analytics SDK, tracking pixel,
  remote analytics destination, background execution, plugin invocation,
  desktop launch, shell execution, filesystem search, provider upload, provider
  sync, import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  payment observation controls, health observation controls, biometric
  observation controls, government ID observation controls, financial account
  observation controls, legal document observation controls, repository
  observation controls, cloud storage observation controls, analytics profiling
  controls, model training controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Analytics Profiling Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows analytics
profiling as disabled. This makes the Memory surface state that saved aliases,
preferences, future workflow records, skin, pet, or personality records do not
build behavior profiles, engagement profiles, advertising segments, churn
scores, product analytics identities, or cross-session user profiles from this
path.

Scope completed:
- Added `Analytics profiling` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, health observation status,
  biometric observation status, government ID observation status, financial
  account observation status, legal document observation status, repository
  observation status, cloud storage observation status, access status
  projections, sharing status, provider sync status, export/import status,
  snapshot controls, Task Runtime storage, provider/runtime projections, and
  safety gates unchanged.

Safety boundaries:
- No backend persistence schema, analytics profile store, behavior-profile
  builder, engagement-profile builder, advertising segment builder, churn-score
  builder, product analytics identity, cross-session profiler, telemetry
  expansion, event upload, analytics SDK, tracking pixel, remote analytics
  destination, cloud-drive reader, repository scanner, git-history reader, file
  content reader, contract reader, bank-account reader, identity-document
  reader, health-record reader, payment sender, payment reader, credential
  reader, SMS reader, chat app reader, mailbox reader, calendar event reader,
  contact list reader, browser profile reader, browser history reader, tab
  observer, cookie reader, session reader, browsing state ingestion path,
  browser extension, browser automation, browser launch, URL opening,
  continuous listener, microphone frame capture path, voice provider call, ASR
  provider call, TTS provider call, webcam access path, camera capture path,
  directory watcher, screenshot capture path, screen sampler, active-window
  watcher, window-title reader, keyboard hook, keylogger, clipboard watcher,
  webhook subscription, remote event listener, plugin event listener, external
  trigger registry, outbound message sender, chat sender, external notification
  sender, autonomous follow-up worker, reminder scheduler, background task
  scheduler, hidden task queue, workflow replay behavior, allowlist mutation
  behavior, permission policy mutation, risk downgrade behavior, confirmation
  bypass behavior, route auto-run, plugin invocation, desktop launch, shell,
  filesystem search, context polling worker, proactive assistant trigger,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, installer, release behavior, model training, dataset export, or
  prompt injection behavior was added.
- Analytics profiling status is renderer-only and documents that Memory does
  not build behavior profiles, engagement profiles, advertising segments, churn
  scores, product analytics identities, or cross-session user profiles in this
  UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Analytics profiling`.
- Confirm the `Analytics profiling` value is `DISABLED`.
- Confirm `Cloud storage observation`, `Repository observation`, `Legal document
  observation`, `Financial account observation`, `Government ID observation`,
  `Biometric observation`, `Health observation`, `Payment observation`,
  `Credential observation`, `Messaging observation`, `Email observation`,
  `Calendar observation`, `Contacts observation`, `Location observation`,
  `Browser history observation`, `Microphone observation`, `Camera observation`,
  `File observation`, `Screen observation`, `Window observation`, `Keystroke
  observation`, `Clipboard observation`, `External triggers`, `Outbound
  messaging`, `Autonomous follow-up`, `Reminder scheduling`, `Background task
  creation`, `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`,
  `Risk downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no analytics profile store, behavior-profile builder, engagement
  profile builder, advertising segment builder, churn-score builder, analytics
  identity, cross-session profiler, telemetry expansion, event upload,
  analytics SDK, tracking pixel, remote analytics destination, cloud connector,
  repository scanner, background execution, plugin invocation, desktop launch,
  shell execution, filesystem search, provider upload, provider sync,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  payment observation controls, health observation controls, biometric
  observation controls, government ID observation controls, financial account
  observation controls, legal document observation controls, repository
  observation controls, cloud storage observation controls, analytics profiling
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Cloud Storage Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows cloud
storage observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not read cloud drives, synced folders, remote file metadata, shared
documents, provider file lists, or cloud storage activity from this path.

Scope completed:
- Added `Cloud storage observation` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, health observation status,
  biometric observation status, government ID observation status, financial
  account observation status, legal document observation status, repository
  observation status, access status projections, sharing status, provider sync
  status, export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, cloud-drive reader, synced-folder reader,
  remote-file-metadata reader, shared-document reader, provider-file-list
  reader, cloud-activity reader, Google Drive connector call, OneDrive
  connector call, Dropbox connector call, SharePoint connector call, Box
  connector call, cloud sync job, repository scanner, git-history reader, diff
  reader, filesystem crawler, file content reader, contract reader,
  bank-account reader, identity-document reader, health-record reader, payment
  sender, payment reader, credential reader, SMS reader, chat app reader,
  mailbox reader, calendar event reader, contact list reader, browser profile
  reader, browser history reader, tab observer, cookie reader, session reader,
  browsing state ingestion path, browser extension, browser automation, browser
  launch, URL opening, continuous listener, microphone frame capture path,
  voice provider call, ASR provider call, TTS provider call, webcam access path,
  camera capture path, directory watcher, screenshot capture path, screen
  sampler, active-window watcher, window-title reader, keyboard hook,
  keylogger, clipboard watcher, webhook subscription, remote event listener,
  plugin event listener, external trigger registry, outbound message sender,
  chat sender, external notification sender, autonomous follow-up worker,
  reminder scheduler, background task scheduler, hidden task queue, workflow
  replay behavior, allowlist mutation behavior, permission policy mutation,
  risk downgrade behavior, confirmation bypass behavior, route auto-run, plugin
  invocation, desktop launch, shell, filesystem search, context polling worker,
  proactive assistant trigger, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, telemetry, installer, release behavior,
  model training, dataset export, or prompt injection behavior was added.
- Cloud storage observation status is renderer-only and documents that Memory
  does not read cloud drives, synced folders, remote file metadata, shared
  documents, provider file lists, or cloud storage activity in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Cloud storage observation`.
- Confirm the `Cloud storage observation` value is `DISABLED`.
- Confirm `Repository observation`, `Legal document observation`, `Financial
  account observation`, `Government ID observation`, `Biometric observation`,
  `Health observation`, `Payment observation`, `Credential observation`,
  `Messaging observation`, `Email observation`, `Calendar observation`,
  `Contacts observation`, `Location observation`, `Browser history
  observation`, `Microphone observation`, `Camera observation`, `File
  observation`, `Screen observation`, `Window observation`, `Keystroke
  observation`, `Clipboard observation`, `External triggers`, `Outbound
  messaging`, `Autonomous follow-up`, `Reminder scheduling`, `Background task
  creation`, `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`,
  `Risk downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no cloud-drive reader, synced-folder reader, remote-file-metadata
  reader, shared-document reader, provider-file-list reader, cloud-activity
  reader, Google Drive/OneDrive/Dropbox/SharePoint/Box connector call, cloud
  sync job, repository scanner, filesystem crawler, background execution,
  plugin invocation, desktop launch, shell execution, filesystem search,
  provider upload, provider sync, import/export, or external destination
  controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  payment observation controls, health observation controls, biometric
  observation controls, government ID observation controls, financial account
  observation controls, legal document observation controls, repository
  observation controls, cloud storage observation controls, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Repository Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
repository observation as disabled. This makes the Memory surface state that
saved aliases, preferences, future workflow records, skin, pet, or personality
records do not read source repositories, git history, diffs, commits, branches,
issues, pull requests, review comments, or code search results from this path.

Scope completed:
- Added `Repository observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, health observation status,
  biometric observation status, government ID observation status, financial
  account observation status, legal document observation status, access status
  projections, sharing status, provider sync status, export/import status,
  snapshot controls, Task Runtime storage, provider/runtime projections, and
  safety gates unchanged.

Safety boundaries:
- No backend persistence schema, repository scanner, git-history reader, diff
  reader, commit reader, branch reader, issue reader, pull-request reader,
  review-comment reader, code-search reader, GitHub connector call, local git
  command, filesystem crawler, file content reader, contract reader,
  court-filing reader, legal-notice reader, bank-account reader,
  brokerage-account reader, identity-document reader, face-template reader,
  fingerprint reader, voiceprint reader, health-record reader, payment sender,
  payment reader, credential reader, SMS reader, chat app reader, mailbox
  reader, calendar event reader, contact list reader, browser profile reader,
  browser history reader, tab observer, cookie reader, session reader, browsing
  state ingestion path, browser extension, browser automation, browser launch,
  URL opening, continuous listener, microphone frame capture path, voice
  provider call, ASR provider call, TTS provider call, webcam access path,
  camera capture path, directory watcher, screenshot capture path, screen
  sampler, active-window watcher, window-title reader, keyboard hook,
  keylogger, clipboard watcher, webhook subscription, remote event listener,
  plugin event listener, external trigger registry, outbound message sender,
  chat sender, external notification sender, autonomous follow-up worker,
  reminder scheduler, background task scheduler, hidden task queue, workflow
  replay behavior, allowlist mutation behavior, permission policy mutation,
  risk downgrade behavior, confirmation bypass behavior, route auto-run, plugin
  invocation, desktop launch, shell, filesystem search, context polling worker,
  proactive assistant trigger, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, telemetry, installer, release behavior,
  model training, dataset export, or prompt injection behavior was added.
- Repository observation status is renderer-only and documents that Memory does
  not read source repositories, git history, diffs, commits, branches, issues,
  pull requests, review comments, or code search results in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Repository observation`.
- Confirm the `Repository observation` value is `DISABLED`.
- Confirm `Legal document observation`, `Financial account observation`,
  `Government ID observation`, `Biometric observation`, `Health observation`,
  `Payment observation`, `Credential observation`, `Messaging observation`,
  `Email observation`, `Calendar observation`, `Contacts observation`,
  `Location observation`, `Browser history observation`, `Microphone
  observation`, `Camera observation`, `File observation`, `Screen observation`,
  `Window observation`, `Keystroke observation`, `Clipboard observation`,
  `External triggers`, `Outbound messaging`, `Autonomous follow-up`, `Reminder
  scheduling`, `Background task creation`, `Workflow replay`, `Allowlist
  mutation`, `Confirmation bypass`, `Risk downgrade`, `Permission override`,
  `Auto execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no repository scanner, git-history reader, diff reader, commit
  reader, issue reader, pull-request reader, review-comment reader, code-search
  reader, GitHub connector call, local git command, filesystem crawler,
  background execution, plugin invocation, desktop launch, shell execution,
  filesystem search, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  payment observation controls, health observation controls, biometric
  observation controls, government ID observation controls, financial account
  observation controls, legal document observation controls, repository
  observation controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Legal Document Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows legal
document observation as disabled. This makes the Memory surface state that
saved aliases, preferences, future workflow records, skin, pet, or personality
records do not read contracts, court filings, legal notices, settlement drafts,
case files, attorney communications, compliance files, or signed documents from
this path.

Scope completed:
- Added `Legal document observation` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, health observation status,
  biometric observation status, government ID observation status, financial
  account observation status, access status projections, sharing status,
  provider sync status, export/import status, snapshot controls, Task Runtime
  storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, contract reader, court-filing reader,
  legal-notice reader, settlement-draft reader, case-file reader,
  attorney-communication reader, compliance-file reader, signed-document
  reader, bank-account reader, brokerage-account reader, card-number reader,
  account-balance reader, statement reader, transaction reader,
  identity-document reader, passport-number reader, driver-license reader,
  national-ID reader, face-template reader, fingerprint reader, voiceprint
  reader, iris-scan reader, biometric prompt reader, health-record reader,
  payment sender, payment reader, credential reader, SMS reader, chat app
  reader, mailbox reader, calendar event reader, contact list reader, browser
  profile reader, browser history reader, tab observer, cookie reader, session
  reader, browsing state ingestion path, browser extension, browser automation,
  browser launch, URL opening, continuous listener, microphone frame capture
  path, voice provider call, ASR provider call, TTS provider call, webcam
  access path, camera capture path, directory watcher, filesystem crawler, file
  content reader, screenshot capture path, screen sampler, active-window
  watcher, window-title reader, keyboard hook, keylogger, clipboard watcher,
  webhook subscription, remote event listener, plugin event listener, external
  trigger registry, outbound message sender, chat sender, external notification
  sender, autonomous follow-up worker, reminder scheduler, background task
  scheduler, hidden task queue, workflow replay behavior, allowlist mutation
  behavior, permission policy mutation, risk downgrade behavior, confirmation
  bypass behavior, route auto-run, plugin invocation, desktop launch, shell,
  filesystem search, context polling worker, proactive assistant trigger,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Legal document observation status is renderer-only and documents that Memory
  does not read contracts, court filings, legal notices, settlement drafts,
  case files, attorney communications, compliance files, or signed documents in
  this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Legal document observation`.
- Confirm the `Legal document observation` value is `DISABLED`.
- Confirm `Financial account observation`, `Government ID observation`,
  `Biometric observation`, `Health observation`, `Payment observation`,
  `Credential observation`, `Messaging observation`, `Email observation`,
  `Calendar observation`, `Contacts observation`, `Location observation`,
  `Browser history observation`, `Microphone observation`, `Camera
  observation`, `File observation`, `Screen observation`, `Window observation`,
  `Keystroke observation`, `Clipboard observation`, `External triggers`,
  `Outbound messaging`, `Autonomous follow-up`, `Reminder scheduling`,
  `Background task creation`, `Workflow replay`, `Allowlist mutation`,
  `Confirmation bypass`, `Risk downgrade`, `Permission override`, `Auto
  execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no contract reader, court-filing reader, legal-notice reader,
  settlement-draft reader, case-file reader, attorney-communication reader,
  compliance-file reader, signed-document reader, financial account reader,
  identity-document reader, biometric reader, health reader, credential reader,
  background execution, plugin invocation, desktop launch, shell execution,
  filesystem search, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  payment observation controls, health observation controls, biometric
  observation controls, government ID observation controls, financial account
  observation controls, legal document observation controls, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Financial Account Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
financial account observation as disabled. This makes the Memory surface state
that saved aliases, preferences, future workflow records, skin, pet, or
personality records do not read bank accounts, brokerage accounts, card
numbers, account balances, statements, transactions, invoices, tax forms, or
payment instruments from this path.

Scope completed:
- Added `Financial account observation` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, health observation status,
  biometric observation status, government ID observation status, access status
  projections, sharing status, provider sync status, export/import status,
  snapshot controls, Task Runtime storage, provider/runtime projections, and
  safety gates unchanged.

Safety boundaries:
- No backend persistence schema, bank-account reader, brokerage-account reader,
  card-number reader, account-balance reader, statement reader, transaction
  reader, invoice reader, tax-form reader, payment-instrument reader,
  identity-document reader, passport-number reader, driver-license reader,
  national-ID reader, tax-ID reader, resident-permit reader, document-scan
  reader, identity-verification session reader, face-template reader,
  fingerprint reader, voiceprint reader, iris-scan reader, biometric prompt
  reader, health-record reader, payment sender, payment reader, credential
  reader, SMS reader, chat app reader, mailbox reader, calendar event reader,
  contact list reader, browser profile reader, browser history reader, tab
  observer, cookie reader, session reader, browsing state ingestion path,
  browser extension, browser automation, browser launch, URL opening,
  continuous listener, microphone frame capture path, voice provider call, ASR
  provider call, TTS provider call, webcam access path, camera capture path,
  directory watcher, filesystem crawler, file content reader, screenshot
  capture path, screen sampler, active-window watcher, window-title reader,
  keyboard hook, keylogger, clipboard watcher, webhook subscription, remote
  event listener, plugin event listener, external trigger registry, outbound
  message sender, chat sender, external notification sender, autonomous
  follow-up worker, reminder scheduler, background task scheduler, hidden task
  queue, workflow replay behavior, allowlist mutation behavior, permission
  policy mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, plugin invocation, desktop launch, shell, filesystem search,
  context polling worker, proactive assistant trigger, provider sync job,
  credential storage, network destination, import/export path, provider call,
  prompt assembly, Qwen runtime, vector retrieval, Planner behavior, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Financial account observation status is renderer-only and documents that
  Memory does not read bank accounts, brokerage accounts, card numbers, account
  balances, statements, transactions, invoices, tax forms, or payment
  instruments in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Financial account observation`.
- Confirm the `Financial account observation` value is `DISABLED`.
- Confirm `Government ID observation`, `Biometric observation`, `Health
  observation`, `Payment observation`, `Credential observation`, `Messaging
  observation`, `Email observation`, `Calendar observation`, `Contacts
  observation`, `Location observation`, `Browser history observation`,
  `Microphone observation`, `Camera observation`, `File observation`, `Screen
  observation`, `Window observation`, `Keystroke observation`, `Clipboard
  observation`, `External triggers`, `Outbound messaging`, `Autonomous
  follow-up`, `Reminder scheduling`, `Background task creation`, `Workflow
  replay`, `Allowlist mutation`, `Confirmation bypass`, `Risk downgrade`,
  `Permission override`, `Auto execution`, `Context polling`, `Proactive scan`,
  and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no bank-account reader, brokerage-account reader, card-number reader,
  balance reader, statement reader, transaction reader, invoice reader,
  tax-form reader, payment-instrument reader, payment sender, identity-document
  reader, biometric reader, health reader, credential reader, background
  execution, plugin invocation, desktop launch, shell execution, filesystem
  search, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  payment observation controls, health observation controls, biometric
  observation controls, government ID observation controls, financial account
  observation controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Government ID Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
government ID observation as disabled. This makes the Memory surface state that
saved aliases, preferences, future workflow records, skin, pet, or personality
records do not read identity documents, passport numbers, driver licenses,
national IDs, tax IDs, resident permits, document scans, or verification
sessions from this path.

Scope completed:
- Added `Government ID observation` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, health observation status,
  biometric observation status, access status projections, sharing status,
  provider sync status, export/import status, snapshot controls, Task Runtime
  storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, identity-document reader, passport-number
  reader, driver-license reader, national-ID reader, tax-ID reader,
  resident-permit reader, document-scan reader, identity-verification session
  reader, face-template reader, fingerprint reader, voiceprint reader,
  iris-scan reader, biometric prompt reader, health-record reader, payment
  reader, credential reader, SMS reader, chat app reader, mailbox reader,
  calendar event reader, contact list reader, browser profile reader, browser
  history reader, tab observer, cookie reader, session reader, browsing state
  ingestion path, browser extension, browser automation, browser launch, URL
  opening, continuous listener, microphone frame capture path, voice provider
  call, ASR provider call, TTS provider call, webcam access path, camera capture
  path, directory watcher, filesystem crawler, file content reader, screenshot
  capture path, screen sampler, active-window watcher, window-title reader,
  keyboard hook, keylogger, clipboard watcher, webhook subscription, remote
  event listener, plugin event listener, external trigger registry, outbound
  message sender, chat sender, external notification sender, autonomous
  follow-up worker, reminder scheduler, background task scheduler, hidden task
  queue, workflow replay behavior, allowlist mutation behavior, permission
  policy mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, plugin invocation, desktop launch, shell, filesystem search,
  context polling worker, proactive assistant trigger, provider sync job,
  credential storage, network destination, import/export path, provider call,
  prompt assembly, Qwen runtime, vector retrieval, Planner behavior, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Government ID observation status is renderer-only and documents that Memory
  does not read identity documents, passport numbers, driver licenses, national
  IDs, tax IDs, resident permits, document scans, or verification sessions in
  this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Government ID observation`.
- Confirm the `Government ID observation` value is `DISABLED`.
- Confirm `Biometric observation`, `Health observation`, `Payment observation`,
  `Credential observation`, `Messaging observation`, `Email observation`,
  `Calendar observation`, `Contacts observation`, `Location observation`,
  `Browser history observation`, `Microphone observation`, `Camera
  observation`, `File observation`, `Screen observation`, `Window observation`,
  `Keystroke observation`, `Clipboard observation`, `External triggers`,
  `Outbound messaging`, `Autonomous follow-up`, `Reminder scheduling`,
  `Background task creation`, `Workflow replay`, `Allowlist mutation`,
  `Confirmation bypass`, `Risk downgrade`, `Permission override`, `Auto
  execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no identity-document reader, passport-number reader, driver-license
  reader, national-ID reader, tax-ID reader, resident-permit reader,
  document-scan reader, identity-verification reader, biometric reader, health
  reader, payment reader, credential reader, background execution, plugin
  invocation, desktop launch, shell execution, filesystem search, provider
  upload, provider sync, cloud sync, plugin upload, import/export, or external
  destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  payment observation controls, health observation controls, biometric
  observation controls, government ID observation controls, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Biometric Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows biometric
observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not read face templates, fingerprints, voiceprints, iris scans,
device biometric prompts, authentication biometrics, or biometric enrollment
state from this path.

Scope completed:
- Added `Biometric observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, health observation status,
  access status projections, sharing status, provider sync status,
  export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, face-template reader, fingerprint reader,
  voiceprint reader, iris-scan reader, biometric prompt reader, authentication
  biometric reader, biometric enrollment reader, health-record reader, payment
  reader, credential reader, SMS reader, chat app reader, mailbox reader,
  calendar event reader, contact list reader, browser profile reader, browser
  history reader, tab observer, cookie reader, session reader, browsing state
  ingestion path, browser extension, browser automation, browser launch, URL
  opening, continuous listener, microphone frame capture path, voice provider
  call, ASR provider call, TTS provider call, webcam access path, camera capture
  path, directory watcher, filesystem crawler, file content reader, screenshot
  capture path, screen sampler, active-window watcher, window-title reader,
  keyboard hook, keylogger, clipboard watcher, webhook subscription, remote
  event listener, plugin event listener, external trigger registry, outbound
  message sender, chat sender, external notification sender, autonomous
  follow-up worker, reminder scheduler, background task scheduler, hidden task
  queue, workflow replay behavior, allowlist mutation behavior, permission
  policy mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, plugin invocation, desktop launch, shell, filesystem search,
  context polling worker, proactive assistant trigger, provider sync job,
  credential storage, network destination, import/export path, provider call,
  prompt assembly, Qwen runtime, vector retrieval, Planner behavior, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Biometric observation status is renderer-only and documents that Memory does
  not read face templates, fingerprints, voiceprints, iris scans, device
  biometric prompts, authentication biometrics, or biometric enrollment state in
  this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Biometric observation`.
- Confirm the `Biometric observation` value is `DISABLED`.
- Confirm `Health observation`, `Payment observation`, `Credential observation`,
  `Messaging observation`, `Email observation`, `Calendar observation`,
  `Contacts observation`, `Location observation`, `Browser history
  observation`, `Microphone observation`, `Camera observation`, `File
  observation`, `Screen observation`, `Window observation`, `Keystroke
  observation`, `Clipboard observation`, `External triggers`, `Outbound
  messaging`, `Autonomous follow-up`, `Reminder scheduling`, `Background task
  creation`, `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`,
  `Risk downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no face-template reader, fingerprint reader, voiceprint reader,
  iris-scan reader, biometric prompt reader, authentication biometric reader,
  biometric enrollment reader, health reader, payment reader, credential
  reader, background execution, plugin invocation, desktop launch, shell
  execution, filesystem search, provider upload, provider sync, cloud sync,
  plugin upload, import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  payment observation controls, health observation controls, biometric
  observation controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Health Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows health
observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not read health records, medical files, fitness data, sleep data,
insurance records, prescriptions, diagnoses, or wearable device data from this
path.

Scope completed:
- Added `Health observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, payment observation status, access status projections,
  sharing status, provider sync status, export/import status, snapshot
  controls, Task Runtime storage, provider/runtime projections, and safety
  gates unchanged.

Safety boundaries:
- No backend persistence schema, health-record reader, medical-file reader,
  fitness-data reader, sleep-data reader, insurance-record reader,
  prescription reader, diagnosis reader, wearable-device reader, payment
  reader, credential reader, SMS reader, chat app reader, mailbox reader,
  calendar event reader, contact list reader, browser profile reader, browser
  history reader, tab observer, cookie reader, session reader, browsing state
  ingestion path, browser extension, browser automation, browser launch, URL
  opening, continuous listener, microphone frame capture path, voice provider
  call, ASR provider call, TTS provider call, webcam access path, camera capture
  path, directory watcher, filesystem crawler, file content reader, screenshot
  capture path, screen sampler, active-window watcher, window-title reader,
  keyboard hook, keylogger, clipboard watcher, webhook subscription, remote
  event listener, plugin event listener, external trigger registry, outbound
  message sender, chat sender, external notification sender, autonomous
  follow-up worker, reminder scheduler, background task scheduler, hidden task
  queue, workflow replay behavior, allowlist mutation behavior, permission
  policy mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, plugin invocation, desktop launch, shell, filesystem search,
  context polling worker, proactive assistant trigger, provider sync job,
  credential storage, network destination, import/export path, provider call,
  prompt assembly, Qwen runtime, vector retrieval, Planner behavior, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Health observation status is renderer-only and documents that Memory does not
  read health records, medical files, fitness data, sleep data, insurance
  records, prescriptions, diagnoses, or wearable device data in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Health observation`.
- Confirm the `Health observation` value is `DISABLED`.
- Confirm `Payment observation`, `Credential observation`, `Messaging
  observation`, `Email observation`, `Calendar observation`, `Contacts
  observation`, `Location observation`, `Browser history observation`,
  `Microphone observation`, `Camera observation`, `File observation`, `Screen
  observation`, `Window observation`, `Keystroke observation`, `Clipboard
  observation`, `External triggers`, `Outbound messaging`, `Autonomous
  follow-up`, `Reminder scheduling`, `Background task creation`, `Workflow
  replay`, `Allowlist mutation`, `Confirmation bypass`, `Risk downgrade`,
  `Permission override`, `Auto execution`, `Context polling`, `Proactive scan`,
  and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no health-record reader, medical-file reader, fitness/sleep reader,
  insurance reader, prescription reader, diagnosis reader, wearable-device
  reader, payment reader, credential reader, background execution, plugin
  invocation, desktop launch, shell execution, filesystem search, provider
  upload, provider sync, cloud sync, plugin upload, import/export, or external
  destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  payment observation controls, health observation controls, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Payment Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows payment
observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not read bank cards, payment accounts, checkout state, orders,
transactions, invoices, wallet balances, billing profiles, or payment
authorizations from this path.

Scope completed:
- Added `Payment observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, credential
  observation status, access status projections, sharing status, provider sync
  status, export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, bank-card reader, payment-account reader,
  checkout-state reader, order reader, transaction reader, invoice reader,
  wallet-balance reader, billing-profile reader, payment-authorization reader,
  payment provider call, checkout action, order action, payment action,
  credential reader, SMS reader, chat app reader, direct-message reader,
  mailbox reader, email message reader, calendar event reader, contact list
  reader, browser profile reader, browser history reader, tab observer, cookie
  reader, session reader, browsing state ingestion path, browser extension,
  browser automation, browser launch, URL opening, continuous listener,
  microphone frame capture path, voice provider call, ASR provider call, TTS
  provider call, webcam access path, camera capture path, directory watcher,
  filesystem crawler, file content reader, screenshot capture path, screen
  sampler, active-window watcher, window-title reader, keyboard hook,
  keylogger, clipboard watcher, webhook subscription, remote event listener,
  plugin event listener, external trigger registry, outbound message sender,
  chat sender, external notification sender, autonomous follow-up worker,
  reminder scheduler, background task scheduler, hidden task queue, workflow
  replay behavior, allowlist mutation behavior, permission policy mutation,
  risk downgrade behavior, confirmation bypass behavior, route auto-run,
  plugin invocation, desktop launch, shell, filesystem search, context polling
  worker, proactive assistant trigger, provider sync job, credential storage,
  network destination, import/export path, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Payment observation status is renderer-only and documents that Memory does
  not read bank cards, payment accounts, checkout state, orders, transactions,
  invoices, wallet balances, billing profiles, or payment authorizations in
  this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Payment observation`.
- Confirm the `Payment observation` value is `DISABLED`.
- Confirm `Credential observation`, `Messaging observation`, `Email
  observation`, `Calendar observation`, `Contacts observation`, `Location
  observation`, `Browser history observation`, `Microphone observation`,
  `Camera observation`, `File observation`, `Screen observation`, `Window
  observation`, `Keystroke observation`, `Clipboard observation`, `External
  triggers`, `Outbound messaging`, `Autonomous follow-up`, `Reminder
  scheduling`, `Background task creation`, `Workflow replay`, `Allowlist
  mutation`, `Confirmation bypass`, `Risk downgrade`, `Permission override`,
  `Auto execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no bank-card reader, payment-account reader, checkout-state reader,
  order reader, transaction reader, invoice reader, wallet-balance reader,
  billing-profile reader, payment-authorization reader, payment provider call,
  checkout action, order action, payment action, credential reader, background
  execution, plugin invocation, desktop launch, shell execution, filesystem
  search, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  payment observation controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Credential Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
credential observation as disabled. This makes the Memory surface state that
saved aliases, preferences, future workflow records, skin, pet, or personality
records do not read passwords, API keys, tokens, authentication headers,
credential vault entries, secret environment variables, or secure provider
stores from this path.

Scope completed:
- Added `Credential observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, messaging observation status, access status
  projections, sharing status, provider sync status, export/import status,
  snapshot controls, Task Runtime storage, provider/runtime projections, and
  safety gates unchanged.

Safety boundaries:
- No backend persistence schema, password reader, API key reader, token reader,
  authentication-header reader, credential vault reader, secret environment
  variable reader, secure provider store reader, SMS reader, chat app reader,
  direct-message reader, notification message reader, mailbox reader, email
  message reader, calendar event reader, contact list reader, browser profile
  reader, browser history reader, tab observer, cookie reader, session reader,
  browsing state ingestion path, browser extension, browser automation, browser
  launch, URL opening, continuous listener, microphone frame capture path,
  voice provider call, ASR provider call, TTS provider call, webcam access path,
  camera capture path, directory watcher, filesystem crawler, file content
  reader, screenshot capture path, screen sampler, active-window watcher,
  window-title reader, keyboard hook, keylogger, clipboard watcher, webhook
  subscription, remote event listener, plugin event listener, external trigger
  registry, outbound message sender, chat sender, external notification sender,
  autonomous follow-up worker, reminder scheduler, background task scheduler,
  hidden task queue, workflow replay behavior, allowlist mutation behavior,
  permission policy mutation, risk downgrade behavior, confirmation bypass
  behavior, route auto-run, plugin invocation, desktop launch, shell,
  filesystem search, context polling worker, proactive assistant trigger,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Credential observation status is renderer-only and documents that Memory does
  not read passwords, API keys, tokens, authentication headers, credential
  vault entries, secret environment variables, or secure provider stores in
  this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Credential observation`.
- Confirm the `Credential observation` value is `DISABLED`.
- Confirm `Messaging observation`, `Email observation`, `Calendar observation`,
  `Contacts observation`, `Location observation`, `Browser history
  observation`, `Microphone observation`, `Camera observation`, `File
  observation`, `Screen observation`, `Window observation`, `Keystroke
  observation`, `Clipboard observation`, `External triggers`, `Outbound
  messaging`, `Autonomous follow-up`, `Reminder scheduling`, `Background task
  creation`, `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`,
  `Risk downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no password reader, API key reader, token reader,
  authentication-header reader, credential vault reader, secret environment
  variable reader, secure provider store reader, SMS/chat reader, mailbox/email
  reader, calendar reader, contacts reader, browser reader, background
  execution, plugin invocation, desktop launch, shell execution, filesystem
  search, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, credential observation controls,
  and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Messaging Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
messaging observation as disabled. This makes the Memory surface state that
saved aliases, preferences, future workflow records, skin, pet, or personality
records do not read SMS, chat apps, direct messages, notification message
content, message threads, sender lists, or unread counts from this path.

Scope completed:
- Added `Messaging observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  email observation status, access status projections, sharing status, provider
  sync status, export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, SMS reader, chat app reader, direct-message
  reader, notification message reader, message-thread reader, sender-list
  reader, unread-count reader, mailbox reader, email message reader, subject
  reader, attachment reader, draft reader, recipient reader, email metadata
  reader, email provider call, email sender, calendar event reader, contact
  list reader, address book reader, browser profile reader, browser history
  reader, tab observer, cookie reader, session reader, browsing state ingestion
  path, browser extension, browser automation, browser launch, URL opening,
  continuous listener, microphone frame capture path, voice provider call, ASR
  provider call, TTS provider call, webcam access path, camera capture path,
  directory watcher, filesystem crawler, file content reader, screenshot
  capture path, screen sampler, active-window watcher, window-title reader,
  keyboard hook, keylogger, clipboard watcher, webhook subscription, remote
  event listener, plugin event listener, external trigger registry, outbound
  message sender, chat sender, external notification sender, autonomous
  follow-up worker, reminder scheduler, background task scheduler, hidden task
  queue, workflow replay behavior, allowlist mutation behavior, permission
  policy mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, plugin invocation, desktop launch, shell, filesystem search,
  context polling worker, proactive assistant trigger, provider sync job,
  credential storage, network destination, import/export path, provider call,
  prompt assembly, Qwen runtime, vector retrieval, Planner behavior, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Messaging observation status is renderer-only and documents that Memory does
  not read SMS, chat apps, direct messages, notification message content,
  message threads, sender lists, or unread counts in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Messaging observation`.
- Confirm the `Messaging observation` value is `DISABLED`.
- Confirm `Email observation`, `Calendar observation`, `Contacts observation`,
  `Location observation`, `Browser history observation`, `Microphone
  observation`, `Camera observation`, `File observation`, `Screen observation`,
  `Window observation`, `Keystroke observation`, `Clipboard observation`,
  `External triggers`, `Outbound messaging`, `Autonomous follow-up`, `Reminder
  scheduling`, `Background task creation`, `Workflow replay`, `Allowlist
  mutation`, `Confirmation bypass`, `Risk downgrade`, `Permission override`,
  `Auto execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no SMS reader, chat app reader, direct-message reader, notification
  message reader, message-thread reader, sender-list reader, unread-count
  reader, mailbox/email reader, calendar reader, contacts reader, browser
  reader, background execution, plugin invocation, desktop launch, shell
  execution, filesystem search, provider upload, provider sync, cloud sync,
  plugin upload, import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, messaging observation controls, and release readiness are not
  complete.

## 2026-08-13: User-Controlled Memory Email Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows email
observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not read mailboxes, message bodies, subjects, attachments, drafts,
recipients, or email metadata from this path.

Scope completed:
- Added `Email observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, calendar observation status,
  access status projections, sharing status, provider sync status,
  export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, mailbox reader, email message reader, subject
  reader, attachment reader, draft reader, recipient reader, email metadata
  reader, email provider call, email sender, calendar event reader, meeting
  detail reader, attendee reader, reminder reader, availability reader,
  schedule history reader, calendar sync job, calendar provider call, contact
  list reader, address book reader, chat participant reader, phone number
  reader, social graph reader, geolocation API access, GPS reader, Wi-Fi
  positioning reader, IP geolocation lookup, calendar location reader, place
  history reader, browser profile reader, browser history reader, tab observer,
  cookie reader, session reader, browsing state ingestion path, browser
  extension, browser automation, browser launch, URL opening, continuous
  listener, microphone frame capture path, ambient audio retention path,
  microphone state ingestion path, voice provider call, ASR provider call, TTS
  provider call, webcam access path, camera capture path, camera frame sampler,
  visual input ingestion path, directory watcher, filesystem crawler, file
  content reader, file change subscription, file ingestion path, screenshot
  capture path, screen sampler, pixel reader, screen content watcher, screen
  state ingestion path, active-window watcher, window-title reader, focus
  poller, window state ingestion path, keyboard hook, keylogger, keystroke
  watcher, typed-input ingestion path, clipboard watcher, clipboard poller,
  clipboard reader, clipboard ingestion path, webhook subscription, remote
  event listener, plugin event listener, external trigger registry, outbound
  message sender, chat sender, external notification sender, autonomous
  follow-up worker, conversation continuation scheduler, reminder scheduler,
  timer scheduler, notification scheduler, delayed task queue, background task
  scheduler, hidden task queue, task replay behavior, workflow replay behavior,
  workflow recorder, workflow runner, side-effect replay, allowlist mutation
  behavior, permission policy mutation, risk downgrade behavior, confirmation
  bypass behavior, route auto-run, plugin invocation, desktop launch, shell,
  filesystem search, context polling worker, proactive assistant trigger,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Email observation status is renderer-only and documents that Memory does not
  read mailboxes, message bodies, subjects, attachments, drafts, recipients, or
  email metadata in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Email observation`.
- Confirm the `Email observation` value is `DISABLED`.
- Confirm `Calendar observation`, `Contacts observation`, `Location
  observation`, `Browser history observation`, `Microphone observation`,
  `Camera observation`, `File observation`, `Screen observation`, `Window
  observation`, `Keystroke observation`, `Clipboard observation`, `External
  triggers`, `Outbound messaging`, `Autonomous follow-up`, `Reminder
  scheduling`, `Background task creation`, `Workflow replay`, `Allowlist
  mutation`, `Confirmation bypass`, `Risk downgrade`, `Permission override`,
  `Auto execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no mailbox reader, email message reader, subject reader, attachment
  reader, draft reader, recipient reader, email metadata reader, email provider
  call, email sender, calendar reader, contacts reader, browser reader,
  background execution, plugin invocation, desktop launch, shell execution,
  filesystem search, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, email observation
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Calendar Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows calendar
observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not read calendar events, meeting details, attendees, reminders,
availability, or schedule history from this path.

Scope completed:
- Added `Calendar observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, contacts observation status, access status projections,
  sharing status, provider sync status, export/import status, snapshot
  controls, Task Runtime storage, provider/runtime projections, and safety
  gates unchanged.

Safety boundaries:
- No backend persistence schema, calendar event reader, meeting detail reader,
  attendee reader, reminder reader, availability reader, schedule history
  reader, calendar sync job, calendar provider call, contact list reader,
  address book reader, email recipient reader, chat participant reader, phone
  number reader, social graph reader, geolocation API access, GPS reader,
  Wi-Fi positioning reader, IP geolocation lookup, calendar location reader,
  place history reader, browser profile reader, browser history reader, tab
  observer, cookie reader, session reader, browsing state ingestion path,
  browser extension, browser automation, browser launch, URL opening,
  continuous listener, microphone frame capture path, ambient audio retention
  path, microphone state ingestion path, voice provider call, ASR provider
  call, TTS provider call, webcam access path, camera capture path, camera
  frame sampler, visual input ingestion path, directory watcher, filesystem
  crawler, file content reader, file change subscription, file ingestion path,
  screenshot capture path, screen sampler, pixel reader, screen content
  watcher, screen state ingestion path, active-window watcher, window-title
  reader, focus poller, window state ingestion path, keyboard hook, keylogger,
  keystroke watcher, typed-input ingestion path, clipboard watcher, clipboard
  poller, clipboard reader, clipboard ingestion path, webhook subscription,
  remote event listener, plugin event listener, external trigger registry,
  outbound message sender, email sender, chat sender, external notification
  sender, autonomous follow-up worker, conversation continuation scheduler,
  reminder scheduler, timer scheduler, notification scheduler, delayed task
  queue, background task scheduler, hidden task queue, task replay behavior,
  workflow replay behavior, workflow recorder, workflow runner, side-effect
  replay, allowlist mutation behavior, permission policy mutation, risk
  downgrade behavior, confirmation bypass behavior, route auto-run, plugin
  invocation, desktop launch, shell, filesystem search, context polling worker,
  proactive assistant trigger, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Calendar observation status is renderer-only and documents that Memory does
  not read calendar events, meeting details, attendees, reminders,
  availability, or schedule history in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Calendar observation`.
- Confirm the `Calendar observation` value is `DISABLED`.
- Confirm `Contacts observation`, `Location observation`, `Browser history
  observation`, `Microphone observation`, `Camera observation`, `File
  observation`, `Screen observation`, `Window observation`, `Keystroke
  observation`, `Clipboard observation`, `External triggers`, `Outbound
  messaging`, `Autonomous follow-up`, `Reminder scheduling`, `Background task
  creation`, `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`,
  `Risk downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no calendar event reader, meeting detail reader, attendee reader,
  reminder reader, availability reader, schedule history reader, calendar sync
  job, calendar provider call, contact list reader, address book reader, email
  recipient reader, chat participant reader, phone number reader, social graph
  reader, geolocation API access, GPS reader, Wi-Fi positioning reader, IP
  geolocation lookup, place history reader, browser profile reader, browser
  history reader, tab observer, cookie reader, session reader, browsing state
  ingestion path, browser extension, browser automation, browser launch, URL
  opening, continuous listener, microphone frame capture path, ambient audio
  retention path, microphone state ingestion path, voice provider call, ASR
  provider call, TTS provider call, webcam access path, camera capture path,
  camera frame sampler, visual input ingestion path, directory watcher,
  filesystem crawler, file content reader, file change subscription, file
  ingestion path, screenshot capture path, screen sampler, pixel reader, screen
  content watcher, screen state ingestion path, active-window watcher,
  window-title reader, focus poller, window state ingestion path, keyboard
  hook, keylogger, keystroke watcher, typed-input ingestion path, clipboard
  watcher, clipboard poller, clipboard reader, clipboard ingestion path,
  webhook subscription, remote event listener, plugin event listener, external
  trigger registry, outbound message sender, email sender, chat sender,
  external notification sender, autonomous follow-up worker, conversation
  continuation scheduler, reminder scheduler, timer scheduler, notification
  scheduler, delayed task queue, background task scheduler, hidden task queue,
  workflow recorder, workflow runner, replay action, allowlist editor,
  confirmation policy editor, risk policy editor, permission policy editor,
  memory-triggered execution, background action runner, route auto-run, plugin
  invocation, desktop launch, shell execution, filesystem search, provider
  upload, provider sync, cloud sync, plugin upload, import/export, or external
  destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, calendar observation controls, and release readiness are
  not complete.

## 2026-08-13: User-Controlled Memory Contacts Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows contacts
observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not read contact lists, address books, email recipients, chat
participants, phone numbers, or social graph data from this path.

Scope completed:
- Added `Contacts observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, location
  observation status, access status projections, sharing status, provider sync
  status, export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, contact list reader, address book reader,
  email recipient reader, chat participant reader, phone number reader, social
  graph reader, geolocation API access, GPS reader, Wi-Fi positioning reader,
  IP geolocation lookup, calendar location reader, place history reader,
  browser profile reader, browser history reader, tab observer, cookie reader,
  session reader, browsing state ingestion path, browser extension, browser
  automation, browser launch, URL opening, continuous listener, microphone
  frame capture path, ambient audio retention path, microphone state ingestion
  path, voice provider call, ASR provider call, TTS provider call, webcam
  access path, camera capture path, camera frame sampler, visual input
  ingestion path, directory watcher, filesystem crawler, file content reader,
  file change subscription, file ingestion path, screenshot capture path,
  screen sampler, pixel reader, screen content watcher, screen state ingestion
  path, active-window watcher, window-title reader, focus poller, window state
  ingestion path, keyboard hook, keylogger, keystroke watcher, typed-input
  ingestion path, clipboard watcher, clipboard poller, clipboard reader,
  clipboard ingestion path, webhook subscription, remote event listener, plugin
  event listener, external trigger registry, outbound message sender, email
  sender, chat sender, external notification sender, autonomous follow-up
  worker, conversation continuation scheduler, reminder scheduler, timer
  scheduler, notification scheduler, delayed task queue, background task
  scheduler, hidden task queue, task replay behavior, workflow replay behavior,
  workflow recorder, workflow runner, side-effect replay, allowlist mutation
  behavior, permission policy mutation, risk downgrade behavior, confirmation
  bypass behavior, route auto-run, plugin invocation, desktop launch, shell,
  filesystem search, context polling worker, proactive assistant trigger,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Contacts observation status is renderer-only and documents that Memory does
  not read contact lists, address books, email recipients, chat participants,
  phone numbers, or social graph data in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Contacts observation`.
- Confirm the `Contacts observation` value is `DISABLED`.
- Confirm `Location observation`, `Browser history observation`, `Microphone
  observation`, `Camera observation`, `File observation`, `Screen observation`,
  `Window observation`, `Keystroke observation`, `Clipboard observation`,
  `External triggers`, `Outbound messaging`, `Autonomous follow-up`, `Reminder
  scheduling`, `Background task creation`, `Workflow replay`, `Allowlist
  mutation`, `Confirmation bypass`, `Risk downgrade`, `Permission override`,
  `Auto execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no contact list reader, address book reader, email recipient reader,
  chat participant reader, phone number reader, social graph reader,
  geolocation API access, GPS reader, Wi-Fi positioning reader, IP geolocation
  lookup, calendar location reader, place history reader, browser profile
  reader, browser history reader, tab observer, cookie reader, session reader,
  browsing state ingestion path, browser extension, browser automation, browser
  launch, URL opening, continuous listener, microphone frame capture path,
  ambient audio retention path, microphone state ingestion path, voice provider
  call, ASR provider call, TTS provider call, webcam access path, camera
  capture path, camera frame sampler, visual input ingestion path, directory
  watcher, filesystem crawler, file content reader, file change subscription,
  file ingestion path, screenshot capture path, screen sampler, pixel reader,
  screen content watcher, screen state ingestion path, active-window watcher,
  window-title reader, focus poller, window state ingestion path, keyboard
  hook, keylogger, keystroke watcher, typed-input ingestion path, clipboard
  watcher, clipboard poller, clipboard reader, clipboard ingestion path,
  webhook subscription, remote event listener, plugin event listener, external
  trigger registry, outbound message sender, email sender, chat sender,
  external notification sender, autonomous follow-up worker, conversation
  continuation scheduler, reminder scheduler, timer scheduler, notification
  scheduler, delayed task queue, background task scheduler, hidden task queue,
  workflow recorder, workflow runner, replay action, allowlist editor,
  confirmation policy editor, risk policy editor, permission policy editor,
  memory-triggered execution, background action runner, route auto-run, plugin
  invocation, desktop launch, shell execution, filesystem search, provider
  upload, provider sync, cloud sync, plugin upload, import/export, or external
  destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, contacts
  observation controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Location Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows location
observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not read GPS, Wi-Fi positioning, IP geolocation, address books,
calendar locations, or place history from this path.

Scope completed:
- Added `Location observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, browser history observation status, access
  status projections, sharing status, provider sync status, export/import
  status, snapshot controls, Task Runtime storage, provider/runtime
  projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, geolocation API access, GPS reader, Wi-Fi
  positioning reader, IP geolocation lookup, address book reader, calendar
  location reader, place history reader, browser profile reader, browser
  history reader, tab observer, cookie reader, session reader, browsing state
  ingestion path, browser extension, browser automation, browser launch, URL
  opening, continuous listener, microphone frame capture path, ambient audio
  retention path, microphone state ingestion path, voice provider call, ASR
  provider call, TTS provider call, webcam access path, camera capture path,
  camera frame sampler, visual input ingestion path, directory watcher,
  filesystem crawler, file content reader, file change subscription, file
  ingestion path, screenshot capture path, screen sampler, pixel reader, screen
  content watcher, screen state ingestion path, active-window watcher,
  window-title reader, focus poller, window state ingestion path, keyboard
  hook, keylogger, keystroke watcher, typed-input ingestion path, clipboard
  watcher, clipboard poller, clipboard reader, clipboard ingestion path,
  webhook subscription, remote event listener, plugin event listener, external
  trigger registry, outbound message sender, email sender, chat sender,
  external notification sender, autonomous follow-up worker, conversation
  continuation scheduler, reminder scheduler, timer scheduler, notification
  scheduler, delayed task queue, background task scheduler, hidden task queue,
  task replay behavior, workflow replay behavior, workflow recorder, workflow
  runner, side-effect replay, allowlist mutation behavior, permission policy
  mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, plugin invocation, desktop launch, shell, filesystem search,
  context polling worker, proactive assistant trigger, provider sync job,
  credential storage, network destination, import/export path, provider call,
  prompt assembly, Qwen runtime, vector retrieval, Planner behavior, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Location observation status is renderer-only and documents that Memory does
  not read GPS, Wi-Fi positioning, IP geolocation, address books, calendar
  locations, or place history in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Location observation`.
- Confirm the `Location observation` value is `DISABLED`.
- Confirm `Browser history observation`, `Microphone observation`, `Camera
  observation`, `File observation`, `Screen observation`, `Window observation`,
  `Keystroke observation`, `Clipboard observation`, `External triggers`,
  `Outbound messaging`, `Autonomous follow-up`, `Reminder scheduling`,
  `Background task creation`, `Workflow replay`, `Allowlist mutation`,
  `Confirmation bypass`, `Risk downgrade`, `Permission override`, `Auto
  execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no geolocation API access, GPS reader, Wi-Fi positioning reader, IP
  geolocation lookup, address book reader, calendar location reader, place
  history reader, browser profile reader, browser history reader, tab observer,
  cookie reader, session reader, browsing state ingestion path, browser
  extension, browser automation, browser launch, URL opening, continuous
  listener, microphone frame capture path, ambient audio retention path,
  microphone state ingestion path, voice provider call, ASR provider call, TTS
  provider call, webcam access path, camera capture path, camera frame sampler,
  visual input ingestion path, directory watcher, filesystem crawler, file
  content reader, file change subscription, file ingestion path, screenshot
  capture path, screen sampler, pixel reader, screen content watcher, screen
  state ingestion path, active-window watcher, window-title reader, focus
  poller, window state ingestion path, keyboard hook, keylogger, keystroke
  watcher, typed-input ingestion path, clipboard watcher, clipboard poller,
  clipboard reader, clipboard ingestion path, webhook subscription, remote
  event listener, plugin event listener, external trigger registry, outbound
  message sender, email sender, chat sender, external notification sender,
  autonomous follow-up worker, conversation continuation scheduler, reminder
  scheduler, timer scheduler, notification scheduler, delayed task queue,
  background task scheduler, hidden task queue, workflow recorder, workflow
  runner, replay action, allowlist editor, confirmation policy editor, risk
  policy editor, permission policy editor, memory-triggered execution,
  background action runner, route auto-run, plugin invocation, desktop launch,
  shell execution, filesystem search, provider upload, provider sync, cloud
  sync, plugin upload, import/export, or external destination controls are
  visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, location observation controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Browser History Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows browser
history observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not read browser profiles, browser history, tabs, cookies, sessions,
or browsing state from this path.

Scope completed:
- Added `Browser history observation` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  microphone observation status, access status projections, sharing status,
  provider sync status, export/import status, snapshot controls, Task Runtime
  storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, browser profile reader, browser history
  reader, tab observer, cookie reader, session reader, browsing state ingestion
  path, browser extension, browser automation, browser launch, URL opening,
  continuous listener, microphone frame capture path, ambient audio retention
  path, microphone state ingestion path, voice provider call, ASR provider
  call, TTS provider call, webcam access path, camera capture path, camera
  frame sampler, visual input ingestion path, directory watcher, filesystem
  crawler, file content reader, file change subscription, file ingestion path,
  screenshot capture path, screen sampler, pixel reader, screen content
  watcher, screen state ingestion path, active-window watcher, window-title
  reader, focus poller, window state ingestion path, keyboard hook, keylogger,
  keystroke watcher, typed-input ingestion path, clipboard watcher, clipboard
  poller, clipboard reader, clipboard ingestion path, webhook subscription,
  remote event listener, plugin event listener, external trigger registry,
  outbound message sender, email sender, chat sender, external notification
  sender, autonomous follow-up worker, conversation continuation scheduler,
  reminder scheduler, timer scheduler, notification scheduler, delayed task
  queue, background task scheduler, hidden task queue, task replay behavior,
  workflow replay behavior, workflow recorder, workflow runner, side-effect
  replay, allowlist mutation behavior, permission policy mutation, risk
  downgrade behavior, confirmation bypass behavior, route auto-run, plugin
  invocation, desktop launch, shell, filesystem search, context polling worker,
  proactive assistant trigger, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Browser history observation status is renderer-only and documents that Memory
  does not read browser profiles, browser history, tabs, cookies, sessions, or
  browsing state in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Browser history observation`.
- Confirm the `Browser history observation` value is `DISABLED`.
- Confirm `Microphone observation`, `Camera observation`, `File observation`,
  `Screen observation`, `Window observation`, `Keystroke observation`,
  `Clipboard observation`, `External triggers`, `Outbound messaging`,
  `Autonomous follow-up`, `Reminder scheduling`, `Background task creation`,
  `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`, `Risk
  downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no browser profile reader, browser history reader, tab observer,
  cookie reader, session reader, browsing state ingestion path, browser
  extension, browser automation, browser launch, URL opening, continuous
  listener, microphone frame capture path, ambient audio retention path,
  microphone state ingestion path, voice provider call, ASR provider call, TTS
  provider call, webcam access path, camera capture path, camera frame sampler,
  visual input ingestion path, directory watcher, filesystem crawler, file
  content reader, file change subscription, file ingestion path, screenshot
  capture path, screen sampler, pixel reader, screen content watcher, screen
  state ingestion path, active-window watcher, window-title reader, focus
  poller, window state ingestion path, keyboard hook, keylogger, keystroke
  watcher, typed-input ingestion path, clipboard watcher, clipboard poller,
  clipboard reader, clipboard ingestion path, webhook subscription, remote
  event listener, plugin event listener, external trigger registry, outbound
  message sender, email sender, chat sender, external notification sender,
  autonomous follow-up worker, conversation continuation scheduler, reminder
  scheduler, timer scheduler, notification scheduler, delayed task queue,
  background task scheduler, hidden task queue, workflow recorder, workflow
  runner, replay action, allowlist editor, confirmation policy editor, risk
  policy editor, permission policy editor, memory-triggered execution,
  background action runner, route auto-run, plugin invocation, desktop launch,
  shell execution, filesystem search, provider upload, provider sync, cloud
  sync, plugin upload, import/export, or external destination controls are
  visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls,
  browser history observation controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Microphone Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
microphone observation as disabled. This makes the Memory surface state that
saved aliases, preferences, future workflow records, skin, pet, or personality
records do not continuously listen, capture microphone frames, store ambient
audio, or ingest microphone state from this path.

Scope completed:
- Added `Microphone observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, camera observation status,
  access status projections, sharing status, provider sync status,
  export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, continuous listener, microphone frame capture
  path, ambient audio retention path, microphone state ingestion path, voice
  provider call, ASR provider call, TTS provider call, webcam access path,
  camera capture path, camera frame sampler, visual input ingestion path,
  directory watcher, filesystem crawler, file content reader, file change
  subscription, file ingestion path, screenshot capture path, screen sampler,
  pixel reader, screen content watcher, screen state ingestion path,
  active-window watcher, window-title reader, focus poller, window state
  ingestion path, keyboard hook, keylogger, keystroke watcher, typed-input
  ingestion path, clipboard watcher, clipboard poller, clipboard reader,
  clipboard ingestion path, webhook subscription, remote event listener, plugin
  event listener, external trigger registry, outbound message sender, email
  sender, chat sender, external notification sender, autonomous follow-up
  worker, conversation continuation scheduler, reminder scheduler, timer
  scheduler, notification scheduler, delayed task queue, background task
  scheduler, hidden task queue, task replay behavior, workflow replay behavior,
  workflow recorder, workflow runner, side-effect replay, allowlist mutation
  behavior, permission policy mutation, risk downgrade behavior, confirmation
  bypass behavior, route auto-run, plugin invocation, browser launch, desktop
  launch, shell, filesystem search, context polling worker, proactive
  assistant trigger, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Microphone observation status is renderer-only and documents that Memory does
  not continuously listen, capture microphone frames, store ambient audio, or
  ingest microphone state in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Microphone observation`.
- Confirm the `Microphone observation` value is `DISABLED`.
- Confirm `Camera observation`, `File observation`, `Screen observation`,
  `Window observation`, `Keystroke observation`, `Clipboard observation`,
  `External triggers`, `Outbound messaging`, `Autonomous follow-up`, `Reminder
  scheduling`, `Background task creation`, `Workflow replay`, `Allowlist
  mutation`, `Confirmation bypass`, `Risk downgrade`, `Permission override`,
  `Auto execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no continuous listener, microphone frame capture path, ambient audio
  retention path, microphone state ingestion path, voice provider call, ASR
  provider call, TTS provider call, webcam access path, camera capture path,
  camera frame sampler, visual input ingestion path, directory watcher,
  filesystem crawler, file content reader, file change subscription, file
  ingestion path, screenshot capture path, screen sampler, pixel reader,
  screen content watcher, screen state ingestion path, active-window watcher,
  window-title reader, focus poller, window state ingestion path, keyboard
  hook, keylogger, keystroke watcher, typed-input ingestion path, clipboard
  watcher, clipboard poller, clipboard reader, clipboard ingestion path,
  webhook subscription, remote event listener, plugin event listener, external
  trigger registry, outbound message sender, email sender, chat sender,
  external notification sender, autonomous follow-up worker, conversation
  continuation scheduler, reminder scheduler, timer scheduler, notification
  scheduler, delayed task queue, background task scheduler, hidden task queue,
  workflow recorder, workflow runner, replay action, allowlist editor,
  confirmation policy editor, risk policy editor, permission policy editor,
  memory-triggered execution, background action runner, route auto-run, plugin
  invocation, browser launch, desktop launch, shell execution, filesystem
  search, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, microphone observation controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Camera Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows camera
observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not access webcams, capture camera frames, sample visual input, or
ingest camera state from this path.

Scope completed:
- Added `Camera observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, file observation status, access status projections,
  sharing status, provider sync status, export/import status, snapshot
  controls, Task Runtime storage, provider/runtime projections, and safety
  gates unchanged.

Safety boundaries:
- No backend persistence schema, webcam access path, camera capture path,
  camera frame sampler, visual input ingestion path, directory watcher,
  filesystem crawler, file content reader, file change subscription, file
  ingestion path, screenshot capture path, screen sampler, pixel reader, screen
  content watcher, screen state ingestion path, active-window watcher,
  window-title reader, focus poller, window state ingestion path, keyboard
  hook, keylogger, keystroke watcher, typed-input ingestion path, clipboard
  watcher, clipboard poller, clipboard reader, clipboard ingestion path,
  webhook subscription, remote event listener, plugin event listener, external
  trigger registry, outbound message sender, email sender, chat sender,
  external notification sender, autonomous follow-up worker, conversation
  continuation scheduler, reminder scheduler, timer scheduler, notification
  scheduler, delayed task queue, background task scheduler, hidden task queue,
  task replay behavior, workflow replay behavior, workflow recorder, workflow
  runner, side-effect replay, allowlist mutation behavior, permission policy
  mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, plugin invocation, browser launch, desktop launch, shell,
  filesystem search, context polling worker, proactive assistant trigger,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Camera observation status is renderer-only and documents that Memory does not
  access webcams, capture camera frames, sample visual input, or ingest camera
  state in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Camera observation`.
- Confirm the `Camera observation` value is `DISABLED`.
- Confirm `File observation`, `Screen observation`, `Window observation`,
  `Keystroke observation`, `Clipboard observation`, `External triggers`,
  `Outbound messaging`, `Autonomous follow-up`, `Reminder scheduling`,
  `Background task creation`, `Workflow replay`, `Allowlist mutation`,
  `Confirmation bypass`, `Risk downgrade`, `Permission override`, `Auto
  execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no webcam access path, camera capture path, camera frame sampler,
  visual input ingestion path, directory watcher, filesystem crawler, file
  content reader, file change subscription, file ingestion path, screenshot
  capture path, screen sampler, pixel reader, screen content watcher, screen
  state ingestion path, active-window watcher, window-title reader, focus
  poller, window state ingestion path, keyboard hook, keylogger, keystroke
  watcher, typed-input ingestion path, clipboard watcher, clipboard poller,
  clipboard reader, clipboard ingestion path, webhook subscription, remote
  event listener, plugin event listener, external trigger registry, outbound
  message sender, email sender, chat sender, external notification sender,
  autonomous follow-up worker, conversation continuation scheduler, reminder
  scheduler, timer scheduler, notification scheduler, delayed task queue,
  background task scheduler, hidden task queue, workflow recorder, workflow
  runner, replay action, allowlist editor, confirmation policy editor, risk
  policy editor, permission policy editor, memory-triggered execution,
  background action runner, route auto-run, plugin invocation, browser launch,
  desktop launch, shell execution, filesystem search, provider upload,
  provider sync, cloud sync, plugin upload, import/export, or external
  destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, camera observation controls, and release readiness are not
  complete.

## 2026-08-13: User-Controlled Memory File Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows file
observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not watch directories, read file contents, crawl user folders, or
ingest file changes from this path.

Scope completed:
- Added `File observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, screen
  observation status, access status projections, sharing status, provider sync
  status, export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, directory watcher, filesystem crawler, file
  content reader, file change subscription, file ingestion path, screenshot
  capture path, screen sampler, pixel reader, screen content watcher, screen
  state ingestion path, active-window watcher, window-title reader, focus
  poller, window state ingestion path, keyboard hook, keylogger, keystroke
  watcher, typed-input ingestion path, clipboard watcher, clipboard poller,
  clipboard reader, clipboard ingestion path, webhook subscription, remote
  event listener, plugin event listener, external trigger registry, outbound
  message sender, email sender, chat sender, external notification sender,
  autonomous follow-up worker, conversation continuation scheduler, reminder
  scheduler, timer scheduler, notification scheduler, delayed task queue,
  background task scheduler, hidden task queue, task replay behavior, workflow
  replay behavior, workflow recorder, workflow runner, side-effect replay,
  allowlist mutation behavior, permission policy mutation, risk downgrade
  behavior, confirmation bypass behavior, route auto-run, plugin invocation,
  browser launch, desktop launch, shell, filesystem search, context polling
  worker, proactive assistant trigger, provider sync job, credential storage,
  network destination, import/export path, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- File observation status is renderer-only and documents that Memory does not
  watch directories, read file contents, crawl user folders, or ingest file
  changes in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `File observation`.
- Confirm the `File observation` value is `DISABLED`.
- Confirm `Screen observation`, `Window observation`, `Keystroke observation`,
  `Clipboard observation`, `External triggers`, `Outbound messaging`,
  `Autonomous follow-up`, `Reminder scheduling`, `Background task creation`,
  `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`, `Risk
  downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no directory watcher, filesystem crawler, file content reader, file
  change subscription, file ingestion path, screenshot capture path, screen
  sampler, pixel reader, screen content watcher, screen state ingestion path,
  active-window watcher, window-title reader, focus poller, window state
  ingestion path, keyboard hook, keylogger, keystroke watcher, typed-input
  ingestion path, clipboard watcher, clipboard poller, clipboard reader,
  clipboard ingestion path, webhook subscription, remote event listener, plugin
  event listener, external trigger registry, outbound message sender, email
  sender, chat sender, external notification sender, autonomous follow-up
  worker, conversation continuation scheduler, reminder scheduler, timer
  scheduler, notification scheduler, delayed task queue, background task
  scheduler, hidden task queue, workflow recorder, workflow runner, replay
  action, allowlist editor, confirmation policy editor, risk policy editor,
  permission policy editor, memory-triggered execution, background action
  runner, route auto-run, plugin invocation, browser launch, desktop launch,
  shell execution, filesystem search, provider upload, provider sync, cloud
  sync, plugin upload, import/export, or external destination controls are
  visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, file observation
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Screen Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows screen
observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not capture screenshots, sample screen pixels, watch screen
content, or ingest screen state from this path.

Scope completed:
- Added `Screen observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, window observation status, access
  status projections, sharing status, provider sync status, export/import
  status, snapshot controls, Task Runtime storage, provider/runtime
  projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, screenshot capture path, screen sampler,
  pixel reader, screen content watcher, screen state ingestion path,
  active-window watcher, window-title reader, focus poller, window state
  ingestion path, keyboard hook, keylogger, keystroke watcher, typed-input
  ingestion path, clipboard watcher, clipboard poller, clipboard reader,
  clipboard ingestion path, webhook subscription, remote event listener, file
  watcher, plugin event listener, external trigger registry, outbound message
  sender, email sender, chat sender, external notification sender, autonomous
  follow-up worker, conversation continuation scheduler, reminder scheduler,
  timer scheduler, notification scheduler, delayed task queue, background task
  scheduler, hidden task queue, task replay behavior, workflow replay behavior,
  workflow recorder, workflow runner, side-effect replay, allowlist mutation
  behavior, permission policy mutation, risk downgrade behavior, confirmation
  bypass behavior, route auto-run, plugin invocation, browser launch, desktop
  launch, shell, filesystem search, context polling worker, proactive
  assistant trigger, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Screen observation status is renderer-only and documents that Memory does not
  capture screenshots, sample screen pixels, watch screen content, or ingest
  screen state in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Screen observation`.
- Confirm the `Screen observation` value is `DISABLED`.
- Confirm `Window observation`, `Keystroke observation`, `Clipboard
  observation`, `External triggers`, `Outbound messaging`, `Autonomous
  follow-up`, `Reminder scheduling`, `Background task creation`, `Workflow
  replay`, `Allowlist mutation`, `Confirmation bypass`, `Risk downgrade`,
  `Permission override`, `Auto execution`, `Context polling`, `Proactive
  scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no screenshot capture path, screen sampler, pixel reader, screen
  content watcher, screen state ingestion path, active-window watcher,
  window-title reader, focus poller, window state ingestion path, keyboard
  hook, keylogger, keystroke watcher, typed-input ingestion path, clipboard
  watcher, clipboard poller, clipboard reader, clipboard ingestion path,
  webhook subscription, remote event listener, file watcher, plugin event
  listener, external trigger registry, outbound message sender, email sender,
  chat sender, external notification sender, autonomous follow-up worker,
  conversation continuation scheduler, reminder scheduler, timer scheduler,
  notification scheduler, delayed task queue, background task scheduler, hidden
  task queue, workflow recorder, workflow runner, replay action, allowlist
  editor, confirmation policy editor, risk policy editor, permission policy
  editor, memory-triggered execution, background action runner, route auto-run,
  plugin invocation, browser launch, desktop launch, shell execution,
  filesystem search, provider upload, provider sync, cloud sync, plugin
  upload, import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, screen observation controls, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Window Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows window
observation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not watch active windows, inspect window titles, poll focus changes,
or ingest window state from this path.

Scope completed:
- Added `Window observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, keystroke observation status, access status projections, sharing
  status, provider sync status, export/import status, snapshot controls, Task
  Runtime storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, active-window watcher, window-title reader,
  focus poller, window state ingestion path, keyboard hook, keylogger,
  keystroke watcher, typed-input ingestion path, clipboard watcher, clipboard
  poller, clipboard reader, clipboard ingestion path, webhook subscription,
  remote event listener, file watcher, plugin event listener, external trigger
  registry, outbound message sender, email sender, chat sender, external
  notification sender, autonomous follow-up worker, conversation continuation
  scheduler, reminder scheduler, timer scheduler, notification scheduler,
  delayed task queue, background task scheduler, hidden task queue, task replay
  behavior, workflow replay behavior, workflow recorder, workflow runner,
  side-effect replay, allowlist mutation behavior, permission policy mutation,
  risk downgrade behavior, confirmation bypass behavior, route auto-run,
  plugin invocation, browser launch, desktop launch, shell, filesystem search,
  context polling worker, proactive assistant trigger, provider sync job,
  credential storage, network destination, import/export path, provider call,
  prompt assembly, Qwen runtime, vector retrieval, Planner behavior,
  telemetry, installer, release behavior, model training, dataset export, or
  prompt injection behavior was added.
- Window observation status is renderer-only and documents that Memory does not
  watch active windows, inspect window titles, poll focus changes, or ingest
  window state in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Window observation`.
- Confirm the `Window observation` value is `DISABLED`.
- Confirm `Keystroke observation`, `Clipboard observation`, `External
  triggers`, `Outbound messaging`, `Autonomous follow-up`, `Reminder
  scheduling`, `Background task creation`, `Workflow replay`, `Allowlist
  mutation`, `Confirmation bypass`, `Risk downgrade`, `Permission override`,
  `Auto execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no active-window watcher, window-title reader, focus poller, window
  state ingestion path, keyboard hook, keylogger, keystroke watcher,
  typed-input ingestion path, clipboard watcher, clipboard poller, clipboard
  reader, clipboard ingestion path, webhook subscription, remote event
  listener, file watcher, plugin event listener, external trigger registry,
  outbound message sender, email sender, chat sender, external notification
  sender, autonomous follow-up worker, conversation continuation scheduler,
  reminder scheduler, timer scheduler, notification scheduler, delayed task
  queue, background task scheduler, hidden task queue, workflow recorder,
  workflow runner, replay action, allowlist editor, confirmation policy editor,
  risk policy editor, permission policy editor, memory-triggered execution,
  background action runner, route auto-run, plugin invocation, browser launch,
  desktop launch, shell execution, filesystem search, provider upload,
  provider sync, cloud sync, plugin upload, import/export, or external
  destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  window observation controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Keystroke Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
keystroke observation as disabled. This makes the Memory surface state that
saved aliases, preferences, future workflow records, skin, pet, or personality
records do not install keyboard hooks, watch typed input, log keys, or ingest
keystrokes from this path.

Scope completed:
- Added `Keystroke observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass
  status, allowlist mutation status, workflow replay status, background task
  creation status, reminder scheduling status, autonomous follow-up status,
  outbound messaging status, external trigger status, clipboard observation
  status, access status projections, sharing status, provider sync status,
  export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, keyboard hook, keylogger, keystroke watcher,
  typed-input ingestion path, clipboard watcher, clipboard poller, clipboard
  reader, clipboard ingestion path, webhook subscription, remote event
  listener, file watcher, plugin event listener, external trigger registry,
  outbound message sender, email sender, chat sender, external notification
  sender, autonomous follow-up worker, conversation continuation scheduler,
  reminder scheduler, timer scheduler, notification scheduler, delayed task
  queue, background task scheduler, hidden task queue, task replay behavior,
  workflow replay behavior, workflow recorder, workflow runner,
  side-effect replay, allowlist mutation behavior, permission policy mutation,
  risk downgrade behavior, confirmation bypass behavior, route auto-run,
  plugin invocation, browser launch, desktop launch, shell, filesystem search,
  context polling worker, proactive assistant trigger, provider sync job,
  credential storage, network destination, import/export path, provider call,
  prompt assembly, Qwen runtime, vector retrieval, Planner behavior,
  telemetry, installer, release behavior, model training, dataset export, or
  prompt injection behavior was added.
- Keystroke observation status is renderer-only and documents that Memory does
  not install keyboard hooks, watch typed input, log keys, or ingest
  keystrokes in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Keystroke observation`.
- Confirm the `Keystroke observation` value is `DISABLED`.
- Confirm `Clipboard observation`, `External triggers`, `Outbound messaging`,
  `Autonomous follow-up`, `Reminder scheduling`, `Background task creation`,
  `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`, `Risk
  downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no keyboard hook, keylogger, keystroke watcher, typed-input
  ingestion path, clipboard watcher, clipboard poller, clipboard reader,
  clipboard ingestion path, webhook subscription, remote event listener, file
  watcher, plugin event listener, external trigger registry, outbound message
  sender, email sender, chat sender, external notification sender, autonomous
  follow-up worker, conversation continuation scheduler, reminder scheduler,
  timer scheduler, notification scheduler, delayed task queue, background task
  scheduler, hidden task queue, workflow recorder, workflow runner, replay
  action, allowlist editor, confirmation policy editor, risk policy editor,
  permission policy editor, memory-triggered execution, background action
  runner, route auto-run, plugin invocation, browser launch, desktop launch,
  shell execution, filesystem search, provider upload, provider sync, cloud
  sync, plugin upload, import/export, or external destination controls are
  visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, keystroke observation controls,
  and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Clipboard Observation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
clipboard observation as disabled. This makes the Memory surface state that
saved aliases, preferences, future workflow records, skin, pet, or personality
records do not watch, poll, read, or ingest clipboard changes from this path.

Scope completed:
- Added `Clipboard observation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass status,
  allowlist mutation status, workflow replay status, background task creation
  status, reminder scheduling status, autonomous follow-up status, outbound
  messaging status, external trigger status, access status projections, sharing
  status, provider sync status, export/import status, snapshot controls, Task
  Runtime storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, clipboard watcher, clipboard poller, clipboard
  reader, clipboard ingestion path, webhook subscription, remote event listener,
  file watcher, plugin event listener, external trigger registry, outbound
  message sender, email sender, chat sender, external notification sender,
  autonomous follow-up worker, conversation continuation scheduler, reminder
  scheduler, timer scheduler, notification scheduler, delayed task queue,
  background task scheduler, hidden task queue, task replay behavior, workflow
  replay behavior, workflow recorder, workflow runner, side-effect replay,
  allowlist mutation behavior, permission policy mutation, risk downgrade
  behavior, confirmation bypass behavior, route auto-run, plugin invocation,
  browser launch, desktop launch, shell, filesystem search, context polling
  worker, proactive assistant trigger, provider sync job, credential storage,
  network destination, import/export path, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Clipboard observation status is renderer-only and documents that Memory does
  not watch, poll, read, or ingest clipboard changes in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Clipboard observation`.
- Confirm the `Clipboard observation` value is `DISABLED`.
- Confirm `External triggers`, `Outbound messaging`, `Autonomous follow-up`,
  `Reminder scheduling`, `Background task creation`, `Workflow replay`,
  `Allowlist mutation`, `Confirmation bypass`, `Risk downgrade`, `Permission
  override`, `Auto execution`, `Context polling`, `Proactive scan`, and
  `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no clipboard watcher, clipboard poller, clipboard reader, clipboard
  ingestion path, webhook subscription, remote event listener, file watcher,
  plugin event listener, external trigger registry, outbound message sender,
  email sender, chat sender, external notification sender, autonomous follow-up
  worker, conversation continuation scheduler, reminder scheduler, timer
  scheduler, notification scheduler, delayed task queue, background task
  scheduler, hidden task queue, workflow recorder, workflow runner, replay
  action, allowlist editor, confirmation policy editor, risk policy editor,
  permission policy editor, memory-triggered execution, background action
  runner, route auto-run, plugin invocation, browser launch, desktop launch,
  shell execution, filesystem search, provider upload, provider sync, cloud
  sync, plugin upload, import/export, or external destination controls are
  visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, clipboard observation controls, and release readiness are not
  complete.

## 2026-08-13: User-Controlled Memory External Trigger Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
external triggers as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not subscribe to webhooks, remote events, file watchers, plugin
events, or other external triggers from this path.

Scope completed:
- Added `External triggers` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass status,
  allowlist mutation status, workflow replay status, background task creation
  status, reminder scheduling status, autonomous follow-up status, outbound
  messaging status, access status projections, sharing status, provider sync
  status, export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, webhook subscription, remote event listener,
  file watcher, plugin event listener, external trigger registry, outbound
  message sender, email sender, chat sender, external notification sender,
  autonomous follow-up worker, conversation continuation scheduler, reminder
  scheduler, timer scheduler, notification scheduler, delayed task queue,
  background task scheduler, hidden task queue, task replay behavior, workflow
  replay behavior, workflow recorder, workflow runner, side-effect replay,
  allowlist mutation behavior, permission policy mutation, risk downgrade
  behavior, confirmation bypass behavior, route auto-run, plugin invocation,
  browser launch, desktop launch, shell, filesystem search, context polling
  worker, proactive assistant trigger, provider sync job, credential storage,
  network destination, import/export path, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- External trigger status is renderer-only and documents that Memory does not
  subscribe to external events, watchers, webhooks, or plugin callbacks in this
  UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `External triggers`.
- Confirm the `External triggers` value is `DISABLED`.
- Confirm `Outbound messaging`, `Autonomous follow-up`, `Reminder scheduling`,
  `Background task creation`, `Workflow replay`, `Allowlist mutation`,
  `Confirmation bypass`, `Risk downgrade`, `Permission override`, `Auto
  execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no webhook subscription, remote event listener, file watcher, plugin
  event listener, external trigger registry, outbound message sender, email
  sender, chat sender, external notification sender, autonomous follow-up
  worker, conversation continuation scheduler, reminder scheduler, timer
  scheduler, notification scheduler, delayed task queue, background task
  scheduler, hidden task queue, workflow recorder, workflow runner, replay
  action, allowlist editor, confirmation policy editor, risk policy editor,
  permission policy editor, memory-triggered execution, background action
  runner, route auto-run, plugin invocation, browser launch, desktop launch,
  shell execution, filesystem search, provider upload, provider sync, cloud
  sync, plugin upload, import/export, or external destination controls are
  visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, external trigger
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Outbound Messaging Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
outbound messaging as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not send messages, emails, chat replies, notifications, or external
communications from this path.

Scope completed:
- Added `Outbound messaging` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass status,
  allowlist mutation status, workflow replay status, background task creation
  status, reminder scheduling status, autonomous follow-up status, access
  status projections, sharing status, provider sync status, export/import
  status, snapshot controls, Task Runtime storage, provider/runtime projections,
  and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, outbound message sender, email sender, chat
  sender, external notification sender, autonomous follow-up worker,
  conversation continuation scheduler, reminder scheduler, timer scheduler,
  notification scheduler, delayed task queue, background task scheduler, hidden
  task queue, task replay behavior, workflow replay behavior, workflow
  recorder, workflow runner, side-effect replay, allowlist mutation behavior,
  permission policy mutation, risk downgrade behavior, confirmation bypass
  behavior, route auto-run, plugin invocation, browser launch, desktop launch,
  shell, filesystem search, context polling worker, proactive assistant trigger,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Outbound messaging status is renderer-only and documents that Memory does not
  send messages, emails, chat replies, notifications, or external
  communications in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Outbound messaging`.
- Confirm the `Outbound messaging` value is `DISABLED`.
- Confirm `Autonomous follow-up`, `Reminder scheduling`, `Background task
  creation`, `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`,
  `Risk downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no outbound message sender, email sender, chat sender, external
  notification sender, autonomous follow-up worker, conversation continuation
  scheduler, reminder scheduler, timer scheduler, notification scheduler,
  delayed task queue, background task scheduler, hidden task queue, workflow
  recorder, workflow runner, replay action, allowlist editor, confirmation
  policy editor, risk policy editor, permission policy editor,
  memory-triggered execution, background action runner, route auto-run, plugin
  invocation, browser launch, desktop launch, shell execution, filesystem
  search, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, outbound messaging controls, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Autonomous Follow-Up Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
autonomous follow-up as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not cause Jarvis-K to re-contact the user, continue a conversation,
or initiate a follow-up action from this path.

Scope completed:
- Added `Autonomous follow-up` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass status,
  allowlist mutation status, workflow replay status, background task creation
  status, reminder scheduling status, access status projections, sharing
  status, provider sync status, export/import status, snapshot controls, Task
  Runtime storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, autonomous follow-up worker, conversation
  continuation scheduler, reminder scheduler, timer scheduler, notification
  scheduler, delayed task queue, background task scheduler, hidden task queue,
  task replay behavior, workflow replay behavior, workflow recorder, workflow
  runner, side-effect replay, allowlist mutation behavior, permission policy
  mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, plugin invocation, browser launch, desktop launch, shell,
  filesystem search, context polling worker, proactive assistant trigger,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Autonomous follow-up status is renderer-only and documents that Memory does
  not initiate follow-up messages, scheduled conversation continuation, or
  delayed user contact in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Autonomous follow-up`.
- Confirm the `Autonomous follow-up` value is `DISABLED`.
- Confirm `Reminder scheduling`, `Background task creation`, `Workflow replay`,
  `Allowlist mutation`, `Confirmation bypass`, `Risk downgrade`, `Permission
  override`, `Auto execution`, `Context polling`, `Proactive scan`, and
  `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no autonomous follow-up worker, conversation continuation scheduler,
  reminder scheduler, timer scheduler, notification scheduler, delayed task
  queue, background task scheduler, hidden task queue, workflow recorder,
  workflow runner, replay action, allowlist editor, confirmation policy editor,
  risk policy editor, permission policy editor, memory-triggered execution,
  background action runner, route auto-run, plugin invocation, browser launch,
  desktop launch, shell execution, filesystem search, provider upload, provider
  sync, cloud sync, plugin upload, import/export, or external destination
  controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  autonomous follow-up controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Reminder Scheduling Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
reminder scheduling as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not schedule reminders, timers, notifications, or delayed Task
Runtime work from this path.

Scope completed:
- Added `Reminder scheduling` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass status,
  allowlist mutation status, workflow replay status, background task creation
  status, access status projections, sharing status, provider sync status,
  export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, reminder scheduler, timer scheduler,
  notification scheduler, delayed task queue, background task scheduler, hidden
  task queue, task replay behavior, workflow replay behavior, workflow recorder,
  workflow runner, side-effect replay, allowlist mutation behavior, permission
  policy mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, plugin invocation, browser launch, desktop launch, shell,
  filesystem search, context polling worker, proactive assistant trigger,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Reminder scheduling status is renderer-only and documents that Memory does
  not create scheduled reminders, timers, delayed notifications, or delayed
  Task Runtime work in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Reminder scheduling`.
- Confirm the `Reminder scheduling` value is `DISABLED`.
- Confirm `Background task creation`, `Workflow replay`, `Allowlist mutation`,
  `Confirmation bypass`, `Risk downgrade`, `Permission override`, `Auto
  execution`, `Context polling`, `Proactive scan`, and `Proactive
  notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no reminder scheduler, timer scheduler, notification scheduler,
  delayed task queue, background task scheduler, hidden task queue, workflow
  recorder, workflow runner, replay action, allowlist editor, confirmation
  policy editor, risk policy editor, permission policy editor,
  memory-triggered execution, background action runner, route auto-run, plugin
  invocation, browser launch, desktop launch, shell execution, filesystem
  search, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, reminder scheduling controls,
  and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Background Task Creation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
background task creation as disabled. This makes the Memory surface state that
saved aliases, preferences, future workflow records, skin, pet, or personality
records do not create queued, scheduled, or hidden Task Runtime work from this
path.

Scope completed:
- Added `Background task creation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass status,
  allowlist mutation status, workflow replay status, access status projections,
  sharing status, provider sync status, export/import status, snapshot controls,
  Task Runtime storage, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, background task scheduler, hidden task queue,
  task replay behavior, workflow replay behavior, workflow recorder, workflow
  runner, side-effect replay, allowlist mutation behavior, permission policy
  mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, plugin invocation, browser launch, desktop launch, shell,
  filesystem search, context polling worker, notification scheduler, reminder
  scheduler, proactive assistant trigger, provider sync job, credential storage,
  network destination, import/export path, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Background task creation status is renderer-only and documents that Memory
  does not create queued or scheduled Task Runtime work in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Background task creation`.
- Confirm the `Background task creation` value is `DISABLED`.
- Confirm `Workflow replay`, `Allowlist mutation`, `Confirmation bypass`, `Risk
  downgrade`, `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no background task scheduler, hidden task queue, workflow recorder,
  workflow runner, replay action, allowlist editor, confirmation policy editor,
  risk policy editor, permission policy editor, memory-triggered execution,
  background action runner, route auto-run, plugin invocation, browser launch,
  desktop launch, shell execution, filesystem search, notification scheduler,
  reminder scheduler, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, background task creation controls, and release readiness are not
  complete.

## 2026-08-13: User-Controlled Memory Workflow Replay Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
workflow replay as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not automatically replay multi-step tasks or side-effecting actions
from this path.

Scope completed:
- Added `Workflow replay` to the Memory boundary panel with `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass status,
  allowlist mutation status, access status projections, sharing status,
  provider sync status, export/import status, snapshot controls, Task Runtime
  storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, workflow replay behavior, workflow recorder,
  workflow runner, side-effect replay, allowlist mutation behavior, permission
  policy mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, plugin invocation, browser launch, desktop launch, shell,
  filesystem search, context polling worker, notification scheduler, reminder
  scheduler, proactive assistant trigger, provider sync job, credential storage,
  network destination, import/export path, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Workflow replay status is renderer-only and documents that Memory does not
  automatically execute stored workflows in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Workflow replay`.
- Confirm the `Workflow replay` value is `DISABLED`.
- Confirm `Allowlist mutation`, `Confirmation bypass`, `Risk downgrade`,
  `Permission override`, `Auto execution`, `Context polling`, `Proactive scan`,
  and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no workflow recorder, workflow runner, replay action, allowlist
  editor, confirmation policy editor, risk policy editor, permission policy
  editor, memory-triggered execution, background action runner, route auto-run,
  plugin invocation, browser launch, desktop launch, shell execution, filesystem
  search, notification scheduler, reminder scheduler, provider upload, provider
  sync, cloud sync, plugin upload, import/export, or external destination
  controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, workflow replay
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Allowlist Mutation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
allowlist mutation as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not add or modify allowed applications, URLs, plugins, filesystem
roots, providers, or Windows action targets from this path.

Scope completed:
- Added `Allowlist mutation` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, confirmation bypass status,
  access status projections, sharing status, provider sync status,
  export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, allowlist mutation behavior, permission policy
  mutation, risk downgrade behavior, confirmation bypass behavior, route
  auto-run, workflow replay, plugin invocation, browser launch, desktop launch,
  shell, filesystem search, context polling worker, notification scheduler,
  reminder scheduler, proactive assistant trigger, provider sync job,
  credential storage, network destination, import/export path, provider call,
  prompt assembly, Qwen runtime, vector retrieval, Planner behavior, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Allowlist mutation status is renderer-only and documents that Memory does not
  alter allowed targets or safety policy in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Allowlist mutation`.
- Confirm the `Allowlist mutation` value is `DISABLED`.
- Confirm `Confirmation bypass`, `Risk downgrade`, `Permission override`,
  `Auto execution`, `Context polling`, `Proactive scan`, and
  `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no allowlist editor, confirmation policy editor, risk policy editor,
  permission policy editor, memory-triggered execution, background action
  runner, route auto-run, workflow replay, plugin invocation, browser launch,
  desktop launch, shell execution, filesystem search, notification scheduler,
  reminder scheduler, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, allowlist mutation controls, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Confirmation Bypass Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
confirmation bypass as disabled. This makes the Memory surface state that saved
aliases, preferences, future workflow records, skin, pet, or personality
records do not skip medium, high, critical, plugin, provider, browser,
desktop, or Windows action confirmation rules from this path.

Scope completed:
- Added `Confirmation bypass` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, risk downgrade status, access status projections,
  sharing status, provider sync status, export/import status, snapshot controls,
  Task Runtime storage, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, permission policy mutation, risk downgrade
  behavior, confirmation bypass behavior, allowlist expansion, route auto-run,
  workflow replay, plugin invocation, browser launch, desktop launch, shell,
  filesystem search, context polling worker, notification scheduler, reminder
  scheduler, proactive assistant trigger, provider sync job, credential storage,
  network destination, import/export path, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Confirmation bypass status is renderer-only and documents that Memory does
  not relax user confirmation or safety behavior in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Confirmation bypass`.
- Confirm the `Confirmation bypass` value is `DISABLED`.
- Confirm `Risk downgrade`, `Permission override`, `Auto execution`, `Context
  polling`, `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no confirmation policy editor, risk policy editor, permission policy
  editor, allowlist expansion, memory-triggered execution, background action
  runner, route auto-run, workflow replay, plugin invocation, browser launch,
  desktop launch, shell execution, filesystem search, notification scheduler,
  reminder scheduler, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls,
  confirmation bypass controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Risk Downgrade Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows risk
downgrade as disabled. This makes the Memory surface state that saved aliases,
preferences, future workflow records, skin, pet, or personality records do not
lower Command Router, Task Runtime, plugin, provider, browser, desktop, or
Windows action risk levels from this path.

Scope completed:
- Added `Risk downgrade` to the Memory boundary panel with `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status,
  permission override status, access status projections, sharing status,
  provider sync status, export/import status, snapshot controls, Task Runtime
  storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, permission policy mutation, risk downgrade
  behavior, confirmation bypass, allowlist expansion, route auto-run, workflow
  replay, plugin invocation, browser launch, desktop launch, shell, filesystem
  search, context polling worker, notification scheduler, reminder scheduler,
  proactive assistant trigger, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, telemetry, installer, release behavior,
  model training, dataset export, or prompt injection behavior was added.
- Risk downgrade status is renderer-only and documents that Memory does not
  relax safety or risk classification behavior in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Risk downgrade`.
- Confirm the `Risk downgrade` value is `DISABLED`.
- Confirm `Permission override`, `Auto execution`, `Context polling`,
  `Proactive scan`, and `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no risk policy editor, permission policy editor, confirmation bypass,
  allowlist expansion, memory-triggered execution, background action runner,
  route auto-run, workflow replay, plugin invocation, browser launch, desktop
  launch, shell execution, filesystem search, notification scheduler, reminder
  scheduler, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, risk downgrade controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Permission Override Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
permission override as disabled. This keeps the user-controlled Memory surface
clear that saved route aliases, voice aliases, preferences, future workflow
records, skin, pet, or personality records cannot relax Task Runtime, Command
Router, plugin, provider, or Windows action safety rules from this path.

Scope completed:
- Added `Permission override` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, auto execution status, access
  status projections, sharing status, provider sync status, export/import
  status, snapshot controls, Task Runtime storage, provider/runtime
  projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, permission policy mutation, risk downgrade,
  confirmation bypass, allowlist expansion, route auto-run, workflow replay,
  plugin invocation, browser launch, desktop launch, shell, filesystem search,
  context polling worker, notification scheduler, reminder scheduler,
  proactive assistant trigger, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, telemetry, installer, release behavior,
  model training, dataset export, or prompt injection behavior was added.
- Permission override status is renderer-only and documents that Memory does
  not enable safety or permission bypass behavior in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Permission override`.
- Confirm the `Permission override` value is `DISABLED`.
- Confirm `Auto execution`, `Context polling`, `Proactive scan`, and
  `Proactive notifications` remain `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no permission policy editor, risk downgrade, confirmation bypass,
  allowlist expansion, memory-triggered execution, background action runner,
  route auto-run, workflow replay, plugin invocation, browser launch, desktop
  launch, shell execution, filesystem search, notification scheduler, reminder
  scheduler, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters,
  sorting, snapshot controls, and all privacy retention boundaries remain
  unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, permission override controls, and release readiness are
  not complete.

## 2026-08-13: User-Controlled Memory Auto Execution Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows auto
execution as disabled. This keeps the user-controlled Memory surface clear that
saved route aliases, voice aliases, preferences, and future workflow records do
not execute actions by themselves from this path.

Scope completed:
- Added `Auto execution` to the Memory boundary panel with `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, context polling status, access status projections,
  sharing status, provider sync status, export/import status, snapshot controls,
  Task Runtime storage, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, memory-triggered execution, background action
  runner, route auto-run, workflow replay, plugin invocation, browser launch,
  desktop launch, shell, filesystem search, context polling worker, notification
  scheduler, reminder scheduler, proactive assistant trigger, provider sync
  job, credential storage, network destination, import/export path, provider
  call, prompt assembly, Qwen runtime, vector retrieval, Planner behavior,
  telemetry, installer, release behavior, model training, dataset export, or
  prompt injection behavior was added.
- Auto execution status is renderer-only and documents that Memory does not
  enable action execution in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Auto execution`.
- Confirm the `Auto execution` value is `DISABLED`.
- Confirm `Context polling` remains `DISABLED`.
- Confirm `Proactive scan` remains `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm `Proactive notifications` remains `DISABLED`.
- Confirm no memory-triggered execution, background action runner, route
  auto-run, workflow replay, plugin invocation, browser launch, desktop launch,
  shell execution, filesystem search, notification scheduler, reminder
  scheduler, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, auto
  execution controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Context Polling Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows context
polling as disabled. This keeps the user-controlled Memory surface clear that
saved records do not grant any background polling of screen, browser, task,
voice, clipboard, or file context from this path.

Scope completed:
- Added `Context polling` to the Memory boundary panel with `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, proactive
  notifications status, access status projections, sharing status, provider
  sync status, export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, context polling worker, background observer,
  screen poll, browser poll, task poll, voice poll, clipboard poll, file poll,
  notification scheduler, reminder scheduler, proactive assistant trigger,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, plugin execution, browser launch, desktop launch, shell, filesystem
  search, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Context polling status is renderer-only and documents that Memory does not
  enable background polling behavior in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Context polling`.
- Confirm the `Context polling` value is `DISABLED`.
- Confirm `Proactive scan` remains `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm `Proactive notifications` remains `DISABLED`.
- Confirm no context polling worker, background observer, screen poll, browser
  poll, task poll, voice poll, clipboard poll, file poll, notification
  scheduler, reminder scheduler, provider upload, provider sync, cloud sync,
  plugin upload, import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, context polling controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Proactive Notifications Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
proactive notifications as disabled. This keeps the user-controlled Memory
surface clear that saved records are not used to emit background notifications
or reminders from this path.

Scope completed:
- Added `Proactive notifications` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, proactive suggestions status, access status
  projections, sharing status, provider sync status, export/import status,
  snapshot controls, Task Runtime storage, provider/runtime projections, and
  safety gates unchanged.

Safety boundaries:
- No backend persistence schema, notification scheduler, reminder scheduler,
  tray notification delivery, OS notification permission request, proactive
  assistant trigger, context polling, screen scan, file scan, browser scan,
  clipboard scan, voice scan, task context scan, provider sync job, credential
  storage, network destination, import/export path, provider call, prompt
  assembly, Qwen runtime, vector retrieval, Planner behavior, plugin execution,
  browser launch, desktop launch, shell, filesystem search, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Proactive notifications status is renderer-only and documents that Memory
  does not enable background notification behavior in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Proactive notifications`.
- Confirm the `Proactive notifications` value is `DISABLED`.
- Confirm `Proactive scan` remains `DISABLED`.
- Confirm `Proactive suggestions` remains `NOT_ENABLED`.
- Confirm no notification scheduler, reminder scheduler, OS notification
  permission prompt, tray notification trigger, context polling, screen scan,
  file scan, browser scan, clipboard scan, voice scan, task context scan,
  provider upload, provider sync, cloud sync, plugin upload, import/export, or
  external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, proactive notification controls, and release readiness are not
  complete.

## 2026-08-13: User-Controlled Memory Proactive Suggestions Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
proactive suggestions as not enabled. This keeps the user-controlled Memory
surface clear that future proactive assistant modes do not use saved Memory
records to generate unsolicited suggestions from this path.

Scope completed:
- Added `Proactive suggestions` to the Memory boundary panel with `NOT_ENABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, proactive scan status, access status projections, sharing status,
  provider sync status, export/import status, snapshot controls, Task Runtime
  storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, proactive suggestion scheduler, proactive
  assistant trigger, context polling, notification system, screen scan, file
  scan, browser scan, clipboard scan, voice scan, task context scan, provider
  sync job, credential storage, network destination, import/export path,
  provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, plugin execution, browser launch, desktop launch, shell, filesystem
  search, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Proactive suggestions status is renderer-only and documents that Memory does
  not enable unsolicited suggestion behavior in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Proactive suggestions`.
- Confirm the `Proactive suggestions` value is `NOT_ENABLED`.
- Confirm `Proactive scan` remains `DISABLED`.
- Confirm no proactive suggestion control, reminder scheduler, context polling,
  notification trigger, screen scan, file scan, browser scan, clipboard scan,
  voice scan, task context scan, provider upload, provider sync, cloud sync,
  plugin upload, import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, proactive suggestion
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Proactive Scan Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
proactive scanning as disabled. This keeps the user-controlled Memory surface
clear that proactive assistant modes do not continuously scan screen, files,
browser state, clipboard, voice, or task context from this path.

Scope completed:
- Added `Proactive scan` to the Memory boundary panel with `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, access status projections, sharing status, provider sync status,
  export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, proactive scan scheduler, screen scan, file
  scan, browser scan, clipboard scan, voice scan, task context scan, proactive
  assistant trigger, provider sync job, credential storage, network destination,
  import/export path, provider call, prompt assembly, Qwen runtime, vector
  retrieval, Planner behavior, plugin execution, browser launch, desktop launch,
  shell, filesystem search, telemetry, installer, release behavior, model
  training, dataset export, or prompt injection behavior was added.
- Proactive scan status is renderer-only and documents that Memory does not
  grant background scanning in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Proactive scan`.
- Confirm the `Proactive scan` value is `DISABLED`.
- Confirm no proactive scan control, screen scan, file scan, browser scan,
  clipboard scan, voice scan, task context scan, provider upload, provider sync,
  cloud sync, plugin upload, import/export, or external destination controls are
  visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, access controls, proactive scan controls, and release readiness are
  not complete.

## 2026-08-13: User-Controlled Memory Personality Access Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
personality access as not granted. This keeps the user-controlled Memory
surface clear that future character/personality style features do not receive
memory records from this path and cannot alter permissions or safety policy.

Scope completed:
- Added `Personality access` to the Memory boundary panel with `NOT_GRANTED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, workflow access status, Teach Mode access status, skin access
  status, pet access status, custom UI access status, community sharing status,
  provider sync status, export/import status, snapshot controls, Task Runtime
  storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, personality runtime access, proactive assistant
  memory access, TTS voice personality access, character behavior policy change,
  permission policy change, safety strategy change, pet runtime access, skin
  package access, custom UI access, workflow runtime access, community upload,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, plugin execution, browser launch, desktop launch, shell, filesystem
  search, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Personality access status is renderer-only and documents that Memory does not
  grant personality surfaces access in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Personality access`.
- Confirm the `Personality access` value is `NOT_GRANTED`.
- Confirm no personality grant, proactive assistant memory access, TTS
  personality memory access, character policy control, permission policy
  override, safety policy override, community upload, provider upload, provider
  sync, cloud sync, plugin upload, import/export, or external destination
  controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, workflow access controls, Teach Mode access controls, skin access
  controls, pet access controls, personality access controls, custom UI access
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Teach Mode Access Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows Teach
Mode access as not granted. This keeps the user-controlled Memory surface clear
that future workflow teaching, action recording, and replay surfaces do not
receive memory records from this path until a separate user-controlled access
policy exists.

Scope completed:
- Added `Teach Mode access` to the Memory boundary panel with `NOT_GRANTED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, workflow access status, skin access status, pet access status,
  custom UI access status, community sharing status, provider sync status,
  export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, Teach Mode recording, action capture, UIA
  capture, clipboard capture, file change capture, workflow generation,
  workflow replay, workflow runtime access, skin package access, pet runtime
  access, custom UI access, community upload, provider sync job, credential
  storage, network destination, import/export path, provider call, prompt
  assembly, Qwen runtime, vector retrieval, Planner behavior, plugin execution,
  browser launch, desktop launch, shell, filesystem search, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Teach Mode access status is renderer-only and documents that Memory does not
  grant teaching or replay surfaces access in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Teach Mode access`.
- Confirm the `Teach Mode access` value is `NOT_GRANTED`.
- Confirm no Teach Mode grant, action recording, UIA capture, clipboard capture,
  file change capture, workflow generation, workflow replay, community upload,
  provider upload, provider sync, cloud sync, plugin upload, import/export, or
  external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, workflow access controls, Teach Mode access controls, skin access
  controls, pet access controls, custom UI access controls, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Custom UI Access Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows custom
UI access as not granted. This keeps the user-controlled Memory surface clear
that future custom UI apps do not receive memory records from this path until a
separate user-controlled access policy and sandbox exists.

Scope completed:
- Added `Custom UI access` to the Memory boundary panel with `NOT_GRANTED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, workflow access status, skin access status, pet access status,
  community sharing status, provider sync status, export/import status,
  snapshot controls, Task Runtime storage, provider/runtime projections, and
  safety gates unchanged.

Safety boundaries:
- No backend persistence schema, custom UI app access, executable UI runtime,
  arbitrary HTML/CSS/JavaScript path, iframe access, Electron IPC grant, skin
  package access, Skin Studio access, pet runtime access, workflow runtime
  access, community upload, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, release behavior,
  model training, dataset export, or prompt injection behavior was added.
- Custom UI access status is renderer-only and documents that Memory does not
  grant custom UI surfaces access in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Custom UI access`.
- Confirm the `Custom UI access` value is `NOT_GRANTED`.
- Confirm no custom UI grant, executable UI runtime, arbitrary HTML/CSS/JS
  import, iframe access, Electron IPC grant, skin package memory access, pet
  memory access, community upload, provider upload, provider sync, cloud sync,
  plugin upload, import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, workflow access controls, skin access controls, pet access controls,
  custom UI access controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Pet Access Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows desktop
pet access as not granted. This keeps the user-controlled Memory surface clear
that future pet windows, animations, sounds, and personality surfaces do not
receive memory records from this path until a separate user-controlled access
policy exists.

Scope completed:
- Added `Pet access` to the Memory boundary panel with `NOT_GRANTED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, workflow access status, skin access status, community sharing
  status, provider sync status, export/import status, snapshot controls, Task
  Runtime storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, desktop pet access, pet window IPC, pet
  animation runtime access, pet sound access, custom personality access, skin
  package access, Skin Studio access, workflow runtime access, community upload,
  provider sync job, credential storage, network destination, import/export
  path, provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, plugin execution, browser launch, desktop launch, shell, filesystem
  search, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Pet access status is renderer-only and documents that Memory does not grant
  pet surfaces access in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Pet access`.
- Confirm the `Pet access` value is `NOT_GRANTED`.
- Confirm no pet grant, pet window memory access, pet animation memory access,
  pet sound memory access, personality memory access, Skin Studio data access,
  community upload, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, workflow access controls, skin access controls, pet access controls,
  and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Skin Access Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows skin
access as not granted. This keeps the user-controlled Memory surface clear that
Skin Package, Skin Studio, and pet presentation work do not receive memory
records from this path until a separate user-controlled access policy exists.

Scope completed:
- Added `Skin access` to the Memory boundary panel with `NOT_GRANTED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, workflow access status, community sharing status, provider sync
  status, export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, skin package access, Skin Studio access, pet
  runtime access, custom UI access, executable skin path, workflow runtime
  access, community upload, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, release behavior,
  model training, dataset export, or prompt injection behavior was added.
- Skin access status is renderer-only and documents that Memory does not grant
  skin or pet surfaces access in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Skin access`.
- Confirm the `Skin access` value is `NOT_GRANTED`.
- Confirm no skin grant, Skin Studio data access, pet data access, custom UI
  memory access, executable skin path, community upload, provider upload,
  provider sync, cloud sync, plugin upload, import/export, or external
  destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, workflow access controls, skin access controls, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Workflow Access Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows workflow
access as not granted. This keeps the user-controlled Memory surface clear that
future Workflow/Teach Mode work does not receive memory records from this path
until a separate user-controlled access policy exists.

Scope completed:
- Added `Workflow access` to the Memory boundary panel with `NOT_GRANTED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, community sharing status, provider sync status, export/import
  status, snapshot controls, Task Runtime storage, provider/runtime projections,
  and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, workflow runtime access, Teach Mode recording,
  workflow generation, workflow replay, community upload, provider sync job,
  credential storage, network destination, import/export path, provider call,
  prompt assembly, Qwen runtime, vector retrieval, Planner behavior, plugin
  execution, browser launch, desktop launch, shell, filesystem search,
  telemetry, installer, release behavior, model training, dataset export, or
  prompt injection behavior was added.
- Workflow access status is renderer-only and documents that Memory does not
  grant workflow surfaces access in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Workflow access`.
- Confirm the `Workflow access` value is `NOT_GRANTED`.
- Confirm no workflow grant, Teach Mode, workflow replay, workflow export,
  community upload, provider upload, provider sync, cloud sync, plugin upload,
  import/export, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, workflow access controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Community Sharing Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
community sharing as disabled. This keeps the user-controlled Memory surface
clear that Plugin/Skin/Pet/Workflow Community work remains separate and that
Memory records are not exposed to any community channel from this path.

Scope completed:
- Added `Community sharing` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, provider sync status, export/import status, snapshot controls, Task
  Runtime storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, community upload, marketplace listing,
  external sharing destination, provider sync job, credential storage, network
  destination, import/export path, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch,
  desktop launch, shell, filesystem search, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Community sharing status is renderer-only and documents that Memory does not
  expose records to community surfaces in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Community sharing`.
- Confirm the `Community sharing` value is `DISABLED`.
- Confirm no community upload, marketplace publish, share, provider upload,
  provider sync, cloud sync, plugin upload, import/export, or external
  destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Provider Sync Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows provider
sync as disabled. This keeps the user-controlled Memory surface clear that
visible/deleteable records exist, but confirmed memories are not silently synced
to model providers from this path.

Scope completed:
- Added `Provider sync` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, edit/restore status, export/import status, snapshot controls, Task
  Runtime storage, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, provider sync job, provider upload, credential
  storage, network destination, import/export path, provider call, prompt
  assembly, Qwen runtime, vector retrieval, Planner behavior, plugin execution,
  browser launch, desktop launch, shell, filesystem search, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Provider sync status is renderer-only and documents that Memory does not send
  confirmed records to model providers in this UI path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Provider sync`.
- Confirm the `Provider sync` value is `DISABLED`.
- Confirm no provider upload, provider sync toggle, credential prompt,
  import/export, cloud sync, plugin upload, or external destination controls are
  visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Edit/Restore Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
edit/restore as not enabled. This keeps the user-controlled Memory view clear:
confirmed memory records can be viewed and deleted, but mutation history,
restore, undo, and record editing are not open in this path yet.

Scope completed:
- Added `Edit/restore` to the Memory boundary panel with `NOT_ENABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, export/import status, snapshot controls, Task Runtime storage,
  provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, edit mutation path, undo stack, restore
  workflow, snapshot restore, import parser, provider call, prompt assembly,
  Qwen runtime, vector retrieval, Planner behavior, plugin execution, browser
  launch, desktop launch, shell, filesystem search, telemetry, installer,
  release behavior, model training, dataset export, or prompt injection
  behavior was added.
- Edit/restore status is renderer-only and documents that Memory currently has
  no record mutation or recovery path beyond existing deletion.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Edit/restore`.
- Confirm the `Edit/restore` value is `NOT_ENABLED`.
- Confirm memory records still expose view/delete behavior only.
- Confirm no edit form, restore button, undo control, snapshot restore,
  mutation history, export/import, provider upload, cloud sync, plugin upload,
  or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Export/Import Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
export/import as not enabled. This keeps the Memory surface honest about the
current user-controlled data boundary: confirmed memories are visible and
deletable, but bulk export/import has not been opened yet.

Scope completed:
- Added `Export/import` to the Memory boundary panel with `NOT_ENABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, Task Runtime storage, provider/runtime
  projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, file picker, archive writer, import parser,
  bulk restore path, provider call, prompt assembly, Qwen runtime, vector
  retrieval, Planner behavior, plugin execution, browser launch, desktop launch,
  shell, filesystem search, telemetry, installer, release behavior, model
  training, dataset export, or prompt injection behavior was added.
- Export/import status is renderer-only and documents that Memory currently has
  no bulk data movement path in this UI.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Export/import`.
- Confirm the `Export/import` value is `NOT_ENABLED`.
- Confirm no export, import, restore, file picker, cloud sync, provider upload,
  plugin upload, or external destination controls are visible.
- Confirm route aliases, voice aliases, preferences, deletion, filters, sorting,
  snapshot controls, and all privacy retention boundaries remain unchanged.
- Confirm `Provider/raw private` remains `HIDDEN`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Task History Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows task
history retention as disabled. This keeps the Memory view clear that Task
Runtime records remain governed by the Task Runtime repository and are not
silently copied into user-controlled Memory as long-term memory records.

Scope completed:
- Added `Task history retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, Task Runtime
  storage, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, task repository migration, task-history copy,
  automatic memory write, provider call, prompt assembly, Qwen runtime, vector
  retrieval, Planner behavior, plugin execution, browser launch, desktop launch,
  shell, filesystem search, telemetry, installer, release behavior, model
  training, dataset export, or prompt injection behavior was added.
- Task history retention status is renderer-only and documents that Memory does
  not retain Task Runtime history in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Task history retention`.
- Confirm the `Task history retention` value is `DISABLED`.
- Open the Tasks view and confirm existing task cards remain governed by the
  task timeline, not duplicated as Memory records.
- Return to Memory and confirm no task-history memory record, task replay
  control, task export, provider upload, cloud sync, plugin upload, or external
  destination controls are visible.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm route aliases, voice aliases, preferences, and all privacy retention
  boundaries remain unchanged.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, task-history retention controls, provider personalization,
  prompt injection, retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Vector Index Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows vector
index retention as disabled. This keeps the Memory view clear that semantic
index material is not silently retained by the user-controlled Memory surface,
and that vector retrieval remains outside this path.

Scope completed:
- Added `Vector index retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, vector index creation, embedding write,
  semantic retrieval, provider call, prompt assembly, Qwen runtime, Planner
  behavior, plugin execution, browser launch, desktop launch, shell, filesystem
  search, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Vector index retention status is renderer-only and documents that Memory does
  not retain semantic index material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Vector index retention`.
- Confirm the `Vector index retention` value is `DISABLED`.
- Confirm no vector index creation, embedding write, semantic retrieval, model
  upload, provider upload, cloud sync, plugin upload, or external destination
  controls are visible.
- Confirm the Model Governance panel still shows `Vector retrieval` as
  `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm route aliases, voice aliases, preferences, and all privacy retention
  boundaries remain unchanged.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, vector retrieval, provider personalization, prompt
  injection, retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Saved View Presets Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows saved
view presets as not enabled. This makes the Memory view clear that filter, sort,
search, and view preferences remain transient UI state and are not silently
persisted as user profile memory.

Scope completed:
- Added `Saved view presets` to the Memory boundary panel with `NOT_ENABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, saved-view preset store, profile preference
  write, automatic memory write, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, release behavior,
  model training, dataset export, or prompt injection behavior was added.
- Saved view presets status is renderer-only and documents that Memory does not
  retain filter/sort/search view presets in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Saved view presets`.
- Confirm the `Saved view presets` value is `NOT_ENABLED`.
- Change kind filter, risk filter, sort order, and search text, then confirm no
  save-preset, profile-write, cloud-sync, provider-upload, plugin-upload, or
  external destination controls appear.
- Navigate away from Memory and back, then confirm the normal view controls
  still work and no new Memory record is created by viewing/filtering/sorting.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm route aliases, voice aliases, preferences, and all privacy retention
  boundaries remain unchanged.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Audit History Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows audit
history as not enabled. This makes the Memory view clear that the current
user-controlled Memory path does not silently create a separate audit-history
store for viewed, searched, filtered, sorted, or deleted memory records.

Scope completed:
- Added `Audit history` to the Memory boundary panel with `NOT_ENABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, audit event store, deletion-history retention,
  provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, plugin execution, browser launch, desktop launch, shell, filesystem
  search, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Audit history status is renderer-only and documents that Memory does not
  retain a hidden audit trail in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Audit history`.
- Confirm the `Audit history` value is `NOT_ENABLED`.
- Search, filter, sort, and view Memory records, then confirm no separate audit
  history list, export, upload, or external destination controls appear.
- Delete a test Memory record only if one is safe to delete, then confirm the
  Memory list updates and no hidden audit-history UI appears.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm route aliases, voice aliases, preferences, and all privacy retention
  boundaries remain unchanged.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, retention
  controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Prompt Cache Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows prompt
cache retention as disabled. This keeps the Memory view aligned with the project
privacy boundary that raw prompts, normalized prompts, provider prompt payloads,
conversation assembly buffers, or prompt cache artifacts must not be retained by
Memory by default.

Scope completed:
- Added `Prompt cache retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, prompt cache read, prompt cache write, provider
  prompt payload capture, conversation assembly capture, model cache scan,
  helper cache read, provider call, Qwen runtime, vector retrieval, Planner
  behavior, plugin execution, browser launch, desktop launch, shell, filesystem
  search, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Prompt cache retention status is renderer-only and documents that Memory does
  not store prompt cache material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Prompt cache retention`.
- Confirm the `Prompt cache retention` value is `DISABLED`.
- Confirm no prompt cache read, prompt cache write, provider prompt payload
  capture, conversation assembly capture, prompt export, provider upload,
  training export, cloud sync, plugin upload, or external destination controls
  are visible.
- Confirm `Model cache retention`, `Telemetry payload retention`, `Error report
  retention`, `Crash dump retention`, `Network identifier retention`, `Device
  identifier retention`, `Credential retention`, `Autofill retention`, `Download
  history retention`, `Cookie retention`, `Browser history retention`,
  `Identity document retention`, `Email retention`, `Calendar retention`,
  `Health retention`, `Contact retention`, `Biometric retention`, `Location
  retention`, `Payment data retention`, `Secret retention`, `Clipboard
  retention`, `File content retention`, `Screen capture retention`, `Raw
  transcript retention`, and `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, prompt cache
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Model Cache Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows model
cache retention as disabled. This keeps the Memory view aligned with the project
privacy boundary that local model cache metadata, helper runtime cache material,
model prompt cache artifacts, or provider-side cache references must not be
retained by Memory by default.

Scope completed:
- Added `Model cache retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, model cache scan, helper cache read, prompt
  cache materialization, provider cache reference capture, provider call, prompt
  assembly, Qwen runtime, vector retrieval, Planner behavior, plugin execution,
  browser launch, desktop launch, shell, filesystem search, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Model cache retention status is renderer-only and documents that Memory does
  not store model cache material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Model cache retention`.
- Confirm the `Model cache retention` value is `DISABLED`.
- Confirm no model cache scan, helper cache read, prompt cache materialization,
  provider cache reference capture, provider upload, training export, cloud
  sync, plugin upload, or external destination controls are visible.
- Confirm `Telemetry payload retention`, `Error report retention`, `Crash dump
  retention`, `Network identifier retention`, `Device identifier retention`,
  `Credential retention`, `Autofill retention`, `Download history retention`,
  `Cookie retention`, `Browser history retention`, `Identity document
  retention`, `Email retention`, `Calendar retention`, `Health retention`,
  `Contact retention`, `Biometric retention`, `Location retention`, `Payment
  data retention`, `Secret retention`, `Clipboard retention`, `File content
  retention`, `Screen capture retention`, `Raw transcript retention`, and `Raw
  audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, model cache
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Telemetry Payload Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
telemetry payload retention as disabled. This keeps the Memory view aligned with
the project privacy boundary that analytics payloads, event batches, raw usage
events, diagnostic telemetry, or behavioral traces must not be retained by
Memory by default.

Scope completed:
- Added `Telemetry payload retention` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, telemetry collection, analytics event capture,
  usage trace capture, diagnostic telemetry upload, provider call, prompt
  assembly, Qwen runtime, vector retrieval, Planner behavior, plugin execution,
  browser launch, desktop launch, shell, filesystem search, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Telemetry payload retention status is renderer-only and documents that Memory
  does not store telemetry payload material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Telemetry payload retention`.
- Confirm the `Telemetry payload retention` value is `DISABLED`.
- Confirm no telemetry collection, analytics event capture, usage trace capture,
  diagnostic telemetry upload, provider upload, training export, cloud sync,
  plugin upload, or external destination controls are visible.
- Confirm `Error report retention`, `Crash dump retention`, `Network identifier
  retention`, `Device identifier retention`, `Credential retention`, `Autofill
  retention`, `Download history retention`, `Cookie retention`, `Browser
  history retention`, `Identity document retention`, `Email retention`,
  `Calendar retention`, `Health retention`, `Contact retention`, `Biometric
  retention`, `Location retention`, `Payment data retention`, `Secret
  retention`, `Clipboard retention`, `File content retention`, `Screen capture
  retention`, `Raw transcript retention`, and `Raw audio retention` remain
  `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, telemetry
  payload retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Error Report Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows error
report retention as disabled. This keeps the Memory view aligned with the
project privacy boundary that unsanitized error reports, renderer exception
payloads, raw diagnostics, or bundled user-context error payloads must not be
retained by default.

Scope completed:
- Added `Error report retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, error report capture, raw diagnostic
  collection, exception payload collection, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, plugin execution, browser launch,
  desktop launch, shell, filesystem search, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Error report retention status is renderer-only and documents that Memory does
  not store unsanitized error report material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Error report retention`.
- Confirm the `Error report retention` value is `DISABLED`.
- Confirm no error report capture, raw diagnostic collection, exception payload
  collection, provider upload, training export, cloud sync, plugin upload, or
  external destination controls are visible.
- Confirm `Crash dump retention`, `Network identifier retention`, `Device
  identifier retention`, `Credential retention`, `Autofill retention`, `Download
  history retention`, `Cookie retention`, `Browser history retention`,
  `Identity document retention`, `Email retention`, `Calendar retention`,
  `Health retention`, `Contact retention`, `Biometric retention`, `Location
  retention`, `Payment data retention`, `Secret retention`, `Clipboard
  retention`, `File content retention`, `Screen capture retention`, `Raw
  transcript retention`, and `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, error report
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Crash Dump Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows crash
dump retention as disabled. This keeps the Memory view aligned with the project
privacy boundary that renderer crash dumps, raw stacks, diagnostic dumps,
process snapshots, or bundled error payloads must not be retained by default.

Scope completed:
- Added `Crash dump retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, crash dump capture, stack capture, process
  snapshot capture, diagnostic dump collection, provider call, prompt assembly,
  Qwen runtime, vector retrieval, Planner behavior, plugin execution, browser
  launch, desktop launch, shell, filesystem search, telemetry, installer,
  release behavior, model training, dataset export, or prompt injection behavior
  was added.
- Crash dump retention status is renderer-only and documents that Memory does
  not store crash dump or raw stack material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Crash dump retention`.
- Confirm the `Crash dump retention` value is `DISABLED`.
- Confirm no crash dump capture, raw stack capture, diagnostic dump collection,
  process snapshot capture, provider upload, training export, cloud sync, plugin
  upload, or external destination controls are visible.
- Confirm `Network identifier retention`, `Device identifier retention`,
  `Credential retention`, `Autofill retention`, `Download history retention`,
  `Cookie retention`, `Browser history retention`, `Identity document
  retention`, `Email retention`, `Calendar retention`, `Health retention`,
  `Contact retention`, `Biometric retention`, `Location retention`, `Payment
  data retention`, `Secret retention`, `Clipboard retention`, `File content
  retention`, `Screen capture retention`, `Raw transcript retention`, and `Raw
  audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, crash dump
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Network Identifier Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows network
identifier retention as disabled. This keeps the Memory view aligned with the
project privacy boundary that IP addresses, local network names, network adapter
identifiers, router identifiers, or similar network identity material must not
be retained by default.

Scope completed:
- Added `Network identifier retention` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, IP capture, network scan, adapter enumeration,
  router identifier capture, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, release behavior,
  model training, dataset export, or prompt injection behavior was added.
- Network identifier retention status is renderer-only and documents that
  Memory does not store network identifier material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Network identifier retention`.
- Confirm the `Network identifier retention` value is `DISABLED`.
- Confirm no IP capture, network scan, adapter enumeration, router identifier
  capture, provider upload, training export, cloud sync, plugin upload, or
  external destination controls are visible.
- Confirm `Device identifier retention`, `Credential retention`, `Autofill
  retention`, `Download history retention`, `Cookie retention`, `Browser
  history retention`, `Identity document retention`, `Email retention`,
  `Calendar retention`, `Health retention`, `Contact retention`, `Biometric
  retention`, `Location retention`, `Payment data retention`, `Secret
  retention`, `Clipboard retention`, `File content retention`, `Screen capture
  retention`, `Raw transcript retention`, and `Raw audio retention` remain
  `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, network
  identifier retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Device Identifier Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows device
identifier retention as disabled. This keeps the Memory view aligned with the
project privacy boundary that hardware IDs, advertising IDs, device
fingerprints, machine identifiers, MAC-like identifiers, or other device
identity material must not be retained by default.

Scope completed:
- Added `Device identifier retention` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, hardware ID collection, device fingerprinting,
  MAC address scan, machine identifier capture, provider call, prompt assembly,
  Qwen runtime, vector retrieval, Planner behavior, plugin execution, browser
  launch, desktop launch, shell, filesystem search, telemetry, installer,
  release behavior, model training, dataset export, or prompt injection behavior
  was added.
- Device identifier retention status is renderer-only and documents that Memory
  does not store device identifier material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Device identifier retention`.
- Confirm the `Device identifier retention` value is `DISABLED`.
- Confirm no hardware ID collection, device fingerprinting, MAC address scan,
  machine identifier capture, provider upload, training export, cloud sync,
  plugin upload, or external destination controls are visible.
- Confirm `Credential retention`, `Autofill retention`, `Download history
  retention`, `Cookie retention`, `Browser history retention`, `Identity
  document retention`, `Email retention`, `Calendar retention`, `Health
  retention`, `Contact retention`, `Biometric retention`, `Location retention`,
  `Payment data retention`, `Secret retention`, `Clipboard retention`, `File
  content retention`, `Screen capture retention`, `Raw transcript retention`,
  and `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, device
  identifier retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Credential Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
credential retention as disabled. This keeps the Memory view aligned with the
project privacy boundary that API keys, passwords, access tokens, refresh
tokens, auth headers, session secrets, SSH keys, or provider credentials must
not be retained by default.

Scope completed:
- Added `Credential retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, credential import, secure-store read,
  password-manager access, token parsing, auth-header capture, provider call,
  prompt assembly, Qwen runtime, vector retrieval, Planner behavior, plugin
  execution, browser launch, desktop launch, shell, filesystem search,
  telemetry, installer, release behavior, model training, dataset export, or
  prompt injection behavior was added.
- Credential retention status is renderer-only and documents that Memory does
  not store credential material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Credential retention`.
- Confirm the `Credential retention` value is `DISABLED`.
- Confirm no credential import, secure-store read, password-manager access,
  token parsing, auth-header capture, provider upload, training export, cloud
  sync, plugin upload, or external destination controls are visible.
- Confirm `Autofill retention`, `Download history retention`, `Cookie
  retention`, `Browser history retention`, `Identity document retention`,
  `Email retention`, `Calendar retention`, `Health retention`, `Contact
  retention`, `Biometric retention`, `Location retention`, `Payment data
  retention`, `Secret retention`, `Clipboard retention`, `File content
  retention`, `Screen capture retention`, `Raw transcript retention`, and `Raw
  audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, credential
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Autofill Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows autofill
retention as disabled. This keeps the Memory view aligned with the project
privacy boundary that saved form fields, addresses, names, phone numbers,
password-manager metadata, payment autofill fields, or other browser autofill
material must not be retained by default.

Scope completed:
- Added `Autofill retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, browser autofill import, password-manager
  access, saved form-field scan, payment autofill parsing, browser profile scan,
  provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, plugin execution, browser launch, desktop launch, shell, filesystem
  search, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Autofill retention status is renderer-only and documents that Memory does not
  store browser autofill material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Autofill retention`.
- Confirm the `Autofill retention` value is `DISABLED`.
- Confirm no browser autofill import, password-manager access, saved form-field
  scan, payment autofill parsing, browser profile scan, provider upload,
  training export, cloud sync, plugin upload, or external destination controls
  are visible.
- Confirm `Download history retention`, `Cookie retention`, `Browser history
  retention`, `Identity document retention`, `Email retention`, `Calendar
  retention`, `Health retention`, `Contact retention`, `Biometric retention`,
  `Location retention`, `Payment data retention`, `Secret retention`,
  `Clipboard retention`, `File content retention`, `Screen capture retention`,
  `Raw transcript retention`, and `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, autofill
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Download History Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows download
history retention as disabled. This keeps the Memory view aligned with the
project privacy boundary that browser downloads, downloaded file lists, source
URLs, download timestamps, browser profile metadata, or related browsing
activity must not be retained by default.

Scope completed:
- Added `Download history retention` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, download history import, browser profile scan,
  raw URL capture, downloaded file enumeration, provider call, prompt assembly,
  Qwen runtime, vector retrieval, Planner behavior, plugin execution, browser
  launch, desktop launch, shell, filesystem search, telemetry, installer,
  release behavior, model training, dataset export, or prompt injection
  behavior was added.
- Download history retention status is renderer-only and documents that Memory
  does not store browser download history material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Download history retention`.
- Confirm the `Download history retention` value is `DISABLED`.
- Confirm no download history import, browser profile scan, raw URL capture,
  downloaded file enumeration, provider upload, training export, cloud sync,
  plugin upload, or external destination controls are visible.
- Confirm `Cookie retention`, `Browser history retention`, `Identity document
  retention`, `Email retention`, `Calendar retention`, `Health retention`,
  `Contact retention`, `Biometric retention`, `Location retention`, `Payment
  data retention`, `Secret retention`, `Clipboard retention`, `File content
  retention`, `Screen capture retention`, `Raw transcript retention`, and `Raw
  audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, download
  history retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Cookie Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows cookie
retention as disabled. This keeps the Memory view aligned with the project
privacy boundary that browser cookies, session cookies, auth cookies, tracking
cookies, or other browser credential-like state must not be retained by default.

Scope completed:
- Added `Cookie retention` to the Memory boundary panel with `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, cookie import, browser profile scan, session
  extraction, auth state parsing, raw URL capture, provider call, prompt
  assembly, Qwen runtime, vector retrieval, Planner behavior, plugin execution,
  browser launch, desktop launch, shell, filesystem search, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Cookie retention status is renderer-only and documents that Memory does not
  store browser cookie material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Cookie retention`.
- Confirm the `Cookie retention` value is `DISABLED`.
- Confirm no cookie import, browser profile scan, session extraction, auth
  state parsing, raw URL capture, provider upload, training export, cloud sync,
  plugin upload, or external destination controls are visible.
- Confirm `Browser history retention`, `Identity document retention`, `Email
  retention`, `Calendar retention`, `Health retention`, `Contact retention`,
  `Biometric retention`, `Location retention`, `Payment data retention`,
  `Secret retention`, `Clipboard retention`, `File content retention`, `Screen
  capture retention`, `Raw transcript retention`, and `Raw audio retention`
  remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, cookie
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Browser History Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows browser
history retention as disabled. This keeps the Memory view aligned with the
project privacy boundary that browsing history, browser profile data, raw URLs,
tabs, cookies, downloads, or other browser-private material must not be retained
by default.

Scope completed:
- Added `Browser history retention` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, browser history import, profile scan, tab
  enumeration, cookie access, raw URL capture, download history parsing,
  provider call, prompt assembly, Qwen runtime, vector retrieval, Planner
  behavior, plugin execution, browser launch, desktop launch, shell, filesystem
  search, telemetry, installer, release behavior, model training, dataset
  export, or prompt injection behavior was added.
- Browser history retention status is renderer-only and documents that Memory
  does not store browser-private material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Browser history retention`.
- Confirm the `Browser history retention` value is `DISABLED`.
- Confirm no browser history import, profile scan, tab enumeration, cookie
  access, raw URL capture, download history parsing, provider upload, training
  export, cloud sync, plugin upload, or external destination controls are
  visible.
- Confirm `Identity document retention`, `Email retention`, `Calendar
  retention`, `Health retention`, `Contact retention`, `Biometric retention`,
  `Location retention`, `Payment data retention`, `Secret retention`,
  `Clipboard retention`, `File content retention`, `Screen capture retention`,
  `Raw transcript retention`, and `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, browser
  history retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Identity Document Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
identity document retention as disabled. This keeps the Memory view aligned
with the project privacy boundary that passport, national ID, driver's license,
tax ID, account verification document, or other identity-document material must
not be retained by default.

Scope completed:
- Added `Identity document retention` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, ID import, document OCR, KYC scan, tax ID
  parsing, account verification parsing, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, plugin execution, browser
  launch, desktop launch, shell, filesystem search, telemetry, installer,
  release behavior, model training, dataset export, or prompt injection
  behavior was added.
- Identity document retention status is renderer-only and documents that Memory
  does not store identity-document material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Identity document retention`.
- Confirm the `Identity document retention` value is `DISABLED`.
- Confirm no ID import, document OCR, KYC scan, tax ID parsing, account
  verification parsing, provider upload, training export, cloud sync, plugin
  upload, or external destination controls are visible.
- Confirm `Email retention`, `Calendar retention`, `Health retention`, `Contact
  retention`, `Biometric retention`, `Location retention`, `Payment data
  retention`, `Secret retention`, `Clipboard retention`, `File content
  retention`, `Screen capture retention`, `Raw transcript retention`, and `Raw
  audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, identity
  document retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Email Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows email
retention as disabled. This keeps the Memory view aligned with the project
privacy boundary that email bodies, recipients, subjects, attachments, mailbox
metadata, or other message-like material must not be retained by default.

Scope completed:
- Added `Email retention` to the Memory boundary panel with `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, mailbox import, email account access, message
  scan, attachment scan, recipient extraction, provider call, prompt assembly,
  Qwen runtime, vector retrieval, Planner behavior, plugin execution, browser
  launch, desktop launch, shell, filesystem search, telemetry, installer,
  release behavior, model training, dataset export, or prompt injection
  behavior was added.
- Email retention status is renderer-only and documents that Memory does not
  store email-like material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Email retention`.
- Confirm the `Email retention` value is `DISABLED`.
- Confirm no mailbox import, email account, message scan, attachment scan,
  recipient extraction, provider upload, training export, cloud sync, plugin
  upload, or external destination controls are visible.
- Confirm `Calendar retention`, `Health retention`, `Contact retention`,
  `Biometric retention`, `Location retention`, `Payment data retention`,
  `Secret retention`, `Clipboard retention`, `File content retention`, `Screen
  capture retention`, `Raw transcript retention`, and `Raw audio retention`
  remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, email
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Calendar Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
calendar retention as disabled. This keeps the Memory view aligned with the
project privacy boundary that meetings, schedules, reminders, attendees,
availability, and other calendar-like material must not be retained by default.

Scope completed:
- Added `Calendar retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, calendar import, meeting scan, reminder scan,
  attendee extraction, availability sync, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, plugin execution, browser
  launch, desktop launch, shell, filesystem search, telemetry, installer,
  release behavior, model training, dataset export, or prompt injection
  behavior was added.
- Calendar retention status is renderer-only and documents that Memory does
  not store calendar-like material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Calendar retention`.
- Confirm the `Calendar retention` value is `DISABLED`.
- Confirm no calendar import, meeting scan, reminder scan, attendee extraction,
  availability sync, provider upload, training export, cloud sync, plugin
  upload, or external destination controls are visible.
- Confirm `Health retention`, `Contact retention`, `Biometric retention`,
  `Location retention`, `Payment data retention`, `Secret retention`,
  `Clipboard retention`, `File content retention`, `Screen capture retention`,
  `Raw transcript retention`, and `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, calendar
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Health Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows health
retention as disabled. This keeps the Memory view aligned with the project
privacy boundary that medical, wellness, biometric-adjacent, diagnosis,
medication, or other health-like material must not be retained by default.

Scope completed:
- Added `Health retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, health profile, medical import, diagnosis
  parsing, medication parsing, wearable integration, provider call, prompt
  assembly, Qwen runtime, vector retrieval, Planner behavior, plugin execution,
  browser launch, desktop launch, shell, filesystem search, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Health retention status is renderer-only and documents that Memory does not
  store health-like material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Health retention`.
- Confirm the `Health retention` value is `DISABLED`.
- Confirm no health profile, medical import, diagnosis view, medication view,
  wearable sync, provider upload, training export, cloud sync, plugin upload,
  or external destination controls are visible.
- Confirm `Contact retention`, `Biometric retention`, `Location retention`,
  `Payment data retention`, `Secret retention`, `Clipboard retention`, `File
  content retention`, `Screen capture retention`, `Raw transcript retention`,
  and `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, health
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Contact Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows contact
retention as disabled. This keeps the Memory view aligned with the project
privacy boundary that address book, phone, email, social handle, customer list,
or other contact-like material must not be retained by default.

Scope completed:
- Added `Contact retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, contact import, address book scan, email
  account access, social graph access, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, plugin execution, browser
  launch, desktop launch, shell, filesystem search, telemetry, installer,
  release behavior, model training, dataset export, or prompt injection
  behavior was added.
- Contact retention status is renderer-only and documents that Memory does not
  store contact-like material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Contact retention`.
- Confirm the `Contact retention` value is `DISABLED`.
- Confirm no contact import, address book scan, email account, social graph,
  customer list, provider upload, training export, cloud sync, plugin upload,
  or external destination controls are visible.
- Confirm `Biometric retention`, `Location retention`, `Payment data retention`,
  `Secret retention`, `Clipboard retention`, `File content retention`, `Screen
  capture retention`, `Raw transcript retention`, and `Raw audio retention`
  remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, contact
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Biometric Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
biometric retention as disabled. This keeps the Memory view aligned with the
project privacy boundary that voice/audio-derived identity, face, fingerprint,
or other biometric material must not be retained by default.

Scope completed:
- Added `Biometric retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, biometric capture, face capture, fingerprint
  capture, speaker identification, voiceprint storage, provider call, prompt
  assembly, Qwen runtime, vector retrieval, Planner behavior, plugin execution,
  browser launch, desktop launch, shell, filesystem search, telemetry,
  installer, release behavior, model training, dataset export, or prompt
  injection behavior was added.
- Biometric retention status is renderer-only and documents that Memory does
  not store biometric material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Biometric retention`.
- Confirm the `Biometric retention` value is `DISABLED`.
- Confirm no face viewer, fingerprint viewer, voiceprint viewer, biometric
  profile, biometric export, provider upload, training export, cloud sync,
  plugin upload, or external destination controls are visible.
- Confirm `Location retention`, `Payment data retention`, `Secret retention`,
  `Clipboard retention`, `File content retention`, `Screen capture retention`,
  `Raw transcript retention`, and `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, biometric
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Location Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
location retention as disabled. This keeps the Memory view aligned with the
project privacy boundary that location-like context must not be retained by
default.

Scope completed:
- Added `Location retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, location capture, geolocation provider call,
  IP geolocation, provider call, prompt assembly, Qwen runtime, vector
  retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, release behavior,
  model training, dataset export, or prompt injection behavior was added.
- Location retention status is renderer-only and documents that Memory does not
  store location-like context in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Location retention`.
- Confirm the `Location retention` value is `DISABLED`.
- Confirm no location history viewer, geolocation controls, IP geolocation,
  map/location export, provider upload, training export, cloud sync, plugin
  upload, or external destination controls are visible.
- Confirm `Payment data retention`, `Secret retention`, `Clipboard retention`,
  `File content retention`, `Screen capture retention`, `Raw transcript
  retention`, and `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, location
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Payment Data Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows payment
data retention as disabled. This keeps the Memory view aligned with the project
rule that payment, bank card, checkout, and financial commitment data must not
be retained by default.

Scope completed:
- Added `Payment data retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, payment data capture, bank card capture,
  checkout data capture, transaction action, provider call, prompt assembly,
  Qwen runtime, vector retrieval, Planner behavior, plugin execution, browser
  launch, desktop launch, shell, filesystem search, telemetry, installer,
  release behavior, model training, dataset export, or prompt injection
  behavior was added.
- Payment data retention status is renderer-only and documents that Memory does
  not store payment or financial commitment data in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Payment data retention`.
- Confirm the `Payment data retention` value is `DISABLED`.
- Confirm no payment detail viewer, bank card viewer, checkout history,
  transaction export, provider upload, training export, cloud sync, plugin
  upload, or external destination controls are visible.
- Confirm `Secret retention`, `Clipboard retention`, `File content retention`,
  `Screen capture retention`, `Raw transcript retention`, and
  `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, payment data
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Secret Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows secret
retention as disabled. This keeps the Memory view aligned with the project rule
that credentials, tokens, passwords, and authentication material must not be
retained by default.

Scope completed:
- Added `Secret retention` to the Memory boundary panel with `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, credential access, token capture, password
  capture, auth header capture, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch,
  desktop launch, shell, filesystem search, telemetry, installer, release
  behavior, model training, dataset export, or prompt injection behavior was
  added.
- Secret retention status is renderer-only and documents that Memory does not
  store credentials or authentication material in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Secret retention`.
- Confirm the `Secret retention` value is `DISABLED`.
- Confirm no credential viewer, token viewer, password viewer, auth header
  viewer, secret export, provider upload, training export, cloud sync, plugin
  upload, or external destination controls are visible.
- Confirm `Clipboard retention`, `File content retention`, `Screen capture
  retention`, `Raw transcript retention`, and `Raw audio retention` remain
  `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, secret
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Clipboard Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
clipboard retention as disabled. This keeps the Memory view aligned with the
project boundary that clipboard content is sensitive and must not be retained
by default.

Scope completed:
- Added `Clipboard retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, clipboard read, clipboard write, clipboard
  history capture, provider call, prompt assembly, Qwen runtime, vector
  retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, release behavior,
  model training, dataset export, or prompt injection behavior was added.
- Clipboard retention status is renderer-only and documents that Memory does
  not store clipboard content in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Clipboard retention`.
- Confirm the `Clipboard retention` value is `DISABLED`.
- Confirm no clipboard preview, clipboard history viewer, clipboard export,
  provider upload, training export, cloud sync, plugin upload, or external
  destination controls are visible.
- Confirm `File content retention`, `Screen capture retention`, `Raw transcript
  retention`, and `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, clipboard
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory File Content Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows file
content retention as disabled. This keeps the Memory view aligned with the
project rule that file search and file-related workflows must not imply
long-term storage of full file contents by default.

Scope completed:
- Added `File content retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, file content capture, file content indexing,
  filesystem search, filesystem open, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, plugin execution, browser
  launch, desktop launch, shell, telemetry, installer, release behavior, model
  training, dataset export, or prompt injection behavior was added.
- File content retention status is renderer-only and documents that Memory does
  not store full file contents in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `File content retention`.
- Confirm the `File content retention` value is `DISABLED`.
- Confirm no file content viewer, full-file snapshot, filesystem index viewer,
  file export, provider upload, training export, cloud sync, plugin upload, or
  external destination controls are visible.
- Confirm `Screen capture retention`, `Raw transcript retention`, and
  `Raw audio retention` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, file content
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Screen Capture Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows screen
capture retention as disabled. This keeps the Memory view aligned with the
project privacy boundary that raw screen captures are not stored by default.

Scope completed:
- Added `Screen capture retention` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, screen capture, screenshot storage, OCR
  provider call, provider call, prompt assembly, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, release behavior, model training,
  dataset export, or prompt injection behavior was added.
- Screen capture retention status is renderer-only and documents that Memory
  does not store raw screen captures in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Screen capture retention`.
- Confirm the `Screen capture retention` value is `DISABLED`.
- Confirm no screenshot preview, raw screen capture viewer, OCR payload,
  screen export, provider upload, training export, cloud sync, plugin upload,
  or external destination controls are visible.
- Confirm `Raw transcript retention` and `Raw audio retention` remain
  `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, raw screen
  capture retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Raw Transcript Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows raw
transcript retention as disabled. This separates user-confirmed voice aliases
from raw ASR transcript storage and keeps the Memory view aligned with the
privacy boundary that raw provider/audio/transcript data is not retained by
default.

Scope completed:
- Added `Raw transcript retention` to the Memory boundary panel with
  `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, ASR provider change, raw transcript storage,
  audio capture, raw audio storage, provider call, prompt assembly, Qwen
  runtime, vector retrieval, Planner behavior, plugin execution, browser
  launch, desktop launch, shell, filesystem search, telemetry, installer,
  release behavior, model training, dataset export, or prompt injection
  behavior was added.
- Raw transcript retention status is renderer-only and documents that Memory
  does not store raw ASR transcripts in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Raw transcript retention`.
- Confirm the `Raw transcript retention` value is `DISABLED`.
- Confirm voice alias records remain visible/deletable when present.
- Confirm no raw transcript viewer, ASR transcript export, ASR provider payload,
  provider upload, training export, cloud sync, plugin upload, or external
  destination controls are visible.
- Confirm `Raw audio retention` remains `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, raw transcript
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Raw Audio Retention Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows raw
audio retention as disabled. This clarifies that voice-related Memory records
may expose user-confirmed aliases, but the Memory view does not imply raw ASR
audio capture or long-term audio retention.

Scope completed:
- Added `Raw audio retention` to the Memory boundary panel with `DISABLED`
  status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, ASR provider change, audio capture, raw audio
  storage, provider call, prompt assembly, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, release behavior, model training,
  dataset export, or prompt injection behavior was added.
- Raw audio retention status is renderer-only and documents that Memory does
  not store raw voice audio in this path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Raw audio retention`.
- Confirm the `Raw audio retention` value is `DISABLED`.
- Confirm voice alias records remain visible/deletable when present.
- Confirm no raw audio playback, audio export, waveform, ASR provider payload,
  provider upload, training export, cloud sync, plugin upload, or external
  destination controls are visible.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm `Prompt injection` remains `DISABLED`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, raw audio
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Prompt Injection Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows prompt
injection as disabled. This clarifies that saved Memory records are not
silently appended to model prompts or provider calls in the current
developer-alpha path.

Scope completed:
- Added `Prompt injection` to the Memory boundary panel with `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, provider call, prompt assembly, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, release behavior,
  model training, dataset export, or prompt injection behavior was added.
- Prompt injection status is renderer-only and documents that Memory records do
  not automatically enter provider prompts.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Prompt injection`.
- Confirm the `Prompt injection` value is `DISABLED`.
- Confirm no prompt preview, prompt injection toggle, provider prompt compose,
  provider upload, training export, cloud sync, plugin upload, or external
  destination controls are visible.
- Confirm `Provider personalization` remains `NOT_ENABLED`.
- Confirm `Provider/runtime` remains `NOT USED`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, prompt injection, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Provider Personalization Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows provider
personalization as not enabled. This keeps preference records visible and
deletable while making clear that they are not automatically injected into chat
providers or used to change provider behavior in this developer-alpha path.

Scope completed:
- Added `Provider personalization` to the Memory boundary panel with
  `NOT_ENABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preference records, filters, sorting,
  deletion, snapshot controls, provider/runtime projections, and safety gates
  unchanged.

Safety boundaries:
- No backend persistence schema, provider call, prompt injection, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, release behavior,
  model training, or dataset export behavior was added.
- Provider personalization status is renderer-only and documents that Memory
  preferences do not yet alter provider behavior automatically.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Provider personalization`.
- Confirm the `Provider personalization` value is `NOT_ENABLED`.
- Confirm preference records remain visible and deletable.
- Ask a chat question after saving a response-language preference and confirm
  provider behavior is not silently changed by Memory.
- Confirm no prompt injection, provider upload, provider personalization toggle,
  training export, cloud sync, plugin upload, or external destination controls
  are visible.
- Confirm `Provider/runtime` remains `NOT USED`, `Model training` remains
  `DISABLED`, and `Training export` remains `DISABLED`.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, provider personalization, and release readiness are not
  complete.

## 2026-08-13: User-Controlled Memory Training Export Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory boundary projection that explicitly shows
training-data export as disabled. This makes the current user-controlled
Memory policy clearer: visible Memory records are not exported into model
training, dataset generation, fine-tuning, or provider/plugin pipelines.

Scope completed:
- Added `Training export` to the Memory boundary panel with `DISABLED` status.
- Reused the existing Memory boundary projection pattern and sanitized local UI
  state only.
- Kept route aliases, voice aliases, preferences, filters, sorting, deletion,
  snapshot controls, provider/runtime projections, and safety gates unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, release behavior, model training, or
  dataset export behavior was added.
- Training export status is renderer-only and documents that Memory is not used
  as training data in this developer-alpha path.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Training export`.
- Confirm the `Training export` value is `DISABLED`.
- Confirm no export-to-training, dataset export, fine-tune, model training,
  provider upload, plugin upload, cloud sync, or external destination controls
  are visible.
- Confirm `Model training` remains `DISABLED`.
- Confirm `Network access` remains `DISABLED`.
- Confirm `Credential access` remains `NO_ACCESS`.
- Confirm `Cloud sync` and `External sharing` remain `DISABLED`.
- Confirm Memory records remain visible/deletable only and no record changes
  occur from viewing, filtering, searching, or sorting.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history,
  storage encryption, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Model Training Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local model training boundary projection to the Memory boundary
panel so users can see that Memory records are not used for model training in
this phase.

Scope completed:
- Added `Model training` to the Memory boundary panel with `DISABLED` status.
- Kept existing record list, delete flow, network access status, credential
  access status, storage encryption status, cloud account status, cloud sync
  status, recording pause status, recording mode status, retention controls
  status, snapshot provenance status, snapshot schema validation status, raw
  snapshot review status, snapshot redaction status, snapshot export/import
  controls, external sharing boundary, provider audit boundary, session-only
  boundary, expiration boundary, plugin access boundary, background indexing
  boundary, auto-capture boundary, edit boundary, restore boundary, snapshot
  policy, import/export boundaries, retention scope, delete boundary, write
  policy, source boundary, filters, search, sort, visible count, raw exposure
  check, provider-neutral count, source counts, count consistency check, and
  safety badges unchanged.
- Did not add training, fine-tuning, dataset export, network calls, cloud sync
  execution, external sharing, credential loading, provider calls, plugin
  access, vector retrieval, snapshot import execution, restore execution, raw
  snapshot export, schema changes, or provider behavior.

Safety boundaries:
- No backend persistence schema, credential access, provider call, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, or release behavior
  was added.
- Model training status is renderer-only and documents that Memory is not used
  for training or fine-tuning.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Model training`.
- Confirm the `Model training` value is `DISABLED`.
- Confirm there is no train, fine-tune, dataset export, upload, sync, provider,
  model, plugin, or external destination control in the Memory view.
- Confirm `Network access` remains `DISABLED`.
- Confirm `Credential access` remains `NO_ACCESS`.
- Confirm `Cloud sync` and `External sharing` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the model training projection
  remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, download, train,
  fine-tune, expire, pause, resume, link an account, access credentials, call a
  network, or retrieve any memory records and does not trigger provider/runtime/
  plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: model training controls, network access controls, credential controls,
  storage encryption controls, cloud account controls, cloud sync controls,
  recording pause controls, edit/restore, expiration controls, session-only
  controls, plugin access controls, provider-policy audit history, retention
  controls, external sharing controls, raw snapshot review controls, executable
  snapshot import validation, raw snapshot redaction previews, snapshot
  provenance enforcement, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Network Access Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local network access boundary projection to the Memory boundary
panel so users can see that Memory does not use network access in this phase.

Scope completed:
- Added `Network access` to the Memory boundary panel with `DISABLED` status.
- Kept existing record list, delete flow, credential access status, storage
  encryption status, cloud account status, cloud sync status, recording pause
  status, recording mode status, retention controls status, snapshot provenance
  status, snapshot schema validation status, raw snapshot review status,
  snapshot redaction status, snapshot export/import controls, external sharing
  boundary, provider audit boundary, session-only boundary, expiration boundary,
  plugin access boundary, background indexing boundary, auto-capture boundary,
  edit boundary, restore boundary, snapshot policy, import/export boundaries,
  retention scope, delete boundary, write policy, source boundary, filters,
  search, sort, visible count, raw exposure check, provider-neutral count,
  source counts, count consistency check, and safety badges unchanged.
- Did not add network calls, cloud sync execution, external sharing, credential
  loading, provider calls, plugin access, vector retrieval, snapshot import
  execution, restore execution, raw snapshot export, schema changes, or provider
  behavior.

Safety boundaries:
- No backend persistence schema, credential access, provider call, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, or release behavior
  was added.
- Network access status is renderer-only and documents that Memory has no
  network access path.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Network access`.
- Confirm the `Network access` value is `DISABLED`.
- Confirm there is no network, sync, upload, download, share, provider, plugin,
  account-linking, credential, token, or external destination control in the
  Memory view.
- Confirm `Credential access` remains `NO_ACCESS`.
- Confirm `Storage encryption` remains `NOT_ENABLED`.
- Confirm `Cloud account` remains `NOT_CONFIGURED`.
- Confirm `Cloud sync` and `External sharing` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the network access projection
  remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, download, expire,
  pause, resume, link an account, access credentials, encrypt, decrypt, call a
  network, or retrieve any memory records and does not trigger provider/runtime/
  plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: network access controls, credential controls, storage encryption
  controls, cloud account controls, cloud sync controls, recording pause
  controls, edit/restore, expiration controls, session-only controls, plugin
  access controls, provider-policy audit history, retention controls, external
  sharing controls, raw snapshot review controls, executable snapshot import
  validation, raw snapshot redaction previews, snapshot provenance enforcement,
  and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Credential Access Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local credential access boundary projection to the Memory
boundary panel so users can see that Memory does not access credentials in this
phase.

Scope completed:
- Added `Credential access` to the Memory boundary panel with `NO_ACCESS`
  status.
- Kept existing record list, delete flow, storage encryption status, cloud
  account status, cloud sync status, recording pause status, recording mode
  status, retention controls status, snapshot provenance status, snapshot schema
  validation status, raw snapshot review status, snapshot redaction status,
  snapshot export/import controls, external sharing boundary, provider audit
  boundary, session-only boundary, expiration boundary, plugin access boundary,
  background indexing boundary, auto-capture boundary, edit boundary, restore
  boundary, snapshot policy, import/export boundaries, retention scope, delete
  boundary, write policy, source boundary, filters, search, sort, visible count,
  raw exposure check, provider-neutral count, source counts, count consistency
  check, and safety badges unchanged.
- Did not add credential loading, secret-store access, encryption/decryption
  execution, key management, cloud account linking, cloud sync execution,
  upload, download, background synchronization, snapshot import execution,
  restore execution, raw snapshot export, schema changes, plugin access, vector
  retrieval, external sharing, or provider behavior.

Safety boundaries:
- No backend persistence schema, credential access, provider call, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, or release behavior
  was added.
- Credential access status is renderer-only and documents that Memory has no
  credential access path.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Credential access`.
- Confirm the `Credential access` value is `NO_ACCESS`.
- Confirm there is no credential, token, API key, secret-store, unlock, lock,
  account-linking, or key-management control in the Memory view.
- Confirm `Storage encryption` remains `NOT_ENABLED`.
- Confirm `Cloud account` remains `NOT_CONFIGURED`.
- Confirm `Cloud sync` and `External sharing` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the credential access
  projection remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, download, expire,
  pause, resume, link an account, access credentials, encrypt, decrypt, or
  retrieve any memory records and does not trigger provider/runtime/plugin/
  browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: credential controls, storage encryption controls, cloud account
  controls, cloud sync controls, recording pause controls, edit/restore,
  expiration controls, session-only controls, plugin access controls,
  provider-policy audit history, retention controls, external sharing controls,
  raw snapshot review controls, executable snapshot import validation, raw
  snapshot redaction previews, snapshot provenance enforcement, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Storage Encryption Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local storage encryption boundary projection to the Memory
boundary panel so users can see that dedicated Memory storage encryption is not
enabled in this phase.

Scope completed:
- Added `Storage encryption` to the Memory boundary panel with `NOT_ENABLED`
  status.
- Kept existing record list, delete flow, cloud account status, cloud sync
  status, recording pause status, recording mode status, retention controls
  status, snapshot provenance status, snapshot schema validation status, raw
  snapshot review status, snapshot redaction status, snapshot export/import
  controls, external sharing boundary, provider audit boundary, session-only
  boundary, expiration boundary, plugin access boundary, background indexing
  boundary, auto-capture boundary, edit boundary, restore boundary, snapshot
  policy, import/export boundaries, retention scope, delete boundary, write
  policy, source boundary, filters, search, sort, visible count, raw exposure
  check, provider-neutral count, source counts, count consistency check, and
  safety badges unchanged.
- Did not add encryption/decryption execution, key management, credential
  access, cloud account linking, cloud sync execution, upload, download,
  background synchronization, snapshot import execution, restore execution, raw
  snapshot export, schema changes, plugin access, vector retrieval, external
  sharing, or provider behavior.

Safety boundaries:
- No backend persistence schema, credential access, provider call, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, or release behavior
  was added.
- Storage encryption status is renderer-only and documents that dedicated Memory
  storage encryption is not enabled yet.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Storage encryption`.
- Confirm the `Storage encryption` value is `NOT_ENABLED`.
- Confirm there is no encryption setup, key entry, credential, unlock, lock, or
  decrypt control in the Memory view.
- Confirm `Cloud account` remains `NOT_CONFIGURED`.
- Confirm `Cloud sync` and `External sharing` remain `DISABLED`.
- Confirm `Recording mode` remains `MANUAL_ONLY` and `Recording pause` remains
  `NOT_ENABLED`.
- Confirm `Auto capture` remains `DISABLED`.
- Confirm `Background indexing` remains `DISABLED`.
- Confirm `Write policy` remains `EXPLICIT_ONLY`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the storage encryption
  projection remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, download, expire,
  pause, resume, link an account, access credentials, encrypt, decrypt, or
  retrieve any memory records and does not trigger provider/runtime/plugin/
  browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: storage encryption controls, cloud account controls, cloud sync
  controls, recording pause controls, edit/restore, expiration controls,
  session-only controls, plugin access controls, provider-policy audit history,
  retention controls, external sharing controls, raw snapshot review controls,
  executable snapshot import validation, raw snapshot redaction previews,
  snapshot provenance enforcement, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Cloud Account Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local cloud account boundary projection to the Memory boundary
panel so users can see that Memory has no configured cloud account in this
phase.

Scope completed:
- Added `Cloud account` to the Memory boundary panel with `NOT_CONFIGURED`
  status.
- Kept existing record list, delete flow, cloud sync status, recording pause
  status, recording mode status, retention controls status, snapshot provenance
  status, snapshot schema validation status, raw snapshot review status,
  snapshot redaction status, snapshot export/import controls, external sharing
  boundary, provider audit boundary, session-only boundary, expiration boundary,
  plugin access boundary, background indexing boundary, auto-capture boundary,
  edit boundary, restore boundary, snapshot policy, import/export boundaries,
  retention scope, delete boundary, write policy, source boundary, filters,
  search, sort, visible count, raw exposure check, provider-neutral count,
  source counts, count consistency check, and safety badges unchanged.
- Did not add cloud account linking, credential access, cloud sync execution,
  upload, download, background synchronization, conflict resolution, snapshot
  import execution, restore execution, raw snapshot export, schema changes,
  plugin access, vector retrieval, external sharing, or provider behavior.

Safety boundaries:
- No backend persistence schema, credential access, provider call, Qwen runtime,
  vector retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, or release behavior
  was added.
- Cloud account status is renderer-only and documents that no Memory cloud
  account is configured.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Cloud account`.
- Confirm the `Cloud account` value is `NOT_CONFIGURED`.
- Confirm there is no sign-in, account-linking, credential, token, cloud
  profile, upload, download, sync, or merge control in the Memory view.
- Confirm `Cloud sync` remains `DISABLED`.
- Confirm `External sharing` remains `DISABLED`.
- Confirm `Recording mode` remains `MANUAL_ONLY` and `Recording pause` remains
  `NOT_ENABLED`.
- Confirm `Auto capture` remains `DISABLED`.
- Confirm `Background indexing` remains `DISABLED`.
- Confirm `Write policy` remains `EXPLICIT_ONLY`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the cloud account projection
  remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, download, expire,
  pause, resume, link an account, access credentials, or retrieve any memory
  records and does not trigger provider/runtime/plugin/browser or desktop
  actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: cloud account controls, cloud sync controls, recording pause controls,
  edit/restore, expiration controls, session-only controls, plugin access
  controls, provider-policy audit history, retention controls, external sharing
  controls, raw snapshot review controls, executable snapshot import validation,
  raw snapshot redaction previews, snapshot provenance enforcement, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Cloud Sync Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local cloud sync boundary projection to the Memory boundary
panel so users can see that user-controlled memories are not synced to any cloud
service in this phase.

Scope completed:
- Added `Cloud sync` to the Memory boundary panel with `DISABLED` status.
- Kept existing record list, delete flow, recording pause status, recording mode
  status, retention controls status, snapshot provenance status, snapshot schema
  validation status, raw snapshot review status, snapshot redaction status,
  snapshot export/import controls, external sharing boundary, provider audit
  boundary, session-only boundary, expiration boundary, plugin access boundary,
  background indexing boundary, auto-capture boundary, edit boundary, restore
  boundary, snapshot policy, import/export boundaries, retention scope, delete
  boundary, write policy, source boundary, filters, search, sort, visible count,
  raw exposure check, provider-neutral count, source counts, count consistency
  check, and safety badges unchanged.
- Did not add cloud sync execution, account linking, network calls, upload,
  download, background synchronization, conflict resolution, snapshot import
  execution, restore execution, raw snapshot export, schema changes, plugin
  access, vector retrieval, external sharing, or provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Cloud sync status is renderer-only and documents that cloud synchronization is
  disabled.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Cloud sync`.
- Confirm the `Cloud sync` value is `DISABLED`.
- Confirm there is no sign-in, upload, download, sync, merge, or cloud account
  control in the Memory view.
- Confirm `External sharing` remains `DISABLED`.
- Confirm `Recording mode` remains `MANUAL_ONLY` and `Recording pause` remains
  `NOT_ENABLED`.
- Confirm `Auto capture` remains `DISABLED`.
- Confirm `Background indexing` remains `DISABLED`.
- Confirm `Write policy` remains `EXPLICIT_ONLY`.
- Confirm `Retention controls` remains `NOT_ENABLED`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`.
- Confirm `Expiration control` and `Session-only mode` remain `NOT_ENABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the cloud sync projection
  remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, download, expire,
  pause, resume, or retrieve any memory records and does not trigger provider/
  runtime/plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: cloud sync controls, recording pause controls, edit/restore,
  expiration controls, session-only controls, plugin access controls,
  provider-policy audit history, retention controls, external sharing controls,
  raw snapshot review controls, executable snapshot import validation, raw
  snapshot redaction previews, snapshot provenance enforcement, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Recording Pause Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local recording pause boundary projection to the Memory boundary
panel so users can see that a future explicit pause-recording control is not
enabled yet, while Memory remains manual-only.

Scope completed:
- Added `Recording pause` to the Memory boundary panel with `NOT_ENABLED`
  status.
- Kept existing record list, delete flow, recording mode status, retention
  controls status, snapshot provenance status, snapshot schema validation status,
  raw snapshot review status, snapshot redaction status, snapshot export/import
  controls, external sharing boundary, provider audit boundary, session-only
  boundary, expiration boundary, plugin access boundary, background indexing
  boundary, auto-capture boundary, edit boundary, restore boundary, snapshot
  policy, import/export boundaries, retention scope, delete boundary, write
  policy, source boundary, filters, search, sort, visible count, raw exposure
  check, provider-neutral count, source counts, count consistency check, and
  safety badges unchanged.
- Did not add pause/resume recording execution, automatic screen capture,
  automatic voice persistence, automatic file indexing, background recording,
  retention duration editing, automatic expiration, snapshot import execution,
  restore execution, raw snapshot export, schema changes, plugin access, vector
  retrieval, external sharing, or provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Recording pause status is renderer-only and documents that a future
  pause-recording control is not enabled yet.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Recording pause`.
- Confirm the `Recording pause` value is `NOT_ENABLED`.
- Confirm there is no pause/resume recording control that changes Memory state.
- Confirm `Recording mode` remains `MANUAL_ONLY`.
- Confirm there is no UI control for automatic screen recording, automatic voice
  persistence, automatic file indexing, or background memory capture.
- Confirm `Auto capture` remains `DISABLED`.
- Confirm `Background indexing` remains `DISABLED`.
- Confirm `Write policy` remains `EXPLICIT_ONLY`.
- Confirm `Retention controls` remains `NOT_ENABLED`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`.
- Confirm `Expiration control` and `Session-only mode` remain `NOT_ENABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the recording pause projection
  remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, expire, pause,
  resume, or retrieve any memory records and does not trigger provider/runtime/
  plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: recording pause controls, edit/restore, expiration controls,
  session-only controls, plugin access controls, provider-policy audit history,
  retention controls, external sharing controls, raw snapshot review controls,
  executable snapshot import validation, raw snapshot redaction previews,
  snapshot provenance enforcement, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Recording Mode Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local recording mode boundary projection to the Memory boundary
panel so users can see that Memory remains manual-only and does not silently
record screen, voice, files, or provider content.

Scope completed:
- Added `Recording mode` to the Memory boundary panel with `MANUAL_ONLY` status.
- Kept existing record list, delete flow, retention controls status, snapshot
  provenance status, snapshot schema validation status, raw snapshot review
  status, snapshot redaction status, snapshot export/import controls, external
  sharing boundary, provider audit boundary, session-only boundary, expiration
  boundary, plugin access boundary, background indexing boundary, auto-capture
  boundary, edit boundary, restore boundary, snapshot policy, import/export
  boundaries, retention scope, delete boundary, write policy, source boundary,
  filters, search, sort, visible count, raw exposure check, provider-neutral
  count, source counts, count consistency check, and safety badges unchanged.
- Did not add automatic screen capture, automatic voice persistence, automatic
  file indexing, background recording, retention duration editing, automatic
  expiration, snapshot import execution, restore execution, raw snapshot export,
  schema changes, plugin access, vector retrieval, external sharing, or provider
  behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Recording mode status is renderer-only and documents that Memory remains
  manual-only.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Recording mode`.
- Confirm the `Recording mode` value is `MANUAL_ONLY`.
- Confirm there is no UI control for automatic screen recording, automatic voice
  persistence, automatic file indexing, or background memory capture.
- Confirm `Auto capture` remains `DISABLED`.
- Confirm `Background indexing` remains `DISABLED`.
- Confirm `Write policy` remains `EXPLICIT_ONLY`.
- Confirm `Retention controls` remains `NOT_ENABLED`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`.
- Confirm `Expiration control` and `Session-only mode` remain `NOT_ENABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the recording mode projection
  remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, expire, or
  retrieve any memory records and does not trigger provider/runtime/plugin/
  browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: recording pause controls, edit/restore, expiration controls,
  session-only controls, plugin access controls, provider-policy audit history,
  retention controls, external sharing controls, raw snapshot review controls,
  executable snapshot import validation, raw snapshot redaction previews,
  snapshot provenance enforcement, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Retention Controls Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local retention controls boundary projection to the Memory
boundary panel so users can see that user-editable retention controls are not
enabled yet.

Scope completed:
- Added `Retention controls` to the Memory boundary panel with `NOT_ENABLED`
  status.
- Kept existing record list, delete flow, snapshot provenance status, snapshot
  schema validation status, raw snapshot review status, snapshot redaction
  status, snapshot export/import controls, external sharing boundary, provider
  audit boundary, session-only boundary, expiration boundary, plugin access
  boundary, background indexing boundary, auto-capture boundary, edit boundary,
  restore boundary, snapshot policy, import/export boundaries, retention scope,
  delete boundary, write policy, source boundary, filters, search, sort, visible
  count, raw exposure check, provider-neutral count, source counts, count
  consistency check, and safety badges unchanged.
- Did not add retention duration editing, automatic expiration, background
  deletion, snapshot import execution, restore execution, raw snapshot viewing,
  raw snapshot export, schema changes, plugin access, vector retrieval, external
  sharing, or provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Retention controls status is renderer-only and documents that user-editable
  retention controls are not yet enabled.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Retention controls`.
- Confirm the `Retention controls` value is `NOT_ENABLED`.
- Confirm there is no UI control for changing retention duration, auto-expiring
  records, auto-deleting records, or applying background retention jobs.
- Confirm visible records and delete buttons continue to behave as
  view/delete-only Memory controls.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`.
- Confirm `Expiration control` remains `NOT_ENABLED`.
- Confirm `Session-only mode` remains `NOT_ENABLED`.
- Confirm `Snapshot provenance` remains `USER_CONFIRMED_ONLY`.
- Confirm `Snapshot schema validation` remains `REQUIRED`.
- Confirm `Raw snapshot review` remains `NOT_ENABLED`.
- Confirm `Snapshot redaction` remains `SANITIZED_ONLY`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the retention controls
  projection remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, expire, or
  retrieve any memory records and does not trigger provider/runtime/plugin/
  browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, expiration controls, session-only controls, plugin
  access controls, provider-policy audit history, retention controls, external
  sharing controls, raw snapshot review controls, executable snapshot import
  validation, raw snapshot redaction previews, snapshot provenance enforcement,
  and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Snapshot Provenance Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local snapshot provenance boundary projection to the Memory
boundary panel so users can see that any future Memory snapshot flow must remain
limited to user-confirmed records only.

Scope completed:
- Added `Snapshot provenance` to the Memory boundary panel with
  `USER_CONFIRMED_ONLY` status.
- Kept existing record list, delete flow, snapshot schema validation status,
  raw snapshot review status, snapshot redaction status, snapshot export/import
  controls, external sharing boundary, provider audit boundary, session-only
  boundary, expiration boundary, plugin access boundary, background indexing
  boundary, auto-capture boundary, edit boundary, restore boundary, snapshot
  policy, import/export boundaries, retention scope, delete boundary, write
  policy, source boundary, filters, search, sort, visible count, raw exposure
  check, provider-neutral count, source counts, count consistency check, and
  safety badges unchanged.
- Did not add snapshot import execution, restore execution, raw snapshot
  viewing, raw snapshot export, raw provider transcript export, prompt/output
  export, file content export, schema changes, plugin access, vector retrieval,
  external sharing, or provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Snapshot provenance status is renderer-only and documents that snapshots must
  be restricted to user-confirmed records.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Snapshot provenance`.
- Confirm the `Snapshot provenance` value is `USER_CONFIRMED_ONLY`.
- Confirm the visible records still show only user-confirmed route aliases,
  voice aliases, and preferences.
- Confirm no import, restore, raw snapshot review, or raw snapshot export action
  is executed merely by viewing the panel.
- Confirm there is no control to include raw provider content, hidden records,
  background captures, plugin-private data, vector rows, or unconfirmed data in
  a snapshot.
- Confirm `Snapshot schema validation` remains `REQUIRED`.
- Confirm `Raw snapshot review` remains `NOT_ENABLED`.
- Confirm `Snapshot redaction` remains `SANITIZED_ONLY`.
- Confirm `External sharing` remains `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the snapshot provenance
  projection remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, or retrieve any
  memory records and does not trigger provider/runtime/plugin/browser or
  desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, expiration controls, session-only controls, plugin
  access controls, provider-policy audit history, retention controls, external
  sharing controls, raw snapshot review controls, executable snapshot import
  validation, raw snapshot redaction previews, snapshot provenance enforcement,
  and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Snapshot Schema Validation Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local snapshot schema validation boundary projection to the
Memory boundary panel so users can see that any future Memory snapshot import
or restore path must remain schema-validated.

Scope completed:
- Added `Snapshot schema validation` to the Memory boundary panel with
  `REQUIRED` status.
- Kept existing record list, delete flow, raw snapshot review status, snapshot
  redaction status, snapshot export/import controls, external sharing boundary,
  provider audit boundary, session-only boundary, expiration boundary, plugin
  access boundary, background indexing boundary, auto-capture boundary, edit
  boundary, restore boundary, snapshot policy, import/export boundaries,
  retention scope, delete boundary, write policy, source boundary, filters,
  search, sort, visible count, raw exposure check, provider-neutral count,
  source counts, count consistency check, and safety badges unchanged.
- Did not add snapshot import execution, restore execution, raw snapshot
  viewing, raw snapshot export, raw provider transcript export, prompt/output
  export, file content export, schema changes, plugin access, vector retrieval,
  external sharing, or provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Snapshot schema validation status is renderer-only and documents the required
  validation boundary for future user-initiated snapshot flows.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Snapshot schema validation`.
- Confirm the `Snapshot schema validation` value is `REQUIRED`.
- Confirm no import or restore action is executed merely by viewing the panel.
- Confirm there is no control to bypass schema validation for snapshots.
- Confirm `Raw snapshot review` remains `NOT_ENABLED`.
- Confirm `Snapshot redaction` remains `SANITIZED_ONLY`.
- Confirm `Export boundary` and `Import boundary` remain
  `USER_INITIATED_ONLY`.
- Confirm `External sharing` remains `DISABLED`.
- Confirm `Provider audit`, `Session-only mode`, and `Expiration control`
  remain `NOT_ENABLED`.
- Confirm `Plugin access` remains `NOT_GRANTED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the snapshot schema
  validation projection remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, or retrieve any
  memory records and does not trigger provider/runtime/plugin/browser or
  desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, expiration controls, session-only controls, plugin
  access controls, provider-policy audit history, retention controls, external
  sharing controls, raw snapshot review controls, executable snapshot import
  validation, raw snapshot redaction previews, and release readiness are not
  complete.

## 2026-08-13: User-Controlled Memory Raw Snapshot Review Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local raw snapshot review boundary projection to the Memory
boundary panel so users can see that raw snapshot review controls are not
enabled.

Scope completed:
- Added `Raw snapshot review` to the Memory boundary panel with `NOT_ENABLED`
  status.
- Kept existing record list, delete flow, snapshot redaction status,
  snapshot export/import controls, external sharing boundary, provider audit
  boundary, session-only boundary, expiration boundary, plugin access boundary,
  background indexing boundary, auto-capture boundary, edit boundary, restore
  boundary, snapshot policy, import/export boundaries, retention scope, delete
  boundary, write policy, source boundary, filters, search, sort, visible count,
  raw exposure check, provider-neutral count, source counts, count consistency
  check, and safety badges unchanged.
- Did not add raw snapshot viewing, raw snapshot export, raw provider
  transcript export, prompt/output export, file content export, schema changes,
  plugin access, vector retrieval, external sharing, or provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Raw snapshot review status is renderer-only and documents that raw snapshot
  review is not enabled.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Raw snapshot review`.
- Confirm the `Raw snapshot review` value is `NOT_ENABLED`.
- Confirm the Memory view does not display raw provider prompts, raw provider
  outputs, full file contents, private paths, credentials, tokens, or hidden raw
  fields.
- Confirm there is no control to review, reveal, export, copy, sync, upload, or
  share a raw memory snapshot.
- Confirm `Snapshot redaction` remains `SANITIZED_ONLY`.
- Confirm `External sharing` remains `DISABLED`.
- Confirm `Provider audit`, `Session-only mode`, and `Expiration control`
  remain `NOT_ENABLED`.
- Confirm `Plugin access` remains `NOT_GRANTED`.
- Confirm `Background indexing` and `Auto capture` remain `DISABLED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the raw snapshot review
  projection remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, or retrieve any
  memory records and does not trigger provider/runtime/plugin/browser or
  desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, expiration controls, session-only controls, plugin
  access controls, provider-policy audit history, retention controls, external
  sharing controls, raw snapshot review controls, raw snapshot redaction
  previews, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Snapshot Redaction Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local snapshot redaction boundary projection to the Memory
boundary panel so users can see that Memory snapshots are intended to remain
sanitized-only.

Scope completed:
- Added `Snapshot redaction` to the Memory boundary panel with
  `SANITIZED_ONLY` status.
- Kept existing record list, delete flow, snapshot export/import controls,
  external sharing boundary, provider audit boundary, session-only boundary,
  expiration boundary, plugin access boundary, background indexing boundary,
  auto-capture boundary, edit boundary, restore boundary, snapshot policy,
  import/export boundaries, retention scope, delete boundary, write policy,
  source boundary, filters, search, sort, visible count, raw exposure check,
  provider-neutral count, source counts, count consistency check, and safety
  badges unchanged.
- Did not add raw snapshot export, provider transcript export, prompt/output
  export, file content export, schema changes, plugin access, vector retrieval,
  external sharing, or provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Snapshot redaction status is renderer-only and documents that snapshots remain
  sanitized-only.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Snapshot redaction`.
- Confirm the `Snapshot redaction` value is `SANITIZED_ONLY`.
- Confirm there is no control that exports raw provider prompts, raw provider
  outputs, full file contents, private paths, credentials, tokens, or hidden raw
  fields.
- Confirm `External sharing` remains `DISABLED`.
- Confirm `Provider audit`, `Session-only mode`, and `Expiration control`
  remain `NOT_ENABLED`.
- Confirm `Plugin access` remains `NOT_GRANTED`.
- Confirm `Background indexing` and `Auto capture` remain `DISABLED`.
- Confirm `Restore boundary` and `Edit boundary` remain `NOT_ENABLED`.
- Confirm `Export boundary` and `Import boundary` remain
  `USER_INITIATED_ONLY`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`, `Snapshot policy`
  remains `USER_INITIATED`, `Delete boundary` remains `CORE_IPC_REPOSITORY`,
  `Write policy` remains `EXPLICIT_ONLY`, and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the snapshot redaction
  projection remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, or retrieve any
  memory records and does not trigger provider/runtime/plugin/browser or
  desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, expiration controls, session-only controls, plugin
  access controls, provider-policy audit history, retention controls, external
  sharing controls, raw snapshot review controls, and release readiness are not
  complete.

## 2026-08-13: User-Controlled Memory External Sharing Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local external sharing boundary projection to the Memory
boundary panel so users can see that Memory records are not shared externally by
default.

Scope completed:
- Added `External sharing` to the Memory boundary panel with `DISABLED` status.
- Kept existing record list, delete flow, snapshot export/import controls,
  provider audit boundary, session-only boundary, expiration boundary, plugin
  access boundary, background indexing boundary, auto-capture boundary, edit
  boundary, restore boundary, snapshot policy, import/export boundaries,
  retention scope, delete boundary, write policy, source boundary, filters,
  search, sort, visible count, raw exposure check, provider-neutral count,
  source counts, count consistency check, and safety badges unchanged.
- Did not add external sync, community sharing, network upload, provider calls,
  record mutation, schema changes, plugin access, vector retrieval, or provider
  behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- External sharing status is renderer-only and documents that external sharing
  is disabled by default.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `External sharing`.
- Confirm the `External sharing` value is `DISABLED`.
- Confirm there is no control that syncs, uploads, publishes, shares, or grants
  external/community access to Memory records.
- Confirm `Provider audit`, `Session-only mode`, and `Expiration control`
  remain `NOT_ENABLED`.
- Confirm `Plugin access` remains `NOT_GRANTED`.
- Confirm `Background indexing` and `Auto capture` remain `DISABLED`.
- Confirm `Restore boundary` and `Edit boundary` remain `NOT_ENABLED`.
- Confirm `Export boundary` and `Import boundary` remain
  `USER_INITIATED_ONLY`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`, `Snapshot policy`
  remains `USER_INITIATED`, `Delete boundary` remains `CORE_IPC_REPOSITORY`,
  `Write policy` remains `EXPLICIT_ONLY`, and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the external sharing
  projection remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, share, sync, upload, or retrieve any
  memory records and does not trigger provider/runtime/plugin/browser or
  desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, expiration controls, session-only controls, plugin
  access controls, provider-policy audit history, retention controls, external
  sharing controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Provider Audit Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local provider audit boundary projection to the Memory
boundary panel so users can see that provider-policy audit history is not
enabled yet.

Scope completed:
- Added `Provider audit` to the Memory boundary panel with `NOT_ENABLED`
  status.
- Kept existing record list, delete flow, snapshot export/import controls,
  session-only boundary, expiration boundary, plugin access boundary,
  background indexing boundary, auto-capture boundary, edit boundary, restore
  boundary, snapshot policy, import/export boundaries, retention scope, delete
  boundary, write policy, source boundary, filters, search, sort, visible count,
  raw exposure check, provider-neutral count, source counts, count consistency
  check, and safety badges unchanged.
- Did not add provider audit logging, provider calls, raw prompt/output capture,
  record mutation, schema changes, plugin access, vector retrieval, or provider
  behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Provider audit status is renderer-only and documents that provider-policy
  audit history is not enabled yet.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Provider audit`.
- Confirm the `Provider audit` value is `NOT_ENABLED`.
- Confirm there is no control that starts provider audit logging or exposes raw
  prompt/output history.
- Confirm `Session-only mode` and `Expiration control` remain `NOT_ENABLED`.
- Confirm `Plugin access` remains `NOT_GRANTED`.
- Confirm `Background indexing` and `Auto capture` remain `DISABLED`.
- Confirm `Restore boundary` and `Edit boundary` remain `NOT_ENABLED`.
- Confirm `Export boundary` and `Import boundary` remain
  `USER_INITIATED_ONLY`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`, `Snapshot policy`
  remains `USER_INITIATED`, `Delete boundary` remains `CORE_IPC_REPOSITORY`,
  `Write policy` remains `EXPLICIT_ONLY`, and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the provider audit
  projection remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, audit, or retrieve any memory records and does
  not trigger provider/runtime/plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, expiration controls, session-only controls, plugin
  access controls, provider-policy audit history, retention controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Session-Only Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local session-only boundary projection to the Memory boundary
panel so users can see that per-session-only Memory retention controls are not
enabled yet.

Scope completed:
- Added `Session-only mode` to the Memory boundary panel with `NOT_ENABLED`
  status.
- Kept existing record list, delete flow, snapshot export/import controls,
  expiration boundary, plugin access boundary, background indexing boundary,
  auto-capture boundary, edit boundary, restore boundary, snapshot policy,
  import/export boundaries, retention scope, delete boundary, write policy,
  source boundary, filters, search, sort, visible count, raw exposure check,
  provider-neutral count, source counts, count consistency check, and safety
  badges unchanged.
- Did not add session-only persistence logic, automatic cleanup, background
  jobs, record mutation, schema changes, plugin access, vector retrieval, or
  provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Session-only mode status is renderer-only and documents that session-only
  retention controls are not enabled yet.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Session-only mode`.
- Confirm the `Session-only mode` value is `NOT_ENABLED`.
- Confirm there is no control that changes a memory record to session-only
  retention or automatically cleans it up at session end.
- Confirm `Expiration control` remains `NOT_ENABLED`.
- Confirm `Plugin access` remains `NOT_GRANTED`.
- Confirm `Background indexing` and `Auto capture` remain `DISABLED`.
- Confirm `Restore boundary` and `Edit boundary` remain `NOT_ENABLED`.
- Confirm `Export boundary` and `Import boundary` remain
  `USER_INITIATED_ONLY`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`, `Snapshot policy`
  remains `USER_INITIATED`, `Delete boundary` remains `CORE_IPC_REPOSITORY`,
  `Write policy` remains `EXPLICIT_ONLY`, and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the session-only projection
  remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, or retrieve any memory records and does not
  trigger provider/runtime/plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, expiration controls, session-only controls, plugin
  access controls, provider-policy audit history, retention controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Expiration Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local expiration boundary projection to the Memory boundary
panel so users can see that per-record expiration controls are not enabled yet.

Scope completed:
- Added `Expiration control` to the Memory boundary panel with `NOT_ENABLED`
  status.
- Kept existing record list, delete flow, snapshot export/import controls,
  plugin access boundary, background indexing boundary, auto-capture boundary,
  edit boundary, restore boundary, snapshot policy, import/export boundaries,
  retention scope, delete boundary, write policy, source boundary, filters,
  search, sort, visible count, raw exposure check, provider-neutral count,
  source counts, count consistency check, and safety badges unchanged.
- Did not add expiration scheduling, automatic deletion, background jobs,
  record mutation, schema changes, plugin access, vector retrieval, or provider
  behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Expiration control status is renderer-only and documents that automatic
  expiry is not enabled yet.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Expiration control`.
- Confirm the `Expiration control` value is `NOT_ENABLED`.
- Confirm there is no control that schedules automatic deletion or expiry.
- Confirm `Plugin access` remains `NOT_GRANTED`.
- Confirm `Background indexing` and `Auto capture` remain `DISABLED`.
- Confirm `Restore boundary` and `Edit boundary` remain `NOT_ENABLED`.
- Confirm `Export boundary` and `Import boundary` remain
  `USER_INITIATED_ONLY`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`, `Snapshot policy`
  remains `USER_INITIATED`, `Delete boundary` remains `CORE_IPC_REPOSITORY`,
  `Write policy` remains `EXPLICIT_ONLY`, and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the expiration projection
  remains stable.
- Confirm merely viewing this panel does not schedule expiry and does not
  create, edit, restore, delete, import, export, index, capture, or retrieve
  any memory records and does not trigger provider/runtime/plugin/browser or
  desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, expiration controls, plugin access controls,
  provider-policy audit history, retention controls, and release readiness are
  not complete.

## 2026-08-13: User-Controlled Memory Plugin Access Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local plugin access boundary projection to the Memory boundary
panel so users can see that user-controlled Memory records are not granted to
plugins by default.

Scope completed:
- Added `Plugin access` to the Memory boundary panel with `NOT_GRANTED` status.
- Kept existing record list, delete flow, snapshot export/import controls,
  background indexing boundary, auto-capture boundary, edit boundary, restore
  boundary, snapshot policy, import/export boundaries, retention scope, delete
  boundary, write policy, source boundary, filters, search, sort, visible count,
  raw exposure check, provider-neutral count, source counts, count consistency
  check, and safety badges unchanged.
- Did not add plugin Memory reads, plugin Memory writes, plugin grant UI,
  plugin IPC, plugin execution, background indexing, vector retrieval, schema
  changes, or provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Plugin access boundary status is renderer-only and documents that plugin
  access is not granted by default.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Plugin access`.
- Confirm the `Plugin access` value is `NOT_GRANTED`.
- Confirm there is no control that grants plugins access to Memory records.
- Confirm `Background indexing` and `Auto capture` remain `DISABLED`.
- Confirm `Restore boundary` and `Edit boundary` remain `NOT_ENABLED`.
- Confirm `Export boundary` and `Import boundary` remain
  `USER_INITIATED_ONLY`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`, `Snapshot policy`
  remains `USER_INITIATED`, `Delete boundary` remains `CORE_IPC_REPOSITORY`,
  `Write policy` remains `EXPLICIT_ONLY`, and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the plugin access projection
  remains stable.
- Confirm merely viewing this panel does not grant plugin access and does not
  create, edit, restore, delete, import, export, index, capture, or retrieve
  any memory records and does not trigger provider/runtime/plugin/browser or
  desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, plugin access controls, provider-policy audit history,
  retention controls, and release readiness are not complete.

## 2026-08-13: User-Controlled Memory Background Indexing Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local background indexing boundary projection to the Memory
boundary panel so users can see that Memory is not silently indexing visible
records, files, voice transcripts, provider outputs, plugin outputs, or desktop
content in the background.

Scope completed:
- Added `Background indexing` to the Memory boundary panel with `DISABLED`
  status.
- Kept existing record list, delete flow, snapshot export/import controls,
  auto-capture boundary, edit boundary, restore boundary, snapshot policy,
  import/export boundaries, retention scope, delete boundary, write policy,
  source boundary, filters, search, sort, visible count, raw exposure check,
  provider-neutral count, source counts, count consistency check, and safety
  badges unchanged.
- Did not add background indexing, embeddings, vector retrieval, file indexing,
  voice transcript indexing, provider output indexing, plugin output indexing,
  schema changes, or provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Background indexing boundary status is renderer-only and documents that
  background indexing is disabled.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Background indexing`.
- Confirm the `Background indexing` value is `DISABLED`.
- Confirm there is no control that enables background indexing, vector
  retrieval, file indexing, provider output indexing, plugin output indexing,
  or voice transcript indexing.
- Confirm `Auto capture` remains `DISABLED`.
- Confirm `Restore boundary` and `Edit boundary` remain `NOT_ENABLED`.
- Confirm `Export boundary` and `Import boundary` remain
  `USER_INITIATED_ONLY`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`, `Snapshot policy`
  remains `USER_INITIATED`, `Delete boundary` remains `CORE_IPC_REPOSITORY`,
  `Write policy` remains `EXPLICIT_ONLY`, and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the background indexing
  projection remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, or retrieve any memory records and does not
  trigger provider/runtime/plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, provider-policy audit history, retention controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Auto Capture Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local auto-capture boundary projection to the Memory boundary
panel so users can see that Memory does not automatically capture screen,
voice, provider, plugin, file, or desktop content into long-term records.

Scope completed:
- Added `Auto capture` to the Memory boundary panel with `DISABLED` status.
- Kept existing record list, delete flow, snapshot export/import controls,
  edit boundary, restore boundary, snapshot policy, import/export boundaries,
  retention scope, delete boundary, write policy, source boundary, filters,
  search, sort, visible count, raw exposure check, provider-neutral count,
  source counts, count consistency check, and safety badges unchanged.
- Did not add background capture, screen capture, voice transcript retention,
  provider output retention, plugin output retention, file indexing, schema
  changes, or provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Auto-capture boundary status is renderer-only and documents that automatic
  long-term capture is disabled.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Auto capture`.
- Confirm the `Auto capture` value is `DISABLED`.
- Confirm there is no control that enables automatic capture of screen, voice,
  provider, plugin, file, or desktop content.
- Confirm `Restore boundary` and `Edit boundary` remain `NOT_ENABLED`.
- Confirm `Export boundary` and `Import boundary` remain
  `USER_INITIATED_ONLY`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`, `Snapshot policy`
  remains `USER_INITIATED`, `Delete boundary` remains `CORE_IPC_REPOSITORY`,
  `Write policy` remains `EXPLICIT_ONLY`, and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the auto-capture projection
  remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, capture, or retrieve any memory records and does not
  trigger provider/runtime/plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, provider-policy audit history, retention controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Restore Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local restore boundary projection to the Memory boundary panel
so users can see that record restore/rollback is not enabled yet, even though
view/delete/snapshot status is visible.

Scope completed:
- Added `Restore boundary` to the Memory boundary panel with `NOT_ENABLED`
  status.
- Kept existing record list, delete flow, snapshot export/import controls,
  edit boundary, snapshot policy, import/export boundaries, retention scope,
  delete boundary, write policy, source boundary, filters, search, sort,
  visible count, raw exposure check, provider-neutral count, source counts,
  count consistency check, and safety badges unchanged.
- Did not add restore buttons, rollback IPC, repository restore methods,
  deleted-record retention, schema changes, merge behavior, or provider
  behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Restore boundary status is renderer-only and documents that restore/rollback
  is not yet enabled.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Restore boundary`.
- Confirm the `Restore boundary` value is `NOT_ENABLED`.
- Confirm there is no restore button, rollback button, or deleted-record
  restore action offered from the Memory records list.
- Confirm `Edit boundary` remains `NOT_ENABLED`.
- Confirm `Export boundary` and `Import boundary` remain
  `USER_INITIATED_ONLY`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`, `Snapshot policy`
  remains `USER_INITIATED`, `Delete boundary` remains `CORE_IPC_REPOSITORY`,
  `Write policy` remains `EXPLICIT_ONLY`, and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the restore boundary
  projection remains stable.
- Confirm merely viewing this panel does not create, edit, restore, delete,
  import, export, index, or retrieve any memory records and does not trigger
  provider/runtime/plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, provider-policy audit history, retention controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Edit Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local edit boundary projection to the Memory boundary panel so
users can see that the current Memory surface is still view/delete/snapshot
oriented and that record editing is not enabled yet.

Scope completed:
- Added `Edit boundary` to the Memory boundary panel with `NOT_ENABLED` status.
- Kept existing record list, delete flow, snapshot export/import controls,
  snapshot policy, import/export boundaries, retention scope, delete boundary,
  write policy, source boundary, filters, search, sort, visible count, raw
  exposure check, provider-neutral count, source counts, count consistency
  check, and safety badges unchanged.
- Did not add record editing, inline form state, update IPC, repository update
  methods, schema changes, merge/restore behavior, or provider behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Edit boundary status is renderer-only and documents that editing is not yet
  enabled.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Edit boundary`.
- Confirm the `Edit boundary` value is `NOT_ENABLED`.
- Confirm there is no inline edit control and no edit action is offered from
  the Memory records list.
- Confirm `Export boundary` and `Import boundary` remain
  `USER_INITIATED_ONLY`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`, `Snapshot policy`
  remains `USER_INITIATED`, `Delete boundary` remains `CORE_IPC_REPOSITORY`,
  `Write policy` remains `EXPLICIT_ONLY`, and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the edit boundary projection
  remains stable.
- Confirm merely viewing this panel does not create, edit, delete, import,
  export, index, or retrieve any memory records and does not trigger
  provider/runtime/plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, provider-policy audit history, retention controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Snapshot Import/Export Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added renderer-local import/export boundary projections to the Memory boundary
panel so users can distinguish user-initiated snapshot actions from background
sync, provider retention, automatic import, or automatic export behavior.

Scope completed:
- Added `Export boundary` to the Memory boundary panel with
  `USER_INITIATED_ONLY` status.
- Added `Import boundary` to the Memory boundary panel with
  `USER_INITIATED_ONLY` status.
- Kept existing snapshot export/import controls and behavior unchanged.
- Kept existing record list, delete flow, snapshot policy, retention scope,
  delete boundary, write policy, source boundary, filters, search, sort,
  visible count, raw exposure check, provider-neutral count, source counts,
  count consistency check, and safety badges unchanged.
- Did not add automatic import/export, background sync, provider export,
  provider import, schema changes, or direct renderer persistence access.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Import/export boundary status is renderer-only and documents existing
  user-initiated snapshot behavior.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Export boundary`.
- Confirm the `Export boundary` value is `USER_INITIATED_ONLY`.
- Confirm the Memory boundary panel shows `Import boundary`.
- Confirm the `Import boundary` value is `USER_INITIATED_ONLY`.
- Confirm `Retention scope` remains `USER_CONTROLLED_ONLY`, `Snapshot policy`
  remains `USER_INITIATED`, `Delete boundary` remains `CORE_IPC_REPOSITORY`,
  `Write policy` remains `EXPLICIT_ONLY`, and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm import/export boundary
  projections remain stable.
- Confirm merely viewing this panel does not import, export, create, modify,
  delete, index, or retrieve any memory records and does not trigger
  provider/runtime/plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, provider-policy audit history, retention controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Retention Scope Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local retention scope projection to the Memory boundary panel
so users can see that this view is scoped to user-controlled records only, not
automatic long-term retention of all screen, voice, provider, plugin, or file
content.

Scope completed:
- Added `Retention scope` to the Memory boundary panel with
  `USER_CONTROLLED_ONLY` status.
- Kept existing record list, delete flow, snapshot policy, delete boundary,
  write policy, source boundary, filters, search, sort, visible count, raw
  exposure check, provider-neutral count, source counts, count consistency
  check, and safety badges unchanged.
- Did not add automatic capture, retention expansion, provider retention,
  vector retrieval, background indexing, or Memory schema changes.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Retention scope is renderer-only and documents the existing user-controlled
  Memory boundary.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Retention scope`.
- Confirm the value is `USER_CONTROLLED_ONLY`.
- Confirm `Snapshot policy` remains `USER_INITIATED`, `Delete boundary` remains
  `CORE_IPC_REPOSITORY`, `Write policy` remains `EXPLICIT_ONLY`, and `Source
  boundary` remains `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the retention scope
  projection remains stable.
- Confirm merely viewing this panel does not capture, import, export, create,
  modify, delete, index, or retrieve any memory records and does not trigger
  provider/runtime/plugin/browser or desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, provider-policy audit history, retention controls, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Snapshot Policy Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local snapshot policy projection to the Memory boundary panel
so users can see that Memory import/export snapshot flows are user-initiated,
not automatic background sync or provider-driven retention.

Scope completed:
- Added `Snapshot policy` to the Memory boundary panel with `USER_INITIATED`
  status.
- Reused the existing Memory snapshot controls without changing their behavior.
- Kept existing record list, delete flow, delete boundary, write policy,
  source boundary, filters, search, sort, visible count, raw exposure check,
  provider-neutral count, source counts, count consistency check, and safety
  badges unchanged.
- Did not add automatic snapshot creation, background sync, provider export, or
  import execution changes.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Snapshot policy is renderer-only and documents that snapshot import/export is
  user-initiated.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Snapshot policy`.
- Confirm the value is `USER_INITIATED`.
- Confirm `Delete boundary` remains `CORE_IPC_REPOSITORY`, `Write policy`
  remains `EXPLICIT_ONLY`, and `Source boundary` remains `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the snapshot policy
  projection remains stable.
- Confirm merely viewing this panel does not import, export, create, modify, or
  delete memory records and does not trigger provider/runtime/plugin/browser or
  desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, provider-policy audit history, and release readiness
  are not complete.

## 2026-08-13: User-Controlled Memory Delete Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local delete boundary projection to the Memory boundary panel
so users can see that memory deletion flows through Core IPC and the existing
repository boundary.

Scope completed:
- Added `Delete boundary` to the Memory boundary panel with
  `CORE_IPC_REPOSITORY` status.
- Kept existing delete button behavior, delete-pending state, record list,
  filters, search, sort, visible count, write policy, source boundary, raw
  exposure check, provider-neutral count, source counts, count consistency
  check, and safety badges unchanged.
- Did not add any new delete capability, bulk delete, direct database access, or
  renderer persistence access.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Delete boundary is renderer-only and documents the existing Core IPC /
  repository boundary.
- Renderer still does not directly read or write the Memory database.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Delete boundary`.
- Confirm the value is `CORE_IPC_REPOSITORY`.
- Confirm `Write policy` remains `EXPLICIT_ONLY` and `Source boundary` remains
  `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the delete boundary
  projection remains stable.
- Confirm merely viewing this panel does not delete, create, or modify memory
  records and does not trigger provider/runtime/plugin/browser/desktop actions.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, provider-policy audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Write Policy Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local write policy projection to the Memory boundary panel so
users can see that user-controlled memory writes are explicit-only, rather than
implicit screen, provider, audio, file, or background capture.

Scope completed:
- Added `Write policy` to the Memory boundary panel with `EXPLICIT_ONLY`
  status.
- Kept existing record list, delete flow, filters, search, sort, visible count,
  raw exposure check, source boundary, provider-neutral count, source counts,
  count consistency check, and safety badges unchanged.
- Did not add any new memory write path or automatic learning behavior.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Write policy is renderer-only and documents the existing explicit-user-action
  boundary.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Write policy`.
- Confirm the value is `EXPLICIT_ONLY`.
- Confirm `Source boundary` remains `USER_CONFIRMED`.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the write policy projection
  remains stable.
- Confirm no provider call, Qwen runtime, vector retrieval, raw/private
  content, plugin execution, browser launch, desktop launch, shell, filesystem
  search, or new memory record creation occurs from merely viewing this panel.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, provider-policy audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Source Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local source boundary projection to the Memory boundary panel
so users can confirm that visible user-controlled memory records come only from
explicitly user-confirmed sources.

Scope completed:
- Added `Source boundary` to the Memory boundary panel with
  `USER_CONFIRMED`/`REVIEW` status.
- Derived the boundary from existing confirmed route alias, voice alias, and
  preference source counts.
- Kept existing record list, delete flow, filters, search, sort, visible count,
  raw exposure check, provider-neutral count, source counts, count consistency
  check, and safety badges unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Source boundary is renderer-only and derived from already-visible sanitized
  record metadata.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Source boundary`.
- Confirm the value is `USER_CONFIRMED` when all visible memory records are
  route aliases, voice aliases, or preferences that the user explicitly
  confirmed.
- Confirm the individual source counts are still visible.
- Confirm `Provider/raw private` remains `HIDDEN`, `Vector retrieval` remains
  `DISABLED`, and `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the source boundary remains a
  total-record boundary check.
- Confirm no provider call, Qwen runtime, vector retrieval, raw/private
  content, plugin execution, browser launch, desktop launch, shell, or
  filesystem search occurs.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, provider-policy audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Safety Boundary Check L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local Memory safety boundary check to the Memory boundary
panel so users can quickly confirm that the user-controlled memory view is not
exposing raw provider/private content.

Scope completed:
- Added `Memory safety check` to the Memory boundary panel with `OK`/`REVIEW`
  status.
- Derived the check from the existing `Raw exposed records` projection.
- Kept existing record list, provider/raw private boundary, provider-neutral
  count, source counts, memory count consistency check, delete-pending status,
  deletion eligibility counts, visible-records projection, filters, search,
  sort, reset, and safety badges unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Safety check is renderer-only and derived from already-visible sanitized
  record metadata.
- Raw provider/private content remains hidden when the check is `OK`.
- Provider runtime remains `NOT USED`.
- Vector retrieval remains `DISABLED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Memory safety check`.
- Confirm the value is `OK` when `Raw exposed records` is `0`.
- Confirm `Provider/raw private` remains `HIDDEN`.
- Confirm `Vector retrieval` remains `DISABLED`.
- Confirm `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm the safety check remains a
  total-record boundary check.
- Confirm no provider call, Qwen runtime, vector retrieval, raw/private
  content, plugin execution, browser launch, desktop launch, shell, or
  filesystem search occurs.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, provider-policy audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Center L3 Slice

Status: L4 after Windows manual acceptance.

Implemented a provider-neutral user-controlled memory projection that aggregates
existing confirmed voice command aliases and confirmed user route aliases.

Scope completed:
- Added `UserControlledMemoryRecord` contracts plus
  `agent.listUserControlledMemories` and `agent.deleteUserControlledMemory`.
- Added Core Runtime aggregation across injected repositories only.
- Kept Desktop Host out of direct memory persistence.
- Added UI hook state and IPC methods for list/delete through Core commands.
- Added a Memory navigation view with total counts, route alias count, voice
  alias count, risk projection, raw-content-hidden status, vector retrieval
  disabled status, and delete controls.
- Kept existing Voice view alias controls intact.

Safety boundaries:
- No provider runtime, Qwen runtime, vector retrieval, plugin execution, shell,
  filesystem search, browser launch, or desktop launch was added.
- UI exposes user-confirmed alias labels and sanitized summaries only; no raw
  provider, audio, private path, credential, or diagnostic content is exposed.
- Deletion flows through Core IPC and existing repositories.

Verification:
- `npm run typecheck`: PASS.
- `npx vitest run packages/contracts/test/protocol.test.ts packages/core/test/runtime.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts`: PASS, 193 tests.
- `npm run build:ui`: PASS.
- `npm run build:desktop`: PASS.

Manual acceptance required for L4:
- Open Jarvis-K and switch to the Memory navigation item.
- Confirm saved route aliases and voice aliases appear in the unified list.
- Confirm provider/raw private content remains hidden in the boundary panel.
- Delete one noncritical test alias and confirm it disappears after refresh or
  reopening the app.
- Confirm normal Task Runtime routing still works after deletion.

Windows manual acceptance:
- PASS, 2026-08-13.
- User opened the Memory view and confirmed the saved `IZYtoken admin` route
  alias appeared in the unified user-controlled memory list.
- User deleted the route alias from the Memory view.
- User reopened Jarvis-K and confirmed the deleted alias remained absent.
- This verifies the delete flow through UI -> Core IPC -> injected repository
  persisted across restart.

Completion level:
- L4 user-usable for the user-controlled memory center list/delete slice.
- Not L5: broader preference memory, search/filter, edit/rename, structured
  import/export, and future Memory DB backed records are not complete.

## 2026-08-13: Personal Preference Memory L3/L4 Slice

Status: L4 after Windows manual acceptance.

Implemented the first explicit personal preference memory vertical slice for
response-language preference.

Scope completed:
- Added `UserPreferenceMemoryRecord` contracts and added `preference` to the
  provider-neutral `UserControlledMemoryRecord` projection.
- Added deterministic rules for explicit preference learning requests such as
  `remember reply in Chinese` and Chinese equivalents that combine a memory cue
  with Chinese reply/answer preference.
- Added a Core Runtime preference-memory path that persists only through an
  injected `UserPreferenceMemoryRepository`.
- Added a Core Host JSON repository for user preference memories.
- Kept Desktop Host out of direct preference persistence.
- Added Memory view preference counts and boundary projection.
- Kept preference usage as `ui_projection_only`; it does not yet modify Chat
  Answer prompts, provider calls, Qwen routing, Planner behavior, or execution.

Safety boundaries:
- No provider runtime, Qwen runtime, vector retrieval, plugin execution, shell,
  filesystem search, browser launch, desktop launch, or automatic answer
  behavior change was added.
- Preference records are user-controlled, visible, deletable, and sanitized.
- Deletion still flows through Core IPC and injected repositories.

Verification:
- `npm run build:contracts`: PASS.
- `npm run build:core`: PASS.
- `npm run build:core-host`: PASS.
- `npm run build:ui`: PASS.
- `npm run build:desktop`: PASS.
- `npx vitest run packages/contracts/test/protocol.test.ts packages/core/test/runtime.test.ts apps/core-host/test/user-preference-memory-repository.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts apps/desktop/test/electron-gpu-failsafe-source.test.ts apps/ui/test/render-error-boundary-source.test.ts`: PASS, 197 tests.
- Desktop automated smoke with temporary memory paths: PASS. Verified
  `记住我喜欢中文回答` saved a preference, Memory view showed
  `Response language` / `Prefer Chinese replies`, deletion removed it, and no
  external action path was used.

Manual acceptance required for L4:
- Open Jarvis-K and send `记住我喜欢中文回答` or `以后默认用中文回复我`.
- Confirm the assistant reports that the preference memory was saved.
- Open the Memory view and confirm:
  - Total memory count increases.
  - Preferences count is at least 1.
  - A `preference` record appears with label `Response language`.
  - Summary is `Prefer Chinese replies`.
  - Source is `user_confirmed_preference`.
  - Boundary still shows vector retrieval disabled and provider runtime not used.
- Delete the preference record.
- Restart Jarvis-K and confirm the deleted preference remains absent.

Windows manual acceptance:
- PASS, 2026-08-13.
- User confirmed the assistant reported:
  `Preference memory saved: Response language prefers Chinese replies.`
- User opened the Memory view and confirmed:
  - Total memories included the new preference.
  - `Preferences` count was `1`.
  - The record type was `preference`.
  - The label was `Response language`.
  - The summary was `Prefer Chinese replies`.
  - The source was `USER_CONFIRMED_PREFERENCE`.
  - Vector retrieval remained `DISABLED`.
  - Provider runtime remained `NOT USED`.
- User deleted the preference record, restarted Jarvis-K, and confirmed the
  deleted preference remained absent.
- No Chat Answer provider behavior, Qwen routing, Planner behavior, plugin
  execution, browser launch, desktop launch, shell, filesystem search, or vector
  retrieval behavior was added or triggered.

Completion level:
- L4 user-usable for the explicit response-language preference memory
  save/list/delete/restart slice.
- Not L5: broader preferences, edit flows, automatic Chat Answer application,
  conflict handling, and search/filter are not complete.

## 2026-08-13: Chat Answer Preference Read Projection L3/L4 Slice

Status: L4 after Windows manual acceptance.

Implemented the first read-only use of explicit user preference memory by
Chat Answer. The saved response-language preference remains user-controlled
memory, and Core converts it into a sanitized provider-neutral projection before
calling any Chat Answer provider.

Scope completed:
- Added `ChatAnswerPreferenceProjection` contracts for request/result
  boundaries.
- Added Core Runtime preference lookup through the injected
  `UserPreferenceMemoryRepository` only.
- Projected `response_language=zh` as `preferredResponseLanguage: "zh"` with
  `rawContentExposed: false`, `vectorRetrievalUsed: false`, and
  `providerNeutral: true`.
- Added the projection to unavailable fallback results so degraded Chat Answer
  still records that the preference was read safely.
- Updated fixture Chat Answer to answer in Chinese when the sanitized
  projection is applied.
- Updated OpenAI-compatible and GLM/DeepSeek request builders to pass only the
  sanitized projection and a bounded Chinese-answer instruction.
- Added Memory view status projection for `Preference projection` and
  `Applies to: Chat Answer`.

Safety boundaries:
- No provider credentials, raw memory text, private path, provider raw output,
  vector retrieval, Planner, Qwen runtime, plugin execution, shell, filesystem,
  browser, desktop action, or route allowlist behavior was added.
- The persisted preference remains `ui_projection_only`; Chat Answer receives
  only a derived provider-neutral projection.
- Provider/runtime unavailable paths remain fail-closed and deterministic rules
  remain active.

Verification:
- `npm run build:contracts`: PASS.
- `npm run build:capabilities`: PASS.
- `npm run build:inference-adapter-openai-chat-answer`: PASS.
- `npm run build:inference-adapter-glm-chat-answer-runtime`: PASS.
- `npm run build:core`: PASS.
- `npm run build:core-host`: PASS.
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npm run build:desktop`: PASS.
- `npx vitest run packages/contracts/test/chat-answer.test.ts apps/ui/test/app-voice-ui-source.test.ts`: PASS, 37 tests.
- `npx vitest run packages/core/test/runtime.test.ts`: PASS, 111 tests.
- `npx vitest run packages/inference-adapter-openai-chat-answer/test/openai-compatible.test.ts packages/inference-adapter-glm-chat-answer-runtime/test/provider.test.ts`: PASS, 27 tests.
- `npx vitest run apps/core-host/test/user-preference-memory-repository.test.ts apps/core-host/test/fixture-chat-answer-composition.test.ts apps/core-host/test/openai-compatible-chat-answer-composition.test.ts apps/core-host/test/glm-chat-answer-runtime-composition.test.ts apps/ui/test/use-jarvis-inference-source.test.ts apps/desktop/test/electron-gpu-failsafe-source.test.ts apps/ui/test/render-error-boundary-source.test.ts`: PASS, 24 tests.
- Desktop automated smoke with temporary preference, route-alias, voice-alias,
  task, and memory paths: PASS. Verified UI save through the real command input,
  fixture Chat Answer Chinese preference application, Memory view
  `Preference projection: ON`, `Applies to: CHAT ANSWER`, provider/raw hidden,
  vector retrieval disabled, no Task Runtime task creation, no direct action,
  no raw provider response persistence, and no non-temporary user memory read.

Manual acceptance required for L4:
- Save a response-language preference.
- Send a normal Chat Answer request.
- Confirm the answer path reflects Chinese preference when a bounded provider
  path is active.
- Confirm Memory view shows `Preference projection: ON` and
  `Applies to: Chat Answer`.
- Confirm provider/raw private remains hidden and vector retrieval remains
  disabled.
- Confirm deleting the preference turns the projection off after refresh or
  restart.

Windows manual acceptance:
- PASS, 2026-08-13.
- User confirmed response-language preference save from the formal UI.
- User confirmed Memory view displayed the preference record.
- User confirmed the updated app showed Chat Answer preference projection as
  enabled with `Applies to: CHAT ANSWER`.
- User confirmed Chat Answer read the Chinese response preference.
- Provider/raw private content remained hidden and vector retrieval remained
  disabled.

Completion level:
- L4 user-usable for response-language preference projection into Chat Answer.
- Not L5: broader preferences, provider-specific style policies, conflict
  resolution, editing, import/export, and provider behavior evaluation are not
  complete.

## 2026-08-13: Preference Policy Expansion / Multiple Preference Types L3/L4 Slice

Status: L4 after Windows manual acceptance.

Expanded user-controlled preference memory beyond response language while
keeping the same provider-neutral and user-visible boundaries.

Scope completed:
- Expanded `UserPreferenceMemoryRecord` to allow three low-risk preference
  keys:
  - `response_language=zh`
  - `response_length=short|detailed`
  - `response_style=concise|friendly|technical`
- Added key/value schema validation so invalid preference combinations fail
  closed.
- Replaced the single response-language detector with a small deterministic
  preference catalog for explicit English and Chinese save/default requests.
- Kept one record per preference key through upsert semantics.
- Expanded `ChatAnswerPreferenceProjection` with sanitized length and style
  fields.
- Updated Core Chat Answer projection to combine language, length, and style
  preferences through the injected `UserPreferenceMemoryRepository`.
- Updated fixture Chat Answer to reflect the projected preferences in bounded
  output.
- Updated OpenAI-compatible and GLM/DeepSeek request builders to pass only the
  sanitized projection and bounded preference instructions.
- Kept Memory UI projection generic: low-risk preference records turn
  `Preference projection` on and show `Applies to: CHAT ANSWER`.

Safety boundaries:
- No raw preference text is exposed to provider/runtime prompts.
- No vector retrieval, Qwen runtime, Planner, plugin execution, browser,
  filesystem, shell, Desktop Host action, Task Runtime side effect, telemetry,
  installer, or release behavior was added.
- Preferences remain visible, deletable, low-risk, and user-controlled.
- Provider unavailable paths remain fail-closed and deterministic rules remain
  active.

Verification:
- `npm run build:contracts`: PASS.
- `npm run build:capabilities`: PASS.
- `npm run build:inference-adapter-openai-chat-answer`: PASS.
- `npm run build:inference-adapter-glm-chat-answer-runtime`: PASS.
- `npm run build:core`: PASS.
- `npm run build:core-host`: PASS.
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npm run build:desktop`: PASS.
- `npx vitest run packages/contracts/test/chat-answer.test.ts packages/core/test/runtime.test.ts apps/core-host/test/user-preference-memory-repository.test.ts apps/ui/test/app-voice-ui-source.test.ts`: PASS, 151 tests.
- `npx vitest run packages/inference-adapter-openai-chat-answer/test/openai-compatible.test.ts packages/inference-adapter-glm-chat-answer-runtime/test/provider.test.ts`: PASS, 27 tests.
- Desktop automated smoke with temporary preference, route-alias, voice-alias,
  task, and memory paths: PASS. Verified real UI input saved `Chinese replies`,
  `short answers`, and `friendly tone`; Memory showed three low-risk preference
  records; Chat Answer projection contained `preferredResponseLanguage: zh`,
  `preferredResponseLength: short`, and `preferredResponseStyle: friendly`;
  fixture output reflected Chinese + short preferences; provider/raw remained
  hidden; vector retrieval remained disabled; no direct action or raw provider
  response persistence occurred.

Manual acceptance required for L4:
- Save at least two new preferences from the formal conversation UI, for
  example `remember short answers` and `remember friendly tone`.
- Confirm the Memory view lists `Response length` and `Response style` records
  as low-risk, visible, and deletable.
- Send a normal Chat Answer request and confirm the bounded answer reflects the
  selected preference policy when a bounded provider path is active.
- Confirm `Preference projection: ON`, `Applies to: CHAT ANSWER`,
  provider/raw hidden, and vector retrieval disabled.
- Delete the new preference records and confirm they disappear after refresh or
  restart.

Completion level:
- L4 user-usable for multiple explicit low-risk Chat Answer preference types.
- Not L5: editing, conflict UI, import/export, more preference categories,
  provider evaluation, and release readiness are not complete.

Windows manual acceptance:
- PASS, 2026-08-13.
- User confirmed the formal UI can save multiple low-risk preferences.
- User confirmed Memory displays the preference records and counts.
- User confirmed the Chat Answer path reflects the saved preference policy.
- Provider/raw private content remained hidden and vector retrieval remained
  disabled.

## 2026-08-13: Preference Conflict / Active Policy Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a low-coupling preference conflict behavior for same-key preferences.
When the user saves a new value for an existing preference key, Core keeps one
active record for that key and updates the visible Memory projection with the
current provider-neutral key/value.

Scope completed:
- Promoted preference key/value schemas to reusable provider-neutral contracts.
- Added sanitized `preferenceKey` and `preferenceValue` fields to
  `UserControlledMemoryRecord` for preference records.
- Projected active preference policy in the Memory UI with an `Active policy`
  row.
- Confirmed deterministic upsert behavior for conflicting response-length
  preferences: `remember detailed answers` followed by
  `remember short answers` leaves one active `response_length=short` record.

Safety boundaries:
- No provider credential access, provider calls, Qwen runtime, vector
  retrieval, Planner behavior, plugin execution, browser launch, desktop
  launch, shell, filesystem search, telemetry, installer, or release behavior
  was added.
- Raw user preference text is not projected to providers.
- Preferences remain visible, deletable, low-risk, and user-controlled.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:contracts`: PASS.
- `npm run build:capabilities`: PASS.
- `npm run build:core`: PASS.
- `npm run build:core-host`: PASS.
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npm run build:desktop`: PASS.
- `npx vitest run packages/contracts/test/protocol.test.ts packages/contracts/test/chat-answer.test.ts packages/core/test/runtime.test.ts apps/ui/test/app-voice-ui-source.test.ts`: PASS, 191 tests.
- No desktop automated smoke was run for this slice because source, contract,
  and unit tests cover the active-policy projection without launching external
  apps or providers.

Manual acceptance required for L4:
- In the formal conversation UI, send `remember detailed answers`.
- Then send `remember short answers`.
- Open the Memory view and confirm only one `Response length` preference record
  remains.
- Confirm that record shows `Active policy: response_length = short`.
- Confirm the record remains visible and deletable, provider/raw private
  remains hidden, and vector retrieval remains disabled.
- Delete the record, refresh or restart Jarvis-K, and confirm it remains absent.

Completion level:
- L3 real implementation with local source, build, and unit verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/import/export, richer conflict review, and release readiness are
  not complete.

## 2026-08-13: User-Controlled Memory Filter / Search L3 Slice

Status: L3 pending Windows manual acceptance.

Added a Memory UI management slice so growing user-controlled memory remains
manageable without expanding persistence, provider, vector, or execution
behavior.

Scope completed:
- Added a local Memory view filter state for `All`, `Routes`, `Voice`, and
  `Prefs`.
- Added a local text filter over sanitized visible memory fields:
  kind, label, summary, source, risk, preference key, and preference value.
- Added a visible filtered-count summary: `Showing X of Y user-controlled
  memories`.
- Kept all list/delete actions flowing through existing Core IPC and existing
  repositories.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Filtering only uses already-visible sanitized fields in the renderer.
- Raw provider/private content remains hidden.
- Delete behavior and deterministic rules remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only view filter and does not need external actions or providers.

Manual acceptance required for L4:
- Open the Memory view with at least one route alias and one preference saved.
- Click `Prefs` and confirm only preference records remain visible.
- Click `Routes` and confirm only route alias records remain visible.
- Type `short`, `IZYtoken`, or another visible label/summary term into the
  filter box and confirm the list narrows without changing record counts.
- Clear the filter, click `All`, and confirm all visible records return.
- Delete one filtered record and confirm the normal Core IPC delete path still
  removes it after refresh or restart.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: editing, import/export, richer sort/grouping, and release readiness
  are not complete.

## 2026-08-13: User-Controlled Memory Sort L3 Slice

Status: L3 pending Windows manual acceptance.

Extended the Memory UI management controls with a local sort selector so visible
user-controlled records can be reviewed in a stable order without changing
repositories or backend behavior.

Scope completed:
- Added `Newest`, `Oldest`, and `Kind` sort controls to the Memory view.
- Applied sorting after the existing sanitized kind/text filters.
- Kept `Newest` as the default sort, matching the repository-backed update-time
  ordering already used by Core.
- Kept all delete behavior on the existing Core IPC path.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Sorting only uses already-visible sanitized renderer fields.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only view sort and does not need external actions or providers.

Manual acceptance required for L4:
- Open the Memory view with at least two visible records.
- Confirm the default `Newest` order shows recently updated records first.
- Click `Oldest` and confirm the list reverses by update time.
- Click `Kind` and confirm records group by memory kind while remaining
  visible and deletable.
- Combine `Prefs` or a text filter with `Kind` and confirm filtering still
  applies before sorting.
- Delete one visible record and confirm the existing refresh/restart deletion
  behavior is unchanged.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: editing, import/export, richer grouping, and release readiness are
  not complete.

## 2026-08-13: User-Controlled Memory Per-Record Safety Badges L3 Slice

Status: L3 pending Windows manual acceptance.

Added visible per-record safety projection badges in the Memory view so users
can quickly confirm what each visible memory record is allowed to expose or do.

Scope completed:
- Added `RAW_HIDDEN` badges to visible memory records.
- Added `VIEW_DELETE` badges for records that can be deleted through the
  existing Core IPC path.
- Added `PROVIDER_NEUTRAL` badges for preference records, matching the
  sanitized Chat Answer preference projection boundary.
- Kept the existing risk, kind, active-policy, filter, sort, and delete
  behavior unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Badges are renderer-only status projection from already-visible sanitized
  fields.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view with at least one route alias and one preference record.
- Confirm every visible record shows `RAW_HIDDEN`.
- Confirm deletable records show `VIEW_DELETE`.
- Confirm preference records show `PROVIDER_NEUTRAL` and still show their
  active policy when available.
- Confirm route alias records do not incorrectly show `PROVIDER_NEUTRAL`.
- Use filter/sort controls and confirm badges remain attached to the right
  visible records.
- Delete one visible record and confirm refresh/restart deletion behavior is
  unchanged.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: editing, import/export, deeper policy inspection, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Reset Controls L3 Slice

Status: L3 pending Windows manual acceptance.

Added a one-click reset control for Memory view filters and sorting so users can
recover from a narrowed view without changing any saved memory records.

Scope completed:
- Added a `Reset` button to the Memory filter/sort control bar.
- Reset returns the view to `All`, `Newest`, and an empty search query.
- Reset is disabled when the view is already at the default controls state.
- Kept filtering, sorting, safety badges, active-policy projection, and delete
  behavior unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Reset only changes renderer-local view state.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only view reset and does not need external actions or providers.

Manual acceptance required for L4:
- Open the Memory view with at least two visible records.
- Select `Prefs` or `Routes`, type a search query, and choose `Oldest` or
  `Kind`.
- Confirm the list narrows or reorders.
- Click `Reset`.
- Confirm the search input clears, `All` and `Newest` are active again, and all
  visible records return.
- Confirm no memory record was created, edited, deleted, or changed by reset.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: editing, import/export, richer view presets, and release readiness
  are not complete.

## 2026-08-13: User-Controlled Memory View-State Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added explicit Memory boundary projection for renderer-local view controls so
filtering, sorting, and reset behavior are visibly separated from persisted
user-controlled memory records.

Scope completed:
- Added `View controls: LOCAL ONLY` to the Memory boundary panel.
- Added `View persistence: NOT PERSISTED` to the Memory boundary panel.
- Kept filter, search, sort, reset, safety badges, active-policy projection,
  and delete behavior unchanged.
- Kept all Memory record creation/deletion on the existing Core IPC and
  repository paths.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- The new projection is renderer-only status text derived from existing view
  behavior.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only boundary projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `View controls` as `LOCAL ONLY`.
- Confirm the Memory boundary panel shows `View persistence` as
  `NOT PERSISTED`.
- Use filter, search, sort, and reset controls and confirm those boundary values
  remain unchanged.
- Restart Jarvis-K and confirm filter/search/sort view state was not persisted
  by these controls.
- Confirm saved memory records remain unchanged unless explicitly deleted.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: editing, import/export, persistent view presets, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Delete Confirmation L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-side confirmation and per-record pending state for deleting
user-controlled memory records. This makes deletion intent explicit while
preserving the existing Core IPC and repository deletion boundary.

Scope completed:
- Added a confirmation prompt before `Delete user memory` calls Core IPC.
- Added a per-record delete pending key so only the selected record shows
  `Deleting` and is disabled during the operation.
- Added a cancelled-delete status projection without calling the repository
  when the user declines confirmation.
- Kept the existing Memory list, filter, search, sort, reset, boundary
  projection, active-policy projection, and safety badges unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Confirmation and pending state are renderer-only UI controls.
- Actual deletion still flows through the existing Core IPC and injected
  repositories.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only deletion guard and does not need external actions or providers.

Manual acceptance required for L4:
- Open the Memory view with at least one noncritical test record.
- Click `Delete` on that record and choose cancel in the confirmation prompt.
- Confirm the record remains visible and no memory count changes.
- Click `Delete` again and choose confirm.
- Confirm only that record shows `Deleting` while the operation is pending.
- Confirm the record disappears after deletion and remains absent after refresh
  or restart.
- Confirm other memory records, filter/search/sort/reset controls, provider/raw
  hidden projection, and vector retrieval disabled projection remain unchanged.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, bulk deletion, audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Count Consistency Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local memory count consistency projection to the Memory
boundary panel so users can verify that the visible category counts still
reconcile with the total user-controlled memory count.

Scope completed:
- Added `Memory count check` to the Memory boundary panel with `OK`/`MISMATCH`
  status.
- Derived the check from existing route alias, voice alias, preference, and
  total memory counts.
- Kept the existing record list, delete confirmation flow, delete-pending
  status, source counts, provider-neutral count, raw exposure count, deletion
  eligibility counts, visible-records projection, filters, search, sort, reset,
  and safety badges unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Count consistency is renderer-only and derived from already-visible sanitized
  record metadata.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Memory count check`.
- Confirm the value is `OK` when total memories equal route aliases + voice
  aliases + preferences.
- Add or delete one safe test memory through existing user-controlled flows and
  confirm the check remains `OK` after refresh.
- Use filters, search, sort, and reset and confirm the check remains a
  total-record consistency check, not a filtered-list check.
- Confirm no provider call, Qwen runtime, vector retrieval, raw/private content,
  plugin execution, browser launch, desktop launch, shell, or filesystem search
  occurs.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, provider-policy audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Delete Pending Status Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local delete-pending projection to the Memory boundary panel
so users can verify whether a user-controlled memory delete operation is
currently in progress or idle.

Scope completed:
- Added `Delete pending` to the Memory boundary panel with `YES`/`NO` status.
- Reused the existing `userControlledMemoryDeletePendingKey` UI state that is
  already used by the per-record delete button.
- Kept the existing delete confirmation flow, Core IPC delete path, repository
  boundary, record list, source counts, provider-neutral count, raw exposure
  count, deletion eligibility counts, visible-records projection, filters,
  search, sort, reset, and safety badges unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Delete-pending status is renderer-only and derived from already-existing UI
  delete state.
- It does not bypass the existing explicit delete confirmation.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Delete pending`.
- Confirm the value is `NO` while no deletion is active.
- Delete one safe test memory through the existing confirmation flow.
- Confirm the per-record button still uses the existing confirmation and
  deletion behavior.
- Confirm `Delete pending` returns to `NO` after the operation finishes or is
  cancelled.
- Confirm no record is deleted unless the explicit delete confirmation is
  accepted.
- Confirm no provider call, Qwen runtime, vector retrieval, raw/private content,
  plugin execution, browser launch, desktop launch, shell, or filesystem search
  occurs.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, provider-policy audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Confirmation Source Count L3 Slice

Status: L3 pending Windows manual acceptance.

Added renderer-local source-count projection to the Memory boundary panel so
users can reconcile visible memory records with their sanitized user-confirmed
source categories.

Scope completed:
- Added `Confirmed route sources`, `Confirmed voice sources`, and
  `Confirmed preference sources` to the Memory boundary panel.
- Derived counts only from the existing contract-safe `memory.source` enum:
  `user_confirmed_route_alias`, `voice_correction_alias`, and
  `user_confirmed_preference`.
- Kept existing record list, provider-neutral count, provider/raw private
  boundary, raw exposure count, deletion eligibility projection,
  visible-records projection, active criteria row, risk counts, filters,
  search, sort, reset, delete confirmation, safety badges, and active-policy
  projection unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Source counts are renderer-only projections from already-visible sanitized
  record metadata.
- Raw provider/private content remains hidden.
- Provider runtime remains `NOT USED`.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Confirmed route sources`,
  `Confirmed voice sources`, and `Confirmed preference sources`.
- Confirm the counts match visible records whose source lines are
  `USER_CONFIRMED_ROUTE_ALIAS`, `VOICE_CORRECTION_ALIAS`, and
  `USER_CONFIRMED_PREFERENCE`.
- Use filters, search, sort, and reset and confirm source counts remain
  total-record boundary counts, not filtered-list counts.
- Delete one safe test memory through the existing confirmation flow and
  confirm the matching source count updates after refresh.
- Confirm no provider call, Qwen runtime, vector retrieval, raw/private content,
  plugin execution, browser launch, desktop launch, shell, or filesystem search
  occurs.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, provider-policy audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Provider-Neutral Count Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local provider-neutral count to the Memory boundary panel so
users can verify which visible records are currently projected as
provider-neutral without invoking provider runtime.

Scope completed:
- Added `Provider-neutral records` to the Memory boundary panel.
- Reused the existing sanitized provider-neutral preference projection
  metadata.
- Kept existing record list, provider/raw private boundary, raw exposure count,
  deletion eligibility projection, visible-records projection, active criteria
  row, risk counts, filters, search, sort, reset, delete confirmation, safety
  badges, and active-policy projection unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Provider-neutral count is renderer-only and derived from already-visible
  sanitized record metadata.
- Provider runtime remains `NOT USED`.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Provider-neutral records`.
- Confirm the count matches visible records with the `PROVIDER_NEUTRAL` badge.
- Confirm `Provider runtime` remains `NOT USED`.
- Use filters, search, sort, and reset and confirm provider-neutral count
  remains a total-record boundary count, not a filtered-list count.
- Confirm no provider call, Qwen runtime, vector retrieval, or raw/private
  content is shown.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, provider-policy audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Raw Exposure Count Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local raw exposure count to the Memory boundary panel so users
can verify that provider/raw private content remains hidden and identify any
future record that explicitly reports raw exposure.

Scope completed:
- Added `Raw exposed records` to the Memory boundary panel.
- Reused the existing sanitized `memory.rawContentExposed` field.
- Changed the existing `Provider/raw private` projection to derive from the new
  raw exposure count.
- Kept the existing record list, delete flow, active criteria row,
  visible-records projection, deletion eligibility projection, risk counts,
  filters, search, sort, reset, safety badges, and active-policy projection
  unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Raw exposure count is a renderer-only projection from sanitized record
  metadata.
- No raw provider/private content is displayed.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only privacy boundary projection and does not need external actions
  or providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Raw exposed records`.
- Confirm the count is `0` for the current user-controlled memory records.
- Confirm `Provider/raw private` remains `HIDDEN` when `Raw exposed records`
  is `0`.
- Use filters, search, sort, and reset and confirm the raw exposure count does
  not change.
- Confirm no raw transcript, provider output, credentials, private paths, or
  hidden content appears in the Memory UI.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, privacy audit history, and release
  readiness are not complete.

## 2026-08-13: User-Controlled Memory Risk Filter L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local risk filter to the Memory view so users can review
visible user-controlled records by sanitized risk level without changing
repositories or execution behavior.

Scope completed:
- Added `All risk`, `Low`, `Medium`, and `High` Memory risk filter controls.
- Applied risk filtering after kind filtering and before text search/sort.
- Updated Reset so it returns kind filter, risk filter, sort, and search query
  to their default local view state.
- Kept delete confirmation, per-record pending state, filter/search/sort,
  safety badges, active-policy projection, and boundary projection unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Risk filtering uses only the already-visible sanitized `memory.risk` field in
  the renderer.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only view filter and does not need external actions or providers.

Manual acceptance required for L4:
- Open the Memory view with at least one low-risk record and, if available, one
  medium-risk route alias record.
- Click `Low` and confirm only low-risk records remain visible.
- Click `Medium` and confirm only medium-risk records remain visible when such
  records exist, or the empty filtered state appears when none exist.
- Click `High` and confirm high-risk records are shown only if present.
- Combine risk filtering with `Prefs` or `Routes` and a search query, then
  confirm the filtered count updates without changing total memory count.
- Click `Reset` and confirm risk returns to `All risk`, kind returns to `All`,
  sort returns to `Newest`, and the search query clears.
- Confirm no memory record is created, edited, deleted, or changed by risk
  filtering.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history, and
  release readiness are not complete.

## 2026-08-14: User-Controlled Memory View Preference Persistence L4 Slice

Status: L4 after Windows UI/manual acceptance.

Added renderer-local persistence for the Memory view's non-content view
preferences so a user's selected kind filter, risk filter, and sort order can
survive view changes or app restart without changing memory records.

Scope completed:
- Added a guarded renderer `localStorage` key for user-controlled Memory view
  preferences.
- Persisted only `kind`, `risk`, and `sort` view state.
- Restored persisted view preferences on renderer startup when the stored
  values match known enum options.
- Invalid or malformed local view preference data falls back to default view
  controls and is cleared.
- Kept the search query session-only; search text is not persisted.
- Updated the Memory boundary projection to show local filter persistence and
  disabled search persistence.

Safety boundaries:
- No backend persistence schema, Core repository change, provider call, Qwen
  runtime, vector retrieval, Planner behavior, plugin execution, browser launch,
  desktop launch, shell, filesystem search, telemetry, installer, or release
  behavior was added.
- View preference persistence is renderer-local and stores no memory records,
  raw content, provider output, transcripts, URLs, credentials, files, or
  private paths.
- Raw provider/private content remains hidden.
- Deterministic rules and existing Task Runtime, permission, URL, and Command
  Router safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- `npm run typecheck`: PASS.
- No desktop automated smoke was run for this slice because the change is
  renderer-local view state persistence and does not need external actions,
  providers, browser launch, desktop launch, or Task Runtime execution.

Windows manual acceptance:
- PASS, confirmed by user on 2026-08-14.
- Memory view kind/risk/sort selections persist across view changes and
  Jarvis-K restart.
- Search query remains session-only and clears after restart.
- Reset returns kind/risk/sort to defaults and persists the default view.
- No memory record was created, edited, deleted, or changed by view preference
  persistence.

Completion level:
- L4 user-facing Memory UI integration after Windows manual acceptance.
- Not L5: saved view presets, edit/restore, export/import, audit history,
  retention controls, storage encryption, and release readiness are not
  complete.

## 2026-08-14: Voice Alias Route-Alias Execution Remediation L4

Status: L4 after Windows UI/manual execution acceptance.

Fixed the confirmed voice-alias execution path so a user-confirmed voice alias
can resolve through an existing user route alias before `browser.open` reaches
Task Runtime execution. This covers the observed case where Memory contained a
voice alias such as `Open EC TOKEN backend` pointing at `IZYtoken admin`, while
the route alias stored the actual safe HTTPS target.

Scope completed:
- Added deterministic Core routing for exact user-confirmed voice command alias
  matches before ordinary provider/rules fallback routing.
- Preserved the original voice correction path for real `source: voice`
  commands.
- Resolved `browser.open` voice-alias targets through the existing
  user-confirmed route-alias repository before execution.
- Kept Task Runtime, browser URL policy, existing allowlist checks, and risk
  rules as the final execution gate.
- Added regression coverage for text/accepted-command input where the route
  alias does not directly contain the spoken alias text.

Safety boundaries:
- No provider call, Qwen runtime, vector retrieval, Planner behavior, plugin
  execution, shell, filesystem search, telemetry, installer, packaging, or
  release behavior was added.
- No free model rewrite is used; only persisted user-confirmed alias records
  are consumed.
- Unknown or ambiguous voice alias matches fall through or fail closed through
  the existing browser URL safety gate.
- Raw provider/private content remains hidden.

Verification:
- `npx vitest run packages/core/test/runtime.test.ts`: PASS, 115 tests.
- `npx vitest run packages/core/test/voice-command-resolver.test.ts`: PASS,
  5 tests.
- `npm run typecheck`: PASS.
- Windows UI/manual execution acceptance: PASS, confirmed by the user in this
  thread after restarting the patched runtime and verifying that the route
  opens successfully.

Windows manual acceptance:
- PASS, confirmed by the user in this thread.
- The user restarted or otherwise loaded the patched Core runtime.
- The Memory view contained the user-confirmed route alias for
  `IZYtoken admin` and the user-confirmed voice alias for
  `Open EC TOKEN backend` / `target: IZYtoken admin`.
- The user retried the alias from the formal conversation/accepted transcript
  path.
- Jarvis-K no longer returned `TARGET_NOT_ALLOWLISTED`.
- The browser successfully opened the IZYtoken backend URL through the existing
  Task Runtime and browser URL policy path.

Completion level:
- Current level: L4.
- L4 basis: the user can use a persisted voice alias that points to a persisted
  route alias from the formal Jarvis-K surface, and the route opens through
  the existing Task Runtime/browser URL policy gate.
- Not L5: broader memory edit/restore/export/audit/release readiness remains
  incomplete.

## 2026-08-14: Voice Alias to Route Alias Browser Resolution Remediation L3

Status: superseded by the later L4 remediation above.

Fixed the Voice Alias Memory L4 blocker observed during manual acceptance:
voice correction aliases could be visible and persisted, but a selected
`browser.open` voice alias whose slot target was a user route alias label
still reached Desktop Host as a label string and failed browser URL policy with
`TARGET_NOT_ALLOWLISTED`.

Scope completed:
- Resolved selected voice command correction `browser.open` candidates through
  the provider-neutral user route alias repository before planning and Task
  Runtime dispatch.
- Limited resolution to existing user-confirmed route alias records and reused
  the existing safe HTTPS URL policy before replacing the target slot.
- Preserved raw transcript, normalized transcript, correction source,
  correction confidence, and correction candidates.
- Added routed decision slots for `target`, `routeAliasId`, `routeAliasLabel`,
  and `targetHostname` after successful resolution.
- Kept Desktop Host browser allowlist unchanged; no new browser target,
  allowlist expansion, shell execution, product runtime bypass, provider call,
  Qwen runtime, vector retrieval, telemetry, packaging, or release behavior was
  added.

Regression coverage:
- Added a Core Runtime regression test for:
  `voice alias -> user route alias -> safe HTTPS URL -> Task Runtime browser.open`.
- The test verifies the browser executor receives the resolved HTTPS URL, not
  the alias label.
- The test verifies the task is created from voice source and completes only
  after URL policy verification.

Verification:
- `npx vitest run packages/core/test/runtime.test.ts`: PASS, 114 tests.
- `npx vitest run packages/core/test/voice-command-resolver.test.ts`: PASS, 5
  tests.
- `npm run typecheck`: PASS.
- Windows manual acceptance: superseded by the later L4 remediation above.

Closure note:
- The original blocker in this section was closed by the later
  `Voice Alias Route-Alias Execution Remediation L4` fix and manual acceptance.
- The first remediation covered real `source: voice`; the later remediation
  also covered the normal conversation/accepted-transcript path where the
  saved voice alias text can arrive as text.

Manual acceptance required for L4:
- Ensure Memory contains a route alias such as `IZYtoken admin ->
  https://api.izytoken.com`.
- Ensure Memory contains a voice alias such as `打开 EC TOKEN 后台 ->
  browser.open / target:IZYtoken admin`.
- Restart Jarvis-K to confirm both records persist.
- Use voice input or the same recognized transcript: `打开 EC TOKEN 后台`.
- Confirm Jarvis-K no longer returns `TARGET_NOT_ALLOWLISTED`.
- Confirm the browser opens the route alias URL through Task Runtime and the
  task timeline reaches `completed` with URL policy verification.
- Delete the voice alias from Memory, restart Jarvis-K, and confirm the deleted
  alias no longer appears or silently executes.

Completion level:
- Superseded by the later L4 remediation above.
- Not L5: broader memory edit/restore, export/import, audit history, retention
  controls, and release readiness remain incomplete.

## 2026-08-13: User-Controlled Memory Deletion Eligibility Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added renderer-local deletion eligibility counts to the Memory boundary panel so
users can compare the number of deletable and locked records with the visible
per-record delete controls.

Scope completed:
- Added `Deletable records` and `Locked records` to the Memory boundary panel.
- Counted deletion eligibility from the already-visible sanitized
  `memory.deletable` field.
- Kept the existing Core IPC deletion path, delete confirmation, per-record
  pending state, active criteria row, visible-records projection, risk counts,
  filters, search, sort, reset, safety badges, and active-policy projection
  unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Deletion eligibility counts are renderer-only projections from sanitized
  record metadata.
- Actual deletion still flows through the existing Core IPC and repository
  boundary.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Deletable records` and
  `Locked records`.
- Confirm the `Deletable records` count matches records with enabled delete
  controls.
- Confirm the `Locked records` count matches records that cannot be deleted, if
  any are present.
- Delete one safe test record through the existing confirmation flow and confirm
  the deletion counts update after the record disappears.
- Confirm no record is deleted unless the explicit delete confirmation is
  accepted.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, bulk deletion, audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Visible Records Boundary Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local visible-records projection to the Memory boundary panel
so users can cross-check the current filtered list size against total
user-controlled memory records.

Scope completed:
- Added `Visible records` to the Memory boundary panel using
  `filtered/total` format.
- Reused the existing filtered Memory list and total Memory record count.
- Kept the existing active criteria row, risk counts, filters, search, sort,
  reset, delete confirmation, safety badges, active-policy projection, and
  boundary controls unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Visible-records projection is renderer-only and derived from already-visible
  sanitized view state.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the Memory boundary panel shows `Visible records` in `shown/total`
  format.
- Change kind filter, risk filter, search query, and sort mode.
- Confirm `Visible records` updates when filters/search change and stays stable
  when only sort changes.
- Click `Reset` and confirm `Visible records` returns to total/total.
- Confirm no memory record is created, edited, deleted, or changed by the
  visible-records projection.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Active View Criteria Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added a renderer-local active view criteria projection above the Memory list so
users can verify the current kind filter, risk filter, sort mode, and search
state while reviewing user-controlled memory records.

Scope completed:
- Added an active criteria row showing `Kind`, `Risk`, `Sort`, and `Search`
  state.
- Reused the existing Memory kind filter, risk filter, sort options, and search
  query state.
- Kept the existing record list, summary counts, reset behavior, delete
  confirmation, safety badges, active-policy projection, and boundary
  projection unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Active criteria are renderer-only projections from already-visible local view
  state.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the list header shows `Kind`, `Risk`, `Sort`, and `Search` criteria.
- Change kind filter, risk filter, sort mode, and search query one at a time.
- Confirm the criteria row updates after each change.
- Click `Reset` and confirm criteria return to `Kind: All`, `Risk: All risk`,
  `Sort: Newest`, and `Search: CLEAR`.
- Confirm no memory record is created, edited, deleted, or changed by the
  active criteria projection.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history, and
  release readiness are not complete.

## 2026-08-13: User-Controlled Memory Risk Count Projection L3 Slice

Status: L3 pending Windows manual acceptance.

Added renderer-local low/medium/high risk count projection to the Memory
summary so users can reconcile the visible risk-filter controls with sanitized
memory record risk levels.

Scope completed:
- Added `Low risk`, `Medium risk`, and `High risk` summary cards to the Memory
  view.
- Counted records from the already-visible sanitized `memory.risk` field.
- Kept existing total, kind counts, risk filter, search, sort, reset, delete
  confirmation, safety badges, active-policy projection, and boundary
  projection unchanged.

Safety boundaries:
- No backend persistence schema, provider call, Qwen runtime, vector retrieval,
  Planner behavior, plugin execution, browser launch, desktop launch, shell,
  filesystem search, telemetry, installer, or release behavior was added.
- Risk counts are renderer-only projections from already-visible sanitized
  fields.
- Raw provider/private content remains hidden.
- Deterministic rules and existing safety gates remain unchanged.

Verification:
- `npm run build:ui`: PASS with existing Vite chunk-size warning.
- `npx vitest run apps/ui/test/app-voice-ui-source.test.ts`: PASS, 32 tests.
- No desktop automated smoke was run for this slice because the change is a
  renderer-only status projection and does not need external actions or
  providers.

Manual acceptance required for L4:
- Open the Memory view.
- Confirm the summary shows `Low risk`, `Medium risk`, and `High risk` cards.
- Confirm the three counts add up to the total memory count.
- Click each risk filter and confirm the visible list matches the relevant
  summary count.
- Combine risk filtering with kind filtering and search; confirm total count
  remains unchanged while visible count changes.
- Confirm no memory record is created, edited, deleted, or changed by the risk
  count projection.

Completion level:
- L3 renderer implementation with local source and build/test verification.
- Not L4 until Windows manual acceptance confirms the formal UI behavior.
- Not L5: edit/restore, export/import, saved view presets, audit history, and
  release readiness are not complete.
