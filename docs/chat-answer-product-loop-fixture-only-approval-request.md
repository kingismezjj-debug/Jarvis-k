# Chat Answer Product Loop Fixture-Only Approval Request

Recorded: 2026-08-08

## Status

`APPROVED_IMPLEMENTED_FIXTURE_REPLAY_EVIDENCE`

This request opens the next product-spine increment after the working voice
input and cloud TTS playback chain: a bounded `chat.answer` product loop.

The current BrainCommand path can classify a question as `chat.answer`, but
the user-facing result is still a placeholder saying that local answer
generation is not connected. This scope adds only the provider-neutral
answer contract, fixture provider, Core Host composition, and sanitized
fixture/replay evidence needed to make that path testable.

It does not authorize a real model runtime, cloud API call, credential access,
network access, Memory write, vector retrieval, tool execution, or release
behavior.

## Product Goal

Make a normal question follow one bounded product path:

```text
voice/text input
-> BrainCommand
-> chat.answer intent
-> bounded answer provider
-> safety/result projection
-> existing UI result and TTS surfaces
```

The fixture provider must produce a safe answer-shaped result without
pretending that a real model was used. It must preserve the existing
deterministic rules and Qwen router selection/fallback behavior.

## Exact Approval Requested

Approve exactly this fixture-only implementation scope:

- add a provider-neutral `ChatAnswerProvider` contract;
- add bounded answer request, result, status, reason-code, and failure-class
  schemas;
- support fixed result labels: `answered`, `clarify`, `blocked`, and
  `unavailable`;
- bound answer text length, answer item count, and optional follow-up
  question length;
- add sanitized answer normalization for fixture/replay responses only;
- add a deterministic fixture answer provider for:
  - ordinary factual/conversational questions;
  - underspecified questions requiring clarification;
  - unsafe or action-shaped requests that must remain blocked;
  - unavailable provider fallback;
- compose the fixture provider through the existing Core Host injection
  boundary;
- route only `chat.answer` requests to the answer provider;
- preserve existing BrainCommand routing, safety gates, tool registry,
  executor-only side effects, Qwen/rules fallback, Memory policy, and TTS
  eligibility policy;
- return a bounded sanitized answer result to the existing BrainCommand/UI
  result path;
- keep direct action execution permanently false in fixture evidence;
- add focused contract, provider, Core Host composition, and replay tests; and
- document sanitized fixture evidence and the remaining real-provider approval
  boundary.

## Bounded Answer Contract

A valid fixture answer result may contain only:

- provider id and fixture status;
- one fixed answer status;
- bounded answer text or a bounded clarification question;
- bounded reason code and failure class;
- optional confidence band;
- fallback-used boolean;
- `directActionAttempted=false`;
- `rawProviderResponsePersisted=false`; and
- `credentialExposed=false`.

The result must not contain:

- raw provider prompts or raw provider responses;
- hidden reasoning or chain-of-thought;
- executable code or shell commands;
- arbitrary URLs, private paths, credentials, tokens, headers, or endpoints;
- tool calls or function calls;
- unbounded conversation history;
- vectors, embeddings, model internals, or account metadata; or
- claims that a real provider or model was contacted.

## Implementation Bounds

This approval permits only contracts, provider-neutral adapter code, fixture
composition, tests, replay data, and documentation.

The implementation must keep:

- no real API or network request;
- no credential, safeStorage, keychain, or environment-secret access;
- no model artifact, helper, lifecycle, runtime, cache, or inference startup;
- no raw prompt/response persistence;
- no Memory write, schema migration, or vector/provider retrieval activation;
- no browser, local-app, shell, PowerShell, filesystem, process, or network
  side effect;
- no planner or answer provider path bypassing existing safety gates;
- no direct action execution from answer output;
- no new IPC, preload, settings, telemetry, analytics, installer, updater,
  packaging, default, or release-channel behavior;
- no cloud TTS change; and
- no provider expansion beyond the fixture provider boundary.

The existing UI may continue to display the bounded result through the
existing BrainCommand surface, and the existing TTS path may consume a
completed safe summary only according to its already-approved policy. This
scope does not authorize a new TTS runtime or automatic cloud-provider
acceptance window.

## Fixture Cases

Focused fixtures must cover at least:

1. ordinary question -> `answered`;
2. underspecified question -> `clarify`;
3. unsafe action-shaped request -> `blocked`;
4. provider unavailable -> sanitized `unavailable`;
5. malformed or oversized output -> fail-closed `unavailable`;
6. answer result routed through the existing `chat.answer` BrainCommand path;
7. Qwen/rules fallback preserved when the fixture provider is unavailable; and
8. direct action, credential exposure, network access, and raw persistence all
   remain false.

