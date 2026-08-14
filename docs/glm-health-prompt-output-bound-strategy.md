# GLM Health Prompt/Output-Bound Strategy

Recorded: 2026-08-07

## Status

`FIXTURE_ONLY_IMPLEMENTED`

This strategy follows the consumed shape-only
`standard_paas_v4 / glm-4.7` health diagnostic. That window captured a fast
provider response with:

- `finishReasonShape=length`;
- `contentShape=empty_string`;
- `contentLengthBucket=zero`;
- `jsonExtractionShape=not_attempted`;
- `healthSignalShape=missing_health_signal`;
- all unsafe signal counts `0`.

The endpoint, credential path, cleanup, authentication, rate limit, model
availability, provider availability, and network path all looked healthy in
the sanitized evidence. The local problem is now a prompt/output-bound response
shape: the provider returned an assistant chat-completion envelope but no
content to parse.

## Implementation

Added:

- `packages/inference-adapter-glm-runtime/src/health-prompt-output-bound-strategy.ts`;
- `packages/inference-adapter-glm-runtime/test/health-prompt-output-bound-strategy.test.ts`.

The strategy is fixture-only. It compares bounded local health prompt profiles
without credentials, secure-store access, Electron, network, GLM API calls,
raw provider responses, UI/IPC, telemetry, defaults, or release behavior.

## Candidate Profiles

The current profile remains recorded for comparison:

- `current_json_object_64`;
- response format: `json_object`;
- max output tokens: `64`;
- expected goal: baseline reproduction.

The recommended next fixture candidate is:

- `compact_json_object_128`;
- response format: `json_object`;
- max output tokens: `128`;
- shorter system/user payload than the current profile;
- expected goal: avoid `finish_reason=length` with empty content.

The fallback candidate, if fixture strategy later needs a larger bounded
window, is:

- `explicit_json_only_256`;
- response format: `json_object`;
- max output tokens: `256`;
- explicit JSON-only instruction;
- expected goal: capture valid minimal JSON.

## Recommendation

For the observed `length + empty_string + missing_health_signal` shape, the
strategy selects:

```text
compact_json_object_128
```

Reason codes:

- `GLM_HEALTH_PROMPT_OUTPUT_STRATEGY_FIXTURE_ONLY`;
- `GLM_HEALTH_PROMPT_OUTPUT_SELECTED_COMPACT_JSON_OBJECT_128`;
- `GLM_HEALTH_PROMPT_OUTPUT_OBSERVED_LENGTH_FINISH`;
- `GLM_HEALTH_PROMPT_OUTPUT_OBSERVED_EMPTY_CONTENT`;
- `GLM_HEALTH_PROMPT_OUTPUT_OBSERVED_MISSING_SIGNAL`.

Recommendations:

- do not rerun without a new exact-scope approval;
- keep `standard_paas_v4 / glm-4.7` fixed;
- keep one request and no retries;
- increase the tiny health output budget before the next window;
- reduce prompt payload before the next window;
- make the JSON instruction more explicit before the next window;
- keep fail-closed behavior for empty-content length finishes;
- prefer another shape-only/minimal health window before parser acceptance;
- do not proceed to Heavy Planner acceptance.

## Verification

Executed locally with no credential, secure-store, network, Electron
diagnostic, or GLM API access:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/health-prompt-output-bound-strategy.test.ts packages/inference-adapter-glm-runtime/test/health-response-shape-strategy.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
```

Results:

- GLM runtime adapter build passed;
- focused GLM health prompt/output, response-shape, and parser tests passed:
  `38`.

## Next Approval Boundary

If GLM investigation continues, the next real provider step must be a new
exact-scope Product/Security/Release approval. The recommended exact window is
one `compact_json_object_128` standard-origin health diagnostic:

- fixed provider: `heavy-planner.glm`;
- fixed profile/model: `standard_paas_v4 / glm-4.7`;
- fixed endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- one fresh secure-store credential;
- at most one non-streaming minimal health request;
- no retries;
- output budget: `128` max tokens;
- shorter compact JSON-only health prompt;
- sanitized health category/shape metadata only;
- no Heavy Planner acceptance;
- no BrainPlan parsing/evaluation;
- no raw request/response/header/content/credential persistence;
- verified credential cleanup.

Do not run that window until a new exact approval is recorded.
