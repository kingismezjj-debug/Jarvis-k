# OSS Reuse Decision Matrix

Date: 2026-08-28

Audit HEAD: `8dc7b6db979b8b34f2301e0e12b28a1fbbbcea27`

Scope: design-only decisions. No dependency is installed by this phase.

## Decision Vocabulary

- Build: Jarvis-K owns implementation and semantics.
- Adopt: direct dependency is acceptable after a dedicated implementation phase.
- Wrap: third-party code may sit behind Jarvis-K contracts and gates.
- Learn: study product or architecture patterns only.
- Reject: not suitable for Jarvis-K at this stage.

Summary count: Build 12, Adopt 6, Wrap 12, Learn 8, Reject 7.

## Recommended Candidates

| Area | Candidate | Source | License note | Decision | Why |
| --- | --- | --- | --- | --- | --- |
| Provider protocol | Vercel AI SDK | https://github.com/vercel/ai | OSS repo license to verify before adoption | Learn/possible Wrap | Useful provider-shape ideas, but Jarvis already owns transport, credentials, task, and safety |
| Provider gateway | LiteLLM | https://github.com/BerriAI/litellm | OSS repo license to verify before adoption | Learn/Reject as runtime default | Strong provider catalogue, but gateway ownership conflicts with Jarvis egress and credential policy |
| Provider gateway | Portkey Gateway | https://github.com/Portkey-AI/gateway | OSS repo license to verify before adoption | Learn/Reject as runtime default | Useful gateway patterns, but not a desktop product kernel dependency |
| Local LLM serving | Ollama | https://github.com/ollama/ollama | MIT at repo time of audit | Wrap | Good optional local runtime for standard/enhanced profiles, not mandatory for low-spec users |
| Local LLM engine | llama.cpp | https://github.com/ggml-org/llama.cpp | MIT at repo time of audit | Wrap | Useful backend for GGUF local inference through process boundary |
| Local LLM serving | vLLM | https://github.com/vllm-project/vllm | Apache-2.0 at repo time of audit | Reject for default desktop | Server/GPU-heavy; candidate only for custom external workstation mode |
| Local model API | LM Studio | https://lmstudio.ai/docs/developer | Product docs, license varies by distribution | Wrap/Learn | Useful OpenAI-compatible local endpoint pattern; not a bundled dependency now |
| Agent workflow | LangGraph JS | https://github.com/langchain-ai/langgraphjs | MIT at repo time of audit | Learn/limited Wrap | Good graph ideas, but cannot own Jarvis Task Runtime or execution loop |
| Agent framework | Mastra | https://github.com/mastra-ai/mastra | Repo documents Apache-2.0 core and enterprise-licensed directories | Learn | Good TypeScript agent design references; avoid adopting whole loop |
| ASR | faster-whisper | https://github.com/SYSTRAN/faster-whisper | MIT at repo time of audit | Wrap | Good future local ASR adapter candidate; Python/process cost must be optional |
| ASR | whisper.cpp | https://github.com/ggml-org/whisper.cpp | MIT at repo time of audit | Wrap | Good low-resource local ASR candidate through process boundary |
| ASR/TTS | sherpa-onnx | https://github.com/k2-fsa/sherpa-onnx | Apache-2.0 at repo time of audit | Wrap | Strong offline speech stack candidate; validate model licenses separately |
| Wake word | openWakeWord | https://github.com/dscripka/openWakeWord | Apache-2.0 at repo time of audit | Wrap | Future opt-in wake word engine; must never start by default |
| TTS | Piper | https://github.com/rhasspy/piper | MIT at repo time of audit | Wrap | Local TTS candidate; voice model licenses and packaging need review |
| OCR | PaddleOCR | https://github.com/PaddlePaddle/PaddleOCR | Apache-2.0 at repo time of audit | Wrap | Strong OCR candidate, but runtime size may be high |
| OCR | Tesseract | https://github.com/tesseract-ocr/tesseract | Apache-2.0 at repo time of audit | Wrap | Mature OCR fallback; Chinese model packaging must be reviewed |
| Vision utility | OpenCV | https://github.com/opencv/opencv | Apache-2.0 at repo time of audit | Wrap | Useful for image preprocessing; avoid large always-on dependency |
| Inference runtime | ONNX Runtime | https://github.com/microsoft/onnxruntime | MIT at repo time of audit | Adopt/Wrap | Already aligned with local runtimes; keep behind adapter |
| Vector DB | LanceDB | https://github.com/lancedb/lancedb | Apache-2.0 at repo time of audit | Learn/Wrap later | Good local vector candidate; Jarvis must own memory policy |
| Vector DB | Qdrant | https://github.com/qdrant/qdrant | Apache-2.0 at repo time of audit | Wrap for external/custom | Strong service option, too much for default desktop |
| RAG framework | LlamaIndex | https://github.com/run-llama/llama_index | MIT at repo time of audit | Learn | Useful retrieval patterns; should not own memory writes |
| Memory agent | Mem0 | https://github.com/mem0ai/mem0 | Apache-2.0 at repo time of audit | Learn/Reject default | Product memory semantics would conflict |
| Agent memory | Letta | https://github.com/letta-ai/letta | Apache-2.0 at repo time of audit | Learn/Reject default | Valuable architecture reference, not a product kernel dependency |
| MCP | MCP TypeScript SDK | https://github.com/modelcontextprotocol/typescript-sdk | MIT at repo time of audit | Adopt/Wrap | Best official base for MCP adapter, with Jarvis permission gate in front |
| Desktop automation | Microsoft UI Automation | https://learn.microsoft.com/en-us/windows/win32/winauto/entry-uiauto-win32 | Windows platform API | Adopt | Preferred official Windows accessibility automation layer |
| Desktop automation | FlaUI | https://github.com/FlaUI/FlaUI | MIT at repo time of audit | Wrap | Good UIA wrapper if .NET bridge is acceptable |
| Desktop automation | pywinauto | https://github.com/pywinauto/pywinauto | BSD-3-Clause at repo time of audit | Wrap/Learn | Useful Windows automation reference; Python runtime cost matters |
| Desktop automation | nut.js | https://github.com/nut-tree/nut.js | MIT at repo time of audit | Reject default | Coordinate/input simulation should remain last resort |
| Browser automation | Playwright | https://github.com/microsoft/playwright | Apache-2.0 at repo time of audit | Wrap | Excellent test/runtime browser automation, but domain and action permissions are required |
| UI primitives | Radix UI | https://github.com/radix-ui/primitives | MIT at repo time of audit | Adopt candidate | Headless accessible primitives fit custom design tokens |
| UI component set | shadcn/ui | https://github.com/shadcn-ui/ui | MIT at repo time of audit | Learn/Selective Adopt | Useful recipes; avoid wholesale design lock-in |
| Windows UI | Fluent UI React | https://github.com/microsoft/fluentui | MIT at repo time of audit | Learn/Selective Adopt | Good Windows patterns; visual weight may not match Jarvis |
| i18n | react-i18next/i18next | https://github.com/i18next/react-i18next | MIT at repo time of audit | Adopt candidate | Mature path for typed namespaces, fallback, and runtime language switch |
| AI client | Cherry Studio | https://github.com/CherryHQ/cherry-studio | AGPL-3.0 community edition noted in repo | Learn/Reject dependency | Useful UX reference, license and product-scope conflicts |
| AI client | LibreChat | https://github.com/danny-avila/LibreChat | MIT at repo time of audit | Learn | Useful chat/settings reference; web app scope differs |
| AI client | Open WebUI | https://github.com/open-webui/open-webui | BSD-3-Clause at repo time of audit | Learn | Useful model management UX reference; not a desktop kernel dependency |
| Extension platform | VS Code API | https://code.visualstudio.com/api | Official docs | Learn | Good extension host patterns; not a direct dependency |

