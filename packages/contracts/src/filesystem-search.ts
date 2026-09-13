import { z } from "zod";

// Reserved mapping only. This does not register a production provider tool.
export const FILESYSTEM_SEARCH_TOOL = { provider: "filesystem_search", canonical: "filesystem.search" } as const;
export const FilesystemSearchArgumentsSchema = z.object({
  query: z.string().min(1).max(120)
    .refine(value => !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value))
    .transform(value => value.normalize("NFC").trim())
    .pipe(z.string().min(1).max(120)
      .refine(value => !/(?:\.\.|[\\/:*?"<>|\[\]{}()^$+]|^(?:regex|glob)\b)/iu.test(value))),
  maxResults: z.number().int().min(1).max(20).default(20),
}).strict();
export type FilesystemSearchArguments = z.infer<typeof FilesystemSearchArgumentsSchema>;
export const FilesystemSearchFailureSchema = z.enum(["scope_required", "scope_expired", "scope_mismatch",
  "user_denied", "cancelled", "timed_out", "root_unavailable", "access_denied", "search_limit_reached",
  "invalid_query", "result_not_verified", "internal_unavailable", "filesystem_search_unavailable"]);
const safeName = z.string().min(1).max(255).refine(value =>
  !/[\\/:\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value) &&
  !/^(?:\.|\.\.)$/u.test(value) && !/(?:Bearer|api[_-]?key|authorization|secret|token)/iu.test(value));
const relativePath = z.string().min(1).max(512).refine(value =>
  value.split("/").every(part => safeName.safeParse(part).success));
export const FilesystemSearchResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("completed"), matches: z.array(z.object({ name: safeName,
    relativePath, entryType: z.enum(["file", "directory"]) }).strict()
    .refine(value => value.relativePath.split("/").at(-1) === value.name)).max(20), truncated: z.boolean() }).strict(),
  z.object({ status: z.literal("blocked"), reason: FilesystemSearchFailureSchema }).strict(),
]).refine(value => new TextEncoder().encode(JSON.stringify(value)).byteLength <= 16 * 1024);

// Internal CoreHost/Main transport. Deliberately contains neither paths nor capability credentials.
const id = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/u);
export const FilesystemScopeContextSchema = z.object({
  turnId: id, proposalId: id, executionId: id, taskId: id, approvalCommandId: id,
}).strict();
export type FilesystemScopeContext = z.infer<typeof FilesystemScopeContextSchema>;
export const FilesystemScopeRequestSchema = z.object({ kind: z.literal("filesystem-scope.request"),
  context: FilesystemScopeContextSchema, arguments: FilesystemSearchArgumentsSchema }).strict();
export type FilesystemScopeRequest = z.infer<typeof FilesystemScopeRequestSchema>;
export const FilesystemScopeResponseSchema = z.object({ kind: z.literal("filesystem-scope.response"),
  context: FilesystemScopeContextSchema, resolution: z.enum(["approved", "denied", "timed_out"]),
  reason: FilesystemSearchFailureSchema }).strict().refine(value =>
    value.resolution !== "approved" || value.reason === "filesystem_search_unavailable");
export type FilesystemScopeResponse = z.infer<typeof FilesystemScopeResponseSchema>;
export const FilesystemScopeCancelSchema = z.object({ kind: z.literal("filesystem-scope.cancel"),
  context: FilesystemScopeContextSchema }).strict();
export function filesystemScopeContext(taskId: string, approvalCommandId: string): FilesystemScopeContext {
  return FilesystemScopeContextSchema.parse({ taskId, approvalCommandId, turnId: `turn-${taskId}`,
    proposalId: `tprop-${taskId}`, executionId: `texec-${approvalCommandId}` });
}
export function filesystemScopeDisclosure(query: string): string {
  return `搜索词：${query}。范围最多四层，仅匹配名称，不读取内容；文件名和相对位置会发送给当前模型。本阶段只记录授权，不搜索或发送结果。`;
}
