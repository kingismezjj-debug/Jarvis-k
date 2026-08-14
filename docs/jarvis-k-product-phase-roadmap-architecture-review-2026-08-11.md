# Jarvis-K Product Phase Roadmap For Architecture Review

Recorded: 2026-08-11

Revision:

```text
architecture review feedback incorporated
mainline next task changed from Qwen 10-route diagnostic to Minimal Task Runtime
```

## Purpose

This document summarizes the product plan I understand from
`C:/Users/Administrator/Downloads/Jarvis-k_Codex_Development_Master_Plan.md`,
combined with the current Jarvis-K implementation state, recent evidence, and
the issues we have already hit during Command Router and Qwen development.

It is intended for architecture review. It is not an execution approval and
does not authorize runtime/helper startup, Qwen route reruns, provider calls,
allowlist expansion, release-channel exposure, or production-facing claims.

## Architecture Review Decisions Incorporated

The overall architecture was accepted, but the execution order and several
product rules were changed by architecture review.

Accepted decisions:

```text
1. Qwen 10-route diagnostic/remediation is no longer the mainline next task.
   It is a parallel engineering fix and must not block Task Runtime or the real user loop.

2. Product default routing must be deterministic rules.
   Deterministic fixture is test-only and must not be product fallback/rollback.

3. Confirmation must be risk-tiered.
   Low-risk explicit actions such as Notepad, Calculator, and known apps should not require both UI and native confirmation.

4. Minimal Task Runtime is the current mainline next task.
   It should use the existing SQLite layer for tasks, task_steps, and task_events.
   On restart, running tasks become interrupted and side-effecting steps are not replayed automatically.
   This is ordinary internal development and does not require a new approval request,
   preflight, bounded window, or closeout document.

5. Early real text loop expands to browser.open_url, desktop.open_known_app(vscode),
   filesystem.search, and chat.general.
   URLs require safe schemes and verified/sanitized parameters.

6. Normal Chat Answer must not depend on Qwen stability.
   Qwen diagnostics must not block chat.general.

7. Qwen evaluation moves primarily to an offline Chinese route dataset with at least 300 examples.
   5-10 runtime requests remain only end-to-end smoke coverage, not a serial approval ladder.

8. Plugin SDK Alpha moves to after Windows Executor Alpha.
   It does not wait for all Memory, Planner, or Voice work. Plugin marketplace remains later.

9. Long-term roadmap adds Skin Package/Skin Studio, Workflow/Teach Mode,
   Plugin/Skin/Pet/Workflow Community, and hardware operating modes.

10. Every development item continues to report L1-L5.
    Only L4 may be called user-usable. Only L5 may be called complete.

11. The previous "current recommended next task" is rejected.
    Mainline now prioritizes Task Runtime and real capability expansion.
```

## Executive Summary

Jarvis-K should become a supervised Windows desktop intelligent agent runtime,
not a collection of disconnected demos, approval packets, or fixture-only
preflights.

The intended spine is:

```text
voice/text input
-> input normalizer
-> deterministic rules router
-> optional Qwen fast router behind explicit opt-in gates
-> BrainCommand / Task Runtime
-> safety and permission gates
-> tool / model / plugin execution
-> result validation
-> UI / Memory / TTS feedback
```

The Master Plan's strongest message is that progress must be measured by real
user-operable vertical slices. Contract definitions, fixture tests, preflights,
diagnostic packets, and approval gates are useful only when they support a real
closed loop. They must not be reported as product completion by themselves.

## Completion Levels

All future work should report one of these levels:

```text
L1 Contract Ready: protocol, schema, or interface exists.
L2 Fixture Tested: simulated implementation is tested.
L3 Real Implementation: real model, real service, or real OS path is wired.
L4 User-Facing Integration: user can use it from the official UI or voice path.
L5 Release Ready: security, installer/update, compatibility, and true end-to-end acceptance are complete.
```

Only L4 should be described as user-usable. Only L5 should be described as
complete or release-ready.

## Current Reality

### Mature Or Nearly Mature Paths

