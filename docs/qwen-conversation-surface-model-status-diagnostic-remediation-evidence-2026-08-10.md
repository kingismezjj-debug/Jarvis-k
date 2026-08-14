# Qwen Conversation Surface Model Status Diagnostic/Remediation Evidence

Recorded: 2026-08-10

## Status

`CLOSED_PASSED_MODEL_STATUS_DIAGNOSTIC_REMEDIATION_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Related approval request:

```text
docs/qwen-conversation-surface-model-status-diagnostic-remediation-approval-request-2026-08-10.md
```

## Approval Capture

```text
Product approval: captured 2026-08-10
Security approval: captured 2026-08-10
Release approval: captured 2026-08-10
```

## Diagnostic Result

Only sanitized developer-alpha evidence may be recorded.

```text
diagnostic target: fifth-route model.status latest-result timeout
source review completed: true
focused no-helper tests completed: true
remediation needed: true
remediation type: Qwen deterministic route calibration specificity
root cause classification: generic status calibration matched before model.status-specific calibration existed
route assertion remediation needed: false
helper started: false
generation-port invoked: false
main-conversation runtime route request sent: false
bounded usage rerun attempted: false
route-count extension changed: false
allowlist changed: false
default-on Qwen routing: false
persistent Qwen routing: false
release behavior changed: false
```

The source review found that `check model status` contains the generic `status`
token and Qwen deterministic calibration did not have a more specific
`model.status` rule before the generic observability status rule.

## Remediation

```text
packages/inference-adapter-qwen-router/src/provider.ts:
  added MODEL_STATUS_PATTERN
  evaluates model.status-specific calibration before generic observability.status calibration
  keeps browser/local-app safety calibration order unchanged

packages/inference-adapter-qwen-router/test/provider.test.ts:
  added no-helper regression coverage for "check model status"
  verifies model.status wins even when Qwen output decodes as generic observability.status
```

## Verification

```text
npx.cmd vitest run packages/inference-adapter-qwen-router/test/provider.test.ts packages/core/test/runtime.test.ts --testNamePattern "model status|fast-router candidates|observability routing": PASS
npx.cmd vitest run apps/desktop/test/command-router-product-mode-source.test.ts apps/ui/test/app-voice-ui-source.test.ts: PASS
npm.cmd run build:core: PASS
npm.cmd run build:contracts: PASS
npx.cmd vitest run packages/inference-adapter-qwen-router/test/provider.test.ts: PASS
node --check tests/qwen-conversation-surface-bounded-local-usage.mjs: PASS
helper cleanup check: NO_HELPER_PROCESS_OBSERVED
```

Focused no-helper verification passed with 4 selected route/core tests, 30
desktop/UI source tests, and the full Qwen provider test file with 12 tests.

## Boundary Verification

```text
Qwen helper startup: false
generation-port invocation: false
main-conversation runtime route request: false
bounded local usage rerun: false
route-count extension: false
allowlist expansion: false
provider planner used: false
Memory write/vector retrieval used: false
default-on behavior changed: false
persistent product routing changed: false
release behavior changed: false
```
