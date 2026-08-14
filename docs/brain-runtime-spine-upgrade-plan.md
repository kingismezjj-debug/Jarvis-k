# Brain Runtime Spine Upgrade Plan

Jarvis-K should move from isolated capability phases into one product spine:

```text
voice/text input
-> session message
-> fast router
-> BrainCommand
-> safety gate
-> tool registry / executor
-> UI event stream
-> result, Memory, and TTS
```

## Stage 1: BrainCommand Spine

Goal: make text input and final voice transcripts enter the same `agent.runBrainCommand` path.

Scope:
- Keep existing deterministic rule router as the default fallback.
- Add a default-off fast-router slot backed by the existing `IntentRoutingProvider` contract.
- Keep Browser/Open App execution behind the existing allowlist adapter.
- Do not download, materialize, or run a real model in this stage.

Acceptance:
- Text input can route to `chat.answer`, `browser.open`, `localApp.open`, `memory.search`, `observability.status`, or `model.status`.
- Final voice transcripts call the same BrainCommand path.
- If the fast router is unavailable or low-confidence, rules continue to work.

## Stage 2: Qwen3-0.6B Fast Router

Goal: use Qwen3-0.6B as the local foreground brain.

Scope:
- Implement a local `intent_router` adapter for Qwen3-0.6B.
- Keep the adapter runtime-neutral: it accepts an injected generation port and parses only sanitized JSON.
- Require approved artifact digest, model lifecycle readiness, and explicit env/UI opt-in.
- Prompt the model to output only structured intent candidates and bounded slots.
- Do not download, materialize, cache, or execute a real Qwen artifact in this stage.

Acceptance:
- Simple commands route locally with low latency.
- Low-confidence or invalid JSON never executes directly.
- All actions still pass schema validation and allowlist checks.
- Core Host lists Qwen3-0.6B as an unavailable diagnostic provider until runtime/cache acceptance approves a concrete generation port.

Implementation checkpoint:
- `@jarvis-k/inference-adapter-qwen-router` owns prompt construction, output parsing, slot sanitization, and provider reports.
- `JARVIS_K_ENABLE_QWEN_FAST_ROUTER=1` is not sufficient by itself; artifact digest approval, model lifecycle readiness, and a runtime generation port must also be present.

## Stage 3: Heavy Planner Fallback

Goal: send complex tasks to an API-backed planner such as GLM or ChatGPT.

Scope:
- Add a provider-neutral planner port.
- Planner outputs a bounded BrainPlan, not direct side effects.
- API keys remain in secure storage and are never exposed in diagnostics.

Acceptance:
- Complex or fuzzy requests escalate from Qwen to the planner.
- The planner can choose registered tools, but the executor remains the only actor.
- Medium/high-risk actions require confirmation.

## Stage 4: Tool Registry Product Loop

Goal: make Jarvis-K feel like one assistant instead of separate panels.

Initial tools:
- `browser.open`
- `localApp.open`
- `chat.answer`
- `memory.search`
- `memory.status`
- `model.status`
- `observability.status`
- `system.settings`

Acceptance:
- The UI shows received input, route decision, selected tool, safety result, execution result, and fallback reason.
- Tool additions require descriptors and schemas, not new hardcoded UI branches.

Status:
- Accepted for the Command Router text path with deterministic fixture routing.
- Accepted for a narrow real local-app allowlist: Notepad and Calculator only,
  after fixture dry-run, explicit UI confirmation, and native confirmation.
- Accepted for the bounded Voice Command Router manual path after retry, using
  the same deterministic fixture routing and confirmation gates.
- VS Code remains blocked; browser/URL opening remains disabled.
- Closeout: `docs/command-router-real-local-app-allowlist-closeout-2026-08-09.md`.
- Voice closeout: `docs/command-router-voice-manual-acceptance-closeout-2026-08-09.md`.

## Stage 5: Product Alpha Hardening

Goal: make the assistant reliable enough for daily manual testing.

Scope:
- Add rollback/retry affordances for blocked or degraded actions.
- Persist session history and useful Memory context.
- Add minimal TTS result playback after successful tasks.
- Keep dangerous tools default-off.

Acceptance:
- Manual testing can cover voice command, text command, local routing, cloud fallback, Memory recall, and blocked unsafe commands in one session.

