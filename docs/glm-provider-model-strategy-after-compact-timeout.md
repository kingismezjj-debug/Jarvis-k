# GLM Provider/Model Strategy After Compact Timeout

Recorded: 2026-08-07

## Status

`FIXTURE_ONLY_IMPLEMENTED`

This strategy follows the consumed compact
`standard_paas_v4 / glm-4.7 / compact_json_object_128` health window. That
window timed out after `20014ms`.

The earlier shape-only `64` token standard-origin health window reached the
provider quickly (`1783ms`) but returned `finishReasonShape=length` with
`contentShape=empty_string`. Together, the evidence says:

- the standard origin is reachable and credentialed;
- repeated `glm-4.7` minimal health probes are not useful;
- increasing the health output budget from `64` to `128` did not help;
- Heavy Planner acceptance should not proceed on GLM.

This strategy is fixture-only. It does not authorize credential
configuration, secure-store access, GLM/API calls, runtime probes, provider
expansion, default changes, UI/IPC, telemetry, packaging, installer/update, or
release behavior.

## Implementation

Added:

- `packages/inference-adapter-glm-runtime/src/provider-model-strategy.ts`;
- `packages/inference-adapter-glm-runtime/test/provider-model-strategy.test.ts`.

The analyzer uses only sanitized evidence and existing fixed candidate
metadata from `model-origin-strategy`.

## Current Evidence Input

The fixture strategy records these booleans:

- coding-origin Heavy Planner evidence timed out: `true`;
- standard `glm-4.7` health reached provider: `true`;
- standard `glm-4.7` health returned empty-content length finish: `true`;
- standard `glm-4.7` compact `128` health timed out: `true`.

No raw prompt, response, assistant content, header, credential, transport
diagnostic, stack trace, or private path is used.

## Candidate Decision

The fixed standard-origin candidate list remains:

- `glm-4.7`;
- `glm-4.7-flash`;
- `glm-4.7-flashx`;
- `glm-5-turbo`;
- `glm-5.2`.

The strategy now assigns:

- `glm-4.7`: `current_baseline_deprioritized`;
- `glm-4.7-flash`: `next_low_latency_health_candidate`;
- `glm-4.7-flashx`: `secondary_low_latency_health_candidate`;
- `glm-5-turbo`: `deferred_quality_candidate`;
- `glm-5.2`: `deferred_quality_candidate`.

Selected next candidate:

```text
standard_paas_v4 / glm-4.7-flash
```

## Recommendations

- Do not rerun `standard_paas_v4 / glm-4.7` health.
- Do not proceed to GLM Heavy Planner acceptance.
- Keep `standard_paas_v4` origin fixed.
- Keep one request and no retries.
- Keep JSON-object minimal health probe.
- Preserve Qwen/rules fallback.
- Require a new exact-scope approval for any real provider probe.
- If GLM continues, prefer the low-latency `glm-4.7-flash` candidate first.
- Defer GLM-5 quality candidates until a minimal low-latency health probe
  succeeds.

## Verification

Executed locally with no credential, secure-store, network, Electron
diagnostic, or GLM API access:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider-model-strategy.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts packages/inference-adapter-glm-runtime/test/health-prompt-output-bound-strategy.test.ts
```

Results:

- GLM runtime adapter build passed;
- focused provider/model, model-origin, and prompt/output strategy tests
  passed: `13`.

## Next Approval Boundary

If GLM investigation continues, the next real provider step must be a new
exact-scope Product/Security/Release approval. The recommended window is one
minimal `standard_paas_v4 / glm-4.7-flash` health probe:

- fixed provider: `heavy-planner.glm`;
- fixed profile/model: `standard_paas_v4 / glm-4.7-flash`;
- fixed endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- one fresh secure-store credential;
- at most one non-streaming minimal health request;
- no retries;
- bounded output tokens;
- sanitized health category/shape metadata only;
- no Heavy Planner acceptance;
- no BrainPlan parsing/evaluation;
- no raw request/response/header/content/credential persistence;
- verified credential cleanup.

Do not run that window until a new exact approval is recorded.
