import { readFileSync } from "node:fs";
import path from "node:path";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type {
  ChatAnswerProductModeStatus,
  CommandRouterProductModeStatus,
  DesktopLaunchAtLoginStatus,
  DesktopSettings,
  InferenceProviderDescriptor,
  MemoryAlphaStatus,
  ModelInventoryItem,
  ModelManifest,
  PluginManagementStatusResult,
  ProductAboutInfo,
  ResourceSchedulerDiagnostics,
} from "@jarvis-k/contracts";

import {
  SettingsV2GeneralView,
  getSettingsV2SearchResultsForProduct,
} from "../src/features/settings-v2/settings-v2-general-view";

const desktopSettings: DesktopSettings = {
  closeButtonBehavior: "minimize_to_tray",
  closeToTrayNoticeShown: false,
  launchAtLoginEnabled: false,
  uiTheme: "signal",
  uiThemeExplicitlyConfigured: true,
  desktopPetEnabled: false,
  desktopPetAlwaysOnTop: true,
  desktopPetReducedMotion: "system",
  firstRunOnboardingVersion: 1,
  firstRunOnboardingState: "completed",
  firstRunOnboardingStateChangedAt: "2026-08-28T00:00:00.000Z",
  persistedLocally: true,
  syncedToCloud: false,
};

const launchStatus: DesktopLaunchAtLoginStatus = {
  requested: false,
  openAtLogin: false,
  supported: false,
  canModify: false,
  mismatch: false,
  releaseChannel: "development",
  startupArgument: "jarvis-startup=login",
  source: "unsupported-release-channel",
  appId: "com.jarvis-k.desktop.development",
  productName: "Jarvis-K",
  errorCode: "LOGIN_ITEM_UNSUPPORTED_RELEASE_CHANNEL",
};

const commandRouterStatus = {
  enabled: true,
  status: "control_enabled_rules_only",
} as unknown as CommandRouterProductModeStatus;

const answerProviderStatus = {
  enabled: true,
  status: "control_enabled_runtime_locked",
  secureStorageAvailable: true,
  credentialConfigured: true,
} as unknown as ChatAnswerProductModeStatus;

const modelManifest = {
  id: "Qwen/Qwen3-0.6B",
  capability: "intent_router",
  source: "huggingface",
  revision: "main",
  license: "apache-2.0",
  runtime: "onnxruntime",
  sizeBytes: 1024,
  licenseRisk: "green",
} as ModelManifest;

const modelInventory = [
  {
    manifest: modelManifest,
    status: "available",
  },
] as ModelInventoryItem[];

const inferenceProviders = [
  {
    capability: "intent_router",
    provider: "intent-router.qwen3-0.6b",
    status: "unconfigured",
    execution: "local",
    modelIds: ["Qwen/Qwen3-0.6B"],
    reasons: ["MODEL_NOT_SELECTED"],
  },
  {
    capability: "embedding",
    provider: "embedding.local.onnx",
    status: "available",
    execution: "local",
    modelIds: [],
    reasons: [],
  },
] as InferenceProviderDescriptor[];

const resourceDiagnostics = {
  checkedAt: "2026-08-29T00:00:00.000Z",
  totalMemoryBytes: 16,
  availableMemoryBytes: 8,
  leasedMemoryBytes: 0,
  totalVramBytes: 0,
  availableVramBytes: 0,
  leasedVramBytes: 0,
  activeLeaseCount: 0,
  exclusiveGpuLeaseActive: false,
} as ResourceSchedulerDiagnostics;

const memoryAlphaStatus = {
  state: "disabled",
  enabled: false,
  retentionScope: "new_accepted_user_messages",
  maxMessageCount: 5,
  trackedMessageCount: 0,
  rollbackStatus: "not_started",
  rollbackDeletedCount: 0,
  reasonCodes: [],
} as MemoryAlphaStatus;

const pluginManagementStatus = {
  plugins: [
    {
      manifest: {
        id: "cn.jarvis-k.stock-analysis",
        name: "Stock Analysis Sample",
        version: "0.1.0",
        runtime: "node-worker",
        capabilities: ["stock.quote"],
        permissions: [],
      },
      source: "bundled",
      state: "enabled",
      stateSource: "policy_default",
      statePersisted: false,
      stateToggleAvailable: false,
      executionMode: "bundled_read_only_runtime",
      executable: true,
      routeSelectable: true,
      riskAssessment: {
        declaredRiskTier: "low",
        effectiveRiskTier: "low",
        confirmationPolicy: "none",
        capabilityStatuses: [
          {
            capability: "stock.quote",
            manifestRisk: "low",
            riskTier: "low",
            readOnly: true,
            confirmationPolicy: "none",
          },
        ],
        permissionStatuses: [],
        reasonCodes: [],
      },
      reasonCodes: [],
    },
  ],
  listedAt: "2026-08-29T00:00:00.000Z",
  defaultThirdPartyExecutionState: "disabled",
  thirdPartyCodeExecuted: false,
  marketplaceAccessed: false,
  mcpAdapter: {
    status: "disabled",
    mode: "compatibility_status_only",
    defaultExecutionState: "disabled",
    externalServerStartupAllowed: false,
    externalToolExecutionAllowed: false,
    toolCallForwardingAllowed: false,
    permissionLayerRequired: true,
    credentialExposed: false,
    rawToolOutputPersisted: false,
    marketplaceAccessed: false,
    reasonCodes: ["MCP_ADAPTER_STATUS_ONLY"],
  },
} as unknown as PluginManagementStatusResult;

