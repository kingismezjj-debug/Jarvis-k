import { galleryCopy, galleryFlags, locales, statusRows } from "./gallery-data.mjs";

const params = new URLSearchParams(window.location.search);
const locale = locales.includes(params.get("locale")) ? params.get("locale") : "en";
const density = params.get("density") === "compact" ? "compact" : "comfortable";
const mode = params.get("mode") ?? "default";
const reducedMotion = params.get("reducedMotion") === "true";
const highContrast = params.get("contrast") === "high";
const copy = galleryCopy[locale];
const root = document.querySelector("#gallery-root");

document.documentElement.lang = locale;
root.dataset.density = density;
root.dataset.reducedMotion = String(reducedMotion);
root.dataset.highContrast = String(highContrast);

function statusLabel(key) {
  const labels = {
    en: {
      ready: "Ready to use",
      configured: "Configured",
      not_configured: "Not configured",
      unavailable: "Unavailable",
      requires_setup: "Setup required",
      disabled: "Off",
      local_only: "Local only",
      read_only: "Read only",
      update_available: "Update available",
    },
    "zh-CN": {
      ready: "可直接使用",
      configured: "已配置",
      not_configured: "未配置",
      unavailable: "暂不可用",
      requires_setup: "需要设置",
      disabled: "已关闭",
      local_only: "仅在本机处理",
      read_only: "只读",
      update_available: "有可用更新",
    },
  };
  return labels[locale][key];
}

function renderStatusRows() {
  return statusRows
    .map(
      ([key, tone]) =>
        `<span class="jk-status" data-tone="${tone}">${statusLabel(key)}</span>`,
    )
    .join("");
}

function renderCategoryNav() {
  return copy.categories
    .map(
      (category, index) =>
        `<button class="jk-category-button" type="button" ${index === 0 ? 'aria-current="page"' : ""}>${category}</button>`,
    )
    .join("");
}

function renderDeveloperDiagnostics() {
  if (mode !== "developer") return "";
  return `
    <section class="jk-section gallery-card" data-gallery-section="developer">
      <header class="jk-section-header">
        <div>
          <h2>${copy.diagnostics}</h2>
          <p>Internal IDs are shown only in the developer example.</p>
        </div>
      </header>
      <dl class="jk-diagnostic-list">
        <div class="jk-diagnostic-row"><dt>Provider</dt><dd>Configured <span class="jk-mono">advanced-brain.deepseek</span></dd></div>
        <div class="jk-diagnostic-row"><dt>Binding</dt><dd>Available <span class="jk-mono">vault.binding.example</span></dd></div>
      </dl>
    </section>
  `;
}

