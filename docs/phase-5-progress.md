# Phase 5 Progress

## 2026-08-11

### Phase 5 Completion Handoff

- Status: L4 developer-alpha Plugin SDK Alpha completion package.
- Added `docs/phase-5-completion.md` as the formal Plugin SDK Alpha closeout
  and Phase 6 Skin Phase 1 handoff document.
- Consolidated the accepted Phase 5 surfaces:
  - read-only `plugin.invoke` conversation routes;
  - official Plugin Management UI projection;
  - local manifest developer diagnostics;
  - persisted local enabled/disabled state;
  - controlled local read-only runtime;
  - manifest-declared input/output schema validation;
  - sanitized plugin result verification.
- Completion level remains L4, not L5:
  - Windows UI manual acceptance passed for the supported developer-alpha
    plugin flows;
  - release packaging, marketplace, arbitrary third-party sandboxed execution,
    install/uninstall lifecycle, full permission grants, and production release
    readiness are intentionally not enabled.
- Safety boundaries preserved:
  - no unknown local plugin code execution;
  - no marketplace, install, uninstall, permission grant, or arbitrary runtime
    enablement;
  - no browser, filesystem, shell, clipboard, process, credential, payment,
    order, purchase, trading, or arbitrary network behavior;
  - no fixture route in the official product plugin path.

#### Current Gate

- Final verification: PASS.
- Manifest validators:
  - `npm run plugin:validate:examples`: PASS;
  - `npm run plugin:validate:local-template`: PASS.
- `npm run typecheck`: PASS.
- Targeted Plugin SDK/Contracts/Core/UI tests: PASS, 6 files and 152 tests.
- `npm run build`: PASS.
  - Vite reported the existing large chunk-size warning only.
- Desktop plugin smoke coverage: PASS:
  - `node tests\desktop-plugin-sdk-alpha-smoke.mjs`;
  - `node tests\desktop-plugin-bargain-advice-smoke.mjs`;
  - `node tests\desktop-plugin-management-ui-smoke.mjs`;
  - `node tests\desktop-plugin-local-state-smoke.mjs`;
  - `node tests\desktop-plugin-local-template-runtime-smoke.mjs`.

### Plugin Manifest Schema Validation And Safe Result Verification

- Status: L4 user-facing integration after Windows UI manual acceptance.
- Added a Plugin SDK runtime schema validation layer:
  - controlled runtime definitions carry the schema documents referenced by
    their manifest capability `inputSchema` and `outputSchema` paths;
  - invocation input is validated before handler execution;
  - handler output is validated before Jarvis-K sanitized result parsing and UI
    projection;
  - missing or unsupported schema documents fail closed.
- Added fail-closed result mapping:
  - invalid input returns `PLUGIN_INPUT_INVALID`;
  - invalid output returns `PLUGIN_OUTPUT_INVALID`;
  - invalid output is not projected as plugin output;
  - handler exceptions remain `PLUGIN_EXECUTION_FAILED`;
  - all result safety flags remain false for direct action, credential
    exposure, and raw output persistence.
- Extended the repository-owned sample plugin definitions with schema
  documents for:
  - stock quote input/output;
  - e-commerce product comparison input/output;
  - e-commerce bargain advice input/output;
  - local hello read-only template input/output.
- Extended Task Runtime coverage so a plugin runtime output-schema failure is
  recorded as a failed plugin task with step verification status
  `verification_failed`, not as a completed invocation.
- Extended the desktop local-template runtime smoke so the normal official UI
  route still completes and a bounded IPC negative probe verifies missing
  `name` input fails with `PLUGIN_INPUT_INVALID` and no output projection.
- Updated `docs/plugin-sdk-authoring-alpha.md` with the runtime schema gate
  rules and the current local manifest discovery path for the controlled
  local template.
- Safety boundaries preserved:
  - no unknown local plugin code execution;
  - no marketplace, install, uninstall, permission grant, or arbitrary plugin
    loading;
  - no browser, filesystem, shell, clipboard, process, credential, payment,
    order, purchase, trading, or arbitrary network behavior;
  - no raw plugin output persistence.

#### Current Gate

- Targeted tests: PASS, 6 files and 152 tests:
  - `packages/contracts/test/plugin-protocol.test.ts`;
  - `packages/plugin-sdk/test/local-plugin-runtime.test.ts`;
  - `packages/plugin-sdk/test/manifest-directory-registry.test.ts`;
  - `packages/core/test/runtime.test.ts`;
  - `apps/ui/test/app-voice-ui-source.test.ts`;
  - `apps/ui/test/use-jarvis-inference-source.test.ts`.
- Package builds: PASS for contracts, capabilities, plugin-sdk, core,
  core-host, UI, and desktop.
- Desktop local template runtime smoke: PASS via
  `node tests\desktop-plugin-local-template-runtime-smoke.mjs`.
  - Real Electron UI command: `hello plugin Jarvis`.
  - Verified local manifest discovery, persisted enabled state,
    `local_readonly_runtime`, `plugin.invoke`, deterministic rules route
    source, sanitized result panel, completed Task Runtime record, verified
    plugin task step, and task persistence after restart.
  - Verified a bounded `agent.invokePlugin` negative probe with missing
    required schema input returned `PLUGIN_INPUT_INVALID`, projected no output,
    and kept all safety flags false.
  - Evidence artifacts:
    `artifacts/jarvis-k-plugin-local-template-runtime-smoke.png` and
    `artifacts/jarvis-k-plugin-local-template-runtime-smoke-metrics.json`.
- Windows UI manual acceptance: PASS on 2026-08-12.
  - Official React Plugin Management view projected
    `Hello Read-only Local Plugin` as enabled with `local_readonly_runtime`.
  - Official React conversation command `hello plugin Jarvis` completed through
    `plugin.invoke`.
  - Visible result showed `Plugin Runtime invoked hello.lookup; sanitized
    output verified.`
  - Task Runtime timeline showed `Invoke Read-only Plugin` completed with the
    plugin step verification status `verified`.
  - No unknown local plugin code execution, marketplace, install, uninstall,
    permission grant, browser, filesystem, shell, clipboard, process,
    credential, payment, order, purchase, trading, or arbitrary network
    behavior was observed.

### Plugin SDK Alpha L4 Vertical Slice

