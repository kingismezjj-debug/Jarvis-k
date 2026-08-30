import type {
  ProductAboutInfo,
  ProductAboutReleaseChannel,
} from "@jarvis-k/contracts";

import { tSettingsV2, type SettingsV2Locale } from "./settings-v2-copy";

export type SettingsV2AboutUpdatesProductViewModel = {
  productIdentity: {
    value: string;
    details: string[];
  };
  releaseChannel: {
    value: string;
  };
  updates: {
    value: string;
    details: string[];
  };
  systemStatus: {
    value: string;
    details: string[];
  };
  legal: {
    value: string;
  };
  safeViewing: {
    value?: undefined;
    details: string[];
  };
};

function formatReleaseChannel(
  locale: SettingsV2Locale,
  releaseChannel: ProductAboutReleaseChannel | undefined,
): string {
  if (releaseChannel === "alpha") {
    return tSettingsV2(locale, "settings.about.releaseChannel.alpha");
  }
  if (releaseChannel === "stable") {
    return tSettingsV2(locale, "settings.about.releaseChannel.stable");
  }
  if (releaseChannel === "test") {
    return tSettingsV2(locale, "settings.about.releaseChannel.test");
  }
  return tSettingsV2(locale, "settings.about.releaseChannel.development");
}

export function buildSettingsV2AboutUpdatesProductViewModel({
  locale,
  productAboutInfo,
}: {
  locale: SettingsV2Locale;
  productAboutInfo?: ProductAboutInfo | null;
}): SettingsV2AboutUpdatesProductViewModel {
  const productName = productAboutInfo?.productName ?? "Jarvis-K";
  const version =
    productAboutInfo?.version ?? tSettingsV2(locale, "settings.status.unknown");
  const releaseChannel = formatReleaseChannel(
    locale,
    productAboutInfo?.releaseChannel,
  );

  return {
    productIdentity: {
      value: productName,
      details: [
        `${tSettingsV2(locale, "settings.about.productIdentity.version")}: ${version}`,
      ],
    },
    releaseChannel: {
      value: releaseChannel,
    },
    updates: {
      value: tSettingsV2(locale, "settings.about.updates.notAvailable"),
      details: [tSettingsV2(locale, "settings.about.updates.manualInstall")],
    },
    systemStatus: {
      value: tSettingsV2(locale, "settings.about.systemStatus.basicOnly"),
      details: [
        tSettingsV2(locale, "settings.about.systemStatus.developerDiagnostics"),
      ],
    },
    legal: {
      value: tSettingsV2(locale, "settings.about.legal.notBundled"),
    },
    safeViewing: {
      details: [tSettingsV2(locale, "settings.about.safeViewing.description")],
    },
  };
}
