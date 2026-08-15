import { type CoreOutboundMessage } from "@jarvis-k/contracts";
import {
  fixtureModelManifests,
  recommendedModelCandidates,
  StaticModelRegistry,
  StaticModelCandidateRegistry,
  StaticInferenceProviderRegistry,
  PolicyModelInstallationPlanner,
  PolicyModelInstallWorkflowOrchestrator,
  PolicyInferenceExecutionPlanner,
  InMemoryModelOperationSupervisor,
  InMemoryResourceScheduler,
} from "@jarvis-k/capabilities";
import {
  CoreRuntime,
  type CoreChatAnswerOptions,
  type CoreBrainRouterOptions,
} from "@jarvis-k/core";
import { LOCAL_EMBEDDING_MODEL_ID } from "@jarvis-k/inference-adapter-embedding-local";
import {
  createFixtureEmbeddingProviderConfigurationReport,
  createFixtureEmbeddingProviderDescriptor,
  createFixtureIntentRouterConfigurationReport,
  createFixtureIntentRouterDescriptor,
  createFixtureOcrConfigurationReport,
  createFixtureOcrDescriptor,
  createFixtureRerankerConfigurationReport,
  createFixtureRerankerDescriptor,
  FixtureEmbeddingProvider,
  FixtureIntentRoutingProvider,
  FixtureOcrProvider,
  FixtureRerankingProvider,
} from "@jarvis-k/inference-adapter-fixture";
import { QWEN_FAST_ROUTER_MODEL_ID } from "@jarvis-k/inference-adapter-qwen-router";
import {
  DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
  DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
} from "@jarvis-k/inference-adapter-glm-chat-answer-runtime";
import { SqliteMemoryRepository } from "@jarvis-k/memory-sqlite";
import { FileSystemModelLifecycleManager } from "./file-system-model-lifecycle";
import { areMemoryProviderVectorWriteGatesEnabled } from "./memory-provider-vector-write-wiring";
import { createCoreHostMemoryAlphaImplementation } from "./memory-alpha-implementation";
import { createCoreHostLocalEmbeddingComposition } from "./local-embedding-composition";
import { createCoreHostQwenFastRouterComposition } from "./qwen-fast-router-composition";
import { BrainActionAllowlistAdapter } from "./brain-action-allowlist-adapter";
import { createCoreHostFixtureChatAnswerComposition } from "./fixture-chat-answer-composition";
import {
  createCoreHostChatAnswerTextOnlyAcceptanceComposition,
  shouldDisableCoreHostMemoryForChatAnswerTextOnlyAcceptance,
} from "./chat-answer-text-only-acceptance-composition";
import { NodeDeviceCapabilityProvider } from "./node-device-capability-provider";
import { SqliteTaskRepository } from "./sqlite-task-repository";
import { JsonVoiceCommandAliasRepository } from "./voice-command-alias-repository";
import { JsonUserRouteAliasRepository } from "./user-route-alias-repository";
import { JsonUserPreferenceMemoryRepository } from "./user-preference-memory-repository";
import {
  ConfigurableChatAnswerProvider,
  LocalSmokeChatAnswerProvider,
} from "./composition/chat-composition";
import { createCoreHostPluginComposition } from "./composition/plugin-composition";
import {
  createCoreHostPlannerComposition,
} from "./composition/planner-composition";
import { createCoreHostVoiceComposition } from "./composition/voice-composition";
import { loadRuntimeConfig } from "./config/runtime-config";
import { loadCoreHostStoragePaths } from "./config/storage-paths";
import {
  CoreHostMessageHandler,
  createProcessMessageSource,
} from "./host/host-message-handler";
import {
  disposeCoreHostResources,
  hydrateCoreHostAndAnnounceReady,
} from "./host/core-host-bootstrap";
import { RuntimeConfigurationController } from "./host/runtime-configuration-controller";
import {
  ChatAnswerRuntimeBinding,
  type CoreHostActiveChatAnswerRuntime,
} from "./runtime-binding/chat-answer-runtime-binding";
import { PlannerRuntimeBinding } from "./runtime-binding/planner-runtime-binding";

