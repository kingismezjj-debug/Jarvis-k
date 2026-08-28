import type { SettingsV2CopyKey, SettingsV2Locale } from "./settings-v2-copy";
import { settingsV2Copy } from "./settings-v2-copy";

export const settingsV2CategoryIds = [
  "general",
  "appearance_pet",
  "voice_audio",
  "models_intelligence",
  "tools_plugins",
  "memory_privacy",
  "notifications",
  "about_updates",
] as const;

export type SettingsV2CategoryId = (typeof settingsV2CategoryIds)[number];

export const settingsV2SectionIds = [
  "interface",
  "desktop",
  "reset",
] as const;

export type SettingsV2SectionId = (typeof settingsV2SectionIds)[number];

export const settingsV2ControlTypes = [
  "value_dialog",
  "switch",
  "danger_disabled",
] as const;

export type SettingsV2ControlType = (typeof settingsV2ControlTypes)[number];

export const settingsV2BindingIds = [
  "ui.language",
  "desktop.close_button_behavior",
  "desktop.launch_at_login",
] as const;

export type SettingsV2BindingId = (typeof settingsV2BindingIds)[number];

export type SettingsV2Definition = {
  settingId: string;
  categoryId: SettingsV2CategoryId;
  sectionId: SettingsV2SectionId;
  labelKey: SettingsV2CopyKey;
  descriptionKey: SettingsV2CopyKey;
  searchKeywordKeys: SettingsV2CopyKey[];
  controlType: SettingsV2ControlType;
  settingBindingId: SettingsV2BindingId | null;
  validationContractId: string;
  capabilityGate: "product" | "development_settings_v2";
  visibility: "product" | "developer";
  sensitive: boolean;
  restartRequired: boolean;
  statusProjectionId: string;
  dangerLevel: "none" | "danger";
  order: number;
  helpReferenceId: string;
};

export type SettingsV2RegistryValidationResult = {
  ok: boolean;
  errors: string[];
};

export const settingsV2Categories: Array<{
  id: SettingsV2CategoryId;
  labelKey: SettingsV2CopyKey;
  migrated: boolean;
}> = [
  { id: "general", labelKey: "settings.categories.general", migrated: true },
  {
    id: "appearance_pet",
    labelKey: "settings.categories.appearance_pet",
    migrated: false,
  },
  {
    id: "voice_audio",
    labelKey: "settings.categories.voice_audio",
    migrated: false,
  },
  {
    id: "models_intelligence",
    labelKey: "settings.categories.models_intelligence",
    migrated: false,
  },
  {
    id: "tools_plugins",
    labelKey: "settings.categories.tools_plugins",
    migrated: false,
  },
  {
    id: "memory_privacy",
    labelKey: "settings.categories.memory_privacy",
    migrated: false,
  },
  {
    id: "notifications",
    labelKey: "settings.categories.notifications",
    migrated: false,
  },
  {
    id: "about_updates",
    labelKey: "settings.categories.about_updates",
    migrated: false,
  },
];

