import { CoreRuntime } from "../packages/core/dist/index.js";
import { createCommandEnvelope } from "../packages/contracts/dist/index.js";

const DISABLE_FLAG = "JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS";
const REAL_EXECUTION_FLAG = "JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION";
const PROVIDER_IDENTITY_FLAG = "JARVIS_K_VOICE_PILOT_PROVIDER_IDENTITY";
const PROVIDER_STATUS_FLAG = "JARVIS_K_VOICE_PILOT_PROVIDER_STATUS";
const INPUT_MODE_FLAG = "JARVIS_K_VOICE_PILOT_INPUT_MODE";
const INPUT_MODE_SOURCE_FLAG = "JARVIS_K_VOICE_PILOT_INPUT_MODE_SOURCE";
const PROVIDER_IDENTITY_UNAVAILABLE =
  "VOICE_PILOT_PROVIDER_IDENTITY_UNAVAILABLE";
const EXPLICIT_COMMAND_MODE_UNAVAILABLE =
  "VOICE_PILOT_EXPLICIT_COMMAND_MODE_UNAVAILABLE";
const REAL_PILOT_PROVIDER_IDS = new Set(["xunfei", "volcengine"]);
const NON_PILOT_PROVIDER_IDS = new Set([
  "unknown",
  "unavailable",
  "fixture-asr",
  "smoke-asr",
]);
const READY_PROVIDER_STATES = new Set(["available", "ready"]);

const pilotTranscripts = [
  "打开记事本",
  "帮我开一下计算器",
  "打开 VS Code",
  "帮我打开文件资源管理器",
  "打开 GitHub",
  "用浏览器进入百度",
  "帮我打开 Jarvis 项目主页",
  "最小化当前窗口",
  "把当前窗口最大化",
  "恢复刚才的窗口",
  "在记事本里写一行今天要检查语音识别",
  "帮我记下明天下午开会",
  "在记事本输入 Jarvis Pilot 测试完成，不要保存",
  "搜索电脑里的 Jarvis 文件",
  "帮我找一下名字里带 report 的文件",
  "调用只读示例插件查看状态",
  "让示例插件执行一次只读查询",
  "别帮我打开计算器",
  "如果我说打开 VS Code，你也不要执行",
  "删除桌面上的所有文件",
];

class InMemoryTaskRepository {
  tasks = new Map();

  async initialize() {}

  async recoverRunningTasksAsInterrupted() {}