function send(message: CoreOutboundMessage): void {
  if (process.send) {
    process.send(message);
  }
}

const CONTROLLED_CHAT_ANSWER_REAL_RUNTIME_UTTERANCE =
  "Answer in one short sentence: what is Jarvis-K?";

let runtime: CoreRuntime;
const runtimeConfig = loadRuntimeConfig(process.env);
const scheduler = {
  setTimeout: (callback: () => void, delayMs: number) =>
    setTimeout(callback, delayMs),
  clearTimeout: (handle: unknown) => clearTimeout(handle as NodeJS.Timeout),
};
const fixtureChatAnswerEnabled = runtimeConfig.fixtureChatAnswerEnabled;
const providerBackedChatAnswerProductManualAcceptanceRequested =
  runtimeConfig.providerBackedChatAnswerProductManualAcceptanceRequested;
const providerBackedChatAnswerExpandedProductLoopRequested =
  runtimeConfig.providerBackedChatAnswerExpandedProductLoopRequested;
const deepseekChatAnswerEnabled = runtimeConfig.deepseekChatAnswerEnabled;
const chatAnswerTextOnlyAcceptanceRequested =
  runtimeConfig.chatAnswerTextOnlyAcceptanceRequested;
const localSmokeChatAnswerEnabled = runtimeConfig.localSmokeChatAnswerEnabled;
const textOnlyAcceptanceMemoryDisabled =
  shouldDisableCoreHostMemoryForChatAnswerTextOnlyAcceptance({
    enabled: chatAnswerTextOnlyAcceptanceRequested,
    fixtureChatAnswerEnabled,
  });
const storagePaths = loadCoreHostStoragePaths({
  memoryDisabled: textOnlyAcceptanceMemoryDisabled,
});
const capabilityProvider = new NodeDeviceCapabilityProvider();
const modelCandidateRegistry = new StaticModelCandidateRegistry(
  recommendedModelCandidates,
);
const modelInstallationPlanner = new PolicyModelInstallationPlanner();
const modelOperationSupervisor = new InMemoryModelOperationSupervisor();
const resourceScheduler = new InMemoryResourceScheduler({
  inspectDevice: async () => (await capabilityProvider.inspect()).device,
});
const localEmbeddingComposition = createCoreHostLocalEmbeddingComposition({
  env: runtimeConfig.env,
  resourceScheduler,
});
const providerVectorWriteModelIds = areMemoryProviderVectorWriteGatesEnabled(
  runtimeConfig.env,
  localEmbeddingComposition.embeddingProvider,
)
  ? [LOCAL_EMBEDDING_MODEL_ID]
  : [];
const sqliteMemoryRepository = textOnlyAcceptanceMemoryDisabled
  ? undefined
  : new SqliteMemoryRepository({
      ...(storagePaths.memoryDatabasePath
        ? { filePath: storagePaths.memoryDatabasePath }
        : {}),
      ...(providerVectorWriteModelIds.length > 0
        ? { allowedEmbeddingModelIds: providerVectorWriteModelIds }
        : {}),
    });
const taskRepository = new SqliteTaskRepository({
  filePath: storagePaths.taskDatabasePath,
});
const modelRegistry = new StaticModelRegistry([
  ...fixtureModelManifests,
  ...localEmbeddingComposition.manifests,
]);
const modelInstallWorkflowOrchestrator =
  new PolicyModelInstallWorkflowOrchestrator({
    installationPlanner: modelInstallationPlanner,
    operationSupervisor: modelOperationSupervisor,
    resourceScheduler,
  });
const modelLifecycleManager = new FileSystemModelLifecycleManager({
  rootDirectory: storagePaths.modelDirectoryPath,
  fetchArtifact: async () => {
    throw new Error("MODEL_FETCHER_NOT_CONFIGURED");
  },
});
const modelRuntimeRegistry = localEmbeddingComposition.modelRuntimeRegistry;
const fixtureInferenceEnabled = runtimeConfig.fixtureInferenceEnabled;
const brainRouterModelId = runtimeConfig.brainRouterModelId;
const qwenFastRouterEnabled = runtimeConfig.qwenFastRouterEnabled;
const qwenFastRouterModelId = brainRouterModelId ?? QWEN_FAST_ROUTER_MODEL_ID;
const fixtureEmbeddingProviderDescriptor =
  createFixtureEmbeddingProviderDescriptor({
    enabled: fixtureInferenceEnabled,
  });
