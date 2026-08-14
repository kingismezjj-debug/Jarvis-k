import {
  FixtureChatAnswerProvider,
  type ChatAnswerProvider
} from "@jarvis-k/capabilities";
import type { CoreChatAnswerOptions } from "@jarvis-k/core";

export interface CoreHostFixtureChatAnswerComposition {
  readonly provider?: ChatAnswerProvider;
  readonly options?: CoreChatAnswerOptions;
  readonly report: {
    readonly status: "available" | "disabled";
    readonly providerId: "chat-answer.fixture";
    readonly explicitEnablement: boolean;
    readonly networkAccessed: false;
    readonly credentialAccessed: false;
    readonly modelRuntimeAccessed: false;
    readonly memoryAccessed: false;
    readonly directActionAttempted: false;
    readonly defaultBehaviorChanged: false;
  };
}

export function createCoreHostFixtureChatAnswerComposition(input: {
  enabled: boolean;
}): CoreHostFixtureChatAnswerComposition {
  const enabled = input.enabled === true;
  const report: CoreHostFixtureChatAnswerComposition["report"] = {
    status: enabled ? "available" : "disabled",
    providerId: "chat-answer.fixture" as const,
    explicitEnablement: enabled,
    networkAccessed: false as const,
    credentialAccessed: false as const,
    modelRuntimeAccessed: false as const,
    memoryAccessed: false as const,
    directActionAttempted: false as const,
    defaultBehaviorChanged: false as const
  };

  if (!enabled) {
    return { report };
  }

  return {
    provider: new FixtureChatAnswerProvider(),
    options: {
      enabled: true,
      providerId: "chat-answer.fixture"
    },
    report
  };
}
