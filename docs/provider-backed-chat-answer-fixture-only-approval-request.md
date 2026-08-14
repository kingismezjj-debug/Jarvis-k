# Provider-Backed Chat Answer Fixture-Only Approval Request

Recorded: 2026-08-08

## Status

`PENDING_APPROVAL`

Chat Answer text-only is closed with accepted developer-alpha fixture/manual
evidence. The next product goal is to prepare a real answer-provider path
without contacting any real provider yet.

This request opens only the provider-neutral, OpenAI-compatible fixture layer
for provider-backed Chat Answer. It does not authorize credential storage,
secure-store access, network/API calls, model runtime activation, UI/IPC,
telemetry, default behavior, installer/update, packaging, or release-channel
changes.

## Product Goal

Prepare Jarvis-K to answer ordinary `chat.answer` requests through a future
approved provider while preserving the existing safe fixture fallback:

```text
text or voice transcript
-> BrainCommand
-> chat.answer
-> provider-backed Chat Answer adapter
-> bounded ChatAnswerResult
-> existing safety/result/TTS projection
```

This phase proves the provider-backed adapter shape, result normalization, and
failure taxonomy using fixture transports only. It must not improve answer
quality by calling a real model.

## Exact Implementation Scope

Allowed fixture-only implementation:

- add a provider-neutral OpenAI-compatible Chat Answer profile registry;
- add fixed default-off provider profile metadata for candidates such as:
  - `chat-answer.openai-compatible.openai`;
  - `chat-answer.openai-compatible.deepseek`;
  - `chat-answer.openai-compatible.qwen`;
  - `chat-answer.openai-compatible.glm`;
- reuse the existing bounded `ChatAnswerRequest` and `ChatAnswerResult`
  contracts;
- add fixture-only Chat Completions request construction for answer use cases;
- add response-shape parsing and JSON/text extraction that maps only bounded
  fixture outputs into `answered`, `clarify`, `blocked`, or `unavailable`;
- add provider-neutral sanitized failure classes for unavailable, timeout,
  authentication rejected, rate limited, model unavailable, invalid output,
  unsafe output, and provider execution failure;
- reject tool calls, function calls, direct-action-shaped output, executable
  side effects, hidden reasoning, oversized answers, malformed JSON, and
  unsupported response shapes;
- add a default-off provider-backed Chat Answer composition helper for Core
  Host using injected fixture transports only;
- preserve the existing fixture Chat Answer provider and deterministic rules
  fallback when the provider-backed path is absent, disabled, invalid, unsafe,
  or unavailable;
- add focused adapter, parser, profile, Core Host composition, and Core
  fallback tests; and
- add sanitized fixture evidence only.

## Explicit Exclusions

This scope does not authorize:

- real OpenAI, DeepSeek, Qwen/DashScope, GLM, Anthropic, Volcengine, or other
  provider API calls;
- network access, HTTP clients, fetch, WebSocket, endpoint probing, health
  diagnostics, latency tests, or one-window runtime/API acceptance;
- credential input, credential storage, environment secret reading, Electron
  `safeStorage`, keychain, token validation, account lookup, billing/quota
  inspection, or credential migration;
- model artifacts, local model runtimes, helpers, caches, lifecycle activation,
  Qwen runtime use, or background sessions;
- raw prompt, raw request, raw response, headers, credentials, tokens,
  endpoint overrides, private paths, screenshots, transcripts, hidden
  reasoning, model internals, vectors, logits, telemetry, or user-private data
  persistence;
- Memory writes, Memory filesystem initialization, Memory/vector retrieval,
  browser actions, local-app actions, shell/process/filesystem tools, OCR,
  microphone, ASR, or voice-provider execution;
- new Desktop IPC, preload APIs, settings UI, provider settings UI, telemetry,
  analytics, installer, updater, packaging, default behavior, release-channel,
  or release behavior; and
- treating fixture output as a real model answer.

## Required Fixture Coverage

Focused tests must prove:

1. every provider profile is default-off;
2. no credential, secure-store, network, model runtime, Memory/vector, or tool
   path is accessed;
3. valid fixture outputs normalize to `answered`, `clarify`, and `blocked`;
4. unavailable/timeout/auth/rate/model-unavailable/provider-failed cases map to
   sanitized `unavailable`;
5. invalid JSON/text, oversized output, raw diagnostic-shaped output, tool
   calls, function calls, and direct-action-shaped output fail closed;
6. existing fixture Chat Answer fallback remains preserved;
7. Core Host composition is default-off and fixture-transport-only;
8. CoreRuntime does not execute actions and preserves `directActionAttempted=false`;
9. raw prompt/response persistence remains false; and
10. dependency boundaries, sensitive artifact guard, and `git diff --check`
    remain green.

## Stop Conditions

Stop immediately and request a new exact-scope approval if implementation
would require:

- a real API key, secure-store record, endpoint call, provider health check, or
  network request;
- real answer-provider runtime activation;
- a provider settings UI, credential UI, IPC/preload expansion, telemetry,
  installer, packaging, default, or release behavior;
- Memory/vector, voice/ASR, browser/local-app/shell/filesystem/process, OCR, or
  other side-effect path;
- raw prompt/response retention or non-sanitized diagnostic evidence; or
- weakening the existing fixture fallback, safety gates, or executor-only
  side-effect boundary.

## Expected Evidence

The implementation closeout may retain only:

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

## Requested Approval Lines

```text
Product: APPROVE exactly this provider-neutral OpenAI-compatible Chat Answer fixture-only implementation scope with default-off provider-backed answer profiles, bounded ChatAnswerResult output, existing fixture fallback preserved, and no direct action behavior

Security: APPROVE exactly this bounded fail-closed provider-backed Chat Answer fixture-only scope with no credential, secure-store, network, endpoint request, model runtime, Memory/vector, raw provider diagnostic, UI/IPC, telemetry, persistence, or side-effect access; sanitized profile/parser/result evidence and tests only

Release: APPROVE implementation and fixture evidence only; no real provider runtime, credential UI/storage, default behavior, UI/IPC expansion, telemetry, installer/update, packaging, or release-channel changes
```

## Next Step After Approval

After all three exact approval lines are recorded, implement only the
provider-neutral fixture profile registry, fixture transport/parser,
default-off Core Host composition helper, Core fallback regression tests, and
sanitized implementation evidence. Do not configure credentials or call any
real provider.
