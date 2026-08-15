import {
  OPENAI_HEAVY_PLANNER_PROVIDER_ID,
} from "@jarvis-k/inference-adapter-openai-planner";
import {
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
} from "@jarvis-k/inference-adapter-glm-runtime";
import type {
  ConfigurableHeavyPlannerProvider,
  CoreHostActiveHeavyPlanner,
} from "../composition/planner-composition";
import { createCoreHostOpenAiHeavyPlannerComposition } from "../openai-heavy-planner-composition";
import { createCoreHostGlmRuntimeHeavyPlannerComposition } from "../glm-heavy-planner-runtime-composition";
import type { CoreHostHeavyPlannerProviderConfiguration } from "../host/host-message-schema";

export interface PlannerRuntimeBindingInput {
  readonly activeHeavyPlanner: CoreHostActiveHeavyPlanner | undefined;
  readonly configurableHeavyPlannerProvider:
    | ConfigurableHeavyPlannerProvider
    | undefined;
}

export class PlannerRuntimeBinding {
  public constructor(private readonly input: PlannerRuntimeBindingInput) {}

  public applyProviderConfiguration(
    configuration: CoreHostHeavyPlannerProviderConfiguration,
  ): void {
    if (
      !this.input.activeHeavyPlanner ||
      this.input.activeHeavyPlanner.provider !== configuration.provider
    ) {
      this.input.configurableHeavyPlannerProvider?.configure(undefined);
      return;
    }

    if (configuration.provider === "openai") {
      const composition = createCoreHostOpenAiHeavyPlannerComposition({
        enabled: true,
        providerId: OPENAI_HEAVY_PLANNER_PROVIDER_ID,
        secureCredentialStoreAvailable: true,
        credential: configuration.credentials,
        credentialExposed: false,
        networkWindowApproved:
          this.input.activeHeavyPlanner.networkWindowApproved,
        contractReady: true,
        parserReady: true,
        timeoutAndOutputBoundsReady: true,
        defaultOffPreserved: true,
        qwenRulesFallbackPreserved: true,
        executorOnlySideEffectsPreserved: true,
      });
      this.input.configurableHeavyPlannerProvider?.configure(
        composition.provider,
      );
      return;
    }

    const composition = createCoreHostGlmRuntimeHeavyPlannerComposition({
      enabled: true,
      providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
      modelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
      fixedProfileApproved: true,
      secureCredentialStoreAvailable: true,
      credential: configuration.credentials,
      credentialExposed: false,
      networkWindowApproved:
        this.input.activeHeavyPlanner.networkWindowApproved,
      contractReady: true,
      parserReady: true,
      timeoutAndOutputBoundsReady: true,
      defaultOffPreserved: true,
      qwenRulesFallbackPreserved: true,
      executorOnlySideEffectsPreserved: true,
    });
    this.input.configurableHeavyPlannerProvider?.configure(composition.provider);
  }

  public dispose(): void {
    this.input.configurableHeavyPlannerProvider?.configure(undefined);
  }
}
