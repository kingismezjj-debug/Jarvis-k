import type { Message } from "@jarvis-k/contracts";
import type {
  Conversation,
  MemoryHealth,
  MemorySummary,
  MemorySnapshot,
  MemorySnapshotInput
} from "./schemas";

export interface MessageListOptions {
  conversationId?: string;
  limit?: number;
}

export interface RecentMessageListOptions {
  conversationId?: string;
  limit: number;
}

export interface ConversationListOptions {
  limit?: number;
}

export interface ConversationCreateInput {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string;
}

export interface ConversationUpdateInput {
  id: string;
  title?: string;
  updatedAt?: string;
}

export interface SummaryListOptions {
  conversationId?: string;
  limit?: number;
}

export interface SummaryWriteInput {
  id: string;
  conversationId: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
  fromMessageId?: string;
  toMessageId?: string;
}

export interface MemoryRepository {
  initialize(): Promise<void>;
  checkHealth(): Promise<MemoryHealth>;
  upsertConversation(input: ConversationCreateInput): Promise<Conversation>;
  updateConversation(input: ConversationUpdateInput): Promise<Conversation>;
  listConversations(options?: ConversationListOptions): Promise<Conversation[]>;
  getActiveConversationId(): Promise<string | undefined>;
  setActiveConversationId(conversationId: string): Promise<void>;
  appendMessage(message: Message): Promise<Message>;
  listMessages(options?: MessageListOptions): Promise<Message[]>;
  listRecentMessages(options: RecentMessageListOptions): Promise<Message[]>;
  upsertSummary(input: SummaryWriteInput): Promise<MemorySummary>;
  listSummaries(options?: SummaryListOptions): Promise<MemorySummary[]>;
  getSnapshot(): Promise<MemorySnapshot>;
  restoreSnapshot(snapshot: MemorySnapshotInput): Promise<void>;
  exportSnapshot(): Promise<MemorySnapshot>;
  importSnapshot(snapshot: MemorySnapshotInput): Promise<void>;
  close(): Promise<void>;
}
