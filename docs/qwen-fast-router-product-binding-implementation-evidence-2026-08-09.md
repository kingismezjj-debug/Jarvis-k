# Qwen Fast Router Product Binding Implementation Evidence

Recorded: 2026-08-09

## Status

`IMPLEMENTED_VERIFIED`

Approval request:

```text
docs/qwen-fast-router-product-binding-implementation-approval-request-2026-08-09.md
```

Implementation is complete for the approved no-runtime Qwen status/settings/gate
projection only. No Qwen runtime, helper, artifact materialization, cache
window, generation port invocation, product routing through Qwen, or new
execution authority was added.

## Approved Scope

Product, Security, and Release approval was received in:

```text
docs/qwen-fast-router-product-binding-implementation-approval-request-2026-08-09.md
```

Expected implementation path:

```text
Command Router product-mode status
  -> Qwen no-runtime binding projection
  -> Settings gate display
  -> deterministic fixture remains active route source
  -> realQwenRuntimeEnabled remains false
  -> no Qwen direct execution authority
```

## Implementation Files

Changed files:

```text
packages/contracts/src/protocol.ts
packages/contracts/test/protocol.test.ts
apps/desktop/src/main.ts
apps/desktop/test/command-router-product-mode-source.test.ts
apps/ui/src/App.tsx
apps/ui/test/app-voice-ui-source.test.ts
tests/desktop-command-router-browser-fixture-smoke.mjs
tests/desktop-command-router-local-app-blocked-smoke.mjs
tests/desktop-command-router-local-app-fixture-smoke.mjs
tests/desktop-tts-playback-smoke.mjs
```

No Core Host runtime startup path was changed for this projection.

## Verification

```powershell
npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts packages/core/test/runtime.test.ts
npm.cmd run build:contracts
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
node tests/desktop-command-router-fixture-suite.mjs
```

```text
focused tests: PASS, 6 files, 143 tests
contracts build: PASS
core build: PASS
core-host build: PASS
ui build: PASS, with existing Vite chunk-size warning only
desktop build: PASS
fixture suite: PASS, 4 smoke paths, duration 9338 ms
```

Fixture suite process evidence:

```text
local-app allowlist fixture: PASS, newNotepadProcessIds []
calculator allowlist fixture: PASS, newCalculatorProcessIds []
browser projection fixture: PASS, newBrowserProcessIds {}
local-app blocked fixture: PASS, newCodeProcessIds []
```

Fixture suite UI evidence:

```text
settings-command-router-qwen-binding: visible
settings-command-router-qwen-status: disabled
settings-command-router-qwen-gates: artifact digest visible
```

## Status Projection Checklist

```text
active provider: intent-router.deterministic.fixture
active mode: fixture_only
Command Router default off: true
deterministic fallback preserved: true
realQwenRuntimeEnabled: false
Qwen slot visible: true
Qwen provider: intent-router.qwen3-0.6b
Qwen model: Qwen/Qwen3-0.6B
Qwen status: disabled or unconfigured, depending on product-mode control
Qwen binding mode: no_runtime_status_only
Qwen productRoutingEnabled: false
explicit enablement required: true
artifact digest approval required: true
model lifecycle readiness required: true
runtime generation port readiness required: true
selection policy readiness required: true
default-off preserved: true
fallback preserved: true
single env var sufficient: false
normal Core Host startup instantiates Qwen: false
directActionAttempted: false
runtimeAccessed: false
artifactAccessed: false
persistentCacheChanged: false
```

## Safety Flags

Values below describe product/runtime behavior. Local terminal commands were
used only for the approved source/build/test verification commands above, and
the fixture suite performed bounded launch verification.

```text
Qwen runtime executed: false
Qwen artifact downloaded/materialized: false
helper started: false
generation port invoked: false
persistent cache promoted: false
raw prompt recorded: false
raw model output recorded: false
helper diagnostics recorded: false
private path/URL/token recorded: false
credential accessed: false
network/provider call used: false
UI/IPC behavior expanded beyond approved status surface: false
default behavior changed: false
allowlist expanded: false
direct action bypassed safety gates: false
browser/URL opened: false
shell/PowerShell/cmd/terminal invoked by product/runtime: false
verification terminal used for approved source/build/test commands: true
filesystem/clipboard/process product action used: false
bounded process launch verification used by fixture suite: true
Memory vector retrieval used: false
provider planner used: false
telemetry expanded: false
installer/update/packaging/release change: false
```

## Result

Final decision:

```text
decision: implemented
reason: default-off no-runtime Qwen status/settings/gate projection is present and verified while deterministic fixture routing remains active.
follow-up: open a separate approval window before any Qwen runtime/cache/helper/artifact/materialization or product routing activation.
```
