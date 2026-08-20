import {
  ChatAnswerProductModeStatus,
  CommandRouterProductModeStatus,
  createCommandRouterQwenProductRoutingActivationStatus,
} from "@jarvis-k/contracts";
import type { UiSurfaceCapabilityStatus } from "@jarvis-k/contracts";
import type { ChatAnswerProviderConfiguration } from "../secure-chat-answer-provider-store";

export interface SettingsServiceOptions {
  loadChatAnswerProviderConfiguration: () => Promise<ChatAnswerProviderConfiguration | null>;
  getChatAnswerCredentialStatus: () => Promise<{
    secureStorageAvailable: boolean;
    credentialConfigured: boolean;
  }>;
  configureCommandRouterProductMode: (input: { enabled: boolean }) => void;
  configureChatAnswerProductMode: (input: {
    enabled: boolean;
    configuration?: ChatAnswerProviderConfiguration | undefined;
  }) => void;
  evaluationCapabilityAvailable?: boolean;
}

export class SettingsService {
  private commandRouterProductModeEnabled = false;
  private chatAnswerProductModeEnabled = false;
  private chatAnswerProductModeRuntimeArmed = false;

  public constructor(private readonly options: SettingsServiceOptions) {}

  public getUiSurfaceCapabilityStatus(): UiSurfaceCapabilityStatus {
    return {
      evaluationCapabilityAvailable:
        this.options.evaluationCapabilityAvailable === true,
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    };
  }

  public getCommandRouterProductModeStatus(): CommandRouterProductModeStatus {
    const qwenBindingStatus = this.commandRouterProductModeEnabled
      ? "unconfigured"
      : "disabled";
    return {
      enabled: this.commandRouterProductModeEnabled,
      providerId: "intent-router.deterministic.rules",
      mode: "production_rules",
      status: this.commandRouterProductModeEnabled
        ? "control_enabled_rules_only"
        : "disabled",
      fixtureOnly: false,
      directActionEnabled: false,
      realQwenRuntimeEnabled: false,
      networkAccessApproved: false,
      defaultBehaviorChanged: false,
      chatAnswerFallbackPreserved: true,
      qwenFastRouterBinding: {
        providerId: "intent-router.qwen3-0.6b",
        modelId: "Qwen/Qwen3-0.6B",
        status: qwenBindingStatus,
        mode: "no_runtime_status_only",
        productRoutingEnabled: false,
        realRuntimeEnabled: false,
        runtimeAccessed: false,
        artifactAccessed: false,
        persistentCacheChanged: false,
        directActionAttempted: false,
        activation: createCommandRouterQwenProductRoutingActivationStatus({
          commandRouterProductModeEnabled: this.commandRouterProductModeEnabled,
          preparedPolicyReviewed: true,
          readinessEvidencePassed: true,
          noRuntimeProductBindingPresent: true,
          coreSelectionFallbackPreserved: true,
          commandRouterSafetyGatesPreserved: true,
          deterministicRulesActive: true,
        }),
        conversationSurfaceProductRoute: {
          policyId: "qwen-conversation-surface.product-route.default-off.v1",
          status: this.commandRouterProductModeEnabled ? "ready" : "disabled",
          explicitOptInRequired: true,
          explicitOptInEnabled: false,
          activeRouteSource: "intent-router.deterministic.rules",
          fallbackRouteSource: "intent-router.deterministic.rules",
          qwenRouteSelectable: false,
          productRouteExecutionEnabled: false,
          directActionEnabled: false,
          browserUrlOpeningEnabled: false,
          vsCodeBlocked: true,
          allowlistTargets: ["notepad", "calculator"] as const,
          persistentOptIn: {
            policyId:
              "qwen-conversation-surface.persistent-opt-in.default-off.v1",
            status: this.commandRouterProductModeEnabled ? "prepared" : "disabled",
            localDeveloperOptInRequired: true,
            localDeveloperOptInEnabled: false,
            qwenRouteSelectableByDefault: false,
            productRouteExecutionEnabledByDefault: false,
            limitedProductSessionOnly: true,
            routeRequestLimit: 3,
            retainedSessionRequired: true,
            helperStartupAllowedByPolicyState: false,
            generationPortInvocationAllowedByPolicyState: false,
            activeRouteSource: "intent-router.deterministic.rules",
            fallbackRouteSource: "intent-router.deterministic.rules",
            rollbackRouteSource: "intent-router.deterministic.rules",
            defaultBehaviorChanged: false,
            releaseBehaviorChanged: false,
            reasonCodes: this.commandRouterProductModeEnabled
              ? [
                  "QWEN_CONVERSATION_PERSISTENT_OPT_IN_PREPARED_DEFAULT_OFF",
                  "QWEN_CONVERSATION_PERSISTENT_OPT_IN_LIMITED_SESSION_ONLY",
                ]
              : ["QWEN_CONVERSATION_PERSISTENT_OPT_IN_DISABLED"],
          },
          rollbackState: this.commandRouterProductModeEnabled
            ? "ready"
            : "not_needed",
          implementationPrepared: true,
          defaultBehaviorChanged: false,
          releaseBehaviorChanged: false,
          reasonCodes: this.commandRouterProductModeEnabled
            ? [
                "QWEN_CONVERSATION_PRODUCT_ROUTE_READY_DEFAULT_OFF",
                "QWEN_CONVERSATION_PRODUCT_ROUTE_RULES_ACTIVE",
              ]
            : ["QWEN_CONVERSATION_PRODUCT_ROUTE_DISABLED"],
        },
        gates: {
          explicitEnablementRequired: true,
          artifactDigestApprovalRequired: true,
          modelLifecycleReadinessRequired: true,
          runtimeGenerationPortReadinessRequired: true,
          selectionPolicyReadinessRequired: true,
          defaultOffPreserved: true,
          deterministicFallbackPreserved: true,
          singleEnvVarSufficient: false,
          normalCoreHostStartupInstantiatesQwen: false,
        },
        reasonCodes: [
          "QWEN_FAST_ROUTER_PRODUCT_BINDING_DISABLED",
          "QWEN_FAST_ROUTER_NO_RUNTIME_STATUS_ONLY",
          "QWEN_FAST_ROUTER_PRODUCT_ROUTING_UNAVAILABLE",
        ],
      },
      reasonCodes: this.commandRouterProductModeEnabled
        ? [
            "COMMAND_ROUTER_PRODUCT_MODE_CONTROL_ENABLED",
            "COMMAND_ROUTER_PRODUCT_MODE_FIXTURE_ONLY",
            "COMMAND_ROUTER_PRODUCT_MODE_DIRECT_ACTION_DISABLED",
          ]
        : ["COMMAND_ROUTER_PRODUCT_MODE_DISABLED"],
    };
  }

