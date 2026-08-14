# GLM Health Response-Shape Strategy

Recorded: 2026-08-07

## Status

`FIXTURE_ONLY_IMPLEMENTED`

This strategy exists because the parser-normalized
`standard_paas_v4 / glm-4.7` minimal health rerun reached the fixed standard
endpoint quickly but still classified the sanitized provider result as
`invalid_minimal_response`.

The implementation is fixture-only. It does not authorize or perform GLM
credential access, secure-store access, network/API calls, Heavy Planner
acceptance, BrainPlan evaluation, UI/IPC changes, telemetry, defaults,
packaging, installer/update, or release behavior.

## Implementation

Added:

- `packages/inference-adapter-glm-runtime/src/health-response-shape-strategy.ts`
- `packages/inference-adapter-glm-runtime/test/health-response-shape-strategy.test.ts`

The classifier produces only sanitized structure metadata:

- top-level shape;
- `choices` envelope shape;
- first-choice/message shape;
- `finish_reason` category;
- content category;
- content length bucket;
- JSON extraction category;
- health signal category;
- unsafe signal counts;
- bounded recommendations and reason codes.

It never returns provider body text, assistant content, headers, credentials,
raw request/response, stack traces, endpoint override values, or transport
diagnostics.

## Covered Fixture Shapes

The fixture strategy covers:

- standard chat completion with JSON string content;
- object-valued content;
- nested `result`/`data`/`output` health objects;
- prefixed JSON content;
- plain string content;
- array content blocks;
- delta-only envelopes;
- unsupported planner-shaped statuses such as `planned`;
- malformed/truncated JSON;
- `finish_reason=length`;
- tool/function/direct-action/execution-shaped output;
- secret-like and oversized content.

## Safety Boundary

The strategy remains fail-closed:

- it does not make invalid health outputs acceptable;
- it does not widen the runtime health parser;
- it does not add retries, streaming, model candidates, provider expansion, or
  endpoint fallback;
- it does not touch credential storage or any real provider path.

## Verification

Executed locally with no credential, secure-store, network, Electron
diagnostic, or GLM API access:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/health-response-shape-strategy.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
```

Results:

- GLM runtime adapter build passed;
- focused GLM health parser and response-shape tests passed: `35`.

## Next Step

If GLM investigation continues, the next real provider step should be a new
exact-scope Product/Security/Release approval for a single shape-only health
diagnostic window:

- fixed provider: `heavy-planner.glm`;
- fixed profile/model: `standard_paas_v4 / glm-4.7`;
- fixed endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- one fresh secure-store credential;
- at most one minimal non-planning request;
- no Heavy Planner acceptance;
- no BrainPlan parsing/evaluation;
- sanitized shape metadata only;
- no raw request/response/header/content/credential persistence;
- verified credential cleanup.

Do not run that window until a new exact approval is recorded.
