# Isolated recovery acceptance harness (L2)

This is external test infrastructure. It does not certify manual crash recovery.
Build the current repository before using the harness. Never use installed Alpha.
No command here terminates a process or performs a desktop tool action.

Commands (run from the repository):

```text
npm run recovery:harness -- prepare --scenario A
npm run recovery:harness -- launch --scenario <returned-profile-basename>
npm run recovery:harness -- inspect --scenario <returned-profile-basename>
npm run recovery:harness -- inspect --scenario <returned-profile-basename> --stage first_exit
npm run recovery:harness -- resolve-crash-targets --scenario <returned-profile-basename>
npm run recovery:harness -- cleanup --scenario <returned-profile-basename>
npm run test:recovery-harness
npm run smoke:desktop:recovery
```

`prepare` accepts A–F and creates a fresh random owned directory. All later commands
accept exactly the returned basename, never an arbitrary path. Every scene has
separate userData, localData, TEMP/TMP, counters and control metadata. Child
environment construction uses an allowlist; no provider settings or secrets are
copied. The independent ownership registry and directory marker must agree.
Electron's appData/temp/sessionData paths are also explicitly bound in the external
bootstrap, before product imports. Startup hardware detection uses a synthetic
capability provider so no PowerShell hardware probe is spawned by the product.

A uses a validated read-only proposal/allowed decision. C is seeded through approved
and execution.started, D through bounded tool result, and E through continuation
plus one canonical final Message. No provider/executor runs during those seeds.
F alone uses the separately named corruption helper, after repository construction,
to introduce an illegal sequence while preserving a cancelled control turn.

B `prepare` creates empty repositories. Its first `launch` is **preparation**:
the test adapter is invoked exactly once by the existing AssistantRuntime and emits
a synthetic Notepad proposal. The real bounded Task/Safety/Approval services produce
the projection rendered by the normal UI. Do not press Allow/Reject. The native
approval retains its product timeout (120 seconds); do not treat an expired scene
as a successful awaiting-approval interruption. Subsequent `launch` is **recovery**.
The automated smoke closes B gracefully, then tests recovery; it does not simulate
or certify an abnormal exit. Actual crash testing requires separate authorization.

`launch` keeps the driver attached and waits for the user to quit Jarvis. No
approval controls are clicked by the harness. `resolve-crash-targets` checks captured
Main/CoreHost/Renderer/utility PID, parentage, creation time, classification and
scenario nonce. It returns role/count only and never executes a kill.
Main and CoreHost also carry the nonce in test launch arguments; resolution queries
only those captured processes and checks a live boolean nonce match without exposing
their command lines. The actual Main PID comes from Electron itself, not an assumed
launcher PID. Unexpected
new children, PID reuse, missing processes or incorrect nonce fail closed. Raw PID
records are confined to the scenario's control directory, separate from count logs.

Every provider/executor call outside B's single preparation call is rejected and
counted, with no real fallback. The guards are installed in Main and forked CoreHost
before product imports. Existing product eligibility is enabled only in the isolated
test child so native approval can be exercised; both the Core action adapter and
Desktop launch port are replaced with rejecting test functions. No credential or
endpoint is needed. Counters contain fixed keys and unit increments only.

Observe A–D's single recovery status, absent streaming/empty/duplicate bubbles, absent
old approval controls, and safe unknown-result wording for C. E must keep one final
message without a recovery message. F must retain the damaged history, show safe
attention and keep both the editor and submission disabled. F tests focus, keyboard
submission, direct form submission and alternate text/synthetic voice commands through
the existing bridge. No canonical message is created, and provider/executor counts
stay zero. A–E editing and submission become available after recovery. The UI consumes
the existing trusted recovery projection; the common Core message ingress also rejects
submissions before recovery completes or while recovery remains blocked.
The smoke starts each recovery twice and compares logical journal/task/message counts.

