# Qwen Lifecycle-Backed Runtime Wiring Acceptance Approval Request

Recorded: 2026-08-07

## Status

`APPROVED_RUNTIME_WINDOW_PASSED`

This document requests a fresh exact-scope approval for exactly one local,
single-operator, developer-alpha Qwen lifecycle-backed runtime wiring
acceptance window.

This request follows:

- frozen Qwen Fast Router alpha runtime/cache evidence;
- frozen Core Host selection/fallback integration;
- approved no-runtime Qwen provider composition and lifecycle-backed wiring
  implementation; and
- existing exact seven-file SHA-256 artifact pins for `Qwen/Qwen3-0.6B`.

This approval is not a product default approval. It is not a release approval.
It does not authorize persistent cache promotion, normal Core Host startup
enablement, UI/IPC exposure, action execution, telemetry, installer, update,
release-channel, or production behavior.

## Context

Already completed:

- Qwen exact artifact digest pinning for revision
  `c1899de289a04d12100db370d81485cdf75e47ca`;
- a third approved minimal Qwen runtime/cache rerun passed all four fixed
  sanitized routing samples;
- `QwenFastRouterProvider` parses only sanitized intent candidates through an
  injected bounded generation port;
- `CoreHostQwenFastRouterGenerationPort` maps generation calls to the bounded
  helper protocol;
- Core runtime selection/fallback reports accepted, fallback, blocked, and
  unavailable router decisions;
- no-runtime `createCoreHostQwenFastRouterComposition` fails closed unless
  explicit enablement, digest approval, lifecycle readiness, runtime port
  readiness, selection policy readiness, default-off preservation, and
  fallback preservation gates are true; and
- Core Host startup still does not instantiate the real Qwen provider.

The next evidence window should prove that the approved composition path can
be exercised with real temporary artifact/helper/runtime wiring while still
remaining bounded, diagnosable, and reversible.

## Exact Approval Requested

Approve exactly one local developer-alpha runtime wiring acceptance window
using only:

- the same immutable Qwen revision:
  `c1899de289a04d12100db370d81485cdf75e47ca`;
- the same approved seven-file SHA-256 artifact set;
- one unique system-temporary root;
- temporary artifact materialization or approved remote fetch of only those
  seven artifacts;
- SHA-256 verification before any model load;
- one temporary file-backed lifecycle/cache root under the same unique
  temporary root;
- simulated or bounded lifecycle-ready marking for the exact verified Qwen
  model version inside that temporary root only;
- one supervised local Transformers helper process;
- one `CoreHostQwenFastRouterGenerationPort`;
- one `QwenFastRouterProvider` created through
  `createCoreHostQwenFastRouterComposition` only after all gates are true;
- Core runtime selection/fallback path using the composed provider;
- the same fixed four routing prompts only; and
- sanitized pass/degraded/blocked evidence plus verified cleanup.

The window must end after the fixed evidence is captured and cleanup is
verified, or immediately at the first stop condition.

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
cache entry, fallback model, unpinned upstream file, or new model revision may
be introduced.

## Runtime Wiring Bounds

The approved window may only:

- verify exact Product/Security/Release approval lines before any runtime
  action;
- create one unique system-temporary root;
- redirect all child-process cache variables under that root;
- materialize or fetch only the approved seven artifacts;
- verify all artifact SHA-256 digests before helper load;
- prepare a temporary lifecycle/cache state under the same root;
- mark lifecycle readiness only for the exact verified Qwen model version and
  only for this window;
- start one supervised helper process;
- load Qwen from the verified temporary artifact directory with
  `local_files_only=true` and `trust_remote_code=false`;
- create one generation port and one provider through the approved composition
  factory;
- confirm composition gates are all true before provider use;
- run deterministic bounded generation with `temperature: 0` and
  `maxOutputChars <= 2000`;
- route only the same four fixed prompts:
  `browser.open`, `localApp.open`, `observability.status`, and `blocked`;
- report only sanitized routing and selection/fallback evidence; and
- shut down the helper and delete the temporary root.

## Required Safety Invariants

The window must preserve all of these invariants:

- Qwen remains default-off outside this one window;
- normal Core Host startup remains unchanged;
- `JARVIS_K_ENABLE_QWEN_FAST_ROUTER=1` alone is not sufficient to route
  through Qwen;
