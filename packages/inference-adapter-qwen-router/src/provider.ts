import type { IntentRoutingProvider } from "@jarvis-k/capabilities";
import {
  BrainIntentSchema,
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  IntentRoutingRequestSchema,
  IntentRoutingResultSchema,
  type BrainIntent,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor,
  type IntentCandidate,
  type IntentRoutingRequest,
  type IntentRoutingResult
} from "@jarvis-k/contracts";
import {
  createQwenFastRouterPrompt,
  QWEN_FAST_ROUTER_ALLOWED_INTENTS,
  QWEN_FAST_ROUTER_MODEL_ID,
  QWEN_FAST_ROUTER_PROVIDER_ID
} from "./prompt";

export interface QwenFastRouterGenerationInput {
  modelId: string;
  prompt: string;
  temperature: 0;
  maxOutputChars: number;
}

export interface QwenFastRouterGenerationPort {
  generate(input: QwenFastRouterGenerationInput): Promise<string>;
}

export interface QwenFastRouterProviderOptions {
  modelId?: string;
  generator: QwenFastRouterGenerationPort;
  now?: () => Date;
  maxOutputChars?: number;
  allowedIntents?: readonly BrainIntent[];
}

export interface QwenFastRouterDescriptorOptions {
  enabled: boolean;
  modelId?: string;
  runtimeReady?: boolean;
}

export interface QwenFastRouterConfigurationReportOptions
  extends QwenFastRouterDescriptorOptions {
  artifactDigestApproved?: boolean;
  modelLifecycleReady?: boolean;
}

const DEFAULT_MAX_OUTPUT_CHARS = 2_000;
const SLOT_KEYS = new Set(["target", "query", "appName", "locale"]);
const SLOT_ALIASES = new Map([
  ["app", "appName"],
  ["application", "appName"],
  ["url", "target"],
  ["website", "target"],
  ["keyword", "query"]
]);
const INTENT_ALIASES = new Map<string, BrainIntent>([
  ["chat", "chat.answer"],
  ["answer", "chat.answer"],
  ["browser", "browser.open"],
  ["open_browser", "browser.open"],
  ["open_website", "browser.open"],
  ["open_url", "browser.open"],
  ["app.open", "localApp.open"],
  ["open_app", "localApp.open"],
  ["local_app.open", "localApp.open"],
  ["memory", "memory.search"],
  ["search_memory", "memory.search"],
  ["status", "observability.status"],
  ["observability", "observability.status"],
  ["model", "model.status"],
  ["ask_clarification", "clarify"],
  ["deny", "blocked"],
  ["unsafe", "blocked"]
]);
const CONTROL_TEXT_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;
const UNSAFE_SLOT_PATTERN =
  /(?:[A-Za-z]:\\|\\\\|\bBearer\b|BEGIN [A-Z ]+KEY|(?:api[_-]?key|token|secret|password)\s*=|powershell|cmd\.exe|rm\s+-rf)/iu;
const DESTRUCTIVE_ACTION_PATTERN =
  /(?:\brm\s+-rf\b|\bdel\s+\/[fsq]\b|\bformat\b|\bshutdown\b|\breboot\b|\bkill\b|\bdelete\b|\bremove\b|\bwipe\b|\berase\b|删除|删掉|清空|格式化|关机|重启|杀掉|卸载)/iu;
const HIGH_IMPACT_TARGET_PATTERN =
  /(?:所有|全部|整个|桌面|系统|文件|磁盘|硬盘|注册表|all|every|desktop|system|file|folder|disk|drive|registry|windows)/iu;
const WEB_TARGET_PATTERN =
  /(?:https?:\/\/|www\.|[A-Za-z0-9-]+\.(?:com|cn|net|org|io|dev|ai|app|co|me)\b|网页|网站|网址|链接|\bwebsite\b|\bweb\s?page\b|\burl\b|\blink\b)/iu;
const BROWSER_ACTION_PATTERN =
  /(?:打开|访问|浏览|搜索|open|visit|browse|search)/iu;
const LOCAL_APP_ACTION_PATTERN =
  /(?:打开|启动|运行|开启|调出|open|launch|start|run)/iu;
const OBSERVABILITY_PATTERN =
  /(?:状态|诊断|健康|检查|观测|可观测|status|diagnostic|diagnostics|health|observability)/iu;
