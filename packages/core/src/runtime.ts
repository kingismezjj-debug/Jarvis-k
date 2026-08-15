import {
  AppEvent,
  BrainAlphaHardening,
  BrainAlphaHardeningSchema,
  BrainAlphaMemoryContext,
  BrainCommandResult,
  BrainCommandResultSchema,
  BrainIntent,
  BrainPlanStep,
  BrainPlannerResult,
  BrainPlannerSelectionReport,
  BrainPlannerSelectionReportSchema,
  BrainToolProductLoop,
  BrainToolProductLoopSchema,
  CommandRouterLocalAppLaunchResultSchema,
  BrainRouterDecision,
  BrainRouterDecisionSchema,
  BrainRouterSelectionReport,
  BrainRouterSelectionReportSchema,
  ChatAnswerResult,
  CapabilitySnapshot,
  CapabilitySnapshotSchema,
  CommandEnvelope,
  CommandEnvelopeSchema,
  CommandResult,
  Conversation,
  CoreSnapshot,
  EmbeddingGenerationRequestSchema,
  EmbeddingGenerationResultSchema,
  EventEnvelope,
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  InferencePreflightReportSchema,
  IntentRoutingRequestSchema,
  IntentRoutingResultSchema,
  Message,
  MemoryAlphaRecallProbeResult,
  MemoryAlphaRecallProbeResultSchema,
  MemoryAlphaStatus,
  MemoryAlphaStatusSchema,
  MemoryHealth,
  MemoryHealthSchema,
  ModelInstallabilityReportSchema,
  ModelCandidateSchema,
  ModelInventoryItemSchema,
  ModelManifestSchema,
  ModelOperationSnapshot,
  ModelOperationSnapshotSchema,
  ModelRuntimeAdapterDescriptorSchema,
  MemorySnapshot,
  OcrRecognitionRequestSchema,
  OcrRecognitionResultSchema,
  PluginInvocationResult,
  PluginListResultSchema,
  LocalPluginEnabledStateSetRequestSchema,
  LocalPluginEnabledStateSetResultSchema,
  PluginManifest,
  LocalPluginManifestDeveloperStatusResultSchema,
  PluginManagementConfirmationPolicy,
  PluginManagementRiskTier,
  PluginManagementStatusResultSchema,
  PROTOCOL_VERSION,
  RerankRequestSchema,
  RerankResultSchema,
  ResourceSchedulerDiagnostics,
  ResourceSchedulerDiagnosticsSchema,
  SessionHistoryEntry,
  SessionHistoryEntrySchema,
  StructuredError,
  Task,
  TaskSchema,
  TaskStep,
  TaskStepVerificationStatus,
  TextOnlyAcceptanceModeSchema,
  ToolDescriptor,
  ToolExecutionResult,
  ToolInvocationRequest,
  ToolPolicy,
  ToolPolicyDecision,
  UserControlledMemoryRecord,
  VoiceCommand,
  VoiceCommandCorrection,
  VoiceEvent,
  createId,
} from "@jarvis-k/contracts";
import {
  FixtureToolExecutor,
  decideToolInvocation,
} from "@jarvis-k/capabilities";
import type {
  CapabilityProvider,
  ChatAnswerProvider,
  EmbeddingInferenceProvider,
  HeavyPlannerProvider,
  InferenceExecutionPlanner,
  InferenceProviderRegistry,
  IntentRoutingProvider,
  LocalPluginManifestDeveloperDiagnostics,
  OcrRecognitionProvider,
  PluginRegistry,
  PluginRuntime,
  RerankingProvider,
  ModelCandidateRegistry,
  ModelInstallWorkflowOrchestrator,
  ModelInstallationPlanner,
  ModelLifecycleManager,
  ModelOperationSupervisor,
  ModelRegistry,
  ModelRuntimeRegistry,
  ResourceScheduler,
} from "@jarvis-k/capabilities";
import type {
  EmbeddingMemoryRetrievalPort,
  MemoryRepository,
} from "@jarvis-k/memory";
import type { VoiceActionResult, VoiceEnginePort } from "@jarvis-k/voice";
import type { TaskRepository } from "./task-runtime";
import { TaskDispatchService } from "./task-dispatch-service";
import {
  VoiceCommandResolver,
} from "./voice-command-resolver";
import {
  PluginInvocationService,
  canEnableLocalPluginState,
} from "./plugin-invocation-service";
import { VoiceResolutionService } from "./voice-resolution-service";
import { ChatDispatchService } from "./chat-dispatch-service";
import {
  CommandRoutingService,
  type CommandRoutingOutcome as CoreBrainRoutingOutcome,
} from "./command-routing-service";
import {
  MemoryRecallService,
  type CoreMemoryRecallObservation,
  type CoreMemoryRetrievalRoutingOptions,
} from "./memory/memory-recall-service";
import {
  UserPreferenceMemoryService,
  type UserPreferenceMemoryRepository,
} from "./memory/user-preference-memory-service";
import {
  RouteAliasMemoryService,
  type UserRouteAliasRepository,
  type VoiceCommandAliasRepository,
} from "./memory/route-alias-memory-service";
import {
  DETERMINISTIC_MINIMAL_PLANNER_PROVIDER_ID,
  DeterministicPlannerService,
} from "./planner/deterministic-planner-service";
import { PlannerApprovalService } from "./planner/planner-approval-service";
import { PlannerExecutionCoordinator } from "./planner/planner-execution-coordinator";
import { ProviderPlannerService } from "./planner/provider-planner-service";

type EventSink = (event: EventEnvelope) => void;

const DEFAULT_BRAIN_ROUTER_MIN_CONFIDENCE = 0.7;
const COMMAND_ROUTER_PRODUCT_MODE_PROVIDER_ID =
  "intent-router.deterministic.rules";
const COMMAND_ROUTER_FIXTURE_PROVIDER_ID =
  "intent-router.deterministic.fixture";
const COMMAND_ROUTER_LOCAL_APP_FIXTURE_ALLOWLIST = new Set([
  "notepad",
  "calculator",
  "calc",
]);
type CommandRouterKnownLocalAppLabel = "notepad" | "calculator" | "vscode";
type CoreKnownAppWindowAction = "focus" | "minimize" | "restore";
const BRAIN_ROUTER_ALLOWED_INTENTS: readonly BrainIntent[] = [
  "chat.answer",
  "browser.open",
  "coding.task",
  "localApp.open",
  "notepad.write_text",
  "window.focus",
  "window.minimize",
  "window.restore",
  "filesystem.search",
  "plugin.invoke",
  "memory.search",
  "observability.status",
  "model.status",
  "clarify",
  "blocked",
];
const BRAIN_PLANNER_ALLOWED_TOOL_IDS = [
  "browser.open",
  "localApp.open",
  "notepad.writeText",
  "window.focus",
  "window.minimize",
  "window.restore",
  "chat.answer",
  "filesystem.search",
  "plugin.invoke",
  "memory.search",
  "memory.status",
  "model.status",
  "observability.status",
  "system.settings",
] as const;
const BRAIN_TOOL_REGISTRY_VERSION = "1.0.0";
const BRAIN_TOOL_REGISTRY_DESCRIPTORS = [
  {
    id: "browser.open",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Replay a browser-open route through fixture safety gates.",
    risk: "mutating",
    execution: "fixture",
    requiredPermissions: [],
    requiresConfirmation: true,
    inputSchemaId: "tool.browser.open.input",
  },
  {
    id: "localApp.open",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description:
      "Replay a local-application route through fixture safety gates.",
    risk: "mutating",
    execution: "fixture",
    requiredPermissions: [],
    requiresConfirmation: true,
    inputSchemaId: "tool.localapp.open.input",
  },
  {
    id: "notepad.writeText",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Write bounded text into a supervised Notepad window.",
    risk: "mutating",
    execution: "windows",
    requiredPermissions: [],
    requiresConfirmation: false,
    inputSchemaId: "tool.notepad.writeText.input",
  },
  {
    id: "window.focus",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Focus a fixed known-app Windows window.",
    risk: "mutating",
    execution: "windows",
    requiredPermissions: [],
    requiresConfirmation: false,
    inputSchemaId: "tool.window.focus.input",
  },
  {
    id: "window.minimize",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Minimize a fixed known-app Windows window.",
    risk: "mutating",
    execution: "windows",
    requiredPermissions: [],
    requiresConfirmation: false,
    inputSchemaId: "tool.window.minimize.input",
  },
  {
    id: "window.restore",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Restore a fixed known-app Windows window.",
    risk: "mutating",
    execution: "windows",
    requiredPermissions: [],
    requiresConfirmation: false,
    inputSchemaId: "tool.window.restore.input",
  },
  {
    id: "chat.answer",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Project a chat-answer route without model execution.",
    risk: "read_only",
    execution: "fixture",
    requiredPermissions: [],
    requiresConfirmation: false,
    inputSchemaId: "tool.chat.answer.input",
  },
  {
    id: "filesystem.search",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Project a bounded filesystem search route.",
    risk: "read_only",
    execution: "fixture",
    requiredPermissions: ["filesystem.read"],
    requiresConfirmation: false,
    inputSchemaId: "tool.filesystem.search.input",
  },
  {
    id: "memory.search",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Project a bounded Memory search route.",
    risk: "read_only",
    execution: "fixture",
    requiredPermissions: ["memory.read"],
    requiresConfirmation: false,
    inputSchemaId: "tool.memory.search.input",
  },
  {
    id: "memory.status",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Project a Memory status route.",
    risk: "read_only",
    execution: "fixture",
    requiredPermissions: ["memory.read"],
    requiresConfirmation: false,
    inputSchemaId: "tool.memory.status.input",
  },
  {
    id: "model.status",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Project a model lifecycle status route.",
    risk: "read_only",
    execution: "fixture",
    requiredPermissions: [],
    requiresConfirmation: false,
    inputSchemaId: "tool.model.status.input",
  },
  {
    id: "observability.status",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Project an Observability status route.",
    risk: "read_only",
    execution: "fixture",
    requiredPermissions: [],
    requiresConfirmation: false,
    inputSchemaId: "tool.observability.status.input",
  },
  {
    id: "system.settings",
    version: BRAIN_TOOL_REGISTRY_VERSION,
    description: "Project a settings-surface route.",
    risk: "read_only",
    execution: "fixture",
    requiredPermissions: [],
    requiresConfirmation: false,
    inputSchemaId: "tool.system.settings.input",
  },
] satisfies readonly ToolDescriptor[];
const BRAIN_TOOL_REGISTRY_POLICY: ToolPolicy = {
  policyVersion: BRAIN_TOOL_REGISTRY_VERSION,
  allowedToolIds: [...BRAIN_PLANNER_ALLOWED_TOOL_IDS],
  blockedToolIds: [],
  allowedPermissionScopes: ["memory.read"],
  confirmationRequiredFor: ["mutating", "destructive"],
  fixtureExecutionEnabled: true,
  windowsExecutionEnabled: false,
  networkAccessAllowed: false,
  shellExecutionAllowed: false,
};

export interface CoreMemoryAlphaSessionPort {
  getStatus(): MemoryAlphaStatus;
  disable(): Promise<MemoryAlphaStatus>;
}

export interface CoreBrainActionRequest {
  target: string;
  text?: string;
  action?: "focus" | "minimize" | "restore";
}

export interface CoreBrainActionResult {
  status: "completed" | "blocked";
  reasonCode:
    | "ALLOWLISTED_TARGET_OPENED"
    | "NOTEPAD_TEXT_WRITTEN"
    | "WINDOW_CONTROL_COMPLETED"
    | "FILESYSTEM_SEARCH_COMPLETED"
    | "BRAIN_ACTIONS_DISABLED"
    | "TARGET_INVALID"
    | "TARGET_NOT_ALLOWLISTED"
    | "TARGET_UNAVAILABLE"
    | "OPEN_FAILED"
    | "WRITE_FAILED"
    | "WINDOW_CONTROL_FAILED"
    | "SEARCH_FAILED";
  label: string;
  verificationStatus?: TaskStepVerificationStatus;
  verificationSummary?: string;
  matchCount?: number;
}

export interface CoreBrainActionExecutorPort {
  openBrowser(request: CoreBrainActionRequest): Promise<CoreBrainActionResult>;
  openLocalApp(request: CoreBrainActionRequest): Promise<CoreBrainActionResult>;
  searchFilesystem?(
    request: CoreBrainActionRequest,
  ): Promise<CoreBrainActionResult>;
  writeNotepadText?(
    request: CoreBrainActionRequest,
  ): Promise<CoreBrainActionResult>;
  controlKnownAppWindow?(
    request: CoreBrainActionRequest,
  ): Promise<CoreBrainActionResult>;
}

export interface CoreBrainRouterOptions {
  enabled: boolean;
  modelId: string;
  providerId?: string;
  locale?: "zh" | "en";
  minConfidence?: number;
  allowedIntents?: readonly BrainIntent[];
}

export interface CoreCommandRouterProductModeOptions {
  enabled: boolean;
  providerId?: string;
  mode?: "production_rules" | "fixture_only";
  fixtureExecutionEnabled?: boolean;
}

export interface CoreBrainPlannerOptions {
  enabled: boolean;
  providerId?: string;
  escalateIntents?: readonly BrainIntent[];
}

export interface CoreChatAnswerOptions {
  enabled: boolean;
  providerId?: string;
  forcedChatAnswerUtterances?: readonly string[];
}

export interface CoreTextOnlyAcceptanceOptions {
  enabled: boolean;
}

export interface LocalPluginEnabledStateRecord {
  pluginId: string;
  enabled: boolean;
  updatedAt: string;
}

export interface LocalPluginStateRepository {
  initialize(): Promise<void>;
  getState(
    pluginId: string,
  ): Promise<LocalPluginEnabledStateRecord | undefined>;
  setState(
    input: LocalPluginEnabledStateRecord,
  ): Promise<LocalPluginEnabledStateRecord>;
}

interface CoreBrainPlanningOutcome {
  selection: BrainPlannerSelectionReport;
  result?: BrainPlannerResult;
}

export class CoreRuntime {
  private readonly coreInstanceId = createId("core");
  private readonly startedAt: string;
  private readonly messages: Message[] = [];
  private readonly sessionHistory: SessionHistoryEntry[] = [];
  private readonly conversations: Conversation[] = [];
  private sequenceId = 0;
  private activeVoiceCorrelationId: string | undefined;
  private health: CoreSnapshot["health"] = "ready";
  private activeConversationId: string | undefined;
  private memoryHealth: MemoryHealth | undefined;
  private capabilities: CapabilitySnapshot | undefined;
  private readonly modelOperations: ModelOperationSnapshot[] = [];
  private tasks: Task[] = [];
  private resourceDiagnostics: ResourceSchedulerDiagnostics | undefined;
  private commandRouterProductMode:
    CoreCommandRouterProductModeOptions | undefined;
  private localPluginStateRepositoryInitialized = false;
  private readonly taskDispatchService: TaskDispatchService | undefined;
  private readonly pluginInvocationService: PluginInvocationService;
  private readonly voiceResolutionService: VoiceResolutionService;
  private readonly chatDispatchService: ChatDispatchService;
  private readonly commandRoutingService: CommandRoutingService;
  private readonly memoryRecallService: MemoryRecallService;
  private readonly userPreferenceMemoryService: UserPreferenceMemoryService;
  private readonly routeAliasMemoryService: RouteAliasMemoryService;
  private readonly deterministicPlannerService: DeterministicPlannerService;
  private readonly providerPlannerService: ProviderPlannerService;
  private readonly plannerApprovalService: PlannerApprovalService;
  private readonly plannerExecutionCoordinator: PlannerExecutionCoordinator;

  public constructor(
    private readonly eventSink: EventSink,
    private readonly voiceEngine: VoiceEnginePort,
    private readonly now: () => Date = () => new Date(),
    private readonly memoryRepository?: MemoryRepository,
    private readonly capabilityProvider?: CapabilityProvider,
    private readonly modelRegistry?: ModelRegistry,
    private readonly modelLifecycleManager?: ModelLifecycleManager,
    private readonly modelCandidateRegistry?: ModelCandidateRegistry,
    private readonly modelInstallationPlanner?: ModelInstallationPlanner,
    private readonly modelOperationSupervisor?: ModelOperationSupervisor,
    private readonly resourceScheduler?: ResourceScheduler,
    private readonly modelInstallWorkflowOrchestrator?: ModelInstallWorkflowOrchestrator,
    private readonly modelRuntimeRegistry?: ModelRuntimeRegistry,
    private readonly inferenceProviderRegistry?: InferenceProviderRegistry,
    private readonly inferenceExecutionPlanner?: InferenceExecutionPlanner,
    private readonly embeddingInferenceProvider?: EmbeddingInferenceProvider,
    private readonly intentRoutingProvider?: IntentRoutingProvider,
    private readonly ocrRecognitionProvider?: OcrRecognitionProvider,
    private readonly rerankingProvider?: RerankingProvider,
    private readonly embeddingMemoryRetrievalPort?: EmbeddingMemoryRetrievalPort,
    private readonly memoryRetrievalRouting?: CoreMemoryRetrievalRoutingOptions,
    private readonly memoryAlphaSession?: CoreMemoryAlphaSessionPort,
    private readonly brainActionExecutor?: CoreBrainActionExecutorPort,
    private readonly brainRouter?: CoreBrainRouterOptions,
    private readonly heavyPlannerProvider?: HeavyPlannerProvider,
    private readonly brainPlanner?: CoreBrainPlannerOptions,
    private chatAnswerProvider?: ChatAnswerProvider,
    private chatAnswer?: CoreChatAnswerOptions,
    private readonly textOnlyAcceptance?: CoreTextOnlyAcceptanceOptions,
    private readonly taskRepository?: TaskRepository,
    private readonly pluginRegistry?: PluginRegistry,
    private readonly pluginRuntime?: PluginRuntime,
    private readonly localPluginManifestDiagnostics?: LocalPluginManifestDeveloperDiagnostics,
    private readonly localPluginStateRepository?: LocalPluginStateRepository,
    private readonly voiceCommandAliasRepository?: VoiceCommandAliasRepository,
    private readonly userRouteAliasRepository?: UserRouteAliasRepository,
    private readonly voiceCommandResolver = new VoiceCommandResolver(),
    private readonly userPreferenceMemoryRepository?: UserPreferenceMemoryRepository,
  ) {
    this.startedAt = this.now().toISOString();
    this.taskDispatchService =
      this.taskRepository === undefined
        ? undefined
        : new TaskDispatchService({
            repository: this.taskRepository,
            now: this.now,
          });
    this.pluginInvocationService = new PluginInvocationService({
      pluginRegistry: this.pluginRegistry,
      pluginRuntime: this.pluginRuntime,
      localPluginStateRepository: this.localPluginStateRepository,
      ensureLocalPluginStateRepositoryInitialized: () =>
        this.ensureLocalPluginStateRepositoryInitialized(),
      now: this.now,
    });
    this.voiceResolutionService = new VoiceResolutionService({
      voiceCommandAliasRepository: this.voiceCommandAliasRepository,
      pluginRegistry: this.pluginRegistry,
      resolver: this.voiceCommandResolver,
    });
    this.chatDispatchService = new ChatDispatchService({
      provider: this.chatAnswerProvider,
      options: this.chatAnswer,
      preferenceRepository: this.userPreferenceMemoryRepository,
      now: this.now,
    });
    this.memoryRecallService = new MemoryRecallService({
      retrievalPort: this.embeddingMemoryRetrievalPort,
      routing: this.memoryRetrievalRouting,
      now: this.now,
    });
    this.userPreferenceMemoryService = new UserPreferenceMemoryService({
      repository: this.userPreferenceMemoryRepository,
      now: this.now,
    });
    this.routeAliasMemoryService = new RouteAliasMemoryService({
      routeAliasRepository: this.userRouteAliasRepository,
      voiceAliasRepository: this.voiceCommandAliasRepository,
      now: this.now,
    });
    this.deterministicPlannerService = new DeterministicPlannerService({
      allowedToolIds: BRAIN_PLANNER_ALLOWED_TOOL_IDS,
      now: this.now,
      extractOpenTarget: (text) => this.extractOpenTarget(text),
      isKnownLocalAppTarget: (target) =>
        this.commandRouterRealLocalAppLaunchLabel(target) !== "blocked",
    });
    this.providerPlannerService = new ProviderPlannerService({
      provider: this.heavyPlannerProvider,
      now: this.now,
      allowedToolIds: BRAIN_PLANNER_ALLOWED_TOOL_IDS,
      rulesFallbackProviderId: "brain.rules",
    });
    this.plannerApprovalService = new PlannerApprovalService({
      repository: this.taskRepository,
      now: this.now,
    });
    this.plannerExecutionCoordinator = new PlannerExecutionCoordinator({
      actionExecutor: this.brainActionExecutor,
      getRuntimeStatus: () => ({
        health: this.health,
        sequenceId: this.sequenceId,
        voiceState: this.voiceEngine.getSnapshot().state,
        memoryHealthStatus: this.memoryHealth?.status ?? "unknown",
      }),
      voiceCommandAliasRepository: this.voiceCommandAliasRepository,
      userRouteAliasRepository: this.userRouteAliasRepository,
      userPreferenceMemoryRepository: this.userPreferenceMemoryRepository,
      resolveKnownLocalApp: (target) => {
        const appLabel = this.commandRouterRealLocalAppLaunchLabel(target);
        return appLabel === "blocked" ? undefined : appLabel;
      },
      displayKnownLocalApp: (label) =>
        this.commandRouterKnownLocalAppDisplayName(label),
    });
    this.commandRoutingService = new CommandRoutingService({
      productModeProviderId: COMMAND_ROUTER_PRODUCT_MODE_PROVIDER_ID,
      fixtureProviderId: COMMAND_ROUTER_FIXTURE_PROVIDER_ID,
      rulesFallbackProviderId: "brain.rules",
      getProductMode: () => this.commandRouterProductMode,
      isFixtureReplayEnabled: () => this.isCommandRouterFixtureReplayEnabled(),
      routeUserRouteAliasByRules: (text) =>
        this.routeUserRouteAliasByRules(text),
      routeVoiceCommandAliasByRules: (text) =>
        this.routeVoiceCommandAliasByRules(text),
      routeWithProvider: (input) => this.routeBrainIntentWithProvider(input),
      routeByRules: (text) => this.routeBrainIntentByRules(text),
      routeForProductMode: (text) =>
        this.routeBrainIntentForCommandRouterProductMode(text),
      applyProductModeSafety: (decision) =>
        this.applyCommandRouterProductModeSafetyToDecision(decision),
      createRouterSelection: (input) => this.brainRouterSelection(input),
      brainRouterProviderId: () => this.brainRouterProviderId(),
      confidenceBand: (confidence) =>
        this.brainRouterConfidenceBand(confidence),
    });
  }

  public async hydrateCapabilities(): Promise<void> {
    if (!this.capabilityProvider) {
      return;
    }
    try {
      this.capabilities = CapabilitySnapshotSchema.parse(
        await this.capabilityProvider.inspect(),
      );
    } catch {
      this.health = "degraded";
    }
  }

  public async hydrateMemory(): Promise<void> {
    if (!this.memoryRepository) {
      return;
    }
    try {
      await this.memoryRepository.initialize();
      const health = await this.memoryRepository.checkHealth();
      this.memoryHealth = MemoryHealthSchema.parse(health);
      if (health.status !== "ok") {
        this.health = "degraded";
        return;
      }
      const snapshot = await this.memoryRepository.getSnapshot();
      this.replaceMemorySnapshot(snapshot);
      this.health = "ready";
    } catch {
      this.health = "degraded";
      this.memoryHealth = this.degradedMemoryHealth();
    }
  }

  public async hydrateTasks(): Promise<void> {
    if (!this.taskRepository) {
      return;
    }
    try {
      await this.taskRepository.initialize();
      await this.taskRepository.recoverRunningTasksAsInterrupted(
        this.now().toISOString(),
      );
      this.tasks = (await this.taskRepository.listTasks()).map((task) =>
        TaskSchema.parse(task),
      );
    } catch {
      this.health = "degraded";
      this.tasks = [];
    }
  }