- Status: L4 user-facing integration.
- Added `plugin.invoke` to the official Brain intent contract.
- Added sanitized `pluginResult` projection to Brain command results.
- Added deterministic rules for two narrow read-only plugin requests:
  - stock quote sample plugin;
  - e-commerce product comparison sample plugin.
- Added Task Runtime execution for plugin invocation:
  - creates a persisted task with `intent: plugin.invoke`;
  - uses `routeSource: intent-router.deterministic.rules`;
  - records queued/running/completed task state;
  - records plugin step verification as `verified` only after
    `PluginInvocationResult` validation and safety flags pass;
  - records sanitized task events and summaries only.
- Updated the official React conversation surface to display sanitized plugin
  result status, summary, and bounded fields when a plugin request completes.
- Safety boundaries preserved:
  - no plugin marketplace;
  - no plugin installation, enable/disable, or uninstall UI;
  - no network, filesystem, screen, clipboard, process, shell, or payment
    permission expansion;
  - no trading, ordering, checkout, payment, or purchase capability;
  - no raw plugin output persistence;
  - no Desktop/UI direct plugin execution.

#### Current Gate

- Targeted Plugin SDK/Core/UI tests: PASS, 4 test files and 132 tests.
- UI source/local TTS regression tests: PASS, 2 test files and 31 tests.
- Package builds: PASS for contracts, plugin-sdk, core, core-host, and UI.
- Desktop Plugin SDK Alpha smoke: PASS via
  `npm run smoke:desktop:plugin-sdk-alpha`.
  - Real Electron UI command: `stock quote MSFT`.
  - Verified `plugin.invoke`, sanitized plugin result panel, completed task,
    verified plugin task step, deterministic rules route source, and task
    persistence after restart.
  - Evidence artifacts:
    `artifacts/jarvis-k-plugin-sdk-alpha-smoke.png` and
    `artifacts/jarvis-k-plugin-sdk-alpha-smoke-metrics.json`.
- `npm run typecheck`: PASS.
- `npm run check:boundaries`: FAIL on pre-existing Desktop boundary imports in
  `apps/desktop/src/main.ts`; no Plugin SDK boundary violation was introduced.
- `npm run check:sensitive-artifacts`: FAIL on a pre-existing
  credential-like assignment in `apps/desktop/test/supervisor.test.ts`.
- Windows UI manual acceptance: PASS.
  - `stock quote MSFT`: PASS.
  - `compare products mechanical keyboard`: PASS.
  - Verified official React UI result projection, completed Task Runtime
    timeline, `verified` plugin step, deterministic rules route source, and no
    prohibited browser, filesystem, shell, trade, order, checkout, payment, or
    purchase behavior.

Manual acceptance commands:

- `stock quote MSFT`
- `compare products mechanical keyboard`

Acceptance criteria:

- Conversation panel shows intent `plugin.invoke`, status `completed`, and a
  sanitized plugin result panel.
- Tasks view shows a completed task with deterministic rules route source.
- The plugin task step has verification status `verified`.
- No confirmation prompt, browser launch, filesystem access, shell execution,
  trade, order, checkout, payment, or purchase action occurs.

### Plugin SDK Alpha Authoring Support

- Status: L3 developer authoring support.
- Added `docs/plugin-sdk-authoring-alpha.md` with:
  - minimal plugin directory layout;
  - manifest example;
  - validation commands;
  - current routed sample commands;
  - explicit unsupported scope and safety boundaries.
- Added `scripts/validate-plugin-manifest.mjs` for local manifest/schema
  validation.
- Added `npm run plugin:validate:examples` to validate the stock and
  e-commerce sample plugin manifests.
- Updated both example plugin README files with validation and routed UI smoke
  commands.
- Added explicit local manifest discovery:
  - opt-in only through `JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS=1`;
  - reads only directories listed in `JARVIS_K_LOCAL_PLUGIN_DIRS`;
  - validates `manifest.json` plus bounded schema JSON paths;
  - merges valid manifests into `agent.listPlugins`;
  - keeps discovered third-party plugin manifests list-only, with no executable
    handler loading.

#### Current Gate

- `npm run plugin:validate:examples`: PASS for both bundled sample plugins.
- Plugin manifest validator tests: PASS.
- Targeted Plugin SDK/protocol tests: PASS.
- `npm run typecheck`: PASS.
- Local manifest discovery tests: PASS.
- Not L4 yet for arbitrary third-party installation: Jarvis-K still does not
  support installing, enabling, disabling, unloading, or marketplace-loading
  arbitrary local plugin packages from the official UI.
- Not L4 yet for arbitrary third-party execution: local manifest discovery does
  not load or execute third-party plugin code.

### Plugin Management UI Status Projection

- Status: L4 user-facing integration.
- Added a provider-neutral plugin management status projection:
  - `agent.getPluginManagementStatus`;
  - bundled executable plugins are projected as `enabled` /
    `bundled_runtime`;
  - local manifest-only plugins are projected as `disabled` / `list_only`;
  - `thirdPartyCodeExecuted: false`;
  - `marketplaceAccessed: false`;
  - default third-party execution remains `disabled`.
- Added an official React Plugin Management view:
  - lists bundled and locally discovered plugin manifests;
  - shows enabled/disabled state, source, execution mode, route-selectable
    status, runtime, version, capability count, permission count, capabilities,
    and sanitized reason codes;
  - includes refresh-only control; no enable, disable, install, uninstall,
    marketplace, or unknown-plugin execution control is exposed.
- Safety boundaries preserved:
  - default-off third-party execution;
  - no execution of unknown local plugin code;
  - no plugin marketplace access;
  - no network, filesystem, screen, clipboard, process, shell, trading,
    ordering, checkout, payment, or purchase expansion;
  - UI uses Contracts/IPC only and does not execute plugins directly.

#### Current Gate

- Targeted Plugin SDK/Core/UI tests: PASS, 5 test files and 136 tests.
- Full package build inside `npm run smoke:desktop:plugin-management-ui`: PASS.
- Desktop Plugin Management UI smoke script: PASS via
  `node tests/desktop-plugin-management-ui-smoke.mjs`.
  - Visible UI projected 2 bundled enabled plugins.
  - Visible UI projected 1 locally discovered manifest as disabled/list-only.
  - Verified unknown third-party code execution remained false.
  - Verified marketplace access remained false.
  - Evidence artifacts:
    `artifacts/jarvis-k-plugin-management-ui-smoke.png` and
    `artifacts/jarvis-k-plugin-management-ui-smoke-metrics.json`.
