# Phase 4 Completion

Phase 4 is complete as a local capability and model governance foundation. The
runtime can inspect local device capability, govern model manifests and
candidates, supervise dry-run install preparation, expose resource diagnostics,
report provider availability and configuration requirements, and preview
inference execution without invoking real providers.

Phase 4.5 is complete as an inference readiness and safety gate. It documents
the Phase 5 entry criteria and adds automated guards that block accidental real
runtime dependencies, model artifacts, local database files, and local
environment files from entering the default verification path.

## Completed Surfaces

- Device capability snapshot and runtime mode recommendation.
- Provider-neutral model manifests, model candidates, inventory, and candidate
  audit records.
- Installability policy for pinned revisions, SHA-256 digests, license risk,
  memory, and VRAM.
- File-system lifecycle skeleton with an injected artifact fetcher that remains
  unconfigured by default.
- Supervised model operation snapshots and dry-run install preparation.
- Resource scheduler leases and diagnostics.
- Runtime adapter discovery with no real adapters advertised by default.
- Capability-specific inference ports for embedding, OCR, intent routing, and
  reranking.
- Inference provider availability and configuration requirement reports.
- Inference execution preflight that explains capability, provider, model, and
  resource blockers before any provider is called.
- Boundary and sensitive-artifact guards included in `npm run verify`.

## Verification Baseline

The current Phase 4 completion gate is:

```powershell
npm run typecheck
npm run verify
npm run check:boundaries
npm run check:sensitive-artifacts
npm run smoke:desktop
npm run smoke:desktop:memory-degraded
```

Desktop smoke is required for changes that touch Core/Desktop startup, IPC, or
renderer bridge flows. Real Xunfei acceptance remains opt-in and is unrelated
to Phase 4 model governance.

## What Is Intentionally Not Enabled

- Real Hugging Face or CDN model downloads.
- Real local model loading or inference execution.
- Python, CUDA, ONNX Runtime, Paddle, CTranslate2, llama.cpp, transformers, or
  tokenizer runtime dependencies.
- User-facing execution controls for embedding, OCR, intent routing, reranking,
  STT model downloads, or model loading.
- Provider credentials, provider URLs, signed URLs, tokens, or secret-derived
  values in contracts, Core snapshots, UI state, docs, tests, or artifacts.

## Phase 5 Starts Here

Phase 5 should start with a deliberately scoped provider package or adapter
that satisfies the Phase 4.5 readiness gates before exposing execution. The
recommended first slice is a fixture-backed provider that reports availability
only under an explicit test flag, passes preflight for a fixture manifest, and
returns deterministic fixture output through a capability-specific command.

Any real provider/runtime integration must update boundary guards and
documentation in the same change that introduces the new dependency or
composition path.
