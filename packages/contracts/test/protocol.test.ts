import { describe, expect, it } from "vitest";
import {
  AppEventSchema,
  CapabilitySnapshotSchema,
  CommandEnvelopeSchema,
  CoreSnapshotSchema,
  CoreInboundMessageSchema,
  PROTOCOL_VERSION,
  CoreVoiceAudioMessageSchema,
  MemorySnapshotSchema,
  VoiceAudioFrameSchema,
  VoiceAudioFrameMetadataSchema,
  createCommandEnvelope
} from "../src";

describe("protocol contracts", () => {
  it("creates a valid command envelope", () => {
    const envelope = createCommandEnvelope({
      type: "agent.sendMessage",
      payload: {
        conversationId: "primary",
        text: "Status check"
      }
    });

    expect(CommandEnvelopeSchema.parse(envelope).protocolVersion).toBe(
      PROTOCOL_VERSION
    );
  });

  it("rejects an unsupported protocol version", () => {
    const envelope = createCommandEnvelope({
      type: "agent.getSnapshot",
      payload: {}
    });

    expect(() =>
      CommandEnvelopeSchema.parse({
        ...envelope,
        protocolVersion: 2
      })
    ).toThrow();
  });

  it("rejects invalid task states in snapshots", () => {
    expect(() =>
      CoreSnapshotSchema.parse({
        protocolVersion: PROTOCOL_VERSION,
        coreInstanceId: "core-test",
        sequenceId: 0,
        health: "ready",
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        voice: {
          state: "idle",
          mode: "disabled"
        },
        messages: [],
        tasks: [
          {
            id: "task-1",
            title: "Invalid task",
            state: "unknown",
            updatedAt: new Date().toISOString()
          }
        ]
      })
    ).toThrow();
  });

  it("keeps phase one voice commands compatible", () => {
    const startPtt = createCommandEnvelope({
      type: "voice.startPtt",
      payload: {}
    });

    expect(CommandEnvelopeSchema.parse(startPtt).protocolVersion).toBe(
      PROTOCOL_VERSION
    );
  });

  it("accepts provider-neutral conversation commands", () => {
    const list = createCommandEnvelope({
      type: "agent.listConversations",
      payload: { limit: 50 }
    });
    const rename = createCommandEnvelope({
      type: "agent.renameConversation",
      payload: {
        conversationId: "primary",
        title: "Planning"
      }
    });
    const sendToActive = createCommandEnvelope({
      type: "agent.sendMessage",
      payload: {
        text: "Use the active conversation"
      }
    });

    expect(CommandEnvelopeSchema.parse(list).command.type).toBe(
      "agent.listConversations"
    );
    expect(CommandEnvelopeSchema.parse(rename).command.type).toBe(
      "agent.renameConversation"
    );
    expect(CommandEnvelopeSchema.parse(sendToActive).command.type).toBe(
      "agent.sendMessage"
    );
  });

  it("accepts provider-neutral memory snapshot commands", () => {
    const exported = createCommandEnvelope({
      type: "agent.exportMemorySnapshot",
      payload: {}
    });
    const imported = createCommandEnvelope({
      type: "agent.importMemorySnapshot",
      payload: {
        snapshot: MemorySnapshotSchema.parse({
          messages: [],
          activeConversationId: "primary"
        })
      }
    });

    expect(CommandEnvelopeSchema.parse(exported).command.type).toBe(
      "agent.exportMemorySnapshot"
    );
    expect(CommandEnvelopeSchema.parse(imported).command.type).toBe(
      "agent.importMemorySnapshot"
    );
    expect(
      CommandEnvelopeSchema.parse(imported).command.payload.snapshot
    ).toMatchObject({
      messages: [],
      conversations: [],
      summaries: [],
      activeConversationId: "primary"
    });
  });

  it("accepts provider-neutral capability commands and snapshots", () => {
    const command = createCommandEnvelope({
      type: "agent.getCapabilities",
      payload: {}
    });
    const snapshot = CapabilitySnapshotSchema.parse({
      checkedAt: "2026-07-31T00:00:00.000Z",
      runtimeMode: "standard",
      device: {
        checkedAt: "2026-07-31T00:00:00.000Z",
        platform: "win32",
        arch: "x64",
        cpuLogicalCores: 16,
        totalMemoryBytes: 16 * 1024 * 1024 * 1024,
        availableMemoryBytes: 8 * 1024 * 1024 * 1024,
        gpus: [],
        accelerationBackends: ["cpu", "directml"],
        recommendedMode: "standard",
        reasons: ["Test capability snapshot."]
      },
      providerPlan: [
        {
          capability: "speech_to_text",
          provider: "local_whisper",
          execution: "local",
          loadPolicy: "on_demand",
          reason: "Test provider selection."
        }
      ]
    });

    expect(CommandEnvelopeSchema.parse(command).command.type).toBe(
      "agent.getCapabilities"
    );
    expect(snapshot.modelInventory).toEqual([]);
  });

  it("accepts provider-neutral model governance commands", () => {
    const manifests = createCommandEnvelope({
      type: "agent.listModelManifests",
      payload: {
        capability: "speech_to_text"
      }
    });
    const inventory = createCommandEnvelope({
      type: "agent.listModelInventory",
      payload: {}
    });

    expect(CommandEnvelopeSchema.parse(manifests).command.type).toBe(
      "agent.listModelManifests"
    );
    expect(CommandEnvelopeSchema.parse(inventory).command.type).toBe(
      "agent.listModelInventory"
    );
  });

  it("validates provider-neutral audio frame metadata", () => {
    expect(
      VoiceAudioFrameMetadataSchema.parse({
        captureId: "capture-1",
        sequenceId: 4,
        capturedAt: new Date().toISOString(),
        sampleRate: 16_000,
        channels: 1,
        encoding: "pcm_s16le",
        byteLength: 4096
      }).byteLength
    ).toBe(4096);
  });

  it("validates binary PCM frames for the dedicated audio transport", () => {
    const pcm = new Uint8Array(640);
    const message = CoreVoiceAudioMessageSchema.parse({
      kind: "voice-audio",
      frame: {
        metadata: {
          captureId: "capture-1",
          sequenceId: 0,
          capturedAt: new Date().toISOString(),
          sampleRate: 16_000,
          channels: 1,
          encoding: "pcm_s16le",
          byteLength: pcm.byteLength
        },
        pcm
      }
    });

    expect(message.frame.pcm).toBe(pcm);
    expect(CoreInboundMessageSchema.parse(message).kind).toBe(
      "voice-audio"
    );
  });

  it("rejects binary audio whose byte length does not match metadata", () => {
    expect(() =>
      VoiceAudioFrameSchema.parse({
        metadata: {
          captureId: "capture-1",
          sequenceId: 0,
          capturedAt: new Date().toISOString(),
          sampleRate: 16_000,
          channels: 1,
          encoding: "pcm_s16le",
          byteLength: 640
        },
        pcm: new Uint8Array(320)
      })
    ).toThrow("byte length");
  });

  it("rejects provider details in diagnostic events", () => {
    expect(() =>
      AppEventSchema.parse({
        type: "voice.diagnostic",
        payload: {
          level: "warning",
          code: "ASR_RECONNECT_WAIT",
          attempt: 1,
          url: "provider-url-must-not-cross-the-contract"
        }
      })
    ).toThrow();
  });

  it("accepts provider-neutral voice barge-in events", () => {
    expect(
      AppEventSchema.parse({
        type: "voice.playback.interrupted",
        payload: {
          playbackId: "playback-1",
          reason: "barge-in"
        }
      })
    ).toEqual({
      type: "voice.playback.interrupted",
      payload: {
        playbackId: "playback-1",
        reason: "barge-in"
      }
    });
  });
});
