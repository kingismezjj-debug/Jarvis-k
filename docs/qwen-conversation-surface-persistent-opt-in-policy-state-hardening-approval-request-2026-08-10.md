# Qwen Conversation Surface Persistent Opt-In Policy/State Source Audit / Hardening Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_HARDENED_VERIFIED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Exact Product, Security, and Release approval was captured in-thread on
2026-08-10. The approved source/docs/test-only window completed audit and
narrow fail-closed test hardening without helper startup, generation-port
invocation, runtime route requests, product-route execution, or release
exposure.

## Baseline Evidence

Use only the completed developer-alpha evidence below as baseline:

```text
docs/qwen-conversation-surface-persistent-opt-in-policy-state-implementation-closeout-2026-08-10.md
docs/qwen-conversation-surface-persistent-opt-in-policy-state-implementation-evidence-2026-08-10.md
docs/qwen-conversation-surface-persistent-opt-in-readiness-closeout-2026-08-10.md
docs/qwen-conversation-surface-product-route-acceptance-enablement-closeout-2026-08-10.md
docs/qwen-conversation-surface-product-route-implementation-prep-closeout-2026-08-10.md
docs/qwen-conversation-surface-product-route-policy-refresh-closeout-2026-08-10.md
```

Current invariants:

```text
Qwen default-on: false
Qwen persistent product routing outside bounded windows: false
persistent opt-in policy/state projection implemented: true
Qwen route selectable by default: false
product route execution enabled by default: false
helper startup allowed by policy/state: false
generation-port invocation allowed by policy/state: false
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

Perform source/test audit and narrowly scoped hardening, if needed, for the
default-off persistent opt-in policy/state projection. This window is source,
docs, and focused-test only.

Allowed only after exact Product, Security, and Release approval:

```text
source/docs/test review
narrowly scoped code/test hardening only if the audit finds a fail-closed projection gap
verify persistentOptIn default-off schema invariants
verify desktop status projection remains fail-closed
verify UI status projection remains sanitized and read-only
verify deterministic fixture remains default/fallback/rollback
verify direct action, browser/URL opening, VS Code, helper startup, generation-port, and product route execution remain disabled by policy/state
focused source/unit tests
local build/test verification
sanitized evidence only
helper cleanup check only
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

## Required Approval Text

```text
Product: APPROVE exactly this one-window Qwen conversation-surface persistent opt-in policy/state source audit / hardening scope using the passed persistent opt-in policy/state implementation evidence, passed persistent opt-in readiness / limited product-session evidence, passed product-route acceptance / enablement evidence, existing UI/IPC runtime control path, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to perform source/docs/test review and narrowly scoped hardening only if needed for the default-off persistent opt-in policy/state projection; allow source/docs/test review, fail-closed policy/state projection hardening, source-only and unit tests, local build/test verification, helper cleanup check, and sanitized evidence only; make no helper startup, generation-port invocation, main-conversation runtime route request, bounded local usage rerun, limited product-session execution, product route enablement execution, Qwen active product route execution, default-on behavior, persistent product routing outside bounded windows, route-count extension, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen conversation-surface persistent opt-in policy/state source audit / hardening window with source/docs/test review and narrowly scoped fail-closed code/test hardening only if needed, sanitized status/gate/rollback evidence only, no Qwen helper startup, no generation-port invocation, no runtime/main-conversation route request, no bounded usage rerun, no limited product-session execution, no product route enablement execution, no Qwen active product route execution, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond local source/docs/build/test verification and helper cleanup check, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen conversation-surface persistent opt-in policy/state source audit / hardening evidence only; no default-on behavior, no persistent Qwen product routing outside bounded windows, no retry or usage acceptance in this window, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Stop Conditions

Stop immediately and record blocked/degraded evidence if review or hardening
would require helper startup, generation-port invocation, runtime route request,
product-route execution, default-on behavior, allowlist expansion, raw evidence,
or telemetry/release/production-facing behavior change.

## Current Decision

```text
decision: hardened_verified_source_docs_test_only
reason: exact Product, Security, and Release approvals were provided; source/test audit found the policy/state projection fail-closed, then added narrow negative schema tests for unsafe persistentOptIn variants; focused tests and builds passed; final helper cleanup check reported NO_HELPER_PROCESS_OBSERVED.
follow-up: this remains developer-alpha hardening evidence only. Open a separate bounded approval before any helper startup, generation-port invocation, runtime route request, product-route execution, default-on behavior, persistent product routing outside bounded windows, route-count extension, allowlist expansion, telemetry/release exposure, or production-facing Qwen routing claim.
```
