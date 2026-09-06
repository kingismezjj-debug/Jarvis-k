// Test-only process bootstrap. No real fetch fallback exists.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const childProcess = require("node:child_process");
assert.equal(process.env.JARVIS_K_STREAMING_CLOSURE_SMOKE, "1");
const profile = path.resolve(process.env.JARVIS_K_USER_DATA_PATH);
assert.ok(path.basename(profile).startsWith("jarvis-streaming-closure-"));
assert.equal(path.dirname(profile).toLowerCase(), path.resolve(os.tmpdir()).toLowerCase());
const record = event => fs.appendFileSync(path.join(profile, "fake-network.ndjson"), `${JSON.stringify(event)}\n`);
const boundedAction = process.env.JARVIS_K_BOUNDED_DESKTOP_SMOKE === "1";
if (boundedAction) {
  const originalSpawn = childProcess.spawn;
  childProcess.spawn = (command, ...args) => {
    assert.ok(!/(?:notepad|tasklist)(?:\.exe)?$/i.test(String(command)), "Real Windows action forbidden in fake smoke");
    return originalSpawn(command, ...args);
  };
  if (process.type === "browser") {
    require("../../apps/desktop/dist/bounded-notepad-action.js").launchBoundedNotepad = async signal => {
      assert.equal(signal.aborted, false);
      record({ type: "desktop_action", realWindowsAction: false, owner: "desktop_host" });
      await new Promise(resolve => setTimeout(resolve, 180));
      return { app: "notepad", launched: true, verified: true, reason: "verified" };
    };
  }
}
const originalFork = childProcess.fork;
childProcess.fork = (entry, args, options) => originalFork(entry, args, {
  ...options, execArgv: ["--require", __filename],
});
globalThis.fetch = async (url, options) => {
  assert.equal(String(url), "https://api.deepseek.com/chat/completions");
  assert.equal(options.headers.Authorization, "Bearer not-a-credential-local-smoke-key");
  const body = JSON.parse(options.body);
  assert.equal(body.thinking.type, "disabled");
  if (body.stream) {
    assert.equal(body.tools.length, 1);
    if (boundedAction && body.tools[0].function.name === "local_app_open") {
      assert.deepEqual(body.tools[0].function.parameters, { type: "object", properties: { app: { type: "string", enum: ["notepad"] } }, required: ["app"], additionalProperties: false });
    } else {
      assert.equal(body.tools[0].function.name, "model_status");
      assert.deepEqual(body.tools[0].function.parameters, { type: "object", properties: {}, required: [], additionalProperties: false });
    }
    assert.equal(body.parallel_tool_calls, false);
  } else assert.equal(body.tools, undefined);
  record({ type: body.stream ? "stream" : "connection_test", realNetworkRequestSent: false });
  if (!body.stream) {
    assert.equal(body.max_tokens, 128);
    return new Response(JSON.stringify({ choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: '{"status":"answered","answer":"ok"}' } }] }), { status: 200 });
  }
  assert.equal(body.max_tokens, 2048);
  const question = body.messages[1].content;
  const toolResult = body.messages.find(message => message.role === "tool");
  const actionQuestion = boundedAction && question.includes("记事本");
  const statusQuestion = question.includes("模型状态") || actionQuestion;
  if (toolResult) {
    assert.equal(body.tool_choice, "none");
    assert.equal(body.messages.length, 4);
    assert.equal(toolResult.tool_call_id, "call_status_smoke");
    assert.equal(body.messages[2].tool_calls[0].function.name, actionQuestion ? "local_app_open" : "model_status");
    const status = JSON.parse(toolResult.content);
    assert.equal(status.status, "completed");
    assert.deepEqual(Object.keys(status.data).sort(), actionQuestion ? ["app", "launched", "reason", "verified"] : ["activeOperationCount", "operationCount", "runtimeMode"]);
    record({ type: "tool_result_received", realNetworkRequestSent: false });
  }
  const fragments = question.includes("十点") ? Array(40).fill("历史介绍。")
    : actionQuestion ? ["记事本启动已验证。"] : statusQuestion ? ["模型状态已查询。", "当前没有正在进行的模型操作。"]
    : question.includes("只回答") ? ["取消后", "重试正常。"] : ["流式 ", "中文", "回答。"];
  let timer;
  let stopped = false;
  let abort;
  const responseBody = new ReadableStream({
    start(controller) {
      let index = -1;
      abort = () => {
        if (stopped) return;
        stopped = true;
        clearTimeout(timer);
        record({ type: "aborted", realNetworkRequestSent: false });
        controller.error(new DOMException("Cancelled", "AbortError"));
      };
      options.signal.addEventListener("abort", abort, { once: true });
      const send = () => {
        if (stopped) return;
        const chunk = statusQuestion && !toolResult
          ? index < 0 ? { choices: [{ delta: { tool_calls: [{ index: 0, id: "call_status_smoke", type: "function", function: { name: actionQuestion ? "local_app_open" : "model_status", arguments: actionQuestion ? '{"app":"notepad"}' : "{}" } }] }, finish_reason: null }] }
            : { choices: [{ delta: {}, finish_reason: "tool_calls" }] }
          : index < 0
          ? { choices: [{ delta: { reasoning_content: "hidden fixture reasoning" }, finish_reason: null }] }
          : index < fragments.length
            ? { choices: [{ delta: { content: fragments[index] }, finish_reason: null }] }
            : { choices: [{ delta: {}, finish_reason: "stop" }] };
        const bytes = new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`);
        const split = bytes.findIndex(byte => byte > 127) + 1;
        controller.enqueue(bytes.slice(0, split || 7));
        controller.enqueue(bytes.slice(split || 7));
        if (index++ >= (statusQuestion && !toolResult ? 0 : fragments.length)) {
          stopped = true;
          options.signal.removeEventListener("abort", abort);
          controller.close();
        } else timer = setTimeout(send, 180);
      };
      timer = setTimeout(send, 40);
    },
    cancel() {
      stopped = true;
      clearTimeout(timer);
      options.signal.removeEventListener("abort", abort);
    },
  });
  return new Response(responseBody, { status: 200, headers: { "Content-Type": "text/event-stream" } });
};
if (process.type === "browser") require("../../apps/desktop/dist/main.js");
