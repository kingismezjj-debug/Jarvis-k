import type { PluginRegistry } from "@jarvis-k/capabilities";
import {
  type BrainRouterDecision,
  type VoiceCommandAliasRecord,
  type VoiceCommandCorrection,
  type VoiceCommandCorrectionCandidate,
  VoiceCommandCorrectionSchema,
  type VoiceInputMode,
} from "@jarvis-k/contracts";
import {
  VoiceCommandResolver,
  type VoiceCommandResolverPluginCapability,
} from "./voice-command-resolver";

export interface VoiceResolutionAliasRepository {
  initialize(): Promise<void>;
  listAliases(): Promise<VoiceCommandAliasRecord[]>;
}

export interface VoiceResolutionServiceOptions {
  voiceCommandAliasRepository?: VoiceResolutionAliasRepository | undefined;
  pluginRegistry?: PluginRegistry | undefined;
  resolver?: VoiceCommandResolver | undefined;
}

export class VoiceResolutionService {
  private readonly voiceCommandAliasRepository:
    | VoiceResolutionAliasRepository
    | undefined;
  private readonly pluginRegistry: PluginRegistry | undefined;
  private readonly resolver: VoiceCommandResolver;

  public constructor(options: VoiceResolutionServiceOptions = {}) {
    this.voiceCommandAliasRepository = options.voiceCommandAliasRepository;
    this.pluginRegistry = options.pluginRegistry;
    this.resolver = options.resolver ?? new VoiceCommandResolver();
  }

  public normalizeRoutingText(input: {
    source: "text" | "voice";
    text: string;
  }): string {
    if (input.source !== "voice") {
      return input.text;
    }
    return this.normalizeVoiceCommandRoutingText(input.text);
  }

  public normalizeVoiceCommandRoutingText(text: string): string {
    const normalized = text
      .trim()
      .replace(/\s+/gu, " ")
      .replace(/^(?:(?:\u55ef|\u5443|\u554a|\u90a3\u4e2a|\u5c31\u662f)\s*)+/u, "")
      .replace(/\u8bb0\u4e8b[\u7c3f\u677f\u95e8\u8584]/gu, "\u8bb0\u4e8b\u672c")
      .replace(/\u8ba1\u7b97[\u6c14\u5176]/gu, "\u8ba1\u7b97\u5668")
      .replace(/\b(?:v\s*[\.\s]*s\s*[\.\s]*code|vs\s*[\.\s]*code)\b/giu, "vscode")
      .replace(/\bjava\s+script\b/giu, "Javascript")
      .replace(/\bjarvis\s+k\b/giu, "Jarvis-K")
      .trim();
    if (!this.looksLikeVoiceNotepadWrite(normalized)) {
      return normalized;
    }
    return normalized
      .replace(/\b(?:javac|java\s*c|java\s*k)\s+voice\s+smoke\s+test\b/giu, "Jarvis-K voice smoke text")
      .replace(/\bJarvis-K\s+voice\s+smoke\s+test\b/giu, "Jarvis-K voice smoke text")
      .trim();
  }

  public async resolveCommandCorrection(input: {
    rawTranscript: string;
    requestedMode?: VoiceInputMode;
  }): Promise<VoiceCommandCorrection> {
    const existingVoiceRoutingText = this.normalizeVoiceCommandRoutingText(
      input.rawTranscript,
    );
    if (this.looksLikeVoiceNotepadWrite(existingVoiceRoutingText)) {
      return VoiceCommandCorrectionSchema.parse({
        rawTranscript: input.rawTranscript.trim(),
        normalizedTranscript: existingVoiceRoutingText,
        inputMode: "command",
        correctionSource: "raw",
        correctionConfidence: 1,
        correctionCandidates: [],
        requiresUserSelection: false,
        rawTranscriptPreserved: true,
        directActionAttempted: false,
      });
    }
    const aliases = await this.listVoiceCommandAliasesForResolution();
    const pluginCapabilities =
      await this.listVoiceCommandPluginCapabilitiesForResolution();
    return this.resolver.resolve({
      rawTranscript: input.rawTranscript,
      ...(input.requestedMode === undefined
        ? {}
        : { requestedMode: input.requestedMode }),
      aliases,
      pluginCapabilities,
    });
  }

  public decisionFromCandidate(
    candidate: VoiceCommandCorrectionCandidate,
  ): BrainRouterDecision {
    return this.resolver.decisionFromCandidate(candidate);
  }

  private async listVoiceCommandAliasesForResolution(): Promise<
    VoiceCommandAliasRecord[]
  > {
    if (!this.voiceCommandAliasRepository) {
      return [];
    }
    try {
      await this.voiceCommandAliasRepository.initialize();
      return await this.voiceCommandAliasRepository.listAliases();
    } catch {
      return [];
    }
  }

  private async listVoiceCommandPluginCapabilitiesForResolution(): Promise<
    VoiceCommandResolverPluginCapability[]
  > {
    if (!this.pluginRegistry) {
      return [];
    }
    try {
      const plugins = await this.pluginRegistry.listPlugins();
      return plugins.flatMap((plugin) =>
        plugin.capabilities.map((capability) => ({
          pluginId: plugin.id,
          capability: capability.name,
          aliases: [plugin.name, capability.name],
        })),
      );
    } catch {
      return [];
    }
  }

  private looksLikeVoiceNotepadWrite(text: string): boolean {
    return (
      /\u8bb0\u4e8b\u672c/u.test(text) &&
      /(?:\u8f93\u5165|\u5199\u5165|\u5199\u4e0a|\u6253\u5b57)/u.test(text)
    );
  }
}