const MODEL_STATUS_PATTERN =
  /(?:\bmodel\s+status\b|\bmodel\b|\bruntime\s+model\b|\bprovider\s+status\b|\bgpu\s+status\b)/iu;
const KNOWN_WEB_TARGETS = new Map<string, string>([
  ["github", "GitHub"],
  ["git hub", "GitHub"],
  ["huggingface", "Hugging Face"],
  ["hugging face", "Hugging Face"],
  ["google", "Google"],
  ["youtube", "YouTube"],
  ["bilibili", "Bilibili"],
  ["百度", "百度"],
  ["知乎", "知乎"]
]);
const KNOWN_LOCAL_APPS = new Map<string, string>([
  ["wechat", "WeChat"],
  ["weixin", "微信"],
  ["微信", "微信"],
  ["qq", "QQ"],
  ["vscode", "VS Code"],
  ["vs code", "VS Code"],
  ["visual studio code", "VS Code"],
  ["notepad", "Notepad"],
  ["记事本", "记事本"],
  ["calculator", "Calculator"],
  ["calc", "Calculator"],
  ["计算器", "计算器"],
  ["chrome", "Chrome"],
  ["edge", "Microsoft Edge"],
  ["word", "Word"],
  ["excel", "Excel"],
  ["powerpoint", "PowerPoint"],
  ["terminal", "Terminal"],
  ["cmd", "Command Prompt"],
  ["命令提示符", "命令提示符"]
]);

interface DeterministicRouterSignal {
  intent: BrainIntent;
  confidenceFloor: number;
  slots: Record<string, unknown>;
  reason: string;
}

export class QwenFastRouterProvider implements IntentRoutingProvider {
  private readonly modelId: string;
  private readonly generator: QwenFastRouterGenerationPort;
  private readonly now: () => Date;
  private readonly maxOutputChars: number;
  private readonly allowedIntents: readonly BrainIntent[];

  public constructor(options: QwenFastRouterProviderOptions) {
    this.modelId = options.modelId ?? QWEN_FAST_ROUTER_MODEL_ID;
    this.generator = options.generator;
    this.now = options.now ?? (() => new Date());
    this.maxOutputChars =
      options.maxOutputChars ?? DEFAULT_MAX_OUTPUT_CHARS;
    this.allowedIntents =
      options.allowedIntents ?? QWEN_FAST_ROUTER_ALLOWED_INTENTS;
  }

  public async route(
    request: IntentRoutingRequest
  ): Promise<IntentRoutingResult> {
    const parsed = IntentRoutingRequestSchema.parse(request);
    if (parsed.modelId !== this.modelId) {
      throw new Error("QWEN_FAST_ROUTER_MODEL_MISMATCH");
    }

    const output = await this.generator.generate({
      modelId: parsed.modelId,
      prompt: createQwenFastRouterPrompt(parsed, this.allowedIntents),
      temperature: 0,
      maxOutputChars: this.maxOutputChars
    });

    let candidates: IntentCandidate[];
    try {
      candidates = parseQwenFastRouterOutput(output, {
        allowedIntents: this.allowedIntents
      });
    } catch (error) {
      candidates = createFailClosedCandidates(parsed, this.allowedIntents);
      if (candidates.length === 0) {
        throw error;
      }
    }

    return IntentRoutingResultSchema.parse({
      modelId: parsed.modelId,
      utterance: parsed.utterance,
      candidates: calibrateQwenFastRouterCandidates(
        candidates,
        parsed,
        this.allowedIntents
      ),
      routedAt: this.now().toISOString()
    });
  }
}

export function createQwenFastRouterDescriptor(
  options: QwenFastRouterDescriptorOptions
): InferenceProviderDescriptor {
  const modelId = options.modelId ?? QWEN_FAST_ROUTER_MODEL_ID;
  const available = options.enabled && options.runtimeReady === true;
  return InferenceProviderDescriptorSchema.parse({
    capability: "intent_router",
    provider: QWEN_FAST_ROUTER_PROVIDER_ID,
    status: available ? "available" : "unconfigured",
    execution: available ? "local" : "disabled",
    modelIds: available ? [modelId] : [],
    reasons: available
      ? []
      : [
          "Qwen3-0.6B fast router is default-off until runtime/cache acceptance and model lifecycle gates pass."
        ]
  });
}

