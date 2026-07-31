import { z } from "zod";

export const PROTOCOL_VERSION = 1 as const;
export const IPC_COMMAND_CHANNEL = "jarvis-k:command";
export const IPC_EVENT_CHANNEL = "jarvis-k:event";
export const IPC_VOICE_AUDIO_CHANNEL = "jarvis-k:voice-audio";
export const IPC_VOICE_SETTINGS_OPEN_CHANNEL =
  "jarvis-k:voice-settings-open";
export const IPC_VOICE_SETTINGS_STATUS_CHANNEL =
  "jarvis-k:voice-settings-status";

export const TaskStateSchema = z.enum([
  "queued",
  "running",
  "waiting_approval",
  "paused",
  "completed",
  "failed",
  "cancelled"
]);

export type TaskState = z.infer<typeof TaskStateSchema>;

export const VoiceStateSchema = z.enum([
  "idle",
  "connecting",
  "ready",
  "recording",
  "finalizing",
  "speaking",
  "interrupted",
  "recovering",
  "error"
]);

export type VoiceState = z.infer<typeof VoiceStateSchema>;

export const VoiceModeSchema = z.enum(["disabled", "ptt", "continuous"]);
export type VoiceMode = z.infer<typeof VoiceModeSchema>;

export const VoicePermissionStateSchema = z.enum([
  "unknown",
  "prompt",
  "granted",
  "denied"
]);
export type VoicePermissionState = z.infer<
  typeof VoicePermissionStateSchema
>;

export const VoiceServiceStatusSchema = z
  .object({
    configured: z.boolean(),
    secureStorageAvailable: z.boolean(),
    language: z.enum(["zh", "en"]).optional()
  })
  .strict();
export type VoiceServiceStatus = z.infer<
  typeof VoiceServiceStatusSchema
>;

export const VoiceAudioFrameMetadataSchema = z
  .object({
    captureId: z.string().min(1).max(128),
    sequenceId: z.number().int().nonnegative(),
    capturedAt: z.string().datetime(),
    sampleRate: z.literal(16_000),
    channels: z.literal(1),
    encoding: z.literal("pcm_s16le"),
    byteLength: z.number().int().positive().max(65_536)
  })
  .strict();
export type VoiceAudioFrameMetadata = z.infer<
  typeof VoiceAudioFrameMetadataSchema
>;

const Uint8ArraySchema = z.custom<Uint8Array>(
  (value) =>
    value instanceof Uint8Array ||
    (ArrayBuffer.isView(value) &&
      "BYTES_PER_ELEMENT" in value &&
      value.BYTES_PER_ELEMENT === 1),
  "Expected PCM bytes as Uint8Array."
);

export const VoiceAudioFrameSchema = z
  .object({
    metadata: VoiceAudioFrameMetadataSchema,
    pcm: Uint8ArraySchema
  })
  .strict()
  .superRefine((frame, context) => {
    if (frame.pcm.byteLength !== frame.metadata.byteLength) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pcm"],
        message: "PCM byte length does not match audio frame metadata."
      });
    }
    if (frame.pcm.byteLength % 2 !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pcm"],
        message: "PCM16 audio frames must contain complete 16-bit samples."
      });
    }
  });
export type VoiceAudioFrame = z.infer<typeof VoiceAudioFrameSchema>;

export const CoreVoiceAudioMessageSchema = z
  .object({
    kind: z.literal("voice-audio"),
    frame: VoiceAudioFrameSchema
  })
  .strict();
export type CoreVoiceAudioMessage = z.infer<
  typeof CoreVoiceAudioMessageSchema
>;

const EmptyPayloadSchema = z.object({}).strict();

