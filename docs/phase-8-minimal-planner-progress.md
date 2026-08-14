# Phase 8 Minimal Planner Progress

## 2026-08-14: Planner Approved Known Local App Open L4 Slice

Status: L4 after local source, unit, typecheck, core build verification, and
Windows UI manual acceptance.

Scope:
- Minimal Planner `localApp.open` draft steps now persist a structured
  `target` in `toolInput`.
- Approved planner `localApp.open` steps execute only after the existing
  `agent.approveTask` explicit UI-confirmation path.
- Execution reuses the existing injected `brainActionExecutor.openLocalApp`
  path.
- Planner local-app targets are normalized through the existing known-app
  policy before execution.
- Missing, unknown, or non-allowlisted app targets fail closed before any
  executor call is attempted.
- Planner approval still stops after the first failed step and cancels
  remaining pending steps.

Safety boundaries:
- No product-runtime local app was launched by automated tests; verification
  used a fake injected known-app executor only.
- No provider planner call, Qwen runtime, browser action, plugin invocation,
  shell, PowerShell, cmd, telemetry expansion, installer change,
  release-channel change, approval request, preflight, bounded-window
  document, or closeout document was added.
- The planner does not get a direct execution bypass. Local app opening still
  requires prior task approval and the existing Task Runtime / known-app policy
  path.
- Unknown targets such as PowerShell fail closed before reaching
  `openLocalApp`.

Automated verification:
- `npx vitest run packages/core/test/runtime.test.ts --reporter=dot`: PASS,
  1 test file / 122 tests.
- `npm run typecheck`: PASS.
- `npm run build:core`: PASS.

Windows manual L4 acceptance checklist:
- Restart Jarvis-K after the latest build.
- In the formal conversation UI, send:
  `Plan a multi-step workflow to open Notepad`.
- Confirm the assistant saves a Minimal Planner draft and does not open
  Notepad before approval.
- Open the Tasks view.
- Confirm the `Review Minimal Plan` task is `awaiting_confirmation`.
- Confirm the draft contains a `localApp.open` step with a visible Notepad
  target.
- Click the approve/play control and accept the UI confirmation prompt.
- Confirm the task transitions through `running` and then reaches
  `completed`.
- Confirm Notepad opens only after approval.
- Confirm the local-app step result is verified in the task timeline.
- Send a second planner draft for an unsafe/non-known app target such as
  `Plan a multi-step workflow to open PowerShell`.
- Approve it only if the UI shows the expected confirmation path, and confirm
  the task fails closed with a non-allowlisted target message rather than
  opening PowerShell.
- Restart Jarvis-K and confirm the completed/failed task records remain
  visible and are not replayed.
- Confirm no browser, plugin, shell, PowerShell, cmd, Qwen runtime, provider
  planner, installer, telemetry, or release-channel behavior is triggered.

Completion level:
- L4 now: planner-approved known local app execution is implemented through
  the formal Task Runtime approval path and verified with unit/type/build
  checks plus Windows UI manual acceptance in the formal app.
- Not L5: richer plan editing, broader executor-aware side effects, rollback,
  provider-backed planning, and release hardening remain incomplete.

Windows manual L4 acceptance result:
- PASS, confirmed by the user in this thread.
- The user created a Minimal Planner draft for opening Notepad from the formal
  UI.
- Notepad did not open before task approval.
- The `Review Minimal Plan` task reached `awaiting_confirmation`.
- The draft contained a `localApp.open` step with a visible Notepad target.
- The approve/play control was used through the explicit UI confirmation path.
- Notepad opened only after approval.
- The task reached `completed`.
- The local-app step result was verified in the task timeline.
- A non-known app target such as PowerShell failed closed and did not open.
- Completed and failed task records remained visible after restart and were not
  replayed.
- No browser, plugin, shell, PowerShell, cmd, Qwen runtime, provider planner,
  installer, telemetry, or release-channel behavior was triggered outside the
  approved Task Runtime known-app path.

