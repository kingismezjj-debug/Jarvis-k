# Plugin SDK Alpha Authoring Guide

Status: L3 developer authoring support. The user-facing sample invocation path
is L4, but third-party plugin installation is not L4 yet.

This guide is the current developer-alpha path for creating a Jarvis-K plugin
that matches the Phase 5 safety model.

## Scope

Supported now:

- read-only manifests;
- JSON input and output schemas;
- sanitized result cards;
- local SDK validation;
- explicit local manifest discovery for developer-alpha listing;
- built-in sample plugin routing through the official UI;
- explicit developer-alpha routing of the repository-owned local template
  handler.

Not supported yet:

- marketplace publishing;
- arbitrary local plugin installation;
- arbitrary third-party plugin code execution;
- third-party plugin enable/disable controls in the official UI;
- network permissions;
- filesystem, clipboard, screen, process, shell, or credential access;
- trading, ordering, checkout, payment, purchase, or account mutation.

## Minimal Plugin Layout

The repository includes a copyable local template:

```text
examples/local-plugins/hello-readonly/
  manifest.json
  schemas/
    hello-lookup-input.json
    hello-lookup-output.json
  src/
    main.ts
  README.md
```

Use this template when starting a new developer-alpha plugin. It demonstrates a
valid manifest, a read-only capability, schema files, and a handler sketch. The
handler sketch is not loaded from arbitrary local directories. The
repository-owned template has a separate controlled built-in sample runtime
that is enabled only for developer-alpha smoke sessions.

```text
my-plugin/
  manifest.json
  schemas/
    my-capability-input.json
    my-capability-output.json
  README.md
```

The manifest must use:

```json
{
  "schemaVersion": 1,
  "id": "cn.example.readonly-sample",
  "name": "Read-only Sample",
  "version": "0.1.0",
  "apiVersion": "1",
  "entry": "dist/main.js",
  "runtime": "node-worker",
  "capabilities": [
    {
      "name": "sample.lookup",
      "description": "Read-only lookup sample.",
      "inputSchema": "schemas/sample-lookup-input.json",
      "outputSchema": "schemas/sample-lookup-output.json",
      "risk": "read_only",
      "readOnly": true
    }
  ],
  "permissions": []
}
```

## Validation

Run the bundled example validation:

```bash
npm run plugin:validate:examples
```

Run the local template validation:

```bash
npm run plugin:validate:local-template
```

Validate one plugin directory after building contracts:

```bash
npm run build:contracts
node scripts/validate-plugin-manifest.mjs examples/local-plugins/hello-readonly
```

Validation checks:

- manifest schema version, API version, runtime, and fixed entry;
- capability names and schema paths;
- schema files exist and are valid JSON;
- every capability is read-only;
- prohibited commerce or payment actions are rejected.

Validation does not run `src/main.ts` or any `dist/main.js` code. It only reads
`manifest.json` and schema JSON files.

Runtime schema gates:

- controlled repository-owned plugin runtimes must provide the schema documents
  referenced by each manifest capability;
- invocation input is validated against the declared `inputSchema` before the
  handler is called;
- handler output is validated against the declared `outputSchema` before it is
  parsed into Jarvis-K's sanitized result contract;
- missing or unsupported schema documents fail closed;
- invalid input returns `PLUGIN_INPUT_INVALID` without invoking the handler;
- invalid output returns `PLUGIN_OUTPUT_INVALID` without projecting raw output.

## Local Manifest Discovery

Developer-alpha builds can list explicitly provided local plugin manifests
without executing plugin code:

```bash
set JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS=1
set JARVIS_K_LOCAL_PLUGIN_DIRS=C:\path\to\my-plugin
npm run dev
```

Discovery rules:

- only explicitly listed directories are inspected;
- each directory must contain `manifest.json`;
- capability schema paths must stay inside the plugin directory;
- schema files must be readable JSON;
- invalid manifests are skipped fail-closed;
- discovered third-party manifests are list-only and do not add executable
  handlers.

## Current Routed Samples

The official UI can route these developer-alpha sample commands:

```text
stock quote MSFT
compare products mechanical keyboard
bargain advice mechanical keyboard
```

Expected result:

- intent is `plugin.invoke`;
- route source is `intent-router.deterministic.rules`;
- Task Runtime records a completed task;
- plugin step verification is `verified`;
- result UI shows sanitized summary and bounded fields.

The bargain advice command is draft-only. It returns local sample negotiation
guidance and a message draft for user review; it does not contact a seller,
send a message, edit a cart, place an order, or perform payment behavior.

Only the bundled stock and e-commerce sample plugins are routed and invoked
through the current official UI by default. With explicit local manifest
discovery and persisted local plugin state enabled, the official UI can also
route this repository-owned controlled template command:

```text
hello plugin Jarvis
```

Required developer-alpha environment:

```bash
set JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS=1
set JARVIS_K_LOCAL_PLUGIN_DIRS=C:\path\to\Jarvis-k\examples\local-plugins\hello-readonly
```

The plugin must then be enabled from the official Plugin Management UI. This
state toggle persists local state only; it is not plugin installation and does
not load arbitrary local plugin code.

Discovered local third-party manifests are still a developer authoring preview
until the plugin install/enable/runtime slice is implemented and manually
accepted.

Automated smoke:

```bash
npm run smoke:desktop:plugin-sdk-alpha
npm run smoke:desktop:plugin-local-template-runtime
```

## Safety Notes

Plugin code must not bypass Core, Desktop Host, IPC validation, Task Runtime, or
permission policy. Plugin output must be structured data only; plugins must not
inject React, HTML, JavaScript, scriptable SVG, iframe, shell commands, raw
logs, credentials, private paths, URLs, or tokens into the UI.
