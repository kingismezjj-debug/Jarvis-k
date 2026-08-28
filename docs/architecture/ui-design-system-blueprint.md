# UI Design System Blueprint

Date: 2026-08-28

Audit HEAD: `1fc56cb66459ac2951eb7cbeee6de3d094cdad34`

Scope: UI-1 token and component foundation only. Real Product Settings are not
migrated in this phase.

## Visual Direction

Jarvis-K keeps two coordinated layers:

- Product Workspace: quiet Windows desktop utility, dense but readable, low
  motion, and clear status.
- Jarvis Identity Layer: Desktop Pet, HUD, listening/thinking feedback, and
  brand moments.

The Product Workspace should not inherit every glow or animation from the
identity layer.

## Token Source

The source of truth now lives in:

- `apps/ui/src/design-system/tokens.ts`
- `apps/ui/src/design-system/foundation.css`

The TypeScript token object owns names and counts. CSS variables expose the same
Jarvis namespace for components and isolated galleries.

| Token group | UI-1 coverage |
| --- | --- |
| Background | `background.canvas`, `background.surface`, `background.elevated`, `background.subtle` |
| Text | `text.primary`, `text.secondary`, `text.muted`, `text.inverse` |
| Border/focus | `border.default`, `border.subtle`, `border.strong`, `focus.ring` |
| Accent | `accent.default`, `accent.hover`, `accent.pressed`, `accent.subtle` |
| Status | `status.success`, `status.warning`, `status.danger`, `status.info` |
| Overlay | `overlay.scrim` |
| Typography | system UI/CJK font stacks, sizes `xs` through `2xl`, weights, line-height, letter-spacing |
| Spacing | `0`, `1`, `2`, `3`, `4`, `6`, `8`, `10`, `12`, `16` |
| Radius | `none`, `sm`, `md`, `lg`, `full` |
| Shadow | `none`, `surface`, `elevated`, `dialog` |
| Motion | `fast`, `normal`, `slow`, standard/enter/exit easing |
| Layout | content width, nav width, setting row height, narrow breakpoint, header height, touch target, z-index layers |
| Density | `comfortable`, `compact` |
| Identity | HUD accent, listening/thinking/acting/success, Pet state colors |

Components should consume `--jk-*` variables and must not introduce arbitrary
new hex colors or one-off spacing values. Existing legacy Product CSS was not
bulk-rewritten in UI-1.

## Fonts

UI font stack:

- `Segoe UI Variable`
- `Segoe UI`
- `Microsoft YaHei UI`
- `Microsoft YaHei`
- `PingFang SC`
- `Noto Sans CJK SC`
- `system-ui`
- `sans-serif`

Mono font stack is reserved for code, model IDs, binding IDs, and explicit
Developer diagnostics. Normal Product pages should not use mono text to create a
technical mood.

## Component Decision

Current repo already has Tailwind, lucide icons, small Jarvis components, and
Radix primitives for scroll area, separator, and tooltip. UI-1 did not add new
dependencies. Existing Radix/shadcn/Tailwind-related dependencies remain in the
repo, but no new Radix package was installed for this phase.

The first foundation layer uses native React controls plus Jarvis tokens. Radix
remains optional for later interaction primitives if a specific control needs
stronger focus or portal behavior.

## Foundation Components

General components:

- `Button`
- `IconButton`
- `TextField`
- `SearchField`
- `Switch`
- `Select`
- `Tooltip`
- `Dialog`
- `Divider`
- `Badge`
- `Spinner`
- `EmptyState`
- `InlineNotice`
- `Section`
- `Stack`
- `Row`
- `SettingStatus`

Settings-specific components:

- `SettingsPageHeader`
- `SettingsSection`
- `SettingRow`
- `SettingValueAction`
- `SettingSwitchRow`
- `SettingStatus`
- `SettingUnavailable`
- `SettingsCategoryNav`
- `SettingsCategorySelect`
- `SettingsSearchResult`
- `SettingsSearchEmpty`
- `ConnectionCard`
- `DangerSection`
- `DiagnosticList`

These components are presentation-only. They do not access `window.jarvis`, IPC,
Settings Service, credential storage, Provider state, network, filesystem, Task
Runtime, Plugin Runtime, or release gates.

## Status Language

UI-1 separates status keys from user-facing copy:

| Key | Product EN | Product zh-CN |
| --- | --- | --- |
| `ready` | Ready to use | 可直接使用 |
| `configured` | Configured | 已配置 |
| `not_configured` | Not configured | 未配置 |
| `unavailable` | Unavailable | 暂不可用 |
| `requires_setup` | Setup required | 需要设置 |
| `disabled` | Off | 已关闭 |
| `local_only` | Local only | 仅在本机处理 |
| `read_only` | Read only | 只读 |
| `update_available` | Update available | 有可用更新 |

Developer surfaces may show the raw status key when explicitly requested by a
developer fixture. Product surfaces should use localized labels.

## Accessibility Rules

- Use semantic controls for switches, selects, dialogs, and tooltips.
- Every icon-only button needs an accessible label.
- Focus ring must remain visible in dark and future light themes.
- Chinese text must be tested at narrow width and 200% zoom.
- Reduced Motion disables continuous rotation, floating, pulsing, and blinking.
- High contrast mode should remove decorative blur/shadow first.
- Errors cannot rely on color alone.

## Isolated Component Gallery

The UI-1 gallery lives in:

- `prototypes/ui-foundation-gallery/index.html`
- `prototypes/ui-foundation-gallery/app.mjs`
- `prototypes/ui-foundation-gallery/gallery-data.mjs`
- `prototypes/ui-foundation-gallery/styles.css`

It uses fake data only, is not wired into Product navigation, and is excluded
from packaged Alpha files. Screenshots are generated with:

- `npm run gallery:ui-foundation:capture`

Gallery coverage:

- English and Chinese
- Wide and narrow windows
- 200% zoom
- Compact and comfortable density examples
- Reduced Motion
- High contrast candidate
- Disabled/loading/error/warning/danger states
- Connection and danger examples
- Developer-only internal ID example

## Rollback Strategy

- Keep old components during UI-1.
- Build tokenized foundation components in parallel.
- Replace one Settings category at a time after screenshot approval.
- Use source guards for Product/Developer/Evaluation visibility.
