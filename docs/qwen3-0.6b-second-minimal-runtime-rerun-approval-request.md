# Qwen3-0.6B Second Minimal Runtime Rerun Approval Request

Recorded: 2026-08-06

## Status

`APPROVED_SECOND_RERUN_DEGRADED`

This document requests a fresh exact-scope approval for one second minimal
Qwen3-0.6B Fast Router runtime rerun. It is required because the previous
approved runtime window was consumed and returned `degraded`.

## Context

The first approved runtime window completed with:

- artifact materialization: `passed`;
- SHA-256 digest verification: `passed`;
- helper readiness: `passed`;
- generation port wiring: `passed`;
- cleanup: `passed`; and
- routing acceptance: `degraded`.

After that degraded window, Jarvis-K performed only offline tuning:

- stronger router prompt instructions;
- `/no_think` prompt suffix;
- Qwen chat-template encoding with `enable_thinking=false` when available;
- balanced JSON object/array extraction;
- `<think>...</think>` removal;
- intent alias normalization;
- string confidence normalization;
- slot-key alias normalization; and
- sanitized failure classification preservation.

No model artifact was downloaded, materialized, loaded, generated with, or
benchmarked during the offline tuning.

## Exact Approval Requested

Approve exactly one second local, single-operator, developer-alpha runtime
rerun for Qwen3-0.6B Fast Router using only:

- the same immutable revision:
  `c1899de289a04d12100db370d81485cdf75e47ca`;
- the same approved seven-file SHA-256 artifact set;
- the same temporary materialization and digest-before-load controls;
- the same bounded local Transformers helper;
- the offline-tuned prompt, decoding, and JSON extraction strategy; and
- the same fixed minimal routing prompt window.

The rerun must not expand the artifact set, model variant, prompt count,
tester count, runtime capabilities, UI/IPC behavior, default behavior, or
release behavior.

## Approved Artifact Set

Only these seven artifacts may be materialized:

| Artifact | SHA-256 |
| --- | --- |
| `config.json` | `660db3b73d788119c04535e48cf9be5f55bc3100841a718637ae695b442f27dd` |
| `generation_config.json` | `2325da0f15bb848e018c5ae071b7943332e9f871d6b60e2ed22ca97d4cb993d2` |
| `tokenizer_config.json` | `d5d09f07b48c3086c508b30d1c9114bd1189145b74e982a265350c923acd8101` |
| `tokenizer.json` | `aeb13307a71acd8fe81861d94ad54ab689df773318809eed3cbe794b4492dae4` |
| `merges.txt` | `8831e4f1a044471340f7c0a83d7bd71306a5b867e95fd870f74d0c5308a904d5` |
| `vocab.json` | `ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910` |
| `model.safetensors` | `f47f71177f32bcd101b7573ec9171e6a57f4f4d31148d38e382306f42996874b` |

No extra artifact, shard, adapter, quantized model, dependency, persistent
cache entry, or fallback model may be introduced.

## Rerun Bounds

The rerun may only:

- create one unique system-temporary root;
- materialize or fetch the same seven approved artifacts into that root;
- verify all SHA-256 digests before helper load;
- start one supervised helper process;
- load Qwen3-0.6B from the verified temporary artifact directory;
- run deterministic bounded generation with `temperature: 0`;
- use the offline-tuned router prompt and parser;
- evaluate only the same minimal fixed prompt window;
- report sanitized pass/degraded/blocked evidence; and
- shut down the helper and verify cleanup.

The rerun must keep:

- `local_files_only=true`;
- `trust_remote_code=false`;
- `maxOutputChars <= 2000`;
- validated intent output only;
- no direct action execution;
- no Memory write;
- no browser, app, shell, tool, OCR, voice, cloud planner, UI, Desktop IPC, or
  release behavior based on generated output.

## Stop Conditions

Stop immediately and do not attempt another prompt or rerun if any of these
occur:

- any Product/Security/Release approval line is missing or differs from this
  exact scope;
- the revision or artifact digest set differs from the approved set;
- materialization, digest verification, helper startup, load, generation,
  shutdown, or cleanup fails;
- generated output cannot be parsed into a sanitized allowed intent;
- more than the fixed minimal prompt window is attempted;
- direct action execution is attempted;
- any persistent cache is detected outside the unique temporary root;
- any report would expose raw prompt, raw generated text, helper diagnostics,
  private path, signed URL, credential, stack trace, model internal, logits,
  vector, or benchmark output; or
- cleanup is incomplete or uncertain.

