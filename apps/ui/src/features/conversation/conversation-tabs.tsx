import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ConversationActions, ConversationViewModel } from "./types";

export function ConversationTabs({
  actions,
  viewModel,
}: {
  actions: Pick<ConversationActions, "selectConversation">;
  viewModel: Pick<
    ConversationViewModel,
    "conversations" | "copy" | "sending"
  > & { activeConversationId?: string };
}) {
  const { activeConversationId, conversations, copy, sending } = viewModel;
  if (conversations.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {copy.label.noLocalConversations}
      </p>
    );
  }

  return (
    <>
      {conversations.map((conversation) => {
        const active = conversation.id === activeConversationId;
        return (
          <Button
            className={cn(
              "h-8 max-w-[220px] shrink-0 rounded-md px-2.5 text-xs",
              active && "border-primary text-primary",
            )}
            data-testid="conversation-tab"
            disabled={sending}
            key={conversation.id}
            onClick={() => actions.selectConversation(conversation.id, active)}
            type="button"
            variant={active ? "outline" : "ghost"}
          >
            <span className="truncate">{conversation.title}</span>
          </Button>
        );
      })}
    </>
  );
}

