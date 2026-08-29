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
  "appearance",
  "desktop_pet",
  "pet_skin",
  "voice_provider",
  "voice_capture",
  "voice_output",
  "wake_word",
] as const;

export type SettingsV2SectionId = (typeof settingsV2SectionIds)[number];

export const settingsV2ControlTypes = [
  "value_dialog",
  "switch",
  "danger_disabled",
  "theme_choice",
  "segmented",
  "readonly_status",
  "action",
] as const;

export type SettingsV2ControlType = (typeof settingsV2ControlTypes)[number];

export const settingsV2BindingIds = [
  "ui.language",
  "ui.theme",
  "desktop.close_button_behavior",
  "desktop.launch_at_login",
  "desktop.pet_enabled",
  "desktop.pet_always_on_top",
  "desktop.pet_reduced_motion",
  "desktop.pet_position_reset",
  "desktop.pet_skin_summary",
  "voice.provider_summary",
  "voice.capture_mode",
  "voice.microphone_permission",
  "voice.push_to_talk",
  "voice.tts_summary",
  "voice.wake_word",
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
    migrated: true,
  },
  {
    id: "voice_audio",
    labelKey: "settings.categories.voice_audio",
    migrated: true,
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

export const settingsV2AppearancePetDefinitions: SettingsV2Definition[] = [
  {
    settingId: "settings.appearance.theme",
    categoryId: "appearance_pet",
    sectionId: "appearance",
    labelKey: "settings.appearance.theme.label",
    descriptionKey: "settings.appearance.theme.description",
    searchKeywordKeys: [
      "settings.appearance.theme.label",
      "settings.appearance.theme.description",
      "settings.theme.signal.label",
      "settings.theme.harbor.label",
      "settings.theme.ember.label",
    ],
    controlType: "theme_choice",
    settingBindingId: "ui.theme",
    validationContractId: "desktop-ui-theme.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "ui.theme.current",
    dangerLevel: "none",
    order: 10,
    helpReferenceId: "settings.appearance.theme",
  },
  {
    settingId: "settings.pet.show",
    categoryId: "appearance_pet",
    sectionId: "desktop_pet",
    labelKey: "settings.pet.show.label",
    descriptionKey: "settings.pet.show.description",
    searchKeywordKeys: [
      "settings.pet.show.label",
      "settings.pet.show.description",
      "settings.pet.status.enabled",
      "settings.pet.status.disabled",
    ],
    controlType: "switch",
    settingBindingId: "desktop.pet_enabled",
    validationContractId: "desktop-pet-enabled.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "desktop.pet.enabled.current",
    dangerLevel: "none",
    order: 20,
    helpReferenceId: "settings.pet.show",
  },
  {
    settingId: "settings.pet.keep_on_top",
    categoryId: "appearance_pet",
    sectionId: "desktop_pet",
    labelKey: "settings.pet.keepOnTop.label",
    descriptionKey: "settings.pet.keepOnTop.description",
    searchKeywordKeys: [
      "settings.pet.keepOnTop.label",
      "settings.pet.keepOnTop.description",
    ],
    controlType: "switch",
    settingBindingId: "desktop.pet_always_on_top",
    validationContractId: "desktop-pet-always-on-top.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "desktop.pet.always_on_top.current",
    dangerLevel: "none",
    order: 30,
    helpReferenceId: "settings.pet.keep_on_top",
  },
  {
    settingId: "settings.pet.reduced_motion",
    categoryId: "appearance_pet",
    sectionId: "desktop_pet",
    labelKey: "settings.pet.reducedMotion.label",
    descriptionKey: "settings.pet.reducedMotion.description",
    searchKeywordKeys: [
      "settings.pet.reducedMotion.label",
      "settings.pet.reducedMotion.description",
      "settings.pet.reducedMotion.system",
      "settings.pet.reducedMotion.on",
      "settings.pet.reducedMotion.off",
    ],
    controlType: "segmented",
    settingBindingId: "desktop.pet_reduced_motion",
    validationContractId: "desktop-pet-reduced-motion.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "desktop.pet.reduced_motion.current",
    dangerLevel: "none",
    order: 40,
    helpReferenceId: "settings.pet.reduced_motion",
  },
  {
    settingId: "settings.pet.reset_position",
    categoryId: "appearance_pet",
    sectionId: "desktop_pet",
    labelKey: "settings.pet.resetPosition.label",
    descriptionKey: "settings.pet.resetPosition.description",
    searchKeywordKeys: [
      "settings.pet.resetPosition.label",
      "settings.pet.resetPosition.description",
    ],
    controlType: "action",
    settingBindingId: "desktop.pet_position_reset",
    validationContractId: "desktop-pet-position-reset.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "desktop.pet.position.reset",
    dangerLevel: "none",
    order: 50,
    helpReferenceId: "settings.pet.reset_position",
  },
  {
    settingId: "settings.skin.current",
    categoryId: "appearance_pet",
    sectionId: "pet_skin",
    labelKey: "settings.skin.current.label",
    descriptionKey: "settings.skin.current.description",
    searchKeywordKeys: [
      "settings.skin.current.label",
      "settings.skin.current.description",
      "settings.skin.status.builtIn",
      "settings.skin.status.local",
      "settings.skin.empty.title",
    ],
    controlType: "readonly_status",
    settingBindingId: "desktop.pet_skin_summary",
    validationContractId: "desktop-pet-skin-safe-summary.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "desktop.pet.skin.safe_summary",
    dangerLevel: "none",
    order: 60,
    helpReferenceId: "settings.skin.current",
  },
];

export const settingsV2VoiceAudioDefinitions: SettingsV2Definition[] = [
  {
    settingId: "settings.voice.provider",
    categoryId: "voice_audio",
    sectionId: "voice_provider",
    labelKey: "settings.voice.provider.label",
    descriptionKey: "settings.voice.provider.description",
    searchKeywordKeys: [
      "settings.voice.provider.label",
      "settings.voice.provider.description",
      "settings.voice.provider.notConfigured",
      "settings.voice.provider.configured",
      "settings.voice.provider.language.label",
    ],
    controlType: "action",
    settingBindingId: "voice.provider_summary",
    validationContractId: "voice-provider-secure-status.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "voice.provider.safe_status",
    dangerLevel: "none",
    order: 10,
    helpReferenceId: "settings.voice.provider",
  },
  {
    settingId: "settings.voice.capture_mode",
    categoryId: "voice_audio",
    sectionId: "voice_capture",
    labelKey: "settings.voice.captureMode.label",
    descriptionKey: "settings.voice.captureMode.description",
    searchKeywordKeys: [
      "settings.voice.captureMode.label",
      "settings.voice.captureMode.description",
      "settings.voice.captureMode.disabled",
      "settings.voice.captureMode.pushToTalk",
      "settings.voice.captureMode.continuous",
    ],
    controlType: "readonly_status",
    settingBindingId: "voice.capture_mode",
    validationContractId: "voice-capture-mode-safe-status.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "voice.capture.mode",
    dangerLevel: "none",
    order: 20,
    helpReferenceId: "settings.voice.capture_mode",
  },
  {
    settingId: "settings.voice.microphone_permission",
    categoryId: "voice_audio",
    sectionId: "voice_capture",
    labelKey: "settings.voice.microphone.label",
    descriptionKey: "settings.voice.microphone.description",
    searchKeywordKeys: [
      "settings.voice.microphone.label",
      "settings.voice.microphone.description",
      "settings.voice.microphone.unknown",
      "settings.voice.microphone.prompt",
      "settings.voice.microphone.granted",
      "settings.voice.microphone.denied",
    ],
    controlType: "readonly_status",
    settingBindingId: "voice.microphone_permission",
    validationContractId: "voice-microphone-permission-safe-status.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "voice.microphone.permission",
    dangerLevel: "none",
    order: 30,
    helpReferenceId: "settings.voice.microphone_permission",
  },
  {
    settingId: "settings.voice.push_to_talk",
    categoryId: "voice_audio",
    sectionId: "voice_capture",
    labelKey: "settings.voice.pushToTalk.label",
    descriptionKey: "settings.voice.pushToTalk.description",
    searchKeywordKeys: [
      "settings.voice.pushToTalk.label",
      "settings.voice.pushToTalk.description",
      "settings.voice.pushToTalk.available",
      "settings.voice.pushToTalk.unavailable",
    ],
    controlType: "action",
    settingBindingId: "voice.push_to_talk",
    validationContractId: "voice-push-to-talk-entry.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "voice.push_to_talk.entry",
    dangerLevel: "none",
    order: 40,
    helpReferenceId: "settings.voice.push_to_talk",
  },
  {
    settingId: "settings.voice.tts",
    categoryId: "voice_audio",
    sectionId: "voice_output",
    labelKey: "settings.voice.tts.label",
    descriptionKey: "settings.voice.tts.description",
    searchKeywordKeys: [
      "settings.voice.tts.label",
      "settings.voice.tts.description",
      "settings.voice.tts.configured",
      "settings.voice.tts.notConfigured",
    ],
    controlType: "action",
    settingBindingId: "voice.tts_summary",
    validationContractId: "voice-tts-secure-status.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "voice.tts.safe_status",
    dangerLevel: "none",
    order: 50,
    helpReferenceId: "settings.voice.tts",
  },
  {
    settingId: "settings.voice.wake_word",
    categoryId: "voice_audio",
    sectionId: "wake_word",
    labelKey: "settings.voice.wakeWord.label",
    descriptionKey: "settings.voice.wakeWord.description",
    searchKeywordKeys: [
      "settings.voice.wakeWord.label",
      "settings.voice.wakeWord.description",
      "settings.voice.wakeWord.unavailable",
    ],
    controlType: "readonly_status",
    settingBindingId: "voice.wake_word",
    validationContractId: "voice-wake-word-unsupported.v1",
    capabilityGate: "development_settings_v2",
    visibility: "product",
    sensitive: false,
    restartRequired: false,
    statusProjectionId: "voice.wake_word.unsupported",
    dangerLevel: "none",
    order: 60,
    helpReferenceId: "settings.voice.wake_word",
  },
];

export const settingsV2ProductDefinitions: SettingsV2Definition[] = [
  ...settingsV2GeneralDefinitions,
  ...settingsV2AppearancePetDefinitions,
  ...settingsV2VoiceAudioDefinitions,
];

export function validateSettingsV2Registry(
  definitions: SettingsV2Definition[] = settingsV2ProductDefinitions,
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
  return settingsV2ProductDefinitions
    .filter(
      (definition) =>
        definition.categoryId === "general" ||
        definition.categoryId === "appearance_pet" ||
        definition.categoryId === "voice_audio",
    )
    .sort((left, right) => left.order - right.order);
}
