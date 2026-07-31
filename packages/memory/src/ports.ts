import type { Message } from "@jarvis-k/contracts";
import type { MemorySnapshot } from "./schemas";

export interface MessageListOptions {
  conversationId?: string;
  limit?: number;
}

export interface MemoryRepository {
  initialize(): Promise<void>;
  appendMessage(message: Message): Promise<Message>;
  listMessages(options?: MessageListOptions): Promise<Message[]>;
  getSnapshot(): Promise<MemorySnapshot>;
  restoreSnapshot(snapshot: MemorySnapshot): Promise<void>;
  close(): Promise<void>;
}
