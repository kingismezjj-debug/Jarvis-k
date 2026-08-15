import type { Message } from "@jarvis-k/contracts";

import { cn } from "@/lib/utils";

export function ConversationMessage({ message }: { message: Message }) {
  return (
    <div
      className={cn(
        "flex",
        message.role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[72%] rounded-md px-3.5 py-2.5 text-sm leading-5",
          message.role === "user" ? "bg-secondary" : "border bg-card",
        )}
      >
        {message.text}
      </div>
    </div>
  );
}

