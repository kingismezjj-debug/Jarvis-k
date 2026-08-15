import type {
  TtsServiceStatus,
  VoiceCommandAliasRecord,
  VoiceServiceStatus,
} from "@jarvis-k/contracts";

export interface JarvisVoiceState {
  voiceCommandAliases: VoiceCommandAliasRecord[];
  voiceServiceStatus: VoiceServiceStatus | null;
  ttsServiceStatus: TtsServiceStatus | null;
}

export const initialJarvisVoiceState: JarvisVoiceState = {
  voiceCommandAliases: [],
  voiceServiceStatus: null,
  ttsServiceStatus: null,
};

export type JarvisVoiceAction =
  | { type: "voiceAliases.set"; aliases: VoiceCommandAliasRecord[] }
  | { type: "voiceServiceStatus.set"; status: VoiceServiceStatus | null }
  | { type: "ttsServiceStatus.set"; status: TtsServiceStatus | null }
  | { type: "textOnlyAcceptance.apply" }
  | { type: "reset" }
  | { type: string };

export function jarvisVoiceReducer(
  state: JarvisVoiceState,
  action: JarvisVoiceAction,
): JarvisVoiceState {
  switch (action.type) {
    case "voiceAliases.set":
      return { ...state, voiceCommandAliases: action.aliases };
    case "voiceServiceStatus.set":
      return { ...state, voiceServiceStatus: action.status };
    case "ttsServiceStatus.set":
      return { ...state, ttsServiceStatus: action.status };
    case "textOnlyAcceptance.apply":
      return { ...state, voiceServiceStatus: null, ttsServiceStatus: null };
    case "reset":
      return initialJarvisVoiceState;
    default:
      return state;
  }
}