  public announceReady(): void {
    this.publish(
      {
        type: "system.core.ready",
        payload: {
          coreInstanceId: this.coreInstanceId,
          startedAt: this.startedAt,
        },
      },
      undefined,
    );
    this.publishSnapshot();
  }

  public getSnapshot(): CoreSnapshot {
    return {
      protocolVersion: PROTOCOL_VERSION,
      coreInstanceId: this.coreInstanceId,
      sequenceId: this.sequenceId,
      health: this.health,
      startedAt: this.startedAt,
      updatedAt: this.now().toISOString(),
      voice: this.voiceEngine.getSnapshot(),
      ...(this.textOnlyAcceptance?.enabled
        ? {
            textOnlyAcceptance: TextOnlyAcceptanceModeSchema.parse({
              enabled: true,
              voiceInputEnabled: false,
              reasonCode: "CHAT_ANSWER_TEXT_ONLY_ACCEPTANCE",
            }),
          }
        : {}),
      messages: this.messages.map((message) => ({ ...message })),
      conversations: this.conversations.map((conversation) => ({
        ...conversation,
      })),
      ...(this.activeConversationId
        ? { activeConversationId: this.activeConversationId }
        : {}),
      ...(this.memoryHealth ? { memoryHealth: this.memoryHealth } : {}),
      memoryAlpha: this.getMemoryAlphaStatus(),
      sessionHistory: this.sessionHistory.map((entry) => ({ ...entry })),
      ...(this.capabilities ? { capabilities: this.capabilities } : {}),
      modelOperations: this.modelOperations.map((operation) => ({
        ...operation,
        ...(operation.progress ? { progress: { ...operation.progress } } : {}),
        reasons: [...operation.reasons],
        ...(operation.error ? { error: { ...operation.error } } : {}),
      })),
      ...(this.resourceDiagnostics
        ? { resourceDiagnostics: this.resourceDiagnostics }
        : {}),
      tasks: this.tasks.map((task) =>
        TaskSchema.parse({
          ...task,
          steps: task.steps.map((step) => ({ ...step })),
          events: task.events.map((event) => ({ ...event })),
        }),
      ),
    };
  }

  public async handle(rawEnvelope: unknown): Promise<CommandResult> {
    const envelope = CommandEnvelopeSchema.parse(rawEnvelope);

    switch (envelope.command.type) {
      case "agent.ping":
        this.publish(
          {
            type: "system.health",
            payload: {
              status: this.health === "degraded" ? "degraded" : "ready",
              uptimeMs: Math.max(
                0,
                this.now().getTime() - new Date(this.startedAt).getTime(),
              ),
            },
          },
          envelope.correlationId,
        );
        return this.success(envelope, {
          coreInstanceId: this.coreInstanceId,
          status: this.health === "degraded" ? "degraded" : "ready",
        });

      case "agent.getSnapshot": {
        const snapshot = this.publishSnapshot(envelope.correlationId);
        return this.success(envelope, snapshot);
      }

      case "agent.runBrainCommand": {
        return this.handleBrainCommand(envelope);
      }

      case "agent.confirmVoiceCommandCorrection": {
        return this.confirmVoiceCommandCorrection(envelope);
      }

      case "agent.listVoiceCommandAliases": {
        return this.listVoiceCommandAliases(envelope);
      }

      case "agent.deleteVoiceCommandAlias": {
        return this.deleteVoiceCommandAlias(envelope);
      }

      case "agent.confirmUserRouteAlias": {
        return this.confirmUserRouteAlias(envelope);
      }

      case "agent.listUserRouteAliases": {
        return this.listUserRouteAliases(envelope);
      }

      case "agent.deleteUserRouteAlias": {
        return this.deleteUserRouteAlias(envelope);
      }

      case "agent.listUserControlledMemories": {
        return this.listUserControlledMemories(envelope);
      }

      case "agent.deleteUserControlledMemory": {
        return this.deleteUserControlledMemory(envelope);
      }

      case "agent.cancelTask": {
        return this.cancelTask(envelope);
      }

      case "agent.approveTask": {
        return this.approveTask(envelope);
      }

      case "agent.confirmCommandRouterLocalAppLaunch": {
        return this.confirmCommandRouterLocalAppLaunch(envelope);
      }

      case "agent.clearSessionHistory": {
        this.sessionHistory.splice(0, this.sessionHistory.length);
        this.publishSnapshot(envelope.correlationId);
        return this.success(envelope, {
          sessionHistory: [],
          persisted: false,
          rawContentExposed: false,
        });
      }

      case "agent.getCapabilities": {
        if (!this.capabilityProvider) {
          return this.capabilitiesUnavailable(envelope);
        }
        try {
          this.capabilities = CapabilitySnapshotSchema.parse(
            await this.capabilityProvider.inspect(),
          );
          const snapshot = this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            capabilities: this.capabilities,
            snapshot,
          });
        } catch {
          this.health = "degraded";
          return this.failure(envelope, {
            code: "CAPABILITY_INSPECTION_FAILED",
            message: "Unable to inspect local device capabilities.",
            retryable: true,
          });
        }
      }

      case "agent.listModelManifests": {
        if (!this.modelRegistry) {
          return this.modelsUnavailable(envelope);
        }
        try {
          const manifests = await this.modelRegistry.listManifests({
            ...(envelope.command.payload.capability
              ? { capability: envelope.command.payload.capability }
              : {}),
            ...(envelope.command.payload.includeRedRisk === undefined
              ? {}
              : { includeRedRisk: envelope.command.payload.includeRedRisk }),
          });
          return this.success(envelope, {
            manifests: manifests.map((manifest) =>
              ModelManifestSchema.parse(manifest),
            ),
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_REGISTRY_FAILED",
            message: "Unable to list model manifests.",
            retryable: true,
          });
        }
      }

      case "agent.listModelCandidates": {
        if (!this.modelCandidateRegistry) {
          return this.modelsUnavailable(envelope);
        }
        try {
          const candidates = await this.modelCandidateRegistry.listCandidates({
            ...(envelope.command.payload.capability
              ? { capability: envelope.command.payload.capability }
              : {}),
            ...(envelope.command.payload.includeRedRisk === undefined
              ? {}
              : {
                  includeRedRisk: envelope.command.payload.includeRedRisk,
                }),
          });
          return this.success(envelope, {
            candidates: candidates.map((candidate) =>
              ModelCandidateSchema.parse(candidate),
            ),
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_CANDIDATES_FAILED",
            message: "Unable to list model candidates.",
            retryable: true,
          });
        }
      }

      case "agent.listModelInventory": {
        if (!this.modelLifecycleManager) {
          return this.modelsUnavailable(envelope);
        }
        try {
          const inventory = await this.modelLifecycleManager.listInventory();
          return this.success(envelope, {
            inventory: inventory.map((item) =>
              ModelInventoryItemSchema.parse(item),
            ),
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_INVENTORY_FAILED",
            message: "Unable to list local model inventory.",
            retryable: true,
          });
        }
      }

      case "agent.listModelRuntimeAdapters": {
        if (!this.modelRuntimeRegistry) {
          return this.modelsUnavailable(envelope);
        }
        try {
          const descriptors = await this.modelRuntimeRegistry.listDescriptors();
          return this.success(envelope, {
            runtimeAdapters: descriptors.map((descriptor) =>
              ModelRuntimeAdapterDescriptorSchema.parse(descriptor),
            ),
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_RUNTIME_REGISTRY_FAILED",
            message: "Unable to list model runtime adapters.",
            retryable: true,
          });
        }
      }

      case "agent.listInferenceProviders": {
        if (!this.inferenceProviderRegistry) {
          return this.modelsUnavailable(envelope);
        }
        try {
          const providers = await this.inferenceProviderRegistry.listProviders({
            ...(envelope.command.payload.capability
              ? { capability: envelope.command.payload.capability }
              : {}),
          });
          return this.success(envelope, {
            providers: providers.map((provider) =>
              InferenceProviderDescriptorSchema.parse(provider),
            ),
          });
        } catch {
          return this.failure(envelope, {
            code: "INFERENCE_PROVIDER_REGISTRY_FAILED",
            message: "Unable to list inference providers.",
            retryable: true,
          });
        }
      }

      case "agent.listInferenceProviderRequirements": {
        if (!this.inferenceProviderRegistry) {
          return this.modelsUnavailable(envelope);
        }
        try {
          const reports =
            await this.inferenceProviderRegistry.listConfigurationRequirements({
              ...(envelope.command.payload.capability
                ? { capability: envelope.command.payload.capability }
                : {}),
            });
          return this.success(envelope, {
            reports: reports.map((report) =>
              InferenceProviderConfigurationReportSchema.parse(report),
            ),
          });
        } catch {
          return this.failure(envelope, {
            code: "INFERENCE_PROVIDER_REQUIREMENTS_FAILED",
            message: "Unable to list inference provider requirements.",
            retryable: true,
          });
        }
      }

      case "agent.previewInferenceExecution": {
        if (!this.modelRegistry || !this.inferenceExecutionPlanner) {
          return this.modelsUnavailable(envelope);
        }
        try {
          const manifest = await this.modelRegistry.getManifest(
            envelope.command.payload.modelId,
          );
          if (!manifest) {
            return this.failure(envelope, {
              code: "MODEL_MANIFEST_NOT_FOUND",
              message: "Model manifest was not found.",
              retryable: false,
            });
          }
          const report = await this.inferenceExecutionPlanner.preview({
            capability: envelope.command.payload.capability,
            manifest: ModelManifestSchema.parse(manifest),
            ...(envelope.command.payload.exclusiveGpu === undefined
              ? {}
              : { exclusiveGpu: envelope.command.payload.exclusiveGpu }),
          });
          return this.success(envelope, {
            report: InferencePreflightReportSchema.parse(report),
          });
        } catch {
          return this.failure(envelope, {
            code: "INFERENCE_PREFLIGHT_FAILED",
            message: "Unable to preview inference execution.",
            retryable: true,
          });
        }
      }

      case "agent.generateEmbeddings": {
        if (!this.embeddingInferenceProvider) {
          return this.modelsUnavailable(envelope);
        }
        const request = EmbeddingGenerationRequestSchema.parse(
          envelope.command.payload,
        );
        return this.executeInferenceOperation(envelope, {
          capability: "embedding",
          modelId: request.modelId,
          execute: () => this.embeddingInferenceProvider!.embed(request),
          parseResult: (result) =>
            EmbeddingGenerationResultSchema.parse(result),
          completedReason: "Embedding inference completed.",
          failureCode: "EMBEDDING_GENERATION_FAILED",
          failureMessage: "Unable to generate embeddings.",
        });
      }

      case "agent.routeIntent": {
        if (!this.intentRoutingProvider) {
          return this.modelsUnavailable(envelope);
        }
        const request = IntentRoutingRequestSchema.parse(
          envelope.command.payload,
        );
        return this.executeInferenceOperation(envelope, {
          capability: "intent_router",
          modelId: request.modelId,
          execute: () => this.intentRoutingProvider!.route(request),
          parseResult: (result) => IntentRoutingResultSchema.parse(result),
          completedReason: "Intent routing inference completed.",
          failureCode: "INTENT_ROUTING_FAILED",
          failureMessage: "Unable to route intent.",
        });
      }

      case "agent.recognizeOcr": {
        if (!this.ocrRecognitionProvider) {
          return this.modelsUnavailable(envelope);
        }
        const request = OcrRecognitionRequestSchema.parse(
          envelope.command.payload,
        );
        return this.executeInferenceOperation(envelope, {
          capability: "ocr",
          modelId: request.modelId,
          execute: () => this.ocrRecognitionProvider!.recognize(request),
          parseResult: (result) => OcrRecognitionResultSchema.parse(result),
          completedReason: "OCR inference completed.",
          failureCode: "OCR_RECOGNITION_FAILED",
          failureMessage: "Unable to recognize OCR input.",
        });
      }

      case "agent.rerank": {
        if (!this.rerankingProvider) {
          return this.modelsUnavailable(envelope);
        }
        const request = RerankRequestSchema.parse(envelope.command.payload);
        return this.executeInferenceOperation(envelope, {
          capability: "reranker",
          modelId: request.modelId,
          execute: () => this.rerankingProvider!.rerank(request),
          parseResult: (result) => RerankResultSchema.parse(result),
          completedReason: "Reranking inference completed.",
          failureCode: "RERANKING_FAILED",
          failureMessage: "Unable to rerank documents.",
        });
      }

