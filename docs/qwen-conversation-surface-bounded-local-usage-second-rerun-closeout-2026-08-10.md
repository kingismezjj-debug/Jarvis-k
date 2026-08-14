# Qwen Conversation Surface Bounded Local Usage Second Rerun Closeout

Recorded: 2026-08-10

## Status

`CLOSED_PASSED_BOUNDED_LOCAL_USAGE_SECOND_RERUN_DEVELOPER_ALPHA_EVIDENCE_ONLY`

## Evidence

```text
docs/qwen-conversation-surface-bounded-local-usage-second-rerun-approval-request-2026-08-10.md
docs/qwen-conversation-surface-bounded-local-usage-second-rerun-evidence-2026-08-10.md
```

## Outcome

The approved one-window second rerun passed. It started one supervised helper,
performed one bounded deterministic generation-port readiness probe, and
completed exactly five sanitized main-conversation route requests through the
conversation surface.

Qwen was selected only inside the bounded local usage session. Direct action
remained disabled for every route. The fifth route confirmed the
`model.status`-specific calibration. Browser/URL opening and VS Code remained
blocked, and the Notepad/Calculator-only allowlist remained unchanged.

## Cleanup

```text
helper shutdown verified: true
deterministic fixture rollback verified: true
post-run helper cleanup check: NO_HELPER_PROCESS_OBSERVED
second attempt after route request: false
```

## Boundary

```text
default-on Qwen routing: false
persistent product routing outside this window: false
route-count extension: false
allowlist expansion: false
provider planner used: false
Memory write/vector retrieval used: false
telemetry changed: false
release behavior changed: false
production-facing claim changed: false
```

## Next Gate

This is developer-alpha evidence only. Any move from bounded local session
evidence toward broader product behavior still requires a fresh bounded approval.
