import { BrainPlannerResultSchema } from "@jarvis-k/contracts";
import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import type { CoreBrainPlannerOptions } from "@jarvis-k/core";
import {
  OPENAI_HEAVY_PLANNER_PROVIDER_ID,
} from "@jarvis-k/inference-adapter-openai-planner";
import {
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
} from "@jarvis-k/inference-adapter-glm-runtime";
import type { RuntimeConfig } from "../config/runtime-config";

export type CoreHostActiveHeavyPlanner =
  | {
      provider: "openai";
      providerId: typeof OPENAI_HEAVY_PLANNER_PROVIDER_ID;
      networkWindowApproved: boolean;
    }
  | {
      provider: "glm";
      providerId: typeof GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID;
      networkWindowApproved: boolean;
    };

export interface CoreHostPlannerComposition {
  readonly activeHeavyPlanner: CoreHostActiveHeavyPlanner | undefined;
  readonly configurableHeavyPlannerProvider:
    | ConfigurableHeavyPlannerProvider
    | undefined;
  readonly brainPlannerOptions: CoreBrainPlannerOptions;
}

export function createCoreHostPlannerComposition(
  runtimeConfig: RuntimeConfig,
): CoreHostPlannerComposition {
  const activeHeavyPlanner = selectActiveHeavyPlanner(runtimeConfig);
  return {
    activeHeavyPlanner,
    configurableHeavyPlannerProvider: activeHeavyPlanner
      ? new ConfigurableHeavyPlannerProvider(activeHeavyPlanner.providerId)
      : undefined,
    brainPlannerOptions: activeHeavyPlanner
      ? {
          enabled: true,
          providerId: activeHeavyPlanner.providerId,
        }
      : {
          enabled: true,
          providerId: "planner.deterministic.rules",
          escalateIntents: [],
        },
  };
}

export class ConfigurableHeavyPlannerProvider implements HeavyPlannerProvider {
  private current: HeavyPlannerProvider | undefined;

  public constructor(private readonly providerId: string) {}

  public configure(provider: HeavyPlannerProvider | undefined): void {
    this.current = provider;
  }

  public toJSON(): {
    readonly providerId: string;
    readonly configured: boolean;
    readonly credentialExposed: false;
  } {
    return {
      providerId: this.providerId,
      configured: this.current !== undefined,
      credentialExposed: false,
    };
  }

  public async plan(
    request: Parameters<HeavyPlannerProvider["plan"]>[0],
  ): ReturnType<HeavyPlannerProvider["plan"]> {
    if (!this.current) {
      return BrainPlannerResultSchema.parse({
        providerId: this.providerId,
        status: "unavailable",
        reasonCode: "PROVIDER_UNAVAILABLE",
        failureClass: "PROVIDER_UNAVAILABLE",
        directActionAttempted: false,
        plannedAt: new Date().toISOString(),
      });
    }
    return this.current.plan(request);
  }
}

function selectActiveHeavyPlanner(
  runtimeConfig: RuntimeConfig,
): CoreHostActiveHeavyPlanner | undefined {
  if (
    runtimeConfig.openAiHeavyPlannerEnabled ===
    runtimeConfig.glmRuntimeHeavyPlannerEnabled
  ) {
    return undefined;
  }
  return runtimeConfig.openAiHeavyPlannerEnabled
    ? {
        provider: "openai",
        providerId: OPENAI_HEAVY_PLANNER_PROVIDER_ID,
        networkWindowApproved:
          runtimeConfig.openAiHeavyPlannerOneWindowApproved,
      }
    : {
        provider: "glm",
        providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
        networkWindowApproved:
          runtimeConfig.glmRuntimeHeavyPlannerOneWindowApproved,
      };
}
