# Jarvis-K Handoff

This handoff is for a brand-new conversation with no prior context.

## Repository State

- Repository: `C:\Users\Administrator\Documents\Jarvis-k`
- Branch: `main`
- Current HEAD: `e4ace92 feat: add bounded tester expansion execution runner`
- Remote: `origin/main`
- Current working tree before this handoff file was created: clean and aligned
  with `origin/main`.
- Latest confirmed CI for HEAD `e4ace92`: GitHub Actions `CI` completed with
  `success`.

## What We Are Doing

Jarvis-K is an Electron, React, TypeScript desktop agent runtime. The current
long-running work is moving local embedding and Memory retrieval from guarded
developer-alpha diagnostics toward controlled developer-alpha usage, while
preserving strict approval gates.

The project is being advanced one small phase at a time. Each phase must be:

- scoped narrowly;
- reversible;
- documented;
- locally verified;
- boundary checked;
- sensitive-artifact checked;
- committed and pushed independently;
- confirmed green in GitHub Actions before moving on.

The current work area is Phase 8 Memory retrieval using provider-backed vectors,
building on Phase 7 local embedding runtime/provider execution.

## Major Completed Capabilities

The project already has:

- Electron desktop host and React renderer baseline.
- Context-isolated preload bridge and validated command IPC.
- Core Host child process supervision.
- Provider-neutral Core runtime.
- Voice Engine baseline and Xunfei RTASR adapter.
- Encrypted local voice settings.
- SQLite Memory persistence.
- Device capability inspection.
- Model governance ports, manifests, resource leases, installability planning,
  and dry-run lifecycle guards.
- Fixture inference providers for regression coverage.
- Dedicated local embedding provider package boundaries.
- Dedicated Python Transformers runtime package with supervised child-process
  JSONL protocol.
- Approved pinned artifact plan for `Qwen/Qwen3-Embedding-0.6B`.
- Temporary artifact benchmark and runtime diagnostic evidence from earlier
  approved phases.
- Explicit opt-in local embedding provider composition in `apps/core-host`.
- Explicit opt-in provider execution wiring.
- Provider-backed query vectors and provider-backed Memory vector writes/reads
  behind env gates.
- One-shot and continuous developer-alpha Memory retrieval diagnostic runners.
- Developer-alpha runbooks, rollback checklists, promotion gates, and bounded
  tester expansion approval packet.

## Current Completed Phase

Phase 8.37 is complete as an implementation wave.

Latest commit:

```text
e4ace92 feat: add bounded tester expansion execution runner
```

Phase 8.37 added:

- `apps/core-host/src/memory-provider-vector-retrieval-bounded-tester-expansion-execution-run.ts`
- `apps/core-host/test/memory-provider-vector-retrieval-bounded-tester-expansion-execution-run.test.ts`
- `tests/memory-provider-vector-retrieval-bounded-tester-expansion.mjs`
- `docs/phase-8-37-bounded-tester-expansion-execution-run.md`
- npm script:
  `usage:memory-retrieval:bounded-tester-expansion`

The Phase 8.37 runner:

- requires Phase 8.36 preflight evidence;
- requires product, security, and release approval flags;
- allows at most 3 tester windows;
- allows at most 5 minimized synthetic or explicitly consented messages per
  tester;
- documents a 2 hour review window;
- delegates to the existing Phase 8.31 continuous developer-alpha session only
  when approved env/runtime/model/database configuration is present;
- stops before later tester windows after the first blocked or degraded tester
  session;
- emits only sanitized aggregate evidence;
- does not expose tester IDs, raw messages, raw vectors, raw text, raw helper
  diagnostics, artifact paths, Python paths, private paths, signed URLs,
  credentials, or raw Memory records.

## Verification Already Completed

For Phase 8.37, the following passed locally:

```powershell
npm.cmd run build:core-host
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-bounded-tester-expansion-execution-run.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:memory-degraded
npm.cmd run smoke:desktop:memory-retrieval-env-wiring
npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

`npm.cmd run verify` passed with:

```text
133 test files passed
699 tests passed
```

GitHub Actions:

- Workflow: `CI`
- Commit: `e4ace9218501c8d98f4c58e0f624c9eb16ab27a6`
- Result: `success`
- URL: `https://github.com/kingismezjj-debug/Jarvis-k/actions/runs/30968304318`

## Current Block / Pause Point

Do not claim that the real bounded tester expansion operator run has happened.
It has not.

The implementation is complete and CI-green, but the real Phase 8.37 product
path was not started because the current shell did not have the required
approved env chain configured:

- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA`
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING`
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR`
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES`
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS`
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER`
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION`
- `JARVIS_K_RUNTIME_PYTHON`
- `JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR`
- `JARVIS_K_MEMORY_DB_PATH`

The next actual work must pause for operator configuration or separate approval.

## Next Plan

Recommended next step:

1. Ask the user whether they want to run the real Phase 8.37 bounded tester
   expansion operator session now.
2. If yes, require a fresh explicit run approval or confirm the existing
   Phase 8.37 approval still applies to this exact run window.
3. Configure only approved local values:
   - approved Python Transformers runtime path;
   - approved local model artifact directory;
   - explicit test-window Memory DB path;
   - full env gate chain.
4. Run:

```powershell
npm.cmd run usage:memory-retrieval:bounded-tester-expansion
```

5. Accept only sanitized output.
6. Verify exact-source rollback and cleanup.
7. Update docs with the actual run evidence.
8. Run:

```powershell
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

9. Run relevant desktop smokes if Core Host/Desktop/IPC/provider visibility/UI
   surfaces were touched.
10. Commit, push `origin/main`, and wait for CI success before any next phase.

If the user does not want to run the real Phase 8.37 operator session yet, the
next safe preparation phase should be documentation/preflight only. Do not
expand tester scope or introduce new runtime behavior without separate product,
security, and release approval.

## Hard Constraints

Never modify:

- `E:\bailongma`
- `C:\Users\Administrator\Jarvis-ui`

Never write, print, persist, or commit:

- API keys;
- credentials;
- tokens;
- signed URLs;
- private paths;
- real model files;
- model caches;
- raw vectors;
- raw tester text;
- raw helper diagnostics.

Do not add Python, CUDA, ONNX, Paddle, Transformers, llama.cpp, or native
runtime dependencies to:

- contracts;
- capabilities;
- Core;
- Desktop;
- UI.

Concrete runtime/provider composition belongs only in:

- dedicated runtime/provider packages;
- `apps/core-host` as the only concrete composition root.

Core must stay provider-neutral through injected ports. UI must only consume
DTOs, send intents, and show sanitized state. Fixture providers must remain as
fallback and regression paths.

Never route model or retrieval output into unvalidated PowerShell, Windows, or
shell operations.

## Approval Gates Not To Cross Automatically

Pause and ask before:

- real artifact download or materialization;
- persistent model cache writes;
- reading or using a real local model artifact path unless explicitly approved
  for the run;
- starting/loading/embedding with the helper outside an approved diagnostic or
  usage run;
- returning or persisting raw vectors;
- Memory schema/index migration;
- real Windows tool execution or permission-policy changes;
- real STT/TTS/OCR/vision provider work;
- installer, update, uninstall, or rollback policy decisions;
- changing default opt-in, UI visibility, provider visibility, Desktop IPC, or
  release behavior.

## Mistakes / Pitfalls To Avoid

- Do not confuse implementation evidence with a real operator run. Phase 8.37
  implementation is done; the real bounded tester session is not.
- Do not use placeholder paths like `<approved-python-executable>` or
  `<approved-local-artifact-directory>` in PowerShell. They cause invalid path
  errors. Use real approved paths only, and avoid printing private paths in
  logs or docs.
- Do not ask the user to run a multi-line PowerShell object literal unless it
  is formatted carefully. Earlier attempts caused broken prompts because
  partial snippets were pasted line by line.
- Do not use `New-Item -LiteralPath` if the user's PowerShell version rejects
  that parameter. Prefer safer compatible forms or explain the exact shell
  requirement.
- Do not install or create a Python Transformers environment without explicit
  safety approval.
- Do not download or materialize model artifacts without explicit approval for
  that exact run.
- Do not print model artifact directories, private local paths, signed URLs, or
  raw diagnostics in final reports.
- Do not proceed to the next phase just because local tests pass. Each stable
  wave must be committed, pushed, and CI-green first.
- Do not let a bounded tester run continue after a blocked or degraded tester
  session. Phase 8.37 intentionally stops before later tester windows.

## Useful Files

- `README.md`
- `docs/architecture.md`
- `docs/phase-7-progress.md`
- `docs/phase-8-37-bounded-tester-expansion-execution-run.md`
- `apps/core-host/src/memory-provider-vector-retrieval-bounded-tester-expansion-execution-run.ts`
- `apps/core-host/test/memory-provider-vector-retrieval-bounded-tester-expansion-execution-run.test.ts`
- `tests/memory-provider-vector-retrieval-bounded-tester-expansion.mjs`
- `package.json`

## First Commands For The Next Conversation

Start by reading:

```powershell
Get-Content docs/phase-7-progress.md -Tail 180
Get-Content docs/phase-8-37-bounded-tester-expansion-execution-run.md
Get-Content docs/architecture.md -Tail 120
Get-Content README.md -TotalCount 320
git status --short --branch
git log -3 --oneline --decorate
```

Then decide whether the user wants a real Phase 8.37 operator run or a new
preflight/documentation-only phase.
