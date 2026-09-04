export type SettingsV2Locale = "en" | "zh";

export type SettingsV2CopyKey =
  | "settings.shell.title"
  | "settings.shell.description"
  | "settings.shell.search"
  | "settings.shell.category"
  | "settings.shell.useClassic"
  | "settings.shell.useClassicDescription"
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
  | "settings.appearance.title"
  | "settings.appearance.description"
  | "settings.appearance.section.theme"
  | "settings.appearance.section.pet"
  | "settings.appearance.section.skin"
  | "settings.appearance.theme.label"
  | "settings.appearance.theme.description"
  | "settings.appearance.theme.action"
  | "settings.appearance.theme.dialogTitle"
  | "settings.appearance.theme.dialogDescription"
  | "settings.appearance.theme.previewTitle"
  | "settings.appearance.theme.previewDescription"
  | "settings.theme.signal.label"
  | "settings.theme.signal.description"
  | "settings.theme.harbor.label"
  | "settings.theme.harbor.description"
  | "settings.theme.ember.label"
  | "settings.theme.ember.description"
  | "settings.pet.show.label"
  | "settings.pet.show.description"
  | "settings.pet.keepOnTop.label"
  | "settings.pet.keepOnTop.description"
  | "settings.pet.reducedMotion.label"
  | "settings.pet.reducedMotion.description"
  | "settings.pet.reducedMotion.system"
  | "settings.pet.reducedMotion.on"
  | "settings.pet.reducedMotion.off"
  | "settings.pet.resetPosition.label"
  | "settings.pet.resetPosition.description"
  | "settings.pet.resetPosition.action"
  | "settings.pet.status.enabled"
  | "settings.pet.status.disabled"
  | "settings.pet.status.motionSystem"
  | "settings.pet.status.motionReduced"
  | "settings.pet.status.motionFull"
  | "settings.skin.current.label"
  | "settings.skin.current.description"
  | "settings.skin.status.builtIn"
  | "settings.skin.status.local"
  | "settings.skin.status.healthy"
  | "settings.skin.status.recovered"
  | "settings.skin.status.notLoaded"
  | "settings.skin.empty.title"
  | "settings.skin.empty.description"
  | "settings.skin.manage.description"
  | "settings.skin.manage.action"
  | "settings.voice.title"
  | "settings.voice.description"
  | "settings.voice.section.provider"
  | "settings.voice.section.capture"
  | "settings.voice.section.output"
  | "settings.voice.section.wake"
  | "settings.voice.provider.label"
  | "settings.voice.provider.description"
  | "settings.voice.provider.action"
  | "settings.voice.provider.configured"
  | "settings.voice.provider.notConfigured"
  | "settings.voice.provider.secureStorageUnavailable"
  | "settings.voice.provider.connectionNotChecked"
  | "settings.voice.provider.language.label"
  | "settings.voice.provider.language.chinese"
  | "settings.voice.provider.language.english"
  | "settings.voice.provider.availableAfterSetup"
  | "settings.voice.captureMode.label"
  | "settings.voice.captureMode.description"
  | "settings.voice.captureMode.disabled"
  | "settings.voice.captureMode.pushToTalk"
  | "settings.voice.captureMode.continuous"
  | "settings.voice.microphone.label"
  | "settings.voice.microphone.description"
  | "settings.voice.microphone.unknown"
  | "settings.voice.microphone.prompt"
  | "settings.voice.microphone.granted"
  | "settings.voice.microphone.denied"
  | "settings.voice.pushToTalk.label"
  | "settings.voice.pushToTalk.description"
  | "settings.voice.pushToTalk.available"
  | "settings.voice.pushToTalk.unavailable"
  | "settings.voice.pushToTalk.action"
  | "settings.voice.tts.label"
  | "settings.voice.tts.description"
  | "settings.voice.tts.action"
  | "settings.voice.tts.configured"
  | "settings.voice.tts.notConfigured"
  | "settings.voice.tts.secureStorageUnavailable"
  | "settings.voice.tts.voiceConfigured"
  | "settings.voice.tts.defaultVoice"
  | "settings.voice.tts.availableAfterSetup"
  | "settings.voice.wakeWord.label"
  | "settings.voice.wakeWord.description"
  | "settings.voice.wakeWord.unavailable"
  | "settings.voice.privacy.localOnly"
  | "settings.models.title"
  | "settings.models.description"
  | "settings.models.section.command"
  | "settings.models.section.answer"
  | "settings.models.section.local"
  | "settings.models.section.routing"
  | "settings.models.fastCommand.label"
  | "settings.models.fastCommand.description"
  | "settings.models.fastCommand.localRules"
  | "settings.models.fastCommand.action"
  | "settings.models.fastCommand.defaultRoute"
  | "settings.models.fastCommand.statusUnknown"
  | "settings.models.fastCommand.statusUnavailable"
  | "settings.models.answerProvider.label"
  | "settings.models.answerProvider.description"
  | "settings.models.answerProvider.notConfigured"
  | "settings.models.answerProvider.configuredNotVerified"
  | "settings.models.answerProvider.secureStorageUnavailable"
  | "settings.models.answerProvider.enabled"
  | "settings.models.answerProvider.disabled"
  | "settings.models.answerProvider.allowedNeedsSetup"
  | "settings.models.answerProvider.setupRequired"
  | "settings.models.answerProvider.cannotUse"
  | "settings.models.answerProvider.available"
  | "settings.models.answerProvider.verified"
  | "settings.models.answerProvider.allowedNotReady"
  | "settings.models.answerProvider.configuredOff"
  | "settings.models.answerProvider.savedOff"
  | "settings.models.answerProvider.statusUnknown"
  | "settings.models.answerProvider.configureAction"
  | "settings.models.answerProvider.providerType"
  | "settings.models.answerProvider.deepseekCompatible"
  | "settings.models.answerProvider.serviceUrl"
  | "settings.models.answerProvider.modelId"
  | "settings.models.answerProvider.apiKey"
  | "settings.models.answerProvider.apiKeyPlaceholder"
  | "settings.models.answerProvider.keySaved"
  | "settings.models.answerProvider.keyMissing"
  | "settings.models.answerProvider.save"
  | "settings.models.answerProvider.test"
  | "settings.models.answerProvider.enable"
  | "settings.models.answerProvider.disable"
  | "settings.models.answerProvider.replaceKey"
  | "settings.models.answerProvider.delete"
  | "settings.models.answerProvider.deleteTitle"
  | "settings.models.answerProvider.deleteDescription"
  | "settings.models.answerProvider.deleteConfirm"
  | "settings.models.answerProvider.cancel"
  | "settings.models.answerProvider.testNotice"
  | "settings.models.answerProvider.saveNoNetwork"
  | "settings.models.answerProvider.validationServiceUrl"
  | "settings.models.answerProvider.validationModelId"
  | "settings.models.answerProvider.validationApiKey"
  | "settings.models.answerProvider.test.not_tested"
  | "settings.models.answerProvider.test.testing"
  | "settings.models.answerProvider.test.success"
  | "settings.models.answerProvider.test.authentication_failed"
  | "settings.models.answerProvider.test.access_forbidden"
  | "settings.models.answerProvider.test.rate_limited"
  | "settings.models.answerProvider.test.model_not_found"
  | "settings.models.answerProvider.test.endpoint_unreachable"
  | "settings.models.answerProvider.test.provider_timeout"
  | "settings.models.answerProvider.test.malformed_response"
  | "settings.models.answerProvider.test.tls_or_certificate_error"
  | "settings.models.answerProvider.test.unknown_failure"
  | "settings.models.localModels.label"
  | "settings.models.localModels.description"
  | "settings.models.localModels.refresh"
  | "settings.models.localModels.openOperations"
  | "settings.models.localModels.noOperations"
  | "settings.models.localModels.notInstalled"
  | "settings.models.localModels.installed"
  | "settings.models.localModels.ready"
  | "settings.models.localModels.installedCount"
  | "settings.models.localModels.installableCount"
  | "settings.models.localModels.selectedCount"
  | "settings.models.localModels.readyCount"
  | "settings.models.localModels.unavailableCount"
  | "settings.models.localModels.busy"
  | "settings.models.routingPolicy.label"
  | "settings.models.routingPolicy.description"
  | "settings.models.routingPolicy.safeSummary"
  | "settings.models.routingPolicy.localRules"
  | "settings.models.routingPolicy.safety"
  | "settings.models.routingPolicy.localModel"
  | "settings.models.routingPolicy.onlineService"
  | "settings.models.routingPolicy.notConfigured"
  | "settings.models.cloudLocalStatus.label"
  | "settings.models.cloudLocalStatus.description"
  | "settings.models.cloudLocalStatus.localProviders"
  | "settings.models.cloudLocalStatus.cloudProviders"
  | "settings.models.cloudLocalStatus.resourceLeases"
  | "settings.models.status.localRulesEnabled"
  | "settings.models.status.localRulesOff"
  | "settings.models.status.localRoutingUnavailable"
  | "settings.models.status.defaultCommandRouting"
  | "settings.models.status.missing"
  | "settings.models.status.installed"
  | "settings.models.status.selected"
  | "settings.models.status.loaded"
  | "settings.models.status.currentlyNotLoaded"
  | "settings.models.status.available"
  | "settings.models.status.unavailable"
  | "settings.models.status.unconfigured"
  | "settings.models.status.degraded"
  | "settings.models.status.notVerified"
  | "settings.models.status.noNetworkOnOpen"
  | "settings.tools.title"
  | "settings.tools.description"
  | "settings.tools.section.automation"
  | "settings.tools.section.apps"
  | "settings.tools.section.websites"
  | "settings.tools.section.files"
  | "settings.tools.section.plugins"
  | "settings.tools.section.mcp"
  | "settings.tools.automation.label"
  | "settings.tools.automation.description"
  | "settings.tools.automation.guarded"
  | "settings.tools.automation.confirmation"
  | "settings.tools.automation.noRunOnOpen"
  | "settings.tools.approvedApps.label"
  | "settings.tools.approvedApps.description"
  | "settings.tools.approvedApps.managed"
  | "settings.tools.approvedApps.confirmation"
  | "settings.tools.approvedApps.noLaunchOnOpen"
  | "settings.tools.safeWebsites.label"
  | "settings.tools.safeWebsites.description"
  | "settings.tools.safeWebsites.confirmFirst"
  | "settings.tools.safeWebsites.noBrowserOnOpen"
  | "settings.tools.safeWebsites.unknownAsk"
  | "settings.tools.fileSearch.label"
  | "settings.tools.fileSearch.description"
  | "settings.tools.fileSearch.readOnly"
  | "settings.tools.fileSearch.filenameOnly"
  | "settings.tools.fileSearch.noScanOnOpen"
  | "settings.tools.plugins.label"
  | "settings.tools.plugins.description"
  | "settings.tools.plugins.action"
  | "settings.tools.plugins.noneInstalled"
  | "settings.tools.plugins.noProductPlugins"
  | "settings.tools.plugins.installed"
  | "settings.tools.plugins.productInstalled"
  | "settings.tools.plugins.enabled"
  | "settings.tools.plugins.productEnabled"
  | "settings.tools.plugins.availableForUse"
  | "settings.tools.plugins.readOnly"
  | "settings.tools.plugins.developerExamplesHidden"
  | "settings.tools.plugins.thirdPartyDisabled"
  | "settings.tools.plugins.noMarketplace"
  | "settings.tools.plugins.statusUnknown"
  | "settings.tools.plugins.refreshNeeded"
  | "settings.tools.mcp.label"
  | "settings.tools.mcp.description"
  | "settings.tools.mcp.unavailable"
  | "settings.tools.mcp.available"
  | "settings.tools.mcp.statusUnknown"
  | "settings.tools.mcp.notConnected"
  | "settings.tools.mcp.noAutoConnect"
  | "settings.tools.mcp.noExternalRun"
  | "settings.tools.mcp.userControlled"
  | "settings.tools.safeViewing.title"
  | "settings.tools.status.noExecutionOnOpen"
  | "settings.memory.title"
  | "settings.memory.description"
  | "settings.memory.section.personal"
  | "settings.memory.section.saved"
  | "settings.memory.section.storage"
  | "settings.memory.safeViewing.title"
  | "settings.memory.safeViewing.notice"
  | "settings.memory.personalMemory.label"
  | "settings.memory.personalMemory.description"
  | "settings.memory.personalMemory.available"
  | "settings.memory.personalMemory.notEnabled"
  | "settings.memory.personalMemory.unavailable"
  | "settings.memory.personalMemory.statusUnavailable"
  | "settings.memory.personalMemory.disabledDetail"
  | "settings.memory.personalMemory.newMessagesOnly"
  | "settings.memory.personalMemory.noRecallOnOpen"
  | "settings.memory.savedInformation.label"
  | "settings.memory.savedInformation.description"
  | "settings.memory.savedInformation.manageValue"
  | "settings.memory.savedInformation.action"
  | "settings.memory.savedInformation.shortcuts"
  | "settings.memory.savedInformation.voiceCorrections"
  | "settings.memory.savedInformation.responsePreferences"
  | "settings.memory.savedInformation.deleteInMemoryCenter"
  | "settings.memory.storage.label"
  | "settings.memory.storage.description"
  | "settings.memory.storage.localValue"
  | "settings.memory.storage.localData"
  | "settings.memory.storage.cloudSyncOff"
  | "settings.notifications.title"
  | "settings.notifications.description"
  | "settings.notifications.section.safeViewing"
  | "settings.notifications.section.current"
  | "settings.notifications.section.inApp"
  | "settings.notifications.section.tray"
  | "settings.notifications.section.privacy"
  | "settings.notifications.safeViewing.label"
  | "settings.notifications.safeViewing.description"
  | "settings.notifications.currentFeatures.label"
  | "settings.notifications.currentFeatures.description"
  | "settings.notifications.currentFeatures.limited"
  | "settings.notifications.currentFeatures.noFullWindowsSettings"
  | "settings.notifications.inAppStatus.label"
  | "settings.notifications.inAppStatus.description"
  | "settings.notifications.inAppStatus.available"
  | "settings.notifications.trayReminder.label"
  | "settings.notifications.trayReminder.description"
  | "settings.notifications.trayReminder.mayAppearOnce"
  | "settings.notifications.privacy.label"
  | "settings.notifications.privacy.description"
  | "settings.notifications.keywords.notifications"
  | "settings.notifications.keywords.inApp"
  | "settings.notifications.keywords.status"
  | "settings.notifications.keywords.tray"
  | "settings.notifications.keywords.windows"
  | "settings.notifications.keywords.privacy"
  | "settings.notifications.keywords.sensitive"
  | "settings.about.title"
  | "settings.about.description"
  | "settings.about.section.product"
  | "settings.about.section.updates"
  | "settings.about.productName.label"
  | "settings.about.productName.description"
  | "settings.about.version.label"
  | "settings.about.version.description"
  | "settings.about.updates.label"
  | "settings.about.updates.description"
  | "settings.about.updates.notAvailable"
  | "settings.about.safeViewing.label"
  | "settings.about.safeViewing.description"
  | "settings.about.keywords.about"
  | "settings.about.keywords.update"
  | "settings.about.keywords.version"
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
  | "settings.errors.confirmation_required";

