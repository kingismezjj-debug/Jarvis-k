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
  | "settings.models.answerProvider.label"
  | "settings.models.answerProvider.description"
  | "settings.models.answerProvider.notConfigured"
  | "settings.models.answerProvider.configuredNotVerified"
  | "settings.models.answerProvider.secureStorageUnavailable"
  | "settings.models.answerProvider.enabled"
  | "settings.models.answerProvider.disabled"
  | "settings.models.localModels.label"
  | "settings.models.localModels.description"
  | "settings.models.localModels.refresh"
  | "settings.models.localModels.openOperations"
  | "settings.models.localModels.noOperations"
  | "settings.models.routingPolicy.label"
  | "settings.models.routingPolicy.description"
  | "settings.models.routingPolicy.safeSummary"
  | "settings.models.cloudLocalStatus.label"
  | "settings.models.cloudLocalStatus.description"
  | "settings.models.cloudLocalStatus.localProviders"
  | "settings.models.cloudLocalStatus.cloudProviders"
  | "settings.models.cloudLocalStatus.resourceLeases"
  | "settings.models.status.localRulesEnabled"
  | "settings.models.status.localRulesOff"
  | "settings.models.status.localRoutingUnavailable"
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
    "settings.shell.title": "Jarvis Control Center",
    "settings.shell.description":
      "General, Appearance & Pet, Voice & Audio, and Models & Intelligence settings are available in this preview. Other categories stay on the legacy settings surface.",
    "settings.shell.search": "Search settings",
    "settings.shell.category": "Settings category",
    "settings.shell.migratedOnly": "Settings preview",
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
    "settings.appearance.theme.previewTitle": "Theme preview",
    "settings.appearance.theme.previewDescription":
      "A compact preview of text, borders, and Jarvis accent colors.",
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
    "settings.pet.resetPosition.label": "Reset Desktop Pet position",
    "settings.pet.resetPosition.description":
      "Move the Desktop Pet back to its default safe corner.",
    "settings.pet.resetPosition.action": "Reset position",
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
    "settings.voice.provider.label": "Speech recognition provider",
    "settings.voice.provider.description":
      "Provider credentials stay in the existing secure Desktop settings window.",
    "settings.voice.provider.action": "Open speech setup",
    "settings.voice.provider.configured": "Credentials saved locally",
    "settings.voice.provider.notConfigured": "Not configured",
    "settings.voice.provider.secureStorageUnavailable":
      "Secure credential storage is unavailable",
    "settings.voice.provider.connectionNotChecked":
      "Connection is not checked on this page",
    "settings.voice.provider.language.label": "Recognition language",
    "settings.voice.provider.language.chinese": "Chinese",
    "settings.voice.provider.language.english": "English",
    "settings.voice.captureMode.label": "Capture mode",
    "settings.voice.captureMode.description":
      "Shows the current Voice runtime mode without starting recording.",
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
      "Use the Voice page to manually start a voice command when Jarvis Core is online.",
    "settings.voice.pushToTalk.available": "Available on the Voice page",
    "settings.voice.pushToTalk.unavailable": "Unavailable until Jarvis Core is ready",
    "settings.voice.pushToTalk.action": "Open Voice page",
    "settings.voice.tts.label": "Speech output provider",
    "settings.voice.tts.description":
      "Cloud speech output uses the existing secure TTS configuration.",
    "settings.voice.tts.action": "Open speech output setup",
    "settings.voice.tts.configured": "Credentials saved locally",
    "settings.voice.tts.notConfigured": "Not configured",
    "settings.voice.tts.secureStorageUnavailable":
      "Secure credential storage is unavailable",
    "settings.voice.tts.voiceConfigured": "A voice is selected",
    "settings.voice.tts.defaultVoice": "Default voice",
    "settings.voice.wakeWord.label": "Wake word",
    "settings.voice.wakeWord.description":
      "Background wake word listening is not a Product capability in this version.",
    "settings.voice.wakeWord.unavailable": "Not supported in this version",
    "settings.voice.privacy.localOnly":
      "This page only reads local status and does not start the microphone, ASR, or upload.",
    "settings.models.title": "Models & Intelligence",
    "settings.models.description":
      "Review command understanding, answer provider readiness, local model inventory, and routing status without loading models or contacting cloud providers.",
    "settings.models.section.command": "Fast command understanding",
    "settings.models.section.answer": "Answer provider",
    "settings.models.section.local": "Local models",
    "settings.models.section.routing": "Routing and availability",
    "settings.models.fastCommand.label": "Fast command understanding",
    "settings.models.fastCommand.description":
      "Use the existing local command rules for quick intent routing. Enabling this does not enable Qwen or any cloud model.",
    "settings.models.fastCommand.localRules": "Local rules",
    "settings.models.fastCommand.action": "Local rules mode",
    "settings.models.answerProvider.label": "General answer provider",
    "settings.models.answerProvider.description":
      "Controls whether the existing provider-backed answer path may be used after secure credentials and runtime gates are ready.",
    "settings.models.answerProvider.notConfigured": "Not configured",
    "settings.models.answerProvider.configuredNotVerified":
      "Credentials saved locally, connection not checked",
    "settings.models.answerProvider.secureStorageUnavailable":
      "Secure credential storage is unavailable",
    "settings.models.answerProvider.enabled": "Enabled",
    "settings.models.answerProvider.disabled": "Off",
    "settings.models.localModels.label": "Local model inventory",
    "settings.models.localModels.description":
      "Shows installed, selected, loaded, and missing local model states from the existing model service.",
    "settings.models.localModels.refresh": "Refresh model status",
    "settings.models.localModels.openOperations": "Open model tasks",
    "settings.models.localModels.noOperations": "No model tasks are running",
    "settings.models.routingPolicy.label": "Routing policy",
    "settings.models.routingPolicy.description":
      "Shows the product-level routing summary. Internal route IDs, fallback chains, and evaluation tools stay hidden.",
    "settings.models.routingPolicy.safeSummary":
      "Local rules remain the deterministic fallback. Safety and approval checks are unchanged.",
    "settings.models.cloudLocalStatus.label": "Cloud and local status",
    "settings.models.cloudLocalStatus.description":
      "Separates local availability from cloud configuration. Opening this page does not verify providers or start a request.",
    "settings.models.cloudLocalStatus.localProviders": "Local providers",
    "settings.models.cloudLocalStatus.cloudProviders": "Cloud providers",
    "settings.models.cloudLocalStatus.resourceLeases": "Active model leases",
    "settings.models.status.localRulesEnabled": "Local rules enabled",
    "settings.models.status.localRulesOff": "Command routing off",
    "settings.models.status.localRoutingUnavailable": "Local routing unavailable",
    "settings.models.status.missing": "Missing",
    "settings.models.status.installed": "Installed",
    "settings.models.status.selected": "Selected",
    "settings.models.status.loaded": "Loaded",
    "settings.models.status.currentlyNotLoaded": "Currently not loaded",
    "settings.models.status.available": "Available",
    "settings.models.status.unavailable": "Unavailable",
    "settings.models.status.unconfigured": "Not configured",
    "settings.models.status.degraded": "Degraded",
    "settings.models.status.notVerified": "Not verified here",
    "settings.models.status.noNetworkOnOpen":
      "No model load, download, deletion, or cloud verification runs when this page opens.",
    "settings.common.currentValue": "Current value",
    "settings.common.close": "Close",
    "settings.common.cancel": "Cancel",
    "settings.common.done": "Done",
    "settings.search.results": "results",
    "settings.search.noResultsTitle": "No matching settings",
    "settings.search.noResultsDescription":
      "Search currently covers General, Appearance & Pet, Voice & Audio, and Models & Intelligence settings.",
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
    "settings.shell.title": "Jarvis 控制中心",
    "settings.shell.description":
      "当前预览开放通用、外观与桌宠、语音与音频、模型与智能设置。其他分类仍保留在旧版设置界面中。",
    "settings.shell.search": "搜索设置",
    "settings.shell.category": "设置分类",
    "settings.shell.migratedOnly": "设置预览",
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
    "settings.appearance.theme.previewTitle": "主题预览",
    "settings.appearance.theme.previewDescription":
      "预览文字、边框和 Jarvis 强调色的组合效果。",
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
    "settings.pet.resetPosition.label": "重置桌宠位置",
    "settings.pet.resetPosition.description":
      "将桌宠移动回默认的安全角落。",
    "settings.pet.resetPosition.action": "重置位置",
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
      "Provider 凭据仍由现有安全桌面设置窗口管理。",
    "settings.voice.provider.action": "打开语音设置",
    "settings.voice.provider.configured": "凭据已保存在本机",
    "settings.voice.provider.notConfigured": "未配置",
    "settings.voice.provider.secureStorageUnavailable":
      "安全凭据存储不可用",
    "settings.voice.provider.connectionNotChecked":
      "此页面不会检查云端连接",
    "settings.voice.provider.language.label": "识别语言",
    "settings.voice.provider.language.chinese": "中文",
    "settings.voice.provider.language.english": "英文",
    "settings.voice.captureMode.label": "采集模式",
    "settings.voice.captureMode.description":
      "只显示当前 Voice 运行模式，不会开始录音。",
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
      "Jarvis Core 在线时，可前往语音页面手动开始一次语音命令。",
    "settings.voice.pushToTalk.available": "可在语音页面使用",
    "settings.voice.pushToTalk.unavailable": "Jarvis Core 就绪后可用",
    "settings.voice.pushToTalk.action": "打开语音页面",
    "settings.voice.tts.label": "语音播报服务",
    "settings.voice.tts.description":
      "云端语音播报继续使用现有安全 TTS 配置。",
    "settings.voice.tts.action": "打开播报设置",
    "settings.voice.tts.configured": "凭据已保存在本机",
    "settings.voice.tts.notConfigured": "未配置",
    "settings.voice.tts.secureStorageUnavailable": "安全凭据存储不可用",
    "settings.voice.tts.voiceConfigured": "已选择播报声音",
    "settings.voice.tts.defaultVoice": "默认声音",
    "settings.voice.wakeWord.label": "唤醒词",
    "settings.voice.wakeWord.description":
      "后台唤醒监听在当前版本中尚未作为正式产品能力开放。",
    "settings.voice.wakeWord.unavailable": "当前版本不支持",
    "settings.voice.privacy.localOnly":
      "此页面只读取本机状态，不会启动麦克风、ASR 或上传。",
    "settings.models.title": "模型与智能",
    "settings.models.description":
      "查看命令理解、回答服务、本地模型和路由状态。打开本页不会加载模型，也不会连接云端服务。",
    "settings.models.section.command": "快速命令理解",
    "settings.models.section.answer": "回答服务",
    "settings.models.section.local": "本地模型",
    "settings.models.section.routing": "路由与可用性",
    "settings.models.fastCommand.label": "快速命令理解",
    "settings.models.fastCommand.description":
      "使用现有本地规则进行快速意图路由。开启此项不会启用 Qwen 或任何云端模型。",
    "settings.models.fastCommand.localRules": "本地规则",
    "settings.models.fastCommand.action": "本地规则模式",
    "settings.models.answerProvider.label": "通用回答服务",
    "settings.models.answerProvider.description":
      "控制现有 Provider 回答路径是否可在安全凭据和运行门槛就绪后使用。",
    "settings.models.answerProvider.notConfigured": "未配置",
    "settings.models.answerProvider.configuredNotVerified":
      "凭据已保存在本机，本页不检查连接",
    "settings.models.answerProvider.secureStorageUnavailable":
      "安全凭据存储不可用",
    "settings.models.answerProvider.enabled": "已开启",
    "settings.models.answerProvider.disabled": "关闭",
    "settings.models.localModels.label": "本地模型清单",
    "settings.models.localModels.description":
      "从现有模型服务读取已安装、已选择、已加载和缺失状态。",
    "settings.models.localModels.refresh": "刷新模型状态",
    "settings.models.localModels.openOperations": "查看模型任务",
    "settings.models.localModels.noOperations": "当前没有运行中的模型任务",
    "settings.models.routingPolicy.label": "路由策略",
    "settings.models.routingPolicy.description":
      "显示产品级路由摘要。内部路由 ID、fallback 链和评测工具不会在此页显示。",
    "settings.models.routingPolicy.safeSummary":
      "本地规则仍是确定性 fallback。安全和确认规则保持不变。",
    "settings.models.cloudLocalStatus.label": "云端与本地状态",
    "settings.models.cloudLocalStatus.description":
      "区分本地可用性和云端配置。打开本页不会验证 Provider，也不会发起请求。",
    "settings.models.cloudLocalStatus.localProviders": "本地 Provider",
    "settings.models.cloudLocalStatus.cloudProviders": "云端 Provider",
    "settings.models.cloudLocalStatus.resourceLeases": "活动模型租约",
    "settings.models.status.localRulesEnabled": "本地规则已启用",
    "settings.models.status.localRulesOff": "命令路由关闭",
    "settings.models.status.localRoutingUnavailable": "本地路由暂不可用",
    "settings.models.status.missing": "缺失",
    "settings.models.status.installed": "已安装",
    "settings.models.status.selected": "已选择",
    "settings.models.status.loaded": "已加载",
    "settings.models.status.currentlyNotLoaded": "当前未加载",
    "settings.models.status.available": "可用",
    "settings.models.status.unavailable": "不可用",
    "settings.models.status.unconfigured": "未配置",
    "settings.models.status.degraded": "降级",
    "settings.models.status.notVerified": "本页未验证",
    "settings.models.status.noNetworkOnOpen":
      "打开本页不会加载、下载、删除模型，也不会验证云端 Provider。",
    "settings.common.currentValue": "当前值",
    "settings.common.close": "关闭",
    "settings.common.cancel": "取消",
    "settings.common.done": "完成",
    "settings.search.results": "条结果",
    "settings.search.noResultsTitle": "没有匹配的设置",
    "settings.search.noResultsDescription":
      "当前可搜索通用、外观与桌宠、语音与音频、模型与智能设置。",
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
