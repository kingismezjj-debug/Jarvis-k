import { describe, expect, it } from "vitest";
import {
  ocrProviderUnavailableReason,
  UnavailableOcrProvider
} from "../src";

describe("UnavailableOcrProvider", () => {
  it("fails closed until an OCR provider is composed", async () => {
    const provider = new UnavailableOcrProvider();

    await expect(
      provider.recognize({
        modelId: "jarvis-fixture/local-ocr-smoke",
        image: {
          id: "image-1",
          mimeType: "image/png",
          bytes: new Uint8Array([137, 80, 78, 71])
        },
        languages: ["zh", "en"]
      })
    ).rejects.toThrow("OCR provider is not configured.");
  });

  it("formats unavailable reasons without runtime details", () => {
    expect(ocrProviderUnavailableReason()).toBe(
      "OCR provider is not configured."
    );
  });
});
