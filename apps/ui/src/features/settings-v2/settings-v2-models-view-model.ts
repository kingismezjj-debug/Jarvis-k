import type {
  ChatAnswerProductModeStatus,
  CommandRouterProductModeStatus,
  InferenceProviderConfigurationReport,
  InferenceProviderDescriptor,
  ModelInventoryItem,
  ModelManifest,
  ModelOperationSnapshot,
  ResourceSchedulerDiagnostics,
} from "@jarvis-k/contracts";

import {
  type SettingsV2Locale,
  tSettingsV2,
} from "./settings-v2-copy";

export type SettingsV2ModelsProductViewModel = {
  command: {
    checked: boolean;
    value: string;
    detail: string;
  };
  answer: {
    checked: boolean;
    value: string;
    detail: string;
  };
  localModels: {
    value: string;
    installedCount: number;
    installableCount: number;
    selectedCount: number;
    readyCount: number;
    details: string[];
  };
  routing: {
    value: string;
    details: string[];
  };
  operations: {
    activeCount: number;
    summary: string;
  };
  safeNotice: string;
};

export function buildSettingsV2ModelsProductViewModel({
  chatAnswerProductModeStatus,
  commandRouterProductModeStatus,
  inferenceProviders,
  locale,
  modelInventory,
  modelManifests,
  modelOperations,
  resourceDiagnostics,
}: {
  chatAnswerProductModeStatus?: ChatAnswerProductModeStatus | null;
  commandRouterProductModeStatus?: CommandRouterProductModeStatus | null;
  inferenceProviderRequirements?: InferenceProviderConfigurationReport[];
  inferenceProviders?: InferenceProviderDescriptor[];
  locale: SettingsV2Locale;
  modelInventory?: ModelInventoryItem[];
  modelManifests?: ModelManifest[];
  modelOperations?: ModelOperationSnapshot[];
  resourceDiagnostics?: ResourceSchedulerDiagnostics | null;
}): SettingsV2ModelsProductViewModel {
  const command = formatCommandRouter(locale, commandRouterProductModeStatus);
  const answer = formatAnswerService(locale, chatAnswerProductModeStatus);
  const localModels = formatLocalModels({
    inferenceProviders,
    locale,
    modelInventory,
    modelManifests,
    resourceDiagnostics,
  });
  const operations = formatModelOperations(locale, modelOperations);
  return {
    command,
    answer,
    localModels,
    operations,
    routing: {
      value: selectCurrentAnswerMethod({
        answerValue: answer.value,
        commandEnabled: command.checked,
        locale,
        localModelReady: localModels.readyCount > 0,
      }),
      details: [
        tSettingsV2(locale, "settings.models.routingPolicy.localRules"),
        tSettingsV2(locale, "settings.models.routingPolicy.safety"),
      ],
    },
    safeNotice: tSettingsV2(locale, "settings.models.status.noNetworkOnOpen"),
  };
}

function formatCommandRouter(
  locale: SettingsV2Locale,
  status: CommandRouterProductModeStatus | null | undefined,
): SettingsV2ModelsProductViewModel["command"] {
  if (!status) {
    return {
      checked: false,
      value: tSettingsV2(locale, "settings.status.unknown"),
      detail: tSettingsV2(locale, "settings.models.fastCommand.statusUnknown"),
    };
  }
  if (!status.enabled) {
    return {
      checked: false,
      value: tSettingsV2(locale, "settings.models.status.defaultCommandRouting"),
      detail: tSettingsV2(locale, "settings.models.fastCommand.defaultRoute"),
    };
  }
  if (status.status === "control_enabled_rules_only") {
    return {
      checked: true,
      value: tSettingsV2(locale, "settings.models.status.localRulesEnabled"),
      detail: tSettingsV2(locale, "settings.models.fastCommand.localRules"),
    };
  }
  return {
    checked: true,
    value: tSettingsV2(locale, "settings.models.status.localRoutingUnavailable"),
    detail: tSettingsV2(locale, "settings.models.fastCommand.statusUnavailable"),
  };
}

function formatAnswerService(
  locale: SettingsV2Locale,
  status: ChatAnswerProductModeStatus | null | undefined,
): SettingsV2ModelsProductViewModel["answer"] {
  if (!status) {
    return {
      checked: false,
      value: tSettingsV2(locale, "settings.status.unknown"),
      detail: tSettingsV2(locale, "settings.models.answerProvider.statusUnknown"),
    };
  }
  if (!status.secureStorageAvailable) {
    return {
      checked: status.enabled,
      value: tSettingsV2(
        locale,
        "settings.models.answerProvider.secureStorageUnavailable",
      ),
      detail: tSettingsV2(locale, "settings.models.answerProvider.cannotUse"),
    };
  }
  if (!status.credentialConfigured) {
    return {
      checked: status.enabled,
      value: status.enabled
        ? tSettingsV2(locale, "settings.models.answerProvider.allowedNeedsSetup")
        : tSettingsV2(locale, "settings.models.answerProvider.notConfigured"),
      detail: tSettingsV2(locale, "settings.models.answerProvider.setupRequired"),
    };
  }
  if (status.realProviderRuntimeEnabled && status.networkAccessApproved) {
    return {
      checked: status.enabled,
      value: tSettingsV2(locale, "settings.models.answerProvider.available"),
      detail: tSettingsV2(locale, "settings.models.answerProvider.verified"),
    };
  }
  if (status.enabled) {
    return {
      checked: true,
      value: tSettingsV2(
        locale,
        "settings.models.answerProvider.configuredNotVerified",
      ),
      detail: tSettingsV2(locale, "settings.models.answerProvider.allowedNotReady"),
    };
  }
  return {
    checked: false,
    value: tSettingsV2(locale, "settings.models.answerProvider.configuredOff"),
    detail: tSettingsV2(locale, "settings.models.answerProvider.savedOff"),
  };
}

