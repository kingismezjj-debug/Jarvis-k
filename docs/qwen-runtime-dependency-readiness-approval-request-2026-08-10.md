# Qwen Runtime Dependency Readiness Approval Request

Recorded: 2026-08-10

## Status

`PRODUCT_SECURITY_RELEASE_APPROVED_BLOCKED`

This document records Product, Security, and Release approval for a separate
Qwen runtime dependency preparation/readiness window. It is limited to
preparing and verifying a local Python runtime that can import the dependencies
required by the existing Transformers helper.

The approved window closed as blocked. Evidence:

```text
docs/qwen-runtime-dependency-readiness-evidence-2026-08-10.md
docs/qwen-runtime-dependency-readiness-closeout-2026-08-10.md
```

This request does not approve Qwen artifact materialization, Qwen helper
startup, model load, generation-port invocation, product routing through Qwen,
Desktop/UI/IPC controls, product default changes, installer/update/packaging,
release-channel behavior, arbitrary app control, or direct execution authority.

No Python environment mutation, package installation, helper startup, Qwen
artifact access, generation call, or product/runtime behavior has been
performed under this request.

## Baseline

Previous readiness window blocked before artifact/runtime actions:

```text
docs/qwen-artifact-runtime-readiness-closeout-2026-08-10.md
```

Blocked reason:

```text
QWEN_RUNTIME_DEPENDENCY_UNAVAILABLE
```

The existing helper imports:

```text
torch
transformers.AutoModel
transformers.AutoModelForCausalLM
transformers.AutoTokenizer
```

The runtime package requirements file currently pins:

```text
packages/inference-runtime-transformers-local/runtime/requirements.txt
```

Pinned dependencies:

```text
transformers==5.14.1
torch==2.13.0
safetensors==0.8.0
```

## Purpose

Prepare or verify a local dependency environment for later Qwen artifact/runtime
readiness, while keeping product behavior unchanged:

```text
active product route source: intent-router.deterministic.fixture
Qwen product routing: unavailable
realQwenRuntimeEnabled: false
Qwen artifact materialization: not approved here
Qwen helper startup: not approved here
generation port invocation: not approved here
```

## Exact Scope To Approve

If Product, Security, and Release approvals are provided exactly for this
window, the approved work may include only:

- inspect local source/docs for the existing runtime helper dependency
  requirements;
- inspect local Python candidates with bounded commands such as `py -0p`,
  `where python`, and direct `python -c` import checks;
- create one unique system-temporary root for dependency readiness work;
- optionally create one Python virtual environment under that temporary root;
- optionally run `python -m pip` only inside that temporary virtual environment;
- install only the pinned packages listed in
  `packages/inference-runtime-transformers-local/runtime/requirements.txt`;
- keep pip cache and temporary package materialization under the unique
  temporary root where supported by pip environment variables;
- verify dependency readiness with import-only checks for `torch`,
  `transformers`, and `safetensors`;
- optionally run the existing runtime helper `health` operation only if it does
  not load a model, read Qwen artifacts, call `load`, call `generate`, or start
  a product route;
- record only sanitized dependency readiness evidence;
- leave any prepared temporary environment deleted unless the approval text
  explicitly allows retaining the temporary venv path for the next approved
  window.

## Explicit Exclusions

This request does not authorize:

- Qwen artifact download or materialization;
- Qwen artifact digest verification;
- Qwen helper model load;
- Qwen generation-port invocation;
- Qwen product routing activation;
- changing `realQwenRuntimeEnabled` to true;
- product download/install/update code paths;
- persistent model cache promotion;
- installing Python packages into the repo, global Python, system Python,
  user-site Python, installer directories, or product distribution;
- adding runtime dependencies to any `package.json`;
- Desktop/UI/IPC shipped controls;
- default behavior changes;
- allowlist expansion;
- browser, URL, local app, arbitrary process, shell, PowerShell, cmd, terminal,
  or script execution by product/runtime;
- credentials, provider planner, Memory write, Memory vector retrieval, or
  telemetry expansion;
