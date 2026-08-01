import type { VisionAnalysisProvider } from "@jarvis-k/capabilities";
import {
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  VisionAnalysisRequestSchema,
  VisionAnalysisResultSchema,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor,
  type VisionAnalysisRequest,
  type VisionAnalysisResult
} from "@jarvis-k/contracts";

export const FIXTURE_VISION_PROVIDER_ID = "vision.fixture";
export const FIXTURE_VISION_MODEL_ID = "jarvis-fixture/local-vision-smoke";

export interface FixtureVisionProviderOptions {
  modelId?: string;
  now?: () => Date;
}

export interface FixtureVisionReportOptions {
  enabled: boolean;
  modelId?: string;
}

export class FixtureVisionProvider implements VisionAnalysisProvider {
  private readonly modelId: string;
  private readonly now: () => Date;

  public constructor(options: FixtureVisionProviderOptions = {}) {
    this.modelId = options.modelId ?? FIXTURE_VISION_MODEL_ID;
    this.now = options.now ?? (() => new Date());
  }

  public async analyze(
    request: VisionAnalysisRequest
  ): Promise<VisionAnalysisResult> {
    const parsed = VisionAnalysisRequestSchema.parse(request);
    if (parsed.modelId !== this.modelId) {
      throw new Error("Fixture vision provider is not bound to this model.");
    }

    return VisionAnalysisResultSchema.parse({
      modelId: parsed.modelId,
      ...(parsed.image.id ? { imageId: parsed.image.id } : {}),
      summary: "fixture vision result",
      labels: [
        {
          label: "fixture-object",
          confidence: 0.99,
          boundingBox: {
            x: 0.1,
            y: 0.1,
            width: 0.8,
            height: 0.8
          }
        }
      ],
      analyzedAt: this.now().toISOString()
    });
  }
}

export function createFixtureVisionDescriptor(
  options: FixtureVisionReportOptions
): InferenceProviderDescriptor {
  const modelId = options.modelId ?? FIXTURE_VISION_MODEL_ID;
  return InferenceProviderDescriptorSchema.parse({
    capability: "vision",
    provider: FIXTURE_VISION_PROVIDER_ID,
    status: options.enabled ? "available" : "unconfigured",
    execution: options.enabled ? "local" : "disabled",
    modelIds: options.enabled ? [modelId] : [],
    reasons: options.enabled
      ? []
      : ["Fixture vision is disabled by default."]
  });
}

export function createFixtureVisionConfigurationReport(
  options: FixtureVisionReportOptions
): InferenceProviderConfigurationReport {
  return InferenceProviderConfigurationReportSchema.parse({
    capability: "vision",
    provider: FIXTURE_VISION_PROVIDER_ID,
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
      : ["Fixture vision remains disabled until explicitly enabled."]
  });
}
