import type {
  BrainRouterDecision,
  BrainRouterSelectionReport,
} from "@jarvis-k/contracts";

export interface CommandRoutingOutcome {
  decision: BrainRouterDecision;
  selection: BrainRouterSelectionReport;
}

export interface CommandRouterProductModeState {
  enabled: boolean;
  providerId?: string;
  mode?: "production_rules" | "fixture_only";
  fixtureExecutionEnabled?: boolean;
}

export interface CommandRoutingServiceOptions {
  readonly productModeProviderId: string;
  readonly fixtureProviderId: string;
  readonly rulesFallbackProviderId: string;
  readonly getProductMode: () => CommandRouterProductModeState | undefined;
  readonly isFixtureReplayEnabled: () => boolean;
  readonly routeUserRouteAliasByRules: (
    text: string,
  ) => Promise<CommandRoutingOutcome | undefined>;
  readonly routeVoiceCommandAliasByRules: (
    text: string,
  ) => Promise<CommandRoutingOutcome | undefined>;
  readonly routeWithProvider: (input: {
    text: string;
    conversationId?: string;
    correlationId?: string;
  }) => Promise<
    | {
        decision?: BrainRouterDecision;
        selection: BrainRouterSelectionReport;
      }
    | undefined
  >;
  readonly routeByRules: (text: string) => BrainRouterDecision;
  readonly routeForProductMode: (text: string) => BrainRouterDecision;
  readonly applyProductModeSafety: (
    decision: BrainRouterDecision,
  ) => BrainRouterDecision;
  readonly createRouterSelection: (input: {
    selectedProviderId: string;
    fallbackProviderId?: string;
    status: BrainRouterSelectionReport["status"];
    reasonCode: BrainRouterSelectionReport["reasonCode"];
    failureClass: BrainRouterSelectionReport["failureClass"];
    confidenceBand: BrainRouterSelectionReport["confidenceBand"];
    usedRulesFallback: boolean;
  }) => BrainRouterSelectionReport;
  readonly brainRouterProviderId: () => string;
  readonly confidenceBand: (
    confidence: number | undefined,
  ) => BrainRouterSelectionReport["confidenceBand"];
}

export interface CommandRoutingInput {
  text: string;
  conversationId?: string;
  correlationId?: string;
}

export class CommandRoutingService {
  private readonly options: CommandRoutingServiceOptions;

  public constructor(options: CommandRoutingServiceOptions) {
    this.options = options;
  }

  public async route(input: CommandRoutingInput): Promise<CommandRoutingOutcome> {
    const userRouteAliasOutcome =
      await this.options.routeUserRouteAliasByRules(input.text);
    if (userRouteAliasOutcome) {
      return userRouteAliasOutcome;
    }
    const voiceCommandAliasOutcome =
      await this.options.routeVoiceCommandAliasByRules(input.text);
    if (voiceCommandAliasOutcome) {
      return voiceCommandAliasOutcome;
    }

    const productMode = this.options.getProductMode();
    if (productMode?.enabled === true) {
      return this.routeProductMode(input, productMode);
    }

    const providerOutcome = await this.options.routeWithProvider(input);
    if (providerOutcome?.decision !== undefined) {
      return {
        decision: providerOutcome.decision,
        selection: providerOutcome.selection,
      };
    }
    return {
      decision: this.options.routeByRules(input.text),
      selection:
        providerOutcome?.selection ??
        this.options.createRouterSelection({
          selectedProviderId: this.options.brainRouterProviderId(),
          fallbackProviderId: this.options.rulesFallbackProviderId,
          status: "unavailable",
          reasonCode: "PROVIDER_UNAVAILABLE",
          failureClass: "PROVIDER_UNAVAILABLE",
          confidenceBand: "none",
          usedRulesFallback: true,
        }),
    };
  }

  private async routeProductMode(
    input: CommandRoutingInput,
    productMode: CommandRouterProductModeState,
  ): Promise<CommandRoutingOutcome> {
    const commandRouterProviderId = productMode.providerId;
    const fixtureReplayEnabled = this.options.isFixtureReplayEnabled();
    if (
      !fixtureReplayEnabled &&
      commandRouterProviderId !== undefined &&
      commandRouterProviderId !== this.options.productModeProviderId
    ) {
      const providerOutcome = await this.options.routeWithProvider(input);
      if (providerOutcome?.decision !== undefined) {
        return {
          decision: this.options.applyProductModeSafety(
            providerOutcome.decision,
          ),
          selection: providerOutcome.selection,
        };
      }
      return {
        decision: this.options.routeForProductMode(input.text),
        selection:
          providerOutcome?.selection ??
          this.options.createRouterSelection({
            selectedProviderId: commandRouterProviderId,
            fallbackProviderId: this.options.productModeProviderId,
            status: "fallback",
            reasonCode: "PROVIDER_UNAVAILABLE",
            failureClass: "PROVIDER_UNAVAILABLE",
            confidenceBand: "none",
            usedRulesFallback: true,
          }),
      };
    }

    const decision = this.options.routeForProductMode(input.text);
    return {
      decision,
      selection: this.options.createRouterSelection({
        selectedProviderId: fixtureReplayEnabled
          ? this.options.fixtureProviderId
          : (productMode.providerId ?? this.options.productModeProviderId),
        status: decision.intent === "blocked" ? "blocked" : "accepted",
        reasonCode:
          decision.intent === "blocked"
            ? "UNSAFE_OR_BLOCKED"
            : "PROVIDER_ACCEPTED",
        failureClass:
          decision.intent === "blocked" ? "UNSAFE_OR_BLOCKED" : "none",
        confidenceBand: this.options.confidenceBand(decision.confidence),
        usedRulesFallback: true,
      }),
    };
  }
}
