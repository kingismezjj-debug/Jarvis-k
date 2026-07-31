import { MessageSchema } from "@jarvis-k/contracts";
import { z } from "zod";

export const MemorySnapshotSchema = z
  .object({
    messages: z.array(MessageSchema)
  })
  .strict();

export type MemorySnapshot = z.infer<typeof MemorySnapshotSchema>;

export function cloneMessage(message: z.infer<typeof MessageSchema>) {
  return MessageSchema.parse(message);
}
