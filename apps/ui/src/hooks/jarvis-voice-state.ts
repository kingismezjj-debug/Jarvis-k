import type {
  TtsServiceStatus,
  VoiceCommandAliasRecord,
  VoiceRegressionCollectionStatus,
  VoiceRegressionRecord,
  VoiceServiceStatus,
} from "@jarvis-k/contracts";

export interface JarvisVoiceState {
  voiceCommandAliases: VoiceCommandAliasRecord[];
  voiceRegressionExportText: string | null;
  voiceRegressionRecords: VoiceRegressionRecord[];
  voiceRegressionStatus: VoiceRegressionCollectionStatus | null;
  voiceServiceStatus: VoiceServiceStatus | null;
  ttsServiceStatus: TtsServiceStatus | null;
}

export const initialJarvisVoiceState: JarvisVoiceState = {
  voiceCommandAliases: [],
  voiceRegressionExportText: null,
  voiceRegressionRecords: [],
  voiceRegressionStatus: null,
  voiceServiceStatus: null,
  ttsServiceStatus: null,
};

export type JarvisVoiceAction =
  | { type: "voiceAliases.set"; aliases: VoiceCommandAliasRecord[] }
  | { type: "voiceRegressionExport.set"; exportText: string | null }
  | { type: "voiceRegressionRecords.set"; records: VoiceRegressionRecord[] }
  | {
      type: "voiceRegressionStatus.set";
      status: VoiceRegressionCollectionStatus | null;
    }
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
    case "voiceRegressionExport.set":
      return { ...state, voiceRegressionExportText: action.exportText };
    case "voiceRegressionRecords.set":
      return { ...state, voiceRegressionRecords: action.records };
    case "voiceRegressionStatus.set":
      return { ...state, voiceRegressionStatus: action.status };
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
