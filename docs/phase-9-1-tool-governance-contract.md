# Phase 9.1 Tool Governance Contract

Recorded on 2026-08-01 as the first low-risk preparation wave for tool
governance.

## Scope

This wave adds provider-neutral tool contracts in `@jarvis-k/contracts` and a
pure governance port plus fixture executor in `@jarvis-k/capabilities`.

The contract covers:

- stable tool descriptors and input schema identifiers;
- explicit risk levels;
- allowlists and blocked tool IDs;
- permission scopes;
- confirmation requirements;
- sanitized policy decisions and audit records; and
- fixture-only execution results.

## Safety Boundary

Tool input is limited to bounded primitive arguments. Argument keys that
represent commands, scripts, shell execution, credentials, tokens, downloads,
or network access are rejected.

The policy keeps Windows execution, shell execution, and network access
disabled. The fixture executor performs no operating-system action and returns
only a result code plus sanitized audit metadata. It never returns tool input,
raw output, commands, scripts, paths, or credentials.

## Approval Meaning

This wave approves only the provider-neutral contract and fixture governance
surface. It does not add IPC commands, Core handling, Desktop behavior, UI
controls, Windows tool execution, permissions enforcement against the real OS,
or model-driven tool invocation.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/contracts
npm.cmd run build -w @jarvis-k/capabilities
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, or provider visibility.
