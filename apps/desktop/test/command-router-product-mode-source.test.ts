import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const desktopSourceDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "src"
);
const mainSource = readFileSync(
  path.join(desktopSourceDirectory, "main.ts"),
  "utf8"
);
const settingsServiceSource = readFileSync(
  path.join(desktopSourceDirectory, "settings", "settings-service.ts"),
  "utf8"
);
const settingsIpcSource = readFileSync(
  path.join(desktopSourceDirectory, "ipc", "register-settings-ipc.ts"),
  "utf8"
);
const preloadSource = readFileSync(
  path.join(desktopSourceDirectory, "preload.ts"),
  "utf8"
);
const supervisorSource = readFileSync(
  path.join(desktopSourceDirectory, "supervisor.ts"),
  "utf8"
);
const boundedLocalUsageSmokeSource = readFileSync(
  path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "tests",
    "qwen-conversation-surface-bounded-local-usage.mjs"
  ),
  "utf8"
);
const extendedBoundedLocalUsageSmokeSource = readFileSync(
  path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "tests",
    "qwen-conversation-surface-extended-bounded-local-usage-confidence.mjs"
  ),
  "utf8"
);

describe("Command Router product mode desktop wiring", () => {
  it("exposes a default-off rules-only product mode bridge", () => {
    expect(preloadSource).toContain("getCommandRouterProductModeStatus");
    expect(preloadSource).toContain("setCommandRouterProductModeEnabled");
    expect(preloadSource).toContain("getQwenRuntimeControlStatus");
    expect(preloadSource).toContain("setQwenRuntimeControlAction");
    expect(preloadSource).toContain(
      "IPC_COMMAND_ROUTER_PRODUCT_MODE_STATUS_CHANNEL"
    );
    expect(preloadSource).toContain("IPC_COMMAND_ROUTER_PRODUCT_MODE_SET_CHANNEL");
    expect(preloadSource).toContain("IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL");
    expect(preloadSource).toContain("IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL");
    expect(settingsServiceSource).toContain(
      "private commandRouterProductModeEnabled = false"
    );
    expect(mainSource).toContain("let qwenRuntimeControlState:");
    expect(mainSource).toContain('| "active"');
    expect(mainSource).toContain('| "blocked" = "disabled"');
    expect(settingsServiceSource).toContain("getCommandRouterProductModeStatus");
    expect(settingsServiceSource).toContain("setCommandRouterProductModeEnabled");
    expect(settingsIpcSource).toContain("registerSettingsIpc");
    expect(mainSource).toContain("getQwenRuntimeControlStatus");
    expect(mainSource).toContain("setQwenRuntimeControlAction");
  });

  it("keeps command routing rules-only with no direct runtime expansion", () => {
    expect(settingsServiceSource).toContain(
      'providerId: "intent-router.deterministic.rules"'
    );
    expect(settingsServiceSource).toContain('mode: "production_rules"');
    expect(settingsServiceSource).not.toContain('mode: "fixture_only"');
    expect(settingsServiceSource).toContain("directActionEnabled: false");
    expect(settingsServiceSource).toContain("realQwenRuntimeEnabled: false");
    expect(settingsServiceSource).toContain("networkAccessApproved: false");
    expect(settingsServiceSource).toContain("chatAnswerFallbackPreserved: true");
    expect(settingsServiceSource).toContain('providerId: "intent-router.qwen3-0.6b"');
    expect(settingsServiceSource).toContain('mode: "no_runtime_status_only"');
    expect(settingsServiceSource).toContain("productRoutingEnabled: false");
    expect(settingsServiceSource).toContain("conversationSurfaceProductRoute");
    expect(settingsServiceSource).toContain(
      "qwen-conversation-surface.product-route.default-off.v1"
    );
    expect(settingsServiceSource).toContain("qwenRouteSelectable: false");
    expect(settingsServiceSource).toContain("productRouteExecutionEnabled: false");
    expect(settingsServiceSource).toContain("persistentOptIn");
    expect(settingsServiceSource).toContain(
      "qwen-conversation-surface.persistent-opt-in.default-off.v1"
    );
    expect(settingsServiceSource).toContain("localDeveloperOptInRequired: true");
    expect(settingsServiceSource).toContain("localDeveloperOptInEnabled: false");
    expect(settingsServiceSource).toContain("qwenRouteSelectableByDefault: false");
    expect(settingsServiceSource).toContain(
      "productRouteExecutionEnabledByDefault: false"
    );
    expect(settingsServiceSource).toContain("limitedProductSessionOnly: true");
    expect(settingsServiceSource).toContain("routeRequestLimit: 3");
    expect(settingsServiceSource).toContain("helperStartupAllowedByPolicyState: false");
    expect(settingsServiceSource).toContain(
      "generationPortInvocationAllowedByPolicyState: false"
    );
    expect(settingsServiceSource).toContain("realRuntimeEnabled: false");
    expect(settingsServiceSource).toContain("runtimeAccessed: false");
    expect(settingsServiceSource).toContain("artifactAccessed: false");
    expect(settingsServiceSource).toContain("persistentCacheChanged: false");
    expect(settingsServiceSource).toContain(
      "createCommandRouterQwenProductRoutingActivationStatus"
    );
    expect(settingsServiceSource).toContain("preparedPolicyReviewed: true");
    expect(settingsServiceSource).toContain("readinessEvidencePassed: true");
    expect(settingsServiceSource).toContain("deterministicRulesActive: true");
    expect(settingsServiceSource).toContain(
      "normalCoreHostStartupInstantiatesQwen: false"
    );
    expect(supervisorSource).toContain(
      'kind: "command-router-product-mode.configure"'
    );
    expect(supervisorSource).toContain('providerId: "intent-router.deterministic.rules"');
    expect(supervisorSource).toContain('mode: "production_rules"');
    expect(supervisorSource).not.toContain('mode: "fixture_only"');
    expect(supervisorSource).toContain("configureCommandRouterProductMode");
  });

  it("keeps Qwen UI/IPC runtime controls status-only inside the Desktop boundary", () => {
    expect(mainSource).toContain(
      'QWEN_RETAINED_SESSION_ID =\n  "qwen-retained-product-session-2026-08-10"'
    );
    expect(mainSource).toContain("retainedQwenSessionAvailable");
    expect(mainSource).not.toContain("@jarvis-k/core");
    expect(mainSource).not.toContain("@jarvis-k/inference-adapter-qwen-router");
    expect(mainSource).not.toContain(
      "@jarvis-k/inference-runtime-transformers-local"
    );
    expect(mainSource).not.toContain("RuntimeHelperProcessTransport");
    expect(mainSource).not.toContain("RuntimeHelperClient");
    expect(mainSource).not.toContain("QwenFastRouterProvider");
    expect(mainSource).not.toContain("CoreRuntime");
    expect(mainSource).not.toContain("QWEN_RUNTIME_CONTROL_ROUTE_REQUESTS");
    expect(mainSource).toContain("qwenRuntimeControlHelperStartCount");
    expect(mainSource).toContain(
      "qwenRuntimeControlGenerationPortReadinessProbeCount"
    );
    expect(mainSource).toContain("qwenRuntimeControlRouteRequestCount");
    expect(mainSource).toContain("qwenRuntimeControlHelperShutdownVerified");
    expect(mainSource).toContain('const helperLifecycle = active');
    expect(mainSource).toContain('? "running"');
    expect(mainSource).toContain('start: "blocked"');
    expect(mainSource).toContain(
      "Qwen runtime control is disabled in the Desktop product boundary."
    );
    expect(mainSource).toContain('activeRouteSource: active');
    expect(mainSource).toContain('"intent-router.qwen3-0.6b"');
    expect(mainSource).toContain('fallbackRouteSource: "intent-router.deterministic.rules"');
    expect(mainSource).toContain("qwenConversationSurfaceRouteLimit");
    expect(mainSource).toContain("routeRequestLimit: qwenConversationSurfaceRouteLimit()");
    expect(mainSource).toContain("directActionEnabled: false");
    expect(mainSource).toContain("browserUrlOpeningEnabled: false");
    expect(mainSource).toContain("vsCodeBlocked: true");
    expect(mainSource).toContain('allowlistTargets: ["notepad", "calculator"] as const');
    expect(mainSource).toContain("QwenRuntimeControlActionSchema.safeParse");
    expect(mainSource).toContain('parsedAction.data === "start"');
    expect(mainSource).toContain('parsedAction.data === "stop"');
    expect(mainSource).toContain('parsedAction.data === "rollback"');
    expect(mainSource).not.toContain(
      "JARVIS_K_QWEN_CONVERSATION_SURFACE_ACCEPTANCE"
    );
    expect(mainSource).toContain(
      "JARVIS_K_QWEN_CONVERSATION_SURFACE_EXTENDED_USAGE"
    );
    expect(mainSource).not.toContain("handleQwenConversationSurfaceBrainCommand");
    expect(mainSource).not.toContain(
      "qwenRuntimeControlRouteRequestCount >= qwenConversationSurfaceRouteLimit()"
    );
    expect(mainSource).not.toContain(
      'selection?.selectedProviderId !== "intent-router.qwen3-0.6b"'
    );
    expect(mainSource).not.toContain("spawnQwen");
  });

  it("anchors bounded local usage route assertions to the latest rendered intent", () => {
    expect(boundedLocalUsageSmokeSource).toContain("expectedSummaryPattern");
    expect(boundedLocalUsageSmokeSource).toContain(
      '[data-testid="brain-summary"]'
    );
    expect(boundedLocalUsageSmokeSource).toContain("window.waitForFunction");
    expect(boundedLocalUsageSmokeSource).toContain(
      "new RegExp(expectedSummarySource, expectedSummaryFlags).test(summary)"
    );
    expect(boundedLocalUsageSmokeSource).toContain("{ timeout: 30_000 }");
    expect(extendedBoundedLocalUsageSmokeSource).toContain(
      "JARVIS_K_QWEN_CONVERSATION_SURFACE_EXTENDED_USAGE"
    );
    expect(extendedBoundedLocalUsageSmokeSource).toContain(
      "mainConversationRouteRequestCount: routeResults.length"
    );
    expect(extendedBoundedLocalUsageSmokeSource).toContain(
      "/Route limit\\s+10/i"
    );
  });
});
