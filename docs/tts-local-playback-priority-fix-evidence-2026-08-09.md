# TTS Local Playback Priority Fix Evidence

Recorded: 2026-08-09

## Scope

This evidence records the TTS playback failure reported after restarting
Jarvis-K and the bounded fix that made audible playback work again.

The change stays within the existing result-playback surface:

```text
completed safe Brain result
  -> Product Alpha TTS safety gate
  -> explicit playback button
  -> local speechSynthesis first when Local result playback is enabled
  -> cloud Doubao TTS only when local playback is not explicitly enabled
```

## Reported Symptom

The user reported:

```text
TTS 播报失败
```

After the first status-refresh fix, the user reported:

```text
还是没有播报
```

The observed UI path was Command Router product mode fixture-only, including:

- `open notepad`
- `open GitHub`
- `open vscode`

Only `open notepad` is a completed safe fixture dry-run and therefore eligible
for result playback. Browser projection and blocked local-app routes remain
non-executing safety projections.

## Diagnosis

Sanitized TTS provider status check:

```powershell
electron tests/tts-provider-status-diagnostic.cjs
```

Result:

```json
{
  "status": "PASS",
  "secureStorageAvailable": true,
  "configured": true,
  "provider": "doubao",
  "voiceId": "zh_female_xiaohe_uranus_bigtts",
  "resourceId": "seed-tts-2.0",
  "credentialExposed": false
}
```

Sanitized cloud synthesis check:

```powershell
electron tests/tts-provider-synthesis-diagnostic.cjs
```

Result:

```json
{
  "status": "PASS",
  "provider": "doubao",
  "ok": true,
  "audioByteBucket": "medium",
  "contentType": "text/event-stream",
  "credentialExposed": false
}
```

UI playback smoke:

```powershell
node tests/desktop-tts-playback-smoke.mjs
```

Result:

```json
{
  "status": "PASS",
  "ttsStatus": "played",
  "ttsError": null,
  "credentialExposed": false
}
```

Interpretation:

- secure storage and TTS configuration were readable;
- Doubao returned playable audio bytes;
- the renderer could drive playback to `played`;
- the user's no-audio symptom was most consistent with the cloud audio output
  path being silent at the OS/device/mixer layer, not with provider failure.

## Fix

Updated `apps/ui/src/App.tsx` so explicit local playback wins:

- when `Local result playback` is enabled, `Play result` uses browser
  `speechSynthesis` first;
- cloud Doubao audio is used only when local playback is not explicitly enabled;
- completed safe results refresh TTS service status so eligible playback does
  not remain visually stuck at `disabled`;
- the Product Alpha playback status can display `eligible` when the safety gate
  and an available playback path are both present.

This keeps TTS default-off and preserves the existing safety gate:

- only completed safe results are eligible;
- blocked or confirmation-required routes remain ineligible;
- no automatic app/browser action execution was enabled;
- no API key, raw provider response, audio bytes, transcript, or raw diagnostic
  payload was written to evidence.

## Manual Acceptance

After rebuild and restart, the user enabled `Local result playback`, ran the
fixture-only Command Router path, and reported:

```text
有声音了
```

Manual evidence screenshot was provided in the conversation showing:

- Jarvis-K online;
- Command Router fixture-only results for `open notepad`, `open GitHub`, and
  `open vscode`;
- `open notepad` completed as a fixture dry-run;
- browser and non-allowlisted local-app paths still did not execute real
  actions.

## Verification Commands

```powershell
npx.cmd vitest run apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/local-tts.test.ts apps/ui/test/use-jarvis-inference-source.test.ts
npm.cmd run build:ui
```

Both passed locally after the local-playback priority fix.

## Safety Boundaries

This fix did not enable:

- default-on TTS;
- automatic playback without a user action;
- microphone capture or ASR changes;
- real browser/local app/shell/process execution;
- Qwen runtime execution;
- provider-backed planning;
- Memory write/schema migration/vector retrieval;
- credential exposure or raw provider response persistence.

## Current Recommendation

For audible result playback during Command Router fixture-only acceptance:

```text
Settings -> enable Local result playback
Conversation -> run open notepad
Product Alpha -> Play result
```

Keep `Local result playback` enabled when local system speech is preferred over
cloud audio output.
