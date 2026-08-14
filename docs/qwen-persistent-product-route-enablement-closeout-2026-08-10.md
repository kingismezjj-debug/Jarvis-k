# Qwen Persistent Product Route Enablement Closeout

Recorded: 2026-08-10

## Status

`PREPARED_VERIFIED_CLEANED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

The approved persistent Qwen product-route enablement preparation window
completed. It added a default-off explicit opt-in activation projection that can
represent Qwen as the active route source only when persistent enablement gates
are supplied. Normal desktop product status remains deterministic fixture by
default.

## Result

```text
default route before enablement: intent-router.deterministic.fixture
active route after explicit opt-in: intent-router.qwen3-0.6b in contract projection only
fallback/rollback route source: intent-router.deterministic.fixture
runtime path selected: temporary_venv
dependency retained: false
artifact cache retained: false
artifact materialization: passed
digest verification: passed
artifact count: 7
helper count: 1
helper readiness: passed
generation port result: passed
manual route samples: 1
manual route result: passed
runner cleanup: passed
dependency cleanup: passed
Qwen route enabled by default: false
default-on behavior: false
realQwenRuntimeEnabled default product status: false
UI/IPC runtime control changed: false
allowlist expanded: false
release behavior changed: false
```

## Verification

```text
focused tests: PASS, 11 files, 165 tests
contracts build: PASS
transformers runtime build: PASS
qwen adapter build: PASS
core build: PASS
core-host build: PASS
ui build: PASS
desktop build: PASS
Command Router fixture suite: PASS on final full rerun, 4 smoke paths, duration 8950 ms
```

Command Router fixture outcome:

```text
Notepad fixture: PASS, no new Notepad process
Calculator fixture: PASS, no new Calculator process
Browser projection fixture: PASS, no new browser process
VS Code blocked fixture: PASS, no new VS Code process
```

Note: the first full fixture-suite run timed out waiting for the local-app
allowlist fixture UI to show the control-on state. The immediate single-fixture
rerun passed, and the final full suite rerun passed all four entries.

## Safety Result

This closeout is developer-alpha preparation evidence only. It does not make
Qwen default-on and does not create a production-facing Qwen routing claim.

No raw prompt, generated text, helper diagnostic, Python path, private path,
package log, artifact source URL, signed URL, token, vector, stack trace,
benchmark, or model internal was recorded. No credential was accessed. No
Memory write or vector retrieval was used. No provider planner was used.

No persistent dependency environment, artifact cache, model cache, helper cache,
Desktop/UI/IPC runtime control, telemetry, installer, packaging, update,
release-channel behavior, allowlist expansion, or production-facing claim was
retained or changed.

## Decision

```text
decision: prepared_verified_cleaned
reason: default-off explicit opt-in route enablement projection is implemented and verified, with deterministic fixture fallback and Command Router safety gates preserved.
follow-up: decide whether to open a separate local developer-alpha usage window, or keep Qwen enablement as internal evidence only.
```