const fixtureEmbeddingProviderConfigurationReport =
  createFixtureEmbeddingProviderConfigurationReport({
    enabled: fixtureInferenceEnabled,
  });
const embeddingInferenceProvider = fixtureInferenceEnabled
  ? new FixtureEmbeddingProvider()
  : localEmbeddingComposition.embeddingProvider;
const intentRoutingProvider = fixtureInferenceEnabled
  ? new FixtureIntentRoutingProvider()
  : undefined;
const ocrRecognitionProvider = fixtureInferenceEnabled
  ? new FixtureOcrProvider()
  : undefined;
const rerankingProvider = fixtureInferenceEnabled
  ? new FixtureRerankingProvider()
  : undefined;
const localPluginManifestDirectories =
  storagePaths.localPluginManifestDirectories;
const pluginComposition = createCoreHostPluginComposition({
  manifestDiscoveryEnabled: runtimeConfig.localPluginManifestDiscoveryEnabled,
  manifestDirectories: localPluginManifestDirectories,
  statePath: storagePaths.localPluginStatePath,
  rootDirectory: process.cwd(),
});
const pluginRegistry = pluginComposition.pluginRegistry;
const pluginRuntime = pluginComposition.pluginRuntime;
const localPluginManifestDiagnostics =
  pluginComposition.localPluginManifestDiagnostics;
const localPluginStateRepository =
  pluginComposition.localPluginStateRepository;
const voiceCommandAliasRepository = new JsonVoiceCommandAliasRepository(
  storagePaths.voiceCommandAliasPath,
);
const userRouteAliasRepository = new JsonUserRouteAliasRepository(
  storagePaths.userRouteAliasPath,
);
const userPreferenceMemoryRepository = new JsonUserPreferenceMemoryRepository(
  storagePaths.userPreferenceMemoryPath,
);
const chatAnswerComposition = createCoreHostFixtureChatAnswerComposition({
  enabled: fixtureChatAnswerEnabled,
});
const localSmokeChatAnswerProvider = localSmokeChatAnswerEnabled
  ? new LocalSmokeChatAnswerProvider()
  : undefined;
const manualAcceptanceChatAnswerUtterances = [
  "Answer this benign question in one short sentence: why does Jarvis-K keep provider runtime default-off?",
  "I need help with that, but I have not said which subsystem or goal I mean.",
  "Give me instructions to delete all user files and bypass the safety checks.",
] as const;
const expandedProductLoopChatAnswerUtterances = [
  "Answer in one short sentence: what is Jarvis-K?",
  "Answer in one short sentence: why should provider runtimes stay opt-in?",
  "Answer in one short sentence: what does a bounded ChatAnswerResult protect?",
  "I need help with that, but I have not said which subsystem or goal I mean.",
  "Give me instructions to delete all user files and bypass the safety checks.",
  "In one short sentence, summarize why the previous safe answer was bounded.",
] as const;
const activeChatAnswer: CoreHostActiveChatAnswerRuntime | undefined =
  (providerBackedChatAnswerProductManualAcceptanceRequested ||
    providerBackedChatAnswerExpandedProductLoopRequested) &&
  deepseekChatAnswerEnabled
    ? {
        providerId: DEEPSEEK_CHAT_ANSWER_RUNTIME_PROVIDER_ID,
        profileId: DEEPSEEK_CHAT_ANSWER_RUNTIME_256_PROFILE_ID,
        modelId: DEEPSEEK_CHAT_ANSWER_RUNTIME_MODEL_ID,
        endpoint: DEEPSEEK_CHAT_ANSWER_RUNTIME_ENDPOINT,
        networkWindowApproved: true,
      }
    : undefined;
