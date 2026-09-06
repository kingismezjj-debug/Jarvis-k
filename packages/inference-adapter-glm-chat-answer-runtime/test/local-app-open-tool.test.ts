import { describe, expect, it } from "vitest";
import { AssistantToolContinuationSchema, type AssistantModelAdapterEvent } from "@jarvis-k/contracts";
import { DeepseekChatAnswerRuntimeProvider, providerToolId, internalToolName,
  type OpenAiCompatibleChatAnswerRuntimeTransportRequest } from "../src";

const context = { tool: { turnId: "turn-open", proposalId: "tprop-open", toolId: "localApp.open" as const } };
const request = { providerId: "chat-answer.openai-compatible.deepseek", utterance: "Open Notepad.", source: "text",
  routedAt: "2026-09-06T00:00:00.000Z", routerDecision: { intent: "localApp.open", confidence: 1,
    slots: { target: "notepad" }, requiresApproval: true, reason: "test" } } as const;
const chunk = (delta: object, finish_reason: string | null = null) => ({ choices: [{ index: 0, delta, finish_reason }] });
async function collect(events: AsyncIterable<AssistantModelAdapterEvent>) {
  const result: AssistantModelAdapterEvent[] = []; for await (const event of events) result.push(event); return result;
}
function harness(name = "local_app_open", args = '{"app":"notepad"}') {
  const calls: OpenAiCompatibleChatAnswerRuntimeTransportRequest[] = [];
  const provider = new DeepseekChatAnswerRuntimeProvider({ credential: { apiKey: "fixture-action-key" }, transport: {
    send: async () => { throw new Error("Fake streaming only"); }, stream: async function* (input) {
      calls.push(input);
      if (calls.length === 1) {
        yield chunk({ tool_calls: [{ index: 0, id: "private-call", type: "function", function: { name, arguments: args } }] });
        yield chunk({}, "tool_calls");
      } else { yield chunk({ content: "Launch result received." }); yield chunk({}, "stop"); }
    } } });
  const signal = new AbortController().signal;
  return { provider, calls, signal, start: () => collect(provider.startTextTurn(request, context, signal)) };
}
describe("single bounded desktop action adapter", () => {
  it.each([true, false])("uses sole fixed definition and continues verified=%s results", async verified => {
    const h = harness(); const events = await h.start(); const event = events[0];
    expect(providerToolId("local_app_open")).toBe("localApp.open");
    expect(providerToolId("localApp.open")).toBeUndefined();
    expect(internalToolName("localApp.open")).toBe("local_app_open");
    expect(h.calls[0]?.body).toMatchObject({ parallel_tool_calls: false, tools: [{ type: "function", function: {
      name: "local_app_open", parameters: { type: "object", properties: { app: { type: "string", enum: ["notepad"] } },
        required: ["app"], additionalProperties: false } } }] });
    if (event?.type !== "tool_proposal") throw new Error("No proposal");
    expect(event.proposal).toMatchObject({ toolId: "localApp.open", risk: "mutating", arguments: { app: "notepad" } });
    expect(JSON.stringify(events)).not.toMatch(/private-call|fixture-action-key|tool_calls/);
    const continuation = AssistantToolContinuationSchema.parse({ turnId: context.tool.turnId, proposal: event.proposal,
      result: { turnId: context.tool.turnId, taskId: "task-open", proposalId: context.tool.proposalId, executionId: "texec-open",
        toolId: "localApp.open", resultedAt: request.routedAt, ...(verified ? { status: "completed", resultClass: "structured",
          structuredResult: { app: "notepad", launched: true, verified: true, reason: "verified" } } : {
          status: "failed", resultClass: "failure", failure: { reasonCode: "ACTION_NOT_VERIFIED", safeMessage: "Unverified.", retryable: false } }) } });
    expect((await collect(h.provider.continueTextTurn(continuation, h.signal))).at(-1)?.type).toBe("final");
    expect(h.calls[1]?.body).toMatchObject({ tool_choice: "none", messages: expect.arrayContaining([
      { role: "tool", tool_call_id: "private-call", content: expect.stringContaining(verified ? "verified" : "NOTEPAD_LAUNCH_NOT_VERIFIED") } ]) });
  });
  it.each([["localApp.open", '{"app":"notepad"}'], ["model_status", "{}"], ["local_app_open", "{}"],
    ["local_app_open", '{"app":"calculator"}'], ["local_app_open", '{"app":"notepad","args":[]}'],
    ["local_app_open", '{"app":"notepad","path":"fake"}'], ["local_app_open", "[]"], ["local_app_open", "{"]])(
    "rejects tool name %s or arguments %s", async (name, args) => {
      const events = await harness(name, args).start();
      expect(events.some(event => event.type === "tool_proposal")).toBe(false);
      expect(events.at(-1)?.type).toBe("failure");
    });
});
