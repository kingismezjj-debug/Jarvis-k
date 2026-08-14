# Chat Answer Text-Only Deterministic Blocked Route Fixture Evidence

Recorded: 2026-08-08

## Scope

Implemented a fixture-only deterministic blocked route for Chat Answer
text-only acceptance. The trigger is active only when
`textOnlyAcceptance.enabled === true`.

## Evidence

- The fixed phrases `blocked fixture` and `text-only blocked` route to
  `blocked` only in text-only acceptance mode.
- Normal default behavior is preserved: the same phrase routes to
  `chat.answer` outside text-only acceptance mode.
- In text-only acceptance mode, the blocked route is delegated to the bounded
  Chat Answer fixture provider so the result includes
  `chatAnswer.status="blocked"`.
- No direct action is attempted.
- No raw provider response or credential is exposed.

## Verification

- Core build passed.
- Core Host build passed.
- Desktop build passed.
- Core runtime test file passed: 62 tests.
- Combined text-only fixture suite passed: 6 files, 99 tests.
- Dependency boundary check passed.
- Sensitive artifact guard passed.
- `git diff --check` passed.

No Electron runtime or manual acceptance window was started for this
implementation evidence.
