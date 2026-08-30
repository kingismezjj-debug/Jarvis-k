import type { MemoryAlphaStatus } from "@jarvis-k/contracts";

import {
  type SettingsV2Locale,
  tSettingsV2,
} from "./settings-v2-copy";

export type SettingsV2MemoryPrivacyProductViewModel = {
  safeNotice: string;
  personalMemory: {
    value: string;
    details: string[];
  };
  savedInformation: {
    value: string;
    details: string[];
  };
  storageSync: {
    value: string;
    details: string[];
  };
};

export function buildSettingsV2MemoryPrivacyProductViewModel({
  locale,
  memoryAlphaStatus,
}: {
  locale: SettingsV2Locale;
  memoryAlphaStatus?: MemoryAlphaStatus | null;
}): SettingsV2MemoryPrivacyProductViewModel {
  return {
    safeNotice: tSettingsV2(locale, "settings.memory.safeViewing.notice"),
    personalMemory: formatPersonalMemory(locale, memoryAlphaStatus),
    savedInformation: {
      value: tSettingsV2(locale, "settings.memory.savedInformation.manageValue"),
      details: [
        tSettingsV2(locale, "settings.memory.savedInformation.shortcuts"),
        tSettingsV2(locale, "settings.memory.savedInformation.voiceCorrections"),
        tSettingsV2(locale, "settings.memory.savedInformation.responsePreferences"),
        tSettingsV2(locale, "settings.memory.savedInformation.deleteInMemoryCenter"),
      ],
    },
    storageSync: {
      value: tSettingsV2(locale, "settings.memory.storage.localValue"),
      details: [
        tSettingsV2(locale, "settings.memory.storage.localData"),
        tSettingsV2(locale, "settings.memory.storage.cloudSyncOff"),
      ],
    },
  };
}

function formatPersonalMemory(
  locale: SettingsV2Locale,
  status: MemoryAlphaStatus | null | undefined,
): SettingsV2MemoryPrivacyProductViewModel["personalMemory"] {
  if (!status) {
    return {
      value: tSettingsV2(locale, "settings.memory.personalMemory.unavailable"),
      details: [
        tSettingsV2(locale, "settings.memory.personalMemory.statusUnavailable"),
        tSettingsV2(locale, "settings.memory.personalMemory.noRecallOnOpen"),
      ],
    };
  }
  if (status.state === "active" && status.enabled) {
    return {
      value: tSettingsV2(locale, "settings.memory.personalMemory.available"),
      details: [
        tSettingsV2(locale, "settings.memory.personalMemory.newMessagesOnly"),
        tSettingsV2(locale, "settings.memory.personalMemory.noRecallOnOpen"),
      ],
    };
  }
  if (status.state === "disabled" || !status.enabled) {
    return {
      value: tSettingsV2(locale, "settings.memory.personalMemory.notEnabled"),
      details: [
        tSettingsV2(locale, "settings.memory.personalMemory.disabledDetail"),
        tSettingsV2(locale, "settings.memory.personalMemory.noRecallOnOpen"),
      ],
    };
  }
  return {
    value: tSettingsV2(locale, "settings.memory.personalMemory.unavailable"),
    details: [
      tSettingsV2(locale, "settings.memory.personalMemory.statusUnavailable"),
      tSettingsV2(locale, "settings.memory.personalMemory.noRecallOnOpen"),
    ],
  };
}
