# Phase 2 Progress

Last updated: 2026-07-30

Status: COMPLETE

Automation: PAUSED

Rollback marker: `phase-1-baseline`

Current gate: phase 2 exit conditions are complete. Offline deterministic
acceptance, real Xunfei connectivity acceptance, encrypted local credential
storage, and manual spoken PTT confirmation have passed.

## Waves

| Wave | Status | Evidence |
| --- | --- | --- |
| 2.0 Freeze and guardrails | Completed | Baseline `1f3376a`; packages and boundary policy created; four Bailongma voice tests passed |
| 2.1 Contracts and mock Voice Engine | Completed | Protocol v1, deterministic state machine, cancellation, Core injection, event correlation, and snapshots tested |
| 2.2 Browser capture and binary transport | Completed | End-to-end bounded binary transport, one capture owner, AudioWorklet-first backend, explicit fallback, stale-frame rejection, unified stop intents, and Electron reload disposal smoke passed |
| 2.3 Xunfei PTT adapter | Completed | Full gate passed with signing, parsing, bounded buffering, retries, silence finalization, duplicate suppression, one reusable 30-second-idle connection, and transparent unexpected-disconnect recovery covered by fake sockets |
| 2.4 Continuous mode and TTS coordination | Completed | Full gate passed: mode switching, TTS suspension/resume, barge-in, deterministic recovery, and PTT overlay preserve one capture identity and never overlap provider session owners |
| 2.5 Electron acceptance and stability | Completed | Final offline gate passed with permission/keyboard/reload/Core restart, exact PCM, fault recovery, explicit metrics, and a 100-cycle PTT soak with one connection and zero failures |

## Constraints

- Do not modify `E:\bailongma`.
- Do not modify `C:\Users\Administrator\Jarvis-ui`.
- Do not log, commit, screenshot, or echo credentials.
- Do not import a concrete provider into Contracts, Core, Desktop, or UI.
- Do not start phase 3 work.

## Next Action

Keep automation paused. Phase 2 is ready to commit and tag as the voice-engine
baseline.

## Latest Verification

- `npm run typecheck`: passed
- `npm test`: 18 files, 83 tests passed
- `npm run check:boundaries`: passed
- Electron `safeStorage` voice service settings: passed; configuration is
  encrypted at rest, the main React UI can only open the settings window, and
  Core Host receives credentials only through private child IPC
- Real Xunfei acceptance: passed with `JARVIS_K_REAL_PROVIDER_ACCEPTANCE=1`;
  secure configuration was present, real provider connection established in
  1,528 ms, 3/3 PTT lifecycle cycles completed, and Voice Engine returned to
  `ready`
- Spoken microphone PTT: passed by manual user confirmation after the browser
  capture path was updated to aggregate 16 kHz PCM into stable 40 ms / 1,280
  byte frames, flush partial tail audio on stop/dispose, and request browser
  echo cancellation, noise suppression, automatic gain control, and mono input
- Voice quality diagnostics: UI now shows visible `VOICE FRAMES`, `VOICE RMS`,
  `VOICE PEAK`, and `VOICE TRANSCRIPT` indicators to distinguish capture
  problems from provider recognition quality
- Real Xunfei acceptance artifacts:
  `artifacts/jarvis-k-phase-2-real-xunfei-metrics.json` and
  `artifacts/jarvis-k-phase-2-real-xunfei.png`
- Leak scan: passed for exposed old credential values, `appid=`, and `signa=`
  across tracked source and generated phase artifacts
- Targeted Xunfei adapter tests: 2 files, 6 tests passed, including bounded
  audio recovery with exactly one live fake socket
- Continuous strategy tests: 1 file, 4 tests passed
- Targeted Voice Engine tests: 2 files, 15 tests passed, including idle mode
  switching with one provider session and one continuous capture identity
- Continuous TTS target: 1 file, 12 tests passed; upload is blocked during
  speech and resumes with the same capture and provider session
- Barge-in target: 2 files, 21 tests passed; interruption event order and
  resource reuse are verified
- Continuous recovery target: 2 files, 17 tests passed; old session closes
  before replacement and the original capture identity is restored
- PTT overlay target: 2 files, 19 tests passed; continuous capture/provider
  resources are reused and continuous listening resumes after finalization
- Electron permission/keyboard smoke: passed with granted and denied paths,
  one request under repeated keydown, keyup/reload release, and Core restart;
  3 capture requests and 4 released tracks observed across all scenarios
- Deterministic PCM fixture: 3 frames crossed binary IPC and produced the exact
  final transcript `deterministic fixture frames=3`; startup 707 ms
- Provider fault injection: one recovery completed with `connections=1` and
  `maxActive=1`; neither Electron nor Core restarted; startup 691 ms
- Wave 2.5 metrics: 100/100 PTT cycles passed in 1116 ms, one provider
  connection, zero connect-limit errors, 34 ms recovery, main RSS delta
  18,010,112 bytes, Core working-set delta 4,005,888 bytes
- Wave 2.5 screenshot:
  `artifacts/jarvis-k-phase-2-wave-2-5-desktop.png`
- Final `npm run verify`: passed
- Final Electron smoke: passed, including 100-cycle soak, active capture reload
  disposal, provider recovery, and Core restart; startup 1410 ms
- Voice settings window smoke: passed; status window opens, reports local
  protection as available, and screenshot was recorded at
  `artifacts/jarvis-k-voice-settings.png`
- Wave 2.2 screenshot:
  `artifacts/jarvis-k-phase-2-wave-2-2-desktop.png`
