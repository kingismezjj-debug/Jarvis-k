import type { BrainCommandResult } from "@jarvis-k/contracts";

export interface JarvisConversationState {
  brainResult: BrainCommandResult | null;
}

export const initialJarvisConversationState: JarvisConversationState = {
  brainResult: null,
};

export type JarvisConversationAction =
  | { type: "brainResult.set"; brainResult: BrainCommandResult | null }
  | { type: "reset" }
  | { type: string };

export function jarvisConversationReducer(
  state: JarvisConversationState,
  action: JarvisConversationAction,
): JarvisConversationState {
  switch (action.type) {
    case "brainResult.set":
      return { ...state, brainResult: action.brainResult };
    case "reset":
      return initialJarvisConversationState;
    default:
      return state;
  }
}
