# UI-3M-2B-B — Minimal Win32 Directory-Handle Helper Spike

## Decision and scope

**GO_WIN32_HELPER_PRODUCTION_DESIGN** — permission to design, NOT to ship this spike.
Milestone 1 prerequisite, L2/L3 synthetic OS validation only. Filesystem search is
not user-available. No Main/CoreHost/Assistant/provider/Renderer wiring changed.
The prior Node-only spike and its negative evidence remain unchanged.

Implementation baseline: `8c61139a1b8411663ff98eb2abad759295ac3c1a`.
Before any new source writes, main was clean, relevant processes and all four Run
views were zero. Fetch confirmed `9278553b2ed1649ef6ae717d843eee14cc87ca8c` remained
remote main; 8c was its direct successor with exactly the five previous spike
files. Non-force push of 8c succeeded; HEAD and origin/main then matched.

## Actual mechanism

- `CreateFileW`: list-directory/read-attributes access, read/write/delete sharing,
  `FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT`, owning SafeHandle.
- `GetFileInformationByHandleEx(FileAttributeTagInfo)` rejects root reparse and
  checks attributes of the actual object, not just its pathname.
- `FileIdInfo` supplies volume serial plus 128-bit identity. Parent enumeration
  uses `FileIdExtdDirectoryRestartInfo` then `FileIdExtdDirectoryInfo` on the SAME
  directory handle. Fixed 608-byte batches; no whole-directory materialization.
- Parent entries carry attributes and 128-bit identities. Children are opened
  using the parent's handle-resolved location, then compared with the enumerated
  identity AND volume; attributes are checked again before use. Files receive
  the same identity/attribute check, without reading their contents.
- `GetFinalPathNameByHandleW` locates a held parent after rename. It is NOT the
  enumeration primitive or a replacement for object-identity comparison.
- `GetDriveTypeW` rejects non-fixed drives. The controller grants only newly
  created temporary synthetic fixtures. A lexical fixture-provenance check is
  additional test-only containment, not the identity proof.
- No FindFirst/FindNext, Node opendir, .NET path enumeration or lower undocumented
  API fallback. No new runtime package, addon, SDK installation or downloaded binary.

