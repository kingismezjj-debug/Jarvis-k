# Qwen Conversation Surface Product Route Policy Refresh Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_FOR_ONE_WINDOW_PRODUCT_ROUTE_POLICY_REFRESH`

## Baseline Evidence

Use only the completed developer-alpha evidence below as baseline:

```text
docs/qwen-conversation-surface-product-readiness-consolidation-closeout-2026-08-10.md
docs/qwen-conversation-surface-product-readiness-consolidation-packet-2026-08-10.md
docs/qwen-conversation-surface-bounded-local-usage-second-rerun-closeout-2026-08-10.md
docs/qwen-product-routing-activation-policy-closeout-2026-08-10.md
docs/qwen-product-routing-activation-implementation-closeout-2026-08-10.md
docs/qwen-ui-ipc-runtime-control-closeout-2026-08-10.md
```

Current invariants:

```text
Qwen default-on: false
Qwen active product routing outside bounded opt-in windows: false
release/production exposure: false
retained dependency environment: bounded developer-alpha local only
retained approved artifact cache: seven-file digest-pinned Qwen3-0.6B set only
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

Refresh the existing default-off opt-in product-route enablement policy using
the passed conversation-surface product readiness packet.

Allowed only inside this approval window:

```text
source/docs/test review
update or prepare sanitized policy packet content
define refreshed default-off explicit opt-in gates for conversation-surface Qwen route source selection
define required UI/IPC status projection states
define acceptance criteria, rollback criteria, stop criteria, and sanitized evidence requirements
record sanitized evidence only
```

Explicitly out of scope:

```text
implementation changes
Qwen helper startup
generation-port invocation
main-conversation runtime route request
bounded local usage rerun
product route enablement execution
default-on Qwen routing
persistent Qwen product routing
route-count extension
allowlist expansion
browser or URL opening
shell, PowerShell, cmd, terminal, or script execution by product/runtime
arbitrary executable path or command-line arguments by product/runtime
provider planner
Memory write or vector retrieval
credential access or exposure
raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark evidence
raw process list/browser profile/browser history evidence
installer/update/packaging/release-channel changes
telemetry expansion
production-facing claim that Qwen routing or arbitrary app control is supported
```

## Required Approval Text

```text
Product: APPROVE exactly this one-window Qwen conversation-surface product-route policy refresh scope using the passed product-readiness consolidation packet, passed bounded local usage second rerun closeout, existing default-off activation status/gate plumbing, existing UI/IPC runtime control path, existing Core selection/fallback contracts, and existing Command Router safety gates to refresh default-off explicit opt-in product-route enablement policy only; allow source/docs/test review, sanitized policy packet updates, refreshed conversation-surface Qwen route source selection gates, required UI/IPC status projection states, acceptance criteria, rollback criteria, stop criteria, and sanitized evidence requirements; make no implementation change, helper startup, generation-port invocation, bounded local usage rerun, main-conversation runtime route request, product route enablement execution, default-on behavior, persistent product route enablement, route-count extension, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen conversation-surface product-route policy refresh window with source/docs/test review only, sanitized policy evidence only, no Qwen helper startup, no generation-port invocation, no runtime/main-conversation route request, no bounded usage rerun, no product route enablement execution, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond local source/docs/test verification and helper cleanup check, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen conversation-surface product-route policy refresh evidence only; no default-on behavior, no persistent Qwen product routing, no retry or usage acceptance in this window, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```
