import { describe, expect, it } from "vitest";
import {
  createFixtureScreenCaptureAvailabilityReport,
  FixtureScreenCaptureProvider,
  createFixtureVisionConfigurationReport,
  createFixtureVisionDescriptor,
  FIXTURE_VISION_MODEL_ID,
  FIXTURE_VISION_PROVIDER_ID,
  FixtureVisionProvider
} from "../src";

describe("fixture visual providers", () => {
  it("keeps screen capture fixture availability explicit", () => {
    expect(
      createFixtureScreenCaptureAvailabilityReport({ enabled: false })
    ).toMatchObject({
      provider: "screen-capture.fixture",
      status: "unconfigured",
      execution: "disabled"
    });
    expect(
      createFixtureScreenCaptureAvailabilityReport({ enabled: true })
    ).toMatchObject({
      provider: "screen-capture.fixture",
      status: "available",
      execution: "fixture",
      reasons: []
    });
  });

  it("captures deterministic fixture image metadata without OS access", async () => {
    const provider = new FixtureScreenCaptureProvider({
      now: () => new Date("2026-08-01T00:00:00.000Z")
    });

    await expect(
      provider.capture({
        captureId: "fixture-capture",
        displayId: "fixture-display",
        region: {
          x: 10,
          y: 20,
          width: 640,
          height: 480
        }
      })
    ).resolves.toMatchObject({
      captureId: "fixture-capture",
      image: {
        mimeType: "image/png",
        width: 640,
        height: 480
      },
      capturedAt: "2026-08-01T00:00:00.000Z",
      source: "fixture"
    });
  });

  it("reports vision fixture availability and returns bounded analysis", async () => {
    expect(createFixtureVisionDescriptor({ enabled: false })).toMatchObject({
      capability: "vision",
      provider: FIXTURE_VISION_PROVIDER_ID,
      status: "unconfigured",
      execution: "disabled",
      modelIds: []
    });
    expect(
      createFixtureVisionConfigurationReport({ enabled: true })
    ).toMatchObject({
      capability: "vision",
      status: "available",
      requirements: [
        {
          key: "JARVIS_K_ENABLE_FIXTURE_INFERENCE",
          configured: true
        }
      ]
    });

    const provider = new FixtureVisionProvider({
      now: () => new Date("2026-08-01T00:00:00.000Z")
    });
    await expect(
      provider.analyze({
        modelId: FIXTURE_VISION_MODEL_ID,
        image: {
          id: "fixture-image",
          mimeType: "image/png",
          bytes: new Uint8Array([137, 80, 78, 71]),
          width: 1,
          height: 1
        },
        tasks: ["describe", "classify"]
      })
    ).resolves.toMatchObject({
      modelId: FIXTURE_VISION_MODEL_ID,
      imageId: "fixture-image",
      summary: "fixture vision result",
      labels: [
        {
          label: "fixture-object",
          confidence: 0.99
        }
      ],
      analyzedAt: "2026-08-01T00:00:00.000Z"
    });
  });

  it("fails closed when vision is asked to serve an unbound model", async () => {
    const provider = new FixtureVisionProvider();

    await expect(
      provider.analyze({
        modelId: "vendor/other-model",
        image: {
          mimeType: "image/png",
          bytes: new Uint8Array([137, 80, 78, 71])
        },
        tasks: ["describe"]
      })
    ).rejects.toThrow("Fixture vision provider is not bound to this model.");
  });
});