- Windows UI manual acceptance: PASS.
  - Official React Plugin Management view opened from the primary navigation.
  - Bundled plugin entries were visible with enabled status projection.
  - Local manifest discovery projection remained disabled/list-only.
  - No enable, disable, install, uninstall, marketplace, or unknown-plugin
    execution control was exposed.
  - No unknown third-party plugin code execution, marketplace access, browser,
    filesystem, shell, trade, order, checkout, payment, or purchase behavior was
    observed.

### Plugin Permission and Risk Tier Status Projection

- Status: L4 user-facing integration.
- Extended the provider-neutral plugin management projection with:
  - `declaredRiskTier`;
  - `effectiveRiskTier`;
  - `confirmationPolicy`;
  - per-capability risk status;
  - per-permission category/status projection;
  - sanitized risk reason codes.
- Current policy mapping:
  - read-only capabilities project as `low` risk with `none` confirmation when
    executable;
  - declared plugin storage and HTTPS network permissions project as `medium`
    risk;
  - bundled executable plugin permissions remain runtime-gated;
  - local manifest-only plugin permissions remain `disabled_by_policy`;
  - local manifest-only plugin execution remains `blocked`.
- Updated the official React Plugin Management view to show risk tier,
  confirmation policy, permission gate status, and risk reason badges.
- Safety boundaries preserved:
  - no new plugin execution path;
  - no enable/disable, install/uninstall, marketplace, or permission grant UI;
  - no unknown local plugin code execution;
  - no network, filesystem, shell, trade, order, checkout, payment, or purchase
    behavior.

#### Current Gate

- Targeted Plugin/Core/UI tests: PASS, 4 test files and 130 tests.
- Full package build inside `npm run smoke:desktop:plugin-management-ui`: PASS.
- Desktop Plugin Management UI smoke script: PASS.
  - Visible UI projected 2 bundled enabled plugins as low risk.
  - Visible UI projected 1 locally discovered manifest with a declared HTTPS
    permission as medium risk, `blocked`, and `disabled_by_policy`.
  - Verified unknown third-party code execution remained false.
  - Verified marketplace access remained false.
  - Evidence artifacts:
    `artifacts/jarvis-k-plugin-management-ui-smoke.png` and
    `artifacts/jarvis-k-plugin-management-ui-smoke-metrics.json`.
- Windows UI manual acceptance: PASS.
  - Official React Plugin Management page opened from the primary navigation.
  - `Stock Analysis Sample` and `E-commerce Product Comparison Sample` were
    visible.
  - Both bundled plugins projected `enabled`, `bundled`, `bundled_runtime`,
    `low` declared/effective risk, `none` confirmation policy, and `yes`
    route-selectable status.
  - Both bundled plugins projected `NO_DECLARED_PERMISSIONS`,
    `READ_ONLY_LOW_RISK`, and `BUNDLED_READ_ONLY_RUNTIME`.
  - The Projection summary showed 2 bundled plugins, 2 enabled plugins,
    0 disabled plugins, 2 low-risk plugins, 0 medium-risk plugins, and
    0 blocked-policy plugins.
  - Safety summary showed third-party execution disabled, unknown code execution
    `NO`, and marketplace access `NO`.
  - No enable/disable, install/uninstall, marketplace, permission grant, or
    unknown-plugin execution control was exposed.

### Local Plugin Manifest Developer Experience

- Status: L4 user-facing integration after Windows manual UI acceptance.
- Added a provider-neutral local manifest developer diagnostics projection:
  - `agent.getLocalPluginManifestDeveloperStatus`;
  - `LocalPluginManifestDeveloperDiagnostics` Core port;
  - Core Host injects the SQLite-independent, plugin-sdk-backed implementation;
  - Desktop Host does not directly run local plugin code or expose install,
    enable, disable, uninstall, or marketplace actions.
- Added `ManifestDirectoryDeveloperDiagnostics` to `@jarvis-k/plugin-sdk`:
  - scans only explicitly configured local manifest directories;
  - limits directory projection to sanitized refs such as
    `local-plugin-dir-01`;
  - validates `manifest.json` and bounded schema JSON files;
  - records issue codes such as `MANIFEST_JSON_INVALID`;
  - keeps valid local manifests list-only and invalid manifests diagnostics-only.
- Updated the official React Plugin Management view with a read-only
  `Local Manifest DX` panel:
  - discovery status, enabled/configured/scanned counts;
  - valid/invalid manifest counts;
  - raw path, unknown-code, marketplace, and install/enable safety flags;
  - per-directory sanitized refs and issue badges.
- Safety boundaries preserved:
  - no unknown local plugin code execution;
  - no raw local path projection in UI/evidence;
  - no install/enable/disable/uninstall/marketplace UI;
  - no permission expansion, filesystem search, shell, network execution,
    trading, ordering, checkout, payment, or purchase behavior.

#### Current Gate

- Package builds: PASS for contracts, capabilities, plugin-sdk, core,
  core-host, UI, and the full desktop build inside the smoke command.
- Targeted Plugin SDK/Core/UI/contracts tests: PASS, 5 test files and
  134 tests.
- Desktop Plugin Management UI smoke script: PASS via
  `npm run smoke:desktop:plugin-management-ui`.
  - Created one valid local manifest directory and one invalid local manifest
    directory in an isolated temporary root.
  - Verified the valid local manifest appeared only as disabled/list-only.
  - Verified the invalid manifest appeared only in the `Local Manifest DX`
    diagnostics with `MANIFEST_JSON_INVALID`.
  - Verified `rawPathsExposed: false`, `thirdPartyCodeExecuted: false`,
    `marketplaceAccessed: false`, and `installOrEnableActionExposed: false`.
  - Verified no `agent.invokePlugin` command was observed.
  - Evidence artifacts:
    `artifacts/jarvis-k-plugin-management-ui-smoke.png` and
    `artifacts/jarvis-k-plugin-management-ui-smoke-metrics.json`.
