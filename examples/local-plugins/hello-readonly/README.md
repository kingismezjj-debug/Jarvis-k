# Hello Read-only Local Plugin Template

This is the Phase 5 local plugin authoring template. It is intentionally
minimal, read-only, and safe to copy while Jarvis-K local third-party execution
remains default-off.

## What It Demonstrates

- A valid `manifest.json`.
- One read-only capability: `hello.lookup`.
- JSON input and output schemas.
- A TypeScript handler sketch in `src/main.ts`.
- No declared permissions.

## Current Product Behavior

Jarvis-K can validate and list this manifest only when local manifest discovery
is explicitly enabled for a developer-alpha session. The product does not
install, enable, or execute arbitrary local copies of this template.

The repository-owned template handler can be exercised through one separate
developer-alpha runtime path only when
`JARVIS_K_ENABLE_LOCAL_PLUGIN_TEMPLATE_RUNTIME=1` is set. That path is a
controlled built-in sample runtime, not third-party local code loading.

## Validate

From the repository root:

```bash
npm run plugin:validate:local-template
```

Or validate this directory directly:

```bash
npm run build:contracts
node scripts/validate-plugin-manifest.mjs examples/local-plugins/hello-readonly
```

## Local Discovery Preview

On Windows PowerShell, after building the app, a developer can preview the
manifest projection:

```powershell
$env:JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS="1"
$env:JARVIS_K_LOCAL_PLUGIN_DIRS="examples/local-plugins/hello-readonly"
npm run dev
```

The Plugin Management view should show the manifest as local/list-only. It
should not expose install, enable, disable, uninstall, marketplace, permission
grant, or execution controls for this template.

## Controlled Runtime Smoke

After building the desktop app, a developer can verify the controlled template
runtime path:

```powershell
$env:JARVIS_K_ENABLE_LOCAL_PLUGIN_TEMPLATE_RUNTIME="1"
npm run smoke:desktop:plugin-local-template-runtime
```

The smoke sends `hello plugin Jarvis` through the official conversation UI and
expects a completed `plugin.invoke` Task Runtime record with verified sanitized
output.

## Copying The Template

When creating a new local plugin:

1. Copy this directory.
2. Change `id`, `name`, `capabilities[].name`, and schema filenames.
3. Keep every alpha capability `readOnly: true` and `risk: "read_only"`.
4. Keep `permissions: []` until a later permission slice explicitly supports
   more.
5. Re-run the validation command.

Do not add filesystem, shell, browser, clipboard, process, payment, order,
purchase, trading, credential, or arbitrary network behavior to local plugins in
the current alpha.
