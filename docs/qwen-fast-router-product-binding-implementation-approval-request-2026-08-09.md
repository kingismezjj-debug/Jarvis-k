# Qwen Fast Router Product Binding Implementation Approval Request

Recorded: 2026-08-09

## Status

`PRODUCT_SECURITY_RELEASE_APPROVED_IMPLEMENTED`

This request records Product, Security, and Release approval for a bounded
implementation window for a default-off, no-runtime Qwen fast-router product
binding status surface. It does not approve real Qwen
runtime/helper/artifact/cache use, product routing through Qwen, allowlist
expansion, direct execution, or release-facing behavior.

Implementation is complete under this scope. Evidence:

```text
docs/qwen-fast-router-product-binding-implementation-evidence-2026-08-09.md
docs/qwen-fast-router-product-binding-implementation-closeout-2026-08-09.md
```

## Purpose

Expose Qwen as a visible but unavailable product router slot in the existing
Command Router product-mode surface:

```text
Settings / Command Router
  -> deterministic fixture product mode remains the active route source
  -> Qwen fast router slot is shown as default-off / no-runtime
  -> composition gates are visible as sanitized status only
  -> deterministic fallback is visibly preserved
  -> realQwenRuntimeEnabled remains false
  -> no Qwen direct execution authority
```

## Prior Baseline

No-runtime preparation is complete:

```text
docs/qwen-fast-router-product-binding-preparation-closeout-2026-08-09.md
```

Accepted safety baselines:

```text
docs/command-router-real-local-app-allowlist-closeout-2026-08-09.md
docs/command-router-voice-manual-acceptance-closeout-2026-08-09.md
```

## Exact Implementation Scope

Allowed implementation work:

- extend typed Command Router product-mode status with a sanitized Qwen binding
  projection;
- keep the active provider `intent-router.deterministic.fixture`;
- keep Command Router product mode default-off;
- keep `realQwenRuntimeEnabled: false`;
- expose only no-runtime Qwen gate states:
  - explicit enablement required;
  - artifact digest approval required;
  - model lifecycle readiness required;
  - runtime generation port readiness required;
  - selection policy readiness required;
  - default-off preserved;
  - deterministic fallback preserved;
  - one environment variable not sufficient;
  - normal Core Host startup does not instantiate Qwen;
- render the Qwen slot/gate projection in Settings;
- add focused contract/source/UI tests;
- run builds and Command Router fixture suite.

This implementation may import or reference existing no-runtime composition
types/reason codes. It must not instantiate a real Qwen provider from product
startup or invoke a generation port.

## Required Product Approval Text

```text
Product: APPROVE exactly this Qwen fast router product binding implementation scope adding only a default-off no-runtime Qwen status/settings/gate projection to the existing Command Router product-mode surface, using existing frozen Qwen alpha evidence, existing no-runtime composition gates, existing Core selection/fallback contracts, and existing Command Router safety gates; keep deterministic fixture routing as the active route source, keep realQwenRuntimeEnabled false, keep Qwen unavailable for product routing, and make no default behavior, allowlist, browser/URL, shell, filesystem, network, process, provider planner, Memory vector retrieval, direct execution, installer, packaging, or release-channel change
```

## Required Security Approval Text

```text
Security: APPROVE exactly this bounded fail-closed Qwen fast router product binding implementation window with no credential access, no raw prompt/model output/helper diagnostic/path/URL/token/vector evidence, no artifact download/materialization/cache promotion, no helper startup, no Qwen/model runtime execution, no generation port invocation, no network/provider call, no browser or URL opening, no shell/PowerShell/cmd/terminal/script execution, no arbitrary executable path or command-line arguments, no filesystem/clipboard/process enumeration beyond local source/build/test verification, no Memory write/vector retrieval, no allowlist expansion, no bypass of existing Command Router safety gates, and sanitized status/gate projection only
```

## Required Release Approval Text

```text
Release: APPROVE developer-alpha Qwen fast router product binding implementation evidence only; no default behavior change, no Qwen runtime enablement, no persistent model cache, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that Qwen routing or arbitrary app control is supported
```

## Approval Receipt

The exact Product, Security, and Release approval texts above were provided by
the product owner on 2026-08-09 before implementation began.

## Explicit Exclusions

This request does not approve:

- running Qwen runtime/cache/lifecycle acceptance;
- downloading, materializing, verifying, or caching Qwen artifacts;
- starting a Transformers helper;
- invoking a Qwen generation port;
- selecting Qwen as the active product router;
- adding a toggle that makes Qwen route product traffic;
- changing Command Router product mode defaults;
- expanding Notepad/Calculator allowlist;
- browser, URL, shell, filesystem, clipboard, network, process, OCR, voice,
  Memory vector retrieval, or planner actions;
- raw prompts, model outputs, helper diagnostics, private paths, credentials,
  tokens, vectors, or benchmarks in evidence.

## Required Verification

After implementation:

```powershell
npx.cmd vitest run packages/contracts/test/protocol.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts packages/core/test/runtime.test.ts
npm.cmd run build:contracts
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
node tests/desktop-command-router-fixture-suite.mjs
```

Expected:

- Qwen binding projection appears in status/UI;
- active route source remains deterministic fixture;
- `realQwenRuntimeEnabled` remains false;
- no Qwen runtime/helper/artifact/cache/generation occurs;
- Command Router fixture suite remains green.

## Stop Conditions

Stop and record blocked/degraded evidence if:

- implementation requires real Qwen runtime, artifacts, helper, generation port,
  network, credentials, or cache;
- Qwen becomes active product router;
- Command Router defaults change;
- direct action bypasses existing safety gates;
- allowlist expansion appears;
- raw prompt/model/helper/private evidence would be recorded;
- telemetry, installer, packaging, release, browser, URL, shell, filesystem,
  clipboard, process, planner, or Memory vector behavior changes.
