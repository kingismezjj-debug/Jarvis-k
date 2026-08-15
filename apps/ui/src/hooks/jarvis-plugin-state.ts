import type {
  LocalPluginManifestDeveloperStatusResult,
  PluginManagementStatusResult,
} from "@jarvis-k/contracts";

export interface JarvisPluginState {
  pluginManagementStatus: PluginManagementStatusResult | null;
  localPluginManifestDeveloperStatus: LocalPluginManifestDeveloperStatusResult | null;
}

export const initialJarvisPluginState: JarvisPluginState = {
  pluginManagementStatus: null,
  localPluginManifestDeveloperStatus: null,
};

export type JarvisPluginAction =
  | {
      type: "pluginManagementStatus.set";
      status: PluginManagementStatusResult | null;
    }
  | {
      type: "localPluginManifestDeveloperStatus.set";
      status: LocalPluginManifestDeveloperStatusResult | null;
    }
  | { type: "reset" }
  | { type: string };

export function jarvisPluginReducer(
  state: JarvisPluginState,
  action: JarvisPluginAction,
): JarvisPluginState {
  switch (action.type) {
    case "pluginManagementStatus.set":
      return { ...state, pluginManagementStatus: action.status };
    case "localPluginManifestDeveloperStatus.set":
      return { ...state, localPluginManifestDeveloperStatus: action.status };
    case "reset":
      return initialJarvisPluginState;
    default:
      return state;
  }
}
