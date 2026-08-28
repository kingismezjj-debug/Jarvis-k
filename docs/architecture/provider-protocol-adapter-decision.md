# Provider Protocol Adapter Decision

Date: 2026-08-28

Audit HEAD: `df45010b4fad3b3ffc9a6910e019a6e9957b9432`

Scope: OSS-1 decision and isolated fake-transport conformance spike. This phase does not change Product routing, Renderer, preload, Settings, Voice, Qwen, Planner, Plugin, Windows Executor, Pet, Installer, real acceptance, or credential storage behavior.

## OSS-0 Count Reconciliation

OSS-0 decomposes Jarvis-K into 126 leaf capabilities in `docs/architecture/oss-capability-decomposition.md`.

The reuse decision matrix summarizes 45 third-party reuse candidates:

| Decision | Count |
| --- | ---: |
| Build | 12 |
| Adopt | 6 |
| Wrap | 12 |
| Learn | 8 |
| Reject | 7 |
| Total matrix candidates | 45 |

The remaining 81 leaves are not hidden decisions. They are capability leaves whose current ownership/maturity/decision remains in the decomposition document and did not become individual OSS candidate rows in the reuse matrix.

| Count | Status |
| ---: | --- |
| 126 | Total decomposed leaf capabilities |
| 45 | Explicit reuse-matrix candidate decisions |
| 81 | Non-matrix capability leaves retained in the decomposition document as Jarvis-owned, deferred, learn-only, or not-yet-candidate implementation areas |

## Current Runtime Structure

The current cloud reasoning path is:

Trusted Product or Acceptance composition
-> model capability profile
-> endpoint profile
-> request contract
-> `CloudProviderCredentialBroker.withCredential`
-> `CloudReasoningRuntime`
-> `BoundedCloudReasoningTransport`
-> injected fetch
-> JSON/SSE parser
-> sanitized result and health projection.

Current concrete provider adapters:

- GLM: `advanced-brain.glm`, standard PAAS v4 endpoint profile, explicit model profile for `glm-5.2` and `glm-5.3`.
- DeepSeek: `advanced-brain.deepseek`, fixed OpenAI-compatible endpoint profile, explicit model profile for DeepSeek V4 text variants.

## Jarvis-Owned Semantics

These remain Jarvis-K owned and are not delegated to provider SDKs or agent frameworks:

- Credential Vault, Credential Binding Registry, and Credential Broker
- endpoint allowlist and model allowlist
- release channel and storage profile
- Product/local/cloud routing
- privacy and cloud egress confirmation
- Task, Planner, Plugin, Safety Gate, Approval, and Windows Executor
- IPC schemas and Settings
- timeout policy definition
- retry/fallback policy
- diagnostic sanitization and health projection
- Acceptance Service and Acceptance Ledger
- Memory write policy

Any candidate that must own these semantics is rejected for Product runtime.

## Duplication Inventory

Duplicated or drift-prone implementation areas:

- Provider-specific request shape is still partly repeated in GLM/DeepSeek acceptance and shared-runtime profiles.
- OpenAI-compatible JSON/SSE parsing is shared in `CloudReasoningRuntime`, but future providers could accidentally fork parser behavior.
- Acceptance services and shared runtime both need consistent credential lifecycle, one-time ledger, timeout, and report projection.
- Source guards are needed to keep SDK experiments out of Renderer, preload, Product routing, Planner, Plugin, Executor, and real credential paths.

Provider-specific code that can be abstracted:

- model-to-request mapper
- provider endpoint profile metadata
- provider response parser fixtures
- safe health classification mapping

Code that should not be abstracted away:

- Jarvis credential broker
- Task/Planner/Plugin/Windows execution policy
- Acceptance ledger
- timeout source of truth
- sanitized projection contracts

## Candidate Comparison

Versions were read from npm registry metadata on 2026-08-28. No dependency was installed.

| Candidate | Exact version checked | License | Module | Node requirement | Direct notable deps | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Current Jarvis Runtime | local `0.1.0-alpha.4` | project owned | CJS build output | repo engine `>=22.12.0`; local Node `v24.15.0`; Electron package `39.8.5` | existing workspace packages only | Keep as source of truth |
| Vercel AI SDK Core `ai` | `7.0.83` | Apache-2.0 | ESM | `>=22` | `@ai-sdk/gateway`, `@ai-sdk/provider`, `@ai-sdk/provider-utils` | Learn, reject as transport replacement now |
| `@ai-sdk/openai-compatible` | `3.0.39` | Apache-2.0 | ESM | `>=22` | `@ai-sdk/provider`, `@ai-sdk/provider-utils` | Possible future mapper only |
| OpenAI JS SDK `openai` | `7.8.0` | Apache-2.0 | CJS | `>=22.0.0` | none listed by npm metadata | Reject for generic provider runtime |
| Anthropic TS SDK | `0.122.0` | MIT | CJS | official docs: Node 20 LTS or later | `standardwebhooks`, `json-schema-to-ts` | Future provider-specific mapper only |
| Google GenAI SDK `@google/genai` | `2.19.0` | Apache-2.0 | ESM | `>=20.0.0` | `ws`, `p-retry`, `protobufjs`, `google-auth-library` | Future provider-specific mapper only |
| Minimal self-built OpenAI-compatible adapter | local spike | project owned | CJS/TS | repo engine | no new deps | Backup decision |
| Hybrid: Jarvis bounded transport + Jarvis security projection + provider mapper | local spike | project owned | CJS/TS | repo engine | no new deps | Primary decision |

