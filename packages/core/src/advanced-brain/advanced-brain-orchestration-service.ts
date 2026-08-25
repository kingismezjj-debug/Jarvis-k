import type { AdvancedReasoningProvider } from "@jarvis-k/capabilities";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  AdvancedBrainDiagnosticsSchema,
  AdvancedBrainProviderResultSchema,
  AdvancedBrainRequestSchema,
  type AdvancedBrainDiagnostics,
  type AdvancedBrainProviderResult,
  type AdvancedBrainRequest,
  type AdvancedBrainSelectionResult,
  type AdvancedBrainSelectionStrategy,
} from "@jarvis-k/contracts";
import {
  AdvancedBrainSelectionService,
  type AdvancedBrainSelectionInput,
} from "./advanced-brain-selection-service";

export interface AdvancedBrainOrchestrationOptions {
  selectionService?: AdvancedBrainSelectionService;
  providers: readonly AdvancedReasoningProvider[];
  strategy: AdvancedBrainSelectionStrategy;
  allowFixtureProviders?: boolean;
  now?: () => Date;
}

export interface AdvancedBrainOrchestrationOutcome {
  selection: AdvancedBrainSelectionResult;
  result?: AdvancedBrainProviderResult;
  diagnostics: AdvancedBrainDiagnostics;
  plannerApprovalRequired: boolean;
}

export class AdvancedBrainOrchestrationService {
  private readonly selectionService: AdvancedBrainSelectionService;
  private readonly providers: readonly AdvancedReasoningProvider[];
  private readonly strategy: AdvancedBrainSelectionStrategy;
  private readonly allowFixtureProviders: boolean;
  private readonly now: () => Date;

  public constructor(options: AdvancedBrainOrchestrationOptions) {
    this.selectionService =
      options.selectionService ?? new AdvancedBrainSelectionService();
    this.providers = options.providers;
    this.strategy = options.strategy;
    this.allowFixtureProviders = options.allowFixtureProviders === true;
    this.now = options.now ?? (() => new Date());
  }

