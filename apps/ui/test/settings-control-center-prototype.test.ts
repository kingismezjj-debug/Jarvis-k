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

describe("Jarvis Control Center prototype", () => {
  it("covers the approved settings information architecture in English and Chinese", () => {
    expect(prototypeModule.categoryOrder).toEqual([
      "general",
      "appearance_pet",
      "voice_audio",
      "models_intelligence",
      "tools_automation",
      "plugins_mcp",
      "memory_privacy",
      "notifications",
      "advanced",
      "developer_evaluation",
      "about_updates",
    ]);
    for (const locale of prototypeModule.locales) {
      for (const categoryId of prototypeModule.categoryOrder) {
        expect(prototypeModule.prototypeCopy[locale].categories[categoryId]).toBeTruthy();
      }
    }
  });

  it("keeps the prototype static and disconnected from Product runtime APIs", () => {
    const combined = ["index.html", "app.mjs", "prototype-data.mjs", "styles.css"]
      .map((file) => readFileSync(path.join(prototypeDirectory, file), "utf8"))
      .join("\n");

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
    expect(combined).toContain("Prototype data");
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
    const categories = prototypeModule.settingsCategories;
    const allSettings = categories.flatMap((category: { sections: { settings: unknown[] }[] }) =>
      category.sections.flatMap((section) => section.settings),
    );
    expect(categories.some((category: { id: string }) => category.id === "developer_evaluation")).toBe(true);
    expect(
      allSettings.some(
        (setting: { control?: string; sensitive?: boolean; status?: string }) =>
          setting.control === "credential" && setting.sensitive === true,
      ),
    ).toBe(true);
    expect(
      allSettings.some((setting: { status?: string }) => setting.status === "unavailable"),
    ).toBe(true);
    expect(
      allSettings.some((setting: { danger?: string }) => setting.danger === "high"),
    ).toBe(true);
  });
});
