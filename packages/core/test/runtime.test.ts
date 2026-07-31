import { describe, expect, it } from "vitest";
import {
  type CapabilitySnapshot,
  type Message,
  type EventEnvelope,
  type VoiceEvent,
  type VoiceMode,
  type VoicePermissionState,
  type VoiceSnapshot,
  type ModelInventoryItem,
  type ModelInstallabilityReport,
  type ModelCandidate,
  type ModelManifest,
  type ModelOperationSnapshot,
  type ResourceSchedulerDiagnostics,
  createCommandEnvelope
} from "@jarvis-k/contracts";
import type {
  CapabilityProvider,
  ModelCandidateRegistry,
  ModelInstallWorkflowOrchestrator,
  ModelInstallWorkflowPrepareInput,
  ModelInstallationPlanner,
  ModelInstallationPreviewInput,
  ModelLifecycleManager,
  ModelOperationListOptions,
  ModelOperationSupervisor,
  ModelRegistry,
  ResourceLease,
  ResourceRequest,
  ResourceScheduler
} from "@jarvis-k/capabilities";
import type {
  Conversation,
  ConversationCreateInput,
  ConversationListOptions,
  ConversationUpdateInput,
  MemoryHealth,
  MemorySummary,
  MemoryRepository,
  MemorySnapshot,
  MemorySnapshotInput,
  MessageListOptions,
  RecentMessageListOptions,
  SummaryListOptions,
  SummaryWriteInput
} from "@jarvis-k/memory";
import type {
  VoiceActionResult,
  VoiceEnginePort
} from "@jarvis-k/voice";
import { CoreRuntime } from "../src/runtime";

class FakeVoiceEngine implements VoiceEnginePort {
  private eventSink: ((event: VoiceEvent) => void) | undefined;
  private snapshot: VoiceSnapshot = {
    state: "idle",
    mode: "disabled",
    permission: "unknown"
  };

  public getSnapshot(): VoiceSnapshot {
    return { ...this.snapshot };
  }

  public async setMode(mode: VoiceMode): Promise<VoiceActionResult> {
    this.snapshot = {
      ...this.snapshot,
      mode,
      state: mode === "disabled" ? "idle" : "ready"
    };
    this.emitState();
    return this.success();
  }

  public startPtt(_captureId?: string): VoiceActionResult {
    if (this.snapshot.mode !== "ptt") {
      return this.failure("VOICE_MODE_INVALID");
    }
    this.snapshot = {
      ...this.snapshot,
      state: "recording"
    };
    this.emitState();
    return this.success();
  }

  public async acceptAudioFrame(): Promise<{ accepted: true }> {
    return { accepted: true };
  }

  public async stopPtt(): Promise<VoiceActionResult> {
    this.snapshot = {
      ...this.snapshot,
      state: "finalizing"
    };
    this.emitState();
    return this.success();
  }

  public async cancel(): Promise<VoiceActionResult> {
    this.snapshot = {
      ...this.snapshot,
      state: "ready"
    };
    this.emitState();
    return this.success();
  }

  public suspendForTts(): VoiceActionResult {
    this.snapshot = {
      ...this.snapshot,
      state: "speaking"
    };
    this.emitState();
    return this.success();
  }

  public async resumeAfterTts(): Promise<VoiceActionResult> {
    this.snapshot = {
      ...this.snapshot,
      state: "ready"
    };
    this.emitState();
    return this.success();
  }

  public reportPermission(
    permission: VoicePermissionState
  ): VoiceActionResult {
    this.snapshot = {
      ...this.snapshot,
      permission
    };
    return this.success();
  }

  public setEventSink(eventSink: (event: VoiceEvent) => void): void {
    this.eventSink = eventSink;
  }

  public applyEvent(event: VoiceEvent): void {
    if (event.type === "voice.transcript.updated") {
      this.snapshot = {
        ...this.snapshot,
        transcript: event.payload
      };
    }
  }

  private success(): VoiceActionResult {
    return {
      ok: true,
      snapshot: this.getSnapshot()
    };
  }

  private emitState(): void {
    this.eventSink?.({
      type: "voice.state.changed",
      payload: {
        state: this.snapshot.state,
        mode: this.snapshot.mode
      }
    });
  }

