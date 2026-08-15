import { useState, type FormEvent } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import type { Conversation } from "@jarvis-k/contracts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ActionStatus } from "@/app/types";
import type { ConversationCopy } from "./types";

export type ConversationHeaderActionsProps = {
  activeConversation?: Conversation;
  copy: ConversationCopy;
  sending: boolean;
  createConversation: () => Promise<boolean | string | null | void>;
  notifyAction: (label: string, tone?: ActionStatus["tone"]) => void;
  renameConversation: (
    conversationId: string,
    title: string,
  ) => Promise<boolean | string | null | void>;
};

export function ConversationHeaderActions({
  activeConversation,
  copy,
  createConversation,
  notifyAction,
  renameConversation,
  sending,
}: ConversationHeaderActionsProps) {
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  async function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    if (!activeConversation) {
      notifyAction(copy.action.noConversationSelected, "warning");
      return;
    }
    const title = titleDraft.trim();
    if (!title) {
      notifyAction(copy.action.enterConversationTitle, "warning");
      return;
    }
    const renamed = await renameConversation(activeConversation.id, title);
    if (renamed) {
      setRenaming(false);
      setTitleDraft("");
    }
  }

  if (renaming && activeConversation) {
    return (
      <form className="flex items-center gap-1.5" onSubmit={handleRenameSubmit}>
        <Input
          aria-label="Conversation title"
          className="h-8 w-[180px] rounded-md text-xs"
          data-testid="conversation-title-input"
          onChange={(event) => setTitleDraft(event.target.value)}
          value={titleDraft}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Save conversation title"
              className="size-8 rounded-md"
              data-testid="save-conversation-title"
              disabled={sending}
              size="icon-sm"
              type="submit"
            >
              <Check className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save conversation title</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Cancel conversation rename"
              className="size-8 rounded-md"
              data-testid="cancel-conversation-rename"
              onClick={() => {
                setRenaming(false);
                setTitleDraft("");
                notifyAction(copy.action.conversationRenameCancelled, "accent");
              }}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancel conversation rename</TooltipContent>
        </Tooltip>
      </form>
    );
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Rename conversation"
            className="size-8 rounded-md"
            data-testid="rename-conversation"
            disabled={sending}
            onClick={() => {
              if (!activeConversation) {
                notifyAction("No conversation selected", "warning");
                return;
              }
              setTitleDraft(activeConversation.title ?? "");
              setRenaming(true);
              notifyAction(copy.action.renameModeActive, "accent");
            }}
            size="icon-sm"
            variant="ghost"
          >
            <Pencil className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Rename conversation</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="New conversation"
            className="size-8 rounded-md"
            data-testid="new-conversation"
            disabled={sending}
            onClick={() => {
              void createConversation();
            }}
            size="icon-sm"
            variant="outline"
          >
            <Plus className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New conversation</TooltipContent>
      </Tooltip>
    </>
  );
}
