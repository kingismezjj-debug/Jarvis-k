# ADR-0001: Open Source Capability Adapter Policy

Date: 2026-08-28

Status: Proposed

## Context

Jarvis-K has grown enough local product kernel code that adopting large open-source frameworks can either speed up capability delivery or accidentally replace the product's own semantics. The project needs a default decision rule before adding new dependencies.

## Decision

Jarvis-K will use open-source components primarily as bounded adapters behind Jarvis-owned contracts.

Jarvis-K keeps ownership of:

- Task lifecycle
- Planner admission
- Approval and safety
- Credential vault
- Memory write/delete policy
- Provider selection
- Plugin permission model
- Windows execution semantics
- Product/Developer/Evaluation surface gates

Third-party components may provide:

- Model protocol clients
- Local model processes
- ASR/TTS/OCR engines
- Vector storage primitives
- UI primitives
- Browser/UI automation primitives
- MCP protocol plumbing

## Required Review Before Adoption

Every dependency adoption must include:

- Official repository and license review
- Transitive dependency scan
- Runtime closure and packaging impact
- Credential and telemetry audit
- Adapter health/error projection
- Timeout/cancel/dispose behavior
- Fake implementation
- Disable/remove path
- Product surface gate

## Rejected Alternatives

- Replace Jarvis Core with a generic agent framework.
- Put provider SDKs directly in Renderer.
- Let external memory frameworks decide what to remember.
- Let browser or UI automation tools bypass the Safety Gate.
- Use full AI clients as embedded runtime dependencies.

## Consequences

This policy is slower than wholesale adoption, but it preserves Jarvis-K's product identity, safety model, and release-channel isolation. It also keeps future replacement cost lower.