  private failure(code: string): VoiceActionResult {
    return {
      ok: false,
      error: {
        code,
        message: code,
        retryable: false
      },
      snapshot: this.getSnapshot()
    };
  }
}

class FakeMemoryRepository implements MemoryRepository {
  public initialized = false;
  public readonly messages: Message[];
  public readonly conversations: Conversation[] = [];
  public readonly summaries: MemorySummary[] = [];
  public activeConversationId: string | undefined;
  public healthStatus: MemoryHealth["status"] = "ok";
  public throwOnInitialize = false;
  public throwOnAppend = false;

  public constructor(seed: Message[] = []) {
    this.messages = seed.map((message) => ({ ...message }));
  }

  public async initialize(): Promise<void> {
    if (this.throwOnInitialize) {
      throw new Error("Memory unavailable.");
    }
    this.initialized = true;
  }

  public async checkHealth(): Promise<MemoryHealth> {
    return {
      status: this.healthStatus,
      checkedAt: "2026-07-31T00:00:00.000Z",
      ...(this.healthStatus === "degraded"
        ? {
            code: "MEMORY_UNAVAILABLE",
            message: "Memory store is unavailable."
          }
        : {})
    };
  }

  public async upsertConversation(
    input: ConversationCreateInput
  ): Promise<Conversation> {
    const existingIndex = this.conversations.findIndex(
      (conversation) => conversation.id === input.id
    );
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: input.id,
      title: input.title,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? input.createdAt ?? now,
      ...(input.lastMessageAt ? { lastMessageAt: input.lastMessageAt } : {})
    };
    if (existingIndex >= 0) {
      this.conversations[existingIndex] = { ...conversation };
    } else {
      this.conversations.push({ ...conversation });
    }
    return { ...conversation };
  }

  public async updateConversation(
    input: ConversationUpdateInput
  ): Promise<Conversation> {
    const conversation = this.conversations.find(
      (item) => item.id === input.id
    );
    if (!conversation) {
      throw new Error(`Conversation ${input.id} does not exist.`);
    }
    conversation.title = input.title ?? conversation.title;
    conversation.updatedAt = input.updatedAt ?? new Date().toISOString();
    return { ...conversation };
  }

  public async listConversations(
    options: ConversationListOptions = {}
  ): Promise<Conversation[]> {
    return this.conversations
      .slice(0, options.limit)
      .map((conversation) => ({ ...conversation }));
  }

  public async getActiveConversationId(): Promise<string | undefined> {
    return this.activeConversationId;
  }

  public async setActiveConversationId(
    conversationId: string
  ): Promise<void> {
    this.activeConversationId = conversationId;
  }

  public async appendMessage(message: Message): Promise<Message> {
    if (this.throwOnAppend) {
      throw new Error("Memory write failed.");
    }
    this.messages.push({ ...message });
    const existing = this.conversations.find(
      (conversation) => conversation.id === message.conversationId
    );
    if (!existing) {
      this.conversations.push({
        id: message.conversationId,
        title: message.text,
        createdAt: message.createdAt,
        updatedAt: message.createdAt,
        lastMessageAt: message.createdAt
      });
    } else {
      existing.updatedAt = message.createdAt;
      existing.lastMessageAt = message.createdAt;
    }
    return { ...message };
  }

  public async listMessages(
    options: MessageListOptions = {}
  ): Promise<Message[]> {
    return this.messages
      .filter((message) =>
        options.conversationId
          ? message.conversationId === options.conversationId
          : true
      )
      .slice(0, options.limit)
      .map((message) => ({ ...message }));
  }

  public async listRecentMessages(
    options: RecentMessageListOptions
  ): Promise<Message[]> {
    return this.messages
      .filter((message) =>
        options.conversationId
          ? message.conversationId === options.conversationId
          : true
      )
      .slice(-options.limit)
      .map((message) => ({ ...message }));
  }

  public async upsertSummary(
    input: SummaryWriteInput
  ): Promise<MemorySummary> {
    const existingIndex = this.summaries.findIndex(
      (summary) => summary.id === input.id
    );
    const now = new Date().toISOString();
    const summary: MemorySummary = {
      id: input.id,
      conversationId: input.conversationId,
      text: input.text,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? input.createdAt ?? now,
      ...(input.fromMessageId ? { fromMessageId: input.fromMessageId } : {}),
      ...(input.toMessageId ? { toMessageId: input.toMessageId } : {})
    };
    if (existingIndex >= 0) {
      this.summaries[existingIndex] = { ...summary };
    } else {
      this.summaries.push({ ...summary });
    }
    return { ...summary };
  }

  public async listSummaries(
    options: SummaryListOptions = {}
  ): Promise<MemorySummary[]> {
    return this.summaries
      .filter((summary) =>
        options.conversationId
          ? summary.conversationId === options.conversationId
          : true
      )
      .slice(0, options.limit)
      .map((summary) => ({ ...summary }));
  }

  public async getSnapshot(): Promise<MemorySnapshot> {
    return {
      messages: await this.listMessages(),
      conversations: await this.listConversations(),
      summaries: await this.listSummaries(),
      ...(this.activeConversationId
        ? { activeConversationId: this.activeConversationId }
        : {})
    };
  }

  public async restoreSnapshot(snapshot: MemorySnapshotInput): Promise<void> {
    this.messages.splice(
      0,
      this.messages.length,
      ...snapshot.messages.map((message) => ({ ...message }))
    );
    this.conversations.splice(
      0,
      this.conversations.length,
      ...(snapshot.conversations ?? []).map((conversation) => ({
        ...conversation
      }))
    );
    this.summaries.splice(
      0,
      this.summaries.length,
      ...(snapshot.summaries ?? []).map((summary) => ({
        ...summary
      }))
    );
    this.activeConversationId = snapshot.activeConversationId;
  }

  public async exportSnapshot(): Promise<MemorySnapshot> {
    return this.getSnapshot();
  }

  public async importSnapshot(
    snapshot: MemorySnapshotInput
  ): Promise<void> {
    await this.restoreSnapshot(snapshot);
  }

  public async close(): Promise<void> {
    return;
  }
}

