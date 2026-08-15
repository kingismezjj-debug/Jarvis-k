import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import {
  BrainPlannerRequestSchema,
  BrainPlannerResult,
  BrainPlannerResultSchema,
  BrainPlannerSelectionReport,
  BrainPlannerSelectionReportSchema,
} from "@jarvis-k/contracts";
import type { DeterministicPlannerRoutingInput } from "./deterministic-planner-service";

export interface ProviderPlannerServiceOptions {
  provider: HeavyPlannerProvider | undefined;
  now: () => Date;
  allowedToolIds: readonly string[];
  rulesFallbackProviderId: string;
}

export interface ProviderPlannerRequest {
  providerId: string;
  source: "text" | "voice";
  text: string;
  routing: DeterministicPlannerRoutingInput & {
    decision: unknown;
    selection: unknown;
  };
  conversationId: string | undefined;
}

export interface ProviderPlannerOutcome {
  selection: BrainPlannerSelectionReport;
  result?: BrainPlannerResult;
}

export class ProviderPlannerService {
  public constructor(private readonly options: ProviderPlannerServiceOptions) {}

  public async plan(input: ProviderPlannerRequest): Promise<ProviderPlannerOutcome> {
    if (!this.options.provider) {
      return {
        selection: this.createSelection({
          providerId: input.providerId,
          fallbackProviderId: this.options.rulesFallbackProviderId,
          status: "unavailable",
          reasonCode: "PROVIDER_UNAVAILABLE",
          failureClass: "PROVIDER_UNAVAILABLE",
          usedPlanner: false,
          usedRulesFallback: true,
        }),
      };
    }

    try {
      const request = BrainPlannerRequestSchema.parse({
        providerId: input.providerId,
        utterance: input.text,
        source: input.source,
        routedAt: this.options.now().toISOString(),
        routerDecision: input.routing.decision,
        routerSelection: input.routing.selection,
        context: {
          ...(input.conversationId
            ? {
                activeConversationId: input.conversationId,
              }
            : {}),
          allowedToolIds: [...this.options.allowedToolIds],
        },
      });
      const rawResult = await this.options.provider.plan(request);
      const parsedResult = BrainPlannerResultSchema.safeParse(rawResult);
      if (!parsedResult.success) {
        return this.invalidPlan(input.providerId);
      }
      const result = parsedResult.data;
      if (result.providerId !== input.providerId) {
        return this.invalidPlan(input.providerId);
      }
      if (result.status === "planned") {
        return {
          result,
          selection: this.createSelection({
            providerId: input.providerId,
            status: "planned",
            reasonCode: result.reasonCode,
            failureClass: result.failureClass,
            usedPlanner: true,
            usedRulesFallback: false,
          }),
        };
      }
      if (result.status === "clarify") {
        return {
          result,
          selection: this.createSelection({
            providerId: input.providerId,
            status: "clarify",
            reasonCode: result.reasonCode,
            failureClass: result.failureClass,
            usedPlanner: true,
            usedRulesFallback: false,
          }),
        };
      }
      if (result.status === "blocked") {
        return {
          result,
          selection: this.createSelection({
            providerId: input.providerId,
            status: "blocked",
            reasonCode:
              result.reasonCode === "UNSAFE_PLAN"
                ? "UNSAFE_PLAN"
                : result.reasonCode,
            failureClass:
              result.failureClass === "none"
                ? "UNSAFE_PLAN"
                : result.failureClass,
            usedPlanner: true,
            usedRulesFallback: false,
          }),
        };
      }
      return {
        result,
        selection: this.createSelection({
          providerId: input.providerId,
          fallbackProviderId: this.options.rulesFallbackProviderId,
          status: "unavailable",
          reasonCode: "PROVIDER_UNAVAILABLE",
          failureClass: "PROVIDER_UNAVAILABLE",
          usedPlanner: false,
          usedRulesFallback: true,
        }),
      };
    } catch {
      return {
        selection: this.createSelection({
          providerId: input.providerId,
          fallbackProviderId: this.options.rulesFallbackProviderId,
          status: "fallback",
          reasonCode: "PROVIDER_FAILED",
          failureClass: "PROVIDER_EXECUTION_FAILED",
          usedPlanner: false,
          usedRulesFallback: true,
        }),
      };
    }
  }

  private invalidPlan(providerId: string): ProviderPlannerOutcome {
    return {
      selection: this.createSelection({
        providerId,
        fallbackProviderId: this.options.rulesFallbackProviderId,
        status: "fallback",
        reasonCode: "INVALID_PLAN",
        failureClass: "PROVIDER_RESULT_INVALID",
        usedPlanner: false,
        usedRulesFallback: true,
      }),
    };
  }

  private createSelection(input: {
    providerId: string;
    fallbackProviderId?: string;
    status: BrainPlannerSelectionReport["status"];
    reasonCode: BrainPlannerSelectionReport["reasonCode"];
    failureClass: BrainPlannerSelectionReport["failureClass"];
    usedPlanner: boolean;
    usedRulesFallback: boolean;
  }): BrainPlannerSelectionReport {
    return BrainPlannerSelectionReportSchema.parse({
      ...input,
      directActionAttempted: false,
    });
  }
}
