import type { BrainIntent, IntentRoutingRequest } from "@jarvis-k/contracts";

export const QWEN_FAST_ROUTER_PROVIDER_ID = "intent-router.qwen3-0.6b";
export const QWEN_FAST_ROUTER_MODEL_ID = "Qwen/Qwen3-0.6B";

export const QWEN_FAST_ROUTER_ALLOWED_INTENTS: readonly BrainIntent[] = [
  "chat.answer",
  "browser.open",
  "localApp.open",
  "memory.search",
  "observability.status",
  "model.status",
  "clarify",
  "blocked"
];

export function createQwenFastRouterPrompt(
  request: IntentRoutingRequest,
  allowedIntents: readonly BrainIntent[] = QWEN_FAST_ROUTER_ALLOWED_INTENTS
): string {
  const locale = request.context?.locale ?? "zh";
  return [
    "You are Jarvis-K Fast Router.",
    "Think silently. Do not output thinking, markdown, XML, or explanations.",
    "Classify the user utterance into exactly one allowed intent.",
    "Return exactly one compact JSON object and nothing else.",
    "Do not call tools. Do not output shell commands, file paths, credentials, tokens, or raw diagnostics.",
    `Locale: ${locale}`,
    `Allowed intents: ${allowedIntents.join(", ")}`,
    'Required schema: {"intent":"browser.open","confidence":0.0,"slots":{"target":"example"},"reason":"short sanitized reason"}',
    "Slot policy: only use target, query, appName, or locale. Omit unsafe slots.",
    "Intent hints: 打开网页=>browser.open, 打开软件=>localApp.open, 状态=>observability.status, 模型=>model.status, 记忆/之前说过=>memory.search, 删除/危险动作=>blocked, 普通问题=>chat.answer.",
    `User utterance: ${JSON.stringify(request.utterance)}`,
    "Assistant output:",
    "/no_think"
  ].join("\n");
}
