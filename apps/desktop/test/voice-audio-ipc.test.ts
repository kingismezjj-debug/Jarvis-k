import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { handleVoiceAudioIpc } from "../src/voice-audio-ipc";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function createFrame() {
  return {
    metadata: {
      captureId: "capture-1",
      sequenceId: 0,
      capturedAt: "2026-07-29T00:00:00.000Z",
      sampleRate: 16_000 as const,
      channels: 1 as const,
      encoding: "pcm_s16le" as const,
      byteLength: 4
    },
    pcm: new Uint8Array(4)
  };
}

describe("voice audio renderer IPC", () => {
  it("forwards a valid frame from the active renderer", () => {
    const enqueue = vi.fn(() => ({ accepted: true as const }));
    const frame = createFrame();

    expect(
      handleVoiceAudioIpc({
        senderId: 4,
        expectedSenderId: 4,
        rawFrame: frame,
        enqueue
      })
    ).toEqual({ accepted: true });
    expect(enqueue).toHaveBeenCalledWith(frame);
  });

  it("rejects frames from any renderer except the active window", () => {
    const enqueue = vi.fn(() => ({ accepted: true as const }));

    expect(
      handleVoiceAudioIpc({
        senderId: 5,
        expectedSenderId: 4,
        rawFrame: createFrame(),
        enqueue
      })
    ).toEqual({ accepted: false, reason: "invalid-sender" });
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("rejects malformed frames before they reach the supervisor", () => {
    const enqueue = vi.fn(() => ({ accepted: true as const }));

    expect(
      handleVoiceAudioIpc({
        senderId: 4,
        expectedSenderId: 4,
        rawFrame: {
          ...createFrame(),
          pcm: new Uint8Array(2)
        },
        enqueue
      })
    ).toEqual({ accepted: false, reason: "invalid-frame" });
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("uses one-way IPC instead of the command request-response channel", () => {
    const preloadSource = fs.readFileSync(
      path.resolve(testDirectory, "..", "src", "preload.ts"),
      "utf8"
    );

    expect(preloadSource).toMatch(
      /ipcRenderer\.send\(\s*IPC_VOICE_AUDIO_CHANNEL/
    );
    expect(preloadSource).not.toMatch(
      /ipcRenderer\.invoke\(\s*IPC_VOICE_AUDIO_CHANNEL/
    );
  });
});
