# UI-3M-2B-A — Windows Search Engine Feasibility Spike

Date: 2026-09-14. Implementation baseline: `9278553b2ed1649ef6ae717d843eee14cc87ca8c`.

## Verdict: GO_MINIMAL_WIN32_HELPER_SPIKE

This is permission for a **separate technical experiment**, not approval of a
production search engine, not an added dependency, and not L4 user availability.
All files in this directory are test-only. Nothing imports them from the product.
No CURRENT_STATUS change is necessary: UI-3M-2A remains the product baseline.

## Run

From the repository in a native Windows Node environment:

```text
node tests/windows-search-spike/feasibility.mjs
```

No installation, build, provider, Electron startup, or user folder is needed.
The harness creates a new random temporary fixture. Only that fixture and the
fixed worker source are allowlisted in the child Node filesystem permission model.
It removes the complete fixture after all search processes have exited. The
parent uses fixed `attrib.exe` and `icacls.exe` argument arrays, without a shell,
only against newly-created fixture items; the ACL deny is removed in `finally`.
Symbolic-link privilege failure is NOT_VERIFIED, with no elevation or workaround.

`supervisor.mjs` is a test stand-in for Desktop Main ownership. It forks a dedicated
Node **process**, not a worker thread. `sentinel.mjs` is an unrelated-process
liveness witness. The product supervisor and its runtime are not changed.

## Observed architecture

- Windows ARM64: **verified**, Node v22.23.2; child reports `arm64`, native parent
  architecture is ARM64. Electron is not used or verified by this spike.
- Windows x64: **not verified**; no native x64 Windows environment was available.
  No emulated x64 run is counted as acceptance.
- Worker source: architecture-independent JS, current native Node executable.
  No additional architecture-specific binary or runtime dependency was added.
  The same source working natively on x64 remains unproved.

## Observed results

Final run: 32 cases; 30 observation assertions passed, 2 symbolic-link cases
NOT_VERIFIED. **Two passing observation tests deliberately demonstrate failed
engine security boundaries; this is not a 30/32 production acceptance claim.**

| Area | Observation |
| --- | --- |
| Ordinary root/files/directories | Allowed; safe relative candidates returned |
| Missing root / regular-file root | Rejected without results |
| Drive root / UNC / device / system root | Lexically rejected before access |
| Network scope | UNC spelling rejected; actual mapped network drive NOT_VERIFIED |
| Junction root | lstat recognized it as a link; rejected |
| Child junction and loop | Skipped; target not entered by the ordinary traversal |
| Root / child symbolic links | NOT_VERIFIED: current account lacks creation privilege |
| Other reparse tags / cloud or mount-point tags | NOT_VERIFIED; junction evidence is not generalized |
| Simple root and child replacements | Detected; no partial results |
| ABA replacement around directory open | **FAIL boundary**, see below |
| Unreadable child | Synthetic Everyone list-directory ACL deny produced access_denied; no results; ACL restored |
| Long names / relative path | Filesystem refused 256-unit name; relative paths over 512 omitted with truncation |
| Hidden/System item | **FAIL boundary**, see below |
| Results / entries / directories / depth / payload | Tested 20 / 2000 / 256 / 4 / 16KiB limits |
| Single search worker | Concurrent second search refused |
| Cancellation before enumeration / during enumeration / before delivery | Cooperative exit; zero open directories reported; no results |
| Uncooperative worker | Dedicated process forcibly stopped; close event observed; no results |
| 3000ms watchdog | Cancellation begins at budget; 100ms cooperation grace before kill; waited for close |
| Abnormal worker exit | Safe worker_failed; no results |
| Unrelated process | Still answered ping after search worker was terminated |

### Concrete missing identity capability

The controlled ABA test starts with an empty ordinary child directory and a
separate synthetic sibling holding one synthetic file:

1. After lstat/realpath identity capture but before opendir, move the ordinary
   child aside and replace its pathname with a junction to the synthetic sibling.
2. After opendir but before identity revalidation, remove the junction and restore
   the original ordinary directory at the original pathname.
3. Path-based realpath/dev/ino revalidation sees the original directory again.
   The existing `fs.Dir` nevertheless reads an entry from the sibling.
4. Candidate checking subsequently rejects it; **outside results delivered = 0**.
   Bounded counters prove **one out-of-authorized-root synthetic entry was read**.

Both objects are inside the fresh fixture capability; no user data is involved.
Nevertheless, this disproves using repeated pathname checks as sufficient proof
of the identity of the already-open directory object. The spike does not access
an exposed directory handle identity through Node's public `fs.Dir` surface.
It does not claim every possible Node design has been mathematically disproved.

### Concrete missing attribute capability

`attrib.exe` sets Hidden and System on a synthetic file and a second attrib call
confirms both flags. Node lstat reports no attributes field; mode/dev/ino do not
distinguish the marked file. The Node-only engine returns it. This is an observed
filter failure, not evidence that filenames beginning with a dot solve Windows
attribute handling.

### Cancellation evidence and limits

The parent stages results and resolves only after the child `close` event. A
cancel revokes the staged result. Cooperative work closes directories in finally;
uncooperative work is killed only through that owned ChildProcess, with no image-
name/global process kill. After exit the harness renames and recursively removes
that fixture and verifies the search-worker count remains zero. This confirms
process completion and usable fixture cleanup; it is not kernel-handle tracing.
The 3-second budget is not a promise that OS process termination finishes within
3 seconds: cleanup grace and exit confirmation are additional. If exit never
arrives, the supervisor does not falsely report cancellation complete.

The child receives a minimal environment, no profile/provider configuration, no
shell or network code, and disabled global fetch. Node permissions deny child
spawning and filesystem access outside the fixture/source allowlist. **This is
not an OS network sandbox or containment proof for malicious JS.** The fixed
trusted worker executes no network operation; no untrusted code is evaluated.

## Next experiment, not implemented here

A minimal Win32 helper must prove that directory enumeration, reparse/attribute
inspection, and volume/file identity checks apply to the **same opened object**,
not another object reopened through a pathname. Repeat the ABA test and query
FileAttributeTagInfo (including Hidden/System and unsupported reparse tags), with
fail-closed behavior. Retain the separately killable owned process and exit barrier.
Validate the helper natively on ARM64 and x64 before any production dependency or
integration. No helper, addon, binary, installation or production path is added
by this commit.

Provider/Assistant/Renderer, directory picker, legacy direct/Planner/voice,
file opening, crash harness, installer/signing/publishing remain untouched.
