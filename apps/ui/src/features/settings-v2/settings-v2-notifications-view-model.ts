import {
  type SettingsV2Locale,
  tSettingsV2,
} from "./settings-v2-copy";

export type SettingsV2NotificationsProductViewModel = {
  safeViewing: {
    value: string;
    details: string[];
  };
  currentFeatures: {
    value: string;
    details: string[];
  };
  inAppStatus: {
    value: string;
    details: string[];
  };
  trayReminder: {
    value: string;
    details: string[];
  };
  privacy: {
    value: string;
    details: string[];
  };
};

export function buildSettingsV2NotificationsProductViewModel({
  locale,
}: {
  locale: SettingsV2Locale;
}): SettingsV2NotificationsProductViewModel {
  return {
    safeViewing: {
      value: tSettingsV2(locale, "settings.notifications.safeViewing.safe"),
      details: [
        tSettingsV2(locale, "settings.notifications.safeViewing.description"),
      ],
    },
    currentFeatures: {
      value: tSettingsV2(
        locale,
        "settings.notifications.currentFeatures.limited",
      ),
      details: [
        tSettingsV2(
          locale,
          "settings.notifications.currentFeatures.noFullWindowsSettings",
        ),
      ],
    },
    inAppStatus: {
      value: tSettingsV2(
        locale,
        "settings.notifications.inAppStatus.available",
      ),
      details: [
        tSettingsV2(locale, "settings.notifications.inAppStatus.description"),
      ],
    },
    trayReminder: {
      value: tSettingsV2(
        locale,
        "settings.notifications.trayReminder.mayAppearOnce",
      ),
      details: [
        tSettingsV2(locale, "settings.notifications.trayReminder.description"),
      ],
    },
    privacy: {
      value: tSettingsV2(locale, "settings.notifications.privacy.summary"),
      details: [
        tSettingsV2(locale, "settings.notifications.privacy.description"),
      ],
    },
  };
}