Public API references: [handle information](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getfileinformationbyhandleex),
[directory entry identity](https://learn.microsoft.com/en-us/windows/win32/api/winbase/ns-winbase-file_id_extd_dir_info),
[volume and object identity](https://learn.microsoft.com/en-us/windows/win32/api/winbase/ns-winbase-file_id_info).

## Observed focused results

Windows 11 ARM64 VM, NTFS; Node v22.23.2 ARM64. Final focused run: **124 PASS,
0 FAIL, 8 NOT_VERIFIED** (62/0/4 per runtime path); exit 0. 128 fresh case fixtures
and the compiler-output parent were removed. A preceding full run also returned
124/0/8. No synthetic files, binaries or raw run logs are committed.

| Area | Observed result on both runtime paths |
|---|---|
| Ordinary directories/files, Chinese, supplementary Unicode, case-insensitive literal match, types | PASS |
| Missing root, file root, drive root, UNC, device and outside-fixture system root | Rejected, no matches |
| Opened root renamed or replaced by junction | Only original object's matches; 20 replacement rounds per runtime PASS |
| Opened empty root deleted | No matches; safe completion or identity failure accepted, never replacement traversal |
| Child replaced before open; new identity; disappearing child; replaced file | Identity failure, empty result |
| Child replaced after verified open | Original held object only; no sibling target result |
| Junction root, child junction and cyclic junction | Rejected/skipped, no traversal into link |
| Hidden, System, Hidden+System files/directories and junction fixtures | No matches or recursion; attribute mutation before open fails closed |
| Actual denied ListDirectory ACL on a synthetic child | Identity failure, empty result; fixture ACL restored for cleanup |
| 20 results, 2000 entries, 256 directories, directory depth 4/root depth 0 | PASS; hard entry/directory limit discards all results |
| 255-unit names, OS rejection of 256-unit name, 512-unit relative path limit | PASS; no clipping |
| 16 KiB result payload, 1–120 UTF-16 query units | PASS; oversized payload rejected without partial list |
| Extra keys, duplicate keys, second request, malformed/path/glob/control queries, oversized request | Rejected |
| Prelaunch/pre-enumeration/during enumeration/post-generation/post-receipt cancellation | No delivered matches; helper exit observed |
| Uncooperative/stuck helper, abnormal exit, broken protocol, deadline | Owned helper terminated or exited; empty result; no unrelated process termination |
| Single helper invariant | Second concurrent request rejected |

NOT_VERIFIED on each path: root symlink and child symlink (current user's EPERM),
other reparse tags, mapped network drive. No permission escalation, security
setting change, fabricated link fixture or emulated network-drive test. Junction
coverage does not establish that every reparse provider has been tested.

Results are ordinally sorted; only a bounded best-20 list is retained, rather
than clipping names or returning arbitrary first-found output as a complete list.
Depth bounds directory recursion; files in the depth-4 directory can be considered,
but deeper directories are not returned as candidates or traversed.

## Lifecycle / protocol

The Node controller owns the captured process object. It never kills by name.
Cooperative cancellation is sent on stdin; after 100 ms it terminates that owned
process if still alive. The watchdog reserves this grace inside the 3-second
budget (request cancellation at 2900 ms). Completion always waits for actual
`close`/exit, not a timeout Promise. OS scheduling and process teardown are not
claimed to have a hard real-time completion guarantee.

Candidates are staged until successful process exit. Cancel/timeout/protocol
failure clears staged output. Tests rename/remove the fixture immediately after
cancellation; normal results require zero open handles. Forced-process exit plus
successful fixture cleanup is the auxiliary handle-release evidence, not a
fabricated native handle count. A separately captured sentinel stays alive until
its own explicit teardown. All fixture cleanup and final helper-count checks pass.

Single request: exactly kind/root/query/maxResults/probe, with strict flat JSON,
no duplicate/extra keys. The probe field is test-only. Output has fixed enums,
bounded counters and synthetic name/relativePath/entryType fields; no pathname,
process identity, handle value, system error, stack or ACL is emitted. Controller
validates the response and caps buffered protocol data; stderr is not forwarded.
The test controller is trusted code, NOT an OS filesystem/network sandbox. No
network/provider code exists in the helper and no provider request was made.

## Architecture — actual execution, not build labels

| Host / Node | Managed target and launch | Actual runtime | Classification |
|---|---|---|---|
| ARM64 / ARM64 | AnyCPU IL loaded into installed native ARM64 CLR by a fixed, no-profile PowerShell loader | ARM64, no emulation | arm64_native_verified |
| ARM64 / ARM64 | x64 PE managed executable, directly spawned | x64 under emulation | x64_on_arm64_emulation_verified |
| Real Windows x64 host | Not available in this run | Not run | not_verified |

The same C# source and P/Invoke layouts ran both full protocol suites. The test
creates two temporary managed assemblies with the existing Framework compiler;
it does NOT claim to have built a standalone ARM64 PE with that legacy compiler.
The native CLR host itself is the captured helper process: it creates no child
search process. No system execution policy was changed. No third-party or newly
installed dependency, native addon or retained helper binary was introduced.

Earlier diagnostics are not architecture evidence: the first 114/0/8 run used
IsWow64Process2's process-machine UNKNOWN as if that proved native managed code.
A follow-up using CLR ProcessArchitecture showed both default launches were x64
emulated. Those earlier ARM64 labels are withdrawn. A file-script loader attempt
was rejected under existing Restricted policy (focused exit 1); it was removed.
The final fixed CLR invocation and runtime cross-check produced the classifications
above. [Microsoft's managed-runtime notes](https://github.com/dotnet/core/issues/7709)
explain why default Framework AnyCPU launch can use x64 emulation on ARM64.

A future production design must choose an explicit, validated architecture launch
and deployment contract; the PowerShell test loader is not proposed as product
integration. Framework/runtime availability across target Windows versions,
real-x64 regression, additional filesystems/reparse types, and adversarial identity
reuse races remain design/review work. This finite synthetic suite is not a proof
against every Windows race. No reason to introduce an addon was established by
this experiment: public Win32 handle enumeration worked.

## Reproduction and validation

Run from the repository root on this Windows ARM64 development setup:

```text
node tests/windows-search-spike/win32/feasibility.mjs
node tests/windows-search-spike/win32/isolation.mjs
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

`--arch-only` performs only the two runtime probes, not the full acceptance suite.
Isolation checks inspect 440 production source files for spike imports/references,
confirm the existing test-directory packaging exclusion, and include seven
negative response-schema checks. No shared package script/tooling was changed.
Full npm test/verify and product typecheck/build are intentionally not run for
this isolated spike. No Jarvis/Electron startup, real directory selection,
provider request, tool action, package/sign/install/publish operation occurred.

Safety attribution: userFilesEnumerated=false; userFileContentsRead=false;
realNetworkRequestSent=false; realWindowsActionPerformed=false. Network false
means no provider/product request; the explicitly authorized Git fetch/push and
public API documentation lookups did use network access. Stop at this decision;
no production integration is authorized or performed by this experiment.
