# Command Router Voice Manual Acceptance Closeout

Recorded: 2026-08-09

## Status

`ACCEPTED_DEVELOPER_ALPHA`

The bounded Voice Command Router manual acceptance window is closed for the
approved developer-alpha scope.

## Accepted Surface

Accepted path:

```text
microphone/PTT
  -> ASR final transcript
  -> agent.runBrainCommand source voice
  -> default-off Command Router product mode enabled by the user
  -> deterministic fixture router
  -> fixture dry-run projection
  -> explicit UI confirmation for Notepad/Calculator only
  -> native confirmation dialog
  -> sanitized result
```

Accepted observations:

- voice capture and final transcript path worked after a retry;
- voice BrainCommand reached the Command Router path;
- Notepad followed the same fixture dry-run and confirmation path as text;
- Calculator followed the same fixture dry-run and confirmation path as text;
- VS Code remained blocked;
- no unexpected windows or processes were reported;
- no raw spoken text, transcript, audio, provider payload, or credential was
  recorded as evidence.

## Degraded/Recovered Note

The first reported voice attempt fell to `chat.answer` unavailable deterministic
fallback. This was treated as a non-dangerous routing miss. The user retried and
reported:

```text
already can
```

The final evidence records the window as accepted based on the user's
sanitized report that the voice path then matched expected behavior.

## Evidence

Approval:

```text
docs/command-router-voice-manual-acceptance-approval-request-2026-08-09.md
```

Manual evidence:

```text
docs/command-router-voice-manual-acceptance-evidence-2026-08-09.md
```

Preflight:

```text
focused tests: PASS, 5 files, 131 tests
core build: PASS
core-host build: PASS
ui build: PASS
desktop build: PASS
fixture suite: PASS, 4 smoke paths, duration 8657 ms
```

## Safety Boundary

This closeout does not approve:

- additional local apps;
- arbitrary voice app control;
- browser or URL opening;
- shell, PowerShell, cmd, Terminal, scripts, or arbitrary executable paths;
- command-line arguments;
- filesystem, clipboard, screen, network, or general process-management tools;
- raw transcript/audio/provider evidence persistence;
- Qwen runtime execution;
- provider-backed planning or model-driven tool invocation;
- Memory vector retrieval;
- allowlist expansion;
- default-on TTS or automatic playback;
- telemetry, installer/update, packaging, or release-channel behavior.

## Next Step

The next product step is Qwen fast router product binding preparation:

```text
text/voice command
  -> default-off Qwen fast router product slot
  -> strict artifact/runtime readiness checks
  -> sanitized structured intent candidates
  -> deterministic fallback on unavailable/invalid/low-confidence output
  -> existing Command Router safety gates
  -> no direct Qwen execution authority
```

This next step is preparation and approval/evidence only unless a fresh bounded
Product/Security/Release approval explicitly authorizes implementation.

Prepared approval/evidence window:

```text
docs/qwen-fast-router-product-binding-preparation-approval-request-2026-08-09.md
docs/qwen-fast-router-product-binding-preparation-evidence-2026-08-09.md
```

Preparation closeout:

```text
docs/qwen-fast-router-product-binding-preparation-closeout-2026-08-09.md
```
