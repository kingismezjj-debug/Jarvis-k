import * as React from "react";
import type {
  ChatAnswerProductModeStatus,
  CommandRouterProductModeStatus,
  DesktopCloseButtonBehavior,
  DesktopLaunchAtLoginStatus,
  DesktopPetReducedMotion,
  DesktopSettings,
  InferenceProviderConfigurationReport,
  InferenceProviderDescriptor,
  ModelInventoryItem,
  ModelManifest,
  ModelOperationSnapshot,
  PetSkinRegistryProjection,
  ResourceSchedulerDiagnostics,
  TtsServiceStatus,
  VoiceMode,
  VoicePermissionState,
  VoiceServiceStatus,
} from "@jarvis-k/contracts";

import { builtInSkinThemes } from "@/app/skin-themes";
import type { SkinThemeId, UiLanguage } from "@/app/types";
import {
  Button,
  Dialog,
  InlineNotice,
  SearchField,
} from "@/design-system/foundation-components";
import {
  DangerSection,
  SettingRow,
  SettingSwitchRow,
  SettingValueAction,
  SettingsCategoryNav,
  SettingsCategorySelect,
  SettingsPageHeader,
  SettingsSearchEmpty,
  SettingsSearchResult,
  SettingsSection,
} from "@/design-system/settings-components";

import {
  settingsV2Categories,
  type SettingsV2CategoryId,
  type SettingsV2Definition,
  getSettingsV2SearchableDefinitions,
} from "./settings-v2-registry";
import {
  formatSettingsV2Error,
  tSettingsV2,
  type SettingsV2CopyKey,
  type SettingsV2Locale,
} from "./settings-v2-copy";
import "./settings-v2.css";

export type SettingsV2GeneralViewProps = {
  locale: UiLanguage;
  desktopSettings: DesktopSettings | null;
  desktopLaunchAtLoginStatus: DesktopLaunchAtLoginStatus | null;
  sending: boolean;
  error?: string | null;
  onRefreshDesktopSettings: () => void;
  onSelectLanguage: (language: UiLanguage) => void;
  onSetDesktopCloseButtonBehavior: (
    behavior: DesktopCloseButtonBehavior,
  ) => void;
  onSetDesktopLaunchAtLoginEnabled: (enabled: boolean) => void;
  activeThemeId: SkinThemeId;
  petSkinRegistry: PetSkinRegistryProjection | null;
  onSelectTheme: (themeId: SkinThemeId) => void;
  onSetDesktopPetEnabled: (enabled: boolean) => void;
  onSetDesktopPetAlwaysOnTop: (enabled: boolean) => void;
  onSetDesktopPetReducedMotion: (mode: DesktopPetReducedMotion) => void;
  onResetDesktopPetPosition: () => void;
  onOpenExistingSkinManagement?: () => void;
  voiceServiceStatus?: VoiceServiceStatus | null;
  ttsServiceStatus?: TtsServiceStatus | null;
  voiceMode?: VoiceMode;
  voicePermission?: VoicePermissionState;
  voiceCaptureAvailable?: boolean;
  onOpenVoicePage?: () => void;
  onOpenVoiceSettings?: () => void;
  onOpenTtsSettings?: () => void;
  commandRouterProductModeStatus?: CommandRouterProductModeStatus | null;
  chatAnswerProductModeStatus?: ChatAnswerProductModeStatus | null;
  inferenceProviders?: InferenceProviderDescriptor[];
  inferenceProviderRequirements?: InferenceProviderConfigurationReport[];
  modelInventory?: ModelInventoryItem[];
  modelManifests?: ModelManifest[];
  modelOperations?: ModelOperationSnapshot[];
  resourceDiagnostics?: ResourceSchedulerDiagnostics | null;
  onRefreshModelStatus?: () => void;
  onOpenModelOperations?: () => void;
  onSetCommandRouterProductModeEnabled?: (enabled: boolean) => void;
  onSetChatAnswerProductModeEnabled?: (enabled: boolean) => void;
  initialCategoryId?: SettingsV2CategoryId;
};

const defaultCategoryId: SettingsV2CategoryId = "general";
const desktopPetReducedMotionModes: DesktopPetReducedMotion[] = [
  "system",
  "on",
  "off",
];

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function getLanguageLabel(locale: SettingsV2Locale, value: UiLanguage): string {
  return tSettingsV2(
    locale,
    value === "zh"
      ? "settings.general.displayLanguage.chinese"
      : "settings.general.displayLanguage.english",
  );
}

function getCloseBehaviorLabel(
  locale: SettingsV2Locale,
  behavior: DesktopCloseButtonBehavior,
): string {
  return tSettingsV2(
    locale,
    behavior === "quit"
      ? "settings.general.closeBehavior.quit"
      : "settings.general.closeBehavior.minimizeToTray",
  );
}

function getLaunchValueLabel(
  locale: SettingsV2Locale,
  settings: DesktopSettings | null,
  status: DesktopLaunchAtLoginStatus | null,
): string {
  if (settings === null) return tSettingsV2(locale, "settings.status.unknown");
  if (status?.supported === false) {
    return tSettingsV2(locale, "settings.status.notSupported");
  }
  return settings.launchAtLoginEnabled
    ? tSettingsV2(locale, "settings.status.on")
    : tSettingsV2(locale, "settings.status.off");
}

function getProviderName(provider: VoiceServiceStatus["provider"]): string {
  if (provider === "xunfei") return "Xunfei";
  if (provider === "volcengine") return "Volcengine";
  return "";
}

function getVoiceProviderValueLabel(
  locale: SettingsV2Locale,
  status: VoiceServiceStatus | null | undefined,
): string {
  if (!status?.secureStorageAvailable) {
    return tSettingsV2(
      locale,
      "settings.voice.provider.secureStorageUnavailable",
    );
  }
  if (!status.configured) {
    return tSettingsV2(locale, "settings.voice.provider.notConfigured");
  }
  const providerName = getProviderName(status.provider);
  return providerName
    ? `${providerName} / ${tSettingsV2(locale, "settings.voice.provider.configured")}`
    : tSettingsV2(locale, "settings.voice.provider.configured");
}

function getVoiceLanguageLabel(
  locale: SettingsV2Locale,
  language: VoiceServiceStatus["language"],
): string {
  if (language === "zh") {
    return tSettingsV2(locale, "settings.voice.provider.language.chinese");
  }
  if (language === "en") {
    return tSettingsV2(locale, "settings.voice.provider.language.english");
  }
  return tSettingsV2(locale, "settings.status.unknown");
}