- Windows UI manual acceptance: PASS on 2026-08-12.
  - Official React Plugin Management page opened from the primary navigation.
  - `Local Manifest DX` read-only panel was visible.
  - Default local manifest discovery projected `DISABLED`, `ENABLED` = `NO`,
    `CONFIGURED DIRS` = `0`, `SCANNED DIRS` = `0`, `VALID MANIFESTS` = `0`,
    and `INVALID MANIFESTS` = `0`.
  - Safety projection showed `RAW PATHS` = `HIDDEN`, `UNKNOWN CODE` = `NO`,
    and `INSTALL/ENABLE` = `NO`.
  - Bundled plugin management projection remained stable with 2 bundled
    enabled plugins and 0 disabled plugins.
  - No install, enable, disable, uninstall, marketplace, permission grant,
    raw-path disclosure, or unknown-plugin execution control was exposed.

### Local Plugin Authoring Template

- Status: L3 developer authoring support.
- Added a copyable local plugin template at
  `examples/local-plugins/hello-readonly`.
- Template contents:
  - `manifest.json` with one read-only `hello.lookup` capability;
  - `schemas/hello-lookup-input.json`;
  - `schemas/hello-lookup-output.json`;
  - `src/main.ts` handler sketch for the future execution slice;
  - `README.md` with validation, local discovery preview, and safety notes.
- Added `npm run plugin:validate:local-template` to validate the local template
  manifest and schema files.
- Extended validator tests to prove the local template passes validation without
  executing handler code.
- Updated `docs/plugin-sdk-authoring-alpha.md` to point developers at the
  template and clarify that current validation reads manifest/schema JSON only.
- Safety boundaries preserved:
  - no product execution of local third-party plugin code;
  - no install, enable, disable, uninstall, marketplace, or permission grant UI;
  - no filesystem, shell, browser, clipboard, process, payment, order,
    purchase, trading, credential, or arbitrary network behavior;
  - local template remains a developer-alpha authoring aid, not a product
    executable plugin.

#### Current Gate

- `npm run plugin:validate:local-template`: PASS.
- Plugin manifest validator test: PASS for bundled samples, the local template,
  and unsafe commerce rejection.
- `npm run build:contracts`: PASS.
- Windows UI manual acceptance: not required for this docs/template-only L3
  authoring slice; the prior `Local Manifest DX` UI projection remains L4.

### Local Read-only Plugin Execution Loop Alpha

- Status: L4 user-facing integration after Windows UI manual acceptance.
- Added a repository-owned controlled read-only runtime definition for
  `cn.example.hello-readonly`, exposed only when the local manifest discovery
  path is explicitly configured.
- Added one deterministic rules command:
  - `hello plugin Jarvis` routes to `plugin.invoke`;
  - plugin id: `cn.example.hello-readonly`;
  - capability: `hello.lookup`.
- Replaced the old template-runtime-only opt-in with the local manifest path:
  - `JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS=1`;
  - `JARVIS_K_LOCAL_PLUGIN_DIRS` must include the validated local plugin
    directory;
  - the plugin must be enabled through the persisted local state store before
    it becomes route selectable.
- Added execution-mode projection for `local_readonly_runtime`.
- Added Core fail-closed invocation gates:
  - bundled read-only sample plugins remain enabled by bundled runtime;
  - local read-only plugins require manifest registration, no declared
    permissions, read-only capabilities, controlled runtime availability, and
    persisted enabled state;
  - disabled local plugins are blocked before Task Runtime creates a completed
    invocation task.
- The controlled template runtime returns sanitized structured output only and
  keeps all plugin safety flags false:
  - `directActionAttempted: false`;
  - `credentialExposed: false`;
  - `rawPluginOutputPersisted: false`.
- Added a desktop smoke script:
  - `npm run smoke:desktop:plugin-local-template-runtime`;
  - launches the official React UI with temporary SQLite task/memory DBs and a
    temporary local plugin state file;
  - enables `Hello Read-only Local Plugin` from the Plugin Management UI;
  - sends `hello plugin Jarvis`;
  - verifies `plugin.invoke`, deterministic rules route source, sanitized
    result panel, completed Task Runtime record, verified task step, and task
    persistence after restart;
  - disables the local plugin state and verifies the same route is blocked.
- Safety boundaries preserved:
  - no arbitrary local plugin code execution;
  - no marketplace access;
  - no install, uninstall, marketplace, unknown-code execution, or permission
    grant UI;
  - local enabled/disabled controls persist state only and do not execute
    unknown plugin code;
  - no filesystem, shell, browser, clipboard, process, credential, payment,
    order, purchase, trading, or arbitrary network behavior;
  - local manifest discovery remains list-only unless the plugin is backed by a
    repository-owned controlled read-only runtime and persisted enabled state.

#### Current Gate

- Package builds: PASS for contracts, capabilities, plugin-sdk, core,
  core-host, UI, and desktop.
- Targeted Contracts/Plugin SDK/Core/UI tests: PASS, 5 test files and 146
  tests.
- `npm run plugin:validate:local-template`: PASS.
- Desktop local template runtime smoke: PASS via
  `npm run smoke:desktop:plugin-local-template-runtime`.
  - Real Electron UI command: `hello plugin Jarvis`.
  - Verified local manifest discovery, persisted enabled state,
    `local_readonly_runtime`, `plugin.invoke`, deterministic rules route
    source, sanitized plugin result panel, completed Task Runtime record,
    verified plugin task step, and task persistence after restart.
  - Verified disabled local state blocks the route before execution.
  - Evidence artifacts:
    `artifacts/jarvis-k-plugin-local-template-runtime-smoke.png` and
    `artifacts/jarvis-k-plugin-local-template-runtime-smoke-metrics.json`.
- Desktop local plugin state smoke: PASS via
  `npm run smoke:desktop:plugin-local-state`.