- composition requires explicit enablement, digest approval, lifecycle
  readiness, runtime generation-port readiness, selection policy readiness,
  default-off preservation, and fallback preservation;
- deterministic rules/fixture routing remain available as fallback;
- no direct action execution is triggered by Qwen output;
- no Memory write, vector write, cloud planner call, browser/app action,
  shell/process/filesystem/network/tool/OCR/voice action is triggered by Qwen
  output;
- no persistent model cache, installer cache, update cache, release artifact,
  telemetry file, or cross-run cache is created;
- helper failure, generation failure, malformed output, low confidence,
  unsupported intent, allowlist mismatch, lifecycle uncertainty, or cleanup
  uncertainty fails closed; and
- reports contain no raw prompts, raw generated text, helper stdout/stderr,
  temp paths, signed URLs, credentials, tokens, stack traces, model internals,
  logits, vectors, benchmarks, or user-private data.

## Stop Conditions

Stop immediately and do not continue to another prompt, helper, model load, or
rerun if any of these occur:

- any Product/Security/Release approval line is missing or differs from this
  exact scope;
- the revision or artifact digest set differs from the approved set;
- any artifact materialization, fetch, copy, digest verification, lifecycle
  preparation, helper startup, helper load, generation, shutdown, or cleanup
  step fails;
- any write escapes the unique system-temporary root;
- persistent cache use is detected outside the temporary root;
- composition gates are not all true before provider use;
- the provider is constructed outside `createCoreHostQwenFastRouterComposition`;
- normal Core Host startup is changed to instantiate real Qwen;
- more than the fixed four prompt window is attempted;
- direct action execution is attempted;
- a report would expose raw prompt, raw generated text, helper diagnostics,
  private path, signed URL, credential, stack trace, model internal, logits,
  vector, benchmark output, or user-private data; or
- cleanup is incomplete or uncertain.

`degraded` and `blocked` are stopped-run evidence, not acceptance, and require
a fresh exact-scope approval before any rerun.

## Sanitized Evidence Contract

The final evidence may contain only:

- scope id;
- status: `passed`, `degraded`, or `blocked`;
- accepted boolean;
- model id and immutable revision;
- artifact count and digest verification status;
- temporary lifecycle/cache gate statuses;
- helper phase statuses;
- composition gate statuses;
- provider status;
- routing sample count;
- per-sample expected/actual intent labels, pass booleans, confidence band,
  selection/fallback status, and fixed failure class;
- booleans for default behavior changed, UI/IPC behavior changed, direct
  action attempted, persistent cache detected, and release behavior changed;
- cleanup status; and
- fixed reason codes.

The evidence must not contain raw prompts, raw generated text, raw helper
stdout/stderr, temp paths, signed URLs, credentials, tokens, stack traces,
model internals, logits, vectors, benchmarks, source text beyond fixed intent
labels, private user data, or full diagnostic payloads.

## Explicitly Not Authorized

This approval does not authorize:

- a second lifecycle-backed runtime wiring attempt after this window;
- broader prompt windows or tester expansion;
- new artifacts, model revisions, model variants, quantized models, adapters,
  shards, dependencies, or fallback models;
- persistent model cache promotion;
- product default enablement of Qwen;
- normal Core Host startup routing through real Qwen;
- Desktop IPC, preload, UI, settings, telemetry, installer, update,
  packaging, release-channel, or production-readiness behavior;
- Memory writes, vector writes, cloud planner fallback, browser/local-app
  execution, shell/process/filesystem/network/tool execution, OCR, voice, or
  action execution from model output;
- warm reuse as a product behavior; or
- retaining temporary artifacts, helper workspace, lifecycle cache, or runtime
  cache after cleanup.

## Role Requests

**Product.** Approve exactly one developer-alpha Qwen lifecycle-backed runtime
wiring acceptance window using the approved seven-file digest set, temporary
lifecycle/cache readiness, one helper, one composition-created provider, and
the same fixed four routing prompts only. No default behavior, no real user
tasks, no tester expansion, no product SLO, and no action execution.