function getVoiceModeLabel(
  locale: SettingsV2Locale,
  mode: VoiceMode | undefined,
): string {
  if (mode === "ptt") {
    return tSettingsV2(locale, "settings.voice.captureMode.pushToTalk");
  }
  if (mode === "continuous") {
    return tSettingsV2(locale, "settings.voice.captureMode.continuous");
  }
  return tSettingsV2(locale, "settings.voice.captureMode.disabled");
}

function getVoicePermissionLabel(
  locale: SettingsV2Locale,
  permission: VoicePermissionState | undefined,
): string {
  if (permission === "prompt") {
    return tSettingsV2(locale, "settings.voice.microphone.prompt");
  }
  if (permission === "granted") {
    return tSettingsV2(locale, "settings.voice.microphone.granted");
  }
  if (permission === "denied") {
    return tSettingsV2(locale, "settings.voice.microphone.denied");
  }
  return tSettingsV2(locale, "settings.voice.microphone.unknown");
}

function getTtsValueLabel(
  locale: SettingsV2Locale,
  status: TtsServiceStatus | null | undefined,
): string {
  if (!status?.secureStorageAvailable) {
    return tSettingsV2(locale, "settings.voice.tts.secureStorageUnavailable");
  }
  if (!status.configured) {
    return tSettingsV2(locale, "settings.voice.tts.notConfigured");
  }
  return `Doubao / ${tSettingsV2(locale, "settings.voice.tts.configured")}`;
}

function getCommandRouterValueLabel(
  locale: SettingsV2Locale,
  status: CommandRouterProductModeStatus | null | undefined,
): string {
  if (!status) return tSettingsV2(locale, "settings.status.unknown");
  if (!status.enabled) {
    return tSettingsV2(locale, "settings.models.status.localRulesOff");
  }
  return status.status === "control_enabled_rules_only"
    ? tSettingsV2(locale, "settings.models.status.localRulesEnabled")
    : tSettingsV2(locale, "settings.models.status.localRoutingUnavailable");
}

function getChatAnswerValueLabel(
  locale: SettingsV2Locale,
  status: ChatAnswerProductModeStatus | null | undefined,
): string {
  if (!status) return tSettingsV2(locale, "settings.status.unknown");
  if (!status.secureStorageAvailable) {
    return tSettingsV2(
      locale,
      "settings.models.answerProvider.secureStorageUnavailable",
    );
  }
  if (!status.credentialConfigured) {
    return tSettingsV2(locale, "settings.models.answerProvider.notConfigured");
  }
  return tSettingsV2(
    locale,
    "settings.models.answerProvider.configuredNotVerified",
  );
}

function getProviderStatusLabel(
  locale: SettingsV2Locale,
  status: InferenceProviderDescriptor["status"],
): string {
  if (status === "available") {
    return tSettingsV2(locale, "settings.models.status.available");
  }
  if (status === "degraded") {
    return tSettingsV2(locale, "settings.models.status.degraded");
  }
  return tSettingsV2(locale, "settings.models.status.unconfigured");
}

function getLocalModelSummary(
  locale: SettingsV2Locale,
  modelInventory: ModelInventoryItem[] | undefined,
  modelManifests: ModelManifest[] | undefined,
): string {
  const inventory = modelInventory ?? [];
  const manifests = modelManifests ?? [];
  const installed = inventory.filter((item) =>
    item.status === "available" || item.status === "loaded",
  ).length;
  const loaded = inventory.filter((item) => item.status === "loaded").length;
  const missing = Math.max(manifests.length - installed, 0);
  return `${tSettingsV2(locale, "settings.models.status.installed")}: ${installed} / ${tSettingsV2(locale, "settings.models.status.loaded")}: ${loaded} / ${tSettingsV2(locale, "settings.models.status.missing")}: ${missing}`;
}

function getCloudLocalStatusSummary({
  locale,
  inferenceProviders,
  inferenceProviderRequirements,
  resourceDiagnostics,
}: {
  locale: SettingsV2Locale;
  inferenceProviders?: InferenceProviderDescriptor[];
  inferenceProviderRequirements?: InferenceProviderConfigurationReport[];
  resourceDiagnostics?: ResourceSchedulerDiagnostics | null;
}): string {
  const providers = inferenceProviders ?? [];
  const localAvailable = providers.filter(
    (provider) =>
      provider.execution === "local" && provider.status === "available",
  ).length;
  const cloudConfigured = (inferenceProviderRequirements ?? []).filter(
    (report) =>
      report.requirements.length > 0 &&
      report.requirements.every((requirement) => requirement.configured),
  ).length;
  return `${tSettingsV2(locale, "settings.models.cloudLocalStatus.localProviders")}: ${localAvailable} / ${tSettingsV2(locale, "settings.models.cloudLocalStatus.cloudProviders")}: ${cloudConfigured} / ${tSettingsV2(locale, "settings.models.cloudLocalStatus.resourceLeases")}: ${resourceDiagnostics?.activeLeaseCount ?? 0}`;
}

function getThemeLabel(locale: SettingsV2Locale, themeId: SkinThemeId): string {
  return tSettingsV2(locale, getThemeCopyKey(themeId, "label"));
}

function getThemeDescription(
  locale: SettingsV2Locale,
  themeId: SkinThemeId,
): string {
  return tSettingsV2(locale, getThemeCopyKey(themeId, "description"));
}

function getThemeCopyKey(
  themeId: SkinThemeId,
  kind: "label" | "description",
): SettingsV2CopyKey {
  if (themeId === "harbor") {
    return kind === "label"
      ? "settings.theme.harbor.label"
      : "settings.theme.harbor.description";
  }
  if (themeId === "ember") {
    return kind === "label"
      ? "settings.theme.ember.label"
      : "settings.theme.ember.description";
  }
  return kind === "label"
    ? "settings.theme.signal.label"
    : "settings.theme.signal.description";
}

function getPetVisibilityLabel(
  locale: SettingsV2Locale,
  settings: DesktopSettings | null,
): string {
  if (settings === null) return tSettingsV2(locale, "settings.status.unknown");
  return settings.desktopPetEnabled
    ? tSettingsV2(locale, "settings.pet.status.enabled")
    : tSettingsV2(locale, "settings.pet.status.disabled");
}

function getReducedMotionLabel(
  locale: SettingsV2Locale,
  mode: DesktopPetReducedMotion,
): string {
  return tSettingsV2(
    locale,
    mode === "on"
      ? "settings.pet.status.motionReduced"
      : mode === "off"
        ? "settings.pet.status.motionFull"
        : "settings.pet.status.motionSystem",
  );
}

function getCategoryLabel(
  locale: SettingsV2Locale,
  categoryId: SettingsV2CategoryId,
): string {
  const category = settingsV2Categories.find((item) => item.id === categoryId);
  return category ? tSettingsV2(locale, category.labelKey) : "";
}

