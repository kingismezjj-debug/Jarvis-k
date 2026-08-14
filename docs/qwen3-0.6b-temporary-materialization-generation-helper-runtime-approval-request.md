# Qwen3-0.6B Temporary Materialization + Generation Helper Runtime Approval Request

Recorded: 2026-08-06

## Status

`APPROVED_RUNTIME_WINDOW_DEGRADED`

This document requests a new, exact-scope approval for one Qwen3-0.6B Fast
Router runtime acceptance window. It builds on the already approved
seven-file SHA-256 artifact pin set and does not reuse the earlier digest
pinning approval as runtime permission.

## Context

The Qwen3-0.6B Fast Router currently has:

- a provider-local adapter that parses bounded `IntentRoutingResult` JSON;
- an approved immutable revision:
  `c1899de289a04d12100db370d81485cdf75e47ca`;
- an approved seven-file SHA-256 artifact pin set;
- a runtime helper protocol surface for `generate`; and
- a Core Host generation-port adapter that is not wired into startup.

The current runtime/cache acceptance runner still blocks because no approved
temporary artifact materialization plan and no generation helper runtime are
available.

## Exact Approval Requested

Approve one local, single-operator, developer-alpha runtime acceptance window
for Qwen3-0.6B Fast Router using only the approved digest-pinned artifact set.

The approved window may:

- create one unique system-temporary root;
- fetch or materialize only the approved seven artifacts into that temporary
  root;
- verify SHA-256 before any helper load or generation call;
- construct an artifact plan that points only to the verified temporary files;
- start one supervised local Transformers helper process;
- load Qwen3-0.6B from the verified temporary artifact directory with
  `local_files_only=true` and `trust_remote_code=false`;
- run a bounded deterministic generation path only for intent routing;
- route only the minimal fixed developer-alpha prompt window;
- produce sanitized pass/degraded/blocked evidence; and
- stop the helper and delete the temporary root after the window.

The approved window may use network only to retrieve the exact approved
artifact files from the immutable Hugging Face revision when those files are
not already present locally. Network use is limited to those seven artifact
paths and must not use product download code, credentials, signed URL
retention, persistent Hugging Face cache, installer cache, or cross-run cache.

## Approved Artifact Set

Only these artifacts may be materialized:

| Artifact | Role | SHA-256 |
| --- | --- | --- |
| `config.json` | `model_config` | `660db3b73d788119c04535e48cf9be5f55bc3100841a718637ae695b442f27dd` |
| `generation_config.json` | `generation_config` | `2325da0f15bb848e018c5ae071b7943332e9f871d6b60e2ed22ca97d4cb993d2` |
| `tokenizer_config.json` | `tokenizer_config` | `d5d09f07b48c3086c508b30d1c9114bd1189145b74e982a265350c923acd8101` |
| `tokenizer.json` | `tokenizer_vocabulary` | `aeb13307a71acd8fe81861d94ad54ab689df773318809eed3cbe794b4492dae4` |
| `merges.txt` | `tokenizer_merges` | `8831e4f1a044471340f7c0a83d7bd71306a5b867e95fd870f74d0c5308a904d5` |
| `vocab.json` | `tokenizer_vocabulary` | `ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910` |
| `model.safetensors` | `model_weights` | `f47f71177f32bcd101b7573ec9171e6a57f4f4d31148d38e382306f42996874b` |

No other upstream file, model variant, quantized artifact, shard, adapter,
LoRA, cache entry, dependency, or manifest may be introduced in this window.

## Bounded Generation Helper Scope

The helper runtime may expose only:

- `health`;
- `load` for Qwen3-0.6B text generation from the verified temporary artifact
  directory;
- `generate` for deterministic intent routing with `temperature: 0`; and
- `shutdown`.

Generation must remain bounded by:

- prompt source: only the Qwen Fast Router prompt builder;
- output contract: JSON parsed by `QwenFastRouterProvider`;
- maximum output: `maxOutputChars <= 2000`;
- routing sample count: no more than the existing minimal acceptance prompts;
- action policy: validated intent only, no direct action execution;
- no shell, OS, browser, app, file, tool, network, Memory write, or UI action
  based on generated text; and
- no cloud fallback planner call.

## Required Safety Invariants

- Product, Security, and Release approval lines below must all be present
  before any materialization or helper runtime action.
- Every artifact must match the approved SHA-256 before helper load.
- Helper load must use only the verified temporary artifact directory.
- All temporary writes must remain under the unique system-temporary root.
- Persistent cache variables such as `HF_HOME`, `HF_HUB_CACHE`,
  `HUGGINGFACE_HUB_CACHE`, and `TRANSFORMERS_CACHE` must be absent or
  redirected inside the unique temporary root for the child process only.
- Runtime reports must not contain signed URLs, credentials, access tokens,
  Authorization headers, private paths, raw model output, raw prompts, raw
  helper diagnostics, stack traces, or benchmark details.
- `QwenFastRouterProvider` must remain default-off outside this one window.
- Core Host startup, Desktop IPC, UI behavior, installer/update behavior,
  telemetry, release-channel behavior, and product defaults must not change.
- Cleanup of the temporary artifact root and helper process must be verified.

