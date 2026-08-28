# UI Settings and i18n Blueprint Index

Date: 2026-08-28

Audit HEAD: `b77dff2d98765bdf3ce5867881fdf1fae2ad69a1`

This file is retained as the historical entry point for the UI Settings/i18n
blueprint. Phase UI-0 split the old combined notes into focused documents:

- `docs/architecture/ui-surface-inventory.md`
- `docs/architecture/ui-settings-information-architecture.md`
- `docs/architecture/ui-design-system-blueprint.md`
- `docs/architecture/ui-internationalization-audit.md`
- `docs/roadmaps/ui-modernization-roadmap.md`

Current AST audit summary:

- Source files scanned: 139
- User-visible observations: 1428
- Already i18n / copy registry references: 580
- Missing i18n: 838
- Hardcoded English: 493
- Hardcoded Chinese: 1
- Developer/Evaluation hardcoded strings: 308
- Mojibake sequences in scanned source: 0

Current prototype:

- `prototypes/settings-control-center/index.html`

UI-0 remains design/prototype only. It does not migrate real Settings or change
Product runtime behavior.