```text
Command Router text path: accepted through deterministic fixture evidence.
Command Router voice path: accepted with the same safety gates.
Real local app allowlist: Notepad and Calculator only.
Confirmation model: currently conservative; must be replaced by risk-tiered confirmation.
Blocked examples: VS Code blocked; Browser/URL opening blocked.
TTS: playback issue fixed and manually accepted.
Chat Answer: provider-backed DeepSeek path exists behind secure-store/product controls.
```

The currently accepted evidence path used fixture routing and conservative
confirmation. The corrected product path for the next verified slice is:

```text
React UI text command
-> Command Router
-> deterministic rules route
-> safety gate
-> risk-tiered confirmation
-> real Notepad / Calculator launch
-> sanitized UI result
```

Until the next formal Windows manual review is completed, record the current
Notepad/Calculator capability as L3/L4 pending verification rather than
unconditional L4.

### Qwen State

Qwen has significant developer-alpha evidence:

```text
Qwen adapter, prompt, JSON parsing, slot sanitization: implemented.
Seven-file Qwen3-0.6B artifact set: digest-pinned and verified in bounded windows.
Temporary/retained runtime dependency paths: proven in bounded windows.
Helper and generation-port readiness: passed in bounded windows.
Conversation-surface 3-route and 5-route bounded sessions: passed after remediation.
Persistent opt-in policy/state projection: implemented and hardened.
Developer-alpha release-readiness packet: prepared.
Next-gate decision packet: prepared.
```

However, Qwen is not a default product route source:

```text
Qwen default-on: false.
Qwen persistent product routing outside bounded windows: false.
Qwen direct execution authority: false.
Production-facing Qwen routing claim: false.
Release-channel exposure: false.
Product default/fallback/rollback route source: deterministic rules.
Deterministic fixture: test-only.
```

### Latest Degraded Item

The extended 10-route confidence window degraded:

```text
window: Qwen conversation-surface extended bounded local usage confidence
status: CLOSED_DEGRADED_EXTENDED_BOUNDED_LOCAL_USAGE_CONFIDENCE
approved bound: at most 10 sanitized main-conversation route requests
pre-run helper cleanup: NO_HELPER_PROCESS_OBSERVED
runtime gates reached: retained env/cache, 7 artifact digest-before-load, 1 helper, 1 generation-port probe
failure: latest rendered intent/summary assertion timeout during route sequence
exact completed route count: not inferred because the smoke lacked sanitized per-route progress evidence
same-window rerun: false
post-run helper cleanup: NO_HELPER_PROCESS_OBSERVED
```

A draft diagnostic/remediation request exists, but it is pending approval:

```text
docs/qwen-conversation-surface-extended-bounded-local-usage-diagnostic-remediation-approval-request-2026-08-10.md
```

## Lessons From Recent Work

### 1. Evidence Windows Helped Safety But Created Product Drag

The bounded approvals prevented unsafe behavior: no shell, no arbitrary process,
no unsafe browser/URL opening, no credential exposure, no Memory vector
retrieval, and no direct model execution authority. That was good.

The downside is that we produced many narrow evidence documents before turning
the result into a durable user path. Future phases should prefer one main
progress document and one focused evidence record per real vertical slice.

### 2. Smoke Tests Need Better Observability

The latest 10-route run failed because the smoke harness waited for latest UI
state without emitting sanitized per-route progress. After a timeout, we could
not safely infer which route completed.

Future runtime smokes should record only sanitized progress fields:

```text
routeIndex
expectedIntent
observedIntent
providerSelected
directActionDisabled
summaryClass
routeAccepted
routeCountVisible
```

No raw prompts, model output, helper diagnostics, paths, tokens, stack traces,
browser profile data, or process lists should be retained.

### 3. Do Not Confuse Fixture Or Approval With Product Completion

The Master Plan explicitly says fixture, preflight, and approval gate success
cannot be called product completion. This is especially important for Qwen,
Memory, Planner, Plugin SDK, and release-readiness language.

### 4. The Product Needs A Real Task Runtime

