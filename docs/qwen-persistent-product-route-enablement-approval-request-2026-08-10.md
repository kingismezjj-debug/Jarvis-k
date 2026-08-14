# Qwen Persistent Product Route Enablement Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_PREPARED_VERIFIED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

This document opened a separate persistent Qwen product-route enablement
approval window. Product, Security, and Release approval was provided exactly,
and the approved preparation completed with cleanup. The implemented path is a
developer-alpha default-off explicit opt-in status/gate projection; normal
desktop startup still does not enable Qwen as the persistent active route
source.

No default-on behavior, allowlist behavior, installer, packaging, telemetry,
release-channel behavior, or production-facing claim was changed under this
request.

## Baseline

Product-route arming passed and cleaned:

```text
docs/qwen-product-route-arming-closeout-2026-08-10.md
```

Runtime-retention/manual-acceptance passed and cleaned:

```text
docs/qwen-runtime-retention-manual-acceptance-closeout-2026-08-10.md
```

Current product invariant:

```text
persistent active product route source: intent-router.deterministic.fixture
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

- implement a developer-alpha persistent product-route enablement path that is
  default-off and explicit opt-in;
- select exactly one runtime path:
  - one explicit prepared Python executable provided by the user, or
  - one newly created bounded pinned dependency environment using only
    `packages/inference-runtime-transformers-local/runtime/requirements.txt`;
- materialize or reuse only the existing approved seven-file digest-pinned
  Qwen3-0.6B artifact set under one bounded developer-alpha local cache root;
- verify digest-before-load on startup or before every helper load;
- start at most one supervised helper for the enabled route;
- expose only sanitized persistent status/gate/rollback projection;
- allow Qwen to become the active product route source only when runtime,
  artifact, helper, generation-port, fallback, and Command Router safety gates
  pass;
- preserve deterministic fixture as fallback and immediate rollback route
  source;
- keep all local app actions behind existing Command Router safety gates,
  explicit UI confirmation, native confirmation, and the existing
  Notepad/Calculator-only allowlist;
- verify VS Code remains blocked and browser/URL opening remains blocked;
- add focused tests, builds, fixture suite, and sanitized evidence;
- record a bounded retention decision and rollback/cleanup plan.

## Explicit Exclusions

This request does not authorize:

- default-on Qwen routing;
- production-facing Qwen routing claim;
- allowlist expansion beyond Notepad and Calculator;
- browser or URL opening;
- VS Code launch;
- arbitrary executable path or command-line arguments by product/runtime;
- shell, PowerShell, cmd, terminal, or script execution by product/runtime;
- provider planner;
- Memory write or Memory vector retrieval;
- credential access;
- arbitrary model/artifact materialization;
- raw prompt, model output, helper diagnostic, Python path, private path,
  package log, artifact source URL, signed URL, token, vector, stack trace,
  benchmark, or model internals in evidence;
- telemetry expansion, installer, packaging, update, or release-channel
  behavior.

## Required Gates

```text
arming closeout passed: true
runtime-retention/manual-acceptance closeout passed: true
fresh or explicitly retained runtime path required: true
approved artifact set only: true
digest-before-load required: true
helper supervision required: true
generation-port readiness required: true
Core selection/fallback preserved: true
deterministic fixture rollback preserved: true
Command Router safety gates preserved: true
Notepad/Calculator allowlist unchanged: true
VS Code blocked: required
browser/URL opening blocked: required
sanitized evidence only: true
default-off preserved: true
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

Expected enablement evidence:

```text
default route before enablement: intent-router.deterministic.fixture
active route after explicit enablement: intent-router.qwen3-0.6b or blocked
fallback/rollback route source: intent-router.deterministic.fixture
runtime path selected: one explicit prepared Python or one bounded env
approved artifact count: 7
digest-before-load: passed
helper count: 1 or 0
generation-port readiness: passed or not_started
Qwen route enabled by default: false
Qwen route enabled persistently after explicit opt-in: true or blocked
Notepad/Calculator allowlist unchanged: true
VS Code blocked: true
browser/URL opening blocked: true
raw evidence captured: false
retention/cleanup decision: recorded
rollback decision: recorded
```

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  this exact scope;
- route enablement would be default-on;
- runtime setup requires unpinned dependencies, global Python mutation, private
  index credentials, or broad filesystem search;
- artifact digest verification fails;
- helper cannot be supervised or shut down;
- Qwen bypasses Core fallback or Command Router safety gates;
- deterministic fixture fallback cannot be preserved;
- VS Code is not blocked;
- browser/URL opening occurs;
- allowlist expands;
- raw prompt/model/helper/path/URL/token/vector/log/benchmark evidence would be
  recorded;
- installer, packaging, telemetry, release channel, or production-facing
  behavior would change.

## Approval Lines To Provide

```text
Product: APPROVE exactly this persistent Qwen product-route enablement preparation scope using the passed product-route arming evidence, passed cleaned runtime-retention/manual-acceptance evidence, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to implement only a developer-alpha default-off explicit opt-in persistent route enablement path; select exactly one prepared Python executable or create one bounded pinned dependency environment, materialize or reuse only the approved seven-file digest-pinned Qwen3-0.6B artifact set in one bounded developer-alpha local cache, verify digest-before-load, start at most one supervised helper, allow Qwen to become the active product route source only after all runtime/artifact/helper/generation-port/fallback/safety gates pass, preserve deterministic fixture as fallback and rollback route source, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify VS Code remains blocked and browser/URL opening remains blocked, and make no default-on behavior, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed persistent Qwen product-route enablement preparation window with one explicit prepared Python or one bounded pinned dependency environment, one bounded approved artifact cache only, digest-before-load, at most one supervised local helper, sanitized status/gate/rollback evidence only, verified helper shutdown/rollback/cleanup paths or explicitly recorded bounded retention decision, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded runtime/cache containment, helper cleanup, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha persistent Qwen product-route enablement preparation evidence only; no default-on behavior, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Current Decision

```text
decision: prepared_verified_cleaned
reason: default-off explicit opt-in persistent enablement projection was added and verified; bounded runtime/cache/helper acceptance passed and cleanup removed temporary state.
follow-up: Qwen still is not enabled by default. Any release exposure or production-facing Qwen routing claim requires a separate bounded approval.
```