## 2026-08-14: Planner Approved Browser Open L4 Slice

Status: L4 after local source, unit, typecheck, core build verification, and
Windows UI manual acceptance.

Scope:
- Minimal Planner `browser.open` draft steps now persist a structured
  `target` in `toolInput`.
- Approved planner `browser.open` steps execute only after the existing
  `agent.approveTask` explicit UI-confirmation path.
- Execution reuses the existing injected `brainActionExecutor.openBrowser`
  path and relies on its URL policy/result verification.
- Missing structured browser targets fail closed before any browser executor
  call is attempted.
- Planner approval still stops after the first failed step and cancels
  remaining pending steps.

Safety boundaries:
- No provider planner call, Qwen runtime, plugin invocation, local app launch,
  shell, PowerShell, cmd, telemetry expansion, installer change,
  release-channel change, approval request, preflight, bounded-window
  document, or closeout document was added.
- This L3 verification used a fake injected browser executor only; no real
  browser was opened by automated tests.
- URL allowlist/scheme validation remains owned by the existing browser
  executor and Task Runtime policy path.
- Planner does not get a direct execution bypass and cannot execute a browser
  step without prior task approval.

Automated verification:
- `npx vitest run packages/core/test/runtime.test.ts --reporter=dot`: PASS,
  1 test file / 120 tests.
- `npm run typecheck`: PASS.
- `npm run build:core`: PASS.

Windows manual L4 acceptance checklist:
- Restart Jarvis-K after the latest build.
- In the formal conversation UI, send:
  `Plan a multi-step workflow to open GitHub and check memory status`.
- Confirm the assistant saves a Minimal Planner draft and does not execute
  tools before approval.
- Open the Tasks view.
- Confirm the `Review Minimal Plan` task is `awaiting_confirmation`.
- Confirm the draft contains a browser-open step with a visible safe browser
  target, such as GitHub.
- Click the approve/play control and accept the UI confirmation prompt.
- Confirm the task transitions through `running` and then reaches
  `completed`.
- Confirm the browser opens only after approval.
- Confirm the browser step result is verified in the task timeline.
- Confirm no local app, plugin, shell, PowerShell, cmd, Qwen runtime, provider
  planner, installer, telemetry, or release-channel behavior is triggered.
- Restart Jarvis-K and confirm the completed task remains visible and is not
  replayed.

Completion level:
- L4 now: planner-approved browser-open execution is implemented through the
  formal Task Runtime approval path and verified with unit/type/build checks.
- Windows UI manual acceptance passed in the formal app.
- Not L5: richer plan editing, broader executor-aware side effects, rollback,
  provider-backed planning, and release hardening remain incomplete.

Windows manual L4 acceptance result:
- PASS, confirmed by the user in this thread.
- The user created a Minimal Planner draft for opening GitHub and checking
  memory status from the formal UI.
- The browser did not open before task approval.
- The `Review Minimal Plan` task reached `awaiting_confirmation`.
- The approve/play control was used with explicit UI confirmation.
- The task transitioned through execution and reached `completed`.
- The browser opened only after approval.
- The browser step result was verified in the task timeline.
- The completed task remained visible after restart and was not replayed.
- No local app, plugin, shell, PowerShell, cmd, Qwen runtime, provider
  planner, installer, telemetry, or release-channel behavior was triggered.

## 2026-08-14: Planner Draft Approve/Execute L4 Slice

Status: L4 after local source, unit, migration, typecheck, build
verification, and Windows UI manual acceptance.

Scope:
- Added a bounded `agent.approveTask` command for Task Runtime records.
- The command only accepts `awaiting_confirmation` planner draft tasks with
  explicit UI confirmation.
- Planner-created `TaskStep` records now persist optional structured execution
  metadata: `toolId` and `toolInput`.
- SQLite Task Runtime storage moved to schema version 2 with an incremental
  nullable-column migration for planner step execution metadata.
- The Tasks view now shows an approve/play control only for
  `awaiting_confirmation` tasks.
