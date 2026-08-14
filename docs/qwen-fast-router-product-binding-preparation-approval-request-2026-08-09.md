# Qwen Fast Router Product Binding Preparation Approval Request

Recorded: 2026-08-09

## Status

`PRODUCT_SECURITY_RELEASE_APPROVED_PREPARED`

This request prepares the next productization step after accepted Command
Router text and voice paths. It does not run Qwen, materialize artifacts, start
helpers, open a runtime/cache window, change defaults, add UI/IPC, or give Qwen
direct execution authority.

## Recorded Approvals

Product approval was recorded on 2026-08-09:

```text
Product: APPROVE exactly this Qwen fast router product binding preparation scope using existing frozen Qwen alpha evidence, existing no-runtime Core Host composition gates, existing Core selection/fallback contracts, and existing Command Router safety gates to prepare default-off product binding policy and sanitized evidence only; no real Qwen runtime/helper/artifact materialization/cache window, no UI/IPC implementation, no default behavior change, no allowlist expansion, no browser/URL/shell/filesystem/network/process action, no provider planner, no Memory vector retrieval, and no direct Qwen execution authority
```

Security approval was recorded on 2026-08-09:

```text
Security: APPROVE exactly this bounded fail-closed Qwen fast router product binding preparation window with no credential access, no raw prompt/model output/helper diagnostics/path/URL/token/vector evidence, no artifact download/materialization/cache promotion, no helper startup, no Qwen/model runtime execution, no network/provider call, no browser or URL opening, no shell/PowerShell/cmd/terminal/script execution, no arbitrary executable path or command-line arguments, no filesystem/clipboard/process enumeration beyond local source/build/test verification, no Memory write/vector retrieval, no allowlist expansion, and no bypass of existing Command Router safety gates
```

Release approval was recorded on 2026-08-09:

```text
Release: APPROVE developer-alpha Qwen fast router product binding preparation evidence only; no default behavior change, no UI/IPC shipped control, no persistent model cache, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that Qwen or arbitrary app control is supported
```

Preparation preflight passed on 2026-08-09 and is recorded in:

```text
docs/qwen-fast-router-product-binding-preparation-evidence-2026-08-09.md
```

## Purpose

Define a bounded preparation window for making Qwen3-0.6B a future default-off
fast-router product candidate while preserving deterministic fallback and the
accepted Command Router safety gates.

Target product spine:

```text
text/voice command
  -> default-off Qwen fast router product slot
  -> artifact/runtime/lifecycle readiness gates
  -> sanitized structured intent candidates
  -> deterministic fallback on unavailable/invalid/low-confidence output
  -> existing Command Router safety projection
  -> existing confirmation gates for allowed actions
  -> no direct Qwen execution authority
```

## Prior Accepted Evidence

Frozen evidence this scope may reference but must not rerun:

- `docs/qwen3-0.6b-fast-router-alpha-closeout.md`
- `docs/qwen-fast-router-core-host-selection-fallback-closeout.md`
- `docs/qwen-lifecycle-backed-runtime-wiring-closeout.md`

Accepted current product safety baseline:

- `docs/command-router-real-local-app-allowlist-closeout-2026-08-09.md`
- `docs/command-router-voice-manual-acceptance-closeout-2026-08-09.md`

## Exact Preparation Scope

Allowed work:

- document the Qwen product binding policy;
- verify existing no-runtime composition gates;
- verify existing Core fallback behavior for low-confidence, invalid,
  throwing, unsupported, blocked, and unsafe provider results;
- verify current Command Router product mode still reports real Qwen runtime as
  disabled;
- prepare an evidence template for a later implementation window;
- update handoff/roadmap documents.

No-runtime preflight may run only local tests/builds that do not materialize or
execute Qwen artifacts.

## Required Product Approval Text

