import {
  CoreInboundMessageSchema,
  type CoreInboundMessage,
} from "@jarvis-k/contracts";
import {
  DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
  type OpenAiCompatibleChatAnswerRuntimeCredential,
} from "@jarvis-k/inference-adapter-glm-chat-answer-runtime";
import type { OpenAiHeavyPlannerCredential } from "@jarvis-k/inference-adapter-openai-planner";
import type { GlmRuntimeHeavyPlannerCredential } from "@jarvis-k/inference-adapter-glm-runtime";

export type CoreHostParsedMessage =
  | {
      kind: "command-router-product-mode.configure";
      configuration: CoreHostCommandRouterProductModeConfiguration;
    }
  | {
      kind: "chat-answer-product-mode.configure";
      configuration: CoreHostChatAnswerProductModeConfiguration;
    }
  | {
      kind: "chat-answer-provider.configure";
      configuration: CoreHostChatAnswerProviderConfiguration;
    }
  | {
      kind: "heavy-planner-provider.configure";
      configuration: CoreHostHeavyPlannerProviderConfiguration;
    }
  | {
      kind: "voice-provider.configure";
      configuration: CoreHostVoiceProviderConfiguration;
    }
  | {
      kind: "core-inbound";
      message: CoreInboundMessage;
    };

export type CoreHostMessageParseResult =
  | {
      accepted: true;
      message: CoreHostParsedMessage;
    }
  | {
      accepted: false;
      reasonCode: "UNKNOWN_OR_INVALID_MESSAGE";
    };

export interface CoreHostCommandRouterProductModeConfiguration {
  readonly enabled: boolean;
}

export interface CoreHostChatAnswerProductModeConfiguration {
  readonly enabled: boolean;
  readonly credential?: OpenAiCompatibleChatAnswerRuntimeCredential;
}

export interface CoreHostChatAnswerProviderConfiguration {
  readonly provider: typeof DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID;
  readonly endpoint?: typeof DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT;
  readonly modelId?: typeof DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID;
  readonly credentials: OpenAiCompatibleChatAnswerRuntimeCredential;
}

export type CoreHostHeavyPlannerProviderConfiguration =
  | {
      provider: "openai";
      credentials: OpenAiHeavyPlannerCredential;
    }
  | {
      provider: "glm";
      credentials: GlmRuntimeHeavyPlannerCredential;
    };

export type CoreHostVoiceProviderConfiguration =
  | {
      provider: "xunfei";
      language: "zh" | "en";
      credentials: {
        appId: string;
        apiKey: string;
      };
    }
  | {
      provider: "volcengine";
      language: "zh" | "en";
      credentials: {
        apiKey: string;
        resourceId: string;
      };
    };

export function parseCoreHostMessage(
  message: unknown,
): CoreHostMessageParseResult {
  const commandRouterProductModeConfiguration =
    parseCommandRouterProductModeConfigurationMessage(message);
  if (commandRouterProductModeConfiguration) {
    return {
      accepted: true,
      message: {
        kind: "command-router-product-mode.configure",
        configuration: commandRouterProductModeConfiguration,
      },
    };
  }

  const chatAnswerProductModeConfiguration =
    parseChatAnswerProductModeConfigurationMessage(message);
  if (chatAnswerProductModeConfiguration) {
    return {
      accepted: true,
      message: {
        kind: "chat-answer-product-mode.configure",
        configuration: chatAnswerProductModeConfiguration,
      },
    };
  }

  const chatAnswerProviderConfiguration =
    parseChatAnswerProviderConfigurationMessage(message);
  if (chatAnswerProviderConfiguration) {
    return {
      accepted: true,
      message: {
        kind: "chat-answer-provider.configure",
        configuration: chatAnswerProviderConfiguration,
      },
    };
  }

  const heavyPlannerProviderConfiguration =
    parseHeavyPlannerProviderConfigurationMessage(message);
  if (heavyPlannerProviderConfiguration) {
    return {
      accepted: true,
      message: {
        kind: "heavy-planner-provider.configure",
        configuration: heavyPlannerProviderConfiguration,
      },
    };
  }

  const voiceProviderConfiguration =
    parseVoiceProviderConfigurationMessage(message);
  if (voiceProviderConfiguration) {
    return {
      accepted: true,
      message: {
        kind: "voice-provider.configure",
        configuration: voiceProviderConfiguration,
      },
    };
  }

  const parsed = CoreInboundMessageSchema.safeParse(message);
  if (parsed.success) {
    return {
      accepted: true,
      message: {
        kind: "core-inbound",
        message: parsed.data,
      },
    };
  }

  return {
    accepted: false,
    reasonCode: "UNKNOWN_OR_INVALID_MESSAGE",
  };
}

export function parseCommandRouterProductModeConfigurationMessage(
  message: unknown,
): CoreHostCommandRouterProductModeConfiguration | null {
  if (
    !isRecord(message) ||
    message.kind !== "command-router-product-mode.configure" ||
    message.providerId !== "intent-router.deterministic.rules" ||
    message.mode !== "production_rules" ||
    message.directActionEnabled !== false ||
    message.realQwenRuntimeEnabled !== false ||
    message.networkAccessApproved !== false ||
    typeof message.enabled !== "boolean"
  ) {
    return null;
  }
  return {
    enabled: message.enabled,
  };
}

