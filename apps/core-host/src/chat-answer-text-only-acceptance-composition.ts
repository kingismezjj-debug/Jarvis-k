import type { CoreTextOnlyAcceptanceOptions } from "@jarvis-k/core";

export interface CoreHostChatAnswerTextOnlyAcceptanceComposition {
  readonly options?: CoreTextOnlyAcceptanceOptions;
  readonly report: {
    readonly status: "available" | "disabled";
    readonly explicitEnablement: boolean;
    readonly fixtureChatAnswerRequired: true;
    readonly voiceInputEnabled: false;
    readonly credentialAccessed: false;
    readonly networkAccessed: false;
    readonly modelRuntimeAccessed: false;
    readonly memoryVectorAccessed: false;
    readonly directActionAttempted: false;
    readonly defaultBehaviorChanged: false;
  };
}

export function createCoreHostChatAnswerTextOnlyAcceptanceComposition(input: {
  enabled: boolean;
  fixtureChatAnswerEnabled: boolean;
}): CoreHostChatAnswerTextOnlyAcceptanceComposition {
  const explicitEnablement = input.enabled === true;
  const fixtureChatAnswerEnabled = input.fixtureChatAnswerEnabled === true;
  const available = explicitEnablement && fixtureChatAnswerEnabled;
  const report: CoreHostChatAnswerTextOnlyAcceptanceComposition["report"] = {
    status: available ? "available" : "disabled",
    explicitEnablement,
    fixtureChatAnswerRequired: true,
    voiceInputEnabled: false,
    credentialAccessed: false,
    networkAccessed: false,
    modelRuntimeAccessed: false,
    memoryVectorAccessed: false,
    directActionAttempted: false,
    defaultBehaviorChanged: false
  };

  return {
    ...(available ? { options: { enabled: true } } : {}),
    report
  };
}

export function shouldDisableCoreHostMemoryForChatAnswerTextOnlyAcceptance(
  input: {
    enabled: boolean;
    fixtureChatAnswerEnabled: boolean;
  }
): boolean {
  return input.enabled === true && input.fixtureChatAnswerEnabled === true;
}
