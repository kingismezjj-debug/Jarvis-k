import { expect, it, vi } from "vitest";
import { filesystemScopeContext } from "@jarvis-k/contracts";
import { FilesystemScopePort } from "../src/filesystem-scope-port";
it("correlates the entire scope response and drops duplicates without exposing a capability", async () => {
  const send = vi.fn(); const port = new FilesystemScopePort(send);
  const request = { kind: "filesystem-scope.request" as const, context: filesystemScopeContext("task-a", "command-a"), arguments: { query: "合同", maxResults: 20 } };
  const pending = port.select(request);
  const result = { kind: "filesystem-scope.response", context: request.context, resolution: "approved", reason: "filesystem_search_unavailable" };
  port.receive({ ...result, context: { ...request.context, turnId: "turn-wrong" } });
  port.receive({ ...result, scopeToken: "forged" });
  port.receive(result); expect(await pending).toEqual(result);
  expect(send).toHaveBeenCalledTimes(1); expect(JSON.stringify(send.mock.calls)).not.toMatch(/scopeToken|[A-Z]:\\/);
  port.receive(result);
});
