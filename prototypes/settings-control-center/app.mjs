import {
  categoryOrder,
  locales,
  prototypeCopy,
  prototypeStatus,
  settingsCategories,
} from "./prototype-data.mjs";

const params = new URLSearchParams(window.location.search);
let locale = locales.includes(params.get("locale")) ? params.get("locale") : "en";
let activeCategory = categoryOrder.includes(params.get("category"))
  ? params.get("category")
  : "general";
let query = params.get("q") ?? "";
if (params.get("view") === "developer") activeCategory = "developer_evaluation";
if (params.get("view") === "danger") query = "delete reset destructive";
if (params.get("view") === "search") query = "provider credential cloud";

const app = document.getElementById("app");

function render() {
  const copy = prototypeCopy[locale];
  const filteredCategories = filterCategories(query);
  const selected =
    filteredCategories.find((category) => category.id === activeCategory) ??
    filteredCategories[0] ??
    settingsCategories.find((category) => category.id === activeCategory) ??
    settingsCategories[0];

  document.documentElement.lang = locale;
  app.innerHTML = `
    <div class="prototype-shell" data-locale="${locale}">
      <header class="topbar">
        <div class="brand-mark">JK</div>
        <div class="title-group">
          <h1>${copy.appTitle}</h1>
          <p>${copy.appSubtitle}</p>
        </div>
        <div class="top-actions">
          ${languageButton("en", "EN")}
          ${languageButton("zh-CN", "中文")}
          <span class="status-pill">${copy.fakeData}</span>
        </div>
      </header>
      <div class="control-bar">
        <label class="search-box">
          <span>${copy.search}</span>
          <input id="settings-search" type="search" value="${escapeHtml(query)}" />
        </label>
        <div class="surface-segment">
          <span>${copy.productMode}</span>
          <span>${copy.developerMode}</span>
        </div>
      </div>
      <div class="layout">
        <nav class="category-nav" aria-label="${copy.sections}">
          ${settingsCategories.map((category) => categoryButton(category, copy)).join("")}
        </nav>
        <main class="content" tabindex="-1">
          ${selected ? renderCategory(selected, copy, query) : `<p>${copy.noResults}</p>`}
        </main>
        <aside class="status-rail" aria-label="${copy.statusRail}">
          <h2>${copy.statusRail}</h2>
          ${prototypeStatus.map((item) => statusRow(item, locale)).join("")}
        </aside>
      </div>
    </div>
  `;

  app.querySelector("#settings-search")?.addEventListener("input", (event) => {
    query = event.currentTarget.value;
    render();
  });
  app.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.getAttribute("data-category");
      render();
    });
  });
  app.querySelectorAll("[data-locale-button]").forEach((button) => {
    button.addEventListener("click", () => {
      locale = button.getAttribute("data-locale-button");
      render();
    });
  });
}

function categoryButton(category, copy) {
  const active = category.id === activeCategory;
  const hidden = category.defaultVisible ? "" : `<span class="nav-gate">${copy.developerMode}</span>`;
  return `
    <button class="category-button ${active ? "active" : ""}" data-category="${category.id}" type="button">
      <span>${copy.categories[category.id]}</span>
      ${hidden}
    </button>
  `;
}

function renderCategory(category, copy, currentQuery) {
  const sections = category.sections
    .map((section) => renderSection(section, copy, currentQuery))
    .join("");
  return `
    <section class="category-page" data-category-page="${category.id}">
      <div class="page-heading">
        <div>
          <p class="eyebrow">${category.audience}</p>
          <h2>${copy.categories[category.id]}</h2>
        </div>
        <span class="status-pill ${category.status}">${category.status}</span>
      </div>
      ${sections || `<p class="empty">${copy.noResults}</p>`}
    </section>
  `;
}

function renderSection(section, copy, currentQuery) {
  const settings = section.settings.filter((setting) => settingMatches(setting, currentQuery));
  if (settings.length === 0) return "";
  return `
    <section class="settings-section">
      <div class="section-heading">
        <h3>${section.title[locale]}</h3>
        <p>${section.description[locale]}</p>
      </div>
      <div class="setting-list">
        ${settings.map((setting) => renderSetting(setting, copy)).join("")}
      </div>
    </section>
  `;
}

function renderSetting(setting, copy) {
  const tags = [
    setting.visibility,
    setting.sensitive ? copy.configured : "",
    setting.status === "unavailable" ? copy.unavailable : "",
    setting.danger !== "none" ? copy.danger : "",
  ].filter(Boolean);
  return `
    <article class="setting-row ${setting.danger !== "none" ? "danger" : ""}">
      <div class="setting-copy">
        <h4>${setting.label[locale]}</h4>
        <p>${setting.control} / ${setting.status}</p>
      </div>
      <div class="setting-meta">
        ${tags.map((tag) => `<span>${tag}</span>`).join("")}
      </div>
      ${controlPreview(setting)}
    </article>
  `;
}

function controlPreview(setting) {
  if (setting.control === "switch") return `<button class="switch" aria-label="${setting.id}"><span></span></button>`;
  if (setting.control === "credential") return `<button class="secondary">Replace</button>`;
  if (setting.control === "danger") return `<button class="danger-button">Confirm</button>`;
  if (setting.control === "select" || setting.control === "segmented") {
    return `<button class="secondary">Change</button>`;
  }
  return `<span class="readout">${setting.control}</span>`;
}

function filterCategories(currentQuery) {
  const terms = currentQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return settingsCategories;
  return settingsCategories
    .map((category) => ({
      ...category,
      sections: category.sections
        .map((section) => ({
          ...section,
          settings: section.settings.filter((setting) =>
            terms.some((term) =>
              [
                category.id,
                ...category.keywords,
                setting.id,
                setting.label.en,
                setting.label["zh-CN"],
                setting.control,
                setting.visibility,
              ]
                .join(" ")
                .toLowerCase()
                .includes(term),
            ),
          ),
        }))
        .filter((section) => section.settings.length > 0),
    }))
    .filter((category) => category.sections.length > 0);
}

function settingMatches(setting, currentQuery) {
  if (!currentQuery.trim()) return true;
  const terms = currentQuery.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [
    setting.id,
    setting.label.en,
    setting.label["zh-CN"],
    setting.control,
    setting.visibility,
    setting.status,
    setting.danger,
  ]
    .join(" ")
    .toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

function statusRow(item, currentLocale) {
  return `
    <div class="status-row ${item.tone}">
      <span>${item.label[currentLocale]}</span>
      <strong>${item.value[currentLocale]}</strong>
    </div>
  `;
}

function languageButton(targetLocale, label) {
  return `
    <button class="language-button ${locale === targetLocale ? "active" : ""}" data-locale-button="${targetLocale}" type="button">
      ${label}
    </button>
  `;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

render();
