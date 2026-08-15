import { Bot } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";

import { BrainDispatchPanel } from "./brain-dispatch-panel";
import { ConversationMessage } from "./conversation-message";
import {
  AgentAcceptedStatus,
  ConversationError,
  SessionHistoryPanel,
  UserRouteAliasProposal,
  VoiceCorrectionCandidates,
  VoiceTranscriptPanel,
} from "./conversation-status";
import type { ConversationActions, ConversationViewModel } from "./types";

export type ConversationMessageListProps = {
  actions: ConversationActions;
  viewModel: ConversationViewModel;
};

export function ConversationMessageList({
  actions,
  viewModel,
}: ConversationMessageListProps) {
  const { copy } = viewModel;

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div
        className="flex min-h-full flex-col gap-6 px-8 py-7"
        data-testid="message-list"
      >
        <div className="flex gap-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Bot className="size-4" />
          </div>
          <div className="max-w-[760px] space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.label.agentCore}
            </p>
            <p className="text-sm leading-6">{copy.label.runtimeReady}</p>
          </div>
        </div>

        <BrainDispatchPanel actions={actions} viewModel={viewModel} />
        <SessionHistoryPanel actions={actions} viewModel={viewModel} />

        {viewModel.messages.map((message) => (
          <ConversationMessage key={message.id} message={message} />
        ))}

        <VoiceCorrectionCandidates actions={actions} viewModel={viewModel} />
        <UserRouteAliasProposal actions={actions} viewModel={viewModel} />
        <AgentAcceptedStatus events={viewModel.events} />
        <VoiceTranscriptPanel
          copy={viewModel.copy}
          voiceProjection={viewModel.voiceProjection}
        />
        <ConversationError error={viewModel.error} />
      </div>
    </ScrollArea>
  );
}

