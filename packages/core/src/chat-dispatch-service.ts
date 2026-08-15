import type { ChatAnswerProvider } from "@jarvis-k/capabilities";
import {
  BrainCommandResult,
  BrainPlanStep,
  BrainRouterDecision,
  ChatAnswerPreferenceProjection,
  ChatAnswerPreferenceProjectionSchema,
  ChatAnswerRequestSchema,
  ChatAnswerResult,
  ChatAnswerResultSchema,
  UserPreferenceMemoryRecord,
} from "@jarvis-k/contracts";

export interface ChatDispatchOptions {
  enabled: boolean;
  providerId?: string;
  forcedChatAnswerUtterances?: readonly string[];
}

export interface ChatDispatchPreferenceRepository {
  initialize(): Promise<void>;
  listPreferences(): Promise<UserPreferenceMemoryRecord[]>;
}

export interface ChatDispatchServiceOptions {
  provider?: ChatAnswerProvider | undefined;
  options?: ChatDispatchOptions | undefined;
  preferenceRepository?: ChatDispatchPreferenceRepository | undefined;
  now: () => Date;
}

export interface ChatDispatchInput {
  basePlan: BrainPlanStep[];
  source: "text" | "voice";
  text: string;
  decision: BrainRouterDecision;
}

export interface ChatDispatchResult {
  dispatchStatus: BrainCommandResult["dispatchStatus"];
  plan: BrainPlanStep[];
  summary: string;
  chatAnswer?: ChatAnswerResult;
}

export class ChatDispatchService {
  private provider: ChatAnswerProvider | undefined;
  private options: ChatDispatchOptions | undefined;
  private readonly preferenceRepository:
    | ChatDispatchPreferenceRepository
    | undefined;
  private readonly now: () => Date;

  public constructor(options: ChatDispatchServiceOptions) {
    this.provider = options.provider;
    this.options = options.options;
    this.preferenceRepository = options.preferenceRepository;
    this.now = options.now;
  }

  public configure(input: {
    provider?: ChatAnswerProvider | undefined;
    options?: ChatDispatchOptions | undefined;
  }): void {
    this.provider = input.provider;
    this.options = input.options;
  }

  public forcedChatAnswerUtterances(): readonly string[] {
    return this.options?.forcedChatAnswerUtterances ?? [];
  }

  public async dispatch(input: ChatDispatchInput): Promise<ChatDispatchResult> {
    const providerId = this.options?.providerId ?? "chat-answer.unconfigured";
    const preferenceProjection =
      await this.resolveChatAnswerPreferenceProjection();
    if (this.options === undefined) {
      const result = this.unavailableChatAnswer(
        providerId,
        "PROVIDER_UNAVAILABLE",
        "PROVIDER_UNAVAILABLE",
        preferenceProjection,
      );
      return {
        dispatchStatus: "degraded",
        plan: blockFinalBrainPlan(input.basePlan),
        summary:
          "Chat answer generation is unavailable; deterministic rules remain active.",
        chatAnswer: result,
      };
    }
    if (!this.options.enabled || !this.provider) {
      const result = this.unavailableChatAnswer(
        providerId,
        "PROVIDER_UNAVAILABLE",
        "PROVIDER_UNAVAILABLE",
        preferenceProjection,
      );
      return {
        dispatchStatus: "degraded",
        plan: blockFinalBrainPlan(input.basePlan),
        summary:
          "Chat answer generation is unavailable; deterministic fallback remains active.",
        chatAnswer: result,
      };
    }

    let result: ChatAnswerResult;
    try {
      const request = ChatAnswerRequestSchema.parse({
        providerId,
        utterance: input.text,
        source: input.source,
        routedAt: this.now().toISOString(),
        routerDecision: input.decision,
        preferenceProjection,
      });
      const rawResult = await this.provider.answer(request);
      const parsedResult = ChatAnswerResultSchema.safeParse(rawResult);
      if (
        !parsedResult.success ||
        parsedResult.data.providerId !== providerId
      ) {
        result = this.unavailableChatAnswer(
          providerId,
          "INVALID_OUTPUT",
          "PROVIDER_RESULT_INVALID",
          preferenceProjection,
        );
      } else {
        result = ChatAnswerResultSchema.parse({
          ...parsedResult.data,
          preferenceProjection,
        });
      }
    } catch {
      result = this.unavailableChatAnswer(
        providerId,
        "PROVIDER_FAILED",
        "PROVIDER_EXECUTION_FAILED",
        preferenceProjection,
      );
    }

    if (result.status === "answered" && result.answer) {
      return {
        dispatchStatus: "completed",
        plan: completeBrainPlan([
          ...input.basePlan,
          {
            id: "chat-answer",
            title: "Prepare bounded answer",
            status: "completed",
          },
        ]),
        summary: result.answer,
        chatAnswer: result,
      };
    }
    if (result.status === "clarify" && result.clarifyQuestion) {
      return {
        dispatchStatus: "blocked",
        plan: blockFinalBrainPlan([
          ...input.basePlan,
          {
            id: "chat-answer",
            title: "Request clarification",
            status: "blocked",
          },
        ]),
        summary: result.clarifyQuestion,
        chatAnswer: result,
      };
    }
    if (result.status === "blocked") {
      return {
        dispatchStatus: "blocked",
        plan: blockFinalBrainPlan(input.basePlan),
        summary:
          "Chat answer generation blocked this request before producing an answer.",
        chatAnswer: result,
      };
    }
    return {
      dispatchStatus: "degraded",
      plan: blockFinalBrainPlan(input.basePlan),
      summary:
        "Chat answer generation is unavailable; deterministic fallback remains active.",
      chatAnswer: result,
    };
  }

