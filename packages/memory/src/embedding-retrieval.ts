import { z } from "zod";

const EmbeddingMemoryIdSchema = z.string().min(1).max(128);
const EmbeddingModelIdSchema = z.string().min(1).max(300);
const EmbeddingVectorValuesSchema = z
  .array(z.number().finite())
  .min(1)
  .max(8192);

export const EmbeddingMemorySourceTypeSchema = z.enum([
  "message",
  "summary"
]);

export type EmbeddingMemorySourceType = z.infer<
  typeof EmbeddingMemorySourceTypeSchema
>;

export const EmbeddingMemoryRecordSchema = z
  .object({
    id: EmbeddingMemoryIdSchema,
    conversationId: EmbeddingMemoryIdSchema,
    sourceType: EmbeddingMemorySourceTypeSchema,
    sourceId: EmbeddingMemoryIdSchema,
    modelId: EmbeddingModelIdSchema,
    dimensions: z.number().int().positive().max(8192),
    vector: EmbeddingVectorValuesSchema,
    createdAt: z.string().datetime()
  })
  .strict()
  .superRefine((record, ctx) => {
    if (record.vector.length !== record.dimensions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vector"],
        message: "Embedding memory vector length must match dimensions."
      });
    }
  });

export type EmbeddingMemoryRecord = z.infer<
  typeof EmbeddingMemoryRecordSchema
>;

export const EmbeddingMemoryQuerySchema = z
  .object({
    modelId: EmbeddingModelIdSchema,
    vector: EmbeddingVectorValuesSchema,
    limit: z.number().int().min(1).max(50),
    minScore: z.number().finite().min(-1).max(1).optional(),
    conversationId: EmbeddingMemoryIdSchema.optional()
  })
  .strict();

export type EmbeddingMemoryQuery = z.infer<
  typeof EmbeddingMemoryQuerySchema
>;

export const EmbeddingMemoryMatchSchema = z
  .object({
    id: EmbeddingMemoryIdSchema,
    conversationId: EmbeddingMemoryIdSchema,
    sourceType: EmbeddingMemorySourceTypeSchema,
    sourceId: EmbeddingMemoryIdSchema,
    modelId: EmbeddingModelIdSchema,
    score: z.number().finite().min(-1).max(1),
    createdAt: z.string().datetime()
  })
  .strict();

export type EmbeddingMemoryMatch = z.infer<
  typeof EmbeddingMemoryMatchSchema
>;

export const EmbeddingMemoryRetrievalResultSchema = z
  .object({
    status: z.enum(["ok", "degraded"]),
    modelId: EmbeddingModelIdSchema,
    queryDimensions: z.number().int().positive().max(8192),
    matches: z.array(EmbeddingMemoryMatchSchema).max(50),
    reasonCode: z.string().min(1).max(128).optional(),
    generatedAt: z.string().datetime()
  })
  .strict()
  .superRefine((result, ctx) => {
    for (const [index, match] of result.matches.entries()) {
      if (match.modelId !== result.modelId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["matches", index, "modelId"],
          message: "Embedding memory match model must match the query model."
        });
      }
    }
    if (result.status === "degraded" && result.matches.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["matches"],
        message: "Degraded embedding memory retrieval cannot return matches."
      });
    }
  });

export type EmbeddingMemoryRetrievalResult = z.infer<
  typeof EmbeddingMemoryRetrievalResultSchema
>;

export interface EmbeddingMemoryRetrievalPort {
  retrieve(
    query: EmbeddingMemoryQuery
  ): Promise<EmbeddingMemoryRetrievalResult>;
}
