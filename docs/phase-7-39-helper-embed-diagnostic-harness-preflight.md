# Phase 7.39 Helper Embed Diagnostic Harness Preflight

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave adds a Core Host preflight guard and sanitized report shape for a
future helper `embed` diagnostic harness.

The guard is preparation only. It does not call helper `embed`, access model
artifacts, return real embedding vectors, persist raw input text, log or
persist vector values, route vectors to Memory, run a Memory schema migration,
enable product inference, change provider registration, change default opt-in
behavior, or change UI visibility.

## Review Boundary

The preflight requires evidence for:

- `apps/core-host` remaining the only concrete composition root;
- runtime-backed local embedding remaining explicit opt-in only;
- Phase 7.38 helper embed preflight being complete;
- diagnostic harness scope review;
- fixture transport only in this preparation wave;
- sanitized report schema review;
- bounded diagnostic case plan review;
- raw input text redaction;
- vector value redaction;
- fixed failure reason codes;
- cleanup and resource release behavior;
- separate product approval requirement; and
- separate security approval requirement.

When complete, the preflight can return only
`ready_for_diagnostic_harness_approval`. That status is a handoff for a future
product and security approval; it is not permission to call helper `embed` or
emit real vectors.

## Sanitized Report Shape

The prepared report shape is `preflight_only` and may expose only bounded
counts, fixed reason codes, and cleanup status:

- `caseCount`;
- `passedCount`;
- `degradedCount`;
- `failedCount`;
- `reasonCodes`; and
- `cleanupStatus`.

It must not expose raw inputs, vector values, private paths, signed URLs,
credentials, artifact paths, model files, or runtime raw diagnostics.

## Safety Boundary

The guard fixes these outputs to `false`:

- product approval granted;
- security approval granted;
- helper `embed` called;
- real embedding vectors returned;
- raw input text persisted;
- vector values persisted or logged;
- model artifacts accessed;
- downloads enabled;
- persistent cache writes enabled;
- product inference enabled;
- vectors routed to Memory;
- Memory schema migration enabled;
- provider registration changed;
- default opt-in enabled;
- UI visibility changed;
- raw diagnostics exposed;
- private path exposure enabled;
- signed URL or credential persistence enabled; and
- model output shell execution enabled.

## Verification

Completed locally on 2026-08-02:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npm.cmd test -- apps/core-host/test/local-embedding-helper-embed-diagnostic-preflight.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

- Core Host helper embed diagnostic preflight tests: PASS, 4 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 104 test files and 517 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Next Hard Pause

Do not call helper `embed`, access real model artifacts for a diagnostic run,
return real embedding vectors, route vectors to Memory, persist vectors, change
provider registration/default opt-in behavior, change UI visibility, add
downloads, write persistent model caches, or run a Memory schema/index
migration without separate product and security approval for that exact
diagnostic execution wave.
