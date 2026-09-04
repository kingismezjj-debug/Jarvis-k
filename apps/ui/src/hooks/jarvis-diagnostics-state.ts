import type {
  ChatAnswerProviderConfigurationStatus,
  ChatAnswerProductModeStatus,
  CommandRouterLocalAppLaunchResult,
  CommandRouterProductModeStatus,
  QwenRuntimeControlStatus,
} from "@jarvis-k/contracts";

export interface JarvisDiagnosticsState {
  chatAnswerProviderConfigurationStatus: ChatAnswerProviderConfigurationStatus | null;
  chatAnswerProductModeStatus: ChatAnswerProductModeStatus | null;
  commandRouterProductModeStatus: CommandRouterProductModeStatus | null;
  qwenRuntimeControlStatus: QwenRuntimeControlStatus | null;
  commandRouterLocalAppLaunchResult: CommandRouterLocalAppLaunchResult | null;
}

export const initialJarvisDiagnosticsState: JarvisDiagnosticsState = {
  chatAnswerProviderConfigurationStatus: null,
  chatAnswerProductModeStatus: null,
  commandRouterProductModeStatus: null,
  qwenRuntimeControlStatus: null,
  commandRouterLocalAppLaunchResult: null,
};

export type JarvisDiagnosticsAction =
  | {
      type: "chatAnswerProviderConfigurationStatus.set";
      status: ChatAnswerProviderConfigurationStatus | null;
    }
  | {
      type: "chatAnswerProductModeStatus.set";
      status: ChatAnswerProductModeStatus | null;
    }
  | {
      type: "commandRouterProductModeStatus.set";
      status: CommandRouterProductModeStatus | null;
    }
  | {
      type: "qwenRuntimeControlStatus.set";
      status: QwenRuntimeControlStatus | null;
    }
  | {
      type: "commandRouterLocalAppLaunchResult.set";
      result: CommandRouterLocalAppLaunchResult | null;
    }
  | { type: "reset" }
  | { type: string };

export function jarvisDiagnosticsReducer(
  state: JarvisDiagnosticsState,
  action: JarvisDiagnosticsAction,
): JarvisDiagnosticsState {
  switch (action.type) {
    case "chatAnswerProviderConfigurationStatus.set":
      return { ...state, chatAnswerProviderConfigurationStatus: action.status };
    case "chatAnswerProductModeStatus.set":
      return { ...state, chatAnswerProductModeStatus: action.status };
    case "commandRouterProductModeStatus.set":
      return { ...state, commandRouterProductModeStatus: action.status };
    case "qwenRuntimeControlStatus.set":
      return { ...state, qwenRuntimeControlStatus: action.status };
    case "commandRouterLocalAppLaunchResult.set":
      return { ...state, commandRouterLocalAppLaunchResult: action.result };
    case "reset":
      return initialJarvisDiagnosticsState;
    default:
      return state;
  }
}
