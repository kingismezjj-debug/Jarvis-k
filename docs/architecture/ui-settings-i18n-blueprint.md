# UI, Settings, and Internationalization Blueprint

Date: 2026-08-28

Audit HEAD: `8dc7b6db979b8b34f2301e0e12b28a1fbbbcea27`

Scope: design-only audit and target blueprint.

## Current UI Findings

Approximate source scan:

- UI files scanned: 88
- User-visible string literal estimate outside copy registry: 127
- JSX text node estimate outside copy registry: 178
- Developer/evaluation literal estimate: 37
- CJK literal estimate in source scan: 0, because many Chinese strings in existing docs/source appear mojibake encoded rather than valid CJK

Current implementation signals:

- `apps/ui/src/app/ui-language.ts` stores `jarvis-k-ui-language`, defaults to English, and supports `zh`.
- `apps/ui/src/app/copy.ts` contains a copy registry, but coverage is incomplete.
- Product/Developer/Evaluation surface gating exists, but diagnostic tools are still visually prominent in several panels.
- Settings are functionally broad but not organized as a stable information architecture.

## Main UI Problems

- Settings sections grow by feature accretion instead of a registry.
- Product, Advanced, Developer, and Evaluation concepts are mixed in ordinary workflows.
- New features often add English copy without parallel Chinese keys.
- Developer diagnostics, provider probes, acceptance surfaces, and runtime details are too visible for daily users.
- Component spacing, status labels, cards, and controls are inconsistent.
- Small windows and Chinese text length need stronger layout rules.
- The pet/skin system has a stronger contract than the main application theme system.

## Target Settings Information Architecture

| Category | Scope |
| --- | --- |
| General | Language, startup behavior, close behavior, reset, basic app preferences |
| Appearance and Pet | Theme, desktop pet, built-in skin, local skin management |
| Voice and Audio | Provider setup, microphone permission, PTT, wake-word opt-in, TTS |
| Models and Intelligence | Local/cloud providers, model selection, egress policy, cost warnings |
| Tools and Automation | Safe Windows actions, browser launch, filesystem search, approval defaults |
| Plugins and MCP | Plugin enablement, permissions, local MCP status |
| Memory and Privacy | Memory controls, exports, deletion, retention, local-only collection |
| Notifications | Tray, desktop notifications, quiet behavior |
| Advanced | Resource profile, diagnostics export, recovery tools |
| Developer and Evaluation | Fixtures, acceptance harnesses, probes, benchmarks, pilot tools |
| About and Updates | Version, channel, installer/update/signature status |

## Settings Registry Strategy

Introduce a definition registry before another large UI rewrite:

| Field | Purpose |
| --- | --- |
| `settingId` | Stable id |
| `categoryId` | Settings navigation grouping |
| `labelKey` | i18n key |
| `descriptionKey` | i18n key |
| `searchKeywordKeys` | localized settings search |
| `controlType` | toggle, select, button, credential binding, link, status |
| `capabilityGate` | product/developer/evaluation availability |
| `visibility` | product, advanced, developer, evaluation |
| `restartRequired` | explicit restart messaging |
| `sensitive` | credential or security-adjacent handling |
| `validationContractId` | schema or command contract |
| `settingBindingId` | link to existing settings service value |

Registry must not store setting values, credentials, or capability state. It only describes how existing owned state appears.

## Internationalization Strategy

Recommended direction: adopt an i18next-compatible namespace model, either by migrating to `react-i18next` later or by first making the current copy registry match that structure.

Rules:

- No new user-visible hardcoded strings.
- English and Chinese key sets must remain equal.
- Developer/Evaluation copy also needs translation.
- Error reason codes map to localized copy at the edge.
- Tray/menu/native dialog copy must enter the same key audit.
- Dates, numbers, file sizes, status values, and provider names need formatting rules.
- Plugin copy should use isolated namespaces and fall back safely.
- Missing translations fail CI once UI-0 begins.

## Design System Decision

Recommended path:

1. Keep Jarvis-owned design tokens and CSS variables as the source of truth.
2. Adopt Radix UI primitives selectively for accessibility-critical controls.
3. Use shadcn/ui as a learn/selective recipe source only if the repo accepts its Tailwind-style composition.
4. Use Fluent UI React as a Windows interaction reference, not as a wholesale visual replacement.

Do not install UI libraries in OSS-0.

## Figma Plugin Recommendation

Figma integration is useful for approved design collaboration but must remain optional:

- OK: read approved components, extract design tokens, compare implementation, produce design review artifacts.
- Not OK: runtime dependency, credential holder, settings state owner, automatic publisher, or blocker for UI work.

Recommended: use Figma only after UI-0 produces an approved Settings prototype or component inventory.

## Hardware Profiles

| Profile | UI/model expectation |
| --- | --- |
| Low-spec | Rules, fixture-safe diagnostics, optional cloud complex reasoning, no always-on local heavy models |
| Standard | On-demand ASR/OCR, local small routing/embedding, bounded cloud reasoning |
| Local enhanced | Optional larger local models with explicit resource management |
| Custom | External local servers or enterprise gateways behind the same provider-neutral contracts |

## UI-0 Acceptance Criteria

- Complete page tree and Settings tree
- Hardcoded copy inventory with exact counts
- Translation key parity gate proposal
- Settings registry draft covering current settings
- Developer/Evaluation hiding plan
- Accessible component migration shortlist
- No production behavior changes until a dedicated UI implementation phase