function getSectionLabel(
  locale: SettingsV2Locale,
  sectionId: SettingsV2Definition["sectionId"],
): string {
  const sectionKeys: Record<SettingsV2Definition["sectionId"], SettingsV2CopyKey> = {
    interface: "settings.general.section.interface",
    desktop: "settings.general.section.desktop",
    reset: "settings.general.section.reset",
    appearance: "settings.appearance.section.theme",
    desktop_pet: "settings.appearance.section.pet",
    pet_skin: "settings.appearance.section.skin",
    voice_provider: "settings.voice.section.provider",
    voice_capture: "settings.voice.section.capture",
    voice_output: "settings.voice.section.output",
    wake_word: "settings.voice.section.wake",
    models_command: "settings.models.section.command",
    models_answer: "settings.models.section.answer",
    models_local: "settings.models.section.local",
    models_routing: "settings.models.section.routing",
  };
  return tSettingsV2(locale, sectionKeys[sectionId]);
}

function getDefinitionValue({
  definition,
  desktopSettings,
  desktopLaunchAtLoginStatus,
  locale,
  activeThemeId,
  petSkinRegistry,
  voiceServiceStatus,
  ttsServiceStatus,
  voiceMode,
  voicePermission,
  voiceCaptureAvailable,
  commandRouterProductModeStatus,
  chatAnswerProductModeStatus,
  inferenceProviders,
  inferenceProviderRequirements,
  modelInventory,
  modelManifests,
  resourceDiagnostics,
}: {
  definition: SettingsV2Definition;
  desktopSettings: DesktopSettings | null;
  desktopLaunchAtLoginStatus: DesktopLaunchAtLoginStatus | null;
  locale: SettingsV2Locale;
  activeThemeId: SkinThemeId;
  petSkinRegistry: PetSkinRegistryProjection | null;
  voiceServiceStatus?: VoiceServiceStatus | null;
  ttsServiceStatus?: TtsServiceStatus | null;
  voiceMode?: VoiceMode;
  voicePermission?: VoicePermissionState;
  voiceCaptureAvailable?: boolean;
  commandRouterProductModeStatus?: CommandRouterProductModeStatus | null;
  chatAnswerProductModeStatus?: ChatAnswerProductModeStatus | null;
  inferenceProviders?: InferenceProviderDescriptor[];
  inferenceProviderRequirements?: InferenceProviderConfigurationReport[];
  modelInventory?: ModelInventoryItem[];
  modelManifests?: ModelManifest[];
  resourceDiagnostics?: ResourceSchedulerDiagnostics | null;
}): string {
  if (definition.settingBindingId === "ui.language") {
    return getLanguageLabel(locale, locale);
  }
  if (definition.settingBindingId === "desktop.close_button_behavior") {
    return getCloseBehaviorLabel(
      locale,
      desktopSettings?.closeButtonBehavior ?? "minimize_to_tray",
    );
  }
  if (definition.settingBindingId === "desktop.launch_at_login") {
    return getLaunchValueLabel(locale, desktopSettings, desktopLaunchAtLoginStatus);
  }
  if (definition.settingBindingId === "ui.theme") {
    return getThemeLabel(locale, activeThemeId);
  }
  if (definition.settingBindingId === "desktop.pet_enabled") {
    return getPetVisibilityLabel(locale, desktopSettings);
  }
  if (definition.settingBindingId === "desktop.pet_always_on_top") {
    if (desktopSettings === null) return tSettingsV2(locale, "settings.status.unknown");
    return desktopSettings.desktopPetAlwaysOnTop
      ? tSettingsV2(locale, "settings.status.on")
      : tSettingsV2(locale, "settings.status.off");
  }
  if (definition.settingBindingId === "desktop.pet_reduced_motion") {
    return getReducedMotionLabel(
      locale,
      desktopSettings?.desktopPetReducedMotion ?? "system",
    );
  }
  if (definition.settingBindingId === "desktop.pet_position_reset") {
    return tSettingsV2(locale, "settings.pet.resetPosition.action");
  }
  if (definition.settingBindingId === "desktop.pet_skin_summary") {
    if (petSkinRegistry?.activeSkin) return petSkinRegistry.activeSkin.displayName;
    return tSettingsV2(locale, "settings.skin.status.builtIn");
  }
  if (definition.settingBindingId === "voice.provider_summary") {
    return getVoiceProviderValueLabel(locale, voiceServiceStatus);
  }
  if (definition.settingBindingId === "voice.capture_mode") {
    return getVoiceModeLabel(locale, voiceMode);
  }
  if (definition.settingBindingId === "voice.microphone_permission") {
    return getVoicePermissionLabel(locale, voicePermission);
  }
  if (definition.settingBindingId === "voice.push_to_talk") {
    return voiceCaptureAvailable
      ? tSettingsV2(locale, "settings.voice.pushToTalk.available")
      : tSettingsV2(locale, "settings.voice.pushToTalk.unavailable");
  }
  if (definition.settingBindingId === "voice.tts_summary") {
    return getTtsValueLabel(locale, ttsServiceStatus);
  }
  if (definition.settingBindingId === "voice.wake_word") {
    return tSettingsV2(locale, "settings.voice.wakeWord.unavailable");
  }
  if (definition.settingBindingId === "models.fast_command_understanding") {
    return getCommandRouterValueLabel(locale, commandRouterProductModeStatus);
  }
  if (definition.settingBindingId === "models.answer_provider") {
    return getChatAnswerValueLabel(locale, chatAnswerProductModeStatus);
  }
  if (definition.settingBindingId === "models.local_models") {
    return getLocalModelSummary(locale, modelInventory, modelManifests);
  }
  if (definition.settingBindingId === "models.routing_policy") {
    return tSettingsV2(locale, "settings.models.routingPolicy.safeSummary");
  }
  if (definition.settingBindingId === "models.cloud_local_status") {
    return getCloudLocalStatusSummary({
      locale,
      inferenceProviders,
      inferenceProviderRequirements,
      resourceDiagnostics,
    });
  }
  return tSettingsV2(locale, "settings.general.reset.unsupported");
}