Compatibility notes:

- Vercel AI SDK is a broad multi-provider toolkit with agent/UI helpers and gateway options. Its own documentation advertises multi-provider support, streaming, and fallbacks. Those are useful design references, but fallbacks, tools, telemetry, and gateway behavior must remain outside Jarvis Product defaults.
- OpenAI's official JS SDK is official and server-oriented; it also documents browser support as disabled by default because client-side credentials are dangerous. That aligns with Jarvis's Renderer credential ban, but the SDK still targets OpenAI APIs rather than Jarvis's multi-provider security projection.
- Anthropic and Google SDKs are valuable future provider-specific references, not a shared Jarvis runtime.

## Decision

Primary decision: **E. Hybrid**.

Jarvis-K keeps:

- `BoundedCloudReasoningTransport`
- `CloudReasoningRuntime`
- credential broker closure
- four-layer timeout source of truth
- retry/fallback restrictions
- parsing privacy rules
- sanitized diagnostics
- Product and Acceptance gates

Third-party code, if adopted later, may only enter as a provider-specific mapper behind Jarvis-owned contracts.

Backup: **A. Retain Current Runtime**.

Reject as default Product runtime:

- B. Vercel AI SDK Protocol Adapter as transport replacement
- C. Official SDK Adapters as shared runtime

Not chosen as primary yet:

- D. Minimal self-built OpenAI-compatible adapter, because the existing runtime already provides most of this and should not be forked.

## Target Interface

OSS-1 adds an isolated `CloudModelProtocolAdapter` boundary in `@jarvis-k/capabilities`.

Responsibilities:

- accept trusted Provider/Model/Endpoint/Request Contract input
- accept a derived `AbortSignal`
- use credential only through a broker closure
- perform one protocol call
- emit sanitized protocol events
- support `dispose`

Forbidden inputs:

- Renderer endpoint
- Renderer model
- Renderer headers
- Renderer credential
- arbitrary fetch options
- timeout override
- retry/fallback override
- tools or tool callback
- Task callback
- Windows action callback

The spike implementation is `JarvisBoundedCloudModelProtocolAdapter`, which wraps the current runtime instead of replacing it.

## Four-Layer Timeout Result

Jarvis timeout policy remains the source of truth:

- headers timeout
- first-event timeout
- stream idle timeout
- overall timeout

The conformance spike verifies these layers against the current runtime with fake fetch, user cancel, dispose, and concurrent call/cancel. A candidate SDK can only replace transport if it preserves all four layers through Jarvis-owned policy and a derived AbortSignal.

## Credential Lifecycle

Credential lifecycle remains:

`CloudProviderCredentialBroker.withCredential(bindingId, async credential => one protocol call)`

The adapter does not accept credentials in Renderer, IPC, model metadata, registry, diagnostics, source guards, or event payloads. Disposing the adapter prevents later calls from touching the broker.

## Shadow Conformance

The isolated conformance tests compare current runtime and adapter path on the same fake fixtures:

- JSON success
- SSE success
- split JSON
- split UTF-8
- usage final chunk
- DONE/no-final
- reasoning plus final
- `tool_calls`
- `function_call`
- malformed SSE
- invalid JSON
- invalid content type
- oversized response
- close without DONE
- 401
- 403
- 429
- 5xx
- redirect
- headers timeout
- first-event timeout
- idle timeout
- overall timeout
- user cancel
- dispose
- concurrent call/cancel

Assertions include:

- fake invocation only
- `realNetworkRequestSent=false`
- retry/fallback remain 0
- no tool execution
- no direct action
- reasoning content is observed only as a boolean and not returned as raw content
- credential marker is absent from adapter output and events

## Source Guards

Source guards added in tests:

- Renderer and preload do not import `ai`, `@ai-sdk/*`, `openai`, `@anthropic-ai/sdk`, or `@google/genai`.
- Product routing and Core Host do not import the isolated adapter spike.
- Provider adapters do not import Planner, Plugin, Executor, filesystem/env credential access, telemetry, or `ToolLoopAgent`.
- Spike code does not use Vercel Gateway hostnames or real fetch.
- No candidate SDK dependency was added to package manifests.

## Production Regression Boundary

Unchanged by OSS-1:

- Product UI and Settings
- Developer/Evaluation UI
- GLM and DeepSeek real acceptance ledgers
- DeepSeek credential state
- Chat Answer
- Heavy Planner
- local Qwen
- Planner, Plugin, Windows Executor
- Voice
- Pet and skin runtime
- Installer, tray, startup/shutdown, storage paths, and release channels

## Future Provider Work

Adding a new cloud provider should touch only:

- provider profile constants
- model capability profiles
- endpoint profile
- request mapper
- response parser fixtures if the protocol differs
- fake conformance cases
- credential binding metadata
- Developer/Evaluation acceptance profile, if explicitly approved

It must not touch Product execution policy unless a separate Product-routing phase approves it.

## Sources

- [Vercel AI SDK](https://github.com/vercel/ai)
- [Vercel AI SDK docs](https://ai-sdk.dev/)
- [OpenAI official JavaScript/TypeScript SDK](https://github.com/openai/openai-node)
- [Anthropic TypeScript SDK docs](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript)
- [Google Gen AI SDK for TypeScript and JavaScript](https://github.com/googleapis/js-genai)
- [Google Gen AI SDK overview](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/sdks/overview)

