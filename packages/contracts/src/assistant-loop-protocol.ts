import { z } from "zod";
import { ToolIdSchema, ToolRiskSchema } from "./tool-protocol";

export const ASSISTANT_LOOP_CONTRACT_VERSION = 1 as const;
export const ASSISTANT_LOOP_MAX_TOOL_ITERATIONS = 4 as const;
export const ASSISTANT_LOOP_STREAM_BUFFER_MAX_CHARS = 8_000 as const;

const ReferenceIdSchema = z.string().trim().min(1).max(128);
const ReasonCodeSchema = z.string().regex(/^[A-Z0-9_:. -]{1,160}$/u);
function safePublicString(maxLength: number): z.ZodEffects<z.ZodString, string, string> {
  return z
    .string()
    .trim()
    .min(1)
    .max(maxLength)
    .superRefine((value, context) => {
      if (/[\u0000-\u001f\u007f]/u.test(value)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Public assistant strings must not contain control characters.",
        });
      }
      if (
        /(?:\bBearer\b|BEGIN [A-Z ]+KEY|api[_-]?key|secret|token)/iu.test(value)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Public assistant strings must not contain credential-shaped values.",
        });
      }
    });
}
const SafePublicStringSchema = safePublicString(2_000);
const ToolArgumentStringSchema = safePublicString(1_000).superRefine(
  (value, context) => {
    if (
      /(?:https?:\/\/|[A-Za-z]:\\|\\\\|`{3}|function\s*\(|=>|powershell|cmd\.exe|shell)/iu.test(
        value,
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Tool arguments must not contain paths, URLs, executable code, or command lines.",
      });
    }
  },
);
const ToolArgumentKeySchema = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/u)
  .superRefine((value, context) => {
    if (
      value.toLowerCase() === "code" ||
      /(?:command|cmd|script|shell|powershell|credential|secret|token|api[_-]?key|authorization|header|env|stdout|stderr|raw|executable|function_call|tool_calls)/iu.test(
        value,
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Tool argument keys must not name credentials, raw payloads, env, or executable data.",
      });
    }
  });

export const AssistantTurnIdSchema = z
  .string()
  .regex(/^turn-[A-Za-z0-9][A-Za-z0-9_-]{0,118}$/u)
  .max(128)
  .brand<"AssistantTurnId">();
export type AssistantTurnId = z.infer<typeof AssistantTurnIdSchema>;

export const AssistantEventIdSchema = z
  .string()
  .regex(/^aevt-[A-Za-z0-9][A-Za-z0-9_-]{0,118}$/u)
  .max(128)
  .brand<"AssistantEventId">();
export type AssistantEventId = z.infer<typeof AssistantEventIdSchema>;

export const ToolProposalIdSchema = z
  .string()
  .regex(/^tprop-[A-Za-z0-9][A-Za-z0-9_-]{0,117}$/u)
  .max(128)
  .brand<"ToolProposalId">();
export type ToolProposalId = z.infer<typeof ToolProposalIdSchema>;

export const ToolExecutionIdSchema = z
  .string()
  .regex(/^texec-[A-Za-z0-9][A-Za-z0-9_-]{0,117}$/u)
  .max(128)
  .brand<"ToolExecutionId">();
export type ToolExecutionId = z.infer<typeof ToolExecutionIdSchema>;

export const AssistantProviderFailureReasonSchema = z.enum([
  "authentication_failed",
  "access_forbidden",
  "rate_limited",
  "provider_unavailable",
  "streaming_not_supported",
  "provider_timeout",
  "malformed_response",
  "unsupported_tool_call",
  "cancelled",
  "transport_failed",
  "unknown_provider_failure",
]);
export type AssistantProviderFailureReason = z.infer<
  typeof AssistantProviderFailureReasonSchema
>;

export type AssistantJsonValue =
  | string
  | number
  | boolean
  | null
  | readonly AssistantJsonValue[]
  | { readonly [key: string]: AssistantJsonValue };

function createAssistantJsonValueSchema(depth: number): z.ZodType<AssistantJsonValue> {
  const primitive = z.union([
    ToolArgumentStringSchema,
    z.number().finite(),
    z.boolean(),
    z.null(),
  ]);
  if (depth >= 4) {
    return primitive;
  }
  return z.lazy(() =>
    z.union([
      primitive,
      z.array(createAssistantJsonValueSchema(depth + 1)).max(16),
      z
        .record(ToolArgumentKeySchema, createAssistantJsonValueSchema(depth + 1))
        .superRefine((value, context) => {
          if (Object.keys(value).length > 24) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Assistant JSON objects must not contain more than 24 keys.",
            });
          }
        }),
    ]),
  );
}

export const AssistantJsonValueSchema = createAssistantJsonValueSchema(0);
export const AssistantJsonObjectSchema = z
  .record(ToolArgumentKeySchema, AssistantJsonValueSchema)
  .superRefine((value, context) => {
    if (Object.keys(value).length > 24) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Assistant JSON objects must not contain more than 24 keys.",
      });
    }
  });
export type AssistantJsonObject = z.infer<typeof AssistantJsonObjectSchema>;

export const AssistantInputSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("text"),
      text: safePublicString(20_000),
      source: z.enum(["user", "voice_transcript"]).default("user"),
      conversationId: ReferenceIdSchema.optional(),
    })
    .strict(),
]);
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantTurnStatusSchema = z.enum([
  "idle",
  "thinking",
  "streaming",
  "awaiting_approval",
  "executing",
  "synthesizing",
  "completed",
  "cancelled",
  "failed",
  "interrupted",
]);
export type AssistantTurnStatus = z.infer<typeof AssistantTurnStatusSchema>;

export const AssistantTurnSchema = z
  .object({
    contractVersion: z.literal(ASSISTANT_LOOP_CONTRACT_VERSION),
    turnId: AssistantTurnIdSchema,
    conversationId: ReferenceIdSchema.optional(),
    input: AssistantInputSchema,
    status: AssistantTurnStatusSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    maxToolIterations: z
      .literal(ASSISTANT_LOOP_MAX_TOOL_ITERATIONS)
      .default(ASSISTANT_LOOP_MAX_TOOL_ITERATIONS),
  })
  .strict();
export type AssistantTurn = z.infer<typeof AssistantTurnSchema>;

export const AssistantStreamDeltaSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("text"),
      text: safePublicString(2_000),
    })
    .strict(),
  z
    .object({
      kind: z.literal("status"),
      message: safePublicString(300),
    })
    .strict(),
]);
export type AssistantStreamDelta = z.infer<typeof AssistantStreamDeltaSchema>;

export const ToolProposalSchema = z
  .object({
    proposalId: ToolProposalIdSchema,
    turnId: AssistantTurnIdSchema,
    toolId: ToolIdSchema,
    risk: ToolRiskSchema,
    arguments: AssistantJsonObjectSchema,
    proposedAt: z.string().datetime(),
    safeSummary: safePublicString(500),
  })
  .strict();
export type ToolProposal = z.infer<typeof ToolProposalSchema>;

export const ToolDecisionSchema = z
  .object({
    proposalId: ToolProposalIdSchema,
    decision: z.enum(["allowed", "requires_approval", "denied"]),
    decidedAt: z.string().datetime(),
    policyVersion: z.string().trim().min(1).max(64),
    reasonCode: ReasonCodeSchema,
    taskId: ReferenceIdSchema.optional(),
    approvalRequestId: ReferenceIdSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.decision === "requires_approval" && !value.approvalRequestId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["approvalRequestId"],
        message: "Approval-required decisions must reference an approval request.",
      });
    }
    if (value.decision !== "requires_approval" && value.approvalRequestId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["approvalRequestId"],
        message: "Only approval-required decisions may carry approvalRequestId.",
      });
    }
  });
export type ToolDecision = z.infer<typeof ToolDecisionSchema>;

export const AssistantApprovalRequestSchema = z
  .object({
    approvalRequestId: ReferenceIdSchema,
    proposalId: ToolProposalIdSchema,
    taskId: ReferenceIdSchema.optional(),
    requestedAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
    safeSummary: safePublicString(500),
  })
  .strict();
export type AssistantApprovalRequest = z.infer<
  typeof AssistantApprovalRequestSchema
>;

export const AssistantApprovalResolutionSchema = z
  .object({
    approvalRequestId: ReferenceIdSchema,
    proposalId: ToolProposalIdSchema,
    resolution: z.enum(["approved", "denied", "timed_out"]),
    resolvedAt: z.string().datetime(),
    reasonCode: ReasonCodeSchema,
  })
  .strict();
export type AssistantApprovalResolution = z.infer<
  typeof AssistantApprovalResolutionSchema
>;

export const ToolExecutionRequestSchema = z
  .object({
    executionId: ToolExecutionIdSchema,
    proposalId: ToolProposalIdSchema,
    turnId: AssistantTurnIdSchema,
    toolId: ToolIdSchema,
    arguments: AssistantJsonObjectSchema,
    requestedAt: z.string().datetime(),
    timeoutMs: z.number().int().min(1_000).max(300_000),
    owner: z.enum(["desktop_host", "core_host_fixture", "plugin_runtime"]),
  })
  .strict();
export type ToolExecutionRequest = z.infer<typeof ToolExecutionRequestSchema>;

export const ToolResultFailureSchema = z
  .object({
    reasonCode: ReasonCodeSchema,
    safeMessage: safePublicString(1_000),
    retryable: z.boolean(),
  })
  .strict();
export type ToolResultFailure = z.infer<typeof ToolResultFailureSchema>;

export const ToolResultSchema = z
  .object({
    executionId: ToolExecutionIdSchema,
    proposalId: ToolProposalIdSchema,
    toolId: ToolIdSchema,
    resultClass: z.enum(["structured", "safe_summary", "failure"]),
    status: z.enum(["completed", "failed", "blocked", "timed_out", "cancelled"]),
    structuredResult: AssistantJsonObjectSchema.optional(),
    safeSummary: safePublicString(1_000).optional(),
    failure: ToolResultFailureSchema.optional(),
    resultedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.resultClass === "structured" && value.structuredResult === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["structuredResult"],
        message: "Structured tool results must carry structuredResult.",
      });
    }
    if (value.resultClass === "safe_summary" && value.safeSummary === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["safeSummary"],
        message: "Summary tool results must carry safeSummary.",
      });
    }
    if (value.resultClass === "failure" && value.failure === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failure"],
        message: "Failure tool results must carry failure.",
      });
    }
  });
export type ToolResult = z.infer<typeof ToolResultSchema>;

export const AssistantFinalAnswerSchema = z
  .object({
    turnId: AssistantTurnIdSchema,
    text: safePublicString(20_000),
    messageId: ReferenceIdSchema.optional(),
    completedAt: z.string().datetime(),
    usedToolIterations: z.number().int().min(0).max(ASSISTANT_LOOP_MAX_TOOL_ITERATIONS),
    rawProviderResponsePersisted: z.literal(false),
    providerRawPayloadExposed: z.literal(false),
  })
  .strict();
export type AssistantFinalAnswer = z.infer<typeof AssistantFinalAnswerSchema>;

export const AssistantFailureSchema = z
  .object({
    turnId: AssistantTurnIdSchema,
    failureClass: z.enum([
      "provider",
      "policy",
      "approval",
      "executor",
      "contract",
      "cancelled",
      "interrupted",
      "unknown",
    ]),
    reasonCode: ReasonCodeSchema,
    safeMessage: safePublicString(1_000),
    retryable: z.boolean(),
    failedAt: z.string().datetime(),
  })
  .strict();
export type AssistantFailure = z.infer<typeof AssistantFailureSchema>;

export const CancellationReasonSchema = z
  .object({
    kind: z.enum([
      "user_requested",
      "approval_timeout",
      "provider_timeout",
      "executor_timeout",
      "shutdown",
      "superseded",
    ]),
    requestedBy: z.enum(["renderer", "core", "supervisor", "system"]),
    safeMessage: safePublicString(500).optional(),
    cancelledAt: z.string().datetime(),
  })
  .strict();
export type CancellationReason = z.infer<typeof CancellationReasonSchema>;

export const AssistantModelAdapterEventSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("delta"),
      delta: AssistantStreamDeltaSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("final"),
      text: safePublicString(20_000),
    })
    .strict(),
  z
    .object({
      type: z.literal("failure"),
      reason: AssistantProviderFailureReasonSchema,
      safeMessage: safePublicString(1_000),
      retryable: z.boolean(),
    })
    .strict(),
]);
export type AssistantModelAdapterEvent = z.infer<
  typeof AssistantModelAdapterEventSchema
>;

const AssistantEventMetaSchema = z
  .object({
    eventId: AssistantEventIdSchema,
    turnId: AssistantTurnIdSchema,
    sequence: z.number().int().nonnegative().max(10_000),
    occurredAt: z.string().datetime(),
    causationEventId: AssistantEventIdSchema.optional(),
    conversationId: ReferenceIdSchema.optional(),
    taskId: ReferenceIdSchema.optional(),
    proposalId: ToolProposalIdSchema.optional(),
    executionId: ToolExecutionIdSchema.optional(),
  })
  .strict();

export const AssistantEventSchema = z.discriminatedUnion("type", [
  AssistantEventMetaSchema.extend({
    type: z.literal("turn.accepted"),
    payload: z
      .object({
        input: AssistantInputSchema,
        maxToolIterations: z
          .literal(ASSISTANT_LOOP_MAX_TOOL_ITERATIONS)
          .default(ASSISTANT_LOOP_MAX_TOOL_ITERATIONS),
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("provider.started"),
    payload: z
      .object({
        adapterId: ReferenceIdSchema,
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("provider.delta"),
    payload: z
      .object({
        delta: AssistantStreamDeltaSchema,
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("tool.proposed"),
    payload: z
      .object({
        proposal: ToolProposalSchema,
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("tool.decided"),
    payload: z
      .object({
        decision: ToolDecisionSchema,
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("approval.requested"),
    payload: z
      .object({
        approval: AssistantApprovalRequestSchema,
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("approval.resolved"),
    payload: z
      .object({
        approval: AssistantApprovalResolutionSchema,
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("execution.started"),
    payload: z
      .object({
        request: ToolExecutionRequestSchema,
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("tool.resulted"),
    payload: z
      .object({
        result: ToolResultSchema,
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("provider.continued"),
    payload: z
      .object({
        adapterId: ReferenceIdSchema,
        toolResultExecutionIds: z.array(ToolExecutionIdSchema).max(ASSISTANT_LOOP_MAX_TOOL_ITERATIONS),
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("turn.completed"),
    payload: z
      .object({
        finalAnswer: AssistantFinalAnswerSchema,
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("turn.cancelled"),
    payload: z
      .object({
        cancellation: CancellationReasonSchema,
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("turn.failed"),
    payload: z
      .object({
        failure: AssistantFailureSchema,
      })
      .strict(),
  }),
  AssistantEventMetaSchema.extend({
    type: z.literal("turn.interrupted"),
    payload: z
      .object({
        failure: AssistantFailureSchema,
      })
      .strict(),
  }),
]);
export type AssistantEvent = z.infer<typeof AssistantEventSchema>;

const ProposalProjectionSchema = z
  .object({
    proposalId: ToolProposalIdSchema,
    toolId: ToolIdSchema,
    risk: ToolRiskSchema,
    decisionStatus: z.enum(["pending", "allowed", "requires_approval", "denied"]),
    approvalStatus: z
      .enum(["not_required", "pending", "approved", "denied", "timed_out"])
      .default("not_required"),
    approvalRequestId: ReferenceIdSchema.optional(),
    executionId: ToolExecutionIdSchema.optional(),
    resultStatus: z
      .enum(["pending", "completed", "failed", "blocked", "timed_out", "cancelled"])
      .optional(),
  })
  .strict();

const ExecutionProjectionSchema = z
  .object({
    executionId: ToolExecutionIdSchema,
    proposalId: ToolProposalIdSchema,
    toolId: ToolIdSchema,
    status: z.enum(["running", "completed", "failed", "blocked", "timed_out", "cancelled"]),
    resulted: z.boolean(),
  })
  .strict();

export const AssistantTurnProjectionSchema = z
  .object({
    contractVersion: z.literal(ASSISTANT_LOOP_CONTRACT_VERSION),
    turnId: AssistantTurnIdSchema,
    conversationId: ReferenceIdSchema.optional(),
    status: AssistantTurnStatusSchema,
    lastSequence: z.number().int().min(-1).max(10_000),
    acceptedInput: AssistantInputSchema.optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    activeProviderAdapterId: ReferenceIdSchema.optional(),
    streamText: z.string().max(ASSISTANT_LOOP_STREAM_BUFFER_MAX_CHARS).default(""),
    toolIterationCount: z.number().int().min(0).max(ASSISTANT_LOOP_MAX_TOOL_ITERATIONS),
    proposals: z.array(ProposalProjectionSchema).max(ASSISTANT_LOOP_MAX_TOOL_ITERATIONS),
    executions: z.array(ExecutionProjectionSchema).max(ASSISTANT_LOOP_MAX_TOOL_ITERATIONS),
    finalAnswer: AssistantFinalAnswerSchema.optional(),
    failure: AssistantFailureSchema.optional(),
    cancellationReason: CancellationReasonSchema.optional(),
  })
  .strict();
export type AssistantTurnProjection = z.infer<typeof AssistantTurnProjectionSchema>;

export const AssistantLoopExistingSchemaReuseMap = {
  AppCommandSchema: "supersede later",
  CommandEnvelopeSchema: "reuse",
  CoreInboundMessageSchema: "reuse",
  EventEnvelopeSchema: "reuse",
  AgentEventSchema: "extend",
  TaskEventSchema: "reuse by reference",
  TaskSchema: "reuse by reference",
  ConversationSchema: "reuse by reference",
  MessageSchema: "reuse by reference",
  ToolIdSchema: "reuse",
  ToolRiskSchema: "reuse",
} as const;

export const AssistantLoopFoundationCompatibilitySchema = z
  .object({
    productionIntegrationFoundationOnly: z.literal(true),
    existingRuntimeBehaviorChanged: z.literal(false),
    parallelTaskRuntimeIntroduced: z.literal(false),
    parallelApprovalRuntimeIntroduced: z.literal(false),
    providerRawPayloadInPublicContracts: z.literal(false),
    conversationSchemaReusedByReference: z.literal(true).default(true),
    messageSchemaReusedByReference: z.literal(true).default(true),
    taskSchemaReusedByReference: z.literal(true).default(true),
  })
  .strict();
export type AssistantLoopFoundationCompatibility = z.infer<
  typeof AssistantLoopFoundationCompatibilitySchema
>;