  private unavailableChatAnswer(
    providerId: string,
    reasonCode: "PROVIDER_UNAVAILABLE" | "INVALID_OUTPUT" | "PROVIDER_FAILED",
    failureClass:
      | "PROVIDER_UNAVAILABLE"
      | "PROVIDER_RESULT_INVALID"
      | "PROVIDER_EXECUTION_FAILED",
    preferenceProjection?: ChatAnswerPreferenceProjection,
  ): ChatAnswerResult {
    return ChatAnswerResultSchema.parse({
      providerId,
      status: "unavailable",
      reasonCode,
      failureClass,
      fallbackUsed: true,
      directActionAttempted: false,
      rawProviderResponsePersisted: false,
      credentialExposed: false,
      ...(preferenceProjection ? { preferenceProjection } : {}),
      answeredAt: this.now().toISOString(),
    });
  }

  private async resolveChatAnswerPreferenceProjection(): Promise<ChatAnswerPreferenceProjection> {
    if (!this.preferenceRepository) {
      return ChatAnswerPreferenceProjectionSchema.parse({
        status: "not_configured",
        appliesTo: "chat.answer",
        source: "none",
        rawContentExposed: false,
        vectorRetrievalUsed: false,
        providerNeutral: true,
      });
    }
    try {
      await this.preferenceRepository.initialize();
      const preferences = (await this.preferenceRepository.listPreferences()).filter(
        (record) => record.enabled && record.appliesTo === "ui_projection_only",
      );
      const responseLanguagePreference = preferences.find(
        (record) => record.key === "response_language" && record.value === "zh",
      );
      const responseLengthPreference = preferences.find(
        (record) =>
          record.key === "response_length" &&
          (record.value === "short" || record.value === "detailed"),
      );
      const responseStylePreference = preferences.find(
        (record) =>
          record.key === "response_style" &&
          (record.value === "concise" ||
            record.value === "friendly" ||
            record.value === "technical"),
      );
      if (
        !responseLanguagePreference &&
        !responseLengthPreference &&
        !responseStylePreference
      ) {
        return ChatAnswerPreferenceProjectionSchema.parse({
          status: "none",
          appliesTo: "chat.answer",
          source: "none",
          rawContentExposed: false,
          vectorRetrievalUsed: false,
          providerNeutral: true,
        });
      }
      return ChatAnswerPreferenceProjectionSchema.parse({
        status: "applied",
        appliesTo: "chat.answer",
        ...(responseLanguagePreference
          ? { preferredResponseLanguage: "zh" as const }
          : {}),
        ...(responseLengthPreference
          ? {
              preferredResponseLength: responseLengthPreference.value as
                | "short"
                | "detailed",
            }
          : {}),
        ...(responseStylePreference
          ? {
              preferredResponseStyle: responseStylePreference.value as
                | "concise"
                | "friendly"
                | "technical",
            }
          : {}),
        source: "user_preference_memory",
        rawContentExposed: false,
        vectorRetrievalUsed: false,
        providerNeutral: true,
      });
    } catch {
      return ChatAnswerPreferenceProjectionSchema.parse({
        status: "unavailable",
        appliesTo: "chat.answer",
        source: "none",
        rawContentExposed: false,
        vectorRetrievalUsed: false,
        providerNeutral: true,
      });
    }
  }
}

function completeBrainPlan(plan: BrainPlanStep[]): BrainPlanStep[] {
  return plan.map((step) =>
    step.id === "dispatch" ? { ...step, status: "completed" } : step,
  );
}

function blockFinalBrainPlan(plan: BrainPlanStep[]): BrainPlanStep[] {
  return plan.map((step) =>
    step.id === "dispatch" ? { ...step, status: "blocked" } : step,
  );
}
