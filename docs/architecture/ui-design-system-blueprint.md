# UI Design System Blueprint

Date: 2026-08-28

Audit HEAD: `b77dff2d98765bdf3ce5867881fdf1fae2ad69a1`

Scope: token and component direction only. No global CSS replacement was made.

## Visual Direction

Jarvis-K should use two coordinated layers:

- Product Workspace: quiet Windows desktop utility, dense but readable, low motion, clear status.
- Jarvis Identity Layer: Desktop Pet, HUD, listening/thinking feedback, and brand moments.

The Product Workspace should not inherit every glow or animation from the identity layer.

## Token Draft

| Token group | Draft tokens |
| --- | --- |
| Background | `color.bg`, `color.surface`, `color.surfaceElevated`, `color.panel` |
| Text | `color.textPrimary`, `color.textSecondary`, `color.textMuted`, `color.textInverse` |
| Border/focus | `color.border`, `color.borderStrong`, `color.focusRing` |
| Accent | `color.accent`, `color.accentMuted`, `color.primaryAction` |
| Status | `color.success`, `color.warning`, `color.danger`, `color.info`, `color.blocked` |
| Spacing | `space.1` through `space.8`, based on 4px increments |
| Radius | `radius.sm=4`, `radius.md=6`, `radius.lg=8` |
| Shadow | `shadow.panel`, `shadow.overlay`, `shadow.noneLowSpec` |
| Typography | `font.sans`, `font.cjkFallback`, `font.size.11/12/13/14/16/20/24` |
| Motion | `motion.duration.fast/base/slow`, `motion.easing.standard`, `motion.reduced=none` |
| Density | `density.compact`, `density.comfortable` |
| Z-index | `z.base`, `z.overlay`, `z.modal`, `z.pet`, `z.trayNotice` |
| Identity | `identity.coreGlow`, `identity.ring`, `identity.robotShell`, `identity.expression` |
| Pet | `pet.size=112`, `pet.dragSurface`, `pet.stateGlyph`, `pet.reducedMotionVariant` |

## Accessibility Rules

- Use semantic controls for switches, radio groups, selects, dialogs, menus, and tooltips.
- Every icon-only button needs an accessible label and tooltip where useful.
- Focus ring must remain visible in dark and light themes.
- Chinese text must be tested at 125%, 150%, and narrow widths.
- Reduced Motion disables continuous rotation, floating, pulsing, and blinking.
- High contrast mode should remove decorative blur/shadow first.

## Component Candidate Decision

Current repo already uses Tailwind, lucide icons, small Jarvis components, and Radix primitives for scroll area, separator, and tooltip.

| Candidate | Decision | Reason |
| --- | --- | --- |
| Existing self-built components | Keep for layout/status rows/buttons already stable. | Lowest churn and matches current tests. |
| Radix UI primitives | Recommended selective adoption. | MIT, accessibility primitives, good for dialog/menu/select/switch/focus. |
| shadcn/ui | Use as recipe/reference, not as wholesale dependency source. | Fits Tailwind but can scatter style decisions if copied too widely. |
| Fluent UI React v9 | Reference for Windows behavior, not default component layer. | Good accessibility but heavier visual/runtime shift. |
| Hybrid | Primary recommendation. | Radix primitives + Jarvis tokens/custom components preserve brand and allow gradual migration. |

First components to try in UI-1:

- Dialog
- Switch
- Select/Listbox
- Tabs
- Tooltip
- Menu

Do not migrate the whole app shell, Conversation, Pet renderer, acceptance panels, or Skin Studio in the first batch.

Rollback strategy:

- Keep old components during UI-1.
- Build tokenized foundation components in parallel.
- Replace one Settings category at a time after screenshot approval.
- Use source guards for Product/Developer/Evaluation visibility.
