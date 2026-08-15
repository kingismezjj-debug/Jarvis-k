import {
  UserControlledMemoryRecord,
  UserControlledMemoryRecordSchema,
  UserPreferenceMemoryRecord,
  UserPreferenceMemoryRecordSchema,
} from "@jarvis-k/contracts";

export interface UserPreferenceMemoryRepository {
  initialize(): Promise<void>;
  listPreferences(): Promise<UserPreferenceMemoryRecord[]>;
  upsertPreference(
    input: UserPreferenceMemoryRecord,
  ): Promise<UserPreferenceMemoryRecord>;
  deletePreference(preferenceId: string): Promise<boolean>;
}

export type ResolvedUserPreferenceMemoryRequest = Pick<
  UserPreferenceMemoryRecord,
  "key" | "label" | "value" | "summary"
>;

export interface UserPreferenceMemoryPersistResult {
  resolvedPreference?: ResolvedUserPreferenceMemoryRequest;
  preference?: UserPreferenceMemoryRecord;
  canPersist: boolean;
}

export interface UserPreferenceMemoryServiceOptions {
  repository?: UserPreferenceMemoryRepository | undefined;
  now: () => Date;
}

export class UserPreferenceMemoryService {
  private readonly repository: UserPreferenceMemoryRepository | undefined;
  private readonly now: () => Date;

  public constructor(options: UserPreferenceMemoryServiceOptions) {
    this.repository = options.repository;
    this.now = options.now;
  }

  public resolve(
    text: string,
  ): ResolvedUserPreferenceMemoryRequest | undefined {
    const normalized = normalizePreferenceComparable(text);
    const hasMemoryCue =
      /(?:\u8bb0\u4f4f|\u4fdd\u5b58|\u8bb0\u5f55|\u4ee5\u540e|\u4ee5\u540e\u9ed8\u8ba4|remember|save)/iu.test(
        text,
      ) || normalized.includes("default");
    if (!hasMemoryCue) {
      return undefined;
    }
    if (
      normalized.includes("\u4e2d\u6587\u56de\u7b54") ||
      normalized.includes("\u4e2d\u6587\u56de\u590d") ||
      normalized.includes("\u7528\u4e2d\u6587\u56de\u7b54") ||
      normalized.includes("\u7528\u4e2d\u6587\u56de\u590d") ||
      normalized.includes("chinesereplies") ||
      normalized.includes("replyinchinese")
    ) {
      return {
        key: "response_language",
        label: "Response language",
        value: "zh",
        summary: "Prefer Chinese replies",
      };
    }
    if (
      normalized.includes("\u7b80\u77ed\u56de\u7b54") ||
      normalized.includes("\u7b80\u77ed\u56de\u590d") ||
      normalized.includes("\u7b80\u77ed\u4e00\u70b9") ||
      normalized.includes("\u77ed\u56de\u7b54") ||
      normalized.includes("shortanswers") ||
      normalized.includes("briefanswers") ||
      normalized.includes("keepitshort")
    ) {
      return {
        key: "response_length",
        label: "Response length",
        value: "short",
        summary: "Prefer short replies",
      };
    }
    if (
      normalized.includes("\u8be6\u7ec6\u56de\u7b54") ||
      normalized.includes("\u8be6\u7ec6\u56de\u590d") ||
      normalized.includes("\u8be6\u7ec6\u4e00\u70b9") ||
      normalized.includes("\u5c55\u5f00\u56de\u7b54") ||
      normalized.includes("detailedanswers") ||
      normalized.includes("moredetail")
    ) {
      return {
        key: "response_length",
        label: "Response length",
        value: "detailed",
        summary: "Prefer detailed replies",
      };
    }
    if (
      normalized.includes("\u53cb\u597d\u4e00\u70b9") ||
      normalized.includes("\u8bed\u6c14\u53cb\u597d") ||
      normalized.includes("\u6e29\u548c\u4e00\u70b9") ||
      normalized.includes("friendlytone") ||
      normalized.includes("friendlystyle")
    ) {
      return {
        key: "response_style",
        label: "Response style",
        value: "friendly",
        summary: "Prefer friendly tone",
      };
    }
    if (
      normalized.includes("\u4e13\u4e1a\u4e00\u70b9") ||
      normalized.includes("\u6280\u672f\u98ce\u683c") ||
      normalized.includes("\u4e13\u4e1a\u98ce\u683c") ||
      normalized.includes("technicaltone") ||
      normalized.includes("technicalstyle")
    ) {
      return {
        key: "response_style",
        label: "Response style",
        value: "technical",
        summary: "Prefer technical tone",
      };
    }
    if (
      normalized.includes("\u76f4\u63a5\u4e00\u70b9") ||
      normalized.includes("\u7b80\u6d01\u98ce\u683c") ||
      normalized.includes("\u7b80\u6d01\u4e00\u70b9") ||
      normalized.includes("concisestyle") ||
      normalized.includes("concisetone")
    ) {
      return {
        key: "response_style",
        label: "Response style",
        value: "concise",
        summary: "Prefer concise tone",
      };
    }
    return undefined;
  }

  public async persistResolved(
    resolvedPreference: ResolvedUserPreferenceMemoryRequest,
  ): Promise<UserPreferenceMemoryPersistResult> {
    if (!this.repository) {
      return {
        resolvedPreference,
        canPersist: false,
      };
    }
    await this.repository.initialize();
    const existing = (await this.repository.listPreferences()).find(
      (record) => record.key === resolvedPreference.key,
    );
    const now = this.now().toISOString();
    const preference = await this.repository.upsertPreference(
      UserPreferenceMemoryRecordSchema.parse({
        id: existing?.id ?? `preference_${resolvedPreference.key}`,
        key: resolvedPreference.key,
        label: resolvedPreference.label,
        value: resolvedPreference.value,
        summary: resolvedPreference.summary,
        source: "user_confirmed_preference",
        risk: "low",
        enabled: true,
        appliesTo: "ui_projection_only",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }),
    );
    return {
      resolvedPreference,
      preference,
      canPersist: true,
    };
  }

  public async recognizeAndPersist(
    text: string,
  ): Promise<UserPreferenceMemoryPersistResult | undefined> {
    const resolvedPreference = this.resolve(text);
    if (!resolvedPreference) {
      return undefined;
    }
    return this.persistResolved(resolvedPreference);
  }

  public async listUserControlledRecords(): Promise<{
    memories: UserControlledMemoryRecord[];
    persisted: boolean;
  }> {
    if (!this.repository) {
      return { memories: [], persisted: false };
    }
    await this.repository.initialize();
    const memories = (await this.repository.listPreferences()).map((preference) =>
      UserControlledMemoryRecordSchema.parse({
        id: `preference:${preference.id}`,
        sourceId: preference.id,
        kind: "preference",
        label: preference.label,
        summary: preference.summary,
        preferenceKey: preference.key,
        preferenceValue: preference.value,
        source: preference.source,
        risk: preference.risk,
        deletable: true,
        rawContentExposed: false,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt,
      }),
    );
    return { memories, persisted: true };
  }

  public async delete(preferenceId: string): Promise<{
    deleted: boolean;
    persisted: boolean;
  }> {
    if (!this.repository) {
      return { deleted: false, persisted: false };
    }
    await this.repository.initialize();
    return {
      deleted: await this.repository.deletePreference(preferenceId),
      persisted: true,
    };
  }
}

function normalizePreferenceComparable(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[\s_\-"'`.,:;!?()[\]{}<>/\\|]+/gu, "")
    .trim();
}
