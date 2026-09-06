import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const profile = await mkdtemp(path.join(os.tmpdir(), "jarvis-streaming-closure-"));
const allowed = /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|APPDATA|LOCALAPPDATA|USERPROFILE|PROGRAMFILES|PROGRAMFILES\(X86\)|PROGRAMW6432|SYSTEMDRIVE|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE|OS)$/i;
const env = {
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => allowed.test(key))),
  JARVIS_K_STREAMING_CLOSURE_SMOKE: "1",
  JARVIS_K_USER_DATA_PATH: profile,
  JARVIS_K_LOCAL_DATA_PATH: profile,
  JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
  JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION: "0",
  JARVIS_K_ENABLE_LOCAL_PLUGIN_MANIFESTS: "0",
};
await writeFile(path.join(profile, "jarvis-k-desktop-settings.json"), JSON.stringify({ firstRunOnboardingVersion: 1, firstRunOnboardingState: "completed", desktopPetEnabled: false, closeButtonBehavior: "quit", launchAtLoginEnabled: false }));
let app;
async function launch() {
  app = await _electron.launch({ cwd: root, args: ["tests/fixtures/streaming-closure-bootstrap.cjs"], env });
  const page = await app.firstWindow();
  await page.getByTestId("jarvis-app").waitFor();
  await waitSnapshot(page, state => state?.health === "ready");
  await page.evaluate(() => {
    window.__closureSnapshots = [];
    window.jarvis.onEvent(envelope => {
      if (envelope.event.type === "state.snapshot") window.__closureSnapshots.push(envelope.event.payload);
    });
  });
  return page;
}
async function quit() {
  await app.evaluate(({ app }) => app.quit());
  await app.close();
  app = undefined;
}
async function snapshot(page) { return page.evaluate(async () => (await window.jarvis.getSnapshot()).data); }
async function waitSnapshot(page, predicate) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const state = await snapshot(page);
    if (predicate(state)) return state;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error("Expected safe snapshot state did not arrive");
}
async function waitStatus(page, status) {
  return waitSnapshot(page, state => state?.assistantTurn?.status === status);
}
async function send(page, text) {
  await page.getByTestId("command-input").fill(text);
  await page.getByTestId("send-command").click();
}
try {
  let page = await launch();
  const baseline = await snapshot(page);
  const setup = await page.evaluate(async () => {
    const providerId = "chat-answer.openai-compatible.deepseek";
    const save = await window.jarvis.saveChatAnswerProviderConfiguration({ providerId, serviceUrl: "https://api.deepseek.com/chat/completions", modelId: "deepseek-v4-flash" });
    const credential = await window.jarvis.replaceChatAnswerProviderCredential({ providerId, apiKey: "not-a-credential-local-smoke-key" });
    const test = await window.jarvis.testChatAnswerProviderConnection({ providerId, userConfirmedNetworkRequest: true, connectionTestAttemptId: "chat_answer_connection_test_closure_smoke" });
    const enable = await window.jarvis.setChatAnswerProviderConfigurationEnabled({ providerId, enabled: true, requireRecentSuccessfulTest: true });
    return { save: save.ok, credential: credential.ok, test: test.ok, enable: enable.ok, armed: enable.status.runtimeArmed };
  });
  assert.deepEqual(setup, { save: true, credential: true, test: true, enable: true, armed: true });
  const beforeAnswer = await snapshot(page);
  assert.equal(beforeAnswer.messages.length, baseline.messages.length);
  assert.equal((await readFile(path.join(profile, "fake-network.ndjson"), "utf8")).trim().split("\n").length, 1);

  await send(page, "请用三点简要说明流式回答和非流式回答的区别。");
  await page.getByTestId("assistant-streaming-turn").getByText("流式", { exact: false }).waitFor();
  const partial = await snapshot(page);
  assert.equal(partial.assistantTurn.status, "streaming");
  await page.evaluate(() => {
    window.__closureHandoff = { missing: false, duplicate: false, empty: false };
    window.__closureObserver = new MutationObserver(() => {
      const list = document.querySelector('[data-testid="message-list"]');
      const text = list?.textContent ?? "";
      if (!text.includes("流式")) window.__closureHandoff.missing = true;
      if (text.split("流式 中文回答。").length > 2) window.__closureHandoff.duplicate = true;
      const transient = document.querySelector('[data-testid="assistant-streaming-turn"] p.whitespace-pre-wrap');
      if (transient && !transient.textContent.trim()) window.__closureHandoff.empty = true;
    });
    window.__closureObserver.observe(document.querySelector('[data-testid="message-list"]'), { subtree: true, childList: true, characterData: true });
  });
  const normal = await waitStatus(page, "completed");
  assert.equal(normal.assistantTurn.status, "completed");
  assert.equal(normal.assistantTurn.finalAnswer.text, "流式 中文回答。");
  assert.equal(normal.messages.filter(message => message.role === "assistant" && message.text === "流式 中文回答。").length, 1);
  await page.getByText("流式 中文回答。", { exact: true }).waitFor();
  const handoff = await page.evaluate(() => { window.__closureObserver.disconnect(); return window.__closureHandoff; });
  assert.deepEqual(handoff, { missing: false, duplicate: false, empty: false });
  assert.equal(await page.getByTestId("command-input").isEnabled(), true);

  await send(page, "请分十点介绍人工智能助手的发展历史。");
  await page.getByTestId("assistant-streaming-turn").getByText("历史介绍。", { exact: false }).waitFor();
  const active = await snapshot(page);
  await page.getByTestId("assistant-stream-cancel").click();
  const cancelled = await waitStatus(page, "cancelled");
  assert.equal(cancelled.assistantTurn.turnId, active.assistantTurn.turnId);
  assert.equal(cancelled.messages.filter(message => message.role === "assistant").length, normal.messages.filter(message => message.role === "assistant").length);
  assert.equal(await page.getByTestId("command-input").isEnabled(), true);
  await send(page, "请只回答：取消后重试正常。");
  const retried = await waitStatus(page, "completed");
  assert.notEqual(retried.assistantTurn.turnId, active.assistantTurn.turnId);
  assert.equal(retried.messages.filter(message => message.role === "assistant" && message.text === "取消后重试正常。").length, 1);
  assert.equal(retried.tasks.length, baseline.tasks.length);
  const projections = await page.evaluate(() => window.__closureSnapshots);
  assert.ok(!JSON.stringify(projections).includes("hidden fixture reasoning"));
  assert.ok(!JSON.stringify(projections).includes("not-a-credential-local-smoke-key"));
  const terminalIndex = projections.findIndex(s => s.assistantTurn?.turnId === active.assistantTurn.turnId && s.assistantTurn.status === "cancelled");
  assert.ok(terminalIndex >= 0);
  assert.ok(projections.slice(terminalIndex).filter(s => s.assistantTurn?.turnId === active.assistantTurn.turnId).every(s => s.assistantTurn.status === "cancelled" && s.assistantTurn.streamText === cancelled.assistantTurn.streamText));
  await send(page, "请查询当前模型状态并解释结果。");
  await waitSnapshot(page, state => state?.assistantTurn?.turnId !== retried.assistantTurn.turnId && state?.assistantTurn?.status === "completed");
  const statusAnswer = await snapshot(page);
  assert.equal(statusAnswer.assistantTurn.finalAnswer.usedToolIterations, 1);
  assert.equal(statusAnswer.assistantTurn.proposals.length, 1);
  assert.equal(statusAnswer.assistantTurn.proposals[0].toolId, "model.status");
  assert.equal(statusAnswer.assistantTurn.proposals[0].decisionStatus, "allowed");
  assert.equal(statusAnswer.assistantTurn.executions.length, 1);
  assert.equal(statusAnswer.assistantTurn.executions[0].status, "completed");
  assert.equal(statusAnswer.tasks.length, baseline.tasks.length + 1);
  assert.equal(statusAnswer.tasks.find(task => task.id === statusAnswer.assistantTurn.proposals[0].taskId)?.state, "completed");
  assert.equal(statusAnswer.messages.filter(message => message.role === "assistant" && message.text.startsWith("模型状态已查询。")).length, 1);
  const statusProjections = await page.evaluate(() => window.__closureSnapshots.map(state => state.assistantTurn).filter(Boolean));
  assert.ok(statusProjections.some(turn => turn.turnId === statusAnswer.assistantTurn.turnId && turn.status === "executing"));
  assert.ok(statusProjections.some(turn => turn.turnId === statusAnswer.assistantTurn.turnId && turn.status === "synthesizing"));
  assert.ok(!JSON.stringify(statusProjections).includes("call_status_smoke"));
  assert.ok(!JSON.stringify(statusProjections).includes("hidden fixture reasoning"));
  assert.ok(!JSON.stringify(statusProjections).includes("not-a-credential-local-smoke-key"));
  await quit();
  page = await launch();
  const restored = await page.evaluate(() => window.jarvis.getChatAnswerProviderConfigurationStatus());
  assert.equal(restored.enabled, true);
  assert.equal(restored.runtimeArmed, true);
  assert.equal(restored.configured, true);
  await quit();
  const calls = (await readFile(path.join(profile, "fake-network.ndjson"), "utf8")).trim().split("\n").map(line => JSON.parse(line));
  assert.equal(calls.filter(call => call.type === "connection_test").length, 1);
  assert.equal(calls.filter(call => call.type === "stream").length, 5);
  assert.equal(calls.filter(call => call.type === "tool_result_received").length, 1);
  assert.equal(calls.filter(call => call.type === "aborted").length, 1);
  console.log(JSON.stringify({ status: "PASS", realNetworkRequestSent: false, officialEntry: true, normalStreaming: true, singleFinal: true, handoff, cancellation: true, abortSignal: true, staleSuppression: true, retry: true, restartPersistence: true, normalQuestionNoTaskDelta: true, singleToolTaskAndContinuation: true, noCredentialOrReasoningProjection: true }));
} finally {
  if (app) await quit();
  assert.equal(path.dirname(path.resolve(profile)).toLowerCase(), path.resolve(os.tmpdir()).toLowerCase());
  assert.ok(path.basename(profile).startsWith("jarvis-streaming-closure-"));
  await rm(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
}