## Explicit Rejects

| Candidate | Reject reason |
| --- | --- |
| LiteLLM as default runtime gateway | Would move endpoint, retry, fallback, and credential semantics outside the Jarvis kernel |
| Portkey Gateway as default runtime gateway | Same gateway ownership conflict; better as custom enterprise mode later |
| vLLM bundled in default desktop | GPU/server-heavy and unsuitable for low-spec default install |
| Full LangGraph/Mastra agent loop adoption | Would duplicate Task Runtime, Planner, recovery, and safety ownership |
| Mem0/Letta as memory source of truth | Would conflict with Jarvis memory write/delete/export policy |
| nut.js as primary Windows executor | Mouse/keyboard simulation is too brittle and high-risk as default |
| Cherry Studio as runtime dependency | Full client scope and AGPL distribution constraints conflict with Jarvis architecture |

## License and Supply-Chain Risks

- Every candidate needs a per-version license file check before dependency installation.
- Model weights and voice assets need separate license review; code license is not enough.
- Optional native modules must be verified in packaged runtime closure.
- Framework telemetry, auto-networking, background services, and credential storage must be disabled or wrapped.
- Learn-only projects cannot be copied into the repository.

## Adoption Gates

Before any OSS candidate can move from this document to implementation:

- Dedicated phase with one primary behavior change
- License and transitive dependency review
- Boundary tests proving no credential, task, memory, or tool execution takeover
- Fake adapter and health projection
- Disable/remove path
- Packaged runtime closure test when desktop runtime is affected
