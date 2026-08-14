# GLM Chat Answer Developer Fast Iteration Policy

Recorded: 2026-08-09

The project owner has replaced per-window Product/Security/Release paperwork
with a developer-controlled iteration path for GLM Chat Answer work.

## Still Required

- explicit user instruction before a real network call;
- a fresh credential entered only through the interactive secure-store command;
- fixed provider/model/endpoint and bounded request/output settings;
- 30-second timeout per request and zero retries;
- zero retries unless explicitly changed;
- credential cleanup after each real window;
- sanitized output only;
- no direct action, tool execution, UI/IPC, default, telemetry, or release
  changes.

## No Longer Required

- separate Product, Security, and Release approval text for each local
  fixture-only adjustment or each user-directed diagnostic window.

## First Fast Diagnostic

`diagnostic:chat-answer:glm-health` makes one minimal provider request using
the existing fixed GLM Chat Answer adapter. It does not run the three-sample
acceptance suite or activate CoreRuntime planning. The result contains only
sanitized latency, transport category, bounded result status, and verified
credential cleanup.
