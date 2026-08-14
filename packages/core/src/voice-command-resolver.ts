import {
  BrainIntent,
  BrainRouterDecision,
  BrainRouterDecisionSchema,
  VoiceCommandAliasRecord,
  VoiceCommandCorrection,
  VoiceCommandCorrectionCandidate,
  VoiceCommandCorrectionSchema,
  VoiceInputMode,
} from "@jarvis-k/contracts";

export interface VoiceCommandResolverPluginCapability {
  pluginId: string;
  capability: string;
  aliases?: readonly string[];
}

export interface VoiceCommandResolverInput {
  rawTranscript: string;
  requestedMode?: VoiceInputMode;
  aliases?: readonly VoiceCommandAliasRecord[];
  pluginCapabilities?: readonly VoiceCommandResolverPluginCapability[];
}

interface CandidateTemplate {
  id: string;
  label: string;
  normalizedTranscript: string;
  intent: BrainIntent;
  slots: Record<string, unknown>;
  aliases: readonly string[];
}

const BUILTIN_COMMANDS: readonly CandidateTemplate[] = [
  {
    id: "open.vscode",
    label: "Open VS Code",
    normalizedTranscript: "open vscode",
    intent: "localApp.open",
    slots: { target: "vscode" },
    aliases: [
      "open vs code",
      "open vscode",
      "open v s code",
      "\u6253\u5f00vs code",
      "\u6253\u5f00vscode",
      "\u6253\u5f00\u5fae\u7231\u6b7b\u6263\u7684",
      "\u6253\u5f00\u5fae\u7231\u6b7b\u6263",
      "\u6253\u5f00\u5fae\u7231\u6b7bcode",
      "\u6253\u5f00vs\u6263\u7684",
    ],
  },
  {
    id: "open.notepad",
    label: "Open Notepad",
    normalizedTranscript: "open notepad",
    intent: "localApp.open",
    slots: { target: "notepad" },
    aliases: [
      "open notepad",
      "\u6253\u5f00notepad",
      "\u6253\u5f00\u8bb0\u4e8b\u672c",
      "\u6253\u5f00\u8bb0\u4e8b\u7c3f",
      "\u6253\u5f00\u7b14\u8bb0\u672c",
    ],
  },
  {
    id: "open.calculator",
    label: "Open Calculator",
    normalizedTranscript: "open calculator",
    intent: "localApp.open",
    slots: { target: "calculator" },
    aliases: [
      "open calculator",
      "open calc",
      "\u6253\u5f00\u8ba1\u7b97\u5668",
      "\u6253\u5f00\u8ba1\u7b97\u6c14",
      "\u6253\u5f00\u8ba1\u7b97\u673a",
    ],
  },
  {
    id: "open.powershell",
    label: "Open PowerShell",
    normalizedTranscript: "open powershell",
    intent: "localApp.open",
    slots: { target: "powershell" },
    aliases: [
      "open powershell",
      "\u6253\u5f00powershell",
      "\u6253\u5f00power shell",
    ],
  },
  {
    id: "open.github",
    label: "Open GitHub",
    normalizedTranscript: "open GitHub",
    intent: "browser.open",
    slots: { target: "GitHub" },
    aliases: [
      "open github",
      "\u6253\u5f00github",
      "\u6253\u5f00git hub",
      "\u6253\u5f00\u9e21\u7279\u54c8\u5e03",
    ],
  },
  {
    id: "open.izytoken.admin",
    label: "Open IZYtoken admin",
    normalizedTranscript: "open IZYtoken admin",
    intent: "browser.open",
    slots: { target: "IZYtoken admin" },
    aliases: [
      "\u6253\u5f00izytoken\u540e\u53f0",
      "\u6253\u5f00izy token\u540e\u53f0",
      "\u6253\u5f00\u4e00\u53eatoken\u540e\u53f0",
      "\u6253\u5f00\u4e00\u53eatoken",
      "\u6253\u5f00izy\u540e\u53f0",
    ],
  },
  {
    id: "coding.codex",
    label: "Ask Codex to inspect the project",
    normalizedTranscript: "Codex check project",
    intent: "coding.task",
    slots: { target: "codex", action: "check_project" },
    aliases: [
      "\u8ba9Codex\u68c0\u67e5\u9879\u76ee",
      "\u8ba9\u6263\u7684\u514b\u65af\u68c0\u67e5\u9879\u76ee",
      "\u8ba9\u6263\u7684\u514b\u65af\u68c0\u67e5\u4e00\u4e0b\u9879\u76ee",
      "codex check project",
    ],
  },
  {
    id: "query.qwen",
    label: "Query Qwen status",
    normalizedTranscript: "query Qwen status",
    intent: "model.status",
    slots: { target: "qwen" },
    aliases: [
      "\u67e5\u8be2qwen",
      "\u67e5\u8be2\u5343\u95ee",
      "\u68c0\u67e5qwen",
      "qwen status",
    ],
  },
  {
    id: "query.deepseek",
    label: "Query DeepSeek status",
    normalizedTranscript: "query DeepSeek status",
    intent: "model.status",
    slots: { target: "deepseek" },
    aliases: [
      "\u67e5\u8be2deepseek",
      "\u67e5\u8be2deep seek",
      "\u68c0\u67e5deepseek",
    ],
  },
  {
    id: "query.jarvis",
    label: "Ask about Jarvis-K",
    normalizedTranscript: "what is Jarvis-K",
    intent: "chat.answer",
    slots: {},
    aliases: [
      "\u4ec0\u4e48\u662fjarvis-k",
      "\u4ec0\u4e48\u662fjarvis k",
      "\u4ecb\u7ecdjarvis-k",
    ],
  },
];

