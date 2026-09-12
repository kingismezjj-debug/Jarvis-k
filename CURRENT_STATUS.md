# Jarvis-K Current Status

Updated: 2026-09-12 — UI-3L-2A Reduced-Scope Soak Evidence Closure.

This is the **only current product summary**. Historical records are retained,
but do not promote current source, another platform, or another artifact to L4/L5.

## Current product state

### Source and version

- Implementation baseline: `388a4fc65e3a849b764200baa428e109767c210d` on `main`.
- Current HEAD: the revision containing this summary; resolve with `git rev-parse HEAD`
  and compare with freshly fetched `origin/main`. The delivery report records the
  final full commit. A commit cannot embed its own hash; the baseline above must
  not be mistaken for the post-UI-3L-0 HEAD.
- Package metadata: `0.1.0-alpha.7`, Windows short version `0.1.0.7`.
- UI-3L-0 changes development script ordering and documentation only, with focused
  regression tests. No runtime feature, installer, signing or publishing change.
- Current latest source has **not been repackaged or signed**. Same version metadata
  does not mean the historical signed Alpha.7 candidate contains current code.

### Assistant loop and tools

| Surface | Current capability | Evidence / boundary |
| --- | --- | --- |
| Text Assistant | Single-provider streaming answer, cancel, late-output suppression, retry and one canonical final message | Historical UI-3K-2B L4; current environment is not a new real-provider acceptance |
| Read-only Assistant tool | `model.status` with empty arguments and result re-entry | Historical UI-3K-2C L4 |
| Effectful Assistant tool | `localApp.open`, restricted to Notepad, governed approval, deny/allow and verified result re-entry | Historical UI-3K-2D L4; no arbitrary app execution |
| Iteration limit | At most one tool / one iteration per turn; one active Assistant turn globally | No general autonomous multi-step loop |
| Existing rules / Minimal Planner | Existing bounded app/browser/search/task paths retain their separate governance | Their historical acceptance does not add tools to the new Assistant loop |
| Settings / desktop | Settings V2 in development/Alpha; Legacy rollback, tray and local Pet foundations exist | No new UI or installed lifecycle acceptance in UI-3L-0 |

`filesystem.search` is **not integrated into the new Assistant loop**. Shell,
arbitrary executable paths, browser tools and file writing are not enabled by
the bounded Notepad Assistant acceptance.

### Providers

- The existing DeepSeek/OpenAI-compatible Chat Answer adapter supports streaming
  after explicit secure-store configuration, successful connection test and enablement.
  Saving, testing and enabling remain distinct operations.
- Deterministic rules remain the default command route; fixtures are test-only.
- Qwen local routing and Advanced Brain integrations retain their existing gates;
  adapter code or fake conformance tests are not evidence of a default-on product path.
- No new provider or real provider request is part of UI-3L-0. No credential is copied
  into test children. The new ARM development environment has no newly accepted
  real-provider configuration from this task.

### Recovery

- **UI-3K-2E remains L3**: Assistant journal/persistence and bounded recovery are
  implemented with synthetic automated validation.
- **Pending-approval real crash scenario B is not completed.** Seeded histories,
  graceful exit, fake smoke and authorization-controller tests do not certify it.
- Recovery does not replay Windows actions, call providers or restore stale approvals.
  Unknown execution results remain unknown; malformed histories are quarantined.
- Existing recovery harness, H17, profiles and historical evidence are retained.
  UI-3L-0 does not modify or expand crash authorization tooling or run real crashes.

### Platform validation

- Product target remains Windows. Current development machine: Apple M4,
  Parallels/Tools 27.0.1, Windows 11 ARM64 10.0.26100, Node 22.23.2 ARM64,
  npm 10.9.8, Python 3.12.10 ARM64.
- Windows ARM is **development validation only**, not an automatically supported
  release platform. Windows x64 package and hardware behavior need their own evidence.
- Pre-UI-3L-0 ARM baseline: dependency install, typecheck and development build/start
  passed; first verify had 3001 passing tests and one missing-Desktop-dist failure.
  After building, that file's 45 tests passed. This is historical baseline evidence,
  not a claim that the original clean verify passed.
- UI-3L-0 validation results are recorded in the delivery report. Unit tests use fake/local
  dependencies; no real provider, Windows action or real crash acceptance is implied.

### Reduced-scope soak closure (UI-3L-2A)

