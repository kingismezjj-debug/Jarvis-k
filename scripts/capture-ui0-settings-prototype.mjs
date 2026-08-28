import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const prototypeUrl = pathToFileURL(
  path.join(rootDirectory, "prototypes", "settings-control-center", "index.html"),
);
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-0",
  "settings-control-center",
);

const scenarios = [
  { name: "zh-general-wide-v2", query: "?locale=zh-CN", width: 1440, height: 940, locale: "zh-CN" },
  { name: "en-general-wide-v2", query: "?locale=en", width: 1440, height: 940, locale: "en" },
  { name: "zh-general-narrow-v2", query: "?locale=zh-CN", width: 390, height: 980, locale: "zh-CN", narrow: true },
  { name: "en-general-narrow-v2", query: "?locale=en", width: 390, height: 980, locale: "en", narrow: true },
  {
    name: "models-wide-v2",
    query: "?locale=en&category=models_intelligence",
    width: 1440,
    height: 940,
    locale: "en",
  },
  {
    name: "voice-wide-v2",
    query: "?locale=zh-CN&category=voice_audio",
    width: 1440,
    height: 940,
    locale: "zh-CN",
  },
  {
    name: "tools-plugins-wide-v2",
    query: "?locale=zh-CN&category=tools_plugins",
    width: 1440,
    height: 940,
    locale: "zh-CN",
  },
  {
    name: "system-status-v2",
    query: "?locale=en&category=about_updates",
    width: 1440,
    height: 940,
    locale: "en",
  },
  {
    name: "developer-on-v2",
    query: "?locale=en&view=developer-on",
    width: 1440,
    height: 940,
    locale: "en",
    developer: true,
  },
  {
    name: "developer-off-v2",
    query: "?locale=en&view=developer-off",
    width: 1440,
    height: 940,
    locale: "en",
  },
  {
    name: "evaluation-on-v2",
    query: "?locale=en&view=evaluation-on",
    width: 1440,
    height: 940,
    locale: "en",
    developer: true,
  },
  { name: "search-en-v2", query: "?locale=en&view=search-en", width: 1440, height: 940, locale: "en" },
  { name: "search-zh-v2", query: "?locale=zh-CN&view=search-zh", width: 1440, height: 940, locale: "zh-CN" },
  { name: "search-empty-v2", query: "?locale=en&view=search-empty", width: 1440, height: 940, locale: "en" },
  { name: "danger-v2", query: "?locale=en&view=danger", width: 1440, height: 940, locale: "en" },
  { name: "unavailable-v2", query: "?locale=zh-CN&view=unavailable", width: 1440, height: 940, locale: "zh-CN" },
  { name: "zh-general-zoom200-v2", query: "?locale=zh-CN", width: 780, height: 980, scaleFactor: 2, locale: "zh-CN", narrow: true },
];

await mkdir(outputDirectory, { recursive: true });

const harnessPath = path.join(
  rootDirectory,
  "scripts",
  "helpers",
  "settings-prototype-screenshot-main.cjs",
);
const results = [];
try {
  for (const scenario of scenarios) {
    const electronApp = await electron.launch({
      args: [harnessPath],
      cwd: rootDirectory,
      env: {
        ...process.env,
        JARVIS_K_SETTINGS_PROTOTYPE_URL: `${prototypeUrl.href}${scenario.query}`,
        JARVIS_K_SETTINGS_PROTOTYPE_WIDTH: String(scenario.width),
        JARVIS_K_SETTINGS_PROTOTYPE_HEIGHT: String(scenario.height),
        JARVIS_K_SETTINGS_PROTOTYPE_SCALE_FACTOR: String(scenario.scaleFactor ?? 1),
      },
    });
    try {
      const page = await electronApp.firstWindow();
      await page.locator("[data-prototype='settings-control-center']").waitFor();
      const overflow = await page.evaluate(() => ({
        bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth,
        clippingCandidates: [
          ...document.querySelectorAll(
            ".setting-row, .category-button, .feature-card, .search-result",
          ),
        ]
          .filter((element) => element.scrollWidth > element.clientWidth + 1)
          .length,
        firstSettingVisible:
          (document
            .querySelector(
              ".setting-row, .feature-card, .danger-section, .diagnostic-row, .search-result, .empty-state",
            )
            ?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY) < window.innerHeight,
        categoryNavVisible:
          getComputedStyle(document.querySelector(".category-nav")).display !== "none",
        statusRailVisible: Boolean(document.querySelector(".status-rail")),
        productInternalLeakCount: [
          "EVERYONE",
          "READY",
          "PRODUCT",
          "PLANNED",
          "NEEDS_SETUP",
          "DANGER ZONE",
          "SCHEDULE",
          "PROTOTYPE DATA",
          "controlType",
          "capabilityId",
          "settingId",
        ].filter((term) => document.body.innerText.includes(term)).length,
        zhInternalEnglishLeakCount:
          document.documentElement.lang === "zh-CN"
            ? [
                "Developer tools",
                "Prototype",
                "Change",
                "Danger zone",
                "Not available yet",
                "Configured",
                "switch",
                "segmented",
                "select",
                "button",
              ].filter((term) => document.body.innerText.includes(term)).length
            : 0,
        mojibakeLeakCount: (document.body.innerText.match(/[�锟閿鈥]/g) ?? []).length,
        focused: document.activeElement?.tagName ?? "none",
      }));
      const screenshotPath = path.join(outputDirectory, `${scenario.name}.png`);
      await page.screenshot({ fullPage: true, path: screenshotPath });
      results.push({
        ...scenario,
        screenshotPath,
        productTextClean: scenario.developer === true || overflow.productInternalLeakCount === 0,
        zhTextClean: scenario.locale !== "zh-CN" || overflow.zhInternalEnglishLeakCount === 0,
        narrowNavCompressed: scenario.narrow !== true || overflow.categoryNavVisible === false,
        statusRailRemoved: !overflow.statusRailVisible,
        ...overflow,
      });
    } finally {
      await electronApp.close();
    }
  }
} catch (error) {
  console.error(
    JSON.stringify(
      {
        status: "FAIL",
        message: error instanceof Error ? error.message : "unknown error",
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: results.every(
        (item) =>
          !item.bodyHorizontalOverflow &&
          item.clippingCandidates === 0 &&
          item.firstSettingVisible &&
          item.productTextClean &&
          item.zhTextClean &&
          item.narrowNavCompressed &&
          item.statusRailRemoved &&
          item.mojibakeLeakCount === 0,
      )
        ? "PASS"
        : "WARN",
      outputDirectory,
      results,
    },
    null,
    2,
  ),
);
