# Isolated recovery acceptance harness (L2)

This is external test infrastructure. It does not certify manual crash recovery.
Build the current repository before using the harness. Never use installed Alpha.
No command here terminates a process or performs a desktop tool action.

Commands (run from the repository):

```text
npm run recovery:harness -- prepare --scenario A
npm run recovery:harness -- launch --scenario <returned-profile-basename>
npm run recovery:harness -- inspect --scenario <returned-profile-basename>
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
attention and keep submission disabled. Current product behavior keeps the draft
input editable even while recovery is blocked; the harness reports this distinction
and does not certify the earlier "input disabled" manual criterion. A–E submission
becomes available after recovery. Resolving that product criterion needs a separately
authorized UI change or an explicit acceptance-criterion decision before UI-3K-2E-B.
The smoke starts each recovery twice and compares logical journal/task/message counts.

`cleanup` refuses active or uncertain ownership, unresolved launch locks, changed PID
identity, links/junctions, and targets outside the owned scene. It validates the whole
tree again before deleting only that scene. Failure leaves the profile intact for
inspection; it never resets the repository or deletes development data. If a launch
fails before identity capture, retain it rather than guessing ownership of processes.

Production exclusion is checked by scanning source imports and compiled product
files, checking source build roots and electron-builder exclusions. No production
source imports this directory; no packaged crash switch or IPC route is added.