function getSearchResults({
  query,
  locale,
  desktopSettings,
  desktopLaunchAtLoginStatus,
  activeThemeId,
  petSkinRegistry,
  voiceServiceStatus,
  ttsServiceStatus,
  voiceMode,
  voicePermission,
  voiceCaptureAvailable,
  commandRouterProductModeStatus,
  chatAnswerProductModeStatus,
  inferenceProviders,
  inferenceProviderRequirements,
  modelInventory,
  modelManifests,
  resourceDiagnostics,
}: {
  query: string;
  locale: SettingsV2Locale;
  desktopSettings: DesktopSettings | null;
  desktopLaunchAtLoginStatus: DesktopLaunchAtLoginStatus | null;
  activeThemeId: SkinThemeId;
  petSkinRegistry: PetSkinRegistryProjection | null;
  voiceServiceStatus?: VoiceServiceStatus | null;
  ttsServiceStatus?: TtsServiceStatus | null;
  voiceMode?: VoiceMode;
  voicePermission?: VoicePermissionState;
  voiceCaptureAvailable?: boolean;
  commandRouterProductModeStatus?: CommandRouterProductModeStatus | null;
  chatAnswerProductModeStatus?: ChatAnswerProductModeStatus | null;
  inferenceProviders?: InferenceProviderDescriptor[];
  inferenceProviderRequirements?: InferenceProviderConfigurationReport[];
  modelInventory?: ModelInventoryItem[];
  modelManifests?: ModelManifest[];
  resourceDiagnostics?: ResourceSchedulerDiagnostics | null;
}) {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length === 0) return [];
  return getSettingsV2SearchableDefinitions()
    .map((definition) => {
      const searchableText = [
        tSettingsV2(locale, definition.labelKey),
        tSettingsV2(locale, definition.descriptionKey),
        ...definition.searchKeywordKeys.map((key) => tSettingsV2(locale, key)),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return { definition, searchableText };
    })
    .filter(({ searchableText }) => searchableText.includes(normalizedQuery))
    .map(({ definition }) => ({
      definition,
      value: getDefinitionValue({
        definition,
        desktopSettings,
        desktopLaunchAtLoginStatus,
        locale,
        activeThemeId,
        petSkinRegistry,
        voiceServiceStatus,
        ttsServiceStatus,
        voiceMode,
        voicePermission,
        voiceCaptureAvailable,
        commandRouterProductModeStatus,
        chatAnswerProductModeStatus,
        inferenceProviders,
        inferenceProviderRequirements,
        modelInventory,
        modelManifests,
        resourceDiagnostics,
      }),
    }));
}

