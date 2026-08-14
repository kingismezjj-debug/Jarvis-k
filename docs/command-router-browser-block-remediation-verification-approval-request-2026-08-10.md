# Command Router Browser Block Remediation Verification Approval Request

Recorded: 2026-08-10

## Status

`APPROVED_VERIFIED_CLOSED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

This document opened a separate browser-block remediation and verification
approval window after the local developer-alpha Qwen usage window stopped
degraded at Command Router browser-block verification.

Product, Security, and Release approval was provided exactly. Source/test
review found the product path already fail-closed for `browser.open` in Command
Router product mode. No code remediation was needed. The approved browser-only
fixture rerun passed, then the approved full Command Router fixture suite rerun
passed.

No code, runtime, artifact, helper, dependency environment, product route,
product status, UI/IPC behavior, installer, packaging, telemetry, or
release-channel behavior changed under this request.

## Baseline

The local developer-alpha Qwen usage window stopped degraded:

```text
docs/qwen-local-developer-alpha-usage-closeout-2026-08-10.md
```

Observed stop condition:

```text
Qwen usage session: passed
route request count: 3
Command Router browser projection fixture: failed_browser_process_detected
detected browser family: firefox
Qwen default-on behavior changed: false
release behavior changed: false
cleanup: passed
```

Current product invariant:

```text
Qwen route enabled by default: false
persistent active product route source: intent-router.deterministic.fixture
Qwen runtime/helper/artifact/dependency env retained: false
Command Router allowlist: Notepad and Calculator only
browser/URL opening: blocked
VS Code target: blocked
release/production-facing exposure: false
```

## Exact Scope To Approve

If Product, Security, and Release approvals are provided exactly for this
window, the approved work may include only:

- source and test review of the Command Router browser projection path;
- source and test review of the browser-block fixture process-diff logic;
- narrowly scoped code or test remediation only if review finds the prior
  browser process detection was caused by product code or an unsafe/unstable
  fixture path;
- sanitized evidence describing pass/fail states without raw private paths,
  raw process lists, browser history, URLs, tokens, credentials, stack traces,
  or verbose logs;
- at most one browser-only Command Router fixture rerun;
- at most one full Command Router fixture suite rerun after a browser-only pass;
- existing bounded browser process launch-verification enumeration only through
  the fixture smoke scripts;
- existing focused source/build/test verification relevant to Command Router
  fixture/product-mode safety.

## Explicit Exclusions

This request does not authorize:

- browser or URL opening by product/runtime;
- Qwen runtime/helper startup;
- Qwen artifact materialization or dependency environment creation;
- generation-port invocation;
- product route enablement or persistent route-source change;
- allowlist expansion beyond Notepad and Calculator;
- VS Code launch;
- arbitrary executable path or command-line arguments by product/runtime;
- shell, PowerShell, cmd, terminal, or script execution by product/runtime;
- provider planner;
- Memory write or Memory vector retrieval;
- credential access;
- filesystem, clipboard, process, browser profile, or history enumeration
  beyond bounded process-diff verification already present in fixture smokes;
- installer, packaging, update, telemetry, or release-channel behavior change;
- production-facing claim that Qwen routing or arbitrary app control is
  supported.

## Required Gates

```text
local developer-alpha usage closeout exists: true
Qwen runtime retained from prior window: false
dependency env retained from prior window: false
artifact cache retained from prior window: false
browser/URL product opening allowed: false
source/test remediation only: true
bounded browser process-diff verification only: true
browser-only fixture reruns allowed: 1
full fixture suite reruns allowed after browser-only pass: 1
Command Router safety gates preserved: true
Notepad/Calculator allowlist unchanged: true
VS Code blocked: required
raw evidence captured: false
default-on behavior: false
release behavior changed: false
```

## Required Verification After Approval

Candidate verification:

```powershell
npx.cmd vitest run apps/desktop/test/command-router-product-mode-source.test.ts packages/contracts/test/tool-protocol.test.ts packages/core/test/runtime.test.ts
npm.cmd run build:contracts
npm.cmd run build:core
npm.cmd run build:ui
npm.cmd run build:desktop
node tests/desktop-command-router-browser-fixture-smoke.mjs
node tests/desktop-command-router-fixture-suite.mjs
```

Expected evidence:

```text
browser-only fixture reruns: 0 or 1
full fixture suite reruns: 0 or 1
browser/URL opening blocked: true
newBrowserProcessIds: {}
Notepad/Calculator allowlist unchanged: true
VS Code blocked: true
Qwen runtime/helper/artifact access: false
dependency env created: false
raw evidence captured: false
default behavior changed: false
release behavior changed: false
```

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  this exact scope;
- browser or URL opening occurs;
- a browser process is detected in the browser-only fixture rerun;
- remediation would require Qwen runtime/helper/artifact/dependency work;
- remediation would require allowlist expansion;
- remediation would require product/runtime shell, PowerShell, cmd, terminal, or
  script execution behavior;
- remediation would require arbitrary executable paths or command-line
  arguments by product/runtime;
- remediation would inspect browser history/profile content, clipboard,
  credentials, Memory vectors, raw private paths, tokens, URLs, or verbose
  process lists;
- installer, packaging, telemetry, release channel, or production-facing
  behavior would change.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window Command Router browser-block remediation verification scope using the degraded local developer-alpha Qwen usage closeout, existing deterministic fixture routing, existing Command Router product-mode safety gates, and existing Notepad/Calculator-only allowlist to perform source/test review, narrowly scoped remediation if needed, sanitized evidence, at most one browser-only fixture rerun, and at most one full Command Router fixture-suite rerun only after browser-only pass; keep Qwen runtime/helper/artifact/dependency environment unavailable, keep deterministic fixture as the active and fallback route source, keep browser/URL opening blocked, keep VS Code blocked, keep Notepad and Calculator as the only local app launch targets after explicit UI plus native confirmation, and make no default behavior, product route enablement, allowlist expansion, provider planner, Memory vector retrieval, installer, packaging, release-channel, telemetry, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Command Router browser-block remediation verification window with source/test review and narrowly scoped code/test remediation only, sanitized evidence only, at most one browser-only fixture rerun, at most one full fixture-suite rerun only after browser-only pass, bounded browser process-diff launch verification only through the existing fixture smoke path, no credential exposure, no raw process list/browser history/profile content/private path/URL/token/vector/stack/verbose log evidence, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary executable path or command-line arguments by product/runtime, no filesystem/clipboard/process enumeration beyond bounded launch verification, no Qwen runtime/helper/artifact/dependency environment, no generation-port invocation, no Memory write/vector retrieval, no provider planner, no allowlist expansion beyond Notepad and Calculator, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Command Router browser-block remediation verification evidence only; no default behavior change, no Qwen product routing enablement, no persistent dependency environment or model cache, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that Qwen routing or arbitrary app control is supported
```

## Current Decision

```text
decision: verified_closed
reason: source/test review found browser.open remains fixture-only and confirmation-required in Command Router product mode; browser-only rerun passed with no new browser process IDs; full fixture suite rerun passed with Notepad/Calculator allowlist unchanged, browser blocked, and VS Code blocked.
follow-up: Qwen remains not default-on and no production-facing behavior changed. Continue only through separate bounded approvals for future Qwen local usage or product-route enablement.
```
