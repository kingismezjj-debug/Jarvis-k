# Assistant turn persistence and recovery

Completion level: L3 implementation with synthetic automated validation. Controlled manual crash-recovery acceptance remains pending. The previously accepted bounded Notepad loop remains the only effectful Assistant tool. This change adds no tool or provider.

## Ownership and migration

Core owns `AssistantTurnRepository`, journal validation, classification and `recoverAssistantTurns`. `SqliteAssistantTurnJournal` implements that port inside the existing CoreHost `SqliteTaskRepository` database and uses its durability boundary. No second Task, Approval, Message or Conversation store is introduced. CoreHost hydrates canonical memory and recovers existing Task approvals before invoking Assistant recovery and announcing readiness. Missing or unhealthy canonical storage keeps Assistant turns blocked.

Canonical Message lookup is also forwarded by the existing Memory decorator. Lookup does not invoke its embedding provider or create a vector write.

The ready health projection and conversation composer remain unavailable until recovery finishes. A deferred-repository regression test covers the startup window between ordinary memory hydration and Assistant recovery, preventing an early ready signal followed by a rejected first message.

Task database `PRAGMA user_version` moves from 2 to 3. `assistant_turn_events` is append-only, with update/delete rejection triggers, a `(turn_id, sequence)` primary key, version 1 event envelopes, bounded JSON and sequence constraints. `assistant_turns` is a small open/terminal/quarantine projection, not a task store. Its state/turn index supports deterministic scans. Every append validates the bounded history and updates event and projection in one SQL transaction. Identical append retries are idempotent; gaps, conflicting duplicates and invalid causal correlations fail closed.

Task and canonical Message file exports use a same-directory temporary file, file fsync and replacement instead of overwriting the live database. A failed export poisons that repository instance, so an in-memory unflushed write cannot authorize further work. A leftover temporary file is never treated as committed state. This targets process-crash recovery; it is not a claim of hardware or power-loss certification.

## Data boundary and ordering

The journal stores bounded identifiers and enums: turn/conversation/command/final-Message correlation, the fixed internal tool identity, proposal, Task, approval request and resolution, execution, result status/verification classification, continuation and terminal state. The accepted event reserves the canonical final Message ID before requesting the provider.

It does **not** store prompt or answer text, streaming deltas, credentials, Authorization, provider configuration, reasoning, raw provider envelopes, tool argument JSON, raw or complete tool output, PID, executable path or process dumps. Existing canonical Message storage continues to own conversation content; existing Task/Approval repositories remain their fact sources.

The durable order is:

1. `turn.accepted` before the initial provider request.
2. `tool.proposed`, then `tool.decided` with Task and approval correlation.
3. Approved resolution, then `execution.started`, both awaited before calling the Desktop execution port. Cancellation is checked again after the barrier. A failed start write prevents that call.
4. `tool.resulted` containing only bounded result metadata, then `provider.continued`, before provider continuation. Denial has a blocked result and no execution-start event.
5. The canonical AssistantRuntime completion path appends the final Message under the reserved ID, then appends `turn.completed`. The Message primary key and identity check prevent duplicates. An ambiguous completion write leaves the journal open for reconciliation, rather than claiming a failed final while a Message may already exist.

## Recovery policy

Recovery scans at most 100 open turns in deterministic turn-ID order and at most 32 events per turn. It has no provider, tool or Desktop execution port. Excess unfinished work or quarantine blocks new Assistant turns. Subsequent recovery processes the remaining bounded batch.

| Durable history | Recovery status |
| --- | --- |
| No execution start and no pending approval | `interrupted_before_execution` |
| Requires approval, without a resolution | `interrupted_while_awaiting_approval` |
| Execution start, without a trusted persisted result | `interrupted_unknown_execution_result` |
| Tool result, without a canonical final | `interrupted_after_tool_result` |

Unknown execution means the app may already have opened. The localized status asks the user to check the current system state, makes no success/failure assertion and never retries. No recovery branch sends a provider request, invokes an executor or reopens Notepad. A saved result is not sufficient to resume provider continuation automatically.

