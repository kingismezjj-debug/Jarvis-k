# Phase 7.13-7.17 Automation Project

Created on 2026-08-01 for the Jarvis-K local embedding developer-alpha path.

## Automation

- Automation name: `Jarvis-K Phase 7.13-7.17 自动推进`.
- Automation id: `jarvis-k-phase-7-13-7-17`.
- Mode: current-thread heartbeat.
- Interval: 30 seconds.
- Scope: continue Phase 7.13 through Phase 7.17 in narrow, low-coupling waves.

## Save Rule

The automation must save this Markdown project file with the latest complete
handoff state when either condition happens:

- Codex usable context/budget drops to approximately 15% or lower; finish the
  current safe subtask, do not start a new wave, then update this file.
- Phase 7.13 through Phase 7.17 completes while more than 15% remains; update
  this file as the complete project record.

The saved handoff must include completed waves, current commit and CI status,
remaining work, next step, hard constraints, verification commands, and resume
instructions.

## Hard Constraints

- Do not modify `E:/bailongma`.
- Do not modify `C:/Users/Administrator/Jarvis-ui`.
- Do not write, print, stage, or commit credentials, API keys, tokens, signed
  URLs, real model files, or model caches.
- Do not add Python, CUDA, ONNX, Paddle, Transformers, llama.cpp, or other
  runtime dependencies to Core, Desktop, UI, contracts, or capabilities.
- Core must not depend on SQLite, Electron, React, `ws`, concrete providers, or
  concrete model runtimes.
- UI must consume DTOs and send intents only.
- Desktop must stay limited to IPC, security, `safeStorage`, supervision, and
  process boundaries.
- Concrete providers and runtime composition belong only in provider packages
  and `apps/core-host`.
- Model output must never become unvalidated PowerShell or Windows actions.
- Every stable wave must update docs, run verification, commit, push, and
  confirm CI.

## Current Baseline

- Latest completed wave: Phase 7.17 Controlled Artifact Download and SHA-256
  Verification Guard.
- Latest committed baseline before this automation project:
  `c93272c docs: add phase 7 automation project`.
- Latest pre-automation CI: success, run `30696188875`.
- Local verification baseline after Phase 7.17: `npm.cmd run verify` passed
  with 65 test files and 330 tests.
- Local embedding provider status: planned only, unregistered, uncomposed, and
  execution disabled.
- No installer, runtime package, runtime dependency, model download, model
  cache, provider registration, benchmark metric value, or local embedding
  execution exists yet. The dedicated runtime package exists only as a fake
  fail-closed scaffold with dry-run cache/download planning and controlled
  download verification guards.

## Phase 7.13: Dedicated Runtime Package Preflight

Status: complete.

Goal: approve the dedicated runtime package boundary before creating real
runtime behavior.

Planned work:

- Define the future package boundary for
  `@jarvis-k/inference-runtime-transformers-local`.
- Confirm package location: `packages/inference-runtime-transformers-local`.
- Define the adapter-only public surface.
- Define allowed imports and forbidden imports.
- Keep runtime dependencies absent.
- Add provider-local approval record and tests.
- Update Phase 7 progress docs.

Exit criteria:

- Runtime package preflight is represented by an explicit approval record.
- Approval fails closed by default.
- Approved record does not introduce runtime dependencies, downloads, or
  execution.
- `npm.cmd run verify` passes.
- Commit, push, and CI succeed.

## Phase 7.14: Runtime Dependency Approval and Selection Guard

Status: complete.

Goal: choose and approve the runtime dependency strategy before adding any
dependency.

Planned work:

- Compare feasible runtime paths, such as Python child process, Transformers.js,
  ONNX Runtime, or another approved route.
- Record license, redistribution, native dependency, Windows packaging, cold
  start, memory, and operational risk.
- Produce an approved dependency strategy with explicit allowlist and denylist.
- Keep dependencies absent unless a later implementation wave explicitly adds
  them.

Exit criteria:

- Selected runtime strategy is explicit and reviewable.
- Dependency approval rejects unknown, unlicensed, or wrong-package
  dependencies.
- Protected packages remain clean.
- Verification, commit, push, and CI succeed.

## Phase 7.15: Runtime Package Scaffold with Fake Runtime

Status: complete.

Goal: create the dedicated runtime package without loading or executing a real
model.

Planned work:

- Scaffold `packages/inference-runtime-transformers-local`.
- Add package manifest, TypeScript config, and adapter-only exports.
- Implement a fake or unavailable runtime that fails closed.
- Add child-process protocol types if needed, but keep execution disabled.
- Wire build/test scripts without broadening Core dependencies.

