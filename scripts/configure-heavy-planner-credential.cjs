const path = require("node:path");
const { app, BrowserWindow, ipcMain, safeStorage } = require("electron");
const {
  SecureHeavyPlannerProviderStore
} = require("../apps/desktop/dist/secure-heavy-planner-provider-store.js");

const SUBMIT_CHANNEL = "jarvis-k:heavy-planner-credential:submit";
const CANCEL_CHANNEL = "jarvis-k:heavy-planner-credential:cancel";

app.on("window-all-closed", (event) => {
  event.preventDefault();
});

void app
  .whenReady()
  .then(configureCredential)
  .then((status) => {
    console.log(
      JSON.stringify({
        status: status.status,
        credentialConfigured: status.credentialConfigured,
        credentialExposed: status.credentialExposed,
        networkAccessApproved: status.networkAccessApproved
      })
    );
  })
  .catch((error) => {
    console.error(sanitizeFailureCode(error));
    process.exitCode = 1;
  })
  .finally(() => {
    app.quit();
  });

async function configureCredential() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("SECURE_STORAGE_UNAVAILABLE");
  }

  const store = new SecureHeavyPlannerProviderStore(
    path.join(app.getPath("userData"), "jarvis-k-heavy-planner-provider.json"),
    {
      isAvailable: () => safeStorage.isEncryptionAvailable(),
      encrypt: (value) => safeStorage.encryptString(value),
      decrypt: (value) => safeStorage.decryptString(value)
    }
  );
  return openCredentialWindow(store);
}

