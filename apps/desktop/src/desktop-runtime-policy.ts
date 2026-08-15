import type { HeavyPlannerProviderName } from "./secure-heavy-planner-provider-store";

export type ChatAnswerRuntimeProviderName =
  "chat-answer.openai-compatible.deepseek";

export function isStage5LocalAcceptanceNoSecureStore(): boolean {
  return process.env.JARVIS_K_STAGE5_LOCAL_ACCEPTANCE_NO_SECURE_STORE === "1";
}

export function selectedChatAnswerProvider():
  | ChatAnswerRuntimeProviderName
  | null {
  const deepseekEnabled =
    process.env.JARVIS_K_ENABLE_CHAT_ANSWER_DEEPSEEK === "1";
  const productManualAcceptanceEnabled =
    process.env.JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_PRODUCT_MANUAL_ACCEPTANCE ===
    "1";
  const expandedProductLoopEnabled =
    process.env.JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_EXPANDED_PRODUCT_LOOP ===
    "1";
  return deepseekEnabled &&
    (productManualAcceptanceEnabled || expandedProductLoopEnabled)
    ? "chat-answer.openai-compatible.deepseek"
    : null;
}

export function selectedHeavyPlannerProvider(): HeavyPlannerProviderName | null {
  const openAiEnabled =
    process.env.JARVIS_K_ENABLE_HEAVY_PLANNER_OPENAI === "1";
  const glmEnabled = process.env.JARVIS_K_ENABLE_HEAVY_PLANNER_GLM === "1";
  if (openAiEnabled === glmEnabled) {
    return null;
  }
  return glmEnabled ? "glm" : "openai";
}
