# Qwen3-0.6B Fast Router Runtime/Cache Approval

Recorded: 2026-08-06

This document records the exact one-window Product, Security, and Release
approval for Qwen3-0.6B Fast Router real runtime/cache acceptance.

## Approval

Product:

> APPROVE exactly this one-window Qwen3-0.6B Fast Router real runtime/cache acceptance scope

Security:

> APPROVE exactly this temporary Qwen3-0.6B artifact/cache/runtime/helper scope

Release:

> APPROVE developer-alpha Qwen3-0.6B Fast Router runtime evidence only; no installer/update/default/UI/IPC/telemetry/release-channel changes

## Authorized Window

The approved window is limited to:

- Qwen3-0.6B as a local Fast Router for intent classification only.
- Temporary artifact/cache/runtime/helper use.
- Digest verification before runtime-ready state.
- Structured `IntentRoutingResult` output only.
- Sanitized developer-alpha evidence only.
- Cleanup of temporary runtime/cache materialization after the one-window run.

## Explicit Non-Scope

This approval does not authorize:

- default Qwen enablement;
- automatic model download;
- unpinned or unverified artifact use;
- persistent cache promotion;
- background model residency;
- shell, file, installer, updater, telemetry, UI/IPC, or release-channel changes;
- cloud fallback planner work;
- broad multi-step agent execution.

## Current Disposition

Status: `passed_developer_alpha_third_rerun`

Reason:

- `Qwen/Qwen3-0.6B` now has an approved seven-file SHA-256 artifact pin set
  for revision `c1899de289a04d12100db370d81485cdf75e47ca`.
- One approved temporary materialization and bounded generation helper runtime
  window was run.
- Artifact materialization, digest verification, helper readiness, generation
  port wiring, model artifact access, and cleanup passed.
- A second approved minimal runtime rerun with the offline-tuned prompt,
  decoder, and parser was run.
- The second rerun still degraded: two intents matched at low confidence, one
  local-app request misrouted to browser, and the blocked-action sample failed
  JSON/router compliance.
- Offline deterministic confidence calibration, local-app-vs-browser
  disambiguation, and blocked-action fail-closed post-processing were added
  without running the model.
- A third approved minimal runtime rerun was run against the same fixed prompt
  window and passed all four sanitized routing samples.

This passed developer-alpha evidence supports Qwen Fast Router alpha closeout,
but it does not authorize default enablement, persistent cache promotion,
UI/IPC changes, action execution, installer/update behavior, telemetry,
release-channel changes, or production readiness.

## Runner

Command:

```text
npm run acceptance:qwen-fast-router:runtime-cache
```

Required gated inputs:

```text
JARVIS_K_QWEN_FAST_ROUTER_RUNTIME_CACHE_APPROVED=1
JARVIS_K_QWEN_ROUTER_ARTIFACT_PLAN=<path-to-approved-local-artifact-plan.json>
JARVIS_K_QWEN_ROUTER_GENERATION_HELPER_READY=1
```

Artifact plan shape:

```json
{
  "modelId": "Qwen/Qwen3-0.6B",
  "artifacts": [
    {
      "key": "config.json",
      "sourcePath": "C:/approved/source/config.json",
      "sha256": "64 lowercase hex characters"
    }
  ]
}
```

The runner materializes only local `sourcePath` artifacts into a unique system
temporary directory, verifies SHA-256 before use, and cleans up that directory
after the window.

## Next Required Work

Before any product integration beyond this developer-alpha evidence:

1. Keep Qwen Fast Router default-off and unavailable from normal startup.
2. Decide whether to close the Qwen Fast Router runtime/cache alpha.
3. Define the next product integration scope separately, including lifecycle
   cache policy, Core Host selection policy, fallback behavior, UI/IPC evidence
   surface, and rollback behavior.
4. Obtain fresh exact-scope Product/Security/Release approval before any
   default, persistent cache, UI/IPC, action execution, release, or production
   readiness change.

## Offline Router Contract Tuning

Completed after the degraded runtime window, without downloading artifacts,
materializing model files, launching the helper, or rerunning Qwen.

- Prompt now asks for exactly one compact JSON object, disables visible
  thinking with `/no_think`, and includes direct intent hints for the minimal
  router domain.
- Helper generation encoding now prefers the Qwen tokenizer chat template with
  `enable_thinking=false` when supported, then falls back to plain tokenization.
- JSON extraction now scans balanced JSON object/array candidates instead of
  slicing from the first `{` to the last `}`.
- Parser now strips `<think>...</think>`, accepts fenced output, array output,
  intent aliases, string confidence values, and common slot-key aliases.
- Sanitization still rejects unsafe slots, unsupported intents, path-like
  values, credential-like values, and malformed output.
- Router post-processing now applies deterministic confidence calibration for
  strong browser, local application, and diagnostic-status utterances.
- Router post-processing now corrects obvious local application requests when
  the small model decodes them as `browser.open`; for example, a WeChat app
  launch request is normalized to `localApp.open` with an `appName` slot.
- Blocked-action compliance now fails closed from the original utterance: if
  Qwen emits malformed output for a destructive or high-impact action, the
  provider returns sanitized `blocked` JSON when allowed, or `clarify` when
  `blocked` is outside the approved allowlist.
- Destructive parsed candidates are overridden with sanitized fail-closed JSON,
  so unsafe slots, paths, commands, and model reasons are not propagated.

This tuning does not authorize another real runtime attempt. A fresh
Product/Security/Release approval is still required before any third rerun.

## Second Minimal Rerun

Completed after fresh approval, using the offline-tuned prompt/decoder/parser
and the same fixed minimal prompt window.

- artifact materialization: `passed`;
- SHA-256 digest verification: `passed`;
- helper readiness: `passed`;
- generation port wiring: `passed`;
- cleanup: `passed`;
- routing result: `degraded`;
- `browser.open`: intent matched, confidence band low;
- `localApp.open`: misrouted to `browser.open`, confidence band low;
- `observability.status`: intent matched, confidence band low; and
- `blocked`: `ROUTER_OUTPUT_INVALID`.

No raw prompt, raw generated text, helper diagnostics, temp path, signed URL,
credential, stack trace, benchmark output, model internal, logits, vector, or
user-private data was recorded.

## Third Minimal Rerun

Completed after fresh approval, using the offline-tuned confidence
calibration, local-app-vs-browser disambiguation, blocked-action fail-closed
post-processing, and the same fixed minimal prompt window.

- artifact materialization: `passed`;
- SHA-256 digest verification: `passed`;
- helper readiness: `passed`;
- generation port wiring: `passed`;
- cleanup: `passed`;
- routing result: `passed`;
- `browser.open`: passed with accepted confidence;
- `localApp.open`: passed with accepted confidence;
- `observability.status`: passed with accepted confidence; and
- `blocked`: passed with accepted confidence.

No raw prompt, raw generated text, helper diagnostics, temp path, signed URL,
credential, stack trace, benchmark output, model internal, logits, vector, or
user-private data was recorded.