export function createQwenFastRouterConfigurationReport(
  options: QwenFastRouterConfigurationReportOptions
): InferenceProviderConfigurationReport {
  const modelId = options.modelId ?? QWEN_FAST_ROUTER_MODEL_ID;
  const enabled = options.enabled;
  const runtimeReady = options.runtimeReady === true;
  const artifactDigestApproved = options.artifactDigestApproved === true;
  const modelLifecycleReady = options.modelLifecycleReady === true;
  const available =
    enabled && runtimeReady && artifactDigestApproved && modelLifecycleReady;

  return InferenceProviderConfigurationReportSchema.parse({
    capability: "intent_router",
    provider: QWEN_FAST_ROUTER_PROVIDER_ID,
    status: available ? "available" : "unconfigured",
    requirements: [
      {
        key: "JARVIS_K_ENABLE_QWEN_FAST_ROUTER",
        source: "environment",
        required: true,
        configured: enabled,
        description: "Explicitly enables the Qwen3-0.6B fast router.",
        reasons: enabled ? [] : ["Fast router is disabled by default."]
      },
      {
        key: "JARVIS_K_BRAIN_ROUTER_MODEL_ID",
        source: "environment",
        required: true,
        configured: modelId.length > 0,
        description: "Selects the approved local intent router model.",
        reasons: modelId.length > 0 ? [] : ["No router model was selected."]
      },
      {
        key: "qwen.router.artifact_digest_approved",
        source: "manual",
        required: true,
        configured: artifactDigestApproved,
        description: "Requires exact artifact digest approval before runtime use.",
        reasons: artifactDigestApproved
          ? []
          : ["Qwen3-0.6B artifact digest is not approved in this scope."]
      },
      {
        key: "qwen.router.model_lifecycle_ready",
        source: "runtime",
        required: true,
        configured: modelLifecycleReady,
        description: "Requires model lifecycle availability before routing.",
        reasons: modelLifecycleReady
          ? []
          : ["Model lifecycle has not marked Qwen3-0.6B ready."]
      },
      {
        key: "qwen.router.generation_port",
        source: "runtime",
        required: true,
        configured: runtimeReady,
        description: "Requires a bounded local text-generation runtime port.",
        reasons: runtimeReady
          ? []
          : ["No Qwen text-generation runtime port is configured."]
      }
    ],
    reasons: available
      ? []
      : [
          "Qwen3-0.6B fast router remains unavailable; no model download, cache access, or execution is enabled."
        ]
  });
}

export function parseQwenFastRouterOutput(
  output: string,
  options: { allowedIntents?: readonly BrainIntent[] } = {}
): IntentCandidate[] {
  const allowedIntents =
    options.allowedIntents ?? QWEN_FAST_ROUTER_ALLOWED_INTENTS;
  const candidates = extractJsonCandidateObjects(output)
    .flatMap((parsed) => {
      const rawCandidates = Array.isArray(parsed.candidates)
        ? parsed.candidates
        : [parsed];
      return rawCandidates
        .slice(0, 5)
        .flatMap((candidate) => parseCandidate(candidate, allowedIntents));
    })
    .slice(0, 5);

  if (candidates.length === 0) {
    throw new Error("QWEN_FAST_ROUTER_OUTPUT_INVALID");
  }
  return candidates;
}

export function calibrateQwenFastRouterCandidates(
  candidates: readonly IntentCandidate[],
  request: IntentRoutingRequest,
  allowedIntents: readonly BrainIntent[] = QWEN_FAST_ROUTER_ALLOWED_INTENTS
): IntentCandidate[] {
  const unsafeCandidates = createFailClosedCandidates(request, allowedIntents);
  if (unsafeCandidates.length > 0) {
    return unsafeCandidates;
  }

  const signal = inferDeterministicRouterSignal(request.utterance);
  if (signal === undefined || !allowedIntents.includes(signal.intent)) {
    return candidates.slice(0, 5);
  }

  const matchingCandidate = candidates.find(
    (candidate) => candidate.intent === signal.intent
  );
  const calibratedCandidate: IntentCandidate = {
    intent: signal.intent,
    confidence: Math.max(
      matchingCandidate?.confidence ?? 0,
      signal.confidenceFloor
    ),
    slots: {
      ...(matchingCandidate?.slots ?? {}),
      ...signal.slots
    },
    reasons: [signal.reason]
  };

  return [
    calibratedCandidate,
    ...candidates.filter((candidate) => candidate.intent !== signal.intent)
  ].slice(0, 5);
}

