import {
  categoryOrder,
  developerCategoryId,
  locales,
  productCategoryOrder,
  prototypeCopy,
  settingsCategories,
} from "./prototype-data.mjs";

const params = new URLSearchParams(window.location.search);
let locale = locales.includes(params.get("locale")) ? params.get("locale") : "en";
let developerMode =
  params.get("dev") === "on" ||
  params.get("view") === "developer-on" ||
  params.get("view") === "evaluation-on";
let evaluationCapability =
  params.get("eval") === "on" || params.get("view") === "evaluation-on";
let activeCategory = categoryOrder.includes(params.get("category"))
  ? params.get("category")
  : "general";
let query = params.get("q") ?? "";

if (params.get("view") === "developer-off") {
  developerMode = false;
  evaluationCapability = false;
  activeCategory = "general";
}
if (params.get("view") === "developer-on") activeCategory = developerCategoryId;
if (params.get("view") === "evaluation-on") activeCategory = developerCategoryId;
if (params.get("view") === "danger") {
  activeCategory = "general";
  query = "";
}
if (params.get("view") === "search-en") query = "provider";
if (params.get("view") === "search-zh") {
  locale = "zh-CN";
  query = "语音";
}
if (params.get("view") === "search-empty") query = "zzzz";
if (params.get("view") === "unavailable") activeCategory = "voice_audio";

const app = document.getElementById("app");

function render() {
  const copy = prototypeCopy[locale];
  const visibleCategories = getVisibleCategories();
  if (!visibleCategories.some((category) => category.id === activeCategory)) {
    activeCategory = "general";
  }
  const selected = visibleCategories.find((category) => category.id === activeCategory);
  const searchResults = query.trim() ? getSearchResults(visibleCategories, query) : [];

  document.documentElement.lang = locale;
  app.innerHTML = `
    <div class="prototype-shell" data-locale="${locale}">
      <header class="topbar">
        <div class="brand-mark" aria-hidden="true">JK</div>
        <div class="title-group">
          <h1>${copy.appTitle}</h1>
          <p>${copy.appSubtitle}</p>
        </div>
      </header>
      <div class="toolbar">
        <label class="search-box">
          <span>${copy.search}</span>
          <input id="settings-search" type="search" value="${escapeHtml(query)}" />
        </label>
        <label class="mobile-category-select">
          <span>${copy.mobileCategory}</span>
          <select id="category-select">
            ${visibleCategories
              .map(
                (category) =>
                  `<option value="${category.id}" ${category.id === activeCategory ? "selected" : ""}>${copy.categories[category.id]}</option>`,
              )
              .join("")}
          </select>
        </label>
      </div>
      <div class="layout">
        <nav class="category-nav" aria-label="${copy.mobileCategory}">
          ${visibleCategories.map((category) => categoryButton(category, copy)).join("")}
        </nav>
        <main class="content" tabindex="-1">
          ${
            query.trim()
              ? renderSearchResults(searchResults, copy)
              : selected
                ? renderCategory(selected, copy)
                : `<p class="empty">${copy.noResults}</p>`
          }
        </main>
      </div>
    </div>
  `;

  app.querySelector("#settings-search")?.addEventListener("input", (event) => {
    query = event.currentTarget.value;
    render();
  });
  app.querySelector("#category-select")?.addEventListener("change", (event) => {
    activeCategory = event.currentTarget.value;
    query = "";
    render();
  });
  app.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.getAttribute("data-category");
      query = "";
      render();
    });
  });
}

function getVisibleCategories() {
  const visibleIds = developerMode
    ? [...productCategoryOrder, developerCategoryId]
    : productCategoryOrder;
  return visibleIds
    .map((id) => settingsCategories.find((category) => category.id === id))
    .filter(Boolean);
}

function categoryButton(category, copy) {
  const active = category.id === activeCategory;
  return `
    <button class="category-button ${active ? "active" : ""}" data-category="${category.id}" type="button">
      <span>${copy.categories[category.id]}</span>
      <small>${category.state[locale]}</small>
    </button>
  `;
}

