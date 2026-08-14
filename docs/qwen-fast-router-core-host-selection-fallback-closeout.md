# Qwen Fast Router Core Host Selection/Fallback Closeout and Freeze

Recorded on 2026-08-07 after the approved fixture-only Core Host
selection/fallback integration passed.

## Status

`FROZEN_ALPHA_CLOSED`

The Qwen Fast Router Core Host selection/fallback scope is closed for the
current developer-alpha fixture-only integration. The provider-neutral
selection report, deterministic rules fallback, failure classification, and
fixture-only regression coverage are evidence-complete. This freeze does not
claim production readiness and does not authorize real Qwen provider
composition, runtime/cache access, persistent model cache promotion, UI/IPC,
telemetry, default behavior, action execution, installer, update, release
channel, or production behavior.

## Closed Scope

The completed selection/fallback surface includes:

- optional sanitized `routerSelection` evidence on `BrainCommandResult`;
- fixed selection statuses: `accepted`, `fallback`, `blocked`, and
  `unavailable`;
- fixed reason codes for provider accepted, provider unavailable, preflight
  blocked, provider failed, invalid result, missing candidate, unsupported
  intent, low confidence, allowlist mismatch, and unsafe/blocked;
- fixed failure classes for the same bounded failure surface;
- `directActionAttempted=false` enforced by contract for selection reports;
- Core runtime fallback to deterministic rules when a provider is absent,
  invalid, throwing, unsupported, allowlist-mismatched, or low-confidence;
- accepted provider candidates still pass BrainCommand schema validation,
  confidence threshold, intent allowlist, slot normalization, and existing
  dispatch safety gates; and
- blocked provider candidates do not dispatch browser or local-app actions.

The main implementation surfaces are:

- `packages/contracts/src/protocol.ts`;
- `packages/contracts/test/protocol.test.ts`;
- `packages/core/src/runtime.ts`; and
- `packages/core/test/runtime.test.ts`.

## Evidence Summary

The approved implementation completed without Qwen artifact, helper,
runtime/cache, UI/IPC, telemetry, default, installer, update, or release
behavior changes.

Focused verification passed:

- `npm run build:contracts`;
- `npm run build:core`;
- `npm run build:core-host`;
- `vitest packages/contracts/test/protocol.test.ts`: `28 passed`;
- `vitest packages/core/test/runtime.test.ts`: `51 passed`;
- `vitest apps/core-host/test/qwen-fast-router-wiring.test.ts`: `1 passed`;
- `npm run check:boundaries`; and
- `npm run check:sensitive-artifacts`.

The same source and documentation changes were synced to `E:\Jarvis-K`, where
the same focused builds, tests, boundary check, and sensitive-artifact guard
passed.

The Core Host startup guard still verifies that startup does not instantiate
`QwenFastRouterProvider`. No real Qwen model was run, no artifact was
materialized, no helper was started, and no runtime/cache acceptance command
was executed.

The sanitized evidence retained no raw prompts, raw model output, helper
diagnostics, private paths, URLs, credentials, stack traces, model internals,
logits, vectors, benchmarks, or user-private data.

## Freeze Rules

While this scope is frozen, do not:

- run real Qwen generation, helper startup, artifact materialization, or
  runtime/cache acceptance under the consumed selection/fallback approval;
- instantiate `QwenFastRouterProvider` from normal Core Host startup;
- make Qwen product routing default-on or selectable by one environment flag;
- promote temporary Qwen artifacts into a persistent model cache;
- add Desktop IPC, preload, UI controls, settings toggles, telemetry,
  installer, update, release-channel, or production behavior;
- execute browser, local-app, shell, filesystem, network, Memory write, tool,
  OCR, voice, or planner actions directly from model/router output;
- weaken deterministic rules or fixture fallback availability; or
- broaden reports to include raw prompts, raw model output, diagnostics, paths,
  URLs, credentials, stack traces, model internals, vectors, or user-private
  data.

Any real provider composition, lifecycle-backed runtime wiring, runtime/cache
window, persistent cache, UI/IPC exposure, action execution, tester expansion,
release behavior, or change to the frozen selection/fallback contract requires
a new exact-scope Product, Security, and Release approval.

## Product and Release Disposition

Core Host selection/fallback is approved only as internal developer-alpha
fixture evidence. It is not a product default, not a public tester workflow,
not a production router, not a release artifact, and not a user-facing model
setting.

The current product decision is to preserve the selection/fallback contract as
the guarded spine for later Qwen composition. It should make real-provider
integration diagnosable and reversible, but deterministic rules and fixture
routing remain the safe fallback until a later approved runtime scope
intentionally opens real Qwen usage.

## Next Productization Route

The next possible step is a separate Qwen provider composition and
lifecycle-backed runtime wiring scope. That scope should define:

- how Core Host composes `QwenFastRouterProvider` only behind explicit gates;
- how model lifecycle readiness and exact artifact digest approval are checked
  before a generation port is considered runtime-ready;
- how helper session creation, reuse, release, and rollback are represented
  without changing defaults;
- how selection/fallback evidence is preserved when Qwen is available,
  unavailable, degraded, low-confidence, malformed, blocked, or unsafe;
- how deterministic rules remain the fail-closed fallback; and
- what separate runtime/cache acceptance approval is required before any real
  helper or model execution.

That next scope must not silently enable Qwen by default, promote persistent
cache, add UI/IPC, run real Qwen without a separate one-window approval,
execute actions from model output, or change release behavior.

## Final Freeze Statement

Qwen Fast Router Core Host selection/fallback integration is complete for the
fixture-only developer-alpha scope and now frozen. Keep the contract, runtime
selection report, deterministic fallback behavior, Core Host startup guard,
and fixture tests available for regression. Stop here until the next approved
Qwen provider composition and lifecycle-backed wiring scope is explicitly
opened.