- `npm run typecheck`: PASS.
- Windows UI manual acceptance: PASS on 2026-08-12.
  - Official React Plugin Management view discovered
    `Hello Read-only Local Plugin` from the configured local manifest
    directory.
  - Enabling local state projected persisted `local_state_store`,
    `local_readonly_runtime`, executable `true`, and route selectable `true`.
  - Official React conversation command `hello plugin Jarvis` completed through
    `plugin.invoke`.
  - Visible result showed `Plugin Runtime invoked hello.lookup; sanitized output
    verified.`
  - Task Runtime timeline showed `Invoke Read-only Plugin` completed with the
    plugin step verification status `verified`.
  - Restart preserved the local enabled state and task record.
  - Disabling local state changed the plugin back to `list_only`, executable
    `false`, and route selectable `false`.
  - Re-running `hello plugin Jarvis` after disabling state was blocked before
    execution with no successful plugin task created.
  - No unknown local plugin code execution, install, uninstall, marketplace,
    permission grant, filesystem, shell, browser, clipboard, process,
    credential, payment, order, purchase, trading, or arbitrary network
    behavior was observed.

### E-commerce Bargain Advice Read-only Slice

- Status: L4 user-facing integration after Windows manual UI acceptance.
- Added one read-only e-commerce sample capability:
  - plugin id: `cn.jarvis-k.ecommerce-comparison`;
  - capability: `product.bargain.advice`;
  - routed command example: `bargain advice mechanical keyboard`.
- Added deterministic rules routing for bargain, haggle, negotiate, discount
  advice, and Chinese bargain phrases such as `砍价`, while blocking phrases
  that imply sending, checkout, payment, purchase, order placement, or seller
  contact.
- The plugin returns sanitized bargain advice and a draft-only message card:
  - no seller message is sent;
  - no cart, checkout, payment, order, purchase, or account mutation occurs;
  - no network, filesystem, shell, browser, clipboard, process, credential, or
    marketplace access occurs.
- Task Runtime integration:
  - creates a persisted `plugin.invoke` task;
  - uses `routeSource: intent-router.deterministic.rules`;
  - marks the plugin step `verified` only after
    `PluginInvocationResult` validation and safety flags pass;
  - preserves the completed task record after restart.
- Updated Plugin SDK docs and the e-commerce sample README to include the
  read-only bargain advice capability and safety boundary.

#### Current Gate

- `npm run plugin:validate:examples`: PASS.
- Targeted Plugin SDK/Core/validator tests: PASS, 3 test files and 99 tests.
- `npm run typecheck`: PASS.
- Full package build inside `npm run smoke:desktop:plugin-bargain-advice`:
  PASS.
- Desktop bargain advice smoke: PASS via
  `npm run smoke:desktop:plugin-bargain-advice`.
  - Real Electron UI command: `帮我砍价机械键盘`.
  - Verified `plugin.invoke`, deterministic rules route source, sanitized
    plugin result panel, completed Task Runtime record, verified plugin task
    step, and task persistence after restart.
  - Evidence artifacts:
    `artifacts/jarvis-k-plugin-bargain-advice-smoke.png` and
    `artifacts/jarvis-k-plugin-bargain-advice-smoke-metrics.json`.
- Manual acceptance finding:
  - The first Windows UI manual attempt with `帮我砍价机械键盘` showed a
    `chat.answer` fallback in the already-running app.
  - Added a direct Chinese route regression test for that exact utterance and
    switched the desktop bargain advice smoke to the same Chinese command.
  - Rebuilt Electron/Desktop and verified the official UI path now routes the
    Chinese command to `product.bargain.advice` with draft-only sanitized output.
- Windows UI manual acceptance: PASS on 2026-08-12.
  - Official React conversation command: `帮我砍价机械键盘`.
  - Visible result:
    `Plugin Runtime invoked product.bargain.advice; sanitized output verified.`
  - Visible sanitized summary:
    `Read-only bargain advice returned for 机械键盘. Draft only; no seller message, checkout, payment, or order action was performed.`
  - Visible result field included
    `Bargain Plan: Anchor ask for 8-12% lower.`
  - No seller message, contact action, cart mutation, checkout, payment, order,
    purchase, browser launch, filesystem access, shell execution, credential
    exposure, marketplace access, or unknown-plugin execution was observed.

### MCP Adapter Alpha Status Projection

- Status: L4 user-facing integration after Windows manual UI acceptance.
- Added a provider-neutral MCP adapter status projection inside the existing
  plugin management status result:
  - `mcpAdapter.status: disabled`;
  - `mode: compatibility_status_only`;
  - `defaultExecutionState: disabled`;
  - external MCP server startup is not allowed;
  - external MCP tool execution is not allowed;
  - MCP tool-call forwarding is not allowed;
  - Jarvis permission layer is required for any future MCP bridge;
  - credentials are not exposed;
  - raw MCP tool output is not persisted;
  - marketplace access remains disabled.
- Updated Core `agent.getPluginManagementStatus` to return the sanitized
  fail-closed MCP adapter status through the existing Contracts/IPC path.
- Updated the official React Plugin Management view with a read-only
  `MCP Adapter Alpha` panel:
  - status and compatibility-only mode;
  - default execution state;
  - server startup, tool execution, and tool forwarding safety flags;
  - permission-layer requirement;
  - credential/raw-output safety flags;
  - sanitized reason codes.
- Safety boundaries preserved:
  - no MCP server startup;
  - no external MCP tool execution;
  - no MCP tool-call forwarding;
  - no unknown third-party plugin code execution;
  - no install, enable, disable, uninstall, marketplace, or permission grant UI;
  - no filesystem, shell, browser, clipboard, process, credential, payment,
    order, purchase, trading, arbitrary network behavior, or permission
    expansion.

#### Current Gate

- `npm run typecheck`: PASS.
- Targeted contracts/Core/UI tests: PASS, 4 test files and 133 tests.
- Desktop Plugin Management UI smoke script: PASS via
  `npm run smoke:desktop:plugin-management-ui`.
  - Visible UI projected `MCP Adapter Alpha` and `STATUS ONLY`.
  - Verified `externalServerStartupAllowed: false`.
  - Verified `externalToolExecutionAllowed: false`.
  - Verified `toolCallForwardingAllowed: false`.
  - Verified `permissionLayerRequired: true`.
  - Verified `credentialExposed: false` and `rawToolOutputPersisted: false`.
  - Verified no `agent.invokePlugin` command was observed during the plugin
    management smoke.
  - Evidence artifacts:
    `artifacts/jarvis-k-plugin-management-ui-smoke.png` and
    `artifacts/jarvis-k-plugin-management-ui-smoke-metrics.json`.
