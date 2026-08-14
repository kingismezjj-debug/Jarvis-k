# Qwen Product Routing Activation Policy Packet

Recorded: 2026-08-10

## Status

`DRAFT_POLICY_PREPARED_PENDING_IMPLEMENTATION_APPROVAL`

This packet defines the default-off policy required before any future Qwen
product-routing activation implementation. It does not enable Qwen routing.

## Baseline

```text
readiness evidence: passed
product binding: no-runtime status projection only
active product route source: intent-router.deterministic.fixture
Qwen product routing: false
realQwenRuntimeEnabled: false
dependency env retained: false
artifact cache retained: false
```

## Activation Principle

Qwen readiness evidence proves that a bounded runtime can work in an approved
temporary window. It does not grant product routing authority.

Product activation requires a later implementation approval that explicitly
chooses:

```text
dependency strategy: retained prepared runtime or per-window temporary runtime
artifact/cache strategy: retained approved cache or per-window temporary cache
product status strategy: ready, armed, active, fallback, degraded, blocked
manual acceptance strategy: one-window bounded product route test
rollback strategy: immediate return to deterministic fixture
```

## Required Gates

All gates must pass before Qwen can even be considered as a product route
candidate:

```text
explicit product approval: true
default-off preserved: true
artifact digest approved: true
dependency readiness approved: true
dependency retention approved: true
model lifecycle ready: true
runtime generation port ready: true
selection policy ready: true
deterministic fallback preserved: true
Command Router safety gates preserved: true
direct action authority: false
raw diagnostics exposure: false
cleanup/rollback verified: true
manual acceptance window approved: true
release claim approved: false
```

Any false gate means Qwen stays unavailable and deterministic fixture remains
the active product route source.

## Product States

```text
disabled:
  Qwen is visible as status-only. No runtime, cache, helper, or product routing.

ready:
  Prior evidence indicates Qwen can run in a bounded approved window, but no
  retained runtime/cache exists and product routing is still unavailable.

armed:
  A later approval has prepared dependency/artifact/runtime resources, but Qwen
  is not yet selected for product routing. Deterministic fixture remains active.

active:
  A later approval explicitly allows Qwen to be the product router candidate.
  This state is not approved by this policy window.

fallback:
  Deterministic fixture is used because Qwen is unavailable, low confidence,
  invalid, timed out, or blocked by safety gates.

degraded:
  Qwen readiness/runtime failed in a non-actioning way. Product routing remains
  deterministic fixture.

blocked:
  A safety, approval, cleanup, output-validation, or evidence rule failed.
  Product routing remains deterministic fixture.
```

## Selection Rules

Qwen output may only propose sanitized intent candidates and bounded slots.
It never receives direct execution authority.

Required selection behavior:

```text
confidence below threshold -> fallback
invalid JSON/output -> fallback
unsupported intent -> fallback or blocked
unsafe/destructive request -> blocked
generation timeout -> fallback
helper failure -> degraded or fallback
artifact/dependency/cache missing -> fallback
cleanup uncertain -> blocked
Command Router safety gate failure -> blocked
```

## Safety Rules

```text
local app allowlist: Notepad and Calculator only
browser/URL opening: unavailable unless separately approved
shell/PowerShell/cmd/terminal/script: unavailable
arbitrary executable path or command-line arguments: unavailable
provider planner: unavailable
Memory vector retrieval: unavailable
direct action attempted by Qwen: false
raw prompt/output/helper diagnostics in evidence: false
```

## Future Implementation Acceptance

A later implementation window must prove all of the following without changing
defaults:

```text
Qwen status disabled by default: PASS
explicit product control required: PASS
deterministic fixture still available: PASS
Qwen ready/armed/active state visible and sanitized: PASS
low confidence falls back: PASS
invalid output falls back: PASS
unsupported intent blocks or falls back: PASS
unsafe request blocks: PASS
Notepad/Calculator safety gates preserved: PASS
browser/URL remains blocked unless separately approved: PASS
manual disable returns to deterministic fixture: PASS
cleanup/rollback verified: PASS
no raw prompt/output/path/log/token/vector evidence: PASS
```

## Rollback Criteria

Rollback must immediately set product routing to deterministic fixture if:

```text
Qwen helper startup fails
Qwen model load fails
generation-port request fails
output validation fails
confidence gate fails
Command Router safety gate fails
cleanup is uncertain
manual disable is requested
default-off invariant is violated
raw evidence exposure is detected
```

## Sanitized Evidence Requirements

Allowed evidence:

```text
state names
gate booleans
fixed reason codes
test/build status
probe counts
fallback/block/degraded labels
cleanup status
product routing boolean
realQwenRuntimeEnabled boolean
default/UI/release change booleans
```

Disallowed evidence:

```text
raw prompts
generated text
helper stdout/stderr
Python paths
private paths
pip logs
artifact source URLs
signed URLs
credentials/tokens
vectors
stack traces
benchmarks
model internals
```

## Decision

```text
policy decision: prepared
implementation approved: false
Qwen product routing enabled: false
realQwenRuntimeEnabled: false
next approval required: Qwen product-routing activation implementation
```