## Stop Conditions

Stop immediately if:

- any real provider, model runtime, helper, cache, credential, or network path
  becomes necessary;
- answer output can execute a tool or bypass the executor;
- raw prompts, responses, headers, credentials, URLs, private paths, or
  hidden reasoning would be retained;
- Memory, vector retrieval, browser, local-app, shell, filesystem, process,
  voice, or OCR side effects are introduced;
- new IPC, UI settings, telemetry, default, installer, update, packaging, or
  release behavior is required;
- deterministic rules/Qwen fallback is weakened; or
- fixture evidence cannot remain sanitized and bounded.

## Expected Fixture Evidence

Evidence may contain only:

- scope id;
- `passed`, `degraded`, or `blocked` status;
- accepted boolean;
- fixed provider id and fixture status;
- case count and pass/fail count;
- sanitized result labels, reason codes, and failure classes;
- bounded answer/clarification length buckets;
- fallback-preserved boolean;
- `directActionAttempted=false`;
- `credentialExposed=false`;
- `networkAccessed=false`;
- `rawProviderResponsePersisted=false`;
- `memoryWriteAttempted=false`;
- `uiIpcBehaviorChanged=false`;
- `telemetryChanged=false`;
- `defaultBehaviorChanged=false`; and
- `releaseBehaviorChanged=false`.

Evidence must not contain raw question text, raw answer text, raw provider
payloads, credentials, tokens, endpoints, private paths, stack traces, hidden
reasoning, model internals, or user-private content.

## Role Requests

**Product.** Approve exactly this Chat Answer Product Loop fixture-only
implementation scope using the existing BrainCommand spine, bounded answer
results, existing safety gates, Qwen/rules fallback preservation, and no
direct action behavior.

**Security.** Approve exactly this bounded, fail-closed fixture-only answer
scope with no credential, secure-store, network, endpoint, model runtime,
Memory/vector, raw provider diagnostic, persistence, or side-effect access;
only sanitized bounded answer classifications and fixture evidence may be
retained.

**Release.** Approve implementation and fixture/replay evidence only; no real
provider runtime, credential UI/storage, default behavior, UI/IPC expansion,
telemetry, installer, update, packaging, or release-channel changes.

## Approval Lines To Provide

```text
Product: APPROVE exactly this Chat Answer Product Loop fixture-only implementation scope using the existing BrainCommand spine, bounded answer results, existing safety gates, Qwen/rules fallback preservation, and no direct action behavior

Security: APPROVE exactly this bounded, fail-closed fixture-only Chat Answer scope with no credential, secure-store, network, endpoint, model runtime, Memory/vector, raw provider diagnostic, persistence, or side-effect access; only sanitized bounded answer classifications and fixture evidence may be retained

Release: APPROVE implementation and fixture/replay evidence only; no real provider runtime, credential UI/storage, default behavior, UI/IPC expansion, telemetry, installer, update, packaging, or release-channel changes
```

## Implemented Evidence

The approved fixture-only scope is implemented and remains default-off:

- `ChatAnswerProvider` and bounded request/result contracts are present;
- `FixtureChatAnswerProvider` returns deterministic `answered`, `clarify`, and
  `blocked` classifications without credentials, network, model runtime,
  Memory, or tool execution;
- CoreRuntime routes only the existing `chat.answer` BrainCommand intent and
  projects the bounded result into `BrainCommandResult.chatAnswer`;
- missing or disabled providers fail closed as sanitized `unavailable`;
- Core Host composes the fixture provider only when
  `JARVIS_K_ENABLE_FIXTURE_CHAT_ANSWER=1`;
- the default path keeps the existing placeholder behavior when the fixture
  option is absent, so no default product behavior changes; and
- no new UI/IPC surface was added. Existing result and TTS consumers can use
  the already-projected bounded summary.

Focused evidence:

| Surface | Result |
| --- | --- |
| Contracts, provider, CoreRuntime, Core Host fixture tests | `68 passed` |
| Core Host build | `passed` |
| Dependency boundary check | `passed` |
| Credential exposure | `false` |
| Network/model/Memory access | `false` |
| Direct action attempted | `false` |
| Raw provider response persisted | `false` |
| Default behavior changed | `false` |

No real provider, credential, secure-store, model runtime, network, Memory
write/vector path, tool executor, telemetry, UI/IPC, installer, update,
packaging, or release path was used by this implementation or its evidence.

## Next Step

Close this fixture-only increment, then request a separate exact-scope
approval before adding any real answer provider/runtime or changing default
behavior.