      case "agent.listModelOperations": {
        if (!this.modelOperationSupervisor) {
          return this.modelsUnavailable(envelope);
        }
        try {
          const operations = await this.modelOperationSupervisor.list({
            ...(envelope.command.payload.modelId === undefined
              ? {}
              : { modelId: envelope.command.payload.modelId }),
            ...(envelope.command.payload.activeOnly === undefined
              ? {}
              : { activeOnly: envelope.command.payload.activeOnly }),
            ...(envelope.command.payload.limit === undefined
              ? {}
              : { limit: envelope.command.payload.limit }),
          });
          this.replaceModelOperations(operations);
          const snapshot = this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            operations: this.modelOperations.map((operation) =>
              ModelOperationSnapshotSchema.parse(operation),
            ),
            snapshot,
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_OPERATIONS_FAILED",
            message: "Unable to list model operations.",
            retryable: true,
          });
        }
      }

      case "agent.getResourceDiagnostics": {
        if (!this.resourceScheduler) {
          return this.modelsUnavailable(envelope);
        }
        try {
          this.resourceDiagnostics = ResourceSchedulerDiagnosticsSchema.parse(
            await this.resourceScheduler.diagnostics(),
          );
          const snapshot = this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            resourceDiagnostics: this.resourceDiagnostics,
            snapshot,
          });
        } catch {
          return this.failure(envelope, {
            code: "RESOURCE_DIAGNOSTICS_FAILED",
            message: "Unable to inspect model resource diagnostics.",
            retryable: true,
          });
        }
      }

      case "agent.previewModelInstallability": {
        if (!this.modelRegistry || !this.modelInstallationPlanner) {
          return this.modelsUnavailable(envelope);
        }
        if (!this.capabilityProvider) {
          return this.capabilitiesUnavailable(envelope);
        }
        try {
          const manifest = await this.modelRegistry.getManifest(
            envelope.command.payload.modelId,
          );
          if (!manifest) {
            return this.failure(envelope, {
              code: "MODEL_MANIFEST_NOT_FOUND",
              message: "Model manifest was not found.",
              retryable: false,
            });
          }
          this.capabilities = CapabilitySnapshotSchema.parse(
            await this.capabilityProvider.inspect(),
          );
          const report = await this.modelInstallationPlanner.preview({
            manifest: ModelManifestSchema.parse(manifest),
            device: this.capabilities.device,
            ...(envelope.command.payload.allowYellowRisk === undefined
              ? {}
              : {
                  allowYellowRisk: envelope.command.payload.allowYellowRisk,
                }),
            ...(envelope.command.payload.allowUnknownRisk === undefined
              ? {}
              : {
                  allowUnknownRisk: envelope.command.payload.allowUnknownRisk,
                }),
          });
          return this.success(envelope, {
            report: ModelInstallabilityReportSchema.parse(report),
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_INSTALLABILITY_FAILED",
            message: "Unable to preview model installability.",
            retryable: true,
          });
        }
      }

      case "agent.prepareModelInstall": {
        if (!this.modelRegistry || !this.modelInstallWorkflowOrchestrator) {
          return this.modelsUnavailable(envelope);
        }
        if (!this.capabilityProvider) {
          return this.capabilitiesUnavailable(envelope);
        }
        try {
          const manifest = await this.modelRegistry.getManifest(
            envelope.command.payload.modelId,
          );
          if (!manifest) {
            return this.failure(envelope, {
              code: "MODEL_MANIFEST_NOT_FOUND",
              message: "Model manifest was not found.",
              retryable: false,
            });
          }
          this.capabilities = CapabilitySnapshotSchema.parse(
            await this.capabilityProvider.inspect(),
          );
          const operation = await this.modelInstallWorkflowOrchestrator.prepare(
            {
              manifest: ModelManifestSchema.parse(manifest),
              device: this.capabilities.device,
              ...(envelope.command.payload.allowYellowRisk === undefined
                ? {}
                : {
                    allowYellowRisk: envelope.command.payload.allowYellowRisk,
                  }),
              ...(envelope.command.payload.allowUnknownRisk === undefined
                ? {}
                : {
                    allowUnknownRisk: envelope.command.payload.allowUnknownRisk,
                  }),
              ...(envelope.command.payload.exclusiveGpu === undefined
                ? {}
                : { exclusiveGpu: envelope.command.payload.exclusiveGpu }),
            },
          );
          const parsed = ModelOperationSnapshotSchema.parse(operation);
          this.handleModelOperationUpdated(parsed, envelope.correlationId);
          return this.success(envelope, {
            operation: parsed,
            snapshot: this.getSnapshot(),
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_INSTALL_PREPARE_FAILED",
            message: "Unable to prepare model install workflow.",
            retryable: true,
          });
        }
      }

      case "agent.listPlugins": {
        if (!this.pluginRegistry) {
          return this.pluginsUnavailable(envelope);
        }
        try {
          return this.success(envelope, {
            plugins: PluginListResultSchema.parse({
              plugins: await this.pluginRegistry.listPlugins(),
              listedAt: this.now().toISOString(),
            }),
          });
        } catch {
          return this.pluginsUnavailable(envelope);
        }
      }

      case "agent.getPluginManagementStatus": {
        if (!this.pluginRegistry) {
          return this.pluginsUnavailable(envelope);
        }
        try {
          const plugins = await this.pluginRegistry.listPlugins();
          const executablePluginIds = new Set(
            this.pluginRuntime?.listExecutablePluginIds
              ? await this.pluginRuntime.listExecutablePluginIds()
              : [],
          );
          const localReadOnlyPluginIds = new Set(
            this.pluginRuntime?.listLocalReadOnlyPluginIds
              ? await this.pluginRuntime.listLocalReadOnlyPluginIds()
              : [],
          );
          const localPluginStates =
            await this.getLocalPluginEnabledStateRecords(plugins);
          return this.success(envelope, {
            plugins: PluginManagementStatusResultSchema.parse({
              plugins: plugins.map((manifest) => {
                const runtimeExecutable = executablePluginIds.has(manifest.id);
                const localReadOnlyRuntime =
                  localReadOnlyPluginIds.has(manifest.id);
                const bundledExecutable =
                  runtimeExecutable && !localReadOnlyRuntime;
                const localState = localPluginStates.get(manifest.id);
                const riskAssessment = assessPluginManagementRisk(
                  manifest,
                  bundledExecutable ||
                    (localReadOnlyRuntime &&
                      localState?.enabled === true &&
                      canEnableLocalPluginState(manifest)),
                );
                const localStateEnabled =
                  !bundledExecutable &&
                  localState?.enabled === true &&
                  canEnableLocalPluginState(manifest);
                const localReadOnlyExecutable =
                  localReadOnlyRuntime && localStateEnabled;
                const executable = bundledExecutable || localReadOnlyExecutable;
                const state = bundledExecutable
                  ? "enabled"
                  : localStateEnabled
                    ? "enabled"
                    : "disabled";
                return {
                  manifest,
                  source: bundledExecutable ? "bundled" : "local_manifest",
                  state,
                  stateSource: bundledExecutable
                    ? "bundled_runtime"
                    : localState
                      ? "local_state_store"
                      : "policy_default",
                  statePersisted:
                    !bundledExecutable && localState !== undefined,
                  ...(localState
                    ? { stateUpdatedAt: localState.updatedAt }
                    : {}),
                  stateToggleAvailable: !bundledExecutable,
                  executionMode: bundledExecutable
                    ? "bundled_runtime"
                    : localReadOnlyExecutable
                      ? "local_readonly_runtime"
                      : "list_only",
                  executable,
                  routeSelectable: executable,
                  riskAssessment,
                  reasonCodes: bundledExecutable
                    ? ["BUNDLED_READ_ONLY_RUNTIME"]
                    : [
                        ...(localReadOnlyExecutable
                          ? ["LOCAL_READ_ONLY_RUNTIME"]
                          : ["THIRD_PARTY_EXECUTION_DISABLED"]),
                        ...(localState?.enabled === true
                          ? ["LOCAL_PLUGIN_STATE_PERSISTED"]
                          : []),
                        ...(localReadOnlyExecutable
                          ? ["LOCAL_PLUGIN_STATE_ENABLED_EXECUTABLE"]
                          : localStateEnabled
                            ? ["LOCAL_PLUGIN_STATE_ENABLED_LIST_ONLY"]
                          : ["LOCAL_PLUGIN_STATE_DISABLED"]),
                        ...(localState?.enabled === true && !localStateEnabled
                          ? ["LOCAL_PLUGIN_STATE_BLOCKED_BY_POLICY"]
                          : []),
                      ],
                };
              }),
              listedAt: this.now().toISOString(),
              defaultThirdPartyExecutionState: "disabled",
              thirdPartyCodeExecuted: false,
              marketplaceAccessed: false,
              mcpAdapter: {
                status: "disabled",
                mode: "compatibility_status_only",
                defaultExecutionState: "disabled",
                externalServerStartupAllowed: false,
                externalToolExecutionAllowed: false,
                toolCallForwardingAllowed: false,
                permissionLayerRequired: true,
                credentialExposed: false,
                rawToolOutputPersisted: false,
                marketplaceAccessed: false,
                reasonCodes: [
                  "MCP_ADAPTER_STATUS_ONLY",
                  "MCP_EXTERNAL_EXECUTION_DISABLED",
                  "JARVIS_PERMISSION_LAYER_REQUIRED",
                ],
              },
            }),
          });
        } catch {
          return this.pluginsUnavailable(envelope);
        }
      }

      case "agent.setLocalPluginEnabledState": {
        if (!this.pluginRegistry || !this.localPluginStateRepository) {
          return this.failure(envelope, {
            code: "PLUGIN_STATE_STORE_UNAVAILABLE",
            message: "Local plugin state store is unavailable.",
            retryable: true,
          });
        }
        try {
          const request = LocalPluginEnabledStateSetRequestSchema.parse(
            envelope.command.payload,
          );
          const manifest = await this.pluginRegistry.getPlugin(
            request.pluginId,
          );
          const executablePluginIds = new Set(
            this.pluginRuntime?.listExecutablePluginIds
              ? await this.pluginRuntime.listExecutablePluginIds()
              : [],
          );
          const localReadOnlyPluginIds = new Set(
            this.pluginRuntime?.listLocalReadOnlyPluginIds
              ? await this.pluginRuntime.listLocalReadOnlyPluginIds()
              : [],
          );
          const localReadOnlyRuntime =
            manifest !== undefined && localReadOnlyPluginIds.has(manifest.id);
          const bundledExecutable =
            manifest !== undefined &&
            executablePluginIds.has(manifest.id) &&
            !localReadOnlyRuntime;
          if (!manifest || bundledExecutable) {
            return this.success(envelope, {
              result: LocalPluginEnabledStateSetResultSchema.parse({
                pluginId: request.pluginId,
                requestedState: request.enabled ? "enabled" : "disabled",
                appliedState: "disabled",
                status: manifest ? "blocked" : "not_found",
                persisted: false,
                executionMode: "list_only",
                executable: false,
                routeSelectable: false,
                thirdPartyCodeExecuted: false,
                installOrEnableActionExposed: false,
                stateToggleActionExposed: true,
                reasonCodes: manifest
                  ? bundledExecutable
                    ? ["BUNDLED_PLUGIN_STATE_NOT_MUTABLE"]
                    : ["LOCAL_READ_ONLY_PLUGIN_STATE_RUNTIME_CONFLICT"]
                  : ["LOCAL_PLUGIN_NOT_FOUND"],
              }),
            });
          }
          if (request.enabled && !canEnableLocalPluginState(manifest)) {
            return this.success(envelope, {
              result: LocalPluginEnabledStateSetResultSchema.parse({
                pluginId: request.pluginId,
                requestedState: "enabled",
                appliedState: "disabled",
                status: "blocked",
                persisted: false,
                executionMode: "list_only",
                executable: false,
                routeSelectable: false,
                thirdPartyCodeExecuted: false,
                installOrEnableActionExposed: false,
                stateToggleActionExposed: true,
                reasonCodes: ["LOCAL_PLUGIN_STATE_BLOCKED_BY_POLICY"],
              }),
            });
          }
          await this.ensureLocalPluginStateRepositoryInitialized();
          const record = await this.localPluginStateRepository.setState({
            pluginId: request.pluginId,
            enabled: request.enabled,
            updatedAt: this.now().toISOString(),
          });
          return this.success(envelope, {
            result: LocalPluginEnabledStateSetResultSchema.parse({
              pluginId: request.pluginId,
              requestedState: request.enabled ? "enabled" : "disabled",
              appliedState: record.enabled ? "enabled" : "disabled",
              status: "updated",
              persisted: true,
              executionMode:
                record.enabled && localReadOnlyRuntime
                  ? "local_readonly_runtime"
                  : "list_only",
              executable: record.enabled && localReadOnlyRuntime,
              routeSelectable: record.enabled && localReadOnlyRuntime,
              thirdPartyCodeExecuted: false,
              installOrEnableActionExposed: false,
              stateToggleActionExposed: true,
              reasonCodes: record.enabled
                ? [
                    "LOCAL_PLUGIN_STATE_PERSISTED",
                    ...(localReadOnlyRuntime
                      ? [
                          "LOCAL_READ_ONLY_RUNTIME",
                          "LOCAL_PLUGIN_STATE_ENABLED_EXECUTABLE",
                        ]
                      : ["LOCAL_PLUGIN_STATE_ENABLED_LIST_ONLY"]),
                  ]
                : [
                    "LOCAL_PLUGIN_STATE_PERSISTED",
                    "LOCAL_PLUGIN_STATE_DISABLED",
                  ],
            }),
          });
        } catch {
          return this.failure(envelope, {
            code: "PLUGIN_STATE_STORE_FAILED",
            message: "Local plugin state store failed closed.",
            retryable: true,
          });
        }
      }

      case "agent.getLocalPluginManifestDeveloperStatus": {
        if (!this.localPluginManifestDiagnostics) {
          return this.pluginsUnavailable(envelope);
        }
        try {
          return this.success(envelope, {
            localPluginManifestDeveloperStatus:
              LocalPluginManifestDeveloperStatusResultSchema.parse(
                await this.localPluginManifestDiagnostics.getStatus(),
              ),
          });
        } catch {
          return this.pluginsUnavailable(envelope);
        }
      }

      case "agent.invokePlugin": {
        const outcome = await this.pluginInvocationService.invoke({
          requestId: envelope.command.payload.requestId,
          pluginId: envelope.command.payload.pluginId,
          capability: envelope.command.payload.capability,
          input: envelope.command.payload.input,
          dryRun: envelope.command.payload.dryRun,
        });
        if (outcome.result) {
          return this.success(envelope, {
            result: outcome.result,
          });
        }
        if (outcome.errorClass === "input_invalid") {
          return this.failure(envelope, {
            code: "PLUGIN_INPUT_INVALID",
            message:
              "Plugin invocation blocked because the plugin request failed contract validation.",
            retryable: false,
          });
        }
        if (outcome.errorClass === "unavailable") {
          return this.pluginsUnavailable(envelope);
        }
        if (!outcome.ok) {
          return this.failure(envelope, {
            code: "PLUGIN_RUNTIME_FAILED",
            message: outcome.summary,
            retryable: true,
          });
        }
      }

      case "agent.getMemoryHealth": {
        const memoryHealth = await this.refreshMemoryHealth();
        return this.success(envelope, {
          memoryHealth,
        });
      }

      case "agent.exportMemorySnapshot": {
        if (!this.memoryRepository) {
          return this.memoryUnavailable(envelope);
        }
        try {
          const snapshot = await this.memoryRepository.exportSnapshot();
          this.health = "ready";
          return this.success(envelope, {
            snapshot,
          });
        } catch {
          this.health = "degraded";
          return this.memoryUnavailable(envelope);
        }
      }

      case "agent.importMemorySnapshot": {
        if (!this.memoryRepository) {
          return this.memoryUnavailable(envelope);
        }
        try {
          await this.memoryRepository.importSnapshot(
            envelope.command.payload.snapshot,
          );
          const snapshot = await this.memoryRepository.getSnapshot();
          this.replaceMemorySnapshot(snapshot);
          await this.refreshMemoryHealth();
          const coreSnapshot = this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            imported: true,
            snapshot: coreSnapshot,
          });
        } catch {
          this.health = "degraded";
          return this.memoryUnavailable(envelope);
        }
      }

      case "agent.getMemoryAlphaStatus": {
        return this.success(envelope, {
          memoryAlpha: this.getMemoryAlphaStatus(),
        });
      }

      case "agent.probeMemoryAlphaRecall": {
        const memoryAlpha = this.getMemoryAlphaStatus();
        const probe = await this.probeMemoryAlphaRecall({
          text: envelope.command.payload.text,
          ...(envelope.command.payload.conversationId === undefined
            ? {}
            : { conversationId: envelope.command.payload.conversationId }),
        });
        return this.success(envelope, {
          memoryAlpha,
          probe,
        });
      }

      case "agent.disableMemoryAlpha": {
        if (!this.memoryAlphaSession) {
          return this.success(envelope, {
            memoryAlpha: this.getMemoryAlphaStatus(),
          });
        }
        const memoryAlpha = MemoryAlphaStatusSchema.parse(
          await this.memoryAlphaSession.disable(),
        );
        const snapshot = this.publishSnapshot(envelope.correlationId);
        return this.success(envelope, {
          memoryAlpha,
          snapshot,
        });
      }

      case "agent.listConversations": {
        if (!this.memoryRepository) {
          return this.memoryUnavailable(envelope);
        }
        try {
          const conversations = await this.memoryRepository.listConversations(
            envelope.command.payload.limit === undefined
              ? {}
              : { limit: envelope.command.payload.limit },
          );
          const activeConversationId =
            await this.memoryRepository.getActiveConversationId();
          this.replaceConversations(conversations);
          this.activeConversationId = activeConversationId;
          this.health = "ready";
          const snapshot = this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            conversations,
            activeConversationId,
            snapshot,
          });
        } catch {
          this.health = "degraded";
          return this.memoryUnavailable(envelope);
        }
      }

      case "agent.createConversation": {
        if (!this.memoryRepository) {
          return this.memoryUnavailable(envelope);
        }
        const now = this.now().toISOString();
        try {
          const conversation = await this.memoryRepository.upsertConversation({
            id: createId("conv"),
            title: envelope.command.payload.title ?? "New conversation",
            createdAt: now,
            updatedAt: now,
          });
          await this.memoryRepository.setActiveConversationId(conversation.id);
          await this.refreshConversationState();
          this.health = "ready";
          this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            conversation,
            activeConversationId: conversation.id,
          });
        } catch {
          this.health = "degraded";
          return this.memoryUnavailable(envelope);
        }
      }

      case "agent.selectConversation": {
        if (!this.memoryRepository) {
          return this.memoryUnavailable(envelope);
        }
        try {
          await this.memoryRepository.setActiveConversationId(
            envelope.command.payload.conversationId,
          );
          await this.refreshConversationState();
          this.health = "ready";
          this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            activeConversationId: envelope.command.payload.conversationId,
          });
        } catch {
          this.health = "degraded";
          return this.memoryUnavailable(envelope);
        }
      }

      case "agent.renameConversation": {
        if (!this.memoryRepository) {
          return this.memoryUnavailable(envelope);
        }
        try {
          const conversation = await this.memoryRepository.updateConversation({
            id: envelope.command.payload.conversationId,
            title: envelope.command.payload.title,
            updatedAt: this.now().toISOString(),
          });
          await this.refreshConversationState();
          this.health = "ready";
          this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            conversation,
          });
        } catch {
          this.health = "degraded";
          return this.memoryUnavailable(envelope);
        }
      }

      case "agent.sendMessage": {
        const accepted = await this.acceptMessage({
          envelope,
          role: "user",
          text: envelope.command.payload.text,
          recall: true,
          ...(envelope.command.payload.conversationId === undefined
            ? {}
            : { conversationId: envelope.command.payload.conversationId }),
        });
        if (!accepted.ok) {
          return accepted.result;
        }
        this.publishSnapshot(envelope.correlationId);
        return this.success(envelope, {
          accepted: true,
          messageId: accepted.message.id,
          ...(accepted.memoryRecall
            ? { memoryRecall: accepted.memoryRecall }
            : {}),
        });
      }

      case "voice.setMode":
      case "voice.startPtt":
      case "voice.stopPtt":
      case "voice.cancel":
      case "voice.suspendForTts":
      case "voice.resumeAfterTts":
      case "voice.reportPermission":
        return this.handleVoiceCommand(envelope, envelope.command);
    }
  }

  public handleVoiceEvent(event: VoiceEvent): void {
    this.publish(event, this.activeVoiceCorrelationId);
    this.publishSnapshot(this.activeVoiceCorrelationId);
  }

  public handleModelOperationUpdated(
    operation: ModelOperationSnapshot,
    correlationId?: string,
  ): void {
    const parsed = ModelOperationSnapshotSchema.parse(operation);
    const index = this.modelOperations.findIndex(
      (item) => item.operationId === parsed.operationId,
    );
    if (index >= 0) {
      this.modelOperations[index] = parsed;
    } else {
      this.modelOperations.unshift(parsed);
    }
    this.publish(
      {
        type: "model.operation.updated",
        payload: parsed,
      },
      correlationId,
    );
    this.publishSnapshot(correlationId);
  }

  public configureChatAnswerProductMode(input: {
    provider?: ChatAnswerProvider;
    options?: CoreChatAnswerOptions;
  }): void {
    this.chatAnswerProvider = input.provider;
    this.chatAnswer = input.options;
    this.chatDispatchService.configure(input);
  }

  public configureCommandRouterProductMode(
    input: CoreCommandRouterProductModeOptions,
  ): void {
    const providerId = input.providerId ?? COMMAND_ROUTER_PRODUCT_MODE_PROVIDER_ID;
    const mode = input.mode ?? "production_rules";
    this.commandRouterProductMode = {
      enabled: input.enabled,
      providerId,
      mode,
      fixtureExecutionEnabled:
        mode === "fixture_only" &&
        providerId === COMMAND_ROUTER_FIXTURE_PROVIDER_ID &&
        input.fixtureExecutionEnabled === true,
    };
  }

  private async handleBrainCommand(
    envelope: CommandEnvelope,
  ): Promise<CommandResult> {
    if (envelope.command.type !== "agent.runBrainCommand") {
      return this.failure(envelope, {
        code: "BRAIN_COMMAND_INVALID",
        message: "Brain command handler received an unsupported command.",
        retryable: false,
      });
    }

    const payload = envelope.command.payload;
    const voiceCorrection =
      payload.source === "voice"
        ? await this.voiceResolutionService.resolveCommandCorrection({
            rawTranscript: payload.text,
            ...(payload.voiceInputMode === undefined
              ? {}
              : { requestedMode: payload.voiceInputMode }),
          })
        : undefined;
    if (voiceCorrection?.requiresUserSelection === true) {
      return this.handleVoiceCommandCorrectionSelectionRequired({
        envelope,
        voiceCorrection,
        ...(payload.conversationId === undefined
          ? {}
          : { conversationId: payload.conversationId }),
      });
    }
    const routingText = this.voiceResolutionService.normalizeRoutingText({
      source: payload.source,
      text: voiceCorrection?.normalizedTranscript ?? payload.text,
    });
    const aliasLearning = await this.handleUserRouteAliasLearningRequest({
      envelope,
      text: routingText,
      originalText: payload.text,
      source: payload.source,
      ...(payload.conversationId === undefined
        ? {}
        : { conversationId: payload.conversationId }),
      ...(voiceCorrection
        ? {
            voiceCorrection,
          }
        : {}),
    });
    if (aliasLearning) {
      return aliasLearning;
    }
    const preferenceMemory = await this.handleUserPreferenceMemoryRequest({
      envelope,
      text: routingText,
      originalText: payload.text,
      source: payload.source,
      ...(payload.conversationId === undefined
        ? {}
        : { conversationId: payload.conversationId }),
      ...(voiceCorrection
        ? {
            voiceCorrection,
          }
        : {}),
    });
    if (preferenceMemory) {
      return preferenceMemory;
    }
    const voiceCorrectionRouting =
      await this.createVoiceCorrectionRoutingOutcome(voiceCorrection);
    const routing =
      voiceCorrectionRouting ??
      (await this.routeBrainIntent({
        text: routingText,
        correlationId: envelope.correlationId,
        ...(payload.conversationId === undefined
          ? {}
          : { conversationId: payload.conversationId }),
      }));
    const planning = await this.planBrainFallback({
      source: payload.source,
      text: routingText,
      routing,
      ...(payload.conversationId === undefined
        ? {}
        : { conversationId: payload.conversationId }),
    });
    const accepted = await this.acceptMessage({
      envelope,
      role: "user",
      text: payload.text,
      recall:
        routing.decision.intent === "chat.answer" ||
        routing.decision.intent === "memory.search",
      ...(payload.conversationId === undefined
        ? {}
        : { conversationId: payload.conversationId }),
    });
    if (!accepted.ok) {
      return accepted.result;
    }

    const dispatched = await this.dispatchBrainIntent({
      envelope,
      text: routingText,
      decision: routing.decision,
      conversationId: accepted.message.conversationId,
      planning,
    });
    const toolProductLoop = await this.createBrainToolProductLoop({
      source: payload.source,
      decision: routing.decision,
      planning,
      dispatchStatus: dispatched.dispatchStatus,
    });
    const alphaHardening = this.createBrainAlphaHardening({
      source: payload.source,
      decision: routing.decision,
      toolProductLoop,
      dispatchStatus: dispatched.dispatchStatus,
      ...((dispatched.memoryRecall ?? accepted.memoryRecall)
        ? {
            memoryRecall: dispatched.memoryRecall ?? accepted.memoryRecall,
          }
        : {}),
    });
    const assistant = await this.acceptMessage({
      envelope,
      role: "assistant",
      text: dispatched.summary,
      conversationId: accepted.message.conversationId,
      recall: false,
    });
    if (!assistant.ok) {
      return assistant.result;
    }

    this.appendSessionHistory({
      source: payload.source,
      decision: routing.decision,
      toolProductLoop,
      dispatchStatus: dispatched.dispatchStatus,
      alphaHardening,
    });
    const brainResult = BrainCommandResultSchema.parse({
      source: payload.source,
      text: payload.text,
      ...(voiceCorrection
        ? {
            rawTranscript: voiceCorrection.rawTranscript,
            normalizedTranscript: voiceCorrection.normalizedTranscript,
            voiceInputMode: voiceCorrection.inputMode,
            correctionSource: voiceCorrection.correctionSource,
            correctionConfidence: voiceCorrection.correctionConfidence,
            correctionCandidates: voiceCorrection.correctionCandidates,
            voiceCorrection,
          }
        : {}),
      routedAt: this.now().toISOString(),
      decision: routing.decision,
      routerSelection: routing.selection,
      plannerSelection: planning.selection,
      ...(planning.result ? { plannerResult: planning.result } : {}),
      ...(dispatched.chatAnswer ? { chatAnswer: dispatched.chatAnswer } : {}),
      ...(dispatched.pluginResult
        ? { pluginResult: dispatched.pluginResult }
        : {}),
      plan: dispatched.plan,
      dispatchStatus: dispatched.dispatchStatus,
      summary: dispatched.summary,
      messageId: accepted.message.id,
      assistantMessageId: assistant.message.id,
      toolProductLoop,
      alphaHardening,
      ...((dispatched.memoryRecall ?? accepted.memoryRecall)
        ? { memoryRecall: dispatched.memoryRecall ?? accepted.memoryRecall }
        : {}),
    });
    this.publishSnapshot(envelope.correlationId);
    return this.success(envelope, { brain: brainResult });
  }

  private async handleVoiceCommandCorrectionSelectionRequired(input: {
    envelope: CommandEnvelope;
    voiceCorrection: VoiceCommandCorrection;
    conversationId?: string;
  }): Promise<CommandResult> {
    const decision = this.brainDecision({
      intent: "clarify",
      confidence: input.voiceCorrection.correctionConfidence,
      requiresApproval: false,
      slots: {},
      reason:
        "Voice command correction found multiple or low-confidence structured candidates.",
    });
    const accepted = await this.acceptMessage({
      envelope: input.envelope,
      role: "user",
      text: input.voiceCorrection.rawTranscript,
      recall: false,
      ...(input.conversationId === undefined
        ? {}
        : { conversationId: input.conversationId }),
    });
    if (!accepted.ok) {
      return accepted.result;
    }
    const candidateSummary =
      input.voiceCorrection.correctionCandidates.length === 0
        ? "No safe voice command candidate was confident enough."
        : input.voiceCorrection.correctionCandidates
            .map((candidate, index) => `${index + 1}. ${candidate.label}`)
            .join(" / ");
    const summary = `Voice command correction needs confirmation before execution: ${candidateSummary}`;
    const assistant = await this.acceptMessage({
      envelope: input.envelope,
      role: "assistant",
      text: summary,
      conversationId: accepted.message.conversationId,
      recall: false,
    });
    if (!assistant.ok) {
      return assistant.result;
    }
    const plan = this.blockFinalBrainPlan([
      {
        id: "voice-correction",
        title: "Ask user to choose a voice command correction",
        status: "blocked",
      },
    ]);
    const brainResult = BrainCommandResultSchema.parse({
      source: "voice",
      text: input.voiceCorrection.rawTranscript,
      rawTranscript: input.voiceCorrection.rawTranscript,
      normalizedTranscript: input.voiceCorrection.normalizedTranscript,
      voiceInputMode: input.voiceCorrection.inputMode,
      correctionSource: input.voiceCorrection.correctionSource,
      correctionConfidence: input.voiceCorrection.correctionConfidence,
      correctionCandidates: input.voiceCorrection.correctionCandidates,
      voiceCorrection: input.voiceCorrection,
      routedAt: this.now().toISOString(),
      decision,
      routerSelection: this.brainRouterSelection({
        selectedProviderId: "voice-command.resolver.phase1",
        status: "blocked",
        reasonCode: "CONFIDENCE_LOW",
        failureClass: "CONFIDENCE_LOW",
        confidenceBand: "low",
        usedRulesFallback: false,
      }),
      plan,
      dispatchStatus: "blocked",
      summary,
      messageId: accepted.message.id,
      assistantMessageId: assistant.message.id,
    });
    this.publishSnapshot(input.envelope.correlationId);
    return this.success(input.envelope, { brain: brainResult });
  }

  private async handleUserRouteAliasLearningRequest(input: {
    envelope: CommandEnvelope;
    text: string;
    originalText: string;
    source: "text" | "voice";
    conversationId?: string;
    voiceCorrection?: VoiceCommandCorrection;
  }): Promise<CommandResult | undefined> {
    if (!this.routeAliasMemoryService.looksLikeLearningRequest(input.text)) {
      return undefined;
    }

    const proposal = this.routeAliasMemoryService.createLearningProposal(
      input.text,
    );
    const accepted = await this.acceptMessage({
      envelope: input.envelope,
      role: "user",
      text: input.originalText,
      recall: false,
      ...(input.conversationId === undefined
        ? {}
        : { conversationId: input.conversationId }),
    });
    if (!accepted.ok) {
      return accepted.result;
    }

    const decision = this.brainDecision({
      intent: proposal ? "clarify" : "blocked",
      confidence: proposal ? 0.84 : 0.99,
      requiresApproval: proposal !== undefined,
      slots: proposal
        ? {
            label: proposal.label,
            targetHostname: proposal.targetHostname,
          }
        : {},
      reason: proposal
        ? "Detected a user route alias learning request; explicit confirmation is required before persistence."
        : "Detected a user route alias learning request, but the URL did not pass safe HTTPS alias policy.",
    });
    if (proposal) {
      this.routeAliasMemoryService.trackLearningProposal(proposal);
    }
    const summary = proposal
      ? `Jarvis-K can remember route alias "${proposal.label}" for ${proposal.targetHostname} after confirmation. No browser action was attempted.`
      : "Jarvis-K did not save this route alias because the URL policy requires HTTPS with no credentials, hash, or sensitive query parameters.";
    const assistant = await this.acceptMessage({
      envelope: input.envelope,
      role: "assistant",
      text: summary,
      conversationId: accepted.message.conversationId,
      recall: false,
    });
    if (!assistant.ok) {
      return assistant.result;
    }
    const plan: BrainPlanStep[] = [
      {
        id: "intake",
        title: "Receive route alias learning request",
        status: "completed",
      },
      {
        id: "url-policy",
        title: "Validate safe HTTPS URL policy",
        status: proposal ? "completed" : "blocked",
      },
      {
        id: "confirmation",
        title: "Wait for explicit UI confirmation before saving",
        status: proposal ? "pending" : "blocked",
      },
    ];
    const brainResult = BrainCommandResultSchema.parse({
      source: input.source,
      text: input.originalText,
      ...(input.voiceCorrection
        ? {
            rawTranscript: input.voiceCorrection.rawTranscript,
            normalizedTranscript: input.voiceCorrection.normalizedTranscript,
            voiceInputMode: input.voiceCorrection.inputMode,
            correctionSource: input.voiceCorrection.correctionSource,
            correctionConfidence: input.voiceCorrection.correctionConfidence,
            correctionCandidates: input.voiceCorrection.correctionCandidates,
            voiceCorrection: input.voiceCorrection,
          }
        : {}),
      routedAt: this.now().toISOString(),
      decision,
      routerSelection: this.brainRouterSelection({
        selectedProviderId: "user-route-alias.learning.rules",
        status: proposal ? "accepted" : "blocked",
        reasonCode: proposal ? "PROVIDER_ACCEPTED" : "UNSAFE_OR_BLOCKED",
        failureClass: proposal ? "none" : "UNSAFE_OR_BLOCKED",
        confidenceBand: proposal ? "accepted" : "none",
        usedRulesFallback: true,
      }),
      plan,
      dispatchStatus: proposal ? "needs_approval" : "blocked",
      summary,
      messageId: accepted.message.id,
      assistantMessageId: assistant.message.id,
      ...(proposal ? { userRouteAliasProposal: proposal } : {}),
    });
    this.publishSnapshot(input.envelope.correlationId);
    return this.success(input.envelope, { brain: brainResult });
  }

  private async handleUserPreferenceMemoryRequest(input: {
    envelope: CommandEnvelope;
    text: string;
    originalText: string;
    source: "text" | "voice";
    conversationId?: string;
    voiceCorrection?: VoiceCommandCorrection;
  }): Promise<CommandResult | undefined> {
    const resolvedPreference = this.userPreferenceMemoryService.resolve(
      input.text,
    );
    if (!resolvedPreference) {
      return undefined;
    }

    const accepted = await this.acceptMessage({
      envelope: input.envelope,
      role: "user",
      text: input.originalText,
      recall: false,
      ...(input.conversationId === undefined
        ? {}
        : { conversationId: input.conversationId }),
    });
    if (!accepted.ok) {
      return accepted.result;
    }

    const preferenceMemory =
      await this.userPreferenceMemoryService.persistResolved(
        resolvedPreference,
      );
    const canPersist = preferenceMemory.canPersist;

    const decision = this.brainDecision({
      intent: "memory.preference.set",
      confidence: 0.94,
      requiresApproval: false,
      slots: {
        key: resolvedPreference.key,
        value: resolvedPreference.value,
        appliesTo: "ui_projection_only",
      },
      reason:
        "Detected an explicit user preference memory request through deterministic rules.",
    });
    const summary = canPersist
      ? `Preference memory saved: ${resolvedPreference.summary}. This is visible and deletable in Memory, and is projected to Chat Answer as sanitized policy.`
      : "Preference memory was recognized, but storage is unavailable. No automatic behavior change was made.";
    const assistant = await this.acceptMessage({
      envelope: input.envelope,
      role: "assistant",
      text: summary,
      conversationId: accepted.message.conversationId,
      recall: false,
    });
    if (!assistant.ok) {
      return assistant.result;
    }
    const plan: BrainPlanStep[] = [
      {
        id: "intake",
        title: "Receive user preference memory request",
        status: "completed",
      },
      {
        id: "persist",
        title: "Persist provider-neutral preference memory",
        status: canPersist ? "completed" : "blocked",
      },
      {
        id: "projection",
        title: "Project memory for user-controlled viewing and deletion",
        status: canPersist ? "completed" : "blocked",
      },
    ];
    const brainResult = BrainCommandResultSchema.parse({
      source: input.source,
      text: input.originalText,
      ...(input.voiceCorrection
        ? {
            rawTranscript: input.voiceCorrection.rawTranscript,
            normalizedTranscript: input.voiceCorrection.normalizedTranscript,
            voiceInputMode: input.voiceCorrection.inputMode,
            correctionSource: input.voiceCorrection.correctionSource,
            correctionConfidence: input.voiceCorrection.correctionConfidence,
            correctionCandidates: input.voiceCorrection.correctionCandidates,
            voiceCorrection: input.voiceCorrection,
          }
        : {}),
      routedAt: this.now().toISOString(),
      decision,
      routerSelection: this.brainRouterSelection({
        selectedProviderId: "user-preference-memory.rules",
        status: canPersist ? "accepted" : "blocked",
        reasonCode: canPersist ? "PROVIDER_ACCEPTED" : "PROVIDER_UNAVAILABLE",
        failureClass: canPersist ? "none" : "PROVIDER_UNAVAILABLE",
        confidenceBand: canPersist ? "accepted" : "none",
        usedRulesFallback: true,
      }),
      plan,
      dispatchStatus: canPersist ? "completed" : "blocked",
      summary,
      messageId: accepted.message.id,
      assistantMessageId: assistant.message.id,
    });
    this.publishSnapshot(input.envelope.correlationId);
    return this.success(input.envelope, { brain: brainResult });
  }

  private async createVoiceCorrectionRoutingOutcome(
    voiceCorrection: VoiceCommandCorrection | undefined,
  ): Promise<CoreBrainRoutingOutcome | undefined> {
    if (
      !voiceCorrection ||
      voiceCorrection.inputMode !== "command" ||
      voiceCorrection.requiresUserSelection
    ) {
      return undefined;
    }
    const candidate = voiceCorrection.correctionCandidates[0];
    if (!candidate) {
      return undefined;
    }
    const candidateDecision =
      this.voiceResolutionService.decisionFromCandidate(candidate);
    return {
      decision:
        (await this.resolveUserRouteAliasBrowserDecision(candidateDecision)) ??
        candidateDecision,
      selection: this.brainRouterSelection({
        selectedProviderId: "voice-command.resolver.phase1",
        fallbackProviderId: "brain.rules",
        status: "accepted",
        reasonCode: "PROVIDER_ACCEPTED",
        failureClass: "none",
        confidenceBand: this.brainRouterConfidenceBand(candidate.confidence),
        usedRulesFallback: false,
      }),
    };
  }

  private async resolveUserRouteAliasBrowserDecision(
    decision: BrainRouterDecision,
  ): Promise<BrainRouterDecision | undefined> {
    if (decision.intent !== "browser.open") {
      return undefined;
    }
    const target = String(decision.slots.target ?? "").trim();
    const resolution =
      await this.routeAliasMemoryService.resolveRouteAliasByTarget(target);
    if (!resolution) {
      return undefined;
    }
    const { alias, safeUrl } = resolution;
    if (!safeUrl) {
      return this.brainDecision({
        intent: "blocked",
        confidence: Math.max(decision.confidence, 0.99),
        requiresApproval: false,
        slots: {
          routeAliasId: alias.id,
          routeAliasLabel: alias.label,
        },
        reason:
          "Matched a user-confirmed route alias through voice correction, but its persisted URL failed safe URL policy.",
      });
    }
    return this.brainDecision({
      intent: "browser.open",
      confidence: Math.max(decision.confidence, 0.94),
      requiresApproval: false,
      slots: {
        ...decision.slots,
        target: safeUrl.href,
        routeAliasId: alias.id,
        routeAliasLabel: alias.label,
        targetHostname: safeUrl.hostname,
      },
      reason:
        "Voice command correction selected a user-confirmed route alias through deterministic rules.",
    });
  }

  private async confirmVoiceCommandCorrection(
    envelope: CommandEnvelope,
  ): Promise<CommandResult> {
    if (envelope.command.type !== "agent.confirmVoiceCommandCorrection") {
      return this.failure(envelope, {
        code: "VOICE_CORRECTION_INVALID",
        message: "Voice correction confirmation received an invalid command.",
        retryable: false,
      });
    }
    const result = await this.routeAliasMemoryService.saveVoiceAlias({
      rawAlias: envelope.command.payload.rawAlias,
      normalizedTranscript: envelope.command.payload.normalizedTranscript,
      intent: envelope.command.payload.intent,
      slots: envelope.command.payload.slots,
    });
    if (result.status === "store_unavailable") {
      return this.failure(envelope, {
        code: "VOICE_ALIAS_STORE_UNAVAILABLE",
        message: "Voice command alias storage is not configured.",
        retryable: true,
      });
    }
    return this.success(envelope, {
      alias: result.alias,
      persisted: true,
      rawAudioPersisted: false,
      directActionAttempted: false,
    });
  }

  private async listVoiceCommandAliases(
    envelope: CommandEnvelope,
  ): Promise<CommandResult> {
    if (envelope.command.type !== "agent.listVoiceCommandAliases") {
      return this.failure(envelope, {
        code: "VOICE_ALIAS_COMMAND_INVALID",
        message: "Voice alias listing received an invalid command.",
        retryable: false,
      });
    }
    const result = await this.routeAliasMemoryService.listVoiceAliases();
    return this.success(envelope, {
      aliases: result.aliases,
      persisted: result.persisted,
      rawAudioPersisted: false,
      directActionAttempted: false,
    });
  }

  private async deleteVoiceCommandAlias(
    envelope: CommandEnvelope,
  ): Promise<CommandResult> {
    if (envelope.command.type !== "agent.deleteVoiceCommandAlias") {
      return this.failure(envelope, {
        code: "VOICE_ALIAS_COMMAND_INVALID",
        message: "Voice alias deletion received an invalid command.",
        retryable: false,
      });
    }
    const result = await this.routeAliasMemoryService.deleteVoiceAlias(
      envelope.command.payload.aliasId,
    );
    return this.success(envelope, {
      deleted: result.deleted,
      persisted: result.persisted,
      rawAudioPersisted: false,
      directActionAttempted: false,
    });
  }

  private async confirmUserRouteAlias(
    envelope: CommandEnvelope,
  ): Promise<CommandResult> {
    if (envelope.command.type !== "agent.confirmUserRouteAlias") {
      return this.failure(envelope, {
        code: "USER_ROUTE_ALIAS_COMMAND_INVALID",
        message: "Route alias confirmation received an invalid command.",
        retryable: false,
      });
    }
    const result = await this.routeAliasMemoryService.confirmRouteAlias(
      envelope.command.payload.proposalId,
    );
    if (result.status === "store_unavailable") {
      return this.failure(envelope, {
        code: "USER_ROUTE_ALIAS_STORE_UNAVAILABLE",
        message: "User route alias storage is not configured.",
        retryable: true,
      });
    }
    if (result.status === "proposal_expired") {
      return this.failure(envelope, {
        code: "USER_ROUTE_ALIAS_PROPOSAL_EXPIRED",
        message: "The route alias proposal is no longer pending.",
        retryable: false,
      });
    }
    if (result.status === "url_blocked") {
      return this.failure(envelope, {
        code: "USER_ROUTE_ALIAS_URL_BLOCKED",
        message: "The route alias URL no longer passes URL policy.",
        retryable: false,
      });
    }
    this.publishSnapshot(envelope.correlationId);
    return this.success(envelope, {
      alias: result.alias,
      persisted: true,
      directActionAttempted: false,
      rawCredentialPersisted: false,
    });
  }

  private async listUserRouteAliases(
    envelope: CommandEnvelope,
  ): Promise<CommandResult> {
    if (envelope.command.type !== "agent.listUserRouteAliases") {
      return this.failure(envelope, {
        code: "USER_ROUTE_ALIAS_COMMAND_INVALID",
        message: "Route alias listing received an invalid command.",
        retryable: false,
      });
    }
    const result = await this.routeAliasMemoryService.listRouteAliases();
    return this.success(envelope, {
      aliases: result.aliases,
      persisted: result.persisted,
      directActionAttempted: false,
    });
  }

  private async deleteUserRouteAlias(
    envelope: CommandEnvelope,
  ): Promise<CommandResult> {
    if (envelope.command.type !== "agent.deleteUserRouteAlias") {
      return this.failure(envelope, {
        code: "USER_ROUTE_ALIAS_COMMAND_INVALID",
        message: "Route alias deletion received an invalid command.",
        retryable: false,
      });
    }
    const result = await this.routeAliasMemoryService.deleteRouteAlias(
      envelope.command.payload.aliasId,
    );
    return this.success(envelope, {
      deleted: result.deleted,
      persisted: result.persisted,
      directActionAttempted: false,
    });
  }

  private async listUserControlledMemories(
    envelope: CommandEnvelope,
  ): Promise<CommandResult> {
    if (envelope.command.type !== "agent.listUserControlledMemories") {
      return this.failure(envelope, {
        code: "USER_CONTROLLED_MEMORY_COMMAND_INVALID",
        message: "User-controlled memory listing received an invalid command.",
        retryable: false,
      });
    }

    const memories: UserControlledMemoryRecord[] = [];
    let persisted = false;

    const aliasRecords =
      await this.routeAliasMemoryService.listUserControlledRecords({
        summarizeSlots: (slots) => this.summarizeMemorySlots(slots),
      });
    persisted = persisted || aliasRecords.persisted;
    memories.push(...aliasRecords.memories);

    const preferenceRecords =
      await this.userPreferenceMemoryService.listUserControlledRecords();
    persisted = persisted || preferenceRecords.persisted;
    memories.push(...preferenceRecords.memories);

    memories.sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );

    return this.success(envelope, {
      memories,
      persisted,
      rawContentExposed: false,
      directActionAttempted: false,
      vectorRetrievalUsed: false,
    });
  }

  private async deleteUserControlledMemory(
    envelope: CommandEnvelope,
  ): Promise<CommandResult> {
    if (envelope.command.type !== "agent.deleteUserControlledMemory") {
      return this.failure(envelope, {
        code: "USER_CONTROLLED_MEMORY_COMMAND_INVALID",
        message: "User-controlled memory deletion received an invalid command.",
        retryable: false,
      });
    }

    const { kind, sourceId } = envelope.command.payload;
    if (kind === "voice_command_alias") {
      const deletion = await this.routeAliasMemoryService.deleteVoiceAlias(
        sourceId,
      );
      return this.success(envelope, {
        deleted: deletion.deleted,
        persisted: deletion.persisted,
        rawContentExposed: false,
        directActionAttempted: false,
        vectorRetrievalUsed: false,
      });
    }

    if (kind === "preference") {
      const deletion = await this.userPreferenceMemoryService.delete(sourceId);
      return this.success(envelope, {
        deleted: deletion.deleted,
        persisted: deletion.persisted,
        rawContentExposed: false,
        directActionAttempted: false,
        vectorRetrievalUsed: false,
      });
    }

    const deletion = await this.routeAliasMemoryService.deleteRouteAlias(
      sourceId,
    );
    return this.success(envelope, {
      deleted: deletion.deleted,
      persisted: deletion.persisted,
      rawContentExposed: false,
      directActionAttempted: false,
      vectorRetrievalUsed: false,
    });
  }

  private summarizeMemorySlots(slots: Record<string, unknown>): string {
    const entries = Object.entries(slots)
      .filter(([, value]) => value !== undefined && value !== null)
      .slice(0, 3);
    if (entries.length === 0) {
      return "no slots";
    }
    return entries
      .map(([key, value]) => {
        const rendered =
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : Array.isArray(value)
              ? `${value.length} items`
              : typeof value === "boolean"
                ? String(value)
                : "structured";
        return `${key}:${rendered}`.slice(0, 80);
      })
      .join(", ");
  }

  private async confirmCommandRouterLocalAppLaunch(
    envelope: CommandEnvelope,
  ): Promise<CommandResult> {
    if (envelope.command.type !== "agent.confirmCommandRouterLocalAppLaunch") {
      return this.failure(envelope, {
        code: "BRAIN_COMMAND_INVALID",
        message:
          "Local app launch confirmation received an unsupported command.",
        retryable: false,
      });
    }

    const target = this.commandRouterRealLocalAppLaunchLabel(
      envelope.command.payload.target,
    );
    if (this.commandRouterProductMode?.enabled !== true) {
      return this.success(envelope, {
        launch: CommandRouterLocalAppLaunchResultSchema.parse({
          status: "blocked",
          target,
          label: target,
          reasonCode: "COMMAND_ROUTER_PRODUCT_MODE_DISABLED",
          confirmationRequired: true,
          confirmationGranted: true,
          directActionAttempted: false,
          persisted: false,
          rawDiagnosticsExposed: false,
        }),
      });
    }

    if (
      !this.isCommandRouterRealLocalAppLaunchAllowlisted(
        envelope.command.payload.target,
      )
    ) {
      return this.success(envelope, {
        launch: CommandRouterLocalAppLaunchResultSchema.parse({
          status: "blocked",
          target,
          label: target,
          reasonCode: "TARGET_NOT_ALLOWLISTED",
          confirmationRequired: true,
          confirmationGranted: true,
          directActionAttempted: false,
          persisted: false,
          rawDiagnosticsExposed: false,
        }),
      });
    }

    if (!this.brainActionExecutor) {
      return this.success(envelope, {
        launch: CommandRouterLocalAppLaunchResultSchema.parse({
          status: "blocked",
          target,
          label: target,
          reasonCode: "BRAIN_ACTIONS_DISABLED",
          confirmationRequired: true,
          confirmationGranted: true,
          directActionAttempted: false,
          persisted: false,
          rawDiagnosticsExposed: false,
        }),
      });
    }

    const actionResult = await this.brainActionExecutor.openLocalApp({
      target,
    });
    const reasonCode =
      actionResult.reasonCode === "TARGET_INVALID"
        ? "TARGET_NOT_ALLOWLISTED"
        : actionResult.reasonCode;
    const launch = CommandRouterLocalAppLaunchResultSchema.parse({
      status: actionResult.status,
      target,
      label: target,
      reasonCode,
      confirmationRequired: true,
      confirmationGranted: true,
      directActionAttempted: actionResult.status === "completed",
      persisted: false,
      rawDiagnosticsExposed: false,
    });
    this.publishSnapshot(envelope.correlationId);
    return this.success(envelope, { launch });
  }

  private async routeBrainIntent(input: {
    text: string;
    conversationId?: string;
    correlationId?: string;
  }): Promise<CoreBrainRoutingOutcome> {
    return this.commandRoutingService.route(input);
  }

  private async routeUserRouteAliasByRules(
    text: string,
  ): Promise<CoreBrainRoutingOutcome | undefined> {
    const openTarget = this.extractOpenTarget(text);
    if (!openTarget) {
      return undefined;
    }
    const resolution =
      await this.routeAliasMemoryService.resolveRouteAliasFromOpenTarget(
        openTarget,
      );
    if (!resolution) {
      return undefined;
    }
    const { alias: match, safeUrl } = resolution;
    if (!safeUrl) {
      return {
        decision: this.brainDecision({
          intent: "blocked",
          confidence: 0.99,
          requiresApproval: false,
          slots: { routeAliasId: match.id, label: match.label },
          reason:
            "Matched a user route alias, but its persisted URL failed safe URL policy.",
        }),
        selection: this.brainRouterSelection({
          selectedProviderId: "user-route-alias.rules",
          status: "blocked",
          reasonCode: "UNSAFE_OR_BLOCKED",
          failureClass: "UNSAFE_OR_BLOCKED",
          confidenceBand: "none",
          usedRulesFallback: true,
        }),
      };
    }
    return {
      decision: this.brainDecision({
        intent: "browser.open",
        confidence: 0.94,
        requiresApproval: false,
        slots: {
          target: safeUrl.href,
          routeAliasId: match.id,
          routeAliasLabel: match.label,
          targetHostname: safeUrl.hostname,
        },
        reason:
          "Matched a user-confirmed route alias through deterministic rules.",
      }),
      selection: this.brainRouterSelection({
        selectedProviderId: "user-route-alias.rules",
        fallbackProviderId: "brain.rules",
        status: "accepted",
        reasonCode: "PROVIDER_ACCEPTED",
        failureClass: "none",
        confidenceBand: "accepted",
        usedRulesFallback: true,
      }),
    };
  }

  private async routeVoiceCommandAliasByRules(
    text: string,
  ): Promise<CoreBrainRoutingOutcome | undefined> {
    const alias = await this.routeAliasMemoryService.resolveVoiceAliasByText(
      text,
    );
    if (!alias) {
      return undefined;
    }
    const aliasDecision = this.brainDecision({
      intent: alias.intent,
      confidence: 0.96,
      requiresApproval: false,
      slots: alias.slots,
      reason:
        "Matched a user-confirmed voice command alias through deterministic rules.",
    });
    const decision =
      (await this.resolveUserRouteAliasBrowserDecision(aliasDecision)) ??
      aliasDecision;
    return {
      decision,
      selection: this.brainRouterSelection({
        selectedProviderId: "voice-command-alias.rules",
        fallbackProviderId: "brain.rules",
        status: decision.intent === "blocked" ? "blocked" : "accepted",
        reasonCode:
          decision.intent === "blocked"
            ? "UNSAFE_OR_BLOCKED"
            : "PROVIDER_ACCEPTED",
        failureClass:
          decision.intent === "blocked" ? "UNSAFE_OR_BLOCKED" : "none",
        confidenceBand: this.brainRouterConfidenceBand(decision.confidence),
        usedRulesFallback: true,
      }),
    };
  }

  private async routeBrainIntentWithProvider(input: {
    text: string;
    conversationId?: string;
    correlationId?: string;
  }): Promise<
    | {
        decision?: BrainRouterDecision;
        selection: BrainRouterSelectionReport;
      }
    | undefined
  > {
    const options = this.brainRouter;
    const modelId = options?.modelId.trim();
    if (
      options?.enabled !== true ||
      modelId === undefined ||
      modelId.length === 0 ||
      !this.intentRoutingProvider
    ) {
      return undefined;
    }

    let operation: ModelOperationSnapshot | undefined;
    try {
      if (this.modelRegistry && this.inferenceExecutionPlanner) {
        operation = await this.startModelOperation(
          {
            modelId,
            capability: "intent_router",
            phase: "prechecking",
          },
          input.correlationId,
        );
        const manifest = await this.modelRegistry.getManifest(modelId);
        if (!manifest) {
          await this.updateModelOperation(
            operation,
            {
              phase: "blocked",
              reasons: ["Brain fast router model manifest was not found."],
            },
            input.correlationId,
          );
          return {
            selection: this.brainRouterSelection({
              selectedProviderId: this.brainRouterProviderId(options),
              fallbackProviderId: "brain.rules",
              status: "fallback",
              reasonCode: "PROVIDER_PREFLIGHT_BLOCKED",
              failureClass: "PROVIDER_PREFLIGHT_BLOCKED",
              confidenceBand: "none",
              usedRulesFallback: true,
            }),
          };
        }
        const report = await this.inferenceExecutionPlanner.preview({
          capability: "intent_router",
          manifest: ModelManifestSchema.parse(manifest),
        });
        if (!report.allowed) {
          await this.updateModelOperation(
            operation,
            {
              phase: "blocked",
              reasons: report.reasons,
            },
            input.correlationId,
          );
          return {
            selection: this.brainRouterSelection({
              selectedProviderId: this.brainRouterProviderId(options),
              fallbackProviderId: "brain.rules",
              status: "fallback",
              reasonCode: "PROVIDER_PREFLIGHT_BLOCKED",
              failureClass: "PROVIDER_PREFLIGHT_BLOCKED",
              confidenceBand: "none",
              usedRulesFallback: true,
            }),
          };
        }
      }

      operation = await this.updateModelOperation(
        operation,
        {
          phase: "executing",
          reasons: ["Brain fast router preflight passed."],
        },
        input.correlationId,
      );
      const rawResult = await this.intentRoutingProvider.route({
        modelId,
        utterance: input.text,
        context: {
          ...(options.locale === undefined ? {} : { locale: options.locale }),
          ...((input.conversationId ?? this.activeConversationId)
            ? {
                activeConversationId:
                  input.conversationId ?? this.activeConversationId,
              }
            : {}),
          allowedIntents: [
            ...(options.allowedIntents ?? BRAIN_ROUTER_ALLOWED_INTENTS),
          ],
        },
      });
      const parsedResult = IntentRoutingResultSchema.safeParse(rawResult);
      if (!parsedResult.success) {
        await this.updateModelOperation(
          operation,
          {
            phase: "failed",
            reasons: ["Brain fast router returned an invalid result."],
          },
          input.correlationId,
        );
        return {
          selection: this.brainRouterSelection({
            selectedProviderId: this.brainRouterProviderId(options),
            fallbackProviderId: "brain.rules",
            status: "fallback",
            reasonCode: "RESULT_INVALID",
            failureClass: "PROVIDER_RESULT_INVALID",
            confidenceBand: "none",
            usedRulesFallback: true,
          }),
        };
      }
      const result = parsedResult.data;
      await this.updateModelOperation(
        operation,
        {
          phase: "completed",
          reasons: ["Brain fast router completed."],
        },
        input.correlationId,
      );

      const candidate = [...result.candidates].sort(
        (left, right) => right.confidence - left.confidence,
      )[0];
      if (!candidate) {
        return {
          selection: this.brainRouterSelection({
            selectedProviderId: this.brainRouterProviderId(options),
            fallbackProviderId: "brain.rules",
            status: "fallback",
            reasonCode: "CANDIDATE_MISSING",
            failureClass: "CANDIDATE_MISSING",
            confidenceBand: "none",
            usedRulesFallback: true,
          }),
        };
      }
      const intent = this.mapBrainRouterIntent(candidate.intent);
      if (intent === undefined) {
        return {
          selection: this.brainRouterSelection({
            selectedProviderId: this.brainRouterProviderId(options),
            fallbackProviderId: "brain.rules",
            status: "fallback",
            reasonCode: "INTENT_UNSUPPORTED",
            failureClass: "INTENT_UNSUPPORTED",
            confidenceBand: this.brainRouterConfidenceBand(
              candidate.confidence,
            ),
            usedRulesFallback: true,
          }),
        };
      }
      if (
        !(options.allowedIntents ?? BRAIN_ROUTER_ALLOWED_INTENTS).includes(
          intent,
        )
      ) {
        return {
          selection: this.brainRouterSelection({
            selectedProviderId: this.brainRouterProviderId(options),
            fallbackProviderId: "brain.rules",
            status: "fallback",
            reasonCode: "ALLOWLIST_MISMATCH",
            failureClass: "ALLOWLIST_MISMATCH",
            confidenceBand: this.brainRouterConfidenceBand(
              candidate.confidence,
            ),
            usedRulesFallback: true,
          }),
        };
      }
      const minConfidence =
        options.minConfidence ?? DEFAULT_BRAIN_ROUTER_MIN_CONFIDENCE;
      if (candidate.confidence < minConfidence) {
        return {
          selection: this.brainRouterSelection({
            selectedProviderId: this.brainRouterProviderId(options),
            fallbackProviderId: "brain.rules",
            status: "fallback",
            reasonCode: "CONFIDENCE_LOW",
            failureClass: "CONFIDENCE_LOW",
            confidenceBand: "low",
            usedRulesFallback: true,
          }),
        };
      }
      const decision = this.brainDecision({
        intent,
        confidence: candidate.confidence,
        requiresApproval: false,
        slots: this.normalizeBrainRouterSlots(
          intent,
          candidate.slots,
          input.text,
        ),
        reason:
          candidate.reasons[0] ??
          `Fast router selected ${intent} with model ${result.modelId}.`,
      });
      return {
        decision,
        selection: this.brainRouterSelection({
          selectedProviderId: this.brainRouterProviderId(options),
          status: intent === "blocked" ? "blocked" : "accepted",
          reasonCode:
            intent === "blocked" ? "UNSAFE_OR_BLOCKED" : "PROVIDER_ACCEPTED",
          failureClass: intent === "blocked" ? "UNSAFE_OR_BLOCKED" : "none",
          confidenceBand: "accepted",
          usedRulesFallback: false,
        }),
      };
    } catch {
      await this.updateModelOperation(
        operation,
        {
          phase: "failed",
          reasons: ["Brain fast router failed; falling back to rules."],
          error: {
            code: "BRAIN_FAST_ROUTER_FAILED",
            message: "Brain fast router failed; falling back to rules.",
            retryable: true,
          },
        },
        input.correlationId,
      );
      return {
        selection: this.brainRouterSelection({
          selectedProviderId: this.brainRouterProviderId(options),
          fallbackProviderId: "brain.rules",
          status: "fallback",
          reasonCode: "PROVIDER_FAILED",
          failureClass: "PROVIDER_EXECUTION_FAILED",
          confidenceBand: "none",
          usedRulesFallback: true,
        }),
      };
    }
  }

  private routeBrainIntentByRules(text: string): BrainRouterDecision {
    const normalized = text.trim().toLowerCase();
    const forcedChatAnswerUtterances =
      this.chatDispatchService
        .forcedChatAnswerUtterances()
        .map((value) => value.trim().toLowerCase());
    if (forcedChatAnswerUtterances.includes(normalized)) {
      return this.brainDecision({
        intent: "chat.answer",
        confidence: 0.99,
        requiresApproval: false,
        slots: {},
        reason:
          "Matched an explicitly approved Chat Answer acceptance utterance.",
      });
    }
    const openTarget = this.extractOpenTarget(text);
    if (
      this.textOnlyAcceptance?.enabled === true &&
      /^(?:blocked fixture|text-only blocked)$/u.test(normalized)
    ) {
      return this.brainDecision({
        intent: "blocked",
        confidence: 0.99,
        requiresApproval: false,
        slots: {},
        reason:
          "Matched deterministic text-only Chat Answer blocked fixture route.",
      });
    }
    if (
      /记得|之前|前几天|昨天|回忆|记忆|memory|recall|remember|what did i/u.test(
        normalized,
      )
    ) {
      return this.brainDecision({
        intent: "memory.search",
        confidence: 0.86,
        requiresApproval: false,
        slots: {},
        reason: "Matched a Memory recall request.",
      });
    }
    if (
      /状态|健康|诊断|检查|observability|status|health|diagnostic/u.test(
        normalized,
      )
    ) {
      return this.brainDecision({
        intent: "observability.status",
        confidence: 0.84,
        requiresApproval: false,
        slots: {},
        reason: "Matched a runtime status or diagnostic request.",
      });
    }
    if (/模型|provider|runtime|gpu|model/u.test(normalized)) {
      return this.brainDecision({
        intent: "model.status",
        confidence: 0.82,
        requiresApproval: false,
        slots: {},
        reason: "Matched a model governance status request.",
      });
    }
    const filesystemSearchQuery = this.extractFilesystemSearchQuery(text);
    if (filesystemSearchQuery !== undefined) {
      return this.brainDecision({
        intent: "filesystem.search",
        confidence: 0.87,
        requiresApproval: false,
        slots: { query: filesystemSearchQuery },
        reason:
          "Matched a bounded filesystem search request; dispatch is observe-only.",
      });
    }
    const pluginInvocation = this.extractPluginInvocation(text);
    if (pluginInvocation !== undefined) {
      return this.brainDecision({
        intent: "plugin.invoke",
        confidence: 0.89,
        requiresApproval: false,
        slots: pluginInvocation,
        reason:
          "Matched a read-only Plugin SDK Alpha sample request; dispatch must pass plugin runtime output validation.",
      });
    }
    const notepadWriteText = this.extractNotepadWriteText(text);
    if (notepadWriteText !== undefined) {
      return this.brainDecision({
        intent: "notepad.write_text",
        confidence: 0.9,
        requiresApproval: false,
        slots: {
          target: "notepad",
          text: notepadWriteText,
        },
        reason:
          "Matched a bounded Notepad text-write request; dispatch must pass the Windows executor verifier.",
      });
    }
    const windowControl = this.extractKnownAppWindowControl(text);
    if (windowControl !== undefined) {
      return this.brainDecision({
        intent: `window.${windowControl.action}` as BrainIntent,
        confidence: 0.88,
        requiresApproval: false,
        slots: {
          target: windowControl.target,
          action: windowControl.action,
        },
        reason:
          "Matched a fixed known-app window-control request; dispatch must pass the Windows executor verifier.",
      });
    }
    if (openTarget) {
      if (this.looksLikeLocalApp(openTarget)) {
        return this.brainDecision({
          intent: "localApp.open",
          confidence: 0.9,
          requiresApproval: false,
          slots: { target: openTarget },
          reason:
            "Matched an application-open request; dispatch must pass the local app allowlist.",
        });
      }
      return this.brainDecision({
        intent: "browser.open",
        confidence: 0.88,
        requiresApproval: false,
        slots: { target: openTarget },
        reason:
          "Matched a web-open request; dispatch must pass the browser allowlist.",
      });
    }

    if (
      /记得|之前|前几天|昨天|回忆|memory|recall|remember|what did i/u.test(
        normalized,
      )
    ) {
      return this.brainDecision({
        intent: "memory.search",
        confidence: 0.86,
        requiresApproval: false,
        slots: {},
        reason: "Matched a Memory recall request.",
      });
    }

    if (
      /状态|健康|诊断|检查|observability|status|health|diagnostic/u.test(
        normalized,
      )
    ) {
      return this.brainDecision({
        intent: "observability.status",
        confidence: 0.84,
        requiresApproval: false,
        slots: {},
        reason: "Matched a runtime status or diagnostic request.",
      });
    }

    if (/模型|provider|runtime|gpu|model/u.test(normalized)) {
      return this.brainDecision({
        intent: "model.status",
        confidence: 0.82,
        requiresApproval: false,
        slots: {},
        reason: "Matched a model governance status request.",
      });
    }

    if (normalized.length < 3) {
      return this.brainDecision({
        intent: "clarify",
        confidence: 0.55,
        requiresApproval: false,
        slots: {},
        reason: "The command is too short to route confidently.",
      });
    }

    return this.brainDecision({
      intent: "chat.answer",
      confidence: 0.72,
      requiresApproval: false,
      slots: {},
      reason: "Defaulted to a conversational answer route.",
    });
  }

  private routeBrainIntentForCommandRouterProductMode(
    text: string,
  ): BrainRouterDecision {
    return this.applyCommandRouterProductModeSafetyToDecision(
      this.routeBrainIntentByRules(text),
    );
  }

  private applyCommandRouterProductModeSafetyToDecision(
    decision: BrainRouterDecision,
  ): BrainRouterDecision {
    if (
      decision.intent !== "browser.open" &&
      decision.intent !== "localApp.open"
    ) {
      return decision;
    }
    const target = String(decision.slots.target ?? "");
    const lowRiskKnownApp =
      decision.intent === "localApp.open" &&
      this.commandRouterRealLocalAppLaunchLabel(target) !== "blocked";
    return this.brainDecision({
      intent: decision.intent,
      confidence: decision.confidence,
      requiresApproval: !lowRiskKnownApp,
      slots: decision.slots,
      reason: lowRiskKnownApp
        ? `${decision.reason} Deterministic rules selected a low-risk known app action.`
        : `${decision.reason} Deterministic rules require confirmation or blocking for this target.`,
    });
  }

  private async planBrainFallback(input: {
    source: "text" | "voice";
    text: string;
    routing: CoreBrainRoutingOutcome;
    conversationId?: string;
  }): Promise<CoreBrainPlanningOutcome> {
    const providerId = this.brainPlannerProviderId();
    if (!this.shouldUseBrainPlanner(input)) {
      return {
        selection: this.brainPlannerSelection({
          providerId,
          status: "not_needed",
          reasonCode: "PLANNER_NOT_NEEDED",
          failureClass: "PLANNER_NOT_NEEDED",
          usedPlanner: false,
          usedRulesFallback: true,
        }),
      };
    }
    if (providerId === DETERMINISTIC_MINIMAL_PLANNER_PROVIDER_ID) {
      const result = this.deterministicPlannerService.createResult({
        text: input.text,
        source: input.source,
        routing: input.routing,
      });
      return {
        result,
        selection: this.brainPlannerSelection({
          providerId,
          status: result.status,
          reasonCode: result.reasonCode,
          failureClass: result.failureClass,
          usedPlanner: true,
          usedRulesFallback: false,
        }),
      };
    }
    return this.providerPlannerService.plan({
      providerId,
      source: input.source,
      text: input.text,
      routing: input.routing,
      conversationId: input.conversationId ?? this.activeConversationId,
    });
  }

  private async dispatchBrainIntent(input: {
    envelope: CommandEnvelope;
    text: string;
    decision: BrainRouterDecision;
    conversationId: string;
    planning: CoreBrainPlanningOutcome;
  }): Promise<{
    dispatchStatus: BrainCommandResult["dispatchStatus"];
    plan: BrainPlanStep[];
    summary: string;
    chatAnswer?: ChatAnswerResult;
    pluginResult?: PluginInvocationResult;
    memoryRecall?: CoreMemoryRecallObservation;
  }> {
    const basePlan = this.brainPlan(input.decision.intent);
    const plannerDispatch = await this.dispatchBrainPlannerOutcome({
      planning: input.planning,
      basePlan,
      envelope: input.envelope,
      source:
        input.envelope.command.type === "agent.runBrainCommand"
          ? input.envelope.command.payload.source
          : "text",
      decision: input.decision,
    });
    if (plannerDispatch) {
      return plannerDispatch;
    }
    switch (input.decision.intent) {
      case "chat.answer":
        return this.dispatchChatAnswer({
          basePlan,
          source:
            input.envelope.command.type === "agent.runBrainCommand"
              ? input.envelope.command.payload.source
              : "text",
          text: input.text,
          decision: input.decision,
        });

      case "memory.search": {
        const probe = await this.probeMemoryAlphaRecall({
          text: input.text,
          conversationId: input.conversationId,
        });
        return {
          dispatchStatus: probe.status === "ok" ? "completed" : "degraded",
          plan: this.completeBrainPlan(basePlan),
          summary: `Brain Alpha routed this as memory.search. Recall status ${probe.status}; matches ${probe.matchCount}; mode ${probe.mode}.`,
          memoryRecall: this.memoryRecallObservationFromProbe(probe),
        };
      }

      case "observability.status":
        return {
          dispatchStatus: "completed",
          plan: this.completeBrainPlan(basePlan),
          summary: `Brain Alpha routed this as observability.status. Core ${this.health}; sequence ${this.sequenceId}; voice ${this.voiceEngine.getSnapshot().state}; Memory ${this.memoryHealth?.status ?? "unknown"}.`,
        };

      case "model.status":
        return {
          dispatchStatus: "completed",
          plan: this.completeBrainPlan(basePlan),
          summary: `Brain Alpha routed this as model.status. Runtime ${this.capabilities?.runtimeMode ?? "unknown"}; model operations ${this.modelOperations.length}; active operations ${this.modelOperations.filter((operation) => operation.phase !== "completed").length}.`,
        };

      case "coding.task":
        return {
          dispatchStatus: "blocked",
          plan: this.blockFinalBrainPlan(basePlan),
          summary:
            "Voice command correction identified a Codex coding task, but no bounded coding executor is connected in Jarvis-K yet.",
        };

      case "filesystem.search": {
        const query = String(input.decision.slots.query ?? "").trim();
        return this.dispatchTaskRuntimeFilesystemSearch({
          envelope: input.envelope,
          source:
            input.envelope.command.type === "agent.runBrainCommand"
              ? input.envelope.command.payload.source
              : "text",
          decision: input.decision,
          query,
          basePlan,
        });
      }

      case "plugin.invoke": {
        const pluginId = String(input.decision.slots.pluginId ?? "").trim();
        const capability = String(input.decision.slots.capability ?? "").trim();
        const pluginInput =
          typeof input.decision.slots.input === "object" &&
          input.decision.slots.input !== null
            ? (input.decision.slots.input as Record<string, unknown>)
            : {};
        return this.dispatchTaskRuntimePluginInvoke({
          envelope: input.envelope,
          source:
            input.envelope.command.type === "agent.runBrainCommand"
              ? input.envelope.command.payload.source
              : "text",
          decision: input.decision,
          pluginId,
          capability,
          pluginInput,
          basePlan,
        });
      }

      case "notepad.write_text": {
        const text = String(input.decision.slots.text ?? "").trim();
        return this.dispatchTaskRuntimeNotepadWriteText({
          envelope: input.envelope,
          source:
            input.envelope.command.type === "agent.runBrainCommand"
              ? input.envelope.command.payload.source
              : "text",
          decision: input.decision,
          text,
          basePlan,
        });
      }

      case "window.focus":
      case "window.minimize":
      case "window.restore": {
        const target = String(input.decision.slots.target ?? "").trim();
        const action = String(
          input.decision.slots.action ??
            input.decision.intent.replace("window.", ""),
        ) as CoreKnownAppWindowAction;
        return this.dispatchTaskRuntimeWindowControl({
          envelope: input.envelope,
          source:
            input.envelope.command.type === "agent.runBrainCommand"
              ? input.envelope.command.payload.source
              : "text",
          decision: input.decision,
          target,
          action,
          basePlan,
        });
      }

      case "browser.open":
      case "localApp.open": {
        const target = String(input.decision.slots.target ?? "").trim();
        if (
          input.decision.intent === "browser.open" &&
          this.shouldRunTaskRuntimeBrowserOpen(target)
        ) {
          return this.dispatchTaskRuntimeBrowserOpen({
            envelope: input.envelope,
            source:
              input.envelope.command.type === "agent.runBrainCommand"
                ? input.envelope.command.payload.source
                : "text",
            decision: input.decision,
            target,
            basePlan,
          });
        }
        if (
          input.decision.intent === "localApp.open" &&
          this.shouldRunTaskRuntimeKnownAppSlice(target)
        ) {
          return this.dispatchTaskRuntimeKnownAppOpen({
            envelope: input.envelope,
            source:
              input.envelope.command.type === "agent.runBrainCommand"
                ? input.envelope.command.payload.source
                : "text",
            decision: input.decision,
            target,
            basePlan,
          });
        }
        if (this.commandRouterProductMode?.enabled === true) {
          if (input.decision.intent === "localApp.open") {
            if (!this.isCommandRouterFixtureReplayEnabled()) {
              return {
                dispatchStatus: "blocked",
                plan: this.blockFinalBrainPlan(basePlan),
                summary: `Command Router product mode identified localApp.open for "${target || "unknown"}", but Task Runtime execution is unavailable and fixture replay is disabled.`,
              };
            }
            if (!this.isCommandRouterLocalAppFixtureAllowlisted(target)) {
              return {
                dispatchStatus: "blocked",
                plan: this.blockFinalBrainPlan(basePlan),
                summary: `Command Router product mode identified localApp.open for "${target || "unknown"}", but the fixture allowlist blocked this target.`,
              };
            }
            return {
              dispatchStatus: "completed",
              plan: this.completeBrainPlan([
                ...basePlan,
                {
                  id: "local-app-fixture",
                  title: "Replay local app allowlist fixture",
                  status: "completed",
                },
              ]),
              summary: `Command Router product mode fixture accepted localApp.open for "${this.commandRouterLocalAppFixtureLabel(target)}". No Windows process was launched.`,
            };
          }
          return {
            dispatchStatus: "needs_approval",
            plan: this.blockFinalBrainPlan(basePlan),
            summary: `Command Router product mode identified ${input.decision.intent} for "${target || "unknown"}". Direct execution is disabled in fixture-only mode.`,
          };
        }
        if (!this.brainActionExecutor) {
          return {
            dispatchStatus: "blocked",
            plan: this.blockFinalBrainPlan(basePlan),
            summary: `Brain Alpha identified ${input.decision.intent} for "${target || "unknown"}", but no allowlist action adapter is configured.`,
          };
        }
        const actionResult =
          input.decision.intent === "browser.open"
            ? await this.brainActionExecutor.openBrowser({ target })
            : await this.brainActionExecutor.openLocalApp({ target });
        const completed = actionResult.status === "completed";
        return {
          dispatchStatus: completed ? "completed" : "blocked",
          plan: completed
            ? this.completeBrainPlan(basePlan)
            : this.blockFinalBrainPlan(basePlan),
          summary: completed
            ? `Brain Alpha opened allowlisted target: ${actionResult.label}.`
            : `Brain Alpha blocked ${input.decision.intent}: ${actionResult.reasonCode}.`,
        };
      }

      case "clarify":
        return {
          dispatchStatus: "blocked",
          plan: this.blockFinalBrainPlan(basePlan),
          summary:
            "Brain Alpha needs a little more detail before it can route this safely.",
        };

      case "blocked":
        if (this.textOnlyAcceptance?.enabled === true && this.chatAnswer) {
          return this.dispatchChatAnswer({
            basePlan,
            source:
              input.envelope.command.type === "agent.runBrainCommand"
                ? input.envelope.command.payload.source
                : "text",
            text: input.text,
            decision: input.decision,
          });
        }
        return {
          dispatchStatus: "blocked",
          plan: this.blockFinalBrainPlan(basePlan),
          summary: "Brain Alpha blocked this command before dispatch.",
        };
    }

    return {
      dispatchStatus: "blocked",
      plan: this.blockFinalBrainPlan(basePlan),
      summary: "Brain Alpha could not route this command safely.",
    };
  }

  private async dispatchChatAnswer(input: {
    basePlan: BrainPlanStep[];
    source: "text" | "voice";
    text: string;
    decision: BrainRouterDecision;
  }): Promise<{
    dispatchStatus: BrainCommandResult["dispatchStatus"];
    plan: BrainPlanStep[];
    summary: string;
    chatAnswer?: ChatAnswerResult;
  }> {
    return this.chatDispatchService.dispatch(input);
  }

  private async createBrainToolProductLoop(input: {
    source: "text" | "voice";
    decision: BrainRouterDecision;
    planning: CoreBrainPlanningOutcome;
    dispatchStatus: BrainCommandResult["dispatchStatus"];
  }): Promise<BrainToolProductLoop> {
    const selectedToolId = this.selectBrainToolId(input);
    const descriptors = this.brainToolRegistryDescriptors(input.decision);
    const descriptor = selectedToolId
      ? descriptors.find((candidate) => candidate.id === selectedToolId)
      : undefined;
    const request =
      descriptor === undefined
        ? undefined
        : this.createBrainToolReplayRequest({
            toolId: descriptor.id,
            source: input.source,
            decision: input.decision,
          });
    const safety =
      descriptor !== undefined && request !== undefined
        ? decideToolInvocation({
            policy: BRAIN_TOOL_REGISTRY_POLICY,
            descriptor,
            request,
            evaluatedAt: this.now().toISOString(),
          })
        : undefined;
    const shouldSkipToolReplay =
      input.planning.selection.usedPlanner === true &&
      input.planning.selection.status === "planned" &&
      input.dispatchStatus === "needs_approval";
    const execution =
      request !== undefined && !shouldSkipToolReplay
        ? await this.executeBrainToolReplay({ request, descriptors })
        : undefined;
    const fallbackReasonCode = this.brainToolFallbackReason(input.planning);
    const projectedExecution =
      execution === undefined
        ? undefined
        : {
            status: execution.status,
            resultCode: execution.resultCode,
            failureClasses: [...execution.failureClasses],
            rollbackState: execution.rollbackState,
            cleanupState: execution.cleanupState,
          };
    return BrainToolProductLoopSchema.parse({
      mode: "fixture_replay",
      registryVersion: BRAIN_TOOL_REGISTRY_VERSION,
      descriptors: descriptors.map((item) => ({
        id: item.id,
        version: item.version,
        label: this.brainToolLabel(item.id),
        risk: item.risk,
        execution: item.execution,
        requiresConfirmation: item.requiresConfirmation,
        permissionCount: item.requiredPermissions.length,
      })),
      ...(selectedToolId === undefined ? {} : { selectedToolId }),
      routeReasonCode: this.brainToolRouteReasonCode(input),
      ...(safety === undefined ? {} : { safety }),
      ...(projectedExecution === undefined
        ? {}
        : { execution: projectedExecution }),
      lifecycle: this.createBrainToolLifecycle({
        selectedToolId,
        safety,
        execution,
        fallbackReasonCode,
        dispatchStatus: input.dispatchStatus,
      }),
      ...(fallbackReasonCode === undefined ? {} : { fallbackReasonCode }),
      retryState: "not_available",
      rollbackState: execution?.rollbackState ?? "not_started",
      summary: this.brainToolProductLoopSummary({
        selectedToolId,
        safety,
        execution,
        fallbackReasonCode,
      }),
      persisted: false,
      rawDiagnosticsExposed: false,
      directActionAttempted: false,
    });
  }

  private shouldRunTaskRuntimeKnownAppSlice(target: string): boolean {
    return (
      this.taskRepository !== undefined &&
      this.brainActionExecutor !== undefined &&
      this.commandRouterRealLocalAppLaunchLabel(target) !== "blocked"
    );
  }

  private shouldRunTaskRuntimeBrowserOpen(target: string): boolean {
    return (
      this.taskRepository !== undefined &&
      this.brainActionExecutor !== undefined &&
      target.trim().length > 0
    );
  }

  private shouldRunTaskRuntimeFilesystemSearch(): boolean {
    return (
      this.taskRepository !== undefined &&
      this.brainActionExecutor?.searchFilesystem !== undefined
    );
  }

  private shouldRunTaskRuntimeNotepadWriteText(): boolean {
    return (
      this.taskRepository !== undefined &&
      this.brainActionExecutor?.writeNotepadText !== undefined
    );
  }

  private shouldRunTaskRuntimeWindowControl(): boolean {
    return (
      this.taskRepository !== undefined &&
      this.brainActionExecutor?.controlKnownAppWindow !== undefined
    );
  }

  private async dispatchTaskRuntimePluginInvoke(input: {
    envelope: CommandEnvelope;
    source: "text" | "voice";
    decision: BrainRouterDecision;
    pluginId: string;
    capability: string;
    pluginInput: Record<string, unknown>;
    basePlan: BrainPlanStep[];
  }): Promise<{
    dispatchStatus: BrainCommandResult["dispatchStatus"];
    plan: BrainPlanStep[];
    summary: string;
    pluginResult?: PluginInvocationResult;
  }> {
    const repository = this.taskRepository;
    const taskDispatch = this.taskDispatchService;
    if (!repository || !taskDispatch) {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan(input.basePlan),
        summary:
          "Task Runtime could not execute plugin.invoke because its repository is unavailable.",
      };
    }

    const invocation = await this.pluginInvocationService.invoke({
      requestId: createId("plugin-request"),
      pluginId: input.pluginId,
      capability: input.capability,
      input: input.pluginInput,
      dryRun: false,
    });
    if (!invocation.request) {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan(input.basePlan),
        summary: invocation.summary,
      };
    }
    if (!invocation.ok && invocation.executionSemantics === "not_executed") {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan(input.basePlan),
        summary: invocation.summary,
      };
    }

    const { taskId, stepId } = await taskDispatch.createQueuedTask({
      title: "Invoke Read-only Plugin",
      source: input.source,
      intent: input.decision.intent,
      routeSource: "intent-router.deterministic.rules",
      stepTitle: `Invoke plugin capability: ${invocation.request.capability}`,
      createdMessage:
        "Task created from deterministic rules route for a read-only plugin invocation.",
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    await taskDispatch.markRunning({
      taskId,
      stepId,
      message: "Plugin Runtime read-only invocation requested.",
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    await taskDispatch.completeVerification({
      taskId,
      stepId,
      verificationStatus: invocation.ok ? "verified" : "verification_failed",
      resultSummary: invocation.summary,
      failureReason: invocation.ok ? undefined : invocation.resultCode,
    });
    await this.refreshTasksFromRepository();

    return {
      dispatchStatus: invocation.ok ? "completed" : "blocked",
      plan: invocation.ok
        ? this.completeBrainPlan([
            ...input.basePlan,
            {
              id: "plugin-result",
              title: "Validate sanitized plugin output",
              status: "completed",
            },
          ])
        : this.blockFinalBrainPlan(input.basePlan),
      summary: invocation.summary,
      ...(invocation.result ? { pluginResult: invocation.result } : {}),
    };
  }

  private async dispatchTaskRuntimeFilesystemSearch(input: {
    envelope: CommandEnvelope;
    source: "text" | "voice";
    decision: BrainRouterDecision;
    query: string;
    basePlan: BrainPlanStep[];
  }): Promise<{
    dispatchStatus: BrainCommandResult["dispatchStatus"];
    plan: BrainPlanStep[];
    summary: string;
  }> {
    const repository = this.taskRepository;
    const taskDispatch = this.taskDispatchService;
    const executor = this.brainActionExecutor;
    if (!repository || !taskDispatch || !executor?.searchFilesystem) {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan(input.basePlan),
        summary:
          "Task Runtime could not execute filesystem.search because its repository or observe-only executor is unavailable.",
      };
    }

    const { taskId, stepId } = await taskDispatch.createQueuedTask({
      title: "Search Filesystem",
      source: input.source,
      intent: input.decision.intent,
      routeSource: "intent-router.deterministic.rules",
      stepTitle: "Search allowed local files",
      createdMessage: "Task created from deterministic rules route.",
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    await taskDispatch.markRunning({
      taskId,
      stepId,
      message: "Desktop Host observe-only filesystem search requested.",
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    const actionResult = await executor.searchFilesystem({
      target: input.query,
    });
    const verificationStatus =
      actionResult.status === "completed"
        ? (actionResult.verificationStatus ?? "verified")
        : "verification_failed";
    const verified = verificationStatus === "verified";
    const resultSummary =
      actionResult.verificationSummary ??
      (verified
        ? `${actionResult.matchCount ?? 0} sanitized filesystem candidate(s) found.`
        : `Filesystem search not verified: ${actionResult.reasonCode}.`);

    await taskDispatch.completeVerification({
      taskId,
      stepId,
      verificationStatus,
      resultSummary,
      failureReason: verified ? undefined : actionResult.reasonCode,
    });
    await this.refreshTasksFromRepository();

    return {
      dispatchStatus: verified ? "completed" : "blocked",
      plan: verified
        ? this.completeBrainPlan(input.basePlan)
        : this.blockFinalBrainPlan(input.basePlan),
      summary: verified
        ? `Task Runtime searched allowed local files and found ${actionResult.matchCount ?? 0} sanitized candidate(s).`
        : `Task Runtime blocked filesystem search: ${actionResult.reasonCode}.`,
    };
  }

  private async dispatchTaskRuntimeNotepadWriteText(input: {
    envelope: CommandEnvelope;
    source: "text" | "voice";
    decision: BrainRouterDecision;
    text: string;
    basePlan: BrainPlanStep[];
  }): Promise<{
    dispatchStatus: BrainCommandResult["dispatchStatus"];
    plan: BrainPlanStep[];
    summary: string;
  }> {
    const repository = this.taskRepository;
    const taskDispatch = this.taskDispatchService;
    const executor = this.brainActionExecutor;
    if (!repository || !taskDispatch || !executor?.writeNotepadText) {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan(input.basePlan),
        summary:
          "Task Runtime could not execute notepad.write_text because its repository or Windows executor is unavailable.",
      };
    }
    const boundedText = this.normalizeNotepadWriteText(input.text);
    if (boundedText === undefined) {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan(input.basePlan),
        summary:
          "Task Runtime blocked notepad.write_text because the requested text is outside the bounded text policy.",
      };
    }

    const { taskId, stepId } = await taskDispatch.createQueuedTask({
      title: "Write Text In Notepad",
      source: input.source,
      intent: input.decision.intent,
      routeSource: "intent-router.deterministic.rules",
      stepTitle: "Write bounded text into Notepad",
      createdMessage:
        "Task created from deterministic rules route for a bounded Notepad write.",
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    await taskDispatch.markRunning({
      taskId,
      stepId,
      message: "Desktop Host Notepad write requested.",
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    const actionResult = await executor.writeNotepadText({
      target: "notepad",
      text: boundedText,
    });
    const verificationStatus =
      actionResult.status === "completed"
        ? (actionResult.verificationStatus ?? "unverified")
        : "verification_failed";
    const verified = verificationStatus === "verified";
    const resultSummary =
      actionResult.verificationSummary ??
      (verified
        ? `Notepad write verification passed for ${boundedText.length} character(s).`
        : `Notepad write verification failed: ${actionResult.reasonCode}.`);

    await taskDispatch.completeVerification({
      taskId,
      stepId,
      verificationStatus,
      resultSummary,
      failureReason: verified ? undefined : actionResult.reasonCode,
    });
    await this.refreshTasksFromRepository();

    return {
      dispatchStatus: verified ? "completed" : "blocked",
      plan: verified
        ? this.completeBrainPlan(input.basePlan)
        : this.blockFinalBrainPlan(input.basePlan),
      summary: verified
        ? "Task Runtime wrote bounded text into Notepad through deterministic rules and verified the result."
        : "Task Runtime attempted to write text into Notepad, but result verification did not pass.",
    };
  }

  private async dispatchTaskRuntimeWindowControl(input: {
    envelope: CommandEnvelope;
    source: "text" | "voice";
    decision: BrainRouterDecision;
    target: string;
    action: CoreKnownAppWindowAction;
    basePlan: BrainPlanStep[];
  }): Promise<{
    dispatchStatus: BrainCommandResult["dispatchStatus"];
    plan: BrainPlanStep[];
    summary: string;
  }> {
    const repository = this.taskRepository;
    const taskDispatch = this.taskDispatchService;
    const executor = this.brainActionExecutor;
    const appLabel = this.commandRouterRealLocalAppLaunchLabel(input.target);
    if (!repository || !taskDispatch || !executor?.controlKnownAppWindow) {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan(input.basePlan),
        summary:
          "Task Runtime could not execute window control because its repository or Windows executor is unavailable.",
      };
    }
    if (appLabel === "blocked" || !this.isKnownAppWindowAction(input.action)) {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan(input.basePlan),
        summary:
          "Task Runtime blocked window control because the target or action is outside the fixed known-app policy.",
      };
    }

    const appName = this.commandRouterKnownLocalAppDisplayName(appLabel);
    const actionName = this.commandRouterWindowActionDisplayName(input.action);
    const actionVerb = this.commandRouterWindowActionVerb(input.action);
    const { taskId, stepId } = await taskDispatch.createQueuedTask({
      title: `${actionName} ${appName} Window`,
      source: input.source,
      intent: input.decision.intent,
      routeSource: "intent-router.deterministic.rules",
      stepTitle: `${actionName} known local app window: ${appLabel}`,
      createdMessage: "Task created from deterministic rules route.",
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    await taskDispatch.markRunning({
      taskId,
      stepId,
      message: `Desktop Host ${input.action} requested for ${appName}.`,
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    const actionResult = await executor.controlKnownAppWindow({
      target: appLabel,
      action: input.action,
    });
    const verificationStatus =
      actionResult.status === "completed"
        ? (actionResult.verificationStatus ?? "unverified")
        : "verification_failed";
    const verified = verificationStatus === "verified";
    const resultSummary =
      actionResult.verificationSummary ??
      (verified
        ? `${appName} window ${input.action} verified.`
        : `${appName} window ${input.action} not verified: ${actionResult.reasonCode}.`);

    await taskDispatch.completeVerification({
      taskId,
      stepId,
      verificationStatus,
      resultSummary,
      failureReason: verified ? undefined : actionResult.reasonCode,
    });
    await this.refreshTasksFromRepository();

    return {
      dispatchStatus: verified ? "completed" : "blocked",
      plan: verified
        ? this.completeBrainPlan(input.basePlan)
        : this.blockFinalBrainPlan(input.basePlan),
      summary: verified
        ? `Task Runtime ${actionVerb} ${appName} through deterministic rules and verified the result.`
        : `Task Runtime attempted to ${input.action} ${appName}, but result verification did not pass.`,
    };
  }

  private async dispatchTaskRuntimeBrowserOpen(input: {
    envelope: CommandEnvelope;
    source: "text" | "voice";
    decision: BrainRouterDecision;
    target: string;
    basePlan: BrainPlanStep[];
  }): Promise<{
    dispatchStatus: BrainCommandResult["dispatchStatus"];
    plan: BrainPlanStep[];
    summary: string;
  }> {
    const repository = this.taskRepository;
    const taskDispatch = this.taskDispatchService;
    const executor = this.brainActionExecutor;
    if (!repository || !taskDispatch || !executor) {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan(input.basePlan),
        summary:
          "Task Runtime could not execute browser.open because its repository or executor is unavailable.",
      };
    }

    const { taskId, stepId } = await taskDispatch.createQueuedTask({
      title: "Open Browser URL",
      source: input.source,
      intent: input.decision.intent,
      routeSource: "intent-router.deterministic.rules",
      stepTitle: "Open safe browser URL",
      createdMessage: "Task created from deterministic rules route.",
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    await taskDispatch.markRunning({
      taskId,
      stepId,
      message:
        "Desktop Host browser launch requested for a policy-verified URL.",
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    const actionResult = await executor.openBrowser({ target: input.target });
    const verificationStatus =
      actionResult.status === "completed"
        ? (actionResult.verificationStatus ?? "verified")
        : "verification_failed";
    const verified = verificationStatus === "verified";
    const resultSummary =
      actionResult.verificationSummary ??
      (verified
        ? `${actionResult.label} URL policy verified.`
        : `Browser URL launch not verified: ${actionResult.reasonCode}.`);

    await taskDispatch.completeVerification({
      taskId,
      stepId,
      verificationStatus,
      resultSummary,
      failureReason: verified ? undefined : actionResult.reasonCode,
    });
    await this.refreshTasksFromRepository();

    return {
      dispatchStatus: verified ? "completed" : "blocked",
      plan: verified
        ? this.completeBrainPlan(input.basePlan)
        : this.blockFinalBrainPlan(input.basePlan),
      summary: verified
        ? `Task Runtime opened browser URL for ${actionResult.label} through deterministic rules and verified the URL policy.`
        : `Task Runtime blocked browser URL launch: ${actionResult.reasonCode}.`,
    };
  }

  private async dispatchTaskRuntimeKnownAppOpen(input: {
    envelope: CommandEnvelope;
    source: "text" | "voice";
    decision: BrainRouterDecision;
    target: string;
    basePlan: BrainPlanStep[];
  }): Promise<{
    dispatchStatus: BrainCommandResult["dispatchStatus"];
    plan: BrainPlanStep[];
    summary: string;
  }> {
    const repository = this.taskRepository;
    const taskDispatch = this.taskDispatchService;
    const executor = this.brainActionExecutor;
    const appLabel = this.commandRouterRealLocalAppLaunchLabel(input.target);
    if (!repository || !taskDispatch || !executor) {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan(input.basePlan),
        summary:
          "Task Runtime could not execute localApp.open because its repository or executor is unavailable.",
      };
    }
    if (appLabel === "blocked") {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan(input.basePlan),
        summary:
          "Task Runtime blocked localApp.open because the target is not a known local app.",
      };
    }

    const appName = this.commandRouterKnownLocalAppDisplayName(appLabel);
    const { taskId, stepId } = await taskDispatch.createQueuedTask({
      title: `Open ${appName}`,
      source: input.source,
      intent: input.decision.intent,
      routeSource: "intent-router.deterministic.rules",
      stepTitle: `Launch known local app: ${appLabel}`,
      createdMessage: "Task created from deterministic rules route.",
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    await taskDispatch.markRunning({
      taskId,
      stepId,
      message: `Desktop Host launch requested for ${appName}.`,
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);

    const actionResult = await executor.openLocalApp({ target: appLabel });
    const verificationStatus =
      actionResult.status === "completed"
        ? (actionResult.verificationStatus ?? "unverified")
        : "verification_failed";
    const verified = verificationStatus === "verified";
    const resultSummary =
      actionResult.verificationSummary ??
      (verified
        ? `${appName} launch verified.`
        : `${appName} launch not verified: ${actionResult.reasonCode}.`);

    await taskDispatch.completeVerification({
      taskId,
      stepId,
      verificationStatus,
      resultSummary,
      failureReason: verified ? undefined : actionResult.reasonCode,
    });
    await this.refreshTasksFromRepository();

    return {
      dispatchStatus: verified ? "completed" : "blocked",
      plan: verified
        ? this.completeBrainPlan(input.basePlan)
        : this.blockFinalBrainPlan(input.basePlan),
      summary: verified
        ? `Task Runtime opened ${appName} through deterministic rules and verified the result.`
        : `Task Runtime attempted to open ${appName}, but result verification did not pass.`,
    };
  }

  private async refreshTasksFromRepository(): Promise<void> {
    if (!this.taskRepository) {
      this.tasks = [];
      return;
    }
    this.tasks = (await this.taskRepository.listTasks()).map((task) =>
      TaskSchema.parse(task),
    );
  }

  private async cancelTask(envelope: CommandEnvelope): Promise<CommandResult> {
    if (envelope.command.type !== "agent.cancelTask") {
      return this.failure(envelope, {
        code: "TASK_COMMAND_INVALID",
        message: "Task cancellation received an unsupported command.",
        retryable: false,
      });
    }
    const { taskId, reason: requestedReason } = envelope.command.payload as {
      taskId: string;
      reason?: string;
    };
    const result = await this.plannerApprovalService.cancel({
      taskId,
      reason: requestedReason,
    });
    if (!result.ok) {
      return this.failure(envelope, {
        code: result.code,
        message: result.message,
        retryable: result.retryable,
      });
    }
    await this.refreshTasksFromRepository();
    this.publishSnapshot(envelope.correlationId);
    const refreshed =
      this.tasks.find((candidate) => candidate.id === result.task.id) ??
      result.task;
    return this.success(envelope, {
      task: refreshed,
      cancelled: true,
      directActionAttempted: false,
    });
  }

  private async approveTask(envelope: CommandEnvelope): Promise<CommandResult> {
    if (envelope.command.type !== "agent.approveTask") {
      return this.failure(envelope, {
        code: "TASK_COMMAND_INVALID",
        message: "Task approval received an unsupported command.",
        retryable: false,
      });
    }
    const { taskId } = envelope.command.payload as {
      taskId: string;
      confirmation: "explicit_ui_confirmation";
    };
    const result = await this.plannerApprovalService.approve({
      taskId,
      executeStep: (step, toolId) =>
        this.plannerExecutionCoordinator.executeStep(step, toolId),
      onProgress: async () => {
        await this.refreshTasksFromRepository();
        this.publishSnapshot(envelope.correlationId);
      },
    });
    if (!result.ok) {
      return this.failure(envelope, {
        code: result.code,
        message: result.message,
        retryable: result.retryable,
      });
    }
    await this.refreshTasksFromRepository();
    this.publishSnapshot(envelope.correlationId);
    const refreshed =
      this.tasks.find((candidate) => candidate.id === result.task.id) ??
      result.task;
    return this.success(envelope, {
      task: refreshed,
      approved: true,
      executedStepCount: result.executedStepCount,
      failedStepCount: result.failedStepCount,
      directActionAttempted: false,
    });
  }
  private createBrainAlphaHardening(input: {
    source: "text" | "voice";
    decision: BrainRouterDecision;
    toolProductLoop: BrainToolProductLoop;
    dispatchStatus: BrainCommandResult["dispatchStatus"];
    memoryRecall?: CoreMemoryRecallObservation;
  }): BrainAlphaHardening {
    const memoryContext: BrainAlphaMemoryContext =
      input.memoryRecall === undefined
        ? {
            status: "not_requested",
            mode: "unknown",
            matchCount: 0,
            queryDimensions: 0,
            readOnly: true,
            rawContentExposed: false,
          }
        : {
            status:
              input.memoryRecall.status === "ok" ? "available" : "unavailable",
            mode: input.memoryRecall.mode,
            matchCount: Math.min(5, input.memoryRecall.matchCount),
            queryDimensions: Math.min(
              16_384,
              Math.max(0, input.memoryRecall.queryDimensions),
            ),
            readOnly: true,
            rawContentExposed: false,
          };
    const retryAvailable =
      input.dispatchStatus === "blocked" || input.dispatchStatus === "degraded";
    const reasonCode =
      input.toolProductLoop.execution?.resultCode ??
      input.toolProductLoop.safety?.reasonCode ??
      input.toolProductLoop.routeReasonCode;
    const confirmation = this.brainAlphaConfirmationStatus(
      input.toolProductLoop,
    );
    return BrainAlphaHardeningSchema.parse({
      schemaVersion: "1.0.0",
      sessionEntryId: createId("session-entry"),
      memoryContext,
      retry: {
        status: retryAvailable ? "available" : "not_available",
        attemptCount: 0,
        safetyPathReentered: true,
        ...(retryAvailable ? {} : { reasonCode: "RETRY_NOT_REQUIRED" }),
      },
      rollback: {
        status: retryAvailable ? "available" : "not_available",
        safetyPreserved: true,
        ...(retryAvailable ? {} : { reasonCode: "ROLLBACK_NOT_REQUIRED" }),
      },
      tts: {
        status: input.dispatchStatus === "completed" ? "eligible" : "disabled",
        localOnly: true,
        defaultOff: true,
        boundedText: true,
        rawTextPersisted: false,
      },
      persisted: false,
      rawDiagnosticsExposed: false,
      directActionAttempted: false,
      memoryWriteAttempted: false,
    });
  }

  private appendSessionHistory(input: {
    source: "text" | "voice";
    decision: BrainRouterDecision;
    toolProductLoop: BrainToolProductLoop;
    dispatchStatus: BrainCommandResult["dispatchStatus"];
    alphaHardening: BrainAlphaHardening;
  }): void {
    const entry = SessionHistoryEntrySchema.parse({
      id: input.alphaHardening.sessionEntryId,
      createdAt: this.now().toISOString(),
      source: input.source,
      intent: input.decision.intent,
      ...(input.toolProductLoop.selectedToolId === undefined
        ? {}
        : { selectedToolId: input.toolProductLoop.selectedToolId }),
      dispatchStatus: input.dispatchStatus,
      confirmation: this.brainAlphaConfirmationStatus(input.toolProductLoop),
      resultStatus: input.dispatchStatus,
      reasonCode:
        input.toolProductLoop.execution?.resultCode ??
        input.toolProductLoop.safety?.reasonCode ??
        input.toolProductLoop.routeReasonCode,
      memoryContextStatus: input.alphaHardening.memoryContext.status,
      retryStatus: input.alphaHardening.retry.status,
      rollbackStatus: input.alphaHardening.rollback.status,
      ttsStatus: input.alphaHardening.tts.status,
      persisted: false,
      rawContentExposed: false,
    });
    this.sessionHistory.unshift(entry);
    this.sessionHistory.splice(12);
  }

  private brainAlphaConfirmationStatus(
    toolProductLoop: BrainToolProductLoop,
  ): "not_required" | "required" | "granted" | "blocked" {
    if (!toolProductLoop.safety?.confirmationRequired) {
      return "not_required";
    }
    if (toolProductLoop.safety.audit.confirmationGranted) {
      return "granted";
    }
    return toolProductLoop.safety.allowed ? "required" : "blocked";
  }

  private selectBrainToolId(input: {
    decision: BrainRouterDecision;
    planning: CoreBrainPlanningOutcome;
  }): string | undefined {
    if (
      input.decision.intent === "filesystem.search" &&
      this.shouldRunTaskRuntimeFilesystemSearch()
    ) {
      return undefined;
    }
    if (
      input.decision.intent === "notepad.write_text" &&
      this.shouldRunTaskRuntimeNotepadWriteText()
    ) {
      return undefined;
    }
    if (
      (input.decision.intent === "window.focus" ||
        input.decision.intent === "window.minimize" ||
        input.decision.intent === "window.restore") &&
      this.shouldRunTaskRuntimeWindowControl()
    ) {
      return undefined;
    }
    if (input.decision.intent === "notepad.write_text") {
      return "notepad.writeText";
    }
    if (
      input.decision.intent === "browser.open" &&
      this.shouldRunTaskRuntimeBrowserOpen(
        String(input.decision.slots.target ?? ""),
      )
    ) {
      return undefined;
    }
    if (
      input.decision.intent === "localApp.open" &&
      this.shouldRunTaskRuntimeKnownAppSlice(
        String(input.decision.slots.target ?? ""),
      )
    ) {
      return undefined;
    }
    if (
      this.isCommandRouterFixtureReplayEnabled() &&
      input.decision.intent === "localApp.open" &&
      !this.isCommandRouterLocalAppFixtureAllowlisted(
        String(input.decision.slots.target ?? ""),
      )
    ) {
      return undefined;
    }
    const plannedToolId =
      input.planning.result?.status === "planned"
        ? input.planning.result.plan?.steps.find((step) =>
            (BRAIN_PLANNER_ALLOWED_TOOL_IDS as readonly string[]).includes(
              step.toolId,
            ),
          )?.toolId
        : undefined;
    if (plannedToolId !== undefined) {
      return plannedToolId;
    }
    if (
      (BRAIN_PLANNER_ALLOWED_TOOL_IDS as readonly string[]).includes(
        input.decision.intent,
      )
    ) {
      return input.decision.intent;
    }
    return undefined;
  }

  private isCommandRouterLocalAppFixtureAllowlisted(target: string): boolean {
    return COMMAND_ROUTER_LOCAL_APP_FIXTURE_ALLOWLIST.has(
      this.normalizeCommandRouterLocalAppTarget(target),
    );
  }

  private isCommandRouterFixtureReplayEnabled(): boolean {
    return (
      this.commandRouterProductMode?.enabled === true &&
      this.commandRouterProductMode.mode === "fixture_only" &&
      this.commandRouterProductMode.providerId ===
        COMMAND_ROUTER_FIXTURE_PROVIDER_ID &&
      this.commandRouterProductMode.fixtureExecutionEnabled === true
    );
  }

  private isCommandRouterRealLocalAppLaunchAllowlisted(
    target: string,
  ): boolean {
    return this.commandRouterRealLocalAppLaunchLabel(target) !== "blocked";
  }

  private commandRouterRealLocalAppLaunchLabel(
    target: string,
  ): CommandRouterKnownLocalAppLabel | "blocked" {
    const normalized = this.normalizeCommandRouterLocalAppTarget(target);
    if (
      [
        "notepad",
        "\u8bb0\u4e8b\u672c",
        "\u8bb0\u4e8b\u7c3f",
        "\u8bb0\u4e8b\u677f",
        "\u8bb0\u4e8b\u95e8",
        "\u8bb0\u4e8b\u8584",
      ].includes(normalized)
    ) {
      return "notepad";
    }
    if (
      [
        "calculator",
        "calc",
        "\u8ba1\u7b97\u5668",
        "\u8ba1\u7b97\u6c14",
        "\u8ba1\u7b97\u5176",
      ].includes(normalized)
    ) {
      return "calculator";
    }
    if (
      [
        "vscode",
        "vs code",
        "v s code",
        "visual studio code",
        "visual studio",
        "visual code",
        "code",
        "\u4ee3\u7801",
      ].includes(normalized)
    ) {
      return "vscode";
    }
    return "blocked";
  }

  private commandRouterKnownLocalAppDisplayName(
    label: CommandRouterKnownLocalAppLabel,
  ): string {
    switch (label) {
      case "notepad":
        return "Notepad";
      case "calculator":
        return "Calculator";
      case "vscode":
        return "VS Code";
    }
  }

  private commandRouterWindowActionDisplayName(
    action: CoreKnownAppWindowAction,
  ): string {
    switch (action) {
      case "focus":
        return "Focus";
      case "minimize":
        return "Minimize";
      case "restore":
        return "Restore";
    }
  }

  private commandRouterWindowActionVerb(
    action: CoreKnownAppWindowAction,
  ): string {
    switch (action) {
      case "focus":
        return "focused";
      case "minimize":
        return "minimized";
      case "restore":
        return "restored";
    }
  }

  private isKnownAppWindowAction(
    action: string,
  ): action is CoreKnownAppWindowAction {
    return action === "focus" || action === "minimize" || action === "restore";
  }

  private commandRouterLocalAppFixtureLabel(target: string): string {
    const normalized = this.normalizeCommandRouterLocalAppTarget(target);
    return normalized === "calc" ? "calculator" : normalized;
  }

  private normalizeCommandRouterLocalAppTarget(target: string): string {
    return this.stripCommandSpeechPunctuation(target)
      .replace(/\b(?:v\s*[\.\s]*s\s*[\.\s]*code|vs\s*[\.\s]*code)\b/giu, "vscode")
      .replace(/\s+/gu, " ")
      .toLowerCase();
  }

  private createBrainToolReplayRequest(input: {
    toolId: string;
    source: "text" | "voice";
    decision: BrainRouterDecision;
  }): ToolInvocationRequest {
    return {
      requestId: createId("tool-loop"),
      toolId: input.toolId,
      input: {
        origin: input.source,
        intent: input.decision.intent,
        confidence: Number(input.decision.confidence.toFixed(3)),
        approvalFlag: input.decision.requiresApproval,
      },
      dryRun: true,
    };
  }

  private async executeBrainToolReplay(input: {
    request: ToolInvocationRequest;
    descriptors?: readonly ToolDescriptor[];
  }): Promise<ToolExecutionResult | undefined> {
    try {
      const executor = new FixtureToolExecutor(
        [...(input.descriptors ?? BRAIN_TOOL_REGISTRY_DESCRIPTORS)],
        BRAIN_TOOL_REGISTRY_POLICY,
      );
      return await executor.execute({
        request: input.request,
        evaluatedAt: this.now().toISOString(),
      });
    } catch {
      return undefined;
    }
  }

  private createBrainToolLifecycle(input: {
    selectedToolId: string | undefined;
    safety: ToolPolicyDecision | undefined;
    execution: ToolExecutionResult | undefined;
    fallbackReasonCode: string | undefined;
    dispatchStatus: BrainCommandResult["dispatchStatus"];
  }): BrainToolProductLoop["lifecycle"] {
    const steps: BrainToolProductLoop["lifecycle"] = [
      {
        stage: "received",
        status: "completed",
        label: "BrainCommand received",
      },
      {
        stage: "routed",
        status: "completed",
        label: "Intent routed",
      },
      {
        stage: "tool_selected",
        status: input.selectedToolId === undefined ? "blocked" : "completed",
        label:
          input.selectedToolId === undefined
            ? "No bounded tool selected"
            : `Selected ${input.selectedToolId}`,
        ...(input.selectedToolId === undefined
          ? { reasonCode: "TOOL_NOT_ALLOWLISTED" }
          : {}),
      },
    ];
    if (input.fallbackReasonCode !== undefined) {
      steps.splice(2, 0, {
        stage: "fallback",
        status: "degraded",
        label: "Fallback path preserved",
        reasonCode: input.fallbackReasonCode,
      });
    }
    if (input.safety !== undefined) {
      steps.push({
        stage: "safety_checked",
        status: input.safety.allowed
          ? "completed"
          : input.safety.status === "needs_confirmation"
            ? "needs_confirmation"
            : "blocked",
        label: "Safety policy evaluated",
        reasonCode: input.safety.reasonCode,
      });
    }
    if (input.safety?.confirmationRequired) {
      steps.push({
        stage: "confirmation",
        status: input.safety.allowed ? "completed" : "needs_confirmation",
        label: input.safety.audit.confirmationGranted
          ? "Confirmation granted"
          : "Confirmation required",
        reasonCode: input.safety.reasonCode,
      });
    }
    if (input.execution !== undefined) {
      steps.push({
        stage: "fixture_replayed",
        status: this.brainToolLifecycleStatus(input.execution.status),
        label: "Fixture replay completed",
        reasonCode: input.execution.resultCode,
      });
      steps.push({
        stage: "rollback",
        status:
          input.execution.rollbackState === "failed" ? "degraded" : "completed",
        label: `Rollback ${input.execution.rollbackState}`,
        reasonCode:
          input.execution.rollbackState === "failed"
            ? "TOOL_ROLLBACK_FAILED"
            : "TOOL_ROLLBACK_NOT_REQUIRED",
      });
    }
    steps.push({
      stage: "result",
      status:
        input.dispatchStatus === "completed"
          ? "completed"
          : input.dispatchStatus === "needs_approval"
            ? "needs_confirmation"
            : input.dispatchStatus,
      label: "Projected UI result",
    });
    return steps.slice(0, 12);
  }

  private brainToolLifecycleStatus(
    status: ToolExecutionResult["status"],
  ): BrainToolProductLoop["lifecycle"][number]["status"] {
    if (status === "completed") {
      return "completed";
    }
    if (status === "needs_confirmation") {
      return "needs_confirmation";
    }
    if (
      status === "degraded" ||
      status === "timed_out" ||
      status === "cancelled"
    ) {
      return "degraded";
    }
    return "blocked";
  }

  private brainToolFallbackReason(
    planning: CoreBrainPlanningOutcome,
  ): string | undefined {
    if (
      planning.selection.usedRulesFallback &&
      (planning.selection.status === "fallback" ||
        planning.selection.status === "unavailable")
    ) {
      return planning.selection.reasonCode;
    }
    return undefined;
  }

  private brainToolRouteReasonCode(input: {
    decision: BrainRouterDecision;
    planning: CoreBrainPlanningOutcome;
  }): string {
    if (input.decision.intent === "blocked") {
      return "UNSAFE_OR_BLOCKED";
    }
    if (input.planning.selection.usedPlanner) {
      return input.planning.selection.reasonCode;
    }
    return "PROVIDER_ACCEPTED";
  }

  private brainToolProductLoopSummary(input: {
    selectedToolId: string | undefined;
    safety: ToolPolicyDecision | undefined;
    execution: ToolExecutionResult | undefined;
    fallbackReasonCode: string | undefined;
  }): string {
    if (input.selectedToolId === undefined) {
      return "No bounded fixture tool was selected; the product loop failed closed.";
    }
    const safety = input.safety?.reasonCode ?? "UNKNOWN_SANITIZED_FAILURE";
    const result = input.execution?.resultCode ?? "UNKNOWN_SANITIZED_FAILURE";
    const fallback = input.fallbackReasonCode
      ? ` Fallback preserved: ${input.fallbackReasonCode}.`
      : "";
    return `Selected ${input.selectedToolId}; safety ${safety}; fixture result ${result}.${fallback}`;
  }

  private brainToolRegistryDescriptors(
    decision: BrainRouterDecision,
  ): ToolDescriptor[] {
    if (
      !this.isCommandRouterFixtureReplayEnabled() ||
      decision.intent !== "localApp.open" ||
      !this.isCommandRouterLocalAppFixtureAllowlisted(
        String(decision.slots.target ?? ""),
      )
    ) {
      return [...BRAIN_TOOL_REGISTRY_DESCRIPTORS];
    }
    return BRAIN_TOOL_REGISTRY_DESCRIPTORS.map((descriptor) =>
      descriptor.id === "localApp.open"
        ? {
            ...descriptor,
            description:
              "Replay a local-application allowlist route as a fixture-only dry run.",
            risk: "read_only",
            requiresConfirmation: false,
          }
        : descriptor,
    );
  }

  private brainToolLabel(toolId: string): string {
    switch (toolId) {
      case "browser.open":
        return "Browser";
      case "localApp.open":
        return "Local app";
      case "notepad.writeText":
        return "Notepad";
      case "window.focus":
        return "Window focus";
      case "window.minimize":
        return "Window minimize";
      case "window.restore":
        return "Window restore";
      case "chat.answer":
        return "Chat";
      case "memory.search":
        return "Memory search";
      case "memory.status":
        return "Memory status";
      case "model.status":
        return "Model status";
      case "observability.status":
        return "Observability";
      case "system.settings":
        return "Settings";
      default:
        return "Unknown";
    }
  }

  private async dispatchBrainPlannerOutcome(input: {
    planning: CoreBrainPlanningOutcome;
    basePlan: BrainPlanStep[];
    envelope: CommandEnvelope;
    source: "text" | "voice";
    decision: BrainRouterDecision;
  }): Promise<
    | {
        dispatchStatus: BrainCommandResult["dispatchStatus"];
        plan: BrainPlanStep[];
        summary: string;
      }
    | undefined
  > {
    const result = input.planning.result;
    if (input.planning.selection.status === "planned" && result?.plan) {
      await this.persistMinimalPlannerTask({
        envelope: input.envelope,
        source: input.source,
        decision: input.decision,
        plannerResult: result,
      });
      const projectedPlan = this.projectBrainPlannerSteps(
        input.basePlan,
        result.plan.steps,
      );
      return {
        dispatchStatus: "needs_approval",
        plan: projectedPlan,
        summary:
          result.providerId === DETERMINISTIC_MINIMAL_PLANNER_PROVIDER_ID
            ? "Minimal Planner prepared a bounded plan and saved it to Task Runtime for review. No tool execution was attempted."
            : "Heavy Planner prepared a bounded plan that requires confirmation before any tool execution.",
      };
    }
    if (input.planning.selection.status === "clarify") {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan([
          ...input.basePlan,
          {
            id: "planner",
            title: "Request clarification",
            status: "blocked",
          },
        ]),
        summary:
          result?.clarifyQuestion ??
          "Heavy Planner needs clarification before this can proceed safely.",
      };
    }
    if (input.planning.selection.status === "blocked") {
      return {
        dispatchStatus: "blocked",
        plan: this.blockFinalBrainPlan([
          ...input.basePlan,
          {
            id: "planner",
            title: "Block unsafe plan",
            status: "blocked",
          },
        ]),
        summary: "Heavy Planner blocked this request before execution.",
      };
    }
    return undefined;
  }

  private projectBrainPlannerSteps(
    basePlan: BrainPlanStep[],
    plannedSteps: NonNullable<BrainPlannerResult["plan"]>["steps"],
  ): BrainPlanStep[] {
    const visiblePlannedSteps = plannedSteps.slice(0, 4).map((step, index) => ({
      id: `planned-${index + 1}`,
      title: `${step.title} [${step.toolId}]`,
      status: "pending" as const,
    }));
    return [
      ...basePlan.filter((step) => step.id !== "dispatch"),
      {
        id: "planner",
        title: "Prepare bounded BrainPlan",
        status: "completed",
      },
      ...visiblePlannedSteps,
      {
        id: "confirmation",
        title: "Wait for user confirmation before execution",
        status: "pending",
      },
    ];
  }

  private async persistMinimalPlannerTask(input: {
    envelope: CommandEnvelope;
    source: "text" | "voice";
    decision: BrainRouterDecision;
    plannerResult: BrainPlannerResult;
  }): Promise<void> {
    const repository = this.taskRepository;
    const plan = input.plannerResult.plan;
    if (!repository || !plan) {
      return;
    }
    const taskId = createId("task");
    const createdAt = this.now().toISOString();
    await repository.createTask({
      id: taskId,
      title: "Review Minimal Plan",
      state: "planning",
      createdAt,
      updatedAt: createdAt,
      source: input.source,
      intent: input.decision.intent,
      routeSource: "intent-router.deterministic.rules",
    });
    await repository.createEvent({
      id: createId("task-event"),
      taskId,
      type: "created",
      message: "Task created from Minimal Planner draft route.",
      createdAt,
    });
    for (const [index, step] of plan.steps.slice(0, 6).entries()) {
      await repository.createStep({
        id: createId("step"),
        taskId,
        title: `${index + 1}. ${step.title} [${step.toolId}]`,
        state: "pending",
        verificationStatus: "not_applicable",
        toolId: step.toolId,
        toolInput: step.args,
      });
    }
    const waitingAt = this.now().toISOString();
    await repository.updateTask({
      id: taskId,
      state: "awaiting_confirmation",
      updatedAt: waitingAt,
      verificationSummary:
        `Minimal Planner (${input.plannerResult.providerId}) saved a bounded plan draft; no tool execution was attempted.`,
    });
    await repository.createEvent({
      id: createId("task-event"),
      taskId,
      type: "state_changed",
      message:
        `Planner draft from ${input.plannerResult.providerId} is awaiting explicit user confirmation before any step can run.`,
      createdAt: waitingAt,
    });
    await this.refreshTasksFromRepository();
    this.publishSnapshot(input.envelope.correlationId);
  }

  private brainDecision(input: {
    intent: BrainIntent;
    confidence: number;
    requiresApproval: boolean;
    slots: Record<string, unknown>;
    reason: string;
  }): BrainRouterDecision {
    return BrainRouterDecisionSchema.parse(input);
  }

  private brainPlannerSelection(input: {
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

  private brainPlannerProviderId(): string {
    const providerId = this.brainPlanner?.providerId?.trim();
    return providerId && providerId.length > 0
      ? providerId
      : "heavy-planner.fixture";
  }

  private shouldUseBrainPlanner(input: {
    text: string;
    routing: CoreBrainRoutingOutcome;
  }): boolean {
    return this.deterministicPlannerService.shouldPlan({
      options: this.brainPlanner,
      text: input.text,
      routing: input.routing,
    });
  }
  private brainRouterSelection(input: {
    selectedProviderId: string;
    fallbackProviderId?: string;
    status: BrainRouterSelectionReport["status"];
    reasonCode: BrainRouterSelectionReport["reasonCode"];
    failureClass: BrainRouterSelectionReport["failureClass"];
    confidenceBand: BrainRouterSelectionReport["confidenceBand"];
    usedRulesFallback: boolean;
  }): BrainRouterSelectionReport {
    return BrainRouterSelectionReportSchema.parse({
      ...input,
      directActionAttempted: false,
    });
  }

  private brainRouterProviderId(
    options: CoreBrainRouterOptions | undefined = this.brainRouter,
  ): string {
    const providerId = options?.providerId?.trim();
    return providerId && providerId.length > 0
      ? providerId
      : "intent-router.configured";
  }

  private brainRouterConfidenceBand(
    confidence: number | undefined,
  ): BrainRouterSelectionReport["confidenceBand"] {
    if (confidence === undefined || !Number.isFinite(confidence)) {
      return "none";
    }
    return confidence >=
      (this.brainRouter?.minConfidence ?? DEFAULT_BRAIN_ROUTER_MIN_CONFIDENCE)
      ? "accepted"
      : "low";
  }

  private mapBrainRouterIntent(intent: string): BrainIntent | undefined {
    if ((BRAIN_ROUTER_ALLOWED_INTENTS as readonly string[]).includes(intent)) {
      return intent as BrainIntent;
    }
    if (intent === "agent.help" || intent === "chat" || intent === "help") {
      return "chat.answer";
    }
    if (intent === "system.status" || intent === "runtime.status") {
      return "observability.status";
    }
    return undefined;
  }

  private normalizeBrainRouterSlots(
    intent: BrainIntent,
    slots: Record<string, unknown>,
    text: string,
  ): Record<string, unknown> {
    const target = typeof slots.target === "string" ? slots.target.trim() : "";
    if (
      target.length > 0 ||
      (intent !== "browser.open" && intent !== "localApp.open")
    ) {
      return { ...slots, ...(target.length > 0 ? { target } : {}) };
    }
    const openTarget = this.extractOpenTarget(text);
    return openTarget ? { ...slots, target: openTarget } : { ...slots };
  }

  private brainPlan(intent: BrainIntent): BrainPlanStep[] {
    return [
      {
        id: "intake",
        title: "Receive command",
        status: "completed",
      },
      {
        id: "route",
        title: `Route intent: ${intent}`,
        status: "completed",
      },
      {
        id: "dispatch",
        title: "Dispatch bounded capability",
        status: "pending",
      },
    ];
  }

  private completeBrainPlan(plan: BrainPlanStep[]): BrainPlanStep[] {
    return plan.map((step) =>
      step.id === "dispatch" ? { ...step, status: "completed" } : step,
    );
  }

  private blockFinalBrainPlan(plan: BrainPlanStep[]): BrainPlanStep[] {
    return plan.map((step) =>
      step.id === "dispatch" ? { ...step, status: "blocked" } : step,
    );
  }

  private extractOpenTarget(text: string): string | undefined {
    const trimmed = text.trim();
    const zhClean = trimmed.match(
      /^(?:请|请帮我|帮我|麻烦)?(?:打开|启动|访问|浏览)\s*(.+?)\s*$/u,
    );
    if (zhClean?.[1]) {
      return this.normalizeOpenTargetCandidate(zhClean[1]);
    }
    const zhReadable = trimmed.match(
      /^(?:请|帮我|麻烦)?(?:打开|开启|访问|浏览)\s*(.+?)\s*$/u,
    );
    if (zhReadable?.[1]) {
      return this.normalizeOpenTargetCandidate(zhReadable[1]);
    }
    const zh = trimmed.match(
      /^(?:请)?(?:帮我)?(?:打开|开启|访问|浏览)\s+(.+?)\s*$/u,
    );
    if (zh?.[1]) {
      return this.normalizeOpenTargetCandidate(zh[1]);
    }
    const en = trimmed.match(/^(?:open|visit|go to|launch)\s+(.+?)\s*$/iu);
    if (en?.[1]) {
      return this.normalizeOpenTargetCandidate(en[1]);
    }
    return undefined;
  }

  private normalizeOpenTargetCandidate(target: string): string | undefined {
    const cleaned = this.stripCommandSpeechPunctuation(target);
    const firstClause = cleaned.split(/[，,、;；]/u)[0]?.trim();
    if (
      firstClause !== undefined &&
      firstClause.length > 0 &&
      this.commandRouterRealLocalAppLaunchLabel(firstClause) !== "blocked"
    ) {
      return firstClause;
    }
    return cleaned.length > 0 ? cleaned : undefined;
  }

  private stripCommandSpeechPunctuation(value: string): string {
    return value
      .trim()
      .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/gu, "")
      .replace(/[\s，,。.!！?？;；:：、]+$/gu, "")
      .trim();
  }

  private extractPluginInvocation(text: string):
    | {
        pluginId: string;
        capability: string;
        input: Record<string, string>;
      }
    | undefined {
    const trimmed = text.trim();
    const normalized = trimmed.toLowerCase();
    if (
      /(?:stock|quote|ticker|股票|股价|行情)/iu.test(normalized) &&
      !/(?:trade|trading|order|checkout|payment|purchase|buy|sell|交易|下单|支付|付款|购买|买入|卖出)/iu.test(
        normalized,
      )
    ) {
      return {
        pluginId: "cn.jarvis-k.stock-analysis",
        capability: "stock.quote",
        input: {
          symbol: this.extractStockSymbol(trimmed),
        },
      };
    }
    if (
      /(?:product\s+compare|compare\s+products?|e-?commerce|shopping\s+compare|商品比较|电商比较|比较商品|商品对比|电商对比)/iu.test(
        normalized,
      ) &&
      !/(?:order|checkout|payment|purchase|buy|下单|支付|付款|购买|买入)/iu.test(
        normalized,
      )
    ) {
      return {
        pluginId: "cn.jarvis-k.ecommerce-comparison",
        capability: "product.compare",
        input: {
          query: this.extractProductComparisonQuery(trimmed),
        },
      };
    }
    if (
      /(?:bargain|haggle|negotiate|discount\s+draft|discount\s+advice|砍价|讲价|议价|还价)/iu.test(
        normalized,
      ) &&
      !/(?:order|checkout|payment|purchase|buy|send|submit|contact\s+seller|message\s+seller|下单|支付|付款|购买|买入|发送|提交|联系卖家)/iu.test(
        normalized,
      )
    ) {
      return {
        pluginId: "cn.jarvis-k.ecommerce-comparison",
        capability: "product.bargain.advice",
        input: {
          query: this.extractProductBargainAdviceQuery(trimmed),
        },
      };
    }
    const helloLookup = trimmed.match(
      /^(?:hello\s+plugin|plugin\s+hello|hello\s+lookup|local\s+plugin\s+hello)\s+(.+?)\s*$/iu,
    );
    if (helloLookup?.[1]) {
      return {
        pluginId: "cn.example.hello-readonly",
        capability: "hello.lookup",
        input: {
          name: this.normalizeHelloLookupName(helloLookup[1]),
        },
      };
    }
    return undefined;
  }

  private normalizeHelloLookupName(text: string): string {
    const cleaned = text
      .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
      .trim()
      .replace(/\s+/gu, " ")
      .slice(0, 40);
    return cleaned || "Jarvis";
  }

  private extractStockSymbol(text: string): string {
    const explicit = text.match(
      /\b(?:symbol|ticker)\s*[:：]?\s*([A-Z]{1,8})\b/u,
    );
    if (explicit?.[1]) {
      return explicit[1].toUpperCase();
    }
    const upper = text.match(/\b[A-Z]{1,8}\b/u);
    return upper?.[0]?.toUpperCase() ?? "JVS";
  }

  private extractProductComparisonQuery(text: string): string {
    const cleaned = text
      .replace(/(?:please|帮我|请|麻烦)/giu, " ")
      .replace(
        /(?:product\s+compare|compare\s+products?|e-?commerce|shopping\s+compare|商品比较|电商比较|比较商品|商品对比|电商对比)/giu,
        " ",
      )
      .trim()
      .replace(/\s+/gu, " ");
    if (cleaned.length >= 1 && cleaned.length <= 120) {
      return cleaned;
    }
    return "sample product";
  }

  private extractProductBargainAdviceQuery(text: string): string {
    const cleaned = text
      .replace(
        /(?:please|help\s+me|give\s+me|draft|advice|帮我|请|生成)/giu,
        " ",
      )
      .replace(
        /(?:bargain|haggle|negotiate|discount\s+draft|discount\s+advice|砍价|讲价|议价|还价|话术|建议)/giu,
        " ",
      )
      .trim()
      .replace(/\s+/gu, " ");
    if (cleaned.length >= 1 && cleaned.length <= 120) {
      return cleaned;
    }
    return "sample product";
  }

  private extractFilesystemSearchQuery(text: string): string | undefined {
    const trimmed = text.trim();
    const patterns = [
      /^(?:please\s+)?(?:find|search|look\s+for)\s+(?:files?\s+(?:named|called)\s+|documents?\s+(?:named|called)\s+|downloads?\s+(?:named|called)\s+|for\s+)?(.+?)\s*$/iu,
      /^(?:请|请帮我|帮我|麻烦)?(?:找|搜索|查找)\s*(?:文件|文档|下载|桌面)?\s*(.+?)\s*$/u,
    ];
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      const query = match?.[1]?.trim();
      if (
        query &&
        query.length >= 1 &&
        query.length <= 120 &&
        !/[\\/:*?"<>|]/u.test(query) &&
        !/(?:\.\.|[A-Za-z]:\\|\\\\)/u.test(query)
      ) {
        return query;
      }
    }
    return undefined;
  }

  private extractNotepadWriteText(text: string): string | undefined {
    const trimmed = text.trim();
    const patterns = [
      /^(?:please\s+)?(?:write|type)\s+["']?(.+?)["']?\s+(?:in|into|to)\s+notepad\s*$/iu,
      /^(?:please\s+)?(?:write|type)\s+(?:notepad\s+)?text\s+["']?(.+?)["']?\s*$/iu,
      /^(?:\u8bf7|\u8bf7\u5e2e\u6211|\u5e2e\u6211|\u9ebb\u70e6)?(?:\u6253\u5f00|\u542f\u52a8)?\s*\u8bb0\u4e8b\u672c\s*(?:[\uFF0C,\u3001;；])?\s*(?:\u5e76|\u7136\u540e)?\s*(?:\u8f93\u5165|\u5199\u5165|\u5199\u4e0a|\u6253\u5b57)\s*["'\u201c\u201d]?(.+?)["'\u201c\u201d]?\s*$/u,
      /^(?:\u8bf7|\u8bf7\u5e2e\u6211|\u5e2e\u6211|\u9ebb\u70e6)?(?:\u5728)?\s*\u8bb0\u4e8b\u672c(?:\u91cc|\u4e2d)?\s*(?:\u8f93\u5165|\u5199\u5165|\u5199\u4e0a|\u6253\u5b57)\s*["'\u201c\u201d]?(.+?)["'\u201c\u201d]?\s*$/u,
    ];
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      const candidate = match?.[1]?.trim();
      if (candidate !== undefined) {
        return this.normalizeNotepadWriteText(candidate);
      }
    }
    return undefined;
  }

  private extractKnownAppWindowControl(text: string):
    | {
        action: CoreKnownAppWindowAction;
        target: CommandRouterKnownLocalAppLabel;
      }
    | undefined {
    const trimmed = text.trim();
    const match = trimmed.match(
      /^(?:please\s+)?(focus|minimize|restore)\s+(?:the\s+)?(.+?)(?:\s+window)?\s*$/iu,
    );
    const action = match?.[1]?.toLowerCase();
    const rawTarget = match?.[2]?.trim();
    if (action !== "focus" && action !== "minimize" && action !== "restore") {
      return undefined;
    }
    if (rawTarget === undefined) {
      return undefined;
    }
    const target = this.commandRouterRealLocalAppLaunchLabel(rawTarget);
    if (target === "blocked") {
      return undefined;
    }
    return { action, target };
  }

  private normalizeNotepadWriteText(text: string): string | undefined {
    const trimmed = text
      .trim()
      .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/gu, "")
      .replace(/[。！？]+$/gu, "")
      .trim();
    if (/[\u0000-\u001f\u007f]/u.test(trimmed)) {
      return undefined;
    }
    const normalized = trimmed.replace(/\s+/gu, " ");
    if (
      normalized.length === 0 ||
      normalized.length > 160 ||
      !/^[A-Za-z0-9 .,;:'"!?_-]+$/u.test(normalized)
    ) {
      return undefined;
    }
    return normalized;
  }

  private looksLikeLocalApp(target: string): boolean {
    if (this.commandRouterRealLocalAppLaunchLabel(target) !== "blocked") {
      return true;
    }
    const normalized = target.toLowerCase();
    if (/记事本|计算器|微信|浏览器|软件|应用|代码/u.test(normalized)) {
      return true;
    }
    if (
      [
        "wechat",
        "vscode",
        "visual studio code",
        "notepad",
        "calculator",
        "calc",
        "chrome",
        "edge",
        "app",
      ].some((keyword) => normalized.includes(keyword))
    ) {
      return true;
    }
    if (
      /微信|wechat|vscode|visual studio code|notepad|记事本|chrome|edge|浏览器|软件|应用|app/u.test(
        normalized,
      )
    ) {
      return true;
    }
    return /微信|wechat|vscode|visual studio code|notepad|记事本|chrome|edge|浏览器|软件|应用|app/u.test(
      normalized,
    );
  }

  private async acceptMessage(input: {
    envelope: CommandEnvelope;
    role: Message["role"];
    text: string;
    conversationId?: string;
    recall: boolean;
  }): Promise<
    | {
        ok: true;
        message: Message;
        memoryRecall?: CoreMemoryRecallObservation;
      }
    | {
        ok: false;
        result: CommandResult;
      }
  > {
    const conversationId = await this.resolveMessageConversationId(
      input.conversationId,
    );
    const message: Message = {
      id: createId("msg"),
      conversationId,
      role: input.role,
      text: input.text,
      createdAt: this.now().toISOString(),
    };
    if (this.memoryRepository) {
      try {
        await this.memoryRepository.appendMessage(message);
        if (!this.activeConversationId) {
          await this.memoryRepository.setActiveConversationId(conversationId);
        }
        await this.refreshConversationState();
        this.health = "ready";
      } catch {
        this.health = "degraded";
        return {
          ok: false,
          result: this.failure(input.envelope, {
            code: "MEMORY_WRITE_FAILED",
            message: "Unable to persist the accepted message.",
            retryable: true,
          }),
        };
      }
    } else {
      this.upsertLocalConversationForMessage(message);
    }
    this.messages.push(message);
    this.publish(
      {
        type: "agent.message.accepted",
        payload: message,
      },
      input.envelope.correlationId,
    );
    const memoryRecall =
      input.recall && input.role === "user"
        ? await this.retrieveMemoryRecallForAcceptedMessage(message)
        : undefined;
    return {
      ok: true,
      message,
      ...(memoryRecall ? { memoryRecall } : {}),
    };
  }

  private async retrieveMemoryRecallForAcceptedMessage(
    message: Message,
  ): Promise<CoreMemoryRecallObservation | undefined> {
    return this.memoryRecallService.retrieveForAcceptedMessage(message);
  }

  private async executeInferenceOperation<T>(
    envelope: CommandEnvelope,
    input: {
      capability: ModelOperationSnapshot["capability"];
      modelId: string;
      execute: () => Promise<T>;
      parseResult: (result: unknown) => T;
      completedReason: string;
      failureCode: string;
      failureMessage: string;
    },
  ): Promise<CommandResult> {
    if (!this.modelRegistry || !this.inferenceExecutionPlanner) {
      return this.modelsUnavailable(envelope);
    }

    let operation: ModelOperationSnapshot | undefined;
    try {
      operation = await this.startModelOperation(
        {
          modelId: input.modelId,
          capability: input.capability,
          phase: "prechecking",
        },
        envelope.correlationId,
      );
      const manifest = await this.modelRegistry.getManifest(input.modelId);
      if (!manifest) {
        operation = await this.updateModelOperation(
          operation,
          {
            phase: "blocked",
            reasons: ["Model manifest was not found."],
          },
          envelope.correlationId,
        );
        return this.failure(envelope, {
          code: "MODEL_MANIFEST_NOT_FOUND",
          message: "Model manifest was not found.",
          retryable: false,
          ...(operation
            ? { details: { operationId: operation.operationId } }
            : {}),
        });
      }

      const report = await this.inferenceExecutionPlanner.preview({
        capability: input.capability,
        manifest: ModelManifestSchema.parse(manifest),
      });
      if (!report.allowed) {
        operation = await this.updateModelOperation(
          operation,
          {
            phase: "blocked",
            reasons: report.reasons,
          },
          envelope.correlationId,
        );
        return this.failure(envelope, {
          code: "INFERENCE_PREFLIGHT_BLOCKED",
          message: "Inference preflight blocked execution.",
          retryable: false,
          details: {
            capability: report.capability,
            modelId: report.modelId,
            reasons: report.reasons,
            ...(operation ? { operationId: operation.operationId } : {}),
          },
        });
      }

      operation = await this.updateModelOperation(
        operation,
        {
          phase: "executing",
          reasons: [`${input.capability} inference preflight passed.`],
        },
        envelope.correlationId,
      );
      const result = input.parseResult(await input.execute());
      operation = await this.updateModelOperation(
        operation,
        {
          phase: "completed",
          reasons: [input.completedReason],
        },
        envelope.correlationId,
      );
      return this.success(envelope, {
        result,
        ...(operation ? { operation } : {}),
      });
    } catch {
      await this.updateModelOperation(
        operation,
        {
          phase: "failed",
          reasons: [input.failureMessage],
          error: {
            code: input.failureCode,
            message: input.failureMessage,
            retryable: true,
          },
        },
        envelope.correlationId,
      );
      return this.failure(envelope, {
        code: input.failureCode,
        message: input.failureMessage,
        retryable: true,
      });
    }
  }

  private async startModelOperation(
    input: {
      modelId: string;
      capability: ModelOperationSnapshot["capability"];
      phase: ModelOperationSnapshot["phase"];
    },
    correlationId?: string,
  ): Promise<ModelOperationSnapshot | undefined> {
    if (!this.modelOperationSupervisor) {
      return undefined;
    }
    const operation = await this.modelOperationSupervisor.start(input);
    this.handleModelOperationUpdated(operation, correlationId);
    return operation;
  }

  private async updateModelOperation(
    operation: ModelOperationSnapshot | undefined,
    input: {
      phase: ModelOperationSnapshot["phase"];
      reasons?: string[];
      error?: StructuredError;
    },
    correlationId?: string,
  ): Promise<ModelOperationSnapshot | undefined> {
    if (!operation || !this.modelOperationSupervisor) {
      return operation;
    }
    const updated = await this.modelOperationSupervisor.update({
      operationId: operation.operationId,
      ...input,
    });
    this.handleModelOperationUpdated(updated, correlationId);
    return updated;
  }

  private publishSnapshot(correlationId?: string): CoreSnapshot {
    const nextSequenceId = this.sequenceId + 1;
    const snapshot = {
      ...this.getSnapshot(),
      sequenceId: nextSequenceId,
    };
    this.publish(
      {
        type: "state.snapshot",
        payload: snapshot,
      },
      correlationId,
    );
    return snapshot;
  }

  private publish(event: AppEvent, correlationId: string | undefined): void {
    this.sequenceId += 1;
    const envelope: EventEnvelope = {
      protocolVersion: PROTOCOL_VERSION,
      eventId: createId("evt"),
      sequenceId: this.sequenceId,
      createdAt: this.now().toISOString(),
      source: "core",
      event,
      ...(correlationId ? { correlationId } : {}),
    };
    this.eventSink(envelope);
  }

  private async refreshMemoryHealth(): Promise<MemoryHealth> {
    if (!this.memoryRepository) {
      this.memoryHealth = MemoryHealthSchema.parse({
        status: "ok",
        checkedAt: this.now().toISOString(),
      });
      return this.memoryHealth;
    }
    try {
      this.memoryHealth = MemoryHealthSchema.parse(
        await this.memoryRepository.checkHealth(),
      );
      this.health = this.memoryHealth.status === "ok" ? "ready" : "degraded";
      return this.memoryHealth;
    } catch {
      this.health = "degraded";
      this.memoryHealth = this.degradedMemoryHealth();
      return this.memoryHealth;
    }
  }

  private async refreshConversationState(): Promise<void> {
    if (!this.memoryRepository) {
      return;
    }
    this.replaceConversations(await this.memoryRepository.listConversations());
    this.activeConversationId =
      await this.memoryRepository.getActiveConversationId();
  }

  private replaceConversations(conversations: Conversation[]): void {
    this.conversations.splice(
      0,
      this.conversations.length,
      ...conversations.map((conversation) => ({ ...conversation })),
    );
  }

  private replaceMemorySnapshot(snapshot: MemorySnapshot): void {
    this.messages.splice(
      0,
      this.messages.length,
      ...snapshot.messages.map((message) => ({ ...message })),
    );
    this.conversations.splice(
      0,
      this.conversations.length,
      ...snapshot.conversations.map((conversation) => ({
        ...conversation,
      })),
    );
    this.activeConversationId = snapshot.activeConversationId;
  }

  private replaceModelOperations(operations: ModelOperationSnapshot[]): void {
    this.modelOperations.splice(
      0,
      this.modelOperations.length,
      ...operations.map((operation) =>
        ModelOperationSnapshotSchema.parse(operation),
      ),
    );
  }

  private getMemoryAlphaStatus(): MemoryAlphaStatus {
    if (!this.memoryAlphaSession) {
      return MemoryAlphaStatusSchema.parse({
        state: "disabled",
        enabled: false,
        retentionScope: "new_accepted_user_messages",
        maxMessageCount: 5,
        trackedMessageCount: 0,
        rollbackStatus: "not_started",
        rollbackDeletedCount: 0,
        reasonCodes: ["memory_alpha_unavailable"],
      });
    }
    try {
      return MemoryAlphaStatusSchema.parse(this.memoryAlphaSession.getStatus());
    } catch {
      return MemoryAlphaStatusSchema.parse({
        state: "degraded",
        enabled: false,
        retentionScope: "new_accepted_user_messages",
        maxMessageCount: 5,
        trackedMessageCount: 0,
        rollbackStatus: "degraded",
        rollbackDeletedCount: 0,
        reasonCodes: ["memory_alpha_unavailable"],
      });
    }
  }

  private async probeMemoryAlphaRecall(input: {
    text: string;
    conversationId?: string;
  }): Promise<MemoryAlphaRecallProbeResult> {
    const memoryAlpha = this.getMemoryAlphaStatus();
    const generatedAt = this.now().toISOString();
    if (!memoryAlpha.enabled || memoryAlpha.state !== "active") {
      return MemoryAlphaRecallProbeResultSchema.parse({
        status: "disabled",
        mode: this.memoryRecallService.mode(),
        enabled: false,
        matchCount: 0,
        queryDimensions: 0,
        generatedAt,
        reasonCode: "MEMORY_ALPHA_DISABLED",
      });
    }

    const recall = await this.retrieveMemoryRecallForAcceptedMessage({
      id: createId("memory-alpha-probe"),
      conversationId:
        input.conversationId ?? this.activeConversationId ?? "primary",
      role: "user",
      text: input.text,
      createdAt: generatedAt,
    });
    if (!recall) {
      return MemoryAlphaRecallProbeResultSchema.parse({
        status: "disabled",
        mode: this.memoryRecallService.mode(),
        enabled: false,
        matchCount: 0,
        queryDimensions: 0,
        generatedAt,
        reasonCode: "MEMORY_ALPHA_DISABLED",
      });
    }

    return MemoryAlphaRecallProbeResultSchema.parse({
      status: recall.status,
      mode: recall.mode,
      enabled: true,
      matchCount: recall.matchCount,
      queryDimensions: recall.queryDimensions,
      generatedAt: recall.generatedAt,
      ...(recall.reasonCode === undefined
        ? {}
        : { reasonCode: recall.reasonCode }),
      ...(recall.failureClass === undefined
        ? {}
        : { failureClass: recall.failureClass }),
    });
  }

  private memoryRecallObservationFromProbe(
    probe: MemoryAlphaRecallProbeResult,
  ): CoreMemoryRecallObservation {
    return {
      status: probe.status === "ok" ? "ok" : "degraded",
      mode: probe.mode,
      injectedIntoTurnAssembly: false,
      modelId: "blocked",
      queryDimensions: probe.queryDimensions,
      matchCount: Math.min(5, probe.matchCount),
      matches: [],
      generatedAt: probe.generatedAt,
      ...(probe.reasonCode === undefined
        ? {}
        : { reasonCode: probe.reasonCode }),
      ...(probe.failureClass === undefined
        ? {}
        : { failureClass: probe.failureClass }),
    };
  }

  private async resolveMessageConversationId(
    explicitConversationId: string | undefined,
  ): Promise<string> {
    if (explicitConversationId) {
      return explicitConversationId;
    }
    if (this.activeConversationId) {
      return this.activeConversationId;
    }
    if (this.memoryRepository) {
      try {
        const activeConversationId =
          await this.memoryRepository.getActiveConversationId();
        if (activeConversationId) {
          this.activeConversationId = activeConversationId;
          return activeConversationId;
        }
      } catch {
        this.health = "degraded";
      }
    }
    return "primary";
  }

  private async ensureLocalPluginStateRepositoryInitialized(): Promise<void> {
    if (
      !this.localPluginStateRepository ||
      this.localPluginStateRepositoryInitialized
    ) {
      return;
    }
    await this.localPluginStateRepository.initialize();
    this.localPluginStateRepositoryInitialized = true;
  }

  private async getLocalPluginEnabledStateRecords(
    plugins: readonly PluginManifest[],
  ): Promise<Map<string, LocalPluginEnabledStateRecord>> {
    const records = new Map<string, LocalPluginEnabledStateRecord>();
    if (!this.localPluginStateRepository) {
      return records;
    }
    await this.ensureLocalPluginStateRepositoryInitialized();
    for (const plugin of plugins) {
      const record = await this.localPluginStateRepository.getState(plugin.id);
      if (record) {
        records.set(plugin.id, record);
      }
    }
    return records;
  }

  private upsertLocalConversationForMessage(message: Message): void {
    const existing = this.conversations.find(
      (conversation) => conversation.id === message.conversationId,
    );
    if (!existing) {
      this.conversations.push({
        id: message.conversationId,
        title: this.defaultConversationTitle(message),
        createdAt: message.createdAt,
        updatedAt: message.createdAt,
        lastMessageAt: message.createdAt,
      });
      this.activeConversationId ??= message.conversationId;
      return;
    }
    existing.updatedAt =
      message.createdAt > existing.updatedAt
        ? message.createdAt
        : existing.updatedAt;
    existing.lastMessageAt =
      existing.lastMessageAt === undefined ||
      message.createdAt > existing.lastMessageAt
        ? message.createdAt
        : existing.lastMessageAt;
  }

  private defaultConversationTitle(message: Message): string {
    const text = message.text.trim().replace(/\s+/g, " ");
    return text.length > 0 ? text.slice(0, 80) : message.conversationId;
  }

  private degradedMemoryHealth(): MemoryHealth {
    return MemoryHealthSchema.parse({
      status: "degraded",
      checkedAt: this.now().toISOString(),
      code: "MEMORY_UNAVAILABLE",
      message: "Memory store is unavailable.",
    });
  }

  private async handleVoiceCommand(
    envelope: CommandEnvelope,
    command: VoiceCommand,
  ): Promise<CommandResult> {
    this.activeVoiceCorrelationId = envelope.correlationId;
    let result: VoiceActionResult;
    try {
      switch (command.type) {
        case "voice.setMode":
          result = await this.voiceEngine.setMode(command.payload.mode);
          break;
        case "voice.startPtt":
          result = this.voiceEngine.startPtt(command.payload.captureId);
          break;
        case "voice.stopPtt":
          result = await this.voiceEngine.stopPtt();
          break;
        case "voice.cancel":
          result = await this.voiceEngine.cancel();
          break;
        case "voice.suspendForTts":
          result = this.voiceEngine.suspendForTts(command.payload.playbackId);
          break;
        case "voice.resumeAfterTts":
          result = await this.voiceEngine.resumeAfterTts(
            command.payload.playbackId,
            command.payload.interrupted,
          );
          break;
        case "voice.reportPermission":
          result = this.voiceEngine.reportPermission(
            command.payload.permission,
          );
          break;
      }
    } finally {
      this.activeVoiceCorrelationId = undefined;
    }

    if (!result.ok) {
      return this.failure(envelope, result.error);
    }

    this.publishSnapshot(envelope.correlationId);
    return this.success(envelope, {
      voice: result.snapshot,
    });
  }

  private success(envelope: CommandEnvelope, data?: unknown): CommandResult {
    return {
      protocolVersion: PROTOCOL_VERSION,
      commandId: envelope.commandId,
      correlationId: envelope.correlationId,
      completedAt: this.now().toISOString(),
      ok: true,
      ...(data === undefined ? {} : { data }),
    };
  }

  private failure(
    envelope: CommandEnvelope,
    error: StructuredError,
  ): CommandResult {
    return {
      protocolVersion: PROTOCOL_VERSION,
      commandId: envelope.commandId,
      correlationId: envelope.correlationId,
      completedAt: this.now().toISOString(),
      ok: false,
      error,
    };
  }

  private memoryUnavailable(envelope: CommandEnvelope): CommandResult {
    return this.failure(envelope, {
      code: "MEMORY_UNAVAILABLE",
      message: "Memory store is unavailable.",
      retryable: true,
    });
  }

  private capabilitiesUnavailable(envelope: CommandEnvelope): CommandResult {
    return this.failure(envelope, {
      code: "CAPABILITIES_UNAVAILABLE",
      message: "Device capability inspection is unavailable.",
      retryable: true,
    });
  }

  private modelsUnavailable(envelope: CommandEnvelope): CommandResult {
    return this.failure(envelope, {
      code: "MODEL_GOVERNANCE_UNAVAILABLE",
      message: "Model governance is unavailable.",
      retryable: true,
    });
  }

  private pluginsUnavailable(envelope: CommandEnvelope): CommandResult {
    return this.failure(envelope, {
      code: "PLUGIN_RUNTIME_UNAVAILABLE",
      message: "Plugin runtime is unavailable.",
      retryable: true,
    });
  }
}

function assessPluginManagementRisk(
  manifest: PluginManifest,
  executable: boolean,
) {
  const capabilityStatuses = manifest.capabilities.map((capability) => {
    const riskTier = pluginCapabilityRiskTier(
      capability.risk,
      capability.readOnly,
    );
    return {
      capability: capability.name,
      manifestRisk: capability.risk,
      riskTier,
      readOnly: capability.readOnly,
      confirmationPolicy: pluginConfirmationPolicyForRisk(riskTier, executable),
    };
  });
  const permissionStatuses = manifest.permissions.map((permission) => {
    const category =
      permission === "storage.plugin" ? "storage_plugin" : "network_https";
    const riskTier = pluginPermissionRiskTier(category);
    return {
      category,
      riskTier,
      permissionState: executable ? "runtime_gated" : "disabled_by_policy",
      confirmationPolicy: pluginConfirmationPolicyForRisk(riskTier, executable),
      reasonCodes: executable
        ? ["PLUGIN_PERMISSION_RUNTIME_GATED"]
        : ["THIRD_PARTY_PERMISSION_DISABLED"],
    };
  });
  const declaredRiskTier = maxPluginRiskTier([
    ...capabilityStatuses.map((status) => status.riskTier),
    ...permissionStatuses.map((status) => status.riskTier),
  ]);

  return {
    declaredRiskTier,
    effectiveRiskTier: declaredRiskTier,
    confirmationPolicy: pluginConfirmationPolicyForRisk(
      declaredRiskTier,
      executable,
    ),
    capabilityStatuses,
    permissionStatuses,
    reasonCodes: [
      ...(declaredRiskTier === "low" ? ["READ_ONLY_LOW_RISK"] : []),
      ...(permissionStatuses.length === 0 ? ["NO_DECLARED_PERMISSIONS"] : []),
      ...Array.from(
        new Set(permissionStatuses.flatMap((status) => status.reasonCodes)),
      ),
      ...(!executable ? ["THIRD_PARTY_EXECUTION_DISABLED"] : []),
    ],
  };
}

function pluginCapabilityRiskTier(
  risk: PluginManifest["capabilities"][number]["risk"],
  readOnly: boolean,
): PluginManagementRiskTier {
  if (!readOnly) {
    return "high";
  }
  if (risk === "critical") {
    return "critical";
  }
  if (risk === "high") {
    return "high";
  }
  if (risk === "medium") {
    return "medium";
  }
  return "low";
}

function pluginPermissionRiskTier(
  category: "storage_plugin" | "network_https",
): PluginManagementRiskTier {
  if (category === "network_https") {
    return "medium";
  }
  return "medium";
}

function pluginConfirmationPolicyForRisk(
  riskTier: PluginManagementRiskTier,
  executable: boolean,
): PluginManagementConfirmationPolicy {
  if (!executable) {
    return "blocked";
  }
  if (riskTier === "critical") {
    return "blocked";
  }
  if (riskTier === "high") {
    return "strong_confirmation";
  }
  if (riskTier === "medium") {
    return "ui_confirmation";
  }
  return "none";
}

function maxPluginRiskTier(
  riskTiers: PluginManagementRiskTier[],
): PluginManagementRiskTier {
  const rank: Record<PluginManagementRiskTier, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };
  return riskTiers.reduce<PluginManagementRiskTier>(
    (highest, riskTier) =>
      rank[riskTier] > rank[highest] ? riskTier : highest,
    "low",
  );
}
