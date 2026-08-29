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
  ModelInventoryItem,
  ModelManifest,
  ResourceSchedulerDiagnostics,
} from "@jarvis-k/contracts";

import { SettingsV2GeneralView } from "../src/features/settings-v2/settings-v2-general-view";

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
  startupArgument: "--jarvis-startup=login",
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
      sending={false}
      {...props}
    />,
  );
}

describe("Settings V2 General view", () => {
  it("renders the real General settings values in English", () => {
    const html = renderView();
    expect(html).toContain("Jarvis Control Center");
    expect(html).toContain("Display language");
    expect(html).toContain("English");
    expect(html).toContain("When closing the main window");
    expect(html).toContain("Minimize to system tray");
    expect(html).toContain("Launch after Windows sign-in");
    expect(html).toContain("Not supported");
    expect(html).toContain("Reset is not available yet");
  });

  it("renders productized zh-CN General copy", () => {
    const html = renderView({ locale: "zh" });
    expect(html).toContain("Jarvis 控制中心");
    expect(html).toContain("界面语言");
    expect(html).toContain("中文（简体）");
    expect(html).toContain("关闭主窗口时");
    expect(html).toContain("最小化到系统托盘");
    expect(html).toContain("登录后自动启动");
    expect(html).toContain("重置暂不可用");
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
    expect(html).toContain("Speech recognition provider");
    expect(html).toContain("Volcengine / Credentials saved locally");
    expect(html).toContain("Connection is not checked on this page");
    expect(html).toContain("Recognition language");
    expect(html).toContain("Chinese");
    expect(html).toContain("Push to talk");
    expect(html).toContain("Allowed");
    expect(html).toContain("Doubao / Credentials saved locally");
    expect(html).toContain("A voice is selected");
    expect(html).toContain("Not supported in this version");
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
    expect(html).toContain("Unavailable until Jarvis Core is ready");
    expect(html).toContain("Not requested");
    expect(html).toContain("This page only reads local status");
    expect(html).not.toContain("Connected");
    expect(html).not.toContain("Ready to use");
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
    expect(html).toContain("Speech recognition provider");
    expect(html).toContain("Xunfei / Credentials saved locally");
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
    expect(html).not.toContain("Available");
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

  it("keeps Reset & Recovery non-executable", () => {
    const html = renderView();
    expect(html).toContain("Restore default settings");
    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("Review reset boundary");
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
