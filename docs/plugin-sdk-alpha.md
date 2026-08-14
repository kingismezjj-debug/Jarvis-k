# Plugin SDK Alpha

Status: L4 user-facing integration.

This document records the current developer-alpha Plugin SDK shape. It is not
release-ready and does not include a plugin marketplace.

## Current Architecture

```text
Plugin manifest and invocation contracts
-> provider-neutral Core plugin ports
-> Core Host composition
-> local read-only Plugin SDK runtime
-> sanitized result DTO
```

Core remains provider-neutral. Core Host composes the concrete local registry
and runtime. Desktop Host and UI do not directly execute plugin code.

## Manifest Rules

Plugin SDK Alpha manifests must:

- use `schemaVersion: 1`;
- use `apiVersion: "1"`;
- use `runtime: "node-worker"`;
- use the fixed entry `dist/main.js`;
- declare one or more capabilities;
- keep every capability `readOnly: true` and `risk: "read_only"`;
- avoid trading, ordering, checkout, payment, purchase, or similar actions.

By default, plugins receive no file, network, screen, clipboard, process, or
system execution permission.

## Current Sample Plugins

Two read-only examples are included:

- `examples/plugins/stock-analysis`
- `examples/plugins/ecommerce-product-comparison`

Both samples use local static data in the SDK runtime and request no
permissions. The stock sample does not trade. The e-commerce sample only
compares products or returns bargain-advice drafts and does not mutate cart,
account, seller-message, or commerce state.

## Current Commands

The Core command surface now accepts:

```text
agent.listPlugins
agent.invokePlugin
agent.runBrainCommand -> plugin.invoke
```

Invocation results are sanitized and require:

```text
directActionAttempted: false
credentialExposed: false
rawPluginOutputPersisted: false
```

## L4 Vertical Slice

The official React conversation surface can now route narrow read-only plugin
requests through deterministic rules, Task Runtime, Core Host Plugin Runtime
composition, and sanitized UI result projection.

Manual acceptance commands:

- `stock quote MSFT`
- `compare products mechanical keyboard`
- `bargain advice mechanical keyboard`

Automated desktop smoke:

- `npm run smoke:desktop:plugin-sdk-alpha`

Windows UI manual acceptance has passed for both sample commands, so this
vertical slice is L4. It is still not L5 and does not include marketplace,
install/uninstall, network permissions, MCP bridging, or third-party isolated
worker packaging.
