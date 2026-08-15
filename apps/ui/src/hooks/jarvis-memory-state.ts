import type {
  CoreSnapshot,
  MemoryAlphaRecallProbeResult,
  MemoryAlphaStatus,
  UserControlledMemoryRecord,
  UserRouteAliasRecord,
} from "@jarvis-k/contracts";

export interface JarvisMemoryState {
  memoryAlphaStatus: MemoryAlphaStatus | null;
  memoryAlphaRecallProbe: MemoryAlphaRecallProbeResult | null;
  userRouteAliases: UserRouteAliasRecord[];
  userControlledMemories: UserControlledMemoryRecord[];
}

export const initialJarvisMemoryState: JarvisMemoryState = {
  memoryAlphaStatus: null,
  memoryAlphaRecallProbe: null,
  userRouteAliases: [],
  userControlledMemories: [],
};

export type JarvisMemoryAction =
  | { type: "snapshot.apply"; snapshot: CoreSnapshot }
  | { type: "memoryAlphaStatus.set"; status: MemoryAlphaStatus | null }
  | {
      type: "memoryAlphaProbe.set";
      status: MemoryAlphaStatus;
      probe: MemoryAlphaRecallProbeResult;
    }
  | { type: "routeAliases.set"; aliases: UserRouteAliasRecord[] }
  | { type: "controlledMemories.set"; memories: UserControlledMemoryRecord[] }
  | { type: "reset" }
  | { type: string };

export function jarvisMemoryReducer(
  state: JarvisMemoryState,
  action: JarvisMemoryAction,
): JarvisMemoryState {
  switch (action.type) {
    case "snapshot.apply":
      return {
        ...state,
        memoryAlphaStatus: action.snapshot.memoryAlpha ?? null,
      };
    case "memoryAlphaStatus.set":
      return { ...state, memoryAlphaStatus: action.status };
    case "memoryAlphaProbe.set":
      return {
        ...state,
        memoryAlphaStatus: action.status,
        memoryAlphaRecallProbe: action.probe,
      };
    case "routeAliases.set":
      return { ...state, userRouteAliases: action.aliases };
    case "controlledMemories.set":
      return { ...state, userControlledMemories: action.memories };
    case "reset":
      return initialJarvisMemoryState;
    default:
      return state;
  }
}