function createFailClosedCandidates(
  request: IntentRoutingRequest,
  allowedIntents: readonly BrainIntent[]
): IntentCandidate[] {
  if (!isDestructiveActionRequest(request.utterance)) {
    return [];
  }
  if (allowedIntents.includes("blocked")) {
    return [
      {
        intent: "blocked",
        confidence: 0.95,
        slots: {},
        reasons: [
          "Deterministic safety policy blocked a destructive or high-impact action."
        ]
      }
    ];
  }
  if (allowedIntents.includes("clarify")) {
    return [
      {
        intent: "clarify",
        confidence: 0.9,
        slots: {},
        reasons: [
          "Deterministic safety policy requires clarification for a destructive or high-impact action."
        ]
      }
    ];
  }
  return [];
}

function inferDeterministicRouterSignal(
  utterance: string
): DeterministicRouterSignal | undefined {
  const webTarget = extractKnownWebTarget(utterance);
  if (WEB_TARGET_PATTERN.test(utterance) || webTarget !== undefined) {
    return {
      intent: "browser.open",
      confidenceFloor: 0.82,
      slots: {
        target: webTarget ?? sanitizeUtteranceTarget(utterance)
      },
      reason: "Deterministic calibration matched a browser target."
    };
  }

  const appName = extractKnownLocalAppName(utterance);
  if (appName !== undefined) {
    return {
      intent: "localApp.open",
      confidenceFloor: 0.84,
      slots: {
        appName
      },
      reason: "Deterministic calibration matched a local application target."
    };
  }

  if (MODEL_STATUS_PATTERN.test(utterance)) {
    return {
      intent: "model.status",
      confidenceFloor: 0.8,
      slots: {},
      reason: "Deterministic calibration matched a model status request."
    };
  }

  if (OBSERVABILITY_PATTERN.test(utterance)) {
    return {
      intent: "observability.status",
      confidenceFloor: 0.8,
      slots: {},
      reason: "Deterministic calibration matched a status diagnostic request."
    };
  }

  return undefined;
}

function isDestructiveActionRequest(utterance: string): boolean {
  return (
    DESTRUCTIVE_ACTION_PATTERN.test(utterance) &&
    (HIGH_IMPACT_TARGET_PATTERN.test(utterance) ||
      /\brm\s+-rf\s+(?:\/|\*)/iu.test(utterance))
  );
}

function extractKnownLocalAppName(utterance: string): string | undefined {
  if (!LOCAL_APP_ACTION_PATTERN.test(utterance)) {
    return undefined;
  }
  const normalized = normalizeSearchText(utterance);
  for (const [key, appName] of KNOWN_LOCAL_APPS) {
    if (normalized.includes(key)) {
      return appName;
    }
  }
  return undefined;
}

function extractKnownWebTarget(utterance: string): string | undefined {
  if (!BROWSER_ACTION_PATTERN.test(utterance)) {
    return undefined;
  }
  const normalized = normalizeSearchText(utterance);
  for (const [key, target] of KNOWN_WEB_TARGETS) {
    if (normalized.includes(key)) {
      return target;
    }
  }
  const urlMatch = utterance.match(
    /(?:https?:\/\/|www\.)?[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?:\/[^\s]*)?/u
  );
  return urlMatch?.[0];
}

function sanitizeUtteranceTarget(utterance: string): string {
  return utterance.trim().replace(/\s+/gu, " ").slice(0, 120);
}

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/gu, " ").trim();
}

function extractJsonCandidateObjects(output: string): Record<string, unknown>[] {
  if (output.length > 20_000 || CONTROL_TEXT_PATTERN.test(output)) {
    throw new Error("QWEN_FAST_ROUTER_OUTPUT_INVALID");
  }
  const normalized = output
    .replace(/<think>[\s\S]*?<\/think>/giu, "")
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "");
  const extracted = extractBalancedJsonStrings(normalized);
  const candidates =
    extracted.length > 0 ? [...new Set(extracted)] : [normalized.trim()];
  const parsed = candidates.flatMap((candidate) =>
    parseJsonCandidate(candidate)
  );
  if (parsed.length === 0) {
    throw new Error("QWEN_FAST_ROUTER_OUTPUT_INVALID");
  }
  return parsed;
}