export const AgentCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("agent.ping"),
    payload: z.object({ sentAt: z.string().datetime() }).strict()
  }),
  z.object({
    type: z.literal("agent.getSnapshot"),
    payload: EmptyPayloadSchema
  }),
  z.object({
    type: z.literal("agent.getCapabilities"),
    payload: EmptyPayloadSchema
  }),
  z.object({
    type: z.literal("agent.listModelManifests"),
    payload: z
      .object({
        capability: z.lazy(() => LocalModelCapabilitySchema).optional(),
        includeRedRisk: z.boolean().optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("agent.listModelCandidates"),
    payload: z
      .object({
        capability: z.lazy(() => LocalModelCapabilitySchema).optional(),
        includeRedRisk: z.boolean().optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("agent.listModelInventory"),
    payload: EmptyPayloadSchema
  }),
  z.object({
    type: z.literal("agent.listModelRuntimeAdapters"),
    payload: EmptyPayloadSchema
  }),
  z.object({
    type: z.literal("agent.listModelOperations"),
    payload: z
      .object({
        modelId: z.string().min(1).max(300).optional(),
        activeOnly: z.boolean().optional(),
        limit: z.number().int().min(1).max(500).optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("agent.getResourceDiagnostics"),
    payload: EmptyPayloadSchema
  }),
  z.object({
    type: z.literal("agent.prepareModelInstall"),
    payload: z
      .object({
        modelId: z.string().min(1).max(300),
        allowYellowRisk: z.boolean().optional(),
        allowUnknownRisk: z.boolean().optional(),
        exclusiveGpu: z.boolean().optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("agent.previewModelInstallability"),
    payload: z
      .object({
        modelId: z.string().min(1).max(300),
        allowYellowRisk: z.boolean().optional(),
        allowUnknownRisk: z.boolean().optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("agent.getMemoryHealth"),
    payload: EmptyPayloadSchema
  }),
  z.object({
    type: z.literal("agent.exportMemorySnapshot"),
    payload: EmptyPayloadSchema
  }),
  z.object({
    type: z.literal("agent.importMemorySnapshot"),
    payload: z
      .object({
        snapshot: z.lazy(() => MemorySnapshotSchema)
      })
      .strict()
  }),
  z.object({
    type: z.literal("agent.listConversations"),
    payload: z
      .object({
        limit: z.number().int().min(1).max(500).optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("agent.createConversation"),
    payload: z
      .object({
        title: z.string().trim().min(1).max(200).optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("agent.selectConversation"),
    payload: z
      .object({
        conversationId: z.string().min(1).max(128)
      })
      .strict()
  }),
  z.object({
    type: z.literal("agent.renameConversation"),
    payload: z
      .object({
        conversationId: z.string().min(1).max(128),
        title: z.string().trim().min(1).max(200)
      })
      .strict()
  }),
  z.object({
    type: z.literal("agent.sendMessage"),
    payload: z
      .object({
        conversationId: z.string().min(1).max(128).optional(),
        text: z.string().trim().min(1).max(20_000)
      })
      .strict()
  })
]);

export type AgentCommand = z.infer<typeof AgentCommandSchema>;

export const VoiceCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("voice.setMode"),
    payload: z.object({ mode: VoiceModeSchema }).strict()
  }),
  z.object({
    type: z.literal("voice.startPtt"),
    payload: z
      .object({
        captureId: z.string().min(1).max(128).optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("voice.stopPtt"),
    payload: z
      .object({
        captureId: z.string().min(1).max(128).optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("voice.cancel"),
    payload: z
      .object({
        reason: z.enum([
          "user",
          "window-blur",
          "capture-error",
          "shutdown"
        ])
      })
      .strict()
  }),
  z.object({
    type: z.literal("voice.suspendForTts"),
    payload: z
      .object({
        playbackId: z.string().min(1).max(128)
      })
      .strict()
  }),
  z.object({
    type: z.literal("voice.resumeAfterTts"),
    payload: z
      .object({
        playbackId: z.string().min(1).max(128),
        interrupted: z.boolean()
      })
      .strict()
  }),
  z.object({
    type: z.literal("voice.reportPermission"),
    payload: z
      .object({
        permission: VoicePermissionStateSchema
      })
      .strict()
  })
]);

export type VoiceCommand = z.infer<typeof VoiceCommandSchema>;

export const AppCommandSchema = z.union([
  AgentCommandSchema,
  VoiceCommandSchema
]);

export type AppCommand = z.infer<typeof AppCommandSchema>;

export const CommandEnvelopeSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    commandId: z.string().min(1).max(128),
    correlationId: z.string().min(1).max(128),
    createdAt: z.string().datetime(),
    command: AppCommandSchema
  })
  .strict();

export type CommandEnvelope = z.infer<typeof CommandEnvelopeSchema>;

export const StructuredErrorSchema = z
  .object({
    code: z.string().min(1).max(128),
    message: z.string().min(1).max(2_000),
    retryable: z.boolean(),
    details: z.record(z.unknown()).optional()
  })
  .strict();

export type StructuredError = z.infer<typeof StructuredErrorSchema>;

export const CommandResultSchema = z.union([
  z
    .object({
      protocolVersion: z.literal(PROTOCOL_VERSION),
      commandId: z.string().min(1),
      correlationId: z.string().min(1),
      completedAt: z.string().datetime(),
      ok: z.literal(true),
      data: z.unknown().optional()
    })
    .strict(),
  z
    .object({
      protocolVersion: z.literal(PROTOCOL_VERSION),
      commandId: z.string().min(1),
      correlationId: z.string().min(1),
      completedAt: z.string().datetime(),
      ok: z.literal(false),
      error: StructuredErrorSchema
    })
    .strict()
]);

export type CommandResult = z.infer<typeof CommandResultSchema>;

export const MessageSchema = z
  .object({
    id: z.string().min(1),
    conversationId: z.string().min(1),
    role: z.enum(["user", "assistant", "system"]),
    text: z.string(),
    createdAt: z.string().datetime()
  })
  .strict();

export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z
  .object({
    id: z.string().min(1).max(128),
    title: z.string().trim().min(1).max(200),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    lastMessageAt: z.string().datetime().optional()
  })
  .strict();

export type Conversation = z.infer<typeof ConversationSchema>;

export const MemoryHealthSchema = z
  .object({
    status: z.enum(["ok", "degraded"]),
    checkedAt: z.string().datetime(),
    code: z.string().min(1).max(128).optional(),
    message: z.string().min(1).max(2_000).optional()
  })
  .strict();

export type MemoryHealth = z.infer<typeof MemoryHealthSchema>;

export const MemorySummarySchema = z
  .object({
    id: z.string().min(1).max(128),
    conversationId: z.string().min(1).max(128),
    text: z.string().trim().min(1).max(20_000),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    fromMessageId: z.string().min(1).max(128).optional(),
    toMessageId: z.string().min(1).max(128).optional()
  })
  .strict();

export type MemorySummary = z.infer<typeof MemorySummarySchema>;

export const MemorySnapshotSchema = z
  .object({
    messages: z.array(MessageSchema),
    conversations: z.array(ConversationSchema).default([]),
    summaries: z.array(MemorySummarySchema).default([]),
    activeConversationId: z.string().min(1).max(128).optional()
  })
  .strict();

export type MemorySnapshot = z.infer<typeof MemorySnapshotSchema>;

export const DeviceRuntimeModeSchema = z.enum([
  "lite",
  "standard",
  "local_enhanced",
  "private_offline"
]);

export type DeviceRuntimeMode = z.infer<typeof DeviceRuntimeModeSchema>;

export const AccelerationBackendSchema = z.enum([
  "cpu",
  "cuda",
  "directml",
  "openvino",
  "onnxruntime"
]);

export type AccelerationBackend = z.infer<
  typeof AccelerationBackendSchema
>;

export const GpuDeviceSchema = z
  .object({
    name: z.string().min(1).max(300),
    vendor: z
      .enum(["nvidia", "amd", "intel", "microsoft", "unknown"])
      .optional(),
    dedicatedMemoryBytes: z.number().int().nonnegative().optional(),
    driverVersion: z.string().min(1).max(128).optional()
  })
  .strict();

export type GpuDevice = z.infer<typeof GpuDeviceSchema>;

export const DeviceCapabilitySchema = z
  .object({
    checkedAt: z.string().datetime(),
    platform: z.enum(["win32", "darwin", "linux", "unknown"]),
    arch: z.string().min(1).max(64),
    cpuLogicalCores: z.number().int().positive(),
    totalMemoryBytes: z.number().int().nonnegative(),
    availableMemoryBytes: z.number().int().nonnegative(),
    gpus: z.array(GpuDeviceSchema).default([]),
    accelerationBackends: z.array(AccelerationBackendSchema).default([
      "cpu"
    ]),
    recommendedMode: DeviceRuntimeModeSchema,
    reasons: z.array(z.string().min(1).max(300)).default([])
  })
  .strict();

export type DeviceCapability = z.infer<typeof DeviceCapabilitySchema>;

export const LocalModelCapabilitySchema = z.enum([
  "speech_to_text",
  "text_to_speech",
  "ocr",
  "embedding",
  "reranker",
  "intent_router",
  "vision"
]);

export type LocalModelCapability = z.infer<
  typeof LocalModelCapabilitySchema
>;

export const ModelRuntimeSchema = z.enum([
  "ctranslate2",
  "onnxruntime",
  "llama_cpp",
  "transformers",
  "paddle",
  "system",
  "remote"
]);

export type ModelRuntime = z.infer<typeof ModelRuntimeSchema>;

export const ModelRuntimeAdapterDescriptorSchema = z
  .object({
    runtime: ModelRuntimeSchema,
    capabilities: z.array(LocalModelCapabilitySchema),
    accelerationBackends: z.array(AccelerationBackendSchema).default([]),
    notes: z.array(z.string().min(1).max(500)).default([])
  })
  .strict();

export type ModelRuntimeAdapterDescriptor = z.infer<
  typeof ModelRuntimeAdapterDescriptorSchema
>;

export const ModelDistributionStatusSchema = z.enum([
  "not_downloaded",
  "available",
  "loaded",
  "unavailable",
  "cloud_only"
]);

export type ModelDistributionStatus = z.infer<
  typeof ModelDistributionStatusSchema
>;

export const ModelManifestSchema = z
  .object({
    id: z.string().min(1).max(300),
    capability: LocalModelCapabilitySchema,
    source: z.enum(["huggingface", "jarvis", "system", "third_party"]),
    revision: z.string().min(1).max(128),
    license: z.string().min(1).max(128),
    runtime: ModelRuntimeSchema,
    quantization: z.string().min(1).max(64).optional(),
    sizeBytes: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    minMemoryBytes: z.number().int().nonnegative().optional(),
    minVramBytes: z.number().int().nonnegative().optional(),
    licenseRisk: z.enum(["green", "yellow", "red", "unknown"])
  })
  .strict();

export type ModelManifest = z.infer<typeof ModelManifestSchema>;

export const ModelAuditRecordSchema = z
  .object({
    checkedAt: z.string().datetime(),
    evidenceUrls: z.array(z.string().url()).min(1),
    pinStatus: z.enum(["candidate", "pending_pin", "pinned", "rejected"]),
    notes: z.array(z.string().min(1).max(500)).default([])
  })
  .strict();

export type ModelAuditRecord = z.infer<typeof ModelAuditRecordSchema>;

export const ModelCandidateSchema = z
  .object({
    id: z.string().min(1).max(300),
    capability: LocalModelCapabilitySchema,
    source: z.enum(["huggingface", "jarvis", "system", "third_party"]),
    officialUrl: z.string().url(),
    license: z.string().min(1).max(128),
    licenseRisk: z.enum(["green", "yellow", "red", "unknown"]),
    distributionRisk: z.enum(["green", "yellow", "red", "unknown"]),
    runtime: ModelRuntimeSchema,
    recommendedMode: DeviceRuntimeModeSchema.optional(),
    downloadEnabled: z.literal(false),
    audit: ModelAuditRecordSchema
  })
  .strict();

export type ModelCandidate = z.infer<typeof ModelCandidateSchema>;

export const ModelInventoryItemSchema = z
  .object({
    manifest: ModelManifestSchema,
    status: ModelDistributionStatusSchema,
    installPath: z.string().min(1).max(500).optional(),
    lastVerifiedAt: z.string().datetime().optional()
  })
  .strict();

export type ModelInventoryItem = z.infer<
  typeof ModelInventoryItemSchema
>;

export const EmbeddingInputSchema = z
  .object({
    id: z.string().min(1).max(128).optional(),
    text: z.string().trim().min(1).max(20_000)
  })
  .strict();

export type EmbeddingInput = z.infer<typeof EmbeddingInputSchema>;

export const EmbeddingVectorSchema = z
  .object({
    inputId: z.string().min(1).max(128).optional(),
    values: z.array(z.number().finite()).min(1).max(8192)
  })
  .strict();

export type EmbeddingVector = z.infer<typeof EmbeddingVectorSchema>;

export const EmbeddingGenerationRequestSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    inputs: z.array(EmbeddingInputSchema).min(1).max(128),
    dimensions: z.number().int().positive().max(8192).optional()
  })
  .strict();

export type EmbeddingGenerationRequest = z.infer<
  typeof EmbeddingGenerationRequestSchema
>;

export const EmbeddingGenerationResultSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    dimensions: z.number().int().positive().max(8192),
    vectors: z.array(EmbeddingVectorSchema).min(1).max(128),
    generatedAt: z.string().datetime()
  })
  .strict()
  .superRefine((result, ctx) => {
    if (result.vectors.length === 0) {
      return;
    }
    for (const [index, vector] of result.vectors.entries()) {
      if (vector.values.length !== result.dimensions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["vectors", index, "values"],
          message: "Embedding vector length must match dimensions."
        });
      }
    }
  });

export type EmbeddingGenerationResult = z.infer<
  typeof EmbeddingGenerationResultSchema
>;

const OcrImageBytesSchema = z.custom<Uint8Array>(
  (value) =>
    value instanceof Uint8Array ||
    (ArrayBuffer.isView(value) &&
      "BYTES_PER_ELEMENT" in value &&
      value.BYTES_PER_ELEMENT === 1),
  "Expected image bytes as Uint8Array."
);

export const OcrImageInputSchema = z
  .object({
    id: z.string().min(1).max(128).optional(),
    mimeType: z.enum([
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/bmp"
    ]),
    bytes: OcrImageBytesSchema,
    width: z.number().int().positive().max(100_000).optional(),
    height: z.number().int().positive().max(100_000).optional()
  })
  .strict()
  .superRefine((image, ctx) => {
    if (image.bytes.byteLength > 20 * 1024 * 1024) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bytes"],
        message: "OCR image input must not exceed 20 MiB."
      });
    }
  });

export type OcrImageInput = z.infer<typeof OcrImageInputSchema>;

export const OcrBoundingBoxSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1)
  })
  .strict()
  .superRefine((box, ctx) => {
    if (box.x + box.width > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["width"],
        message: "OCR bounding box must stay within normalized image width."
      });
    }
    if (box.y + box.height > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["height"],
        message: "OCR bounding box must stay within normalized image height."
      });
    }
  });

