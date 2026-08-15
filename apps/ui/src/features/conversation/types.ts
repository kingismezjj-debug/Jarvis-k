import type {
  BrainCommandResult,
  Conversation,
  EventEnvelope,
  Message,
  SessionHistoryEntry,
  UserRouteAliasLearningProposal,
  VoiceCommandCorrectionCandidate,
} from "@jarvis-k/contracts";

import type { stage5Copy, uiCopy } from "@/app/copy";
import type { LocalTtsStatus } from "@/app/types";

export type ConversationCopy = (typeof uiCopy)["en"];
export type ConversationAlphaCopy = (typeof stage5Copy)["en"];

export type ConversationVoiceProjection = {
  hidden: boolean;
  isFinal: boolean;
  state: string;
  transcript: string;
};

export type ConversationTtsProjection = {
  displayedStatus: LocalTtsStatus | "eligible";
  enabled: boolean;
  eligible: boolean;
  error: string | null;
  status: LocalTtsStatus;
};

export type ConversationViewModel = {
  alphaCopy: ConversationAlphaCopy;
  brainResult: BrainCommandResult | null;
  conversations: Conversation[];
  copy: ConversationCopy;
  error: string | null;
  events: EventEnvelope[];
  messages: Message[];
  sending: boolean;
  sessionHistory: SessionHistoryEntry[];
  tts: ConversationTtsProjection;
  voiceProjection: ConversationVoiceProjection;
};

export type ConversationActions = {
  clearSessionHistory(): void;
  confirmUserRouteAlias(proposal: UserRouteAliasLearningProposal): void;
  confirmVoiceCommandCorrection(
    candidate: VoiceCommandCorrectionCandidate,
  ): void;
  playLocalTts(): void;
  retryBrainCommand(): void;
  rollbackBrainResult(): void;
  selectConversation(conversationId: string, active: boolean): void;
  stopLocalTts(): void;
};
