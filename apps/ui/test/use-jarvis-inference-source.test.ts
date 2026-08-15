import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const hookSource = [
  "use-jarvis.ts",
  "jarvis-event-router.ts",
  "use-jarvis-diagnostics-actions.ts",
  "use-jarvis-memory-actions.ts",
  "use-jarvis-plugin-actions.ts",
  "use-jarvis-voice-actions.ts",
  "use-model-governance.ts",
].map((fileName) =>
  readFileSync(
    path.resolve(import.meta.dirname, "..", "src", "hooks", fileName),
    "utf8",
  ),
).join("\n");

describe("useJarvis inference wiring", () => {
  it("runs fixture embeddings through the desktop bridge command contract", () => {
    expect(hookSource).toContain("runFixtureEmbeddingProbe");
    expect(hookSource).toContain('type: "agent.generateEmbeddings"');
    expect(hookSource).toContain("runFixtureIntentProbe");
    expect(hookSource).toContain('type: "agent.routeIntent"');
    expect(hookSource).toContain("runFixtureOcrProbe");
    expect(hookSource).toContain('type: "agent.recognizeOcr"');
    expect(hookSource).toContain("useState<FixtureOcrProbe | null>");
    expect(hookSource).toContain("runFixtureRerankProbe");
    expect(hookSource).toContain('type: "agent.rerank"');
    expect(hookSource).toContain("useState<FixtureRerankProbe | null>");
    expect(hookSource).toContain("EmbeddingGenerationResultSchema.safeParse");
    expect(hookSource).toContain("IntentRoutingResultSchema.safeParse");
    expect(hookSource).toContain("OcrRecognitionResultSchema.safeParse");
    expect(hookSource).toContain("RerankResultSchema.safeParse");
    expect(hookSource).toContain("new Uint8Array");
    expect(hookSource).toContain("ModelOperationSnapshotSchema.safeParse");
    expect(hookSource).not.toContain("@jarvis-k/inference-adapter-fixture");
  });

  it("tracks model operation events without importing provider policy", () => {
    expect(hookSource).toContain(
      'envelope.event.type === "model.operation.updated"',
    );
    expect(hookSource).toContain("setModelOperations");
    expect(hookSource).not.toContain("@jarvis-k/capabilities");
  });

  it("uses bounded Memory alpha commands through the desktop bridge", () => {
    expect(hookSource).toContain("refreshMemoryAlphaStatus");
    expect(hookSource).toContain("probeMemoryAlphaRecall");
    expect(hookSource).toContain("disableMemoryAlpha");
    expect(hookSource).toContain('type: "agent.getMemoryAlphaStatus"');
    expect(hookSource).toContain('type: "agent.probeMemoryAlphaRecall"');
    expect(hookSource).toContain('type: "agent.disableMemoryAlpha"');
    expect(hookSource).toContain("MemoryAlphaStatusSchema.safeParse");
    expect(hookSource).toContain(
      "MemoryAlphaRecallProbeResultSchema.safeParse",
    );
    expect(hookSource).not.toContain("@jarvis-k/core-host");
  });

  it("routes typed commands through Brain Alpha before product dispatch", () => {
    expect(hookSource).toContain("BrainCommandResultSchema");
    expect(hookSource).toContain("type BrainCommandSource");
    expect(hookSource).toContain("dispatchBrainCommand");
    expect(hookSource).toContain("useState<BrainCommandResult | null>");
    expect(hookSource).toContain("runBrainCommand");
    expect(hookSource).toContain('type: "agent.runBrainCommand"');
    expect(hookSource).toContain('dispatchBrainCommand(text, "text")');
    expect(hookSource).toContain("setBrainResult");
  });

  it("cancels pending Task Runtime drafts through the desktop bridge", () => {
    expect(hookSource).toContain("cancelTask");
    expect(hookSource).toContain('type: "agent.cancelTask"');
    expect(hookSource).toContain(
      "User cancelled the pending task from the Tasks view.",
    );
    expect(hookSource).toContain("await refreshSnapshot()");
    expect(hookSource).not.toContain("@jarvis-k/core-host");
  });

  it("approves pending Task Runtime drafts through the desktop bridge", () => {
    expect(hookSource).toContain("approveTask");
    expect(hookSource).toContain('type: "agent.approveTask"');
    expect(hookSource).toContain(
      'confirmation: "explicit_ui_confirmation"',
    );
    expect(hookSource).toContain("await refreshSnapshot()");
    expect(hookSource).not.toContain("@jarvis-k/core-host");
  });

  it("dispatches final voice transcripts into Brain Alpha once", () => {
    expect(hookSource).toContain("dispatchedVoiceTranscriptKeys");
    expect(hookSource).toContain(
      'envelope.event.type === "voice.transcript.updated"',
    );
    expect(hookSource).toContain("transcript.isFinal && text");
    expect(hookSource).toContain('void dispatchBrainCommand(text, "voice")');
    expect(hookSource).toContain('segmentId ?? "segmentless"');
    expect(hookSource).toContain(
      "dispatchedVoiceTranscriptKeys.current.has(key)",
    );
    expect(hookSource).toContain("textOnlyAcceptanceRef");
    expect(hookSource).toContain("if (textOnlyAcceptanceRef.current)");
  });

  it("surfaces voice service status for ASR language diagnosis", () => {
    expect(hookSource).toContain("type VoiceServiceStatus");
    expect(hookSource).toContain("useState<VoiceServiceStatus | null>");
    expect(hookSource).toContain("getVoiceServiceStatus");
    expect(hookSource).toContain("setVoiceServiceStatus(status)");
    expect(hookSource).toContain("refreshVoiceServiceStatus");
    expect(hookSource).toContain("voiceServiceStatus");
  });

  it("routes voice command correction aliases through the desktop bridge", () => {
    expect(hookSource).toContain("VoiceCommandAliasRecordSchema");
    expect(hookSource).toContain("type VoiceCommandAliasRecord");
    expect(hookSource).toContain("voiceCommandAliases");
    expect(hookSource).toContain("refreshVoiceCommandAliases");
    expect(hookSource).toContain("confirmVoiceCommandCorrection");
    expect(hookSource).toContain("deleteVoiceCommandAlias");
    expect(hookSource).toContain('type: "agent.listVoiceCommandAliases"');
    expect(hookSource).toContain(
      'type: "agent.confirmVoiceCommandCorrection"',
    );
    expect(hookSource).toContain('type: "agent.deleteVoiceCommandAlias"');
    expect(hookSource).toContain('dispatchBrainCommand(rawAlias, "voice")');
    expect(hookSource).not.toContain("voice-command-aliases.json");
  });

  it("projects user-controlled memories through provider-neutral Core commands", () => {
    expect(hookSource).toContain("UserControlledMemoryRecordSchema");
    expect(hookSource).toContain("type UserControlledMemoryKind");
    expect(hookSource).toContain("type UserControlledMemoryRecord");
    expect(hookSource).toContain("userControlledMemories");
    expect(hookSource).toContain("refreshUserControlledMemories");
    expect(hookSource).toContain("deleteUserControlledMemory");
    expect(hookSource).toContain('type: "agent.listUserControlledMemories"');
    expect(hookSource).toContain('type: "agent.deleteUserControlledMemory"');
    expect(hookSource).not.toContain("user-controlled-memories.json");
  });

  it("avoids voice and TTS status access in text-only acceptance mode", () => {
    expect(hookSource).toContain("textOnlyAcceptanceEnabled");
    expect(hookSource).toContain("setVoiceServiceStatus(null)");
    expect(hookSource).toContain("setTtsServiceStatus(null)");
    expect(hookSource).toContain("if (textOnlyAcceptanceEnabled)");
  });

  it("reads and updates Chat Answer product mode through the desktop bridge", () => {
    expect(hookSource).toContain("ChatAnswerProductModeStatusSchema");
    expect(hookSource).toContain("chatAnswerProductModeStatus");
    expect(hookSource).toContain("refreshChatAnswerProductModeStatus");
    expect(hookSource).toContain("setChatAnswerProductModeEnabled");
    expect(hookSource).toContain("getChatAnswerProductModeStatus");
  });

  it("reads and updates Command Router product mode through the desktop bridge", () => {
    expect(hookSource).toContain("CommandRouterProductModeStatusSchema");
    expect(hookSource).toContain("commandRouterProductModeStatus");
    expect(hookSource).toContain("refreshCommandRouterProductModeStatus");
    expect(hookSource).toContain("setCommandRouterProductModeEnabled");
    expect(hookSource).toContain("getCommandRouterProductModeStatus");
    expect(hookSource).toContain("setCommandRouterProductModeEnabled");
  });

  it("reads and updates bounded Qwen runtime control through the desktop bridge", () => {
    expect(hookSource).toContain("QwenRuntimeControlStatusSchema");
    expect(hookSource).toContain("type QwenRuntimeControlAction");
    expect(hookSource).toContain("type QwenRuntimeControlStatus");
    expect(hookSource).toContain("qwenRuntimeControlStatus");
    expect(hookSource).toContain("refreshQwenRuntimeControlStatus");
    expect(hookSource).toContain("setQwenRuntimeControlAction");
    expect(hookSource).toContain("getQwenRuntimeControlStatus");
    expect(hookSource).toContain(
      "window.jarvis.setQwenRuntimeControlAction(action)",
    );
    expect(hookSource).not.toContain("@jarvis-k/inference-adapter-qwen-router");
  });

  it("reads plugin management status as a list-only desktop bridge projection", () => {
    expect(hookSource).toContain("PluginManagementStatusResultSchema");
    expect(hookSource).toContain("LocalPluginEnabledStateSetResultSchema");
    expect(hookSource).toContain(
      "LocalPluginManifestDeveloperStatusResultSchema",
    );
    expect(hookSource).toContain("type PluginManagementStatusResult");
    expect(hookSource).toContain("type LocalPluginEnabledStateSetResult");
    expect(hookSource).toContain(
      "type LocalPluginManifestDeveloperStatusResult",
    );
    expect(hookSource).toContain("pluginManagementStatus");
    expect(hookSource).toContain("localPluginManifestDeveloperStatus");
    expect(hookSource).toContain("refreshPlugins");
    expect(hookSource).toContain("refreshLocalPluginManifestDeveloperStatus");
    expect(hookSource).toContain('type: "agent.getPluginManagementStatus"');
    expect(hookSource).toContain(
      'type: "agent.getLocalPluginManifestDeveloperStatus"',
    );
    expect(hookSource).toContain('type: "agent.setLocalPluginEnabledState"');
    expect(hookSource).toContain("setPluginManagementStatus(status.data)");
    expect(hookSource).toContain(
      "setLocalPluginManifestDeveloperStatus(status.data)",
    );
    expect(hookSource).toContain("setLocalPluginEnabledState");
    expect(hookSource).not.toContain('type: "agent.invokePlugin"');
  });
});