Current next checkpoint:
- Qwen fast router product binding implementation is complete as default-off
  no-runtime status/settings/gate projection.
- Use
  `docs/qwen-fast-router-product-binding-implementation-approval-request-2026-08-09.md`,
  `docs/qwen-fast-router-product-binding-implementation-evidence-2026-08-09.md`,
  and
  `docs/qwen-fast-router-product-binding-implementation-closeout-2026-08-09.md`.
- Keep deterministic fallback and the accepted Command Router safety gates.
- Qwen remains unavailable for product routing.
- Require a fresh approval before artifact digest approval, runtime/cache/helper
  materialization, generation port invocation, or product routing activation.
- Do not give Qwen direct execution authority.
- Do not expand the app allowlist or enable planner execution in this
  checkpoint.

Next possible checkpoint:
- Qwen artifact/runtime readiness window is closed as blocked during runtime
  dependency preflight.
- Use
  `docs/qwen-artifact-runtime-readiness-approval-request-2026-08-10.md`,
  `docs/qwen-artifact-runtime-readiness-evidence-2026-08-10.md`, and
  `docs/qwen-artifact-runtime-readiness-closeout-2026-08-10.md`.
- No artifact materialization, helper startup, generation-port invocation, or
  routing probe occurred.
- A separate bounded runtime dependency preparation/readiness approval window
  is closed as blocked:
  `docs/qwen-runtime-dependency-readiness-approval-request-2026-08-10.md`,
  `docs/qwen-runtime-dependency-readiness-evidence-2026-08-10.md`, and
  `docs/qwen-runtime-dependency-readiness-closeout-2026-08-10.md`.
- Current Python is present but missing `torch`, `transformers`, and
  `safetensors`; temporary venv/pip preparation was blocked by the execution
  environment before setup.
- Provide or approve a compatible Python runtime path, or run from an
  environment that permits temporary venv creation and pinned pip install,
  before another Qwen artifact/runtime readiness attempt.
- A compatible Python runtime provisioning/readiness approval window passed
  using a temporary venv, then cleanup removed the venv:
  `docs/qwen-compatible-python-runtime-provisioning-approval-request-2026-08-10.md`,
  `docs/qwen-compatible-python-runtime-provisioning-evidence-2026-08-10.md`,
  and
  `docs/qwen-compatible-python-runtime-provisioning-closeout-2026-08-10.md`.
- Dependency feasibility is proven but no Python executable was retained.
- Before another Qwen artifact/runtime readiness attempt, open a fresh bounded
  approval that recreates the temporary dependency setup, uses a provided
  prepared Python executable, or explicitly allows retaining a temporary venv.
- A fresh Qwen artifact/runtime readiness rerun passed as developer-alpha
  evidence only:
  `docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-approval-request-2026-08-10.md`,
  `docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-evidence-2026-08-10.md`,
  and
  `docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-closeout-2026-08-10.md`.
- The rerun used a temporary dependency setup, fixed seven-artifact digest
  verification, one helper, and one generation-port readiness probe.
- Cleanup passed and no dependency env or artifact cache was retained.
- Qwen still is not approved as an active product route source.
- A Qwen product-routing activation policy window is complete as policy-only
  evidence:
  `docs/qwen-product-routing-activation-policy-approval-request-2026-08-10.md`,
  `docs/qwen-product-routing-activation-policy-evidence-2026-08-10.md`,
  `docs/qwen-product-routing-activation-policy-packet-2026-08-10.md`, and
  `docs/qwen-product-routing-activation-policy-closeout-2026-08-10.md`.
- Qwen product-routing activation implementation is complete as no-runtime
  status/gate/state/rollback plumbing only:
  `docs/qwen-product-routing-activation-implementation-approval-request-2026-08-10.md`
  `docs/qwen-product-routing-activation-implementation-evidence-2026-08-10.md`,
  and
  `docs/qwen-product-routing-activation-implementation-closeout-2026-08-10.md`.
- This implementation remains no-runtime/no-routing; Qwen is not active for
  product routing.
- Qwen runtime-retention/manual-acceptance passed and cleaned up:
  `docs/qwen-runtime-retention-manual-acceptance-approval-request-2026-08-10.md`
  `docs/qwen-runtime-retention-manual-acceptance-evidence-2026-08-10.md`,
  and
  `docs/qwen-runtime-retention-manual-acceptance-closeout-2026-08-10.md`.
