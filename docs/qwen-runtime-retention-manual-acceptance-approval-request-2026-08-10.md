# Qwen Runtime Retention Manual Acceptance Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_ACCEPTED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

This document opened a separate Qwen runtime-retention/manual-acceptance
approval window. Product, Security, and Release approval was provided exactly,
and the approved window completed with cleanup. Runtime/cache/helper access was
limited to the bounded developer-alpha manual acceptance sequence.

No default behavior, product status, UI/IPC product control, installer,
packaging, telemetry, release-channel behavior, production-facing behavior, or
allowlist behavior was changed under this request.

## Baseline

Passed readiness evidence:

```text
docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-closeout-2026-08-10.md
```

No-runtime product activation plumbing:

```text
docs/qwen-product-routing-activation-implementation-closeout-2026-08-10.md
```

Current product invariant:

```text
active product route source: intent-router.deterministic.fixture
Qwen product routing: false
realQwenRuntimeEnabled: false
dependency env retained: false
artifact cache retained: false
helper startup in product: false
generation port invoked by product: false
Command Router allowlist: Notepad and Calculator only
browser/URL opening: blocked
VS Code target: blocked
```

## Exact Scope To Approve

Product, Security, and Release approvals were provided exactly for this window.
The approved work included only:

- select exactly one runtime path:
  - one explicit prepared Python executable provided by the user, or
  - one newly created bounded local dependency environment using only pinned
    packages from
    `packages/inference-runtime-transformers-local/runtime/requirements.txt`;
- materialize or reuse only the existing approved seven-file digest-pinned
  Qwen3-0.6B artifact set under one bounded developer-alpha local cache root;
- verify digest-before-load for every approved artifact;
- retain only that bounded dependency environment and approved artifact cache
  for the duration of this manual-acceptance window unless closeout separately
  records cleanup;
- start at most one supervised local helper;
- perform at most one bounded deterministic generation-port readiness probe;
- arm Qwen product routing only inside this developer-alpha manual acceptance
  window, only after the retained runtime/cache readiness gates pass;
- run at most one sanitized manual route acceptance sequence through existing
  Command Router safety gates;
- keep Notepad and Calculator as the only local app launch targets, and only
  after explicit UI confirmation plus native confirmation;
- verify VS Code remains blocked;
- verify browser/URL opening remains blocked;
- record sanitized evidence only;
- shut down helper and record either verified cleanup or explicitly approved
  retained runtime/cache status for the next bounded window.

## Explicit Exclusions

This request does not authorize:

- default behavior change;
- Qwen product routing outside this one developer-alpha manual acceptance
  window;
- persistent runtime/cache retention beyond this window unless separately
  approved and recorded;
- arbitrary model/artifact materialization;
- more than one helper;
- more than one generation-port readiness probe;
- raw prompt, model output, helper diagnostic, Python path, private path,
  package log, artifact source URL, signed URL, token, vector, stack trace,
  benchmark, or model internals in evidence;
- credential access;
- provider planner;
- Memory write or Memory vector retrieval;
- browser or URL opening;
- shell, PowerShell, cmd, terminal, script execution by product/runtime;
- arbitrary executable path or command-line arguments by product/runtime;
- filesystem, clipboard, or process enumeration beyond bounded runtime/cache
  containment, helper cleanup, and accepted launch verification;
- allowlist expansion beyond Notepad and Calculator;
- installer, packaging, update, release-channel behavior, telemetry expansion,
  or production-facing claims.

## Required Gates

```text
prepared activation policy reviewed: true
activation implementation passed: true
readiness evidence passed: true
digest-before-load required: true
unique bounded runtime/cache root: true
helper supervision required: true
helper shutdown required: true
Command Router safety gates preserved: true
Notepad/Calculator allowlist unchanged: true
VS Code blocked: required
browser/URL opening blocked: required
sanitized evidence only: true
default behavior changed: false
release behavior changed: false
```

## Required Verification After Approval

Candidate verification:

```powershell
npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts apps/core-host/test/qwen-fast-router-generation-port.test.ts apps/core-host/test/qwen-fast-router-wiring.test.ts packages/core/test/runtime.test.ts packages/inference-adapter-qwen-router/test/provider.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-client.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-process-transport.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-protocol.test.ts
npm.cmd run build:contracts
npm.cmd run build:inference-runtime-transformers-local
npm.cmd run build:inference-adapter-qwen-router
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
node tests/desktop-command-router-fixture-suite.mjs
```

Expected manual acceptance evidence:

```text
runtime path selected: one explicit prepared Python or one bounded local env
approved artifacts: seven digest-pinned files only
digest-before-load: passed
helper count: 1 or 0
generation-port readiness probes: 1 or 0
manual route sequences: 1 or 0
Qwen product routing outside window: false
Notepad/Calculator allowlist unchanged: true
VS Code blocked: true
browser/URL opening blocked: true
raw evidence captured: false
helper shutdown: passed or not_started
cleanup/retention decision: recorded
```

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  this exact scope;
- runtime setup requires unpinned dependencies, global Python mutation, private
  index credentials, or broad filesystem search;
- artifact digest verification fails;
- helper cannot be supervised or shut down;
- more than one helper or more than one generation-port readiness probe would
  be needed;
- raw prompt/model/helper/path/URL/token/vector/log/benchmark evidence would be
  recorded;
- Qwen route bypasses Command Router safety gates;
- VS Code is not blocked;
- browser/URL opening occurs;
- allowlist expands;
- product defaults, installer, packaging, telemetry, release channel, or
  production-facing behavior would change.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window Qwen runtime-retention/manual-acceptance scope using the passed Qwen readiness evidence, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to select exactly one prepared Python executable or create one bounded pinned dependency environment, retain only the approved seven-file digest-pinned Qwen3-0.6B artifact set in one bounded developer-alpha local cache for the window, verify digest-before-load, start at most one supervised helper, perform at most one bounded deterministic generation-port readiness probe, and run at most one sanitized manual route acceptance sequence; keep deterministic fixture routing as the default product route source, keep Qwen unavailable outside this manual acceptance window, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify VS Code remains blocked and browser/URL opening remains blocked, and make no default behavior, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen runtime-retention/manual-acceptance window with one explicit prepared Python or one bounded pinned dependency environment, one bounded retained approved artifact cache for the window only, digest-before-load, at most one supervised local helper, at most one bounded deterministic generation-port readiness probe, at most one sanitized manual route acceptance sequence through existing Command Router safety gates, sanitized evidence only, verified helper shutdown and cleanup or explicitly recorded bounded retention decision, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded runtime/cache containment, helper cleanup, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen runtime-retention/manual-acceptance evidence only; no default behavior change, no Qwen product routing outside the one manual acceptance window, no persistent dependency environment or model cache beyond the explicitly recorded window decision, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that Qwen routing or arbitrary app control is supported
```

## Current Decision

```text
decision: accepted_cleaned
reason: one bounded temporary dependency environment, approved seven-artifact materialization, digest-before-load, one helper, one generation-port readiness probe, and one sanitized route sample passed; cleanup removed retained dependency/artifact/cache state.
follow-up: Qwen still is not active outside this one-window acceptance. Any product-route enablement beyond evidence requires a separate bounded approval.
```