If the canonical final Message already exists with the reserved ID, role and conversation, recovery only appends the missing completed event. It never inserts a recovery Message or repeats the final answer. Completed, cancelled and failed journals are excluded. Repeated recovery leaves both journal terminal events and existing Task recovery events unchanged.

The existing Task recovery makes unfinished tasks interrupted, cancels pending steps and inserts its existing idempotent interruption event. Their approvals are no longer resolvable. Assistant transient projections are not restored. UI renders localized recovery notices as system status without model avatars, old streaming text, tool IDs or approval buttons. Internal correlation values serve only as keys, never display text.

Unknown database versions are rejected before migration or export. Malformed JSON, unsupported event versions, gaps or projection conflicts quarantine the turn as `invalid_journal`; original event rows remain intact. Quarantined turns are excluded from normal recovery and Assistant startup stays blocked with a safe attention status. No database or history is deleted or silently reset.

## Validation boundary

Focused tests cover canonical text and read-only completion, no delta/content duplication, real governance services with fake Notepad deny/allow, all four recovery classes, every durable barrier fault, missing final terminal reconciliation, repeated recovery, stale approvals, bounded scans, version-two migration, corruption/quarantine, append-only constraints, export failure, startup order and localized UI status.

Fault injection is confined to test repository wrappers, synthetic database mutations and a fake Desktop executor. No packaged crash switch, environment-variable failure backdoor, hidden menu or production crash trigger is added. The suite rejects real fetch calls. Existing isolated fake Desktop smoke validates the UI and supervisor route using its test-only transport and executor substitutions.

Required verification: focused persistence/recovery tests; full `npm test`; UI string audit; boundary and sensitive-artifact checks; clean-child-environment `npm run verify`; isolated fake Desktop smoke. Automated `realNetworkRequestSent=false` and `realWindowsActionPerformed=false`. There is no new human acceptance evidence or L4/L5 claim.

Final validation PASS: 38 focused persistence/recovery cases, localized recovery UI and deferred-startup regressions, and the existing Memory decorator lookup checks. The full clean-child-environment verify passed 330 test files / 2405 tests, typecheck, dependency boundaries, sensitive-artifact guard and build. UI string audit and the unmodified isolated fake Desktop deny/allow/streaming/cancel/retry/restart smoke passed. Earlier smoke failures exposed the premature-ready startup window; that issue was fixed and tested before this final run. No real provider request, real desktop action or manual crash was performed.

## Changed files

- Contracts: `packages/contracts/src/assistant-turn-journal.ts`, `packages/contracts/src/index.ts`, `packages/contracts/src/protocol.ts`.
- Core: `packages/core/src/assistant-turn-repository.ts`, `packages/core/src/assistant-runtime.ts`, `packages/core/src/bounded-notepad-task-service.ts`, `packages/core/src/runtime.ts`, `packages/core/src/task-runtime.ts`, `packages/core/src/index.ts`, `packages/core/test/runtime.test.ts`.
- Existing storage: `packages/memory/src/ports.ts`, `packages/memory-sqlite/src/sqlite-memory-repository.ts`, `apps/core-host/src/sqlite-assistant-turn-journal.ts`, `apps/core-host/src/sqlite-task-repository.ts`, `apps/core-host/src/memory-provider-vector-write-wiring.ts`.
- Host startup and tests: `apps/core-host/src/host/core-host-bootstrap.ts`, `apps/core-host/test/assistant-turn-persistence-recovery.test.ts`, `apps/core-host/test/core-host-bootstrap.test.ts`, `apps/core-host/test/memory-provider-vector-write-wiring.test.ts`.
- UI: `apps/ui/src/App.tsx`, `apps/ui/src/app/copy.ts`, `apps/ui/src/features/conversation/conversation-message-list.tsx`, `apps/ui/src/features/conversation/types.ts`, `apps/ui/test/assistant-recovery-notices.test.tsx`.
- Documentation: `CURRENT_STATUS.md`, `docs/assistant-turn-persistence-recovery.md`.
