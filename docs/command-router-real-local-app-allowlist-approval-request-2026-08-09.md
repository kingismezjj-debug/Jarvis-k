# Command Router Real Local App Allowlist Approval Request

Recorded: 2026-08-09

## Status

`PRODUCT_SECURITY_RELEASE_APPROVED_IMPLEMENTED_AND_MANUALLY_ACCEPTED`

This request prepares the next product step after the accepted Command Router
fixture-only text loop. It does not itself approve or implement real local app
launch.

## Recorded Approvals

Product approval was recorded on 2026-08-09:

```text
Product: APPROVE exactly this Command Router real local app allowlist developer-alpha scope using the existing default-off Command Router product mode, deterministic fixture routing only, explicit UI confirmation, and exactly the Notepad and Calculator local app targets, with no browser, URL, shell, PowerShell, filesystem, network, arbitrary process, provider planner, or Qwen runtime behavior
```

Security approval was recorded on 2026-08-09:

```text
Security: APPROVE exactly this bounded fail-closed real local app allowlist scope with only explicit Notepad and Calculator process launch after user confirmation, sanitized launch status/result evidence only, no command-line arguments, no arbitrary executable path, no shell or PowerShell, no browser or URL opening, no filesystem/clipboard/process enumeration beyond launch verification, no credential access, no provider/model runtime, no Memory write/vector retrieval, and no bypass of existing Command Router safety gates
```

Release approval was recorded on 2026-08-09:

```text
Release: APPROVE developer-alpha local allowlist execution evidence only; no default behavior change, no installer/update/packaging/release-channel changes, no telemetry expansion, and no production-facing claim that arbitrary app control is supported
```

## Proposed Scope

Enable exactly one bounded, user-visible, developer-alpha real local-app
execution window for Command Router product mode:

```text
text command
  -> Command Router product mode enabled
  -> deterministic fixture router
  -> localApp.open intent
  -> exact allowlist target
  -> explicit UI confirmation
  -> launch only Notepad or Calculator
  -> record sanitized result
```

## Proposed Allowlist

Allowed targets:

- `notepad`
- `calculator`
- `calc` as an alias for Calculator

Allowed Windows launch mapping:

- `notepad` -> Windows Notepad
- `calculator` / `calc` -> Windows Calculator

No other target is included.

## Required Product Approval Text

```text
Product: APPROVE exactly this Command Router real local app allowlist developer-alpha scope using the existing default-off Command Router product mode, deterministic fixture routing only, explicit UI confirmation, and exactly the Notepad and Calculator local app targets, with no browser, URL, shell, PowerShell, filesystem, network, arbitrary process, provider planner, or Qwen runtime behavior
```

## Required Security Approval Text

```text
Security: APPROVE exactly this bounded fail-closed real local app allowlist scope with only explicit Notepad and Calculator process launch after user confirmation, sanitized launch status/result evidence only, no command-line arguments, no arbitrary executable path, no shell or PowerShell, no browser or URL opening, no filesystem/clipboard/process enumeration beyond launch verification, no credential access, no provider/model runtime, no Memory write/vector retrieval, and no bypass of existing Command Router safety gates
```

## Required Release Approval Text

```text
Release: APPROVE developer-alpha local allowlist execution evidence only; no default behavior change, no installer/update/packaging/release-channel changes, no telemetry expansion, and no production-facing claim that arbitrary app control is supported
```

## Explicit Exclusions

This proposal excludes:

- browser launch or URL opening;
- VS Code or arbitrary local app launch;
- shell, PowerShell, cmd, Terminal, WSL, scripts, batch files, or shortcuts;
- file open/save dialogs;
- filesystem reads/writes;
- clipboard access;
- process management beyond sanitized launch verification;
- network access;
- Qwen runtime execution;
- provider-backed planning or model-driven tool invocation;
- Memory write/schema migration/vector retrieval;
- microphone/ASR acceptance;
- default-on TTS or automatic playback;
- credential access or raw diagnostic persistence.

## Required Implementation Gates

Implementation must include all of these gates:

- product mode remains default-off;
- deterministic fixture router remains the only router provider for this path;
- exact allowlist target normalization;
- explicit UI confirmation before launch;
- fail-closed behavior for unknown target text;
- no command-line arguments passed from the model or user text;
- no shell intermediary;
- sanitized evidence with process-launch status only;
- kill switch or environment flag for disabling real local-app execution;
- focused runtime tests for allowlist/denylist;
- desktop UI smoke for confirmation and launch;
- manual acceptance evidence before any broader scope.

## Proposed Manual Acceptance

If approved, manual acceptance should use exactly:

- `open notepad`
- `open calculator`
- `open vscode`

Expected result:

- Notepad launches only after explicit confirmation.
- Calculator launches only after explicit confirmation.
- VS Code remains blocked.
- Browser, shell, network, Qwen runtime, and provider planning remain disabled.

## Current Dependency

This proposal depends on the accepted fixture-only closeout:

```text
docs/command-router-fixture-only-closeout-2026-08-09.md
```

## Decision

Do not implement until the exact Product, Security, and Release approval texts
above are explicitly accepted.