export const settingsV2GeneralDefinitions: SettingsV2Definition[] = [
  {
    settingId: "settings.general.display_language",
    categoryId: "general",
    sectionId: "interface",
    labelKey: "settings.general.displayLanguage.label",
    descriptionKey: "settings.general.displayLanguage.description",
    searchKeywordKeys: [
      "settings.general.displayLanguage.label",
      "settings.general.displayLanguage.description",
      "settings.general.displayLanguage.english",
      "settings.general.displayLanguage.chinese",
    ],
    controlType: "value_dialog",
    settingBindingId: "ui.language",
    validationContractId: "ui-language.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "ui.language.current",
    dangerLevel: "none",
    order: 10,
    helpReferenceId: "settings.general.display_language",
  },
  {
    settingId: "settings.general.close_button_behavior",
    categoryId: "general",
    sectionId: "desktop",
    labelKey: "settings.general.closeBehavior.label",
    descriptionKey: "settings.general.closeBehavior.description",
    searchKeywordKeys: [
      "settings.general.closeBehavior.label",
      "settings.general.closeBehavior.description",
      "settings.general.closeBehavior.minimizeToTray",
      "settings.general.closeBehavior.quit",
    ],
    controlType: "value_dialog",
    settingBindingId: "desktop.close_button_behavior",
    validationContractId: "desktop-close-button-behavior.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "desktop.close_button_behavior.current",
    dangerLevel: "none",
    order: 20,
    helpReferenceId: "settings.general.close_behavior",
  },
  {
    settingId: "settings.general.launch_at_login",
    categoryId: "general",
    sectionId: "desktop",
    labelKey: "settings.general.launchAtLogin.label",
    descriptionKey: "settings.general.launchAtLogin.description",
    searchKeywordKeys: [
      "settings.general.launchAtLogin.label",
      "settings.general.launchAtLogin.description",
    ],
    controlType: "switch",
    settingBindingId: "desktop.launch_at_login",
    validationContractId: "desktop-launch-at-login.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "desktop.launch_at_login.current",
    dangerLevel: "none",
    order: 30,
    helpReferenceId: "settings.general.launch_at_login",
  },
  {
    settingId: "settings.general.reset_recovery",
    categoryId: "general",
    sectionId: "reset",
    labelKey: "settings.general.reset.label",
    descriptionKey: "settings.general.reset.description",
    searchKeywordKeys: [
      "settings.general.reset.label",
      "settings.general.reset.description",
      "settings.general.reset.impact",
    ],
    controlType: "danger_disabled",
    settingBindingId: null,
    validationContractId: "settings-reset.unsupported.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "settings.reset.unsupported",
    dangerLevel: "danger",
    order: 40,
    helpReferenceId: "settings.general.reset_recovery",
  },
];

export function validateSettingsV2Registry(
  definitions: SettingsV2Definition[] = settingsV2GeneralDefinitions,
): SettingsV2RegistryValidationResult {
  const errors: string[] = [];
  const settingIds = new Set<string>();
  const orderKeys = new Set<string>();
  const bindingIds = new Set<string>(settingsV2BindingIds);

  for (const definition of definitions) {
    if (settingIds.has(definition.settingId)) {
      errors.push(`duplicate_setting_id:${definition.settingId}`);
    }
    settingIds.add(definition.settingId);

    const orderKey = `${definition.categoryId}:${definition.sectionId}:${definition.order}`;
    if (orderKeys.has(orderKey)) {
      errors.push(`duplicate_order:${orderKey}`);
    }
    orderKeys.add(orderKey);

    if (
      definition.categoryId === "general" &&
      definition.capabilityGate !== "development_settings_v2"
    ) {
      errors.push(`invalid_capability_gate:${definition.settingId}`);
    }
    if (definition.visibility === "developer") {
      errors.push(`product_references_developer_definition:${definition.settingId}`);
    }
    if (
      definition.settingBindingId !== null &&
      !bindingIds.has(definition.settingBindingId)
    ) {
      errors.push(`unknown_binding:${definition.settingId}`);
    }
    if (definition.sensitive && definition.visibility === "product") {
      errors.push(`sensitive_product_definition:${definition.settingId}`);
    }

    for (const locale of ["en", "zh"] satisfies SettingsV2Locale[]) {
      for (const key of [
        definition.labelKey,
        definition.descriptionKey,
        ...definition.searchKeywordKeys,
      ]) {
        const value = settingsV2Copy[locale][key];
        if (typeof value !== "string") {
          errors.push(`missing_${locale}_key:${definition.settingId}:${key}`);
        } else if (value.trim().length === 0) {
          errors.push(`empty_${locale}_key:${definition.settingId}:${key}`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function getSettingsV2SearchableDefinitions(): SettingsV2Definition[] {
  return settingsV2GeneralDefinitions
    .filter((definition) => definition.categoryId === "general")
    .sort((left, right) => left.order - right.order);
}
