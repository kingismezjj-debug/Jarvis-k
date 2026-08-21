# Jarvis-K Windows Alpha Installation

Updated: 2026-08-20

## Artifact

The Windows Alpha package is built with Electron Builder for Windows x64.

- Installer script: `npm run package:windows:alpha`
- Unpacked verification script: `npm run verify:package:windows`
- Output directory: `artifacts/packaged`
- Version: `0.1.0-alpha.4`
- Product name: `Jarvis-K Alpha`
- App ID / AppUserModelId: `com.jarvis-k.desktop.alpha`
- Installer name pattern: `Jarvis-K Alpha-0.1.0-alpha.4-windows-x64-unsigned-alpha-setup.exe`
- Unpacked executable: `artifacts/packaged/win-unpacked/Jarvis-K Alpha.exe`

`0.1.0-alpha.1` is superseded and should not be installed or shared. Its
packaged main process could not resolve workspace runtime dependencies outside
the monorepo.

`0.1.0-alpha.3` is superseded and should not be used for launch-at-login
acceptance. Windows could create the login item, but the desktop status
projection could misread the registered item as disabled.

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

The unsigned Alpha uses an isolated release-channel namespace. It does not read, write, migrate, or copy development data.

- Alpha roaming / Electron `userData`: `%APPDATA%\Jarvis-K-Alpha`
- Alpha local data: `%LOCALAPPDATA%\Jarvis-K-Alpha`
- Development roaming: `%APPDATA%\Jarvis-K`
- Development local data: `%LOCALAPPDATA%\Jarvis-K`

Settings, onboarding state, Developer Mode preference, and Electron safe-storage provider settings live under the Alpha roaming namespace. Task, Memory, aliases, plugin local state, model registry/cache, logs, Voice Regression, Pilot repositories, session/cache files, SQLite databases, and retained Qwen markers live under the Alpha local namespace.

Credential-backed provider settings use Electron safe storage through the desktop secure store service. Alpha starts with blank provider configuration and does not read development API keys. Do not place Voice Regression pilot repositories in the project, `Documents`, `datasets`, or `reports`; use `%LOCALAPPDATA%\Jarvis-K-Alpha` when redirecting them for manual evaluation.

Uninstall removes Alpha program files and shortcuts only. User data is retained by default and is separate from development data.

## First Run

On first launch, Jarvis-K shows a lightweight onboarding panel.

It explains:

- local-first privacy defaults;
- Voice Regression Level 0 is off by default;
- audio collection is unsupported;
- upload is off;
- Alpha uses blank settings and requires provider setup again;
- microphone and provider setup are explicit user actions;
- close hides to tray by default;
- Developer and Evaluation tools are hidden from ordinary product mode.

Completing or skipping onboarding only updates local desktop settings.

## Tray Behavior

By default, closing the main window hides Jarvis-K to the tray.

- Use the tray menu to show the window again.
- Use the tray menu `Quit Jarvis-K` action, or set close behavior to quit, for full shutdown.
- Full quit stops CoreHost, voice capture, and Qwen runtime control processes.

## Launch At Login

Launch at login is a user-controlled product setting for packaged Alpha and
future Stable builds only.

- Default: OFF.
- Implementation: Electron `app.setLoginItemSettings` /
  `app.getLoginItemSettings`.
- Startup argument: `--jarvis-startup=login`.
- Login startup creates the tray/CoreHost runtime but keeps the main window
  hidden until the user opens Jarvis-K from the tray.
- Development and test builds do not register real Windows startup items.
- The Alpha uninstall script removes only the `Jarvis-K Alpha` startup entry and
  does not delete Alpha or development user data.

## Verification

Before sharing an Alpha artifact, run:

```powershell
npm run verify:package:windows
npm test
npm run verify
```

The packaged verification checks:

- every packaged runtime bare import resolves from `resources/app` rather than
  the monorepo or developer `node_modules`;
- required runtime resources are present;
- development datasets, reports, docs, tests, scripts, model artifacts, logs, and database files are absent from the package;
- no developer-machine absolute path is present in packaged text resources;
- the copied packaged executable can launch from a temporary directory with
  module resolution isolated from the repository;
- first-run onboarding can complete;
- packaged close-to-tray works;
- restore does not restart CoreHost;
- explicit quit leaves no CoreHost child process.

## Out Of Scope

This Alpha packaging step does not include:

- code signing;
- auto-update;
- portable build;
- Microsoft Store publishing;
- real Windows task acceptance;
- microphone or real ASR acceptance;
- Desktop Pet, Skin Studio, or plugin marketplace packaging.
