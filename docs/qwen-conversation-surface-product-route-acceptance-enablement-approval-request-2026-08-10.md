# Qwen Conversation Surface Product Route Acceptance / Enablement Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_EXECUTED_ROLLED_BACK_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Exact Product, Security, and Release approval was captured in-thread on
2026-08-10. The approved one-window sequence executed once, completed bounded
acceptance / enablement, stopped the helper, verified rollback/stop state, and
recorded sanitized evidence only.

## Baseline Evidence

Use only the completed developer-alpha evidence below as baseline:

```text
docs/qwen-conversation-surface-product-route-implementation-prep-closeout-2026-08-10.md
docs/qwen-conversation-surface-product-route-implementation-prep-evidence-2026-08-10.md
docs/qwen-conversation-surface-product-route-policy-refresh-closeout-2026-08-10.md
docs/qwen-conversation-surface-product-readiness-consolidation-closeout-2026-08-10.md
docs/qwen-conversation-surface-bounded-local-usage-second-rerun-closeout-2026-08-10.md
docs/qwen-ui-ipc-runtime-control-closeout-2026-08-10.md
docs/qwen-retained-local-product-session-closeout-2026-08-10.md
```

Current invariants:

```text
Qwen default-on: false
Qwen persistent product routing outside bounded windows: false
conversation-surface product-route projection prepared: true
Qwen route selectable by default: false
product route execution enabled by default: false
deterministic fixture route source: default/fallback/rollback
Notepad/Calculator allowlist: unchanged
browser/URL opening: blocked
VS Code: blocked
provider planner: false
Memory vector retrieval: false
telemetry expansion: false
post-run helper cleanup: NO_HELPER_PROCESS_OBSERVED
```

## Requested One-Window Scope

Execute exactly one bounded developer-alpha local explicit opt-in
conversation-surface product-route acceptance / enablement sequence using the
prepared default-off product-route plumbing.

Allowed only after exact Product, Security, and Release approval:

```text
use exactly the retained bounded dependency environment and retained approved seven-file digest-pinned Qwen3-0.6B artifact cache
verify digest-before-load
start at most one supervised helper through the existing UI/IPC runtime control path
perform at most one bounded deterministic generation-port readiness probe
enable Qwen route source selection only inside this one acceptance / enablement window after all gates pass
send at most three sanitized main-conversation route requests through Core fallback and Command Router safety gates
verify Qwen selected only inside the bounded session
verify direct action remains disabled for every route
verify deterministic fixture remains default/fallback/rollback route source
verify browser/URL opening remains blocked
verify VS Code remains blocked
verify Notepad and Calculator remain the only local-app allowlist targets after explicit UI plus native confirmation
stop helper and verify rollback/stop state
record sanitized status/gate/route/rollback/session evidence only
```

Explicitly out of scope:

```text
default-on Qwen routing
persistent Qwen product routing outside this one window
route-count extension beyond three requests
allowlist expansion
browser or URL opening
VS Code launch
shell, PowerShell, cmd, terminal, or script execution by product/runtime
arbitrary executable path or command-line arguments by product/runtime
provider planner
Memory write or vector retrieval
credential access or exposure
new dependency environment creation
new artifact materialization outside the retained approved cache
raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark evidence
raw process list/browser profile/browser history evidence
installer/update/packaging/release-channel changes
telemetry expansion
production-facing claim that Qwen routing or arbitrary app control is supported
```

## Required Gates

```text
implementation preparation passed: true
policy refresh passed: true
readiness consolidation passed: true
bounded local usage second rerun passed: true
retained local product-session evidence passed: true
UI/IPC runtime control prepared: true
explicit local developer opt-in required: true
retained approved artifact cache only: true
retained bounded dependency environment only: true
digest-before-load required: true
helper supervision required: true
generation-port readiness required: true
Core fallback preserved: true
deterministic fixture rollback preserved: true
Command Router safety gates preserved: true
direct action disabled for every route: required
Notepad/Calculator allowlist unchanged: true
browser/URL opening blocked: required
VS Code blocked: required
sanitized evidence only: true
default-on behavior: false
release behavior changed: false
```

## Required Verification After Approval