## Explicitly Not Authorized

This approval does not authorize:

- product default enablement of Qwen routing;
- persistent model cache promotion;
- broad model lifecycle policy changes;
- installer, updater, packaging, telemetry, UI/IPC, or release-channel
  changes;
- background model residency after the window;
- real user tasks or tester expansion;
- arbitrary web downloads or unpinned artifacts;
- Memory writes, tool execution, local app execution, browser opening, shell
  execution, OCR, voice changes, or cloud planner fallback; or
- a second runtime attempt after a failed, degraded, blocked, or uncertain
  cleanup result.

## Stop Conditions

Stop immediately and mark the window blocked or degraded if any of these occur:

- any approval line is missing or differs from the exact scope below;
- the upstream revision differs from
  `c1899de289a04d12100db370d81485cdf75e47ca`;
- the artifact set differs from the seven approved files;
- any artifact digest mismatch occurs;
- any write escapes the unique temporary root;
- persistent cache use is detected outside the temporary root;
- helper startup, load, generation, timeout, shutdown, or cleanup fails;
- a generated output fails JSON parsing, intent validation, slot sanitization,
  or confidence gating;
- more than the minimal fixed prompt window is attempted;
- a model output would trigger direct action execution;
- a report would expose raw path, URL, credential, prompt, model output,
  helper diagnostic, stack trace, or benchmark data; or
- cleanup cannot be verified.

## Sanitized Evidence Contract

The final evidence may contain only:

- scope id;
- status: `passed`, `degraded`, or `blocked`;
- model id and immutable revision;
- artifact counts and digest verification status;
- helper phases as fixed statuses;
- routing sample count and per-sample intent pass/fail labels;
- cleanup status;
- booleans for default changes, persistent cache detection, direct action
  execution, and release behavior; and
- fixed reason codes.

The evidence must not contain raw prompts, raw generated text, raw helper
stdout/stderr, raw paths, signed URLs, credentials, access tokens, digest
source URLs, model internals, logits, vectors, benchmarks, or stack traces.

## Role Requests

**Product.** Approve exactly one developer-alpha Qwen3-0.6B Fast Router
runtime acceptance window using the already approved seven-file artifact set,
with minimal fixed routing prompts only, validated intent output only, no real
user task execution, no product default change, no tester expansion, and no
product SLO.

**Security.** Approve exactly this temporary artifact materialization and
bounded generation helper runtime scope. Require digest-before-load,
temporary-root containment, child-process isolation, `local_files_only`,
`trust_remote_code=false`, deterministic bounded generation, no persistent
cache, no credentials or signed URLs in evidence, fail-closed stop conditions,
sanitized failure classification, helper shutdown, and verified cleanup.

**Release.** Approve developer-alpha runtime evidence only. Exclude installer,
update, packaging, default configuration, UI/IPC, telemetry, release-channel,
product availability, and production-readiness changes.

## Approval Lines To Provide

```text
Product: APPROVE exactly this Qwen3-0.6B one-window temporary artifact materialization and bounded generation helper runtime acceptance scope
Security: APPROVE exactly this approved-digest temporary artifact/helper/runtime scope with bounded deterministic generation and verified cleanup
Release: APPROVE developer-alpha Qwen3-0.6B runtime evidence only; no installer/update/default/UI/IPC/telemetry/release changes
```

## Approval Record

The following explicit approvals were received on 2026-08-06 in the current
task:

| Role | Status | Approval evidence |
| --- | --- | --- |
| Product | APPROVED | Exactly this Qwen3-0.6B one-window temporary artifact materialization and bounded generation helper runtime acceptance scope |
| Security | APPROVED | Exactly this approved-digest temporary artifact/helper/runtime scope with bounded deterministic generation and verified cleanup |
| Release | APPROVED | Developer-alpha Qwen3-0.6B runtime evidence only; no installer/update/default/UI/IPC/telemetry/release changes |

## Runtime Window Evidence

The approved one-window run completed with `status=degraded` and
`accepted=false`.

- approved artifact materialization: `passed`;
- SHA-256 digest verification: `passed`;
- materialized artifact count: `7`;
- helper readiness: `passed`;
- generation port wiring: `passed`;
- model artifacts accessed: `true`;
- runtime artifact download for this one window: `true`;
- routing sample count: `4`;
- routing result: `degraded`;
- cleanup: `passed`;
- default behavior changed: `false`;
- UI/IPC behavior changed: `false`;
- release behavior changed: `false`; and
- reason code: `QWEN_ROUTING_ACCEPTANCE_FAILED`.

The sanitized per-sample results all failed at the generation/routing contract
boundary. No raw prompt, raw generated text, helper stdout/stderr, temp path,
signed URL, credential, stack trace, or benchmark output was recorded.

Because the approved one-window run returned degraded, another real runtime
attempt requires a fresh exact-scope Product, Security, and Release approval.

## Next Step After Approval

The next work item is to tune the bounded router prompt/decoding contract and
sanitized failure classification without running the model again. A new
minimal rerun approval is required before any second real runtime attempt.

The second minimal rerun request is recorded separately in
`docs/qwen3-0.6b-second-minimal-runtime-rerun-approval-request.md`.
