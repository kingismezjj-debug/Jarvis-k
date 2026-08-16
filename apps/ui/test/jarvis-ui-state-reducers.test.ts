import { describe, expect, it } from "vitest";
import type {
  BrainCommandResult,
  ChatAnswerProductModeStatus,
  CommandRouterProductModeStatus,
  CoreSnapshot,
  MemoryAlphaRecallProbeResult,
  MemoryAlphaStatus,
  PluginManagementStatusResult,
  TtsServiceStatus,
  VoiceRegressionCollectionStatus,
  VoiceRegressionRecord,
  VoiceRegressionSample,
  VoiceServiceStatus,
} from "@jarvis-k/contracts";
import {
  initialJarvisConversationState,
  jarvisConversationReducer,
} from "../src/hooks/jarvis-conversation-state";
import {
  initialJarvisDiagnosticsState,
  jarvisDiagnosticsReducer,
} from "../src/hooks/jarvis-diagnostics-state";
import {
  initialJarvisMemoryState,
  jarvisMemoryReducer,
} from "../src/hooks/jarvis-memory-state";
import {
  initialJarvisPluginState,
  jarvisPluginReducer,
} from "../src/hooks/jarvis-plugin-state";
import {
  initialJarvisVoiceState,
  jarvisVoiceReducer,
} from "../src/hooks/jarvis-voice-state";