export type OcrBoundingBox = z.infer<typeof OcrBoundingBoxSchema>;

export const OcrTextBlockSchema = z
  .object({
    text: z.string().trim().min(1).max(20_000),
    confidence: z.number().min(0).max(1).optional(),
    boundingBox: OcrBoundingBoxSchema.optional()
  })
  .strict();

export type OcrTextBlock = z.infer<typeof OcrTextBlockSchema>;

export const OcrRecognitionRequestSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    image: OcrImageInputSchema,
    languages: z.array(z.enum(["zh", "en"])).min(1).max(8).optional()
  })
  .strict();

export type OcrRecognitionRequest = z.infer<
  typeof OcrRecognitionRequestSchema
>;

export const OcrRecognitionResultSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    imageId: z.string().min(1).max(128).optional(),
    text: z.string().max(100_000),
    blocks: z.array(OcrTextBlockSchema).max(2000).default([]),
    recognizedAt: z.string().datetime()
  })
  .strict();

export type OcrRecognitionResult = z.infer<
  typeof OcrRecognitionResultSchema
>;

export const IntentRoutingContextSchema = z
  .object({
    locale: z.enum(["zh", "en"]).optional(),
    activeConversationId: z.string().min(1).max(128).optional(),
    allowedIntents: z.array(z.string().min(1).max(128)).max(200).optional()
  })
  .strict();

