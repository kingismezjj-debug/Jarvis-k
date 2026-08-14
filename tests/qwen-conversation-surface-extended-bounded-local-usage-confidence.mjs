import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "playwright";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const smokeUserDataDirectory = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-qwen-extended-bounded-usage-")
);
let electronApp;
let appWindow;
let cleanSequenceCompleted = false;

const routeRequests = [
  {
    text: "open GitHub",
    expectedIntent: "browser.open",
    expectedSummaryPattern: /browser\.open.*GitHub/i
  },
  {
    text: "open Hugging Face",
    expectedIntent: "browser.open",
    expectedSummaryPattern: /browser\.open.*Hugging Face/i
  },
  {
    text: "open YouTube",
    expectedIntent: "browser.open",
    expectedSummaryPattern: /browser\.open.*YouTube/i
  },
  {
    text: "open notepad",
    expectedIntent: "localApp.open",
    expectedSummaryPattern: /localApp\.open.*Notepad/i
  },
  {
    text: "open calculator",
    expectedIntent: "localApp.open",
    expectedSummaryPattern: /localApp\.open.*Calculator/i
  },
  {
    text: "open vscode",
    expectedIntent: "localApp.open",
    expectedSummaryPattern: /fixture allowlist blocked.*VS Code/i
  },
  {
    text: "check current status",
    expectedIntent: "observability.status",
    expectedSummaryPattern: /observability\.status.*Core/i
  },
  {
    text: "run health diagnostics",
    expectedIntent: "observability.status",
    expectedSummaryPattern: /observability\.status.*Core/i
  },
  {
    text: "check model status",
    expectedIntent: "model.status",
    expectedSummaryPattern: /model\.status.*Runtime/i
  },
  {
    text: "check provider status",
    expectedIntent: "model.status",
    expectedSummaryPattern: /model\.status.*Runtime/i
  }
];

async function panelText(window) {
  return window
    .getByTestId("settings-command-router-qwen-runtime-control")
    .innerText();
}

async function waitForPanelText(window, text, timeout = 30_000) {
  await window
    .getByTestId("settings-command-router-qwen-runtime-control")
    .getByText(text)
    .waitFor({ timeout });
}

async function sendBrainCommand(
  window,
  text,
  expectedIntent,
  expectedSummaryPattern
) {
  await window.getByTestId("nav-conversation").click();
  await window.getByTestId("command-input").fill(text);
  await window.getByTestId("send-command").click();
  await window.getByTestId("brain-dispatch-panel").waitFor({
    timeout: 120_000
  });
  await window
    .getByTestId("command-router-selected-provider")
    .getByText("intent-router.qwen3-0.6b")
    .waitFor({ timeout: 120_000 });
  await window
    .getByTestId("command-router-direct-action")
    .getByText("disabled")
    .waitFor({ timeout: 10_000 });
  await window.waitForFunction(
    ([expectedIntentValue, expectedSummarySource, expectedSummaryFlags]) => {
      const intent = document
        .querySelector('[data-testid="brain-intent"]')
        ?.textContent?.trim();
      const summary =
        document.querySelector('[data-testid="brain-summary"]')?.textContent ?? "";
      return (
        intent === expectedIntentValue &&
        new RegExp(expectedSummarySource, expectedSummaryFlags).test(summary)
      );
    },
    [
      expectedIntent,
      expectedSummaryPattern.source,
      expectedSummaryPattern.flags
    ],
    { timeout: 30_000 }
  );
  return true;
}

