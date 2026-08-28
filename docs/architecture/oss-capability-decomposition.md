# Jarvis-K OSS-0 Capability Decomposition

Date: 2026-08-28

Audit HEAD: `8dc7b6db979b8b34f2301e0e12b28a1fbbbcea27`

Scope: design-only architecture audit. This document does not change production behavior.

## Product Goal

Jarvis-K is a Windows 10/11 local personal agent platform, not only a chat client. The long-term product goal is a Chinese-first desktop agent that can route text and voice intent, use local and cloud models, operate approved Windows capabilities, run multi-step tasks with verification, expose a plugin/MCP ecosystem, maintain user-controlled memory, and provide a customizable desktop pet and skin surface.

Non-delegable product kernel:

- Task, step, event, and execution semantics
- Safety and approval decisions
- Credential ownership and secure storage
- Provider selection policy
- Memory write policy
- Plugin permission policy
- Windows execution boundaries
- Release-channel storage identity

## Maturity Scale

| Level | Meaning |
| --- | --- |
| L0 | Not present |
| L1 | Contract or document only |
| L2 | Fake or fixture tested |
| L3 | Isolated real integration |
| L4 | Product path usable |
| L5 | Release-ready with recovery, failure semantics, and real acceptance |

## Capability Domains

| Domain | Leaf count | Current summary |
| --- | ---: | --- |
| Product Kernel | 14 | Mostly L3-L4, with L5 gaps around recovery and rollback |
| Model and Reasoning | 16 | L2-L3, product cloud routing intentionally disabled |
| Voice | 13 | L2-L4, standard large pilot deferred |
| Windows Execution | 12 | L2-L4, real acceptance gated |
| Vision/OCR | 8 | Mostly L0-L1 |
| Memory/RAG | 10 | L2-L4, user controls still early |
| Plugin/MCP | 11 | L2-L4, marketplace not started |
| Browser/Web | 7 | L2-L3, authenticated control not started |
| UI/Desktop Experience | 15 | L2-L4, Settings/i18n needs reset |
| Packaging/Operations | 8 | L2-L4, signing/update not ready |
| Security/Privacy | 12 | L3-L4, supply-chain program not formalized |
| Total | 126 | Enough product spine exists; next work should reduce duplication and improve user-facing coherence |

## Leaf Capability Matrix

### Product Kernel

| Capability | Current owner | Maturity | Decision |
| --- | --- | --- | --- |
| Intent routing contract | Core | L4 | Build |
| Deterministic command resolver | Core | L4 | Build |
| Task lifecycle state machine | Core | L4 | Build |
| Step/event ledger | Core | L3 | Build |
| Approval boundary | Core/Desktop/UI | L3 | Build |
| Execution semantics projection | Core/UI | L4 | Build |
| Safety policy gate | Core | L4 | Build |
| Runtime configuration | Core/Desktop | L3 | Build |
| Release-channel storage profile | Desktop/Core Host | L4 | Build |
| Provider capability registry | Core | L3 | Build |
| Diagnostic projection sanitizer | Core/Desktop | L4 | Build |
| One-time acceptance ledger | Desktop Main | L3 | Build |
| Fixture isolation policy | Tests/Core/Desktop | L4 | Build |
| Product/developer/evaluation surface gate | UI/Desktop | L4 | Build |

### Model and Reasoning

| Capability | Current owner | Maturity | Decision |
| --- | --- | --- | --- |
| Provider-neutral request/result schema | Contracts/Core | L3 | Build |
| Endpoint profile guard | Core | L3 | Build |
| Bounded cloud transport | Core | L3 | Build |
| OpenAI-compatible response parsing | Core | L3 | Wrap |
| GLM adapter | Core | L2-L3 | Build |
| DeepSeek adapter | Core | L2-L3 | Build |
| Qwen local router | Core/Python helper | L3-L4 | Wrap |
| Local embedding runtime | Memory/inference runtime | L3 | Wrap |
| Model capability profile | Core | L3 | Build |
| Retry-before-response policy | Core | L3 | Build |
| Structured plan proposal | Core | L2-L3 | Build |
| Product cloud routing gate | Core/UI | L1-L2 | Build |
| Cloud credential binding | Desktop Main | L3 | Build |
| Provider health projection | Core/UI | L3 | Build |
| Local runtime artifact pinning | Core/scripts | L3 | Build |
| Advanced Brain orchestration | Core | L2 | Build |

### Voice

