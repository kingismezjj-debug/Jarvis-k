# OSS-0 Audit Summary

Date: 2026-08-28

Audit HEAD: `8dc7b6db979b8b34f2301e0e12b28a1fbbbcea27`

Scope: design-only summary.

## Baseline

- Branch: `main`
- HEAD equals `origin/main` at audit start.
- Worktree was clean at audit start.
- Root package version: `0.1.0-alpha.4`.
- Workspace package surface: 20 library packages plus Desktop, UI, and Core Host applications.

## Capability Signals

Implemented or partially implemented:

- Product kernel, deterministic routing, task runtime, safety gates, plugin/memory/model foundations
- Voice benchmark, local-only regression collection, non-execution pilot boundary
- Desktop Alpha storage isolation, tray lifecycle, launch-at-login implementation
- Desktop Pet, pet state protocol, skin contract, secure preview, local install/activate/rollback, Studio export
- Provider-neutral cloud transport, GLM and DeepSeek fake acceptance paths, credential vault framework

Thin or missing:

- UIA-rich Windows automation
- OCR/vision
- Local ASR/TTS fallback
- Settings registry and complete i18n
- Marketplace/community
- Signing, update, crash reporting

## UI Exposure

Developer/Evaluation gating exists, but the ordinary UI still carries implementation-language residue:

- Diagnostic labels and provider details are prominent.
- Settings do not yet have a stable user mental model.
- New feature surfaces have outpaced copy and translation discipline.

## Translation Baseline

Approximate scan:

- UI files scanned: 88
- String literal estimate needing review: 127
- JSX text node estimate needing review: 178
- Developer/evaluation literal estimate: 37
- Valid CJK literal estimate in scanned UI: 0, likely because existing Chinese content is encoded incorrectly in some files/docs.

These are rough counts and should be replaced by an AST/i18n extraction gate in UI-0.

## P0/P1/P2 Findings

P0: none found in this read-only audit.

P1:

- Settings and i18n are not yet ready for broad daily-user comprehension.
- Model-provider runtime code risks duplication unless shared protocol adoption is decided soon.

P2:

- UI copy, status labels, and diagnostics need product-language cleanup.
- OSS adoption review needs exact per-version license verification before implementation.

## Recommended Next Phase

OSS-1 Provider Protocol Adapter Decision.

Reason: it addresses provider duplication before Product Advanced Brain routing is enabled, without requiring a large UI rewrite or a new real-network acceptance.
