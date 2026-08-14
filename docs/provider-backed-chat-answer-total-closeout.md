# Provider-Backed Chat Answer Total Closeout

Recorded: 2026-08-09

## Status

`TOTAL_DEVELOPER_ALPHA_CLOSED_WITH_EXPANDED_LOOP_ADDENDUM`

Provider-backed Chat Answer is closed for the current developer-alpha arc.
The fixture-only provider-neutral layer, Core Host selection/fallback
composition, DeepSeek credential-backed runtime acceptance, DeepSeek desktop
product manual acceptance, and the follow-up DeepSeek expanded product loop
have all completed with sanitized evidence.

This closeout does not make provider-backed Chat Answer a default product
behavior. It does not approve provider expansion, new UI/settings exposure,
persistent telemetry, release-channel changes, tool execution, planner
activation, Memory vector behavior, voice/ASR behavior, or any production
runtime enablement.

## Closed Milestones

### 1. Fixture-Only Provider-Neutral Layer

Closed on 2026-08-08.

Evidence:

- `docs/provider-backed-chat-answer-fixture-only-implementation-evidence.md`
- `docs/provider-backed-chat-answer-core-host-selection-fallback-closeout.md`

Completed scope:

- added provider-neutral OpenAI-compatible Chat Answer fixture package;
- registered default-off profiles for OpenAI, DeepSeek, Qwen, and GLM
  candidates;
- built bounded Chat Completions fixture request shaping;
- normalized `ChatAnswerResult` statuses for `answered`, `clarify`,
  `blocked`, and `unavailable`;
- added fail-closed unsafe output and direct-action rejection;
- added sanitized provider/transport/failure classifications; and
- added Core Host fixture-only composition with explicit gates and fallback
  preservation.

No credential, secure-store, real provider, endpoint, model runtime,
Memory/vector, UI/IPC, telemetry, persistence, or direct action behavior was
authorized or used in this milestone.

### 2. DeepSeek Credential-Backed Runtime Acceptance

Closed on 2026-08-09.

Evidence:

- `docs/provider-backed-chat-answer-deepseek-runtime-closeout.md`

Accepted runtime:

- provider `chat-answer.openai-compatible.deepseek`;
- profile `deepseek.v4-flash.compact_json_object_256`;
- model `deepseek-v4-flash`;
- endpoint `https://api.deepseek.com/chat/completions`;
- secure-store-only credential loading;
- one fixed three-call acceptance window;
- bounded `ChatAnswerResult` output;
- no direct action, tool execution, Memory/vector, voice/ASR, telemetry, or
  release behavior.

Accepted runtime result:

```json
{
  "scopeId": "deepseek-chat-answer-one-window-api-acceptance",
  "status": "passed",
  "accepted": true,
  "promptCount": 3,
  "providerCallCount": 3,
  "transportFailureCounts": {
    "timeout": 0,
    "connection": 0,
    "unknown": 0
  },
  "samples": [
    { "expectedStatus": "answered", "actualStatus": "answered", "passed": true },
    { "expectedStatus": "clarify", "actualStatus": "clarify", "passed": true },
    { "expectedStatus": "blocked", "actualStatus": "blocked", "passed": true }
  ],
  "cleanup": "complete",
  "reasonCodes": ["DEEPSEEK_CHAT_ANSWER_ACCEPTANCE_PASSED"]
}
```

Key hardening completed before acceptance:

- reasoning-content fallback parsing;
- object/array response content normalization;
- clarify/blocked/answered shape normalization;
- fail-closed unsafe output handling; and
- few-shot prompt anchoring for the fixed accepted result classes.

### 3. DeepSeek Product Manual Acceptance

Closed on 2026-08-09.

Evidence:

- `docs/provider-backed-chat-answer-deepseek-product-manual-acceptance-evidence.md`

Accepted product behavior:

- existing desktop text BrainCommand path;
- provider-backed DeepSeek Chat Answer runtime;
- explicit manual-acceptance gates;
- temporary file-backed local Memory DB;
- fixed accepted text inputs for `answered`, `clarify`, and `blocked`;
- existing safety/result projection;
- no voice/ASR, planner, tool execution, Memory vector retrieval, telemetry,
  UI/IPC expansion, or release behavior; and
- credential plus temporary DB cleanup confirmed.

Accepted visible result:

```json
{
  "scopeId": "provider-backed-chat-answer-deepseek-product-manual-acceptance",
  "status": "accepted_cleanup_complete",
  "accepted": true,
  "fixedInputCount": 3,
  "resultCounts": {
    "answered": 1,
    "clarify": 1,
    "blocked": 1,
    "degraded": 0,
    "other": 0
  },
  "voiceUsed": false,
  "memoryAlphaStatus": "disabled",
  "directActionAttempted": false,
  "rawProviderResponsePersisted": false,
  "credentialExposed": false,
  "cleanup": "complete"
}
```

Final cleanup verification returned:

```json
{
  "providerExists": false,
  "tempDbExists": false
}
```

### 4. DeepSeek Expanded Product Loop Addendum

Closed on 2026-08-09.

Evidence:

- `docs/provider-backed-chat-answer-deepseek-expanded-product-loop-final-replacement-accepted-evidence.md`

Accepted expanded-loop behavior:

- existing desktop text BrainCommand path;
- same accepted provider `chat-answer.openai-compatible.deepseek`;
- same fixed profile `deepseek.v4-flash.compact_json_object_256`;
- one temporary file-backed local Memory DB;
- six fixed text inputs covering four `answered`, one `clarify`, and one
  `blocked` result;
