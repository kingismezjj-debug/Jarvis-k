import type { FormEvent } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { ConversationCopy } from "./types";

export type ConversationComposerProps = {
  copy: ConversationCopy;
  onChange(value: string): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
  sending: boolean;
  value: string;
};

export function ConversationComposer({
  copy,
  onChange,
  onSubmit,
  sending,
  value,
}: ConversationComposerProps) {
  return (
    <form
      className="flex h-[88px] shrink-0 items-center gap-2.5 border-t bg-card px-6 max-[520px]:h-auto max-[520px]:min-h-[76px] max-[520px]:px-3"
      onSubmit={onSubmit}
    >
      <Input
        aria-label="Command"
        className="h-10 min-w-0 flex-1 rounded-md bg-input/45 px-3.5"
        data-testid="command-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder={copy.label.commandPlaceholder}
        value={value}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label={copy.label.sendCommand}
            className="size-10 shrink-0 rounded-md"
            data-testid="send-command"
            disabled={sending}
            size="icon-lg"
            type="submit"
          >
            <Send className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copy.label.sendCommand}</TooltipContent>
      </Tooltip>
    </form>
  );
}