Exit criteria:

- Package builds and tests independently.
- No real runtime dependency is introduced unless already approved.
- No model artifact is downloaded or cached.
- Core still depends only on provider-neutral ports.
- Verification, commit, push, and CI succeed.

## Phase 7.16: Artifact Cache and Download Manager Dry-Run

Status: complete.

Goal: define artifact cache/download lifecycle without performing default real
downloads.

Planned work:

- Define cache state machine: pending, downloading, verifying, ready,
  corrupted, cleanup, and rollback.
- Define user-cache namespace policy.
- Define SHA-256 verification before activation.
- Define partial download cleanup.
- Define signed URL and credential exclusion.
- Add dry-run tests.

Exit criteria:

- Dry-run download manager cannot persist signed URLs.
- Cache paths and model artifacts are not committed.
- Verification and cleanup policies are test-covered.
- Default runtime remains disabled.
- Verification, commit, push, and CI succeed.

## Phase 7.17: Controlled Artifact Download and SHA-256 Verification Guard

Status: complete.

Goal: perform only an explicitly controlled artifact download/verification
path after all prior gates pass.

Planned work:

- Use the already approved immutable revision and artifact SHA-256 pins.
- Download only under explicit developer command or controlled test path.
- Store artifacts outside the repository in the approved cache area.
- Verify SHA-256 before ready state.
- Clean partial artifacts after failed verification.
- Do not persist signed URLs, tokens, credentials, or private local paths.

Exit criteria:

- Controlled download/verify guard path passes.
- Repository remains free of model files and cache.
- Sensitive artifact guard passes.
- Runtime execution still requires a later explicit enablement wave.
- Verification, commit, push, and CI succeed.

Completed result:

- Added a guard policy and evaluator to
  `@jarvis-k/inference-runtime-transformers-local`.
- `prepare_download` is accepted only from `pending` with safe artifact key,
  HTTPS unsigned source URL, lowercase SHA-256 expected digest, all required
  approvals, and no requested side effects.
- `verify_download` is accepted only from `verifying` with matching observed
  lowercase SHA-256 digest and the same approval/no-side-effect requirements.
- The result never exposes source URLs or digest values.
- Real network access, filesystem writes, download execution, cache mutation,
  model artifact reads, signed URL persistence, credential persistence, source
  URL exposure, digest value exposure, runtime execution, and provider
  composition remain disabled.

## Verification Commands

Run at every stable wave:

```powershell
npm.cmd run verify
```

Run targeted checks as needed:

```powershell
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run test -- --run <targeted-test-files>
```

Run desktop smoke only when Desktop, IPC, UI, provider visibility, or startup
behavior changes:

```powershell
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:memory-degraded
npm.cmd run smoke:desktop:fixture-inference
```

## Resume Instructions

To resume safely:

1. Read this file.
2. Read `docs/phase-7-progress.md`.
3. Check `git status --short --branch`.
4. Continue from the first incomplete phase in the 7.13-7.17 sequence.
5. Keep each wave small, documented, verified, committed, pushed, and CI-green.

## Current Status

- Automation created.
- Phase 7.13 is complete.
- Phase 7.14 is complete.
- Phase 7.15 is complete.
- Phase 7.16 is complete.
- Phase 7.17 is complete.
- Phase 7.13 through Phase 7.17 automation scope is complete.
- Next action: pause this automation and wait for user confirmation before
  starting the next Phase 7 stage.

## Final Handoff Snapshot

Saved after Phase 7.17 implementation verification on 2026-08-01.

- Phase 7.13 commit: `5bb6a86`, CI success run `30696508562`.
- Phase 7.14 commit: `270d550`, CI success run `30696775543`.
- Phase 7.15 commit: `1f0dccd`, CI success run `30697133199`.
- Phase 7.16 commit: `6ec7819`, CI success run `30697515393`.
- Phase 7.17 implementation commit: `0a2e0b8`, CI success run
  `30697925253`.
- Latest local verification before this final handoff save:
  `npm.cmd run verify` passed with 65 test files and 330 tests.
- Current automation-scope remaining work: none.
- Next broader Phase 7 work, only after user confirmation: tokenizer/config
  runtime integration review, dedicated runtime package registration and
  composition review, runtime dependency implementation planning, benchmark
  capture approval, and later explicit runtime enablement.
- Resume safely from `main`, read this file and `docs/phase-7-progress.md`,
  confirm `git status --short --branch` is clean, and do not start real
  download/runtime execution without a new explicit user-approved phase.
