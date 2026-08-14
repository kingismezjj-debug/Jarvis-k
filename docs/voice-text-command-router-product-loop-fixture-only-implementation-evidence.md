# Voice/Text Command Router Product Loop Fixture-Only Implementation Evidence

Recorded: 2026-08-09

## Scope

Implemented the first controlled product step after provider-backed Chat Answer:

```text
voice/text command
  -> default-off Command Router product mode
  -> deterministic fixture intent routing
  -> safe intent/result projection
  -> UI visibility
  -> no direct action execution
```

## Implemented

- Added a default-off Command Router product mode IPC contract.
- Added Electron preload/main bridge methods for reading and changing the mode.
- Added supervisor delivery of the mode to Core Host, including replay after Core
  process restart.
- Added Core Host parsing for only the deterministic fixture product-mode
  configuration.
- Added Core runtime binding:
  - selected provider id: `intent-router.deterministic.fixture`;
  - mode: `fixture_only`;
  - no real Qwen runtime;
  - no network/provider call;
  - no local app/browser execution.
- Added UI Settings controls for the mode.
- Added Brain Dispatch safety projection fields:
  - selected router provider;
  - route status;
  - confidence band;
  - direct action status.

## Safety Boundaries

The implementation preserves these boundaries:

- Command Router product mode is default-off.
- Direct action is hard-coded disabled in the product-mode status.
- Real Qwen runtime is hard-coded disabled in the product-mode status.
- Network access is hard-coded disabled in the product-mode status.
- Chat Answer fallback is preserved.
- In product mode, `browser.open` and `localApp.open` intents return a
  `needs_approval` projection and do not call the action executor.
- No provider/API acceptance window was run.
- No Qwen runtime/cache/materialization was run.
- No tool execution, shell execution, browser execution, local app launch, ASR,
  TTS provider call, or Memory vector retrieval was enabled by this change.

## Primary Files

- `packages/contracts/src/protocol.ts`
- `packages/core/src/runtime.ts`
- `apps/core-host/src/index.ts`
- `apps/desktop/src/main.ts`
- `apps/desktop/src/preload.ts`
- `apps/desktop/src/supervisor.ts`
- `apps/ui/src/hooks/use-jarvis.ts`
- `apps/ui/src/App.tsx`

## Tests Added Or Updated

- `packages/contracts/test/protocol.test.ts`
- `packages/core/test/runtime.test.ts`
- `apps/core-host/test/command-router-product-mode-source.test.ts`
- `apps/desktop/test/command-router-product-mode-source.test.ts`
- `apps/ui/test/use-jarvis-inference-source.test.ts`
- `apps/ui/test/app-voice-ui-source.test.ts`

## Next Step

After this fixture-only router product loop is accepted, the next recommended
step is the Local App Open Fixture Loop:

```text
localApp.open intent
  -> allowlist check
  -> fixture-only execution result
  -> UI/TTS response
```

That next step should still avoid launching real Windows processes.
