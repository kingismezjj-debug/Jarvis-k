# Phase 5 Completion: Plugin SDK Alpha

Status: L4 user-facing integration for the developer-alpha Plugin SDK path.

Phase 5 is closed as a Plugin SDK Alpha milestone, not as an L5 release-ready
plugin platform. Jarvis-K can route and invoke bounded read-only plugin
capabilities from the official conversation surface, project plugin management
state in the official React UI, persist local developer-alpha plugin enabled
state, validate manifest-declared input/output schemas, and record sanitized
Task Runtime evidence.

## Completed User-Facing Surfaces

- Official conversation routes for read-only plugin invocation:
  - `stock quote MSFT`;
  - `compare products mechanical keyboard`;
  - `bargain advice mechanical keyboard`;
  - `hello plugin Jarvis` when the controlled local template is discovered and
    enabled in developer-alpha mode.
- Official Plugin Management UI projection:
  - bundled plugins;
  - explicitly configured local manifest-only plugins;
  - enabled/disabled state;
  - risk and permission projection;
  - local manifest developer diagnostics;
  - MCP adapter compatibility status only.
- Task Runtime integration:
  - `plugin.invoke` task creation;
  - queued/running/completed/failed task states;
  - plugin step verification status;
  - sanitized task events and result summaries;
  - task persistence visible after restart.
- Local developer-alpha state:
  - local manifest-only plugin state can be toggled and persisted;
  - persisted state remains list-only unless backed by the controlled
    repository-owned local read-only runtime.

## Completed SDK And Safety Gates

- Manifest contracts for plugin identity, capabilities, runtime metadata,
  declared permissions, and schema paths.
- Manifest directory validation for bundled examples and the local read-only
  template.
- Provider-neutral Core ports for plugin registry and plugin runtime.
- Plugin SDK runtime result contract with sanitized output projection.
- Runtime schema validation:
  - invocation input is validated before handler execution;
  - handler output is validated before Jarvis-K sanitized result parsing;
  - missing or unsupported schema documents fail closed;
  - invalid input returns `PLUGIN_INPUT_INVALID`;
  - invalid output returns `PLUGIN_OUTPUT_INVALID`.
- Fail-closed Task Runtime mapping for invalid plugin output:
  - task status becomes `failed`;
  - step verification becomes `verification_failed`;
  - raw plugin output is not projected.

## Accepted Manual Evidence

Windows UI manual acceptance passed for:

- stock quote sample;
- product comparison sample;
- bargain advice sample;
- Plugin Management UI status/risk projection;
- local manifest developer experience;
- local enabled/disabled state persistence after restart;
- controlled local read-only plugin invocation;
- manifest schema validation and sanitized result verification.

Observed safety boundary during manual acceptance:

- no unknown local plugin code execution;
- no marketplace, install, uninstall, or arbitrary enable-runtime control;
- no permission grant path;
- no browser, filesystem, shell, clipboard, process, credential, payment,
  order, purchase, trading, or arbitrary network behavior;
- fixture routes did not enter the official product plugin path.

## Verification Baseline

The Phase 5 final verification gate is:

```powershell
npm run plugin:validate:examples
npm run plugin:validate:local-template
npm run typecheck
npx vitest run packages/contracts/test/plugin-protocol.test.ts packages/plugin-sdk/test/local-plugin-runtime.test.ts packages/plugin-sdk/test/manifest-directory-registry.test.ts packages/core/test/runtime.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts
node tests\desktop-plugin-sdk-alpha-smoke.mjs
node tests\desktop-plugin-bargain-advice-smoke.mjs
node tests\desktop-plugin-management-ui-smoke.mjs
node tests\desktop-plugin-local-state-smoke.mjs
node tests\desktop-plugin-local-template-runtime-smoke.mjs
```

`npm run build` is also required before handoff if any source file changes are
made after this document.

## Completion Level

- Current level: L4.
- L4 rationale: the supported developer-alpha plugin flows are usable through
  the official React UI and have passed Windows manual acceptance.
- Not L5: the platform does not yet include release-channel packaging,
  installer/update integration, arbitrary third-party sandboxed execution,
  marketplace publishing, full permission granting, plugin uninstall lifecycle,
  network permissions, or production security review.

## Intentionally Not Enabled

- Arbitrary local plugin code execution.
- Third-party marketplace publishing, browsing, installation, update, or
  uninstall.
- Unknown plugin runtime enablement.
- Plugin access to filesystem, clipboard, screen, process, shell, credentials,
  browser automation, arbitrary network, payment, purchase, order, checkout, or
  trading.
- React, HTML, JavaScript, scriptable SVG, iframe, raw logs, private paths,
  URLs, tokens, or credentials in plugin-rendered UI.
- MCP tool forwarding or external server startup.

## Phase 6 Handoff

The next mainline milestone is Skin Phase 1:

- Theme Schema;
- three built-in themes;
- official React UI theme switcher;
- local persistence;
- default recovery for invalid theme state;
- no executable skin code.

Plugin SDK work can continue later as a separate expansion after the Phase 6
theme vertical slice, especially:

- full permission broker UX;
- sandboxed third-party runtime;
- plugin install/uninstall lifecycle;
- plugin package signing and integrity checks;
- marketplace/community flow.
