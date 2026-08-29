import {
  type SettingsV2CategoryId,
  settingsV2Categories,
} from "./settings-v2-registry";
import { type SettingsV2Locale, tSettingsV2 } from "./settings-v2-copy";

function formatEnglishList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function formatZhList(items: string[]): string {
  return items.join("、");
}

export function getSettingsV2MigratedCategoryIds(): SettingsV2CategoryId[] {
  return settingsV2Categories
    .filter((category) => category.migrated)
    .map((category) => category.id);
}

export function getSettingsV2LegacyCategoryIds(): SettingsV2CategoryId[] {
  return settingsV2Categories
    .filter((category) => !category.migrated)
    .map((category) => category.id);
}

export function formatSettingsV2MigrationSummary(
  locale: SettingsV2Locale,
): string {
  const migrated = settingsV2Categories
    .filter((category) => category.migrated)
    .map((category) => tSettingsV2(locale, category.labelKey));
  const legacy = settingsV2Categories
    .filter((category) => !category.migrated)
    .map((category) => tSettingsV2(locale, category.labelKey));

  if (locale === "zh") {
    return `当前预览已开放：${formatZhList(migrated)}。尚未迁移的 ${formatZhList(
      legacy,
    )} 仍使用旧版设置。`;
  }

  return `Available in this preview: ${formatEnglishList(
    migrated,
  )}. Still in legacy settings: ${formatEnglishList(legacy)}.`;
}