- Qwen still is not persistent active product routing; no dependency env or
  artifact cache was retained.
- Qwen product-route arming passed and cleaned up as developer-alpha evidence:
  `docs/qwen-product-route-arming-approval-request-2026-08-10.md`
  `docs/qwen-product-route-arming-evidence-2026-08-10.md`, and
  `docs/qwen-product-route-arming-closeout-2026-08-10.md`.
- Qwen still is not persistent active product routing; no dependency env or
  artifact cache was retained.
- Persistent Qwen product-route enablement preparation passed and cleaned up as
  developer-alpha evidence:
  `docs/qwen-persistent-product-route-enablement-approval-request-2026-08-10.md`
  `docs/qwen-persistent-product-route-enablement-evidence-2026-08-10.md`, and
  `docs/qwen-persistent-product-route-enablement-closeout-2026-08-10.md`.
- Qwen is still not default-on and has no release/production-facing exposure.
- Local developer-alpha Qwen usage was approved, executed, then stopped
  degraded with cleanup:
  `docs/qwen-local-developer-alpha-usage-approval-request-2026-08-10.md`
  `docs/qwen-local-developer-alpha-usage-evidence-2026-08-10.md`, and
  `docs/qwen-local-developer-alpha-usage-closeout-2026-08-10.md`.
- The bounded Qwen usage session passed with three sanitized route requests, but
  Command Router browser-block verification detected a browser process and
  triggered the stop condition.
- Cleanup passed. Qwen is still not default-on, not persistent active product
  routing, and has no release/production-facing exposure.
- A separate Command Router browser-block remediation verification window passed
  as verification-only evidence:
  `docs/command-router-browser-block-remediation-verification-approval-request-2026-08-10.md`
  `docs/command-router-browser-block-remediation-verification-evidence-2026-08-10.md`,
  and
  `docs/command-router-browser-block-remediation-verification-closeout-2026-08-10.md`.
- No code remediation was needed. Browser-only rerun passed with no new browser
  process IDs, and the full Command Router fixture suite passed all four smoke
  paths.
- A local developer-alpha Qwen usage rerun passed and cleaned up:
  `docs/qwen-local-developer-alpha-usage-rerun-approval-request-2026-08-10.md`
  `docs/qwen-local-developer-alpha-usage-rerun-evidence-2026-08-10.md`, and
  `docs/qwen-local-developer-alpha-usage-rerun-closeout-2026-08-10.md`.
- The rerun used one temporary pinned dependency environment, the approved
  seven-artifact set, digest-before-load, one helper, one generation-port path,
  three sanitized route requests, browser-only verification, and the full
  Command Router fixture suite.
- Cleanup passed. Qwen is still not default-on, not persistent active product
  routing, and has no release/production-facing exposure.
- A persistent Qwen product-route enablement execution window passed, rolled
  back, and cleaned up as developer-alpha evidence:
  `docs/qwen-persistent-product-route-enablement-execution-approval-request-2026-08-10.md`
  `docs/qwen-persistent-product-route-enablement-execution-evidence-2026-08-10.md`,
  and
  `docs/qwen-persistent-product-route-enablement-execution-closeout-2026-08-10.md`.
- The execution verified active route projection after explicit opt-in and all
  gates, then rollback to deterministic fixture. Cleanup passed with no
  retained dependency env, artifact cache, or helper.
- Qwen is still not default-on and has no release/production-facing exposure.
- A retained local Qwen product-session window passed as developer-alpha
  evidence:
  `docs/qwen-retained-local-product-session-approval-request-2026-08-10.md`
  `docs/qwen-retained-local-product-session-evidence-2026-08-10.md`, and
  `docs/qwen-retained-local-product-session-closeout-2026-08-10.md`.
- One bounded dependency environment and approved seven-file artifact cache were
  retained for local developer-alpha use. Helper was shut down after
  verification.
- Qwen is still not default-on and has no release/production-facing exposure.
- A Qwen UI/IPC runtime control window passed as prepared developer-alpha
  evidence only:
  `docs/qwen-ui-ipc-runtime-control-approval-request-2026-08-10.md`
  `docs/qwen-ui-ipc-runtime-control-evidence-2026-08-10.md`, and
  `docs/qwen-ui-ipc-runtime-control-closeout-2026-08-10.md`.