- Approval execution is intentionally limited in L3 to bounded, low-side-effect
  steps:
  - `observability.status`
  - `memory.status`
  - `filesystem.search` through the existing observe-only executor
- Side-effecting or not-yet-wired planner tools fail closed in this slice:
  `browser.open`, `localApp.open`, `plugin.invoke`, `chat.answer`,
  `notepad.writeText`, window controls, `memory.search`, `model.status`, and
  `system.settings`.

Safety boundaries:
- No provider planner call, Qwen runtime, browser action, desktop app action,
  plugin invocation, shell, PowerShell, cmd, telemetry expansion, installer
  change, release-channel change, approval request, preflight, bounded-window
  document, or closeout document was added.
- Approving a planner draft does not bypass Task Runtime, existing permission
  layers, risk rules, URL policy, or Command Router safety gates.
- Unknown planner tools fail closed before execution and are recorded in the
  task timeline with sanitized failure reasons.
- `filesystem.search` remains observe-only and uses the existing bounded
  Desktop Host adapter.

Automated verification:
- `npm run build:contracts`: PASS.
- `npx vitest run packages/contracts/test/protocol.test.ts packages/core/test/runtime.test.ts apps/core-host/test/sqlite-task-repository.test.ts --reporter=dot`:
  PASS, 3 test files / 161 tests.
- `npx vitest run apps/ui/test/use-jarvis-inference-source.test.ts apps/ui/test/app-voice-ui-source.test.ts --reporter=dot`:
  PASS, 2 test files / 49 tests.
- `npm run typecheck`: PASS.
- `npm run build:ui`: PASS, with the existing Vite large chunk warning.
- `npm run build:core`: PASS.
- `npm run build:core-host`: PASS.
- `npm run build:desktop`: PASS.

Windows manual L4 acceptance checklist:
- Restart Jarvis-K after the latest build.
- In the formal conversation UI, send:
  `Plan a multi-step workflow to check memory status and search project files`.
- Confirm the assistant says the Minimal Planner saved a bounded plan and did
  not execute tools yet.
- Open the Tasks view.
- Confirm the `Review Minimal Plan` task is `awaiting_confirmation`.
- Confirm the task has both cancel and approve/play controls.
- Click the approve/play control.
- Accept the UI confirmation prompt.
- Confirm the task transitions through running and then reaches `completed`.
- Confirm the timeline includes `state_changed`, `step_started`, and
  `verification_completed` events.
- Confirm the status and memory steps are verified.
- Confirm the filesystem search step is verified through the observe-only
  bounded search executor and exposes only sanitized result summary text.
- Restart Jarvis-K and confirm the completed task remains visible and is not
  replayed.
- Confirm no browser, local app, plugin, shell, PowerShell, cmd, installer,
  telemetry, or provider planner action occurred during this L4 acceptance.

Completion level:
- L4 now: real implementation is wired through Contracts, Core, SQLite,
  Task Runtime, and formal UI, with local automated verification.
- Windows UI manual acceptance passed in the formal app.
- Not L5: side-effecting planner execution, richer approval editing, running
  interruption, rollback semantics, provider-backed planner execution, and
  release hardening remain incomplete.

Windows manual L4 acceptance result:
- PASS, confirmed by the user in this thread.
- The user created a Minimal Planner draft from the formal UI.
- The `Review Minimal Plan` task reached `awaiting_confirmation`.
- The approve/play control was visible for the pending planner draft.
- The user approved the draft through the UI confirmation prompt.
- Bounded L3 planner steps executed through Task Runtime.
- The task reached `completed`.
- The task timeline showed state, step, and verification events.
- Status, memory, and filesystem search steps exposed sanitized summaries.
- No browser, local app, plugin, shell, PowerShell, cmd, installer, telemetry,
  Qwen runtime, or provider planner action occurred during this flow.

## 2026-08-14: Planner Draft Cancel L3 Slice

Status: L4 after Windows UI manual acceptance.

