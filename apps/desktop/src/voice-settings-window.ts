import path from "node:path";
import { BrowserWindow } from "electron";

export function createVoiceSettingsWindow(
  parent: BrowserWindow | null
): BrowserWindow {
  const window = new BrowserWindow({
    width: 520,
    height: 820,
    minWidth: 520,
    minHeight: 760,
    maxWidth: 680,
    maxHeight: 960,
    ...(parent ? { parent } : {}),
    title: "Jarvis-K Voice & TTS Service",
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
        overflow-y: auto;
        background: var(--background);
        color: var(--text);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
      }

      main {
        display: flex;
        flex-direction: column;
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
        flex: 0 0 auto;
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
          <h1>Voice & TTS Service</h1>
          <p class="subtle" id="providerSubtitle">Xunfei RTASR</p>
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
            <label for="provider">Provider</label>
            <select id="provider" name="provider">
              <option value="xunfei">Xunfei RTASR</option>
              <option value="volcengine">Volcengine Bigmodel ASR</option>
            </select>
          </div>
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
            <label for="apiKey" id="apiKeyLabel">APIKey</label>
            <input
              id="apiKey"
              name="apiKey"
              autocomplete="new-password"
              spellcheck="false"
              required
              type="password"
            />
          </div>
          <div class="field" id="resourceIdField">
            <label for="resourceId">Resource ID</label>
            <input
              id="resourceId"
              name="resourceId"
              autocomplete="off"
              spellcheck="false"
              value="volc.seedasr.sauc.duration"
            />
            <p class="subtle">Use volc.bigasr.sauc.duration if your account is opened on the older resource.</p>
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
      <section class="content" style="border-top: 1px solid var(--border);">
        <div class="status">
          <div>
            <strong>TTS Service</strong>
            <p class="subtle" id="ttsProviderSubtitle">Doubao cloud TTS</p>
          </div>
          <span class="pill" id="ttsStatusPill">CHECKING</span>
        </div>
        <form id="ttsSettingsForm">
          <div class="field">
            <label for="ttsProvider">Provider</label>
            <select id="ttsProvider" name="ttsProvider">
              <option value="doubao">Doubao</option>
            </select>
          </div>
          <div class="field">
            <label for="ttsApiKey">API Key</label>
            <input
              id="ttsApiKey"
              name="ttsApiKey"
              autocomplete="new-password"
              spellcheck="false"
              required
              type="password"
            />
          </div>
          <div class="field">
            <label for="ttsVoiceId">Voice ID</label>
            <input
              id="ttsVoiceId"
              name="ttsVoiceId"
              autocomplete="off"
              spellcheck="false"
              value="zh_female_xiaohe_uranus_bigtts"
            />
          </div>
          <div class="field">
            <label for="ttsResourceId">Resource ID</label>
            <input
              id="ttsResourceId"
              name="ttsResourceId"
              autocomplete="off"
              spellcheck="false"
              value="seed-tts-2.0"
            />
            <p class="subtle">Leave empty to auto-select a Doubao resource ID from the voice id.</p>
          </div>
          <p class="message" id="ttsMessage"></p>
        </form>
      </section>
      <footer>
        <button class="danger" id="clearTtsButton" type="button">Clear TTS</button>
        <button class="primary" form="ttsSettingsForm" id="saveTtsButton" type="submit">
          Save TTS
        </button>
      </footer>
    </main>
    <script>
      const bridge = window.jarvisVoiceSettings;
      const form = document.getElementById("settingsForm");
      const provider = document.getElementById("provider");
      const providerSubtitle = document.getElementById("providerSubtitle");
      const appIdField = document.getElementById("appId").closest(".field");
      const apiKeyLabel = document.getElementById("apiKeyLabel");
      const resourceId = document.getElementById("resourceId");
      const resourceIdField = document.getElementById("resourceIdField");
      const statusPill = document.getElementById("statusPill");
      const storageStatus = document.getElementById("storageStatus");
      const languagePill = document.getElementById("languagePill");
      const message = document.getElementById("message");
      const clearButton = document.getElementById("clearButton");
      const closeButton = document.getElementById("closeButton");
      const saveButton = document.getElementById("saveButton");
      const ttsProvider = document.getElementById("ttsProvider");
      const ttsProviderSubtitle = document.getElementById("ttsProviderSubtitle");
      const ttsApiKey = document.getElementById("ttsApiKey");
      const ttsVoiceId = document.getElementById("ttsVoiceId");
      const ttsResourceId = document.getElementById("ttsResourceId");
      const ttsStatusPill = document.getElementById("ttsStatusPill");
      const ttsMessage = document.getElementById("ttsMessage");
      const clearTtsButton = document.getElementById("clearTtsButton");
      const saveTtsButton = document.getElementById("saveTtsButton");

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
        provider.value = status.provider || provider.value || "xunfei";
        if (status.resourceId) resourceId.value = status.resourceId;
        updateProviderUi();
        clearButton.disabled = !status.configured;
        saveButton.disabled = !status.secureStorageAvailable;
      }

      function renderTtsStatus(status) {
        ttsStatusPill.textContent = status.configured ? "CONFIGURED" : "MISSING";
        ttsStatusPill.dataset.tone = status.configured ? "success" : "danger";
        ttsProvider.value = status.provider || ttsProvider.value || "doubao";
        ttsProviderSubtitle.textContent = status.configured
          ? "Doubao cloud TTS / " +
            (status.voiceId || "zh_female_xiaohe_uranus_bigtts")
          : "Doubao cloud TTS";
        if (status.voiceId) ttsVoiceId.value = status.voiceId;
        if (status.resourceId) ttsResourceId.value = status.resourceId;
        clearTtsButton.disabled = !status.configured;
        saveTtsButton.disabled = !status.secureStorageAvailable;
      }

      function updateProviderUi() {
        const selected = provider.value === "volcengine" ? "volcengine" : "xunfei";
        providerSubtitle.textContent =
          selected === "volcengine" ? "Volcengine Bigmodel ASR" : "Xunfei RTASR";
        appIdField.style.display = selected === "volcengine" ? "none" : "";
        document.getElementById("appId").required = selected !== "volcengine";
        apiKeyLabel.textContent = selected === "volcengine" ? "API Key" : "APIKey";
        resourceIdField.style.display = selected === "volcengine" ? "" : "none";
      }

      async function refresh() {
        try {
          const [voiceStatus, ttsStatus] = await Promise.all([
            bridge.getStatus(),
            bridge.getTtsStatus()
          ]);
          renderStatus(voiceStatus);
          renderTtsStatus(ttsStatus);
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
          provider: String(formData.get("provider") || "xunfei") === "volcengine" ? "volcengine" : "xunfei",
          appId: String(formData.get("appId") || ""),
          apiKey: String(formData.get("apiKey") || ""),
          resourceId: String(formData.get("resourceId") || ""),
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

      document.getElementById("ttsSettingsForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        ttsMessage.textContent = "";
        saveTtsButton.disabled = true;
        const formData = new FormData(document.getElementById("ttsSettingsForm"));
        const result = await bridge.saveTts({
          provider: "doubao",
          apiKey: String(formData.get("ttsApiKey") || ""),
          voiceId: String(formData.get("ttsVoiceId") || ""),
          resourceId: String(formData.get("ttsResourceId") || "")
        });
        if (result.ok) {
          renderTtsStatus(result.status);
          ttsMessage.textContent = "Saved. TTS playback will use the cloud chain.";
          ttsMessage.dataset.tone = "success";
        } else {
          renderTtsStatus(result.status);
          ttsMessage.textContent = result.message;
          ttsMessage.dataset.tone = "danger";
        }
        saveTtsButton.disabled = false;
      });

      clearTtsButton.addEventListener("click", async () => {
        const result = await bridge.clearTts();
        if (result.ok) {
          renderTtsStatus(result.status);
          ttsMessage.textContent = "Cleared. Cloud TTS will be unavailable until reconfigured.";
          ttsMessage.dataset.tone = "success";
        } else {
          renderTtsStatus(result.status);
          ttsMessage.textContent = result.message;
          ttsMessage.dataset.tone = "danger";
        }
      });

      provider.addEventListener("change", updateProviderUi);
      closeButton.addEventListener("click", () => bridge.close());
      updateProviderUi();
      void refresh();
    </script>
  </body>
</html>`;