| Capability | Current owner | Maturity | Decision |
| --- | --- | --- | --- |
| Browser microphone capture | UI/voice-capture | L3 | Wrap |
| Voice engine session contract | Voice/Core | L3 | Build |
| Xunfei adapter | Voice | L3 | Wrap |
| Volcengine adapter | Voice | L3 | Wrap |
| ASR provider identity propagation | Voice/UI/Core | L4 | Build |
| Input mode provenance | Voice/UI/Core | L4 | Build |
| PTT command flow | UI/Voice | L3-L4 | Build |
| Wake word strategy | Voice | L1-L2 | Wrap |
| Local ASR fallback | Voice | L0-L1 | Wrap |
| Local TTS playback | Voice/Desktop | L2-L3 | Wrap |
| Voice regression collection | Core/UI | L4 | Build |
| Redaction/export review | Core/scripts | L4 | Build |
| Voice command benchmark | datasets/tests | L3 | Build |

### Windows Execution

| Capability | Current owner | Maturity | Decision |
| --- | --- | --- | --- |
| Local app launch | Desktop/Core | L4 | Build |
| Browser open | Desktop/Core | L4 | Build |
| Window discovery | Desktop/Core | L2-L3 | Wrap |
| Window focus/minimize/restore | Desktop/Core | L3-L4 | Wrap |
| Notepad text write | Desktop/Core | L3 | Build |
| Filesystem search | Core/Desktop | L3-L4 | Build |
| Clipboard write | Desktop | L1-L2 | Build |
| Screenshot capture | Desktop | L1 | Wrap |
| UI Automation controls | Desktop | L1-L2 | Wrap |
| Result verification | Core/Desktop | L3 | Build |
| Rollback | Core/Desktop | L1 | Build |
| Elevation boundary | Desktop | L1 | Build |

### Vision/OCR

| Capability | Current owner | Maturity | Decision |
| --- | --- | --- | --- |
| Screen capture | Desktop | L1 | Wrap |
| Region selection | UI/Desktop | L0-L1 | Build |
| OCR text extraction | none | L0 | Wrap |
| Layout analysis | none | L0 | Wrap |
| UI localization support | none | L0 | Learn |
| Vision model adapter | none | L0 | Wrap |
| Image compression/redaction | none | L0-L1 | Build |
| Privacy cache policy | none | L0-L1 | Build |

### Memory/RAG

| Capability | Current owner | Maturity | Decision |
| --- | --- | --- | --- |
| Session memory | Core | L3-L4 | Build |
| User preferences | Core/UI | L3 | Build |
| Long-term facts | Memory | L3 | Build |
| Task history | Core/Memory | L3 | Build |
| Embeddings | inference/memory | L3 | Wrap |
| Vector storage | memory-sqlite | L3 | Build |
| Retrieval | Memory/Core | L3-L4 | Build |
| Reranking | none/local model | L1-L2 | Wrap |
| Write policy | Core | L3 | Build |
| Delete/export | UI/Core | L3 | Build |

### Plugin/MCP

| Capability | Current owner | Maturity | Decision |
| --- | --- | --- | --- |
| Plugin manifest | Contracts/plugin-sdk | L4 | Build |
| Plugin SDK | plugin-sdk | L3-L4 | Build |
| Plugin registry | Core/UI | L3 | Build |
| MCP client adapter | Core | L1-L2 | Wrap |
| Tool schema validation | Contracts/Core | L4 | Build |
| Permission declaration | Contracts/Core | L4 | Build |
| Install/update/remove | Core/UI | L2-L3 | Build |
| Enable/disable/revocation | Core/UI | L3-L4 | Build |
| Sandbox/runtime worker | Core/plugin runtime | L3 | Build |
| Signing | none | L0-L1 | Build |
| Marketplace readiness | none | L0 | Learn |

### Browser/Web

| Capability | Current owner | Maturity | Decision |
| --- | --- | --- | --- |
| Safe URL launch | Desktop/Core | L4 | Build |
| Web search | none | L0-L1 | Wrap |
| Read-only extraction | none | L0-L1 | Wrap |
| Authenticated browser control | none | L0 | Reject for now |
| Downloads | none | L0 | Build later |
| Forms | none | L0 | Reject for now |
| Domain permissions | Core | L1-L2 | Build |

### UI/Desktop Experience

| Capability | Current owner | Maturity | Decision |
| --- | --- | --- | --- |
| App shell | UI | L4 | Build |
| Chat surface | UI | L4 | Build |
| Task timeline | UI | L3-L4 | Build |
| Approval cards | UI/Core | L3 | Build |
| Settings | UI/Desktop | L2-L3 | Build |
| Settings search | none | L0 | Build |
| Tray | Desktop | L4 | Build |
| Launch at login | Desktop | L3-L4 | Build |
| Desktop pet | Desktop/Pet renderer | L4 | Build |
| Pet states/animations | Desktop/Pet renderer | L4 | Build |
| Pet skins | Desktop/UI | L3-L4 | Build |
| Themes | UI | L3 | Build |
| Accessibility | UI | L1-L2 | Adopt headless primitives |
| Low-resource rendering | UI/Pet | L3 | Build |
| Internationalization | UI | L1-L2 | Adopt i18next style incrementally |

### Packaging/Operations

