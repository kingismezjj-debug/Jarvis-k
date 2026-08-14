# Qwen Local Developer Alpha Usage Rerun Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_PASSED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

This document opened a separate local developer-alpha Qwen usage rerun approval
window after the first local usage window stopped degraded and a separate
Command Router browser-block verification window passed.

Product, Security, and Release approval was provided exactly. The approved rerun
completed with one bounded local usage session, three sanitized route requests,
browser-only fixture verification, full Command Router fixture-suite
verification, and cleanup.

No code, product route default, product status, UI/IPC behavior, installer,
packaging, telemetry, or release-channel behavior changed under this request.
The temporary dependency environment and temporary runtime/artifact/helper state
used for the rerun were cleaned up.

## Baseline

The prior local developer-alpha Qwen usage window stopped degraded:

```text
docs/qwen-local-developer-alpha-usage-closeout-2026-08-10.md
```

The follow-up browser-block verification passed:

```text
docs/command-router-browser-block-remediation-verification-closeout-2026-08-10.md
```

Persistent enablement preparation passed and cleaned:

```text
docs/qwen-persistent-product-route-enablement-closeout-2026-08-10.md
```

Product-route arming passed and cleaned:

```text
docs/qwen-product-route-arming-closeout-2026-08-10.md
```

Current product invariant:

```text
Qwen route enabled by default: false
release/production-facing exposure: false
persistent active product route source: intent-router.deterministic.fixture
dependency env retained from prior window: false
artifact cache retained from prior window: false
helper running from prior window: false
Command Router allowlist: Notepad and Calculator only
browser/URL opening: blocked
VS Code target: blocked
```

## Exact Scope To Approve

If Product, Security, and Release approvals are provided exactly for this
window, the approved work may include only:

- run one local developer-alpha Qwen usage rerun session on this machine;
- require explicit local developer opt-in before Qwen can be selected as route
  source for that session;
- select exactly one runtime path:
  - one explicit prepared Python executable provided by the user, or
  - one newly created bounded pinned dependency environment using only
    `packages/inference-runtime-transformers-local/runtime/requirements.txt`;
- materialize or reuse only the existing approved seven-file digest-pinned
  Qwen3-0.6B artifact set under one bounded developer-alpha local cache root;
- verify digest-before-load;
- start at most one supervised helper;
- run at most three sanitized local developer-alpha route requests through
  existing Core fallback and Command Router safety gates;
- keep deterministic fixture as default and rollback route source;
- allow local app launch only for Notepad and Calculator, only after explicit UI
  confirmation plus native confirmation;
- verify browser/URL opening remains blocked;
- verify VS Code remains blocked;
- record sanitized evidence only;
- shut down helper and record cleanup or a separately approved bounded
  retention decision.

## Explicit Exclusions

This request does not authorize:

- default-on Qwen routing;
- persistent active Qwen product route outside this one rerun window;
- production-facing Qwen routing claim;
- installer, packaging, update, release-channel, or telemetry behavior change;
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
  benchmark, raw process list, browser profile/history content, or model
  internals in evidence.

## Required Gates

```text
prior local usage degraded closeout exists: true
browser-block remediation verification passed: true
persistent enablement preparation passed: true
product-route arming passed: true
explicit local developer opt-in required: true
approved artifact set only: true
digest-before-load required: true
helper supervision required: true
Core fallback preserved: true
deterministic fixture rollback preserved: true
Command Router safety gates preserved: true
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
npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts apps/core-host/test/qwen-fast-router-generation-port.test.ts apps/core-host/test/qwen-fast-router-wiring.test.ts packages/core/test/runtime.test.ts packages/inference-adapter-qwen-router/test/provider.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-client.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-process-transport.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-protocol.test.ts
npm.cmd run build:contracts
npm.cmd run build:inference-runtime-transformers-local
npm.cmd run build:inference-adapter-qwen-router
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
node tests/desktop-command-router-browser-fixture-smoke.mjs
node tests/desktop-command-router-fixture-suite.mjs
```

Expected usage evidence:

```text
usage rerun session count: 1
route request count: 1 to 3
Qwen route enabled by default: false
explicit local developer opt-in: true
fallback/rollback route source: intent-router.deterministic.fixture
runtime path selected: one explicit prepared Python or one bounded env
dependency env retained: false unless separately approved
artifact cache retained: false unless separately approved
approved artifact count: 7
digest-before-load: passed
helper count: 1 or 0
browser/URL opening blocked: true
VS Code blocked: true
Notepad/Calculator allowlist unchanged: true
raw evidence captured: false
retention/cleanup decision: recorded
```

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  this exact scope;
- Qwen would be enabled by default;
- route request count would exceed three;
- runtime setup requires unpinned dependencies, global Python mutation, private
  index credentials, or broad filesystem search;
- artifact digest verification fails;
- helper cannot be supervised or shut down;
- Qwen bypasses Core fallback or Command Router safety gates;
- browser/URL opening occurs;
- VS Code is not blocked;
- allowlist expands;
- raw prompt/model/helper/path/URL/token/vector/log/benchmark/browser/process
  evidence would be recorded;
- installer, packaging, telemetry, release channel, or production-facing
  behavior would change.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window local developer-alpha Qwen usage rerun scope using the degraded prior local usage closeout, passed Command Router browser-block remediation verification closeout, passed persistent enablement preparation evidence, passed product-route arming evidence, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to run one explicit local developer opt-in usage rerun session with at most three sanitized route requests; select exactly one prepared Python executable or create one bounded pinned dependency environment, materialize or reuse only the approved seven-file digest-pinned Qwen3-0.6B artifact set in one bounded developer-alpha local cache, verify digest-before-load, start at most one supervised helper, allow Qwen to be selected as route source only inside this one local developer-alpha rerun session after all gates pass, preserve deterministic fixture as default fallback and rollback route source, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify browser/URL opening remains blocked and VS Code remains blocked, and make no default-on behavior, persistent product route enablement, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed local developer-alpha Qwen usage rerun window with one explicit prepared Python or one bounded pinned dependency environment, one bounded approved artifact cache for the window only, digest-before-load, at most one supervised local helper, at most three sanitized route requests through existing Core fallback and Command Router safety gates, sanitized evidence only, verified helper shutdown and cleanup or explicitly recorded bounded retention decision, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark/raw process/browser profile/browser history evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded runtime/cache containment, helper cleanup, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha local Qwen usage rerun evidence only; no default-on behavior, no persistent Qwen product routing outside the one rerun window, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Current Decision

```text
decision: passed_cleaned
reason: approved local developer-alpha Qwen usage rerun passed with three sanitized route requests, browser-only fixture verification passed, full Command Router fixture suite passed, and cleanup removed the temporary dependency root.
follow-up: Qwen remains not default-on and not persistent active product routing. Open a separate bounded approval before any persistent product-route enablement, retained runtime/cache decision, UI/IPC runtime control, release exposure, or production-facing Qwen routing claim.
```