export function SettingsV2GeneralView({
  locale,
  desktopSettings,
  desktopLaunchAtLoginStatus,
  sending,
  error,
  onRefreshDesktopSettings,
  onSelectLanguage,
  onSetDesktopCloseButtonBehavior,
  onSetDesktopLaunchAtLoginEnabled,
  activeThemeId,
  petSkinRegistry,
  onSelectTheme,
  onSetDesktopPetEnabled,
  onSetDesktopPetAlwaysOnTop,
  onSetDesktopPetReducedMotion,
  onResetDesktopPetPosition,
  onOpenExistingSkinManagement,
  voiceServiceStatus,
  ttsServiceStatus,
  voiceMode = "disabled",
  voicePermission = "unknown",
  voiceCaptureAvailable = false,
  onOpenVoicePage,
  onOpenVoiceSettings,
  onOpenTtsSettings,
  commandRouterProductModeStatus,
  chatAnswerProductModeStatus,
  inferenceProviders = [],
  inferenceProviderRequirements = [],
  modelInventory = [],
  modelManifests = [],
  modelOperations = [],
  resourceDiagnostics,
  onRefreshModelStatus,
  onOpenModelOperations,
  onSetCommandRouterProductModeEnabled,
  onSetChatAnswerProductModeEnabled,
  initialCategoryId,
}: SettingsV2GeneralViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] =
    React.useState<SettingsV2CategoryId>(initialCategoryId ?? defaultCategoryId);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [languageDialogOpen, setLanguageDialogOpen] = React.useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = React.useState(false);
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);

  const categories = React.useMemo(
    () =>
      settingsV2Categories.map((category) => ({
        id: category.id,
        label: tSettingsV2(locale, category.labelKey),
      })),
    [locale],
  );

  const searchResults = React.useMemo(
    () =>
      getSearchResults({
        query: searchQuery,
        locale,
        desktopSettings,
        desktopLaunchAtLoginStatus,
        activeThemeId,
        petSkinRegistry,
        voiceServiceStatus,
        ttsServiceStatus,
        voiceMode,
        voicePermission,
        voiceCaptureAvailable,
        commandRouterProductModeStatus,
        chatAnswerProductModeStatus,
        inferenceProviders,
        inferenceProviderRequirements,
        modelInventory,
        modelManifests,
        resourceDiagnostics,
      }),
    [
      activeThemeId,
      chatAnswerProductModeStatus,
      commandRouterProductModeStatus,
      desktopLaunchAtLoginStatus,
      desktopSettings,
      inferenceProviderRequirements,
      inferenceProviders,
      locale,
      modelInventory,
      modelManifests,
      petSkinRegistry,
      resourceDiagnostics,
      searchQuery,
      ttsServiceStatus,
      voiceCaptureAvailable,
      voiceMode,
      voicePermission,
      voiceServiceStatus,
    ],
  );

  const closeBehavior =
    desktopSettings?.closeButtonBehavior ?? "minimize_to_tray";
  const launchSupported = desktopLaunchAtLoginStatus?.supported === true;
  const launchCanModify =
    launchSupported && desktopLaunchAtLoginStatus?.canModify !== false;
  const reducedMotion =
    desktopSettings?.desktopPetReducedMotion ?? "system";
  const activeSkinDisplayName =
    petSkinRegistry?.activeSkin?.displayName ??
    tSettingsV2(locale, "settings.skin.status.builtIn");
  const activeSkinSource = petSkinRegistry?.activeSkin
    ? tSettingsV2(locale, "settings.skin.status.local")
    : tSettingsV2(locale, "settings.skin.status.builtIn");
  const skinHealth =
    petSkinRegistry === null
      ? tSettingsV2(locale, "settings.skin.status.notLoaded")
      : petSkinRegistry.registryHealthy
        ? tSettingsV2(locale, "settings.skin.status.healthy")
        : tSettingsV2(locale, "settings.skin.status.recovered");
  const providerValue = getVoiceProviderValueLabel(locale, voiceServiceStatus);
  const ttsValue = getTtsValueLabel(locale, ttsServiceStatus);
  const voiceLanguageValue = getVoiceLanguageLabel(
    locale,
    voiceServiceStatus?.language,
  );
  const ttsVoiceValue =
    ttsServiceStatus?.configured === true && ttsServiceStatus.voiceId
      ? tSettingsV2(locale, "settings.voice.tts.voiceConfigured")
      : tSettingsV2(locale, "settings.voice.tts.defaultVoice");
  const commandRouterValue = getCommandRouterValueLabel(
    locale,
    commandRouterProductModeStatus,
  );
  const chatAnswerValue = getChatAnswerValueLabel(
    locale,
    chatAnswerProductModeStatus,
  );
  const localModelSummary = getLocalModelSummary(
    locale,
    modelInventory,
    modelManifests,
  );
  const cloudLocalSummary = getCloudLocalStatusSummary({
    locale,
    inferenceProviders,
    inferenceProviderRequirements,
    resourceDiagnostics,
  });
  const localProviderCount = inferenceProviders.filter(
    (provider) => provider.execution === "local",
  ).length;
  const cloudProviderCount = inferenceProviders.filter(
    (provider) => provider.execution === "cloud",
  ).length;
  const activeModelOperations = modelOperations.filter(
    (operation) =>
      operation.phase !== "completed" && operation.phase !== "failed",
  ).length;

  return (
    <div
      className="jk-theme settings-v2-shell"
      data-jarvis-theme={activeThemeId}
      data-testid="settings-v2-view"
    >
      <SettingsPageHeader
        action={
          <span className="settings-v2-chip">
            {tSettingsV2(locale, "settings.shell.migratedOnly")}
          </span>
        }
        description={tSettingsV2(locale, "settings.shell.description")}
        title={tSettingsV2(locale, "settings.shell.title")}
      />

      <div className="settings-v2-search-row">
        <SearchField
          data-testid="settings-v2-search"
          label={tSettingsV2(locale, "settings.shell.search")}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          value={searchQuery}
        />
        <div className="settings-v2-narrow-category">
          <SettingsCategorySelect
            categories={categories}
            label={tSettingsV2(locale, "settings.shell.category")}
            onSelect={(categoryId) =>
              setSelectedCategoryId(categoryId as SettingsV2CategoryId)
            }
            selectedId={selectedCategoryId}
          />
        </div>
      </div>

      <div className="settings-v2-layout">
        <div
          className="settings-v2-wide-category"
          data-testid="settings-v2-category-nav"
        >
          <SettingsCategoryNav
            categories={categories}
            onSelect={(categoryId) =>
              setSelectedCategoryId(categoryId as SettingsV2CategoryId)
            }
            selectedId={selectedCategoryId}
          />
        </div>

        <main className="settings-v2-content">
          {searchQuery.trim().length > 0 ? (
            <section data-testid="settings-v2-search-results">
              <h2 className="settings-v2-search-title">
                {searchResults.length}{" "}
                {tSettingsV2(locale, "settings.search.results")}
              </h2>
              <div className="settings-v2-search-list">
                {searchResults.length > 0 ? (
                  searchResults.map(({ definition, value }) => (
                    <SettingsSearchResult
                      breadcrumb={`${getCategoryLabel(locale, definition.categoryId)} / ${getSectionLabel(locale, definition.sectionId)}`}
                      description={tSettingsV2(locale, definition.descriptionKey)}
                      key={definition.settingId}
                      title={tSettingsV2(locale, definition.labelKey)}
                      value={`${tSettingsV2(locale, "settings.common.currentValue")}: ${value}`}
                    />
                  ))
                ) : (
                  <div data-testid="settings-v2-search-empty">
                    <SettingsSearchEmpty
                      description={tSettingsV2(
                        locale,
                        "settings.search.noResultsDescription",
                      )}
                      title={tSettingsV2(locale, "settings.search.noResultsTitle")}
                    />
                  </div>
                )}
              </div>
            </section>
          ) : selectedCategoryId === "general" ? (
            <section data-testid="settings-v2-general">
              <SettingsPageHeader
                description={tSettingsV2(locale, "settings.general.description")}
                title={tSettingsV2(locale, "settings.general.title")}
              />
              {error ? (
                <InlineNotice title={formatSettingsV2Error(locale, "save_failed")} tone="warning">
                  {formatSettingsV2Error(locale, "unavailable")}
                </InlineNotice>
              ) : null}

              <SettingsSection
                title={tSettingsV2(locale, "settings.general.section.interface")}
              >
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.general.displayLanguage.description",
                  )}
                  title={tSettingsV2(
                    locale,
                    "settings.general.displayLanguage.label",
                  )}
                >
                  <SettingValueAction
                    actionLabel={tSettingsV2(
                      locale,
                      "settings.general.displayLanguage.action",
                    )}
                    onAction={() => setLanguageDialogOpen(true)}
                    value={getLanguageLabel(locale, locale)}
                  />
                </SettingRow>
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.general.section.desktop")}
              >
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.general.closeBehavior.description",
                  )}
                  title={tSettingsV2(
                    locale,
                    "settings.general.closeBehavior.label",
                  )}
                >
                  <SettingValueAction
                    actionLabel={tSettingsV2(
                      locale,
                      "settings.general.closeBehavior.action",
                    )}
                    onAction={() => setCloseDialogOpen(true)}
                    value={getCloseBehaviorLabel(locale, closeBehavior)}
                  />
                </SettingRow>
                <SettingSwitchRow
                  checked={desktopSettings?.launchAtLoginEnabled ?? false}
                  description={
                    launchSupported
                      ? tSettingsV2(
                          locale,
                          "settings.general.launchAtLogin.description",
                        )
                      : tSettingsV2(
                          locale,
                          "settings.general.launchAtLogin.unavailable",
                        )
                  }
                  disabled={!launchCanModify || sending}
                  onCheckedChange={onSetDesktopLaunchAtLoginEnabled}
                  title={tSettingsV2(
                    locale,
                    "settings.general.launchAtLogin.label",
                  )}
                />
                <div
                  className="settings-v2-status-row"
                  data-testid="settings-v2-launch-at-login"
                >
                  <span>
                    {tSettingsV2(locale, "settings.common.currentValue")}:{" "}
                    {getLaunchValueLabel(
                      locale,
                      desktopSettings,
                      desktopLaunchAtLoginStatus,
                    )}
                  </span>
                  {!launchSupported || desktopLaunchAtLoginStatus?.mismatch ? (
                    <Button
                      disabled={sending}
                      onClick={onRefreshDesktopSettings}
                      variant="ghost"
                    >
                      {tSettingsV2(locale, "settings.general.launchAtLogin.retry")}
                    </Button>
                  ) : null}
                </div>
              </SettingsSection>

              <DangerSection
                actionDisabled
                actionLabel={tSettingsV2(locale, "settings.general.reset.action")}
                description={tSettingsV2(locale, "settings.general.reset.description")}
                impact={tSettingsV2(locale, "settings.general.reset.impact")}
                title={tSettingsV2(locale, "settings.general.section.reset")}
              />
              <div className="settings-v2-reset-details">
                <span>{tSettingsV2(locale, "settings.general.reset.unsupported")}</span>
                <Button
                  data-testid="settings-v2-reset-action"
                  onClick={() => setResetDialogOpen(true)}
                  variant="secondary"
                >
                  {tSettingsV2(locale, "settings.general.reset.details")}
                </Button>
              </div>
            </section>
          ) : selectedCategoryId === "appearance_pet" ? (
            <section data-testid="settings-v2-appearance-pet">
              <SettingsPageHeader
                description={tSettingsV2(locale, "settings.appearance.description")}
                title={tSettingsV2(locale, "settings.appearance.title")}
              />
              {error ? (
                <InlineNotice title={formatSettingsV2Error(locale, "save_failed")} tone="warning">
                  {formatSettingsV2Error(locale, "unavailable")}
                </InlineNotice>
              ) : null}

              <SettingsSection
                description={tSettingsV2(
                  locale,
                  "settings.appearance.theme.previewDescription",
                )}
                title={tSettingsV2(locale, "settings.appearance.section.theme")}
              >
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.appearance.theme.description",
                  )}
                  title={tSettingsV2(locale, "settings.appearance.theme.label")}
                >
                  <SettingValueAction
                    actionLabel={tSettingsV2(
                      locale,
                      "settings.appearance.theme.action",
                    )}
                    onAction={() => setThemeDialogOpen(true)}
                    value={getThemeLabel(locale, activeThemeId)}
                  />
                </SettingRow>
                <ThemeChoiceGrid
                  activeThemeId={activeThemeId}
                  locale={locale}
                  onSelectTheme={onSelectTheme}
                  sending={sending}
                />
                <ThemePreview activeThemeId={activeThemeId} locale={locale} />
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.appearance.section.pet")}
              >
                <SettingSwitchRow
                  checked={desktopSettings?.desktopPetEnabled ?? false}
                  description={tSettingsV2(locale, "settings.pet.show.description")}
                  disabled={desktopSettings === null || sending}
                  onCheckedChange={onSetDesktopPetEnabled}
                  title={tSettingsV2(locale, "settings.pet.show.label")}
                />
                <SettingSwitchRow
                  checked={desktopSettings?.desktopPetAlwaysOnTop ?? true}
                  description={tSettingsV2(
                    locale,
                    "settings.pet.keepOnTop.description",
                  )}
                  disabled={desktopSettings === null || sending}
                  onCheckedChange={onSetDesktopPetAlwaysOnTop}
                  title={tSettingsV2(locale, "settings.pet.keepOnTop.label")}
                />
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.pet.reducedMotion.description",
                  )}
                  title={tSettingsV2(locale, "settings.pet.reducedMotion.label")}
                >
                  <div
                    className="settings-v2-segmented"
                    data-testid="settings-v2-pet-reduced-motion"
                  >
                    {desktopPetReducedMotionModes.map(
                      (mode) => (
                        <Button
                          aria-pressed={reducedMotion === mode}
                          className="settings-v2-segment"
                          disabled={desktopSettings === null || sending}
                          key={mode}
                          onClick={() => onSetDesktopPetReducedMotion(mode)}
                          variant={reducedMotion === mode ? "primary" : "ghost"}
                        >
                          {tSettingsV2(
                            locale,
                            mode === "system"
                              ? "settings.pet.reducedMotion.system"
                              : mode === "on"
                                ? "settings.pet.reducedMotion.on"
                                : "settings.pet.reducedMotion.off",
                          )}
                        </Button>
                      ),
                    )}
                  </div>
                </SettingRow>
                <div className="settings-v2-status-row" data-testid="settings-v2-pet-status">
                  <span>
                    {tSettingsV2(locale, "settings.common.currentValue")}:{" "}
                    {getPetVisibilityLabel(locale, desktopSettings)} /{" "}
                    {getReducedMotionLabel(locale, reducedMotion)}
                  </span>
                  <Button
                    disabled={desktopSettings === null || sending}
                    onClick={onResetDesktopPetPosition}
                    variant="secondary"
                  >
                    {tSettingsV2(locale, "settings.pet.resetPosition.action")}
                  </Button>
                </div>
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.appearance.section.skin")}
              >
                <SkinSummaryCard
                  activeSkinDisplayName={activeSkinDisplayName}
                  activeSkinSource={activeSkinSource}
                  installedCount={petSkinRegistry?.installedSkins.length ?? 0}
                  locale={locale}
                  registryHealth={skinHealth}
                />
                <div className="settings-v2-status-row" data-testid="settings-v2-skin-management">
                  <span>{tSettingsV2(locale, "settings.skin.manage.description")}</span>
                  <Button
                    disabled={!onOpenExistingSkinManagement}
                    onClick={onOpenExistingSkinManagement}
                    variant="secondary"
                  >
                    {tSettingsV2(locale, "settings.skin.manage.action")}
                  </Button>
                </div>
              </SettingsSection>
            </section>
          ) : selectedCategoryId === "voice_audio" ? (
            <section data-testid="settings-v2-voice-audio">
              <SettingsPageHeader
                description={tSettingsV2(locale, "settings.voice.description")}
                title={tSettingsV2(locale, "settings.voice.title")}
              />
              <InlineNotice title={tSettingsV2(locale, "settings.status.localOnly")}>
                {tSettingsV2(locale, "settings.voice.privacy.localOnly")}
              </InlineNotice>

              <SettingsSection
                title={tSettingsV2(locale, "settings.voice.section.provider")}
              >
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.voice.provider.description",
                  )}
                  title={tSettingsV2(locale, "settings.voice.provider.label")}
                >
                  <SettingValueAction
                    actionLabel={tSettingsV2(
                      locale,
                      "settings.voice.provider.action",
                    )}
                    onAction={onOpenVoiceSettings}
                    value={providerValue}
                  />
                </SettingRow>
                <div
                  className="settings-v2-voice-status-grid"
                  data-testid="settings-v2-voice-provider-status"
                >
                  <span>
                    {tSettingsV2(locale, "settings.common.currentValue")}:{" "}
                    {providerValue}
                  </span>
                  <span>
                    {tSettingsV2(
                      locale,
                      "settings.voice.provider.language.label",
                    )}
                    : {voiceLanguageValue}
                  </span>
                  <span>
                    {tSettingsV2(
                      locale,
                      "settings.voice.provider.connectionNotChecked",
                    )}
                  </span>
                </div>
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.voice.section.capture")}
              >
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.voice.captureMode.description",
                  )}
                  title={tSettingsV2(locale, "settings.voice.captureMode.label")}
                  value={getVoiceModeLabel(locale, voiceMode)}
                />
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.voice.microphone.description",
                  )}
                  title={tSettingsV2(locale, "settings.voice.microphone.label")}
                  value={getVoicePermissionLabel(locale, voicePermission)}
                />
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.voice.pushToTalk.description",
                  )}
                  title={tSettingsV2(locale, "settings.voice.pushToTalk.label")}
                >
                  <SettingValueAction
                    actionLabel={tSettingsV2(
                      locale,
                      "settings.voice.pushToTalk.action",
                    )}
                    onAction={onOpenVoicePage}
                    value={
                      voiceCaptureAvailable
                        ? tSettingsV2(
                            locale,
                            "settings.voice.pushToTalk.available",
                          )
                        : tSettingsV2(
                            locale,
                            "settings.voice.pushToTalk.unavailable",
                          )
                    }
                  />
                </SettingRow>
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.voice.section.output")}
              >
                <SettingRow
                  description={tSettingsV2(locale, "settings.voice.tts.description")}
                  title={tSettingsV2(locale, "settings.voice.tts.label")}
                >
                  <SettingValueAction
                    actionLabel={tSettingsV2(locale, "settings.voice.tts.action")}
                    onAction={onOpenTtsSettings}
                    value={ttsValue}
                  />
                </SettingRow>
                <div
                  className="settings-v2-voice-status-grid"
                  data-testid="settings-v2-tts-status"
                >
                  <span>
                    {tSettingsV2(locale, "settings.common.currentValue")}:{" "}
                    {ttsValue}
                  </span>
                  <span>{ttsVoiceValue}</span>
                  <span>
                    {tSettingsV2(
                      locale,
                      "settings.voice.provider.connectionNotChecked",
                    )}
                  </span>
                </div>
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.voice.section.wake")}
              >
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.voice.wakeWord.description",
                  )}
                  title={tSettingsV2(locale, "settings.voice.wakeWord.label")}
                  value={tSettingsV2(locale, "settings.voice.wakeWord.unavailable")}
                />
              </SettingsSection>
            </section>
          ) : selectedCategoryId === "models_intelligence" ? (
            <section data-testid="settings-v2-models-intelligence">
              <SettingsPageHeader
                description={tSettingsV2(locale, "settings.models.description")}
                title={tSettingsV2(locale, "settings.models.title")}
              />
              <InlineNotice title={tSettingsV2(locale, "settings.status.localOnly")}>
                {tSettingsV2(locale, "settings.models.status.noNetworkOnOpen")}
              </InlineNotice>

              <SettingsSection
                title={tSettingsV2(locale, "settings.models.section.command")}
              >
                <SettingSwitchRow
                  checked={commandRouterProductModeStatus?.enabled === true}
                  description={tSettingsV2(
                    locale,
                    "settings.models.fastCommand.description",
                  )}
                  disabled={
                    sending ||
                    !commandRouterProductModeStatus ||
                    !onSetCommandRouterProductModeEnabled
                  }
                  onCheckedChange={onSetCommandRouterProductModeEnabled}
                  title={tSettingsV2(locale, "settings.models.fastCommand.label")}
                />
                <div
                  className="settings-v2-models-status-grid"
                  data-testid="settings-v2-command-router-status"
                >
                  <span>
                    {tSettingsV2(locale, "settings.common.currentValue")}:{" "}
                    {commandRouterValue}
                  </span>
                  <span>{tSettingsV2(locale, "settings.models.fastCommand.localRules")}</span>
                  <span>{tSettingsV2(locale, "settings.models.routingPolicy.safeSummary")}</span>
                </div>
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.models.section.answer")}
              >
                <SettingSwitchRow
                  checked={chatAnswerProductModeStatus?.enabled === true}
                  description={tSettingsV2(
                    locale,
                    "settings.models.answerProvider.description",
                  )}
                  disabled={
                    sending ||
                    !chatAnswerProductModeStatus ||
                    !onSetChatAnswerProductModeEnabled
                  }
                  onCheckedChange={onSetChatAnswerProductModeEnabled}
                  title={tSettingsV2(locale, "settings.models.answerProvider.label")}
                />
                <div
                  className="settings-v2-models-status-grid"
                  data-testid="settings-v2-answer-provider-status"
                >
                  <span>
                    {tSettingsV2(locale, "settings.common.currentValue")}:{" "}
                    {chatAnswerValue}
                  </span>
                  <span>
                    {chatAnswerProductModeStatus?.enabled
                      ? tSettingsV2(locale, "settings.models.answerProvider.enabled")
                      : tSettingsV2(locale, "settings.models.answerProvider.disabled")}
                  </span>
                  <span>{tSettingsV2(locale, "settings.models.status.notVerified")}</span>
                </div>
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.models.section.local")}
              >
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.models.localModels.description",
                  )}
                  title={tSettingsV2(locale, "settings.models.localModels.label")}
                  value={localModelSummary}
                />
                <div
                  className="settings-v2-models-status-grid"
                  data-testid="settings-v2-local-model-status"
                >
                  <span>
                    {tSettingsV2(locale, "settings.common.currentValue")}:{" "}
                    {localModelSummary}
                  </span>
                  <span>
                    {activeModelOperations > 0
                      ? `${tSettingsV2(locale, "settings.status.operationInProgress")}: ${activeModelOperations}`
                      : tSettingsV2(locale, "settings.models.localModels.noOperations")}
                  </span>
                  <span className="settings-v2-models-actions">
                    <Button
                      disabled={!onRefreshModelStatus || sending}
                      onClick={onRefreshModelStatus}
                      variant="ghost"
                    >
                      {tSettingsV2(locale, "settings.models.localModels.refresh")}
                    </Button>
                    <Button
                      disabled={!onOpenModelOperations}
                      onClick={onOpenModelOperations}
                      variant="secondary"
                    >
                      {tSettingsV2(locale, "settings.models.localModels.openOperations")}
                    </Button>
                  </span>
                </div>
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.models.section.routing")}
              >
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.models.routingPolicy.description",
                  )}
                  title={tSettingsV2(locale, "settings.models.routingPolicy.label")}
                  value={tSettingsV2(
                    locale,
                    "settings.models.routingPolicy.safeSummary",
                  )}
                />
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.models.cloudLocalStatus.description",
                  )}
                  title={tSettingsV2(locale, "settings.models.cloudLocalStatus.label")}
                  value={cloudLocalSummary}
                />
                <div
                  className="settings-v2-models-status-grid"
                  data-testid="settings-v2-cloud-local-status"
                >
                  <span>
                    {tSettingsV2(locale, "settings.models.cloudLocalStatus.localProviders")}:{" "}
                    {localProviderCount}
                  </span>
                  <span>
                    {tSettingsV2(locale, "settings.models.cloudLocalStatus.cloudProviders")}:{" "}
                    {cloudProviderCount}
                  </span>
                  <span>
                    {inferenceProviders.length > 0
                      ? inferenceProviders
                          .map((provider) =>
                            getProviderStatusLabel(locale, provider.status),
                          )
                          .join(" / ")
                      : tSettingsV2(locale, "settings.status.unknown")}
                  </span>
                </div>
              </SettingsSection>
            </section>
          ) : (
            <section
              className="settings-v2-placeholder"
              data-testid="settings-v2-placeholder"
            >
              <SettingsSearchEmpty
                description={tSettingsV2(
                  locale,
                  "settings.shell.notMigratedDescription",
                )}
                title={tSettingsV2(locale, "settings.shell.notMigratedTitle")}
              />
            </section>
          )}
        </main>
      </div>

      <Dialog
        description={tSettingsV2(
          locale,
          "settings.general.displayLanguage.dialogDescription",
        )}
        onClose={() => setLanguageDialogOpen(false)}
        open={languageDialogOpen}
        title={tSettingsV2(locale, "settings.general.displayLanguage.dialogTitle")}
      >
        <div className="settings-v2-dialog-actions" data-testid="settings-v2-language-dialog">
          <Button
            onClick={() => {
              onSelectLanguage("en");
              setLanguageDialogOpen(false);
            }}
            variant={locale === "en" ? "primary" : "secondary"}
          >
            {tSettingsV2(locale, "settings.general.displayLanguage.english")}
          </Button>
          <Button
            onClick={() => {
              onSelectLanguage("zh");
              setLanguageDialogOpen(false);
            }}
            variant={locale === "zh" ? "primary" : "secondary"}
          >
            {tSettingsV2(locale, "settings.general.displayLanguage.chinese")}
          </Button>
        </div>
      </Dialog>

      <Dialog
        description={tSettingsV2(
          locale,
          "settings.general.closeBehavior.dialogDescription",
        )}
        onClose={() => setCloseDialogOpen(false)}
        open={closeDialogOpen}
        title={tSettingsV2(locale, "settings.general.closeBehavior.dialogTitle")}
      >
        <div className="settings-v2-dialog-actions" data-testid="settings-v2-close-dialog">
          <Button
            onClick={() => {
              onSetDesktopCloseButtonBehavior("minimize_to_tray");
              setCloseDialogOpen(false);
            }}
            variant={closeBehavior === "minimize_to_tray" ? "primary" : "secondary"}
          >
            {tSettingsV2(locale, "settings.general.closeBehavior.minimizeToTray")}
          </Button>
          <Button
            onClick={() => {
              onSetDesktopCloseButtonBehavior("quit");
              setCloseDialogOpen(false);
            }}
            variant={closeBehavior === "quit" ? "primary" : "secondary"}
          >
            {tSettingsV2(locale, "settings.general.closeBehavior.quit")}
          </Button>
        </div>
      </Dialog>

      <Dialog
        description={tSettingsV2(
          locale,
          "settings.appearance.theme.dialogDescription",
        )}
        onClose={() => setThemeDialogOpen(false)}
        open={themeDialogOpen}
        title={tSettingsV2(locale, "settings.appearance.theme.dialogTitle")}
      >
        <div className="settings-v2-dialog-actions" data-testid="settings-v2-theme-dialog">
          {builtInSkinThemes.map((theme) => (
            <Button
              key={theme.id}
              onClick={() => {
                onSelectTheme(theme.id);
                setThemeDialogOpen(false);
              }}
              variant={activeThemeId === theme.id ? "primary" : "secondary"}
            >
              {getThemeLabel(locale, theme.id)}
            </Button>
          ))}
        </div>
      </Dialog>

      <Dialog
        description={tSettingsV2(locale, "settings.confirmation.resetDescription")}
        onClose={() => setResetDialogOpen(false)}
        open={resetDialogOpen}
        title={tSettingsV2(locale, "settings.confirmation.resetTitle")}
      >
        <div className="settings-v2-dialog-actions" data-testid="settings-v2-reset-dialog">
          <InlineNotice title={tSettingsV2(locale, "settings.general.reset.unsupported")} tone="warning">
            {tSettingsV2(locale, "settings.general.reset.impact")}
          </InlineNotice>
          <Button onClick={() => setResetDialogOpen(false)} variant="secondary">
            {tSettingsV2(locale, "settings.common.close")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function ThemeChoiceGrid({
  activeThemeId,
  locale,
  onSelectTheme,
  sending,
}: {
  activeThemeId: SkinThemeId;
  locale: SettingsV2Locale;
  onSelectTheme: (themeId: SkinThemeId) => void;
  sending: boolean;
}) {
  return (
    <div className="settings-v2-theme-grid" data-testid="settings-v2-theme-choices">
      {builtInSkinThemes.map((theme) => (
        <button
          aria-pressed={activeThemeId === theme.id}
          className="settings-v2-theme-choice"
          data-selected={activeThemeId === theme.id}
          data-testid={`settings-v2-theme-${theme.id}`}
          disabled={sending}
          key={theme.id}
          onClick={() => onSelectTheme(theme.id)}
          type="button"
        >
          <span className="settings-v2-theme-swatches" aria-hidden="true">
            {theme.swatches.map((color) => (
              <span
                className="settings-v2-theme-swatch"
                key={color}
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
          <strong>{getThemeLabel(locale, theme.id)}</strong>
          <span>
            {getThemeDescription(locale, theme.id)}
          </span>
        </button>
      ))}
    </div>
  );
}

function ThemePreview({
  activeThemeId,
  locale,
}: {
  activeThemeId: SkinThemeId;
  locale: SettingsV2Locale;
}) {
  const activeTheme =
    builtInSkinThemes.find((theme) => theme.id === activeThemeId) ??
    builtInSkinThemes[0];
  return (
    <article className="settings-v2-theme-preview" data-testid="settings-v2-theme-preview">
      <div className="settings-v2-theme-preview-frame">
        <span className="settings-v2-theme-preview-dot" />
        <div className="settings-v2-theme-preview-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="settings-v2-theme-preview-accent" />
      </div>
      <div className="jk-stack">
        <strong>{tSettingsV2(locale, "settings.appearance.theme.previewTitle")}</strong>
        <span className="jk-muted">
          {getThemeLabel(locale, activeTheme.id)}
        </span>
      </div>
    </article>
  );
}

function SkinSummaryCard({
  activeSkinDisplayName,
  activeSkinSource,
  installedCount,
  locale,
  registryHealth,
}: {
  activeSkinDisplayName: string;
  activeSkinSource: string;
  installedCount: number;
  locale: SettingsV2Locale;
  registryHealth: string;
}) {
  return (
    <article className="settings-v2-skin-summary" data-testid="settings-v2-skin-summary">
      <div className="jk-stack">
        <strong>{activeSkinDisplayName}</strong>
        <span className="jk-muted">{activeSkinSource}</span>
      </div>
      <dl>
        <div>
          <dt>{tSettingsV2(locale, "settings.common.currentValue")}</dt>
          <dd>{registryHealth}</dd>
        </div>
        <div>
          <dt>{tSettingsV2(locale, "settings.appearance.section.skin")}</dt>
          <dd>
            {installedCount > 0
              ? `${installedCount}`
              : tSettingsV2(locale, "settings.skin.empty.title")}
          </dd>
        </div>
      </dl>
    </article>
  );
}
