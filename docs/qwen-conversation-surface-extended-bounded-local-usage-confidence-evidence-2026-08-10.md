# Qwen Conversation Surface Extended Bounded Local Usage Confidence Evidence

Recorded: 2026-08-10

## Status

`CLOSED_DEGRADED_EXTENDED_BOUNDED_LOCAL_USAGE_CONFIDENCE`

## Scope

One bounded developer-alpha local explicit opt-in usage confidence session
through the main conversation surface, with at most 10 sanitized route requests.

## Approval

```text
approval request: docs/qwen-conversation-surface-extended-bounded-local-usage-confidence-approval-request-2026-08-10.md
Product/Security/Release approval: captured
same-window second runtime attempt: not approved
```

## Source/Test Preparation

```text
developer-alpha extended route-limit gate added: true
route-limit gate: JARVIS_K_QWEN_CONVERSATION_SURFACE_EXTENDED_USAGE
default persistent opt-in policy route limit remains: 3
existing bounded usage route limit remains: 5
extended runtime-control route limit: 10 only behind the new local env gate
direct action default: disabled
Browser/URL default: blocked
VS Code default: blocked
allowlist: Notepad and Calculator only
```

## Verification Before Runtime Attempt

```text
focused tests: PASS
build:contracts: PASS
build:desktop: PASS
build:ui: PASS
pre-run helper cleanup check: NO_HELPER_PROCESS_OBSERVED
```

Focused tests:

```text
npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts packages/inference-adapter-qwen-router/test/provider.test.ts
```

## Runtime Attempt

```text
runtime smoke: tests/qwen-conversation-surface-extended-bounded-local-usage-confidence.mjs
attempt count after route start: 1
retained dependency environment selected: true
retained approved artifact cache selected: true
approved artifact count: 7
digest-before-load result: passed before active session
helper start count: 1
generation-port readiness probe count: 1
route request approved limit: 10
route request completion result: degraded
route request exact completed count: not captured by this smoke harness
Qwen selected for active attempted route before latest-result assertion: true
direct action disabled for active attempted route before latest-result assertion: true
failure class: latest rendered intent/summary assertion timeout
same-window rerun after route request: false
```

## Cleanup

```text
helper shutdown/cleanup after degraded attempt: verified by process cleanup check
post-run helper cleanup check: NO_HELPER_PROCESS_OBSERVED
bounded retention decision: retained dependency env/cache unchanged from prior retained local product-session evidence
```

## Guardrail Results

```text
default-on behavior changed: false
persistent product routing outside bounded window: false
allowlist expansion: false
provider planner invoked: false
Memory write/vector retrieval invoked: false
browser or URL opening by product/runtime: false
VS Code launch by product/runtime: false
telemetry expansion: false
installer/update/packaging/release-channel change: false
production-facing claim: false
raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence captured: false
```

## Degradation

The one approved runtime attempt started the bounded session and reached a
main-conversation route assertion, but the smoke timed out waiting for the
latest rendered intent/summary assertion. The smoke did not emit a sanitized
per-route progress counter before the timeout, so the exact completed route
count is intentionally not inferred.

The window stopped after the degraded route attempt. No second runtime attempt
was made.

## Decision

```text
extended bounded local usage confidence: degraded
reason: latest-result assertion timeout during the one approved runtime route sequence
recommended next gate: fresh bounded diagnostic/remediation window for sanitized per-route progress evidence and latest-result assertion review
```
