# Qwen Local Developer Alpha Usage Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_EXECUTED_DEGRADED_STOPPED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

This document opened a separate local developer-alpha Qwen usage approval
window. Product, Security, and Release approval was provided exactly. The
approved window executed one bounded local usage session and then stopped after
Command Router browser-block verification detected a browser process.

No code, product status, UI/IPC behavior, installer, packaging, telemetry, or
release-channel behavior changed under this request. The temporary dependency
environment and temporary runtime/artifact/helper state used for the window were
cleaned up.

## Baseline

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

- run one local developer-alpha usage session on this machine;
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
- allow local app launch only for Notepad and Calculator, only after explicit UI
  confirmation plus native confirmation;
- verify VS Code remains blocked;
- verify browser/URL opening remains blocked;
- preserve deterministic fixture fallback and rollback route source;
- record sanitized evidence only;
- shut down helper and record cleanup or a separately approved bounded
  retention decision.

## Explicit Exclusions

This request does not authorize:

- default-on Qwen routing;
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
  benchmark, or model internals in evidence.

## Required Gates

```text
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
VS Code blocked: required
browser/URL opening blocked: required
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
node tests/desktop-command-router-fixture-suite.mjs
```

Expected usage evidence:

```text
usage session count: 1
route request count: 1 to 3
Qwen route enabled by default: false
explicit local developer opt-in: true
fallback/rollback route source: intent-router.deterministic.fixture
runtime path selected: one explicit prepared Python or one bounded env
approved artifact count: 7
digest-before-load: passed
helper count: 1 or 0
Notepad/Calculator allowlist unchanged: true
VS Code blocked: true
browser/URL opening blocked: true
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
- VS Code is not blocked;
- browser/URL opening occurs;
- allowlist expands;
- raw prompt/model/helper/path/URL/token/vector/log/benchmark evidence would be
  recorded;
- installer, packaging, telemetry, release channel, or production-facing
  behavior would change.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window local developer-alpha Qwen usage scope using the passed persistent enablement preparation evidence, passed product-route arming evidence, existing activation status/gate plumbing, existing Core selection/fallback contracts, and existing Command Router safety gates to run one explicit local developer opt-in usage session with at most three sanitized route requests; select exactly one prepared Python executable or create one bounded pinned dependency environment, materialize or reuse only the approved seven-file digest-pinned Qwen3-0.6B artifact set in one bounded developer-alpha local cache, verify digest-before-load, start at most one supervised helper, allow Qwen to be selected as route source only inside this one local developer-alpha session after all gates pass, preserve deterministic fixture as fallback and rollback route source, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, verify VS Code remains blocked and browser/URL opening remains blocked, and make no default-on behavior, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed local developer-alpha Qwen usage window with one explicit prepared Python or one bounded pinned dependency environment, one bounded approved artifact cache for the window only, digest-before-load, at most one supervised local helper, at most three sanitized route requests through existing Core fallback and Command Router safety gates, sanitized evidence only, verified helper shutdown and cleanup or explicitly recorded bounded retention decision, no credential exposure, no raw prompt/model output/helper diagnostic/Python path/private path/package log/artifact source URL/signed URL/token/vector/stack/benchmark evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded runtime/cache containment, helper cleanup, and accepted launch verification, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha local Qwen usage evidence only; no default-on behavior, no production-facing claim that Qwen routing or arbitrary app control is supported, no telemetry expansion, no installer/update/packaging/release-channel changes, and no release exposure beyond local developer-alpha evidence
```

## Current Decision

```text
decision: degraded_stopped_cleaned
reason: approved local usage session passed with three sanitized route requests, but browser-block fixture verification detected a browser process and triggered the stop condition.
follow-up: do not treat this as persistent Qwen enablement evidence. Open a separate bounded remediation/verification window before any further local usage, product-route enablement, or browser-block rerun.
```
