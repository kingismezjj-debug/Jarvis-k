import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const galleryDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "prototypes",
  "ui-foundation-gallery",
);

function readGallerySource() {
  const gallerySource = ["index.html", "gallery-data.mjs", "app.mjs", "styles.css"]
    .map((file) => readFileSync(path.join(galleryDirectory, file), "utf8"))
    .join("\n");
  const foundationCss = readFileSync(
    path.resolve(
      import.meta.dirname,
      "..",
      "src",
      "design-system",
      "foundation.css",
    ),
    "utf8",
  );
  return `${gallerySource}\n${foundationCss}`;
}

describe("UI foundation component gallery", () => {
  it("stays isolated from Product runtime APIs and packaged Alpha files", () => {
    const source = readGallerySource();
    const appSource = readFileSync(
      path.resolve(import.meta.dirname, "..", "src", "App.tsx"),
      "utf8",
    );
    const rootPackage = JSON.parse(
      readFileSync(
        path.resolve(import.meta.dirname, "..", "..", "..", "package.json"),
        "utf8",
      ),
    );

    for (const forbidden of [
      "window.jarvis",
      "ipcRenderer",
      "safeStorage",
      "showOpenDialog",
      "fetch(",
      "XMLHttpRequest",
      "apiKey",
      "secret",
    ]) {
      expect(source).not.toContain(forbidden);
    }
    expect(appSource).not.toContain("ui-foundation-gallery");
    expect(JSON.stringify(rootPackage.build.files)).not.toContain(
      "ui-foundation-gallery",
    );
  });

  it("contains English, Chinese, density, reduced motion, and high contrast fixtures", () => {
    const source = readGallerySource();

    expect(source).toContain("Jarvis-K UI Foundation");
    expect(source).toContain("Jarvis-K UI 基础组件");
    expect(source).toContain("comfortable");
    expect(source).toContain("compact");
    expect(source).toContain("reducedMotion");
    expect(source).toContain("highContrast");
    expect(source).toContain("prefers-reduced-motion");
  });

  it("keeps internal IDs only in the developer example", () => {
    const data = readFileSync(
      path.join(galleryDirectory, "gallery-data.mjs"),
      "utf8",
    );
    const app = readFileSync(path.join(galleryDirectory, "app.mjs"), "utf8");

    expect(data).toContain("exposesInternalIdsOnlyInDeveloperExample: true");
    expect(app).toContain('mode !== "developer"');
  });
});
