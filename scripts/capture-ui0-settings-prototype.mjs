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
  { name: "en-wide", query: "?locale=en", width: 1440, height: 940 },
  { name: "zh-wide", query: "?locale=zh-CN", width: 1440, height: 940 },
  { name: "en-narrow", query: "?locale=en", width: 390, height: 980 },
  { name: "zh-narrow", query: "?locale=zh-CN", width: 390, height: 980 },
  {
    name: "developer-evaluation",
    query: "?locale=en&view=developer",
    width: 1440,
    height: 940,
  },
  { name: "search-results", query: "?locale=en&view=search", width: 1440, height: 940 },
  { name: "danger-section", query: "?locale=en&view=danger", width: 1440, height: 940 },
  {
    name: "unavailable-capability",
    query: "?locale=zh-CN&category=notifications",
    width: 1440,
    height: 940,
  },
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
      },
    });
    try {
      const page = await electronApp.firstWindow();
      await page.locator("[data-prototype='settings-control-center']").waitFor();
      const overflow = await page.evaluate(() => ({
        bodyHorizontalOverflow: document.body.scrollWidth > window.innerWidth,
        clippingCandidates: [...document.querySelectorAll(".setting-row, .category-button")]
          .filter((element) => element.scrollWidth > element.clientWidth + 1)
          .length,
        focused: document.activeElement?.tagName ?? "none",
      }));
      const screenshotPath = path.join(outputDirectory, `${scenario.name}.png`);
      await page.screenshot({ fullPage: true, path: screenshotPath });
      results.push({
        ...scenario,
        screenshotPath,
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
        (item) => !item.bodyHorizontalOverflow && item.clippingCandidates === 0,
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
