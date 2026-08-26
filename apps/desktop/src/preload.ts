import { contextBridge, ipcRenderer } from "electron";
import {
  AppCommand,
  AppCommandSchema,
  ChatAnswerProductModeSetResultSchema,
  ChatAnswerProductModeStatusSchema,
  CommandRouterProductModeSetResultSchema,
  CommandRouterProductModeStatusSchema,
  DesktopSettingsSetResultSchema,
  DesktopSettingsSchema,
  DesktopLaunchAtLoginStatusSchema,
  DesktopUiActionSchema,
  EventEnvelopeSchema,
  IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
  IPC_CHAT_ANSWER_PRODUCT_MODE_STATUS_CHANNEL,
  IPC_COMMAND_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_STATUS_CHANNEL,
  IPC_DESKTOP_LAUNCH_AT_LOGIN_SET_CHANNEL,
  IPC_DESKTOP_LAUNCH_AT_LOGIN_STATUS_CHANNEL,
  IPC_DESKTOP_PET_RESET_POSITION_CHANNEL,
  IPC_DESKTOP_PET_SETTINGS_SET_CHANNEL,
  IPC_DESKTOP_PET_SKIN_ACTIVATE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_INSTALL_PREVIEW_CHANNEL,
  IPC_DESKTOP_PET_SKIN_PREVIEW_CANCEL_CHANNEL,
  IPC_DESKTOP_PET_SKIN_PREVIEW_RESOURCE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_PREVIEW_SELECT_CHANNEL,
  IPC_DESKTOP_PET_SKIN_REGISTRY_CHANNEL,
  IPC_DESKTOP_PET_SKIN_REMOVE_CHANNEL,
  IPC_DESKTOP_PET_SKIN_RETURN_BUILT_IN_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_DRAFT_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_EXPORT_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_METADATA_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_OPEN_EXPORT_FOLDER_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_PREVIEW_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_RESET_CHANNEL,
  IPC_DESKTOP_PET_SKIN_STUDIO_SELECT_ASSET_CHANNEL,
  IPC_DESKTOP_SETTINGS_SET_CHANNEL,
  IPC_DESKTOP_SETTINGS_STATUS_CHANNEL,
  IPC_DESKTOP_UI_ACTION_CHANNEL,
  IPC_EVENT_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_DIAGNOSTIC_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_MODEL_SET_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_STATUS_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_FAKE_RUN_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_PREFLIGHT_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_REAL_RUN_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_STATUS_CHANNEL,
  IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL,
  IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL,
  IPC_TTS_SETTINGS_OPEN_CHANNEL,
  IPC_TTS_SETTINGS_STATUS_CHANNEL,
  IPC_TTS_SYNTHESIZE_CHANNEL,
  IPC_UI_SURFACE_CAPABILITY_STATUS_CHANNEL,
  IPC_VOICE_SETTINGS_OPEN_CHANNEL,
  IPC_VOICE_SETTINGS_STATUS_CHANNEL,
  IPC_VOICE_AUDIO_CHANNEL,
  JarvisBridge,
  QwenRuntimeControlSetResultSchema,
  QwenRuntimeControlStatusSchema,
  type DesktopPetReducedMotion,
  type QwenRuntimeControlAction,
  type DesktopCloseButtonBehavior,
  type DesktopFirstRunOnboardingState,
  TtsServiceStatusSchema,
  TtsSynthesisResultSchema,
  UiSurfaceCapabilityStatusSchema,
  VoiceServiceStatusSchema,
  VoiceAudioFrame,
  VoiceAudioFrameSchema,
  PetSkinActivateRequestSchema,
  PetSkinInstallFromPreviewRequestSchema,
  PetSkinManagementResultSchema,
  PetSkinPreviewCancelResultSchema,
  PetSkinPreviewResourceRequestSchema,
  PetSkinPreviewResourceResultSchema,
  PetSkinPreviewSelectResultSchema,
  PetSkinRegistryProjectionSchema,
  PetSkinRemoveRequestSchema,
  PetSkinStudioMetadataUpdateRequestSchema,
  PetSkinStudioOpenExportFolderRequestSchema,
  PetSkinStudioResultSchema,
  PetSkinStudioSelectAssetRequestSchema,
  GlmAdvancedBrainAcceptanceCommandResultSchema,
  GlmAdvancedBrainAcceptanceConsentRequestSchema,
  GlmAdvancedBrainAcceptanceDiagnosticReportSchema,
  GlmAdvancedBrainAcceptancePreflightResultSchema,
  GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema,
  GlmAdvancedBrainAcceptanceSetModelRequestSchema,
  GlmAdvancedBrainAcceptanceStatusSchema,
  CloudProviderAcceptanceCommandResultSchema,
  CloudProviderAcceptanceConsentRequestSchema,
  CloudProviderAcceptanceDeleteCredentialRequestSchema,
  CloudProviderAcceptanceDiagnosticReportSchema,
  CloudProviderAcceptancePreflightResultSchema,
  CloudProviderAcceptanceSaveCredentialRequestSchema,
  CloudProviderAcceptanceStatusSchema,
  createCommandEnvelope
} from "@jarvis-k/contracts";