- The UI/IPC control surface exposes sanitized retained-session, helper
  lifecycle, route, start, stop, and rollback state only. Start enters a
  `start_prepared` state and does not start a helper or invoke generation.
- Qwen is still not default-on and has no release/production-facing exposure.
- A Qwen UI/IPC retained-helper route acceptance window passed as
  developer-alpha evidence only:
  `docs/qwen-ui-ipc-retained-helper-route-acceptance-approval-request-2026-08-10.md`
  `docs/qwen-ui-ipc-retained-helper-route-acceptance-evidence-2026-08-10.md`,
  and
  `docs/qwen-ui-ipc-retained-helper-route-acceptance-closeout-2026-08-10.md`.
- The window used the retained dependency env and approved seven-file artifact
  cache, verified digest-before-load, started one supervised helper, performed
  one generation-port readiness probe, ran three sanitized route requests
  through Core fallback and Command Router safety gates, then verified stop and
  rollback state.
- Qwen is still not default-on, not persistent product routing, and has no
  release/production-facing exposure.
- The Qwen persistent local opt-in product route session window passed:
  `docs/qwen-persistent-local-opt-in-product-route-session-approval-request-2026-08-10.md`
  `docs/qwen-persistent-local-opt-in-product-route-session-evidence-2026-08-10.md`,
  and
  `docs/qwen-persistent-local-opt-in-product-route-session-closeout-2026-08-10.md`.
- It used the retained dependency env and approved artifact cache, verified
  digest-before-load, started one supervised helper, performed one
  generation-port readiness probe, ran three sanitized route requests, then
  verified stop/rollback to deterministic fixture.
- Browser/URL opening and VS Code remained blocked. Qwen is still not
  default-on, not persistent product routing outside the bounded session, and
  has no release/production-facing exposure.
- The Qwen conversation-surface local opt-in route acceptance implementation
  passed on rerun but closed degraded:
  `docs/qwen-conversation-surface-local-opt-in-route-acceptance-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-local-opt-in-route-acceptance-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-local-opt-in-route-acceptance-closeout-2026-08-10.md`.
- Degradation: the first Electron attempt consumed three main-conversation
  Qwen routes before a strict-mode test assertion failed while reading the route
  count, so the window is not clean single-sequence acceptance evidence.
- Passing rerun verified Qwen selected for three main-conversation routes,
  direct action stayed disabled, browser/URL and VS Code remained blocked, and
  stop/rollback returned to deterministic fixture.
- Open a fresh bounded clean-rerun approval before advancing conversation-
  surface Qwen routing.
- The Qwen conversation-surface clean rerun window passed:
  `docs/qwen-conversation-surface-clean-rerun-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-clean-rerun-evidence-2026-08-10.md`, and
  `docs/qwen-conversation-surface-clean-rerun-closeout-2026-08-10.md`.
- It executed one clean single sequence with one helper, one generation-port
  readiness probe, exactly three sanitized main-conversation Qwen routes,
  direct action disabled, browser/URL and VS Code blocked, verified
  stop/rollback, and no observed helper process after cleanup.
- Qwen is still not default-on, not persistent product routing outside bounded
  local sessions, and has no release/production-facing exposure.
- The Qwen conversation-surface bounded local usage window closed degraded:
  `docs/qwen-conversation-surface-bounded-local-usage-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-bounded-local-usage-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-bounded-local-usage-closeout-2026-08-10.md`.
- It started one helper and one readiness probe, then attempted four sanitized
  main-conversation routes before the fourth route timed out waiting for the
  expected `observability.status` intent. No fifth route or rerun was attempted.
- Post-run cleanup observed no helper process. Qwen is still not default-on,
  not persistent product routing outside bounded local sessions, and has no
  release/production-facing exposure.
- The bounded diagnostic/remediation approval window passed as developer-alpha
  evidence only:
  `docs/qwen-conversation-surface-bounded-local-usage-diagnostic-remediation-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-bounded-local-usage-diagnostic-remediation-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-bounded-local-usage-diagnostic-remediation-closeout-2026-08-10.md`.
