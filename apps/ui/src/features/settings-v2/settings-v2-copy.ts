export type SettingsV2Locale = "en" | "zh";

export type SettingsV2CopyKey =
  | "settings.shell.title"
  | "settings.shell.description"
  | "settings.shell.search"
  | "settings.shell.category"
  | "settings.shell.migratedOnly"
  | "settings.shell.notMigratedTitle"
  | "settings.shell.notMigratedDescription"
  | "settings.categories.general"
  | "settings.categories.appearance_pet"
  | "settings.categories.voice_audio"
  | "settings.categories.models_intelligence"
  | "settings.categories.tools_plugins"
  | "settings.categories.memory_privacy"
  | "settings.categories.notifications"
  | "settings.categories.about_updates"
  | "settings.general.title"
  | "settings.general.description"
  | "settings.general.section.interface"
  | "settings.general.section.desktop"
  | "settings.general.section.reset"
  | "settings.general.displayLanguage.label"
  | "settings.general.displayLanguage.description"
  | "settings.general.displayLanguage.action"
  | "settings.general.displayLanguage.dialogTitle"
  | "settings.general.displayLanguage.dialogDescription"
  | "settings.general.displayLanguage.english"
  | "settings.general.displayLanguage.chinese"
  | "settings.general.closeBehavior.label"
  | "settings.general.closeBehavior.description"
  | "settings.general.closeBehavior.action"
  | "settings.general.closeBehavior.dialogTitle"
  | "settings.general.closeBehavior.dialogDescription"
  | "settings.general.closeBehavior.minimizeToTray"
  | "settings.general.closeBehavior.quit"
  | "settings.general.launchAtLogin.label"
  | "settings.general.launchAtLogin.description"
  | "settings.general.launchAtLogin.unavailable"
  | "settings.general.launchAtLogin.retry"
  | "settings.general.reset.label"
  | "settings.general.reset.description"
  | "settings.general.reset.impact"
  | "settings.general.reset.action"
  | "settings.general.reset.details"
  | "settings.general.reset.unsupported"
  | "settings.common.currentValue"
  | "settings.common.close"
  | "settings.common.cancel"
  | "settings.common.done"
  | "settings.search.results"
  | "settings.search.noResultsTitle"
  | "settings.search.noResultsDescription"
  | "settings.status.on"
  | "settings.status.off"
  | "settings.status.unknown"
  | "settings.status.localOnly"
  | "settings.status.notSupported"
  | "settings.status.operationInProgress"
  | "settings.errors.save_failed"
  | "settings.errors.validation_failed"
  | "settings.errors.unavailable"
  | "settings.errors.permission_required"
  | "settings.errors.operation_in_progress"
  | "settings.errors.confirmation_required"
  | "settings.errors.reset_not_supported"
  | "settings.confirmation.resetTitle"
  | "settings.confirmation.resetDescription";

export type SettingsV2ErrorCode =
  | "save_failed"
  | "validation_failed"
  | "unavailable"
  | "permission_required"
  | "operation_in_progress"
  | "confirmation_required"
  | "reset_not_supported";

export const settingsV2Copy: Record<
  SettingsV2Locale,
  Record<SettingsV2CopyKey, string>
