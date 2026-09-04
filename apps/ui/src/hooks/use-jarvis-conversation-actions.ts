import { useCallback } from "react";
import {
  BrainCommandResultSchema,
  type AppCommand,
  type AssistantTurnId,
  type BrainCommandResult,
  type BrainCommandSource,
  type VoiceAsrProviderId,
  type VoiceInputMode,
  type VoiceInputModeSource,
} from "@jarvis-k/contracts";

interface UseJarvisConversationActionsOptions {
  brainResult: BrainCommandResult | null;
  setBrainResult(brainResult: BrainCommandResult | null): void;
  setError(message: string | null): void;
  setSending(value: boolean): void;
  sendCommand(command: AppCommand): Promise<boolean>;
}

export function useJarvisConversationActions({
  brainResult,
  setBrainResult,
  setError,
  setSending,
  sendCommand,
}: UseJarvisConversationActionsOptions) {
  const dispatchBrainCommand = useCallback(
    async (
      text: string,
      source: BrainCommandSource,
      options?: {
        asrProviderId?: VoiceAsrProviderId | undefined;
        voiceInputMode?: VoiceInputMode | undefined;
        voiceInputModeSource?: VoiceInputModeSource | undefined;
      },
    ) => {
      if (!window.jarvis) {
        setError("Desktop bridge unavailable.");
        return false;
      }

      setSending(true);
      try {
        const result = await window.jarvis.sendCommand({
          type: "agent.runBrainCommand",
          payload: {
            source,
            text,
            ...(source === "voice" && options?.asrProviderId
              ? { asrProviderId: options.asrProviderId }
              : {}),
            ...(source === "voice" && options?.voiceInputMode
              ? { voiceInputMode: options.voiceInputMode }
              : {}),
            ...(source === "voice" && options?.voiceInputModeSource
              ? { voiceInputModeSource: options.voiceInputModeSource }
              : {}),
          },
        });
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }
        const brain = BrainCommandResultSchema.safeParse(
          (result.data as { brain?: unknown } | undefined)?.brain,
        );
        if (!brain.success) {
          setError("Core returned an invalid Brain result.");
          return false;
        }
        setBrainResult(
          brain.data.dispatchStatus === "running" ? null : brain.data,
        );
        setError(null);
        return true;
      } finally {
        setSending(false);
      }
    },
    [setBrainResult, setError, setSending],
  );

  const sendMessage = useCallback(
    async (text: string) =>
      sendCommand({
        type: "agent.sendMessage",
        payload: {
          text,
        },
      }),
    [sendCommand],
  );

  const runBrainCommand = useCallback(
    async (text: string) => dispatchBrainCommand(text, "text"),
    [dispatchBrainCommand],
  );

  const cancelAssistantTurn = useCallback(
    async (turnId: AssistantTurnId) =>
      sendCommand({
        type: "agent.cancelAssistantTurn",
        payload: { turnId },
      }),
    [sendCommand],
  );

  const retryBrainCommand = useCallback(async () => {
    if (
      !brainResult ||
      (brainResult.dispatchStatus !== "blocked" &&
        brainResult.dispatchStatus !== "degraded")
    ) {
      return false;
    }
    return dispatchBrainCommand(brainResult.text, brainResult.source);
  }, [brainResult, dispatchBrainCommand]);

  const rollbackBrainResult = useCallback(() => {
    if (!brainResult) return false;
    setBrainResult(null);
    setError(null);
    return true;
  }, [brainResult, setBrainResult, setError]);

  const clearSessionHistory = useCallback(
    async () =>
      sendCommand({
        type: "agent.clearSessionHistory",
        payload: {},
      }),
    [sendCommand],
  );

  const createConversation = useCallback(
    async () =>
      sendCommand({
        type: "agent.createConversation",
        payload: {},
      }),
    [sendCommand],
  );

  const selectConversation = useCallback(
    async (conversationId: string) =>
      sendCommand({
        type: "agent.selectConversation",
        payload: { conversationId },
      }),
    [sendCommand],
  );

  const renameConversation = useCallback(
    async (conversationId: string, title: string) =>
      sendCommand({
        type: "agent.renameConversation",
        payload: { conversationId, title },
      }),
    [sendCommand],
  );

  return {
    clearSessionHistory,
    cancelAssistantTurn,
    createConversation,
    dispatchBrainCommand,
    renameConversation,
    retryBrainCommand,
    rollbackBrainResult,
    runBrainCommand,
    sendMessage,
    selectConversation,
  };
}