class FakeCapabilityProvider implements CapabilityProvider {
  public async inspect(): Promise<CapabilitySnapshot> {
    return {
      checkedAt: "2026-07-31T00:00:00.000Z",
      runtimeMode: "standard",
      device: {
        checkedAt: "2026-07-31T00:00:00.000Z",
        platform: "win32",
        arch: "x64",
        cpuLogicalCores: 16,
        totalMemoryBytes: 16 * 1024 * 1024 * 1024,
        availableMemoryBytes: 8 * 1024 * 1024 * 1024,
        gpus: [],
        accelerationBackends: ["cpu", "directml"],
        recommendedMode: "standard",
        reasons: ["Fake capability provider."]
      },
      providerPlan: [
        {
          capability: "speech_to_text",
          provider: "local_whisper",
          execution: "local",
          loadPolicy: "on_demand",
          reason: "Fake provider selection."
        }
      ],
      modelInventory: []
    };
  }
}

class FakeModelRegistry implements ModelRegistry {
  public readonly manifest: ModelManifest = {
    id: "vendor/local-stt-small",
    capability: "speech_to_text",
    source: "huggingface",
    revision: "commit-a",
    license: "MIT",
    runtime: "ctranslate2",
    quantization: "int8",
    sizeBytes: 512,
    licenseRisk: "green"
  };

  public async listManifests(): Promise<ModelManifest[]> {
    return [{ ...this.manifest }];
  }

  public async getManifest(
    modelId: string
  ): Promise<ModelManifest | undefined> {
    return modelId === this.manifest.id ? { ...this.manifest } : undefined;
  }
}

class FakeModelCandidateRegistry implements ModelCandidateRegistry {
  public readonly candidate: ModelCandidate = {
    id: "openai/whisper-large-v3-turbo",
    capability: "speech_to_text",
    source: "huggingface",
    officialUrl: "https://huggingface.co/openai/whisper-large-v3-turbo",
    license: "MIT",
    licenseRisk: "yellow",
    distributionRisk: "yellow",
    runtime: "ctranslate2",
    recommendedMode: "local_enhanced",
    downloadEnabled: false,
    audit: {
      checkedAt: "2026-07-31T00:00:00.000Z",
      evidenceUrls: [
        "https://huggingface.co/openai/whisper-large-v3-turbo"
      ],
      pinStatus: "pending_pin",
      notes: ["Fake candidate."]
    }
  };

  public async listCandidates(): Promise<ModelCandidate[]> {
    return [{ ...this.candidate, audit: { ...this.candidate.audit } }];
  }