export type SettingsV2ErrorCode =
  | "save_failed"
  | "validation_failed"
  | "unavailable"
  | "permission_required"
  | "operation_in_progress"
  | "confirmation_required";

export const settingsV2Copy: Record<
  SettingsV2Locale,
  Record<SettingsV2CopyKey, string>
> = {
  en: {
    "settings.shell.title": "Jarvis Control Center",
    "settings.shell.description":
      "Manage Jarvis settings for this device.",
    "settings.shell.search": "Search settings",
    "settings.shell.category": "Settings category",
    "settings.shell.useClassic": "Use classic settings",
    "settings.shell.useClassicDescription":
      "Switch for this session without changing your settings.",
    "settings.shell.notMigratedTitle": "This area is unavailable",
    "settings.shell.notMigratedDescription":
      "Use classic settings for this area during this session.",
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
      "Language, window behavior, and Windows sign-in launch.",
    "settings.general.section.interface": "Interface",
    "settings.general.section.desktop": "Desktop behavior",
    "settings.general.displayLanguage.label": "Display language",
    "settings.general.displayLanguage.description":
      "Choose the language Jarvis uses in settings.",
    "settings.general.displayLanguage.action": "Choose display language",
    "settings.general.displayLanguage.dialogTitle": "Choose display language",
    "settings.general.displayLanguage.dialogDescription":
      "This changes Jarvis settings immediately and keeps the existing app language preference.",
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
    "settings.appearance.title": "Appearance & Pet",
    "settings.appearance.description":
      "Choose Jarvis colors, Desktop Pet visibility, motion, and the current local skin summary.",
    "settings.appearance.section.theme": "Theme",
    "settings.appearance.section.pet": "Desktop Pet",
    "settings.appearance.section.skin": "Pet skin",
    "settings.appearance.theme.label": "Interface theme",
    "settings.appearance.theme.description":
      "Choose the built-in Jarvis visual theme used by the desktop interface.",
    "settings.appearance.theme.action": "Choose theme",
    "settings.appearance.theme.dialogTitle": "Choose interface theme",
    "settings.appearance.theme.dialogDescription":
      "Theme changes are saved through Desktop Settings and can be changed again any time.",
    "settings.appearance.theme.previewTitle": "Theme sample",
    "settings.appearance.theme.previewDescription":
      "A compact sample of text, borders, and Jarvis accent colors.",
    "settings.theme.signal.label": "Signal",
    "settings.theme.signal.description": "Dark control room with cyan Jarvis accents.",
    "settings.theme.harbor.label": "Harbor",
    "settings.theme.harbor.description": "Light workspace with calm operational contrast.",
    "settings.theme.ember.label": "Ember",
    "settings.theme.ember.description": "Warm dark focus mode for evening work.",
    "settings.pet.show.label": "Show Desktop Pet",
    "settings.pet.show.description":
      "Show the small Jarvis companion window on your desktop.",
    "settings.pet.keepOnTop.label": "Keep Desktop Pet on top",
    "settings.pet.keepOnTop.description":
      "Keep the Desktop Pet above normal windows without changing command permissions.",
    "settings.pet.reducedMotion.label": "Desktop Pet motion",
    "settings.pet.reducedMotion.description":
      "Control Desktop Pet animation intensity using the existing motion setting.",
    "settings.pet.reducedMotion.system": "Follow system",
    "settings.pet.reducedMotion.on": "Reduced motion",
    "settings.pet.reducedMotion.off": "Full motion",
    "settings.pet.resetPosition.label": "Move Desktop Pet back",
    "settings.pet.resetPosition.description":
      "Move the Desktop Pet back to its default safe corner.",
    "settings.pet.resetPosition.action": "Move back",
    "settings.pet.status.enabled": "Visible",
    "settings.pet.status.disabled": "Hidden",
    "settings.pet.status.motionSystem": "Following system preference",
    "settings.pet.status.motionReduced": "Reduced motion",
    "settings.pet.status.motionFull": "Full motion",
    "settings.skin.current.label": "Current Desktop Pet skin",
    "settings.skin.current.description":
      "View the safe summary of the active Desktop Pet skin.",
    "settings.skin.status.builtIn": "Built-in robot",
    "settings.skin.status.local": "Installed local skin",
    "settings.skin.status.healthy": "Available",
    "settings.skin.status.recovered": "Recovered to fallback",
    "settings.skin.status.notLoaded": "Not loaded",
    "settings.skin.empty.title": "No local skin is active",
    "settings.skin.empty.description":
      "Jarvis is using the built-in robot fallback.",
    "settings.skin.manage.description":
      "Local skin import and editing remain in the existing safe management flow.",
    "settings.skin.manage.action": "Refresh skin status",
    "settings.voice.title": "Voice & Audio",
    "settings.voice.description":
      "Review speech recognition, microphone permission, push-to-talk, speech output, and wake word availability.",
    "settings.voice.section.provider": "Speech recognition",
    "settings.voice.section.capture": "Microphone and capture",
    "settings.voice.section.output": "Speech output",
    "settings.voice.section.wake": "Wake word",
    "settings.voice.provider.label": "Speech recognition service",
    "settings.voice.provider.description":
      "Speech service credentials are managed in secure settings.",
    "settings.voice.provider.action": "Configure speech recognition",
    "settings.voice.provider.configured": "Credentials saved locally",
    "settings.voice.provider.notConfigured": "Not configured",
    "settings.voice.provider.secureStorageUnavailable":
      "Secure credential storage is unavailable",
    "settings.voice.provider.connectionNotChecked":
      "Connection is not checked on this page",
    "settings.voice.provider.language.label": "Recognition language",
    "settings.voice.provider.language.chinese": "Chinese",
    "settings.voice.provider.language.english": "English",
    "settings.voice.provider.availableAfterSetup": "Available after service setup",
    "settings.voice.captureMode.label": "Voice input status",
    "settings.voice.captureMode.description":
      "Shows the current voice input status without starting recording.",
    "settings.voice.captureMode.disabled": "Off",
    "settings.voice.captureMode.pushToTalk": "Push to talk",
    "settings.voice.captureMode.continuous": "Continuous listening",
    "settings.voice.microphone.label": "Microphone permission",
    "settings.voice.microphone.description":
      "Shows Windows permission state only. Opening this page does not request access.",
    "settings.voice.microphone.unknown": "Not requested",
    "settings.voice.microphone.prompt": "Will ask when you start voice input",
    "settings.voice.microphone.granted": "Allowed",
    "settings.voice.microphone.denied": "Blocked by Windows",
    "settings.voice.pushToTalk.label": "Push-to-talk voice input",
    "settings.voice.pushToTalk.description":
      "Go to the voice page to manually start one voice input.",
    "settings.voice.pushToTalk.available": "Available on the Voice page",
    "settings.voice.pushToTalk.unavailable":
      "Available when voice input is ready",
    "settings.voice.pushToTalk.action": "Open voice page",
    "settings.voice.tts.label": "Speech output service",
    "settings.voice.tts.description":
      "Speech output uses the existing secure voice playback configuration.",
    "settings.voice.tts.action": "Open speech output setup",
    "settings.voice.tts.configured": "Credentials saved locally",
    "settings.voice.tts.notConfigured": "Not configured",
    "settings.voice.tts.secureStorageUnavailable":
      "Secure credential storage is unavailable",
    "settings.voice.tts.voiceConfigured": "A voice is selected",
    "settings.voice.tts.defaultVoice": "Default voice",
    "settings.voice.tts.availableAfterSetup": "Available after service setup",
    "settings.voice.wakeWord.label": "Wake word",
    "settings.voice.wakeWord.description":
      "Wake word is read-only here and is not currently available.",
    "settings.voice.wakeWord.unavailable": "Not supported yet",
    "settings.voice.privacy.localOnly":
      "This page only reads local status and does not connect online services, start the microphone, or upload data.",
    "settings.models.title": "Models & Intelligence",
    "settings.models.description":
      "Review command understanding, online answer service readiness, local models, and the current answer method without loading models or contacting online services.",
    "settings.models.section.command": "Fast command understanding",
    "settings.models.section.answer": "Answer provider",
    "settings.models.section.local": "Local models",
    "settings.models.section.routing": "Routing and availability",
    "settings.models.fastCommand.label": "Fast command understanding",
    "settings.models.fastCommand.description":
      "Choose whether quick commands prefer the existing local rules. This does not start any local model or online service.",
    "settings.models.fastCommand.localRules": "Local rules",
    "settings.models.fastCommand.action": "Local rules mode",
    "settings.models.fastCommand.defaultRoute":
      "Uses the existing default command routing.",
    "settings.models.fastCommand.statusUnknown":
      "Jarvis has not reported command routing status yet.",
    "settings.models.fastCommand.statusUnavailable":
      "Command routing is not available in the current runtime.",
    "settings.models.answerProvider.label": "Online answer service",
    "settings.models.answerProvider.description":
      "Choose whether Jarvis may use the existing online answer path after secure configuration and runtime gates are ready.",
    "settings.models.answerProvider.notConfigured": "Not configured",
    "settings.models.answerProvider.configuredNotVerified":
      "Configuration saved locally, not verified",
    "settings.models.answerProvider.secureStorageUnavailable":
      "Secure credential storage is unavailable",
    "settings.models.answerProvider.enabled": "Enabled",
    "settings.models.answerProvider.disabled": "Off",
    "settings.models.answerProvider.allowedNeedsSetup":
      "Allowed, service not configured",
    "settings.models.answerProvider.setupRequired":
      "Configure the online answer service before it can answer.",
    "settings.models.answerProvider.cannotUse":
      "Jarvis cannot use saved online credentials on this device.",
    "settings.models.answerProvider.available": "Available",
    "settings.models.answerProvider.verified":
      "Ready according to the current secure runtime gate.",
    "settings.models.answerProvider.allowedNotReady":
      "Allowed, but the service has not been verified in this session.",
    "settings.models.answerProvider.configuredOff":
      "Configuration saved, service off",
    "settings.models.answerProvider.savedOff":
      "Saved configuration is kept locally and will not be used while off.",
    "settings.models.answerProvider.statusUnknown":
      "Jarvis has not reported answer service status yet.",
    "settings.models.answerProvider.configureAction":
      "Configure online answer service",
    "settings.models.answerProvider.providerType": "Service type",
    "settings.models.answerProvider.deepseekCompatible":
      "DeepSeek, compatible with OpenAI API format",
    "settings.models.answerProvider.serviceUrl": "Service address",
    "settings.models.answerProvider.modelId": "Model name",
    "settings.models.answerProvider.apiKey": "API key",
    "settings.models.answerProvider.apiKeyPlaceholder":
      "Enter a new key to save or replace it",
    "settings.models.answerProvider.keySaved": "Key saved securely",
    "settings.models.answerProvider.keyMissing": "Key not saved",
    "settings.models.answerProvider.save": "Save configuration",
    "settings.models.answerProvider.test": "Test connection",
    "settings.models.answerProvider.enable": "Enable",
    "settings.models.answerProvider.disable": "Turn off",
    "settings.models.answerProvider.replaceKey": "Replace key",
    "settings.models.answerProvider.delete": "Delete configuration",
    "settings.models.answerProvider.deleteTitle":
      "Delete online answer service?",
    "settings.models.answerProvider.deleteDescription":
      "This only removes the online answer service configuration and key for this profile.",
    "settings.models.answerProvider.deleteConfirm": "Delete",
    "settings.models.answerProvider.cancel": "Cancel",
    "settings.models.answerProvider.testNotice":
      "Testing sends one minimal request to the configured service.",
    "settings.models.answerProvider.saveNoNetwork":
      "Saving does not test the connection or send a request.",
    "settings.models.answerProvider.validationServiceUrl":
      "Use the supported HTTPS service address without query or fragment.",
    "settings.models.answerProvider.validationModelId":
      "Use the supported model name without spaces or control characters.",
    "settings.models.answerProvider.validationApiKey":
      "Enter the new API key before saving or replacing it.",
    "settings.models.answerProvider.test.not_tested": "Not tested",
    "settings.models.answerProvider.test.testing": "Testing",
    "settings.models.answerProvider.test.success": "Connection verified",
    "settings.models.answerProvider.test.authentication_failed":
      "Authentication failed",
    "settings.models.answerProvider.test.access_forbidden": "Access forbidden",
    "settings.models.answerProvider.test.rate_limited": "Rate limited",
    "settings.models.answerProvider.test.model_not_found": "Model not found",
    "settings.models.answerProvider.test.endpoint_unreachable":
      "Service unreachable",
    "settings.models.answerProvider.test.provider_timeout": "Timed out",
    "settings.models.answerProvider.test.malformed_response":
      "Unexpected response",
    "settings.models.answerProvider.test.tls_or_certificate_error":
      "Secure connection failed",
    "settings.models.answerProvider.test.unknown_failure":
      "Could not verify connection",
    "settings.models.localModels.label": "Local models",
    "settings.models.localModels.description":
      "Shows installed, selected, and ready local model states from the existing model service.",
    "settings.models.localModels.refresh": "Refresh model status",
    "settings.models.localModels.openOperations": "Open model tasks",
    "settings.models.localModels.noOperations": "No model tasks are running",
    "settings.models.localModels.notInstalled": "No local models installed",
    "settings.models.localModels.installed": "Local model installed",
    "settings.models.localModels.ready": "Local model ready",
    "settings.models.localModels.installedCount": "Installed on this device",
    "settings.models.localModels.installableCount": "Installable models",
    "settings.models.localModels.selectedCount": "Selected models",
    "settings.models.localModels.readyCount": "Ready now",
    "settings.models.localModels.unavailableCount": "Unavailable local models",
    "settings.models.localModels.busy": "A local model task is active",
    "settings.models.routingPolicy.label": "Routing policy",
    "settings.models.routingPolicy.description":
      "Shows the product-level answer method without exposing advanced routing details.",
    "settings.models.routingPolicy.safeSummary":
      "Safety and approval checks are unchanged.",
    "settings.models.routingPolicy.localRules": "Current answer method: local rules",
    "settings.models.routingPolicy.safety":
      "Safety and confirmation rules stay independent.",
    "settings.models.routingPolicy.localModel": "Current answer method: local model",
    "settings.models.routingPolicy.onlineService":
      "Current answer method: online service",
    "settings.models.routingPolicy.notConfigured":
      "Current answer method: not configured",
    "settings.models.cloudLocalStatus.label": "Answer service and local status",
    "settings.models.cloudLocalStatus.description":
      "Separates local model readiness from online answer service configuration. Opening this page does not connect online services.",
    "settings.models.cloudLocalStatus.localProviders": "Local services",
    "settings.models.cloudLocalStatus.cloudProviders": "Online services",
    "settings.models.cloudLocalStatus.resourceLeases": "Running model tasks",
    "settings.models.status.localRulesEnabled": "Local rules enabled",
    "settings.models.status.localRulesOff": "Command routing off",
    "settings.models.status.localRoutingUnavailable": "Local routing unavailable",
    "settings.models.status.defaultCommandRouting": "Default command routing",
    "settings.models.status.missing": "Missing",
    "settings.models.status.installed": "Installed",
    "settings.models.status.selected": "Selected",
    "settings.models.status.loaded": "Loaded",
    "settings.models.status.currentlyNotLoaded": "Currently not loaded",
    "settings.models.status.available": "Available",
    "settings.models.status.unavailable": "Unavailable",
    "settings.models.status.unconfigured": "Not configured",
    "settings.models.status.degraded": "Degraded",
    "settings.models.status.notVerified": "Not verified",
    "settings.models.status.noNetworkOnOpen":
      "Opening this page does not connect online services or load, download, or delete models.",
    "settings.tools.title": "Tools & Plugins",
    "settings.tools.description":
      "Review desktop actions, safe website access, read-only file search, plugins, and external tool readiness.",
    "settings.tools.section.automation": "Tools and automation",
    "settings.tools.section.apps": "Approved apps",
    "settings.tools.section.websites": "Safe website access",
    "settings.tools.section.files": "File search",
    "settings.tools.section.plugins": "Plugins",
    "settings.tools.section.mcp": "External tool connections",
    "settings.tools.automation.label": "Automation safeguards",
    "settings.tools.automation.description":
      "Desktop actions remain controlled by Jarvis safety and confirmation checks.",
    "settings.tools.automation.guarded": "Guarded by safety checks",
    "settings.tools.automation.confirmation":
      "Higher-risk actions still require confirmation.",
    "settings.tools.automation.noRunOnOpen":
      "Tool actions still start only from explicit user requests.",
    "settings.tools.approvedApps.label": "Approved app openings",
    "settings.tools.approvedApps.description":
      "App opening uses the existing approved-app policy and does not expose system paths here.",
    "settings.tools.approvedApps.managed": "Managed by safety policy",
    "settings.tools.approvedApps.confirmation":
      "Unknown or unsupported apps are not opened from this page.",
    "settings.tools.approvedApps.noLaunchOnOpen":
      "App launches still require a separate command and safety gate.",
    "settings.tools.safeWebsites.label": "Safe website openings",
    "settings.tools.safeWebsites.description":
      "Website opening keeps the existing confirmation behavior for unknown destinations.",
    "settings.tools.safeWebsites.confirmFirst": "Unknown websites ask first",
    "settings.tools.safeWebsites.noBrowserOnOpen":
      "Website openings still require a separate command.",
    "settings.tools.safeWebsites.unknownAsk":
      "New website requests stay behind confirmation.",
    "settings.tools.fileSearch.label": "Local file search",
    "settings.tools.fileSearch.description":
      "File search remains read-only and only returns safe result summaries.",
    "settings.tools.fileSearch.readOnly": "Read-only",
    "settings.tools.fileSearch.filenameOnly": "Filename-focused results",
    "settings.tools.fileSearch.noScanOnOpen":
      "Search starts only after a separate user request.",
    "settings.tools.plugins.label": "Plugins",
    "settings.tools.plugins.description":
      "Plugins available to you will appear here.",
    "settings.tools.plugins.action": "Open plugin management",
    "settings.tools.plugins.noneInstalled": "No plugins installed",
    "settings.tools.plugins.noProductPlugins":
      "No plugins are currently available.",
    "settings.tools.plugins.installed": "installed",
    "settings.tools.plugins.productInstalled": "Installed plugins",
    "settings.tools.plugins.enabled": "enabled",
    "settings.tools.plugins.productEnabled": "Enabled plugins",
    "settings.tools.plugins.availableForUse": "Ready for safe use",
    "settings.tools.plugins.readOnly": "Read-only plugins",
    "settings.tools.plugins.developerExamplesHidden":
      "Some plugins are not shown here.",
    "settings.tools.plugins.thirdPartyDisabled":
      "Third-party code stays disabled by default.",
    "settings.tools.plugins.noMarketplace":
      "Marketplace access has not been used.",
    "settings.tools.plugins.statusUnknown":
      "Plugin status has not been reported yet.",
    "settings.tools.plugins.refreshNeeded":
      "Refresh plugin management to read the latest local status.",
    "settings.tools.mcp.label": "External tool connections",
    "settings.tools.mcp.description":
      "Opening this page does not connect to external tools.",
    "settings.tools.mcp.unavailable": "Not available yet",
    "settings.tools.mcp.available": "Available",
    "settings.tools.mcp.statusUnknown":
      "Connection status has not been reported yet.",
    "settings.tools.mcp.notConnected": "No connection is active.",
    "settings.tools.mcp.noAutoConnect":
      "Opening this page does not connect to external tools.",
    "settings.tools.mcp.noExternalRun":
      "Connections are not available yet.",
    "settings.tools.mcp.userControlled":
      "Connections remain user controlled.",
    "settings.tools.safeViewing.title": "Safe viewing",
    "settings.tools.status.noExecutionOnOpen":
      "Opening or viewing this page does not run tools, launch apps, open websites, search files, invoke plugins, or connect external tools. Some plugins and external tools may use non-local connections only after separate setup and confirmation.",
    "settings.memory.title": "Memory & Privacy",
    "settings.memory.description":
      "Review what Jarvis can remember, where saved information stays, and how to manage existing saved information.",
    "settings.memory.section.personal": "Personal memory",
    "settings.memory.section.saved": "Saved information",
    "settings.memory.section.storage": "Storage and sync",
    "settings.memory.safeViewing.title": "Safe viewing",
    "settings.memory.safeViewing.notice":
      "Opening this page does not read full conversation content, call a model, connect to online services, or start the microphone.",
    "settings.memory.personalMemory.label": "Personal memory features",
    "settings.memory.personalMemory.description":
      "Jarvis can use saved information to provide a more personalized experience.",
    "settings.memory.personalMemory.available": "Available",
    "settings.memory.personalMemory.notEnabled": "Not currently enabled",
    "settings.memory.personalMemory.unavailable":
      "Personal memory status is unavailable",
    "settings.memory.personalMemory.statusUnavailable":
      "Jarvis cannot confirm personal memory status right now.",
    "settings.memory.personalMemory.disabledDetail":
      "Jarvis is not adding new personal memory through this feature.",
    "settings.memory.personalMemory.newMessagesOnly":
      "When available, it is limited to newly accepted user messages.",
    "settings.memory.personalMemory.noRecallOnOpen":
      "Opening this page does not search saved information.",
    "settings.memory.savedInformation.label": "Manage saved information",
    "settings.memory.savedInformation.description":
      "View or delete information saved by Jarvis.",
    "settings.memory.savedInformation.manageValue": "Manage",
    "settings.memory.savedInformation.action": "Manage saved information",
    "settings.memory.savedInformation.shortcuts": "Saved shortcuts",
    "settings.memory.savedInformation.voiceCorrections":
      "Saved voice corrections",
    "settings.memory.savedInformation.responsePreferences":
      "Saved response preferences",
    "settings.memory.savedInformation.deleteInMemoryCenter":
      "Use Memory Center to view or delete saved information.",
    "settings.memory.storage.label": "Local storage and cloud sync",
    "settings.memory.storage.description":
      "Saved information stays on this device unless a connected feature says otherwise.",
    "settings.memory.storage.localValue": "Stored on this device",
    "settings.memory.storage.localData":
      "Saved information is stored in this app's local data.",
    "settings.memory.storage.cloudSyncOff": "Cloud sync is not currently enabled.",
    "settings.notifications.title": "Notifications",
    "settings.notifications.description":
      "Review the notification behavior Jarvis currently supports. Opening this page does not send notifications or request Windows permission.",
    "settings.notifications.section.safeViewing": "Safe viewing",
    "settings.notifications.section.current": "Current notification features",
    "settings.notifications.section.inApp": "In-app status messages",
    "settings.notifications.section.tray": "Tray reminder",
    "settings.notifications.section.privacy": "Privacy",
    "settings.notifications.safeViewing.label": "Safe viewing",
    "settings.notifications.safeViewing.description":
      "Opening this page does not send a notification, request Windows permission, play a sound, or start voice playback.",
    "settings.notifications.currentFeatures.label": "Current notification features",
    "settings.notifications.currentFeatures.description":
      "Full Windows notification settings are not available yet.",
    "settings.notifications.currentFeatures.limited": "Limited",
    "settings.notifications.currentFeatures.noFullWindowsSettings":
      "Jarvis does not provide full Windows notification settings yet.",
    "settings.notifications.inAppStatus.label": "In-app status messages",
    "settings.notifications.inAppStatus.description":
      "Jarvis can show action status and result messages inside the app.",
    "settings.notifications.inAppStatus.available":
      "Available while Jarvis is open",
    "settings.notifications.trayReminder.label": "Tray reminder",
    "settings.notifications.trayReminder.description":
      "Jarvis may show a short one-time reminder when the window closes and the app continues running in the system tray.",
    "settings.notifications.trayReminder.mayAppearOnce": "May appear once",
    "settings.notifications.privacy.label": "Notification privacy",
    "settings.notifications.privacy.description":
      "Notifications should avoid full conversations, file paths, and other sensitive content.",
    "settings.notifications.keywords.notifications": "notifications",
    "settings.notifications.keywords.inApp": "in-app messages",
    "settings.notifications.keywords.status": "status messages",
    "settings.notifications.keywords.tray": "tray reminder",
    "settings.notifications.keywords.windows": "Windows notifications",
    "settings.notifications.keywords.privacy": "privacy",
    "settings.notifications.keywords.sensitive": "sensitive content",
    "settings.about.title": "About & Updates",
    "settings.about.description":
      "Review the installed Jarvis-K version and the update options currently available.",
    "settings.about.section.product": "Product information",
    "settings.about.section.updates": "Updates",
    "settings.about.productName.label": "Product name",
    "settings.about.productName.description": "Shows the trusted product name.",
    "settings.about.version.label": "Version",
    "settings.about.version.description":
      "Shows the installed Jarvis-K application version.",
    "settings.about.updates.label": "In-app updates",
    "settings.about.updates.description":
      "This Alpha does not support in-app updates.",
    "settings.about.updates.notAvailable": "Not available in this Alpha",
    "settings.about.safeViewing.label": "Safe viewing",
    "settings.about.safeViewing.description":
      "Opening this page does not check for updates, access the network, open external links, export logs, write to the clipboard, or restart Jarvis.",
    "settings.about.keywords.about": "about",
    "settings.about.keywords.update": "updates",
    "settings.about.keywords.version": "version",
    "settings.common.currentValue": "Current value",
    "settings.common.close": "Close",
    "settings.common.cancel": "Cancel",
    "settings.common.done": "Done",
    "settings.search.results": "results",
    "settings.search.noResultsTitle": "No matching settings",
    "settings.search.noResultsDescription":
      "Search currently covers General, Appearance & Pet, Voice & Audio, Models & Intelligence, Tools & Plugins, Memory & Privacy, Notifications, and About & Updates settings.",
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
  },
  zh: {
    "settings.shell.title": "Jarvis 控制中心",
    "settings.shell.description":
      "管理这台设备上的 Jarvis 设置。",
    "settings.shell.search": "搜索设置",
    "settings.shell.category": "设置分类",
    "settings.shell.useClassic": "使用旧版设置",
    "settings.shell.useClassicDescription":
      "仅在本次运行中切换，不会更改你的设置。",
    "settings.shell.notMigratedTitle": "此区域暂不可用",
    "settings.shell.notMigratedDescription":
      "本次运行中可使用旧版设置处理这部分内容。",
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
      "管理界面语言、窗口关闭方式和登录后启动。",
    "settings.general.section.interface": "界面",
    "settings.general.section.desktop": "桌面行为",
    "settings.general.displayLanguage.label": "界面语言",
    "settings.general.displayLanguage.description":
      "选择 Jarvis 设置中使用的显示语言。",
    "settings.general.displayLanguage.action": "选择界面语言",
    "settings.general.displayLanguage.dialogTitle": "选择界面语言",
    "settings.general.displayLanguage.dialogDescription":
      "此设置会立即应用到 Jarvis 设置，并沿用现有应用语言偏好。",
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
      "仅在打包后的 Alpha 或 Stable 应用中可用。",
    "settings.general.launchAtLogin.retry": "重试",
    "settings.appearance.title": "外观与桌宠",
    "settings.appearance.description":
      "设置 Jarvis 的界面配色、桌宠显示方式、动效和当前皮肤摘要。",
    "settings.appearance.section.theme": "主题",
    "settings.appearance.section.pet": "桌宠",
    "settings.appearance.section.skin": "桌宠皮肤",
    "settings.appearance.theme.label": "界面主题",
    "settings.appearance.theme.description":
      "选择桌面界面使用的 Jarvis 内置视觉主题。",
    "settings.appearance.theme.action": "选择主题",
    "settings.appearance.theme.dialogTitle": "选择界面主题",
    "settings.appearance.theme.dialogDescription":
      "主题会通过桌面设置保存，之后可以随时更改。",
    "settings.appearance.theme.previewTitle": "主题效果",
    "settings.appearance.theme.previewDescription":
      "展示文字、边框和 Jarvis 强调色的组合效果。",
    "settings.theme.signal.label": "Signal",
    "settings.theme.signal.description": "深色控制台风格，使用青蓝色 Jarvis 强调色。",
    "settings.theme.harbor.label": "Harbor",
    "settings.theme.harbor.description": "浅色工作区风格，对比克制、适合日常使用。",
    "settings.theme.ember.label": "Ember",
    "settings.theme.ember.description": "暖色深色专注模式，适合夜间工作。",
    "settings.pet.show.label": "显示桌宠",
    "settings.pet.show.description": "在桌面上显示小型 Jarvis 伙伴窗口。",
    "settings.pet.keepOnTop.label": "桌宠保持置顶",
    "settings.pet.keepOnTop.description":
      "让桌宠位于普通窗口上方，但不会改变命令权限。",
    "settings.pet.reducedMotion.label": "桌宠动效",
    "settings.pet.reducedMotion.description":
      "使用现有动效设置控制桌宠动画强度。",
    "settings.pet.reducedMotion.system": "跟随系统",
    "settings.pet.reducedMotion.on": "减少动效",
    "settings.pet.reducedMotion.off": "完整动效",
    "settings.pet.resetPosition.label": "将桌宠移回默认位置",
    "settings.pet.resetPosition.description":
      "将桌宠移动回默认的安全角落。",
    "settings.pet.resetPosition.action": "移回默认位置",
    "settings.pet.status.enabled": "已显示",
    "settings.pet.status.disabled": "已隐藏",
    "settings.pet.status.motionSystem": "跟随系统偏好",
    "settings.pet.status.motionReduced": "减少动效",
    "settings.pet.status.motionFull": "完整动效",
    "settings.skin.current.label": "当前桌宠皮肤",
    "settings.skin.current.description": "查看当前桌宠皮肤的安全摘要。",
    "settings.skin.status.builtIn": "内置机器人",
    "settings.skin.status.local": "本地已安装皮肤",
    "settings.skin.status.healthy": "可用",
    "settings.skin.status.recovered": "已回退到安全皮肤",
    "settings.skin.status.notLoaded": "未加载",
    "settings.skin.empty.title": "当前未启用本地皮肤",
    "settings.skin.empty.description": "Jarvis 正在使用内置机器人作为安全回退。",
    "settings.skin.manage.description": "本地皮肤导入和编辑仍保留在现有安全管理流程中。",
    "settings.skin.manage.action": "刷新皮肤状态",
    "settings.voice.title": "语音与音频",
    "settings.voice.description":
      "查看语音识别、麦克风权限、按住说话、语音播报和唤醒词可用状态。",
    "settings.voice.section.provider": "语音识别",
    "settings.voice.section.capture": "麦克风与采集",
    "settings.voice.section.output": "语音播报",
    "settings.voice.section.wake": "唤醒词",
    "settings.voice.provider.label": "语音识别服务",
    "settings.voice.provider.description":
      "语音服务凭据在安全设置中管理。",
    "settings.voice.provider.action": "配置语音识别",
    "settings.voice.provider.configured": "凭据已保存在本机",
    "settings.voice.provider.notConfigured": "未配置",
    "settings.voice.provider.secureStorageUnavailable":
      "安全凭据存储不可用",
    "settings.voice.provider.connectionNotChecked":
      "此页面不会检查云端连接",
    "settings.voice.provider.language.label": "识别语言",
    "settings.voice.provider.language.chinese": "中文",
    "settings.voice.provider.language.english": "英文",
    "settings.voice.provider.availableAfterSetup": "配置服务后可用",
    "settings.voice.captureMode.label": "语音输入状态",
    "settings.voice.captureMode.description":
      "只显示当前语音输入状态，不会开始录音。",
    "settings.voice.captureMode.disabled": "关闭",
    "settings.voice.captureMode.pushToTalk": "按住说话",
    "settings.voice.captureMode.continuous": "连续监听",
    "settings.voice.microphone.label": "麦克风权限",
    "settings.voice.microphone.description":
      "只显示 Windows 权限状态。打开此页面不会申请麦克风权限。",
    "settings.voice.microphone.unknown": "尚未请求",
    "settings.voice.microphone.prompt": "开始语音输入时再询问",
    "settings.voice.microphone.granted": "已允许",
    "settings.voice.microphone.denied": "已被 Windows 阻止",
    "settings.voice.pushToTalk.label": "按住说话输入",
    "settings.voice.pushToTalk.description":
      "前往语音页面，手动开始一次语音输入。",
    "settings.voice.pushToTalk.available": "可在语音页面使用",
    "settings.voice.pushToTalk.unavailable": "语音输入可用时可使用",
    "settings.voice.pushToTalk.action": "打开语音页面",
    "settings.voice.tts.label": "语音播报服务",
    "settings.voice.tts.description":
      "语音播报继续使用现有安全播报配置。",
    "settings.voice.tts.action": "打开播报设置",
    "settings.voice.tts.configured": "凭据已保存在本机",
    "settings.voice.tts.notConfigured": "未配置",
    "settings.voice.tts.secureStorageUnavailable": "安全凭据存储不可用",
    "settings.voice.tts.voiceConfigured": "已选择播报声音",
    "settings.voice.tts.defaultVoice": "默认声音",
    "settings.voice.tts.availableAfterSetup": "配置服务后可用",
    "settings.voice.wakeWord.label": "唤醒词",
    "settings.voice.wakeWord.description":
      "唤醒词在此页面保持只读，当前暂不支持。",
    "settings.voice.wakeWord.unavailable": "当前暂不支持",
    "settings.voice.privacy.localOnly":
      "此页面只读取本机状态，不会连接在线服务、启动麦克风或上传数据。",
    "settings.models.title": "模型与智能",
    "settings.models.description":
      "查看命令理解、在线回答服务、本地模型和当前回答方式。打开本页不会加载模型，也不会连接在线服务。",
    "settings.models.section.command": "快速命令理解",
    "settings.models.section.answer": "回答服务",
    "settings.models.section.local": "本地模型",
    "settings.models.section.routing": "路由与可用性",
    "settings.models.fastCommand.label": "快速命令理解",
    "settings.models.fastCommand.description":
      "选择快速命令是否优先使用现有本地规则。开启此项不会启动本地模型或在线服务。",
    "settings.models.fastCommand.localRules": "当前优先使用本地规则。",
    "settings.models.fastCommand.action": "本地规则模式",
    "settings.models.fastCommand.defaultRoute": "使用现有默认命令路由。",
    "settings.models.fastCommand.statusUnknown": "Jarvis 尚未报告命令路由状态。",
    "settings.models.fastCommand.statusUnavailable": "当前运行环境暂不可使用命令路由。",
    "settings.models.answerProvider.label": "在线回答服务",
    "settings.models.answerProvider.description":
      "选择 Jarvis 是否可以在安全配置和运行门槛就绪后使用现有在线回答路径。",
    "settings.models.answerProvider.notConfigured": "未配置",
    "settings.models.answerProvider.configuredNotVerified":
      "配置已保存在本机，尚未验证连接",
    "settings.models.answerProvider.secureStorageUnavailable":
      "安全凭据存储不可用",
    "settings.models.answerProvider.enabled": "已开启",
    "settings.models.answerProvider.disabled": "关闭",
    "settings.models.answerProvider.allowedNeedsSetup": "已允许，但尚未配置服务",
    "settings.models.answerProvider.setupRequired": "需要先配置在线回答服务，之后才能回答。",
    "settings.models.answerProvider.cannotUse": "当前设备无法使用已保存的在线服务凭据。",
    "settings.models.answerProvider.available": "可用",
    "settings.models.answerProvider.verified": "当前安全运行门槛显示可以使用。",
    "settings.models.answerProvider.allowedNotReady":
      "已允许，但本次会话尚未确认在线服务可用。",
    "settings.models.answerProvider.configuredOff": "已保存配置，服务关闭",
    "settings.models.answerProvider.savedOff": "配置保存在本机，关闭时不会被使用。",
    "settings.models.answerProvider.statusUnknown": "Jarvis 尚未报告回答服务状态。",
    "settings.models.answerProvider.configureAction": "配置在线回答服务",
    "settings.models.answerProvider.providerType": "服务类型",
    "settings.models.answerProvider.deepseekCompatible":
      "DeepSeek，兼容 OpenAI 接口格式",
    "settings.models.answerProvider.serviceUrl": "服务地址",
    "settings.models.answerProvider.modelId": "模型名称",
    "settings.models.answerProvider.apiKey": "API 密钥",
    "settings.models.answerProvider.apiKeyPlaceholder":
      "输入新密钥以保存或替换",
    "settings.models.answerProvider.keySaved": "密钥已安全保存",
    "settings.models.answerProvider.keyMissing": "尚未保存密钥",
    "settings.models.answerProvider.save": "保存配置",
    "settings.models.answerProvider.test": "测试连接",
    "settings.models.answerProvider.enable": "启用",
    "settings.models.answerProvider.disable": "停用",
    "settings.models.answerProvider.replaceKey": "替换密钥",
    "settings.models.answerProvider.delete": "删除配置",
    "settings.models.answerProvider.deleteTitle": "删除在线回答服务？",
    "settings.models.answerProvider.deleteDescription":
      "只会删除当前配置档中的在线回答服务配置和密钥，不会删除对话、记忆、插件或其他服务数据。",
    "settings.models.answerProvider.deleteConfirm": "删除",
    "settings.models.answerProvider.cancel": "取消",
    "settings.models.answerProvider.testNotice":
      "测试连接会向所配置的服务发送一次最小请求。",
    "settings.models.answerProvider.saveNoNetwork":
      "保存配置不会测试连接，也不会发送请求。",
    "settings.models.answerProvider.validationServiceUrl":
      "请输入受支持的 HTTPS 服务地址，不带查询或片段。",
    "settings.models.answerProvider.validationModelId":
      "请输入受支持的模型名称，不包含空格或控制字符。",
    "settings.models.answerProvider.validationApiKey":
      "请先输入新的 API 密钥。",
    "settings.models.answerProvider.test.not_tested": "尚未测试",
    "settings.models.answerProvider.test.testing": "测试中",
    "settings.models.answerProvider.test.success": "连接已验证",
    "settings.models.answerProvider.test.authentication_failed": "认证失败",
    "settings.models.answerProvider.test.access_forbidden": "无权访问",
    "settings.models.answerProvider.test.rate_limited": "请求受限",
    "settings.models.answerProvider.test.model_not_found": "未找到模型",
    "settings.models.answerProvider.test.endpoint_unreachable": "服务无法连接",
    "settings.models.answerProvider.test.provider_timeout": "连接超时",
    "settings.models.answerProvider.test.malformed_response": "响应格式异常",
    "settings.models.answerProvider.test.tls_or_certificate_error":
      "安全连接失败",
    "settings.models.answerProvider.test.unknown_failure": "无法验证连接",
    "settings.models.localModels.label": "本地模型",
    "settings.models.localModels.description":
      "从现有模型服务读取本机安装、已选择和当前就绪状态。",
    "settings.models.localModels.refresh": "刷新模型状态",
    "settings.models.localModels.openOperations": "查看模型任务",
    "settings.models.localModels.noOperations": "当前没有运行中的模型任务",
    "settings.models.localModels.notInstalled": "未安装本地模型",
    "settings.models.localModels.installed": "本地模型已安装",
    "settings.models.localModels.ready": "本地模型已就绪",
    "settings.models.localModels.installedCount": "本机已安装",
    "settings.models.localModels.installableCount": "可安装模型",
    "settings.models.localModels.selectedCount": "已选择模型",
    "settings.models.localModels.readyCount": "当前已就绪",
    "settings.models.localModels.unavailableCount": "暂不可用的本地模型",
    "settings.models.localModels.busy": "有本地模型任务正在进行",
    "settings.models.routingPolicy.label": "路由策略",
    "settings.models.routingPolicy.description":
      "显示面向用户的当前回答方式，不展示高级路由细节。",
    "settings.models.routingPolicy.safeSummary": "安全和确认规则保持不变。",
    "settings.models.routingPolicy.localRules": "当前回答方式：本地规则",
    "settings.models.routingPolicy.safety": "安全和确认规则保持独立生效。",
    "settings.models.routingPolicy.localModel": "当前回答方式：本地模型",
    "settings.models.routingPolicy.onlineService": "当前回答方式：在线服务",
    "settings.models.routingPolicy.notConfigured": "当前回答方式：尚未配置",
    "settings.models.cloudLocalStatus.label": "回答服务与本地状态",
    "settings.models.cloudLocalStatus.description":
      "区分本地模型就绪状态和在线回答服务配置。打开本页不会连接在线服务。",
    "settings.models.cloudLocalStatus.localProviders": "本地服务提供方",
    "settings.models.cloudLocalStatus.cloudProviders": "在线服务提供方",
    "settings.models.cloudLocalStatus.resourceLeases": "运行中的模型任务",
    "settings.models.status.localRulesEnabled": "本地规则已启用",
    "settings.models.status.localRulesOff": "命令路由关闭",
    "settings.models.status.localRoutingUnavailable": "本地路由暂不可用",
    "settings.models.status.defaultCommandRouting": "默认命令路由",
    "settings.models.status.missing": "未安装",
    "settings.models.status.installed": "已安装",
    "settings.models.status.selected": "已选择",
    "settings.models.status.loaded": "已加载",
    "settings.models.status.currentlyNotLoaded": "当前未加载",
    "settings.models.status.available": "可用",
    "settings.models.status.unavailable": "不可用",
    "settings.models.status.unconfigured": "未配置",
    "settings.models.status.degraded": "降级",
    "settings.models.status.notVerified": "尚未验证",
    "settings.models.status.noNetworkOnOpen":
      "打开此页面不会连接在线服务，也不会加载、下载或删除模型。",
    "settings.tools.title": "工具与插件",
    "settings.tools.description":
      "查看桌面操作、安全网站访问、只读文件搜索、插件和外部工具状态。",
    "settings.tools.section.automation": "工具与自动化",
    "settings.tools.section.apps": "已批准应用",
    "settings.tools.section.websites": "安全网站访问",
    "settings.tools.section.files": "文件搜索",
    "settings.tools.section.plugins": "插件",
    "settings.tools.section.mcp": "外部工具连接",
    "settings.tools.automation.label": "自动化安全保护",
    "settings.tools.automation.description":
      "桌面操作继续受 Jarvis 的安全检查和确认规则保护。",
    "settings.tools.automation.guarded": "受安全检查保护",
    "settings.tools.automation.confirmation": "风险较高的操作仍需要确认。",
    "settings.tools.automation.noRunOnOpen": "工具操作只会从明确的用户请求开始。",
    "settings.tools.approvedApps.label": "已批准的应用打开",
    "settings.tools.approvedApps.description":
      "应用打开继续使用现有已批准应用规则，本页不显示系统路径。",
    "settings.tools.approvedApps.managed": "由安全规则管理",
    "settings.tools.approvedApps.confirmation":
      "未知或不支持的应用不会从本页打开。",
    "settings.tools.approvedApps.noLaunchOnOpen": "应用启动仍需要单独命令和安全检查。",
    "settings.tools.safeWebsites.label": "安全网站打开",
    "settings.tools.safeWebsites.description":
      "网站打开继续沿用未知目标先确认的规则。",
    "settings.tools.safeWebsites.confirmFirst": "未知网站会先询问",
    "settings.tools.safeWebsites.noBrowserOnOpen": "网站打开仍需要单独命令。",
    "settings.tools.safeWebsites.unknownAsk": "新网站请求仍需要确认。",
    "settings.tools.fileSearch.label": "本机文件搜索",
    "settings.tools.fileSearch.description":
      "文件搜索保持只读，只返回安全的结果摘要。",
    "settings.tools.fileSearch.readOnly": "只读",
    "settings.tools.fileSearch.filenameOnly": "以文件名结果为主",
    "settings.tools.fileSearch.noScanOnOpen":
      "搜索只会在用户单独请求后开始。",
    "settings.tools.plugins.label": "插件",
    "settings.tools.plugins.description":
      "这里会显示可供你使用的插件。",
    "settings.tools.plugins.action": "打开插件管理",
    "settings.tools.plugins.noneInstalled": "未安装插件",
    "settings.tools.plugins.noProductPlugins": "目前没有可供使用的插件。",
    "settings.tools.plugins.installed": "已安装",
    "settings.tools.plugins.productInstalled": "已安装插件",
    "settings.tools.plugins.enabled": "已启用",
    "settings.tools.plugins.productEnabled": "已启用插件",
    "settings.tools.plugins.availableForUse": "可安全使用",
    "settings.tools.plugins.readOnly": "只读插件",
    "settings.tools.plugins.developerExamplesHidden":
      "部分插件不会显示在这里。",
    "settings.tools.plugins.thirdPartyDisabled":
      "第三方代码默认保持关闭。",
    "settings.tools.plugins.noMarketplace": "尚未使用插件市场访问。",
    "settings.tools.plugins.statusUnknown": "尚未读取插件状态。",
    "settings.tools.plugins.refreshNeeded":
      "刷新插件管理后可读取最新本机状态。",
    "settings.tools.mcp.label": "外部工具连接",
    "settings.tools.mcp.description":
      "打开本页不会连接外部工具。",
    "settings.tools.mcp.unavailable": "当前暂不可用",
    "settings.tools.mcp.available": "可用",
    "settings.tools.mcp.statusUnknown": "尚未读取连接状态。",
    "settings.tools.mcp.notConnected": "当前没有活动连接。",
    "settings.tools.mcp.noAutoConnect": "打开此页面不会建立外部工具连接。",
    "settings.tools.mcp.noExternalRun": "当前暂不支持连接。",
    "settings.tools.mcp.userControlled": "连接仍由用户控制。",
    "settings.tools.safeViewing.title": "安全查看",
    "settings.tools.status.noExecutionOnOpen":
      "打开或查看本页不会运行工具、启动应用、打开网站、搜索文件、调用插件或连接外部工具。部分插件和外部工具可能在单独设置和确认后使用非本机连接。",
    "settings.memory.title": "记忆与隐私",
    "settings.memory.description":
      "查看 Jarvis 是否会记住信息、已保存的信息放在哪里，以及如何管理现有保存内容。",
    "settings.memory.section.personal": "个性化记忆",
    "settings.memory.section.saved": "已保存的信息",
    "settings.memory.section.storage": "存储与同步",
    "settings.memory.safeViewing.title": "安全查看",
    "settings.memory.safeViewing.notice":
      "打开本页不会读取完整对话内容、调用模型、连接在线服务或启动麦克风。",
    "settings.memory.personalMemory.label": "个性化记忆功能",
    "settings.memory.personalMemory.description":
      "Jarvis 可以使用已保存的信息，为你提供更符合习惯的体验。",
    "settings.memory.personalMemory.available": "可用",
    "settings.memory.personalMemory.notEnabled": "当前未启用",
    "settings.memory.personalMemory.unavailable": "状态暂不可用",
    "settings.memory.personalMemory.statusUnavailable":
      "Jarvis 现在无法确认个性化记忆状态。",
    "settings.memory.personalMemory.disabledDetail":
      "Jarvis 当前不会通过此功能新增个性化记忆。",
    "settings.memory.personalMemory.newMessagesOnly":
      "功能可用时，仅限新确认的用户消息。",
    "settings.memory.personalMemory.noRecallOnOpen":
      "打开本页不会搜索已保存的信息。",
    "settings.memory.savedInformation.label": "管理已保存的信息",
    "settings.memory.savedInformation.description":
      "查看或删除 Jarvis 已保存的信息。",
    "settings.memory.savedInformation.manageValue": "管理",
    "settings.memory.savedInformation.action": "管理已保存的信息",
    "settings.memory.savedInformation.shortcuts": "已保存的快捷方式",
    "settings.memory.savedInformation.voiceCorrections": "已保存的语音修正",
    "settings.memory.savedInformation.responsePreferences": "已保存的回答偏好",
    "settings.memory.savedInformation.deleteInMemoryCenter":
      "你可以前往记忆中心查看或删除已保存的信息。",
    "settings.memory.storage.label": "本机保存与云端同步",
    "settings.memory.storage.description":
      "已保存的信息保存在这台设备上；如有功能需要联网，会另行说明。",
    "settings.memory.storage.localValue": "存放在这台设备上",
    "settings.memory.storage.localData": "已保存的信息存放在本机应用数据中。",
    "settings.memory.storage.cloudSyncOff": "当前未启用云端同步。",
    "settings.notifications.title": "通知",
    "settings.notifications.description":
      "查看 Jarvis 当前支持的通知行为。打开此页面不会发送通知，也不会请求 Windows 通知权限。",
    "settings.notifications.section.safeViewing": "安全查看",
    "settings.notifications.section.current": "当前通知功能",
    "settings.notifications.section.inApp": "应用内状态提示",
    "settings.notifications.section.tray": "托盘提醒",
    "settings.notifications.section.privacy": "隐私",
    "settings.notifications.safeViewing.label": "安全查看",
    "settings.notifications.safeViewing.description":
      "打开此页面不会发送通知、请求 Windows 权限、播放声音或启动语音播报。",
    "settings.notifications.currentFeatures.label": "当前通知功能",
    "settings.notifications.currentFeatures.description":
      "当前尚未提供完整的 Windows 通知设置。",
    "settings.notifications.currentFeatures.limited": "功能有限",
    "settings.notifications.currentFeatures.noFullWindowsSettings":
      "Jarvis 尚未提供完整的 Windows 通知设置。",
    "settings.notifications.inAppStatus.label": "应用内状态提示",
    "settings.notifications.inAppStatus.description":
      "Jarvis 可以在应用内显示操作状态和结果提示。",
    "settings.notifications.inAppStatus.available": "Jarvis 打开时可用",
    "settings.notifications.trayReminder.label": "托盘提醒",
    "settings.notifications.trayReminder.description":
      "关闭窗口并让 Jarvis 在系统托盘中继续运行时，可能会显示一次简短提醒。",
    "settings.notifications.trayReminder.mayAppearOnce": "可能显示一次",
    "settings.notifications.privacy.label": "通知隐私",
    "settings.notifications.privacy.description":
      "通知应避免显示完整对话、文件路径和其他敏感内容。",
    "settings.notifications.keywords.notifications": "通知",
    "settings.notifications.keywords.inApp": "应用内提示",
    "settings.notifications.keywords.status": "状态提示",
    "settings.notifications.keywords.tray": "托盘提醒",
    "settings.notifications.keywords.windows": "Windows 通知",
    "settings.notifications.keywords.privacy": "隐私",
    "settings.notifications.keywords.sensitive": "敏感内容",
    "settings.about.title": "关于与更新",
    "settings.about.description":
      "查看当前安装的 Jarvis-K 版本和本版本可用的更新方式。",
    "settings.about.section.product": "产品信息",
    "settings.about.section.updates": "更新",
    "settings.about.productName.label": "产品名称",
    "settings.about.productName.description": "显示可信的产品名称。",
    "settings.about.version.label": "版本",
    "settings.about.version.description":
      "显示当前安装的 Jarvis-K 应用版本。",
    "settings.about.updates.label": "应用内更新",
    "settings.about.updates.description": "当前 Alpha 不支持应用内更新。",
    "settings.about.updates.notAvailable": "当前 Alpha 暂不可用",
    "settings.about.safeViewing.label": "安全查看",
    "settings.about.safeViewing.description":
      "打开此页面不会检查更新、访问网络、打开外部链接、导出日志、写入剪贴板或重启 Jarvis。",
    "settings.about.keywords.about": "关于",
    "settings.about.keywords.update": "更新",
    "settings.about.keywords.version": "版本",
    "settings.common.currentValue": "当前值",
    "settings.common.close": "关闭",
    "settings.common.cancel": "取消",
    "settings.common.done": "完成",
    "settings.search.results": "条结果",
    "settings.search.noResultsTitle": "没有匹配的设置",
    "settings.search.noResultsDescription":
      "当前可搜索通用、外观与桌宠、语音与音频、模型与智能、工具与插件、记忆与隐私、通知、关于与更新设置。",
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
