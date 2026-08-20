import path from "node:path";

export const QWEN_RETAINED_SESSION_ID =
  "qwen-retained-product-session-2026-08-10" as const;

export interface QwenRuntimeConfig {
  retainedSessionId: typeof QWEN_RETAINED_SESSION_ID;
  retainedSessionMarkerPath: string;
  routeRequestLimit: 3 | 5 | 10;
}

export interface CreateQwenRuntimeConfigOptions {
  baseDirectory?: string;
  env?: NodeJS.ProcessEnv;
}

export function createQwenRuntimeConfig(
  options: CreateQwenRuntimeConfigOptions = {},
): QwenRuntimeConfig {
  const baseDirectory = options.baseDirectory ?? __dirname;
  const env = options.env ?? process.env;
  const retainedSessionMarkerPath =
    env.JARVIS_K_QWEN_RETAINED_SESSION_MARKER_PATH?.trim();
  return {
    retainedSessionId: QWEN_RETAINED_SESSION_ID,
    retainedSessionMarkerPath: retainedSessionMarkerPath
      ? path.resolve(retainedSessionMarkerPath)
      : path.join(
          baseDirectory,
          "..",
          "..",
          "..",
          "models",
          QWEN_RETAINED_SESSION_ID,
          "session-marker.sanitized.json",
        ),
    routeRequestLimit: qwenConversationSurfaceRouteLimit(env),
  };
}

export function qwenConversationSurfaceRouteLimit(
  env: NodeJS.ProcessEnv = process.env,
): 3 | 5 | 10 {
  if (env.JARVIS_K_QWEN_CONVERSATION_SURFACE_EXTENDED_USAGE === "1") {
    return 10;
  }
  return env.JARVIS_K_QWEN_CONVERSATION_SURFACE_USAGE === "1" ? 5 : 3;
}