export type IntentRoutingContext = z.infer<
  typeof IntentRoutingContextSchema
>;

export const IntentRoutingRequestSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    utterance: z.string().trim().min(1).max(20_000),
    context: IntentRoutingContextSchema.optional()
  })
  .strict();

export type IntentRoutingRequest = z.infer<
  typeof IntentRoutingRequestSchema
>;

export const IntentCandidateSchema = z
  .object({
    intent: z.string().min(1).max(128),
    confidence: z.number().min(0).max(1),
    slots: z.record(z.unknown()).default({}),
    reasons: z.array(z.string().min(1).max(500)).default([])
  })
  .strict();

export type IntentCandidate = z.infer<typeof IntentCandidateSchema>;

export const IntentRoutingResultSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    utterance: z.string().trim().min(1).max(20_000),
    candidates: z.array(IntentCandidateSchema).max(20).default([]),
    routedAt: z.string().datetime()
  })
  .strict();

export type IntentRoutingResult = z.infer<
  typeof IntentRoutingResultSchema
>;

export const RerankDocumentSchema = z
  .object({
    id: z.string().min(1).max(128),
    text: z.string().trim().min(1).max(20_000),
    metadata: z.record(z.unknown()).default({})
  })
  .strict();

export type RerankDocument = z.infer<typeof RerankDocumentSchema>;

