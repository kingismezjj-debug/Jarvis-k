# Qwen Conversation Surface Persistent Opt-In Policy/State Implementation Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_IMPLEMENTED_VERIFIED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Exact Product, Security, and Release approval was captured in-thread on
2026-08-10. The approved source/code/test-only window implemented default-off
persistent opt-in policy/state plumbing and sanitized status projection without
helper startup, generation-port invocation, runtime route requests, product
route execution, or release exposure.

## Baseline Evidence

Use only the completed developer-alpha evidence below as baseline:

```text
docs/qwen-conversation-surface-persistent-opt-in-readiness-closeout-2026-08-10.md
docs/qwen-conversation-surface-persistent-opt-in-readiness-evidence-2026-08-10.md
docs/qwen-conversation-surface-product-route-acceptance-enablement-closeout-2026-08-10.md
docs/qwen-conversation-surface-product-route-implementation-prep-closeout-2026-08-10.md
docs/qwen-conversation-surface-product-route-policy-refresh-closeout-2026-08-10.md
docs/qwen-conversation-surface-product-readiness-consolidation-closeout-2026-08-10.md
docs/qwen-ui-ipc-runtime-control-closeout-2026-08-10.md
```

Current invariants:

```text
Qwen default-on: false
Qwen persistent product routing outside bounded windows: false
persistent opt-in readiness / limited product-session passed: true
Qwen selected only inside bounded limited sessions: true
direct action disabled for every route: true
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

Implement or prepare only default-off persistent opt-in policy/state plumbing
and sanitized status projection for the conversation-surface Qwen product-route
path. This is a source/code/test window only.

Allowed only after exact Product, Security, and Release approval:

```text
source/code/test changes only
default-off persistent opt-in policy/state schema or projection
explicit local developer opt-in required state
Qwen route selectable false by default
product route execution disabled by default
active route source remains deterministic fixture by default
fallback/rollback route source remains deterministic fixture
sanitized UI/IPC status projection preparation
rollback/stop state plumbing
source-only and unit tests
local build/test verification
sanitized evidence only
```

Explicitly out of scope:

```text
helper startup
generation-port invocation
main-conversation runtime route request
bounded local usage rerun
limited product-session execution
product route enablement execution
Qwen active product route execution
default-on Qwen routing
persistent Qwen product routing outside bounded windows
route-count extension
allowlist expansion
browser or URL opening
VS Code launch
shell, PowerShell, cmd, terminal, or script execution by product/runtime
arbitrary executable path or command-line arguments by product/runtime
provider planner
Memory write or vector retrieval
credential access or exposure
new dependency environment creation
new artifact materialization or cache promotion
raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark evidence
raw process list/browser profile/browser history evidence
installer/update/packaging/release-channel changes
telemetry expansion
production-facing claim that Qwen routing or arbitrary app control is supported
```

## Required Gates

```text
persistent opt-in readiness / limited product-session passed: true
product-route acceptance / enablement passed: true
implementation preparation passed: true
policy refresh passed: true
readiness consolidation passed: true
UI/IPC runtime control prepared: true
explicit local developer opt-in required: true
Core fallback preserved: true
deterministic fixture rollback preserved: true
Command Router safety gates preserved: true
direct action disabled by default: true
Notepad/Calculator allowlist unchanged: true
browser/URL opening blocked by default: true
VS Code blocked by default: true
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

Expected evidence:

```text
implementation completed: true
persistent opt-in policy/state projection prepared: true
explicit opt-in required: true
explicit opt-in enabled by default: false
Qwen route selectable by default: false
product route execution enabled by default: false
default route source: intent-router.deterministic.fixture
fallback/rollback route source: intent-router.deterministic.fixture
direct action enabled by default: false
browser/URL opening enabled by default: false
VS Code blocked by default: true
allowlist targets unchanged: notepad, calculator
helper started: false
generation-port invoked: false
runtime route request sent: false
default behavior changed: false
release behavior changed: false
```

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  this exact scope;
- implementation would enable Qwen by default or outside a bounded opt-in
  session;
- implementation would add helper startup, generation-port invocation, runtime
  route request, or product-route execution;
- direct action would become enabled by default;
- browser/URL opening or VS Code launch would become allowed;
- allowlist expands beyond Notepad and Calculator;
- raw prompt/model/helper/path/URL/token/vector/log/benchmark/browser/process
  evidence would be recorded;
- installer, packaging, telemetry, release channel, or production-facing
  behavior would change.

## Required Approval Text

```text
Product: APPROVE exactly this one-window Qwen conversation-surface persistent opt-in policy/state implementation scope using the passed persistent opt-in readiness / limited product-session evidence, passed product-route acceptance / enablement evidence, passed product-route implementation preparation evidence, passed product-route policy refresh packet, passed product-readiness consolidation packet, existing UI/IPC runtime control path, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to implement or prepare only default-off persistent opt-in policy/state plumbing and sanitized status projection for the conversation-surface Qwen product-route path; allow source/code/test changes only, explicit local developer opt-in required state, Qwen route selectable false by default, product route execution disabled by default, deterministic fixture as default/fallback/rollback route source, sanitized UI/IPC status projection preparation, rollback/stop state plumbing, source-only and unit tests, local build/test verification, and sanitized evidence only; make no helper startup, generation-port invocation, main-conversation runtime route request, bounded local usage rerun, limited product-session execution, product route enablement execution, Qwen active product route execution, default-on behavior, persistent product routing outside bounded windows, route-count extension, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen conversation-surface persistent opt-in policy/state implementation window with source/code/test changes only, sanitized status/gate/rollback evidence only, no Qwen helper startup, no generation-port invocation, no runtime/main-conversation route request, no bounded usage rerun, no limited product-session execution, no product route enablement execution, no Qwen active product route execution, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond local source/build/test verification and helper cleanup check, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen conversation-surface persistent opt-in policy/state implementation evidence only; no default-on behavior, no persistent Qwen product routing outside bounded windows, no retry or usage acceptance in this window, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Current Decision

```text
decision: implemented_verified_source_code_test_only
reason: exact Product, Security, and Release approvals were provided; default-off persistent opt-in policy/state projection was added under the conversation-surface product-route projection, desktop status returns the fail-closed state, UI exposes sanitized read-only status fields, focused tests and builds passed, and final helper cleanup check reported NO_HELPER_PROCESS_OBSERVED.
follow-up: this remains developer-alpha implementation evidence only. Open a separate bounded approval before any helper startup, generation-port invocation, main-conversation runtime route request, product-route execution, default-on behavior, persistent product routing outside bounded windows, route-count extension, allowlist expansion, telemetry/release exposure, or production-facing Qwen routing claim.
```
