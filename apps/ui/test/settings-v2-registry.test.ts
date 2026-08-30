import { describe, expect, it } from "vitest";

import {
  getSettingsV2SearchableDefinitions,
  settingsV2AppearancePetDefinitions,
  settingsV2Categories,
  settingsV2GeneralDefinitions,
  settingsV2MemoryPrivacyDefinitions,
  settingsV2ModelsIntelligenceDefinitions,
  settingsV2NotificationsDefinitions,
  settingsV2ProductDefinitions,
  settingsV2ToolsPluginsDefinitions,
  settingsV2VoiceAudioDefinitions,
  validateSettingsV2Registry,
  type SettingsV2Definition,
} from "../src/features/settings-v2/settings-v2-registry";
import {
  formatSettingsV2MigrationSummary,
  getSettingsV2LegacyCategoryIds,
  getSettingsV2MigratedCategoryIds,
} from "../src/features/settings-v2/settings-v2-migration-summary";
import { tSettingsV2 } from "../src/features/settings-v2/settings-v2-copy";

const cloneDefinition = (
  patch: Partial<SettingsV2Definition>,
): SettingsV2Definition => ({
  ...settingsV2GeneralDefinitions[0],
  ...patch,
});

describe("Settings V2 registry", () => {
  it("registers General, Appearance & Pet, Voice & Audio, Models & Intelligence, Tools & Plugins, Memory & Privacy, and Notifications vertical slices", () => {
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
      "memory_privacy",
      "notifications",
    ]);
    expect(settingsV2GeneralDefinitions).toHaveLength(4);
    expect(settingsV2AppearancePetDefinitions).toHaveLength(6);
    expect(settingsV2VoiceAudioDefinitions).toHaveLength(6);
    expect(settingsV2ModelsIntelligenceDefinitions).toHaveLength(5);
    expect(settingsV2ToolsPluginsDefinitions).toHaveLength(6);
    expect(settingsV2MemoryPrivacyDefinitions).toHaveLength(3);
    expect(settingsV2NotificationsDefinitions).toHaveLength(5);
    expect(settingsV2ProductDefinitions).toHaveLength(35);
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
      "settings.memory.personal_memory",
      "settings.notifications.safe_viewing",
      "settings.general.close_button_behavior",
      "settings.pet.show",
      "settings.voice.capture_mode",
      "settings.models.answer_provider",
      "settings.tools.approved_apps",
      "settings.memory.saved_information",
      "settings.notifications.current_features",
      "settings.general.launch_at_login",
      "settings.pet.keep_on_top",
      "settings.voice.microphone_permission",
      "settings.models.local_models",
      "settings.tools.safe_websites",
      "settings.memory.storage_sync",
      "settings.notifications.in_app_status",
      "settings.general.reset_recovery",
      "settings.pet.reduced_motion",
      "settings.voice.push_to_talk",
      "settings.models.routing_policy",
      "settings.tools.file_search",
      "settings.notifications.tray_reminder",
      "settings.pet.reset_position",
      "settings.voice.tts",
      "settings.models.cloud_local_status",
      "settings.tools.plugins",
      "settings.notifications.privacy",
      "settings.skin.current",
      "settings.voice.wake_word",
      "settings.tools.mcp_connections",
    ]);
  });

  it("keeps product search text free of implementation and evaluation terms", () => {
    const searchableDefinitions = getSettingsV2SearchableDefinitions();
    const forbiddenEnglish = [
      "this slice",
      "boundary is not connected",
      "developer example",
      "management service",
      "fixture",
      "evaluation",
      "raw descriptor",
      "memory-recall",
      "route alias",
      "voice alias",
      "vector store",
      "embedding",
      "provider runtime",
      "raw snapshot",
      "boundary metrics",
    ];
    const forbiddenChinese = [
      "本切片",
      "边界尚未接入",
      "开发示例",
      "插件管理服务",
      "测试夹具",
      "评测",
      "原始描述",
    ];

    for (const definition of searchableDefinitions) {
      for (const locale of ["en", "zh"] as const) {
        const text = [
          tSettingsV2(locale, definition.labelKey),
          tSettingsV2(locale, definition.descriptionKey),
          ...definition.searchKeywordKeys.map((key) =>
            tSettingsV2(locale, key),
          ),
        ]
          .join(" ")
          .toLocaleLowerCase();
        const forbidden =
          locale === "en" ? forbiddenEnglish : forbiddenChinese;
        for (const term of forbidden) {
          expect(text).not.toContain(term.toLocaleLowerCase());
        }
      }
    }
  });

  it("keeps plugin search focused on plugin settings", () => {
    const searchableDefinitions = getSettingsV2SearchableDefinitions();
    const pluginMatches = searchableDefinitions.filter((definition) => {
      const text = [
        tSettingsV2("en", definition.labelKey),
        tSettingsV2("en", definition.descriptionKey),
        ...definition.searchKeywordKeys.map((key) => tSettingsV2("en", key)),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return text.includes("plugin");
    });
    const zhPluginMatches = searchableDefinitions.filter((definition) => {
      const text = [
        tSettingsV2("zh", definition.labelKey),
        tSettingsV2("zh", definition.descriptionKey),
        ...definition.searchKeywordKeys.map((key) => tSettingsV2("zh", key)),
      ].join(" ");
      return text.includes("插件");
    });

    expect(pluginMatches.map((definition) => definition.settingId)).toEqual([
      "settings.tools.plugins",
    ]);
    expect(zhPluginMatches.map((definition) => definition.settingId)).toEqual([
      "settings.tools.plugins",
    ]);
  });

  it("keeps Chinese memory search focused on Memory & Privacy actions and state", () => {
    const searchableDefinitions = getSettingsV2SearchableDefinitions();
    const zhMemoryMatches = searchableDefinitions.filter((definition) => {
      const text = [
        tSettingsV2("zh", definition.labelKey),
        tSettingsV2("zh", definition.descriptionKey),
        ...definition.searchKeywordKeys.map((key) => tSettingsV2("zh", key)),
      ].join(" ");
      return text.includes("记忆");
    });

    expect(zhMemoryMatches.length).toBeGreaterThanOrEqual(2);
    expect(
      zhMemoryMatches.every(
        (definition) => definition.categoryId === "memory_privacy",
      ),
    ).toBe(true);
    expect(zhMemoryMatches.map((definition) => definition.settingId)).toContain(
      "settings.memory.saved_information",
    );
  });

  it("keeps notification search focused on Notifications state and safety", () => {
    const searchableDefinitions = getSettingsV2SearchableDefinitions();
    const notificationMatches = searchableDefinitions.filter((definition) => {
      const text = [
        tSettingsV2("en", definition.labelKey),
        tSettingsV2("en", definition.descriptionKey),
        ...definition.searchKeywordKeys.map((key) => tSettingsV2("en", key)),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return text.includes("notification");
    });
    const zhNotificationMatches = searchableDefinitions.filter((definition) => {
      const text = [
        tSettingsV2("zh", definition.labelKey),
        tSettingsV2("zh", definition.descriptionKey),
        ...definition.searchKeywordKeys.map((key) => tSettingsV2("zh", key)),
      ].join(" ");
      return text.includes("通知");
    });

    expect(notificationMatches.length).toBeGreaterThanOrEqual(2);
    expect(
      notificationMatches.every(
        (definition) => definition.categoryId === "notifications",
      ),
    ).toBe(true);
    expect(zhNotificationMatches.length).toBeGreaterThanOrEqual(2);
    expect(
      zhNotificationMatches.every(
        (definition) => definition.categoryId === "notifications",
      ),
    ).toBe(true);

    for (const definition of [
      ...notificationMatches,
      ...zhNotificationMatches,
    ]) {
      for (const locale of ["en", "zh"] as const) {
        const text = [
          tSettingsV2(locale, definition.labelKey),
          tSettingsV2(locale, definition.descriptionKey),
          ...definition.searchKeywordKeys.map((key) => tSettingsV2(locale, key)),
        ].join(" ");
        for (const term of [
          "Notification API",
          "permission state",
          "dispatch",
          "toast payload",
          "renderer event",
          "task lifecycle",
          "IPC",
          "channel",
          "fixture",
          "debounce",
          "event bus",
          "capability probe",
          "AppUserModelID",
          "closeToTrayNoticeShown",
          "Notification.isSupported",
          "source of truth",
          "projection",
          "runtime binding",
          "通知接口",
          "权限状态字段",
          "分发器",
          "消息载荷",
          "渲染进程事件",
          "事件总线",
          "能力探针",
          "内部状态来源",
          "状态投影",
          "运行时绑定",
          "托盘提醒已显示标记",
        ]) {
          expect(text).not.toContain(term);
        }
      }
    }
  });

  it("formats the Settings V2 migration summary from the registry", () => {
    const migratedIds = getSettingsV2MigratedCategoryIds();
    const legacyIds = getSettingsV2LegacyCategoryIds();
    const enSummary = formatSettingsV2MigrationSummary("en");
    const zhSummary = formatSettingsV2MigrationSummary("zh");

    expect(migratedIds).toEqual([
      "general",
      "appearance_pet",
      "voice_audio",
      "models_intelligence",
      "tools_plugins",
      "memory_privacy",
      "notifications",
    ]);
    expect(legacyIds).toEqual(["about_updates"]);

    for (const category of settingsV2Categories) {
      const enLabel = tSettingsV2("en", category.labelKey);
      const zhLabel = tSettingsV2("zh", category.labelKey);
      expect(enSummary).toContain(enLabel);
      expect(zhSummary).toContain(zhLabel);
    }
    expect(enSummary.indexOf("Tools & Plugins")).toBeLessThan(
      enSummary.indexOf("Memory & Privacy"),
    );
    expect(zhSummary.indexOf("工具与插件")).toBeLessThan(
      zhSummary.indexOf("记忆与隐私"),
    );
  });
});