- Windows UI manual acceptance: PASS on 2026-08-12.
  - Official React Plugin Management view projected `MCP Adapter Alpha` with
    `STATUS ONLY`.
  - Visible status fields:
    - `STATUS`: `DISABLED`;
    - `MODE`: `COMPATIBILITY_STATUS_ONLY`;
    - `DEFAULT EXECUTION`: `DISABLED`;
    - `SERVER STARTUP`: `NO`;
    - `TOOL EXECUTION`: `NO`;
    - `TOOL FORWARDING`: `NO`;
    - `PERMISSION LAYER`: `REQUIRED`;
    - `CREDENTIALS`: `HIDDEN`;
    - `RAW OUTPUT`: `NO`.
  - Visible reason codes included `MCP_ADAPTER_STATUS_ONLY`,
    `MCP_EXTERNAL_EXECUTION_DISABLED`, and
    `JARVIS_PERMISSION_LAYER_REQUIRED`.
  - No MCP server startup, MCP tool execution, MCP forwarding,
    install/enable/disable/uninstall, marketplace, permission grant,
    filesystem, shell, browser, clipboard, process, credential, payment, order,
    purchase, trading, arbitrary network behavior, or unknown-plugin execution
    was observed.

### Local Plugin Enabled State Persistence And Read-only Safety Gates

- Status: L4 user-facing integration after Windows manual UI acceptance.
- Added a narrow local plugin state command:
  - `agent.setLocalPluginEnabledState`;
  - request is `pluginId + enabled`;
  - result is sanitized and always projects `executionMode: list_only`,
    `executable: false`, `routeSelectable: false`, and
    `thirdPartyCodeExecuted: false` for local manifest-only plugins.
- Extended plugin management projection with:
  - `stateSource`;
  - `statePersisted`;
  - `stateUpdatedAt`;
  - `stateToggleAvailable`.
- Added Core read-only safety gates:
  - only local manifest-only plugins may be toggled;
  - bundled runtime plugin state is not mutable through this command;
  - enabling is allowed only when the manifest has no declared permissions and
    every capability is read-only/low-risk;
  - manifests with declared HTTPS/storage permissions remain blocked and
    disabled by policy;
  - persisted enabled state never makes unknown local plugin code executable or
    route-selectable.
- Added a Core Host injected JSON state repository:
  - `JARVIS_K_LOCAL_PLUGIN_STATE_PATH` can point smoke tests at an isolated
    temporary file;
  - default storage is under the Core Host local app data path;
  - Desktop Host and UI do not directly read or write the state file.
- Updated the official React Plugin Management view:
  - local manifest cards show state persistence and a `state_only` toggle;
  - the Local Manifest DX panel shows `STATE TOGGLE` separately from
    `INSTALL/ENABLE`;
  - `INSTALL/ENABLE` remains `NO`, so state persistence is not presented as
    install, runtime execution, or permission grant.
- Safety boundaries preserved:
  - no unknown local plugin code execution;
  - no marketplace access;
  - no install, uninstall, runtime load, permission grant, network execution,
    filesystem access, shell, browser, clipboard, process, credential, payment,
    order, purchase, trading, or arbitrary app behavior;
  - local manifest discovery remains list-only.

#### Current Gate

- Targeted contracts/Core/UI tests: PASS, 5 test files and 141 tests.
- `npm run typecheck`: PASS.
- Package builds: PASS for contracts, capabilities, plugin-sdk, core,
  core-host, UI, and desktop.
- Desktop local plugin state smoke: PASS via
  `node tests/desktop-plugin-local-state-smoke.mjs`.
  - Created one safe local manifest in an isolated temporary root.
  - Toggled the local plugin state to enabled from the official React UI.
  - Restarted Electron and verified the enabled state persisted.
  - Verified the local plugin remained `list_only`, `executable: false`, and
    `routeSelectable: false`.
  - Verified `installOrEnableActionExposed: false`,
    `stateToggleActionExposed: true`, `thirdPartyCodeExecuted: false`, and
    `marketplaceAccessed: false`.
  - Evidence artifacts:
    `artifacts/jarvis-k-plugin-local-state-smoke.png` and
    `artifacts/jarvis-k-plugin-local-state-smoke-metrics.json`.
- Existing Desktop Plugin Management UI smoke: PASS via
  `node tests/desktop-plugin-management-ui-smoke.mjs`.
  - Verified a local manifest with a declared HTTPS permission stayed disabled,
    list-only, blocked, and `disabled_by_policy`.
- `npm test`: FAIL on two pre-existing/unrelated Transformers runtime scaffold
  assertions that still expect descriptor capabilities to be exactly
  `["embedding"]` while the current runtime descriptor includes
  `["embedding", "intent_router"]`.
- Windows UI manual acceptance: PASS on 2026-08-12.
  - Official React Plugin Management page opened from the primary navigation
    with `JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS=1` and one safe local
    read-only manifest directory configured.
  - `Hello Read-only Local Plugin` appeared as a local manifest entry.
  - User clicked `Enable state`; visible status changed to `enabled`.
  - User closed and reopened Jarvis-K with the same local plugin state path.
  - After restart, the plugin remained `enabled` with
    `LOCAL_STATE_STORE`, proving state persistence through the official UI
    path.
  - The plugin still projected `LIST_ONLY`, route-selectable `NO`,
    `THIRD_PARTY_EXECUTION_DISABLED`,
    `LOCAL_PLUGIN_STATE_PERSISTED`, and
    `LOCAL_PLUGIN_STATE_ENABLED_LIST_ONLY`.
  - Local Manifest DX projected `CONFIGURED`, `ENABLED: YES`,
    `CONFIGURED DIRS: 1`, `SCANNED DIRS: 1`, `VALID MANIFESTS: 1`,
    `INVALID MANIFESTS: 0`, `RAW PATHS: HIDDEN`,
    `UNKNOWN CODE: NO`, `INSTALL/ENABLE: NO`, and
    `STATE TOGGLE: STATE_ONLY`.
  - No unknown local plugin code execution, install/enable runtime control,
    marketplace access, permission grant, filesystem, shell, browser,
    clipboard, process, credential, payment, order, purchase, trading, or
    arbitrary network behavior was observed.

### Architecture-Reviewed Phase 5: Plugin SDK Alpha Foundation

