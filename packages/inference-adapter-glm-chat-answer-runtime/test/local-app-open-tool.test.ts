import { describe, expect, it } from "vitest";
import { AssistantToolContextSchema, AssistantToolContinuationSchema, type AssistantToolContext, type AssistantModelAdapterEvent } from "@jarvis-k/contracts";
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
function harness(name = "local_app_open", args = '{"app":"notepad"}', toolContext: AssistantToolContext = context, secondTool = false) {
  const calls: OpenAiCompatibleChatAnswerRuntimeTransportRequest[] = [];
  const provider = new DeepseekChatAnswerRuntimeProvider({ credential: { apiKey: "fixture-action-key" }, transport: {
    send: async () => { throw new Error("Fake streaming only"); }, stream: async function* (input) {
      calls.push(input);
      if (calls.length === 1) {
        yield chunk({ tool_calls: [{ index: 0, id: "private-call", type: "function", function: { name, arguments: args } }] });
        yield chunk({}, "tool_calls");
      } else if (secondTool) {
        yield chunk({ tool_calls: [{ index: 0, id: "second-call", type: "function", function: { name: "model_status", arguments: "{}" } }] });
        yield chunk({}, "tool_calls");
      } else { yield chunk({ content: "Launch result received." }); yield chunk({}, "stop"); }
    } } });
  const signal = new AbortController().signal;
  return { provider, calls, signal, start: () => collect(provider.startTextTurn(toolContext.tool?.toolIds
    ? { ...request, utterance: "我想临时记录一点内容，请帮我准备一个合适的系统应用。",
      routerDecision: { intent: "chat.answer", confidence: 1, slots: {}, requiresApproval: false, reason: "ordinary chat" } }
    : request, toolContext, signal)) };
}
describe("single bounded desktop action adapter", () => {
  const conversationalContext = { tool: { turnId: context.tool.turnId, proposalId: context.tool.proposalId,
    toolIds: ["model.status", "localApp.open"] as ("model.status" | "localApp.open")[] } };
  it.each([["model_status", "{}", "model.status"], ["local_app_open", '{"app":"notepad"}', "localApp.open"]])(
    "lets a raw provider call select %s from ordinary chat", async (name, args, internal) => {
      const h = harness(name, args, conversationalContext);
      const events = await h.start();
      expect(h.calls[0]?.body).toMatchObject({ tool_choice: "auto", parallel_tool_calls: false,
        tools: [{ function: { name: "model_status", parameters: { type: "object", properties: {}, required: [], additionalProperties: false } } },
          { function: { name: "local_app_open", parameters: { type: "object", properties: { app: { type: "string", enum: ["notepad"] } }, required: ["app"], additionalProperties: false } } }] });
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ type: "tool_proposal", proposal: { toolId: internal, arguments: JSON.parse(args) } });
    });
  it.each([false, true])("returns only bounded denied data and forbids second proposal (%s)", async second => {
    const h = harness("local_app_open", '{"app":"notepad"}', conversationalContext, second);
    const event = (await h.start())[0];
    if (event?.type !== "tool_proposal") throw new Error("No proposal");
    const continuation = AssistantToolContinuationSchema.parse({ turnId: context.tool.turnId, proposal: event.proposal,
      result: { turnId: context.tool.turnId, taskId: "task-open", proposalId: context.tool.proposalId, executionId: "texec-open",
        toolId: "localApp.open", resultedAt: request.routedAt, status: "blocked", resultClass: "failure",
        failure: { reasonCode: "USER_DENIED", safeMessage: "Private diagnostic omitted from provider.", retryable: false } } });
    const events = await collect(h.provider.continueTextTurn(continuation, h.signal));
    expect(events.at(-1)?.type).toBe(second ? "failure" : "final");
    expect(events.some(item => item.type === "tool_proposal")).toBe(false);
    expect(h.calls[1]?.body).toMatchObject({ tool_choice: "none", parallel_tool_calls: false,
      messages: expect.arrayContaining([{ role: "tool", tool_call_id: "private-call",
        content: JSON.stringify({ status: "denied", app: "notepad", launched: false, reason: "USER_DENIED" }) }]) });
    expect(JSON.stringify(h.calls[1]?.body)).not.toContain("Private diagnostic");
    expect((await collect(h.provider.continueTextTurn(continuation, h.signal)))[0]?.type).toBe("failure");
    expect(h.calls).toHaveLength(2);
  });
  it("rejects unbounded or ambiguous trusted tool sets", () => {
    for (const toolIds of [["shell"], [], ["localApp.open", "localApp.open"], ["model.status", "localApp.open", "model.status"]]) {
      expect(AssistantToolContextSchema.safeParse({ tool: { turnId: context.tool.turnId, proposalId: context.tool.proposalId, toolIds } }).success).toBe(false);
    }
    expect(AssistantToolContextSchema.safeParse({ tool: { ...context.tool, toolIds: ["model.status"] } }).success).toBe(false);
  });
  it.each([["localApp.open", '{"app":"notepad"}'], ["shell", "{}"], ["local_app_open", '{"app":"calculator"}'],
    ["local_app_open", '{"app":"notepad","args":[]}'], ["model_status", '{"app":"notepad"}']])(
    "rejects %s with invalid arguments even when both tools are declared", async (name, args) => {
      const events = await harness(name, args, conversationalContext).start();
      expect(events.some(item => item.type === "tool_proposal")).toBe(false);
      expect(events.at(-1)?.type).toBe("failure");
    });
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
