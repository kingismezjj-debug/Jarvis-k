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
  it("exposes a default-off fixture-only product mode bridge", () => {
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
    expect(mainSource).toContain("let commandRouterProductModeEnabled = false");
    expect(mainSource).toContain("let qwenRuntimeControlState:");
    expect(mainSource).toContain('| "active"');
    expect(mainSource).toContain('| "blocked" = "disabled"');
    expect(mainSource).toContain("getCommandRouterProductModeStatus");
    expect(mainSource).toContain("setCommandRouterProductModeEnabled");
    expect(mainSource).toContain("getQwenRuntimeControlStatus");
    expect(mainSource).toContain("setQwenRuntimeControlAction");
  });

  it("keeps command routing fixture-only with no direct runtime expansion", () => {
    expect(mainSource).toContain('providerId: "intent-router.deterministic.fixture"');
    expect(mainSource).toContain('mode: "fixture_only"');
    expect(mainSource).toContain("directActionEnabled: false");
    expect(mainSource).toContain("realQwenRuntimeEnabled: false");
    expect(mainSource).toContain("networkAccessApproved: false");
    expect(mainSource).toContain("chatAnswerFallbackPreserved: true");
    expect(mainSource).toContain('providerId: "intent-router.qwen3-0.6b"');
    expect(mainSource).toContain('mode: "no_runtime_status_only"');
    expect(mainSource).toContain("productRoutingEnabled: false");
    expect(mainSource).toContain("conversationSurfaceProductRoute");
    expect(mainSource).toContain(
      "qwen-conversation-surface.product-route.default-off.v1"
    );
    expect(mainSource).toContain("qwenRouteSelectable: false");
    expect(mainSource).toContain("productRouteExecutionEnabled: false");
    expect(mainSource).toContain("persistentOptIn");
    expect(mainSource).toContain(
      "qwen-conversation-surface.persistent-opt-in.default-off.v1"
    );
    expect(mainSource).toContain("localDeveloperOptInRequired: true");
    expect(mainSource).toContain("localDeveloperOptInEnabled: false");
    expect(mainSource).toContain("qwenRouteSelectableByDefault: false");
    expect(mainSource).toContain(
      "productRouteExecutionEnabledByDefault: false"
    );
    expect(mainSource).toContain("limitedProductSessionOnly: true");
    expect(mainSource).toContain("routeRequestLimit: 3");
    expect(mainSource).toContain("helperStartupAllowedByPolicyState: false");
    expect(mainSource).toContain(
      "generationPortInvocationAllowedByPolicyState: false"
    );
    expect(mainSource).toContain("realRuntimeEnabled: false");
    expect(mainSource).toContain("runtimeAccessed: false");
    expect(mainSource).toContain("artifactAccessed: false");
    expect(mainSource).toContain("persistentCacheChanged: false");
    expect(mainSource).toContain(
      "createCommandRouterQwenProductRoutingActivationStatus"
    );
    expect(mainSource).toContain("preparedPolicyReviewed: true");
    expect(mainSource).toContain("readinessEvidencePassed: true");
    expect(mainSource).toContain("deterministicFixtureActive: true");
    expect(mainSource).toContain("normalCoreHostStartupInstantiatesQwen: false");
    expect(supervisorSource).toContain(
      'kind: "command-router-product-mode.configure"'
    );
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
    expect(mainSource).toContain('fallbackRouteSource: "intent-router.deterministic.fixture"');
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
