# Qwen Product Route Arming Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_ARMED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

This document opened a separate Qwen product-route arming approval window.
Product, Security, and Release approval was provided exactly, and the approved
developer-alpha arming sequence completed with cleanup. The arming state was
contract-visible only inside the bounded window.

No persistent product route, default behavior, UI/IPC runtime control,
installer, packaging, telemetry, release-channel behavior, production-facing
behavior, or allowlist behavior was changed under this request.

## Baseline

No-runtime activation plumbing passed:

```text
docs/qwen-product-routing-activation-implementation-closeout-2026-08-10.md
```

Runtime-retention/manual-acceptance passed and cleaned up:

```text
docs/qwen-runtime-retention-manual-acceptance-closeout-2026-08-10.md
```

Current product invariant:

```text
active product route source: intent-router.deterministic.fixture
Qwen persistent product routing: false
realQwenRuntimeEnabled persistent product status: false
dependency env retained from prior window: false
artifact cache retained from prior window: false
helper running from prior window: false
generation port available from prior window: false
Command Router allowlist: Notepad and Calculator only
browser/URL opening: blocked
VS Code target: blocked
```

## Exact Scope To Approve

Product, Security, and Release approvals were provided exactly for this window.
The approved work included only:

- prepare one developer-alpha product-route arming implementation that can move
  Qwen activation status from `ready` to `armed` only after every runtime,
  artifact, helper, generation-port, fallback, and Command Router safety gate
  is true;
- keep deterministic fixture routing as the default active route source until
  the arming gate passes inside this one window;
- select exactly one runtime path inside the window:
  - one explicit prepared Python executable provided by the user, or
  - one newly created bounded pinned dependency environment using only
    `packages/inference-runtime-transformers-local/runtime/requirements.txt`;
- materialize or reuse only the existing approved seven-file digest-pinned
  Qwen3-0.6B artifact set under one bounded developer-alpha local cache root;
- verify digest-before-load;
- start at most one supervised helper;
- perform at most one bounded deterministic generation-port readiness probe;
- arm Qwen route status for at most one developer-alpha manual acceptance
  session after gates pass;
- run at most one sanitized Command Router product-route acceptance sequence;
- keep all local app actions behind existing Command Router safety gates and
  the existing Notepad/Calculator-only allowlist;
- verify VS Code remains blocked and browser/URL opening remains blocked;
- record sanitized status, gate, fallback, rollback, and test/build evidence
  only;
- shut down helper and either clean up all runtime/cache state or explicitly
  record a bounded retention decision for a later separately approved window.

This request may approve a bounded arming window. It does not authorize
default-on Qwen routing or production product routing.

## Explicit Exclusions

This request does not authorize:

- Qwen active route source outside this one developer-alpha arming window;
- default behavior change;
- default-on route selection;
- unbounded or persistent runtime/cache retention;
- artifact materialization outside the approved seven-file digest-pinned set;
- more than one helper;
- more than one generation-port readiness probe;
- more than one manual route acceptance sequence;
- browser or URL opening;
- VS Code launch;
- allowlist expansion beyond Notepad and Calculator;
- arbitrary executable path or command-line arguments by product/runtime;
- shell, PowerShell, cmd, terminal, or script execution by product/runtime;
- provider planner;
- Memory write or Memory vector retrieval;
- credential access;
- raw prompt, model output, helper diagnostic, Python path, private path,
  package log, artifact source URL, signed URL, token, vector, stack trace,
  benchmark, or model internals in evidence;
- telemetry expansion, installer, packaging, update, release-channel behavior,
  or production-facing claims.

## Required Gates

```text
activation implementation passed: true
manual acceptance closeout passed: true
prior runtime/cache retained: false
fresh runtime path or explicit prepared Python required: true
approved artifact set only: true
digest-before-load required: true
helper supervision required: true
generation-port readiness required: true
Core selection/fallback preserved: true
deterministic fixture fallback preserved: true
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

Expected arming evidence:

```text
arming state transition: ready -> armed -> fallback_or_cleaned
active route outside window: intent-router.deterministic.fixture
runtime path selected: one explicit prepared Python or one bounded temp env
approved artifact count: 7
digest-before-load: passed
helper count: 1 or 0
generation-port readiness probes: 1 or 0
manual route acceptance sequences: 1 or 0
Qwen active outside window: false
Notepad/Calculator allowlist unchanged: true
VS Code blocked: true
browser/URL opening blocked: true
raw evidence captured: false
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
- a second helper, second generation-port probe, or second manual route
  sequence would be needed;
- Qwen bypasses Core selection/fallback or Command Router safety gates;
- VS Code is not blocked;
- browser/URL opening occurs;
- allowlist expands;
- raw prompt/model/helper/path/URL/token/vector/log/benchmark evidence would be
  recorded;
- product defaults, installer, packaging, telemetry, release channel, or
  production-facing behavior would change.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window Qwen product-route arming scope using the passed activation implementation evidence, passed cleaned runtime-retention/manual-acceptance evidence, existing Core selection/fallback contracts, and existing Command Router safety gates to prepare and execute only a developer-alpha bounded arming sequence that can move Qwen activation status from ready to armed after fresh runtime/artifact/helper/generation-port gates pass inside the window; select exactly one prepared Python executable or create one bounded pinned dependency environment, materialize or reuse only the approved seven-file digest-pinned Qwen3-0.6B artifact set in one bounded developer-alpha local cache, verify digest-before-load, start at most one supervised helper, perform at most one bounded deterministic generation-port readiness probe, run at most one sanitized Command Router route acceptance sequence, keep deterministic fixture routing as the default and fallback product route source, keep Qwen inactive outside this one window, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify VS Code remains blocked and browser/URL opening remains blocked, and make no default behavior, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen product-route arming window with one explicit prepared Python or one bounded pinned dependency environment, one bounded approved artifact cache for the window only, digest-before-load, at most one supervised local helper, at most one bounded deterministic generation-port readiness probe, at most one sanitized route acceptance sequence through existing Core fallback and Command Router safety gates, sanitized evidence only, verified helper shutdown and cleanup or explicitly recorded bounded retention decision, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded runtime/cache containment, helper cleanup, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen product-route arming evidence only; no default behavior change, no Qwen product routing outside the one arming window, no persistent dependency environment or model cache beyond the explicitly recorded window decision, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that Qwen routing or arbitrary app control is supported
```

## Current Decision

```text
decision: armed_cleaned
reason: developer-alpha arming status reached armed only after fresh runtime/artifact/helper/generation-port gates passed; helper, dependency, artifact, and cache state was cleaned up.
follow-up: Qwen still is not persistent active product routing. Any product-route enablement beyond this evidence requires a separate bounded approval.
```
