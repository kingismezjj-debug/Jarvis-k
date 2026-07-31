import {
  type VoiceAudioFrame,
  VoiceAudioFrameSchema
} from "@jarvis-k/contracts";
import type { VoiceAudioEnqueueResult } from "./audio-transport";

export type VoiceAudioIpcResult =
  | VoiceAudioEnqueueResult
  | { accepted: false; reason: "invalid-sender" };

export interface VoiceAudioIpcInput {
  senderId: number;
  expectedSenderId: number;
  rawFrame: unknown;
  enqueue(frame: VoiceAudioFrame): VoiceAudioEnqueueResult;
}

export function handleVoiceAudioIpc(
  input: VoiceAudioIpcInput
): VoiceAudioIpcResult {
  if (input.senderId !== input.expectedSenderId) {
    return { accepted: false, reason: "invalid-sender" };
  }

  const parsed = VoiceAudioFrameSchema.safeParse(input.rawFrame);
  if (!parsed.success) {
    return { accepted: false, reason: "invalid-frame" };
  }

  return input.enqueue(parsed.data);
}
