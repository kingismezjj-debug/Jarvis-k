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
const originalFork = childProcess.fork;
childProcess.fork = (entry, args, options) => originalFork(entry, args, {
  ...options, execArgv: ["--require", __filename],
});
globalThis.fetch = async (url, options) => {
  assert.equal(String(url), "https://api.deepseek.com/chat/completions");
  assert.equal(options.headers.Authorization, "Bearer not-a-credential-local-smoke-key");
  const body = JSON.parse(options.body);
  assert.equal(body.thinking.type, "disabled");
  assert.equal(body.tools, undefined);
  record({ type: body.stream ? "stream" : "connection_test", realNetworkRequestSent: false });
  if (!body.stream) {
    assert.equal(body.max_tokens, 128);
    return new Response(JSON.stringify({ choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: '{"status":"answered","answer":"ok"}' } }] }), { status: 200 });
  }
  assert.equal(body.max_tokens, 2048);
  const question = body.messages[1].content;
  const fragments = question.includes("十点") ? Array(40).fill("历史介绍。")
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
        const chunk = index < 0
          ? { choices: [{ delta: { reasoning_content: "hidden fixture reasoning" }, finish_reason: null }] }
          : index < fragments.length
            ? { choices: [{ delta: { content: fragments[index] }, finish_reason: null }] }
            : { choices: [{ delta: {}, finish_reason: "stop" }] };
        const bytes = new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`);
        const split = bytes.findIndex(byte => byte > 127) + 1;
        controller.enqueue(bytes.slice(0, split || 7));
        controller.enqueue(bytes.slice(split || 7));
        if (index++ >= fragments.length) {
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