function openCredentialWindow(store) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let submissionPending = false;
    const window = new BrowserWindow({
      width: 460,
      height: 322,
      minWidth: 460,
      minHeight: 322,
      maxWidth: 460,
      maxHeight: 322,
      resizable: false,
      show: false,
      title: "Jarvis-K Heavy Planner",
      backgroundColor: "#11110f",
      webPreferences: {
        preload: path.join(
          __dirname,
          "configure-heavy-planner-credential-preload.cjs"
        ),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        devTools: false
      }
    });

    const cleanup = () => {
      ipcMain.removeHandler(SUBMIT_CHANNEL);
      ipcMain.removeListener(CANCEL_CHANNEL, onCancel);
    };

    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      if (!window.isDestroyed()) {
        window.close();
      }
      resolve(result);
    };

    const cancel = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(new Error("CREDENTIAL_CONFIGURATION_CANCELLED"));
    };

    const onCancel = (event) => {
      if (event.sender.id === window.webContents.id) {
        cancel();
      }
    };

    ipcMain.handle(SUBMIT_CHANNEL, async (event, rawInput) => {
      if (
        settled ||
        submissionPending ||
        event.sender.id !== window.webContents.id
      ) {
        return { ok: false, reasonCode: "CREDENTIAL_CONFIGURATION_FAILED" };
      }

      let apiKey;
      try {
        apiKey = parseCredentialInput(rawInput);
      } catch (error) {
        return { ok: false, reasonCode: sanitizeFailureCode(error) };
      }

      submissionPending = true;
      try {
        await store.save({
          provider: "openai",
          credentials: { apiKey }
        });
        const status = await store.status();
        setTimeout(() => finish(status), 250);
        return { ok: true };
      } catch {
        submissionPending = false;
        return { ok: false, reasonCode: "CREDENTIAL_CONFIGURATION_FAILED" };
      }
    });
    ipcMain.on(CANCEL_CHANNEL, onCancel);

    window.setMenuBarVisibility(false);
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event) => {
      event.preventDefault();
    });
    window.once("ready-to-show", () => window.show());
    window.on("closed", () => {
      if (!settled) {
        cancel();
      }
    });
    void window
      .loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(credentialHtml)}`
      )
      .catch(() => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error("CREDENTIAL_CONFIGURATION_FAILED"));
        }
      });
  });
}

function parseCredentialInput(value) {
  const raw =
    typeof value === "object" && value !== null ? value : Object.create(null);
  const first = typeof raw.first === "string" ? raw.first.trim() : "";
  const second = typeof raw.second === "string" ? raw.second.trim() : "";
  if (first.length === 0 || first !== second) {
    throw new Error("CREDENTIAL_CONFIRMATION_FAILED");
  }
  if (first.length > 512) {
    throw new Error("CREDENTIAL_CONFIGURATION_FAILED");
  }
  return first;
}

function sanitizeFailureCode(error) {
  const code = error instanceof Error ? error.message : "";
  return new Set([
    "SECURE_STORAGE_UNAVAILABLE",
    "CREDENTIAL_CONFIRMATION_FAILED",
    "CREDENTIAL_CONFIGURATION_CANCELLED"
  ]).has(code)
    ? code
    : "CREDENTIAL_CONFIGURATION_FAILED";
}

const credentialHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Jarvis-K Heavy Planner</title>
    <style>
      :root {
        color-scheme: dark;
        --background: #11110f;
        --panel: #181816;
        --panel-strong: #20201d;
        --border: #34342f;
        --text: #f3f1ea;
        --muted: #a6a196;
        --primary: #e6c568;
        --primary-text: #17130a;
        --danger: #ef6f6c;
        --success: #73c991;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-width: 460px;
        min-height: 322px;
        background: var(--background);
        color: var(--text);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
      }

      main {
        display: grid;
        grid-template-rows: auto 1fr auto;
        min-height: 100vh;
      }

      header,
      footer {
        background: var(--panel);
      }

      header {
        padding: 18px 20px 16px;
        border-bottom: 1px solid var(--border);
      }

      h1,
      p {
        margin: 0;
      }

      h1 {
        font-size: 17px;
        line-height: 24px;
      }

      .subtle,
      .message,
      label {
        font-size: 12px;
        line-height: 18px;
      }

      .subtle,
      .message {
        color: var(--muted);
      }

      .content {
        display: grid;
        gap: 14px;
        padding: 18px 20px;
      }

      form,
      .field {
        display: grid;
        gap: 7px;
      }

      input {
        width: 100%;
        height: 40px;
        border: 1px solid var(--border);
        border-radius: 8px;
        outline: none;
        background: var(--panel-strong);
        color: var(--text);
        font: inherit;
        font-size: 13px;
        padding: 0 11px;
      }

      input:focus {
        border-color: rgba(230, 197, 104, 0.72);
        box-shadow: 0 0 0 3px rgba(230, 197, 104, 0.16);
      }

      .message {
        min-height: 18px;
      }

      .message[data-tone="danger"] {
        color: var(--danger);
      }

      .message[data-tone="success"] {
        color: var(--success);
      }

      footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 14px 20px;
        border-top: 1px solid var(--border);
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 84px;
        height: 36px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel-strong);
        color: var(--text);
        font: inherit;
        font-size: 12px;
        font-weight: 600;
      }

      button.primary {
        border-color: var(--primary);
        background: var(--primary);
        color: var(--primary-text);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Heavy Planner Credential</h1>
        <p class="subtle">OpenAI API key</p>
      </header>
      <section class="content">
        <form id="credentialForm">
          <div class="field">
            <label for="apiKey">OpenAI API key</label>
            <input
              id="apiKey"
              name="apiKey"
              autocomplete="off"
              spellcheck="false"
              type="password"
              required
              autofocus
            />
          </div>
          <div class="field">
            <label for="confirmApiKey">Confirm API key</label>
            <input
              id="confirmApiKey"
              name="confirmApiKey"
              autocomplete="off"
              spellcheck="false"
              type="password"
              required
            />
          </div>
        </form>
        <p class="message" id="message" aria-live="polite"></p>
      </section>
      <footer>
        <button id="cancelButton" type="button">Cancel</button>
        <button
          class="primary"
          form="credentialForm"
          id="saveButton"
          type="submit"
        >
          Save
        </button>
      </footer>
    </main>
    <script>
      const bridge = window.jarvisHeavyPlannerCredential;
      const form = document.getElementById("credentialForm");
      const apiKey = document.getElementById("apiKey");
      const confirmApiKey = document.getElementById("confirmApiKey");
      const cancelButton = document.getElementById("cancelButton");
      const saveButton = document.getElementById("saveButton");
      const message = document.getElementById("message");

      function setMessage(text, tone) {
        message.textContent = text;
        message.dataset.tone = tone || "";
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        saveButton.disabled = true;
        cancelButton.disabled = true;
        setMessage("", "");
        try {
          const result = await bridge.submit(apiKey.value, confirmApiKey.value);
          apiKey.value = "";
          confirmApiKey.value = "";
          if (result.ok) {
            setMessage("Credential saved.", "success");
            return;
          }
          setMessage(
            result.reasonCode === "CREDENTIAL_CONFIRMATION_FAILED"
              ? "The entries do not match."
              : "Credential could not be saved.",
            "danger"
          );
        } catch {
          setMessage("Credential could not be saved.", "danger");
        }
        saveButton.disabled = false;
        cancelButton.disabled = false;
      });

      cancelButton.addEventListener("click", () => {
        apiKey.value = "";
        confirmApiKey.value = "";
        bridge.cancel();
      });
    </script>
  </body>
</html>`;