  public async getCandidate(
    modelId: string
  ): Promise<ModelCandidate | undefined> {
    return modelId === this.candidate.id
      ? { ...this.candidate, audit: { ...this.candidate.audit } }
      : undefined;
  }
}

class FakeModelLifecycleManager implements ModelLifecycleManager {
  public readonly inventory: ModelInventoryItem[] = [
    {
      manifest: new FakeModelRegistry().manifest,
      status: "available",
      installPath: "E:\\Jarvis-K\\models\\vendor-local-stt-small\\model.bin",
      lastVerifiedAt: "2026-07-31T00:00:00.000Z"
    }
  ];

  public async listInventory(): Promise<ModelInventoryItem[]> {
    return this.inventory.map((item) => ({
      ...item,
      manifest: { ...item.manifest }
    }));
  }

  public async ensureAvailable(
    modelId: string
  ): Promise<ModelInventoryItem> {
    const item = this.inventory.find(
      (entry) => entry.manifest.id === modelId
    );
    if (!item) throw new Error("Model unavailable.");
    return { ...item, manifest: { ...item.manifest } };
  }

  public async load(modelId: string): Promise<ModelInventoryItem> {
    return this.ensureAvailable(modelId);
  }

  public async release(): Promise<void> {
    return;
  }
}

class FakeModelInstallationPlanner implements ModelInstallationPlanner {
  public previewed: ModelInstallationPreviewInput | undefined;

  public async preview(
    input: ModelInstallationPreviewInput
  ): Promise<ModelInstallabilityReport> {
    this.previewed = input;
    return {
      modelId: input.manifest.id,
      allowed: false,
      reasons: ["Fake planner blocked installability."],
      runtimeMode: input.device.recommendedMode
    };
  }
}

class FakeModelOperationSupervisor implements ModelOperationSupervisor {
  public readonly operation: ModelOperationSnapshot = {
    operationId: "model-op-test",
    modelId: "vendor/local-stt-small",
    capability: "speech_to_text",
    phase: "queued",
    createdAt: "2026-07-31T00:00:00.000Z",
    updatedAt: "2026-07-31T00:00:00.000Z",
    reasons: []
  };

  public async start(): Promise<ModelOperationSnapshot> {
    return { ...this.operation, reasons: [...this.operation.reasons] };
  }

  public async update(): Promise<ModelOperationSnapshot> {
    return { ...this.operation, reasons: [...this.operation.reasons] };
  }

  public async cancel(): Promise<ModelOperationSnapshot> {
    return {
      ...this.operation,
      phase: "cancelled",
      reasons: ["Fake cancellation."]
    };
  }

  public async get(
    operationId: string
  ): Promise<ModelOperationSnapshot | undefined> {
    return operationId === this.operation.operationId
      ? { ...this.operation, reasons: [...this.operation.reasons] }
      : undefined;
  }

  public async list(
    _options: ModelOperationListOptions = {}
  ): Promise<ModelOperationSnapshot[]> {
    return [{ ...this.operation, reasons: [...this.operation.reasons] }];
  }
}

class FakeResourceScheduler implements ResourceScheduler {
  public async acquire(_input: ResourceRequest): Promise<ResourceLease> {
    return {
      leaseId: "lease-test",
      capability: "embedding",
      createdAt: "2026-07-31T00:00:00.000Z",
      release: async () => undefined
    };
  }

  public async diagnostics(): Promise<ResourceSchedulerDiagnostics> {
    return {
      checkedAt: "2026-07-31T00:00:00.000Z",
      totalMemoryBytes: 16,
      availableMemoryBytes: 12,
      leasedMemoryBytes: 4,
      totalVramBytes: 8,
      availableVramBytes: 6,
      leasedVramBytes: 2,
      activeLeaseCount: 1,
      exclusiveGpuLeaseActive: false
    };
  }
}

class FakeModelInstallWorkflowOrchestrator
  implements ModelInstallWorkflowOrchestrator
{
  public prepared: ModelInstallWorkflowPrepareInput | undefined;

  public async prepare(
    input: ModelInstallWorkflowPrepareInput
  ): Promise<ModelOperationSnapshot> {
    this.prepared = input;
    return {
      operationId: "model-op-prepare-test",
      modelId: input.manifest.id,
      capability: input.manifest.capability,
      phase: "queued",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z",
      reasons: ["Install workflow prepared; artifact fetch is not enabled."]
    };
  }
}