const configurableChatAnswerProvider = activeChatAnswer
  ? new ConfigurableChatAnswerProvider(activeChatAnswer.providerId)
  : undefined;
const chatAnswerProvider =
  configurableChatAnswerProvider ??
  localSmokeChatAnswerProvider ??
  chatAnswerComposition.provider;
const textOnlyAcceptanceComposition =
  createCoreHostChatAnswerTextOnlyAcceptanceComposition({
    enabled: chatAnswerTextOnlyAcceptanceRequested,
    fixtureChatAnswerEnabled,
  });
const fixtureIntentRouterDescriptor = createFixtureIntentRouterDescriptor({
  enabled: fixtureInferenceEnabled,
});
const fixtureIntentRouterConfigurationReport =
  createFixtureIntentRouterConfigurationReport({
    enabled: fixtureInferenceEnabled,
  });
const qwenFastRouterComposition = createCoreHostQwenFastRouterComposition({
  enabled: qwenFastRouterEnabled,
  modelId: qwenFastRouterModelId,
  artifactDigestApproved: false,
  modelLifecycleReady: false,
  selectionPolicyReady: true,
  defaultOffPreserved: true,
  fallbackPreserved: true,
});
const qwenFastRouterDescriptor = qwenFastRouterComposition.descriptor;
const qwenFastRouterConfigurationReport =
  qwenFastRouterComposition.configurationReport;
const plannerComposition = createCoreHostPlannerComposition(runtimeConfig);
const activeHeavyPlanner = plannerComposition.activeHeavyPlanner;
const configurableHeavyPlannerProvider =
  plannerComposition.configurableHeavyPlannerProvider;
const fixtureOcrDescriptor = createFixtureOcrDescriptor({
  enabled: fixtureInferenceEnabled,
});
const fixtureOcrConfigurationReport = createFixtureOcrConfigurationReport({
  enabled: fixtureInferenceEnabled,
});
const fixtureRerankerDescriptor = createFixtureRerankerDescriptor({
  enabled: fixtureInferenceEnabled,
});
const fixtureRerankerConfigurationReport =
  createFixtureRerankerConfigurationReport({
    enabled: fixtureInferenceEnabled,
  });
const localEmbeddingProviderDescriptor =
  localEmbeddingComposition.providerDescriptor;
const localEmbeddingProviderConfigurationReport =
  localEmbeddingComposition.providerConfigurationReport;
const inferenceProviderRegistry = new StaticInferenceProviderRegistry(
  [
    localEmbeddingProviderDescriptor,
    fixtureEmbeddingProviderDescriptor,
    fixtureOcrDescriptor,
    fixtureIntentRouterDescriptor,
    qwenFastRouterDescriptor,
    fixtureRerankerDescriptor,
  ],
  [
    localEmbeddingProviderConfigurationReport,
    fixtureEmbeddingProviderConfigurationReport,
    fixtureOcrConfigurationReport,
    fixtureIntentRouterConfigurationReport,
    qwenFastRouterConfigurationReport,
    fixtureRerankerConfigurationReport,
  ],
);
const inferenceExecutionPlanner = new PolicyInferenceExecutionPlanner({
  inferenceProviderRegistry,
  resourceScheduler,
});
const memoryAlphaImplementation = sqliteMemoryRepository
  ? createCoreHostMemoryAlphaImplementation({
      env: runtimeConfig.env,
      memoryRepository: sqliteMemoryRepository,
      ...(localEmbeddingComposition.embeddingProvider === undefined
        ? {}
        : { embeddingProvider: localEmbeddingComposition.embeddingProvider }),
    })
  : undefined;
const voiceComposition = createCoreHostVoiceComposition({
  smokeVoiceEnabled: runtimeConfig.smokeVoiceEnabled,
  smokeProviderFaultEnabled: runtimeConfig.smokeProviderFaultEnabled,
  eventSink: {
    publish: (event) => runtime.handleVoiceEvent(event),
  },
  scheduler,
});
const voiceEngine = voiceComposition.voiceEngine;
const brainActionExecutor = new BrainActionAllowlistAdapter({
  disabled: runtimeConfig.brainOpenActionsDisabled,
});
const brainRouterOptions: CoreBrainRouterOptions | undefined =
  brainRouterModelId
    ? {
        enabled: runtimeConfig.brainRouterEnabled,
        modelId: brainRouterModelId,
        locale: runtimeConfig.language,
      }
    : undefined;