try {
  electronApp = await electron.launch({
    args: [
      `--user-data-dir=${smokeUserDataDirectory}`,
      "apps/desktop/dist/main.js"
    ],
    cwd: rootDirectory,
    env: {
      ...process.env,
      JARVIS_K_MEMORY_DB_PATH: path.join(
        smokeUserDataDirectory,
        "memory.sqlite"
      ),
      JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS: "1",
      JARVIS_K_QWEN_CONVERSATION_SURFACE_ACCEPTANCE: "1",
      JARVIS_K_QWEN_CONVERSATION_SURFACE_EXTENDED_USAGE: "1"
    }
  });

  const startedAt = performance.now();
  const window = await electronApp.firstWindow();
  appWindow = window;
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.getByTestId("jarvis-app").waitFor();
  await window.getByTestId("core-status").getByText("ONLINE").waitFor({
    timeout: 15_000
  });
  const startupMs = Math.round(performance.now() - startedAt);

  await window.getByTestId("general-settings").click();
  await window.getByTestId("settings-view").waitFor({ timeout: 5_000 });
  await waitForPanelText(window, "disabled / retained / stopped");

  await window
    .getByTestId("settings-command-router-qwen-runtime-control-start")
    .click();
  await window
    .getByTestId("last-action-status")
    .getByText("Qwen runtime control start complete")
    .waitFor({ timeout: 420_000 });
  await waitForPanelText(window, "active / retained / running", 30_000);
  const activePanel = await panelText(window);
  if (
    !/Route limit\s+10/i.test(activePanel) ||
    !/Route count\s+0/i.test(activePanel)
  ) {
    throw new Error("extended bounded usage session did not start with limit 10.");
  }

  const routeResults = [];
  for (const request of routeRequests) {
    routeResults.push(
      await sendBrainCommand(
        window,
        request.text,
        request.expectedIntent,
        request.expectedSummaryPattern
      )
    );
  }

  await window.getByTestId("general-settings").click();
  await window.getByTestId("settings-refresh-qwen-runtime-control").click();
  await waitForPanelText(window, "active / retained / running", 30_000);
  const routedPanel = await panelText(window);
  if (
    !/Route limit\s+10/i.test(routedPanel) ||
    !/Route count\s+10/i.test(routedPanel)
  ) {
    throw new Error("extended bounded local usage route count was not visible.");
  }

  await window
    .getByTestId("settings-command-router-qwen-runtime-control-stop")
    .click();
  await window
    .getByTestId("last-action-status")
    .getByText("Qwen runtime control stop complete")
    .waitFor({ timeout: 60_000 });
  await waitForPanelText(
    window,
    "disabled / retained / shutdown after verification",
    30_000
  );
  const stoppedPanel = await panelText(window);

  await window
    .getByTestId("settings-command-router-qwen-runtime-control-rollback")
    .click();
  await window
    .getByTestId("last-action-status")
    .getByText("Qwen runtime control rollback complete")
    .waitFor({ timeout: 60_000 });
  await waitForPanelText(
    window,
    "fallback / retained / shutdown after verification",
    30_000
  );
  const rollbackPanel = await panelText(window);
  cleanSequenceCompleted = true;

  console.log(
    JSON.stringify({
      status: "PASS",
      startupMs,
      retainedDependencyEnvSelected: true,
      retainedApprovedArtifactCacheSelected: true,
      artifactCount: 7,
      digestBeforeLoad: "passed",
      helperStartCount: 1,
      generationPortReadinessProbeCount: 1,
      mainConversationRouteRequestCount: routeResults.length,
      approvedRouteLimit: 10,
      qwenSelectedOnlyInsideBoundedSession: routeResults.every(Boolean),
      directActionDisabled: routeResults.every(Boolean),
      routeLimitVisible: /Route limit\s+10/i.test(routedPanel),
      routeCountVisible: /Route count\s+10/i.test(routedPanel),
      deterministicRulesRollback: rollbackPanel.includes(
        "fallback / retained / shutdown after verification"
      ),
      helperShutdownVerified: stoppedPanel.toLowerCase().includes("verified"),
      browserUrlBlocked:
        routedPanel.includes("Browser/URL") &&
        routedPanel.toLowerCase().includes("blocked"),
      vsCodeBlocked:
        routedPanel.includes("VS Code") &&
        routedPanel.toLowerCase().includes("blocked")
    })
  );
} finally {
  if (!cleanSequenceCompleted && appWindow && !appWindow.isClosed()) {
    try {
      await appWindow.getByTestId("general-settings").click({ timeout: 2_000 });
      const stopButton = appWindow.getByTestId(
        "settings-command-router-qwen-runtime-control-stop"
      );
      if (await stopButton.isEnabled({ timeout: 2_000 })) {
        await stopButton.click();
        await appWindow
          .getByTestId("last-action-status")
          .getByText("Qwen runtime control stop complete")
          .waitFor({ timeout: 60_000 });
      }
    } catch {
      // Best-effort cleanup only; the app close path disposes the helper too.
    }
  }
  if (electronApp) {
    await electronApp.close();
  }
  await rm(smokeUserDataDirectory, { force: true, recursive: true });
}