export function parseChatAnswerProductModeConfigurationMessage(
  message: unknown,
): CoreHostChatAnswerProductModeConfiguration | null {
  if (
    !isRecord(message) ||
    message.kind !== "chat-answer-product-mode.configure" ||
    message.providerId !== DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID ||
    message.profileId !== DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID
  ) {
    return null;
  }
  if (message.enabled !== true) {
    if (
      message.runtimeLocked !== true ||
      message.credentialIncluded !== false
    ) {
      return null;
    }
    return { enabled: false };
  }
  if (
    message.credentialIncluded === true &&
    message.runtimeLocked === false &&
    isRecord(message.configuration) &&
    message.configuration.provider ===
      DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID &&
    (message.configuration.endpoint === undefined ||
      message.configuration.endpoint === DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT) &&
    (message.configuration.modelId === undefined ||
      message.configuration.modelId === DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID) &&
    isRecord(message.configuration.credentials)
  ) {
    const apiKey = message.configuration.credentials.apiKey;
    if (
      typeof apiKey !== "string" ||
      apiKey.trim().length < 8 ||
      apiKey.length > 512
    ) {
      return null;
    }
    return {
      enabled: true,
      credential: {
        apiKey: apiKey.trim(),
      },
    };
  }
  if (message.runtimeLocked !== true || message.credentialIncluded !== false) {
    return null;
  }
  return {
    enabled: true,
  };
}

export function parseChatAnswerProviderConfigurationMessage(
  message: unknown,
): CoreHostChatAnswerProviderConfiguration | null {
  if (
    !isRecord(message) ||
    message.kind !== "chat-answer-provider.configure" ||
    !isRecord(message.configuration) ||
    message.configuration.provider !==
      DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID ||
    (message.configuration.endpoint !== undefined &&
      message.configuration.endpoint !== DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT) ||
    (message.configuration.modelId !== undefined &&
      message.configuration.modelId !== DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID) ||
    !isRecord(message.configuration.credentials)
  ) {
    return null;
  }
  const apiKey = message.configuration.credentials.apiKey;
  if (
    typeof apiKey !== "string" ||
    apiKey.trim().length < 8 ||
    apiKey.length > 512
  ) {
    return null;
  }
  return {
    provider: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
    ...(message.configuration.endpoint === DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT
      ? { endpoint: DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT }
      : {}),
    ...(message.configuration.modelId === DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID
      ? { modelId: DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID }
      : {}),
    credentials: {
      apiKey: apiKey.trim(),
    },
  };
}

export function parseHeavyPlannerProviderConfigurationMessage(
  message: unknown,
): CoreHostHeavyPlannerProviderConfiguration | null {
  if (
    !isRecord(message) ||
    message.kind !== "heavy-planner-provider.configure" ||
    !isRecord(message.configuration) ||
    !isRecord(message.configuration.credentials)
  ) {
    return null;
  }
  const provider = message.configuration.provider;
  if (provider !== "openai" && provider !== "glm") {
    return null;
  }
  const apiKey = message.configuration.credentials.apiKey;
  if (
    typeof apiKey !== "string" ||
    apiKey.trim().length < 8 ||
    apiKey.length > (provider === "glm" ? 1024 : 512)
  ) {
    return null;
  }
  return {
    provider,
    credentials: {
      apiKey: apiKey.trim(),
    },
  };
}

export function parseVoiceProviderConfigurationMessage(
  message: unknown,
): CoreHostVoiceProviderConfiguration | null {
  if (!isRecord(message) || message.kind !== "voice-provider.configure") {
    return null;
  }
  const configuration = message.configuration;
  if (!isRecord(configuration)) {
    return null;
  }
  const credentials = configuration.credentials;
  const language = configuration.language === "en" ? "en" : "zh";
  if (configuration.provider === "xunfei") {
    if (
      !isRecord(credentials) ||
      typeof credentials.appId !== "string" ||
      typeof credentials.apiKey !== "string"
    ) {
      return null;
    }
    const appId = credentials.appId.trim();
    const apiKey = credentials.apiKey.trim();
    if (appId.length === 0 || apiKey.length === 0) {
      return null;
    }
    return {
      provider: "xunfei",
      language,
      credentials: {
        appId,
        apiKey,
      },
    };
  }
  if (configuration.provider === "volcengine") {
    if (!isRecord(credentials) || typeof credentials.apiKey !== "string") {
      return null;
    }
    const apiKey = credentials.apiKey.trim();
    const resourceId =
      typeof credentials.resourceId === "string" &&
      credentials.resourceId.trim().length > 0
        ? credentials.resourceId.trim()
        : "volc.seedasr.sauc.duration";
    if (
      apiKey.length === 0 ||
      resourceId.length > 128 ||
      !/^volc\.[a-z0-9_.-]+$/i.test(resourceId)
    ) {
      return null;
    }
    return {
      provider: "volcengine",
      language,
      credentials: {
        apiKey,
        resourceId,
      },
    };
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
