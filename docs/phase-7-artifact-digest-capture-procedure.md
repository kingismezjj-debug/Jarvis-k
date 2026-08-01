# Phase 7 Artifact Digest Capture Procedure

Phase 7.4 defines the approval boundary for a future artifact SHA-256 capture
wave. This wave prepares the process for digest collection, but it does not
record real digest values, download artifacts through application code, install
runtime dependencies, or enable execution.

Target:

- Provider id: `embedding.local.qwen3`
- Model id: `Qwen/Qwen3-Embedding-0.6B`
- Source: Hugging Face model repository
- Selected revision:
  `97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3`

## Required Procedure Checks

- Revision approved: the immutable upstream revision has already been selected
  and approved.
- Required set confirmed: the Phase 7.3 required artifact set is complete.
- Digest method defined: SHA-256 tooling and command logging are defined before
  capture.
- Temporary workspace isolated: artifact inspection uses an isolated temporary
  workspace.
- Signed URLs absent: signed or secret-bearing URLs must not enter committed
  records.
- Credentials absent: credentials, tokens, API keys, and auth headers must not
  enter committed records.
- Cache paths sanitized: local cache and private machine paths are excluded
  from committed summaries.
- Network source read-only: upstream access is read-only and does not enable
  application download paths.
- Double verification defined: a second verification pass is required before
  any digest value can be recorded.
- Digest values deferred: real SHA-256 values remain out of this wave.
- Downloads disabled: application download paths stay disabled.
- Pinning disabled: artifact pin approval stays disabled until a later digest
  pinning wave.
- Execution disabled: local embedding execution stays disabled.
- Verification clean: boundary, sensitive-artifact, typecheck, and verify gates
  pass.

## Guard Output

The provider-local digest capture procedure can become `ready_for_approval`
only when the process is fully defined and still keeps:

- `downloadEnabled: false`
- `pinningEnabled: false`
- `executionEnabled: false`
- `digestValuesExposed: false`

The guard may expose the selected revision because Phase 7.1 approved it. It
must not expose artifact filenames, SHA-256 values, signed URLs, credentials,
tokens, local cache paths, model files, or benchmark data.

## Non-Goals

This wave does not introduce:

- Real SHA-256 digest values.
- Artifact pin approval records with digest values.
- File content, model files, tokenizer files, weights, or caches.
- Signed URLs, credentials, tokens, API keys, or auth headers.
- Runtime dependencies or dependency versions.
- Runtime registration or execution-provider composition.
- Local embedding execution or explicit execution enablement.
- Changes to Core, Desktop, UI, contracts, or capabilities dependency policy.

## Next Gate

The next low-coupling wave may record approved artifact digest values for the
required set. That wave must still keep application downloads disabled and must
pass sensitive-artifact checks after any digest values are introduced.