  public setCommandRouterProductModeEnabled(rawInput: unknown): {
    ok: boolean;
    status: CommandRouterProductModeStatus;
  } {
    const raw = asRecord(rawInput);
    this.commandRouterProductModeEnabled = raw.enabled === true;
    this.options.configureCommandRouterProductMode({
      enabled: this.commandRouterProductModeEnabled,
    });
    return {
      ok: true,
      status: this.getCommandRouterProductModeStatus(),
    };
  }

  public async getChatAnswerProductModeStatus(): Promise<ChatAnswerProductModeStatus> {
    const providerId = "chat-answer.openai-compatible.deepseek" as const;
    const credentialStatus = await this.options.getChatAnswerCredentialStatus();
    const status = !credentialStatus.secureStorageAvailable
      ? "secure_store_unavailable"
      : !credentialStatus.credentialConfigured
        ? "credential_missing"
        : this.chatAnswerProductModeEnabled
          ? this.chatAnswerProductModeRuntimeArmed
            ? "control_enabled_runtime_armed"
            : "control_enabled_runtime_locked"
          : "disabled";
    const reasonCodes =
      status === "secure_store_unavailable"
        ? ["CHAT_ANSWER_PRODUCT_MODE_SECURE_STORE_UNAVAILABLE"]
        : status === "credential_missing"
          ? ["CHAT_ANSWER_PRODUCT_MODE_CREDENTIAL_MISSING"]
          : status === "control_enabled_runtime_armed"
            ? [
                "CHAT_ANSWER_PRODUCT_MODE_CONTROL_ENABLED",
                "CHAT_ANSWER_PRODUCT_MODE_REAL_RUNTIME_ARMED",
              ]
            : status === "control_enabled_runtime_locked"
              ? [
                  "CHAT_ANSWER_PRODUCT_MODE_CONTROL_ENABLED",
                  "CHAT_ANSWER_PRODUCT_MODE_REAL_RUNTIME_LOCKED",
                ]
              : ["CHAT_ANSWER_PRODUCT_MODE_DISABLED"];

    return {
      enabled: this.chatAnswerProductModeEnabled,
      providerId,
      profileId: "deepseek.v4-flash.compact_json_object_256",
      status,
      secureStorageAvailable: credentialStatus.secureStorageAvailable,
      credentialConfigured: credentialStatus.credentialConfigured,
      credentialExposed: false,
      realProviderRuntimeEnabled: status === "control_enabled_runtime_armed",
      networkAccessApproved: status === "control_enabled_runtime_armed",
      defaultBehaviorChanged: false,
      fallbackPreserved: true,
      reasonCodes,
    };
  }

  public async setChatAnswerProductModeEnabled(rawInput: unknown): Promise<{
    ok: boolean;
    status: ChatAnswerProductModeStatus;
  }> {
    const raw = asRecord(rawInput);
    this.chatAnswerProductModeEnabled = raw.enabled === true;
    const configuration = this.chatAnswerProductModeEnabled
      ? await this.options.loadChatAnswerProviderConfiguration()
      : null;
    this.chatAnswerProductModeRuntimeArmed =
      this.chatAnswerProductModeEnabled && configuration !== null;
    this.options.configureChatAnswerProductMode({
      enabled: this.chatAnswerProductModeEnabled,
      ...(configuration ? { configuration } : {}),
    });
    return {
      ok: true,
      status: await this.getChatAnswerProductModeStatus(),
    };
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}