## Sanitized Evidence Contract

The evidence may contain only:

- scope id;
- status: `passed`, `degraded`, or `blocked`;
- model id and revision;
- artifact count and digest verification status;
- helper phase statuses;
- routing sample count;
- per-sample expected/actual intent labels, pass booleans, confidence band,
  and failure class;
- cleanup status; and
- fixed reason codes.

The evidence must not contain raw prompts, raw generated text, raw helper
stdout/stderr, temp paths, signed URLs, credentials, tokens, stack traces,
model internals, logits, vectors, benchmarks, or user-private data.

## Explicitly Not Authorized

This approval does not authorize:

- a third runtime attempt after this rerun;
- product default enablement;
- persistent model cache promotion;
- UI/IPC changes;
- installer, update, packaging, telemetry, release-channel, or production
  readiness changes;
- tester expansion;
- broader prompt windows;
- cloud fallback planner calls;
- Memory writes; or
- any action execution from model output.

## Role Requests

**Product.** Approve exactly one second minimal Qwen3-0.6B Fast Router runtime
rerun using the offline-tuned prompt/decoder/parser and the same fixed minimal
routing prompt window only. No real user tasks, no tester expansion, no
product default, no product SLO, and no action execution.

**Security.** Approve exactly this second approved-digest temporary
artifact/helper/runtime rerun with digest-before-load, temporary-root
containment, child-process isolation, deterministic bounded generation,
sanitized failure classification, no persistent cache, no raw output in
evidence, fail-closed stop behavior, helper shutdown, and verified cleanup.

**Release.** Approve developer-alpha rerun evidence only. Exclude installer,
update, packaging, default configuration, UI/IPC, telemetry, release-channel,
product availability, and production-readiness changes.

## Approval Lines To Provide

```text
Product: APPROVE exactly this second minimal Qwen3-0.6B Fast Router runtime rerun using the offline-tuned prompt/decoder/parser and the same fixed prompt window only
Security: APPROVE exactly this second approved-digest temporary artifact/helper/runtime rerun with deterministic bounded generation and verified cleanup
Release: APPROVE developer-alpha second rerun evidence only; no installer/update/default/UI/IPC/telemetry/release changes
```

## Approval Record

The following explicit approvals were received on 2026-08-06 in the current
task:

| Role | Status | Approval evidence |
| --- | --- | --- |
| Product | APPROVED | Exactly this second minimal Qwen3-0.6B Fast Router runtime rerun using the offline-tuned prompt/decoder/parser and the same fixed prompt window only |
| Security | APPROVED | Exactly this second approved-digest temporary artifact/helper/runtime rerun with deterministic bounded generation and verified cleanup |
| Release | APPROVED | Developer-alpha second rerun evidence only; no installer/update/default/UI/IPC/telemetry/release changes |

## Second Rerun Evidence

The approved second minimal runtime rerun completed with `status=degraded` and
`accepted=false`.

- artifact materialization: `passed`;
- SHA-256 digest verification: `passed`;
- materialized artifact count: `7`;
- helper readiness: `passed`;
- generation port wiring: `passed`;
- model artifacts accessed: `true`;
- runtime artifact download for this one window: `true`;
- routing sample count: `4`;
- cleanup: `passed`;
- default behavior changed: `false`;
- UI/IPC behavior changed: `false`;
- release behavior changed: `false`; and
- reason code: `QWEN_ROUTING_ACCEPTANCE_FAILED`.

Sanitized routing results:

| Expected intent | Actual intent | Result | Confidence band | Failure class |
| --- | --- | --- | --- | --- |
| `browser.open` | `browser.open` | intent matched but confidence below acceptance band | `low` | none |
| `localApp.open` | `browser.open` | failed | `low` | none |
| `observability.status` | `observability.status` | intent matched but confidence below acceptance band | `low` | none |
| `blocked` | `generation_failed` | failed | `none` | `ROUTER_OUTPUT_INVALID` |

No raw prompt, raw generated text, helper stdout/stderr, temp path, signed URL,
credential, stack trace, benchmark output, model internal, logits, vectors, or
user-private data was recorded.

Because this second approved rerun returned degraded, another real runtime
attempt requires a new exact-scope Product, Security, and Release approval.

## Next Step After Approval

The next work item is offline-only analysis of the remaining failures:
confidence calibration, local-app-vs-browser disambiguation, and blocked-action
JSON compliance. Qwen remains disabled outside the consumed developer-alpha
rerun window.
