# UI Modernization Roadmap

Date: 2026-08-28

Audit HEAD: `fd4ff9513940c20f218dcdf834599bb597c9402e`

## Current Decision

UI-0 created audit evidence and an isolated Settings prototype. UI-0R revised
the prototype after human review. Neither phase changes Product Settings
behavior.

## Revised Prototype Awaiting Review

Prototype source:

- `prototypes/settings-control-center/index.html`
- `prototypes/settings-control-center/app.mjs`
- `prototypes/settings-control-center/prototype-data.mjs`
- `prototypes/settings-control-center/styles.css`

Prototype constraints:

- Static fake data only.
- No `window.jarvis`.
- No IPC.
- No settings reads or writes.
- No credential access.
- No provider state access.
- Not wired into Product navigation.
- Not included in packaged Alpha files.

Revision decisions:

- Normal Product Settings use eight top-level categories.
- `Advanced` is not a permanent top-level Product category; advanced options
  move into the category they affect.
- `Developer & Evaluation` appears only when Developer Mode is on.
- Evaluation tools remain behind a second capability gate.
- Persistent Status Summary is removed from normal Settings.
- System Status and Diagnostics move under About & Updates.
- Rows show current values instead of generic change buttons.
- Search results show count, category breadcrumb, description, and current
  value/state.
- Narrow windows use a compact category selector instead of the full left nav.

## UI-1 Candidate, After User Approval

Design Tokens and Foundation Components.

User value:

- Consistent controls, spacing, focus, and status language.
- Safer foundation before real Settings migration.

Scope:

- Token definitions.
- Button, switch, select, segmented control, tooltip, dialog/menu primitives.
- i18n key skeleton and parity guard.

Safety boundary:

- No provider routing.
- No credential behavior changes.
- No Product Settings value migration.

Acceptance:

- Token tests.
- Component accessibility tests.
- English/Chinese/narrow screenshots.
- No Product/Developer gate regressions.

## UI-2 Candidate

Registry-driven Settings IA and localized Settings migration.

User value:

- Searchable Settings.
- Clear Product vs Advanced vs Developer/Evaluation separation.
- Chinese UI becomes dependable.

Scope:

- Settings Definition Registry.
- Search index.
- Category navigation.
- Per-section migration from current Settings panels.

Safety boundary:

- Settings Service remains value owner.
- Desktop Main remains capability owner.
- Renderer cannot enable gates through registry.

Acceptance:

- Existing Settings behavior unchanged.
- Key parity and hardcoded string guard pass.
- Developer/Evaluation hidden from Product by default.

## UI-3 Candidate

Product surface polish and onboarding cleanup.

User value:

- Less diagnostic noise for daily use.
- Better first-run guidance and recovery.

Scope:

- First-run copy and layout.
- Product status/error mapping.
- Tray/native localization.
- Activity diagnostics folding.

Safety boundary:

- No hidden telemetry.
- No new execution routes.

## Figma Decision

Figma is optional after prototype approval. Use it only if visual alignment or
stakeholder review needs a shared design board. The code prototype can remain
the source of truth for early UI-1 implementation.