export const RerankRequestSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    query: z.string().trim().min(1).max(20_000),
    documents: z.array(RerankDocumentSchema).min(1).max(200),
    topK: z.number().int().positive().max(200).optional()
  })
  .strict();

export type RerankRequest = z.infer<typeof RerankRequestSchema>;

export const RerankResultItemSchema = z
  .object({
    documentId: z.string().min(1).max(128),
    score: z.number().finite(),
    rank: z.number().int().positive()
  })
  .strict();

export type RerankResultItem = z.infer<typeof RerankResultItemSchema>;

export const RerankResultSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    query: z.string().trim().min(1).max(20_000),
    results: z.array(RerankResultItemSchema).max(200),
    rankedAt: z.string().datetime()
  })
  .strict();

export type RerankResult = z.infer<typeof RerankResultSchema>;

export const ModelInstallabilityReportSchema = z
  .object({
    modelId: z.string().min(1).max(300),
    allowed: z.boolean(),
    reasons: z.array(z.string().min(1).max(500)).default([]),
    runtimeMode: DeviceRuntimeModeSchema
  })
  .strict();

export type ModelInstallabilityReport = z.infer<
  typeof ModelInstallabilityReportSchema
>;

export const ModelOperationPhaseSchema = z.enum([
  "queued",
  "prechecking",
  "blocked",
  "downloading",
  "verifying",
  "available",
  "loading",
  "loaded",
  "releasing",
  "removing",
  "cancelled",
  "failed"
]);

