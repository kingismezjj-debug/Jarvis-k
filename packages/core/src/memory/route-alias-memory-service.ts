import {
  UserControlledMemoryRecord,
  UserControlledMemoryRecordSchema,
  UserRouteAliasLearningProposal,
  UserRouteAliasLearningProposalSchema,
  UserRouteAliasRecord,
  UserRouteAliasRecordSchema,
  VoiceCommandAliasRecord,
  VoiceCommandAliasRecordSchema,
  createId,
} from "@jarvis-k/contracts";

export interface VoiceCommandAliasRepository {
  initialize(): Promise<void>;
  listAliases(): Promise<VoiceCommandAliasRecord[]>;
  upsertAlias(input: VoiceCommandAliasRecord): Promise<VoiceCommandAliasRecord>;
  deleteAlias(aliasId: string): Promise<boolean>;
}

export interface UserRouteAliasRepository {
  initialize(): Promise<void>;
  listAliases(): Promise<UserRouteAliasRecord[]>;
  upsertAlias(input: UserRouteAliasRecord): Promise<UserRouteAliasRecord>;
  deleteAlias(aliasId: string): Promise<boolean>;
}

export interface RouteAliasMemoryServiceOptions {
  routeAliasRepository?: UserRouteAliasRepository | undefined;
  voiceAliasRepository?: VoiceCommandAliasRepository | undefined;
  now: () => Date;
}

export interface SafeRouteAliasResolution {
  alias: UserRouteAliasRecord;
  safeUrl?: URL | undefined;
}

export interface UserRouteAliasConfirmationResult {
  status: "stored" | "store_unavailable" | "proposal_expired" | "url_blocked";
  alias?: UserRouteAliasRecord;
}

export class RouteAliasMemoryService {
  private readonly routeAliasRepository: UserRouteAliasRepository | undefined;
  private readonly voiceAliasRepository: VoiceCommandAliasRepository | undefined;
  private readonly now: () => Date;
  private readonly pendingRouteAliasProposals = new Map<
    string,
    UserRouteAliasLearningProposal
  >();

  public constructor(options: RouteAliasMemoryServiceOptions) {
    this.routeAliasRepository = options.routeAliasRepository;
    this.voiceAliasRepository = options.voiceAliasRepository;
    this.now = options.now;
  }

  public looksLikeLearningRequest(text: string): boolean {
    const normalized = text.trim();
    if (!/https?:\/\/\S+/iu.test(normalized)) {
      return false;
    }
    return /(?:\u8bb0\u4f4f|\u4fdd\u5b58|\u8bb0\u5f55|\u5b66\u4e00\u4e0b|remember|save|learn)/iu.test(
      normalized,
    );
  }

