# Security

Jarvis-K handles local voice-provider credentials. Treat this repository and
its generated artifacts as credential-free.

## Credential Rules

- Do not commit provider credentials, signed URLs, query strings, screenshots
  containing credentials, or secret configuration values.
- Do not paste real provider credentials into chat, issues, PRs, logs, or test
  output.
- Store Xunfei RTASR credentials only through the Electron voice service
  settings window.
- The settings window stores encrypted configuration with Electron
  `safeStorage` under the app user-data directory.
- Core Host receives credentials through private child-process IPC. Credentials
  are never passed through argv, React state, public command IPC, or `.env`.

## If A Credential Is Exposed

1. Revoke or rotate the exposed key in the provider console immediately.
2. Clear the local Jarvis-K voice service settings.
3. Save the rotated credential through the local settings window.
4. Run a leak scan before committing:

```powershell
rg -n --hidden --glob '!node_modules/**' --glob '!dist/**' `
  "appid=|signa=|apiKey|APIKey|secret|credential" .
```

Review matches manually. Field names and test placeholders are expected; real
values and signed URLs are not.

## Real Provider Tests

Real Xunfei acceptance is opt-in and must stay out of default CI:

```powershell
$env:JARVIS_K_REAL_PROVIDER_ACCEPTANCE='1'
npm run acceptance:xunfei
```

The script records redacted status and metrics only. It must not print
credentials or signed URLs.

