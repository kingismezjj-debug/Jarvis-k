# OSS and UI Integration Roadmap

Date: 2026-08-28

Audit HEAD: `8dc7b6db979b8b34f2301e0e12b28a1fbbbcea27`

Scope: design-only roadmap.

## Principles

- One phase, one primary behavior change.
- Keep Product Kernel ownership in Jarvis-K.
- Introduce interfaces before replacing implementations.
- Use fake adapters before opt-in real providers.
- Use opt-in developer surfaces before product exposure.
- Every third-party dependency needs disable, rollback, and packaged-runtime validation.
- UI modernization should begin with information architecture and copy contracts, not visual churn.

## Recommended Sequence

| Order | Phase | Primary outcome | Blocks |
| ---: | --- | --- | --- |
| 1 | OSS-1 Provider Protocol Adapter Decision | Consolidate OpenAI-compatible request/response/parser reuse plan without changing Product routing | DeepSeek/GLM product path |
| 2 | UI-0 Settings/i18n Audit and Approved Prototype | Produce exact Settings registry, i18n key plan, and product/developer/evaluation IA | UI-1 |
| 3 | UI-1 Design Tokens and Accessible Components | Establish stable tokens and primitive component layer | UI-2 |
| 4 | UI-2 Settings Registry Navigation/Search/i18n | Implement registry-driven Settings and translation gates | Later product surfaces |
| 5 | OSS-2 MCP Official SDK Adapter | Wrap official MCP TypeScript SDK behind plugin permission gate | Plugin ecosystem |
| 6 | OSS-3 Browser Automation Adapter | Add explicit domain-permission browser automation wrapper | Advanced web tasks |
| 7 | OSS-4 ASR Local Adapter Benchmark | Evaluate local ASR candidates against locked regression needs | Voice expansion |
| 8 | OSS-5 Wake Word/TTS Adapter | Opt-in wake word and local TTS wrappers | Hands-free voice |
| 9 | OSS-6 OCR/Vision Adapter | Introduce OCR and screenshot privacy boundaries | Screen understanding |
| 10 | OSS-7 Memory/Vector Adapter | Evaluate LanceDB/Qdrant or equivalent behind Jarvis memory policy | Larger memory |
| 11 | OSS-8 Windows UI Automation Adapter | Wrap UIA/FlaUI style automation behind Desktop Host policy | Rich Windows tasks |
| 12 | OSS-9 Plugin Packaging/Trust | Signing, permission review, and package trust model | Marketplace readiness |
| 13 | OSS-10 Pet/Skin Package Hardening | Optional scan/signature pipeline for skins | Community skins |
| 14 | OSS-11 Installer Optional Component Manager | Optional runtime/model component installation | Release readiness |

## Parallelism Rules

- OSS-1 and UI-0 can be planned together but should not edit the same code.
- UI-1 must happen before broad Settings implementation.
- MCP/browser/vision adapters should not begin before the Settings visibility model is clear.
- Packaging work should follow any dependency adoption that affects runtime closure.

## Deferred

- Full Skin Studio marketplace
- Community upload
- Auto update
- Multi-OS support
- Third-party agent framework ownership
- Always-on local heavy model installation

## Next Recommendation

Next single phase: OSS-1 Provider Protocol Adapter Decision.

Reason: model-provider code now has GLM and DeepSeek parallel paths. A design-first adapter decision can reduce duplication before any product cloud routing is enabled.
