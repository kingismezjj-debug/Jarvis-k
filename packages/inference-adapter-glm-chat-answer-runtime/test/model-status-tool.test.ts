import { describe, expect, it } from "vitest";
import { AssistantToolContextSchema, AssistantToolContinuationSchema, type AssistantModelAdapterEvent } from "@jarvis-k/contracts";
import { DeepseekChatAnswerRuntimeProvider, providerToolId, internalToolName,
  type OpenAiCompatibleChatAnswerRuntimeTransportRequest } from "../src";

const context = AssistantToolContextSchema.parse({ tool: { turnId: "turn-test", proposalId: "tprop-test" } });
const request = { providerId: "chat-answer.openai-compatible.deepseek", utterance: "Check current model status.",
  source: "text", routedAt: "2026-09-06T00:00:00.000Z", routerDecision: { intent: "chat.answer", confidence: 1,
    slots: {}, requiresApproval: false, reason: "test" } } as const;
const chunk = (delta: object, finish_reason: string | null = null) => ({ choices: [{ index: 0, delta, finish_reason }] });
const call = (name = "model_status", args = "{}", id = "call_one", index = 0) => ({ index, id, type: "function", function: { name, arguments: args } });
const valid = () => [chunk({ tool_calls: [call()] }), chunk({}, "tool_calls")];
async function collect(events: AsyncIterable<AssistantModelAdapterEvent>) {
  const result: AssistantModelAdapterEvent[] = [];
  for await (const event of events) result.push(event);
  return result;
}
function harness(chunks: unknown[], continuation = [chunk({ content: "Status received." }), chunk({}, "stop")]) {
  const calls: OpenAiCompatibleChatAnswerRuntimeTransportRequest[] = [];
  const provider = new DeepseekChatAnswerRuntimeProvider({ credential: { apiKey: "fixture-status-key" },
    transport: { send: async () => { throw new Error("No real transport"); }, stream: async function* (input) {
      calls.push(input);
      for (const item of calls.length === 1 ? chunks : continuation) yield item;
    } } });
  const controller = new AbortController();
  return { provider, calls, controller, start: () => collect(provider.startTextTurn(request, context, controller.signal)) };
}

describe("single model status provider tool protocol", () => {
  it("uses fixed bidirectional names and a strict empty argument definition", async () => {
    const h = harness(valid());
    const events = await h.start();
    expect(providerToolId("model_status")).toBe("model.status");
    expect(providerToolId("model.status")).toBeUndefined();
    expect(internalToolName("model.status")).toBe("model_status");
    expect(internalToolName("filesystem.search")).toBeUndefined();
    expect(h.calls[0]?.body).toMatchObject({ tools: [{ type: "function", function: { name: "model_status",
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false } } }], parallel_tool_calls: false });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "tool_proposal", proposal: { ...context.tool, toolId: "model.status", risk: "read_only", arguments: {} } });
    expect(JSON.stringify(events)).not.toMatch(/call_one|tool_calls|fixture-status-key|function/);
  });

  it.each([
    ["unknown name", [chunk({ tool_calls: [call("filesystem_search")] }), chunk({}, "tool_calls")]],
    ["internal name", [chunk({ tool_calls: [call("model.status")] }), chunk({}, "tool_calls")]],
    ["extra argument", [chunk({ tool_calls: [call("model_status", '{"risk":"read_only"}')] }), chunk({}, "tool_calls")]],
    ["array arguments", [chunk({ tool_calls: [call("model_status", "[]")] }), chunk({}, "tool_calls")]],
    ["malformed JSON", [chunk({ tool_calls: [call("model_status", "{")] }), chunk({}, "tool_calls")]],
    ["multiple tools", [chunk({ tool_calls: [call(), call("model_status", "{}", "call_two", 1)] })]],
    ["duplicate call id", [chunk({ tool_calls: [call()] }), chunk({ tool_calls: [call()] }), chunk({}, "tool_calls")]],
    ["nonzero index", [chunk({ tool_calls: [call("model_status", "{}", "call_one", 1)] })]],
    ["truncated call", [chunk({ tool_calls: [call()] }), chunk({}, "length")]],
    ["oversized arguments", [chunk({ tool_calls: [call("model_status", " ".repeat(257))] })]],
  ])("rejects %s before normalized proposal", async (_name, chunks) => {
    const events = await harness(chunks as unknown[]).start();
    expect(events.some(event => event.type === "tool_proposal")).toBe(false);
    expect(events.at(-1)?.type).toBe("failure");
  });

  it.each(["completed", "failed"] as const)("re-enters a %s result with official tool role and disables a second iteration", async status => {
    const h = harness(valid());
    const events = await h.start();
    const proposalEvent = events[0];
    if (proposalEvent?.type !== "tool_proposal") throw new Error("Missing proposal");
    const continuation = AssistantToolContinuationSchema.parse({ turnId: context.tool!.turnId, proposal: proposalEvent.proposal,
      result: { turnId: context.tool!.turnId, taskId: "task-test", proposalId: context.tool!.proposalId,
        executionId: "texec-test", toolId: "model.status", status, resultClass: status === "completed" ? "structured" : "failure",
        ...(status === "completed" ? { structuredResult: { runtimeMode: "lite", operationCount: 3, activeOperationCount: 1 } }
          : { failure: { reasonCode: "MODEL_STATUS_UNAVAILABLE", safeMessage: "Unavailable.", retryable: false } }),
        resultedAt: request.routedAt } });
    expect((await collect(h.provider.continueTextTurn(continuation, h.controller.signal))).at(-1)).toMatchObject({ type: "final", text: "Status received." });
    expect(h.calls).toHaveLength(2);
    expect(h.calls[1]?.body).toMatchObject({ tool_choice: "none", parallel_tool_calls: false,
      messages: [expect.anything(), expect.anything(), { role: "assistant", content: null,
        tool_calls: [{ id: "call_one", type: "function", function: { name: "model_status", arguments: "{}" } }] },
        { role: "tool", tool_call_id: "call_one", content: expect.stringContaining(status) }] });
    expect((await collect(h.provider.continueTextTurn(continuation, h.controller.signal)))[0]?.type).toBe("failure");
    expect(h.calls).toHaveLength(2);
  });

  it("supports split call fragments and suppresses reasoning", async () => {
    const h = harness([chunk({ reasoning_content: "hidden reasoning" }),
      chunk({ tool_calls: [{ index: 0, id: "call_one", type: "function", function: { name: "model_", arguments: "{" } }] }),
      chunk({ tool_calls: [{ index: 0, function: { name: "status", arguments: "}" } }] }), chunk({}, "tool_calls")]);
    expect((await h.start())[0]?.type).toBe("tool_proposal");
  });
});