- The remediation classified the prior fourth-route timeout as a smoke-harness
  latest-result wait ambiguity, added a sanitized Brain summary selector, and
  anchored bounded usage route assertions to both expected intent and expected
  summary. No helper, generation-port, runtime route request, or bounded usage
  retry was executed in this window.
- Open a fresh bounded local usage rerun approval before sending main
  conversation route requests again.
- The fresh bounded local usage rerun closed degraded:
  `docs/qwen-conversation-surface-bounded-local-usage-rerun-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-bounded-local-usage-rerun-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-bounded-local-usage-rerun-closeout-2026-08-10.md`.
- It started one helper, performed one readiness probe, and sent exactly five
  sanitized main-conversation route requests. The first four latest-result
  assertions completed; the fifth request expected `model.status` but timed out
  before that expected result was confirmed. No second rerun was attempted.
- Post-run cleanup observed no helper process. Open a fresh bounded
  diagnostic/remediation approval before changing route calibration, route
  assertions, or rerunning bounded local usage again.
- The fifth-route `model.status` diagnostic/remediation window passed as
  developer-alpha evidence only:
  `docs/qwen-conversation-surface-model-status-diagnostic-remediation-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-model-status-diagnostic-remediation-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-model-status-diagnostic-remediation-closeout-2026-08-10.md`.
- The remediation classified the fifth-route timeout as a Qwen deterministic
  calibration specificity issue and added a `model.status`-specific calibration
  before generic `observability.status`. No helper, generation-port, runtime
  route request, or bounded usage retry was executed in this window.
- Open a fresh bounded local usage rerun approval before sending main
  conversation route requests again.
- The fresh bounded local usage second rerun passed as developer-alpha evidence
  only:
  `docs/qwen-conversation-surface-bounded-local-usage-second-rerun-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-bounded-local-usage-second-rerun-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-bounded-local-usage-second-rerun-closeout-2026-08-10.md`.
- It started one helper, performed one readiness probe, completed exactly five
  sanitized main-conversation route requests, confirmed the fifth-route
  `model.status` calibration, verified direct action disabled, verified
  Browser/URL and VS Code blocked, stopped/rolled back, and post-run cleanup
  observed no helper process. No second attempt was made.
- The Qwen conversation-surface product readiness consolidation window passed as
  developer-alpha evidence only:
  `docs/qwen-conversation-surface-product-readiness-consolidation-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-product-readiness-consolidation-evidence-2026-08-10.md`,
  `docs/qwen-conversation-surface-product-readiness-consolidation-packet-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-product-readiness-consolidation-closeout-2026-08-10.md`.
- It prepared a sanitized readiness packet and next-gate policy only. No helper,
  generation-port, runtime route request, bounded usage rerun, or product route
  enablement execution was performed. Qwen still is not default-on or
  persistent product routing and has no release/production-facing exposure.
- Recommended next gate: open a fresh bounded approval for a default-off opt-in
  product-route enablement policy refresh, or choose an extended bounded local
  usage confidence window if more route-count evidence is needed.
- The Qwen conversation-surface product-route policy refresh passed as
  developer-alpha evidence only:
  `docs/qwen-conversation-surface-product-route-policy-refresh-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-product-route-policy-refresh-evidence-2026-08-10.md`,
  `docs/qwen-conversation-surface-product-route-policy-refresh-packet-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-product-route-policy-refresh-closeout-2026-08-10.md`.
- It refreshed default-off explicit opt-in policy gates, UI/IPC status
  projection states, acceptance criteria, rollback criteria, stop criteria, and
  future sanitized evidence requirements. No implementation change, helper,
  generation-port, runtime route request, bounded usage rerun, or product route
  enablement execution was performed.
- The Qwen conversation-surface product-route implementation preparation
  window passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-product-route-implementation-prep-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-product-route-implementation-prep-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-product-route-implementation-prep-closeout-2026-08-10.md`.
- It prepared default-off conversation-surface product-route status/gate/
  rollback plumbing and sanitized UI/status projection only. Qwen remains not
  route-selectable, product route execution remains disabled, deterministic
  fixture remains active/fallback/rollback, and Notepad/Calculator remain the
  only local-app allowlist targets.
- Verification passed: focused source/unit tests, `build:contracts`,
  `build:desktop`, `build:ui`, and final helper cleanup check
  `NO_HELPER_PROCESS_OBSERVED`.
- The bounded Qwen conversation-surface product-route acceptance / enablement
  execution window passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-product-route-acceptance-enablement-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-product-route-acceptance-enablement-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-product-route-acceptance-enablement-closeout-2026-08-10.md`.
