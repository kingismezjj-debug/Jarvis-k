import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const galleryUrl = pathToFileURL(
  path.join(rootDirectory, "prototypes", "ui-foundation-gallery", "index.html"),
);
const outputDirectory = path.join(
  rootDirectory,
  "artifacts",
  "ui-1",
  "component-gallery",
);

const scenarios = [
  { name: "gallery-en-wide", query: "?locale=en", width: 1440, height: 980 },
  { name: "gallery-zh-wide", query: "?locale=zh-CN", width: 1440, height: 980 },
  { name: "gallery-en-narrow", query: "?locale=en", width: 390, height: 980, narrow: true },
  { name: "gallery-zh-narrow", query: "?locale=zh-CN", width: 390, height: 980, narrow: true },
  { name: "gallery-zoom200", query: "?locale=zh-CN", width: 780, height: 980, scaleFactor: 2 },
  { name: "gallery-reduced-motion", query: "?locale=en&reducedMotion=true", width: 1440, height: 980 },
  { name: "gallery-high-contrast", query: "?locale=en&contrast=high", width: 1440, height: 980 },
  { name: "gallery-developer", query: "?locale=en&mode=developer", width: 1440, height: 980, developer: true },
];

await mkdir(outputDirectory, { recursive: true });

const harnessPath = path.join(
  rootDirectory,
  "scripts",
  "helpers",
  "settings-prototype-screenshot-main.cjs",
);
const results = [];

for (const scenario of scenarios) {
  const electronApp = await electron.launch({
    args: [harnessPath],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_SETTINGS_PROTOTYPE_URL: `${galleryUrl.href}${scenario.query}`,
      JARVIS_K_SETTINGS_PROTOTYPE_WIDTH: String(scenario.width),
      JARVIS_K_SETTINGS_PROTOTYPE_HEIGHT: String(scenario.height),
      JARVIS_K_SETTINGS_PROTOTYPE_SCALE_FACTOR: String(
        scenario.scaleFactor ?? 1,
      ),
      NODE_PATH: "",
    },
  });

  try {
    const page = await electronApp.firstWindow();
    await page.locator("[data-density]").waitFor();
    const audit = await page.evaluate(() => {
      const text = document.body.innerText;
      const focusable = [
        ...document.querySelectorAll("button, input, select, [tabindex]"),
      ];
      return {
        bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth,
        clippingCandidates: [
          ...document.querySelectorAll(
            ".jk-setting-row, .jk-category-button, .jk-button, .jk-search-result, .jk-connection-card",
          ),
        ].filter((element) => element.scrollWidth > element.clientWidth + 1)
          .length,
        firstComponentVisible:
          (document.querySelector(".jk-section")?.getBoundingClientRect().top ??
            Number.POSITIVE_INFINITY) < window.innerHeight,
        navVisible:
          getComputedStyle(document.querySelector(".jk-category-nav")).display !==
          "none",
        focusableCount: focusable.length,
        missingAriaSwitches: [
          ...document.querySelectorAll('[role="switch"]'),
        ].filter((element) => !element.getAttribute("aria-label")).length,
        internalIdVisible: text.includes("advanced-brain.deepseek"),
        mojibakeLeakCount: (text.match(/[锟介敓闁块垾]/g) ?? []).length,
      };
    });
    const screenshotPath = path.join(outputDirectory, `${scenario.name}.png`);
    await page.screenshot({ fullPage: true, path: screenshotPath });
    results.push({
      ...scenario,
      screenshotPath,
      narrowNavCompressed: scenario.narrow !== true || !audit.navVisible,
      developerIdsSafe: scenario.developer === true || !audit.internalIdVisible,
      ...audit,
    });
  } finally {
    await electronApp.close();
  }
}

const status = results.every(
  (result) =>
    !result.bodyHorizontalOverflow &&
    result.clippingCandidates === 0 &&
    result.firstComponentVisible &&
    result.focusableCount >= 8 &&
    result.missingAriaSwitches === 0 &&
    result.narrowNavCompressed &&
    result.developerIdsSafe &&
    result.mojibakeLeakCount === 0,
)
  ? "PASS"
  : "FAIL";

console.log(
  JSON.stringify(
    {
      status,
      outputDirectory,
      results,
    },
    null,
    2,
  ),
);

if (status !== "PASS") process.exit(1);