- Status: L3 SDK/runtime foundation; superseded by the L4 vertical slice above.
- This entry refers to the current architecture-reviewed roadmap Phase 5,
  Plugin SDK Alpha. Earlier entries below are historical fixture-backed
  inference Phase 5 records.
- Added provider-neutral Plugin SDK Alpha contracts for manifests, capability
  descriptors, invocation requests, sanitized invocation results, and plugin
  list results.
- Added Core command contracts for `agent.listPlugins` and
  `agent.invokePlugin`.
- Added provider-neutral Core plugin ports: `PluginRegistry` and
  `PluginRuntime`.
- Added `@jarvis-k/plugin-sdk` with:
  - `definePlugin`;
  - `InMemoryPluginRegistry`;
  - `DefaultDenyPluginPermissionBroker`;
  - `LocalReadOnlyPluginRuntime`;
  - stock analysis sample plugin;
  - e-commerce product comparison sample plugin.
- Core Host composes the two read-only sample plugins through the Plugin SDK
  registry/runtime.
- Added example plugin directories:
  - `examples/plugins/stock-analysis`;
  - `examples/plugins/ecommerce-product-comparison`.
- Safety boundaries preserved:
  - no plugin marketplace;
  - no trading, ordering, checkout, payment, or purchase capability;
  - no default file/network/screen/clipboard/process/system permissions;
  - no credential exposure;
  - no raw plugin output persistence;
  - no Desktop/UI direct plugin execution.
- Not L4 yet: the official UI and Task Runtime do not yet route a real user
  request into a plugin invocation timeline.
- Reference doc: `docs/plugin-sdk-alpha.md`.

### Current Gate

- Targeted Plugin SDK/Core contracts tests: PASS, 3 test files and 91 tests.
- Plugin SDK boundary-script regression tests: PASS, 1 test file and 17 tests.
- Package builds: PASS for contracts, capabilities, plugin-sdk, core, and
  core-host.
- `npm run typecheck`: PASS.
- `npm run check:boundaries`: FAIL on pre-existing Desktop boundary imports in
  `apps/desktop/src/main.ts`; no Plugin SDK boundary violation was introduced.
- `npm run check:sensitive-artifacts`: FAIL on a pre-existing
  credential-like assignment in `apps/desktop/test/supervisor.test.ts`.

Phase 5 starts from the Phase 4.5 readiness gates. The first slice is a
fixture-backed embedding provider that proves the execution path without real
model downloads, native runtime dependencies, provider credentials, signed
URLs, or external network access.

## Wave 5.1: Fixture Embedding Provider

- Status: complete.
- Added `@jarvis-k/inference-adapter-fixture` as a dedicated test-only
  provider package.
- The provider implements the provider-neutral `EmbeddingInferenceProvider`
  port and returns deterministic fixture vectors for
  `jarvis-fixture/local-embedding-smoke`.
- Added provider descriptor and configuration requirement reports. The
  provider reports available only when
  `JARVIS_K_ENABLE_FIXTURE_INFERENCE=1`; otherwise it remains unconfigured.
- Added `agent.generateEmbeddings` to contracts and Core. Core fetches the
  manifest, runs inference preflight, and calls the injected embedding provider
  only when preflight allows execution.
- Composed the fixture provider in `apps/core-host` only behind the explicit
  environment flag.
- Updated dependency-boundary guards so Core cannot import the concrete
  fixture adapter directly.

### Current Gate

- Targeted fixture/core/contracts/boundary tests: PASS, 4 test files and 59
  tests.
- `npm run check:boundaries`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 37 test files and 201 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.
- Fixture-enabled Core Host IPC check: PASS for provider listing,
  requirements, preflight, and deterministic embedding generation.

## Wave 5.2: Supervised Fixture Inference Execution

- Status: complete.
- Extended model operation phases with `executing` and `completed` so
  inference execution can be represented without overloading install or load
  states.
- Updated Core embedding generation to create supervised operation snapshots
  when a `ModelOperationSupervisor` is injected.
- Successful embedding generation now reports `prechecking`, `executing`, and
  `completed` operation updates before returning the deterministic fixture
  result.
- Blocked embedding generation now reports `prechecking` and `blocked` before
  returning `INFERENCE_PREFLIGHT_BLOCKED`, and does not call the provider.
- Failed embedding generation reports `failed` with a sanitized structured
  error that does not expose provider internals.
- UI active-operation filtering now treats `executing` as active while leaving
  `completed` inactive.

### Current Gate

- Targeted contracts/capabilities/core tests: PASS, 3 test files and 50 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 37 test files and 201 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.
- Fixture-enabled Core Host IPC check: PASS for supervised embedding phases
  `prechecking`, `executing`, and `completed`.

## Wave 5.3: Fixture Inference UI Observation

- Status: complete.
- Added a compact development observation entry to the existing Model
  Governance panel for the deterministic fixture embedding provider.
- The UI enables the fixture embedding action only when the provider registry
  reports `embedding.fixture` as `available`; default unconfigured states
  remain visible but non-executable.
- Added read-only metrics for fixture provider status, vector dimensions,
  vector count, and final supervised inference operation phase.
- Updated the UI hook to send `agent.generateEmbeddings` through the desktop
  bridge and validate `EmbeddingGenerationResult` and `ModelOperationSnapshot`
  DTOs before updating display state.
- Updated the UI hook to consume `model.operation.updated` events so
  supervised execution state appears without a manual refresh.
- Kept the entry provider-neutral from the UI perspective. The UI does not
  import the fixture adapter, capabilities policy, model runtimes, credentials,
  provider URLs, downloads, or native dependencies.

### Current Gate

- Targeted UI inference source tests: PASS, 2 test files and 10 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 38 test files and 203 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.
- Fixture-enabled UI smoke: PASS. The Model Governance panel refreshed
  `embedding.fixture`, ran the fixture embedding action, and displayed
  `VECTOR DIMS` = 4, `VECTORS` = 1, and `INFERENCE` = `completed`.

## Wave 5.4: Intent Router Fixture Execution

- Status: complete.
- Added a deterministic `intent_router` fixture provider to
  `@jarvis-k/inference-adapter-fixture` with an explicit descriptor and
  configuration report.
- Added the pinned fixture manifest
  `jarvis-fixture/local-intent-router-smoke`.
