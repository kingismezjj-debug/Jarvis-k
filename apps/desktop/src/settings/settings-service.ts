import {
  ChatAnswerProductModeStatus,
  CommandRouterProductModeStatus,
  createCommandRouterQwenProductRoutingActivationStatus,
  DesktopCloseButtonBehaviorSchema,
  DesktopFirstRunOnboardingStateSchema,
  DesktopPetPositionSchema,
  DesktopPetReducedMotionSchema,
  DesktopSettingsSchema,
  DesktopUiThemeSchema,
  ProductAboutInfoSchema,
} from "@jarvis-k/contracts";
import type {
  DesktopCloseButtonBehavior,
  DesktopFirstRunOnboardingState,
  DesktopLaunchAtLoginStatus,
  DesktopSettings,
  DesktopSettingsSetResult,
  DesktopPetSettings,
  DesktopPetPosition,
  ProductAboutInfo,
  UiSurfaceCapabilityStatus,
} from "@jarvis-k/contracts";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ChatAnswerProviderConfiguration } from "../secure-chat-answer-provider-store";
import type { LoginItemController } from "../login-item/login-item-controller";

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
  loginItemController?: LoginItemController;
  evaluationCapabilityAvailable?: boolean;
  cloudProviderAcceptanceCapabilityAvailable?: boolean;
  settingsV2CapabilityAvailable?: boolean;
  settingsV2EnvRequested?: boolean;
  settingsV2ReleaseAllowed?: boolean;
  releaseChannel?: "development" | "alpha" | "stable" | "test";
  productName?: string;
  productVersion?: string;
  desktopSettingsPath?: string;
}

export class SettingsService {
  private commandRouterProductModeEnabled = false;
  private chatAnswerProductModeEnabled = false;
  private chatAnswerProductModeRuntimeArmed = false;
  private desktopSettings: DesktopSettings;

  public constructor(private readonly options: SettingsServiceOptions) {
    this.desktopSettings = this.loadDesktopSettings();
  }

  public getUiSurfaceCapabilityStatus(): UiSurfaceCapabilityStatus {
    return {
      evaluationCapabilityAvailable:
        this.options.evaluationCapabilityAvailable === true,
      cloudProviderAcceptanceCapabilityAvailable:
        this.options.cloudProviderAcceptanceCapabilityAvailable === true,
      settingsV2CapabilityAvailable:
        this.options.settingsV2CapabilityAvailable === true,
      settingsV2EnvRequested: this.options.settingsV2EnvRequested === true,
      settingsV2ReleaseAllowed:
        this.options.settingsV2ReleaseAllowed === true,
      settingsV2Capability: this.options.settingsV2CapabilityAvailable === true,
      settingsSurfaceRequested: "general_settings",
      settingsSurfaceMounted:
        this.options.settingsV2CapabilityAvailable === true ? "v2" : "legacy",
      reasonCode:
        this.options.settingsV2CapabilityAvailable === true
          ? "enabled"
          : this.options.settingsV2EnvRequested === true
            ? "release_channel_not_allowed"
            : "flag_disabled",
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    };
  }

  public getDesktopSettings(): DesktopSettings {
    return this.desktopSettings;
  }

  public getDesktopLaunchAtLoginStatus(): DesktopLaunchAtLoginStatus {
    return this.options.loginItemController?.getStatus(
      this.desktopSettings.launchAtLoginEnabled,
    ) ?? createUnavailableLaunchAtLoginStatus(
      this.desktopSettings.launchAtLoginEnabled,
    );
  }