> = {
  en: {
    "settings.shell.title": "Jarvis Settings",
    "settings.shell.description":
      "General settings are available in this preview. Other categories stay on the legacy settings surface.",
    "settings.shell.search": "Search General settings",
    "settings.shell.category": "Settings category",
    "settings.shell.migratedOnly": "General preview",
    "settings.shell.notMigratedTitle": "This category has not moved yet",
    "settings.shell.notMigratedDescription":
      "Use the legacy settings page for this area until the next vertical slice migrates it.",
    "settings.categories.general": "General",
    "settings.categories.appearance_pet": "Appearance & Pet",
    "settings.categories.voice_audio": "Voice & Audio",
    "settings.categories.models_intelligence": "Models & Intelligence",
    "settings.categories.tools_plugins": "Tools & Plugins",
    "settings.categories.memory_privacy": "Memory & Privacy",
    "settings.categories.notifications": "Notifications",
    "settings.categories.about_updates": "About & Updates",
    "settings.general.title": "General",
    "settings.general.description":
      "Language, window behavior, Windows sign-in launch, and reset boundaries.",
    "settings.general.section.interface": "Interface",
    "settings.general.section.desktop": "Desktop behavior",
    "settings.general.section.reset": "Reset & Recovery",
    "settings.general.displayLanguage.label": "Display language",
    "settings.general.displayLanguage.description":
      "Choose the language Jarvis uses in this settings preview.",
    "settings.general.displayLanguage.action": "Choose display language",
    "settings.general.displayLanguage.dialogTitle": "Choose display language",
    "settings.general.displayLanguage.dialogDescription":
      "This changes Settings V2 immediately and keeps the existing app language preference.",
    "settings.general.displayLanguage.english": "English",
    "settings.general.displayLanguage.chinese": "Chinese (Simplified)",
    "settings.general.closeBehavior.label": "When closing the main window",
    "settings.general.closeBehavior.description":
      "Choose what happens when you click the close button.",
    "settings.general.closeBehavior.action": "Choose close behavior",
    "settings.general.closeBehavior.dialogTitle": "When closing the main window",
    "settings.general.closeBehavior.dialogDescription":
      "This uses the existing desktop setting and does not close Jarvis while you are choosing.",
    "settings.general.closeBehavior.minimizeToTray":
      "Minimize to system tray",
    "settings.general.closeBehavior.quit": "Quit Jarvis",
    "settings.general.launchAtLogin.label": "Launch after Windows sign-in",
    "settings.general.launchAtLogin.description":
      "Start Jarvis-K Alpha after you sign in to Windows.",
    "settings.general.launchAtLogin.unavailable":
      "Available only in packaged Alpha or Stable builds.",
    "settings.general.launchAtLogin.retry": "Retry",
    "settings.general.reset.label": "Restore default settings",
    "settings.general.reset.description":
      "The full reset boundary is not connected in this slice.",
    "settings.general.reset.impact":
      "This preview will not delete credentials, conversations, memory, plugins, skins, acceptance ledgers, or user files.",
    "settings.general.reset.action": "Restore default settings",
    "settings.general.reset.details": "Review reset boundary",
    "settings.general.reset.unsupported": "Reset is not available yet",
    "settings.common.currentValue": "Current value",
    "settings.common.close": "Close",
    "settings.common.cancel": "Cancel",
    "settings.common.done": "Done",
    "settings.search.results": "results",
    "settings.search.noResultsTitle": "No matching settings",
    "settings.search.noResultsDescription":
      "Only General settings are searchable in this preview.",
    "settings.status.on": "On",
    "settings.status.off": "Off",
    "settings.status.unknown": "Unknown",
    "settings.status.localOnly": "Local only",
    "settings.status.notSupported": "Not supported",
    "settings.status.operationInProgress": "Saving",
    "settings.errors.save_failed": "The setting could not be saved.",
    "settings.errors.validation_failed": "The setting value was rejected.",
    "settings.errors.unavailable": "This setting is unavailable.",
    "settings.errors.permission_required": "Windows permission is required.",
    "settings.errors.operation_in_progress": "Another settings action is running.",
    "settings.errors.confirmation_required": "Confirm before continuing.",
    "settings.errors.reset_not_supported": "Reset is not connected yet.",
    "settings.confirmation.resetTitle": "Restore default settings",
    "settings.confirmation.resetDescription":
      "This action remains unavailable until a safe reset contract is implemented.",
  },
  zh: {
    "settings.shell.title": "Jarvis 设置",
    "settings.shell.description":
      "当前预览只开放通用设置。其他分类仍保留在旧版设置界面中。",
    "settings.shell.search": "搜索通用设置",
    "settings.shell.category": "设置分类",
    "settings.shell.migratedOnly": "通用预览",
    "settings.shell.notMigratedTitle": "此分类尚未迁移",
    "settings.shell.notMigratedDescription":
      "在下一轮纵向切片迁移前，请继续使用旧版设置处理这部分内容。",
    "settings.categories.general": "通用",
    "settings.categories.appearance_pet": "外观与桌宠",
    "settings.categories.voice_audio": "语音与音频",
    "settings.categories.models_intelligence": "模型与智能",
    "settings.categories.tools_plugins": "工具与插件",
    "settings.categories.memory_privacy": "记忆与隐私",
    "settings.categories.notifications": "通知",
    "settings.categories.about_updates": "关于与更新",
    "settings.general.title": "通用",
    "settings.general.description":
      "管理界面语言、窗口关闭方式、登录后启动，以及重置边界。",
    "settings.general.section.interface": "界面",
    "settings.general.section.desktop": "桌面行为",
    "settings.general.section.reset": "重置与恢复",
    "settings.general.displayLanguage.label": "界面语言",
    "settings.general.displayLanguage.description":
      "选择此设置预览中 Jarvis 使用的显示语言。",
    "settings.general.displayLanguage.action": "选择界面语言",
    "settings.general.displayLanguage.dialogTitle": "选择界面语言",
    "settings.general.displayLanguage.dialogDescription":
      "此设置会立即更新 Settings V2，并沿用现有应用语言偏好。",
    "settings.general.displayLanguage.english": "English",
    "settings.general.displayLanguage.chinese": "中文（简体）",
    "settings.general.closeBehavior.label": "关闭主窗口时",
    "settings.general.closeBehavior.description":
      "选择点击关闭按钮后的行为。",
    "settings.general.closeBehavior.action": "选择关闭行为",
    "settings.general.closeBehavior.dialogTitle": "关闭主窗口时",
    "settings.general.closeBehavior.dialogDescription":
      "这里使用现有桌面设置，不会在选择时直接关闭 Jarvis。",
    "settings.general.closeBehavior.minimizeToTray": "最小化到系统托盘",
    "settings.general.closeBehavior.quit": "退出 Jarvis",
    "settings.general.launchAtLogin.label": "登录后自动启动",
    "settings.general.launchAtLogin.description":
      "Windows 登录后启动 Jarvis-K Alpha。",
    "settings.general.launchAtLogin.unavailable":
      "仅在打包后的 Alpha 或 Stable 版本中可用。",
    "settings.general.launchAtLogin.retry": "重试",
    "settings.general.reset.label": "恢复默认设置",
    "settings.general.reset.description": "完整重置边界尚未在本切片接入。",
    "settings.general.reset.impact":
      "此预览不会删除凭证、对话、记忆、插件、皮肤、验收账本或用户文件。",
    "settings.general.reset.action": "恢复默认设置",
    "settings.general.reset.details": "查看重置边界",
    "settings.general.reset.unsupported": "重置暂不可用",
    "settings.common.currentValue": "当前值",
    "settings.common.close": "关闭",
    "settings.common.cancel": "取消",
    "settings.common.done": "完成",
    "settings.search.results": "条结果",
    "settings.search.noResultsTitle": "没有匹配的设置",
    "settings.search.noResultsDescription": "此预览仅搜索通用设置。",
    "settings.status.on": "开启",
    "settings.status.off": "关闭",
    "settings.status.unknown": "未知",
    "settings.status.localOnly": "仅本机",
    "settings.status.notSupported": "不支持",
    "settings.status.operationInProgress": "正在保存",
    "settings.errors.save_failed": "设置无法保存。",
    "settings.errors.validation_failed": "设置值未通过校验。",
    "settings.errors.unavailable": "此设置不可用。",
    "settings.errors.permission_required": "需要 Windows 权限。",
    "settings.errors.operation_in_progress": "已有设置操作正在进行。",
    "settings.errors.confirmation_required": "继续前需要确认。",
    "settings.errors.reset_not_supported": "重置功能尚未接入。",
    "settings.confirmation.resetTitle": "恢复默认设置",
    "settings.confirmation.resetDescription":
      "安全重置合同完成前，此操作保持不可用。",
  },
} as const;