function renderCategory(category, copy) {
  if (category.id === developerCategoryId) return renderDeveloperCategory(category, copy);
  return `
    <section class="category-page" data-category-page="${category.id}">
      <div class="page-heading">
        <div>
          <h2>${copy.categories[category.id]}</h2>
          <p>${category.summary[locale]}</p>
        </div>
        <span class="page-state">${category.state[locale]}</span>
      </div>
      ${category.sections.map((section) => renderSection(section, copy)).join("")}
    </section>
  `;
}

function renderDeveloperCategory(category, copy) {
  const evaluationBlock = evaluationCapability
    ? `<div class="notice good">${copy.evaluationEnabled}</div>`
    : `<div class="notice">${copy.evaluationDisabled}</div>`;
  return `
    <section class="category-page developer-page" data-category-page="${category.id}">
      <div class="page-heading">
        <div>
          <h2>${copy.developerEnabledTitle}</h2>
          <p>${category.summary[locale]}</p>
        </div>
        <span class="page-state">${developerMode ? "Developer Mode ON" : "Developer Mode OFF"}</span>
      </div>
      ${evaluationBlock}
      ${category.sections.map((section) => renderSection(section, copy, { developer: true })).join("")}
    </section>
  `;
}

function renderSection(section, copy, options = {}) {
  return `
    <section class="settings-section" data-section="${section.id}">
      <div class="section-heading">
        <h3>${section.title[locale]}</h3>
        <p>${section.description[locale]}</p>
      </div>
      <div class="setting-list">
        ${section.settings.map((setting) => renderSetting(setting, copy, options)).join("")}
      </div>
    </section>
  `;
}

function renderSetting(setting, copy, options = {}) {
  if (options.developer) return renderDeveloperSetting(setting);
  if (setting.kind === "credential") return renderCredentialCard(setting, copy);
  if (setting.kind === "model") return renderModelCard(setting, copy);
  if (setting.kind === "permission") return renderPermissionCard(setting, copy);
  if (setting.kind === "danger") return renderDangerSetting(setting, copy);
  if (setting.kind === "diagnostic") return renderDiagnostic(setting);
  if (setting.kind === "unavailable") return renderUnavailableSetting(setting, copy);

  return `
    <article class="setting-row" data-setting="${setting.id}">
      <div class="setting-copy">
        <h4>${setting.title[locale]}</h4>
        <p>${setting.description[locale]}</p>
      </div>
      ${renderControl(setting, copy)}
    </article>
  `;
}

function renderControl(setting, copy) {
  if (setting.kind === "switch") {
    return `
      <button class="switch ${setting.enabled ? "on" : ""}" type="button" aria-label="${setting.title[locale]}">
        <span></span>
      </button>
    `;
  }
  if (setting.kind === "segmented") {
    return `
      <div class="segmented" aria-label="${setting.title[locale]}">
        ${setting.options[locale]
          .map((option) => `<span class="${option === setting.value[locale] ? "selected" : ""}">${option}</span>`)
          .join("")}
      </div>
    `;
  }
  return `<button class="value-button" type="button"><span>${setting.value[locale]}</span><strong aria-hidden="true">›</strong></button>`;
}

function renderCredentialCard(setting, copy) {
  const configured = setting.value[locale] !== copy.notConfigured;
  return `
    <article class="feature-card credential-card" data-setting="${setting.id}">
      <div>
        <h4>${setting.title[locale]}</h4>
        <p>${setting.description[locale]}</p>
        <small>${setting.provider}</small>
      </div>
      <div class="connection-state ${configured ? "configured" : ""}">
        <span>${setting.value[locale]}</span>
        <button class="secondary" type="button">${configured ? copy.openDetails : copy.choose}</button>
      </div>
    </article>
  `;
}

function renderModelCard(setting, copy) {
  return `
    <article class="feature-card model-card" data-setting="${setting.id}">
      <div>
        <h4>${setting.title[locale]}</h4>
        <p>${setting.description[locale]}</p>
      </div>
      <div class="model-readout">
        <span>${setting.value[locale]}</span>
        <button class="secondary" type="button">${copy.openDetails}</button>
      </div>
    </article>
  `;
}

