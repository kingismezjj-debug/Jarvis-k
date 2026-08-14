# Qwen3-0.6B Exact Artifact Digest Pinning Approval Request

Recorded: 2026-08-06

## Status

`APPROVED_DIGEST_PINNING_CAPTURED`

This document requests a separate approval for exact artifact digest pinning
for the Qwen3-0.6B Fast Router candidate. It does not approve runtime
execution, helper generation, persistent cache promotion, UI behavior, default
enablement, installer behavior, or release behavior.

## Context

Jarvis-K now has a default-off Qwen Fast Router adapter and a bounded
generation-helper protocol surface. The real runtime acceptance remains
blocked because the model artifact set is not yet pinned to an immutable
revision with approved SHA-256 digests.

Current upstream observation, captured through read-only Hugging Face metadata
inspection and `git ls-remote`:

- Model id: `Qwen/Qwen3-0.6B`
- Source: `https://huggingface.co/Qwen/Qwen3-0.6B`
- Observed `main` revision:
  `c1899de289a04d12100db370d81485cdf75e47ca`
- License metadata: `apache-2.0`
- Pipeline metadata: `text-generation`
- Repository gated status: `false`

## Exact Approval Requested

Approve one local, single-operator, read-only artifact digest pinning window
for the Qwen3-0.6B Fast Router required artifact set at exactly this immutable
revision:

`c1899de289a04d12100db370d81485cdf75e47ca`

The approved window may only:

- inspect the fixed upstream revision above;
- use a unique system-temporary directory for any artifact content needed for
  hashing;
- capture SHA-256 digests for the required artifact set below;
- use Hugging Face LFS SHA-256 metadata for LFS-backed artifacts when present;
- materialize small text/config/tokenizer artifacts only inside the temporary
  directory when direct hashing is required;
- double-check captured digests with an independent local SHA-256 method;
- update provider-local Qwen pin records after all required files have exact
  lowercase 64-character SHA-256 values; and
- record sanitized developer-alpha evidence.

The approved window must not load, execute, benchmark, generate with, cache
for reuse, or register Qwen as an available provider.

## Required Artifact Set

The required runtime pin set is limited to these seven files:

| Artifact | Role | Current upstream note |
| --- | --- | --- |
| `config.json` | `model_config` | Small config artifact; SHA-256 capture pending approval |
| `generation_config.json` | `generation_config` | Small config artifact; SHA-256 capture pending approval |
| `tokenizer_config.json` | `tokenizer_config` | Small tokenizer config; SHA-256 capture pending approval |
| `tokenizer.json` | `tokenizer_vocabulary` | LFS-backed tokenizer artifact; SHA-256 capture pending approval |
| `merges.txt` | `tokenizer_merges` | Tokenizer merge artifact; SHA-256 capture pending approval |
| `vocab.json` | `tokenizer_vocabulary` | Tokenizer vocabulary artifact; SHA-256 capture pending approval |
| `model.safetensors` | `model_weights` | Single safetensors weight artifact; SHA-256 capture pending approval |

The following files are explicitly out of the runtime pin set for this window:

- `.gitattributes`
- `LICENSE`
- `README.md`
- any sharded `model-0000*.safetensors` file
- `model.safetensors.index.json`
- any file not listed in the required artifact set above

If upstream metadata changes before approval or before capture, the window
must stop and a fresh request is required.

## Required Safety Invariants

- Application download paths remain disabled.
- Runtime helper generation remains disabled.
- Core Host must not instantiate `QwenFastRouterProvider` with a real runtime
  generation port.
- No persistent Hugging Face cache, model cache, installer directory, update
  directory, release channel, or user-facing default may be written.
- All temporary writes must resolve below a unique system-temporary root.
- No credential, token, signed URL, private path, raw helper diagnostic, model
  output, or benchmark output may be committed.
- Digest values may be committed only after all required artifacts have passed
  the approved capture procedure.
- A missing artifact, revision mismatch, digest mismatch, redirect ambiguity,
  signed URL leakage, temp-root containment failure, cleanup failure, or
  sensitive-output detection blocks the window.

## Explicitly Not Authorized

This request does not authorize:

- automatic model download through Jarvis-K product/runtime code;
- Qwen model load, generation, routing, benchmark, or helper execution;
- persistent cache reuse;
- cloud fallback planner behavior;
- Memory read/write/retrieval behavior;
- tool execution, OS execution, shell execution, or browser/app actions based
  on model output;
- UI/IPC enablement, default configuration, user-facing controls, or tester
  expansion; or
- installer, update, packaging, telemetry, release-channel, or production
  behavior.

## Stop Conditions

Stop immediately and do not record approved pins if any of these occur:

- Product, Security, or Release approval is missing for this exact scope;
- the upstream revision is not
  `c1899de289a04d12100db370d81485cdf75e47ca`;