- raw private paths, raw helper diagnostics, raw package logs, signed URLs,
  credentials, tokens, stack traces, benchmarks, or model internals in evidence.

## Required Verification After Approval

Candidate verification commands after approval:

```powershell
npx.cmd vitest run packages/inference-runtime-transformers-local/test/runtime-helper-protocol.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-client.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-process-transport.test.ts
npm.cmd run build:inference-runtime-transformers-local
node tests/runtime-helper-python-smoke.mjs
```

The smoke may run only with `JARVIS_K_RUNTIME_PYTHON` set to the approved
temporary or verified Python executable. It may use the helper `health`
operation and fixture-only requests, but must not load Qwen artifacts or call a
Qwen generation path.

## Stop Conditions

Stop immediately and record blocked/degraded evidence if:

- any Product, Security, or Release approval line is missing or differs from
  the exact approved scope;
- dependency readiness requires modifying global/system/user Python;
- pip install would write outside the unique temporary root except ordinary
  network transport and interpreter-managed metadata that cannot be safely
  redirected;
- package versions differ from the pinned requirements;
- a package install requires credentials, private indexes, signed URL retention,
  or unbounded package sets;
- a helper call would load Qwen, read Qwen artifacts, or call generation;
- raw private paths, package logs, helper diagnostics, stack traces, URLs,
  credentials, or tokens would enter evidence;
- product routing/defaults/UI/IPC/installer/packaging/release behavior changes;
- cleanup is incomplete or uncertain.

## Sanitized Evidence Contract

Evidence may contain only:

- scope id and status;
- dependency names and pinned versions;
- Python readiness status as `available`, `prepared`, `blocked`, or `degraded`;
- import status booleans for `torch`, `transformers`, and `safetensors`;
- helper health status if run;
- temporary-root containment and cleanup status;
- booleans for global install, product routing, artifact access, helper model
  load, generation call, default change, UI/IPC change, and release behavior;
- fixed reason codes.

Evidence must not contain raw private paths, full pip logs, package download
URLs, credentials, signed URLs, tokens, stack traces, benchmark output, model
artifacts, raw prompts, generated text, or helper diagnostics.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window Qwen runtime dependency preparation/readiness scope to inspect local Python candidates, create at most one temporary Python virtual environment if needed, install only the pinned packages from packages/inference-runtime-transformers-local/runtime/requirements.txt into that temporary environment, and verify import-only readiness for torch, transformers, and safetensors plus optional helper health only; no Qwen artifact materialization, helper model load, generation-port invocation, product routing, default behavior, UI/IPC control, allowlist, provider planner, Memory vector retrieval, installer, packaging, release-channel, or production-facing behavior change

Security: APPROVE exactly this bounded fail-closed Qwen runtime dependency preparation/readiness window with unique temporary-root containment, no global/system/user-site Python mutation, pip cache scoped to the temporary root where supported, pinned dependency versions only, sanitized evidence only, no credential/private-index/signed-URL retention, no raw package logs/private paths/helper diagnostics/URL/token/stack/benchmark evidence, optional helper health only with no model load or generation, verified cleanup unless explicitly retaining the temporary venv for the next approved window, no browser or URL opening by product/runtime, no shell/PowerShell/cmd/terminal/script execution by product/runtime, no arbitrary process or command-line arguments by product/runtime, no Qwen artifact access, no Memory write/vector retrieval, no provider planner, no allowlist expansion, and no bypass of existing Command Router safety gates

Release: APPROVE developer-alpha Qwen runtime dependency readiness evidence only; no default behavior change, no Qwen product routing enablement, no persistent model cache, no UI/IPC shipped control, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that Qwen routing or runtime dependency support is shipped
```

## Current Decision

```text
decision: blocked
reason: exact Product, Security, and Release approval lines were provided on 2026-08-10.
follow-up: current local Python lacks required imports, temporary venv/pip preparation was blocked by the execution environment before setup, and helper health failed without model load or generation.
```