| Capability | Current owner | Maturity | Decision |
| --- | --- | --- | --- |
| Windows installer | Desktop/package | L3-L4 | Build |
| Runtime dependency closure | Desktop/package | L4 | Build |
| Auto update | none | L0 | Build later |
| CoreHost supervision | Desktop | L4 | Build |
| Model download/cache | Core | L3 | Build |
| Integrity verification | scripts/Core | L3 | Build |
| Crash recovery | Desktop/Core | L1-L2 | Build |
| Diagnostics/logging | Core/UI | L3 | Build |

### Security/Privacy

| Capability | Current owner | Maturity | Decision |
| --- | --- | --- | --- |
| Credential vault | Desktop Main | L4 | Build |
| Credential broker | Desktop/Core | L3 | Build |
| IPC schemas | Contracts/Desktop | L4 | Build |
| Storage isolation | Desktop/Core | L4 | Build |
| Release channels | Desktop/Core | L4 | Build |
| Cloud egress policy | Core/UI | L3 | Build |
| Sensitive logging guard | scripts/tests | L4 | Build |
| User data boundaries | Desktop/Core | L4 | Build |
| Supply-chain review | docs/tests | L1-L2 | Build |
| Skin package validator | Contracts/Desktop | L4 | Build |
| Plugin permission sandbox | Core | L3 | Build |
| Test/fixture isolation | tests/Core/Desktop | L4 | Build |

## Duplicate Implementations

Potential duplicates to retire by adapter policy:

- Model request construction exists in one-off acceptance paths and shared runtime paths.
- UI settings definitions are scattered across panels instead of a registry.
- Diagnostics, evaluation, and product surfaces are gated in several places.
- Some state labels are duplicated between Core projections and UI display copy.
- Pet preview and installed skin resource protocols are separated correctly, but management UI now needs a shared descriptor shape.

## Architecture Conflicts

| Conflict | Risk | Guard |
| --- | --- | --- |
| Adopting agent frameworks as orchestrators | Duplicate Task/Planner/Safety owner | Third-party agent libraries may only run behind plan-proposal adapters |
| Adopting credential-aware SDKs directly in Renderer | Credential exposure | Renderer receives configured/missing only |
| Full AI desktop clients as dependencies | Product semantics drift and license risk | Learn-only |
| Browser automation with active sessions | Privacy and account action risk | Start with explicit domain permissions and observe-only tests |
| Native desktop automation libraries | Windows side effects | Desktop Host owns all execution gates |
| Vector DB as memory owner | Uncontrolled writes/deletes | Jarvis memory policy remains source of truth |

## Sources

This audit used official repositories or docs only, including: [Vercel AI SDK](https://github.com/vercel/ai), [LiteLLM](https://github.com/BerriAI/litellm), [Portkey Gateway](https://github.com/Portkey-AI/gateway), [Ollama](https://github.com/ollama/ollama), [llama.cpp](https://github.com/ggml-org/llama.cpp), [vLLM](https://github.com/vllm-project/vllm), [LM Studio docs](https://lmstudio.ai/docs/developer), [LangGraph JS](https://github.com/langchain-ai/langgraphjs), [Mastra](https://github.com/mastra-ai/mastra), [faster-whisper](https://github.com/SYSTRAN/faster-whisper), [whisper.cpp](https://github.com/ggml-org/whisper.cpp), [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx), [openWakeWord](https://github.com/dscripka/openWakeWord), [Piper](https://github.com/rhasspy/piper), [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR), [Tesseract](https://github.com/tesseract-ocr/tesseract), [OpenCV](https://github.com/opencv/opencv), [ONNX Runtime](https://github.com/microsoft/onnxruntime), [LanceDB](https://github.com/lancedb/lancedb), [Qdrant](https://github.com/qdrant/qdrant), [LlamaIndex](https://github.com/run-llama/llama_index), [Mem0](https://github.com/mem0ai/mem0), [Letta](https://github.com/letta-ai/letta), [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk), [MCP docs](https://modelcontextprotocol.io/docs/getting-started/intro), [Microsoft UI Automation](https://learn.microsoft.com/en-us/windows/win32/winauto/entry-uiauto-win32), [FlaUI](https://github.com/FlaUI/FlaUI), [pywinauto](https://github.com/pywinauto/pywinauto), [nut.js](https://github.com/nut-tree/nut.js), [Playwright](https://github.com/microsoft/playwright), [Radix UI](https://github.com/radix-ui/primitives), [shadcn/ui](https://github.com/shadcn-ui/ui), [Fluent UI](https://github.com/microsoft/fluentui), [react-i18next](https://github.com/i18next/react-i18next), [Cherry Studio](https://github.com/CherryHQ/cherry-studio), [LibreChat](https://github.com/danny-avila/LibreChat), [Open WebUI](https://github.com/open-webui/open-webui), and [VS Code API](https://code.visualstudio.com/api).