- It executed exactly one bounded developer-alpha local explicit opt-in
  acceptance / enablement sequence: retained dependency env/cache, 7 approved
  artifacts with digest-before-load, one supervised helper, one generation-port
  readiness probe, three sanitized main-conversation routes, Qwen selected only
  inside the bounded session, direct action disabled for every route,
  Browser/URL and VS Code blocked, stop/rollback verified, and final
  `NO_HELPER_PROCESS_OBSERVED`.
- Next gate: open a fresh bounded approval before any default-on behavior,
  persistent product routing outside a bounded window, broader route count,
  allowlist expansion, telemetry/release exposure, or production-facing Qwen
  routing claim.
- The Qwen conversation-surface persistent opt-in readiness / limited
  product-session window passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-persistent-opt-in-readiness-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-persistent-opt-in-readiness-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-persistent-opt-in-readiness-closeout-2026-08-10.md`.
- It executed exactly one bounded developer-alpha local explicit opt-in limited
  product-session sequence: retained dependency env/cache, 7 approved artifacts
  with digest-before-load, one supervised helper, one generation-port readiness
  probe, three sanitized main-conversation routes, Qwen selected only inside the
  bounded limited session, direct action disabled for every route, Browser/URL
  and VS Code blocked, stop/rollback verified, and final
  `NO_HELPER_PROCESS_OBSERVED`.
- Next gate: open a fresh bounded approval before any default-on behavior,
  persistent product routing outside a bounded limited session, broader route
  count, allowlist expansion, telemetry/release exposure, or production-facing
  Qwen routing claim.
- The Qwen conversation-surface persistent opt-in policy/state implementation
  window passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-implementation-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-implementation-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-implementation-closeout-2026-08-10.md`.
- It added default-off persistent opt-in policy/state projection under the
  conversation-surface product-route status, plus sanitized read-only UI status
  fields. Qwen route selectable remains false by default, product route
  execution remains disabled by default, helper startup and generation-port are
  not allowed by policy/state, deterministic fixture remains
  default/fallback/rollback, and final helper cleanup check was
  `NO_HELPER_PROCESS_OBSERVED`.
- Next gate: open a fresh bounded approval before any helper startup,
  generation-port invocation, runtime route request, product-route execution,
  default-on behavior, persistent product routing outside bounded windows,
  broader route count, allowlist expansion, telemetry/release exposure, or
  production-facing Qwen routing claim.