function renderPermissionCard(setting, copy) {
  return `
    <article class="feature-card permission-card" data-setting="${setting.id}">
      <div>
        <h4>${setting.title[locale]}</h4>
        <p>${setting.description[locale]}</p>
      </div>
      <div class="permission-readout">
        <span>${setting.value[locale]}</span>
        <button class="secondary" type="button">${copy.openDetails}</button>
      </div>
    </article>
  `;
}

function renderDangerSetting(setting, copy) {
  return `
    <article class="danger-section" data-setting="${setting.id}">
      <div>
        <h4>${setting.title[locale]}</h4>
        <p>${setting.description[locale]}</p>
      </div>
      <dl>
        <div><dt>${locale === "zh-CN" ? "影响范围" : "Impact"}</dt><dd>${setting.danger.impact[locale]}</dd></div>
        <div><dt>${locale === "zh-CN" ? "不会删除" : "Not deleted"}</dt><dd>${setting.value[locale]}</dd></div>
        <div><dt>${locale === "zh-CN" ? "凭据" : "Credentials"}</dt><dd>${setting.danger.credential[locale]}</dd></div>
        <div><dt>${locale === "zh-CN" ? "确认" : "Confirmation"}</dt><dd>${setting.danger.confirmation[locale]}</dd></div>
      </dl>
      <button class="danger-button" type="button">${copy.restoreDefaultSettings}</button>
    </article>
  `;
}

function renderDiagnostic(setting) {
  return `
    <article class="diagnostic-row" data-setting="${setting.id}">
      <span>${setting.title[locale]}</span>
      <strong>${setting.value[locale]}</strong>
    </article>
  `;
}

function renderUnavailableSetting(setting, copy) {
  return `
    <article class="setting-row unavailable-row" data-setting="${setting.id}">
      <div class="setting-copy">
        <h4>${setting.title[locale]}</h4>
        <p>${setting.description[locale]}</p>
      </div>
      <span class="unavailable-pill">${copy.unavailable}</span>
    </article>
  `;
}

function renderDeveloperSetting(setting) {
  return `
    <article class="setting-row developer-row" data-setting="${setting.id}">
      <div class="setting-copy">
        <h4>${setting.title[locale]}</h4>
        <p>${setting.description[locale]}</p>
      </div>
      <dl class="internal-list">
        <div><dt>settingId</dt><dd>${setting.internal.settingId}</dd></div>
        <div><dt>capabilityId</dt><dd>${setting.internal.capabilityId}</dd></div>
        <div><dt>controlType</dt><dd>${setting.internal.controlType}</dd></div>
        <div><dt>status</dt><dd>${setting.internal.status}</dd></div>
      </dl>
    </article>
  `;
}

function renderSearchResults(results, copy) {
  return `
    <section class="category-page search-page">
      <div class="page-heading">
        <div>
          <h2>${copy.searchResults}</h2>
          <p>${copy.resultCount(results.length)}</p>
        </div>
      </div>
      ${
        results.length
          ? `<div class="search-list">${results.map((result) => renderSearchResult(result, copy)).join("")}</div>`
          : `<div class="empty-state"><h3>${copy.noResults}</h3><p>${copy.noResultsHint}</p></div>`
      }
    </section>
  `;
}

function renderSearchResult(result, copy) {
  const breadcrumb = `${copy.categories[result.category.id]} / ${result.section.title[locale]}`;
  return `
    <article class="search-result">
      <small>${breadcrumb}</small>
      <h4>${result.setting.title[locale]}</h4>
      <p>${result.setting.description[locale]}</p>
      <strong>${result.setting.value?.[locale] ?? copy.openDetails}</strong>
    </article>
  `;
}

function getSearchResults(categories, currentQuery) {
  const terms = currentQuery.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return categories.flatMap((category) =>
    category.sections.flatMap((section) =>
      section.settings
        .filter((setting) => terms.some((term) => searchText(category, section, setting).includes(term)))
        .map((setting) => ({ category, section, setting })),
    ),
  );
}

function searchText(category, section, setting) {
  return [
    category.id,
    ...category.keywords,
    section.title.en,
    section.title["zh-CN"],
    setting.id,
    setting.title.en,
    setting.title["zh-CN"],
    setting.description.en,
    setting.description["zh-CN"],
    setting.value?.en ?? "",
    setting.value?.["zh-CN"] ?? "",
    ...(setting.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

render();