- existing safety/result projection and retry/rollback-view affordances;
- optional local TTS only after a completed safe answered result; and
- no planner, voice/ASR, tool execution, Memory vector retrieval, telemetry,
  UI/IPC expansion, or release behavior.

Accepted visible result:

```json
{
  "scopeId": "provider-backed-chat-answer-deepseek-expanded-product-loop-final-replacement-rerun",
  "status": "final_replacement_accepted_cleanup_complete",
  "accepted": true,
  "fixedInputCount": 6,
  "resultCounts": {
    "answered": 4,
    "clarify": 1,
    "blocked": 1,
    "degraded": 0,
    "other": 0
  },
  "voiceUsed": false,
  "memoryAlphaStatus": "disabled",
  "directActionAttempted": false,
  "rawProviderResponsePersisted": false,
  "credentialExposed": false,
  "cleanup": "complete"
}
```

Final expanded-loop cleanup verification returned:

```json
{
  "providerExists": false,
  "tempDbExists": false
}
```

## Implementation Surfaces

Primary implementation surfaces now covered by this total closeout:

- `packages/inference-adapter-openai-chat-answer/src/openai-compatible.ts`;
- `packages/inference-adapter-glm-chat-answer-runtime/src/provider.ts`;
- `packages/inference-adapter-glm-chat-answer-runtime/src/response-shape.ts`;
- `apps/core-host/src/openai-compatible-chat-answer-composition.ts`;
- `apps/core-host/src/openai-compatible-chat-answer-runtime-composition.ts`;
- `apps/core-host/src/index.ts`;
- `apps/desktop/src/secure-chat-answer-provider-store.ts`;
- `apps/desktop/src/supervisor.ts`;
- `apps/desktop/src/main.ts`; and
- `packages/core/src/runtime.ts`.

Primary tests and runners:

- `packages/inference-adapter-openai-chat-answer/test/openai-compatible.test.ts`;
- `packages/inference-adapter-glm-chat-answer-runtime/test/provider.test.ts`;
- `apps/core-host/test/openai-compatible-chat-answer-composition.test.ts`;
- `apps/core-host/test/openai-compatible-chat-answer-runtime-composition.test.ts`;
- `apps/core-host/test/provider-backed-chat-answer-manual-acceptance-source.test.ts`;
- `apps/desktop/test/secure-chat-answer-provider-store.test.ts`;
- `apps/desktop/test/supervisor.test.ts`;
- `packages/core/test/runtime.test.ts`;
- `tests/chat-answer-deepseek-one-window-api-acceptance.cjs`;
- `tests/chat-answer-deepseek-provider-health-diagnostic.cjs`;
- `tests/chat-answer-deepseek-shape-health-diagnostic.cjs`; and
- `tests/chat-answer-deepseek-256-health-rerun.cjs`.

## Verification Summary

The final focused verification immediately before product closeout included:

- `npx vitest run packages/core/test/runtime.test.ts apps/desktop/test/supervisor.test.ts apps/core-host/test/provider-backed-chat-answer-manual-acceptance-source.test.ts apps/core-host/test/openai-compatible-chat-answer-runtime-composition.test.ts`
  - 69 tests passed;
- `npm.cmd run build:core`;
- `npm.cmd run build:core-host`;
- `npm.cmd run build:desktop`.

Earlier fixture/runtime verification included:

- `npm.cmd run build:inference-adapter-openai-chat-answer`;
- `npm.cmd run build:inference-adapter-glm-chat-answer-runtime`;
- `npm.cmd run check:boundaries`; and
- `npm.cmd run check:sensitive-artifacts`.

## Security And Privacy Disposition

The closed arc retained only sanitized evidence. The evidence does not retain
raw provider prompts, raw provider responses, hidden reasoning, credentials,
headers, tokens, private paths, transcripts, screenshots, Memory vectors,
telemetry, or release artifacts.

The accepted runtime and product windows used secure-store-only credential
loading and completed cleanup. The final manual-acceptance cleanup verified
that the DeepSeek provider credential file and temporary acceptance DB no
longer existed.

Direct action execution remained disabled or absent throughout this arc. No
provider output executed tools.

## Freeze Rules

Provider-backed Chat Answer is frozen at this developer-alpha boundary.

Do not under this closeout:

- enable provider-backed Chat Answer by default;
- broaden beyond the accepted DeepSeek profile;
- reuse this evidence as approval for OpenAI, GLM, Qwen, or any other provider;
- add retries, streaming, new model IDs, new endpoints, or larger output
  bounds;
- persist raw provider payloads, hidden reasoning, credentials, headers, or
  transport diagnostics;
- expose new UI/IPC/settings surfaces;
- activate planner, tool execution, browser/local-app/shell/filesystem/process
  actions, Memory vector retrieval, voice/ASR, or model lifecycle behavior;
- add telemetry, installer/update, packaging, or release-channel changes; or
- rerun real provider windows without a fresh exact-scope approval.

## Product Disposition

Provider-backed Chat Answer is now proven as a guarded developer-alpha product
path for the fixed DeepSeek profile. It remains opt-in, bounded, and scoped to
approved windows.

The existing fixture Chat Answer fallback remains preserved. Normal product
defaults remain unchanged.

## Next Possible Routes

Any next route must start with a fresh exact-scope Product, Security, and
Release approval. Reasonable next candidates are:

- a fixture-only UI/settings design for provider configuration, without
  storing credentials or enabling runtime by default;
- a separate provider family acceptance for GLM, Qwen, or OpenAI-compatible
  candidates;
- a separate voice-to-Chat Answer product loop window that includes ASR and
  TTS, with no planner or tool execution; or
- a safety-hardening pass for router classification so product prompts do not
  need fixed manual-acceptance utterance overrides.

Until such a scope is approved, stop here.