`cleanup` refuses active or uncertain ownership, unresolved launch locks, changed PID
identity, links/junctions, and targets outside the owned scene. It validates the whole
tree again before deleting only that scene. Failure leaves the profile intact for
inspection; it never resets the repository or deletes development data. If a launch
fails before identity capture, retain it rather than guessing ownership of processes.

Production exclusion is checked by scanning source imports and compiled product
files, checking source build roots and electron-builder exclusions. No production
source imports this directory; no packaged crash switch or IPC route is added.

## Safe inspection diagnostics (H1, L2 automated testing)

`inspect` is now a **test-profile write operation**: it reads the synthetic state and
atomically records a bounded inspection result in the owned control directory.
Do not run it on a retained profile that is under a no-modification restriction.
The earlier D profile remains untouched; H1 does not recover its lost exception.
No manual acceptance or product recovery behavior is changed by these helpers.

`recoveryRuns` has exactly one meaning: **recovery startup attempts**, incremented
once when the startup recovery barrier is entered (including repeat starts), not
the number of recovery records inserted. B preparation is excluded. First recovery
expects 1; second expects 2. Inspection and normal exit never increment this counter.

Stages are `prepare`, `launch` (B preparation), `first_recovery`, `first_exit`,
`second_recovery`, `second_exit`, and `cleanup`. An explicit `--stage` is preferred
for manual inspection. Without it, inspect selects prepare for zero attempts,
first_exit for one, and second_exit otherwise; stage expectations still reject
excess attempts. Active recovery inspection verifies the captured process identity;
exit inspection requires the captured instance to be fully gone.

The authoritative assertion catalog is `diagnostics.cjs` (`CATALOG`). It covers
scenario classification, terminal projection/event counts, journal event counts,
Task interruption, canonical/all-final message counts, quarantine, tool-result and
continuation counts, recovery attempts, all provider/executor/Notepad counters,
profile ownership, process exit/identity, journal integrity, native/stale approval,
recovery UI/editor/send/alternate-submit states, result integrity/write, stage,
seed, cleanup, startup/barrier, and repeated-recovery idempotency.

Every failure contains exactly `assertion`, `expected`, `actual`, `stage`, and
`classification`. Values are booleans, fixed enum strings, or integers 0–4096.
Unreadable values use `unavailable`; arbitrary values never reach output.
`assertion_failed` means a fact was read successfully but differed from its expected
value. `inspection_error` means the checker could not complete; persistence and
process readers instead report `persistence_unavailable` and
`process_state_unavailable`. Original exceptions, stacks, identities and free text
are never serialized. The CLI preserves these failures instead of collapsing them.

Each result has schemaVersion 1, scenario, stage, PASS/FAIL verdict, assertion count,
optional firstFailure, safeCounters, and generatedAt=`stage_completed` (a relative
phase marker). A stage-specific pending file is exclusively created, flushed and
closed before rename. Pending, truncated, oversized, wrong-stage/scenario, unknown
schema, unknown fields and corrupt prior results fail closed. There is no fallback
to a partially written result. Safe failure artifacts use the same restricted
envelope; no raw diagnostic file is collected into acceptance evidence.

Formal D expectations, shared by CLI, Desktop exit checks and smoke:

| Fact | First recovery/exit | Second recovery/exit |
|---|---|---|
| Recovery classification | interrupted_after_tool_result | unchanged |
| Terminal projection / terminal event | 1 / 1 | 1 / 1 |
| Assistant events / Task interruption | 7 / 1 | 7 / 1 |
| Canonical messages / final messages | 0 / 0 | 0 / 0 |
| Recorded tool results / continuation | 1 / 0 | 1 / 0 |
| recoveryRuns (attempts) | 1 | 2 |
| Provider / executor / Notepad counts | all 0 | all 0 |

Second exit also reads the first_exit PASS artifact and compares all safe logical
counts except recoveryRuns. Missing or invalid first results never certify
idempotency. Existing A–F expectations remain enforced, including F quarantine and
disabled inputs, E one canonical final message, and B's one fake preparation call.
