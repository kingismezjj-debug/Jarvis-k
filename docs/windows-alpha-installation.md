# Jarvis-K Windows Alpha Installation

Updated: 2026-08-20

## Artifact

The Windows Alpha package is built with Electron Builder for Windows x64.

- Installer script: `npm run package:windows:alpha`
- Unpacked verification script: `npm run verify:package:windows`
- Output directory: `artifacts/packaged`
- Installer name pattern: `Jarvis-K-0.1.0-windows-x64-unsigned-alpha-setup.exe`
- Unpacked executable: `artifacts/packaged/win-unpacked/Jarvis-K.exe`

## Signing Status

Alpha artifacts are intentionally unsigned.

- `forceCodeSigning` is disabled.
- Windows SmartScreen may warn on first launch.
- Do not publish this installer as a trusted public release until code signing is configured.

## Install Scope

The NSIS installer is configured for a per-user install.

- No elevation is requested by default.
- The installer does not auto-run Jarvis-K after finish.
- Desktop and Start Menu shortcuts are enabled.
- Uninstall does not delete Electron user data automatically.

## User Data

Runtime data is stored under Electron `app.getPath("userData")`, normally:

`%APPDATA%\Jarvis-K`

Credential-backed provider settings use Electron safe storage through the desktop secure store service. Do not place Voice Regression pilot repositories in the project, `Documents`, `datasets`, or `reports`; use `%LOCALAPPDATA%\Jarvis-K` when redirecting them for manual evaluation.

## First Run

On first launch, Jarvis-K shows a lightweight onboarding panel.

It explains:

- local-first privacy defaults;
- Voice Regression Level 0 is off by default;
- audio collection is unsupported;
- upload is off;
- microphone and provider setup are explicit user actions;
- close hides to tray by default;
- Developer and Evaluation tools are hidden from ordinary product mode.

Completing or skipping onboarding only updates local desktop settings.

## Tray Behavior

By default, closing the main window hides Jarvis-K to the tray.

- Use the tray menu to show the window again.
- Use the tray menu `Quit Jarvis-K` action, or set close behavior to quit, for full shutdown.
- Full quit stops CoreHost, voice capture, and Qwen runtime control processes.

## Verification

Before sharing an Alpha artifact, run:

```powershell
npm run verify:package:windows
npm test
npm run verify
```

The packaged verification checks:

- required runtime resources are present;
- development datasets, reports, docs, tests, scripts, model artifacts, logs, and database files are absent from the package;
- no developer-machine absolute path is present in packaged text resources;
- first-run onboarding can complete;
- packaged close-to-tray works;
- restore does not restart CoreHost;
- explicit quit leaves no CoreHost child process.

## Out Of Scope

This Alpha packaging step does not include:

- code signing;
- auto-update;
- startup at login;
- portable build;
- Microsoft Store publishing;
- real Windows task acceptance;
- microphone or real ASR acceptance;
- Desktop Pet, Skin Studio, or plugin marketplace packaging.