- Implementation assessed: `b0d547ba0fefc8e0ab0ac52a25197f7311371c33`.
- Verdict: **INCOMPLETE_USER_STOPPED**, **0 validated completed days / 5 requested**.
  Only Day 1 has a log; its reported normal use cannot qualify as a dated soak day
  because the usage date is absent. Its safe note reports 30 minutes; eligible-day
  duration is 0 minutes. Day 2-4 logs are missing and are not reconstructed.
- Day 5: **WAIVED_BY_USER / NOT_TESTED**, not PASS. No issues are reported in the
  available log (P0/P1/minor: 0/0/0); missing-day safety remains unknown.
- This closure adds no full UI-3L-2 L4, ARM release support or L5 claim. Historical
  x64 L4 evidence remains scoped to its original records; recovery stays L3 with
  real crash B incomplete. No automatic next phase is authorized.
- [Sanitized closure evidence](artifacts/ui-3l/reduced-scope-soak/reduced-scope-soak-acceptance.json).

### Release

- External distribution: **NO**. UI-3L-0 creates no release installer or signed candidate.
- Signed Alpha.7 historical candidate and its lifecycle evidence remain valid only
  for the recorded artifact hashes and environments, not current HEAD.
- No L5 claim for the current development source. Auto-update/store publishing is
  not delivered by this baseline repair.

## Historical evidence

| Evidence | Recorded implementation / artifact | Scope |
| --- | --- | --- |
| DeepSeek streaming L4 | `8e26328`; [record](artifacts/ui-3k/deepseek-streaming-acceptance/deepseek-streaming-acceptance.json) | User-operated connection, streaming, cancellation, retry, profile restart |
| Single read-only tool L4 | `c4a0d2eb67c4bb75857308a2ae7e46ed6dbae8e8`; [record](artifacts/ui-3k/single-tool-result-reentry/acceptance.json) | One status tool and result re-entry |
| Bounded Notepad L4 | `83b0910d9ef1aa48cd9555d5221db41ba5ec313b`; [record](artifacts/ui-3k/bounded-notepad-action-acceptance/acceptance.json) | Native deny/allow; only Notepad |
| Signed Alpha.7 candidate | UI-3I-1H, candidate-attempt2; hashes and signatures in retained release records | Historical candidate, not UI-3L-0 source |
| Windows 10 signed lifecycle | [record](artifacts/ui-3i/signed-alpha7-isolated-lifecycle/signed-alpha7-isolated-lifecycle-acceptance.json) | Upgrade, repair, uninstall retention, reinstall and downgrade guard; provenance distinguishes user observations |
| Windows 11 pristine signed install | [record](artifacts/ui-3i/signed-alpha7-windows11-pristine-clean-install/signed-alpha7-windows11-pristine-clean-install-acceptance.json) | Historical clean install, signatures, UI and final state; not current ARM acceptance |

Historical “unsigned/no certificate”, Alpha.1 startup failure and Alpha.4 login
repair blockers were superseded by later recorded candidates and lifecycle results.
They are preserved in the [old status ledger](docs/history/current-status-before-ui-3l-0.md),
not current blockers. Older README Phase declarations are in the
[historical README ledger](docs/history/readme-baselines-before-ui-3l-0.md).
See [documentation scope](docs/README.md) for the reconciliation map.

## Known limitations

- UI-3K-2E L3; pending-approval real crash scenario B incomplete.
- Latest source not repackaged/signed; historical Alpha.7 is not the latest-code release.
- ARM validation is development-only; no new x64 acceptance here.
- One tool / one iteration; `filesystem.search` not in the new Assistant loop.
- Wake word, plugin marketplace and multi-model expansion remain deferred.
- Third-party plugin installation/execution is not implied by the SDK or bundled samples.
- Voice and local models need their existing explicit setup; no voice/pilot expansion here.

## Short development baseline

Use [Developer Onboarding](docs/developer-onboarding.md): Node >=22.12.0, `npm.cmd ci`,
`npm.cmd run verify`, then `npm.cmd start` (or `npm.cmd run dev`). Both standard
startup commands build first and stop on build failure; no prior manual build is needed.
`npm test` builds the Desktop modules required by its tests before running Vitest.
Direct `electron .` remains a low-level built-output entry, not clean startup.

Daily-use baseline means reproducible commands and known boundaries, **not a completed
five-day trial**. UI-3L-0 stops after its requested verification and commit/push.
No automatic next phase, file-search integration or recovery acceptance is authorized.