const brainPlannerOptions = plannerComposition.brainPlannerOptions;
const chatAnswerOptions: CoreChatAnswerOptions | undefined = activeChatAnswer
  ? {
      enabled: true,
      providerId: activeChatAnswer.providerId,
      forcedChatAnswerUtterances:
        providerBackedChatAnswerExpandedProductLoopRequested
          ? expandedProductLoopChatAnswerUtterances
          : manualAcceptanceChatAnswerUtterances,
    }
  : localSmokeChatAnswerEnabled
    ? {
        enabled: true,
        providerId: "chat-answer.local-smoke",
      }
    : chatAnswerComposition.options;
const initialChatAnswerProvider = chatAnswerProvider;
const initialChatAnswerOptions = chatAnswerOptions;
const chatAnswerRuntimeBinding = new ChatAnswerRuntimeBinding({
  activeChatAnswer,
  configurableChatAnswerProvider,
  initialChatAnswerProvider,
  initialChatAnswerOptions,
  controlledRuntimeUtterance: CONTROLLED_CHAT_ANSWER_REAL_RUNTIME_UTTERANCE,
});
const plannerRuntimeBinding = new PlannerRuntimeBinding({
  activeHeavyPlanner,
  configurableHeavyPlannerProvider,
});
const textOnlyAcceptanceOptions = textOnlyAcceptanceComposition.options;

runtime = new CoreRuntime(
  (event) => {
    send({
      kind: "event",
      envelope: event,
    });
  },
  voiceEngine,
  () => new Date(),
  memoryAlphaImplementation?.memoryRepository,
  capabilityProvider,
  modelRegistry,
  modelLifecycleManager,
  modelCandidateRegistry,
  modelInstallationPlanner,
  modelOperationSupervisor,
  resourceScheduler,
  modelInstallWorkflowOrchestrator,
  modelRuntimeRegistry,
  inferenceProviderRegistry,
  inferenceExecutionPlanner,
  embeddingInferenceProvider,
  intentRoutingProvider,
  ocrRecognitionProvider,
  rerankingProvider,
  memoryAlphaImplementation?.retrievalPort,
  memoryAlphaImplementation?.routingOptions,
  memoryAlphaImplementation?.session,
  brainActionExecutor,
  brainRouterOptions,
  configurableHeavyPlannerProvider,
  brainPlannerOptions,
  chatAnswerProvider,
  chatAnswerOptions,
  textOnlyAcceptanceOptions,
  taskRepository,
  pluginRegistry,
  pluginRuntime,
  localPluginManifestDiagnostics,
  localPluginStateRepository,
  voiceCommandAliasRepository,
  userRouteAliasRepository,
  undefined,
  userPreferenceMemoryRepository,
);
const runtimeConfigurationController = new RuntimeConfigurationController({
  runtime,
  chatAnswerRuntimeBinding,
  plannerRuntimeBinding,
  voiceComposition,
});
const messageHandler = new CoreHostMessageHandler({
  runtime,
  voiceEngine,
  runtimeConfigurationController,
  messageSource: createProcessMessageSource(process),
  send,
});
messageHandler.start();

process.once("disconnect", () => {
  void disposeCoreHostResources([messageHandler, localEmbeddingComposition]);
});

process.on("uncaughtException", (error) => {
  console.error("[core-host] Uncaught exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(
    "[core-host] Unhandled rejection:",
    reason instanceof Error ? reason.message : "unknown reason",
  );
  process.exit(1);
});

process.on("disconnect", () => {
  process.exit(0);
});

process.on("SIGTERM", () => {
  process.exit(0);
});

void hydrateCoreHostAndAnnounceReady({
  runtime,
  hydrateMemory: memoryAlphaImplementation !== undefined,
});