const AMBIGUOUS_MARGIN = 0.04;
const AUTO_ACCEPT_CONFIDENCE = 0.82;

export class VoiceCommandResolver {
  public resolve(input: VoiceCommandResolverInput): VoiceCommandCorrection {
    const rawTranscript = input.rawTranscript.trim();
    const requestedMode = input.requestedMode;
    const inputMode = requestedMode ?? inferVoiceInputMode(rawTranscript);
    if (inputMode !== "command") {
      return VoiceCommandCorrectionSchema.parse({
        rawTranscript,
        normalizedTranscript: rawTranscript,
        inputMode,
        correctionSource: "raw",
        correctionConfidence: 1,
        correctionCandidates: [],
        requiresUserSelection: false,
        rawTranscriptPreserved: true,
        directActionAttempted: false,
      });
    }

    const candidates = [
      ...aliasCandidates(input.aliases ?? []),
      ...BUILTIN_COMMANDS,
      ...pluginCandidates(input.pluginCapabilities ?? []),
      ...slotGrammarCandidates(rawTranscript),
    ]
      .map((template) => scoreCandidate(rawTranscript, template))
      .filter((candidate) => candidate.confidence >= 0.55)
      .sort((left, right) => right.confidence - left.confidence);

    const uniqueCandidates = dedupeCandidates(candidates).slice(0, 2);
    const best = uniqueCandidates[0];
    if (best === undefined) {
      return VoiceCommandCorrectionSchema.parse({
        rawTranscript,
        normalizedTranscript: rawTranscript,
        inputMode: "command",
        correctionSource: "unknown",
        correctionConfidence: 0,
        correctionCandidates: [],
        requiresUserSelection: true,
        rawTranscriptPreserved: true,
        directActionAttempted: false,
      });
    }

    const second = uniqueCandidates[1];
    const ambiguous =
      second !== undefined &&
      best.confidence - second.confidence <= AMBIGUOUS_MARGIN;
    const requiresUserSelection =
      best.confidence < AUTO_ACCEPT_CONFIDENCE || ambiguous;

    return VoiceCommandCorrectionSchema.parse({
      rawTranscript,
      normalizedTranscript: requiresUserSelection
        ? rawTranscript
        : best.normalizedTranscript,
      inputMode: "command",
      correctionSource: requiresUserSelection
        ? "structured_candidate_selector"
        : best.correctionSource,
      correctionConfidence: best.confidence,
      correctionCandidates: uniqueCandidates,
      requiresUserSelection,
      rawTranscriptPreserved: true,
      directActionAttempted: false,
    });
  }

  public decisionFromCandidate(
    candidate: VoiceCommandCorrectionCandidate,
  ): BrainRouterDecision {
    return BrainRouterDecisionSchema.parse({
      intent: candidate.intent,
      confidence: candidate.confidence,
      requiresApproval: false,
      slots: candidate.slots,
      reason: `Voice command correction selected structured candidate ${candidate.id}.`,
    });
  }
}

function inferVoiceInputMode(text: string): VoiceInputMode {
  const normalized = normalizeLoose(text);
  if (
    startsWithAny(normalized, [
      "dictate",
      "type",
      "\u8f93\u5165",
      "\u5199\u5165",
      "\u8bb0\u5f55",
    ])
  ) {
    return "dictation";
  }
  if (
    startsWithAny(normalized, [
      "open",
      "\u6253\u5f00",
      "search",
      "\u641c\u7d22",
      "\u67e5\u627e",
      "query",
      "\u67e5\u8be2",
      "\u68c0\u67e5",
      "\u4f7f\u7528",
      "use",
      "\u8ba9",
      "ask",
    ])
  ) {
    return "command";
  }
  if (
    normalized.includes("codex") &&
    (normalized.includes("check") || normalized.includes("project"))
  ) {
    return "command";
  }
  return "conversation";
}