- Added `agent.routeIntent` to the contracts and Core command surface.
- Refactored Core inference execution into one provider-neutral supervised
  operation helper shared by embedding and intent routing.
- Intent routing uses the same `prechecking`, `executing`, `completed`,
  `blocked`, and sanitized `failed` operation behavior as embedding.
- Added a development observation button and read-only route metrics to the
  existing UI Model Governance panel. The action remains disabled unless
  `intent-router.fixture` reports `available`.
- Kept all fixture behavior deterministic and offline. No model downloads,
  credentials, provider URLs, native runtimes, or real inference dependencies
  were added.

### Current Gate

- Targeted fixture/contracts/Core/UI tests: PASS, 5 test files and 63 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 38 test files and 205 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.
- Fixture-enabled UI smoke: PASS. Both fixture actions completed; the UI
  displayed `VECTOR DIMS` = 4, `VECTORS` = 1,
  `INTENT` = `memory.search`, and `ROUTE` = `completed`.

## Wave 5.5: OCR Fixture And Binary Input Boundary

- Status: complete.
- Added a deterministic OCR fixture provider to
  `@jarvis-k/inference-adapter-fixture` with descriptor and configuration
  reports.
- Added the pinned fixture manifest `jarvis-fixture/local-ocr-smoke`.
- Added `agent.recognizeOcr` to contracts and Core.
- Reused the generic supervised inference execution helper for OCR, including
  preflight, operation updates, blocked states, completed states, and
  sanitized failures.
- Validated OCR image input through the provider-neutral
  `OcrRecognitionRequest` schema with `Uint8Array` bytes, MIME type, dimensions,
  and normalized text block bounding boxes.
- Added a development OCR observation button and read-only metrics to the UI.
  The action remains disabled unless `ocr.fixture` reports `available`.
- Kept OCR deterministic and offline. No image model, native runtime,
  download path, credential, provider URL, or external execution was added.

### Current Gate

- Targeted OCR/contracts/Core/UI tests: PASS, 5 test files and 65 tests.
- `npm run verify`: PASS, 38 test files and 207 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.
- Fixture-enabled UI smoke: PASS. The Model Governance panel reported
  `ocr.fixture` as `available`, ran the OCR fixture action, and displayed
  `OCR TEXT` = `fixture ocr text`, `OCR BLOCKS` = `1`, and `OCR OPS` =
  `completed`.

## Wave 5.6: Reranker Fixture Execution

- Status: complete.
- Added a deterministic reranker fixture provider to
  `@jarvis-k/inference-adapter-fixture` with descriptor and configuration
  reports.
- Added the pinned fixture manifest `jarvis-fixture/local-reranker-smoke`.
- Added `agent.rerank` to contracts and Core.
- Reused the generic supervised inference execution helper for reranking,
  including preflight, operation updates, blocked states, completed states, and
  sanitized failures.
- Validated rerank query/document/topK inputs and ranked results through the
  provider-neutral `RerankRequest` and `RerankResult` schemas.
- Added a development reranker observation button and read-only metrics to the
  UI. The action remains disabled unless `reranker.fixture` reports
  `available`.
- Kept reranking deterministic and offline. No real reranker model, native
  runtime, download path, credential, provider URL, or external execution was
  added.

### Current Gate

- Targeted reranker/contracts/Core/UI tests: PASS, 5 test files and 67 tests.
- `npm run verify`: PASS, 38 test files and 209 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.
- Fixture-enabled UI smoke: PASS. The Model Governance panel reported
  `reranker.fixture` as `available`, ran the reranker fixture action, and
  displayed `TOP DOC` = `doc-model-ports`, `RERANKED` = `1`, and
  `RERANK OPS` = `completed`.

## Wave 5.7: Fixture Inference Desktop Smoke Automation

- Status: complete.
- Added `tests/desktop-fixture-inference-smoke.mjs` to run all fixture-backed
  inference UI actions in one isolated Electron session.
- Added `npm run smoke:desktop:fixture-inference` as the explicit verification
  command for fixture inference UI changes.
- The smoke uses temporary user data, temporary SQLite memory, and a temporary
  model directory, and enables fixtures only through
  `JARVIS_K_ENABLE_FIXTURE_INFERENCE=1`.
- The smoke clicks the existing Model Governance buttons for embedding, intent
  routing, OCR, and reranking, then asserts the read-only UI metrics for
  provider availability and completed operation phases.
- Updated developer onboarding so fixture inference no longer describes only
  embedding.
- Kept the gate deterministic and offline. No real provider execution, model
  download, native runtime, credential, provider URL, or external network path
  was added.

### Current Gate

- `npm run smoke:desktop:fixture-inference`: PASS.
- `npm run verify`: PASS, 38 test files and 209 tests.

## Wave 5.8: CI And README Fixture Gate Alignment

- Status: complete.
- Updated GitHub Actions CI to run `npm run check:sensitive-artifacts` as an
  explicit step instead of relying only on the local `ci`/`verify` scripts.
- Added `npm run smoke:desktop:fixture-inference` to CI so the remote gate
  covers the full fixture-backed UI execution path for embedding, intent
  routing, OCR, and reranking.
- Updated README status, command list, and workspace description to reflect the
  completed fixture-backed inference foundation instead of the older embedding
  slice wording.
- Kept CI deterministic and offline. The new CI smoke enables only fixture
  inference and does not require credentials, model downloads, native runtimes,
  provider URLs, or real provider execution.

### Current Gate

- `npm run verify`: PASS, 38 test files and 209 tests.
- `npm run smoke:desktop:fixture-inference`: PASS.

## Wave 5.9: Phase 5 Completion Handoff

- Status: complete.
- Added `docs/phase-5-completion.md` as the formal Phase 5 closeout and Phase 6
  handoff document.
- Updated architecture decisions to record the completed fixture-backed
  inference foundation and the intended replacement boundary for future real
  providers.
- Updated README status and documentation links to point at the Phase 5
  completion baseline.
- Kept the closeout documentation-only. No provider code, runtime dependency,
  model artifact, credential path, provider URL, or real execution path was
  added.

### Current Gate

- `npm run verify`: PASS, 38 test files and 209 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.
- `npm run smoke:desktop:fixture-inference`: PASS.