Current work is still heavily conversation/result oriented. The Master Plan
expects real tasks with status, steps, rollback, pause/resume, and result
validation. Architecture review promotes this to the current mainline next
task, ahead of further Qwen runtime-confidence work.

## Architecture Boundaries

### Contracts

Owns only versioned schemas and IPC/data contracts.

Allowed:

```text
BrainCommand schemas
Task schemas
Tool descriptor schemas
Permission result schemas
Runtime status schemas
Plugin manifest schemas
```

Not allowed:

```text
Electron APIs
Windows process launch
provider runtime code
UI behavior
Qwen helper lifecycle
```

### Core

Owns product logic without direct OS authority.

Allowed:

```text
intent routing decisions
Task Runtime state machine
safety gate decisions
tool selection
fallback and rollback policy
result validation
```

Not allowed:

```text
direct Windows process launch
shell/PowerShell execution
credential storage
renderer access
provider-specific secrets
```

### Desktop Host

Owns Electron, IPC, secure storage, native confirmation, supervised child
processes, and bounded Windows execution.

Allowed:

```text
context-isolated IPC
safeStorage-backed credential access
native confirmation dialogs
bounded Notepad/Calculator launch
Qwen helper lifecycle in approved windows
sanitized status projection
```

Not allowed:

```text
renderer-controlled arbitrary execution
shell command execution by product/runtime
arbitrary executable paths
unbounded process/file/browser enumeration
credential exposure
```

### UI

Owns display and user confirmation, not execution.

Allowed:

```text
route decision display
task status display
confirmation buttons
settings toggles
sanitized runtime status
TTS controls
```

Not allowed:

```text
direct filesystem access
direct process launch
direct model/helper access
direct credential access
implicit tool execution
```

### Providers / Adapters

Own concrete model, voice, Memory, or service implementations behind stable
interfaces.

Allowed:

```text
Qwen intent router adapter
OpenAI-compatible chat answer adapter
ASR/TTS adapters
Memory SQLite adapter
future plugin adapters
```

Not allowed:

```text
direct action execution
permission bypass
raw credential diagnostics
unbounded logs
```

## Phase Roadmap

## Short-Term Phases

### Parallel Track A: Extended Qwen Smoke Diagnostic Cleanup

Goal:

Fix the degraded extended Qwen smoke harness without blocking the product
mainline. This is not the next mainline product task.

Scope:

```text
review extended smoke harness
review UI latest-result selectors
review Brain result rendering
add sanitized per-route progress evidence
make assertions route-index aware
focused no-helper tests
no Qwen helper startup
no generation-port invocation
no runtime route request
no rerun
```

Target level:

```text
L2/L3 test infrastructure confidence
parallel engineering only
```

Acceptance:

```text
no-helper tests pass
builds pass
evidence explains whether timeout was harness ambiguity, selector issue, or route calibration issue
next rerun requires fresh bounded approval
```

### Phase 1: Deterministic Rules Router And Risk-Tier Confirmation

Goal:

Move product routing language and implementation from fixture-as-product-route
to deterministic rules as the official default route source, and replace
blanket double confirmation with explicit risk-tiered confirmation policy.
These rules are not a standalone approval lane; the required product behavior
must be delivered inside the Phase 2 vertical slice.

Scope:

```text
deterministic rules route source for product behavior
fixture route source limited to tests and fixture smoke only
risk tiers on tool descriptors
low-risk explicit known app launch: no confirmation by default, visible execution status only
low-risk confirmation appears only when target or parameters are ambiguous
medium-risk side effect: UI confirmation required
high-risk or ambiguous side effect: UI plus stronger confirmation or blocked
blocked/prohibited: no confirmation path
sanitized route/safety/confirmation projection
```

Target level:

```text
L3 policy implementation
L4 only when the official UI uses the policy in a verified real task slice
```

Architecture:

```text
UI -> Desktop IPC -> Core Host -> Core BrainCommand -> Safety Gate -> Desktop Tool Executor -> UI result
```

Acceptance:

```text
product status reports deterministic rules as default route source
fixture is reported as test-only
Notepad and Calculator are low-risk known-app actions
low-risk known-app launch defaults to no confirmation and shows visible execution status/result
ambiguous target or parameters require confirmation before execution
blocked actions remain blocked with no bypass confirmation
all results are sanitized
no arbitrary executable path or arguments
```

### Phase 2: Minimal Task Runtime - Current Mainline Next Task

Goal:

Turn command execution into a real, durable, user-visible task slice instead of
isolated chat messages or backend-only tables.

Scope:

```text
Task schema
TaskStep schema
TaskEvent schema
SQLite persistence using existing local SQLite implementation
tasks table
task_steps table
task_events table
Task states: queued, planning, awaiting_confirmation, running, completed,
failed, cancelled, interrupted, rolling_back, rolled_back
TaskStep verification states: pending, verified, unverified,
verification_failed, not_applicable
official React UI text input: "打开记事本"
deterministic rules product route
fixture source remains test-only
low-risk explicit Notepad action defaults to no confirmation
visible execution status and result
Desktop Host opens real Notepad
window or process existence verification
task timeline in UI
task result linked to BrainCommand result
minimal rollback metadata
restart recovery policy
```

Target level:

```text
L3 for real implementation before formal Windows manual review
L4 only after official React UI vertical slice is manually verified
```

Low-coupling split:

```text
packages/contracts: task schemas
packages/core: task state machine
packages/core: provider-neutral TaskRepository interface only
apps/desktop: IPC and execution event bridge
Core Host: injects SQLite TaskRepository implementation
Desktop Host: executes Windows action and reports sanitized execution/verification result
apps/ui: task timeline display
UI: accesses tasks only through Contracts/IPC
Desktop does not directly read or write Task SQLite
SQLite TaskRepository is composed and injected only by Core Host
```

Acceptance:

```text
official React UI accepts "打开记事本"
deterministic rules route to the Notepad known-app action
fixture is not used as product route or product fallback
low-risk Notepad launch does not require default UI plus native double confirmation
Task is created and persisted
tasks, task_steps, and task_events are persisted in SQLite
Task enters queued/running and then completed after verification
Desktop Host opens real Notepad
window or process existence is verified before completed
execution call success alone is not treated as real operation success
UI shows execution progress and final state
UI shows a task timeline
after app restart, completed task record remains visible
failures show understandable categorized reasons
on restart, running tasks become interrupted
side-effecting steps are not replayed automatically
manual resume or retry must create an explicit new step/event
```

### Phase 3: Early Real Text Capability Expansion And Chat Answer

Goal:

Expand the official text command loop beyond Notepad/Calculator while keeping
deterministic rules as the product default route source and safety gates as the
source of execution authority. This phase also owns the real chat.general
Provider path so Chat Answer is not duplicated in a separate phase and is not
blocked by Qwen stability.

Scope:

```text
browser.open_url with safe scheme and verified/sanitized URL parameters
desktop.open_known_app(vscode) as an explicit known-app target
filesystem.search in observe-only mode
chat.general routing contract and real approved Chat Answer provider path
secure-store provider configuration
OpenAI-compatible provider selection
bounded ChatAnswerResult
UI answer display
safe TTS playback for answered result
fallback when provider is unavailable
Task Runtime records for every real command
risk-tiered confirmation for each tool
sanitized UI status/result projection
```

Target level:

```text
L4 for narrow real text loop when usable from official UI
L2/L3 for any capability that remains simulated or observe-only
```

Acceptance:

```text
open Notepad and Calculator still work as known low-risk app actions
open VS Code works only through desktop.open_known_app(vscode), not arbitrary executable launch
browser.open_url accepts only safe schemes and sanitized/verified parameters
filesystem.search returns bounded sanitized results and does not execute files
chat.general produces answer output without depending on Qwen stability
credentials are never exposed
tool execution remains disabled for chat.general
provider failure produces deterministic fallback status
each action creates Task Runtime records
```

### Parallel Track B: Qwen Offline Route Evaluation And Runtime Smoke

Goal:

Move Qwen confidence from repeated 5-10 request runtime approval ladders to a
larger offline route evaluation set, while retaining small end-to-end runtime
smoke coverage. This is early parallel engineering work and must not block Task
Runtime, Windows Executor, or Chat Answer.

