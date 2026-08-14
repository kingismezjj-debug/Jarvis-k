# Qwen Lifecycle-Backed Runtime Wiring Closeout and Freeze

Recorded on 2026-08-07 after the approved one-window Qwen
lifecycle-backed runtime wiring acceptance passed.

## Status

`FROZEN_ALPHA_CLOSED`

The Qwen lifecycle-backed runtime wiring scope is closed for the current
developer-alpha evidence window. The approved temporary artifact, lifecycle,
helper, generation-port, and Core Host composition path has been exercised
once with sanitized evidence and verified cleanup.

This closeout does not claim product readiness. It does not authorize another
runtime window, default Qwen routing, persistent cache promotion, UI/IPC
exposure, telemetry, action execution, installer, update, release-channel, or
production behavior.

## Closed Scope

The accepted runtime wiring window proved exactly this path:

- the pinned `Qwen/Qwen3-0.6B` revision
  `c1899de289a04d12100db370d81485cdf75e47ca`;
- the approved seven-file SHA-256 artifact set only;
- temporary artifact materialization inside one system-temporary root;
- digest verification before helper load;
- temporary lifecycle/cache readiness under the same temporary root;
- one supervised local Transformers helper;
- one `CoreHostQwenFastRouterGenerationPort`;
- one `QwenFastRouterProvider` created through
  `createCoreHostQwenFastRouterComposition`;
- all composition gates true before provider use;
- deterministic bounded generation for the same fixed four prompt window;
- Core runtime selection/fallback evidence preserved; and
- helper shutdown plus verified cleanup.

The fixed prompt window covered:

- `browser.open`;
- `localApp.open`;
- `observability.status`; and
- `blocked`.

No browser, local-app, shell, filesystem, network, Memory write, vector write,
tool, OCR, voice, cloud-planner, UI/IPC, telemetry, installer, update, or
release behavior was triggered by Qwen output.

## Evidence Summary

The approved lifecycle-backed runtime wiring acceptance completed with
`status=passed` and `accepted=true`.

Sanitized evidence recorded:

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
- composition reason code: `QWEN_COMPOSITION_AVAILABLE`;
- all composition gates: `true`;
- routing sample count: `4`;
- cleanup: `passed`;
- default behavior changed: `false`;
- UI/IPC behavior changed: `false`;
- direct action attempted: `false`;
- release behavior changed: `false`; and
- reason codes: none.

Sanitized routing results:

| Expected intent | Actual intent | Result | Confidence band | Selection status | Failure class |
| --- | --- | --- | --- | --- | --- |
| `browser.open` | `browser.open` | passed | `accepted` | `accepted` | none |
| `localApp.open` | `localApp.open` | passed | `accepted` | `accepted` | none |
| `observability.status` | `observability.status` | passed | `accepted` | `accepted` | none |
| `blocked` | `blocked` | passed | `accepted` | `blocked` | `UNSAFE_OR_BLOCKED` |

No raw prompt, raw generated text, helper stdout/stderr, temp path, signed URL,
credential, token, stack trace, benchmark output, model internal, logits,
vectors, full diagnostic payload, or user-private data was recorded.

## Freeze Rules

While this scope is frozen, do not:

- rerun Qwen lifecycle-backed runtime wiring under the consumed approval;
- expand the fixed prompt window or tester count;
- introduce a different model revision, artifact, shard, adapter, quantized
  model, dependency, fallback model, or unpinned upstream file;
- promote temporary artifacts into a persistent model cache;
- enable Qwen as a product default or normal Core Host startup path;
- make one environment variable sufficient to route product traffic through
  Qwen;
- add Desktop IPC, preload, settings, UI, telemetry, installer, update,
  packaging, release-channel, or production behavior;
- execute browser, local-app, shell, filesystem, network, Memory write,
  vector write, tool, OCR, voice, or planner actions directly from Qwen
  output;
- retain temporary artifacts, helper workspace, lifecycle cache, or runtime
  cache after the accepted window; or
- broaden reports to include raw prompts, raw generated text, helper
  diagnostics, private paths, URLs, credentials, stack traces, model
  internals, vectors, benchmarks, or user-private data.

Any new runtime/cache window, persistent-cache policy, lifecycle policy,
product-default behavior, UI/IPC behavior, planner/API fallback, action
execution, tester expansion, or release behavior requires a fresh exact-scope
Product, Security, and Release approval.

## Product and Release Disposition

Qwen3-0.6B Fast Router remains a developer-alpha, default-off foreground
router candidate. The runtime wiring evidence shows the approved local model
can be composed through lifecycle/cache gates and still fall back through the
Core runtime selection contract.

The product decision is to freeze the Qwen runtime wiring proof and move the
brain spine forward by adding a separate heavy-planner fallback contract. The
planner must return bounded plans only. The executor and existing safety gates
remain the sole side-effect actors.

## Next Productization Route

Return to `docs/brain-runtime-spine-upgrade-plan.md` and open Stage 3:
Heavy Planner Fallback.

The next approval should be fixture/simulated and no-runtime. It should define:

- a provider-neutral heavy planner port;
- bounded planner request and result contracts;
- a bounded `BrainPlan` shape;
- fixture planner behavior for complex, fuzzy, low-confidence, and clarify
  cases;
- Core runtime hooks that escalate from Qwen/rules to planner only as a
  report-shaped decision;
- secure-key report shapes without exposing raw credentials;
- executor-only side effects; and
- confirmation requirements for medium/high-risk actions.

That Stage 3 scope must not authorize real GLM, ChatGPT, or other API calls;
real credential storage; network access; tool execution; UI/IPC; telemetry;
installer/update/release changes; or product-default behavior.

## Final Freeze Statement

Qwen lifecycle-backed runtime wiring is evidence-complete for this
developer-alpha one-window acceptance and is now frozen. Keep the artifact
pins, composition gates, selection/fallback contract, acceptance runner, and
sanitized evidence available for regression, but stop here until a new
exact-scope approval explicitly opens a later Qwen runtime or product scope.
