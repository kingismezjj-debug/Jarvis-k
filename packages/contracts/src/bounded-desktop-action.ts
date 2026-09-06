import { z } from "zod";

export const LocalAppOpenArgumentsSchema = z.object({ app: z.literal("notepad") }).strict();
export const LocalAppOpenResultSchema = z.object({
  app: z.literal("notepad"), launched: z.boolean(), verified: z.boolean(),
  reason: z.enum(["verified", "not_verified", "blocked", "cancelled", "timeout", "launch_failed"]),
}).strict().refine(value => !value.verified || (value.launched && value.reason === "verified"));
export type LocalAppOpenResult = z.infer<typeof LocalAppOpenResultSchema>;

// Internal child/parent transport only; these are never renderer commands.
const id = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
export const DesktopActionRequestSchema = z.object({
  kind: z.literal("desktop-action.request"), requestId: id,
  taskId: id, approvalCommandId: id, arguments: LocalAppOpenArgumentsSchema,
}).strict();
export const DesktopActionCancelSchema = z.object({
  kind: z.literal("desktop-action.cancel"), requestId: id,
}).strict();
export const DesktopActionResponseSchema = z.object({
  kind: z.literal("desktop-action.response"), requestId: id, result: LocalAppOpenResultSchema,
}).strict();
export type DesktopActionRequest = z.infer<typeof DesktopActionRequestSchema>;
