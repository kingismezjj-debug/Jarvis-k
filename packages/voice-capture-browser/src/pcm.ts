export const VOICE_TARGET_SAMPLE_RATE = 16_000;

export function convertFloat32ToPcm16(
  samples: Float32Array,
  sourceSampleRate: number,
  targetSampleRate = VOICE_TARGET_SAMPLE_RATE
): Int16Array {
  if (
    !Number.isFinite(sourceSampleRate) ||
    !Number.isFinite(targetSampleRate) ||
    sourceSampleRate <= 0 ||
    targetSampleRate <= 0
  ) {
    throw new RangeError("Audio sample rates must be positive numbers.");
  }

  if (samples.length === 0) {
    return new Int16Array();
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const outputLength = Math.max(1, Math.floor(samples.length / ratio));
  const output = new Int16Array(outputLength);

  for (let outputIndex = 0; outputIndex < outputLength; outputIndex += 1) {
    const start = Math.min(
      samples.length - 1,
      Math.floor(outputIndex * ratio)
    );
    const end = Math.min(
      samples.length,
      Math.max(start + 1, Math.floor((outputIndex + 1) * ratio))
    );
    let sum = 0;
    for (let inputIndex = start; inputIndex < end; inputIndex += 1) {
      sum += samples[inputIndex] ?? 0;
    }

    const average = sum / (end - start);
    const clamped = Math.max(-1, Math.min(1, average));
    output[outputIndex] = Math.round(
      clamped * (clamped < 0 ? 0x8000 : 0x7fff)
    );
  }

  return output;
}
