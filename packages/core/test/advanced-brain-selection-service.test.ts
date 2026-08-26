import { describe, expect, it } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  type AdvancedBrainProviderCapabilityProfile,
} from "@jarvis-k/contracts";
import {
  createDeepSeekAdvancedReasoningProfile,
  createDeepSeekCloudReasoningModelCapabilityProfile,
} from "@jarvis-k/inference-adapter-deepseek-runtime";
import { AdvancedBrainSelectionService } from "../src/advanced-brain";

describe("AdvancedBrainSelectionService", () => {
  it("does not select cloud providers for local-only requests", () => {
    const result = select({
      privacyRequirement: "local_only",
      cloudEgressPolicy: "local_only",
      providers: [profile({ providerId: "advanced-brain.cloud", privacyClass: "cloud" })],
    });

    expect(result.status).toBe("unavailable");
    expect(result.cloudEgressDecision).toBe("blocked");
    expect(result.selectedProviderId).toBeUndefined();
  });

  it("requires cloud confirmation evidence when policy demands it", () => {
    const result = select({
      privacyRequirement: "cloud_requires_confirmation",
      cloudEgressPolicy: "require_confirmation",
      providers: [profile({ providerId: "advanced-brain.cloud", privacyClass: "cloud" })],
    });

    expect(result.status).toBe("confirmation_required");
    expect(result.reasonCode).toBe("CLOUD_CONFIRMATION_REQUIRED");
  });

  it("skips unhealthy providers and fails closed", () => {
    const result = select({
      providers: [
        profile({
          providerId: "advanced-brain.unhealthy",
          healthStatus: "unhealthy",
        }),
      ],
    });

    expect(result.status).toBe("unavailable");
    expect(result.reasonCode).toBe("PROVIDER_UNHEALTHY");
  });

  it("rejects capability mismatches", () => {
    const result = select({
      requestedOutput: "structured_plan",
      requiredCapabilities: ["structured_output"],
      providers: [
        profile({
          providerId: "advanced-brain.text-only",
          supportsStructuredOutput: false,
        }),
      ],
    });

    expect(result.status).toBe("unavailable");
    expect(result.reasonCode).toBe("CAPABILITY_MISMATCH");
  });

  it("applies mainland, quality, cost, and deterministic custom ordering", () => {
    expect(
      select({
        strategy: "mainland_first",
        providers: [
          profile({ providerId: "advanced-brain.global", regionAvailability: ["global"] }),
          profile({
            providerId: "advanced-brain.mainland",
            regionAvailability: ["mainland_china"],
          }),
        ],
      }).selectedProviderId,
    ).toBe("advanced-brain.mainland");

    expect(
      select({
        strategy: "quality_first",
        providers: [
          profile({ providerId: "advanced-brain.short", maxContextClass: "short" }),
          profile({ providerId: "advanced-brain.long", maxContextClass: "very_long" }),
        ],
      }).selectedProviderId,
    ).toBe("advanced-brain.long");

    expect(
      select({
        strategy: "cost_first",
        providers: [
          profile({ providerId: "advanced-brain.high", costClass: "high" }),
          profile({ providerId: "advanced-brain.low", costClass: "low" }),
        ],
      }).selectedProviderId,
    ).toBe("advanced-brain.low");

    expect(
      select({
        strategy: "custom",
        providers: [
          profile({ providerId: "advanced-brain.zed" }),
          profile({ providerId: "advanced-brain.alpha" }),
        ],
      }).selectedProviderId,
    ).toBe("advanced-brain.alpha");
  });

  it("does not select fixture providers unless explicitly allowed", () => {
    const blocked = select({
      providers: [
        profile({
          providerId: "advanced-brain.fixture",
          privacyClass: "fixture",
        }),
      ],
    });
    const allowed = select({
      allowFixtureProviders: true,
      providers: [
        profile({
          providerId: "advanced-brain.fixture",
          privacyClass: "fixture",
        }),
      ],
    });

    expect(blocked.status).toBe("unavailable");
    expect(allowed.status).toBe("selected");
    expect(allowed.selectedProviderId).toBe("advanced-brain.fixture");
    expect(allowed.automaticFallbackAllowed).toBe(false);
    expect(allowed.directExecutionAllowed).toBe(false);
  });

  it("can rank explicitly enabled DeepSeek profiles in deterministic fake selection", () => {
    const flash = createDeepSeekAdvancedReasoningProfile({
      enabled: true,
      modelId: "deepseek-v4-flash",
      healthStatus: "healthy",
    });
    const pro = createDeepSeekAdvancedReasoningProfile({
      enabled: true,
      modelId: "deepseek-v4-pro",
      healthStatus: "healthy",
    });

    expect(
      select({
        strategy: "mainland_first",
        providers: [profile({ providerId: "advanced-brain.global", regionAvailability: ["global"] }), flash],
      }).selectedProviderId,
    ).toBe("advanced-brain.deepseek");
    expect(
      select({
        strategy: "quality_first",
        providers: [flash, pro],
      }).selectedModelId,
    ).toBe("deepseek-v4-pro");
    expect(
      select({
        strategy: "cost_first",
        providers: [pro, flash],
      }).selectedModelId,
    ).toBe("deepseek-v4-flash");
  });

  it("does not auto-fallback from GLM to DeepSeek without explicit enabled provider selection", () => {
    const glmDegraded = profile({
      providerId: "advanced-brain.glm",
      modelId: "glm-5.3",
      privacyClass: "cloud",
      regionAvailability: ["mainland_china"],
      healthStatus: "unhealthy",
    });
    const deepSeekDefaultOff = createDeepSeekAdvancedReasoningProfile({
      enabled: false,
      modelId: "deepseek-v4-pro",
      healthStatus: "healthy",
    });

    const result = select({
      strategy: "quality_first",
      providers: [glmDegraded, deepSeekDefaultOff],
    });

    expect(result.status).toBe("unavailable");
    expect(result.selectedProviderId).toBeUndefined();
    expect(result.automaticFallbackAllowed).toBe(false);
  });

  it("keeps DeepSeek cloud runtime model profiles default disabled", () => {
    const flash = createDeepSeekCloudReasoningModelCapabilityProfile({
      enabled: false,
      modelId: "deepseek-v4-flash",
    });

    expect(flash.enabled).toBe(false);
    expect(flash.dataEgressClass).toBe("cloud_user_content");
    expect(flash.supportsVision).toBe(false);
  });
});

function select(
  overrides: Partial<Parameters<AdvancedBrainSelectionService["select"]>[0]> = {},
) {
  return new AdvancedBrainSelectionService().select({
    category: "advanced_chat",
    inputModalities: ["text"],
    requestedOutput: "answer",
    requiredCapabilities: ["text_reasoning"],
    privacyRequirement: "cloud_allowed",
    cloudEgressPolicy: "allow_cloud",
    strategy: "local_first",
    providers: [profile()],
    ...overrides,
  });
}

function profile(
  overrides: Partial<AdvancedBrainProviderCapabilityProfile> = {},
): AdvancedBrainProviderCapabilityProfile {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: "advanced-brain.local",
    modelId: `${overrides.providerId ?? "local"}-model`,
    inputModalities: ["text"],
    outputModalities: ["text"],
    supportsStructuredOutput: true,
    supportsFunctionCalling: false,
    supportsReasoning: true,
    supportsStreaming: false,
    supportsCancellation: true,
    maxContextClass: "medium",
    latencyClass: "interactive",
    costClass: "free",
    regionAvailability: ["local"],
    privacyClass: "local",
    taskCategories: ["advanced_chat", "multi_step_plan"],
    enabled: true,
    healthStatus: "healthy",
    ...overrides,
  };
}