Scope:
- Added a bounded `agent.cancelTask` command for Task Runtime records.
- The command only allows cancellation for `queued`, `planning`, or
  `awaiting_confirmation` tasks.
- Planner draft steps that have not run are marked `cancelled` with
  verification status `not_applicable`.
- The cancelled task receives a `cancelled` event and a sanitized verification
  summary.
- Added a Tasks view cancel control for eligible pending/planning tasks.

Safety boundaries:
- No planner execution, tool execution, provider call, Qwen runtime, browser
  action, desktop action, filesystem action, plugin invocation, shell,
  PowerShell, cmd, telemetry expansion, approval request, preflight,
  bounded-window document, or closeout document was added.
- Running tasks are not cancellable through this control yet, because runtime
  interruption of real side-effecting work needs a separate executor-aware
  design.
- Completed, failed, cancelled, interrupted, rolling-back, and rolled-back
  tasks fail closed for this command.

Automated verification:
- `npx vitest run packages/contracts/test/protocol.test.ts packages/core/test/runtime.test.ts --reporter=dot`:
  PASS, 2 test files / 158 tests.
- `npx vitest run apps/ui/test/use-jarvis-inference-source.test.ts apps/ui/test/app-voice-ui-source.test.ts --reporter=dot`:
  PASS, 2 test files / 47 tests.
- `npm run typecheck`: PASS.
- `npm run build:ui`: PASS, with the existing Vite large chunk warning.
- `npm run build:core-host`: PASS.
- `npm run build:desktop`: PASS.

Windows manual L4 acceptance checklist:
- Create a Minimal Planner draft from the formal UI with:
  `Plan a multi-step workflow to check memory status and search project files`.
- Open the Tasks view.
- Confirm the `Review Minimal Plan` task shows a cancel control.
- Click cancel and confirm the UI prompt.
- Confirm the task state becomes `cancelled`.
- Confirm all planner draft steps are `cancelled` with verification status
  `not_applicable`.
- Confirm the task timeline includes a `cancelled` event.
- Restart Jarvis-K and confirm the cancelled task remains visible and is not
  replayed.
- Confirm no browser, desktop app, filesystem action, plugin invocation, or
  shell command was executed by the product runtime.

Completion level:
- L3 after automated verification.
- L4 after Windows manual acceptance passed in the formal UI.
- Not L5: planner approval execution, executor-aware running cancellation,
  richer task edit/confirm UX, rollback semantics, and release hardening are
  not complete.

Windows manual acceptance result:
- PASS, confirmed by the user in this thread.
- The user created a Minimal Planner draft from the formal UI.
- The user opened the Tasks view and used the pending task cancel control.
- The cancellation prompt was shown and accepted.
- The planner draft task transitioned to `cancelled`.
- Non-executed planner draft steps were shown as cancelled/non-applicable.
- The task record remained visible after restart and was not replayed.
- No browser, desktop app, filesystem action, plugin invocation, shell,
  PowerShell, or cmd execution was performed by product runtime during this
  cancellation flow.

## 2026-08-14: Minimal Planner L4 Manual Acceptance

Status: L4 after Windows UI manual acceptance.

Windows manual acceptance result:
- PASS, confirmed by the user in this thread.
- The formal UI routed the explicit multi-step planning request into Minimal
  Planner after a full app restart.
- The assistant showed a bounded plan summary and stated that no tool
  execution was attempted.
- Task Runtime persisted a `Review Minimal Plan` task.
- The task reached `awaiting_confirmation`.
- The task route source remained `intent-router.deterministic.rules`.
- The task summary or event text identified `planner.deterministic.rules`.
- Planner draft steps stayed non-executed and used `not_applicable`
  verification.
- Restart preserved the draft task.
- Ordinary `chat.answer` and direct deterministic rules routes were not
  blocked by Minimal Planner.

