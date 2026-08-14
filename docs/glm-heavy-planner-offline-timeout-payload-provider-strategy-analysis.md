# GLM Heavy Planner Offline Timeout/Payload/Provider Strategy Analysis

Recorded: 2026-08-07

## Status

`FIXTURE_ONLY_REDUCTION_COMPLETE_NO_RUNTIME_RERUN_AUTHORIZED`

This analysis uses only sanitized fourth-window evidence and local fixture
request construction. It does not access credentials, secure storage, Electron,
network, GLM endpoints, model runtime, raw prompts/responses, provider
diagnostics, files outside the repository, or any side-effect surface.

No fifth GLM runtime/API attempt is authorized by this analysis or by the
fixture-only reduction that followed it.

## Input Evidence

Fourth GLM diagnostic window:

- provider: `heavy-planner.glm`;
- model: `glm-4.7`;
- final status: `degraded`;
- accepted: `false`;
- prompt count: `3`;
- provider call count: `3`;
- transport timeouts: `3`;
- transport connection failures: `0`;
- transport unknown failures: `0`;
- HTTP authentication/rate/model/provider failure counts: all `0`;
- all three samples returned `unavailable` with
  `PROVIDER_FAILED / PROVIDER_EXECUTION_FAILED`;
- credential exposed: `false`;
- credential cleared: `true`;
- cleanup: `complete`;
- direct action/default/UI/IPC/telemetry/release behavior changed: `false`.

## Offline Analyzer

Implemented fixture-only analyzer:

- source:
  `packages/inference-adapter-glm-runtime/src/offline-strategy-analysis.ts`;
- export:
  `packages/inference-adapter-glm-runtime/src/index.ts`;
- tests:
  `packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts`.

The analyzer accepts:

- a sanitized acceptance report;
- local fixture `BrainPlannerRequest` objects;
- the fixed GLM request builder.

It returns only:

- prompt/request byte observations;
- timeout ratio;
- dominant bottleneck classification;
- parser-hardening runtime proof status;
- fixed recommendation labels;
- fixed reason codes.

It explicitly reports:

- `networkAccessed=false`;
- `credentialAccessed=false`;
- `realApiCalled=false`.

## Initial Payload Findings

Using the same three fixed prompt categories:

- total request body bytes: `2946`;
- largest request body bytes: `1009`;
- largest total message chars: `793`;
- system prompt chars: `494` for each prompt;
- max output token budget: `1024`;
- timeout budget: `45000ms`;
- timeout ratio: `1.0`.

Per-prompt observations:

| Prompt | Utterance chars | System chars | User chars | Message chars | Body bytes | Allowed tools |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| planned | 52 | 494 | 299 | 793 | 1009 | 2 |
| clarify | 2 | 494 | 233 | 727 | 941 | 1 |
| blocked | 34 | 494 | 286 | 780 | 996 | 2 |

Interpretation:

- the fixed prompt payload is already small enough that payload size alone is
  unlikely to explain three 45-second timeouts;
- the 1024-token output budget may still contribute to provider-side latency,
  so lowering it before any future window is reasonable;
- because no successful real provider response arrived in the fourth window,
  parser hardening remains fixture-proven but not runtime-proven.

## Fixture-Only Reduction

Implemented after the initial analysis:

- shortened the fixed GLM system prompt while preserving the bounded
  `BrainPlannerResult` contract;
- preserved `response_format: { type: "json_object" }`;
- preserved `temperature: 0`;
- preserved no tools, no functions, no streaming, no execution, and
  `directActionAttempted=false`;
- reduced `GLM_RUNTIME_HEAVY_PLANNER_MAX_OUTPUT_TOKENS` from `1024` to `512`;
- did not configure credentials, open secure storage, call GLM, or touch any
  runtime/API/network surface.

Reduced fixture payload findings:

- total request body bytes: `2613`;
- largest request body bytes: `898`;
- largest total message chars: `683`;
- system prompt chars: `384` for each prompt;
- max output token budget: `512`;
- timeout budget remains `45000ms`;
- timeout ratio remains historical evidence from the fourth window: `1.0`.

Per-prompt reduced observations:

| Prompt | Utterance chars | System chars | User chars | Message chars | Body bytes | Allowed tools |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| planned | 52 | 384 | 299 | 683 | 898 | 2 |
| clarify | 2 | 384 | 233 | 617 | 830 | 1 |
| blocked | 34 | 384 | 286 | 670 | 885 | 2 |

Reduction delta:

- output token budget: `1024 -> 512`;
- largest request body bytes: `1009 -> 898`;
- total request body bytes: `2946 -> 2613`;
- system prompt chars: `494 -> 384`.

## Bottleneck Classification

Dominant bottleneck:

`transport_timeout`

Reason codes:

- `GLM_OFFLINE_ANALYSIS_FIXTURE_ONLY`;
- `GLM_OFFLINE_ANALYSIS_LAST_WINDOW_NOT_ACCEPTED`;
- `GLM_OFFLINE_ANALYSIS_TIMEOUT_DOMINANT`;
- `GLM_OFFLINE_ANALYSIS_ALL_PROVIDER_CALLS_TIMED_OUT`;
- `GLM_OFFLINE_ANALYSIS_NO_INVALID_PLAN_EVIDENCE`.

This does not prove the credential, account, model, or endpoint is invalid.
The evidence only supports that the current fixed acceptance path is not
reliably returning within the approved 45-second, no-retry window.

## Strategy Decision

Do not request a fifth acceptance rerun immediately.

Before another real GLM/API window, complete offline or separately approved
work to choose one of these paths:

1. Provider-latency diagnostic path:
   draft a separate exact-scope health/latency window with one minimal
   non-planning prompt, no raw response retention, no direct action, and
   sanitized timing/category output only.
2. Payload-reduction path:
   this fixture-only reduction is complete for the next candidate window. Keep
   `max_tokens=512` unless a later approved scope explicitly changes it.
3. Provider/model strategy path:
   evaluate whether `glm-4.7` is appropriate for developer-alpha Heavy Planner
   latency, or whether Jarvis-K should use a faster GLM profile, another cloud
   heavy planner, or Qwen/rules fallback until a better provider is approved.

Recommended fixed labels:

- `do_not_rerun_without_new_exact_scope_approval`;
- `keep_qwen_rules_fallback_preserved`;
- `separate_provider_latency_or_health_window_before_acceptance`;
- `reduce_prompt_payload_before_next_window`;
- `keep_reduced_output_token_budget_before_next_window`;
- `evaluate_alternate_heavy_planner_provider_or_model`;
- `preserve_parser_hardening_but_do_not_treat_it_as_runtime_proven`.

## Product Implication

GLM Heavy Planner should not be promoted into the product spine yet. Jarvis-K
should continue to rely on deterministic rules and Qwen/rules fallback while
the cloud heavy-planner path remains default-off and diagnostic-only.

The product path can still proceed through Stage 5 Product Alpha Hardening, as
long as Stage 5 does not depend on real GLM planner availability and does not
combine product hardening with a GLM runtime/API window.

## Verification

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts
```

Results:

- GLM runtime adapter build passed;
- offline strategy analyzer tests passed: `3`;
- focused GLM provider plus analyzer tests passed: `22`.