async function sendCommand(command: AppCommand) {
  const validatedCommand = AppCommandSchema.parse(command);
  return ipcRenderer.invoke(
    IPC_COMMAND_CHANNEL,
    createCommandEnvelope(validatedCommand)
  );
}

function sendVoiceAudio(frame: VoiceAudioFrame): void {
  ipcRenderer.send(
    IPC_VOICE_AUDIO_CHANNEL,
    VoiceAudioFrameSchema.parse(frame)
  );
}

const bridge: JarvisBridge = {
  sendCommand,
  sendVoiceAudio,
  getSnapshot: () =>
    sendCommand({
      type: "agent.getSnapshot",
      payload: {}
    }),
  getCommandRouterProductModeStatus: async () =>
    CommandRouterProductModeStatusSchema.parse(
      await ipcRenderer.invoke(IPC_COMMAND_ROUTER_PRODUCT_MODE_STATUS_CHANNEL)
    ),
  setCommandRouterProductModeEnabled: async (enabled) =>
    CommandRouterProductModeSetResultSchema.parse(
      await ipcRenderer.invoke(IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL, {
        enabled
      })
    ),
  getQwenRuntimeControlStatus: async () =>
    QwenRuntimeControlStatusSchema.parse(
      await ipcRenderer.invoke(IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL)
    ),
  setQwenRuntimeControlAction: async (action: QwenRuntimeControlAction) =>
    QwenRuntimeControlSetResultSchema.parse(
      await ipcRenderer.invoke(IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL, {
        action
      })
    ),
  getChatAnswerProductModeStatus: async () =>
    ChatAnswerProductModeStatusSchema.parse(
      await ipcRenderer.invoke(IPC_CHAT_ANSWER_PRODUCT_MODE_STATUS_CHANNEL)
    ),
  setChatAnswerProductModeEnabled: async (enabled) =>
    ChatAnswerProductModeSetResultSchema.parse(
      await ipcRenderer.invoke(IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL, {
        enabled
      })
    ),
  getDesktopSettings: async () =>
    DesktopSettingsSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_SETTINGS_STATUS_CHANNEL)
    ),
  getDesktopLaunchAtLoginStatus: async () =>
    DesktopLaunchAtLoginStatusSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_LAUNCH_AT_LOGIN_STATUS_CHANNEL)
    ),
  setDesktopCloseButtonBehavior: async (
    behavior: DesktopCloseButtonBehavior
  ) =>
    DesktopSettingsSetResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_SETTINGS_SET_CHANNEL, {
        closeButtonBehavior: behavior
      })
    ),
  setDesktopFirstRunOnboardingState: async (
    state: DesktopFirstRunOnboardingState
  ) =>
    DesktopSettingsSetResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_SETTINGS_SET_CHANNEL, {
        firstRunOnboardingState: state
      })
    ),
  setDesktopLaunchAtLoginEnabled: async (enabled) =>
    DesktopSettingsSetResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_LAUNCH_AT_LOGIN_SET_CHANNEL, {
        launchAtLoginEnabled: enabled
      })
    ),
  setDesktopPetEnabled: async (enabled) =>
    DesktopSettingsSetResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SETTINGS_SET_CHANNEL, {
        enabled
      })
    ),
  setDesktopPetAlwaysOnTop: async (enabled) =>
    DesktopSettingsSetResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SETTINGS_SET_CHANNEL, {
        alwaysOnTop: enabled
      })
    ),
  setDesktopPetReducedMotion: async (reducedMotion: DesktopPetReducedMotion) =>
    DesktopSettingsSetResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SETTINGS_SET_CHANNEL, {
        reducedMotion
      })
    ),
  resetDesktopPetPosition: async () =>
    DesktopSettingsSetResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_RESET_POSITION_CHANNEL)
    ),
  selectDesktopPetSkinPreview: async () =>
    PetSkinPreviewSelectResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SKIN_PREVIEW_SELECT_CHANNEL)
    ),
  getDesktopPetSkinPreviewResource: async (request) =>
    PetSkinPreviewResourceResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_DESKTOP_PET_SKIN_PREVIEW_RESOURCE_CHANNEL,
        PetSkinPreviewResourceRequestSchema.parse(request)
      )
    ),
  cancelDesktopPetSkinPreview: async () =>
    PetSkinPreviewCancelResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SKIN_PREVIEW_CANCEL_CHANNEL)
    ),
  installDesktopPetSkinPreview: async (request) =>
    PetSkinManagementResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_DESKTOP_PET_SKIN_INSTALL_PREVIEW_CHANNEL,
        PetSkinInstallFromPreviewRequestSchema.parse(request)
      )
    ),
  getDesktopPetSkinRegistry: async () =>
    PetSkinRegistryProjectionSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SKIN_REGISTRY_CHANNEL)
    ),
  activateDesktopPetSkin: async (request) =>
    PetSkinManagementResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_DESKTOP_PET_SKIN_ACTIVATE_CHANNEL,
        PetSkinActivateRequestSchema.parse(request)
      )
    ),
  returnDesktopPetSkinToBuiltIn: async () =>
    PetSkinManagementResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SKIN_RETURN_BUILT_IN_CHANNEL)
    ),
  removeDesktopPetSkin: async (request) =>
    PetSkinManagementResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_DESKTOP_PET_SKIN_REMOVE_CHANNEL,
        PetSkinRemoveRequestSchema.parse(request)
      )
    ),
  getDesktopPetSkinStudioDraft: async () =>
    PetSkinStudioResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_DRAFT_CHANNEL)
    ),
  updateDesktopPetSkinStudioMetadata: async (request) =>
    PetSkinStudioResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_DESKTOP_PET_SKIN_STUDIO_METADATA_CHANNEL,
        PetSkinStudioMetadataUpdateRequestSchema.parse(request)
      )
    ),
  selectDesktopPetSkinStudioAsset: async (request) =>
    PetSkinStudioResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_DESKTOP_PET_SKIN_STUDIO_SELECT_ASSET_CHANNEL,
        PetSkinStudioSelectAssetRequestSchema.parse(request)
      )
    ),
  previewDesktopPetSkinStudioDraft: async () =>
    PetSkinStudioResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_PREVIEW_CHANNEL)
    ),
  exportDesktopPetSkinStudioDraft: async () =>
    PetSkinStudioResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_EXPORT_CHANNEL)
    ),
  resetDesktopPetSkinStudioDraft: async () =>
    PetSkinStudioResultSchema.parse(
      await ipcRenderer.invoke(IPC_DESKTOP_PET_SKIN_STUDIO_RESET_CHANNEL)
    ),
  openDesktopPetSkinStudioExportFolder: async (request) =>
    PetSkinStudioResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_DESKTOP_PET_SKIN_STUDIO_OPEN_EXPORT_FOLDER_CHANNEL,
        PetSkinStudioOpenExportFolderRequestSchema.parse(request)
      )
    ),
  getGlmAdvancedBrainAcceptanceStatus: async () =>
    GlmAdvancedBrainAcceptanceStatusSchema.parse(
      await ipcRenderer.invoke(
        IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_STATUS_CHANNEL
      )
    ),
  setGlmAdvancedBrainAcceptanceModel: async (request) =>
    GlmAdvancedBrainAcceptanceCommandResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_MODEL_SET_CHANNEL,
        GlmAdvancedBrainAcceptanceSetModelRequestSchema.parse(request)
      )
    ),
  saveGlmAdvancedBrainAcceptanceCredential: async (request) =>
    GlmAdvancedBrainAcceptanceCommandResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL,
        GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema.parse(request)
      )
    ),
  deleteGlmAdvancedBrainAcceptanceCredential: async () =>
    GlmAdvancedBrainAcceptanceCommandResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL
      )
    ),
  preflightGlmAdvancedBrainAcceptance: async (request) =>
    GlmAdvancedBrainAcceptancePreflightResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_CHANNEL,
        GlmAdvancedBrainAcceptanceConsentRequestSchema.parse(request)
      )
    ),
  runGlmAdvancedBrainAcceptanceDiagnostic: async (request) =>
    GlmAdvancedBrainAcceptanceDiagnosticReportSchema.parse(
      await ipcRenderer.invoke(
        IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_DIAGNOSTIC_CHANNEL,
        GlmAdvancedBrainAcceptanceConsentRequestSchema.parse(request)
      )
    ),
  getCloudProviderAcceptanceStatus: async () =>
    CloudProviderAcceptanceStatusSchema.parse(
      await ipcRenderer.invoke(IPC_CLOUD_PROVIDER_ACCEPTANCE_STATUS_CHANNEL)
    ),
  saveCloudProviderAcceptanceCredential: async (request) =>
    CloudProviderAcceptanceCommandResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL,
        CloudProviderAcceptanceSaveCredentialRequestSchema.parse(request)
      )
    ),
  deleteCloudProviderAcceptanceCredential: async (request) =>
    CloudProviderAcceptanceCommandResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL,
        CloudProviderAcceptanceDeleteCredentialRequestSchema.parse(request)
      )
    ),
  preflightCloudProviderAcceptance: async (request) =>
    CloudProviderAcceptancePreflightResultSchema.parse(
      await ipcRenderer.invoke(
        IPC_CLOUD_PROVIDER_ACCEPTANCE_PREFLIGHT_CHANNEL,
        CloudProviderAcceptanceConsentRequestSchema.parse(request)
      )
    ),
  runCloudProviderFakeAcceptance: async (request) =>
    CloudProviderAcceptanceDiagnosticReportSchema.parse(
      await ipcRenderer.invoke(
        IPC_CLOUD_PROVIDER_ACCEPTANCE_FAKE_RUN_CHANNEL,
        CloudProviderAcceptanceConsentRequestSchema.parse(request)
      )
    ),
  runCloudProviderRealAcceptance: async (request) =>
    CloudProviderAcceptanceDiagnosticReportSchema.parse(
      await ipcRenderer.invoke(
        IPC_CLOUD_PROVIDER_ACCEPTANCE_REAL_RUN_CHANNEL,
        CloudProviderAcceptanceConsentRequestSchema.parse(request)
      )
    ),
  getUiSurfaceCapabilityStatus: async () =>
    UiSurfaceCapabilityStatusSchema.parse(
      await ipcRenderer.invoke(IPC_UI_SURFACE_CAPABILITY_STATUS_CHANNEL)
    ),
  getVoiceServiceStatus: async () =>
    VoiceServiceStatusSchema.parse(
      await ipcRenderer.invoke(IPC_VOICE_SETTINGS_STATUS_CHANNEL)
    ),
  openVoiceSettings: async () =>
    VoiceServiceStatusSchema.parse(
      await ipcRenderer.invoke(IPC_VOICE_SETTINGS_OPEN_CHANNEL)
    ),
  getTtsServiceStatus: async () =>
    TtsServiceStatusSchema.parse(
      await ipcRenderer.invoke(IPC_TTS_SETTINGS_STATUS_CHANNEL)
    ),
  openTtsSettings: async () =>
    TtsServiceStatusSchema.parse(
      await ipcRenderer.invoke(IPC_TTS_SETTINGS_OPEN_CHANNEL)
    ),
  synthesizeTts: async (text, voiceId) =>
    TtsSynthesisResultSchema.parse(
      await ipcRenderer.invoke(IPC_TTS_SYNTHESIZE_CHANNEL, {
        text,
        ...(voiceId ? { voiceId } : {})
      })
    ),
  onDesktopUiAction: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, rawAction: unknown) => {
      const parsed = DesktopUiActionSchema.safeParse(rawAction);
      if (parsed.success) {
        listener(parsed.data);
      }
    };
    ipcRenderer.on(IPC_DESKTOP_UI_ACTION_CHANNEL, handler);
    return () =>
      ipcRenderer.removeListener(IPC_DESKTOP_UI_ACTION_CHANNEL, handler);
  },
  onEvent: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, rawEvent: unknown) => {
      const parsed = EventEnvelopeSchema.safeParse(rawEvent);
      if (parsed.success) {
        listener(parsed.data);
      }
    };
    ipcRenderer.on(IPC_EVENT_CHANNEL, handler);
    return () => ipcRenderer.removeListener(IPC_EVENT_CHANNEL, handler);
  }
};

contextBridge.exposeInMainWorld("jarvis", bridge);