describe("jarvis UI state reducers", () => {
  it("keeps conversation reducer pure for set, reset, and unknown actions", () => {
    const brainResult = { text: "open notepad" } as BrainCommandResult;
    const initial = initialJarvisConversationState;
    const updated = jarvisConversationReducer(initial, {
      type: "brainResult.set",
      brainResult,
    });

    expect(updated).toEqual({ brainResult });
    expect(initial).toEqual(initialJarvisConversationState);
    expect(jarvisConversationReducer(updated, { type: "unknown" })).toBe(
      updated,
    );
    expect(jarvisConversationReducer(updated, { type: "reset" })).toEqual(
      initialJarvisConversationState,
    );
  });

  it("keeps memory reducer pure for snapshot, probe, reset, and unknown actions", () => {
    const memoryAlphaStatus = { enabled: true } as MemoryAlphaStatus;
    const probe = { query: "memory" } as MemoryAlphaRecallProbeResult;
    const snapshot = { memoryAlpha: memoryAlphaStatus } as CoreSnapshot;
    const initial = initialJarvisMemoryState;

    const fromSnapshot = jarvisMemoryReducer(initial, {
      type: "snapshot.apply",
      snapshot,
    });
    const withProbe = jarvisMemoryReducer(fromSnapshot, {
      type: "memoryAlphaProbe.set",
      status: memoryAlphaStatus,
      probe,
    });

    expect(fromSnapshot.memoryAlphaStatus).toBe(memoryAlphaStatus);
    expect(withProbe.memoryAlphaRecallProbe).toBe(probe);
    expect(initial).toEqual(initialJarvisMemoryState);
    expect(jarvisMemoryReducer(withProbe, { type: "unknown" })).toBe(
      withProbe,
    );
    expect(jarvisMemoryReducer(withProbe, { type: "reset" })).toEqual(
      initialJarvisMemoryState,
    );
  });

  it("keeps voice reducer pure for service state, text-only reset, and unknown actions", () => {
    const voiceStatus = { available: true } as VoiceServiceStatus;
    const ttsStatus = { available: true } as TtsServiceStatus;
    const regressionStatus = {
      consentLevel: "local_text",
      recordCount: 1,
      pendingCount: 1,
      retentionMaxRecords: 10_000,
      retentionMaxAgeDays: 30,
      retentionMaxBytes: 5 * 1024 * 1024,
      retentionApproximateBytes: 512,
      retentionDeletedCount: 0,
      retentionPolicy: "local_text_30d_10000_records_5mb",
    } as VoiceRegressionCollectionStatus;
    const regressionSample = {
      id: "voice-regression-sample_1",
      asr: { rawTranscript: "open notepad" },
      privacy: { containsAudio: false, uploadAllowed: false },
    } as VoiceRegressionSample;
    const regressionRecord = {
      id: "voice-regression_1",
      asr: { rawTranscript: "open notepad" },
      privacy: { containsAudio: false, uploadAllowed: false },
    } as VoiceRegressionRecord;
    const withVoice = jarvisVoiceReducer(initialJarvisVoiceState, {
      type: "voiceServiceStatus.set",
      status: voiceStatus,
    });
    const withTts = jarvisVoiceReducer(withVoice, {
      type: "ttsServiceStatus.set",
      status: ttsStatus,
    });
    const withRegressionStatus = jarvisVoiceReducer(withTts, {
      type: "voiceRegressionStatus.set",
      status: regressionStatus,
    });
    const withRegressionPending = jarvisVoiceReducer(withRegressionStatus, {
      type: "voiceRegressionPendingSamples.set",
      samples: [regressionSample],
    });
    const withRegressionRecords = jarvisVoiceReducer(withRegressionPending, {
      type: "voiceRegressionRecords.set",
      records: [regressionRecord],
    });
    const withRegressionExport = jarvisVoiceReducer(withRegressionRecords, {
      type: "voiceRegressionExport.set",
      exportText: "{}",
    });
    const textOnly = jarvisVoiceReducer(withRegressionExport, {
      type: "textOnlyAcceptance.apply",
    });

    expect(withTts.voiceServiceStatus).toBe(voiceStatus);
    expect(withTts.ttsServiceStatus).toBe(ttsStatus);
    expect(withRegressionStatus.voiceRegressionStatus).toBe(regressionStatus);
    expect(withRegressionPending.voiceRegressionPendingSamples).toEqual([
      regressionSample,
    ]);
    expect(withRegressionRecords.voiceRegressionRecords).toEqual([
      regressionRecord,
    ]);
    expect(withRegressionExport.voiceRegressionExportText).toBe("{}");
    expect(textOnly.voiceServiceStatus).toBeNull();
    expect(textOnly.ttsServiceStatus).toBeNull();
    expect(textOnly.voiceRegressionStatus).toBe(regressionStatus);
    expect(jarvisVoiceReducer(withRegressionExport, { type: "unknown" })).toBe(
      withRegressionExport,
    );
    expect(jarvisVoiceReducer(withRegressionExport, { type: "reset" })).toEqual(
      initialJarvisVoiceState,
    );
  });

  it("keeps diagnostics reducer pure for status updates, reset, and unknown actions", () => {
    const chatStatus = { enabled: true } as ChatAnswerProductModeStatus;
    const commandStatus = { enabled: true } as CommandRouterProductModeStatus;
    const withChat = jarvisDiagnosticsReducer(initialJarvisDiagnosticsState, {
      type: "chatAnswerProductModeStatus.set",
      status: chatStatus,
    });
    const withCommand = jarvisDiagnosticsReducer(withChat, {
      type: "commandRouterProductModeStatus.set",
      status: commandStatus,
    });

    expect(withCommand.chatAnswerProductModeStatus).toBe(chatStatus);
    expect(withCommand.commandRouterProductModeStatus).toBe(commandStatus);
    expect(
      jarvisDiagnosticsReducer(withCommand, { type: "unknown" }),
    ).toBe(withCommand);
    expect(jarvisDiagnosticsReducer(withCommand, { type: "reset" })).toEqual(
      initialJarvisDiagnosticsState,
    );
  });

  it("keeps plugin reducer pure for status updates, reset, and unknown actions", () => {
    const status = { plugins: [] } as PluginManagementStatusResult;
    const updated = jarvisPluginReducer(initialJarvisPluginState, {
      type: "pluginManagementStatus.set",
      status,
    });

    expect(updated.pluginManagementStatus).toBe(status);
    expect(initialJarvisPluginState.pluginManagementStatus).toBeNull();
    expect(jarvisPluginReducer(updated, { type: "unknown" })).toBe(updated);
    expect(jarvisPluginReducer(updated, { type: "reset" })).toEqual(
      initialJarvisPluginState,
    );
  });
});
