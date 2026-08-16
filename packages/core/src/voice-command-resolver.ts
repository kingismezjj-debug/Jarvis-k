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

export interface VoiceCommandResolverRouteAlias {
  label: string;
  target: string;
}

export interface VoiceCommandResolverInput {
  rawTranscript: string;
  requestedMode?: VoiceInputMode;
  aliases?: readonly VoiceCommandAliasRecord[];
  routeAliases?: readonly VoiceCommandResolverRouteAlias[];
  pluginCapabilities?: readonly VoiceCommandResolverPluginCapability[];
}

interface CandidateTemplate {
  id: string;
  label: string;
  normalizedTranscript: string;
  intent: BrainIntent;
  slots: Record<string, unknown>;
  aliases: readonly string[];
  confidence?: number;
  confidenceCap?: number;
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
      if (looksQuotedOrNegated(rawTranscript) && containsCommandVerb(rawTranscript)) {
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

    if (looksDangerousCommand(rawTranscript)) {
      return VoiceCommandCorrectionSchema.parse({
        rawTranscript,
        normalizedTranscript: "blocked",
        inputMode: "command",
        correctionSource: "slot_grammar",
        correctionConfidence: 0.99,
        correctionCandidates: [
          {
            id: "safety.block.dangerous-command",
            normalizedTranscript: "blocked",
            inputMode: "command",
            intent: "blocked",
            confidence: 0.99,
            correctionSource: "slot_grammar",
            label: "Block dangerous command",
            slots: {},
          },
        ],
        requiresUserSelection: false,
        rawTranscriptPreserved: true,
        directActionAttempted: false,
      });
    }

    if (
      looksQuotedOrNegated(rawTranscript) &&
      containsCommandVerb(rawTranscript) &&
      !looksWriteCommandWithBenignSaveModifier(rawTranscript)
    ) {
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

    const grammarCandidates = slotGrammarCandidates(rawTranscript, input);
    const hasWriteTextGrammarCandidate = grammarCandidates.some(
      (candidate) => candidate.intent === "notepad.write_text",
    );
    const candidateTemplates = [
      ...aliasCandidates(input.aliases ?? []),
      ...routeAliasCandidates(input.routeAliases ?? []),
      ...BUILTIN_COMMANDS,
      ...pluginCandidates(input.pluginCapabilities ?? []),
      ...grammarCandidates,
    ]
      .filter(
        (template) =>
          !hasWriteTextGrammarCandidate ||
          template.intent === "notepad.write_text" ||
          template.intent === "blocked",
      );
    const candidates = candidateTemplates
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
  const normalized = normalizeLoose(stripPolitePrefix(text));
  if (looksDangerousCommand(text)) {
    return "command";
  }
  if (
    normalized.includes("\u4e0d\u8981\u6253\u5f00") ||
    (looksQuotedOrNegated(text) && /(?:\u6253\u5f00|\u5220\u9664|\u6e05\u7a7a|\u4ed8\u6b3e|\u8d2d\u4e70)/u.test(normalized))
  ) {
    return "command";
  }
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
      "\u805a\u7126",
      "\u5207\u8fc7\u53bb",
      "\u8c03\u5230\u524d\u53f0",
      "\u6700\u5c0f\u5316",
      "\u6536\u8d77\u6765",
      "\u9690\u85cf\u4e00\u4e0b",
      "\u6062\u590d",
      "\u8fd8\u539f",
      "\u62c9\u56de\u6765",
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

function routeAliasCandidates(
  aliases: readonly VoiceCommandResolverRouteAlias[],
): CandidateTemplate[] {
  return aliases.map((alias) => ({
    id: `route.${normalizeLoose(alias.label)}`,
    label: `Route alias: ${alias.label}`,
    normalizedTranscript: `open ${alias.label}`,
    intent: "browser.open",
    slots: { target: alias.label },
    aliases: [
      alias.label,
      `\u6253\u5f00${alias.label}`,
      `open ${alias.label}`,
      alias.target,
      hostFromUrl(alias.target),
      ...routeAliasSpokenForms(alias),
    ].filter((value) => value.length > 0),
    confidenceCap: 0.98,
  }));
}

function slotGrammarCandidates(
  rawTranscript: string,
  input: VoiceCommandResolverInput,
): CandidateTemplate[] {
  const text = rawTranscript.trim();
  const candidates: CandidateTemplate[] = [];
  if (looksQuotedOrNegated(text) && !looksWriteCommandWithBenignSaveModifier(text)) {
    return candidates;
  }
  if (looksDangerousCommand(text)) {
    candidates.push({
      id: "safety.block.dangerous-command",
      label: "Block dangerous command",
      normalizedTranscript: "blocked",
      intent: "blocked",
      slots: {},
      aliases: [text],
      confidence: 0.99,
    });
    return candidates;
  }
  const openTarget = stripPrefix(text, ["\u6253\u5f00", "open"]);
  if (openTarget) {
    const target = stripCommandSuffix(openTarget.trim(), [
      "\u4e00\u4e0b",
      "\u5427",
      "\u73b0\u5728",
      "\u73b0\u5728\u7528",
      "\u7ed9\u6211\u770b",
      "\u6253\u5f00",
      "\u522b\u505a\u522b\u7684",
      "\u7a97\u53e3",
    ]);
    const routeAlias = findRouteAlias(target, input.routeAliases ?? []);
    const appTarget = canonicalKnownAppTarget(target, input);
    const browserTarget = routeAlias ? routeAlias.label : canonicalBrowserTarget(target);
    if (browserTarget) {
      candidates.push({
        id: `slot.open.browser.${normalizeLoose(browserTarget)}`,
        label: `Open ${browserTarget}`,
        normalizedTranscript: `open ${browserTarget}`,
        intent: "browser.open",
        slots: { target: browserTarget },
        aliases: [text, target],
        confidence: 0.94,
      });
    } else if (appTarget) {
      candidates.push({
        id: `slot.open.app.${appTarget}`,
        label: `Open ${appTarget}`,
        normalizedTranscript: `open ${appTarget}`,
        intent: "localApp.open",
        slots: { target: appTarget },
        aliases: [text, target],
        confidence: appTarget === "powershell" ? 0.74 : 0.94,
      });
    }
  }
  const searchQuery = stripPrefix(text, [
    "\u641c\u7d22",
    "\u67e5\u627e",
    "search",
  ]);
  if (searchQuery) {
    const query = stripCommandSuffix(searchQuery.trim(), [
      "\u627e\u4e00\u4e0b",
      "\u641c\u4e00\u4e0b",
      "\u76f8\u5173\u6587\u4ef6",
      "\u6700\u8fd1\u7684\u6587\u4ef6",
    ]);
    const memoryQuery = stripMemoryPrefix(query);
    candidates.push({
      id: `slot.search.${normalizeLoose(memoryQuery ?? query)}`,
      label: `Search ${memoryQuery ?? query}`,
      normalizedTranscript: `search ${memoryQuery ?? query}`,
      intent: memoryQuery ? "memory.search" : "filesystem.search",
      slots: { query: memoryQuery ?? query },
      aliases: [text],
      confidence: 0.93,
    });
  }
  const queryTarget = stripPrefix(text, [
    "\u67e5\u8be2",
    "\u68c0\u67e5",
    "query",
  ]);
  if (queryTarget) {
    const modelTarget = canonicalModelTarget(queryTarget.trim());
    const target = stripCommandSuffix(queryTarget.trim(), [
      "\u68c0\u67e5\u4e00\u4e0b",
      "\u770b\u4e00\u4e0b",
      ...(modelTarget
        ? [
            "\u662f\u5426\u53ef\u7528",
            "\u662f\u5426\u5728\u7ebf",
            "\u5065\u5eb7\u60c5\u51b5",
            "\u5065\u5eb7",
            "\u72b6\u6001",
          ]
        : []),
    ]);
    const statusTarget = target.length > 0 ? target : queryTarget.trim();
    candidates.push({
      id: `slot.query.${normalizeLoose(modelTarget ?? statusTarget)}`,
      label: `Query ${modelTarget ?? statusTarget}`,
      normalizedTranscript: `query ${modelTarget ?? statusTarget}`,
      intent: modelTarget ? "model.status" : "observability.status",
      slots: { target: modelTarget ?? statusTarget },
      aliases: [text],
      confidence: 0.93,
    });
  }
  const writeText = extractNotepadWriteText(text);
  if (writeText) {
    candidates.push({
      id: `slot.write.${normalizeLoose(writeText)}`,
      label: `Write ${writeText}`,
      normalizedTranscript: `write ${writeText}`,
      intent: "notepad.write_text",
      slots: { text: writeText },
      aliases: [text],
      confidence: 0.94,
    });
  }
  const windowCandidate = windowControlCandidate(text);
  if (windowCandidate) {
    candidates.push(windowCandidate);
  }
  const codingCandidate = codingTaskCandidate(text);
  if (codingCandidate) {
    candidates.push(codingCandidate);
  }
  const pluginText = stripPrefix(text, ["\u4f7f\u7528", "use"]);
  const pluginMatch = pluginText?.match(
    /^(?:\u63d2\u4ef6)?\s*(?<plugin>[\w.\-\u4e00-\u9fa5]+)\s*(?<action>.*)$/iu,
  );
  if (pluginMatch?.groups?.plugin && input.pluginCapabilities?.length) {
    const plugin = pluginMatch.groups.plugin.trim();
    const action = (pluginMatch.groups.action ?? "").trim();
    candidates.push({
      id: `slot.plugin.${normalizeLoose(plugin)}.${normalizeLoose(action)}`,
      label: `Use plugin ${plugin}`,
      normalizedTranscript: `use plugin ${plugin} ${action}`.trim(),
      intent: "plugin.invoke",
      slots: { pluginId: plugin, capability: action || plugin, input: {} },
      aliases: [text],
      confidence: 0.92,
    });
  }
  return candidates;
}

function scoreCandidate(
  rawTranscript: string,
  template: CandidateTemplate,
): VoiceCommandCorrectionCandidate {
  const rawNormalized = normalizeForCommandMatch(rawTranscript);
  const rawPhonetic = normalizePhoneticMandarin(rawTranscript, true);
  const aliasScores = template.aliases.map((alias) =>
    Math.max(
      similarity(rawNormalized, normalizeForCommandMatch(alias)),
      similarity(rawPhonetic, normalizePhoneticMandarin(alias, true)),
    ),
  );
  const normalizedScore = Math.max(
    similarity(rawNormalized, normalizeForCommandMatch(template.normalizedTranscript)),
    similarity(
      rawPhonetic,
      normalizePhoneticMandarin(template.normalizedTranscript, true),
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
  const confidence =
    template.confidence ??
    (slotGrammar
      ? Math.min(template.confidenceCap ?? 0.74, Number(bestScore.toFixed(3)))
      : Math.min(template.confidenceCap ?? 1, exactAlias ? 0.98 : Number(bestScore.toFixed(3))));
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
  const trimmed = stripPolitePrefix(text);
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

function normalizeForCommandMatch(value: string): string {
  return normalizeLoose(
    stripCommandSuffix(stripPolitePrefix(value), [
      "\u4e00\u4e0b",
      "\u5427",
      "\u73b0\u5728",
      "\u73b0\u5728\u7528",
      "\u7ed9\u6211\u770b",
      "\u770b\u4e00\u4e0b",
      "\u6253\u5f00",
      "\u522b\u505a\u522b\u7684",
    ]),
  );
}

function normalizePhoneticMandarin(value: string, commandMatch = false): string {
  const normalized = commandMatch
    ? normalizeForCommandMatch(value)
    : normalizeLoose(value);
  return normalized
    .replace(/\u5fae\u7231\u6b7b(?:\u6263|\u53e3)(?:\u7684)?(?![\u4e00-\u9fa5])/gu, "vscode")
    .replace(/\u5fae\u8f6f(?:\u6263|\u53e3)(?:\u7684)?(?![\u4e00-\u9fa5])/gu, "vscode")
    .replace(/\u5a01\u65af(?:\u6263|\u53e3)(?:\u7684)?(?![\u4e00-\u9fa5])/gu, "vscode")
    .replace(/vs(?:\u6263|\u53e3)(?:\u7684)?(?![\u4e00-\u9fa5])/gu, "vscode")
    .replace(/\u4e00\u53eatoken/gu, "izytoken")
    .replace(/iztoken|izytoken|ec(?:token)?/giu, "izytoken")
    .replace(/\u6263\u7684\u514b\u65af/gu, "codex")
    .replace(/\u6263\u4ee3\u514b\u65af|\u9760\u5f97\u514b\u65af|\u4ee3\u7801\u52a9\u624b/gu, "codex")
    .replace(/\u9e21\u7279\u54c8\u5e03/gu, "github")
    .replace(/\u5343\u95ee|\u8fc1\u95ee|\u901a\u4e49|qwin/gu, "qwen")
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
  return /github|git hub|token|http|www|\.com/iu.test(target);
}

function stripPolitePrefix(text: string): string {
  return text
    .trim()
    .replace(/^(?:\u8bf7|\u5e2e\u6211|\u9ebb\u70e6|\u7ed9\u6211|\u55ef|\u5443|\u554a|\u90a3\u4e2a|\u5c31\u662f)+/u, "")
    .trim();
}

function stripCommandSuffix(text: string, suffixes: readonly string[]): string {
  let value = stripPolitePrefix(text).trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of suffixes) {
      if (value.endsWith(suffix) && value.length > suffix.length) {
        value = value.slice(0, -suffix.length).trim();
        changed = true;
      }
    }
  }
  return value;
}

function stripMemoryPrefix(query: string): string | undefined {
  const match = query.trim().match(/^\u8bb0\u5fc6\u91cc(?<query>.+)$/u);
  if (!match?.groups?.query) return undefined;
  return stripCommandSuffix(match.groups.query, [
    "\u662f\u4ec0\u4e48",
    "\u5728\u54ea\u91cc",
    "\u6709\u6ca1\u6709",
    "\u8bb0\u5f55",
  ]);
}

function extractNotepadWriteText(text: string): string | undefined {
  const stripped = stripPolitePrefix(text).trim();
  const intoNotepad = stripped.match(
    /^\u628a(?<content>.+?)(?:\u5199\u8fdb|\u5199\u5165|\u653e\u8fdb|\u8f93\u5165\u5230)\s*(?:\u8bb0\u4e8b\u672c|notepad)(?:\u91cc|\u4e2d)?$/iu,
  );
  if (intoNotepad?.groups?.content) {
    return cleanWriteTextSlot(intoNotepad.groups.content);
  }

  const directWriteText = stripPrefix(stripped, [
    "\u5199\u5165",
    "\u8f93\u5165",
    "\u5199\u4e0a",
    "\u6253\u5b57",
    "type",
  ]);
  if (directWriteText) return cleanWriteTextSlot(directWriteText);

  const noteText = stripPrefix(stripped, [
    "\u8bb0\u4e0b",
    "\u8bb0\u4e00\u4e0b",
    "\u5e2e\u6211\u8bb0\u4e0b",
    "\u5e2e\u6211\u8bb0",
    "\u5e2e\u6211\u8bb0\u5f55",
    "\u5199\u4e0b",
  ]);
  if (noteText) return cleanWriteTextSlot(noteText);

  if (normalizeLoose(stripped).startsWith(normalizeLoose("\u5199\u4e00\u884c"))) {
    return cleanWriteTextSlot(stripped);
  }
  return undefined;
}

function cleanWriteTextSlot(value: string): string | undefined {
  const cleaned = stripWrappingQuotes(
    stripCommandSuffix(value.trim(), [
      "\u5e76\u4fdd\u7559\u7a97\u53e3",
      "\u4e0d\u8981\u4fdd\u5b58",
      "\u5728\u5149\u6807\u5904",
      "\u4f5c\u4e3a\u4e00\u884c",
    ]),
  ).trim();
  return normalizeLoose(cleaned).length > 0 ? cleaned : undefined;
}

function stripWrappingQuotes(value: string): string {
  return value
    .replace(/^[\u201c\u201d"'\u300c\u300d\u300e\u300f]+/u, "")
    .replace(/[\u201c\u201d"'\u300c\u300d\u300e\u300f]+$/u, "");
}

function canonicalKnownAppTarget(
  target: string,
  input: VoiceCommandResolverInput,
): string | undefined {
  const normalized = normalizePhoneticMandarin(target, true);
  const known = new Map([
    ["vscode", "vscode"],
    ["notepad", "notepad"],
    ["\u8bb0\u4e8b\u672c", "notepad"],
    ["calculator", "calculator"],
    ["calc", "calculator"],
    ["\u8ba1\u7b97\u5668", "calculator"],
    ["powershell", "powershell"],
  ]);
  const candidate = known.get(normalized);
  if (!candidate) return undefined;
  const installed = inputInstalledApps(input);
  return installed.size === 0 || installed.has(candidate) ? candidate : undefined;
}

function inputInstalledApps(input: VoiceCommandResolverInput): Set<string> {
  const apps =
    (input as VoiceCommandResolverInput & {
      installedApps?: readonly string[];
    }).installedApps ?? [];
  return new Set(apps.map((app) => normalizeLoose(app)));
}

function canonicalBrowserTarget(target: string): string | undefined {
  const normalized = normalizePhoneticMandarin(target, true)
    .replace(/\u70b9/gu, ".")
    .replace(/api\.?izytoken\.?com/giu, "api.izytoken.com");
  if (/^(?:api\.)?izytoken\.com/iu.test(normalized) || normalized.includes("izytoken")) {
    return "IZYtoken admin";
  }
  if (normalized.includes("github")) return "GitHub";
  if (/\u672a\u77e5\u94fe\u63a5|unknownlink/iu.test(normalized)) return undefined;
  if (/^https?:\/\/|^www\.|\.com$/iu.test(normalized)) return target;
  return looksLikeUrlOrSite(target) ? target : undefined;
}

function findRouteAlias(
  target: string,
  aliases: readonly VoiceCommandResolverRouteAlias[],
): VoiceCommandResolverRouteAlias | undefined {
  const normalizedTarget = normalizePhoneticMandarin(target, true)
    .replace(/\u70b9/gu, ".")
    .replace(/api\.?izytoken\.?com/giu, "api.izytoken.com");
  return aliases.find((alias) => {
    const values = [
      alias.label,
      alias.target,
      hostFromUrl(alias.target),
      ...routeAliasSpokenForms(alias),
    ];
    return values.some((value) => {
      const normalized = normalizePhoneticMandarin(value, true).replace(/\u70b9/gu, ".");
      return (
        normalized.length > 0 &&
        (normalizedTarget.includes(normalized) || normalized.includes(normalizedTarget))
      );
    });
  });
}

function routeAliasSpokenForms(alias: VoiceCommandResolverRouteAlias): string[] {
  const host = hostFromUrl(alias.target);
  return [
    `\u6253\u5f00${host}`,
    `\u6253\u5f00${host.replace(/\./gu, "\u70b9")}`,
    alias.label.replace(/\s+/gu, ""),
  ];
}

function hostFromUrl(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return value.replace(/^https?:\/\//iu, "").split("/")[0] ?? "";
  }
}

function canonicalModelTarget(target: string): string | undefined {
  const normalized = normalizePhoneticMandarin(target, true);
  if (/qwen|\u5343\u95ee|\u8fc1\u95ee|\u901a\u4e49|qwin/iu.test(normalized)) return "qwen";
  if (/deepseek/iu.test(normalized)) return "DeepSeek";
  if (/\u6a21\u578b/iu.test(normalized)) return "\u6a21\u578b";
  return undefined;
}

function windowControlCandidate(text: string): CandidateTemplate | undefined {
  const rules: Array<{
    intent: BrainIntent;
    prefixes: readonly string[];
  }> = [
    {
      intent: "window.focus",
      prefixes: ["\u805a\u7126", "\u5207\u8fc7\u53bb", "\u8c03\u5230\u524d\u53f0"],
    },
    {
      intent: "window.minimize",
      prefixes: ["\u6700\u5c0f\u5316", "\u6536\u8d77\u6765", "\u9690\u85cf\u4e00\u4e0b"],
    },
    {
      intent: "window.restore",
      prefixes: ["\u6062\u590d", "\u8fd8\u539f", "\u62c9\u56de\u6765"],
    },
  ];
  for (const rule of rules) {
    const target = stripAnyPrefix(text, rule.prefixes);
    if (!target) continue;
    return {
      id: `slot.${rule.intent}.${normalizeLoose(target)}`,
      label: `Window ${rule.intent} ${target}`,
      normalizedTranscript: `${rule.intent} ${target}`,
      intent: rule.intent,
      slots: { target },
      aliases: [text],
      confidence: 0.94,
    };
  }
  return undefined;
}

function codingTaskCandidate(text: string): CandidateTemplate | undefined {
  const stripped = stripPolitePrefix(text);
  const direct = /^(?:Codex|codex)(?<action>.+)$/u.exec(stripped);
  const spoken = /^(?:\u6263\u4ee3\u514b\u65af|\u9760\u5f97\u514b\u65af|\u4ee3\u7801\u52a9\u624b)(?<action>.+)$/u.exec(stripped);
  const action = direct?.groups?.action?.trim() ?? spoken?.groups?.action?.trim();
  if (!action) return undefined;
  return {
    id: `slot.coding.codex.${normalizeLoose(action)}`,
    label: `Ask Codex ${action}`,
    normalizedTranscript: `Codex ${action}`,
    intent: "coding.task",
    slots: { target: "codex", action },
    aliases: [text],
    confidence: 0.74,
  };
}

function stripAnyPrefix(text: string, prefixes: readonly string[]): string | undefined {
  const stripped = stripPolitePrefix(text);
  for (const prefix of prefixes) {
    if (stripped.startsWith(prefix)) {
      const value = stripped.slice(prefix.length).trim();
      return value.length > 0 ? value : undefined;
    }
  }
  return undefined;
}

function looksDangerousCommand(text: string): boolean {
  const normalized = normalizeLoose(text);
  return /(\u5220\u9664\u6240\u6709\u6587\u4ef6|\u6e05\u7a7a\u684c\u9762|\u7ed9\u5ba2\u6237\u53d1\u90ae\u4ef6|\u4ed8\u6b3e|\u8d2d\u4e70|\u672a\u77e5\u94fe\u63a5)/u.test(
    normalized,
  );
}

function looksQuotedOrNegated(text: string): boolean {
  const normalized = normalizeLoose(text);
  return /(\u4e0d\u8981|\u522b\u5e2e\u6211|\u522b\u6253\u5f00|\u522b\u5199|\u522b\u628a|\u522b\u8bb0|\u6ca1\u6709\u8ba9\u4f60|\u4e0d\u662f\u6211\u7684\u547d\u4ee4|\u4ed6\u8bf4|\u5979\u8bf4|\u5982\u679c\u6211\u8bf4|\u5f15\u7528|\u7ba1\u7406\u5458\u6743\u9650)/u.test(
    normalized,
  );
}

function looksWriteCommandWithBenignSaveModifier(text: string): boolean {
  const normalized = normalizeLoose(text);
  if (!normalized.includes("\u4e0d\u8981\u4fdd\u5b58")) return false;
  if (!extractNotepadWriteText(text)) return false;
  const withoutSaveModifier = normalized.replace(/\u4e0d\u8981\u4fdd\u5b58/gu, "");
  return !/(\u4e0d\u8981|\u522b\u5e2e\u6211|\u522b\u6253\u5f00|\u522b\u5199|\u522b\u628a|\u522b\u8bb0|\u6ca1\u6709\u8ba9\u4f60|\u4ed6\u8bf4|\u5979\u8bf4|\u5982\u679c\u6211\u8bf4|\u5f15\u7528|\u7ba1\u7406\u5458\u6743\u9650)/u.test(
    withoutSaveModifier,
  );
}

function containsCommandVerb(text: string): boolean {
  const normalized = normalizeLoose(text);
  return /(\u6253\u5f00|\u641c\u7d22|\u67e5\u627e|\u5199\u5165|\u8f93\u5165|\u5199\u4e0b|\u8bb0\u4e0b|\u5220\u9664|\u6e05\u7a7a|\u4ed8\u6b3e|\u8d2d\u4e70|open|search|type)/iu.test(
    normalized,
  );
}
