import type {
  OcrRecognitionRequest,
  OcrRecognitionResult
} from "@jarvis-k/contracts";
import type { OcrRecognitionProvider } from "./ports";

export class UnavailableOcrProvider implements OcrRecognitionProvider {
  public async recognize(
    _request: OcrRecognitionRequest
  ): Promise<OcrRecognitionResult> {
    throw new Error(ocrProviderUnavailableReason());
  }
}

export function ocrProviderUnavailableReason(): string {
  return "OCR provider is not configured.";
}
