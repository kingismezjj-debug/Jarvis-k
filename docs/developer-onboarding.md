# Developer Onboarding

This document is the shortest path from clone to a verified local Jarvis-K
desktop build.

## 1. Install

```powershell
npm install
```

Jarvis-K requires Node.js `>=22.12.0`.

## 2. Verify

```powershell
npm run verify
```

`verify` runs type checks, unit and integration tests, dependency-boundary
checks, and a production build.

## 3. Launch

```powershell
npm run start
```

Use `npm run dev` to build before launching.

## 4. Configure Voice

1. Open the voice service settings from the left sidebar settings button.
2. Save Xunfei RTASR `AppID` and a rotated `APIKey`.
3. Press and hold the microphone button, speak, then release.
4. Watch `VOICE FRAMES`, `VOICE RMS`, `VOICE PEAK`, and `VOICE TRANSCRIPT`.

If `VOICE FRAMES` stays at `0`, the renderer did not capture microphone audio.
If frames increase but `RMS` and `PEAK` stay near `0`, the selected microphone
is silent or too quiet. If audio metrics look healthy but transcript quality is
poor, check provider language, environment noise, and account/service status.

## 5. Optional Desktop Smoke

```powershell
npm run smoke:desktop
```

The smoke test uses fake media and fake providers. It does not call Xunfei.

## 6. Optional Real Provider Acceptance

```powershell
$env:JARVIS_K_REAL_PROVIDER_ACCEPTANCE='1'
npm run acceptance:xunfei
```

This requires local encrypted credentials saved through the settings window.
It should be run manually, not in default CI.

## Commit Checklist

- `npm run verify`
- `npm run smoke:desktop` for desktop-facing changes
- `npm run check:boundaries`
- `npm run check:sensitive-artifacts`
- Update `scripts/check-boundaries.mjs` intentionally if a future Phase 5
  provider introduces a real model runtime dependency.
- Leak scan when voice-provider code changes
- No changes to `E:\bailongma` or `C:\Users\Administrator\Jarvis-ui`