- The Qwen conversation-surface persistent opt-in policy/state source audit /
  hardening window passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-hardening-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-hardening-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-persistent-opt-in-policy-state-hardening-closeout-2026-08-10.md`.
- It verified the default-off persistent opt-in policy/state projection and
  added negative schema tests rejecting unsafe `localDeveloperOptInEnabled`,
  `helperStartupAllowedByPolicyState`, and widened `routeRequestLimit` values.
  No helper, generation-port, runtime route request, product-route execution, or
  release behavior was introduced, and final helper cleanup check was
  `NO_HELPER_PROCESS_OBSERVED`.
- Next gate: open a fresh bounded approval before any helper startup,
  generation-port invocation, runtime route request, product-route execution,
  default-on behavior, persistent product routing outside bounded windows,
  broader route count, allowlist expansion, telemetry/release exposure, or
  production-facing Qwen routing claim.
- The Qwen conversation-surface product-route developer-alpha release-readiness
  packet window passed as developer-alpha evidence only:
  `docs/qwen-conversation-surface-product-route-developer-alpha-release-readiness-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-product-route-developer-alpha-release-readiness-evidence-2026-08-10.md`,
  `docs/qwen-conversation-surface-product-route-developer-alpha-release-readiness-packet-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-product-route-developer-alpha-release-readiness-closeout-2026-08-10.md`.
- It prepared a sanitized developer-alpha packet with readiness state,
  accepted/degraded/blocked evidence summary, default-off/persistent-opt-in gate
  summary, future acceptance criteria, rollback criteria, stop criteria, and
  required sanitized evidence fields. It made no code changes, started no
  helper, invoked no generation-port, sent no route request, and final helper
  cleanup check was `NO_HELPER_PROCESS_OBSERVED`.
- Next gate: open a fresh bounded approval before any release-facing
  discussion, helper startup, generation-port invocation, runtime route request,
  product-route execution, route-count expansion, allowlist expansion,
  default-on behavior, persistent routing outside bounded windows,
  telemetry/release exposure, or production-facing Qwen routing claim.
- The Qwen conversation-surface developer-alpha next-gate decision /
  release-readiness review window passed as docs-only evidence:
  `docs/qwen-conversation-surface-next-gate-decision-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-next-gate-decision-evidence-2026-08-10.md`,
  `docs/qwen-conversation-surface-next-gate-decision-packet-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-next-gate-decision-closeout-2026-08-10.md`.
- It selected the recommended next gate as a fresh bounded
  "Qwen conversation-surface extended bounded local usage confidence window"
  with at most 10 sanitized main-conversation route requests, still
  developer-alpha local explicit opt-in only.
- This docs-only decision did not change code, start a helper, invoke a
  generation-port, send a route request, execute product routing, expand route
  count in runtime, expand allowlists, enable default-on behavior, enable
  persistent routing outside bounded windows, expose a release channel, or make
  any production-facing claim. Final helper cleanup check was
  `NO_HELPER_PROCESS_OBSERVED`.
- Next gate: open a fresh bounded Product/Security/Release approval before the
  extended bounded local usage confidence window, any UI/IPC hardening, any
  internal developer-alpha release note, any helper startup, generation-port
  invocation, runtime route request, product-route execution, route-count
  expansion, allowlist expansion, default-on behavior, persistent routing
  outside bounded windows, telemetry/release exposure, or production-facing Qwen
  routing claim.
- The Qwen conversation-surface extended bounded local usage confidence window
  closed degraded after one approved runtime attempt:
  `docs/qwen-conversation-surface-extended-bounded-local-usage-confidence-approval-request-2026-08-10.md`
  `docs/qwen-conversation-surface-extended-bounded-local-usage-confidence-evidence-2026-08-10.md`,
  and
  `docs/qwen-conversation-surface-extended-bounded-local-usage-confidence-closeout-2026-08-10.md`.
- The window added a developer-alpha-only extended route-limit gate
  `JARVIS_K_QWEN_CONVERSATION_SURFACE_EXTENDED_USAGE`; default persistent
  opt-in policy route limit remains 3 and existing bounded usage remains 5.
- Focused tests and `build:contracts`, `build:desktop`, and `build:ui` passed.
  Pre-run cleanup was `NO_HELPER_PROCESS_OBSERVED`.
- The runtime attempt selected the retained dependency env/cache, verified the
  approved seven artifacts digest-before-load, started one helper, performed one
  generation-port readiness probe, then degraded on a latest rendered
  intent/summary assertion timeout during the main-conversation route sequence.
  The smoke did not emit a sanitized per-route progress counter, so exact
  completed route count is not inferred.
- No same-window rerun was attempted. Post-run helper cleanup was
  `NO_HELPER_PROCESS_OBSERVED`; default-on behavior, persistent routing outside
  the bounded window, allowlist expansion, provider planner, Memory vector
  retrieval, telemetry/release exposure, and production-facing claim remained
  false.
- Next gate: open a fresh bounded diagnostic/remediation approval before
  changing the extended smoke harness, adding sanitized per-route progress
  evidence, reviewing latest-result selectors/assertions, or rerunning extended
  bounded local usage.
- A draft diagnostic/remediation approval request is open:
  `docs/qwen-conversation-surface-extended-bounded-local-usage-diagnostic-remediation-approval-request-2026-08-10.md`.
- Status is `DRAFT_PENDING_PRODUCT_SECURITY_RELEASE_APPROVAL`; it does not
  approve helper startup, generation-port invocation, runtime route requests,
  extended bounded usage rerun, product-route execution, default-on behavior,
  allowlist expansion, telemetry/release exposure, or production-facing claims.
- Next gate: provide exact Product/Security/Release approval text before
  performing source/test diagnostics or narrowly scoped smoke-harness
  remediation.
- Keep any product routing activation separate from runtime dependency
  preparation.
