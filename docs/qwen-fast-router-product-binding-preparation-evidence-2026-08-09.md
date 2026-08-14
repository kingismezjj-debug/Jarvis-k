# Qwen Fast Router Product Binding Preparation Evidence

Recorded: 2026-08-09

## Status

`PREPARED`

Approval request:

```text
docs/qwen-fast-router-product-binding-preparation-approval-request-2026-08-09.md
```

No Qwen runtime, artifact materialization, helper startup, cache window, UI/IPC
implementation, or product routing change has been run under this evidence.

## Scope

Product, Security, and Release approval recorded on 2026-08-09 in:

```text
docs/qwen-fast-router-product-binding-preparation-approval-request-2026-08-09.md
```

Prepared path:

```text
text/voice command
  -> future default-off Qwen fast router product slot
  -> readiness gates
  -> sanitized intent candidate
  -> deterministic fallback
  -> accepted Command Router safety gates
  -> no direct Qwen execution authority
```

## Preflight

Passed on 2026-08-09. No Qwen runtime, artifact materialization, helper
startup, cache window, UI/IPC implementation, or product routing change was run
during this preparation.

Planned commands:

```powershell
npx.cmd vitest run packages/inference-adapter-qwen-router/test/provider.test.ts packages/inference-adapter-qwen-router/test/artifact-plan.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts packages/core/test/runtime.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts
npm.cmd run build:inference-adapter-qwen-router
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:desktop
node tests/desktop-command-router-fixture-suite.mjs
```

Recorded result:

```text
focused tests: PASS, 6 files, 114 tests
qwen adapter build: PASS
core build: PASS
core-host build: PASS
desktop build: PASS
fixture suite: PASS, 4 smoke paths, duration 8376 ms
```

Focused test note:

```text
apps/core-host/test/qwen-fast-router-composition.test.ts had an over-broad
sanitization assertion that matched the allowed boolean field name
rawDiagnosticsExposed. The test was narrowed to require
rawDiagnosticsExposed=false and continue blocking token/secret/private Windows
path leakage.
```

## Gate Classifications

Prepared classifications:

```text
explicit enablement required: true
artifact digest approval required: true
model lifecycle readiness required: true
runtime generation port readiness required: true
selection policy readiness required: true
default-off preserved: true
fallback preserved: true
single env var sufficient: false
normal Core Host startup instantiates Qwen: false
Command Router realQwenRuntimeEnabled: false
directActionAttempted: false
runtimeAccessed: false
artifactAccessed: false
persistentCacheChanged: false
```

## Fallback Classifications

Prepared classifications:

```text
provider unavailable fallback: preserved
invalid provider result fallback: preserved
provider throw fallback: preserved
unsupported intent fallback: preserved
low confidence fallback: preserved
blocked/unsafe candidate: blocked, no dispatch
deterministic rules fallback preserved: true
Command Router safety gates preserved: true
```

## Safety Flags

Expected values are `false` unless explicitly marked otherwise.

```text
Qwen runtime executed: false
Qwen artifact downloaded/materialized: false
helper started: false
persistent cache promoted: false
raw prompt recorded: false
raw model output recorded: false
helper diagnostics recorded: false
private path/URL/token recorded: false
credential accessed: false
network/provider call used: false
UI/IPC behavior changed: false
default behavior changed: false
allowlist expanded: false
direct action bypassed safety gates: false
browser/URL opened: false
shell/PowerShell/cmd/terminal invoked: false
filesystem/clipboard/process action used: false
Memory vector retrieval used: false
provider planner used: false
telemetry expanded: false
installer/update/packaging/release change: false
```

## Result

`prepared`

Final decision:

```text
decision: prepared
reason: existing Qwen no-runtime gates, fallback contracts, and Command Router safety baseline verified without runtime/cache/helper/materialization
follow-up: open a separate implementation approval only if product binding code/UI/IPC/runtime wiring is desired
```
