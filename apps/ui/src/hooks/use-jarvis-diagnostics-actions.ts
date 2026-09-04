import { useCallback, useRef } from "react";
import {
  ChatAnswerProviderConfigurationCommandResultSchema,
  ChatAnswerProviderConfigurationStatusSchema,
  ChatAnswerProductModeStatusSchema,
  CommandRouterLocalAppLaunchResultSchema,
  CommandRouterProductModeStatusSchema,
  QwenRuntimeControlStatusSchema,
  type AppCommand,
  type ChatAnswerProductModeStatus,
  type ChatAnswerProviderConfigurationSaveRequest,
  type ChatAnswerProviderConfigurationStatus,
  type CommandRouterLocalAppLaunchResult,
  type CommandRouterProductModeStatus,
  type QwenRuntimeControlAction,
  type QwenRuntimeControlStatus,
} from "@jarvis-k/contracts";

interface UseJarvisDiagnosticsActionsOptions {
  setError(message: string | null): void;
  setSending(value: boolean): void;
  sendCommand(command: AppCommand): Promise<boolean>;
  setChatAnswerProductModeStatus(
    status: ChatAnswerProductModeStatus | null,
  ): void;
  setChatAnswerProviderConfigurationStatus(
    status: ChatAnswerProviderConfigurationStatus | null,
  ): void;
  getChatAnswerProviderConfigurationStatusSnapshot?():
    | ChatAnswerProviderConfigurationStatus
    | null;
  setCommandRouterProductModeStatus(
    status: CommandRouterProductModeStatus | null,
  ): void;
  setQwenRuntimeControlStatus(status: QwenRuntimeControlStatus | null): void;
  setCommandRouterLocalAppLaunchResult(
    result: CommandRouterLocalAppLaunchResult | null,
  ): void;
}