export type ModelOperationPhase = z.infer<
  typeof ModelOperationPhaseSchema
>;

export const ModelOperationProgressSchema = z
  .object({
    downloadedBytes: z.number().int().nonnegative(),
    totalBytes: z.number().int().nonnegative().optional()
  })
  .strict();

export type ModelOperationProgress = z.infer<
  typeof ModelOperationProgressSchema
>;

export const ModelOperationSnapshotSchema = z
  .object({
    operationId: z.string().min(1).max(128),
    modelId: z.string().min(1).max(300),
    capability: LocalModelCapabilitySchema,
    phase: ModelOperationPhaseSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    progress: ModelOperationProgressSchema.optional(),
    reasons: z.array(z.string().min(1).max(500)).default([]),
    error: StructuredErrorSchema.optional()
  })
  .strict();

export type ModelOperationSnapshot = z.infer<
  typeof ModelOperationSnapshotSchema
>;

export const ResourceSchedulerDiagnosticsSchema = z
  .object({
    checkedAt: z.string().datetime(),
    totalMemoryBytes: z.number().int().nonnegative(),
    availableMemoryBytes: z.number().int().nonnegative(),
    leasedMemoryBytes: z.number().int().nonnegative(),
    totalVramBytes: z.number().int().nonnegative(),
    availableVramBytes: z.number().int().nonnegative(),
    leasedVramBytes: z.number().int().nonnegative(),
    activeLeaseCount: z.number().int().nonnegative(),
    exclusiveGpuLeaseActive: z.boolean()
  })
  .strict();

