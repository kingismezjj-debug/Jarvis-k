# Provider-Backed Chat Answer Real Provider, Credential-Backed Runtime Acceptance Approval Request

Recorded: 2026-08-08

## Status

`PENDING_APPROVAL`

The provider-neutral OpenAI-compatible Chat Answer fixture-only layer is now
frozen. The next step is a single real-provider acceptance window that proves
Chat Answer can be composed through one credential-backed provider while
preserving the existing safe fixture fallback.

This request does not authorize product defaults, UI/IPC expansion, telemetry,
installer/update, packaging, or any action execution. It opens only the
minimal real-provider path needed to validate bounded ChatAnswerResult output
under a credential-backed runtime gate.

## Product Goal

Prepare Jarvis-K to answer ordinary `chat.answer` requests through one real
provider-backed path while preserving the existing safe fixture fallback:

```text
text or voice transcript
-> BrainCommand
-> chat.answer
-> provider-backed Chat Answer adapter
-> bounded ChatAnswerResult
-> existing safety/result/TTS projection
```

This phase proves that a real provider can be composed, credential-gated, and
parsed into the existing bounded ChatAnswerResult shape. It must not improve
answer quality by expanding scope, prompts, or runtime surfaces.

## Provider Choice for This Request

Approve one provider family only for the first real runtime window:

- provider id: `chat-answer.openai-compatible.glm`;
- model id: `glm-4.7`;
- endpoint: `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- output: bounded `ChatAnswerResult` JSON only; and
- no direct action execution.

No OpenAI, DeepSeek, Qwen, Anthropic, Volcengine, or secondary fallback API
provider is included in this approval. A different provider requires a
separate exact-scope approval.

## Exact Implementation Scope

Allowed implementation:

- add a real provider composition module for `chat-answer.openai-compatible.glm`;
- keep the provider default-off and unavailable unless explicit runtime
  enablement, secure credential readiness, contract readiness, parser
  readiness, timeout/output bounds, and fallback preservation gates are all
  true;
- add secure credential storage for the provider key using the existing
  desktop secure storage pattern or an equivalent OS-backed secret store;
- expose only sanitized credential-status reports: configured/not configured,
  store available/unavailable, last validation status, and fixed reason
  codes;
- never expose raw keys, tokens, endpoints, organization IDs, account
  metadata, request IDs, or provider billing/quota details in diagnostics,
  logs, docs, IPC, tests, or evidence;
- add a real provider adapter that sends a bounded chat completion request and
  parses only bounded JSON into `ChatAnswerResult`;
- enforce output size, timeout, retry, and schema limits;
- reject invalid JSON, unsupported response shapes, tool/function calls,
  direct-action-shaped output, hidden execution requests, oversized answers,
  malformed JSON, and unsafe output;
- preserve the existing fixture Chat Answer fallback when the provider is
  disabled, unconfigured, unavailable, invalid, unsafe, timed out,
  quota-limited, or failed;
- add mocked-transport tests for success, clarify, blocked, invalid JSON,
  unsafe output, credential missing, timeout, quota/rate-limit, provider
  error, and fallback preservation;
- after implementation passes fixture/mocked tests, run exactly one real API
  acceptance window using the approved provider, one configured developer
  credential, one fixed prompt set, bounded output, sanitized evidence, and
  no tool execution; and
- update docs with sanitized implementation and one-window evidence.

## Implementation Bounds Before Real API Window

Before the one-window runtime acceptance run, implementation may only use
mocked transport or fixture providers.

Allowed:

- provider composition code;
- secure credential storage code and tests using fake secrets;
- sanitized credential report code;
- request shaping and output parser code;
- mocked provider transport tests;
- Core runtime composition gates;
- fallback tests; and
- documentation updates.

Not allowed before the real API window:

- real API calls;
- live network access;
- use of real credentials;
- storing real credentials outside the approved secure store;
- raw provider response persistence;
- UI/IPC exposure;
- tool execution; or
- telemetry or release/default behavior changes.

## One-Window Real API Acceptance Bounds

After implementation and mocked evidence pass, approve exactly one real API
acceptance window with these bounds:

- one local developer operator;
- one provider: `chat-answer.openai-compatible.glm`;
- one configured developer credential stored only in the approved secure
  store;
- no credential printed, logged, serialized, snapshotted, committed, or
  included in evidence;
- one fixed prompt set with no private user data and no broad tester input;
- maximum prompt count: `3`;
- maximum provider calls: `3`;
- timeout per call: `20 seconds`;
- maximum retry count: `0`;
- output must be parsed into `ChatAnswerResult`;
- accepted results must contain only bounded `answered`, `clarify`,
  `blocked`, or `unavailable` status;
- planner/tool execution is not part of this scope;
- invalid JSON, invalid schema, unsafe output, unsupported response shape,
  timeout, quota/rate-limit, credential failure, provider failure, or parser
  failure must fail closed;
- raw request body, raw prompt, raw response, headers, request IDs,
  credentials, endpoints, account metadata, stack traces, private paths, and
  user-private data must not be recorded;
- evidence must be sanitized; and
- the run ends immediately after the fixed prompt window completes or any
  stop condition is reached.

## Required Gates

The real provider must fail closed unless all required gates are true:

- `chatAnswer.enablement.explicit`;
- `chatAnswer.provider.exactlyApproved`;
- `chatAnswer.secureCredentialStore.available`;
- `chatAnswer.credential.configured`;
- `chatAnswer.credential.notExposed`;
- `chatAnswer.network.oneWindowApproved`;
- `chatAnswer.contract.ready`;
- `chatAnswer.parser.ready`;
- `chatAnswer.timeoutAndOutputBounds.ready`;
- `chatAnswer.defaultOffPreserved`;
- `chatAnswer.fixtureFallbackPreserved`; and
- `chatAnswer.executorOnlySideEffectsPreserved`.

Any missing gate must return unavailable/unconfigured report-shaped evidence
and must not call the provider.

## Stop Conditions

Stop immediately and do not continue to another prompt, provider call, retry,
or implementation expansion if any of these occur:

- any Product/Security/Release approval line is missing or differs from this
  exact scope;
- provider id differs from `chat-answer.openai-compatible.glm`;
- any credential would be exposed, logged, serialized, snapshotted,
  committed, or included in evidence;
- credential storage is not OS-backed or approved secure-store backed;
- network/API call happens before the one-window acceptance gate;
- more than three fixed prompts or three provider calls are attempted;
- raw prompt, raw request body, raw response, headers, request ID, endpoint,
  account metadata, stack trace, private path, or user-private data would be
  recorded;
- ChatAnswerResult cannot be parsed;
- output attempts to bypass executor, allowlist, or safety gates;
- any tool, browser, app, shell, filesystem, network, Memory write, vector
  write, OCR, voice, UI/IPC, telemetry, installer, update, release, or
  product-default behavior is triggered by provider output;
- fallback preservation fails; or
- sanitized cleanup/evidence status is uncertain.

`degraded` and `blocked` are stopped-run evidence, not acceptance, and require
a fresh exact-scope approval before any rerun.

## Sanitized Evidence Contract

Implementation evidence may contain only:

- scope id;
- status: `passed`, `degraded`, or `blocked`;
- accepted boolean;
- fixed provider profile count and ids;
- fixed fixture case counts and pass/fail counts;
- sanitized result labels and failure classes;
- fallback-preserved boolean;
- `directActionAttempted=false`;
- `credentialAccessed=false`;
- `secureStoreAccessed=false`;
- `networkAccessed=false`;
- `modelRuntimeAccessed=false`;
- `memoryVectorAccessed=false`;
- `rawProviderResponsePersisted=false`;
- `defaultBehaviorChanged=false`;
- `uiIpcBehaviorChanged=false`;
- `telemetryChanged=false`;
- `releaseBehaviorChanged=false`; and
- build/test/check results.

Evidence must not contain raw prompts, raw answers, raw provider payloads,
credentials, tokens, endpoints beyond fixed public profile labels, private
paths, stack traces, screenshots, transcripts, hidden reasoning, model
internals, vectors, logits, account metadata, or user-private content.

## Explicitly Not Authorized

This approval does not authorize:

- any provider other than `chat-answer.openai-compatible.glm`;
- more than one real API acceptance window;
- broader prompt windows or tester expansion;
- product default enablement;
- UI/IPC exposure or settings toggles;
- telemetry, analytics, installer, update, packaging, release-channel, or
  production-readiness behavior;
- raw prompt or raw response persistence;
- persistent chat transcripts, planner memory, or Memory/vector writes;
- tool execution, browser/local-app execution, shell/process/filesystem
  execution, OCR, voice, or action execution from provider output;
- storing credentials in plaintext, repo files, logs, docs, env examples, test
  snapshots, or non-secure cache;
- exposing provider account metadata, quota details, request IDs, or
  endpoints in evidence; or
- production-readiness claims.

## Role Requests

**Product.** Approve exactly this developer-alpha real provider composition,
secure credential storage, and one-window API acceptance scope for
`chat-answer.openai-compatible.glm`. The provider may return bounded
ChatAnswerResult values only. Existing fixture fallback must remain
preserved. No product default, tool execution, UI/IPC, tester expansion, or
release behavior is authorized.

**Security.** Approve exactly this bounded fail-closed real-provider scope
with OS-backed or approved secure-store credential handling, credential
non-exposure, one-window network/API access only after all gates pass,
bounded request/output limits, sanitized evidence, no raw prompt/response
persistence, and executor-only side effects. Missing gates, invalid output,
unsafe output, credential issues, timeout, quota/rate-limit, or provider
failure must fail closed.

**Release.** Approve developer-alpha implementation, mocked evidence, and one
fixed-window API acceptance evidence only. Exclude defaults, UI/IPC,
telemetry, installer, update, packaging, release-channel, product
availability, and production-readiness changes.

## Approval Lines To Provide

```text
Product: APPROVE exactly this Heavy Planner-style Chat Answer provider composition, secure credential storage, and one-window API acceptance scope for chat-answer.openai-compatible.glm with fixture fallback preserved, bounded ChatAnswerResult output only, and no direct action execution
Security: APPROVE exactly this bounded fail-closed chat-answer.openai-compatible.glm secure-credential and one-window API scope with credential non-exposure, gated network access, sanitized evidence, no raw prompt/response persistence, and executor-only side effects
Release: APPROVE developer-alpha implementation, mocked evidence, and one fixed-window API acceptance evidence only; no default/UI/IPC/telemetry/installer/update/release changes
```

## Next Step After Approval

After all three exact approval lines are received, implement only the
provider composition, secure credential store/report shape, mocked transport
tests, parser/gate/fallback logic, and then run exactly one approved fixed
real API acceptance window. Do not expand providers, prompts, retries,
testers, UI/IPC, telemetry, defaults, tool execution, or release behavior.