export function useJarvisDiagnosticsActions({
  setError,
  setSending,
  sendCommand,
  setChatAnswerProductModeStatus,
  setChatAnswerProviderConfigurationStatus,
  getChatAnswerProviderConfigurationStatusSnapshot,
  setCommandRouterProductModeStatus,
  setQwenRuntimeControlStatus,
  setCommandRouterLocalAppLaunchResult,
}: UseJarvisDiagnosticsActionsOptions) {
  const activeChatAnswerConnectionTestAttemptId = useRef<string | null>(null);
  const probeCore = useCallback(
    async () =>
      sendCommand({
        type: "agent.ping",
        payload: { sentAt: new Date().toISOString() },
      }),
    [sendCommand],
  );

  const refreshCapabilities = useCallback(
    async () =>
      sendCommand({
        type: "agent.getCapabilities",
        payload: {},
      }),
    [sendCommand],
  );

  const refreshChatAnswerProductModeStatus = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    try {
      const status = ChatAnswerProductModeStatusSchema.parse(
        await window.jarvis.getChatAnswerProductModeStatus(),
      );
      setChatAnswerProductModeStatus(status);
      setError(null);
      return true;
    } catch {
      setError("Chat Answer product mode status could not be read.");
      return false;
    }
  }, [setChatAnswerProductModeStatus, setError]);

  const refreshChatAnswerProviderConfigurationStatus =
    useCallback(async () => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      try {
        const status = ChatAnswerProviderConfigurationStatusSchema.parse(
          await window.jarvis.getChatAnswerProviderConfigurationStatus(),
        );
        setChatAnswerProviderConfigurationStatus(status);
        setError(null);
        return true;
      } catch {
        setError("Online answer service settings could not be read.");
        return false;
      }
    }, [setChatAnswerProviderConfigurationStatus, setError]);

  const applyChatAnswerProviderConfigurationResult = useCallback(
    async (
      action: () => Promise<{
        ok: boolean;
        status: ChatAnswerProviderConfigurationStatus;
        message?: string;
      }>,
      failureMessage: string,
    ) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      setSending(true);
      try {
        const result = await action();
        setChatAnswerProviderConfigurationStatus(result.status);
        await refreshChatAnswerProductModeStatus();
        if (!result.ok) {
          setError(result.message ?? failureMessage);
          return false;
        }
        setError(null);
        return true;
      } catch {
        setError(failureMessage);
        return false;
      } finally {
        setSending(false);
      }
    },
    [
      refreshChatAnswerProductModeStatus,
      setChatAnswerProviderConfigurationStatus,
      setError,
      setSending,
    ],
  );

  const saveChatAnswerProviderConfiguration = useCallback(
    async (request: ChatAnswerProviderConfigurationSaveRequest) =>
      applyChatAnswerProviderConfigurationResult(
        () => window.jarvis.saveChatAnswerProviderConfiguration(request),
        "Online answer service configuration could not be saved.",
      ),
    [applyChatAnswerProviderConfigurationResult],
  );

  const replaceChatAnswerProviderCredential = useCallback(
    async (apiKey: string) =>
      applyChatAnswerProviderConfigurationResult(
        () =>
          window.jarvis.replaceChatAnswerProviderCredential({
            providerId: "chat-answer.openai-compatible.deepseek",
            apiKey,
          }),
        "Online answer service key could not be saved.",
      ),
    [applyChatAnswerProviderConfigurationResult],
  );

  const testChatAnswerProviderConnection = useCallback(
    async () => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      const attemptId = createChatAnswerConnectionTestAttemptId();
      activeChatAnswerConnectionTestAttemptId.current = attemptId;
      const currentStatus = getChatAnswerProviderConfigurationStatusSnapshot?.();
      if (currentStatus) {
        setChatAnswerProviderConfigurationStatus({
          ...currentStatus,
          connectionTestStatus: "testing",
          connectionTestAttemptId: attemptId,
          reasonCodes: ["CHAT_ANSWER_PROVIDER_CONNECTION_TESTING"],
        });
      }
      setSending(true);
      try {
        const result = await window.jarvis.testChatAnswerProviderConnection({
          providerId: "chat-answer.openai-compatible.deepseek",
          userConfirmedNetworkRequest: true,
          connectionTestAttemptId: attemptId,
        });
        const parsedResult =
          ChatAnswerProviderConfigurationCommandResultSchema.parse(result);
        if (
          parsedResult.status.connectionTestAttemptId !== attemptId ||
          activeChatAnswerConnectionTestAttemptId.current !== attemptId
        ) {
          return true;
        }
        setChatAnswerProviderConfigurationStatus(parsedResult.status);
        await refreshChatAnswerProductModeStatus();
        setError(null);
        return true;
      } catch {
        if (activeChatAnswerConnectionTestAttemptId.current === attemptId) {
          setError("Online answer service connection test could not run.");
        }
        return false;
      } finally {
        if (activeChatAnswerConnectionTestAttemptId.current === attemptId) {
          activeChatAnswerConnectionTestAttemptId.current = null;
        }
        setSending(false);
      }
    },
    [
      getChatAnswerProviderConfigurationStatusSnapshot,
      refreshChatAnswerProductModeStatus,
      setChatAnswerProviderConfigurationStatus,
      setError,
      setSending,
    ],
  );

  const setChatAnswerProviderConfigurationEnabled = useCallback(
    async (enabled: boolean) =>
      applyChatAnswerProviderConfigurationResult(
        () =>
          window.jarvis.setChatAnswerProviderConfigurationEnabled({
            providerId: "chat-answer.openai-compatible.deepseek",
            enabled,
            requireRecentSuccessfulTest: true,
          }),
        "Online answer service could not be changed.",
      ),
    [applyChatAnswerProviderConfigurationResult],
  );

  const removeChatAnswerProviderConfiguration = useCallback(
    async () =>
      applyChatAnswerProviderConfigurationResult(
        () =>
          window.jarvis.removeChatAnswerProviderConfiguration({
            providerId: "chat-answer.openai-compatible.deepseek",
            confirmRemove: "remove_current_chat_answer_provider_configuration",
          }),
        "Online answer service configuration could not be removed.",
      ),
    [applyChatAnswerProviderConfigurationResult],
  );

  const refreshCommandRouterProductModeStatus = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    try {
      const status = CommandRouterProductModeStatusSchema.parse(
        await window.jarvis.getCommandRouterProductModeStatus(),
      );
      setCommandRouterProductModeStatus(status);
      setError(null);
      return true;
    } catch {
      setError("Command Router product mode status could not be read.");
      return false;
    }
  }, [setCommandRouterProductModeStatus, setError]);

  const refreshQwenRuntimeControlStatus = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }
    try {
      const status = QwenRuntimeControlStatusSchema.parse(
        await window.jarvis.getQwenRuntimeControlStatus(),
      );
      setQwenRuntimeControlStatus(status);
      setError(null);
      return true;
    } catch {
      setError("Qwen runtime control status could not be read.");
      return false;
    }
  }, [setError, setQwenRuntimeControlStatus]);

  const setQwenRuntimeControlAction = useCallback(
    async (action: QwenRuntimeControlAction) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      try {
        const result = await window.jarvis.setQwenRuntimeControlAction(action);
        setQwenRuntimeControlStatus(result.status);
        if (!result.ok) {
          setError(
            result.message ?? "Qwen runtime control could not be changed.",
          );
          return false;
        }
        setError(null);
        return true;
      } catch {
        setError("Qwen runtime control could not be changed.");
        return false;
      }
    },
    [setError, setQwenRuntimeControlStatus],
  );

  const setCommandRouterProductModeEnabled = useCallback(
    async (enabled: boolean) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      try {
        const result =
          await window.jarvis.setCommandRouterProductModeEnabled(enabled);
        setCommandRouterProductModeStatus(result.status);
        if (!result.ok) {
          setError(
            result.message ??
              "Command Router product mode could not be changed.",
          );
          return false;
        }
        setError(null);
        return true;
      } catch {
        setError("Command Router product mode could not be changed.");
        return false;
      }
    },
    [setCommandRouterProductModeStatus, setError],
  );

  const setChatAnswerProductModeEnabled = useCallback(
    async (enabled: boolean) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }
      try {
        const result =
          await window.jarvis.setChatAnswerProductModeEnabled(enabled);
        setChatAnswerProductModeStatus(result.status);
        if (!result.ok) {
          setError(
            result.message ?? "Chat Answer product mode could not be changed.",
          );
          return false;
        }
        setError(null);
        return true;
      } catch {
        setError("Chat Answer product mode could not be changed.");
        return false;
      }
    },
    [setChatAnswerProductModeStatus, setError],
  );

  const confirmCommandRouterLocalAppLaunch = useCallback(
    async (target: string) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return null;
      }
      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.confirmCommandRouterLocalAppLaunch",
          payload: {
            target,
            confirmation: "explicit_ui_confirmation",
          },
        });
        if (!result.ok) {
          setError(result.error.message);
          return null;
        }
        const launch = CommandRouterLocalAppLaunchResultSchema.safeParse(
          (result.data as { launch?: unknown } | undefined)?.launch,
        );
        if (!launch.success) {
          setError("Core returned an invalid local app launch result.");
          return null;
        }
        setCommandRouterLocalAppLaunchResult(launch.data);
        setError(null);
        return launch.data;
      } finally {
        setSending(false);
      }
    },
    [setCommandRouterLocalAppLaunchResult, setError, setSending],
  );

  return {
    confirmCommandRouterLocalAppLaunch,
    probeCore,
    refreshCapabilities,
    refreshChatAnswerProviderConfigurationStatus,
    refreshChatAnswerProductModeStatus,
    refreshCommandRouterProductModeStatus,
    refreshQwenRuntimeControlStatus,
    removeChatAnswerProviderConfiguration,
    replaceChatAnswerProviderCredential,
    saveChatAnswerProviderConfiguration,
    setChatAnswerProductModeEnabled,
    setChatAnswerProviderConfigurationEnabled,
    setCommandRouterProductModeEnabled,
    setQwenRuntimeControlAction,
    testChatAnswerProviderConnection,
  };
}

function createChatAnswerConnectionTestAttemptId(): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/gu, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `chat_answer_connection_test_${random.slice(0, 48)}`;
}