const productAboutInfo: ProductAboutInfo = {
  productName: "Jarvis-K Alpha",
  version: "0.1.0-alpha.4",
  inAppUpdatesSupported: false,
  updateCheckAvailable: false,
  externalLinksAvailable: false,
  diagnosticsExportAvailable: false,
  networkRequestRequired: false,
  source: "desktop-main",
  sensitiveValuesExposed: false,
  rendererWritable: false,
};

function renderView(
  props: Partial<React.ComponentProps<typeof SettingsV2GeneralView>> = {},
): string {
  return renderToStaticMarkup(
    <SettingsV2GeneralView
      desktopLaunchAtLoginStatus={launchStatus}
      desktopSettings={desktopSettings}
      locale="en"
      activeThemeId="signal"
      onRefreshDesktopSettings={vi.fn()}
      onSelectLanguage={vi.fn()}
      onSelectTheme={vi.fn()}
      onSetDesktopCloseButtonBehavior={vi.fn()}
      onSetDesktopLaunchAtLoginEnabled={vi.fn()}
      onSetDesktopPetAlwaysOnTop={vi.fn()}
      onSetDesktopPetEnabled={vi.fn()}
      onSetDesktopPetReducedMotion={vi.fn()}
      onResetDesktopPetPosition={vi.fn()}
      petSkinRegistry={null}
      productAboutInfo={productAboutInfo}
      sending={false}
      {...props}
    />,
  );
}

function countOccurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

function countHeadingOccurrences(text: string, heading: string): number {
  return (text.match(new RegExp(`>${heading}</h2>`, "g")) ?? []).length;
}

function extractMcpSection(html: string): string {
  const marker = 'data-testid="settings-v2-tools-section-mcp"';
  const start = html.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = html.indexOf('data-testid="settings-v2-placeholder"', start);
  return html.slice(start, end === -1 ? undefined : end);
}