**Security.** Approve exactly this one-window approved-digest temporary
artifact/helper/runtime/lifecycle wiring scope. Require digest-before-load,
temporary-root containment, child-process isolation, `local_files_only`,
`trust_remote_code=false`, fail-closed composition gates, deterministic
bounded generation, sanitized selection/fallback evidence, no persistent
cache, no raw output in evidence, helper shutdown, and verified cleanup.

**Release.** Approve developer-alpha runtime wiring evidence only. Exclude
installer, update, packaging, default configuration, UI/IPC, telemetry,
release-channel, product availability, persistent cache policy, lifecycle
policy, and production-readiness changes.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window Qwen lifecycle-backed runtime wiring acceptance using approved digests, temporary lifecycle/cache readiness, one helper, one composition-created provider, and the same fixed four prompts only
Security: APPROVE exactly this approved-digest temporary artifact/helper/runtime/lifecycle wiring scope with fail-closed composition gates, deterministic bounded generation, sanitized evidence, and verified cleanup
Release: APPROVE developer-alpha runtime wiring evidence only; no installer/update/default/UI/IPC/telemetry/persistent-cache/lifecycle-policy/release changes
```

## Next Step After Approval

After all three exact approval lines are received, prepare or update a bounded
acceptance runner for this lifecycle-backed composition path, run only the
approved one-window acceptance, then record sanitized evidence and cleanup
status. Do not expand prompts, testers, artifacts, defaults, UI/IPC, or
release behavior.

## Approval Record

The following explicit approvals were received on 2026-08-07 in the current
task:

| Role | Status | Approval evidence |
| --- | --- | --- |
| Product | APPROVED | Exactly this one-window Qwen lifecycle-backed runtime wiring acceptance using approved digests, temporary lifecycle/cache readiness, one helper, one composition-created provider, and the same fixed four prompts only |
| Security | APPROVED | Exactly this approved-digest temporary artifact/helper/runtime/lifecycle wiring scope with fail-closed composition gates, deterministic bounded generation, sanitized evidence, and verified cleanup |
| Release | APPROVED | Developer-alpha runtime wiring evidence only; no installer/update/default/UI/IPC/telemetry/persistent-cache/lifecycle-policy/release changes |

## Runtime Wiring Evidence

The approved lifecycle-backed runtime wiring acceptance window completed with
`status=passed` and `accepted=true`.

- artifact materialization: `passed`;
- SHA-256 digest verification: `passed`;
- materialized artifact count: `7`;
- temporary lifecycle/cache readiness: `passed`;
- lifecycle model-ready gate: `true`;
- persistent cache detected: `false`;
- helper readiness: `passed`;
- generation port wiring: `passed`;
- model artifacts accessed: `true`;
- runtime artifact download for this one window: `true`;
- composition status: `available`;
- composition reason codes: `QWEN_COMPOSITION_AVAILABLE`;
- composition gate explicit enablement: `true`;
- composition gate artifact digest approved: `true`;
- composition gate model lifecycle ready: `true`;
- composition gate runtime generation port ready: `true`;
- composition gate selection policy ready: `true`;
- composition gate default-off preserved: `true`;
- composition gate fallback preserved: `true`;
- routing sample count: `4`;
- cleanup: `passed`;
- default behavior changed: `false`;
- UI/IPC behavior changed: `false`;
- direct action attempted: `false`;
- release behavior changed: `false`; and
- reason codes: none.

Sanitized routing and selection/fallback results:

| Expected intent | Actual intent | Result | Confidence band | Selection status | Failure class |
| --- | --- | --- | --- | --- | --- |
| `browser.open` | `browser.open` | passed | `accepted` | `accepted` | none |
| `localApp.open` | `localApp.open` | passed | `accepted` | `accepted` | none |
| `observability.status` | `observability.status` | passed | `accepted` | `accepted` | none |
| `blocked` | `blocked` | passed | `accepted` | `blocked` | `UNSAFE_OR_BLOCKED` |

No raw prompt, raw generated text, helper stdout/stderr, temp path, signed URL,
credential, token, stack trace, benchmark output, model internal, logits,
vectors, full diagnostic payload, or user-private data was recorded.

This passed developer-alpha evidence does not authorize another runtime
window, product default enablement, persistent cache promotion, UI/IPC
behavior, action execution, installer, update, telemetry, release-channel,
lifecycle policy, cache policy, or production-readiness changes.