function createRuntime(
  memoryRepository?: MemoryRepository,
  capabilityProvider?: CapabilityProvider,
  modelRegistry?: ModelRegistry,
  modelLifecycleManager?: ModelLifecycleManager,
  modelCandidateRegistry?: ModelCandidateRegistry,
  modelInstallationPlanner?: ModelInstallationPlanner,
  modelOperationSupervisor?: ModelOperationSupervisor,
  resourceScheduler?: ResourceScheduler,
  modelInstallWorkflowOrchestrator?: ModelInstallWorkflowOrchestrator
) {
  const events: EventEnvelope[] = [];
  const voiceEngine = new FakeVoiceEngine();
  const runtime = new CoreRuntime(
    (event) => events.push(event),
    voiceEngine,
    undefined,
    memoryRepository,
    capabilityProvider,
    modelRegistry,
    modelLifecycleManager,
    modelCandidateRegistry,
    modelInstallationPlanner,
    modelOperationSupervisor,
    resourceScheduler,
    modelInstallWorkflowOrchestrator
  );
  voiceEngine.setEventSink((event) => runtime.handleVoiceEvent(event));
  return { events, runtime, voiceEngine };
}

describe("CoreRuntime", () => {
  it("accepts a typed message command and publishes a recoverable snapshot", async () => {
    const { events, runtime } = createRuntime();

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.sendMessage",
        payload: {
          conversationId: "primary",
          text: "Run phase two"
        }
      })
    );

    expect(result.ok).toBe(true);
    expect(runtime.getSnapshot().messages).toHaveLength(1);
    expect(
      events.some((event) => event.event.type === "state.snapshot")
    ).toBe(true);
  });

  it("hydrates and persists messages through an injected memory repository", async () => {
    const memoryRepository = new FakeMemoryRepository([
      {
        id: "msg-seed",
        conversationId: "primary",
        role: "system",
        text: "Recovered from disk",
        createdAt: "2026-07-30T00:00:00.000Z"
      }
    ]);
    await memoryRepository.upsertConversation({
      id: "primary",
      title: "Primary",
      createdAt: "2026-07-30T00:00:00.000Z",
      updatedAt: "2026-07-30T00:00:00.000Z"
    });
    await memoryRepository.setActiveConversationId("primary");
    const { runtime } = createRuntime(memoryRepository);

    await runtime.hydrateMemory();

    expect(runtime.getSnapshot().messages.map((message) => message.id))
      .toEqual(["msg-seed"]);
    expect(runtime.getSnapshot().conversations.map((item) => item.id))
      .toEqual(["primary"]);
    expect(runtime.getSnapshot().activeConversationId).toBe("primary");
    expect(runtime.getSnapshot().memoryHealth?.status).toBe("ok");

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.sendMessage",
        payload: {
          conversationId: "primary",
          text: "Persist me"
        }
      })
    );

    expect(result.ok).toBe(true);
    expect(memoryRepository.messages).toHaveLength(2);
    expect(runtime.getSnapshot().messages).toHaveLength(2);
  });

  it("manages conversations through memory commands", async () => {
    const memoryRepository = new FakeMemoryRepository();
    const { runtime } = createRuntime(memoryRepository);
    await runtime.hydrateMemory();

    const create = await runtime.handle(
      createCommandEnvelope({
        type: "agent.createConversation",
        payload: { title: "Planning" }
      })
    );

    expect(create.ok).toBe(true);
    const created = create.ok
      ? (create.data as { conversation: { id: string; title: string } })
          .conversation
      : undefined;
    expect(created?.title).toBe("Planning");
    expect(runtime.getSnapshot().activeConversationId).toBe(created?.id);

    const rename = await runtime.handle(
      createCommandEnvelope({
        type: "agent.renameConversation",
        payload: {
          conversationId: created?.id ?? "",
          title: "Renamed"
        }
      })
    );
    expect(rename.ok).toBe(true);

    const list = await runtime.handle(
      createCommandEnvelope({
        type: "agent.listConversations",
        payload: {}
      })
    );
    expect(list.ok).toBe(true);
    expect(runtime.getSnapshot().conversations[0]?.title).toBe("Renamed");
  });

  it("uses the active conversation when sending messages without an explicit id", async () => {
    const memoryRepository = new FakeMemoryRepository();
    await memoryRepository.upsertConversation({
      id: "active",
      title: "Active",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z"
    });
    await memoryRepository.setActiveConversationId("active");
    const { runtime } = createRuntime(memoryRepository);
    await runtime.hydrateMemory();

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.sendMessage",
        payload: {
          text: "Send to active"
        }
      })
    );

    expect(result.ok).toBe(true);
    expect(memoryRepository.messages.at(-1)?.conversationId).toBe("active");
  });

  it("returns provider-neutral memory health", async () => {
    const memoryRepository = new FakeMemoryRepository();
    const { runtime } = createRuntime(memoryRepository);
    await runtime.hydrateMemory();

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.getMemoryHealth",
        payload: {}
      })
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.data : undefined).toMatchObject({
      memoryHealth: {
        status: "ok"
      }
    });
  });

  it("hydrates and refreshes provider-neutral device capabilities", async () => {
    const { events, runtime } = createRuntime(
      undefined,
      new FakeCapabilityProvider()
    );

    await runtime.hydrateCapabilities();

    expect(runtime.getSnapshot().capabilities?.runtimeMode).toBe(
      "standard"
    );

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.getCapabilities",
        payload: {}
      })
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.data : undefined).toMatchObject({
      capabilities: {
        runtimeMode: "standard"
      }
    });
    expect(events.at(-1)?.event.type).toBe("state.snapshot");
  });

  it("lists model manifests and local model inventory through injected ports", async () => {
    const { runtime } = createRuntime(
      undefined,
      undefined,
      new FakeModelRegistry(),
      new FakeModelLifecycleManager(),
      new FakeModelCandidateRegistry()
    );

    const manifests = await runtime.handle(
      createCommandEnvelope({
        type: "agent.listModelManifests",
        payload: {}
      })
    );
    const inventory = await runtime.handle(
      createCommandEnvelope({
        type: "agent.listModelInventory",
        payload: {}
      })
    );
    const candidates = await runtime.handle(
      createCommandEnvelope({
        type: "agent.listModelCandidates",
        payload: {}
      })
    );

    expect(manifests.ok).toBe(true);
    expect(manifests.ok ? manifests.data : undefined).toMatchObject({
      manifests: [
        {
          id: "vendor/local-stt-small",
          capability: "speech_to_text"
        }
      ]
    });
    expect(inventory.ok).toBe(true);
    expect(inventory.ok ? inventory.data : undefined).toMatchObject({
      inventory: [
        {
          status: "available",
          manifest: {
            id: "vendor/local-stt-small"
          }
        }
      ]
    });
    expect(candidates.ok).toBe(true);
    expect(candidates.ok ? candidates.data : undefined).toMatchObject({
      candidates: [
        {
          id: "openai/whisper-large-v3-turbo",
          downloadEnabled: false
        }
      ]
    });
  });

  it("previews model installability through injected governance ports", async () => {
    const registry = new FakeModelRegistry();
    const planner = new FakeModelInstallationPlanner();
    const { runtime } = createRuntime(
      undefined,
      new FakeCapabilityProvider(),
      registry,
      new FakeModelLifecycleManager(),
      new FakeModelCandidateRegistry(),
      planner
    );

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.previewModelInstallability",
        payload: {
          modelId: registry.manifest.id
        }
      })
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.data : undefined).toMatchObject({
      report: {
        modelId: registry.manifest.id,
        allowed: false,
        reasons: ["Fake planner blocked installability."],
        runtimeMode: "standard"
      }
    });
    expect(planner.previewed?.manifest.id).toBe(registry.manifest.id);
  });

  it("prepares model install workflows through an injected port", async () => {
    const registry = new FakeModelRegistry();
    const orchestrator = new FakeModelInstallWorkflowOrchestrator();
    const { events, runtime } = createRuntime(
      undefined,
      new FakeCapabilityProvider(),
      registry,
      new FakeModelLifecycleManager(),
      new FakeModelCandidateRegistry(),
      new FakeModelInstallationPlanner(),
      new FakeModelOperationSupervisor(),
      new FakeResourceScheduler(),
      orchestrator
    );

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.prepareModelInstall",
        payload: {
          modelId: registry.manifest.id,
          exclusiveGpu: false
        }
      })
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.data : undefined).toMatchObject({
      operation: {
        modelId: registry.manifest.id,
        phase: "queued",
        reasons: [
          "Install workflow prepared; artifact fetch is not enabled."
        ]
      },
      snapshot: {
        modelOperations: [
          {
            operationId: "model-op-prepare-test",
            phase: "queued"
          }
        ]
      }
    });
    expect(orchestrator.prepared?.manifest.id).toBe(registry.manifest.id);
    expect(orchestrator.prepared?.exclusiveGpu).toBe(false);
    expect(events.some((event) => event.event.type === "model.operation.updated"))
      .toBe(true);
  });

  it("lists model operations through the injected supervisor", async () => {
    const supervisor = new FakeModelOperationSupervisor();
    const { runtime } = createRuntime(
      undefined,
      undefined,
      new FakeModelRegistry(),
      new FakeModelLifecycleManager(),
      new FakeModelCandidateRegistry(),
      new FakeModelInstallationPlanner(),
      supervisor
    );

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.listModelOperations",
        payload: {
          activeOnly: true
        }
      })
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.data : undefined).toMatchObject({
      operations: [
        {
          operationId: supervisor.operation.operationId,
          phase: "queued"
        }
      ],
      snapshot: {
        modelOperations: [
          {
            operationId: supervisor.operation.operationId
          }
        ]
      }
    });
    expect(runtime.getSnapshot().modelOperations).toHaveLength(1);
  });

  it("returns resource diagnostics through the injected scheduler", async () => {
    const { runtime } = createRuntime(
      undefined,
      undefined,
      new FakeModelRegistry(),
      new FakeModelLifecycleManager(),
      new FakeModelCandidateRegistry(),
      new FakeModelInstallationPlanner(),
      new FakeModelOperationSupervisor(),
      new FakeResourceScheduler()
    );

    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.getResourceDiagnostics",
        payload: {}
      })
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.data : undefined).toMatchObject({
      resourceDiagnostics: {
        availableMemoryBytes: 12,
        activeLeaseCount: 1
      },
      snapshot: {
        resourceDiagnostics: {
          leasedVramBytes: 2
        }
      }
    });
    expect(runtime.getSnapshot().resourceDiagnostics).toMatchObject({
      availableVramBytes: 6
    });
  });

  it("exports and imports memory snapshots through the injected repository", async () => {
    const memoryRepository = new FakeMemoryRepository();
    const { runtime } = createRuntime(memoryRepository);
    await runtime.hydrateMemory();

    await runtime.handle(
      createCommandEnvelope({
        type: "agent.sendMessage",
        payload: {
          conversationId: "primary",
          text: "Before export"
        }
      })
    );

    const exported = await runtime.handle(
      createCommandEnvelope({
        type: "agent.exportMemorySnapshot",
        payload: {}
      })
    );

    expect(exported.ok).toBe(true);
    expect(exported.ok ? exported.data : undefined).toMatchObject({
      snapshot: {
        messages: [
          {
            conversationId: "primary",
            text: "Before export"
          }
        ]
      }
    });

    const imported = await runtime.handle(
      createCommandEnvelope({
        type: "agent.importMemorySnapshot",
        payload: {
          snapshot: {
            messages: [
              {
                id: "msg-restored",
                conversationId: "restored",
                role: "user",
                text: "After import",
                createdAt: "2026-07-31T00:00:00.000Z"
              }
            ],
            conversations: [
              {
                id: "restored",
                title: "Restored",
                createdAt: "2026-07-31T00:00:00.000Z",
                updatedAt: "2026-07-31T00:00:00.000Z",
                lastMessageAt: "2026-07-31T00:00:00.000Z"
              }
            ],
            summaries: [],
            activeConversationId: "restored"
          }
        }
      })
    );

    expect(imported.ok).toBe(true);
    expect(memoryRepository.messages.map((message) => message.id)).toEqual([
      "msg-restored"
    ]);
    expect(runtime.getSnapshot()).toMatchObject({
      activeConversationId: "restored",
      messages: [
        {
          id: "msg-restored",
          text: "After import"
        }
      ],
      conversations: [
        {
          id: "restored",
          title: "Restored"
        }
      ]
    });
  });

  it("reports degraded health when memory hydration is unavailable", async () => {
    const memoryRepository = new FakeMemoryRepository([
      {
        id: "msg-seed",
        conversationId: "primary",
        role: "system",
        text: "Recovered from disk",
        createdAt: "2026-07-30T00:00:00.000Z"
      }
    ]);
    memoryRepository.throwOnInitialize = true;
    const { events, runtime } = createRuntime(memoryRepository);

    await runtime.hydrateMemory();
    runtime.announceReady();

    expect(runtime.getSnapshot().health).toBe("degraded");
    expect(runtime.getSnapshot().messages).toEqual([]);
    expect(events.at(-1)?.event.type).toBe("state.snapshot");
    expect(
      events.at(-1)?.event.type === "state.snapshot"
        ? events.at(-1)?.event.payload.health
        : undefined
    ).toBe("degraded");

    const ping = await runtime.handle(
      createCommandEnvelope({
        type: "agent.ping",
        payload: { sentAt: "2026-07-31T00:00:00.000Z" }
      })
    );

    expect(ping.ok).toBe(true);
    expect(ping.ok ? ping.data : undefined).toMatchObject({
      status: "degraded"
    });
  });

  it("reports degraded health when memory health checks fail", async () => {
    const memoryRepository = new FakeMemoryRepository();
    memoryRepository.healthStatus = "degraded";
    const { runtime } = createRuntime(memoryRepository);

    await runtime.hydrateMemory();

    expect(runtime.getSnapshot().health).toBe("degraded");
  });

  it("marks runtime degraded when memory writes fail", async () => {
    const memoryRepository = new FakeMemoryRepository();
    memoryRepository.throwOnAppend = true;
    const { runtime } = createRuntime(memoryRepository);

    await runtime.hydrateMemory();
    const result = await runtime.handle(
      createCommandEnvelope({
        type: "agent.sendMessage",
        payload: {
          conversationId: "primary",
          text: "Persist me"
        }
      })
    );

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(
      "MEMORY_WRITE_FAILED"
    );
    expect(runtime.getSnapshot().health).toBe("degraded");
  });

  it("delegates voice commands to the injected engine", async () => {
    const { runtime } = createRuntime();

    const invalidStart = await runtime.handle(
      createCommandEnvelope({
        type: "voice.startPtt",
        payload: {}
      })
    );
    expect(invalidStart.ok).toBe(false);

    await runtime.handle(
      createCommandEnvelope({
        type: "voice.setMode",
        payload: { mode: "ptt" }
      })
    );
    const start = await runtime.handle(
      createCommandEnvelope({
        type: "voice.startPtt",
        payload: {}
      })
    );

    expect(start.ok).toBe(true);
    expect(runtime.getSnapshot().voice.state).toBe("recording");
  });

  it("maps Voice Engine events into correlated Core envelopes", async () => {
    const { events, runtime, voiceEngine } = createRuntime();
    const transcriptEvent: VoiceEvent = {
      type: "voice.transcript.updated",
      payload: {
        sessionId: "voice-1",
        text: "Core mapped transcript",
        isFinal: true,
        updatedAt: "2026-07-29T00:00:00.000Z"
      }
    };
    voiceEngine.applyEvent(transcriptEvent);
    runtime.handleVoiceEvent(transcriptEvent);

    expect(events.at(-2)?.event.type).toBe("voice.transcript.updated");
    expect(events.at(-1)?.event.type).toBe("state.snapshot");
    expect(runtime.getSnapshot().voice.transcript?.isFinal).toBe(true);
  });

  it("correlates events emitted during a voice command", async () => {
    const { events, runtime } = createRuntime();
    await runtime.handle(
      createCommandEnvelope({
        type: "voice.setMode",
        payload: { mode: "ptt" }
      })
    );
    events.length = 0;
    const command = createCommandEnvelope({
      type: "voice.startPtt",
      payload: {}
    });

    await runtime.handle(command);

    const voiceEvent = events.find(
      (event) => event.event.type === "voice.state.changed"
    );
    expect(voiceEvent?.correlationId).toBe(command.correlationId);
    expect(
      events
        .filter((event) => event.event.type === "state.snapshot")
        .every((event) => event.correlationId === command.correlationId)
    ).toBe(true);
  });
});