root.innerHTML = `
  <header class="gallery-header">
    <div>
      <span class="gallery-kicker">${copy.identityLayer}</span>
      <h1>${copy.title}</h1>
      <p>${copy.subtitle}</p>
    </div>
    <div class="gallery-toolbar">
      <button class="jk-button" data-variant="secondary" type="button">${copy.compactAction}</button>
      <button class="jk-button" data-variant="primary" type="button">${copy.primaryAction}</button>
    </div>
  </header>
  <div class="gallery-layout">
    <nav class="jk-category-nav" aria-label="Settings categories">${renderCategoryNav()}</nav>
    <div class="gallery-content">
      <label class="jk-stack gallery-search">
        <span class="jk-setting-title">${copy.searchLabel}</span>
        <input class="jk-search-field" type="search" placeholder="${copy.searchPlaceholder}" />
      </label>

      <section class="jk-section gallery-card">
        <header class="jk-section-header">
          <div>
            <h2>${copy.basicControls}</h2>
            <p>${copy.longText}</p>
          </div>
          <span class="jk-badge" data-tone="info">${density}</span>
        </header>
        <div class="gallery-grid">
          <button class="jk-button" data-variant="primary" type="button">${copy.runCheck}</button>
          <button class="jk-button" data-variant="secondary" type="button">${copy.openDetails}</button>
          <button class="jk-button" data-variant="ghost" type="button">${copy.quietAction}</button>
          <button class="jk-button" data-variant="danger" type="button">Restore default settings</button>
          <button class="jk-icon-button" aria-label="Refresh preview" type="button">↻</button>
          <select class="jk-select" aria-label="Model provider">
            <option>GLM-5.2</option>
            <option>DeepSeek V4 Flash</option>
          </select>
          <button class="jk-switch" aria-label="Launch at login" aria-checked="true" role="switch" type="button">
            <span class="jk-switch-thumb" aria-hidden="true"></span>
          </button>
          <span class="jk-spinner" aria-label="Loading" role="status"><span aria-hidden="true"></span></span>
        </div>
        <aside class="jk-inline-notice" data-tone="warning" role="note">
          <strong>${copy.keyboardTitle}</strong>
          <span>${copy.keyboardDescription}</span>
        </aside>
      </section>

      <section class="jk-section gallery-card">
        <header class="jk-section-header">
          <div>
            <h2>${copy.settingsControls}</h2>
            <p>${copy.rowsDescription}</p>
          </div>
        </header>
        <div class="jk-setting-row">
          <div class="jk-stack"><span class="jk-setting-title">${copy.stateLanguage}</span><span class="jk-setting-description">${locale === "zh-CN" ? "选择 Jarvis 显示语言" : "Choose the Jarvis display language"}</span></div>
          <button class="jk-value-action" type="button"><span>${locale === "zh-CN" ? "中文（简体）" : "English"}</span><span aria-hidden="true">›</span></button>
        </div>
        <div class="jk-setting-row">
          <div class="jk-stack"><span class="jk-setting-title">${copy.density}</span><span class="jk-setting-description">${locale === "zh-CN" ? "控制设置行密度" : "Controls setting row density"}</span></div>
          <button class="jk-switch" aria-label="${copy.density}" aria-checked="${density === "compact"}" role="switch" type="button"><span class="jk-switch-thumb" aria-hidden="true"></span></button>
        </div>
        <article class="jk-connection-card">
          <div class="jk-stack">
            <h3>GLM</h3>
            <p>${locale === "zh-CN" ? "凭据只显示配置状态，不显示密钥内容。" : "Credentials show configured state only, never key contents."}</p>
            <span class="jk-status" data-tone="success">${statusLabel("configured")}</span>
          </div>
          <button class="jk-button" type="button">${copy.manageConnection}</button>
        </article>
      </section>

      <section class="jk-section gallery-card">
        <header class="jk-section-header"><div><h2>${copy.unavailable}</h2><p>${locale === "zh-CN" ? "状态颜色配合文本表达，不只依赖颜色。" : "Status uses text with color, not color alone."}</p></div></header>
        <div class="gallery-status-grid">${renderStatusRows()}</div>
        <section class="jk-empty-state"><h3>${copy.emptyTitle}</h3><p>${copy.emptyDescription}</p></section>
      </section>

      <section class="jk-section jk-danger-section gallery-card">
        <header class="jk-section-header"><div><h2>${copy.dangerous}</h2><p>${copy.resetDescription}</p></div></header>
        <div class="jk-setting-row">
          <div class="jk-stack"><span class="jk-setting-title">${copy.resetTitle}</span><span class="jk-setting-description">${locale === "zh-CN" ? "需要确认；不会删除凭据、记忆或本地数据。" : "Requires confirmation; credentials, memory, and local data are not deleted."}</span></div>
          <button class="jk-button" data-variant="danger" type="button">${copy.resetTitle}</button>
        </div>
      </section>

      ${renderDeveloperDiagnostics()}
    </div>
  </div>
`;

if (!galleryFlags.usesFakeDataOnly) {
  throw new Error("Gallery must remain fake-data only.");
}
