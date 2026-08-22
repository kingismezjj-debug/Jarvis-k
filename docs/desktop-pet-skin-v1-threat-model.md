# Desktop Pet Skin v1 Threat Model

Desktop Pet Skin v1 is an asset-only local package contract. Validation can
produce a `validated_preview_package`, but preview, installation, activation,
and community distribution remain separate trust transitions.

## Trust States

1. `untrusted_package`: user-selected or downloaded bytes before validation.
2. `validated_preview_package`: manifest and declared resource metadata passed
   pure contract validation.
3. `installed_local_skin`: copied to a Jarvis-K controlled local store by a
   future installer after validation.
4. `active_skin`: selected by the user and rendered through the built-in Pet
   renderer only.
5. `built_in_fallback`: non-removable Jarvis-K robot skin used whenever a skin
   fails validation, loading, preview, install, activation, or rendering.

## Threats And Controls

- Zip Slip: reject absolute paths, `..`, separators outside normalized package
  paths, and Windows reserved names before extraction.
- Zip Bomb: enforce archive size, unpacked size, file count, file size, frame
  count, image dimensions, and pixel-count limits from one policy constant.
- Image decode bomb: validate image metadata before future decode/render and
  fail closed when dimensions or pixels exceed policy.
- Path and Unicode confusion: v1 package paths are restricted to ASCII
  normalized relative paths; case-only duplicates fail closed.
- SVG/HTML/script execution: v1 forbids JavaScript, TypeScript, HTML, CSS, SVG,
  WASM, executable/native binaries, shell scripts, and active content.
- External tracking: v1 forbids external URLs, data URLs, blob URLs, dynamic
  downloads, arbitrary fonts, and network references.
- MIME spoofing: content type and extension must agree with PNG/WebP allowlist;
  later importers must compare decoded metadata with the validated manifest.
- CPU/GPU abuse: frame count and frame rate are capped; animations are
  interpreted by Jarvis-K, never supplied as executable code.
- Privacy metadata: validation results only include safe metadata and reason
  codes; file contents are never echoed in errors.
- Version downgrade or override: semantic versions are validated, minimum
  Jarvis-K version is checked, and the built-in fallback skin ID is reserved.
- Corrupt skin availability: any validation, install, activation, or render
  failure must leave the built-in robot active rather than crashing or hiding
  the Pet window.
- Future community supply chain: community upload, review, signing, moderation,
  and revocation are out of scope for v1 and require a separate trust model.