function parseJsonCandidate(candidate: string): Record<string, unknown>[] {
  try {
    const value = JSON.parse(candidate) as unknown;
    if (isRecord(value)) {
      return [value];
    }
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  } catch {
    return [];
  }
  return [];
}

function extractBalancedJsonStrings(text: string): string[] {
  const results: string[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const opener = text[index];
    if (opener !== "{" && opener !== "[") {
      continue;
    }
    const closer = opener === "{" ? "}" : "]";
    const extracted = extractBalancedJsonAt(text, index, opener, closer);
    if (extracted !== undefined) {
      results.push(extracted);
      index += extracted.length - 1;
    }
  }
  return results;
}

function extractBalancedJsonAt(
  text: string,
  start: number,
  opener: "{" | "[",
  closer: "}" | "]"
): string | undefined {
  const stack: string[] = [closer];
  let inString = false;
  let escaped = false;
  for (let index = start + 1; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }
    if (character === "\"") {
      inString = true;
      continue;
    }
    if (character === "{" || character === "[") {
      stack.push(character === "{" ? "}" : "]");
      continue;
    }
    if (character === "}" || character === "]") {
      if (character !== stack.pop()) {
        return undefined;
      }
      if (stack.length === 0) {
        const value = text.slice(start, index + 1);
        return opener === "{" || closer === "]" ? value : undefined;
      }
    }
  }
  return undefined;
}

function normalizeIntent(value: string): string {
  return INTENT_ALIASES.get(value) ?? value;
}

function normalizeSlotKey(value: string): string {
  return SLOT_ALIASES.get(value) ?? value;
}

function parseConfidence(value: unknown): number | undefined {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value.trim())
        : Number.NaN;
  return Number.isFinite(numeric)
    ? Math.max(0, Math.min(1, numeric))
    : undefined;
}

function parseCandidate(
  value: unknown,
  allowedIntents: readonly BrainIntent[]
): IntentCandidate[] {
  if (!isRecord(value)) {
    return [];
  }
  const intent = parseIntent(value.intent, allowedIntents);
  const confidence = parseConfidence(value.confidence);
  if (intent === undefined || confidence === undefined) {
    return [];
  }

  return [
    {
      intent,
      confidence,
      slots: sanitizeSlots(value.slots),
      reasons: parseReasons(value.reason, value.reasons)
    }
  ];
}

function parseIntent(
  value: unknown,
  allowedIntents: readonly BrainIntent[]
): BrainIntent | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = normalizeIntent(value.trim());
  if (!allowedIntents.includes(normalized as BrainIntent)) {
    return undefined;
  }
  const parsed = BrainIntentSchema.safeParse(normalized);
  return parsed.success ? parsed.data : undefined;
}

function sanitizeSlots(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {};
  }
  const slots: Record<string, unknown> = {};
  for (const [rawKey, slotValue] of Object.entries(value).slice(0, 16)) {
    const key = normalizeSlotKey(rawKey);
    if (!SLOT_KEYS.has(key)) {
      continue;
    }
    const sanitized = sanitizeSlotValue(slotValue);
    if (sanitized !== undefined) {
      slots[key] = sanitized;
    }
  }
  return slots;
}

function sanitizeSlotValue(value: unknown): string | number | boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim().replace(/\s+/gu, " ");
  if (
    trimmed.length === 0 ||
    trimmed.length > 300 ||
    CONTROL_TEXT_PATTERN.test(trimmed) ||
    UNSAFE_SLOT_PATTERN.test(trimmed)
  ) {
    return undefined;
  }
  return trimmed;
}

function parseReasons(reason: unknown, reasons: unknown): string[] {
  const values = Array.isArray(reasons) ? reasons : [reason];
  const sanitized = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().replace(/\s+/gu, " "))
    .filter(
      (value) =>
        value.length > 0 &&
        value.length <= 500 &&
        !CONTROL_TEXT_PATTERN.test(value) &&
        !UNSAFE_SLOT_PATTERN.test(value)
    )
    .slice(0, 4);
  return sanitized.length > 0
    ? sanitized
    : ["Qwen fast router returned a sanitized intent candidate."];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
