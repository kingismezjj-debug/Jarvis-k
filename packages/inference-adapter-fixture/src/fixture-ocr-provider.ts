import type { OcrRecognitionProvider } from "@jarvis-k/capabilities";
import {
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  OcrRecognitionRequestSchema,
  OcrRecognitionResultSchema,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor,
  type OcrRecognitionRequest,
  type OcrRecognitionResult
} from "@jarvis-k/contracts";

export const FIXTURE_OCR_PROVIDER_ID = "ocr.fixture";
export const FIXTURE_OCR_MODEL_ID = "jarvis-fixture/local-ocr-smoke";

export interface FixtureOcrProviderOptions {
  modelId?: string;
  now?: () => Date;
}

export interface FixtureOcrReportOptions {
  enabled: boolean;
  modelId?: string;
}

export class FixtureOcrProvider implements OcrRecognitionProvider {
  private readonly modelId: string;
  private readonly now: () => Date;

  public constructor(options: FixtureOcrProviderOptions = {}) {
    this.modelId = options.modelId ?? FIXTURE_OCR_MODEL_ID;
    this.now = options.now ?? (() => new Date());
  }

  public async recognize(
    request: OcrRecognitionRequest
  ): Promise<OcrRecognitionResult> {
    const parsed = OcrRecognitionRequestSchema.parse(request);
    if (parsed.modelId !== this.modelId) {
      throw new Error("Fixture OCR provider is not bound to this model.");
    }

    const text = "fixture ocr text";
    return OcrRecognitionResultSchema.parse({
      modelId: parsed.modelId,
      ...(parsed.image.id ? { imageId: parsed.image.id } : {}),
      text,
      blocks: [
        {
          text,
          confidence: 0.99,
          boundingBox: {
            x: 0.1,
            y: 0.1,
            width: 0.8,
            height: 0.2
          }
        }
      ],
      recognizedAt: this.now().toISOString()
    });
  }
}

export function createFixtureOcrDescriptor(
  options: FixtureOcrReportOptions
): InferenceProviderDescriptor {
  const modelId = options.modelId ?? FIXTURE_OCR_MODEL_ID;
  return InferenceProviderDescriptorSchema.parse({
    capability: "ocr",
    provider: FIXTURE_OCR_PROVIDER_ID,
    status: options.enabled ? "available" : "unconfigured",
    execution: options.enabled ? "local" : "disabled",
    modelIds: options.enabled ? [modelId] : [],
    reasons: options.enabled
      ? []
      : ["Fixture inference is disabled by default."]
  });
}

export function createFixtureOcrConfigurationReport(
  options: FixtureOcrReportOptions
): InferenceProviderConfigurationReport {
  return InferenceProviderConfigurationReportSchema.parse({
    capability: "ocr",
    provider: FIXTURE_OCR_PROVIDER_ID,
    status: options.enabled ? "available" : "unconfigured",
    requirements: [
      {
        key: "JARVIS_K_ENABLE_FIXTURE_INFERENCE",
        source: "environment",
        required: true,
        configured: options.enabled,
        description: "Explicitly enables deterministic fixture inference.",
        reasons: options.enabled
          ? []
          : ["Set JARVIS_K_ENABLE_FIXTURE_INFERENCE=1 for tests only."]
      }
    ],
    reasons: options.enabled
      ? []
      : ["Fixture inference remains disabled until explicitly enabled."]
  });
}
