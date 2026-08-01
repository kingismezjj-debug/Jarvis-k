import type { ScreenCaptureProvider } from "@jarvis-k/capabilities";
import {
  ScreenCaptureRequestSchema,
  ScreenCaptureResultSchema,
  type ScreenCaptureRequest,
  type ScreenCaptureResult
} from "@jarvis-k/contracts";

export const FIXTURE_SCREEN_CAPTURE_PROVIDER_ID = "screen-capture.fixture";

export interface FixtureScreenCaptureProviderOptions {
  now?: () => Date;
}

export interface FixtureScreenCaptureReportOptions {
  enabled: boolean;
}

export interface FixtureScreenCaptureAvailabilityReport {
  provider: typeof FIXTURE_SCREEN_CAPTURE_PROVIDER_ID;
  status: "available" | "unconfigured";
  execution: "fixture" | "disabled";
  reasons: string[];
}

export class FixtureScreenCaptureProvider
  implements ScreenCaptureProvider
{
  private readonly now: () => Date;

  public constructor(options: FixtureScreenCaptureProviderOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  public async capture(
    request: ScreenCaptureRequest
  ): Promise<ScreenCaptureResult> {
    const parsed = ScreenCaptureRequestSchema.parse(request);
    return ScreenCaptureResultSchema.parse({
      captureId: parsed.captureId ?? "fixture-screen-capture",
      image: {
        mimeType: "image/png",
        bytes: new Uint8Array([137, 80, 78, 71]),
        width: parsed.region?.width ?? 1,
        height: parsed.region?.height ?? 1
      },
      capturedAt: this.now().toISOString(),
      source: "fixture"
    });
  }
}

export function createFixtureScreenCaptureAvailabilityReport(
  options: FixtureScreenCaptureReportOptions
): FixtureScreenCaptureAvailabilityReport {
  return {
    provider: FIXTURE_SCREEN_CAPTURE_PROVIDER_ID,
    status: options.enabled ? "available" : "unconfigured",
    execution: options.enabled ? "fixture" : "disabled",
    reasons: options.enabled
      ? []
      : ["Fixture screen capture is disabled by default."]
  };
}