Scope:

```text
at least 300 offline Chinese routing examples
intent coverage for chat.general, browser.open_url, desktop.open_known_app,
filesystem.search, observability/status, model/status, and blocked/prohibited actions
gold expected intent and sanitized slot class
deterministic scoring script
confusion report
calibration fixes
5-10 runtime requests only as end-to-end smoke
no runtime request-count ladder as product gate
```

Target level:

```text
L2 for offline evaluation
L3/L4 only for separately approved runtime product integration
parallel engineering only
```

Acceptance:

```text
offline dataset has at least 300 Chinese examples
scoring reports accuracy by intent and safety class
unsafe or ambiguous routes fail closed
runtime smoke is small and checks only E2E wiring
Qwen remains explicit opt-in until a separate product gate approves broader behavior
```

## Mid-Term Phases

### Phase 4: Windows Executor Alpha

Goal:

Expand from opening apps to a small set of real, validated Windows tasks.

Scope:

```text
open Notepad
open Calculator
write text into Notepad
window focus/minimize/restore
filesystem candidate search in observe mode
result verification
basic rollback where possible
```

Target level:

```text
L4 for at least five fixed Windows tasks
```

Architecture:

```text
Core declares intended tool call
Desktop Host owns Windows execution
UI owns confirmation and result display
Tool descriptor declares risk, side effect, confirmation, rollback
```

Acceptance:

```text
five fixed Windows tasks pass consecutively
medium/high risk operations require confirmation
no arbitrary shell or executable path
verification result is visible in UI
```

### Phase 5: Plugin SDK Alpha

Goal:

Allow third parties to build safe, schema-driven Jarvis capabilities after the
Windows Executor has a small real capability set. This should not wait for all
Memory, Planner, or Voice work. Plugin marketplace/community/payment work stays
later.

Scope:

```text
plugin manifest
plugin registry
plugin install/enable/disable/uninstall for local developer-alpha
permission broker
capability catalog
isolated worker/runtime
MCP adapter through Jarvis permission layer
stock analysis sample plugin
e-commerce product comparison sample plugin
no plugin marketplace
```

Target level:

```text
L3 for SDK runtime boundaries
L4 when a third party can build and run a local plugin from docs alone
```

Acceptance:

```text
plugin cannot access file/network/screen/clipboard/system by default
manifest permissions are enforced
input/output schemas are validated
stock analysis sample plugin works through Jarvis routing and Task Runtime
e-commerce product comparison sample plugin works through Jarvis routing and Task Runtime
plugin execution cannot bypass Command Router or Tool Executor safety gates
```

### Phase 6: Full Voice Closed Loop

Goal:

Move from voice-to-command acceptance into a real voice task loop.

Scope:

```text
PTT input
ASR final transcript
BrainCommand routing
Task Runtime execution
TTS result playback
user interruption
microphone/privacy status
text fallback on ASR failure
```

Target level:

```text
L4 for a narrow voice command such as opening Notepad or Calculator
```

Acceptance:

```text
voice command reaches same safety gates as text
Notepad/Calculator can be launched by voice after required confirmations
TTS reports result
ASR/TTS failures degrade to visible UI states
```

### Phase 7: User-Controlled Memory

Goal:

Make Memory visible, controllable, and useful without expanding vector
retrieval by default.

Scope:

```text
current conversation memory
task history
user preferences
Memory UI
view/edit/delete/disable controls
session-only mode
retention/expiry policy
```

Target level:

```text
L3 to L4 depending on UI completion
```

Acceptance:

```text
user can see what is remembered
user can delete or disable memory
Memory does not silently retain full screen/audio/file contents
vector retrieval remains separately gated
```

### Phase 8: Minimal Planner

Goal:

Support complex tasks through a planner that creates a bounded plan, not direct
side effects.

Scope:

```text
BrainPlan schema
multi-step task draft
user confirmation before execution
planner provider abstraction
step-by-step Task Runtime execution
fallback on low confidence
```

Target level:

```text
L3 initially, L4 after official UI plan execution works
```

Acceptance:

```text
planner outputs only structured steps
executor remains the only actor
high-risk actions require confirmation
planner cannot bypass permission gates
```

## Long-Term Phases

### Phase 9: Skin Package And Skin Studio

Goal:

Let users customize Jarvis visually without granting executable authority to
skins.

Scope:

```text
Theme schema
three built-in themes
real-time switching
local persistence
invalid theme recovery
Skin Package schema
Skin Studio editor
preview and validation
signed/trusted local skin import
no executable skin code by default
```

Target level:

```text
L4
```

Acceptance:

```text
user switches themes from official UI
theme survives restart
invalid theme restores default
skins cannot contain JavaScript, arbitrary HTML, external URLs, iframe, or IPC access
Skin Studio produces validated packages
```

### Phase 10: Desktop Character / Tray

Goal:

Provide a lightweight desktop presence and quick entry point.

Scope:

```text
system tray
small always-on-top window
drag/pin behavior
status states
click to open quick panel
low-resource mode
```

Target level:

```text
L4
```

Acceptance:

```text
desktop character shows state
user can open main panel from it
no continuous screen scanning by default
personality/skin does not change permissions
```

### Phase 11: Workflow And Teach Mode

Goal:

Let users teach Jarvis repeatable workflows while keeping execution observable,
interruptible, and permission-gated.

Scope:

```text
Workflow schema
recorded task template
parameter prompts
dry-run preview
step-level confirmation policy
versioned workflow revisions
manual edit and disable controls
```

Target level:

```text
L3 for schema and controlled replay
L4 when a user can teach and rerun one bounded workflow from the official UI
```

Acceptance:

```text
workflow replay creates Task Runtime records
side-effecting steps are not auto-replayed after restart
user can inspect and edit workflow steps before execution
workflow cannot bypass Tool Executor permissions
```

### Phase 12: Plugin / Skin / Pet / Workflow Community

Goal:

Create a safe sharing layer after local plugin, skin, desktop character, and
workflow primitives exist.

Scope:

```text
community package metadata
review and trust states
permission disclosure
local install preview
disable/uninstall path
abuse reporting and revocation plan
marketplace/payment can remain post-alpha
```

Target level:

```text
L2/L3 for policy and local package validation first
L4 only when users can safely install reviewed packages from the official UI
```

Acceptance:

```text
community packages cannot gain hidden permissions
package metadata is visible before install
revoked or invalid packages fail closed
users can remove packages and related state
```

### Phase 13: Hardware Operating Modes

Goal:

Prepare Jarvis for different device profiles without weakening safety or
privacy defaults.

Scope:

```text
low-spec local mode
GPU-capable local mode
voice-first mode
offline-first mode
external-device capability descriptors
resource budget status
thermal/battery/performance guardrails
```

Target level:

```text
L2/L3 until real hardware profiles are tested
L4 only after user-facing mode selection and validation
```

Acceptance:

```text
mode selection is explicit and reversible
capabilities are reduced safely on constrained hardware
no mode enables extra permissions silently
status projection explains degraded capability without exposing private paths or diagnostics
```

### Phase 14: Release Hardening

Goal:

Move from developer-alpha to real distributable product quality.

Scope:

```text
installer
update strategy
crash/error sanitized logging
permission audit
Windows compatibility matrix
low-spec mode
end-to-end manual acceptance
documentation cleanup
```

Target level:

```text
L5
```

Acceptance:

```text
fresh install works
upgrade path works
safe defaults are preserved
real Windows E2E scenarios pass
release notes make no unsupported claims
```

## Recommended Execution Order

```text
1. Phase 2: implement the official UI "打开记事本" Task Runtime vertical slice.
2. Phase 1: land deterministic rules and risk-tier confirmation as part of that slice.
3. Phase 3: expand the real text loop to browser.open_url, desktop.open_known_app(vscode),
   filesystem.search, and chat.general with real provider-backed Chat Answer.
4. Phase 4: expand Windows Executor to five fixed real tasks.
5. Phase 5: start Plugin SDK Alpha after Windows Executor Alpha, with both stock
   analysis and e-commerce product comparison sample plugins.
6. Phase 6: complete narrow voice-to-task-to-TTS loop.
7. Phase 7-8: Memory and Planner.
8. Phase 9-14: Skin Studio, Desktop Character, Workflow/Teach Mode, Community,
    hardware modes, and Release Hardening.
```

