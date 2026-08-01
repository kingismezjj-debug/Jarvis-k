# Phase 12.1 Model Lifecycle and Windows Packaging Preflight

## Status

Complete as a provider-neutral, dry-run guard preparation wave.

## Scope

This wave records the safety boundary for Phase 12 model management,
Windows packaging, updates, and rollback without making a final product or
installer decision.

The preflight requires review evidence for:

- pinned model manifests;
- artifact digest verification;
- license and redistribution policy;
- sanitized model operation state; and
- a deterministic fixture executor.

It keeps Windows package policy, automatic update policy, and upgrade/rollback
policy explicitly deferred.

## Safety Boundary

The accepted status is only `ready_for_fixture_contract`. The guard keeps
committed model artifacts, signed URL persistence, installer bundling,
automatic updates, rollback execution, filesystem writes, network access,
credentials, model loading, provider registration, default opt-in, and
private path exposure disabled.

This wave does not:

- build an installer;
- bundle a runtime or model;
- write a model cache;
- download or verify an artifact;
- install, update, uninstall, or roll back software;
- change `apps/core-host`;
- change Desktop IPC;
- change UI behavior; or
- choose the final Windows packaging or update product policy.

## Verification

Run:

```powershell
npm.cmd run build -w @jarvis-k/capabilities
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke is not required because this wave changes no Core Host
composition, Desktop IPC, startup supervision, provider visibility, or UI
behavior.

## Next Hard Pause

Do not create an installer, add auto-update or rollback execution, write a
model cache, access model artifacts, add filesystem/network lifecycle code, or
make the final Windows packaging policy decision without explicit product,
security, and release approval.