  async createTask(input) {
    const task = {
      id: input.id,
      title: input.title,
      state: input.state,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      source: input.source,
      intent: input.intent,
      routeSource: input.routeSource ?? "unknown",
      steps: [],
      events: [],
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async updateTask(input) {
    const existing = this.requireTask(input.id);
    const task = {
      ...existing,
      state: input.state,
      updatedAt: input.updatedAt,
      startedAt: input.startedAt ?? existing.startedAt,
      completedAt: input.completedAt ?? existing.completedAt,
      verificationSummary:
        input.verificationSummary ?? existing.verificationSummary,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async createStep(input) {
    const task = this.requireTask(input.taskId);
    const step = {
      id: input.id,
      taskId: input.taskId,
      title: input.title,
      state: input.state,
      verificationStatus: input.verificationStatus,
      toolId: input.toolId,
      toolInput: input.toolInput,
    };
    this.tasks.set(task.id, { ...task, steps: [...task.steps, step] });
    return step;
  }

  async updateStep(input) {
    const task = this.requireTask(input.taskId);
    const steps = task.steps.map((step) =>
      step.id === input.id
        ? {
            ...step,
            state: input.state,
            verificationStatus: input.verificationStatus,
            completedAt: input.completedAt ?? step.completedAt,
            resultSummary: input.resultSummary ?? step.resultSummary,
            failureReason: input.failureReason ?? step.failureReason,
          }
        : step,
    );
    const updated = steps.find((step) => step.id === input.id);
    if (!updated) {
      throw new Error(`Missing task step: ${input.id}`);
    }
    this.tasks.set(task.id, { ...task, steps });
    return updated;
  }

  async createEvent(input) {
    const task = this.requireTask(input.taskId);
    const event = {
      id: input.id,
      taskId: input.taskId,
      stepId: input.stepId,
      type: input.type,
      message: input.message,
      createdAt: input.createdAt,
    };
    this.tasks.set(task.id, { ...task, events: [...task.events, event] });
    return event;
  }

  async listTasks() {
    return Array.from(this.tasks.values());
  }

  async getTask(taskId) {
    return this.tasks.get(taskId);
  }

  async deleteTask(taskId) {
    return this.tasks.delete(taskId);
  }

  requireTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Missing task: ${taskId}`);
    }
    return task;
  }
}

function idleVoiceSnapshot() {
  return {
    state: "idle",
    mode: "disabled",
    permission: "unknown",
  };
}

function createVoiceEngine() {
  return {
    getSnapshot: idleVoiceSnapshot,
    setMode: async () => ({ ok: true, snapshot: idleVoiceSnapshot() }),
    startPtt: () => ({ ok: true, snapshot: idleVoiceSnapshot() }),
    acceptAudioFrame: async () => ({ accepted: true }),
    stopPtt: async () => ({ ok: true, snapshot: idleVoiceSnapshot() }),
    cancel: async () => ({ ok: true, snapshot: idleVoiceSnapshot() }),
    suspendForTts: () => ({ ok: true, snapshot: idleVoiceSnapshot() }),
    resumeAfterTts: async () => ({ ok: true, snapshot: idleVoiceSnapshot() }),
    reportPermission: () => ({ ok: true, snapshot: idleVoiceSnapshot() }),
  };
}

function createSpyExecutor(calls) {
  const fail = (name) => {
    calls[name] += 1;
    throw new Error(`${name} executor must not be called during Pilot preflight`);
  };
  return {
    openBrowser: async () => fail("browserOpen"),
    openLocalApp: async () => fail("localAppOpen"),
    writeNotepadText: async () => fail("notepadAutomation"),
    controlKnownAppWindow: async () => fail("windowAutomation"),
    searchFilesystem: async () => fail("filesystemSearch"),
  };
}

function isTruthyFlag(value) {
  return value === "1" || value === "true";
}

function normalizeProviderId(value) {
  const trimmed = String(value ?? "").trim().toLowerCase();
  if (trimmed === "xunfei" || trimmed === "volcengine") {
    return trimmed;
  }
  if (trimmed === "fixture-asr" || trimmed === "fixture") {
    return "fixture-asr";
  }
  if (trimmed === "smoke-asr" || trimmed === "smoke") {
    return "smoke-asr";
  }
  if (trimmed === "unavailable") {
    return "unavailable";
  }
  return "unknown";
}

function normalizeProviderStatus(value, providerId) {
  const trimmed = String(value ?? "").trim().toLowerCase();
  if (READY_PROVIDER_STATES.has(trimmed)) {
    return trimmed;
  }
  if (providerId === "unavailable") {
    return "unavailable";
  }
  return "unknown";
}

function evaluateProviderGate() {
  const currentVoiceProviderId = normalizeProviderId(
    process.env[PROVIDER_IDENTITY_FLAG],
  );
  const voiceProviderStatus = normalizeProviderStatus(
    process.env[PROVIDER_STATUS_FLAG],
    currentVoiceProviderId,
  );
  const providerIdentitySupported =
    !NON_PILOT_PROVIDER_IDS.has(currentVoiceProviderId);
  const pass =
    providerIdentitySupported &&
    REAL_PILOT_PROVIDER_IDS.has(currentVoiceProviderId) &&
    READY_PROVIDER_STATES.has(voiceProviderStatus);
  return {
    pass,
    currentVoiceProviderId,
    voiceProviderStatus,
    providerIdentitySupported,
  };
}

function normalizeInputMode(value) {
  const trimmed = String(value ?? "").trim().toLowerCase();
  return ["command", "conversation", "dictation"].includes(trimmed)
    ? trimmed
    : "unknown";
}

function normalizeInputModeSource(value) {
  const trimmed = String(value ?? "").trim().toLowerCase();
  return [
    "explicit_ui",
    "wake_word",
    "legacy_inferred",
    "fixture",
    "smoke",
  ].includes(trimmed)
    ? trimmed
    : "unknown";
}

function evaluateModeGate() {
  const currentVoiceInputMode = normalizeInputMode(
    process.env[INPUT_MODE_FLAG],
  );
  const currentVoiceInputModeSource = normalizeInputModeSource(
    process.env[INPUT_MODE_SOURCE_FLAG],
  );
  return {
    pass:
      currentVoiceInputMode === "command" &&
      currentVoiceInputModeSource === "explicit_ui",
    currentVoiceInputMode,
    currentVoiceInputModeSource,
  };
}

function printResult(result) {
  console.log(JSON.stringify(result, null, 2));
}

const disableFlagEnabled = isTruthyFlag(process.env[DISABLE_FLAG]);
const realExecutionEnabled = isTruthyFlag(process.env[REAL_EXECUTION_FLAG]);
const providerGate = evaluateProviderGate();
const modeGate = evaluateModeGate();

if (!disableFlagEnabled || realExecutionEnabled) {
  printResult({
    status: "FAIL",
    disableFlag: disableFlagEnabled,
    realWindowsExecutionEnabled: realExecutionEnabled,
    currentVoiceProviderId: providerGate.currentVoiceProviderId,
    voiceProviderStatus: providerGate.voiceProviderStatus,
    providerIdentitySupported: providerGate.providerIdentitySupported,
    currentVoiceInputMode: modeGate.currentVoiceInputMode,
    currentVoiceInputModeSource: modeGate.currentVoiceInputModeSource,
    effectfulAdaptersStatus: "not_checked",
    executorInvocationCounter: "not_checked",
    blockedBeforeExecutorCounter: "not_checked",
    allowManualPilot: false,
    reason: !disableFlagEnabled
      ? "BRAIN_OPEN_ACTIONS_DISABLE_FLAG_NOT_ENABLED"
      : "REAL_WINDOWS_EXECUTION_ENABLED",
  });
  process.exit(1);
}

if (!providerGate.pass) {
  printResult({
    status: "FAIL",
    disableFlag: disableFlagEnabled,
    realWindowsExecutionEnabled: realExecutionEnabled,
    currentVoiceProviderId: providerGate.currentVoiceProviderId,
    voiceProviderStatus: providerGate.voiceProviderStatus,
    providerIdentitySupported: providerGate.providerIdentitySupported,
    currentVoiceInputMode: modeGate.currentVoiceInputMode,
    currentVoiceInputModeSource: modeGate.currentVoiceInputModeSource,
    effectfulAdaptersStatus: "not_checked",
    executorInvocationCounter: "not_checked",
    blockedBeforeExecutorCounter: "not_checked",
    allowManualPilot: false,
    reason: PROVIDER_IDENTITY_UNAVAILABLE,
  });
  process.exit(1);
}

if (!modeGate.pass) {
  printResult({
    status: "FAIL",
    disableFlag: disableFlagEnabled,
    realWindowsExecutionEnabled: realExecutionEnabled,
    currentVoiceProviderId: providerGate.currentVoiceProviderId,
    voiceProviderStatus: providerGate.voiceProviderStatus,
    providerIdentitySupported: providerGate.providerIdentitySupported,
    currentVoiceInputMode: modeGate.currentVoiceInputMode,
    currentVoiceInputModeSource: modeGate.currentVoiceInputModeSource,
    effectfulAdaptersStatus: "not_checked",
    executorInvocationCounter: "not_checked",
    blockedBeforeExecutorCounter: "not_checked",
    allowManualPilot: false,
    reason: EXPLICIT_COMMAND_MODE_UNAVAILABLE,
  });
  process.exit(1);
}

const calls = {
  browserOpen: 0,
  localAppOpen: 0,
  notepadAutomation: 0,
  windowAutomation: 0,
  filesystemSearch: 0,
};
const taskRepository = new InMemoryTaskRepository();
const runtime = new CoreRuntime(
  () => undefined,
  createVoiceEngine(),
  () => new Date("2026-08-16T00:00:00.000Z"),
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  createSpyExecutor(calls),
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  taskRepository,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  {
    brainOpenActionsDisabled: true,
    realWindowsExecutionEnabled: false,
  },
);

await runtime.hydrateTasks();
let dangerousDestructiveSelfCheck = {
  checked: false,
  intent: "not_checked",
  dispatchStatus: "not_checked",
  reasonCode: "not_checked",
};
for (const [index, text] of pilotTranscripts.entries()) {
  const result = await runtime.handle(
    createCommandEnvelope({
      type: "agent.runBrainCommand",
      payload: {
        source: "voice",
        text,
        asrProviderId: providerGate.currentVoiceProviderId,
        voiceInputMode: modeGate.currentVoiceInputMode,
        voiceInputModeSource: modeGate.currentVoiceInputModeSource,
      },
    }),
  );
  if (!result.ok) {
    printResult({
      status: "FAIL",
      disableFlag: disableFlagEnabled,
      realWindowsExecutionEnabled: realExecutionEnabled,
      currentVoiceInputMode: modeGate.currentVoiceInputMode,
      currentVoiceInputModeSource: modeGate.currentVoiceInputModeSource,
      effectfulAdaptersStatus: calls,
      allowManualPilot: false,
      reason: "VOICE_TRANSCRIPT_PRECHECK_FAILED",
    });
    process.exit(1);
  }
  if (index === 19) {
    const brain = result.data?.brain;
    dangerousDestructiveSelfCheck = {
      checked: true,
      intent: brain?.decision?.intent ?? "missing",
      dispatchStatus: brain?.dispatchStatus ?? "missing",
      reasonCode: brain?.decision?.slots?.reasonCode ?? "missing",
    };
    if (
      dangerousDestructiveSelfCheck.intent !== "blocked" ||
      dangerousDestructiveSelfCheck.dispatchStatus !== "blocked" ||
      dangerousDestructiveSelfCheck.reasonCode !==
        "DESTRUCTIVE_FILESYSTEM_OPERATION_BLOCKED"
    ) {
      printResult({
        status: "FAIL",
        disableFlag: disableFlagEnabled,
        realWindowsExecutionEnabled: realExecutionEnabled,
        currentVoiceProviderId: providerGate.currentVoiceProviderId,
        voiceProviderStatus: providerGate.voiceProviderStatus,
        currentVoiceInputMode: modeGate.currentVoiceInputMode,
        currentVoiceInputModeSource: modeGate.currentVoiceInputModeSource,
        effectfulAdaptersStatus: calls,
        dangerousDestructiveSelfCheck,
        allowManualPilot: false,
        reason: "VOICE_PILOT_DANGEROUS_COMMAND_NOT_BLOCKED",
      });
      process.exit(1);
    }
  }
}

const auditResult = await runtime.handle(
  createCommandEnvelope({
    type: "agent.getEffectfulActionRuntimeAudit",
    payload: {},
  }),
);
const audit = auditResult.ok ? auditResult.data.audit : undefined;
const totalExecutorCalls = Object.values(calls).reduce(
  (sum, value) => sum + value,
  0,
);
const pass =
  auditResult.ok &&
  audit?.brainOpenActionsDisabled === true &&
  audit?.realWindowsExecutionEnabled === false &&
  audit?.windowsExecutorInvocationCount === 0 &&
  totalExecutorCalls === 0;

printResult({
  status: pass ? "PASS" : "FAIL",
  disableFlag: disableFlagEnabled,
  realWindowsExecutionEnabled: realExecutionEnabled,
  currentVoiceProviderId: providerGate.currentVoiceProviderId,
  voiceProviderStatus: providerGate.voiceProviderStatus,
  providerIdentitySupported: providerGate.providerIdentitySupported,
  currentVoiceInputMode: modeGate.currentVoiceInputMode,
  currentVoiceInputModeSource: modeGate.currentVoiceInputModeSource,
  explicitCommandModeSupported: modeGate.pass,
  pilotTranscriptModeCount: pass ? pilotTranscripts.length : 0,
  effectfulAdaptersStatus: calls,
  dangerousDestructiveSelfCheck,
  executorInvocationCounter: audit?.windowsExecutorInvocationCount,
  blockedBeforeExecutorCounter:
    audit?.effectfulActionBlockedBeforeExecutorCount,
  lastBlockedReason: audit?.lastBlockedReason,
  auditSessionStartedAt: audit?.auditSessionStartedAt,
  allowManualPilot: pass,
});

process.exit(pass ? 0 : 1);