Candidate verification:

```powershell
npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts
npm.cmd run build:contracts
npm.cmd run build:ui
npm.cmd run build:desktop
```

Expected acceptance / enablement evidence:

```text
acceptance / enablement sequence count: 1
Qwen route enabled by default: false
explicit local developer opt-in: true
Qwen selected only inside bounded session: true
route request count: 1 to 3
direct action disabled for every route: true
active route source during bounded session after gates: intent-router.qwen3-0.6b
default/fallback/rollback route source: intent-router.deterministic.fixture
retained dependency environment used: true
retained artifact cache used: true
approved artifact count: 7
digest-before-load: passed
helper count: 1 or 0
generation-port readiness probe count: 1 or 0
browser/URL opening blocked: true
VS Code blocked: true
Notepad/Calculator allowlist unchanged: true
helper stopped: true
rollback/stop state verified: true
raw evidence captured: false
default behavior changed: false
release behavior changed: false
```

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  this exact scope;
- retained dependency environment or retained approved artifact cache is not
  available and a separate retention/provisioning approval is not provided;
- Qwen would be enabled by default or outside this window;
- route request count would exceed three;
- direct action would be enabled for any route;
- artifact digest verification fails;
- helper cannot be supervised or stopped;
- generation-port readiness probe exceeds the bounded one-probe limit;
- Qwen bypasses Core fallback or Command Router safety gates;
- browser/URL opening occurs;
- VS Code is not blocked;
- allowlist expands beyond Notepad and Calculator;
- raw prompt/model/helper/path/URL/token/vector/log/benchmark/browser/process
  evidence would be recorded;
- installer, packaging, telemetry, release channel, or production-facing
  behavior would change.

## Required Approval Text

```text
Product: APPROVE exactly this one-window Qwen conversation-surface product-route acceptance / enablement execution scope using the passed product-route implementation preparation evidence, passed product-route policy refresh packet, passed product-readiness consolidation packet, passed bounded local usage second rerun evidence, retained local product-session evidence, existing UI/IPC runtime control path, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to execute one bounded developer-alpha local explicit opt-in conversation-surface product-route acceptance / enablement sequence; use exactly the retained bounded dependency environment and retained approved seven-file digest-pinned Qwen3-0.6B artifact cache, verify digest-before-load, start at most one supervised helper through the existing UI/IPC runtime control path, perform at most one bounded deterministic generation-port readiness probe, allow Qwen route source selection only inside this one acceptance / enablement window after all runtime/artifact/helper/generation-port/fallback/safety gates pass, preserve deterministic fixture as default/fallback/rollback route source, send at most three sanitized main-conversation route requests, verify Qwen selected only inside the bounded session, verify direct action remains disabled for every route, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify browser/URL opening remains blocked and VS Code remains blocked, stop helper and verify rollback/stop state, and make no default-on behavior, persistent product route enablement outside this window, route-count extension, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen conversation-surface product-route acceptance / enablement execution window with developer-alpha local explicit opt-in only, retained bounded dependency environment only, retained approved artifact cache only, digest-before-load, at most one supervised local helper, at most one bounded deterministic generation-port readiness probe, at most three sanitized main-conversation route requests through existing Core fallback and Command Router safety gates, sanitized session/status/gate/route/rollback evidence only, verified helper shutdown and rollback/stop state, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded retained-session containment, helper lifecycle verification, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen conversation-surface product-route acceptance / enablement execution evidence only; no default-on behavior, no persistent Qwen product routing outside the one bounded acceptance / enablement window, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Current Decision

```text
decision: executed_rolled_back_cleaned
reason: exact Product, Security, and Release approvals were provided; one bounded developer-alpha local explicit opt-in conversation-surface product-route acceptance / enablement sequence completed with three sanitized main-conversation routes, Qwen selected only inside the bounded session, direct action disabled, Browser/URL and VS Code blocked, helper shutdown verified, rollback/stop verified, and no helper process observed after cleanup.
follow-up: this remains developer-alpha evidence only. Open a separate bounded approval before any default-on behavior, persistent product routing outside a bounded window, route-count extension, allowlist expansion, release exposure, or production-facing Qwen routing claim.
```
