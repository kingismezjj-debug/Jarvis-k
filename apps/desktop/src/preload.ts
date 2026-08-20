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
  DesktopUiActionSchema,
  EventEnvelopeSchema,
  IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL,
  IPC_CHAT_ANSWER_PRODUCT_MODE_STATUS_CHANNEL,
  IPC_COMMAND_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL,
  IPC_COMMAND_ROUTER_PRODUCT_MODE_STATUS_CHANNEL,
  IPC_DESKTOP_SETTINGS_SET_CHANNEL,
  IPC_DESKTOP_SETTINGS_STATUS_CHANNEL,
  IPC_DESKTOP_UI_ACTION_CHANNEL,
  IPC_EVENT_CHANNEL,
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
  type QwenRuntimeControlAction,
  type DesktopCloseButtonBehavior,
  type DesktopFirstRunOnboardingState,
  TtsServiceStatusSchema,
  TtsSynthesisResultSchema,
  UiSurfaceCapabilityStatusSchema,
  VoiceServiceStatusSchema,
  VoiceAudioFrame,
  VoiceAudioFrameSchema,
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