- the required artifact set differs from the seven files above;
- any required artifact cannot produce a lowercase 64-character SHA-256 digest;
- independent digest verification disagrees;
- a write escapes the unique system-temporary root;
- a persistent cache environment or location is detected;
- a signed URL, credential, token, private path, raw model content, or raw
  helper diagnostic would enter committed evidence; or
- cleanup is incomplete or uncertain.

## Sanitized Evidence Contract

Post-window evidence may contain only:

- scope identifier and status;
- model id and immutable revision;
- required artifact names, roles, sizes, and approved SHA-256 digests;
- digest capture method classification such as `hf_lfs_metadata` or
  `temp_file_double_hash`;
- counts for required, captured, verified, excluded, and cleaned-up artifacts;
- fixed reason codes; and
- cleanup status.

Post-window evidence must not contain:

- signed URLs;
- Authorization headers;
- access tokens or credentials;
- local private paths;
- raw model content;
- raw tokenizer/config content;
- helper stdout/stderr;
- benchmark output; or
- model-generated text.

## Role Requests

**Product.** Approve exactly this Qwen3-0.6B Fast Router artifact digest
pinning window for the seven-file required set at revision
`c1899de289a04d12100db370d81485cdf75e47ca`, with no runtime routing,
generation, user-facing behavior, tester expansion, product SLO, or default
change.

**Security.** Approve exactly this read-only upstream metadata and temporary
artifact digest capture scope. Require immutable revision matching,
seven-file required-set matching, system-temporary containment, SHA-256
double verification, no credentials or signed URLs in evidence, no persistent
cache, fail-closed stop behavior, and verified cleanup.

**Release.** Approve developer-alpha artifact pinning evidence only. Exclude
runtime/cache acceptance, helper generation, installer packaging, update
behavior, default configuration, UI/IPC behavior, telemetry, release-channel
exposure, and production readiness.

## Approval Lines To Provide

```text
Product: APPROVE exactly this Qwen3-0.6B Fast Router exact artifact digest pinning scope
Security: APPROVE exactly this read-only revision-pinned temporary artifact digest capture scope
Release: APPROVE developer-alpha artifact pinning evidence only; no runtime/cache/default/UI/IPC/telemetry/release changes
```

## Approval Record

The following explicit approvals were received on 2026-08-06 in the current
task:

| Role | Status | Approval evidence |
| --- | --- | --- |
| Product | APPROVED | Exactly this Qwen3-0.6B Fast Router exact artifact digest pinning scope |
| Security | APPROVED | Exactly this read-only revision-pinned temporary artifact digest capture scope |
| Release | APPROVED | Developer-alpha artifact pinning evidence only; no runtime/cache/default/UI/IPC/telemetry/release changes |

## Digest Capture Evidence

The one approved digest pinning window completed with `status=passed`.

- model id: `Qwen/Qwen3-0.6B`;
- immutable revision:
  `c1899de289a04d12100db370d81485cdf75e47ca`;
- required artifacts: `7`;
- captured artifacts: `7`;
- temporary cleanup: `passed`;
- application downloads enabled: `false`;
- runtime helper generation enabled: `false`;
- provider availability changed: `false`;
- default behavior changed: `false`; and
- release behavior changed: `false`.

| Artifact | Role | Size | Capture method | SHA-256 |
| --- | --- | ---: | --- | --- |
| `config.json` | `model_config` | `726` | `temp_file_double_hash` | `660db3b73d788119c04535e48cf9be5f55bc3100841a718637ae695b442f27dd` |
| `generation_config.json` | `generation_config` | `239` | `temp_file_double_hash` | `2325da0f15bb848e018c5ae071b7943332e9f871d6b60e2ed22ca97d4cb993d2` |
| `tokenizer_config.json` | `tokenizer_config` | `9732` | `temp_file_double_hash` | `d5d09f07b48c3086c508b30d1c9114bd1189145b74e982a265350c923acd8101` |
| `tokenizer.json` | `tokenizer_vocabulary` | `11422654` | `temp_file_double_hash` | `aeb13307a71acd8fe81861d94ad54ab689df773318809eed3cbe794b4492dae4` |
| `merges.txt` | `tokenizer_merges` | `1671853` | `temp_file_double_hash` | `8831e4f1a044471340f7c0a83d7bd71306a5b867e95fd870f74d0c5308a904d5` |
| `vocab.json` | `tokenizer_vocabulary` | `2776833` | `temp_file_double_hash` | `ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910` |
| `model.safetensors` | `model_weights` | `1503300328` | `hf_lfs_metadata` | `f47f71177f32bcd101b7573ec9171e6a57f4f4d31148d38e382306f42996874b` |

## Next Step After Approval

The approved SHA-256 set is now recorded in the provider-local Qwen artifact
plan. The next work item is not another pinning wave; it is a separate,
explicit runtime/helper approval window to materialize these already pinned
artifacts into system temp and exercise bounded generation. Until then,
runtime acceptance remains blocked by helper/runtime readiness gates.