function formatLocalModels({
  inferenceProviders,
  locale,
  modelInventory,
  modelManifests,
  resourceDiagnostics,
}: {
  inferenceProviders?: InferenceProviderDescriptor[];
  locale: SettingsV2Locale;
  modelInventory?: ModelInventoryItem[];
  modelManifests?: ModelManifest[];
  resourceDiagnostics?: ResourceSchedulerDiagnostics | null;
}): SettingsV2ModelsProductViewModel["localModels"] {
  const inventory = modelInventory ?? [];
  const manifests = modelManifests ?? [];
  const installedCount = inventory.filter(
    (item) => item.status === "available" || item.status === "loaded",
  ).length;
  const readyCount = inventory.filter((item) => item.status === "loaded").length;
  const selectedCount = countSelectedKnownModels(inferenceProviders, manifests);
  const notDownloadedCount = inventory.filter(
    (item) => item.status === "not_downloaded",
  ).length;
  const knownInventoryIds = new Set(inventory.map((item) => item.manifest.id));
  const manifestOnlyCount = manifests.filter(
    (manifest) => !knownInventoryIds.has(manifest.id),
  ).length;
  const installableCount = notDownloadedCount + manifestOnlyCount;
  const unavailableCount = inventory.filter(
    (item) => item.status === "unavailable",
  ).length;
  const value =
    readyCount > 0
      ? tSettingsV2(locale, "settings.models.localModels.ready")
      : installedCount > 0
        ? tSettingsV2(locale, "settings.models.localModels.installed")
        : tSettingsV2(locale, "settings.models.localModels.notInstalled");

  const details = [
    `${tSettingsV2(locale, "settings.models.localModels.installedCount")}: ${installedCount}`,
    `${tSettingsV2(locale, "settings.models.localModels.installableCount")}: ${installableCount}`,
    `${tSettingsV2(locale, "settings.models.localModels.selectedCount")}: ${selectedCount}`,
    `${tSettingsV2(locale, "settings.models.localModels.readyCount")}: ${readyCount}`,
  ];
  if (unavailableCount > 0) {
    details.push(
      `${tSettingsV2(locale, "settings.models.localModels.unavailableCount")}: ${unavailableCount}`,
    );
  }
  if ((resourceDiagnostics?.activeLeaseCount ?? 0) > 0) {
    details.push(tSettingsV2(locale, "settings.models.localModels.busy"));
  }
  return {
    value,
    installedCount,
    installableCount,
    selectedCount,
    readyCount,
    details,
  };
}

function countSelectedKnownModels(
  providers: InferenceProviderDescriptor[] | undefined,
  manifests: ModelManifest[],
): number {
  const knownIds = new Set(manifests.map((manifest) => manifest.id));
  const selected = new Set<string>();
  for (const provider of providers ?? []) {
    if (provider.execution !== "local" && provider.execution !== "system") {
      continue;
    }
    for (const modelId of provider.modelIds) {
      if (knownIds.has(modelId)) {
        selected.add(modelId);
      }
    }
  }
  return selected.size;
}

function formatModelOperations(
  locale: SettingsV2Locale,
  modelOperations: ModelOperationSnapshot[] | undefined,
): SettingsV2ModelsProductViewModel["operations"] {
  const activeCount = (modelOperations ?? []).filter(
    (operation) =>
      operation.phase === "queued" ||
      operation.phase === "prechecking" ||
      operation.phase === "downloading" ||
      operation.phase === "verifying" ||
      operation.phase === "loading" ||
      operation.phase === "executing" ||
      operation.phase === "releasing" ||
      operation.phase === "removing",
  ).length;
  return {
    activeCount,
    summary:
      activeCount > 0
        ? `${tSettingsV2(locale, "settings.status.operationInProgress")}: ${activeCount}`
        : tSettingsV2(locale, "settings.models.localModels.noOperations"),
  };
}

function selectCurrentAnswerMethod({
  answerValue,
  commandEnabled,
  locale,
  localModelReady,
}: {
  answerValue: string;
  commandEnabled: boolean;
  locale: SettingsV2Locale;
  localModelReady: boolean;
}): string {
  if (localModelReady) {
    return tSettingsV2(locale, "settings.models.routingPolicy.localModel");
  }
  if (
    answerValue ===
    tSettingsV2(locale, "settings.models.answerProvider.available")
  ) {
    return tSettingsV2(locale, "settings.models.routingPolicy.onlineService");
  }
  if (commandEnabled) {
    return tSettingsV2(locale, "settings.models.routingPolicy.localRules");
  }
  return tSettingsV2(locale, "settings.models.routingPolicy.notConfigured");
}
