# Qwen Artifact/Runtime Readiness Rerun With Temp Deps Evidence

Recorded: 2026-08-10

## Status

`PASSED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Approval request:

```text
docs/qwen-artifact-runtime-readiness-rerun-with-temp-deps-approval-request-2026-08-10.md
```

Product, Security, and Release approval was received on 2026-08-10. The bounded
rerun passed, then temporary dependency/artifact/cache state was cleaned up.

## Approved Scope

Approved for the exact one-window scope in the approval request.

Expected boundary:

```text
dependency setup path:
dependency retained:
artifact materialization:
digest verification:
helper startup:
model load:
generation-port probe count:
Qwen product routing: false
realQwenRuntimeEnabled: false
default behavior changed: false
UI/IPC changed: false
release behavior changed: false
```

## Planned Evidence Fields

```text
scope id:
approval status:
dependency path kind:
python major/minor:
torch import:
transformers import:
safetensors import:
artifact count:
digest verification:
temporary root containment:
helper readiness:
model load:
generation port:
routing probe count:
fallback preserved:
cleanup status:
dependency retained:
artifact cache retained:
Qwen product routing:
realQwenRuntimeEnabled:
default behavior changed:
allowlist expanded:
release behavior changed:
reason codes:
```

## Verification

```text
focused tests: PASS, 9 files, 106 tests
contracts build: PASS
qwen adapter build: PASS
transformers runtime build: PASS
core build: PASS
core-host build: PASS
desktop build: PASS
dependency setup path: temporary_venv
dependency import readiness: PASS
readiness runner: PASS
Command Router fixture suite: PASS, 4 smoke paths, duration 8336 ms
product status source check: PASS
```

Readiness runner sanitized result:

```text
scope id: qwen-lifecycle-backed-runtime-wiring-acceptance
status: passed
accepted: true
model id: Qwen/Qwen3-0.6B
revision: c1899de289a04d12100db370d81485cdf75e47ca
dependency path kind: temporary_venv
dependency retained: false
torch import: true
transformers import: true
safetensors import: true
artifact materialization: passed
digest verification: passed
artifact count: 7
temporary lifecycle root: passed
model lifecycle ready: true
persistent cache detected: false
helper ready: passed
generation port: passed
model artifacts accessed: true
download enabled for fixed approved artifacts: true
composition status: available
composition reason code: QWEN_COMPOSITION_AVAILABLE
direct action attempted: false
runtime accessed by readiness runner: true
artifact accessed by readiness runner: true
persistent cache changed: false
routing probe count: 1
routing result: passed
selection status: accepted
failure class: none
default behavior changed: false
UI/IPC behavior changed: false
release behavior changed: false
runner cleanup: passed
dependency cleanup: passed
temporary roots remaining: 0
retained for next window: false
reason codes: none
```

## Safety Flags

```text
Qwen product routing enabled: false
realQwenRuntimeEnabled: false
persistent model cache promoted: false
UI/IPC control shipped: false
credential accessed: false
raw prompt recorded: false
raw model output recorded: false
helper diagnostics recorded: false
raw Python path recorded: false
raw private path recorded: false
raw package log recorded: false
URL/token/stack/benchmark recorded: false
browser/URL opened: false
shell/PowerShell/cmd/terminal invoked by product/runtime: false
verification terminal used for approved local commands: true
arbitrary process action: false
Memory vector retrieval: false
provider planner: false
telemetry expanded: false
installer/update/packaging/release change: false
```

## Result

```text
decision: passed
reason: temporary dependency setup passed, fixed seven-artifact materialization and digest verification passed, helper and one generation-port readiness probe passed, and cleanup removed temporary dependency/artifact/cache state.
follow-up: open a separate product-routing activation policy/window before Qwen can become an active product route source.
```