Parallel engineering queue:

```text
Extended Qwen 10-route diagnostic/remediation may proceed only as a non-blocking
source/test hardening track. It must not block Phase 2, Phase 3, or chat.general.
Qwen 300+ Chinese offline route evaluation may proceed early in parallel. It
must not block Task Runtime, Windows Executor, or Chat Answer.
```

## Items To Pause Or Strictly Limit

Until Phase 1 and Phase 2 are stable:

```text
new Memory tester expansions
new embedding approval gates
duplicated preflight/diagnostic/closeout documents
default-on Qwen routing
persistent Qwen routing outside bounded windows
provider planner execution
Memory vector retrieval by default
arbitrary URL opening outside browser.open_url safe-scheme/sanitized-parameter rules
arbitrary local app allowlist expansion beyond explicit known-app policy
shell/PowerShell/cmd execution
macOS/Linux support
plugin marketplace/payment work
community distribution before package trust/revocation policy exists
executable skins
production release claims
```

## Architecture Review Questions

Resolved by architecture review:

```text
Task Runtime comes before more Qwen runtime-confidence work.
Product fallback/rollback is deterministic rules, not fixture.
Browser URL, VS Code known-app, filesystem.search, and chat.general enter the early real text loop.
Qwen confidence moves to 300+ offline Chinese examples plus small E2E smoke.
Plugin SDK Alpha starts after Windows Executor Alpha.
L1-L5 reporting remains mandatory.
```

Closed execution decisions:

```text
1. Phase 2 does not split Tool Executor into a separate package.
2. Risk tiers: Low no confirmation; Medium one UI confirmation;
   High strong confirmation; Critical blocked by default.
3. SQLite migrations use the existing incremental versioned transactional migration pattern.
4. Minimal L4 UI is a task card/timeline visible in the official React UI.
5. Production browser.open_url allows https only.
   Developer mode allows localhost http.
6. filesystem.search is limited to Desktop, Documents, Downloads, and user-selected directories.
7. Stock analysis and e-commerce comparison sample plugins are read-only.
   They must not include trading, ordering, checkout, or payment behavior.
```

## Current Recommended Next Task

Start Phase 2 as ordinary internal development. Do not create a new approval
request, preflight, bounded window, or closeout document for this work.

Implement the official React UI to real Notepad Task Runtime vertical slice:

```text
official React UI input: "打开记事本"
deterministic rules product routing
fixture remains test-only
low-risk Notepad action defaults to no confirmation and shows visible execution status/result
tasks table
task_steps table
task_events table
Task/TaskStep/TaskEvent contracts
Task states: queued, planning, awaiting_confirmation, running, completed,
failed, cancelled, interrupted, rolling_back, rolled_back
TaskStep verification states: pending, verified, unverified,
verification_failed, not_applicable
task state machine
provider-neutral TaskRepository in Core
SQLite TaskRepository injected by Core Host
Desktop Host real Notepad launch
window/process existence verification
completed only after verification
restart recovery: running -> interrupted
no automatic replay of side-effecting steps
UI task timeline/status projection
restart shows persisted completed task record
focused source/unit/build/manual Windows verification
```

Qwen 10-route diagnostic/remediation remains a parallel engineering repair and
does not block Task Runtime, real text capability expansion, or chat.general.

## Phase 2 Completion Report Requirements

The Phase 2 implementation report must include:

```text
L1-L5 level report
build/typecheck/unit test results
SQLite migration test results
Windows real manual acceptance result
whether fixture is fully removed from the formal product path
whether Notepad success is based on real window/process verification
```

Before Windows manual acceptance is complete, Phase 2 must be reported as L3.
Only after the manual Windows verification passes may it be reported as L4.
