import { describe, expect, it } from "vitest";
import { FilesystemSearchArgumentsSchema as args, FilesystemSearchResultSchema as result,
  FilesystemScopeRequestSchema, FILESYSTEM_SEARCH_TOOL } from "../src/filesystem-search";
import { AssistantToolContextSchema } from "../src/assistant-loop-protocol";
describe("filesystem search reserved contracts", () => {
  it("bounds literal Chinese/Unicode queries without registering a third tool", () => {
    expect(args.parse({ query: " 合同说明 " })).toEqual({ query: "合同说明", maxResults: 20 });
    expect(FILESYSTEM_SEARCH_TOOL).toEqual({ provider: "filesystem_search", canonical: "filesystem.search" });
    expect(AssistantToolContextSchema.safeParse({ tool: { turnId: "turn-a", proposalId: "tprop-a", toolId: "filesystem.search" } }).success).toBe(false);
  });
  it.each(["", " ", "a".repeat(121), "a\nb", "C:\\private", "../x", "\\\\host", "*.txt", "file?", "^a$", "a+", "[ab]", "/foo/i", "regex foo", "a\u202eb"])("rejects query %j", query => {
    expect(args.safeParse({ query }).success).toBe(false);
  });
  it.each([{ scopeToken: "forged" }, { path: "fake" }, { maxResults: 21 }, { maxResults: 0 }, { maxResults: 1.5 }, { regex: true }])("rejects expanded arguments %j", extra => {
    expect(args.safeParse({ query: "合同", ...extra }).success).toBe(false);
  });
  it("rejects unsafe/oversized results without truncating paths", () => {
    const match = { name: "合同.txt", relativePath: "项目/合同.txt", entryType: "file" };
    expect(result.safeParse({ status: "completed", matches: [match], truncated: false }).success).toBe(true);
    for (const relativePath of ["C:/合同.txt", "/合同.txt", "../合同.txt", "项目/other.txt"]) {
      expect(result.safeParse({ status: "completed", matches: [{ ...match, relativePath }], truncated: false }).success).toBe(false);
    }
    expect(result.safeParse({ status: "completed", matches: Array(21).fill(match), truncated: false }).success).toBe(false);
    expect(result.safeParse({ status: "blocked", reason: "internal_unavailable", stack: "private" }).success).toBe(false);
    expect(FilesystemScopeRequestSchema.safeParse({ scopeToken: "forged" }).success).toBe(false);
  });
});