export type ResourceSchedulerDiagnostics = z.infer<
  typeof ResourceSchedulerDiagnosticsSchema
>;

export const ProviderSelectionSchema = z
  .object({
    capability: LocalModelCapabilitySchema,
    provider: z.string().min(1).max(128),
    execution: z.enum(["local", "cloud", "system", "disabled"]),
    loadPolicy: z.enum(["resident", "on_demand", "remote", "disabled"]),
    reason: z.string().min(1).max(500)
  })
  .strict();

export type ProviderSelection = z.infer<
  typeof ProviderSelectionSchema
>;

export const CapabilitySnapshotSchema = z
  .object({
    checkedAt: z.string().datetime(),
    device: DeviceCapabilitySchema,
    runtimeMode: DeviceRuntimeModeSchema,
    providerPlan: z.array(ProviderSelectionSchema),
    modelInventory: z.array(ModelInventoryItemSchema).default([])
  })
  .strict();

export type CapabilitySnapshot = z.infer<
  typeof CapabilitySnapshotSchema
>;

export const TaskSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    state: TaskStateSchema,
    updatedAt: z.string().datetime()
  })
  .strict();

export type Task = z.infer<typeof TaskSchema>;

export const VoiceTranscriptSchema = z
  .object({
    sessionId: z.string().min(1).max(128),
    text: z.string().max(20_000),
    isFinal: z.boolean(),
    segmentId: z.string().min(1).max(128).optional(),
    updatedAt: z.string().datetime()
  })
  .strict();
export type VoiceTranscript = z.infer<typeof VoiceTranscriptSchema>;

export const VoiceSnapshotSchema = z
  .object({
    state: VoiceStateSchema,
    mode: VoiceModeSchema,
    permission: VoicePermissionStateSchema.optional(),
    sessionId: z.string().min(1).max(128).optional(),
    transcript: VoiceTranscriptSchema.optional()
  })
  .strict();
export type VoiceSnapshot = z.infer<typeof VoiceSnapshotSchema>;

export const CoreSnapshotSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    coreInstanceId: z.string().min(1),
    sequenceId: z.number().int().nonnegative(),
    health: z.enum(["starting", "ready", "degraded"]),
    startedAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    voice: VoiceSnapshotSchema,
    messages: z.array(MessageSchema),
    conversations: z.array(ConversationSchema).default([]),
    activeConversationId: z.string().min(1).max(128).optional(),
    memoryHealth: MemoryHealthSchema.optional(),
    capabilities: CapabilitySnapshotSchema.optional(),
    modelOperations: z.array(ModelOperationSnapshotSchema).default([]),
    resourceDiagnostics: ResourceSchedulerDiagnosticsSchema.optional(),
    tasks: z.array(TaskSchema)
  })
  .strict();

export type CoreSnapshot = z.infer<typeof CoreSnapshotSchema>;