  public createLearningProposal(
    text: string,
  ): UserRouteAliasLearningProposal | undefined {
    const urlMatch = text.match(/https?:\/\/[^\s"'<>锛屻€傦紱]+/iu);
    const safeUrl = urlMatch ? normalizeHttpsUrl(urlMatch[0]) : undefined;
    if (!safeUrl) {
      return undefined;
    }
    const label = extractRouteAliasLabel(text) ?? "User route alias";
    const aliases = routeAliasesForLabel(label);
    return UserRouteAliasLearningProposalSchema.parse({
      id: createId("route_alias_proposal"),
      label,
      aliases,
      intent: "browser.open",
      targetUrl: safeUrl.href,
      targetHostname: safeUrl.hostname,
      requiresConfirmation: true,
      urlPolicy: "https_only_no_credentials_no_sensitive_query",
      directActionAttempted: false,
    });
  }

  public trackLearningProposal(proposal: UserRouteAliasLearningProposal): void {
    this.pendingRouteAliasProposals.set(proposal.id, proposal);
  }

  public async confirmRouteAlias(
    proposalId: string,
  ): Promise<UserRouteAliasConfirmationResult> {
    if (!this.routeAliasRepository) {
      return { status: "store_unavailable" };
    }
    const proposal = this.pendingRouteAliasProposals.get(proposalId);
    if (!proposal) {
      return { status: "proposal_expired" };
    }
    const safeUrl = normalizeHttpsUrl(proposal.targetUrl);
    if (!safeUrl) {
      this.pendingRouteAliasProposals.delete(proposal.id);
      return { status: "url_blocked" };
    }
    await this.routeAliasRepository.initialize();
    const now = this.now().toISOString();
    const record = UserRouteAliasRecordSchema.parse({
      id: createId("route_alias"),
      label: proposal.label,
      aliases: proposal.aliases,
      intent: "browser.open",
      targetUrl: safeUrl.href,
      targetHostname: safeUrl.hostname,
      source: "user_confirmed",
      risk: "medium",
      createdAt: now,
      updatedAt: now,
    });
    const alias = await this.routeAliasRepository.upsertAlias(record);
    this.pendingRouteAliasProposals.delete(proposal.id);
    return { status: "stored", alias };
  }

  public async listRouteAliases(): Promise<{
    aliases: UserRouteAliasRecord[];
    persisted: boolean;
  }> {
    if (!this.routeAliasRepository) {
      return { aliases: [], persisted: false };
    }
    await this.routeAliasRepository.initialize();
    return {
      aliases: await this.routeAliasRepository.listAliases(),
      persisted: true,
    };
  }

  public async deleteRouteAlias(aliasId: string): Promise<{
    deleted: boolean;
    persisted: boolean;
  }> {
    if (!this.routeAliasRepository) {
      return { deleted: false, persisted: false };
    }
    await this.routeAliasRepository.initialize();
    return {
      deleted: await this.routeAliasRepository.deleteAlias(aliasId),
      persisted: true,
    };
  }

  public async saveVoiceAlias(input: {
    rawAlias: string;
    normalizedTranscript: string;
    intent: VoiceCommandAliasRecord["intent"];
    slots: VoiceCommandAliasRecord["slots"];
  }): Promise<{ status: "stored" | "store_unavailable"; alias?: VoiceCommandAliasRecord }> {
    if (!this.voiceAliasRepository) {
      return { status: "store_unavailable" };
    }
    await this.voiceAliasRepository.initialize();
    const now = this.now().toISOString();
    const record = VoiceCommandAliasRecordSchema.parse({
      id: createId("voice_alias"),
      rawAlias: input.rawAlias,
      normalizedTranscript: input.normalizedTranscript,
      intent: input.intent,
      slots: input.slots,
      createdAt: now,
      updatedAt: now,
    });
    return {
      status: "stored",
      alias: await this.voiceAliasRepository.upsertAlias(record),
    };
  }

  public async listVoiceAliases(): Promise<{
    aliases: VoiceCommandAliasRecord[];
    persisted: boolean;
  }> {
    if (!this.voiceAliasRepository) {
      return { aliases: [], persisted: false };
    }
    await this.voiceAliasRepository.initialize();
    return {
      aliases: await this.voiceAliasRepository.listAliases(),
      persisted: true,
    };
  }

  public async deleteVoiceAlias(aliasId: string): Promise<{
    deleted: boolean;
    persisted: boolean;
  }> {
    if (!this.voiceAliasRepository) {
      return { deleted: false, persisted: false };
    }
    await this.voiceAliasRepository.initialize();
    return {
      deleted: await this.voiceAliasRepository.deleteAlias(aliasId),
      persisted: true,
    };
  }

  public async resolveRouteAliasByTarget(
    target: string,
  ): Promise<SafeRouteAliasResolution | undefined> {
    if (!this.routeAliasRepository) {
      return undefined;
    }
    const normalizedTarget = normalizeComparable(target);
    if (!normalizedTarget) {
      return undefined;
    }
    try {
      await this.routeAliasRepository.initialize();
      const aliases = await this.routeAliasRepository.listAliases();
      const alias = aliases.find((candidateAlias) =>
        [candidateAlias.label, ...candidateAlias.aliases].some((candidate) => {
          const normalizedAlias = normalizeComparable(candidate);
          return (
            normalizedAlias.length > 0 &&
            (normalizedTarget === normalizedAlias ||
              normalizedTarget.includes(normalizedAlias) ||
              normalizedAlias.includes(normalizedTarget))
          );
        }),
      );
      if (!alias) {
        return undefined;
      }
      return { alias, safeUrl: normalizeHttpsUrl(alias.targetUrl) };
    } catch {
      return undefined;
    }
  }

  public async resolveRouteAliasFromOpenTarget(
    openTarget: string,
  ): Promise<SafeRouteAliasResolution | undefined> {
    const normalizedTarget = normalizeComparable(openTarget);
    if (!normalizedTarget) {
      return undefined;
    }
    return this.resolveRouteAliasByTarget(normalizedTarget);
  }

  public async resolveVoiceAliasByText(
    text: string,
  ): Promise<VoiceCommandAliasRecord | undefined> {
    if (!this.voiceAliasRepository) {
      return undefined;
    }
    const normalizedText = normalizeComparable(text);
    if (!normalizedText) {
      return undefined;
    }
    try {
      await this.voiceAliasRepository.initialize();
      const matches = (await this.voiceAliasRepository.listAliases()).filter(
        (alias) =>
          [alias.rawAlias, alias.normalizedTranscript].some((candidate) => {
            const normalizedCandidate = normalizeComparable(candidate);
            return (
              normalizedCandidate.length > 0 &&
              normalizedText === normalizedCandidate
            );
          }),
      );
      if (matches.length !== 1) {
        return undefined;
      }
      return matches[0];
    } catch {
      return undefined;
    }
  }

  public async listUserControlledRecords(input: {
    summarizeSlots(slots: VoiceCommandAliasRecord["slots"]): string;
  }): Promise<{ memories: UserControlledMemoryRecord[]; persisted: boolean }> {
    const memories: UserControlledMemoryRecord[] = [];
    let persisted = false;
    const voiceAliases = await this.listVoiceAliases();
    persisted = persisted || voiceAliases.persisted;
    for (const alias of voiceAliases.aliases) {
      memories.push(
        UserControlledMemoryRecordSchema.parse({
          id: `voice_command_alias:${alias.id}`,
          sourceId: alias.id,
          kind: "voice_command_alias",
          label: alias.rawAlias,
          summary: `${alias.intent} / ${input.summarizeSlots(alias.slots)}`,
          source: "voice_correction_alias",
          risk: "low",
          deletable: true,
          rawContentExposed: false,
          createdAt: alias.createdAt,
          updatedAt: alias.updatedAt,
        }),
      );
    }

    const routeAliases = await this.listRouteAliases();
    persisted = persisted || routeAliases.persisted;
    for (const alias of routeAliases.aliases) {
      memories.push(
        UserControlledMemoryRecordSchema.parse({
          id: `route_alias:${alias.id}`,
          sourceId: alias.id,
          kind: "route_alias",
          label: alias.label,
          summary: `${alias.intent} / ${alias.targetHostname}`,
          source: "user_confirmed_route_alias",
          risk: alias.risk,
          deletable: true,
          rawContentExposed: false,
          createdAt: alias.createdAt,
          updatedAt: alias.updatedAt,
        }),
      );
    }

    return { memories, persisted };
  }

  public countRepositoriesConfigured(): {
    voiceAliasesConfigured: boolean;
    routeAliasesConfigured: boolean;
  } {
    return {
      voiceAliasesConfigured: this.voiceAliasRepository !== undefined,
      routeAliasesConfigured: this.routeAliasRepository !== undefined,
    };
  }

}

export function normalizeRouteAliasHttpsUrl(value: string): URL | undefined {
  return normalizeHttpsUrl(value);
}

function extractRouteAliasLabel(text: string): string | undefined {
  const comparable = normalizeComparable(text);
  if (
    comparable.includes("izytoken") ||
    comparable.includes("easytoken") ||
    comparable.includes("\u4e00\u53eatoken")
  ) {
    return "IZYtoken admin";
  }
  const withoutUrl = text.replace(/https?:\/\/[^\s"'<>锛屻€傦紱]+/giu, " ");
  const labelMatch = withoutUrl.match(
    /(?:\u8bb0\u4f4f|\u4fdd\u5b58|\u8bb0\u5f55|remember|save|learn)\s*(.+?)(?:\u5730\u5740|url|URL|\u662f|\u4e3a|as|to)/u,
  );
  const label = labelMatch?.[1]?.trim();
  if (!label || label.length < 2 || label.length > 80) {
    return undefined;
  }
  return stripSpeechPunctuation(label);
}

function routeAliasesForLabel(label: string): string[] {
  const aliases = new Set<string>([label]);
  const comparable = normalizeComparable(label);
  if (comparable.includes("izytoken")) {
    aliases.add("IZYtoken admin");
    aliases.add("IZYtoken \u540e\u53f0");
    aliases.add("easy TOKEN \u540e\u53f0");
    aliases.add("\u4e00\u53eatoken\u540e\u53f0");
    aliases.add("izytoken\u540e\u53f0");
  }
  return Array.from(aliases).slice(0, 12);
}

function normalizeHttpsUrl(value: string): URL | undefined {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") {
      return undefined;
    }
    if (url.username || url.password || url.hash) {
      return undefined;
    }
    const sensitiveQueryPattern =
      /(?:token|secret|password|passwd|pwd|key|apikey|api_key|auth|signature|sig|access[_-]?token|refresh[_-]?token|code)/iu;
    for (const key of url.searchParams.keys()) {
      if (sensitiveQueryPattern.test(key)) {
        return undefined;
      }
    }
    if (url.href.length > 300) {
      return undefined;
    }
    return url;
  } catch {
    return undefined;
  }
}

function normalizeComparable(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\b(?:easy\s*token|izy\s*token|i\s*z\s*y\s*token)\b/giu, "izytoken")
    .replace(/\s+/gu, "")
    .replace(
      /[._\-:;!?"'`()+\[\]{}<>/\\|\u3002\uff0c\uff1b\uff1a\uff01\uff1f\u201c\u201d\u2018\u2019\uff08\uff09\u3010\u3011]+/gu,
      "",
    );
}

function stripSpeechPunctuation(value: string): string {
  return value
    .replace(
      /[\u3002\uff0c\uff1b\uff1a\uff01\uff1f\u201c\u201d\u2018\u2019.,;:!?]+$/gu,
      "",
    )
    .trim();
}