function aliasCandidates(
  aliases: readonly VoiceCommandAliasRecord[],
): CandidateTemplate[] {
  return aliases.map((alias) => ({
    id: `alias.${alias.id}`,
    label: `Personal alias: ${alias.rawAlias}`,
    normalizedTranscript: alias.normalizedTranscript,
    intent: alias.intent,
    slots: alias.slots,
    aliases: [alias.rawAlias, alias.normalizedTranscript],
  }));
}

function pluginCandidates(
  capabilities: readonly VoiceCommandResolverPluginCapability[],
): CandidateTemplate[] {
  return capabilities.map((capability) => ({
    id: `plugin.${capability.pluginId}.${capability.capability}`,
    label: `Use plugin ${capability.capability}`,
    normalizedTranscript: `use plugin ${capability.capability}`,
    intent: "plugin.invoke",
    slots: {
      pluginId: capability.pluginId,
      capability: capability.capability,
      input: {},
    },
    aliases: [
      `use plugin ${capability.capability}`,
      `\u4f7f\u7528\u63d2\u4ef6${capability.capability}`,
      ...(capability.aliases ?? []),
    ],
  }));
}

function slotGrammarCandidates(rawTranscript: string): CandidateTemplate[] {
  const text = rawTranscript.trim();
  const candidates: CandidateTemplate[] = [];
  const openTarget = stripPrefix(text, ["\u6253\u5f00", "open"]);
  if (openTarget) {
    const target = openTarget.trim();
    candidates.push({
      id: `slot.open.${normalizeLoose(target)}`,
      label: `Open ${target}`,
      normalizedTranscript: `open ${target}`,
      intent: looksLikeUrlOrSite(target) ? "browser.open" : "localApp.open",
      slots: { target },
      aliases: [text],
    });
  }
  const searchQuery = stripPrefix(text, [
    "\u641c\u7d22",
    "\u67e5\u627e",
    "search",
  ]);
  if (searchQuery) {
    const query = searchQuery.trim();
    candidates.push({
      id: `slot.search.${normalizeLoose(query)}`,
      label: `Search ${query}`,
      normalizedTranscript: `search ${query}`,
      intent: "filesystem.search",
      slots: { query },
      aliases: [text],
    });
  }
  const queryTarget = stripPrefix(text, [
    "\u67e5\u8be2",
    "\u68c0\u67e5",
    "query",
  ]);
  if (queryTarget) {
    const target = queryTarget.trim();
    candidates.push({
      id: `slot.query.${normalizeLoose(target)}`,
      label: `Query ${target}`,
      normalizedTranscript: `query ${target}`,
      intent: "model.status",
      slots: { target },
      aliases: [text],
    });
  }
  const pluginText = stripPrefix(text, ["\u4f7f\u7528", "use"]);
  const pluginMatch = pluginText?.match(
    /^(?:\u63d2\u4ef6)?\s*(?<plugin>[\w.\-\u4e00-\u9fa5]+)\s*(?<action>.*)$/iu,
  );
  if (pluginMatch?.groups?.plugin) {
    const plugin = pluginMatch.groups.plugin.trim();
    const action = (pluginMatch.groups.action ?? "").trim();
    candidates.push({
      id: `slot.plugin.${normalizeLoose(plugin)}.${normalizeLoose(action)}`,
      label: `Use plugin ${plugin}`,
      normalizedTranscript: `use plugin ${plugin} ${action}`.trim(),
      intent: "plugin.invoke",
      slots: { pluginId: plugin, capability: action || plugin, input: {} },
      aliases: [text],
    });
  }
  return candidates;
}