  public async run(
    requestInput: AdvancedBrainRequest,
  ): Promise<AdvancedBrainOrchestrationOutcome> {
    const startedAt = this.now();
    const request = AdvancedBrainRequestSchema.parse(requestInput);
    const selection = this.selectionService.select(
      this.selectionInputFor(request),
    );
    if (selection.status !== "selected" || !selection.selectedProviderId) {
      return {
        selection,
        diagnostics: this.diagnostics({
          request,
          selection,
          startedAt,
        }),
        plannerApprovalRequired: false,
      };
    }

    const provider = this.providers.find(
      (candidate) => candidate.profile.providerId === selection.selectedProviderId,
    );
    if (!provider) {
      const failed = this.safeFailureResult(
        request,
        selection.selectedProviderId,
        selection.selectedModelId ?? "advanced-brain.unknown",
        "PROVIDER_UNAVAILABLE",
      );
      return {
        selection,
        result: failed,
        diagnostics: this.diagnostics({
          request,
          selection,
          result: failed,
          startedAt,
        }),
        plannerApprovalRequired: false,
      };
    }

    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const prepared = await provider.prepare(request);
      const executePromise = provider.execute(prepared, {
        signal: controller.signal,
      });
      const timeoutPromise = new Promise<AdvancedBrainProviderResult>(
        (resolve) => {
          timeout = setTimeout(() => {
            controller.abort();
            void provider.cancel?.(request.requestId, "timeout");
            resolve(
              this.safeFailureResult(
                request,
                provider.profile.providerId,
                provider.profile.modelId,
                "PROVIDER_TIMEOUT",
              ),
            );
          }, request.timeoutMs);
        },
      );
      const result = await Promise.race([executePromise, timeoutPromise]);
      const parsed = this.parseProviderResult(
        result,
        request,
        provider.profile.providerId,
        provider.profile.modelId,
      );
      return {
        selection,
        result: parsed,
        diagnostics: this.diagnostics({
          request,
          selection,
          result: parsed,
          startedAt,
        }),
        plannerApprovalRequired: parsed.resultClass === "structured_plan",
      };
    } catch {
      const failed = this.safeFailureResult(
        request,
        provider.profile.providerId,
        provider.profile.modelId,
        "PROVIDER_FAILED",
      );
      return {
        selection,
        result: failed,
        diagnostics: this.diagnostics({
          request,
          selection,
          result: failed,
          startedAt,
        }),
        plannerApprovalRequired: false,
      };
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  private selectionInputFor(
    request: AdvancedBrainRequest,
  ): AdvancedBrainSelectionInput {
    return {
      category: request.category,
      inputModalities: request.inputModalities,
      requestedOutput: request.requestedOutput,
      requiredCapabilities: request.allowedCapabilities,
      privacyRequirement: request.privacyRequirement,
      cloudEgressPolicy: request.cloudEgressPolicy,
      strategy: this.strategy,
      providers: this.providers.map((provider) => provider.profile),
      allowFixtureProviders: this.allowFixtureProviders,
      ...(request.userConsentEvidence
        ? { userConsentEvidence: request.userConsentEvidence }
        : {}),
    };
  }

  private parseProviderResult(
    result: AdvancedBrainProviderResult,
    request: AdvancedBrainRequest,
    providerId: string,
    modelId: string,
  ): AdvancedBrainProviderResult {
    const parsed = AdvancedBrainProviderResultSchema.safeParse(result);
    if (
      !parsed.success ||
      parsed.data.providerId !== providerId ||
      parsed.data.modelId !== modelId ||
      parsed.data.requestId !== request.requestId ||
      parsed.data.directActionAttempted !== false
    ) {
      return this.safeFailureResult(
        request,
        providerId,
        modelId,
        "INVALID_OUTPUT",
      );
    }
    return parsed.data;
  }

  private safeFailureResult(
    request: AdvancedBrainRequest,
    providerId: string,
    modelId: string,
    reasonCode:
      | "PROVIDER_UNAVAILABLE"
      | "PROVIDER_TIMEOUT"
      | "PROVIDER_FAILED"
      | "INVALID_OUTPUT",
  ): AdvancedBrainProviderResult {
    return AdvancedBrainProviderResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      providerId,
      modelId,
      requestId: request.requestId,
      resultClass: reasonCode === "PROVIDER_UNAVAILABLE" ? "unavailable" : "failed",
      reasonCode,
      executionSemantics: "not_executed",
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      localPathExposed: false,
      networkRequestIssued: false,
      completedAt: this.now().toISOString(),
    });
  }

  private diagnostics(input: {
    request: AdvancedBrainRequest;
    selection: AdvancedBrainSelectionResult;
    result?: AdvancedBrainProviderResult;
    startedAt: Date;
  }): AdvancedBrainDiagnostics {
    const completedAt = this.now().getTime();
    return AdvancedBrainDiagnosticsSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      requestId: input.request.requestId,
      category: input.request.category,
      selectedProviderId: input.selection.selectedProviderId,
      selectedModelId: input.selection.selectedModelId,
      selectionReasonCode: input.selection.reasonCode,
      latencyMs: Math.max(0, completedAt - input.startedAt.getTime()),
      tokenBudgetClass: input.request.tokenBudgetClass,
      costBudgetClass: input.request.costBudgetClass,
      resultClass: input.result?.resultClass,
      errorReasonCode:
        input.result?.resultClass === "failed" ||
        input.result?.resultClass === "unavailable"
          ? input.result.reasonCode
          : undefined,
      cloudEgressDecision: input.selection.cloudEgressDecision,
      promptExposed: false,
      credentialExposed: false,
      localPathExposed: false,
      rawProviderResponsePersisted: false,
    });
  }
}
