import type { ProductAboutInfo } from "@jarvis-k/contracts";

import { tSettingsV2, type SettingsV2Locale } from "./settings-v2-copy";

export type SettingsV2AboutUpdatesProductViewModel = {
  productName: {
    value: string;
  };
  version: {
    value: string;
  };
  updates: {
    value: string;
  };
  safeViewing: {
    value?: undefined;
    details: string[];
  };
};

export function buildSettingsV2AboutUpdatesProductViewModel({
  locale,
  productAboutInfo,
}: {
  locale: SettingsV2Locale;
  productAboutInfo?: ProductAboutInfo | null;
}): SettingsV2AboutUpdatesProductViewModel {
  return {
    productName: {
      value: productAboutInfo?.productName ?? "Jarvis-K",
    },
    version: {
      value:
        productAboutInfo?.version && productAboutInfo.version !== "unknown"
          ? productAboutInfo.version
          : tSettingsV2(locale, "settings.status.unknown"),
    },
    updates: {
      value: tSettingsV2(locale, "settings.about.updates.notAvailable"),
    },
    safeViewing: {
      details: [tSettingsV2(locale, "settings.about.safeViewing.description")],
    },
  };
}
