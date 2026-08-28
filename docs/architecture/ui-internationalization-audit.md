# UI Internationalization Audit

Date: 2026-08-28

Audit HEAD: `b77dff2d98765bdf3ce5867881fdf1fae2ad69a1`

Tool: `npm run audit:ui-strings`

## AST Audit Result

| Metric | Count |
| --- | ---: |
| Source files scanned | 139 |
| User-visible observations | 1428 |
| Already i18n / copy registry references | 580 |
| Missing i18n | 838 |
| Hardcoded English | 493 |
| Hardcoded Chinese | 1 |
| Developer/Evaluation hardcoded strings | 308 |
| Dynamic strings needing review | 36 |
| Brand/provider/protocol strings | 10 |
| Mojibake sequences in scanned source | 0 |

Top files by observation count:

1. `apps/ui/src/app/copy.ts` - 452
2. `apps/ui/src/features/advanced-brain/cloud-provider-acceptance-panel.tsx` - 105
3. `apps/ui/src/App.tsx` - 97
4. `apps/ui/src/features/advanced-brain/glm-advanced-brain-acceptance-panel.tsx` - 90
5. `apps/ui/src/features/voice/voice-regression-panel.tsx` - 72
6. `apps/ui/src/features/appearance/appearance-settings-panel.tsx` - 58

## Mojibake Finding

The mojibake seen during some PowerShell `Get-Content` output is a terminal
rendering/code-page issue. The UTF-8 source scan found no replacement
characters or common double-encoded sequences such as `锛`, `涓`, `鈥`, or `�` in
`apps/ui/src`, `apps/desktop/src`, or current architecture docs.

Safe strategy:

- Do not bulk rewrite Chinese strings from terminal output.
- Use UTF-8-aware Node scripts for audits.
- Add translation key parity tests before repairing zh copy.
- Manually review any future file where the AST scanner detects mojibake flags.

## Target i18n Direction

Recommendation: keep the current copy registry for UI-1 foundation, but reshape
it into i18next-compatible namespaces before broad migration.

Preferred namespaces:

- `common`
- `navigation`
- `settings`
- `status`
- `errors`
- `native`
- `conversation`
- `voice`
- `models`
- `plugins`
- `memory`
- `developer`
- `evaluation`
- `pet`

## Candidate Decision

| Candidate | Decision |
| --- | --- |
| Keep current registry and harden | Best first step. Minimal runtime risk and no new dependency. |
| i18next/react-i18next | Good later target once key inventory is stable. MIT and mature, but should not enter UI-0. |
| Other minimal custom solution | Acceptable only if it keeps key parity, namespaces, and native string coverage. |

Migration sequence:

1. Foundation key schema and parity test.
2. Core navigation and App shell.
3. Settings.
4. Product status/error mappings.
5. Developer/Evaluation.
6. Tray/native dialogs.
7. Plugin namespaces.
8. Hardcoded string CI guard.

Rules:

- English full text should not be the key.
- Provider/model/protocol names remain unlocalized display values.
- Error reason codes map to localized edge copy.
- Missing `zh-CN` cannot silently remain English long term.
- Translations must be packaged locally, not downloaded at runtime.