export const AgentEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("system.core.ready"),
    payload: z
      .object({
        coreInstanceId: z.string().min(1),
        startedAt: z.string().datetime()
      })
      .strict()
  }),
  z.object({
    type: z.literal("system.health"),
    payload: z
      .object({
        status: z.enum(["ready", "degraded"]),
        uptimeMs: z.number().nonnegative()
      })
      .strict()
  }),
  z.object({
    type: z.literal("system.core.lifecycle"),
    payload: z
      .object({
        status: z.enum([
          "starting",
          "online",
          "restarting",
          "stopped",
          "failed"
        ]),
        attempt: z.number().int().nonnegative(),
        reason: z.string().optional(),
        processId: z.number().int().positive().optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("state.snapshot"),
    payload: CoreSnapshotSchema
  }),
  z.object({
    type: z.literal("model.operation.updated"),
    payload: ModelOperationSnapshotSchema
  }),
  z.object({
    type: z.literal("agent.message.accepted"),
    payload: MessageSchema
  })
]);

export type AgentEvent = z.infer<typeof AgentEventSchema>;

export const VoiceEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("voice.state.changed"),
    payload: z
      .object({
        state: VoiceStateSchema,
        mode: VoiceModeSchema,
        sessionId: z.string().min(1).max(128).optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("voice.transcript.updated"),
    payload: VoiceTranscriptSchema
  }),
  z.object({
    type: z.literal("voice.permission.changed"),
    payload: z
      .object({
        permission: VoicePermissionStateSchema
      })
      .strict()
  }),
  z.object({
    type: z.literal("voice.playback.interrupted"),
    payload: z
      .object({
        playbackId: z.string().min(1).max(128),
        reason: z.literal("barge-in")
      })
      .strict()
  }),
  z.object({
    type: z.literal("voice.diagnostic"),
    payload: z
      .object({
        level: z.enum(["info", "warning"]),
        code: z.string().regex(/^[A-Z0-9_]+$/).max(128),
        attempt: z.number().int().nonnegative().optional(),
        bufferedFrames: z.number().int().nonnegative().optional(),
        connectionCount: z.number().int().nonnegative().optional()
      })
      .strict()
  }),
  z.object({
    type: z.literal("voice.error"),
    payload: z
      .object({
        state: VoiceStateSchema,
        error: StructuredErrorSchema
      })
      .strict()
  })
]);

export type VoiceEvent = z.infer<typeof VoiceEventSchema>;

export const AppEventSchema = z.union([
  AgentEventSchema,
  VoiceEventSchema
]);

export type AppEvent = z.infer<typeof AppEventSchema>;

export const EventEnvelopeSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    eventId: z.string().min(1),
    sequenceId: z.number().int().nonnegative(),
    correlationId: z.string().min(1).optional(),
    createdAt: z.string().datetime(),
    source: z.enum(["core", "supervisor"]),
    event: AppEventSchema
  })
  .strict();

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

export const CoreCommandMessageSchema = z
  .object({
    kind: z.literal("command"),
    envelope: CommandEnvelopeSchema
  })
  .strict();

export const CoreInboundMessageSchema = z.union([
  CoreCommandMessageSchema,
  CoreVoiceAudioMessageSchema
]);

export type CoreInboundMessage = z.infer<typeof CoreInboundMessageSchema>;

export const CoreOutboundMessageSchema = z.union([
  z
    .object({
      kind: z.literal("result"),
      envelope: CommandResultSchema
    })
    .strict(),
  z
    .object({
      kind: z.literal("event"),
      envelope: EventEnvelopeSchema
    })
    .strict()
]);

export type CoreOutboundMessage = z.infer<typeof CoreOutboundMessageSchema>;

function fallbackId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
}

export function createId(prefix: string): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  return randomUuid ? `${prefix}-${randomUuid}` : fallbackId(prefix);
}

export function createCommandEnvelope(
  command: AppCommand
): CommandEnvelope {
  return CommandEnvelopeSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    commandId: createId("cmd"),
    correlationId: createId("corr"),
    createdAt: new Date().toISOString(),
    command
  });
}

export interface JarvisBridge {
  sendCommand(command: AppCommand): Promise<CommandResult>;
  sendVoiceAudio(frame: VoiceAudioFrame): void;
  getSnapshot(): Promise<CommandResult>;
  getVoiceServiceStatus(): Promise<VoiceServiceStatus>;
  openVoiceSettings(): Promise<VoiceServiceStatus>;
  onEvent(listener: (event: EventEnvelope) => void): () => void;
}
