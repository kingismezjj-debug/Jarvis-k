import path from "node:path";
import { BrowserWindow } from "electron";

export function createVoiceSettingsWindow(
  parent: BrowserWindow | null
): BrowserWindow {
  const window = new BrowserWindow({
    width: 520,
    height: 520,
    minWidth: 520,
    minHeight: 520,
    maxWidth: 680,
    maxHeight: 720,
    ...(parent ? { parent } : {}),
    title: "Jarvis-K Voice Service",
    show: false,
    resizable: true,
    backgroundColor: "#11110f",
    webPreferences: {
      preload: path.join(__dirname, "settings-preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.setMenuBarVisibility(false);
  window.once("ready-to-show", () => window.show());
  void window.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(settingsHtml)}`
  );
  return window;
}

const settingsHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:;"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Jarvis-K Voice Service</title>
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
        min-width: 520px;
        min-height: 520px;
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
        border-color: var(--border);
        background: var(--panel);
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 68px;
        padding: 0 20px;
        border-bottom: 1px solid var(--border);
      }

      h1 {
        margin: 0;
        font-size: 17px;
        line-height: 24px;
      }

      p {
        margin: 0;
      }

      .subtle {
        color: var(--muted);
        font-size: 12px;
        line-height: 18px;
      }

      .content {
        display: grid;
        gap: 16px;
        padding: 20px;
      }

      .status {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 12px;
        min-height: 52px;
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel);
      }

      .status strong,
      label {
        font-size: 12px;
        line-height: 18px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 86px;
        height: 28px;
        padding: 0 10px;
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--muted);
        font-size: 11px;
      }

      .pill[data-tone="success"] {
        border-color: rgba(115, 201, 145, 0.45);
        color: var(--success);
      }

      .pill[data-tone="danger"] {
        border-color: rgba(239, 111, 108, 0.45);
        color: var(--danger);
      }

      form {
        display: grid;
        gap: 14px;
      }

      .field {
        display: grid;
        gap: 7px;
      }

      input,
      select {
        width: 100%;
        height: 40px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel-strong);
        color: var(--text);
        font: inherit;
        font-size: 13px;
        outline: none;
        padding: 0 11px;
      }

      input:focus,
      select:focus {
        border-color: rgba(230, 197, 104, 0.72);
        box-shadow: 0 0 0 3px rgba(230, 197, 104, 0.16);
      }

      .message {
        min-height: 20px;
        color: var(--muted);
        font-size: 12px;
        line-height: 20px;
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
        height: 36px;
        min-width: 84px;
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

      button.danger {
        color: var(--danger);
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
        <div>
          <h1>Voice Service</h1>
          <p class="subtle">Xunfei RTASR</p>
        </div>
        <span class="pill" id="statusPill">CHECKING</span>
      </header>
      <section class="content">
        <div class="status">
          <div>
            <strong>Secure Storage</strong>
            <p class="subtle" id="storageStatus">Checking local protection.</p>
          </div>
          <span class="pill" id="languagePill">ZH</span>
        </div>
        <form id="settingsForm">
          <div class="field">
            <label for="appId">AppID</label>
            <input
              id="appId"
              name="appId"
              autocomplete="off"
              spellcheck="false"
              required
            />
          </div>
          <div class="field">
            <label for="apiKey">APIKey</label>
            <input
              id="apiKey"
              name="apiKey"
              autocomplete="new-password"
              spellcheck="false"
              required
              type="password"
            />
          </div>
          <div class="field">
            <label for="language">Language</label>
            <select id="language" name="language">
              <option value="zh">Chinese</option>
              <option value="en">English</option>
            </select>
          </div>
          <p class="message" id="message"></p>
        </form>
      </section>
      <footer>
        <button class="danger" id="clearButton" type="button">Clear</button>
        <button id="closeButton" type="button">Close</button>
        <button class="primary" form="settingsForm" id="saveButton" type="submit">
          Save
        </button>
      </footer>
    </main>
    <script>
      const bridge = window.jarvisVoiceSettings;
      const form = document.getElementById("settingsForm");
      const statusPill = document.getElementById("statusPill");
      const storageStatus = document.getElementById("storageStatus");
      const languagePill = document.getElementById("languagePill");
      const message = document.getElementById("message");
      const clearButton = document.getElementById("clearButton");
      const closeButton = document.getElementById("closeButton");
      const saveButton = document.getElementById("saveButton");

      function setMessage(text, tone) {
        message.textContent = text;
        message.dataset.tone = tone || "";
      }

      function renderStatus(status) {
        statusPill.textContent = status.configured ? "CONFIGURED" : "MISSING";
        statusPill.dataset.tone = status.configured ? "success" : "danger";
        storageStatus.textContent = status.secureStorageAvailable
          ? "Local protection is available."
          : "Local protection is unavailable.";
        languagePill.textContent = (status.language || "zh").toUpperCase();
        clearButton.disabled = !status.configured;
        saveButton.disabled = !status.secureStorageAvailable;
      }

      async function refresh() {
        try {
          renderStatus(await bridge.getStatus());
        } catch {
          setMessage("Unable to read voice service status.", "danger");
        }
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        setMessage("", "");
        saveButton.disabled = true;
        const formData = new FormData(form);
        const result = await bridge.save({
          appId: String(formData.get("appId") || ""),
          apiKey: String(formData.get("apiKey") || ""),
          language: String(formData.get("language") || "zh") === "en" ? "en" : "zh"
        });
        if (result.ok) {
          form.reset();
          renderStatus(result.status);
          setMessage("Saved. Voice service will restart.", "success");
        } else {
          if (result.status) {
            renderStatus(result.status);
          }
          setMessage(result.message, "danger");
        }
        saveButton.disabled = false;
      });

      clearButton.addEventListener("click", async () => {
        const result = await bridge.clear();
        if (result.ok) {
          renderStatus(result.status);
          setMessage("Cleared. Voice service will restart.", "success");
        } else {
          setMessage(result.message, "danger");
        }
      });

      closeButton.addEventListener("click", () => bridge.close());
      void refresh();
    </script>
  </body>
</html>`;