export function tSettingsV2(
  locale: SettingsV2Locale,
  key: SettingsV2CopyKey,
): string {
  return settingsV2Copy[locale][key];
}

export function formatSettingsV2Error(
  locale: SettingsV2Locale,
  code: SettingsV2ErrorCode,
): string {
  return settingsV2Copy[locale][`settings.errors.${code}`];
}

export function validateSettingsV2CopyParity(): {
  ok: boolean;
  keyCount: number;
  missing: string[];
  empty: string[];
} {
  const enKeys = Object.keys(settingsV2Copy.en).sort();
  const zhKeys = Object.keys(settingsV2Copy.zh).sort();
  const keySet = new Set([...enKeys, ...zhKeys]);
  const missing: string[] = [];
  const empty: string[] = [];
  for (const key of keySet) {
    if (!(key in settingsV2Copy.en)) missing.push(`en:${key}`);
    if (!(key in settingsV2Copy.zh)) missing.push(`zh:${key}`);
    const enValue = settingsV2Copy.en[key as SettingsV2CopyKey];
    const zhValue = settingsV2Copy.zh[key as SettingsV2CopyKey];
    if (enValue !== undefined && enValue.trim().length === 0) {
      empty.push(`en:${key}`);
    }
    if (zhValue !== undefined && zhValue.trim().length === 0) {
      empty.push(`zh:${key}`);
    }
  }
  return {
    ok: missing.length === 0 && empty.length === 0,
    keyCount: enKeys.length,
    missing,
    empty,
  };
}