Completion level:
- Minimal Planner draft creation and Task Runtime persistence are L4.
- Not L5: planner approval execution, cancellation UX, rollback semantics,
  richer step editing, provider-backed planning, and release hardening remain
  incomplete.

## 2026-08-14: Minimal Planner L3 Vertical Slice

Status: L4 after Windows manual acceptance; retained as the original L3
implementation evidence.

Scope:
- Added a deterministic, provider-neutral Minimal Planner path for complex or
  multi-step requests.
- The Minimal Planner uses finite candidate extraction only. It does not call
  Qwen, a Heavy Planner provider, network services, plugin code, browser
  runtime, desktop runtime, filesystem runtime, shell, PowerShell, cmd, or any
  external process.
- Planner output is a bounded draft plan only. It is projected into the
  conversation as a plan that requires explicit user confirmation.
- Planner output is persisted into Task Runtime as a `Review Minimal Plan`
  task with state `awaiting_confirmation`.
- Planner-created task steps are stored as `pending` with verification status
  `not_applicable`, because no real tool execution is attempted in L3.
- Ordinary `chat.answer` and low-risk direct deterministic rules routes remain
  separate and should not be blocked by planner availability.

Safety boundaries:
- No approval request, preflight, bounded-window document, closeout document,
  release-channel change, installer change, telemetry expansion, Qwen runtime,
  provider planner call, credential use, vector retrieval, Memory write, or
  real tool execution was added.
- Existing deterministic rules, Task Runtime boundaries, Command Router safety
  gates, URL policy, risk confirmation rules, and fixture-test-only boundaries
  remain in force.
- Planner plans cannot bypass confirmation. High-risk operations remain
  subject to the existing permission and risk layers even if a future planner
  recognizes the intent.

Implementation notes:
- `planner.deterministic.rules` is the default Minimal Planner provider when a
  Heavy Planner is not explicitly configured.
- The planner recognizes a small finite tool vocabulary for draft steps:
  `observability.status`, `memory.status`, `filesystem.search`,
  `browser.open`, `localApp.open`, `plugin.invoke`, and `chat.answer`.
- The planner persists draft plans through the provider-neutral
  `TaskRepository`; Desktop Host does not read or write Task SQLite directly.
- The conversation plan keeps the confirmation step visible and omits fixture
  replay or tool execution while the planner result is waiting for approval.

Automated verification:
- `npx vitest run packages/core/test/runtime.test.ts`: PASS
  (116 tests).
- `npm run typecheck`: PASS.

Windows manual L4 acceptance checklist:
- Open the formal Jarvis-K UI.
- Send: `Plan a multi-step workflow to check memory status and search project files`.
- Confirm the assistant says the Minimal Planner prepared a bounded plan and
  saved it to Task Runtime, with no tool execution attempted.
- Confirm the visible conversation plan includes receiving the request,
  deterministic routing, preparing a bounded plan, planned steps, and waiting
  for user confirmation.
- Open the Tasks view and confirm a `Review Minimal Plan` task exists.
- Confirm the task state is `awaiting_confirmation`.
- Confirm its route source remains `intent-router.deterministic.rules`.
- Confirm the task summary or event text identifies the planner provider as
  `planner.deterministic.rules`.
- Confirm planner-created steps are `pending` and `not_applicable`, not
  `verified`.
- Confirm events include task creation and state change.
- Confirm no browser, desktop app, plugin, filesystem action, or shell command
  was executed by the product runtime.
- Restart the app and confirm the `Review Minimal Plan` task remains visible.
- Send a normal chat prompt such as
  `Answer in one short sentence: what is Jarvis-K?` and confirm it is not
  forced into Minimal Planner.
- Send a direct low-risk command such as `open notepad` and confirm it remains
  on the deterministic rules Task Runtime path rather than Minimal Planner.

Completion level:
- L3 after automated source, type, and unit verification.
- L4 only after the Windows manual checklist above passes.
- Not L5: planner approval execution, cancellation UX, rollback semantics,
  richer step editing, provider-backed planning, and release hardening are not
  complete.
