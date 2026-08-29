import { describe, expect, it } from "vitest";

import {
  getSettingsV2SearchableDefinitions,
  settingsV2AppearancePetDefinitions,
  settingsV2Categories,
  settingsV2GeneralDefinitions,
  settingsV2ModelsIntelligenceDefinitions,
  settingsV2ProductDefinitions,
  settingsV2ToolsPluginsDefinitions,
  settingsV2VoiceAudioDefinitions,
  validateSettingsV2Registry,
  type SettingsV2Definition,
} from "../src/features/settings-v2/settings-v2-registry";

const cloneDefinition = (
  patch: Partial<SettingsV2Definition>,
): SettingsV2Definition => ({
  ...settingsV2GeneralDefinitions[0],
  ...patch,
});

describe("Settings V2 registry", () => {
  it("registers General, Appearance & Pet, Voice & Audio, Models & Intelligence, and Tools & Plugins vertical slices", () => {
    expect(settingsV2Categories.map((category) => category.id)).toEqual([
      "general",
      "appearance_pet",
      "voice_audio",
      "models_intelligence",
      "tools_plugins",
      "memory_privacy",
      "notifications",
      "about_updates",
    ]);
    expect(settingsV2Categories.filter((category) => category.migrated).map((category) => category.id)).toEqual([
      "general",
      "appearance_pet",
      "voice_audio",
      "models_intelligence",
      "tools_plugins",
    ]);
    expect(settingsV2GeneralDefinitions).toHaveLength(4);
    expect(settingsV2AppearancePetDefinitions).toHaveLength(6);
    expect(settingsV2VoiceAudioDefinitions).toHaveLength(6);
    expect(settingsV2ModelsIntelligenceDefinitions).toHaveLength(5);
    expect(settingsV2ToolsPluginsDefinitions).toHaveLength(6);
    expect(settingsV2ProductDefinitions).toHaveLength(27);
    expect(settingsV2GeneralDefinitions.map((definition) => definition.order)).toEqual([
      10,
      20,
      30,
      40,
    ]);
    expect(validateSettingsV2Registry().ok).toBe(true);
  });

  it("fails closed for duplicate setting IDs and duplicate order", () => {
    const duplicateId = validateSettingsV2Registry([
      settingsV2GeneralDefinitions[0],
      cloneDefinition({ order: 11 }),
    ]);
    expect(duplicateId.errors).toContain(
      `duplicate_setting_id:${settingsV2GeneralDefinitions[0].settingId}`,
    );

    const duplicateOrder = validateSettingsV2Registry([
      settingsV2GeneralDefinitions[0],
      cloneDefinition({
        settingId: "settings.general.display_language.copy",
      }),
    ]);
    expect(duplicateOrder.errors).toContain("duplicate_order:general:interface:10");
  });

  it("fails closed for missing localized copy keys", () => {
    const result = validateSettingsV2Registry([
      cloneDefinition({
        labelKey: "settings.general.missing.label" as SettingsV2Definition["labelKey"],
      }),
    ]);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "missing_en_key:settings.general.display_language:settings.general.missing.label",
    );
    expect(result.errors).toContain(
      "missing_zh_key:settings.general.display_language:settings.general.missing.label",
    );
  });

  it("fails closed for unknown bindings and developer-only product definitions", () => {
    const unknownBinding = validateSettingsV2Registry([
      cloneDefinition({
        settingBindingId:
          "desktop.unknown_binding" as SettingsV2Definition["settingBindingId"],
      }),
    ]);
    expect(unknownBinding.errors).toContain(
      "unknown_binding:settings.general.display_language",
    );

    const developerDefinition = validateSettingsV2Registry([
      cloneDefinition({ visibility: "developer" }),
    ]);
    expect(developerDefinition.errors).toContain(
      "product_references_developer_definition:settings.general.display_language",
    );
  });

  it("does not allow sensitive product definitions", () => {
    const result = validateSettingsV2Registry([
      cloneDefinition({ sensitive: true }),
    ]);
    expect(result.errors).toContain(
      "sensitive_product_definition:settings.general.display_language",
    );
  });

  it("returns deterministic migrated product search definitions", () => {
    expect(
      getSettingsV2SearchableDefinitions().map(
        (definition) => definition.settingId,
      ),
    ).toEqual([
      "settings.general.display_language",
      "settings.appearance.theme",
      "settings.voice.provider",
      "settings.models.fast_command_understanding",
      "settings.tools.automation_safeguards",
      "settings.general.close_button_behavior",
      "settings.pet.show",
      "settings.voice.capture_mode",
      "settings.models.answer_provider",
      "settings.tools.approved_apps",
      "settings.general.launch_at_login",
      "settings.pet.keep_on_top",
      "settings.voice.microphone_permission",
      "settings.models.local_models",
      "settings.tools.safe_websites",
      "settings.general.reset_recovery",
      "settings.pet.reduced_motion",
      "settings.voice.push_to_talk",
      "settings.models.routing_policy",
      "settings.tools.file_search",
      "settings.pet.reset_position",
      "settings.voice.tts",
      "settings.models.cloud_local_status",
      "settings.tools.plugins",
      "settings.skin.current",
      "settings.voice.wake_word",
      "settings.tools.mcp_connections",
    ]);
  });
});