```text
Product: APPROVE exactly this Qwen fast router product binding preparation scope using existing frozen Qwen alpha evidence, existing no-runtime Core Host composition gates, existing Core selection/fallback contracts, and existing Command Router safety gates to prepare default-off product binding policy and sanitized evidence only; no real Qwen runtime/helper/artifact materialization/cache window, no UI/IPC implementation, no default behavior change, no allowlist expansion, no browser/URL/shell/filesystem/network/process action, no provider planner, no Memory vector retrieval, and no direct Qwen execution authority
```

## Required Security Approval Text

```text
Security: APPROVE exactly this bounded fail-closed Qwen fast router product binding preparation window with no credential access, no raw prompt/model output/helper diagnostics/path/URL/token/vector evidence, no artifact download/materialization/cache promotion, no helper startup, no Qwen/model runtime execution, no network/provider call, no browser or URL opening, no shell/PowerShell/cmd/terminal/script execution, no arbitrary executable path or command-line arguments, no filesystem/clipboard/process enumeration beyond local source/build/test verification, no Memory write/vector retrieval, no allowlist expansion, and no bypass of existing Command Router safety gates
```

## Required Release Approval Text

```text
Release: APPROVE developer-alpha Qwen fast router product binding preparation evidence only; no default behavior change, no UI/IPC shipped control, no persistent model cache, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that Qwen or arbitrary app control is supported
```

## Explicit Exclusions

This request does not approve:

- running `tests/qwen-fast-router-runtime-cache-acceptance.mjs`;
- running `tests/qwen-lifecycle-backed-runtime-wiring-acceptance.mjs`;
- downloading, materializing, verifying, or caching Qwen artifacts again;
- starting a Transformers helper;
- instantiating Qwen from normal Core Host startup;
- adding product UI/IPC controls;
- changing Command Router product mode defaults;
- enabling Qwen through a single environment variable;
- expanding the Notepad/Calculator allowlist;
- browser, URL, shell, filesystem, clipboard, network, process, OCR, voice,
  Memory vector retrieval, or planner actions;
- recording raw prompts, model outputs, helper diagnostics, private paths,
  credentials, tokens, vectors, or benchmarks.

## Required Preconditions

Before marking preparation evidence as passed:

```powershell
npx.cmd vitest run packages/inference-adapter-qwen-router/test/provider.test.ts packages/inference-adapter-qwen-router/test/artifact-plan.test.ts apps/core-host/test/qwen-fast-router-composition.test.ts packages/core/test/runtime.test.ts apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts
npm.cmd run build:inference-adapter-qwen-router
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:desktop
node tests/desktop-command-router-fixture-suite.mjs
```

Expected result:

- all focused no-runtime tests pass;
- builds pass;
- Command Router fixture suite remains green;
- no Qwen runtime/cache/materialization acceptance is run;
- no helper process starts;
- Command Router product mode still reports `realQwenRuntimeEnabled: false`.

## Stop Conditions

Stop immediately and record a blocked/degraded result if:

- any command attempts to download, materialize, cache, or run Qwen artifacts;
- a helper starts;
- UI/IPC or product defaults change;
- any direct action bypasses Command Router gates;
- any raw prompt, model output, diagnostics, path, credential, token, vector, or
  benchmark would be persisted;
- allowlist expansion is introduced;
- browser, URL, shell, filesystem, clipboard, network, process, Memory vector,
  planner, telemetry, installer, packaging, or release behavior changes.

## Accepted Evidence Shape

Record only:

- approval status;
- focused test/build pass/fail summary;
- no-runtime confirmation;
- composition gate readiness classification;
- fallback behavior classification;
- Command Router default-off / real-Qwen-disabled classification;
- fixture suite pass/fail summary;
- false flags for runtime/cache/materialization/helper/network/raw evidence,
  direct action bypass, allowlist expansion, telemetry, packaging, and release
  changes.

Any implementation of product UI/IPC, real runtime binding, persistent cache,
expanded tester window, or actual Qwen product routing requires a fresh
exact-scope approval.
