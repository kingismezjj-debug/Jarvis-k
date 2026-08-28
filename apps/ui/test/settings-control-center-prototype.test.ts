import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const prototypeModule = await import(
  "../../../prototypes/settings-control-center/prototype-data.mjs"
);

const prototypeDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "prototypes",
  "settings-control-center",
);

const readPrototypeSource = () =>
  ["index.html", "app.mjs", "prototype-data.mjs", "styles.css"]
    .map((file) => readFileSync(path.join(prototypeDirectory, file), "utf8"))
    .join("\n");

const productCategoryOrder = [
  "general",
  "appearance_pet",
  "voice_audio",
  "models_intelligence",
  "tools_plugins",
  "memory_privacy",
  "notifications",
  "about_updates",
];

describe("Jarvis Control Center prototype", () => {
  it("models the revised Product information architecture", () => {
    expect(prototypeModule.productCategoryOrder).toEqual(productCategoryOrder);
    expect(prototypeModule.categoryOrder).toEqual([
      ...productCategoryOrder,
      "developer_evaluation",
    ]);

    for (const locale of prototypeModule.locales) {
      for (const categoryId of prototypeModule.categoryOrder) {
        expect(prototypeModule.prototypeCopy[locale].categories[categoryId]).toBeTruthy();
      }
    }
  });

  it("keeps the prototype static and disconnected from Product runtime APIs", () => {
    const combined = readPrototypeSource();

    for (const forbidden of [
      "window.jarvis",
      "ipcRenderer",
      "safeStorage",
      "showOpenDialog",
      "localStorage",
      "fetch(",
      "XMLHttpRequest",
      "credential.value",
      "apiKey",
      "secret",
    ]) {
      expect(combined).not.toContain(forbidden);
    }
  });

  it("does not wire the prototype into Product navigation or packaged Alpha files", () => {
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
    const packagedFiles = JSON.stringify(rootPackage.build.files);

    expect(appSource).not.toContain("settings-control-center");
    expect(appSource).not.toContain("Jarvis Control Center");
    expect(packagedFiles).not.toContain("prototypes");
    expect(packagedFiles).not.toContain("settings-control-center");
  });

  it("models the Settings Definition Registry fields without storing values", () => {
    expect(prototypeModule.settingsRegistryDraft.requiredFields).toEqual([
      "settingId",
      "categoryId",
      "sectionId",
      "labelKey",
      "descriptionKey",
      "searchKeywordKeys",
      "controlType",
      "settingBindingId",
      "validationContractId",
      "capabilityGate",
      "visibility",
      "sensitive",
      "restartRequired",
      "defaultValueProjection",
      "statusProjectionId",
      "dangerLevel",
      "order",
      "helpReferenceId",
    ]);
    expect(JSON.stringify(prototypeModule.settingsRegistryDraft)).not.toContain("apiKey");
  });

  it("represents required prototype examples", () => {
    const allSettings = prototypeModule.settingsCategories.flatMap(
      (category: { sections: { settings: unknown[] }[] }) =>
        category.sections.flatMap((section) => section.settings),
    );
    expect(
      prototypeModule.settingsCategories.some(
        (category: { id: string }) => category.id === "developer_evaluation",
      ),
    ).toBe(true);
    expect(
      allSettings.some(
        (setting: { kind?: string; sensitive?: boolean }) =>
          setting.kind === "credential" && setting.sensitive === true,
      ),
    ).toBe(true);
    expect(
      allSettings.some((setting: { kind?: string }) => setting.kind === "unavailable"),
    ).toBe(true);
    expect(
      allSettings.some((setting: { kind?: string }) => setting.kind === "danger"),
    ).toBe(true);
    expect(
      allSettings.some((setting: { kind?: string }) => setting.kind === "diagnostic"),
    ).toBe(true);
  });

  it("keeps internal labels out of normal Product copy", () => {
    const productCategories = prototypeModule.settingsCategories.filter(
      (category: { id: string }) => productCategoryOrder.includes(category.id),
    );
    const productText = JSON.stringify(productCategories);

    for (const forbidden of [
      "EVERYONE",
      "READY",
      "PRODUCT",
      "PLANNED",
      "NEEDS_SETUP",
      "DANGER ZONE",
      "PROTOTYPE DATA",
      "controlType",
      "capabilityId",
      "developer.",
    ]) {
      expect(productText).not.toContain(forbidden);
    }

    expect(prototypeModule.prototypeFlags.productHasStatusRail).toBe(false);
    expect(prototypeModule.prototypeFlags.productShowsDeveloperCategoryByDefault).toBe(false);
    expect(prototypeModule.prototypeFlags.productShowsInternalControlType).toBe(false);
  });

  it("keeps Chinese Product copy productized without mojibake or untranslated controls", () => {
    const localizedValues: string[] = [];
    const collect = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      const record = value as Record<string, unknown>;
      if (typeof record["zh-CN"] === "string") {
        localizedValues.push(record["zh-CN"]);
      }
      for (const child of Object.values(record)) collect(child);
    };
    collect(prototypeModule.prototypeCopy["zh-CN"]);
    collect(
      prototypeModule.settingsCategories.filter((category: { id: string }) =>
        productCategoryOrder.includes(category.id),
      ),
    );
    const zhCopy = localizedValues.join("\n");
    expect(zhCopy).not.toMatch(/[�锟閿鈥]/);

    for (const forbidden of [
      "Prototype",
      "Developer tools",
      "Danger zone",
      "Change",
      "switch",
      "segmented",
      "select",
      "button",
      "ready",
      "unavailable",
    ]) {
      expect(zhCopy).not.toContain(forbidden);
    }
  });
});