  public getProductAboutInfo(): ProductAboutInfo {
    const productVersion =
      typeof this.options.productVersion === "string"
        ? this.options.productVersion.trim()
        : "";
    const safeProductVersion =
      /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
        productVersion,
      )
        ? productVersion
        : "unknown";
    return ProductAboutInfoSchema.parse({
      productName:
        typeof this.options.productName === "string" &&
        this.options.productName.trim().length > 0
          ? this.options.productName.trim()
          : "Jarvis-K",
      version: safeProductVersion,
      inAppUpdatesSupported: false,
      updateCheckAvailable: false,
      externalLinksAvailable: false,
      diagnosticsExportAvailable: false,
      networkRequestRequired: false,
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    });
  }

  public setDesktopCloseButtonBehavior(
    rawInput: unknown,
  ): DesktopSettingsSetResult {
    const raw = asRecord(rawInput);
    const parsed = DesktopCloseButtonBehaviorSchema.safeParse(
      raw.closeButtonBehavior,
    );
    if (!parsed.success) {
      return {
        ok: false,
        settings: this.desktopSettings,
        message: "Desktop close button behavior is invalid.",
      };
    }

    this.desktopSettings = {
      ...this.desktopSettings,
      closeButtonBehavior: parsed.data,
      closeToTrayNoticeShown: this.desktopSettings.closeToTrayNoticeShown,
    };
    this.persistDesktopSettings();
    return {
      ok: true,
      settings: this.desktopSettings,
    };
  }

  public setDesktopLaunchAtLoginEnabled(
    rawInput: unknown,
  ): DesktopSettingsSetResult {
    const raw = asRecord(rawInput);
    if (typeof raw.launchAtLoginEnabled !== "boolean") {
      return {
        ok: false,
        settings: this.desktopSettings,
        message: "Launch at login setting is invalid.",
      };
    }
    const result = this.options.loginItemController?.setEnabled(
      raw.launchAtLoginEnabled,
    ) ?? {
      ok: false,
      message: "Launch at login is unavailable.",
      status: createUnavailableLaunchAtLoginStatus(false),
    };
    const nextRequested =
      result.ok && result.status.openAtLogin === raw.launchAtLoginEnabled
        ? raw.launchAtLoginEnabled
        : result.status.openAtLogin;
    this.desktopSettings = {
      ...this.desktopSettings,
      launchAtLoginEnabled: nextRequested,
    };
    this.persistDesktopSettings();
    return {
      ok: result.ok,
      settings: this.desktopSettings,
      ...(result.message ? { message: result.message } : {}),
    };
  }

  public setDesktopUiTheme(rawInput: unknown): DesktopSettingsSetResult {
    const raw = asRecord(rawInput);
    const parsed = DesktopUiThemeSchema.safeParse(raw.uiTheme);
    if (!parsed.success) {
      return {
        ok: false,
        settings: this.desktopSettings,
        message: "Desktop theme setting is invalid.",
      };
    }
    return this.updateDesktopSettings({
      uiTheme: parsed.data,
      uiThemeExplicitlyConfigured: true,
    });
  }

  public migrateLegacyDesktopUiTheme(rawInput: unknown): DesktopSettingsSetResult {
    const raw = asRecord(rawInput);
    const parsed = DesktopUiThemeSchema.safeParse(raw.legacyUiTheme);
    if (!parsed.success) {
      return {
        ok: false,
        settings: this.desktopSettings,
        message: "Legacy desktop theme setting is invalid.",
      };
    }
    if (
      this.desktopSettings.uiThemeExplicitlyConfigured ||
      this.desktopSettings.uiTheme !== "signal"
    ) {
      return {
        ok: false,
        settings: this.desktopSettings,
        message: "Desktop theme already has a trusted setting.",
      };
    }
    return this.updateDesktopSettings({
      uiTheme: parsed.data,
      uiThemeExplicitlyConfigured: true,
    });
  }

  public getDesktopPetSettings(): DesktopPetSettings {
    return {
      enabled: this.desktopSettings.desktopPetEnabled,
      alwaysOnTop: this.desktopSettings.desktopPetAlwaysOnTop,
      reducedMotion: this.desktopSettings.desktopPetReducedMotion,
      ...(this.desktopSettings.desktopPetPosition
        ? { position: this.desktopSettings.desktopPetPosition }
        : {}),
      persistedLocally: true,
      syncedToCloud: false,
    };
  }

  public setDesktopPetEnabled(rawInput: unknown): DesktopSettingsSetResult {
    const raw = asRecord(rawInput);
    if (typeof raw.enabled !== "boolean") {
      return {
        ok: false,
        settings: this.desktopSettings,
        message: "Desktop Pet setting is invalid.",
      };
    }
    return this.updateDesktopSettings({
      desktopPetEnabled: raw.enabled,
    });
  }

  public setDesktopPetAlwaysOnTop(rawInput: unknown): DesktopSettingsSetResult {
    const raw = asRecord(rawInput);
    if (typeof raw.alwaysOnTop !== "boolean") {
      return {
        ok: false,
        settings: this.desktopSettings,
        message: "Desktop Pet on-top setting is invalid.",
      };
    }
    return this.updateDesktopSettings({
      desktopPetAlwaysOnTop: raw.alwaysOnTop,
    });
  }

  public setDesktopPetReducedMotion(rawInput: unknown): DesktopSettingsSetResult {
    const raw = asRecord(rawInput);
    const parsed = DesktopPetReducedMotionSchema.safeParse(raw.reducedMotion);
    if (!parsed.success) {
      return {
        ok: false,
        settings: this.desktopSettings,
        message: "Desktop Pet motion setting is invalid.",
      };
    }
    return this.updateDesktopSettings({
      desktopPetReducedMotion: parsed.data,
    });
  }

  public saveDesktopPetPosition(
    position: DesktopPetPosition,
  ): DesktopSettingsSetResult {
    return this.updateDesktopSettings({
      desktopPetPosition: position,
    });
  }

  public resetDesktopPetPosition(): DesktopSettingsSetResult {
    const { desktopPetPosition: _position, ...settings } = this.desktopSettings;
    this.desktopSettings = settings;
    this.persistDesktopSettings();
    return {
      ok: true,
      settings: this.desktopSettings,
    };
  }

  public setDesktopFirstRunOnboardingState(
    rawInput: unknown,
  ): DesktopSettingsSetResult {
    const raw = asRecord(rawInput);
    const parsed = DesktopFirstRunOnboardingStateSchema.safeParse(
      raw.firstRunOnboardingState,
    );
    if (!parsed.success) {
      return {
        ok: false,
        settings: this.desktopSettings,
        message: "First-run onboarding state is invalid.",
      };
    }

    this.desktopSettings = {
      ...this.desktopSettings,
      firstRunOnboardingState: parsed.data,
      firstRunOnboardingStateChangedAt: new Date().toISOString(),
    };
    this.persistDesktopSettings();
    return {
      ok: true,
      settings: this.desktopSettings,
    };
  }

  public markCloseToTrayNoticeShown(): boolean {
    if (this.desktopSettings.closeToTrayNoticeShown) {
      return false;
    }
    this.desktopSettings = {
      ...this.desktopSettings,
      closeToTrayNoticeShown: true,
    };
    this.persistDesktopSettings();
    return true;
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

  private loadDesktopSettings(): DesktopSettings {
    if (!this.options.desktopSettingsPath) {
      return createDesktopSettings("minimize_to_tray");
    }
    try {
      const raw = readFileSync(this.options.desktopSettingsPath, "utf8");
      return migrateDesktopSettings(JSON.parse(raw));
    } catch {
      return createDesktopSettings("minimize_to_tray");
    }
  }

  private persistDesktopSettings(): void {
    if (!this.options.desktopSettingsPath) {
      return;
    }
    mkdirSync(path.dirname(this.options.desktopSettingsPath), {
      recursive: true,
    });
    writeFileSync(
      this.options.desktopSettingsPath,
      `${JSON.stringify(this.desktopSettings, null, 2)}\n`,
      "utf8",
    );
  }

  private updateDesktopSettings(
    patch: Partial<
      Pick<
        DesktopSettings,
        | "desktopPetEnabled"
        | "desktopPetAlwaysOnTop"
        | "desktopPetReducedMotion"
        | "desktopPetPosition"
        | "uiTheme"
        | "uiThemeExplicitlyConfigured"
      >
    >,
  ): DesktopSettingsSetResult {
    this.desktopSettings = {
      ...this.desktopSettings,
      ...patch,
    };
    this.persistDesktopSettings();
    return {
      ok: true,
      settings: this.desktopSettings,
    };
  }
}