describe("Settings V2 General view", () => {
  it("renders the real General settings values in English", () => {
    const html = renderView();
    expect(html).toContain("Jarvis Control Center");
    expect(html).toContain("Manage Jarvis settings for this device.");
    expect(html).toContain("Tools &amp; Plugins");
    expect(html).toContain("Memory &amp; Privacy");
    expect(html).toContain("Display language");
    expect(html).toContain("English");
    expect(html).toContain("When closing the main window");
    expect(html).toContain("Minimize to system tray");
    expect(html).toContain("Launch after Windows sign-in");
    expect(html).toContain("Not supported");
    expect(html).not.toContain("Settings preview");
    expect(html).not.toContain("Available in this preview");
    expect(html).not.toContain("Coming later");
    expect(html).not.toContain("Restore default settings");
  });

  it("renders a low-emphasis session-only classic settings fallback action", () => {
    const html = renderView({ onUseClassicSettings: vi.fn() });
    expect(html).toContain('data-testid="settings-v2-session-rollback"');
    expect(html).toContain("Use classic settings");
    expect(html).toContain(
      "Switch for this session without changing your settings.",
    );
    expect(html).not.toContain("JARVIS_K_ENABLE_SETTINGS_V2");
    expect(html).not.toContain("release channel");
    expect(html).not.toContain("localStorage");
  });

  it("renders productized zh-CN General copy", () => {
    const html = renderView({ locale: "zh" });
    expect(html).toContain("Jarvis 控制中心");
    expect(html).toContain("管理这台设备上的 Jarvis 设置。");
    expect(html).toContain("工具与插件");
    expect(html).toContain("界面语言");
    expect(html).toContain("中文（简体）");
    expect(html).toContain("关闭主窗口时");
    expect(html).toContain("最小化到系统托盘");
    expect(html).toContain("登录后自动启动");
    expect(html).not.toContain("设置预览");
    expect(html).not.toContain("当前预览已开放");
    expect(html).not.toContain("后续提供");
    expect(html).not.toContain("恢复默认设置");
    expect(html).not.toMatch(/[锟闁垾]/);
  });

  it("does not surface Developer or Evaluation tools in the Product V2 slice", () => {
    const html = renderView();
    for (const forbidden of [
      "Developer Mode",
      "Evaluation",
      "Runtime Inspector",
      "Cloud Acceptance",
      "Qwen",
      "fixture",
      "Voice Regression",
      "Pilot",
      "Skin Studio",
      "PROTOTYPE DATA",
      "DANGER ZONE",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("renders Voice & Audio from existing safe voice projections", () => {
    const html = renderView({
      initialCategoryId: "voice_audio",
      ttsServiceStatus: {
        configured: true,
        secureStorageAvailable: true,
        provider: "doubao",
        resourceId: "seed-tts-2.0",
        voiceId: "zh_female_xiaohe_uranus_bigtts",
      },
      voiceCaptureAvailable: true,
      voiceMode: "ptt",
      voicePermission: "granted",
      voiceServiceStatus: {
        configured: true,
        secureStorageAvailable: true,
        provider: "volcengine",
        language: "zh",
        resourceId: "volc.seedasr.sauc.duration",
      },
    });
    expect(html).toContain("Voice &amp; Audio");
    expect(html).toContain("Speech recognition service");
    expect(html).toContain("Volcengine / Credentials saved locally");
    expect(html).toContain("Recognition language");
    expect(html).toContain("Chinese");
    expect(html).toContain("Push to talk");
    expect(html).toContain("Allowed");
    expect(html).toContain("Doubao / Credentials saved locally");
    expect(html).toContain("A voice is selected");
    expect(html).toContain("Not supported yet");
    for (const forbidden of [
      "volc.seedasr.sauc.duration",
      "zh_female_xiaohe_uranus_bigtts",
      "resourceId",
      "voiceId",
      "transcript",
      "Voice Regression",
      "Pilot",
      "fixture",
      "credential value",
      "C:\\\\",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("keeps Voice & Audio honest when providers are not configured", () => {
    const html = renderView({
      initialCategoryId: "voice_audio",
      ttsServiceStatus: { configured: false, secureStorageAvailable: true },
      voiceCaptureAvailable: false,
      voiceMode: "disabled",
      voicePermission: "unknown",
      voiceServiceStatus: { configured: false, secureStorageAvailable: true },
    });
    expect(html).toContain("Not configured");
    expect(html).toContain("Available when voice input is ready");
    expect(html).toContain("Available after service setup");
    expect(html).toContain("Not requested");
    expect(html).toContain("This page only reads local status");
    expect(html).not.toContain("Unknown");
    expect(html).not.toContain("Default voice");
    expect(html).not.toContain("Connected");
    expect(html).not.toContain("Ready to use");
  });

  it("renders productized zh-CN Voice & Audio copy without internal terms", () => {
    const html = renderView({
      initialCategoryId: "voice_audio",
      locale: "zh",
      ttsServiceStatus: { configured: false, secureStorageAvailable: true },
      voiceCaptureAvailable: false,
      voiceMode: "disabled",
      voicePermission: "unknown",
      voiceServiceStatus: { configured: false, secureStorageAvailable: true },
    });
    expect(html).toContain("语音与音频");
    expect(html).toContain("语音识别服务");
    expect(html).toContain("语音服务凭据在安全设置中管理。");
    expect(html).toContain("配置服务后可用");
    expect(html).toContain("前往语音页面，手动开始一次语音输入。");
    expect(html).toContain("语音播报服务");
    expect(html).toContain("当前暂不支持");
    expect(html).toContain("此页面只读取本机状态，不会连接在线服务、启动麦克风或上传数据。");
    expect(html).not.toContain("ASR");
    expect(html).not.toContain("Provider");
    expect(html).not.toContain("Voice");
    expect(html).not.toContain("TTS");
    expect(html).not.toContain("Jarvis Core");
    expect(html).not.toContain("识别语言: 未知");
    expect(html).not.toContain("识别语言：未知");
    expect(html).not.toContain("默认声音");
    expect(html).not.toContain("Developer");
    expect(html).not.toContain("Evaluation");
    expect(html).not.toContain("fixture");
    expect(html).not.toContain("此页面不会检查云端连接");
    expect((html.match(/不会连接在线服务/g) ?? []).length).toBe(1);
  });

  it("renders Tools & Plugins from existing safe product projections", () => {
    const html = renderView({
      initialCategoryId: "tools_plugins",
      pluginManagementStatus,
    });
    expect(html).toContain("Tools &amp; Plugins");
    expect(html).toContain("Guarded by safety checks");
    expect(html).toContain("Managed by safety policy");
    expect(html).toContain("Unknown websites ask first");
    expect(html).toContain("Read-only");
    expect(html).toContain("No plugins are currently available.");
    expect(html).toContain("Installed plugins: 0");
    expect(html).not.toContain("Developer example plugins");
    expect(html).not.toContain("&gt;");
    expect(html).toContain("External tool connections");
    expect(html).toContain("Not available yet");
    const mcpSection = extractMcpSection(html);
    expect(countHeadingOccurrences(mcpSection, "External tool connections")).toBe(
      1,
    );
    expect(
      countOccurrences(
        mcpSection,
        "Opening this page does not connect to external tools.",
      ),
    ).toBe(1);
    for (const forbidden of [
      "cn.jarvis-k.stock-analysis",
      "stock.quote",
      "compatibility_status_only",
      "MCP_ADAPTER_STATUS_ONLY",
      "externalServerStartupAllowed",
      "manifest",
      "digest",
      "stdio",
      "spawn",
      "C:\\\\",
      "fixture",
      "Evaluation",
      "management service",
      "Product settings",
      "Pilot",
      "acceptance",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("renders productized zh-CN Tools & Plugins copy without raw states", () => {
    const html = renderView({
      initialCategoryId: "tools_plugins",
      locale: "zh",
      pluginManagementStatus,
    });
    expect(html).toContain("工具与插件");
    expect(html).toContain("受安全检查保护");
    expect(html).toContain("由安全规则管理");
    expect(html).toContain("未知网站会先询问");
    expect(html).toContain("只读");
    expect(html).toContain("目前没有可供使用的插件。");
    expect(html).toContain("已安装插件: 0");
    expect(html).not.toContain("开发示例插件");
    expect(html).not.toContain("插件管理服务");
    expect(html).toContain("外部工具连接");
    const mcpSection = extractMcpSection(html);
    expect(countHeadingOccurrences(mcpSection, "外部工具连接")).toBe(1);
    expect(countOccurrences(mcpSection, "打开此页面不会建立外部工具连接。")).toBe(
      1,
    );
    for (const forbidden of [
      "fixture",
      "evaluation",
      "capabilityId",
      "controlType",
      "manifest",
      "digest",
      "transport",
      "stdio",
      "spawn",
      "env",
      "Provider",
      "compatibility_status_only",
      "MCP_ADAPTER_STATUS_ONLY",
      "cn.jarvis-k.stock-analysis",
      "stock.quote",
      "C:\\\\",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("renders a true empty Tools & Plugins Product state from an empty safe projection", () => {
    const html = renderView({
      initialCategoryId: "tools_plugins",
      pluginManagementStatus: {
        ...pluginManagementStatus,
        plugins: [],
      } as PluginManagementStatusResult,
    });

    expect(html).toContain("No plugins are currently available.");
    expect(html).toContain("Installed plugins: 0");
    expect(html).not.toContain(
      "Developer example plugins are hidden from Product settings.",
    );
  });

  it("includes Voice & Audio in product search results with current values", () => {
    const html = renderView({
      initialCategoryId: "voice_audio",
      voiceServiceStatus: {
        configured: true,
        secureStorageAvailable: true,
        provider: "xunfei",
        language: "en",
      },
    });
    expect(html).toContain("Speech recognition service");
    expect(html).toContain("Xunfei / Credentials saved locally");
  });

  it("renders Memory & Privacy as a safe Product summary with a Memory Center entry", () => {
    const html = renderView({
      initialCategoryId: "memory_privacy",
      memoryAlphaStatus,
    });

    expect(html).toContain("Memory &amp; Privacy");
    expect(html).toContain(
      "Opening this page does not read full conversation content",
    );
    expect(html).toContain("Personal memory features");
    expect(html).toContain(
      "Jarvis can use saved information to provide a more personalized experience.",
    );
    expect(html).toContain("Not currently enabled");
    expect(html).toContain("Manage saved information");
    expect(html).toContain("Manage");
    expect(html).toContain("Use Memory Center to view or delete saved information.");
    expect(html).toContain("Saved shortcuts");
    expect(html).toContain("Saved voice corrections");
    expect(html).toContain("Saved response preferences");
    expect(html).toContain("Stored on this device");
    expect(html).toContain(
      "Saved information stays on this device unless a connected feature says otherwise.",
    );
    expect(html).toContain("Cloud sync is not currently enabled.");
    expect(html).not.toContain(
      "View and deletion controls stay in Memory Center.",
    );
    expect(html).not.toContain(
      "Shows where saved information is kept without exposing device paths.",
    );
    for (const forbidden of [
      "Memory Alpha",
      "memory-recall",
      "route alias",
      "voice alias",
      "vector store",
      "embedding",
      "provider runtime",
      "RAW_HIDDEN",
      "PROVIDER_NEUTRAL",
      "retention mutation",
      "raw snapshot",
      "fixture",
      "schema",
      "IPC",
      "boundary metrics",
      "SQLite",
      "runtime status",
      "trusted runtime",
      "snapshot",
      "projection",
      "source of truth",
      "existing feature binding",
      "C:\\\\",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("renders productized zh-CN Memory & Privacy copy without internal terms", () => {
    const html = renderView({
      initialCategoryId: "memory_privacy",
      locale: "zh",
      memoryAlphaStatus,
    });

    expect(html).toContain("记忆与隐私");
    expect(html).toContain("个性化记忆功能");
    expect(html).toContain("当前未启用");
    expect(html).toContain("管理已保存的信息");
    expect(html).toContain("已保存的快捷方式");
    expect(html).toContain("已保存的语音修正");
    expect(html).toContain("已保存的回答偏好");
    expect(html).toContain("已保存的信息存放在本机应用数据中。");
    expect(html).toContain("当前未启用云端同步。");
    expect(html).toContain(
      "打开本页不会读取完整对话内容、调用模型、连接在线服务或启动麦克风。",
    );
    for (const forbidden of [
      "Memory Alpha",
      "memory-recall",
      "route alias",
      "voice alias",
      "vector",
      "embedding",
      "provider",
      "SQLite",
      "schema",
      "IPC",
      "boundary",
      "fixture",
      "记忆阿尔法",
      "召回服务",
      "路由别名",
      "向量库",
      "嵌入服务",
      "原始快照",
      "内部边界",
      "运行时绑定",
      "测试夹具",
      "数据库路径",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("includes Memory & Privacy in product search results with safe current values", () => {
    const html = renderView({
      initialCategoryId: "memory_privacy",
      memoryAlphaStatus: {
        ...memoryAlphaStatus,
        state: "active",
        enabled: true,
      },
    });

    expect(html).toContain("Personal memory features");
    expect(html).toContain("Available");
    expect(html).toContain("Saved information");
    expect(html).not.toContain("Full conversation content");
  });

  it("does not render a current value for Memory navigation search results", () => {
    const results = getSettingsV2SearchResultsForProduct({
      query: "saved information",
      locale: "en",
      desktopSettings,
      desktopLaunchAtLoginStatus: launchStatus,
      activeThemeId: "signal",
      petSkinRegistry: null,
      memoryAlphaStatus,
    });
    const manageResult = results.find(
      ({ definition }) => definition.settingBindingId === "memory.saved_information",
    );
    const personalResult = getSettingsV2SearchResultsForProduct({
      query: "personal memory",
      locale: "en",
      desktopSettings,
      desktopLaunchAtLoginStatus: launchStatus,
      activeThemeId: "signal",
      petSkinRegistry: null,
      memoryAlphaStatus: {
        ...memoryAlphaStatus,
        state: "active",
        enabled: true,
      },
    }).find(
      ({ definition }) => definition.settingBindingId === "memory.personal_memory",
    );

    expect(manageResult?.value).toBeUndefined();
    expect(personalResult?.value).toBe("Available");
  });

  it("renders Notifications as a minimal read-only Product summary", () => {
    const html = renderView({ initialCategoryId: "notifications" });

    expect(html).toContain("Notifications");
    expect(html).toContain("Safe viewing");
    expect(html).toContain(
      "Opening this page does not send a notification, request Windows permission, play a sound, or start voice playback.",
    );
    expect(html).toContain("Current notification features");
    expect(html).toContain("Limited");
    expect(html).toContain("In-app status messages");
    expect(html).toContain("Available while Jarvis is open");
    expect(html).toContain("Tray reminder");
    expect(html).toContain("May appear once");
    expect(html).toContain("Notification privacy");
    expect(html).toContain(
      "Notifications should avoid full conversations, file paths, and other sensitive content.",
    );
    for (const forbidden of [
      "No action on open",
      "Short summaries only",
      "Request permission",
      "Test notification",
      "Open Windows Settings",
      "Do Not Disturb",
      "Focus Assist",
      "Notification API",
      "permission state",
      "dispatch",
      "toast payload",
      "renderer event",
      "task lifecycle",
      "IPC",
      "channel",
      "fixture",
      "event bus",
      "capability probe",
      "AppUserModelID",
      "closeToTrayNoticeShown",
      "Notification.isSupported",
      "source of truth",
      "projection",
      "runtime binding",
      "C:\\\\",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("renders productized zh-CN Notifications copy without internal terms", () => {
    const html = renderView({ initialCategoryId: "notifications", locale: "zh" });

    expect(html).toContain("通知");
    expect(html).toContain("安全查看");
    expect(html).toContain(
      "打开此页面不会发送通知、请求 Windows 权限、播放声音或启动语音播报。",
    );
    expect(html).toContain("当前通知功能");
    expect(html).toContain("功能有限");
    expect(html).toContain("应用内状态提示");
    expect(html).toContain("Jarvis 打开时可用");
    expect(html).toContain("托盘提醒");
    expect(html).toContain("可能显示一次");
    expect(html).toContain("通知隐私");
    expect(html).toContain("通知应避免显示完整对话、文件路径和其他敏感内容。");
    for (const forbidden of [
      "打开页面不会执行操作",
      "仅显示简短摘要",
      "Notification API",
      "permission state",
      "dispatch",
      "toast payload",
      "renderer event",
      "task lifecycle",
      "IPC",
      "channel",
      "fixture",
      "event bus",
      "capability probe",
      "AppUserModelID",
      "closeToTrayNoticeShown",
      "Notification.isSupported",
      "source of truth",
      "projection",
      "runtime binding",
      "通知接口",
      "权限状态字段",
      "分发器",
      "消息载荷",
      "渲染进程事件",
      "事件总线",
      "能力探针",
      "内部状态来源",
      "状态投影",
      "运行时绑定",
      "托盘提醒已显示标记",
      "测试通知",
      "请求权限",
      "勿扰模式",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("includes Notifications in product search results with safe current values", () => {
    const results = getSettingsV2SearchResultsForProduct({
      query: "notification",
      locale: "en",
      desktopSettings,
      desktopLaunchAtLoginStatus: launchStatus,
      activeThemeId: "signal",
      petSkinRegistry: null,
    });
    const titles = results.map(({ definition }) =>
      definition.settingBindingId,
    );

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(
      results.every(
        ({ definition }) => definition.categoryId === "notifications",
      ),
    ).toBe(true);
    expect(titles).toContain("notifications.current_features");
    expect(titles).toContain("notifications.safe_viewing");
    expect(titles).toContain("notifications.privacy");
    expect(
      results.find(
        ({ definition }) =>
          definition.settingBindingId === "notifications.safe_viewing",
      )?.value,
    ).toBeUndefined();
    expect(
      results.find(
        ({ definition }) =>
          definition.settingBindingId === "notifications.current_features",
      )?.value,
    ).toBe("Limited");
    expect(
      results.find(
        ({ definition }) =>
          definition.settingBindingId === "notifications.privacy",
      )?.value,
    ).toBeUndefined();
  });

  it("keeps Chinese notification search scoped to Notifications only", () => {
    const results = getSettingsV2SearchResultsForProduct({
      query: "通知",
      locale: "zh",
      desktopSettings,
      desktopLaunchAtLoginStatus: launchStatus,
      activeThemeId: "signal",
      petSkinRegistry: null,
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(
      results.every(
        ({ definition }) => definition.categoryId === "notifications",
      ),
    ).toBe(true);
    expect(
      results.map(({ definition }) => definition.settingBindingId),
    ).toContain("notifications.current_features");
    expect(
      results.find(
        ({ definition }) =>
          definition.settingBindingId === "notifications.safe_viewing",
      )?.value,
    ).toBeUndefined();
    expect(
      results.find(
        ({ definition }) =>
          definition.settingBindingId === "notifications.current_features",
      )?.value,
    ).toBe("功能有限");
    expect(
      results.find(
        ({ definition }) =>
          definition.settingBindingId === "notifications.privacy",
      )?.value,
    ).toBeUndefined();
  });

  it("renders About & Updates from Desktop Main product information only", () => {
    const html = renderView({ initialCategoryId: "about_updates" });
    expect(html).toContain("About &amp; Updates");
    expect(html).toContain(
      "Review the installed Jarvis-K version and the update options currently available.",
    );
    expect(html).toContain("Jarvis-K Alpha");
    expect(html).toContain("0.1.0-alpha.4");
    expect(html).not.toContain("39.8.5");
    expect(html).toContain("In-app updates");
    expect(html).toContain("Not available in this Alpha");
    expect(html).toContain("Opening this page does not check for updates");
    for (const forbidden of [
      "Release channel",
      "Development",
      "System status",
      "Basic status summary",
      "safe system summary",
      "Detailed diagnostics",
      "Legal information",
      "Legal notices",
      "Terms",
      "License",
      "Notices",
      "Install updates only from a trusted release candidate",
      "Check for updates",
      "autoUpdater",
      "electron-updater",
      "openExternal",
      "AppUserModelID",
      "Git SHA",
      "commit hash",
      "protocol handler",
      "diagnostics export",
      "C:\\",
      "credential",
      "Authorization",
      "Bearer",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("includes About & Updates in product search without exposing action values", () => {
    const results = getSettingsV2SearchResultsForProduct({
      query: "update",
      locale: "en",
      desktopSettings,
      desktopLaunchAtLoginStatus: launchStatus,
      activeThemeId: "signal",
      petSkinRegistry: null,
      productAboutInfo,
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(
      results.every(
        ({ definition }) => definition.categoryId === "about_updates",
      ),
    ).toBe(true);
    expect(
      results.find(
        ({ definition }) => definition.settingBindingId === "about.updates",
      )?.value,
    ).toBe("Not available in this Alpha");
    expect(
      results.find(
        ({ definition }) => definition.settingBindingId === "about.safe_viewing",
      )?.value,
    ).toBeUndefined();
    expect(
      results.some(
        ({ definition }) => definition.settingBindingId === "about.release_channel",
      ),
    ).toBe(false);
  });

  it("keeps About search version bound to the application version instead of Electron", () => {
    const results = getSettingsV2SearchResultsForProduct({
      query: "version",
      locale: "en",
      desktopSettings,
      desktopLaunchAtLoginStatus: launchStatus,
      activeThemeId: "signal",
      petSkinRegistry: null,
      productAboutInfo: {
        ...productAboutInfo,
        version: "0.1.0-alpha.4",
      },
    });

    const versionResult = results.find(
      ({ definition }) => definition.settingBindingId === "about.version",
    );
    expect(versionResult?.value).toBe("0.1.0-alpha.4");
    expect(results.map(({ value }) => value).join(" ")).not.toContain("39.8.5");
  });

  it("keeps localized About search terms scoped to About & Updates", () => {
    for (const { query, expectedBinding } of [
      { query: "版本", expectedBinding: "about.version" },
      { query: "更新", expectedBinding: "about.updates" },
    ] as const) {
      const results = getSettingsV2SearchResultsForProduct({
        query,
        locale: "zh",
        desktopSettings,
        desktopLaunchAtLoginStatus: launchStatus,
        activeThemeId: "harbor",
        petSkinRegistry: null,
        productAboutInfo,
      });
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          ({ definition }) => definition.categoryId === "about_updates",
        ),
      ).toBe(true);
      expect(
        results.some(
          ({ definition }) => definition.settingBindingId === expectedBinding,
        ),
      ).toBe(true);
    }
  });

  it("renders Models & Intelligence from existing safe model projections", () => {
    const html = renderView({
      initialCategoryId: "models_intelligence",
      chatAnswerProductModeStatus: answerProviderStatus,
      commandRouterProductModeStatus: commandRouterStatus,
      inferenceProviders,
      modelInventory,
      modelManifests: [modelManifest],
      resourceDiagnostics,
    });
    expect(html).toContain("Models &amp; Intelligence");
    expect(html).toContain("Fast command understanding");
    expect(html).toContain("Local rules enabled");
    expect(html).toContain("Online answer service");
    expect(html).toContain("Configuration saved locally, not verified");
    expect(html).toContain("Allowed, but the service has not been verified");
    expect(html).toContain("Local models");
    expect(html).toContain("Installed on this device: 1");
    expect(html).toContain("Installable models: 0");
    expect(html).toContain("Ready now: 0");
    expect(html).toContain("Opening this page does not connect online services");
    for (const forbidden of [
      "intent-router.qwen3-0.6b",
      "Qwen/Qwen3-0.6B",
      "embedding.local.onnx",
      "MODEL_NOT_SELECTED",
      "chat-answer.openai-compatible.deepseek",
      "deepseek.v4",
      "providerId",
      "profileId",
      "resourceId",
      "credential value",
      "Cloud Acceptance",
      "fixture",
      "fallback",
      "Active model leases",
      "Not configured / Not configured",
      "C:\\\\",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("does not render repeated raw unconfigured provider descriptors", () => {
    const html = renderView({
      initialCategoryId: "models_intelligence",
      chatAnswerProductModeStatus: {
        enabled: false,
        secureStorageAvailable: true,
        credentialConfigured: false,
      } as unknown as ChatAnswerProductModeStatus,
      commandRouterProductModeStatus: commandRouterStatus,
      inferenceProviders: [
        {
          capability: "intent_router",
          provider: "provider.one",
          status: "unconfigured",
          execution: "cloud",
          modelIds: [],
          reasons: [],
        },
        {
          capability: "chat",
          provider: "provider.two",
          status: "unconfigured",
          execution: "cloud",
          modelIds: [],
          reasons: [],
        },
      ] as InferenceProviderDescriptor[],
    });
    expect(html).toContain("Online answer service");
    expect(html).not.toContain("Not configured / Not configured");
    expect(html).not.toContain("provider.one");
    expect(html).not.toContain("provider.two");
  });

  it("keeps the Chinese Product page free of internal model wording", () => {
    const html = renderView({
      locale: "zh",
      initialCategoryId: "models_intelligence",
      chatAnswerProductModeStatus: {
        enabled: true,
        secureStorageAvailable: true,
        credentialConfigured: false,
      } as unknown as ChatAnswerProductModeStatus,
      commandRouterProductModeStatus: {
        enabled: false,
        status: "disabled",
      } as unknown as CommandRouterProductModeStatus,
      inferenceProviders,
      modelInventory: [],
      modelManifests: [modelManifest],
    });
    expect(html).toContain("在线回答服务");
    expect(html).toContain("已允许，但尚未配置服务");
    expect(html).toContain("本机已安装: 0");
    expect(html).toContain("可安装模型: 1");
    for (const forbidden of [
      "fallback",
      "活动模型租约",
      "Provider: 0",
      "本地 Provider",
      "云端 Provider",
      "本页不验证",
      "缺失",
      "未配置 / 未配置",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("maps local model installed, selected, ready, and installable states", () => {
    const readyManifest = { ...modelManifest, id: "local-ready" } as ModelManifest;
    const installableManifest = {
      ...modelManifest,
      id: "local-installable",
    } as ModelManifest;
    const html = renderView({
      initialCategoryId: "models_intelligence",
      commandRouterProductModeStatus: commandRouterStatus,
      inferenceProviders: [
        {
          capability: "intent_router",
          provider: "local.router",
          status: "available",
          execution: "local",
          modelIds: ["local-ready"],
          reasons: [],
        },
      ] as InferenceProviderDescriptor[],
      modelInventory: [
        {
          manifest: readyManifest,
          status: "loaded",
        },
        {
          manifest: installableManifest,
          status: "not_downloaded",
        },
      ] as ModelInventoryItem[],
      modelManifests: [readyManifest, installableManifest],
    });
    expect(html).toContain("Local model ready");
    expect(html).toContain("Installed on this device: 1");
    expect(html).toContain("Installable models: 1");
    expect(html).toContain("Selected models: 1");
    expect(html).toContain("Ready now: 1");
    expect(html).not.toContain("Missing:");
  });

  it("uses one authoritative current answer method when local rules handle routing and online service is unconfigured", () => {
    const html = renderView({
      initialCategoryId: "models_intelligence",
      chatAnswerProductModeStatus: {
        enabled: true,
        secureStorageAvailable: true,
        credentialConfigured: false,
      } as unknown as ChatAnswerProductModeStatus,
      commandRouterProductModeStatus: {
        enabled: false,
        status: "disabled",
      } as unknown as CommandRouterProductModeStatus,
      modelInventory: [],
      modelManifests: [],
    });
    const answerMethodMatches =
      html.match(/Current answer method: local rules/g) ?? [];
    expect(answerMethodMatches).toHaveLength(1);
    expect(html).toContain(
      "Online answer service: Allowed, service not configured",
    );
    expect(html).not.toContain("Current answer method: not configured");
  });

  it("keeps saved answer credentials separate from provider availability", () => {
    const html = renderView({
      initialCategoryId: "models_intelligence",
      chatAnswerProductModeStatus: {
        enabled: true,
        status: "control_enabled_runtime_locked",
        secureStorageAvailable: true,
        credentialConfigured: true,
      } as unknown as ChatAnswerProductModeStatus,
      commandRouterProductModeStatus: commandRouterStatus,
    });
    expect(html).toContain("Configuration saved locally, not verified");
    expect(html).toContain("Allowed, but the service has not been verified");
    expect(html).not.toContain("Connected");
    expect(html).not.toContain("Ready to use");
    expect(html).not.toContain("Current value: Available");
  });

  it("includes Models & Intelligence in product search results with current values", () => {
    const html = renderView({
      initialCategoryId: "models_intelligence",
      chatAnswerProductModeStatus: {
        enabled: false,
        secureStorageAvailable: true,
        credentialConfigured: false,
      } as unknown as ChatAnswerProductModeStatus,
      commandRouterProductModeStatus: commandRouterStatus,
      modelInventory,
      modelManifests: [modelManifest],
    });
    expect(html).toContain("Local models");
    expect(html).toContain("Local model installed");
  });

  it("renders Appearance & Pet from real safe projections", () => {
    const html = renderView({
      activeThemeId: "harbor",
      initialCategoryId: "appearance_pet",
      desktopSettings: {
        ...desktopSettings,
        uiTheme: "harbor",
        desktopPetEnabled: true,
        desktopPetAlwaysOnTop: false,
        desktopPetReducedMotion: "on",
      },
      petSkinRegistry: {
        activeSkin: {
          identity: {
            skinId: "local.test",
            skinVersion: "1.0.0",
            packageDigest:
              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
          displayName: "Calm Local Skin",
          trustState: "active_skin",
          states: {
            idle: { baseAssetId: "idle" },
            listening: { baseAssetId: "listening" },
            thinking: { baseAssetId: "thinking" },
            success: { baseAssetId: "success" },
            error: { baseAssetId: "error" },
            offline: { baseAssetId: "offline" },
          },
          reducedMotionStates: {
            idle: { baseAssetId: "idle-static" },
            listening: { baseAssetId: "listening-static" },
            thinking: { baseAssetId: "thinking-static" },
            success: { baseAssetId: "success-static" },
            error: { baseAssetId: "error-static" },
            offline: { baseAssetId: "offline-static" },
          },
          resources: {},
          sensitiveContentExposed: false,
        },
        activeSkinIdentity: {
          skinId: "local.test",
          skinVersion: "1.0.0",
          packageDigest:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        },
        builtInFallback: {
          skinId: "builtin.jarvis-k.robot",
          trustState: "built_in_fallback",
          removable: false,
        },
        installedSkins: [],
        registryHealthy: true,
      },
    });
    expect(html).toContain("Appearance &amp; Pet");
    expect(html).toContain("Harbor");
    expect(html).toContain("Show Desktop Pet");
    expect(html).toContain("Visible");
    expect(html).toContain("Reduced motion");
    expect(html).toContain("Calm Local Skin");
    expect(html).toContain("Installed local skin");
    for (const forbidden of [
      "aaaaaaaaaaaaaaaa",
      "local.test",
      "packageDigest",
      "manifest",
      "signature",
      "C:\\\\",
      "credential",
      "Skin Studio",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("inherits the trusted active theme on the Settings V2 token root", () => {
    const html = renderView({
      activeThemeId: "harbor",
      desktopSettings: {
        ...desktopSettings,
        uiTheme: "harbor",
      },
    });
    expect(html).toContain('class="jk-theme settings-v2-shell"');
    expect(html).toContain('data-jarvis-theme="harbor"');
  });

  it("removes the unsupported Reset product definition from the V2 surface and search", () => {
    const html = renderView();
    expect(html).not.toContain("Restore default settings");
    expect(html).not.toContain("Reset &amp; Recovery");
    expect(html).not.toContain('data-testid="settings-v2-reset-action"');

    for (const query of ["reset", "restore defaults"]) {
      const results = getSettingsV2SearchResultsForProduct({
        query,
        locale: "en",
        desktopSettings,
        desktopLaunchAtLoginStatus: launchStatus,
        activeThemeId: "signal",
        petSkinRegistry: null,
      });
      expect(results).toEqual([]);
    }

    const zhResults = getSettingsV2SearchResultsForProduct({
      query: "恢复默认",
      locale: "zh",
      desktopSettings,
      desktopLaunchAtLoginStatus: launchStatus,
      activeThemeId: "signal",
      petSkinRegistry: null,
    });
    expect(zhResults).toEqual([]);
  });

  it("does not expose preview or internal rollout terms in Product copy or search", () => {
    const html = renderView({ onUseClassicSettings: vi.fn() });
    for (const forbidden of [
      "Settings preview",
      "Available in this preview",
      "preview registry",
      "migration preview",
      "Settings V2",
      "capability projection",
      "development default",
      "internal reason code",
      "Gate OFF",
    ]) {
      expect(html).not.toContain(forbidden);
    }

    const previewResults = getSettingsV2SearchResultsForProduct({
      query: "preview",
      locale: "en",
      desktopSettings,
      desktopLaunchAtLoginStatus: launchStatus,
      activeThemeId: "signal",
      petSkinRegistry: null,
    });
    expect(previewResults).toEqual([]);
  });

  it("does not directly access runtime APIs from the Settings V2 renderer files", () => {
    const featureDirectory = path.resolve(
      import.meta.dirname,
      "..",
      "src",
      "features",
      "settings-v2",
    );
    const source = [
      "settings-v2-general-view.tsx",
      "settings-v2-registry.ts",
      "settings-v2-copy.ts",
      "settings-v2-migration-summary.ts",
      "settings-v2-memory-view-model.ts",
      "settings-v2-tools-view-model.ts",
      "settings-v2-notifications-view-model.ts",
      "settings-v2-about-view-model.ts",
    ]
      .map((file) => readFileSync(path.join(featureDirectory, file), "utf8"))
      .join("\n");

    for (const forbidden of [
      "window.jarvis",
      "ipcRenderer",
      "safeStorage",
      "showOpenDialog",
      "getUserMedia",
      "MediaStream",
      "sendVoiceAudio",
      "fetch(",
      "XMLHttpRequest",
      "JARVIS_K_",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
