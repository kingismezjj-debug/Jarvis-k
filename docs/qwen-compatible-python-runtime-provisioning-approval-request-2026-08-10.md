# Qwen Compatible Python Runtime Provisioning Approval Request

Recorded: 2026-08-10

## Status

`PRODUCT_SECURITY_RELEASE_APPROVED_PASSED_TEMPORARY_VENV_CLEANED`

This document records Product, Security, and Release approval for a separate
compatible Python runtime provisioning/readiness window after the Qwen runtime
dependency readiness window blocked.

The approved Path B temporary-venv window passed and was cleaned up. Evidence:

```text
docs/qwen-compatible-python-runtime-provisioning-evidence-2026-08-10.md
docs/qwen-compatible-python-runtime-provisioning-closeout-2026-08-10.md
```

This request is limited to choosing one compatible Python dependency path for a
future Qwen artifact/runtime readiness rerun. It does not approve Qwen artifact
materialization, helper model load, generation-port invocation, product routing
through Qwen, Desktop/UI/IPC controls, product default changes, installer,
packaging, release-channel behavior, arbitrary app control, or direct execution
authority.

No Python discovery, environment creation, pip install, helper startup, Qwen
artifact access, model load, generation-port invocation, or product behavior
has been performed under this request.

## Baseline

Runtime dependency readiness is currently blocked:

```text
docs/qwen-runtime-dependency-readiness-closeout-2026-08-10.md
```

Blocked facts:

```text
current Python command: present
selected Python major/minor: 3.14
torch import: false
transformers import: false
safetensors import: false
temporary venv created: false
pip install: not_run_blocked_by_execution_policy
temporary dependency roots remaining: 0
```

Pinned dependency requirements:

```text
packages/inference-runtime-transformers-local/runtime/requirements.txt
```

```text
transformers==5.14.1
torch==2.13.0
safetensors==0.8.0
```

## Purpose

Prepare a compatible Python dependency path for a later Qwen
artifact/runtime readiness rerun while keeping all product behavior unchanged:

```text
Qwen artifact access: false
Qwen helper model load: false
Qwen generation port: false
Qwen product routing: false
realQwenRuntimeEnabled: false
default behavior changed: false
```

## Allowed Paths After Approval

Exactly one of these paths may be selected after approval:

### Path A: User-Provided Prepared Python

The operator provides an explicit Python executable already prepared outside
Jarvis-K. The approved work may:

- verify only that this one executable exists and runs;
- verify import-only readiness for `torch`, `transformers`, and `safetensors`;
- optionally run helper `health` only, with no model load or generation;
- set `JARVIS_K_RUNTIME_PYTHON` only in the current verification process if
  needed;
- record sanitized readiness evidence without recording the raw path.

### Path B: Temporary Venv In A Permissive Shell

If the current environment permits it, the approved work may:

- create one unique system-temporary root;
- create one Python virtual environment under that temporary root;
- install only the pinned packages from the requirements file above;
- scope pip cache to the temporary root where supported;
- verify import-only readiness for `torch`, `transformers`, and
  `safetensors`;
- optionally run helper `health` only, with no model load or generation;
- delete the temporary root before closeout unless a later exact approval
  explicitly authorizes retaining the venv for the next window.

## Explicit Exclusions

This request does not authorize:

- broad filesystem search for Python installations;
- recording raw Python paths in evidence;
- global/system/user-site Python mutation;
- package install into the repository or product distribution;
- adding runtime dependencies to any `package.json`;
- Qwen artifact download, materialization, or digest verification;
- Qwen model load;
- Qwen generation-port invocation;
- Qwen product routing activation;
- changing `realQwenRuntimeEnabled` to true;
- Desktop/UI/IPC shipped controls;
- default behavior changes;
- allowlist expansion;
- browser, URL, local app, arbitrary process, shell, PowerShell, cmd, terminal,
  or script execution by product/runtime;
- credentials, private package indexes, provider planner, Memory write, Memory
  vector retrieval, telemetry expansion, installer, packaging, update, or
  release-channel changes;
- raw private paths, pip logs, helper diagnostics, URLs, tokens, stack traces,
  benchmarks, model internals, prompts, or generated text in evidence.

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  the exact approved scope;
- the work would require global/system/user-site Python mutation;
- the dependency versions differ from the pinned requirements;
- a package operation requires credentials, private indexes, signed URL
  retention, or unbounded package sets;
- the chosen Python cannot import all three required packages;
- helper health would require model load, Qwen artifacts, or generation;
- raw path/log/URL/token/diagnostic/stack/benchmark evidence would be recorded;
- cleanup is incomplete or uncertain;
- product routing, UI/IPC, default, allowlist, telemetry, installer,
  packaging, update, release, provider planner, or Memory vector behavior
  changes.

## Sanitized Evidence Contract

Evidence may contain only:

- selected path kind: `user_provided_python`, `temporary_venv`, or `blocked`;
- Python major/minor version;
- dependency names and pinned versions;
- import booleans for `torch`, `transformers`, and `safetensors`;
- helper health status if run;
- temporary-root containment and cleanup status;
- fixed reason codes;
- booleans for Qwen artifact access, model load, generation, product routing,
  default change, UI/IPC change, package install location, and release behavior.

Evidence must not contain raw Python paths, full pip logs, package download
URLs, private paths, credentials, signed URLs, tokens, helper diagnostics,
stack traces, benchmark output, prompts, generated text, or model internals.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window Qwen compatible Python runtime provisioning/readiness scope selecting exactly one path: either verify one user-provided prepared Python executable, or create one temporary venv in a permissive shell and install only pinned packages from packages/inference-runtime-transformers-local/runtime/requirements.txt; verify import-only readiness for torch, transformers, and safetensors plus optional helper health only; no Qwen artifact materialization, helper model load, generation-port invocation, product routing, default behavior, UI/IPC control, allowlist, provider planner, Memory vector retrieval, installer, packaging, release-channel, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen compatible Python runtime provisioning/readiness window with one explicit Python candidate or one unique temporary-root venv, no broad filesystem search, no global/system/user-site Python mutation, pinned dependency versions only, pip cache scoped to temporary root where supported, sanitized evidence only, no raw Python path/pip log/helper diagnostic/URL/token/stack/benchmark evidence, optional helper health only with no model load or generation, verified cleanup unless separately approved to retain a temporary venv for the next window, no Qwen artifact access, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary process or command-line arguments by product/runtime, no Memory write/vector retrieval, no provider planner, no allowlist expansion, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen compatible Python runtime readiness evidence only; no default behavior change, no Qwen product routing enablement, no persistent model cache, no UI/IPC shipped control, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that Qwen routing or runtime dependency support is shipped
```

## Current Decision

```text
decision: passed
reason: exact Product, Security, and Release approval lines were provided on 2026-08-10.
follow-up: Path B temporary venv passed import-only readiness and helper health, then cleanup removed the temporary root.
```