function scoreCandidate(
  rawTranscript: string,
  template: CandidateTemplate,
): VoiceCommandCorrectionCandidate {
  const rawNormalized = normalizeLoose(rawTranscript);
  const rawPhonetic = normalizePhoneticMandarin(rawTranscript);
  const aliasScores = template.aliases.map((alias) =>
    Math.max(
      similarity(rawNormalized, normalizeLoose(alias)),
      similarity(rawPhonetic, normalizePhoneticMandarin(alias)),
    ),
  );
  const normalizedScore = Math.max(
    similarity(rawNormalized, normalizeLoose(template.normalizedTranscript)),
    similarity(
      rawPhonetic,
      normalizePhoneticMandarin(template.normalizedTranscript),
    ),
  );
  const bestScore = Math.max(normalizedScore, ...aliasScores);
  const exactAlias = template.aliases.some(
    (alias) => normalizeLoose(alias) === rawNormalized,
  );
  const slotGrammar = template.id.startsWith("slot.");
  const correctionSource = slotGrammar
    ? "slot_grammar"
    : exactAlias
      ? "alias"
      : /[a-z]/iu.test(rawTranscript)
        ? "english_normalization"
        : bestScore >= 0.78
          ? "pinyin_similarity"
          : "slot_grammar";
  const confidence = slotGrammar
    ? Math.min(0.74, Number(bestScore.toFixed(3)))
    : Math.min(1, exactAlias ? 0.98 : Number(bestScore.toFixed(3)));
  return {
    id: template.id,
    normalizedTranscript: template.normalizedTranscript,
    inputMode: "command",
    intent: template.intent,
    confidence,
    correctionSource,
    label: template.label,
    slots: template.slots,
  };
}

function dedupeCandidates(
  candidates: readonly VoiceCommandCorrectionCandidate[],
): VoiceCommandCorrectionCandidate[] {
  const seen = new Set<string>();
  const result: VoiceCommandCorrectionCandidate[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.intent}:${JSON.stringify(candidate.slots)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

function stripPrefix(
  text: string,
  prefixes: readonly string[],
): string | undefined {
  const trimmed = text.trim();
  const normalized = normalizeLoose(trimmed);
  for (const prefix of prefixes) {
    const normalizedPrefix = normalizeLoose(prefix);
    if (normalized.startsWith(normalizedPrefix)) {
      const value = trimmed.slice(prefix.length).trim();
      return value.length > 0 ? value : undefined;
    }
  }
  return undefined;
}

function normalizeLoose(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\bv\s*[\.\s]*s\s*[\.\s]*code\b/giu, "vscode")
    .replace(/\bdeep\s*seek\b/giu, "deepseek")
    .replace(/\bgit\s*hub\b/giu, "github")
    .replace(/\bpower\s*shell\b/giu, "powershell")
    .replace(/\s+/gu, "")
    .replace(/[,，.。!?！？、:：;"'`~\-_/\\()[\]{}]/gu, "");
}

function normalizePhoneticMandarin(value: string): string {
  return normalizeLoose(value)
    .replace(/\u5fae\u7231\u6b7b(?:\u6263|\u53e3)(?:\u7684)?/gu, "vscode")
    .replace(/vs(?:\u6263|\u53e3)(?:\u7684)?/gu, "vscode")
    .replace(/\u4e00\u53eatoken/gu, "izytoken")
    .replace(/\u6263\u7684\u514b\u65af/gu, "codex")
    .replace(/\u9e21\u7279\u54c8\u5e03/gu, "github")
    .replace(/\u5343\u95ee/gu, "qwen")
    .replace(/\u8bb0\u4e8b\u7c3f|\u7b14\u8bb0\u672c/gu, "\u8bb0\u4e8b\u672c")
    .replace(/\u8ba1\u7b97\u6c14|\u8ba1\u7b97\u673a/gu, "\u8ba1\u7b97\u5668");
}

function startsWithAny(value: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => value.startsWith(normalizeLoose(prefix)));
}

function similarity(left: string, right: string): number {
  if (left === right) {
    return 1;
  }
  if (left.includes(right) || right.includes(left)) {
    return 0.92;
  }
  const distance = levenshtein(left, right);
  const length = Math.max(left.length, right.length, 1);
  return Math.max(0, 1 - distance / length);
}

function levenshtein(left: string, right: string): number {
  const rows: number[][] = Array.from({ length: left.length + 1 }, () =>
    Array.from({ length: right.length + 1 }, () => 0),
  );
  for (let row = 0; row <= left.length; row += 1) {
    rows[row]![0] = row;
  }
  for (let column = 1; column <= right.length; column += 1) {
    rows[0]![column] = column;
  }
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row]![column] = Math.min(
        rows[row - 1]![column]! + 1,
        rows[row]![column - 1]! + 1,
        rows[row - 1]![column - 1]! + cost,
      );
    }
  }
  return rows[left.length]![right.length]!;
}

function looksLikeUrlOrSite(target: string): boolean {
  return /github|git hub|token|http|www|\.com|\u540e\u53f0|admin/iu.test(
    target,
  );
}
