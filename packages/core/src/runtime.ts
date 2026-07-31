import {
  AppEvent,
  CapabilitySnapshot,
  CapabilitySnapshotSchema,
  CommandEnvelope,
  CommandEnvelopeSchema,
  CommandResult,
  Conversation,
  CoreSnapshot,
  EventEnvelope,
  Message,
  MemoryHealth,
  MemoryHealthSchema,
  ModelInstallabilityReportSchema,
  ModelCandidateSchema,
  ModelInventoryItemSchema,
  ModelManifestSchema,
  ModelOperationSnapshot,
  ModelOperationSnapshotSchema,
  MemorySnapshot,
  PROTOCOL_VERSION,
  StructuredError,
  VoiceCommand,
  VoiceEvent,
  createId
} from "@jarvis-k/contracts";
import type {
  CapabilityProvider,
  ModelCandidateRegistry,
  ModelInstallationPlanner,
  ModelLifecycleManager,
  ModelOperationSupervisor,
  ModelRegistry
} from "@jarvis-k/capabilities";
import type { MemoryRepository } from "@jarvis-k/memory";
import type {
  VoiceActionResult,
  VoiceEnginePort
} from "@jarvis-k/voice";

type EventSink = (event: EventEnvelope) => void;

export class CoreRuntime {
  private readonly coreInstanceId = createId("core");
  private readonly startedAt: string;
  private readonly messages: Message[] = [];
  private readonly conversations: Conversation[] = [];
  private sequenceId = 0;
  private activeVoiceCorrelationId: string | undefined;
  private health: CoreSnapshot["health"] = "ready";
  private activeConversationId: string | undefined;
  private memoryHealth: MemoryHealth | undefined;
  private capabilities: CapabilitySnapshot | undefined;
  private readonly modelOperations: ModelOperationSnapshot[] = [];

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
    private readonly modelOperationSupervisor?: ModelOperationSupervisor
  ) {
    this.startedAt = this.now().toISOString();
  }

  public async hydrateCapabilities(): Promise<void> {
    if (!this.capabilityProvider) {
      return;
    }
    try {
      this.capabilities = CapabilitySnapshotSchema.parse(
        await this.capabilityProvider.inspect()
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

  public announceReady(): void {
    this.publish(
      {
        type: "system.core.ready",
        payload: {
          coreInstanceId: this.coreInstanceId,
          startedAt: this.startedAt
        }
      },
      undefined
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
      messages: this.messages.map((message) => ({ ...message })),
      conversations: this.conversations.map((conversation) => ({
        ...conversation
      })),
      ...(this.activeConversationId
        ? { activeConversationId: this.activeConversationId }
        : {}),
      ...(this.memoryHealth ? { memoryHealth: this.memoryHealth } : {}),
      ...(this.capabilities ? { capabilities: this.capabilities } : {}),
      modelOperations: this.modelOperations.map((operation) => ({
        ...operation,
        ...(operation.progress
          ? { progress: { ...operation.progress } }
          : {}),
        reasons: [...operation.reasons],
        ...(operation.error ? { error: { ...operation.error } } : {})
      })),
      tasks: []
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
                this.now().getTime() - new Date(this.startedAt).getTime()
              )
            }
          },
          envelope.correlationId
        );
        return this.success(envelope, {
          coreInstanceId: this.coreInstanceId,
          status: this.health === "degraded" ? "degraded" : "ready"
        });

      case "agent.getSnapshot": {
        const snapshot = this.publishSnapshot(envelope.correlationId);
        return this.success(envelope, snapshot);
      }

      case "agent.getCapabilities": {
        if (!this.capabilityProvider) {
          return this.capabilitiesUnavailable(envelope);
        }
        try {
          this.capabilities = CapabilitySnapshotSchema.parse(
            await this.capabilityProvider.inspect()
          );
          const snapshot = this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            capabilities: this.capabilities,
            snapshot
          });
        } catch {
          this.health = "degraded";
          return this.failure(envelope, {
            code: "CAPABILITY_INSPECTION_FAILED",
            message: "Unable to inspect local device capabilities.",
            retryable: true
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
              : { includeRedRisk: envelope.command.payload.includeRedRisk })
          });
          return this.success(envelope, {
            manifests: manifests.map((manifest) =>
              ModelManifestSchema.parse(manifest)
            )
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_REGISTRY_FAILED",
            message: "Unable to list model manifests.",
            retryable: true
          });
        }
      }

      case "agent.listModelCandidates": {
        if (!this.modelCandidateRegistry) {
          return this.modelsUnavailable(envelope);
        }
        try {
          const candidates =
            await this.modelCandidateRegistry.listCandidates({
              ...(envelope.command.payload.capability
                ? { capability: envelope.command.payload.capability }
                : {}),
              ...(envelope.command.payload.includeRedRisk === undefined
                ? {}
                : {
                    includeRedRisk:
                      envelope.command.payload.includeRedRisk
                  })
            });
          return this.success(envelope, {
            candidates: candidates.map((candidate) =>
              ModelCandidateSchema.parse(candidate)
            )
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_CANDIDATES_FAILED",
            message: "Unable to list model candidates.",
            retryable: true
          });
        }
      }

      case "agent.listModelInventory": {
        if (!this.modelLifecycleManager) {
          return this.modelsUnavailable(envelope);
        }
        try {
          const inventory =
            await this.modelLifecycleManager.listInventory();
          return this.success(envelope, {
            inventory: inventory.map((item) =>
              ModelInventoryItemSchema.parse(item)
            )
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_INVENTORY_FAILED",
            message: "Unable to list local model inventory.",
            retryable: true
          });
        }
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
              : { limit: envelope.command.payload.limit })
          });
          this.replaceModelOperations(operations);
          const snapshot = this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            operations: this.modelOperations.map((operation) =>
              ModelOperationSnapshotSchema.parse(operation)
            ),
            snapshot
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_OPERATIONS_FAILED",
            message: "Unable to list model operations.",
            retryable: true
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
            envelope.command.payload.modelId
          );
          if (!manifest) {
            return this.failure(envelope, {
              code: "MODEL_MANIFEST_NOT_FOUND",
              message: "Model manifest was not found.",
              retryable: false
            });
          }
          this.capabilities = CapabilitySnapshotSchema.parse(
            await this.capabilityProvider.inspect()
          );
          const report = await this.modelInstallationPlanner.preview({
            manifest: ModelManifestSchema.parse(manifest),
            device: this.capabilities.device,
            ...(envelope.command.payload.allowYellowRisk === undefined
              ? {}
              : {
                  allowYellowRisk:
                    envelope.command.payload.allowYellowRisk
                }),
            ...(envelope.command.payload.allowUnknownRisk === undefined
              ? {}
              : {
                  allowUnknownRisk:
                    envelope.command.payload.allowUnknownRisk
                })
          });
          return this.success(envelope, {
            report: ModelInstallabilityReportSchema.parse(report)
          });
        } catch {
          return this.failure(envelope, {
            code: "MODEL_INSTALLABILITY_FAILED",
            message: "Unable to preview model installability.",
            retryable: true
          });
        }
      }

      case "agent.getMemoryHealth": {
        const memoryHealth = await this.refreshMemoryHealth();
        return this.success(envelope, {
          memoryHealth
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
            snapshot
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
            envelope.command.payload.snapshot
          );
          const snapshot = await this.memoryRepository.getSnapshot();
          this.replaceMemorySnapshot(snapshot);
          await this.refreshMemoryHealth();
          const coreSnapshot = this.publishSnapshot(
            envelope.correlationId
          );
          return this.success(envelope, {
            imported: true,
            snapshot: coreSnapshot
          });
        } catch {
          this.health = "degraded";
          return this.memoryUnavailable(envelope);
        }
      }

      case "agent.listConversations": {
        if (!this.memoryRepository) {
          return this.memoryUnavailable(envelope);
        }
        try {
          const conversations =
            await this.memoryRepository.listConversations(
              envelope.command.payload.limit === undefined
                ? {}
                : { limit: envelope.command.payload.limit }
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
            snapshot
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
          const conversation =
            await this.memoryRepository.upsertConversation({
              id: createId("conv"),
              title: envelope.command.payload.title ?? "New conversation",
              createdAt: now,
              updatedAt: now
            });
          await this.memoryRepository.setActiveConversationId(
            conversation.id
          );
          await this.refreshConversationState();
          this.health = "ready";
          this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            conversation,
            activeConversationId: conversation.id
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
            envelope.command.payload.conversationId
          );
          await this.refreshConversationState();
          this.health = "ready";
          this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            activeConversationId:
              envelope.command.payload.conversationId
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
          const conversation =
            await this.memoryRepository.updateConversation({
              id: envelope.command.payload.conversationId,
              title: envelope.command.payload.title,
              updatedAt: this.now().toISOString()
            });
          await this.refreshConversationState();
          this.health = "ready";
          this.publishSnapshot(envelope.correlationId);
          return this.success(envelope, {
            conversation
          });
        } catch {
          this.health = "degraded";
          return this.memoryUnavailable(envelope);
        }
      }

      case "agent.sendMessage": {
        const conversationId = await this.resolveMessageConversationId(
          envelope.command.payload.conversationId
        );
        const message: Message = {
          id: createId("msg"),
          conversationId,
          role: "user",
          text: envelope.command.payload.text,
          createdAt: this.now().toISOString()
        };
        if (this.memoryRepository) {
          try {
            await this.memoryRepository.appendMessage(message);
            if (!this.activeConversationId) {
              await this.memoryRepository.setActiveConversationId(
                conversationId
              );
            }
            await this.refreshConversationState();
            this.health = "ready";
          } catch {
            this.health = "degraded";
            return this.failure(envelope, {
              code: "MEMORY_WRITE_FAILED",
              message: "Unable to persist the accepted message.",
              retryable: true
            });
          }
        } else {
          this.upsertLocalConversationForMessage(message);
        }
        this.messages.push(message);
        this.publish(
          {
            type: "agent.message.accepted",
            payload: message
          },
          envelope.correlationId
        );
        this.publishSnapshot(envelope.correlationId);
        return this.success(envelope, {
          accepted: true,
          messageId: message.id
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
    correlationId?: string
  ): void {
    const parsed = ModelOperationSnapshotSchema.parse(operation);
    const index = this.modelOperations.findIndex(
      (item) => item.operationId === parsed.operationId
    );
    if (index >= 0) {
      this.modelOperations[index] = parsed;
    } else {
      this.modelOperations.unshift(parsed);
    }
    this.publish(
      {
        type: "model.operation.updated",
        payload: parsed
      },
      correlationId
    );
    this.publishSnapshot(correlationId);
  }

  private publishSnapshot(correlationId?: string): CoreSnapshot {
    const nextSequenceId = this.sequenceId + 1;
    const snapshot = {
      ...this.getSnapshot(),
      sequenceId: nextSequenceId
    };
    this.publish(
      {
        type: "state.snapshot",
        payload: snapshot
      },
      correlationId
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
      ...(correlationId ? { correlationId } : {})
    };
    this.eventSink(envelope);
  }

  private async refreshMemoryHealth(): Promise<MemoryHealth> {
    if (!this.memoryRepository) {
      this.memoryHealth = MemoryHealthSchema.parse({
        status: "ok",
        checkedAt: this.now().toISOString()
      });
      return this.memoryHealth;
    }
    try {
      this.memoryHealth = MemoryHealthSchema.parse(
        await this.memoryRepository.checkHealth()
      );
      this.health =
        this.memoryHealth.status === "ok" ? "ready" : "degraded";
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
    this.replaceConversations(
      await this.memoryRepository.listConversations()
    );
    this.activeConversationId =
      await this.memoryRepository.getActiveConversationId();
  }

  private replaceConversations(conversations: Conversation[]): void {
    this.conversations.splice(
      0,
      this.conversations.length,
      ...conversations.map((conversation) => ({ ...conversation }))
    );
  }

  private replaceMemorySnapshot(snapshot: MemorySnapshot): void {
    this.messages.splice(
      0,
      this.messages.length,
      ...snapshot.messages.map((message) => ({ ...message }))
    );
    this.conversations.splice(
      0,
      this.conversations.length,
      ...snapshot.conversations.map((conversation) => ({
        ...conversation
      }))
    );
    this.activeConversationId = snapshot.activeConversationId;
  }

  private replaceModelOperations(
    operations: ModelOperationSnapshot[]
  ): void {
    this.modelOperations.splice(
      0,
      this.modelOperations.length,
      ...operations.map((operation) =>
        ModelOperationSnapshotSchema.parse(operation)
      )
    );
  }

  private async resolveMessageConversationId(
    explicitConversationId: string | undefined
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

  private upsertLocalConversationForMessage(message: Message): void {
    const existing = this.conversations.find(
      (conversation) => conversation.id === message.conversationId
    );
    if (!existing) {
      this.conversations.push({
        id: message.conversationId,
        title: this.defaultConversationTitle(message),
        createdAt: message.createdAt,
        updatedAt: message.createdAt,
        lastMessageAt: message.createdAt
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
      message: "Memory store is unavailable."
    });
  }

  private async handleVoiceCommand(
    envelope: CommandEnvelope,
    command: VoiceCommand
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
          result = this.voiceEngine.suspendForTts(
            command.payload.playbackId
          );
          break;
        case "voice.resumeAfterTts":
          result = await this.voiceEngine.resumeAfterTts(
            command.payload.playbackId,
            command.payload.interrupted
          );
          break;
        case "voice.reportPermission":
          result = this.voiceEngine.reportPermission(
            command.payload.permission
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
      voice: result.snapshot
    });
  }

  private success(
    envelope: CommandEnvelope,
    data?: unknown
  ): CommandResult {
    return {
      protocolVersion: PROTOCOL_VERSION,
      commandId: envelope.commandId,
      correlationId: envelope.correlationId,
      completedAt: this.now().toISOString(),
      ok: true,
      ...(data === undefined ? {} : { data })
    };
  }

  private failure(
    envelope: CommandEnvelope,
    error: StructuredError
  ): CommandResult {
    return {
      protocolVersion: PROTOCOL_VERSION,
      commandId: envelope.commandId,
      correlationId: envelope.correlationId,
      completedAt: this.now().toISOString(),
      ok: false,
      error
    };
  }

  private memoryUnavailable(envelope: CommandEnvelope): CommandResult {
    return this.failure(envelope, {
      code: "MEMORY_UNAVAILABLE",
      message: "Memory store is unavailable.",
      retryable: true
    });
  }

  private capabilitiesUnavailable(
    envelope: CommandEnvelope
  ): CommandResult {
    return this.failure(envelope, {
      code: "CAPABILITIES_UNAVAILABLE",
      message: "Device capability inspection is unavailable.",
      retryable: true
    });
  }

  private modelsUnavailable(envelope: CommandEnvelope): CommandResult {
    return this.failure(envelope, {
      code: "MODEL_GOVERNANCE_UNAVAILABLE",
      message: "Model governance is unavailable.",
      retryable: true
    });
  }
}