function createDesktopSettings(
  closeButtonBehavior: DesktopCloseButtonBehavior,
): DesktopSettings {
  return {
    closeButtonBehavior,
    closeToTrayNoticeShown: false,
    launchAtLoginEnabled: false,
    uiTheme: "signal",
    uiThemeExplicitlyConfigured: false,
    desktopPetEnabled: false,
    desktopPetAlwaysOnTop: true,
    desktopPetReducedMotion: "system",
    firstRunOnboardingVersion: 1,
    firstRunOnboardingState: "pending",
    persistedLocally: true,
    syncedToCloud: false,
  };
}

function migrateDesktopSettings(rawInput: unknown): DesktopSettings {
  const raw = asRecord(rawInput);
  const closeButtonBehavior =
    DesktopCloseButtonBehaviorSchema.safeParse(raw.closeButtonBehavior).data ??
    "minimize_to_tray";
  const firstRunOnboardingState =
    DesktopFirstRunOnboardingStateSchema.safeParse(
      raw.firstRunOnboardingState,
    ).data ?? "pending";
  const parsedTheme = DesktopUiThemeSchema.safeParse(raw.uiTheme);
  const candidate = {
    closeButtonBehavior,
    closeToTrayNoticeShown: raw.closeToTrayNoticeShown === true,
    launchAtLoginEnabled: raw.launchAtLoginEnabled === true,
    uiTheme: parsedTheme.data ?? "signal",
    uiThemeExplicitlyConfigured:
      typeof raw.uiThemeExplicitlyConfigured === "boolean"
        ? raw.uiThemeExplicitlyConfigured
        : false,
    desktopPetEnabled: raw.desktopPetEnabled === true,
    desktopPetAlwaysOnTop:
      typeof raw.desktopPetAlwaysOnTop === "boolean"
        ? raw.desktopPetAlwaysOnTop
        : true,
    desktopPetReducedMotion:
      DesktopPetReducedMotionSchema.safeParse(raw.desktopPetReducedMotion)
        .data ?? "system",
    ...(DesktopPetPositionSchema.safeParse(raw.desktopPetPosition).success
      ? {
          desktopPetPosition: raw.desktopPetPosition as DesktopPetPosition,
        }
      : {}),
    firstRunOnboardingVersion: 1,
    firstRunOnboardingState,
    ...(typeof raw.firstRunOnboardingStateChangedAt === "string"
      ? { firstRunOnboardingStateChangedAt: raw.firstRunOnboardingStateChangedAt }
      : {}),
    persistedLocally: true,
    syncedToCloud: false,
  };
  const parsed = DesktopSettingsSchema.safeParse(candidate);
  if (parsed.success) {
    return parsed.data;
  }
  return {
    ...createDesktopSettings(closeButtonBehavior),
    closeToTrayNoticeShown: raw.closeToTrayNoticeShown === true,
    launchAtLoginEnabled: raw.launchAtLoginEnabled === true,
    uiTheme: parsedTheme.data ?? "signal",
    uiThemeExplicitlyConfigured:
      typeof raw.uiThemeExplicitlyConfigured === "boolean"
        ? raw.uiThemeExplicitlyConfigured
        : false,
    desktopPetEnabled: raw.desktopPetEnabled === true,
    desktopPetAlwaysOnTop:
      typeof raw.desktopPetAlwaysOnTop === "boolean"
        ? raw.desktopPetAlwaysOnTop
        : true,
    desktopPetReducedMotion:
      DesktopPetReducedMotionSchema.safeParse(raw.desktopPetReducedMotion)
        .data ?? "system",
    firstRunOnboardingState,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function createUnavailableLaunchAtLoginStatus(
  requested: boolean,
): DesktopLaunchAtLoginStatus {
  return {
    requested,
    openAtLogin: false,
    supported: false,
    canModify: false,
    mismatch: requested,
    releaseChannel: "development",
    startupArgument: "--jarvis-startup=login",
    source: "unsupported-release-channel",
    appId: "com.jarvis-k.desktop.development",
    productName: "Jarvis-K",
    errorCode: "LOGIN_ITEM_UNSUPPORTED_RELEASE_CHANNEL",
  };
}
