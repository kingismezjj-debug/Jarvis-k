# UI Surface Inventory

Date: 2026-08-28

Audit HEAD: `b77dff2d98765bdf3ce5867881fdf1fae2ad69a1`

Scope: read-only inventory for Phase UI-0. Product behavior, Settings services,
provider routing, credentials, Voice, Pet runtime, and cloud acceptance were not
changed.

## Source Shape

- UI source files scanned by AST audit: 139
- Product route entry: `apps/ui/src/App.tsx`
- Main UI shell: `apps/ui/src/app/app-shell.tsx`
- Primary navigation: `apps/ui/src/app/navigation.ts`
- Current copy registry: `apps/ui/src/app/copy.ts`
- Desktop native UI strings: `apps/desktop/src`

## Product Surfaces

| Surface | Entry | Current visibility | Data owner | Notes |
| --- | --- | --- | --- | --- |
| App shell/header | `App.tsx`, `app-header.tsx`, `app-shell.tsx` | Product | UI facade + desktop snapshot | Header/status are compact but expose runtime phase wording. |
| Primary navigation | `app-navigation.tsx` | Product; Developer hidden by default | UI surface mode | Settings is a bottom icon; Developer appears after Developer Mode. |
| Conversation | `features/conversation/*` | Product | Conversation state/actions | Main daily entry; typed command field remains visible. |
| Tasks | `features/tasks/task-timeline.tsx` | Product | Task state/actions | Shows Task projection and audit outcomes. |
| Plugins | `features/plugins/*` | Product | Plugin projection | Bundled/local plugin status; developer manifest status is gated. |
| Memory | `features/memory/*` | Product | Memory state/actions | Memory state, export/import, and deletion need clearer privacy grouping. |
| Voice | `features/voice/*` | Product | Voice state/actions | Voice Regression is hidden from product view. |
| Activity | `features/activity/*` | Product | Diagnostics/runtime state | Useful but internal terms are still prominent. |
| Settings | `App.tsx` settings branch + feature panels | Product | Mixed owners | Current tree has 8 visible sections with mixed IA. |

## Developer and Evaluation Surfaces

| Surface | Entry | Gate | Notes |
| --- | --- | --- | --- |
| Developer view | `App.tsx` developer branch | Developer Mode localStorage + Desktop Main capability projection | Developer navigation is hidden by default. |
| Runtime Inspector | `runtime-inspector-panel.tsx` | Developer Mode + inspector toggle | Internal state should stay out of product. |
| Voice Regression | `voice-regression-panel.tsx` | Evaluation surface | Hidden in Product and Voice panel. |
| GLM acceptance | `glm-advanced-brain-acceptance-panel.tsx` | Developer + Evaluation + GLM flag | Correctly diagnostic-only, but full UI has many hardcoded strings. |
| DeepSeek acceptance | `cloud-provider-acceptance-panel.tsx` | Developer + Evaluation + cloud flag | Diagnostic surface; should remain Evaluation-only. |
| Pet Skin preview/studio | `appearance-settings-panel.tsx` | Developer Mode | Currently appears under Appearance when developer mode is enabled. |

## Native Desktop Surfaces

| Surface | Entry | Current visibility | Notes |
| --- | --- | --- | --- |
| Tray menu | `apps/desktop/src/tray/desktop-tray-controller.ts` | Always available when tray exists | Strings are hardcoded English. |
| Close-to-tray lifecycle | `apps/desktop/src/lifecycle/desktop-lifecycle-controller.ts` | Product | Native notifications/dialog text should join i18n plan. |
| Onboarding | `features/onboarding/first-run-onboarding.tsx` | First run | Hardcoded English copy; no full i18n. |
| Settings windows | `apps/desktop/src/*settings*` | Native/Desktop Main | Must stay Main-owned and expose safe projections only. |

## Current Settings Tree

Current Settings section count: 8

1. Language
2. Theme / Appearance / Pet Skin / Skin Studio
3. General runtime metrics, local TTS, close behavior, launch at login, Desktop Pet, Developer Mode
4. Command Router and Qwen runtime control
5. Chat Answer provider-backed mode
6. Voice and TTS settings
7. Memory Alpha
8. Model Governance, Developer-only

## Main Issues

| Severity | Issue | Evidence |
| --- | --- | --- |
| P1 | Product settings mix daily controls with Developer/Evaluation internals. | `SettingsGeneralPanel` includes Developer Mode; `AppearanceSettingsPanel` includes Skin Studio under the same page. |
| P1 | i18n is incomplete and lacks key parity enforcement. | AST audit found 838 missing-i18n observations. |
| P1 | Settings have no definition registry or search index. | Settings are directly composed in `App.tsx` and panel props. |
| P2 | Native menu/dialog strings are English-only. | Tray labels are hardcoded in Desktop Main. |
| P2 | Internal IDs/status codes leak into ordinary surfaces. | Provider IDs, policy IDs, and runtime states appear as raw values. |
| P2 | Narrow window minimum size remains large. | `AppShell` uses `min-w-[920px]`; prototype shows desired responsive behavior separately. |

## Developer/Evaluation Exposure

- Product UI hides Developer navigation until Developer Mode is enabled.
- Evaluation tools require Developer Mode and Desktop Main capability projection.
- Some development capabilities still appear in Product Settings once Developer Mode is on, instead of a dedicated Developer & Evaluation category.
- Current UI already has good safety gates; the next UI phase should reorganize surfaces without weakening those gates.
