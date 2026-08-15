import { ConversationMessageList } from "./conversation-message-list";
import type { ConversationActions, ConversationViewModel } from "./types";

export type ConversationPanelProps = {
  actions: ConversationActions;
  viewModel: ConversationViewModel;
};

export function ConversationPanel({
  actions,
  viewModel,
}: ConversationPanelProps) {
  return <ConversationMessageList actions={actions} viewModel={viewModel} />;
}
