# Isolated recovery acceptance harness (L2)

This is external test infrastructure. It does not certify manual crash recovery.
Build the current repository before using the harness. Never use installed Alpha.
Only the separately authorized H8 local challenge entry can terminate its new isolated B instance.
Other commands do not terminate application processes or perform desktop tool actions.
The exit verifier may cancel its own read-only process-query subprocess on timeout.

Commands (run from the repository):

```text
npm run recovery:harness -- prepare --scenario A
npm run recovery:harness -- launch --scenario <returned-profile-basename>
npm run recovery:harness -- inspect --scenario <returned-profile-basename>
npm run recovery:harness -- inspect --scenario <returned-profile-basename> --stage first_exit
npm run recovery:harness -- resolve-crash-targets --scenario <returned-profile-basename>
npm run recovery:harness -- authorize-input-selftest
npm run recovery:harness -- authorize-crash --scenario B
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
before product entry imports. Provider eligibility is enabled only during B preparation
so native approval can be exercised; all recovery starts have no provider. Both the Core action adapter and
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

`cleanup` refuses active or uncertain ownership, unresolved launch locks, missing or
invalid stable exit receipts, links/junctions, and targets outside the owned scene. It validates the whole
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

## Stable process exit verification (H3, L2 automated testing)

`exit-verifier.cjs` is the only post-launch exit authority for `finishExit`,
first/second exit inspection and cleanup. It does not modify Desktop Main,
CoreHost supervision, or product shutdown. The two sealed D profiles predate this
protocol and must remain untouched; a manual retry needs a fresh third D profile
and separate authorization. No acceptance evidence is produced by this change.

Each manifest entry is bound to the owned scenario and contains the captured role,
PID, parent PID, creation time and executable classification. Main/CoreHost launch
nonce attestation occurs during capture. The verifier compares the full captured
identity to read-only live process metadata. A changed creation time or executable
classification is `pid_reused_identity_mismatch`, not an active original process.
Missing necessary metadata or an inconsistent parent is `identity_unavailable` and
fails closed. A parent number alone never associates a child: the parent must match
its full identity, or the child must have a previously captured trusted identity
association. Newly discovered children retain that association across samples even
after their parent exits. Safe roles are desktop_main, core_host, renderer and
utility; exported summaries never include actual identities or executable names.

Verification has a 15,000 ms monotonic deadline, including repeated queries and
sampling waits. Each asynchronous process query receives at most the remaining
budget, plus an abort signal and a deadline race. A hung query is cancelled; query
timeout, query error, cancellation and total deadline exhaustion are distinct fixed
categories. Publication is checked against the deadline before lock release as
well. An OS operation blocking the Node event loop cannot be preempted by JavaScript;
an over-budget operation cannot authorize successful lock release when it returns.
PASS requires the launch process exit event and three consecutive complete zero
identity samples at least 200 ms apart, with Notepad count zero. Any matching process
resets the stable count. Identity uncertainty fails immediately. Role and identity
counts describe the last complete observation; queryAttempts counts all attempts.

The ordered protocol is:

1. Observe launch exit (the listener is attached immediately after launch).
2. Obtain three stable zero samples under the common deadline.
3. Flush and exclusively atomically publish the immutable bounded stableExitResult
   and its private ownership binding. Pending or partial publication is unusable.
4. Release the owned launch lock; publication must succeed first.
5. Formal inspection consumes that same result and binding, without another process
   query. Cleanup uses the same consumer, never an independent permissive sample.

The result has schemaVersion, PASS verdict, stage, launchExitObserved,
stableSampleCount, safe roleCounts/identityCounts, bounded queryAttempts,
timeoutClassification, launchLock=`release_authorized`, and notepadCount. The
release_authorized classification describes the required publication-before-release
order; consumers additionally require the launch lock to be absent. Atomic
publication uses an exclusive pending file, fsync, and a non-replacing hard link.
Unsupported publication leaves the lock held and fails closed.

The separate restricted control binding ties the result digest to the owned
profile, nonce, scenario, fresh launch generation, stage and manifest digest. It is
control metadata, not safe diagnostics or acceptance evidence, and is never printed.
Receipts expire 30 minutes after publication; a future issue time also fails closed.
A new launch changes the generation before acquiring its lock, invalidating older
receipts without modifying their bytes. Missing, pending, corrupt, unknown-schema,
wrong-owner/scenario/stage/generation, changed-manifest or expired receipts fail
closed. There is no single-sample fallback. A profile proven never launched can be
prepared/cleaned without fabricating a receipt. Any uncertain or previously launched
profile without this protocol's valid receipt is retained.

H1 firstFailure remains exactly five fields: assertion, expected, actual, stage and
classification. Process failures additionally carry a strictly validated bounded
safeProcessSummary with safe role counts, identity categories, launch exit flag,
stable sample count, query attempts, timeout category and Notepad count. No PID,
parent, creation time, nonce, path, raw error or stack is serialized into either
diagnostic output. Fixed categories are matching_identity_active,
pid_reused_identity_mismatch, child_of_matching_identity_active,
identity_unavailable and no_matching_process.

Focused H3 tests use virtual monotonic time and fake process-query transports. The
existing A–F smoke alone launches new isolated fake/local Desktop profiles and exits
normally; it never uses retained profiles, opens Notepad, invokes an executor, or
sends real provider requests. B retains its one synthetic preparation proposal;
all recovery provider/executor counters remain zero. Production exclusion guards
continue to check source imports, build roots and packaged file exclusions.

## Explicit provider modes (H4, L2 automated testing)

The launch policy is a fixed allowlist, not a user/profile/CLI provider option:

| Scenario/phase | providerMode |
|---|---|
| A/C/D/E/F recovery | absent |
| B preparation | guarded_fake |
| B recovery, including both restarts | absent |

`provider-mode.cjs` validates the scenario, phase and explicit mode at the parent
environment boundary and again in Main/CoreHost bootstrap. Missing, unknown or
incompatible modes fail closed; there is no default or automatic fallback. The
external child variable is `JARVIS_RECOVERY_TEST_PROVIDER_MODE`; no production
`JARVIS_K_*` option is added. The CLI cannot accept an arbitrary mode string.

`absent` does not import/instantiate the fake provider, configure an answer provider,
enable the online answer service, or write product provider/configuration stores.
It supplies no endpoint, base URL or credential placeholder. The bootstrap calls
the existing product recovery implementation without a model dependency. Core's
provider field is checked before and after recovery; any unexpected configured
provider or enabled service fails closed. The existing production chat binding
normally eagerly creates a configurable provider wrapper even when disabled. Only
inside this external bootstrap, it is replaced by a binding with no provider field
or factory and which rejects enable/configuration requests. Production source and
recovery policy remain unchanged.

The test-only provider constructor/transport guards cover the fixture, configurable,
local smoke, OpenAI-compatible, GLM and DeepSeek answer adapters. Secure answer-store
mutation methods are blocked before writing. Existing HTTP/HTTPS/fetch/net/TLS and
Electron network guards remain active and increment a separate network counter.
Forbidden operations count the attempted boundary, then throw without a real delegate.
Configuration-attempt violations remain sticky and cannot pass inspection merely
because no file was written. Inspection also checks that the isolated user/local
directories contain no provider/credential JSON files, without reading their contents.

`guarded_fake` is exclusively B preparation. One fake factory, one instance, one
in-memory configuration and exactly one proposal transport call are permitted.
Continuation, second factories/calls and all networking fail closed. B recovery
gets a new launch context with `absent` and zero current-launch provider counters;
the previous preparation counter remains 1 in the separate existing lifetime counts.
No product provider configuration is persisted to bridge those phases.

Each launch has a private control binding (schemaVersion, owner, scenario, phase,
mode, kind, generation) tied to the H3 launch generation. Observations are exclusive,
bounded single-enum records in that generation's audit directory. Inspection checks
the binding against the trusted mapping and current launch. Changed owner/scenario/
mode, missing/partial/unknown metadata and stale generations fail closed. Offline
repository tests explicitly create an `offline` absent context; that context cannot
be used by a profile already launched in Desktop. Seed inspection uses the explicit
mapping with zero pre-launch counters and never fabricates a launch observation.

The safe inspection envelope adds `provider` with exactly these fields:

```text
providerMode: absent | guarded_fake
providerConfigured: boolean
providerInstantiated: boolean
providerFactoryCalls: integer 0..4096
providerTransportCalls: integer 0..4096
providerNetworkCalls: integer 0..4096
providerStatus: unconfigured | unavailable | available
```

All recovery inspections require absent/false/false/0/0/0/unconfigured. First and
second exit compare these projections as well as the existing logical counts.
H1 safe firstFailure and H3 stable-exit consumption are retained; private binding
data, endpoints, credentials, paths and raw configuration never enter diagnostics.
Old retained profiles are not migrated, re-inspected, launched or deleted by H4.

Focused H4 tests plus A–F smoke validate the absence of configuration and instances,
rejected factory/transport calls, B preparation isolation, mode tampering, safe
output and production import/package exclusion. Smoke profiles are new automated
test profiles, not C manual acceptance profiles. A new C manual run requires its
own subsequent authorization and a freshly prepared profile.

## Local crash authorization (H6, L2 automated validation)

Only a subsequent authorized manual B run may invoke
`node tests/recovery/cli.mjs authorize-crash --scenario B` in a local interactive
terminal. This entry creates a NEW B profile; it cannot attach to an old basename.
Never pipe a confirmation or type it through an automation tool. The human must see the native
Allow/Reject controls, without clicking either button. H8 supersedes the former Y
protocol: type the complete uppercase one-time challenge and Enter in the verified
terminal. The console may echo normal line input; the harness never records it.
EOF, error, timeout and mismatches are distinct results. No second chat confirmation
is needed.

The existing preparation calls its memory-only fake provider once. Core's parsed
native approval commands and Desktop before-quit are counted by external bootstrap
observers; no production method is edited. Counts do not prove historical causes
in older profiles. In particular product timer cancellation has no uniquely
persisted source: the harness reports only the observed timeout window or an
unknown-source state change, never invents an expired Approval record.

H6 checks native UI plus the canonical Task/journal before prompting, after the matched challenge,
after identity resolution and immediately before controller dispatch. A monotonic
clock targets at most 60 seconds and rejects at 75 seconds after native observation.
Canonical decision age also must be below 75 seconds, retaining at least 45 seconds
of the unchanged 120-second product timer. Individual fact/target operations have
at most five seconds and the remaining gate budget. Product 120/130-second timers
are unchanged. Failed gates close normally without a cancel/deny command and mark
the new profile invalid_for_acceptance; uncertain partial termination is retained
without a second termination attempt or normal-close fallback.

The actual controller is inert on import. Automated tests inject only a fake crash
controller, never execute the PowerShell termination script. The manual controller
reuses H3 manifest validation and complete identity classification, rejects unknown
children/reuse/missing identities, re-attests Main/CoreHost ownership, and pins each
validated OS process handle. It terminates Main first, then captured child handles;
it never kills by name, by wildcard or recursively. A final bounded PowerShell
identity check occurs before any termination. H3 subsequently observes launch exit
and three stable zero samples with Notepad zero. Unrelated captured Electron/Node
identities must remain unchanged; uncertainty invalidates acceptance.

H3's receipt certifies process absence and permits lock release, not normal-exit
acceptance. The separate immutable crash timeline must say
crash_executed_while_pending and eligible_for_recovery before this H6 profile may
start provider-free recovery. Missing, partial, invalid, altered or wrong-owner
timelines fail closed. Timeline integrity uses a separate private binding to the
preparation H3 generation; the public timeline contains only the documented
booleans, bounded counters and enums, with no timestamps, identity values or raw
input. Product databases and crash residue remain retained. No command here advances
automatically into recovery, repeated acceptance, evidence closure or profile cleanup.

The fixed timeline source classifications are user_approval_decision_observed,
harness_cancel_observed, product_timeout_window_reached, app_close_before_crash,
state_changed_unknown_source and crash_executed_while_pending. Additional gate
failure enums distinguish input mismatch/EOF/error/timeout, deadline, target identity
and exit verification. app_close_started records the harness's normal safe closure
too; its reason does not retroactively replace the first failed pre-crash condition.
There is no final acceptance evidence produced by H6. New modules, script and
observers stay under tests/recovery and remain excluded from production imports,
compiled product roots and electron-builder file selection.


## H8 reliable local authorization (L2, test infrastructure)

The standalone `authorize-input-selftest` imports only the input protocol and a
read-only foreground probe: no profile creation, database, app, provider, executor,
or termination controller. Its five output fields are ttyAvailable,
lineInputReceived, challengeMatched, result, durationBucket. The challenge is shown
only in the interactive terminal, never written to timeline, evidence or files.
Do not redirect/transcribe this interactive command. The reader uses readline with
terminal:false, preserving normal console line discipline; it never enables raw
mode. It reads one newline-terminated line, trims edges, and compares strictly
uppercase. Y/yes/empty/partial/extra input cannot grant authorization. Unterminated
EOF is not a line submission. A 256-byte input bound prevents unbounded buffering.

Each gate issues a fresh CRASH-B- plus four cryptographically random decimal digits,
with collision rejection within the current process; the value is one-use and valid
only for that invocation. Four digits are an interaction check, not an authentication
secret. Used values are held in memory only. Cross-process global uniqueness is not
claimed. No challenge or raw input is returned in diagnostics.

Before any new manual B profile can be created, authorize-crash now performs the
independent calibration in that SAME terminal process. A previously reported PASS
from another process cannot bypass this guard. A failed calibration creates no B
profile. A standalone Windows manual calibration must also have passed before B is
scheduled; H8 implementation does not perform B acceptance.

Foreground proof is deliberately narrow: a read-only Windows helper verifies a
visible classic-console HWND equals GetForegroundWindow, and the live console
process membership contains both the current harness and the helper. No window
names/titles are used, no handles/identities/titles are output. It checks before
reading and again after a matching line. ConPTY/Windows Terminal hidden console
windows cannot satisfy this proof and return foreground_unverified. Use a separately
launched classic console for calibration; otherwise B remains blocked. Supporting
other terminal hosts requires a test-only authenticated terminal-host identity
bridge; user assurances or title matching are insufficient. Queries time out after
at most one second. B allows up to ten seconds within its 45-second gate budget to
move foreground to the terminal before showing a challenge; continuous safety
monitoring remains active during that wait.

Result allowlist: granted, input_mismatch, input_eof, input_error,
authorization_timeout, aborted, tty_unavailable, foreground_unverified,
pending_state_changed, approval_command_observed, target_identity_failed.
Reader rejection remains input_error; it is never converted to timeout. H1 maps
input mismatch to local_authorization_input (challenge_match/input_mismatch), EOF
and error to local_authorization_channel (open/eof or readable/input_error), timeout
to local_authorization_deadline (within_45s/expired), pending change to
canonical_approval_state (pending/changed). Only an observed missing native UI can
produce a false native_approval_projection assertion; inspection exceptions remain
inspection_error. The CLI forwards the gate firstFailure intact.

The watcher starts checks every 250ms, permits at most 500ms for each complete
check, never overlaps reads, and aborts input on any unsafe canonical/pending,
approval command, execution, executor, Notepad, close or timeout fact. A completed
line is followed by another full safety check, identity resolution, then the
existing pre-dispatch guard. A read that cannot complete within its bound fails
closed. The gate uses monotonic elapsed time for 45/75-second budgets; canonical
age must independently preserve the unchanged product 120-second window.

Timeline schema 2 stores only challenge_match, safe enums, H1 firstFailure and
bounded counter snapshots. firstFailureCounters and finalCloseCounters have
separate meanings. Prior to normal close, an immutable atomic
`authorization-failure.json` checkpoint records the original failure and
app_close_started=true. failureCheckpoint and closeOutcome separately report
persistence/closure failure, without overwriting the authorization result. The
final immutable timeline retains both snapshots; timelinePublication separately reports a failed final write without replacing firstFailure. If final counts are unavailable
that field is null, never fabricated zero. Old retained schema-1 timelines are
not migrated or edited and cannot authorize a new launch.

H8 tests inject input streams, clocks, foreground proof and fake crash controllers.
No automated test calls the real termination controller. A–F smoke remains isolated
and closes normally. Product recovery, schemas, UI, 120/130-second timers and
packaging configuration are unchanged. Test imports and scripts remain excluded
from production import roots and packaged file selection. No final acceptance
evidence is produced, and no preserved profile is cleaned or reused.
