export type JarvisStatusKey =
  | "ready"
  | "configured"
  | "not_configured"
  | "unavailable"
  | "requires_setup"
  | "disabled"
  | "local_only"
  | "read_only"
  | "update_available";

export type JarvisStatusTone = "success" | "warning" | "danger" | "info" | "muted";

export type JarvisStatusSurface = "product" | "developer";
export type JarvisStatusLocale = "en" | "zh-CN";

export type JarvisStatusPresentation = {
  key: JarvisStatusKey;
  tone: JarvisStatusTone;
  product: Record<JarvisStatusLocale, string>;
  developer: Record<JarvisStatusLocale, string>;
};

export const jarvisStatusDictionary: Record<
  JarvisStatusKey,
  JarvisStatusPresentation
> = {
  ready: {
    key: "ready",
    tone: "success",
    product: { en: "Ready to use", "zh-CN": "可直接使用" },
    developer: { en: "ready", "zh-CN": "ready" },
  },
  configured: {
    key: "configured",
    tone: "success",
    product: { en: "Configured", "zh-CN": "已配置" },
    developer: { en: "configured", "zh-CN": "configured" },
  },
  not_configured: {
    key: "not_configured",
    tone: "warning",
    product: { en: "Not configured", "zh-CN": "未配置" },
    developer: { en: "not_configured", "zh-CN": "not_configured" },
  },
  unavailable: {
    key: "unavailable",
    tone: "warning",
    product: { en: "Unavailable", "zh-CN": "暂不可用" },
    developer: { en: "unavailable", "zh-CN": "unavailable" },
  },
  requires_setup: {
    key: "requires_setup",
    tone: "warning",
    product: { en: "Setup required", "zh-CN": "需要设置" },
    developer: { en: "requires_setup", "zh-CN": "requires_setup" },
  },
  disabled: {
    key: "disabled",
    tone: "muted",
    product: { en: "Off", "zh-CN": "已关闭" },
    developer: { en: "disabled", "zh-CN": "disabled" },
  },
  local_only: {
    key: "local_only",
    tone: "info",
    product: { en: "Local only", "zh-CN": "仅在本机处理" },
    developer: { en: "local_only", "zh-CN": "local_only" },
  },
  read_only: {
    key: "read_only",
    tone: "info",
    product: { en: "Read only", "zh-CN": "只读" },
    developer: { en: "read_only", "zh-CN": "read_only" },
  },
  update_available: {
    key: "update_available",
    tone: "info",
    product: { en: "Update available", "zh-CN": "有可用更新" },
    developer: { en: "update_available", "zh-CN": "update_available" },
  },
};

export function getJarvisStatusLabel({
  key,
  locale,
  surface = "product",
}: {
  key: JarvisStatusKey;
  locale: JarvisStatusLocale;
  surface?: JarvisStatusSurface;
}): string {
  return jarvisStatusDictionary[key][surface][locale];
}
