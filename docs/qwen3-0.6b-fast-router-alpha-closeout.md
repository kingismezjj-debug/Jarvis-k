# Qwen3-0.6B Fast Router Alpha Closeout and Freeze

Recorded on 2026-08-07 after the approved third minimal runtime/cache rerun
passed.

## Status

`FROZEN_ALPHA_CLOSED`

The Qwen3-0.6B Fast Router alpha is closed for the current developer-alpha
scope. Its artifact pinning, generation helper protocol extension,
runtime-neutral adapter, deterministic parser/post-processing, Core Host
diagnostic registration, and one passed minimal runtime/cache acceptance
window are evidence-complete. This freeze does not claim production readiness
and does not authorize default enablement, persistent cache promotion, Core
Host product routing, UI/IPC exposure, action execution, telemetry, installer,
update, release-channel, or production behavior.

## Closed Scope

The completed Qwen Fast Router alpha surface includes:

- revision-pinned artifact metadata for `Qwen/Qwen3-0.6B` at
  `c1899de289a04d12100db370d81485cdf75e47ca`;
- an approved seven-file SHA-256 artifact set;
- a default-off `intent_router` adapter that accepts an injected bounded
  generation port and returns only sanitized `IntentRoutingResult` candidates;
- a prompt and parser contract for compact JSON intent candidates;
- balanced JSON extraction, thinking-block stripping, alias normalization,
  confidence parsing, slot sanitization, and unsupported-intent rejection;
- deterministic confidence calibration for strong browser, local application,
  and diagnostic-status utterances;
- deterministic local-app-vs-browser disambiguation for known app-launch
  requests;
- fail-closed blocked-action handling from the original utterance when model
  output is malformed or unsafe;
- a local Transformers helper `generate` protocol path gated by explicit
  helper readiness and runtime/cache approval variables;
- a Core Host generation-port adapter that is not wired into startup; and
- Core Host diagnostic registration that reports Qwen as unavailable unless
  future gates explicitly provide runtime readiness, artifact approval, and
  model lifecycle readiness.

The main implementation surfaces are:

- `packages/inference-adapter-qwen-router/src/artifact-plan.ts`;
- `packages/inference-adapter-qwen-router/src/prompt.ts`;
- `packages/inference-adapter-qwen-router/src/provider.ts`;
- `packages/inference-runtime-transformers-local/src/runtime-helper-protocol.ts`;
- `packages/inference-runtime-transformers-local/src/runtime-helper-client.ts`;
- `packages/inference-runtime-transformers-local/runtime/transformers_helper.py`;
- `apps/core-host/src/qwen-fast-router-generation-port.ts`; and
- `tests/qwen-fast-router-runtime-cache-acceptance.mjs`.

## Acceptance Evidence

The third approved minimal runtime/cache rerun passed after explicit Product,
Security, and Release approval:

- the same immutable Qwen revision was used;
- the same seven approved artifacts were materialized in a unique
  system-temporary root;
- SHA-256 digest verification passed before helper load;
- helper readiness passed;
- generation port wiring passed;
- routing sample count was `4`;
- all fixed minimal routing samples passed with accepted confidence;
- the sanitized results were `browser.open`, `localApp.open`,
  `observability.status`, and `blocked`;
- cleanup passed; and
- reason codes were empty.

The sanitized evidence retained no raw prompts, raw generated text, helper
stdout/stderr, temp paths, signed URLs, credentials, tokens, stack traces,
model internals, logits, vectors, benchmarks, or user-private data.

Local verification after closeout evidence passed:

- Qwen adapter build;
- local Transformers runtime build;
- Qwen provider tests;
- dependency boundary check; and
- sensitive-artifact guard.

## Freeze Rules

While this alpha is frozen, do not:

- run another real Qwen runtime/cache/materialization/helper window under the
  consumed approvals;
- fetch or materialize a new Qwen revision, artifact, shard, quantized model,
  adapter, manifest, dependency, or digest;
- reuse the approved temporary artifact root, helper workspace, or runtime
  cache as a cross-run cache;
- promote Qwen artifacts into a persistent product cache or installer/update
  location;
- instantiate `QwenFastRouterProvider` from Core Host startup or normal
  product command handling without a new exact-scope approval;
- change product default routing behavior, provider visibility, Desktop IPC,
  UI controls, preload exposure, telemetry, packaging, installer, update, or
  release-channel behavior;
- use Qwen output to execute browser, local app, shell, filesystem, network,
  Memory write, tool, OCR, voice, or planner actions directly; or
- broaden evidence to include raw prompts, model output, diagnostics, paths,
  URLs, credentials, stack traces, model internals, vectors, or benchmarks.

Any runtime rerun, persistent cache, Core Host selection/fallback product
integration, UI/IPC exposure, action execution, tester expansion, release
behavior, or change to the frozen adapter/runtime contract requires a new
exact-scope Product, Security, and Release approval.

## Product and Release Disposition

Qwen Fast Router alpha is approved only as internal developer-alpha evidence.
It is not a product default, not a public tester workflow, not a production
planner, not a release artifact, and not a user-facing model lifecycle/cache
feature.

The current product decision is to preserve Qwen as a guarded fast-router
foundation. It may inform the next Core Host selection/fallback integration
scope, but that scope must remain separately approved and must keep rule
routing as the fail-closed fallback until product behavior is intentionally
opened.

## Next Productization Route

The next work item is a separate Core Host selection/fallback integration
scope. That scope should define:

- how Core Host chooses between deterministic rules, fixture router, and Qwen
  provider candidates;
- minimum confidence and malformed-output fallback behavior;
- how unavailable, degraded, low-confidence, blocked, or unsafe Qwen results
  fall back to rules without executing actions directly;
- sanitized provider-selection evidence and fixed failure classes;
- rollback behavior that restores fixture/rule routing; and
- explicit gates for any future real runtime/cache use.

This next integration requires fresh Product, Security, and Release approval.
It must not unfreeze Qwen runtime/cache alpha, silently enable Qwen by
default, promote persistent cache, add UI/IPC, execute actions from model
output, or change release behavior.

## Final Freeze Statement

Qwen3-0.6B Fast Router alpha is complete for the developer-alpha runtime/cache
evidence scope and now frozen. Keep the adapter, parser, deterministic
post-processing, artifact pins, helper protocol, acceptance runner, and Core
Host diagnostic registration available for regression. Stop here until the
next approved Core Host selection/fallback integration scope is explicitly
opened.
